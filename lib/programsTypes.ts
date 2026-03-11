// lib/programsTypes.ts
export type SportTag =
  // Edzőterem
  | "gym" | "powerlifting" | "olympic" | "bodybuilding" | "crossfit"
  // Testsúlyos / otthon
  | "home" | "calisthenics"
  // Kardio / sport
  | "running" | "cycling" | "swimming" | "rowing" | "jump_rope" | "hiit"
  // Küzdősportok
  | "boxing" | "mma" | "kickboxing" | "muay_thai" | "bjj" | "wrestling" | "judo" | "karate"
  // Mobilitás / regeneráció
  | "mobility" | "yoga" | "stretching" | "foam_roll" | "pilates"
  // Bemelegítés
  | "warmup"
  // Egyéb
  | "hybrid" | "sport_specific";

export type ProgramLevel = "beginner" | "intermediate" | "advanced";
export type ProgramBlockKind = "exercise" | "drill" | "interval";

export type ProgramBlockTemplate =
  | {
      kind: "exercise";
      name: string;
      targetReps?: string;
      targetSets?: number;
      notes?: string;
    }
  | {
      kind: "drill";
      name: string;
      durationSec?: number;
      notes?: string;
    }
  | {
      kind: "interval";
      name: string;
      rounds?: number;
      workSec?: number;
      restSec?: number;
      notes?: string;
    };

export type ProgramSessionTemplate = {
  id: string;
  name: string;
  blocks: ProgramBlockTemplate[];
};

export type ProgramTemplate = {
  id: string;
  title: string;
  subtitle?: string;
  sport: SportTag;
  level: ProgramLevel;
  sessionsPerWeek?: number;
  durationWeeks?: number;
  tags?: string[];
  cover?: {
    emoji?: string;
    gradient?: "slate" | "ember" | "emerald" | "violet" | "sky" | "rose" | "amber" | "indigo";
  };
  description?: string;
  sessions: ProgramSessionTemplate[];
};

export type ProgramScheduleStub = {
  enabled?: boolean;
  preferredDaysPerWeek?: number;
  pinnedDays?: Record<string, string[]>;
};

export type UserProgram = {
  id: string;
  createdAt: number;
  updatedAt: number;
  fromTemplateId?: string;
  name: string;
  description?: string;
  sport: SportTag;
  level: ProgramLevel;
  notes?: string;
  schedule?: ProgramScheduleStub;
  sessions: ProgramSessionTemplate[];
};
