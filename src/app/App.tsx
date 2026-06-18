import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { subscribe, startAutoSync, stopAutoSync } from '../features/cases/syncService'
import { countPending } from '../features/cases/caseService'
import Router from './router'
import type { SyncState } from '../features/cases/syncService'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isList = location.pathname === '/cases' || location.pathname.startsWith('/cases/')
  const [online, setOnline] = useState(navigator.onLine)
  const [sync, setSync] = useState<SyncState>({ syncing: false, error: null, pendingCases: 0, pendingMarks: 0 })

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  useEffect(() => {
    startAutoSync()
    countPending().then(c => setSync(prev => ({ ...prev, pendingCases: c.cases, pendingMarks: c.marks })))
    const unsub = subscribe(setSync)
    return () => { unsub(); stopAutoSync() }
  }, [])

  const pending = sync.pendingCases + sync.pendingMarks

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-[52px]">
          <span className="font-bold text-[15px]">Field Intake</span>
          <div className="flex gap-1">
            <button onClick={() => navigate('/intake')}
              className={`px-3 py-2 rounded-lg text-[13px] font-semibold min-h-[44px] ${!isList ? 'bg-[var(--border)] text-[var(--text)]' : 'text-[var(--muted)]'}`}>
              New
            </button>
            <button onClick={() => navigate('/cases')}
              className={`px-3 py-2 rounded-lg text-[13px] font-semibold min-h-[44px] ${isList ? 'bg-[var(--border)] text-[var(--text)]' : 'text-[var(--muted)]'}`}>
              Cases
            </button>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 px-4 py-1.5 text-[11px] text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">
        <span className={`w-1.5 h-1.5 rounded-full ${
          sync.syncing ? 'bg-[var(--accent)] animate-pulse' :
          sync.error ? 'bg-[var(--danger)]' :
          pending > 0 ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
        }`} />
        {sync.syncing ? 'Syncing…' : sync.error ? 'Sync error' : pending > 0 ? `${pending} pending` : 'All synced'}
      </div>

      {!online && (
        <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold bg-[var(--danger)] text-white">
          Offline — data saved locally
        </div>
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4">
        <Router />
      </main>
    </div>
  )
}
