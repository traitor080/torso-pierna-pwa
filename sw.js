// Service Worker — offline-first cache + handler de timer de descanso en background
const CACHE = 'tp-pwa-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// ── Estado del timer de descanso (persiste aunque la pestaña esté oculta) ──
// Mantenemos los datos aquí en el SW para que el tiempo siga contando
// incluso cuando el navegador suspende la pestaña.
let restStartedAt = null;   // ms timestamp
let restDuration = 0;       // segundos totales
let restPaused = false;
let restPausedRemaining = 0; // si está pausado, cuánto queda

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
            client.postMessage({ type: 'SW_UPDATED', version: 'v2.0' });
          });
        });
      })
  );
});

self.addEventListener('message', e => {
  const d = e.data || {};

  // Pedido de la página para saltarse el "waiting" del SW
  if (d.type === 'SKIP_WAITING'){
    self.skipWaiting();
    return;
  }

  // ── Timer de descanso: iniciar / pausar / cancelar / consultar ──
  if (d.type === 'START_REST_TIMER'){
    restStartedAt = d.startedAt || Date.now();
    restDuration = d.duration || 0;
    restPaused = false;
    restPausedRemaining = 0;
    console.log('[SW] Timer de descanso iniciado:', restDuration, 's');
    return;
  }
  if (d.type === 'PAUSE_REST_TIMER'){
    if (restStartedAt && !restPaused){
      restPausedRemaining = Math.max(0, restDuration - Math.floor((Date.now() - restStartedAt) / 1000));
      restPaused = true;
    }
    return;
  }
  if (d.type === 'RESUME_REST_TIMER'){
    if (restPaused && restPausedRemaining > 0){
      restStartedAt = Date.now();
      restDuration = restPausedRemaining;
      restPaused = false;
      restPausedRemaining = 0;
    }
    return;
  }
  if (d.type === 'CANCEL_REST_TIMER'){
    restStartedAt = null;
    restDuration = 0;
    restPaused = false;
    restPausedRemaining = 0;
    return;
  }
  if (d.type === 'ADD_REST_SECONDS'){
    if (restStartedAt){
      if (restPaused){
        restPausedRemaining = Math.max(0, restPausedRemaining + (d.seconds || 0));
      } else {
        // Reanclamos restStartedAt para que el "duration" actual quede en
        // restDuration + delta sin perder el tiempo ya transcurrido.
        const elapsed = Math.floor((Date.now() - restStartedAt) / 1000);
        const newDuration = Math.max(elapsed, restDuration + (d.seconds || 0));
        restDuration = newDuration;
      }
    }
    return;
  }
  if (d.type === 'GET_REST_TIMER'){
    let remaining = 0;
    if (restStartedAt){
      if (restPaused){
        remaining = restPausedRemaining;
      } else {
        remaining = Math.max(0, restDuration - Math.floor((Date.now() - restStartedAt) / 1000));
      }
    }
    const target = restPaused ? restPausedRemaining : restDuration;
    const reply = {
      type: 'REST_TIMER_TICK',
      remaining,
      target,
      paused: restPaused,
      active: !!restStartedAt
    };
    if (e.source && e.source.postMessage){
      e.source.postMessage(reply);
    } else {
      // Fallback: enviar a todos los clientes
      self.clients.matchAll({ type: 'window' }).then(cls => {
        cls.forEach(c => c.postMessage(reply));
      });
    }
    return;
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