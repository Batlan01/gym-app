import { verifyIdTokenFull, jsonError } from "@/app/api/coach/_authHelper";

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
  if (typeof val === "object")  return { mapValue: { fields: Object.fromEntries(Object.entries(val as Record<string,unknown>).map(([k,v]) => [k, toFs(v)])) } };
  return { stringValue: String(val) };
}

function uid(len = 20): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

// POST /api/athlete/workout — edzés mentése Firestore-ba
export async function POST(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid: userId, token } = auth;
  const body = await req.json();

  const sessionId = uid();
  const now = Date.now();

  const fields: Record<string, unknown> = {
    id:           toFs(sessionId),
    startedAt:    toFs(body.startedAt ?? new Date().toISOString()),
    finishedAt:   toFs(body.finishedAt ?? new Date().toISOString()),
    completedAt:  toFs(now),
    createdAt:    toFs(now),
    totalVolume:  toFs(body.totalVolume ?? 0),
    exercises:    toFs(body.exercises ?? []),
    title:        toFs(body.title ?? ""),
  };

  const res = await fetch(
    `${FS}/workouts/${userId}/sessions/${sessionId}`,
    { method: "PATCH", headers: ah(token), body: JSON.stringify({ fields }) }
  );

  if (!res.ok) {
    const err = await res.text();
    return jsonError(`Firestore error: ${err}`, 500);
  }

  return Response.json({ id: sessionId });
}