import Link from "next/link";
import { HeroSection } from "./landing/HeroSection";
import { PainSection } from "./landing/PainSection";
import { AIRoadmapSection } from "./landing/AIRoadmapSection";
import { ResourceCaptureSection } from "./landing/ResourceCaptureSection";
import { ExamModeSection } from "./landing/ExamModeSection";
import { CollegeVaultSection } from "./landing/CollegeVaultSection";
import { StudyRoomsSection } from "./landing/StudyRoomsSection";
import { FeatureGrid } from "./landing/FeatureGrid";
import { HowItWorksSection } from "./landing/HowItWorksSection";
import { FinalCTA } from "./landing/FinalCTA";

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="ClassVault home">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent font-mono text-[10px] font-semibold text-surface">
        CV
      </span>
      <span className="text-sm font-semibold tracking-tight">ClassVault</span>
    </Link>
  );
}

export function ClassVaultLanding() {
  return (
    <div className="landing-theme min-h-screen bg-paper text-ink selection:bg-accent selection:text-surface">
      <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Wordmark />
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft sm:flex">
            <a href="#features" className="transition hover:text-ink">
              Features
            </a>
            <a href="#ai-roadmaps" className="transition hover:text-ink">
              AI Roadmaps
            </a>
            <a href="#study-rooms" className="transition hover:text-ink">
              Study Rooms
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

      <main>
        <HeroSection />
        <PainSection />
        
        <div id="ai-roadmaps">
          <AIRoadmapSection />
        </div>
        
        <ResourceCaptureSection />
        <ExamModeSection />
        <CollegeVaultSection />
        
        <div id="study-rooms">
          <StudyRoomsSection />
        </div>
        
        <div id="features">
          <FeatureGrid />
        </div>
        
        <HowItWorksSection />
        <FinalCTA />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-ink-soft">ClassVault</span>
          <div className="flex gap-5">
            <a href="#features" className="transition hover:text-ink">
              Features
            </a>
            <a href="#ai-roadmaps" className="transition hover:text-ink">
              AI Roadmaps
            </a>
            <a href="#study-rooms" className="transition hover:text-ink">
              Study Rooms
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
    </div>
  );
}
