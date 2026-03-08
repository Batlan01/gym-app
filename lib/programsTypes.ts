// lib/programsTypes.ts
export type SportTag = "gym" | "home" | "running" | "boxing" | "mobility" | "hybrid";
export type ProgramLevel = "beginner" | "intermediate" | "advanced";
export type ProgramBlockKind = "exercise" | "drill" | "interval";

export type ProgramBlockTemplate =
  | {
      kind: "exercise";
      name: string;
      targetReps?: string; // pl "8-12"
      targetSets?: number; // pl 3
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
  name: string; // pl "Full Body A"
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
    gradient?: "slate" | "ember" | "emerald" | "violet" | "sky";
  };
  description?: string;
  sessions: ProgramSessionTemplate[];
};

export type ProgramScheduleStub = {
  enabled?: boolean;
  preferredDaysPerWeek?: number;
  // nap→session leképezés: kulcs "0"..„6" (0=Hétfő), érték sessionId
  pinnedDays?: Record<string, string>; // { "0": sessionId, "2": sessionId, ... }
};

export type UserProgram = {
  id: string;
  createdAt: number;
  updatedAt: number;

  fromTemplateId?: string;

  name: string;
  sport: SportTag;
  level: ProgramLevel;
  notes?: string;

  // ✅ naptár-ágya
  schedule?: ProgramScheduleStub;

  sessions: ProgramSessionTemplate[];
};
