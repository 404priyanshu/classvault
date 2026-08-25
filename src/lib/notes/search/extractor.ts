import 'server-only'

import { extractText, getDocumentProxy } from 'unpdf'

export const NOTE_EXTRACTOR_VERSION = 'unpdf-1.8.1-v1'
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

  try {
    // unpdf ships a serverless build of pdfjs with no canvas dependency, so it
    // does not touch DOMMatrix/ImageData/Path2D on import the way pdfjs-dist
    // does. Text extraction never needs a rendering surface.
    const document = await getDocumentProxy(bytes)
    const { text } = await extractText(document, { mergePages: true })
    const normalized = normalizeExtractedText(text || '')
    return { status: 'ready', text: normalized || null }
  } catch {
    return { status: 'failed', text: null }
  }
}
