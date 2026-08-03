self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'KITCHEN_NOTIFICATION') {
    return;
  }

  const { title, body, icon, badge, tag } = event.data;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/assets/logo.png',
    badge: badge || '/assets/logo.png',
    tag: tag || 'kitchen-notification',
    vibrate: [300, 100, 300],
    requireInteraction: false
  });
});
