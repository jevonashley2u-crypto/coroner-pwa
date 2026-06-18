import { useState } from 'react'
import type { DeviceLookup } from '../db/db'

interface Props {
  onSelect: (device: DeviceLookup) => void
  onClose: () => void
}

interface ApiResult {
  brand_name?: string
  company_name?: string
  device_description?: string
  version_or_model_number?: string
  catalog_number?: string
  mri_safety?: string
  identifiers?: { id: string; type: string }[]
  product_codes?: { code: string; name: string }[]
}

export default function DeviceLookupModal({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ApiResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [noKey, setNoKey] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setNoKey(false)
    try {
      const q = encodeURIComponent(query.trim())
      const res = await fetch(`https://api.fda.gov/device/udi.json?search=device_description:${q}&limit=20`)
      if (res.status === 429) {
        setError('Rate limit reached — try again in a minute.')
        setResults([])
        return
      }
      if (res.status === 404) {
        setError('No devices found matching that description.')
        setResults([])
        return
      }
      const data = await res.json()
      if (data.error) {
        setError(data.error.message || 'No results found.')
        setResults([])
        return
      }
      setResults(data.results || [])
    } catch (e) {
      setError('Network error — are you offline?')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (r: ApiResult) => {
    onSelect({
      brandName: r.brand_name || '',
      companyName: r.company_name || '',
      deviceDescription: r.device_description || '',
      modelNumber: r.version_or_model_number || null,
      catalogNumber: r.catalog_number || null,
      mriSafety: r.mri_safety || null,
      identifiers: (r.identifiers || []).map(i => i.id),
      productCode: r.product_codes?.[0]?.code || null,
      productCodeName: r.product_codes?.[0]?.name || null,
      searchedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-white">Medical Device Lookup</h2>
          <button onClick={onClose} className="text-2xl text-[var(--color-text-muted)]">✕</button>
        </div>

        <p className="mb-3 text-sm text-[var(--color-text-muted)]">
          Search by device name, brand, or keyword. Powered by the FDA GUDID database.
        </p>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="e.g. pacemaker, hip implant, stent…"
            className="h-12 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-white outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="h-12 rounded-xl bg-[var(--color-accent)] px-5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>
        )}

        {!noKey && (
          <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
            No API key needed — uses the free public openFDA endpoint (240 req/min).
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-left transition-colors hover:border-[var(--color-accent)]"
              >
                <div className="font-semibold text-white">{r.brand_name || 'Unknown Brand'}</div>
                <div className="mt-0.5 text-sm text-[var(--color-text-muted)]">{r.company_name}</div>
                <div className="mt-0.5 text-sm text-[var(--color-text-muted)]">{r.device_description}</div>
                {r.version_or_model_number && (
                  <div className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">
                    Model: {r.version_or_model_number}
                  </div>
                )}
                {r.catalog_number && (
                  <div className="text-[13px] text-[var(--color-text-muted)]">
                    Catalog: {r.catalog_number}
                  </div>
                )}
                {r.product_codes && r.product_codes[0] && (
                  <div className="mt-1 inline-block rounded bg-[var(--color-surface)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
                    {r.product_codes[0].code} — {r.product_codes[0].name}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
