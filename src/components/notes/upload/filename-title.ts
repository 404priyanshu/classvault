const NOTE_TITLE_MIN = 3
const NOTE_TITLE_MAX = 180

/**
 * Turns a filename into a plausible note title.
 *
 * Filenames carry most of what a title needs and typing it thirty times is the
 * slowest part of seeding a shelf, so this is a starting point the uploader
 * edits rather than an attempt at being clever. Anything it cannot make a
 * sensible title of comes back empty, which leaves the field for the person.
 */
export function titleFromFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[a-z0-9]{1,8}$/i, '')

  const cleaned = withoutExtension
    // Date stamps and scanner prefixes go first: they contain the very
    // separators the next step rewrites, so stripping them afterwards misses.
    .replace(/^\s*\d{4}[-_.]?\d{2}[-_.]?\d{2}[-_.\s]*/, '')
    .replace(/^\s*(?:img|image|scan|doc|document)[-_.\s]*\d*[-_.\s]*/i, '')
    // separators people actually use in a downloads folder
    .replace(/[_+-]+/g, ' ')
    // "(1)", "(2)" from repeat downloads, and copy/version churn
    .replace(/\(\d+\)\s*$/g, '')
    .replace(/\b(?:copy|final|v\d+)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length < NOTE_TITLE_MIN) {
    return ''
  }

  return cleaned.slice(0, NOTE_TITLE_MAX)
}
