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
    else if ("booleanValue" in fv) out[k] = fv.booleanValue;
    else if ("nullValue" in fv) out[k] = null;
    else if ("arrayValue" in fv) {
      const vals = ((fv.arrayValue as Record<string,unknown>)?.values as unknown[]) ?? [];
      out[k] = vals.map((x: unknown) => {
        const xf = x as Record<string,unknown>;
        if ("mapValue" in xf) return fromFs((xf.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
        if ("stringValue" in xf) return xf.stringValue;
        if ("integerValue" in xf) return Number(xf.integerValue);
        return null;
      });
    } else if ("mapValue" in fv) out[k] = fromFs((fv.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
  }
  return out;
}

// GET /api/athlete/programs
// Visszaadja a coach által assignolt programokat az athlete-nek
export async function GET(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;

  // 1. premiumUsers/{uid} -> coachUid
  const premRes = await fetch(`${FS}/premiumUsers/${uid}`, { headers: ah(token) });
  if (!premRes.ok) return Response.json({ programs: [], coachPrograms: [] });
  const premData = await premRes.json();
  const premFields = premData?.fields ?? {};
  let coachUid = premFields?.coachUid?.stringValue as string | undefined;
  const teamId = premFields?.teamId?.stringValue as string | undefined;

  // Fallback: team member doc
  if (!coachUid && teamId) {
    const memRes = await fetch(`${FS}/teams/${teamId}/members/${uid}`, { headers: ah(token) });
    if (memRes.ok) {
      const memData = await memRes.json();
      coachUid = memData?.fields?.addedBy?.stringValue;
    }
  }

  // 2. Coach programjai ahol assignedTo tartalmazza uid-t
  let coachPrograms: Record<string,unknown>[] = [];
  if (coachUid) {
    const res = await fetch(`${FS}/coachPrograms/${coachUid}/programs`, { headers: ah(token) });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents ?? [];
      coachPrograms = docs
        .map((d: Record<string,unknown>) => ({
          id: (d.name as string).split("/").pop()!,
          ...fromFs((d.fields ?? {}) as Record<string,unknown>),
        }))
        .filter((p: Record<string,unknown>) => {
          const assigned = (p.assignedTo as string[]) ?? [];
          return assigned.includes(uid);
        });
    }
  }

  return Response.json({ coachPrograms, hasCoach: !!coachUid });
}