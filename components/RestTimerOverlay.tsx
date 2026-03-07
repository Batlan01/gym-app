"use client";

import * as React from "react";

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function RestTimerOverlay({ open, totalSec, leftSec, muted, onAdd, onSkip, onToggleMute }: {
  open: boolean; totalSec: number; leftSec: number; muted: boolean;
  onAdd: (d: number) => void; onSkip: () => void; onToggleMute: () => void;
}) {
  if (!open) return null;

  const pct = totalSec > 0 ? Math.min(100, (leftSec / totalSec) * 100) : 0;
  const urgent = leftSec <= 10;

  // SVG arc
  const R = 48; const C = 60;
  const circ = 2 * Math.PI * R;
  const dash = circ * (1 - pct / 100);

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none flex items-end justify-center pb-28"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
      <div className="pointer-events-auto w-full max-w-md px-4">
        <div className="rounded-3xl p-5 shadow-2xl"
          style={{ background: 'rgba(8,11,15,0.96)', border: `1px solid ${urgent ? 'rgba(251,191,36,0.4)' : 'rgba(34,211,238,0.25)'}`,
            backdropFilter: 'blur(20px)', boxShadow: `0 0 40px ${urgent ? 'rgba(251,191,36,0.15)' : 'rgba(34,211,238,0.1)'}` }}>

          <div className="flex items-center gap-4">
            {/* SVG ring */}
            <div className="relative shrink-0">
              <svg width={C * 2} height={C * 2} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                <circle cx={C} cy={C} r={R} fill="none"
                  stroke={urgent ? '#fbbf24' : '#22d3ee'} strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
                  style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-2xl font-bold tabular-nums ${urgent ? 'text-amber-300' : 'text-white'}`}>
                  {fmt(leftSec)}
                </div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>rest</div>
              </div>
            </div>

            {/* Gombok */}
            <div className="flex flex-1 flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 60].map(d => (
                  <button key={d} onClick={() => onAdd(d)}
                    className="rounded-xl py-2.5 text-sm font-semibold pressable"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    +{d}s
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onSkip}
                  className="rounded-xl py-2.5 text-sm font-bold pressable"
                  style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.25)' }}>
                  Skip
                </button>
                <button onClick={onToggleMute}
                  className="rounded-xl py-2.5 text-sm pressable"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                  {muted ? '🔇 Mute' : '🔊 Hang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
