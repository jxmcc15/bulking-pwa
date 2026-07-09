// Bulk Day — service worker (cache-first, offline-capable).
//
// Why a service worker at all: it is the piece that makes a web page a
// "real" installable app. It sits between the page and the network and can
// answer requests from a local cache, so the app opens instantly and works
// with no signal (airplane mode on the subway).
//
// Two strategies, chosen by request type:
//
// - Navigations (opening the app) are STALE-WHILE-REVALIDATE: answer from
//   cache instantly — a gym launch must never wait on a weak signal — and
//   fetch a fresh copy in the background for the NEXT launch. So an edit to
//   index.html reaches the phone on the second online open, with no cache
//   version bump and nothing to remember.
//
// - Everything else (manifest, icon) is CACHE-FIRST: look in the cache,
//   touch the network only on a miss. Those files basically never change;
//   if one ever does, bump CACHE_NAME (v2 -> v3) and the activate step
//   below deletes every older "bulk-day-*" cache on the next online load.

const CACHE_NAME = "bulk-day-v2";

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

// FETCH: navigations are stale-while-revalidate; everything else cache-first.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Navigations may carry preview params (e.g. "./?day=tue"). Match with
  // ignoreSearch so the query string is dropped and the request still resolves
  // to the cached "./" app shell — otherwise an offline navigation with a query
  // misses the cache and the user gets the browser's network-error page.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        // Kick off a background refresh. Success re-caches the shell under
        // "./" (query stripped) so the next launch gets the new version;
        // failure (offline) falls back to whatever we already had.
        const fresh = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("./", copy));
          }
          return response;
        }).catch(() => cached);
        // Cached copy wins for THIS launch (instant, works offline);
        // the network copy is only awaited when there's nothing cached yet.
        return cached || fresh;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
