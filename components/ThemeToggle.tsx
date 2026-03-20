"use client";

import * as React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { resolveColorMode } from "@/lib/theme";

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M21 14.5A7.5 7.5 0 0 1 9.5 3a6.5 6.5 0 1 0 11.5 11.5Z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function ThemeToggle() {
  const { colorMode, setColorMode } = useTheme();

  const onClick = React.useCallback(() => {
    const resolved = resolveColorMode(colorMode);
    setColorMode(resolved === "dark" ? "light" : "dark");
  }, [colorMode, setColorMode]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-95"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-primary)",
      }}
      aria-label="Téma váltása"
      title="Téma váltása"
    >
      <SunIcon className="h-5 w-5 hidden dark:block" />
      <MoonIcon className="h-5 w-5 block dark:hidden" />
    </button>
  );
}
