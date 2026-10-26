/* novel.global, the aura: the showcase at /. One sheet of blueprint paper, nothing ever leaves it.
   A seed of light waits at the centre; a touch and it bursts into the three rings of the globe, and the drone begins. A page
   touched and the rings are drawn in again as an irukandji: the bell above, four tentacles below, each tentacle a step of one
   piece (notice, W.I.S.H., art, print), and caught along them what it has grabbed on the way (the map, the lives, the data, El
   Niño). All white, by hand, in dots and lines. Every picture is kept in colour, in full, in the portfolio; nothing is cropped.
   The base is underneath (its pages still open by link) and whole at /?base. Plain script, as the base: no ?. or ?? */
(function () {
  'use strict';
  var NG = window.NG; if (!NG) return;
  var $ = NG.$, esc = NG.esc, store = NG.store, B = window.BASE || {};
  var INK = '#F4F1E8', BLUE = '#17457F';
  var still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ───────── the portfolio: every print kept in colour, in IndexedDB (pictures are too large for localStorage) ───────── */
  var FOLIO = [], idb = null;
  function folioDB() {
    if (idb) return idb;
    idb = new Promise(function (res) {
      try { var q = indexedDB.open('novelglobal', 1); q.onupgradeneeded = function () { q.result.createObjectStore('folio', { keyPath: 'id' }); }; q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; } catch (e) { res(null); }
    });
    return idb;
  }
  function folioLoad() {
    return folioDB().then(function (d) {
      if (!d) return FOLIO; return new Promise(function (res) {
        try { var all = [], c = d.transaction('folio').objectStore('folio').openCursor(); c.onsuccess = function () { var k = c.result; if (k) { all.push(k.value); k.continue(); } else { FOLIO = all.sort(function (a, b) { return b.at - a.at; }); res(FOLIO); } }; c.onerror = function () { res(FOLIO); }; } catch (e) { res(FOLIO); }
      });
    });
  }
  function folioKeep(item) {
    FOLIO = [item].concat(FOLIO.filter(function (f) { return f.id !== item.id; }));
    var drop = FOLIO.slice(24); FOLIO = FOLIO.slice(0, 24);
    return folioDB().then(function (d) { if (!d) return; try { var s = d.transaction('folio', 'readwrite').objectStore('folio'); s.put(item); drop.forEach(function (f) { s.delete(f.id); }); } catch (e) { /* kept for this visit */ } });
  }
  function folioDrop(id) { FOLIO = FOLIO.filter(function (f) { return f.id !== id; }); return folioDB().then(function (d) { if (d) try { d.transaction('folio', 'readwrite').objectStore('folio').delete(id); } catch (e) { /* fine */ } }); }
  var slides = function () { return FOLIO.concat(NG.pieces().map(function (p) { return { id: p.id, at: p.at, src: p.src, cap: 'A piece' + (p.at ? ', ' + NG.when(p.at).slice(0, 6) : '') }; })); };

  /* ───────── the colour poster: the picture in full on blueprint paper, the life, the four lines, where and when ───────── */
  var FONT = '"Architects Daughter", "Comic Sans MS", "Bradley Hand", cursive';
  var fontP = null;
  function fontReady() { if (!fontP) fontP = (document.fonts && document.fonts.load ? document.fonts.load('26px "Architects Daughter"').catch(function () {}) : Promise.resolve()).then(function () { return true; }); return fontP; }
  var grainC = null;
  function grain() {
    if (grainC) return grainC; grainC = document.createElement('canvas'); grainC.width = grainC.height = 160; var g = grainC.getContext('2d'), im = g.createImageData(160, 160), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var v = Math.random(); d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = v > 0.5 ? (v - 0.5) * 34 : 0; }
    g.putImageData(im, 0, 0); return grainC;
  }
  function paper(x, W, H) {
    x.fillStyle = BLUE; x.fillRect(0, 0, W, H); x.fillStyle = x.createPattern(grain(), 'repeat'); x.fillRect(0, 0, W, H);
    var v = x.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.8); v.addColorStop(0, 'rgba(6,24,52,0)'); v.addColorStop(1, 'rgba(6,24,52,.34)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
  }
  /* a line as a hand draws it: a little off its course, and a faint second pass */
  function handLine(x, pts, w, a, seed) {
    seed = seed || 1; var j = function (i, k) { return Math.sin(seed * 12.9898 + i * 78.233 + k) * 0.9; };
    [0, 1].forEach(function (pass) {
      x.beginPath(); pts.forEach(function (p, i) { var px = p[0] + j(i, pass) * (pass ? 1.2 : 0.5), py = p[1] + j(i, pass + 3) * (pass ? 1.2 : 0.5); if (i) x.lineTo(px, py); else x.moveTo(px, py); });
      x.lineWidth = pass ? w * 0.5 : w; x.strokeStyle = 'rgba(244,241,232,' + (pass ? a * 0.3 : a) + ')'; x.lineCap = x.lineJoin = 'round'; x.stroke();
    });
  }
  function handRect(x, X, Y, w, h, lw, a, seed) { var pts = [], s = 10; var push = function (x0, y0, x1, y1) { for (var i = 0; i <= s; i++) pts.push([x0 + (x1 - x0) * i / s, y0 + (y1 - y0) * i / s]); };
    push(X, Y, X + w, Y); push(X + w, Y, X + w, Y + h); push(X + w, Y + h, X, Y + h); push(X, Y + h, X, Y - 3); handLine(x, pts, lw, a, seed); }
  function wrap(x, t, w) { var out = [], line = ''; String(t || '').split(/\s+/).forEach(function (wd) { var tr = line ? line + ' ' + wd : wd; if (x.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; }); if (line) out.push(line); return out; }
  function irukMark(x, cx, cy, s, a) {
    x.save(); x.strokeStyle = 'rgba(244,241,232,' + a + ')'; x.fillStyle = 'rgba(244,241,232,' + a + ')'; x.lineWidth = Math.max(1, s * 0.07); x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx - s * 0.5, cy + s * 0.2); x.bezierCurveTo(cx - s * 0.55, cy - s * 0.75, cx + s * 0.55, cy - s * 0.75, cx + s * 0.5, cy + s * 0.2); x.closePath(); x.stroke();
    for (var i = 0; i < 4; i++) { var tx = cx - s * 0.36 + i * s * 0.24; for (var k = 1; k < 6; k++) { x.beginPath(); x.arc(tx + Math.sin(k + i) * s * 0.04, cy + s * 0.22 + k * s * 0.17, s * 0.035, 0, 7); x.fill(); } }
    x.restore();
  }
  function artOf(P, art, aw, maxH) {
    /* → a canvas of the art, in colour, its whole picture: never cropped, only scaled to fit */
    var im = P.img, c = document.createElement('canvas'), g = c.getContext('2d');
    if ((art === 'photo' || art === 'pixel') && im) {
      var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.min(aw / iw, maxH / ih); c.width = Math.round(iw * k); c.height = Math.round(ih * k);
      if (art === 'photo') { g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height); return c; }
      /* wonky pixels, in their own colours: each cell a little off its square, as if laid by hand */
      var cells = 48, s = document.createElement('canvas'), q = cells / Math.max(iw, ih); s.width = Math.max(4, Math.round(iw * q)); s.height = Math.max(4, Math.round(ih * q));
      var sx = s.getContext('2d'); sx.drawImage(im, 0, 0, s.width, s.height); var d = sx.getImageData(0, 0, s.width, s.height).data, cw = c.width / s.width, ch = c.height / s.height;
      g.fillStyle = BLUE; g.fillRect(0, 0, c.width, c.height);
      for (var y = 0; y < s.height; y++) for (var xx = 0; xx < s.width; xx++) { var i = (y * s.width + xx) * 4, w = Math.sin(xx * 3.1 + y * 7.7);
        g.fillStyle = 'rgb(' + d[i] + ',' + d[i + 1] + ',' + d[i + 2] + ')'; g.save(); g.translate((xx + 0.5) * cw, (y + 0.5) * ch); g.rotate(w * 0.06); g.fillRect(-cw * 0.47, -ch * 0.47, cw * 0.94, ch * 0.94); g.restore(); }
      return c;
    }
    if (art === 'sign') {
      var r = P.r || {}, n = P.note || {}, word = (r.issue && NG.SIGN[r.issue.k]) || (n.cn ? 'LIFE HERE: ' + n.cn.toUpperCase() : 'NOTICED HERE');
      c.width = aw; g.font = '700 ' + Math.round(aw * 0.1) + 'px ' + FONT; var lines = wrap(g, word, aw * 0.86); c.height = Math.round(aw * 0.14 * lines.length + aw * 0.24);
      g.fillStyle = INK; g.fillRect(0, 0, c.width, c.height); g.fillStyle = BLUE; g.font = '700 ' + Math.round(aw * 0.1) + 'px ' + FONT; g.textBaseline = 'top';
      lines.forEach(function (l, i) { g.fillText(l, aw * 0.07, aw * 0.08 + i * aw * 0.13); });
      var act = r.issue ? NG.actions(r.issue.say, 1) : ''; if (act) { g.font = Math.round(aw * 0.038) + 'px ' + FONT; wrap(g, act, aw * 0.86).slice(0, 2).forEach(function (l, i) { g.fillText(l, aw * 0.07, aw * 0.1 + lines.length * aw * 0.13 + i * aw * 0.05); }); }
      return c;
    }
    /* the net: this noticing at the heart, the sightings revealed near it where they really are, the lives it is tied to round it */
    c.width = aw; c.height = Math.round(aw * 0.8); var cx = aw / 2, cy = c.height * 0.46, n2 = P.note || P, seen = (n2.seen || []).slice(0, 6), rel = ((P.r && P.r.rel) || []).slice(0, 4);
    var far = seen.reduce(function (m, s2) { return Math.max(m, s2.d || 0); }, 300), pts = [];
    seen.forEach(function (s2) { var dy = (n2.lat - s2.lat) * 111000, dx = (s2.lng - n2.lng) * 111000 * Math.cos(n2.lat * Math.PI / 180), k2 = aw * 0.36 / far; pts.push([cx + dx * k2, cy + dy * k2, s2.cn, 1]); });
    rel.forEach(function (o, i) { var a = Math.PI * (0.15 + 0.7 * (rel.length > 1 ? i / (rel.length - 1) : 0.5)); pts.push([cx - Math.cos(a) * aw * 0.38, cy + Math.sin(a) * c.height * 0.4, (o.f && o.f.cn) || o.t || '', 0]); });
    pts.forEach(function (p, i) { var m = [(cx + p[0]) / 2 + Math.sin(i) * 12, (cy + p[1]) / 2 + Math.cos(i) * 12], line = []; for (var k3 = 0; k3 <= 12; k3++) { var t = k3 / 12; line.push([(1 - t) * (1 - t) * cx + 2 * (1 - t) * t * m[0] + t * t * p[0], (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * m[1] + t * t * p[1]]); } handLine(g, line, 1.6, p[3] ? 0.85 : 0.5, i + 3); });
    g.fillStyle = INK; g.font = Math.round(aw * 0.03) + 'px ' + FONT; g.textBaseline = 'middle';
    pts.forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], p[3] ? 5 : 3.5, 0, 7); g.fill(); if (p[2]) { var tw = g.measureText(p[2]).width; g.fillText(p[2], Math.max(4, Math.min(aw - tw - 4, p[0] + 9)), p[1] - 10); } });
    irukMark(g, cx, cy, aw * 0.12, 0.95);
    return c;
  }
  function poster(P, art) {
    var W = 900, pad = 56, aw = W - pad * 2;
    return fontReady().then(function () {
      var a = artOf(P, art || 'photo', aw, aw * 1.3), n = P.note || {}, r = P.r || {}, lines = (P.lines || []).filter(Boolean);
      var c = document.createElement('canvas'), x = c.getContext('2d'); c.width = W; c.height = 4000; x.font = '26px ' + FONT;
      var body = []; lines.forEach(function (l, i) { wrap(x, l, aw - 60).forEach(function (w, k) { body.push([k ? '' : 'WISH'[i], w]); }); });
      var H = pad + 54 + a.height + 40 + 64 + (n.sci || (r.sp && r.sp.n) ? 34 : 0) + 20 + body.length * 38 + 50 + 70 + pad;
      c.height = H; paper(x, W, H);
      x.fillStyle = INK; x.textBaseline = 'top'; x.font = '22px ' + FONT; irukMark(x, pad + 14, pad + 16, 30, 0.9); x.fillText('novel.global', pad + 40, pad + 4);
      var codeT = n.code || ''; if (codeT) { var cw2 = x.measureText(codeT).width; x.fillText(codeT, W - pad - cw2, pad + 4); }
      var ay = pad + 54, ax = pad + (aw - a.width) / 2; x.drawImage(a, ax, ay); handRect(x, ax - 6, ay - 6, a.width + 12, a.height + 12, 1.6, 0.85, 7);
      var y = ay + a.height + 40, life = n.cn || (r.sp && r.sp.cn) || P.say || 'Noticed';
      x.font = '44px ' + FONT; wrap(x, life, aw).slice(0, 2).forEach(function (l) { x.fillText(l, pad, y); y += 54; }); y += 4;
      var sci = n.sci || (r.sp && r.sp.n); if (sci) { x.globalAlpha = 0.7; x.font = 'italic 22px Georgia, serif'; x.fillText(sci, pad, y); x.globalAlpha = 1; y += 34; }
      y += 16; x.font = '26px ' + FONT;
      body.forEach(function (b) { if (b[0]) { x.globalAlpha = 0.55; x.fillText(b[0], pad, y); x.globalAlpha = 1; } x.fillText(b[1], pad + 44, y); y += 38; });
      y += 18; var dots = []; for (var i = 0; i <= 40; i++) dots.push([pad + aw * i / 40, y]); x.setLineDash([2, 9]); handLine(x, dots, 2, 0.6, 2); x.setLineDash([]); y += 26;
      x.font = '20px ' + FONT; x.globalAlpha = 0.85; x.fillText([NG.when(P.at || n.at || Date.now()).slice(0, 12)].concat((n.data || P.data || []).slice(0, 3)).join(' · '), pad, y); x.globalAlpha = 1;
      return c;
    });
  }
  function keepCanvas(c, cap, codeT) {
    var src = c.toDataURL('image/jpeg', 0.86), item = { id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), src: src, cap: cap || '', code: codeT || '' };
    folioKeep(item); return item;
  }
  function keepNote(n, art) {
    var P = { note: n, at: n.at, say: n.say, lat: n.lat, lng: n.lng, data: n.data, seen: n.seen, r: NG.read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng, wx: n.wx }) };
    P.lines = NG.wishLines(n, P.r).map(function (l) { return l[1]; });
    var src = NG.PHOTOS[n.id] || n.thumb || ''; var go = function () { return poster(P, art === 'net' || art === 'sign' || art === 'pixel' ? art : (P.img ? 'photo' : 'net')).then(function (c) { return keepCanvas(c, (n.cn || n.say || 'Noticed') + ', ' + NG.when(n.at).slice(0, 6), n.code); }); };
    return (src ? NG.loadImg(src).then(function (im) { P.img = im; }).catch(function () {}) : Promise.resolve()).then(go);
  }
  var api = { keepNote: keepNote, keepCanvas: keepCanvas, folio: function () { return folioLoad(); }, poster: poster, sleep: function () {}, wake: function () {} };
  window.AURA = api;
  folioLoad();
  if (!document.documentElement.classList.contains('aura-on')) return;

  /* ───────── the stage: a canvas for the drawing, a layer of keys over it ───────── */
  var root = document.createElement('div'); root.id = 'aura';
  root.innerHTML = '<canvas id="au-cv" aria-hidden="true"></canvas><div id="au-ui"></div>';
  document.body.appendChild(root);
  var cv = $('#au-cv'), x = cv.getContext('2d'), ui = $('#au-ui');
  var PF = null, N3 = null;
  NG.lib('freehand', function () { return window.PF; }).then(function (ok) { if (ok) PF = window.PF; });
  NG.lib('simplex', function () { return window.SimplexNoise; }).then(function (ok) { if (ok) { var s = 7, rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; N3 = window.SimplexNoise.createNoise3D(rnd); } });
  NG.lib('panzoom', function () { return window.Panzoom; });
  var noise = function (a, b, c) { return N3 ? N3(a, b, c) : Math.sin(a * 1.7 + c * 1.3) * 0.6 + Math.sin(b * 2.3 + c * 0.7) * 0.4; };

  var orbs = [], tabs = [], grabs = [];
  var S = { mode: 'seed', t0: 0, stage: 0, deep: null, spin: 0.6, k: 0, fade: 1, seen: false };
  var L = {}, dpr = 1;
  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1); var W = innerWidth, H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var mob = W < 760, R = Math.min(W * 0.86, H * 0.74, 560) * 150 / 400;
    var big = !mob && H > 760 && W > 1200, bw = mob ? 116 : big ? 196 : 160, bh = bw * 0.58, by = mob ? 16 : 22, gy = by + bh + (mob ? 62 : 74), sp = mob ? Math.min(80, (W - 50) / 4) : big ? 190 : 150;
    var tipY = H - (mob ? 36 : 44), panelTop = gy + (mob ? 40 : 52), panelBot = tipY - (mob ? 50 : 56), pw = mob ? W - 52 : Math.min(big ? 720 : 640, W - 380);
    L = { W: W, H: H, mob: mob, R: R, cx: W / 2, cy: H / 2, bx: W / 2, by: by, bw: bw, bh: bh, gy: gy,
      grab: [0, 1, 2, 3].map(function (i) { return [W / 2 + (i - 1.5) * sp, gy]; }),
      tips: [0, 1, 2, 3].map(function (i) { return [mob ? W * (0.125 + 0.25 * i) : W / 2 + (i - 1.5) * Math.min(W * 0.2, big ? 300 : 240), tipY]; }),
      panel: { l: (W - pw) / 2, t: panelTop, w: pw, h: Math.max(160, panelBot - panelTop) } };
    var p = $('#au-panel'); if (p) { p.style.left = L.panel.l + 'px'; p.style.top = L.panel.t + 'px'; p.style.width = L.panel.w + 'px'; p.style.height = L.panel.h + 'px'; }
    var d = $('#au-deep'); if (d) { d.style.left = L.panel.l + 'px'; d.style.top = L.panel.t + 'px'; d.style.width = L.panel.w + 'px'; d.style.height = L.panel.h + 'px'; }
    /* the keys stay where they are: the tentacles move between them, never the things one reaches for */
    tabs.forEach(function (b, i) { b.style.transform = 'translate(' + L.tips[i][0].toFixed(1) + 'px,' + L.tips[i][1].toFixed(1) + 'px)'; });
    grabs.forEach(function (b, i) { b.style.transform = 'translate(' + L.grab[i][0].toFixed(1) + 'px,' + L.grab[i][1].toFixed(1) + 'px)'; });
    var bl = $('#au-bell'); bl.style.transform = 'translate(' + (L.bx - L.bw * 0.55) + 'px,' + (L.by - 4) + 'px)'; bl.style.width = L.bw * 1.1 + 'px'; bl.style.height = L.bh * 1.15 + 'px';
    x.setTransform(dpr, 0, 0, dpr, 0, 0); root.classList.toggle('big', big);
    [].forEach.call(panel.querySelectorAll('textarea'), grow);
  }

  /* ───────── the globe: three rings drawn by hand, as the base's start draws them, turning as one planet ───────── */
  var RINGS = [{ ax: 0.0, inc: 1.2, r: 1.0, w: [0.010, 0.006, 0.004], ph: [0.3, 2.1, 4.0], sp: 0.21, a0: 0.4 },
    { ax: 2.1, inc: 1.05, r: 0.965, w: [0.008, 0.009, 0.003], ph: [1.7, 0.4, 2.9], sp: -0.16, a0: 2.6 },
    { ax: 4.2, inc: 0.5, r: 0.93, w: [0.012, 0.005, 0.005], ph: [5.1, 3.3, 0.9], sp: 0.13, a0: 4.4 }];
  RINGS.forEach(function (k) { var c = Math.cos(k.ax), s = Math.sin(k.ax); k.u = [c, 0, s]; k.v = [-s * Math.cos(k.inc), Math.sin(k.inc), c * Math.cos(k.inc)]; });
  var TILT = -0.38;
  function ringPt(k, th, spin, R, cx, cy) {
    var rr = R * k.r * (1 + k.w[0] * Math.sin(2 * th + k.ph[0]) + k.w[1] * Math.sin(5 * th + k.ph[1]) + k.w[2] * Math.sin(11 * th + k.ph[2]));
    var X = rr * (Math.cos(th) * k.u[0] + Math.sin(th) * k.v[0]), Y = rr * (Math.cos(th) * k.u[1] + Math.sin(th) * k.v[1]), Z = rr * (Math.cos(th) * k.u[2] + Math.sin(th) * k.v[2]);
    var cs = Math.cos(spin), sn = Math.sin(spin), x1 = X * cs + Z * sn, z1 = -X * sn + Z * cs, ct = Math.cos(TILT), st = Math.sin(TILT);
    return [cx + x1, cy - (Y * ct - z1 * st), (Y * st + z1 * ct) / (R * k.r)];
  }
  var NR = 96;
  function globePts(spin, scale) { return RINGS.map(function (k) { var out = []; for (var i = 0; i < NR; i++) out.push(ringPt(k, k.ph[0] + 2 * Math.PI * i / NR, spin, L.R * scale, L.cx, L.cy)); return out; }); }

  /* ───────── the irukandji: a box bell, a tentacle from each corner, each through what it holds to its step at the foot ───────── */
  var NT = 48;
  function catmull(P, n) {
    var out = [], seg = P.length - 1;
    for (var i = 0; i < n; i++) { var u = i / (n - 1) * seg, s = Math.min(seg - 1, Math.floor(u)), t = u - s, p0 = P[Math.max(0, s - 1)], p1 = P[s], p2 = P[s + 1], p3 = P[Math.min(seg, s + 2)];
      var t2 = t * t, t3 = t2 * t; out.push([0, 1].map(function (j) { return 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3); })); }
    return out;
  }
  var pulse = function (t) { var p = (t % 3.6) / 3.6; return p < 0.28 ? Math.sin(p / 0.28 * Math.PI / 2) : Math.cos((p - 0.28) / 0.72 * Math.PI / 2); };
  function bellPts(t) {
    var p = still ? 0 : pulse(t), w = L.bw * (1 - 0.07 * p) / 2, h = L.bh * (1 + 0.045 * p), cx = L.bx, top = L.by + (L.bh - h) * 0.3, bot = top + h, out = [];
    for (var i = 0; i < NR; i++) {
      var u = i / NR, X, Y;
      if (u < 0.8) { var a = Math.PI * (1 - u / 0.8), ca = Math.cos(a), sa = Math.sin(a); X = cx + Math.pow(Math.abs(ca), 0.55) * (ca < 0 ? -1 : 1) * w; Y = bot - Math.pow(sa, 0.42) * h * (0.94 + 0.06 * sa); }
      else { var s = (u - 0.8) / 0.2; X = cx + w - 2 * w * s; Y = bot - Math.sin(s * Math.PI) * h * 0.09; }
      out.push([X, Y]);
    }
    return { pts: out, p: p, bot: bot, w: w, top: top };
  }
  function tentPts(i, t, bell) {
    var root = [L.bx + (i - 1.5) / 1.5 * bell.w * 0.82, bell.bot - 1], g = L.grab[i], tip = L.tips[i], P = L.panel, mob = L.mob, left = i < 2;
    /* they hang: from the bell through what they hold, drifting down to their steps; over the step's page they go faint */
    var lx = function (f) { return g[0] + (tip[0] - g[0]) * f + (left ? -1 : 1) * Math.sin(f * Math.PI) * (mob ? 10 : 40); };
    var pts = catmull([root, [(root[0] + g[0]) / 2, root[1] + (g[1] - root[1]) * 0.35], g, [lx(0.2), P.t + P.h * 0.15], [lx(0.5), P.t + P.h * 0.5], [lx(0.8), P.t + P.h * 0.85], tip], NT);
    if (still) return pts; var amp = mob ? 9 : 16, lean = left ? -1 : 1, gj = NT * 0.11;
    return pts.map(function (q, j) { var s = j / (NT - 1), env = Math.sin(Math.PI * s) * Math.min(1, Math.abs(j - gj) / 5) * Math.min(1, (NT - 1 - j) / 6);
      var wave = Math.sin(s * (22 + i * 3) - t * 1.3 + i * 1.7) * (mob ? 2.4 : 3.2) * env;
      return [q[0] + (noise(i * 3.3, s * 2.2, t * 0.22) * amp + lean * bell.p * 2.5) * env + wave, q[1] + noise(i * 7.1, s * 3, t * 0.18) * amp * 0.4 * env]; });
  }
  function irukTargets(t) { var b = bellPts(t), T = [0, 1, 2, 3].map(function (i) { return tentPts(i, t, b); }); return { bell: b, tents: T, rings: [b.pts, T[0].concat(T[1].slice().reverse()), T[2].concat(T[3].slice().reverse())] }; }

  /* ───────── drawing ───────── */
  function stroke(pts, w, a, taper, closed) {
    if (PF && pts.length > 2) {
      var P = closed ? pts.concat([pts[0], pts[1]]) : pts, o = PF.getStroke(P, { size: w * 2, thinning: taper ? 0.55 : 0.2, smoothing: 0.55, streamline: 0.25, simulatePressure: false, start: { taper: 0, cap: true }, end: { taper: taper ? 60 : 0, cap: true }, last: true });
      if (o.length) { x.beginPath(); x.moveTo(o[0][0], o[0][1]); for (var i = 1; i < o.length; i++) x.lineTo(o[i][0], o[i][1]); x.closePath(); x.fillStyle = 'rgba(244,241,232,' + a + ')'; x.fill(); return; }
    }
    x.beginPath(); pts.forEach(function (p, i) { if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); if (closed) x.closePath(); x.lineWidth = w; x.lineCap = x.lineJoin = 'round'; x.strokeStyle = 'rgba(244,241,232,' + a + ')'; x.stroke();
  }
  function dot(px, py, r, a) { x.beginPath(); x.arc(px, py, r, 0, 7); x.fillStyle = 'rgba(244,241,232,' + a + ')'; x.fill(); }
  /* the deep: marine snow, drifting; after the bang the light that burst out settles into it */
  var SNOW = []; for (var si = 0; si < 70; si++) SNOW.push({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.4, a: 0.08 + Math.random() * 0.32, ph: Math.random() * 7, vx: 0, vy: 0, burst: 0 });
  function snow(t, dt, n) {
    SNOW.forEach(function (s, i) {
      if (i >= n) return;
      if (s.burst > 0) { s.x += s.vx * dt / L.W; s.y += s.vy * dt / L.H; s.vx *= Math.pow(0.12, dt); s.vy *= Math.pow(0.12, dt); s.burst -= dt; }
      else if (!still) { s.y -= dt * (0.004 + s.r * 0.003); s.x += Math.sin(t * 0.2 + s.ph) * dt * 0.002; }
      if (s.y < -0.02) s.y = 1.02; if (s.x < -0.02) s.x = 1.02; if (s.x > 1.02) s.x = -0.02; if (s.y > 1.04) s.y = -0.02;
      dot(s.x * L.W, s.y * L.H, s.r, s.a * (0.6 + 0.4 * Math.sin(t * 0.9 + s.ph)));
    });
  }
  function drawGlobe(t, scale, alpha) {
    var rs = globePts(S.spin, scale);
    rs.forEach(function (ring) {
      var front = [], back = [], flush = function (arr, a, w) { if (arr.length > 1) stroke(arr, w, a * alpha, false); };
      ring.concat([ring[0], ring[1]]).forEach(function (p) { if (p[2] >= 0) { if (back.length) { back.push(p); flush(back, 0.32, 0.6); back = []; } front.push(p); } else { if (front.length) { front.push(p); flush(front, 0.92, 0.85); front = []; } back.push(p); } });
      flush(front, 0.92, 0.85); flush(back, 0.32, 0.6);
    });
    return rs;
  }
  function drawIruk(t, a) {
    var T = irukTargets(t), b = T.bell, k0 = a;
    /* the aura: a slow light round the bell, breathing with it */
    var g = x.createRadialGradient(L.bx, b.top + L.bh * 0.5, 4, L.bx, b.top + L.bh * 0.5, L.bw * 1.7); g.addColorStop(0, 'rgba(244,241,232,' + (0.13 + 0.07 * b.p) * a + ')'); g.addColorStop(1, 'rgba(244,241,232,0)');
    x.fillStyle = g; x.fillRect(L.bx - L.bw * 2, b.top - L.bw, L.bw * 4, L.bw * 3.4);
    var P0 = L.panel, faint = function (inside) { x.save(); x.beginPath(); x.rect(P0.l, P0.t, P0.w, P0.h); if (!inside) { x.rect(L.W, 0, -L.W, L.H); x.clip('evenodd'); } else x.clip(); };
    [false, true].forEach(function (inside) { faint(inside); var A = inside ? (S.deep || P && P.photo ? 0.1 : 0.16) : 1;
    T.tents.forEach(function (pts, i) {
      var on = i === S.stage, w = on ? 1.15 : 0.8, a = A * k0;
      stroke(pts, w, (on ? 0.9 : 0.5) * a, true);
      stroke(pts.map(function (p) { return [p[0] + 1.6, p[1] - 1]; }).slice(0, NT - 6), 0.3, 0.18 * a, true);
      /* the beads of stinging cells along it, the irukandji's own dots: a light runs down the one whose step is open */
      for (var j = 4; j < NT - 1; j += 2) { var tw = 0.5 + 0.5 * Math.sin(t * 2.6 - j * 0.5 + i), big = j % 6 === 0;
        dot(pts[j][0], pts[j][1], (big ? 2.1 : 1.2) * (on ? 1.15 : 1), (on ? 0.4 + 0.55 * tw : 0.22 + 0.25 * tw) * a); }
    }); x.restore(); });
    stroke(b.pts, 1.4, 0.95 * a, false, true);
    stroke(b.pts.map(function (p) { return [p[0] + 1.2, p[1] + 0.8]; }), 0.4, 0.25 * a, false, true);
    /* inside the bell, as the bark painting draws it: a dotted inner line, four eyes at the corners */
    for (var j2 = 4; j2 < NR * 0.8; j2 += 4) { var q = b.pts[j2]; dot(L.bx + (q[0] - L.bx) * 0.7, b.bot - (b.bot - q[1]) * 0.7, 1.15, 0.7 * a); }
    [-0.62, -0.22, 0.22, 0.62].forEach(function (f) { dot(L.bx + f * b.w, b.bot - L.bh * 0.12, 1.7, 0.85 * a); });
    return T;
  }
  function drawMorph(t, k) {
    var from = globePts(S.spin, 1), to = irukTargets(t).rings;
    from.forEach(function (ring, ri) {
      var tr = to[ri], m = tr.length, out = [];
      for (var i = 0; i < m; i++) { var src = ring[Math.floor(i / m * NR)], d = 0.32 * (i / m), e = Math.max(0, Math.min(1, (k - d) / 0.68)); e = e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2; out.push([src[0] + (tr[i][0] - src[0]) * e, src[1] + (tr[i][1] - src[1]) * e]); }
      if (ri === 0) stroke(out, 1.1 + 0.3 * k, 0.9, false, k > 0.9); else { stroke(out.slice(0, NT), 1.1, 0.85, k > 0.6); stroke(out.slice(NT), 1.1, 0.85, k > 0.6); }
    });
  }
  function drawSeed(t) {
    var p = still ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.6), g = x.createRadialGradient(L.cx, L.cy, 1, L.cx, L.cy, 46 + 10 * p); g.addColorStop(0, 'rgba(244,241,232,.34)'); g.addColorStop(1, 'rgba(244,241,232,0)');
    x.fillStyle = g; x.fillRect(L.cx - 70, L.cy - 70, 140, 140);
    /* the three rings wound tight round it, a bundle before anything is drawn out */
    RINGS.forEach(function (k, i) { var pts = []; for (var j = 0; j <= 40; j++) { var q = ringPt(k, 2 * Math.PI * j / 40, t * (1.4 + i * 0.3), 13 + i * 2.2 + p * 1.5, L.cx, L.cy); pts.push(q); } stroke(pts, 0.7, 0.75, false); });
    dot(L.cx, L.cy, 4.2 + p * 1.2, 0.98);
  }
  function drawBang(t, k) {
    var e = Math.min(1, k), fl = Math.pow(1 - e, 3), g = x.createRadialGradient(L.cx, L.cy, 1, L.cx, L.cy, L.R * (0.2 + 1.6 * e));
    g.addColorStop(0, 'rgba(244,241,232,' + 0.55 * fl + ')'); g.addColorStop(1, 'rgba(244,241,232,0)'); x.fillStyle = g; x.fillRect(0, 0, L.W, L.H);
    var sh = []; for (var j = 0; j <= 80; j++) { var a = 2 * Math.PI * j / 80, rr = L.R * 1.7 * (1 - Math.pow(1 - e, 3)) * (1 + 0.012 * Math.sin(a * 5 + 1)); sh.push([L.cx + Math.cos(a) * rr, L.cy + Math.sin(a) * rr]); }
    stroke(sh, 0.8, 0.5 * (1 - e), false);
    var s = Math.max(0, Math.min(1, (k - 0.06) / 0.72)), back = s === 0 ? 0 : 1 + 2.4 * Math.pow(s - 1, 3) + 1.4 * Math.pow(s - 1, 2);
    if (back > 0.02) drawGlobe(t, back, Math.min(1, s * 2));
  }

  /* ───────── sound: the drone at 70% of the base's, and a few bells for what is done ───────── */
  var hum = null, mute = store.get('da.aura.mute', false), HZ = [110, 164.81, 220];
  function humStart() {
    if (hum || mute || !(window.AudioContext || window.webkitAudioContext)) return; var c = NG.ac(), out = c.createGain(); out.gain.value = 0; out.connect(NG.bus(c));
    hum = { out: out, v: HZ.map(function (f0) { var o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
      o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f0; o2.frequency.value = f0 * 2.004; f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0.012;
      o.connect(f); o2.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(out); } else g.connect(out); o.start(); o2.start(); return { f: f, g: g, p: p, o: o }; }) };
    out.gain.setTargetAtTime(0.385, c.currentTime, 1.8); window.__auraHum = 0.385;
  }
  function humSet(on) { if (!hum) return; var c = NG.ac(); hum.out.gain.setTargetAtTime(on && !mute ? 0.385 : 0, c.currentTime, on ? 1 : 0.3); window.__auraHum = on && !mute ? 0.385 : 0; }
  function humFrame(rs, b) {
    if (!hum) return; var c = NG.ac(), tt = c.currentTime;
    hum.v.forEach(function (v, i) {
      if (rs) { var q = rs[i]; v.g.gain.setTargetAtTime(0.006 + 0.03 * q[2] * q[2], tt, 0.3); v.f.frequency.setTargetAtTime(260 + 1400 * q[2], tt, 0.3); if (v.p) v.p.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, (q[0] - L.cx) / L.R)), tt, 0.3); }
      else if (b) { v.g.gain.setTargetAtTime(0.014 + 0.012 * b.p, tt, 0.4); v.f.frequency.setTargetAtTime(300 + 500 * b.p + (i === S.stage % 3 ? 300 : 0), tt, 0.5); if (v.p) v.p.pan.setTargetAtTime((i - 1) * 0.5, tt, 0.6); }
    });
  }
  var DEG = [0, 3, 5, 7, 10, 12, 15];
  function bell(i, vol) { if (mute || !AC0()) return; var c = NG.ac(), I = NG.INS.gamelan; I.fn(c, NG.bus(c), c.currentTime + 0.02, 220 * Math.pow(2, DEG[i % DEG.length] / 12), 1.7, vol || 0.28); }
  function harp(seq) { if (mute || !AC0()) return; var c = NG.ac(), I = NG.INS.harp || NG.INS.gamelan; seq.forEach(function (d, i) { I.fn(c, NG.bus(c), c.currentTime + 0.05 + i * 0.16, 220 * Math.pow(2, DEG[d % DEG.length] / 12 + (d >= DEG.length ? 1 : 0)), 1.7, 0.3); }); }
  function boom() {
    if (mute) return; var c = NG.ac(), t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(92, t); o.frequency.exponentialRampToValueAtTime(41, t + 2.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2); o.connect(g); g.connect(NG.bus(c)); o.start(t); o.stop(t + 3.3);
    var len = c.sampleRate * 2, nb = c.createBuffer(1, len, c.sampleRate), d = nb.getChannelData(0); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g2 = c.createGain(); s.buffer = nb; f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(180, t + 1.8); g2.gain.value = 0.05;
    s.connect(f); f.connect(g2); g2.connect(NG.bus(c)); s.start(t);
  }
  var AC0 = function () { return !!hum || !!window.__auraSound; };

  /* ───────── the keys: the three pages on the globe, the bell, four steps at the tentacles' tips, four things held ───────── */
  var STEPS = [['notice', 'radio'], ['W.I.S.H.', 'wish'], ['art', 'art'], ['print', 'print']];
  var GRAB = [['map', 'map'], ['species', 'life'], ['data', 'data'], ['El Niño', 'nino']];
  var NUMS = ['M2.6 4.4c1.4-.6 2.6-1.7 3.4-2.8.3 3.9 0 8.1.4 11.8', 'M1.8 4.6c.8-2.3 5.1-2.7 5.5.2.3 2.3-2.7 4.7-5.3 8.4 1.9-.5 3.9-.3 5.7.1',
    'M2 3.4c1.7-1.7 5.5-1.5 5.3 1.1-.1 1.6-1.9 2.4-3.5 2.6 2.5-.2 4.1.8 3.9 3.1-.3 2.9-4.5 3.3-5.9 1.6', 'M6.4 13.6c-.2-3.8 0-7.6.4-11.6-1.8 2.6-3.6 5.2-5.3 7.6 2.1-.2 4.6-.3 6.9 0'];
  var ICON = {
    radio: '<circle cx="16" cy="19" r="2.2" class="f"/><path d="M16 21.5v8.5M12.4 15.2a5.2 5.2 0 0 1 7.2 0M9.3 12.1a9.6 9.6 0 0 1 13.4 0M6.2 9a14 14 0 0 1 19.6 0" class="d"/>',
    wish: '<path d="M9 13.5C9 8 12 5 16 5s7 3 7 8.5v1.2H9z"/><path d="M10.5 15v13M14 15v14M18 15v14M21.5 15v13" class="t"/>',
    art: '<path d="M5 26c6-3 4-10 11-12s9-8 11-9"/><circle cx="9" cy="9" r="3"/><path d="M20 22l6 4M22 18h6" class="d"/>',
    print: '<path d="M9 3h14v24l-2.3-1.6-2.3 1.6-2.4-1.6-2.4 1.6-2.3-1.6L9 27z"/><path d="M12 9h8M12 13h8M12 17h5"/>',
    map: '<path d="M4 8l7-3 10 3 7-3v19l-7 3-10-3-7 3z"/><path d="M11 5v19M21 8v19" class="d"/><circle cx="16" cy="15" r="1.8" class="f"/>',
    life: '<path d="M6 20c4-9 12-12 20-11-2 8-9 14-20 11z"/><path d="M6 20c6-3 10-6 14-9" class="d"/><circle cx="22" cy="12" r="1.2" class="f"/>',
    data: '<circle cx="7" cy="23" r="1.6" class="f"/><circle cx="13" cy="15" r="1.6" class="f"/><circle cx="19" cy="18" r="1.6" class="f"/><circle cx="25" cy="8" r="1.6" class="f"/><path d="M7 23l6-8 6 3 6-10"/>',
    nino: '<circle cx="16" cy="12" r="5"/><path d="M16 3v2M16 19v2M7 12h2M23 12h2M9.6 5.6l1.4 1.4M21 17l1.4 1.4M9.6 18.4l1.4-1.4M21 7l1.4-1.4" class="d"/><path d="M4 26c3-2 5-2 8 0s5 2 8 0 5-2 8 0"/>'
  };
  var svgI = function (k, cls) { return '<svg class="' + (cls || 'au-i') + '" viewBox="0 0 32 32" aria-hidden="true">' + ICON[k] + '</svg>'; };
  var numI = function (i) { return '<svg class="au-n" viewBox="0 0 10 16" aria-hidden="true"><path d="' + NUMS[i] + '"/></svg>'; };
  ui.innerHTML =
    '<button id="au-seed" aria-label="Begin"></button>' +
    [0, 1, 3].map(function (s, i) { return '<button class="au-orb" data-s="' + s + '" aria-label="' + ['RADIO', 'W.I.S.H.', 'PRINT'][i] + '" title="' + ['RADIO', 'W.I.S.H.', 'PRINT'][i] + '"><i class="pt"></i>' + numI(i) + svgI(['radio', 'wish', 'print'][i]) + '</button>'; }).join('') +
    '<a id="au-base" href="?base" aria-label="The base" title="The base"><i></i>base</a>' +
    '<button id="au-bell" aria-label="Back to the globe" title="Back to the globe"></button>' +
    STEPS.map(function (s, i) { return '<button class="au-tab" data-s="' + i + '" aria-label="' + s[0] + '" title="' + s[0] + '">' + svgI(s[1]) + '<span>' + numI(i) + esc(s[0]) + '</span></button>'; }).join('') +
    GRAB.map(function (g, i) { return '<button class="au-grab" data-g="' + g[1] + '" data-i="' + i + '" aria-label="' + g[0] + '" title="' + g[0] + '">' + svgI(g[1]) + '<span>' + esc(g[0]) + '</span></button>'; }).join('') +
    '<button id="au-snd" aria-label="Sound" title="Sound"><i></i><svg viewBox="0 0 24 12" aria-hidden="true"><path d="M1 6c2.5-5 5-5 7.5 0s5 5 7.5 0 5-5 7 0"/></svg></button>' +
    '<section id="au-panel" aria-live="polite"></section><section id="au-deep" hidden></section>' +
    '<div id="au-show" hidden><div class="au-sl"><div class="au-pz"><img alt=""></div></div><p class="au-cap"></p><nav class="au-dots"></nav>' +
    '<button class="au-prev" aria-label="Before" title="Before">‹</button><button class="au-next2" aria-label="After" title="After">›</button><button class="au-up" aria-label="Close" title="Close"><i></i></button></div>';
  orbs = [].slice.call(ui.querySelectorAll('.au-orb')); tabs = [].slice.call(ui.querySelectorAll('.au-tab')), grabs = [].slice.call(ui.querySelectorAll('.au-grab'));
  var panel = $('#au-panel'), deep = $('#au-deep');
  function setMode(m) { S.mode = m; S.t0 = performance.now(); root.className = 'm-' + m + (S.deep ? ' deep' : '') + (showEl && !showEl.hidden ? ' showing' : ''); }
  $('#au-snd').classList.toggle('off', mute);

  /* ───────── the frame ───────── */
  var raf = 0, last = 0, asleep = false;
  function frame(now) {
    raf = 0; if (asleep || document.hidden) return;
    var t = now / 1000, dt = Math.max(0, Math.min(0.05, last ? (now - last) / 1000 : 0.016)), k = Math.max(0, (now - S.t0) / 1000); last = now;
    x.clearRect(0, 0, L.W, L.H);
    if (!still && (S.mode === 'globe' || S.mode === 'bang')) S.spin += dt * 2 * Math.PI / 110;
    snow(t, dt, S.mode === 'seed' ? 14 : 70);
    var rs = null, T = null;
    if (S.mode === 'seed') drawSeed(t);
    else if (S.mode === 'bang') { drawBang(t, k / 2.6); if (k > 2.6) setMode('globe'); }
    else if (S.mode === 'globe') { drawGlobe(t, 1, 1); rs = place3(t, 1); }
    else if (S.mode === 'morph') { var km = still ? 1 : k / 1.5; drawMorph(t, Math.min(1, km)); if (km >= 1) { setMode('iruk'); S.fade = 0; setTimeout(regrow, 30); } }
    else if (S.mode === 'unmorph') { var ku = still ? 1 : k / 1.3; drawMorph(t, Math.max(0, 1 - ku)); if (ku >= 1) setMode('globe'); }
    else if (S.mode === 'iruk') { S.fade = Math.min(1, S.fade + dt * 2); T = drawIruk(t, 1); keys(T); }
    if (S.mode === 'bang' && k > 1.4) rs = place3(t, Math.min(1, (k - 1.4) / 1.0));
    humFrame(rs, T && T.bell);
    raf = requestAnimationFrame(frame);
  }
  /* the pages ride their rings: larger and brighter at the front */
  function place3(t, a) {
    return RINGS.map(function (k, i) {
      var q = ringPt(k, k.a0 + (still ? 0 : t * k.sp), S.spin, L.R, L.cx, L.cy), depth = (q[2] + 1) / 2, o = orbs[i];
      o.style.transform = 'translate(' + q[0].toFixed(1) + 'px,' + q[1].toFixed(1) + 'px) scale(' + (0.72 + 0.4 * depth).toFixed(3) + ')';
      o.style.opacity = ((0.5 + 0.5 * depth) * a).toFixed(2); o.style.zIndex = q[2] >= 0 ? 3 : 1; return [q[0], q[1], depth];
    });
  }
  function keys(T) {
    var a = S.fade;
    tabs.forEach(function (b, i) { b.style.opacity = a; b.classList.toggle('on', i === S.stage); });
    grabs.forEach(function (b) { b.style.opacity = a; b.classList.toggle('on', S.deep === b.dataset.g); });
    panel.style.opacity = deep.style.opacity = a;
  }
  function go() { if (!raf && !asleep) raf = requestAnimationFrame(frame); }

  /* ───────── moving between them ───────── */
  function bang() {
    if (S.mode !== 'seed') return; window.__auraSound = 1; humStart(); try { boom(); } catch (e) { /* no sound */ }
    SNOW.forEach(function (s, i) { if (i % 2) return; var a = Math.random() * 7, v = 0.25 + Math.random() * 0.6; s.x = 0.5; s.y = 0.5; s.vx = Math.cos(a) * v * L.W; s.vy = Math.sin(a) * v * L.H; s.burst = 1.6; });
    setMode('bang'); store.set('da.aura.seen', 1);
  }
  function toIruk(stage) { if (S.mode !== 'globe' && S.mode !== 'bang') return; S.stage = stage; S.deep = null; deep.hidden = true; paint(); setMode('morph'); bell(stage, 0.22); }
  function toGlobe() { if (S.mode !== 'iruk') return; S.deep = null; deep.hidden = true; setMode('unmorph'); bell(0, 0.18); }
  function step(i) { if (i === S.stage && !S.deep) return; S.stage = i; S.deep = null; deep.hidden = true; root.classList.remove('deep'); paint(); bell(i); panel.scrollTop = 0; }
  var regrow = function () { [].forEach.call(panel.querySelectorAll('textarea'), grow); };
  $('#au-seed').addEventListener('click', bang);
  root.addEventListener('pointerdown', function (e) { if (S.mode === 'seed' && e.target === cv) bang(); });
  orbs.forEach(function (o) { o.addEventListener('click', function () { if (S.mode === 'bang') setMode('globe'); toIruk(+o.dataset.s); }); });
  $('#au-bell').addEventListener('click', toGlobe);
  tabs.forEach(function (b) { b.addEventListener('click', function () { step(+b.dataset.s); }); });
  grabs.forEach(function (b) { b.addEventListener('click', function () { openDeep(b.dataset.g); bell(4 + (+b.dataset.i), 0.2); }); });
  $('#au-snd').addEventListener('click', function () { mute = !mute; store.set('da.aura.mute', mute); this.classList.toggle('off', mute); if (!mute) { window.__auraSound = 1; humStart(); } humSet(true); });

  /* ───────── the piece being made: one at a time, from a photograph or a line, or a life alone ───────── */
  var P = null;
  var ready = function () { return P && (P.photo || P.say || P.spId); };
  function newPiece() { return { id: 'n' + Date.now().toString(36), at: Date.now(), photo: '', thumb: '', say: '', tags: [], mine: true, lat: NG.map.lat, lng: NG.map.lng, src: 'MAP', art: 'photo', lines: null }; }
  function where(p) {
    if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(function (g) { if (!p || (p.src === 'PHOTO' || p.src === 'TAP')) return; p.lat = g.coords.latitude; p.lng = g.coords.longitude; p.src = 'HERE'; think(); if (S.stage === 0) paintWhere(); },
      function () { /* the map's centre stands */ }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  function think() {
    if (!P) return; P.r = NG.read(P); P.data = NG.context(P); P.dirty = true;
    if (!P.wx && !P.wxAsked) { P.wxAsked = 1; NG.weather(P.lat, P.lng).then(function (w) { if (P && w) { P.wx = w; P.data = NG.context(P); } }); }
  }
  function intake(file) {
    if (!file) return; var p = P = P && !P.note ? P : newPiece(), url = URL.createObjectURL(file);
    panel.classList.add('busy');
    var exP = new Promise(function (res) { try { var fr = new FileReader(); fr.onload = function () { res(NG.exif(fr.result)); }; fr.onerror = function () { res({}); }; fr.readAsArrayBuffer(file.slice(0, 256 * 1024)); } catch (e) { res({}); } });
    var imP = NG.loadImg(url).catch(function () { return window.createImageBitmap ? createImageBitmap(file).then(function (bm) { var c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0); return c; }) : null; }).catch(function () { return null; });
    Promise.all([exP, imP]).then(function (got) {
      var ex = got[0] || {}, im = got[1]; panel.classList.remove('busy');
      if (im) { try { p.photo = NG.shrink(im, 1400, 0.86); if (p.photo.length > 900e3) p.photo = NG.shrink(im, 1000, 0.8); p.thumb = NG.shrink(im, 220, 0.7); } catch (e) { p.photo = ''; } }
      if (ex.t) p.at = ex.t; if (ex.lat != null) { p.lat = ex.lat; p.lng = ex.lng; p.src = 'PHOTO'; } else where(p);
      p.img = null; if (p.photo) NG.loadImg(p.photo).then(function (i2) { p.img = i2; });
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000); NG.db().then(think); think(); paint(); bell(2, 0.25);
    });
  }
  /* placed: kept with the base's noticings, its few sightings revealed near it, its four lines drafted */
  function settle() {
    if (!ready()) return null; if (P.note && !P.dirty) return P.note; think(); var n = NG.place(P); P.note = n; P.dirty = false; if (P.photo) NG.PHOTOS[n.id] = P.photo.length < 400e3 ? P.photo : NG.PHOTOS[n.id] || P.photo;
    if (!P.lines) { var o = NG.wishOptions(n, P.r); P.lines = o.map(function (a) { return a[0] || ''; }); }
    n.wish = true; n.wishText = P.lines.slice(); NG.saveNotes();
    if (!P.revealed) { P.revealed = 1; NG.reveal(n, P.r).then(function (seen) { n.seen = seen; NG.saveNotes(); if (S.stage === 2) paint(); }); }
    return n;
  }

  /* ───────── the panel: one step at a time ───────── */
  var hand = function (cls, inner, attrs) { return '<button class="au-k ' + (cls || '') + '" ' + (attrs || '') + '>' + inner + '</button>'; };
  var nextK = function (i) { return hand('au-go', '<svg viewBox="0 0 40 16" aria-hidden="true"><path d="M2 8.5c10-1 22 .6 34-.4M29 2.5c2.6 2 4.6 3.6 7 5.6-2.4 2-4.6 3.8-7 5.8"/></svg>', 'data-to="' + i + '" aria-label="Next" title="Next"'); };
  function paint() {
    var s = S.stage, h = '';
    if (s === 0) {
      h = '<div class="au-notice">' + (P && P.photo ? '<figure class="au-ph" data-zoom="photo"><img alt="" src="' + P.photo + '"></figure>' :
        '<label class="au-eye" aria-label="Photograph" title="Photograph"><svg viewBox="0 0 64 40" aria-hidden="true"><path d="M3 20C12 7 22 3 32 3s20 4 29 17C52 33 42 37 32 37S12 33 3 20z"/><circle cx="32" cy="20" r="8"/><circle cx="32" cy="20" r="2.6" class="f"/>' +
        '<path d="M24 38v5M29 39v6M35 39v6M40 38v5" class="t"/></svg><input type="file" accept="image/*" id="au-file" hidden></label>') +
        '<label class="au-line"><textarea id="au-say" rows="2" maxlength="200" placeholder="what have you noticed?"></textarea></label>' +
        '<p class="au-where" id="au-where"></p><p class="au-who" id="au-who"></p>' +
        (P && P.photo ? '<label class="au-k au-re" aria-label="Another photograph" title="Another photograph"><svg class="au-i" viewBox="0 0 32 20" aria-hidden="true"><path d="M2 10C7 4 11 2 16 2s9 2 14 8c-5 6-9 8-14 8S7 16 2 10z"/><circle cx="16" cy="10" r="3.4"/></svg><span>another</span>' + '<input type="file" accept="image/*" id="au-file2" hidden></label>' : '') +
        (ready() ? nextK(1) : '') + '</div>';
    } else if (s === 1) {
      if (!ready()) h = template();
      else { var n = settle(), o = NG.wishOptions(n, P.r);
        h = '<ol class="au-wish">' + [0, 1, 2, 3].map(function (i) { return '<li><b>' + 'WISH'[i] + '</b><textarea data-i="' + i + '" rows="2">' + esc(P.lines[i] || '') + '</textarea>' +
          (o[i].length > 1 ? hand('au-alt', '↻', 'data-i="' + i + '" aria-label="Another line" title="Another line"') : '') + '</li>'; }).join('') + '</ol>' + nextK(2); }
    } else if (s === 2) {
      if (!ready()) h = template(); else { settle();
        var arts = (P.photo ? ['photo', 'pixel'] : []).concat(['net', 'sign']); if (arts.indexOf(P.art) < 0) P.art = arts[0];
        h = '<div class="au-arts">' + arts.map(function (a) { return hand(a === P.art ? 'on' : '', '<i class="au-a ' + a + '"></i><span>' + a + '</span>', 'data-art="' + a + '" aria-pressed="' + (a === P.art) + '"'); }).join('') + '</div>' +
          '<figure class="au-poster" data-zoom="poster"><canvas></canvas></figure>' + nextK(3); }
    } else {
      h = (ready() ? '<div class="au-acts">' + hand('au-pr', svgI('print') + '<span>print</span>', 'id="au-print" aria-label="Print" title="Print"') + hand('', '<span>save</span>', 'id="au-save" aria-label="Save" title="Save"') +
        hand('', '<span>new</span>', 'id="au-new" aria-label="Start another" title="Start another"') + '</div><p class="au-pips" id="au-pips"></p><figure class="au-poster" data-zoom="poster"><canvas></canvas></figure>' : '') +
        '<div class="au-folio" id="au-folio"></div>';
    }
    panel.innerHTML = h; wire(s);
  }
  /* a wish with no noticing: a life chosen, and its four lines drafted from it */
  function template() {
    var D = NG.DB(), opts = D ? D.field.slice().sort(function (a, b) { return a.cn < b.cn ? -1 : 1; }).map(function (f) { return '<option value="' + esc(f.cn) + '">'; }).join('') : '';
    return '<div class="au-tpl"><p class="au-hint">a wish, with no photograph: which life?</p><label class="au-line"><input id="au-life" list="au-lives" placeholder="a life, or a place"><datalist id="au-lives">' + opts + '</datalist></label>' +
      '<div class="au-chips" id="au-chips"></div>' + hand('', '<span>or notice something</span>', 'data-to="0"') + '</div>';
  }
  function chips() {
    var el = $('#au-chips'); if (!el) return; var list = NG.seasonNow().slice(0, 6);
    el.innerHTML = list.map(function (f) { return hand('au-chip', esc(f.cn), 'data-sp="' + esc(f.id) + '"'); }).join('');
    [].forEach.call(el.querySelectorAll('[data-sp]'), function (b) { b.addEventListener('click', function () { pickLife(b.dataset.sp); }); });
  }
  function pickLife(id) {
    var D = NG.DB(), f = D && D.field.filter(function (q) { return q.id === id; })[0]; if (!f) return;
    if (!P || P.note && P.sent) P = newPiece(); P.spId = f.id; P.spNone = false; if (!P.say) P.say = f.cn; P.lines = null; P.revealed = 0; think(); if (!P.photo) P.art = 'net';
    if (P.note) { P.note.wishText = null; } where(P); paint(); bell(3, 0.24);
  }
  function paintWhere() {
    var w = $('#au-where'), who = $('#au-who'); if (!P) { if (w) w.innerHTML = ''; if (who) who.innerHTML = ''; return; }
    if (w) w.innerHTML = esc(NG.when(P.at)) + ' · ' + esc((P.data && P.data[0]) || NG.ll(P.lat, P.lng)) + ' ' + hand('au-mini', '◎', 'id="au-here" aria-label="Where I am" title="Where I am"');
    var r = P.r || {}, opts = (r.sp ? [r.sp] : []).concat(r.alts || []);
    if (who) who.innerHTML = opts.length ? hand('au-mini', esc(opts[0].cn) + '?', 'id="au-sp" aria-label="Another life" title="Another life"') : '';
    var hb = $('#au-here'); if (hb) hb.addEventListener('click', function () { P.src = 'MAP'; where(P); });
    var sb = $('#au-sp'); if (sb) sb.addEventListener('click', function () { openDeep('life'); });
  }
  var grow = function (ta) { if (!ta.offsetParent) return; ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight + 2, 40) + 'px'; };
  function wire(s) {
    [].forEach.call(panel.querySelectorAll('textarea'), function (ta) { grow(ta); ta.addEventListener('input', function () { grow(ta); }); });
    [].forEach.call(panel.querySelectorAll('[data-to]'), function (b) { b.addEventListener('click', function () { step(+b.dataset.to); }); });
    [].forEach.call(panel.querySelectorAll('[data-zoom]'), function (f) { f.addEventListener('click', function () { var im = f.querySelector('img'), c = f.querySelector('canvas'); show([{ src: im ? im.src : c.toDataURL('image/jpeg', 0.9), cap: '' }], 0, true); }); });
    if (s === 0) {
      ['#au-file', '#au-file2'].forEach(function (q) { var i = $(q); if (i) i.addEventListener('change', function () { intake(i.files && i.files[0]); }); });
      var say = $('#au-say'), tm = 0; if (P) say.value = P.say || '';
      say.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { var had = ready(); if (!P) { P = newPiece(); where(P); } P.say = say.value.trim(); P.spId = null; P.lines = null; think(); paintWhere(); if (!had && ready() && !$('.au-go', panel)) panel.querySelector('.au-notice').insertAdjacentHTML('beforeend', nextK(1)), wire2(); }, 260); });
      paintWhere();
    }
    if (s === 1) {
      if (!ready()) { chips(); var life = $('#au-life'); life.addEventListener('change', function () { var D = NG.DB(), v = life.value.trim().toLowerCase(), f = D && D.field.filter(function (q) { return q.cn.toLowerCase() === v; })[0];
        if (f) pickLife(f.id); else if (v) { P = newPiece(); P.say = life.value.trim(); P.art = 'net'; where(P); think(); paint(); } }); NG.db().then(chips); return; }
      var n = P.note, o = NG.wishOptions(n, P.r);
      [].forEach.call(panel.querySelectorAll('textarea[data-i]'), function (ta) { var tm2 = 0; ta.addEventListener('input', function () { clearTimeout(tm2); tm2 = setTimeout(function () { P.lines[+ta.dataset.i] = ta.value.trim(); n.wishText = P.lines.slice(); NG.saveNotes(); }, 250); }); });
      [].forEach.call(panel.querySelectorAll('.au-alt'), function (b) { b.addEventListener('click', function () { var i = +b.dataset.i, list = o[i], k2 = (list.indexOf(P.lines[i]) + 1) % list.length; P.lines[i] = list[k2]; n.wishText = P.lines.slice(); NG.saveNotes(); var ta = panel.querySelector('textarea[data-i="' + i + '"]'); if (ta) { ta.value = P.lines[i]; grow(ta); } bell(i + 1, 0.16); }); });
    }
    if (s === 1 && !ready()) return;
    if (s === 2) [].forEach.call(panel.querySelectorAll('[data-art]'), function (b) { b.addEventListener('click', function () { P.art = b.dataset.art; paint(); bell(5, 0.18); }); });
    if (s >= 2 && ready()) drawPoster();
    if (s === 3) {
      folioRow();
      if (!ready()) return;
      $('#au-print').addEventListener('click', printNow);
      $('#au-save').addEventListener('click', function () { poster(P, P.art).then(function (c) { NG.download(c, 'novel-global-' + ((P.note && P.note.code) || 'piece') + '.png'); }); });
      NG.sureTap($('#au-new'), function () { P = null; step(0); });
    }
  }
  function wire2() { [].forEach.call(panel.querySelectorAll('.au-go'), function (b) { if (b.__w) return; b.__w = 1; b.addEventListener('click', function () { step(+b.dataset.to); }); }); }
  function drawPoster() {
    var f = panel.querySelector('.au-poster canvas'); if (!f) return; var go2 = function () { poster(P, P.art).then(function (c) { var g = panel.querySelector('.au-poster canvas'); if (!g) return; g.width = c.width; g.height = c.height; g.getContext('2d').drawImage(c, 0, 0); }); };
    if (P.photo && !P.img) NG.loadImg(P.photo).then(function (im) { P.img = im; go2(); }).catch(go2); else go2();
  }
  /* print: the receipt for the thermal head (the base's own, its photograph through the print pipeline), the poster kept in colour */
  function printNow() {
    var n = settle(); if (!n) return; var btn = $('#au-print'), st = $('#au-pips'); btn.disabled = true; st.innerHTML = NG.pips('sending');
    var art = P.art === 'pixel' && !P.photo ? 'net' : P.art, photo = NG.PHOTOS[n.id] || P.photo || '';
    NG.printers().then(function (list) {
      var ps = list.filter(function (p) { return p.paired || p.id === (B.master && B.master.id); }), dest = ps.length ? ps[0].id : (B.master ? B.master.id : 'novelglobal'), paper = ps.length ? ps[0].paper : (B.master && B.master.paper) || 80;
      var Pp = (B.printers || {})[String(paper || 80)] || { dots: 512 }, W = Pp.dots - Pp.dots % 8;
      return NG.slip(n, photo, P.r, { art: art, wish: true }, W).then(function (c) { return NG.sendNote(n, c, dest, true); });
    }).then(function (s) {
      st.innerHTML = NG.pips(s); btn.disabled = false; if (n.sent && n.sent.id) NG.follow(n, st); harp([0, 2, 4, 7]);
      return poster(P, P.art).then(function (c) { var it = keepCanvas(c, (n.cn || n.say || 'Noticed') + ', ' + NG.when(n.at).slice(0, 6), n.code); P.sent = 1; folioRow(); setTimeout(function () { if (S.stage === 3) show(slides(), slides().map(function (q) { return q.id; }).indexOf(it.id)); }, 900); });
    }).catch(function () { st.innerHTML = NG.pips('failed'); btn.disabled = false; });
  }
  function folioRow() {
    var el = $('#au-folio'); if (!el) return; var all = slides();
    el.innerHTML = '<p class="au-lbl">portfolio</p>' + (all.length ? '<div class="au-strip">' + all.map(function (f, i) { return '<button data-f="' + i + '" aria-label="' + esc(f.cap || 'piece') + '"><img alt="" src="' + f.src + '"></button>'; }).join('') + '</div>' + hand('', '<span>slideshow</span>', 'id="au-play"') : '<p class="au-hint">what you print is kept here, in colour</p>' + (ready() ? '' : hand('', '<span>notice something</span>', 'data-to="0"')));
    [].forEach.call(el.querySelectorAll('[data-f]'), function (b) { b.addEventListener('click', function () { show(slides(), +b.dataset.f); }); });
    var pl = $('#au-play'); if (pl) pl.addEventListener('click', function () { show(slides(), 0); });
    [].forEach.call(el.querySelectorAll('[data-to]'), function (b) { b.addEventListener('click', function () { step(+b.dataset.to); }); });
  }

  /* ───────── the slideshow: each picture whole, never cropped; pinched, wheeled or double-tapped to look closer ───────── */
  var SH = { list: [], i: 0, pz: null, timer: 0, one: false };
  var showEl = $('#au-show'), img = showEl.querySelector('img'), pzEl = showEl.querySelector('.au-pz');
  function show(list, i, one) {
    if (!list.length) return; SH.list = list; SH.one = !!one; showEl.hidden = false; root.classList.add('showing'); slide(Math.max(0, i || 0));
    if (!SH.pz && window.Panzoom) { SH.pz = window.Panzoom(pzEl, { maxScale: 8, minScale: 1, contain: 'outside', panOnlyWhenZoomed: true, cursor: 'default' }); showEl.addEventListener('wheel', function (e) { SH.pz.zoomWithWheel(e); }, { passive: false }); }
    play();
  }
  function slide(i) {
    var n = SH.list.length; SH.i = (i + n) % n; var f = SH.list[SH.i]; img.src = f.src; showEl.querySelector('.au-cap').textContent = f.cap || '';
    if (SH.pz) SH.pz.reset({ animate: false });
    showEl.querySelector('.au-dots').innerHTML = SH.one ? '' : SH.list.map(function (q, k) { return '<button data-k="' + k + '" class="' + (k === SH.i ? 'on' : '') + '" aria-label="' + (k + 1) + '"></button>'; }).join('');
    [].forEach.call(showEl.querySelectorAll('.au-dots button'), function (b) { b.addEventListener('click', function () { slide(+b.dataset.k); play(); }); });
    showEl.classList.toggle('one', SH.one || n < 2);
  }
  function play() { clearInterval(SH.timer); if (SH.one || SH.list.length < 2 || still) return; SH.timer = setInterval(function () { if (SH.pz && SH.pz.getScale() > 1.01) return; slide(SH.i + 1); }, 6500); }
  function unshow() { clearInterval(SH.timer); showEl.hidden = true; root.classList.remove('showing'); }
  showEl.querySelector('.au-prev').addEventListener('click', function () { slide(SH.i - 1); play(); });
  showEl.querySelector('.au-next2').addEventListener('click', function () { slide(SH.i + 1); play(); });
  showEl.querySelector('.au-up').addEventListener('click', unshow);
  pzEl.addEventListener('dblclick', function (e) { if (!SH.pz) return; if (SH.pz.getScale() > 1.01) SH.pz.reset(); else SH.pz.zoomToPoint(2.6, e); });
  var sx0 = null; pzEl.addEventListener('pointerdown', function (e) { sx0 = (SH.pz && SH.pz.getScale() > 1.01) ? null : [e.clientX, e.clientY]; });
  pzEl.addEventListener('pointerup', function (e) { if (!sx0) return; var dx = e.clientX - sx0[0]; if (Math.abs(dx) > 50 && Math.abs(e.clientY - sx0[1]) < 60) { slide(SH.i + (dx < 0 ? 1 : -1)); play(); } sx0 = null; });
  document.addEventListener('keydown', function (e) { if (showEl.hidden) { if (e.key === 'Escape' && S.deep) closeDeep(); return; } if (e.key === 'ArrowRight') slide(SH.i + 1); else if (e.key === 'ArrowLeft') slide(SH.i - 1); else if (e.key === 'Escape') unshow(); });

  /* ───────── what it holds: the map, the lives, the data, El Niño. Each opens in the panel's place and lets the piece go deeper ───────── */
  function openDeep(k) {
    if (S.deep === k) { closeDeep(); return; } S.deep = k; deep.hidden = false; root.classList.add('deep');
    var head = '<div class="au-dh"><span>' + esc(GRAB.filter(function (g) { return g[1] === k; })[0][0]) + '</span>' + hand('au-back', '<i></i>', 'id="au-dx" aria-label="Back" title="Back"') + '</div>';
    if (k === 'map') { deep.innerHTML = head + '<div class="au-map" id="au-map"><div class="au-tiles"></div><canvas></canvas></div><p class="au-hint" id="au-mh"></p>'; lens(); }
    else if (k === 'life') { deep.innerHTML = head + '<ul class="au-list" id="au-lives2"></ul>'; NG.db().then(lives); lives(); }
    else if (k === 'data') { deep.innerHTML = head + '<ul class="au-list" id="au-data"></ul>'; NG.db().then(data); data(); }
    else { deep.innerHTML = head + '<div id="au-nino"></div>'; NG.db().then(nino); nino(); }
    $('#au-dx').addEventListener('click', closeDeep);
  }
  function closeDeep() { S.deep = null; deep.hidden = true; deep.innerHTML = ''; root.classList.remove('deep'); if (MAPV.raf) cancelAnimationFrame(MAPV.raf); MAPV.raf = 0; paint(); }
  function lives() {
    var el = $('#au-lives2'); if (!el) return; var r = P && P.r, seen = {}, rows = [];
    var add = function (f, why) { if (!f || seen[f.id]) return; seen[f.id] = 1; rows.push([f, why]); };
    if (r) { add(r.sp, 'what it may be'); (r.alts || []).forEach(function (f) { add(f, 'or'); }); (r.rel || []).forEach(function (o) { add(o.f, o.t || 'tied to it'); }); }
    NG.seasonNow().slice(0, 10).forEach(function (f) { add(f, 'about now'); });
    el.innerHTML = rows.map(function (q) { var f = q[0]; return '<li><button data-sp="' + esc(f.id) + '"><i class="au-dot' + (P && P.r && P.r.sp && P.r.sp.id === f.id ? ' on' : '') + '"></i><b>' + esc(f.cn) + '</b><em>' + esc(f.n || '') + '</em><small>' + esc(q[1]) + (f.aware ? ' · ' + esc(String(f.aware).slice(0, 90)) : '') + '</small></button></li>'; }).join('') || '<li class="au-hint">…</li>';
    [].forEach.call(el.querySelectorAll('[data-sp]'), function (b) { b.addEventListener('click', function () { var id = b.dataset.sp; closeDeep(); if (P && ready() && !P.sent) { P.spId = id; P.spNone = false; P.lines = null; P.revealed = 0; think(); if (P.note) { settle(); } paint(); } else { pickLife(id); step(1); } }); });
  }
  function data() {
    var el = $('#au-data'); if (!el) return; var p = P || { lat: NG.map.lat, lng: NG.map.lng, at: Date.now() };
    var rows = [['when', NG.when(p.at || Date.now())], ['where', NG.ll(p.lat, p.lng) + (p.src ? ' · from the ' + ({ PHOTO: 'photograph', HERE: 'phone', MAP: 'map', TAP: 'map, touched' }[p.src] || 'map').toLowerCase() : '')]];
    NG.context(p).forEach(function (d) { rows.push(['', d.toLowerCase()]); });
    if (p.r && p.r.issue) rows.push(['need', p.r.issue.t || p.r.issue.k]); if (p.r && p.r.call) rows.push(['call', p.r.call.label + ' ' + p.r.call.n]);
    el.innerHTML = rows.map(function (q) { return '<li><i class="au-dot"></i><b>' + esc(q[0]) + '</b><span>' + esc(q[1]) + '</span></li>'; }).join('') + '<li>' + hand('', '◎ <span>where I am</span>', 'id="au-here2"') + '</li>';
    $('#au-here2').addEventListener('click', function () { if (!P) { P = newPiece(); } P.src = 'MAP'; where(P); setTimeout(data, 1500); });
  }
  function nino() {
    var el = $('#au-nino'); if (!el) return; var D = NG.DB(), O = D && D.outlook, o = NG.outlookNow(), now = NG.nowItems();
    var spark = '';
    if (O && O.nino && O.nino.length) {
      var vals = O.nino.map(function (v) { var m = String(v).match(/-?\d+(\.\d+)?/); return m ? +m[0] : 0; }), mx = Math.max(1, Math.max.apply(null, vals)), w = 300, h = 90, i0 = (new Date().getFullYear() - O.start[0]) * 12 + new Date().getMonth() - O.start[1];
      var pts = vals.map(function (v, i) { return [10 + i * (w - 20) / Math.max(1, vals.length - 1), h - 14 - (v / mx) * (h - 34)]; });
      spark = '<svg class="au-spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + '"/>' +
        pts.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === i0 ? 4.5 : 2) + '" class="' + (i === i0 ? 'f now' : 'f') + '"/>'; }).join('') + '</svg>';
    }
    el.innerHTML = (o && o.nino ? '<p class="au-big">Niño 3.4 ' + esc(String(o.nino)) + '</p>' : '') + spark + (o && o.say ? '<p>' + esc(o.say) + '</p>' : '') +
      (now.length ? '<ul class="au-list">' + now.slice(0, 5).map(function (it, i) { return '<li><i class="au-dot"></i><span>' + esc(it.t || '') + '</span>' + (P && ready() ? hand('au-mini au-take', '+', 'data-n="' + i + '" aria-label="Into the W.I.S.H." title="Into the W.I.S.H."') : '') + '</li>'; }).join('') + '</ul>' : '');
    [].forEach.call(el.querySelectorAll('.au-take'), function (b) { b.addEventListener('click', function () { var it = now[+b.dataset.n]; settle(); if (!P.lines) return; P.lines[1] = String(it.t || '').split(/[.:]/)[0].trim(); if (P.note) { P.note.wishText = P.lines.slice(); NG.saveNotes(); } closeDeep(); step(1); }); });
  }
  /* the map, as a lens: the ground in blueprint (its own photograph taken down to the paper's blue), what was noticed in white */
  var MAPV = { z: 16, lat: 0, lng: 0, raf: 0 };
  function lens() {
    var el = $('#au-map'), tl = el.querySelector('.au-tiles'), c = el.querySelector('canvas'), g = c.getContext('2d'), p = P || null;
    MAPV.lat = p ? p.lat : NG.map.lat; MAPV.lng = p ? p.lng : NG.map.lng; MAPV.z = 16;
    var TS = 256, wx = function (lng, z) { return (lng + 180) / 360 * TS * Math.pow(2, z); }, wy = function (lat, z) { var s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TS * Math.pow(2, z); };
    var ux = function (X, z) { return X / (TS * Math.pow(2, z)) * 360 - 180; }, uy = function (Y, z) { var n = Math.PI - 2 * Math.PI * Y / (TS * Math.pow(2, z)); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };
    var tiles = {};
    function draw() {
      var W = el.clientWidth, H = el.clientHeight; if (!W) return; if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; }
      var z = MAPV.z, cx = wx(MAPV.lng, z), cy = wy(MAPV.lat, z), n = Math.pow(2, z), keep = {};
      if (B.imagery) for (var X = Math.floor((cx - W / 2) / TS); X <= Math.floor((cx + W / 2) / TS); X++) for (var Y = Math.floor((cy - H / 2) / TS); Y <= Math.floor((cy + H / 2) / TS); Y++) {
        if (Y < 0 || Y >= n) continue; var xx = ((X % n) + n) % n, k = z + '/' + xx + '/' + Y; keep[k] = 1; var im = tiles[k];
        if (!im) { im = new Image(); im.alt = ''; im.src = B.imagery.replace('{z}', z).replace('{x}', xx).replace('{y}', Y); im.onerror = function () { this.style.visibility = 'hidden'; }; tiles[k] = im; tl.appendChild(im); }
        im.style.transform = 'translate(' + Math.round(X * TS - cx + W / 2) + 'px,' + Math.round(Y * TS - cy + H / 2) + 'px)';
      }
      for (var key in tiles) if (!keep[key]) { tiles[key].remove(); delete tiles[key]; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      var at = function (lat, lng) { return [wx(lng, z) - cx + W / 2, wy(lat, z) - cy + H / 2]; };
      g.fillStyle = INK; g.strokeStyle = INK;
      NG.notes().forEach(function (q) { if (!isFinite(q.lat)) return; var s = at(q.lat, q.lng); g.globalAlpha = 0.75; g.beginPath(); g.arc(s[0], s[1], 3.2, 0, 7); g.fill(); });
      if (p) {
        var s0 = at(p.lat, p.lng); ((p.note && p.note.seen) || []).forEach(function (q) { var s = at(q.lat, q.lng); g.globalAlpha = 0.5; g.setLineDash([2, 5]); g.beginPath(); g.moveTo(s0[0], s0[1]); g.lineTo(s[0], s[1]); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(s[0], s[1], 2.6, 0, 7); g.fill(); });
        g.globalAlpha = 1; g.lineWidth = 1.4; g.beginPath(); g.arc(s0[0], s0[1], 9, Math.PI, 0); g.closePath(); g.stroke();
        for (var i = 0; i < 4; i++) for (var j = 1; j < 5; j++) { g.beginPath(); g.arc(s0[0] - 6 + i * 4, s0[1] + j * 4, 1, 0, 7); g.fill(); }
      }
      g.globalAlpha = 1; $('#au-mh').textContent = p ? 'touch where it was' : '';
    }
    MAPV.draw = draw; draw(); setTimeout(draw, 60);
    var drag = null, moved = 0;
    el.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY, wx(MAPV.lng, MAPV.z), wy(MAPV.lat, MAPV.z)]; moved = 0; try { el.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } });
    el.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag[0], dy = e.clientY - drag[1]; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); MAPV.lng = ux(drag[2] - dx, MAPV.z); MAPV.lat = uy(drag[3] - dy, MAPV.z); draw(); });
    el.addEventListener('pointerup', function (e) {
      if (drag && moved < 6 && P) { var r = el.getBoundingClientRect(), X = wx(MAPV.lng, MAPV.z) + (e.clientX - r.left - el.clientWidth / 2), Y = wy(MAPV.lat, MAPV.z) + (e.clientY - r.top - el.clientHeight / 2);
        P.lat = uy(Y, MAPV.z); P.lng = ux(X, MAPV.z); P.src = 'TAP'; think(); if (P.note) { P.note.lat = +P.lat.toFixed(5); P.note.lng = +P.lng.toFixed(5); P.note.data = P.data; NG.saveNotes(); } draw(); bell(2, 0.2); }
      drag = null; });
    el.addEventListener('wheel', function (e) { e.preventDefault(); MAPV.z = Math.max(12, Math.min(B.maxzoom || 19, MAPV.z + (e.deltaY < 0 ? 1 : -1))); draw(); }, { passive: false });
    el.addEventListener('dblclick', function () { MAPV.z = Math.min(B.maxzoom || 19, MAPV.z + 1); draw(); });
  }

  /* ───────── asleep under the base's pages, awake on the paper ───────── */
  api.sleep = function () { asleep = true; root.hidden = true; humSet(false); };
  api.wake = function () { if (location.hash) return; asleep = false; root.hidden = false; humSet(S.mode !== 'seed'); go(); };
  api.state = function () { return { mode: S.mode, stage: S.stage, deep: S.deep, piece: P ? { say: P.say, photo: !!P.photo, art: P.art, lines: P.lines, code: P.note && P.note.code, sent: !!P.sent } : null, folio: slides().length, hum: window.__auraHum || 0, pf: !!PF, noise: !!N3 }; };
  api.go = function (m, s) { if (m === 'globe') { if (S.mode === 'seed') bang(); setMode('globe'); } if (m === 'iruk') { setMode('globe'); toIruk(s || 0); } };
  addEventListener('resize', function () { layout(); if (MAPV.draw && S.deep === 'map') MAPV.draw(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) go(); });
  addEventListener('hashchange', function () { if (location.hash) api.sleep(); });
  layout(); setMode('seed'); paint();
  if (location.hash) api.sleep(); else go();
  fontReady();
})();
