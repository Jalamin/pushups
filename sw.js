const CACHE_NAME = 'reptrack-v9-cache';
const APP_SHELL = [
  './', './index.html', './style.css', './script.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icons/push-up.svg', './icons/pull-up.svg',
  './icons/diamond.svg', './icons/wide.svg', './icons/incline.svg', './icons/shoulders.svg',
  './icons/abs.svg', './icons/legs.svg', './icons/neck.svg', './icons/stretch.svg',
  './icons/cardio.svg', './icons/custom.svg'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)); return response;
  }).catch(() => caches.match('./index.html'))));
});
