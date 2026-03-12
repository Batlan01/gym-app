// app/programs/page.tsx
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { PROGRAM_TEMPLATES, sportLabel, levelLabel, SPORT_GROUPS, SPORT_EMOJI } from "@/lib/programTemplates";
import type { SportTag, UserProgram, ProgramTemplate, ProgramLevel } from "@/lib/programsTypes";
import { createProgramFromTemplate, deduplicatePrograms, upsertProgram } from "@/lib/programsStorage";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID() : String(Date.now() + Math.random());
}

const GRAD: Record<string, { bg: string; glow: string; border: string }> = {
  emerald:{ bg:'rgba(52,211,153,0.18)',  glow:'rgba(52,211,153,0.12)',  border:'rgba(52,211,153,0.22)' },
  sky:    { bg:'rgba(56,189,248,0.18)',  glow:'rgba(56,189,248,0.12)',  border:'rgba(56,189,248,0.22)' },
  ember:  { bg:'rgba(251,146,60,0.18)',  glow:'rgba(251,146,60,0.12)',  border:'rgba(251,146,60,0.22)' },
  violet: { bg:'rgba(167,139,250,0.18)', glow:'rgba(167,139,250,0.12)', border:'rgba(167,139,250,0.22)' },
  rose:   { bg:'rgba(251,113,133,0.18)', glow:'rgba(251,113,133,0.12)', border:'rgba(251,113,133,0.22)' },
  amber:  { bg:'rgba(251,191,36,0.18)',  glow:'rgba(251,191,36,0.12)',  border:'rgba(251,191,36,0.22)' },
  indigo: { bg:'rgba(99,102,241,0.18)',  glow:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.22)' },
  slate:  { bg:'rgba(148,163,184,0.10)', glow:'rgba(148,163,184,0.06)', border:'rgba(148,163,184,0.15)' },
};

function PosterCard({ tpl, onClick, size='md', owned=false }: {
  tpl: ProgramTemplate; onClick: ()=>void; size?:'sm'|'md'|'lg'; owned?:boolean;
}) {
  const g = GRAD[tpl.cover?.gradient ?? 'slate'];
  const w = size==='lg' ? 190 : size==='sm' ? 130 : 155;
  const h = size==='lg' ? 230 : size==='sm' ? 165 : 200;
  return (
    <button onClick={onClick}
      className="shrink-0 snap-start text-left pressable active:scale-95 transition-transform"
      style={{ width: w }}>
      <div className="relative overflow-hidden rounded-2xl"
        style={{ height:h, background:`linear-gradient(160deg,${g.bg} 0%,rgba(8,11,15,0.88) 100%)`,
          border:`1px solid ${g.border}`, boxShadow:`0 6px 24px ${g.glow}` }}>
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: size==='lg' ? 52 : size==='sm' ? 34 : 42 }}>
          {tpl.cover?.emoji ?? '🏋️'}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20"
          style={{ background:'linear-gradient(to top,rgba(4,6,10,0.97),transparent)' }} />
        <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{ background:'rgba(0,0,0,0.55)', color:'rgba(255,255,255,0.8)', backdropFilter:'blur(4px)' }}>
          {levelLabel(tpl.level)}
        </div>
        {owned && (
          <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ background:'rgba(74,222,128,0.18)', color:'#4ade80', backdropFilter:'blur(4px)' }}>
            ✓ Megvan
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
          <div style={{ color:'#fff', fontSize:11, fontWeight:800, lineHeight:1.3 }}
            className="line-clamp-2">{tpl.title}</div>
          <div className="mt-0.5" style={{ color:'rgba(255,255,255,0.5)', fontSize:10 }}>{tpl.subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function MyCard({ program, onClick }: { program: UserProgram; onClick: ()=>void }) {
  const emoji = SPORT_EMOJI[program.sport as SportTag] ?? '🏋️';
  return (
    <button onClick={onClick} className="w-full text-left pressable">
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background:'var(--surface-1)', border:'1px solid var(--border-mid)' }}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ background:'var(--surface-2)' }}>{emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm truncate" style={{ color:'var(--text-primary)' }}>
            {program.name}</div>
          <div className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>
            {sportLabel(program.sport as SportTag)} · {program.sessions?.length ?? 0} edzés
          </div>
        </div>
        <div className="text-lg" style={{ color:'var(--text-muted)' }}>›</div>
      </div>
    </button>
  );
}

function HRow({ title, accent, children }: { title:string; accent?:string; children:React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-3 px-4 flex items-center gap-2">
        {accent && <div className="h-3.5 w-1 rounded-full" style={{ background:accent }} />}
        <span className="text-sm font-bold" style={{ color:'var(--text-primary)' }}>{title}</span>
      </div>
      <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory" style={{ paddingLeft:16, paddingRight:16 }}>
        <div className="flex gap-3 pb-2">{children}</div>
      </div>
    </section>
  );
}

const LEVELS: { id: ProgramLevel; label: string; desc: string }[] = [
  { id:'beginner',     label:'Kezdő',          desc:'Alap mozgásminták, kis terhelés' },
  { id:'intermediate', label:'Középhaladó',    desc:'Rendszeres edzés, haladóbb technika' },
  { id:'advanced',     label:'Haladó',         desc:'Komoly tapasztalat, nagy volumen' },
];

function CreateProgramSheet({ onClose, onCreate }: {
  onClose: ()=>void;
  onCreate: (name:string, desc:string, sport:SportTag, level:ProgramLevel)=>void;
}) {
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [sport, setSport] = React.useState<SportTag>('gym');
  const [level, setLevel] = React.useState<ProgramLevel>('beginner');
  const [step, setStep] = React.useState<'info'|'sport'|'level'|'schedule'>('info');
  const WEEKDAYS: {id:string;label:string}[] = [
    {id:'mon',label:'H'},{id:'tue',label:'K'},{id:'wed',label:'Sze'},
    {id:'thu',label:'Cs'},{id:'fri',label:'P'},{id:'sat',label:'Szo'},{id:'sun',label:'V'},
  ];
  const [selectedDays, setSelectedDays] = React.useState<string[]>([]);

  // FIXED: paddingBottom hogy a gomb ne kerüljön a BottomNav alá
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background:'rgba(0,0,0,0.6)' }}
      onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full rounded-t-3xl animate-in slide-in-from-bottom flex flex-col"
        style={{ background:'var(--bg-elevated)', maxHeight:'85dvh' }}>

        <div className="flex justify-center pt-3 pb-4">
          <div className="h-1 w-10 rounded-full" style={{ background:'var(--surface-3)' }} />
        </div>

        {step === 'info' && (<>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>
              Új edzésprogram
            </h2>
            <p className="text-sm mb-6" style={{ color:'var(--text-muted)' }}>
              Hozd létre a saját programodat nulláról
            </p>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wide" style={{ color:'var(--text-muted)' }}>
              Program neve *
            </label>
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="pl. Heti Push/Pull/Legs"
              maxLength={50}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none mb-4"
              style={{ background:'var(--surface-1)', border:'1px solid var(--border-mid)', color:'var(--text-primary)' }} />
            <label className="block mb-1 text-xs font-bold uppercase tracking-wide" style={{ color:'var(--text-muted)' }}>
              Leírás (opcionális)
            </label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder="Miről szól ez a program? Mi a célja?"
              rows={3} maxLength={200}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background:'var(--surface-1)', border:'1px solid var(--border-mid)', color:'var(--text-primary)' }} />
          </div>
          <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop:'1px solid var(--border-subtle)' }}>
            <button disabled={!name.trim()} onClick={()=>setStep('sport')}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background: name.trim() ? 'var(--accent-primary)' : 'var(--surface-2)',
                color: name.trim() ? '#000' : 'var(--text-muted)' }}>
              Következő: Kategória →
            </button>
          </div>
        </>)}

        {step === 'sport' && (<>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
            <button onClick={()=>setStep('info')} className="mb-4 text-sm block" style={{ color:'var(--text-muted)' }}>
              ← Vissza
            </button>
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>Válassz kategóriát</h2>
            <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>Mi jellemzi legjobban a programodat?</p>
            <div className="space-y-5">
              {SPORT_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color:'var(--text-muted)' }}>{group.emoji} {group.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map(tag => (
                      <button key={tag} onClick={()=>setSport(tag)}
                        className="rounded-full px-3 py-2 text-xs font-semibold pressable transition-all"
                        style={ sport===tag
                          ? { background:'var(--accent-primary)', color:'#000' }
                          : { background:'var(--surface-1)', color:'var(--text-secondary)', border:'1px solid var(--border-subtle)' }}>
                        {SPORT_EMOJI[tag]} {sportLabel(tag)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop:'1px solid var(--border-subtle)' }}>
            <button onClick={()=>setStep('level')}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              Következő: Szint →
            </button>
          </div>
        </>)}

        {step === 'level' && (<>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
            <button onClick={()=>setStep('sport')} className="mb-4 text-sm block" style={{ color:'var(--text-muted)' }}>
              ← Vissza
            </button>
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>Nehézségi szint</h2>
            <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>Kinek szól ez a program?</p>
            <div className="space-y-3">
              {LEVELS.map(l => (
                <button key={l.id} onClick={()=>setLevel(l.id)}
                  className="w-full rounded-2xl px-4 py-4 text-left pressable transition-all"
                  style={ level===l.id
                    ? { background:'rgba(34,211,238,0.1)', border:'2px solid var(--accent-primary)' }
                    : { background:'var(--surface-1)', border:'1px solid var(--border-mid)' }}>
                  <div className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{l.label}</div>
                  <div className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{l.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop:'1px solid var(--border-subtle)' }}>
            <button onClick={()=>setStep('schedule')}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              Következő: Naptár →
            </button>
          </div>
        </>)}


        {step === 'schedule' && (<>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
            <button onClick={()=>setStep('level')} className="mb-4 text-sm block" style={{ color:'var(--text-muted)' }}>
              ← Vissza
            </button>
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>Naptárba ütemezés</h2>
            <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>
              Melyik napokon szeretnél edzeni? (opcionális — később is beállítható)
            </p>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {WEEKDAYS.map(d => {
                const active = selectedDays.includes(d.id);
                return (
                  <button key={d.id}
                    onClick={() => setSelectedDays(prev => active ? prev.filter(x=>x!==d.id) : [...prev, d.id])}
                    className="rounded-2xl py-4 font-black text-sm pressable flex flex-col items-center gap-1"
                    style={active
                      ? { background:'var(--accent-primary)', color:'#000' }
                      : { background:'var(--surface-1)', color:'var(--text-muted)', border:'1px solid var(--border-subtle)' }}>
                    {d.label}
                  </button>
                );
              })}
            </div>
            {selectedDays.length > 0 && (
              <div className="rounded-2xl p-4" style={{background:'rgba(34,211,238,0.06)',border:'1px solid rgba(34,211,238,0.15)'}}>
                <div className="text-[10px] font-black tracking-widest mb-1" style={{color:'var(--accent-primary)'}}>ÖSSZEFOGLALÁS</div>
                <div className="text-sm" style={{color:'var(--text-primary)'}}>
                  {selectedDays.length} nap / hét
                </div>
                <div className="text-[10px] mt-0.5" style={{color:'var(--text-muted)'}}>
                  {WEEKDAYS.filter(d=>selectedDays.includes(d.id)).map(d=>d.label).join(', ')}
                </div>
              </div>
            )}
          </div>
          <div className="px-5 pb-8 pt-3 shrink-0 space-y-2" style={{ borderTop:'1px solid var(--border-subtle)' }}>
            <button onClick={()=>onCreate(name.trim(), desc.trim(), sport, level)}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              ✓ Program létrehozása
            </button>
            <button onClick={()=>onCreate(name.trim(), desc.trim(), sport, level)}
              className="w-full rounded-2xl py-3 text-sm font-semibold pressable"
              style={{ background:'transparent', color:'var(--text-muted)' }}>
              Kihagyás (ütemezés nélkül)
            </button>
          </div>
        </>)}

      </div>
    </div>
  );
}

const ALL_CHIPS: { id: 'all' | SportTag; label: string }[] = [
  { id:'all',          label:'Összes' },
  { id:'gym',          label:'🏋️ Terem' },
  { id:'powerlifting', label:'🏋️ Powerlifting' },
  { id:'crossfit',     label:'⚡ CrossFit' },
  { id:'calisthenics', label:'🤸 Calisthenics' },
  { id:'boxing',       label:'🥊 Box' },
  { id:'mma',          label:'🥋 MMA' },
  { id:'muay_thai',    label:'🦵 Muay Thai' },
  { id:'bjj',          label:'🥋 BJJ' },
  { id:'kickboxing',   label:'🥊 Kickbox' },
  { id:'running',      label:'🏃 Futás' },
  { id:'hiit',         label:'🔥 HIIT' },
  { id:'cycling',      label:'🚴 Kerékpár' },
  { id:'home',         label:'🏠 Otthon' },
  { id:'mobility',     label:'🧘 Mobilitás' },
  { id:'yoga',         label:'🧘 Yoga' },
  { id:'stretching',   label:'🤸 Nyújtás' },
  { id:'foam_roll',    label:'🟫 Foam Roll' },
  { id:'warmup',       label:'🔥 Bemelegítés' },
];

export default function ProgramsPage() {
  const router = useRouter();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);
  const [chip, setChip] = React.useState<'all' | SportTag>('all');
  const [q, setQ] = React.useState('');
  const [mine, setMine] = React.useState<UserProgram[]>([]);
  const [tab, setTab] = React.useState<'browse'|'mine'>('browse');
  const [showCreate, setShowCreate] = React.useState(false);

  React.useEffect(() => {
    if (activeProfileId) setMine(deduplicatePrograms(activeProfileId));
  }, [activeProfileId]);

  function startFromTemplate(tplId: string) {
    if (!activeProfileId) return;
    const tpl = PROGRAM_TEMPLATES.find(x => x.id === tplId);
    if (!tpl) return;
    const existing = mine.find(p => p.fromTemplateId === tplId);
    if (existing) { router.push(`/programs/builder/${existing.id}`); return; }
    const p = createProgramFromTemplate(activeProfileId, tpl);
    setMine(prev => [p, ...prev]);
    router.push(`/programs/builder/${p.id}`);
  }

  function handleCreate(name: string, desc: string, sport: SportTag, level: ProgramLevel) {
    if (!activeProfileId) return;
    const now = Date.now();
    const p: UserProgram = {
      id: uid(), createdAt: now, updatedAt: now,
      name, description: desc, notes: desc, sport, level,
      schedule: { enabled: false },
      sessions: [],
    };
    upsertProgram(activeProfileId, p);
    setMine(prev => [p, ...prev]);
    setShowCreate(false);
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

  const ownedIds = React.useMemo(() => new Set(mine.map(p => p.fromTemplateId).filter(Boolean)), [mine]);

  const featured   = PROGRAM_TEMPLATES.slice(0, 5);
  const fighting   = PROGRAM_TEMPLATES.filter(t => ['boxing','mma','muay_thai','bjj','kickboxing','wrestling','judo','karate'].includes(t.sport));
  const gymPl      = PROGRAM_TEMPLATES.filter(t => ['gym','powerlifting','olympic','bodybuilding'].includes(t.sport));
  const cardio     = PROGRAM_TEMPLATES.filter(t => ['running','hiit','cycling','jump_rope'].includes(t.sport));
  const mobilityGr = PROGRAM_TEMPLATES.filter(t => ['mobility','yoga','stretching','foam_roll','pilates','warmup'].includes(t.sport));
  const bw         = PROGRAM_TEMPLATES.filter(t => ['home','calisthenics','crossfit'].includes(t.sport));

  return (
    <div className="flex flex-col" style={{ minHeight:'100dvh' }}>
      <div className="flex-1 pb-32 animate-in">

        {/* Sticky header */}
        <div className="sticky top-0 z-40 px-4 pt-4 pb-3"
          style={{ background:'var(--sticky-bg)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border-subtle)' }}>
          <div className="label-xs mb-1">PROGRAMOK</div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black" style={{ color:'var(--text-primary)' }}>Katalógus</h1>
            <div className="flex gap-1 rounded-xl p-1" style={{ background:'var(--surface-1)' }}>
              {(['browse','mine'] as const).map(t => (
                <button key={t} onClick={()=>setTab(t)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                  style={tab===t ? { background:'var(--bg-elevated)', color:'var(--text-primary)' } : { color:'var(--text-muted)' }}>
                  {t==='browse' ? 'Felfedezés' : `Saját${mine.length ? ` (${mine.length})` : ''}`}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:'var(--text-muted)' }}>🔍</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Keresés…"
              className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none"
              style={{ background:'var(--surface-1)', border:'1px solid var(--border-subtle)', color:'var(--text-primary)' }} />
          </div>
          <div className="mt-2.5 -mx-4 overflow-x-auto no-scrollbar px-4">
            <div className="flex gap-2 pb-0.5">
              {ALL_CHIPS.map(c => (
                <button key={c.id} onClick={()=>setChip(c.id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold pressable transition-all"
                  style={chip===c.id
                    ? { background:'var(--accent-primary)', color:'#000' }
                    : { background:'var(--surface-1)', color:'var(--text-muted)', border:'1px solid var(--border-subtle)' }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BROWSE TAB */}
        {tab==='browse' && (
          <>
            {(q || chip!=='all') ? (
              <section className="mt-5 px-4">
                <div className="label-xs mb-3">{filtered.length} TALÁLAT</div>
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map(t => (
                    <PosterCard key={t.id} tpl={t} onClick={()=>startFromTemplate(t.id)}
                      size="lg" owned={ownedIds.has(t.id)} />
                  ))}
                  {!filtered.length && (
                    <div className="col-span-2 rounded-2xl py-10 text-center text-sm"
                      style={{ color:'var(--text-muted)', background:'var(--surface-1)', border:'1px solid var(--border-subtle)' }}>
                      Nincs találat
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <>
                <HRow title="🔥 Kiemelt programok" accent="var(--accent-primary)">
                  {featured.map(t => <PosterCard key={t.id} tpl={t} onClick={()=>startFromTemplate(t.id)} size="lg" owned={ownedIds.has(t.id)} />)}
                </HRow>
                {fighting.length>0 && (
                  <HRow title="🥊 Küzdősportok" accent="#f87171">
                    {fighting.map(t => <PosterCard key={t.id} tpl={t} onClick={()=>startFromTemplate(t.id)} size="md" owned={ownedIds.has(t.id)} />)}
                  </HRow>
                )}
                {gymPl.length>0 && (
                  <HRow title="🏋️ Edzőterem" accent="var(--accent-green)">
                    {gymPl.map(t => <PosterCard key={t.id} tpl={t} onClick={()=>startFromTemplate(t.id)} size="md" owned={ownedIds.has(t.id)} />)}
                  </HRow>
                )}
                {cardio.length>0 && (
                  <HRow title="🏃 Kardio & Sport" accent="var(--accent-primary)">
                    {cardio.map(t => <PosterCard key={t.id} tpl={t} onClick={()=>startFromTemplate(t.id)} size="md" owned={ownedIds.has(t.id)} />)}
                  </HRow>
                )}
                {mobilityGr.length>0 && (
                  <HRow title="🧘 Mobilitás & Regeneráció" accent="#c084fc">
                    {mobilityGr.map(t => <PosterCard key={t.id} tpl={t} onClick={()=>startFromTemplate(t.id)} size="md" owned={ownedIds.has(t.id)} />)}
                  </HRow>
                )}
                {bw.length>0 && (
                  <HRow title="🤸 Testsúlyos & CrossFit" accent="#818cf8">
                    {bw.map(t => <PosterCard key={t.id} tpl={t} onClick={()=>startFromTemplate(t.id)} size="md" owned={ownedIds.has(t.id)} />)}
                  </HRow>
                )}
              </>
            )}
          </>
        )}

        {/* MINE TAB */}
        {tab==='mine' && (
          <section className="px-4 mt-5">
            <button onClick={()=>setShowCreate(true)}
              className="w-full rounded-2xl px-4 py-4 mb-5 flex items-center gap-3 pressable"
              style={{ background:'rgba(34,211,238,0.08)', border:'2px dashed rgba(34,211,238,0.35)' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ background:'rgba(34,211,238,0.12)' }}>+</div>
              <div className="text-left">
                <div className="font-bold text-sm" style={{ color:'var(--accent-primary)' }}>Új program létrehozása</div>
                <div className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>Épít fel saját programot 0-ról</div>
              </div>
            </button>

            {mine.length===0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl py-14 text-center"
                style={{ background:'var(--surface-1)', border:'1px dashed var(--border-mid)' }}>
                <div className="text-4xl mb-3">📋</div>
                <div className="text-base font-bold mb-1" style={{ color:'var(--text-primary)' }}>Még nincs saját programod</div>
                <div className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>Hozz létre sajátot, vagy válassz sablont</div>
                <button onClick={()=>setTab('browse')}
                  className="rounded-2xl px-6 py-3 text-sm font-bold pressable"
                  style={{ background:'rgba(34,211,238,0.12)', color:'var(--accent-primary)', border:'1px solid rgba(34,211,238,0.25)' }}>
                  Sablonok böngészése →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="label-xs mb-3">SAJÁT PROGRAMOK ({mine.length})</div>
                {mine.map(p => (
                  <MyCard key={p.id} program={p} onClick={()=>router.push(`/programs/builder/${p.id}`)} />
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {showCreate && (
        <CreateProgramSheet onClose={()=>setShowCreate(false)} onCreate={handleCreate} />
      )}

      <BottomNav />
    </div>
  );
}
