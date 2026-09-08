import { Check } from 'lucide-react'
import Image from 'next/image'
import clubhouse from '@/assets/study-clubhouse.webp'
import { Brand } from '@/components/ui/Brand'
import { STEPS } from './constants'

export function StepSidebar({ step }: { step: number }) {
  return (
    <aside className="club-onboarding-sidebar">
      <Brand light />
      <h2>A little setup.<em>A place of your own.</em></h2>
      <ol className="club-onboarding-steps">
        {STEPS.map((item, index) => (
          <li key={item.label} aria-current={index === step ? 'step' : undefined}>
            <span className="club-onboarding-number">{index < step ? <Check size={16} /> : index + 1}</span>
            <div><strong className="text-sm">{item.label}</strong><p className="mt-1 text-xs leading-relaxed">{item.description}</p></div>
          </li>
        ))}
      </ol>
      <Image src={clubhouse} alt="" className="club-onboarding-art" sizes="340px" />
      <p className="mt-4 text-center text-xs">Your study crew is waiting.</p>
    </aside>
  )
}
