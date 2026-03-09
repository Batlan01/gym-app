// ARCX Custom Push Service Worker
// Kezeli: push események, notification click, háttér ütemezés
// Ez a fájl KIEGÉSZÍTI a next-pwa által generált sw.js-t

const ICON = "/icons/icon-192x192.png";
const APP_NAME = "ARCX";

// ─── Push esemény kezelő (szerver-oldali push esetén) ───────────────────────
self.addEventListener("push", (event) => {
  let data = { title: `${APP_NAME} — Értesítés`, body: "Nyisd meg az appot!", url: "/" };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: ICON,
      badge: ICON,
      vibrate: [200, 100, 200],
      data: { url: data.url ?? "/workout" },
      tag: "arcx-push",
    })
  );
});

// ─── Notification kattintás kezelő ──────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/workout";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Ha már van nyitott ablak, fókuszálj arra
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Ha nincs, nyiss új ablakot
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ─── Message fogadás (főoldaltól jön) ───────────────────────────────────────
self.addEventListener("message", (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  if (type === "SHOW_NOTIFICATION") {
    // Azonnali értesítés küldés (teszt gomb / post-workout)
    event.waitUntil(
      self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: ICON,
        badge: ICON,
        vibrate: [200, 100, 200],
        data: { url: payload.url ?? "/workout" },
        tag: payload.tag ?? "arcx-notif",
        requireInteraction: false,
      })
    );
  }

  if (type === "SCHEDULE_NOTIFICATION") {
    // Ütemezett értesítés: payload.delayMs ms múlva jelenik meg
    const { delayMs, title, body, url, tag } = payload;
    if (!delayMs || delayMs <= 0) return;

    // SW-ben setTimeout működik (SW életciklusa alatt)
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: ICON,
        badge: ICON,
        vibrate: [200, 100, 200],
        data: { url: url ?? "/workout" },
        tag: tag ?? "arcx-scheduled",
        requireInteraction: false,
      });
    }, delayMs);
  }
});

// ─── SW aktiválás ────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
