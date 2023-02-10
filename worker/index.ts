import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { Queue, QueueStore } from 'workbox-background-sync';

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

async function deleteUrlFromCache(url: string) {
  try {
    const queue = new QueueStore('progressQueue');
    const actualQueue = await queue.getAll();
    for (let v of actualQueue.filter(v => v.requestData.url === url)) {
      await queue.deleteEntry(v.id)
    }
  } catch (_) { }
}

const bgSync = new Queue('progressQueue', {
  maxRetentionTime: 24 * 60
})

registerRoute(/\/api\/book\/\w+\/?$/, new StaleWhileRevalidate({
  cacheName: 'bookInfo'
}), 'GET');
registerRoute(/\/api\/book\/\w+\/progress?\/?$/, async (e) => {
  function respond(thing: any, from: string) {
    console.log('Returning progress from ' + from);
    return new Response(JSON.stringify(thing));
  }

  const blankResponse = {
    progress: 0,
    lastUpdated: new Date(1).toISOString()
  };

  const cache = await (await caches.match(e.request))?.json() || blankResponse;

  const net = await (async () => {
    try {
      return await (await new NetworkOnly().handle(e))?.json();
    } catch (_) {
      return blankResponse;
    }
  })()

  const all = await bgSync.getAll();
  const bg = all.length > 0 ? await (async () => {
    const latest = all.reduce((max, obj) => {
      return obj.timestamp! > max.timestamp! ? obj : max;
    })

    const text = await latest.request.json()
    return {
      progress: text.progress,
      lastUpdated: new Date(text.now).toISOString()
    }
  })() : blankResponse;

  if (bg.lastUpdated > net.lastUpdated) {
    bgSync.registerSync();
    return respond(bg, 'bg');
  } else {
    if (cache.lastUpdated > bg.lastUpdated) {
      deleteUrlFromCache(e.request.url);

      if (net.lastUpdated > cache.lastUpdated) {
        return respond(net, 'net');
      } else {
        return respond(cache, 'cache');
      }
    } else {
      return respond(net, 'net');
    }
  }
}, 'GET')
registerRoute(/\/api\/book\/\w+\/progress?\/?$/, async (req) => {
  try {
    const res = await new NetworkOnly().handle(req);

    deleteUrlFromCache(req.request.url);

    console.log('sent through net')

    return res
  } catch (_) {
    await bgSync.pushRequest(req)
    console.log('added to queue')
    return new Response('ok?')
  }
}, 'POST')
registerRoute(/\/api\/\w+\/?$/, new NetworkFirst({
  cacheName: 'apis'
}), 'GET');
registerRoute(/\/api\/book\/\w+\/file\/?$/, new CacheFirst({
  cacheName: 'books'
}), 'GET');
registerRoute(/\/books\/\w+(?:\/read)?\/?$/, new NetworkFirst({
  cacheName: 'bookPages'
}), 'GET')
registerRoute(/\/pdf\.worker\.min\.js\/?$/, new CacheFirst());
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