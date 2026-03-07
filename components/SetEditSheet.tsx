"use client";

import * as React from "react";
import type { SetEntry } from "@/lib/types";

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
    <div className="fixed inset-0 z-[70]" style={{ isolation: 'isolate' }}>
      <button className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} aria-label="Close" />

      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="rounded-t-[2rem] p-5 shadow-2xl"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderBottom: 'none' }}>

          {/* Handle */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'var(--border-mid)' }} />

          {/* Title */}
          <div className="mb-5">
            <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>Set szerkesztés</div>
            <div className="mt-0.5 text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>{title}</div>
          </div>

          {/* Súly + Reps */}
          <div className="grid grid-cols-2 gap-3">
            {/* Súly */}
            <div className="rounded-2xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Súly kg</div>
              <input type="number" inputMode="decimal"
                value={set.weight ?? ''}
                onChange={e => onSave({ weight: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-full rounded-xl px-3 py-2.5 text-center text-xl font-bold tabular-nums outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                placeholder="0" />
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {[-5, -2.5, +2.5, +5].map(d => (
                  <button key={d} onClick={() => onSave({ weight: Math.max(0, Number(((w + d)).toFixed(2))) })}
                    className="rounded-xl py-2 text-sm font-semibold pressable"
                    style={{ background: d < 0 ? 'rgba(255,255,255,0.05)' : 'rgba(34,211,238,0.1)',
                      color: d < 0 ? 'var(--text-secondary)' : 'var(--accent-primary)',
                      border: `1px solid ${d < 0 ? 'var(--border-subtle)' : 'rgba(34,211,238,0.2)'}` }}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Reps */}
            <div className="rounded-2xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Reps</div>
              <input type="number" inputMode="numeric"
                value={set.reps ?? ''}
                onChange={e => onSave({ reps: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-full rounded-xl px-3 py-2.5 text-center text-xl font-bold tabular-nums outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                placeholder="0" />
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {[-2, -1, +1, +2].map(d => (
                  <button key={d} onClick={() => onSave({ reps: Math.max(0, r + d) })}
                    className="rounded-xl py-2 text-sm font-semibold pressable"
                    style={{ background: d < 0 ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.1)',
                      color: d < 0 ? 'var(--text-secondary)' : 'var(--accent-green)',
                      border: `1px solid ${d < 0 ? 'var(--border-subtle)' : 'rgba(74,222,128,0.2)'}` }}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Done toggle */}
          <button onClick={() => onSave({ done: !set.done })}
            className="mt-3 w-full rounded-2xl py-3.5 text-sm font-bold transition-all pressable"
            style={set.done
              ? { background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', boxShadow: '0 0 16px rgba(74,222,128,0.15)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
            {set.done ? '✓ Done' : 'Mark as Done'}
          </button>

          {/* Akciók */}
          <div className="mt-3 flex gap-2">
            <button onClick={onCopyPrev}
              className="flex-1 rounded-2xl py-3 text-sm font-medium pressable"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
              Copy prev
            </button>
            <button onClick={onDelete}
              className="rounded-2xl px-5 py-3 text-sm font-medium pressable"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
              Törlés
            </button>
            <button onClick={onClose}
              className="rounded-2xl px-5 py-3 text-sm font-bold pressable"
              style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.25)' }}>
              Kész
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
