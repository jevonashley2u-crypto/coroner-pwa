import Dexie, { type Table } from 'dexie'
import type { Case, PhysicalMark } from '../utils/types'

class AppDatabase extends Dexie {
  cases!: Table<Case, number>
  physicalMarks!: Table<PhysicalMark, number>

  constructor() {
    super('CoronerFieldIntake')
    this.version(1).stores({
      cases: '++id, caseNumber, status, syncStatus, dateCreated, dateModified',
      physicalMarks: '++id, caseId, type, syncStatus, dateCreated',
    })
  }
}

export const db = new AppDatabase()
