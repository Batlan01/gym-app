"use client";

import Link from "next/link";

export function Tile({
  title,
  subtitle,
  href,
  accent,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  accent?: "cyan" | "green" | "amber";
}) {
  const accentColor = {
    cyan:  { glow: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.2)',  dot: '#22d3ee' },
    green: { glow: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.2)',  dot: '#4ade80' },
    amber: { glow: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.2)',  dot: '#fbbf24' },
  }[accent ?? "cyan"];

  const inner = (
    <div
      className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98]"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border-subtle)`,
        minHeight: '96px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)';
        (e.currentTarget as HTMLDivElement).style.borderColor = accentColor.border;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* accent glow blob */}
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full blur-2xl transition-opacity duration-300 opacity-60 group-hover:opacity-100"
        style={{ background: accentColor.glow }}
      />

      {/* accent dot */}
      <div
        className="mb-3 h-1.5 w-5 rounded-full"
        style={{ background: accentColor.dot, opacity: 0.8 }}
      />

      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        {subtitle ?? "—"}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{inner}</Link>;
  }
  return <button type="button" className="block w-full text-left">{inner}</button>;
}
