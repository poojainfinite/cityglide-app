// Service Worker for Offline Caching & PWA Installability
const CACHE_NAME = 'city-glide-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png',
  '/icon-192.png'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
