import Image from "next/image";
import {
  ArrowRight,
  Bookmark,
  Check,
  Download,
  FileText,
  FolderSearch,
  GraduationCap,
  LockKeyhole,
  Search,
  Sparkles,
  Star,
  UploadCloud,
} from "lucide-react";

import { initialNotes } from "@/lib/classvault-data";

const featuredNotes = initialNotes.slice(0, 5);
const marqueeItems = [
  "DBMS notes",
  "PYQs",
  "Lab manuals",
  "Unit summaries",
  "Assignments",
  "Course codes",
  "Bookmarked PDFs",
  "Exam revision",
];

const workflow = [
  {
    title: "Collect",
    text: "Students upload clean PDFs, slides, PYQs, and assignment files with the course metadata that makes them findable.",
    icon: UploadCloud,
  },
  {
    title: "Curate",
    text: "Ratings, bookmarks, and moderation-ready states turn scattered material into a trusted academic library.",
    icon: Star,
  },
  {
    title: "Revise",
    text: "Search by title, subject, semester, course code, unit, and topic when the exam clock starts to feel real.",
    icon: FolderSearch,
  },
];

const stats = [
  ["8.4K", "mock downloads"],
  ["4.8/5", "average rating"],
  ["12", "course collections"],
  ["1", "shared source of truth"],
];

export function ClassVaultLanding() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f1ea] text-[#0c0c0c]">
      <HeroSection />
      <MarqueeBand />
      <ProductProofSection />
      <WorkflowSection />
      <GallerySection />
      <SocialProofSection />
      <FinalCta />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0b0b0b] text-white">
      <div className="absolute inset-0">
        <Image
          src="/card_dbms.png"
          alt="ClassVault database systems resource"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-15 grayscale"
        />
        <div className="absolute inset-0 bg-[#0b0b0b]/76" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="ClassVault home">
          <Image
            src="/logo_badge.png"
            alt=""
            width={38}
            height={38}
            className="brightness-0 invert"
            style={{ width: "38px", height: "38px" }}
          />
          <span className="text-sm font-semibold">ClassVault</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/72 md:flex">
          <a href="#library" className="transition hover:text-white">Library</a>
          <a href="#workflow" className="transition hover:text-white">Workflow</a>
          <a href="#proof" className="transition hover:text-white">Proof</a>
        </nav>
        <a
          href="/app"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#d9ff64]"
        >
          Open preview
          <ArrowRight className="h-4 w-4" />
        </a>
      </header>

      <div id="top" className="relative z-10 mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-7xl flex-col justify-end px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-5 max-w-xl text-sm font-semibold uppercase text-[#d9ff64]">
              A shared academic resource hub for every semester
            </p>
            <h1 className="max-w-6xl text-6xl font-black leading-[0.92] md:text-8xl lg:text-9xl">
              Stop losing notes in group chats.
            </h1>
            <div className="mt-8 grid max-w-4xl gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <p className="max-w-2xl text-lg font-medium leading-8 text-white/72">
                ClassVault turns PDFs, previous-year questions, lab files, and assignment resources into one searchable college vault built for fast revision.
              </p>
              <a
                href="/app"
                className="inline-flex h-14 w-fit items-center gap-3 rounded-full bg-[#d9ff64] px-6 text-base font-bold text-black transition hover:bg-white"
              >
                See the system
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="hidden rounded-[2rem] border border-white/12 bg-white/10 p-3 shadow-2xl backdrop-blur md:block">
            <div className="rounded-[1.45rem] bg-white p-4 text-black">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
                    <Search className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase text-black/40">Search query</p>
                    <p className="text-sm font-bold">CS302 Unit 2</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#d9ff64] px-3 py-1 text-xs font-bold">12 hits</span>
              </div>
              <div className="mt-4 space-y-3">
                {featuredNotes.slice(0, 3).map((note) => (
                  <div key={note.id} className="rounded-2xl border border-black/10 p-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg bg-black px-2 py-1 text-[10px] font-bold text-white">
                        {note.fileType}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">{note.title}</p>
                        <p className="mt-1 text-xs font-semibold text-black/45">{note.courseCode} · Sem {note.semester}</p>
                      </div>
                      <Bookmark className="h-4 w-4 text-black/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarqueeBand() {
  return (
    <section aria-label="Resource types" className="overflow-hidden border-y border-black bg-[#d9ff64] py-4 text-black">
      <div className="classvault-marquee flex w-max items-center gap-6">
        {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-6 text-3xl font-black uppercase md:text-5xl">
            {item}
            <span className="h-3 w-3 rounded-full bg-black" />
          </span>
        ))}
      </div>
    </section>
  );
}

function ProductProofSection() {
  return (
    <section id="library" className="bg-[#f4f1ea] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-black/50">Built around the actual student hunt</p>
            <h2 className="mt-4 max-w-xl text-5xl font-black leading-none md:text-7xl">
              Find the file before the exam finds you.
            </h2>
          </div>
          <p className="max-w-2xl text-lg font-medium leading-8 text-black/62 lg:justify-self-end">
            ClassVault packages the core flows students expect: upload, browse, search, rate, bookmark, download, and manage personal uploads, ready for Supabase Auth, Storage, PostgreSQL, and Prisma later.
          </p>
        </div>

        <div id="demo" className="mt-12 overflow-hidden rounded-[2rem] border border-black bg-[#101010] p-3 shadow-[0_36px_90px_rgba(0,0,0,0.32)]">
          <div className="rounded-[1.45rem] bg-[#f8f8f5] p-4 sm:p-5 lg:p-6">
            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
              <aside className="rounded-3xl bg-black p-5 text-white">
                <Image
                  src="/logo_full.png"
                  alt="ClassVault"
                  width={148}
                  height={38}
                  className="brightness-0 invert"
                  style={{ width: "148px", height: "auto" }}
                />
                <div className="mt-8 space-y-2">
                  {["Explore", "Saved", "Uploads", "Moderation"].map((item, index) => (
                    <div
                      key={item}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold ${index === 0 ? "bg-[#d9ff64] text-black" : "bg-white/8 text-white/70"}`}
                    >
                      {item}
                      {index === 0 ? <ArrowRight className="h-4 w-4" /> : null}
                    </div>
                  ))}
                </div>
                <div className="mt-10 rounded-3xl border border-white/15 p-4">
                  <p className="text-xs font-bold uppercase text-white/38">Today</p>
                  <p className="mt-2 text-3xl font-black">{featuredNotes.length} files</p>
                  <p className="mt-2 text-sm font-medium text-white/50">Ready for revision sprint</p>
                </div>
              </aside>

              <section className="min-w-0 rounded-3xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-black/10 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-black/35">Global search</p>
                    <h3 className="mt-1 text-2xl font-black">Academic vault</h3>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-[#f4f1ea] px-4 py-3">
                    <Search className="h-4 w-4 shrink-0 text-black/40" />
                    <span className="truncate text-sm font-bold text-black/55">Search title, subject, unit, course code...</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  {featuredNotes.map((note) => (
                    <div key={note.id} className="grid gap-3 rounded-3xl border border-black/10 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                      <div className="relative h-16 w-full overflow-hidden rounded-2xl bg-black sm:w-20">
                        <Image src={note.coverImage ?? "/card_dbms.png"} alt="" fill sizes="120px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-black text-white">{note.fileType}</span>
                          <span className="rounded-full bg-[#d9ff64] px-2.5 py-1 text-[10px] font-black text-black">{note.courseCode}</span>
                        </div>
                        <p className="mt-2 truncate text-base font-black">{note.title}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-black/45">{note.subject} · {note.unit}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-black/55">
                        <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-black text-black" /> {note.rating.toFixed(1)}</span>
                        <span className="flex items-center gap-1"><Download className="h-4 w-4" /> {formatCompact(note.downloads)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="rounded-3xl bg-[#d9ff64] p-5">
                <p className="text-sm font-black uppercase text-black/45">Upload flow</p>
                <h3 className="mt-2 text-3xl font-black leading-none">Auto-publish resources with clean metadata.</h3>
                <div className="mt-8 space-y-3">
                  {["Title", "Course code", "Semester", "Unit", "Tags"].map((item, index) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl bg-black/8 px-4 py-3">
                      <span className="text-sm font-black">{item}</span>
                      {index < 4 ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-3xl border border-black bg-white p-5">
              <p className="text-4xl font-black">{value}</p>
              <p className="mt-2 text-sm font-bold uppercase text-black/45">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="bg-black px-4 py-16 text-white sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 className="max-w-4xl text-5xl font-black leading-none md:text-7xl">
            One workflow for the semester scramble.
          </h2>
          <p className="max-w-xl text-lg font-medium leading-8 text-white/62 lg:justify-self-end">
            The interface is designed for scanning, comparing, saving, and uploading resources without making students decode someone else&apos;s folder structure.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {workflow.map((item, index) => (
            <article key={item.title} className="rounded-[2rem] border border-white/14 bg-white/[0.06] p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white/36">0{index + 1}</span>
                <item.icon className="h-6 w-6 text-[#d9ff64]" />
              </div>
              <h3 className="mt-12 text-4xl font-black">{item.title}</h3>
              <p className="mt-5 text-base font-medium leading-7 text-white/58">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section className="overflow-hidden bg-[#f4f1ea] py-16 md:py-24">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase text-black/45">Resource gallery</p>
          <h2 className="mt-4 max-w-4xl text-5xl font-black leading-none md:text-7xl">
            Built for every kind of academic file students trade.
          </h2>
        </div>
      </div>
      <div className="mt-12 flex gap-4 overflow-hidden">
        <div className="classvault-slide flex min-w-max gap-4">
          {[...featuredNotes, ...featuredNotes].map((note, index) => (
            <article key={`${note.id}-${index}`} className="w-[280px] shrink-0 overflow-hidden rounded-[2rem] border border-black bg-white md:w-[380px]">
              <div className="relative h-56 bg-black md:h-72">
                <Image src={note.coverImage ?? "/card_dbms.png"} alt={note.title} fill sizes="380px" className="object-cover" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-black px-3 py-1.5 text-xs font-black text-white">{note.fileType}</span>
                  <span className="text-xs font-black uppercase text-black/40">{note.courseCode}</span>
                </div>
                <h3 className="mt-5 text-2xl font-black leading-7">{note.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-black/52">{note.topic}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  return (
    <section id="proof" className="bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] bg-black p-6 text-white md:p-8">
          <GraduationCap className="h-10 w-10 text-[#d9ff64]" />
          <blockquote className="mt-12 text-4xl font-black leading-tight md:text-5xl">
            “Before ClassVault, revision links lived in five different groups. Now the useful files rise to the top.”
          </blockquote>
          <div className="mt-10 flex items-center gap-3">
            <Image src="/avatar_riya.png" alt="Riya Patel" width={48} height={48} className="rounded-full" />
            <div>
              <p className="font-black">Riya Patel</p>
              <p className="text-sm font-semibold text-white/45">CSE student, semester 3</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Searchable by course code", Search],
            ["Secure storage direction", LockKeyhole],
            ["Ratings reveal useful notes", Star],
            ["Downloads stay one click away", Download],
          ].map(([label, Icon]) => (
            <div key={String(label)} className="rounded-[2rem] border border-black bg-[#f4f1ea] p-6">
              <Icon className="h-7 w-7" />
              <p className="mt-12 text-2xl font-black leading-8">{String(label)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-[#d9ff64] px-4 py-16 text-black sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <h2 className="max-w-5xl text-6xl font-black leading-none md:text-8xl">
            Make notes easier to find than messages.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a href="/app" className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-black px-6 text-base font-bold text-white transition hover:bg-white hover:text-black">
              View prototype
              <ArrowRight className="h-5 w-5" />
            </a>
            <a href="#library" className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-black px-6 text-base font-bold transition hover:bg-black hover:text-white">
              Browse features
              <FileText className="h-5 w-5" />
            </a>
          </div>
        </div>
        <footer className="mt-14 flex flex-col gap-4 border-t border-black/30 pt-6 text-sm font-bold text-black/60 md:flex-row md:items-center md:justify-between">
          <p>ClassVault · UI prototype for Supabase Auth, Storage, PostgreSQL, and Prisma integration.</p>
          <p>Next.js · TypeScript · Tailwind CSS · Geist</p>
        </footer>
      </div>
    </section>
  );
}

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return String(value);
}
