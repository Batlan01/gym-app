export type ExerciseDef = {
  id: string;
  name: string;
  group?: string;
};

export const EXERCISES: ExerciseDef[] = [
  { id: "bench_press", name: "Bench Press", group: "Chest" },
  { id: "incline_db_press", name: "Incline DB Press", group: "Chest" },
  { id: "pushup", name: "Push-up", group: "Chest" },

  { id: "lat_pulldown", name: "Lat Pulldown", group: "Back" },
  { id: "barbell_row", name: "Barbell Row", group: "Back" },
  { id: "pullup", name: "Pull-up", group: "Back" },

  { id: "ohp", name: "Overhead Press", group: "Shoulders" },
  { id: "lateral_raise", name: "Lateral Raise", group: "Shoulders" },

  { id: "squat", name: "Squat", group: "Legs" },
  { id: "leg_press", name: "Leg Press", group: "Legs" },
  { id: "rdl", name: "Romanian Deadlift", group: "Legs" },
  { id: "deadlift", name: "Deadlift", group: "Legs" },

  { id: "biceps_curl", name: "Biceps Curl", group: "Arms" },
  { id: "triceps_pushdown", name: "Triceps Pushdown", group: "Arms" },

  { id: "plank", name: "Plank", group: "Core" },
];
