// src/app/onboarding/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE, GUEST_PROFILE_ID, onboardedKey, profileMetaKey } from "@/lib/profiles";

type ProfileMeta = {
  displayName: string;
  age: number | null;
  weightKg: number | null;
  goal: "cut" | "bulk" | "recomp" | "strength" | "fitness";
  where: "gym" | "home" | "both";
  focus: string; // pl. "full body / push pull legs / ..."
};

export default function OnboardingPage() {
  const router = useRouter();
  const [activeProfileId, , activeHydrated] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const profileId = activeProfileId ?? null;

  const metaKey = profileId ? profileMetaKey(profileId) : "__noop_meta__";
  const onboardKey = profileId ? onboardedKey(profileId) : "__noop_onb__";

  const [meta, setMeta] = useLocalStorageState<ProfileMeta>(metaKey, {
    displayName: "",
    age: null,
    weightKg: null,
    goal: "fitness",
    where: "gym",
    focus: "full body",
  });

  const [, setOnboarded] = useLocalStorageState<boolean>(onboardKey, false);

  React.useEffect(() => {
    if (!activeHydrated) return;
    if (!profileId) {
      router.replace("/login");
      return;
    }
    if (profileId === GUEST_PROFILE_ID) {
      // guest skip
      setOnboarded(true);
      router.replace("/workout");
    }
  }, [activeHydrated, profileId, router, setOnboarded]);

  if (!activeHydrated || !profileId) return null;

  const canSave = meta.displayName.trim().length >= 2;

  return (
    <main className="mx-auto max-w-md px-4 pt-10 pb-16">
      <div className="text-xs tracking-widest text-white/50">ONBOARDING</div>
      <h1 className="mt-1 text-3xl font-bold text-white">Profil beállítása</h1>
      <p className="mt-2 text-sm text-white/60">
        1 perc és kész. Később bármikor módosíthatod.
      </p>

      <section className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <label className="block">
          <div className="text-xs text-white/60">Név</div>
          <input
            value={meta.displayName}
            onChange={(e) => setMeta((m) => ({ ...m, displayName: e.target.value }))}
            placeholder="pl. Nikolas"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-xs text-white/60">Életkor</div>
            <input
              value={meta.age ?? ""}
              onChange={(e) => {
                const n = e.target.value.trim() ? Number(e.target.value) : null;
                setMeta((m) => ({ ...m, age: Number.isFinite(n as any) ? (n as any) : null }));
              }}
              inputMode="numeric"
              placeholder="pl. 28"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
            />
          </label>

          <label className="block">
            <div className="text-xs text-white/60">Súly (kg)</div>
            <input
              value={meta.weightKg ?? ""}
              onChange={(e) => {
                const n = e.target.value.trim() ? Number(e.target.value) : null;
                setMeta((m) => ({ ...m, weightKg: Number.isFinite(n as any) ? (n as any) : null }));
              }}
              inputMode="decimal"
              placeholder="pl. 78"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-xs text-white/60">Cél</div>
            <select
              value={meta.goal}
              onChange={(e) => setMeta((m) => ({ ...m, goal: e.target.value as any }))}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
            >
              <option value="fitness">Fitness</option>
              <option value="strength">Erő</option>
              <option value="cut">Cut</option>
              <option value="bulk">Bulk</option>
              <option value="recomp">Recomp</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs text-white/60">Hol edzel?</div>
            <select
              value={meta.where}
              onChange={(e) => setMeta((m) => ({ ...m, where: e.target.value as any }))}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
            >
              <option value="gym">Terem</option>
              <option value="home">Otthon</option>
              <option value="both">Mindkettő</option>
            </select>
          </label>
        </div>

        <label className="block">
          <div className="text-xs text-white/60">Edzés stílus / split</div>
          <input
            value={meta.focus}
            onChange={(e) => setMeta((m) => ({ ...m, focus: e.target.value }))}
            placeholder="pl. full body / PPL / upper-lower"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </label>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            setOnboarded(true);
            router.replace("/workout");
          }}
          className={`mt-2 w-full rounded-2xl px-4 py-3 text-sm ${
            canSave
              ? "border border-white/15 bg-white/10 text-white hover:bg-white/15"
              : "border border-white/10 bg-white/5 text-white/30"
          }`}
        >
          Kész, mehetünk
        </button>

        <button
          type="button"
          onClick={() => {
            // skip, de jelöljük onboarded-nek (ha akarod: itt hagyhatod false-ra is)
            setOnboarded(true);
            router.replace("/workout");
          }}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs text-white/70 hover:bg-white/10"
        >
          Kihagyom (később beállítom)
        </button>
      </section>
    </main>
  );
}
