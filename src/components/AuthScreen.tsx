import { useState } from 'react'
import { authService } from '../services/authService'

type Mode = 'signin' | 'signup'

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await authService.signIn(email, password)
      } else {
        await authService.signUp(email, password)
        setError('Check your email to confirm sign-up.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <h1 className="mb-1 text-center text-[22px] font-bold text-white">Coroner PWA</h1>
        <p className="mb-6 text-center text-sm text-[var(--color-text-muted)]">
          {mode === 'signin' ? 'Sign in to continue' : 'Create an account'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            className="h-[52px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-white placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            className="h-[52px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-white placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
          />

          {error && (
            <p className="text-center text-sm text-[var(--color-danger)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-[52px] rounded-xl bg-[var(--color-accent)] text-[16px] font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => (m === 'signin' ? 'signup' : 'signin')); setError('') }}
          className="mt-4 w-full text-center text-sm text-[var(--color-text-muted)] underline"
        >
          {mode === 'signin' ? 'No account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
