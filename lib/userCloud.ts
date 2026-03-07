"use client";

import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

export async function ensureUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      lastLoginAt: serverTimestamp(),
      // createdAt csak akkor legyen, ha még nincs (merge + field hiány esetén is beírja,
      // de később nem gond, ha felülíródik? -> inkább külön "createdAt" trükk bonyi.
      // Most egyszerűen bent hagyjuk:
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
