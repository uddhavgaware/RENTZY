const CACHE_NAME = 'rentzy-pwa-cache-v2';
const STATIC_ASSETS = [
  '/favicon.svg',
  '/manifest.json'
];

// Install Event — cache static assets (NOT index.html — that uses network-first)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Event — clean up ALL old caches (including v1 that caused stale white screens)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
// - Navigation requests (HTML pages): NETWORK-FIRST → prevents white screen from stale cache
// - Static assets (JS/CSS/images): Stale-while-revalidate → fast loads + background updates
// - API calls / cross-origin: pass-through (no caching)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests, API calls, and non-GET requests
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api') || event.request.method !== 'GET') {
    return;
  }

  // Navigation requests (HTML) → Network-first to always get fresh index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback — serve cached index.html
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Static assets → Stale-while-revalidate (instant load + background update)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notification Handlers
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "RentXY Notification",
        body: event.data.text()
      };
    }
  }

  const title = data.title || "RentXY Notification";
  const options = {
    body: data.body || "You have a new update.",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: {
      link: data.link || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const link = event.notification.data.link;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
