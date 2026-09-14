const CACHE_NAME = 'qaddha-v5';
const BASE = new URL('./', self.location.href).pathname;
const SHELL = [BASE, `${BASE}index.html`, `${BASE}manifest.webmanifest`, `${BASE}qaddha-icon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

async function putSafe(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch {
    // Cache pressure must never break the game.
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        await putSafe(`${BASE}index.html`, response);
        return response;
      } catch {
        return (await caches.match(`${BASE}index.html`)) || (await caches.match(BASE)) || Response.error();
      }
    })());
    return;
  }

  const url = new URL(request.url);
  const isVersionedAsset = /\.(?:js|css|woff2?|webp|png|jpe?g|svg)$/i.test(url.pathname)
    && (url.pathname.includes('/assets/') || /-[A-Za-z0-9_-]{6,}\./.test(url.pathname));

  if (isVersionedAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        await putSafe(request, response);
        return response;
      } catch {
        return Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      await putSafe(request, response);
      return response;
    } catch {
      return (await caches.match(request)) || Response.error();
    }
  })());
});
