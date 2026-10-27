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

  /* ───────── the colour poster: the picture in full on blueprint paper (or white paper, the ink turned to the blue), the life, the
     four lines, what was caught and what was added, each placed, turned, sized and toned by hand; a small code back to the site ───────── */
  var FONT = '"Architects Daughter", "Comic Sans MS", "Bradley Hand", cursive';
  var fontP = null;
  function fontReady() { if (!fontP) fontP = (document.fonts && document.fonts.load ? Promise.all(['26px "Architects Daughter"', '900 26px Fraunces', '600 26px "Archivo Narrow"'].map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve()).then(function () { STAMPC = {}; STAMPT = {}; return true; }); return fontP; }
  /* the pen and the paper: blue paper and white ink, or white paper and blue ink */
  var PEN = '244,241,232', BACK = '23,69,127', WHITE = false;
  function usePaper(white) { WHITE = !!white; PEN = white ? '23,69,127' : '244,241,232'; BACK = white ? '247,245,238' : '23,69,127'; }
  var ink = function (a) { return 'rgba(' + PEN + ',' + (a == null ? 1 : a) + ')'; }, back = function (a) { return 'rgba(' + BACK + ',' + (a == null ? 1 : a) + ')'; };
  var grainC = null;
  function grain() {
    if (grainC) return grainC; grainC = document.createElement('canvas'); grainC.width = grainC.height = 160; var g = grainC.getContext('2d'), im = g.createImageData(160, 160), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var v = Math.random(); d[i] = d[i + 1] = d[i + 2] = 128; d[i + 3] = v > 0.5 ? (v - 0.5) * 30 : 0; }
    g.putImageData(im, 0, 0); return grainC;
  }
  function paper(x, W, H) {
    x.fillStyle = back(); x.fillRect(0, 0, W, H); x.fillStyle = x.createPattern(grain(), 'repeat'); x.fillRect(0, 0, W, H);
    var v = x.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.8); v.addColorStop(0, 'rgba(6,24,52,0)'); v.addColorStop(1, WHITE ? 'rgba(6,24,52,.06)' : 'rgba(6,24,52,.34)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
  }
  /* a line as a hand draws it: a little off its course, and a faint second pass */
  function handLine(x, pts, w, a, seed) {
    seed = seed || 1; var j = function (i, k) { return Math.sin(seed * 12.9898 + i * 78.233 + k) * 0.9; };
    [0, 1].forEach(function (pass) {
      x.beginPath(); pts.forEach(function (p, i) { var px = p[0] + j(i, pass) * (pass ? 1.2 : 0.5), py = p[1] + j(i, pass + 3) * (pass ? 1.2 : 0.5); if (i) x.lineTo(px, py); else x.moveTo(px, py); });
      x.lineWidth = pass ? w * 0.5 : w; x.strokeStyle = ink(pass ? a * 0.3 : a); x.lineCap = x.lineJoin = 'round'; x.stroke();
    });
  }
  function handRect(x, X, Y, w, h, lw, a, seed) { var pts = [], s = 10; var push = function (x0, y0, x1, y1) { for (var i = 0; i <= s; i++) pts.push([x0 + (x1 - x0) * i / s, y0 + (y1 - y0) * i / s]); };
    push(X, Y, X + w, Y); push(X + w, Y, X + w, Y + h); push(X + w, Y + h, X, Y + h); push(X, Y + h, X, Y - 3); handLine(x, pts, lw, a, seed); }
  function handCircle(x, cx, cy, r, lw, a, seed) { var pts = []; for (var i = 0; i <= 44; i++) { var t = i / 40 * Math.PI * 2; pts.push([cx + Math.cos(t) * r * (1 + 0.01 * Math.sin(t * 3 + seed)), cy + Math.sin(t) * r * (1 + 0.01 * Math.cos(t * 2 + seed))]); } handLine(x, pts, lw, a, seed); }
  function wrap(x, t, w) { var out = [], line = ''; String(t || '').split(/\s+/).forEach(function (wd) { var tr = line ? line + ' ' + wd : wd; if (x.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; }); if (line) out.push(line); return out; }
  function irukMark(x, cx, cy, s, a) {
    x.save(); x.strokeStyle = ink(a); x.fillStyle = ink(a); x.lineWidth = Math.max(1, s * 0.07); x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx - s * 0.5, cy + s * 0.2); x.bezierCurveTo(cx - s * 0.55, cy - s * 0.75, cx + s * 0.55, cy - s * 0.75, cx + s * 0.5, cy + s * 0.2); x.closePath(); x.stroke();
    for (var i = 0; i < 4; i++) { var tx = cx - s * 0.36 + i * s * 0.24; for (var k = 1; k < 6; k++) { x.beginPath(); x.arc(tx + Math.sin(k + i) * s * 0.04, cy + s * 0.22 + k * s * 0.17, s * 0.035, 0, 7); x.fill(); } }
    x.restore();
  }
  /* what a piece has caught: only what was chosen ever shows. The life, the data, El Niño and the map are each opt-in */
  var lifeOf = function (P) { var D = NG.DB(); return P.catch && P.catch.life && D ? D.field.filter(function (f) { return f.id === P.catch.life; })[0] || null : null; };
  var titleOf = function (P) { return P.say || (P.lines || []).filter(Boolean)[0] || ''; };
  function ninoVals() { var D = NG.DB(), O = D && D.outlook; if (!O || !O.nino) return null; return O.nino.map(function (v) { var m = String(v).match(/-?\d+(\.\d+)?/); return m ? +m[0] : 0; }); }
  var ninoNow = function () { var o = NG.outlookNow(); return o && o.nino ? String(o.nino).replace(/ ?(OBS|PEAK)/, '').replace('≈', '') : ''; };
  /* the picture: one's own photograph, else the life's own (from iNaturalist, credited); toned by hand: as it is, stronger, in one ink, warm */
  var picOf = function (P) { return P.img || P.spImg || null; };
  var TONES = ['as', 'strong', 'ink', 'warm'];
  function artOf(P, aw, maxH) {
    var im = picOf(P); if (!im) return null; var c = document.createElement('canvas'), g = c.getContext('2d');
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.min(aw / iw, maxH / ih); c.width = Math.round(iw * k); c.height = Math.round(ih * k);
    g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height);
    var tone = P.ptone || 'as'; if (tone !== 'as') { var id = g.getImageData(0, 0, c.width, c.height), d = id.data, inkc = PEN.split(',').map(Number), bk = BACK.split(',').map(Number);
      for (var i = 0; i < d.length; i += 4) { var r = d[i], gg = d[i + 1], b = d[i + 2], l = 0.299 * r + 0.587 * gg + 0.114 * b;
        if (tone === 'strong') { d[i] = Math.max(0, Math.min(255, (r - 128) * 1.45 + 128)); d[i + 1] = Math.max(0, Math.min(255, (gg - 128) * 1.45 + 128)); d[i + 2] = Math.max(0, Math.min(255, (b - 128) * 1.45 + 128)); }
        else if (tone === 'ink') { var q = Math.max(0, Math.min(1, (l - 40) / 170)); d[i] = bk[0] + (inkc[0] - bk[0]) * q; d[i + 1] = bk[1] + (inkc[1] - bk[1]) * q; d[i + 2] = bk[2] + (inkc[2] - bk[2]) * q; }
        else if (tone === 'warm') { d[i] = Math.min(255, r * 1.08 + 12); d[i + 1] = Math.min(255, gg * 1.02 + 4); d[i + 2] = b * 0.86; } }
      g.putImageData(id, 0, 0); }
    return c;
  }
  /* the pixel irukandji: the creature in cells, its bell breathing and its four tentacles in the current. Ink, blue, or the photograph's own colours */
  function pixJelly(cells, ph, tone, im) {
    var n = cells, c = document.createElement('canvas'); c.width = c.height = n; var g = c.getContext('2d'), cx = (n - 1) / 2, bw = n * 0.36 * (1 - 0.08 * Math.sin(ph)), bh = n * 0.26, top = n * 0.12, cols = null;
    if (tone === 'photo' && im) { var s = document.createElement('canvas'); s.width = s.height = n; var sx = s.getContext('2d'); var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, m = Math.min(iw, ih); sx.drawImage(im, (iw - m) / 2, (ih - m) / 2, m, m, 0, 0, n, n); cols = sx.getImageData(0, 0, n, n).data; }
    var put = function (px, py, a) { px = Math.round(px); py = Math.round(py); if (px < 0 || py < 0 || px >= n || py >= n) return; var i = (py * n + px) * 4;
      g.fillStyle = cols ? 'rgba(' + cols[i] + ',' + cols[i + 1] + ',' + cols[i + 2] + ',' + a + ')' : tone === 'blue' ? 'rgba(23,69,127,' + a + ')' : 'rgba(244,241,232,' + a + ')'; g.fillRect(px, py, 1, 1); };
    for (var y = 0; y <= bh; y++) { var half = bw * Math.sqrt(Math.max(0, 1 - Math.pow((bh - y) / bh, 2))); for (var xx = -half; xx <= half; xx++) { var edge = Math.abs(Math.abs(xx) - half) < 1 || y === Math.round(bh) || y === 0; put(cx + xx, top + y, edge ? 1 : 0.35); } }
    put(cx - bw * 0.35, top + bh * 0.6, 1); put(cx + bw * 0.35, top + bh * 0.6, 1); put(cx, top + bh * 0.45, 1);
    for (var t = 0; t < 4; t++) { var x0 = cx - bw * 0.75 + t * bw * 0.5; for (var k2 = 1; k2 < n - top - bh - 1; k2++) { var sw = Math.sin(ph * 1.3 + k2 * 0.45 + t) * (k2 / n) * n * 0.12; put(x0 + sw, top + bh + k2, k2 % 3 === 0 ? 1 : 0.6); } }
    return c;
  }  /* the pixel things beside it, after a table of found things (a box of paperclips kept on their notes, litter from a beach, coral and shells):
     each one handmade in a few cells, a little off true, and moved by the same current. Coral grows from the floor and sways; litter is
     whatever the tide brings (a ring pull, a cap, a pin, a blister pack, a crushed can, a length of chain); paperclips come in their shapes */
  var PIX_SUBS = ['jelly', 'coral', 'trash', 'clip'];
  var PIX_COL = { coral: ['232,130,111', '242,184,160', '217,83,79', '246,224,200'], trash: ['201,204,209', '215,180,90', '154,163,173', '228,230,234'], clip: ['233,75,60', '47,111,214', '242,194,48', '41,163,106', '236,111,166', '244,241,232', '60,60,60'] };
  function pixArt(sub, cells, ph, tone, im, seed) {
    if (!sub || sub === 'jelly') return pixJelly(cells, ph, tone, im);
    var n = cells, c = document.createElement('canvas'); c.width = c.height = n; var g = c.getContext('2d'), rr = rnd((seed || 1) * 13 + n), cols = null;
    if (tone === 'photo' && im) { var s = document.createElement('canvas'); s.width = s.height = n; var sx = s.getContext('2d'); var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, m = Math.min(iw, ih); sx.drawImage(im, (iw - m) / 2, (ih - m) / 2, m, m, 0, 0, n, n); cols = sx.getImageData(0, 0, n, n).data; }
    var pal = PIX_COL[sub], pick = pal[Math.floor(rr() * pal.length)];
    var col = function (px, py, a, k) { if (cols) { var i = (py * n + px) * 4; return 'rgba(' + cols[i] + ',' + cols[i + 1] + ',' + cols[i + 2] + ',' + a + ')'; }
      return 'rgba(' + (tone === 'blue' ? '23,69,127' : tone === 'colour' ? (k != null ? pal[k % pal.length] : pick) : '244,241,232') + ',' + a + ')'; };
    var put = function (px, py, a, k) { px = Math.round(px); py = Math.round(py); if (px < 0 || py < 0 || px >= n || py >= n) return; g.fillStyle = col(px, py, a == null ? 1 : a, k); g.fillRect(px, py, 1, 1); };
    /* a line as a hand sets it in cells: walked a cell at a time, nudged off true now and then */
    var line = function (x0, y0, x1, y1, a, k) { var d = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (var i = 0; i <= d; i++) { var t = i / d; put(x0 + (x1 - x0) * t + (rr() < 0.08 ? (rr() < 0.5 ? -0.6 : 0.6) : 0), y0 + (y1 - y0) * t, a, k); } };
    var poly = function (pts, closed, a, k) { for (var i = 0; i < pts.length - (closed ? 0 : 1); i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; line(p[0], p[1], q[0], q[1], a, k); } };
    var cx = (n - 1) / 2, cy = (n - 1) / 2, sw = Math.sin(ph), turn = 0.08 * sw, bob = Math.sin(ph * 0.7) * n * 0.03;
    var R = function (p) { var dx = p[0] - cx, dy = p[1] - cy; return [cx + dx * Math.cos(turn) - dy * Math.sin(turn), cy + bob + dx * Math.sin(turn) + dy * Math.cos(turn)]; };
    var oval = function (ox, oy, rx, ry, steps) { var o = []; for (var i = 0; i < (steps || 18); i++) { var t = i / (steps || 18) * Math.PI * 2; o.push([ox + Math.cos(t) * rx * (1 + (rr() - 0.5) * 0.08), oy + Math.sin(t) * ry * (1 + (rr() - 0.5) * 0.08)]); } return o; };
    if (sub === 'coral') {
      /* a branching coral from the floor: forks narrowing to polyps, swaying more the higher it is */
      var grow = function (x0, y0, ang, len, depth) {
        var a2 = ang + Math.sin(ph + depth * 0.9) * 0.12 * depth, x1 = x0 + Math.cos(a2) * len, y1 = y0 + Math.sin(a2) * len;
        line(x0, y0, x1, y1, 1, depth); if (depth < 2) line(x0 + 1, y0, x1 + 1, y1, 0.8, depth);
        if (depth >= 3 || len < 2.5) { put(x1, y1 - 1, 1, 2); put(x1 - 1, y1, 0.7, 2); put(x1 + 1, y1, 0.7, 2); return; }
        var k = 2 + (depth === 0 && rr() < 0.5 ? 1 : 0); for (var i = 0; i < k; i++) { var aa = a2 + (i - (k - 1) / 2) * (0.75 + rr() * 0.35); aa += (-Math.PI / 2 - aa) * 0.12; grow(x1, y1, aa, len * (0.7 + rr() * 0.2), depth + 1); }
      };
      grow(cx + (rr() - 0.5) * 2, n - 2, -Math.PI / 2 + (rr() - 0.5) * 0.3, n * 0.3, 0);
      for (var f = 0; f < n * 0.6; f++) put(rr() * n, n - 1 - (rr() < 0.3 ? 1 : 0), 0.35 + rr() * 0.3, 3);
    } else if (sub === 'trash') {
      var kind = Math.floor(rr() * 6), r0 = n * 0.32;
      if (kind === 0) { /* a ring pull: its ring, its rivet hole, its tongue */
        poly(oval(cx, cy - r0 * 0.25, r0 * 0.75, r0 * 0.5).map(R), true); poly(oval(cx, cy - r0 * 0.3, r0 * 0.35, r0 * 0.18, 10).map(R), true, 0.7);
        poly([[cx - r0 * 0.5, cy + r0 * 0.1], [cx - r0 * 0.4, cy + r0 * 0.8], [cx + r0 * 0.4, cy + r0 * 0.8], [cx + r0 * 0.5, cy + r0 * 0.1]].map(R), false); put(R([cx, cy + r0 * 0.45])[0], R([cx, cy + r0 * 0.45])[1], 1); }
      else if (kind === 1) { /* a bottle cap, its crimps */
        var cap = []; for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2, rr2 = r0 * (i % 2 ? 0.86 : 1); cap.push([cx + Math.cos(t) * rr2, cy + Math.sin(t) * rr2]); } poly(cap.map(R), true); poly(oval(cx, cy, r0 * 0.55, r0 * 0.55, 14).map(R), true, 0.6); }
      else if (kind === 2) { /* a safety pin: the long loop, the coil, the head */
        var L = r0 * 1.5; poly([[cx - L, cy + 2], [cx + L * 0.7, cy - 1], [cx + L, cy], [cx + L * 0.7, cy + 3], [cx - L * 0.8, cy + 5]].map(R), false); poly(oval(cx - L, cy + 3.5, 2, 2, 8).map(R), true);
        poly([[cx + L * 0.55, cy - 3], [cx + L * 1.05, cy - 2], [cx + L * 1.05, cy + 4], [cx + L * 0.55, cy + 5]].map(R), true, 0.8); }
      else if (kind === 3) { /* a blister pack, some of it pressed out */
        var w = r0 * 1.6, h = r0 * 1.1; poly([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]].map(R), true);
        for (var bx = 0; bx < 3; bx++) for (var by = 0; by < 2; by++) { var ox = cx - w / 3 + bx * w / 3, oy = cy - h / 4 + by * h / 2; if (rr() < 0.35) { put(R([ox, oy])[0], R([ox, oy])[1], 0.5); continue; } poly(oval(ox, oy, w / 9, h / 6, 10).map(R), true, 0.85); } }
      else if (kind === 4) { /* a crushed can: a jagged outline, its stripe */
        var can = []; for (var j = 0; j < 14; j++) { var t2 = j / 14 * Math.PI * 2; can.push([cx + Math.cos(t2) * r0 * (0.7 + rr() * 0.45) * 1.1, cy + Math.sin(t2) * r0 * (0.5 + rr() * 0.4)]); } poly(can.map(R), true);
        line(R([cx - r0 * 0.6, cy])[0], R([cx - r0 * 0.6, cy])[1], R([cx + r0 * 0.6, cy - 2])[0], R([cx + r0 * 0.6, cy - 2])[1], 0.7, 1); }
      else { /* a length of chain */
        for (var l2 = 0; l2 < 4; l2++) { var lx = cx - r0 * 1.1 + l2 * r0 * 0.7, ly = cy + (l2 % 2 ? 2 : -2) + Math.sin(ph + l2) * 1.2; poly(oval(lx, ly, r0 * 0.42, r0 * 0.22, 12).map(R), true, 1, l2); } }
    } else {
      /* a paperclip, in one of its shapes: the gem (three nested turns), the triangle, the owl, or one bent open */
      var kind2 = Math.floor(rr() * 4), hgt = n * 0.7, wid = n * 0.3, top = cy - hgt / 2, k3 = Math.floor(rr() * 7);
            if (kind2 === 0) { /* the gem: one wire, three turns */
        var bot = top + hgt, w2 = wid, G = [], arc = function (ox, oy, r4, a0, a1) { for (var i = 0; i <= 7; i++) { var t = a0 + (a1 - a0) * i / 7; G.push([ox + Math.cos(t) * r4, oy + Math.sin(t) * r4]); } };
        G.push([cx - w2 / 2, bot - hgt * 0.2]); arc(cx, top + w2 / 2, w2 / 2, Math.PI, Math.PI * 2); arc(cx + w2 * 0.1, bot - w2 * 0.4, w2 * 0.4, 0, Math.PI);
        arc(cx - w2 * 0.05, top + hgt * 0.35, w2 * 0.25, Math.PI, Math.PI * 2); G.push([cx + w2 * 0.2, bot - hgt * 0.3]); poly(G.map(R), false, 1, k3); }
      else if (kind2 === 1) { var T = [[cx - wid, top + hgt], [cx, top], [cx + wid, top + hgt], [cx - wid * 0.55, top + hgt], [cx, top + hgt * 0.3], [cx + wid * 0.5, top + hgt * 0.85]]; poly(T.map(R), false, 1, k3); }
      else if (kind2 === 2) { var O = [[cx - wid * 0.2, top + hgt], [cx - wid, top + hgt * 0.7], [cx - wid, top + hgt * 0.2], [cx - wid * 0.5, top], [cx, top + hgt * 0.12], [cx + wid * 0.5, top], [cx + wid, top + hgt * 0.2], [cx + wid, top + hgt * 0.7], [cx + wid * 0.2, top + hgt], [cx + wid * 0.2, top + hgt * 0.4], [cx - wid * 0.2, top + hgt * 0.4], [cx - wid * 0.2, top + hgt * 0.85]];
        poly(O.map(R), false, 1, k3); }
      else { var B = [[cx - wid * 1.2, top + hgt * 0.9], [cx - wid * 0.3, top + hgt * 0.2], [cx + wid * 0.2, top + hgt * 0.35], [cx - wid * 0.2, top + hgt * 0.8], [cx + wid * 1.1, top + hgt * 0.1]]; poly(B.map(R), false, 1, k3); }
    }
    return c;
  }

  /* the poster without what was caught or added: the picture whole, one's own line, one's own four lines, the code back. Kept while only those move */
  function posterBase(P) {
    var W = 900, pad = 56, aw = W - pad * 2, a = artOf(P, aw, aw * 1.3), n = P.note || {}, lines = P.lines || [];
    var c = document.createElement('canvas'), x = c.getContext('2d'); c.width = W; c.height = 10; x.font = '600 29px ' + SANS;
    var body = []; lines.forEach(function (l, i) { if (l) wrap(x, l, aw - 60).forEach(function (w, k) { body.push([k ? '' : 'WISH'[i], w]); }); });
    x.font = '42px ' + FONT; var title = !P.say || lines.indexOf(P.say) >= 0 ? [] : wrap(x, P.say, aw).slice(0, 3);
    var band = caught(P).length ? 340 : 0, foot = 176;
    var H = pad + 54 + (a ? a.height + 36 : 10) + title.length * 52 + (title.length ? 16 : 0) + body.length * 38 + 40 + band + foot + pad;
    c.height = H; paper(x, W, H);
    x.fillStyle = ink(); x.textBaseline = 'top'; globeMark(x, pad + 16, pad + 17, 15, ink()); x.font = '900 27px ' + SERIF; x.fillText('novel.global', pad + 44, pad + 2); x.font = '22px ' + FONT;
    if (n.code) { var cw2 = x.measureText(n.code).width; x.fillText(n.code, W - pad - cw2, pad + 4); }
    var ay = pad + 54, y = ay + 10, ax = 0; if (a) { ax = pad + (aw - a.width) / 2; x.drawImage(a, ax, ay); handRect(x, ax - 6, ay - 6, a.width + 12, a.height + 12, 1.6, 0.85, 7);
      if (!P.img && P.spCredit) { x.font = '13px ' + FONT; x.fillStyle = 'rgba(255,255,255,.85)'; var cr = P.spCredit.slice(0, 80), cwid = x.measureText(cr).width; x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(ax + a.width - cwid - 14, ay + a.height - 22, cwid + 10, 18); x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText(cr, ax + a.width - cwid - 9, ay + a.height - 20); }
      y = ay + a.height + 36; }
    x.fillStyle = ink(); x.font = '42px ' + FONT; title.forEach(function (l) { x.fillText(l, pad, y); y += 52; }); if (title.length) y += 16;
    /* the four lines set in print: the letters in the heavy serif, the words in the narrow grotesque */
    body.forEach(function (b) { if (b[0]) { x.font = '900 30px ' + SERIF; x.fillText(b[0], pad, y - 1); } x.font = '600 29px ' + SANS; x.fillText(b[1], pad + 44, y + 1); y += 38; });
    y += 14; var dots = []; for (var i = 0; i <= 40; i++) dots.push([pad + aw * i / 40, y]); x.setLineDash([2, 9]); handLine(x, dots, 2, 0.55, 2); x.setLineDash([]);
    /* the code back to the site, small, dark on light so a phone reads it from the paper */
    var Q = window.qrcode, qrR = null; if (Q && n.code) { try { var q = Q(0, 'M'); q.addData(NG.noteURL(n)); q.make(); var mc = q.getModuleCount(), cell = Math.max(4, Math.floor(176 / mc)), qs = cell * mc, qx = W - pad - qs - 10, qy = H - pad - qs - 10;
      x.fillStyle = WHITE ? 'rgba(255,255,255,1)' : 'rgba(247,245,238,1)'; x.fillRect(qx - 10, qy - 10, qs + 20, qs + 20); x.fillStyle = 'rgb(23,69,127)';
      for (var r2 = 0; r2 < mc; r2++) for (var c2 = 0; c2 < mc; c2++) if (q.isDark(r2, c2)) x.fillRect(qx + c2 * cell, qy + r2 * cell, cell, cell); qrR = { q: q, x: qx, y: qy, s: qs }; } catch (e) { /* no code */ } }
    return { c: c, band: y + 22, W: W, H: H, pad: pad, qr: qrR, art: a ? [ax, ay, a.width, a.height] : null };
  }
  /* the mark of novel.global: a world in a lattice, a band across it redacted, two bars run out of it either way.
     Drawn in two colours (the pen, and the paper showing through) so it sits on blue or white alike */
  function globeMark(x, cx, cy, r, fg) {
    var S2 = Math.ceil(r * 3.2), o = S2 / 2, c = document.createElement('canvas'); c.width = c.height = S2; var g = c.getContext('2d'), lw = Math.max(1, r * 0.075);
    g.fillStyle = fg; g.beginPath(); g.arc(o, o, r, 0, 7); g.fill(); g.globalCompositeOperation = 'destination-out'; g.lineWidth = lw; g.strokeStyle = '#000'; g.fillStyle = '#000';
    g.save(); g.beginPath(); g.arc(o, o, r * 0.94, 0, 7); g.clip();
    for (var i = -3; i <= 3; i++) { g.beginPath(); g.ellipse(o, o, Math.abs(i) * r * 0.31 + 0.01, r, 0, 0, 7); g.stroke(); }
    for (var k = -3; k <= 3; k++) { var a = k * 0.42; g.beginPath(); g.ellipse(o, o + Math.sin(a) * r, r * Math.cos(a), r * 0.1 * Math.cos(a), 0, 0, 7); g.stroke(); }
    [-1, 1].forEach(function (s2) { g.beginPath(); g.ellipse(o, o + s2 * r * 0.95, r * 0.34, r * 0.13, 0, 0, 7); g.fill(); }); g.restore();
    /* the redaction: a band laid over the middle, two dashed lines left in it; the two bars run out past the world either way */
    g.globalCompositeOperation = 'source-over'; g.fillStyle = fg; g.fillRect(o - r * 0.98, o - r * 0.21, r * 1.96, r * 0.42); g.fillRect(o - r * 0.8, o - r * 0.29, r * 2.3, r * 0.12); g.fillRect(o - r * 1.5, o + r * 0.17, r * 2.3, r * 0.12);
    g.globalCompositeOperation = 'destination-out'; for (var j = 0; j < 9; j++) { g.fillRect(o - r * 0.8 + j * r * 0.185, o - r * 0.08, r * 0.11, r * 0.045); g.fillRect(o - r * 0.8 + j * r * 0.185, o + r * 0.04, r * 0.11, r * 0.045); }
    x.drawImage(c, cx - o, cy - o);
  }
  /* the stamps: postmarks after two sheets of them (a Czech school's and Bulgarian philatelic ones), their words replaced by the project's own.
     A ring, the words round the rim between stars, one picture in the middle in a bold line. Drawn once as a mask, inked in the paper's pen
     (or a violet stamp-pad ink, or faded), and worn by the pad: speckled, pressed lighter on one side */
  var STAMPS = ['novel.global', '888', 'odd kin', 'stay with the trouble', 'life emerges in ruins', 'dancing with doom'], STAMPC = {};
  var SANS = '"Archivo Narrow", "Arial Narrow", "Helvetica Neue", Arial, sans-serif', SERIF = 'Fraunces, "Cooper Black", Georgia, serif';
  function rnd(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  /* words round a circle, upright from the outside: over the top clockwise, or under the bottom read left to right */
  function rimText(x, str, cx, cy, r, mid, under) {
    var w = [], tot = 0; for (var i = 0; i < str.length; i++) { w.push(x.measureText(str[i]).width * 1.06); tot += w[i]; }
    var a = mid + (under ? 1 : -1) * tot / r / 2;
    for (var k = 0; k < str.length; k++) { var h = w[k] / r / 2; a += under ? -h : h; x.save(); x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.rotate(a + (under ? -Math.PI / 2 : Math.PI / 2)); x.fillText(str[k], 0, 0); x.restore(); a += under ? -h : h; }
  }
  function star(x, cx, cy, r) { x.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); x.fill(); }
  function stampMask(g, S2) {
    var c = document.createElement('canvas'); c.width = c.height = S2; var x = c.getContext('2d'), R = S2 / 2 - 6, cx = S2 / 2, cy = S2 / 2, rr = rnd(g + 3);
    x.strokeStyle = x.fillStyle = '#000'; x.lineCap = x.lineJoin = 'round'; x.textAlign = 'center'; x.textBaseline = 'middle';
    var ring = function (r, lw) { x.lineWidth = lw; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); };
    var wavy = function (r0, amp, n, lw) { x.lineWidth = lw; x.beginPath(); for (var i = 0; i <= 240; i++) { var t = i / 240 * Math.PI * 2, r = r0 + amp * Math.sin(t * n); if (i) x.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r); else x.moveTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r); } x.closePath(); x.stroke(); };
    if (g === 0) {
      /* novel.global: a scalloped chain, its letters held in the links, the world redacted at the heart */
      wavy(R * 0.93, R * 0.05, 12, S2 * 0.016); wavy(R * 0.6, R * 0.04, 12, S2 * 0.012);
      x.font = '600 ' + Math.round(R * 0.21) + 'px ' + SANS; var L = 'NOVEL.GLOBAL'; for (var i = 0; i < L.length; i++) { var a = -Math.PI / 2 + i * Math.PI * 2 / L.length; x.fillText(L[i], cx + Math.cos(a) * R * 0.77, cy + Math.sin(a) * R * 0.77); }
      globeMark(x, cx, cy, R * 0.36, '#000');
    } else if (g === 1) {
      /* 888: a star of two squares, half its points in halftone, arrows chasing round it, the number large through the middle */
      x.lineWidth = S2 * 0.012; var sq = function (rot) { x.beginPath(); for (var i = 0; i < 4; i++) { var a = rot + i * Math.PI / 2; var px = cx + Math.cos(a) * R * 0.66, py = cy + Math.sin(a) * R * 0.66; if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.closePath(); };
      sq(0); x.save(); x.clip(); for (var yy = cy - R; yy < cy + R; yy += R * 0.07) for (var xx = cx - R; xx < cx + R; xx += R * 0.07) { x.beginPath(); x.arc(xx + (Math.round(yy / (R * 0.07)) % 2 ? R * 0.035 : 0), yy, R * 0.017, 0, 7); x.fill(); } x.restore(); sq(0); x.stroke(); sq(Math.PI / 4); x.stroke();
      for (var k2 = 0; k2 < 8; k2++) { var a0 = k2 * Math.PI / 4 + 0.15, a1 = a0 + Math.PI / 4 - 0.35; x.lineWidth = S2 * 0.012; x.beginPath(); x.arc(cx, cy, R * 0.86, a0, a1); x.stroke();
        var ex = cx + Math.cos(a1) * R * 0.86, ey = cy + Math.sin(a1) * R * 0.86, tg = a1 + Math.PI / 2; x.beginPath(); x.moveTo(ex + Math.cos(tg - 2.6) * R * 0.08, ey + Math.sin(tg - 2.6) * R * 0.08); x.lineTo(ex, ey); x.lineTo(ex + Math.cos(tg + 2.6) * R * 0.08, ey + Math.sin(tg + 2.6) * R * 0.08); x.stroke(); }
      x.font = '900 ' + Math.round(R * 0.52) + 'px ' + SERIF; x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.ellipse(cx, cy, R * 0.52, R * 0.3, 0, 0, 7); x.fill(); x.restore(); x.fillText('888', cx, cy + R * 0.02);
    } else if (g === 2) {
      /* odd kin: a disc of fine halftone fading to its edge; the words in heavy dots, set clear of the rest */
      var m = document.createElement('canvas'); m.width = m.height = S2; var mx = m.getContext('2d'); mx.fillStyle = '#000'; mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.translate(cx, cy); mx.rotate(-0.16);
      mx.font = '900 ' + Math.round(R * 0.7) + 'px ' + SERIF; mx.fillText('odd', -R * 0.04, -R * 0.3); mx.fillText('kin', R * 0.06, R * 0.36);
      var md = mx.getImageData(0, 0, S2, S2).data, near = function (px, py, q) { for (var yy = -q; yy <= q; yy += q) for (var xx = -q; xx <= q; xx += q) { var X = Math.round(px + xx), Y = Math.round(py + yy); if (X >= 0 && Y >= 0 && X < S2 && Y < S2 && md[(Y * S2 + X) * 4 + 3] > 60) return true; } return false; };
      var st = Math.max(4, R * 0.045), row = 0;
      for (var y2 = cy - R; y2 < cy + R; y2 += st, row++) for (var x2 = cx - R + (row % 2 ? st / 2 : 0); x2 < cx + R; x2 += st) { var d = Math.hypot(x2 - cx, y2 - cy) / R; if (d > 0.96 || near(x2, y2, st * 1.2)) continue;
        x.beginPath(); x.arc(x2, y2, st * (0.08 + 0.2 * (1 - d)) * (0.8 + rr() * 0.4), 0, 7); x.fill(); }
      var dots = document.createElement('canvas'); dots.width = dots.height = S2; var dx = dots.getContext('2d'), st2 = Math.max(3, R * 0.034); row = 0;
      for (var y3 = 0; y3 < S2; y3 += st2, row++) for (var x3 = row % 2 ? st2 / 2 : 0; x3 < S2; x3 += st2) { dx.beginPath(); dx.arc(x3, y3, st2 * 0.46, 0, 7); dx.fill(); }
      dx.globalCompositeOperation = 'destination-in'; dx.drawImage(m, 0, 0); x.drawImage(dots, 0, 0);
    } else if (g === 3) {
      /* stay with the trouble: a postmark. The words over the top between two stars; under them, the irukandji as a world with a face */
      ring(R * 0.96, S2 * 0.014); ring(R * 0.6, S2 * 0.012);
      x.font = '600 ' + Math.round(R * 0.2) + 'px ' + SANS; rimText(x, 'STAY WITH THE TROUBLE', cx, cy, R * 0.78, -Math.PI / 2, false);
      star(x, cx - R * 0.74, cy + R * 0.3, R * 0.06); star(x, cx + R * 0.74, cy + R * 0.3, R * 0.06);
      x.lineWidth = S2 * 0.013; x.beginPath(); x.arc(cx, cy + R * 0.02, R * 0.36, Math.PI, 0); x.closePath(); x.stroke();
      for (var mi = -2; mi <= 2; mi++) { x.beginPath(); x.ellipse(cx, cy + R * 0.02, Math.abs(mi) * R * 0.14 + 0.01, R * 0.36, 0, Math.PI, 0); x.stroke(); }
      x.beginPath(); x.moveTo(cx - R * 0.33, cy - R * 0.14); x.quadraticCurveTo(cx, cy - R * 0.2, cx + R * 0.33, cy - R * 0.14); x.stroke();
      x.beginPath(); x.arc(cx - R * 0.13, cy + R * 0.13, R * 0.04, 0, 7); x.arc(cx + R * 0.13, cy + R * 0.13, R * 0.04, 0, 7); x.fill();
      for (var t3 = 0; t3 < 4; t3++) for (var b3 = 0; b3 < 4; b3++) { x.beginPath(); x.arc(cx - R * 0.27 + t3 * R * 0.18, cy + R * 0.12 + R * 0.08 * (b3 + 1) + (t3 === 1 || t3 === 2 ? R * 0.07 : 0), R * 0.022, 0, 7); x.fill(); }
      x.font = '600 ' + Math.round(R * 0.13) + 'px ' + SANS; rimText(x, '* NOVEL.GLOBAL *', cx, cy, R * 0.78, Math.PI / 2, true);
    } else if (g === 4) {
      /* life emerges in ruins: the letters as a ring of outlines, each turned to the centre; in the middle a flower up through broken ground */
      x.font = '900 ' + Math.round(R * 0.3) + 'px ' + SERIF; x.lineWidth = S2 * 0.008; var L4 = 'LIFE·EMERGES·IN·RUINS·', st4 = Math.PI * 2 / L4.length;
      for (var i4 = 0; i4 < L4.length; i4++) { var a4 = -Math.PI / 2 + i4 * st4; x.save(); x.translate(cx + Math.cos(a4) * R * 0.74, cy + Math.sin(a4) * R * 0.74); x.rotate(a4 + Math.PI / 2); x.strokeText(L4[i4], 0, 0); x.restore(); }
      x.lineWidth = S2 * 0.012; var fy = cy - R * 0.1; x.beginPath(); x.arc(cx, fy, R * 0.07, 0, 7); x.stroke();
      for (var p4 = 0; p4 < 10; p4++) { var ap = p4 * Math.PI / 5; x.save(); x.translate(cx, fy); x.rotate(ap); x.beginPath(); x.ellipse(R * 0.15, 0, R * 0.075, R * 0.035, 0, 0, 7); x.stroke(); x.restore(); }
      x.beginPath(); x.moveTo(cx, fy + R * 0.22); x.lineTo(cx, cy + R * 0.32); x.moveTo(cx, cy + R * 0.22); x.quadraticCurveTo(cx - R * 0.16, cy + R * 0.12, cx - R * 0.2, cy + R * 0.2); x.moveTo(cx, cy + R * 0.25); x.quadraticCurveTo(cx + R * 0.16, cy + R * 0.15, cx + R * 0.2, cy + R * 0.23); x.stroke();
      x.beginPath(); x.moveTo(cx - R * 0.36, cy + R * 0.34); x.lineTo(cx - R * 0.12, cy + R * 0.32); x.lineTo(cx - R * 0.06, cy + R * 0.38); x.moveTo(cx + R * 0.04, cy + R * 0.33); x.lineTo(cx + R * 0.36, cy + R * 0.35); x.stroke();
    } else {
      /* dancing with doom: a whirl of rough rings falling to one side, the words under it */
      for (var k5 = 0; k5 < 11; k5++) { var r5 = R * (0.8 - k5 * 0.065), ox = R * 0.006 * k5 * k5, oy = -R * 0.004 * k5 * k5, gap = 0.4 + rr() * 0.9, s5 = rr() * 6.28;
        x.lineWidth = S2 * (0.006 + rr() * 0.012); x.beginPath(); x.arc(cx + ox, cy + oy, Math.max(4, r5), s5, s5 + Math.PI * 2 - gap); x.stroke(); }
      x.font = '600 ' + Math.round(R * 0.17) + 'px ' + SANS; rimText(x, 'DANCING * WITH * DOOM', cx, cy, R * 0.92, Math.PI / 2, true);
    }
    return c;
  }
  function stampOf(g, tone, b) {
    var key = g + tone + (b ? 'b' : '') + WHITE; if (STAMPC[key]) return STAMPC[key];
    var S2 = 300, c = stampMask(g, S2), x = c.getContext('2d'), rr = rnd(g * 7 + 1);
    if (b) { x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.arc(150, 150, 147, 0, 7); x.stroke(); }
    /* the pad's wear: speckles taken out, one side pressed lighter */
    x.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 900; i++) { x.globalAlpha = 0.25 + rr() * 0.75; x.beginPath(); x.arc(rr() * S2, rr() * S2, 0.4 + rr() * 1.6, 0, 7); x.fill(); }
    var side = x.createLinearGradient(0, 0, S2, S2 * 0.6); side.addColorStop(0, 'rgba(0,0,0,0)'); side.addColorStop(0.6, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,.4)'); x.globalAlpha = 1; x.fillStyle = side; x.fillRect(0, 0, S2, S2);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = tone === 'turn' ? (WHITE ? 'rgb(84,52,230)' : 'rgb(200,186,255)') : tone === 'clear' ? ink(0.5) : ink(0.95); x.fillRect(0, 0, S2, S2);
    STAMPC[key] = c; return c;
  }
  var STAMPT = {};
  var stampThumb = function (g) { if (STAMPT[g]) return STAMPT[g]; var w0 = WHITE; usePaper(false); var c = stampOf(g, 'ink', false), t = document.createElement('canvas'); t.width = t.height = 64; t.getContext('2d').drawImage(c, 0, 0, 64, 64); usePaper(w0); return (STAMPT[g] = t.toDataURL()); };
  /* the caught things and the added ones, each a scrap of the paper, where one put it, as turned, sized and toned, framed or not */
  var CATCH_K = ['map', 'life', 'data', 'nino'];
  function caught(P) { var C = P.catch || {}; return CATCH_K.filter(function (k) { return k === 'data' ? (C.data || []).length : k === 'life' ? !!lifeOf(P) : !!C[k]; }); }
  var MARKS = {
    star: 'M16 3l3.6 8.4 9 .8-6.8 6 2 8.8L16 22.4 8.2 27l2-8.8-6.8-6 9-.8z', heart: 'M16 27C6 20 3 14 5.5 9.5 8 5 13 6 16 10c3-4 8-5 10.5-.5C29 14 26 20 16 27z',
    eye: 'M2 16C8 8 12 6 16 6s8 2 14 10c-6 8-10 10-14 10S8 24 2 16zM20.5 16a4.5 4.5 0 1 1-9 0 4.5 4.5 0 1 1 9 0', wave: 'M2 14c4-6 8-6 12 0s8 6 12 0 4-4 4-4M2 22c4-6 8-6 12 0s8 6 12 0 4-4 4-4',
    iruk: 'M8 15C8 8 11.5 5 16 5s8 3 8 10zM10 17v10M14 17v11M18 17v11M22 17v10', sun: 'M22 16a6 6 0 1 1-12 0 6 6 0 1 1 12 0M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M7 25l3-3M22 10l3-3',
    leaf: 'M6 26C8 12 16 6 27 5c-1 11-7 19-21 21zM6 26c6-6 11-11 16-16', arrow: 'M4 27C10 19 16 13 26 6M18 5.5h8.5V14',
    moon: 'M21 4a12 12 0 1 0 7 19A10 10 0 0 1 21 4z', shell: 'M4 22c2-10 8-16 12-16s10 6 12 16zM16 6v16M10 9l3 13M22 9l-3 13M4 22h24', feather: 'M6 27C9 15 16 7 26 4c-1 10-8 18-20 23zM6 27l14-16M12 20h6M15 16h5', spiral: 'M16 16a2 2 0 1 1 2-2 4 4 0 0 1-4 4 6 6 0 0 1-6-6 8 8 0 0 1 8-8 10 10 0 0 1 10 10'
  };
  var MARK_ORDER = ['star', 'heart', 'eye', 'wave', 'iruk', 'sun', 'leaf', 'arrow', 'moon', 'shell', 'feather', 'spiral'];
  var ICON_IMG = {};
  function iconImg(src, then) { var im = ICON_IMG[src]; if (im) return im.complete ? im : null; im = ICON_IMG[src] = new Image(); im.onload = then; im.src = src; return null; }
  function scrap(x, w, h, seed, tf) { var tn = tf.tone || 'ink'; if (tn !== 'clear') { x.fillStyle = tn === 'turn' ? ink(0.92) : back(0.9); x.fillRect(0, 0, w, h); } if (tf.b !== false) handRect(x, 0, 0, w, h, 1.4, tn === 'turn' ? 0 : 0.8, seed); }
  var tcol = function (tf) { return (tf.tone || 'ink') === 'turn' ? back() : ink(); };
  /* each item: its natural size, then drawn turned and sized about its centre */
  function items(P, B0) {
    var out = [], W = B0.W, H = B0.H, pad = B0.pad, tfs = P.tf || {}, n = P.note || P;
    var defaults = { map: [pad, B0.band], life: [pad + 270, B0.band], data: [pad + 270, B0.band + 114], nino: [pad + 270, B0.band + 206] }, m = document.createElement('canvas').getContext('2d');
    caught(P).forEach(function (k) {
      var at = P.pos && P.pos[k] ? [P.pos[k][0] * W, P.pos[k][1] * H] : defaults[k], tf = tfs[k] || {}, it = { key: k, X: at[0], Y: at[1], tf: tf };
      if (k === 'map') { it.w = it.h = 240; it.draw = function (x) { var cx = 120, cy = 120, seen = (n.seen || []).slice(0, 8); if ((tf.tone || 'ink') !== 'clear') { x.fillStyle = tf.tone === 'turn' ? ink(0.92) : back(0.92); x.beginPath(); x.arc(cx, cy, 118, 0, 7); x.fill(); }
        var keep = PEN; if (tf.tone === 'turn') PEN = BACK; if (tf.b !== false) handCircle(x, cx, cy, 116, 1.6, 0.85, 3); handCircle(x, cx, cy, 58, 0.8, 0.3, 5);
        handLine(x, [[cx, cy - 128], [cx, cy - 104]], 1.4, 0.8, 1); x.fillStyle = ink(); x.font = '16px ' + FONT; x.fillText('N', cx - 5, cy - 150 + 2);
        var far = seen.reduce(function (mm, s2) { return Math.max(mm, s2.d || 0); }, 400); seen.forEach(function (s2) { var dy = (n.lat - s2.lat) * 111000, dx = (s2.lng - n.lng) * 111000 * Math.cos(n.lat * Math.PI / 180), kk = 100 / far; x.beginPath(); x.arc(cx + dx * kk, cy + dy * kk, 3.2, 0, 7); x.fill(); });
        irukMark(x, cx, cy - 4, 34, 1); var place = (NG.context(P)[0] || '').toLowerCase(); if (place) { x.font = '18px ' + FONT; var tw = x.measureText(place).width; x.fillText(place, cx - tw / 2, cy + 74); } PEN = keep; }; }
      else if (k === 'life') { var f = lifeOf(P); m.font = '36px ' + FONT; it.w = Math.min(560, m.measureText(f.cn).width + 48); m.font = 'italic 19px Georgia, serif'; it.w = Math.max(it.w, m.measureText(f.n || '').width + 48); it.h = 100;
        it.draw = function (x) { scrap(x, it.w, it.h, 4, tf); x.fillStyle = tcol(tf); x.font = '36px ' + FONT; x.fillText(f.cn, 24, 16); x.globalAlpha = 0.7; x.font = 'italic 19px Georgia, serif'; x.fillText(f.n || '', 24, 64); x.globalAlpha = 1; }; }
      else if (k === 'data') { m.font = '20px ' + FONT; var ls = wrap(m, P.catch.data.join(' · '), 360); it.w = Math.min(420, Math.max.apply(null, ls.map(function (l) { return m.measureText(l).width; })) + 40); it.h = ls.length * 28 + 26;
        it.draw = function (x) { scrap(x, it.w, it.h, 6, tf); x.fillStyle = tcol(tf); x.font = '20px ' + FONT; ls.forEach(function (l, i) { x.fillText(l, 20, 14 + i * 28); }); }; }
      else { it.w = 250; it.h = 110; it.draw = function (x) { scrap(x, it.w, it.h, 8, tf); var cl = tcol(tf); x.fillStyle = cl; x.strokeStyle = cl; x.lineWidth = 1.6;
        x.beginPath(); x.arc(34, 34, 12, 0, 7); x.stroke(); for (var r2 = 0; r2 < 8; r2++) { var an = r2 * Math.PI / 4; x.beginPath(); x.moveTo(34 + Math.cos(an) * 17, 34 + Math.sin(an) * 17); x.lineTo(34 + Math.cos(an) * 21, 34 + Math.sin(an) * 21); x.stroke(); }
        x.font = '26px ' + FONT; x.fillText('Niño 3.4 ' + ninoNow(), 64, 20);
        var v = ninoVals(); if (v) { var mx = Math.max(1, Math.max.apply(null, v)), keep = PEN; if (tf.tone === 'turn') PEN = BACK; handLine(x, v.map(function (q, i) { return [22 + i * (it.w - 44) / Math.max(1, v.length - 1), it.h - 16 - (q / mx) * 30]; }), 1.4, 0.85, 9); PEN = keep; } }; }
      out.push(it);
    });
    (P.adds || []).forEach(function (a, i) {
      var it = { key: 'a' + i, X: a.x * W, Y: a.y * H, tf: a };
      if (a.k === 's' && MARKS[a.g]) { it.w = it.h = 132; it.draw = function (x) { x.translate(6, 6); x.scale(3.75, 3.75); var mk = new Path2D(MARKS[a.g]), tn = a.tone || 'ink'; x.lineCap = x.lineJoin = 'round';
        if (tn !== 'clear') { x.strokeStyle = tn === 'turn' ? ink(0.9) : back(0.9); x.lineWidth = 2.1; x.stroke(mk); } x.strokeStyle = tn === 'turn' ? back() : ink(); x.lineWidth = 0.8; x.stroke(mk); }; }
      else if (a.k === 't') { m.font = '34px ' + FONT; var ls = wrap(m, a.t || ' ', 420); it.w = Math.max(80, Math.max.apply(null, ls.map(function (l) { return m.measureText(l).width; })) + 40); it.h = ls.length * 44 + 22;
        it.draw = function (x) { scrap(x, it.w, it.h, 11 + i, a); x.fillStyle = tcol(a); x.font = '34px ' + FONT; x.textBaseline = 'top'; ls.forEach(function (l, k) { x.fillText(l, 20, 12 + k * 44); }); }; }
      else if (a.k === 'i') { it.w = it.h = 128; it.draw = function (x) { var im = iconImg(a.src, function () { if (window.AURA && AURA.redraw) AURA.redraw(); }); if (!im) return; x.imageSmoothingEnabled = false; var iw = im.naturalWidth, ih = im.naturalHeight, k2 = 128 / Math.max(iw, ih); x.drawImage(im, (128 - iw * k2) / 2, (128 - ih * k2) / 2, iw * k2, ih * k2); }; }
      else if (a.k === 'st' && STAMPS[a.g]) { it.w = it.h = 220; it.draw = function (x) { x.drawImage(stampOf(a.g, a.tone || 'ink', a.b === true), 0, 0, 220, 220); }; }
      else if (a.k === 'p') { it.w = it.h = 160; it.draw = function (x) { var pj = pixArt(a.sub || 'jelly', a.cells || 24, a.ph || 0, a.tone2 || 'ink', picOf(P), a.seed || 1); x.imageSmoothingEnabled = false; if (a.b) handRect(x, 0, 0, 160, 160, 1.2, 0.6, 13); x.drawImage(pj, 0, 0, 160, 160); }; }
      else return;
      out.push(it);
    });
    return out;
  }
  function drawItems(x, P, B0) {
    var boxes = {};
    items(P, B0).forEach(function (it) {
      var s = it.tf.s || 1, r = (it.tf.r || 0) * Math.PI / 180, w = it.w * s, h = it.h * s;
      x.save(); x.textBaseline = 'top'; x.translate(it.X + w / 2, it.Y + h / 2); x.rotate(r); x.scale(s, s); x.translate(-it.w / 2, -it.h / 2); it.draw(x); x.restore();
      boxes[it.key] = [it.X, it.Y, w, h];
    });
    return boxes;
  }
  function posterKey(P) { return [P.paper, P.say, (P.lines || []).join('|'), (P.photo || '').length, !!P.img, !!P.spImg, P.ptone, P.note && P.note.code, caught(P).length > 0, P.note && (P.note.seen || []).length, !!window.qrcode].join('~'); }
  function posterNow(P) {
    /* → { c, boxes }: the base kept, the caught and the added drawn over it */
    usePaper(P.paper === 'white');
    var key = posterKey(P); if (!P._base || P._base.key !== key) { P._base = posterBase(P); P._base.key = key; }
    var B0 = P._base, c = document.createElement('canvas'); c.width = B0.W; c.height = B0.H; var x = c.getContext('2d'); x.drawImage(B0.c, 0, 0);
    var boxes = drawItems(x, P, B0); usePaper(false);
    return { c: c, boxes: boxes };
  }
  function poster(P) { return fontReady().then(function () { return posterNow(P).c; }); }
  function keepCanvas(c, cap, codeT) {
    var src = c.toDataURL('image/jpeg', 0.86), item = { id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), src: src, cap: cap || '', code: codeT || '' };
    folioKeep(item); return item;
  }
  /* a print from the base's own pages: what it chose to show there is what was caught */
  function keepNote(n, art) {
    var P = { note: n, at: n.at, say: n.say, lat: n.lat, lng: n.lng, data: n.data, seen: n.seen, r: NG.read({ id: n.id, say: n.say, tags: n.tags, spId: n.sp, lat: n.lat, lng: n.lng, wx: n.wx }), catch: { life: n.sp || '', data: (n.data || []).slice(0, 3) } };
    P.lines = NG.wishLines(n, P.r).map(function (l) { return l[1]; });
    var src = NG.PHOTOS[n.id] || n.thumb || ''; var go = function () { return poster(P).then(function (c) { return keepCanvas(c, n.cn || n.say || '', n.code); }); };
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
  var CUR = [0, 0];
  var noise = function (a, b, c) { return N3 ? N3(a, b, c) : Math.sin(a * 1.7 + c * 1.3) * 0.6 + Math.sin(b * 2.3 + c * 0.7) * 0.4; };

  var orbs = [], tabs = [], catchK = null, panel = null, deep = null;
  var S = { mode: 'seed', t0: 0, stage: 0, deep: false, spin: 0.6, fade: 1 };
  var L = {}, dpr = 1;
  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1); var W = innerWidth, H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var mob = W < 760, R = Math.min(W * 0.86, H * 0.74, 560) * 150 / 400;
    var big = !mob && H > 760 && W > 1200, bw = mob ? 116 : big ? 196 : 160, bh = bw * 0.58, by = mob ? 16 : 22, cr = mob ? 21 : big ? 26 : 23, gy = by + bh + (mob ? 30 : 38), hry = mob ? 12 : 15;
    var tipY = H - (mob ? 34 : 42), panelTop = gy + hry + cr + (mob ? 16 : 22), panelBot = tipY - (mob ? 44 : 52), pw = mob ? W - 40 : Math.min(big ? 720 : 640, W - 380);
    L = { W: W, H: H, mob: mob, big: big, R: R, cx: W / 2, cy: H / 2, bx: W / 2, by: by, bw: bw, bh: bh, gy: gy, cr: cr, hrx: bw * (mob ? 0.62 : 0.6) + cr, hry: hry,
      hold: [0, 1, 2, 3].map(function (i) { return [W / 2 + [-0.9, -0.3, 0.3, 0.9][i] * cr, gy + (i === 0 || i === 3 ? 0 : 4)]; }),
      tips: [0, 1, 2, 3].map(function (i) { return [mob ? W * (0.125 + 0.25 * i) : W / 2 + (i - 1.5) * Math.min(W * 0.2, big ? 300 : 240), tipY]; }),
      panel: { l: (W - pw) / 2, t: panelTop, w: pw, h: Math.max(160, panelBot - panelTop) } };
    [panel, deep].forEach(function (p) { if (p) { p.style.left = L.panel.l + 'px'; p.style.top = L.panel.t + 'px'; p.style.width = L.panel.w + 'px'; p.style.height = L.panel.h + 'px'; } });
    /* the keys stay where they are: the tentacles move between them, never the things one reaches for */
    tabs.forEach(function (b, i) { var tr = 'translate(' + L.tips[i][0].toFixed(1) + 'px,' + L.tips[i][1].toFixed(1) + 'px)'; b.style.setProperty('--at', tr); b.style.transform = tr; });
    if (catchK) { halo(0); catchK.style.width = catchK.style.height = cr * 2 + 'px'; catchK.style.margin = -cr + 'px 0 0 ' + -cr + 'px'; }
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
      ctl = held.concat([[g[0] + (sx - g[0]) * 0.7, g[1] + (ln[2] - g[1]) * 0.3], [sx, ln[2] - 16], [a0 + (left ? 2 : -2), ln[2]]]); k0 = ctl.length - 1; ctl.push([a0 + (a1 - a0) * 0.04, ln[2]]);
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
        return [q3[0] + (noise(i * 3.3, s * 2.2, t * 0.22) + CUR[0]) * amp2 * env, q3[1] + noise(i * 7.1, s * 3, t * 0.18) * amp2 * 0.4 * env + Math.sin(t * 1.1 + j * 0.35 + i) * 0.5 * (u >= k0 ? 1 : 0)]; });
    }
    /* they hang: from the bell, round the one thing they hold, drifting down to their steps; over the step's page they go faint */
    var lx = function (f) { return g[0] + (tip[0] - g[0]) * f + (left ? -1 : 1) * Math.sin(f * Math.PI) * (mob ? 12 : 44); };
    var pts = catmull([root, [(root[0] + g[0]) / 2, root[1] + (g[1] - root[1]) * 0.4], g, [lx(0.2), P0.t + P0.h * 0.15], [lx(0.5), P0.t + P0.h * 0.5], [lx(0.8), P0.t + P0.h * 0.85], tip], NT);
    if (still) return pts; var amp = mob ? 9 : 16, lean = left ? -1 : 1, gj = NT * 0.1;
    return pts.map(function (q, j) { var s = j / (NT - 1), env = Math.sin(Math.PI * s) * Math.min(1, Math.abs(j - gj) / 5) * Math.min(1, (NT - 1 - j) / 6);
      var wave = Math.sin(s * (22 + i * 3) - t * 1.3 + i * 1.7) * (mob ? 2.4 : 3.2) * env;
      return [q[0] + (noise(i * 3.3, s * 2.2, t * 0.22) * amp + lean * bell.p * 2.5 + CUR[0] * amp * 1.4 * s) * env + wave, q[1] + noise(i * 7.1, s * 3, t * 0.18) * amp * 0.4 * env]; });
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
      else if (!still) { s.y -= dt * (0.004 + s.r * 0.003); s.x += (Math.sin(t * 0.2 + s.ph) * 0.002 + CUR[0] * 0.006) * dt; }
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
    if (P && P.eye && S.deep) { x.save(); x.beginPath(); x.arc(px, ey, pr, 0, 7); x.clip(); x.globalAlpha = a; x.drawImage(P.eye, px - pr, ey - pr, pr * 2, pr * 2); x.restore(); }
    else dot(px, ey, pr * (0.42 + 0.12 * glow), 0.95 * a);
    stroke((function () { var c2 = []; for (var k3 = 0; k3 <= 24; k3++) { var v = k3 / 24 * Math.PI * 2; c2.push([px + Math.cos(v) * pr, ey + Math.sin(v) * pr]); } return c2; })(), 0.7, 0.85 * a, false);
    [-0.62, -0.22, 0.22, 0.62].forEach(function (f) { dot(L.bx + f * b.w, b.bot - L.bh * 0.1, 1.7, 0.85 * a); });
    /* every piece on the wall is a bead on the bell's crown: what has been made stays with it */
    var nb = Math.min(24, FOLIO.length); for (var bi = 0; bi < nb; bi++) { var bq = b.pts[Math.round(NR * 0.8 * (0.12 + 0.76 * (nb > 1 ? bi / (nb - 1) : 0.5)))]; dot(bq[0], bq[1] - 5, 1.6, (0.55 + 0.45 * Math.sin(t * 1.3 + bi)) * a); }
    if (S.round && t - S.round < 2.6) { var rk = (t - S.round) / 2.6, fl2 = Math.max(0, Math.sin(Math.min(1, (rk - 0.55) / 0.45) * Math.PI)); if (fl2 > 0) { var g3 = x.createRadialGradient(L.bx, b.top + L.bh * 0.5, 2, L.bx, b.top + L.bh * 0.5, L.bw * 2.2); g3.addColorStop(0, 'rgba(244,241,232,' + 0.35 * fl2 + ')'); g3.addColorStop(1, 'rgba(244,241,232,0)'); x.fillStyle = g3; x.fillRect(L.bx - L.bw * 2.4, b.top - L.bw * 1.2, L.bw * 4.8, L.bw * 3.6); } }
    slipDraw(T, t, a);
    return T;
  }
  /* the receipt being made, small and narrow as the 80 mm paper, carried by the tentacles: hanging from the step that is open, passed
     along when the step changes, and, printed, taken up the print tentacle into the bell */
  var MINI = { c: null, t: 0 };
  function miniMake() { MINI.t = 0; if (!P || !ready()) { MINI.c = null; return; } fontReady().then(function () { if (!P) return; var c = posterNow(P).c, w = 44, h = Math.min(130, Math.round(c.height * w / c.width)), m = document.createElement('canvas'); m.width = w * 2; m.height = h * 2; m.getContext('2d').drawImage(c, 0, 0, c.width, Math.min(c.height, h * c.width / w), 0, 0, w * 2, h * 2); MINI.c = m; }); }
  var miniSoon = function () { clearTimeout(MINI.t); MINI.t = setTimeout(miniMake, 600); };
  function slipAt(T, i, f) { var pts = T.tents[i], j = Math.max(1, Math.min(NT - 2, Math.round(f * (NT - 1)))), p = pts[j], q = pts[j + 1]; return [p[0], p[1], Math.atan2(q[1] - p[1], q[0] - p[0])]; }
  function slipDraw(T, t, a) {
    var held = 0.5, pos = null, k;
    if (S.round && t - S.round < 2.6) { k = Math.min(1, (t - S.round) / 1.6); pos = slipAt(T, 3, 0.92 - 0.88 * k); if (k >= 1) return; }
    else if (S.stage >= 2 && !S.deep && !(S.pass && t - S.pass.t0 < 1.1)) return;
    else if (S.pass && t - S.pass.t0 < 1.1) { k = (t - S.pass.t0) / 1.1; pos = k < 0.5 ? slipAt(T, S.pass.from, held - (held - 0.08) * k * 2) : slipAt(T, S.pass.to, 0.08 + (held - 0.08) * (k - 0.5) * 2); }
    else pos = slipAt(T, S.stage, held);
    var m = MINI.c, w = 22, h = m ? m.height / m.width * w : 40;
    x.save(); x.translate(pos[0], pos[1]); x.rotate((pos[2] - Math.PI / 2) * 0.25 + Math.sin(t * 0.9) * 0.05); x.globalAlpha = 0.95 * a;
    x.fillStyle = m ? 'rgba(23,69,127,1)' : 'rgba(23,69,127,.6)'; x.fillRect(-w / 2, 0, w, h); if (m) x.drawImage(m, -w / 2, 0, w, h);
    x.beginPath(); x.moveTo(-w / 2, 0); x.lineTo(w / 2, 0); x.lineTo(w / 2, h); for (var z = 0; z <= 6; z++) x.lineTo(w / 2 - z * w / 6, h + (z % 2 ? 2.5 : 0)); x.closePath();
    x.lineWidth = 0.9; x.strokeStyle = 'rgba(244,241,232,.85)'; if (!m) x.setLineDash([2, 2.5]); x.stroke(); x.setLineDash([]);
    dot(0, -1.5, 1.6, 0.9 * a); x.restore();
  }
  /* the currents made visible: ripples where something was touched, and slow shadows passing under the paper */
  var RIP = [];
  function ripple(px, py) { if (still) return; RIP.push({ x: px, y: py, t0: performance.now() / 1000 }); if (RIP.length > 6) RIP.shift(); }
  function under(t) {
    if (still) return; [[0.3, 0.7, 1], [0.75, 0.35, 2]].forEach(function (q) { var sx = (q[0] + noise(q[2], t * 0.015, 1) * 0.25) * L.W, sy = (q[1] + noise(q[2] + 5, t * 0.015, 2) * 0.2) * L.H, r = Math.max(L.W, L.H) * 0.35;
      var g = x.createRadialGradient(sx, sy, 1, sx, sy, r); g.addColorStop(0, 'rgba(6,24,52,.08)'); g.addColorStop(1, 'rgba(6,24,52,0)'); x.fillStyle = g; x.fillRect(sx - r, sy - r, r * 2, r * 2); });
    RIP = RIP.filter(function (r0) { var k = Math.max(0, (t - r0.t0) / 2.4); if (k >= 1) return false; var rr = 12 + 170 * k;
      x.beginPath(); x.arc(r0.x, r0.y, rr, 0, 7); x.strokeStyle = 'rgba(244,241,232,' + 0.14 * (1 - k) + ')'; x.lineWidth = 1; x.stroke();
      var g2 = x.createRadialGradient(r0.x, r0.y + 8, 1, r0.x, r0.y + 8, rr * 0.8); g2.addColorStop(0, 'rgba(6,24,52,' + 0.08 * (1 - k) + ')'); g2.addColorStop(1, 'rgba(6,24,52,0)'); x.fillStyle = g2; x.fillRect(r0.x - rr, r0.y - rr, rr * 2, rr * 2); return true; });
  }
  /* the catch rides an unseen halo round the knot of tentacles, slowly; it stops while it is looked at or open */
  function halo(dt) {
    if (!catchK || !L.hrx) return; if (dt && !S.hHalo && !S.deep && !still) S.halo = (S.halo || 1.2) + dt * 2 * Math.PI / 54; var a2 = S.halo || 1.2, front = Math.sin(a2);
    var px = L.bx + Math.cos(a2) * L.hrx, py = L.gy + front * L.hry, tr = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) scale(' + (0.86 + 0.14 * (front + 1) / 2).toFixed(3) + ')';
    catchK.style.setProperty('--at', tr); catchK.style.transform = tr; catchK.style.zIndex = front > 0 ? 3 : 1; catchK.style.opacity = (S.fade * (0.72 + 0.28 * (front + 1) / 2)).toFixed(2);
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
    text: '<path d="M6 25L13 6h2l7 19M9 18h10"/><path d="M23 25c0-3 1.5-5 4-5s3 2 3 5" class="d"/>',
    eye: '<path d="M3 16c4-6 8.5-9 13-9s9 3 13 9c-4 6-8.5 9-13 9S7 22 3 16z"/><circle cx="16" cy="16" r="4.5"/><circle cx="16" cy="16" r="1.4" class="f"/>',
    pix: '<path d="M9 7h14v4h3v6h-3v2H9v-2H6v-6h3z"/><path d="M10 22v6M14 22v4M18 22v6M22 22v4" class="d"/>',
    grid: '<path d="M6 6h20v20H6zM12.7 6v20M19.3 6v20M6 12.7h20M6 19.3h20" class="d"/>',
    cur: '<path d="M4 11c4-3 8-3 12 0s8 3 12 0M4 17c4-3 8-3 12 0s8 3 12 0M4 23c4-3 8-3 12 0s8 3 12 0" class="d"/>',
    tone: '<circle cx="16" cy="16" r="11"/><path d="M16 5a11 11 0 0 1 0 22z" class="f"/>',
    plus: '<path d="M16 7v18M7 16h18"/>',
    turn: '<path d="M24 12a9 9 0 1 0 1 7"/><path d="M25 5v7h-7"/>',
    frame: '<path d="M6 6h20v20H6z" class="d"/><path d="M10 10h12v12H10z"/>',
    paper: '<path d="M8 4h16v24H8z"/><path d="M8 4h8v24H8z" class="f"/>',
    near: '<circle cx="16" cy="16" r="12" class="d"/><circle cx="16" cy="16" r="6.5"/><circle cx="16" cy="16" r="2" class="f"/>',
    pxjelly: '<path d="M8 15c0-6 3.5-9 8-9s8 3 8 9z"/><path d="M11 18v6M14.5 18v8M17.5 18v8M21 18v6" class="d"/>',
    pxcoral: '<path d="M16 28V18M16 18l-5-6M11 12l-2-5M11 12l3-4M16 18l5-5M21 13l-1-5M21 13l4-3M16 22l-6-2"/><path d="M6 28h20" class="d"/>',
    pxtrash: '<ellipse cx="16" cy="12" rx="8" ry="5.5"/><ellipse cx="16" cy="11.5" rx="3.5" ry="1.8"/><path d="M11 16l1.5 9h7L21 16"/><circle cx="16" cy="21" r=".9" class="f"/>',
    pxclip: '<path d="M12 26V9a4 4 0 0 1 8 0v14a2.5 2.5 0 0 1-5 0V11"/>',
    dice: '<path d="M7 7h18v18H7z"/><circle cx="12" cy="12" r="1.3" class="f"/><circle cx="20" cy="20" r="1.3" class="f"/><circle cx="16" cy="16" r="1.3" class="f"/>',
    moon2: '<path d="M20 5a11 11 0 1 0 7 15A9 9 0 0 1 20 5z"/><circle cx="24" cy="9" r="1" class="f"/><circle cx="27" cy="14" r=".8" class="f"/>'
  };
  /* what to do, said plainly in a few words, now and then: each line comes for a moment (longer for a longer one) and goes for a while.
     Nothing stays on the paper to be read over and over */
  var SAY = {
    globe: 'Start here. Tell us one small thing you noticed today.',
    notice: 'A small thing counts: a bird on the path, a smell after rain, a frog calling at night. Tap the eye up top to add a photo, or the round bundle under it to pin where it was.',
    wish: 'Four lines, one for each letter. Stuck? Hover or tap the letter and it will tell you what goes there.',
    art: 'Drag things where you want them. Tap one to turn it, resize it or frame it. The row above adds stamps, words, a photo or a little pixel creature.',
    artEmpty: 'Nothing to make a poster from yet. Start with what you noticed, or write your W.I.S.H.',
    print: 'Print sends this to the novel.global printer on 80 mm paper, and it goes up on your wall. Pick blue or white paper first.',
    wall: 'Everything you have printed. Swipe through, tap one to see it full screen, or bring one back to keep working on it.',
    map: 'Tap the map where you saw it, so the poster knows where it belongs. Drag to look around; the ring finds you.',
    near: 'Places and lives within a short walk of here. Open it and tap any you want on your poster.',
    find: 'Know what it was? Type its name, then tap it to add it.',
    vals: 'Today, here: the date, the place, the weather. Tap the ones worth keeping.',
    month: 'This month: what to look out for, closest to you first.'
  };
  /* why El Niño matters now, from the season's own reports (sources in docs/sources.md) */
  var NINO_WHY = 'The Pacific is running hot. The Bureau declared El Niño in June, and NOAA gives it better than four in five odds of staying strong or very strong through to March. On top of a warmer world, that means hotter days, drier ground and more fire weather here, and reef scientists expect the Great Barrier Reef to bleach again. Strong El Niños have brought some of the worst droughts on record. The small lives feel it first, so what you notice now matters.';
  var hint = function (t, cls2) { var long = t.length > 70; return '<p class="au-hint ' + (cls2 || '') + '" data-on="' + (long ? Math.min(8, 2 + Math.round(t.length / 40)) : 2) + '" data-off="' + (long ? 14 : 10) + '">' + esc(t) + '</p>'; };
  /* the next step, always at the foot of the page: a dotted line to the next step's own icon, and where it leads */
  var NEXT = [[1, 'wish', 'next: your W.I.S.H.'], [2, 'art', 'next: make the poster'], [3, 'print', 'next: print it']];
  var goKey = function (s) { var n2 = NEXT[s]; return n2 ? '<button class="au-go" data-go="' + n2[0] + '"><i></i>' + svgI(n2[1]) + '<span>' + n2[2] + '</span></button>' : ''; };
  setInterval(function () {
    var t = performance.now() / 1000; [].forEach.call(root.querySelectorAll('.au-hint'), function (el, i) {
      if (!el.__t0) el.__t0 = t + 1 + (el.closest('.au-c') ? (i % 5) * 0.9 : 0); var on = +el.dataset.on || 2, off = +el.dataset.off || 10, k = t - el.__t0;
      el.classList.toggle('on', k >= 0 && (k % (on + off)) < on); });
  }, 200);
  var svgI = function (k, cls2) { return '<svg class="' + (cls2 || 'au-i') + '" viewBox="0 0 32 32" aria-hidden="true">' + ICON[k] + '</svg>'; };
  var markI = function (g) { return '<svg class="au-i" viewBox="0 0 32 32" aria-hidden="true"><path d="' + MARKS[g] + '"/></svg>'; };
  /* the globe's three ways in, marked not by numbers but by small constellations of their own: a seeing (three stars over one),
     a four (a kite left open), a path (stars stepping down to the paper) */
  var RUNES = [[[3, 10], [8, 4], [13, 10], [8, 13]], [[3, 5], [11, 2.5], [13.5, 11], [5, 13.5]], [[2.5, 3], [6, 7], [10.5, 8.5], [13.5, 13.5]]], RUNEJ = [[[0, 1], [1, 2], [1, 3]], [[0, 1], [1, 2], [2, 3], [0, 2]], [[0, 1], [1, 2], [2, 3]]];
  var runeI = function (i) { var st = RUNES[i]; return '<svg class="au-rune" viewBox="0 0 16 16" aria-hidden="true">' + RUNEJ[i].map(function (j) { return '<path d="M' + st[j[0]].join(' ') + 'L' + st[j[1]].join(' ') + '"/>'; }).join('') + st.map(function (q, k) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (k === st.length - 1 ? 1.6 : 1.1) + '" class="f"/>'; }).join('') + '</svg>'; };
  var numI = function (i) { return '<svg class="au-n" viewBox="0 0 10 16" aria-hidden="true"><path d="' + NUMS[i] + '"/></svg>'; };
  ui.innerHTML =
    '<button id="au-seed" aria-label="Begin"></button>' +
    [0, 1, 3].map(function (s, i) { return '<button class="au-orb" data-s="' + s + '" aria-label="' + ['RADIO', 'W.I.S.H.', 'PRINT'][i] + '"><i class="pt"></i><i class="au-ring"></i>' + runeI(i) + svgI(['radio', 'wish', 'print'][i]) + (i === 0 ? '<span class="au-hint au-ohint" data-on="3" data-off="10">' + esc(SAY.globe) + '</span>' : '') + '</button>'; }).join('') +
    '<a id="au-base" href="?base" aria-label="The base"><i></i></a>' +
    '<label id="au-bell" aria-label="The eye: a photograph of what you have noticed"><input type="file" accept="image/*" id="au-file" hidden></label>' +
    '<button id="au-up" aria-label="Back up to the globe"><i></i></button>' +
    STEPS.map(function (s, i) { return '<button class="au-tab" data-s="' + i + '" aria-label="' + s[0] + '">' + numI(i) + svgI(s[1]) + '</button>'; }).join('') +
    '<button id="au-catch" aria-label="What it has caught: the map, the life, the data, El Niño">' + svgI('catch') + '<b></b></button>' +
    '<button id="au-snd" aria-label="Sound"><i></i><svg viewBox="0 0 24 12" aria-hidden="true"><path d="M1 6c2.5-5 5-5 7.5 0s5 5 7.5 0 5-5 7 0"/></svg></button>' +
    '<section id="au-panel" aria-live="polite"></section><section id="au-deep" hidden></section>' +
    '';
  orbs = [].slice.call(ui.querySelectorAll('.au-orb')); tabs = [].slice.call(ui.querySelectorAll('.au-tab')); catchK = $('#au-catch');
  panel = $('#au-panel'); deep = $('#au-deep');
  function setMode(m) { S.mode = m; S.t0 = performance.now(); root.className = 'm-' + m + ' st' + S.stage + (S.deep ? ' deep' : '') + (typeof SH !== 'undefined' && SH.pswp ? ' showing' : '') + (L.big ? ' big' : ''); }
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
    x.clearRect(0, 0, L.W, L.H); CUR = still ? [0, 0] : [noise(t * 0.035, 1.3, 0), noise(t * 0.035, 7.7, 0) * 0.5];
    if (!still && (S.mode === 'globe' || S.mode === 'bang')) S.spin += dt * 2 * Math.PI / 110;
    if (S.mode === 'iruk') under(t);
    snow(t, dt, S.mode === 'seed' ? 14 : 70);
    var rs = null, T = null;
    if (S.mode === 'seed') drawSeed(t);
    else if (S.mode === 'bang') { drawBang(t, k / 2.6); if (k > 2.6) setMode('globe'); }
    else if (S.mode === 'globe') { drawGlobe(t, 1, 1); rs = place3(t, 1); }
    else if (S.mode === 'morph') { var km = still ? 1 : k / 1.5; drawMorph(t, Math.min(1, km)); if (km >= 1) { setMode('iruk'); S.fade = 0; setTimeout(regrow, 30); } }
    else if (S.mode === 'unmorph') { var ku = still ? 1 : k / 1.3; drawMorph(t, Math.max(0, 1 - ku)); if (ku >= 1) setMode('globe'); }
    else if (S.mode === 'iruk') { S.fade = Math.min(1, S.fade + dt * 2); T = drawIruk(t, 1); keys(t); halo(dt); }
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
  /* the steps: held, they sit at the tentacles' tips; let go of, they wander a little in the current, each its own way, and come back when held */
  var DRIFT = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  function keys(t) {
    var a = S.fade, nx = nextStep(), loose = FORM.key !== 'hang' && !still;
    tabs.forEach(function (b, i) { b.style.opacity = a; b.classList.toggle('on', i === S.stage); b.classList.toggle('next', i === nx);
      if (t == null) return; var d = DRIFT[i], tx = loose ? noise(i * 5.1, t * 0.06, 0) * 16 + CUR[0] * 10 : 0, ty = loose ? noise(i * 2.3, t * 0.05, 3) * 12 - 8 : 0, tr = loose ? noise(i * 1.7, t * 0.04, 9) * 7 : 0;
      d[0] += (tx - d[0]) * 0.04; d[1] += (ty - d[1]) * 0.04; d[2] += (tr - d[2]) * 0.04;
      b.style.transform = (b.style.getPropertyValue('--at') || '') + ' translate(' + d[0].toFixed(1) + 'px,' + d[1].toFixed(1) + 'px) rotate(' + d[2].toFixed(1) + 'deg)'; });
    catchK.classList.toggle('on', !!S.deep);
    panel.style.opacity = deep.style.opacity = a;
  }
  function go() { if (!raf && !asleep) raf = requestAnimationFrame(frame); }

  /* ───────── moving between them ───────── */
  function bang() {
    if (S.mode !== 'seed') return; window.__auraSound = 1; humStart(); try { boom(); } catch (e) { /* no sound */ }
    SNOW.forEach(function (s, i) { if (i % 2) return; var a = Math.random() * 7, v = 0.25 + Math.random() * 0.6; s.x = 0.5; s.y = 0.5; s.vx = Math.cos(a) * v * L.W; s.vy = Math.sin(a) * v * L.H; s.burst = 1.6; });
    setMode('bang'); store.set('da.aura.seen', 1);
  }
  function toIruk(stage) { if (S.mode !== 'globe' && S.mode !== 'bang') return; if (stage !== 3 && done()) fresh(); FORM.key = 'hang'; FORM.lines = FORM.rect = FORM.from = null; S.stage = stage; S.deep = false; deep.hidden = true; paint(); setMode('morph'); bell(stage, 0.22); }
  function toGlobe() { if (S.mode !== 'iruk') return; S.deep = false; deep.hidden = true; setMode('unmorph'); bell(0, 0.18); }
  /* a printed piece is finished: the round is over. Going on (to any step but print, to the eye or to the catch) begins the next piece, clear;
     the finished one stays on the wall, to be brought back */
  var done = function () { return !!(P && P.sent); };
  function fresh() { P = null; S.sel = null; S.pix = false; MINI.c = null; draftSave(null); fillDots(); }
  function step(i) {
    if (i !== 3 && done()) fresh();
    var from = S.stage; if (i === S.stage && !S.deep) { paint(); keys(); return; }
    S.stage = i; S.deep = false; S.sel = null; deep.hidden = true; deep.innerHTML = ''; cls(); paint(); keys(); bell(i); panel.scrollTop = 0; focusFirst();
    S.pass = { from: from, to: i, t0: performance.now() / 1000 }; if (L.tips) ripple(L.tips[i][0], L.tips[i][1] - 10);
  }
  var focusFirst = function () { if ('ontouchstart' in window) return; var f = panel.querySelector('#au-say, .au-wish textarea'); if (f) setTimeout(function () { f.focus(); }, 60); };
  $('#au-seed').addEventListener('click', bang);
  root.addEventListener('pointerdown', function (e) { if (S.mode === 'seed' && e.target === cv) bang(); });
  orbs.forEach(function (o) { o.addEventListener('click', function () { if (S.mode === 'bang') setMode('globe'); toIruk(+o.dataset.s); }); });
  $('#au-up').addEventListener('click', toGlobe);
  /* the eye takes in a photograph from any step, and the step stays where it is (after a round, it begins the next piece) */
  $('#au-file').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (done()) { fresh(); if (S.stage === 3) step(0); } intake(f); bell(0, 0.24); ripple(L.bx, L.by + L.bh * 0.5); });
  tabs.forEach(function (b) { b.addEventListener('click', function () { step(+b.dataset.s); }); });
  catchK.addEventListener('click', function () { if (S.deep) closeDeep(); else openDeep(); bell(4, 0.2); var r = catchK.getBoundingClientRect(); ripple(r.left + r.width / 2, r.top + r.height / 2); });
  var bellK = $('#au-bell');
  bellK.addEventListener('pointerenter', function (e) { S.hEye = true; if (e.pointerType === 'mouse') deepTone(55); });
  bellK.addEventListener('pointerleave', function () { S.hEye = false; });
  catchK.addEventListener('pointerenter', function (e) { S.hHalo = true; if (e.pointerType === 'mouse') deepTone(73.4); });
  catchK.addEventListener('pointerleave', function () { S.hHalo = false; });
  $('#au-snd').addEventListener('click', function () { mute = !mute; store.set('da.aura.mute', mute); this.classList.toggle('off', mute); if (!mute) { window.__auraSound = 1; humStart(); } humSet(true); });

  /* ───────── the piece: one at a time, kept as it is made, until it is printed and the round is over. The engine reads it underneath;
     nothing it knows is said unless it is caught ───────── */
  var P = null;
  var ready = function () { return !!(P && (P.photo || P.spPhoto || P.say || (P.lines || []).some(Boolean) || caught(P).length || (P.adds || []).length)); };
  function newPiece() { return { id: 'n' + Date.now().toString(36), at: Date.now(), photo: '', thumb: '', say: '', tags: [], mine: true, lat: NG.map.lat, lng: NG.map.lng, src: 'MAP', art: 'photo', lines: ['', '', '', ''], catch: { map: false, life: '', data: [], nino: false }, pos: {}, adds: [], tf: {}, paper: 'blue', ptone: 'as' }; }
  var piece = function () { if (done()) fresh(); if (!P) { P = newPiece(); where(P); } return P; };
  var KEEP = ['id', 'at', 'photo', 'thumb', 'say', 'wSay', 'tags', 'lat', 'lng', 'src', 'art', 'lines', 'catch', 'pos', 'adds', 'tf', 'paper', 'ptone', 'spPhoto', 'spCredit', 'sent', 'folioId', 'revealed', 'wx'];
  function pack(p) { var o = {}; KEEP.forEach(function (k) { if (p[k] !== undefined) o[k] = p[k]; }); o.noteId = p.note ? p.note.id : ''; return JSON.parse(JSON.stringify(o)); }
  function unpack(o) {
    var p = newPiece(); KEEP.forEach(function (k) { if (o[k] !== undefined) p[k] = o[k]; }); p.mine = true; p.catch = p.catch || { map: false, life: '', data: [], nino: false }; p.adds = p.adds || []; p.pos = p.pos || {}; p.tf = p.tf || {};
    p.note = o.noteId ? NG.notes().filter(function (n) { return n.id === o.noteId; })[0] || null : null; p.dirty = true; if (p.photo) eyeOf(p); if (p.spPhoto) spLoad(p); return p;
  }
  var draftT = 0, thinkT = 0;
  function changed() { if (!P) return; P._base = null; if (P.sent) P.sent = 0; clearTimeout(draftT); draftT = setTimeout(function () { if (P) draftSave(pack(P)); }, 400); keys(); miniSoon(); }
  var eyeFrom = function (p, im) { var e = document.createElement('canvas'), w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, m = Math.min(w, h); e.width = e.height = 96; e.getContext('2d').drawImage(im, (w - m) / 2, (h - m) / 2, m, m, 0, 0, 96, 96); p.eye = e; };
  function eyeOf(p) { NG.loadImg(p.photo).then(function (i2) { p.img = i2; p._base = null; eyeFrom(p, i2); miniSoon(); if (S.stage >= 2) redraw(); }).catch(function () {}); }
  function spLoad(p) { NG.loadImg(p.spPhoto).then(function (i2) { p.spImg = i2; p._base = null; if (!p.img) eyeFrom(p, i2); miniSoon(); if (S.stage >= 1) { if (S.stage === 1 && !S.deep) paint(); else redraw(); } }).catch(function () {}); }
  /* the life's own photograph, when a life is caught and there is none of one's own: from iNaturalist, through the site, credited */
  function spFetch(p) {
    var f = lifeOf(p); p.spPhoto = ''; p.spImg = null; p.spCredit = ''; if (!f || !B.inat) return;
    fetch(B.inat + '/observations?taxon_name=' + encodeURIComponent(f.n) + '&photos=true&quality_grade=research&per_page=5&order_by=votes&locale=en').then(function (r) { return r.json(); }).then(function (j) {
      var o = ((j && j.results) || []).filter(function (q) { return q.photos && q.photos.length; })[0]; if (!o || lifeOf(p) !== f) return; var ph = o.photos[0];
      return NG.loadImg('/api/img?u=' + encodeURIComponent(String(ph.url).replace('square', 'medium'))).then(function (im) { p.spPhoto = NG.shrink(im, 900, 0.85); p.spCredit = String(ph.attribution || '').replace(/^\(c\)\s*/i, '© '); spLoad(p); changed(); });
    }).catch(function () {});
  }
  /* where one is: asked carefully (the precise fix first, a rough one if that is slow), and said plainly when it is refused */
  function getPos(ok, no) {
    if (!navigator.geolocation) { if (no) no(); return; }
    navigator.geolocation.getCurrentPosition(ok, function () { navigator.geolocation.getCurrentPosition(ok, function () { if (no) no(); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }); }, { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 });
  }
  function where(p) { getPos(function (g) { S.me = [g.coords.latitude, g.coords.longitude, g.coords.accuracy || 0]; if (!p || (p.src === 'PHOTO' || p.src === 'TAP')) return; p.lat = g.coords.latitude; p.lng = g.coords.longitude; p.src = 'HERE'; if (p === P) { think(); changed(); } }); }
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
      p.img = null; p.eye = null; if (p.photo) eyeOf(p);
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
  var grow = function (ta) { if (!ta.offsetParent || ta.id === 'au-tx') return; ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight + 2, 40) + 'px'; };
  var regrow = function () { [].forEach.call(panel.querySelectorAll('textarea'), grow); };
  /* W.I.S.H., each letter's words, shown only when one looks for it (a pointer on the letter, or the line in hand) */
  var WISH_SAYS = ['What we know', 'It would be great', 'So let’s create', 'Here’s how it works'];
  /* the marks one has: four to begin with, one more for every piece that reaches the wall */
  var ROUNDS = +store.get('da.aura.rounds', 0) || 0;
  var marksHave = function () { return MARK_ORDER.slice(0, Math.min(MARK_ORDER.length, 4 + ROUNDS)); };
  var PIX = { cells: 24, cur: 1, tone: 'ink', raf: 0, sub: 'jelly', seed: 1 };
  function paint() {
    var s = S.stage, h = '', pic = P && (P.photo || P.spPhoto);
    if (s === 0) {
      h = (P && P.photo ? '<figure class="au-ph"><img alt="" src="' + P.photo + '"><button class="au-rm" id="au-unph" aria-label="Let the photograph go">×</button></figure>' : '') +
        '<label class="au-line' + (P && P.say ? ' has' : '') + '"><span class="au-ask au-hint" data-on="2" data-off="10" aria-hidden="true">what have you noticed?</span><textarea id="au-say" rows="1" maxlength="200" aria-label="What have you noticed?" enterkeyhint="next"></textarea></label>' + hint(SAY.notice) + goKey(0);
    } else if (s === 1) {
      /* what was noticed comes with it: the picture, the life if caught, the day; the line becomes W */
      if (P && P.say && !P.lines[0] && P.wSay === undefined) { P.lines[0] = P.say; P.wSay = P.say; changed(); }
      var L4 = P ? P.lines : ['', '', '', ''], f = P && lifeOf(P), said = P ? [f ? f.cn : '', NG.when(P.at).slice(0, 6)].filter(Boolean).join(' · ') : '';
      h = (P && (pic || f) ? '<div class="au-whead">' + (pic ? '<img alt="" src="' + (P.photo || P.spPhoto) + '">' : '') + '<span>' + esc(said) + '</span></div>' : '') +
        '<ol class="au-wish">' + [0, 1, 2, 3].map(function (i) { return '<li><b data-say="' + esc(WISH_SAYS[i]) + '" tabindex="-1">' + 'WISH'[i] + '</b><textarea data-i="' + i + '" rows="1" maxlength="160" aria-label="' + esc(WISH_SAYS[i]) + '" enterkeyhint="next">' + esc(L4[i] || '') + '</textarea></li>'; }).join('') + '</ol>' + hint(SAY.wish) + goKey(1);
    } else if (s === 2) {
      if (ready()) { settle(); var mine = (NG.icons() || []).slice(-6), have = marksHave();
        h = '<div class="au-tray">' + have.map(function (g) { return '<button data-mark="' + g + '" class="' + (g === S.newMark ? 'new' : '') + '" aria-label="Add a mark: ' + g + '">' + markI(g) + '</button>'; }).join('') +
          STAMPS.map(function (w, g) { return '<button data-stamp="' + g + '" class="au-stamp" aria-label="A stamp: ' + esc(w) + '"><img alt="" src="' + stampThumb(g) + '"></button>'; }).join('') +
          '<label class="au-trayph" aria-label="A photograph for this piece">' + svgI('eye') + '<input type="file" accept="image/*" id="au-file2" hidden></label><button data-add="t" aria-label="Add words">' + svgI('text') + '</button><button data-add="p" class="' + (S.pix ? 'on' : '') + '" aria-label="The pixel irukandji">' + svgI('pix') + '</button>' +
          mine.map(function (ic, i) { return '<button data-ic="' + i + '" aria-label="Add your icon"><img alt="" src="' + esc(ic.src) + '"></button>'; }).join('') + '</div>' +
          (S.pix ? '<div class="au-pix"><nav class="au-subs">' + PIX_SUBS.map(function (q) { return '<button data-pxs="' + q + '" class="' + (PIX.sub === q ? 'on' : '') + '" aria-label="' + { jelly: 'The irukandji', coral: 'Coral', trash: 'Something the tide brought', clip: 'A paperclip' }[q] + '">' + svgI('px' + q) + '</button>'; }).join('') + '</nav>' +
            '<canvas width="96" height="96"></canvas><div>' + hand('au-sm', svgI('grid'), 'data-px="cells" aria-label="Cells"') + hand('au-sm', svgI('cur'), 'data-px="cur" aria-label="The current"') + (PIX.sub !== 'jelly' ? hand('au-sm', svgI('dice'), 'data-px="new" aria-label="Another one"') : '') +
            hand('au-sm', svgI('tone'), 'data-px="tone" aria-label="Its colour"') + hand('au-big au-place', svgI('plus'), 'data-px="put" aria-label="Put it on the poster"') + '</div></div>' : '') +
          '<figure class="au-poster au-drag"><canvas></canvas><div class="au-sel" hidden><textarea id="au-tx" rows="1" maxlength="90" aria-label="The words" hidden></textarea><nav class="au-tools">' +
          hand('', svgI('turn'), 'data-t="r" aria-label="Turn"') + hand('', '−', 'data-t="s-" aria-label="Smaller"') + hand('', '+', 'data-t="s+" aria-label="Larger"') + hand('', svgI('tone'), 'data-t="tone" aria-label="Tone"') + hand('', svgI('frame'), 'data-t="b" aria-label="Framed or not"') +
          hand('au-rm', '×', 'data-t="x" aria-label="Take it off"') + '</nav></div></figure>' + hint(SAY.art) + goKey(2); }
      else h = '<p class="au-empty">' + esc(SAY.artEmpty) + '</p><button class="au-go" data-go="0"><i></i>' + svgI('radio') + '<span>back to what you noticed</span></button>';
    } else {
      /* print: this piece, whole, and one press. With none being made, the wall */
      h = P ? '<figure class="au-poster au-hero"><canvas></canvas></figure>' +
        '<div class="au-press">' + hand('au-sm au-reset', svgI('again'), 'id="au-reset" aria-label="Start again: this piece is let go"') +
        hand('au-sm', svgI('paper'), 'id="au-paper" aria-label="Blue paper or white" aria-pressed="' + (P.paper === 'white') + '"') + hand('au-sm', svgI('save'), 'id="au-save" aria-label="Save"') +
        hand('au-big', svgI(P.sent ? 'seed' : 'print'), 'id="au-print" aria-label="' + (P.sent ? 'Begin a new piece' : 'Print') + '"') +
        (slides().length ? hand('au-sm', svgI('grid'), 'id="au-wallk" aria-label="The wall: everything printed"') : '') +
        '<span class="au-pips" id="au-pips">' + (P.sent && P.note && P.note.sent ? NG.pips(P.note.sent.s) : '') + '</span></div>' + hint(SAY.print) : wallHTML();
    }
    if (!SH.pswp) strays(); panel.innerHTML = '<div class="au-in">' + h + '</div>'; wire(s); cls(); if (s !== 2 || !S.pix) pixStop();
  }
  function wire(s) {
    [].forEach.call(panel.querySelectorAll('[data-go]'), function (b) { b.addEventListener('click', function () { var to = +b.dataset.go; if (S.stage === 0 && P) { var sy = $('#au-say'); if (sy) { P.say = sy.value.trim(); think(); } } step(to); }); });
    regrow(); [].forEach.call(panel.querySelectorAll('textarea'), function (ta) { ta.addEventListener('input', function () { grow(ta); }); });
    if (s === 0) {
      var ph2 = panel.querySelector('.au-ph img'); if (ph2) ph2.addEventListener('click', function () { show([{ src: P.photo }], 0, true); });
      var un = $('#au-unph'); if (un) un.addEventListener('click', function (e) { e.stopPropagation(); P.photo = P.thumb = ''; P.img = P.eye = null; if (P.spImg) eyeFrom(P, P.spImg); if (P.note) delete NG.PHOTOS[P.note.id]; changed(); paint(); bell(1, 0.16); });
      var say = $('#au-say'), lab = say.parentNode; if (P) say.value = P.say || '';
      /* kept as it is typed: changing step never loses a word */
      var keep = function () { var v = say.value.trim(); if (!v && !P) return; var p = piece(); if (p.lines[0] === (p.wSay || '')) { p.lines[0] = v; p.wSay = v; } p.say = v; changed(); clearTimeout(thinkT); thinkT = setTimeout(think, 300); };
      say.addEventListener('input', function () { lab.classList.toggle('has', !!say.value); keep(); });
      say.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); think(); if (ready()) step(1); } });
    }
    if (s === 1) {
      [].forEach.call(panel.querySelectorAll('textarea[data-i]'), function (ta) { var i = +ta.dataset.i;
        var keep = function () { var v = ta.value.trim(); if (!v && !P) return; var p = piece(); p.lines[i] = v; if (i === 0) p.wSay = v === p.say ? v : null; if (p.note) { p.note.wishText = p.lines.slice(); p.note.wish = p.lines.some(Boolean); NG.saveNotes(); } changed(); };
        ta.addEventListener('input', keep);
        ta.addEventListener('keydown', function (e) { if (e.key !== 'Enter') return; e.preventDefault(); keep(); bell(i + 1, 0.16); var nx = panel.querySelector('textarea[data-i="' + (i + 1) + '"]'); if (nx) nx.focus(); else if (ready()) step(2); }); });
    }
    if (s === 2 && ready()) {
      var add = function (a) { a.x = 0.3 + Math.random() * 0.2; a.y = 0.12 + Math.random() * 0.2; P.adds.push(a); S.sel = 'a' + (P.adds.length - 1); changed(); redraw(); bell(6, 0.18); if (a.k === 't') setTimeout(function () { var t2 = $('#au-tx'); if (t2) t2.focus(); }, 80); };
      [].forEach.call(panel.querySelectorAll('[data-mark]'), function (b) { b.addEventListener('click', function () { if (b.dataset.mark === S.newMark) S.newMark = null; add({ k: 's', g: b.dataset.mark }); }); });
      [].forEach.call(panel.querySelectorAll('[data-stamp]'), function (b) { b.addEventListener('click', function () { add({ k: 'st', g: +b.dataset.stamp, r: Math.round(Math.random() * 24 - 12) }); }); });
      [].forEach.call(panel.querySelectorAll('[data-ic]'), function (b) { b.addEventListener('click', function () { var ic = (NG.icons() || []).slice(-6)[+b.dataset.ic]; if (ic) add({ k: 'i', src: ic.src }); }); });
      panel.querySelector('[data-add="t"]').addEventListener('click', function () { add({ k: 't', t: '' }); });
      panel.querySelector('[data-add="p"]').addEventListener('click', function () { S.pix = !S.pix; paint(); bell(7, 0.16); });
      [].forEach.call(panel.querySelectorAll('[data-px]'), function (b) { b.addEventListener('click', function () { var k = b.dataset.px;
        if (k === 'cells') PIX.cells = PIX.cells === 16 ? 24 : PIX.cells === 24 ? 32 : 16; else if (k === 'cur') PIX.cur = PIX.cur % 3 + 1; else if (k === 'tone') { var tn = ['ink', 'blue'].concat(PIX.sub !== 'jelly' ? ['colour'] : [], picOf(P) ? ['photo'] : []); PIX.tone = tn[(tn.indexOf(PIX.tone) + 1) % tn.length]; }
        else if (k === 'new') PIX.seed = 1 + Math.floor(Math.random() * 9999);
        else add({ k: 'p', sub: PIX.sub, seed: PIX.seed, cells: PIX.cells, ph: (performance.now() / 1000) * PIX.cur, tone2: PIX.tone }); bell(2, 0.12); }); });
      [].forEach.call(panel.querySelectorAll('[data-pxs]'), function (b) { b.addEventListener('click', function () { PIX.sub = b.dataset.pxs; PIX.seed = 1 + Math.floor(Math.random() * 9999); if (PIX.sub === 'jelly' && PIX.tone === 'colour') PIX.tone = 'ink'; paint(); bell(4, 0.12); }); });
      var tx = $('#au-tx'); tx.addEventListener('input', function () { var a = selAdd(); if (a && a.k === 't') { a.t = tx.value; changed(); redraw(); } });
      [].forEach.call(panel.querySelectorAll('[data-t]'), function (b) { b.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); b.addEventListener('click', function (e) { e.stopPropagation(); tool(b.dataset.t); }); });
      $('#au-file2').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; intake(f); setTimeout(redraw, 900); setTimeout(redraw, 1800); });
      redraw(); dragWire(); if (S.pix) pixRun();
    }
    if (s === 3) {
      if (!P) { wallWire(); return; }
      redraw();
      $('#au-print').addEventListener('click', function () { if (P.sent) { letGo(); return; } printNow(); });
      $('#au-save').addEventListener('click', function () { poster(P).then(function (c) { NG.download(c, 'novel-global-' + ((P.note && P.note.code) || 'piece') + '.png'); bell(3, 0.18); }); });
      $('#au-paper').addEventListener('click', function () { P.paper = P.paper === 'white' ? 'blue' : 'white'; changed(); redraw(); this.setAttribute('aria-pressed', String(P.paper === 'white')); bell(5, 0.16); });
      var wk = $('#au-wallk'); if (wk) wk.addEventListener('click', function () { show(slides(), 0); });
      NG.sureTap($('#au-reset'), function () { letGo(); });
      panel.querySelector('.au-hero').addEventListener('click', function () { var c = panel.querySelector('.au-hero canvas'); show([{ src: c.toDataURL('image/jpeg', 0.9) }], 0, true); });
    }
  }
  /* the piece let go: a new one begins at the eye. What was printed stays on the wall */
  function letGo() { fresh(); if (S.stage === 0) paint(); else step(0); bell(0, 0.24); }
  /* the pixel irukandji: animated while it is being made; put on the poster, one moment of it, in its cells */
  function pixRun() { pixStop(); var c = panel.querySelector('.au-pix canvas'); if (!c) return; var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    (function tick() { var cc = panel.querySelector('.au-pix canvas'); if (!cc) return; var pj = pixArt(PIX.sub, PIX.cells, (performance.now() / 1000) * PIX.cur, PIX.tone, picOf(P), PIX.seed); g.clearRect(0, 0, 96, 96); g.drawImage(pj, 0, 0, 96, 96); PIX.raf = requestAnimationFrame(tick); })(); }
  function pixStop() { if (PIX.raf) cancelAnimationFrame(PIX.raf); PIX.raf = 0; }
  /* the art: the poster; what is caught or added, placed, turned, sized, toned, framed, taken off, rewritten by hand; the picture's own tone */
  var lastBoxes = {}, artRaf = 0;
  var selAdd = function () { return S.sel && S.sel.charAt(0) === 'a' && S.sel.length > 1 && P.adds ? P.adds[+S.sel.slice(1)] : null; };
  var tfOf = function (k) { if (k.charAt(0) === 'a' && k.length > 1) return P.adds[+k.slice(1)]; P.tf = P.tf || {}; return P.tf[k] || (P.tf[k] = {}); };
  function tool(t) {
    var k = S.sel; if (!k || !P) return;
    if (k === 'pic') { if (t === 'tone') { P.ptone = TONES[(TONES.indexOf(P.ptone || 'as') + 1) % TONES.length]; } else if (t === 'x') { P.photo = P.thumb = ''; P.img = P.eye = null; P.spPhoto = ''; P.spImg = null; S.sel = null; } else return; changed(); redraw(); bell(3, 0.14); return; }
    var tf = tfOf(k);
    if (t === 'r') tf.r = ((tf.r || 0) + 15) % 360; else if (t === 's-') tf.s = Math.max(0.4, (tf.s || 1) - 0.15); else if (t === 's+') tf.s = Math.min(2.6, (tf.s || 1) + 0.15);
    else if (t === 'tone') tf.tone = tf.tone === 'turn' ? 'clear' : tf.tone === 'clear' ? 'ink' : 'turn'; else if (t === 'b') tf.b = tf.k === 'st' ? !tf.b : tf.b === false; else if (t === 'x') { takeOff(k); return; }
    changed(); redraw(); bell(t === 'r' ? 4 : 2, 0.12);
  }
  function redraw() {
    if (!P) return; var sel = S.stage === 2 ? '.au-drag canvas' : '.au-hero canvas', f = panel.querySelector(sel); if (!f) return;
    var go2 = function () { fontReady().then(function () { var g = panel.querySelector(sel); if (!g || !P) return; var o = posterNow(P); lastBoxes = o.boxes; g.width = o.c.width; g.height = o.c.height; g.getContext('2d').drawImage(o.c, 0, 0); selBox(); }); };
    if (P.photo && !P.img) NG.loadImg(P.photo).then(function (im) { P.img = im; P._base = null; go2(); }).catch(go2); else go2();
  }
  api.redraw = function () { redraw(); };
  /* the chosen thing, outlined where it lies, its tools under it; words are written straight onto it */
  function selBox() {
    var box = panel.querySelector('.au-sel'), c = panel.querySelector('.au-drag canvas'); if (!box || !c) return;
    var b = S.sel && (S.sel === 'pic' ? P._base && P._base.art : lastBoxes[S.sel]); if (!b) { box.hidden = true; return; }
    var r = c.getBoundingClientRect(), fr = c.parentNode.getBoundingClientRect(), k = r.width / c.width;
    box.hidden = false; box.style.left = (r.left - fr.left + b[0] * k - 4) + 'px'; box.style.top = (r.top - fr.top + b[1] * k - 4) + 'px'; box.style.width = (b[2] * k + 8) + 'px'; box.style.height = (b[3] * k + 8) + 'px';
    box.classList.toggle('pic', S.sel === 'pic'); box.classList.toggle('low', (b[1] + b[3]) * k > r.height - 60);
    var a = selAdd(), tx = $('#au-tx'); if (tx) { tx.hidden = !(a && a.k === 't'); if (a && a.k === 't' && document.activeElement !== tx) tx.value = a.t || ''; }
  }
  function takeOff(k) {
    if (!k || !P) return; if (k.charAt(0) === 'a' && k.length > 1) P.adds.splice(+k.slice(1), 1);
    else if (k === 'map') P.catch.map = false; else if (k === 'life') { P.catch.life = ''; P.spPhoto = ''; P.spImg = null; think(); } else if (k === 'data') P.catch.data = []; else if (k === 'nino') P.catch.nino = false;
    delete P.pos[k]; if (P.tf) delete P.tf[k]; S.sel = null; changed(); redraw(); bell(1, 0.16); fillDots();
  }
  function dragWire() {
    var c = panel.querySelector('.au-drag canvas'), hold = null;
    var at = function (e) { var r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
    var inb = function (p, b) { return b && p[0] >= b[0] && p[0] <= b[0] + b[2] && p[1] >= b[1] && p[1] <= b[1] + b[3]; };
    var hit = function (p) { var k = null; Object.keys(lastBoxes).forEach(function (q) { if (inb(p, lastBoxes[q])) k = q; }); if (!k && P._base && inb(p, P._base.art)) k = 'pic'; return k; };
    c.addEventListener('pointerdown', function (e) { var p = at(e), k = hit(p);
      if (!k) { if (S.sel) { S.sel = null; selBox(); } return; }
      S.sel = k; selBox(); if (k === 'pic') return;
      e.preventDefault(); hold = { k: k, dx: p[0] - lastBoxes[k][0], dy: p[1] - lastBoxes[k][1], moved: 0, x0: e.clientX, y0: e.clientY }; try { c.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } c.classList.add('holding'); });
    c.addEventListener('pointermove', function (e) {
      var p = at(e); if (!hold) { c.style.cursor = hit(p) ? 'grab' : ''; return; }
      hold.moved = Math.max(hold.moved, Math.abs(e.clientX - hold.x0) + Math.abs(e.clientY - hold.y0));
      var b = lastBoxes[hold.k], W = c.width, H = c.height, nx = Math.max(0, Math.min(W - b[2], p[0] - hold.dx)) / W, ny = Math.max(0, Math.min(H - b[3], p[1] - hold.dy)) / H;
      if (hold.k.charAt(0) === 'a' && hold.k.length > 1) { var a = P.adds[+hold.k.slice(1)]; a.x = nx; a.y = ny; } else P.pos[hold.k] = [nx, ny];
      if (!artRaf) artRaf = requestAnimationFrame(function () { artRaf = 0; redraw(); }); });
    var up = function () { if (!hold) return; var mv = hold.moved; hold = null; c.classList.remove('holding'); if (mv > 4) { changed(); bell(2, 0.14); } else { var a = selAdd(); if (a && a.k === 't') { var tx = $('#au-tx'); if (tx) tx.focus(); } } };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  }
  /* print: the receipt for the thermal head (the base's own, its photograph through the print pipeline, its code back to the site), the poster
     kept in colour on the wall. The round is over: the receipt goes up the print tentacle into the bell, a bead is added to its crown, a mark is earned */
  /* the poster itself on the receipt: drawn on white paper so the ink is the dark, taken to the printer's width and dots (the same
     pipeline as every printed photograph), and its code set again crisp, a whole number of dots to each module so a phone can read it */
  function posterPrint(W) {
    if (!NG.forPrint || !NG.ditherLib) return Promise.resolve(null);
    return Promise.all([fontReady(), NG.ditherLib()]).then(function (r) {
      var keep = P.paper; P.paper = 'white'; P._base = null; var pc = posterNow(P), B0 = P._base; P.paper = keep; P._base = null;
      var out = NG.forPrint(pc.c, W, r[1]), q = B0 && B0.qr; if (!q) { S.lastPrint = [out.width, out.height]; return out; }
      var k = W / B0.W, o = out.getContext('2d'), mc = q.q.getModuleCount(), cell = Math.max(3, Math.floor(q.s * k / mc)), side = cell * mc, x0 = Math.round((q.x + q.s) * k - side), y0 = Math.round((q.y + q.s) * k - side);
      o.fillStyle = '#fff'; o.fillRect(x0 - cell * 2, y0 - cell * 2, side + cell * 4, side + cell * 4); o.fillStyle = '#000';
      for (var a = 0; a < mc; a++) for (var b = 0; b < mc; b++) if (q.q.isDark(a, b)) o.fillRect(x0 + b * cell, y0 + a * cell, cell, cell);
      S.lastPrint = [out.width, out.height]; return out;
    }).catch(function () { return null; });
  }
  function printNow() {
    var n = settle(); if (!n) return; var btn = $('#au-print'), st = $('#au-pips'); btn.disabled = true; btn.classList.add('going'); st.innerHTML = NG.pips('sending');
    var art = P.photo ? 'photo' : 'net', photo = NG.PHOTOS[n.id] || P.photo || P.spPhoto || '', show2 = { line: 1, life: !!lifeOf(P), facts: 0, links: 0, code: 1 };
    NG.printers().then(function (list) {
      var ps = list.filter(function (p) { return p.paired || p.id === (B.master && B.master.id); }), dest = ps.length ? ps[0].id : (B.master ? B.master.id : 'novelglobal'), paper2 = ps.length ? ps[0].paper : (B.master && B.master.paper) || 80;
      var Pp = (B.printers || {})[String(paper2 || 80)] || { dots: 512 }, W = Pp.dots - Pp.dots % 8;
      return posterPrint(W).then(function (c) { return c || NG.slip(n, photo, { lines: [], rel: [], call: null }, { art: photo ? 'photo' : art, wish: n.wish, show: show2 }, W); }).then(function (c) { return NG.sendNote(n, c, dest, n.wish); });
    }).then(function (s) {
      st.innerHTML = NG.pips(s); btn.classList.remove('going'); if (n.sent && n.sent.id) NG.follow(n, st); harp([0, 2, 4, 7]);
      return poster(P).then(function (c) {
        var first = !P.folioId, item = { id: P.folioId || 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), src: c.toDataURL('image/jpeg', 0.86), cap: titleOf(P), code: n.code };
        P.folioId = item.id; P.sent = 1; item.piece = pack(P); folioKeep(item); draftSave(pack(P)); miniMake();
        if (first) { ROUNDS++; store.set('da.aura.rounds', ROUNDS); var have = marksHave(); if (have.length > 4 && ROUNDS + 4 <= MARK_ORDER.length) S.newMark = have[have.length - 1]; }
        S.round = performance.now() / 1000; S.sting = S.round;
        btn.disabled = false; btn.innerHTML = svgI('seed'); btn.setAttribute('aria-label', 'Begin a new piece');
        var hero = panel.querySelector('.au-hero'); if (hero) hero.classList.add('kept');
        setTimeout(function () { if (S.stage === 3) show(slides(), slides().map(function (q) { return q.id; }).indexOf(item.id)); }, 2400);
      });
    }).catch(function () { st.innerHTML = NG.pips('failed'); btn.disabled = false; btn.classList.remove('going'); });
  }
  /* the wall, when nothing is being made: every finished piece in a light carousel (Embla), the one in front whole and its neighbours
     just showing either side. Dragged or swiped along; a touch opens it full screen; the one in front can be brought back or taken down */
  var WALL = 0, EMB = null;
  function wallHTML() {
    var all = slides(); if (!all.length) return ''; WALL = Math.min(WALL, all.length - 1);
    return '<div class="au-wall"><div class="au-etrack">' + all.map(function (f, i) { return '<figure class="au-eslide" data-n="' + i + '"><img alt="" src="' + f.src + '"></figure>'; }).join('') + '</div></div>' +
      (all.length > 1 ? '<nav class="au-wdots">' + all.map(function (q, i) { return '<i class="' + (i === WALL ? 'on' : '') + '"></i>'; }).join('') + '</nav>' : '') +
      '<div class="au-press" id="au-wpress"></div>' + hint(SAY.wall);
  }
  function wallPress() {
    var all = slides(), f = all[WALL], pr = $('#au-wpress'); if (!f || !pr) return;
    pr.innerHTML = (all.length > 1 ? hand('au-sm au-nav', '‹', 'data-w="-1" aria-label="Before"') : '') +
      (f.piece ? hand('au-big', svgI('back'), 'id="au-bring" aria-label="Bring it back to work on"') : '') +
      (FOLIO.some(function (q) { return q.id === f.id; }) ? hand('au-sm', svgI('bin'), 'id="au-drop" aria-label="Take it down"') : '') +
      (all.length > 1 ? hand('au-sm au-nav', '›', 'data-w="1" aria-label="After"') : '');
    [].forEach.call(pr.querySelectorAll('[data-w]'), function (b) { b.addEventListener('click', function () { if (EMB) { if (+b.dataset.w > 0) EMB.scrollNext(); else EMB.scrollPrev(); } else { WALL = (WALL + (+b.dataset.w) + all.length) % all.length; paint(); } }); });
    var br = $('#au-bring'); if (br) br.addEventListener('click', function () { P = unpack(f.piece); P.sent = 0; think(); draftSave(pack(P)); miniSoon(); bell(5, 0.22); step(2); });
    var dr = $('#au-drop'); if (dr) NG.sureTap(dr, function () { folioDrop(f.id).then(function () { WALL = Math.max(0, WALL - 1); paint(); }); bell(1, 0.16); });
    [].forEach.call(panel.querySelectorAll('.au-wdots i'), function (d, i) { d.classList.toggle('on', i === WALL); });
    [].forEach.call(panel.querySelectorAll('.au-eslide'), function (e2, i) { e2.classList.toggle('on', i === WALL); });
  }
  function wallWire() {
    var all = slides(), vp = panel.querySelector('.au-wall'); if (!all.length || !vp) return; if (EMB) { try { EMB.destroy(); } catch (e) { /* gone */ } EMB = null; }
    wallPress();
    [].forEach.call(vp.querySelectorAll('.au-eslide'), function (fg) { fg.addEventListener('click', function () { var n2 = +fg.dataset.n; if (n2 !== WALL && EMB) { EMB.scrollTo(n2); return; } show(slides(), n2); }); });
    NG.lib('embla', function () { return window.EmblaCarousel; }).then(function (ok) {
      if (!ok || !document.contains(vp)) return; EMB = window.EmblaCarousel(vp, { align: 'center', loop: false, startIndex: WALL, skipSnaps: false, dragFree: false });
      EMB.on('select', function () { WALL = EMB.selectedScrollSnap(); wallPress(); bell(2, 0.06); try { if (navigator.vibrate) navigator.vibrate(5); } catch (e) { /* no touch */ } });
    });
  }

  /* ───────── the viewer (PhotoSwipe): every picture whole and full screen on the blueprint, with nothing else round it. Swiped, pinched,
     double-tapped or wheeled closer, flicked down to close; the close sits on the picture's own corner, and each turn is felt and heard ───────── */
  var SH = { pswp: null };
  var sizeOf = function (f) { return f.w ? Promise.resolve(f) : new Promise(function (res) { var im = new Image(); im.onload = function () { f.w = im.naturalWidth; f.h = im.naturalHeight; res(f); }; im.onerror = function () { f.w = 900; f.h = 1300; res(f); }; im.src = f.src; }); };
  var pswpCss = function () { if (document.querySelector('link[data-pswp]')) return; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'vendor/photoswipe.css'; l.setAttribute('data-pswp', '1'); document.head.appendChild(l); };
  function show(list, i, one) {
    if (!list || !list.length || SH.opening) return; pswpCss(); SH.opening = 1; SH.n = (SH.n || 0) + 1;
    Promise.all([NG.lib('photoswipe', function () { return window.PhotoSwipe; })].concat(list.map(sizeOf))).catch(function () { return [null]; }).then(function (r) {
      SH.opening = 0; if (!r[0]) return; if (SH.pswp) SH.pswp.destroy(); var many = list.length > 1 && !one;
      var ps = new window.PhotoSwipe({ dataSource: list.map(function (f) { return { src: f.src, width: f.w, height: f.h, alt: f.cap || '' }; }), index: Math.max(0, Math.min(list.length - 1, i || 0)),
        mainClass: 'au-pswp', bgOpacity: 1, showHideAnimationType: 'none', loop: many, wheelToZoom: true, maxZoomLevel: 6, secondaryZoomLevel: 2.5,
        imageClickAction: 'zoom-or-close', tapAction: 'close', doubleTapAction: 'zoom', closeOnVerticalDrag: true, padding: { top: 36, bottom: 48, left: 12, right: 12 },
        counter: false, zoom: false, close: false, arrowPrev: many, arrowNext: many, arrowPrevTitle: 'Before', arrowNextTitle: 'After', errorMsg: '' });
      ps.on('uiRegister', function () {
        ps.ui.registerElement({ name: 'aux', order: 9, isButton: true, tagName: 'button', title: '', ariaLabel: 'Close', html: '×', onClick: function () { unshow(); }, appendTo: 'root', onInit: function (el) {
          el.classList.add('au-x'); var pin = function () { var s2 = ps.currSlide, im = s2 && s2.content && s2.content.element; if (!im) return; var rc = im.getBoundingClientRect(); if (!rc.width) return;
            var X = Math.min(innerWidth - 50, Math.max(6, rc.right - 24)), Y = Math.min(innerHeight - 50, Math.max(6, rc.top - 20)); el.style.transform = 'translate(' + X.toFixed(0) + 'px,' + Y.toFixed(0) + 'px)'; };
          ['change', 'zoomPanUpdate', 'resize', 'imageSizeChange', 'loadComplete', 'openingAnimationEnd'].forEach(function (ev) { ps.on(ev, function () { requestAnimationFrame(pin); }); }); } });
        ps.ui.registerElement({ name: 'audots', order: 10, appendTo: 'root', onInit: function (el) { el.className = 'au-dots';
          var dr = function () { el.innerHTML = many ? list.map(function (q, k) { return '<button data-k="' + k + '" class="' + (k === ps.currIndex ? 'on' : '') + '" aria-label="' + (k + 1) + '"></button>'; }).join('') : '';
            [].forEach.call(el.querySelectorAll('button'), function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); ps.goTo(+b.dataset.k); }); }); };
          ps.on('change', dr); dr(); } });
      });
      ps.on('change', function () { try { if (navigator.vibrate) navigator.vibrate(6); } catch (e) { /* no touch */ } bell(2, 0.07); });
      ps.on('destroy', function () { SH.d = (SH.d || 0) + 1; if (SH.pswp === ps) SH.pswp = null; root.classList.remove('showing'); setTimeout(strays, 60); });
      SH.pswp = ps; root.classList.add('showing'); ps.init();
    });
  }
  /* closed at any moment, even while it is still opening */
  function unshow() { var ps = SH.pswp; if (!ps) return; if (ps.opener && !ps.opener.isOpen) ps.destroy(); else ps.close(); }
  /* nothing of a closed viewer is ever left over the page */
  function strays() { [].forEach.call(document.querySelectorAll('.pswp'), function (e) { if (!SH.pswp || e !== SH.pswp.element) e.remove(); }); }
  document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; if (SH.pswp) { unshow(); return; } strays(); if (S.deep) closeDeep(); });

  /* ───────── the catch: the one thing it holds. The ground, the life, the readings, El Niño, all in one place, with no words over
     them; whatever is touched is caught onto the piece, and only that ever shows ───────── */
  var MAPV = { z: 16, lat: 0, lng: 0, draw: null };
  function openDeep() {
    if (S.stage === 3) return; S.deep = true; deep.hidden = false; cls(); var p = piece(); think();
    deep.innerHTML = '<button class="au-back" id="au-dx" aria-label="Back"><i></i></button>' +
      '<div class="au-c"><div class="au-cmap' + (p.catch.map ? ' on' : '') + '" id="au-cmap"><div class="au-map" id="au-map"><div class="au-tiles"></div><canvas></canvas></div><button class="au-me" id="au-me" aria-label="Find where I am"><i></i></button></div>' + hint(SAY.map) +
      '<details class="au-near" id="au-near"><summary aria-label="What is near here">' + svgI('near') + '<i></i></summary><ul id="au-nearl"></ul></details>' + hint(SAY.near) +
      '<label class="au-find"><svg class="au-i" viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="13" r="8"/><path d="M19 19l8 8"/></svg><input id="au-q" type="search" autocomplete="off" aria-label="Find a life"></label>' + hint(SAY.find) + '<ul class="au-names" id="au-names"></ul>' +
      '<details class="au-near au-rd" id="au-rd" open><summary aria-label="The readings here">' + svgI('cur') + '<i></i></summary><ul class="au-vals" id="au-vals"></ul></details>' + hint(SAY.vals) + '<div class="au-now"><button class="au-nino" id="au-nino" aria-pressed="' + !!p.catch.nino + '"></button>' +
      '<button class="au-seab" id="au-seab" aria-expanded="false" aria-label="This month: what to watch for, near here">' + svgI('moon2') + '<b>' + esc(NG.when(Date.now()).replace(/^\d+\s*/, '').slice(0, 3)) + '</b></button></div><p class="au-why">' + esc(NINO_WHY) + '</p>' + hint(SAY.month) + '<ul class="au-sea" id="au-sea" hidden></ul></div>';
    $('#au-dx').addEventListener('click', closeDeep);
    lens(); NG.db().then(function () { think(); fill(); }); fill();
    $('#au-q').addEventListener('input', fill);
    $('#au-me').addEventListener('click', function () { findMe(true); });
    $('#au-seab').addEventListener('click', function () { var ul = $('#au-sea'), op = ul.hidden; ul.hidden = !op; this.setAttribute('aria-expanded', String(op)); this.classList.toggle('on', op); if (op) { seaFill(); nearFill(); } bell(op ? 5 : 1, 0.14); });
    $('#au-near').addEventListener('toggle', function () { if (this.open) nearFill(); bell(3, 0.14); });
    /* the map shows where one is: asked for, unless the photograph already said */
    findMe(p.src === 'MAP');
  }
  /* where one is: the phone asked, the piece moved there (unless the photograph or a touch already placed it), the lens and what is near following */
  function findMe(move) {
    var b2 = $('#au-me'); if (!navigator.geolocation) { if (b2) b2.classList.add('no'); return; } if (b2) { b2.classList.remove('no'); b2.classList.add('wait'); }
    getPos(function (g) {
      S.me = [g.coords.latitude, g.coords.longitude, g.coords.accuracy || 0]; var b3 = $('#au-me'); if (b3) { b3.classList.remove('wait'); b3.classList.add('on'); }
      if (P && (move || P.src === 'MAP')) { P.lat = S.me[0]; P.lng = S.me[1]; P.src = 'HERE'; NEAR = null; think(); if (P.note) { P.note.lat = +P.lat.toFixed(5); P.note.lng = +P.lng.toFixed(5); NG.saveNotes(); } changed(); }
      MAPV.lat = P ? P.lat : S.me[0]; MAPV.lng = P ? P.lng : S.me[1]; if (MAPV.draw && S.deep) MAPV.draw(); if (S.deep) { fill(); var nr = $('#au-near'); if (nr && nr.open) nearFill(); }
    }, function () { var b3 = $('#au-me'); if (b3) { b3.classList.remove('wait'); b3.classList.add('no'); } });
  }
  /* what is near, for this place only: the named places and waters the engine knows, and the lives seen here lately. Folded away until opened; a touch catches one */
  var NEAR = null;
  function nearFill() {
    var ul = $('#au-nearl'); if (!ul || !P) return; var D = NG.DB(), here = { lat: P.lat, lng: P.lng }, key = P.lat.toFixed(4) + ',' + P.lng.toFixed(4);
    var rows = []; if (D) [['places', 900, 4], ['waters', 1500, 2]].forEach(function (k) { (D[k[0]] || []).map(function (q) { return [q[0], NG.dist(here, { lat: q[1], lng: q[2] })]; }).filter(function (q) { return q[1] < k[1]; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, k[2]).forEach(function (q) { rows.push({ k: 'd', t: q[0], d: q[1] }); }); });
    var draw = function () {
      var all = rows.concat(NEAR && NEAR.key === key ? NEAR.lives : []);
      ul.innerHTML = all.length ? all.map(function (o, i) { var v = o.t + ' · ' + NG.far(Math.round(o.d)), on = o.k === 'l' ? P.catch.life === o.id : P.catch.data.indexOf(v) >= 0; return '<li><button data-n="' + i + '" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '">' + esc(o.t) + '<small>' + esc(NG.far(Math.round(o.d))) + '</small></button></li>'; }).join('') : '<li class="au-wait"><i></i><i></i><i></i></li>';
      [].forEach.call(ul.querySelectorAll('[data-n]'), function (b) { b.addEventListener('click', function () { var o = all[+b.dataset.n], v = o.t + ' · ' + NG.far(Math.round(o.d)), on;
        if (o.k === 'l') { on = P.catch.life !== o.id; P.catch.life = on ? o.id : ''; P.revealed = 0; think(); spFetch(P); }
        else { var i = P.catch.data.indexOf(v); on = i < 0; if (on) P.catch.data.push(v); else P.catch.data.splice(i, 1); P.dirty = true; }
        draw(); fill(); ping(on); }); });
    };
    draw();
    if (!NEAR || NEAR.key !== key) { NEAR = { key: key, lives: [] }; if (B.inat) fetch(B.inat + '/observations?lat=' + P.lat.toFixed(4) + '&lng=' + P.lng.toFixed(4) + '&radius=1&per_page=20&order=desc&order_by=observed_on&geoprivacy=open&verifiable=true&locale=en').then(function (r) { return r.json(); }).then(function (j) {
      var seen = {}, D2 = NG.DB(); (j && j.results || []).forEach(function (o) { var tx = o.taxon || {}, cn = tx.preferred_common_name || tx.name, c = o.geojson && o.geojson.coordinates; if (!cn || !c || seen[cn.toLowerCase()]) return; seen[cn.toLowerCase()] = 1;
        var f = D2 && D2.field.filter(function (q) { return q.cn.toLowerCase() === cn.toLowerCase() || q.n === tx.name; })[0]; if (!f) return; NEAR.all = NEAR.all || {}; NEAR.all[f.id] = NG.dist(here, { lat: +c[1], lng: +c[0] }); NEAR.lives.push({ k: 'l', id: f.id, t: f.cn, d: NG.dist(here, { lat: +c[1], lng: +c[0] }) }); });
      NEAR.lives = NEAR.lives.slice(0, 5); if (NEAR.key === key) { draw(); seaFill(); } }).catch(function () {}); }
  }
  /* this month: what to watch for, as a short table. The month's own stories first (the young on the ground, swooping, the heat, El Niño),
     then the lives in season, each with why it matters and who depends on it; those seen within a kilometre of here come first, with how far.
     Folded until asked; a touch catches the line (a life as the life, a story as a reading) */
  function seaFill() {
    var ul = $('#au-sea'); if (!ul || ul.hidden || !P) return; var D = NG.DB(); if (!D) { ul.innerHTML = '<li class="au-wait"><i></i><i></i><i></i></li>'; return; }
    var here = { lat: P.lat, lng: P.lng }, near = (NEAR && NEAR.all) || {}, rows = [];
    var water = function () { var w = (D.waters || []).map(function (q) { return [q[0], NG.dist(here, { lat: q[1], lng: q[2] })]; }).filter(function (q) { return q[1] < 1000; }).sort(function (a, b) { return a[1] - b[1]; })[0]; return w ? w[0] + ' ' + NG.far(Math.round(w[1])) : ''; };
    (NG.nowItems() || []).forEach(function (i) { if (/NIÑO/.test(i.k)) return; rows.push({ t: i.k.charAt(0) + i.k.slice(1).toLowerCase(), d: i.t, v: i.k.toLowerCase() + ' · ' + NG.when(Date.now()).replace(/^\d+\s*/, '').slice(0, 3).toLowerCase(), near: '' }); });
    var sn = (NG.seasonNow() || []).map(function (f) { var dn = near[f.id]; return { f: f, d: dn, w: /frog|waterbird|fish|turtle|duck/.test(f.g || '') ? water() : '' }; });
    sn.sort(function (a, b) { return (a.d == null ? 1e9 : a.d) - (b.d == null ? 1e9 : b.d) || (b.f.st === 'T' || b.f.st === 'E') - (a.f.st === 'T' || a.f.st === 'E'); });
    sn.slice(0, 9).forEach(function (q) { var f = q.f; rows.push({ id: f.id, t: f.cn, e: f.event || '', d: [f.aware, f.note].filter(Boolean).join('. ').replace(/\.\./g, '.'), near: q.d != null ? NG.far(Math.round(q.d)) : q.w }); });
    ul.innerHTML = rows.map(function (r, i) { var on = r.id ? P.catch.life === r.id : P.catch.data.indexOf(r.v) >= 0;
      return '<li><button data-se="' + i + '" class="' + (on ? 'on' : '') + (r.near ? ' near' : '') + '" aria-pressed="' + on + '"><span class="t">' + esc(r.t) + (r.e ? ' <i>' + esc(r.e) + '</i>' : '') + '</span>' + (r.near ? '<small>' + esc(r.near) + '</small>' : '') + (r.d ? '<em>' + esc(r.d) + '</em>' : '') + '</button></li>'; }).join('');
    [].forEach.call(ul.querySelectorAll('[data-se]'), function (b) { b.addEventListener('click', function () { var r = rows[+b.dataset.se], on;
      if (r.id) { on = P.catch.life !== r.id; P.catch.life = on ? r.id : ''; P.revealed = 0; think(); spFetch(P); }
      else { var k = P.catch.data.indexOf(r.v); on = k < 0; if (on) P.catch.data.push(r.v); else P.catch.data.splice(k, 1); P.dirty = true; }
      fill(); seaFill(); ping(on); }); });
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
    [].forEach.call(ul.querySelectorAll('[data-sp]'), function (b) { b.addEventListener('click', function () { var on = P.catch.life !== b.dataset.sp; P.catch.life = on ? b.dataset.sp : ''; P.revealed = 0; think(); spFetch(P); if (!on && P.eye && !P.img) P.eye = null; fill(); ping(on); }); });
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
    MAPV.lat = p.lat; MAPV.lng = p.lng; MAPV.z = 16; NEAR = NEAR && NEAR.key === p.lat.toFixed(4) + ',' + p.lng.toFixed(4) ? NEAR : null;
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
      if (S.me) { var sm = at(S.me[0], S.me[1]); g.globalAlpha = 0.25; g.beginPath(); g.arc(sm[0], sm[1], Math.max(10, Math.min(60, S.me[2] / (156543 * Math.cos(S.me[0] * Math.PI / 180) / Math.pow(2, z)))), 0, 7); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(sm[0], sm[1], 4.5, 0, 7); g.fill(); g.beginPath(); g.arc(sm[0], sm[1], 8, 0, 7); g.stroke(); }
      g.globalAlpha = 1; g.lineWidth = 1.4; g.beginPath(); g.arc(s0[0], s0[1], 9, Math.PI, 0); g.closePath(); g.stroke();
      for (var i = 0; i < 4; i++) for (var j = 1; j < 5; j++) { g.beginPath(); g.arc(s0[0] - 6 + i * 4, s0[1] + j * 4, 1, 0, 7); g.fill(); }
    }
    MAPV.draw = draw; draw(); setTimeout(draw, 60);
    var drag = null, moved = 0;
    el.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY, wx(MAPV.lng, MAPV.z), wy(MAPV.lat, MAPV.z)]; moved = 0; try { el.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } });
    el.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag[0], dy = e.clientY - drag[1]; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); MAPV.lng = ux(drag[2] - dx, MAPV.z); MAPV.lat = uy(drag[3] - dy, MAPV.z); draw(); });
    el.addEventListener('pointerup', function (e) {
      if (drag && moved < 6) { var r = el.getBoundingClientRect(), X = wx(MAPV.lng, MAPV.z) + (e.clientX - r.left - el.clientWidth / 2), Y = wy(MAPV.lat, MAPV.z) + (e.clientY - r.top - el.clientHeight / 2);
        p.lat = uy(Y, MAPV.z); p.lng = ux(X, MAPV.z); p.src = 'TAP'; p.catch.map = true; NEAR = null; think(); var nr2 = $('#au-near'); if (nr2 && nr2.open) setTimeout(nearFill, 10); if (p.note) { p.note.lat = +p.lat.toFixed(5); p.note.lng = +p.lng.toFixed(5); NG.saveNotes(); } draw(); fill(); ping(true); }
      drag = null; });
    el.addEventListener('wheel', function (e) { e.preventDefault(); MAPV.z = Math.max(12, Math.min(B.maxzoom || 19, MAPV.z + (e.deltaY < 0 ? 1 : -1))); draw(); }, { passive: false });
    el.addEventListener('dblclick', function (e) { e.preventDefault(); p.catch.map = !p.catch.map; fill(); ping(p.catch.map); });
  }

  /* ───────── asleep under the base's pages, awake on the paper ───────── */
  api.sleep = function () { asleep = true; root.hidden = true; humSet(false); };
  api.wake = function () { if (location.hash) return; asleep = false; root.hidden = false; humSet(S.mode !== 'seed'); go(); };
  api.state = function () { return { mode: S.mode, stage: S.stage, deep: S.deep, sel: S.sel || null, piece: P ? { say: P.say, photo: !!P.photo, eye: !!P.eye, art: P.art, lines: P.lines, code: P.note && P.note.code, sent: !!P.sent, caught: caught(P), pos: P.pos, adds: P.adds, cn: P.note ? P.note.cn : '', folioId: P.folioId || '', tf: P.tf, paper: P.paper, ptone: P.ptone, spPhoto: !!P.spPhoto } : null, boxes: lastBoxes, halo: S.halo || 0, slip: !!MINI.c, round: !!S.round, form: FORM.key, frames: S.frames || 0, me: S.me || null, folio: slides().length, zoom: SH.pswp && SH.pswp.currSlide ? SH.pswp.currSlide.currZoomLevel / SH.pswp.currSlide.zoomLevels.initial : 1, showing: !!SH.pswp, shows: [SH.n || 0, SH.d || 0], pix: { sub: PIX.sub, tone: PIX.tone }, print: S.lastPrint || null, hum: window.__auraHum || 0, pf: !!PF, noise: !!N3 }; };
  api.go = function (m, s) { if (m === 'globe') { if (S.mode === 'seed') bang(); setMode('globe'); } if (m === 'iruk') { setMode('globe'); toIruk(s || 0); } };
  addEventListener('resize', function () { layout(); if (MAPV.draw && S.deep) MAPV.draw(); selBox(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) go(); });
  addEventListener('hashchange', function () { if (location.hash) api.sleep(); });
  layout(); setMode('seed'); paint();
  /* the piece one was making comes back with one */
  draftLoad().then(function (o) { if (o && !P && !o.sent) { P = unpack(o); think(); fillDots(); paint(); } });
  /* the code on every print: its maker fetched once, early, so the first poster already carries it */
  if (NG.qrLib) NG.qrLib().then(function () { if (P) { P._base = null; if (S.stage >= 2) redraw(); } });
  if (location.hash) api.sleep(); else go();
  fontReady();
})();
