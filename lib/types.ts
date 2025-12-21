export type SetEntry = {
  id: string;
  weight: number | null;
  reps: number | null;
  done: boolean;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  sets: SetEntry[];
};

export type Workout = {
  id: string;
  startedAt: string; // ISO
  finishedAt?: string; // ISO
  exercises: WorkoutExercise[];
};
