"use client";

import * as React from "react";
import type { ExerciseDef } from "@/lib/exercises";

type Tab = "recent" | "favorites" | "all";

type TileMeta = { label: string; emoji: string };

const CATEGORY_META: Record<string, TileMeta> = {
  Chest: { label: "Chest", emoji: "🫀" },
  Back: { label: "Back", emoji: "🧱" },
  Shoulders: { label: "Shoulders", emoji: "🏋️" },
  Legs: { label: "Legs", emoji: "🦵" },
  Arms: { label: "Arms", emoji: "💪" },
  Core: { label: "Core", emoji: "🎯" },
  Cardio: { label: "Cardio", emoji: "❤️‍🔥" },
  Traps: { label: "Traps", emoji: "🧍" },
  Forearms: { label: "Forearms", emoji: "✊" },
  Other: { label: "Other", emoji: "⚙️" },
};

const SUBCAT_META: Record<string, TileMeta> = {
  Free: { label: "Free", emoji: "🏋️" },
  Machine: { label: "Machine", emoji: "🧩" },
  Cable: { label: "Cable", emoji: "🧵" },
  Smith: { label: "Smith", emoji: "🧱" },
  Plate: { label: "Plate", emoji: "🟦" },
  Bodyweight: { label: "Bodyweight", emoji: "🤸" },
  KB: { label: "Kettlebell", emoji: "🔔" },
  DB: { label: "Dumbbell", emoji: "🏋️‍♀️" },
  BB: { label: "Barbell", emoji: "🏋️‍♂️" },
  Other: { label: "Other", emoji: "⚙️" },
};

function parseGroup(group?: string): { cat: string; sub: string } {
  if (!group) return { cat: "Other", sub: "Other" };

  // Expected formats: "Chest (Machine)", "Legs (Free)", "Back (Cable)" etc.
  const m = group.match(/^(.+?)(?:\s*\((.+)\))?$/);
  const cat = (m?.[1] ?? "Other").trim() || "Other";
  const sub = (m?.[2] ?? "Other").trim() || "Other";

  // normalize common values
  const normCat = CATEGORY_META[cat] ? cat : cat; // allow custom, but keep as-is
  const normSub = SUBCAT_META[sub] ? sub : sub; // allow custom

  return { cat: normCat, sub: normSub };
}

function getCatMeta(cat: string): TileMeta {
  return CATEGORY_META[cat] ?? { label: cat, emoji: "⚙️" };
}

function getSubMeta(sub: string): TileMeta {
  return SUBCAT_META[sub] ?? { label: sub, emoji: "⚙️" };
}

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
  const [cat, setCat] = React.useState<string | null>(null);
  const [sub, setSub] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTab("recent");
    setQ("");
    setCat(null);
    setSub(null);
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

  // categories from ALL dataset (not filtered base)
  const categoryCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of exercises) {
      const { cat } = parseGroup(e.group);
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    const arr = [...map.entries()]
      .map(([key, count]) => ({ key, count, meta: getCatMeta(key) }))
      .sort((a, b) => b.count - a.count);

    // "Other" last
    arr.sort((a, b) => (a.key === "Other" ? 1 : b.key === "Other" ? -1 : 0));
    return arr;
  }, [exercises]);

  // subcategories for chosen cat (from ALL dataset)
  const subcategoryCounts = React.useMemo(() => {
    if (!cat) return [];
    const map = new Map<string, number>();
    for (const e of exercises) {
      const g = parseGroup(e.group);
      if (g.cat !== cat) continue;
      map.set(g.sub, (map.get(g.sub) ?? 0) + 1);
    }
    const arr = [...map.entries()]
      .map(([key, count]) => ({ key, count, meta: getSubMeta(key) }))
      .sort((a, b) => b.count - a.count);

    // "Other" last
    arr.sort((a, b) => (a.key === "Other" ? 1 : b.key === "Other" ? -1 : 0));
    return arr;
  }, [exercises, cat]);

  const list = React.useMemo(() => {
    let candidate = base;

    // Apply category/subcategory filters only in ALL tab
    if (tab === "all" && cat) {
      candidate = candidate.filter((e) => parseGroup(e.group).cat === cat);
    }
    if (tab === "all" && cat && sub) {
      candidate = candidate.filter((e) => parseGroup(e.group).sub === sub);
    }

    // Search always applies
    const qq = q.trim().toLowerCase();
    if (qq) candidate = candidate.filter((e) => e.name.toLowerCase().includes(qq));

    return candidate;
  }, [base, tab, cat, sub, q]);

  const showCategoryGrid = tab === "all" && !q.trim() && !cat;
  const showSubcategoryGrid =
    tab === "all" && !q.trim() && !!cat && !sub && subcategoryCounts.length > 1;

  const headerTitle =
    tab === "all" && cat && sub
      ? `${getCatMeta(cat).label} · ${getSubMeta(sub).label}`
      : tab === "all" && cat
        ? `${getCatMeta(cat).label}`
        : "Gyakorlat hozzáadása";

  const backAction = () => {
    if (sub) return setSub(null);
    if (cat) return setCat(null);
    return onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />

      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md pb-[env(safe-area-inset-bottom)]">
        <div className="rounded-t-3xl border border-white/10 bg-zinc-950/90 backdrop-blur p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-white">{headerTitle}</div>

            <div className="flex gap-2">
              {(tab === "all" && (cat || sub)) ? (
                <button
                  onClick={backAction}
                  className="rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                >
                  Back
                </button>
              ) : null}

              <button
                onClick={onClose}
                className="rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                Bezár
              </button>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { setTab("recent"); setCat(null); setSub(null); }}
              className={`flex-1 rounded-xl px-3 py-2 text-sm ${
                tab === "recent" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => { setTab("favorites"); setCat(null); setSub(null); }}
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

          {/* CATEGORY GRID */}
          {showCategoryGrid ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {categoryCounts.map(({ key, count, meta }) => (
                <button
                  key={key}
                  onClick={() => { setCat(key); setSub(null); }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 active:scale-[0.99] transition"
                >
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/15 transition" />
                  <div className="flex items-center justify-between">
                    <div className="text-xl">{meta.emoji}</div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                      {count}
                    </div>
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">{meta.label}</div>
                </button>
              ))}
            </div>
          ) : showSubcategoryGrid ? (
            // SUBCATEGORY GRID
            <div className="mt-3 grid grid-cols-2 gap-3">
              {subcategoryCounts.map(({ key, count, meta }) => (
                <button
                  key={key}
                  onClick={() => setSub(key)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 active:scale-[0.99] transition"
                >
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/15 transition" />
                  <div className="flex items-center justify-between">
                    <div className="text-xl">{meta.emoji}</div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                      {count}
                    </div>
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">{meta.label}</div>
                </button>
              ))}
            </div>
          ) : (
            // LIST VIEW
            <div className="mt-3 max-h-[55vh] overflow-auto rounded-2xl border border-white/10">
              {list.length === 0 ? (
                <div className="p-4 text-sm text-white/60">Nincs találat.</div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {list.map((e) => {
                    const isFav = favorites.includes(e.id);
                    const g = parseGroup(e.group);
                    return (
                      <li key={e.id} className="flex items-center gap-3 p-3">
                        <button onClick={() => onPick(e)} className="flex-1 text-left">
                          <div className="text-sm font-medium text-white">{e.name}</div>
                          <div className="text-xs text-white/50">
                            {g.cat}{g.sub && g.sub !== "Other" ? ` · ${g.sub}` : ""}
                          </div>
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
          )}
        </div>
      </div>
    </div>
  );
}
