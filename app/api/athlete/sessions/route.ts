import { verifyIdTokenFull, jsonError } from "@/app/api/coach/_authHelper";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function ah(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
function fromFs(fields: Record<string,unknown>): Record<string,unknown> {
  const out: Record<string,unknown> = {};
  for (const [k,v] of Object.entries(fields)) {
    const fv = v as Record<string,unknown>;
    if ("stringValue" in fv) out[k] = fv.stringValue;
    else if ("integerValue" in fv) out[k] = Number(fv.integerValue);
    else if ("doubleValue" in fv) out[k] = Number(fv.doubleValue);
    else if ("booleanValue" in fv) out[k] = fv.booleanValue;
    else if ("nullValue" in fv) out[k] = null;
    else if ("timestampValue" in fv) out[k] = fv.timestampValue;
    else if ("arrayValue" in fv) {
      const vals = ((fv.arrayValue as Record<string,unknown>)?.values as unknown[]) ?? [];
      out[k] = vals.map((x: unknown) => {
        const xf = x as Record<string,unknown>;
        if ("mapValue" in xf) return fromFs((xf.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
        if ("stringValue" in xf) return xf.stringValue;
        if ("integerValue" in xf) return Number(xf.integerValue);
        if ("doubleValue" in xf) return Number(xf.doubleValue);
        if ("booleanValue" in xf) return xf.booleanValue;
        if ("nullValue" in xf) return null;
        if ("timestampValue" in xf) return xf.timestampValue;
        return null;
      });
    } else if ("mapValue" in fv) out[k] = fromFs((fv.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
  }
  return out;
}

// GET /api/athlete/sessions?limit=20
export async function GET(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;

  const res = await fetch(`${FS}/users/${uid}/workouts`, { headers: ah(token) });
  if (!res.ok) return Response.json({ sessions: [] });
  const data = await res.json();
  const docs = data.documents ?? [];

  const sessions = docs
    .map((d: Record<string,unknown>) => ({
      id: (d.name as string).split("/").pop()!,
      ...fromFs((d.fields ?? {}) as Record<string,unknown>),
    }))
    .sort((a: Record<string,unknown>, b: Record<string,unknown>) => {
      const ta = a.startedAt ? new Date(String(a.startedAt)).getTime() : Number(b.completedAt ?? 0);
      const tb = b.startedAt ? new Date(String(b.startedAt)).getTime() : Number(b.completedAt ?? 0);
      return tb - ta;
    })
    .slice(0, 20);

  return Response.json({ sessions });
}