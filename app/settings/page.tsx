"use client";

import * as React from "react";
import { BottomNav } from "@/components/BottomNav";
import { SyncStatusCard } from "@/components/SyncStatusCard";
import { MigrateLocalWorkoutsCard } from "@/components/MigrateLocalWorkoutsCard";
import { SignOutCard } from "@/components/SignOutCard";
import { ProfileMetaCard } from "@/components/ProfileMetaCard";
import { RestartOnboardingCard } from "@/components/RestartOnboardingCard";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28">
      <header className="mb-4">
        <div className="text-xs tracking-widest text-white/50">BEÁLL.</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Beállítások</h1>
        <div className="mt-1 text-xs text-white/50">Profil, szinkron, app információk.</div>
      </header>

      <section className="space-y-3">
        <ProfileMetaCard />
        <RestartOnboardingCard />

        <SyncStatusCard />
        <MigrateLocalWorkoutsCard />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">App</div>
          <div className="mt-2 text-xs text-white/60">
            Offline-first: a mentés lokálban mindig megtörténik, a felhő szinkron automatikusan próbálkozik.
          </div>
        </div>

        <SignOutCard />
      </section>

      <BottomNav />
    </main>
  );
}
