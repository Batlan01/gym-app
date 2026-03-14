// lib/fcm.ts
import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { app } from "./firebase";

export const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY ?? "";

// SW-nek elküldi a Firebase configot (SW nem fér hozzá a Next.js env-ekhez)
async function initFCMServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;
    const sw = reg.active ?? reg.installing ?? reg.waiting;
    if (!sw) return;
    sw.postMessage({
      type: "FIREBASE_CONFIG",
      config: {
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      },
    });
  } catch (e) {
    console.warn("[FCM] SW init error:", e);
  }
}

// FCM token lekérése + SW init
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!VAPID_KEY) { console.warn("[FCM] VAPID key hiányzik — add hozzá NEXT_PUBLIC_FCM_VAPID_KEY-t"); return null; }
  try {
    await initFCMServiceWorker();
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch (e) {
    console.error("[FCM] getToken error:", e);
    return null;
  }
}

// Foreground üzenetek (app nyitva van)
export function onFCMMessage(callback: (payload: MessagePayload) => void) {
  if (typeof window === "undefined") return () => {};
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, callback);
  } catch { return () => {}; }
}
