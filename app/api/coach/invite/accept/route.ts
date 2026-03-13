// app/api/coach/invite/accept/route.ts
// POST – tag elfogadja a meghívót (Firestore REST API)
// Body: { inviteCode?, inviteId?, displayName?, email? }
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError } from "@/app/api/coach/_authHelper";

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function strVal(v: string) { return { stringValue: v }; }
function getStr(fields: Record<string, { stringValue?: string }>, key: string): string {
  return fields?.[key]?.stringValue ?? "";
}

async function fsGet(idToken: string, path: string) {
  const res = await fetch(`${FS_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.fields ? data : null;
}

async function fsQuery(idToken: string, collectionId: string, filters: { field: string; value: string }[]) {
  const whereClause = filters.length === 1
    ? { fieldFilter: { field: { fieldPath: filters[0].field }, op: "EQUAL", value: { stringValue: filters[0].value } } }
    : { compositeFilter: { op: "AND", filters: filters.map(f => ({ fieldFilter: { field: { fieldPath: f.field }, op: "EQUAL", value: { stringValue: f.value } } })) } };
  const res = await fetch(`${FS_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], where: whereClause, limit: 1 } }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.document ?? null;
}

async function fsPatch(idToken: string, path: string, fields: Record<string, unknown>) {
  const res = await fetch(`${FS_BASE}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const uid = await verifyIdToken(authHeader);
  if (!uid) return jsonError("Unauthorized", 401);
  const idToken = authHeader!.slice(7);

  const body = await req.json().catch(() => ({}));
  const { inviteCode, inviteId, displayName, email } = body as {
    inviteCode?: string; inviteId?: string;
    displayName?: string; email?: string;
  };

  // ── 1. Invite keresése ────────────────────────────────────────────────────
  let inviteDoc: { name: string; fields: Record<string, { stringValue?: string }> } | null = null;

  if (inviteId) {
    inviteDoc = await fsGet(idToken, `invites/${inviteId}`);
  } else if (inviteCode) {
    inviteDoc = await fsQuery(idToken, "invites", [
      { field: "inviteCode", value: inviteCode.trim().toUpperCase() },
      { field: "status", value: "pending" },
    ]);
  } else {
    return jsonError("inviteId or inviteCode required");
  }

  if (!inviteDoc) return jsonError("Invite not found or already used", 404);

  const f = inviteDoc.fields;
  const status = getStr(f, "status");
  const expiresAt = getStr(f, "expiresAt");
  const teamId = getStr(f, "teamId");
  const coachUid = getStr(f, "coachUid");
  const group = getStr(f, "group");
  const method = getStr(f, "method");
  const invEmail = getStr(f, "email");
  const resolvedInviteId = (inviteDoc.name ?? "").split("/").pop() ?? inviteId ?? "";

  if (status !== "pending") return jsonError("Invite is no longer valid");
  if (new Date(expiresAt) < new Date()) {
    await fsPatch(idToken, `invites/${resolvedInviteId}`, { status: strVal("expired") });
    return jsonError("Invite has expired");
  }
  if (method === "email" && invEmail && email) {
    if (invEmail !== email.trim().toLowerCase()) {
      return jsonError("This invite was sent to a different email address");
    }
  }
  if (!teamId) return jsonError("Invite has no teamId", 500);

  const now = new Date().toISOString();

  // ── 2. Tag hozzáadása a csapathoz ────────────────────────────────────────
  const memberFields: Record<string, unknown> = {
    uid: strVal(uid),
    displayName: strVal((displayName ?? "").trim() || "Névtelen"),
    email: strVal(email ?? invEmail ?? ""),
    teamId: strVal(teamId),
    status: strVal("active"),
    joinedAt: strVal(now),
    addedBy: strVal(coachUid),
  };
  if (group) memberFields.group = strVal(group);

  await fsPatch(idToken, `teams/${teamId}/members/${uid}`, memberFields);

  // ── 3. Invite lezárása ────────────────────────────────────────────────────
  await fsPatch(idToken, `invites/${resolvedInviteId}`, {
    status: strVal("accepted"),
    acceptedBy: strVal(uid),
    acceptedAt: strVal(now),
  });

  // ── 4. PremiumUser (athlete) beállítása ───────────────────────────────────
  await fsPatch(idToken, `premiumUsers/${uid}`, {
    uid: strVal(uid),
    role: strVal("athlete"),
    plan: strVal("premium"),
    teamId: strVal(teamId),
    createdAt: strVal(now),
  });

  // ── 5. Team adatok visszaadása ────────────────────────────────────────────
  const teamDoc = await fsGet(idToken, `teams/${teamId}`);
  const teamName = teamDoc ? getStr(teamDoc.fields, "name") : "";

  return Response.json({ ok: true, team: { id: teamId, name: teamName } });
}
