// Service Worker - نسخه ۴ با پشتیبانی کامل آفلاین از اسکنر و ساخت QR
const CACHE_NAME = 'artminland-stable-update-v18';
const ASSETS = [
  './',
  './index.html',
  './card.html',
  './manifest.json',
  './common.js',
  './archive-backup.js',
  './contact-import.js',
  './qrcode.min.js',
  './html5-qrcode.min.js',
  './admin.html',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // Existing clients activate the update only after explicit confirmation.
});

self.addEventListener('message', event => { if(event.data && event.data.type === 'ACTIVATE_UPDATE') self.skipWaiting(); });

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('artminland-') && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// استراتژی: اول از اینترنت، در صورت نبود اینترنت از حافظه کَش
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // اجازه عبور درخواست‌های خارجی مانند Firebase و نقشه‌ها
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
