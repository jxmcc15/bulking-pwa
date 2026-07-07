// Bulk Day — service worker (cache-first, offline-capable).
//
// Why a service worker at all: it is the piece that makes a web page a
// "real" installable app. It sits between the page and the network and can
// answer requests from a local cache, so the app opens instantly and works
// with no signal (airplane mode on the subway).
//
// Cache-first strategy: for every request we look in the cache first and
// only touch the network if the file isn't cached. That's the right call
// here because the whole app is a handful of static files that rarely change.
//
// Updating the app: when you edit any app file, bump CACHE_NAME (v1 -> v2).
// On the next online load the new worker installs the fresh files and the
// activate step below deletes every older "bulk-day-*" cache.

const CACHE_NAME = "bulk-day-v1";

// The "app shell" — the files needed to render the app offline.
// All paths are relative ("./") because GitHub Pages serves this project
// from https://<user>.github.io/bulking-pwa/, NOT the domain root. A leading
// "/" would point at the domain root and 404.
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png"
];

// INSTALL: pre-cache the app shell so the very next load can be offline.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Activate this new worker immediately instead of waiting for old tabs.
  self.skipWaiting();
});

// ACTIVATE: delete any older Bulk Day caches, then take control of open pages.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith("bulk-day-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH: serve from cache first; fall back to the network if it's not cached.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Navigations may carry preview params (e.g. "./?day=tue"). Match with
  // ignoreSearch so the query string is dropped and the request still resolves
  // to the cached "./" app shell — otherwise an offline navigation with a query
  // misses the cache and the user gets the browser's network-error page.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetch(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
