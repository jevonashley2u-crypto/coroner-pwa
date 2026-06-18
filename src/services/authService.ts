import type { SupabaseClient, Session, User } from '@supabase/supabase-js'

type AuthCallback = (session: Session | null) => void

class AuthService {
  client: SupabaseClient | null = null
  private session: Session | null = null
  private listeners = new Set<AuthCallback>()
  private readyResolve: (() => void) | null = null
  private readyPromise: Promise<void>

  constructor() {
    this.readyPromise = new Promise(resolve => {
      this.readyResolve = resolve
    })
  }

  get isAuthenticated() {
    return !!this.session
  }

  get userId(): string | null {
    return this.session?.user?.id ?? null
  }

  get user(): User | null {
    return this.session?.user ?? null
  }

  get currentSession(): Session | null {
    return this.session
  }

  /** Wait until auth is fully initialized (session restored from storage). */
  async waitForReady() {
    await this.readyPromise
  }

  subscribe(cb: AuthCallback) {
    this.listeners.add(cb)
    return () => { this.listeners.delete(cb) }
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.session))
  }

  /* ---- init ---- */

  async initialize() {
    const { createClient } = await import('@supabase/supabase-js')
    const url = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !anonKey) throw new Error('Supabase credentials not configured')

    this.client = createClient(url, anonKey)

    try {
      const { data } = await this.client.auth.getSession()
      this.session = data.session
    } catch {
      this.session = null
    }
    this.readyResolve?.()
    this.notify()

    this.client.auth.onAuthStateChange((_event, session) => {
      this.session = session
      this.notify()
    })
  }

  /* ---- actions ---- */

  async signIn(email: string, password: string) {
    if (!this.client) throw new Error('Auth not initialized')
    const { error } = await this.client.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async signUp(email: string, password: string) {
    if (!this.client) throw new Error('Auth not initialized')
    const { error } = await this.client.auth.signUp({ email, password })
    if (error) throw error
  }

  async signOut() {
    if (!this.client) throw new Error('Auth not initialized')
    const { error } = await this.client.auth.signOut()
    if (error) throw error
  }
}

export const authService = new AuthService()
