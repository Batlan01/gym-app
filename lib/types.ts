// lib/types.ts
export type SetType = "normal" | "warmup" | "superset" | "dropset" | "failure";

export type WorkoutSet = {
  id: string;
  reps?: number | null;
  weight?: number | null;
  rpe?: number | null;
  notes?: string;
  done?: boolean;
  setType?: SetType;
};

// Alias for backward compatibility
export type SetEntry = WorkoutSet;

export type WorkoutExercise = {
  id: string;
  exerciseId: string; // a library-ből
  name: string;
  category?: string;
  subcategory?: string;
  sets: WorkoutSet[];
  notes?: string;
  favorite?: boolean;
  bilateral?: boolean;
};

export type Workout = {
  id: string;
  startedAt: string; // ISO
  finishedAt?: string | null;
  title?: string;
  exercises: WorkoutExercise[];
};

/** ---------------- PROGRAMS (calendar-ready) ---------------- */

export type SportTag =
  | "gym"
  | "home"
  | "running"
  | "cycling"
  | "swimming"
  | "boxing"
  | "mma"
  | "football"
  | "basketball"
  | "tennis"
  | "mobility"
  | "rehab"
  | "general";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type ProgramExercise = {
  id: string;
  exerciseId?: string; // ha library-ből jön
  name: string;

  // célok (builder)
  setsTarget?: number | null;
  repsTarget?: string | null; // pl "8-12" / "5x5"
  rpeTarget?: number | null;
  notes?: string;
};

export type ProgramSession = {
  id: string;
  name: string; // pl "Lower A", "Speed", "Technique"
  focusTags?: string[]; // opcionális címkék
  exercises: ProgramExercise[];
};

export type ProgramSchedule = {
  /**
   * "none": még nincs ütemezve (most ezt használjuk)
   * "weekly": heti slotok – a naptár oldal később ebből tud építkezni
   */
  mode: "none" | "weekly";

  /**
   * Calendar-ready: melyik nap melyik session template legyen alapértelmezetten.
   */
  week: Record<Weekday, string | null>; // sessionId vagy null
};

export type Program = {
  id: string;
  name: string;
  sport: SportTag;

  createdAt: string; // ISO
  updatedAt: string; // ISO

  level?: "beginner" | "intermediate" | "advanced";
  notes?: string;

  sessions: ProgramSession[];

  // előkészítés a naptárhoz
  schedule: ProgramSchedule;
};

export type ProgramTemplate = Omit<Program, "id" | "createdAt" | "updatedAt"> & {
  templateId: string;
  name: string;
};
