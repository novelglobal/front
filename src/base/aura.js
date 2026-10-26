/* novel.global, the aura: the showcase at /. One sheet of blueprint paper, nothing ever leaves it.
   A seed of light waits at the centre; a touch and it bursts into the three rings of the globe, and the drone begins. A page
   touched and the rings are drawn in again as an irukandji: the bell above, four tentacles below, their tips the four steps of
   one piece (notice, W.I.S.H., art, print), icons alone. Together the tentacles hold one thing, the catch: the map, the life,
   the data and El Niño, none of it shown unless it is caught. All white, by hand, in dots and lines. Every picture is kept in
   colour, in full, in the portfolio; nothing is cropped. The base is underneath (its pages still open by link) and whole at
   /?base. Plain script, as the base: no ?. or ?? */
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
      try { var q = indexedDB.open('novelglobal', 2); q.onupgradeneeded = function () { var d0 = q.result; ['folio', 'piece'].forEach(function (n) { if (!d0.objectStoreNames.contains(n)) d0.createObjectStore(n, { keyPath: 'id' }); }); }; q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; } catch (e) { res(null); }
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
  /* the piece being made, kept as it is made: one at a time, there when one comes back */
  function draftSave(o) { return folioDB().then(function (d) { if (!d) return; try { var s = d.transaction('piece', 'readwrite').objectStore('piece'); if (o) { o.id = 'now'; s.put(o); } else s.delete('now'); } catch (e) { /* this visit only */ } }); }
  function draftLoad() { return folioDB().then(function (d) { if (!d) return null; return new Promise(function (res) { try { var g = d.transaction('piece').objectStore('piece').get('now'); g.onsuccess = function () { res(g.result || null); }; g.onerror = function () { res(null); }; } catch (e) { res(null); } }); }); }
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
  function handCircle(x, cx, cy, r, lw, a, seed) { var pts = []; for (var i = 0; i <= 44; i++) { var t = i / 40 * Math.PI * 2; pts.push([cx + Math.cos(t) * r * (1 + 0.01 * Math.sin(t * 3 + seed)), cy + Math.sin(t) * r * (1 + 0.01 * Math.cos(t * 2 + seed))]); } handLine(x, pts, lw, a, seed); }
  function wrap(x, t, w) { var out = [], line = ''; String(t || '').split(/\s+/).forEach(function (wd) { var tr = line ? line + ' ' + wd : wd; if (x.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; }); if (line) out.push(line); return out; }
  function irukMark(x, cx, cy, s, a) {
    x.save(); x.strokeStyle = 'rgba(244,241,232,' + a + ')'; x.fillStyle = 'rgba(244,241,232,' + a + ')'; x.lineWidth = Math.max(1, s * 0.07); x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx - s * 0.5, cy + s * 0.2); x.bezierCurveTo(cx - s * 0.55, cy - s * 0.75, cx + s * 0.55, cy - s * 0.75, cx + s * 0.5, cy + s * 0.2); x.closePath(); x.stroke();
    for (var i = 0; i < 4; i++) { var tx = cx - s * 0.36 + i * s * 0.24; for (var k = 1; k < 6; k++) { x.beginPath(); x.arc(tx + Math.sin(k + i) * s * 0.04, cy + s * 0.22 + k * s * 0.17, s * 0.035, 0, 7); x.fill(); } }
    x.restore();
  }
  /* what a piece has caught: only what was chosen ever shows. The life, the data, El Niño and the map are each opt-in */
  var lifeOf = function (P) { var D = NG.DB(); return P.catch && P.catch.life && D ? D.field.filter(function (f) { return f.id === P.catch.life; })[0] || null : null; };
  var titleOf = function (P) { return P.say || (P.lines || []).filter(Boolean)[0] || ''; };
  function ninoVals() { var D = NG.DB(), O = D && D.outlook; if (!O || !O.nino) return null; return O.nino.map(function (v) { var m = String(v).match(/-?\d+(\.\d+)?/); return m ? +m[0] : 0; }); }
  var ninoNow = function () { var o = NG.outlookNow(); return o && o.nino ? String(o.nino).replace(/ ?(OBS|PEAK)/, '').replace('≈', '') : ''; };
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
      /* a sign for the place, in one's own words: the line, read from a step away */
      var word = (titleOf(P) || '·').toUpperCase(); c.width = aw; g.font = Math.round(aw * 0.085) + 'px ' + FONT; var lines = wrap(g, word, aw * 0.84).slice(0, 5);
      c.height = Math.round(aw * 0.115 * lines.length + aw * 0.16); g.fillStyle = INK; g.fillRect(0, 0, c.width, c.height); g.fillStyle = BLUE; g.textBaseline = 'top';
      lines.forEach(function (l, i) { g.fillText(l, aw * 0.08, aw * 0.08 + i * aw * 0.115); });
      return c;
    }
    /* the net: this noticing at the heart, the sightings revealed near it where they really are; names only once the life is caught */
    c.width = aw; c.height = Math.round(aw * 0.8); var cx = aw / 2, cy = c.height * 0.46, n2 = P.note || P, seen = (n2.seen || []).slice(0, 6), named = !!lifeOf(P), rel = named ? ((P.r && P.r.rel) || []).slice(0, 4) : [];
    var far = seen.reduce(function (m, s2) { return Math.max(m, s2.d || 0); }, 300), pts = [];
    seen.forEach(function (s2) { var dy = (n2.lat - s2.lat) * 111000, dx = (s2.lng - n2.lng) * 111000 * Math.cos(n2.lat * Math.PI / 180), k2 = aw * 0.36 / far; pts.push([cx + dx * k2, cy + dy * k2, named ? s2.cn : '', 1]); });
    rel.forEach(function (o, i) { var a = Math.PI * (0.15 + 0.7 * (rel.length > 1 ? i / (rel.length - 1) : 0.5)); pts.push([cx - Math.cos(a) * aw * 0.38, cy + Math.sin(a) * c.height * 0.4, (o.f && o.f.cn) || '', 0]); });
    if (!pts.length) for (var e = 0; e < 4; e++) { var a2 = Math.PI * (0.2 + 0.2 * e); pts.push([cx + Math.cos(a2 + 2.6) * aw * 0.3, cy + Math.sin(a2 + 2.6) * aw * 0.3 + aw * 0.12, '', 0]); }
    pts.forEach(function (p, i) { var m = [(cx + p[0]) / 2 + Math.sin(i) * 12, (cy + p[1]) / 2 + Math.cos(i) * 12], line = []; for (var k3 = 0; k3 <= 12; k3++) { var t = k3 / 12; line.push([(1 - t) * (1 - t) * cx + 2 * (1 - t) * t * m[0] + t * t * p[0], (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * m[1] + t * t * p[1]]); } handLine(g, line, 1.6, p[3] ? 0.85 : 0.5, i + 3); });
    g.fillStyle = INK; g.font = Math.round(aw * 0.03) + 'px ' + FONT; g.textBaseline = 'middle';
    pts.forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], p[3] ? 5 : 3.5, 0, 7); g.fill(); if (p[2]) { var tw = g.measureText(p[2]).width; g.fillText(p[2], Math.max(4, Math.min(aw - tw - 4, p[0] + 9)), p[1] - 10); } });
    irukMark(g, cx, cy, aw * 0.12, 0.95);
    return c;
  }
  /* the poster without what was caught: the art whole, one's own line, one's own four lines. Kept while only the caught things move */
  function posterBase(P, art) {
    var W = 900, pad = 56, aw = W - pad * 2, a = artOf(P, art, aw, aw * 1.3), n = P.note || {}, lines = P.lines || [];
    var c = document.createElement('canvas'), x = c.getContext('2d'); c.width = W; c.height = 10; x.font = '26px ' + FONT;
    var body = []; lines.forEach(function (l, i) { if (l) wrap(x, l, aw - 60).forEach(function (w, k) { body.push([k ? '' : 'WISH'[i], w]); }); });
    x.font = '42px ' + FONT; var title = art === 'sign' ? [] : wrap(x, P.say || '', aw).slice(0, 3);
    var band = P.catch && (P.catch.map || P.catch.life || (P.catch.data || []).length || P.catch.nino) ? 340 : 0;
    var H = pad + 54 + a.height + 36 + title.length * 52 + (title.length ? 16 : 0) + body.length * 38 + 40 + band + pad;
    c.height = H; paper(x, W, H);
    x.fillStyle = INK; x.textBaseline = 'top'; x.font = '22px ' + FONT; irukMark(x, pad + 14, pad + 16, 30, 0.9); x.fillText('novel.global', pad + 40, pad + 4);
    if (n.code) { var cw2 = x.measureText(n.code).width; x.fillText(n.code, W - pad - cw2, pad + 4); }
    var ay = pad + 54, ax = pad + (aw - a.width) / 2; x.drawImage(a, ax, ay); handRect(x, ax - 6, ay - 6, a.width + 12, a.height + 12, 1.6, 0.85, 7);
    var y = ay + a.height + 36; x.font = '42px ' + FONT; title.forEach(function (l) { x.fillText(l, pad, y); y += 52; }); if (title.length) y += 16;
    x.font = '26px ' + FONT; body.forEach(function (b) { if (b[0]) { x.globalAlpha = 0.5; x.fillText(b[0], pad, y); x.globalAlpha = 1; } x.fillText(b[1], pad + 44, y); y += 38; });
    y += 14; var dots = []; for (var i = 0; i <= 40; i++) dots.push([pad + aw * i / 40, y]); x.setLineDash([2, 9]); handLine(x, dots, 2, 0.55, 2); x.setLineDash([]);
    return { c: c, band: y + 22, W: W, H: H, pad: pad };
  }
  /* the caught things, each a scrap of the paper on the poster, where one put it */
  var CATCH_K = ['map', 'life', 'data', 'nino'];
  function scrap(x, X, Y, w, h, seed) { x.fillStyle = 'rgba(23,69,127,.9)'; x.fillRect(X, Y, w, h); handRect(x, X, Y, w, h, 1.4, 0.8, seed); }
  function caught(P) { var C = P.catch || {}; return CATCH_K.filter(function (k) { return k === 'data' ? (C.data || []).length : !!C[k]; }); }
  function drawCatch(x, P, B0) {
    var boxes = {}, ks = caught(P), W = B0.W, H = B0.H, pad = B0.pad; P.pos = P.pos || {};
    var defaults = { map: [pad, B0.band], life: [pad + 270, B0.band], data: [pad + 270, B0.band + 114], nino: [pad + 270, B0.band + 206] };
    ks.forEach(function (k) {
      var at = P.pos[k] ? [P.pos[k][0] * W, P.pos[k][1] * H] : defaults[k], X = at[0], Y = at[1], w = 0, h = 0;
      x.save(); x.textBaseline = 'top'; x.fillStyle = INK;
      if (k === 'map') {
        w = h = 240; var cx = X + 120, cy = Y + 120, n = P.note || P, seen = (n.seen || []).slice(0, 8); x.fillStyle = 'rgba(23,69,127,.92)'; x.beginPath(); x.arc(cx, cy, 118, 0, 7); x.fill();
        handCircle(x, cx, cy, 116, 1.6, 0.85, 3); handCircle(x, cx, cy, 58, 0.8, 0.3, 5);
        handLine(x, [[cx, cy - 128], [cx, cy - 104]], 1.4, 0.8, 1); x.fillStyle = INK; x.font = '16px ' + FONT; x.fillText('N', cx - 5, cy - 150 + 2);
        var far = seen.reduce(function (m, s2) { return Math.max(m, s2.d || 0); }, 400);
        seen.forEach(function (s2) { var dy = (n.lat - s2.lat) * 111000, dx = (s2.lng - n.lng) * 111000 * Math.cos(n.lat * Math.PI / 180), kk = 100 / far; x.beginPath(); x.arc(cx + dx * kk, cy + dy * kk, 3.2, 0, 7); x.fill(); });
        irukMark(x, cx, cy - 4, 34, 1); var place = (NG.context(P)[0] || '').toLowerCase(); if (place) { x.font = '18px ' + FONT; var tw = x.measureText(place).width; x.fillText(place, cx - tw / 2, cy + 74); }
      } else if (k === 'life') {
        var f = lifeOf(P); if (!f) { x.restore(); return; } x.font = '36px ' + FONT; w = Math.min(560, x.measureText(f.cn).width + 48); x.font = 'italic 19px Georgia, serif'; w = Math.max(w, x.measureText(f.n || '').width + 48); h = 100;
        scrap(x, X, Y, w, h, 4); x.fillStyle = INK; x.font = '36px ' + FONT; x.fillText(f.cn, X + 24, Y + 16); x.globalAlpha = 0.7; x.font = 'italic 19px Georgia, serif'; x.fillText(f.n || '', X + 24, Y + 64); x.globalAlpha = 1;
      } else if (k === 'data') {
        x.font = '20px ' + FONT; var ls = wrap(x, P.catch.data.join(' · '), 360); w = Math.min(420, Math.max.apply(null, ls.map(function (l) { return x.measureText(l).width; })) + 40); h = ls.length * 28 + 26;
        scrap(x, X, Y, w, h, 6); x.fillStyle = INK; ls.forEach(function (l, i) { x.fillText(l, X + 20, Y + 14 + i * 28); });
      } else if (k === 'nino') {
        w = 250; h = 110; scrap(x, X, Y, w, h, 8); x.fillStyle = INK; x.strokeStyle = INK; x.lineWidth = 1.6;
        x.beginPath(); x.arc(X + 34, Y + 34, 12, 0, 7); x.stroke(); for (var r2 = 0; r2 < 8; r2++) { var an = r2 * Math.PI / 4; x.beginPath(); x.moveTo(X + 34 + Math.cos(an) * 17, Y + 34 + Math.sin(an) * 17); x.lineTo(X + 34 + Math.cos(an) * 21, Y + 34 + Math.sin(an) * 21); x.stroke(); }
        x.font = '26px ' + FONT; x.fillText('Niño 3.4 ' + ninoNow(), X + 64, Y + 20);
        var v = ninoVals(); if (v) { var mx = Math.max(1, Math.max.apply(null, v)), sp = v.map(function (q, i) { return [X + 22 + i * (w - 44) / Math.max(1, v.length - 1), Y + h - 16 - (q / mx) * 30]; }); handLine(x, sp, 1.4, 0.85, 9); }
      }
      x.restore(); boxes[k] = [X, Y, w, h];
    });
    return boxes;
  }
  var MARKS = {
    star: 'M16 3l3.6 8.4 9 .8-6.8 6 2 8.8L16 22.4 8.2 27l2-8.8-6.8-6 9-.8z', heart: 'M16 27C6 20 3 14 5.5 9.5 8 5 13 6 16 10c3-4 8-5 10.5-.5C29 14 26 20 16 27z',
    iruk: 'M8 15C8 8 11.5 5 16 5s8 3 8 10zM10 17v10M14 17v11M18 17v11M22 17v10', eye: 'M2 16C8 8 12 6 16 6s8 2 14 10c-6 8-10 10-14 10S8 24 2 16zM20.5 16a4.5 4.5 0 1 1-9 0 4.5 4.5 0 1 1 9 0',
    wave: 'M2 14c4-6 8-6 12 0s8 6 12 0 4-4 4-4M2 22c4-6 8-6 12 0s8 6 12 0 4-4 4-4', arrow: 'M4 27C10 19 16 13 26 6M18 5.5h8.5V14',
    sun: 'M22 16a6 6 0 1 1-12 0 6 6 0 1 1 12 0M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M7 25l3-3M22 10l3-3', leaf: 'M6 26C8 12 16 6 27 5c-1 11-7 19-21 21zM6 26c6-6 11-11 16-16'
  };
  var ICON_IMG = {};
  function iconImg(src, then) { var im = ICON_IMG[src]; if (im) return im.complete ? im : null; im = ICON_IMG[src] = new Image(); im.onload = then; im.src = src; return null; }
  function drawAdds(x, P, W, H, boxes, again) {
    (P.adds || []).forEach(function (a, i) {
      var X = a.x * W, Y = a.y * H, w = 0, h = 0; x.save();
      if (a.k === 's' && MARKS[a.g]) { w = h = 132; x.translate(X + 6, Y + 6); x.scale(3.75, 3.75); x.strokeStyle = INK; x.lineWidth = 0.75; x.lineCap = x.lineJoin = 'round'; x.stroke(new Path2D(MARKS[a.g])); }
      else if (a.k === 't') { x.font = '34px ' + FONT; var ls = wrap(x, a.t || ' ', 420); w = Math.max(80, Math.max.apply(null, ls.map(function (l) { return x.measureText(l).width; })) + 40); h = ls.length * 44 + 22;
        scrap(x, X, Y, w, h, 11 + i); x.fillStyle = INK; x.textBaseline = 'top'; ls.forEach(function (l, k) { x.fillText(l, X + 20, Y + 12 + k * 44); }); }
      else if (a.k === 'i') { var im = iconImg(a.src, again); w = h = 128; if (im) { x.imageSmoothingEnabled = false; var iw = im.naturalWidth, ih = im.naturalHeight, k2 = 128 / Math.max(iw, ih); x.drawImage(im, X + (128 - iw * k2) / 2, Y + (128 - ih * k2) / 2, iw * k2, ih * k2); } }
      x.restore(); boxes['a' + i] = [X, Y, w, h];
    });
    return boxes;
  }
  function posterKey(P, art) { return [art, P.say, (P.lines || []).join('|'), (P.photo || '').length, !!P.img, P.note && P.note.code, caught(P).length > 0, P.catch && P.catch.life, P.note && (P.note.seen || []).length].join('~'); }
  function posterNow(P, art) {
    /* → { c, boxes }: the base kept, the caught things drawn over it */
    var key = posterKey(P, art); if (!P._base || P._base.key !== key) { P._base = posterBase(P, art); P._base.key = key; }
    var B0 = P._base, c = document.createElement('canvas'); c.width = B0.W; c.height = B0.H; var x = c.getContext('2d'); x.drawImage(B0.c, 0, 0);
    return { c: c, boxes: drawAdds(x, P, B0.W, B0.H, drawCatch(x, P, B0), function () { if (window.AURA && AURA.redraw) AURA.redraw(); }) };
  }
  function poster(P, art) { return fontReady().then(function () { return posterNow(P, art || 'photo').c; }); }
  function keepCanvas(c, cap, codeT) {
    var src = c.toDataURL('image/jpeg', 0.86), item = { id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), src: src, cap: cap || '', code: codeT || '' };
    folioKeep(item); return item;
  }
  /* a print from the base's own pages: what it chose to show there is what was caught */
  function keepNote(n, art) {
    var P = { note: n, at: n.at, say: n.say, lat: n.lat, lng: n.lng, data: n.data, seen: n.seen, r: NG.read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng, wx: n.wx }), catch: { life: n.sp || '', data: (n.data || []).slice(0, 3) } };
    P.lines = NG.wishLines(n, P.r).map(function (l) { return l[1]; });
    var src = NG.PHOTOS[n.id] || n.thumb || ''; var go = function () { return poster(P, art === 'net' || art === 'sign' || art === 'pixel' ? art : (P.img ? 'photo' : 'net')).then(function (c) { return keepCanvas(c, n.cn || n.say || '', n.code); }); };
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

  var orbs = [], tabs = [], catchK = null, panel = null, deep = null;
  var S = { mode: 'seed', t0: 0, stage: 0, deep: false, spin: 0.6, fade: 1 };
  var L = {}, dpr = 1;
  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1); var W = innerWidth, H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var mob = W < 760, R = Math.min(W * 0.86, H * 0.74, 560) * 150 / 400;
    var big = !mob && H > 760 && W > 1200, bw = mob ? 116 : big ? 196 : 160, bh = bw * 0.58, by = mob ? 16 : 22, cr = mob ? 22 : big ? 27 : 24, gy = by + bh + (mob ? 60 : 76);
    var tipY = H - (mob ? 34 : 42), panelTop = gy + cr + (mob ? 16 : 24), panelBot = tipY - (mob ? 44 : 52), pw = mob ? W - 40 : Math.min(big ? 720 : 640, W - 380);
    L = { W: W, H: H, mob: mob, big: big, R: R, cx: W / 2, cy: H / 2, bx: W / 2, by: by, bw: bw, bh: bh, gy: gy, cr: cr,
      hold: [0, 1, 2, 3].map(function (i) { return [W / 2 + [-1.55, -0.55, 0.55, 1.55][i] * cr, gy + (i === 0 || i === 3 ? 4 : cr * 0.6)]; }),
      tips: [0, 1, 2, 3].map(function (i) { return [mob ? W * (0.125 + 0.25 * i) : W / 2 + (i - 1.5) * Math.min(W * 0.2, big ? 300 : 240), tipY]; }),
      panel: { l: (W - pw) / 2, t: panelTop, w: pw, h: Math.max(160, panelBot - panelTop) } };
    [panel, deep].forEach(function (p) { if (p) { p.style.left = L.panel.l + 'px'; p.style.top = L.panel.t + 'px'; p.style.width = L.panel.w + 'px'; p.style.height = L.panel.h + 'px'; } });
    /* the keys stay where they are: the tentacles move between them, never the things one reaches for */
    tabs.forEach(function (b, i) { var tr = 'translate(' + L.tips[i][0].toFixed(1) + 'px,' + L.tips[i][1].toFixed(1) + 'px)'; b.style.setProperty('--at', tr); b.style.transform = tr; });
    if (catchK) { catchK.style.setProperty('--at', 'translate(' + L.bx + 'px,' + gy + 'px)'); catchK.style.transform = 'translate(' + L.bx + 'px,' + gy + 'px)'; catchK.style.width = catchK.style.height = cr * 2 + 'px'; catchK.style.margin = -cr + 'px 0 0 ' + -cr + 'px'; }
    var bl = $('#au-bell'); if (bl) { bl.style.transform = 'translate(' + (L.bx - L.bw * 0.55) + 'px,' + (L.by - 4) + 'px)'; bl.style.width = L.bw * 1.1 + 'px'; bl.style.height = L.bh * 1.15 + 'px'; }
    x.setTransform(dpr, 0, 0, dpr, 0, 0); root.classList.toggle('big', big); root.style.setProperty('--ph', L.panel.h + 'px');
    if (panel) regrow();
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

  /* ───────── the irukandji: a box bell, a tentacle from each corner; together they hold one thing, then hang to their steps ───────── */
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
  /* where the tentacles are put to work, read from the page each frame: W.I.S.H.'s four lines, or the four sides of the piece */
  var FORM = { key: 'hang', lines: null, rect: null };
  function readForm() {
    FORM.lines = null; FORM.rect = null; var key = 'hang';
    if (S.mode === 'iruk' && !S.deep && panel) {
      if (S.stage === 1) { var tas = panel.querySelectorAll('.au-wish textarea'); if (tas.length === 4) { var ls = [].map.call(tas, function (ta) { var r = ta.getBoundingClientRect(); return [r.left, r.right, r.bottom - 1]; }); if (ls[0][1] > ls[0][0]) { FORM.lines = ls; key = 'wish'; } } }
      else if (S.stage >= 2) { var el = panel.querySelector('.au-drag canvas, .au-hero canvas, .au-wall img'); if (el) { var r = el.getBoundingClientRect(), P0 = L.panel; if (r.width > 20) { FORM.rect = [r.left - 9, Math.max(P0.t - 6, r.top - 9), r.right + 9, Math.min(P0.t + P0.h + 6, r.bottom + 9)]; key = 'frame' + S.stage; } } }
    }
    if (key !== FORM.key) { FORM.from = LAST; FORM.at = performance.now() / 1000; FORM.key = key; }
    root.classList.toggle('loose', key !== 'hang');
  }
  var LAST = null;
  function tentPts(i, t, bell) {
    var root = [L.bx + (i - 1.5) / 1.5 * bell.w * 0.82, bell.bot - 1], g = L.hold[i], tip = L.tips[i], P0 = L.panel, mob = L.mob, left = i < 2;
    var held = [root, [(root[0] + g[0]) / 2, root[1] + (g[1] - root[1]) * 0.4], g], ctl = null, k0 = 0;
    if (FORM.lines) {
      /* W.I.S.H.: each tentacle sweeps down from the catch to the margin and lies along its own line; W and I from the left, S and H from the right */
      var ln = FORM.lines[i], sx = left ? ln[0] - (i === 0 ? 7 : 14) : ln[1] + (i === 3 ? 7 : 14), a0 = left ? ln[0] : ln[1], a1 = left ? ln[1] : ln[0];
      ctl = held.concat([[g[0] + (sx - g[0]) * 0.7, g[1] + (ln[2] - g[1]) * 0.3], [sx, ln[2] - 18], [a0 + (left ? 6 : -6), ln[2]]]); k0 = ctl.length - 1;
      for (var q = 1; q <= 6; q++) ctl.push([a0 + (a1 - a0) * q / 6, ln[2]]);
    } else if (FORM.rect) {
      /* the piece: they cross at the catch, go down outside it, and close the four sides as one loop: left, bottom, right, top */
      var R = FORM.rect, TL = [R[0], R[1]], TR = [R[2], R[1]], BR = [R[2], R[3]], BL = [R[0], R[3]], o = mob ? 5 : 16, side, L1 = Math.max(2, R[0] - o), L2 = Math.max(2, R[0] - 2 * o), R1 = Math.min(L.W - 2, R[2] + o), R2 = Math.min(L.W - 2, R[2] + 2 * o);
      if (i === 0) { ctl = held.concat([[L1, g[1] + 14], [L1, R[1] - 12], TL]); side = [TL, BL]; }
      else if (i === 1) { ctl = held.concat([[L2, g[1] + 18], [L2, R[3] - 14], BL]); side = [BL, BR]; }
      else if (i === 3) { ctl = held.concat([[R2, g[1] + 18], [R2, R[3] - 14], BR]); side = [BR, TR]; }
      else { ctl = held.concat([[R1, g[1] + 14], [R1, R[1] - 12], TR]); side = [TR, TL]; }
      k0 = ctl.length - 1; for (var q2 = 1; q2 <= 6; q2++) ctl.push([side[0][0] + (side[1][0] - side[0][0]) * q2 / 6, side[0][1] + (side[1][1] - side[0][1]) * q2 / 6]);
    }
    if (ctl) {
      /* at work, they are steady where they lie and drift only on the way there */
      var pw = catmull(ctl, NT), seg = ctl.length - 1, amp2 = mob ? 6 : 12; if (still) return pw;
      return pw.map(function (q3, j) { var u = j / (NT - 1) * seg, s = j / (NT - 1), env = u >= k0 ? 0.04 : Math.sin(Math.PI * Math.min(1, u / k0)) * Math.min(1, Math.abs(j - NT * 0.1) / 5);
        return [q3[0] + noise(i * 3.3, s * 2.2, t * 0.22) * amp2 * env, q3[1] + noise(i * 7.1, s * 3, t * 0.18) * amp2 * 0.4 * env + Math.sin(t * 1.1 + j * 0.35 + i) * 0.5 * (u >= k0 ? 1 : 0)]; });
    }
    /* they hang: from the bell, round the one thing they hold, drifting down to their steps; over the step's page they go faint */
    var lx = function (f) { return g[0] + (tip[0] - g[0]) * f + (left ? -1 : 1) * Math.sin(f * Math.PI) * (mob ? 12 : 44); };
    var pts = catmull([root, [(root[0] + g[0]) / 2, root[1] + (g[1] - root[1]) * 0.4], g, [lx(0.2), P0.t + P0.h * 0.15], [lx(0.5), P0.t + P0.h * 0.5], [lx(0.8), P0.t + P0.h * 0.85], tip], NT);
    if (still) return pts; var amp = mob ? 9 : 16, lean = left ? -1 : 1, gj = NT * 0.1;
    return pts.map(function (q, j) { var s = j / (NT - 1), env = Math.sin(Math.PI * s) * Math.min(1, Math.abs(j - gj) / 5) * Math.min(1, (NT - 1 - j) / 6);
      var wave = Math.sin(s * (22 + i * 3) - t * 1.3 + i * 1.7) * (mob ? 2.4 : 3.2) * env;
      return [q[0] + (noise(i * 3.3, s * 2.2, t * 0.22) * amp + lean * bell.p * 2.5) * env + wave, q[1] + noise(i * 7.1, s * 3, t * 0.18) * amp * 0.4 * env]; });
  }
  function irukTargets(t) {
    var b = bellPts(t), T = [0, 1, 2, 3].map(function (i) { return tentPts(i, t, b); });
    /* from one shape to the next, they move, they do not jump */
    if (FORM.from && !still) { var e = Math.min(1, (performance.now() / 1000 - FORM.at) / 0.9); e = e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;
      if (e < 1) T = T.map(function (pts, i) { var f = FORM.from[i]; return f ? pts.map(function (q, j) { return [f[j][0] + (q[0] - f[j][0]) * e, f[j][1] + (q[1] - f[j][1]) * e]; }) : pts; }); else FORM.from = null; } return { bell: b, tents: T, rings: [b.pts, T[0].concat(T[1].slice().reverse()), T[2].concat(T[3].slice().reverse())] }; }

  /* ───────── drawing ───────── */
  function stroke(pts, w, a, taper, closed) {
    if (PF && pts.length > 2) {
      var Q = closed ? pts.concat([pts[0], pts[1]]) : pts, o = PF.getStroke(Q, { size: w * 2, thinning: taper ? 0.55 : 0.2, smoothing: 0.55, streamline: 0.25, simulatePressure: false, start: { taper: 0, cap: true }, end: { taper: taper ? 60 : 0, cap: true }, last: true });
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
  /* the step that would come next, once this one has something: a light runs down its tentacle to the tip */
  var nextStep = function () { return S.deep || S.stage >= 3 || !ready() ? -1 : S.stage + 1; };
  function drawIruk(t, a) {
    readForm(); var T = irukTargets(t), b = T.bell, k0 = a, nx = nextStep(), work = FORM.key !== 'hang'; LAST = T.tents;
    /* the aura: a slow light round the bell, breathing with it */
    var g = x.createRadialGradient(L.bx, b.top + L.bh * 0.5, 4, L.bx, b.top + L.bh * 0.5, L.bw * 1.7); g.addColorStop(0, 'rgba(244,241,232,' + (0.13 + 0.07 * b.p) * a + ')'); g.addColorStop(1, 'rgba(244,241,232,0)');
    x.fillStyle = g; x.fillRect(L.bx - L.bw * 2, b.top - L.bw, L.bw * 4, L.bw * 3.4);
    var P0 = L.panel, faint = function (inside) { x.save(); x.beginPath(); x.rect(P0.l, P0.t, P0.w, P0.h); if (!inside) { x.rect(L.W, 0, -L.W, L.H); x.clip('evenodd'); } else x.clip(); };
    [false, true].forEach(function (inside) { if (work && inside) return; if (!work) faint(inside); else x.save(); var A = inside ? (S.deep || P && P.photo ? 0.08 : 0.14) : 1;
      T.tents.forEach(function (pts, i) {
        var on = i === S.stage, nxt = i === nx, w = on ? 1.15 : 0.8, a2 = A * k0;
        stroke(pts, w, (on ? 0.9 : nxt ? 0.7 : 0.5) * a2, true);
        stroke(pts.map(function (p) { return [p[0] + 1.6, p[1] - 1]; }).slice(0, NT - 6), 0.3, 0.18 * a2, true);
        /* the beads of stinging cells along it, the irukandji's own dots: lit along the open step, a light running down to the next */
        for (var j = 4; j < NT - 1; j += 2) { var tw = 0.5 + 0.5 * Math.sin(t * 2.6 - j * 0.5 + i), big = j % 6 === 0, sting = S.sting && t - S.sting < 1.8 ? Math.max(0, 1 - Math.abs((t - S.sting) / 1.4 - j / NT) * 8) : 0, run = Math.max(sting, nxt ? Math.max(0, 1 - Math.abs(((t * 0.55) % 1.2) - j / NT) * 9) : 0);
          dot(pts[j][0], pts[j][1], (big ? 2.1 : 1.2) * (on ? 1.15 : 1) * (1 + run * 0.8), Math.min(1, (on ? 0.4 + 0.55 * tw : 0.22 + 0.25 * tw) + run * 0.7) * a2); }
      }); x.restore(); });
    stroke(b.pts, 1.4, 0.95 * a, false, true);
    stroke(b.pts.map(function (p) { return [p[0] + 1.2, p[1] + 0.8]; }), 0.4, 0.25 * a, false, true);
    /* the bell is the eye that notices, drawn in dots as the bark painting draws it; its four tears run down as the tentacles.
       It looks toward the step that is open; what it has seen sits in its pupil; with nothing seen yet, the pupil breathes */
    var bk = still ? 1 : Math.min(1, Math.abs(((t + 2.2) % 7.3) - 0.14) / 0.14, S.blink ? Math.min(1, Math.abs(t - S.blink - 0.14) / 0.14) : 1);
    var eh = (b.bot - b.top) * 0.27 * Math.max(0.08, bk), ew = b.w * 0.74, ex = L.bx, ey = b.top + (b.bot - b.top) * 0.5, look = (S.stage - 1.5) / 1.5 * ew * 0.16;
    for (var j2 = 0; j2 < 30; j2++) { var u2 = j2 / 30 * Math.PI * 2, cu = Math.cos(u2), su = Math.sin(u2); dot(ex + cu * ew, ey + su * eh * (0.35 + 0.65 * Math.abs(su)), 1.15, (S.hEye ? 1 : 0.62 + 0.18 * Math.sin(t * 1.75)) * a); }
    var pr = (b.bot - b.top) * 0.27 * 0.95 * Math.max(0.08, bk) * (1 + (still ? 0 : 0.04 * Math.sin(t * 1.75)) + (S.hEye ? 0.06 : 0)), px = ex + look * 0.6, wait = !ready(), glow = wait && !still ? 0.5 + 0.5 * Math.sin(t * 2.4) : 0;
    if (glow) { var gg = x.createRadialGradient(px, ey, 1, px, ey, pr * 2.4); gg.addColorStop(0, 'rgba(244,241,232,' + 0.35 * glow * a + ')'); gg.addColorStop(1, 'rgba(244,241,232,0)'); x.fillStyle = gg; x.fillRect(px - pr * 3, ey - pr * 3, pr * 6, pr * 6); }
    if (P && P.eye) { x.save(); x.beginPath(); x.arc(px, ey, pr, 0, 7); x.clip(); x.globalAlpha = a; x.drawImage(P.eye, px - pr, ey - pr, pr * 2, pr * 2); x.restore(); }
    else dot(px, ey, pr * (0.42 + 0.12 * glow), 0.95 * a);
    stroke((function () { var c2 = []; for (var k3 = 0; k3 <= 24; k3++) { var v = k3 / 24 * Math.PI * 2; c2.push([px + Math.cos(v) * pr, ey + Math.sin(v) * pr]); } return c2; })(), 0.7, 0.85 * a, false);
    [-0.62, -0.22, 0.22, 0.62].forEach(function (f) { dot(L.bx + f * b.w, b.bot - L.bh * 0.1, 1.7, 0.85 * a); });
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
  var AC0 = function () { return !!hum || !!window.__auraSound; };
  function bell(i, vol) { if (mute || !AC0()) return; var c = NG.ac(), I = NG.INS.gamelan; I.fn(c, NG.bus(c), c.currentTime + 0.02, 220 * Math.pow(2, DEG[i % DEG.length] / 12), 1.7, vol || 0.28); }
  function harp(seq) { if (mute || !AC0()) return; var c = NG.ac(), I = NG.INS.harp || NG.INS.gamelan; seq.forEach(function (d, i) { I.fn(c, NG.bus(c), c.currentTime + 0.05 + i * 0.16, 220 * Math.pow(2, DEG[d % DEG.length] / 12 + (d >= DEG.length ? 1 : 0)), 1.7, 0.3); }); }
  function boom() {
    if (mute) return; var c = NG.ac(), t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(92, t); o.frequency.exponentialRampToValueAtTime(41, t + 2.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2); o.connect(g); g.connect(NG.bus(c)); o.start(t); o.stop(t + 3.3);
    var len = c.sampleRate * 2, nb = c.createBuffer(1, len, c.sampleRate), d = nb.getChannelData(0); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g2 = c.createGain(); s.buffer = nb; f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(180, t + 1.8); g2.gain.value = 0.05;
    s.connect(f); f.connect(g2); g2.connect(NG.bus(c)); s.start(t);
  }

  /* a deep tone when the pointer finds what can be touched: the eye, the catch */
  var toneAt = 0;
  function deepTone(f0) {
    window.__auraTone = f0;
    if (mute || !AC0()) return; var c = NG.ac(), t = c.currentTime; if (t - toneAt < 0.7) return; toneAt = t;
    [f0, f0 * 1.5].forEach(function (f, i) { var o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(i ? 0.025 : 0.06, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); o.connect(g); g.connect(NG.bus(c)); o.start(t); o.stop(t + 1.7); });
  }

  /* ───────── the keys: the three pages on the globe; the bell, which is the eye; the four steps, icons alone at the tentacles' tips;
     the one thing held. No words on hover: the names are for those who listen for them (aria) ───────── */
  var STEPS = [['notice', 'radio'], ['W.I.S.H.', 'wish'], ['art', 'art'], ['print', 'print']];
  var NUMS = ['M2.6 4.4c1.4-.6 2.6-1.7 3.4-2.8.3 3.9 0 8.1.4 11.8', 'M1.8 4.6c.8-2.3 5.1-2.7 5.5.2.3 2.3-2.7 4.7-5.3 8.4 1.9-.5 3.9-.3 5.7.1',
    'M2 3.4c1.7-1.7 5.5-1.5 5.3 1.1-.1 1.6-1.9 2.4-3.5 2.6 2.5-.2 4.1.8 3.9 3.1-.3 2.9-4.5 3.3-5.9 1.6', 'M6.4 13.6c-.2-3.8 0-7.6.4-11.6-1.8 2.6-3.6 5.2-5.3 7.6 2.1-.2 4.6-.3 6.9 0'];
  var ICON = {
    radio: '<circle cx="16" cy="19" r="2.2" class="f"/><path d="M16 21.5v8.5M12.4 15.2a5.2 5.2 0 0 1 7.2 0M9.3 12.1a9.6 9.6 0 0 1 13.4 0M6.2 9a14 14 0 0 1 19.6 0" class="d"/>',
    wish: '<path d="M9 13.5C9 8 12 5 16 5s7 3 7 8.5v1.2H9z"/><path d="M10.5 15v13M14 15v14M18 15v14M21.5 15v13" class="t"/>',
    art: '<path d="M5 26c6-3 4-10 11-12s9-8 11-9"/><circle cx="9" cy="9" r="3"/><path d="M20 22l6 4M22 18h6" class="d"/>',
    print: '<path d="M9 3h14v24l-2.3-1.6-2.3 1.6-2.4-1.6-2.4 1.6-2.3-1.6L9 27z"/><path d="M12 9h8M12 13h8M12 17h5"/>',
    /* the catch: one bundle, four things in it (the ground, a leaf, the readings, the sun over the water) */
    catch: '<circle cx="16" cy="16" r="13.5" class="d"/><path d="M8 13l3-1.5 3 1.5 3-1.5v7l-3 1.5-3-1.5-3 1.5z"/><path d="M18.5 11c2-2.8 5-3.6 7-3-.4 2.8-3 5-7 3z"/><circle cx="21.5" cy="21" r="2.2"/><path d="M17 26c1.4-1 2.6-1 4 0s2.6 1 4 0" /><circle cx="11" cy="23" r="1" class="f"/><circle cx="13.5" cy="21.5" r="1" class="f"/>',
    save: '<path d="M16 5v15M10 15l6 6 6-6"/><path d="M7 26h18" class="d"/>',
    seed: '<circle cx="16" cy="16" r="3" class="f"/><circle cx="16" cy="16" r="9" class="d"/>',
    again: '<path d="M8 9a10 10 0 1 1-2 9"/><path d="M8 3.5V9h5.5"/>',
    back: '<path d="M25 9H12a7 7 0 0 0 0 14h10"/><path d="M17 4l-5 5 5 5"/>',
    bin: '<path d="M7 9h18M13 9V6h6v3M9 9l1.2 17h11.6L23 9"/><path d="M14 13v9M18 13v9" class="d"/>',
    text: '<path d="M6 25L13 6h2l7 19M9 18h10"/><path d="M23 25c0-3 1.5-5 4-5s3 2 3 5" class="d"/>'
  };
  var svgI = function (k, cls2) { return '<svg class="' + (cls2 || 'au-i') + '" viewBox="0 0 32 32" aria-hidden="true">' + ICON[k] + '</svg>'; };
  var markI = function (g) { return '<svg class="au-i" viewBox="0 0 32 32" aria-hidden="true"><path d="' + MARKS[g] + '"/></svg>'; };
  var numI = function (i) { return '<svg class="au-n" viewBox="0 0 10 16" aria-hidden="true"><path d="' + NUMS[i] + '"/></svg>'; };
  ui.innerHTML =
    '<button id="au-seed" aria-label="Begin"></button>' +
    [0, 1, 3].map(function (s, i) { return '<button class="au-orb" data-s="' + s + '" aria-label="' + ['RADIO', 'W.I.S.H.', 'PRINT'][i] + '"><i class="pt"></i>' + numI(i) + svgI(['radio', 'wish', 'print'][i]) + '</button>'; }).join('') +
    '<a id="au-base" href="?base" aria-label="The base"><i></i></a>' +
    '<label id="au-bell" aria-label="The eye: a photograph of what you have noticed"><input type="file" accept="image/*" id="au-file" hidden></label>' +
    '<button id="au-up" aria-label="Back up to the globe"><i></i></button>' +
    STEPS.map(function (s, i) { return '<button class="au-tab" data-s="' + i + '" aria-label="' + s[0] + '">' + numI(i) + svgI(s[1]) + '</button>'; }).join('') +
    '<button id="au-catch" aria-label="What it has caught: the map, the life, the data, El Niño">' + svgI('catch') + '<b></b></button>' +
    '<button id="au-snd" aria-label="Sound"><i></i><svg viewBox="0 0 24 12" aria-hidden="true"><path d="M1 6c2.5-5 5-5 7.5 0s5 5 7.5 0 5-5 7 0"/></svg></button>' +
    '<section id="au-panel" aria-live="polite"></section><section id="au-deep" hidden></section>' +
    '<div id="au-show" hidden><div class="au-sl"><div class="au-pz"><img alt=""></div></div><nav class="au-dots"></nav>' +
    '<button class="au-prev" aria-label="Before">‹</button><button class="au-next2" aria-label="After">›</button><button class="au-x" aria-label="Close">×</button></div>';
  orbs = [].slice.call(ui.querySelectorAll('.au-orb')); tabs = [].slice.call(ui.querySelectorAll('.au-tab')); catchK = $('#au-catch');
  panel = $('#au-panel'); deep = $('#au-deep');
  var showEl = $('#au-show');
  function setMode(m) { S.mode = m; S.t0 = performance.now(); root.className = 'm-' + m + ' st' + S.stage + (S.deep ? ' deep' : '') + (showEl && !showEl.hidden ? ' showing' : '') + (L.big ? ' big' : ''); }
  var cls = function () { root.classList.remove('st0', 'st1', 'st2', 'st3'); root.classList.add('st' + S.stage); root.classList.toggle('deep', !!S.deep); };
  $('#au-snd').classList.toggle('off', mute);

  /* ───────── the frame ───────── */
  var raf = 0, last = 0, asleep = false;
  function frame(now) {
    raf = 0; if (asleep || document.hidden) return; S.frames = (S.frames || 0) + 1;
    /* the next frame is asked for first: one bad frame never stops the creature */
    raf = requestAnimationFrame(frame);
    try { draw1(now); } catch (e) { if (!frame.told) { frame.told = 1; console.error('aura frame: ' + (e && e.stack || e)); } }
  }
  function draw1(now) {
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
    else if (S.mode === 'iruk') { S.fade = Math.min(1, S.fade + dt * 2); T = drawIruk(t, 1); keys(); }
    if (S.mode === 'bang' && k > 1.4) rs = place3(t, Math.min(1, (k - 1.4) / 1.0));
    humFrame(rs, T && T.bell);
  }
  /* the pages ride their rings: larger and brighter at the front */
  function place3(t, a) {
    return RINGS.map(function (k, i) {
      var q = ringPt(k, k.a0 + (still ? 0 : t * k.sp), S.spin, L.R, L.cx, L.cy), depth = (q[2] + 1) / 2, o = orbs[i];
      o.style.transform = 'translate(' + q[0].toFixed(1) + 'px,' + q[1].toFixed(1) + 'px) scale(' + (0.72 + 0.4 * depth).toFixed(3) + ')';
      o.style.opacity = ((0.5 + 0.5 * depth) * a).toFixed(2); o.style.zIndex = q[2] >= 0 ? 3 : 1; return [q[0], q[1], depth];
    });
  }
  function keys() {
    var a = S.fade, nx = nextStep();
    tabs.forEach(function (b, i) { b.style.opacity = a; b.classList.toggle('on', i === S.stage); b.classList.toggle('next', i === nx); });
    catchK.style.opacity = a; catchK.classList.toggle('on', !!S.deep);
    panel.style.opacity = deep.style.opacity = a;
  }
  function go() { if (!raf && !asleep) raf = requestAnimationFrame(frame); }

  /* ───────── moving between them ───────── */
  function bang() {
    if (S.mode !== 'seed') return; window.__auraSound = 1; humStart(); try { boom(); } catch (e) { /* no sound */ }
    SNOW.forEach(function (s, i) { if (i % 2) return; var a = Math.random() * 7, v = 0.25 + Math.random() * 0.6; s.x = 0.5; s.y = 0.5; s.vx = Math.cos(a) * v * L.W; s.vy = Math.sin(a) * v * L.H; s.burst = 1.6; });
    setMode('bang'); store.set('da.aura.seen', 1);
  }
  function toIruk(stage) { if (S.mode !== 'globe' && S.mode !== 'bang') return; FORM.key = 'hang'; FORM.lines = FORM.rect = FORM.from = null; S.stage = stage; S.deep = false; deep.hidden = true; paint(); setMode('morph'); bell(stage, 0.22); }
  function toGlobe() { if (S.mode !== 'iruk') return; S.deep = false; deep.hidden = true; setMode('unmorph'); bell(0, 0.18); }
  function step(i) { if (i === S.stage && !S.deep) return; S.stage = i; S.deep = false; S.sel = null; deep.hidden = true; deep.innerHTML = ''; cls(); paint(); keys(); bell(i); panel.scrollTop = 0; focusFirst(); }
  var focusFirst = function () { if ('ontouchstart' in window) return; var f = panel.querySelector('textarea'); if (f) setTimeout(function () { f.focus(); }, 60); };
  $('#au-seed').addEventListener('click', bang);
  root.addEventListener('pointerdown', function (e) { if (S.mode === 'seed' && e.target === cv) bang(); });
  orbs.forEach(function (o) { o.addEventListener('click', function () { if (S.mode === 'bang') setMode('globe'); toIruk(+o.dataset.s); }); });
  $('#au-up').addEventListener('click', toGlobe);
  /* the eye takes in a photograph from any step, and the step stays where it is */
  $('#au-file').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; intake(f); bell(0, 0.24); });
  tabs.forEach(function (b) { b.addEventListener('click', function () { step(+b.dataset.s); }); });
  catchK.addEventListener('click', function () { if (S.deep) closeDeep(); else openDeep(); bell(4, 0.2); });
  var bellK = $('#au-bell');
  bellK.addEventListener('pointerenter', function (e) { S.hEye = true; if (e.pointerType === 'mouse') deepTone(55); });
  bellK.addEventListener('pointerleave', function () { S.hEye = false; });
  catchK.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') deepTone(73.4); });
  $('#au-snd').addEventListener('click', function () { mute = !mute; store.set('da.aura.mute', mute); this.classList.toggle('off', mute); if (!mute) { window.__auraSound = 1; humStart(); } humSet(true); });

  /* ───────── the piece: one at a time, kept as it is made, until it is printed and a new one begun. The engine reads it underneath;
     nothing it knows is said unless it is caught ───────── */
  var P = null;
  var ready = function () { return !!(P && (P.photo || P.say || (P.lines || []).some(Boolean) || P.catch.life)); };
  function newPiece() { return { id: 'n' + Date.now().toString(36), at: Date.now(), photo: '', thumb: '', say: '', tags: [], mine: true, lat: NG.map.lat, lng: NG.map.lng, src: 'MAP', art: 'photo', lines: ['', '', '', ''], catch: { map: false, life: '', data: [], nino: false }, pos: {}, adds: [] }; }
  var piece = function () { if (!P) { P = newPiece(); where(P); } return P; };
  var KEEP = ['id', 'at', 'photo', 'thumb', 'say', 'tags', 'lat', 'lng', 'src', 'art', 'lines', 'catch', 'pos', 'adds', 'sent', 'folioId', 'revealed', 'wx'];
  function pack(p) { var o = {}; KEEP.forEach(function (k) { if (p[k] !== undefined) o[k] = p[k]; }); o.noteId = p.note ? p.note.id : ''; return JSON.parse(JSON.stringify(o)); }
  function unpack(o) {
    var p = newPiece(); KEEP.forEach(function (k) { if (o[k] !== undefined) p[k] = o[k]; }); p.mine = true; p.catch = p.catch || { map: false, life: '', data: [], nino: false }; p.adds = p.adds || []; p.pos = p.pos || {};
    p.note = o.noteId ? NG.notes().filter(function (n) { return n.id === o.noteId; })[0] || null : null; p.dirty = true; if (p.photo) eyeOf(p); return p;
  }
  var draftT = 0;
  function changed() { if (!P) return; P._base = null; if (P.sent) P.sent = 0; clearTimeout(draftT); draftT = setTimeout(function () { if (P) draftSave(pack(P)); }, 500); keys(); }
  function eyeOf(p) { NG.loadImg(p.photo).then(function (i2) { p.img = i2; p._base = null; var e = document.createElement('canvas'), w = i2.naturalWidth || i2.width, h = i2.naturalHeight || i2.height, m = Math.min(w, h); e.width = e.height = 96; e.getContext('2d').drawImage(i2, (w - m) / 2, (h - m) / 2, m, m, 0, 0, 96, 96); p.eye = e; if (S.stage >= 2) redraw(); }).catch(function () {}); }
  function where(p) {
    if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(function (g) { if (!p || (p.src === 'PHOTO' || p.src === 'TAP')) return; p.lat = g.coords.latitude; p.lng = g.coords.longitude; p.src = 'HERE'; think(); },
      function () { /* the map's centre stands */ }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  function think() {
    if (!P) return; P.spId = P.catch.life || null; P.r = NG.read(P); P.data = NG.context(P); P.dirty = true;
    if (!P.wx && !P.wxAsked) { P.wxAsked = 1; NG.weather(P.lat, P.lng).then(function (w) { if (P && w) { P.wx = w; P.data = NG.context(P); } }); }
  }
  function intake(file) {
    if (!file) return; var p = piece(), url = URL.createObjectURL(file);
    panel.classList.add('busy');
    var exP = new Promise(function (res) { try { var fr = new FileReader(); fr.onload = function () { res(NG.exif(fr.result)); }; fr.onerror = function () { res({}); }; fr.readAsArrayBuffer(file.slice(0, 256 * 1024)); } catch (e) { res({}); } });
    var imP = NG.loadImg(url).catch(function () { return window.createImageBitmap ? createImageBitmap(file).then(function (bm) { var c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0); return c; }) : null; }).catch(function () { return null; });
    Promise.all([exP, imP]).then(function (got) {
      var ex = got[0] || {}, im = got[1]; panel.classList.remove('busy');
      if (im) { try { p.photo = NG.shrink(im, 1400, 0.86); if (p.photo.length > 900e3) p.photo = NG.shrink(im, 1000, 0.8); p.thumb = NG.shrink(im, 220, 0.7); } catch (e) { p.photo = ''; } }
      if (ex.t) p.at = ex.t; if (ex.lat != null) { p.lat = ex.lat; p.lng = ex.lng; p.src = 'PHOTO'; } else where(p);
      p.img = null; p.eye = null; if (p.photo) { eyeOf(p); if (p.art !== 'photo' && p.art !== 'pixel') p.art = 'photo'; }
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000); NG.db().then(think); think(); changed(); paint(); harp([0, 2]); S.blink = performance.now() / 1000;
    });
  }
  /* placed: kept with the base's noticings and a few sightings revealed near it. On the record, only what was caught */
  function settle() {
    if (!ready()) return null; if (P.note && !P.dirty) return P.note; think(); var n = NG.place(P); P.note = n; P.dirty = false;
    if (P.photo) NG.PHOTOS[n.id] = P.photo.length < 400e3 ? P.photo : NG.PHOTOS[n.id] || P.photo;
    var f = lifeOf(P); n.sp = f ? f.id : ''; n.cn = f ? f.cn : ''; n.sci = f ? f.n : ''; n.g = f ? f.g : '';
    n.data = P.catch.data.slice(); n.wishText = P.lines.slice(); n.wish = P.lines.some(Boolean); NG.saveNotes();
    if (!P.revealed && P.r && P.r.sp) { P.revealed = 1; NG.reveal(n, P.r).then(function (seen) { n.seen = seen; NG.saveNotes(); if (S.stage >= 2) redraw(); }); }
    return n;
  }

  /* ───────── the panel: one step at a time, one thing to do in each ───────── */
  var hand = function (cls2, inner, attrs) { return '<button class="au-k ' + (cls2 || '') + '" ' + (attrs || '') + '>' + inner + '</button>'; };
  var grow = function (ta) { if (!ta.offsetParent) return; ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight + 2, 40) + 'px'; };
  var regrow = function () { [].forEach.call(panel.querySelectorAll('textarea'), grow); };
  var ART = function () { return (P && P.photo ? ['photo', 'pixel'] : []).concat(['net', 'sign']); };
  /* W.I.S.H., each letter's sentence, shown only when one looks for it (a pointer on the letter, or the line in hand) */
  var WISH_SAYS = ['Witness: what you saw, where, and when.', 'Intention: what you want for it.', 'Strategy: what will be done, and by whom.', 'Hope: how it ends well, and who helps.'];
  function paint() {
    var s = S.stage, h = '';
    if (s === 0) {
      h = (P && P.photo ? '<figure class="au-ph"><img alt="" src="' + P.photo + '"></figure>' : '') +
        '<label class="au-line' + (P && P.say ? ' has' : '') + '"><span class="au-ask" aria-hidden="true">what have you noticed?</span><textarea id="au-say" rows="1" maxlength="200" aria-label="What have you noticed?" enterkeyhint="next"></textarea></label>';
    } else if (s === 1) {
      /* the four lines are one's own: empty, the letters only */
      var L4 = P ? P.lines : ['', '', '', ''];
      h = '<ol class="au-wish">' + [0, 1, 2, 3].map(function (i) { return '<li><b data-say="' + esc(WISH_SAYS[i]) + '" tabindex="-1">' + 'WISH'[i] + '</b><textarea data-i="' + i + '" rows="1" maxlength="160" aria-label="' + esc(WISH_SAYS[i]) + '" enterkeyhint="next">' + esc(L4[i] || '') + '</textarea></li>'; }).join('') + '</ol>';
    } else if (s === 2) {
      if (ready()) { settle(); var arts = ART(); if (arts.indexOf(P.art) < 0) P.art = arts[0];
        var mine = (NG.icons() || []).slice(-6);
        h = '<div class="au-arts" role="radiogroup">' + arts.map(function (a) { return '<button class="au-art' + (a === P.art ? ' on' : '') + '" data-art="' + a + '" role="radio" aria-checked="' + (a === P.art) + '" aria-label="' + a + '"><canvas></canvas></button>'; }).join('') + '</div>' +
          '<div class="au-tray">' + Object.keys(MARKS).map(function (g) { return '<button data-mark="' + g + '" aria-label="Add a mark: ' + g + '">' + markI(g) + '</button>'; }).join('') +
          '<button data-add="t" aria-label="Add words">' + svgI('text') + '</button>' + mine.map(function (ic, i) { return '<button data-ic="' + i + '" aria-label="Add your icon"><img alt="" src="' + esc(ic.src) + '"></button>'; }).join('') + '</div>' +
          '<figure class="au-poster au-drag"><canvas></canvas><div class="au-sel" hidden><button class="au-rm" aria-label="Take it off">×</button></div></figure>' +
          '<label class="au-tline" hidden><textarea id="au-tx" rows="1" maxlength="90" aria-label="The words"></textarea></label>'; }
    } else {
      h = ready() ? '<figure class="au-poster au-hero"><canvas></canvas></figure>' +
        '<div class="au-press">' + hand('au-sm au-reset', svgI('again'), 'id="au-reset" aria-label="Start again: this piece is let go"') + hand('au-sm', svgI('save'), 'id="au-save" aria-label="Save"') +
        hand('au-big', svgI(P.sent ? 'seed' : 'print'), 'id="au-print" aria-label="' + (P.sent ? 'Begin a new piece' : 'Print') + '"') +
        '<span class="au-pips" id="au-pips">' + (P.sent && P.note && P.note.sent ? NG.pips(P.note.sent.s) : '') + '</span></div>' : wallHTML();
    }
    panel.innerHTML = '<div class="au-in">' + h + '</div>'; wire(s); cls();
  }
  function wire(s) {
    regrow(); [].forEach.call(panel.querySelectorAll('textarea'), function (ta) { ta.addEventListener('input', function () { grow(ta); }); });
    if (s === 0) {
      var ph2 = panel.querySelector('.au-ph'); if (ph2) ph2.addEventListener('click', function () { show([{ src: P.photo }], 0, true); });
      var say = $('#au-say'), tm = 0, lab = say.parentNode; if (P) say.value = P.say || '';
      var keep = function () { var v = say.value.trim(); if (!v && !P) return; piece().say = v; think(); changed(); };
      say.addEventListener('input', function () { lab.classList.toggle('has', !!say.value); clearTimeout(tm); tm = setTimeout(keep, 260); });
      say.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); if (ready()) step(1); } });
    }
    if (s === 1) {
      [].forEach.call(panel.querySelectorAll('textarea[data-i]'), function (ta) { var tm2 = 0, i = +ta.dataset.i;
        var keep = function () { var v = ta.value.trim(); if (!v && !P) return; var p = piece(); p.lines[i] = v; if (p.note) { p.note.wishText = p.lines.slice(); p.note.wish = p.lines.some(Boolean); NG.saveNotes(); } changed(); };
        ta.addEventListener('input', function () { clearTimeout(tm2); tm2 = setTimeout(keep, 250); });
        ta.addEventListener('keydown', function (e) { if (e.key !== 'Enter') return; e.preventDefault(); keep(); bell(i + 1, 0.16); var nx = panel.querySelector('textarea[data-i="' + (i + 1) + '"]'); if (nx) nx.focus(); else if (ready()) step(2); }); });
    }
    if (s === 2 && ready()) {
      [].forEach.call(panel.querySelectorAll('[data-art]'), function (b) { b.addEventListener('click', function () { P.art = b.dataset.art; [].forEach.call(panel.querySelectorAll('[data-art]'), function (o) { o.classList.toggle('on', o === b); o.setAttribute('aria-checked', String(o === b)); }); changed(); redraw(); bell(5, 0.18); }); });
      var add = function (a) { a.x = 0.3 + Math.random() * 0.2; a.y = 0.12 + Math.random() * 0.2; P.adds.push(a); S.sel = 'a' + (P.adds.length - 1); changed(); redraw(); bell(6, 0.18); if (a.k === 't') setTimeout(function () { var t2 = $('#au-tx'); if (t2) t2.focus(); }, 60); };
      [].forEach.call(panel.querySelectorAll('[data-mark]'), function (b) { b.addEventListener('click', function () { add({ k: 's', g: b.dataset.mark }); }); });
      [].forEach.call(panel.querySelectorAll('[data-ic]'), function (b) { b.addEventListener('click', function () { var ic = (NG.icons() || []).slice(-6)[+b.dataset.ic]; if (ic) add({ k: 'i', src: ic.src }); }); });
      panel.querySelector('[data-add="t"]').addEventListener('click', function () { add({ k: 't', t: '' }); });
      var tx = $('#au-tx'); tx.addEventListener('input', function () { var a = selAdd(); if (a && a.k === 't') { a.t = tx.value; changed(); redraw(); } });
      panel.querySelector('.au-rm').addEventListener('click', function (e) { e.stopPropagation(); takeOff(S.sel); });
      thumbs(); redraw(); dragWire();
    }
    if (s === 3) {
      if (!ready()) { wallWire(); return; }
      redraw();
      $('#au-print').addEventListener('click', function () { if (P.sent) { letGo(); return; } printNow(); });
      $('#au-save').addEventListener('click', function () { poster(P, P.art).then(function (c) { NG.download(c, 'novel-global-' + ((P.note && P.note.code) || 'piece') + '.png'); bell(3, 0.18); }); });
      NG.sureTap($('#au-reset'), function () { letGo(); });
      panel.querySelector('.au-hero').addEventListener('click', function () { var c = panel.querySelector('.au-hero canvas'); show([{ src: c.toDataURL('image/jpeg', 0.9) }], 0, true); });
    }
  }
  /* the piece let go: a new one begins at the eye. What was printed stays on the wall */
  function letGo() { P = null; S.sel = null; draftSave(null); step(0); if (S.stage === 0) paint(); bell(0, 0.24); }
  /* the art: each way of drawing it shown as itself, small; the poster below; what is caught or added, placed, taken off, rewritten by hand */
  function thumbs() { [].forEach.call(panel.querySelectorAll('[data-art]'), function (b) { var c = artOf(P, b.dataset.art, 120, 120), t = b.querySelector('canvas'); t.width = c.width; t.height = c.height; t.getContext('2d').drawImage(c, 0, 0); }); }
  var lastBoxes = {}, artRaf = 0;
  var selAdd = function () { return S.sel && S.sel.charAt(0) === 'a' && S.sel.length > 1 && P.adds ? P.adds[+S.sel.slice(1)] : null; };
  function redraw() {
    if (!P) return; var sel = S.stage === 2 ? '.au-drag canvas' : '.au-hero canvas', f = panel.querySelector(sel); if (!f) return;
    var go2 = function () { fontReady().then(function () { var g = panel.querySelector(sel); if (!g || !P) return; var o = posterNow(P, P.art); lastBoxes = o.boxes; g.width = o.c.width; g.height = o.c.height; g.getContext('2d').drawImage(o.c, 0, 0); selBox(); }); };
    if (P.photo && !P.img) NG.loadImg(P.photo).then(function (im) { P.img = im; P._base = null; go2(); }).catch(go2); else go2();
  }
  api.redraw = function () { redraw(); };
  /* the chosen thing, outlined where it lies, with its × on its corner; words open their line to be rewritten */
  function selBox() {
    var box = panel.querySelector('.au-sel'), c = panel.querySelector('.au-drag canvas'), tl = panel.querySelector('.au-tline'); if (!box || !c) return;
    var b = S.sel && lastBoxes[S.sel]; if (!b) { box.hidden = true; if (tl) tl.hidden = true; return; }
    var r = c.getBoundingClientRect(), fr = c.parentNode.getBoundingClientRect(), k = r.width / c.width;
    box.hidden = false; box.style.left = (r.left - fr.left + b[0] * k - 4) + 'px'; box.style.top = (r.top - fr.top + b[1] * k - 4) + 'px'; box.style.width = (b[2] * k + 8) + 'px'; box.style.height = (b[3] * k + 8) + 'px';
    var a = selAdd(); if (tl) { tl.hidden = !(a && a.k === 't'); var tx = $('#au-tx'); if (a && a.k === 't' && tx && document.activeElement !== tx) tx.value = a.t || ''; }
  }
  function takeOff(k) {
    if (!k || !P) return; if (k.charAt(0) === 'a' && k.length > 1) P.adds.splice(+k.slice(1), 1);
    else if (k === 'map') P.catch.map = false; else if (k === 'life') { P.catch.life = ''; think(); } else if (k === 'data') P.catch.data = []; else if (k === 'nino') P.catch.nino = false;
    delete P.pos[k]; S.sel = null; changed(); redraw(); bell(1, 0.16); fillDots();
  }
  function dragWire() {
    var c = panel.querySelector('.au-drag canvas'), hold = null;
    var at = function (e) { var r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
    var hit = function (p) { var k = null; Object.keys(lastBoxes).forEach(function (q) { var b = lastBoxes[q]; if (p[0] >= b[0] && p[0] <= b[0] + b[2] && p[1] >= b[1] && p[1] <= b[1] + b[3]) k = q; }); return k; };
    c.addEventListener('pointerdown', function (e) { var p = at(e), k = hit(p);
      if (!k) { if (S.sel) { S.sel = null; selBox(); } return; }
      e.preventDefault(); hold = { k: k, dx: p[0] - lastBoxes[k][0], dy: p[1] - lastBoxes[k][1], moved: 0, x0: e.clientX, y0: e.clientY }; S.sel = k; selBox(); try { c.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } c.classList.add('holding'); });
    c.addEventListener('pointermove', function (e) {
      var p = at(e); if (!hold) { c.style.cursor = hit(p) ? 'grab' : ''; return; }
      hold.moved = Math.max(hold.moved, Math.abs(e.clientX - hold.x0) + Math.abs(e.clientY - hold.y0));
      var b = lastBoxes[hold.k], W = c.width, H = c.height, nx = Math.max(0, Math.min(W - b[2], p[0] - hold.dx)) / W, ny = Math.max(0, Math.min(H - b[3], p[1] - hold.dy)) / H;
      if (hold.k.charAt(0) === 'a' && hold.k.length > 1) { var a = P.adds[+hold.k.slice(1)]; a.x = nx; a.y = ny; } else P.pos[hold.k] = [nx, ny];
      if (!artRaf) artRaf = requestAnimationFrame(function () { artRaf = 0; redraw(); }); });
    var up = function () { if (!hold) return; var mv = hold.moved; hold = null; c.classList.remove('holding'); if (mv > 4) { changed(); bell(2, 0.14); } else { var a = selAdd(); if (a && a.k === 't') { var tx = $('#au-tx'); if (tx) tx.focus(); } } };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  }
  /* print: the receipt for the thermal head (the base's own, its photograph through the print pipeline), the poster kept in colour on the wall.
     Printed again after a change, it takes the same place on the wall */
  function printNow() {
    var n = settle(); if (!n) return; var btn = $('#au-print'), st = $('#au-pips'); btn.disabled = true; btn.classList.add('going'); st.innerHTML = NG.pips('sending');
    var art = P.art === 'pixel' && !P.photo ? 'net' : P.art, photo = NG.PHOTOS[n.id] || P.photo || '', show2 = { line: 1, life: !!P.catch.life, facts: 0, links: 0, code: 1 };
    NG.printers().then(function (list) {
      var ps = list.filter(function (p) { return p.paired || p.id === (B.master && B.master.id); }), dest = ps.length ? ps[0].id : (B.master ? B.master.id : 'novelglobal'), paper2 = ps.length ? ps[0].paper : (B.master && B.master.paper) || 80;
      var Pp = (B.printers || {})[String(paper2 || 80)] || { dots: 512 }, W = Pp.dots - Pp.dots % 8;
      return NG.slip(n, photo, P.r, { art: art, wish: n.wish, show: show2 }, W).then(function (c) { return NG.sendNote(n, c, dest, n.wish); });
    }).then(function (s) {
      st.innerHTML = NG.pips(s); btn.classList.remove('going'); S.sting = performance.now() / 1000; if (n.sent && n.sent.id) NG.follow(n, st); harp([0, 2, 4, 7]);
      return poster(P, P.art).then(function (c) {
        var item = { id: P.folioId || 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), src: c.toDataURL('image/jpeg', 0.86), cap: titleOf(P), code: n.code };
        P.folioId = item.id; P.sent = 1; item.piece = pack(P); folioKeep(item); draftSave(pack(P));
        btn.disabled = false; btn.innerHTML = svgI('seed'); btn.setAttribute('aria-label', 'Begin a new piece');
        var hero = panel.querySelector('.au-hero'); if (hero) hero.classList.add('kept');
        setTimeout(function () { if (S.stage === 3) show(slides(), slides().map(function (q) { return q.id; }).indexOf(item.id)); }, 1100);
      });
    }).catch(function () { st.innerHTML = NG.pips('failed'); btn.disabled = false; btn.classList.remove('going'); });
  }
  /* the wall, when nothing is being made: one finished piece at a time, whole; brought back to be worked on, or taken down */
  var WALL = 0;
  function wallHTML() {
    var all = slides(); if (!all.length) return ''; WALL = Math.min(WALL, all.length - 1); var f = all[WALL];
    return '<figure class="au-poster au-wall"><img alt="" src="' + f.src + '"></figure><div class="au-press">' +
      (all.length > 1 ? hand('au-sm au-nav', '‹', 'data-w="-1" aria-label="Before"') : '') +
      (f.piece ? hand('au-big', svgI('back'), 'id="au-bring" aria-label="Bring it back to work on"') : '') +
      (FOLIO.some(function (q) { return q.id === f.id; }) ? hand('au-sm', svgI('bin'), 'id="au-drop" aria-label="Take it down"') : '') +
      (all.length > 1 ? hand('au-sm au-nav', '›', 'data-w="1" aria-label="After"') : '') + '</div>' +
      (all.length > 1 ? '<nav class="au-wdots">' + all.map(function (q, i) { return '<i class="' + (i === WALL ? 'on' : '') + '"></i>'; }).join('') + '</nav>' : '');
  }
  function wallWire() {
    var all = slides(), f = all[WALL]; if (!f) return;
    [].forEach.call(panel.querySelectorAll('[data-w]'), function (b) { b.addEventListener('click', function () { WALL = (WALL + (+b.dataset.w) + all.length) % all.length; paint(); bell(2, 0.14); }); });
    panel.querySelector('.au-wall').addEventListener('click', function () { show(slides(), WALL); });
    var br = $('#au-bring'); if (br) br.addEventListener('click', function () { P = unpack(f.piece); P.sent = 1; think(); draftSave(pack(P)); bell(5, 0.22); step(2); });
    var dr = $('#au-drop'); if (dr) NG.sureTap(dr, function () { folioDrop(f.id).then(function () { WALL = Math.max(0, WALL - 1); paint(); }); bell(1, 0.16); });
  }

  /* ───────── the slideshow: each picture whole, never cropped; pinched, wheeled or double-tapped to look closer. The close sits on it ───────── */
  var SH = { list: [], i: 0, pz: null, timer: 0, one: false };
  var img = showEl.querySelector('img'), pzEl = showEl.querySelector('.au-pz'), xBtn = showEl.querySelector('.au-x');
  function show(list, i, one) {
    if (!list.length) return; SH.list = list; SH.one = !!one; showEl.hidden = false; root.classList.add('showing'); slide(Math.max(0, i || 0));
    if (!SH.pz && window.Panzoom) { SH.pz = window.Panzoom(pzEl, { maxScale: 8, minScale: 1, contain: 'outside', panOnlyWhenZoomed: true, cursor: 'default' }); showEl.addEventListener('wheel', function (e) { SH.pz.zoomWithWheel(e); }, { passive: false }); pzEl.addEventListener('panzoomchange', pinX); }
    play(); xBtn.focus();
  }
  /* the close on the picture's own corner, kept on the screen */
  function pinX() {
    var r = img.getBoundingClientRect(); if (!r.width) return; var X = Math.min(innerWidth - 50, Math.max(6, r.right - 24)), Y = Math.min(innerHeight - 50, Math.max(6, r.top - 20));
    xBtn.style.transform = 'translate(' + X.toFixed(0) + 'px,' + Y.toFixed(0) + 'px)';
  }
  function slide(i) {
    var n = SH.list.length; SH.i = (i + n) % n; var f = SH.list[SH.i]; img.onload = pinX; img.src = f.src;
    if (SH.pz) SH.pz.reset({ animate: false });
    showEl.querySelector('.au-dots').innerHTML = SH.one ? '' : SH.list.map(function (q, k) { return '<button data-k="' + k + '" class="' + (k === SH.i ? 'on' : '') + '" aria-label="' + (k + 1) + '"></button>'; }).join('');
    [].forEach.call(showEl.querySelectorAll('.au-dots button'), function (b) { b.addEventListener('click', function () { slide(+b.dataset.k); play(); }); });
    showEl.classList.toggle('one', SH.one || n < 2); setTimeout(pinX, 30);
  }
  function play() { clearInterval(SH.timer); if (SH.one || SH.list.length < 2 || still) return; SH.timer = setInterval(function () { if (SH.pz && SH.pz.getScale() > 1.01) return; slide(SH.i + 1); }, 6500); }
  function unshow() { clearInterval(SH.timer); showEl.hidden = true; root.classList.remove('showing'); }
  showEl.querySelector('.au-prev').addEventListener('click', function () { slide(SH.i - 1); play(); });
  showEl.querySelector('.au-next2').addEventListener('click', function () { slide(SH.i + 1); play(); });
  xBtn.addEventListener('click', unshow);
  /* a touch on the paper round the picture closes it too */
  showEl.querySelector('.au-sl').addEventListener('click', function (e) { if (e.target === img || (SH.pz && SH.pz.getScale() > 1.01)) return; unshow(); });
  /* a double tap (or a double click) looks closer, or back; a swipe turns the page. Taps are read here, so a phone's own double tap is caught too */
  var sx0 = null, lastTap = null;
  var twice = function (e) { if (!SH.pz) return; if (SH.pz.getScale() > 1.01) SH.pz.reset(); else SH.pz.zoomToPoint(2.6, { clientX: e.clientX, clientY: e.clientY }); setTimeout(pinX, 260); };
  pzEl.addEventListener('pointerdown', function (e) { sx0 = (SH.pz && SH.pz.getScale() > 1.01) ? null : [e.clientX, e.clientY]; });
  pzEl.addEventListener('pointerup', function (e) {
    var now = Date.now(); if (lastTap && now - lastTap[0] < 320 && Math.hypot(e.clientX - lastTap[1], e.clientY - lastTap[2]) < 30) { lastTap = null; sx0 = null; twice(e); return; } lastTap = [now, e.clientX, e.clientY];
    if (!sx0) return; var dx = e.clientX - sx0[0]; if (Math.abs(dx) > 50 && Math.abs(e.clientY - sx0[1]) < 60) { slide(SH.i + (dx < 0 ? 1 : -1)); play(); } sx0 = null; });
  document.addEventListener('keydown', function (e) { if (showEl.hidden) { if (e.key === 'Escape' && S.deep) closeDeep(); return; } if (e.key === 'ArrowRight') slide(SH.i + 1); else if (e.key === 'ArrowLeft') slide(SH.i - 1); else if (e.key === 'Escape') unshow(); });

  /* ───────── the catch: the one thing it holds. The ground, the life, the readings, El Niño, all in one place, with no words over
     them; whatever is touched is caught onto the piece, and only that ever shows ───────── */
  var MAPV = { z: 16, lat: 0, lng: 0, draw: null };
  function openDeep() {
    if (S.stage === 3) return; S.deep = true; deep.hidden = false; cls(); var p = piece(); think();
    deep.innerHTML = '<button class="au-back" id="au-dx" aria-label="Back"><i></i></button>' +
      '<div class="au-c"><div class="au-cmap' + (p.catch.map ? ' on' : '') + '" id="au-cmap"><div class="au-map" id="au-map"><div class="au-tiles"></div><canvas></canvas></div></div>' +
      '<label class="au-find"><svg class="au-i" viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="13" r="8"/><path d="M19 19l8 8"/></svg><input id="au-q" type="search" autocomplete="off" aria-label="Find a life"></label><ul class="au-names" id="au-names"></ul>' +
      '<ul class="au-vals" id="au-vals"></ul><button class="au-nino" id="au-nino" aria-pressed="' + !!p.catch.nino + '"></button></div>';
    $('#au-dx').addEventListener('click', closeDeep);
    lens(); NG.db().then(function () { think(); fill(); }); fill();
    $('#au-q').addEventListener('input', fill);
  }
  function closeDeep() { S.deep = false; deep.hidden = true; deep.innerHTML = ''; cls(); paint(); }
  var ping = function (on) { bell(on ? 6 : 1, 0.18); changed(); fillDots(); };
  var fillDots = function () { catchK.querySelector('b').textContent = P ? '••••'.slice(0, caught(P).length) : ''; };
  function fill() {
    if (!S.deep || !P) return;
    /* the lives: never offered. Only one already caught, one named in one's own words, or one found by name. Names alone */
    var D = NG.DB(), seen = {}, rows = [], add = function (f) { if (f && !seen[f.id]) { seen[f.id] = 1; rows.push(f); } };
    var said = (P.say + ' ' + P.lines.join(' ')).toLowerCase(), q = (($('#au-q') || {}).value || '').trim().toLowerCase();
    if (P.catch.life) add(lifeOf(P));
    if (D) D.field.forEach(function (f) { var cn = f.cn.toLowerCase(); if (said.indexOf(cn) >= 0 || (q.length > 1 && (cn.indexOf(q) >= 0 || String(f.n || '').toLowerCase().indexOf(q) >= 0))) add(f); });
    var ul = $('#au-names'); ul.innerHTML = rows.slice(0, 8).map(function (f) { return '<li><button data-sp="' + esc(f.id) + '" aria-pressed="' + (P.catch.life === f.id) + '" class="' + (P.catch.life === f.id ? 'on' : '') + '">' + esc(f.cn) + '</button></li>'; }).join('');
    [].forEach.call(ul.querySelectorAll('[data-sp]'), function (b) { b.addEventListener('click', function () { var on = P.catch.life !== b.dataset.sp; P.catch.life = on ? b.dataset.sp : ''; P.revealed = 0; think(); fill(); ping(on); }); });
    /* the readings: each a value alone */
    var vals = [NG.when(P.at)].concat(NG.context(P).filter(function (d) { return !/NIÑO/.test(d); }).map(function (d) { return d.toLowerCase(); }));
    var uv = $('#au-vals'); uv.innerHTML = vals.map(function (v) { var on = P.catch.data.indexOf(v) >= 0; return '<li><button data-v="' + esc(v) + '" aria-pressed="' + on + '" class="' + (on ? 'on' : '') + '">' + esc(v) + '</button></li>'; }).join('');
    [].forEach.call(uv.querySelectorAll('[data-v]'), function (b) { b.addEventListener('click', function () { var v = b.dataset.v, i = P.catch.data.indexOf(v), on = i < 0; if (on) P.catch.data.push(v); else P.catch.data.splice(i, 1); P.dirty = true; fill(); ping(on); }); });
    /* El Niño: the reading now and its year as a line */
    var nb = $('#au-nino'), v2 = ninoVals(), spark = '';
    if (v2) { var mx = Math.max(1, Math.max.apply(null, v2)), O = D.outlook, i0 = (new Date().getFullYear() - O.start[0]) * 12 + new Date().getMonth() - O.start[1], w = 300, h = 70;
      var pts = v2.map(function (q2, i) { return [10 + i * (w - 20) / Math.max(1, v2.length - 1), h - 10 - (q2 / mx) * (h - 24)]; });
      spark = '<svg class="au-spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + '"/>' + pts.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === i0 ? 4.5 : 2) + '" class="' + (i === i0 ? 'f now' : 'f') + '"/>'; }).join('') + '</svg>'; }
    nb.innerHTML = (ninoNow() ? '<b>Niño 3.4 ' + esc(ninoNow()) + '</b>' : '') + spark; nb.hidden = !ninoNow(); nb.classList.toggle('on', !!P.catch.nino); nb.setAttribute('aria-pressed', String(!!P.catch.nino));
    if (!nb.__w) { nb.__w = 1; nb.addEventListener('click', function () { P.catch.nino = !P.catch.nino; fill(); ping(P.catch.nino); }); }
    var cm = $('#au-cmap'); if (cm) cm.classList.toggle('on', !!P.catch.map);
    fillDots();
  }
  /* the map, as a lens: the ground in blueprint (its own photograph taken down to the paper's blue). A touch puts the piece there and catches the map */
  function lens() {
    var el = $('#au-map'), tl = el.querySelector('.au-tiles'), c = el.querySelector('canvas'), g = c.getContext('2d'), p = P;
    MAPV.lat = p.lat; MAPV.lng = p.lng; MAPV.z = 16;
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
      NG.notes().forEach(function (q) { if (!isFinite(q.lat)) return; var s = at(q.lat, q.lng); g.globalAlpha = 0.6; g.beginPath(); g.arc(s[0], s[1], 3, 0, 7); g.fill(); });
      var s0 = at(p.lat, p.lng); ((p.note && p.note.seen) || []).forEach(function (q) { var s = at(q.lat, q.lng); g.globalAlpha = 0.5; g.setLineDash([2, 5]); g.beginPath(); g.moveTo(s0[0], s0[1]); g.lineTo(s[0], s[1]); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(s[0], s[1], 2.6, 0, 7); g.fill(); });
      g.globalAlpha = 1; g.lineWidth = 1.4; g.beginPath(); g.arc(s0[0], s0[1], 9, Math.PI, 0); g.closePath(); g.stroke();
      for (var i = 0; i < 4; i++) for (var j = 1; j < 5; j++) { g.beginPath(); g.arc(s0[0] - 6 + i * 4, s0[1] + j * 4, 1, 0, 7); g.fill(); }
    }
    MAPV.draw = draw; draw(); setTimeout(draw, 60);
    var drag = null, moved = 0;
    el.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY, wx(MAPV.lng, MAPV.z), wy(MAPV.lat, MAPV.z)]; moved = 0; try { el.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } });
    el.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag[0], dy = e.clientY - drag[1]; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); MAPV.lng = ux(drag[2] - dx, MAPV.z); MAPV.lat = uy(drag[3] - dy, MAPV.z); draw(); });
    el.addEventListener('pointerup', function (e) {
      if (drag && moved < 6) { var r = el.getBoundingClientRect(), X = wx(MAPV.lng, MAPV.z) + (e.clientX - r.left - el.clientWidth / 2), Y = wy(MAPV.lat, MAPV.z) + (e.clientY - r.top - el.clientHeight / 2);
        p.lat = uy(Y, MAPV.z); p.lng = ux(X, MAPV.z); p.src = 'TAP'; p.catch.map = true; think(); if (p.note) { p.note.lat = +p.lat.toFixed(5); p.note.lng = +p.lng.toFixed(5); NG.saveNotes(); } draw(); fill(); ping(true); }
      drag = null; });
    el.addEventListener('wheel', function (e) { e.preventDefault(); MAPV.z = Math.max(12, Math.min(B.maxzoom || 19, MAPV.z + (e.deltaY < 0 ? 1 : -1))); draw(); }, { passive: false });
    el.addEventListener('dblclick', function (e) { e.preventDefault(); p.catch.map = !p.catch.map; fill(); ping(p.catch.map); });
  }

  /* ───────── asleep under the base's pages, awake on the paper ───────── */
  api.sleep = function () { asleep = true; root.hidden = true; humSet(false); };
  api.wake = function () { if (location.hash) return; asleep = false; root.hidden = false; humSet(S.mode !== 'seed'); go(); };
  api.state = function () { return { mode: S.mode, stage: S.stage, deep: S.deep, sel: S.sel || null, piece: P ? { say: P.say, photo: !!P.photo, eye: !!P.eye, art: P.art, lines: P.lines, code: P.note && P.note.code, sent: !!P.sent, caught: caught(P), pos: P.pos, adds: P.adds, cn: P.note ? P.note.cn : '', folioId: P.folioId || '' } : null, form: FORM.key, frames: S.frames || 0, folio: slides().length, zoom: SH.pz ? SH.pz.getScale() : 1, hum: window.__auraHum || 0, pf: !!PF, noise: !!N3 }; };
  api.go = function (m, s) { if (m === 'globe') { if (S.mode === 'seed') bang(); setMode('globe'); } if (m === 'iruk') { setMode('globe'); toIruk(s || 0); } };
  addEventListener('resize', function () { layout(); if (MAPV.draw && S.deep) MAPV.draw(); if (!showEl.hidden) pinX(); selBox(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) go(); });
  addEventListener('hashchange', function () { if (location.hash) api.sleep(); });
  layout(); setMode('seed'); paint();
  /* the piece one was making comes back with one */
  draftLoad().then(function (o) { if (o && !P) { P = unpack(o); think(); fillDots(); paint(); } });
  if (location.hash) api.sleep(); else go();
  fontReady();
})();
