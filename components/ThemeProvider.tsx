"use client";

import * as React from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme | null) ?? null;
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
    applyTheme(initial);
  }, []);

  return <>{children}</>;
}
