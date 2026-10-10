const CACHE = 'fiszki-v4';
const CORE = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
// Po aktualizacji: kasuję stare kopie, a otwarte okna przeładowuję dopiero PO zakończeniu aktywacji.
// (Przeładowanie w trakcie aktywacji czeka na samą aktywację i strona się zawiesza.)
self.addEventListener('activate', e => {
  const work = (async () => {
    const old = (await caches.keys()).filter(k => k !== CACHE);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    return old.length > 0;
  })();
  e.waitUntil(work.then(() => {}));
  work.then(upgraded => {
    if (!upgraded) return;
    setTimeout(() => {
      self.clients.matchAll({ type: 'window' }).then(ws => ws.forEach(w => { w.navigate(w.url).catch(() => {}); }));
    }, 300);
  });
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy));
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
