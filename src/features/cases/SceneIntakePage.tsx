import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addCase, updateCase, getCase } from './caseService'
import { useGeolocation } from '../../hooks/useBrowser'
import CameraModule from '../../components/CameraModule'

export default function SceneIntakePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const geo = useGeolocation()

  const [form, setForm] = useState({
    caseNumber: '',
    decedentName: '',
    address: '',
    ambientTemperature: '',
    bodyTemperature: '',
    temperatureUnit: 'C' as 'C' | 'F',
    weatherConditions: '',
    investigatingOfficer: '',
    notes: '',
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  useEffect(() => {
    if (!id) {
      const now = new Date()
      setForm(f => ({
        ...f,
        caseNumber: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`,
      }))
      return
    }
    getCase(Number(id)).then(c => {
      if (!c) return
      setForm({
        caseNumber: c.caseNumber,
        decedentName: c.decedentName ?? '',
        address: c.address ?? '',
        ambientTemperature: c.ambientTemperature != null ? String(c.ambientTemperature) : '',
        bodyTemperature: c.bodyTemperature != null ? String(c.bodyTemperature) : '',
        temperatureUnit: c.temperatureUnit as 'C' | 'F' ?? 'C',
        weatherConditions: c.weatherConditions ?? '',
        investigatingOfficer: c.investigatingOfficer ?? '',
        notes: c.notes ?? '',
      })
      setPhotos(c.images ?? [])
    })
  }, [id])

  const patch = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.caseNumber) return
    setSaving(true)
    try {
      const payload = {
        caseNumber: form.caseNumber,
        decedentName: form.decedentName || null,
        address: form.address || null,
        latitude: geo.lat,
        longitude: geo.lng,
        ambientTemperature: form.ambientTemperature ? parseFloat(form.ambientTemperature) : null,
        bodyTemperature: form.bodyTemperature ? parseFloat(form.bodyTemperature) : null,
        temperatureUnit: form.temperatureUnit,
        weatherConditions: form.weatherConditions || null,
        investigatingOfficer: form.investigatingOfficer || null,
        notes: form.notes || null,
        images: photos,
        medicalDevices: [],
      }
      if (isEdit) {
        await updateCase(Number(id!), payload)
      } else {
        await addCase(payload)
      }
      navigate('/cases')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <h1 className="text-xl font-bold">{isEdit ? 'Edit Case' : 'New Case'}</h1>

      <Field label="Case Number">
        <Input value={form.caseNumber} onChange={patch('caseNumber')} />
      </Field>
      <Field label="Decedent Name">
        <Input value={form.decedentName} onChange={patch('decedentName')} placeholder="Last, First" />
      </Field>
      <Field label="Scene Address">
        <Input value={form.address} onChange={patch('address')} placeholder="Street, City, State" />
      </Field>

      <Field label="GPS Coordinates">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={geo.capture} disabled={geo.loading} className="btn btn-accent">
            {geo.loading ? 'Acquiring…' : geo.lat ? 'Re-capture' : 'Capture GPS'}
          </button>
          {geo.lat && <span className="font-mono text-sm text-green-400">{geo.lat.toFixed(5)}, {geo.lng?.toFixed(5)}</span>}
        </div>
        {geo.error && <p className="text-xs text-red-400 mt-1">{geo.error}</p>}
      </Field>

      <div className="flex gap-3">
        <Field label="Ambient °{form.temperatureUnit}" className="flex-1">
          <Input type="number" step="0.1" value={form.ambientTemperature} onChange={patch('ambientTemperature')} />
        </Field>
        <Field label="Body °{form.temperatureUnit}" className="flex-1">
          <Input type="number" step="0.1" value={form.bodyTemperature} onChange={patch('bodyTemperature')} />
        </Field>
      </div>

      <Field label="Temp Unit">
        <div className="flex gap-2">
          <button onClick={() => setForm(f => ({ ...f, temperatureUnit: 'C' }))}
            className={`btn ${form.temperatureUnit === 'C' ? 'btn-accent' : 'btn-outline'}`}>Celsius</button>
          <button onClick={() => setForm(f => ({ ...f, temperatureUnit: 'F' }))}
            className={`btn ${form.temperatureUnit === 'F' ? 'btn-accent' : 'btn-outline'}`}>Fahrenheit</button>
        </div>
      </Field>

      <Field label="Weather">
        <Input value={form.weatherConditions} onChange={patch('weatherConditions')} placeholder="e.g. Clear, 22C" />
      </Field>
      <Field label="Officer">
        <Input value={form.investigatingOfficer} onChange={patch('investigatingOfficer')} placeholder="Badge / Name" />
      </Field>

      <Field label="Photos">
        {!showCamera ? (
          <button onClick={() => setShowCamera(true)} className="btn btn-dashed">Open Camera</button>
        ) : (
          <CameraModule onCapture={p => { setPhotos(prev => [...prev, p]); setShowCamera(false) }} onClose={() => setShowCamera(false)} />
        )}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {photos.map((p, i) => <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover border border-zinc-700" />)}
          </div>
        )}
      </Field>

      <Field label="Notes">
        <textarea value={form.notes} onChange={patch('notes')} rows={4} className="input min-h-[100px] resize-y pt-3" placeholder="Scene observations…" />
      </Field>

      <div className="flex gap-3 mt-2">
        <button onClick={() => navigate('/cases')} className="btn btn-outline flex-1">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.caseNumber} className="btn btn-primary flex-[2]">
          {saving ? 'Saving…' : isEdit ? 'Update Case' : 'Save Case'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />
}
