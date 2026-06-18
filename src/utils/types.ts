export interface Case {
  id: string
  caseNumber: string
  decedentName: string
  causeOfDeath?: string
  address?: string
  latitude?: number
  longitude?: number
  ambientTemperature?: number
  bodyTemperature?: number
  temperatureUnit?: string
  weatherConditions?: string
  investigatingOfficer?: string
  notes?: string
  images?: string[]
  status: 'open' | 'closed'
  syncStatus: 'pending' | 'synced'
  dateOfDeath?: string
  updatedAt: string
  dateCreated: string
}

export interface PhysicalMark {
  id?: number
  caseId: string
  type: string
  description?: string | null
  bodyLocation?: string | null
  sizeMm?: string | null
  color?: string | null
  shape?: string | null
  notes?: string | null
  syncStatus: 'pending' | 'synced'
  dateCreated: string
}
