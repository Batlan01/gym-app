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

const DAY_NAMES = ["Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat","Vasárnap"];
const DAY_SHORT = ["H","K","Sz","Cs","P","Sz","V"];

const SLOT_TYPES = [
  { id: "warmup",   label: "Bemelegítés", emoji: "🔥", color: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  text: "#fbbf24" },
  { id: "main",     label: "Fő edzés",    emoji: "💪", color: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.3)",  text: "var(--accent-primary)" },
  { id: "cardio",   label: "Kardio",      emoji: "🏃", color: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  text: "#4ade80" },
  { id: "cooldown", label: "Levezetés",   emoji: "🧘", color: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", text: "#a78bfa" },
] as const;
type SlotTypeId = typeof SLOT_TYPES[number]["id"];

// DaySchedule: napIdx → slotId → sessionId
// We store: pinnedDays = { "0": ["main:sessId1", "warmup:sessId2"] }
// Format: "slotType:sessionId:programId"
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
  currentEntries: string[]; // encoded entries
  onAdd: (entry: string) => void;
  onRemove: (entry: string) => void;
  onClose: () => void;
}) {
  const [selectedSlot, setSelectedSlot] = React.useState<SlotTypeId>("main");
  const slotInfo = SLOT_TYPES.find(s => s.id === selectedSlot)!;

  // Jelenlegi naphoz tartozó decoded entries
  const decoded = currentEntries.map(e => decodePinnedEntry(e)).filter(Boolean) as
    { slotId: SlotTypeId; sessionId: string; programId: string }[];

  const isAdded = (progId: string, sessId: string) =>
    decoded.some(d => d.slotId === selectedSlot && d.sessionId === sessId && d.programId === progId);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <button className="absolute inset-0" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-[2rem] overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", maxHeight: "85vh" }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 sticky top-0 z-10"
          style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>NAP BEÁLLÍTÁSA</div>
              <div className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{dayName}</div>
            </div>
            <button onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center pressable"
              style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>✕</button>
          </div>

          {/* Slot type választó */}
          <div className="grid grid-cols-4 gap-1.5">
            {SLOT_TYPES.map(slot => {
              const count = decoded.filter(d => d.slotId === slot.id).length;
              const isSelected = selectedSlot === slot.id;
              return (
                <button key={slot.id} onClick={() => setSelectedSlot(slot.id)}
                  className="rounded-xl py-2 flex flex-col items-center gap-0.5 pressable"
                  style={isSelected
                    ? { background: slot.color, border: `1px solid ${slot.border}` }
                    : { background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <span className="text-base">{slot.emoji}</span>
                  <span className="text-[9px] font-bold" style={{ color: isSelected ? slot.text : "var(--text-muted)" }}>
                    {slot.label}
                  </span>
                  {count > 0 && (
                    <span className="text-[9px] font-black rounded-full px-1.5"
                      style={{ background: slot.color, color: slot.text }}>+{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-6 pt-3 space-y-3" style={{ maxHeight: "55vh" }}>

          {/* Már hozzáadott sessionök ebben a slotban */}
          {decoded.filter(d => d.slotId === selectedSlot).length > 0 && (
            <div className="rounded-2xl p-3 space-y-2"
              style={{ background: slotInfo.color, border: `1px solid ${slotInfo.border}` }}>
              <div className="text-[10px] font-bold tracking-wider" style={{ color: slotInfo.text }}>
                {slotInfo.emoji} HOZZÁADVA
              </div>
              {decoded.filter(d => d.slotId === selectedSlot).map((d, i) => {
                const prog = programs.find(p => p.id === d.programId);
                const sess = prog?.sessions.find(s => s.id === d.sessionId);
                if (!sess) return null;
                const entry = encodePinnedEntry(d.slotId, d.sessionId, d.programId);
                return (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                    style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{sess.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{prog?.name}</div>
                    </div>
                    <button onClick={() => onRemove(entry)}
                      className="text-xs px-2 py-1 rounded-lg pressable"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                      Törlés
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Programok és sessionök */}
          {programs.length === 0 && (
            <div className="rounded-2xl p-6 text-sm text-center" style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>
              Még nincs programod.<br/>Hozz létre egyet a Programok oldalon!
            </div>
          )}

          {programs.map(prog => (
            <div key={prog.id}>
              <div className="text-[10px] font-bold tracking-widest mb-2 px-1" style={{ color: "var(--text-muted)" }}>
                {prog.name.toUpperCase()}
              </div>
              <div className="space-y-1.5">
                {prog.sessions.map(sess => {
                  const added = isAdded(prog.id, sess.id);
                  const entry = encodePinnedEntry(selectedSlot, sess.id, prog.id);
                  return (
                    <button key={sess.id}
                      onClick={() => added ? onRemove(entry) : onAdd(entry)}
                      className="w-full rounded-2xl px-4 py-3 text-left pressable flex items-center justify-between gap-3"
                      style={added
                        ? { background: slotInfo.color, border: `1px solid ${slotInfo.border}` }
                        : { background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div className="text-sm font-bold" style={{ color: added ? slotInfo.text : "var(--text-primary)" }}>
                          {sess.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {sess.blocks.length} gyakorlat
                        </div>
                      </div>
                      <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-sm font-black"
                        style={added
                          ? { background: slotInfo.border, color: slotInfo.text }
                          : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
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

  const [workouts] = useLocalStorageState<Workout[]>(
    React.useMemo(() => profileKey(pid, "workouts"), [pid]), []
  );

  React.useEffect(() => { setPrograms(readPrograms(pid)); }, [pid]);

  const weekDates = React.useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const today = todayIdx();
  const isCurrentWeek = weekOffset === 0;

  // Összes pinned entry napra: dayIdx → string[]
  const schedule = React.useMemo(() => {
    const map: Record<number, string[]> = {};
    for (const prog of programs) {
      const pinned = prog.schedule?.pinnedDays ?? {};
      for (const [dayKey, entries] of Object.entries(pinned)) {
        const dayIdx = parseInt(dayKey);
        if (!map[dayIdx]) map[dayIdx] = [];
        // Support both old format (string) and new format (string[])
        if (Array.isArray(entries)) {
          // new format: migrate old string entries if needed
          map[dayIdx].push(...(entries as string[]).map(e =>
            e.includes(":") ? e : encodePinnedEntry("main", e, prog.id)
          ));
        } else {
          // old format: single string
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
      {/* Header */}
      <div className="px-4 pt-12 pb-2">
        <div className="label-xs mb-1">ARCX</div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Naptár</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Koppints egy napra az edzés beállításához</p>
      </div>

      {/* Hét navigátor */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setWeekOffset(w => w - 1)} className="rounded-xl px-3 py-2 text-sm pressable"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          ← Előző
        </button>
        <button onClick={() => setWeekOffset(0)} className="rounded-xl px-3 py-2 text-xs font-bold pressable"
          style={isCurrentWeek
            ? { background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.3)" }
            : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          {isCurrentWeek ? "Ez a hét" : `${weekDates[0].getMonth()+1}/${weekDates[0].getDate()} – ${weekDates[6].getMonth()+1}/${weekDates[6].getDate()}`}
        </button>
        <button onClick={() => setWeekOffset(w => w + 1)} className="rounded-xl px-3 py-2 text-sm pressable"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          Következő →
        </button>
      </div>

      {/* Heti nézet */}
      <div className="px-4 space-y-2">
        {weekDates.map((date, dayIdx) => {
          const entries = schedule[dayIdx] ?? [];
          const decoded = entries.map(e => decodePinnedEntry(e)).filter(Boolean) as
            { slotId: SlotTypeId; sessionId: string; programId: string }[];
          const isToday = isCurrentWeek && dayIdx === today;
          const isDone = doneDays.has(dayIdx);
          const isPast = isCurrentWeek && dayIdx < today;

          // Slot-ok összegyűjtve megjelenítéshez
          const slotGroups = SLOT_TYPES.map(slot => ({
            slot,
            items: decoded.filter(d => d.slotId === slot.id).map(d => {
              const prog = programs.find(p => p.id === d.programId);
              const sess = prog?.sessions.find(s => s.id === d.sessionId);
              return { prog, sess };
            }).filter(x => x.sess),
          })).filter(g => g.items.length > 0);

          return (
            <button key={dayIdx}
              onClick={() => isPast && !isToday ? null : setPicker({ dayIdx })}
              className="w-full rounded-3xl p-4 text-left pressable"
              style={{
                background: isToday ? "rgba(34,211,238,0.07)" : isDone ? "rgba(74,222,128,0.05)" : "var(--bg-surface)",
                border: isToday ? "1px solid rgba(34,211,238,0.3)" : isDone ? "1px solid rgba(74,222,128,0.2)" : "1px solid var(--border-subtle)",
                opacity: isPast && !isToday ? 0.45 : 1,
              }}>
              <div className="flex items-start gap-3">
                {/* Dátum */}
                <div className="shrink-0 text-center w-10 pt-0.5">
                  <div className="text-[10px] font-bold uppercase"
                    style={{ color: isToday ? "var(--accent-primary)" : "var(--text-muted)" }}>{DAY_SHORT[dayIdx]}</div>
                  <div className="text-xl font-black"
                    style={{ color: isToday ? "var(--accent-primary)" : isDone ? "var(--accent-green)" : "var(--text-secondary)" }}>
                    {date.getDate()}
                  </div>
                </div>
                <div className="w-px self-stretch shrink-0" style={{ background: "var(--border-subtle)" }} />

                {/* Session tartalom */}
                <div className="flex-1 min-w-0">
                  {isDone ? (
                    <div className="text-sm font-black" style={{ color: "var(--accent-green)" }}>✓ Teljesítve</div>
                  ) : slotGroups.length > 0 ? (
                    <div className="space-y-1.5">
                      {slotGroups.map(({ slot, items }) => (
                        <div key={slot.id} className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs">{slot.emoji}</span>
                          {items.map((item, i) => (
                            <span key={i} className="rounded-lg px-2 py-0.5 text-xs font-semibold"
                              style={{ background: slot.color, color: slot.text, border: `1px solid ${slot.border}` }}>
                              {item.sess!.name}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-semibold" style={{ color: isToday ? "var(--text-secondary)" : "var(--text-muted)" }}>
                        {isToday ? "Ma nincs edzés" : "Pihenőnap"}
                      </div>
                      {isToday && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Koppints a beállításhoz</div>}
                    </div>
                  )}
                </div>

                {/* Edit gomb */}
                {!isPast && (
                  <div className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-sm font-black mt-0.5"
                    style={slotGroups.length > 0
                      ? { background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.2)" }
                      : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                    {slotGroups.length > 0 ? "✎" : "+"}
                  </div>
                )}
              </div>

              {/* Edzés indítása */}
              {isToday && slotGroups.length > 0 && !isDone && (
                <button onClick={e => { e.stopPropagation(); router.push("/workout"); }}
                  className="mt-3 w-full rounded-2xl py-3 text-sm font-black pressable flex items-center justify-center gap-2"
                  style={{ background: "var(--accent-primary)", color: "#000" }}>
                  Edzés indítása →
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Programok összefoglaló */}
      {programs.length > 0 && (
        <div className="mx-4 mt-4 rounded-3xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <div className="label-xs mb-3">AKTÍV PROGRAMOK</div>
          {programs.map(prog => {
            const allEntries = Object.values(prog.schedule?.pinnedDays ?? {}).flat();
            return (
              <button key={prog.id} onClick={() => router.push(`/programs/${prog.id}`)}
                className="w-full flex items-center justify-between py-2.5 pressable"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{prog.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {allEntries.length > 0 ? `${allEntries.length} slot ütemezve` : "Nincs ütemezve"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {programs.length === 0 && (
        <div className="mx-4 mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <div className="text-3xl mb-2">📅</div>
          <div className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Nincs program</div>
          <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Hozz létre programot az ütemezéshez</div>
          <button onClick={() => router.push("/programs")} className="rounded-2xl px-4 py-2.5 text-sm font-bold pressable"
            style={{ background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.3)" }}>
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
