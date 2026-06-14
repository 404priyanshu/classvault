import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  FileText,
  Search,
  ShieldCheck,
  Star,
  Upload,
  type LucideIcon,
} from "lucide-react";

const features: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Search,
    title: "Find anything in seconds",
    body: "One search across notes, previous-year questions, lab manuals, and slides — filtered by subject, semester, and course code.",
  },
  {
    icon: Upload,
    title: "Share what you make",
    body: "Upload your notes with clean metadata so the next batch finds them exactly when they need them.",
  },
  {
    icon: Bookmark,
    title: "Build your revision set",
    body: "Save the resources that matter, keep them in one place, and walk into exams with everything sorted.",
  },
  {
    icon: ShieldCheck,
    title: "Know what you're reading",
    body: "Every file shows its uploader, rating, and download history — so quality is visible before you open it.",
  },
];

const steps: Array<[string, string, string]> = [
  ["01", "Browse the library", "Search or filter the shared collection for your course and semester."],
  ["02", "Save your set", "Bookmark what you need and keep your revision material in one vault."],
  ["03", "Give back", "Upload your own notes and help the library grow for everyone after you."],
];

const previewRows: Array<[string, string, string, string]> = [
  ["DBMS – Unit 2 Notes", "CS302", "PDF", "5.0"],
  ["Computer Networks – PYQs", "CS401", "PDF", "4.7"],
  ["Data Structures – Trees", "CS201", "PDF", "4.9"],
  ["OS – Memory Management", "CS401", "PDF", "4.7"],
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="ClassVault home">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-ink font-mono text-[10px] font-semibold text-surface">
        CV
      </span>
      <span className="text-sm font-semibold tracking-tight">ClassVault</span>
    </Link>
  );
}

export function ClassVaultLanding() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Wordmark />
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft sm:flex">
            <a href="#features" className="transition hover:text-ink">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-ink">
              How it works
            </a>
          </nav>
          <Link
            href="/app"
            className="inline-flex h-8 items-center rounded-md bg-ink px-3 text-sm font-medium text-surface transition hover:bg-ink/85"
          >
            Open app
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-20 pt-20 sm:pt-28">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
          Notes · PYQs · Lab manuals
        </p>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
          Every note your class ever made, in one vault.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft">
          ClassVault is a shared library for your batch. Find the notes worth reading,
          save your revision set, and pass on what you make — without digging through
          group chats ever again.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/app"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-surface transition hover:bg-ink/85"
          >
            Start browsing
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
          >
            How it works
          </a>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="landing-skew-card overflow-hidden rounded-lg border border-line shadow-[0_16px_40px_rgba(28,25,23,0.06)]">
            <div className="flex h-10 items-center gap-2 border-b border-line bg-paper px-4">
              <span className="h-2.5 w-2.5 rounded-full border border-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full border border-line-strong" />
              <span className="h-2.5 w-2.5 rounded-full border border-line-strong" />
              <span className="ml-3 hidden rounded border border-line bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-faint sm:block">
                classvault.app
              </span>
            </div>
            <div className="grid sm:grid-cols-[180px_1fr]">
              <aside className="hidden border-r border-line bg-paper p-3 sm:block">
                {["Dashboard", "Library", "Saved", "Uploads", "Profile"].map((item, index) => (
                  <div
                    key={item}
                    className={
                      index === 1
                        ? "mb-0.5 rounded-md bg-surface px-2.5 py-1.5 text-sm font-medium shadow-[inset_0_0_0_1px_var(--line)]"
                        : "mb-0.5 px-2.5 py-1.5 text-sm font-medium text-ink-faint"
                    }
                  >
                    {item}
                  </div>
                ))}
              </aside>
              <div className="bg-surface p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold tracking-tight">Library</h2>
                  <div className="flex h-8 w-48 items-center gap-2 rounded-md border border-line bg-paper px-2.5 text-xs text-ink-faint">
                    <Search className="h-3.5 w-3.5" />
                    Search resources…
                    <kbd className="ml-auto font-mono text-[10px]">⌘K</kbd>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {previewRows.map(([title, course, type, rating]) => (
                    <div
                      key={title}
                      className="landing-preview-row flex items-center gap-3 rounded-lg border border-line p-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-paper font-mono text-[9px] font-semibold text-ink-soft">
                        {type}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
                      <span className="hidden font-mono text-xs text-ink-faint sm:block">{course}</span>
                      <span className="flex items-center gap-1 font-mono text-xs text-ink-faint">
                        <Star className="h-3 w-3" />
                        {rating}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-5 py-20">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
          Features
        </p>
        <h2 className="mt-4 max-w-lg text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          A library, not a link dump.
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="feature-tilt-card bg-surface p-6 sm:p-7">
              <feature.icon className="h-5 w-5 text-ink-soft" />
              <h3 className="mt-6 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
            How it works
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Three steps, one shared vault.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map(([index, title, body]) => (
              <div key={index} className="feature-tilt-card border-t border-line pt-5">
                <p className="font-mono text-xs text-ink-faint">{index}</p>
                <h3 className="mt-3 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-5 py-20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FileText className="h-5 w-5 text-ink-faint" />
            <h2 className="mt-4 max-w-md text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Stop scrolling group chats for notes.
            </h2>
          </div>
          <Link
            href="/app"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-surface transition hover:bg-ink/85"
          >
            Open ClassVault
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-ink-soft">ClassVault</span>
          <div className="flex gap-5">
            <a href="#features" className="transition hover:text-ink">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-ink">
              How it works
            </a>
            <Link href="/privacy" className="transition hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-ink">
              Terms
            </Link>
            <Link href="/app" className="transition hover:text-ink">
              Open app
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
