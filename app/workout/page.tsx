"use client";

import * as React from "react";
import { BottomNav } from "@/components/BottomNav";
import { AddExerciseSheet } from "@/components/AddExerciseSheet";
import { ExerciseCard } from "@/components/ExerciseCard";
import { SetEditSheet } from "@/components/SetEditSheet";
import { RestTimerOverlay } from "@/components/RestTimerOverlay";
import { WorkoutDetailSheet } from "@/components/WorkoutDetailSheet";
import { AchievementToast } from "@/components/AchievementToast";

import { EXERCISES } from "@/lib/exercises";
import { readCustomExercises, saveCustomExercise, deleteCustomExercise } from "@/lib/customExercises";
import type { CustomExercise } from "@/lib/customExercises";
import { readPrograms } from "@/lib/programsStorage";
import type { Workout, WorkoutExercise, SetEntry } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsSet, lsGet, uid } from "@/lib/storage";
import { getProgressionSuggestion } from "@/lib/workoutMetrics";
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
import { updatePRsFromWorkout } from "@/lib/prStorage";
import { useTranslation } from "@/lib/i18n";

import { auth } from "@/lib/firebase";
import { saveWorkoutToCloud } from "@/lib/workoutsCloud";
import { enqueueWorkout, pendingCount } from "@/lib/pendingSync";

const LS_ACTIVE_PROFILE = "gym.activeProfileId";

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
      results.push({ slotId: d.slotId, sessionName: sess.name, exercises: sess.blocks.map(b => b.name) });
    }
  }
  return results;
}

type Settings = { restSec: number; autoRest: boolean; muted: boolean; };
function nowISO() { return new Date().toISOString(); }
function clampHistory(list: Workout[], max = 200) { return list.slice(0, max); }
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
function cloudUidFromProfileId(profileId: string | null | undefined): string | null {
  if (!profileId) return null;
  if (!profileId.startsWith("fb:")) return null;
  const uid = profileId.slice(3).trim();
  return uid.length ? uid : null;
}

type Toast = null | { tone: "ok" | "warn"; title: string; body?: string; };

export default function WorkoutPage() {
  const { t, lang } = useTranslation();
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
  const [settings, setSettings] = useLocalStorageState<Settings>(LS_SETTINGS, { restSec: 90, autoRest: true, muted: false });
  const [addOpen, setAddOpen] = React.useState(false);
  const [customExercises, setCustomExercises] = React.useState<CustomExercise[]>([]);
  React.useEffect(() => { setCustomExercises(readCustomExercises(profileId)); }, [profileId]);
  const todaySessions = React.useMemo(() => getTodaySessions(profileId), [profileId]);
  const allExercises = React.useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editExerciseId, setEditExerciseId] = React.useState<string | null>(null);
  const [editSetId, setEditSetId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<Toast>(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);
  const [newAchievements, setNewAchievements] = React.useState<UnlockedAchievement[]>([]);
  const [newPRNames, setNewPRNames] = React.useState<string[]>([]);
  const [detailWorkoutId, setDetailWorkoutId] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  React.useEffect(() => {
    const notifSettings = lsGet<NotifSettings>(LS_NOTIF_SETTINGS, DEFAULT_NOTIF_SETTINGS);
    if (history.length > 0) checkAndSendStreakBreakNotif(history[0].startedAt, notifSettings);
    scheduleCalendarReminder(todaySessions.length, notifSettings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pendingN, setPendingN] = React.useState(0);
  React.useEffect(() => {
    const cloudUid = cloudUidFromProfileId(activeProfileId);
    const user = auth.currentUser;
    const ok = !!cloudUid && user?.uid === cloudUid;
    if (!ok || !user) { setPendingN(0); return; }
    const refresh = () => setPendingN(pendingCount(user.uid));
    refresh();
    const t = window.setInterval(refresh, 1500);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [activeProfileId]);

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [active]);

  const elapsed = React.useMemo(() => {
    if (!active) return "0:00";
    return msToClock(Date.now() - new Date(active.startedAt).getTime());
  }, [active, tick]);

  const startWorkout = React.useCallback(() => {
    setActive((prev) => {
      if (prev) return prev;
      const base = newWorkout();
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
    const ok = window.confirm(t.workout.confirm_discard);
    if (!ok) return;
    lsSet(LS_ACTIVE, null);
    setActive(null);
  }, [active, setActive, LS_ACTIVE]);

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
    return Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000));
  }, [restEndAt, restTick]);
  React.useEffect(() => {
    if (!restEndAt || restLeftSec !== 0) return;
    if (!settings.muted) {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.03;
        o.connect(g); g.connect(ctx.destination); o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, 180);
      } catch {}
    }
    setRestEndAt(null);
  }, [restEndAt, restLeftSec, settings.muted]);

  const startRest = React.useCallback((sec?: number) => {
    const s = Math.max(10, sec ?? settings.restSec);
    setRestTotal(s); setRestEndAt(Date.now() + s * 1000);
  }, [settings.restSec]);
  const addRest = React.useCallback((delta: number) => {
    setRestEndAt((prev) => (prev ? prev + delta * 1000 : prev));
    setRestTotal((t) => t + delta);
  }, []);
  const skipRest = React.useCallback(() => { setRestEndAt(null); }, []);

  const finishWorkout = React.useCallback(async () => {
    if (!active) return;
    if (active.exercises.length === 0) {
      const okEmpty = window.confirm(t.workout.confirm_empty);
      if (!okEmpty) return;
    }
    let finished: Workout = { ...active, finishedAt: nowISO() };
    finished = normalizeWorkoutForSave(finished);
    if (finished.exercises.length === 0) {
      const ok = window.confirm(t.workout.confirm_no_sets);
      if (!ok) return;
    }
    setHistory((h) => clampHistory([finished, ...h]));
    const cloudUid = cloudUidFromProfileId(activeProfileId);
    const user = auth.currentUser;
    const shouldCloud = !!cloudUid && user?.uid === cloudUid;
    let cloudState: "none" | "ok" | "queued" = "none";
    try {
      if (shouldCloud && user) {
        const online = typeof navigator !== "undefined" ? navigator.onLine !== false : true;
        if (!online) { enqueueWorkout(user.uid, finished, new Error("offline")); cloudState = "queued"; }
        else { try { await saveWorkoutToCloud(user.uid, finished); cloudState = "ok"; } catch (e) { enqueueWorkout(user.uid, finished, e); cloudState = "queued"; } }
      }
    } finally { lsSet(LS_ACTIVE, null); setActive(null); }
    if (!shouldCloud) setToast({ tone: "ok", title: t.workout.saved_local, body: t.workout.saved_local_body });
    else if (cloudState === "ok") setToast({ tone: "ok", title: t.workout.saved_cloud, body: t.workout.saved_cloud_body });
    else setToast({ tone: "warn", title: t.workout.saved_local, body: t.workout.saved_offline });
    try {
      const achKey = profileKey(profileId, "achievements");
      const unlocked = lsGet<UnlockedAchievement[]>(achKey, []);
      const updatedHistory = [finished, ...history];
      const newOnes = checkNewAchievements({ workouts: updatedHistory, weightHistory: [], streak: 0 }, unlocked);
      if (newOnes.length > 0) { lsSet(achKey, [...unlocked, ...newOnes]); setNewAchievements(newOnes); }
    } catch {}
    try {
      const { newPRs } = updatePRsFromWorkout(profileId, finished);
      if (newPRs.length > 0) setNewPRNames(newPRs);
    } catch {}
    const notifSettings = lsGet<NotifSettings>(LS_NOTIF_SETTINGS, DEFAULT_NOTIF_SETTINGS);
    schedulePostWorkoutNotif(notifSettings);
  }, [active, activeProfileId, setHistory, setActive, LS_ACTIVE]);

  const toggleFavorite = React.useCallback((exerciseId: string) => {
    setFavorites((prev) => { const has = prev.includes(exerciseId); return (has ? prev.filter(x => x !== exerciseId) : [exerciseId, ...prev]).slice(0, 200); });
  }, [setFavorites]);
  const bumpRecent = React.useCallback((exerciseId: string) => {
    setRecents((prev) => [exerciseId, ...prev.filter(x => x !== exerciseId)].slice(0, 50));
  }, [setRecents]);
  const addExercise = React.useCallback((exerciseId: string, name: string) => {
    setActive((prev) => {
      const base = prev ?? newWorkout();
      const last = findLastExerciseInHistory(history, exerciseId);
      const templateSets = last ? last.sets.map(s => ({ id: uid(), weight: s.weight, reps: s.reps, done: false })) : undefined;
      bumpRecent(exerciseId);
      return { ...base, exercises: [...base.exercises, newExercise(exerciseId, name, templateSets)] };
    });
  }, [setActive, history, bumpRecent]);
  const removeExercise = React.useCallback((id: string) => {
    setActive(prev => prev ? { ...prev, exercises: prev.exercises.filter(e => e.id !== id) } : prev);
  }, [setActive]);
  const addSetToExercise = React.useCallback((id: string) => {
    setActive(prev => prev ? { ...prev, exercises: prev.exercises.map(e => e.id === id ? { ...e, sets: [...e.sets, newSet()] } : e) } : prev);
  }, [setActive]);
  const toggleSetDone = React.useCallback((exerciseInstanceId: string, setId: string) => {
    if (!active) return;
    const ex = active.exercises.find(e => e.id === exerciseInstanceId);
    const set = ex?.sets.find(s => s.id === setId);
    if (!set) return;
    const nextDone = !set.done;
    const shouldStart = settings.autoRest && nextDone && isSetFilled(set);
    setActive(prev => prev ? { ...prev, exercises: prev.exercises.map(e => e.id !== exerciseInstanceId ? e : { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, done: nextDone } : s) }) } : prev);
    if (shouldStart) startRest(settings.restSec);
  }, [active, setActive, settings, startRest]);
  const openEdit = React.useCallback((exerciseInstanceId: string, setId: string) => {
    setEditExerciseId(exerciseInstanceId); setEditSetId(setId); setEditOpen(true);
  }, []);
  const closeEdit = React.useCallback(() => { setEditOpen(false); setEditExerciseId(null); setEditSetId(null); }, []);
  const currentEdit = React.useMemo(() => {
    if (!active || !editExerciseId || !editSetId) return null;
    const ex = active.exercises.find(e => e.id === editExerciseId) ?? null;
    const set = ex?.sets.find(s => s.id === editSetId) ?? null;
    return { ex, set };
  }, [active, editExerciseId, editSetId]);
  const patchEditSet = React.useCallback((patch: Partial<SetEntry>) => {
    if (!editExerciseId || !editSetId) return;
    setActive(prev => prev ? { ...prev, exercises: prev.exercises.map(e => e.id !== editExerciseId ? e : { ...e, sets: e.sets.map(s => s.id === editSetId ? { ...s, ...patch } : s) }) } : prev);
  }, [setActive, editExerciseId, editSetId]);
  const deleteEditSet = React.useCallback(() => {
    if (!editExerciseId || !editSetId) return;
    setActive(prev => prev ? { ...prev, exercises: prev.exercises.map(e => { if (e.id !== editExerciseId) return e; const nextSets = e.sets.filter(s => s.id !== editSetId); return { ...e, sets: nextSets.length ? nextSets : [newSet()] }; }) } : prev);
    closeEdit();
  }, [setActive, editExerciseId, editSetId, closeEdit]);
  const copyPrevSet = React.useCallback(() => {
    if (!editExerciseId || !editSetId) return;
    setActive(prev => prev ? { ...prev, exercises: prev.exercises.map(e => { if (e.id !== editExerciseId) return e; const idx = e.sets.findIndex(s => s.id === editSetId); if (idx <= 0) return e; const p = e.sets[idx - 1]; return { ...e, sets: e.sets.map(s => s.id === editSetId ? { ...s, weight: p.weight, reps: p.reps, done: false } : s) }; }) } : prev);
  }, [setActive, editExerciseId, editSetId]);
  const lastSummaryFor = React.useCallback((exerciseId: string) => {
    const last = findLastExerciseInHistory(history, exerciseId);
    return last ? formatLastSummary(last.sets) : "—";
  }, [history]);

  const filledTotalSets = active ? active.exercises.reduce((acc, ex) => acc + ex.sets.filter(isSetFilled).length, 0) : 0;
  const filledDoneSets = active ? active.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => isSetFilled(s) && s.done).length, 0) : 0;
  const totalVolume = active ? active.exercises.reduce((acc, ex) => acc + ex.sets.reduce((s, st) => s + (st.done ? (st.weight ?? 0) * (st.reps ?? 0) : 0), 0), 0) : 0;

  return (
    <>
      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed left-0 right-0 bottom-28 z-[90] mx-auto max-w-md px-4">
          <div className="rounded-2xl px-4 py-3 text-sm font-medium"
            style={toast.tone === "ok"
              ? { background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', color: '#86efac' }
              : { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fde68a' }}>
            <div className="font-semibold">{toast.title}</div>
            {toast.body && <div className="mt-0.5 text-xs opacity-75">{toast.body}</div>}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-md px-4 pt-6 pb-32">

        {/* ── HEADER — aktív edzés ── */}
        {active ? (
          <div className="mb-5">

            {/* Timer sáv — solid block, nem glass */}
            <div className="rounded-3xl overflow-hidden mb-3" style={{ background:"var(--surface-1)" }}>

              {/* Progress bar a tetején */}
              {filledTotalSets > 0 && (
                <div className="h-1 w-full" style={{ background:"var(--surface-2)" }}>
                  <div className="h-full transition-all duration-500"
                    style={{
                      width: `${(filledDoneSets / filledTotalSets) * 100}%`,
                      background: filledDoneSets === filledTotalSets ? '#4ade80' : 'var(--accent-primary)',
                    }} />
                </div>
              )}

              <div className="px-4 pt-4 pb-4">
                {/* Timer nagy */}
                <div className="text-5xl font-black tabular-nums leading-none mb-2"
                  style={{ color: 'var(--accent-primary)' }}>
                  {elapsed}
                </div>

                {/* Meta sor */}
                <div className="flex items-center gap-3 text-[11px] font-semibold"
                  style={{ color:"var(--text-muted)" }}>
                  <span>{active.exercises.length} gyakorlat</span>
                  <span style={{ color: filledDoneSets === filledTotalSets && filledTotalSets > 0 ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
                    {filledDoneSets}/{filledTotalSets} set
                  </span>
                  {totalVolume > 0 && <span>{Math.round(totalVolume)} kg vol</span>}
                  {pendingN > 0 && <span style={{ color: '#fbbf24' }}>⟳ {pendingN}</span>}
                </div>
              </div>
            </div>

            {/* Akció gombok — 3 egyforma flat pill */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setAddOpen(true)}
                className="rounded-2xl py-3.5 text-sm font-black pressable"
                style={{ background: 'var(--accent-primary)', color: '#000' }}>
                + Gyakorlat
              </button>
              <button onClick={finishWorkout}
                className="rounded-2xl py-3.5 text-sm font-black pressable"
                style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                Befejezés ✓
              </button>
              <button onClick={discardWorkout}
                className="rounded-2xl py-3.5 text-sm font-black pressable"
                style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.15)' }}>
                Eldobás ✕
              </button>
            </div>
          </div>

        ) : (
          /* ── HEADER — üres állapot ── */
          <div className="mb-5">
            <div className="text-[10px] font-black tracking-widest mb-1" style={{ color:"var(--text-muted)" }}>
              EDZÉS
            </div>
            <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>{t.workout.today}</h1>

            {/* Tervezett program */}
            {todaySessions.length > 0 && (
              <div className="mb-4 rounded-2xl p-4 space-y-2"
                style={{ background:"var(--surface-0)", border:"1px solid var(--border-subtle)" }}>
                <div className="text-[9px] font-black tracking-widest mb-3" style={{ color:"var(--text-muted)" }}>
                  MAI PROGRAM
                </div>
                {todaySessions.map((sess, i) => {
                  const SLOT_EMOJIS: Record<string, string> = { warmup: "🔥", main: "💪", cardio: "🏃", cooldown: "🧘" };
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-base">{SLOT_EMOJIS[sess.slotId] ?? "💪"}</span>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{sess.sessionName}</div>
                        <div className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
                          {sess.exercises.slice(0, 3).join(" · ")}{sess.exercises.length > 3 ? ` +${sess.exercises.length - 3}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Start gomb — solid accent */}
            <button
              onClick={() => { startWorkout(); if (todaySessions.length === 0) setAddOpen(true); }}
              className="w-full rounded-2xl py-5 text-base font-black pressable"
              style={{ background: 'var(--accent-primary)', color: '#000' }}>
              {t.workout.start}
            </button>

            {history.length > 0 && (
              <div className="mt-4">
                <div className="text-[9px] font-black tracking-widest mb-2 px-1" style={{ color:"var(--text-muted)" }}>
                  UTOLSÓ EDZÉSEK
                </div>
                <div className="space-y-2">
                  {history.slice(0, 5).map(w => {
                    const wVol = w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((s, st) => s + (st.done ? (st.weight ?? 0) * (st.reps ?? 0) : 0), 0), 0);
                    const wDone = w.exercises.reduce((acc, ex) => acc + ex.sets.filter(st => st.done).length, 0);
                    const wMins = w.finishedAt ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000) : null;
                    const wDur = wMins != null ? (wMins >= 60 ? Math.floor(wMins/60) + 'h ' + (wMins%60) + 'm' : wMins + 'm') : null;
                    return (
                      <button key={w.id}
                        onClick={() => { setDetailWorkoutId(w.id); setDetailOpen(true); }}
                        className="w-full rounded-2xl px-4 py-3 text-left pressable"
                        style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>
                            {w.title || new Date(w.startedAt).toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[10px] shrink-0 ml-2" style={{ color:"var(--text-muted)" }}>
                            {new Date(w.startedAt).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { v: w.exercises.length + ' gyak.' },
                            { v: wDone + ' set' },
                            ...(wVol > 0 ? [{ v: Math.round(wVol) + ' kg' }] : []),
                            ...(wDur ? [{ v: '⏱ ' + wDur }] : []),
                          ].map(c => (
                            <span key={c.v} className="text-[10px] rounded-lg px-2 py-0.5 font-semibold"
                              style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>
                              {c.v}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EXERCISE KÁRTYÁK ── */}
        {active && (
          <section className="space-y-3">
            {active.exercises.length === 0 ? (
              <button onClick={() => setAddOpen(true)}
                className="w-full rounded-3xl py-8 text-sm pressable"
                style={{ background:"var(--surface-0)", border: '1px dashed rgba(255,255,255,0.1)', color:"var(--text-muted)" }}>
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
                  onSetTypeChange={(setId, type) => {
                    setActive(prev => prev ? {
                      ...prev,
                      exercises: prev.exercises.map(e => e.id !== ex.id ? e : {
                        ...e,
                        sets: e.sets.map(s => s.id === setId ? {...s, setType: type} : s),
                      }),
                    } : prev);
                  }}
                  progressionTip={(() => {
                    const sorted = [...history].sort((a,b)=>new Date(b.startedAt).getTime()-new Date(a.startedAt).getTime());
                    return getProgressionSuggestion(sorted, ex.exerciseId);
                  })()}
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
        onCreateCustom={ex => { saveCustomExercise(profileId, ex); setCustomExercises(readCustomExercises(profileId)); }}
        onDeleteCustom={id => { deleteCustomExercise(profileId, id); setCustomExercises(readCustomExercises(profileId)); }}
      />

      <SetEditSheet open={editOpen} onClose={closeEdit}
        title={currentEdit?.ex?.name ?? "—"} set={currentEdit?.set ?? null}
        exercise={currentEdit?.ex ?? undefined}
        onSave={patchEditSet} onDelete={deleteEditSet} onCopyPrev={copyPrevSet}
        onBilateralChange={bilateral => {
          if (!active || !currentEdit?.ex) return;
          setActive(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              exercises: prev.exercises.map(ex =>
                ex.id === currentEdit.ex!.id ? { ...ex, bilateral } : ex
              ),
            };
          });
        }} />

      <RestTimerOverlay open={!!restEndAt} totalSec={restTotal} leftSec={restLeftSec}
        muted={settings.muted} onAdd={addRest} onSkip={skipRest}
        onToggleMute={() => setSettings(s => ({ ...s, muted: !s.muted }))} />

      {newPRNames.length > 0 && (
        <div className="fixed left-0 right-0 bottom-36 z-[95] mx-auto max-w-md px-4">
          <div className="relative rounded-2xl px-4 py-3" style={{background:"var(--accent-primary)",color:"#000"}}>
            <div className="font-black text-sm">{t.workout.pr_new}</div>
            <div className="text-xs mt-1 opacity-60">{newPRNames.slice(0,3).join(", ")}{newPRNames.length > 3 ? " +" + (newPRNames.length-3) + " mas" : ""}</div>
            <button onClick={() => setNewPRNames([])} className="absolute top-2 right-3 text-base opacity-50">x</button>
          </div>
        </div>
      )}
      <WorkoutDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        workout={history.find(w => w.id === detailWorkoutId) ?? null}
        onDelete={() => {
          if (!detailWorkoutId) return;
          setHistory(h => h.filter(w => w.id !== detailWorkoutId));
          setDetailOpen(false);
          setDetailWorkoutId(null);
        }}
      />
      <AchievementToast newAchievements={newAchievements} onDismiss={() => setNewAchievements([])} />
      <BottomNav />
    </>
  );
}
