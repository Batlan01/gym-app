// app/api/coach/programs/route.ts
import { verifyIdToken, jsonError, nanoid } from "../_authHelper";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function fsList(path: string) {
  const res = await fetch(`${FS}/${path}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.documents ?? [];
}
async function fsGet(path: string) {
  const res = await fetch(`${FS}/${path}`);
  if (!res.ok) return null;
  return res.json();
}
async function fsSet(path: string, fields: Record<string, unknown>) {
  return fetch(`${FS}/${path}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
}
async function fsDelete(path: string) {
  return fetch(`${FS}/${path}`, { method: "DELETE" });
}

function toFs(val: unknown): unknown {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string")  return { stringValue: val };
  if (typeof val === "number")  return { integerValue: String(val) };
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val))       return { arrayValue: { values: val.map(toFs) } };
  if (typeof val === "object")  return { mapValue: { fields: Object.fromEntries(Object.entries(val as Record<string,unknown>).map(([k,v]) => [k, toFs(v)])) } };
  return { stringValue: String(val) };
}

function fromFs(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    const fv = v as Record<string, unknown>;
    if ("stringValue"  in fv) out[k] = fv.stringValue;
    else if ("integerValue" in fv) out[k] = Number(fv.integerValue);
    else if ("booleanValue" in fv) out[k] = fv.booleanValue;
    else if ("nullValue" in fv) out[k] = null;
    else if ("arrayValue" in fv) {
      const vals = ((fv.arrayValue as Record<string,unknown>)?.values as unknown[]) ?? [];
      out[k] = vals.map((x: unknown) => {
        const xf = x as Record<string, unknown>;
        if ("mapValue" in xf) return fromFs((xf.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
        if ("stringValue" in xf) return xf.stringValue;
        if ("integerValue" in xf) return Number(xf.integerValue);
        if ("booleanValue" in xf) return xf.booleanValue;
        return null;
      });
    } else if ("mapValue" in fv) out[k] = fromFs((fv.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
  }
  return out;
}

export async function GET(req: Request) {
  const uid = await verifyIdToken(req.headers.get("Authorization"));
  if (!uid) return jsonError("Unauthorized", 401);
  const docs = await fsList(`coachPrograms/${uid}/programs`);
  const programs = docs.map((d: Record<string, unknown>) => ({
    id: (d.name as string).split("/").pop(),
    ...fromFs((d.fields ?? {}) as Record<string, unknown>),
  }));
  return Response.json({ programs });
}

export async function POST(req: Request) {
  const uid = await verifyIdToken(req.headers.get("Authorization"));
  if (!uid) return jsonError("Unauthorized", 401);
  const body = await req.json();
  const programId = nanoid();
  const now = Date.now();
  const fields: Record<string, unknown> = {
    id: toFs(programId), coachUid: toFs(uid),
    name: toFs(body.name ?? "Névtelen program"),
    description: toFs(body.description ?? ""),
    sport: toFs(body.sport ?? "gym"),
    level: toFs(body.level ?? "beginner"),
    sessions: toFs(body.sessions ?? []),
    assignedTo: toFs(body.assignedTo ?? []),
    createdAt: toFs(now), updatedAt: toFs(now),
  };
  const res = await fsSet(`coachPrograms/${uid}/programs/${programId}`, fields);
  if (!res.ok) return jsonError("Mentési hiba", 500);
  return Response.json({ id: programId });
}

export async function PATCH(req: Request) {
  const uid = await verifyIdToken(req.headers.get("Authorization"));
  if (!uid) return jsonError("Unauthorized", 401);
  const body = await req.json();
  const { programId, ...rest } = body;
  if (!programId) return jsonError("programId required");
  const existing = await fsGet(`coachPrograms/${uid}/programs/${programId}`);
  if (!existing) return jsonError("Not found", 404);
  const updatedFields: Record<string, unknown> = { ...(existing.fields ?? {}) };
  for (const [k, v] of Object.entries(rest)) updatedFields[k] = toFs(v);
  updatedFields.updatedAt = toFs(Date.now());
  const res = await fsSet(`coachPrograms/${uid}/programs/${programId}`, updatedFields);
  if (!res.ok) return jsonError("Mentési hiba", 500);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const uid = await verifyIdToken(req.headers.get("Authorization"));
  if (!uid) return jsonError("Unauthorized", 401);
  const url = new URL(req.url);
  const programId = url.searchParams.get("programId");
  if (!programId) return jsonError("programId required");
  await fsDelete(`coachPrograms/${uid}/programs/${programId}`);
  return Response.json({ ok: true });
}
