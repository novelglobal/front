/* novel.global, the offline cache.
   The app itself: network first, so an edit to config.js or examples.js shows on the next load; the cached copy when there is no signal.
   Its libraries and type (vendor/): kept first, since they change only with a release, and a release renames the cache.
   Imagery, land and photos: kept once seen. Live data: network first, the last answer when offline. Since stage 4 iNaturalist and
   OpenStreetMap come through novel.global's own /api/inat/ and /api/osm, and photographs through /api/img: kept the same way */
const V = 'da-v121';
const SHELL = ['./', 'index.html', 'base.css', 'base.js', 'aura.css', 'aura.js', 'base-db.json', 'studio', 'style.css', 'config.js', 'places.js', 'examples.js', 'field.js', 'briefs.js', 'marks.js', 'app.js', 'guide.html', 'field.html', 'portfolio.html', 'vendor/maplibre-gl.js', 'vendor/maplibre-gl.css', 'vendor/qrcode.js', 'vendor/fabric.min.js', 'ladder.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'printer-top.jpg'];
const KEEP = /arcgisonline\.com|elevation-tiles-prod|inaturalist-open-data|static\.inaturalist\.org/;
const LIVE = /api\.inaturalist\.org|open-meteo\.com|overpass|data\.melbourne\.vic\.gov\.au/;
const OWN_LIVE = /^\/api\/(inat\/|osm$)/, OWN_KEEP = /^\/api\/img$/;
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
  const own = url.origin === location.origin;
  /* the app's own server and the approval page are never kept (stories waiting for approval stay off every device), but for the
     open data it passes on */
  if (own && !OWN_LIVE.test(url.pathname) && !OWN_KEEP.test(url.pathname) && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin'))) return;
  if (own && !url.pathname.startsWith('/api/')) {
    e.respondWith((async () => {
      const c = await caches.open(`${V}-shell`);
      const hit = await c.match(req, { ignoreSearch: true });
      /* the libraries and type change only with a release, and each release renames the cache: kept first */
      if (hit && url.pathname.startsWith('/vendor/')) return hit;
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
      if (!hit) return net.catch(() => Response.error());
      const slow = new Promise(res => setTimeout(() => res(hit), 3500));
      return Promise.race([net.catch(() => hit), slow]);
    })());
    return;
  }
  if (KEEP.test(url.host + url.pathname) || (own && OWN_KEEP.test(url.pathname))) {
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
  if (LIVE.test(url.host) || (own && OWN_LIVE.test(url.pathname))) {
    e.respondWith(caches.open(`${V}-live`).then(async c => {
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return (await c.match(req)) || Response.error(); }
    }));
  }
});
