export interface Case {
  id?: number
  supabaseId?: number | null
  caseNumber: string
  status: 'active' | 'closed' | 'pending'
  syncStatus: 'pending' | 'synced' | 'failed'
  dateCreated: string
  dateModified: string
  decedentName?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  ambientTemperature?: number | null
  bodyTemperature?: number | null
  temperatureUnit?: string
  weatherConditions?: string | null
  investigatingOfficer?: string | null
  notes?: string | null
  images?: string[]
  medicalDevices?: unknown[]
}

export interface PhysicalMark {
  id?: number
  supabaseId?: number | null
  caseId: number
  type: string
  description?: string | null
  bodyLocation?: string | null
  sizeMm?: string | null
  color?: string | null
  shape?: string | null
  orientation?: string | null
  imageBase64?: string | null
  notes?: string | null
  syncStatus: 'pending' | 'synced' | 'failed'
  dateCreated: string
}

export interface SyncStatus {
  syncing: boolean
  error: string | null
  pendingCases: number
  pendingMarks: number
}
