import { BookOpen, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import owl from '@/assets/owl.webp'
import { STEPS } from './constants'

export function StepSidebar({ step }: { step: number }) {
  return (
    <aside className="hidden border-r-[1.5px] border-[#171512]/35 px-9 py-10 lg:flex lg:flex-col">
      <Link className="flex items-center gap-2.5" href="/">
        <span className="grid h-10 w-10 place-items-center rounded-lg border-[1.5px] border-[#171512] bg-[#17453a] shadow-[3px_3px_0_#171512]">
          <BookOpen className="h-5 w-5 text-[#f6f1e5]" />
        </span>
        <span className="font-display text-xl font-black">
          Class<span className="text-[#17453a]">Vault</span>
        </span>
      </Link>

      <h1 className="font-display mt-16 text-6xl font-black leading-[0.93] tracking-[-0.04em]">
        Make
        <br />
        ClassVault
        <br />
        <span className="italic text-[#17453a]">yours.</span>
      </h1>

      <ol className="mt-14 space-y-1">
        {STEPS.map((item, index) => {
          const Icon = item.icon
          const isActive = index === step
          const isComplete = index < step

          return (
            <li className="relative flex min-h-24 gap-4" key={item.label}>
              {index < STEPS.length - 1 ? (
                <span
                  className={`absolute left-[19px] top-10 h-[calc(100%-16px)] border-l-[1.5px] ${
                    index < step
                      ? 'border-[#17453a]'
                      : 'border-dashed border-[#171512]/35'
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] text-sm font-black ${
                  isActive || isComplete
                    ? 'border-[#17453a] bg-[#17453a] text-[#f6f1e5]'
                    : 'border-[#171512] bg-[#f6f1e5]'
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <div className="pt-1">
                <div
                  className={`flex items-center gap-2 font-bold ${
                    isActive ? 'text-[#17453a]' : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#171512]/50">
                  {item.description}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-auto flex items-end gap-3 pt-6">
        <Image
          alt=""
          aria-hidden
          className="h-auto w-24"
          draggable={false}
          src={owl}
        />
        <p className="font-hand pb-3 text-xl leading-tight text-[#17453a]">
          Small setup.
          <br />
          Smarter semester.
        </p>
      </div>
    </aside>
  )
}
