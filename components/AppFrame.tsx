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

  // minimum boot idő (ne villogjon)
  const [minBootDone, setMinBootDone] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setMinBootDone(true), 5250);
    return () => window.clearTimeout(t);
  }, []);

  // firebase auth state
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const needsAuth = !!(activeProfileId && isCloudProfileId(activeProfileId));

  // app “döntéshez” szükséges state-ek készen vannak-e
  const appReady =
    activeHydrated && onboardedHydrated && (!needsAuth || authReady);

  // Redirect logika: mindig deklarált useEffect (NEM lehet feltételes!)
  React.useEffect(() => {
    if (!appReady) return;

    const isLogin = pathname === "/login";
    const isOnboarding = pathname === "/onboarding";

    // 1) nincs profil -> csak loginon maradhat
    if (!activeProfileId) {
      if (!isLogin) router.replace("/login");
      return;
    }

    // 2) cloud profil -> auth egyezés kell
    if (isCloudProfileId(activeProfileId)) {
      const expected = cloudUidFromProfileId(activeProfileId);
      if (!authUid || authUid !== expected) {
        // töröljük az aktív profilt, különben loopolhat
        lsSet(LS_ACTIVE_PROFILE, null);
        router.replace("/login");
        return;
      }
    }

    // 3) onboarding döntés
    const needsOnboarding = onboarded !== true;

    if (needsOnboarding) {
      if (!isOnboarding) router.replace("/onboarding");
      return;
    }

    // 4) ha kész az onboarding, ne maradjon login/onboarding alatt
    if (isLogin || isOnboarding) {
      router.replace("/workout");
    }
  }, [appReady, pathname, router, activeProfileId, authUid, onboarded]);

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
