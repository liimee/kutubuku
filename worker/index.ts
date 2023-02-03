import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope

self.addEventListener('message', event => {
  if (event) {
    const { data } = event;

    if (data.do == 'download') {
      if (data.things) {
        caches.open(data.name).then(cache => {
          cache.addAll(data.things).then(() => console.log('Downloaded ' + data.things.join(', ')))
        })
      }
    } else if (data.do == 'downloadIfNotExist') {
      caches.open(data.name).then(cache => {
        cache.match(data.thing).then(v => {
          if (!v) {
            cache.add(data.thing).then(() => console.log('Downloaded ' + data.thing))
          } else {
            console.log(data.thing + ' is already in cache')
          }
        })
      })
    } else if (data.do == 'getDownloaded') {
      caches.open('books').then(cache => {
        cache.keys().then(keys => {
          const mapped = keys.map(v => v.url.match(/\/api\/book\/(\w+)\/file\/?$/)![1]);
          event.ports[0].postMessage(mapped);
        });
      })
    }
  }
});

registerRoute(/\/api\/book\/\w+\/?$/, new NetworkFirst({
  cacheName: 'bookInfo'
}), 'GET');
registerRoute(/\/api\/\w+\/?$/, new NetworkFirst({
  cacheName: 'apis'
}), 'GET');
registerRoute(/\/api\/book\/\w+\/file\/?$/, new CacheFirst({
  cacheName: 'books'
}), 'GET');
registerRoute(/\/books\/\w+(?:\/read)?\/?$/, new NetworkFirst({
  cacheName: 'bookPages'
}), 'GET')

/* 
self.addEventListener('fetch', (event) => {
  if (event) {
    const pathname = new URL(event.request.url).pathname;

    if (/^\/api\/book\/\w+\/?$/.test(pathname)) {
      event?.respondWith(caches.open('bookInfo').then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());

            return networkResponse;
          });

          return cachedResponse || fetchedResponse;
        });
      }));
    } else if (/^\/api\/\w+\/?$/.test(pathname)) {
      event?.respondWith(caches.open('apis').then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());

            return networkResponse;
          });

          return cachedResponse || fetchedResponse;
        });
      }));
    } else if (/^\/api\/book\/\w+\/file\/?$/.test(pathname)) {
      event?.respondWith(caches.open('books').then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());

            return networkResponse;
          });
        });
      }));
    } else if (/^\/books\/\w+(?:\/read)?\/?$/.test(pathname)) {
      event?.respondWith(caches.open('bookPages').then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());

            return networkResponse;
          });

          return cachedResponse || fetchedResponse;
        });
      }));
    }
  }
});
 */
export { }