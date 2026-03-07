// src/components/AppFrame.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE, onboardedKey, GUEST_PROFILE_ID, isCloudProfileId } from "@/lib/profiles";

function cloudUidFromProfileId(pid: string) {
  return pid.slice(3).trim();
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeProfileId, , activeHydrated] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const profileId = activeProfileId;

  const [onboardedRaw, , onboardedHydrated] = useLocalStorageState<boolean>(
    profileId ? onboardedKey(profileId) : "__noop_onboarded__",
    false
  );
  const onboarded = profileId === GUEST_PROFILE_ID ? true : onboardedRaw === true;

  // auth state (csak cloud profil esetén számít majd)
  const [authUid, setAuthUid] = React.useState<string | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUid(u?.uid ?? null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // pingpong-ellen: ugyanarra ne redirecteljünk újra és újra
  const lastNav = React.useRef<string | null>(null);
  const nav = React.useCallback(
    (to: string) => {
      if (lastNav.current === to) return;
      lastNav.current = to;
      router.replace(to);
    },
    [router]
  );

  React.useEffect(() => {
    // ✅ várjuk meg a localStorage hidrálást
    if (!activeHydrated) return;
    if (profileId && !onboardedHydrated) return;

    // login oldalt nem tiltjuk (profilváltás miatt is hasznos)
    if (pathname === "/login") return;

    // nincs aktív profil → login
    if (!profileId) {
      nav("/login");
      return;
    }

    // cloud profil → auth ellenőrzés (ha később újra bekapcsolod)
    if (isCloudProfileId(profileId)) {
      if (authLoading) return;
      const expected = cloudUidFromProfileId(profileId);
      if (!authUid || authUid !== expected) {
        nav("/login");
        return;
      }
    }

    // onboarding gate
    if (!onboarded && pathname !== "/onboarding") {
      nav("/onboarding");
      return;
    }

    // ha már onboarded, ne ragadjunk onboardingon
    if (onboarded && pathname === "/onboarding") {
      nav("/workout");
      return;
    }
  }, [
    pathname,
    activeHydrated,
    onboardedHydrated,
    profileId,
    onboarded,
    authLoading,
    authUid,
    nav,
  ]);

  // ha sikeres navigáció volt, path változáskor nullázzuk a lastNav-ot
  React.useEffect(() => {
    lastNav.current = null;
  }, [pathname]);

  return <div className="min-h-dvh bg-black text-white">{children}</div>;
}
