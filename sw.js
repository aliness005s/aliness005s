const CACHE = 'adoceup-v16';
const APP_SHELL = [
  './', './index.html', './offline.html', './manifest.json?v=2', './css/styles.css',
  './js/state.js?v=3', './js/utils.js?v=10', './js/navigation.js?v=6',
  './js/profile.js?v=2', './js/ingredients.js?v=2', './js/products.js?v=4',
  './js/precificacao.js?v=10', './js/orcamentos.js?v=6',
  './js/fechamento.js?v=6', './js/backup.js?v=4', './js/app.js?v=6',
  './vendor/jspdf.umd.min.js', './vendor/html2canvas.min.js',
  './icons/192.png', './icons/512.png', './icons/512-maskable.png',
  './icons/adoceup-wordmark.png', './icons/favicon.png',
  './icons/apple-touch-icon.png', './icons/favicon.ico',
  './fonts/outfit-300.woff2', './fonts/outfit-400.woff2', './fonts/outfit-500.woff2',
  './fonts/outfit-600.woff2', './fonts/outfit-700.woff2', './fonts/outfit-800.woff2',
  './fonts/nunito-300.woff2', './fonts/nunito-400.woff2', './fonts/nunito-500.woff2',
  './fonts/nunito-600.woff2', './fonts/nunito-700.woff2', './fonts/nunito-800.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if(requestUrl.origin !== self.location.origin) return;
  if(requestUrl.pathname.endsWith('/sw.js')) return;

  if(event.request.mode === 'navigate'){
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html').then(response => response || caches.match('./offline.html'))));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if(response.ok){
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match('./offline.html'))));
});