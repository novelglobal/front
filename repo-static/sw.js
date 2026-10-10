/* Direct Action — offline cache.
   The app itself: network first, so an edit to config.js or examples.js shows on the next load; the cached copy when there is no signal.
   Imagery, land and photos: kept once seen. Live data: network first, the last answer when offline. */
const V = 'da-v14';
const SHELL = ['./', 'index.html', 'style.css', 'config.js', 'places.js', 'examples.js', 'field.js', 'briefs.js', 'marks.js', 'app.js', 'guide.html', 'field.html', 'vendor/maplibre-gl.js', 'vendor/maplibre-gl.css', 'vendor/qrcode.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
const KEEP = /arcgisonline\.com|elevation-tiles-prod|inaturalist-open-data|static\.inaturalist\.org/;
const LIVE = /api\.inaturalist\.org|open-meteo\.com|overpass|data\.melbourne\.vic\.gov\.au/;
const MAX_KEPT = 3000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(`${V}-shell`).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(V)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function trim(cache) {
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_KEPT))) await cache.delete(k);
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* the app's own server and the approval page are never kept: stories waiting for approval stay off every device */
  if (url.origin === location.origin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin'))) return;
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(`${V}-shell`);
      const hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
      if (!hit) return net.catch(() => Response.error());
      const slow = new Promise(res => setTimeout(() => res(hit), 3500));
      return Promise.race([net.catch(() => hit), slow]);
    })());
    return;
  }
  if (KEEP.test(url.host + url.pathname)) {
    e.respondWith(caches.open(`${V}-kept`).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const r = await fetch(req);
        if (r.ok) { c.put(req, r.clone()); if (Math.random() < 0.02) trim(c); }
        return r;
      } catch (err) { return Response.error(); }
    }));
    return;
  }
  if (LIVE.test(url.host)) {
    e.respondWith(caches.open(`${V}-live`).then(async c => {
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return (await c.match(req)) || Response.error(); }
    }));
  }
});
