"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BootScreen } from "@/components/BootScreen";
import { lsGet } from "@/lib/storage";
import {
  LS_ACTIVE_PROFILE, LS_PROFILES, isCloudProfileId,
  cloudUidFromProfileId, onboardedKey, fbProfileId, type Profile,
} from "@/lib/profiles";

const LS_AUTH_MODE = "gym.authMode";

function ensureFirebaseProfile(prev: Profile[], uid: string, displayName?: string | null, email?: string | null): Profile[] {
  const id = fbProfileId(uid);
  if (prev.some(p => p.id === id)) return prev;
  return [{ id, name: displayName || email || "Account", createdAt: new Date().toISOString() }, ...prev];
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);
  const [minBootDone, setMinBootDone] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setMinBootDone(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      const isLogin = pathname === "/login";
      const isOnboarding = pathname === "/onboarding";

      // ── 1) Redirect result kezelése (Safari fallback esetén) ─────────────
      try {
        const cred = await getRedirectResult(auth);
        if (cred?.user && !cancelled) {
          const u = cred.user;
          const id = fbProfileId(u.uid);
          const existingProfiles: Profile[] = JSON.parse(localStorage.getItem(LS_PROFILES) ?? "[]");
          const updated = ensureFirebaseProfile(existingProfiles, u.uid, u.displayName, u.email);
          localStorage.setItem(LS_PROFILES, JSON.stringify(updated));
          localStorage.setItem(LS_AUTH_MODE, JSON.stringify("firebase"));
          localStorage.setItem(LS_ACTIVE_PROFILE, JSON.stringify(id));
          localStorage.setItem(onboardedKey(id), JSON.stringify(true));
          if (!cancelled) { setReady(true); window.location.href = "/workout"; }
          return;
        }
      } catch (e: any) {
        if (e?.code && e.code !== "auth/no-auth-event") {
          console.warn("getRedirectResult:", e.code);
        }
      }

      // ── 2) Firebase auth state ────────────────────────────────────────────
      const firebaseUser = await new Promise<any>((resolve) => {
        const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u); });
        setTimeout(() => resolve(null), 5000);
      });

      if (cancelled) return;

      const activeProfileId = lsGet<string | null>(LS_ACTIVE_PROFILE, null);

      if (!activeProfileId) {
        setReady(true);
        if (!isLogin) router.replace("/login");
        return;
      }

      if (isCloudProfileId(activeProfileId)) {
        const expectedUid = cloudUidFromProfileId(activeProfileId);
        if (!firebaseUser || firebaseUser.uid !== expectedUid) {
          localStorage.removeItem(LS_ACTIVE_PROFILE);
          setReady(true);
          router.replace("/login");
          return;
        }
      }

      const onboarded = lsGet<boolean | null>(onboardedKey(activeProfileId), null);
      if (onboarded !== true) {
        setReady(true);
        if (!isOnboarding) router.replace("/onboarding");
        return;
      }

      setReady(true);
      if (isLogin || isOnboarding) router.replace("/workout");
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const showBoot = !ready || !minBootDone;
  return showBoot
    ? <BootScreen subtitle="Connecting your account…" />
    : <div className="min-h-dvh text-white" style={{backgroundColor:"var(--bg-base)",color:"var(--text-primary)"}}>{children}</div>;
}
