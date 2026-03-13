"use client";
// app/team/page.tsx – Free user csapat oldal: meghívók + tagságok
import * as React from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, getDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";

interface Invite {
  id: string;
  teamId: string;
  coachUid: string;
  status: string;
  group?: string;
  targetName?: string;
  createdAt: string;
  expiresAt: string;
  coachName?: string; // feltöltve runtime-ban
  teamName?: string;
}

interface Membership {
  teamId: string;
  teamName: string;
  coachName: string;
  group?: string;
  joinedAt: string;
  memberCount?: number;
}

// ─── Invite Card ─────────────────────────────────────────────────────────────
function InviteCard({ invite, onAccept, onDecline, busy }: {
  invite: Invite;
  onAccept: () => void;
  onDecline: () => void;
  busy: boolean;
}) {
  return (
    <div className="card p-5 animate-in flex flex-col gap-4"
      style={{ border: "1px solid rgba(34,211,238,0.25)", background: "rgba(34,211,238,0.04)" }}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
          🏋️
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>
            Edzői meghívó
          </div>
          <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
              {invite.teamName ?? "Névtelen csapat"}
            </span>
            {invite.coachName && (
              <span> · Edző: <span className="font-medium">{invite.coachName}</span></span>
            )}
          </div>
          {invite.group && (
            <div className="mt-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(34,211,238,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.2)" }}>
                {invite.group}
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
            style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
            Függő
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onAccept} disabled={busy}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold pressable"
          style={{ background: "var(--accent-primary)", color: "#080B0F", opacity: busy ? 0.6 : 1 }}>
          ✓ Elfogadom
        </button>
        <button onClick={onDecline} disabled={busy}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold pressable"
          style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", opacity: busy ? 0.6 : 1 }}>
          Elutasítom
        </button>
      </div>
    </div>
  );
}

// ─── Membership Card ─────────────────────────────────────────────────────────
function MembershipCard({ m }: { m: Membership }) {
  const initials = m.teamName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="card p-5 flex items-start gap-4 animate-in">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
        style={{ background: "linear-gradient(135deg,rgba(34,211,238,0.2),rgba(74,222,128,0.15))", border: "1px solid rgba(34,211,238,0.25)", color: "var(--accent-primary)" }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{m.teamName}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Edző: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{m.coachName}</span>
        </div>
        {m.group && (
          <div className="mt-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
              {m.group}
            </span>
          </div>
        )}
        <div className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
          Csatlakozva: {new Date(m.joinedAt).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" })}
        </div>
      </div>
      <span className="flex-shrink-0 text-[11px] px-2 py-1 rounded-full font-semibold"
        style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
        ✓ Tag
      </span>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="text-4xl">{icon}</div>
      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{title}</div>
      <div className="text-xs max-w-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [invites, setInvites] = React.useState<Invite[]>([]);
  const [memberships, setMemberships] = React.useState<Membership[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [resolved, setResolved] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);

  // Auth listener
  React.useEffect(() => {
    return auth.onAuthStateChanged(u => { setUser(u); if (!u) setLoading(false); });
  }, []);

  // Invites – realtime listener
  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "invites"),
      where("targetUid", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, async snap => {
      const now = new Date().toISOString();
      const active = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Invite))
        .filter(inv => inv.expiresAt > now);

      // Coach nevének és csapat nevének betöltése
      const enriched = await Promise.all(active.map(async inv => {
        try {
          const teamSnap = await getDoc(doc(db, "teams", inv.teamId));
          const teamData = teamSnap.data();
          const coachSnap = await getDoc(doc(db, "users", inv.coachUid));
          const coachData = coachSnap.data();
          return {
            ...inv,
            teamName: teamData?.name ?? "Névtelen csapat",
            coachName: coachData?.displayName ?? coachData?.email ?? "Ismeretlen edző",
          };
        } catch { return inv; }
      }));

      setInvites(enriched);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Memberships – hol vagyok tag (premiumUsers doc alapján, index nélkül működik)
  React.useEffect(() => {
    if (!user) return;
    const loadMemberships = async () => {
      try {
        // 1. Olvassuk a premiumUsers/{uid} doc-ot – tartalmazza a teamId-t
        const premSnap = await getDoc(doc(db, "premiumUsers", user.uid));
        if (!premSnap.exists()) return;
        const premData = premSnap.data();
        if (premData?.role !== "athlete" || !premData?.teamId) return;

        const teamId: string = premData.teamId;

        // 2. Ellenőrizzük hogy active-e a member doc
        const memberSnap = await getDoc(doc(db, "teams", teamId, "members", user.uid));
        if (!memberSnap.exists()) return;
        const memberData = memberSnap.data();
        if (memberData?.status === "removed") return;

        // 3. Team és coach adatok betöltése
        let teamName = "Névtelen csapat";
        let coachName = "Ismeretlen edző";
        try {
          const teamSnap = await getDoc(doc(db, "teams", teamId));
          const teamData = teamSnap.data();
          teamName = teamData?.name ?? teamName;
          if (teamData?.coachUid) {
            const coachSnap = await getDoc(doc(db, "users", teamData.coachUid));
            const coachData = coachSnap.data();
            coachName = coachData?.displayName ?? coachData?.email ?? coachName;
          }
        } catch { /* ignore */ }

        setMemberships([{
          teamId,
          teamName,
          coachName,
          group: memberData?.group,
          joinedAt: memberData?.joinedAt ?? new Date().toISOString(),
        }]);
      } catch { /* ignore */ }
    };
    loadMemberships();
  }, [user]);

  const handleAccept = async (inviteId: string) => {
    if (!user) return;
    setBusy(inviteId);
    try {
      const token = await user.getIdToken();
      const displayName = user.displayName || user.email?.split("@")[0] || "Tag";
      const res = await fetch("/api/coach/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteId, displayName, email: user.email ?? "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setResolved(prev => new Set([...prev, inviteId]));
        setTimeout(() => window.location.reload(), 800);
      } else {
        console.error("[team/accept] failed:", data);
        alert(`Hiba az elfogadásnál: ${data.error ?? res.status}\n${data.memberBody ?? ""}`);
      }
    } catch (e) {
      console.error("[team/accept] exception:", e);
    }
    setBusy(null);
  };

  const handleDecline = async (inviteId: string) => {
    setBusy(inviteId);
    setResolved(prev => new Set([...prev, inviteId]));
    await updateDoc(doc(db, "invites", inviteId), { status: "cancelled" });
    setBusy(null);
  };

  const visibleInvites = invites.filter(i => !resolved.has(i.id));

  return (
    <div className="min-h-dvh pb-28" style={{ background: "var(--bg-base)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-12 pb-4"
        style={{ background: "var(--bg-base)", borderBottom: "1px solid var(--border-subtle)" }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Csapat</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Meghívók és csapattagságok</p>
      </div>

      <div className="px-4 pt-6 flex flex-col gap-8 max-w-lg mx-auto">

        {/* Meghívók szekció */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Bejövő meghívók</h2>
            {visibleInvites.length > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "var(--accent-primary)", color: "#080B0F" }}>
                {visibleInvites.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Betöltés...</div>
          ) : visibleInvites.length === 0 ? (
            <EmptyState icon="📭" title="Nincs függő meghívó" desc="Ha egy edző meghív a csapatába, itt fog megjelenni." />
          ) : (
            <div className="flex flex-col gap-3">
              {visibleInvites.map(inv => (
                <InviteCard
                  key={inv.id}
                  invite={inv}
                  onAccept={() => handleAccept(inv.id)}
                  onDecline={() => handleDecline(inv.id)}
                  busy={busy === inv.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Csapataim szekció */}
        <section>
          <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Csapataim</h2>
          {memberships.length === 0 ? (
            <EmptyState icon="👥" title="Még nem vagy csapat tagja" desc="Fogadj el egy edzői meghívót, hogy csapathoz csatlakozz." />
          ) : (
            <div className="flex flex-col gap-3">
              {memberships.map(m => <MembershipCard key={m.teamId} m={m} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
