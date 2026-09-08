import Link from 'next/link'
import { VaultMark } from '@/components/landing/VaultMark'
import { cn } from '@/lib/utils'

export function Brand({ href = '/', light = false, className }: { href?: string; light?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn('club-brand', light && 'club-brand-light', className)} aria-label="ClassVault home">
      <VaultMark className="club-brand-mark" />
      <span>ClassVault</span>
    </Link>
  )
}
