// ARCX Push Notification Service Worker extension
// Ez a fájl a next-pwa által generált sw.js mellé kerül,
// de mivel next-pwa saját sw-t generál, ezt a logikát
// a custom service workerbe integráljuk.

self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'ARCX', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Ideje edzeni! 💪',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/workout' },
    actions: [
      { action: 'open', title: '▶ Edzés indítása' },
      { action: 'dismiss', title: 'Később' }
    ],
    requireInteraction: false,
    tag: 'arcx-workout-reminder',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ARCX — Edzés ideje!', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const url = event.notification.data?.url || '/workout';
  
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
