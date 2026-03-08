"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsGet } from "@/lib/storage";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { readPrograms, upsertProgram } from "@/lib/programsStorage";
import type { UserProgram, ProgramSessionTemplate } from "@/lib/programsTypes";
import type { Workout } from "@/lib/types";
import { profileKey } from "@/lib/profiles";

// ── Konstansok ──────────────────────────────────────────────
const DAY_NAMES = ["Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat","Vasárnap"];
const DAY_SHORT = ["H","K","Sz","Cs","P","Sz","V"];

// 0 = hétfő
function todayIdx() {
  return (new Date().getDay() + 6) % 7;
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function getWeekDates(offsetWeeks = 0): Date[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

// ── Session picker modal ─────────────────────────────────────
function SessionPickerModal({ dayIdx, dayName, programs, current, onPick, onClear, onClose }: {
  dayIdx: number;
  dayName: string;
  programs: UserProgram[];
  current: { programId: string; sessionId: string } | null;
  onPick: (programId: string, sessionId: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <button className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-[2rem] overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", maxHeight: "75vh" }}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between sticky top-0"
          style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <div className="label-xs mb-0.5">NAP BEÁLLÍTÁSA</div>
            <div className="text-base font-black" style={{ color: "var(--text-primary)" }}>{dayName}</div>
          </div>
          <button onClick={onClose} className="text-xl pressable" style={{ color: "var(--text-muted)" }}>✕</button>
        </div>
        <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: "55vh" }}>
          {/* Törlés */}
          {current && (
            <button onClick={() => { onClear(); onClose(); }}
              className="w-full rounded-2xl py-3 text-sm font-semibold pressable"
              style={{ background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.7)", border: "1px solid rgba(239,68,68,0.2)" }}>
              🗑 Edzés törlése ezen a napon
            </button>
          )}
          {programs.length === 0 && (
            <div className="rounded-2xl p-4 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              Még nincs programod. Hozz létre egyet a Programok oldalon!
            </div>
          )}
          {programs.map(prog => (
            <div key={prog.id}>
              <div className="label-xs mb-2">{prog.name.toUpperCase()}</div>
              <div className="space-y-2">
                {prog.sessions.map(sess => {
                  const isActive = current?.programId === prog.id && current?.sessionId === sess.id;
                  return (
                    <button key={sess.id} onClick={() => { onPick(prog.id, sess.id); onClose(); }}
                      className="w-full rounded-2xl p-3 text-left pressable"
                      style={isActive
                        ? { background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.35)" }
                        : { background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold" style={{ color: isActive ? "var(--accent-primary)" : "var(--text-primary)" }}>
                          {sess.name}
                        </div>
                        {isActive && <span className="text-xs" style={{ color: "var(--accent-primary)" }}>✓ aktív</span>}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {sess.blocks.length} gyakorlat
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const pid = activeProfileId ?? "guest";

  const [programs, setPrograms] = React.useState<UserProgram[]>([]);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [picker, setPicker] = React.useState<{ dayIdx: number } | null>(null);

  // workout history (kész edzések megjelöléséhez)
  const [workouts] = useLocalStorageState<Workout[]>(
    React.useMemo(() => profileKey(pid, "workouts"), [pid]), []
  );

  React.useEffect(() => {
    setPrograms(readPrograms(pid));
  }, [pid]);

  const weekDates = React.useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const today = todayIdx();
  const isCurrentWeek = weekOffset === 0;

  // Heti ütemezés: napIdx → {programId, sessionId}
  // Minden aktív programból összegyűjtjük a pinnedDays-t
  type DaySlot = { programId: string; sessionId: string };
  const schedule = React.useMemo(() => {
    const map: Record<number, DaySlot> = {};
    for (const prog of programs) {
      const pinned = prog.schedule?.pinnedDays ?? {};
      for (const [dayKey, sessId] of Object.entries(pinned)) {
        const dayIdx = parseInt(dayKey);
        map[dayIdx] = { programId: prog.id, sessionId: sessId };
      }
    }
    return map;
  }, [programs]);

  // Melyik napokon volt ténylegesen edzés (history alapján)
  const doneDays = React.useMemo(() => {
    const set = new Set<number>();
    for (const w of workouts) {
      const d = new Date(w.startedAt);
      const weekStart = weekDates[0];
      const weekEnd = weekDates[6];
      if (d >= weekStart && d <= new Date(weekEnd.getTime() + 86400000)) {
        set.add((d.getDay() + 6) % 7);
      }
    }
    return set;
  }, [workouts, weekDates]);

  function getSession(programId: string, sessionId: string): ProgramSessionTemplate | null {
    const prog = programs.find(p => p.id === programId);
    return prog?.sessions.find(s => s.id === sessionId) ?? null;
  }

  function handlePick(dayIdx: number, programId: string, sessionId: string) {
    // frissítjük az adott program pinnedDays-ét
    // először töröljük ezt a napot minden más programból
    const updated = programs.map(prog => {
      const pinned = { ...(prog.schedule?.pinnedDays ?? {}) };
      if (prog.id === programId) {
        pinned[String(dayIdx)] = sessionId;
      } else {
        delete pinned[String(dayIdx)];
      }
      return { ...prog, schedule: { ...prog.schedule, pinnedDays: pinned } };
    });
    updated.forEach(p => upsertProgram(pid, p));
    setPrograms(updated);
  }

  function handleClear(dayIdx: number) {
    const updated = programs.map(prog => {
      const pinned = { ...(prog.schedule?.pinnedDays ?? {}) };
      delete pinned[String(dayIdx)];
      return { ...prog, schedule: { ...prog.schedule, pinnedDays: pinned } };
    });
    updated.forEach(p => upsertProgram(pid, p));
    setPrograms(updated);
  }

  const pickerDay = picker?.dayIdx ?? null;
  const currentSlot = pickerDay !== null ? (schedule[pickerDay] ?? null) : null;

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
    <div className="flex-1 pb-32 animate-in">

      {/* ── HEADER ── */}
      <div className="px-4 pt-12 pb-2">
        <div className="label-xs mb-1">ARCX</div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Naptár</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Koppints egy napra az edzés beállításához
        </p>
      </div>

      {/* ── HÉT NAVIGÁTOR ── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="rounded-xl px-3 py-2 text-sm pressable"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          ← Előző
        </button>
        <button onClick={() => setWeekOffset(0)}
          className="rounded-xl px-3 py-2 text-xs font-bold pressable"
          style={isCurrentWeek
            ? { background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.3)" }
            : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          {isCurrentWeek ? "Ez a hét" : `${weekDates[0].getMonth()+1}/${weekDates[0].getDate()} – ${weekDates[6].getMonth()+1}/${weekDates[6].getDate()}`}
        </button>
        <button onClick={() => setWeekOffset(w => w + 1)}
          className="rounded-xl px-3 py-2 text-sm pressable"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          Következő →
        </button>
      </div>

      {/* ── HETI NÉZET ── */}
      <div className="px-4 space-y-2">
        {weekDates.map((date, dayIdx) => {
          const slot = schedule[dayIdx];
          const session = slot ? getSession(slot.programId, slot.sessionId) : null;
          const prog = slot ? programs.find(p => p.id === slot.programId) : null;
          const isToday = isCurrentWeek && dayIdx === today;
          const isDone = doneDays.has(dayIdx);
          const isPast = isCurrentWeek && dayIdx < today;

          return (
            <button key={dayIdx}
              onClick={() => isCurrentWeek && dayIdx < today ? null : setPicker({ dayIdx })}
              className="w-full rounded-3xl p-4 text-left pressable"
              style={{
                background: isToday
                  ? "rgba(34,211,238,0.08)"
                  : isDone ? "rgba(74,222,128,0.06)" : "var(--bg-surface)",
                border: isToday
                  ? "1px solid rgba(34,211,238,0.3)"
                  : isDone ? "1px solid rgba(74,222,128,0.2)" : "1px solid var(--border-subtle)",
                opacity: isPast && !isDone ? 0.5 : 1,
              }}>
              <div className="flex items-center gap-3">
                {/* Dátum bal oldal */}
                <div className="shrink-0 text-center w-10">
                  <div className="text-[10px] font-bold uppercase"
                    style={{ color: isToday ? "var(--accent-primary)" : "var(--text-muted)" }}>
                    {DAY_SHORT[dayIdx]}
                  </div>
                  <div className="text-xl font-black"
                    style={{ color: isToday ? "var(--accent-primary)" : isDone ? "var(--accent-green)" : "var(--text-secondary)" }}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Elválasztó */}
                <div className="w-px h-10 shrink-0" style={{ background: "var(--border-subtle)" }} />

                {/* Session info */}
                <div className="flex-1 min-w-0">
                  {isDone ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "var(--accent-green)" }}>✓ Edzés kész</span>
                    </div>
                  ) : session ? (
                    <>
                      <div className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                        {session.name}
                      </div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {prog?.name} · {session.blocks.length} gyakorlat
                      </div>
                    </>
                  ) : (
                    <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {isToday ? "Ma nincs tervezett edzés" : "Pihenőnap"}
                    </div>
                  )}
                </div>

                {/* Jobb oldal gomb */}
                {!isPast && (
                  <div className="shrink-0 rounded-xl px-2 py-1 text-[10px] font-bold"
                    style={session
                      ? { background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)" }
                      : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                    {session ? "✏️" : "+"}
                  </div>
                )}
              </div>

              {/* Ma gomb: edzés indítása */}
              {isToday && session && !isDone && (
                <button onClick={e => { e.stopPropagation(); router.push("/workout"); }}
                  className="mt-3 w-full rounded-2xl py-2.5 text-sm font-black pressable"
                  style={{ background: "var(--accent-primary)", color: "#000" }}>
                  Edzés indítása →
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* ── PROGRAMOK ÖSSZEFOGLALÓ ── */}
      {programs.length > 0 && (
        <div className="mx-4 mt-4 rounded-3xl p-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <div className="label-xs mb-3">AKTÍV PROGRAMOK</div>
          {programs.map(prog => {
            const pinnedCount = Object.keys(prog.schedule?.pinnedDays ?? {}).length;
            return (
              <button key={prog.id} onClick={() => router.push(`/programs/${prog.id}`)}
                className="w-full flex items-center justify-between py-2.5 pressable"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{prog.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {pinnedCount > 0 ? `${pinnedCount} nap ütemezve` : "Nincs ütemezve"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {programs.length === 0 && (
        <div className="mx-4 mt-4 rounded-3xl p-6 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <div className="text-3xl mb-2">📅</div>
          <div className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Nincs program</div>
          <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Hozz létre egy programot, hogy be tudd ütemezni az edzésnapokat
          </div>
          <button onClick={() => router.push("/programs")}
            className="rounded-2xl px-4 py-2.5 text-sm font-bold pressable"
            style={{ background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.3)" }}>
            Programok →
          </button>
        </div>
      )}

    </div>

    {/* Picker modal */}
    {picker && (
      <SessionPickerModal
        dayIdx={picker.dayIdx}
        dayName={DAY_NAMES[picker.dayIdx]}
        programs={programs}
        current={currentSlot}
        onPick={(pId, sId) => handlePick(picker.dayIdx, pId, sId)}
        onClear={() => handleClear(picker.dayIdx)}
        onClose={() => setPicker(null)} />
    )}

    <BottomNav />
    </div>
  );
}
