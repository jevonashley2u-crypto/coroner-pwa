import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SplashPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(true)

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <button
        onClick={() => navigate('/intake')}
        disabled={!ready}
        className="flex-1 flex items-center justify-center w-full"
      >
        <video
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain pointer-events-none"
          onCanPlay={() => setReady(true)}
          src="/intro.mp4"
        />
      </button>
      <div className="px-6 pb-10 pt-4">
        <button
          onClick={() => navigate('/intake')}
          disabled={!ready}
          className="w-full min-h-[52px] rounded-xl bg-white text-black font-bold text-[17px] disabled:opacity-30 transition-opacity"
        >
          {ready ? 'Get Started' : 'Loading…'}
        </button>
      </div>
    </div>
  )
}
