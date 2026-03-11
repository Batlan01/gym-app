// lib/theme.ts
export type ThemeId = "cyan" | "purple" | "orange" | "green" | "rose";
export type ColorMode = "dark" | "light";

export type ThemeDef = {
  id: ThemeId;
  name: string;
  emoji: string;
  vars: Record<string, string>;
};

export const THEMES: ThemeDef[] = [
  {
    id: "cyan", name: "Ocean", emoji: "🩵",
    vars: { "--accent-primary": "#22d3ee", "--accent-primary-dim": "rgba(34,211,238,0.15)", "--accent-primary-border": "rgba(34,211,238,0.3)" },
  },
  {
    id: "purple", name: "Neon", emoji: "💜",
    vars: { "--accent-primary": "#a78bfa", "--accent-primary-dim": "rgba(167,139,250,0.15)", "--accent-primary-border": "rgba(167,139,250,0.3)" },
  },
  {
    id: "orange", name: "Fire", emoji: "🔥",
    vars: { "--accent-primary": "#fb923c", "--accent-primary-dim": "rgba(251,146,60,0.15)", "--accent-primary-border": "rgba(251,146,60,0.3)" },
  },
  {
    id: "green", name: "Forest", emoji: "💚",
    vars: { "--accent-primary": "#4ade80", "--accent-primary-dim": "rgba(74,222,128,0.15)", "--accent-primary-border": "rgba(74,222,128,0.3)" },
  },
  {
    id: "rose", name: "Rose", emoji: "🌸",
    vars: { "--accent-primary": "#fb7185", "--accent-primary-dim": "rgba(251,113,133,0.15)", "--accent-primary-border": "rgba(251,113,133,0.3)" },
  },
];

export const LS_THEME = "gym.theme";
export const LS_COLOR_MODE = "gym.colorMode";

export function applyTheme(themeId: ThemeId) {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const root = document.documentElement;
  for (const [key, val] of Object.entries(theme.vars)) {
    root.style.setProperty(key, val);
  }
  localStorage.setItem(LS_THEME, themeId);
}

export function applyColorMode(mode: ColorMode) {
  document.documentElement.setAttribute("data-mode", mode);
  localStorage.setItem(LS_COLOR_MODE, mode);
}

export function loadSavedTheme() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem(LS_THEME) as ThemeId | null;
  if (saved) applyTheme(saved);
  const mode = (localStorage.getItem(LS_COLOR_MODE) as ColorMode | null) ?? "dark";
  applyColorMode(mode);
}
