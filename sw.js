/* sw.js — Mastermind Academy service worker.
   Enables install ("Add to Home Screen") and offline-friendly caching of the
   core same-origin assets. Third-party content (the enrichment catalog's CDN
   media) is never cached; it just passes through. */
'use strict';
var CACHE = 'mm-cache-v1';
var CORE = [
  'index.html', 'dashboard.html', 'login.html',
  'assets/css/main.css', 'assets/css/practice.css',
  'assets/js/icons.js', 'assets/js/store.js', 'assets/js/layout.js', 'assets/js/problems.js',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(CORE.map(function (u) { return new Request(u, { cache: 'reload' }); })).catch(function () {}); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var sameOrigin = false;
  try { sameOrigin = new URL(req.url).origin === self.location.origin; } catch (_) {}
  if (!sameOrigin) return; // let cross-origin (CDN games/fonts) go straight to network

  // Cache-first for same-origin assets, with a network fallback that refreshes the cache.
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // offline: for page navigations, fall back to the cached home page
        if (req.mode === 'navigate') return caches.match('index.html');
        return undefined;
      });
      return hit || net;
    })
  );
});
