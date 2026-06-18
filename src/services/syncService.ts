import { db } from '../db/db'
import { authService } from './authService'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SyncEventCallback = (status: SyncStatus) => void

export interface SyncStatus {
  syncing: boolean
  lastSync: Date | null
  lastError: string | null
  pendingCases: number
  pendingMarks: number
}

/* ------------------------------------------------------------------ */
/*  Payload helpers                                                    */
/* ------------------------------------------------------------------ */

function caseToPayload(c: {
  id: number
  caseNumber: string
  status: string
  dateCreated: string
  dateModified: string
  decedentName: string
  decedentDOB: string | null
  decedentGender: string | null
  decedentRace: string | null
  address: string
  latitude: number | null
  longitude: number | null
  discoveryTimestamp: string | null
  arrivalTimestamp: string | null
  ambientTemperature: number | null
  bodyTemperature: number | null
  temperatureUnit: string
  weatherConditions: string | null
  investigatingOfficer: string | null
  preliminaryCause: string | null
  notes: string | null
  images: string[]
  medicalDevices: { brandName: string; companyName: string; deviceDescription: string; modelNumber: string | null; catalogNumber: string | null; mriSafety: string | null; identifiers: string[]; productCode: string | null; productCodeName: string | null; searchedAt: string }[]
}) {
  return {
    case_number: c.caseNumber,
    status: c.status,
    date_created: c.dateCreated,
    date_modified: c.dateModified,
    decedent_name: c.decedentName,
    decedent_dob: c.decedentDOB,
    decedent_gender: c.decedentGender,
    decedent_race: c.decedentRace,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
    discovery_timestamp: c.discoveryTimestamp,
    arrival_timestamp: c.arrivalTimestamp,
    ambient_temperature: c.ambientTemperature,
    body_temperature: c.bodyTemperature,
    temperature_unit: c.temperatureUnit,
    weather_conditions: c.weatherConditions,
    investigating_officer: c.investigatingOfficer,
    preliminary_cause: c.preliminaryCause,
    notes: c.notes,
    images: c.images,
    medical_devices: c.medicalDevices,
  }
}

function markToPayload(
  m: {
    id: number
    caseId: number
    type: string
    description: string
    bodyLocation: string
    sizeMm: string | null
    color: string | null
    shape: string | null
    orientation: string | null
    imageBase64: string | null
    notes: string | null
    dateCreated: string
  },
  remoteCaseId: number,
) {
  return {
    case_id: remoteCaseId,
    mark_type: m.type,
    description: m.description,
    body_location: m.bodyLocation,
    size_mm: m.sizeMm,
    color: m.color,
    shape: m.shape,
    orientation: m.orientation,
    image_base64: m.imageBase64,
    notes: m.notes,
    date_created: m.dateCreated,
  }
}

/* ------------------------------------------------------------------ */
/*  Sync Service                                                       */
/* ------------------------------------------------------------------ */

class SyncService {
  private online: boolean
  private running = false
  private listeners: Set<SyncEventCallback> = new Set()
  private timerId: ReturnType<typeof setInterval> | null = null

  status: SyncStatus = {
    syncing: false,
    lastSync: null,
    lastError: null,
    pendingCases: 0,
    pendingMarks: 0,
  }

  constructor() {
    this.online = navigator.onLine
    this.handleOnline = this.handleOnline.bind(this)
    this.handleOffline = this.handleOffline.bind(this)
  }

  /* ---- lifecycle ---- */

  start() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    /* periodic poll every 60 s */
    this.timerId = setInterval(() => this.sync(), 60_000)

    /* fire immediately if online */
    if (this.online) {
      this.sync()
    }

    this.refreshPendingCounts()
  }

  stop() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  /* ---- eventing ---- */

  subscribe(cb: SyncEventCallback) {
    this.listeners.add(cb)
    return () => { this.listeners.delete(cb) }
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.status }))
  }

  /* ---- network ---- */

  private handleOnline() {
    this.online = true
    this.sync()
  }

  private handleOffline() {
    this.online = false
  }

  /* ---- pending counts ---- */

  async refreshPendingCounts() {
    const pendingCases = await db.cases.where('syncStatus').equals('pending').count()
    const pendingMarks = await db.physicalMarks.where('syncStatus').equals('pending').count()
    this.status.pendingCases = pendingCases
    this.status.pendingMarks = pendingMarks
    this.notify()
  }

  /* ---- core sync ---- */

  async sync() {
    if (this.running || !this.online) return
    if (!authService.client) return
    if (!authService.isAuthenticated) {
      this.status.lastError = 'Not signed in'
      this.notify()
      return
    }

    this.running = true
    this.status.syncing = true
    this.notify()

    try {
      await this.syncCases()
      await this.syncMarks()
      this.status.lastSync = new Date()
      this.status.lastError = null
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown sync error'
      this.status.lastError = msg
      console.error('[SyncService]', msg)
    } finally {
      this.running = false
      this.status.syncing = false
      await this.refreshPendingCounts()
      this.notify()
    }
  }

  /* ---- sync cases (parents first) ---- */

  private async syncCases() {
    const pending = await db.cases
      .where('syncStatus')
      .equals('pending')
      .limit(50)
      .toArray()

    if (pending.length === 0) return

    const sb = authService.client!
    const { data, error } = await sb
      .from('cases')
      .insert(pending.map(caseToPayload))
      .select('id, case_number')

    if (error) {
      /* transaction failure — mark all as failed */
      await db.cases
        .where('id')
        .anyOf(pending.map(c => c.id))
        .modify({ syncStatus: 'failed' })
      throw error
    }

    /* map returned ids */
    for (let i = 0; i < data.length; i++) {
      const local = pending[i]
      await db.cases.update(local.id, {
        supabaseId: data[i].id,
        syncStatus: 'synced',
      })
    }
  }

  /* ---- sync marks (children, must reference remote case_id) ---- */

  private async syncMarks() {
    const pending = await db.physicalMarks
      .where('syncStatus')
      .equals('pending')
      .limit(100)
      .toArray()

    if (pending.length === 0) return

    const payloads: Record<string, unknown>[] = []
    const localIds: number[] = []

    for (const m of pending) {
      const parent = await db.cases.get(m.caseId)
      /* fallback: local id if supabaseId is null */
      const remoteCaseId = parent?.supabaseId ?? m.caseId
      payloads.push(markToPayload(m, remoteCaseId))
      localIds.push(m.id)
    }

    const sb = authService.client!
    const { data, error } = await sb
      .from('tattoos_scars')
      .insert(payloads)
      .select('id')

    if (error) {
      await db.physicalMarks
        .where('id')
        .anyOf(localIds)
        .modify({ syncStatus: 'failed' })
      throw error
    }

    for (let i = 0; i < data.length; i++) {
      await db.physicalMarks.update(localIds[i], {
        supabaseId: data[i].id,
        syncStatus: 'synced',
      })
    }
  }
}

export const syncService = new SyncService()
