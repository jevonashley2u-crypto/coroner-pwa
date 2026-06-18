import Dexie, { type EntityTable } from 'dexie'

export interface DeviceLookup {
  brandName: string
  companyName: string
  deviceDescription: string
  modelNumber: string | null
  catalogNumber: string | null
  mriSafety: string | null
  identifiers: string[]
  productCode: string | null
  productCodeName: string | null
  searchedAt: string
}

export interface Case {
  id: number
  caseNumber: string
  status: 'active' | 'closed' | 'pending'
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
  temperatureUnit: 'C' | 'F'
  weatherConditions: string | null

  investigatingOfficer: string | null
  preliminaryCause: string | null
  notes: string | null
  images: string[]

  medicalDevices: DeviceLookup[]

  /* sync fields */
  syncStatus: 'pending' | 'synced' | 'failed'
  supabaseId: number | null
}

export interface PhysicalMark {
  id: number
  caseId: number
  type: 'tattoo' | 'scar' | 'birthmark' | 'fracture' | 'burn' | 'other'
  description: string
  bodyLocation: string
  sizeMm: string | null
  color: string | null
  shape: string | null
  orientation: string | null
  imageBase64: string | null
  notes: string | null
  dateCreated: string

  /* sync fields */
  syncStatus: 'pending' | 'synced' | 'failed'
  supabaseId: number | null
}

export const db = new Dexie('CoronerSceneDb') as Dexie & {
  cases: EntityTable<Case, 'id'>
  physicalMarks: EntityTable<PhysicalMark, 'id'>
}

db.version(1).stores({
  cases: '++id, caseNumber, status, dateCreated, dateModified',
  physicalMarks: '++id, caseId, type, bodyLocation',
})

db.version(2).stores({
  cases: '++id, caseNumber, status, dateCreated, dateModified, decedentName',
  physicalMarks: '++id, caseId, type, bodyLocation, dateCreated',
})

db.version(3).stores({
  cases: '++id, caseNumber, status, dateCreated, dateModified, decedentName, syncStatus',
  physicalMarks: '++id, caseId, type, bodyLocation, dateCreated, syncStatus',
})
