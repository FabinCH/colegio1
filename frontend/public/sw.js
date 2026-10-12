

const CACHE_NAME = 'colegio-app-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/launchericon-48x48.png',
  '/icons/launchericon-72x72.png',
  '/icons/launchericon-96x96.png',
  '/icons/launchericon-144x144.png',
  '/icons/launchericon-192x192.png',
  '/icons/launchericon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando recursos estáticos');
      
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Sin conexión. Intenta más tarde.' }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request)
        .then((networkResponse) => {
          
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async (error) => {
          
          if (request.mode === 'navigate') {
            const cache = await caches.open(CACHE_NAME);
            const cachedIndex = await cache.match('/index.html');
            if (cachedIndex) return cachedIndex;
          }
          throw error;
        });
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Notificación', body: event.data?.text() || '' };
  }

  const iconos = {
    alerta_asistencia: '/icons/launchericon-192x192.png',
    alerta_prediccion: '/icons/launchericon-192x192.png',
    alerta_evaluacion: '/icons/launchericon-192x192.png',
    nuevo_cuaderno:    '/icons/launchericon-192x192.png',
    sistema:           '/icons/launchericon-192x192.png',
  };

  const colores = {
    critica: '#ef4444',
    alta:    '#f97316',
    media:   '#3b82f6',
    baja:    '#22c55e',
  };

  const tipo      = data.data?.tipo || 'sistema';
  const prioridad = data.data?.prioridad || 'media';
  const urlDestino = data.data?.url || '/dashboard';

  const options = {
    body:    data.body  || 'Tienes una nueva notificación',
    icon:    data.icon  || iconos[tipo] || '/icons/launchericon-192x192.png',
    badge:   data.badge || '/icons/launchericon-96x96.png',
    vibrate: prioridad === 'critica' ? [300, 100, 300] : [200, 100, 200],
    tag:     data.tag   || tipo,
    renotify: true,
    requireInteraction: prioridad === 'critica' || prioridad === 'alta',
    data: {
      tipo,
      url:      urlDestino,
      prioridad,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'ver',     title: '👁️ Ver detalles' },
      { action: 'ignorar', title: '✕ Ignorar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Cuaderno Pedagógico', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'ignorar') return;

  const urlDestino = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NAVIGATE',
            url:  urlDestino,
          });
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlDestino);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Suscripción push cambió, re-suscribiendo...');
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
      });
    })
  );
});
