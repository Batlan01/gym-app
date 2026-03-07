// components/MigrateLocalWorkoutsCard.tsx
"use client";

import * as React from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsSubscribe } from "@/lib/storage";
import { LS_ACTIVE_PROFILE, isCloudProfileId } from "@/lib/profiles";

// ⚠️ ide azt importáld, ahol nálad van
// (a te második snippet-edben már van getLocalWorkoutsStats + migrate...)
// pl: import { getLocalWorkoutsStats, migrateAllLocalWorkoutsToCloud } from "@/lib/migrateLocalWorkouts";
import { getLocalWorkoutsStats, migrateAllLocalWorkoutsToCloud } from "@/lib/migrateLocalWorkouts";

type Stats = {
  total: number;
  perProfileCounts: Record<string, number>;
  localIds: string[];
};

const EMPTY_STATS: Stats = { total: 0, perProfileCounts: {}, localIds: [] };

export function MigrateLocalWorkoutsCard() {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  // ✅ hydration-safe: első render mindig ugyanaz (0)
  const [stats, setStats] = React.useState<Stats>(EMPTY_STATS);
  const [mounted, setMounted] = React.useState(false);

  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

  const readStats = React.useCallback(() => {
    // csak kliensen
    setStats(getLocalWorkoutsStats());
  }, []);

  // mount után olvassuk be + subscribe
  React.useEffect(() => {
    if (!mounted) return;

    readStats();

    // ha a storage változik, újraszámoljuk
    const unsub = lsSubscribe(() => readStats());
    return () => unsub();
  }, [mounted, readStats]);

  const isCloud = !!activeProfileId && isCloudProfileId(activeProfileId);

  const onMigrateAll = React.useCallback(async () => {
    if (!isCloud || !activeProfileId) return;

    setBusy(true);
    setMsg(null);
    try {
      // uid = fb:UID -> UID
      const uid = activeProfileId.slice(3).trim();

      const res = await migrateAllLocalWorkoutsToCloud(uid, { clearLocal: false });
      setMsg(`Feltöltve: ${res.uploaded} edzés. (Lokál törlés: ${res.clearLocal ? "igen" : "nem"})`);

      // frissítés
      readStats();
    } catch (e: any) {
      setMsg(e?.message ?? "Hiba a migrálásnál.");
    } finally {
      setBusy(false);
    }
  }, [activeProfileId, isCloud, readStats]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Lokál edzések → Cloud</div>
          <div className="mt-1 text-xs text-white/55">
            Ez csak akkor hasznos, ha Cloud (Google / email) fiókkal vagy belépve.
          </div>
        </div>

        <div className="text-right text-xs text-white/60">
          <div>
            Talált: <span className="text-white/85">{stats.total}</span>
          </div>
          <div>
            Cloud: <span className="text-white/85">{isCloud ? "igen" : "nem"}</span>
          </div>
        </div>
      </div>

      {!mounted ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
          Betöltés…
        </div>
      ) : (
        <>
          {isCloud ? (
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={onMigrateAll}
                disabled={busy || stats.total === 0}
                className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-40"
              >
                Összes lokál edzés feltöltése
              </button>

              <div className="text-[11px] text-white/45">
                Tipp: első körben <b>ne</b> töröld a lokált, csak tölts fel. Ha már biztos oké, később lehet clean-up.
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
              Cloud feltöltéshez jelentkezz be fiókkal (Google / email).
            </div>
          )}

          {msg ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/75">
              {msg}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
