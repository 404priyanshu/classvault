"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { Button, Card, Input, Modal, Select } from "@/components/ui";

type RoomDetails = {
  id: string;
  name: string;
  subject: string;
  count: number;
  timer: string;
  timerVal: number; // minutes
  type: "College-only" | "Public";
  goals: string[];
};

export function StudyRoomsView() {
  const [rooms, setRooms] = useState<RoomDetails[]>([]);

  const [activeRoom, setActiveRoom] = useState<RoomDetails | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function refreshRooms() {
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const body = (await res.json()) as { items: RoomDetails[] };
        setRooms(body.items);
      }
    } catch {
      // ignore; list will be empty until successful load
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshRooms();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Creation form states
  const [newRoomName, setNewRoomName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newType, setNewType] = useState<"College-only" | "Public">("Public");
  const [newTimer, setNewTimer] = useState(25);
  const [newGoals, setNewGoals] = useState("");

  // Countdown timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedSession, setCompletedSession] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    if (timerRunning && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setCompletedSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [timerRunning, timeLeft]);

  async function handleJoinRoom(room: RoomDetails) {
    try {
      await fetch(`/api/rooms/${room.id}/join`, { method: "POST" });
    } catch {
      // best-effort; still allow entering the session
    }
    setActiveRoom(room);
    setTimeLeft(room.timerVal * 60);
    setTimerRunning(false);
    setCompletedSession(false);
  }

  async function handleCreateRoom(e: FormEvent) {
    e.preventDefault();
    if (!newRoomName.trim() || !newSubject.trim()) return;

    const payload = {
      name: newRoomName.trim(),
      subject: newSubject.trim(),
      type: newType,
      timerVal: newTimer,
      goals: newGoals
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create room");
      const created: RoomDetails = await res.json();
      setCreateOpen(false);
      void refreshRooms();
      // server auto-joins creator; enter session
      await handleJoinRoom(created);
      // Reset form
      setNewRoomName("");
      setNewSubject("");
      setNewType("Public");
      setNewTimer(25);
      setNewGoals("");
    } catch {
      // on failure leave dialog open for retry (no local fallback)
    }
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Silent focus rooms. Set your goals, start the Pomodoro timer, and stay accountable alongside classmates.
      </p>

      {!activeRoom ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">Available Rooms</h3>
            <Button onClick={() => setCreateOpen(true)} className="w-full min-[420px]:w-auto">
              Create study room
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id} padded className="flex flex-col justify-between p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded border border-line bg-paper px-1.5 py-0.5 text-[9px] font-bold text-ink-soft uppercase">
                      {room.type}
                    </span>
                    <span className="text-[10px] text-ink-soft font-semibold">{room.count} studying</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{room.name}</h4>
                    <p className="text-xs text-ink-soft font-semibold">{room.subject} • {room.timer}</p>
                  </div>
                  <div className="space-y-1 pt-1.5">
                    <span className="text-[9px] font-bold uppercase text-ink-faint tracking-wider block">Goals</span>
                    <ul className="space-y-1">
                      {room.goals.map((g, i) => (
                        <li key={i} className="text-xs text-ink-soft leading-normal font-medium truncate">• {g}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleJoinRoom(room)} className="mt-5 w-full">
                  Join Room
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Active session view */
        <Card padded className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-line pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent leading-none">
                Silent Session
              </span>
              <h3 className="text-base font-bold text-ink mt-0.5">{activeRoom.name}</h3>
              <p className="text-xs text-ink-soft font-semibold mt-0.5">{activeRoom.subject}</p>
            </div>
            <Button
              variant="danger"
              onClick={async () => {
                if (activeRoom?.id) {
                  try {
                    await fetch(`/api/rooms/${activeRoom.id}/leave`, { method: "POST" });
                  } catch {}
                  void refreshRooms();
                }
                setActiveRoom(null);
                setTimerRunning(false);
              }}
              className="w-full min-[420px]:w-auto"
            >
              Leave Session
            </Button>
          </div>

          <div className="space-y-4 py-6 text-center">
            <div className="font-mono text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {formatTimer(timeLeft)}
            </div>
            <div className="flex flex-col justify-center gap-3 min-[380px]:flex-row">
              <Button onClick={() => setTimerRunning(!timerRunning)} className="w-full min-[380px]:w-auto">
                {timerRunning ? "Pause Timer" : "Start Focus"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setTimerRunning(false);
                  setTimeLeft(activeRoom.timerVal * 60);
                }}
                className="w-full min-[380px]:w-auto"
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-line">
            {/* Goal checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">My Session Goals</h4>
              <div className="space-y-2.5">
                {activeRoom.goals.map((g, i) => (
                  <label key={i} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-ink-soft">
                    <input type="checkbox" className="rounded border-line text-accent focus:ring-accent" />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Participants list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">Classmates Focusing</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { name: "Priyanshu (you)", initials: "PR" },
                  { name: "Rohit", initials: "RO" },
                  { name: "Shruti", initials: "SH" },
                  { name: "Aarav", initials: "AA" },
                ].map((user, i) => (
                  <div key={i} className="flex items-center gap-2 border border-line bg-paper py-1.5 px-3 rounded-full text-xs font-semibold text-ink-soft">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[9px] font-bold text-accent">
                      {user.initials}
                    </span>
                    <span>{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Complete session modal details */}
      <Modal open={completedSession} onClose={() => setCompletedSession(false)} label="Focus session complete" className="max-w-sm">
          <div className="space-y-4 p-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
              <Check className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ink">Focus Session Complete!</h3>
              <p className="text-xs text-ink-soft">
                You studied for <span className="font-bold text-ink">{activeRoom?.timerVal} minutes</span> in {activeRoom?.name}.
              </p>
            </div>
            <div className="border-t border-line pt-3 text-left space-y-2">
              <span className="text-[10px] font-bold text-ink-faint uppercase block">Suggested next action</span>
              <p className="text-xs text-ink-soft">
                Add your completed tasks to your AI Study Roadmap, and take a quick 5-min break.
              </p>
            </div>
            <Button
              onClick={() => {
                setCompletedSession(false);
                setActiveRoom(null);
              }}
              className="w-full"
            >
              Awesome
            </Button>
          </div>
      </Modal>

      {/* Room Creation dialog modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} label="Create study room" className="max-w-md">
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="text-sm font-bold text-ink">Create study room</h3>
              <button onClick={() => setCreateOpen(false)} className="text-ink-faint hover:text-ink">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Room Name</span>
                  <Input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. DBMS Exam Sprint"
                    className="mt-1 h-10"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Subject</span>
                  <Input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. DBMS"
                    className="mt-1 h-10"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold text-ink-soft">Timer Mode</span>
                    <Select
                      value={newTimer}
                      onChange={(e) => setNewTimer(Number(e.target.value))}
                      className="mt-1 h-10"
                    >
                      <option value={25}>25 / 5 (Pomodoro)</option>
                      <option value={50}>50 / 10</option>
                      <option value={15}>15m Sprint</option>
                    </Select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-ink-soft">Visibility</span>
                    <Select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as "College-only" | "Public")}
                      className="mt-1 h-10"
                    >
                      <option value="Public">Public Room</option>
                      <option value="College-only">College-Only</option>
                    </Select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Room Goals (comma separated)</span>
                  <Input
                    type="text"
                    value={newGoals}
                    onChange={(e) => setNewGoals(e.target.value)}
                    placeholder="e.g. Solve 5 PYQs, Finish Normalization notes"
                    className="mt-1 h-10"
                  />
                </label>
              </div>

              <Button
                type="submit"
                disabled={!newRoomName.trim() || !newSubject.trim()}
                className="mt-2 h-10 w-full"
              >
                Create and Join Room
              </Button>
            </form>
          </div>
      </Modal>
    </div>
  );
}
