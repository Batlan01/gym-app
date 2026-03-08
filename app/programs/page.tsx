// app/programs/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { PROGRAM_TEMPLATES, sportLabel, levelLabel } from "@/lib/programTemplates";
import type { SportTag, UserProgram, ProgramTemplate } from "@/lib/programsTypes";
import { createProgramFromTemplate, readPrograms, upsertProgram } from "@/lib/programsStorage";

// ── Gradient térkép ──────────────────────────────────────────
const GRADIENTS: Record<string, { from: string; glow: string; border: string }> = {
  emerald: { from: 'rgba(52,211,153,0.25)',  glow: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.25)' },
  sky:     { from: 'rgba(56,189,248,0.25)',  glow: 'rgba(56,189,248,0.15)',  border: 'rgba(56,189,248,0.25)' },
  ember:   { from: 'rgba(251,146,60,0.25)',  glow: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.25)' },
  violet:  { from: 'rgba(167,139,250,0.25)', glow: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.25)' },
  slate:   { from: 'rgba(148,163,184,0.15)', glow: 'rgba(148,163,184,0.08)', border: 'rgba(255,255,255,0.1)' },
};

const SPORT_ICONS: Record<string, string> = {
  gym: '🏋️', home: '🏠', running: '🏃', boxing: '🥊', mobility: '🧘', hybrid: '⚡',
};

const chips: { id: 'all' | SportTag; label: string }[] = [
  { id: 'all', label: 'Összes' },
  { id: 'gym', label: '🏋️ Terem' },
  { id: 'home', label: '🏠 Otthon' },
  { id: 'running', label: '🏃 Futás' },
  { id: 'boxing', label: '🥊 Box' },
  { id: 'mobility', label: '🧘 Mobilitás' },
  { id: 'hybrid', label: '⚡ Hibrid' },
];

// ── Poster kártya ────────────────────────────────────────────
function PosterCard({ tpl, onClick, size = 'md', owned = false }: {
  tpl: ProgramTemplate;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  owned?: boolean;
}) {
  const g = GRADIENTS[tpl.cover?.gradient ?? 'slate'];
  const w = size === 'lg' ? 200 : size === 'sm' ? 130 : 160;
  const h = size === 'lg' ? 240 : size === 'sm' ? 170 : 210;

  return (
    <button onClick={onClick}
      className="shrink-0 snap-start text-left pressable active:scale-95 transition-transform"
      style={{ width: w }}>
      {/* Poster kép terület */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{
          height: h,
          background: `linear-gradient(160deg, ${g.from} 0%, rgba(8,11,15,0.9) 100%)`,
          border: `1px solid ${g.border}`,
          boxShadow: `0 8px 32px ${g.glow}`,
        }}>
        {/* Emoji nagy */}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: size === 'lg' ? 56 : size === 'sm' ? 36 : 44 }}>
          {tpl.cover?.emoji ?? '🏋️'}
        </div>
        {/* Alsó gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(to top, rgba(8,11,15,0.95), transparent)' }} />
        {/* Level badge */}
        <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
          {levelLabel(tpl.level)}
        </div>
        {/* Megvan badge */}
        {owned && (
          <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', backdropFilter: 'blur(4px)' }}>
            ✓ Megvan
          </div>
        )}
        {/* Cím overlay */}
        <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
          <div className="text-xs font-black leading-tight" style={{ color: '#fff', fontSize: 11 }}>
            {tpl.title}
          </div>
          <div className="mt-0.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {tpl.subtitle}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Vízszintes sor ───────────────────────────────────────────
function HRow({ title, accent, children }: {
  title: string; accent?: string; children: React.ReactNode
}) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {accent && <div className="h-3 w-1 rounded-full" style={{ background: accent }} />}
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Összes →</span>
      </div>
      <div className="overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
        style={{ paddingLeft: 16, paddingRight: 16 }}>
        <div className="flex gap-3 pb-2">{children}</div>
      </div>
    </section>
  );
}

// ── Saját program kártya ─────────────────────────────────────
function MyProgramCard({ program, onClick }: { program: UserProgram; onClick: () => void }) {
  const sport = program.sport as string;
  const icon = SPORT_ICONS[sport] ?? '🏋️';
  return (
    <button onClick={onClick}
      className="shrink-0 snap-start text-left pressable"
      style={{ width: 150 }}>
      <div className="relative overflow-hidden rounded-2xl p-3"
        style={{ height: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="text-2xl">{icon}</div>
        <div className="mt-1 text-xs font-bold leading-tight line-clamp-2"
          style={{ color: 'var(--text-primary)' }}>{program.name}</div>
        <div className="absolute bottom-2 right-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {program.sessions?.length ?? 0} session
        </div>
      </div>
    </button>
  );
}

// ── Főoldal ──────────────────────────────────────────────────
export default function ProgramsPage() {
  const router = useRouter();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const [chip, setChip] = React.useState<'all' | SportTag>('all');
  const [q, setQ] = React.useState('');
  const [mine, setMine] = React.useState<UserProgram[]>([]);
  const [tab, setTab] = React.useState<'browse' | 'mine'>('browse');

  React.useEffect(() => {
    if (activeProfileId) setMine(readPrograms(activeProfileId));
  }, [activeProfileId]);

  function startFromTemplate(tplId: string) {
    if (!activeProfileId) return;
    const tpl = PROGRAM_TEMPLATES.find(x => x.id === tplId);
    if (!tpl) return;

    // Ha már van ilyen sablon alapú program → nyisd meg, ne hozz létre újat
    const existing = mine.find(p => p.fromTemplateId === tplId);
    if (existing) {
      router.push(`/programs/builder/${existing.id}`);
      return;
    }

    const p = createProgramFromTemplate(activeProfileId, tpl);
    setMine(prev => [p, ...prev]); // azonnal frissíti a Saját listát
    router.push(`/programs/builder/${p.id}`);
  }

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return PROGRAM_TEMPLATES.filter(t => {
      const okSport = chip === 'all' || t.sport === chip;
      const okQ = !qq || t.title.toLowerCase().includes(qq) || (t.tags ?? []).some(x => x.includes(qq));
      return okSport && okQ;
    });
  }, [q, chip]);

  const featured = PROGRAM_TEMPLATES.slice(0, 4);
  const byGym = PROGRAM_TEMPLATES.filter(t => t.sport === 'gym');
  const byRunning = PROGRAM_TEMPLATES.filter(t => t.sport === 'running');
  const byBoxing = PROGRAM_TEMPLATES.filter(t => t.sport === 'boxing');

  // Mely sablonok vannak már meg a felhasználónál
  const ownedTemplateIds = React.useMemo(
    () => new Set(mine.map(p => p.fromTemplateId).filter(Boolean)),
    [mine]
  );

  return (
    // min-h-dvh hogy a BottomNav sticky maradjon akkor is ha kevés tartalom van
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      <div className="flex-1 pb-32 animate-in">

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-40 px-4 pt-4 pb-3"
          style={{ background: 'rgba(8,11,15,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="label-xs mb-1">PROGRAMOK</div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Katalógus</h1>
            {/* Tab switch */}
            <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--bg-card)' }}>
              {(['browse', 'mine'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                  style={tab === t
                    ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)' }
                    : { color: 'var(--text-muted)' }}>
                  {t === 'browse' ? 'Felfedezés' : `Saját${mine.length ? ` (${mine.length})` : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Keresés */}
          <div className="relative mt-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Keresés…"
              className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>

          {/* Sport chip-ek */}
          <div className="mt-2.5 -mx-4 overflow-x-auto no-scrollbar px-4">
            <div className="flex gap-2 pb-0.5">
              {chips.map(c => (
                <button key={c.id} onClick={() => setChip(c.id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all pressable"
                  style={chip === c.id
                    ? { background: 'var(--accent-primary)', color: '#000' }
                    : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── BROWSE TAB ── */}
        {tab === 'browse' && (
          <>
            {/* Ha van szűrés → flat lista */}
            {(q || chip !== 'all') ? (
              <section className="mt-5 px-4">
                <div className="label-xs mb-3">{filtered.length} TALÁLAT</div>
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map(t => (
                    <div key={t.id} onClick={() => startFromTemplate(t.id)} className="cursor-pointer">
                      <PosterCard tpl={t} onClick={() => startFromTemplate(t.id)} size="lg"
                        owned={ownedTemplateIds.has(t.id)} />
                    </div>
                  ))}
                  {!filtered.length && (
                    <div className="col-span-2 rounded-2xl py-10 text-center text-sm"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                      Nincs találat
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <>
                {/* Kiemelt — nagy poszterek */}
                <HRow title="🔥 Kiemelt programok" accent="var(--accent-primary)">
                  {featured.map(t => (
                    <PosterCard key={t.id} tpl={t} onClick={() => startFromTemplate(t.id)} size="lg"
                      owned={ownedTemplateIds.has(t.id)} />
                  ))}
                </HRow>
                {byGym.length > 0 && (
                  <HRow title="🏋️ Edzőterem" accent="var(--accent-green)">
                    {byGym.map(t => (
                      <PosterCard key={t.id} tpl={t} onClick={() => startFromTemplate(t.id)} size="md"
                        owned={ownedTemplateIds.has(t.id)} />
                    ))}
                  </HRow>
                )}
                {byRunning.length > 0 && (
                  <HRow title="🏃 Futás" accent="var(--accent-primary)">
                    {byRunning.map(t => (
                      <PosterCard key={t.id} tpl={t} onClick={() => startFromTemplate(t.id)} size="md"
                        owned={ownedTemplateIds.has(t.id)} />
                    ))}
                  </HRow>
                )}
                {byBoxing.length > 0 && (
                  <HRow title="🥊 Box" accent="var(--accent-amber)">
                    {byBoxing.map(t => (
                      <PosterCard key={t.id} tpl={t} onClick={() => startFromTemplate(t.id)} size="md"
                        owned={ownedTemplateIds.has(t.id)} />
                    ))}
                  </HRow>
                )}
              </>
            )}
          </>
        )}

        {/* ── MINE TAB ── */}
        {tab === 'mine' && (
          <section className="px-4 mt-5">
            {mine.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl py-16 text-center"
                style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-mid)' }}>
                <div className="text-4xl mb-3">📋</div>
                <div className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Még nincs saját programod
                </div>
                <div className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  Válassz egy sablont a Felfedezés tabban
                </div>
                <button onClick={() => setTab('browse')}
                  className="rounded-2xl px-6 py-3 text-sm font-bold pressable"
                  style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(34,211,238,0.25)' }}>
                  Sablonok böngészése →
                </button>
              </div>
            ) : (
              <>
                <div className="label-xs mb-3">SAJÁT PROGRAMOK</div>
                <div className="flex flex-wrap gap-3">
                  {mine.map(p => (
                    <MyProgramCard key={p.id} program={p}
                      onClick={() => router.push(`/programs/builder/${p.id}`)} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
