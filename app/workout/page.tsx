"use client";

import * as React from "react";
import { BottomNav } from "@/components/BottomNav";
import { AddExerciseSheet } from "@/components/AddExerciseSheet";
import { ExerciseCard } from "@/components/ExerciseCard";
import { SetEditSheet } from "@/components/SetEditSheet";
import { EXERCISES } from "@/lib/exercises";
import type { Workout, WorkoutExercise, SetEntry } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { lsSet, uid } from "@/lib/storage";
import { formatLastSummary, newExercise, newSet, newWorkout, normalizeWorkoutForSave, isSetFilled } from "@/lib/workoutHelpers";


const LS_ACTIVE = "gym.activeWorkout";
const LS_HISTORY = "gym.workouts";
const LS_RECENTS = "gym.recents";
const LS_FAVORITES = "gym.favorites";

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

export default function WorkoutPage() {
  const [active, setActive] = useLocalStorageState<Workout | null>(LS_ACTIVE, null);
  const [history, setHistory] = useLocalStorageState<Workout[]>(LS_HISTORY, []);
  const [recents, setRecents] = useLocalStorageState<string[]>(LS_RECENTS, []);
  const [favorites, setFavorites] = useLocalStorageState<string[]>(LS_FAVORITES, []);

  const [addOpen, setAddOpen] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editExerciseId, setEditExerciseId] = React.useState<string | null>(null);
  const [editSetId, setEditSetId] = React.useState<string | null>(null);

  // timer tick (pro session feeling)
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
    setActive((prev) => prev ?? newWorkout());
  }, [setActive]);

  const discardWorkout = React.useCallback(() => {
    if (!active) return;
    const ok = window.confirm("Eldobod az aktuális edzést?");
    if (!ok) return;
    lsSet(LS_ACTIVE, null);
    setActive(null);
  }, [active, setActive]);

  const finishWorkout = React.useCallback(() => {
    if (!active) return;

    // minimal sanity: ha full üres, inkább kérdezzen rá
    if (active.exercises.length === 0) {
      const okEmpty = window.confirm("Üres edzés. Mented így is?");
      if (!okEmpty) return;
    }

    let finished: Workout = { ...active, finishedAt: nowISO() };
finished = normalizeWorkoutForSave(finished);

// ha a végén semmi nem maradt, ne mentsük el “üres edzésként”
if (finished.exercises.length === 0) {
  const ok = window.confirm("Nincs kitöltött set. Mented így is?");
  if (!ok) return;
}

setHistory((h) => clampHistory([finished, ...h]));


    lsSet(LS_ACTIVE, null);
    setActive(null);
  }, [active, setHistory, setActive]);

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

  // *** KEY FIX: minden gyakorlat mindig ugyanahhoz az aktív session-höz megy ***
  const addExercise = React.useCallback(
    (exerciseId: string, name: string) => {
      setActive((prev) => {
        const base = prev ?? newWorkout();

        // template: last time sets
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
            return {
              ...e,
              sets: e.sets.map((s) => (s.id === editSetId ? { ...s, ...patch } : s)),
            };
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

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28">
      <header className="mb-4">
        <div className="text-xs tracking-widest text-white/50">EDZÉS</div>

        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Mai edzés</h1>

          <div className="flex gap-2">
            <button
              onClick={() => {
                startWorkout();
                setAddOpen(true);
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
            >
              + Gyakorlat
            </button>

            <button
              onClick={finishWorkout}
              disabled={!active}
              className={`rounded-2xl px-3 py-2 text-sm ${
                active
                  ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
                  : "border border-white/10 bg-white/5 text-white/30"
              }`}
            >
              Finish
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-sm text-white/60">
          {active ? (
            <>
              <div>
                <span className="text-white/85">{elapsed}</span> ·{" "}
                <span className="text-white/85">{active.exercises.length}</span> ex ·{" "}
                <span className="text-white/85">{filledDoneSets}/{filledTotalSets}</span> sets ·{" "}
                <span className="text-white/50">start {startedAtText}</span>
              </div>
              <button
                onClick={discardWorkout}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/15"
              >
                Discard
              </button>
            </>
          ) : (
            <div className="w-full">
              <button
                onClick={() => {
                  startWorkout();
                  setAddOpen(true);
                }}
                className="w-full rounded-3xl border border-white/10 bg-white/10 py-3 text-sm text-white hover:bg-white/15"
              >
                Edzés indítása
              </button>
            </div>
          )}
        </div>
      </header>

      {active ? (
        <section className="space-y-3">
          {active.exercises.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
              + Gyakorlat
            </div>
          ) : (
            active.exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                lastSummary={lastSummaryFor(ex.exerciseId)}
                onAddSet={() => addSetToExercise(ex.id)}
                onEditSet={(setId) => openEdit(ex.id, setId)}
                onRemoveExercise={() => removeExercise(ex.id)}
              />
            ))
          )}
        </section>
      ) : null}

      <AddExerciseSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        exercises={EXERCISES}
        favorites={favorites}
        recents={recents}
        onToggleFavorite={toggleFavorite}
        onPick={(e) => {
          addExercise(e.id, e.name);
          setAddOpen(false);
        }}
      />

      <SetEditSheet
        open={editOpen}
        onClose={closeEdit}
        title={currentEdit?.ex?.name ?? "—"}
        set={currentEdit?.set ?? null}
        onSave={patchEditSet}
        onDelete={deleteEditSet}
        onCopyPrev={copyPrevSet}
      />

      <BottomNav />
    </main>
  );
}
