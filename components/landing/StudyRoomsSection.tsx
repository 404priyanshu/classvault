"use client";

import { useState, useEffect } from "react";
import { Users, Play, Pause, RefreshCw, CheckSquare, Flame, Sparkles } from "lucide-react";

export function StudyRoomsSection() {
  const [secondsLeft, setSecondsLeft] = useState<number>(1500); // 25:00
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(1500);
  };

  return (
    <section className="bg-paper px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Copy */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[9px] font-semibold text-ink-faint uppercase">
              Social Accountability
            </div>
            
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Study with people who are studying right now.
            </h2>
            
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Join silent focus rooms from your college or other colleges. Set your target goals, start the Pomodoro timer, and stay accountable alongside peers preparing for the same tests. No videos, no distractions — just silent, shared focus.
            </p>

            {/* Bullet features */}
            <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
              {[
                { title: "College-only rooms", desc: "Private rooms for your classmates." },
                { title: "Cross-college subject rooms", desc: "Sync with anyone studying DBMS or CN." },
                { title: "Pomodoro timer", desc: "Integrated session intervals." },
                { title: "Study streaks & rank", desc: "Build momentum with streaks." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-line bg-paper/60 p-3">
                  <h4 className="text-xs font-bold text-ink">{item.title}</h4>
                  <p className="text-[10px] text-ink-soft mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-lg bg-accent-soft p-3">
              <Sparkles className="h-4 w-4 text-accent shrink-0" />
              <p className="text-[11px] text-ink-soft leading-snug">
                <strong>AI summary:</strong> Receive a summary of resources shared and concepts learned in the room when the timer ends.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Focus Room Card */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-line pb-3.5">
                <div>
                  <span className="rounded bg-[#FFF0E6] px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#FF6B00] uppercase tracking-wider">
                    Silent Focus
                  </span>
                  <h3 className="text-sm font-bold text-ink mt-1">DBMS Exam Sprint</h3>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-ink-soft font-semibold bg-paper px-2 py-0.5 rounded border border-line">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  <span>18 students online</span>
                </div>
              </div>

              {/* Pomodoro Timer Center */}
              <div className="mt-6 text-center">
                <span className="font-mono text-5xl font-bold tracking-tight text-ink">
                  {formatTime(secondsLeft)}
                </span>
                
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={handleToggleTimer}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-4 text-xs font-semibold text-surface transition-colors hover:bg-accent-hover"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Start Timer
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleResetTimer}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line-strong bg-paper text-ink hover:bg-line transition-colors"
                    title="Reset"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Today's Goals inside the Room */}
              <div className="mt-6 border-t border-line/60 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Room study targets</span>
                  <span className="flex items-center gap-0.5 font-mono text-[9px] text-[#FF6B00]">
                    <Flame className="h-3 w-3 fill-current" />
                    Sprint Mode
                  </span>
                </div>
                
                <div className="mt-2.5 space-y-2 text-xs">
                  {[
                    "Finish Unit 2: SQL Subqueries",
                    "Solve last 3 years' Joins PYQs",
                    "Revise SQL Joins Cheat Sheet",
                  ].map((goal) => (
                    <div key={goal} className="flex items-center gap-2 rounded border border-line bg-paper/30 p-2.5">
                      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded bg-accent-soft text-accent">
                        <CheckSquare className="h-3 w-3" />
                      </span>
                      <span className="text-[11px] font-semibold text-ink-soft">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
