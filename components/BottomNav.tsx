"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    label: "Home",
    href: "/",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    label: "Edzés",
    href: "/workout",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h1M16.5 6.5h1M6.5 17.5h1M16.5 17.5h1"/>
        <rect x="8" y="5" width="8" height="14" rx="2"/>
        <path d="M2 9v6M22 9v6"/>
      </svg>
    ),
  },
  {
    label: "Programok",
    href: "/programs",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    label: "Gyakorlat",
    href: "/exercises",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h2m12 0h2M7 12a5 5 0 0 1 10 0"/>
        <circle cx="5" cy="12" r="1.5"/>
        <circle cx="19" cy="12" r="1.5"/>
        <path d="M7 9v6M17 9v6"/>
      </svg>
    ),
  },
  {
    label: "Beáll.",
    href: "/settings",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-3">
        <div
          className="mb-3 rounded-2xl shadow-2xl"
          style={{
            background: 'rgba(10,14,20,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 -1px 0 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center justify-between px-2 py-2">
            {items.map((it) => {
              const active = path === it.href || (it.href !== "/" && path.startsWith(it.href));
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all duration-200"
                  style={{
                    color: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <span
                    className="relative flex items-center justify-center rounded-xl transition-all duration-200"
                    style={{
                      background: active ? 'rgba(34,211,238,0.12)' : 'transparent',
                      padding: '6px',
                    }}
                  >
                    {it.icon(active)}
                    {active && (
                      <span
                        className="absolute inset-0 rounded-xl"
                        style={{
                          boxShadow: '0 0 12px 2px rgba(34,211,238,0.2)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </span>
                  <span
                    className="text-[10px] font-medium transition-all duration-200"
                    style={{
                      color: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.35)',
                      letterSpacing: active ? '0.02em' : '0',
                    }}
                  >
                    {it.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
