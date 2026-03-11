"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { VideoModal } from "@/components/VideoModal";
import { EXERCISES, EXERCISE_VIDEOS, type ExerciseVideo } from "@/lib/exercises";
import {
  readCustomExercises,
  saveCustomExercise,
  deleteCustomExercise,
  makeCustomExercise,
  type CustomExercise,
} from "@/lib/customExercises";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";

// ── helpers ─────────────────────────────────────────────────────────────────
type AnyExercise = (typeof EXERCISES)[number];

function pickGroup(ex: AnyExercise): string {
  const a: any = ex;
  return a.subcategory ?? a.group ?? a.muscleGroup ?? a.muscle ?? a.category ?? a.area ?? "Egyéb";
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

const GROUP_ICONS: Record<string, string> = {
  Chest: "💪", Back: "🔙", Legs: "🦵", Shoulders: "🏋️",
  Arms: "💪", Core: "🎯", Cardio: "❤️", Glutes: "🍑",
  Traps: "🧍", Forearms: "✊", Custom: "⭐",
};
function groupIcon(g: string) {
  for (const [k, v] of Object.entries(GROUP_ICONS)) {
    if (g.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "⚡";
}

// ── Custom Exercise Form ──────────────────────────────────────────────────
function CustomExerciseForm({
  onSave, onCancel, initial,
}: {
  onSave: (name: string, description: string, youtubeUrl: string) => void;
  onCancel: () => void;
  initial?: { name: string; description: string; youtubeUrl: string };
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [desc, setDesc] = React.useState(initial?.description ?? "");
  const [yt, setYt] = React.useState(initial?.youtubeUrl ?? "");
  const [err, setErr] = React.useState("");

  return (
    <div className="rounded-3xl p-4 space-y-3"
      style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.2)" }}>
      <div className="text-xs font-bold tracking-widest" style={{ color: "var(--accent-primary)" }}>
        {initial ? "✎ SZERKESZTÉS" : "✚ ÚJ SAJÁT GYAKORLAT"}
      </div>

      <input value={name} onChange={e => { setName(e.target.value); setErr(""); }}
        placeholder="Gyakorlat neve *"
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />

      <textarea value={desc} onChange={e => setDesc(e.target.value)}
        placeholder="Leírás, technika tippek… (opcionális)" rows={3}
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />

      <input value={yt} onChange={e => setYt(e.target.value)}
        placeholder="YouTube link (opcionális, pl. https://youtu.be/...)"
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />

      {err && <div className="text-xs" style={{ color: "#f87171" }}>{err}</div>}

      <div className="flex gap-2 pt-1">
        <button onClick={() => {
          if (!name.trim()) { setErr("Kötelező megadni a nevet!"); return; }
          onSave(name.trim(), desc.trim(), yt.trim());
        }}
          className="flex-1 rounded-2xl py-3 text-sm font-bold pressable"
          style={{ background: "rgba(34,211,238,0.15)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.3)" }}>
          {initial ? "Mentés" : "+ Létrehozás"}
        </button>
        <button onClick={onCancel}
          className="rounded-2xl px-4 py-3 text-sm pressable"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          Mégse
        </button>
      </div>
    </div>
  );
}

// ── Builtin exercise row ──────────────────────────────────────────────────
function BuiltinRow({ ex, onVideo }: {
  ex: (typeof EXERCISES)[number];
  onVideo: (v: ExerciseVideo, title: string) => void;
}) {
  const vid = EXERCISE_VIDEOS[ex.id];
  const group = pickGroup(ex);
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ex.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{group}</div>
      </div>
      {vid ? (
        <button onClick={() => onVideo(vid, ex.name)}
          className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold pressable"
          style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.25)" }}>
          ▶ Videó
        </button>
      ) : (
        <div className="w-16 shrink-0" />
      )}
    </div>
  );
}

// ── Custom exercise row ───────────────────────────────────────────────────
function CustomRow({ ex, onEdit, onDelete, onVideo }: {
  ex: CustomExercise;
  onEdit: () => void;
  onDelete: () => void;
  onVideo: (v: ExerciseVideo, title: string) => void;
}) {
  // Parse YouTube video ID from URL
  const ytVideoId = React.useMemo(() => {
    if (!ex.youtubeUrl) return null;
    const m = ex.youtubeUrl.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
    return m?.[1] ?? null;
  }, [ex.youtubeUrl]);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid rgba(34,211,238,0.15)" }}>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{ex.name}</span>
            <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
              style={{ background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)" }}>SAJÁT</span>
          </div>
          {ex.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{ex.description}</p>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {ytVideoId && (
            <button onClick={() => onVideo([{ videoId: ytVideoId, label: "Videó" }], ex.name)}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-xs pressable"
              style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.25)" }}>
              ▶
            </button>
          )}
          <button onClick={onEdit}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-xs pressable"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
            ✎
          </button>
          <button onClick={onDelete}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-xs pressable"
            style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function ExercisesClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const groupParam = sp.get("g");
  const tabParam = (sp.get("tab") as "builtin" | "custom") ?? "builtin";

  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const pid = activeProfileId ?? "guest";

  const [tab, setTab] = React.useState<"builtin" | "custom">(tabParam);
  const [q, setQ] = React.useState("");
  const [group, setGroup] = React.useState<string | null>(groupParam);
  const [video, setVideo] = React.useState<{ clips: ExerciseVideo; title: string } | null>(null);

  // Custom exercises
  const [customs, setCustoms] = React.useState<CustomExercise[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<CustomExercise | null>(null);
  React.useEffect(() => { setCustoms(readCustomExercises(pid)); }, [pid]);

  // Groups for builtin tab
  const groups = React.useMemo(() => {
    const set = new Set<string>();
    for (const ex of EXERCISES) set.add(pickGroup(ex));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  }, []);

  const filtered = React.useMemo(() => {
    const base = group ? EXERCISES.filter(ex => pickGroup(ex) === group) : EXERCISES;
    const qq = normalize(q.trim());
    return qq ? base.filter(ex => normalize(ex.name).includes(qq)) : base;
  }, [group, q]);

  const filteredCustoms = React.useMemo(() => {
    const qq = normalize(q.trim());
    return qq ? customs.filter(ex => normalize(ex.name).includes(qq)) : customs;
  }, [customs, q]);

  const videoCount = React.useMemo(() => filtered.filter(ex => EXERCISE_VIDEOS[ex.id]).length, [filtered]);

  function handleSaveCustom(name: string, description: string, youtubeUrl: string) {
    if (editTarget) {
      const updated = { ...editTarget, name, description, youtubeUrl, updatedAt: Date.now() } as CustomExercise;
      saveCustomExercise(pid, updated);
      setEditTarget(null);
    } else {
      const ex = { ...makeCustomExercise(name, description), youtubeUrl } as CustomExercise;
      saveCustomExercise(pid, ex);
      setShowForm(false);
    }
    setCustoms(readCustomExercises(pid));
  }

  function handleDelete(id: string) {
    if (!confirm("Törlöd ezt a saját gyakorlatot?")) return;
    deleteCustomExercise(pid, id);
    setCustoms(readCustomExercises(pid));
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
      <div className="flex-1 pb-32 animate-in">

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-40 px-4 pt-5 pb-3"
          style={{ background:"var(--sticky-bg)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="label-xs mb-1">ARCX</div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              {tab === "custom" ? "Saját gyakorlatok" : group ?? "Gyakorlatok"}
            </h1>
            {tab === "builtin" && group && (
              <button onClick={() => { setGroup(null); setQ(""); }}
                className="rounded-2xl px-3 py-2 text-sm pressable"
                style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                ← Vissza
              </button>
            )}
          </div>

          {/* Tab váltó */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {(["builtin", "custom"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setQ(""); setGroup(null); }}
                className="rounded-2xl py-2.5 text-sm font-bold pressable"
                style={tab === t
                  ? { background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.3)" }
                  : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                {t === "builtin" ? "📚 Katalógus" : "⭐ Saját"}
              </button>
            ))}
          </div>

          {/* Kereső (ha már van csoport választva, vagy custom tab) */}
          {(tab === "custom" || group) && (
            <div className="mt-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>🔍</span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Keresés…"
                className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
            </div>
          )}

          {tab === "builtin" && group && (
            <div className="mt-1.5 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>{filtered.length} gyakorlat</span>
              {videoCount > 0 && <span style={{ color: "var(--accent-primary)" }}>▶ {videoCount} videó</span>}
            </div>
          )}
        </div>

        {/* ── BUILTIN TAB ── */}
        {tab === "builtin" && (
          <div className="px-4 pt-4">
            {!group ? (
              // Kategória grid
              <div className="grid grid-cols-2 gap-3">
                {groups.map(g => {
                  const count = EXERCISES.filter(ex => pickGroup(ex) === g).length;
                  const vCount = EXERCISES.filter(ex => pickGroup(ex) === g && EXERCISE_VIDEOS[ex.id]).length;
                  return (
                    <button key={g} onClick={() => setGroup(g)}
                      className="relative overflow-hidden rounded-2xl p-4 text-left pressable"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", minHeight: 90 }}>
                      <div className="text-xl mb-2">{groupIcon(g)}</div>
                      <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{g}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        {count} gyak{vCount > 0 ? ` · ▶ ${vCount} videó` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Gyakorlat lista
              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <div className="rounded-2xl py-10 text-sm text-center"
                    style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    Nincs találat
                  </div>
                ) : filtered.map(ex => (
                  <BuiltinRow key={ex.id} ex={ex}
                    onVideo={(v, t) => setVideo({ clips: v, title: t })} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CUSTOM TAB ── */}
        {tab === "custom" && (
          <div className="px-4 pt-4 space-y-3">

            {/* Create / Edit form */}
            {(showForm || editTarget) ? (
              <CustomExerciseForm
                initial={editTarget ? {
                  name: editTarget.name,
                  description: editTarget.description ?? "",
                  youtubeUrl: (editTarget as any).youtubeUrl ?? "",
                } : undefined}
                onSave={handleSaveCustom}
                onCancel={() => { setShowForm(false); setEditTarget(null); }}
              />
            ) : (
              <button onClick={() => setShowForm(true)}
                className="w-full rounded-3xl py-4 text-sm font-bold pressable flex items-center justify-center gap-2"
                style={{ background: "rgba(34,211,238,0.08)", color: "var(--accent-primary)", border: "1px dashed rgba(34,211,238,0.3)" }}>
                ✚ Új saját gyakorlat
              </button>
            )}

            {/* Lista */}
            {filteredCustoms.length === 0 && !showForm && !editTarget ? (
              <div className="rounded-3xl py-12 flex flex-col items-center justify-center text-center"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <div className="text-4xl mb-3">⭐</div>
                <div className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                  Még nincs saját gyakorlatod
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Hozz létre egyedi gyakorlatokat névvel, leírással és videólinkkel
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustoms.map(ex => (
                  <CustomRow key={ex.id} ex={ex}
                    onEdit={() => { setEditTarget(ex); setShowForm(false); }}
                    onDelete={() => handleDelete(ex.id)}
                    onVideo={(v, t) => setVideo({ clips: v, title: t })} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video modal */}
      {video && <VideoModal clips={video.clips} title={video.title} onClose={() => setVideo(null)} />}

      <BottomNav />
    </div>
  );
}
