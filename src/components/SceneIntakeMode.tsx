import { useCallback, useEffect, useRef, useState } from 'react'
import { db, type Case, type DeviceLookup } from '../db/db'
import { syncService } from '../services/syncService'
import DeviceLookupModal from './DeviceLookupModal'

/* ------------------------------------------------------------------ */
/*  Utils                                                              */
/* ------------------------------------------------------------------ */

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GeoState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  loading: boolean
  error: string | null
}

interface Photo {
  id: string
  dataUrl: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SceneIntakeMode({
  onCaseCreated,
  editCase,
  onCancelEdit,
  onCaseUpdated,
}: {
  onCaseCreated?: () => void
  editCase?: Case | null
  onCancelEdit?: () => void
  onCaseUpdated?: () => void
}) {
  /* ---- form state ---- */
  const [caseNumber, setCaseNumber] = useState('')
  const [decedentName, setDecedentName] = useState('')
  const [address, setAddress] = useState('')
  const [ambientTemp, setAmbientTemp] = useState('')
  const [bodyTemp, setBodyTemp] = useState('')
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C')
  const [weather, setWeather] = useState('')
  const [officer, setOfficer] = useState('')
  const [notes, setNotes] = useState('')

  /* ---- hardware state ---- */
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  const [geo, setGeo] = useState<GeoState>({ lat: null, lng: null, accuracy: null, loading: false, error: null })
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [medicalDevices, setMedicalDevices] = useState<DeviceLookup[]>([])
  const [showDeviceLookup, setShowDeviceLookup] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /* ---- auto-generate case number (only for new cases) ---- */
  useEffect(() => {
    if (editCase) return
    const now = new Date()
    setCaseNumber(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`,
    )
  }, [editCase])

  /* ---- pre-fill form when editing ---- */
  useEffect(() => {
    if (!editCase) return
    setCaseNumber(editCase.caseNumber)
    setDecedentName(editCase.decedentName)
    setAddress(editCase.address)
    setAmbientTemp(editCase.ambientTemperature !== null ? String(editCase.ambientTemperature) : '')
    setBodyTemp(editCase.bodyTemperature !== null ? String(editCase.bodyTemperature) : '')
    setTempUnit(editCase.temperatureUnit as 'C' | 'F')
    setWeather(editCase.weatherConditions || '')
    setOfficer(editCase.investigatingOfficer || '')
    setNotes(editCase.notes || '')
    setPhotos(editCase.images.map(dataUrl => ({ id: randomId(), dataUrl })))
    setMedicalDevices(editCase.medicalDevices || [])
    if (editCase.latitude && editCase.longitude) {
      setGeo({ lat: editCase.latitude, lng: editCase.longitude, accuracy: null, loading: false, error: null })
    }
  }, [editCase])

  /* ---- reset form ---- */
  const resetForm = useCallback(() => {
    setDecedentName('')
    setAddress('')
    setAmbientTemp('')
    setBodyTemp('')
    setTempUnit('C')
    setWeather('')
    setOfficer('')
    setNotes('')
    setPhotos([])
    setMedicalDevices([])
    setGeo({ lat: null, lng: null, accuracy: null, loading: false, error: null })
    const now = new Date()
    setCaseNumber(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`,
    )
  }, [])

  /* ------------------------------------------------------------------ */
  /*  Camera                                                             */
  /* ------------------------------------------------------------------ */

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = s
      setCameraStream(s)

      /* detect torch capability */
      const track = s.getVideoTracks()[0]
      const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined
      setTorchSupported(!!capabilities?.torch)
      setTorchOn(false)
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : 'Camera access denied')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraStream(null)
    setTorchOn(false)
  }, [])

  /* wire stream to video element */
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  /* flashlight toggle */
  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      const next = !torchOn
      await track.applyConstraints({ advanced: [{ torch: next }] as unknown as MediaTrackConstraintSet[] })
      setTorchOn(next)
    } catch {
      /* torch not supported at runtime */
    }
  }, [torchOn])

  /* capture photo via canvas snapshot */
  const capturePhoto = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth || 1920
    canvas.height = v.videoHeight || 1080
    canvas.getContext('2d')!.drawImage(v, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPhotos(prev => [...prev, { id: randomId(), dataUrl }])
  }, [])

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }, [])

  /* ------------------------------------------------------------------ */
  /*  GPS                                                                */
  /* ------------------------------------------------------------------ */

  const captureGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGeo(prev => ({ ...prev, error: 'Geolocation not supported' }))
      return
    }
    setGeo(prev => ({ ...prev, loading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      pos =>
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        }),
      err => setGeo(prev => ({ ...prev, loading: false, error: err.message })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  /* ---- stop camera on unmount ---- */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  /* ------------------------------------------------------------------ */
  /*  Dexie Save                                                         */
  /* ------------------------------------------------------------------ */

  const handleSave = useCallback(async () => {
    if (!caseNumber || !decedentName) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const base = {
        status: 'active' as const,
        dateModified: now,
        decedentName,
        decedentDOB: null,
        decedentGender: null,
        decedentRace: null,
        address,
        latitude: geo.lat,
        longitude: geo.lng,
        discoveryTimestamp: now,
        arrivalTimestamp: null,
        ambientTemperature: ambientTemp ? parseFloat(ambientTemp) : null,
        bodyTemperature: bodyTemp ? parseFloat(bodyTemp) : null,
        temperatureUnit: tempUnit,
        weatherConditions: weather || null,
        investigatingOfficer: officer || null,
        preliminaryCause: null,
        notes: notes || null,
        images: photos.map(p => p.dataUrl),
        medicalDevices,
        syncStatus: 'pending' as const,
      }

      if (editCase) {
        await db.cases.update(editCase.id!, { ...base, caseNumber })
        onCaseUpdated?.()
      } else {
        const record = { ...base, caseNumber, dateCreated: now, supabaseId: null }
        const id = await db.cases.add(record)
        setSavedId(id)
        resetForm()
        onCaseCreated?.()
      }

      syncService.sync()

      setTimeout(() => setSavedId(null), 3000)
    } finally {
      setSaving(false)
    }
  }, [caseNumber, decedentName, address, ambientTemp, bodyTemp, tempUnit, weather, officer, notes, photos, geo, medicalDevices, resetForm, onCaseCreated, onCaseUpdated, editCase])

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-32 pt-4">
      {/* header */}
      <div className="text-center">
        <h1 className="text-[22px] font-bold text-white">{editCase ? 'Edit Case' : 'Scene Intake'}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Case: {caseNumber}</p>
        {editCase && (
          <button
            onClick={onCancelEdit}
            className="mt-1 text-sm text-[var(--color-accent)] underline"
          >
            Cancel editing
          </button>
        )}
      </div>

      {/* ---------- case number ---------- */}
      <Field label="Case Number">
        <Input value={caseNumber} onChange={setCaseNumber} placeholder="2026-0601-1430" />
      </Field>

      {/* ---------- decedent ---------- */}
      <Field label="Decedent Name">
        <Input value={decedentName} onChange={setDecedentName} placeholder="Last, First Middle" />
      </Field>

      {/* ---------- address ---------- */}
      <Field label="Scene Address">
        <Input value={address} onChange={setAddress} placeholder="Street, City, State" />
      </Field>

      {/* ---------- GPS ---------- */}
      <Field label="GPS Coordinates">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={captureGps}
            disabled={geo.loading}
            className={`flex h-12 items-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white ${
              geo.loading ? 'opacity-60' : ''
            } ${geo.lat ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`}
          >
            {geo.loading ? '📍 Acquiring…' : geo.lat ? '📍 Re-capture GPS' : '📍 Capture GPS'}
          </button>
          {geo.lat !== null && geo.lng !== null && (
            <span className="text-sm text-[var(--color-success)]">
              {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
              {geo.accuracy !== null && (
                <span className="ml-1.5 text-[13px] text-[var(--color-text-muted)]">
                  ±{Math.round(geo.accuracy)}m
                </span>
              )}
            </span>
          )}
        </div>
        {geo.error && <p className="mt-1 text-[13px] text-[var(--color-danger)]">{geo.error}</p>}
      </Field>

      {/* ---------- temperature ---------- */}
      <Field label="Temperature">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            value={ambientTemp}
            onChange={e => setAmbientTemp(e.target.value)}
            placeholder="Ambient"
            className="h-12 w-[130px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[17px] text-white outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <span className="text-sm text-[var(--color-text-muted)]">
            Ambient °{tempUnit}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            value={bodyTemp}
            onChange={e => setBodyTemp(e.target.value)}
            placeholder="Body"
            className="h-12 w-[130px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[17px] text-white outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <span className="text-sm text-[var(--color-text-muted)]">Body °{tempUnit}</span>
          <button
            onClick={() => setTempUnit(u => (u === 'C' ? 'F' : 'C'))}
            className="flex h-12 min-w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[16px] font-bold text-white"
          >
            °{tempUnit === 'C' ? 'F' : 'C'}
          </button>
        </div>
      </Field>

      {/* ---------- weather ---------- */}
      <Field label="Weather Conditions">
        <Input value={weather} onChange={setWeather} placeholder="e.g. Clear, 22°C" />
      </Field>

      {/* ---------- officer ---------- */}
      <Field label="Investigating Officer">
        <Input value={officer} onChange={setOfficer} placeholder="Badge / Name" />
      </Field>

      {/* ---------- medical device lookup ---------- */}
      <Field label="Medical Devices">
        <button
          onClick={() => setShowDeviceLookup(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-transparent text-[15px] font-semibold text-[var(--color-accent)]"
        >
          🔍 Look Up Medical Device
        </button>
        {medicalDevices.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {medicalDevices.map((d, i) => (
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
        )}
      </Field>

      {showDeviceLookup && (
        <DeviceLookupModal
          onSelect={d => { setMedicalDevices(prev => [...prev, d]); setShowDeviceLookup(false) }}
          onClose={() => setShowDeviceLookup(false)}
        />
      )}

      {/* ---------- camera ---------- */}
      <Field label="Scene Photos">
        {!cameraStream && (
          <button
            onClick={startCamera}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-transparent text-[16px] font-semibold text-[var(--color-accent)]"
          >
            📷 Open Camera
          </button>
        )}

        {cameraError && (
          <p className="mt-1 text-[13px] text-[var(--color-danger)]">{cameraError}</p>
        )}

        {cameraStream && (
          <div className="mt-2 overflow-hidden rounded-xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="block min-h-[220px] w-full bg-black"
            />

            {/* camera controls */}
            <div className="mt-2 flex gap-2">
              <button
                onClick={capturePhoto}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent)] py-3 text-[16px] font-bold text-white"
              >
                📸 Capture
              </button>

              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`flex h-12 items-center justify-center rounded-xl px-4 text-[16px] font-bold ${
                    torchOn
                      ? 'bg-[var(--color-warning)] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-white'
                  }`}
                >
                  {torchOn ? '🔦 ON' : '🔦 OFF'}
                </button>
              )}

              <button
                onClick={stopCamera}
                className="flex h-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-[15px] font-semibold text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* photo thumbnails */}
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map(p => (
              <div key={p.id} className="relative">
                <img
                  src={p.dataUrl}
                  alt="scene"
                  onClick={() => setPreviewImg(p.dataUrl)}
                  className="h-20 w-20 cursor-pointer rounded-xl border-2 border-transparent object-cover hover:border-[var(--color-accent)]"
                />
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-danger)] text-[14px] text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* fullscreen preview */}
        {previewImg && (
          <div
            onClick={() => setPreviewImg(null)}
            className="fixed inset-0 z-[1000] flex cursor-pointer items-center justify-center bg-black/90 p-5"
          >
            <img src={previewImg} alt="preview" className="max-h-full max-w-full rounded-lg" />
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-2xl text-white"
            >
              ✕
            </button>
          </div>
        )}
      </Field>

      {/* ---------- notes ---------- */}
      <Field label="Scene Notes">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Observations, findings, notable conditions…"
          rows={4}
          className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-[17px] leading-relaxed text-white outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </Field>

      {/* ---------- save ---------- */}
      <div className="sticky bottom-4 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !caseNumber || !decedentName}
          className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[18px] font-bold text-white shadow-lg ${
            !caseNumber || !decedentName
              ? 'cursor-not-allowed bg-[var(--color-border)]'
              : 'cursor-pointer bg-[var(--color-success)] shadow-[var(--color-success)/30]'
          }`}
        >
          {saving ? '💾 Saving…' : editCase ? '💾 Update Case' : '💾 Save Case Locally'}
        </button>
      </div>

      {/* saved toast */}
      {savedId !== null && (
        <div className="fixed left-1/2 top-16 z-[999] -translate-x-1/2 rounded-xl bg-[var(--color-success)] px-6 py-3 text-[15px] font-semibold text-white shadow-lg">
          ✅ Case #{savedId} saved to local database
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[17px] text-white outline-none placeholder:text-[var(--color-text-muted)]"
    />
  )
}
