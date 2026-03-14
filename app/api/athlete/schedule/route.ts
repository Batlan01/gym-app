// app/api/athlete/schedule/route.ts
// GET ?month=2026-03 → az athlete coachától kapott schedule bejegyzések
// Az athlete premiumUsers/{uid}.coachUid-jából kiderül ki a coachja

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
    if ("stringValue"   in fv) out[k] = fv.stringValue;
    else if ("integerValue"  in fv) out[k] = Number(fv.integerValue);
    else if ("booleanValue"  in fv) out[k] = fv.booleanValue;
    else if ("nullValue"     in fv) out[k] = null;
    else if ("arrayValue"    in fv) {
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
  const month = url.searchParams.get("month");

  // 1. premiumUsers/{uid} → coachUid lekérése
  const premRes = await fetch(`${FS}/premiumUsers/${uid}`, { headers: ah(token) });
  if (!premRes.ok) return Response.json({ entries: [] });
  const premData = await premRes.json();
  const premFields = premData?.fields ?? {};
  let coachUid = premFields?.coachUid?.stringValue as string | undefined;
  const teamId  = premFields?.teamId?.stringValue  as string | undefined;

  // Fallback: ha nincs coachUid, keresünk a team member dokumentumban
  if (!coachUid && teamId) {
    const memRes = await fetch(`${FS}/teams/${teamId}/members/${uid}`, { headers: ah(token) });
    if (memRes.ok) {
      const memData = await memRes.json();
      const addedBy = memData?.fields?.addedBy?.stringValue as string | undefined;
      if (addedBy) {
        coachUid = addedBy;
        // Visszamentjük a premiumUsers-ba hogy legközelebb ne kelljen keresgélni
        await fetch(`${FS}/premiumUsers/${uid}`, {
          method: "PATCH",
          headers: ah(token),
          body: JSON.stringify({ fields: { ...premFields, coachUid: { stringValue: coachUid } } }),
        });
      }
    }
  }

  if (!coachUid) return Response.json({ entries: [] });

  // 2. schedules/{coachUid}/entries lekérése
  const schedRes = await fetch(`${FS}/schedules/${coachUid}/entries`, { headers: ah(token) });
  if (!schedRes.ok) return Response.json({ entries: [] });
  const schedData = await schedRes.json();
  const docs = schedData.documents ?? [];

  // 3. Csak azokat adjuk vissza ahol ez az athlete szerepel
  const entries = docs
    .map((d: Record<string,unknown>) => {
      const date = (d.name as string).split("/").pop()!;
      return { date, ...fromFs((d.fields??{}) as Record<string,unknown>) };
    })
    .filter((e: Record<string,unknown>) => !month || (e.date as string).startsWith(month))
    .map((e: Record<string,unknown>) => {
      const assignments = (e.assignments as Record<string,unknown>[]) ?? [];
      const mine = assignments.filter(a => a.memberUid === uid);
      return mine.length > 0 ? { date: e.date, assignments: mine } : null;
    })
    .filter(Boolean);

  return Response.json({ entries });
}
