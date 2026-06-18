import { db } from '../../lib/db'
import type { Case, PhysicalMark } from '../../utils/types'

export async function addCase(data: Partial<Case>): Promise<number> {
  const now = new Date().toISOString()
  return db.cases.add({
    ...data,
    status: data.status ?? 'active',
    syncStatus: 'pending',
    dateCreated: now,
    dateModified: now,
  } as Case)
}

export async function updateCase(id: number, data: Partial<Case>): Promise<void> {
  await db.cases.update(id, { ...data, dateModified: new Date().toISOString(), syncStatus: 'pending' })
}

export async function deleteCase(id: number): Promise<void> {
  await db.cases.delete(id)
  await db.physicalMarks.where('caseId').equals(id).delete()
}

export async function getCase(id: number): Promise<Case | undefined> {
  return db.cases.get(id)
}

export async function getAllCases(): Promise<Case[]> {
  return db.cases.reverse().sortBy('dateCreated')
}

export async function addMark(data: Partial<PhysicalMark>): Promise<number> {
  return db.physicalMarks.add({
    ...data,
    syncStatus: 'pending',
    dateCreated: new Date().toISOString(),
  } as PhysicalMark)
}

export async function deleteMark(id: number): Promise<void> {
  await db.physicalMarks.delete(id)
}

export async function getMarksForCase(caseId: number): Promise<PhysicalMark[]> {
  return db.physicalMarks.where('caseId').equals(caseId).toArray()
}

export async function getPendingCases(): Promise<Case[]> {
  return db.cases.where('syncStatus').equals('pending').toArray()
}

export async function getPendingMarks(): Promise<PhysicalMark[]> {
  return db.physicalMarks.where('syncStatus').equals('pending').toArray()
}

export async function markSynced(table: 'cases' | 'marks', id: number, supabaseId: number): Promise<void> {
  const store = table === 'cases' ? db.cases : db.physicalMarks
  await store.update(id, { syncStatus: 'synced', supabaseId })
}

export async function markFailed(table: 'cases' | 'marks', ids: number[]): Promise<void> {
  const store = table === 'cases' ? db.cases : db.physicalMarks
  await store.where('id').anyOf(ids).modify({ syncStatus: 'failed' })
}

export async function countPending(): Promise<{ cases: number; marks: number }> {
  const [caseCount, markCount] = await Promise.all([
    db.cases.where('syncStatus').equals('pending').count(),
    db.physicalMarks.where('syncStatus').equals('pending').count(),
  ])
  return { cases: caseCount, marks: markCount }
}
