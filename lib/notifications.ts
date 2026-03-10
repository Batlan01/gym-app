// lib/notifications.ts — ARCX Push Notification Manager v2
// Megközelítés: SW-message alapú scheduling (böngésző bezárása előtt is működik
// amíg az SW fut), + azonnali teszt fix.

export type NotifSettings = {
  enabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "HH:MM"
  streakBreakEnabled: boolean;
  streakBreakAfterDays: number;
  postWorkoutEnabled: boolean;
  reminderDays: number[]; // 0=Mon..6=Sun
};

export const DEFAULT_NOTIF_SETTINGS: NotifSettings = {
  enabled: false,
  dailyReminderEnabled: true,
  dailyReminderTime: "18:00",
  streakBreakEnabled: true,
  streakBreakAfterDays: 2,
  postWorkoutEnabled: false,
  reminderDays: [0,1,2,3,4], // H-P alapból
};

export const LS_NOTIF_SETTINGS = "gym.notifSettings";
export const LS_NOTIF_LAST_SCHEDULED = "gym.notifLastScheduled";

// ─── Alap API wrapperek ──────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

export function isNotificationsSupported(): boolean {
  return typeof Notification !== "undefined" && "serviceWorker" in navigator;
}

// ─── Custom SW regisztráció / elérés ────────────────────────────────────────

async function getCustomSW(): Promise<ServiceWorker | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    // Előbb regisztráljuk a custom SW-t ha még nincs
    await navigator.serviceWorker.register("/sw-custom.js", { scope: "/" });
    const reg = await navigator.serviceWorker.ready;
    return reg.active ?? reg.installing ?? reg.waiting;
  } catch (e) {
    console.warn("[ARCX] sw-custom.js regisztráció sikertelen:", e);
    return null;
  }
}

async function sendToSW(message: object): Promise<boolean> {
  const sw = await getCustomSW();
  if (!sw) return false;
  try {
    sw.postMessage(message);
    return true;
  } catch (e) {
    console.warn("[ARCX] SW üzenet küldés sikertelen:", e);
    return false;
  }
}

// ─── Azonnali értesítés (teszt gomb / streak break / post-workout) ──────────

export async function showLocalNotification(
  title: string,
  body: string,
  url = "/workout",
  tag = "arcx-notif"
): Promise<void> {
  if (!isNotificationsSupported()) return;
  if (Notification.permission !== "granted") return;

  // 1. próbálkozás: SW message (legjobb megbízhatóság)
  const sent = await sendToSW({ type: "SHOW_NOTIFICATION", payload: { title, body, url, tag } });
  if (sent) return;

  // 2. próbálkozás: next-pwa SW-n keresztül
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ type: "SHOW_NOTIFICATION", payload: { title, body, url, tag } });
      return;
    }
    await reg.showNotification(title, {
      body, icon: "/icons/icon-192x192.png", badge: "/icons/icon-192x192.png",
      vibrate: [200, 100, 200], data: { url }, tag,
    } as NotificationOptions);
    return;
  } catch {}

  // 3. fallback: natív Notification API
  try {
    new Notification(title, { body, icon: "/icons/icon-192x192.png" });
  } catch (e) {
    console.warn("[ARCX] Notification fallback is sikertelen:", e);
  }
}


// ─── Napi emlékeztető ütemezés (SW-message alapú) ───────────────────────────
// A SW-ben fut a setTimeout, így az app bezárása után is tüzel (amíg az SW él).
// iOS PWA-n korlátozott, Android Chrome-on és desktopon megbízható.

export async function scheduleNextDailyReminder(settings: NotifSettings): Promise<void> {
  if (!settings.enabled || !settings.dailyReminderEnabled) return;
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const [h, m] = settings.dailyReminderTime.split(":").map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delayMs = next.getTime() - now.getTime();

  await sendToSW({
    type: "SCHEDULE_NOTIFICATION",
    payload: {
      delayMs,
      title: "ARCX — Edzés ideje! 💪",
      body: "Ne hagyd ki a mai edzést. Már csak pár perc és elindulhatsz!",
      url: "/workout",
      tag: "arcx-daily-reminder",
    },
  });
}

export function cancelDailyReminder(): void {
  // SW-oldalon a setTimeout-ot nem lehet távolról törölni; az új scheduling
  // felülírja az előzőt mert azonos tag-et kap → a régi notification nem jelenik meg
  // (a böngésző dedup-olja az azonos tag-ű notificationöket)
}

// ─── Streak break értesítés ──────────────────────────────────────────────────

export async function checkAndSendStreakBreakNotif(
  lastWorkoutDate: string | null,
  settings: NotifSettings
): Promise<void> {
  if (!settings.enabled || !settings.streakBreakEnabled) return;
  if (Notification.permission !== "granted") return;
  if (!lastWorkoutDate) return;

  const last = new Date(lastWorkoutDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - last.getTime()) / 86400000);

  if (daysDiff >= settings.streakBreakAfterDays) {
    const today = now.toISOString().slice(0, 10);
    try {
      const lastKey = localStorage.getItem("gym.lastStreakNotif");
      if (lastKey === today) return;
      localStorage.setItem("gym.lastStreakNotif", today);
    } catch {}

    await showLocalNotification(
      "ARCX — Streak veszélyben! 🔥",
      `${daysDiff} napja nem edzettél. Gyere vissza, ne törd meg a sorozatot!`,
      "/workout",
      "arcx-streak"
    );
  }
}

// ─── Post-workout motiváció (30 perc késleltetéssel) ────────────────────────

export async function schedulePostWorkoutNotif(settings: NotifSettings): Promise<void> {
  if (!settings.enabled || !settings.postWorkoutEnabled) return;
  if (typeof window === "undefined") return;

  await sendToSW({
    type: "SCHEDULE_NOTIFICATION",
    payload: {
      delayMs: 30 * 60 * 1000,
      title: "ARCX — Szuper edzés! 🏆",
      body: "Jól dolgoztál ma. Pihenj, hidratálj, holnap visszajössz erősebben!",
      url: "/progress",
      tag: "arcx-post-workout",
    },
  });
}

// ─── Naptár-alapú emlékeztető ────────────────────────────────────────────────

export async function scheduleCalendarReminder(
  todaySessionCount: number,
  settings: NotifSettings,
  minutesBefore = 30
): Promise<void> {
  if (!settings.enabled || !settings.dailyReminderEnabled) return;
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (todaySessionCount === 0) return;

  const [h, m] = settings.dailyReminderTime.split(":").map(Number);
  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(h, m - minutesBefore, 0, 0);

  const delayMs = reminderTime.getTime() - now.getTime();
  if (delayMs <= 0) return;

  await sendToSW({
    type: "SCHEDULE_NOTIFICATION",
    payload: {
      delayMs,
      title: "ARCX — Edzés hamarosan! 🏋️",
      body: `${todaySessionCount} edzés vár ma. ${minutesBefore} perc és kezdheted!`,
      url: "/workout",
      tag: "arcx-calendar-reminder",
    },
  });
}
