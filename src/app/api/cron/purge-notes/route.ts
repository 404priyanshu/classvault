import { NextResponse, type NextRequest } from 'next/server'
import { NOTE_FILE_BUCKET } from '@/lib/notes/storage/contracts'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  return runPurge(request)
}

export async function POST(request: NextRequest) {
  return runPurge(request)
}

async function runPurge(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { data: candidates, error: claimError } = await supabase.rpc(
      'claim_expired_note_purges',
      { p_limit: 25 },
    )

    if (claimError) {
      return NextResponse.json(
        { error: 'Could not claim expired notes.' },
        { status: 500 },
      )
    }

    let purged = 0
    let failed = 0

    for (const candidate of candidates || []) {
      const objectKeys = [candidate.object_key, candidate.preview_object_key].filter(
        (key): key is string => Boolean(key),
      )

      if (objectKeys.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(NOTE_FILE_BUCKET)
          .remove(objectKeys)

        if (storageError) {
          failed += 1
          continue
        }
      }

      const { data: finalized, error: finalizeError } = await supabase.rpc(
        'finalize_note_purge',
        { p_note_id: candidate.note_id },
      )

      if (finalizeError || !finalized) {
        failed += 1
      } else {
        purged += 1
      }
    }

    return NextResponse.json({ claimed: candidates?.length || 0, failed, purged })
  } catch (error) {
    console.error('note purge job failed', error)
    return NextResponse.json(
      { error: 'The purge job is not configured.' },
      { status: 503 },
    )
  }
}
