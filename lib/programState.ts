// lib/programState.ts
"use client";

import * as React from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import type { ProgramTemplate, UserProgram } from "@/lib/programsTypes";
import {
  readPrograms,
  getProgram as storageGetProgram,
  upsertProgram as storageUpsertProgram,
  deleteProgram as storageDeleteProgram,
  createProgramFromTemplate as storageCreateFromTemplate,
} from "@/lib/programsStorage";

/**
 * Kliens-oldali "program state" réteg:
 * - aktív profilhoz kötött program lista
 * - CRUD + template->program indítás
 * - refresh + cross-tab sync (storage event)
 *
 * Használat:
 *   const ps = useProgramState();
 *   ps.programs, ps.createFromTemplate(...), ps.save(...), ps.remove(...)
 */
export type ProgramState = {
  activeProfileId: string | null;

  programs: UserProgram[];
  isReady: boolean;

  refresh: () => void;

  getById: (programId: string) => UserProgram | null;

  createFromTemplate: (tpl: ProgramTemplate) => UserProgram | null;

  save: (program: UserProgram) => UserProgram | null;

  patch: (programId: string, patch: Partial<UserProgram>) => UserProgram | null;

  remove: (programId: string) => void;
};

function safeReadPrograms(profileId: string | null): UserProgram[] {
  if (!profileId) return [];
  try {
    return readPrograms(profileId);
  } catch {
    return [];
  }
}

export function useProgramState(): ProgramState {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [programs, setPrograms] = React.useState<UserProgram[]>([]);
  const [isReady, setIsReady] = React.useState(false);

  const refresh = React.useCallback(() => {
    setPrograms(safeReadPrograms(activeProfileId));
    setIsReady(true);
  }, [activeProfileId]);

  // initial + when profile changes
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // cross-tab sync (ha másik fül módosítja a localStorage-t)
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      // Nem ismerjük itt a konkrét kulcsot, de profilváltás / program mentés esetén is jó frissíteni.
      // (Olcsó: egy lsGet + state update)
      if (!activeProfileId) return;

      // Ha a profil kulcsa változott, vagy bármi a gym.* namespace-ben
      const k = e.key ?? "";
      const isProfileKey = k === LS_ACTIVE_PROFILE;
      const isGymKey = k.startsWith("gym.");

      if (isProfileKey || isGymKey) {
        setPrograms(safeReadPrograms(activeProfileId));
        setIsReady(true);
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [activeProfileId]);

  const getById = React.useCallback(
    (programId: string) => {
      if (!activeProfileId) return null;
      // prefer state (gyors), fallback storage (ha valamiért nincs a listában)
      const fromState = programs.find((p) => p.id === programId) ?? null;
      if (fromState) return fromState;
      try {
        return storageGetProgram(activeProfileId, programId);
      } catch {
        return null;
      }
    },
    [activeProfileId, programs]
  );

  const createFromTemplate = React.useCallback(
    (tpl: ProgramTemplate) => {
      if (!activeProfileId) return null;
      const created = storageCreateFromTemplate(activeProfileId, tpl);
      // storageCreateFromTemplate már upsert-el, de mi frissítünk lokál state-ben is
      setPrograms((prev) => {
        const without = prev.filter((p) => p.id !== created.id);
        return [created, ...without];
      });
      return created;
    },
    [activeProfileId]
  );

  const save = React.useCallback(
    (program: UserProgram) => {
      if (!activeProfileId) return null;
      const next = storageUpsertProgram(activeProfileId, program);
      setPrograms((prev) => {
        const ix = prev.findIndex((p) => p.id === next.id);
        if (ix >= 0) {
          const copy = prev.slice();
          copy[ix] = next;
          return copy;
        }
        return [next, ...prev];
      });
      return next;
    },
    [activeProfileId]
  );

  const patch = React.useCallback(
    (programId: string, patchObj: Partial<UserProgram>) => {
      if (!activeProfileId) return null;
      const current = getById(programId);
      if (!current) return null;

      // alap safety: ne engedjük felülírni az id-t
      const { id: _ignoreId, ...rest } = patchObj as any;

      const merged: UserProgram = {
        ...current,
        ...rest,
        id: current.id,
        updatedAt: Date.now(),
      };

      return save(merged);
    },
    [activeProfileId, getById, save]
  );

  const remove = React.useCallback(
    (programId: string) => {
      if (!activeProfileId) return;
      storageDeleteProgram(activeProfileId, programId);
      setPrograms((prev) => prev.filter((p) => p.id !== programId));
    },
    [activeProfileId]
  );

  return {
    activeProfileId,
    programs,
    isReady,
    refresh,
    getById,
    createFromTemplate,
    save,
    patch,
    remove,
  };
}

/**
 * Ha neked kényelmesebb profilId-t expliciten átadni egy komponensből:
 *   const { programs, save } = usePrograms(profileId);
 */
export function usePrograms(profileId: string | null) {
  const [programs, setPrograms] = React.useState<UserProgram[]>([]);
  const [isReady, setIsReady] = React.useState(false);

  const refresh = React.useCallback(() => {
    setPrograms(safeReadPrograms(profileId));
    setIsReady(true);
  }, [profileId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      const k = e.key ?? "";
      if (k.startsWith("gym.")) {
        setPrograms(safeReadPrograms(profileId));
        setIsReady(true);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [profileId]);

  const getById = React.useCallback(
    (programId: string) => {
      if (!profileId) return null;
      return programs.find((p) => p.id === programId) ?? storageGetProgram(profileId, programId);
    },
    [profileId, programs]
  );

  const save = React.useCallback(
    (program: UserProgram) => {
      if (!profileId) return null;
      const next = storageUpsertProgram(profileId, program);
      setPrograms((prev) => {
        const ix = prev.findIndex((p) => p.id === next.id);
        if (ix >= 0) {
          const copy = prev.slice();
          copy[ix] = next;
          return copy;
        }
        return [next, ...prev];
      });
      return next;
    },
    [profileId]
  );

  const remove = React.useCallback(
    (programId: string) => {
      if (!profileId) return;
      storageDeleteProgram(profileId, programId);
      setPrograms((prev) => prev.filter((p) => p.id !== programId));
    },
    [profileId]
  );

  return { programs, isReady, refresh, getById, save, remove };
}
