"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

export function BottomNav() {
  const path = usePathname();
  const { t } = useTranslation();

  const items = [
    {
      label: t.nav.home,
      href: "/",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      ),
    },
    {
      label: t.nav.workout,
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
      label: t.nav.calendar,
      href: "/calendar",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
          <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>
        </svg>
      ),
    },
    {
      label: t.nav.exercises ?? "Gyakorlatok",
      href: "/exercises",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16"/>
          <circle cx="20" cy="6" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="20" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="20" cy="18" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      ),
    },
    {
      label: t.nav.profile,
      href: "/profile",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-3">
        <div className="mb-3 rounded-2xl shadow-2xl nav-glass"
          style={{
            background:"var(--nav-bg)",
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:"1px solid var(--border-subtle)",
            boxShadow: '0 -1px 0 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)',
          }}>
          <div className="flex items-center justify-between px-2 py-2">
            {items.map((it) => {
              const active = path === it.href || (it.href !== "/" && it.href !== "/exercises" && path.startsWith(it.href)) || (it.href === "/exercises" && (path === "/exercises" || path.startsWith("/exercises?")));
              return (
                <Link key={it.href} href={it.href}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all duration-200"
                  style={{ color: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.45)' }}>
                  <span className="relative flex items-center justify-center rounded-xl transition-all duration-200"
                    style={{ background: active ? 'rgba(34,211,238,0.12)' : 'transparent', padding: '6px' }}>
                    {it.icon(active)}
                    {active && (
                      <span className="absolute inset-0 rounded-xl"
                        style={{ boxShadow: '0 0 12px 2px rgba(34,211,238,0.2)', pointerEvents: 'none' }} />
                    )}
                  </span>
                  <span className="text-[10px] font-medium transition-all duration-200"
                    style={{ color: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.35)', letterSpacing: active ? '0.02em' : '0' }}>
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
