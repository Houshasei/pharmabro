/* PharmaBro service worker — offline-first cache for app shell + dataset. */
const CACHE = 'pharmabro-v1'
const SHELL = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.webmanifest',
  './dataset.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first for HTML (so updates roll out), cache-first for everything else.
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin && !url.hostname.endsWith('gstatic.com') && !url.hostname.endsWith('googleapis.com')) return

  const isHTML = req.headers.get('accept')?.includes('text/html')
  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return r
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    )
    return
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Refresh in the background.
        fetch(req).then((r) => {
          if (r.ok) caches.open(CACHE).then((c) => c.put(req, r)).catch(() => {})
        }).catch(() => {})
        return cached
      }
      return fetch(req).then((r) => {
        if (r.ok) {
          const copy = r.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        }
        return r
      })
    })
  )
})
