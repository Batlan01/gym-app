// app/api/coach/team/create/route.ts
// POST – Coach létrehozza a csapatát (csak egyszer)
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError, nanoid } from "@/app/api/coach/_authHelper";
import { getTeamByCoach, createTeam, setPremiumUser } from "@/lib/coachFirestore";
import type { Team, PremiumUser } from "@/lib/coachTypes";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const existing = await getTeamByCoach(uid);
  if (existing) return Response.json({ team: existing });

  const body = await req.json().catch(() => ({}));
  const name: string = (body?.name ?? "").trim() || "Saját csapat";

  const teamId = nanoid(20);
  const now = new Date().toISOString();

  const team: Team = { id: teamId, name, coachUid: uid, plan: "premium", createdAt: now };
  await createTeam(team);

  const premiumUser: PremiumUser = { uid, role: "coach", plan: "premium", teamId, createdAt: now };
  await setPremiumUser(premiumUser);

  return Response.json({ team }, { status: 201 });
}
