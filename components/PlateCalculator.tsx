"use client";
import * as React from "react";

// Standard plates available in kg
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLORS: Record<number, string> = {
  25: "#ef4444", 20: "#3b82f6", 15: "#f59e0b",
  10: "#22c55e", 5: "#ffffff", 2.5: "#a78bfa", 1.25: "#f97316",
};
const BAR_WEIGHT = 20; // standard olympic barbell

function calcPlates(totalKg: number, barKg = BAR_WEIGHT): { plate: number; count: number }[] {
  let remaining = Math.max(0, (totalKg - barKg) / 2);
  const result: { plate: number; count: number }[] = [];
  for (const p of PLATES) {
    if (remaining <= 0) break;
    const n = Math.floor(remaining / p);
    if (n > 0) { result.push({ plate: p, count: n }); remaining = Math.round((remaining - n * p) * 1000) / 1000; }
  }
  return result;
}

export function PlateCalculator({ open, onClose, initialWeight = 60 }: {
  open: boolean; onClose: () => void; initialWeight?: number;
}) {
  const [weight, setWeight] = React.useState(initialWeight);
  const [barKg, setBarKg] = React.useState(BAR_WEIGHT);
  const [inputVal, setInputVal] = React.useState(String(initialWeight));

  React.useEffect(() => {
    if (open) { setWeight(initialWeight); setInputVal(String(initialWeight)); }
  }, [open, initialWeight]);

  const plates = React.useMemo(() => calcPlates(weight, barKg), [weight, barKg]);
  const actualTotal = barKg + plates.reduce((s, p) => s + p.plate * p.count * 2, 0);
  const diff = Math.round((weight - actualTotal) * 100) / 100;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="rounded-t-[2.5rem] px-5 pt-4 pb-6 shadow-2xl" style={{ background:"var(--bg-elevated)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="mx-auto mb-4 h-1 w-12 rounded-full" style={{ background:"var(--surface-3)" }} />
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] font-black tracking-widest mb-0.5" style={{ color: "var(--accent-primary)" }}>KALKULÁTOR</div>
              <div className="text-lg font-black" style={{ color: "var(--text-primary)" }}>🏋️ Lemez kalkulátor</div>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-sm"
              style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>✕</button>
          </div>

          {/* Súly bevitel */}
          <div className="mb-4">
            <div className="text-[9px] font-black tracking-widest mb-2" style={{ color:"var(--text-muted)" }}>CÉLSÚLY (kg)</div>
            <div className="flex gap-2 items-center">
              <button onClick={() => { const v = Math.max(barKg, weight - 2.5); setWeight(v); setInputVal(String(v)); }}
                className="h-12 w-12 rounded-2xl text-xl font-black pressable shrink-0"
                style={{ background:"var(--surface-2)", color: "var(--text-secondary)" }}>−</button>
              <input value={inputVal} inputMode="decimal"
                onChange={e => { setInputVal(e.target.value); const n = parseFloat(e.target.value.replace(",",".")); if (!isNaN(n) && n > 0) setWeight(n); }}
                onBlur={() => { const n = parseFloat(inputVal.replace(",",".")); if (!isNaN(n) && n >= barKg) { setWeight(n); setInputVal(String(n)); } else { setWeight(barKg); setInputVal(String(barKg)); } }}
                className="flex-1 rounded-2xl py-3 text-center text-3xl font-black outline-none"
                style={{ background:"var(--surface-1)", color: "var(--accent-primary)" }} />
              <button onClick={() => { const v = weight + 2.5; setWeight(v); setInputVal(String(v)); }}
                className="h-12 w-12 rounded-2xl text-xl font-black pressable shrink-0"
                style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)" }}>+</button>
            </div>
            {/* Gyorsgombok */}
            <div className="flex gap-1.5 mt-2">
              {[60, 80, 100, 120, 140].map(v => (
                <button key={v} onClick={() => { setWeight(v); setInputVal(String(v)); }}
                  className="flex-1 rounded-xl py-1.5 text-xs font-black pressable"
                  style={weight === v
                    ? { background: "var(--accent-primary)", color: "#000" }
                    : { background:"var(--surface-1)", color:"var(--text-secondary)" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Rúd kiválasztás */}
          <div className="mb-5">
            <div className="text-[9px] font-black tracking-widest mb-2" style={{ color:"var(--text-muted)" }}>RÚD SÚLYA</div>
            <div className="flex gap-2">
              {[15, 20].map(b => (
                <button key={b} onClick={() => setBarKg(b)}
                  className="flex-1 rounded-xl py-2 text-sm font-black pressable"
                  style={barKg === b
                    ? { background: "var(--accent-primary)", color: "#000" }
                    : { background:"var(--surface-1)", color:"var(--text-secondary)" }}>
                  {b} kg {b === 20 ? "(olimpiai)" : "(könnyű)"}
                </button>
              ))}
            </div>
          </div>

          {/* Vizuális rúd */}
          <div className="rounded-2xl p-4 mb-4" style={{ background:"var(--surface-1)" }}>
            <div className="text-[9px] font-black tracking-widest mb-3" style={{ color:"var(--text-muted)" }}>
              ÖSSZERAKÁS — EGY OLDAL
            </div>
            {plates.length === 0 ? (
              <div className="text-sm text-center py-2" style={{ color:"var(--text-muted)" }}>
                Csak rúd ({barKg} kg)
              </div>
            ) : (
              <>
                {/* Rúd vizuális */}
                <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
                  {/* Bar */}
                  <div className="shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-black"
                    style={{ background:"var(--surface-3)", color:"var(--text-secondary)" }}>
                    {barKg}kg
                  </div>
                  <div className="h-2 w-4 rounded-full shrink-0" style={{ background:"var(--surface-3)" }} />
                  {/* Plates */}
                  {plates.map(({ plate, count }) =>
                    Array.from({ length: count }).map((_, i) => (
                      <div key={`${plate}-${i}`}
                        className="shrink-0 flex items-center justify-center rounded-lg font-black text-[10px]"
                        style={{
                          width: `${Math.max(28, plate * 1.4)}px`,
                          height: "44px",
                          background: PLATE_COLORS[plate] ?? "#888",
                          color: plate === 5 ? "#000" : "#fff",
                        }}>
                        {plate}
                      </div>
                    ))
                  )}
                </div>
                {/* Lista */}
                <div className="grid grid-cols-2 gap-1.5">
                  {plates.map(({ plate, count }) => (
                    <div key={plate} className="flex items-center justify-between rounded-xl px-3 py-2"
                      style={{ background:"var(--surface-1)" }}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm" style={{ background: PLATE_COLORS[plate] ?? "#888" }} />
                        <span className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{plate} kg</span>
                      </div>
                      <span className="text-sm font-black" style={{ color: "var(--accent-primary)" }}>×{count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Összesítő */}
          <div className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ background: diff !== 0 ? "rgba(251,191,36,0.08)" : "rgba(74,222,128,0.08)" }}>
            <div>
              <div className="text-[10px]" style={{ color:"var(--text-secondary)" }}>Tényleges súly</div>
              <div className="text-xl font-black" style={{ color: diff !== 0 ? "#fbbf24" : "#4ade80" }}>
                {actualTotal} kg
              </div>
            </div>
            {diff !== 0 && (
              <div className="text-xs" style={{ color: "rgba(251,191,36,0.7)" }}>
                {diff > 0 ? `${diff} kg hiány` : `${Math.abs(diff)} kg többlet`}
              </div>
            )}
            {diff === 0 && <div className="text-lg">✓</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
