const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/components/WorkoutDetailSheet.tsx', 'utf8');

// Add useTranslation import
s = s.replace(
  'import * as React from "react";',
  'import * as React from "react";\nimport { useTranslation } from "@/lib/i18n";'
);

// Use locale-aware date formatting
s = s.replace(
  `return new Date(iso).toLocaleDateString("hu", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });`,
  `return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });`
);

// Add useTranslation hook in component
s = s.replace(
  'export function WorkoutDetailSheet({',
  `export function WorkoutDetailSheet({`
);

// Add hook inside the component body (after the state declarations)
s = s.replace(
  '  const [tab, setTab] = React.useState<"summary" | "exercises">("summary");',
  '  const { t } = useTranslation();\n  const [tab, setTab] = React.useState<"summary" | "exercises">("summary");'
);

// Replace hardcoded Hungarian strings
s = s.replace('"EDZÉS ÖSSZEFOGLALÓ"', 't.workout.detail_header ?? "EDZÉS ÖSSZEFOGLALÓ"');
s = s.replace('"📊 Összefoglaló"', '"📊 " + (t.workout.detail_summary ?? "Összefoglaló")');
s = s.replace(
  '`🏋️ Gyakorlatok (${workout.exercises.length})`',
  '`🏋️ ${t.workout.detail_exercises ?? "Gyakorlatok"} (${workout.exercises.length})`'
);
s = s.replace('"VOLUME PER GYAKORLAT"', 't.workout.detail_vol_per_ex ?? "VOLUME PER GYAKORLAT"');
s = s.replace('"🗑 Törlés"', '"🗑 " + (t.common.delete ?? "Törlés")');
s = s.replace(
  `{workout.title || fmtDate(workout.startedAt)}`,
  `{workout.title || fmtDate(workout.startedAt)}`
);

// Chip labels
s = s.replace('{ icon: "💪", val: `${workout.exercises.length} gyak.` }', '{ icon: "💪", val: `${workout.exercises.length} ${t.workout.exercise_count ?? "gyak."}` }');
s = s.replace('"set kész"', 't.workout.sets ?? "set"');
s = s.replace('"befejezett set"', '"" + (t.workout.sets ?? "befejezett set")');
s = s.replace('"edzés"', 't.workout.active ?? "edzés"');

// fmtDuration locale
s = s.replace(
  'return mins >= 60 ? `${Math.floor(mins / 60)}ó ${mins % 60}p` : `${mins}p`;',
  'return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;'
);

// Bezárás button
s = s.replace('"Bezárás"', 't.common.close ?? "Bezárás"');

fs.writeFileSync('D:/gym-webapp/gym-webapp/components/WorkoutDetailSheet.tsx', s, 'utf8');
console.log('WorkoutDetailSheet i18n done');
