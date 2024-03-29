import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { Queue, QueueStore } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';

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

self.addEventListener('install', () => {
  // skip over the "waiting" lifecycle state, probably
  self.skipWaiting();
});

const progress = new BroadcastChannel("progress_channel");

const beingDownloaded: {
  [key: string]: number
} = {};

const waitTillDone: [string, Function, Function][] = [];

function updateProgress(key: string, value: number | null, type: string = 'working') {
  if (value === null) delete beingDownloaded[key];
  else beingDownloaded[key] = value;

  if (value === null) {
    waitTillDone.filter(v => v[0] === key).forEach((v, i) => {
      console.log(`callback run for ${key} (${type})`)

      if (type === 'working') v[1]();
      else v[2]();

      waitTillDone.splice(i, 1);
    });
  }

  progress.postMessage(beingDownloaded);
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
            const errorHandler = () => {
              updateProgress(data.thing, null, 'error');

              event.ports[0].postMessage({
                error: true
              })
            }

            if (beingDownloaded[data.thing]) {
              console.log(`${data.thing} is already in queue; waiting...`)

              waitTillDone.push([data.thing, () => returnKeys(event, cache), () => event.ports[0].postMessage({
                error: true
              })]);

              return;
            }

            fetch(data.thing)
              .then(res => {
                const body = res.body;
                if (body) {
                  const reader = body.getReader();

                  let bytes = 0;
                  const size = parseInt(res.headers.get('Content-Length')!);

                  updateProgress(data.thing, bytes / size);

                  let arrays: Uint8Array[] = [];

                  reader.read().then(function processResult(result): any {
                    if (result.done) {
                      let chunksAll = new Uint8Array(bytes);
                      let position = 0;
                      for (let chunk of arrays) {
                        chunksAll.set(chunk, position);
                        position += chunk.length;
                      }

                      cache.put(data.thing, new Response(chunksAll, {
                        headers: res.headers
                      })).then(() => {
                        returnKeys(event, cache);
                        updateProgress(data.thing, null);
                      })

                      return;
                    }

                    bytes += result.value.length;

                    arrays.push(result.value);

                    updateProgress(data.thing, bytes / size);

                    return reader.read().then(processResult, errorHandler);
                  }, errorHandler);
                }
              }, errorHandler)
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
    } else if (data.do === 'deleteInfo') {
      caches.open('bookInfo').then(cache => {
        cache.delete(`/api/book/${data.thing}`).then(() => {
          event.ports[0].postMessage('ok')
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
registerRoute(/\/api\/book\/\w+\/thumb\/?$/, new StaleWhileRevalidate())
registerRoute(/\/api\/book\/\w+\/?$/, new NetworkFirst({
  cacheName: 'bookInfo',
  plugins: [
    new ExpirationPlugin({
      // 21 days/3 weeks I think
      maxAgeSeconds: 21 * 24 * 60 * 60,
    })
  ]
}), 'GET');
registerRoute(/\/api\/book\/\w+\/?$/, new NetworkOnly(), 'POST');
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
      await deleteUrlFromCache(e.request.url);

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
    const res = await new NetworkOnly().handle({ request: req.request.clone(), event: req.event });

    deleteUrlFromCache(res.url);

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
  cacheName: 'books',
  plugins: [
    new ExpirationPlugin({
      // 21 days/3 weeks I think
      maxAgeSeconds: 21 * 24 * 60 * 60,
    })
  ]
}), 'GET');
registerRoute(/\/api\/book\/\w+\/file\/?$/, async req => {
  const cache = await caches.match(req.url);
  if (cache) {
    return new Response(null, {
      headers: cache.headers
    })
  } else {
    try {
      const net = await new NetworkOnly().handle(req);
      return net;
    } catch (e) {
      return new Response('Unavailable offline', {
        status: 404
      })
    }
  }
}, 'HEAD');
registerRoute(/\/books\/\w+(?:\/read)?\/?$/, new NetworkFirst({
  cacheName: 'bookPages'
}), 'GET')
registerRoute(/\/pdf\.worker\.min\.js\/?$/, new CacheFirst({
  cacheName: 'others'
}), 'GET');
registerRoute(/\/\w+\/?$/, new NetworkFirst(), 'GET');
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