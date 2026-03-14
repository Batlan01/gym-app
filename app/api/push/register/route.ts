// app/api/push/register/route.ts
// POST { fcmToken } — FCM token mentése a userhez Firestore-ba
import { verifyIdTokenFull, jsonError } from "@/app/api/coach/_authHelper";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function ah(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function POST(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;
  const body = await req.json();
  const { fcmToken } = body;
  if (!fcmToken) return jsonError("fcmToken required");

  const res = await fetch(`${FS}/fcmTokens/${uid}`, {
    method: "PATCH",
    headers: ah(token),
    body: JSON.stringify({
      fields: {
        uid:       { stringValue: uid },
        fcmToken:  { stringValue: fcmToken },
        updatedAt: { integerValue: String(Date.now()) },
        platform:  { stringValue: "web" },
      },
    }),
  });
  if (!res.ok) return jsonError("Mentési hiba", 500);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;
  await fetch(`${FS}/fcmTokens/${uid}`, { method: "DELETE", headers: ah(token) });
  return Response.json({ ok: true });
}
