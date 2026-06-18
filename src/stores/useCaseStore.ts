import { create } from 'zustand'
import type { Case } from '../utils/types'

interface CaseStore {
  editId: number | null
  cases: Case[]
  setEditId: (id: number | null) => void
  setCases: (cases: Case[]) => void
}

export const useCaseStore = create<CaseStore>(set => ({
  editId: null,
  cases: [],
  setEditId: id => set({ editId: id }),
  setCases: cases => set({ cases }),
}))
