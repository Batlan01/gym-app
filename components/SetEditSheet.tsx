"use client";

import * as React from "react";
import type { SetEntry } from "@/lib/types";

export function SetEditSheet({
  open,
  onClose,
  title,
  set,
  onSave,
  onDelete,
  onCopyPrev,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  set: SetEntry | null;
  onSave: (patch: Partial<SetEntry>) => void;
  onDelete: () => void;
  onCopyPrev: () => void;
}) {
  if (!open || !set) return null;

  const w = set.weight ?? 0;
  const r = set.reps ?? 0;

  const bumpWeight = (d: number) => onSave({ weight: Math.max(0, Number((w + d).toFixed(2))) });
  const bumpReps = (d: number) => onSave({ reps: Math.max(0, r + d) });

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md pb-[env(safe-area-inset-bottom)]">
        <div className="rounded-t-3xl border border-white/10 bg-zinc-950/90 backdrop-blur p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-white/60">{title}</div>
              <div className="text-base font-semibold text-white">Set szerkesztés</div>
            </div>
            <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
              Kész
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/50">Súly (kg)</div>
              <input
                type="number"
                inputMode="decimal"
                value={set.weight ?? ""}
                onChange={(e) => onSave({ weight: e.target.value === "" ? null : Number(e.target.value) })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-white/20"
                placeholder="—"
              />
              <div className="mt-2 flex gap-2">
                <button onClick={() => bumpWeight(-2.5)} className="flex-1 rounded-xl bg-white/10 py-2 text-sm text-white/90 hover:bg-white/15">-2.5</button>
                <button onClick={() => bumpWeight(+2.5)} className="flex-1 rounded-xl bg-white/10 py-2 text-sm text-white/90 hover:bg-white/15">+2.5</button>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => bumpWeight(-5)} className="flex-1 rounded-xl bg-white/5 py-2 text-sm text-white/80 hover:bg-white/10">-5</button>
                <button onClick={() => bumpWeight(+5)} className="flex-1 rounded-xl bg-white/5 py-2 text-sm text-white/80 hover:bg-white/10">+5</button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/50">Reps</div>
              <input
                type="number"
                inputMode="numeric"
                value={set.reps ?? ""}
                onChange={(e) => onSave({ reps: e.target.value === "" ? null : Number(e.target.value) })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-white/20"
                placeholder="—"
              />
              <div className="mt-2 flex gap-2">
                <button onClick={() => bumpReps(-1)} className="flex-1 rounded-xl bg-white/10 py-2 text-sm text-white/90 hover:bg-white/15">-1</button>
                <button onClick={() => bumpReps(+1)} className="flex-1 rounded-xl bg-white/10 py-2 text-sm text-white/90 hover:bg-white/15">+1</button>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => onSave({ done: !set.done })}
                  className={`w-full rounded-xl py-2 text-sm ${
                    set.done ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30" : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {set.done ? "Done ✓" : "Mark as done"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={onCopyPrev}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/85 hover:bg-white/10"
            >
              Copy prev set
            </button>
            <button
              onClick={onDelete}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 hover:bg-red-500/15"
            >
              Törlés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
