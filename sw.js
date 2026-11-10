// Permette di aprire l'app anche senza rete (i dati di famiglia li gestisce Firebase).
const VERSIONE = 'apparecchio-v7';
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
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSIONE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
