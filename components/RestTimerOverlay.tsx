"use client";

import * as React from "react";

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function RestTimerOverlay({
  open,
  totalSec,
  leftSec,
  muted,
  onAdd,
  onSkip,
  onToggleMute,
}: {
  open: boolean;
  totalSec: number;
  leftSec: number;
  muted: boolean;
  onAdd: (deltaSec: number) => void;
  onSkip: () => void;
  onToggleMute: () => void;
}) {
  if (!open) return null;

  const pct = totalSec > 0 ? Math.min(100, Math.max(0, (leftSec / totalSec) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      <div className="absolute bottom-24 left-0 right-0 mx-auto w-full max-w-md px-4 pointer-events-auto">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/90 p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs tracking-widest text-white/50">REST</div>
              <div className="mt-1 text-3xl font-bold text-white tabular-nums">{fmt(leftSec)}</div>
            </div>

            <button
              onClick={onSkip}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Skip
            </button>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-white/40" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onAdd(15)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/80 hover:bg-white/10"
            >
              +15s
            </button>
            <button
              onClick={() => onAdd(30)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/80 hover:bg-white/10"
            >
              +30s
            </button>
            <button
              onClick={onToggleMute}
              className="w-16 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/80 hover:bg-white/10"
              title="Mute"
              aria-label="Mute"
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
