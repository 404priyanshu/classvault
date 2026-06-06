"use client";

import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookMarked,
  Bookmark,
  BookmarkCheck,
  BookOpenCheck,
  Check,
  ChevronDown,
  CircleUserRound,
  Download,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  LibraryBig,
  LockKeyhole,
  LogIn,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  X,
  RotateCcw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import {
  currentUser,
  emptyUploadDraft,
  initialNotes,
  type FileType,
  type Note,
  type UploadDraft,
} from "@/lib/classvault-data";

type View = "library" | "saved" | "uploads" | "explore";

type Toast = {
  title: string;
  detail: string;
};

const navItems: Array<{ id: View | string; label: string; icon: any }> = [
  { id: "library", label: "Dashboard", icon: LayoutDashboard },
  { id: "explore", label: "Explore Notes", icon: SearchIcon },
  { id: "uploads", label: "Uploads", icon: Upload },
  { id: "saved", label: "Bookmarks", icon: Bookmark },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "ratings", label: "Ratings", icon: Star },
  { id: "admin", label: "Admin", icon: ShieldIcon },
];

function SearchIcon(props: any) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ShieldIcon(props: any) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return String(value);
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ClassVaultApp() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeView, setActiveView] = useState<View>("library");
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState("All");
  const [subject, setSubject] = useState("All");
  const [courseCode, setCourseCode] = useState("All");
  const [unit, setUnit] = useState("All");
  const [noteType, setNoteType] = useState("All");
  
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(initialNotes.filter((note) => note.saved).map((note) => note.id)),
  );
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [selectedNoteId, setSelectedNoteId] = useState(initialNotes[0]?.id ?? "");
  const [detailOpen, setDetailOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>(emptyUploadDraft);
  const [toast, setToast] = useState<Toast | null>(null);

  const subjects = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((note) => note.subject))).sort()],
    [notes],
  );

  const semesters = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((note) => note.semester))).sort((a, b) => Number(a) - Number(b))],
    [notes],
  );

  const courseCodes = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((note) => note.courseCode))).sort()],
    [notes],
  );

  const units = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((note) => note.unit))).sort()],
    [notes],
  );

  const noteTypes = useMemo(
    () => ["All", "PDF", "DOCX", "PPTX", "ZIP"],
    [],
  );

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes.filter((note) => {
      const viewMatch =
        activeView === "library" ||
        activeView === "explore" ||
        (activeView === "saved" && savedIds.has(note.id)) ||
        (activeView === "uploads" && note.ownerId === currentUser.id);

      const semesterMatch = semester === "All" || note.semester === semester;
      const subjectMatch = subject === "All" || note.subject === subject;
      const courseMatch = courseCode === "All" || note.courseCode === courseCode;
      const unitMatch = unit === "All" || note.unit === unit;
      const fileTypeMatch = noteType === "All" || note.fileType === noteType;
      
      const searchableText = [
        note.title,
        note.subject,
        note.semester,
        note.courseCode,
        note.unit,
        note.topic,
        note.uploader,
        note.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const queryMatch = !normalizedQuery || searchableText.includes(normalizedQuery);

      return viewMatch && semesterMatch && subjectMatch && courseMatch && unitMatch && fileTypeMatch && queryMatch;
    });
  }, [activeView, noteType, notes, query, savedIds, semester, subject, courseCode, unit]);

  const selectedNote = useMemo(() => {
    const selectedInFiltered = filteredNotes.find((note) => note.id === selectedNoteId);
    return selectedInFiltered ?? filteredNotes[0] ?? notes.find((note) => note.id === selectedNoteId) ?? notes[0];
  }, [filteredNotes, notes, selectedNoteId]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totalDownloads = notes.reduce((sum, note) => sum + note.downloads, 0);
  const myUploads = notes.filter((note) => note.ownerId === currentUser.id);
  const topRated = notes.reduce((top, note) => (note.rating > top.rating ? note : top), notes[0]);

  function resetFilters() {
    setQuery("");
    setSemester("All");
    setSubject("All");
    setCourseCode("All");
    setUnit("All");
    setNoteType("All");
  }

  function toggleSaved(noteId: string) {
    setSavedIds((current) => {
      const next = new Set(current);
      const isSaved = next.has(noteId);

      if (isSaved) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }

      setToast({
        title: isSaved ? "Removed from saved" : "Saved to vault",
        detail: isSaved
          ? "The note is no longer in your saved list."
          : "You can find this note under Bookmarks.",
      });

      return next;
    });
  }

  function rateNote(noteId: string, value: number) {
    setRatings((current) => ({ ...current, [noteId]: value }));
    setToast({
      title: "Rating captured",
      detail: `You rated this resource ${value} out of 5.`,
    });
  }

  function downloadNote(noteId: string) {
    const note = notes.find((item) => item.id === noteId);

    setNotes((current) =>
      current.map((item) =>
        item.id === noteId ? { ...item, downloads: item.downloads + 1 } : item,
      ),
    );

    setToast({
      title: "Download started",
      detail: note ? `${note.title} is ready as a mock ${note.fileType} download.` : "Mock file ready.",
    });
  }

  function openNote(noteId: string) {
    setSelectedNoteId(noteId);
    setDetailOpen(true);
  }

  function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = uploadDraft.title.trim();
    const courseCodeVal = uploadDraft.courseCode.trim();

    if (!title || !courseCodeVal) {
      setToast({
        title: "Upload needs a title and code",
        detail: "Add the resource title and course code before publishing.",
      });
      return;
    }

    const newNote: Note = {
      id: `note-upload-${Date.now()}`,
      title,
      subject: uploadDraft.subject.trim() || "General",
      semester: uploadDraft.semester,
      courseCode: courseCodeVal.toUpperCase(),
      unit: uploadDraft.unit.trim() || "All Units",
      topic: uploadDraft.tags.trim() || "Student upload",
      uploader: currentUser.name,
      uploaderRole: "You",
      fileType: uploadDraft.fileType,
      fileSize: uploadDraft.fileName ? "New file" : "Draft file",
      uploadDate: "Just now",
      rating: 0,
      ratingsCount: 0,
      downloads: 0,
      tags: uploadDraft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 4),
      summary:
        uploadDraft.summary.trim() ||
        "A newly uploaded ClassVault resource available in the local prototype.",
      ownerId: "current-user",
      saved: false,
    };

    setNotes((current) => [newNote, ...current]);
    setActiveView("uploads");
    setSelectedNoteId(newNote.id);
    setDetailOpen(true);
    setUploadOpen(false);
    setUploadDraft(emptyUploadDraft);
    setToast({
      title: "Resource auto-published",
      detail: "Your mock upload now appears under My uploads.",
    });
  }

  return (
    <main className="min-h-screen bg-[#090c0a] text-[#e3ece5]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        {/* LEFT SIDEBAR */}
        <Sidebar
          activeView={activeView}
          onViewChange={(view) => setActiveView(view as View)}
          savedCount={savedIds.size}
          uploadCount={myUploads.length}
          onSignOut={() => {
            setIsSignedIn(false);
            setToast({
              title: "Signed out",
              detail: "Prototype switched to guest browsing mode.",
            });
          }}
        />

        {/* CENTER COLUMN (Main Content) */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-[rgba(163,207,169,0.08)] bg-[#0c0f0d]">
          {/* TOP HEADER */}
          <div className="px-6 pt-6">
            {/* Mobile Brand Logo */}
            <div className="flex items-center lg:hidden mb-4">
              <img src="/logo_full.png" alt="ClassVault Logo" className="h-9 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92a596]" />
                <input
                  type="text"
                  placeholder="Search by title, subject, course code, semester, unit or topic..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(163,207,169,0.08)] bg-[#111512] py-3 pl-11 pr-16 text-sm text-[#e3ece5] outline-none placeholder:text-[#92a596]/40 focus:border-[#82b089]/40 focus:ring-1 focus:ring-[#82b089]/40"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-[rgba(163,207,169,0.15)] px-1.5 py-0.5 text-[10px] text-[#92a596]">
                  ⌘K
                </div>
              </div>
              <button className="relative rounded-xl border border-[rgba(163,207,169,0.08)] bg-[#111512] p-3 text-[#92a596] hover:text-[#e3ece5]">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute right-3.5 top-3.5 h-1.5 w-1.5 rounded-full bg-[#82b089]" />
              </button>
            </div>

            {/* FILTER DROPDOWNS */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <FilterSelect label="Subject" value={subject} onChange={setSubject} options={subjects} />
              <FilterSelect label="Semester" value={semester} onChange={setSemester} options={semesters} />
              <FilterSelect label="Course Code" value={courseCode} onChange={setCourseCode} options={courseCodes} />
              <FilterSelect label="Unit" value={unit} onChange={setUnit} options={units} />
              <FilterSelect label="Note Type" value={noteType} onChange={setNoteType} options={noteTypes} />
              
              <button
                onClick={resetFilters}
                className="ml-2 flex items-center gap-1.5 text-xs font-semibold text-[#92a596] hover:text-[#e3ece5] transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear All
              </button>
            </div>
          </div>

          {/* MAIN PAGE BODY */}
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* FEATURED NOTES */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#e3ece5]">
                  <Sparkles className="h-4.5 w-4.5 fill-amber-400/20 text-amber-400" />
                  Featured Notes
                </h2>
                <button className="text-xs font-semibold text-[#92a596] hover:text-[#82b089] transition">
                  View all
                </button>
              </div>

              <div className="mt-4 grid gap-4 grid-cols-2 xl:grid-cols-4">
                {notes.slice(0, 4).map((note, index) => {
                  const badges = ["Recommended", "Trending", "High Rated", "Popular"];
                  const badgeClasses = [
                    "bg-[#324a38] text-[#90ca9a] border border-[#486b51]",
                    "bg-[#4c3b24] text-[#dca255] border border-[#6b5334]",
                    "bg-[#4f4d2a] text-[#ded866] border border-[#726e38]",
                    "bg-[#253f4d] text-[#5ab8e2] border border-[#375e72]",
                  ];
                  return (
                    <FeaturedCard
                      key={note.id}
                      note={note}
                      badgeText={badges[index]}
                      badgeClass={badgeClasses[index]}
                      saved={savedIds.has(note.id)}
                      onToggleSaved={() => toggleSaved(note.id)}
                      onOpen={() => openNote(note.id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* ALL NOTES TABLE */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#e3ece5]">All Notes</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-lg border border-[rgba(163,207,169,0.08)] bg-[#111512] p-1">
                    <button className="rounded bg-[rgba(130,176,137,0.15)] p-1 text-[#82b089]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <button className="rounded p-1 text-[#92a596] hover:text-[#e3ece5]">
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="relative">
                    <button className="flex items-center gap-1.5 rounded-lg border border-[rgba(163,207,169,0.08)] bg-[#111512] px-3 py-1.5 text-xs font-semibold text-[#e3ece5]">
                      Sort by: Latest
                      <ChevronDown className="h-3.5 w-3.5 text-[#92a596]" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-[rgba(163,207,169,0.08)] bg-[#151b17] shadow-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(163,207,169,0.08)] bg-[#111512] text-[11px] font-bold uppercase tracking-wider text-[#92a596]">
                      <th className="px-4 py-3 font-semibold">Title</th>
                      <th className="px-4 py-3 font-semibold">Subject</th>
                      <th className="px-4 py-3 font-semibold">Course Code</th>
                      <th className="px-4 py-3 font-semibold text-center">Sem</th>
                      <th className="px-4 py-3 font-semibold">Unit / Topic</th>
                      <th className="px-4 py-3 font-semibold">Uploader</th>
                      <th className="px-4 py-3 font-semibold text-center">Rating</th>
                      <th className="px-4 py-3 font-semibold text-right">Downloads</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(163,207,169,0.04)] text-xs">
                    {filteredNotes.map((note) => (
                      <NoteRow
                        key={note.id}
                        note={note}
                        selected={note.id === selectedNoteId}
                        saved={savedIds.has(note.id)}
                        onOpen={() => openNote(note.id)}
                        onToggleSaved={() => toggleSaved(note.id)}
                      />
                    ))}
                  </tbody>
                </table>
                
                {/* Table Footer / Pagination */}
                <div className="flex items-center justify-between border-t border-[rgba(163,207,169,0.08)] bg-[#111512] px-4 py-3 text-xs text-[#92a596]">
                  <span>Showing 1 to {filteredNotes.length} of {filteredNotes.length} notes</span>
                  <div className="flex items-center gap-1">
                    <button className="rounded border border-[rgba(163,207,169,0.08)] bg-white/5 px-2 py-1 text-[11px] hover:text-[#e3ece5] disabled:opacity-40" disabled>
                      &lt;
                    </button>
                    <button className="rounded border border-[#82b089]/40 bg-[rgba(130,176,137,0.15)] px-2.5 py-1 text-[11px] font-bold text-[#82b089]">
                      1
                    </button>
                    <button className="rounded border border-[rgba(163,207,169,0.08)] px-2.5 py-1 text-[11px] hover:bg-white/5 hover:text-[#e3ece5]">
                      2
                    </button>
                    <button className="rounded border border-[rgba(163,207,169,0.08)] px-2.5 py-1 text-[11px] hover:bg-white/5 hover:text-[#e3ece5]">
                      3
                    </button>
                    <span className="px-1 text-[11px]">...</span>
                    <button className="rounded border border-[rgba(163,207,169,0.08)] px-2.5 py-1 text-[11px] hover:bg-white/5 hover:text-[#e3ece5]">
                      16
                    </button>
                    <button className="rounded border border-[rgba(163,207,169,0.08)] bg-white/5 px-2 py-1 text-[11px] hover:text-[#e3ece5]">
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM THREE BANNER CARDS */}
            <div className="grid gap-5 md:grid-cols-3">
              {/* Promo Card */}
              <div className="relative overflow-hidden rounded-2xl border border-[rgba(163,207,169,0.08)] bg-[#151b17] p-5">
                <div className="absolute right-0 bottom-0 top-0 w-32 opacity-25">
                  <img src="/stones_upload.png" alt="" className="h-full w-full object-cover" />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#e3ece5]">Share Knowledge. Build Tomorrow.</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#92a596]">
                      Upload your notes and help thousands of students learn better.
                    </p>
                  </div>
                  <button
                    onClick={() => setUploadOpen(true)}
                    className="mt-6 flex w-fit items-center gap-1.5 rounded-lg bg-[#82b089] px-3.5 py-2 text-xs font-bold text-black hover:bg-[#a5d0ad] transition"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Notes
                  </button>
                </div>
              </div>

              {/* Trending Subjects */}
              <div className="rounded-2xl border border-[rgba(163,207,169,0.08)] bg-[#151b17] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#e3ece5]">Trending Subjects</h3>
                  <button className="text-[10px] font-semibold text-[#92a596] hover:text-[#e3ece5]">View all</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Database Systems",
                    "Operating Systems",
                    "Data Structures",
                    "Computer Networks",
                    "Digital Logic Design",
                  ].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSubject(sub);
                        setActiveView("library");
                      }}
                      className="flex items-center gap-1 rounded-full border border-[rgba(163,207,169,0.08)] bg-[#111512] px-3 py-1.5 text-[11px] text-[#92a596] hover:border-[#82b089]/40 hover:text-[#e3ece5] transition"
                    >
                      {sub}
                      <ArrowUpRight className="h-3 w-3 text-[#92a596]/60" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-2xl border border-[rgba(163,207,169,0.08)] bg-[#151b17] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#e3ece5]">Recent Activity</h3>
                  <button className="text-[10px] font-semibold text-[#92a596] hover:text-[#e3ece5]">View all</button>
                </div>
                <div className="mt-4 space-y-3">
                  <ActivityRow
                    avatar="/avatar_arjun.png"
                    text="Arjun Mehta uploaded DBMS – Unit 2 Notes"
                    time="10m ago"
                  />
                  <ActivityRow
                    avatar="/avatar_riya.png"
                    text="Riya Patel rated Data Structures – Trees"
                    time="1h ago"
                  />
                  <ActivityRow
                    avatar="/avatar_karan.png"
                    text="Karan Verma downloaded CN – PYQs (2019–24)"
                    time="2h ago"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE PANEL */}
        <aside className="sticky top-0 hidden h-screen w-[380px] shrink-0 flex-col overflow-y-auto bg-[#0c0f0d] p-6 lg:flex">
          {/* STATS HEADER */}
          <div className="grid grid-cols-2 gap-3 border-b border-[rgba(163,207,169,0.08)] pb-5">
            <RightStatCard icon={BookOpenCheck} value="1,248" label="Total Notes" />
            <RightStatCard icon={Users} value="482" label="Contributors" />
            <RightStatCard icon={Download} value="24.7K" label="Downloads" />
            <RightStatCard icon={Star} value="4.8" label="Avg. Rating" starFilled />
          </div>

          {/* DETAIL PANEL */}
          {selectedNote ? (
            <div className="flex-1 py-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#92a596]">Selected Note</span>
                  <div className="mt-1.5 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-[#e3ece5]">{selectedNote.title}</h3>
                      <p className="text-xs text-[#92a596]">{selectedNote.topic}</p>
                    </div>
                    <button
                      onClick={() => toggleSaved(selectedNote.id)}
                      className="rounded-lg border border-[rgba(163,207,169,0.08)] p-2 text-[#92a596] hover:text-[#82b089]"
                    >
                      <Bookmark className={`h-4.5 w-4.5 ${savedIds.has(selectedNote.id) ? "fill-[#82b089] text-[#82b089]" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3 rounded-xl border border-[rgba(163,207,169,0.06)] bg-[#111512] p-3">
                  <img
                    src={selectedNote.uploaderAvatar ?? "/avatar_neha.png"}
                    alt={selectedNote.uploader}
                    className="h-9 w-9 rounded-full object-cover border border-[#82b089]/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#e3ece5]">{selectedNote.uploader}</p>
                    <p className="text-[10px] text-[#92a596]">{selectedNote.uploaderRole}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-[rgba(130,176,137,0.1)] px-2 py-1 text-[11px] font-bold text-[#82b089]">
                    {selectedNote.rating ? selectedNote.rating.toFixed(1) : "5.0"}
                    <Star className="h-3 w-3 fill-[#82b089] text-[#82b089]" />
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs leading-relaxed text-[#92a596]">{selectedNote.summary}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-white/5 px-2.5 py-1 text-[10px] font-medium text-[#e3ece5]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Format / Details bar */}
                <div className="border-t border-b border-[rgba(163,207,169,0.06)] py-3 text-[11px] text-[#92a596] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 uppercase font-semibold">
                    <FileText className="h-3.5 w-3.5 text-[#92a596]/60" />
                    {selectedNote.fileType}
                  </span>
                  <span>•</span>
                  <span>{selectedNote.pages ?? 24} Pages</span>
                  <span>•</span>
                  <span>{selectedNote.fileSize}</span>
                  <span>•</span>
                  <span>Uploaded on {selectedNote.uploadDate}</span>
                </div>

                {/* PREVIEW CONTAINER */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-[#e3ece5]">Preview</span>
                    <span className="text-[#92a596]">1 / {selectedNote.pages ?? 24}</span>
                  </div>
                  
                  <div className="grid grid-cols-[1fr_50px] gap-2 rounded-xl border border-[rgba(163,207,169,0.08)] bg-black/30 p-2">
                    {/* Main Preview */}
                    <div className="aspect-[4/5] overflow-hidden rounded-lg bg-black/40 border border-white/5">
                      <img
                        src="/preview_dbms_main.png"
                        alt="Page preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Thumbnails vertical list */}
                    <div className="flex flex-col gap-1.5 h-full overflow-y-auto">
                      <div className="aspect-[4/5] overflow-hidden rounded border border-[#82b089]/40 bg-black/40">
                        <img src="/preview_dbms_main.png" alt="thumb1" className="h-full w-full object-cover" />
                      </div>
                      <div className="aspect-[4/5] overflow-hidden rounded border border-white/5 bg-black/40 opacity-60 hover:opacity-100 transition">
                        <img src="/preview_dbms_thumb1.png" alt="thumb2" className="h-full w-full object-cover" />
                      </div>
                      <div className="aspect-[4/5] overflow-hidden rounded border border-white/5 bg-black/40 opacity-60 hover:opacity-100 transition">
                        <img src="/preview_dbms_thumb2.png" alt="thumb3" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-[1.5fr_1fr] gap-2">
                  <button
                    onClick={() => downloadNote(selectedNote.id)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#82b089] py-3 text-xs font-bold text-black hover:bg-[#a5d0ad] transition"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => toggleSaved(selectedNote.id)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(163,207,169,0.08)] bg-white/5 py-3 text-xs font-bold text-[#e3ece5] hover:bg-white/10 transition"
                  >
                    <Bookmark className="h-4 w-4 text-[#92a596]" />
                    Bookmark
                  </button>
                </div>
                
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(163,207,169,0.08)] bg-[#111512] py-3 text-xs font-bold text-[#e3ece5] hover:border-[#82b089]/30 transition">
                  View Details
                  <ArrowRight className="h-3.5 w-3.5 text-[#82b089]" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#92a596] py-10">
              Select a note to view details.
            </div>
          )}
        </aside>
      </div>

      {/* DIALOGS */}
      {uploadOpen ? (
        <UploadDialog
          draft={uploadDraft}
          onDraftChange={setUploadDraft}
          onClose={() => setUploadOpen(false)}
          onSubmit={submitUpload}
        />
      ) : null}

      {toast ? <ToastMessage toast={toast} /> : null}
    </main>
  );
}

/* SIDEBAR SUBCOMPONENT */
function Sidebar({
  activeView,
  onViewChange,
  savedCount,
  uploadCount,
  onSignOut,
}: {
  activeView: string;
  onViewChange: (view: string) => void;
  savedCount: number;
  uploadCount: number;
  onSignOut: () => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[rgba(163,207,169,0.08)] bg-[#0c0f0d] px-5 py-6 lg:flex">
      {/* Brand logo */}
      <div className="flex items-center px-1">
        <img src="/logo_full.png" alt="ClassVault Logo" className="h-10 w-auto object-contain" />
      </div>

      {/* Nav Menu */}
      <nav className="mt-8 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id || (item.id === "library" && activeView === "explore");
          const count = item.id === "saved" ? savedCount : item.id === "uploads" ? uploadCount : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id === "explore" ? "explore" : (item.id as string))}
              className={classNames(
                "flex h-11 w-full items-center justify-between rounded-xl px-3 text-xs font-semibold tracking-wide transition-all duration-150",
                isActive
                  ? "bg-[rgba(130,176,137,0.08)] text-[#82b089] border border-[rgba(130,176,137,0.18)] glow-on-active shadow-[0_0_12px_rgba(130,176,137,0.05)]"
                  : "text-[#92a596] hover:bg-white/5 hover:text-[#e3ece5]",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </span>
              {count !== null ? (
                <span
                  className={classNames(
                    "rounded-md px-1.5 py-0.5 text-[10px]",
                    isActive ? "bg-[#82b089]/20 text-[#82b089]" : "bg-white/5 text-[#92a596]",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Motivational Zen Box */}
      <div className="relative overflow-hidden rounded-xl border border-[rgba(163,207,169,0.08)] bg-[#111512] p-4 mb-4 shadow-md">
        <div className="absolute right-0 bottom-0 top-0 w-24 opacity-30">
          <img src="/stones_motivation.png" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10 pr-12">
          <p className="text-[11px] leading-relaxed text-[#92a596] italic">
            "Stay consistent, keep learning, share knowledge."
          </p>
          <p className="mt-2 text-[10px] font-bold text-[#82b089]">— ClassVault</p>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="flex items-center justify-between rounded-xl border border-[rgba(163,207,169,0.06)] bg-[#111512] p-3 shadow-inner">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-9 w-9 rounded-full object-cover border border-[#82b089]/30"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#e3ece5]">{currentUser.name}</p>
            <p className="truncate text-[10px] text-[#92a596]">{currentUser.role}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          title="Sign Out"
          className="text-[#92a596] hover:text-rose-400 p-1 rounded-md hover:bg-white/5 transition"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

/* FILTER SELECT DROPDOWN */
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-[rgba(163,207,169,0.08)] bg-[#111512] pl-3 pr-8 text-xs font-semibold text-[#e3ece5] outline-none transition hover:border-[#82b089]/20 focus:border-[#82b089]/40 focus:ring-1 focus:ring-[#82b089]/40"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#111512] text-[#e3ece5]">
            {option === "All" ? `${label}` : option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#92a596]" />
    </div>
  );
}

/* FEATURED NOTES CARD */
function FeaturedCard({
  note,
  badgeText,
  badgeClass,
  saved,
  onToggleSaved,
  onOpen,
}: {
  note: Note;
  badgeText: string;
  badgeClass: string;
  saved: boolean;
  onToggleSaved: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-[rgba(163,207,169,0.08)] bg-[#151b17] p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#82b089]/30 hover:shadow-xl">
      {/* Top Tag and Badge */}
      <div className="flex items-center justify-between">
        <span className={classNames("rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", badgeClass)}>
          {badgeText}
        </span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-[#e3ece5]/60">
          PDF
        </span>
      </div>

      {/* Main Cover Illustration */}
      <button
        onClick={onOpen}
        className="my-3.5 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-black/20 cursor-pointer"
      >
        <img
          src={note.coverImage ?? "/card_dbms.png"}
          alt={note.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      {/* Title & Desc */}
      <button onClick={onOpen} className="text-left w-full cursor-pointer">
        <h3 className="truncate text-xs font-extrabold text-[#e3ece5]">{note.title}</h3>
        <p className="mt-0.5 truncate text-[10px] font-semibold text-[#92a596]">{note.topic}</p>
      </button>

      {/* Stats and Action */}
      <div className="mt-4 flex items-center justify-between border-t border-[rgba(163,207,169,0.06)] pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#e3ece5]">
            {note.rating.toFixed(1)}
            <Star className="h-3 w-3 fill-[#82b089] text-[#82b089]" />
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#92a596]">
            <Download className="h-3 w-3 text-[#92a596]/70" />
            {formatCount(note.downloads)}
          </span>
        </div>

        <button onClick={onToggleSaved} className="text-[#92a596] hover:text-[#82b089] transition">
          <Bookmark className={`h-4 w-4 ${saved ? "fill-[#82b089] text-[#82b089]" : ""}`} />
        </button>
      </div>
    </div>
  );
}

/* NOTE ROW SUBCOMPONENT */
function NoteRow({
  note,
  selected,
  saved,
  onOpen,
  onToggleSaved,
}: {
  note: Note;
  selected: boolean;
  saved: boolean;
  onOpen: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <tr
      onClick={onOpen}
      className={classNames(
        "cursor-pointer transition hover:bg-white/5 border-b border-[rgba(163,207,169,0.04)]",
        selected ? "bg-[rgba(130,176,137,0.08)] border-l-2 border-l-[#82b089]" : "",
      )}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-rose-500/10 text-rose-500 font-extrabold text-[9px] uppercase border border-rose-500/20">
            PDF
          </span>
          <span className="font-bold text-[#e3ece5] hover:text-[#82b089] transition truncate max-w-[200px]">
            {note.title}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-[#92a596] truncate max-w-[120px]">{note.subject}</td>
      <td className="px-4 py-3.5 font-bold tracking-wider text-[#e3ece5]">{note.courseCode}</td>
      <td className="px-4 py-3.5 text-center text-[#e3ece5] font-semibold">{note.semester}</td>
      <td className="px-4 py-3.5 text-[#92a596] truncate max-w-[140px]">{note.unit}</td>
      <td className="px-4 py-3.5 text-[#e3ece5] font-medium">{note.uploader}</td>
      <td className="px-4 py-3.5 text-center">
        <span className="inline-flex items-center gap-0.5 rounded bg-[#82b089]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#82b089]">
          {note.rating.toFixed(1)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right font-bold text-[#e3ece5]">{formatCount(note.downloads)}</td>
      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onToggleSaved} className="text-[#92a596] hover:text-[#82b089] p-1 transition">
            <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-[#82b089] text-[#82b089]" : ""}`} />
          </button>
          <button className="text-[#92a596] hover:text-[#e3ece5] p-1 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* RIGHT PANEL STAT CARD */
function RightStatCard({
  icon: Icon,
  value,
  label,
  starFilled = false,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  starFilled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[rgba(163,207,169,0.06)] bg-[#111512] p-3 text-center">
      <div className="flex items-center justify-center mb-1 text-[#82b089]">
        <Icon className={classNames("h-4.5 w-4.5", starFilled && "fill-[#82b089]")} />
      </div>
      <p className="text-base font-extrabold text-[#e3ece5] leading-tight">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#92a596]">{label}</p>
    </div>
  );
}

/* RECENT ACTIVITY ROW */
function ActivityRow({ avatar, text, time }: { avatar: string; text: string; time: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <div className="flex items-center gap-2.5 min-w-0">
        <img src={avatar} alt="" className="h-6.5 w-6.5 rounded-full object-cover border border-white/5" />
        <span className="truncate text-[#e3ece5] font-semibold">{text}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-[#92a596]">
        <span>{time}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#82b089]" />
      </div>
    </div>
  );
}

/* UPLOAD DIALOG */
function UploadDialog({
  draft,
  onDraftChange,
  onClose,
  onSubmit,
}: {
  draft: UploadDraft;
  onDraftChange: (draft: UploadDraft) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function updateField<K extends keyof UploadDraft>(key: K, value: UploadDraft[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[rgba(163,207,169,0.08)] bg-[#151b17] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(163,207,169,0.08)] p-5">
          <div>
            <h2 className="text-lg font-bold text-[#e3ece5]">Upload academic note</h2>
            <p className="mt-1 text-xs text-[#92a596]">Auto-publishes into the local prototype workspace.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload dialog"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(163,207,169,0.08)] text-[#92a596] hover:text-[#e3ece5] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <input
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="e.g. Compiler Design Unit 3 Notes"
              className="form-field"
            />
          </Field>
          <Field label="Subject">
            <input
              value={draft.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="Computer Science"
              className="form-field"
            />
          </Field>
          <Field label="Course code">
            <input
              value={draft.courseCode}
              onChange={(event) => updateField("courseCode", event.target.value)}
              placeholder="CS352"
              className="form-field uppercase"
            />
          </Field>
          <Field label="Semester">
            <select
              value={draft.semester}
              onChange={(event) => updateField("semester", event.target.value)}
              className="form-field"
            >
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((item) => (
                <option key={item} value={item} className="bg-[#111512] text-[#e3ece5]">
                  Semester {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit">
            <input
              value={draft.unit}
              onChange={(event) => updateField("unit", event.target.value)}
              placeholder="Unit 2"
              className="form-field"
            />
          </Field>
          <Field label="File type">
            <select
              value={draft.fileType}
              onChange={(event) => updateField("fileType", event.target.value as FileType)}
              className="form-field"
            >
              {(["PDF", "DOCX", "PPTX", "ZIP"] satisfies FileType[]).map((item) => (
                <option key={item} value={item} className="bg-[#111512] text-[#e3ece5]">
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="File">
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[rgba(163,207,169,0.15)] px-3 text-xs font-semibold text-[#92a596] hover:border-[#82b089]/40 hover:text-[#e3ece5] transition">
              <Upload className="h-4 w-4" />
              <span className="truncate">{draft.fileName || "Choose file"}</span>
              <input
                type="file"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  updateField("fileName", file?.name ?? "");
                }}
              />
            </label>
          </Field>
          <Field label="Tags" className="sm:col-span-2">
            <input
              value={draft.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="comma separated: pyq, unit 3, numericals"
              className="form-field"
            />
          </Field>
          <Field label="Summary" className="sm:col-span-2">
            <textarea
              value={draft.summary}
              onChange={(event) => updateField("summary", event.target.value)}
              placeholder="Short description students will see in the detail panel"
              className="form-field min-h-24 resize-y py-3"
            />
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[rgba(163,207,169,0.08)] p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[rgba(163,207,169,0.08)] px-4 text-xs font-bold text-[#e3ece5] hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#82b089] px-4 text-xs font-bold text-black hover:bg-[#a5d0ad] transition"
          >
            <Check className="h-4 w-4" />
            Publish upload
          </button>
        </div>
      </form>
    </div>
  );
}

/* FORM FIELD LABEL WRAPPER */
function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={classNames("block", className)}>
      <span className="mb-1.5 block text-xs font-bold text-[#92a596]">{label}</span>
      {children}
    </label>
  );
}

/* TOAST SUBCOMPONENT */
function ToastMessage({ toast }: { toast: Toast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-[rgba(163,207,169,0.08)] bg-[#151b17] p-4 shadow-2xl glow-on-active">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#82b089]/10 text-[#82b089] border border-[#82b089]/20">
          <Check className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#e3ece5]">{toast.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#92a596]">{toast.detail}</p>
        </div>
      </div>
    </div>
  );
}
