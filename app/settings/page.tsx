"use client";

import * as React from "react";
import { BottomNav } from "@/components/BottomNav";
import { lsSet } from "@/lib/storage";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const logout = React.useCallback(() => {
    // aktív profil törlése -> ProfileGate újra megjelenik
    lsSet(LS_ACTIVE_PROFILE, null);

    // vissza a workout-ra (vagy "/" ha azt akarod)
    router.replace("/login");

    router.refresh();
  }, [router]);

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28">
      <h1 className="text-2xl font-bold text-white">Beállítások</h1>
      <p className="mt-2 text-sm text-white/60">Később: export/import, units, stb.</p>

      {/* spacer hogy tényleg legalul legyen */}
      <div className="mt-10">
        <button
          onClick={() => {
            const ok = window.confirm("Biztosan kijelentkezel a profilból?");
            if (ok) logout();
          }}
          className="w-full rounded-2xl border border-red-500/30 bg-red-500/15 py-4 text-sm font-semibold text-red-200 hover:bg-red-500/20 active:scale-[0.99]"
        >
          Kijelentkezés
        </button>

        <p className="mt-3 text-center text-[11px] text-white/35">
          Ez csak profilt vált: a telefonon tárolt adatok nem törlődnek.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
