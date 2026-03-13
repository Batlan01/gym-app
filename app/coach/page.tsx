"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InviteModal } from "@/components/coach/InviteModal";
import { useCoachTeam, apiUpdateMember, apiRemoveMember } from "@/lib/useCoach";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import type { TeamMember } from "@/lib/coachTypes";

// ─── Shared primitives ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="card p-4 flex flex-col gap-1 min-w-0">
      <span className="label-xs">{label}</span>
      <span className="text-2xl font-bold tracking-tight" style={{ color: accent ? "var(--accent-primary)" : "var(--text-primary)" }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</span>}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { active: "#4ade80", idle: "#fbbf24", inactive: "#ef4444", removed: "#888" };
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[status] ?? "#888", boxShadow: `0 0 6px ${colors[status] ?? "#888"}80` }} />;
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
      style={{ background: "linear-gradient(135deg,rgba(34,211,238,0.2),rgba(74,222,128,0.15))", border: "1px solid rgba(34,211,238,0.25)", color: "var(--accent-primary)" }}>
      {initials}
    </div>
  );
}

// ─── Nav icons ────────────────────────────────────────────────────────────────
function IconDashboard() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconTeam()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="19" cy="7" r="3"/><path d="M21 21v-2a3 3 0 0 0-2-2.83"/></svg>; }
function IconPlans()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IconCalendar()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>; }
function IconStats()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ activePage, setActivePage, user }: { activePage: string; setActivePage: (p: string) => void; user: User | null }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard",    icon: <IconDashboard /> },
    { id: "team",      label: "Csapat",       icon: <IconTeam /> },
    { id: "plans",     label: "Tervek",       icon: <IconPlans /> },
    { id: "calendar",  label: "Naptár",       icon: <IconCalendar /> },
    { id: "stats",     label: "Statisztikák", icon: <IconStats /> },
  ];
  const displayName = user?.displayName ?? user?.email ?? "Coach";
  return (
    <aside className="flex flex-col h-full w-56 lg:w-64 flex-shrink-0" style={{ borderRight: "1px solid var(--border-subtle)" }}>
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm" style={{ background: "linear-gradient(135deg,#22d3ee,#4ade80)", color: "#080B0F" }}>A</div>
        <div>
          <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>ARCX</div>
          <div className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--accent-primary)" }}>COACH</div>
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

// ─── Mobile Bottom Tab Bar ────────────────────────────────────────────────────
function MobileTabBar({ activePage, setActivePage }: { activePage: string; setActivePage: (p: string) => void }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <IconDashboard /> },
    { id: "team",      label: "Csapat",    icon: <IconTeam /> },
    { id: "plans",     label: "Tervek",    icon: <IconPlans /> },
    { id: "calendar",  label: "Naptár",    icon: <IconCalendar /> },
    { id: "stats",     label: "Statisztikák", icon: <IconStats /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around px-2 pb-safe"
      style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)", height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tabs.map(t => {
        const active = activePage === t.id;
        return (
          <button key={t.id} onClick={() => setActivePage(t.id)}
            className="flex flex-col items-center gap-0.5 flex-1 py-2 pressable"
            style={{ color: active ? "var(--accent-primary)" : "var(--text-muted)" }}>
            <span style={{ opacity: active ? 1 : 0.6 }}>{t.icon}</span>
            <span className="text-[9px] font-semibold truncate max-w-[52px]">{t.label}</span>
            {active && <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: "var(--accent-primary)" }} />}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage({ members, loading }: { members: TeamMember[]; loading: boolean }) {
  const totalMembers = members.length;
  const activeToday = members.filter(m => m.status === "active").length;
  const avgCompliance = totalMembers > 0 ? Math.round(members.reduce((s, m) => s + (m.compliance ?? 0), 0) / totalMembers) : 0;
  const alerts = members.filter(m => m.status === "inactive").length;
  const today = new Date().toLocaleDateString("hu-HU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto no-scrollbar animate-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Jó napot! 👋</h1>
        <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>{today}</p>
      </div>
      {loading ? (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Betöltés...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Csapattagok"      value={totalMembers}       sub="összes tag" />
            <StatCard label="Aktív"            value={activeToday}        sub="jelenleg" accent />
            <StatCard label="Átlag compliance" value={`${avgCompliance}%`} sub="elmúlt 30 nap" />
            <StatCard label="Figyelmeztetés"   value={alerts}             sub="inaktív tag" />
          </div>
          {totalMembers > 0 && (
            <div className="card p-4 md:p-5 flex flex-col gap-3">
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Csapat áttekintés</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {members.slice(0, 4).map(m => (
                  <div key={m.uid} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
                    <Avatar name={m.displayName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <StatusDot status={m.status} />
                        <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.displayName}</span>
                      </div>
                      <ComplianceBar value={m.compliance ?? 0} />
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
              <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>Hívj meg sportolókat a Csapat oldalon.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Member Edit Modal ────────────────────────────────────────────────────────
function MemberEditModal({ member, allGroups, onSave, onRemove, onClose }: {
  member: TeamMember; allGroups: string[];
  onSave: (uid: string, group: string, status: string) => Promise<void>;
  onRemove: (uid: string) => Promise<void>; onClose: () => void;
}) {
  const [group, setGroup] = React.useState(member.group ?? "");
  const [customGroup, setCustomGroup] = React.useState("");
  const [useCustom, setUseCustom] = React.useState(false);
  const [status, setStatus] = React.useState(member.status);
  const [saving, setSaving] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const effectiveGroup = useCustom ? customGroup : group;

  const handleSave = async () => { setSaving(true); try { await onSave(member.uid, effectiveGroup, status); onClose(); } finally { setSaving(false); } };
  const handleRemove = async () => { setSaving(true); try { await onRemove(member.uid); onClose(); } finally { setSaving(false); } };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl flex flex-col gap-5 p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
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
        <div className="flex flex-col gap-2">
          <label className="label-xs">CSOPORT</label>
          {!useCustom ? (
            <div className="flex gap-2 flex-wrap">
              {allGroups.map(g => (
                <button key={g} onClick={() => setGroup(g)} className="px-3 py-1.5 rounded-lg text-xs font-semibold pressable"
                  style={{ background: group === g ? "var(--accent-primary)" : "var(--surface-2)", color: group === g ? "#080B0F" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>{g}</button>
              ))}
              <button onClick={() => setUseCustom(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold pressable"
                style={{ background: "var(--surface-1)", color: "var(--accent-primary)", border: "1px dashed rgba(34,211,238,0.4)" }}>+ Új csoport</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input autoFocus value={customGroup} onChange={e => setCustomGroup(e.target.value)} placeholder="Új csoport neve…"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ background: "var(--surface-1)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
              <button onClick={() => setUseCustom(false)} className="px-3 py-2 rounded-xl text-xs pressable" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>Vissza</button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="label-xs">STÁTUSZ</label>
          <div className="flex gap-2">
            {[{ value: "active", label: "Aktív" }, { value: "idle", label: "Inaktív" }, { value: "inactive", label: "Kieső" }].map(s => (
              <button key={s.value} onClick={() => setStatus(s.value as TeamMember["status"])} className="flex-1 py-2 rounded-xl text-xs font-semibold pressable"
                style={{ background: status === s.value ? "rgba(34,211,238,0.15)" : "var(--surface-2)", color: status === s.value ? "var(--accent-primary)" : "var(--text-secondary)", border: status === s.value ? "1px solid rgba(34,211,238,0.3)" : "1px solid var(--border-subtle)" }}>{s.label}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {!confirmRemove ? (
            <>
              <button onClick={() => setConfirmRemove(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold pressable"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Eltávolítás</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable"
                style={{ background: "var(--accent-primary)", color: "#080B0F" }}>{saving ? "Mentés…" : "Mentés ✓"}</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmRemove(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>Mégse</button>
              <button onClick={handleRemove} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable"
                style={{ background: "#ef4444", color: "#fff" }}>{saving ? "…" : "Igen, eltávolítom"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group Manager Modal ──────────────────────────────────────────────────────
function GroupManagerModal({ groups, members, onClose, onRename, onDelete, onCreate }: {
  groups: string[]; members: TeamMember[]; onClose: () => void;
  onRename: (o: string, n: string) => Promise<void>;
  onDelete: (g: string) => Promise<void>;
  onCreate: (name: string) => void;
}) {
  const [editingGroup, setEditingGroup] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const countInGroup = (g: string) => members.filter(m => m.group === g).length;
  const handleCreate = () => { if (!createName.trim()) return; onCreate(createName.trim()); setCreateName(""); setCreating(false); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl flex flex-col gap-4 p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Csoportok kezelése</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg pressable" style={{ color: "var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {groups.map(g => (
            <div key={g} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
              {editingGroup === g ? (
                <>
                  <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
                  <button disabled={saving} onClick={async () => { if (!newName.trim() || newName === g) { setEditingGroup(null); return; } setSaving(true); await onRename(g, newName.trim()); setSaving(false); setEditingGroup(null); }}
                    className="text-xs font-semibold px-2 py-1 rounded-lg pressable" style={{ background: "var(--accent-primary)", color: "#080B0F" }}>{saving ? "…" : "Ment"}</button>
                  <button onClick={() => setEditingGroup(null)} className="text-xs px-2 py-1 rounded-lg pressable" style={{ color: "var(--text-muted)" }}>Mégse</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{g}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{countInGroup(g)} tag</span>
                  <button onClick={() => { setEditingGroup(g); setNewName(g); }} className="p-1.5 rounded-lg pressable" style={{ color: "var(--text-muted)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={async () => { setSaving(true); await onDelete(g); setSaving(false); }} className="p-1.5 rounded-lg pressable" style={{ color: "#ef4444" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </>
              )}
            </div>
          ))}
          {creating ? (
            <div className="flex gap-2 mt-1">
              <input autoFocus value={createName} onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
                placeholder="Csoport neve…" className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-1)", border: "1px solid var(--accent-primary)", color: "var(--text-primary)" }} />
              <button onClick={handleCreate} className="px-3 py-2 rounded-xl text-xs font-semibold pressable" style={{ background: "var(--accent-primary)", color: "#080B0F" }}>Létrehoz</button>
              <button onClick={() => { setCreating(false); setCreateName(""); }} className="px-3 py-2 rounded-xl text-xs pressable" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>Mégse</button>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold pressable mt-1"
              style={{ background: "rgba(34,211,238,0.08)", color: "var(--accent-primary)", border: "1px dashed rgba(34,211,238,0.35)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Új csoport létrehozása
            </button>
          )}
        </div>
        <button onClick={onClose} className="py-2.5 rounded-xl text-sm font-semibold pressable" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>Bezárás</button>
      </div>
    </div>
  );
}

// ─── Team Page ────────────────────────────────────────────────────────────────
function TeamPage({ members, loading, refresh, onInvite }: { members: TeamMember[]; loading: boolean; refresh: () => void; onInvite: () => void }) {
  const [activeGroup, setActiveGroup] = React.useState("Összes");
  const [search, setSearch] = React.useState("");
  const [editMember, setEditMember] = React.useState<TeamMember | null>(null);
  const [groupManagerOpen, setGroupManagerOpen] = React.useState(false);
  const [localGroups, setLocalGroups] = React.useState<string[]>([]);

  const groups = Array.from(new Set(members.map(m => m.group ?? "").filter(Boolean)));
  const allGroups = Array.from(new Set([...groups, ...localGroups]));
  const groupTabs = ["Összes", ...allGroups];
  const statusLabel: Record<string, string> = { active: "Aktív", idle: "Inaktív", inactive: "Kieső", removed: "Eltávolítva" };

  const filtered = members.filter(m => {
    const groupMatch = activeGroup === "Összes" || m.group === activeGroup;
    const searchMatch = m.displayName.toLowerCase().includes(search.toLowerCase()) || (m.email ?? "").toLowerCase().includes(search.toLowerCase());
    return groupMatch && searchMatch;
  });

  const handleSave = async (uid: string, group: string, status: string) => { await apiUpdateMember(uid, { group, status }); await refresh(); };
  const handleRemove = async (uid: string) => { await apiRemoveMember(uid); await refresh(); };
  const handleRenameGroup = async (oldName: string, newName: string) => {
    await Promise.all(members.filter(m => m.group === oldName).map(m => apiUpdateMember(m.uid, { group: newName, status: m.status })));
    await refresh();
  };
  const handleDeleteGroup = async (groupName: string) => {
    await Promise.all(members.filter(m => m.group === groupName).map(m => apiUpdateMember(m.uid, { group: "", status: m.status })));
    await refresh();
  };
  const handleCreateGroup = (name: string) => { if (!allGroups.includes(name)) setLocalGroups(prev => [...prev, name]); };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar animate-in">
      {editMember && <MemberEditModal member={editMember} allGroups={allGroups} onSave={handleSave} onRemove={handleRemove} onClose={() => setEditMember(null)} />}
      {groupManagerOpen && <GroupManagerModal groups={allGroups} members={members} onClose={() => setGroupManagerOpen(false)} onRename={handleRenameGroup} onDelete={handleDeleteGroup} onCreate={handleCreateGroup} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 lg:px-8 pt-5 pb-4 flex-wrap" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Csapat</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{members.length} tag</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setGroupManagerOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold pressable"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-mid)", color: "var(--text-secondary)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
            Csoportok
          </button>
          <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold pressable"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-mid)", color: "var(--text-secondary)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            <span className="hidden sm:inline">Frissítés</span>
          </button>
          <button onClick={onInvite} className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold pressable"
            style={{ background: "var(--accent-primary)", color: "#080B0F" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tag meghívása
          </button>
        </div>
      </div>

      {/* Szűrők */}
      <div className="flex items-center gap-2 px-4 md:px-6 lg:px-8 py-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
          {groupTabs.map(g => (
            <button key={g} onClick={() => setActiveGroup(g)} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all pressable"
              style={{ background: activeGroup === g ? "var(--accent-primary)" : "transparent", color: activeGroup === g ? "#080B0F" : "var(--text-secondary)" }}>{g}</button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Keresés…"
          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }} />
      </div>

      {/* Tartalom — mobilon kártyák, desktopön táblázat */}
      <div className="px-4 md:px-6 lg:px-8 pb-24 md:pb-8">
        {loading ? (
          <div className="text-sm py-16 text-center" style={{ color: "var(--text-muted)" }}>Betöltés...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">{members.length === 0 ? "👥" : "🔍"}</div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{members.length === 0 ? "Még nincsenek csapattagok." : "Nincs találat."}</p>
            {members.length === 0 && <button onClick={onInvite} className="px-4 py-2 rounded-xl text-sm font-semibold pressable" style={{ background: "var(--accent-primary)", color: "#080B0F" }}>+ Tag meghívása</button>}
          </div>
        ) : (
          <>
            {/* Mobil: kártyák */}
            <div className="flex flex-col gap-2 md:hidden">
              {filtered.map(m => (
                <button key={m.uid} onClick={() => setEditMember(m)} className="w-full text-left pressable rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
                  <Avatar name={m.displayName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{m.displayName}</span>
                      <StatusDot status={m.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {m.group && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>{m.group}</span>}
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{statusLabel[m.status]}</span>
                    </div>
                    <div className="mt-2"><ComplianceBar value={m.compliance ?? 0} /></div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}
            </div>
            {/* Desktop: táblázat */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      {["Tag", "Csoport", "Státusz", "Email", "Compliance"].map((h, idx) => (
                        <th key={idx} className="px-4 py-3 text-left label-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m, i) => (
                      <tr key={m.uid} onClick={() => setEditMember(m)} className="transition-colors cursor-pointer"
                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={m.displayName} size="sm" /><span className="font-medium" style={{ color: "var(--text-primary)" }}>{m.displayName}</span></div></td>
                        <td className="px-4 py-3">{m.group ? <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>{m.group}</span> : <span style={{ color: "var(--text-muted)" }}>–</span>}</td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1.5"><StatusDot status={m.status} /><span className="text-xs" style={{ color: "var(--text-secondary)" }}>{statusLabel[m.status] ?? m.status}</span></div></td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{m.email ?? "–"}</td>
                        <td className="px-4 py-3 min-w-[140px]"><ComplianceBar value={m.compliance ?? 0} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Plans Page ──────────────────────────────────────────────────────────────
type CoachProgram = {
  id: string; name: string; description?: string; sport: string; level: string;
  category: string; sessions: unknown[]; assignedTo: string[]; createdAt: number; updatedAt: number;
};

const LEVEL_LABEL: Record<string, string> = { beginner:"Kezdő", intermediate:"Középhaladó", advanced:"Haladó" };
const LEVEL_COLOR: Record<string, string> = { beginner:"rgba(74,222,128,0.15)", intermediate:"rgba(34,211,238,0.15)", advanced:"rgba(251,191,36,0.15)" };
const LEVEL_TEXT: Record<string, string>  = { beginner:"#4ade80", intermediate:"#22d3ee", advanced:"#fbbf24" };
const DEFAULT_CATEGORIES = ["Erő", "Kardio", "Mobilitás", "Feltöltő"];

async function getToken(): Promise<string> {
  const { getAuth, onAuthStateChanged } = await import("firebase/auth");
  const auth = getAuth();
  if (auth.currentUser) return auth.currentUser.getIdToken();
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) user.getIdToken().then(resolve).catch(reject);
      else reject(new Error("Not authenticated"));
    });
  });
}

async function apiCall(method: string, path: string, body?: unknown) {
  const token = await getToken();
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ─── Category Manager Modal ───────────────────────────────────────────────────
function CategoryManagerModal({ categories, onClose, onChange }: {
  categories: string[]; onClose: () => void;
  onChange: (cats: string[]) => void;
}) {
  const [list, setList] = React.useState<string[]>(categories);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [editIdx, setEditIdx] = React.useState<number | null>(null);
  const [editVal, setEditVal] = React.useState("");

  const addCat = () => {
    if (!newName.trim() || list.includes(newName.trim())) return;
    const updated = [...list, newName.trim()];
    setList(updated); onChange(updated); setNewName(""); setCreating(false);
  };
  const renameCat = (idx: number) => {
    if (!editVal.trim()) return;
    const updated = list.map((c, i) => i === idx ? editVal.trim() : c);
    setList(updated); onChange(updated); setEditIdx(null);
  };
  const deleteCat = (idx: number) => {
    const updated = list.filter((_, i) => i !== idx);
    setList(updated); onChange(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl flex flex-col gap-4 p-6" style={{ background:"var(--bg-surface)", border:"1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base" style={{ color:"var(--text-primary)" }}>Kategóriák kezelése</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg pressable" style={{ color:"var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
          {list.map((cat, idx) => (
            <div key={cat + idx} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
              {editIdx === idx ? (
                <>
                  <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") renameCat(idx); if (e.key === "Escape") setEditIdx(null); }}
                    className="flex-1 bg-transparent text-sm outline-none" style={{ color:"var(--text-primary)" }} />
                  <button onClick={() => renameCat(idx)} className="text-xs font-semibold px-2 py-1 rounded-lg pressable" style={{ background:"var(--accent-primary)", color:"#080B0F" }}>Ment</button>
                  <button onClick={() => setEditIdx(null)} className="text-xs px-2 py-1 rounded-lg pressable" style={{ color:"var(--text-muted)" }}>×</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium" style={{ color:"var(--text-primary)" }}>{cat}</span>
                  <button onClick={() => { setEditIdx(idx); setEditVal(cat); }} className="p-1.5 rounded-lg pressable" style={{ color:"var(--text-muted)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => deleteCat(idx)} className="p-1.5 rounded-lg pressable" style={{ color:"#ef4444" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </>
              )}
            </div>
          ))}
          {creating ? (
            <div className="flex gap-2 mt-1">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addCat(); if (e.key === "Escape") setCreating(false); }}
                placeholder="Kategória neve…" className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background:"var(--surface-1)", border:"1px solid var(--accent-primary)", color:"var(--text-primary)" }} />
              <button onClick={addCat} className="px-3 py-2 rounded-xl text-xs font-semibold pressable" style={{ background:"var(--accent-primary)", color:"#080B0F" }}>Hozzáad</button>
              <button onClick={() => { setCreating(false); setNewName(""); }} className="px-3 py-2 rounded-xl text-xs pressable" style={{ background:"var(--surface-2)", color:"var(--text-muted)" }}>×</button>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold pressable mt-1"
              style={{ background:"rgba(34,211,238,0.08)", color:"var(--accent-primary)", border:"1px dashed rgba(34,211,238,0.35)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Új kategória
            </button>
          )}
        </div>
        <button onClick={onClose} className="py-2.5 rounded-xl text-sm font-semibold pressable" style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>Kész</button>
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ program, members, onSave, onClose }: {
  program: CoachProgram; members: TeamMember[];
  onSave: (uids: string[]) => Promise<void>; onClose: () => void;
}) {
  const [selected, setSelected] = React.useState<string[]>(program.assignedTo ?? []);
  const [saving, setSaving] = React.useState(false);
  const toggle = (uid: string) => setSelected(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
  const handleSave = async () => { setSaving(true); try { await onSave(selected); onClose(); } finally { setSaving(false); } };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl flex flex-col gap-4 p-6" style={{ background:"var(--bg-surface)", border:"1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base" style={{ color:"var(--text-primary)" }}>Hozzárendelés</h2>
            <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{program.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg pressable" style={{ color:"var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color:"var(--text-muted)" }}>Még nincsenek csapattagok.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {members.map(m => {
              const checked = selected.includes(m.uid);
              return (
                <button key={m.uid} onClick={() => toggle(m.uid)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl pressable text-left"
                  style={{ background: checked ? "rgba(34,211,238,0.1)" : "var(--surface-1)", border: checked ? "1px solid rgba(34,211,238,0.3)" : "1px solid var(--border-subtle)" }}>
                  <Avatar name={m.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color:"var(--text-primary)" }}>{m.displayName}</div>
                    {m.group && <div className="text-xs" style={{ color:"var(--text-muted)" }}>{m.group}</div>}
                  </div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: checked ? "var(--accent-primary)" : "var(--surface-2)", border: checked ? "none" : "1px solid var(--border-mid)" }}>
                    {checked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#080B0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable" style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>Mégse</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold pressable" style={{ background:"var(--accent-primary)", color:"#080B0F" }}>
            {saving ? "Mentés…" : `✓ Mentés (${selected.length} tag)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Program Modal ─────────────────────────────────────────────────────
function CreateProgramModal({ categories, onClose, onCreate }: {
  categories: string[]; onClose: () => void;
  onCreate: (name: string, category: string, level: string) => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState(categories[0] ?? "Általános");
  const [level, setLevel] = React.useState("beginner");
  const [saving, setSaving] = React.useState(false);
  const levels = [["beginner","Kezdő"],["intermediate","Középhaladó"],["advanced","Haladó"]];
  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await onCreate(name.trim(), category, level); onClose(); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl flex flex-col gap-5 p-6" style={{ background:"var(--bg-surface)", border:"1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base" style={{ color:"var(--text-primary)" }}>Új edzésterv</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg pressable" style={{ color:"var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div>
          <label className="label-xs block mb-1.5">PROGRAM NEVE *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="pl. Haladó Push/Pull/Legs" maxLength={60} autoFocus
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
            style={{ background:"var(--surface-1)", border:"1px solid var(--border-mid)", color:"var(--text-primary)" }} />
        </div>
        <div>
          <label className="label-xs block mb-2">KATEGÓRIA</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className="rounded-full px-3 py-1.5 text-xs font-semibold pressable transition-all"
                style={category===cat ? { background:"var(--accent-primary)", color:"#000" } : { background:"var(--surface-1)", color:"var(--text-secondary)", border:"1px solid var(--border-subtle)" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label-xs block mb-2">SZINT</label>
          <div className="flex gap-2">
            {levels.map(([id, label]) => (
              <button key={id} onClick={() => setLevel(id)} className="flex-1 py-2 rounded-xl text-xs font-semibold pressable"
                style={level===id ? { background:"rgba(34,211,238,0.15)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.3)" } : { background:"var(--surface-2)", color:"var(--text-secondary)", border:"1px solid var(--border-subtle)" }}>{label}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold pressable" style={{ background:"var(--surface-2)", color:"var(--text-secondary)" }}>Mégse</button>
          <button onClick={handleCreate} disabled={!name.trim() || saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold pressable"
            style={{ background: name.trim() ? "var(--accent-primary)" : "var(--surface-2)", color: name.trim() ? "#080B0F" : "var(--text-muted)" }}>
            {saving ? "Létrehozás…" : "Létrehozás →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Program Card ─────────────────────────────────────────────────────────────
function ProgramCard({ p, members, onAssign, onDelete, onEdit, deleting }: {
  p: CoachProgram; members: TeamMember[];
  onAssign: () => void; onDelete: () => void; onEdit: () => void; deleting: boolean;
}) {
  const assignedCount = (p.assignedTo ?? []).length;
  const assignedNames = members.filter(m => (p.assignedTo ?? []).includes(m.uid)).map(m => m.displayName);
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all"
      style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <button onClick={onEdit} className="font-bold text-sm truncate text-left w-full pressable hover:underline"
            style={{ color:"var(--text-primary)" }}>{p.name}</button>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background:LEVEL_COLOR[p.level]??"rgba(34,211,238,0.1)", color:LEVEL_TEXT[p.level]??"#22d3ee" }}>
              {LEVEL_LABEL[p.level] ?? p.level}
            </span>
            <span className="text-xs" style={{ color:"var(--text-muted)" }}>{(p.sessions ?? []).length} session</span>
          </div>
        </div>
        <button onClick={onDelete} disabled={deleting} className="shrink-0 p-1.5 rounded-lg pressable" style={{ color:"#ef4444", opacity: deleting ? 0.4 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
      <div className="text-xs" style={{ color:"var(--text-muted)" }}>
        {assignedCount > 0
          ? <><span style={{ color:"var(--accent-primary)" }}>👤 {assignedCount} tag</span>: {assignedNames.slice(0,3).join(", ")}{assignedNames.length > 3 ? ` +${assignedNames.length-3}` : ""}</>
          : "Nincs hozzárendelve"}
      </div>
      <div className="flex gap-2 mt-auto pt-1">
        <button onClick={onEdit} className="flex-1 py-2 rounded-xl text-xs font-semibold pressable"
          style={{ background:"var(--surface-2)", color:"var(--text-secondary)", border:"1px solid var(--border-subtle)" }}>
          ✏️ Szerkesztés
        </button>
        <button onClick={onAssign} className="flex-1 py-2 rounded-xl text-xs font-semibold pressable"
          style={{ background:"rgba(34,211,238,0.08)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.2)" }}>
          👤 Hozzárendelés
        </button>
      </div>
    </div>
  );
}

// ─── Plans Page Main ──────────────────────────────────────────────────────────
function PlansPage({ members, user }: { members: TeamMember[]; user: User | null }) {
  const router = useRouter();
  const [programs, setPrograms] = React.useState<CoachProgram[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("coach_categories");
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });
  const [activeCategory, setActiveCategory] = React.useState("Összes");
  const [showCreate, setShowCreate] = React.useState(false);
  const [showCatManager, setShowCatManager] = React.useState(false);
  const [assignTarget, setAssignTarget] = React.useState<CoachProgram | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const saveCategories = (cats: string[]) => {
    setCategories(cats);
    try { localStorage.setItem("coach_categories", JSON.stringify(cats)); } catch {}
  };

  const loadPrograms = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("GET", "/api/coach/programs");
      setPrograms((data.programs ?? []).sort((a: CoachProgram, b: CoachProgram) => b.createdAt - a.createdAt));
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { if (user) loadPrograms(); }, [user, loadPrograms]);

  const handleCreate = async (name: string, category: string, level: string) => {
    const result = await apiCall("POST", "/api/coach/programs", { name, category, sport: "gym", level });
    if (result.id) router.push(`/programs/${result.id}`);
    else await loadPrograms();
  };

  const handleAssign = async (programId: string, uids: string[]) => {
    await apiCall("PATCH", "/api/coach/programs", { programId, assignedTo: uids });
    await loadPrograms();
  };

  const handleDelete = async (programId: string) => {
    if (!confirm("Biztosan törlöd ezt a programot?")) return;
    setDeletingId(programId);
    try { await apiCall("DELETE", `/api/coach/programs?programId=${programId}`); await loadPrograms(); }
    finally { setDeletingId(null); }
  };

  // Collect all categories used + user-defined
  const usedCategories = Array.from(new Set(programs.map(p => p.category).filter(Boolean)));
  const allCategories = Array.from(new Set([...categories, ...usedCategories]));
  const categoryTabs = ["Összes", ...allCategories];

  const visiblePrograms = activeCategory === "Összes"
    ? programs
    : programs.filter(p => p.category === activeCategory);

  // Group by category for "Összes" view
  const grouped: Record<string, CoachProgram[]> = {};
  if (activeCategory === "Összes") {
    for (const p of programs) {
      const cat = p.category || "Kategória nélkül";
      grouped[cat] = grouped[cat] ?? [];
      grouped[cat].push(p);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar animate-in">
      {showCreate && <CreateProgramModal categories={allCategories} onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {showCatManager && <CategoryManagerModal categories={categories} onClose={() => setShowCatManager(false)} onChange={saveCategories} />}
      {assignTarget && <AssignModal program={assignTarget} members={members} onSave={uids => handleAssign(assignTarget.id, uids)} onClose={() => setAssignTarget(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 lg:px-8 pt-5 pb-4 flex-wrap" style={{ borderBottom:"1px solid var(--border-subtle)" }}>
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color:"var(--text-primary)" }}>Tervek</h1>
          <p className="text-sm mt-0.5" style={{ color:"var(--text-muted)" }}>{programs.length} edzésterv</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCatManager(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold pressable"
            style={{ background:"var(--surface-1)", border:"1px solid var(--border-mid)", color:"var(--text-secondary)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Kategóriák
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold pressable"
            style={{ background:"var(--accent-primary)", color:"#080B0F" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Új program
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-4 md:px-6 lg:px-8 pt-3 pb-0">
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar" style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
          {categoryTabs.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all pressable"
              style={{ background: activeCategory===cat ? "var(--accent-primary)" : "transparent", color: activeCategory===cat ? "#080B0F" : "var(--text-secondary)" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 py-4 pb-24 md:pb-8">
        {loading ? (
          <div className="text-sm py-16 text-center" style={{ color:"var(--text-muted)" }}>Betöltés...</div>
        ) : programs.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">📋</div>
            <h2 className="font-bold text-lg" style={{ color:"var(--text-primary)" }}>Még nincs edzésterved</h2>
            <p className="text-sm max-w-xs" style={{ color:"var(--text-muted)" }}>Hozz létre programokat és rendeld hozzá a csapattagjaidhoz.</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-2xl text-sm font-bold pressable"
              style={{ background:"rgba(34,211,238,0.12)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.25)" }}>
              + Első program létrehozása
            </button>
          </div>
        ) : activeCategory === "Összes" ? (
          // Grouped by category
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([cat, progs]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-bold" style={{ color:"var(--text-primary)" }}>{cat}</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background:"var(--surface-2)", color:"var(--text-muted)" }}>{progs.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {progs.map(p => (
                    <ProgramCard key={p.id} p={p} members={members}
                      onAssign={() => setAssignTarget(p)}
                      onDelete={() => handleDelete(p.id)}
                      onEdit={() => router.push(`/programs/${p.id}`)}
                      deleting={deletingId === p.id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Single category view
          visiblePrograms.length === 0 ? (
            <div className="card p-10 flex flex-col items-center gap-3 text-center">
              <div className="text-4xl">📂</div>
              <p className="text-sm" style={{ color:"var(--text-muted)" }}>Ebben a kategóriában még nincs program.</p>
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-xs font-semibold pressable"
                style={{ background:"rgba(34,211,238,0.1)", color:"var(--accent-primary)", border:"1px solid rgba(34,211,238,0.2)" }}>
                + Új program ide
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {visiblePrograms.map(p => (
                <ProgramCard key={p.id} p={p} members={members}
                  onAssign={() => setAssignTarget(p)}
                  onDelete={() => handleDelete(p.id)}
                  onEdit={() => router.push(`/programs/${p.id}`)}
                  deleting={deletingId === p.id} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
function PlaceholderPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 pb-24 md:pb-8 text-center animate-in">
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
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const { members, loading, refresh } = useCoachTeam();

  React.useEffect(() => { return auth.onAuthStateChanged(u => setUser(u)); }, []);

  const handleInviteClose = () => { setInviteOpen(false); refresh(); };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage members={members} loading={loading} />;
      case "team":      return <TeamPage members={members} loading={loading} refresh={refresh} onInvite={() => setInviteOpen(true)} />;
      case "plans":     return <PlansPage members={members} user={user} />;
      case "calendar":  return <PlaceholderPage title="Naptár" desc="Heti edzésmenetrend tervezése, szerkesztése és kiküldése." />;
      case "stats":     return <PlaceholderPage title="Statisztikák" desc="Csapatod teljesítményének részletes elemzése." />;
      default:          return <DashboardPage members={members} loading={loading} />;
    }
  };

  return (
    <>
      <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>

        {/* Desktop sidebar — csak md+ */}
        <div className="hidden md:flex h-full" style={{ background: "var(--bg-surface)" }}>
          <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />
        </div>

        {/* Tartalom */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between px-4 py-3 md:hidden"
            style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs" style={{ background: "linear-gradient(135deg,#22d3ee,#4ade80)", color: "#080B0F" }}>A</div>
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>ARCX Coach</span>
            </div>
            <Link href="/workout" className="text-xs font-semibold px-3 py-1.5 rounded-lg pressable"
              style={{ background: "var(--surface-1)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>← App</Link>
          </div>

          {/* Desktop "Vissza az appba" gomb */}
          <div className="hidden md:flex absolute top-4 right-6 z-10">
            <Link href="/workout" className="text-xs font-semibold px-3 py-1.5 rounded-lg pressable"
              style={{ background: "var(--surface-1)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>← Vissza az appba</Link>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {renderPage()}
          </div>
        </div>
      </div>

      {/* Mobil bottom tab bar */}
      <MobileTabBar activePage={activePage} setActivePage={setActivePage} />

      <InviteModal open={inviteOpen} onClose={handleInviteClose} />
    </>
  );
}
