// lib/theme.ts — ARCX Unified Flat Theme Engine
// Manages: color mode (dark/light/system) + accent color (preset or custom)

export type ColorMode = "dark" | "light" | "system";
export type ThemeId =
  | "cyan" | "purple" | "orange" | "green" | "rose"
  | "blue" | "amber" | "indigo" | "emerald" | "red"
  | "custom";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  emoji: string;
  hex: string;
}

export const THEMES: ThemeDef[] = [
  { id: "cyan",    name: "Ocean",   emoji: "🩵", hex: "#22d3ee" },
  { id: "purple",  name: "Neon",    emoji: "💜", hex: "#a78bfa" },
  { id: "orange",  name: "Fire",    emoji: "🔥", hex: "#fb923c" },
  { id: "green",   name: "Forest",  emoji: "💚", hex: "#4ade80" },
  { id: "rose",    name: "Rose",    emoji: "🌸", hex: "#fb7185" },
  { id: "blue",    name: "Royal",   emoji: "💙", hex: "#60a5fa" },
  { id: "amber",   name: "Gold",    emoji: "✨", hex: "#fbbf24" },
  { id: "indigo",  name: "Indigo",  emoji: "🔮", hex: "#818cf8" },
  { id: "emerald", name: "Emerald", emoji: "🟢", hex: "#34d399" },
  { id: "red",     name: "Ruby",    emoji: "❤️", hex: "#f87171" },
];

// ─── LocalStorage keys ──────────────────────────────────────────────────────
export const LS_THEME      = "gym.theme";       // ThemeId
export const LS_COLOR_MODE = "gym.colorMode";   // ColorMode
export const LS_CUSTOM_HEX = "gym.customHex";   // hex string for custom

// ─── Helpers ────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Is the color perceptually light? Used for text contrast. */
export function isLightColor(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150;
}

/** Derive all accent CSS vars from a single hex */
function accentVarsFromHex(hex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(hex);
  return {
    "--accent-primary":       hex,
    "--accent-primary-dim":   `rgba(${r},${g},${b},0.12)`,
    "--accent-primary-border":`rgba(${r},${g},${b},0.25)`,
    "--accent-primary-ring":  `rgba(${r},${g},${b},0.35)`,
    "--accent-primary-solid": `rgba(${r},${g},${b},0.90)`,
  };
}

// ─── Apply functions ────────────────────────────────────────────────────────
export function applyAccent(hex: string) {
  const root = document.documentElement;
  const vars = accentVarsFromHex(hex);
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }
}

export function applyTheme(themeId: ThemeId, customHex?: string) {
  if (themeId === "custom" && customHex) {
    applyAccent(customHex);
    localStorage.setItem(LS_THEME, "custom");
    localStorage.setItem(LS_CUSTOM_HEX, customHex);
  } else {
    const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
    applyAccent(theme.hex);
    localStorage.setItem(LS_THEME, themeId);
  }
}

export function resolveColorMode(mode: ColorMode): "dark" | "light" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }
  return mode;
}

export function applyColorMode(mode: ColorMode) {
  const resolved = resolveColorMode(mode);
  const root = document.documentElement;
  root.setAttribute("data-mode", resolved);
  // Also manage the Tailwind `dark` class for compatibility
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem(LS_COLOR_MODE, mode);
}

/** Called once on app boot (client-side) */
export function loadSavedTheme() {
  if (typeof window === "undefined") return;

  // Color mode
  const savedMode = (localStorage.getItem(LS_COLOR_MODE) as ColorMode | null) ?? "dark";
  applyColorMode(savedMode);

  // Listen for system theme changes when mode is "system"
  if (savedMode === "system") {
    window.matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => applyColorMode("system"));
  }

  // Accent theme
  const savedTheme = localStorage.getItem(LS_THEME) as ThemeId | null;
  if (savedTheme === "custom") {
    const hex = localStorage.getItem(LS_CUSTOM_HEX) ?? "#22d3ee";
    applyAccent(hex);
  } else if (savedTheme) {
    const theme = THEMES.find(t => t.id === savedTheme);
    if (theme) applyAccent(theme.hex);
  }
}

/** Current accent hex (reads from DOM) */
export function getCurrentAccentHex(): string {
  if (typeof window === "undefined") return "#22d3ee";
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-primary").trim() || "#22d3ee";
}

/** Current color mode from localStorage */
export function getSavedColorMode(): ColorMode {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(LS_COLOR_MODE) as ColorMode | null) ?? "dark";
}

/** Current theme id from localStorage */
export function getSavedThemeId(): ThemeId {
  if (typeof window === "undefined") return "cyan";
  return (localStorage.getItem(LS_THEME) as ThemeId | null) ?? "cyan";
}
