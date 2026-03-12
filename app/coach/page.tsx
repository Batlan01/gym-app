"use client";

import * as React from "react";
import Link from "next/link";
import { InviteModal } from "@/components/coach/InviteModal";
import { useCoachTeam, apiUpdateMember, apiRemoveMember } from "@/lib/useCoach";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import type { TeamMember } from "@/lib/coachTypes";

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="card p-4 flex flex-col gap-1 min-w-0">
      <span className="label-xs">{label}</span>
      <span className="text-2xl font-bold tracking-tight"
        style={{ color: accent ? "var(--accent-primary)" : "var(--text-primary)" }}>
        {value}
      </span>
      {sub && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</span>}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { active: "#4ade80", idle: "#fbbf24", inactive: "#ef4444", removed: "#888" };
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

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
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
function Sidebar({ activePage, setActivePage, user }: {
  activePage: string;
  setActivePage: (p: string) => void;
  user: User | null;
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard",    icon: <IconDashboard /> },
    { id: "team",      label: "Csapat",       icon: <IconTeam /> },
    { id: "plans",     label: "Tervek",       icon: <IconPlans /> },
    { id: "calendar",  label: "Naptár",       icon: <IconCalendar /> },
    { id: "stats",     label: "Statisztikák", icon: <IconStats /> },
    { id: "devices",   label: "Eszközök",     icon: <IconDevices /> },
  ];
  const displayName = user?.displayName ?? user?.email ?? "Coach";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

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
          <Avatar name={displayName} size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{displayName}</div>
            <div className="text-[10px] font-semibold tracking-wider" style={{ color: "var(--accent-primary)" }}>ARCX Premium</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard Page (live) ────────────────────────────────────────────────────
function DashboardPage({ members, loading }: { members: TeamMember[]; loading: boolean }) {
  const totalMembers = members.length;
  const activeToday = members.filter(m => m.status === "active").length;
  const avgCompliance = totalMembers > 0
    ? Math.round(members.reduce((s, m) => s + (m.compliance ?? 80), 0) / totalMembers)
    : 0;
  const alerts = members.filter(m => m.status === "inactive").length;

  const today = new Date().toLocaleDateString("hu-HU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 h-full overflow-y-auto no-scrollbar animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Jó napot! 👋</h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>{today}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Betöltés...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Csapattagok"      value={totalMembers}  sub="aktív tag" />
            <StatCard label="Aktív"            value={activeToday}   sub="ma aktív" accent />
            <StatCard label="Átlag compliance" value={`${avgCompliance}%`} sub="elmúlt 30 nap" />
            <StatCard label="Figyelmeztetés"   value={alerts}        sub="inaktív tag" />
          </div>

          {/* Csapat gyors-áttekintés */}
          {totalMembers > 0 && (
            <div className="card p-5 flex flex-col gap-4">
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Csapat áttekintés</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {members.slice(0, 4).map(m => (
                  <div key={m.uid} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
                    <Avatar name={m.displayName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <StatusDot status={m.status} />
                        <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.displayName}</span>
                      </div>
                      <ComplianceBar value={m.compliance ?? 80} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalMembers === 0 && (
            <div className="card p-10 flex flex-col items-center gap-4 text-center">
              <div className="text-5xl">👥</div>
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Még nincs csapatod</h2>
              <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
                Hívj meg sportolókat a Csapat oldalon, és kövesd nyomon az edzéseiket innen.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Member Edit Modal ────────────────────────────────────────────────────────
function MemberEditModal({ member, allGroups, onSave, onRemove, onClose }: {
  member: TeamMember;
  allGroups: string[];
  onSave: (uid: string, group: string, status: string) => Promise<void>;
  onRemove: (uid: string) => Promise<void>;
  onClose: () => void;
}) {
  const [group, setGroup] = React.useState(member.group ?? "");
  const [customGroup, setCustomGroup] = React.useState("");
  const [useCustom, setUseCustom] = React.useState(false);
  const [status, setStatus] = React.useState(member.status);
  const [saving, setSaving] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  const effectiveGroup = useCustom ? customGroup : group;

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(member.uid, effectiveGroup, status); onClose(); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    setSaving(true);
    try { await onRemove(member.uid); onClose(); }
    finally { setSaving(false); }
  };

  const statusOptions = [
    { value: "active", label: "Aktív" },
    { value: "idle", label: "Inaktív" },
    { value: "inactive", label: "Kieső" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl flex flex-col gap-5 p-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={member.displayName} size="md" />
            <div>
              <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{member.displayName}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{member.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg pressable" style={{ color: "var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Csoport */}
        <div className="flex flex-col gap-2">
          <label className="label-xs">CSOPORT</label>
          {!useCustom ? (
            <div className="flex gap-2 flex-wrap">
              {allGroups.map(g => (
                <button key={g} onClick={() => setGroup(g)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold pressable"
                  style={{ background: group === g ? "var(--accent-primary)" : "var(--surface-2)", color: group === g ? "#080B0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                  {g}
                </button>
              ))}
              <button onClick={() => setUseCustom(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold pressable"
                style={{ background: "var(--surface-1)", color: "var(--accent-primary)", border: "1px dashed rgba(34,211,238,0.4)" }}>
                + Új csoport
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input autoFocus value={customGroup} onChange={e => setCustomGroup(e.target.value)}
                placeholder="Új csoport neve…"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
              <button onClick={() => setUseCustom(false)} className="px-3 py-2 rounded-xl text-xs pressable"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>Vissza</button>
            </div>
          )}
        </div>

        {/* Státusz */}
        <div className="flex flex-col gap-2">
          <label className="label-xs">STÁTUSZ</label>
          <div className="flex gap-2">
            {statusOptions.map(s => (
              <button key={s.value} onClick={() => setStatus(s.value as TeamMember["status"])}
                className="flex-1 py-2 rounded-xl text-xs font-semibold pressable"
                style={{ background: status === s.value ? "rgba(34,211,238,0.15)" : "var(--surface-2)", color: status === s.value ? "var(--accent-primary)" : "var(--text-secondary)", border: status === s.value ? "1px solid rgba(34,211,238,0.3)" : "1px solid var(--border-subtle)" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!confirmRemove ? (
            <>
              <button onClick={() => setConfirmRemove(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold pressable"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                Eltávolítás
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable"
                style={{ background: "var(--accent-primary)", color: "#080B0F" }}>
                {saving ? "Mentés…" : "Mentés ✓"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmRemove(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>Mégse</button>
              <button onClick={handleRemove} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable"
                style={{ background: "#ef4444", color: "#fff" }}>
                {saving ? "…" : "Igen, eltávolítom"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team Page (live) ─────────────────────────────────────────────────────────
function TeamPage({ members, loading, refresh, onInvite }: {
  members: TeamMember[];
  loading: boolean;
  refresh: () => void;
  onInvite: () => void;
}) {
  const [activeGroup, setActiveGroup] = React.useState("Összes");
  const [search, setSearch] = React.useState("");
  const [editMember, setEditMember] = React.useState<TeamMember | null>(null);

  const groups = Array.from(new Set(members.map(m => m.group ?? "").filter(Boolean)));
  const groupTabs = ["Összes", ...groups];

  const filtered = members.filter(m => {
    const groupMatch = activeGroup === "Összes" || m.group === activeGroup;
    const searchMatch = m.displayName.toLowerCase().includes(search.toLowerCase())
      || (m.email ?? "").toLowerCase().includes(search.toLowerCase());
    return groupMatch && searchMatch;
  });

  const statusLabel: Record<string, string> = { active: "Aktív", idle: "Inaktív", inactive: "Kieső", removed: "Eltávolítva" };

  const handleSave = async (uid: string, group: string, status: string) => {
    await apiUpdateMember(uid, { group, status });
    await refresh();
  };

  const handleRemove = async (uid: string) => {
    await apiRemoveMember(uid);
    await refresh();
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 h-full overflow-y-auto no-scrollbar animate-in">
      {editMember && (
        <MemberEditModal
          member={editMember}
          allGroups={groups}
          onSave={handleSave}
          onRemove={handleRemove}
          onClose={() => setEditMember(null)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Csapat</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{members.length} tag</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="p-2 rounded-xl pressable" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }} title="Frissítés">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          </button>
          <button onClick={onInvite} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold pressable"
            style={{ background: "var(--accent-primary)", color: "#080B0F" }}>+ Tag meghívása</button>
        </div>
      </div>

      {/* Csoport & Kereső szűrők */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
          {groupTabs.map(g => (
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

      {loading ? (
        <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>Betöltés...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">{members.length === 0 ? "👥" : "🔍"}</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {members.length === 0 ? "Még nincsenek csapattagok. Hívj meg valakit!" : "Nincs találat a keresésre."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Tag", "Csoport", "Státusz", "Email", "Compliance", ""].map((h, idx) => (
                    <th key={idx} className="px-4 py-3 text-left label-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.uid} className="transition-colors"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.displayName} size="sm" />
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{m.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {m.group ? (
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>{m.group}</span>
                      ) : <span style={{ color: "var(--text-muted)" }}>–</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={m.status} />
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{statusLabel[m.status] ?? m.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{m.email ?? "–"}</td>
                    <td className="px-4 py-3 min-w-[120px]"><ComplianceBar value={m.compliance ?? 80} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditMember(m)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium pressable"
                        style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                        ✏️ Szerkesztés
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
function PlaceholderPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center animate-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
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
  const [user, setUser] = React.useState<User | null>(null);
  const { members, loading, refresh } = useCoachTeam();

  React.useEffect(() => {
    return auth.onAuthStateChanged(u => setUser(u));
  }, []);

  // Meghívó küldés után frissítjük a taglistát
  const handleInviteClose = () => {
    setInviteOpen(false);
    refresh();
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage members={members} loading={loading} />;
      case "team":      return <TeamPage members={members} loading={loading} refresh={refresh} onInvite={() => setInviteOpen(true)} />;
      case "plans":     return <PlaceholderPage title="Edzéstervek" desc="Hozz létre részletes edzésterveket és rendeld hozzá csapattagjaidhoz." />;
      case "calendar":  return <PlaceholderPage title="Naptár" desc="Heti edzésmenetrend tervezése, szerkesztése és kiküldése." />;
      case "stats":     return <PlaceholderPage title="Statisztikák" desc="Csapatod teljesítményének részletes elemzése." />;
      case "devices":   return <PlaceholderPage title="Eszközök" desc="Bluetooth pulzusmérők és fitness trackerek csatlakoztatása." />;
      default:          return <DashboardPage members={members} loading={loading} />;
    }
  };

  return (
    <>
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      )}
      <div className={`fixed md:relative z-50 md:z-auto h-full transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ background: "var(--bg-surface)" }}>
        <Sidebar activePage={activePage} setActivePage={(p) => { setActivePage(p); setSidebarOpen(false); }} user={user} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 md:hidden"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
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
    <InviteModal open={inviteOpen} onClose={handleInviteClose} />
    </>
  );
}
