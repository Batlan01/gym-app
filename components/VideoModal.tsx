"use client";

import * as React from "react";

export function VideoModal({
  videoId,
  title,
  onClose,
}: {
  videoId: string;
  title: string;
  onClose: () => void;
}) {
  // ESC billentyű
  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Backdrop */}
      <button className="absolute inset-0" aria-label="Bezár"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
        onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in">
        {/* Fejléc */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: "var(--accent-primary)" }}>VIDEÓ</div>
            <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {title}
            </div>
          </div>
          <button onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-sm pressable"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>

        {/* YouTube embed — 16:9 */}
        <div className="overflow-hidden rounded-3xl"
          style={{ border: "1px solid var(--border-mid)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* YouTube link */}
        <a href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm pressable"
          style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
          <span>▶</span> Megnyitás YouTube-on
        </a>
      </div>
    </div>
  );
}
