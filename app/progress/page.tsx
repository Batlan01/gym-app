"use client";

import * as React from "react";
import { BottomNav } from "@/components/BottomNav";
import { WorkoutDetailSheet } from "@/components/WorkoutDetailSheet";
import type { Workout } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import {
  workoutVolume,
  workoutSetCounts,
  workoutExerciseCount,
  formatDT,
  withinLastDays,
  topExercisesByVolume,
  formatK,
} from "@/lib/workoutMetrics";
import { LS_ACTIVE_PROFILE, GUEST_PROFILE_ID, profileKey } from "@/lib/profiles";

import { auth, db } from "@/lib/firebase";
import { subscribeWorkouts } from "@/lib/workoutsCloud";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function isCloudProfileId(profileId: string) {
  return profileId.startsWith("fb:");
}

function cloudUidFromProfileId(profileId: string) {
  return profileId.startsWith("fb:") ? profileId.slice(3).trim() : null;
}

export default function ProgressPage() {
  // aktív profil (local storage-ban tárolt)
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const profileId = activeProfileId ?? GUEST_PROFILE_ID;

  // profilhoz kötött history kulcs (LOCAL)
  const LS_HISTORY = React.useMemo(() => profileKey(profileId, "workouts"), [profileId]);
  const [localHistory, setLocalHistory] = useLocalStorageState<Workout[]>(LS_HISTORY, []);

  // CLOUD state
  const [cloudHistory, setCloudHistory] = React.useState<Workout[] | null>(null);
  const [cloudStatus, setCloudStatus] = React.useState<
    "idle" | "loading" | "ready" | "wrong-user"
  >("idle");

  // ha fb profil aktív: Firestore subscribe
  React.useEffect(() => {
    const isCloud = isCloudProfileId(profileId);
    if (!isCloud) {
      setCloudHistory(null);
      setCloudStatus("idle");
      return;
    }

    const cloudUid = cloudUidFromProfileId(profileId);
    const user = auth.currentUser;

    // nem vagy belépve / nem az a user
    if (!cloudUid || !user?.uid || user.uid !== cloudUid) {
      setCloudHistory(null);
      setCloudStatus("wrong-user");
      return;
    }

    setCloudStatus("loading");
    const unsub = subscribeWorkouts(user.uid, (items) => {
      setCloudHistory(items);
      setCloudStatus("ready");
    });

    return () => unsub?.();
  }, [profileId]);

  const usingCloud = isCloudProfileId(profileId) && cloudStatus === "ready";
  const history = usingCloud ? (cloudHistory ?? []) : localHistory;

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = React.useMemo(
    () => (selectedId ? history.find((w) => w.id === selectedId) ?? null : null),
    [history, selectedId]
  );

  const totalWorkouts = history.length;
  const last7 = history.filter((w) => withinLastDays(w, 7)).length;
  const totalVolume = history.reduce((a, w) => a + workoutVolume(w), 0);
  const top = React.useMemo(() => topExercisesByVolume(history, 5), [history]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const deleteWorkout = React.useCallback(async () => {
    if (!selectedId) return;
    const ok = window.confirm("Törlöd ezt az edzést?");
    if (!ok) return;

    // CLOUD törlés
    if (usingCloud) {
      const cloudUid = cloudUidFromProfileId(profileId);
      const user = auth.currentUser;
      if (!cloudUid || !user?.uid || user.uid !== cloudUid) {
        alert("Cloud user mismatch. Jelentkezz be újra.");
        return;
      }

      try {
        await deleteDoc(doc(db, "users", user.uid, "workouts", selectedId));
      } catch (e) {
        console.error(e);
        alert("Cloud törlés nem sikerült.");
        return;
      }
    } else {
      // LOCAL törlés
      setLocalHistory((prev) => prev.filter((w) => w.id !== selectedId));
    }

    setDetailOpen(false);
    setSelectedId(null);
  }, [selectedId, usingCloud, profileId, setLocalHistory]);

  const clearAll = React.useCallback(async () => {
    const ok = window.confirm("Minden edzést törölsz?");
    if (!ok) return;

    if (usingCloud) {
      const cloudUid = cloudUidFromProfileId(profileId);
      const user = auth.currentUser;
      if (!cloudUid || !user?.uid || user.uid !== cloudUid) {
        alert("Cloud user mismatch. Jelentkezz be újra.");
        return;
      }

      try {
        // batch delete az összes workout doc-ra
        const qy = query(
          collection(db, "users", user.uid, "workouts"),
          orderBy("startedAt", "desc")
        );
        const snap = await getDocs(qy);

        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        console.error(e);
        alert("Cloud clear nem sikerült.");
      }
    } else {
      setLocalHistory([]);
    }
  }, [usingCloud, profileId, setLocalHistory]);

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28">
      <header className="mb-4">
        <div className="text-xs tracking-widest text-white/50">PROGRESS</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Statisztika</h1>

        <div className="mt-1 text-xs text-white/40">
          Profil: <span className="text-white/60">{profileId}</span>
          {isCloudProfileId(profileId) ? (
            <span className="ml-2 text-white/40">
              · Cloud:{" "}
              {cloudStatus === "ready"
                ? "OK"
                : cloudStatus === "loading"
                ? "Loading…"
                : cloudStatus === "wrong-user"
                ? "Nincs auth / másik user"
                : "—"}
            </span>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <StatPill label="Összes" value={`${totalWorkouts}`} />
        <StatPill label="7 nap" value={`${last7}`} />
        <StatPill label="Volume" value={formatK(totalVolume)} />
      </section>

      {top.length > 0 ? (
        <section className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">Top gyakorlatok (volume)</div>
          <div className="mt-2 space-y-2">
            {top.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-3">
                <div className="text-sm text-white/85">{t.name}</div>
                <div className="text-sm text-white/60">{formatK(t.volume)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <header className="mt-5 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Edzések</h2>

        {history.length > 0 ? (
          <button
            onClick={clearAll}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </header>

      <section className="space-y-3">
        {isCloudProfileId(profileId) && cloudStatus === "wrong-user" ? (
          <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-5 text-sm text-red-200">
            Cloud profil aktív, de nem ugyanazzal a Google/Firebase fiókkal vagy belépve.
            Lépj be újra ezzel az accounttal: <b>{cloudUidFromProfileId(profileId)}</b>
          </div>
        ) : cloudStatus === "loading" ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Cloud adatok betöltése…
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Még nincs mentett edzés.
          </div>
        ) : (
          history.map((w) => {
            const counts = workoutSetCounts(w);
            const vol = workoutVolume(w);
            const exCount = workoutExerciseCount(w);
            const time = formatDT(w.startedAt);

            return (
              <button
                key={w.id}
                onClick={() => openDetail(w.id)}
                className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{time}</div>
                  <div className="text-xs text-white/50">{formatK(vol)} vol</div>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                    {exCount} ex
                  </span>
                  <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                    {counts.done}/{counts.total} sets
                  </span>
                </div>
              </button>
            );
          })
        )}
      </section>

      <WorkoutDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        workout={selected}
        onDelete={deleteWorkout}
      />

      <BottomNav />
    </main>
  );
}
