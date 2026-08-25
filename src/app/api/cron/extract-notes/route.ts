import { NextResponse, type NextRequest } from 'next/server'
import { runNoteExtraction } from '@/lib/notes/search/runner'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(
    secret && request.headers.get('authorization') === `Bearer ${secret}`,
  )
}

export async function GET(request: NextRequest) {
  return runExtraction(request)
}

export async function POST(request: NextRequest) {
  return runExtraction(request)
}

async function runExtraction(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Publication now indexes inline, so this sweep exists to catch notes whose
    // inline run was cut short and to re-index after the extractor version
    // changes.
    return NextResponse.json(await runNoteExtraction(10))
  } catch (error) {
    console.error('note extraction job failed', error)
    return NextResponse.json(
      { error: 'The extraction job is not configured.' },
      { status: 503 },
    )
  }
}
