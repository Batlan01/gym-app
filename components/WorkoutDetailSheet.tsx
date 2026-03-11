"use client";

import * as React from "react";
import { useTranslation } from "@/lib/i18n";
import type { Workout } from "@/lib/types";
import { workoutSetCounts, workoutVolume, formatK } from "@/lib/workoutMetrics";

function fmtDuration(w: Workout): string {
  if (!w.finishedAt) return "—";
  const mins = Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
}

function ExerciseDetail({ ex }: { ex: Workout["exercises"][number] }) {
  const doneSets = ex.sets.filter(s => s.done && s.reps && s.weight);
  const maxWeight = doneSets.length ? Math.max(...doneSets.map(s => s.weight ?? 0)) : 0;
  const vol = doneSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0);
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{ex.name}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {doneSets.length} set · {maxWeight > 0 ? `max ${maxWeight} kg` : ""}
            {vol > 0 ? ` · ${formatK(vol)} vol` : ""}
          </div>
        </div>
        {doneSets.length > 0 && (
          <div className="text-lg font-black" style={{ color: "var(--accent-primary)" }}>
            {maxWeight > 0 ? `${maxWeight}kg` : `${doneSets[0]?.reps}×`}
          </div>
        )}
      </div>
      <div className="px-4 py-3">
        <div className="grid text-[10px] font-bold mb-2"
          style={{ gridTemplateColumns: "32px 1fr 1fr 1fr", color: "var(--text-muted)" }}>
          <div>#</div><div>Súly</div><div>Ismétlés</div><div>Volume</div>
        </div>
        {ex.sets.map((s, i) => {
          const setVol = (s.reps ?? 0) * (s.weight ?? 0);
          return (
            <div key={s.id} className="grid text-xs py-1.5"
              style={{
                gridTemplateColumns: "32px 1fr 1fr 1fr",
                color: s.done ? "var(--text-primary)" : "var(--text-muted)",
                opacity: s.done ? 1 : 0.4,
              }}>
              <div className="font-bold" style={{ color: s.done ? "var(--accent-primary)" : "var(--text-muted)" }}>{i + 1}</div>
              <div>{s.weight != null ? `${s.weight} kg` : "—"}</div>
              <div>{s.reps != null ? `${s.reps} ×` : "—"}</div>
              <div>{setVol > 0 ? `${setVol} kg` : "—"}</div>
            </div>
          );
        })}
      </div>
      {ex.sets.length > 0 && (
        <div className="px-4 pb-3">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
            <div className="h-full rounded-full"
              style={{ width: `${(doneSets.length / ex.sets.length) * 100}%`, background: "var(--accent-primary)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkoutDetailSheet({
  open, onClose, workout, onDelete,
}: {
  open: boolean; onClose: () => void;
  workout: Workout | null; onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState<"summary" | "exercises">("summary");

  React.useEffect(() => { if (open) setTab("summary"); }, [open]);
  if (!open || !workout) return null;

  const counts = workoutSetCounts(workout);
  const vol = workoutVolume(workout);
  const dur = fmtDuration(workout);
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.filter(st => st.done).length, 0);

  const exVolumes = workout.exercises.map(ex => ({
    name: ex.name.length > 12 ? ex.name.slice(0, 12) + "…" : ex.name,
    vol: ex.sets.filter(s => s.done).reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0),
    sets: ex.sets.filter(s => s.done).length,
  })).filter(e => e.vol > 0 || e.sets > 0);
  const maxVol = exVolumes.length ? Math.max(...exVolumes.map(e => e.vol), 1) : 1;

  const TABS: { id: "summary" | "exercises"; label: string }[] = [
    { id: "summary", label: "📊 Összefoglaló" },
    { id: "exercises", label: `🏋️ Gyakorlatok (${workout.exercises.length})` },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <button className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="relative mx-auto w-full max-w-md rounded-t-[2rem] overflow-hidden"
        style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-mid)", maxHeight: "88dvh", paddingBottom: "env(safe-area-inset-bottom)" }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ background: "var(--border-mid)" }} />
        </div>

        <div className="px-5 pt-2 pb-3">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <div className="label-xs mb-1">EDZÉS ÖSSZEFOGLALÓ</div>
              <div className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                {workout.title || fmtDate(workout.startedAt)}
              </div>
            </div>
            <button onClick={onClose} className="pressable rounded-xl p-2"
              style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>✕</button>
          </div>
          <div className="flex gap-2 flex-wrap mt-3">
            {[
              { icon: "💪", val: `${workout.exercises.length} ${t.workout.exercise_count ?? "gyak."}` },
              { icon: "✅", val: `${counts.done}/${counts.total} set` },
              { icon: "📈", val: `${formatK(vol)} kg` },
              ...(dur !== "—" ? [{ icon: "⏱", val: dur }] : []),
            ].map(c => (
              <div key={c.val} className="flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-semibold"
                style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                <span>{c.icon}</span><span>{c.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1 px-5 mb-3">
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className="flex-1 rounded-xl py-2 text-xs font-bold pressable"
              style={tab === tb.id
                ? { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-mid)" }
                : { color: "var(--text-muted)" }}>
              {tb.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-5 pb-5" style={{ maxHeight: "52vh" }}>
          {tab === "summary" && (
            <div className="space-y-4">
              {exVolumes.length > 0 && (
                <div className="rounded-2xl p-4"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                  <div className="label-xs mb-3">VOLUME PER GYAKORLAT</div>
                  <div className="space-y-2">
                    {exVolumes.map((e, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span style={{ color: "var(--text-secondary)" }}>{e.name}</span>
                          <span style={{ color: "var(--text-muted)" }}>{e.vol > 0 ? `${formatK(e.vol)} kg` : `${e.sets} set`}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-card)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(8, Math.round((e.vol / maxVol) * 100))}%`, background: `hsl(${180 + i * 30}, 80%, 60%)`, opacity: 0.9 - i * 0.05 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <div className="shrink-0">
                  {(() => {
                    const pct = counts.total > 0 ? counts.done / counts.total : 0;
                    const r = 28; const circ = 2 * Math.PI * r;
                    return (
                      <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
                        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--bg-card)" strokeWidth={7} />
                        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--accent-primary)"
                          strokeWidth={7} strokeLinecap="round" strokeDasharray={circ}
                          strokeDashoffset={circ * (1 - pct)} style={{ transition: "stroke-dashoffset 1s ease" }} />
                        <text x={36} y={36} textAnchor="middle" dominantBaseline="central"
                          style={{ fill: "var(--text-primary)", fontSize: 14, fontWeight: 800, transform: "rotate(90deg)", transformOrigin: "36px 36px" }}>
                          {Math.round(pct * 100)}%
                        </text>
                      </svg>
                    );
                  })()}
                </div>
                <div>
                  <div className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{counts.done} / {counts.total} set</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{totalSets} befejezett set</div>
                  {dur !== "—" && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>⏱ {dur}</div>}
                </div>
              </div>
            </div>
          )}

          {tab === "exercises" && (
            <div className="space-y-3">
              {workout.exercises.map(ex => <ExerciseDetail key={ex.id} ex={ex} />)}
            </div>
          )}
        </div>

        <div className="px-5 pt-3 pb-2 flex gap-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onDelete} className="rounded-2xl py-3 px-4 text-sm font-semibold pressable"
            style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
            🗑 {t.common.delete ?? "Törlés"}
          </button>
          <button onClick={onClose} className="flex-1 rounded-2xl py-3 text-sm font-bold pressable"
            style={{ background: "var(--accent-primary)", color: "#000" }}>
            {t.common.close ?? "Bezárás"}
          </button>
        </div>
      </div>
    </div>
  );
}
