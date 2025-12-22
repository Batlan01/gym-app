"use client";

import * as React from "react";
import type { WorkoutExercise } from "@/lib/types";
import { isSetFilled } from "@/lib/workoutHelpers";

export function ExerciseCard({
  ex,
  lastSummary,
  onAddSet,
  onEditSet,
  onRemoveExercise,
  onToggleDone,
  onStartRest,
}: {
  ex: WorkoutExercise;
  lastSummary: string;
  onAddSet: () => void;
  onEditSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onToggleDone: (setId: string) => void;
  onStartRest: () => void;
}) {
  const volume = ex.sets.reduce((acc, s) => {
    if (!isSetFilled(s)) return acc;
    return acc + (s.weight ?? 0) * (s.reps ?? 0);
  }, 0);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{ex.name}</div>
          <div className="mt-1 text-xs text-white/50">
            Last: <span className="text-white/70">{lastSummary}</span>
            {volume > 0 ? <span className="text-white/40"> · vol {Math.round(volume)}</span> : null}
          </div>
        </div>

        <button
          onClick={onRemoveExercise}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
          title="Remove"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-3 py-2 text-xs text-white/60">
          <div className="col-span-2">#</div>
          <div className="col-span-4">kg</div>
          <div className="col-span-4">reps</div>
          <div className="col-span-2 text-right">done</div>
        </div>

        <div className="divide-y divide-white/10">
          {ex.sets.map((s, idx) => {
            const filled = isSetFilled(s);
            return (
              <div key={s.id} className="grid grid-cols-12 items-center px-3 py-2">
                <button
                  onClick={() => onEditSet(s.id)}
                  className="col-span-10 grid grid-cols-10 items-center text-left"
                >
                  <div className="col-span-2 text-sm text-white/70">{idx + 1}</div>
                  <div className="col-span-4 text-sm text-white">{s.weight ?? "—"}</div>
                  <div className="col-span-4 text-sm text-white">{s.reps ?? "—"}</div>
                </button>

                <button
                  onClick={() => (filled ? onToggleDone(s.id) : onEditSet(s.id))}
                  className={`col-span-2 ml-auto h-9 w-9 rounded-xl border text-sm ${
                    s.done
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  title={filled ? "Done" : "Fill first"}
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onAddSet}
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/85 hover:bg-white/10"
        >
          + Set
        </button>
        <button
          onClick={onStartRest}
          className="w-24 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/80 hover:bg-white/10"
        >
          Rest
        </button>
      </div>
    </div>
  );
}
