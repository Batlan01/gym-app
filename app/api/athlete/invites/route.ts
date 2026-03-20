import { verifyIdTokenFull, jsonError } from "@/app/api/coach/_authHelper";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function ah(t: string) { return { "Content-Type": "application/json", Authorization: `Bearer ${t}` }; }
function str(f: Record<string,unknown>, k: string) { return (f?.[k] as any)?.stringValue ?? ""; }

// GET /api/athlete/invites — pending meghívók + tagság
export async function GET(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;

  // 1. Pending invites (runQuery)
  const queryRes = await fetch(`${FS}:runQuery`, {
    method: "POST",
    headers: ah(token),
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: "invites" }],
      where: { compositeFilter: { op: "AND", filters: [
        { fieldFilter: { field: { fieldPath: "targetUid" }, op: "EQUAL", value: { stringValue: uid } } },
        { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "pending" } } },
      ]}},
      limit: 20,
    }}),
  });

  const queryData = queryRes.ok ? await queryRes.json() : [];
  const now = new Date().toISOString();
  const invites = (queryData as any[])
    .filter(d => d.document)
    .map(d => {
      const f = d.document.fields ?? {};
      return {
        id: (d.document.name as string).split("/").pop()!,
        teamId: str(f, "teamId"),
        coachUid: str(f, "coachUid"),
        teamName: str(f, "teamName") || "Névtelen csapat",
        coachName: str(f, "coachName") || "Ismeretlen edző",
        group: str(f, "group"),
        expiresAt: str(f, "expiresAt"),
        status: "pending",
      };
    })
    .filter(i => i.expiresAt > now);

  // 2. Tagság (premiumUsers doc)
  const premRes = await fetch(`${FS}/premiumUsers/${uid}`, { headers: ah(token) });
  let membership = null;
  if (premRes.ok) {
    const premData = await premRes.json();
    const f = premData?.fields ?? {};
    const role = str(f, "role");
    const teamId = str(f, "teamId");
    const coachUid = str(f, "coachUid");
    if (role === "athlete" && teamId) {
      // Ellenőrzés: member doc active-e
      const memRes = await fetch(`${FS}/teams/${teamId}/members/${uid}`, { headers: ah(token) });
      if (memRes.ok) {
        const memData = await memRes.json();
        const mf = memData?.fields ?? {};
        const status = str(mf, "status");
        if (status !== "removed") {
          // Team adatok
          const teamRes = await fetch(`${FS}/teams/${teamId}`, { headers: ah(token) });
          let teamName = "Névtelen csapat";
          let coachName = "Ismeretlen edző";
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            const tf = teamData?.fields ?? {};
            teamName = str(tf, "name") || teamName;
          }
          membership = {
            teamId,
            teamName,
            coachName,
            group: str(mf, "group"),
            joinedAt: str(mf, "joinedAt"),
          };
        }
      }
    }
  }

  return Response.json({ invites, membership });
}