"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import {
  LS_ACTIVE_PROFILE,
  isCloudProfileId,
  cloudUidFromProfileId,
  onboardedKey,
} from "@/lib/profiles";
import { lsSet } from "@/lib/storage";
import { BootScreen } from "@/components/BootScreen";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeProfileId, , activeHydrated] =
    useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const onboardedStorageKey = activeProfileId
    ? onboardedKey(activeProfileId)
    : "gym.__noop_onboarded__";

  const [onboarded, , onboardedHydrated] =
    useLocalStorageState<boolean | null>(onboardedStorageKey, null);

  const [authUid, setAuthUid] = React.useState<string | null>(null);
  const [authReady, setAuthReady] = React.useState(false);

  // Minimum boot idő
  const [minBootDone, setMinBootDone] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setMinBootDone(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  // Firebase auth state — emelt timeout redirect után
  React.useEffect(() => {
    // 8 másodperc: Google redirect után a getRedirectResult is kell idő
    const timeout = window.setTimeout(() => {
      setAuthReady(true);
    }, 8000);

    const unsub = onAuthStateChanged(auth, (u) => {
      window.clearTimeout(timeout);
      setAuthUid(u?.uid ?? null);
      setAuthReady(true);
    });

    return () => {
      window.clearTimeout(timeout);
      unsub();
    };
  }, []);

  const needsAuth = !!(activeProfileId && isCloudProfileId(activeProfileId));
  const appReady = activeHydrated && onboardedHydrated && (!needsAuth || authReady);

  React.useEffect(() => {
    if (!appReady) return;

    const isLogin = pathname === "/login";
    const isOnboarding = pathname === "/onboarding";

    // 1) nincs profil → login
    if (!activeProfileId) {
      if (!isLogin) router.replace("/login");
      return;
    }

    // 2) cloud profil → auth egyezés kell
    if (isCloudProfileId(activeProfileId)) {
      const expected = cloudUidFromProfileId(activeProfileId);
      if (!authUid || authUid !== expected) {
        // Ne tegyünk semmit amíg az auth nem ready — ne töröljük a profilt
        if (!authReady) return;
        // Auth ready de nem egyezik → valóban nem bejelentkezve
        lsSet(LS_ACTIVE_PROFILE, null);
        router.replace("/login");
        return;
      }
    }

    // 3) onboarding
    if (onboarded !== true) {
      if (!isOnboarding) router.replace("/onboarding");
      return;
    }

    // 4) ha minden kész, ne maradjon login/onboarding oldalon
    if (isLogin || isOnboarding) {
      router.replace("/workout");
    }
  }, [appReady, pathname, router, activeProfileId, authUid, authReady, onboarded]);

  const showBoot = !appReady || !minBootDone;

  return showBoot ? (
    <BootScreen
      subtitle={
        !activeHydrated
          ? "Loading local data…"
          : needsAuth && !authReady
          ? "Connecting your account…"
          : "Preparing your session…"
      }
    />
  ) : (
    <div className="min-h-dvh bg-black text-white">{children}</div>
  );
}
