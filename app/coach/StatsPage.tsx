// app/coach/StatsPage.tsx
"use client";
import * as React from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { TeamMember } from "@/lib/coachTypes";

async function getToken(): Promise<string> {
  const auth = getAuth();
  if (auth.currentUser) return auth.currentUser.getIdToken();
  return new Promise((res, rej) => {
    const u = onAuthStateChanged(auth, user => {
      u(); user ? user.getIdToken().then(res).catch(rej) : rej(new Error("noauth"));
    });
  });
}

interface ScheduleEntry {
  date: string;
  assignments: { memberUid: string; memberName: string; programName: string; sessionName: string }[];
}

export function CoachStatsPage({ members }: { members: TeamMember[] }) {
  const today = new Date();
  const [entries, setEntries] = React.useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Utolsó 3 hónap betöltése
  React.useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const months = [-2, -1, 0].map(offset => {
          const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        });
        const allEntries: ScheduleEntry[] = [];
        for (const m of months) {
          const res = await fetch(`/api/coach/schedule?month=${m}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) continue;
          const data = await res.json();
          allEntries.push(...(data.entries ?? []));
        }
        setEntries(allEntries);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Heti edzésszám (elmúlt 8 hét)
  const weeklyData = React.useMemo(() => {
    const weeks: { label: string; count: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(today); start.setDate(today.getDate() - w * 7 - today.getDay());
      const end   = new Date(start); end.setDate(start.getDate() + 6);
      const count = entries.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      }).reduce((s, e) => s + e.assignments.length, 0);
      weeks.push({ label: `${start.getMonth()+1}/${start.getDate()}`, count });
    }
    return weeks;
  }, [entries]);

  // Tag aktivitás összesítő
  const memberStats = React.useMemo(() => {
    const map: Record<string, { name: string; sessionsAssigned: number; uid: string }> = {};
    for (const e of entries) {
      for (const a of e.assignments) {
        if (!map[a.memberUid]) map[a.memberUid] = { name: a.memberName, sessionsAssigned: 0, uid: a.memberUid };
        map[a.memberUid].sessionsAssigned++;
      }
    }
    return Object.values(map).sort((a, b) => b.sessionsAssigned - a.sessionsAssigned);
  }, [entries]);

  // Legnépszerűbb programok
  const programStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries)
      for (const a of e.assignments)
        map[a.programName] = (map[a.programName] ?? 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [entries]);

  const totalAssignments = entries.reduce((s, e) => s + e.assignments.length, 0);
  const totalDays = entries.length;
  const maxWeekly = Math.max(...weeklyData.map(w => w.count), 1);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto no-scrollbar">
      <div>
        <h1 className="text-xl font-black" style={{ color:"var(--text-primary)" }}>Statisztikák</h1>
        <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>Elmúlt 3 hónap</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color:"var(--text-muted)" }}>Betöltés…</div>
      ) : (<>

        {/* Összesítő számok */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label:"Edzésnapok", value:totalDays, sub:"kijelölt nap" },
            { label:"Kijelölések", value:totalAssignments, sub:"összesen" },
            { label:"Aktív tagok", value:memberStats.length, sub:"kapott edzést" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 flex flex-col gap-1"
              style={{ background:"var(--surface-1)", border:"1px solid var(--border-subtle)" }}>
              <div className="text-[10px]" style={{ color:"var(--text-muted)" }}>{s.label}</div>
              <div className="text-xl font-black" style={{ color:"var(--accent-primary)" }}>{s.value}</div>
              <div className="text-[10px]" style={{ color:"var(--text-muted)" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Heti aktivitás grafikon */}
        <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border-subtle)" }}>
          <div className="px-4 py-3" style={{ background:"var(--surface-1)", borderBottom:"1px solid var(--border-subtle)" }}>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color:"var(--text-muted)" }}>
              Heti kijelölések (elmúlt 8 hét)
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-end gap-1.5 h-24">
              {weeklyData.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm transition-all"
                    style={{
                      height: `${(w.count / maxWeekly) * 80}px`,
                      minHeight: w.count > 0 ? "4px" : "0",
                      background: i === weeklyData.length - 1
                        ? "var(--accent-primary)"
                        : "rgba(34,211,238,0.3)",
                    }}/>
                  <span className="text-[9px]" style={{ color:"var(--text-muted)" }}>{w.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tag aktivitás */}
        <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border-subtle)" }}>
          <div className="px-4 py-3" style={{ background:"var(--surface-1)", borderBottom:"1px solid var(--border-subtle)" }}>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color:"var(--text-muted)" }}>
              Tag aktivitás ranking
            </div>
          </div>
          <div className="divide-y" style={{ borderColor:"var(--border-subtle)" }}>
            {memberStats.length === 0 && (
              <div className="px-4 py-6 text-sm text-center" style={{ color:"var(--text-muted)" }}>Nincs adat</div>
            )}
            {memberStats.map((m, i) => {
              const memberComp = members.find(x => x.uid === m.uid)?.compliance ?? 0;
              const compColor = memberComp >= 70 ? "#22c55e" : memberComp >= 40 ? "#f59e0b" : "#ef4444";
              return (
                <div key={m.uid} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs font-black w-5 text-center" style={{ color:"var(--text-muted)" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color:"var(--text-primary)" }}>{m.name}</div>
                    <div className="text-xs" style={{ color:"var(--text-muted)" }}>{m.sessionsAssigned} kijelölt session</div>
                  </div>
                  <span className="text-xs font-bold" style={{ color:compColor }}>{memberComp}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top programok */}
        {programStats.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border-subtle)" }}>
            <div className="px-4 py-3" style={{ background:"var(--surface-1)", borderBottom:"1px solid var(--border-subtle)" }}>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color:"var(--text-muted)" }}>
                Legtöbbet használt programok
              </div>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {programStats.map(([name, count], i) => {
                const pct = Math.round((count / totalAssignments) * 100);
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold truncate" style={{ color:"var(--text-primary)" }}>{name}</span>
                      <span className="text-xs shrink-0 ml-2" style={{ color:"var(--text-muted)" }}>{count}×</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"var(--surface-2)" }}>
                      <div className="h-full rounded-full" style={{
                        width:`${pct}%`,
                        background: i === 0 ? "var(--accent-primary)" : "rgba(34,211,238,0.4)"
                      }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </>)}
    </div>
  );
}
