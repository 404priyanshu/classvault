import 'server-only'

import { PDFParse } from 'pdf-parse'

export const NOTE_EXTRACTOR_VERSION = 'pdf-parse-2.4.5-v1'
export const NOTE_EXTRACTED_TEXT_MAX_CHARS = 500_000

export type ExtractedNoteText = {
  status: 'failed' | 'ready' | 'unsupported'
  text: string | null
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NOTE_EXTRACTED_TEXT_MAX_CHARS)
}

export async function extractNoteText(
  mimeType: string,
  bytes: Uint8Array,
): Promise<ExtractedNoteText> {
  if (mimeType !== 'application/pdf') {
    return { status: 'unsupported', text: null }
  }

  let parser: PDFParse | null = null

  try {
    parser = new PDFParse({ data: bytes })
    const result = await parser.getText()
    const text = normalizeExtractedText(result.text || '')
    return { status: 'ready', text: text || null }
  } catch {
    return { status: 'failed', text: null }
  } finally {
    await parser?.destroy()
  }
}
