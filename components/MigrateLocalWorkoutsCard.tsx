"use client";

import * as React from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { getLocalWorkoutsStats, migrateAllLocalWorkoutsToCloud } from "@/lib/migrateLocalWorkouts";

function isCloudProfileId(profileId: string | null | undefined, uid: string | null | undefined) {
  if (!profileId || !uid) return false;
  return profileId === `fb:${uid}`;
}

type Toast = null | { tone: "ok" | "warn"; title: string; body?: string };

export function MigrateLocalWorkoutsCard() {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  const [user, setUser] = React.useState<User | null>(null);
  React.useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  const cloudOk = isCloudProfileId(activeProfileId, user?.uid);

  const [stats, setStats] = React.useState(() => getLocalWorkoutsStats());
  const [clearLocal, setClearLocal] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<Toast>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  // refresheljük ha visszajön a tab / net
  React.useEffect(() => {
    const refresh = () => setStats(getLocalWorkoutsStats());

    const onVis = () => document.visibilityState === "visible" && refresh();
    const onOnline = () => refresh();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);

    refresh();

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const canMigrate = cloudOk && !!user && stats.total > 0;

  const run = async () => {
    if (!user) return;
    if (!cloudOk) {
      setToast({ tone: "warn", title: "Cloud profil nem aktív", body: "Válts fb:<uid> profilra a migráláshoz." });
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setToast({ tone: "warn", title: "Offline", body: "Kapcsold vissza a netet a migráláshoz." });
      return;
    }

    const ok = window.confirm(
      `Feltöltöm a lokális edzéseket a felhőbe?\n\nTalált edzések: ${stats.total}\n` +
        (clearLocal ? "\nImport után törlöm lokálból (backup készül)." : "")
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await migrateAllLocalWorkoutsToCloud(user.uid, { clearLocal });
      setToast({
        tone: "ok",
        title: "Migrálás kész",
        body: `Feltöltve: ${res.uploaded} edzés` + (clearLocal ? " (lokál törölve, backup mentve)" : ""),
      });
      setStats(getLocalWorkoutsStats());
    } catch (e) {
      console.error(e);
      setToast({
        tone: "warn",
        title: "Migrálás hiba",
        body: "Valami nem oké a feltöltésnél. Nézd meg a konzolt / Firestore jogosultságokat.",
      });
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Lokál edzések importálása</div>
            <div className="mt-1 text-xs text-white/60">
              Guest + lokál profil edzések → Cloud. (Dedupe + backup)
            </div>
          </div>

          <div className="text-right text-xs text-white/60">
            <div>
              Talált: <span className="text-white/85">{stats.total}</span>
            </div>
            <div>
              Cloud:{" "}
              <span className={cloudOk ? "text-emerald-300" : "text-amber-300"}>
                {cloudOk ? "OK" : "Nincs aktív"}
              </span>
            </div>
          </div>
        </div>

        <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-xs text-white/75">Import után törlés lokálból (backup marad)</span>
          <input
            type="checkbox"
            checked={clearLocal}
            onChange={(e) => setClearLocal(e.target.checked)}
            className="h-4 w-4 accent-emerald-400"
          />
        </label>

        <div className="mt-3 flex gap-2">
          <button
            onClick={run}
            disabled={!canMigrate || busy}
            className={`flex-1 rounded-2xl px-3 py-2 text-sm ${
              canMigrate && !busy
                ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                : "border border-white/10 bg-white/5 text-white/30"
            }`}
          >
            {busy ? "Import..." : "Import lokál → Cloud"}
          </button>

          <button
            onClick={() => setStats(getLocalWorkoutsStats())}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {stats.total > 0 ? (
          <div className="mt-3 text-xs text-white/45">
            Tipp: első import után a felhő szinkron “lehúzza” mindenhol a listát.
          </div>
        ) : (
          <div className="mt-3 text-xs text-white/45">Nincs mit importálni.</div>
        )}
      </section>
    </>
  );
}
