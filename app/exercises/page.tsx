import * as React from "react";
import ExercisesClient from "./ExercisesClient";

export default function ExercisesPage() {
  return (
    <React.Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 pt-5 pb-28">
          <div className="text-xs tracking-widest text-white/50">GYAKORLATOK</div>
          <h1 className="mt-1 text-2xl font-bold text-white">Katalógus</h1>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Betöltés…
          </div>
        </main>
      }
    >
      <ExercisesClient />
    </React.Suspense>
  );
}
