import { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ */
/*  Detection helpers                                                  */
/* ------------------------------------------------------------------ */

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || !!nav.standalone
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'coroner_pwa_ios_prompt_dismissed'

export default function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true'
    if (isIOS() && !isStandalone() && !dismissed) {
      /* small delay so the page loads first */
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch { /* quota exceeded — ignore */ }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md animate-slide-up rounded-t-2xl bg-[var(--color-surface)] px-6 pb-8 pt-6 shadow-2xl"
        style={{ animation: 'slideUp 0.35s ease-out' }}
      >
        {/* handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--color-border)]" />

        {/* header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15 text-2xl">
            📲
          </div>
          <h2 className="text-xl font-bold text-white">Install Coroner Field Intake</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Add this app to your Home Screen for offline field use.
          </p>
        </div>

        {/* steps */}
        <div className="mb-6 space-y-4">
          <Step
            number={1}
            icon="Safari"
            title="Tap Share"
            description="Tap the Share icon at the bottom of Safari."
          >
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-raised)] text-xs">□</span>
              <span>then scroll down</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-surface-raised)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">
                ⬆ Share
              </span>
            </div>
          </Step>

          <Step
            number={2}
            icon="+"
            title="Add to Home Screen"
            description="Tap Add to Home Screen from the share menu."
          >
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-surface-raised)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">
                ＋ Add to Home Screen
              </span>
            </div>
          </Step>

          <Step
            number={3}
            icon="✅"
            title="Done"
            description="The app will appear on your Home Screen. Open it like any other app."
          />
        </div>

        {/* dismiss */}
        <button
          onClick={dismiss}
          className="h-12 w-full rounded-xl bg-[var(--color-accent)] text-[16px] font-bold text-white transition-opacity hover:opacity-90"
        >
          Got it
        </button>

        <button
          onClick={dismiss}
          className="mt-3 h-10 w-full text-sm text-[var(--color-text-muted)] underline underline-offset-2"
        >
          Don't show again
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step sub-component                                                */
/* ------------------------------------------------------------------ */

function Step({
  number,
  icon,
  title,
  description,
  children,
}: {
  number: number
  icon: string
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-xs font-bold text-[var(--color-accent)]">
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          <span className="text-[15px] font-semibold text-white">{title}</span>
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{description}</p>
        {children}
      </div>
    </div>
  )
}
