const CACHE_NAME = "wedding-planner-v2";

// Resolve scope directory as base path (e.g. "/wedding/" or "/")
const basePath = new URL(self.registration.scope).pathname.replace(/\/?$/, "/");

const PRECACHE_ASSETS = [
  basePath,
  `${basePath}index.html`,
  `${basePath}favicon.ico`,
  `${basePath}favicon-32x32.png`,
  `${basePath}favicon-16x16.png`,
  `${basePath}apple-touch-icon.png`,
  `${basePath}icon-192.png`,
  `${basePath}icon-512.png`,
  `${basePath}logo-transparent.png`,
  `${basePath}manifest.webmanifest`
];

// Install: precache essential shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("PWA precache warning:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for PocketBase API, stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or browser extensions
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Lewatkan request internal dev server Vite (agar HMR tidak terganggu)
  if (
    url.pathname.includes("/@vite/") ||
    url.pathname.includes("/@react-refresh") ||
    url.pathname.includes("/@id/") ||
    url.searchParams.has("t")
  ) {
    return;
  }

  // Media & berkas PocketBase: Cache-first agar foto prewedding terbuka instan & hemat kuota
  if (url.pathname.startsWith("/api/files/") || url.pathname.startsWith("/wedding-api/files/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === "basic" || networkResponse.type === "cors")
            ) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // PocketBase dynamic JSON API: network first, no offline cache for sensitive dynamic data
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/wedding-api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: "offline", message: "Anda sedang offline." }), {
          status: 503,
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // Static assets and pages: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === "basic" || networkResponse.type === "cors")
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is navigation, return cached index.html or basePath
          if (request.mode === "navigate") {
            return caches.match(`${basePath}index.html`).then((res) => res || caches.match(basePath));
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
