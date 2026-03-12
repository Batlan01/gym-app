const fs = require('fs');
let page = fs.readFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', 'utf8');

// 1. Import SetType és getProgressionSuggestion
page = page.replace(
  `import { LS_ACTIVE_PROFILE, GUEST_PROFILE_ID, profileKey } from "@/lib/profiles";`,
  `import { LS_ACTIVE_PROFILE, GUEST_PROFILE_ID, profileKey } from "@/lib/profiles";
import type { SetType } from "@/lib/types";
import { getProgressionSuggestion } from "@/lib/workoutMetrics";`
);

// 2. ExerciseCard-ban onSetTypeChange és progressionTip bekötése
page = page.replace(
  `                  onToggleDone={setId => toggleSetDone(ex.id, setId)}
                  onStartRest={() => startRest(settings.restSec)}
                />`,
  `                  onToggleDone={setId => toggleSetDone(ex.id, setId)}
                  onStartRest={() => startRest(settings.restSec)}
                  onSetTypeChange={(setId, type) => {
                    setActive(prev => prev ? {
                      ...prev,
                      exercises: prev.exercises.map(e => e.id !== ex.id ? e : {
                        ...e,
                        sets: e.sets.map(s => s.id === setId ? {...s, setType: type} : s),
                      }),
                    } : prev);
                  }}
                  progressionTip={(() => {
                    const sorted = [...history].sort((a,b)=>new Date(b.startedAt).getTime()-new Date(a.startedAt).getTime());
                    return getProgressionSuggestion(sorted, ex.exerciseId);
                  })()}
                />`
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', page, 'utf8');
console.log('workout page updated');
