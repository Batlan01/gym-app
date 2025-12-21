"use client";

import * as React from "react";
import type { ExerciseDef } from "@/lib/exercises";

type Tab = "recent" | "favorites" | "all";

export function AddExerciseSheet({
  open,
  onClose,
  exercises,
  favorites,
  recents,
  onToggleFavorite,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  exercises: ExerciseDef[];
  favorites: string[];
  recents: string[];
  onToggleFavorite: (exerciseId: string) => void;
  onPick: (exercise: ExerciseDef) => void;
}) {
  const [tab, setTab] = React.useState<Tab>("recent");
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setTab("recent");
    setQ("");
  }, [open]);

  const byId = React.useMemo(() => {
    const m = new Map<string, ExerciseDef>();
    exercises.forEach((e) => m.set(e.id, e));
    return m;
  }, [exercises]);

  const recentList = React.useMemo(() => {
    return recents.map((id) => byId.get(id)).filter(Boolean) as ExerciseDef[];
  }, [recents, byId]);

  const favList = React.useMemo(() => {
    return favorites.map((id) => byId.get(id)).filter(Boolean) as ExerciseDef[];
  }, [favorites, byId]);

  const base =
    tab === "recent" ? recentList :
    tab === "favorites" ? favList :
    exercises;

  const list = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return base;
    return base.filter((e) => e.name.toLowerCase().includes(qq));
  }, [base, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md pb-[env(safe-area-inset-bottom)]">
        <div className="rounded-t-3xl border border-white/10 bg-zinc-950/90 backdrop-blur p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-white">Gyakorlat hozzáadása</div>
            <button
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              Bezár
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setTab("recent")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm ${
                tab === "recent" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setTab("favorites")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm ${
                tab === "favorites" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setTab("all")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm ${
                tab === "all" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              All
            </button>
          </div>

          <div className="mt-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Keresés…"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
            />
          </div>

          <div className="mt-3 max-h-[55vh] overflow-auto rounded-2xl border border-white/10">
            {list.length === 0 ? (
              <div className="p-4 text-sm text-white/60">Nincs találat.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {list.map((e) => {
                  const isFav = favorites.includes(e.id);
                  return (
                    <li key={e.id} className="flex items-center gap-3 p-3">
                      <button
                        onClick={() => onPick(e)}
                        className="flex-1 text-left"
                      >
                        <div className="text-sm font-medium text-white">{e.name}</div>
                        <div className="text-xs text-white/50">{e.group ?? "—"}</div>
                      </button>

                      <button
                        onClick={() => onToggleFavorite(e.id)}
                        className={`h-10 w-10 rounded-xl border border-white/10 ${
                          isFav ? "bg-white/15 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                        aria-label="Favorite"
                        title="Favorite"
                      >
                        {isFav ? "★" : "☆"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-3 text-xs text-white/40">
            Tipp: a “Recent” lesz a leggyorsabb logolásnál.
          </div>
        </div>
      </div>
    </div>
  );
}
