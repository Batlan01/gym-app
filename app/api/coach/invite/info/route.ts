// app/api/coach/invite/info/route.ts
// GET /api/coach/invite/info?invite=<id> vagy ?code=ARCX-XXXXXX
// Nyilvános endpoint – nem kell auth, csak a meghívó alapadatait adja vissza
import { NextRequest } from "next/server";
import { getInvite, getInviteByCode, getTeam } from "@/lib/coachFirestore";
import { jsonError } from "@/app/api/coach/_authHelper";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inviteId = searchParams.get("invite");
  const inviteCode = searchParams.get("code");

  if (!inviteId && !inviteCode) return jsonError("invite or code param required", 400);

  const invite = inviteId
    ? await getInvite(inviteId)
    : await getInviteByCode(inviteCode!);

  if (!invite) return jsonError("Invite not found", 404);

  if (invite.status !== "pending") return jsonError("Ez a meghívó már nem érvényes.", 410);

  if (new Date(invite.expiresAt) < new Date()) {
    return jsonError("A meghívó lejárt.", 410);
  }

  const team = await getTeam(invite.teamId);

  return Response.json({
    invite: {
      id: invite.id,
      inviteCode: invite.inviteCode,
      teamName: team?.name ?? "Ismeretlen csapat",
      coachName: team?.coachName ?? "Az edző",
      group: invite.group ?? null,
      expiresAt: invite.expiresAt,
    },
  });
}
