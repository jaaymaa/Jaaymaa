// Jaay minimal service worker
const CACHE_NAME = "jaay-cache-v3";
const IMAGE_CACHE_NAME = "jaay-images-v1";
const MAX_CACHED_IMAGES = 120;
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  OFFLINE_URL,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Precache skipped:", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isAppImage =
    event.request.method === "GET" &&
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/api/images/") || url.pathname.startsWith("/img/"));

  if (isAppImage) {
    event.respondWith(cacheImage(event.request));
    return;
  }

  // Never cache mutation requests, API, orders, or private workspace routes
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/espace") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.includes("/commande/") ||
    url.pathname.includes("/checkout")
  ) {
    return;
  }

  // Network-first with offline fallback for navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match(OFFLINE_URL);
      })
    );
    return;
  }

});

async function cacheImage(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  const response = await fetch(request);
  const contentType = response.headers.get("content-type") || "";
  const cacheControl = response.headers.get("cache-control") || "";
  if (response.ok && contentType.startsWith("image/") && /\bimmutable\b/i.test(cacheControl)) {
    try {
      await cache.put(request, response.clone());
      const cachedRequests = await cache.keys();
      const overflow = cachedRequests.length - MAX_CACHED_IMAGES;
      if (overflow > 0) {
        await Promise.all(cachedRequests.slice(0, overflow).map((cachedRequest) => cache.delete(cachedRequest)));
      }
    } catch {
      // Keep the network response usable if the device cannot store another image.
    }
  }

  return response;
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "Une nouvelle commande vient d’arriver." };
  }

  const title = payload.title || "Nouvelle commande";
  const options = {
    body: payload.body || "Une nouvelle commande vient d’arriver sur votre boutique.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "jaay-new-order",
    renotify: Boolean(payload.tag),
    data: { url: payload.url || "/espace/commandes" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let target;
  try {
    target = new URL(event.notification.data?.url || "/espace/commandes", self.location.origin);
  } catch {
    target = new URL("/espace/commandes", self.location.origin);
  }
  if (target.origin !== self.location.origin) {
    target = new URL("/espace/commandes", self.location.origin);
  }

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const sameOriginWindows = windows.filter((client) => new URL(client.url).origin === self.location.origin);
    const appWindow = sameOriginWindows.find((client) => new URL(client.url).pathname.startsWith("/espace"))
      || sameOriginWindows[0];

    if (appWindow) {
      try {
        const navigatedWindow = await appWindow.navigate(target.href);
        return (navigatedWindow || appWindow).focus();
      } catch {
        // If iOS cannot navigate the existing PWA window, open the order in a new one.
      }
    }

    return self.clients.openWindow(target.href);
  })());
});
