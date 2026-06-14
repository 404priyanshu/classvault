"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-line bg-paper px-5 py-24 sm:py-32">
      {/* Background soft gradient overlay */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft/30 blur-[100px]" />

      <div className="mx-auto max-w-xl text-center">
        <div className="inline-flex items-center gap-1 rounded bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider">
          <Sparkles className="h-3 w-3" />
          Get Started Today
        </div>
        
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Ready to stop hunting for notes?
        </h2>
        
        <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
          Build your study vault, generate your roadmap, and start preparing with absolute clarity. Join your college community today.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/app"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-6 text-sm font-medium text-surface transition-colors hover:bg-accent-hover"
          >
            Start your vault
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/app"
            className="inline-flex h-11 items-center rounded-md border border-line-strong bg-surface px-6 text-sm font-medium text-ink hover:bg-paper-warm hover:border-ink/20 transition-colors"
          >
            Browse notes
          </Link>
        </div>
      </div>
    </section>
  );
}
