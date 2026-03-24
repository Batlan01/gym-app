import { verifyIdTokenFull, jsonError } from "@/app/api/coach/_authHelper";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// GET /api/athlete/debug — raw Firestore response for debugging
export async function GET(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;

  const url = `${FS}/users/${uid}/workouts`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });

  const status = res.status;
  const rawText = await res.text();
  let rawJson: any = null;
  try { rawJson = JSON.parse(rawText); } catch {}

  return Response.json({
    debug: true,
    uid,
    firestoreUrl: url,
    firestoreStatus: status,
    documentCount: rawJson?.documents?.length ?? 0,
    firstDocName: rawJson?.documents?.[0]?.name ?? null,
    firstDocFieldKeys: rawJson?.documents?.[0]?.fields ? Object.keys(rawJson.documents[0].fields) : [],
    rawFirst2000: rawText.slice(0, 2000),
  });
}
