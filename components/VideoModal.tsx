"use client";
import * as React from "react";
import type { ExerciseVideo, ExerciseClip } from "@/lib/exercises";

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function clipDuration(clip: ExerciseClip): string {
  if (clip.start == null && clip.end == null) return "";
  const from = clip.start != null ? fmtTime(clip.start) : "0:00";
  const to   = clip.end   != null ? fmtTime(clip.end)   : "végig";
  return `${from} – ${to}`;
}

export function VideoModal({
  clips,
  title,
  onClose,
}: {
  clips: ExerciseVideo;   // ExerciseClip[]
  title: string;
  onClose: () => void;
}) {
  const [active, setActive] = React.useState(0);

  // ESC billentyű
  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const clip = clips[active];

  const embedUrl = React.useMemo(() => {
    const p = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1" });
    if (clip.start != null) p.set("start", String(clip.start));
    if (clip.end   != null) p.set("end",   String(clip.end));
    return `https://www.youtube.com/embed/${clip.videoId}?${p.toString()}`;
  }, [clip]);

  const multiClip = clips.length > 1;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>

      {/* Backdrop */}
      <button className="absolute inset-0" aria-label="Bezár"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)" }}
        onClick={onClose} />

      <div className="relative w-full max-w-md" style={{ animation: "fadeSlideUp .22s ease" }}>

        {/* ── Fejléc ── */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: "var(--accent-primary)" }}>▶ VIDEÓ</div>
            <div className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              {title}
            </div>
            {/* Aktív klip időtartama */}
            {clipDuration(clip) && (
              <div className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span className="mr-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)" }}>
                  ✂ klip
                </span>
                {clipDuration(clip)}
              </div>
            )}
          </div>
          <button onClick={onClose}
            className="shrink-0 grid h-9 w-9 place-items-center rounded-full text-sm pressable"
            style={{ background:"var(--surface-2)", color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>

        {/* ── Klip választó (csak ha több klip van) ── */}
        {multiClip && (
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {clips.map((c, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold pressable transition-all"
                style={i === active ? {
                  background: "var(--accent-primary)",
                  color: "#000",
                } : {
                  background:"var(--surface-2)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}>
                <div>{i + 1}. {c.label}</div>
                {clipDuration(c) && (
                  <div className="mt-0.5 text-[10px] opacity-70">{clipDuration(c)}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── YouTube embed 16:9 ── */}
        <div className="overflow-hidden rounded-3xl"
          style={{ border: "1px solid var(--border-mid)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {/* key={active} → minden klipváltásnál újra mountolja az iframe-et → autoplay */}
            <iframe key={`${clip.videoId}-${active}`}
              className="absolute inset-0 h-full w-full"
              src={embedUrl}
              title={`${title} – ${clip.label}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
        </div>

        {/* ── Navigáció (előző / következő) ── */}
        {multiClip && (
          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => setActive(a => Math.max(0, a - 1))}
              disabled={active === 0}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold pressable"
              style={{ background:"var(--surface-1)", color: active === 0 ? "var(--text-muted)" : "var(--text-primary)", border: "1px solid var(--border-subtle)", opacity: active === 0 ? 0.4 : 1 }}>
              ← Előző
            </button>
            <div className="text-xs font-bold px-2" style={{ color: "var(--text-muted)" }}>
              {active + 1} / {clips.length}
            </div>
            <button onClick={() => setActive(a => Math.min(clips.length - 1, a + 1))}
              disabled={active === clips.length - 1}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold pressable"
              style={{ background:"var(--surface-1)", color: active === clips.length - 1 ? "var(--text-muted)" : "var(--text-primary)", border: "1px solid var(--border-subtle)", opacity: active === clips.length - 1 ? 0.4 : 1 }}>
              Következő →
            </button>
          </div>
        )}

        {/* ── YouTube link ── */}
        <a href={`https://www.youtube.com/watch?v=${clip.videoId}${clip.start != null ? `&t=${clip.start}s` : ""}`}
          target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm pressable"
          style={{ background:"var(--surface-1)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          ↗ Megnyitás YouTube-on
        </a>
      </div>
    </div>
  );
}
