const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/components/SetEditSheet.tsx', 'utf8');

// 1. Import isBilateralExercise
s = s.replace(
  `import type { SetEntry } from "@/lib/types";`,
  `import type { SetEntry, WorkoutExercise } from "@/lib/types";
import { isBilateralExercise } from "@/lib/workoutHelpers";`
);

// 2. InfoPanel: bilateral prop hozzáadása + plate calc + total frissítés
const OLD_PANEL_SIG = `function InfoPanel({ weight, reps }: { weight: number; reps: number }) {
  const [barKg, setBarKg] = React.useState(20);
  const orm = weight > 0 && reps > 0 ? calc1RM(weight, reps) : null;
  const plates = weight > 0 ? calcPlates(weight, barKg) : [];
  const actualTotal = barKg + plates.reduce((s, p) => s + p.plate * p.count * 2, 0);`;

const NEW_PANEL_SIG = `function InfoPanel({ weight, reps, bilateral }: { weight: number; reps: number; bilateral: boolean }) {
  const [barKg, setBarKg] = React.useState(20);
  const orm = weight > 0 && reps > 0 ? calc1RM(weight, reps) : null;
  // Egykezes: a suly 1 kézre vonatkozik, a barbell calc is 1 kézre
  const plates = weight > 0 && !bilateral ? calcPlates(weight, barKg) : [];
  const actualTotal = bilateral
    ? weight * 2
    : barKg + plates.reduce((s, p) => s + p.plate * p.count * 2, 0);`;

s = s.replace(OLD_PANEL_SIG, NEW_PANEL_SIG);

// 3. A "LEMEZEK / OLDAL" fejléc átírása egykezes esetén
const OLD_PLATE_LABEL = `            <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-black tracking-widest" style={{ color:"var(--text-muted)" }}>LEMEZEK / OLDAL</div>`;
const NEW_PLATE_LABEL = `            <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-black tracking-widest" style={{ color:"var(--text-muted)" }}>
              {bilateral ? "EGYKEZES SÚLY" : "LEMEZEK / OLDAL"}
            </div>`;
s = s.replace(OLD_PLATE_LABEL, NEW_PLATE_LABEL);

// 4. Bar selector csak barbell esetén jelenik meg
const OLD_BAR_SEL = `            {/* Bar selector */}
            <div className="flex gap-1">
              {[15, 20].map(b => (
                <button key={b} onClick={() => setBarKg(b)}
                  className="rounded-lg px-1.5 py-0.5 text-[9px] font-black pressable"
                  style={barKg === b
                    ? { background: "var(--accent-primary)", color: "#000" }
                    : { background:"var(--surface-2)", color:"var(--text-muted)" }}>
                  {b}kg
                </button>
              ))}
            </div>`;
const NEW_BAR_SEL = `            {/* Bar selector — csak barbell esetén */}
            {!bilateral && (
              <div className="flex gap-1">
                {[15, 20].map(b => (
                  <button key={b} onClick={() => setBarKg(b)}
                    className="rounded-lg px-1.5 py-0.5 text-[9px] font-black pressable"
                    style={barKg === b
                      ? { background: "var(--accent-primary)", color: "#000" }
                      : { background:"var(--surface-2)", color:"var(--text-muted)" }}>
                    {b}kg
                  </button>
                ))}
              </div>
            )}`;
s = s.replace(OLD_BAR_SEL, NEW_BAR_SEL);

// 5. Egykezes vizualizáció — ha bilateral, két dumbbell egymás mellett
const OLD_PLATE_VIZ = `        {weight === 0 ? (
            <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.2)" }}>—</div>
          ) : (
            <>
              {/* Szimmetrikus barbell vizualizáció */}`;
const NEW_PLATE_VIZ = `        {weight === 0 ? (
            <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.2)" }}>—</div>
          ) : bilateral ? (
            /* Egykezes: két dumbbell */
            <div className="flex items-center justify-center gap-4 my-1">
              {[0,1].map(side => (
                <div key={side} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    <div className="rounded" style={{ width: 8, height: 20, background: 'rgba(255,255,255,0.12)' }} />
                    <div className="flex items-center justify-center rounded text-[9px] font-black"
                      style={{ width: 28, height: 28, background: 'var(--accent-primary)', color: '#000' }}>
                      {weight}
                    </div>
                    <div className="rounded" style={{ width: 8, height: 20, background: 'rgba(255,255,255,0.12)' }} />
                  </div>
                  <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{side === 0 ? 'bal' : 'jobb'}</div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Szimmetrikus barbell vizualizáció */}`;

s = s.replace(OLD_PLATE_VIZ, NEW_PLATE_VIZ);

// 6. Zárójel fix — a bilateral ágat le kell zárni
// Az eredeti kód végén volt egy </>), most elé beteszünk egy ) :
const OLD_CLOSING = `            </>
          )}
        </div>
      </div>
    </div>
  );
}`;
const NEW_CLOSING = `            </>
          )}
        </div>
      </div>
    </div>
  );
}`;
// (ez nem változik, csak ellenőrzés — a bilateral ág már zárva van fentebb)

fs.writeFileSync('D:/gym-webapp/gym-webapp/components/SetEditSheet.tsx', s, 'utf8');
console.log('SetEditSheet step1 done');
