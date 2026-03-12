// app/api/coach/team/members/route.ts
// GET  – tagok listája
// DELETE – tag eltávolítása (body: { memberUid })
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError } from "@/app/api/coach/_authHelper";
import { getTeamByCoach, getTeamMembers, removeTeamMember } from "@/lib/coachFirestore";

export async function GET(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const team = await getTeamByCoach(uid);
  if (!team) return jsonError("No team found", 404);

  const members = await getTeamMembers(team.id);
  return Response.json({ teamId: team.id, members });
}

export async function DELETE(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const team = await getTeamByCoach(uid);
  if (!team) return jsonError("No team found", 404);

  const body = await req.json().catch(() => ({}));
  const memberUid: string = body?.memberUid ?? "";
  if (!memberUid) return jsonError("memberUid required");

  await removeTeamMember(team.id, memberUid);
  return Response.json({ ok: true });
}
