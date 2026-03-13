// رفعنا رقم النسخة إلى v4 لكي نُجبر هواتف الناس على تنظيف الذاكرة القديمة
const CACHE_NAME = 'samarra-clinics-v4'; 
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. التثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
        console.log('تم تحديث ملفات النظام بنجاح');
        return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 2. التفعيل وحذف النسخ القديمة
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. السحر هنا: جلب البيانات الجديدة فوراً إن وجدت (الشبكة أولاً لملف البيانات)
self.addEventListener('fetch', event => {
  // إذا كان الطلب يخص ملف بيانات الأطباء (data.js)
  if (event.request.url.includes('data.js')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // جلب النسخة الجديدة من الإنترنت وتخزينها خفيةً
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // إذا لم يكن هناك إنترنت، اعرض آخر نسخة محفوظة في الهاتف
          return caches.match(event.request);
        })
    );
  } else {
    // لبقية الملفات (التصميم والواجهة والخرائط)، استخدم الكاش لسرعة فائقة
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
