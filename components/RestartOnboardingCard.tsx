"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsRemove, lsSet } from "@/lib/storage";
import { LS_ACTIVE_PROFILE, onboardedKey, profileMetaKey } from "@/lib/profiles";

export function RestartOnboardingCard() {
  const router = useRouter();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [busy, setBusy] = React.useState(false);

  const restart = React.useCallback(async () => {
    if (!activeProfileId) return;
    setBusy(true);
    try {
      // csak újra-kiértékeljük az onboardingot (meta marad)
      lsSet(onboardedKey(activeProfileId), false);

      // menjünk onboardingra
      router.replace("/onboarding");
    } finally {
      setBusy(false);
    }
  }, [activeProfileId, router]);

  const restartAndWipe = React.useCallback(async () => {
    if (!activeProfileId) return;
    setBusy(true);
    try {
      // meta törlés + onboarding újra
      lsRemove(profileMetaKey(activeProfileId));
      lsSet(onboardedKey(activeProfileId), false);

      router.replace("/onboarding");
    } finally {
      setBusy(false);
    }
  }, [activeProfileId, router]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">Onboarding</div>
      <div className="mt-1 text-xs text-white/60">
        Ha újra akarod beállítani a profilod (név, cél, heti napok, fókusz stb).
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={restart}
          disabled={busy || !activeProfileId}
          className="rounded-2xl border border-white/10 bg-white/10 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-40"
        >
          Onboarding újrakezdése
        </button>

        <button
          type="button"
          onClick={restartAndWipe}
          disabled={busy || !activeProfileId}
          className="rounded-2xl border border-red-500/25 bg-red-500/10 py-3 text-sm text-red-100 hover:bg-red-500/15 disabled:opacity-40"
        >
          Reset + profil adatok törlése
        </button>
      </div>

      {!activeProfileId ? (
        <div className="mt-3 text-xs text-white/45">Nincs kiválasztott profil.</div>
      ) : null}
    </section>
  );
}
