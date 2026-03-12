// lib/useCoach.ts
// React hook – coach API hívások kezelése (auth token auto-inject)
"use client";
import * as React from "react";
import { auth } from "@/lib/firebase";
import type { Team, TeamMember, Invite } from "@/lib/coachTypes";

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = await getToken();
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export async function apiCreateTeam(name: string): Promise<Team> {
  const res = await apiFetch("/api/coach/team/create", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.team;
}

export async function apiGetMembers(): Promise<{ teamId: string; members: TeamMember[] }> {
  const res = await apiFetch("/api/coach/team/members");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiRemoveMember(memberUid: string): Promise<void> {
  const res = await apiFetch("/api/coach/team/members", {
    method: "DELETE",
    body: JSON.stringify({ memberUid }),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ─── Invites ──────────────────────────────────────────────────────────────────
export async function apiInviteByEmail(email: string, group?: string): Promise<Invite> {
  const res = await apiFetch("/api/coach/invite/email", {
    method: "POST",
    body: JSON.stringify({ email, group }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.invite;
}

export async function apiGenerateInviteCode(group?: string): Promise<Invite> {
  const res = await apiFetch("/api/coach/invite/code", {
    method: "POST",
    body: JSON.stringify({ group }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.invite;
}

export async function apiAcceptInvite(params: {
  inviteCode?: string;
  inviteId?: string;
  displayName: string;
  email?: string;
}): Promise<{ ok: boolean; team: Team }> {
  const res = await apiFetch("/api/coach/invite/accept", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── useCoachTeam hook ────────────────────────────────────────────────────────
export function useCoachTeam() {
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [teamId, setTeamId]   = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetMembers();
      setTeamId(data.teamId);
      setMembers(data.members.filter(m => m.status !== "removed"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hiba");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  return { members, teamId, loading, error, refresh };
}
