import { useState, useEffect, useCallback } from 'react'

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  return online
}

export function useGeolocation() {
  const [state, setState] = useState<{ lat: number | null; lng: number | null; error: string | null; loading: boolean }>({
    lat: null, lng: null, error: null, loading: false,
  })

  const capture = useCallback(() => {
    if (!navigator.geolocation) { setState(s => ({ ...s, error: 'Geolocation not supported' })); return }
    setState(s => ({ ...s, loading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      pos => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false }),
      err => setState(s => ({ ...s, error: err.message, loading: false })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  return { ...state, capture }
}
