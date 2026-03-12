// app/api/coach/team/member-update/route.ts
// PATCH – tag csoport / státusz módosítása
// Body: { memberUid: string, group?: string, status?: TeamMemberStatus }
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError } from "@/app/api/coach/_authHelper";
import { getTeamByCoach, updateTeamMember } from "@/lib/coachFirestore";

export async function PATCH(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const team = await getTeamByCoach(uid);
  if (!team) return jsonError("No team found", 404);

  const body = await req.json().catch(() => ({}));
  const { memberUid, group, status } = body as {
    memberUid?: string;
    group?: string;
    status?: string;
  };

  if (!memberUid) return jsonError("memberUid required");

  const updates: Record<string, string> = {};
  if (group !== undefined) updates.group = group.trim();
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) return jsonError("No updates provided");

  await updateTeamMember(team.id, memberUid, updates);
  return Response.json({ ok: true });
}
