"use client";

import type { User } from "firebase/auth";
import type { Profile } from "@/lib/profiles";
import { LS_ACTIVE_PROFILE, LS_PROFILES } from "@/lib/profiles";
import { lsGet, lsSet } from "@/lib/storage";

export function firebaseProfileId(uid: string) {
  return `fb:${uid}`;
}

export function ensureFirebaseProfile(user: User) {
  const id = firebaseProfileId(user.uid);
  const profiles = lsGet<Profile[]>(LS_PROFILES, []);

  const exists = profiles.some((p) => p.id === id);
  if (!exists) {
    const p: Profile = {
      id,
      name: user.displayName || user.email || "Firebase user",
      createdAt: new Date().toISOString(),
    };
    lsSet(LS_PROFILES, [p, ...profiles]);
  }

  return id;
}

export function setActiveProfile(id: string | null) {
  lsSet(LS_ACTIVE_PROFILE, id);
}
