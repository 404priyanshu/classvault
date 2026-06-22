import { BookOpenCheck, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { cx } from "@/lib/cx";
import {
  roadmapChartHeight,
  roadmapCompletedCount,
  roadmapPathData,
  roadmapPillStyle,
  roadmapProgress,
  type RoadmapDay,
} from "@/components/views/roadmaps/roadmap-data";

export function RoadmapTimelineChart({
  days,
  activeIndex,
  hoveredIndex,
  onSelect,
  onHover,
  includeClassroomMaterials = false,
}: {
  days: RoadmapDay[];
  activeIndex: number;
  hoveredIndex: number | null;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  includeClassroomMaterials?: boolean;
}) {
  const totalTasks = days.reduce((sum, day) => sum + day.done.length, 0);
  const completedTasks = days.reduce((sum, day) => sum + roadmapCompletedCount(day), 0);
  const totalResources = days.reduce((sum, day) => sum + day.resources.length, 0);
  const activeDay = days[activeIndex] ?? days[0];
  const chartHeight = roadmapChartHeight(days.length);

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            <Sparkles className="h-3 w-3 text-accent" />
            Journey highlights
          </span>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-ink">Timeline</h3>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            {activeDay
              ? `Now viewing Day ${activeDay.day}: ${activeDay.title}`
              : "Select a day to inspect its plan."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:w-auto">
          {[
            { label: "Sessions", value: String(days.length), icon: Clock },
            { label: "Tasks", value: `${completedTasks}/${totalTasks}`, icon: CheckCircle2 },
            { label: "Sources", value: String(totalResources), icon: BookOpenCheck },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-line bg-paper px-2.5 py-2">
              <div className="flex items-center gap-1.5 text-ink">
                <item.icon className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono text-sm font-bold">{item.value}</span>
              </div>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-ink-faint">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {days.map((day, index) => {
          const isActive = activeIndex === index;
          const progress = roadmapProgress(day);
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => onSelect(index)}
                                                        className={cx(
                "timeline-pill min-w-0 rounded-xl border p-4 text-left",
                isActive
                  ? "border-accent bg-surface ring-2 ring-accent/30"
                  : progress === 100
                    ? "border-neutral-500/30 bg-neutral-50/45 hover:bg-neutral-50"
                    : "border-line bg-paper hover:border-line-strong",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cx(
                    "rounded px-2 py-0.5 font-mono text-[9px] font-semibold uppercase",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : progress === 100
                        ? "bg-neutral-500/10 text-neutral-700"
                        : "bg-surface text-ink-soft",
                  )}
                >
                  Day {day.day}
                </span>
                <span
                  className={cx(
                    "font-mono text-[10px] font-bold",
                    progress === 100 ? "text-neutral-600" : "text-ink-soft",
                  )}
                >
                  {progress === 100 ? "✓ Done" : `${progress}% done`}
                </span>
              </div>
              <h4 className="mt-3 break-words text-sm font-bold leading-snug text-ink">
                {day.title}
              </h4>
              <p className="mt-1 text-xs leading-5 text-ink-soft">{day.topic}</p>

              <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink-faint border-t border-line/40 pt-3">
                <span>{day.resources.length} sources</span>
                <span>{day.tasks.length} tasks</span>
                <span>{day.pyqs.length} pyqs</span>
              </div>

              <span className="mt-3 block h-1 overflow-hidden rounded-full bg-line/60">
                <span
                  className={cx(
                    "block h-full rounded-full transition-all",
                    progress === 100 ? "bg-neutral-500" : "bg-accent",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden md:block">
        <div className="-mx-2 overflow-x-auto px-2 pb-4">
          <div
            className="relative min-w-[820px] overflow-hidden rounded-xl border border-line bg-paper/70 p-4"
            style={{ height: `${chartHeight}px` }}
          >
            {/* Curved Connection Path with Glow Effect */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              viewBox={`0 0 1000 ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <path
                d={roadmapPathData(days.length)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                className="animate-roadmap-path opacity-15 blur-[2px]"
              />
              <path
                d={roadmapPathData(days.length)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.8"
                className="animate-roadmap-path opacity-60"
              />
            </svg>

            {/* Column Dashed Lines */}
            <div
              className="absolute inset-0 grid pointer-events-none"
              style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            >
              {days.map((day, index) => (
                <div
                  key={day.day}
                  className={cx(
                    "h-full border-dashed border-line",
                    index < days.length - 1 && "border-r",
                  )}
                />
              ))}
            </div>

            {/* Glowing Path Dots */}
            {days.map((day, index) => {
              const colWidth = 100 / days.length;
              const leftCenter = index * colWidth + colWidth / 2;
              const topCenter = index * 76 + 67;
              const isActive = activeIndex === index;
              const progress = roadmapProgress(day);
              const isCompleted = progress === 100;

              return (
                <div
                  key={`dot-${day.day}`}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${leftCenter}%`,
                    top: `${topCenter}px`,
                  }}
                >
                  {isActive && (
                    <div className="absolute inset-0 -m-1.5 rounded-full bg-accent/20 animate-ping" />
                  )}
                  <div
                    className={cx(
                      "h-3 w-3 rounded-full border-2 transition-all shadow-sm",
                      isActive
                        ? "border-accent bg-surface"
                        : isCompleted
                          ? "border-neutral-500 bg-neutral-500"
                          : "border-line bg-paper",
                    )}
                  />
                </div>
              );
            })}

            {/* Premium Active Focus Badge */}
            <div className="absolute right-4 top-4 rounded-xl border border-line bg-surface/90 backdrop-blur-md px-3.5 py-2 text-right shadow-sm transition-all duration-300">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
                Active focus
              </span>
              <span className="mt-1 block max-w-[240px] break-words text-[11px] font-bold leading-snug text-ink">
                {activeDay?.title}
              </span>
            </div>

            {/* Redesigned Roadmap Pills */}
            {days.map((day, index) => {
              const isHovered = hoveredIndex === index;
              const isActive = activeIndex === index;
              const progress = roadmapProgress(day);
              return (
                <button
                  key={day.day}
                  type="button"
                  onMouseEnter={() => onHover(index)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onSelect(index)}
                  style={roadmapPillStyle(index, days.length)}
                                                                        className={cx(
                    "timeline-pill absolute z-20 flex h-[98px] min-w-0 flex-col justify-between rounded-xl p-3 text-left text-xs font-semibold shadow-sm border",
                    isActive
                      ? "border-accent bg-surface text-ink ring-4 ring-accent-soft/40"
                      : progress === 100
                        ? "border-neutral-500/40 bg-neutral-50/60 text-ink hover:border-neutral-500"
                        : isHovered
                          ? "border-line-strong bg-paper text-ink"
                          : "border-line bg-surface text-ink",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span
                      className={cx(
                        "font-mono text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded",
                        isActive
                          ? "bg-accent/10 text-accent"
                          : progress === 100
                            ? "bg-neutral-500/10 text-neutral-700"
                            : "bg-paper text-ink-soft",
                      )}
                    >
                      Day {day.day}
                    </span>
                    <span
                      className={cx(
                        "font-mono text-[9px] font-bold",
                        progress === 100 ? "text-neutral-600" : "text-ink-soft",
                      )}
                    >
                      {progress === 100 ? "✓ Done" : `${progress}%`}
                    </span>
                  </div>

                  <span className="line-clamp-2 break-words text-[11px] leading-tight font-bold text-ink/90 my-1">
                    {day.title}
                  </span>

                  <div className="space-y-1.5 w-full mt-auto">
                    <div className="flex items-center justify-between text-[9px] font-bold text-ink-faint">
                      <span>{day.tasks.length + day.pyqs.length} tasks</span>
                      <span>{day.resources.length} sources</span>
                    </div>
                    <span className="block h-1 overflow-hidden rounded-full bg-line/60">
                      <span
                        className={cx(
                          "block h-full rounded-full transition-all",
                          progress === 100 ? "bg-neutral-500" : "bg-accent",
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Staggered Day Cards Grid - Dynamic Column Count */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((day, index) => {
            const isActive = activeIndex === index;
            const progress = roadmapProgress(day);
            return (
              <button
                key={day.day}
                type="button"
                onClick={() => onSelect(index)}
                                                                className={cx(
                  "timeline-pill min-w-0 rounded-xl border p-3 text-left",
                  isActive
                    ? "border-accent bg-accent-soft/50 shadow-sm"
                    : progress === 100
                      ? "border-neutral-500/20 bg-neutral-50/30 hover:bg-neutral-50/50"
                      : "border-line bg-paper hover:border-line-strong",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint">
                    Day {day.day}
                  </span>
                  {progress === 100 && (
                    <span className="text-[10px] text-neutral-600 font-bold">✓</span>
                  )}
                </div>
                <h4 className="mt-1 break-words text-xs font-bold leading-snug text-ink line-clamp-1">
                  {day.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-ink-soft">{day.topic}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">
              Sequencing
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
              Prerequisites flow left to right.
            </span>
          </div>
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">
              Evidence
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
              {totalResources} resources mapped into sessions.
            </span>
          </div>
          <div className="rounded-lg border border-line bg-paper px-3 py-2">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-faint">
              Mode
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
              {includeClassroomMaterials
                ? "Classroom materials included."
                : "Preview sandbox with sample sources."}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
