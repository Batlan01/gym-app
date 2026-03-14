"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { readPrograms, upsertProgram } from "@/lib/programsStorage";
import type { UserProgram, ProgramSessionTemplate } from "@/lib/programsTypes";
import type { Workout } from "@/lib/types";
import { profileKey } from "@/lib/profiles";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const DAY_NAMES = ["Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat","Vasárnap"];
const DAY_SHORT = ["H","K","Sz","Cs","P","Sz","V"];

const SLOT_TYPES = [
  { id: "warmup",   label: "Bemelegítés", emoji: "🔥", accent: "#fbbf24" },
  { id: "main",     label: "Fő edzés",    emoji: "💪", accent: "var(--accent-primary)" },
  { id: "cardio",   label: "Kardio",      emoji: "🏃", accent: "#4ade80" },
  { id: "cooldown", label: "Levezetés",   emoji: "🧘", accent: "#a78bfa" },
] as const;
type SlotTypeId = typeof SLOT_TYPES[number]["id"];

function encodePinnedEntry(slotId: SlotTypeId, sessionId: string, programId: string) {
  return `${slotId}:${sessionId}:${programId}`;
}
function decodePinnedEntry(entry: string): { slotId: SlotTypeId; sessionId: string; programId: string } | null {
  const parts = entry.split(":");
  if (parts.length < 3) return null;
  const [slotId, sessionId, ...rest] = parts;
  return { slotId: slotId as SlotTypeId, sessionId, programId: rest.join(":") };
}

function todayIdx() { return (new Date().getDay() + 6) % 7; }
function getWeekDates(offsetWeeks = 0): Date[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d;
  });
}

// ── Session Picker Modal ──────────────────────────────────────
function SessionPickerModal({ dayName, programs, currentEntries, onAdd, onRemove, onClose }: {
  dayName: string;
  programs: UserProgram[];
  currentEntries: string[];
  onAdd: (entry: string) => void;
  onRemove: (entry: string) => void;
  onClose: () => void;
}) {
  const [selectedSlot, setSelectedSlot] = React.useState<SlotTypeId>("main");
  const slotInfo = SLOT_TYPES.find(s => s.id === selectedSlot)!;

  const decoded = currentEntries.map(e => decodePinnedEntry(e)).filter(Boolean) as
    { slotId: SlotTypeId; sessionId: string; programId: string }[];

  const isAdded = (progId: string, sessId: string) =>
    decoded.some(d => d.slotId === selectedSlot && d.sessionId === sessId && d.programId === progId);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <button className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background:"var(--bg-elevated)", maxHeight: "88vh" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ background:"var(--surface-3)" }} />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 sticky top-0 z-10" style={{ background:"var(--bg-elevated)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[9px] font-black tracking-widest mb-0.5" style={{ color:"var(--text-muted)" }}>
                NAP BEÁLLÍTÁSA
              </div>
              <div className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{dayName}</div>
            </div>
            <button onClick={onClose}
              className="h-9 w-9 rounded-2xl flex items-center justify-center pressable"
              style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>✕</button>
          </div>

          {/* Slot type tab-ok — flat solid fill */}
          <div className="grid grid-cols-4 gap-1.5">
            {SLOT_TYPES.map(slot => {
              const count = decoded.filter(d => d.slotId === slot.id).length;
              const isSelected = selectedSlot === slot.id;
              return (
                <button key={slot.id} onClick={() => setSelectedSlot(slot.id)}
                  className="rounded-2xl py-2.5 flex flex-col items-center gap-0.5 pressable relative"
                  style={isSelected
                    ? { background: slot.accent === "var(--accent-primary)" ? "var(--accent-primary)" : slot.accent, color: "#000" }
                    : { background:"var(--surface-1)", color:"var(--text-secondary)" }}>
                  <span className="text-lg leading-none">{slot.emoji}</span>
                  <span className="text-[9px] font-black mt-0.5" style={{ color: isSelected ? "#000" : "rgba(255,255,255,0.4)" }}>
                    {slot.label}
                  </span>
                  {count > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-black"
                      style={{ background: slot.accent === "var(--accent-primary)" ? "var(--accent-primary)" : slot.accent, color: "#000" }}>
                      {count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-8 space-y-3" style={{ maxHeight: "55vh" }}>

          {/* Már hozzáadott sessionök */}
          {decoded.filter(d => d.slotId === selectedSlot).length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background:"var(--surface-1)" }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span>{slotInfo.emoji}</span>
                <span className="text-[10px] font-black tracking-widest" style={{ color:"var(--text-muted)" }}>
                  HOZZÁADVA
                </span>
              </div>
              {decoded.filter(d => d.slotId === selectedSlot).map((d, i) => {
                const prog = programs.find(p => p.id === d.programId);
                const sess = prog?.sessions.find(s => s.id === d.sessionId);
                if (!sess) return null;
                const entry = encodePinnedEntry(d.slotId, d.sessionId, d.programId);
                return (
                  <div key={i} className="flex items-center justify-between gap-3 px-4 py-3"
                    style={{ borderBottom: i < decoded.filter(d => d.slotId === selectedSlot).length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{sess.name}</div>
                      <div className="text-xs" style={{ color:"var(--text-muted)" }}>{prog?.name}</div>
                    </div>
                    <button onClick={() => onRemove(entry)}
                      className="text-xs px-3 py-1.5 rounded-xl font-bold pressable"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                      Törlés
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Üres állapot */}
          {programs.length === 0 && (
            <div className="rounded-2xl p-6 text-sm text-center" style={{ color:"var(--text-muted)", background:"var(--surface-0)" }}>
              Még nincs programod.<br/>Hozz létre egyet a Programok oldalon!
            </div>
          )}

          {/* Programok listája */}
          {programs.map(prog => (
            <div key={prog.id}>
              <div className="text-[9px] font-black tracking-widest mb-2 px-1" style={{ color:"var(--text-muted)" }}>
                {prog.name.toUpperCase()}
              </div>
              <div className="space-y-1">
                {prog.sessions.map(sess => {
                  const added = isAdded(prog.id, sess.id);
                  const entry = encodePinnedEntry(selectedSlot, sess.id, prog.id);
                  const accentColor = slotInfo.accent === "var(--accent-primary)" ? "var(--accent-primary)" : slotInfo.accent;
                  return (
                    <button key={sess.id}
                      onClick={() => added ? onRemove(entry) : onAdd(entry)}
                      className="w-full rounded-2xl px-4 py-3.5 text-left pressable flex items-center justify-between gap-3"
                      style={added
                        ? { background: accentColor, color: "#000" }
                        : { background:"var(--surface-1)" }}>
                      <div>
                        <div className="text-sm font-black" style={{ color: added ? "#000" : "var(--text-primary)" }}>
                          {sess.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: added ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.3)" }}>
                          {sess.blocks.length} gyakorlat
                        </div>
                      </div>
                      <div className="shrink-0 h-7 w-7 rounded-xl flex items-center justify-center text-sm font-black"
                        style={added
                          ? { background: "rgba(0,0,0,0.15)", color: "#000" }
                          : { background:"var(--surface-2)", color:"var(--text-secondary)" }}>
                        {added ? "✓" : "+"}
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

  // Coach által kijelölt edzések (dátum → assignmentok)
  const [coachSchedule, setCoachSchedule] = React.useState<Record<string, { programName: string; sessionName: string }[]>>({});

  const [workouts] = useLocalStorageState<Workout[]>(
    React.useMemo(() => profileKey(pid, "workouts"), [pid]), []
  );

  React.useEffect(() => { setPrograms(readPrograms(pid)); }, [pid]);

  const weekDates = React.useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const today = todayIdx();
  const isCurrentWeek = weekOffset === 0;

  // Betöltjük a coach által kijelölt edzéseket az aktuális hónapra
  React.useEffect(() => {
    (async () => {
      try {
        const auth = getAuth();
        const user = await new Promise<import("firebase/auth").User|null>(res => {
          const u = onAuthStateChanged(auth, user => { u(); res(user); });
        });
        if (!user) return;
        const token = await user.getIdToken();
        const firstDay = weekDates[0];
        const lastDay  = weekDates[6];
        const month1 = `${firstDay.getFullYear()}-${String(firstDay.getMonth()+1).padStart(2,"0")}`;
        const month2 = `${lastDay.getFullYear()}-${String(lastDay.getMonth()+1).padStart(2,"0")}`;
        const months = month1 === month2 ? [month1] : [month1, month2];

        const map: Record<string, { programName: string; sessionName: string }[]> = {};
        for (const month of months) {
          const res = await fetch(`/api/athlete/schedule?month=${month}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) continue;
          const data = await res.json();
          for (const e of data.entries ?? []) {
            map[e.date] = (e.assignments ?? []).map((a: { programName: string; sessionName: string }) => ({
              programName: a.programName, sessionName: a.sessionName,
            }));
          }
        }
        setCoachSchedule(map);
      } catch(e) { console.error(e); }
    })();
  }, [weekDates]);

  const schedule = React.useMemo(() => {
    const map: Record<number, string[]> = {};
    for (const prog of programs) {
      const pinned = prog.schedule?.pinnedDays ?? {};
      for (const [dayKey, entries] of Object.entries(pinned)) {
        const dayIdx = parseInt(dayKey);
        if (!map[dayIdx]) map[dayIdx] = [];
        if (Array.isArray(entries)) {
          map[dayIdx].push(...(entries as string[]).map(e =>
            e.includes(":") ? e : encodePinnedEntry("main", e, prog.id)
          ));
        } else {
          map[dayIdx].push(encodePinnedEntry("main", entries as string, prog.id));
        }
      }
    }
    return map;
  }, [programs]);

  const doneDays = React.useMemo(() => {
    const set = new Set<number>();
    for (const w of workouts) {
      const d = new Date(w.startedAt);
      if (d >= weekDates[0] && d <= new Date(weekDates[6].getTime() + 86400000))
        set.add((d.getDay() + 6) % 7);
    }
    return set;
  }, [workouts, weekDates]);

  function handleAdd(dayIdx: number, entry: string) {
    const decoded = decodePinnedEntry(entry);
    if (!decoded) return;
    const updated = programs.map(prog => {
      if (prog.id !== decoded.programId) return prog;
      const pinned: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(prog.schedule?.pinnedDays ?? {})) {
        pinned[k] = Array.isArray(v) ? [...v] : [encodePinnedEntry("main", v as string, prog.id)];
      }
      const key = String(dayIdx);
      pinned[key] = [...(pinned[key] ?? []), entry];
      return { ...prog, schedule: { ...prog.schedule, pinnedDays: pinned } };
    });
    updated.forEach(p => upsertProgram(pid, p));
    setPrograms(updated);
  }

  function handleRemove(dayIdx: number, entry: string) {
    const decoded = decodePinnedEntry(entry);
    if (!decoded) return;
    const updated = programs.map(prog => {
      if (prog.id !== decoded.programId) return prog;
      const pinned: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(prog.schedule?.pinnedDays ?? {})) {
        pinned[k] = (Array.isArray(v) ? v : [encodePinnedEntry("main", v as string, prog.id)]).filter(e => e !== entry);
      }
      return { ...prog, schedule: { ...prog.schedule, pinnedDays: pinned } };
    });
    updated.forEach(p => upsertProgram(pid, p));
    setPrograms(updated);
  }

  const pickerEntries = picker !== null ? (schedule[picker.dayIdx] ?? []) : [];

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
    <div className="flex-1 pb-32 animate-in">

      {/* ── HEADER ── */}
      <div className="px-4 pt-10 pb-3">
        <div className="text-[10px] font-black tracking-widest mb-1" style={{ color:"var(--text-muted)" }}>ARCX</div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Naptár</h1>
      </div>

      {/* ── HÉT NAVIGÁTOR ── */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="h-10 w-10 rounded-2xl flex items-center justify-center font-black pressable"
          style={{ background:"var(--surface-1)", color:"var(--text-secondary)" }}>
          ←
        </button>
        <button onClick={() => setWeekOffset(0)}
          className="flex-1 h-10 rounded-2xl text-xs font-black pressable"
          style={isCurrentWeek
            ? { background: "var(--accent-primary)", color: "#000" }
            : { background:"var(--surface-1)", color:"var(--text-secondary)" }}>
          {isCurrentWeek
            ? "Ez a hét"
            : `${weekDates[0].getMonth()+1}/${weekDates[0].getDate()} – ${weekDates[6].getMonth()+1}/${weekDates[6].getDate()}`}
        </button>
        <button onClick={() => setWeekOffset(w => w + 1)}
          className="h-10 w-10 rounded-2xl flex items-center justify-center font-black pressable"
          style={{ background:"var(--surface-1)", color:"var(--text-secondary)" }}>
          →
        </button>
      </div>

      {/* ── HETI NAPKÁRTYÁK ── */}
      <div className="px-4 space-y-2">
        {weekDates.map((date, dayIdx) => {
          const entries = schedule[dayIdx] ?? [];
          const decoded = entries.map(e => decodePinnedEntry(e)).filter(Boolean) as
            { slotId: SlotTypeId; sessionId: string; programId: string }[];
          const isToday = isCurrentWeek && dayIdx === today;
          const isDone = doneDays.has(dayIdx);
          const isPast = isCurrentWeek && dayIdx < today;

          const slotGroups = SLOT_TYPES.map(slot => ({
            slot,
            items: decoded.filter(d => d.slotId === slot.id).map(d => {
              const prog = programs.find(p => p.id === d.programId);
              const sess = prog?.sessions.find(s => s.id === d.sessionId);
              return { prog, sess };
            }).filter(x => x.sess),
          })).filter(g => g.items.length > 0);

          // Kártya háttér: ma = solid accent (halvány), teljesítve = zöld, egyéb = sötét flat
          const cardBg = isToday
            ? "rgba(34,211,238,0.07)"
            : isDone
              ? "rgba(74,222,128,0.05)"
              : "rgba(255,255,255,0.03)";

          return (
            <button key={dayIdx}
              onClick={() => isPast && !isToday ? null : setPicker({ dayIdx })}
              className="w-full rounded-2xl p-4 text-left pressable"
              style={{ background: cardBg, opacity: isPast && !isToday ? 0.4 : 1 }}>

              <div className="flex items-start gap-3">
                {/* Dátum blokk */}
                <div className="shrink-0 w-9 text-center">
                  <div className="text-[9px] font-black tracking-widest uppercase"
                    style={{ color: isToday ? "var(--accent-primary)" : "rgba(255,255,255,0.25)" }}>
                    {DAY_SHORT[dayIdx]}
                  </div>
                  <div className="text-xl font-black leading-tight"
                    style={{ color: isToday ? "var(--accent-primary)" : isDone ? "#4ade80" : "var(--text-secondary)" }}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Elválasztó */}
                <div className="w-px self-stretch shrink-0" style={{ background:"var(--surface-2)" }} />

                {/* Tartalom */}
                <div className="flex-1 min-w-0">
                  {isDone ? (
                    <div className="text-sm font-black" style={{ color: "#4ade80" }}>✓ Teljesítve</div>
                  ) : slotGroups.length > 0 ? (
                    <div className="space-y-1.5">
                      {slotGroups.map(({ slot, items }) => (
                        <div key={slot.id} className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs">{slot.emoji}</span>
                          {items.map((item, i) => (
                            <span key={i} className="rounded-lg px-2 py-0.5 text-xs font-black"
                              style={{
                                background:"var(--surface-2)",
                                color: slot.accent === "var(--accent-primary)" ? "var(--accent-primary)" : slot.accent,
                              }}>
                              {item.sess!.name}
                            </span>
                          ))}
                        </div>
                      ))}
                      {/* Coach kijelölések */}
                      {(() => {
                        const dk = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
                        const ca = coachSchedule[dk];
                        return ca?.length ? (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-xs">🎽</span>
                            {ca.map((a,i)=>(
                              <span key={i} className="rounded-lg px-2 py-0.5 text-xs font-black"
                                style={{ background:"rgba(168,85,247,0.15)", color:"#c084fc" }}>
                                {a.sessionName}
                              </span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : (() => {
                    const dk = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
                    const ca = coachSchedule[dk];
                    return ca?.length ? (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs">🎽</span>
                          <span className="text-xs font-bold" style={{ color:"#c084fc" }}>Coach terv</span>
                          {ca.map((a,i)=>(
                            <span key={i} className="rounded-lg px-2 py-0.5 text-xs font-black"
                              style={{ background:"rgba(168,85,247,0.15)", color:"#c084fc" }}>
                              {a.programName} · {a.sessionName}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold"
                        style={{ color: isToday ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>
                        {isToday ? "Koppints a beállításhoz" : "Pihenőnap"}
                      </div>
                    );
                  })()}
                </div>

                {/* + / ✎ gomb */}
                {!isPast && (
                  <div className="shrink-0 h-7 w-7 rounded-xl flex items-center justify-center text-sm font-black"
                    style={{ background:"var(--surface-2)", color:"var(--text-muted)" }}>
                    {slotGroups.length > 0 ? "✎" : "+"}
                  </div>
                )}
              </div>

              {/* Edzés indítása — ma + van terv + nincs teljesítve */}
              {isToday && slotGroups.length > 0 && !isDone && (
                <button onClick={e => { e.stopPropagation(); router.push("/workout"); }}
                  className="mt-3 w-full rounded-xl py-3 text-sm font-black pressable"
                  style={{ background: "var(--accent-primary)", color: "#000" }}>
                  Edzés indítása →
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Üres állapot — nincs program */}
      {programs.length === 0 && (
        <div className="mx-4 mt-4 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
          style={{ background:"var(--surface-0)" }}>
          <div className="text-4xl mb-3">📅</div>
          <div className="text-base font-black mb-1" style={{ color: "var(--text-primary)" }}>Nincs program</div>
          <div className="text-sm mb-5" style={{ color:"var(--text-muted)" }}>Hozz létre programot az ütemezéshez</div>
          <button onClick={() => router.push("/programs")}
            className="rounded-xl px-5 py-3 text-sm font-black pressable"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            Programok →
          </button>
        </div>
      )}
    </div>

    {picker && (
      <SessionPickerModal
        dayName={DAY_NAMES[picker.dayIdx]}
        programs={programs}
        currentEntries={pickerEntries}
        onAdd={entry => handleAdd(picker.dayIdx, entry)}
        onRemove={entry => handleRemove(picker.dayIdx, entry)}
        onClose={() => setPicker(null)} />
    )}
    <BottomNav />
    </div>
  );
}
