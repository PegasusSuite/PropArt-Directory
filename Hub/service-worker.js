// Service Worker for PropArt™ Creator Space PWA — never reject inside respondWith()
const CACHE_NAME = 'craftinardor-cache-v7';

const urlsToCache = ['./script.js', './manifest.json', './favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(() => Promise.resolve())
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    handleFetch(req).catch(() => {
      return new Response('', {
        status: 503,
        statusText: 'Unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })
  );
});

async function handleFetch(req) {
  const url = new URL(req.url);

  // Unsupported origins (e.g. file:// when an old worker still intercepts)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    try {
      const r = await fetch(req);
      return r instanceof Response ? r : fallback503();
    } catch {
      return fallback503();
    }
  }

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    try {
      const response = await fetch(req);
      if (response && response.ok && response.type !== 'opaque') {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
      }
      if (response instanceof Response) return response;
    } catch {
      /* fall through to cache */
    }
    const cached =
      (await caches.match(req).catch(() => undefined)) ||
      (await caches.match('./index.html').catch(() => undefined));
    if (cached instanceof Response) return cached;
    return new Response('<!DOCTYPE html><html><body>Offline</body></html>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  let cached;
  try {
    cached = await caches.match(req);
  } catch {
    cached = undefined;
  }

  try {
    const response = await fetch(req);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
    }
    if (response instanceof Response) return response;
  } catch {
    /* use cache */
  }

  if (cached instanceof Response) return cached;
  return new Response('', { status: 404, statusText: 'Not Found' });
}

function fallback503() {
  return new Response('Service worker: use http://localhost or https (file:// is not supported).', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});
