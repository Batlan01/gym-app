// lib/coachFirestore.ts
// Firestore helper függvények a coach/premium rendszerhez
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Team, TeamMember, Invite, PremiumUser } from "@/lib/coachTypes";

// ─── Gyűjtemény útvonalak ────────────────────────────────────────────────────
export const COLL_TEAMS         = "teams";
export const COLL_MEMBERS       = "members";       // subcollection under teams
export const COLL_INVITES        = "invites";
export const COLL_PREMIUM_USERS  = "premiumUsers";

// ─── PremiumUser ─────────────────────────────────────────────────────────────

export async function getPremiumUser(uid: string): Promise<PremiumUser | null> {
  const snap = await getDoc(doc(db, COLL_PREMIUM_USERS, uid));
  return snap.exists() ? (snap.data() as PremiumUser) : null;
}

export async function setPremiumUser(user: PremiumUser): Promise<void> {
  await setDoc(doc(db, COLL_PREMIUM_USERS, user.uid), user, { merge: true });
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function getTeam(teamId: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, COLL_TEAMS, teamId));
  return snap.exists() ? (snap.data() as Team) : null;
}

export async function createTeam(team: Team): Promise<void> {
  await setDoc(doc(db, COLL_TEAMS, team.id), team);
}

export async function getTeamByCoach(coachUid: string): Promise<Team | null> {
  const q = query(collection(db, COLL_TEAMS), where("coachUid", "==", coachUid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Team;
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const snap = await getDocs(collection(db, COLL_TEAMS, teamId, COLL_MEMBERS));
  return snap.docs.map(d => d.data() as TeamMember);
}

export async function addTeamMember(teamId: string, member: TeamMember): Promise<void> {
  await setDoc(doc(db, COLL_TEAMS, teamId, COLL_MEMBERS, member.uid), member);
}

export async function updateTeamMember(teamId: string, uid: string, data: Partial<TeamMember>): Promise<void> {
  await updateDoc(doc(db, COLL_TEAMS, teamId, COLL_MEMBERS, uid), data as Record<string, unknown>);
}

export async function removeTeamMember(teamId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, COLL_TEAMS, teamId, COLL_MEMBERS, uid), { status: "removed" });
}
// lib/coachFirestore.ts – continued (invites)

export async function getInvite(inviteId: string): Promise<Invite | null> {
  const snap = await getDoc(doc(db, COLL_INVITES, inviteId));
  return snap.exists() ? (snap.data() as Invite) : null;
}

export async function getInviteByCode(code: string): Promise<Invite | null> {
  const q = query(
    collection(db, COLL_INVITES),
    where("inviteCode", "==", code),
    where("status", "==", "pending"),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Invite;
}

export async function getInviteByEmail(email: string, teamId: string): Promise<Invite | null> {
  const q = query(
    collection(db, COLL_INVITES),
    where("email", "==", email),
    where("teamId", "==", teamId),
    where("status", "==", "pending"),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Invite;
}

export async function createInvite(invite: Invite): Promise<void> {
  await setDoc(doc(db, COLL_INVITES, invite.id), invite);
}

export async function updateInviteStatus(
  inviteId: string,
  status: Invite["status"],
  extra?: { acceptedBy?: string; acceptedAt?: string }
): Promise<void> {
  await updateDoc(doc(db, COLL_INVITES, inviteId), { status, ...extra });
}

export async function getPendingInvitesForTeam(teamId: string): Promise<Invite[]> {
  const q = query(
    collection(db, COLL_INVITES),
    where("teamId", "==", teamId),
    where("status", "==", "pending"),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Invite);
}
