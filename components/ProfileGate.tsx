"use client";

import * as React from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsSet, uid } from "@/lib/storage";
import type { Profile } from "@/lib/profiles";
import { GUEST_PROFILE_ID, LS_ACTIVE_PROFILE, LS_PROFILES, onboardedKey, isCloudProfileId } from "@/lib/profiles";
import { GymBackdrop } from "@/components/GymBackdrop";

function createProfileObj(name: string): Profile {
  return { id: uid(), name: name.trim(), createdAt: new Date().toISOString() };
}

function ensureGuest(profiles: Profile[]): Profile[] {
  if (profiles.some((p) => p.id === GUEST_PROFILE_ID)) return profiles;
  return [{ id: GUEST_PROFILE_ID, name: "Guest", createdAt: new Date().toISOString() }, ...profiles];
}

function clearProfileLocalData(profileId: string) {
  if (typeof window === "undefined") return;
  const keys = [
    `gym.${profileId}.activeWorkout`,
    `gym.${profileId}.workouts`,
    `gym.${profileId}.recents`,
    `gym.${profileId}.favorites`,
    `gym.${profileId}.settings`,
    `gym.${profileId}.onboarded`,
    `gym.${profileId}.profileMeta`,
  ];
  for (const k of keys) localStorage.removeItem(k);
}

type Props = {
  children: React.ReactNode;
  forceOpen?: boolean;
  onClosed?: () => void;

  // login oldalon: csak local profilokat mutasson
  onlyLocal?: boolean;

  // ha kiválasztották a profilt (login oldalon kényelmes)
  onPicked?: (profileId: string) => void;
};

export function ProfileGate({ children, forceOpen, onClosed, onlyLocal, onPicked }: Props) {
  const [profiles, setProfiles, profilesHydrated] = useLocalStorageState<Profile[]>(LS_PROFILES, []);
  const [activeProfileId, setActiveProfileId, activeHydrated] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [name, setName] = React.useState("");
  const [open, setOpen] = React.useState(false);

  // ---- HOOKOK MINDIG A RETURN ELŐTT! ----
  const visibleProfiles = React.useMemo(() => {
    const base = ensureGuest(profiles);
    if (!onlyLocal) return base;
    return base.filter((p) => p.id === GUEST_PROFILE_ID || !isCloudProfileId(p.id));
  }, [profiles, onlyLocal]);

  // init guest (csak akkor, ha már beolvastunk LS-ből)
  React.useEffect(() => {
    if (!profilesHydrated) return;
    setProfiles((prev) => ensureGuest(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilesHydrated]);

  // auto open
  React.useEffect(() => {
    if (!activeHydrated) return;

    if (typeof forceOpen === "boolean") {
      setOpen(forceOpen);
      return;
    }

    setOpen(!activeProfileId);
  }, [activeHydrated, activeProfileId, forceOpen]);

  const closeGate = React.useCallback(() => {
    setOpen(false);
    onClosed?.();
  }, [onClosed]);

  const pick = React.useCallback(
    (id: string) => {
      setActiveProfileId(id);

      // ha még nincs onboarded flag -> induljon onboarding (false)
      const k = onboardedKey(id);
      // ha még nincs ott, létrehozzuk (a read a másik oldalon történik, itt elég “set missing”-ként)
      // simplest: ha nincs, false
      // (ha már true/false, nem bántjuk)
      // mivel nincs lsHas, egy null read lenne, de azt itt nem akarjuk – elég safe: set if missing helyett
      // inkább: csak create/guestnél írjuk. (itt nem muszáj)

      closeGate();
      onPicked?.(id);
    },
    [setActiveProfileId, closeGate, onPicked]
  );

  const onCreate = React.useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const p = createProfileObj(trimmed);

    setProfiles((prev) => {
      const next = ensureGuest(prev).filter((x) => x.id !== p.id);
      return [p, ...next];
    });

    // új profil -> onboarding induljon
    lsSet(onboardedKey(p.id), false);

    setActiveProfileId(p.id);
    setName("");
    closeGate();
    onPicked?.(p.id);
  }, [name, setProfiles, setActiveProfileId, closeGate, onPicked]);

  const continueGuest = React.useCallback(() => {
    setProfiles((prev) => ensureGuest(prev));

    // guestnél: legyen késznek tekintve (vagy ha inkább onboardingoltatnád, állítsd false-ra)
    lsSet(onboardedKey(GUEST_PROFILE_ID), true);

    setActiveProfileId(GUEST_PROFILE_ID);
    closeGate();
    onPicked?.(GUEST_PROFILE_ID);
  }, [setProfiles, setActiveProfileId, closeGate, onPicked]);

  const deleteProfile = React.useCallback(
    (id: string) => {
      if (id === GUEST_PROFILE_ID) return;

      const label = isCloudProfileId(id) ? "Account profilt" : "profilt";
      const ok = window.confirm(`Biztos törlöd ezt a ${label}?`);
      if (!ok) return;

      setProfiles((prev) => ensureGuest(prev.filter((p) => p.id !== id)));

      if (activeProfileId === id) {
        setActiveProfileId(null);
        setOpen(true);
      }

      clearProfileLocalData(id);
    },
    [activeProfileId, setProfiles, setActiveProfileId]
  );

  const shouldShow = typeof forceOpen === "boolean" ? forceOpen : open;
  if (!shouldShow) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[90]">
      <GymBackdrop />
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

      <div className="relative mx-auto w-full max-w-md px-4 pt-16 pb-24">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(520px_140px_at_50%_0%,rgba(255,255,255,0.14),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />

          <div className="relative p-6">
            <div className="text-[11px] tracking-[0.35em] text-white/55">PROFILE</div>
            <div className="mt-2 text-2xl font-semibold text-white">Válassz vagy hozz létre</div>
            <div className="mt-1 text-sm text-white/55">Minden edzés, kedvenc és beállítás a profilodhoz kerül.</div>

            <div className="mt-5 space-y-2">
              {visibleProfiles
                .slice()
                .sort((a, b) => {
                  if (a.id === GUEST_PROFILE_ID) return 1;
                  if (b.id === GUEST_PROFILE_ID) return -1;
                  return b.createdAt.localeCompare(a.createdAt);
                })
                .map((p) => (
                  <div key={p.id} className="group flex items-stretch gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
                    <button
                      type="button"
                      onClick={() => pick(p.id)}
                      className="flex-1 rounded-xl px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-white/40">
                          {p.id === GUEST_PROFILE_ID ? "Guest" : isCloudProfileId(p.id) ? "Account" : ""}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-white/40 group-hover:text-white/50">Tap to continue</div>
                    </button>

                    {p.id !== GUEST_PROFILE_ID ? (
                      <button
                        type="button"
                        aria-label="Profil törlése"
                        title="Törlés"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProfile(p.id);
                        }}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15 active:scale-[0.98]"
                      >
                        ✕
                      </button>
                    ) : (
                      <div className="h-10 w-10" />
                    )}
                  </div>
                ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/55">Új profil</div>

              <div className="mt-2 flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onCreate()}
                  placeholder="Profil neve"
                  className="flex-1 rounded-2xl border border-white/10 bg-zinc-950/50 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                />
                <button
                  type="button"
                  onClick={onCreate}
                  disabled={!name.trim()}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    name.trim()
                      ? "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                      : "border border-white/10 bg-white/5 text-white/30"
                  }`}
                >
                  Create
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-white/10" />
                <div className="text-[11px] tracking-widest text-white/35">OR</div>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={continueGuest}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs text-white/75 hover:bg-white/10 active:scale-[0.99]"
              >
                Continue as Guest
              </button>
            </div>

            <div className="mt-4 text-center text-[11px] text-white/35">Tip: külön profil a “cut” és a “bulk” időszakra.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
