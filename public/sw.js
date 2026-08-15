/**
 * Service Worker：实现「添加到主屏幕」后的离线可用。
 * 策略：cache-first（缓存优先），离线时回退到缓存的 index.html。
 * 说明：
 *  - 使用相对路径（'./'）预缓存核心资源，使 SW 在子路径部署（如 GitHub Pages 项目页）也能正确解析。
 *  - 运行时对所有 GET 请求先查缓存；未命中则走网络，并把成功的同源/CORS 响应写入缓存。
 *  - 导航请求（HTML）若离线且缓存未命中，回退到缓存的 index.html，保证 App 壳可打开。
 */
const CACHE_NAME = 'what-to-eat-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        // 逐个预缓存：单条资源缺失（如某图标误删）只跳过该条，
        // 不再因 addAll 整体 reject 导致 SW 永不激活、离线静默失效。
        await Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('预缓存失败（已跳过）：', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // 仅缓存成功的同源或 CORS 响应，避免缓存错误页
          if (
            response &&
            response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          // 离线且缓存未命中：导航请求回退到缓存的页面壳
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return undefined;
        });
    })
  );
});
