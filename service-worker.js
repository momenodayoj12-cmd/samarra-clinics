const CACHE_NAME = 'samarra-clinics-v2'; // تحديث رقم النسخة لضمان سحب التعديلات الجديدة
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './data.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. التثبيت (Install) - تخزين ملفاتك في هاتف المريض
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('تم تخزين ملفات دليل سامراء بنجاح');
                return cache.addAll(urlsToCache);
            })
    );
    // إجبار التطبيق على التحديث فوراً دون انتظار
    self.skipWaiting();
});

// 2. جلب البيانات (Fetch) - تشغيل الموقع حتى لو كان الإنترنت مفصولاً
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// 3. التفعيل (Activate) - تنظيف هواتف المرضى من النسخة القديمة للتطبيق
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('تم حذف النسخة القديمة وتحديث التطبيق');
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});