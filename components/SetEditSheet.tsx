"use client";

import * as React from "react";
import type { SetEntry } from "@/lib/types";

// Epley formula: 1RM = w * (1 + r/30)
function calc1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps <= 0 || weight <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

// Plate calculator logic
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLORS: Record<number, string> = {
  25: "#ef4444", 20: "#3b82f6", 15: "#f59e0b",
  10: "#22c55e", 5: "#e5e7eb", 2.5: "#a78bfa", 1.25: "#f97316",
};

function calcPlates(totalKg: number, barKg = 20): { plate: number; count: number }[] {
  let remaining = Math.max(0, (totalKg - barKg) / 2);
  const result: { plate: number; count: number }[] = [];
  for (const p of PLATES) {
    if (remaining < 0.001) break;
    const n = Math.floor(remaining / p + 0.001);
    if (n > 0) { result.push({ plate: p, count: n }); remaining = Math.round((remaining - n * p) * 1000) / 1000; }
  }
  return result;
}

function NumericWheel({ label, value, onChange, step = 1, decimals = 0 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; decimals?: number;
}) {
  const fmt = (n: number) => decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-5xl font-black tabular-nums" style={{ color: "var(--text-primary)", lineHeight: 1 }}>{fmt(value)}</div>
      <div className="flex w-full gap-2">
        <button onClick={() => onChange(Math.max(0, Number((value - step).toFixed(2))))}
          className="flex-1 rounded-2xl py-4 text-xl font-black pressable"
          style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>−</button>
        <button onClick={() => onChange(Number((value + step).toFixed(2)))}
          className="flex-1 rounded-2xl py-4 text-xl font-black pressable"
          style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.2)" }}>+</button>
      </div>
      <div className="flex w-full gap-1.5">
        {(step === 0.5 ? [-5, -2.5, +2.5, +5] : [-5, -2, +2, +5]).map(d => (
          <button key={d} onClick={() => onChange(Math.max(0, Number((value + d).toFixed(2))))}
            className="flex-1 rounded-xl py-2 text-xs font-semibold pressable"
            style={{ background: d < 0 ? "rgba(255,255,255,0.04)" : "rgba(74,222,128,0.08)", color: d < 0 ? "var(--text-muted)" : "var(--accent-green)", border: `1px solid ${d < 0 ? "var(--border-subtle)" : "rgba(74,222,128,0.15)"}` }}>
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}

// Inline plate + 1RM info panel
function InfoPanel({ weight, reps }: { weight: number; reps: number }) {
  const [barKg, setBarKg] = React.useState(20);
  const orm = weight > 0 && reps > 0 ? calc1RM(weight, reps) : null;
  const plates = weight > 0 ? calcPlates(weight, barKg) : [];
  const actualTotal = barKg + plates.reduce((s, p) => s + p.plate * p.count * 2, 0);

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Row: 1RM + plate visual side by side */}
      <div className="flex items-stretch">
        {/* 1RM */}
        <div className="flex-1 px-4 py-3" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-[9px] font-black tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>BECSÜLT 1RM</div>
          {orm !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black" style={{ color: "var(--accent-primary)" }}>{orm}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>kg</span>
            </div>
          ) : (
            <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.2)" }}>—</div>
          )}
          <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>Epley formula</div>
        </div>

        {/* Plate summary */}
        <div className="flex-1 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-black tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>LEMEZEK / OLDAL</div>
            {/* Bar selector */}
            <div className="flex gap-1">
              {[15, 20].map(b => (
                <button key={b} onClick={() => setBarKg(b)}
                  className="rounded-lg px-1.5 py-0.5 text-[9px] font-black pressable"
                  style={barKg === b
                    ? { background: "var(--accent-primary)", color: "#000" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                  {b}kg
                </button>
              ))}
            </div>
          </div>
          {weight === 0 ? (
            <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.2)" }}>—</div>
          ) : plates.length === 0 ? (
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Csak rúd ({barKg} kg)</div>
          ) : (
            <>
              {/* Color dot list */}
              <div className="flex flex-wrap gap-1 mb-1">
                {plates.map(({ plate, count }) =>
                  Array.from({ length: count }).map((_, i) => (
                    <div key={`${plate}-${i}`}
                      className="flex items-center justify-center rounded text-[8px] font-black"
                      style={{ width: 22, height: 22, background: PLATE_COLORS[plate] ?? "#888", color: plate === 5 ? "#000" : "#fff" }}>
                      {plate}
                    </div>
                  ))
                )}
              </div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                = {actualTotal} kg total
              </div>
            </>
          )}
        </div>
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
      <button className="absolute inset-0 transition-all"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose} aria-label="Close" />

      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", maxHeight: "95dvh" }}>
        <div className="rounded-t-[2.5rem] px-5 pt-4 pb-6 shadow-2xl"
          style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-mid)" }}>

          <div className="mx-auto mb-5 h-1 w-12 rounded-full" style={{ background: "var(--border-mid)" }} />

          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent-primary)" }}>
                Set szerkesztés
              </div>
              <div className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{title}</div>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-sm"
              style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)" }}>✕</button>
          </div>

          {/* KG + REPS */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <NumericWheel label="Súly (kg)" value={w} step={2.5} decimals={1} onChange={v => onSave({ weight: v })} />
            <NumericWheel label="Ismétlés" value={r} step={1} decimals={0} onChange={v => onSave({ reps: v })} />
          </div>

          {/* 1RM + Plates inline panel — always visible */}
          <InfoPanel weight={w} reps={r} />

          {/* Done gomb */}
          <button onClick={() => onSave({ done: !set.done })}
            className="w-full rounded-2xl py-4 text-base font-black pressable mb-3"
            style={set.done ? {
              background: "rgba(74,222,128,0.18)", color: "#4ade80",
              border: "1.5px solid rgba(74,222,128,0.35)", boxShadow: "0 0 24px rgba(74,222,128,0.15)",
            } : {
              background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)",
              border: "1.5px solid var(--border-subtle)",
            }}>
            {set.done ? "✓  Done" : "Mark as Done"}
          </button>

          <div className="flex gap-2">
            <button onClick={onCopyPrev} className="flex-1 rounded-2xl py-3 text-sm font-semibold pressable"
              style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              ↑ Copy prev
            </button>
            <button onClick={onDelete} className="rounded-2xl px-5 py-3 text-sm font-semibold pressable"
              style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.18)" }}>
              Törlés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
