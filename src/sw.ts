import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown[] }

self.addEventListener('install', () => self.skipWaiting())
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url }) => url.href.startsWith('https://api.themoviedb.org/'),
  new NetworkFirst({
    cacheName: 'tmdb-api',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

registerRoute(
  ({ url }) => url.href.startsWith('https://image.tmdb.org/'),
  new CacheFirst({
    cacheName: 'tmdb-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

registerRoute(
  ({ url }) => url.href.startsWith('https://img.youtube.com/'),
  new CacheFirst({
    cacheName: 'youtube-thumbs',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json() as { title: string; body: string; url: string; tag: string }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url },
      tag: data.tag,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string | undefined) ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      if (list.length > 0) {
        const client = list[0] as WindowClient
        return client.navigate(url).then(c => c?.focus())
      }
      return self.clients.openWindow(url)
    })
  )
})
