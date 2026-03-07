"use client";

import * as React from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { lsSet } from "@/lib/storage";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { useRouter } from "next/navigation";

type Toast = null | { tone: "ok" | "warn"; title: string; body?: string };

export function SignOutCard() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<Toast>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const onExitToLogin = async () => {
    const ok = window.confirm("Biztosan kilépsz a profilból / fiókból?");
    if (!ok) return;

    setBusy(true);
    try {
      // ha van auth user -> kijelentkeztetjük
      if (auth.currentUser) {
        await signOut(auth);
      }

      // mindenképp: nincs aktív profil -> /login
      lsSet(LS_ACTIVE_PROFILE, null);

      setToast({ tone: "ok", title: "Kész", body: "Válassz profilt vagy jelentkezz be." });
      router.replace("/login");
    } catch (e) {
      console.error(e);
      setToast({ tone: "warn", title: "Nem sikerült", body: "Nézd meg a konzolt." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {toast ? (
        <div className="fixed left-0 right-0 bottom-24 z-50 mx-auto max-w-md px-4">
          <div
            className={`rounded-2xl border p-4 backdrop-blur ${
              toast.tone === "ok"
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
                : "border-amber-500/30 bg-amber-500/15 text-amber-100"
            }`}
          >
            <div className="text-sm font-semibold">{toast.title}</div>
            {toast.body ? <div className="mt-1 text-xs opacity-90">{toast.body}</div> : null}
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white">Fiók / Profil</div>
        <div className="mt-1 text-xs text-white/60">
          Itt tudsz profilt váltani vagy kijelentkezni a fiókból. A lokális adatok megmaradnak.
        </div>

        <button
          onClick={onExitToLogin}
          disabled={busy}
          className={`mt-4 w-full rounded-2xl px-3 py-2 text-sm ${
            busy
              ? "border border-white/10 bg-white/5 text-white/30"
              : "border border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/15"
          }`}
        >
          {busy ? "Kilépek..." : auth.currentUser ? "Kijelentkezés" : "Profil váltás"}
        </button>
      </section>
    </>
  );
}
