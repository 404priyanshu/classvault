import { NextResponse, type NextRequest } from 'next/server'
import {
  createAccessibleNoteFileUrl,
  getAccessibleNoteFile,
} from '@/lib/notes/storage/access'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('next', `/dashboard/notes/${noteId}`)
    return NextResponse.redirect(signInUrl)
  }

  try {
    const file = await getAccessibleNoteFile(supabase, noteId)

    if (!file) {
      return new NextResponse('Note file not found', { status: 404 })
    }

    const downloadUrl = await createAccessibleNoteFileUrl(supabase, file, {
      download: true,
    })

    return NextResponse.redirect(downloadUrl)
  } catch {
    return new NextResponse('Note file not found', { status: 404 })
  }
}
