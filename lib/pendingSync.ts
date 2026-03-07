"use client";

import type { Workout } from "@/lib/types";
import { lsGet, lsSet } from "@/lib/storage";
import { saveWorkoutToCloud } from "@/lib/workoutsCloud";

const BASE_KEY = (uid: string) => `gym.fb.${uid}.pendingQueue`;

export type PendingItem = {
  id: string;               // workout id
  workout: Workout;
  tries: number;
  lastError?: string;
  nextAttemptAt?: number;   // epoch ms
  createdAt: number;        // epoch ms
  updatedAt: number;        // epoch ms
};

export type FlushPendingOpts = {
  /** régi név */
  limit?: number;
  /** új név (alias) */
  max?: number;
  /** csak azok, amik "esedékesek" */
  onlyDue?: boolean;
  /** egy feltöltés max ideje (ms) */
  timeoutMs?: number;
};

function now() {
  return Date.now();
}

function loadQueue(uid: string): PendingItem[] {
  return lsGet<PendingItem[]>(BASE_KEY(uid), []);
}

function saveQueue(uid: string, items: PendingItem[]) {
  lsSet(BASE_KEY(uid), items);
}

function stringifyErr(e: unknown) {
  if (!e) return "unknown";
  if (typeof e === "string") return e;
  const anyE: any = e;
  return anyE?.message ?? anyE?.code ?? JSON.stringify(anyE);
}

function computeBackoffMs(tries: number) {
  // 1. fail: ~5s, 2. fail: ~10s, 3. fail: ~20s ... cap: 30 perc
  const base = 5000;
  const ms = base * Math.pow(2, Math.max(0, tries - 1));
  return Math.min(ms, 30 * 60 * 1000);
}

async function withTimeout<T>(p: Promise<T>, timeoutMs?: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return p;

  return await Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error("timeout")), timeoutMs)
    ),
  ]);
}

export function pendingCount(uid: string) {
  return loadQueue(uid).length;
}

export function listPending(uid: string) {
  return loadQueue(uid);
}

/** Teljes queue törlés (pl. Settings "Clear queue" gombhoz) */
export function clearPending(uid: string) {
  saveQueue(uid, []);
}

/** Egy konkrét elem törlése (ha később kell) */
export function clearPendingOne(uid: string, workoutId: string) {
  const q = loadQueue(uid);
  saveQueue(uid, q.filter((x) => x.id !== workoutId));
}

/**
 * Ha cloud mentés fail / offline: enqueue.
 * Ugyanazzal a workout id-val deduplikálunk.
 */
export function enqueueWorkout(uid: string, workout: Workout, err?: unknown) {
  const q = loadQueue(uid);
  const t = now();

  const existingIdx = q.findIndex((x) => x.id === workout.id);

  if (existingIdx >= 0) {
    const prev = q[existingIdx];
    q[existingIdx] = {
      ...prev,
      workout,
      lastError: err ? stringifyErr(err) : prev.lastError,
      updatedAt: t,
      // tries maradjon
    };
  } else {
    const next: PendingItem = {
      id: workout.id,
      workout,
      tries: 0,
      lastError: err ? stringifyErr(err) : undefined,
      nextAttemptAt: t,
      createdAt: t,
      updatedAt: t,
    };
    q.unshift(next);
  }

  saveQueue(uid, q.slice(0, 500)); // cap
}

export async function flushPending(uid: string, opts?: FlushPendingOpts) {
  const limit = opts?.limit ?? opts?.max ?? 25;
  const onlyDue = opts?.onlyDue ?? false;
  const timeoutMs = opts?.timeoutMs ?? 0;

  const t = now();
  const q = loadQueue(uid);

  const candidates = onlyDue
    ? q.filter((it) => !it.nextAttemptAt || it.nextAttemptAt <= t)
    : q;

  const batch = candidates.slice(0, Math.max(1, limit));

  let uploaded = 0;
  let nextQ = [...q];

  for (const item of batch) {
    try {
      await withTimeout(saveWorkoutToCloud(uid, item.workout), timeoutMs);

      // success -> remove
      nextQ = nextQ.filter((x) => x.id !== item.id);
      uploaded += 1;
    } catch (e) {
      const msg = stringifyErr(e);

      nextQ = nextQ.map((x) => {
        if (x.id !== item.id) return x;
        const tries = (x.tries ?? 0) + 1;
        const backoff = computeBackoffMs(tries);
        return {
          ...x,
          tries,
          lastError: msg,
          nextAttemptAt: now() + backoff,
          updatedAt: now(),
        };
      });
    }
  }

  saveQueue(uid, nextQ);

  return {
    attempted: batch.length,
    uploaded,
    remaining: nextQ.length,
  };
}
