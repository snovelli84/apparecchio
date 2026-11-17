// Permette di aprire l'app anche senza rete (i dati di famiglia li gestisce Firebase).
const VERSIONE = 'apparecchio-v11';
const FILE = ['./', 'index.html', 'config.js', 'firebase.js', 'manifest.webmanifest',
  'icone/icona-192.png', 'icone/icona-512.png', 'icone/apple-touch-icon.png', 'icone/favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSIONE).map(x => caches.delete(x)))));
  self.clients.claim();
});
// Prima la rete (così gli aggiornamenti arrivano subito), poi la copia salvata se si è offline.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // "no-cache": chiede sempre al server se il file è cambiato (risposta rapida se non lo è)
  e.respondWith(fetch(new Request(e.request.url, {cache: 'no-cache', credentials: 'same-origin'})).then(r => { const c = r.clone(); caches.open(VERSIONE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

// Notifiche push del kit di emergenza.
// Lo script invia messaggi FCM di soli dati: qui la notifica va SEMPRE mostrata,
// perché su iPhone un push senza notifica visibile fa perdere il permesso.
self.addEventListener('push', e => {
  let d = {};
  try {
    const j = e.data ? e.data.json() : {};
    d = (j && j.data) || j || {};
  } catch (_) {
    try { d = { body: e.data ? e.data.text() : '' }; } catch (__) { d = {}; }
  }
  const titolo = d.title || 'Kit di emergenza';
  e.waitUntil(self.registration.showNotification(titolo, {
    body: d.body || 'Ci sono novità sul kit di emergenza.',
    icon: 'icone/icona-192.png',
    badge: 'icone/favicon-32.png',
    tag: d.tag || 'kit-emergenza',
    renotify: true,
    data: { url: d.url || './#emergenza' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './#emergenza', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
        return c.focus().then(w => (w && 'navigate' in w ? w.navigate(url) : w)).catch(() => self.clients.openWindow(url));
      }
    }
    return self.clients.openWindow(url);
  }));
});
