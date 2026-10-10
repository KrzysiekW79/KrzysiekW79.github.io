// Wyłącznik: ta wersja usuwa zapisane kopie i sama się wyrejestrowuje.
// Nie ma obsługi 'fetch', więc wszystko idzie prosto z internetu.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
  })());
  setTimeout(() => {
    self.clients.matchAll({ type: 'window' }).then(ws => ws.forEach(w => { w.navigate(w.url).catch(() => {}); }));
  }, 500);
});
