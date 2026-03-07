"use client";

import * as React from "react";
import type { SetEntry } from "@/lib/types";

function NumericWheel({ label, value, onChange, step = 1, decimals = 0 }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  decimals?: number;
}) {
  const fmt = (n: number) => decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      {/* Nagy érték */}
      <div className="text-5xl font-black tabular-nums" style={{ color: 'var(--text-primary)', lineHeight: 1 }}>
        {fmt(value)}
      </div>
      {/* +/- gombok */}
      <div className="flex w-full gap-2">
        <button onClick={() => onChange(Math.max(0, Number((value - step).toFixed(2))))}
          className="flex-1 rounded-2xl py-4 text-xl font-black pressable"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
          −
        </button>
        <button onClick={() => onChange(Number((value + step).toFixed(2)))}
          className="flex-1 rounded-2xl py-4 text-xl font-black pressable"
          style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.2)' }}>
          +
        </button>
      </div>
      {/* Gyors step gombok */}
      <div className="flex w-full gap-1.5">
        {(step === 0.5 ? [-5, -2.5, +2.5, +5] : [-5, -2, +2, +5]).map(d => (
          <button key={d} onClick={() => onChange(Math.max(0, Number((value + d).toFixed(2))))}
            className="flex-1 rounded-xl py-2 text-xs font-semibold pressable"
            style={{
              background: d < 0 ? 'rgba(255,255,255,0.04)' : 'rgba(74,222,128,0.08)',
              color: d < 0 ? 'var(--text-muted)' : 'var(--accent-green)',
              border: `1px solid ${d < 0 ? 'var(--border-subtle)' : 'rgba(74,222,128,0.15)'}`,
            }}>
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SetEditSheet({ open, onClose, title, set, onSave, onDelete, onCopyPrev }: {
  open: boolean; onClose: () => void; title: string;
  set: SetEntry | null;
  onSave: (patch: Partial<SetEntry>) => void;
  onDelete: () => void; onCopyPrev: () => void;
}) {
  if (!open || !set) return null;

  const w = set.weight ?? 0;
  const r = set.reps ?? 0;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button className="absolute inset-0 transition-all"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose} aria-label="Close" />

      {/* Sheet — majdnem fullscreen */}
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="rounded-t-[2.5rem] px-5 pt-4 pb-6 shadow-2xl"
          style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-mid)' }}>

          {/* Handle */}
          <div className="mx-auto mb-5 h-1 w-12 rounded-full" style={{ background: 'var(--border-mid)' }} />

          {/* Exercise neve + set infó */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent-primary)' }}>
                Set szerkesztés
              </div>
              <div className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {title}
              </div>
            </div>
            <button onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-sm"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)' }}>✕</button>
          </div>

          {/* KG + REPS egymás mellett nagy */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <NumericWheel label="Súly (kg)" value={w} step={2.5} decimals={1}
              onChange={v => onSave({ weight: v })} />
            <NumericWheel label="Ismétlés" value={r} step={1} decimals={0}
              onChange={v => onSave({ reps: v })} />
          </div>

          {/* Done gomb — nagy, teljes szélesség */}
          <button onClick={() => onSave({ done: !set.done })}
            className="w-full rounded-2xl py-4 text-base font-black pressable mb-3"
            style={set.done ? {
              background: 'rgba(74,222,128,0.18)',
              color: '#4ade80',
              border: '1.5px solid rgba(74,222,128,0.35)',
              boxShadow: '0 0 24px rgba(74,222,128,0.15)',
            } : {
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)',
              border: '1.5px solid var(--border-subtle)',
            }}>
            {set.done ? '✓  Done' : 'Mark as Done'}
          </button>

          {/* Másodlagos akciók */}
          <div className="flex gap-2">
            <button onClick={onCopyPrev}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold pressable"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
              ↑ Copy prev
            </button>
            <button onClick={onDelete}
              className="rounded-2xl px-5 py-3 text-sm font-semibold pressable"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.18)' }}>
              Törlés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
