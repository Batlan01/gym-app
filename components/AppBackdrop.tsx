"use client";

import * as React from "react";

export function AppBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* háttérkép */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* sötét réteg az olvashatóságért */}
      <div className="absolute inset-0 bg-black/35" />

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_50%_35%,transparent_30%,rgba(0,0,0,0.90)_85%)]" />
    </div>
  );
}
