import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { NOTE_FILE_BUCKET } from '@/lib/notes/storage/contracts'
import { extractNoteText, NOTE_EXTRACTOR_VERSION } from './extractor'

export type ExtractionRunSummary = {
  claimed: number
  completed: number
  failed: number
  unsupported: number
}

/**
 * Claims pending extractions and indexes them.
 *
 * Shared by the scheduled worker and the inline run that follows publication so
 * both take the same claim boundary. The claim RPC is what keeps a note from
 * being extracted twice when an inline run and a scheduled run overlap.
 */
export async function runNoteExtraction(
  limit: number,
): Promise<ExtractionRunSummary> {
  const supabase = createAdminClient()
  const { data: candidates, error: claimError } = await supabase.rpc(
    'claim_pending_note_extractions',
    { p_limit: limit },
  )

  if (claimError) {
    throw new Error('Could not claim pending note extractions.')
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

  return {
    claimed: candidates?.length || 0,
    completed,
    failed,
    unsupported,
  }
}
