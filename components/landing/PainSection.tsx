import { ArrowRight } from "lucide-react";

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.753-1.464L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.116-2.887-6.983a9.782 9.782 0 00-6.979-2.898c-5.433 0-9.859 4.42-9.863 9.865-.001 1.838.503 3.626 1.458 5.187l-.955 3.486 3.578-.938zm11.367-7.632c-.3-.15-1.77-.875-2.04-.975-.27-.1-.47-.15-.67.15-.2.3-.77.975-.95 1.175-.17.2-.35.225-.65.075-.3-.15-1.26-.465-2.4-1.48-.88-.785-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.14-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.67-1.625-.92-2.225-.24-.58-.48-.5-.67-.51-.18-.01-.38-.01-.58-.01-.2 0-.52.075-.8.375-.27.3-1.04 1.02-1.04 2.485s1.07 2.87 1.21 3.075c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.5 1.7.63.72.225 1.37.195 1.88.12.57-.085 1.77-.72 2.01-1.415.24-.7.24-1.3 0-1.425-.07-.12-.27-.2-.57-.35z" />
    </svg>
  );
}

function GoogleDriveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9.13 3.5h5.74L22.25 16.5h-5.74z" fill="#FFC107" />
      <path d="M1.75 16.5l3.75-6.5h11.48l-3.75 6.5z" fill="#4CAF50" />
      <path d="M5.5 10L9.13 3.5l7.38 13H12.75z" fill="#2196F3" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18l-2.05 9.68c-.15.68-.56.85-1.13.53l-3.13-2.3-1.51 1.45c-.17.17-.31.31-.63.31l.22-3.18 5.79-5.23c.25-.22-.05-.35-.39-.13l-7.16 4.5-3.08-.96c-.67-.21-.68-.67.14-.99l12.02-4.63c.56-.2 1.05.14.88.96z" />
    </svg>
  );
}

export function PainSection() {
  const sources = [
    {
      app: "WhatsApp",
      icon: WhatsAppIcon,
      color: "text-[#25D366]",
      bg: "bg-[#25D366]/5",
      border: "border-[#25D366]/15",
      context: "Group Chat",
      msg: "“Can someone share Unit 3 notes? Exam is tomorrow!”",
      meta: "Shared 20 times, lost in media folder",
    },
    {
      app: "Google Drive",
      icon: GoogleDriveIcon,
      color: "text-[#34A853]",
      bg: "bg-[#34A853]/5",
      border: "border-[#34A853]/15",
      context: "Shared Folder",
      msg: "“Access Denied. Request access or switch accounts.”",
      meta: "3 nested subfolders, unnamed PDFs",
    },
    {
      app: "YouTube",
      icon: YoutubeIcon,
      color: "text-[#FF0000]",
      bg: "bg-[#FF0000]/5",
      border: "border-[#FF0000]/15",
      context: "Watch Later",
      msg: "“2-hour lecture playlist on networking protocols”",
      meta: "Saved 3 months ago, never watched",
    },
    {
      app: "Telegram",
      icon: TelegramIcon,
      color: "text-[#0088CC]",
      bg: "bg-[#0088CC]/5",
      border: "border-[#0088CC]/15",
      context: "Channels & Bots",
      msg: "“CN_final_notes_revised_v2_temp.pdf (78MB)”",
      meta: "Expired link, download failed twice",
    },
  ];

  return (
    <section className="border-t border-b border-line bg-paper-warm px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            The Student Struggle
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your study material is everywhere.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-ink-soft sm:text-base">
            Notes are in WhatsApp. PYQs are in someone&apos;s Drive. Lectures are saved on YouTube. Important PDFs are lost in Telegram. And nobody knows what to study first.
          </p>
        </div>

        {/* Grid of Scattered Platforms */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((src) => {
            const Icon = src.icon;
            return (
              <div
                key={src.app}
                className={`relative overflow-hidden rounded-xl border bg-surface p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${src.border}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${src.bg} ${src.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-wider text-ink-soft uppercase">
                    {src.app}
                  </span>
                  <span className="ml-auto rounded-full bg-paper px-2 py-0.5 font-mono text-[9px] text-ink-faint">
                    {src.context}
                  </span>
                </div>
                
                <p className="mt-5 text-xs font-medium italic leading-relaxed text-ink">
                  {src.msg}
                </p>
                
                <div className="mt-4 border-t border-line/60 pt-3">
                  <span className="text-[10px] text-ink-faint">{src.meta}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transition Box */}
        <div className="mt-12 flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
            <ArrowRight className="h-4 w-4 rotate-90" />
          </div>
          
          <div className="mt-8 w-full rounded-xl border border-line bg-surface p-6 text-center shadow-lg sm:p-8">
            <div className="inline-flex items-center gap-2 rounded bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              The StudyVault Solution
            </div>
            <h3 className="mt-4 text-xl font-semibold text-ink sm:text-2xl">
              StudyVault puts it all in one place — and turns it into a guided study plan.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-ink-soft sm:text-sm">
              We compile personal uploads, shared links, YouTube playlists, and previous years&apos; question papers into a structured interface so you stop searching and start learning.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
