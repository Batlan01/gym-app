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
  const allDone = doneSets === totalSets && totalSets > 0;

  return (
    <div className="overflow-hidden rounded-3xl"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${allDone ? 'rgba(74,222,128,0.25)' : 'var(--border-subtle)'}`,
        transition: 'border-color 0.3s ease',
      }}>

      {/* ── Fejléc ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {ex.name}
          </h3>
          <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            Előző: {lastSummary}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          {/* Progress pills */}
          <div className="flex gap-1">
            {ex.sets.map((s, i) => (
              <div key={s.id} className="h-1.5 w-4 rounded-full transition-all"
                style={{ background: s.done ? '#4ade80' : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>
          <button onClick={onRemoveExercise}
            className="grid h-7 w-7 place-items-center rounded-full text-xs transition-colors"
            style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}>✕</button>
        </div>
      </div>

      {/* ── Set sorok ── */}
      <div className="px-3 pb-2">
        {/* Fejléc sor */}
        <div className="mb-2 grid grid-cols-[28px_1fr_1fr_52px] gap-2 px-2">
          {['#', 'KG', 'REPS', ''].map((h, i) => (
            <div key={i} className="text-[10px] font-bold tracking-widest text-center"
              style={{ color: 'var(--text-muted)' }}>{h}</div>
          ))}
        </div>

        <div className="space-y-2">
          {ex.sets.map((s, idx) => {
            const filled = isSetFilled(s);
            return (
              <div key={s.id}
                className="grid grid-cols-[28px_1fr_1fr_52px] gap-2 items-center rounded-2xl px-2 py-1 transition-all"
                style={{
                  background: s.done ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.03)',
                  opacity: s.done ? 0.75 : 1,
                }}>
                {/* # */}
                <div className="text-center text-xs font-bold"
                  style={{ color: 'var(--text-muted)' }}>{idx + 1}</div>

                {/* KG — kattintható cella */}
                <button onClick={() => onEditSet(s.id)}
                  className="rounded-xl py-2.5 text-center text-base font-bold tabular-nums transition-all active:scale-95"
                  style={{
                    background: s.weight ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    color: s.weight ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: '1px solid transparent',
                  }}>
                  {s.weight ?? '—'}
                </button>

                {/* REPS — kattintható cella */}
                <button onClick={() => onEditSet(s.id)}
                  className="rounded-xl py-2.5 text-center text-base font-bold tabular-nums transition-all active:scale-95"
                  style={{
                    background: s.reps ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    color: s.reps ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: '1px solid transparent',
                  }}>
                  {s.reps ?? '—'}
                </button>

                {/* DONE — nagy checkmark */}
                <button onClick={() => filled ? onToggleDone(s.id) : onEditSet(s.id)}
                  className="h-11 w-full rounded-2xl text-lg font-bold transition-all active:scale-90 pressable"
                  style={s.done ? {
                    background: 'rgba(74,222,128,0.2)',
                    color: '#4ade80',
                    border: '1.5px solid rgba(74,222,128,0.4)',
                    boxShadow: '0 0 12px rgba(74,222,128,0.2)',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.3)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                  }}>
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex gap-2 px-3 pb-4 pt-1">
        <button onClick={onAddSet}
          className="flex-1 rounded-2xl py-3 text-sm font-bold pressable"
          style={{
            background: 'rgba(34,211,238,0.08)',
            color: 'var(--accent-primary)',
            border: '1px solid rgba(34,211,238,0.18)',
          }}>
          + Set
        </button>
        <button onClick={onStartRest}
          className="w-20 rounded-2xl py-3 text-sm font-medium pressable"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}>
          ⏱ Rest
        </button>
      </div>
    </div>
  );
}
