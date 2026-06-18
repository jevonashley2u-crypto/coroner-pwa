import Dexie, { type Table } from 'dexie'
import type { Case, PhysicalMark } from '../utils/types'

export type { Case, PhysicalMark }

class AppDatabase extends Dexie {
  cases!: Table<Case, string>
  physicalMarks!: Table<PhysicalMark, number>

  constructor() {
    super('CoronerFieldIntake')
    this.version(1).stores({
      cases: 'id, caseNumber, decedentName, syncStatus, dateCreated, updatedAt',
      physicalMarks: '++id, caseId, type, syncStatus, dateCreated',
    })
  }
}

export const db = new AppDatabase()
