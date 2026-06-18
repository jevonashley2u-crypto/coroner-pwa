import { create } from 'zustand';
import { db } from '../lib/db';
import type { Case } from '../lib/db';

interface CaseStore {
  cases: Case[];
  filteredCases: Case[];
  isLoading: boolean;
  searchTerm: string;

  loadCases: () => Promise<void>;
  addCase: (newCase: Omit<Case, 'id' | 'updatedAt'>) => Promise<void>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  setSearchTerm: (term: string) => void;
}

export const useCaseStore = create<CaseStore>((set, get) => ({
  cases: [],
  filteredCases: [],
  isLoading: false,
  searchTerm: '',

  loadCases: async () => {
    set({ isLoading: true });
    const cases = await db.cases.toArray();
    set({ cases, filteredCases: cases, isLoading: false });
  },

  setSearchTerm: (term) => {
    const lowerTerm = term.toLowerCase();
    const filtered = get().cases.filter((c) =>
      c.decedentName.toLowerCase().includes(lowerTerm) ||
      c.caseNumber.toLowerCase().includes(lowerTerm) ||
      (c.causeOfDeath && c.causeOfDeath.toLowerCase().includes(lowerTerm))
    );
    set({ searchTerm: term, filteredCases: filtered });
  },

  addCase: async (newCase) => {
    const caseToAdd: Case = {
      ...newCase,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    await db.cases.add(caseToAdd);
    const updatedCases = [...get().cases, caseToAdd];
    set({ cases: updatedCases });
    get().setSearchTerm(get().searchTerm);
  },

  updateCase: async (id, updates) => {
    const updatedCase = { ...updates, updatedAt: new Date().toISOString() };
    await db.cases.update(id, updatedCase);
    const updatedCases = get().cases.map((c) =>
      c.id === id ? { ...c, ...updatedCase } : c
    );
    set({ cases: updatedCases });
    get().setSearchTerm(get().searchTerm);
  },

  deleteCase: async (id) => {
    await db.cases.delete(id);
    const updatedCases = get().cases.filter((c) => c.id !== id);
    set({ cases: updatedCases });
    get().setSearchTerm(get().searchTerm);
  },
}));
