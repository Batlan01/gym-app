const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/components/SetEditSheet.tsx', 'utf8');

// 1. SetEditSheet export: exercise prop + bilateral state
const OLD_EXPORT_SIG = `export function SetEditSheet({ open, onClose, title, set, onSave, onDelete, onCopyPrev }: {
  open: boolean; onClose: () => void; title: string;
  set: SetEntry | null;
  onSave: (patch: Partial<SetEntry>) => void;
  onDelete: () => void; onCopyPrev: () => void;
}) {
  if (!open || !set) return null;

  const w = set.weight ?? 0;
  const r = set.reps ?? 0;`;

const NEW_EXPORT_SIG = `export function SetEditSheet({ open, onClose, title, set, exercise, onSave, onDelete, onCopyPrev, onBilateralChange }: {
  open: boolean; onClose: () => void; title: string;
  set: SetEntry | null;
  exercise?: WorkoutExercise;
  onSave: (patch: Partial<SetEntry>) => void;
  onDelete: () => void; onCopyPrev: () => void;
  onBilateralChange?: (bilateral: boolean) => void;
}) {
  if (!open || !set) return null;

  const w = set.weight ?? 0;
  const r = set.reps ?? 0;
  const autoBilateral = isBilateralExercise(exercise?.category, exercise?.bilateral);
  const [bilateral, setBilateral] = React.useState(exercise?.bilateral ?? autoBilateral);

  function toggleBilateral() {
    const next = !bilateral;
    setBilateral(next);
    onBilateralChange?.(next);
  }`;

s = s.replace(OLD_EXPORT_SIG, NEW_EXPORT_SIG);

// 2. InfoPanel hívás: bilateral átadása
s = s.replace(
  `          {/* 1RM + Plates inline panel — always visible */}
          <InfoPanel weight={w} reps={r} />`,
  `          {/* 1RM + Plates inline panel — always visible */}
          <InfoPanel weight={w} reps={r} bilateral={bilateral} />`
);

// 3. Bilateral toggle — InfoPanel elé betoldva
s = s.replace(
  `          {/* 1RM + Plates inline panel — always visible */}
          <InfoPanel weight={w} reps={r} bilateral={bilateral} />`,
  `          {/* Bilateral toggle */}
          <button onClick={toggleBilateral}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-2.5 mb-2 pressable"
            style={{ background: bilateral ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.03)", border: \`1px solid \${bilateral ? "rgba(34,211,238,0.25)" : "var(--border-subtle)"}\` }}>
            <div className="flex items-center gap-2">
              <span className="text-base">{bilateral ? "🏋️🏋️" : "🏋️"}</span>
              <div className="text-left">
                <div className="text-xs font-bold" style={{ color: bilateral ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  {bilateral ? "Egykezes (×2)" : "Kétkezes / Rúd (×1)"}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {bilateral ? \`Össztömeg: \${w * 2} kg (2 × \${w} kg)\` : \`Össztömeg: \${w} kg\`}
                </div>
              </div>
            </div>
            <div className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: bilateral ? "rgba(34,211,238,0.15)" : "var(--surface-2)", color: bilateral ? "var(--accent-primary)" : "var(--text-muted)" }}>
              {bilateral ? "DB" : "BB"}
            </div>
          </button>

          {/* 1RM + Plates inline panel — always visible */}
          <InfoPanel weight={w} reps={r} bilateral={bilateral} />`
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/components/SetEditSheet.tsx', s, 'utf8');
console.log('SetEditSheet bilateral toggle done');
