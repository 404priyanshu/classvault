'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Trash2, Upload } from 'lucide-react'
import {
  removeAvatarAction,
  updateAvatarAction,
} from '@/app/dashboard/settings/actions'
import { initialSettingsActionState } from '@/lib/settings/action-state'
import { ProfileAvatar } from './ProfileAvatar'
import { SettingsFormStatus } from './SettingsFormStatus'
import { SettingsSubmitButton } from './SettingsSubmitButton'

export function AvatarSettingsForm({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null
  displayName: string
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadState, uploadAction] = useActionState(
    updateAvatarAction,
    initialSettingsActionState,
  )
  const [removeState, removeAction] = useActionState(
    removeAvatarAction,
    initialSettingsActionState,
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (uploadState.kind === 'success' || removeState.kind === 'success') {
      router.refresh()
    }
  }, [removeState.kind, router, uploadState.kind])

  return (
    <div className="grid gap-5 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
      <div className="relative w-fit">
        <ProfileAvatar
          avatarUrl={previewUrl || avatarUrl}
          className="h-24 w-24 text-2xl shadow-[3px_3px_0_rgba(23,21,18,0.12)]"
          displayName={displayName}
        />
        <span className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-md border border-[#171512]/20 bg-[#fffdf6] shadow-sm">
          <Camera aria-hidden className="h-4 w-4 text-[#17453a]" />
        </span>
      </div>

      <div>
        <h3 className="text-sm font-bold">Profile photo</h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#171512]/55">
          JPG, PNG, or WebP. Use a square image up to 2 MiB.
        </p>
        <form action={uploadAction} className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-[#bfb39d] bg-[#fffdf6] px-4 text-sm font-bold transition hover:border-[#17453a] hover:bg-[#eef4ed] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#17453a]">
            <Upload aria-hidden className="h-4 w-4" />
            Choose photo
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              name="avatar"
              onChange={(event) => {
                const file = event.target.files?.[0]
                setPreviewUrl((current) => {
                  if (current) URL.revokeObjectURL(current)
                  return file ? URL.createObjectURL(file) : null
                })
              }}
              ref={fileInputRef}
              required
              type="file"
            />
          </label>
          {previewUrl ? (
            <SettingsSubmitButton idleLabel="Upload photo" pendingLabel="Uploading…" />
          ) : null}
        </form>
        {avatarUrl ? (
          <form action={removeAction} className="mt-3">
            <button
              className="inline-flex min-h-9 items-center gap-2 text-sm font-bold text-[#9a3328] underline decoration-[#d9b3aa] underline-offset-4 transition hover:decoration-[#9a3328]"
              type="submit"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              Remove current photo
            </button>
          </form>
        ) : null}
        <div className="mt-3 space-y-2">
          <SettingsFormStatus state={uploadState} />
          <SettingsFormStatus state={removeState} />
        </div>
      </div>
    </div>
  )
}
