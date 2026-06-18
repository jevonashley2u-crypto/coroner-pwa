import { useEffect, useState } from 'react'
import SceneIntakeMode from './components/SceneIntakeMode'
import IOSInstallPrompt from './components/IOSInstallPrompt'
import AuthScreen from './components/AuthScreen'
import PhysicalMarksPanel from './components/PhysicalMarksPanel'
import { db, type Case } from './db/db'
import { syncService, type SyncStatus } from './services/syncService'
import { authService } from './services/authService'

function CaseCard({ c, onEdit, onDelete, onStatusChange }: { c: Case; onEdit: () => void; onDelete: () => void; onStatusChange: (status: Case['status']) => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors">
      <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[16px] font-bold">{c.caseNumber}</div>
            <div className="mt-0.5 text-sm text-[var(--color-text-muted)]">{c.decedentName}</div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                c.syncStatus === 'synced'
                  ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                  : c.syncStatus === 'failed'
                    ? 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
                    : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
              }`}
            >
              {c.syncStatus}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                c.status === 'active'
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)]'
              }`}
            >
              {c.status}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-1 border-t border-[var(--color-border)] pt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            <div>📍 {c.address}</div>
            {c.latitude && <div>🌐 {c.latitude.toFixed(5)}, {c.longitude?.toFixed(5)}</div>}
            {c.ambientTemperature !== null && (
              <div>🌡️ Ambient {c.ambientTemperature}°{c.temperatureUnit} / Body {c.bodyTemperature}°{c.temperatureUnit}</div>
            )}
            {c.weatherConditions && <div>☁️ {c.weatherConditions}</div>}
            {c.investigatingOfficer && <div>👤 {c.investigatingOfficer}</div>}
            {c.notes && <div className="mt-1 italic">📝 {c.notes}</div>}
            {c.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.images.map((img, i) => (
                  <img key={i} src={img} alt={`Case photo ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                ))}
              </div>
            )}
            <div className="mt-2 text-xs text-[var(--color-border)]">
              Created: {new Date(c.dateCreated).toLocaleString()}
            </div>

            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <PhysicalMarksPanel caseId={c.id!} />
            </div>

            {c.medicalDevices && c.medicalDevices.length > 0 && (
              <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                <span className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Medical Devices ({c.medicalDevices.length})
                </span>
                <div className="flex flex-col gap-1.5">
                  {c.medicalDevices.map((d, i) => (
                    <div key={i} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
                      <div className="font-semibold text-white">{d.brandName}</div>
                      <div>{d.companyName}</div>
                      <div className="text-[13px]">{d.deviceDescription}</div>
                      {(d.modelNumber || d.catalogNumber) && (
                        <div className="text-[12px]">
                          {d.modelNumber && <span>Model: {d.modelNumber}</span>}
                          {d.modelNumber && d.catalogNumber && <span> · </span>}
                          {d.catalogNumber && <span>Catalog: {d.catalogNumber}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 rounded-xl bg-[var(--color-accent)] py-3 text-[15px] font-semibold text-white"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 rounded-xl bg-[var(--color-danger)] py-3 text-[15px] font-semibold text-white"
            >
              Delete
            </button>
          </div>
          <div className="flex gap-2">
            {(['active', 'closed', 'pending'] as const).map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                disabled={c.status === s}
                className={`flex-1 rounded-xl py-2 text-[13px] font-semibold disabled:opacity-40 ${
                  c.status === s
                    ? 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                    : 'border border-[var(--color-accent)] text-[var(--color-accent)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [view, setView] = useState<'new' | 'list'>('new')
  const [cases, setCases] = useState<Case[]>([])
  const [sync, setSync] = useState<SyncStatus>(syncService.status)
  const [savedCount, setSavedCount] = useState(0)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    authService.initialize().then(() => {
      setAuthenticated(authService.isAuthenticated)
    })
    const unsub = authService.subscribe(session => {
      setAuthenticated(!!session)
    })
    return unsub
  }, [])

  useEffect(() => {
    const go = () => setIsOnline(true)
    const goaway = () => setIsOnline(false)
    window.addEventListener('online', go)
    window.addEventListener('offline', goaway)
    return () => {
      window.removeEventListener('online', go)
      window.removeEventListener('offline', goaway)
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return
    syncService.start()
    const unsub = syncService.subscribe(setSync)
    return () => {
      unsub()
      syncService.stop()
    }
  }, [authenticated])

  const loadCases = async () => {
    const all = await db.cases.reverse().sortBy('dateCreated')
    setCases(all)
  }

  useEffect(() => {
    if (view === 'list') loadCases()
  }, [savedCount, view])

  const handleDelete = async (c: Case) => {
    if (!window.confirm(`Delete case ${c.caseNumber} (${c.decedentName})?`)) return
    await db.cases.delete(c.id!)
    if (c.supabaseId && authService.client) {
      try {
        await authService.client.from('cases').delete().eq('id', c.supabaseId)
      } catch {
        /* offline or RLS — will re-sync later */
      }
    }
    await loadCases()
    syncService.refreshPendingCounts()
  }

  const handleStatusChange = async (c: Case, status: Case['status']) => {
    await db.cases.update(c.id!, { status, syncStatus: 'pending', dateModified: new Date().toISOString() })
    syncService.sync()
    await loadCases()
  }

  /* ---- set view when editing ---- */
  const effectiveView = editingCase ? 'new' : view

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-muted)]">Loading…</p>
      </div>
    )
  }

  if (!authenticated) return <AuthScreen />

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <IOSInstallPrompt />

      {/* sync status bar */}
      <div
        className={`flex items-center justify-center gap-2 px-4 py-1.5 text-[12px] font-semibold ${
          sync.syncing
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
            : sync.lastError
              ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
              : sync.lastSync
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
        }`}
      >
        {sync.syncing
          ? '🔄 Syncing…'
          : sync.lastError
            ? `⚠️ Sync failed: ${sync.lastError}`
            : sync.lastSync
              ? `✅ Synced: ${sync.lastSync.toLocaleTimeString()}`
              : '⏳ Waiting for network'}
        {sync.pendingCases + sync.pendingMarks > 0 && (
          <span className="opacity-70">
            · {sync.pendingCases + sync.pendingMarks} pending
          </span>
        )}
        <button
          onClick={() => authService.signOut()}
          className="ml-auto rounded-lg px-3 py-1 text-[11px] text-[var(--color-text-muted)] hover:text-white"
        >
          Sign out
        </button>
      </div>

      {/* offline banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-[var(--color-danger)]/15 px-4 py-1.5 text-[12px] font-semibold text-[var(--color-danger)]">
          📡 You are offline — data saved locally and will sync when reconnected
        </div>
      )}

      {/* tabs (hide when editing to avoid confusion) */}
      {!editingCase && (
        <div className="sticky top-0 z-10 flex border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <button
            onClick={() => { setView('new'); setEditingCase(null) }}
            className={`flex-1 border-b-2 py-3 text-[15px] font-semibold ${
              effectiveView === 'new'
                ? 'border-[var(--color-accent)] bg-[var(--color-bg)] text-white'
                : 'border-transparent text-[var(--color-text-muted)]'
            }`}
          >
            + New Case
          </button>
          <button
            onClick={() => { setView('list'); setEditingCase(null); loadCases() }}
            className={`flex-1 border-b-2 py-3 text-[15px] font-semibold ${
              effectiveView === 'list'
                ? 'border-[var(--color-accent)] bg-[var(--color-bg)] text-white'
                : 'border-transparent text-[var(--color-text-muted)]'
            }`}
          >
            📋 Cases ({cases.length})
          </button>
        </div>
      )}

      {/* content */}
      {effectiveView === 'new' ? (
        <SceneIntakeMode
          key={editingCase?.id ?? 'new'}
          editCase={editingCase}
          onCaseCreated={() => setSavedCount(n => n + 1)}
          onCaseUpdated={() => { setEditingCase(null); loadCases(); setSavedCount(n => n + 1) }}
          onCancelEdit={() => setEditingCase(null)}
        />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {cases.length === 0 ? (
            <p className="py-10 text-center text-[var(--color-text-muted)]">No cases saved yet.</p>
          ) : (
            cases.map(c => (
              <CaseCard
                key={c.id}
                c={c}
                onEdit={() => setEditingCase(c)}
                onDelete={() => handleDelete(c)}
                onStatusChange={s => handleStatusChange(c, s)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
