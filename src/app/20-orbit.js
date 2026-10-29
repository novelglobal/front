
/* ════════════════════════════════════════════════════════════════════
   PLACES — the human ecology around each life. The places and networks in places.js are always here, offline too.
   Around a life just opened, every named business OpenStreetMap knows is fetched a small square at a time and kept.
   Each place belongs to one part of the human ecology (brands, circular, services, artists, third spaces, networks)
   and plays a role near the lives around it; a shop can also sell what harms them (takeaway containers, plastic bottles,
   paint, pesticides). They appear only inside an open cell's radius, as knots a string can be tied to.
   ════════════════════════════════════════════════════════════════════ */
function sectorOf(t) {
  const a = t.amenity, s = t.shop, c = t.craft, o = t.office; const has = (v, list) => v && list.includes(v);
  if (has(a, ['nightclub', 'theatre', 'arts_centre', 'music_venue', 'cinema', 'community_centre', 'events_venue', 'library', 'social_centre'])) return 'VENUE';
  if (has(a, ['cafe', 'restaurant', 'fast_food', 'bar', 'pub', 'ice_cream', 'food_court', 'biergarten']) || has(s, ['bakery', 'deli', 'confectionery', 'coffee', 'beverages', 'alcohol', 'wine', 'pastry', 'chocolate', 'tea'])) return 'FOOD';
  if (has(s, ['supermarket', 'convenience', 'greengrocer', 'butcher', 'grocery', 'organic', 'health_food', 'seafood', 'frozen_food']) || a === 'marketplace') return 'GROCERY';
  if (has(s, ['hardware', 'doityourself', 'garden_centre', 'trade', 'building_materials', 'paint', 'agrarian', 'florist']) || c === 'gardener') return 'GARDEN';
  if (has(s, ['clothes', 'fabric', 'shoes', 'boutique', 'fashion_accessories', 'bag', 'second_hand', 'tailor', 'sewing', 'haberdashery', 'dry_cleaning', 'laundry', 'textiles', 'jewelry', 'leather']) || has(c, ['tailor', 'dressmaker', 'upholsterer', 'shoemaker'])) return 'FASHION';
  if (has(a, ['fuel', 'car_wash', 'car_rental']) || has(s, ['car', 'car_repair', 'car_parts', 'tyres', 'motorcycle'])) return 'MOTOR';
  if (a === 'pharmacy' || has(s, ['chemist', 'beauty', 'hairdresser', 'cosmetics', 'perfumery', 'massage', 'tattoo', 'nail_salon'])) return 'CARE';
  if (a === 'veterinary' || has(s, ['pet', 'pet_grooming'])) return 'PETS';
  if (o || a === 'bank') return 'OFFICE';
  return 'RETAIL';
}
/* what a named place sells or leaves that harms a life near it, from its OpenStreetMap tags; most shops harm nothing */
function harmsOfTags(t) {
  const a = t.amenity, s = t.shop, c = t.craft, o = t.office; const has = (v, list) => v && list.includes(v); const h = [];
  if (/\b(pest|termite|weed|spray)/i.test(t.name || '') || c === 'gardener' || s === 'landscaping') h.push('spraying');
  if (has(a, ['cafe', 'restaurant', 'fast_food', 'ice_cream', 'food_court']) || has(s, ['bakery', 'coffee', 'deli', 'convenience', 'kiosk'])) h.push('takeaway');
  if (has(a, ['fast_food', 'bar', 'pub', 'nightclub', 'biergarten'])) h.push('litter');
  if (has(s, ['convenience', 'kiosk', 'supermarket', 'alcohol', 'beverages', 'wine', 'chemist']) || has(a, ['fuel', 'pharmacy'])) h.push('bottles');
  if (has(s, ['paint', 'hardware', 'doityourself', 'trade', 'building_materials'])) h.push('paint');
  if (has(s, ['hardware', 'doityourself', 'garden_centre', 'agrarian', 'supermarket']) || /\bpest/i.test(t.name || '')) h.push('poison');
  if (has(a, ['fuel', 'car_wash']) || has(s, ['car_repair', 'car', 'tyres', 'motorcycle'])) h.push('runoff');
  if (has(s, ['laundry', 'dry_cleaning'])) h.push('fibres');
  if (has(s, ['clothes', 'shoes', 'boutique', 'fashion_accessories', 'bag']) && t.second_hand !== 'only') h.push('fashion');
  if (has(a, ['bar', 'pub', 'nightclub']) || (o && !has(o, ['association', 'ngo', 'charity', 'foundation']))) h.push('light');
  return [...new Set(h)];
}
/* the role a named place plays, from its OpenStreetMap tags: what it does first, else the harm it does */
function roleOfTags(t) {
  const a = t.amenity, s = t.shop, c = t.craft, o = t.office, l = t.leisure; const has = (v, list) => v && list.includes(v);
  if (has(a, ['library', 'community_centre', 'social_centre', 'townhall']) || has(l, ['swimming_pool', 'sports_centre']) || (l === 'garden' && /community/.test(t['garden:type'] || ''))) return 'third';
  if (has(o, ['association', 'ngo', 'charity', 'foundation']) || (a === 'studio' && /radio/.test(t.studio || ''))) return 'network';
  if (has(s, ['second_hand', 'charity']) || t.second_hand === 'only') return 'reuse';
  if (has(c, ['tailor', 'dressmaker', 'shoemaker', 'upholsterer']) || has(s, ['tailor', 'repair', 'bicycle', 'shoe_repair', 'fabric', 'sewing', 'haberdashery', 'textiles'])) return 'repair';
  if (has(s, ['organic', 'health_food', 'zero_waste', 'bulk'])) return 'coop';
  if (s === 'garden_centre') return 'grower';
  if (a === 'marketplace') return 'market';
  if (has(a, ['arts_centre']) || has(t.tourism, ['gallery', 'museum']) || s === 'art') return 'space';
  if (has(c, ['pottery', 'jeweller', 'printer', 'sculptor', 'carpenter']) || has(o, ['architect', 'design', 'coworking']) || s === 'copyshop' || l === 'hackerspace' || a === 'coworking_space') return 'studio';
  if (a === 'veterinary') return 'vet';
  if (s === 'pet') return 'pets';
  return harmsOfTags(t)[0] || 'owner';
}
const GRID = 0.004;
let bizGrid = new Map();
function indexBiz() { bizGrid = new Map(); (S.biz || []).forEach((b, i) => { const k = `${Math.floor(b[3] / GRID)},${Math.floor(b[4] / GRID)}`; if (!bizGrid.has(k)) bizGrid.set(k, []); bizGrid.get(k).push(i); }); }
function bizNear(lat, lng, R) {
  const out = []; if (!S.biz) return out;
  const di = Math.ceil(R / 111000 / GRID), dj = Math.ceil(R / (111000 * Math.cos(lat * Math.PI / 180)) / GRID), ci = Math.floor(lat / GRID), cj = Math.floor(lng / GRID);
  for (let i = ci - di; i <= ci + di; i++) for (let j = cj - dj; j <= cj + dj; j++) {
    const a = bizGrid.get(`${i},${j}`); if (!a) continue;
    for (const k of a) { const b = S.biz[k]; const d = haversine(lat, lng, b[3], b[4]); if (d <= R) { const m = b[5] || {}; out.push({ i: k, n: b[0], b: b[1], sec: b[2], lat: b[3], lng: b[4], d, role: roleOfRow(b), h: harmsOfRow(b), fam: famOf(roleOfRow(b), m), cur: !!m.cur, url: m.url || '', what: m.what || '', addr: m.addr || '', a: !!m.a }); } }
  }
  return out.sort((a, b) => a.d - b.d);
}
/* a place's role: its own, else its kind of trade's; and the harms it does, its own, else its role's when that is one */
const roleOfRow = b => (b[5] && b[5].role) || (SECTORS[b[2]] || {}).role || 'owner';
const harmsOfRow = b => (b[5] && b[5].h) || (ROLES[roleOfRow(b)] && ROLES[roleOfRow(b)].on ? [roleOfRow(b)] : []);
const famOf = (role, m) => (m && m.cat) || (ROLES[role] || {}).cat || 'service';
const onNotice = role => !!(ROLES[role] && ROLES[role].on);
/* the places listed here: on the map from the first moment, offline too */
const LISTED = PLACES.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map(p => [p.n, '', 'LISTED', p.lat, p.lng, { role: p.role, cat: p.cat, url: p.url, what: p.what, addr: [p.addr, p.sub].filter(Boolean).join(', '), cur: 1, ...(p.a ? { a: 1 } : {}) }]);
/* OpenStreetMap, a square of about a kilometre at a time, kept a fortnight (an empty square, a day) */
const TILE = 0.01, TILES = store.get('da.tiles.v5', {});
try { localStorage.removeItem('da.biz.v4'); } catch (e) { /* old cache gone */ }
const tileKey = (i, j) => `${i},${j}`;
const freshTile = t => !!t && Date.now() - t.t < ((t.rows || []).length ? 14 : 1) * 864e5;
function rebuildBiz() {
  const rows = [...LISTED]; const seen = new Set(LISTED.map(r => `${norm(r[0])}|${r[3].toFixed(3)}|${r[4].toFixed(3)}`));
  const listedNear = r => LISTED.some(l => haversine(l[3], l[4], r[3], r[4]) < 90 && (norm(l[0]).includes(norm(r[0])) || norm(r[0]).includes(norm(l[0]).split(' ').slice(0, 2).join(' '))));
  for (const t of Object.values(TILES)) for (const r of t.rows || []) { const k = `${norm(r[0])}|${(+r[3]).toFixed(3)}|${(+r[4]).toFixed(3)}`; if (seen.has(k) || listedNear(r)) continue; seen.add(k); rows.push(r); }
  S.biz = rows; indexBiz();
}
function saveTiles() {
  const keys = Object.keys(TILES).sort((a, b) => TILES[a].t - TILES[b].t); while (keys.length > 40) delete TILES[keys.shift()];
  while (!store.set('da.tiles.v5', TILES) && keys.length) delete TILES[keys.shift()];
}
rebuildBiz();
const tilesFor = (lat, lng, R) => { const di = R / 111320, dj = R / (111320 * Math.cos(lat * Math.PI / 180)); const out = []; for (let i = Math.floor((lat - di) / TILE); i <= Math.floor((lat + di) / TILE); i++) for (let j = Math.floor((lng - dj) / TILE); j <= Math.floor((lng + dj) / TILE); j++) out.push([i, j]); return out; };
let placesBusy = null, placesFailAt = 0;
/* the places around a point, fetched if not yet kept; whatever happens the listed places are already here */
function placesAround(lat, lng, R) {
  const need = tilesFor(lat, lng, R).filter(([i, j]) => !freshTile(TILES[tileKey(i, j)]));
  if (!need.length) { S.bizState = 'ok'; return Promise.resolve(S.biz); }
  if (placesBusy) return placesBusy;
  if (Date.now() - placesFailAt < 90000) { S.bizState = 'off'; return Promise.resolve(S.biz); }
  S.bizState = 'loading'; if (typeof placesChanged === 'function') placesChanged();
  placesBusy = (async () => {
    const is = need.map(t => t[0]), js = need.map(t => t[1]);
    const bb = [Math.min(...is) * TILE, Math.min(...js) * TILE, (Math.max(...is) + 1) * TILE, (Math.max(...js) + 1) * TILE].map(v => v.toFixed(4)).join(',');
    for (const url of [CONFIG.OSM_API]) {
      try {
        const res = await fetch(`${url}?q=places&bb=${bb}`); if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json(); if (j.remark && /error|time/i.test(j.remark)) throw new Error(j.remark);
        const by = new Map(need.map(([i, k]) => [tileKey(i, k), []]));
        for (const el of j.elements || []) {
          const t = el.tags || {}; const la = el.lat != null ? el.lat : el.center && el.center.lat; const ln = el.lon != null ? el.lon : el.center && el.center.lon; if (la == null || !t.name) continue;
          const key = tileKey(Math.floor(la / TILE), Math.floor(ln / TILE)); if (!by.has(key)) continue;
          const role = roleOfTags(t), h = harmsOfTags(t), url = t.website || t['contact:website'] || t.url || '';
          by.get(key).push([t.name, t.brand && t.brand !== t.name ? t.brand : '', sectorOf(t), +la.toFixed(5), +ln.toFixed(5), { role, ...(h.length ? { h } : {}), ...(/^https?:\/\//.test(url) ? { url } : {}) }]);
        }
        const now = Date.now(); for (const [k, rows] of by) TILES[k] = { t: now, rows };
        saveTiles(); rebuildBiz(); S.bizState = 'ok'; placesBusy = null; if (typeof placesChanged === 'function') placesChanged(); return S.biz;
      } catch (e) { /* the next mirror */ }
    }
    placesFailAt = Date.now(); S.bizState = 'off'; placesBusy = null; if (typeof placesChanged === 'function') placesChanged(); return S.biz;
  })();
  return placesBusy;
}
/* ───────── the water as it is: every river, creek and canal along its own course, as wide as its banks are apart, and every
   pond, lake and wetland pool as its own shape, from OpenStreetMap. A square of about five kilometres at a time, kept a month.
   Until a square is here (offline, or the first moment) the few waters written into the config stand in ───────── */
const WTILE = 0.05, WTILES = store.get('da.water.v1', {});
let waterBusy = null, waterFailAt = 0;
/* metres east and north of a point, near enough at a city's size */
const enM = (la0, ln0) => { const kx = 111320 * Math.cos(la0 * Math.PI / 180); return (la, ln) => [(ln - ln0) * kx, (la - la0) * 110574]; };
const segD = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
/* one square read: its rivers as [kind, [[lat, lng, width m], …]], its still waters as rings of [lat, lng] */
function waterOf(j, la0, ln0) {
  const xy = enM(la0, ln0); const banks = [], rivers = [], pools = [];
  for (const el of j.elements || []) {
    const t = el.tags || {};
    const ways = el.type === 'relation' ? (el.members || []).filter(m => m.type === 'way' && m.geometry).map(m => m.geometry) : el.geometry ? [el.geometry] : [];
    for (const g of ways) { const pts = g.filter(Boolean).map(q => [+q.lat.toFixed(5), +q.lon.toFixed(5)]); if (pts.length < 2) continue;
      if (t.waterway && t.waterway !== 'riverbank') { rivers.push({ k: t.waterway, w: parseFloat(t.width) || 0, pts }); continue; }
      banks.push(pts.map(([la, ln]) => xy(la, ln)));
      const closed = el.type === 'way' && pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
      if (closed && t.water !== 'river' && t.waterway !== 'riverbank') pools.push(pts);
    }
  }
  /* each river's width where it runs: twice the distance to the nearer bank, if a bank is mapped within reach, smoothed */
  const DEF = { river: 34, canal: 14, stream: 6 };
  const out = rivers.map(r => {
    const ws = r.pts.map(([la, ln]) => { const p = xy(la, ln); let d = 160; for (const b of banks) for (let i = 1; i < b.length; i++) { const e = segD(p, b[i - 1], b[i]); if (e < d) d = e; } return d < 150 ? Math.max(4, Math.min(240, d * 2)) : (r.w || DEF[r.k] || 8); });
    const sm = ws.map((w, i) => Math.round(((ws[i - 1] ?? w) + w * 2 + (ws[i + 1] ?? w)) / 4));
    return [r.k, r.pts.map(([la, ln], i) => [la, ln, sm[i]])];
  });
  return { rivers: out, pools };
}
function saveWater() { const keys = Object.keys(WTILES).sort((a, b) => WTILES[a].t - WTILES[b].t); while (keys.length > 12) delete WTILES[keys.shift()]; while (!store.set('da.water.v1', WTILES) && keys.length) delete WTILES[keys.shift()]; }
/* the squares of water over what is in view */
function waterAround(lat, lng) {
  const i = Math.floor(lat / WTILE), j = Math.floor(lng / WTILE), key = `${i},${j}`; const t = WTILES[key];
  if (t && Date.now() - t.t < ((t.rivers || []).length || (t.pools || []).length ? 30 : 2) * 864e5) return Promise.resolve(t);
  if (waterBusy || Date.now() - waterFailAt < 120000) return Promise.resolve(null);
  waterBusy = (async () => {
    const bb = [i * WTILE, j * WTILE, (i + 1) * WTILE, (j + 1) * WTILE].map(v => v.toFixed(4)).join(',');
    for (const url of [CONFIG.OSM_API]) {
      try {
        const res = await fetch(`${url}?q=water&bb=${bb}`); if (!res.ok) throw new Error('HTTP ' + res.status);
        const jj = await res.json(); if (jj.remark && /error|time/i.test(jj.remark)) throw new Error(jj.remark);
        WTILES[key] = { t: Date.now(), la: (i + 0.5) * WTILE, ln: (j + 0.5) * WTILE, ...waterOf(jj, (i + 0.5) * WTILE, (j + 0.5) * WTILE) }; saveWater(); waterBusy = null; if (typeof life !== 'undefined') life.moved(); return WTILES[key];
      } catch (e) { /* the next mirror */ }
    }
    waterFailAt = Date.now(); waterBusy = null; return null;
  })();
  return waterBusy;
}
/* the squares under the view, its middle first, then its corners, one at a time */
let waterQ = null;
function waterView() {
  if (waterQ || typeof map === 'undefined' || map.getZoom() < 11.5) return; const b = map.getBounds(), c = map.getCenter();
  const pts = [[c.lat, c.lng], [b.getNorth(), b.getWest()], [b.getNorth(), b.getEast()], [b.getSouth(), b.getWest()], [b.getSouth(), b.getEast()]];
  waterQ = (async () => { for (const [la, ln] of pts) { try { await waterAround(la, ln); } catch (e) { /* later */ } } waterQ = null; })();
}
/* what is kept, for drawing: every square's rivers and pools */
const waterKept = () => Object.values(WTILES);
const liveEvent = u => !u.isEvent || !u.start || u.start + 3 * 3600e3 > Date.now();
/* a gig: tagged gig, or listed by Triple R (rrr) or Resident Advisor (ra) */
const isGig = o => !!o && !!o.isEvent && (o.tags || []).some(t => t === 'gig' || t === 'rrr' || t === 'ra');
const gigOf = o => ((o && o.tags) || []).map(t => GIGS[t]).find(Boolean) || null;
const cellsAll = () => [...S.obs.filter(o => !o.ob), ...S.user.filter(liveEvent), ...S.community.filter(c => c.kind !== 'refuge' && liveEvent(c)), ...S.heroes].filter(o => !hiddenCell(o.id));
const subjectOf = o => (o.ref != null && S.byId.get(o.ref) ? S.byId.get(o.ref) : o);
