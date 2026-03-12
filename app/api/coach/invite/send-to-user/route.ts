// app/api/coach/invite/send-to-user/route.ts
// POST – in-app meghívó küldése egy létező usernek (uid alapján)
// Ha nincs még csapat, automatikusan létrehozza
// Body: { targetUid, targetEmail, targetName?, group? }
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError, nanoid } from "@/app/api/coach/_authHelper";

const FS = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function strVal(v: string) { return { stringValue: v }; }

async function fsGet(idToken: string, path: string) {
  const res = await fetch(`${FS}/${path}`, {
    headers: { "Authorization": `Bearer ${idToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.fields ? data : null;
}

async function fsSet(idToken: string, path: string, fields: Record<string, unknown>) {
  const res = await fetch(`${FS}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  return res.ok;
}

async function fsQuery(idToken: string, collectionId: string, filters: { field: string; value: string }[]) {
  const whereClause = filters.length === 1
    ? { fieldFilter: { field: { fieldPath: filters[0].field }, op: "EQUAL", value: { stringValue: filters[0].value } } }
    : { compositeFilter: { op: "AND", filters: filters.map(f => ({ fieldFilter: { field: { fieldPath: f.field }, op: "EQUAL", value: { stringValue: f.value } } })) } };

  const res = await fetch(`${FS}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], where: whereClause, limit: 1 } }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.document ?? null;
}

async function getOrCreateTeam(idToken: string, coachUid: string): Promise<string> {
  // Keresés: van-e már team ehhez a coachhoz?
  const teamDoc = await fsQuery(idToken, "teams", [{ field: "coachUid", value: coachUid }]);
  if (teamDoc) {
    return teamDoc.fields?.id?.stringValue ?? "";
  }

  // Nincs team → létrehozás automatikusan
  const teamId = nanoid(20);
  const now = new Date().toISOString();
  await fsSet(idToken, `teams/${teamId}`, {
    id: strVal(teamId),
    name: strVal("Saját csapat"),
    coachUid: strVal(coachUid),
    plan: strVal("premium"),
    createdAt: strVal(now),
  });
  // PremiumUser doc is
  await fsSet(idToken, `premiumUsers/${coachUid}`, {
    uid: strVal(coachUid),
    role: strVal("coach"),
    plan: strVal("premium"),
    teamId: strVal(teamId),
    createdAt: strVal(now),
  });
  return teamId;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const uid = await verifyIdToken(authHeader);
  if (!uid) return jsonError("Unauthorized", 401);
  const idToken = authHeader!.slice(7);

  const body = await req.json().catch(() => ({}));
  const targetUid: string = (body?.targetUid ?? "").trim();
  const targetEmail: string = (body?.targetEmail ?? "").trim().toLowerCase();
  const targetName: string = (body?.targetName ?? "").trim();
  const group: string = (body?.group ?? "").trim();

  if (!targetUid || !targetEmail) return jsonError("targetUid and targetEmail required");
  if (targetUid === uid) return jsonError("Cannot invite yourself");

  // Team lekérése vagy automatikus létrehozása
  const teamId = await getOrCreateTeam(idToken, uid);
  if (!teamId) return jsonError("Nem sikerült a csapatot létrehozni", 500);

  // Már van pending invite ennek a usernek ebben a teamben?
  const existingInvite = await fsQuery(idToken, "invites", [
    { field: "targetUid", value: targetUid },
    { field: "teamId", value: teamId },
    { field: "status", value: "pending" },
  ]);
  if (existingInvite) return jsonError("Ennek a felhasználónak már van függő meghívója");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inviteId = nanoid(24);

  const fields: Record<string, unknown> = {
    id: strVal(inviteId),
    teamId: strVal(teamId),
    coachUid: strVal(uid),
    method: strVal("in-app"),
    email: strVal(targetEmail),
    targetUid: strVal(targetUid),
    status: strVal("pending"),
    createdAt: strVal(now.toISOString()),
    expiresAt: strVal(expiresAt.toISOString()),
  };
  if (group) fields.group = strVal(group);
  if (targetName) fields.targetName = strVal(targetName);

  const ok = await fsSet(idToken, `invites/${inviteId}`, fields);
  if (!ok) return jsonError("Failed to create invite", 500);

  return Response.json({ invite: { id: inviteId, teamId, targetUid, status: "pending" } }, { status: 201 });
}
