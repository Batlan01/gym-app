// app/api/push/send/route.ts
// POST — Coach küld push értesítést egy vagy több athletének
// Body: { targetUids: string[], title: string, body: string, url?: string }
// Használ: FCM HTTP v1 API (Google OAuth2 token kell)
import { verifyIdTokenFull, jsonError } from "@/app/api/coach/_authHelper";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

function ah(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// Google OAuth2 access token lekérése a Firebase API kulccsal
// A Firebase Admin SDK helyett a REST API-t használjuk
async function getGoogleAccessToken(): Promise<string | null> {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) return null;
  try {
    const sa = JSON.parse(serviceAccountKey);
    // JWT alapú OAuth2 token generálás
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }));
    // JWT aláírás — szükség van crypto-ra
    // Ezt a funkciót csak akkor használjuk ha van service account
    const { createSign } = await import("crypto");
    const sign = createSign("RSA-SHA256");
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(sa.private_key, "base64url");
    const jwt = `${header}.${payload}.${signature}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const data = await tokenRes.json();
    return data.access_token ?? null;
  } catch (e) {
    console.error("Google token error:", e);
    return null;
  }
}

export async function POST(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { token } = auth;
  const body = await req.json();
  const { targetUids, title, body: msgBody, url = "/workout" } = body;
  if (!targetUids?.length || !title) return jsonError("targetUids and title required");

  // FCM tokenek lekérése a targetUids-hoz
  const fcmTokens: string[] = [];
  for (const uid of targetUids) {
    const res = await fetch(`${FS}/fcmTokens/${uid}`, { headers: ah(token) });
    if (!res.ok) continue;
    const data = await res.json();
    const fcmToken = data?.fields?.fcmToken?.stringValue;
    if (fcmToken) fcmTokens.push(fcmToken);
  }

  if (fcmTokens.length === 0) {
    return Response.json({ ok: true, sent: 0, message: "Nincs regisztrált FCM token" });
  }

  // Google access token FCM HTTP v1 API-hoz
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    return Response.json({ ok: false, error: "FCM service account hiányzik" }, { status: 503 });
  }

  // Küldés minden tokenre
  let sent = 0;
  for (const fcmToken of fcmTokens) {
    try {
      const res = await fetch(FCM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body: msgBody },
            webpush: {
              notification: {
                title, body: msgBody,
                icon: "/icons/icon-192x192.png",
                badge: "/icons/icon-192x192.png",
                vibrate: [200, 100, 200],
                requireInteraction: false,
              },
              fcm_options: { link: url },
            },
            data: { url },
          },
        }),
      });
      if (res.ok) sent++;
      else { const e = await res.text(); console.error("FCM send error:", e); }
    } catch (e) { console.error("FCM send exception:", e); }
  }

  return Response.json({ ok: true, sent, total: fcmTokens.length });
}
