import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SplashPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(true)
  const go = useCallback(() => navigate('/intake'), [navigate])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div
        onClick={go}
        className="flex-1 flex items-center justify-center w-full cursor-pointer"
      >
        <video
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
          onCanPlay={() => setReady(true)}
          src="/intro.mp4"
        />
      </div>
      <div className="px-6 pb-10 pt-4">
        <button
          onClick={go}
          className="w-full min-h-[52px] rounded-xl bg-white text-black font-bold text-lg disabled:opacity-30 transition-opacity"
        >
          {ready ? 'Get Started' : 'Loading…'}
        </button>
      </div>
    </div>
  )
}
