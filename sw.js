const CACHE_NAME = 'sapporo-itinerary-v5'; // 버전을 올려서 폰이 새 코드를 인식하게 만듭니다.

// 1. 꼭 필요한 핵심 파일만 먼저 확실하게 저장! (회원님 파일 + CDN 합침)
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.ico',
  // 🔥 오프라인 필수 도구 무조건 캐싱!
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // 새 버전이 발견되면 즉시 설치
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('핵심 파일 캐싱 완료!');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  // 이전 버전의 찌꺼기 데이터 삭제
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 폰에 저장된 게 있으면 바로 보여줌 (오프라인 모드 작동!)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 폰에 없으면 인터넷에서 가져오면서, 동시에 폰에 몰래 저장해둠 (회원님의 동적 캐싱)
      return fetch(event.request).then(networkResponse => {
        // 유효한 응답일 경우에만 복사해서 캐시에 저장
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 🔥 에러 수정 완료! 인터넷도 끊기고 캐시에도 없을 때의 예외 처리
        return new Response('Offline', {
            status: 503,
            statusText: 'Offline'
        });
      });
    })
  );
});