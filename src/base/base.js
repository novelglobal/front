/* novel.global, the base.
   One question on the ground: what have you noticed? A photograph and a line, where and when it was, the few facts that matter
   about it now, the few things it connects to, and a receipt printed or queued at a solar thermal printer.
   Plain script for old phones: no map library, no framework, no optional chaining. Packs are added, never required:
   TERRAIN (imagery tiles), FIELD (base-db.json: the field list, the outlook, the case studies), the STUDIO (the full build). */
(function () {
'use strict';
var B = window.BASE || {};
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
var store = {
  get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
var MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
var M = new Date().getMonth();
var API = '/api';
var PACKS = store.get('da.base.packs', { terrain: !(navigator.connection && navigator.connection.saveData), field: true });
var NOTES = store.get('da.base.notes', []);           /* what was noticed here, newest first */
var OUTBOX = store.get('da.base.outbox', []);
var SHARED = [];                                       /* what others noticed, once approved */
var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
var when = function (t) { var d = new Date(t); return pad2(d.getDate()) + ' ' + MON[d.getMonth()] + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
var ll = function (lat, lng) { return Math.abs(lat).toFixed(4) + (lat < 0 ? 'S' : 'N') + ' ' + Math.abs(lng).toFixed(4) + (lng < 0 ? 'W' : 'E'); };
function toast(t) { var el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2600); }
function saveNotes() { while (NOTES.length > 40) NOTES.pop(); if (!store.set('da.base.notes', NOTES)) { NOTES.forEach(function (n, i) { if (i > 8) n.thumb = ''; }); store.set('da.base.notes', NOTES); } }

/* ───────── the glitch: a line arrives through the signs of the old phone network, then holds still ───────── */
var PHREAK = '0123456789*#ABCD/\\|=+:.';
function glitch(el, text, ms) {
  if (!el) return; ms = ms || 520;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
  var f = 0, frames = Math.max(1, Math.round(ms / 16.7));
  (function step() {
    var k = Math.min(1, ++f / frames); var n = Math.floor(text.length * k); var s = text.slice(0, n);
    for (var i = n; i < text.length; i++) s += text[i] === ' ' ? ' ' : PHREAK[(Math.random() * PHREAK.length) | 0];
    el.textContent = s; if (k < 1) requestAnimationFrame(step);
  })();
}
/* 2600 in the search: the tone that once opened a trunk line */
function whistle() {
  try { var A = window.AudioContext || window.webkitAudioContext; var a = new A(); var o = a.createOscillator(); var g = a.createGain(); o.frequency.value = 2600; g.gain.value = 0.06; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.45); } catch (e) { /* silent */ }
}

/* ───────── the ground: imagery tiles in greys, panned by hand. No WebGL ───────── */
var map = { z: 15, lat: B.centre ? B.centre[0] : -37.7690, lng: B.centre ? B.centre[1] : 144.9630, w: innerWidth, h: innerHeight, tiles: {} };
var TS = 256;
var wx = function (lng, z) { return (lng + 180) / 360 * TS * Math.pow(2, z); };
var wy = function (lat, z) { var s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TS * Math.pow(2, z); };
var ux = function (x, z) { return x / (TS * Math.pow(2, z)) * 360 - 180; };
var uy = function (y, z) { var n = Math.PI - 2 * Math.PI * y / (TS * Math.pow(2, z)); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };
function px(lat, lng) { return [wx(lng, map.z) - wx(map.lng, map.z) + map.w / 2, wy(lat, map.z) - wy(map.lat, map.z) + map.h / 2]; }
function at(x, y) { return { lat: uy(wy(map.lat, map.z) + y - map.h / 2, map.z), lng: ux(wx(map.lng, map.z) + x - map.w / 2, map.z) }; }
var tilesEl = $('#tiles'), netEl = $('#net'), terrain = $('#terrain');
var shown = function () { var c = document.body.classList; return c.contains('mapmode') || c.contains('half'); };
function drawTiles() {
  if (!PACKS.terrain || !B.imagery) { tilesEl.innerHTML = ''; map.tiles = {}; terrain.style.background = 'radial-gradient(circle, var(--rule) 1px, transparent 1.2px) 0 0/22px 22px'; return; }
  terrain.style.background = '';
  var z = map.z, cx = wx(map.lng, z), cy = wy(map.lat, z), n = Math.pow(2, z);
  var x0 = Math.floor((cx - map.w / 2) / TS), x1 = Math.floor((cx + map.w / 2) / TS), y0 = Math.floor((cy - map.h / 2) / TS), y1 = Math.floor((cy + map.h / 2) / TS);
  var keep = {};
  for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) {
    if (y < 0 || y >= n) continue; var xx = ((x % n) + n) % n; var k = z + '/' + xx + '/' + y; keep[k] = 1;
    var im = map.tiles[k];
    if (!im) { im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = B.imagery.replace('{z}', z).replace('{x}', xx).replace('{y}', y); im.onerror = function () { this.style.visibility = 'hidden'; }; map.tiles[k] = im; tilesEl.appendChild(im); }
    im.style.transform = 'translate(' + Math.round(x * TS - cx + map.w / 2) + 'px,' + Math.round(y * TS - cy + map.h / 2) + 'px)';
  }
  for (var key in map.tiles) if (!keep[key]) { map.tiles[key].remove(); delete map.tiles[key]; }
}
var frame = 0;
function render() { if (frame) return; frame = requestAnimationFrame(function () { frame = 0; drawTiles(); drawNet(); }); }
/* centred in what the sheet leaves open: above it on a phone, left of it on a wide screen */
function focusOn(lat, lng, z) {
  if (z) map.z = Math.max(11, Math.min(B.maxzoom || 19, z));
  var cx = wx(lng, map.z), cy = wy(lat, map.z);
  if (innerWidth >= 760) cx += 220; else cy += map.h * 0.3;
  map.lat = uy(cy, map.z); map.lng = ux(cx, map.z); render();
}
function moveTo(lat, lng, z) { map.lat = lat; map.lng = lng; if (z) map.z = Math.max(11, Math.min(B.maxzoom || 19, z)); render(); }
function zoomBy(d, x, y) {
  var z = Math.max(11, Math.min(B.maxzoom || 19, map.z + d)); if (z === map.z) return;
  var p = at(x == null ? map.w / 2 : x, y == null ? map.h / 2 : y);
  map.z = z; var q = px(p.lat, p.lng); var c = at(map.w / 2 + q[0] - (x == null ? map.w / 2 : x), map.h / 2 + q[1] - (y == null ? map.h / 2 : y)); map.lat = c.lat; map.lng = c.lng; render();
}
(function pan() {
  var pts = {}, start = null, moved = 0, pinch = 0;
  terrain.addEventListener('pointerdown', function (e) {
    pts[e.pointerId] = [e.clientX, e.clientY]; try { terrain.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
    var ids = Object.keys(pts); if (ids.length === 1) { start = { x: e.clientX, y: e.clientY, lat: map.lat, lng: map.lng }; moved = 0; terrain.classList.add('drag'); }
    if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  });
  terrain.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(pts);
    if (ids.length === 2 && pinch) { var a = pts[ids[0]], b = pts[ids[1]]; var d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d / pinch > 1.6) { zoomBy(1, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; } else if (d / pinch < 0.62) { zoomBy(-1, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; } moved = 99; return; }
    if (!start) return; var dx = e.clientX - start.x, dy = e.clientY - start.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    map.lat = uy(wy(start.lat, map.z) - dy, map.z); map.lng = ux(wx(start.lng, map.z) - dx, map.z); render();
  });
  var up = function (e) {
    var tapped = start && moved < 6 && Object.keys(pts).length === 1; delete pts[e.pointerId];
    if (!Object.keys(pts).length) { start = null; pinch = 0; terrain.classList.remove('drag'); }
    if (tapped && e.type === 'pointerup') onTap(e.clientX, e.clientY); else if (moved > 6 && net.live) moreLive();
  };
  terrain.addEventListener('pointerup', up); terrain.addEventListener('pointercancel', up);
  terrain.addEventListener('wheel', function (e) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY); }, { passive: false });
  terrain.addEventListener('dblclick', function (e) { zoomBy(1, e.clientX, e.clientY); });
})();
addEventListener('resize', function () { map.w = innerWidth; map.h = innerHeight; render(); });

/* ───────── the net: knots where things were noticed, lines where they connect, as a stick chart lays sticks between islands.
   Each knot trails a dotted line under it, the way a bark painting hangs its threads. Lines draw in; a new knot falls into place ───────── */
var net = { focus: null, links: [], all: false, fresh: null };
function svg(tag, a) { var el = document.createElementNS('http://www.w3.org/2000/svg', tag); for (var k in a) el.setAttribute(k, a[k]); return el; }
function arc(p, q, bend) { var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; var dx = q[0] - p[0], dy = q[1] - p[1]; var k = bend == null ? 0.18 : bend; return 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'Q' + (mx - dy * k).toFixed(1) + ' ' + (my + dx * k).toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }
/* ───────── the web of noticing. Nothing is tied until it is looked at. Every cell is a dot in the earth tone of its kind; each one
   opened is kept (WEB), and the web is built from them, every mark for a reason:
   - a trail stick from each cell opened to the next: the way attention went
   - a kin stick, bowed, between cells opened of the same life (in the order seen), or to the nearest of the same kind: a relation found
   - a lashing where three or more sticks meet: a story gathering
   - a jellyfish over three or more opened of one life: a gathering attended, its dome growing with each one
   - a swell through a collection's cells in the order they were seen: the shape of a set added, kept until taken off
   - the sightings revealed beside one's own noticing, tied to it: what is near it now
   New sticks draw themselves in; every mark says what it is when pointed at ───────── */
var TONE = { bird: '#C9A15A', parrot: '#C4643A', waterbird: '#8A9690', owl: '#7A5A3C', raptor: '#9A4E2C', macropod: '#B07B4F', possum: '#8B6B4E', flyingfox: '#6E4B3A', bat: '#5C4636', rodent: '#9C8669', fox: '#B5562B', cat: '#8E8172', dog: '#8E8172', rabbit: '#A89A86', lizard: '#8C8A4E', snake: '#6F6A3A', turtle: '#5E6B4A', frog: '#6E7F45', butterfly: '#D2B48C', moth: '#BFA98A', bee: '#D9A441', wasp: '#C08A2E', fly: '#9A8F7A', beetle: '#6B5038', bug: '#7D5F3B', spider: '#5B4A3F', plant: '#7D8B5A', fungus: '#B9A58C' };
var toneOf = function (n) { return TONE[gOf(n)] || '#A89A86'; };
var WEB = store.get('da.base.web', null); if (!WEB || !WEB.seq) WEB = { nodes: {}, seq: [], sets: [] };
var webFresh = {};
function saveWeb() { if (WEB.seq.length > 160) { WEB.seq = WEB.seq.slice(-160); var keep = {}; WEB.seq.forEach(function (id) { keep[id] = WEB.nodes[id]; }); WEB.sets.forEach(function (s) { (s.pts || []).forEach(function (p) { if (WEB.nodes[p.id]) keep[p.id] = WEB.nodes[p.id]; }); }); WEB.nodes = keep; } store.set('da.base.web', WEB); }
/* a cell opened: kept, and tied to the one opened before it */
function attend(n) {
  if (!n || !isFinite(n.lat) || !isFinite(n.lng)) return;
  WEB.nodes[n.id] = { id: n.id, at: n.at || Date.now(), lat: +n.lat, lng: +n.lng, cn: n.cn || '', sp: n.sp || '', g: gOf(n), mine: !!n.mine, say: n.say || '', thumb: n.thumb || n.photoURL || '' };
  var last = WEB.seq[WEB.seq.length - 1]; if (last === n.id) return;
  WEB.seq.push(n.id); if (last) webFresh[last + '>' + n.id] = Date.now(); saveWeb(); render();
}
var webSets = function () { return WEB.sets || []; };
function inSets(id) { return webSets().some(function (s) { return s.ids.indexOf(id) >= 0; }); }
/* what the web ties: [a, b, kind, why] by id, each pair once */
function webEdges() {
  var E = [], seenPair = {}, add = function (a, b, k, why) { if (!a || !b || a === b) return; var key = a < b ? a + '|' + b : b + '|' + a; if (seenPair[key]) return; seenPair[key] = 1; E.push([a, b, k, why]); };
  var N = WEB.nodes, q = WEB.seq;
  for (var i = 1; i < q.length; i++) if (N[q[i - 1]] && N[q[i]]) add(q[i - 1], q[i], 'trail', 'opened ' + nameOf(N[q[i - 1]]) + ', then ' + nameOf(N[q[i]]));
  var ids = Object.keys(N), byLife = {}; ids.forEach(function (id) { var n = N[id]; if (n.cn) (byLife[n.cn] = byLife[n.cn] || []).push(n); });
  Object.keys(byLife).forEach(function (k) { var l = byLife[k].sort(function (a, b) { return a.at - b.at; }); for (var j = 1; j < l.length; j++) add(l[j - 1].id, l[j].id, 'kin', 'both ' + k); });
  ids.forEach(function (id) { var a = N[id], best = null, bd = 1e9; ids.forEach(function (o) { var b = N[o]; if (o === id || b.g !== a.g || (a.cn && a.cn === b.cn)) return; var d = dist(a, b); if (d < bd) { bd = d; best = b; } }); if (best && bd < 4000) add(a.id, best.id, 'kind', 'both ' + lower(KINDS[a.g] || a.g) + ' · ' + far(Math.round(bd))); });
  return E;
}
function visible() {
  var l = net.all ? NOTES.concat(SHARED, net.live ? LIVE : []) : NOTES;
  if (net.all && webSets().length) l = l.filter(function (n) { return inSets(n.id) || WEB.nodes[n.id]; });
  return l;
}
var hits = { knots: [], sticks: [], jellies: [] };
var nameOf = function (n) { return n.cn || n.say || n.code || '·'; };
function drawNet() {
  while (netEl.firstChild) netEl.removeChild(netEl.firstChild); hits = { knots: [], sticks: [], jellies: [] }; if (!shown()) return;
  var onScreen = function (n) { if (!isFinite(n.lat) || !isFinite(n.lng)) return false; var p = px(n.lat, n.lng); return p[0] > -200 && p[1] > -200 && p[0] < map.w + 200 && p[1] < map.h + 200; };
  var list = visible().filter(onScreen), byId = {}; list.forEach(function (n) { byId[n.id] = n; });
  var bring = function (n) { if (n && isFinite(n.lat) && !byId[n.id]) { list.push(n); byId[n.id] = n; } };
  bring(net.focus); if (net.focus) net.links.forEach(bring);
  if (net.all) { Object.keys(WEB.nodes).forEach(function (id) { bring(WEB.nodes[id]); }); webSets().forEach(function (s) { (s.pts || []).forEach(bring); }); }
  if (!list.length) return;
  var g = svg('g', {}), P = function (n) { return px(n.lat, n.lng); }, now = Date.now(), degs = {}; netEl.appendChild(g);
  var stick = function (a, b, cls, bow, why) {
    var p = P(a), q = P(b), dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, o = cls === 'trail' ? 7 : 0;
    var p2 = [p[0] - dx / L * o, p[1] - dy / L * o], q2 = [q[0] + dx / L * o, q[1] + dy / L * o];
    var el = svg('path', { d: arc(p2, q2, bow), 'class': 'w ' + cls }), key = a.id + '>' + b.id, fresh = webFresh[key] || webFresh[b.id + '>' + a.id];
    if (fresh && now - fresh < 2500) { el.setAttribute('class', 'w ' + cls + ' draw'); el.style.setProperty('--len', Math.ceil(L + 2 * o)); }
    g.appendChild(el); hits.sticks.push({ a: p, b: q, na: a, nb: b, why: why }); degs[a.id] = (degs[a.id] || 0) + 1; degs[b.id] = (degs[b.id] || 0) + 1;
  };
  /* the sets: a swell through each one's cells, in the order seen */
  if (net.all) webSets().forEach(function (s) {
    var pts = (s.pts || []).filter(onScreen).sort(function (a, b) { return a.at - b.at; }).map(P); if (pts.length < 2) return;
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L');
    g.appendChild(svg('path', { d: d, 'class': 'w swell' })); for (var j = 1; j < pts.length; j++) hits.sticks.push({ a: pts[j - 1], b: pts[j], why: '≈ ' + s.t + ' · ' + s.ids.length });
  });
  /* the web: trail, kin and kind, from what was opened */
  if (net.all) webEdges().forEach(function (e) { var a = WEB.nodes[e[0]], b = WEB.nodes[e[1]]; if (a && b && (onScreen(a) || onScreen(b))) stick(a, b, e[2], e[2] === 'trail' ? 0 : e[2] === 'kin' ? 0.22 : 0.12, e[3]); });
  /* what is near one's own noticing now, tied to it */
  if (net.focus) net.links.forEach(function (o) { if (isFinite(o.lat)) stick(net.focus, o, 'near', 0.18, 'near ' + nameOf(net.focus) + ' now: ' + nameOf(o) + (o.d ? ' · ' + far(o.d) : '')); });
  /* the jellyfish: three or more opened of one life */
  if (net.all) {
    var byLife = {}; Object.keys(WEB.nodes).forEach(function (id) { var n = WEB.nodes[id]; if (n.cn && onScreen(n)) (byLife[n.cn] = byLife[n.cn] || []).push(n); });
    Object.keys(byLife).filter(function (k) { return byLife[k].length >= 3; }).sort(function (a, b) { return byLife[b].length - byLife[a].length; }).slice(0, 3).forEach(function (k) {
      var ns = byLife[k], pp = ns.map(P), xs = pp.map(function (p) { return p[0]; }), ys = pp.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), cx = (x0 + x1) / 2, rx = Math.max(18, Math.min(96, 10 + ns.length * 6)), ry = rx * 0.62, top = Math.max(60, Math.min.apply(null, ys) - 30 - ry);
      var jg = svg('g', { 'class': 'jelly' }); g.appendChild(jg); jg.style.setProperty('--tone', toneOf(ns[0]));
      jg.appendChild(svg('path', { 'class': 'dome', d: 'M' + (cx - rx) + ' ' + top + 'A' + rx + ' ' + ry + ' 0 0 1 ' + (cx + rx) + ' ' + top + 'Z' }));
      jg.appendChild(svg('path', { 'class': 'dome-dots', d: 'M' + (cx - rx * 0.7) + ' ' + (top - 4) + 'A' + rx * 0.7 + ' ' + ry * 0.62 + ' 0 0 1 ' + (cx + rx * 0.7) + ' ' + (top - 4) }));
      pp.forEach(function (p, q) { var sx = cx - rx * 0.8 + rx * 1.6 * (pp.length > 1 ? q / (pp.length - 1) : 0.5); jg.appendChild(svg('line', { x1: sx, y1: top + 2, x2: p[0], y2: p[1] - 5 })); });
      hits.jellies.push({ x: cx, y: top - ry / 2, r: rx, t: k, n: ns.length });
    });
  }
  /* the lashings: where three or more sticks meet */
  Object.keys(degs).forEach(function (id) { if (degs[id] < 3) return; var n = WEB.nodes[id] || byId[id]; if (!n) return; var p = P(n); g.appendChild(svg('rect', { x: p[0] - 4, y: p[1] - 4, width: 8, height: 8, 'class': 'lash', transform: 'rotate(45 ' + p[0] + ' ' + p[1] + ')' })); });
  /* the cells: a dot in the earth tone of its kind; opened, ringed; one's own, larger; the one open now, its name and a thread */
  list.forEach(function (n) {
    var p = P(n), me = net.focus && n.id === net.focus.id, seen = !!WEB.nodes[n.id], r = me ? 6 : n.mine ? 4.6 : seen ? 4 : n.live ? 2.8 : 3.4;
    var kk = svg('g', { 'class': me && net.fresh === n.id ? 'fall' : '' });
    if (me && n.mine) kk.appendChild(svg('line', { x1: p[0], y1: p[1] + r, x2: p[0], y2: p[1] + r + 24, 'class': 'd' }));
    if (n.icon) { var ic = svg('image', { x: p[0] - 12, y: p[1] - 12, width: 24, height: 24 }); ic.setAttributeNS('http://www.w3.org/1999/xlink', 'href', n.icon); ic.setAttribute('href', n.icon); kk.appendChild(ic); }
    else { var c = svg('circle', { cx: p[0], cy: p[1], r: r, 'class': 'cell' + (seen ? ' seen' : '') + (me ? ' me' : '') + (n.mine ? ' mine' : '') }); c.style.fill = toneOf(n); kk.appendChild(c); }
    if (me) { var t = svg('text', { x: p[0] + 10, y: p[1] - 8 }); t.textContent = nameOf(n).toUpperCase().slice(0, 22); g.appendChild(t); }
    g.appendChild(kk); hits.knots.push({ x: p[0], y: p[1], n: n });
  });
  if (net.fresh) setTimeout(function () { net.fresh = null; }, 2600);
}
var segD = function (p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
function hitAt(x, y) {
  var best = null, bd = 16; hits.knots.forEach(function (k) { var d = Math.hypot(k.x - x, k.y - y); if (d < bd) { bd = d; best = k; } }); if (best) return best;
  return null;
}
/* what the pointer is over, said small: whose knot and when; which two a stick ties and how far apart; what a jellyfish gathers */
var tipEl = $('#tip');
function hover(x, y) {
  var t = '', k = hitAt(x, y);
  if (k) { var n = k.n; t = (n.mine ? '● ' : n.live ? '· ' : '○ ') + nameOf(n) + (n.at ? ' · ' + ago(n.at) : '') + (n.d ? ' · ' + far(n.d) : ''); }
  else { var j = hits.jellies.filter(function (q) { return Math.hypot(q.x - x, q.y - y) < q.r * 0.8; })[0]; if (j) t = '◠ ' + j.n + ' × ' + j.t + ', opened';
    else { var s = hits.sticks.filter(function (q) { return segD([x, y], q.a, q.b) < 5; })[0]; if (s) t = s.why || (nameOf(s.na) + ' — ' + nameOf(s.nb)); } }
  if (!t) { tipEl.hidden = true; return; }
  tipEl.textContent = t; tipEl.hidden = false; tipEl.style.left = Math.min(x + 12, innerWidth - tipEl.offsetWidth - 6) + 'px'; tipEl.style.top = Math.max(6, y - 26) + 'px';
}
terrain.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' && !e.buttons) hover(e.clientX, e.clientY); });
terrain.addEventListener('pointerleave', function () { tipEl.hidden = true; });
/* the map, moved far enough, brings in what is about there */
var liveT = 0;
function moreLive() { clearTimeout(liveT); liveT = setTimeout(function () { if (!net.live) return; loadLive(map.lat, map.lng).then(function () { render(); }); }, 600); }
/* ───────── the chart, after the Marshall Islands stick charts: a frame of sticks that run on past their joins and are lashed where
   they cross; a straight stick for each connection, overshooting its knots; shells and beads strung in clusters where sticks meet;
   one long swell bent across; every stick with its shadow on the wall. One drawing for the map, the receipt and the saved art ───────── */
function chart(pts, pairs, seed, beadOk) {
  var s = (seed || 7) % 2147483646 + 1; var rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  var C = { sticks: [], beads: [], lash: [] }; if (!pts.length) return C;
  var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  if (x1 - x0 < 120) { var cx = (x0 + x1) / 2; x0 = cx - 60; x1 = cx + 60; } if (y1 - y0 < 90) { var cy = (y0 + y1) / 2; y0 = cy - 45; y1 = cy + 45; }
  var pad = Math.max(26, (x1 - x0) * 0.16), L = x0 - pad, R = x1 + pad, T = y0 - pad, Bt = y1 + pad, oh = function () { return 14 + rnd() * 26; };
  var H = [T, Bt]; var n = Bt - T > 180 ? 2 : 1; for (var i = 1; i <= n; i++) H.splice(i, 0, T + (Bt - T) * i / (n + 1) + (rnd() - 0.5) * 18);
  [L, R].forEach(function (x) { var dx = (rnd() - 0.5) * 8; C.sticks.push({ a: [x, T - oh()], b: [x + dx, Bt + oh()], bow: (rnd() - 0.5) * 6, w: 'frame' }); });
  H.forEach(function (y) { var dy = (rnd() - 0.5) * 6; C.sticks.push({ a: [L - oh(), y], b: [R + oh(), y + dy], bow: 2 + rnd() * 4, w: 'frame' }); C.lash.push([L, y], [R + (dy ? 0 : 0), y + dy]); });
  if (pts.length >= 3) C.sticks.push({ a: [L - oh(), T + (Bt - T) * 0.3], b: [R, Bt], bow: -(Bt - T) * 0.32, w: 'swell' });
  var ends = {}; var mark = function (k, d) { (ends[k] = ends[k] || []).push(d); };
  pairs.forEach(function (pr) {
    var a = pts[pr[0]], b = pts[pr[1]]; var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy); if (d < 3) return; var ux = dx / d, uy = dy / d, e = 10 + rnd() * 10;
    C.sticks.push({ a: [a[0] - ux * e, a[1] - uy * e], b: [b[0] + ux * e, b[1] + uy * e], bow: 0, w: 'link', fresh: pr[2] });
    mark(pr[0], [ux, uy]); mark(pr[1], [-ux, -uy]);
  });
  pts.forEach(function (p, k) {
    if (beadOk && !beadOk(k)) return;
    var dirs = ends[k] || [[1, 0]]; dirs.slice(0, 2).forEach(function (u) { var m = 2 + Math.floor(rnd() * 3); for (var j = 1; j <= m; j++) C.beads.push({ x: p[0] + u[0] * (5 + j * 6), y: p[1] + u[1] * (5 + j * 6), ang: Math.atan2(u[1], u[0]) * 180 / Math.PI }); });
  });
  return C;
}
function stickPath(st) { var a = st.a, b = st.b, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'Q' + (mx - dy / d * st.bow * 2).toFixed(1) + ' ' + (my + dx / d * st.bow * 2).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
function chartSVG(g, C) {
  var sh = svg('g', { 'class': 'shadow', transform: 'translate(0 9)' }); g.appendChild(sh);
  C.sticks.forEach(function (st) { sh.appendChild(svg('path', { d: stickPath(st) })); });
  C.sticks.forEach(function (st, i) {
    var p = svg('path', { d: stickPath(st), 'class': 'stick ' + st.w }); g.appendChild(p);
    if (st.fresh) { p.setAttribute('class', 'stick link draw'); p.style.setProperty('--len', Math.round(Math.hypot(st.b[0] - st.a[0], st.b[1] - st.a[1]) * 1.1)); p.style.animationDelay = (0.5 + i * 0.12) + 's'; }
  });
  C.lash.forEach(function (l) { g.appendChild(svg('rect', { x: l[0] - 2.5, y: l[1] - 2.5, width: 5, height: 5, 'class': 'lash', transform: 'rotate(45 ' + l[0] + ' ' + l[1] + ')' })); });
  C.beads.forEach(function (b) { g.appendChild(svg('ellipse', { cx: b.x, cy: b.y, rx: 3.1, ry: 2.2, 'class': 'bead', transform: 'rotate(' + b.ang.toFixed(0) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ')' })); });
}
/* the same on a canvas: ink is the sticks' colour, shade their shadow (none on a thermal receipt) */
function chartCanvas(x, C, ink, bead, shade, k) {
  k = k || 1; x.lineCap = 'round';
  var stroke = function (st) { var a = st.a, b = st.b, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; x.beginPath(); x.moveTo(a[0], a[1]); x.quadraticCurveTo(mx - dy / d * st.bow * 2, my + dx / d * st.bow * 2, b[0], b[1]); x.stroke(); };
  if (shade) { x.save(); x.translate(0, 12 * k); x.strokeStyle = shade; x.lineWidth = 3 * k; C.sticks.forEach(stroke); x.restore(); }
  x.strokeStyle = ink; C.sticks.forEach(function (st) { x.lineWidth = (st.w === 'link' ? 2.2 : 3) * k; stroke(st); });
  x.fillStyle = bead; C.lash.forEach(function (l) { x.save(); x.translate(l[0], l[1]); x.rotate(Math.PI / 4); x.fillRect(-3 * k, -3 * k, 6 * k, 6 * k); x.restore(); });
  C.beads.forEach(function (b) { x.save(); x.translate(b.x, b.y); x.rotate(b.ang * Math.PI / 180); x.beginPath(); x.ellipse(0, 0, 3.4 * k, 2.4 * k, 0, 0, 7); x.fill(); x.restore(); });
}
var seedOf = function (list) { var h = 0; list.forEach(function (n) { var t = String(n.id); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; }); return Math.abs(h) || 7; };
function kin(a, b) { return !!((a.sp && a.sp === b.sp) || (a.cn && a.cn === b.cn && dist(a, b) < 2500) || (a.issue && a.issue === b.issue && dist(a, b) < 3000)); }
function dist(a, b) { var R = 6371000, r = Math.PI / 180; var x = (b.lng - a.lng) * r * Math.cos((a.lat + b.lat) / 2 * r), y = (b.lat - a.lat) * r; return Math.sqrt(x * x + y * y) * R; }

/* ───────── the field pack: loaded once, when first needed, or never if switched off ───────── */
var DB = null, dbP = null;
function db() {
  if (!PACKS.field) return Promise.resolve(null);
  if (!dbP) dbP = fetch('base-db.json').then(function (r) { return r.json(); }).then(function (j) { DB = j; return j; }).catch(function () { dbP = null; return null; });
  return dbP;
}

/* ───────── the engine: what was said and tagged → the life, the need, the season, the few facts, the few connections.
   Narrow on purpose: El Niño touches everything, so it is said only when this life is in this month's window ───────── */
var ISSUES = [
  { k: 'young', t: 'YOUNG', re: /fledg|baby|babies|chick|nestling|juvenile|joey|\bpup|\byoung\b|on the ground|fell out|fallen from|nest\b/i, call: 'WILDLIFE', th: ['births'],
    say: 'Feathered and hopping? A fledgling: leave it, its parents feed it for weeks. Keep dogs, cats and people back. Bald, hurt or on a road: call.' },
  { k: 'hurt', t: 'INJURED', re: /injur|hurt|bleed|broken|wing down|limp|hit by|stunned|trapped|tangled|caught in|netting|fishing line|attacked/i, call: 'WILDLIFE', th: ['cats'],
    say: 'Cover it with a towel, lift it into a box, keep it dark and quiet, no food or water. Then call.' },
  { k: 'dead', t: 'DEAD', re: /\bdead\b|died|dying|carcass|roadkill|body of/i, call: 'DEAD',
    say: 'Do not touch a dead wild bird: report it (bird flu watch). A dead possum or kangaroo may carry a live young in its pouch: call.' },
  { k: 'heat', t: 'HEAT', re: /heat|\bhot\b|panting|collaps|dehydrat|\b4\d ?°|scorch/i, call: 'WILDLIFE', th: ['heat', 'nights'],
    say: 'Shallow water at several heights, in shade, with a stick to climb out. Never touch a flying-fox: call.' },
  { k: 'water', t: 'WATER', re: /dry pond|dried|drought|no water|polluted|oil on|scum|algae|creek.*(low|dry)|dead fish/i, call: 'WATER', th: ['drought'],
    say: 'Report polluted or dried-up waterways to Melbourne Water. Leave shallow water out in dry spells.' },
  { k: 'swoop', t: 'SWOOPING', re: /swoop|dive.?bomb|attacking (me|people|cyclists)/i, call: '',
    say: 'Only nesting birds swoop, for about six weeks. Detour, walk the bike, wear a hat; never throw anything.' },
  { k: 'snake', t: 'SNAKE', re: /snake/i, call: 'SNAKE',
    say: 'Stand still, then back away. Never try to catch or kill it. Keep dogs on a lead. A licensed catcher can move it.' },
  { k: 'litter', t: 'LITTER', re: /litter|rubbish|plastic|trash|balloon|bottle|wrapper|six.?pack/i, call: '', th: ['litter'],
    say: 'Lift it if it is safe. Cut any loop of string, line or plastic before it goes in the bin.' },
  { k: 'tree', t: 'TREES', re: /felled|chainsaw|cut(ting)? down|lopp|prun|removed|trees? (is |are |was )?(down|fell|coming down|being cut)|(branch|limb)(es|s)? (down|fell|fallen)/i, call: 'COUNCIL', th: ['heat'],
    say: 'Old trees with hollows are homes. Check for life before work starts, and ask the council what is planned.' },
  { k: 'light', t: 'LIGHT', re: /\blights?\b|floodl|glare|street ?lamp/i, call: '', th: ['light'],
    say: 'Lights off, or shielded and pointed down, after 10 pm: moths, bats and birds steer by the dark.' },
  { k: 'cats', t: 'CATS', re: /\bcats?\b|kitten|\bdogs?\b|off.?lead|preyed|predat/i, call: '', th: ['cats'],
    say: 'Keep cats in from dusk to dawn, dogs on a lead near nests and burrows.' },
  { k: 'poison', t: 'POISON', re: /spray|poison|bait|pesticide|herbicide|glyphosate|rat ?sack/i, call: '', th: ['poison'],
    say: 'Rat baits kill the owls that eat the rats: snap traps instead. Ask for footpaths to go spray-free.' },
];
var CALLS = { WILDLIFE: 'WILDLIFE VICTORIA', DEAD: 'SICK OR DEAD WILD BIRDS', SNAKE: 'DEECA', EMERGENCY: 'EMERGENCY' };
function contact(label) { var c = (B.contacts || []).filter(function (x) { return x[1].indexOf(label) === 0; })[0]; return c ? { n: c[0], label: c[1], tel: c[2] } : null; }
function callOf(code) {
  if (code === 'WATER') return { n: '131 722', label: 'MELBOURNE WATER', tel: 'tel:131722' };
  if (code === 'COUNCIL') return null;
  return CALLS[code] ? contact(CALLS[code]) : null;
}
var GROUPS = { parrot: /parrot|cockatoo|lorikeet|rosella|galah|corella/, waterbird: /\bduck|swan|heron|ibis|cormorant|waterbird|coot|moorhen|grebe|egret/, owl: /\bowl|frogmouth/,
  raptor: /hawk|eagle|falcon|kite\b|raptor|goshawk/, flyingfox: /flying.?fox|fruit bat|bat camp/, bat: /\bbat\b|microbat/, possum: /possum/, macropod: /kangaroo|wallaby/,
  frog: /frog|tadpole/, snake: /snake/, lizard: /lizard|skink|blue.?tongue|gecko|dragon/, turtle: /turtle|tortoise/, bee: /\bbees?\b|swarm|hive/, butterfly: /butterfl|caterpillar/,
  moth: /\bmoth/, spider: /spider/, dragonfly: /dragonfl|damselfl/, bird: /\bbirds?\b|chick|fledg|nestling|magpie|raven|crow|wren|honeyeater|wattlebird|myna|pigeon|dove|sparrow|blackbird|swallow/ };
/* the lives most often met here: the first guess when a name fits several */
var COMMON = ['rainbow-lorikeet', 'aus-magpie', 'noisy-miner', 'little-raven', 'common-myna', 'brushtail', 'ringtail', 'ghff', 'sc-cockatoo', 'black-duck', 'white-ibis', 'little-wattlebird',
  'red-wattlebird', 'tawny-frogmouth', 'welcome-swallow', 'blue-tongue', 'garden-skink', 'tiger-snake', 'eastern-froglet', 'european-honey-bee', 'cabbage-white', 'huntsman'];
var GENERIC = /^(common|australian|eastern|little|great|lesser|southern|northern|red|white|black|grey|gray|blue|brown|spotted|striped|the|and|of|new|holland|garden)$/;
var lower = function (s) { return String(s || '').toLowerCase().replace(/[-–]/g, ' '); };
function months(str, ch) {
  /* the months a field string marks with ch, as one run: JUN–JAN */
  if (!str) return ''; var on = []; for (var i = 0; i < 12; i++) on.push(str[i] === ch);
  if (on.every(Boolean)) return 'ALL YEAR'; if (!on.some(Boolean)) return '';
  var s = 0; for (var i2 = 0; i2 < 12; i2++) if (on[i2] && !on[(i2 + 11) % 12]) { s = i2; break; }
  var e = s; while (on[(e + 1) % 12] && (e + 1) % 12 !== s) e = (e + 1) % 12; return s === e ? MON[s] : MON[s] + '–' + MON[e];
}
function outlookNow() {
  var O = DB && DB.outlook; if (!O || !O.start) return null; var d = new Date(); var i = (d.getFullYear() - O.start[0]) * 12 + d.getMonth() - O.start[1];
  if (i < 0 || i > 11) return null; var w = (O.windows || []).filter(function (x) { return x.a <= x.b ? M >= x.a && M <= x.b : M >= x.a || M <= x.b; })[0];
  return { say: O.say ? O.say[O.h[i]] : '', nino: O.nino ? O.nino[i] : '', win: w || null };
}
function guess(text) {
  var t = ' ' + lower(text) + ' '; var out = [];
  var group = null; for (var g in GROUPS) if (GROUPS[g].test(t)) { group = g; break; }
  (DB ? DB.field : []).forEach(function (f) {
    var cn = lower(f.cn).replace(/\(.*?\)/g, '').trim(), sc = 0; var words = cn.replace(/[^a-z ]/g, '').split(/\s+/).filter(Boolean); var last = words[words.length - 1] || '-';
    if (t.indexOf(' ' + cn + ' ') >= 0 || t.indexOf(' ' + cn + 's ') >= 0) sc += 20 + cn.length / 10;
    else if (new RegExp('\\b' + last + 'e?s?\\b').test(t)) sc += 8;
    words.slice(0, -1).forEach(function (w) { if (w.length > 3 && !GENERIC.test(w) && new RegExp('\\b' + w + '\\b').test(t)) sc += 3; });
    if (f.n && t.indexOf(lower(f.n)) >= 0) sc += 25;
    if (!sc) return;
    if (group && f.g === group) sc += 1;
    if (f.act && f.act[M] === 'A') sc += 0.4; if (f.st === 'N') sc += 0.2; if (COMMON.indexOf(f.id) >= 0) sc += 0.6;
    out.push({ f: f, sc: sc });
  });
  out.sort(function (a, b) { return b.sc - a.sc; });
  var top = out.filter(function (o) { return o.sc >= 8; }).slice(0, 3).map(function (o) { return o.f; });
  return { sp: top[0] || null, alts: top.slice(1), group: top[0] ? top[0].g : group };
}
function issueOf(text, tags) {
  var t = text + ' ' + (tags || []).join(' ');
  for (var i = 0; i < ISSUES.length; i++) if (tags && tags.indexOf(ISSUES[i].t) >= 0) return ISSUES[i];
  for (var j = 0; j < ISSUES.length; j++) if (ISSUES[j].re.test(t)) return ISSUES[j];
  return null;
}
function related(sp, group, issue) {
  if (!DB) return [];
  var re = issue && issue.k === 'young' ? /fledg|young|chick|ground|pups?\b|juvenile/i : issue ? issue.re : null;
  var out = [];
  DB.field.forEach(function (f) {
    if (sp && f.id === sp.id) return; var sc = 0; var txt = [f.note, f.event, f.aware, f.help].join(' ');
    if (group && f.g === group) sc += 3; else if (group && (group === 'parrot' || group === 'bird' || group === 'owl') && (f.g === 'bird' || f.g === 'parrot' || f.g === 'owl')) sc += 1.5;
    if (re && re.test(txt)) sc += 2;
    if (issue && issue.k === 'young' && f.brd && f.brd[M] === 'B') sc += 1.5;
    if (issue && issue.k === 'heat' && f.heat >= 3) sc += 1.5;
    if (f.act && f.act[M] === 'A') sc += 0.5;
    if (sc >= 4) out.push({ f: f, sc: sc });
  });
  out.sort(function (a, b) { return b.sc - a.sc; });
  return out.slice(0, 3).map(function (o) { return o.f; });
}
function caseOf(group, issue) {
  if (!DB || !DB.briefs) return null; var best = null, bs = 0;
  DB.briefs.forEach(function (b) {
    var sc = 0; if (group && b.g && b.g.indexOf(group) >= 0) sc += 2; else if (b.g && b.g.indexOf('any') >= 0) sc += 0.5;
    if (issue && issue.th && b.dz && issue.th.some(function (d) { return b.dz.indexOf(d) >= 0; })) sc += 3;
    if (b.m && b.m.indexOf(M) >= 0) sc += 1;
    if (sc > bs) { bs = sc; best = b; }
  });
  return bs >= 4 ? best : null;
}
/* the reading: three lines at most, who to call, and up to three connections (lives, or one case that worked elsewhere) */
function read(n) {
  var text = (n.say || '') + ' ' + (n.tags || []).join(' ');
  var g = n.spId && DB ? { sp: DB.field.filter(function (f) { return f.id === n.spId; })[0] || null, alts: [], group: null } : guess(text);
  if (g.sp && !g.group) g.group = g.sp.g;
  var issue = issueOf(text, n.tags); var sp = g.sp;
  var lines = [];
  if (issue) lines.push({ t: issue.say, alert: true });
  if (sp) {
    var spec = issue && issue.k === 'young' ? (/fledg|ground|young/i.test(sp.note || '') ? sp.note : sp.harm || sp.help) : issue && issue.k === 'heat' ? (sp.help || sp.aware) : issue ? (sp.help || sp.harm) : (sp.aware || sp.help);
    if (spec) lines.push({ t: spec, s: sp.cn.toUpperCase() });
  }
  var season = '';
  if (sp && sp.brd && sp.brd[M] === 'B') season = 'BREEDING ' + months(sp.brd, 'B') + ': young are about now.';
  else if (sp && sp.event) season = sp.event + '.';
  var o = outlookNow(); var grp = g.group;
  if (o && o.win && grp && o.win.g.indexOf(grp) >= 0) season += (season ? ' ' : '') + 'El Niño, ' + o.win.w.toLowerCase() + ': ' + o.win.why;
  if (season) lines.push({ t: season, s: 'NOW' });
  /* today's heat, for a life that suffers in it: said only when the day is hot */
  var hot = !!(n.wx && n.wx.max >= 35 && sp && sp.heat >= 2);
  if (hot) lines.splice(issue ? 1 : 0, 0, { t: Math.round(n.wx.max) + '° today. ' + (sp.help || 'Water out, in shade.'), alert: true });
  if (!lines.length && !DB && PACKS.field) lines.push({ t: '· · ·', s: '' });
  var call = issue ? callOf(issue.call) : sp && sp.call === 'wildlife' ? contact('WILDLIFE VICTORIA') : sp && sp.call === 'snake' ? contact('DEECA') : null;
  var rel = related(sp, grp, issue).map(function (f) { return { id: f.id, label: f.cn, sub: f.brd && f.brd[M] === 'B' ? 'BREEDING NOW' : f.g.toUpperCase(), f: f }; });
  var cs = caseOf(grp, issue); if (cs) { if (rel.length >= 3) rel.pop(); rel.push({ id: cs.id, label: cs.t, sub: (cs.city || cs.after || '') + (cs.yr ? ' ' + cs.yr : ''), brief: cs }); }
  var near = NOTES.concat(SHARED).filter(function (x) { return x.id !== n.id && ((sp && x.sp === sp.id) || (issue && x.issue === issue.k && dist(x, n) < 3000)); }).slice(0, 3);
  return { sp: sp, alts: g.alts, group: grp, issue: issue, hot: hot, lines: lines.slice(0, 3), call: call, rel: rel, near: near };
}

/* ───────── the sheet: everything opens here. Its head is a glyph and a close; no titles ───────── */
var sheet = $('#sheet'), dock = $('#dock');
function open(html, half, cls) {
  sheet.innerHTML = html; sheet.hidden = false; document.body.classList.remove('sheetmin'); sheet.dataset.k = ''; sheet.className = (half ? 'half ' : '') + (cls || ''); sheet.scrollTop = 0;
  document.body.classList.add('away'); document.body.classList.toggle('half', !!half); document.body.classList.toggle('wide', /\bwide\b/.test(cls || '')); dock.hidden = false; render();
  var x = $('.x', sheet); if (x) x.addEventListener('click', close);
}
function close() {
  sheet.hidden = true; sheet.innerHTML = ''; ['away', 'half', 'wide', 'sheetmin'].forEach(function (c) { document.body.classList.remove(c); }); net.live = document.body.classList.contains('mapmode'); if (radar.on) radarOn(false);
  net.all = document.body.classList.contains('mapmode'); net.focus = null; net.links = []; net.only = null;
  if (location.hash) history.replaceState(null, '', location.pathname + location.search); render();
}
var glyph = function (id) { return '<svg class="gi" aria-hidden="true"><use href="#g-' + id + '"/></svg>'; };
var head = function (g, extra) { return '<div class="hd">' + (g ? '<span class="hg">' + glyph(g) + '</span>' : '') + (extra || '') + '<button class="x" aria-label="Close" title="Close">×</button></div>'; };
/* ───────── noticing: the photograph, where and when, a line ───────── */
function exif(buf) {
  /* the few things a JPEG says about itself: where (GPS) and when (DateTimeOriginal) */
  try {
    var v = new DataView(buf); if (v.getUint16(0) !== 0xFFD8) return {};
    var o = 2; while (o < v.byteLength - 4) {
      var mk = v.getUint16(o), len = v.getUint16(o + 2);
      if (mk === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) return tiff(v, o + 10);
      if ((mk & 0xFF00) !== 0xFF00) break; o += 2 + len;
    }
  } catch (e) { /* not readable */ }
  return {};
}
function tiff(v, t) {
  var le = v.getUint16(t) === 0x4949; var u16 = function (p) { return v.getUint16(p, le); }, u32 = function (p) { return v.getUint32(p, le); };
  var ifd = function (p) { var n = u16(p), tags = {}; for (var i = 0; i < n; i++) { var e = p + 2 + i * 12; tags[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 }; } return tags; };
  var val = function (tg) { return tg.count * ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 }[tg.type] || 1) > 4 ? t + u32(tg.at) : tg.at; };
  var rat3 = function (tg) { var p = val(tg); var r = function (i) { return u32(p + i * 8) / (u32(p + i * 8 + 4) || 1); }; return r(0) + r(1) / 60 + r(2) / 3600; };
  var str = function (tg) { var p = val(tg), s = ''; for (var i = 0; i < tg.count - 1; i++) s += String.fromCharCode(v.getUint8(p + i)); return s; };
  var out = {}; var i0 = ifd(t + u32(t + 4));
  if (i0[0x8769]) { var ex = ifd(t + u32(i0[0x8769].at)); if (ex[0x9003]) { var m = str(ex[0x9003]).match(/(\d+):(\d+):(\d+) (\d+):(\d+)/); if (m) out.t = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]).getTime(); } }
  if (i0[0x8825]) { var gp = ifd(t + u32(i0[0x8825].at)); if (gp[2] && gp[4]) { out.lat = rat3(gp[2]) * (gp[1] && str(gp[1]) === 'S' ? -1 : 1); out.lng = rat3(gp[4]) * (gp[3] && str(gp[3]) === 'W' ? -1 : 1); if (!isFinite(out.lat) || (!out.lat && !out.lng)) { delete out.lat; delete out.lng; } } }
  return out;
}
function loadImg(src) { return new Promise(function (res, rej) { var im = new Image(), t = setTimeout(function () { rej(new Error('slow')); }, 12000); im.onload = function () { clearTimeout(t); res(im); }; im.onerror = function () { clearTimeout(t); rej(new Error('image')); }; im.src = src; }); }
function shrink(im, N, q) { var w0 = im.naturalWidth || im.width, h0 = im.naturalHeight || im.height, k = Math.min(1, N / Math.max(w0, h0)); var c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q); }
var cur = null;    /* the noticing being made */
var PHOTOS = {};   /* full photographs, this visit only: what is kept is the small one */
/* a photograph in: its own GPS and time read first; the picture by any means the browser has (an image, a bitmap); if none can
   read it, the noticing still goes on, without its picture, rather than nothing happening */
function onShot(file) {
  if (!file) return; document.body.classList.add('busy');
  var url = URL.createObjectURL(file);
  var exP = new Promise(function (res) { try { var fr = new FileReader(); fr.onload = function () { res(exif(fr.result)); }; fr.onerror = function () { res({}); }; fr.readAsArrayBuffer(file.slice(0, 256 * 1024)); } catch (e) { res({}); } });
  /* what the small reader cannot read (HEIC, a photograph passed through an app), exifr reads; never longer than three seconds */
  exP = exP.then(function (ex) { if (ex && ex.lat != null && ex.t) return ex; return Promise.race([lib('exifr', function () { return window.exifr; }).then(function (ok) {
    if (!ok) return ex || {}; return window.exifr.parse(file, { gps: true, pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude'] }).then(function (o) { o = o || {}; var t = o.DateTimeOriginal || o.CreateDate; return { lat: isFinite(o.latitude) ? o.latitude : (ex || {}).lat, lng: isFinite(o.longitude) ? o.longitude : (ex || {}).lng, t: t ? +new Date(t) : (ex || {}).t }; }).catch(function () { return ex || {}; });
  }), new Promise(function (res) { setTimeout(function () { res(ex || {}); }, 3000); })]); });
  var imP = loadImg(url).catch(function () {
    return window.createImageBitmap ? createImageBitmap(file).then(function (bm) { var c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0); return c; }) : Promise.reject();
  }).catch(function () { return null; });
  Promise.all([exP, imP]).then(function (got) {
    var ex = got[0] || {}, im = got[1], photo = '', thumb = '';
    if (im) { try { photo = shrink(im, 900, 0.78); if (photo.length > 400e3) photo = shrink(im, 640, 0.7); thumb = shrink(im, 220, 0.7); } catch (e) { photo = thumb = ''; } }
    cur = { id: 'n' + Date.now().toString(36), at: ex.t || Date.now(), photo: photo, thumb: thumb, say: '', tags: [], mine: true };
    if (ex.lat != null) { cur.lat = ex.lat; cur.lng = ex.lng; cur.src = 'PHOTO'; } else { cur.lat = map.lat; cur.lng = map.lng; cur.src = 'MAP'; locate(); }
    document.body.classList.remove('busy'); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); db(); stepW();
  });
}
/* where: the photograph's own GPS first; else the phone is asked; else a touch on the map */
function locate(force) {
  var b = $('#n-loc'); if (!navigator.geolocation) { if (b) b.classList.add('no'); return; }
  if (b) b.classList.add('wait');
  navigator.geolocation.getCurrentPosition(function (p) {
    if (!cur || (cur.src === 'TAP' && !force)) return; cur.lat = p.coords.latitude; cur.lng = p.coords.longitude; cur.src = 'HERE'; focusOn(cur.lat, cur.lng, 17); whereLine(); reading();
  }, function () { var bb = $('#n-loc'); if (bb) { bb.classList.remove('wait'); bb.classList.add('no'); } whereLine(); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}
function whereLine() {
  var el = $('#n-where'); if (!el || !cur) return; el.textContent = when(cur.at) + ' · ' + ll(cur.lat, cur.lng); el.className = cur.src === 'MAP' ? 'blink' : '';
  var b = $('#n-loc'); if (b) { b.classList.remove('wait'); b.classList.toggle('on', cur.src === 'HERE' || cur.src === 'PHOTO'); }
}
function onTap(x, y) {
  var c = document.body.classList;
  if (cur && !sheet.hidden && $('#n-where')) { var p = at(x, y); cur.lat = p.lat; cur.lng = p.lng; cur.src = 'TAP'; whereLine(); net.focus = cur; net.links = []; render(); reading(); return; }
  if (!c.contains('mapmode') && !c.contains('half')) return;
  var h = hitAt(x, y);
  if (h && h.n) { if (SEQ.rec && placeNote(h.n)) { lit(h.n); return; } peek(h.n); return; }
  /* a stick or a jellyfish touched: what it ties, said for a moment */
  hover(x, y); if (!tipEl.hidden) { clearTimeout(tipEl.__t); tipEl.__t = setTimeout(function () { tipEl.hidden = true; }, 2600); return; }
  if (!peekEl.hidden) { peek(null); return; }
  if (c.contains('mapmode') && sheet.hidden) { var g = at(x, y); placeAt(g.lat, g.lng); }
}
/* ───────── where it is, and in what weather: the suburb, the nearest named place or water, the suburb's canopy, today's heat,
   El Niño now. These come with the noticing as data; each can be left off ───────── */
var SUBURBS = [['Brunswick', -37.767, 144.961], ['Brunswick East', -37.771, 144.978], ['Brunswick West', -37.765, 144.944], ['Coburg', -37.744, 144.966], ['Carlton', -37.800, 144.967],
  ['Carlton North', -37.787, 144.971], ['Princes Hill', -37.783, 144.966], ['Parkville', -37.784, 144.951], ['Fitzroy', -37.799, 144.978], ['Fitzroy North', -37.783, 144.985], ['Collingwood', -37.802, 144.988],
  ['Clifton Hill', -37.789, 144.995], ['Northcote', -37.770, 145.000], ['North Melbourne', -37.799, 144.944], ['West Melbourne', -37.807, 144.940], ['Kensington', -37.794, 144.927], ['Flemington', -37.788, 144.930],
  ['Melbourne', -37.814, 144.963], ['East Melbourne', -37.813, 144.985], ['Docklands', -37.817, 144.946], ['Southbank', -37.825, 144.964]];
function nearest(list, lat, lng, max) { var best = null, bd = max; (list || []).forEach(function (p) { var d = dist({ lat: lat, lng: lng }, { lat: p[1], lng: p[2] }); if (d < bd) { bd = d; best = [p[0], d]; } }); return best; }
var WX = {};
function weather(lat, lng) {
  var k = lat.toFixed(2) + ',' + lng.toFixed(2); if (WX[k]) return WX[k];
  WX[k] = fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(3) + '&longitude=' + lng.toFixed(3) + '&daily=temperature_2m_max&timezone=Australia%2FMelbourne&forecast_days=1')
    .then(function (r) { return r.json(); }).then(function (j) { var m = j && j.daily && j.daily.temperature_2m_max; return m && m.length ? { max: m[0] } : null; }).catch(function () { return null; });
  return WX[k];
}
function context(n) {
  var out = [], sub = nearest(SUBURBS, n.lat, n.lng, 4000);
  if (sub) out.push(sub[0].toUpperCase());
  if (DB) { var w = nearest(DB.waters, n.lat, n.lng, 450), pl = nearest(DB.places, n.lat, n.lng, 200), at2 = w || pl; if (at2) out.push(at2[0].toUpperCase().slice(0, 30)); if (sub && DB.canopy && DB.canopy[sub[0].toUpperCase()]) out.push('CANOPY ' + DB.canopy[sub[0].toUpperCase()] + '%'); }
  if (n.wx && n.wx.max != null) out.push(Math.round(n.wx.max) + '° TODAY');
  var o = outlookNow(); if (o && o.nino) out.push('NIÑO 3.4 ' + o.nino.replace(/ ?(OBS|PEAK)/, '').replace('≈', ''));
  return out;
}

/* ───────── a noticing: the photograph with where and when, a line, what it is. The engine stays underneath: what it reads is
   offered once, as the life it may be; an alert shows only when there is a real one; the place, the canopy, the heat and El Niño
   travel with the record unseen ───────── */
function stepW() {
  focusOn(cur.lat, cur.lng, 17); net.focus = cur; net.links = []; render();
  open('<div class="hd"><span id="n-where"></span><button class="g loc" id="n-loc" aria-label="Where I am" title="Where I am">◎</button><button class="x" aria-label="Close" title="Close">×</button></div>' +
    (cur.photo ? '<div class="ph"><img alt="" src="' + cur.photo + '"></div>' : '') +
    '<div class="say-row"><span class="pr">&gt;</span><textarea id="n-say" class="say" rows="1" maxlength="200" aria-label="What is happening"></textarea></div>' +
    '<div class="who" id="n-who"></div><div id="n-alert"></div>' +
    '<button class="go next" id="n-next" aria-label="Next" title="Next">→</button>', true);
  whereLine(); var say = $('#n-say'), tmr = 0; say.value = cur.say || ''; if (!('ontouchstart' in window)) say.focus();
  say.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(function () { cur.say = say.value.trim(); cur.spId = null; cur.spNone = false; reading(); }, 220); });
  $('#n-loc').addEventListener('click', function () { locate(true); });
  $('#n-next').addEventListener('click', function () { cur.say = say.value.trim(); place(); revealStep(cur.note); });
  db().then(reading); reading();
}
/* only what is real and timely: a need it names, or its season now, or today's heat for a life that suffers in it */
function alertHTML(r) {
  if (!r.issue && !r.hot && !(r.sp && r.lines.some(function (l) { return l.s === 'NOW'; }))) return '';
  return '<div class="alert">' + r.lines.map(function (l) { return '<p>' + esc(l.t) + '</p>'; }).join('') +
    (r.call ? '<a class="call" href="' + esc(r.call.tel) + '"><b>' + esc(r.call.label) + '</b><span>' + esc(r.call.n) + '</span></a>' : '') + '</div>';
}
function reading() {
  if (!cur || !$('#n-who')) return;
  if (!cur.wx && !cur.wxAsked) { cur.wxAsked = 1; weather(cur.lat, cur.lng).then(function (w) { if (cur && w) { cur.wx = w; reading(); } }); }
  var r = read(cur); cur.r = r; cur.data = context(cur);
  /* the life it may be: one quiet line, changed if it is wrong */
  var opts = (r.sp ? [r.sp] : []).concat(r.alts || []);
  $('#n-who').innerHTML = opts.length || cur.spNone ? glyph('jelly') + '<select id="n-sp" aria-label="What it is">' + opts.map(function (f) { return '<option value="' + esc(f.id) + '">' + esc(f.cn) + '</option>'; }).join('') + '<option value="">—</option></select>' : '';
  var s = $('#n-sp'); if (s) { if (cur.spNone) s.value = ''; s.addEventListener('change', function () { cur.spId = s.value || null; cur.spNone = !s.value; reading(); }); }
  $('#n-alert').innerHTML = alertHTML(r);
}
function place() {
  var r = read(cur); cur.r = r;
  var n = cur.note || { id: cur.id, at: cur.at, mine: true, code: code(cur.id + '|' + cur.at) };
  n.lat = +cur.lat.toFixed(5); n.lng = +cur.lng.toFixed(5); n.src = cur.src; n.say = cur.say; n.tags = r.issue ? [r.issue.t] : [];
  n.sp = r.sp ? r.sp.id : ''; n.cn = r.sp ? r.sp.cn : ''; n.sci = r.sp ? r.sp.n : ''; n.g = r.group || ''; n.issue = r.issue ? r.issue.k : ''; n.thumb = cur.thumb;
  n.data = context(cur); n.wx = cur.wx || null;
  if (!cur.note) { NOTES.unshift(n); net.fresh = n.id; } cur.note = n; if (cur.photo) PHOTOS[n.id] = cur.photo; saveNotes(); attend(n);
  net.focus = n; net.links = r.near; render();
}
/* ───────── placed: the knot falls onto the ground, and a few sightings of the same and of the most closely related lives near it
   are revealed and tied to it. Three at most, never everything El Niño touches. Then straight on to the receipt ───────── */
function reveal(n, r) {
  var taxa = [r.sp].concat((r.rel || []).filter(function (o) { return o.f; }).map(function (o) { return o.f; })).filter(Boolean).slice(0, 3);
  if (!taxa.length || !B.inat) return Promise.resolve([]);
  return Promise.all(taxa.map(function (f) {
    var u = B.inat + '/observations?taxon_name=' + encodeURIComponent(f.n) + '&lat=' + n.lat.toFixed(4) + '&lng=' + n.lng.toFixed(4) + '&radius=3&per_page=3&order=desc&order_by=observed_on&locale=en';
    return fetch(u).then(function (x) { return x.json(); }).then(function (j) {
      return ((j && j.results) || []).map(function (o) {
        /* only the life asked for, never whatever else comes back */
        var c = o.geojson && o.geojson.coordinates, tx = o.taxon || {}; if (!c || (tx.name !== f.n && lower(tx.preferred_common_name) !== lower(f.cn))) return null;
        var s = { id: 'i' + o.id, lat: +c[1], lng: +c[0], cn: (o.taxon && o.taxon.preferred_common_name) || f.cn, at: Date.parse(o.observed_on) || 0, inat: o.id };
        s.d = Math.round(dist(n, s)); return s;
      }).filter(Boolean);
    }).catch(function () { return []; });
  })).then(function (lists) {
    var out = [], seen = {}; lists.forEach(function (l) { l.sort(function (a, b) { return a.d - b.d; }); var s = l.filter(function (x) { return !seen[x.id] && x.d > 5; })[0]; if (s) { seen[s.id] = 1; out.push(s); } });
    return out.slice(0, 3);
  });
}
var far = function (d) { return d < 1000 ? d + ' m' : (d / 1000).toFixed(1) + ' km'; };
function revealStep(n) {
  var r = read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng, wx: n.wx });
  open('<div class="hd"><span>' + esc((n.data || []).slice(0, 2).join(' · ') || ll(n.lat, n.lng)) + '</span><button class="x" aria-label="Close">×</button></div>' +
    '<ul class="seen" id="n-seen"><li class="wait"><span class="gl">· · ·</span></li></ul><button class="go next" id="n-print" aria-label="Next">→</button>', true, 'peek');
  var t = 0, go = function () { clearTimeout(t); if ($('#n-seen')) stepS(n); };
  $('#n-print').addEventListener('click', go);
  net.focus = n; net.links = []; net.fresh = n.id; focusOn(n.lat, n.lng, 16);
  reveal(n, r).then(function (seen) {
    if (!$('#n-seen')) return; n.seen = seen; saveNotes();
    net.focus = n; net.links = seen; net.fresh = n.id;
    if (seen.length) { var all = [n].concat(seen); fit(all); } else render();
    $('#n-seen').innerHTML = seen.length ? seen.map(function (s) { return '<li><span>' + esc(s.cn) + '</span><small>' + far(s.d) + (s.at ? ' · ' + when(s.at).slice(0, 6) : '') + '</small></li>'; }).join('') : '<li class="empty">—</li>';
    t = setTimeout(go, seen.length ? 5200 : 2000);
    sheet.addEventListener('pointerdown', function () { clearTimeout(t); }, { once: true });
  });
}
/* W.I.S.H., embodied: the engine drafts the four lines from what it knows, and offers, for each line, a few others that fit this
   poster: its life, its need, its season, a case that worked elsewhere. The letters are never printed; the lines read as a poem */
var IB = {
  young: ['The young left on the ground to be fed', 'Pets kept in while they learn to fly', 'People stepping around them, not in'],
  hurt: ['It reaches a carer within the hour', 'Netting and fishing line gone from the trees', 'Someone nearby who knows what to do'],
  dead: ['It is reported, and nothing touches it', 'We learn what happened here', 'Any young in its pouch found in time'],
  heat: ['Water out at three heights on hot days', 'Shade kept where they shelter', 'No one, bird or person, alone in the heat'],
  water: ['The water here kept clean and full', 'Runoff stopped at the drain', 'A pond for the frogs that stays wet'],
  swoop: ['The nest left be for its six weeks', 'A detour, not a fight', 'Hats on and bikes walked past'],
  snake: ['It is left to move on', 'Dogs on leads along the creek', 'A catcher called, not a shovel'],
  litter: ['Loops cut before they reach the bin', 'The bin here emptied before it spills', 'Less plastic sold on this strip'],
  tree: ['Old trees with hollows kept standing', 'A new tree for every one lost', 'Life checked for before the saw'],
  light: ['Lights off or pointed down after 10 pm', 'A dark corridor for bats and moths'],
  cats: ['Cats kept in from dusk to dawn', 'Dogs on leads near nests'],
  poison: ['No baits here: traps instead', 'Footpaths left unsprayed'],
};
var IB_G = function (name) { return ['Water and shade for the ' + name + ' on hot days', 'This place kept for the ' + name, 'Neighbours who know the ' + name + ' is here']; };
var cap = function (s) { s = String(s || '').toLowerCase(); return s.replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }); };
function uniq(a) { var o = []; a.forEach(function (x) { x = String(x || '').trim(); if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
function wishOptions(n, r) {
  var sp = r.sp, iss = r.issue, place = (n.data || [])[1] || (n.data || [])[0] || '', o = outlookNow(), cs = caseOf(r.group, iss);
  var name = sp ? sp.cn.replace(/^(Common|Australian|Eastern) /, '') : 'life here';
  var W = [sp && (sp.cn + (place ? ' at ' + cap(place) : '') + ', ' + when(n.at).slice(0, 6)), sp && sp.aware, n.say,
    sp && sp.brd && sp.brd[M] === 'B' ? 'Nesting now, ' + months(sp.brd, 'B') : '', o && o.win && r.group && o.win.g.indexOf(r.group) >= 0 ? 'El Niño: ' + o.win.why : ''];
  var I = (IB[iss && iss.k] || []).concat(IB_G(name));
  var S = [iss && actions(iss.say, 1), sp && sp.help, iss && SIGN[iss.k] ? 'A sign at the spot: ' + SIGN[iss.k].toLowerCase() : 'A sign at the spot, printed here', cs && cs.i, sp && sp.harm];
  var H = [r.call && r.call.label + ' ' + r.call.n, cs && ('As ' + (cs.after || 'others') + ' did' + (cs.city ? ', ' + cs.city : '') + (cs.yr ? ' ' + cs.yr : '') + (cs.fact ? ': ' + cs.fact : '')), 'Printed at a partner place and taped up here', 'Passed on through the neighbours’ net'];
  return [W, I, S, H].map(function (a) { return uniq(a).slice(0, 6); });
}
function wishLines(n, r) {
  if (n.wishText) return n.wishText.map(function (t, i) { return ['WISH'[i], t]; }).filter(function (l) { return l[1]; });
  return wishOptions(n, r).map(function (a, i) { return ['WISH'[i], a[0] || '']; }).filter(function (l) { return l[1]; });
}
/* ───────── the receipt: the photograph on its top half; under it the line, the life, the facts, what it connects to, a code ───────── */
var CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function code(seed) { var h = 2166136261; for (var i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619); h >>>= 0; var s = ''; for (var j = 0; j < 4; j++) { s += CROCK[h % 32]; h = Math.floor(h / 32); } return 'DA-' + s; }
function wrapText(x, text, w) { var words = String(text).split(/\s+/), out = [], line = ''; words.forEach(function (wd) { var t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > w && line) { out.push(line); line = wd; } else line = t; }); if (line) out.push(line); return out; }
/* Atkinson dither: the photograph in black dots, as a thermal head lays them */
function dither(ctx, w, h) {
  var id = ctx.getImageData(0, 0, w, h), d = id.data, g = new Float32Array(w * h), lo = 255, hi = 0, i;
  for (i = 0; i < w * h; i++) { g[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114; if (g[i] < lo) lo = g[i]; if (g[i] > hi) hi = g[i]; }
  if (hi - lo > 24) for (i = 0; i < w * h; i++) g[i] = (g[i] - lo) / (hi - lo) * 255;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    i = y * w + x; var o = g[i] < 128 ? 0 : 255, e = (g[i] - o) / 8; g[i] = o;
    if (x + 1 < w) g[i + 1] += e; if (x + 2 < w) g[i + 2] += e;
    if (y + 1 < h) { if (x > 0) g[i + w - 1] += e; g[i + w] += e; if (x + 1 < w) g[i + w + 1] += e; }
    if (y + 2 < h) g[i + 2 * w] += e;
  }
  for (i = 0; i < w * h; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g[i]; d[i * 4 + 3] = 255; }
  ctx.putImageData(id, 0, 0);
}
/* wonky pixels: the picture brought down to a few dozen cells, each a little off its row, in two inks, four greys or a few colours */
function pixelArt(im, cells, tones, scale, seed) {
  var s = document.createElement('canvas'); var k = cells / Math.max(im.naturalWidth || im.width, im.naturalHeight || im.height);
  s.width = Math.max(4, Math.round((im.naturalWidth || im.width) * k)); s.height = Math.max(4, Math.round((im.naturalHeight || im.height) * k));
  var sx = s.getContext('2d'); sx.drawImage(im, 0, 0, s.width, s.height); var d = sx.getImageData(0, 0, s.width, s.height).data;
  var out = document.createElement('canvas'); out.width = s.width * scale + 4; out.height = s.height * scale + 4; var o = out.getContext('2d');
  o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height);
  var r = seed || 7; var rnd = function () { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (var y = 0; y < s.height; y++) {
    var off = Math.round((rnd() - 0.5) * scale * 0.35);
    for (var x = 0; x < s.width; x++) {
      var i = (y * s.width + x) * 4, R = d[i], G = d[i + 1], Bc = d[i + 2], L = R * 0.299 + G * 0.587 + Bc * 0.114, col;
      if (tones === 2) col = L < 120 + (rnd() - 0.5) * 40 ? '#000' : null;
      else if (tones === 4) { var q = Math.round(L / 85); col = q >= 3 ? null : ['#000', '#555', '#AAA'][q]; }
      else { var p = function (v) { return Math.round(v / 127.5) * 127; }; col = 'rgb(' + p(R) + ',' + p(G) + ',' + p(Bc) + ')'; }
      if (!col) continue; var j = rnd() < 0.18 ? 1 : 0; o.fillStyle = col; o.fillRect(2 + x * scale + off, 2 + y * scale + (rnd() < 0.1 ? 1 : 0), scale + j, scale + (rnd() < 0.15 ? 1 : 0));
    }
  }
  return out;
}
var qrP = null;
function qrLib() { if (window.qrcode) return Promise.resolve(window.qrcode); if (!qrP) qrP = new Promise(function (res) { var s = document.createElement('script'); s.src = 'vendor/qrcode.js'; s.onload = function () { res(window.qrcode || null); }; s.onerror = function () { qrP = null; res(null); }; document.head.appendChild(s); }); return qrP; }
var noteURL = function (n) { var base = /\.workers\.dev$|localhost|\.test$/.test(location.hostname) ? location.origin + '/' : (B.portal || location.origin + '/'); return base.replace(/#.*$/, '') + '#n=' + n.code; };
/* opt: { art: photo | pixel | net, wish: its four lines on, show: which parts print (all, unless said) } */
function slip(n, photo, r, opt, W, boardArt) {
  opt = opt || {}; var art = opt.art || 'photo', show = opt.show || { line: 1, life: 1, facts: 1, links: 1, code: 1 };
  if (art === 'sign') return signSlip(n, photo, r, W);
  var F = function (px, w) { return (w || 'bold') + ' ' + px + 'px "Courier New", Courier, monospace'; };
  var u = W / 512, pad = Math.round(W * 0.04), aw = W - pad * 2;
  /* the lower half first, so the photograph can take as much again */
  var Lc = document.createElement('canvas'); Lc.width = W; Lc.height = 3000; var x = Lc.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, 3000); x.fillStyle = '#000'; x.textBaseline = 'top';
  var y = Math.round(12 * u);
  if (show.line && n.say) { x.font = F(Math.round(28 * u)); wrapText(x, n.say, aw).forEach(function (l) { x.fillText(l, pad, y); y += Math.round(32 * u); }); y += Math.round(6 * u); }
  if (show.life && n.cn) { x.font = F(Math.round(20 * u)); x.fillText(n.cn.toUpperCase(), pad, y); y += Math.round(23 * u); x.font = F(Math.round(16 * u), 'italic bold'); x.fillText(n.sci || '', pad, y); y += Math.round(26 * u); }
  /* W.I.S.H. on, its four lines stand for the facts: nothing is said twice */
  if (show.facts && !opt.wish) {
    x.font = F(Math.round(16 * u));
    (r.lines || []).forEach(function (l) { x.fillRect(pad + 2, y + Math.round(6 * u), Math.round(6 * u), Math.round(6 * u)); wrapText(x, l.t, aw - Math.round(18 * u)).forEach(function (t) { x.fillText(t, pad + Math.round(18 * u), y); y += Math.round(20 * u); }); y += Math.round(6 * u); });
    if (r.call) { x.font = F(Math.round(17 * u)); x.fillText('CALL ' + r.call.label + ' ' + r.call.n, pad, y); y += Math.round(26 * u); }
  }
  /* what it is tied to: the sightings revealed near it, and a case that worked elsewhere */
  var ties = linksOf(n, r);
  if (show.links && ties.length && art !== 'net') { x.font = F(Math.round(16 * u)); ties.forEach(function (o) { wrapText(x, '+ ' + o.label + (o.sub ? '  ' + o.sub : ''), aw).forEach(function (t) { x.fillText(t, pad, y); y += Math.round(19 * u); }); }); y += Math.round(6 * u); }
  if (n.data && n.data.length) { x.font = F(Math.round(14 * u)); wrapText(x, n.data.join(' · '), aw).forEach(function (t) { x.fillText(t, pad, y); y += Math.round(18 * u); }); y += Math.round(4 * u); }
  /* W.I.S.H. on: its lines as a poem between two rules, the letters never printed */
  if (opt.wish) { x.fillRect(pad, y, aw, Math.max(1, Math.round(2 * u))); y += Math.round(12 * u); x.font = F(Math.round(19 * u)); wishLines(n, r).forEach(function (l) { wrapText(x, l[1], aw).forEach(function (t) { x.fillText(t, pad, y); y += Math.round(23 * u); }); y += Math.round(8 * u); }); x.fillRect(pad, y, aw, Math.max(1, Math.round(2 * u))); y += Math.round(12 * u); }
  x.font = F(Math.round(14 * u)); x.fillText(ll(n.lat, n.lng) + '  ' + n.code, pad, y); y += Math.round(22 * u);
  return qrLib().then(function (Q) {
    if (Q && show.code) { try { var q = Q(0, 'L'); q.addData(noteURL(n)); q.make(); var c = q.getModuleCount(), m = Math.max(2, Math.floor(W * 0.34 / c)), ox = Math.round((W - c * m) / 2); for (var i = 0; i < c; i++) for (var j = 0; j < c; j++) if (q.isDark(i, j)) x.fillRect(ox + j * m, y + i * m, m, m); y += c * m + Math.round(10 * u); } catch (e) { /* no code */ } }
    y += Math.round(16 * u);
    var lowH = y;
    return Promise.resolve(art === 'net' ? null : boardArt || (photo ? loadImg(photo).catch(function () { return null; }) : null)).then(function (im) {
      var head = Math.round(40 * u), ph = Math.max(Math.round(aw * 0.6), Math.min(Math.round(aw * 1.3), lowH));
      var out = document.createElement('canvas'); out.width = W; out.height = head + ph + lowH; var o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, W, out.height); o.fillStyle = '#000'; o.textBaseline = 'top';
      o.font = F(Math.round(18 * u)); o.fillText('NOVEL.GLOBAL', pad, pad); var dt = when(n.at); o.font = F(Math.round(16 * u)); o.fillText(dt, W - pad - o.measureText(dt).width, pad + 2);
      var top = head;
      if (art === 'net' || !im) netArt(o, n, r, pad, top + 8, aw, ph - 16);
      else if (art === 'pixel' || boardArt) {
        var pa = boardArt && boardArt.tagName === 'CANVAS' ? boardArt : pixelArt(im, 44, 2, 8, n.at % 997 + 3);
        var k = Math.min(aw / pa.width, ph / pa.height); o.imageSmoothingEnabled = false; o.drawImage(pa, pad + (aw - pa.width * k) / 2, top + (ph - pa.height * k) / 2, pa.width * k, pa.height * k);
      } else {
        var c2 = document.createElement('canvas'); c2.width = aw; c2.height = ph; var cx = c2.getContext('2d');
        var sc = Math.max(aw / im.naturalWidth, ph / im.naturalHeight); cx.drawImage(im, (aw - im.naturalWidth * sc) / 2, (ph - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc);
        dither(cx, aw, ph); o.drawImage(c2, pad, top);
      }
      o.drawImage(Lc, 0, 0, W, lowH, 0, head + ph, W, lowH);
      var id = o.getImageData(0, 0, W, out.height), d = id.data; for (var k2 = 0; k2 < d.length; k2 += 4) { var v = d[k2] < 150 ? 0 : 255; d[k2] = d[k2 + 1] = d[k2 + 2] = v; d[k2 + 3] = 255; } o.putImageData(id, 0, 0);
      return out;
    });
  });
}
/* the sign: for the place itself, read from a step away. What it is, what to do, who to call, a code back to it.
   The public notice the field had none of: made where it was noticed, printed, taped up */
var SIGN = { young: 'FLEDGLINGS ON THE GROUND', hurt: 'INJURED WILDLIFE', dead: 'DO NOT TOUCH', heat: 'WATER OUT IN THE HEAT', water: 'KEEP THIS WATER CLEAN', swoop: 'SWOOPING BIRDS',
  snake: 'SNAKE ABOUT', litter: 'TAKE IT HOME', tree: 'LIFE IN THESE TREES', light: 'LIGHTS OFF AFTER 10 PM', cats: 'KEEP CATS IN', poison: 'NO BAITS HERE' };
function actions(s, k) { var all = String(s || '').match(/[^.!?]+[.!?]?/g) || []; return all.filter(function (x) { return !/\?\s*$/.test(x); }).slice(0, k || 2).map(function (x) { return x.trim(); }).join(' '); }
function signSlip(n, photo, r, W) {
  var F = function (px) { return 'bold ' + px + 'px "Courier New", Courier, monospace'; };
  var u = W / 512, pad = Math.round(W * 0.05), aw = W - pad * 2;
  var c = document.createElement('canvas'); c.width = W; c.height = 3000; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, 3000); x.textBaseline = 'top';
  var head = SIGN[n.issue] || (n.cn ? n.cn.toUpperCase() + ' LIVES HERE' : (n.say || 'NOTICED HERE').toUpperCase());
  x.font = F(Math.round(46 * u)); var hl = wrapText(x, head, aw); var bh = hl.length * Math.round(50 * u) + Math.round(30 * u);
  x.fillStyle = '#000'; x.fillRect(0, 0, W, bh); x.fillStyle = '#fff'; hl.forEach(function (l, i) { x.fillText(l, pad, Math.round(16 * u) + i * Math.round(50 * u)); });
  var y = bh + Math.round(18 * u); x.fillStyle = '#000';
  if (n.cn) { x.font = F(Math.round(24 * u)); var f = DB && DB.field.filter(function (z) { return z.id === n.sp; })[0]; x.fillText(n.cn.toUpperCase() + (f && f.brd && f.brd[M] === 'B' ? ' · NESTING NOW' : ''), pad, y); y += Math.round(36 * u); }
  var act = r.issue ? actions(r.issue.say, 2) : r.sp ? (r.sp.help || r.sp.aware) : n.say;
  if (act) { x.font = F(Math.round(26 * u)); wrapText(x, act, aw).forEach(function (l) { x.fillText(l, pad, y); y += Math.round(31 * u); }); y += Math.round(14 * u); }
  if (r.call) { var ch = Math.round(86 * u); x.lineWidth = Math.max(2, Math.round(4 * u)); x.strokeRect(pad, y, aw, ch); x.font = F(Math.round(18 * u)); x.fillText(r.call.label, pad + Math.round(14 * u), y + Math.round(12 * u)); x.font = F(Math.round(40 * u)); x.fillText(r.call.n, pad + Math.round(14 * u), y + Math.round(36 * u)); y += ch + Math.round(18 * u); }
  return Promise.all([photo ? loadImg(photo).catch(function () { return null; }) : null, qrLib()]).then(function (got) {
    var im = got[0], Q = got[1], side = Math.round(aw * 0.46), top = y;
    if (im) { var p = document.createElement('canvas'); p.width = p.height = side; var px2 = p.getContext('2d'); var sc = Math.max(side / im.naturalWidth, side / im.naturalHeight); px2.drawImage(im, (side - im.naturalWidth * sc) / 2, (side - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc); dither(px2, side, side); x.drawImage(p, pad, top); }
    if (Q) { try { var q = Q(0, 'L'); q.addData(noteURL(n)); q.make(); var k = q.getModuleCount(), m = Math.max(2, Math.floor(side / k)), ox = im ? W - pad - k * m : Math.round((W - k * m) / 2); for (var i = 0; i < k; i++) for (var j = 0; j < k; j++) if (q.isDark(i, j)) x.fillRect(ox + j * m, top + i * m, m, m); } catch (e) { /* no code */ } }
    y = top + side + Math.round(16 * u); x.font = F(Math.round(15 * u)); x.fillText(when(n.at) + '  ' + ll(n.lat, n.lng) + '  ' + n.code, pad, y); y += Math.round(30 * u);
    var out = document.createElement('canvas'); out.width = W; out.height = y; var o = out.getContext('2d'); o.drawImage(c, 0, 0, W, y, 0, 0, W, y);
    var id = o.getImageData(0, 0, W, y), d = id.data; for (var z = 0; z < d.length; z += 4) { var v = d[z] < 150 ? 0 : 255; d[z] = d[z + 1] = d[z + 2] = v; d[z + 3] = 255; } o.putImageData(id, 0, 0);
    return out;
  });
}
function linksOf(n, r) {
  var out = (n.seen || []).map(function (s) { return { label: s.cn, sub: far(s.d) }; });
  (r.rel || []).forEach(function (o) { if (o.brief && out.length < 4) out.push({ label: o.label, sub: o.sub }); else if (!o.brief && !(n.seen || []).length && out.length < 3) out.push({ label: o.label, sub: '' }); });
  return out.slice(0, 4);
}
/* the net as the art: this noticing and what it connects to, sticks and knots and hanging threads */
function netArt(x, n, r, ox, oy, w, h) {
  /* this noticing a shell at the top, what it connects to below it, each tied by a stick; black only, for the thermal head */
  var items = (r.rel || []).slice(0, 3), cx = ox + w / 2, cy = oy + h * 0.28;
  var pts = [[cx, cy]].concat(items.map(function (o, i) { var a = Math.PI * (0.18 + 0.64 * (items.length > 1 ? i / (items.length - 1) : 0.5)); return [cx - Math.cos(a) * w * 0.32, cy + Math.sin(a) * h * 0.46]; }));
  var pairs = items.map(function (o, i) { return [0, i + 1]; }); for (var i = 1; i < items.length; i++) pairs.push([i, i + 1]);
  /* a stick for each tie and nothing more: no frame, no swell, only what connects */
  x.strokeStyle = '#000'; x.lineWidth = 3; x.lineCap = 'round'; pairs.forEach(function (pr) { var a = pts[pr[0]], b = pts[pr[1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; x.beginPath(); x.moveTo(a[0] - dx / L * 10, a[1] - dy / L * 10); x.lineTo(b[0] + dx / L * 10, b[1] + dy / L * 10); x.stroke(); });
  x.fillStyle = '#000'; pts.forEach(function (p, i) { x.beginPath(); x.arc(p[0], p[1], i ? 7 : 11, 0, 7); x.fill(); });
  x.font = 'bold 16px "Courier New", monospace'; items.forEach(function (o, i) { var p = pts[i + 1]; var t = o.label.toUpperCase().slice(0, 18); var tw = x.measureText(t).width; x.fillStyle = '#fff'; var tx = Math.min(ox + w - tw, Math.max(ox, p[0] - tw / 2)); x.fillRect(tx - 3, p[1] + 14, tw + 6, 18); x.fillStyle = '#000'; x.fillText(t, tx, p[1] + 16); });
}
function raster(cv) {
  var W = cv.width, H = cv.height, bw = W >> 3, d = cv.getContext('2d').getImageData(0, 0, W, H).data, out = [0x1B, 0x40];
  for (var y0 = 0; y0 < H; y0 += 255) {
    var h = Math.min(255, H - y0); out.push(0x1D, 0x76, 0x30, 0x00, bw & 0xFF, bw >> 8, h & 0xFF, h >> 8);
    for (var y = y0; y < y0 + h; y++) for (var xb = 0; xb < bw; xb++) { var v = 0; for (var bit = 0; bit < 8; bit++) if (d[(y * W + xb * 8 + bit) * 4] < 128) v |= 0x80 >> bit; out.push(v); }
  }
  out.push(0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00);
  var s = ''; for (var i = 0; i < out.length; i += 0x8000) s += String.fromCharCode.apply(null, out.slice(i, i + 0x8000)); return btoa(s);
}
function api(path, opt) {
  opt = opt || {}; opt.headers = { 'content-type': 'application/json' };
  return fetch(API + path, opt).then(function (r) { if (r.status === 204) return null; return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; throw e; } return j; }); });
}
var PRN = null;
function printers() { if (PRN) return Promise.resolve(PRN); return api('/partners').then(function (j) { PRN = ((j && j.partners) || []).filter(function (p) { return p.id === 'novelglobal'; }); return PRN; }).catch(function () { return []; }); }
/* the design stage: the receipt as it will print, the photograph its top half. A touch on it changes the art (photograph,
   pixels, the net); W.I.S.H. writes its four lines on; the printer; PRINT. Nothing else */
var ARTS = ['photo', 'pixel', 'net', 'sign'];
/* where a print is, as three dots: sent, seen and let through, printed. No words for it; its name on hover */
var PIP = { sending: 1, waiting: 1, held: 1, shown: 2, queued: 2, printing: 2, printed: 3 };
function pips(s) {
  if (s === 'outbox') return '<span class="pips wait" title="offline: sends when there is signal">●○○</span>';
  if (s === 'failed' || s === 'refused') return '<span class="pips x" title="' + esc(s) + '">✕</span>';
  var k = PIP[s] || 0; return '<span class="pips" title="' + esc(s || '') + '">' + '●●●'.slice(0, k) + '○○○'.slice(k) + '</span>';
}
/* the design stage: the receipt as it will print, the photograph its top half. A touch on it changes the art; the W.I.S.H. glyph
   writes its four lines on; the printer; print. Then the thread, where it shows whether or not a printer is on */
function stepS(n, boardArt, art) {
  var photo = PHOTOS[n.id] || n.thumb || n.photoURL || '';
  var r = read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng, wx: n.wx });
  var o = { art: art || (boardArt ? 'pixel' : photo ? 'photo' : 'net'), wish: !!n.wish };
  open('<div class="hd"><span>' + esc(n.code) + '</span><button class="x" aria-label="Close" title="Close">×</button></div>' +
    '<button class="slip" id="p-slip" aria-label="Change the art" title="Change the art"></button><div class="dots" id="p-dots"></div>' +
    '<div class="stick-foot"><div class="ctl"><button class="g" id="p-wish" aria-pressed="false" aria-label="W.I.S.H." title="W.I.S.H.">' + glyph('wish') + '</button><select id="p-to" aria-label="Printer" title="Printer"><option value="">…</option></select></div>' +
    '<button class="go" id="p-send" aria-label="Print" title="Print">' + glyph('print') + '</button><div class="status" id="p-st"></div></div>');
  var cv = null, W = 512, sel = $('#p-to');
  var draw = function () {
    $('#p-dots').innerHTML = ARTS.map(function (a) { return '<button class="' + (a === o.art ? 'on' : '') + '" data-a="' + a + '" aria-label="' + a + '" title="' + a + '"><i></i></button>'; }).join('');
    $$('#p-dots button').forEach(function (b) { b.addEventListener('click', function () { o.art = b.dataset.a; draw(); }); });
    $('#p-wish').classList.toggle('on', o.wish); $('#p-wish').setAttribute('aria-pressed', String(o.wish));
    slip(n, photo, r, o, W, o.art === 'pixel' ? boardArt : null).then(function (c) { cv = c; var s = $('#p-slip'); if (s) { s.innerHTML = ''; s.appendChild(c); } });
  };
  $('#p-slip').addEventListener('click', function () { o.art = ARTS[(ARTS.indexOf(o.art) + 1) % ARTS.length]; if (o.art === 'photo' && !photo) o.art = 'pixel'; if (o.art === 'pixel' && !photo && !boardArt) o.art = 'net'; draw(); });
  $('#p-wish').addEventListener('click', function () { o.wish = !o.wish; n.wish = o.wish; if (o.wish && !n.wishText) n.wishText = wishLines(n, r).map(function (l) { return l[1]; }); saveNotes(); draw(); });
  var pick = function () { var op = sel.options[sel.selectedIndex]; var P = (B.printers || {})[String((op && op.getAttribute('data-paper')) || '80')] || { dots: 512 }; W = P.dots - P.dots % 8; store.set('da.base.printer', sel.value); draw(); };
  printers().then(function (list) {
    var ps = list.filter(function (p) { return p.paired || p.id === (B.master && B.master.id); });
    if (!ps.length && B.master) ps = [{ id: B.master.id, name: B.master.n, paper: B.master.paper }];
    sel.innerHTML = ps.map(function (p) { return '<option value="' + esc(p.id) + '" data-paper="' + esc(p.paper) + '">' + (p.ready ? '● ' : '○ ') + esc(p.name || p.id) + '</option>'; }).join('');
    var last = store.get('da.base.printer', ''); if (last && ps.some(function (p) { return p.id === last; })) sel.value = last;
    pick();
  });
  sel.addEventListener('change', pick);
  $('#p-send').addEventListener('click', function () {
    var btn = $('#p-send'); if (btn.dataset.next) { wishSheet(n); return; }
    if (!cv || !sel.value) return; btn.disabled = true; var st = $('#p-st');
    var body = { type: 'noticed', lat: +n.lat.toFixed(4), lng: +n.lng.toFixed(4), text: n.say || '' };
    if (n.cn) { body.tx = { n: n.sci, cn: n.cn }; body.g = n.g; }
    if (n.tags && n.tags.length) body.tags = n.tags; if (n.issue) body.issue = n.issue; if (n.data && n.data.length) body.data = n.data;
    if (o.wish) body.wish = wishLines(n, r).map(function (l) { return l[1]; });
    var payload = { kind: 'record', code: n.code, body: JSON.stringify(body), lat: body.lat, lng: body.lng, dest: sel.value, escpos: raster(cv) };
    if (PHOTOS[n.id]) payload.photo = PHOTOS[n.id];
    st.innerHTML = pips('sending');
    var after = function () { btn.disabled = false; btn.dataset.next = '1'; btn.innerHTML = '→'; btn.setAttribute('aria-label', 'Next'); btn.title = 'Next'; };
    send(payload).then(function (j) {
      var s = j.job ? j.job.status : j.status; n.sent = { id: j.id, dest: sel.value, s: s }; saveNotes(); st.innerHTML = pips(s); follow(n, st); after();
    }).catch(function (e) {
      if (e.status) { st.innerHTML = pips('failed'); btn.disabled = false; return; }
      OUTBOX.push(payload); store.set('da.base.outbox', OUTBOX); n.sent = { s: 'outbox' }; saveNotes(); st.innerHTML = pips('outbox'); after();
    });
  });
  draw();
}
function download(cv, name) { var a = document.createElement('a'); a.download = name; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); }
function send(payload) { return api('/stories', { method: 'POST', body: JSON.stringify(payload) }); }
/* where a print is now: asked again every few seconds while it is in view, and kept on the noticing */
function follow(n, el, k) {
  k = k || 0; if (k > 30 || !n.sent || !n.sent.id) return;
  setTimeout(function () { if (el && !document.contains(el)) return; api('/receipts/' + n.sent.id).then(function (j) { if (!j) return; var s = j.job ? j.job.status : j.status; n.sent.s = s; saveNotes(); if (el) el.innerHTML = pips(s); if (s !== 'printed' && s !== 'failed' && s !== 'refused') follow(n, el, k + 1); }).catch(function () { follow(n, el, k + 1); }); }, 9000);
}
function flush() {
  if (!OUTBOX.length || !navigator.onLine) return; var p = OUTBOX[0];
  send(p).then(function (j) { OUTBOX.shift(); store.set('da.base.outbox', OUTBOX); var n = NOTES.filter(function (x) { return x.code === p.code; })[0]; if (n) { n.sent = { id: j.id, dest: p.dest, s: j.job ? j.job.status : j.status }; saveNotes(); } flush(); })
    .catch(function (e) { if (e.status) { OUTBOX.shift(); store.set('da.base.outbox', OUTBOX); flush(); } });
}
addEventListener('online', flush);
function allStories() { return NOTES.concat(SHARED).sort(function (a, b) { return b.at - a.at; }); }
/* a knot pressed, or a code opened: its thread */
function openNote(n) { net.focus = n; net.links = []; if (isFinite(n.lat)) focusOn(n.lat, n.lng, Math.max(map.z, 16)); cur = null; wishSheet(n); }
/* ───────── what is happening now, from the field list and the outlook: a line on the ground, the rest a press away ───────── */
function nowItems() {
  if (!DB) return []; var F = DB.field, out = [];
  var names = function (list, k) { return list.slice(0, k || 3).map(function (f) { return f.cn.replace(/^(Australian|Common|Eastern) /, ''); }).join(', '); };
  var nest = F.filter(function (f) { return f.brd && f.brd[M] === 'B' && f.st !== 'I' && /^(bird|parrot|owl|waterbird|raptor)$/.test(f.g); });
  /* the ones most met first; parrots' young leave the hollow before they can fly well */
  var rank = function (f) { return (COMMON.indexOf(f.id) >= 0 ? 2 : 0) + (/fledg|on the ground|grounded/i.test([f.note, f.aware, f.event, f.help].join(' ')) ? 1 : 0) + (f.g === 'parrot' ? 1 : 0); };
  nest.sort(function (a, b) { return rank(b) - rank(a); });
  var kinds = []; nest.forEach(function (f) { var w = f.cn.replace(/\(.*?\)/g, '').trim().split(' ').pop().toLowerCase(); w = /(ch|sh|s)$/.test(w) ? w + 'es' : w + 's'; if (kinds.indexOf(w) < 0) kinds.push(w); });
  if (nest.length) out.push({ k: 'YOUNG', t: 'Fledglings on the ground: ' + kinds.slice(0, 5).join(', ') + (kinds.length > 5 ? ' and ' + (kinds.length - 5) + ' more kinds' : '') + '. Usually fine: keep pets in, leave them be.', call: 'WILDLIFE' });
  var sw = F.filter(function (f) { return /swoop/i.test(f.event || '') && f.brd && f.brd[M] === 'B'; });
  if (sw.length) out.push({ k: 'SWOOPING', t: names(sw) + ' swooping near nests. Detour; walk the bike.' });
  var o = outlookNow(); if (o && o.win) out.push({ k: 'EL NIÑO', t: o.win.w.charAt(0) + o.win.w.slice(1).toLowerCase() + ': ' + o.win.why + (o.nino ? ' Niño 3.4 ' + o.nino + '.' : '') });
  var sn = F.filter(function (f) { return f.g === 'snake' && f.act && f.act[M] === 'A'; }); if (sn.length) out.push({ k: 'SNAKES', t: names(sn) + ' active. Keep to paths, dogs on a lead.', call: 'SNAKE' });
  var hp = F.filter(function (f) { return f.heat >= 3 && f.act && f.act[M] !== '.'; }); if (o && o.win && /HEAT|NIGHTS/.test(o.win.w) && hp.length) out.push({ k: 'HEAT', t: 'Hit hardest by heat: ' + names(hp) + '. Water out, shade kept.', call: 'WILDLIFE' });
  return out.slice(0, 4);
}
/* everything in season this month, read from each life's own event: a range of months, or a season by name */
var SEASONS = { spring: [8, 9, 10], summer: [11, 0, 1], autumn: [2, 3, 4], winter: [5, 6, 7] };
function inSeason(f) {
  var e = String(f.event || ''), m = e.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*[–-]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
  if (m) { var a = MON.indexOf(m[1].toUpperCase()), b = MON.indexOf(m[2].toUpperCase()); return a <= b ? M >= a && M <= b : M >= a || M <= b; }
  var hit = false; for (var k in SEASONS) if (new RegExp('\\b' + k + '\\b', 'i').test(e) && SEASONS[k].indexOf(M) >= 0) hit = true;
  return hit && !(f.act && f.act[M] === '.');
}
function seasonNow() { return DB ? DB.field.filter(inSeason).sort(function (a, b) { return (COMMON.indexOf(b.id) >= 0) - (COMMON.indexOf(a.id) >= 0); }) : []; }
/* the small screen: What have you noticed?, then what is urgent this month, one at a time, crawling across. Pressed: the guide */
var oled = $('#oled'), oledI = 0, oledT = 0;
var URGENT = /YOUNG|SWOOP|SNAKE|HEAT|EL NIÑO/;
function nowTick() {
  var items = [{ k: 'novel.global', t: 'What have you noticed?' }].concat(nowItems(), seasonNow().slice(0, 3).map(function (f) { return { k: '◠', t: f.cn + ' · ' + f.event }; }));
  var i = oledI++ % items.length, it = items[i];
  /* the whole of it, still: what it is and what to do, small enough to keep, never crawling past */
  $('.l1', oled).innerHTML = '<b class="' + (URGENT.test(it.k) ? 'u' : '') + '">' + esc(it.k) + '</b><i>' + (i + 1) + '/' + items.length + '</i>';
  var l2 = $('.l2', oled); l2.innerHTML = '<span></span>'; var sp = $('span', l2);
  if (oledI === 1) glitch(sp, it.t, 900); else sp.textContent = it.t;
  clearTimeout(oledT); oledT = setTimeout(nowTick, oledI === 1 ? 5000 : 6000 + it.t.length * 70);
}
function helpHTML() {
  return '<div class="lbl">CALL</div><ul class="list">' + (B.contacts || []).map(function (c) { return '<li><a href="' + esc(c[2]) + '"><span>' + esc(c[1]) + '</span><small>' + esc(c[0]) + '</small></a></li>'; }).join('') + '</ul>' +
    (DB && DB.links ? '<div class="lbl">REPORT</div><ul class="list">' + DB.links.map(function (l) { return '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener"><span>' + esc(l[0]) + '</span><small>↗</small></a></li>'; }).join('') + '</ul>' : '');
}

/* ───────── the guide: the long form. An index set out in full, nothing folded: now; if you find; who to call; in season;
   the neighbours, every kind of life met here; what worked elsewhere. One field searches it all ───────── */
var KINDS = { bird: 'Birds', parrot: 'Parrots', waterbird: 'Waterbirds', owl: 'Owls and frogmouths', raptor: 'Hawks and falcons', macropod: 'Kangaroos', possum: 'Possums', flyingfox: 'Flying-foxes',
  bat: 'Microbats', rodent: 'Rats and mice', fox: 'Foxes', cat: 'Cats', dog: 'Dogs', rabbit: 'Rabbits', lizard: 'Lizards', snake: 'Snakes', turtle: 'Turtles', frog: 'Frogs', butterfly: 'Butterflies',
  moth: 'Moths', bee: 'Bees', wasp: 'Wasps', fly: 'Flies', beetle: 'Beetles', bug: 'Bugs', spider: 'Spiders', orb: 'Orb-weavers', grasshopper: 'Grasshoppers', mantis: 'Mantises',
  dragonfly: 'Dragonflies', aquatic: 'Water life', snail: 'Snails and slugs', segmented: 'Worms' };
var THEMES = { heat: 'Heat', water: 'Water', pollinate: 'Pollinators', diversity: 'Living together', night: 'Night', food: 'Food', circular: 'Reuse', cats: 'Cats' };
var STATUS_OF = { N: 'Native', I: 'Introduced', T: 'Threatened', E: 'Uncommon here' };
function guideSheet(q) {
  open(head('guide') + '<div class="say-row"><span class="pr">&gt;</span><input id="q" class="find" type="search" autocomplete="off" aria-label="Search the guide"></div><div id="g-out"></div>', false, 'wide');
  var inp = $('#q'); inp.value = q || ''; if (!('ontouchstart' in window)) inp.focus();
  var paint = function () { var t = lower(inp.value.trim()); if (t === '2600') { whistle(); glitch($('.hd .hg'), 'TRUNK SEIZED', 900); } $('#g-out').innerHTML = t.length > 1 ? results(t) : index(); wireGuide(); };
  inp.addEventListener('input', paint); db().then(paint); paint();
}
function index() {
  /* each group folded, its name, its count and what it is about showing; only what is urgent now starts open */
  var sec = function (h, n, about, body, open) { return '<details class="sec"' + (open ? ' open' : '') + '><summary><h3>' + h + (n != null ? '<small>' + n + '</small>' : '') + '</h3>' + (about ? '<p class="about">' + about + '</p>' : '') + '</summary>' + body + '</details>'; };
  var h = '';
  var now = nowItems(); if (now.length) h += sec('Now', null, 'What is happening this month.', '<ul class="list">' + now.map(function (i) { return '<li class="urgent"><p><b>' + esc(i.k) + '</b> ' + esc(i.t) + '</p></li>'; }).join('') + '</ul>', true);
  h += sec('If you find', ISSUES.length, 'What to do, and who to call.', '<ul class="list">' + ISSUES.map(function (i) { var c = callOf(i.call); return '<li><button data-is="' + i.k + '"><span>' + esc(i.t.charAt(0) + i.t.slice(1).toLowerCase()) + '<span class="act">' + esc(actions(i.say, 1)) + '</span></span><small>' + (c ? esc(c.n) : '') + '</small></button></li>'; }).join('') + '</ul>');
  h += sec('Who to call', (B.contacts || []).length, '', '<ul class="list">' + (B.contacts || []).map(function (c) { return '<li><a href="' + esc(c[2]) + '"><span>' + esc(cap(c[1])) + '</span><small>' + esc(c[0]) + '</small></a></li>'; }).join('') + '</ul>');
  if (DB) {
    var sn = seasonNow(); h += sec('In season · ' + cap(MON[M]), sn.length, 'What to look out for now.', '<ul class="list">' + sn.slice(0, 14).map(function (f) { return '<li><button data-sp="' + esc(f.id) + '"><span>' + esc(f.cn) + '</span><small>' + esc(f.event) + '</small></button></li>'; }).join('') + '</ul>');
    var by = {}; DB.field.forEach(function (f) { (by[f.g] = by[f.g] || []).push(f); });
    h += sec('Neighbours', DB.field.length, 'Every life met between Brunswick and the city, by kind.', Object.keys(KINDS).filter(function (g) { return by[g]; }).map(function (g) {
      return '<details class="sub"><summary><h4>' + KINDS[g] + ' · ' + by[g].length + '</h4></summary><p class="names">' + by[g].map(function (f) { return '<button data-sp="' + esc(f.id) + '" title="' + esc(bars(f.act, f.brd)) + '">' + esc(f.cn) + '</button>'; }).join('') + '</p></details>';
    }).join(''));
    var th = {}; DB.briefs.forEach(function (b) { (th[b.th] = th[b.th] || []).push(b); });
    h += sec('What worked elsewhere', DB.briefs.length, 'What other places did, with their sources.', Object.keys(th).map(function (k) {
      return '<details class="sub"><summary><h4>' + esc(THEMES[k] || cap(k)) + ' · ' + th[k].length + '</h4></summary><ul class="list">' + th[k].map(function (b) { return '<li><a href="' + esc(b.url) + '" target="_blank" rel="noopener"><span>' + esc(b.t) + '</span><small>' + esc((b.city || '') + ' ' + (b.yr || '')) + ' ↗</small></a></li>'; }).join('') + '</ul></details>';
    }).join(''));
  }
  return '<div class="idx">' + h + '</div>';
}
function results(t) {
  var res = [];
  ISSUES.forEach(function (i) { if (i.t.toLowerCase().indexOf(t) === 0 || i.re.test(t)) res.push({ s: 9, h: '<button data-is="' + i.k + '"><span>' + cap(i.t) + '</span><small>!</small></button>' }); });
  (B.contacts || []).forEach(function (c) { if (lower(c[1]).indexOf(t) >= 0) res.push({ s: 8, h: '<a href="' + esc(c[2]) + '"><span>' + esc(cap(c[1])) + '</span><small>' + esc(c[0]) + '</small></a>' }); });
  if (DB) {
    DB.field.forEach(function (f) { var s = lower(f.cn).indexOf(t) >= 0 ? 3 : lower(f.n).indexOf(t) >= 0 ? 2 : lower([f.g, KINDS[f.g], f.where, f.event].join(' ')).indexOf(t) >= 0 ? 1 : 0; if (s) res.push({ s: s, h: '<button data-sp="' + esc(f.id) + '"><span>' + esc(f.cn) + '</span><small>' + esc(KINDS[f.g] || f.g) + '</small></button>' }); });
    DB.briefs.forEach(function (b) { if (lower([b.t, b.i, b.city, b.th].join(' ')).indexOf(t) >= 0) res.push({ s: 0.5, h: '<a href="' + esc(b.url) + '" target="_blank" rel="noopener"><span>' + esc(b.t) + '</span><small>' + esc((b.city || '') + ' ' + (b.yr || '')) + ' ↗</small></a>' }); });
  }
  var stories = allStories().filter(function (n) { return !n.story && lower([n.say, n.cn, (n.tags || []).join(' '), (n.data || []).join(' ')].join(' ')).indexOf(t) >= 0; }).slice(0, 12);
  var thumbs = stories.length ? '<div class="strip">' + stories.map(function (n) { var pic = PHOTOS[n.id] || n.thumb || n.photoURL || n.icon || ''; return '<button data-st="' + esc(n.id) + '" style="' + (pic ? 'background-image:url(\'' + esc(pic) + '\')' : '') + '" aria-label="' + esc(n.say || n.cn || '') + '"><span>' + esc((n.cn || n.say || '').slice(0, 18)) + '</span></button>'; }).join('') + '</div>' : '';
  res.sort(function (a, b) { return b.s - a.s; });
  return thumbs + '<ul class="list">' + (res.slice(0, 40).map(function (r) { return '<li>' + r.h + '</li>'; }).join('') || '<li class="empty">—</li>') + '</ul>';
}
function wireGuide() {
  $$('#g-out [data-sp]').forEach(function (b) { b.addEventListener('click', function () { lifeSheet(b.dataset.sp); }); });
  $$('#g-out [data-is]').forEach(function (b) { b.addEventListener('click', function () { needSheet(b.dataset.is); }); });
  $$('#g-out [data-st]').forEach(function (b) { b.addEventListener('click', function () { var n = allStories().filter(function (x) { return x.id === b.dataset.st; })[0]; if (n) openNote(n); }); });
}
function bars(act, brd) { var s = ''; for (var i = 0; i < 12; i++) s += brd && brd[i] === 'B' ? '▾' : act && act[i] === 'A' ? '■' : act && act[i] === 'a' ? '▪' : '·'; return s; }
function monthsTable(f) {
  var row = function (label, fn) { var h = '<tr><th>' + label + '</th>'; for (var i = 0; i < 12; i++) h += '<td class="' + (i === M ? 'm ' : '') + fn(i) + '"></td>'; return h + '</tr>'; };
  var head = '<tr><th></th>' + MON.map(function (m, i) { return '<td class="' + (i === M ? 'm' : '') + '">' + m.charAt(0) + '</td>'; }).join('') + '</tr>';
  return '<table class="yr">' + head + row('Seen', function (i) { return f.act && f.act[i] === 'A' ? 'f2' : f.act && f.act[i] === 'a' ? 'f1' : ''; }) + row('Young', function (i) { return f.brd && f.brd[i] === 'B' ? 'f2' : ''; }) + '</table>';
}
function lifeSheet(id) {
  var f = DB.field.filter(function (x) { return x.id === id; })[0]; if (!f) return;
  var r = read({ id: 'q', say: '', tags: [], spId: id, lat: map.lat, lng: map.lng });
  var said = r.lines.map(function (l) { return l.t; }).join(' ');
  var lines = [f.aware, f.harm, f.help].filter(function (l) { return l && said.indexOf(l) < 0; });
  open('<div class="hd"><button class="back" aria-label="Back">←</button><span>' + esc(KINDS[f.g] || f.g) + '</span><button class="x" aria-label="Close">×</button></div>' +
    '<h2>' + esc(f.cn) + '</h2><p class="sci">' + esc(f.n) + '</p>' +
    '<dl class="spec"><dt>Status</dt><dd>' + esc(STATUS_OF[f.st] || f.st || '—') + '</dd><dt>Where</dt><dd>' + esc(f.where || '—') + '</dd>' + (f.event ? '<dt>Watch for</dt><dd>' + esc(f.event) + '</dd>' : '') + (f.heat ? '<dt>Heat</dt><dd>' + '■■■'.slice(0, f.heat) + '□□□'.slice(f.heat) + '</dd>' : '') + '</dl>' +
    monthsTable(f) + alertHTML(r) + '<ul class="plain">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
    (r.rel.length ? '<div class="lbl">Near it, now</div><ul class="list">' + r.rel.map(function (o) { return o.brief ? '<li><a href="' + esc(o.brief.url) + '" target="_blank" rel="noopener"><span>' + esc(o.label) + '</span><small>' + esc(o.sub) + ' ↗</small></a></li>' : '<li><button data-sp="' + esc(o.id) + '"><span>' + esc(o.label) + '</span><small>' + esc(o.sub) + '</small></button></li>'; }).join('') + '</ul>' : '') +
    '<label class="cam sm solo" aria-label="Photograph one"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="18" width="48" height="34" rx="2"/><path d="M22 18l4-7h12l4 7"/><circle cx="32" cy="35" r="10"/></svg><input class="shot" type="file" accept="image/*" capture="environment"></label>', false, 'wide');
  backTo(); $$('#sheet [data-sp]').forEach(function (b) { b.addEventListener('click', function () { lifeSheet(b.dataset.sp); }); });
  var inp = $('.shot', sheet); inp.addEventListener('change', function () { onShot(inp.files[0]); });
}
function needSheet(k) {
  var i = ISSUES.filter(function (x) { return x.k === k; })[0]; if (!i) return; var c = callOf(i.call);
  var lives = DB ? related(null, null, i).map(function (f) { return '<li><button data-sp="' + esc(f.id) + '"><span>' + esc(f.cn) + '</span><small>' + esc(KINDS[f.g] || f.g) + '</small></button></li>'; }).join('') : '';
  var cs = caseOf(null, i);
  open('<div class="hd"><button class="back" aria-label="Back">←</button><span>If you find</span><button class="x" aria-label="Close">×</button></div><h2>' + esc(i.t.charAt(0) + i.t.slice(1).toLowerCase()) + '</h2>' +
    '<div class="alert"><p>' + esc(i.say) + '</p>' + (c ? '<a class="call" href="' + esc(c.tel) + '"><b>' + esc(c.label) + '</b><span>' + esc(c.n) + '</span></a>' : '') + '</div>' +
    (lives ? '<div class="lbl">Most at stake now</div><ul class="list">' + lives + '</ul>' : '') +
    (cs ? '<div class="lbl">What worked elsewhere</div><ul class="list"><li><a href="' + esc(cs.url) + '" target="_blank" rel="noopener"><span>' + esc(cs.t) + '<br><small>' + esc(cs.fact || '') + '</small></span><small>' + esc((cs.city || '') + ' ' + (cs.yr || '')) + ' ↗</small></a></li></ul>' : ''), false, 'wide');
  backTo(); $$('#sheet [data-sp]').forEach(function (b) { b.addEventListener('click', function () { lifeSheet(b.dataset.sp); }); });
}
function backTo() { var b = $('#sheet .back'); if (b) b.addEventListener('click', function () { guideSheet(''); }); }

/* ───────── the map is a key: the ground, the knots, a touch to place one, and many at once: photographs, calls, icons ───────── */
/* ───────── the map is a key: the ground, what is about, everyone's noticings and one's own, the net between them. A touch on open
   ground places a noticing; + adds many at once: photographs, calls, icons ───────── */
function mapOn(on) {
  document.body.classList.toggle('mapmode', on); $('#b-map').classList.toggle('on', on); if (on && !sheet.hidden) close();
  net.all = on; net.live = on; credit(); tipEl.hidden = true;
  if (on) { render(); db().then(function () { return Promise.all([loadShared(), loadLive(map.lat, map.lng)]); }).then(function () { var l = everything().filter(function (n) { return isFinite(n.lat) && dist(n, map) < 2500; }); if (l.length) fit(l); else render(); }); } else render();
}
function batch(files) {
  var list = Array.prototype.slice.call(files || []); if (!list.length) return; var done = 0;
  var add = function (n) { NOTES.unshift(n); done++; if (done === list.length) { saveNotes(); net.fresh = n.id; render(); toast('+' + done); } };
  list.forEach(function (file, k) {
    var base = { id: 'n' + Date.now().toString(36) + k, at: file.lastModified || Date.now(), lat: map.lat + (k % 5) * 0.0004, lng: map.lng + Math.floor(k / 5) * 0.0004, say: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), tags: [], mine: true };
    base.code = code(base.id);
    if (/^audio\//.test(file.type)) { base.tags = ['CALL']; base.call = 1; if (file.size < 300e3) { var fa = new FileReader(); fa.onload = function () { base.audio = fa.result; add(base); }; fa.onerror = function () { add(base); }; fa.readAsDataURL(file); } else { AUDIO[base.id] = URL.createObjectURL(file); add(base); } return; }
    if (!/^image\//.test(file.type)) { done++; return; }
    var icon = /svg/.test(file.type) || /icon|sticker|glyph/i.test(file.name);
    var fr = new FileReader(); fr.onload = function () {
      var ex = icon ? {} : exif(fr.result); var url = URL.createObjectURL(file);
      loadImg(url).then(function (im) {
        if (ex.lat != null) { base.lat = ex.lat; base.lng = ex.lng; } if (ex.t) base.at = ex.t;
        if (icon) { base.icon = shrink(im, 64, 0.9).replace('image/jpeg', 'image/jpeg'); base.tags = ['ICON']; } else { base.thumb = shrink(im, 220, 0.7); PHOTOS[base.id] = shrink(im, 900, 0.78); }
        URL.revokeObjectURL(url); add(base);
      }).catch(function () { done++; });
    };
    fr.readAsArrayBuffer(file.slice(0, 256 * 1024));
  });
}
var AUDIO = {};
/* a touch on open ground, with the map out: a noticing there, without a photograph */
function placeAt(lat, lng) { cur = { id: 'n' + Date.now().toString(36), at: Date.now(), photo: '', thumb: '', say: '', tags: [], mine: true, lat: lat, lng: lng, src: 'TAP' }; db(); stepW(); }

/* ───────── RADIO: the showcase and the emergency line. The numbers that matter on top; a four-track below, placed on like tape:
   arm a track, record, and every life the radar passes or the hand touches lands on the beat as a note of its kind; what is about
   below, as photographs. A song is kept, played back, and taken away as a sound file ───────── */
function loadShared() {
  return api('/stories').then(function (j) {
    WISHES = [];
    SHARED = ((j && j.stories) || []).map(function (s) {
      if (s.kind === 'record') { try { var d = JSON.parse(s.body);
        if (d.type === 'wish') { WISHES.push({ id: 's' + s.id, re: d.re, lines: d.lines || [], at: s.at }); return null; }
        if (!isFinite(+d.lat) || d.type === 'poster' || d.type === 'web') return null; return { id: 's' + s.id, code: s.code, at: s.at, lat: +d.lat, lng: +d.lng, say: d.text || '', cn: d.tx ? d.tx.cn : '', sci: d.tx ? d.tx.n : '', sp: '', g: d.g || '', issue: d.issue || '', tags: d.tags || [], data: d.data || [], wishText: d.wish || null, booth: d.type === 'booth', photoURL: s.photo ? API + '/photos/' + s.id : '', thumb: '' }; } catch (e) { return null; } }
      return null;
    }).filter(Boolean);
    if (DB) SHARED.forEach(function (x) { if (x.cn && !x.sp) { var f = DB.field.filter(function (ff) { return ff.cn === x.cn; })[0]; if (f) x.sp = f.id; } });
  }).catch(function () { /* no signal: what is here stands */ });
}
var WISHES = [];
var LIVE = [], liveAt = '';
var ICON_G = { Aves: 'bird', Mammalia: 'possum', Amphibia: 'frog', Reptilia: 'lizard', Insecta: 'bee', Arachnida: 'spider', Mollusca: 'snail', Plantae: 'plant', Fungi: 'plant', Actinopterygii: 'turtle' };
function loadLive(lat, lng) {
  var key = lat.toFixed(2) + ',' + lng.toFixed(2); if (liveAt === key) return Promise.resolve(LIVE);
  if (!B.inat) return Promise.resolve([]);
  var d1 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  return fetch(B.inat + '/observations?lat=' + lat.toFixed(4) + '&lng=' + lng.toFixed(4) + '&radius=2&per_page=60&order=desc&order_by=observed_on&photos=true&d1=' + d1 + '&locale=en')
    .then(function (r) { return r.json(); }).then(function (j) {
      var got = ((j && j.results) || []).map(function (o) {
        var c = o.geojson && o.geojson.coordinates, tx = o.taxon || {}, ph = (o.photos || [])[0]; if (!c) return null;
        return { id: 'i' + o.id, inat: o.id, live: true, lat: +c[1], lng: +c[0], cn: tx.preferred_common_name || tx.name || '', sci: tx.name || '', g: ICON_G[tx.iconic_taxon_name] || 'bird',
          at: Date.parse(o.time_observed_at || o.observed_on) || 0, photoURL: ph && ph.license_code ? String(ph.url).replace('square', 'small') : '', credit: ph ? ph.attribution || '' : '', url: o.uri || '' };
      }).filter(Boolean);
      var seen = {}; LIVE.forEach(function (x) { seen[x.id] = 1; }); got.forEach(function (x) { if (!seen[x.id]) LIVE.push(x); }); if (LIVE.length > 400) LIVE = LIVE.slice(-400);
      liveAt = key; return LIVE;
    }).catch(function () { return LIVE; });
}
var ago = function (t) { var d = (Date.now() - t) / 36e5; return d < 1 ? Math.max(1, Math.round(d * 60)) + ' min' : d < 48 ? Math.round(d) + ' h' : Math.round(d / 24) + ' d'; };
function everything() { return allStories().concat(LIVE).filter(function (n) { return !webSets().length || inSets(n.id) || WEB.nodes[n.id]; }).sort(function (a, b) { return b.at - a.at; }); }
var radioWay = 'live';
function radioSheet(way) {
  radioWay = way || radioWay; net.all = true; net.live = true; net.focus = null; net.links = [];
  open('<div class="pin">' + head('radio', '<span class="sp"></span><button class="g mn" id="r-min" aria-label="Fold away, to see the map" title="Fold away, to see the map">–</button>') + '</div>' +
    '<div id="deck-wrap"></div>' +
    '<div class="seg" id="r-way"><button class="g" data-w="live" aria-label="What is about" title="What is about">' + glyph('tiles') + '</button><button class="g" data-w="sets" aria-label="Collections and the web" title="Collections and the web">' + glyph('jelly') + '</button><button class="g hi" data-w="help" aria-label="Help" title="Help">' + glyph('sos') + '</button></div>' +
    '<div class="chips" id="r-sets"></div><div id="r-body"></div>', true);
  deck($('#deck-wrap'));
  $('#r-min').addEventListener('click', function () { var m = !sheet.classList.contains('min'); sheet.classList.toggle('min', m); document.body.classList.toggle('sheetmin', m); this.textContent = m ? '+' : '–';
    /* what was centred above the sheet is centred on the whole screen, and back */
    var wide = innerWidth >= 760, d = (m ? -1 : 1) * (wide ? 220 : map.h * 0.3); if (wide) map.lng = ux(wx(map.lng, map.z) + d, map.z); else map.lat = uy(wy(map.lat, map.z) + d, map.z); render(); });
  $$('#r-way [data-w]').forEach(function (b) { b.classList.toggle('on', b.dataset.w === radioWay); b.addEventListener('click', function () { radioWay = b.dataset.w; $$('#r-way [data-w]').forEach(function (o) { o.classList.toggle('on', o === b); }); paint(); }); });
  var body = $('#r-body');
  var chips = function () {
    var el = $('#r-sets'); if (!el) return;
    el.innerHTML = webSets().map(function (s, i) { return '<button data-x="' + i + '" title="Take this set off">≈ ' + esc(s.t) + ' <i>' + s.ids.length + '</i> ×</button>'; }).join('');
    $$('[data-x]', el).forEach(function (b) { b.addEventListener('click', function () { WEB.sets.splice(+b.dataset.x, 1); saveWeb(); paint(); render(); }); });
  };
  var paint = function () {
    if (!document.contains(body)) return; chips();
    if (radioWay === 'help') { body.innerHTML = '<ul class="list" style="margin-top:10px">' + nowItems().map(function (i) { return '<li class="urgent"><p><b>' + esc(i.k) + '</b> ' + esc(i.t) + '</p></li>'; }).join('') + '</ul>' + helpHTML(); render(); return; }
    if (radioWay === 'sets') {
      /* what will print or download: the web as it stands, drawn as it will be. Then every collection, each with its own shape;
         one touched is added to the web and kept, another touched adds to it, × takes one off */
      var sets = collections(), on = function (c) { return webSets().some(function (s) { return s.k === c.k; }); };
      body.innerHTML = '<div class="art-pv" id="r-pv">' + (Object.keys(WEB.nodes).length || webSets().length ? '<canvas></canvas>' : '<p class="empty">· · ·</p>') + '</div>' +
        '<div class="row"><button class="g" id="r-dl" aria-label="Download the web" title="Download the web">⇩</button><button class="g" id="r-pr" aria-label="Print the web" title="Print the web">' + glyph('print') + '</button><span id="r-pst"></span></div>' +
        (sets.length ? '<ul class="list sets">' + sets.map(function (c, i) { return '<li><button data-c="' + i + '" class="' + (on(c) ? 'on' : '') + '">' + shapeSVG(c.pts) + '<span>' + esc(c.t) + '</span><small>' + c.ids.length + (on(c) ? ' ✓' : ' +') + '</small></button></li>'; }).join('') + '</ul>' : '<p class="empty">· · ·</p>');
      $$('[data-c]', body).forEach(function (b) { b.addEventListener('click', function () { var c = sets[+b.dataset.c]; if (on(c)) WEB.sets = webSets().filter(function (s) { return s.k !== c.k; }); else WEB.sets.push(c); saveWeb(); paint(); fit(everything()); sheet.scrollTop = 0; }); });
      var cv = $('#r-pv canvas'); if (cv) webArt({ S: 720, colour: true }).then(function (art) { if (!document.contains(cv)) return; cv.width = art.width; cv.height = art.height; cv.getContext('2d').drawImage(art, 0, 0); });
      $('#r-dl').addEventListener('click', function () { webArt({ S: 1600, colour: true }).then(function (art) { download(art, 'novel-global-web.png'); }); });
      $('#r-pr').addEventListener('click', function () { var st = $('#r-pst'); st.innerHTML = pips('sending'); webArt({ S: 512, colour: false }).then(function (art) {
        var id = 'w' + Date.now().toString(36), body2 = { type: 'web', lat: +map.lat.toFixed(4), lng: +map.lng.toFixed(4) };
        return send({ kind: 'record', code: code(id), body: JSON.stringify(body2), lat: body2.lat, lng: body2.lng, dest: 'novelglobal', escpos: raster(art) }).then(function (j) { var n = { sent: { id: j.id, s: j.job ? j.job.status : j.status } }; st.innerHTML = pips(n.sent.s); follow(n, st); });
      }).catch(function (e) { st.innerHTML = pips(e && e.status ? 'failed' : 'outbox'); }); });
      render(); return;
    }
    var all = everything().slice(0, 60);
    body.innerHTML = all.length ? '<div class="tiles">' + all.map(function (n, i) { var pic = PHOTOS[n.id] || n.thumb || n.photoURL || n.icon || ''; return '<button data-i="' + i + '" id="t-' + esc(n.id) + '"' + (pic ? ' style="background-image:url(\'' + esc(pic) + '\')"' : '') + ' class="' + (n.mine ? 'mine' : '') + (WEB.nodes[n.id] ? ' seen' : '') + '" title="' + esc(nameOf(n) + ' · ' + ago(n.at)) + '"><span><i class="dot" style="background:' + toneOf(n) + '"></i>' + esc(nameOf(n)) + '</span></button>'; }).join('') + '</div>' : '<p class="empty">· · ·</p>';
    $$('.tiles button', body).forEach(function (b) { b.addEventListener('click', function () { var n = all[+b.dataset.i]; if (SEQ.rec && placeNote(n)) { lit(n); return; } peek(n); lit(n); }); });
    render();
  };
  paint();
  /* tuned to the last place noticed, else where the map is */
  var here = NOTES[0] && isFinite(NOTES[0].lat) && NOTES[0].mine !== false ? NOTES[0] : { lat: map.lat, lng: map.lng };
  db().then(function () { return Promise.all([loadShared(), loadLive(here.lat, here.lng)]); }).then(function () { paint(); if (!webSets().length) { var l = everything().filter(function (n) { return isFinite(n.lat) && dist(n, here) < 2500; }); if (l.length) fit(l); } else fit(everything()); });
}
/* collections: what was noticed and what is about, gathered by life, by need and by place. Each keeps its cells, so its shape
   stays drawable when what is about has moved on */
function collections() {
  var by = {}, add = function (k, t, n) { var c = by[k] = by[k] || { k: k, t: t, ids: [], pts: [] }; c.ids.push(n.id); if (isFinite(n.lat)) c.pts.push({ id: n.id, lat: +n.lat, lng: +n.lng, at: n.at || 0, cn: n.cn || '', g: gOf(n), mine: !!n.mine }); };
  allStories().concat(LIVE).forEach(function (n) {
    if (n.cn) add('sp:' + n.cn, n.cn, n);
    if (n.issue) { var i = ISSUES.filter(function (x) { return x.k === n.issue; })[0]; if (i) add('is:' + i.k, cap(i.t), n); }
    if (n.data && n.data[0]) add('pl:' + n.data[0], cap(n.data[0]), n);
  });
  return Object.keys(by).map(function (k) { return by[k]; }).filter(function (c) { return c.ids.length > 1; }).sort(function (a, b) { return b.ids.length - a.ids.length; }).slice(0, 30);
}
/* a set's own shape: its cells where they are, joined in the order they were seen, each in the tone of its kind */
function shapeSVG(pts) {
  pts = (pts || []).slice().sort(function (a, b) { return a.at - b.at; }); if (!pts.length) return '<svg class="shape" viewBox="0 0 60 36"></svg>';
  var la = pts.map(function (p) { return p.lat; }), lo = pts.map(function (p) { return p.lng; }), s = Math.min.apply(null, la), n = Math.max.apply(null, la), w = Math.min.apply(null, lo), e = Math.max.apply(null, lo);
  var k = Math.min(52 / ((e - w) || 1e-9), 28 / ((n - s) || 1e-9)), xy = pts.map(function (p) { return [4 + (p.lng - w) * k + (52 - (e - w) * k) / 2, 4 + (n - p.lat) * k + (28 - (n - s) * k) / 2]; });
  return '<svg class="shape" viewBox="0 0 60 36" aria-hidden="true"><polyline points="' + xy.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>' + xy.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="1.8" fill="' + (TONE[pts[i].g] || '#A89A86') + '"/>'; }).join('') + '</svg>';
}
/* the web as art, for the paper and the file: laid out by d3-force, so what is tied pulls together and what is not stands apart
   (each cell still drawn toward where it is), and drawn by hand with Rough.js, as the sticks of a chart are bent and lashed.
   Without either it is drawn plain, where things are */
var libP = {};
function lib(name, test) { if (test()) return Promise.resolve(true); if (!libP[name]) libP[name] = new Promise(function (res) { var sc = document.createElement('script'); sc.src = 'vendor/' + name + '.js'; sc.onload = function () { res(!!test()); }; sc.onerror = function () { res(false); }; document.head.appendChild(sc); }); return libP[name]; }
function webArt(o) {
  o = o || {}; var S = o.S || 1080, colour = o.colour !== false;
  return Promise.all([lib('d3-force', function () { return window.d3 && window.d3.forceSimulation; }), lib('rough', function () { return window.rough; })]).then(function () {
    var N = {}, add = function (p) { if (p && isFinite(p.lat) && !N[p.id]) N[p.id] = { id: p.id, lat: p.lat, lng: p.lng, cn: p.cn || '', g: p.g || 'bird', mine: !!p.mine, at: p.at || 0 }; };
    Object.keys(WEB.nodes).forEach(function (id) { add(WEB.nodes[id]); }); webSets().forEach(function (s) { (s.pts || []).forEach(add); });
    var nodes = Object.keys(N).map(function (k) { return N[k]; }).slice(-90), at = {}; nodes.forEach(function (n) { at[n.id] = n; });
    var links = webEdges().filter(function (e) { return at[e[0]] && at[e[1]]; }).map(function (e) { return { source: e[0], target: e[1], k: e[2] }; });
    webSets().forEach(function (s) { var p = (s.pts || []).filter(function (q) { return at[q.id]; }).sort(function (a, b) { return a.at - b.at; }); for (var i = 1; i < p.length; i++) links.push({ source: p[i - 1].id, target: p[i].id, k: 'set' }); });
    var W = S, H = Math.round(S * 1.25), m = S * 0.1, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    var ink = colour ? '#1E1A16' : '#000', paper = colour ? '#EDEBE4' : '#fff', stickC = colour ? '#8A6236' : '#000';
    x.fillStyle = paper; x.fillRect(0, 0, W, H);
    if (!nodes.length) return c;
    var la = nodes.map(function (n) { return n.lat; }), lo = nodes.map(function (n) { return n.lng; }), s0 = Math.min.apply(null, la), n0 = Math.max.apply(null, la) + 1e-6, w0 = Math.min.apply(null, lo), e0 = Math.max.apply(null, lo) + 1e-6;
    nodes.forEach(function (n) { n.gx = m + (n.lng - w0) / (e0 - w0) * (W - 2 * m); n.gy = m + (n0 - n.lat) / (n0 - s0) * (H - 2.6 * m); n.x = n.gx; n.y = n.gy; });
    var d3 = window.d3;
    if (d3 && d3.forceSimulation) {
      var sim = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(function (l) { return S * (l.k === 'kin' ? 0.05 : l.k === 'trail' ? 0.09 : 0.12); }).strength(function (l) { return l.k === 'kin' ? 0.8 : 0.4; }))
        .force('charge', d3.forceManyBody().strength(-S * 0.04)).force('x', d3.forceX(function (d) { return d.gx; }).strength(0.06)).force('y', d3.forceY(function (d) { return d.gy; }).strength(0.06)).force('collide', d3.forceCollide(S * 0.012)).stop();
      for (var i = 0; i < 300; i++) sim.tick();
      var xs = nodes.map(function (n) { return n.x; }), ys = nodes.map(function (n) { return n.y; }), bx0 = Math.min.apply(null, xs), bx1 = Math.max.apply(null, xs), by0 = Math.min.apply(null, ys), by1 = Math.max.apply(null, ys), k = Math.min((W - 2 * m) / ((bx1 - bx0) || 1), (H - 2.6 * m) / ((by1 - by0) || 1));
      nodes.forEach(function (n) { n.x = m + (n.x - bx0) * k + ((W - 2 * m) - (bx1 - bx0) * k) / 2; n.y = m + (n.y - by0) * k; });
    }
    var rc = window.rough ? window.rough.canvas(c) : null, seed = 7, lw = S / 600;
    var line = function (a, b, w, bow) { if (rc) rc.line(a.x, a.y, b.x, b.y, { stroke: stickC, strokeWidth: w * lw, roughness: 1.3, bowing: bow, seed: seed++ }); else { x.strokeStyle = stickC; x.lineWidth = w * lw; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } };
    links.forEach(function (l) { var a = typeof l.source === 'object' ? l.source : at[l.source], b = typeof l.target === 'object' ? l.target : at[l.target]; if (a && b) line(a, b, l.k === 'kin' ? 2.2 : l.k === 'set' ? 1.6 : 1.2, l.k === 'kin' ? 3 : 0.8); });
    /* jellyfish over three or more of one life */
    var byLife = {}; nodes.forEach(function (n) { if (n.cn) (byLife[n.cn] = byLife[n.cn] || []).push(n); });
    Object.keys(byLife).filter(function (k2) { return byLife[k2].length >= 3; }).slice(0, 4).forEach(function (k2) {
      var g = byLife[k2], gx = g.map(function (n) { return n.x; }), cx = (Math.min.apply(null, gx) + Math.max.apply(null, gx)) / 2, rx = Math.min(S * 0.14, S * 0.03 + g.length * S * 0.012), top = Math.min.apply(null, g.map(function (n) { return n.y; })) - rx * 1.1, tone = colour ? (TONE[g[0].g] || '#A89A86') : '#000';
      if (rc) rc.arc(cx, top, rx * 2, rx * 1.3, Math.PI, Math.PI * 2, true, { stroke: stickC, strokeWidth: 1.4 * lw, fill: tone, fillStyle: colour ? 'solid' : 'hachure', hachureGap: 4 * lw, roughness: 1.1, seed: seed++ });
      x.strokeStyle = stickC; x.lineWidth = 1.1 * lw; x.setLineDash([1, 4 * lw]); g.forEach(function (n, q) { var sx = cx - rx * 0.8 + rx * 1.6 * (g.length > 1 ? q / (g.length - 1) : 0.5); x.beginPath(); x.moveTo(sx, top); x.lineTo(n.x, n.y); x.stroke(); }); x.setLineDash([]);
    });
    nodes.forEach(function (n) { var r = (n.mine ? 7 : 5) * lw, tone = colour ? (TONE[n.g] || '#A89A86') : '#000'; if (rc) rc.circle(n.x, n.y, r * 2, { fill: tone, fillStyle: 'solid', stroke: ink, strokeWidth: 0.8 * lw, roughness: 0.6, seed: seed++ }); else { x.fillStyle = tone; x.beginPath(); x.arc(n.x, n.y, r, 0, 7); x.fill(); } });
    x.fillStyle = ink; x.font = Math.round(S * 0.022) + 'px ui-monospace, Menlo, monospace'; x.textBaseline = 'alphabetic';
    var cap1 = nodes.length + ' · ' + links.length + ' · ' + when(Date.now()), cap2 = 'novel.global';
    x.fillText(webSets().map(function (s) { return s.t; }).join(' · ').slice(0, 60), m, H - m * 0.9); x.fillText(cap1, m, H - m * 0.55); x.fillText(cap2, W - m - x.measureText(cap2).width, H - m * 0.55);
    return c;
  });
}
function fit(list) {
  list = list.filter(function (n) { return isFinite(n.lat); }); if (!list.length) return;
  var la = list.map(function (n) { return n.lat; }), lo = list.map(function (n) { return n.lng; });
  var s = Math.min.apply(null, la), nn = Math.max.apply(null, la), w = Math.min.apply(null, lo), e = Math.max.apply(null, lo);
  var wide = innerWidth >= 760; var z = 17; while (z > 11 && (wx(e, z) - wx(w, z) > (wide ? map.w - 520 : map.w * 0.8) || wy(s, z) - wy(nn, z) > (wide ? map.h * 0.7 : map.h * 0.28))) z--;
  focusOn((s + nn) / 2, (w + e) / 2, z);
}

/* ───────── the sound, after the Akira soundtrack's gamelan, jegog, chant and kecak: five voices made in the browser, tuned to pelog
   or slendro, through a dark room ───────── */
var AC = null;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }
var SCALES = { pelog: [0, 1, 3, 7, 8], slendro: [0, 2.4, 4.8, 7.2, 9.6] };
function noiseBuf(c) { if (c.__nb) return c.__nb; var b = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; c.__nb = b; return b; }
function env(c, g, t, peak, a, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
function noiseHit(c, out, t, freq, dec, v) { var s = c.createBufferSource(); s.buffer = noiseBuf(c); var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.4; var g = c.createGain(); env(c, g, t, v, 0.002, dec); s.connect(bp); bp.connect(g); g.connect(out); s.start(t); s.stop(t + dec + 0.05); }
function osc(c, out, type, f, t, peak, a, dec, det) { var o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; env(c, g, t, peak, a, dec); o.connect(g); g.connect(out); o.start(t); o.stop(t + a + dec + 0.05); return o; }
var INS = {
  gamelan: { g: '◇', base: 392, fn: function (c, out, t, f, L, v) { [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]].forEach(function (p, i) { [0, 4.5].forEach(function (b) { osc(c, out, 'sine', f * p[0] + b, t, v * p[1] * 0.11, 0.004, (1.8 - i * 0.35) * L); }); }); } },
  jegog: { g: '‖', base: 98, fn: function (c, out, t, f, L, v) { osc(c, out, 'sine', f, t, v * 0.32, 0.003, 0.9 * L); osc(c, out, 'sine', f * 3.9, t, v * 0.1, 0.003, 0.35 * L); noiseHit(c, out, t, 2200, 0.03, v * 0.15); } },
  voice: { g: '∿', base: 196, fn: function (c, out, t, f, L, v) {
    var d = 0.7 * L + 0.3, g = c.createGain(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.frequency.value = 700; f2.frequency.value = 1150; f1.Q.value = f2.Q.value = 5;
    var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.2; lg.gain.value = f * 0.006; lfo.connect(lg);
    [-8, 8].forEach(function (ct) { var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = ct; lg.connect(o.frequency); o.connect(f1); o.connect(f2); o.start(t); o.stop(t + d + 0.1); });
    f1.connect(g); f2.connect(g); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.6, t + 0.09); g.gain.setValueAtTime(v * 0.6, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d); lfo.start(t); lfo.stop(t + d + 0.1); } },
  chak: { g: '⁘', base: 0, fn: function (c, out, t, f, L, v) { noiseHit(c, out, t, 1600 + f, 0.05 * L + 0.03, v * 0.9); } },
  taiko: { g: '◉', base: 55, fn: function (c, out, t, f, L, v) { var o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 2.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.18); env(c, g, t, v * 0.85, 0.004, 0.55 * L + 0.2); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.9 * L + 0.4); noiseHit(c, out, t, 400, 0.08, v * 0.3); } },
};
var INS_K = ['gamelan', 'jegog', 'voice', 'chak', 'taiko'];
function bus(c) {
  if (c.__bus) return c.__bus;
  var m = c.createGain(); m.gain.value = 0.8; var comp = c.createDynamicsCompressor(); var rv = c.createConvolver(), n = Math.floor(c.sampleRate * 2.6), ir = c.createBuffer(2, n, c.sampleRate);
  for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
  rv.buffer = ir; var wet = c.createGain(); wet.gain.value = 0.32; m.connect(comp); m.connect(rv); rv.connect(wet); wet.connect(comp); comp.connect(c.destination); c.__bus = m; return m;
}
/* the song: four tracks of sixteen steps, each step empty or a degree of the scale */
var PITCH = { bird: 6, parrot: 8, owl: 3, raptor: 5, waterbird: 4, flyingfox: 5, bat: 9, possum: 2, macropod: 0, frog: 3, lizard: 1, snake: 0, turtle: 1, bee: 9, butterfly: 8, moth: 7, spider: 6, snail: 1, plant: 0 };
var deg = function (g) { return PITCH[g] != null ? PITCH[g] : 5; };
var gOf = function (n) { return n.g || (DB && n.sp ? (DB.field.filter(function (f) { return f.id === n.sp; })[0] || {}).g : '') || 'bird'; };
var blank = function () { var a = []; for (var i = 0; i < 16; i++) a.push(null); return a; };
function newSong() { return { bpm: 104, scale: 'pelog', tracks: INS_K.slice(0, 4).map(function (k, i) { return { ins: k, vol: 1, oct: 0, len: i === 2 ? 1 : 0, mute: false, steps: blank() }; }) }; }
/* every note is a cell on the map: its pitch from its kind, its id and name kept, so nothing sounds that is not there */
var tied = function (song) { (song.tracks || []).forEach(function (tr) { tr.steps = (tr.steps || blank()).map(function (x) { return x && typeof x === 'object' && x.id ? x : null; }); }); return song; };
var SONG = tied(store.get('da.base.song', null) || newSong());
var SONGS = store.get('da.base.songs', []).map(function (s) { s.song = tied(s.song); return s; });
var saveSong = function () { store.set('da.base.song', SONG); };
function noteAt(c, tr, d, t, out) { var I = INS[tr.ins]; var f = I.base ? I.base * Math.pow(2, (tr.oct * 12 + Math.floor(d / 5) * 12 + SCALES[SONG.scale][d % 5]) / 12) : d * 120; I.fn(c, out || bus(c), t, f, tr.len ? 1.7 : 0.75, [0.3, 0.55, 0.9][tr.vol]); }
function pluck(n) { var c = ac(); noteAt(c, SONG.tracks[SEQ.arm], deg(gOf(n)), c.currentTime + 0.01); }
var SEQ = { on: false, step: 0, cur: 0, next: 0, timer: 0, rec: false, arm: 0, open: -1 };
var stepDur = function (s) { return 60 / (s || SONG).bpm / 4; };
function seqStart() { var c = ac(); SEQ.on = true; SEQ.step = 0; SEQ.next = c.currentTime + 0.06; clearInterval(SEQ.timer); SEQ.timer = setInterval(seqTick, 25); paintDeck(); }
function seqStop() { SEQ.on = false; clearInterval(SEQ.timer); paintDeck(); }
function seqTick() {
  var c = AC; while (SEQ.next < c.currentTime + 0.12) {
    var s = SEQ.step, t = SEQ.next;
    SONG.tracks.forEach(function (tr) { var d = tr.steps[s]; if (d && !tr.mute) noteAt(c, tr, d.d, t); });
    setTimeout(function () { SEQ.cur = s; showStep(s); }, Math.max(0, (t - c.currentTime) * 1000));
    SEQ.next += stepDur(); SEQ.step = (SEQ.step + 1) % 16;
  }
}
function showStep(s) { $$('#deck .cells').forEach(function (row) { var b = row.children; for (var i = 0; i < b.length; i++) b[i].classList.toggle('now', i === s); }); }
/* placing, like tape: armed and recording, a life lands on the step now sounding, as a note of its kind */
function placeNote(n, at) {
  if (!n || (!SEQ.rec && at == null)) return false; if (!SEQ.on) seqStart();
  var tr = SONG.tracks[SEQ.arm], st = at == null ? SEQ.cur : at; tr.steps[st] = { d: deg(gOf(n)), id: n.id, g: gOf(n), t: nameOf(n) }; saveSong(); noteAt(ac(), tr, tr.steps[st].d, AC.currentTime + 0.01); attend(n); paintDeck(); return true;
}
function lit(n) { $$('.tiles button.on').forEach(function (b) { b.classList.remove('on'); }); var t = document.getElementById('t-' + n.id); if (t) t.classList.add('on'); }
var deckEl = null, insTap = { i: -1, t: 0 };
function deck(el) { deckEl = el; paintDeck(); }
var songEmpty = function () { return !SONG.tracks.some(function (tr) { return tr.steps.some(function (x) { return !!x; }); }); };

function paintDeck() {
  if (!deckEl || !document.contains(deckEl)) return;
  var h = '<div class="tport"><button class="g rec' + (SEQ.rec ? ' on' : '') + '" id="d-rec" aria-label="Record" title="Record">●</button><button class="g" id="d-play" aria-label="Play" title="Play">' + (SEQ.on ? '■' : '▶') + '</button>' +
    '<button class="g' + (radar.on ? ' on' : '') + '" id="d-radar" aria-label="Radar" title="Radar">◎</button><button class="g" id="d-clear" aria-label="Clear the armed track" title="Clear the armed track">⌫</button>' +
    '<button class="g" id="d-wav" aria-label="Keep and download" title="Keep and download">⇩</button></div>';
  h += '<div class="deck" id="deck">' + SONG.tracks.map(function (tr, i) {
    var row = '<div class="tr"><button class="ins' + (SEQ.arm === i ? ' arm' : '') + (tr.mute ? ' mute' : '') + '" data-t="' + i + '" aria-label="' + tr.ins + '" title="' + tr.ins + ' · double-tap for its settings">' + INS[tr.ins].g + '</button><div class="cells" data-t="' + i + '">' +
      tr.steps.map(function (d, s) { return '<button data-s="' + s + '"' + (d ? ' class="n" style="--tone:' + (TONE[d.g] || '#A89A86') + '" title="' + esc(d.t) + '"' : '') + ' aria-label="step ' + (s + 1) + (d ? ': ' + esc(d.t) : '') + '"></button>'; }).join('') + '</div></div>';
    if (SEQ.open === i) row += '<div class="tr"><span></span><div class="set">' + INS_K.map(function (k) { return '<button data-ins="' + k + '" class="' + (tr.ins === k ? 'on' : '') + '" title="' + k + '">' + INS[k].g + '</button>'; }).join('') +
      '<span class="v">·</span>' + [0, 1, 2].map(function (v) { return '<button data-vol="' + v + '" class="' + (tr.vol === v ? 'on' : '') + '" title="volume">' + '▮▮▮'.slice(0, v + 1) + '</button>'; }).join('') +
      '<span class="v">·</span><button data-oct="-1" title="lower">−</button><span class="v">' + (tr.oct > 0 ? '+' : '') + tr.oct + '</span><button data-oct="1" title="higher">+</button>' +
      '<span class="v">·</span><button data-len class="' + (tr.len ? 'on' : '') + '" title="long or short">' + (tr.len ? '━' : '╸') + '</button><button data-mute class="' + (tr.mute ? 'on' : '') + '" title="mute">∅</button></div></div>';
    return row;
  }).join('') + '<div class="glob"><button id="d-slow" title="slower">−</button><span class="v">' + SONG.bpm + '</span><button id="d-fast" title="faster">+</button><span class="v">·</span><button id="d-scale" title="' + SONG.scale + '">' + (SONG.scale === 'pelog' ? '5̇' : '5') + '</button></div></div>';
  h += SONGS.length ? '<ul class="songs">' + SONGS.map(function (s, i) { return '<li><button class="t" data-load="' + i + '">♪ ' + esc(when(s.at)) + '</button><button class="g" data-wav="' + i + '" title="Download as sound">⇩</button><button class="g" data-del="' + i + '" title="Remove">×</button></li>'; }).join('') + '</ul>' : '';
  deckEl.innerHTML = h;
  var q = function (s) { return deckEl.querySelector(s); };
  q('#d-rec').addEventListener('click', function () { SEQ.rec = !SEQ.rec; if (SEQ.rec && !SEQ.on) seqStart(); paintDeck(); });
  q('#d-play').addEventListener('click', function () { if (SEQ.on) seqStop(); else seqStart(); });
  q('#d-radar').addEventListener('click', function () { radarOn(!radar.on); paintDeck(); });
  q('#d-clear').addEventListener('click', function () { SONG.tracks[SEQ.arm].steps = blank(); saveSong(); paintDeck(); });
  q('#d-wav').addEventListener('click', function () { if (!songEmpty()) { SONGS.unshift({ at: Date.now(), song: JSON.parse(JSON.stringify(SONG)) }); if (SONGS.length > 12) SONGS.pop(); store.set('da.base.songs', SONGS); } wavOf(SONG); paintDeck(); });
  q('#d-slow').addEventListener('click', function () { SONG.bpm = Math.max(60, SONG.bpm - 8); saveSong(); paintDeck(); });
  q('#d-fast').addEventListener('click', function () { SONG.bpm = Math.min(180, SONG.bpm + 8); saveSong(); paintDeck(); });
  q('#d-scale').addEventListener('click', function () { SONG.scale = SONG.scale === 'pelog' ? 'slendro' : 'pelog'; saveSong(); paintDeck(); });
  /* a track's key: a touch arms it; two touches open its settings */
  $$('.ins', deckEl).forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.t, now = Date.now(); if (insTap.i === i && now - insTap.t < 400) { SEQ.open = SEQ.open === i ? -1 : i; insTap = { i: -1, t: 0 }; } else { SEQ.arm = i; insTap = { i: i, t: now }; } paintDeck(); }); });
  $$('.cells', deckEl).forEach(function (row) { var t = +row.dataset.t, tr = SONG.tracks[t]; $$('button', row).forEach(function (b) { b.addEventListener('click', function () { var st = +b.dataset.s;
    if (tr.steps[st]) { tr.steps[st] = null; saveSong(); paintDeck(); return; }
    if (OPEN) { SEQ.arm = t; placeNote(OPEN, st); } else { b.classList.add('no'); setTimeout(function () { b.classList.remove('no'); }, 400); } }); }); });
  if (SEQ.open >= 0) { var tr = SONG.tracks[SEQ.open], set = deckEl.querySelector('.set');
    $$('[data-ins]', set).forEach(function (b) { b.addEventListener('click', function () { tr.ins = b.dataset.ins; saveSong(); var last = tr.steps.filter(Boolean).pop(); if (last) noteAt(ac(), tr, last.d, AC.currentTime + 0.01); paintDeck(); }); });
    $$('[data-vol]', set).forEach(function (b) { b.addEventListener('click', function () { tr.vol = +b.dataset.vol; saveSong(); paintDeck(); }); });
    $$('[data-oct]', set).forEach(function (b) { b.addEventListener('click', function () { tr.oct = Math.max(-2, Math.min(2, tr.oct + +b.dataset.oct)); saveSong(); paintDeck(); }); });
    set.querySelector('[data-len]').addEventListener('click', function () { tr.len = tr.len ? 0 : 1; saveSong(); paintDeck(); });
    set.querySelector('[data-mute]').addEventListener('click', function () { tr.mute = !tr.mute; saveSong(); paintDeck(); });
  }
  $$('[data-load]', deckEl).forEach(function (b) { b.addEventListener('click', function () { SONG = JSON.parse(JSON.stringify(SONGS[+b.dataset.load].song)); saveSong(); paintDeck(); if (!SEQ.on) seqStart(); }); });
  $$('[data-wav]', deckEl).forEach(function (b) { b.addEventListener('click', function () { wavOf(SONGS[+b.dataset.wav].song); }); });
  $$('[data-del]', deckEl).forEach(function (b) { b.addEventListener('click', function () { SONGS.splice(+b.dataset.del, 1); store.set('da.base.songs', SONGS); paintDeck(); }); });
  if (SEQ.on) showStep(SEQ.cur);
}
/* the song as a sound file: four bars rendered offline, the room's tail let ring, written as 16-bit WAV */
function wavOf(song) {
  var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OC) return;
  var keep = SONG; SONG = song; var bars = 4, sd = stepDur(song), dur = sd * 16 * bars + 3, c = new OC(2, Math.ceil(44100 * dur), 44100), out = bus(c);
  for (var b = 0; b < bars; b++) for (var s = 0; s < 16; s++) song.tracks.forEach(function (tr) { var d = tr.steps[s]; if (d && !tr.mute) noteAt(c, tr, d.d, 0.05 + (b * 16 + s) * sd, out); });
  SONG = keep;
  var done = function (buf) { var blob = wav(buf), a = document.createElement('a'); a.download = 'novel-global-song.wav'; a.href = URL.createObjectURL(blob); document.body.appendChild(a); a.click(); a.remove(); window.__lastWav = blob.size; };
  c.oncomplete = function (e) { if (!c.__done) { c.__done = 1; done(e.renderedBuffer); } };
  var p = c.startRendering(); if (p && p.then) p.then(function (buf) { if (!c.__done) { c.__done = 1; done(buf); } });
}
function wav(buf) {
  var ch = buf.numberOfChannels, n = buf.length, ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab), o = 44, chans = [];
  var str = function (p, s) { for (var i = 0; i < s.length; i++) v.setUint8(p + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * ch * 2, true);
  for (var i = 0; i < ch; i++) chans.push(buf.getChannelData(i));
  for (var k = 0; k < n; k++) for (var j = 0; j < ch; j++) { var x = Math.max(-1, Math.min(1, chans[j][k])); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7FFF, true); o += 2; }
  return new Blob([ab], { type: 'audio/wav' });
}
/* the radar: a toggle. A hand turns over the ground in view; each knot it passes sounds on the armed track, and, recording, is placed */
var radar = { on: false, a: 0, t: 0, raf: 0 };
var sweepEl = (function () { var s = svg('svg', { id: 'sweep', 'aria-hidden': 'true' }); s.appendChild(svg('circle', { 'class': 'rim' })); s.appendChild(svg('line', { 'class': 'hand' })); terrain.appendChild(s); return s; })();
function radarCentre() { var wide = innerWidth >= 760, sh = sheet.hidden ? 0 : sheet.getBoundingClientRect(); var w = wide && !sheet.hidden ? map.w - sh.width : map.w, h = !wide && !sheet.hidden ? sh.top : map.h; return [w / 2, h / 2 + (wide ? 0 : 20), Math.max(60, Math.min(w, h) / 2 - 24)]; }
function radarOn(on) {
  radar.on = on; cancelAnimationFrame(radar.raf); sweepEl.style.display = on ? 'block' : 'none';
  if (on) { ac(); radar.t = 0; var spin = function (now) { if (!radar.on) return; var dt = radar.t ? (now - radar.t) / 1000 : 0; radar.t = now; var a0 = radar.a; radar.a = (radar.a + dt * Math.PI * 2 / 10) % (Math.PI * 2);
    var c = radarCentre(); var rim = sweepEl.querySelector('.rim'), hand = sweepEl.querySelector('.hand');
    rim.setAttribute('cx', c[0]); rim.setAttribute('cy', c[1]); rim.setAttribute('r', c[2]);
    hand.setAttribute('x1', c[0]); hand.setAttribute('y1', c[1]); hand.setAttribute('x2', c[0] + Math.cos(radar.a) * c[2]); hand.setAttribute('y2', c[1] + Math.sin(radar.a) * c[2]);
    hits.knots.forEach(function (k) {
      var dx = k.x - c[0], dy = k.y - c[1]; if (dx * dx + dy * dy > c[2] * c[2]) return;
      var an = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2); var hit = a0 <= radar.a ? an > a0 && an <= radar.a : an > a0 || an <= radar.a;
      if (hit && dt) { if (!placeNote(k.n)) pluck(k.n); lit(k.n); }
    });
    radar.raf = requestAnimationFrame(spin); }; radar.raf = requestAnimationFrame(spin); }
}
/* ───────── a peek: what a knot, a tile or a thread is, in a small card over where one is. Nothing navigates away; × or a touch
   elsewhere puts it back ───────── */
var peekEl = (function () { var d = document.createElement('div'); d.id = 'peek'; d.hidden = true; document.body.appendChild(d); return d; })();
var OPEN = null;
function peek(n) {
  if (!n) { peekEl.hidden = true; OPEN = null; return; }
  OPEN = n; attend(n); net.focus = n; net.links = n.seen || []; drawNet();
  var pic = PHOTOS[n.id] || n.thumb || n.photoURL || n.icon || '';
  var f = DB && DB.field.filter(function (x) { return x.id === n.sp || (n.sci && x.n === n.sci) || (n.cn && lower(x.cn) === lower(n.cn)); })[0];
  var r = read({ id: n.id, say: n.say || '', tags: n.tags || [], spId: f ? f.id : n.sp, lat: n.lat, lng: n.lng, wx: n.wx });
  var lines = n.wishText || null;
  var here = NOTES[0] && NOTES[0].mine !== false ? NOTES[0] : map;
  peekEl.innerHTML = (pic ? '<div class="pk-ph" style="background-image:url(\'' + esc(pic) + '\')"></div>' : '') + '<div class="pk">' +
    '<div class="pk-t">' + (f ? '<button class="nm" id="pk-g" title="In the guide">' + esc(nameOf(n)) + ' ›</button>' : '<b>' + esc(nameOf(n)) + '</b>') + (n.sci ? '<i>' + esc(n.sci) + '</i>' : '') + '<small><span class="dot" style="background:' + toneOf(n) + '"></span>' + (n.at ? ago(n.at) : '') + (isFinite(n.lat) && here && isFinite(here.lat) ? ' · ' + far(Math.round(dist(n, here))) : '') + (n.sent ? ' ' + pips(n.sent.s) : '') + (n.credit ? ' · ' + esc(n.credit) : '') + '</small>' +
    (r.issue || r.hot ? '<p class="pk-a">' + esc(r.lines[0].t) + '</p>' : f && !n.say ? '<p>' + esc(f.aware || f.help || '') + '</p>' : n.say && n.cn ? '<p>' + esc(n.say) + '</p>' : '') +
    (lines ? '<div class="pk-w">' + lines.filter(Boolean).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>' : '') +
    (r.call && (r.issue || r.hot) && !(lines && lines.join(' ').indexOf(r.call.n) >= 0) ? '<a class="call" href="' + esc(r.call.tel) + '"><b>' + esc(r.call.label) + '</b><span>' + esc(r.call.n) + '</span></a>' : '') + '</div>' +
    '<div class="pk-k"><button class="g" id="pk-snd" title="Hear it">♪</button><button class="g" id="pk-add" title="Into the armed track">＋</button><button class="g" id="pk-x" title="Close">×</button></div></div>';
  peekEl.hidden = false;
  $('#pk-x').addEventListener('click', function () { peek(null); });
  $('#pk-snd').addEventListener('click', function () { pluck(n); });
  /* this cell, into the track armed: at the step sounding, or the first one free */
  $('#pk-add').addEventListener('click', function () { var tr = SONG.tracks[SEQ.arm], st = SEQ.on ? SEQ.cur : Math.max(0, tr.steps.indexOf(null)); placeNote(n, st); var b = $('#pk-add'); if (b) { b.classList.add('on'); setTimeout(function () { b.classList.remove('on'); }, 500); } });
  var gb = $('#pk-g'); if (gb) gb.addEventListener('click', function () { peek(null); lifeSheet(f.id); });
}
/* packs: the terrain and the field data switched on or off; one's own noticings out as a file to share, and others' in */
/* ───────── W.I.S.H.: a news page of strategies. Each poster made is a thread, ranked as Hacker News ranks (points over time, with
   gravity), the urgent lifted; the first is the hero, its art large. Open one: its poster, what is urgent about it, the W.I.S.H.es
   written in reply, and four lines to write one more, each with a minimised list of lines that fit this poster. What was sent shows
   here at once, whether or not a printer is on ───────── */
var VOTES = store.get('da.base.votes', {}), REPLIES = store.get('da.base.replies', {});
function repliesOf(n) { var own = (REPLIES[n.code] || []).slice(); if (n.wishText && n.wishText.some(Boolean)) own.unshift({ id: n.id + '-w', at: n.at, lines: n.wishText, mine: true, sent: n.sent, first: true }); return own.concat(WISHES.filter(function (w) { return w.re === n.code; })); }
function threads() {
  return NOTES.filter(function (n) { return n.mine !== false && !n.booth && (n.say || n.cn || n.thumb); }).concat(SHARED.filter(function (s) { return !s.booth && (s.say || s.cn); })).map(function (n) {
    var reps = repliesOf(n), h = (Date.now() - n.at) / 36e5, up = 1 + (VOTES[n.id] ? 1 : 0) + reps.length;
    return { n: n, reps: reps, up: up, score: (up * (n.issue ? 2 : 1)) / Math.pow(h + 2, 1.5) };
  }).sort(function (a, b) { return b.score - a.score; });
}
function wishSheet(sel) {
  var T = threads(), wide = innerWidth >= 760, chosen = sel ? T.filter(function (t) { return t.n.id === sel.id || t.n.code === sel.code; })[0] || { n: sel, reps: repliesOf(sel), up: 1 } : null;
  if (!chosen && wide && T.length) chosen = T[0];
  var listHTML = function () {
    if (!T.length) return '<label class="eye solo" aria-label="Photograph" title="What have you noticed?"><svg viewBox="0 0 160 120" aria-hidden="true"><path class="stick" d="M16 54Q80 4 144 54"/><path class="stick" d="M16 54Q80 104 144 54"/><circle class="iris" cx="80" cy="54" r="19"/><g class="pupil"><ellipse cx="80" cy="54" rx="8" ry="6"/></g></svg><input class="shot" type="file" accept="image/*" capture="environment"></label>';
    var top = T[0], pic = PHOTOS[top.n.id] || top.n.thumb || top.n.photoURL || '';
    return '<button class="hero" data-th="' + esc(top.n.id) + '"><span class="art' + (pic ? '' : ' none') + '"' + (pic ? ' style="background-image:url(\'' + esc(pic) + '\')"' : '') + '></span><h3>' + esc(top.n.say || top.n.cn) + '</h3><span class="meta">' + metaOf(top) + '</span></button>' +
      '<ol class="hn">' + T.map(function (t) { var p = PHOTOS[t.n.id] || t.n.thumb || t.n.photoURL || ''; return '<li><button class="up' + (VOTES[t.n.id] ? ' on' : '') + '" data-up="' + esc(t.n.id) + '" title="Up">▲</button><span class="th"' + (p ? ' style="background-image:url(\'' + esc(p) + '\')"' : '') + '></span><button class="t" data-th="' + esc(t.n.id) + '"><b>' + (t.n.issue ? '<i class="u"></i>' : '') + esc(t.n.say || t.n.cn) + '</b><span class="meta">' + metaOf(t) + '</span></button></li>'; }).join('') + '</ol>';
  };
  var threadHTML = function (t) {
    var n = t.n, r = read({ id: n.id, say: n.say || '', tags: n.tags || [], spId: n.sp, lat: n.lat, lng: n.lng, wx: n.wx }), opts = wishOptions(n, r), draft = wishLines(n, r).map(function (l) { return l[1]; });
    var pic = PHOTOS[n.id] || n.thumb || n.photoURL || '';
    return (wide ? '' : '<button class="g back" id="w-back" title="Back">←</button>') +
      (pic ? '<div class="hero"><span class="art" style="background-image:url(\'' + esc(pic) + '\')"></span></div>' : '') +
      '<h2>' + esc(n.say || n.cn) + '</h2><p class="meta">' + metaOf(t) + '</p>' + alertHTML(r) +
      t.reps.map(function (w) { return '<div class="reply">' + (w.lines || []).filter(Boolean).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '<p class="meta">' + (w.mine ? '● ' : '○ ') + ago(w.at) + (w.sent ? ' ' + pips(w.sent.s) : '') + '</p></div>'; }).join('') +
      '<div class="compose" id="w-new">' + 'WISH'.split('').map(function (k, i) { return '<div class="ln"><i>' + k + '</i><textarea rows="2" data-l="' + i + '">' + esc(t.reps.length ? '' : draft[i] || '') + '</textarea><select data-o="' + i + '" title="Lines that fit"><option value="">▾</option>' + opts[i].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></div>'; }).join('') +
      '<div class="ctl" style="margin-top:10px"><button class="g" id="w-print" title="Print it">' + glyph('print') + '</button><button class="go" id="w-post" title="Add it to the thread" style="margin:0">→</button></div></div>';
  };
  var paint = function () {
    T = threads(); if (chosen) chosen = T.filter(function (t) { return t.n.id === chosen.n.id; })[0] || chosen;
    var main = !wide && chosen ? '' : '<div>' + listHTML() + '</div>', side = chosen ? '<div>' + threadHTML(chosen) + '</div>' : '';
    open(head('wish') + '<div class="wish-grid">' + main + side + '</div>', false, 'wide');
    $$('[data-th]').forEach(function (b) { b.addEventListener('click', function () { chosen = T.filter(function (t) { return t.n.id === b.dataset.th; })[0]; paint(); }); });
    $$('[data-up]').forEach(function (b) { b.addEventListener('click', function () { var id = b.dataset.up; if (VOTES[id]) delete VOTES[id]; else VOTES[id] = 1; store.set('da.base.votes', VOTES); paint(); }); });
    var bk = $('#w-back'); if (bk) bk.addEventListener('click', function () { chosen = null; paint(); });
    var sh = $('#sheet .shot'); if (sh) sh.addEventListener('change', function () { onShot(sh.files[0]); });
    $$('#w-new select').forEach(function (s) { s.addEventListener('change', function () { if (!s.value) return; $('#w-new [data-l="' + s.dataset.o + '"]').value = s.value; s.value = ''; }); });
    var lines = function () { return $$('#w-new textarea').map(function (x) { return x.value.trim(); }); };
    var pr = $('#w-print'); if (pr) pr.addEventListener('click', function () { var n = chosen.n, L = lines(); if (!L.some(Boolean)) return; if (NOTES.indexOf(n) < 0) { n = Object.assign({}, n, { id: 'w' + Date.now().toString(36), mine: true, at: Date.now() }); n.code = code(n.id); NOTES.unshift(n); } n.wishText = L; n.wish = true; saveNotes(); stepS(n); });
    var po = $('#w-post'); if (po) po.addEventListener('click', function () {
      var n = chosen.n, L = lines(); if (!L.some(Boolean)) return;
      var w = { id: 'r' + Date.now().toString(36), at: Date.now(), lines: L, mine: true, sent: { s: 'sending' } }; (REPLIES[n.code] = REPLIES[n.code] || []).push(w); store.set('da.base.replies', REPLIES); paint();
      var body = { type: 'wish', re: n.code, lines: L, lat: +(+n.lat || map.lat).toFixed(3), lng: +(+n.lng || map.lng).toFixed(3) };
      send({ kind: 'record', code: code(w.id), body: JSON.stringify(body), lat: body.lat, lng: body.lng, dest: '' }).then(function (j) { w.sent = { id: j.id, s: j.status }; store.set('da.base.replies', REPLIES); paint(); })
        .catch(function (e) { w.sent = { s: e.status ? 'failed' : 'outbox' }; store.set('da.base.replies', REPLIES); paint(); });
    });
  };
  paint();
  db().then(loadShared).then(function () { if (!sheet.hidden && $('.wish-grid')) paint(); });
}
function metaOf(t) { var n = t.n; return '▲ ' + t.up + ' · ' + ((n.data || [])[0] ? esc(cap(n.data[0])) + ' · ' : '') + ago(n.at) + ' · ' + t.reps.length + ' ✎' + (n.sent ? ' ' + pips(n.sent.s) : ''); }

/* ───────── SHOP: one's posters and where each is, as three dots; the printers, listening or not; building one; making; packs ───────── */
function shopSheet() {
  var mine = NOTES.filter(function (n) { return n.mine !== false; });
  open(head('shop') +
    '<ul class="list" id="s-rec">' + (mine.length ? mine.slice(0, 30).map(function (n, i) { return '<li><button data-i="' + i + '"><span>' + esc(n.cn || n.say || n.code) + '</span><small id="s-st-' + i + '">' + (n.sent ? pips(n.sent.s) : '○○○') + '</small></button></li>'; }).join('') : '<li class="empty">· · ·</li>') + '</ul>' +
    '<hr><ul class="list" id="s-prn"><li class="empty">· · ·</li></ul>' +
    '<div class="row" style="margin-top:10px"><a class="g" href="build-a-solar-printer.txt" download aria-label="Build a solar thermal printer" title="Build a solar thermal printer">' + glyph('sun') + '</a><button class="g" id="s-qr" aria-label="QR sticker for the photo booth" title="QR sticker for the photo booth">' + glyph('qr') + '</button><button class="g" id="s-poster" aria-label="Print the PRINT FREE poster" title="Print the PRINT FREE poster">' + glyph('print') + '</button><span id="s-pst"></span><a class="g" href="#pixel" aria-label="Pixel board" title="Pixel board">' + glyph('pixel') + '</a>' + (mine[0] ? '<button class="g" id="s-sign" aria-label="Sign" title="Sign">' + glyph('sign') + '</button>' : '') + '</div>' +
    '<hr>' + packsHTML());
  wirePacks();
  $$('#s-rec [data-i]').forEach(function (b) { b.addEventListener('click', function () { stepS(mine[+b.dataset.i]); }); });
  var sg = $('#s-sign'); if (sg) sg.addEventListener('click', function () { stepS(mine[0], null, 'sign'); });
  $('#s-qr').addEventListener('click', function () { boothSticker('novelglobal'); });
  $('#s-poster').addEventListener('click', function () {
    var b = this, st = $('#s-pst'); b.disabled = true; st.innerHTML = pips('sending');
    printers().then(function (list) {
      var wide = list.filter(function (p) { return +p.paper !== 58; }), p = wide.filter(function (x) { return x.ready; })[0] || wide.filter(function (x) { return x.id === 'novelglobal'; })[0] || wide[0];
      if (!p) { st.innerHTML = pips('failed'); b.disabled = false; return; }
      return boothPoster(p.id, 512).then(function (cv) {
        var id = 'p' + Date.now().toString(36), body = { type: 'poster', lat: +map.lat.toFixed(4), lng: +map.lng.toFixed(4) };
        return send({ kind: 'record', code: code(id), body: JSON.stringify(body), lat: body.lat, lng: body.lng, dest: p.id, escpos: raster(cv) }).then(function (j) { var n = { sent: { id: j.id, s: j.job ? j.job.status : j.status } }; st.innerHTML = pips(n.sent.s); follow(n, st); b.disabled = false; });
      });
    }).catch(function (e) { st.innerHTML = pips(e && e.status ? 'failed' : 'outbox'); b.disabled = false; });
  });
  mine.slice(0, 30).forEach(function (n, i) { if (n.sent && n.sent.id) follow(n, document.getElementById('s-st-' + i), 29); });
  mine.slice(0, 30).forEach(function (n, i) { if (!n.sent || !n.sent.id) return; api('/receipts/' + n.sent.id).then(function (j) { if (!j) return; n.sent.s = j.job ? j.job.status : j.status; saveNotes(); var el = document.getElementById('s-st-' + i); if (el) el.innerHTML = pips(n.sent.s); }).catch(function () { /* later */ }); });
  printers().then(function (list) { var ul = $('#s-prn'); if (!ul) return; ul.innerHTML = list.length ? list.map(function (p) { return '<li><span class="li"><span>' + (p.ready ? '● ' : '○ ') + esc(p.name || p.id) + '</span><small>' + (p.queued ? p.queued + ' … ' : '') + (p.printed || 0) + ' ⎙</small></span></li>'; }).join('') : '<li class="empty">—</li>'; });
}
function packsHTML() {
  var p = function (k, g, t) { return '<button class="g' + (PACKS[k] ? ' on' : '') + '" data-pack="' + k + '" aria-label="' + t + '" title="' + t + '">' + glyph(g) + '</button>'; };
  return '<div class="row">' + p('terrain', 'map', 'Terrain') + p('field', 'guide', 'Field data') + '<button class="g" id="pk-out" aria-label="Save my noticings as a pack" title="Save my noticings as a pack">↓</button>' +
    '<label class="g" aria-label="Add a pack" title="Add a pack">+<input id="pk-in" type="file" accept=".json,application/json" hidden></label></div>';
}
function wirePacks() {
  $$('[data-pack]').forEach(function (b) { b.addEventListener('click', function () { PACKS[b.dataset.pack] = !PACKS[b.dataset.pack]; store.set('da.base.packs', PACKS); b.classList.toggle('on', PACKS[b.dataset.pack]); if (b.dataset.pack === 'field') { DB = null; dbP = null; } credit(); render(); }); });
  var o = $('#pk-out'); if (o) o.addEventListener('click', function () {
    var pack = { pack: 'novel.global/noticed', v: 2, at: Date.now(), notes: NOTES.map(function (n) { var c = {}; for (var k in n) if (k !== 'audio') c[k] = n[k]; return c; }), replies: REPLIES, songs: SONGS };
    var a = document.createElement('a'); a.download = 'novel-global-pack.json'; a.href = URL.createObjectURL(new Blob([JSON.stringify(pack)], { type: 'application/json' })); document.body.appendChild(a); a.click(); a.remove();
  });
  var i = $('#pk-in'); if (i) i.addEventListener('change', function () {
    var f = i.files[0]; if (!f) return; var fr = new FileReader();
    fr.onload = function () { try { var j = JSON.parse(fr.result), got = 0; (j.notes || []).forEach(function (n) { if (n && n.id && isFinite(n.lat) && isFinite(n.lng) && !NOTES.some(function (x) { return x.id === n.id; })) { n.mine = false; n.packed = 1; NOTES.push(n); got++; } }); (j.songs || []).forEach(function (s) { if (s && s.song) SONGS.push(s); }); store.set('da.base.songs', SONGS.slice(0, 24)); saveNotes(); toast('+' + got); render(); } catch (e) { toast('×'); } };
    fr.readAsText(f);
  });
}
/* ───────── the pixel board: paste, drop or pick a picture; it comes back as wonky pixels. Three frames make it move ───────── */
var board = { frames: [], i: 0, cells: 40, tones: 2, anim: 0 };
function boardSheet() {
  open(head('pixel') +
    '<label class="board" id="pb" aria-label="Paste, drop or pick a picture"><span class="plus">+</span><input id="pb-in" type="file" accept="image/*" hidden></label>' +
    '<div class="frames" id="pb-f"></div>' +
    '<div class="seg" id="pb-c" style="margin-top:10px"><button data-v="24">24</button><button data-v="40">40</button><button data-v="64">64</button></div>' +
    '<div class="seg" id="pb-t" style="margin-top:6px"><button data-v="2">■□</button><button data-v="4">■▪□</button><button data-v="8">RGB</button></div>' +
    '<div class="row" style="margin-top:10px"><button class="k" id="pb-anim" aria-label="Animate" title="Animate">▶</button><button class="k" id="pb-save" aria-label="Save" title="Save">↓</button><button class="k" id="pb-gif" aria-label="Save it moving, as a GIF" title="Save it moving, as a GIF">⇩</button><button class="k" id="pb-print" aria-label="Print" title="Print">⎙</button></div>');
  var add = function (file) { if (!file || !/^image\//.test(file.type)) return; var u = URL.createObjectURL(file); loadImg(u).then(function (im) { if (board.frames.length >= 3) board.frames.shift(); board.frames.push(im); board.i = board.frames.length - 1; paint(); }); };
  var paint = function () {
    $$('#pb-c button').forEach(function (b) { b.classList.toggle('on', +b.dataset.v === board.cells); });
    $$('#pb-t button').forEach(function (b) { b.classList.toggle('on', +b.dataset.v === board.tones); });
    var pb = $('#pb'); if (!pb) return; if (!board.frames.length) return;
    board.out = board.frames.map(function (im, i) { return pixelArt(im, board.cells, board.tones, Math.max(4, Math.round(320 / board.cells)), 11 + i * 7); });
    Array.prototype.slice.call(pb.childNodes).forEach(function (c) { if (c.tagName !== 'INPUT') pb.removeChild(c); }); pb.insertBefore(board.out[board.i], pb.firstChild);
    $('#pb-f').innerHTML = board.out.map(function (c, i) { return '<button class="' + (i === board.i ? 'on' : '') + '" data-i="' + i + '" style="background-image:url(' + c.toDataURL() + ')"></button>'; }).join('');
    $$('#pb-f button').forEach(function (b) { b.addEventListener('click', function () { board.i = +b.dataset.i; paint(); }); });
  };
  $('#pb-in').addEventListener('change', function () { add(this.files[0]); });
  var pb = $('#pb'); pb.addEventListener('dragover', function (e) { e.preventDefault(); }); pb.addEventListener('drop', function (e) { e.preventDefault(); add(e.dataTransfer.files[0]); });
  $$('#pb-c button').forEach(function (b) { b.addEventListener('click', function () { board.cells = +b.dataset.v; paint(); }); });
  $$('#pb-t button').forEach(function (b) { b.addEventListener('click', function () { board.tones = +b.dataset.v; paint(); }); });
  $('#pb-anim').addEventListener('click', function () { if (board.anim) { clearInterval(board.anim); board.anim = 0; return; } if (board.frames.length === 1) { board.frames = [board.frames[0], board.frames[0], board.frames[0]]; }   /* one picture: three wonky takes of it, a sprite */ board.anim = setInterval(function () { if (!$('#pb')) { clearInterval(board.anim); board.anim = 0; return; } board.i = (board.i + 1) % board.frames.length; paint(); }, 333); });
  /* the sprite, moving, as a GIF: its frames in their one bit or greys, through gifenc */
  $('#pb-gif').addEventListener('click', function () { if (!board.out) return; lib('gifenc', function () { return window.gifenc; }).then(function (ok) {
    if (!ok) return; var G = window.gifenc, enc = G.GIFEncoder(), fr = board.out.length > 1 ? board.out : [board.out[0], board.out[0]];
    fr.forEach(function (c) { var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, pal = G.quantize(d, 16), idx = G.applyPalette(d, pal); enc.writeFrame(idx, c.width, c.height, { palette: pal, delay: 260 }); });
    enc.finish(); var blob = new Blob([enc.bytes()], { type: 'image/gif' }), a = document.createElement('a'); a.download = 'novel-global-pixels.gif'; a.href = URL.createObjectURL(blob); document.body.appendChild(a); a.click(); a.remove(); window.__lastGif = blob.size;
  }); });
  $('#pb-save').addEventListener('click', function () { if (!board.out) return; var c = board.out[board.i]; var a = document.createElement('a'); a.download = 'novel-global-pixels.png'; a.href = c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); });
  $('#pb-print').addEventListener('click', function () { if (!board.out) return; var n = { id: 'p' + Date.now().toString(36), at: Date.now(), lat: map.lat, lng: map.lng, say: '', tags: [], mine: true }; n.code = code(n.id); stepS(n, pixelArt(board.frames[board.i], board.cells, 2, 8, 11 + board.i * 7)); });
  paint();
}
document.addEventListener('paste', function (e) {
  var items = (e.clipboardData && e.clipboardData.items) || []; for (var i = 0; i < items.length; i++) if (items[i].type.indexOf('image') === 0) {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    loadImg(URL.createObjectURL(items[i].getAsFile())).then(function (im) {
      board.frames.push(im); if (board.frames.length > 3) board.frames.shift(); board.i = board.frames.length - 1;
      if (location.hash === '#pixel') boardSheet(); else location.hash = 'pixel';
    });
    e.preventDefault(); return;
  }
});

/* ───────── wiring ───────── */
/* ───────── the booth (#booth, or #booth=<printer>): a printer's own page, reached by the QR sticker on it. Nothing but a photograph,
   then stickers and words, then the print, with a small code on it that opens the site. Two ways on: again, or novel.global.
   The photograph is made ready for the printer's dots (levels, dot gain, sharpening, then Atkinson's dither by CanvasDither) ───────── */
var BTH = null, ditherP = null;
function ditherLib() { if (window.CanvasDither) return Promise.resolve(window.CanvasDither); if (!ditherP) ditherP = new Promise(function (res) { var s = document.createElement('script'); s.src = 'vendor/canvas-dither.js'; s.onload = function () { res(window.CanvasDither || null); }; s.onerror = function () { res(null); }; document.head.appendChild(s); }); return ditherP; }
var siteURL = function (h) { var base = /\.workers\.dev$|localhost|\.test$/.test(location.hostname) ? location.origin + '/' : (B.portal || location.origin + '/'); return base.replace(/#.*$/, '') + (h ? '#' + h : ''); };
var EYE_ASCII = '   _.-~~~~-._\n <(   (o)   )>\n   \'-.____.-\'\n    \'  \'  \'';
var STICKERS = ['*', '<3', '<(o)>', '~~~', ':)', '\\o/', '+'];
function boothOn(dest) {
  BTH = { dest: dest || 'novelglobal', im: null, st: [], words: '', pick: 0, paper: 512 };
  document.body.classList.add('booth'); sheet.hidden = true; dock.hidden = true;
  var el = $('#booth') || document.body.appendChild(Object.assign(document.createElement('main'), { id: 'booth' }));
  printers().then(function (l) { var p = l.filter(function (x) { return x.id === BTH.dest; })[0]; if (p && +p.paper === 58) BTH.paper = 384; });
  boothStart(el);
}
function boothStart(el) {
  el = el || $('#booth'); BTH.im = null; BTH.st = []; BTH.words = ''; BTH.sent = null;
  var wait = (+store.get('da.booth.next', 0) || 0) - Date.now(); clearTimeout(BTH.t);
  if (wait > 0) { el.innerHTML = '<p class="bm">novel.global</p><pre class="art" aria-hidden="true">' + esc(EYE_ASCII) + '</pre><div class="am"><a href="' + esc(siteURL()) + '" aria-label="novel.global">[ novel.global ]</a></div>'; BTH.t = setTimeout(function () { if ($('#booth .art') && !$('#bt-pv') && !$('#bt-on')) boothStart(); }, wait); return; }
  el.innerHTML = '<p class="bm">novel.global</p><pre class="art" aria-hidden="true">' + esc(EYE_ASCII) + '</pre>' +
    '<div class="am"><label aria-label="Take a photograph" title="Take a photograph">[ (o) ]<input type="file" accept="image/*" capture="environment" hidden></label>' +
    '<label aria-label="Upload a photograph" title="Upload a photograph">[ ^ ]<input type="file" accept="image/*" hidden></label></div>';
  $$('input', el).forEach(function (inp) { inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; if (f) boothPic(f); setTimeout(function () { inp.value = ''; }, 1500); }); });
}
function boothPic(file) {
  document.body.classList.add('busy'); var url = URL.createObjectURL(file);
  loadImg(url).catch(function () { return window.createImageBitmap ? createImageBitmap(file) : Promise.reject(); }).then(function (im) {
    document.body.classList.remove('busy'); var w0 = im.naturalWidth || im.width, h0 = im.naturalHeight || im.height, k = Math.min(1, 1600 / Math.max(w0, h0));
    var c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); BTH.im = c; boothEdit();
  }).catch(function () { document.body.classList.remove('busy'); toast('×'); });
}
/* the photograph made ready for the printer's dots: stretched to its own darkest and lightest, lifted for the spread of a hot dot,
   sharpened a little, then dithered. Stickers go on after, crisp */
function forPrint(src, W, D) {
  var H = Math.round(src.height * W / src.width), c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(src, 0, 0, W, H);
  var img = x.getImageData(0, 0, W, H), d = img.data, n = W * H, L = new Float32Array(n), hist = new Uint32Array(256), i, l;
  for (l = 0, i = 0; l < n; l++, i += 4) { L[l] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; hist[L[l] | 0]++; }
  var lo = 0, hi = 255, acc = 0; for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > n * 0.01) { lo = i; break; } } acc = 0; for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc > n * 0.01) { hi = i; break; } }
  if (hi - lo < 40) { lo = 0; hi = 255; } /* a flat picture is left as it is, never stretched to black */
  var span = hi - lo, B2 = new Float32Array(n);
  for (l = 0; l < n; l++) L[l] = 255 * Math.pow(Math.max(0, Math.min(1, (L[l] - lo) / span)), 0.8);
  for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) { var s = 0, m = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var yy = y + dy, x2 = xx + dx; if (yy >= 0 && yy < H && x2 >= 0 && x2 < W) { s += L[yy * W + x2]; m++; } } B2[y * W + xx] = s / m; }
  for (l = 0, i = 0; l < n; l++, i += 4) { var v = L[l] + 0.7 * (L[l] - B2[l]); d[i] = d[i + 1] = d[i + 2] = v < 0 ? 0 : v > 255 ? 255 : v; }
  if (D) D.atkinson(img); else for (i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = d[i] < 128 ? 0 : 255;
  x.putImageData(img, 0, 0); return c;
}
function drawStickers(x, W, H, ink) {
  BTH.st.forEach(function (s) {
    var f = Math.round(W * 0.1); x.font = 'bold ' + f + 'px ui-monospace, Menlo, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.lineWidth = Math.max(3, f * 0.22); x.strokeStyle = '#fff'; x.strokeText(s.t, s.x * W, s.y * H); x.fillStyle = ink; x.fillText(s.t, s.x * W, s.y * H);
  });
  x.textAlign = 'left'; x.textBaseline = 'alphabetic';
}
function boothEdit() {
  var el = $('#booth');
  el.innerHTML = '<p class="bm">novel.global</p><div class="pv" id="bt-pv"><canvas></canvas></div>' +
    '<div class="am sm" id="bt-st">' + STICKERS.map(function (t, i) { return '<button data-k="' + i + '" class="' + (i === BTH.pick ? 'on' : '') + '" aria-label="Sticker ' + esc(t) + '">[ ' + esc(t) + ' ]</button>'; }).join('') + '</div>' +
    '<div class="am sm"><button id="bt-aa" aria-label="Words" title="Words">[ Aa ]</button><button id="bt-un" aria-label="Undo" title="Undo">[ &lt;- ]</button><button id="bt-x" aria-label="Start again" title="Start again">[ x ]</button><button id="bt-go" class="go" aria-label="Print" title="Print">[ &gt;&gt; ]</button></div>' +
    '<input id="bt-w" class="bw" maxlength="40" aria-label="Words" hidden>';
  var cv = $('#bt-pv canvas'), paint = function () {
    ditherLib().then(function (D) { var p = forPrint(BTH.im, BTH.paper, D); cv.width = p.width; cv.height = p.height; var x = cv.getContext('2d'); x.drawImage(p, 0, 0); drawStickers(x, p.width, p.height, '#000'); });
  };
  cv.addEventListener('click', function (e) {
    var r = cv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    var hit = BTH.st.filter(function (s) { return Math.abs(s.x - px) < 0.06 && Math.abs(s.y - py) < 0.05; })[0];
    if (hit) BTH.st.splice(BTH.st.indexOf(hit), 1); else BTH.st.push({ t: STICKERS[BTH.pick], x: px, y: py }); paint();
  });
  $$('#bt-st [data-k]').forEach(function (b) { b.addEventListener('click', function () { BTH.pick = +b.dataset.k; $$('#bt-st button').forEach(function (o) { o.classList.toggle('on', o === b); }); }); });
  var w = $('#bt-w'); w.value = BTH.words;
  $('#bt-aa').addEventListener('click', function () { w.hidden = !w.hidden; if (!w.hidden) w.focus(); });
  w.addEventListener('input', function () { BTH.words = w.value; });
  $('#bt-un').addEventListener('click', function () { BTH.st.pop(); paint(); });
  $('#bt-x').addEventListener('click', function () { boothStart(); });
  $('#bt-go').addEventListener('click', boothPrint);
  paint();
}
/* the receipt: the photograph in dots with its stickers, the words large, and a small code that opens the site */
function boothSlip(D, code) {
  var W = BTH.paper, pad = Math.round(W * 0.04), u = W / 512, p = forPrint(BTH.im, W, D);
  var words = BTH.words.trim(), c = document.createElement('canvas'), x = c.getContext('2d'); x.font = 'bold ' + Math.round(34 * u) + 'px ui-monospace, Menlo, monospace';
  var lines = words ? wrapText(x, words, W - pad * 2) : [];
  return qrLib().then(function (Q) {
    var q = null; if (Q) { try { q = Q(0, 'M'); q.addData(siteURL('n=' + code)); q.make(); } catch (e) { q = null; } }
    var mod = Math.max(3, Math.round(4 * u)), qs = q ? q.getModuleCount() * mod : 0;
    var head = Math.round(34 * u), wh = lines.length * Math.round(42 * u) + (lines.length ? Math.round(16 * u) : 0), foot = Math.max(qs, Math.round(40 * u)) + pad * 2;
    c.width = W; c.height = head + p.height + wh + foot; x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, c.height); x.fillStyle = '#000'; x.textBaseline = 'top';
    x.font = Math.round(16 * u) + 'px ui-monospace, Menlo, monospace'; x.fillText('novel.global', pad, Math.round(8 * u)); var dt = when(Date.now()); x.fillText(dt, W - pad - x.measureText(dt).width, Math.round(8 * u));
    x.drawImage(p, 0, head); x.save(); x.translate(0, head); drawStickers(x, W, p.height, '#000'); x.restore(); x.fillStyle = '#000'; x.textBaseline = 'top';
    var y = head + p.height + Math.round(14 * u); x.font = 'bold ' + Math.round(34 * u) + 'px ui-monospace, Menlo, monospace'; lines.forEach(function (t) { x.fillText(t, pad, y); y += Math.round(42 * u); });
    y = c.height - foot + pad; x.font = Math.round(14 * u) + 'px ui-monospace, Menlo, monospace'; x.fillText(EYE_ASCII.split('\n')[1].trim(), pad, y); x.fillText(code, pad, y + Math.round(22 * u));
    if (q) { var n = q.getModuleCount(), ox = W - pad - qs; for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (q.isDark(i, j)) x.fillRect(ox + j * mod, y + i * mod, mod, mod); }
    return c;
  });
}
/* the photograph kept for the site's gallery: in colour, its stickers on, as large as the server takes */
function boothPhoto() {
  var im = BTH.im, N = 1280, out = '';
  for (var k = 0; k < 4; k++) {
    var s = Math.min(1, N / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
    var x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height); drawStickers(x, c.width, c.height, '#111');
    out = c.toDataURL('image/jpeg', 0.86 - k * 0.06); if (out.length < 400e3) return out; N = Math.round(N * 0.8);
  }
  return out.length < 400e3 ? out : '';
}
function boothPrint() {
  var el = $('#booth'), id = 'b' + Date.now().toString(36), cd = code(id + '|' + Date.now());
  ditherLib().then(function (D) { return boothSlip(D, cd); }).then(function (slipCv) {
    var lat = map.lat, lng = map.lng, words = BTH.words.trim(), photo = boothPhoto();
    el.innerHTML = '<p class="bm">novel.global</p><div class="pv slip"></div><p class="am"><span id="bt-pip">' + pips('sending') + '</span></p>' +
      '<div class="am" id="bt-on"><button id="bt-again" aria-label="Again" title="Again" hidden>[ ↺ ]</button><a href="' + esc(siteURL()) + '" id="bt-site" aria-label="novel.global">[ novel.global ]</a></div>';
    $('.pv.slip', el).appendChild(slipCv);
    var n = { id: id, code: cd, at: Date.now(), mine: true, booth: true, lat: +lat.toFixed(5), lng: +lng.toFixed(5), say: words, tags: [], thumb: shrink(BTH.im, 220, 0.7) };
    if (photo) PHOTOS[id] = photo; NOTES.unshift(n); saveNotes();
    var body = { type: 'booth', lat: +lat.toFixed(4), lng: +lng.toFixed(4), text: words };
    var payload = { kind: 'record', code: cd, body: JSON.stringify(body), lat: body.lat, lng: body.lng, dest: BTH.dest, escpos: raster(slipCv) }; if (photo) payload.photo = photo;
    var pip = $('#bt-pip');
    send(payload).then(function (j) { var s = j.job ? j.job.status : j.status; n.sent = { id: j.id, dest: BTH.dest, s: s }; saveNotes(); pip.innerHTML = pips(s); follow(n, pip); })
      .catch(function (e) { n.sent = { s: e.status ? 'failed' : 'outbox' }; saveNotes(); pip.innerHTML = pips(n.sent.s); if (!e.status) { OUTBOX.push(payload); store.set('da.base.outbox', OUTBOX); } });
    /* another photograph only after a wait no one sees, two to five minutes, so the printer stays free for everyone */
    var next = Date.now() + 120e3 + Math.random() * 180e3; store.set('da.booth.next', next);
    var ag = $('#bt-again'); ag.addEventListener('click', function () { boothStart(); }); clearTimeout(BTH.t); BTH.t = setTimeout(function () { ag.hidden = false; }, next - Date.now());
  });
}
/* the poster a printer prints for itself, once it is online: PRINT FREE (the print is free, not the printer), the eye, and its booth's code drawn as a terminal draws
   one, each module a cell with its gap, inside an ASCII frame. Read by any phone's camera */
function boothPoster(dest, W) {
  W = W || 512; var u = W / 512, pad = Math.round(20 * u), url = siteURL('booth' + (dest && dest !== 'novelglobal' ? '=' + dest : ''));
  return qrLib().then(function (Q) {
    var q = Q ? Q(0, 'M') : null; if (q) { q.addData(url); q.make(); }
    var n = q ? q.getModuleCount() : 0, cell = Math.floor((W - pad * 2 - 40 * u) / (n + 6)), qs = cell * (n + 6), F = function (px, b) { return (b ? 'bold ' : '') + Math.round(px * u) + 'px ui-monospace, Menlo, monospace'; };
    var big = bigWord('PRINT').concat(bigWord('FREE')), m = document.createElement('canvas').getContext('2d'); m.font = F(30, 1);
    var bf = Math.min(30, 30 * (W - pad * 2) / m.measureText(big[0]).width / u), lh = Math.round(bf * 1.05 * u);
    var c = document.createElement('canvas'); c.width = W; c.height = Math.round(60 * u) + big.length * lh + Math.round(150 * u) + qs + Math.round(140 * u); var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, c.height); x.fillStyle = '#000'; x.textBaseline = 'top';
    x.font = F(16); x.fillText('novel.global', pad, pad);
    var y = Math.round(60 * u); x.font = F(bf, 1);
    big.forEach(function (t, k) { var row = k < 4 ? bigWord('PRINT') : bigWord('FREE'); x.fillText(t, Math.round((W - x.measureText(row[0]).width) / 2), y); y += lh + (k === 3 ? Math.round(10 * u) : 0); });
    y += Math.round(16 * u); x.font = F(22); var ew = x.measureText(' <(   (o)   )>').width;
    EYE_ASCII.split('\n').forEach(function (t) { x.fillText(t, Math.round((W - ew) / 2), y); y += Math.round(26 * u); });
    var top = y + Math.round(30 * u), ox = Math.round((W - qs) / 2);
    x.font = F(18); var ch = x.measureText('-').width, cols = Math.floor((qs + 2 * ch) / ch);
    var rule = '+' + new Array(cols - 1).join('-') + '+'; x.fillText(rule, ox - ch, top - Math.round(22 * u)); x.fillText(rule, ox - ch, top + qs + Math.round(4 * u));
    for (var yy = top; yy < top + qs; yy += Math.round(20 * u)) { x.fillText('|', ox - ch, yy); x.fillText('|', ox + qs, yy); }
    if (q) { var g = cell >= 8 ? 1 : 0, eye = function (i, j) { return (i < 7 || i >= n - 7) && j < 7 || i < 7 && j >= n - 7; }; for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (q.isDark(i, j)) { var e = eye(i, j) ? 0 : g; x.fillRect(ox + (j + 3) * cell, top + (i + 3) * cell, cell - e, cell - e); } }
    y = top + qs + Math.round(36 * u); x.font = F(20); var k = '[ (o) ]  [ ^ ]'; x.fillText(k, Math.round((W - x.measureText(k).width) / 2), y);
    x.font = F(13); var ul = url.replace(/^https?:\/\//, ''); x.fillText(ul, Math.round((W - x.measureText(ul).width) / 2), y + Math.round(40 * u));
    return c;
  });
}
/* big letters in ASCII, four rows each, as FIGlet's small font draws them */
var BIG = { P: [' ___ ', '| _ \\', '|  _/', '|_|  '], R: [' ___ ', '| _ \\', '|   /', '|_|_\\'], I: [' ___ ', '|_ _|', ' | | ', '|___|'], N: [' _  _ ', '| \\| |', '| .` |', '|_|\\_|'],
  T: [' _____ ', '|_   _|', '  | |  ', '  |_|  '], F: [' ___ ', '| __|', '| _| ', '|_|  '], E: [' ___ ', '| __|', '| _| ', '|___|'] };
function bigWord(w) { return [0, 1, 2, 3].map(function (r) { return w.split('').map(function (l) { return BIG[l][r]; }).join(''); }); }
/* the sticker for a printer: its booth's code, to stick beside it. Kept with the other downloads in SHOP */
function boothSticker(dest) {
  return qrLib().then(function (Q) {
    var S = 1200, c = document.createElement('canvas'); c.width = S; c.height = Math.round(S * 1.3); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#000';
    x.font = '44px ui-monospace, Menlo, monospace'; EYE_ASCII.split('\n').forEach(function (t, i) { x.fillText(t, 300, 120 + i * 54); });
    if (Q) { var q = Q(0, 'M'); q.addData(siteURL('booth' + (dest && dest !== 'novelglobal' ? '=' + dest : ''))); q.make(); var n = q.getModuleCount(), m = Math.floor(860 / n), o = Math.round((S - n * m) / 2); for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (q.isDark(i, j)) x.fillRect(o + j * m, 400 + i * m, m, m); }
    x.font = '40px ui-monospace, Menlo, monospace'; x.fillText('[ (o) ]  [ ^ ]', 420, 1350); x.font = '52px ui-monospace, Menlo, monospace'; x.fillText('novel.global', 420, 1460);
    download(c, 'novel-global-photo-qr.png'); return c;
  });
}
function route() {
  var h = decodeURIComponent(location.hash.slice(1));
  if (!/^(radio|wish|shop|pixel|search|guide|now|booth(=[a-z0-9-]+)?|n=[A-Z0-9-]+)$/i.test(h)) { location.replace('studio' + location.search + location.hash); return; }
  if (/^booth/i.test(h)) { if (!BTH) boothOn(h.split('=')[1]); return; }
  if (BTH) return;
  if (document.body.classList.contains('mapmode')) mapOn(false);
  if (h === 'radio') radioSheet(); else if (h === 'wish') wishSheet(); else if (h === 'shop') shopSheet(); else if (h === 'pixel') boardSheet(); else if (h === 'search' || h === 'guide' || h === 'now') guideSheet('');
  else if (/^n=DA-/i.test(h)) {
    var c = h.slice(2).toUpperCase(); var n = NOTES.filter(function (x) { return x.code === c; })[0];
    if (n) openNote(n); else api('/stories/' + c).then(function (j) { if (j && j.story) { SHARED = []; return loadShared().then(function () { var s = SHARED.filter(function (x) { return x.code === c; })[0]; if (s) openNote(s); }); } }).catch(function () { toast(c + ' is not shown yet'); });
  }
}
addEventListener('hashchange', function () { if (!location.hash) { if (!sheet.hidden) close(); return; } route(); });
$$('#shot, .shot').forEach(function (inp) { inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; onShot(f); setTimeout(function () { inp.value = ''; }, 1500); }); });
$('#b-search').addEventListener('click', function () { location.hash = 'guide'; });
$('#b-map').addEventListener('click', function () { mapOn(!document.body.classList.contains('mapmode')); });
$('#m-close').addEventListener('click', function () { mapOn(false); });
$('#m-add').addEventListener('change', function () { batch(this.files); this.value = ''; });
$('#b-theme').addEventListener('click', function () {
  var t = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('da.base.theme', t); } catch (e) { /* fine */ } render();
});
oled.addEventListener('click', function () { nowTick(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); if (e.key === '/' && sheet.hidden && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); location.hash = 'guide'; } });
function credit() { $('#credit').textContent = PACKS.terrain && B.credit && document.body.classList.contains('mapmode') ? B.credit : ''; }

credit(); dock.hidden = !NOTES.length; render();
/* the field pack after the first paint, then what is happening now */
nowTick(); setTimeout(function () { db().then(function () { oledI = 1; }); flush(); }, 700);
if (location.hash) route();
window.__base = { poster: boothPoster, hits: function () { return hits; }, song: function () { return SONG; }, seq: function () { return SEQ; }, wish: function () { var n = NOTES[0]; return n ? wishLines(n, read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng, wx: n.wx })) : []; }, read: read, guess: guess, issueOf: issueOf, related: related, nowItems: nowItems, exif: exif, notes: function () { return NOTES; }, db: db, map: map, code: code, pixelArt: pixelArt, slip: slip, set: function (n) { cur = n; } };
})();
