// app/api/coach/team/member-update/route.ts
// PATCH – tag csoport / státusz módosítása (Firestore REST API)
// Body: { memberUid: string, group?: string, status?: string }
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError } from "@/app/api/coach/_authHelper";

const FS = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function strVal(v: string) { return { stringValue: v }; }
function getStr(fields: Record<string, { stringValue?: string }>, key: string): string {
  return fields?.[key]?.stringValue ?? "";
}

async function fsQuery(idToken: string, collectionId: string, filters: { field: string; value: string }[]) {
  const whereClause = filters.length === 1
    ? { fieldFilter: { field: { fieldPath: filters[0].field }, op: "EQUAL", value: { stringValue: filters[0].value } } }
    : { compositeFilter: { op: "AND", filters: filters.map(f => ({ fieldFilter: { field: { fieldPath: f.field }, op: "EQUAL", value: { stringValue: f.value } } })) } };
  const res = await fetch(`${FS}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], where: whereClause, limit: 1 } }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.document ?? null;
}

async function fsPatch(idToken: string, path: string, fields: Record<string, unknown>) {
  const fieldPaths = Object.keys(fields).join(",");
  const res = await fetch(`${FS}/${path}?updateMask.fieldPaths=${fieldPaths}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  return res.ok;
}

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const uid = await verifyIdToken(authHeader);
  if (!uid) return jsonError("Unauthorized", 401);
  const idToken = authHeader!.slice(7);

  const teamDoc = await fsQuery(idToken, "teams", [{ field: "coachUid", value: uid }]);
  if (!teamDoc) return jsonError("No team found", 404);

  const teamId = teamDoc.name?.split("/").pop() ?? getStr(teamDoc.fields, "id");
  if (!teamId) return jsonError("Team ID could not be resolved", 500);

  const body = await req.json().catch(() => ({}));
  const { memberUid, group, status } = body as { memberUid?: string; group?: string; status?: string };
  if (!memberUid) return jsonError("memberUid required");

  const updates: Record<string, unknown> = {};
  if (group !== undefined) updates.group = strVal(group.trim());
  if (status !== undefined) updates.status = strVal(status);

  if (Object.keys(updates).length === 0) return jsonError("No updates provided");

  const ok = await fsPatch(idToken, `teams/${teamId}/members/${memberUid}`, updates);
  if (!ok) return jsonError("Update failed", 500);

  return Response.json({ ok: true });
}
