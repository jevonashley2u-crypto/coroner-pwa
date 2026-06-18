import { useCallback, useEffect, useState } from 'react'
import { db, type PhysicalMark } from '../db/db'
import { syncService } from '../services/syncService'
import { authService } from '../services/authService'

const MARK_TYPES = ['tattoo', 'scar', 'birthmark', 'fracture', 'burn', 'other'] as const

interface Props {
  caseId: number
}

export default function PhysicalMarksPanel({ caseId }: Props) {
  const [marks, setMarks] = useState<PhysicalMark[]>([])
  const [showForm, setShowForm] = useState(false)

  /* ---- form state ---- */
  const [type, setType] = useState<string>('tattoo')
  const [description, setDescription] = useState('')
  const [bodyLocation, setBodyLocation] = useState('')
  const [sizeMm, setSizeMm] = useState('')
  const [color, setColor] = useState('')
  const [shape, setShape] = useState('')
  const [orientation, setOrientation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadMarks = useCallback(async () => {
    const all = await db.physicalMarks.where('caseId').equals(caseId).reverse().sortBy('dateCreated')
    setMarks(all)
  }, [caseId])

  useEffect(() => { loadMarks() }, [loadMarks])

  const resetForm = () => {
    setType('tattoo')
    setDescription('')
    setBodyLocation('')
    setSizeMm('')
    setColor('')
    setShape('')
    setOrientation('')
    setNotes('')
  }

  const handleAdd = async () => {
    if (!description || !bodyLocation) return
    setSaving(true)
    try {
      await db.physicalMarks.add({
        caseId,
        type: type as PhysicalMark['type'],
        description,
        bodyLocation,
        sizeMm: sizeMm || null,
        color: color || null,
        shape: shape || null,
        orientation: orientation || null,
        imageBase64: null,
        notes: notes || null,
        dateCreated: new Date().toISOString(),
        syncStatus: 'pending',
        supabaseId: null,
      })
      resetForm()
      setShowForm(false)
      await loadMarks()
      syncService.sync()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (m: PhysicalMark) => {
    if (!window.confirm(`Delete this ${m.type}?`)) return
    await db.physicalMarks.delete(m.id!)
    if (m.supabaseId) {
      try {
        await authService.client!.from('tattoos_scars').delete().eq('id', m.supabaseId)
      } catch { /* offline */ }
    }
    await loadMarks()
    syncService.refreshPendingCounts()
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Physical Marks ({marks.length})
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white"
        >
          {showForm ? 'Cancel' : '+ Add Mark'}
        </button>
      </div>

      {/* add form */}
      {showForm && (
        <div className="mb-3 space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] text-white outline-none"
          >
            {MARK_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description *" className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] text-white outline-none placeholder:text-[var(--color-text-muted)]" />
          <input value={bodyLocation} onChange={e => setBodyLocation(e.target.value)} placeholder="Body location * (e.g. Left forearm)" className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] text-white outline-none placeholder:text-[var(--color-text-muted)]" />

          <div className="flex gap-2">
            <input value={sizeMm} onChange={e => setSizeMm(e.target.value)} placeholder="Size (mm)" className="h-11 w-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] text-white outline-none placeholder:text-[var(--color-text-muted)]" />
            <input value={color} onChange={e => setColor(e.target.value)} placeholder="Color" className="h-11 w-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] text-white outline-none placeholder:text-[var(--color-text-muted)]" />
          </div>

          <div className="flex gap-2">
            <input value={shape} onChange={e => setShape(e.target.value)} placeholder="Shape" className="h-11 w-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] text-white outline-none placeholder:text-[var(--color-text-muted)]" />
            <input value={orientation} onChange={e => setOrientation(e.target.value)} placeholder="Orientation" className="h-11 w-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] text-white outline-none placeholder:text-[var(--color-text-muted)]" />
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" rows={2} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[15px] text-white outline-none placeholder:text-[var(--color-text-muted)]" />

          <button
            onClick={handleAdd}
            disabled={saving || !description || !bodyLocation}
            className="h-11 w-full rounded-lg bg-[var(--color-success)] text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Mark'}
          </button>
        </div>
      )}

      {/* marks list */}
      <div className="flex flex-col gap-2">
        {marks.length === 0 && !showForm && (
          <p className="text-sm text-[var(--color-text-muted)]">No marks recorded.</p>
        )}
        {marks.map(m => (
          <div key={m.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">
                {m.type.charAt(0).toUpperCase() + m.type.slice(1)}
              </span>
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${m.syncStatus === 'synced' ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'}`}>
                  {m.syncStatus}
                </span>
                <button onClick={() => handleDelete(m)} className="text-[var(--color-danger)] text-[13px]">✕</button>
              </div>
            </div>
            <div className="mt-1">{m.description}</div>
            <div>📍 {m.bodyLocation}</div>
            {m.sizeMm && <div>📏 {m.sizeMm}mm</div>}
            {m.color && <div>🎨 {m.color}</div>}
            {m.shape && <div>◻ {m.shape}</div>}
            {m.orientation && <div>↕ {m.orientation}</div>}
            {m.notes && <div className="mt-1 italic">📝 {m.notes}</div>}
            <div className="mt-1 text-[11px] text-[var(--color-border)]">
              {new Date(m.dateCreated).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
