"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  Compass,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Plus,
  PlusCircle,
  Settings,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { initialsOf } from "@/lib/format";
import { AppShellProvider, useAppShell } from "@/components/app-shell/app-shell-context";
import { AuthPreviewBanner } from "@/components/app-shell/chrome";
import { SearchCommandPalette } from "@/components/app-shell/search-command-palette";
import { NotificationsBell } from "@/components/app-shell/notifications-bell";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Study",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/roadmaps", label: "AI Roadmaps", icon: Compass },
      { href: "/app/exam", label: "Exam Mode", icon: Flame },
      { href: "/app/rooms", label: "Study Rooms", icon: Users },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/app/library", label: "Library", icon: BookOpen },
      { href: "/app/saved", label: "Saved", icon: Bookmark },
      { href: "/app/collections", label: "Collections", icon: FolderOpen },
      { href: "/app/add-resource", label: "Add Resource", icon: PlusCircle },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/app/college-vault", label: "College Vault", icon: GraduationCap },
      { href: "/app/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
];

const ADMIN_SECTION: NavSection = {
  label: "Admin",
  items: [{ href: "/app/review", label: "Review queue", icon: FileText }],
};

const MOBILE_NAV: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/roadmaps", label: "Roadmaps", icon: Compass },
  { href: "/app/library", label: "Library", icon: BookOpen },
  { href: "/app/rooms", label: "Rooms", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const VIEW_TITLES: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/roadmaps": "AI Study Roadmaps",
  "/app/exam": "Exam Mode",
  "/app/rooms": "Silent Study Rooms",
  "/app/library": "Library",
  "/app/saved": "Saved",
  "/app/collections": "Collections",
  "/app/add-resource": "Add Resource",
  "/app/college-vault": "College Vault Verification",
  "/app/leaderboard": "Leaderboard",
  "/app/settings": "Settings",
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { me, authChecked, openUpload, showAuthBanner, dismissAuthBanner } = useAppShell();

  const title = VIEW_TITLES[pathname] ?? "ClassVault";
  const profileName = me?.name ?? (authChecked ? "Preview mode" : "Loading...");
  const profileEmail = me?.email ?? (authChecked ? "Sign in to save and upload" : "");
  const canModerate = me?.role === "ADMIN" || me?.role === "MODERATOR";
  const sections = canModerate ? [...NAV_SECTIONS, ADMIN_SECTION] : NAV_SECTIONS;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-xs font-bold text-surface">CV</span>
          <span className="text-sm font-bold tracking-tight">ClassVault</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          {sections.map((section) => (
            <div key={section.label} className="py-2">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                {section.label}
              </span>
              <nav className="mt-1 grid gap-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "flex items-center gap-3 rounded-md px-2 py-1.5 text-xs font-semibold transition",
                      isActive(pathname, item.href)
                        ? "bg-paper text-ink"
                        : "text-ink-soft hover:bg-paper hover:text-ink",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <Link
          href="/app/settings"
          className={cx(
            "flex items-center gap-3 border-t border-line p-3 text-left transition hover:bg-paper",
            isActive(pathname, "/app/settings") ? "bg-paper" : "",
          )}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[10px] font-bold text-surface">
            {initialsOf(me?.name ?? "Guest")}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-ink">{profileName}</span>
            <span className="block truncate text-[10px] text-ink-faint">{profileEmail}</span>
          </span>
        </Link>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-line bg-surface px-2 pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex min-w-14 flex-1 flex-col items-center gap-1 rounded-md px-1 py-1 text-[10px] font-semibold",
              isActive(pathname, item.href) ? "text-ink" : "text-ink-faint",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      <main className="px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:ml-56 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
              <SearchCommandPalette />
              {me ? <NotificationsBell /> : null}
              <button
                type="button"
                onClick={openUpload}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85"
              >
                <Plus className="h-4 w-4" />
                Upload
              </button>
            </div>
          </div>
          {showAuthBanner ? <AuthPreviewBanner onDismiss={dismissAuthBanner} /> : null}
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShellProvider>
      <ShellLayout>{children}</ShellLayout>
    </AppShellProvider>
  );
}
