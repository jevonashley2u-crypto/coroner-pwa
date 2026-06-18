import { db } from '../../lib/db'

function match(val: unknown, q: string): boolean {
  return String(val ?? '').toLowerCase().includes(q)
}

export async function searchCases(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return db.cases.reverse().sortBy('dateCreated')
  const all = await db.cases.toArray()
  return all
    .filter(c => match(c.caseNumber, q) || match(c.decedentName, q) || match(c.address, q) || match(c.investigatingOfficer, q) || match(c.notes, q))
    .sort((a, b) => String(b.dateCreated).localeCompare(String(a.dateCreated)))
}

export async function searchMarks(caseId: number, query: string) {
  const q = query.trim().toLowerCase()
  const marks = await db.physicalMarks.where('caseId').equals(caseId).toArray()
  if (!q) return marks
  return marks.filter(m => match(m.type, q) || match(m.description, q) || match(m.bodyLocation, q))
}
