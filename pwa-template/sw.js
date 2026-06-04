const CACHE_NAME = 'email-transformer-v1';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(FILES_TO_CACHE.map(async (url) => {
      try {
        const resp = await fetch(url, {cache: 'no-store'});
        if (resp && resp.ok) {
          await cache.put(url, resp.clone());
        }
      } catch (e) {
        console.warn('Could not cache', url, e);
      }
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then((response) => {
      return response || fetch(evt.request);
    })
  );
});