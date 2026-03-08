// lib/notifications.ts
// ARCX Push Notification Manager
// Kezeli: permission kérés, local scheduled notifications (SW-alapú),
// streak break alert, napi emlékeztető

export type NotifSettings = {
  enabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "HH:MM" pl. "18:00"
  streakBreakEnabled: boolean;
  streakBreakAfterDays: number; // hány kihagyott nap után
  postWorkoutEnabled: boolean;
};

export const DEFAULT_NOTIF_SETTINGS: NotifSettings = {
  enabled: false,
  dailyReminderEnabled: true,
  dailyReminderTime: "18:00",
  streakBreakEnabled: true,
  streakBreakAfterDays: 2,
  postWorkoutEnabled: false,
};

export const LS_NOTIF_SETTINGS = "gym.notifSettings";
export const LS_NOTIF_LAST_SCHEDULED = "gym.notifLastScheduled";

// Permission lekérés
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

// Közvetlen local notification (SW-en keresztül, nem push server kell)
export async function showLocalNotification(
  title: string,
  body: string,
  url = "/workout"
): Promise<void> {
  if (!isNotificationsSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
      data: { url },
      tag: "arcx-workout-reminder",
    } as NotificationOptions);
  } catch (e) {
    // Fallback: natív Notification API
    try {
      new Notification(title, { body, icon: "/icons/icon-192x192.png" });
    } catch {}
  }
}

// Napi emlékeztető scheduling (setTimeout alapú, SW persistence nélkül)
// A valódi háttér push szerverhez VAPID kulcs kellene — ezt Settings-ből lehet beállítani
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleNextDailyReminder(settings: NotifSettings): void {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  if (!settings.enabled || !settings.dailyReminderEnabled) return;
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const [h, m] = settings.dailyReminderTime.split(":").map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1); // holnap

  const msUntil = next.getTime() - now.getTime();

  scheduledTimer = setTimeout(async () => {
    await showLocalNotification(
      "ARCX — Edzés ideje! 💪",
      "Ne hagyd ki a mai edzést. Már csak pár perc és elindulhatsz!",
      "/workout"
    );
    // Újraütemezés következő napra
    scheduleNextDailyReminder(settings);
  }, msUntil);
}

export function cancelDailyReminder(): void {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

// Streak break notification (azonnal ha feltétel teljesül)
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
    const lastKey = localStorage.getItem("gym.lastStreakNotif");
    const today = now.toISOString().slice(0, 10);
    if (lastKey === today) return; // Már küldtük ma

    localStorage.setItem("gym.lastStreakNotif", today);
    await showLocalNotification(
      "ARCX — Streak veszélyben! 🔥",
      `${daysDiff} napja nem edzettél. Gyere vissza, ne törd meg a sorozatot!`,
      "/workout"
    );
  }
}

// Post-workout motivációs értesítés (edzés befejezése után 30 perccel)
export function schedulePostWorkoutNotif(settings: NotifSettings): void {
  if (!settings.enabled || !settings.postWorkoutEnabled) return;
  if (typeof window === "undefined") return;

  setTimeout(async () => {
    await showLocalNotification(
      "ARCX — Szuper edzés! 🏆",
      "Jól dolgoztál ma. Pihenj, hidratálj, holnap visszajössz erősebben!",
      "/progress"
    );
  }, 30 * 60 * 1000); // 30 perc
}

// Calendar-aware notification: ha ma van edzés a naptárban, értesít előtte
export async function scheduleCalendarReminder(
  todaySessionCount: number,
  settings: NotifSettings,
  minutesBefore = 30
): Promise<void> {
  if (!settings.enabled || !settings.dailyReminderEnabled) return;
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (todaySessionCount === 0) return;

  // Az emlékeztetőt a beállított időpont - minutesBefore perccel küldjük
  const [h, m] = settings.dailyReminderTime.split(":").map(Number);
  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(h, m - minutesBefore, 0, 0);
  if (reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore) < now.getTime()) return; // már elmúlt

  const msUntil = reminderTime.getTime() - now.getTime();
  if (msUntil <= 0) return;

  setTimeout(async () => {
    await showLocalNotification(
      "ARCX — Edzés hamarosan! 🏋️",
      `${todaySessionCount} edzés vár ma. ${minutesBefore} perc és kezdheted!`,
      "/workout"
    );
  }, msUntil);
}
