
/* ════════════════════════════════════════════════════════════════════
   THE RADAR — the map holds nothing until the radar has looked. A slow hand sweeps the pinned circle and each life
   it passes appears and stays while the radar stays. Outside it, one rule: only what is from the last 24 hours,
   whether a pin, a sighting, a story, a gathering, or an animal hurt, dead or lost.
   Open a cell and the sweep stops: its own radius opens, and everything inside it becomes a knot for a string.
   Two canvases over the photograph: the ground (the radar's mask, ticks and patches) and the marks.
   ════════════════════════════════════════════════════════════════════ */
const nameOf = o => {
  if (!o) return ''; const sub = subjectOf(o); const d = (o.ev && o.ev.data) || {};
  if (o.isEvent || o.comm || (o.user && o.hum && o.title)) return o.title;
  if (sub.tx) return sub.tx.cn || sub.tx.n;
  return d.text || o.title || (o.hum ? 'People' : SCALES[bandOf(o)].label.split(' · ')[0]);
};
const isAlarm = o => !!o && (o.kind === 'injured' || o.kind === 'lost' || o.kind === 'dead');
const codeOf = o => (o.code ? o.code : typeof o.id === 'number' ? toCode(o.id) : o.comm ? o.hid : o.user ? toCode(String(o.ev.key).slice(-6)) : o.hero ? 'H·' + o.hero.toUpperCase() : String(o.id).toUpperCase());
const hashOf = o => (o.code ? o.code : typeof o.id === 'number' ? toCode(o.id) : o.comm ? o.hid : o.user ? 'U' + o.ev.key : o.isTribe ? o.tid : '');
/* a point a distance and a bearing away: flat, which holds well inside a few kilometres */
const KY = 110540;
const dest = (lat, lng, d, brg) => { const r = brg * Math.PI / 180; return [lat + d * Math.cos(r) / KY, lng + d * Math.sin(r) / (111320 * Math.cos(lat * Math.PI / 180))]; };
const life = (() => {
  const make = cls => { const c = document.createElement('canvas'); c.className = cls; c.setAttribute('aria-hidden', 'true'); return c; };
  const baseCv = make('life'), fxCv = make('life fx');
  let bx = null, fx = null, W = 0, H = 0, dpr = 1, items = [], movers = [], bins = [], curD = 0;
  let dirty = true, fxDirty = true, raf = 0, lastFx = 0, hoverH = null;
  const tagEl = $('#tag'), handle = $('#radius'), knob = $('#knob'), ringK = $('#ring');
  let selT = 0, dragging = false, ringPts = [], cellPts = [];
  const audio = new Audio(); audio.preload = 'none'; let playing = '';
  const TAU = Math.PI * 2, SC = Object.assign({ min: 250, max: 1500, turn: 8 }, CONFIG.SCAN || {});
  /* the sweep, as a bearing; what it has found, and when */
  let sweepB = 0, lastSweep = 0; const seen = new Map(); let songFx = [];
  /* the centre, pressed: every string inside the radar played as a song */
  let singT = 0;
  function song() { songFx = strings.song(); fxDirty = true; if (!songFx.length) { tick(700); return; } const end = Math.max(...songFx.map(n => n.at)) - performance.now() + 500; knob.classList.add('sing'); clearTimeout(singT); singT = setTimeout(() => knob.classList.remove('sing'), end); }
  function resize() {
    if (!bx) return; const c = map.getContainer(); dpr = Math.min(2, devicePixelRatio || 1); W = c.clientWidth; H = c.clientHeight;
    for (const cv of [baseCv, fxCv]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = `${W}px`; cv.style.height = `${H}px`; }
    dirty = true;
  }
  function start() {
    const host = map.getCanvas().parentNode; host.appendChild(baseCv); host.appendChild(fxCv);
    bx = baseCv.getContext('2d'); fx = fxCv.getContext('2d'); resize(); data();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  /* ───────── what each record is: the thing itself, in the shape of its kind of record ───────── */
  const zoomNow = () => (S.mapReady ? map.getZoom() : 14);
  /* icons are small, many and dense; they grow close in, where each shows its photograph: the ground asks to be approached */
  const kzAt = z => clamp(0.45 + (z - 13.2) * 0.25, 0.45, 1);
  /* half their full size from afar, growing back to full size close in (by zoom 16) */
  const halfAt = z => 0.5 + 0.5 * clamp((z - 13.5) / 2.5, 0, 1);
  const sizeAt = (z = zoomNow()) => Math.max(4, Math.round(clamp(13 + (z - 12.5) * 3.4, 13, 24) * kzAt(z) * halfAt(z) / 2) * 2);
  const PHOTO_Z = 16.2;   /* closer than this, a life is its photograph */
  const HOVER_D = 68;     /* the photograph a mark grows into under the pointer */
  /* a living map: what is new is bright and full; what is old fades and shrinks to a small ghost */
  const ghostOf = o => { if (!o || o.hero || o.partner) return 1; const t = stampOf(o); if (!t) return 1; const days = (Date.now() - t) / 864e5; return clamp(1 - (days - 1) / 40, 0.28, 1); };
  const PLACE_TONE = { flora: 'flora', injured: 'injured', dead: 'dead', lost: 'lost', need: 'need', offer: 'offer', event: 'event' };
  const PLACE_ICON = { need: 'plus', offer: 'give', event: 'people', injured: 'injured', dead: 'harm' };
  const PLANT_Z = 14.8;   /* plants show only close up, and small */
  function badgeOf(o, d0) {
    const d = d0 || sizeAt();
    if (o.id === 'place') {
      const k = PLACE_KINDS[o.kind] || PLACE_KINDS[0]; const g = placeGlyph(o);
      return { tone: k.f === 'fauna' ? M.toneOf(g) : PLACE_TONE[k.f] || 'k-other', g, i: g ? null : PLACE_ICON[k.f] || 'plus', d: Math.max(d, 18) + 6 };
    }
    if (o.hero) { const deg = degOf(o); return { tone: M.toneOf(glyphOf(o)), g: glyphOf(o), d: d + Math.round(d * 0.5), dz: deg >= 3 ? deg : 0, sig: !!o.tx.th, hero: true }; }
    /* a story: a slip issued about a life, standing where its life was */
    if (o.story) return { tone: 'story', g: glyphOf(o), d: Math.max(10, d + 4), carried: !o.ex, fresh: isFresh(o) };
    if (o.hist) return { tone: 'hist', d: Math.max(6, Math.round(d * 0.42)) };
    /* a cell from a pack: its kind's colour and mark, a fruit tree, a mesh node, water, shade */
    if (o.pack) { const K = PACK_KINDS[o.pk] || PACK_KINDS.place; return { tone: K.tone, g: K.g || null, i: K.g ? null : K.i, d: d + 2 }; }
    if (o.kind === 'injured') return { tone: 'injured', g: o.tx || o.g ? glyphOf(o) : null, i: o.tx || o.g ? null : 'injured', d: d + 4 };
    if (o.kind === 'dead') return { tone: 'dead', g: o.tx || o.g ? glyphOf(o) : null, i: o.tx || o.g ? null : 'harm', d: d + 2 };
    if (o.kind === 'lost') return { tone: 'lost', g: o.tx || o.g ? glyphOf(o) : 'paw', d: d + 4 };
    if (o.hum) {
      const k = o.kind; const gig = isGig(o); const i = gig ? 'hug' : o.i || (k === 'event' ? ((o.tags || []).includes('sound') ? 'sound' : 'people') : k === 'offer' ? 'give' : k === 'pulse' ? 'people' : k === 'refuge' ? 'refuge' : 'plus');
      if (gig) return { tone: 'event', g: null, i, d: d + 2 };
      return { tone: k === 'event' ? 'event' : k === 'offer' || k === 'pulse' ? 'offer' : 'need', g: o.g || null, i: o.g ? null : i, d, fresh: isFresh(o) };
    }
    const sub = subjectOf(o); const g = glyphOf(o); const flora = ['Plantae', 'Fungi'].includes(kindOf(sub)) || bandOf(o) === 5 || g === 'plant' || g === 'fungi';
    if (isCold(o)) return { tone: 'cold', g, d: Math.max(6, Math.round(d * 0.64)) };
    const deg = degOf(o);
    const fresh = !!(o.isNew || (o.arrived && Date.now() - o.arrived < 7 * 864e5) || isFresh(o));
    if (flora) return { tone: 'flora', g, d: Math.max(6, Math.round(d * 0.55)), sig: !!(sub.tx && sub.tx.th), dz: deg >= 3 ? deg : 0, fresh };
    return { tone: M.toneOf(g), g, d: d + (o.user ? 2 : 0) + (deg >= 3 ? 2 : 0), sig: !!(sub.tx && sub.tx.th), fresh, n: o.n > 1 ? o.n : 0, dz: deg >= 3 ? deg : 0 };
  }
  /* the kind of life a record being placed will carry: the one chosen, else the one the words name, else any animal */
  function placeGlyph(p) { const k = PLACE_KINDS[p.kind] || PLACE_KINDS[0]; if (p.g) return p.g; if (p.tx) return glyphOf(p); if (k.f === 'flora') return 'plant'; return ['fauna', 'injured', 'dead', 'lost'].includes(k.f) ? 'paw' : null; }
  /* how far to search for an animal lost: a dog runs, a cat hides close */
  const searchOf = o => o.search || ({ dog: 900, cat: 350 }[glyphOf(o)] || 500);
  const MOVING = new Set(['k-bird', 'k-mammal', 'k-insect', 'k-spider', 'k-reptile', 'k-water', 'k-other']);
  function data() {
    if (!bx) return; items = []; const now = Date.now(); curD = sizeAt();
    for (const o of [...S.hist, ...S.obs.filter(x => !x.ob), ...S.user.filter(liveEvent), ...S.community.filter(liveEvent), ...S.heroes, ...storyCells()]) {
      if (hiddenCell(o.id)) continue;
      const b = badgeOf(o, curD); const r0 = seeded(`${o.id}|${WEEK}`);
      const it = { o, b, lng: o.lng, lat: o.lat, x: 0, y: 0, dx: 0, dy: 0, ox: 0, oy: 0, phase: r0(), pulse: 0, pc: null, radar: 0, moving: false, hero: !!o.hero, sd: 0, sb: 0, inS: false };
      /* outside the radar, one rule: only what is from the last 24 hours. An animal hurt, dead or lost is an alarm for as long */
      it.flag = isFresh(o); it.alarm = isAlarm(o) && it.flag; it.fade = it.alarm ? 1 : ghostOf(o);
      items.push(it);
    }
    for (const it of items) {
      const o = it.o;
      if (o.kind === 'injured' && it.alarm) { it.pulse = 3; it.pc = C.red; }
      else if (o.kind === 'lost' && it.alarm) { it.pulse = 2; it.pc = C.red; it.radar = searchOf(o); }
      else if (o.arrived && now - o.arrived < 5 * 60e3) { it.pulse = 2; it.pc = C.red; }
    }
    /* the lives in extreme danger in the months ahead keep a slow orange ring */
    items.filter(it => !it.pulse && !it.o.hum && it.b.dz >= 4).sort((a, b) => (b.hero - a.hero) || ((b.o.rare || 0) - (a.o.rare || 0))).slice(0, 4).forEach(it => { it.pulse = 1; it.pc = C.orange; });
    for (const it of items) it.moving = !reduced() && (it.hero || (MOVING.has(it.b.tone) && !M.STILL.has(it.b.g)));
    const rank = it => (it.b.tone === 'hist' ? 0 : it.b.tone === 'cold' ? 1 : it.b.tone === 'flora' ? 1.5 : it.hero ? 7 : it.moving ? 4 : it.pulse || it.radar ? 6 : 3);
    items.sort((a, b) => rank(a) - rank(b));
    movers = items.filter(it => it.moving || it.pulse || it.radar);
    scanGeo(); if (reduced()) revealAll();
    dirty = true; fxDirty = true;
  }

  /* ───────── the radar ───────── */
  const inScan = (lat, lng) => haversine(S.scan.lat, S.scan.lng, lat, lng) <= S.scan.r;
  function scanGeo() {
    for (const it of items) { it.sd = haversine(S.scan.lat, S.scan.lng, it.lat, it.lng); it.sb = bearing(S.scan.lat, S.scan.lng, it.lat, it.lng); it.inS = it.sd <= S.scan.r; if (!it.inS) seen.delete(it.o.id); }
  }
  /* everything inside found at once: quietly, or arriving as the hand would show it */
  function revealAll(arrive) { const t = performance.now() - (arrive ? 0 : 2000); for (const it of items) if (it.inS && !seen.has(it.o.id)) seen.set(it.o.id, t); }
  const paused = () => !!S.mode || document.hidden;
  const running = () => !reduced() && !paused();
  /* the hand moves on; whatever lies between where it was and where it is now is found */
  function sweep(now) {
    const dt = lastSweep ? Math.min(0.12, (now - lastSweep) / 1000) : 0; lastSweep = now;
    if (reduced()) { revealAll(); return; }
    if (!running() || !dt) return;
    const b0 = sweepB, b1 = sweepB + 360 * dt / SC.turn; sweepB = b1 % 360;
    for (const it of items) {
      if (!it.inS || seen.has(it.o.id)) continue;
      let a = it.sb; if (a < b0) a += 360; if (a > b0 && a <= b1) { seen.set(it.o.id, now); if (!it.o.hist && it.b.tone !== 'cold') snd.blip(it.b.dz >= 3 ? 0.9 : it.b.tone === 'flora' ? 0.1 : 0.45); }
    }
  }
  let scanSave = 0;
  function setScan(lat, lng, r, save) {
    if (lat != null) { S.scan.lat = clamp(lat, B.s, B.n); S.scan.lng = clamp(lng, B.w, B.e); }
    const r0 = S.scan.r; if (r != null) S.scan.r = Math.round(clamp(r, SC.min, SC.max) / 10) * 10;
    scanGeo(); dirty = true; fxDirty = true; placeKnobs();
    /* a wider reach shows what it now holds at once, without waiting for the hand */
    if (S.scan.r > r0) revealAll(true);
    if (save) { clearTimeout(scanSave); scanSave = setTimeout(() => { prefs.scan = { lat: +S.scan.lat.toFixed(5), lng: +S.scan.lng.toFixed(5), r: S.scan.r }; savePrefs(); }, 250); }
  }
  /* a first visit: the radar starts where the most kinds of animals have been seen lately, near where it was pinned,
     so the first sweep has lives to find. Once per device; after that the radar stays where it is left */
  function findStart() {
    if (prefs.scan || prefs.found || S.mode || !S.obs.length) return false;
    prefs.found = true; savePrefs();
    const c0 = { lat: S.scan.lat, lng: S.scan.lng }, R = S.scan.r, F = SC.find || 1500;
    const pool = S.obs.filter(o => !o.ob && !o.hum && !isCold(o) && !['Plantae', 'Fungi'].includes(kindOf(o)) && haversine(c0.lat, c0.lng, o.lat, o.lng) <= F + R);
    const kinds = (lat, lng) => new Set(pool.filter(o => haversine(lat, lng, o.lat, o.lng) <= R).map(o => o.tx.id || o.tx.n)).size;
    let best = { n: kinds(c0.lat, c0.lng), lat: c0.lat, lng: c0.lng }; const n0 = best.n;
    for (const o of pool) { if (haversine(c0.lat, c0.lng, o.lat, o.lng) > F) continue; const n = kinds(o.lat, o.lng); if (n > best.n) best = { n, lat: o.lat, lng: o.lng }; }
    if (best.n < Math.max(4, n0 * 1.5)) return false;
    setScan(best.lat, best.lng, null, true);
    if (S.mapReady) map.easeTo({ center: [best.lng, best.lat], zoom: scanZoom(), offset: sheetOffset(), duration: reduced() ? 0 : 1100 });
    return true;
  }
  /* sound waits for a first touch: browsers keep a page quiet until then. At that touch the radar plays what it has
     found so far, in the order the hand passed it, and goes on playing as it sweeps */
  function replay() {
    if (!prefs.sound || S.mode === 'place') return 0;
    const found = items.filter(it => it.inS && seen.has(it.o.id) && shown(it) && !it.o.hist && it.b.tone !== 'cold').sort((a, b) => ((a.sb - sweepB + 360) % 360) - ((b.sb - sweepB + 360) % 360)).slice(0, 16);
    found.forEach((it, i) => setTimeout(() => snd.blip(it.b.dz >= 3 ? 0.9 : it.b.tone === 'flora' ? 0.1 : 0.45), 80 + i * 130));
    return found.length;
  }
  /* the radar glides to a new place: the hand keeps sweeping as it goes */
  let glide = 0;
  function moveScan(lat, lng, anim) {
    if (!inBox(lat, lng)) { tick(600); return; }
    cancelAnimationFrame(glide); const a = { lat: S.scan.lat, lng: S.scan.lng }; const t0 = performance.now(); const dur = anim && !reduced() ? 520 : 0;
    snd.tick(700); buzz(6);
    const step = now => { const k = dur ? Math.min(1, (now - t0) / dur) : 1; const e = 1 - Math.pow(1 - k, 3); setScan(a.lat + (lat - a.lat) * e, a.lng + (lng - a.lng) * e, null, k >= 1); if (k < 1) glide = requestAnimationFrame(step); else snd.tick(1100); };
    glide = requestAnimationFrame(step);
  }

  /* ───────── where everything is on the screen ───────── */
  const metresPerPixel = lat => metresPerPx(lat, map.getZoom());
  const ringOf = (lat, lng, r, n = 72) => { const pts = []; for (let i = 0; i < n; i++) { const [a, b] = dest(lat, lng, r, (i / n) * 360); const p = map.project([b, a]); pts.push([p.x, p.y]); } return pts; };
  const selected = () => (S.mode === 'ping' ? S.byId.get(S.sel) : S.mode === 'place' ? S.place : null);
  function project() {
    const d = sizeAt(); if (d !== curD) { curD = d; for (const it of items) it.b = badgeOf(it.o, d); }
    for (const it of items) { const p = map.project([it.lng, it.lat]); it.x = p.x; it.y = p.y; }
    for (const s of S.sensors) { const p = map.project([s.lng, s.lat]); s.x = p.x; s.y = p.y; }
    for (const f of S.fountains) { const p = map.project([f.lng, f.lat]); f.x = p.x; f.y = p.y; }
    ringPts = ringOf(S.scan.lat, S.scan.lng, S.scan.r);
    const o = selected(); cellPts = o ? ringOf(o.lat, o.lng, rangeOf(o)) : [];
    cluster(); spread(); if (hoverH) placeTag(); placeHandle(); placeKnobs(); strings.place();
  }
  /* marks that would sit on each other move apart, with room between, each staying close to where it was seen.
     On screen only: every print keeps the true coordinates */
  function spread() {
    const live = items.filter(it => !it.binned && (it.flag || it.inS || it.o.story) && it.b.tone !== 'hist' && !off(it.x, it.y, 80));
    if (live.length < 2) return; const G = Math.max(...live.map(it => it.b.d)) + 2;
    for (let pass = 0; pass < 3; pass++) {
      const grid = new Map(); const cellOf = it => `${Math.floor((it.x + it.ox) / G)},${Math.floor((it.y + it.oy) / G)}`;
      for (const it of live) { const k = cellOf(it); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(it); }
      for (const it of live) {
        const gx = Math.floor((it.x + it.ox) / G), gy = Math.floor((it.y + it.oy) / G);
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const ot of grid.get(`${gx + i},${gy + j}`) || []) {
          if (ot === it) continue; let dx = it.x + it.ox - ot.x - ot.ox, dy = it.y + it.oy - ot.y - ot.oy; const need = (it.b.d + ot.b.d) / 2 + 4, L = Math.hypot(dx, dy); if (L >= need) continue;
          if (L < 0.01) { const a = (it.phase - ot.phase) * TAU; dx = Math.cos(a); dy = Math.sin(a); } else { dx /= L; dy /= L; }
          /* each pair is met twice in a pass, so each meeting moves both a quarter of the overlap */
          const k = (need - L) / 4; it.ox += dx * k; it.oy += dy * k; ot.ox -= dx * k; ot.oy -= dy * k;
        }
      }
    }
    for (const it of live) { const m = Math.hypot(it.ox, it.oy), cap = it.b.d * 1.2; if (m > cap) { it.ox *= cap / m; it.oy *= cap / m; } it.x += it.ox; it.y += it.oy; it.ox = 0; it.oy = 0; }
  }
  const zoomQuiet = () => zoomNow() < 14.2;
  /* what the ground shows, item by item */
  function shown(it) {
    const o = it.o; if (S.mode === 'ping' && o.id === S.sel) return false;
    if (S.mode === 'ping' && strings.lifeNode(o.id)) return true;
    /* the example stories stand on the map always, as receipts; the stories page shows every story, wherever it is */
    if (o.story && (o.ex || (S.open && S.view === 1 && !S.mode))) return true;
    const found = it.inS && seen.has(o.id); const z = zoomNow();
    if (it.b.tone === 'hist') return found && z >= 14;
    if (it.b.tone === 'flora') return it.flag || (found && z >= PLANT_Z);   /* a plant from the last 24 hours shows anywhere, like any other */
    return it.flag || found;
  }
  /* density: at a distance, quiet records that share a place become one stack, showing the kind seen most */
  function cluster() {
    bins = []; if (!zoomQuiet()) { for (const it of items) it.binned = false; return; }
    const G = curD + 10, m = new Map();
    for (const it of items) {
      it.binned = false; if (!shown(it) || it.flag || it.pulse || it.b.tone === 'hist' || it.o.hum || (S.mode === 'ping' && strings.lifeNode(it.o.id))) continue;
      const k = `${Math.floor(it.x / G)},${Math.floor(it.y / G)}`; if (!m.has(k)) m.set(k, []); m.get(k).push(it);
    }
    for (const list of m.values()) {
      if (list.length < 3) continue; let x = 0, y = 0; const count = new Map();
      for (const it of list) { x += it.x; y += it.y; it.binned = true; const key = `${it.b.g}|${it.b.tone}`; count.set(key, (count.get(key) || 0) + 1); }
      const [g, tone] = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0].split('|');
      bins.push({ x: x / list.length, y: y / list.length, n: list.length, b: { g, tone: tone === 'cold' ? M.toneOf(g) : tone, d: curD + 2, n: 3 } });
    }
  }

  /* ───────── the ground layer: the radar's mask and ticks, the patches it holds, water and heat on a hot day ───────── */
  const off = (x, y, m = 50) => x < -m || y < -m || x > W + m || y > H + m;
  const poly = (ctx, pts) => { pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
  function frameLine(ctx) {
    const c = [[B.w, B.n], [B.e, B.n], [B.e, B.s], [B.w, B.s]].map(p => map.project(p));
    ctx.save(); ctx.beginPath(); c.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.setLineDash([1, 3]); ctx.stroke(); ctx.restore();
  }
  /* patches on the ground, each an uneven round, the same shape every time it is drawn */
  function blob(ctx, x, y, r, seed) {
    const n = 18, pt = i => { const a = (i / n) * TAU; const k = 1 + 0.15 * Math.sin(a * 3 + seed) + 0.07 * Math.sin(a * 5 + seed * 1.7); return [x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]; };
    const P = Array.from({ length: n }, (_, i) => pt(i)); const mid = i => { const a = P[i % n], b = P[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    const m0 = mid(n - 1); ctx.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const m = mid(i); ctx.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); } ctx.closePath();
  }
  function patch(ctx, blobs, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
    for (const [la, ln, r] of blobs) { const p = map.project([ln, la]); const rp = r / metresPerPixel(la); if (off(p.x, p.y, rp * 1.3)) continue; blob(ctx, p.x, p.y, rp, ((la * 7919 + ln * 104729) % TAU + TAU) % TAU); }
    ctx.fill(); ctx.restore();
  }
  function drawBase() {
    const ctx = bx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    frameLine(ctx);
    const cellOpen = S.mode === 'ping' && cellPts.length;
    /* nothing outside is darkened: an alert anywhere stays as clear as the ground. Inside, a faint light marks where the radar
       or an open cell looks */
    const lit = cellOpen ? cellPts : S.mode === 'tribe' || S.mode === 'partner' ? null : ringPts;
    if (lit) { ctx.save(); ctx.beginPath(); poly(ctx, lit); ctx.fillStyle = cellOpen ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)'; ctx.fill(); ctx.restore(); }
    /* the groups' ground shows only inside an open cell, while its strings are being made; a group chosen shows whole */
    if (cellOpen || S.mode === 'tribe') {
      ctx.save(); if (cellOpen) { ctx.beginPath(); poly(ctx, cellPts); ctx.clip(); }
      for (const t of S.tribes) { const sel = S.tribeSel === t.id; if (S.mode === 'tribe' && !sel) continue; patch(ctx, t.blobs, C.tribe[t.kind] || C.tribe.park, sel ? 0.5 : 0.22); }
      ctx.restore();
    }
    /* a hero chosen: the ground it is known from */
    const h = S.mode === 'ping' && S.byId.get(S.sel); if (h && h.hero) patch(ctx, h.home.map(([a, b]) => [a, b, 170]), C.kind[M.GROUP[glyphOf(h)]] || C.kind.other, 0.3);
    /* the radar's rim: a hairline with a tick every ten degrees, longer every thirty, a notch at north */
    if (ringPts.length) {
      const cp = map.project([S.scan.lng, S.scan.lat]);
      const quiet = cellOpen || S.mode === 'tribe'; ctx.save(); ctx.globalAlpha = quiet ? 0.35 : 1; ctx.beginPath(); poly(ctx, ringPts); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.1; if (quiet) ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath();
      for (let i = 0; i < 72; i += 2) { const [x, y] = ringPts[i]; const dx = cp.x - x, dy = cp.y - y, L = Math.hypot(dx, dy) || 1; const k = i % 6 === 0 ? 9 : 4; ctx.moveTo(x, y); ctx.lineTo(x + dx / L * k, y + dy / L * k); }
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 1.2; ctx.stroke();
      const [nx, ny] = ringPts[0]; const ux = (nx - cp.x) / (Math.hypot(nx - cp.x, ny - cp.y) || 1), uy = (ny - cp.y) / (Math.hypot(nx - cp.x, ny - cp.y) || 1);
      ctx.beginPath(); ctx.moveTo(nx + ux * 9, ny + uy * 9); ctx.lineTo(nx + ux * 2 - uy * 4, ny + uy * 2 + ux * 4); ctx.lineTo(nx + ux * 2 + uy * 4, ny + uy * 2 - ux * 4); ctx.closePath(); ctx.fillStyle = C.white; ctx.fill();
      ctx.restore();
    }
    /* on a hot day, inside the radar: drinking water, and the air temperature now */
    if ((S.wx.tmax || 0) >= HEAT.hot) {
      for (const f of S.fountains) { if (f.x == null || !inScan(f.lat, f.lng)) continue; ctx.save(); ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.restore(); M.icon(ctx, 'water', f.x, f.y, 10, C.cobalt); }
      for (const s of S.sensors) {
        if (s.x == null || !inScan(s.lat, s.lng)) continue; const txt = `${s.t.toFixed(1)}°`; ctx.save(); ctx.font = '500 10px "IBM Plex Mono", monospace'; const w = ctx.measureText(txt).width + 8;
        ctx.fillStyle = s.t >= HEAT.hot ? C.orange : C.white; ctx.fillRect(s.x - w / 2, s.y - 7, w, 14); ctx.fillStyle = C.navy; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, s.x, s.y + 0.5); ctx.restore();
      }
    }
  }

  /* ───────── the marks layer ───────── */
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const back = k => { k = clamp(k, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function drawItem(ctx, it, m, a = 1, k = 1) {
    const sp = M.badgeSprite(it.b, dpr); const x = it.x + (m ? m.dx : 0), y = it.y + (m ? m.dy : 0);
    if (m && m.thread) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(it.x, it.y - it.b.d * 1.7); ctx.lineTo(x, y - it.b.d / 2); ctx.stroke(); ctx.restore(); }
    ctx.globalAlpha = a;
    if ((m && (m.rot || m.sx !== 1)) || k !== 1) { ctx.save(); ctx.translate(x, y); if (m) { ctx.rotate(m.rot || 0); ctx.scale(m.sx || 1, 1); } ctx.scale(k, k); ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore(); }
    else ctx.drawImage(sp.cv, x - sp.size / 2, y - sp.size / 2, sp.size, sp.size);
    ctx.globalAlpha = 1;
  }
  /* the hand and its wake, drawn on the ground */
  function hand(ctx) {
    const c = map.project([S.scan.lng, S.scan.lat]); const at = b => { const [la, ln] = dest(S.scan.lat, S.scan.lng, S.scan.r, b); return map.project([ln, la]); };
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const b1 = sweepB - i * 3, b0 = b1 - 3; const p0 = at(b0), p1 = at((b0 + b1) / 2), p2 = at(b1);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath();
      ctx.fillStyle = `rgba(190,245,238,${(0.17 * Math.pow(1 - i / 14, 1.7)).toFixed(3)})`; ctx.fill();
    }
    const tip = at(sweepB); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(tip.x, tip.y); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }
  /* the partner places with a W.I.S.H. printer: always on the map, wherever the radar is, a little larger than a life */
  const printerSize = () => Math.round(clamp(24 + (zoomNow() - 13) * 4, 28, 40));
  function printers(ctx, t, still) { const d = printerSize(); for (const p of PARTNERS) { p._x = null; if (!p.printer || !prefs.printers) continue; const q = map.project([p.lng, p.lat]); p._x = q.x; p._y = q.y; if (off(q.x, q.y)) continue; const on = !!(PSTATE[p.id] || {}).ready; M.printer(ctx, q.x, q.y, d, still || !on ? 0 : t, on); } }
  /* a life's photograph, for the ground once its cell is open: its own, else one of its kind; loaded once, drawn when it has come */
  const PH = new Map();
  function photoOf(o, size) {
    const sub = subjectOf(o); const tx = sub && sub.tx && sub.tx.id ? TXI[sub.tx.id] : null;
    const src = o.photo || (sub && sub.ph && licOpen(sub.ph.l) ? photoURL(sub.ph.u, size) : '') || (tx && tx.ph ? photoURL(tx.ph.u, size) : ''); if (!src) return null;
    let e = PH.get(src); if (!e) { if (PH.size > 240) PH.clear(); e = { im: new Image(), ok: false }; e.im.decoding = 'async'; e.im.onload = () => { e.ok = true; fxDirty = true; }; e.im.src = src; PH.set(src, e); }
    return e.ok ? e.im : null;
  }
  function photoDisc(ctx, im, x, y, d, ring) {
    const r = d / 2; ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.clip();
    const s = Math.max(d / im.naturalWidth, d / im.naturalHeight); ctx.drawImage(im, x - im.naturalWidth * s / 2, y - im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = ring || C.white; ctx.lineWidth = 2; ctx.stroke();
  }
  /* the cell chosen: a point becomes a line, the line a boundary, and the boundary holds the knots */
  function selection(ctx, now) {
    const o = selected(); if (!o) return;
    const p0 = map.project([o.lng, o.lat]); const x = p0.x, y = p0.y;
    const e = reduced() ? 9999 : now - selT; const kA = ease(e / 200), kB = ease((e - 120) / 480);
    if (cellPts.length && kB > 0) {
      const n = Math.max(2, Math.round(cellPts.length * kB));
      ctx.save(); ctx.beginPath(); for (let i = 0; i <= n; i++) { const [px, py] = cellPts[i % cellPts.length]; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.strokeStyle = C.white; ctx.lineWidth = dragging ? 2.4 : 1.5; ctx.stroke(); ctx.restore();
    }
    if (S.mode === 'ping') strings.draw(ctx, now, e);
    const it = items.find(z => z.o === o); const b = it ? it.b : badgeOf(o);
    let big = Math.round((b.tone === 'hist' || b.tone === 'cold' ? Math.max(curD, 18) : Math.max(b.d, 20)) * (1 + 0.36 * kA));
    /* open, a life shows itself: its photograph, where there is one */
    const im = S.mode === 'ping' && !o.isTribe ? photoOf(o, 'medium') : null;
    if (im) { big = Math.round(Math.max(40, big * 1.5)); photoDisc(ctx, im, x, y, big, o.story ? C.cobalt : isAlarm(o) ? C.red : C.white); }
    else M.badge(ctx, { ...b, a: 1, d: big, tone: b.tone === 'hist' || b.tone === 'cold' ? M.toneOf(glyphOf(o)) : b.tone, g: b.g || (b.tone === 'hist' ? glyphOf(o) : null) }, x, y);
    if (S.mode === 'ping') strings.knotAt(ctx, 'pin', x, y, big / 2, now);
  }
  function drawFx(now) {
    const ctx = fx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const t = now / 1000, still = reduced(); const amp = clamp((zoomNow() - 12) / 3, 0.35, 1); const cellOpen = S.mode === 'ping';
    /* a lost animal's search area, when search areas are on */
    if (prefs.areas && S.mode !== 'tribe') for (const it of movers) { if (!it.radar || !shown(it)) continue; const R = it.radar / metresPerPixel(it.lat); if (off(it.x, it.y, R)) continue; M.radar(ctx, it.x, it.y, R, still ? 0 : t, it.phase); }
    if (!cellOpen && S.mode !== 'place' && !still) hand(ctx);
    strings.drawSaved(ctx, now);
    for (const b of bins) { const sp = M.badgeSprite(b.b, dpr); ctx.drawImage(sp.cv, b.x - sp.size / 2, b.y - sp.size / 2, sp.size, sp.size); }
    for (const it of items) {
      if (it.binned || !shown(it) || off(it.x, it.y)) continue;
      const node = cellOpen && strings.lifeNode(it.o.id); const a = it.alarm ? 1 : cellOpen && !node ? 0.45 : S.mode === 'tribe' || S.mode === 'partner' ? 0.55 : 1;
      if (it.pulse && !still && a === 1) M.pulse(ctx, { pulse: it.pulse, pc: it.pc, r: it.b.d / 2 - 2, f: 'fauna' }, it.x, it.y, t, it.phase);
      let m = null; if (it.moving && !still) { m = it.hero ? M.heroMotion(it.o.heroOf.move, t, it.phase, amp) : M.motion(it.b.g, t, it.phase, amp); it.dx = m.dx; it.dy = m.dy; } else { it.dx = 0; it.dy = 0; }
      /* found by the sweep: it arrives with a small overshoot and a ring that leaves it */
      const rv = seen.get(it.o.id); const age = rv != null && !it.flag ? now - rv : 9999; const k = (age < 420 ? back(age / 420) : 1) * (0.55 + 0.45 * it.fade);
      if (age < 700 && !still) { const q = age / 700; ctx.save(); ctx.globalAlpha = (1 - q) * 0.9; ctx.beginPath(); ctx.arc(it.x, it.y, it.b.d / 2 + 2 + q * 16, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore(); }
      /* inside an open cell the other lives show themselves too, as photographs */
      const close = zoomNow() >= PHOTO_Z && !it.o.hum && !it.o.story && it.b.tone !== 'hist';
      const im = (node || close) && !it.o.hum ? photoOf(it.o, 'square') : null;
      if (im) { ctx.save(); ctx.globalAlpha = node ? 1 : a * (0.35 + 0.65 * it.fade); photoDisc(ctx, im, it.x + (m ? m.dx : 0), it.y + (m ? m.dy : 0), Math.round(Math.max(node ? 18 : 16, it.b.d * 1.25) * k), it.alarm ? C.red : C.white); ctx.restore(); continue; }
      drawItem(ctx, it, m, a * (0.3 + 0.7 * it.fade), k);
    }
    printers(ctx, t, still);
    /* a song from the centre: each note lights where it was tied */
    for (const n of songFx) { const q = (now - n.at) / 700; if (q < 0 || q > 1) continue; const p = map.project([n.lng, n.lat]); ctx.save(); ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(p.x, p.y, 6 + q * 22, 0, TAU); ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
    selection(ctx, now);
    /* under the pointer a mark grows, quickly, into its photograph, a larger circle; without one, into its own mark, larger.
       The tag beside it carries the words only */
    if (hoverH && hoverH.kind === 'cell') { const it = items.find(z => z.o.id === hoverH.id); if (it && it.o.id !== S.sel && shown(it)) {
      const g = still ? 1 : ease((now - hoverAt) / 90); const D = Math.round(it.b.d + (HOVER_D - it.b.d) * g); const x = it.x + it.dx, y = it.y + it.dy; const im = !it.o.hum ? photoOf(it.o, 'small') : null;
      if (im) photoDisc(ctx, im, x, y, D, it.o.story ? C.cobalt : it.alarm ? C.red : C.white); else M.badge(ctx, { ...it.b, a: 1, d: Math.round(it.b.d + (30 - it.b.d) * g) }, x, y);
      if (g < 1) fxDirty = true; } }
    /* the record being placed breathes: one ring leaving it, until it is placed */
    if (S.mode === 'place' && S.place && !still) { const q = map.project([S.place.lng, S.place.lat]); const k = (now / 1400) % 1; ctx.save(); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(q.x, q.y, 14 + k * 26, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore(); }
    if (ghost) { const q = map.project([ghost.lng, ghost.lat]); const k = still ? 1 : back((now - ghost.t) / 300); M.badge(ctx, { tone: 'need', i: 'plus', d: Math.round(28 * k) || 1 }, q.x, q.y); }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || !bx) { lastSweep = 0; return; }
    if (dirty) { dirty = false; project(); drawBase(); fxDirty = true; }
    sweep(now);
    const selecting = !!selT && !reduced() && now - selT < 1400;
    const animating = !reduced() && (running() || movers.length > 0 || selecting || S.mode === 'place' || !!ghost || strings.busy(now) || songFx.some(n => now - n.at < 800));
    if (fxDirty || (animating && now - lastFx >= 1000 / 30 - 2)) { fxDirty = false; lastFx = now; drawFx(now); }
  }
  /* a touch on empty ground inside the radar offers a new record there */
  let ghost = null, ghostT = 0;
  function offer(ll) { ghost = ll ? { lat: ll.lat, lng: ll.lng, t: performance.now() } : null; clearTimeout(ghostT); if (ghost) ghostT = setTimeout(() => { ghost = null; fxDirty = true; }, 3500); fxDirty = true; }

  /* ───────── the radar's two handles: the centre moves it, the rim resizes it ───────── */
  function placeKnobs() {
    if (!S.mapReady || !knob) return; const hide = S.mode === 'ping' || S.mode === 'place';
    const c = map.project([S.scan.lng, S.scan.lat]); const [la, ln] = dest(S.scan.lat, S.scan.lng, S.scan.r, 90); const e = map.project([ln, la]);
    knob.hidden = hide || off(c.x, c.y, -6); ringK.hidden = hide || off(e.x, e.y, -6);
    knob.style.transform = `translate(${Math.round(c.x)}px, ${Math.round(c.y)}px)`; ringK.style.transform = `translate(${Math.round(e.x)}px, ${Math.round(e.y)}px)`;
    ringK.dataset.r = metres(S.scan.r);
  }
  const llAt = e => { const r = map.getContainer().getBoundingClientRect(); return map.unproject([e.clientX - r.left, e.clientY - r.top]); };
  let knobDrag = null;
  const grab = (el, kind) => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); knobDrag = { kind, id: e.pointerId, moved: false, x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); el.classList.add('on'); map.dragPan.disable(); snd.tick(1500); });
    el.addEventListener('pointermove', e => {
      if (!knobDrag || knobDrag.kind !== kind) return; if (!knobDrag.moved && Math.hypot(e.clientX - knobDrag.x, e.clientY - knobDrag.y) < 4) return; const ll = llAt(e); knobDrag.moved = true;
      if (kind === 'move') setScan(ll.lat, ll.lng, null, false);
      else { const r0 = S.scan.r; setScan(null, null, haversine(S.scan.lat, S.scan.lng, ll.lat, ll.lng), false); if (Math.abs(S.scan.r - r0) >= 50 || Math.floor(S.scan.r / 100) !== Math.floor(r0 / 100)) snd.tick(900 + S.scan.r / 2); }
    });
    const end = () => { if (!knobDrag || knobDrag.kind !== kind) return; const moved = knobDrag.moved; knobDrag = null; el.classList.remove('on'); map.dragPan.enable(); if (!moved && kind === 'move') { song(); return; } setScan(null, null, null, true); snd.tick(1100); buzz(6); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', e => {
      if (kind === 'move' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); song(); return; }
      const k = { ArrowUp: 0, ArrowRight: 90, ArrowDown: 180, ArrowLeft: 270 }[e.key]; if (k == null) return; e.preventDefault();
      if (kind === 'move') { const [la, ln] = dest(S.scan.lat, S.scan.lng, 60, k); setScan(la, ln, null, true); }
      else setScan(null, null, S.scan.r + (k === 0 || k === 90 ? 50 : -50), true);
      snd.tick(1200);
    });
  };
  if (knob) { grab(knob, 'move'); grab(ringK, 'size'); }

  /* ───────── a cell's own radius: drag the boundary; the knots inside change with it ───────── */
  function placeHandle() {
    const o = S.mode === 'ping' || S.mode === 'place' ? selected() : null;
    if (!o || !S.mapReady || o.ob || o.hist) { handle.hidden = true; return; }
    const [la, ln] = dest(o.lat, o.lng, rangeOf(o), 90); const p = map.project([ln, la]);
    if (off(p.x, p.y, -10)) { handle.hidden = true; return; }
    handle.hidden = false; handle.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`; handle.dataset.r = metres(rangeOf(o));
  }
  const commitRadius = debounce(() => { strings.refresh(); refreshRecord(); }, 140);
  handle.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); dragging = true; handle.setPointerCapture(e.pointerId); handle.classList.add('on'); map.dragPan.disable(); snd.tick(1500); });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return; const o = selected(); if (!o) return; const ll = llAt(e);
    const R = Math.round(clamp(haversine(o.lat, o.lng, ll.lat, ll.lng), CONFIG.RADIUS.min, CONFIG.RADIUS.max) / 10) * 10; const was = rangeOf(o);
    S.radius.set(o.id, R); if (Math.floor(R / 100) !== Math.floor(was / 100)) snd.tick(900 + R / 2); placeHandle(); commitRadius(); dirty = true;
  });
  const endDrag = () => { if (!dragging) return; dragging = false; handle.classList.remove('on'); map.dragPan.enable(); strings.refresh(); refreshRecord(); dirty = true; buzz(6); snd.tick(1100); };
  handle.addEventListener('pointerup', endDrag); handle.addEventListener('pointercancel', endDrag);
  handle.addEventListener('keydown', e => { const o = selected(); if (!o) return; const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 25 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -25 : 0; if (!d) return; e.preventDefault(); S.radius.set(o.id, clamp(rangeOf(o) + d, CONFIG.RADIUS.min, CONFIG.RADIUS.max)); placeHandle(); commitRadius(); dirty = true; });

  /* ───────── hit-testing where things are drawn, moving ones where they have moved to ───────── */
  function hit(x, y, peek) {
    const slack = coarse() ? 10 : 5; let best = null;
    const consider = (d, h) => { if (d <= slack && (!best || d < best.d)) best = { ...h, d }; };
    if (ghost) { const q = map.project([ghost.lng, ghost.lat]); if (Math.hypot(q.x - x, q.y - y) < 20) return { kind: 'new', lat: ghost.lat, lng: ghost.lng, d: 0 }; }
    if (S.mode === 'ping') { const n = strings.hit(x, y, slack); if (n) return n; }
    const pd = printerSize() / 2 + 4; for (const p of PARTNERS) if (p.printer && p._x != null && Math.abs(p._x - x) < pd && y - p._y < pd && p._y - y < pd + 6) return { kind: 'partner', id: p.id, d: 0 };
    for (const b of bins) if (Math.abs(b.x - x) < b.b.d / 2 + 4 && Math.abs(b.y - y) < b.b.d / 2 + 4) { if (!peek) { map.easeTo({ center: map.unproject([b.x, b.y]), zoom: map.getZoom() + 1.6, duration: reduced() ? 0 : 500 }); tick(1600); } return { kind: 'zoom', d: 0 }; }
    for (const it of items) { if (it.binned || !shown(it) || off(it.x, it.y)) continue; const d = Math.hypot(it.x + it.dx - x, it.y + it.dy - y) - it.b.d / 2; consider(d + (it.b.tone === 'hist' ? 3 : 0) + (S.mode === 'ping' ? 4 : 0), { kind: 'cell', id: it.o.id }); }
    if (!best && !peek && S.mode !== 'ping') { const ll = map.unproject([x, y]); const t = S.tribes.find(tr => (S.mode === 'tribe' || inScan(ll.lat, ll.lng)) && inTribe(tr, ll.lat, ll.lng)); if (t) return { kind: 'tribe', id: t.id, d: 0 }; }
    return best;
  }

  /* ───────── the tag: a name under the pointer, nothing more ───────── */
  function tagHTML(h) {
    if (h.kind === 'node') return strings.tagHTML(h.key);
    /* the words only: the photograph, or the printer, is already there on the map beside it */
    if (h.kind === 'partner') { const p = partnerOf(h.id); const st = PSTATE[h.id] || {}; return p ? `<span class="tx"><b>${esc(p.n)}</b><small>${st.ready ? 'ONLINE' : 'NOT YET ONLINE'}</small></span>` : ''; }
    const o = S.byId.get(h.id); if (!o) return ''; const sub = subjectOf(o);
    const voice = (sub.so && sub.so.u) || o.sound;
    const when = o.isEvent && o.start ? dayWord(o.start) : o.hist ? String(o.d).slice(0, 4) : o.at && (o.comm || o.user) ? fmtClock(o.at) : o.t ? fmtClock(o.t) : '';
    const w = !o.hum && !isCold(o) && !isAlarm(o) ? whenOf(o) : null; const dg = !o.hum && !isCold(o) ? degOf(o) : 0;
    /* why it shows outside the radar: it is new, and how new */
    const fresh = isFresh(o) && !o.isEvent ? `NEW · ${ago(stampOf(o))}` : '';
    return `<span class="tx"><b>${esc(nameOf(o))}</b>${fresh ? `<small class="new">${fresh}</small>` : when ? `<small>${esc(when)}</small>` : ''}${dg >= 2 ? `<small class="dg d${dg}">${DEG[dg]}${w ? ` · ${w.now ? 'NOW' : `${daysTo(w.start)} D`}` : ''}</small>` : ''}</span>${voice ? `<button type="button" class="play" data-u="${esc(voice)}" aria-label="Play the call">${icon(playing === voice && !audio.paused ? 'pause' : 'play')}</button>` : ''}${o.hero ? '' : `<button type="button" class="hide" data-hide="${esc(String(o.id))}" aria-label="${o.user ? 'Delete' : 'Hide'}" data-tip="${o.user ? 'Delete' : 'Hide from the map'}">${icon('hide', 'sm')}</button>`}`;
  }
  /* the tag sits beside what it names, level with it: beside the photograph a cell grows into, the printer, or the knot */
  function placeTag() {
    let x0, y0, r = 12;
    if (hoverH.kind === 'node') { const n = strings.pos(hoverH.key); if (!n) return; x0 = n.x; y0 = n.y; }
    else if (hoverH.kind === 'partner') { const p = partnerOf(hoverH.id); if (!p || p._x == null) return; x0 = p._x; y0 = p._y; r = printerSize() / 2 + 2; }
    else { const it = items.find(z => z.o.id === hoverH.id); const o = S.byId.get(hoverH.id); if (!o) return; if (it) { x0 = it.x + it.dx; y0 = it.y + it.dy; } else { const p = map.project([o.lng, o.lat]); x0 = p.x; y0 = p.y; } r = HOVER_D / 2; }
    const w = tagEl.offsetWidth || 180, h = tagEl.offsetHeight || 40;
    let x = x0 + r + 8, y = y0 - h / 2; if (x + w > W - 8) x = x0 - r - 8 - w; y = clamp(y, 8, Math.max(8, H - h - 8)); x = clamp(x, 8, Math.max(8, W - w - 8));
    tagEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
  let tagHide = 0;
  let hoverAt = 0;
  function hover(h) {
    if (h && hoverH && h.kind === hoverH.kind && h.id === hoverH.id && h.key === hoverH.key) return;
    fxDirty = true; hoverAt = performance.now();
    if (h) { clearTimeout(tagHide); const html = tagHTML(h); if (!html) return; hoverH = h; tagEl.innerHTML = html; tagEl.classList.toggle('alarm', h.kind === 'cell' && isAlarm(S.byId.get(h.id))); tagEl.classList.toggle('node', h.kind === 'node'); tagEl.hidden = false; placeTag(); return; }
    clearTimeout(tagHide); tagHide = setTimeout(() => { if (!tagEl.matches(':hover')) { tagEl.hidden = true; hoverH = null; fxDirty = true; } }, 260);
  }
  /* the tag under the pointer, rewritten when what it names has changed */
  function retag() { if (!hoverH || tagEl.hidden) return; const html = tagHTML(hoverH); if (!html) { tagEl.hidden = true; hoverH = null; fxDirty = true; return; } tagEl.innerHTML = html; placeTag(); }
  tagEl.addEventListener('mouseleave', () => hover(null));
  /* the right button on a name joins it, as it does on the knot itself */
  tagEl.addEventListener('contextmenu', e => { if (!hoverH) return; e.preventDefault(); const h = hoverH; if (h.kind === 'node') strings.join(h.key); else if (h.kind === 'cell') { if (S.mode === 'ping' && h.id !== S.sel) strings.join('x:' + h.id); else if (!S.mode) select(h.id); } });
  tagEl.addEventListener('click', e => {
    const b = e.target.closest('.play'); if (b) { e.stopPropagation(); play(b.dataset.u, b); return; }
    const hd = e.target.closest('[data-hide]'); if (hd) { e.stopPropagation(); const v = hd.dataset.hide; tagEl.hidden = true; hoverH = null; hideCell(/^\d+$/.test(v) ? +v : v); return; }
    if (!hoverH) return; const h = hoverH; tagEl.hidden = true; hoverH = null;
    if (h.kind === 'cell') { if (S.mode === 'ping' && h.id !== S.sel) strings.peekOut(h.id); else select(h.id); } else if (h.kind === 'node') strings.tap(h.key); else if (h.kind === 'partner') selectPartner(h.id);
  });
  function play(url, btn) {
    if (!prefs.sound) { toast('SOUND OFF'); return; }
    if (playing === url && !audio.paused) { audio.pause(); if (btn) btn.innerHTML = icon('play'); return; }
    playing = url; audio.src = url; audio.play().then(() => { if (btn) btn.innerHTML = icon('pause'); }).catch(() => toast('NO SOUND HERE'));
    audio.onended = () => { if (btn) btn.innerHTML = icon('play'); };
  }
  return {
    start, data, resize, moved: () => { dirty = true; }, redraw: () => { fxDirty = true; }, hover, retag, play, hit, badgeOf, offer, searchOf, blob, inScan, moveScan, setScan, findStart, replay,
    select: () => { selT = performance.now(); ghost = null; dirty = true; fxDirty = true; }, placeHandle,
    seen: () => seen, reveal: revealAll, song, get sweep() { return sweepB; }, set sweep(v) { sweepB = v; },
    get items() { return items; }, get bins() { return bins; }, get movers() { return movers; }, shown,
  };
})();
