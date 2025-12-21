"use client";

import * as React from "react";
import { BottomNav } from "@/components/BottomNav";
import { WorkoutDetailSheet } from "@/components/WorkoutDetailSheet";
import type { Workout } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import {
  workoutVolume,
  workoutSetCounts,
  workoutExerciseCount,
  formatDT,
  withinLastDays,
  topExercisesByVolume,
  formatK,
} from "@/lib/workoutMetrics";

const LS_HISTORY = "gym.workouts";

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

export default function ProgressPage() {
  const [history, setHistory] = useLocalStorageState<Workout[]>(LS_HISTORY, []);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = React.useMemo(
    () => (selectedId ? history.find((w) => w.id === selectedId) ?? null : null),
    [history, selectedId]
  );

  const totalWorkouts = history.length;
  const last7 = history.filter((w) => withinLastDays(w, 7)).length;
  const totalVolume = history.reduce((a, w) => a + workoutVolume(w), 0);

  const top = React.useMemo(() => topExercisesByVolume(history, 5), [history]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const deleteWorkout = React.useCallback(() => {
    if (!selectedId) return;
    const ok = window.confirm("Törlöd ezt az edzést?");
    if (!ok) return;

    setHistory((prev) => prev.filter((w) => w.id !== selectedId));
    setDetailOpen(false);
    setSelectedId(null);
  }, [selectedId, setHistory]);

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28">
      <header className="mb-4">
        <div className="text-xs tracking-widest text-white/50">PROGRESS</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Statisztika</h1>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <StatPill label="Összes" value={`${totalWorkouts}`} />
        <StatPill label="7 nap" value={`${last7}`} />
        <StatPill label="Volume" value={formatK(totalVolume)} />
      </section>

      {top.length > 0 ? (
        <section className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">Top gyakorlatok (volume)</div>
          <div className="mt-2 space-y-2">
            {top.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-3">
                <div className="text-sm text-white/85">{t.name}</div>
                <div className="text-sm text-white/60">{formatK(t.volume)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <header className="mt-5 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Edzések</h2>
        {history.length > 0 ? (
          <button
            onClick={() => {
              const ok = window.confirm("Minden edzést törölsz?");
              if (ok) setHistory([]);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </header>

      <section className="space-y-3">
        {history.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Még nincs mentett edzés.
          </div>
        ) : (
          history.map((w) => {
            const counts = workoutSetCounts(w);
            const vol = workoutVolume(w);
            const exCount = workoutExerciseCount(w);
            const time = formatDT(w.startedAt);

            return (
              <button
                key={w.id}
                onClick={() => openDetail(w.id)}
                className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{time}</div>
                  <div className="text-xs text-white/50">{formatK(vol)} vol</div>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                    {exCount} ex
                  </span>
                  <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                    {counts.done}/{counts.total} sets
                  </span>
                </div>
              </button>
            );
          })
        )}
      </section>

      <WorkoutDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        workout={selected}
        onDelete={deleteWorkout}
      />

      <BottomNav />
    </main>
  );
}
