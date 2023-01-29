declare let self: ServiceWorkerGlobalScope

console.log('Hello from util.');

self.addEventListener('message', event => {
  if (event) {
    const { data } = event;

    if (data.do == 'download') {
      if (data.things) {
        caches.open(data.name).then(cache => {
          cache.addAll(data.things).then(() => console.log('Downloaded'))
        })
      }
    }
  }
});

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
    }
  }
});

export { }