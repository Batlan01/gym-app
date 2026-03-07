"use client";

import * as React from "react";
import type { WorkoutExercise } from "@/lib/types";
import { isSetFilled } from "@/lib/workoutHelpers";

export function ExerciseCard({
  ex, lastSummary, onAddSet, onEditSet,
  onRemoveExercise, onToggleDone, onStartRest,
}: {
  ex: WorkoutExercise;
  lastSummary: string;
  onAddSet: () => void;
  onEditSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onToggleDone: (setId: string) => void;
  onStartRest: () => void;
}) {
  const doneSets = ex.sets.filter(s => s.done).length;
  const totalSets = ex.sets.length;
  const volume = ex.sets.reduce((acc, s) =>
    isSetFilled(s) ? acc + (s.weight ?? 0) * (s.reps ?? 0) : acc, 0);

  return (
    <div className="overflow-hidden rounded-3xl"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {ex.name}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Last: {lastSummary}</span>
            {volume > 0 && <span style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>· {Math.round(volume)} vol</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="rounded-xl px-2.5 py-1 text-xs font-semibold tabular-nums"
            style={{ background: doneSets === totalSets && totalSets > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
              color: doneSets === totalSets && totalSets > 0 ? '#4ade80' : 'var(--text-muted)' }}>
            {doneSets}/{totalSets}
          </div>
          <button onClick={onRemoveExercise}
            className="grid h-8 w-8 place-items-center rounded-xl text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>
      </div>

      {/* Set lista */}
      <div className="px-4 py-2">
        {/* Fejléc */}
        <div className="mb-1 grid grid-cols-12 px-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}>
          <div className="col-span-1">#</div>
          <div className="col-span-4 text-center">kg</div>
          <div className="col-span-4 text-center">reps</div>
          <div className="col-span-3 text-right">done</div>
        </div>

        <div className="space-y-1.5">
          {ex.sets.map((s, idx) => {
            const filled = isSetFilled(s);
            return (
              <div key={s.id}
                className={`grid grid-cols-12 items-center rounded-2xl px-1 py-1 transition-all ${s.done ? 'opacity-60' : ''}`}
                style={{ background: s.done ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)' }}>
                <div className="col-span-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {idx + 1}
                </div>
                <button onClick={() => onEditSet(s.id)}
                  className="col-span-4 text-center text-sm font-semibold tabular-nums"
                  style={{ color: s.weight ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s.weight ?? '—'}
                </button>
                <button onClick={() => onEditSet(s.id)}
                  className="col-span-4 text-center text-sm font-semibold tabular-nums"
                  style={{ color: s.reps ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s.reps ?? '—'}
                </button>
                <div className="col-span-3 flex justify-end">
                  <button
                    onClick={() => filled ? onToggleDone(s.id) : onEditSet(s.id)}
                    className="grid h-9 w-9 place-items-center rounded-2xl text-sm font-bold transition-all active:scale-90"
                    style={s.done
                      ? { background: 'rgba(74,222,128,0.2)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', boxShadow: '0 0 8px rgba(74,222,128,0.2)' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    ✓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer gombok */}
      <div className="flex gap-2 px-4 pb-4 pt-2">
        <button onClick={onAddSet}
          className="flex-1 rounded-2xl py-3 text-sm font-semibold transition-all pressable"
          style={{ background: 'rgba(34,211,238,0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.2)' }}>
          + Set
        </button>
        <button onClick={onStartRest}
          className="w-20 rounded-2xl py-3 text-sm font-medium transition-all pressable"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
          Rest
        </button>
      </div>
    </div>
  );
}
