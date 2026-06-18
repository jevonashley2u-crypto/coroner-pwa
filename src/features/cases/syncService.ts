import { supabase } from '../../lib/supabase'
import { getPendingCases, getPendingMarks, markSynced, markFailed, countPending } from './caseService'
import type { Case, PhysicalMark } from '../../utils/types'

type Listener = (status: SyncState) => void

export interface SyncState {
  syncing: boolean
  error: string | null
  pendingCases: number
  pendingMarks: number
}

let listeners: Listener[] = []
let running = false
let timer: ReturnType<typeof setInterval> | null = null

function notify(state: Partial<SyncState>) {
  listeners.forEach(fn => fn(state as SyncState))
}

function casePayload(c: Case) {
  return {
    case_number: c.caseNumber,
    status: c.status,
    date_created: c.dateCreated,
    date_modified: c.dateModified,
    decedent_name: c.decedentName ?? null,
    address: c.address ?? null,
    latitude: c.latitude ?? null,
    longitude: c.longitude ?? null,
    ambient_temperature: c.ambientTemperature ?? null,
    body_temperature: c.bodyTemperature ?? null,
    temperature_unit: c.temperatureUnit ?? 'C',
    weather_conditions: c.weatherConditions ?? null,
    investigating_officer: c.investigatingOfficer ?? null,
    notes: c.notes ?? null,
    images: c.images ?? [],
    medical_devices: c.medicalDevices ?? [],
  }
}

function markPayload(m: PhysicalMark) {
  return {
    case_id: m.caseId,
    mark_type: m.type,
    description: m.description ?? null,
    body_location: m.bodyLocation ?? null,
    size_mm: m.sizeMm ?? null,
    color: m.color ?? null,
    shape: m.shape ?? null,
    orientation: m.orientation ?? null,
    image_base64: m.imageBase64 ?? null,
    notes: m.notes ?? null,
    date_created: m.dateCreated,
  }
}

async function pushCases() {
  const pending = await getPendingCases()
  if (!pending.length) return
  const sb = supabase()
  const { data, error } = await sb.from('cases').insert(pending.map(casePayload)).select('id, case_number')
  if (error) { await markFailed('cases', pending.map(c => c.id!)); throw error }
  for (let i = 0; i < data.length; i++) await markSynced('cases', pending[i].id!, data[i].id)
}

async function pushMarks() {
  const pending = await getPendingMarks()
  if (!pending.length) return
  const sb = supabase()
  const { data, error } = await sb.from('physical_marks').insert(pending.map(markPayload)).select('id')
  if (error) { await markFailed('marks', pending.map(m => m.id!)); throw error }
  for (let i = 0; i < data.length; i++) await markSynced('marks', pending[i].id!, data[i].id)
}

export async function syncNow() {
  if (running) return
  running = true
  notify({ syncing: true, error: null })
  try {
    await pushCases()
    await pushMarks()
    notify({ syncing: false, error: null })
  } catch (err) {
    notify({ syncing: false, error: err instanceof Error ? err.message : 'Sync failed' })
  } finally {
    running = false
    const c = await countPending()
    notify({ pendingCases: c.cases, pendingMarks: c.marks })
  }
}

export function subscribe(fn: Listener) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

export function startAutoSync(intervalMs = 30000) {
  syncNow()
  timer = setInterval(syncNow, intervalMs)
  window.addEventListener('online', syncNow)
}

export function stopAutoSync() {
  if (timer) { clearInterval(timer); timer = null }
  window.removeEventListener('online', syncNow)
}
