// lib/programsStorage.ts
import { lsGet, lsSet } from "@/lib/storage";
import type { ProgramTemplate, UserProgram } from "@/lib/programsTypes";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

export function programsKey(profileId: string) {
  return `gym.programs.${profileId}`;
}

export function readPrograms(profileId: string): UserProgram[] {
  return lsGet<UserProgram[]>(programsKey(profileId), []);
}

export function writePrograms(profileId: string, list: UserProgram[]) {
  lsSet(programsKey(profileId), list);
}

export function getProgram(profileId: string, programId: string): UserProgram | null {
  const list = readPrograms(profileId);
  return list.find((p) => p.id === programId) ?? null;
}

export function upsertProgram(profileId: string, program: UserProgram) {
  const list = readPrograms(profileId);
  const ix = list.findIndex((p) => p.id === program.id);
  const next = { ...program, updatedAt: Date.now() };

  if (ix >= 0) list[ix] = next;
  else list.unshift(next);

  writePrograms(profileId, list);
  return next;
}

export function deleteProgram(profileId: string, programId: string) {
  const list = readPrograms(profileId).filter((p) => p.id !== programId);
  writePrograms(profileId, list);
}

/** Egyszeri cleanup: eltávolítja a duplikált fromTemplateId-jű programokat,
 *  minden sablonból csak a legrégebbit tartja meg. */
export function deduplicatePrograms(profileId: string): UserProgram[] {
  const list = readPrograms(profileId);
  const seen = new Map<string, boolean>();
  const deduped = list.filter(p => {
    if (!p.fromTemplateId) return true;
    if (seen.has(p.fromTemplateId)) return false;
    seen.set(p.fromTemplateId, true);
    return true;
  });
  if (deduped.length !== list.length) {
    writePrograms(profileId, deduped);
  }
  return deduped;
}

export function createProgramFromTemplate(profileId: string, tpl: ProgramTemplate): UserProgram {
  const now = Date.now();

  const p: UserProgram = {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    fromTemplateId: tpl.id,
    name: `${tpl.title} • ${tpl.subtitle ?? ""}`.trim().replace(/\s+•\s*$/, ""),
    sport: tpl.sport,
    level: tpl.level,
    notes: tpl.description,
    schedule: {
      enabled: false,
      preferredDaysPerWeek: tpl.sessionsPerWeek ?? undefined,
    },
    sessions: tpl.sessions.map((s) => ({
      id: s.id + "_" + uid().slice(0, 6),
      name: s.name,
      blocks: s.blocks.map((b) => ({ ...b })),
    })),
  };

  upsertProgram(profileId, p);
  return p;
}


/** Egyszeri cleanup: eltávolítja a duplikált fromTemplateId-jű programokat,
 *  csak a legrégebbi példányt tartja meg minden sablonból. */
export function deduplicatePrograms(profileId: string) {
  const list = readPrograms(profileId);
  const seen = new Map<string, boolean>();
  const deduped = list.filter(p => {
    if (!p.fromTemplateId) return true; // saját (nem sablon alapú) → mindig marad
    if (seen.has(p.fromTemplateId)) return false; // duplikát → törlés
    seen.set(p.fromTemplateId, true);
    return true;
  });
  if (deduped.length !== list.length) {
    writePrograms(profileId, deduped);
  }
  return deduped;
}