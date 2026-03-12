const fs = require('fs');
const path = 'D:/gym-webapp/gym-webapp/components/SetEditSheet.tsx';
let s = fs.readFileSync(path, 'utf8');

// ── 1. NumericWheel: manuális bevitel ──────────────────────────
const OLD_WHEEL = `function NumericWheel({ label, value, onChange, step = 1, decimals = 0 }: {
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
          style={{ background:"var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>−</button>
        <button onClick={() => onChange(Number((value + step).toFixed(2)))}
          className="flex-1 rounded-2xl py-4 text-xl font-black pressable"
          style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.2)" }}>+</button>
      </div>
      <div className="flex w-full gap-1.5">
        {(step === 0.5 ? [-5, -2.5, +2.5, +5] : [-5, -2, +2, +5]).map(d => (
          <button key={d} onClick={() => onChange(Math.max(0, Number((value + d).toFixed(2))))}
            className="flex-1 rounded-xl py-2 text-xs font-semibold pressable"
            style={{ background: d < 0 ? "rgba(255,255,255,0.04)" : "rgba(74,222,128,0.08)", color: d < 0 ? "var(--text-muted)" : "var(--accent-green)", border: \`1px solid \${d < 0 ? "var(--border-subtle)" : "rgba(74,222,128,0.15)"}\` }}>
            {d > 0 ? \`+\${d}\` : d}
          </button>
        ))}
      </div>
    </div>
  );
}`;

const NEW_WHEEL = `function NumericWheel({ label, value, onChange, step = 1, decimals = 0 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; decimals?: number;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fmt = (n: number) => decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));

  function startEdit() {
    setDraft(fmt(value));
    setEditing(true);
    setTimeout(() => { inputRef.current?.select(); }, 30);
  }
  function commitEdit() {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) onChange(Number(parsed.toFixed(2)));
    setEditing(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</div>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
          inputMode="decimal"
          className="w-full rounded-2xl px-3 py-2 text-4xl font-black tabular-nums text-center outline-none"
          style={{ background: 'rgba(34,211,238,0.08)', border: '2px solid var(--accent-primary)', color: 'var(--text-primary)' }}
        />
      ) : (
        <button onClick={startEdit}
          className="text-5xl font-black tabular-nums pressable px-2 rounded-xl"
          style={{ color: "var(--text-primary)", lineHeight: 1, background: 'transparent' }}
          title="Koppints a szerkesztéshez">
          {fmt(value)}
        </button>
      )}
      <div className="flex w-full gap-2">
        <button onClick={() => onChange(Math.max(0, Number((value - step).toFixed(2))))}
          className="flex-1 rounded-2xl py-4 text-xl font-black pressable"
          style={{ background:"var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>−</button>
        <button onClick={() => onChange(Number((value + step).toFixed(2)))}
          className="flex-1 rounded-2xl py-4 text-xl font-black pressable"
          style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.2)" }}>+</button>
      </div>
      <div className="flex w-full gap-1.5">
        {(step === 0.5 ? [-5, -2.5, +2.5, +5] : [-5, -2, +2, +5]).map(d => (
          <button key={d} onClick={() => onChange(Math.max(0, Number((value + d).toFixed(2))))}
            className="flex-1 rounded-xl py-2 text-xs font-semibold pressable"
            style={{ background: d < 0 ? "rgba(255,255,255,0.04)" : "rgba(74,222,128,0.08)", color: d < 0 ? "var(--text-muted)" : "var(--accent-green)", border: \`1px solid \${d < 0 ? "var(--border-subtle)" : "rgba(74,222,128,0.15)"}\` }}>
            {d > 0 ? \`+\${d}\` : d}
          </button>
        ))}
      </div>
    </div>
  );
}`;

s = s.replace(OLD_WHEEL, NEW_WHEEL);

// ── 2. InfoPanel: szimmetrikus lemez vizualizáció ──────────────
const OLD_PLATES_SECTION = `        {weight === 0 ? (
            <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.2)" }}>—</div>
          ) : plates.length === 0 ? (
            <div className="text-xs" style={{ color:"var(--text-muted)" }}>Csak rúd ({barKg} kg)</div>
          ) : (
            <>
              {/* Color dot list */}
              <div className="flex flex-wrap gap-1 mb-1">
                {plates.map(({ plate, count }) =>
                  Array.from({ length: count }).map((_, i) => (
                    <div key={\`\${plate}-\${i}\`}
                      className="flex items-center justify-center rounded text-[8px] font-black"
                      style={{ width: 22, height: 22, background: PLATE_COLORS[plate] ?? "#888", color: plate === 5 ? "#000" : "#fff" }}>
                      {plate}
                    </div>
                  ))
                )}
              </div>
              <div className="text-[9px]" style={{ color:"var(--text-muted)" }}>
                = {actualTotal} kg total
              </div>
            </>
          )}`;

const NEW_PLATES_SECTION = `        {weight === 0 ? (
            <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.2)" }}>—</div>
          ) : (
            <>
              {/* Szimmetrikus barbell vizualizáció */}
              <div className="flex items-center justify-center gap-0 my-1" style={{ minHeight: 36 }}>
                {/* Bal oldal: fordított sorrend (belülről kifelé) */}
                <div className="flex items-center gap-0.5 flex-row-reverse">
                  {plates.length === 0 ? null : plates.map(({ plate, count }) =>
                    Array.from({ length: count }).map((_, i) => (
                      <div key={\`L-\${plate}-\${i}\`}
                        className="flex items-center justify-center rounded-sm text-[8px] font-black"
                        style={{
                          width: plate >= 20 ? 18 : plate >= 10 ? 15 : 12,
                          height: plate >= 20 ? 36 : plate >= 10 ? 30 : 24,
                          background: PLATE_COLORS[plate] ?? "#888",
                          color: plate === 5 ? "#000" : "#fff",
                          flexShrink: 0,
                        }}>
                        {plate}
                      </div>
                    ))
                  )}
                </div>
                {/* Rúd */}
                <div className="flex items-center justify-center rounded text-[8px] font-black mx-1"
                  style={{ minWidth: 28, height: 10, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', fontSize: 7, letterSpacing: 0 }}>
                  {barKg}kg
                </div>
                {/* Jobb oldal: rendes sorrend */}
                <div className="flex items-center gap-0.5">
                  {plates.length === 0 ? null : plates.map(({ plate, count }) =>
                    Array.from({ length: count }).map((_, i) => (
                      <div key={\`R-\${plate}-\${i}\`}
                        className="flex items-center justify-center rounded-sm text-[8px] font-black"
                        style={{
                          width: plate >= 20 ? 18 : plate >= 10 ? 15 : 12,
                          height: plate >= 20 ? 36 : plate >= 10 ? 30 : 24,
                          background: PLATE_COLORS[plate] ?? "#888",
                          color: plate === 5 ? "#000" : "#fff",
                          flexShrink: 0,
                        }}>
                        {plate}
                      </div>
                    ))
                  )}
                </div>
              </div>
              {plates.length === 0 ? (
                <div className="text-[9px] text-center mt-1" style={{ color:"var(--text-muted)" }}>Csak rúd</div>
              ) : (
                <div className="text-[9px] text-center mt-1" style={{ color:"var(--text-muted)" }}>
                  = {actualTotal} kg total
                </div>
              )}
            </>
          )}`;

s = s.replace(OLD_PLATES_SECTION, NEW_PLATES_SECTION);

fs.writeFileSync(path, s, 'utf8');
console.log('SetEditSheet fixed, lines:', s.split('\n').length);
