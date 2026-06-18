import { useState, useRef, useCallback, useEffect } from 'react'

interface CameraModuleProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export default function CameraModule({ onCapture, onClose }: CameraModuleProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async () => {
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = s
      setStream(s)
      const track = s.getVideoTracks()[0]
      setTorchSupported(!!track.getCapabilities?.().torch)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera access denied')
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStream(null)
    setTorchOn(false)
  }, [])

  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream }, [stream])
  useEffect(() => () => stop(), [stop])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    try { await track.applyConstraints({ advanced: [{ torch: next }] }); setTorchOn(next) } catch { }
  }

  const capture = () => {
    const v = videoRef.current
    if (!v) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth || 1920
    c.height = v.videoHeight || 1080
    c.getContext('2d')!.drawImage(v, 0, 0)
    onCapture(c.toDataURL('image/jpeg', 0.85))
  }

  if (!stream && !error) {
    return <button onClick={start} className="btn btn-dashed w-full">Open Camera</button>
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {stream && (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black min-h-[200px]" />
          <div className="flex gap-2">
            <button onClick={capture} className="btn btn-primary flex-1">Capture</button>
            {torchSupported && (
              <button onClick={toggleTorch} className={`btn ${torchOn ? 'bg-yellow-500 text-black' : 'btn-outline'}`}>
                {torchOn ? 'Flash On' : 'Flash Off'}
              </button>
            )}
            <button onClick={stop} className="btn btn-outline">Close</button>
          </div>
        </>
      )}
      <button onClick={onClose} className="btn btn-accent">Done</button>
    </div>
  )
}
