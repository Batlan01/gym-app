// app/api/coach/invite/send-to-user/route.ts
// POST – in-app meghívó küldése egy létező usernek (uid alapján)
// Az invite megjelenik a célszemély appjában
// Body: { targetUid: string, targetEmail: string, targetName?: string, group?: string }
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError, nanoid } from "@/app/api/coach/_authHelper";
import { getTeamByCoach, createInvite, getTeamMembers } from "@/lib/coachFirestore";
import type { Invite } from "@/lib/coachTypes";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const team = await getTeamByCoach(uid);
  if (!team) return jsonError("No team found – create a team first", 404);

  const body = await req.json().catch(() => ({}));
  const targetUid: string = (body?.targetUid ?? "").trim();
  const targetEmail: string = (body?.targetEmail ?? "").trim().toLowerCase();
  const targetName: string = (body?.targetName ?? "").trim();
  const group: string = (body?.group ?? "").trim();

  if (!targetUid || !targetEmail) return jsonError("targetUid and targetEmail required");

  // Ne hívjuk meg magunkat
  if (targetUid === uid) return jsonError("Cannot invite yourself");

  // Már tag?
  const members = await getTeamMembers(team.id);
  if (members.some(m => m.uid === targetUid)) {
    return jsonError("Ez a felhasználó már a csapat tagja");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const invite: Invite = {
    id: nanoid(24),
    teamId: team.id,
    coachUid: uid,
    method: "email",
    email: targetEmail,
    targetUid,
    status: "pending",
    group: group || undefined,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await createInvite(invite);

  return Response.json({ invite }, { status: 201 });
}
