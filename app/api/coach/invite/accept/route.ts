// app/api/coach/invite/accept/route.ts
// POST – tag elfogadja a meghívót (Firestore REST API – no SDK)
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
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`[accept] fsGet FAILED ${path} → ${res.status}`, txt);
    return null;
  }
  const data = await res.json();
  return data?.fields ? data : null;
}

async function fsQuery(idToken: string, collectionId: string, filters: { field: string; value: string }[]) {
  const whereClause = filters.length === 1
    ? { fieldFilter: { field: { fieldPath: filters[0].field }, op: "EQUAL", value: { stringValue: filters[0].value } } }
    : {
        compositeFilter: {
          op: "AND",
          filters: filters.map(f => ({
            fieldFilter: { field: { fieldPath: f.field }, op: "EQUAL", value: { stringValue: f.value } },
          })),
        },
      };

  const res = await fetch(`${FS_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], where: whereClause, limit: 1 } }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`[accept] fsQuery FAILED ${collectionId} → ${res.status}`, txt);
    return null;
  }
  const data = await res.json();
  return data?.[0]?.document ?? null;
}

async function fsPatch(idToken: string, path: string, fields: Record<string, unknown>): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(`${FS_BASE}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  const body = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[accept] fsPatch FAILED ${path} → ${res.status}`, body);
  } else {
    console.log(`[accept] fsPatch OK ${path}`);
  }
  return { ok: res.ok, status: res.status, body };
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

  console.log(`[accept] uid=${uid} inviteId=${inviteId} inviteCode=${inviteCode} email=${email}`);

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

  if (!inviteDoc) {
    console.error("[accept] invite not found");
    return jsonError("Invite not found or already used", 404);
  }

  const f = inviteDoc.fields;
  const status = getStr(f, "status");
  const expiresAt = getStr(f, "expiresAt");
  const teamId = getStr(f, "teamId");
  const coachUid = getStr(f, "coachUid");
  const group = getStr(f, "group");
  const method = getStr(f, "method");
  const invEmail = getStr(f, "email");
  const docName = inviteDoc.name ?? "";
  const resolvedInviteId = docName.split("/").pop() ?? inviteId ?? "";

  console.log(`[accept] invite found: status=${status} teamId=${teamId} coachUid=${coachUid} method=${method} resolvedInviteId=${resolvedInviteId}`);

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

  if (!teamId) {
    console.error("[accept] teamId is empty on invite doc!");
    return jsonError("Invite has no teamId", 500);
  }

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

  const memberResult = await fsPatch(idToken, `teams/${teamId}/members/${uid}`, memberFields);
  console.log(`[accept] member write → ok=${memberResult.ok} status=${memberResult.status}`);

  // ── 3. Invite lezárása ────────────────────────────────────────────────────
  const invResult = await fsPatch(idToken, `invites/${resolvedInviteId}`, {
    status: strVal("accepted"),
    acceptedBy: strVal(uid),
    acceptedAt: strVal(now),
  });
  console.log(`[accept] invite close → ok=${invResult.ok} status=${invResult.status}`);

  // ── 4. PremiumUser (athlete) beállítása ───────────────────────────────────
  const premResult = await fsPatch(idToken, `premiumUsers/${uid}`, {
    uid: strVal(uid),
    role: strVal("athlete"),
    plan: strVal("premium"),
    teamId: strVal(teamId),
    createdAt: strVal(now),
  });
  console.log(`[accept] premiumUser write → ok=${premResult.ok} status=${premResult.status}`);

  // ── 5. Team adatok visszaadása ────────────────────────────────────────────
  const teamDoc = await fsGet(idToken, `teams/${teamId}`);
  const teamName = teamDoc ? getStr(teamDoc.fields, "name") : "";

  // Ha a member write sikertelen volt, jelezzük vissza
  if (!memberResult.ok) {
    return Response.json({ 
      ok: false, 
      error: "Member write failed", 
      memberStatus: memberResult.status,
      memberBody: memberResult.body,
      teamId,
    }, { status: 500 });
  }

  return Response.json({ ok: true, team: { id: teamId, name: teamName } });
}
