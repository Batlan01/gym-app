// app/api/coach/invite/code/route.ts
// POST – in-app invite kód generálása
// Body: { group?: string }
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError, nanoid, makeInviteCode } from "@/app/api/coach/_authHelper";
import { getTeamByCoach, createInvite } from "@/lib/coachFirestore";
import type { Invite } from "@/lib/coachTypes";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const team = await getTeamByCoach(uid);
  if (!team) return jsonError("No team found – create a team first", 404);

  const body = await req.json().catch(() => ({}));
  const group: string = (body?.group ?? "").trim() || "Általános";

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const invite: Invite = {
    id: nanoid(24),
    teamId: team.id,
    coachUid: uid,
    method: "code",
    inviteCode: makeInviteCode(),
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await createInvite(invite);
  return Response.json({ invite }, { status: 201 });
}
