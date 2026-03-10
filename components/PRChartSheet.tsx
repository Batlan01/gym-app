"use client";
import * as React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Dot,
} from "recharts";
import type { PREntry, ExerciseHistoryPoint } from "@/lib/prStorage";
import { formatK } from "@/lib/workoutMetrics";

type Mode = "weight" | "volume";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("hu", { month: "short", day: "2-digit" });
}

// Custom dot — PR pont kiemelve
function PRDot(props: any) {
  const { cx, cy, payload, maxVal } = props;
  if (payload.bestWeight !== maxVal) {
    return <circle cx={cx} cy={cy} r={2.5} fill="var(--accent-primary)" fillOpacity={0.5} />;
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="var(--accent-primary)" fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={4} fill="var(--accent-primary)" />
    </g>
  );
}

function VolumeDot(props: any) {
  const { cx, cy, payload, maxVal } = props;
  if (payload.bestVolume !== maxVal) {
    return <circle cx={cx} cy={cy} r={2.5} fill="#a78bfa" fillOpacity={0.5} />;
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#a78bfa" fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={4} fill="#a78bfa" />
    </g>
  );
}

// Custom tooltip
function ChartTooltip({ active, payload, mode }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ExerciseHistoryPoint;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#0d0d0f", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="font-black mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{fmtDate(d.date)}</div>
      {mode === "weight"
        ? <div style={{ color: "var(--accent-primary)" }}>{d.bestWeight} kg × {d.bestReps} rep</div>
        : <div style={{ color: "#a78bfa" }}>{Math.round(d.bestVolume)} kg vol</div>
      }
      <div style={{ color: "rgba(255,255,255,0.3)" }}>{d.sets} szet</div>
    </div>
  );
}

type Props = {
  open: boolean;
  entry: PREntry | null;
  history: ExerciseHistoryPoint[];
  onClose: () => void;
};

export function PRChartSheet({ open, entry, history, onClose }: Props) {
  const [mode, setMode] = React.useState<Mode>("weight");

  // drag-to-close
  const startY = React.useRef<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  function onTouchStart(e: React.TouchEvent) { startY.current = e.touches[0].clientY; }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragOffset(dy);
  }
  function onTouchEnd() {
    if (dragOffset > 80) onClose();
    setDragOffset(0); startY.current = null;
  }

  const maxWeight = history.length ? Math.max(...history.map(h => h.bestWeight)) : 0;
  const maxVolume = history.length ? Math.max(...history.map(h => h.bestVolume)) : 0;
  const firstDate = history.length ? fmtDate(history[0].date) : "—";
  const lastDate = history.length ? fmtDate(history[history.length - 1].date) : "—";
  const trend = history.length >= 2
    ? history[history.length - 1].bestWeight - history[0].bestWeight
    : 0;

  if (!open || !entry) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* backdrop */}
      <button className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} />

      {/* sheet */}
      <div
        className="relative w-full max-w-md flex flex-col overflow-hidden"
        style={{
          background: "#0a0a0c",
          borderRadius: "24px 24px 0 0",
          maxHeight: "88dvh",
          transform: `translateY(${dragOffset}px)`,
          transition: dragOffset === 0 ? "transform 0.25s ease" : "none",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pb-8">

          {/* header */}
          <div className="flex items-start justify-between mb-5 pt-2">
            <div>
              <div className="text-[9px] font-black tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,0.25)" }}>SZEMÉLYES REKORD</div>
              <div className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{entry.name}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                {firstDate} – {lastDate} · {history.length} alkalom
              </div>
            </div>
            <button onClick={onClose}
              className="rounded-2xl h-9 w-9 flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
              ✕
            </button>
          </div>

          {/* PR hero stat */}
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-4"
            style={{ background: "var(--accent-primary)" }}>
            <div>
              <div className="text-[10px] font-black opacity-60 mb-0.5">LEGJOBB SÚLY</div>
              <div className="text-4xl font-black leading-none" style={{ color: "#000" }}>
                {entry.bestWeight}
                <span className="text-lg font-bold ml-1">kg</span>
              </div>
              <div className="text-sm opacity-60 mt-1" style={{ color: "#000" }}>
                × {entry.bestWeightReps} rep · {fmtDate(entry.achievedAt)}
              </div>
            </div>
            <div className="ml-auto text-right">
              {trend !== 0 && (
                <div className="text-2xl font-black" style={{ color: trend > 0 ? "#000" : "rgba(0,0,0,0.5)" }}>
                  {trend > 0 ? "↑" : "↓"} {Math.abs(trend)} kg
                </div>
              )}
              <div className="text-[10px] opacity-50 mt-0.5" style={{ color: "#000" }}>
                {entry.totalSets} szet össz.
              </div>
            </div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Legjobb vol.", value: `${Math.round(entry.bestVolume)}`, unit: "kg" },
              { label: "Össz. vol.", value: formatK(entry.totalVolume), unit: "kg" },
              { label: "Alkalmak", value: String(history.length), unit: "db" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-lg font-black leading-none" style={{ color: "var(--accent-primary)" }}>
                  {s.value}
                </div>
                <div className="text-[9px] font-bold mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {s.unit}
                </div>
                <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mode switch */}
          <div className="flex gap-1 mb-3">
            {([["weight", "Súly (kg)"], ["volume", "Volume"]] as const).map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 rounded-2xl py-2.5 text-xs font-black pressable"
                style={mode === m
                  ? { background: m === "weight" ? "var(--accent-primary)" : "#7c3aed", color: "#fff" }
                  : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {history.length < 2 ? (
            <div className="rounded-2xl py-10 text-center text-sm"
              style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.25)" }}>
              Legalább 2 edzés kell a grafikonhoz
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="px-2 pt-4 pb-2">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => new Date(d).toLocaleDateString("hu", { month: "numeric", day: "numeric" })}
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                      tickLine={false} axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                      tickLine={false} axisLine={false}
                      tickFormatter={v => `${v}`}
                    />
                    <Tooltip content={<ChartTooltip mode={mode} />} />
                    {/* PR reference line */}
                    <ReferenceLine
                      y={mode === "weight" ? maxWeight : maxVolume}
                      stroke={mode === "weight" ? "var(--accent-primary)" : "#a78bfa"}
                      strokeDasharray="4 3"
                      strokeOpacity={0.35}
                    />
                    <Line
                      type="monotone"
                      dataKey={mode === "weight" ? "bestWeight" : "bestVolume"}
                      stroke={mode === "weight" ? "var(--accent-primary)" : "#a78bfa"}
                      strokeWidth={2.5}
                      dot={(props: any) => mode === "weight"
                        ? <PRDot {...props} maxVal={maxWeight} />
                        : <VolumeDot {...props} maxVal={maxVolume} />
                      }
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History list - utolsó 10 alkalom */}
          {history.length > 0 && (
            <div className="mt-4">
              <div className="text-[9px] font-black tracking-widest mb-2"
                style={{ color: "rgba(255,255,255,0.25)" }}>ELŐZMÉNYEK</div>
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                {[...history].reverse().slice(0, 10).map((h, i, arr) => (
                  <div key={h.date}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div className="text-[10px] w-16 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {fmtDate(h.date)}
                    </div>
                    <div className="flex-1 text-xs font-black" style={{ color: "var(--text-primary)" }}>
                      {h.bestWeight} kg × {h.bestReps}
                    </div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {h.sets} szet
                    </div>
                    {h.bestWeight === maxWeight && (
                      <div className="text-[10px] font-black" style={{ color: "var(--accent-primary)" }}>PR</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>{/* end scroll */}
      </div>{/* end sheet */}
    </div>
  );
}
