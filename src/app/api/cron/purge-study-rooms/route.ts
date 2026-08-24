import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(
    secret && request.headers.get('authorization') === `Bearer ${secret}`,
  )
}

async function runPurge(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { data: purged, error } = await supabase.rpc(
      'purge_expired_study_rooms',
    )

    if (error) {
      return NextResponse.json(
        { error: 'Could not purge expired study rooms.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ purged: purged || 0 })
  } catch (error) {
    console.error('study-room purge job failed', error)
    return NextResponse.json(
      { error: 'The study-room purge job is not configured.' },
      { status: 503 },
    )
  }
}

export async function GET(request: NextRequest) {
  return runPurge(request)
}

export async function POST(request: NextRequest) {
  return runPurge(request)
}
