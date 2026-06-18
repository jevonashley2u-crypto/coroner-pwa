import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCases, deleteCase } from './caseService'
import { searchCases } from './searchService'

export default function CasesListPage() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<Awaited<ReturnType<typeof getAllCases>>>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setCases(await searchCases(query))
    setLoading(false)
  }, [query])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number, caseNumber: string) => {
    if (!window.confirm(`Delete case ${caseNumber}?`)) return
    await deleteCase(id)
    load()
  }

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search cases…"
        className="input mb-4"
      />

      {loading ? (
        <p className="text-zinc-500 text-center py-10">Loading…</p>
      ) : cases.length === 0 ? (
        <p className="text-zinc-500 text-center py-10">{query ? 'No matches' : 'No cases yet'}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {cases.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">{c.caseNumber}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  c.syncStatus === 'synced' ? 'bg-green-500/20 text-green-400' :
                  c.syncStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {c.syncStatus}
                </span>
              </div>
              {c.decedentName && <p className="text-sm text-zinc-400">{c.decedentName}</p>}
              <p className="text-xs text-zinc-600 mt-1">{new Date(c.dateCreated).toLocaleDateString()}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate(`/intake/${c.id}`)} className="btn btn-sm btn-accent">Edit</button>
                <button onClick={() => handleDelete(c.id!, c.caseNumber)} className="btn btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
