"use client";

import * as React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
};

export function BootScreen({
  title = "Gym",
  subtitle = "Betöltés…",
  backgroundImage = "/boot/gym-bg.jpg",
}: Props) {
  const lines = React.useMemo(
    () => ["Profil betöltése…", "Edzések előkészítése…", "Szinkron ellenőrzés…", "Készülünk…"],
    []
  );
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    const t = window.setInterval(() => setI((x) => (x + 1) % lines.length), 900);
    return () => window.clearInterval(t);
  }, [lines.length]);

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden text-white"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* KÉP háttér */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* overlay + vignette */}
      <div className="pointer-events-none absolute inset-0 bg-black/55" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_600px_at_50%_30%,transparent_35%,rgba(0,0,0,0.88)_80%)]" />

      {/* tartalom */}
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-between px-5 pb-8 pt-16">
        <div />

        <div>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <span className="text-xl font-semibold tracking-tight">
              {title.slice(0, 1).toUpperCase()}
            </span>
          </div>

          <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-center text-sm text-white/60">{subtitle}</p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/60 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/60 [animation-delay:300ms]" />
          </div>

          <div className="mt-4 text-center text-xs text-white/55">{lines[i]}</div>
        </div>

        <div className="text-center text-[11px] text-white/25">offline-first • local profiles • cloud optional</div>
      </div>
    </div>
  );
}
