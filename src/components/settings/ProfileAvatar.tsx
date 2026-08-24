import Image from 'next/image'
import { cn } from '@/lib/utils'

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function ProfileAvatar({
  avatarUrl,
  className,
  displayName,
}: {
  avatarUrl: string | null
  className?: string
  displayName: string
}) {
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#171512]/20 bg-[#f0a202] font-display font-black text-[#171512]',
        className,
      )}
    >
      {avatarUrl ? (
        <Image
          alt={`${displayName}'s profile photo`}
          className="object-cover"
          fill
          sizes="96px"
          src={avatarUrl}
          unoptimized={avatarUrl.startsWith('blob:')}
        />
      ) : (
        initialsFor(displayName) || 'CV'
      )}
    </span>
  )
}
