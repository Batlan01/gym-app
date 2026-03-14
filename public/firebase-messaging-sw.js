// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Config lekérése az app-tól (az app küldi el SW init-kor)
let firebaseConfigLoaded = false;

self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG" && !firebaseConfigLoaded) {
    firebaseConfigLoaded = true;
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const notif = payload.notification ?? {};
      const url = payload.data?.url ?? "/workout";
      self.registration.showNotification(notif.title ?? "ARCX", {
        body: notif.body ?? "",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        data: { url },
        tag: "arcx-push",
      });
    });
  }

  // Meglévő SHOW_NOTIFICATION és SCHEDULE_NOTIFICATION kezelők is itt
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, url, tag } = event.data.payload;
    event.waitUntil(
      self.registration.showNotification(title, {
        body, icon: "/icons/icon-192x192.png", badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200], data: { url: url ?? "/workout" }, tag: tag ?? "arcx-notif",
      })
    );
  }

  if (event.data?.type === "SCHEDULE_NOTIFICATION") {
    const { delayMs, title, body, url, tag } = event.data.payload;
    if (!delayMs || delayMs <= 0) return;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body, icon: "/icons/icon-192x192.png", badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200], data: { url: url ?? "/workout" }, tag: tag ?? "arcx-scheduled",
      });
    }, delayMs);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/workout";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) {
          c.navigate(url); return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
