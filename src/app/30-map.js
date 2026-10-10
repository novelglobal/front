
/* ════════════════════════════════════════════════════════════════════
   THE GROUND — the satellite photograph on the land's own relief. No roads, no labels:
   the marks above it (35-life.js) are the only things that speak, and only where the radar has looked.
   ════════════════════════════════════════════════════════════════════ */
const IMG = CONFIG.IMAGERY;
const style = {
  version: 8,
  transition: { duration: 0, delay: 0 },
  sources: {
    sat: { type: 'raster', tiles: [IMG.url], tileSize: 256, maxzoom: IMG.maxzoom || 19, attribution: IMG.attribution },
    dem: { type: 'raster-dem', tiles: [CONFIG.DEM_URL], tileSize: 256, maxzoom: 15, encoding: 'terrarium', attribution: 'Terrain: AWS Terrain Tiles, GA 5 m DEM' },
    demShade: { type: 'raster-dem', tiles: [CONFIG.DEM_URL], tileSize: 256, maxzoom: 15, encoding: 'terrarium' },
  },
  layers: [
    { id: 'ground', type: 'background', paint: { 'background-color': '#1E2622' } },
    { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-saturation': -0.38, 'raster-contrast': -0.04, 'raster-brightness-max': 0.9, 'raster-fade-duration': 0 } },
    { id: 'shade', type: 'hillshade', source: 'demShade', paint: { 'hillshade-exaggeration': 0.2, 'hillshade-shadow-color': '#0B2545', 'hillshade-highlight-color': '#FFFFFF', 'hillshade-accent-color': '#0B2545' } },
  ],
};
/* the frame: on a phone the card is a sheet over the lower half, so the ground is framed above it; on a desk it sits to the right */
const phone = () => innerWidth < 760;
const framePad = () => (phone() ? { top: 24, left: 16, right: 16, bottom: Math.round(innerHeight * (S.open ? 0.56 : 0)) + 16 } : { top: 32, left: 32, bottom: 32, right: (S.open ? Math.min(440, innerWidth * 0.4) : 0) + 64 });
const sheetOffset = () => (phone() && S.open ? [0, -innerHeight * (document.body.classList.contains('placing') ? 0.37 : 0.26)] : !phone() && S.open ? [-Math.min(440, innerWidth * 0.4) / 2, 0] : [0, 0]);
/* the zoom at which the radar fills a good part of the screen */
const metresPerPx = (lat, z) => 78271.51696 * Math.cos(lat * Math.PI / 180) / Math.pow(2, z);
function scanZoom(r = S.scan.r) { const c = $('#world'); const dim = Math.min(c.clientWidth || innerWidth, (c.clientHeight || innerHeight) * (phone() && S.open ? 0.5 : 1)); return clamp(Math.log2(78271.51696 * Math.cos(S.scan.lat * Math.PI / 180) / (r / (dim * 0.36))), 12.5, 17.5); }
const map = new maplibregl.Map({
  container: 'world', style, center: [S.scan.lng, S.scan.lat], zoom: 13, pitch: 0, bearing: 0, maxPitch: 70,
  attributionControl: false, fadeDuration: 0, renderWorldCopies: false,
  maxBounds: [[B.w - 0.07, B.s - 0.06], [B.e + 0.07, B.n + 0.06]],
});
/* the information corner: who made it, where everything comes from, the build this page came from, and the way to the approval page */
const buildWord = (BUILD.sha ? ` · <span class="da-build" title="The version of the site you are looking at">BUILD ${esc(BUILD.sha.toUpperCase())}${BUILD.branch ? ` · ${esc(BUILD.branch.toUpperCase())}` : ''}</span>` : '') + ' · <a class="da-admin" href="admin" target="_blank" rel="noopener" title="Approval">ADMIN</a>';
map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: `<a href="#sources" class="da-about">${CONFIG.NAME} · ${CONFIG.BY.toUpperCase()}</a> · iNaturalist · © OpenStreetMap · Open-Meteo${buildWord}` }), 'bottom-left');
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a.da-about'); if (a) { e.preventDefault(); setView(1, false, 'sources'); } });
map.on('load', () => {
  S.mapReady = true;
  const open = S.byId.get(S.sel);
  if (open) map.jumpTo({ center: [open.lng, open.lat], zoom: 15.6 });
  /* the radar framed in the ground left open beside the page (NOW lands open), settling in as it comes */
  else { const z = scanZoom(); if (!reduced()) { map.jumpTo({ center: [S.scan.lng, S.scan.lat], zoom: z - 0.8 }); map.easeTo({ center: [S.scan.lng, S.scan.lat], zoom: z, offset: sheetOffset(), duration: 1600, easing: t => 1 - Math.pow(1 - t, 3) }); } else map.easeTo({ center: [S.scan.lng, S.scan.lat], zoom: z, offset: sheetOffset(), duration: 0 }); }
  const fold = () => { const a = document.querySelector('.maplibregl-ctrl-attrib'); if (a) a.classList.remove('maplibregl-compact-show'); };
  fold(); setTimeout(fold, 200);
  life.start(); refresh();
});
map.on('error', () => { /* a tile that cannot load stays blank; offline is a normal state */ });
map.on('move', () => life.moved());
map.on('resize', () => life.resize());

/* tilt far enough and the ground rises: the terrain in three dimensions under the same photograph */
let raised = false;
map.on('pitchend', () => {
  const want = map.getPitch() > 22; if (want === raised) return; raised = want;
  try { map.setTerrain(want ? { source: 'dem', exaggeration: CONFIG.TERRAIN_EXAGGERATION } : null); } catch (e) { /* flat is fine */ }
  life.moved();
});

/* ───────── touch: everything on the ground is hit-tested where it is drawn ───────── */
map.on('click', e => {
  /* while placing: a touch inside the marker's radius moves it there; on the marker itself or outside the radius, placing is cancelled */
  if (S.mode === 'place') { if (consumeHold()) return; const p = S.place; const q = p && map.project([p.lng, p.lat]); if (p && (Math.hypot(q.x - e.point.x, q.y - e.point.y) < 18 || haversine(p.lat, p.lng, e.lngLat.lat, e.lngLat.lng) > rangeOf(p))) { cancelPlace(); return; } movePlace(e.lngLat); return; }
  const h = life.hit(e.point.x, e.point.y);
  /* an open cell keeps its focus: knots are looked at, then tied; a life outside its radius is only looked at */
  if (S.mode === 'ping') {
    if (knotHeld) { knotHeld = false; return; }
    if (h && h.kind === 'node') { strings.tap(h.key); return; }
    if (h && h.kind === 'cell') { if (h.id === S.sel) strings.tap('pin'); else strings.peekOut(h.id); return; }
    if (h && h.kind === 'zoom') return;
    if (h && h.kind === 'partner') { selectPartner(h.id); return; }
    const o = S.byId.get(S.sel); if (o && haversine(o.lat, o.lng, e.lngLat.lat, e.lngLat.lng) <= rangeOf(o)) { strings.ground(e.lngLat); return; }
    strings.unpeek(); tick(800); return;
  }
  if (h) {
    if (h.kind === 'zoom') return;
    if (h.kind === 'node') { strings.tap(h.key); return; }
    if (h.kind === 'new') { life.offer(null); startPlace({ lat: h.lat, lng: h.lng }); return; }
    if (h.kind === 'tribe') { selectTribe(h.id); return; }
    if (h.kind === 'partner') { selectPartner(h.id); return; }
    select(h.id); return;
  }
  if (S.mode) { closeRecord(); return; }
  /* inside the radar: offer a new record here; outside it: the radar goes there */
  if (life.inScan(e.lngLat.lat, e.lngLat.lng)) { life.offer(e.lngLat); tick(1300); }
  else life.moveScan(e.lngLat.lat, e.lngLat.lng, true);
});
/* a double tap ties instead of zooming while a cell or a marker is open */
map.on('dblclick', e => { if (S.mode === 'ping' || S.mode === 'place') e.preventDefault(); });
let hoverT = 0, hoverKey = null, hoverLast = null;
function hoverAt(e) {
  const h = life.hit(e.point.x, e.point.y, true); const canvas = map.getCanvas();
  canvas.style.cursor = h ? 'pointer' : S.mode === 'ping' || S.mode === 'place' || life.inScan(map.unproject(e.point).lat, map.unproject(e.point).lng) ? '' : 'crosshair';
  const key = h ? (h.kind === 'node' ? 'n:' + h.key : h.kind === 'cell' ? 'c:' + h.id : h.kind === 'partner' ? 'p:' + h.id : null) : null;
  if (key !== hoverKey) { hoverKey = key; life.hover(h && key ? h : null); }
}
/* at most one look every 40 ms, and always one where the pointer comes to rest */
map.on('mousemove', e => {
  hoverLast = e; if (hoverT) return; hoverAt(e);
  hoverT = setTimeout(() => { hoverT = 0; if (hoverLast && hoverLast !== e) hoverAt(hoverLast); }, 40);
});
map.getCanvas().addEventListener('mouseleave', () => { hoverKey = null; life.hover(null); });
/* the right button joins: in an open life a knot is joined or let go, another life is brought in and joined, the life itself plays;
   with nothing open it opens what is under it. It never makes a record: holding the left button down does that */
let lastTouch = 0;
map.on('contextmenu', e => {
  e.preventDefault(); if (performance.now() - lastTouch < 900) return;
  if (S.mode === 'place') { cancelPlace(); return; }
  const h = life.hit(e.point.x, e.point.y, true);
  /* on open ground the right button backs out: whatever is open closes and the radar carries on */
  if (!h || h.kind === 'zoom') { if (S.mode) { tick(900); closeRecord(); } return; }
  if (S.mode === 'ping') { if (h.kind === 'node') strings.join(h.key); else if (h.kind === 'cell') { if (h.id === S.sel) strings.playOpen(); else strings.join('x:' + h.id); } return; }
  if (h.kind === 'cell') select(h.id); else if (h.kind === 'tribe') selectTribe(h.id); else if (h.kind === 'partner') selectPartner(h.id);
});
/* on a phone a long press on a knot is the right button: it joins at once, or lets go */
let knotT = 0, knotPt = null, knotHeld = false;
map.on('touchstart', e => {
  lastTouch = performance.now(); clearTimeout(knotT); knotPt = null;
  if (S.mode !== 'ping' || (e.points && e.points.length > 1)) return;
  const h = life.hit(e.point.x, e.point.y, true); if (!h || (h.kind !== 'node' && h.kind !== 'cell')) return;
  knotPt = e.point; knotT = setTimeout(() => { if (!knotPt) return; knotPt = null; knotHeld = true; buzz(10); if (h.kind === 'node') strings.join(h.key); else if (h.id === S.sel) strings.playOpen(); else strings.join('x:' + h.id); }, 480);
});
map.on('touchmove', e => { if (knotPt && (!e.point || Math.hypot(e.point.x - knotPt.x, e.point.y - knotPt.y) > 8)) { clearTimeout(knotT); knotPt = null; } });
map.on('touchend', () => { clearTimeout(knotT); knotPt = null; if (knotHeld) setTimeout(() => { knotHeld = false; }, 450); });
map.on('dragstart', () => { clearTimeout(knotT); knotPt = null; });

/* ───────── City of Melbourne: drinking water and air temperature now, on a hot day ───────── */
const overlayState = {};
const geoOf = r => { for (const k of ['geo_point_2d', 'latlong', 'location', 'lat_long', 'coordinates', 'geolocation']) { const g = r[k]; if (g && typeof g === 'object' && (g.lat != null || g.latitude != null)) return [+(g.lon ?? g.longitude ?? g.lng), +(g.lat ?? g.latitude)]; } if (r.latitude != null && r.longitude != null) return [+r.longitude, +r.latitude]; if (r.lat != null && (r.lon != null || r.lng != null)) return [+(r.lon ?? r.lng), +r.lat]; return null; };
async function loadOverlays() {
  if (overlayState.started) return; overlayState.started = true;
  await Promise.all((CONFIG.OVERLAYS || []).map(async ov => {
    try {
      const url = `${CONFIG.OVERLAY_API}${ov.dataset}/${ov.kind === 'temp' ? `records?${ov.query || 'limit=100'}` : 'exports/geojson?limit=-1'}`;
      let j = await (await fetch(url)).json(); let n = 0;
      if (ov.kind === 'temp' && !(j.results || []).length && ov.query) j = await (await fetch(`${CONFIG.OVERLAY_API}${ov.dataset}/records?limit=100`)).json();
      if (ov.kind === 'temp') {
        const seen = new Set();
        for (const r of j.results || []) {
          const g = geoOf(r); if (!g || !inBox(g[1], g[0])) continue; const dev = r.device_id || r.devid || r.sensor_id || r.site_id || `${g[0].toFixed(4)},${g[1].toFixed(4)}`; if (seen.has(dev)) continue;
          const tk = Object.keys(r).find(k => /temp/i.test(k) && Number.isFinite(+r[k]) && r[k] !== null); if (!tk) continue; seen.add(dev);
          S.sensors.push({ lng: g[0], lat: g[1], t: +r[tk] }); n++;
        }
      } else {
        for (const f of j.features || []) { const g = f.geometry; if (!g || g.type !== 'Point') continue; const [lng, lat] = g.coordinates; if (!inBox(lat, lng)) continue; S.fountains.push({ lat, lng }); n++; }
      }
      overlayState[ov.id] = n ? `${n}` : 'empty';
    } catch (e) { overlayState[ov.id] = 'unavailable'; }
  }));
  life.data();
}
