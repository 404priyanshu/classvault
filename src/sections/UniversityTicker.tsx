import pattern from '@/assets/pattern.webp'

const universities = [
  'IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'Delhi University', 'Anna University',
  'VIT Vellore', 'NIT Trichy', 'Jadavpur University', 'SRM University', 'Mumbai University',
  'IIIT Hyderabad', 'Christ University', 'Manipal University', 'Osmania University',
]

export default function UniversityTicker() {
  const row = [...universities, ...universities]
  return (
    <section
      className="border-b-[1.5px] border-[#171512]/20 bg-[#efe8d8] py-7"
      style={{ backgroundImage: `url(${pattern.src})`, backgroundSize: '768px' }}
    >
      <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.3em] text-[#171512]/55">
        Communities across India&apos;s campuses
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-marquee flex w-max items-center gap-10 px-4">
          {row.map((u, i) => (
            <span key={i} className="font-display whitespace-nowrap text-lg font-bold italic text-[#171512]/50 transition-colors hover:text-[#17453a]">
              {u} <span className="not-italic text-[#e8890c]">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
