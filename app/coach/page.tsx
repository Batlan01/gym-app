"use client";

import * as React from "react";
import Link from "next/link";
import { InviteModal } from "@/components/coach/InviteModal";

// ─── Mock data ───────────────────────────────────────────────────────────────
const COACH = { name: "Kovács Péter", plan: "ARCX Premium", avatar: "KP" };

const TEAM_MEMBERS = [
  { id: "1", name: "Balogh Ádám",    avatar: "BÁ", group: "A csoport", status: "active",   lastSeen: "Ma, 09:14",  compliance: 92, streak: 14, todayDone: true  },
  { id: "2", name: "Fekete Réka",    avatar: "FR", group: "B csoport", status: "active",   lastSeen: "Ma, 08:30",  compliance: 88, streak: 7,  todayDone: true  },
  { id: "3", name: "Horváth Dániel", avatar: "HD", group: "A csoport", status: "idle",     lastSeen: "Tegnap",     compliance: 71, streak: 3,  todayDone: false },
  { id: "4", name: "Kiss Lili",      avatar: "KL", group: "C csoport", status: "active",   lastSeen: "Ma, 10:02",  compliance: 95, streak: 21, todayDone: true  },
  { id: "5", name: "Nagy Benedek",   avatar: "NB", group: "B csoport", status: "inactive", lastSeen: "3 napja",    compliance: 45, streak: 0,  todayDone: false },
  { id: "6", name: "Szabó Anna",     avatar: "SZ", group: "A csoport", status: "active",   lastSeen: "Ma, 07:55",  compliance: 83, streak: 9,  todayDone: true  },
  { id: "7", name: "Tóth Máté",      avatar: "TM", group: "C csoport", status: "idle",     lastSeen: "Tegnap",     compliance: 67, streak: 1,  todayDone: false },
  { id: "8", name: "Varga Eszter",   avatar: "VE", group: "C csoport", status: "active",   lastSeen: "Ma, 09:45",  compliance: 90, streak: 18, todayDone: true  },
];

const SCHEDULE = [
  { day: "H",   label: "Hétfő",     sessions: ["A csoport – Erő", "B csoport – Kardió"] },
  { day: "K",   label: "Kedd",      sessions: ["C csoport – Mobilizáció"] },
  { day: "Sz",  label: "Szerda",    sessions: ["A csoport – Hipertrófia", "B csoport – Erő"] },
  { day: "Cs",  label: "Csütörtök", sessions: [] },
  { day: "P",   label: "Péntek",    sessions: ["Teljes csapat – Teszt nap"] },
  { day: "Szo", label: "Szombat",   sessions: ["C csoport – Kondíció"] },
  { day: "V",   label: "Vasárnap",  sessions: [] },
];

const RECENT_ACTIVITIES = [
  { member: "Kiss Lili",    action: "Elvégezte az edzést",     time: "10 perce",       type: "done" },
  { member: "Balogh Ádám",  action: "Új PR – Guggolás 120 kg", time: "32 perce",      type: "pr"   },
  { member: "Fekete Réka",  action: "Elvégezte az edzést",     time: "1 órája",        type: "done" },
  { member: "Szabó Anna",   action: "Elvégezte az edzést",     time: "2 órája",        type: "done" },
  { member: "Nagy Benedek", action: "3 napja nem edzett",      time: "Figyelmeztetés", type: "warn" },
];

const GROUPS = ["Összes", "A csoport", "B csoport", "C csoport"];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="card p-4 flex flex-col gap-1 min-w-0">
      <span className="label-xs">{label}</span>
      <span className="text-2xl font-bold tracking-tight" style={{ color: accent ? "var(--accent-primary)" : "var(--text-primary)" }}>
        {value}
      </span>
      {sub && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</span>}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { active: "#4ade80", idle: "#fbbf24", inactive: "#ef4444" };
  return (
    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: colors[status] ?? "#888", boxShadow: `0 0 6px ${colors[status] ?? "#888"}80` }} />
  );
}

function ComplianceBar({ value }: { value: number }) {
  const color = value >= 85 ? "#4ade80" : value >= 60 ? "#fbbf24" : "#ef4444";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" }[size];
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(74,222,128,0.15))", border: "1px solid rgba(34,211,238,0.25)", color: "var(--accent-primary)" }}>
      {initials}
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconDashboard() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconTeam()      { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="19" cy="7" r="3"/><path d="M21 21v-2a3 3 0 0 0-2-2.83"/></svg>; }
function IconPlans()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IconCalendar()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>; }
function IconStats()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconDevices()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>; }

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ activePage, setActivePage }: { activePage: string; setActivePage: (p: string) => void }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard",    icon: <IconDashboard /> },
    { id: "team",      label: "Csapat",       icon: <IconTeam /> },
    { id: "plans",     label: "Tervek",       icon: <IconPlans /> },
    { id: "calendar",  label: "Naptár",       icon: <IconCalendar /> },
    { id: "stats",     label: "Statisztikák", icon: <IconStats /> },
    { id: "devices",   label: "Eszközök",     icon: <IconDevices /> },
  ];
  return (
    <aside className="flex flex-col h-full w-56 lg:w-64 flex-shrink-0" style={{ borderRight: "1px solid var(--border-subtle)" }}>
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
          style={{ background: "linear-gradient(135deg, #22d3ee, #4ade80)", color: "#080B0F" }}>A</div>
        <div>
          <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>ARCX</div>
          <div className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--accent-primary)" }}>PREMIUM</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {navItems.map(item => {
          const active = activePage === item.id;
          return (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left pressable"
              style={{ background: active ? "rgba(34,211,238,0.1)" : "transparent", color: active ? "var(--accent-primary)" : "var(--text-secondary)", border: active ? "1px solid rgba(34,211,238,0.2)" : "1px solid transparent" }}>
              <span className="flex-shrink-0 opacity-80">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <Avatar initials={COACH.avatar} size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{COACH.name}</div>
            <div className="text-[10px] font-semibold tracking-wider" style={{ color: "var(--accent-primary)" }}>{COACH.plan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage() {
  const totalMembers = TEAM_MEMBERS.length;
  const activeToday = TEAM_MEMBERS.filter(m => m.todayDone).length;
  const avgCompliance = Math.round(TEAM_MEMBERS.reduce((s, m) => s + m.compliance, 0) / totalMembers);
  const alerts = TEAM_MEMBERS.filter(m => m.status === "inactive").length;
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 h-full overflow-y-auto no-scrollbar animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Jó reggelt, Péter 👋</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Csütörtök, 2026. március 12.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold pressable"
          style={{ background: "var(--accent-primary)", color: "#080B0F" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Értesítés küldése
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Csapattagok"      value={totalMembers}           sub="8 fő összesen" />
        <StatCard label="Ma elvégezte"     value={`${activeToday}/${totalMembers}`} sub="edzés ma" accent />
        <StatCard label="Átlag compliance" value={`${avgCompliance}%`}   sub="elmúlt 30 nap" />
        <StatCard label="Figyelmeztetés"   value={alerts}                 sub="inaktív tag" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-3 card p-5 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Legutóbbi aktivitás</h2>
            <span className="label-xs">Ma</span>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar">
            {RECENT_ACTIVITIES.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < RECENT_ACTIVITIES.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: a.type === "pr" ? "rgba(74,222,128,0.15)" : a.type === "warn" ? "rgba(239,68,68,0.15)" : "rgba(34,211,238,0.1)", color: a.type === "pr" ? "#4ade80" : a.type === "warn" ? "#ef4444" : "#22d3ee" }}>
                  {a.type === "pr" ? "🏆" : a.type === "warn" ? "!" : "✓"}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{a.member}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}> – {a.action}</span>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Heti terv</h2>
          <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
            {SCHEDULE.map((day, i) => {
              const isToday = i === 3;
              return (
                <div key={day.day} className="flex items-start gap-3 py-1.5 rounded-lg px-2"
                  style={{ background: isToday ? "rgba(34,211,238,0.07)" : "transparent", border: isToday ? "1px solid rgba(34,211,238,0.15)" : "1px solid transparent" }}>
                  <span className="w-7 text-xs font-bold text-center flex-shrink-0 mt-0.5" style={{ color: isToday ? "var(--accent-primary)" : "var(--text-muted)" }}>{day.day}</span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {day.sessions.length === 0 ? <span className="text-xs" style={{ color: "var(--text-muted)" }}>Pihenőnap</span>
                      : day.sessions.map((s, j) => <span key={j} className="text-xs truncate" style={{ color: isToday ? "var(--text-primary)" : "var(--text-secondary)" }}>{s}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Csapat áttekintés</h2>
          <button className="text-xs font-semibold pressable" style={{ color: "var(--accent-primary)" }}>Összes →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {TEAM_MEMBERS.slice(0, 4).map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
              <Avatar initials={m.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <StatusDot status={m.status} />
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                </div>
                <ComplianceBar value={m.compliance} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Team Page ────────────────────────────────────────────────────────────────
function TeamPage({ onInvite }: { onInvite: () => void }) {
  const [activeGroup, setActiveGroup] = React.useState("Összes");
  const [search, setSearch] = React.useState("");
  const filtered = TEAM_MEMBERS.filter(m => {
    const groupMatch = activeGroup === "Összes" || m.group === activeGroup;
    const searchMatch = m.name.toLowerCase().includes(search.toLowerCase());
    return groupMatch && searchMatch;
  });
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 h-full overflow-y-auto no-scrollbar animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Csapat</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{TEAM_MEMBERS.length} tag · 3 csoport</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onInvite} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold pressable"
            style={{ background: "var(--accent-primary)", color: "#080B0F" }}>+ Tag meghívása</button>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
          {GROUPS.map(g => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all pressable"
              style={{ background: activeGroup === g ? "var(--accent-primary)" : "transparent", color: activeGroup === g ? "#080B0F" : "var(--text-secondary)" }}>
              {g}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Keresés…"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-mid)", color: "var(--text-primary)", minWidth: 180 }} />
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Tag", "Csoport", "Státusz", "Utoljára aktív", "Compliance", "Streak", "Ma", ""].map((h, idx) => (
                  <th key={idx} className="px-4 py-3 text-left label-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className="transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar initials={m.avatar} size="sm" /><span className="font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span></div></td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>{m.group}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5"><StatusDot status={m.status} /><span className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.status === "active" ? "Aktív" : m.status === "idle" ? "Inaktív" : "Kieső"}</span></div></td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{m.lastSeen}</td>
                  <td className="px-4 py-3 min-w-[120px]"><ComplianceBar value={m.compliance} /></td>
                  <td className="px-4 py-3 text-xs font-semibold tabular-nums" style={{ color: m.streak > 0 ? "var(--accent-green)" : "var(--text-muted)" }}>{m.streak > 0 ? `🔥 ${m.streak} nap` : "–"}</td>
                  <td className="px-4 py-3">{m.todayDone
                    ? <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>✓ Kész</span>
                    : <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>Várja</span>}</td>
                  <td className="px-4 py-3"><button className="text-xs px-3 py-1.5 rounded-lg font-medium pressable" style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>Profil</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
function PlaceholderPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center animate-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-primary)" }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
      </div>
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
      <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
      <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.2)" }}>Hamarosan</span>
    </div>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function CoachDashboard() {
  const [activePage, setActivePage] = React.useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "team":      return <TeamPage onInvite={() => setInviteOpen(true)} />;
      case "plans":     return <PlaceholderPage title="Edzéstervek" desc="Hozz létre részletes edzésterveket és rendeld hozzá csapattagjaidhoz." />;
      case "calendar":  return <PlaceholderPage title="Naptár" desc="Heti edzésmenetrend tervezése, szerkesztése és kiküldése." />;
      case "stats":     return <PlaceholderPage title="Statisztikák" desc="Csapatod teljesítményének részletes elemzése." />;
      case "devices":   return <PlaceholderPage title="Eszközök" desc="Bluetooth pulzusmérők és fitness trackerek csatlakoztatása." />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      )}
      <div className={`fixed md:relative z-50 md:z-auto h-full transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ background: "var(--bg-surface)" }}>
        <Sidebar activePage={activePage} setActivePage={(p) => { setActivePage(p); setSidebarOpen(false); }} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 md:hidden" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg pressable" style={{ background: "var(--surface-2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>ARCX Coach</div>
          <Link href="/workout" className="ml-auto text-xs font-semibold pressable" style={{ color: "var(--text-muted)" }}>← App</Link>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="hidden md:flex absolute top-4 right-6 z-10">
            <Link href="/workout" className="text-xs font-semibold px-3 py-1.5 rounded-lg pressable"
              style={{ background: "var(--surface-1)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>← Vissza az appba</Link>
          </div>
          {renderPage()}
        </div>
      </div>
    </div>
    <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
  );
}
