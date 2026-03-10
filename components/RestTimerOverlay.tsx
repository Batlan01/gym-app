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
    <div className="fixed top-0 left-0 right-0 z-[80] mx-auto max-w-md transition-all duration-300"
      style={{
        transform: open ? 'translateY(0)' : 'translateY(-110%)',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
      <div className="mx-3 mt-2 overflow-hidden rounded-2xl"
        style={{ background: urgent ? '#fbbf24' : 'var(--accent-primary)' }}>

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="h-full transition-all duration-200"
            style={{ width: `${pct}%`, background: 'rgba(0,0,0,0.4)' }} />
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Timer */}
          <div className="shrink-0 w-14">
            <div className="text-[9px] font-black tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.45)' }}>Rest</div>
            <div className="text-2xl font-black tabular-nums leading-tight" style={{ color: '#000' }}>
              {fmt(leftSec)}
            </div>
          </div>

          {/* +idő gombok */}
          <div className="flex flex-1 gap-1.5">
            {[15, 30, 60].map(d => (
              <button key={d} onClick={() => onAdd(d)}
                className="flex-1 rounded-xl py-2 text-xs font-black pressable"
                style={{ background: 'rgba(0,0,0,0.12)', color: '#000' }}>
                +{d}s
              </button>
            ))}
          </div>

          {/* Skip + Mute */}
          <div className="flex gap-1.5 shrink-0">
            <button onClick={onSkip}
              className="rounded-xl px-4 py-2 text-xs font-black pressable"
              style={{ background: 'rgba(0,0,0,0.15)', color: '#000' }}>
              Skip
            </button>
            <button onClick={onToggleMute}
              className="grid h-9 w-9 place-items-center rounded-xl pressable"
              style={{ background: 'rgba(0,0,0,0.12)', color: '#000' }}>
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
