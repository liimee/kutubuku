import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin, Queue } from 'workbox-background-sync';

declare let self: ServiceWorkerGlobalScope

function mapKeys(keys: readonly Request[]) {
  return keys.map(v => v.url.match(/\/api\/book\/(\w+)\/file\/?$/)![1])
}

function returnKeys(event: ExtendableMessageEvent, cache: Cache) {
  cache.keys().then(keys => {
    const mapped = mapKeys(keys);
    event.ports[0].postMessage(mapped);
  });
}

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
            cache.add(data.thing).then(() => {
              console.log('Downloaded ' + data.thing);

              returnKeys(event, cache)
            })
          } else {
            console.log(data.thing + ' is already in cache')
            returnKeys(event, cache)
          }
        })
      })
    } else if (data.do == 'getDownloaded') {
      caches.open('books').then(cache => {
        returnKeys(event, cache)
      })
    } else if (data.do == 'deleteBook') {
      caches.open('books').then(cache => {
        cache.delete(`/api/book/${data.thing}/file`).then(() => {
          returnKeys(event, cache)
        })
      })
    }
  }
});

const bgSync = new Queue('progressQueue', {
  maxRetentionTime: 24 * 60
})

registerRoute(/\/api\/book\/\w+\/?$/, new NetworkFirst({
  cacheName: 'bookInfo'
}), 'GET');
registerRoute(/\/api\/book\/\w+\/progress?\/?$/, (e) => {
  return new Promise((resolve) => {
    bgSync.replayRequests().finally(() => {
      new NetworkOnly().handle(e).then(resolve, () => {
        function sendCache() {
          caches.match(e.request).then(v => {
            if (v) resolve(v);
            else resolve(new Response(JSON.stringify({
              progress: 0
            })))
          })
        }

        try {
          bgSync.getAll().then(v => {
            if (v.length > 0) {
              const latest = v.reduce((max, obj) => {
                return obj.timestamp! > max.timestamp! ? obj : max;
              })

              latest.request.text().then(text =>
                resolve(new Response(JSON.stringify({
                  progress: parseFloat(text)
                }))))
            } else {
              sendCache();
            }
          })
        } catch (_) {
          sendCache();
        }
      })
    });
  });
}, 'GET')
registerRoute(/\/api\/book\/\w+\/progress?\/?$/, new NetworkOnly({
  plugins: [{
    fetchDidFail: async e => {
      bgSync.pushRequest(e)
    }
  }]
}), 'POST')
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