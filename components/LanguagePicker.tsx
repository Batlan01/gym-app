"use client";
import * as React from "react";
import { LANGS, type Lang, setGlobalLang } from "@/lib/i18n";

type Props = {
  currentLang: Lang;
  onClose?: () => void;
};

/** Inline language picker — a Profile oldal Megjelenés tabjában */
export function LanguagePicker({ currentLang, onClose }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LANGS.map(l => {
        const active = l.id === currentLang;
        return (
          <button
            key={l.id}
            onClick={() => { setGlobalLang(l.id); onClose?.(); }}
            className="flex items-center gap-2.5 rounded-2xl px-4 py-3 pressable text-left"
            style={active
              ? { background: "var(--accent-primary)", color: "#000" }
              : { background:"var(--surface-1)", color: "var(--text-primary)" }
            }
          >
            <span className="text-xl leading-none">{l.flag}</span>
            <div>
              <div className="text-sm font-black leading-none">{l.label}</div>
              <div className="text-[10px] mt-0.5 opacity-50 uppercase tracking-wider">{l.id}</div>
            </div>
            {active && (
              <div className="ml-auto text-base font-black">✓</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
