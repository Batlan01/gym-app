"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Tile } from "@/components/Tile";
import { VideoModal } from "@/components/VideoModal";
import { EXERCISES, EXERCISE_VIDEOS } from "@/lib/exercises";

type AnyExercise = (typeof EXERCISES)[number];

function pickGroup(ex: AnyExercise): string {
  const a: any = ex;
  return a.subcategory ?? a.group ?? a.muscleGroup ?? a.muscle ?? a.category ?? a.area ?? "Egyéb";
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

// Csoportonkénti ikon
const GROUP_ICONS: Record<string, string> = {
  "Chest": "💪", "Back": "🔙", "Legs": "🦵", "Shoulders": "🏋️",
  "Arms": "💪", "Core": "🎯", "Cardio": "❤️", "Glutes": "🍑",
};
function groupIcon(g: string) {
  for (const [k, v] of Object.entries(GROUP_ICONS)) {
    if (g.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "⚡";
}

export default function ExercisesClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const group = sp.get("g");
  const [q, setQ] = React.useState("");
  const [video, setVideo] = React.useState<{ id: string; title: string } | null>(null);

  const groups = React.useMemo(() => {
    const set = new Set<string>();
    for (const ex of EXERCISES) set.add(pickGroup(ex));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  }, []);

  const filtered = React.useMemo(() => {
    const base = group ? EXERCISES.filter(ex => pickGroup(ex) === group) : EXERCISES;
    const qq = normalize(q.trim());
    return qq ? base.filter((ex: any) => normalize(ex.name ?? "").includes(qq)) : base;
  }, [group, q]);

  const videoCount = React.useMemo(() =>
    filtered.filter(ex => EXERCISE_VIDEOS[ex.id]).length, [filtered]);

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
      <div className="flex-1 pb-32 animate-in">

        {/* Sticky header */}
        <div className="sticky top-0 z-40 px-4 pt-5 pb-3"
          style={{ background: "rgba(8,11,15,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="label-xs mb-1">GYAKORLATOK</div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              {group ?? "Katalógus"}
            </h1>
            {group ? (
              <button onClick={() => router.push("/exercises")}
                className="rounded-2xl px-3 py-2 text-sm pressable"
                style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                ← Vissza
              </button>
            ) : null}
          </div>

          {group && (
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "var(--text-muted)" }}>🔍</span>
                <input value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Keresés…"
                  className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
              </div>
            </div>
          )}

          {group && (
            <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>{filtered.length} gyakorlat</span>
              {videoCount > 0 && (
                <span style={{ color: "var(--accent-primary)" }}>▶ {videoCount} videó elérhető</span>
              )}
            </div>
          )}
        </div>

        {/* Tartalmi terület */}
        <div className="px-4 pt-4">
          {!group ? (
            /* Csoport tile grid */
            <section className="grid grid-cols-2 gap-3">
              {groups.map(g => {
                const count = EXERCISES.filter(ex => pickGroup(ex) === g).length;
                const vCount = EXERCISES.filter(ex => pickGroup(ex) === g && EXERCISE_VIDEOS[ex.id]).length;
                return (
                  <button key={g} onClick={() => router.push(`/exercises?g=${encodeURIComponent(g)}`)}
                    className="relative overflow-hidden rounded-2xl p-4 text-left pressable"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", minHeight: 90 }}>
                    <div className="text-xl mb-2">{groupIcon(g)}</div>
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{g}</div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      {count} gyak{vCount > 0 ? ` · ▶ ${vCount}` : ""}
                    </div>
                  </button>
                );
              })}
            </section>
          ) : (
            /* Gyakorlat lista */
            <section className="space-y-2">
              {filtered.length === 0 ? (
                <div className="rounded-2xl py-10 text-center text-sm"
                  style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  Nincs találat
                </div>
              ) : filtered.map((ex: any) => {
                const vid = EXERCISE_VIDEOS[ex.id];
                return (
                  <div key={ex.id}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    {/* Bal: info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {ex.name}
                      </div>
                      <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {pickGroup(ex)}
                      </div>
                    </div>

                    {/* Jobb: videó gomb ha van */}
                    {vid ? (
                      <button onClick={() => setVideo({ id: vid, title: ex.name })}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold pressable"
                        style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.25)" }}>
                        ▶ Videó
                      </button>
                    ) : (
                      <div className="shrink-0 w-16" /> 
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </div>

      {/* Video modal */}
      {video && (
        <VideoModal videoId={video.id} title={video.title} onClose={() => setVideo(null)} />
      )}

      <BottomNav />
    </div>
  );
}
