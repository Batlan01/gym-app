const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', 'utf8');

// 1. Import WorkoutDetailSheet
s = s.replace(
  'import { RestTimerOverlay } from "@/components/RestTimerOverlay";',
  'import { RestTimerOverlay } from "@/components/RestTimerOverlay";\nimport { WorkoutDetailSheet } from "@/components/WorkoutDetailSheet";'
);

// 2. Add state for detail sheet (after newPRNames state)
s = s.replace(
  'const [newPRNames, setNewPRNames] = React.useState<string[]>([]);',
  'const [newPRNames, setNewPRNames] = React.useState<string[]>([]);\n  const [detailWorkoutId, setDetailWorkoutId] = React.useState<string | null>(null);\n  const [detailOpen, setDetailOpen] = React.useState(false);'
);

// 3. Replace the "Utolsó:" one-liner with a full recent workouts list
const oldLastLine = `            {history.length > 0 && (
              <div className="mt-2 px-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Utolsó:{" "}
                {new Date(history[0]?.startedAt).toLocaleDateString(lang, { weekday: "long", month: "short", day: "numeric" })}
                {" · "}{history[0]?.exercises?.length ?? 0} gyakorlat
              </div>
            )}`;

const newRecentList = `            {history.length > 0 && (
              <div className="mt-4">
                <div className="text-[9px] font-black tracking-widest mb-2 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  UTOLSÓ EDZÉSEK
                </div>
                <div className="space-y-2">
                  {history.slice(0, 5).map(w => {
                    const wVol = w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((s, st) => s + (st.done ? (st.weight ?? 0) * (st.reps ?? 0) : 0), 0), 0);
                    const wDone = w.exercises.reduce((acc, ex) => acc + ex.sets.filter(st => st.done).length, 0);
                    const wMins = w.finishedAt ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000) : null;
                    const wDur = wMins != null ? (wMins >= 60 ? Math.floor(wMins/60) + 'h ' + (wMins%60) + 'm' : wMins + 'm') : null;
                    return (
                      <button key={w.id}
                        onClick={() => { setDetailWorkoutId(w.id); setDetailOpen(true); }}
                        className="w-full rounded-2xl px-4 py-3 text-left pressable"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>
                            {w.title || new Date(w.startedAt).toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[10px] shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {new Date(w.startedAt).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { v: w.exercises.length + ' gyak.' },
                            { v: wDone + ' set' },
                            ...(wVol > 0 ? [{ v: Math.round(wVol) + ' kg' }] : []),
                            ...(wDur ? [{ v: '⏱ ' + wDur }] : []),
                          ].map(c => (
                            <span key={c.v} className="text-[10px] rounded-lg px-2 py-0.5 font-semibold"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                              {c.v}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}`;

s = s.replace(oldLastLine, newRecentList);

// 4. Add WorkoutDetailSheet before closing AchievementToast
s = s.replace(
  '      <AchievementToast newAchievements={newAchievements} onDismiss={() => setNewAchievements([])} />',
  `      <WorkoutDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        workout={history.find(w => w.id === detailWorkoutId) ?? null}
        onDelete={() => {
          if (!detailWorkoutId) return;
          setHistory(h => h.filter(w => w.id !== detailWorkoutId));
          setDetailOpen(false);
          setDetailWorkoutId(null);
        }}
      />
      <AchievementToast newAchievements={newAchievements} onDismiss={() => setNewAchievements([])} />`
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', s, 'utf8');
console.log('workout history list done');
