"use client";

import * as React from "react";
import {
  type ColorMode,
  type ThemeId,
  applyColorMode,
  applyTheme,
  loadSavedTheme,
  getSavedColorMode,
  getSavedThemeId,
} from "@/lib/theme";

interface ThemeCtx {
  colorMode: ColorMode;
  themeId: ThemeId;
  setColorMode: (m: ColorMode) => void;
  setTheme: (id: ThemeId, customHex?: string) => void;
}

const ThemeContext = React.createContext<ThemeCtx>({
  colorMode: "dark",
  themeId: "cyan",
  setColorMode: () => {},
  setTheme: () => {},
});

export const useTheme = () => React.useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = React.useState<ColorMode>("dark");
  const [themeId, setThemeIdState] = React.useState<ThemeId>("cyan");

  // Initial load
  React.useEffect(() => {
    loadSavedTheme();
    setColorModeState(getSavedColorMode());
    setThemeIdState(getSavedThemeId());
  }, []);

  const setColorMode = React.useCallback((m: ColorMode) => {
    applyColorMode(m);
    setColorModeState(m);
  }, []);

  const setTheme = React.useCallback((id: ThemeId, customHex?: string) => {
    applyTheme(id, customHex);
    setThemeIdState(id);
  }, []);

  const value = React.useMemo(
    () => ({ colorMode, themeId, setColorMode, setTheme }),
    [colorMode, themeId, setColorMode, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
