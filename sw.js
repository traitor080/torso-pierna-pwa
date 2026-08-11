// Service Worker — offline-first cache para la PWA
const CACHE = 'tp-pwa-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  // Forzar que el SW nuevo tome el control INMEDIATAMENTE sin esperar
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(err => console.warn('[SW] addAll falló (continúa):', err))
  );
});

self.addEventListener('activate', e => {
  // Activación: borrar TODAS las cachés que no sean la actual y reclamar clientes
  e.waitUntil(
    caches.keys()
      .then(keys => {
        console.log('[SW] Activando. Cachés encontradas:', keys);
        return Promise.all(keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Borrando caché vieja:', k);
          return caches.delete(k);
        }));
      })
      .then(() => self.clients.claim())
      .then(() => {
        // Avisar a todas las pestañas abiertas para que se recarguen
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UPDATED', version: 'v1.7' });
          });
        });
      })
  );
});

self.addEventListener('message', e => {
  // Si la página nos manda SKIP_WAITING, forzamos activación inmediata
  if (e.data && e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Network-first para TODO (no solo HTML). Garante que siempre ve la versión nueva.
  // Esto sacrifica un poco de velocidad offline pero garantiza actualizaciones inmediatas.
  e.respondWith(
    fetch(req).then(r => {
      // Solo cachear si la respuesta es válida
      if (r && r.status === 200){
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return r;
    }).catch(() => {
      // Offline: fallback al cache
      return caches.match(req).then(r => r || caches.match('./index.html'));
    })
  );
});
