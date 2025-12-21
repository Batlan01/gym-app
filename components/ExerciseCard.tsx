"use client";

import * as React from "react";
import type { WorkoutExercise, SetEntry } from "@/lib/types";

export function ExerciseCard({
  ex,
  lastSummary,
  onAddSet,
  onEditSet,
  onRemoveExercise,
}: {
  ex: WorkoutExercise;
  lastSummary: string;
  onAddSet: () => void;
  onEditSet: (setId: string) => void;
  onRemoveExercise: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">{ex.name}</div>
          <div className="mt-1 text-xs text-white/50">Last: {lastSummary}</div>
        </div>
        <button
          onClick={onRemoveExercise}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          title="Remove"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-3 py-2 text-xs text-white/60">
          <div className="col-span-2">#</div>
          <div className="col-span-4">kg</div>
          <div className="col-span-4">reps</div>
          <div className="col-span-2 text-right">✓</div>
        </div>

        <div className="divide-y divide-white/10">
          {ex.sets.map((s: SetEntry, idx: number) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onEditSet(s.id)}
              className="grid w-full grid-cols-12 items-center px-3 py-3 text-left hover:bg-white/5"
            >
              <div className="col-span-2 text-sm text-white/70">{idx + 1}</div>
              <div className="col-span-4 text-sm text-white">{s.weight ?? "—"}</div>
              <div className="col-span-4 text-sm text-white">{s.reps ?? "—"}</div>
              <div className="col-span-2 text-right text-sm">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border ${
                    s.done ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/5 text-white/50"
                  }`}
                >
                  {s.done ? "✓" : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={onAddSet}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/85 hover:bg-white/10"
        >
          + Set
        </button>
      </div>
    </div>
  );
}
