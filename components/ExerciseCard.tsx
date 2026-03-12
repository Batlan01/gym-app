"use client";

import * as React from "react";
import type { WorkoutExercise, SetType } from "@/lib/types";
import { isSetFilled } from "@/lib/workoutHelpers";

const SET_TYPE_CONFIG: Record<SetType, {label:string;color:string;bg:string}> = {
  normal:    { label: "N",  color: "rgba(255,255,255,0.3)",  bg: "rgba(255,255,255,0.06)" },
  warmup:    { label: "W",  color: "#fbbf24",                bg: "rgba(251,191,36,0.12)" },
  superset:  { label: "SS", color: "#a78bfa",                bg: "rgba(167,139,250,0.12)" },
  dropset:   { label: "DS", color: "#f97316",                bg: "rgba(249,115,22,0.12)" },
  failure:   { label: "F",  color: "#ef4444",                bg: "rgba(239,68,68,0.12)" },
};
const SET_TYPE_ORDER: SetType[] = ["normal","warmup","superset","dropset","failure"];

export function ExerciseCard({
  ex, lastSummary, onAddSet, onEditSet,
  onRemoveExercise, onToggleDone, onStartRest,
  onSetTypeChange, progressionTip,
}: {
  ex: WorkoutExercise;
  lastSummary: string;
  onAddSet: () => void;
  onEditSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onToggleDone: (setId: string) => void;
  onStartRest: () => void;
  onSetTypeChange?: (setId: string, type: SetType) => void;
  progressionTip?: { suggestedWeight: number; lastWeight: number; lastReps: number } | null;
}) {
  const doneSets = ex.sets.filter(s => s.done).length;
  const totalSets = ex.sets.length;
  const allDone = doneSets === totalSets && totalSets > 0;

  return (
    <div className="overflow-hidden rounded-3xl" style={{ background:"var(--surface-1)" }}>

      {/* Zöld top accent csík ha kész */}
      {allDone && <div className="h-0.5 w-full" style={{ background: '#4ade80' }} />}

      {/* ── Fejléc ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black truncate" style={{ color: allDone ? '#4ade80' : 'var(--text-primary)' }}>
            {ex.name}
          </h3>
          <div className="mt-0.5 text-xs" style={{ color:"var(--text-muted)" }}>
            Előző: {lastSummary}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-3 shrink-0">
          <div className="flex gap-1 items-center">
            {ex.sets.map((s) => (
              <div key={s.id} className="h-1.5 w-1.5 rounded-full transition-all"
                style={{ background: s.done ? '#4ade80' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
          <button onClick={onRemoveExercise}
            className="grid h-7 w-7 place-items-center rounded-xl text-xs pressable"
            style={{ background:"var(--surface-2)", color:"var(--text-muted)" }}>
            ✕
          </button>
        </div>
      </div>

      {/* ── Progresszív túlterhelés tipp ── */}
      {progressionTip && !allDone && (
        <div className="mx-3 mb-2 rounded-2xl px-3 py-2 flex items-center gap-2"
          style={{background:"rgba(74,222,128,0.07)", border:"1px solid rgba(74,222,128,0.18)"}}>
          <span className="text-base">📈</span>
          <div className="flex-1">
            <div className="text-[10px] font-black" style={{color:"#4ade80"}}>PROGRESSZÍV TÚLTERHELÉS</div>
            <div className="text-[9px]" style={{color:"var(--text-muted)"}}>
              Múlt: {progressionTip.lastWeight} kg × {progressionTip.lastReps} rep →{" "}
              <span style={{color:"#4ade80", fontWeight:700}}>{progressionTip.suggestedWeight} kg</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Set sorok ── */}
      <div className="px-3 pb-2">
        <div className="mb-2 grid grid-cols-[28px_1fr_1fr_52px] gap-2 px-1">
          {['TÍP', 'KG', 'REPS', ''].map((h, i) => (
            <div key={i} className="text-[9px] font-black tracking-widest text-center"
              style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</div>
          ))}
        </div>

        <div className="space-y-1.5">
          {ex.sets.map((s, idx) => {
            const filled = isSetFilled(s);
            const sType: SetType = s.setType ?? "normal";
            const cfg = SET_TYPE_CONFIG[sType];
            const nextType = SET_TYPE_ORDER[(SET_TYPE_ORDER.indexOf(sType) + 1) % SET_TYPE_ORDER.length];
            return (
              <div key={s.id}
                className="grid grid-cols-[28px_1fr_1fr_52px] gap-2 items-center rounded-2xl px-1 py-0.5"
                style={{ background: s.done ? 'rgba(74,222,128,0.06)' : 'transparent' }}>

                {/* Set type badge — koppintásra körbe vált */}
                <button onClick={() => onSetTypeChange?.(s.id, nextType)}
                  className="flex items-center justify-center rounded-lg text-[9px] font-black pressable"
                  style={{ height: 36, background: cfg.bg, color: cfg.color }}
                  title={sType}>
                  {cfg.label}
                </button>

                {/* KG */}
                <button onClick={() => onEditSet(s.id)}
                  className="rounded-xl py-3 text-center text-base font-black tabular-nums pressable"
                  style={{
                    background: s.weight ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                    color: s.weight ? 'var(--text-primary)' : 'rgba(255,255,255,0.2)',
                  }}>
                  {s.weight ?? '—'}
                </button>

                {/* REPS */}
                <button onClick={() => onEditSet(s.id)}
                  className="rounded-xl py-3 text-center text-base font-black tabular-nums pressable"
                  style={{
                    background: s.reps ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                    color: s.reps ? 'var(--text-primary)' : 'rgba(255,255,255,0.2)',
                  }}>
                  {s.reps ?? '—'}
                </button>

                {/* DONE */}
                <button onClick={() => filled ? onToggleDone(s.id) : onEditSet(s.id)}
                  className="h-11 w-full rounded-2xl text-base font-black pressable"
                  style={s.done ? { background: '#4ade80', color: '#000' } : { background:"var(--surface-2)", color:"var(--text-muted)" }}>
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex gap-2 px-3 pb-4 pt-2">
        <button onClick={onAddSet}
          className="flex-1 rounded-2xl py-3 text-sm font-black pressable"
          style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>
          + Set
        </button>
        <button onClick={onStartRest}
          className="w-20 rounded-2xl py-3 text-sm font-bold pressable"
          style={{ background:"var(--surface-1)", color:"var(--text-muted)" }}>
          ⏱ Rest
        </button>
      </div>
    </div>
  );
}
