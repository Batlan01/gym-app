// app/api/coach/invite/accept/route.ts
// POST – tag elfogadja a meghívót
// Body: { inviteCode?: string, inviteId?: string, displayName: string }
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError } from "@/app/api/coach/_authHelper";
import {
  getInvite, getInviteByCode,
  updateInviteStatus, addTeamMember,
  setPremiumUser, getTeam,
} from "@/lib/coachFirestore";
import type { TeamMember, PremiumUser } from "@/lib/coachTypes";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const { inviteCode, inviteId, displayName, email } = body as {
    inviteCode?: string; inviteId?: string;
    displayName?: string; email?: string;
  };

  // Invite keresése kód vagy ID alapján
  const invite = inviteCode
    ? await getInviteByCode(inviteCode.trim().toUpperCase())
    : inviteId ? await getInvite(inviteId) : null;

  if (!invite) return jsonError("Invite not found or already used", 404);
  if (invite.status !== "pending") return jsonError("Invite is no longer valid");
  if (new Date(invite.expiresAt) < new Date()) {
    await updateInviteStatus(invite.id, "expired");
    return jsonError("Invite has expired");
  }

  // Email invite esetén egyeztetés
  if (invite.method === "email" && invite.email && email) {
    if (invite.email !== email.trim().toLowerCase()) {
      return jsonError("This invite was sent to a different email address");
    }
  }

  const now = new Date().toISOString();

  // Tag hozzáadása a csapathoz
  const member: TeamMember = {
    uid,
    displayName: (displayName ?? "").trim() || "Névtelen",
    email: email ?? "",
    group: invite.group ?? "Általános",
    status: "active",
    joinedAt: now,
    addedBy: invite.coachUid,
  };
  await addTeamMember(invite.teamId, member);

  // Invite elfogadva
  await updateInviteStatus(invite.id, "accepted", { acceptedBy: uid, acceptedAt: now });

  // PremiumUser (athlete)
  const premiumUser: PremiumUser = {
    uid, role: "athlete", plan: "premium",
    teamId: invite.teamId, createdAt: now,
  };
  await setPremiumUser(premiumUser);

  const team = await getTeam(invite.teamId);
  return Response.json({ ok: true, team });
}
