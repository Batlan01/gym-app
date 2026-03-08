"use client";

import * as React from "react";
import { BottomNav } from "@/components/BottomNav";
import { AddExerciseSheet } from "@/components/AddExerciseSheet";
import { ExerciseCard } from "@/components/ExerciseCard";
import { SetEditSheet } from "@/components/SetEditSheet";
import { RestTimerOverlay } from "@/components/RestTimerOverlay";
import { AchievementToast } from "@/components/AchievementToast";

import { EXERCISES } from "@/lib/exercises";
import { readCustomExercises, saveCustomExercise, deleteCustomExercise } from "@/lib/customExercises";
import type { CustomExercise } from "@/lib/customExercises";
import { readPrograms } from "@/lib/programsStorage";
import type { Workout, WorkoutExercise, SetEntry } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsSet, lsGet, uid } from "@/lib/storage";
import {
  formatLastSummary, newExercise, newSet, newWorkout,
  normalizeWorkoutForSave, isSetFilled,
} from "@/lib/workoutHelpers";
import {
  ACHIEVEMENTS, calcXP, checkNewAchievements, type UnlockedAchievement,
} from "@/lib/achievements";
import {
  LS_NOTIF_SETTINGS, DEFAULT_NOTIF_SETTINGS, type NotifSettings,
  schedulePostWorkoutNotif, checkAndSendStreakBreakNotif, scheduleCalendarReminder,
} from "@/lib/notifications";
import { profileKey } from "@/lib/profiles";

import { auth } from "@/lib/firebase";
import { saveWorkoutToCloud } from "@/lib/workoutsCloud";
import { enqueueWorkout, pendingCount } from "@/lib/pendingSync";

const LS_ACTIVE_PROFILE = "gym.activeProfileId";

// Napi edzés program meghatározása a naptárból
function todayDayIdx() { return (new Date().getDay() + 6) % 7; }

function encodePinnedEntry(slotId: string, sessionId: string, programId: string) {
  return `${slotId}:${sessionId}:${programId}`;
}
function decodePinnedEntry(entry: string) {
  const parts = entry.split(":");
  if (parts.length < 3) return null;
  const [slotId, sessionId, ...rest] = parts;
  return { slotId, sessionId, programId: rest.join(":") };
}

type TodaySession = { slotId: string; sessionName: string; exercises: string[]; };

function getTodaySessions(profileId: string): TodaySession[] {
  const programs = readPrograms(profileId);
  const dayIdx = todayDayIdx();
  const results: TodaySession[] = [];

  for (const prog of programs) {
    const pinned = prog.schedule?.pinnedDays ?? {};
    const entries = pinned[String(dayIdx)];
    if (!entries) continue;
    const arr: string[] = Array.isArray(entries) ? entries : [entries];
    for (const entry of arr) {
      const d = decodePinnedEntry(entry);
      if (!d) continue;
      const sess = prog.sessions.find(s => s.id === d.sessionId);
      if (!sess) continue;
      results.push({
        slotId: d.slotId,
        sessionName: sess.name,
        exercises: sess.blocks.map(b => b.name),
      });
    }
  }
  return results;
}

type Settings = {
  restSec: number;
  autoRest: boolean;
  muted: boolean;
};

function nowISO() {
  return new Date().toISOString();
}

function clampHistory(list: Workout[], max = 200) {
  return list.slice(0, max);
}

function msToClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function findLastExerciseInHistory(history: Workout[], exerciseId: string): WorkoutExercise | null {
  for (const w of history) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex) return ex;
  }
  return null;
}

// fb:<uid> -> uid
function cloudUidFromProfileId(profileId: string | null | undefined): string | null {
  if (!profileId) return null;
  if (!profileId.startsWith("fb:")) return null;
  const uid = profileId.slice(3).trim();
  return uid.length ? uid : null;
}

type Toast = null | {
  tone: "ok" | "warn";
  title: string;
  body?: string;
};

export default function WorkoutPage() {
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const profileId = activeProfileId ?? "guest";

  const LS_ACTIVE = `gym.${profileId}.activeWorkout`;
  const LS_HISTORY = `gym.${profileId}.workouts`;
  const LS_RECENTS = `gym.${profileId}.recents`;
  const LS_FAVORITES = `gym.${profileId}.favorites`;
  const LS_SETTINGS = `gym.${profileId}.settings`;

  const [active, setActive] = useLocalStorageState<Workout | null>(LS_ACTIVE, null);
  const [history, setHistory] = useLocalStorageState<Workout[]>(LS_HISTORY, []);
  const [recents, setRecents] = useLocalStorageState<string[]>(LS_RECENTS, []);
  const [favorites, setFavorites] = useLocalStorageState<string[]>(LS_FAVORITES, []);

  const [settings, setSettings] = useLocalStorageState<Settings>(LS_SETTINGS, {
    restSec: 90,
    autoRest: true,
    muted: false,
  });

  const [addOpen, setAddOpen] = React.useState(false);

  // Custom exercises
  const [customExercises, setCustomExercises] = React.useState<CustomExercise[]>([]);
  React.useEffect(() => { setCustomExercises(readCustomExercises(profileId)); }, [profileId]);

  // Mai napi program a naptárból
  const todaySessions = React.useMemo(() => getTodaySessions(profileId), [profileId]);
  const allExercises = React.useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editExerciseId, setEditExerciseId] = React.useState<string | null>(null);
  const [editSetId, setEditSetId] = React.useState<string | null>(null);

  // ===== Toast (lokál / cloud / queue infó) =====
  const [toast, setToast] = React.useState<Toast>(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ===== Achievement toast =====
  const [newAchievements, setNewAchievements] = React.useState<UnlockedAchievement[]>([]);

  // Streak break check + calendar reminder induláskor
  React.useEffect(() => {
    const notifSettings = lsGet<NotifSettings>(LS_NOTIF_SETTINGS, DEFAULT_NOTIF_SETTINGS);
    if (history.length > 0) {
      checkAndSendStreakBreakNotif(history[0].startedAt, notifSettings);
    }
    // Calendar-alapú emlékeztető
    scheduleCalendarReminder(todaySessions.length, notifSettings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Pending badge (pro feeling) =====
  const [pendingN, setPendingN] = React.useState(0);
  React.useEffect(() => {
    const cloudUid = cloudUidFromProfileId(activeProfileId);
    const user = auth.currentUser;
    const ok = !!cloudUid && user?.uid === cloudUid;
    if (!ok || !user) {
      setPendingN(0);
      return;
    }

    const refresh = () => setPendingN(pendingCount(user.uid));
    refresh();

    const t = window.setInterval(refresh, 1500);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [activeProfileId]);

  // timer tick
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [active]);

  const elapsed = React.useMemo(() => {
    if (!active) return "0:00";
    const ms = Date.now() - new Date(active.startedAt).getTime();
    return msToClock(ms);
  }, [active, tick]);

  const startWorkout = React.useCallback(() => {
    setActive((prev) => {
      if (prev) return prev;
      const base = newWorkout();
      // Ha van mai naptári program, betöltjük az összes sessiont
      if (todaySessions.length > 0) {
        const exercises = todaySessions.flatMap(sess =>
          sess.exercises.map(exName => {
            const found = allExercises.find(e => e.name === exName);
            const id = found?.id ?? `custom_${exName.replace(/\s+/g, "_").toLowerCase()}`;
            return newExercise(id, exName);
          })
        );
        return { ...base, exercises };
      }
      return base;
    });
  }, [setActive, todaySessions, allExercises]);

  const discardWorkout = React.useCallback(() => {
    if (!active) return;
    const ok = window.confirm("Eldobod az aktuális edzést?");
    if (!ok) return;
    lsSet(LS_ACTIVE, null);
    setActive(null);
  }, [active, setActive, LS_ACTIVE]);

  // ===== REST TIMER =====
  const [restEndAt, setRestEndAt] = React.useState<number | null>(null);
  const [restTotal, setRestTotal] = React.useState<number>(settings.restSec);
  const [restTick, setRestTick] = React.useState(0);

  React.useEffect(() => {
    if (!restEndAt) return;
    const t = window.setInterval(() => setRestTick((x) => x + 1), 200);
    return () => window.clearInterval(t);
  }, [restEndAt]);

  const restLeftSec = React.useMemo(() => {
    if (!restEndAt) return 0;
    const left = Math.ceil((restEndAt - Date.now()) / 1000);
    return Math.max(0, left);
  }, [restEndAt, restTick]);

  React.useEffect(() => {
    if (!restEndAt) return;
    if (restLeftSec !== 0) return;

    if (!settings.muted) {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.value = 0.03;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        setTimeout(() => {
          o.stop();
          ctx.close();
        }, 180);
      } catch {}
    }

    setRestEndAt(null);
  }, [restEndAt, restLeftSec, settings.muted]);

  const startRest = React.useCallback(
    (sec?: number) => {
      const s = Math.max(10, sec ?? settings.restSec);
      setRestTotal(s);
      setRestEndAt(Date.now() + s * 1000);
    },
    [settings.restSec]
  );

  const addRest = React.useCallback((delta: number) => {
    setRestEndAt((prev) => (prev ? prev + delta * 1000 : prev));
    setRestTotal((t) => t + delta);
  }, []);

  const skipRest = React.useCallback(() => {
    setRestEndAt(null);
  }, []);

  // ===== FINISH (lokál + cloud + queue + ALWAYS close UI) =====
  const finishWorkout = React.useCallback(async () => {
    if (!active) return;

    if (active.exercises.length === 0) {
      const okEmpty = window.confirm("Üres edzés. Mented így is?");
      if (!okEmpty) return;
    }

    let finished: Workout = { ...active, finishedAt: nowISO() };
    finished = normalizeWorkoutForSave(finished);

    if (finished.exercises.length === 0) {
      const ok = window.confirm("Nincs kitöltött set. Mented így is?");
      if (!ok) return;
    }

    // 1) LOKÁL mentés (mindig)
    setHistory((h) => clampHistory([finished, ...h]));

    // 2) CLOUD csak ha fb:<uid> profil aktív + ugyanaz a user
    const cloudUid = cloudUidFromProfileId(activeProfileId);
    const user = auth.currentUser;
    const shouldCloud = !!cloudUid && user?.uid === cloudUid;

    let cloudState: "none" | "ok" | "queued" = "none";

    try {
      if (shouldCloud && user) {
        const online = typeof navigator !== "undefined" ? navigator.onLine !== false : true;

        if (!online) {
          enqueueWorkout(user.uid, finished, new Error("offline"));
          cloudState = "queued";
        } else {
          try {
            await saveWorkoutToCloud(user.uid, finished);
            cloudState = "ok";
          } catch (e) {
            enqueueWorkout(user.uid, finished, e);
            cloudState = "queued";
          }
        }
      }
    } finally {
      // 3) UI/Flow: az edzés MINDIG tűnjön el Finish után
      lsSet(LS_ACTIVE, null);
      setActive(null);
    }

    // 4) Toast
    if (!shouldCloud) {
      setToast({ tone: "ok", title: "Elmentve lokálisan", body: "Vendég / lokális profil." });
    } else if (cloudState === "ok") {
      setToast({ tone: "ok", title: "Elmentve", body: "Lokálisan és a felhőbe is." });
    } else {
      setToast({
        tone: "warn",
        title: "Elmentve lokálisan",
        body: "Offline vagy / hiba volt. Csatlakozz netre — a szinkron automatikusan megpróbálja később.",
      });
    }

    // 5) Achievement check
    try {
      const achKey = profileKey(profileId, "achievements");
      const unlocked = lsGet<UnlockedAchievement[]>(achKey, []);
      const updatedHistory = [finished, ...history];
      const newOnes = checkNewAchievements(
        { workouts: updatedHistory, weightHistory: [], streak: 0 },
        unlocked
      );
      if (newOnes.length > 0) {
        const merged = [...unlocked, ...newOnes];
        lsSet(achKey, merged);
        setNewAchievements(newOnes);
      }
    } catch {}

    // 6) Post-workout notification
    const notifSettings = lsGet<NotifSettings>(LS_NOTIF_SETTINGS, DEFAULT_NOTIF_SETTINGS);
    schedulePostWorkoutNotif(notifSettings);
  }, [active, activeProfileId, setHistory, setActive, LS_ACTIVE]);

  const toggleFavorite = React.useCallback(
    (exerciseId: string) => {
      setFavorites((prev) => {
        const has = prev.includes(exerciseId);
        const next = has ? prev.filter((x) => x !== exerciseId) : [exerciseId, ...prev];
        return next.slice(0, 200);
      });
    },
    [setFavorites]
  );

  const bumpRecent = React.useCallback(
    (exerciseId: string) => {
      setRecents((prev) => {
        const next = [exerciseId, ...prev.filter((x) => x !== exerciseId)];
        return next.slice(0, 50);
      });
    },
    [setRecents]
  );

  const addExercise = React.useCallback(
    (exerciseId: string, name: string) => {
      setActive((prev) => {
        const base = prev ?? newWorkout();

        const last = findLastExerciseInHistory(history, exerciseId);
        const templateSets: SetEntry[] | undefined = last
          ? last.sets.map((s) => ({ id: uid(), weight: s.weight, reps: s.reps, done: false }))
          : undefined;

        const ex = newExercise(exerciseId, name, templateSets);
        bumpRecent(exerciseId);

        return { ...base, exercises: [...base.exercises, ex] };
      });
    },
    [setActive, history, bumpRecent]
  );

  const removeExercise = React.useCallback(
    (exerciseInstanceId: string) => {
      setActive((prev) => {
        if (!prev) return prev;
        return { ...prev, exercises: prev.exercises.filter((e) => e.id !== exerciseInstanceId) };
      });
    },
    [setActive]
  );

  const addSetToExercise = React.useCallback(
    (exerciseInstanceId: string) => {
      setActive((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((e) =>
            e.id === exerciseInstanceId ? { ...e, sets: [...e.sets, newSet()] } : e
          ),
        };
      });
    },
    [setActive]
  );

  const toggleSetDone = React.useCallback(
    (exerciseInstanceId: string, setId: string) => {
      if (!active) return;

      const ex = active.exercises.find((e) => e.id === exerciseInstanceId);
      const set = ex?.sets.find((s) => s.id === setId);
      if (!set) return;

      const nextDone = !set.done;
      const shouldStart = settings.autoRest && nextDone && isSetFilled(set);

      setActive((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((e) => {
            if (e.id !== exerciseInstanceId) return e;
            return {
              ...e,
              sets: e.sets.map((s) => (s.id === setId ? { ...s, done: nextDone } : s)),
            };
          }),
        };
      });

      if (shouldStart) startRest(settings.restSec);
    },
    [active, setActive, settings.autoRest, settings.restSec, startRest]
  );

  const openEdit = React.useCallback((exerciseInstanceId: string, setId: string) => {
    setEditExerciseId(exerciseInstanceId);
    setEditSetId(setId);
    setEditOpen(true);
  }, []);

  const closeEdit = React.useCallback(() => {
    setEditOpen(false);
    setEditExerciseId(null);
    setEditSetId(null);
  }, []);

  const currentEdit = React.useMemo(() => {
    if (!active || !editExerciseId || !editSetId) return null;
    const ex = active.exercises.find((e) => e.id === editExerciseId) ?? null;
    const set = ex?.sets.find((s) => s.id === editSetId) ?? null;
    return { ex, set };
  }, [active, editExerciseId, editSetId]);

  const patchEditSet = React.useCallback(
    (patch: Partial<SetEntry>) => {
      if (!editExerciseId || !editSetId) return;
      setActive((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((e) => {
            if (e.id !== editExerciseId) return e;
            return { ...e, sets: e.sets.map((s) => (s.id === editSetId ? { ...s, ...patch } : s)) };
          }),
        };
      });
    },
    [setActive, editExerciseId, editSetId]
  );

  const deleteEditSet = React.useCallback(() => {
    if (!editExerciseId || !editSetId) return;
    setActive((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.id !== editExerciseId) return e;
          const nextSets = e.sets.filter((s) => s.id !== editSetId);
          return { ...e, sets: nextSets.length ? nextSets : [newSet()] };
        }),
      };
    });
    closeEdit();
  }, [setActive, editExerciseId, editSetId, closeEdit]);

  const copyPrevSet = React.useCallback(() => {
    if (!editExerciseId || !editSetId) return;
    setActive((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.id !== editExerciseId) return e;
          const idx = e.sets.findIndex((s) => s.id === editSetId);
          if (idx <= 0) return e;
          const prevSet = e.sets[idx - 1];
          return {
            ...e,
            sets: e.sets.map((s) =>
              s.id === editSetId ? { ...s, weight: prevSet.weight, reps: prevSet.reps, done: false } : s
            ),
          };
        }),
      };
    });
  }, [setActive, editExerciseId, editSetId]);

  const lastSummaryFor = React.useCallback(
    (exerciseId: string) => {
      const last = findLastExerciseInHistory(history, exerciseId);
      if (!last) return "—";
      return formatLastSummary(last.sets);
    },
    [history]
  );

  const startedAtText = active
    ? new Date(active.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const filledTotalSets = active
    ? active.exercises.reduce((acc, ex) => acc + ex.sets.filter(isSetFilled).length, 0)
    : 0;

  const filledDoneSets = active
    ? active.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => isSetFilled(s) && s.done).length, 0)
    : 0;

  const totalVolume = active
    ? active.exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((s, st) => s + (st.done ? (st.weight ?? 0) * (st.reps ?? 0) : 0), 0), 0)
    : 0;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed left-0 right-0 bottom-28 z-[90] mx-auto max-w-md px-4">
          <div className="rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl"
            style={toast.tone === "ok"
              ? { background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#86efac' }
              : { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fde68a' }}>
            <div className="font-semibold">{toast.title}</div>
            {toast.body && <div className="mt-0.5 text-xs opacity-80">{toast.body}</div>}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-md px-4 pt-6 pb-32 animate-in">

        {/* ── HEADER ── */}
        <header className="mb-5">
          <div className="label-xs mb-1">EDZÉS</div>

          {active ? (
            /* Aktív header */
            <div>
              <div className="flex items-center justify-between gap-2">
                {/* Nagy timer */}
                <div>
                  <div className="text-4xl font-bold tabular-nums" style={{ color: 'var(--accent-primary)' }}>
                    {elapsed}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{active.exercises.length} gyakorlat</span>
                    <span style={{ color: filledDoneSets === filledTotalSets && filledTotalSets > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                      {filledDoneSets}/{filledTotalSets} set
                    </span>
                    {totalVolume > 0 && <span>{Math.round(totalVolume)} vol</span>}
                    {pendingN > 0 && <span style={{ color: '#fbbf24' }}>sync: {pendingN}</span>}
                  </div>
                </div>

                {/* Akció gombok */}
                <div className="flex flex-col gap-2 items-end">
                  <button onClick={finishWorkout}
                    className="rounded-2xl px-4 py-2.5 text-sm font-bold pressable"
                    style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                    Finish ✓
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => setAddOpen(true)}
                      className="rounded-xl px-3 py-2 text-sm pressable"
                      style={{ background: 'rgba(34,211,238,0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.2)' }}>
                      + Gyakorlat
                    </button>
                    <button onClick={discardWorkout}
                      className="rounded-xl px-3 py-2 text-sm pressable"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {filledTotalSets > 0 && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(filledDoneSets / filledTotalSets) * 100}%`,
                      background: filledDoneSets === filledTotalSets ? '#4ade80' : 'var(--accent-primary)' }} />
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
            <div>
              <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Mai edzés</h1>

              {/* Ha van mai tervezett program */}
              {todaySessions.length > 0 && (
                <div className="mb-4 rounded-2xl p-4 space-y-2"
                  style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                  <div className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--accent-primary)' }}>
                    📅 MAI PROGRAM
                  </div>
                  {todaySessions.map((sess, i) => {
                    const SLOT_EMOJIS: Record<string, string> = { warmup: "🔥", main: "💪", cardio: "🏃", cooldown: "🧘" };
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-base">{SLOT_EMOJIS[sess.slotId] ?? "💪"}</span>
                        <div>
                          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{sess.sessionName}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {sess.exercises.slice(0, 3).join(" · ")}
                            {sess.exercises.length > 3 ? ` +${sess.exercises.length - 3}` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => {
                  startWorkout();
                  if (todaySessions.length === 0) setAddOpen(true);
                }}
                className="w-full rounded-3xl py-5 text-base font-bold pressable"
                style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))',
                  border: '1px solid rgba(34,211,238,0.3)', color: 'var(--accent-primary)',
                  boxShadow: '0 0 30px rgba(34,211,238,0.08)' }}>
                {todaySessions.length > 0 ? "Edzés indítása →" : "Edzés indítása →"}
              </button>
              {history.length > 0 && (
                <div className="mt-3 rounded-2xl px-4 py-3 text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Utolsó: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(history[0]?.startedAt).toLocaleDateString("hu", { weekday: "long", month: "short", day: "numeric" })}
                    {" · "}{history[0]?.exercises?.length ?? 0} gyakorlat
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        {/* ── EXERCISE KÁRTYÁK ── */}
        {active && (
          <section className="space-y-3">
            {active.exercises.length === 0 ? (
              <button onClick={() => setAddOpen(true)}
                className="w-full rounded-3xl py-8 text-sm pressable"
                style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-mid)', color: 'var(--text-muted)' }}>
                + Adj hozzá egy gyakorlatot
              </button>
            ) : (
              active.exercises.map(ex => (
                <ExerciseCard
                  key={ex.id} ex={ex}
                  lastSummary={lastSummaryFor(ex.exerciseId)}
                  onAddSet={() => addSetToExercise(ex.id)}
                  onEditSet={setId => openEdit(ex.id, setId)}
                  onRemoveExercise={() => removeExercise(ex.id)}
                  onToggleDone={setId => toggleSetDone(ex.id, setId)}
                  onStartRest={() => startRest(settings.restSec)}
                />
              ))
            )}
          </section>
        )}
      </main>

      <AddExerciseSheet open={addOpen} onClose={() => setAddOpen(false)}
        exercises={allExercises} favorites={favorites} recents={recents}
        onToggleFavorite={toggleFavorite}
        onPick={e => { addExercise(e.id, e.name); setAddOpen(false); }}
        customExercises={customExercises}
        onCreateCustom={ex => {
          saveCustomExercise(profileId, ex);
          setCustomExercises(readCustomExercises(profileId));
        }}
        onDeleteCustom={id => {
          deleteCustomExercise(profileId, id);
          setCustomExercises(readCustomExercises(profileId));
        }}
      />

      <SetEditSheet open={editOpen} onClose={closeEdit}
        title={currentEdit?.ex?.name ?? "—"} set={currentEdit?.set ?? null}
        onSave={patchEditSet} onDelete={deleteEditSet} onCopyPrev={copyPrevSet} />

      <RestTimerOverlay open={!!restEndAt} totalSec={restTotal} leftSec={restLeftSec}
        muted={settings.muted} onAdd={addRest} onSkip={skipRest}
        onToggleMute={() => setSettings(s => ({ ...s, muted: !s.muted }))} />

      <AchievementToast
        newAchievements={newAchievements}
        onDismiss={() => setNewAchievements([])}
      />

      <BottomNav />
    </>
  );
}
