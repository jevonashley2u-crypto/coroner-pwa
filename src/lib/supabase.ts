import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

export function getClient(): SupabaseClient {
  if (!client && url && key) {
    client = createClient(url, key, {
      realtime: { params: { log_level: 'info' } },
    })
  }
  if (!client) throw new Error('Supabase not configured')
  return client
}

export const supabase = () => getClient()
