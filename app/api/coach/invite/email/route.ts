// app/api/coach/invite/email/route.ts
// POST – email alapú meghívó küldése
// Body: { email: string, group?: string }
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError, nanoid } from "@/app/api/coach/_authHelper";
import {
  getTeamByCoach, createInvite, getInviteByEmail,
} from "@/lib/coachFirestore";
import type { Invite } from "@/lib/coachTypes";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const team = await getTeamByCoach(uid);
  if (!team) return jsonError("No team found – create a team first", 404);

  const body = await req.json().catch(() => ({}));
  const email: string = (body?.email ?? "").trim().toLowerCase();
  const group: string = (body?.group ?? "").trim() || "Általános";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Valid email required");
  }

  // Már van pending invite erre az email-re?
  const existing = await getInviteByEmail(email, team.id);
  if (existing) {
    return Response.json({ invite: existing, alreadyExists: true });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 nap

  const invite: Invite = {
    id: nanoid(24),
    teamId: team.id,
    coachUid: uid,
    method: "email",
    email,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await createInvite(invite);

  // TODO: itt fog jönni az email küldés (Resend/SendGrid)
  // await sendInviteEmail({ to: email, coachName: team.coachName, inviteId: invite.id, teamName: team.name });

  return Response.json({ invite }, { status: 201 });
}
