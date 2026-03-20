"use client";

import * as React from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  THEMES,
  type ColorMode,
  type ThemeId,
  isLightColor,
  LS_CUSTOM_HEX,
} from "@/lib/theme";

// ─── Mode Toggle ────────────────────────────────────────────────────────────
function ModeToggle({ value, onChange }: {
  value: ColorMode;
  onChange: (m: ColorMode) => void;
}) {
  const modes: { id: ColorMode; label: string; icon: string }[] = [
    { id: "dark",   label: "Sötét",    icon: "🌙" },
    { id: "light",  label: "Világos",  icon: "☀️" },
    { id: "system", label: "Rendszer", icon: "💻" },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-2xl"
      style={{ background: "var(--surface-1)" }}>
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-250"
          style={value === m.id ? {
            background: "var(--accent-primary)",
            color: "#000",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          } : {
            background: "transparent",
            color: "var(--text-muted)",
          }}
        >
          <span className="text-sm">{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ─── Accent Grid ────────────────────────────────────────────────────────────
function AccentGrid({ value, onChange }: {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {THEMES.map(t => {
        const active = value === t.id;
        const light = isLightColor(t.hex);
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            title={t.name}
            className="aspect-square rounded-2xl transition-all duration-200 relative pressable"
            style={{
              background: t.hex,
              border: active
                ? `2.5px solid var(--text-primary)`
                : "2.5px solid transparent",
              transform: active ? "scale(1.05)" : "scale(1)",
            }}
          >
            {active && (
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black"
                style={{ color: light ? "#000" : "#fff" }}>
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Custom Color Picker ────────────────────────────────────────────────────
function CustomColorPicker({ active, hex, onChange }: {
  active: boolean;
  hex: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 mt-3">
      <input
        type="color"
        value={hex}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-8 rounded-xl border-0 cursor-pointer"
        style={{
          background: "transparent",
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />
      <span className="text-xs flex-1"
        style={{ color: "var(--text-secondary)" }}>
        Egyedi szín
      </span>
      <span className="text-[11px] font-mono px-2 py-1 rounded-lg"
        style={{
          background: "var(--surface-1)",
          color: active ? "var(--accent-primary)" : "var(--text-muted)",
          border: active ? "1px solid var(--accent-primary-border)" : "1px solid transparent",
        }}>
        {hex}
      </span>
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
      <div className="px-4 pt-4 pb-2">
        <div className="label-xs" style={{ color: "var(--text-muted)" }}>{title}</div>
      </div>
      <div className="px-4 pb-4 space-y-3">{children}</div>
    </div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────
export function ThemeCustomizer() {
  const { colorMode, themeId, setColorMode, setTheme } = useTheme();
  const [customHex, setCustomHex] = React.useState(() => {
    if (typeof window === "undefined") return "#22d3ee";
    return localStorage.getItem(LS_CUSTOM_HEX) ?? "#22d3ee";
  });

  const handleAccentChange = React.useCallback((id: ThemeId) => {
    setTheme(id);
  }, [setTheme]);

  const handleCustomHex = React.useCallback((hex: string) => {
    setCustomHex(hex);
    setTheme("custom", hex);
  }, [setTheme]);

  return (
    <div className="space-y-4">
      {/* Color Mode */}
      <Section title="Megjelenés">
        <ModeToggle value={colorMode} onChange={setColorMode} />
      </Section>

      {/* Accent Color */}
      <Section title="Szín téma">
        <AccentGrid value={themeId} onChange={handleAccentChange} />
        <CustomColorPicker
          active={themeId === "custom"}
          hex={customHex}
          onChange={handleCustomHex}
        />
      </Section>
    </div>
  );
}
