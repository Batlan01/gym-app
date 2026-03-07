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
  const pct = totalSec > 0 ? Math.min(100, (leftSec / totalSec) * 100) : 0;
  const urgent = leftSec <= 10 && open;

  return (
    <>
      {/* Sticky top banner */}
      <div className="fixed top-0 left-0 right-0 z-[80] mx-auto max-w-md transition-all duration-300"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(-110%)',
          paddingTop: 'env(safe-area-inset-top)',
        }}>
        <div className="mx-3 mt-2 overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: urgent ? 'rgba(251,191,36,0.15)' : 'rgba(8,11,15,0.95)',
            border: `1px solid ${urgent ? 'rgba(251,191,36,0.5)' : 'rgba(34,211,238,0.3)'}`,
            backdropFilter: 'blur(20px)',
          }}>

          {/* Progress bar a tetején */}
          <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full transition-all duration-200 rounded-full"
              style={{
                width: `${pct}%`,
                background: urgent ? '#fbbf24' : 'var(--accent-primary)',
              }} />
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Timer szám */}
            <div className="shrink-0">
              <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Rest</div>
              <div className={`text-2xl font-black tabular-nums ${urgent ? 'text-amber-300' : ''}`}
                style={{ color: urgent ? '#fbbf24' : 'var(--text-primary)' }}>
                {fmt(leftSec)}
              </div>
            </div>

            {/* +idő gombok */}
            <div className="flex flex-1 gap-1.5">
              {[15, 30, 60].map(d => (
                <button key={d} onClick={() => onAdd(d)}
                  className="flex-1 rounded-xl py-2 text-xs font-bold pressable"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                  +{d}s
                </button>
              ))}
            </div>

            {/* Skip + Mute */}
            <div className="flex gap-1.5 shrink-0">
              <button onClick={onSkip}
                className="rounded-xl px-3 py-2 text-xs font-black pressable"
                style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.3)' }}>
                Skip
              </button>
              <button onClick={onToggleMute}
                className="grid h-9 w-9 place-items-center rounded-xl pressable"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                {muted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
