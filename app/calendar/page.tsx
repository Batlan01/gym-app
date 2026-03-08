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
      <button className="absolute inset-0" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-[2rem] overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", maxHeight: "80vh" }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between sticky top-0"
          style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <div className="text-[10px] font-bold tracking-widest mb-0.5" style={{ color: "var(--text-muted)" }}>
              NAP BEÁLLÍTÁSA
            </div>
            <div className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{dayName}</div>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center pressable"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6 pt-3 space-y-4" style={{ maxHeight: "62vh" }}>

          {/* Üres állapot */}
          {programs.length === 0 && (
            <div className="rounded-2xl p-6 text-sm text-center" style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>
              Még nincs programod.<br/>Hozz létre egyet a Programok oldalon!
            </div>
          )}

          {/* Programok és sessionök */}
          {programs.map(prog => (
            <div key={prog.id}>
              {/* Program fejléc — jól látható */}
              <div className="rounded-2xl px-4 py-3 mb-2"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-mid)" }}>
                <div className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{prog.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {prog.sessions.length} session · {prog.daysPerWeek ?? "?"} nap/hét
                </div>
              </div>

              {/* Session kártyák */}
              <div className="space-y-2 pl-2">
                {prog.sessions.map(sess => {
                  const isActive = current?.programId === prog.id && current?.sessionId === sess.id;
                  return (
                    <button key={sess.id}
                      onClick={() => { onPick(prog.id, sess.id); onClose(); }}
                      className="w-full rounded-2xl text-left pressable transition-all"
                      style={isActive ? {
                        background: "rgba(34,211,238,0.14)",
                        border: "2px solid rgba(34,211,238,0.5)",
                        padding: "12px 14px",
                      } : {
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        padding: "12px 14px",
                      }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Aktív jelző pont */}
                          <div className="shrink-0 h-2 w-2 rounded-full"
                            style={{ background: isActive ? "var(--accent-primary)" : "var(--border-mid)" }} />
                          <div className="text-sm font-bold truncate"
                            style={{ color: isActive ? "var(--accent-primary)" : "var(--text-primary)" }}>
                            {sess.name}
                          </div>
                        </div>
                        {isActive ? (
                          <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black"
                            style={{ background: "rgba(34,211,238,0.15)", color: "var(--accent-primary)" }}>
                            KIVÁLASZTVA
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                            {sess.blocks.length} gyak.
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <div className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                          {sess.blocks.length} gyakorlat · koppints a módosításhoz
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Törlés gomb alul */}
          {current && (
            <button onClick={() => { onClear(); onClose(); }}
              className="w-full rounded-2xl py-3 text-sm font-semibold pressable mt-2"
              style={{ background: "rgba(239,68,68,0.07)", color: "rgba(239,68,68,0.75)", border: "1px solid rgba(239,68,68,0.2)" }}>
              🗑 Edzés törlése ezen a napon
            </button>
          )}
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
                    <div>
                      <div className="text-sm font-black" style={{ color: "var(--accent-green)" }}>✓ Teljesítve</div>
                      {session && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{session.name}</div>}
                    </div>
                  ) : session ? (
                    <div>
                      {/* Program neve kis label */}
                      <div className="text-[10px] font-bold tracking-wider mb-0.5 truncate"
                        style={{ color: isToday ? "rgba(34,211,238,0.7)" : "var(--text-muted)" }}>
                        {prog?.name?.toUpperCase()}
                      </div>
                      {/* Session neve nagy */}
                      <div className="text-sm font-black truncate"
                        style={{ color: isToday ? "var(--text-primary)" : "var(--text-primary)" }}>
                        {session.name}
                      </div>
                      {/* Gyakorlat szám chip */}
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: isToday ? "rgba(34,211,238,0.12)" : "var(--bg-card)",
                          color: isToday ? "var(--accent-primary)" : "var(--text-muted)",
                          border: `1px solid ${isToday ? "rgba(34,211,238,0.2)" : "var(--border-subtle)"}` }}>
                        {session.blocks.length} gyakorlat
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-semibold" style={{ color: isToday ? "var(--text-secondary)" : "var(--text-muted)" }}>
                        {isToday ? "Ma nincs edzés" : "Pihenőnap"}
                      </div>
                      {isToday && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          Koppints a beállításhoz
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Jobb oldal gomb */}
                {!isPast && (
                  <div className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-sm font-black"
                    style={session
                      ? { background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.2)" }
                      : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                    {session ? "✎" : "+"}
                  </div>
                )}
              </div>

              {/* Ma gomb: edzés indítása */}
              {isToday && session && !isDone && (
                <button onClick={e => { e.stopPropagation(); router.push("/workout"); }}
                  className="mt-3 w-full rounded-2xl py-3 text-sm font-black pressable flex items-center justify-center gap-2"
                  style={{ background: "var(--accent-primary)", color: "#000" }}>
                  <span>Edzés indítása</span>
                  <span>→</span>
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
