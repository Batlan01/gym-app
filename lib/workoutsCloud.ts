"use client";

import type { Workout } from "@/lib/types";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export async function saveWorkoutToCloud(uid: string, w: Workout) {
  // ugyanazzal a doc id-val mentjük -> nincs duplikáció
  const ref = doc(db, "users", uid, "workouts", w.id);

  await setDoc(
    ref,
    {
      ...w,
      id: w.id, // redundáns mező (hasznos)
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeWorkouts(uid: string, cb: (items: Workout[]) => void) {
  const q = query(collection(db, "users", uid, "workouts"), orderBy("startedAt", "desc"));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data() as any;
      const id = (data?.id as string | undefined) ?? d.id; // fallback doc id
      return { ...data, id } as Workout;
    });
    cb(items);
  });
}

/**
 * Több workout feltöltése batch-ben (import/migráció).
 * Megjegyzés: Firestore batch limit 500 írás / batch.
 */
export async function batchUploadWorkouts(uid: string, workouts: Workout[]) {
  if (!workouts?.length) return;

  const chunkSize = 400; // hagyunk tartalékot
  for (let i = 0; i < workouts.length; i += chunkSize) {
    const chunk = workouts.slice(i, i + chunkSize);

    const batch = writeBatch(db);
    for (const w of chunk) {
      if (!w?.id) continue;
      const ref = doc(db, "users", uid, "workouts", w.id);
      batch.set(
        ref,
        {
          ...w,
          id: w.id,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
  }
}
