import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  extractNoteText,
  NOTE_EXTRACTOR_VERSION,
} from '@/lib/notes/search/extractor'
import { NOTE_FILE_BUCKET } from '@/lib/notes/storage/contracts'

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
    const supabase = createAdminClient()
    const { data: candidates, error: claimError } = await supabase.rpc(
      'claim_pending_note_extractions',
      { p_limit: 10 },
    )

    if (claimError) {
      return NextResponse.json(
        { error: 'Could not claim pending note extractions.' },
        { status: 500 },
      )
    }

    let completed = 0
    let failed = 0
    let unsupported = 0

    for (const candidate of candidates || []) {
      let extraction: Awaited<ReturnType<typeof extractNoteText>>

      try {
        const { data: file, error: downloadError } = await supabase.storage
          .from(NOTE_FILE_BUCKET)
          .download(candidate.object_key)

        if (downloadError || !file) {
          extraction = { status: 'failed', text: null }
        } else {
          extraction = await extractNoteText(
            candidate.detected_mime_type,
            new Uint8Array(await file.arrayBuffer()),
          )
        }
      } catch (error) {
        console.error('note extraction failed', candidate.note_id, error)
        extraction = { status: 'failed', text: null }
      }

      const { data: finalized, error: finalizeError } = await supabase.rpc(
        'complete_note_extraction',
        {
          p_extracted_text: extraction.text,
          p_extractor_version: NOTE_EXTRACTOR_VERSION,
          p_extraction_status: extraction.status,
          p_note_id: candidate.note_id,
        },
      )

      if (finalizeError || !finalized) {
        failed += 1
      } else if (extraction.status === 'unsupported') {
        unsupported += 1
      } else {
        completed += 1
      }
    }

    return NextResponse.json({
      claimed: candidates?.length || 0,
      completed,
      failed,
      unsupported,
    })
  } catch (error) {
    console.error('note extraction job failed', error)
    return NextResponse.json(
      { error: 'The extraction job is not configured.' },
      { status: 503 },
    )
  }
}
