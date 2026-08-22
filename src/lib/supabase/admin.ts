import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { getSupabaseConfig } from './config'

export function createAdminClient() {
  const { url } = getSupabaseConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('Supabase service role key is not configured.')
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}
