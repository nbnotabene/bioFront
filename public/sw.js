const CACHE_NAME = 'biofront-v1';
const API_CACHE_NAME = 'biofront-api-v1';
const IMAGE_CACHE_NAME = 'biofront-images-v1';

// Static assets to pre-cache on SW install
const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/robots.txt',
  '/img/biologo.png',
  '/img/facebook.png',
  '/img/kultunaut.png',
  '/img/megafon.png'
];

// 1. Install Event: Cache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Could not pre-cache asset:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Cleanup stale caches
self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !allowedCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for skipWaiting command from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 3. Fetch Event Routing Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension / non-http requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. nbapi API calls -> Network-First (fallback to API cache)
  // Essential so movie listings and showtimes are always up-to-date online
  if (url.hostname.includes('nbapi.nbinfo.eu') || url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request, API_CACHE_NAME));
    return;
  }

  // B. Media & Images (posters, TMDB, local images) -> Cache-First
  if (
    request.destination === 'image' ||
    url.hostname.includes('tmdb.org') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|gif)$/i)
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME));
    return;
  }

  // C. Static CSS, JS, Google Fonts -> Stale-While-Revalidate
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // D. HTML Page Navigation -> Network-First with Fallback to Cached Root Shell
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_NAME));
    return;
  }

  // Default: Network-First
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// Strategy: Network-First
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    if (request.mode === 'navigate') {
      const appShell = await caches.match('/');
      if (appShell) return appShell;
    }
    throw error;
  }
}

// Strategy: Cache-First
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Resource unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Strategy: Stale-While-Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}
