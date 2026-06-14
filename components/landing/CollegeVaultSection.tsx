"use client";

import { Mail, CheckCircle, ShieldCheck, Lock, Users, Award } from "lucide-react";

export function CollegeVaultSection() {
  const benefits = [
    { icon: Lock, label: "Private college notes", desc: "Access study sheets, class folders, and syllabus files shared specifically for your university code." },
    { icon: Users, label: "Semester-wise groups", desc: "Collaborate directly in community channels mapped to your current sem and course curriculum." },
    { icon: FileCheckIcon, label: "College PYQs", desc: "Access the exact end-sem and mid-sem question papers from your campus's history." },
    { icon: ShieldCheck, label: "Verified student badge", desc: "Display a verification check on your profile so uploads are instantly trusted." },
    { icon: Award, label: "Trusted uploader status", desc: "Earn points and reputational badges when your notes help other students pass." },
  ];

  function FileCheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    );
  }

  return (
    <section className="border-t border-b border-line bg-paper-warm px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Visual Email Badge Card */}
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-line pb-3.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-accent-soft text-accent">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <span className="font-mono text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                  Campus Verification
                </span>
              </div>
              
              {/* Simulated verification step */}
              <div className="mt-4 rounded-lg border border-line bg-paper p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Step 1: Sign up</p>
                <p className="text-xs font-semibold text-ink mt-0.5">Use your personal Gmail/Email account</p>
                
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Step 2: Campus Lock</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[".edu", ".edu.in", ".ac.in", "college.edu"].map((ext) => (
                    <span key={ext} className="rounded border border-line bg-surface px-2 py-0.5 font-mono text-[9px] text-ink-soft">
                      {ext}
                    </span>
                  ))}
                </div>
                
                {/* Simulated Verify Input */}
                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      disabled
                      placeholder="student@university.edu.in"
                      className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-soft focus:outline-none"
                    />
                    <CheckCircle className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-success" />
                  </div>
                  <button
                    disabled
                    className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-surface"
                  >
                    Verified
                  </button>
                </div>
              </div>

              {/* Student badge display */}
              <div className="mt-4 rounded-lg border border-line bg-paper/50 p-3 flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-accent-soft flex items-center justify-center font-bold text-accent text-sm">
                    SK
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-success text-surface border-2 border-surface">
                    <CheckCircle className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-ink">Siddharth Kumar</p>
                    <span className="rounded-full bg-success/10 px-1.5 py-0.2 font-mono text-[8px] font-semibold text-success uppercase">
                      VERIFIED STUDENT
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-soft mt-0.5">IIT Kharagpur · Computer Science</p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Copy */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[9px] font-semibold text-ink-faint uppercase">
              Closed Loops
            </div>
            
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Join your college vault.
            </h2>
            
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Sign up with Gmail normally, then verify your official college email domain to unlock your private campus vault. Access local notes, study rooms, exam reviews, and semester groups specific to your college peers.
            </p>

            {/* List of unlocks */}
            <div className="mt-8 space-y-4">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex gap-3 items-start">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-soft text-accent mt-0.5">
                      <Icon className="h-3 w-3" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">{item.label}</p>
                      <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
