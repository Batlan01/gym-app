// app/api/coach/schedule/route.ts
// GET  ?month=2026-03  → havi összes bejegyzés
// POST { date, assignments: [{memberUid,memberName,programId,programName,sessionId,sessionName}] }
// DELETE { date } → töröl egy napot

import { verifyIdTokenFull, jsonError } from "../_authHelper";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function ah(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
function toFs(val: unknown): unknown {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string")  return { stringValue: val };
  if (typeof val === "number")  return { integerValue: String(val) };
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val))       return { arrayValue: { values: val.map(toFs) } };
  if (typeof val === "object")  return { mapValue: { fields: Object.fromEntries(
    Object.entries(val as Record<string,unknown>).map(([k,v])=>[k,toFs(v)])
  )}};
  return { stringValue: String(val) };
}
function fromFs(fields: Record<string,unknown>): Record<string,unknown> {
  const out: Record<string,unknown> = {};
  for (const [k,v] of Object.entries(fields)) {
    const fv = v as Record<string,unknown>;
    if ("stringValue"  in fv) out[k] = fv.stringValue;
    else if ("integerValue" in fv) out[k] = Number(fv.integerValue);
    else if ("booleanValue" in fv) out[k] = fv.booleanValue;
    else if ("nullValue"    in fv) out[k] = null;
    else if ("arrayValue"   in fv) {
      const vals = ((fv.arrayValue as Record<string,unknown>)?.values as unknown[]) ?? [];
      out[k] = vals.map((x: unknown) => {
        const xf = x as Record<string,unknown>;
        if ("mapValue"    in xf) return fromFs((xf.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
        if ("stringValue" in xf) return xf.stringValue;
        if ("integerValue" in xf) return Number(xf.integerValue);
        return null;
      });
    } else if ("mapValue" in fv) out[k] = fromFs((fv.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
  }
  return out;
}

export async function GET(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;
  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // "2026-03"

  // Lista kollekció: schedules/{coachUid}/entries
  const res = await fetch(`${FS}/schedules/${uid}/entries`, { headers: ah(token) });
  if (!res.ok) return Response.json({ entries: [] });
  const data = await res.json();
  const docs = data.documents ?? [];

  const entries = docs
    .map((d: Record<string,unknown>) => {
      const date = (d.name as string).split("/").pop()!;
      return { date, ...fromFs((d.fields??{}) as Record<string,unknown>) };
    })
    .filter((e: Record<string,unknown>) => !month || (e.date as string).startsWith(month));

  return Response.json({ entries });
}

export async function POST(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;
  const body = await req.json();
  const { date, assignments } = body; // date: "2026-03-14"
  if (!date) return jsonError("date required");

  const fields = {
    date: toFs(date),
    assignments: toFs(assignments ?? []),
    updatedAt: toFs(Date.now()),
  };
  const res = await fetch(`${FS}/schedules/${uid}/entries/${date}`, {
    method: "PATCH", headers: ah(token), body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Schedule POST error:", res.status, err);
    return jsonError("Mentési hiba", 500);
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;
  const body = await req.json();
  const { date } = body;
  if (!date) return jsonError("date required");
  await fetch(`${FS}/schedules/${uid}/entries/${date}`, {
    method: "DELETE", headers: ah(token),
  });
  return Response.json({ ok: true });
}
