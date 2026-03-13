// app/api/coach/team/members/route.ts
// GET  – tagok listája (Firestore REST API)
// DELETE – tag eltávolítása (body: { memberUid })
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError } from "@/app/api/coach/_authHelper";

const FS = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function strVal(v: string) { return { stringValue: v }; }

function getStr(fields: Record<string, { stringValue?: string; booleanValue?: boolean; integerValue?: string }>, key: string): string {
  return fields?.[key]?.stringValue ?? "";
}

async function fsGet(idToken: string, path: string) {
  const res = await fetch(`${FS}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.fields ? data : null;
}

async function fsQuery(idToken: string, collectionId: string, filters: { field: string; value: string }[], allDescendants = false) {
  const whereClause = filters.length === 1
    ? { fieldFilter: { field: { fieldPath: filters[0].field }, op: "EQUAL", value: { stringValue: filters[0].value } } }
    : { compositeFilter: { op: "AND", filters: filters.map(f => ({ fieldFilter: { field: { fieldPath: f.field }, op: "EQUAL", value: { stringValue: f.value } } })) } };

  const res = await fetch(`${FS}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId, allDescendants }], where: whereClause } }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.filter((r: { document?: unknown }) => r.document).map((r: { document: unknown }) => r.document);
}

async function fsListSubcollection(idToken: string, parentPath: string, collectionId: string) {
  const res = await fetch(`${FS}/${parentPath}/${collectionId}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data?.documents ?? [];
}

async function fsPatch(idToken: string, path: string, fields: Record<string, unknown>) {
  const res = await fetch(`${FS}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  return res.ok;
}

function docToMember(doc: { name: string; fields: Record<string, { stringValue?: string }> }) {
  const f = doc.fields ?? {};
  return {
    uid: getStr(f, "uid"),
    displayName: getStr(f, "displayName") || "Névtelen",
    email: getStr(f, "email"),
    status: getStr(f, "status") || "active",
    joinedAt: getStr(f, "joinedAt"),
    group: getStr(f, "group") || undefined,
    addedBy: getStr(f, "addedBy"),
    compliance: 0,
  };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const uid = await verifyIdToken(authHeader);
  if (!uid) return jsonError("Unauthorized", 401);
  const idToken = authHeader!.slice(7);

  // 1. Coach csapatának megkeresése
  const teamDocs = await fsQuery(idToken, "teams", [{ field: "coachUid", value: uid }]);
  if (!teamDocs.length) return jsonError("No team found", 404);

  const teamDoc = teamDocs[0] as { name: string; fields: Record<string, { stringValue?: string }> };
  const teamIdFromName = teamDoc.name?.split("/").pop() ?? "";
  const teamIdFromField = getStr(teamDoc.fields, "id");
  const teamId = teamIdFromName || teamIdFromField;

  if (!teamId) return jsonError("Team ID could not be resolved", 500);

  // 2. Tagok listázása a subcollection-ből
  const memberDocs = await fsListSubcollection(idToken, `teams/${teamId}`, "members");

  const members = memberDocs
    .map((d: { name: string; fields: Record<string, { stringValue?: string }> }) => docToMember(d))
    .filter((m: { status: string }) => m.status !== "removed");

  return Response.json({ teamId, members });
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const uid = await verifyIdToken(authHeader);
  if (!uid) return jsonError("Unauthorized", 401);
  const idToken = authHeader!.slice(7);

  const teamDocs = await fsQuery(idToken, "teams", [{ field: "coachUid", value: uid }]);
  if (!teamDocs.length) return jsonError("No team found", 404);

  const teamDoc = teamDocs[0] as { name: string; fields: Record<string, { stringValue?: string }> };
  const teamId = teamDoc.name?.split("/").pop() ?? getStr(teamDoc.fields, "id");
  if (!teamId) return jsonError("Team ID could not be resolved", 500);

  const body = await req.json().catch(() => ({}));
  const memberUid: string = body?.memberUid ?? "";
  if (!memberUid) return jsonError("memberUid required");

  await fsPatch(idToken, `teams/${teamId}/members/${memberUid}`, {
    status: strVal("removed"),
  });

  return Response.json({ ok: true });
}
