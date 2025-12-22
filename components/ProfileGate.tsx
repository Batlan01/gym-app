"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { uid, lsSet } from "@/lib/storage";
import type { Profile } from "@/lib/profiles";
import { GUEST_PROFILE_ID, LS_ACTIVE_PROFILE, LS_PROFILES } from "@/lib/profiles";
import { GymBackdrop } from "@/components/GymBackdrop";

function createProfileObj(name: string): Profile {
  return {
    id: uid(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
}

function ensureGuest(profiles: Profile[]): Profile[] {
  if (profiles.some((p) => p.id === GUEST_PROFILE_ID)) return profiles;
  return [
    {
      id: GUEST_PROFILE_ID,
      name: "Guest",
      createdAt: new Date().toISOString(),
    },
    ...profiles,
  ];
}

function deleteProfileData(profileId: string) {
  // Profilhoz tartozó localStorage kulcsok törlése: gym.<id>.*
  try {
    const prefix = `gym.${profileId}.`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [profiles, setProfiles] = useLocalStorageState<Profile[]>(LS_PROFILES, []);
  const [activeProfileId, setActiveProfileId] = useLocalStorageState<string | null>(
    LS_ACTIVE_PROFILE,
    null
  );

  const [name, setName] = React.useState("");
  const [open, setOpen] = React.useState(false);

  // init: legyen guest, és ha nincs aktív profil, nyissunk gate-et
  React.useEffect(() => {
    setProfiles((prev) => ensureGuest(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const hasActive = !!activeProfileId;
    setOpen(!hasActive);
  }, [activeProfileId]);

  const goAfterLogin = React.useCallback(() => {
    router.replace("/workout");
    router.refresh();
  }, [router]);

  const selectProfile = React.useCallback(
    (id: string) => {
      setActiveProfileId(id);
      lsSet(LS_ACTIVE_PROFILE, id);
      setOpen(false);
      goAfterLogin();
    },
    [setActiveProfileId, goAfterLogin]
  );

  const onCreate = React.useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const p = createProfileObj(trimmed);

    setProfiles((prev) => {
      const safe = ensureGuest(prev).filter((x) => x.id !== p.id);
      return [p, ...safe];
    });

    setActiveProfileId(p.id);
    lsSet(LS_ACTIVE_PROFILE, p.id);

    setName("");
    setOpen(false);
    goAfterLogin();
  }, [name, setProfiles, setActiveProfileId, goAfterLogin]);

  const continueGuest = React.useCallback(() => {
    setProfiles((prev) => ensureGuest(prev));
    setActiveProfileId(GUEST_PROFILE_ID);
    lsSet(LS_ACTIVE_PROFILE, GUEST_PROFILE_ID);
    setOpen(false);
    goAfterLogin();
  }, [setProfiles, setActiveProfileId, goAfterLogin]);

  const removeProfile = React.useCallback(
    (id: string) => {
      if (id === GUEST_PROFILE_ID) return;

      const p = profiles.find((x) => x.id === id);
      const ok = window.confirm(`Törlöd ezt a profilt?\n\n${p?.name ?? id}\n\n(Minden adata törlődik.)`);
      if (!ok) return;

      // töröljük a profilhoz tartozó tárolt adatokat
      deleteProfileData(id);

      // listából törlés
      setProfiles((prev) => ensureGuest(prev).filter((x) => x.id !== id));

      // ha épp ez volt aktív, léptessük vissza gate-re
      if (activeProfileId === id) {
        setActiveProfileId(null);
        lsSet(LS_ACTIVE_PROFILE, null);
        setOpen(true);
      }
    },
    [profiles, setProfiles, activeProfileId, setActiveProfileId]
  );

  if (!open) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[90]">
      <GymBackdrop />

      {/* dim + focus (kicsit áttetszőbb, hogy több látszódjon a képből) */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

      <div className="relative mx-auto w-full max-w-md px-4 pt-16 pb-10">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* top glow (nem zöld!) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(520px_140px_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />

          <div className="relative p-6">
            <div className="text-[11px] tracking-[0.35em] text-white/55">PROFILE</div>
            <div className="mt-2 text-2xl font-semibold text-white">Válassz vagy hozz létre</div>
            <div className="mt-1 text-sm text-white/55">
              Minden edzés, kedvenc és beállítás a profilodhoz kerül.
            </div>

            {/* meglévők */}
            <div className="mt-5 space-y-2">
              {profiles
                .slice()
                .sort((a, b) => {
                  if (a.id === GUEST_PROFILE_ID) return 1;
                  if (b.id === GUEST_PROFILE_ID) return -1;
                  return b.createdAt.localeCompare(a.createdAt);
                })
                .map((p) => (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectProfile(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") selectProfile(p.id);
                    }}
                    className="group w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white/90">{p.name}</div>
                        <div className="mt-1 text-[11px] text-white/40 group-hover:text-white/50">
                          Tap to continue
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.id === GUEST_PROFILE_ID ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
                            Guest
                          </span>
                        ) : (
                          <button
                            type="button"
                            aria-label="Profil törlése"
                            title="Törlés"
                            onClick={(e) => {
                              e.stopPropagation(); // NE válassza ki, csak töröljön
                              removeProfile(p.id);
                            }}
                            className="grid h-10 w-10 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15 active:scale-[0.98]"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* create */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/55">Új profil</div>

              <div className="mt-2 flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onCreate();
                  }}
                  placeholder="Profil neve"
                  className="flex-1 rounded-2xl border border-white/10 bg-zinc-950/50 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                />

                <button
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
                onClick={continueGuest}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs text-white/75 hover:bg-white/10 active:scale-[0.99]"
              >
                Continue as Guest
              </button>
            </div>

            <div className="mt-4 text-center text-[11px] text-white/35">
              Tip: külön profil a “cut” és a “bulk” időszakra.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
