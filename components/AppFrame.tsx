"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BootScreen } from "@/components/BootScreen";
import { lsGet } from "@/lib/storage";
import { LS_ACTIVE_PROFILE, isCloudProfileId, cloudUidFromProfileId, onboardedKey } from "@/lib/profiles";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = React.useState(false);
  const [minBootDone, setMinBootDone] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setMinBootDone(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  // Egyszer fut le oldalbetöltéskor — megvárja a Firebase auth-ot majd dönt
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      unsub(); // csak egyszer kell az initial state

      const activeProfileId = lsGet<string | null>(LS_ACTIVE_PROFILE, null);
      const isLogin = pathname === "/login";
      const isOnboarding = pathname === "/onboarding";

      // 1) Nincs aktív profil → login
      if (!activeProfileId) {
        setReady(true);
        if (!isLogin) router.replace("/login");
        return;
      }

      // 2) Cloud profil → Firebase auth kell
      if (isCloudProfileId(activeProfileId)) {
        const expectedUid = cloudUidFromProfileId(activeProfileId);
        if (!firebaseUser || firebaseUser.uid !== expectedUid) {
          // Auth nem egyezik → töröljük a profilt és loginra
          localStorage.removeItem(LS_ACTIVE_PROFILE);
          setReady(true);
          router.replace("/login");
          return;
        }
      }

      // 3) Onboarding kell-e?
      const onboarded = lsGet<boolean | null>(onboardedKey(activeProfileId), null);
      if (onboarded !== true) {
        setReady(true);
        if (!isOnboarding) router.replace("/onboarding");
        return;
      }

      // 4) Minden OK — ha login/onboarding oldalon van, tovább
      setReady(true);
      if (isLogin || isOnboarding) {
        router.replace("/workout");
      }
    });

    // Max 6mp timeout ha a Firebase nem válaszol (pl. offline)
    const timeout = window.setTimeout(() => {
      unsub();
      const activeProfileId = lsGet<string | null>(LS_ACTIVE_PROFILE, null);
      setReady(true);
      if (!activeProfileId && pathname !== "/login") {
        router.replace("/login");
      }
    }, 6000);

    return () => {
      unsub();
      window.clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const showBoot = !ready || !minBootDone;

  return showBoot ? (
    <BootScreen subtitle="Connecting your account…" />
  ) : (
    <div className="min-h-dvh bg-black text-white">{children}</div>
  );
}
