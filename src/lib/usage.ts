import 'server-only'

import { after } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type UsageEvent =
  | { event: 'notes_searched'; foundResults: boolean }
  | { event: 'note_opened' | 'note_downloaded' | 'note_uploaded'; noteId: string }
  | { event: 'roadmap_generated' | 'study_room_joined' }

/**
 * Records a demand-pilot usage event after the response is sent.
 *
 * Counting must never slow a page or fail a request, so the write runs in
 * `after()` and any error is logged and dropped. The database derives the
 * student from the session; nothing here names a user.
 */
export function recordUsageEvent(
  supabase: SupabaseClient<Database>,
  usage: UsageEvent,
) {
  after(async () => {
    const { error } = await supabase.rpc('record_usage_event', {
      p_event: usage.event,
      p_found_results:
        'foundResults' in usage ? usage.foundResults : undefined,
      p_note_id: 'noteId' in usage ? usage.noteId : undefined,
    })

    if (error) {
      console.error('usage event was not recorded', usage.event, error.message)
    }
  })
}
