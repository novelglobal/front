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
  if (!shown()) return;
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
    if (tapped && e.type === 'pointerup') onTap(e.clientX, e.clientY);
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
function visible() { return net.all ? NOTES.concat(SHARED) : NOTES; }
function drawNet() {
  while (netEl.firstChild) netEl.removeChild(netEl.firstChild); if (!shown()) return;
  var list = visible().filter(function (n) { if (!isFinite(n.lat) || !isFinite(n.lng)) return false; var p = px(n.lat, n.lng); return p[0] > -200 && p[1] > -200 && p[0] < map.w + 200 && p[1] < map.h + 200; });
  if (net.focus && isFinite(net.focus.lat) && !list.some(function (n) { return n.id === net.focus.id; })) list.push(net.focus);
  if (!list.length) return;
  var g = svg('g', {}); netEl.appendChild(g);
  var pts = list.map(function (n) { return px(n.lat, n.lng); }), at = {}; list.forEach(function (n, i) { at[n.id] = i; });
  /* which sticks: in RADIO and on the map, every pair that shares a life or a need; else each noticing to the one before it */
  var pairs = [];
  if (net.all) { for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length && pairs.length < 120; j++) if (kin(list[i], list[j])) pairs.push([i, j]); }
  else for (var k = 1; k < list.length; k++) if (list[k] !== net.focus) pairs.push([k - 1, k]);
  if (net.focus) net.links.forEach(function (o) { if (at[o.id] != null) pairs.push([at[net.focus.id], at[o.id], !!net.fresh]); });
  chartSVG(g, chart(pts, pairs, seedOf(list)));
  /* the knots: a shell for each, the newest with a thread hanging under it, as on the bark painting */
  list.forEach(function (n, i) {
    var p = pts[i], me = net.focus && n.id === net.focus.id, r = me ? 5.5 : n.mine ? 4 : 3.5;
    var kk = svg('g', { 'class': me && net.fresh === n.id ? 'fall' : '' });
    if (me) kk.appendChild(svg('line', { x1: p[0], y1: p[1] + r, x2: p[0], y2: p[1] + r + 24, 'class': 'd' }));
    if (n.icon) { var ic = svg('image', { x: p[0] - 12, y: p[1] - 12, width: 24, height: 24 }); ic.setAttributeNS('http://www.w3.org/1999/xlink', 'href', n.icon); ic.setAttribute('href', n.icon); kk.appendChild(ic); }
    else kk.appendChild(svg('circle', { cx: p[0], cy: p[1], r: r, 'class': me ? 'me' : n.mine ? 'k' : '' }));
    if (me || net.all) { var t = svg('text', { x: p[0] + 9, y: p[1] - 7 }); t.textContent = (n.cn || n.say || '').toUpperCase().slice(0, 22); g.appendChild(t); }
    g.appendChild(kk);
  });
  if (net.fresh) setTimeout(function () { net.fresh = null; }, 2600);
}
/* ───────── the chart, after the Marshall Islands stick charts: a frame of sticks that run on past their joins and are lashed where
   they cross; a straight stick for each connection, overshooting its knots; shells and beads strung in clusters where sticks meet;
   one long swell bent across; every stick with its shadow on the wall. One drawing for the map, the receipt and the saved art ───────── */
function chart(pts, pairs, seed) {
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
function kin(a, b) { return !!((a.sp && a.sp === b.sp) || (a.issue && a.issue === b.issue && dist(a, b) < 3000)); }
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
  if (!lines.length && !DB && PACKS.field) lines.push({ t: 'Reading the field list…', s: '' });
  var call = issue ? callOf(issue.call) : sp && sp.call === 'wildlife' ? contact('WILDLIFE VICTORIA') : sp && sp.call === 'snake' ? contact('DEECA') : null;
  var rel = related(sp, grp, issue).map(function (f) { return { id: f.id, label: f.cn, sub: f.brd && f.brd[M] === 'B' ? 'BREEDING NOW' : f.g.toUpperCase(), f: f }; });
  var cs = caseOf(grp, issue); if (cs) { if (rel.length >= 3) rel.pop(); rel.push({ id: cs.id, label: cs.t, sub: (cs.city || cs.after || '') + (cs.yr ? ' ' + cs.yr : ''), brief: cs }); }
  var near = NOTES.concat(SHARED).filter(function (x) { return x.id !== n.id && ((sp && x.sp === sp.id) || (issue && x.issue === issue.k && dist(x, n) < 3000)); }).slice(0, 3);
  return { sp: sp, alts: g.alts, group: grp, issue: issue, lines: lines.slice(0, 3), call: call, rel: rel, near: near };
}

/* ───────── the sheet ───────── */
var sheet = $('#sheet'), dock = $('#dock');
function open(html, half, cls) {
  sheet.innerHTML = html; sheet.hidden = false; sheet.dataset.k = ''; sheet.className = (half ? 'half ' : '') + (cls || ''); sheet.scrollTop = 0;
  document.body.classList.add('away'); document.body.classList.toggle('half', !!half); dock.hidden = false; render();
  var x = $('.x', sheet); if (x) x.addEventListener('click', close);
}
function close() {
  sheet.hidden = true; sheet.innerHTML = ''; document.body.classList.remove('away'); document.body.classList.remove('half'); dock.hidden = !NOTES.length; net.all = document.body.classList.contains('mapmode'); net.focus = null; net.links = [];
  if (location.hash) history.replaceState(null, '', location.pathname + location.search); stopPlay(); render();
}
var head = function (t, extra) { return '<div class="hd">' + t + (extra || '') + '<button class="x" aria-label="Close">×</button></div>'; };
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
function loadImg(src) { return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src; }); }
function shrink(im, N, q) { var k = Math.min(1, N / Math.max(im.naturalWidth, im.naturalHeight)); var c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q); }
var cur = null;    /* the noticing being made */
var PHOTOS = {};   /* full photographs, this visit only: what is kept is the small one */
function onShot(file) {
  if (!file) return; var url = URL.createObjectURL(file);
  var fr = new FileReader();
  fr.onload = function () {
    var ex = exif(fr.result);
    loadImg(url).then(function (im) {
      var photo = shrink(im, 900, 0.78); if (photo.length > 400e3) photo = shrink(im, 640, 0.7);
      cur = { id: 'n' + Date.now().toString(36), at: ex.t || Date.now(), photo: photo, thumb: shrink(im, 220, 0.7), say: '', tags: [], mine: true };
      if (ex.lat != null) { cur.lat = ex.lat; cur.lng = ex.lng; cur.src = 'PHOTO'; } else { cur.lat = map.lat; cur.lng = map.lng; cur.src = 'MAP'; locate(); }
      URL.revokeObjectURL(url); db(); stepW();
    }).catch(function () { toast('That picture could not be read'); });
  };
  fr.readAsArrayBuffer(file.slice(0, 256 * 1024));
}
function locate() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function (p) {
    if (!cur || cur.src === 'TAP') return; cur.lat = p.coords.latitude; cur.lng = p.coords.longitude; cur.src = 'HERE'; focusOn(cur.lat, cur.lng, 17); whereLine();
  }, function () { whereLine(); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}
function whereLine() { var el = $('#n-where'); if (el && cur) { el.textContent = when(cur.at) + ' · ' + ll(cur.lat, cur.lng); el.className = cur.src === 'MAP' ? 'blink' : ''; } }
function onTap(x, y) {
  if (cur && !sheet.hidden && $('#n-where')) { var p = at(x, y); cur.lat = p.lat; cur.lng = p.lng; cur.src = 'TAP'; whereLine(); net.focus = cur; net.links = []; render(); return; }
  /* a knot pressed opens what was noticed there */
  var best = null, bd = 18; visible().forEach(function (n) { var q = px(n.lat, n.lng); var d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = n; } });
  if (best) openNote(best); else if (document.body.classList.contains('mapmode') && sheet.hidden) { var g = at(x, y); placeAt(g.lat, g.lng); }
}

/* ───────── a noticing: the photograph with where and when, a line, what it is. The engine stays underneath: it shows only
   an alert that is real, and offers what it reads as chips. What is chosen feeds the receipt, the net and the record ───────── */
function stepW() {
  focusOn(cur.lat, cur.lng, 17); net.focus = cur; net.links = []; render();
  open('<div class="hd"><span id="n-where"></span><button class="x" aria-label="Close">×</button></div>' +
    (cur.photo ? '<div class="ph"><img alt="" src="' + cur.photo + '"></div>' : '') +
    '<div class="say-row"><span class="pr">&gt;</span><textarea id="n-say" class="say" rows="1" maxlength="200" aria-label="What is happening"></textarea></div>' +
    '<div class="chips" id="n-chips"></div><div id="n-alert"></div>' +
    '<button class="go" id="n-next" aria-label="Next">→</button>', true);
  whereLine(); var say = $('#n-say'), tmr = 0; say.value = cur.say || '';
  say.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(function () { cur.say = say.value.trim(); cur.spId = null; reading(); }, 220); });
  $('#n-next').addEventListener('click', function () { cur.say = say.value.trim(); place(); stepS(cur.note); });
  db().then(reading); reading();
}
/* only what is real and timely: a need it names, or its season now. Nothing when there is nothing */
function alertHTML(r) {
  if (!r.issue && !(r.sp && r.lines.some(function (l) { return l.s === 'NOW'; }))) return '';
  return '<div class="alert">' + r.lines.map(function (l) { return '<p>' + esc(l.t) + '</p>'; }).join('') +
    (r.call ? '<a class="call" href="' + esc(r.call.tel) + '"><b>' + esc(r.call.label) + '</b><span>' + esc(r.call.n) + '</span></a>' : '') + '</div>';
}
/* the chips: the life it may be, the need it names, and the tags chosen before, so what one notices grows what one can say */
function pastTags() { var seen = []; NOTES.forEach(function (n) { (n.tags || []).forEach(function (t) { if (seen.indexOf(t) < 0 && !ISSUES.some(function (i) { return i.t === t; })) seen.push(t); }); }); return seen.slice(0, 6); }
function reading() {
  if (!cur || !$('#n-chips')) return; var r = read(cur); cur.r = r;
  var chips = [];
  if (r.sp) chips.push({ t: r.sp.cn, on: true, sp: r.sp.id }); r.alts.forEach(function (a) { chips.push({ t: a.cn, on: false, sp: a.id }); });
  if (r.issue) chips.push({ t: r.issue.t, on: true, fixed: true });
  pastTags().forEach(function (t) { chips.push({ t: t, on: cur.tags.indexOf(t) >= 0, tag: true }); });
  $('#n-chips').innerHTML = chips.map(function (c, i) { return '<button class="chip' + (c.on ? ' on' : '') + (c.tag ? ' w' : '') + '" data-i="' + i + '">' + esc(c.t) + '</button>'; }).join('');
  $$('#n-chips .chip').forEach(function (b) { b.addEventListener('click', function () {
    var c = chips[+b.dataset.i]; if (c.fixed) return;
    if (c.sp) cur.spId = c.on ? null : c.sp; else { var k = cur.tags.indexOf(c.t); if (k >= 0) cur.tags.splice(k, 1); else cur.tags.push(c.t); }
    reading();
  }); });
  $('#n-alert').innerHTML = alertHTML(r);
}
function place() {
  var r = read(cur); cur.r = r;
  var n = cur.note || { id: cur.id, at: cur.at, mine: true, code: code(cur.id + '|' + cur.at), wants: [] };
  n.lat = +cur.lat.toFixed(5); n.lng = +cur.lng.toFixed(5); n.src = cur.src; n.say = cur.say; n.tags = (r.issue ? [r.issue.t] : []).concat(cur.tags);
  n.sp = r.sp ? r.sp.id : ''; n.cn = r.sp ? r.sp.cn : ''; n.sci = r.sp ? r.sp.n : ''; n.g = r.group || ''; n.issue = r.issue ? r.issue.k : ''; n.thumb = cur.thumb;
  if (!cur.note) { NOTES.unshift(n); net.fresh = n.id; } cur.note = n; PHOTOS[n.id] = cur.photo; saveNotes();
  net.focus = n; net.links = r.near; render();
}
/* W.I.S.H., embodied: one key on the design stage writes its four lines from what is known, what would be great, what to do and
   who can help. What would be great starts from the need, and every choice of it stays as a tag */
var WANTS = ['LEFT ALONE', 'WATER OUT', 'SHADE', 'PETS KEPT IN', 'A CALL', 'CLEANED UP', 'PLANTED', 'LIGHTS OFF'];
var WANTS_OF = { young: ['LEFT ALONE', 'PETS KEPT IN'], hurt: ['A CALL'], dead: ['A CALL'], heat: ['WATER OUT', 'SHADE'], water: ['WATER OUT'], swoop: ['LEFT ALONE'], snake: ['LEFT ALONE'],
  litter: ['CLEANED UP'], tree: ['PLANTED', 'SHADE'], light: ['LIGHTS OFF'], cats: ['PETS KEPT IN'], poison: ['PLANTED'] };
function wishLines(n, r) {
  /* the first sentence that says what to do, not a question */
  var first = function (s) { var all = String(s || '').match(/[^.!?]+[.!?]?/g) || ['']; for (var k = 0; k < all.length; k++) if (!/\?$/.test(all[k])) return all[k].trim(); return all[0].trim(); };
  var w = n.say ? n.say + (n.cn ? ' (' + n.cn + ')' : '') : n.cn || 'Noticed';
  var i = (n.wants || []).length ? n.wants.join(', ').toLowerCase() : '';
  var s = r.issue ? first(r.issue.say) : r.sp ? first(r.sp.help || r.sp.aware) : '';
  var cs = (r.rel || []).filter(function (o) { return o.brief; })[0];
  var h = r.call ? r.call.label + ' ' + r.call.n : cs ? cs.label + ', ' + cs.sub : '';
  return [['W', w], ['I', i], ['S', s], ['H', h]].filter(function (l) { return l[1]; });
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
  var F = function (px, w) { return (w || 'bold') + ' ' + px + 'px "Courier New", Courier, monospace'; };
  var u = W / 512, pad = Math.round(W * 0.04), aw = W - pad * 2;
  /* the lower half first, so the photograph can take as much again */
  var Lc = document.createElement('canvas'); Lc.width = W; Lc.height = 3000; var x = Lc.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, 3000); x.fillStyle = '#000'; x.textBaseline = 'top';
  var y = Math.round(12 * u);
  if (show.line && n.say) { x.font = F(Math.round(28 * u)); wrapText(x, n.say, aw).forEach(function (l) { x.fillText(l, pad, y); y += Math.round(32 * u); }); y += Math.round(6 * u); }
  if (show.life && n.cn) { x.font = F(Math.round(20 * u)); x.fillText(n.cn.toUpperCase(), pad, y); y += Math.round(23 * u); x.font = F(Math.round(16 * u), 'italic bold'); x.fillText(n.sci || '', pad, y); y += Math.round(26 * u); }
  if (show.facts) {
    x.font = F(Math.round(16 * u));
    (r.lines || []).forEach(function (l) { x.fillRect(pad + 2, y + Math.round(6 * u), Math.round(6 * u), Math.round(6 * u)); wrapText(x, l.t, aw - Math.round(18 * u)).forEach(function (t) { x.fillText(t, pad + Math.round(18 * u), y); y += Math.round(20 * u); }); y += Math.round(6 * u); });
    if (r.call) { x.font = F(Math.round(17 * u)); x.fillText('CALL ' + r.call.label + ' ' + r.call.n, pad, y); y += Math.round(26 * u); }
  }
  if (show.links && r.rel && r.rel.length && art !== 'net') { x.font = F(Math.round(16 * u)); r.rel.forEach(function (o) { wrapText(x, '+ ' + o.label, aw).forEach(function (t) { x.fillText(t, pad, y); y += Math.round(19 * u); }); }); y += Math.round(6 * u); }
  if (opt.wish) { x.fillRect(pad, y, aw, Math.max(1, Math.round(2 * u))); y += Math.round(10 * u); wishLines(n, r).forEach(function (l) { x.font = F(Math.round(22 * u)); x.fillText(l[0], pad, y - Math.round(2 * u)); x.font = F(Math.round(16 * u)); wrapText(x, l[1], aw - Math.round(30 * u)).forEach(function (t) { x.fillText(t, pad + Math.round(30 * u), y); y += Math.round(20 * u); }); y += Math.round(6 * u); }); x.fillRect(pad, y, aw, Math.max(1, Math.round(2 * u))); y += Math.round(12 * u); }
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
/* the net as the art: this noticing and what it connects to, sticks and knots and hanging threads */
function netArt(x, n, r, ox, oy, w, h) {
  /* this noticing a shell at the top, what it connects to below it, in the chart's frame; black only, for the thermal head */
  var items = (r.rel || []).slice(0, 3), cx = ox + w / 2, cy = oy + h * 0.28;
  var pts = [[cx, cy]].concat(items.map(function (o, i) { var a = Math.PI * (0.18 + 0.64 * (items.length > 1 ? i / (items.length - 1) : 0.5)); return [cx - Math.cos(a) * w * 0.32, cy + Math.sin(a) * h * 0.46]; }));
  var pairs = items.map(function (o, i) { return [0, i + 1]; }); for (var i = 1; i < items.length; i++) pairs.push([i, i + 1]);
  chartCanvas(x, chart(pts, pairs, (n.at || 7) % 99991), '#000', '#000', '', 1.4);
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
function printers() { if (PRN) return Promise.resolve(PRN); return api('/partners').then(function (j) { PRN = (j && j.partners) || []; return PRN; }).catch(function () { return []; }); }
/* the design stage: the receipt as it will print, the photograph its top half. A touch on it changes the art (photograph,
   pixels, the net); W.I.S.H. writes its four lines on; the printer; PRINT. Nothing else */
var ARTS = ['photo', 'pixel', 'net'];
var STATE_OF = { held: 'HELD FOR A YES', queued: 'QUEUED', printing: 'PRINTING', printed: 'PRINTED', failed: 'NOT PRINTED', waiting: 'HELD FOR A YES', outbox: 'NO SIGNAL · WILL SEND' };
function stepS(n, boardArt) {
  var photo = PHOTOS[n.id] || n.thumb || n.photoURL || '';
  var r = read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng });
  var o = { art: boardArt ? 'pixel' : photo ? 'photo' : 'net', wish: !!n.wish };
  if (!n.wants || !n.wants.length) n.wants = (WANTS_OF[n.issue] || []).slice();
  open('<div class="hd"><span>' + esc(n.code) + '</span><button class="x" aria-label="Close">×</button></div>' +
    '<button class="slip" id="p-slip" aria-label="Change the art"></button><div class="dots" id="p-dots"></div>' +
    '<div class="ctl"><button class="k" id="p-wish" aria-pressed="false">W.I.S.H.</button><select class="k" id="p-to" aria-label="Printer"><option value="">…</option></select><a class="k" href="studio#print" aria-label="More tools" title="More tools">+</a></div>' +
    '<div class="chips" id="p-wants" hidden></div>' +
    '<button class="go" id="p-send">PRINT</button><div class="status" id="p-st"></div>');
  var cv = null, W = 512, sel = $('#p-to');
  var draw = function () {
    $('#p-dots').innerHTML = ARTS.map(function (a) { return '<i class="' + (a === o.art ? 'on' : '') + '"></i>'; }).join('');
    $('#p-wish').classList.toggle('on', o.wish); $('#p-wish').setAttribute('aria-pressed', String(o.wish));
    var ws = $('#p-wants'); ws.hidden = !o.wish;
    ws.innerHTML = WANTS.map(function (w) { return '<button class="chip w' + (n.wants.indexOf(w) >= 0 ? ' on' : '') + '" data-w="' + w + '">' + w + '</button>'; }).join('');
    $$('#p-wants .chip').forEach(function (b) { b.addEventListener('click', function () { var k = n.wants.indexOf(b.dataset.w); if (k >= 0) n.wants.splice(k, 1); else n.wants.push(b.dataset.w); saveNotes(); draw(); }); });
    slip(n, photo, r, o, W, o.art === 'pixel' ? boardArt : null).then(function (c) { cv = c; var s = $('#p-slip'); if (s) { s.innerHTML = ''; s.appendChild(c); } });
  };
  $('#p-slip').addEventListener('click', function () { o.art = ARTS[(ARTS.indexOf(o.art) + 1) % ARTS.length]; if (o.art === 'photo' && !photo) o.art = 'pixel'; if (o.art === 'pixel' && !photo && !boardArt) o.art = 'net'; draw(); });
  $('#p-wish').addEventListener('click', function () { o.wish = !o.wish; n.wish = o.wish; saveNotes(); draw(); });
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
    var btn = $('#p-send'); if (btn.dataset.next) { stepH(n); return; }
    if (!cv || !sel.value) return; btn.disabled = true; var st = $('#p-st');
    var body = { type: 'noticed', lat: +n.lat.toFixed(4), lng: +n.lng.toFixed(4), text: n.say || '' };
    if (n.cn) { body.tx = { n: n.sci, cn: n.cn }; body.g = n.g; }
    var tags = (n.tags || []).concat(o.wish ? n.wants : []); if (tags.length) body.tags = tags; if (n.issue) body.issue = n.issue;
    if (o.wish) body.wish = wishLines(n, r).map(function (l) { return l[1]; });
    var payload = { kind: 'record', code: n.code, body: JSON.stringify(body), lat: body.lat, lng: body.lng, dest: sel.value, escpos: raster(cv) };
    if (PHOTOS[n.id]) payload.photo = PHOTOS[n.id];
    st.className = 'status wait'; st.textContent = '…';
    var after = function () { btn.disabled = false; btn.dataset.next = '1'; btn.textContent = '→'; btn.setAttribute('aria-label', 'Next'); };
    send(payload).then(function (j) {
      n.sent = { id: j.id, dest: sel.value }; saveNotes(); st.className = 'status ok'; st.textContent = STATE_OF[j.job ? j.job.status : j.status] || 'SENT'; follow(j.id, st); after();
    }).catch(function (e) {
      if (e.status) { st.className = 'status'; st.textContent = e.status === 429 ? 'BUSY · TRY SOON' : e.status === 503 ? 'PRINTER FULL' : 'NOT SENT · ' + e.message; btn.disabled = false; return; }
      OUTBOX.push(payload); store.set('da.base.outbox', OUTBOX); st.className = 'status wait'; st.textContent = STATE_OF.outbox; after();
    });
  });
  draw();
}
function download(cv, name) { var a = document.createElement('a'); a.download = name; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); }
function send(payload) { return api('/stories', { method: 'POST', body: JSON.stringify(payload) }); }
function follow(id, st, k) {
  k = k || 0; if (k > 30) return;
  setTimeout(function () { if (!document.contains(st)) return; api('/receipts/' + id).then(function (j) { if (!j) return; var s = j.job ? j.job.status : j.status; var t = STATE_OF[s] || s.toUpperCase(); if (j.job && j.job.status === 'queued' && j.job.ahead) t += ' · ' + j.job.ahead; st.textContent = t; if (s !== 'printed' && s !== 'failed' && s !== 'refused') follow(id, st, k + 1); }).catch(function () { follow(id, st, k + 1); }); }, 9000);
}
function flush() {
  if (!OUTBOX.length || !navigator.onLine) return; var p = OUTBOX[0];
  send(p).then(function () { OUTBOX.shift(); store.set('da.base.outbox', OUTBOX); flush(); }).catch(function (e) { if (e.status) { OUTBOX.shift(); store.set('da.base.outbox', OUTBOX); flush(); } });
}
addEventListener('online', flush);

/* ───────── the reel: every photograph story, newest first. Three marks to a story: keep it, pass it on, print it at a place;
   ⋯ for giving and joining ───────── */
var DONATE = 'https://www.wildlifevictoria.org.au/donate';
function reelHTML(list) {
  if (!list.length) return '<p class="empty">—</p>';
  return '<div class="reel">' + list.map(function (n, i) {
    var pic = PHOTOS[n.id] || n.thumb || n.photoURL || '';
    var r = !n.story && DB ? read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng }) : null;
    var al = r && (r.issue || r.lines.some(function (l) { return l.s === 'NOW'; })) ? r.lines[0].t : '';
    return '<article class="card" data-i="' + i + '" id="c-' + esc(n.id) + '">' +
      '<div class="pic' + (n.icon ? ' icon' : '') + '"' + (pic || n.icon ? ' style="background-image:url(\'' + esc(pic || n.icon) + '\')"' : '') + '></div>' +
      (n.say || n.cn ? '<p class="ln">' + esc(n.say || n.cn) + '</p>' : '') +
      '<p class="meta">' + esc([n.cn && n.say ? n.cn : '', when(n.at)].filter(Boolean).join(' · ')) + '</p>' +
      (al ? '<p class="al">' + esc(al) + '</p>' : '') +
      '<div class="acts">' + (n.story ? '<a href="studio#' + esc(n.code) + '" aria-label="Open" title="Open">↗</a>' : '<button data-a="save" aria-label="Save" title="Save">↓</button>') +
        (n.audio || AUDIO[n.id] ? '<button data-a="play" aria-label="Play" title="Play">▶</button>' : '') + '<button data-a="share" aria-label="Share" title="Share">⤴</button>' + (n.mine ? '<button data-a="send" aria-label="Print at a place" title="Print at a place">⎙</button>' : '') +
        '<button data-a="more" aria-label="More" title="More">⋯</button></div>' +
      '<div class="more" hidden><a href="' + DONATE + '" target="_blank" rel="noopener">GIVE ↗</a><a href="studio#groups">JOIN ↗</a></div>' +
    '</article>';
  }).join('') + '</div>';
}
function wireReel(el, list) {
  $$('.card', el).forEach(function (c) {
    var n = list[+c.dataset.i];
    $$('[data-a]', c).forEach(function (b) { b.addEventListener('click', function () {
      var a = b.dataset.a;
      if (a === 'send') stepS(n);
      else if (a === 'play') { try { new Audio(n.audio || AUDIO[n.id]).play(); } catch (e) { /* no sound */ } }
      else if (a === 'more') { var m = $('.more', c); m.hidden = !m.hidden; }
      else if (a === 'save') { var r = read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng }); slip(n, PHOTOS[n.id] || n.thumb || n.photoURL, r, { wish: !!n.wish }, 512).then(function (cv) { download(cv, 'novel-global-' + (n.code || 'noticed') + '.png'); }); }
      else if (a === 'share') {
        var url = noteURL(n), t = n.say || n.cn || '';
        if (navigator.share) navigator.share({ title: 'novel.global', text: t, url: url }).catch(function () { /* closed */ });
        else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('⤴ ' + url); }, function () { toast(url); });
        else toast(url);
      }
    }); });
  });
}
function allStories() { return NOTES.concat(SHARED).sort(function (a, b) { return b.at - a.at; }); }
function stepH(n) {
  var paint = function () {
    var list = allStories();
    open('<div class="hd"><span></span><button class="x" aria-label="Close">×</button></div>' + reelHTML(list)); wireReel(sheet, list);
    if (n) { var c = document.getElementById('c-' + n.id); if (c && c.parentNode) c.parentNode.scrollLeft = c.offsetLeft - 16; }
  };
  var k = sheet.dataset.k = 'h' + Date.now();
  paint(); sheet.dataset.k = k; db().then(loadShared).then(function () { if (!sheet.hidden && sheet.dataset.k === k) { paint(); sheet.dataset.k = k; } });
}
/* a knot pressed, or a code opened: the reel at that story */
function openNote(n) { net.focus = n; net.links = []; focusOn(n.lat, n.lng, Math.max(map.z, 16)); cur = null; stepH(n); }

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
var nowEl = $('#now'), nowI = 0, nowT = 0;
function nowTick() {
  var items = nowItems().concat(seasonNow().slice(0, 4).map(function (f) { return { k: 'IN SEASON', t: f.cn + ': ' + f.event.charAt(0).toLowerCase() + f.event.slice(1) + '.' }; }));
  if (!items.length) { nowEl.hidden = true; return; } nowEl.hidden = false;
  var it = items[nowI++ % items.length]; nowEl.innerHTML = '<b>' + esc(it.k) + '</b><span></span>'; glitch($('span', nowEl), it.t, 700);
  clearTimeout(nowT); nowT = setTimeout(nowTick, 7000);
}
function helpHTML() {
  return '<div class="lbl">CALL</div><ul class="list">' + (B.contacts || []).map(function (c) { return '<li><a href="' + esc(c[2]) + '"><span>' + esc(c[1]) + '</span><small>' + esc(c[0]) + '</small></a></li>'; }).join('') + '</ul>' +
    (DB && DB.links ? '<div class="lbl">REPORT</div><ul class="list">' + DB.links.map(function (l) { return '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener"><span>' + esc(l[0]) + '</span><small>↗</small></a></li>'; }).join('') + '</ul>' : '');
}

/* ───────── the guide: an index, as a parts catalogue keeps one. What is urgent, what each need asks, every number, what is in season,
   every life by kind with its months, every case by theme. One field searches it all; nothing is shown that was not asked for ───────── */
var KINDS = { bird: 'Birds', parrot: 'Parrots', waterbird: 'Waterbirds', owl: 'Owls and frogmouths', raptor: 'Hawks and falcons', macropod: 'Kangaroos', possum: 'Possums', flyingfox: 'Flying-foxes',
  bat: 'Microbats', rodent: 'Rats and mice', fox: 'Foxes', cat: 'Cats', dog: 'Dogs', rabbit: 'Rabbits', lizard: 'Lizards', snake: 'Snakes', turtle: 'Turtles', frog: 'Frogs', butterfly: 'Butterflies',
  moth: 'Moths', bee: 'Bees', wasp: 'Wasps', fly: 'Flies', beetle: 'Beetles', bug: 'Bugs', spider: 'Spiders', orb: 'Orb-weavers', grasshopper: 'Grasshoppers', mantis: 'Mantises',
  dragonfly: 'Dragonflies', aquatic: 'Water life', snail: 'Snails and slugs', segmented: 'Worms' };
var STATUS_OF = { N: 'Native', I: 'Introduced', T: 'Threatened', E: 'Uncommon here' };
function guideSheet(q) {
  open('<div class="hd"><span>GUIDE</span><button class="x" aria-label="Close">×</button></div>' +
    '<div class="say-row"><span class="pr">&gt;</span><input id="q" class="find" type="search" autocomplete="off" aria-label="Search the guide"></div><div id="g-out"></div>', false, 'wide');
  var inp = $('#q'); inp.value = q || ''; if (!('ontouchstart' in window)) inp.focus();
  var paint = function () { var t = lower(inp.value.trim()); if (t === '2600') { whistle(); glitch($('.hd span'), 'TRUNK SEIZED', 900); } $('#g-out').innerHTML = t.length > 1 ? results(t) : index(); wireGuide(); };
  inp.addEventListener('input', paint); db().then(paint); paint();
}
function index() {
  var sec = function (h, n, body) { return '<section><h3>' + h + (n != null ? '<small>' + n + '</small>' : '') + '</h3>' + body + '</section>'; };
  var li = function (attr, a, b) { return '<li><button ' + attr + '><span>' + esc(a) + '</span>' + (b != null ? '<small>' + esc(b) + '</small>' : '') + '</button></li>'; };
  var h = '';
  var now = nowItems(); if (now.length) h += sec('Now', null, '<ul class="list">' + now.map(function (i) { return '<li class="urgent"><p><b>' + esc(i.k) + '</b> ' + esc(i.t) + '</p></li>'; }).join('') + '</ul>');
  h += sec('Needs', ISSUES.length, '<ul class="list">' + ISSUES.map(function (i) { return li('data-is="' + i.k + '"', i.t.charAt(0) + i.t.slice(1).toLowerCase(), i.call ? '☎' : ''); }).join('') + '</ul>');
  h += sec('Call', (B.contacts || []).length, '<ul class="list">' + (B.contacts || []).map(function (c) { return '<li><a href="' + esc(c[2]) + '"><span>' + esc(c[1].charAt(0) + c[1].slice(1).toLowerCase()) + '</span><small>' + esc(c[0]) + '</small></a></li>'; }).join('') + '</ul>');
  if (DB) {
    var sn = seasonNow(); h += sec('In season · ' + MON[M].charAt(0) + MON[M].slice(1).toLowerCase(), sn.length, '<ul class="list">' + sn.slice(0, 12).map(function (f) { return li('data-sp="' + esc(f.id) + '"', f.cn, f.event); }).join('') + '</ul>');
    var by = {}; DB.field.forEach(function (f) { (by[f.g] = by[f.g] || []).push(f); });
    h += sec('Lives', DB.field.length, '<ul class="list">' + Object.keys(KINDS).filter(function (g) { return by[g]; }).map(function (g) { return li('data-g="' + g + '"', KINDS[g], by[g].length); }).join('') + '</ul>');
    var th = {}; DB.briefs.forEach(function (b) { (th[b.th] = th[b.th] || []).push(b); });
    h += sec('What worked elsewhere', DB.briefs.length, '<ul class="list">' + Object.keys(th).map(function (k) { return li('data-th="' + k + '"', k.charAt(0).toUpperCase() + k.slice(1), th[k].length); }).join('') + '</ul>');
  }
  return '<div class="idx">' + h + '</div>';
}
function results(t) {
  var res = [];
  ISSUES.forEach(function (i) { if (i.t.toLowerCase().indexOf(t) === 0 || i.re.test(t)) res.push({ s: 9, h: '<button data-is="' + i.k + '"><span>' + i.t.charAt(0) + i.t.slice(1).toLowerCase() + '</span><small>NEED</small></button>' }); });
  (B.contacts || []).forEach(function (c) { if (lower(c[1]).indexOf(t) >= 0) res.push({ s: 8, h: '<a href="' + esc(c[2]) + '"><span>' + esc(c[1]) + '</span><small>' + esc(c[0]) + '</small></a>' }); });
  if (DB) {
    DB.field.forEach(function (f) { var s = lower(f.cn).indexOf(t) >= 0 ? 3 : lower(f.n).indexOf(t) >= 0 ? 2 : lower([f.g, KINDS[f.g], f.where, f.event].join(' ')).indexOf(t) >= 0 ? 1 : 0; if (s) res.push({ s: s, h: '<button data-sp="' + esc(f.id) + '"><span>' + esc(f.cn) + '</span><small>' + esc(KINDS[f.g] || f.g) + '</small></button>' }); });
    DB.briefs.forEach(function (b) { if (lower([b.t, b.i, b.city, b.th].join(' ')).indexOf(t) >= 0) res.push({ s: 0.5, h: '<a href="' + esc(b.url) + '" target="_blank" rel="noopener"><span>' + esc(b.t) + '</span><small>' + esc((b.city || '') + ' ' + (b.yr || '')) + ' ↗</small></a>' }); });
  }
  res.sort(function (a, b) { return b.s - a.s; });
  return '<ul class="list">' + (res.slice(0, 40).map(function (r) { return '<li>' + r.h + '</li>'; }).join('') || '<li class="empty">—</li>') + '</ul>';
}
function wireGuide() {
  $$('#g-out [data-sp]').forEach(function (b) { b.addEventListener('click', function () { lifeSheet(b.dataset.sp); }); });
  $$('#g-out [data-is]').forEach(function (b) { b.addEventListener('click', function () { needSheet(b.dataset.is); }); });
  $$('#g-out [data-g]').forEach(function (b) { b.addEventListener('click', function () {
    var l = DB.field.filter(function (f) { return f.g === b.dataset.g; }); var li = b.parentNode;
    if (li.nextSibling && li.nextSibling.className === 'sub') { li.parentNode.removeChild(li.nextSibling); return; }
    var sub = document.createElement('li'); sub.className = 'sub'; sub.innerHTML = '<ul class="list">' + l.map(function (f) { return '<li><button data-sp2="' + esc(f.id) + '"><span>' + esc(f.cn) + '</span><small>' + bars(f.act, f.brd) + '</small></button></li>'; }).join('') + '</ul>';
    li.parentNode.insertBefore(sub, li.nextSibling); $$('[data-sp2]', sub).forEach(function (x) { x.addEventListener('click', function () { lifeSheet(x.dataset.sp2); }); });
  }); });
  $$('#g-out [data-th]').forEach(function (b) { b.addEventListener('click', function () {
    var li = b.parentNode; if (li.nextSibling && li.nextSibling.className === 'sub') { li.parentNode.removeChild(li.nextSibling); return; }
    var sub = document.createElement('li'); sub.className = 'sub'; sub.innerHTML = '<ul class="list">' + DB.briefs.filter(function (x) { return x.th === b.dataset.th; }).map(function (x) { return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener"><span>' + esc(x.t) + '<br><small>' + esc(x.fact || '') + '</small></span><small>' + esc((x.city || '') + ' ' + (x.yr || '')) + ' ↗</small></a></li>'; }).join('') + '</ul>';
    li.parentNode.insertBefore(sub, li.nextSibling);
  }); });
}
/* the year at a glance, as a data sheet prints it: a cell a month, filled when it is most active, a dot when about, ▾ for young */
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
    (r.rel.length ? '<div class="lbl">Related</div><ul class="list">' + r.rel.map(function (o) { return o.brief ? '<li><a href="' + esc(o.brief.url) + '" target="_blank" rel="noopener"><span>' + esc(o.label) + '</span><small>' + esc(o.sub) + ' ↗</small></a></li>' : '<li><button data-sp="' + esc(o.id) + '"><span>' + esc(o.label) + '</span><small>' + esc(o.sub) + '</small></button></li>'; }).join('') + '</ul>' : '') +
    '<label class="cam sm solo" aria-label="Photograph one"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="18" width="48" height="34" rx="2"/><path d="M22 18l4-7h12l4 7"/><circle cx="32" cy="35" r="10"/></svg><input class="shot" type="file" accept="image/*" capture="environment"></label>', false, 'wide');
  backTo(); $$('#sheet [data-sp]').forEach(function (b) { b.addEventListener('click', function () { lifeSheet(b.dataset.sp); }); });
  var inp = $('.shot', sheet); inp.addEventListener('change', function () { onShot(inp.files[0]); });
}
function needSheet(k) {
  var i = ISSUES.filter(function (x) { return x.k === k; })[0]; if (!i) return; var c = callOf(i.call);
  var lives = DB ? related(null, null, i).map(function (f) { return '<li><button data-sp="' + esc(f.id) + '"><span>' + esc(f.cn) + '</span><small>' + esc(KINDS[f.g] || f.g) + '</small></button></li>'; }).join('') : '';
  var cs = caseOf(null, i);
  open('<div class="hd"><button class="back" aria-label="Back">←</button><span>Need</span><button class="x" aria-label="Close">×</button></div><h2>' + esc(i.t.charAt(0) + i.t.slice(1).toLowerCase()) + '</h2>' +
    '<div class="alert"><p>' + esc(i.say) + '</p>' + (c ? '<a class="call" href="' + esc(c.tel) + '"><b>' + esc(c.label) + '</b><span>' + esc(c.n) + '</span></a>' : '') + '</div>' +
    (lives ? '<div class="lbl">Most at stake now</div><ul class="list">' + lives + '</ul>' : '') +
    (cs ? '<div class="lbl">What worked elsewhere</div><ul class="list"><li><a href="' + esc(cs.url) + '" target="_blank" rel="noopener"><span>' + esc(cs.t) + '<br><small>' + esc(cs.fact || '') + '</small></span><small>' + esc((cs.city || '') + ' ' + (cs.yr || '')) + ' ↗</small></a></li></ul>' : ''), false, 'wide');
  backTo(); $$('#sheet [data-sp]').forEach(function (b) { b.addEventListener('click', function () { lifeSheet(b.dataset.sp); }); });
}
function backTo() { var b = $('#sheet .back'); if (b) b.addEventListener('click', function () { guideSheet(''); }); }

/* ───────── the map is a key: the ground, the knots, a touch to place one, and many at once: photographs, calls, icons ───────── */
function mapOn(on) {
  document.body.classList.toggle('mapmode', on); $('#b-map').classList.toggle('on', on); if (on && !sheet.hidden) close();
  net.all = on; credit(); if (on) { var l = NOTES.concat(SHARED); if (l.length) fit(l); else render(); loadShared().then(render); } else render();
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

/* ───────── RADIO: what everyone noticed, as a net over the ground, as a wall of pictures, or as the help lines.
   The radar is the studio's: a key away ───────── */
var radioWay = 'net', playing = null;
function loadShared() {
  return api('/stories').then(function (j) {
    SHARED = ((j && j.stories) || []).map(function (s) {
      if (s.kind === 'record') { try { var d = JSON.parse(s.body); if (!isFinite(+d.lat)) return null; return { id: 's' + s.id, code: s.code, at: s.at, lat: +d.lat, lng: +d.lng, say: d.text || '', cn: d.tx ? d.tx.cn : '', sci: d.tx ? d.tx.n : '', sp: '', issue: d.issue || '', tags: d.tags || [], photoURL: s.photo ? API + '/photos/' + s.id : '', thumb: '' }; } catch (e) { return null; } }
      if (s.kind === 'story' && s.photo) return { id: 's' + s.id, code: s.code, at: s.at, story: true, photoURL: API + '/photos/' + s.id };
      return null;
    }).filter(Boolean);
    if (DB) SHARED.forEach(function (x) { if (x.cn && !x.sp) { var f = DB.field.filter(function (ff) { return ff.cn === x.cn; })[0]; if (f) x.sp = f.id; } });
  }).catch(function () { /* no signal: what is here stands */ });
}
function radioSheet(way) {
  radioWay = way || radioWay; net.all = radioWay === 'net'; net.focus = null; net.links = [];
  open(head('RADIO') +
    '<div class="seg" id="r-way"><button data-w="net">NET</button><button data-w="reel">REEL</button><button data-w="help">HELP</button><a class="k" style="flex:1;border:0;border-left:1px solid var(--ink);font-size:11px;letter-spacing:.1em;line-height:30px" href="studio#radio">RADAR ↗</a></div>' +
    '<div id="r-body"></div>', radioWay === 'net');
  $$('#r-way button').forEach(function (b) { b.classList.toggle('on', b.dataset.w === radioWay); b.addEventListener('click', function () { radioSheet(b.dataset.w); }); });
  var body = $('#r-body');
  if (radioWay === 'help') { db().then(function () { body.innerHTML = '<ul class="key" style="margin-top:10px">' + nowItems().map(function (i) { return '<li class="alert"><small>' + esc(i.k) + '</small>' + esc(i.t) + '</li>'; }).join('') + '</ul>' + helpHTML() + packsHTML(); wirePacks(); }); return; }
  var all = allStories;
  var paint = function () {
    if (radioWay === 'reel') { var all2 = all(); body.innerHTML = reelHTML(all2); wireReel(body, all2); }
    else {
      var list = all().filter(function (n) { return !n.story; });
      body.innerHTML = '<div class="row" style="margin-top:10px"><button class="k" id="r-play">PLAY</button><button class="k" id="r-save">SAVE AS ART</button><a class="k" href="#pixel">PIXEL BOARD</a></div>' +
        (list.length ? '<ul class="list">' + list.slice(0, 30).map(function (n, i) { return '<li><button data-i="' + i + '"><span>' + esc(n.cn || n.say || 'Noticed') + '</span><small>' + esc(when(n.at)) + (n.mine ? ' · HERE' : '') + '</small></button></li>'; }).join('') + '</ul>' : '<p class="empty">—</p>');
      $$('.list button', body).forEach(function (b) { b.addEventListener('click', function () { openNote(list[+b.dataset.i]); }); });
      $('#r-play').addEventListener('click', function () { play(list); });
      $('#r-save').addEventListener('click', function () { saveNetArt(list); });
      if (list.length) fit(list);
    }
    render();
  };
  paint(); db().then(loadShared).then(function () { if (!sheet.hidden && $('#r-body') === body && document.contains(body)) paint(); });
}
function fit(list) {
  var la = list.map(function (n) { return n.lat; }), lo = list.map(function (n) { return n.lng; });
  var s = Math.min.apply(null, la), nn = Math.max.apply(null, la), w = Math.min.apply(null, lo), e = Math.max.apply(null, lo);
  var wide = innerWidth >= 760; var z = 17; while (z > 11 && (wx(e, z) - wx(w, z) > (wide ? map.w - 520 : map.w * 0.8) || wy(s, z) - wy(nn, z) > (wide ? map.h * 0.7 : map.h * 0.28))) z--;
  focusOn((s + nn) / 2, (w + e) / 2, z);
}
/* PLAY: the net as it was made, a knot at a time, oldest first */
function play(list) {
  stopPlay(); if (!list.length) return; var order = list.slice().sort(function (a, b) { return a.at - b.at; }), k = 0; playing = { mine: NOTES, keep: SHARED, t: 0 };
  var step = function () {
    k++; var shown = order.slice(0, k); NOTES = shown.filter(function (n) { return n.mine; }); SHARED = shown.filter(function (n) { return !n.mine; });
    net.fresh = order[k - 1].id; net.focus = order[k - 1]; net.links = []; drawNet();
    playing.t = setTimeout(k < order.length ? step : stopPlay, k < order.length ? 700 : 1600);
  };
  step();
}
function stopPlay() { if (!playing) return; clearTimeout(playing.t); NOTES = playing.mine; SHARED = playing.keep; playing = null; net.focus = null; render(); }
function saveNetArt(list) {
  if (!list.length) return; var S = 1080, c = document.createElement('canvas'); c.width = c.height = S; var x = c.getContext('2d'); x.fillStyle = '#EDEBE4'; x.fillRect(0, 0, S, S);
  var la = list.map(function (n) { return n.lat; }), lo = list.map(function (n) { return n.lng; });
  var s = Math.min.apply(null, la), nn = Math.max.apply(null, la) + 1e-6, w = Math.min.apply(null, lo), e = Math.max.apply(null, lo) + 1e-6;
  var pts = list.map(function (n) { return [200 + (n.lng - w) / (e - w) * (S - 400), 200 + (nn - n.lat) / (nn - s) * (S - 440)]; });
  var pairs = []; for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length && pairs.length < 160; j++) if (kin(list[i], list[j]) || j === i + 1) pairs.push([i, j]);
  chartCanvas(x, chart(pts, pairs, seedOf(list)), '#A27B48', '#1E1A16', 'rgba(0,0,0,.13)', 2);
  x.fillStyle = '#1E1A16'; pts.forEach(function (p, i) { x.beginPath(); x.arc(p[0], p[1], list[i].mine ? 10 : 7, 0, 7); x.fill(); });
  x.font = '20px ui-monospace, Menlo, monospace'; x.fillStyle = '#6E6C66'; x.fillText(list.length + ' · ' + when(Date.now()) + ' · novel.global', 60, S - 50);
  var a2 = document.createElement('a'); a2.download = 'novel-global-net.png'; a2.href = c.toDataURL('image/png'); document.body.appendChild(a2); a2.click(); a2.remove();
}
function packsHTML() {
  var p = function (k, t) { return '<button class="k' + (PACKS[k] ? ' on' : '') + '" data-pack="' + k + '">' + t + '</button>'; };
  return '<div class="lbl">PACKS</div><div class="row">' + p('terrain', 'TERRAIN') + p('field', 'FIELD DATA') + '<a class="k" href="studio">STUDIO ↗</a></div>';
}
function wirePacks() { $$('[data-pack]').forEach(function (b) { b.addEventListener('click', function () { PACKS[b.dataset.pack] = !PACKS[b.dataset.pack]; store.set('da.base.packs', PACKS); b.classList.toggle('on', PACKS[b.dataset.pack]); if (b.dataset.pack === 'field') { DB = null; dbP = null; } credit(); render(); }); }); }

/* ───────── the pixel board: paste, drop or pick a picture; it comes back as wonky pixels. Three frames make it move ───────── */
var board = { frames: [], i: 0, cells: 40, tones: 2, anim: 0 };
function boardSheet() {
  open(head('PIXEL BOARD') +
    '<label class="board" id="pb" aria-label="Paste, drop or pick a picture"><span class="plus">+</span><input id="pb-in" type="file" accept="image/*" hidden></label>' +
    '<div class="frames" id="pb-f"></div>' +
    '<div class="seg" id="pb-c" style="margin-top:10px"><button data-v="24">24</button><button data-v="40">40</button><button data-v="64">64</button></div>' +
    '<div class="seg" id="pb-t" style="margin-top:6px"><button data-v="2">■□</button><button data-v="4">■▪□</button><button data-v="8">RGB</button></div>' +
    '<div class="row" style="margin-top:10px"><button class="k" id="pb-anim" aria-label="Animate" title="Animate">▶</button><button class="k" id="pb-save" aria-label="Save" title="Save">↓</button><button class="k" id="pb-print" aria-label="Print" title="Print">⎙</button></div>');
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
  $('#pb-anim').addEventListener('click', function () { if (board.anim) { clearInterval(board.anim); board.anim = 0; return; } if (board.frames.length < 2) { toast('+ +'); return; } board.anim = setInterval(function () { if (!$('#pb')) { clearInterval(board.anim); board.anim = 0; return; } board.i = (board.i + 1) % board.frames.length; paint(); }, 333); });
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
function route() {
  var h = decodeURIComponent(location.hash.slice(1));
  if (!/^(radio|pixel|search|guide|now|n=[A-Z0-9-]+)$/i.test(h)) { location.replace('studio' + location.search + location.hash); return; }
  if (h === 'radio') radioSheet(); else if (h === 'pixel') boardSheet(); else if (h === 'search' || h === 'guide' || h === 'now') guideSheet('');
  else if (/^n=DA-/i.test(h)) {
    var c = h.slice(2).toUpperCase(); var n = NOTES.filter(function (x) { return x.code === c; })[0];
    if (n) openNote(n); else api('/stories/' + c).then(function (j) { if (j && j.story) { SHARED = []; return loadShared().then(function () { var s = SHARED.filter(function (x) { return x.code === c; })[0]; if (s) openNote(s); }); } }).catch(function () { toast(c + ' is not shown yet'); });
  }
}
addEventListener('hashchange', function () { if (!location.hash) { if (!sheet.hidden) close(); return; } route(); });
$$('#shot, .shot').forEach(function (inp) { inp.addEventListener('change', function () { onShot(inp.files[0]); inp.value = ''; }); });
$('#b-search').addEventListener('click', function () { location.hash = 'guide'; });
$('#b-map').addEventListener('click', function () { mapOn(!document.body.classList.contains('mapmode')); });
$('#m-close').addEventListener('click', function () { mapOn(false); });
$('#m-add').addEventListener('change', function () { batch(this.files); this.value = ''; });
$('#b-theme').addEventListener('click', function () {
  var dark = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim().toUpperCase() !== '#EDEBE4'; var t = dark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('da.base.theme', t); } catch (e) { /* fine */ }
});
nowEl.addEventListener('click', function () { location.hash = 'guide'; });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); if (e.key === '/' && sheet.hidden && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); location.hash = 'guide'; } });
function credit() { $('#credit').textContent = PACKS.terrain && B.credit && document.body.classList.contains('mapmode') ? B.credit : ''; }

credit(); dock.hidden = !NOTES.length; render();
glitch($('#ask'), $('#ask').dataset.say, 900);
/* the field pack after the first paint, then what is happening now */
setTimeout(function () { db().then(function () { nowTick(); }); flush(); }, 700);
if (location.hash) route();
window.__base = { wish: function () { var n = NOTES[0]; return n ? wishLines(n, read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng })) : []; }, read: read, guess: guess, issueOf: issueOf, related: related, nowItems: nowItems, exif: exif, notes: function () { return NOTES; }, db: db, map: map, code: code, pixelArt: pixelArt, slip: slip, set: function (n) { cur = n; } };
})();
