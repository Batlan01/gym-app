"use client";

import * as React from "react";
import type { Workout } from "@/lib/types";
import { workoutSetCounts, workoutVolume, formatK } from "@/lib/workoutMetrics";

export function WorkoutDetailSheet({
  open,
  onClose,
  workout,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  workout: Workout | null;
  onDelete: () => void;
}) {
  if (!open || !workout) return null;

  const counts = workoutSetCounts(workout);
  const vol = workoutVolume(workout);

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />

      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md pb-[env(safe-area-inset-bottom)]">
        <div className="rounded-t-3xl border border-white/10 bg-zinc-950/90 backdrop-blur p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-white/50">Edzés részletek</div>
              <div className="text-base font-semibold text-white">
                {workout.exercises.length} gyakorlat · {counts.done}/{counts.total} set · {formatK(vol)} volume
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              Bezár
            </button>
          </div>

          <div className="mt-3 max-h-[55vh] overflow-auto rounded-2xl border border-white/10">
            <div className="divide-y divide-white/10">
              {workout.exercises.map((ex) => (
                <div key={ex.id} className="p-3">
                  <div className="text-sm font-semibold text-white">{ex.name}</div>
                  <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
                    <div className="grid grid-cols-12 bg-white/5 px-3 py-2 text-xs text-white/60">
                      <div className="col-span-2">#</div>
                      <div className="col-span-5">kg</div>
                      <div className="col-span-5">reps</div>
                    </div>
                    <div className="divide-y divide-white/10">
                      {ex.sets.map((s, idx) => (
                        <div key={s.id} className="grid grid-cols-12 px-3 py-2 text-sm">
                          <div className="col-span-2 text-white/70">{idx + 1}</div>
                          <div className="col-span-5 text-white">{s.weight ?? "—"}</div>
                          <div className="col-span-5 text-white">{s.reps ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {workout.exercises.length === 0 ? (
                <div className="p-4 text-sm text-white/60">Üres edzés.</div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={onDelete}
              className="flex-1 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-sm text-red-200 hover:bg-red-500/15"
            >
              Edzés törlése
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
