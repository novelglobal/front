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
  /* the one wall: the posters finished here, the pieces from the base, and the posters made in the studio's print shop, newest first */
  var studioPosters = function () { var l = []; try { l = JSON.parse(localStorage.getItem('da.posters2.v1') || '[]') || []; } catch (e) { l = []; } return l.filter(function (p) { return p && p.img; }).map(function (p) { return { id: 's' + p.id, at: p.at, src: p.img, cap: 'From the print shop' + (p.at ? ', ' + NG.when(p.at).slice(0, 6) : ''), studio: 1 }; }); };
  /* one's own on the wall can be deleted from this phone: posters kept here, pieces made in the base, the print shop's posters */
  var ownSlide = function (f) { return !!f && (f.studio || FOLIO.some(function (q) { return q.id === f.id; }) || (NG.minePiece && NG.minePiece(f.id))); };
  var dropSlide = function (f) {
    if (f.studio) { try { var l = JSON.parse(localStorage.getItem('da.posters2.v1') || '[]') || []; localStorage.setItem('da.posters2.v1', JSON.stringify(l.filter(function (p) { return 's' + p.id !== f.id; }))); } catch (e) { /* none */ } return Promise.resolve(); }
    if (NG.minePiece && NG.minePiece(f.id)) { NG.dropPiece(f.id); return Promise.resolve(); }
    return folioDrop(f.id);
  };
  var slides = function () { return FOLIO.concat(NG.pieces().map(function (p) { return { id: p.id, at: p.at, src: p.src, cap: 'A piece' + (p.at ? ', ' + NG.when(p.at).slice(0, 6) : '') }; })).concat(studioPosters()).sort(function (a, b) { return (b.at || 0) - (a.at || 0); }); };

  /* ───────── the colour poster: the picture in full on blueprint paper (or white paper, the ink turned to the blue), the life, the
     four lines, what was caught and what was added, each placed, turned, sized and toned by hand; a small code back to the site ───────── */
  var FONT = '"Architects Daughter", "Comic Sans MS", "Bradley Hand", cursive';
  /* words on the poster: the hand on screen; for the printer, a clean bold type a little larger, which the head prints whole */
  var PRINTMODE = false, CLEAN = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  var tFont = function (px) { return PRINTMODE ? '700 ' + Math.round(px * 1.1) + 'px ' + CLEAN : px + 'px ' + FONT; };
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
    if (tone === 'photo' && im && !PRINTMODE) { var s = document.createElement('canvas'); s.width = s.height = n; var sx = s.getContext('2d'); var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, m = Math.min(iw, ih); sx.drawImage(im, (iw - m) / 2, (ih - m) / 2, m, m, 0, 0, n, n); cols = sx.getImageData(0, 0, n, n).data; }
    var put = function (px, py, a) { px = Math.round(px); py = Math.round(py); if (px < 0 || py < 0 || px >= n || py >= n) return; var i = (py * n + px) * 4;
      g.fillStyle = cols ? 'rgba(' + cols[i] + ',' + cols[i + 1] + ',' + cols[i + 2] + ',' + a + ')' : 'rgba(' + pxInk(tone) + ',' + a + ')'; g.fillRect(px, py, 1, 1); };
    for (var y = 0; y <= bh; y++) { var half = bw * Math.sqrt(Math.max(0, 1 - Math.pow((bh - y) / bh, 2))); for (var xx = -half; xx <= half; xx++) { var edge = Math.abs(Math.abs(xx) - half) < 1 || y === Math.round(bh) || y === 0; put(cx + xx, top + y, edge ? 1 : 0.35); } }
    put(cx - bw * 0.35, top + bh * 0.6, 1); put(cx + bw * 0.35, top + bh * 0.6, 1); put(cx, top + bh * 0.45, 1);
    for (var t = 0; t < 4; t++) { var x0 = cx - bw * 0.75 + t * bw * 0.5; for (var k2 = 1; k2 < n - top - bh - 1; k2++) { var sw = Math.sin(ph * 1.3 + k2 * 0.45 + t) * (k2 / n) * n * 0.12; put(x0 + sw, top + bh + k2, k2 % 3 === 0 ? 1 : 0.6); } }
    return c;
  }  /* the pixel things beside it, after a table of found things (a box of paperclips kept on their notes, litter from a beach, coral and shells):
     each one handmade in a few cells, a little off true, and moved by the same current. Coral grows from the floor and sways; litter is
     whatever the tide brings (a ring pull, a cap, a pin, a blister pack, a crushed can, a length of chain); paperclips come in their shapes */
  /* a pixel's colour on this paper: 'ink' is the paper's own pen (cream on blue, navy on white), 'blue' a blue that still shows on the blue
     paper; on the receipt every cell is the ink, so nothing pale is lost to the thermal head */
  var pxInk = function (tone) { if (PRINTMODE) return PEN; if (tone === 'blue') return WHITE ? '23,69,127' : '126,172,228'; return PEN; };
  var PIX_SUBS = ['jelly', 'coral', 'trash', 'clip'];
  var PIX_COL = { coral: ['232,130,111', '242,184,160', '217,83,79', '246,224,200'], trash: ['201,204,209', '215,180,90', '154,163,173', '228,230,234'], clip: ['233,75,60', '47,111,214', '242,194,48', '41,163,106', '236,111,166', '244,241,232', '60,60,60'] };
  /* a stamp in cells: its own shape, each cell inked where the stamp is, in the pixel ink chosen */
  function pixStamp(g, n, tone) { var src = stampOf(g, 'ink', false), c = document.createElement('canvas'); c.width = c.height = n; var cx2 = c.getContext('2d'); cx2.drawImage(src, 0, 0, n, n);
    var d = cx2.getImageData(0, 0, n, n).data, o = document.createElement('canvas'); o.width = o.height = n; var og = o.getContext('2d');
    for (var y = 0; y < n; y++) for (var xx = 0; xx < n; xx++) { var i = (y * n + xx) * 4; if (d[i + 3] > 60) { og.fillStyle = 'rgba(' + pxInk(tone) + ',' + Math.min(1, 0.35 + d[i + 3] / 255).toFixed(2) + ')'; og.fillRect(xx, y, 1, 1); } }
    return o; }
  function pixArt(sub, cells, ph, tone, im, seed) {
    if (/^st\d$/.test(sub || '')) return pixStamp(+sub.slice(2), cells, tone === 'colour' || tone === 'photo' ? 'ink' : tone);
    if (!sub || sub === 'jelly') return pixJelly(cells, ph, tone, im);
    var n = cells, c = document.createElement('canvas'); c.width = c.height = n; var g = c.getContext('2d'), rr = rnd((seed || 1) * 13 + n), cols = null;
    if (tone === 'photo' && im && !PRINTMODE) { var s = document.createElement('canvas'); s.width = s.height = n; var sx = s.getContext('2d'); var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, m = Math.min(iw, ih); sx.drawImage(im, (iw - m) / 2, (ih - m) / 2, m, m, 0, 0, n, n); cols = sx.getImageData(0, 0, n, n).data; }
    var pal = PIX_COL[sub], pick = pal[Math.floor(rr() * pal.length)];
    var col = function (px, py, a, k) { if (cols) { var i = (py * n + px) * 4; return 'rgba(' + cols[i] + ',' + cols[i + 1] + ',' + cols[i + 2] + ',' + a + ')'; }
      return 'rgba(' + (tone === 'colour' && !PRINTMODE ? (k != null ? pal[k % pal.length] : pick) : pxInk(tone)) + ',' + a + ')'; };
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
    var body = []; lines.forEach(function (l) { if (l) wrap(x, l, aw).forEach(function (w, k) { body.push([k ? '' : '·', w]); }); });
    x.font = '42px ' + FONT; var title = !P.say || lines.indexOf(P.say) >= 0 ? [] : wrap(x, P.say, aw).slice(0, 3);
    var band = caught(P).length ? 340 : 0, foot = 176 + Math.max(-(caught(P).length ? 300 : 0), Math.min(3000, P.len || 0));
    var H = pad + 54 + (a ? a.height + 36 : 10) + (P.wtop && a ? 16 : 0) + title.length * 52 + (title.length ? 16 : 0) + body.length * 38 + lines.filter(Boolean).length * 8 + 40 + band + foot + pad;
    c.height = H; paper(x, W, H);
    if (P.wm) { var wh = aw * 0.42; x.save(); x.globalAlpha = 0.12; ngMark(x, (W - wh * 2.36) / 2, H * 0.46, wh, ink(), CORAL); x.restore(); }
    x.fillStyle = ink(); x.textBaseline = 'top'; var mw = ngMark(x, pad + 1, pad + 17, 20, ink(), PRINTMODE ? 'rgb(128,128,128)' : CORAL); x.font = '500 23px "Helvetica Neue", Helvetica, Arial, sans-serif'; if ('letterSpacing' in x) x.letterSpacing = '0.5px'; x.fillText('novel.global', pad + mw + 13, pad + 5); if ('letterSpacing' in x) x.letterSpacing = '0px'; x.font = '22px ' + FONT;
    if (n.code) { var cw2 = x.measureText(n.code).width; x.fillText(n.code, W - pad - cw2, pad + 4);  }
    /* the picture, then the words under it; or, turned (wtop), the words first and the picture under them */
    var ay = pad + 54, y = ay + 10, ax = 0;
    var art = function () { if (!a) return; ax = pad + (aw - a.width) / 2; x.drawImage(a, ax, ay); handRect(x, ax - 6, ay - 6, a.width + 12, a.height + 12, 1.6, 0.85, 7);
      if (!P.img && P.spCredit) { x.font = '13px ' + FONT; x.fillStyle = 'rgba(255,255,255,.85)'; var cr = P.spCredit.slice(0, 80), cwid = x.measureText(cr).width; x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(ax + a.width - cwid - 14, ay + a.height - 22, cwid + 10, 18); x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText(cr, ax + a.width - cwid - 9, ay + a.height - 20); }
      y = ay + a.height + 36; };
    /* the four lines as sentences alone (W.I.S.H. is how they were made, not what the poster says), a small space between them */
    var said = function () { x.fillStyle = ink(); x.font = '42px ' + FONT; title.forEach(function (l) { x.fillText(l, pad, y); y += 52; }); if (title.length) y += 16;
      body.forEach(function (b, i) { if (b[0] && i) y += 8; x.font = '600 29px ' + SANS; x.fillText(b[1], pad, y + 1); y += 38; }); };
    if (P.wtop && a && (title.length || body.length)) { y = ay + 4; said(); ay = y + 26; art(); y -= 14; } else { art(); said(); }
    y += 14; var dots = []; for (var i = 0; i <= 40; i++) dots.push([pad + aw * i / 40, y]); x.setLineDash([2, 9]); handLine(x, dots, 2, 0.55, 2); x.setLineDash([]);
    /* the code back to the site, small, dark on light so a phone reads it from the paper */
    var Q = window.qrcode, qrR = null; if (Q && n.code) { try { var q = Q(0, 'M'); q.addData(NG.noteURL(n)); q.make(); var mc = q.getModuleCount(), cell = Math.max(4, Math.floor(176 / mc)), qs = cell * mc, qx = W - pad - qs - 10, qy = H - pad - qs - 10;
      x.fillStyle = WHITE ? 'rgba(255,255,255,1)' : 'rgba(247,245,238,1)'; x.fillRect(qx - 10, qy - 10, qs + 20, qs + 20); x.fillStyle = 'rgb(23,69,127)';
      for (var r2 = 0; r2 < mc; r2++) for (var c2 = 0; c2 < mc; c2++) if (q.isDark(r2, c2)) x.fillRect(qx + c2 * cell, qy + r2 * cell, cell, cell); qrR = { q: q, x: qx, y: qy, s: qs }; } catch (e) { /* no code */ } }
    return { c: c, band: y + 22, W: W, H: H, pad: pad, qr: qrR, art: a ? [ax, ay, a.width, a.height] : null };
  }
  /* the mark of novel.global: a world in a lattice, a band across it redacted, two bars run out of it either way.
     Drawn in two colours (the pen, and the paper showing through) so it sits on blue or white alike */
  /* the mark of novel.global: a square, the novel (a book), and a circle, the global, side by side. Two solid shapes and nothing in them,
     each its own tone so neither is ever lost on the paper: the square in the ink, the circle in coral on screen and in grey on the
     receipt (a fine checker of dots, which the thermal head prints as grey). Balanced by eye rather than by rule: the circle a touch
     larger than the square so they weigh the same, the gap a third of the square, and each a hair off true (the square turned a third
     of a degree, the circle half a pixel low), so it reads as made by hand. sq and ci are fills (a colour or a pattern). Returns its width */
  var CORAL = 'rgb(226,92,64)';
  var dotFill = function (x, n) { var c = document.createElement('canvas'); c.width = c.height = n; var g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1, 1); if (n === 2) g.fillRect(1, 1, 1, 1); return x.createPattern(c, 'repeat'); };
  function ngMark(x, X, Y, h, sq, ci) {
    var r = h * 0.53, gap = h * 0.3, cx = X + h + gap + r;
    x.save(); x.fillStyle = sq; x.translate(X + h / 2, Y); x.rotate(-0.006); x.fillRect(-h / 2, -h / 2, h - 0.4, h); x.restore();
    x.save(); x.fillStyle = ci; x.beginPath(); x.arc(cx, Y + 0.5, r, 0, Math.PI * 2); x.fill(); x.restore();
    return h + gap + r * 2;
  }
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
  var FIT = {};
  function fitInk(im, src) {
    var key = src.length + ':' + src.slice(-40) + WHITE + PRINTMODE; if (FIT[key]) return FIT[key];
    var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.drawImage(im, 0, 0);
    var d = g.getImageData(0, 0, w, h).data, sum = 0, n = 0; for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 60) { sum += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; n++; }
    var lum = n ? sum / n : 0, paperLum = WHITE || PRINTMODE ? 244 : 64;
    if (PRINTMODE || Math.abs(lum - paperLum) < 70) { g.globalCompositeOperation = 'source-in'; g.fillStyle = ink(); g.fillRect(0, 0, w, h); }
    FIT[key] = c; return c;
  }
  /* line work on white (a song's card, a playlist and its code, the studio's strips): the white let go and the lines laid in the
     paper's own ink, so they show on blue, white or night paper and print black. A code turned light on dark paper still scans */
  var LINE = {};
  function lineInk(im, src) {
    var key = src.length + ':' + src.slice(-40) + WHITE + PRINTMODE + DARK; if (LINE[key]) return LINE[key];
    var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.drawImage(im, 0, 0);
    var id = g.getImageData(0, 0, w, h), d = id.data; for (var i = 0; i < d.length; i += 4) { var l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; d[i + 3] = Math.round(d[i + 3] * Math.max(0, Math.min(1, (235 - l) / 170))); d[i] = d[i + 1] = d[i + 2] = 0; }
    g.putImageData(id, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = ink(); g.fillRect(0, 0, w, h); LINE[key] = c; return c;
  }
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
        handLine(x, [[cx, cy - 128], [cx, cy - 104]], 1.4, 0.8, 1); x.fillStyle = ink(); x.font = tFont(16); x.fillText('N', cx - 5, cy - 150 + 2);
        var far = seen.reduce(function (mm, s2) { return Math.max(mm, s2.d || 0); }, 400); seen.forEach(function (s2) { var dy = (n.lat - s2.lat) * 111000, dx = (s2.lng - n.lng) * 111000 * Math.cos(n.lat * Math.PI / 180), kk = 100 / far; x.beginPath(); x.arc(cx + dx * kk, cy + dy * kk, 3.2, 0, 7); x.fill(); });
        irukMark(x, cx, cy - 4, 34, 1); var place = (NG.context(P)[0] || '').toLowerCase(); if (place) { x.font = tFont(18); var tw = x.measureText(place).width; x.fillText(place, cx - tw / 2, cy + 74); } PEN = keep; }; }
      else if (k === 'life') { var f = lifeOf(P); m.font = tFont(36); it.w = Math.min(560, m.measureText(f.cn).width + 48); m.font = 'italic 19px Georgia, serif'; it.w = Math.max(it.w, m.measureText(f.n || '').width + 48); it.h = 100;
        it.draw = function (x) { scrap(x, it.w, it.h, 4, tf); x.fillStyle = tcol(tf); x.font = tFont(36); x.fillText(f.cn, 24, 16); x.globalAlpha = 0.7; x.font = 'italic 19px Georgia, serif'; x.fillText(f.n || '', 24, 64); x.globalAlpha = 1; }; }
      else if (k === 'data') { m.font = tFont(20); var ls = wrap(m, P.catch.data.join(' · '), 360); it.w = Math.min(420, Math.max.apply(null, ls.map(function (l) { return m.measureText(l).width; })) + 40); it.h = ls.length * 28 + 26;
        it.draw = function (x) { scrap(x, it.w, it.h, 6, tf); x.fillStyle = tcol(tf); x.font = tFont(20); ls.forEach(function (l, i) { x.fillText(l, 20, 14 + i * 28); }); }; }
      else { it.w = 250; it.h = 110; it.draw = function (x) { scrap(x, it.w, it.h, 8, tf); var cl = tcol(tf); x.fillStyle = cl; x.strokeStyle = cl; x.lineWidth = 1.6;
        x.beginPath(); x.arc(34, 34, 12, 0, 7); x.stroke(); for (var r2 = 0; r2 < 8; r2++) { var an = r2 * Math.PI / 4; x.beginPath(); x.moveTo(34 + Math.cos(an) * 17, 34 + Math.sin(an) * 17); x.lineTo(34 + Math.cos(an) * 21, 34 + Math.sin(an) * 21); x.stroke(); }
        x.font = tFont(26); x.fillText('Niño 3.4 ' + ninoNow(), 64, 20);
        var v = ninoVals(); if (v) { var mx = Math.max(1, Math.max.apply(null, v)), keep = PEN; if (tf.tone === 'turn') PEN = BACK; handLine(x, v.map(function (q, i) { return [22 + i * (it.w - 44) / Math.max(1, v.length - 1), it.h - 16 - (q / mx) * 30]; }), 1.4, 0.85, 9); PEN = keep; } }; }
      out.push(it);
    });
    (P.adds || []).forEach(function (a, i) {
      var it = { key: 'a' + i, X: a.x * W, Y: a.y * H, tf: a };
      /* laid by a signal, until moved by hand: three to a row below the words and what was caught */
      if (a.band) { var bi = a.band - 1; it.X = pad + (bi % 3) * (W - pad * 2 - 220) / 2; it.Y = B0.band + (caught(P).length ? 340 : 0) + 10 + Math.floor(bi / 3) * 240; }
      if (a.k === 's' && MARKS[a.g]) { it.w = it.h = 132; it.draw = function (x) { x.translate(6, 6); x.scale(3.75, 3.75); var mk = new Path2D(MARKS[a.g]), tn = a.tone || 'ink'; x.lineCap = x.lineJoin = 'round';
        if (tn !== 'clear') { x.strokeStyle = tn === 'turn' ? ink(0.9) : back(0.9); x.lineWidth = 2.1; x.stroke(mk); } x.strokeStyle = tn === 'turn' ? back() : ink(); x.lineWidth = 0.8; x.stroke(mk); }; }
      else if (a.k === 't') { m.font = tFont(34); var ls = wrap(m, a.t || ' ', 420); it.w = Math.max(80, Math.max.apply(null, ls.map(function (l) { return m.measureText(l).width; })) + 40); it.h = ls.length * 44 + 22;
        it.draw = function (x) { scrap(x, it.w, it.h, 11 + i, a); x.fillStyle = tcol(a); x.font = tFont(34); x.textBaseline = 'top'; ls.forEach(function (l, k) { x.fillText(l, 20, 12 + k * 44); }); };
        it.glyph = function (x) { var turn = (a.tone || 'ink') === 'turn'; x.font = tFont(34); x.textBaseline = 'top'; x.lineJoin = 'round'; x.lineWidth = 9; x.strokeStyle = turn ? '#000' : '#fff'; x.fillStyle = turn ? '#fff' : '#000';
          ls.forEach(function (l, k) { x.strokeText(l, 20, 12 + k * 44); }); ls.forEach(function (l, k) { x.fillText(l, 20, 12 + k * 44); }); }; }
      else if (a.k === 'i') { it.w = it.h = 128; it.draw = function (x) { var im = iconImg(a.src, function () { if (window.AURA && AURA.redraw) AURA.redraw(); }); if (!im) return; x.imageSmoothingEnabled = false; var iw = im.naturalWidth, ih = im.naturalHeight, k2 = 128 / Math.max(iw, ih); x.drawImage(fitInk(im, a.src), (128 - iw * k2) / 2, (128 - ih * k2) / 2, iw * k2, ih * k2); }; }
      else if (a.k === 'im') { it.w = a.wd || 300; it.h = Math.round(it.w * Math.min(5, Math.max(0.2, a.ar || 0.75))); it.draw = function (x) { var im = iconImg(a.src, function () { if (window.AURA && AURA.redraw) AURA.redraw(); }); var tn = a.tone || 'ink';
        if (a.b !== false) { x.fillStyle = tn === 'turn' ? ink(0.95) : back(0.95); x.fillRect(-8, -8, it.w + 16, it.h + 16); }
        if (im) { x.imageSmoothingEnabled = true; x.globalAlpha = tn === 'clear' ? 0.55 : 1; var iw = im.naturalWidth, ih = im.naturalHeight, sc = Math.min(it.w / iw, it.h / ih); x.save(); x.beginPath(); x.rect(0, 0, it.w, it.h); x.clip(); x.drawImage(a.crisp ? lineInk(im, a.src) : im, (it.w - iw * sc) / 2, (it.h - ih * sc) / 2, iw * sc, ih * sc); x.restore(); x.globalAlpha = 1; }
        if (a.b !== false) handRect(x, -8, -8, it.w + 16, it.h + 16, 1.3, 0.8, 17); }; }
      else if (a.k === 'st' && STAMPS[a.g]) { it.w = it.h = 220; it.draw = function (x) { x.drawImage(stampOf(a.g, a.tone || 'ink', a.b === true), 0, 0, 220, 220); }; }
      else if (a.k === 'p') { it.w = it.h = 160; it.draw = function (x) { var pj = pixArt(a.sub || 'jelly', a.cells || 24, a.ph || 0, a.tone2 || 'ink', picOf(P), a.seed || 1); x.imageSmoothingEnabled = false; if (a.b) handRect(x, 0, 0, 160, 160, 1.2, 0.6, 13); x.drawImage(pj, 0, 0, 160, 160); }; }
      else return;
      out.push(it);
    });
    return out;
  }
  function drawItems(x, P, B0, glyphs) {
    var boxes = {};
    items(P, B0).forEach(function (it) { if (glyphs && !it.glyph) return;
      var s = it.tf.s || 1, r = (it.tf.r || 0) * Math.PI / 180, w = it.w * s, h = it.h * s;
      x.save(); x.textBaseline = 'top'; x.translate(it.X + w / 2, it.Y + h / 2); x.rotate(r); x.scale(s, s); x.translate(-it.w / 2, -it.h / 2); if (glyphs) it.glyph(x); else it.draw(x); x.restore();
      boxes[it.key] = [it.X, it.Y, w, h];
    });
    return boxes;
  }
  function posterKey(P) { return [P.len || 0, P.paper, P.say, (P.lines || []).join('|'), (P.photo || '').length, !!P.img, !!P.spImg, P.ptone, P.note && P.note.code, caught(P).length > 0, P.note && (P.note.seen || []).length, !!window.qrcode, !!P.wtop, !!P.wm].join('~'); }
  /* the poster remade at a new size: what was put on stays where it was on the paper; when something above it grew
     (a photograph, more words), what lies under the top moves down by as much, never under the new thing */
  function keepPlace(P, B1) {
    if ((P.photo && !P.img) || (P.spPhoto && !P.spImg && !P.img)) return;   // a photograph still loading: measured once it is in
    var g = P._geo; P._geo = { H: B1.H, band: B1.band }; if (!g || (g.H === B1.H && g.band === B1.band)) return;
    var d = B1.band - g.band, top = B1.pad + 54, at = function (y) { var py = y * g.H; if (py >= top) py += d; return Math.max(0, py) / B1.H; };
    (P.adds || []).forEach(function (a) { if (a.y != null) a.y = at(a.y); }); Object.keys(P.pos || {}).forEach(function (k) { P.pos[k] = [P.pos[k][0], at(P.pos[k][1])]; });
  }
  function posterNow(P) {
    /* → { c, boxes }: the base kept, the caught and the added drawn over it */
    usePaper(P.paper === 'white');
    var key = posterKey(P); if (!P._base || P._base.key !== key) { P._base = posterBase(P); P._base.key = key; keepPlace(P, P._base); }
    var B0 = P._base, c = document.createElement('canvas'); c.width = B0.W; c.height = B0.H; var x = c.getContext('2d'); x.drawImage(B0.c, 0, 0);
    var boxes = drawItems(x, P, B0); usePaper(false);
    /* what was put on runs past the end (or onto the code): the strip grows to hold it */
    var need = 0; Object.keys(boxes).forEach(function (k) { var b = boxes[k], q = B0.qr, end = q && b[0] + b[2] > q.x - 10 ? q.y - 24 : B0.H - B0.pad; need = Math.max(need, b[1] + b[3] - end); });
    if (need > 4 && (P.len || 0) < 3000 && !(P.photo && !P.img) && !(P.spPhoto && !P.spImg && !P.img)) { P.len = Math.min(3000, (P.len || 0) + Math.ceil(need / 60) * 60); return posterNow(P); }
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
  /* the notch and the home bar, measured by an empty box padded by them */
  var SAFE = null;
  function safeArea() { if (!SAFE) { SAFE = document.createElement('i'); SAFE.setAttribute('aria-hidden', 'true'); SAFE.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)'; document.body.appendChild(SAFE); } var c = getComputedStyle(SAFE); return [parseFloat(c.paddingTop) || 0, parseFloat(c.paddingBottom) || 0]; }
  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1); var W = innerWidth, H = root.clientHeight || innerHeight, sa = safeArea(), sat = sa[0], sab = sa[1]; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    /* on a phone the rings take most of the width and sit higher; the eye in the middle keeps its own size (R0) */
    var mob = W < 760, R0 = Math.min(W * 0.86, H * 0.74, 560) * 150 / 400, R = mob ? Math.min(W * 0.45, H * 0.3) : R0;
    var big = !mob && H > 760 && W > 1200, bw = mob ? 116 : big ? 196 : 160, bh = bw * 0.58, by = (mob ? 16 : 22) + sat, cr = mob ? 21 : big ? 26 : 23, gy = by + bh + (mob ? 30 : 38), hry = mob ? 12 : 15;
    var tipY = H - (mob ? 34 : 42) - sab - Math.max(0, H - innerHeight), panelTop = gy + hry + cr + (mob ? 16 : 22), panelBot = tipY - (mob ? 44 : 52), pw = mob ? W - 40 : Math.min(big ? 720 : 640, W - 380);
    L = { W: W, H: H, mob: mob, big: big, R: R, R0: R0, cx: W / 2, cy: mob ? H * 0.42 : H / 2, bx: W / 2, by: by, bw: bw, bh: bh, gy: gy, cr: cr, hrx: bw * (mob ? 0.62 : 0.6) + cr, hry: hry,
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
    FORM.lines = null; FORM.rect = null; FORM.wline = null; var key = 'hang';
    if (S.mode === 'iruk' && !S.deep && panel) {
      if (S.stage === 1) { var tas = panel.querySelectorAll('.au-wish textarea'); if (tas.length === 4) { var ls = [].map.call(tas, function (ta) { var r = ta.getBoundingClientRect(); return [r.left, r.right, r.bottom - 1]; }); if (ls[0][1] > ls[0][0]) { FORM.lines = ls; key = 'wish'; } } }
      else if (S.stage === 3) { var l2 = panel.querySelector('.au-line2'); if (l2) { var r3 = l2.getBoundingClientRect(); if (r3.width > 20 && r3.bottom > L.panel.t && r3.top < L.panel.t + L.panel.h) { FORM.wline = [r3.left + 2, r3.right - 2, r3.top + r3.height / 2]; key = 'line'; } } }
      else if (S.stage >= 2) { var el = panel.querySelector('.au-drag canvas'); if (el) { var r = el.getBoundingClientRect(), P0 = L.panel; if (r.width > 20) { FORM.rect = [r.left - 9, Math.max(P0.t - 6, r.top - 9), r.right + 9, Math.min(P0.t + P0.h + 6, r.bottom + 9)]; key = 'frame' + S.stage; } } }
    }
    if (key !== FORM.key) { FORM.from = LAST; FORM.at = performance.now() / 1000; FORM.key = key; }
    root.classList.toggle('loose', key !== 'hang');
  }
  var LAST = null;
  var PTR = { x: -1, y: -1, at: -9, down: -9 };
  addEventListener('pointermove', function (e) { PTR.x = e.clientX; PTR.y = e.clientY; PTR.at = performance.now() / 1000; }, { passive: true });
  addEventListener('pointerdown', function (e) { PTR.x = e.clientX; PTR.y = e.clientY; PTR.at = PTR.down = performance.now() / 1000; }, { passive: true });
  function freeTip(i, t, tip) {
    var b = [tip[0] + noise(i * 4.1, t * 0.07, 1) * L.W * 0.14, tip[1] - L.H * 0.1 + noise(i * 2.7, t * 0.06, 2) * L.H * 0.1];
    if (PTR.x >= 0 && t - PTR.at < 5) { var k = 0.3 * (1 - (t - PTR.at) / 5); b = [b[0] + (PTR.x - b[0]) * k, b[1] + (PTR.y - b[1]) * k]; }
    if (t - PTR.down < 1.4) { var dx = b[0] - PTR.x, dy = b[1] - PTR.y, d = Math.hypot(dx, dy) || 1, f = (1 - (t - PTR.down) / 1.4) * Math.max(0, 1 - d / 280) * 140; b = [b[0] + dx / d * f, b[1] + dy / d * f]; }
    var ft = S.ft || (S.ft = []); ft[i] = ft[i] || b.slice(); ft[i][0] += (b[0] - ft[i][0]) * 0.05; ft[i][1] += (b[1] - ft[i][1]) * 0.05; return ft[i];
  }
  function tentPts(i, t, bell) {
    var root = [L.bx + (i - 1.5) / 1.5 * bell.w * 0.82, bell.bot - 1], g = L.hold[i], tip = tabs[i] && tabs[i].classList.contains('gated') ? freeTip(i, t, L.tips[i]) : L.tips[i], P0 = L.panel, mob = L.mob, left = i < 2;
    var held = [root, [(root[0] + g[0]) / 2, root[1] + (g[1] - root[1]) * 0.4], g], ctl = null, k0 = 0;
    if (FORM.lines) {
      /* W.I.S.H.: each tentacle sweeps down from the catch to the margin and lies along its own line; W and I from the left, S and H from the right */
      var ln = FORM.lines[i], sx = left ? ln[0] - (i === 0 ? 7 : 14) : ln[1] + (i === 3 ? 7 : 14), a0 = left ? ln[0] : ln[1], a1 = left ? ln[1] : ln[0];
      ctl = held.concat([[g[0] + (sx - g[0]) * 0.7, g[1] + (ln[2] - g[1]) * 0.3], [sx, ln[2] - 16], [a0 + (left ? 2 : -2), ln[2]]]); k0 = ctl.length - 1; ctl.push([a0 + (a1 - a0) * 0.04, ln[2]]);
    } else if (FORM.wline && i === 3) {
      /* print: it lets go of its key, sweeps out past the wall's right end and is the line itself, sagging a little, the receipts clipped to it */
      var wl = FORM.wline, wx2 = Math.min(L.W - 6, wl[1] + (mob ? 8 : 22));
      ctl = held.concat([[g[0] + (wx2 - g[0]) * 0.6, g[1] + (wl[2] - g[1]) * 0.35], [wx2, wl[2] - 12], [wl[1], wl[2]]]); k0 = ctl.length - 1;
      for (var q4 = 1; q4 <= 8; q4++) ctl.push([wl[1] + (wl[0] - wl[1]) * q4 / 8, wl[2] + Math.sin(Math.PI * q4 / 8) * 2.5]);
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
      dot(s.x * L.W, s.y * L.H, s.r * (DARK ? 1.1 : 1), Math.min(1, s.a * (DARK ? 1.35 : 1)) * (0.6 + 0.4 * Math.sin(t * 0.9 + s.ph)));
    });
  }
  /* the Bermuda fireworm: in the dark, now and then, a bright neon green that lives a moment and is gone. One of three each time: a worm
     darting and fading into the dark, a squirt of green sparks, or a depth charge, a slow green pulse spreading and sinking */
  var WORMS = [], GREEN = '57,255,106';
  function worm(kind, px, py) {
    var t = performance.now() / 1000, a = Math.random() * Math.PI * 2;
    if (kind === 0) WORMS.push({ k: 0, t0: t, life: 1.8, x: px, y: py, a: a, v: 120 + Math.random() * 90, trail: [] });
    else if (kind === 1) { var sp = []; for (var i = 0; i < 26; i++) { var b = a + (Math.random() - 0.5) * 1.6, v = 60 + Math.random() * 160; sp.push({ x: px, y: py, vx: Math.cos(b) * v, vy: Math.sin(b) * v - 30 }); } WORMS.push({ k: 1, t0: t, life: 1.4, sp: sp }); }
    else WORMS.push({ k: 2, t0: t, life: 2.2, x: px, y: py });
  }
  function worms(t, dt) {
    if (still) return;
    if (!S.wormAt) S.wormAt = t + 4 + Math.random() * 6;
    if (t > S.wormAt) { S.wormAt = t + 7 + Math.random() * 14; worm(Math.floor(Math.random() * 3), L.W * (0.08 + Math.random() * 0.84), L.H * (0.18 + Math.random() * 0.72)); }
    if (!WORMS.length) return; x.save(); x.globalCompositeOperation = 'lighter';
    WORMS = WORMS.filter(function (w) { var k = (t - w.t0) / w.life; if (k >= 1) return false; var fade = k < 0.15 ? k / 0.15 : 1 - Math.pow((k - 0.15) / 0.85, 1.6);
      x.shadowColor = 'rgba(' + GREEN + ',.9)'; x.shadowBlur = 14;
      if (w.k === 0) { w.a += Math.sin(t * 9 + w.t0) * dt * 3; w.x += Math.cos(w.a) * w.v * dt; w.y += Math.sin(w.a) * w.v * dt; w.trail.push([w.x, w.y]); if (w.trail.length > 14) w.trail.shift();
        x.strokeStyle = 'rgba(' + GREEN + ',' + (0.85 * fade) + ')'; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath(); w.trail.forEach(function (q, i) { var wob = Math.sin(i * 1.3 + t * 20) * 1.2; if (i) x.lineTo(q[0] + wob, q[1] - wob); else x.moveTo(q[0], q[1]); }); x.stroke();
        x.fillStyle = 'rgba(200,255,210,' + fade + ')'; x.beginPath(); x.arc(w.x, w.y, 2.2, 0, 7); x.fill(); }
      else if (w.k === 1) { w.sp.forEach(function (q) { q.vx *= Math.pow(0.25, dt); q.vy = q.vy * Math.pow(0.25, dt) - 8 * dt; q.x += q.vx * dt; q.y += q.vy * dt; x.fillStyle = 'rgba(' + GREEN + ',' + (0.9 * fade) + ')'; x.beginPath(); x.arc(q.x, q.y, 1.6, 0, 7); x.fill(); }); }
      else { var r = 8 + 130 * k; x.shadowBlur = 24; x.strokeStyle = 'rgba(' + GREEN + ',' + (0.55 * fade) + ')'; x.lineWidth = 1.6; x.beginPath(); x.arc(w.x, w.y + 20 * k, r, 0, 7); x.stroke();
        var g = x.createRadialGradient(w.x, w.y, 1, w.x, w.y, r * 0.6); g.addColorStop(0, 'rgba(' + GREEN + ',' + (0.35 * fade) + ')'); g.addColorStop(1, 'rgba(' + GREEN + ',0)'); x.fillStyle = g; x.fillRect(w.x - r, w.y - r, r * 2, r * 2); }
      return true; });
    x.restore();
  }
  /* each ring moved by the disc on it: m, how much of the ring shows at a point (0 to 1); off, how far it is shaken out from the middle.
     d is the point's angle from its disc along the ring, -pi to pi */
  var wrapA = function (a) { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
  function ringWay(i, d, t, sp) {
    if (still) return [1, 0];
    if (orbs[i] && orbs[i].classList.contains('gated')) return [0.4, 0];
    /* the map: seen near it, in front and behind; on the far side, out of its sight, gone */
    if (i === 0) { var ad = Math.abs(d); return [ad < 1.7 ? 1 : ad > 2.6 ? 0 : 1 - (ad - 1.7) / 0.9, 0]; }
    /* the wave: where it passes, the ring shakes, gently */
    if (i === 2) { var e = Math.max(0, 1 - Math.abs(d) / 0.6); return [1, e * e * Math.sin(d * 18 - t * 10) * 2.6]; }
    /* the pencil: the ring is drawn behind it, the ink freshest at its tip and fading to the tail; ahead of it, a fifth left undrawn */
    var u = (sp >= 0 ? -d : d); if (u < 0) u += 2 * Math.PI; var k = u / (2 * Math.PI);
    return [k > 0.8 ? 0 : k > 0.62 ? (0.8 - k) / 0.18 : 1 - k * 0.35, 0];
  }
  function drawGlobe(t, scale, alpha) {
    var rs = globePts(S.spin, scale), segs = [];
    rs = rs.map(function (ring, ri) {
      var k = RINGS[ri], th0 = k.a0 + (still ? 0 : t * k.sp), n = ring.length;
      return ring.map(function (p, j) { var d = wrapA(k.ph[0] + 2 * Math.PI * j / NR - th0), w = ringWay(ri, d, t, k.sp), dx = p[0] - L.cx, dy = p[1] - L.cy, r = Math.hypot(dx, dy) || 1;
        return [p[0] + dx / r * w[1], p[1] + dy / r * w[1], p[2], w[0]]; });
    });
    /* cut into runs of one side (front or back) and one strength, drawn back first, the eye, then the front */
    rs.forEach(function (ring) {
      var run = [], key = null, flush = function () { if (run.length > 1 && key[1] > 0) segs.push({ front: key[0], pts: run, m: key[1] }); };
      ring.concat([ring[0], ring[1]]).forEach(function (p) { var kk = [p[2] >= 0, Math.round(p[3] * 6) / 6]; if (key && (kk[0] !== key[0] || kk[1] !== key[1])) { run.push(p); flush(); run = []; } key = kk; run.push(p); });
      flush();
    });
    segs.forEach(function (g) { if (!g.front) stroke(g.pts, 0.6, 0.32 * g.m * alpha, false); });
    centreEye(t, alpha, scale);
    segs.forEach(function (g) { if (g.front) stroke(g.pts, 0.85, 0.92 * g.m * alpha, false); });
    return rs;
  }
  /* the irukandji's eye in the middle of the globe, in dots: it follows whichever disc is in front, and blinks now and then */
  function centreEye(t, a, scale) {
    var ew = L.R0 * 0.3 * scale, eh0 = ew * 0.46, cx = L.cx, cy = L.cy, front = null;
    RINGS.forEach(function (k) { var q = ringPt(k, k.a0 + (still ? 0 : t * k.sp), S.spin, L.R, L.cx, L.cy); if (!front || q[2] > front[2]) front = q; });
    var lx = front ? (front[0] - cx) / L.R : 0, ly = front ? (front[1] - cy) / L.R : 0; S.look = S.look || [0, 0]; S.look[0] += (lx - S.look[0]) * 0.06; S.look[1] += (ly - S.look[1]) * 0.06;
    var bk = still ? 1 : Math.min(1, Math.abs(((t + 3.1) % 6.7) - 0.14) / 0.14, S.blink ? Math.min(1, Math.abs(t - S.blink - 0.14) / 0.14) : 1), eh = eh0 * Math.max(0.06, bk);
    var g = x.createRadialGradient(cx, cy, 2, cx, cy, ew * 1.6); g.addColorStop(0, 'rgba(244,241,232,' + 0.1 * a + ')'); g.addColorStop(1, 'rgba(244,241,232,0)'); x.fillStyle = g; x.fillRect(cx - ew * 2, cy - ew * 2, ew * 4, ew * 4);
    for (var j = 0; j < 34; j++) { var u = j / 34 * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u); dot(cx + cu * ew, cy + su * eh * (0.35 + 0.65 * Math.abs(su)), 1.2, (0.6 + 0.2 * Math.sin(t * 1.75 + j)) * a); }
    var pr = eh0 * 0.62 * Math.max(0.06, bk), px = cx + S.look[0] * ew * 0.42, py = cy + S.look[1] * eh0 * 0.35;
    var ring = []; for (var k3 = 0; k3 <= 24; k3++) { var v = k3 / 24 * Math.PI * 2; ring.push([px + Math.cos(v) * pr, py + Math.sin(v) * pr]); } stroke(ring, 0.7, 0.85 * a, false);
    dot(px, py, pr * 0.45, 0.95 * a);
    /* its four tears, the tentacles to come */
    [-0.5, -0.17, 0.17, 0.5].forEach(function (f, i) { var dy = eh0 * (1.35 + 0.25 * Math.sin(t * 1.2 + i)); dot(cx + f * ew, cy + dy, 1.5, 0.7 * a); dot(cx + f * ew * 1.05, cy + dy + 9, 1, 0.4 * a); });
  }
  /* the step that would come next, once this one has something: a light runs down its tentacle to the tip */
  var nextStep = function () { return S.deep || S.stage >= 3 || !ready() ? -1 : S.stage + 1; };
  function drawIruk(t, a) {
    readForm(); var T = irukTargets(t), b = T.bell, k0 = a, nx = nextStep(), work = FORM.key !== 'hang' && FORM.key !== 'line'; LAST = T.tents;
    /* the aura: a slow light round the bell, breathing with it */
    var g = x.createRadialGradient(L.bx, b.top + L.bh * 0.5, 4, L.bx, b.top + L.bh * 0.5, L.bw * 1.7); g.addColorStop(0, 'rgba(244,241,232,' + (0.13 + 0.07 * b.p) * a + ')'); g.addColorStop(1, 'rgba(244,241,232,0)');
    x.fillStyle = g; x.fillRect(L.bx - L.bw * 2, b.top - L.bw, L.bw * 4, L.bw * 3.4);
    var P0 = L.panel, faint = function (inside) { x.save(); x.beginPath(); x.rect(P0.l, P0.t, P0.w, P0.h); if (!inside) { x.rect(L.W, 0, -L.W, L.H); x.clip('evenodd'); } else x.clip(); };
    [false, true].forEach(function (inside) { if (work && inside) return; if (!work) faint(inside); else x.save(); var A = inside ? (S.deep || P && P.photo ? 0.08 : 0.14) : 1;
      T.tents.forEach(function (pts, i) { if (FORM.wline && i === 3) return;
        var on = i === S.stage, nxt = i === nx, w = on ? 1.15 : 0.8, a2 = A * k0;
        stroke(pts, w, (on ? 0.9 : nxt ? 0.7 : 0.5) * a2, true);
        stroke(pts.map(function (p) { return [p[0] + 1.6, p[1] - 1]; }).slice(0, NT - 6), 0.3, 0.18 * a2, true);
        /* the beads of stinging cells along it, the irukandji's own dots: lit along the open step, a light running down to the next */
        for (var j = 4; j < NT - 1; j += 2) { var tw = 0.5 + 0.5 * Math.sin(t * 2.6 - j * 0.5 + i), big = j % 6 === 0, sting = S.sting && t - S.sting < 1.8 ? Math.max(0, 1 - Math.abs((t - S.sting) / 1.4 - j / NT) * 8) : 0, run = Math.max(sting, nxt ? Math.max(0, 1 - Math.abs(((t * 0.55) % 1.2) - j / NT) * 9) : 0);
          dot(pts[j][0], pts[j][1], (big ? 2.1 : 1.2) * (on ? 1.15 : 1) * (1 + run * 0.8), Math.min(1, (on ? 0.4 + 0.55 * tw : 0.22 + 0.25 * tw) + run * 0.7) * a2); }
      }); x.restore(); });
    if (FORM.wline) { var tl3 = T.tents[3]; stroke(tl3, 1.1, 0.88 * k0, false); for (var j3 = 4; j3 < NT - 1; j3 += 3) dot(tl3[j3][0], tl3[j3][1], j3 % 6 === 0 ? 1.8 : 1.1, (0.35 + 0.3 * Math.sin(t * 2.2 - j3 * 0.4)) * k0); }
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
    /* in W.I.S.H. the left tentacles carry the letters, so the receipt rides the right one, clear of the W */
    var held = S.stage === 0 ? 0.58 : 0.5, pos = null, k, on = function (i) { return i === 1 ? 2 : i; };
    if (S.round && t - S.round < 2.6) { k = Math.min(1, (t - S.round) / 1.6); pos = slipAt(T, 3, 0.92 - 0.88 * k); if (k >= 1) return; }
    else if (S.stage >= 2 && !S.deep && !(S.pass && t - S.pass.t0 < 1.1)) return;
    else if (S.pass && t - S.pass.t0 < 1.1) { k = (t - S.pass.t0) / 1.1; pos = k < 0.5 ? slipAt(T, on(S.pass.from), held - (held - 0.08) * k * 2) : slipAt(T, on(S.pass.to), 0.08 + (held - 0.08) * (k - 0.5) * 2); }
    else if (L.mob && S.stage === 0) return;
    else pos = slipAt(T, on(S.stage), held);
    var m = MINI.c, w = 22, h = m ? m.height / m.width * w : 40;
    x.save(); x.translate(pos[0], pos[1]); x.rotate((pos[2] - Math.PI / 2) * 0.25 + Math.sin(t * 0.9) * 0.05); x.globalAlpha = 0.95 * a;
    var sb = DARK ? '24,25,28' : '23,69,127'; x.fillStyle = m ? 'rgba(' + sb + ',1)' : 'rgba(' + sb + ',.6)'; x.fillRect(-w / 2, 0, w, h); if (m) x.drawImage(m, -w / 2, 0, w, h);
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
    var want = S.deep ? -1 : [0, 1, 2, 3][S.stage]; devK.forEach(function (b, i) { var on = devOpen(i) && i === want; b.hidden = !on; if (!on) return; var an = a2 + Math.PI, fr = Math.sin(an);
      b.style.transform = 'translate(' + (L.bx + Math.cos(an) * L.hrx).toFixed(1) + 'px,' + (L.gy + fr * L.hry).toFixed(1) + 'px) scale(' + (0.8 + 0.2 * (fr + 1) / 2).toFixed(3) + ')'; b.style.zIndex = fr > 0 ? 3 : 1; b.style.opacity = (S.fade * (0.6 + 0.4 * (fr + 1) / 2)).toFixed(2); });
  }
  /* ───────── the sound desk: everything musical, behind the sound key. Its own irukandji, whose four tentacles are the four tracks and
     whose beads are the steps, lit as they sound. A song is made from what is already here: the poster's lines (each word a note), the
     places and lives near (the radius), or the journey of posters on the wall, in one of three moods. Played, it goes on under the whole
     site; kept, it waits on the desk; it leaves as a 45 second loop, a link, or a card with its code on the poster ───────── */
  /* three moods, deep and under water: tide (a minor pentatonic, slow), bloom (open, a little quicker), doom (alien steps, slowest) */
  var MOODS = [
    { k: 'tide', ins: ['drop', 'whale', 'reed', 'sub'], bpm: 66, sc: [0, 3, 5, 7, 10], root: 1 },
    { k: 'bloom', ins: ['drop', 'reed', 'whale', 'sub'], bpm: 78, sc: [0, 2, 5, 7, 9], root: 1.12 },
    { k: 'doom', ins: ['grain', 'whale', 'reed', 'sub'], bpm: 54, sc: [0, 1, 5, 6, 10], root: 0.84 }];
  /* the intention's words set the desk's character, after latentscore's idea of text to musical settings (here in a few lines,
     no model): light words open the filter, dark ones close it; short quick words lift the tempo a little */
  var TXT = { bright: 0.45, tempo: 1 };
  var LIGHTW = /^(sun|light|bloom|joy|bright|morning|gold|play|dance|sing|swim|fly|spring|hope|warm|open|free|green|grow)/, DARKW = /^(night|dark|deep|loss|doom|dead|death|cold|storm|flood|fire|heat|grief|alone|drown|sink|rot|harm|ruin)/;
  function txtRead() { var s = P ? [P.say].concat(P.lines || []).join(' ') : '', ws = s.toLowerCase().split(/[^a-z]+/).filter(Boolean); if (!ws.length) { TXT.bright = 0.45; TXT.tempo = 1; return; }
    var l = ws.filter(function (w) { return LIGHTW.test(w); }).length, d = ws.filter(function (w) { return DARKW.test(w); }).length, avg = ws.join('').length / ws.length;
    TXT.bright = Math.max(0.1, Math.min(0.9, 0.45 + 0.12 * (l - d))); TXT.tempo = Math.max(0.85, Math.min(1.12, 1 + (5 - avg) * 0.03)); }
  var SRCS = [['lines', 'wish'], ['here', 'pin'], ['journey', 'wall'], ['web', 'cons']], STEPS_N = 32;
  var DESK = { el: null, song: null, src: 0, mood: 0, play: false, list: false, li: 0, mute: [false, false, false, false], step: -1, t0: 0, iv: 0, raf: 0, kept: store.get('da.aura.songs', []) || [] };
  var hashW = function (w) { var h = 2166136261; for (var i = 0; i < w.length; i++) { h ^= w.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
  /* the words a song is made of, a list for each track */
  function songWords(src) {
    var p = P, D = NG.DB(), split = function (t) { return String(t || '').toLowerCase().split(/[^a-z0-9À-ɏ]+/).filter(function (w) { return w.length > 1; }); };
    if (src === 0) { var ls = p ? [p.say].concat(p.lines || []) : [];
      if (!ls.some(Boolean)) { var f0 = FOLIO.filter(function (q) { return q.piece && (q.piece.say || (q.piece.lines || []).some(Boolean)); })[0]; if (f0) ls = [f0.piece.say].concat(f0.piece.lines || []); }
      return [0, 1, 2, 3].map(function (k) { return split(ls[k + 1] || ls[0] || ''); }); }
    if (src === 1) { var here = hereOf(), near = [];
      if (D) ['places', 'waters'].forEach(function (k) { (D[k] || []).forEach(function (q) { var d = NG.dist(here, { lat: q[1], lng: q[2] }); if (d < 1500) near.push([q[0], d]); }); });
      near.sort(function (a, b) { return a[1] - b[1]; }); if (NEAR && NEAR.lives) NEAR.lives.forEach(function (o) { near.push([o.t, o.d]); }); if (p && lifeOf(p)) near.unshift([lifeOf(p).cn, 0]);
      return [0, 1, 2, 3].map(function (k) { return near.filter(function (q, i) { return i % 4 === k; }).reduce(function (a, q) { return a.concat(split(q[0])); }, []); }); }
    var caps = FOLIO.slice().reverse().map(function (f) { return f.cap || f.code || ''; });
    return [0, 1, 2, 3].map(function (k) { return caps.reduce(function (a, c2, i) { return i % 4 === k || caps.length < 4 ? a.concat(split(c2)) : a; }, []); });
  }
  /* each word a note: where it falls in the bar and how high, from its letters; the melody busiest, the voice long and sparse, the bass low */
  /* the web of the radius: the named places, waters, cities and one's own noticings within 1.5 km, joined each to its nearest
     unjoined neighbour (a spanning tree, as the base drew its nets). Every join is a note: the shorter, the higher; the four
     tracks are the four constellations it falls into, north, east, south and west of here, each played in the order it was drawn */
  function webSong(mood) {
    var p = hereOf(), pts = spotsAll().filter(function (o) { return NG.dist(p, o) < 1500; }).slice(0, 40), rows = [[], [], [], []], lab = [{}, {}, {}, {}], geoE = [];
    var tracks = rows.map(function () { var r = []; for (var i = 0; i < STEPS_N; i++) r.push('.'); return r; });
    if (pts.length > 1) { var inT = [0], edges = [], used = {}; used[0] = 1;
      while (inT.length < pts.length) { var best = null; inT.forEach(function (a) { pts.forEach(function (b2, j) { if (used[j]) return; var d = NG.dist(pts[a], b2); if (!best || d < best[2]) best = [a, j, d]; }); }); if (!best) break; used[best[1]] = 1; inT.push(best[1]); edges.push(best); }
      edges.forEach(function (e) { var a = pts[e[0]], b2 = pts[e[1]], my = (a.lat + b2.lat) / 2 - p.lat, mx = ((a.lng + b2.lng) / 2 - p.lng) * Math.cos(p.lat * Math.PI / 180), k = Math.abs(my) > Math.abs(mx) ? (my > 0 ? 0 : 2) : (mx > 0 ? 1 : 3); rows[k].push(e); });
      rows.forEach(function (es, k) { if (!es.length) return; var n2 = [12, 8, 6, 6][k]; for (var j = 0; j < n2; j++) { var e = es[j % es.length], at = Math.floor(j * STEPS_N / n2); if (k > 1) at -= at % 2; lab[k][at] = pts[e[0]].t + ' · ' + pts[e[1]].t; geoE.push([e[0], e[1], at]); tracks[k][at] = String(Math.max(0, 9 - Math.min(9, Math.floor(e[2] / 90)) - (j >= es.length ? 1 : 0) * (j % 3))); } }); }
    return { m: mood, s: 3, t: tracks.map(function (r) { return r.join(''); }), lab: lab, geo: { p: p, pts: pts.map(function (o) { return [o.lat, o.lng]; }), e: geoE } };
  }
  /* where the radius is: the piece's own place, else the map's, else the site's centre (with location off a piece may have none) */
  var hereOf = function () { if (P && isFinite(P.lat) && isFinite(P.lng)) return { lat: +P.lat, lng: +P.lng }; if (NG.map && isFinite(NG.map.lat)) return { lat: NG.map.lat, lng: NG.map.lng }; return { lat: B.centre[0], lng: B.centre[1] }; };
  /* a song with nothing in it is never kept */
  var songEmpty = function (sg) { return !sg || sg.t.every(function (r) { return !/\d/.test(r); }); };
  function songMake(src, mood) {
    if (src === 3) return webSong(mood);
    var W = songWords(src), lab = [{}, {}, {}, {}], tracks = W.map(function (ws, k) { var row = []; for (var i = 0; i < STEPS_N; i++) row.push('.');
      var every = [1, 2, 4, 2][k], cap = [12, 8, 4, 6][k];
      /* only what is here: never filled out with words of the site's own, so nothing plays that was not made */
      var own = ws.slice(); while (own.length && own.length < cap * 2) own = own.concat(ws);
      own.slice(0, cap * 2).forEach(function (w, j) { var h = hashW(w + k), at = ((j * [3, 5, 8, 4][k]) + (h % 7)) % STEPS_N; at -= at % every; var d = k === 3 ? h % 5 : h % 10, n2 = row.filter(function (c) { return c !== '.'; }).length;
        if (row[at] === '.' && n2 < cap) { row[at] = String(d); lab[k][at] = w; var e2 = (at + 16) % STEPS_N; if (k < 2 && row[e2] === '.' && n2 + 1 < cap) { row[e2] = String((d + 2) % 10); lab[k][e2] = w; } } });
      return row.join(''); });
    return { m: mood, s: src, t: tracks, lab: lab };
  }
  var songCode = function (sg) { return 'v1' + sg.m + sg.s + sg.t.join('-'); };
  var songOf = function (code) { var m = String(code || '').match(/^v1([0-2])([0-3])([.0-9]{32})-([.0-9]{32})-([.0-9]{32})-([.0-9]{32})$/); return m ? { m: +m[1], s: +m[2], t: [m[3], m[4], m[5], m[6]] } : null; };
  var songsURL = function (codes) { var base = /localhost|\.test$|workers\.dev$/.test(location.hostname) ? location.origin + '/' : (B.portal || location.origin + '/'); return base.replace(/#.*$/, '') + '#songs=' + codes.join('~'); };
  var songURL = function (sg) { var base = /localhost|\.test$|workers\.dev$/.test(location.hostname) ? location.origin + '/' : (B.portal || location.origin + '/'); return base.replace(/#.*$/, '') + '#song=' + songCode(sg); };
  var stepDur = function (sg) { return 60 / (MOODS[sg.m].bpm * TXT.tempo) / 4; };
  /* the desk's own voices, deep and under water: a drop falling into the water, a whale's slow glide, a reed pad through a closed
     filter, a sub felt more than heard, grains of dust. Made each time, nothing recorded */
  var DV = {
    drop: function (c, o, t, f, v) { var s = c.createOscillator(), g = c.createGain(); s.type = 'sine'; s.frequency.setValueAtTime(f * 2.6, t); s.frequency.exponentialRampToValueAtTime(f, t + 0.09); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); s.connect(g); g.connect(o); s.start(t); s.stop(t + 0.75); },
    whale: function (c, o, t, f, v) { var s = c.createOscillator(), lf = c.createOscillator(), lg = c.createGain(), g = c.createGain(); s.type = 'triangle'; s.frequency.setValueAtTime(f * 0.94, t); s.frequency.linearRampToValueAtTime(f, t + 0.6); s.frequency.linearRampToValueAtTime(f * 0.97, t + 2.2); lf.frequency.value = 4.2; lg.gain.value = f * 0.012; lf.connect(lg); lg.connect(s.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); s.connect(g); g.connect(o); s.start(t); lf.start(t); s.stop(t + 2.5); lf.stop(t + 2.5); },
    reed: function (c, o, t, f, v) { var lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(f * 1.5, t); lp.frequency.exponentialRampToValueAtTime(f * 4, t + 0.25); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 1.4);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); [-8, 7].forEach(function (dt) { var s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; s.detune.value = dt; s.connect(lp); s.start(t); s.stop(t + 1.6); }); lp.connect(g); g.connect(o); },
    sub: function (c, o, t, f, v) { var s = c.createOscillator(), g = c.createGain(); s.type = 'sine'; s.frequency.setValueAtTime(f, t); s.frequency.exponentialRampToValueAtTime(f * 0.96, t + 1.6); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 1.4, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7); s.connect(g); g.connect(o); s.start(t); s.stop(t + 1.8); },
    grain: function (c, o, t, f, v) { if (!c.__grain) { var n = Math.floor(c.sampleRate * 0.4), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() < 0.02 ? Math.random() * 2 - 1 : (Math.random() * 2 - 1) * 0.08; c.__grain = b; }
      var s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); s.buffer = c.__grain; bp.type = 'bandpass'; bp.frequency.value = f * 4; bp.Q.value = 6; g.gain.setValueAtTime(v * 1.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); s.connect(bp); bp.connect(g); g.connect(o); s.start(t); s.stop(t + 0.42); }
  };
  var DVB = { drop: 392, whale: 196, reed: 98, sub: 49, grain: 220 };
  /* under water: the desk's notes through a filter that breathes slowly and an echo that comes back fainter; one chain for each
     sound engine (the speakers, or a loop being made) */
  function deskOut(c) { if (c.__desk) return c.__desk; var lp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain(), dl = c.createDelay(2), fb = c.createGain(), wet = c.createGain(), out = NG.bus(c), inp = c.createGain();
    lp.type = 'lowpass'; lp.Q.value = 0.9; lp.frequency.value = 900; lfo.frequency.value = 0.07; lg.gain.value = 260; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    dl.delayTime.value = 0.43; fb.gain.value = 0.38; wet.gain.value = 0.42; inp.connect(lp); lp.connect(out); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out);
    c.__desk = { in: inp, lp: lp, dl: dl }; return c.__desk; }
  /* a device open over the desk: the song carries on, quieter, under it */
  function deskDuck(on) { if (!DESK.play) return; try { var c = NG.ac(); deskOut(c).in.gain.setTargetAtTime(on ? 0.3 : 1, c.currentTime, 0.4); } catch (e) { /* none */ } }
  function noteAt(c, out, sg, k, d, t) {
    if (DESK.mute[k]) return;
    var M = MOODS[sg.m], name = M.ins[k], V = DV[name] || DV.drop, oct = Math.floor(d / 5), f = (DVB[name] || 196) * M.root * Math.pow(2, (M.sc[d % 5] + 12 * oct) / 12), D2 = deskOut(c);
    try { D2.lp.frequency.setTargetAtTime(500 + 900 * TXT.bright, t, 0.5); V(c, D2.in, t, f, [0.16, 0.14, 0.1, 0.22][k] * (0.7 + 0.3 * TXT.bright)); } catch (e) { /* a voice missing */ }
  }

  /* played: the song on the desk, or (list) every kept song in turn, each twice through, round and round. Nothing plays that is empty */
  /* the kept songs laid with it, as tracks: each kept song can be on, and plays with the desk's song, in its time */
  var layered = function () { return DESK.kept.filter(function (q) { return q.on; }).map(function (q) { return songOf(q.code); }).filter(function (q) { return q && !songEmpty(q); }); };
  function songPlay(on, list) {
    clearInterval(DESK.iv); DESK.iv = 0; DESK.list = !!on && !!list && DESK.kept.length > 0; DESK.step = -1;
    if (DESK.list) { DESK.li = Math.min(DESK.li || 0, DESK.kept.length - 1); var s0 = songOf(DESK.kept[DESK.li].code); if (s0) { DESK.song = s0; DESK.mood = s0.m; DESK.src = s0.s; } }
    DESK.play = !!on && (!songEmpty(DESK.song) || (!list && layered().length > 0)); if (DESK.play && songEmpty(DESK.song)) DESK.song = layered()[0]; if (DESK.el) { DESK.el.classList.toggle('playing', DESK.play); DESK.el.classList.toggle('listing', DESK.list && DESK.play); deskSync(); }
    if (!DESK.play) { DESK.list = false; humSet(S.mode !== 'seed'); return; }
    beat('desk-play'); txtRead(); devLetGo(); humSet(false); var c = NG.ac(), out = NG.bus(c), sg = DESK.song, sd = stepDur(sg), next = c.currentTime + 0.08, n = 0, li = DESK.li || 0; DESK.t0 = next;
    DESK.iv = setInterval(function () { if (!DESK.play || (!DESK.list && DESK.song !== sg)) return; while (next < c.currentTime + 0.25) {
      if (DESK.list && n === STEPS_N * 2) { li = (li + 1) % DESK.kept.length; DESK.li = li; setTimeout(deskKept, 0); var s2 = songOf((DESK.kept[li] || {}).code); if (s2) { sg = DESK.song = s2; DESK.mood = s2.m; DESK.src = s2.s; sd = stepDur(sg); DESK.t0 = next; deskSync(); } n = 0; }
      var st = n % STEPS_N, all = DESK.list ? [sg] : [sg].concat(layered()); all.forEach(function (g2) { g2.t.forEach(function (row, k) { var ch = row.charAt(st); if (ch !== '.') noteAt(c, out, g2, k, +ch, next); }); }); next += sd; n++; } }, 40);
  }
  /* the playlist as a card for the poster: each kept song a line of stars, its mood beside it, and one code that brings them all back */
  function listCard(codes) {
    var sgs = codes.map(songOf).filter(Boolean), W = 600, row = 46, H = Math.max(240, 30 + sgs.length * row + 20), c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = x.strokeStyle = '#111';
    var gx = 28, gw = 300; sgs.forEach(function (sg, i) { var y0 = 30 + i * row, pts = []; for (var st = 0; st < STEPS_N; st++) sg.t.forEach(function (r, k) { var ch = r.charAt(st); if (ch !== '.') pts.push([gx + st * gw / (STEPS_N - 1), y0 + 30 - (+ch) * 2.4 - k * 2]); });
      x.lineWidth = 1; x.beginPath(); pts.forEach(function (q, j) { if (j) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }); x.stroke(); pts.forEach(function (q, j) { x.beginPath(); x.arc(q[0], q[1], j % 4 ? 1.8 : 3, 0, 7); x.fill(); });
      x.font = '500 12px "Departure Mono", ui-monospace, Menlo, monospace'; x.fillText(String(i + 1).padStart(2, '0') + ' ' + MOODS[sg.m].k, gx + gw + 14, y0 + 22); });
    var Q = window.qrcode; if (Q) { try { var q = Q(0, 'L'); q.addData(songsURL(codes)); q.make(); var n = q.getModuleCount(), cell = Math.max(2, Math.floor(190 / n)), side = n * cell, qx = W - side - 22, qy = (H - side) / 2; for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect(qx + cc * cell, qy + r * cell, cell, cell); } catch (e) { /* too many for one code */ } }
    return c;
  }
  /* 45 seconds exactly (the tempo eased a hair to fit whole bars), rendered off the clock, its tail folded back to its head so it loops without a seam */
  function songLoop(sg, more) {
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OC || !NG.wav) return Promise.resolve(null);
    var SR = 44100, reps = Math.max(1, Math.round(45 / (stepDur(sg) * STEPS_N))), sd = 45 / (reps * STEPS_N), len = 45, N = Math.round(len * SR), tail = 6, c = new OC(2, N + tail * SR, SR), out = NG.bus(c), all = [sg].concat(more || []);
    for (var r = 0; r < reps; r++) for (var st = 0; st < STEPS_N; st++) all.forEach(function (g2) { g2.t.forEach(function (row, k) { var ch = row.charAt(st); if (ch !== '.') noteAt(c, out, g2, k, +ch, (r * STEPS_N + st) * sd); }); });
    return new Promise(function (res) { var done = function (buf) { if (c.__done) return; c.__done = 1; var chans = []; for (var ch = 0; ch < buf.numberOfChannels; ch++) { var d = buf.getChannelData(ch), o = new Float32Array(N); o.set(d.subarray(0, N)); for (var k = N; k < d.length; k++) o[k % N] += d[k]; chans.push(o); }
      res({ blob: NG.wav({ numberOfChannels: chans.length, length: N, sampleRate: SR, getChannelData: function (i) { return chans[i]; } }), seconds: len }); };
      c.oncomplete = function (e) { done(e.renderedBuffer); }; var pr = c.startRendering(); if (pr && pr.then) pr.then(done); });
  }
  /* the song as a card for the poster: its four tracks as constellations (each note a star, joined in turn), its mood, its code to play it */
  function songCard(sg) {
    var W = 600, H = 300, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = x.strokeStyle = '#111';
    var gx = 28, gw = 340; sg.t.forEach(function (row, k) { var y0 = 42 + k * 62, pts = []; for (var i = 0; i < STEPS_N; i++) { var ch = row.charAt(i); if (ch === '.') continue; pts.push([gx + i * gw / (STEPS_N - 1), y0 + 40 - (+ch) * 4]); }
      x.globalAlpha = 0.35; x.setLineDash([2, 4]); x.beginPath(); x.moveTo(gx, y0 + 46); x.lineTo(gx + gw, y0 + 46); x.stroke(); x.setLineDash([]); x.globalAlpha = 1; x.lineWidth = 1.2;
      x.beginPath(); pts.forEach(function (p2, j) { if (j) x.lineTo(p2[0], p2[1]); else x.moveTo(p2[0], p2[1]); }); x.stroke(); pts.forEach(function (p2, j) { x.beginPath(); x.arc(p2[0], p2[1], j % 3 ? 2.6 : 4, 0, 7); x.fill(); }); });
    x.font = '600 18px "Departure Mono", ui-monospace, Menlo, monospace'; x.fillText(MOODS[sg.m].k.toUpperCase(), gx, 24); x.font = '500 13px "Departure Mono", ui-monospace, Menlo, monospace'; x.fillText(SRCS[sg.s][0], gx + 120, 24);
    var Q = window.qrcode; if (Q) { try { var q = Q(0, 'L'); q.addData(songURL(sg)); q.make(); var n = q.getModuleCount(), cell = Math.max(2, Math.floor(200 / n)), side = n * cell, qx = W - side - 24, qy = (H - side) / 2; for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect(qx + cc * cell, qy + r * cell, cell, cell); } catch (e) { /* no code */ } }
    return c;
  }
  /* the desk's picture: how the sound is made. Four lanes, one a track: its words arrive from the left as notes, each sounds in its
     voice (drop, whale, reed, sub), then all go through the water (a filter that breathes) and the echo, to you. What sounds now is lit
     along its whole way; a layer turned off is a dashed lane; the tracks laid with it run as fainter lanes beside its own */
  /* each voice's own mark inside its ring: a drop, a whale's tail, the reed's stems, the sub's low swell, the dust's grains */
  function voiceMark(g, name, x, y, r, col, t, hit) {
    g.save(); g.strokeStyle = g.fillStyle = col; g.lineWidth = 1.1; g.translate(x, y); var s = 0.55 + 0.25 * hit; g.scale(s, s); g.beginPath();
    if (name === 'drop') { g.moveTo(0, -8); g.bezierCurveTo(5, -2, 6, 3, 0, 7); g.bezierCurveTo(-6, 3, -5, -2, 0, -8); g.stroke(); }
    else if (name === 'whale') { g.moveTo(-8, 2); g.quadraticCurveTo(0, 6, 5, -1); g.lineTo(8, -5); g.moveTo(5, -1); g.lineTo(8, 3); g.stroke(); }
    else if (name === 'reed') { [-4, 0, 4].forEach(function (q, i) { g.moveTo(q, 7); g.lineTo(q + Math.sin(t * 2 + i) * 1.2, -6 + i * 2); }); g.stroke(); }
    else if (name === 'sub') { for (var q = -8; q <= 8; q++) g.lineTo(q, Math.sin(q * 0.4 + t * 1.5) * 3.5); g.stroke(); }
    else { [[-4, -3], [3, -4], [0, 1], [-3, 5], [5, 4]].forEach(function (p2) { g.moveTo(p2[0] + 1, p2[1]); g.arc(p2[0], p2[1], 1, 0, 7); }); g.fill(); }
    g.restore();
  }
  function deskDraw() {
    cancelAnimationFrame(DESK.raf); var cv = DESK.el && DESK.el.querySelector('canvas'); if (!cv || DESK.el.hidden) return; var g = cv.getContext('2d'), dp = Math.min(2, window.devicePixelRatio || 1), Wc = cv.clientWidth, Hc = cv.clientHeight;
    if (cv.width !== Wc * dp) { cv.width = Wc * dp; cv.height = Hc * dp; } g.setTransform(dp, 0, 0, dp, 0, 0); g.clearRect(0, 0, Wc, Hc);
    var sg = DESK.song, t = performance.now() / 1000, st = -1, ph = 0; if (DESK.play && sg) { var a = NG.ac(), u = (a.currentTime - DESK.t0) / stepDur(sg); st = Math.floor(u) % STEPS_N; ph = u - Math.floor(u); if (st < 0) st = -1; }
    var M = MOODS[DESK.mood], ink = 'rgba(233,242,228,', x0 = 14, xv = Wc * 0.5, xw = Wc * 0.7, xe = Wc * 0.82, xy = Wc - 18, cy = Hc / 2, lane = function (k) { return 20 + k * (Hc - 40) / 3; };
    var F = function (al) { return ink + Math.max(0, Math.min(1, al)).toFixed(3) + ')'; }, font = function (px) { g.font = '500 ' + px + 'px "Departure Mono", ui-monospace, Menlo, monospace'; };
    var hit = [0, 0, 0, 0]; if (sg && st >= 0) for (var k0 = 0; k0 < 4; k0++) if (sg.t[k0].charAt(st) !== '.' && !DESK.mute[k0]) hit[k0] = 1 - ph;
    var any = Math.max.apply(null, hit);
    /* the lanes and the notes on their way: the next eight steps, nearer as they come */
    for (var k = 0; k < 4; k++) { var y = lane(k), off = DESK.mute[k], row = sg ? sg.t[k] : '';
      g.setLineDash(off ? [2, 4] : []); g.strokeStyle = F(off ? 0.18 : 0.22 + 0.6 * hit[k]); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y); g.lineTo(xv - 12, y); g.stroke(); g.setLineDash([]);
      for (var j = 0; j < 8 && row; j++) { var s2 = ((st < 0 ? 0 : st) + j) % STEPS_N, ch = row.charAt(s2); if (ch === '.') continue; var fx = xv - 12 - (j + (st < 0 ? 0 : ph)) * (xv - 12 - x0) / 8, al = off ? 0.15 : 0.35 + 0.5 * (1 - j / 8);
        g.fillStyle = F(al); g.beginPath(); g.arc(fx, y - (+ch - 4.5) * 0.9, 1.6 + (+ch) * 0.18, 0, 7); g.fill();
        if (j === 0 && st >= 0 && sg.lab && sg.lab[k][s2] && !off) { DESK.word = DESK.word || []; DESK.word[k] = { w: String(sg.lab[k][s2]).slice(0, 16), t: t }; } }
      /* the word that sounded on this lane, held until the next replaces it, fading after a few seconds */
      var dw = DESK.word && DESK.word[k]; if (dw && DESK.play && !off) { var age = t - dw.t; font(10); g.fillStyle = F(Math.max(0, 0.9 - Math.max(0, age - 3) * 0.3)); g.fillText(dw.w, x0, y - 6); }
      /* the tracks laid with it: one faint lane of dots each, above its own */
      layered().slice(0, 3).forEach(function (l2, li2) { var r2 = l2.t[k]; for (var j2 = 0; j2 < 8; j2++) { var s3 = ((st < 0 ? 0 : st) + j2) % STEPS_N; if (r2.charAt(s3) === '.') continue; g.fillStyle = F(0.22); g.beginPath(); g.arc(xv - 12 - (j2 + ph) * (xv - 12 - x0) / 8, y + 6 + li2 * 3, 1, 0, 7); g.fill(); } });
      /* the voice: a ring that rings when its note sounds */
      var vr = 9 + 5 * hit[k]; g.strokeStyle = F(off ? 0.25 : 0.55 + 0.45 * hit[k]); g.lineWidth = 1.2; g.beginPath(); g.arc(xv, y, vr, 0, 7); g.stroke(); if (hit[k]) { g.fillStyle = F(0.25 * hit[k]); g.fill(); }
      voiceMark(g, M.ins[k], xv, y, vr, F(off ? 0.35 : 0.85), t, hit[k]);
      /* to the water */
      g.strokeStyle = F(0.15 + 0.6 * hit[k]); g.lineWidth = 1; g.beginPath(); g.moveTo(xv + vr, y); g.quadraticCurveTo((xv + xw) / 2, y, xw - 14, cy); g.stroke();
      if (hit[k]) { var q = 1 - hit[k], px = xv + (xw - xv) * q, py = y + (cy - y) * q * q; g.fillStyle = F(0.9); g.beginPath(); g.arc(px, py, 2.2, 0, 7); g.fill(); } }
    /* the water: its line breathing (the filter's slow sweep), wider when the words are light */
    var br = TXT.bright, wob = Math.sin(t * 2 * Math.PI * 0.07); g.strokeStyle = F(0.55 + 0.4 * any); g.lineWidth = 1.2; g.beginPath(); g.arc(xw, cy, 14, 0, 7); g.stroke();
    g.beginPath(); for (var i = 0; i <= 20; i++) { var wx = xw - 9 + i * 0.9, wy = cy + Math.sin(i * 0.7 + t * 3) * (1.5 + 3 * br + wob); if (i) g.lineTo(wx, wy); else g.moveTo(wx, wy); } g.stroke();

    /* the echo: rings going out and coming back fainter, as its repeats do */
    g.strokeStyle = F(0.3 + 0.5 * any); g.beginPath(); g.moveTo(xw + 14, cy); g.lineTo(xe - 10, cy); g.stroke();
    for (var e = 0; e < 3; e++) { var ek = ((t / 0.43) + e / 3) % 1; g.strokeStyle = F((0.5 - ek * 0.5) * (DESK.play ? 1 : 0.3)); g.beginPath(); g.arc(xe, cy, 6 + ek * 12, 0, 7); g.stroke(); }

    /* you */
    g.strokeStyle = F(0.3 + 0.5 * any); g.beginPath(); g.moveTo(xe + 10, cy); g.lineTo(xy - 8, cy); g.stroke();
    g.fillStyle = F(0.7 + 0.3 * any); g.beginPath(); g.arc(xy, cy, 3.5 + 2.5 * any, 0, 7); g.fill();
    /* the radius's web, when it is what the song is made of: faint behind, the join sounding lit */
    if (sg && sg.geo && sg.geo.pts.length > 1) { var G = sg.geo, kx = Math.cos(G.p.lat * Math.PI / 180), R0 = 0.0135, box = Math.min(Wc * 0.4, Hc) * 0.9, ox = 10, oy = (Hc - box) / 2,
        P2 = function (q2) { return [ox + box / 2 + (q2[1] - G.p.lng) * kx / R0 * box / 2, oy + box / 2 - (q2[0] - G.p.lat) / R0 * box / 2]; };
      G.e.forEach(function (e2) { var a1 = P2(G.pts[e2[0]]), b1 = P2(G.pts[e2[1]]), on = e2[2] === st; g.strokeStyle = F(on ? 0.7 : 0.08); g.lineWidth = on ? 1.4 : 0.8; g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.stroke(); }); }
    DESK.raf = requestAnimationFrame(deskDraw);
  }
  /* the kept songs as a small player's list, after the players of old: a number, its mood and where it came from, its length, the one
     playing lit; a press plays the list from there, round and round */
  function deskKept() { var ul = DESK.el && DESK.el.querySelector('.au-kept'); if (!ul) return;
    var len = function (code) { var sg = songOf(code); if (!sg) return ''; var s = Math.round(stepDur(sg) * STEPS_N * 2); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); };
    ul.innerHTML = DESK.kept.map(function (k2, i) { var m = MOODS[+k2.code.charAt(2)], sc = SRCS[+k2.code.charAt(3)]; return '<li class="' + (DESK.list && DESK.play && DESK.li === i ? 'on' : '') + (k2.on ? ' lay' : '') + '"><button class="ly" data-kl="' + i + '" aria-pressed="' + !!k2.on + '" aria-label="Lay this track with the song"></button><button data-ks="' + i + '" aria-label="Play from here"><b>' + ('0' + (i + 1)).slice(-2) + '</b><span>' + (k2.name ? esc(k2.name) : esc(m ? m.k : '') + ' · ' + esc(sc ? sc[0] : '')) + '</span><i>' + len(k2.code) + '</i></button><button class="sv" data-kv="' + i + '" aria-label="Save this track alone">' + svgI('save') + '</button><button class="x" data-kx="' + i + '" aria-label="Let it go">×</button></li>'; }).join('');
    [].forEach.call(ul.querySelectorAll('[data-kl]'), function (b) { b.addEventListener('click', function () { var q = DESK.kept[+b.dataset.kl]; q.on = !q.on; store.set('da.aura.songs', DESK.kept); deskKept(); bell(+b.dataset.kl % 4, 0.1); }); });
    [].forEach.call(ul.querySelectorAll('[data-kv]'), function (b) { b.addEventListener('click', function () { var sg = songOf(DESK.kept[+b.dataset.kv].code); if (!sg) return; b.classList.add('going'); songLoop(sg).then(function (r) { b.classList.remove('going'); if (r) saveWav(r.blob, 'novel-global-track-' + (+b.dataset.kv + 1) + '.wav'); }); }); });
    [].forEach.call(ul.querySelectorAll('[data-ks]'), function (b) { b.addEventListener('click', function () { DESK.li = +b.dataset.ks; songPlay(true, true); deskKept(); }); });
    [].forEach.call(ul.querySelectorAll('[data-kx]'), function (b) { NG.sureTap(b, function () { DESK.kept.splice(+b.dataset.kx, 1); store.set('da.aura.songs', DESK.kept); deskKept(); }); }); }
  function saveWav(blob, name) { var a = document.createElement('a'); a.download = name; a.href = URL.createObjectURL(blob); document.body.appendChild(a); a.click(); a.remove(); }
  function deskSync() { if (!DESK.el) return; DESK.el.setAttribute('data-mood', MOODS[DESK.mood].k); [].forEach.call(DESK.el.querySelectorAll('[data-src]'), function (b) { b.classList.toggle('on', +b.dataset.src === DESK.src); }); [].forEach.call(DESK.el.querySelectorAll('[data-mood]'), function (b) { b.classList.toggle('on', +b.dataset.mood === DESK.mood); }); DESK.el.querySelector('#sd-drone').classList.toggle('on', !mute); DESK.el.querySelector('#sd-list').classList.toggle('on', DESK.list && DESK.play);
    [].forEach.call(DESK.el.querySelectorAll('[data-ly]'), function (b) { var q = +b.dataset.ly; b.setAttribute('aria-pressed', String(!DESK.mute[q])); b.classList.toggle('off', DESK.mute[q]); b.setAttribute('data-fw', MOODS[DESK.mood].ins[q]); });
    DESK.el.querySelector('#sd-list').classList.toggle('none', !DESK.kept.length); DESK.el.querySelector('#sd-lcard').classList.toggle('none', !DESK.kept.length); }
  /* which sources have anything in them, from what is here now */
  function deskAvail() { if (!DESK.el) return; [].forEach.call(DESK.el.querySelectorAll('[data-src]'), function (b) { b.classList.toggle('none', songEmpty(songMake(+b.dataset.src, DESK.mood))); }); }
  function deskOpen(given) {
    closeDev(); DESK.kept = store.get('da.aura.songs', []) || DESK.kept;   // a device may have kept one since (a constellation's song)
    if (!DESK.el) {
      var k = function (cls, inner, attrs) { return '<button class="' + cls + '" ' + attrs + '>' + inner + '</button>'; };
      DESK.el = document.createElement('section'); DESK.el.className = 'au-desk'; DESK.el.setAttribute('role', 'dialog'); DESK.el.setAttribute('aria-label', 'Sound');
      DESK.el.innerHTML = '<header><i class="led"></i><b>SOUND</b>' + k('sd-k sd-drone', svgI('hum'), 'id="sd-drone" data-fw="hum" aria-label="The hum on or off"') + k('au-wx', svgI('eyet'), 'aria-label="Back to novel.global"') + '</header><canvas aria-hidden="true"></canvas>' +
        '<nav class="sd-row">' + SRCS.map(function (s2, i) { return k('sd-k', svgI(s2[1]), 'data-src="' + i + '" data-fw="' + s2[0] + '" aria-label="Made from: ' + s2[0] + '"'); }).join('') + '<i class="sd-gap"></i>' +
        MOODS.map(function (m2, i) { return k('sd-k', svgI(['pxjelly', 'pxcoral', 'moon2'][i]), 'data-mood="' + i + '" data-fw="' + m2.k + '" aria-label="Mood: ' + m2.k + '"'); }).join('') + '</nav>' +
        '<nav class="sd-row sd-play">' + k('sd-k', svgI('again'), 'id="sd-new" data-fw="again" aria-label="Make it again"') + k('sd-big', '<i class="sd-tri"></i>', 'id="sd-go" aria-label="Play or stop"') + k('sd-k', svgI('plus'), 'id="sd-keep" data-fw="keep" aria-label="Keep it"') + k('sd-k', svgI('list'), 'id="sd-list" data-fw="playlist" aria-label="Play every kept song in turn, round and round"') + '</nav>' +
        '<nav class="sd-row sd-layers" aria-label="The four layers">' + [0, 1, 2, 3].map(function (q) { return k('sd-k sd-ly', '<i class="ly ly' + q + '"></i>', 'data-ly="' + q + '" aria-pressed="true" data-fw="' + MOODS[0].ins[q] + '" aria-label="Layer ' + (q + 1) + ', on or off"'); }).join('') + '</nav>' +
        '<nav class="sd-row">' + k('sd-k', svgI('save'), 'id="sd-loop" data-fw="loop" aria-label="A 45 second loop to save"') + k('sd-k', svgI('pics'), 'id="sd-card" data-fw="card" aria-label="Onto my poster"') + k('sd-k', svgI('copy'), 'id="sd-link" data-fw="link" aria-label="Copy its link"') + k('sd-k', svgI('qrc'), 'id="sd-lcard" data-fw="list card" aria-label="The playlist onto my poster, with one code for all of it"') + k('sd-k', svgI('dradio'), 'id="sd-radio" data-fw="radio" aria-label="The radio: layers and moods on the map"') + '</nav>' +
        '<ul class="au-kept"></ul>';
      root.appendChild(DESK.el);
      var mk2 = function (go) { DESK.song = songMake(DESK.src, DESK.mood); deskSync(); if (DESK.play || go) songPlay(true); };
      [].forEach.call(DESK.el.querySelectorAll('[data-src]'), function (b) { b.addEventListener('click', function () { DESK.src = +b.dataset.src; NG.db().then(function () { mk2(); }); }); });
      [].forEach.call(DESK.el.querySelectorAll('[data-mood]'), function (b) { b.addEventListener('click', function () { DESK.mood = +b.dataset.mood; if (DESK.song) { DESK.song.m = DESK.mood; deskSync(); if (DESK.play) songPlay(true); } else mk2(); }); });
      DESK.el.querySelector('#sd-new').addEventListener('click', function () { mk2(); });
      DESK.el.querySelector('#sd-go').addEventListener('click', function () { if (!DESK.song) mk2(); if (songEmpty(DESK.song) && !DESK.play) { DESK.el.classList.add('empty'); setTimeout(function () { DESK.el.classList.remove('empty'); }, 900); return; } songPlay(!DESK.play); });
      DESK.el.querySelector('#sd-list').addEventListener('click', function () { if (!DESK.kept.length) { DESK.el.classList.add('empty'); setTimeout(function () { DESK.el.classList.remove('empty'); }, 900); return; } songPlay(!(DESK.play && DESK.list), true); });
      DESK.el.querySelector('#sd-lcard').addEventListener('click', function () { if (!DESK.kept.length) return; var u = listCard(DESK.kept.map(function (q) { return q.code; })).toDataURL('image/png'); deskClose(); window.postMessage({ ng: 'piece', url: u, crisp: true }, location.origin); });
      DESK.el.querySelector('#sd-keep').addEventListener('click', function () { if (songEmpty(DESK.song)) return; beat('song'); beat('desk-keep'); lvUp(3); made('song', MOODS[DESK.song.m].k + ' · ' + SRCS[DESK.song.s][0]); var code = songCode(DESK.song); if (!DESK.kept.some(function (q) { return q.code === code; })) { DESK.kept.unshift({ code: code, at: Date.now() }); DESK.kept.splice(12); store.set('da.aura.songs', DESK.kept); } deskKept(); bubbles(3); });
      DESK.el.querySelector('#sd-loop').addEventListener('click', function () { var b = this; if (!DESK.song) return; b.classList.add('going'); var more = layered(); songLoop(DESK.song, more).then(function (r) { b.classList.remove('going'); if (!r) return; S.lastLoop = r.seconds; saveWav(r.blob, 'novel-global-' + MOODS[DESK.song.m].k + (more.length ? '-' + (more.length + 1) + '-tracks' : '') + '-loop.wav'); }); });
      DESK.el.querySelector('#sd-card').addEventListener('click', function () { if (!DESK.song) return; var u = songCard(DESK.song).toDataURL('image/png'); deskClose(); window.postMessage({ ng: 'piece', url: u, crisp: true }, location.origin); });
      DESK.el.querySelector('#sd-link').addEventListener('click', function () { if (!DESK.song) return; var u = songURL(DESK.song); try { navigator.clipboard.writeText(u); } catch (e) { /* none */ } bell(4, 0.12); });
      DESK.el.querySelector('#sd-radio').addEventListener('click', function () { if (!devOpen(0)) return; deskClose(); openDev(0); });
      DESK.el.querySelector('#sd-drone').addEventListener('click', function () { mute = !mute; store.set('da.aura.mute', mute); $('#au-snd').classList.toggle('off', mute); if (!mute) { window.__auraSound = 1; humStart(); } humSet(!DESK.play); deskSync(); });
      DESK.el.querySelector('.au-wx').addEventListener('click', deskClose);
      [].forEach.call(DESK.el.querySelectorAll('[data-ly]'), function (b) { b.addEventListener('click', function () { var q = +b.dataset.ly; DESK.mute[q] = !DESK.mute[q]; deskSync(); bell(q, 0.12); }); });
    }
    if (given) { DESK.song = given; DESK.src = given.s; DESK.mood = given.m; } else if (!DESK.song) DESK.song = songMake(DESK.src, DESK.mood);
    beat('desk-open'); DESK.el.hidden = false; root.classList.add('desk'); applyGates(); deskSync(); deskKept(); deskDraw(); flashWords(200); bell(6, 0.16);
    /* the places of the radius arrive with the field data: a song made before they came is made again once they are here */
    /* ready on what there is, and quiet until play is pressed (a song's own link plays at once) */
    NG.db().then(function () { deskAvail(); if (DESK.play) return;
      if (given) { songPlay(true); return; }
      if (DESK.song && !songEmpty(DESK.song)) return;
      var order = [DESK.src, 0, 1, 3, 2]; for (var i = 0; i < order.length; i++) { var sg = songMake(order[i], DESK.mood); if (!songEmpty(sg)) { DESK.src = order[i]; DESK.song = sg; deskSync(); return; } }
      DESK.song = songMake(DESK.src, DESK.mood); deskSync(); });
  }
  function deskClose() { if (!DESK.el || DESK.el.hidden) return; DESK.el.hidden = true; root.classList.remove('desk'); cancelAnimationFrame(DESK.raf); }
  api.desk = function (o) { if (o === false) deskClose(); else deskOpen(o && o.code ? songOf(o.code) : null); return DESK.song ? { code: songCode(DESK.song), play: DESK.play, kept: DESK.kept.length, loop: S.lastLoop || 0 } : null; };
  api.songLoop = function () { return DESK.song ? songLoop(DESK.song).then(function (r) { return r ? { bytes: r.blob.size, seconds: r.seconds } : null; }) : Promise.resolve(null); };
  /* seven devices, each earned on its own and never opening another: the simple ones (the music, INTENTION with W.I.S.H.'s lines,
     the art and print steps) and the complex ones (the radio, the research board, design, the four-track desk). Each needs as many
     posters finished as the approval page sets; open makes them all open, closed leaves only those set to none */
  var GATE_AT = { music: 0, intention: 0, print: 0, radio: 1, wish: 2, design: 3, desk: 4 };
  var GATES = store.get('da.aura.gates', null) || { mode: 'earn', at: GATE_AT };
  var gateAt = function (k) { var at = GATES.at; if (Array.isArray(at)) at = { radio: at[0], wish: at[1], design: at[2] }; var v = at && at[k] != null ? +at[k] : GATE_AT[k]; return isFinite(v) ? v : GATE_AT[k]; };
  /* the journey, a loop learned step by step. 0: only the eye in the middle (the photo booth). 1: a photo taken or printed (its code on
     the paper): the map's disc (the intention, with what can be caught) and the sound (a drone). 2: an intention (written, or two or
     more things caught): W.I.S.H. and the radio. 3: a song kept, art on the poster, or W.I.S.H. finished: the pencil's ring (W.I.S.H. and
     the research board), art and print. 4: a poster with art printed: the wave's ring (design and the print shop). What is not reached
     yet is not there at all */
  var LVN = +store.get('da.lv', 0) || 0;
  var LV = function () { if (GATES.mode === 'open' || ROUNDS >= MARK_ORDER.length) return 5; return Math.max(LVN, ROUNDS > 0 ? 4 : 0); };
  var NEED = { music: 1, intention: 1, radio: 2, print: 3, wish: 3, design: 4, desk: 4, folio: 5 }, ORB_LV = [1, 3, 4], TAB_LV = [1, 2, 3, 3], DEV_LV = [2, 3, 4, 5];
  var earned = function (k) { if (ROUNDS >= MARK_ORDER.length || GATES.mode === 'open') return true; if (GATES.mode === 'closed') return gateAt(k) <= 0; return LV() >= (NEED[k] || 0) || (gateAt(k) > 0 && ROUNDS >= gateAt(k)); };
  function lvUp(n) { var was = LV(); if (n > LVN) { for (var q = LVN + 1; q <= n; q++) beat('lv' + q); LVN = n; store.set('da.lv', n); } var now = LV(); if (now > was) unlocked(was, now); }
  /* the booth (on the same page, or another visit) says a photo was taken: level one */
  function lvSync() { var was = LV(), n = Math.max(+store.get('da.lv', 0) || 0, store.get('da.who.pass', 0) || store.get('da.aura.printed', 0) ? 1 : 0, ROUNDS >= 2 ? 5 : 0); if (n > LVN) { for (var q = LVN + 1; q <= n; q++) beat('lv' + q); LVN = n; store.set('da.lv', n); } var now = LV(); if (now > was) unlocked(was, now); else applyGates(); keyName(); }
  addEventListener('ng-level', function () { lvSync(); });
  /* something new: it comes in where it lives, glowing a while, its word said once; what was done shows, then tucks itself away */
  function unlocked(from, to) {
    applyGates(); var fresh = [], in_ = function (n) { return n > from && n <= to; };
    orbs.forEach(function (o, i) { if (in_(ORB_LV[i])) fresh.push(o); }); tabs.forEach(function (b, i) { if (in_(TAB_LV[i])) fresh.push(b); }); devK.forEach(function (b, i) { if (in_(DEV_LV[i])) fresh.push(b); });
    if (in_(1)) fresh.push($('#au-snd'));
    fresh.forEach(function (e) { if (!e) return; e.classList.add('fresh'); setTimeout(function () { e.classList.remove('fresh'); }, 7000); var w = e.querySelector('.au-ow'); if (w) { w.classList.add('say'); setTimeout(function () { w.classList.remove('say'); }, 4000); } });
    flashWords(400); harp([0, 4, 7]); todoShow();
  }
  var DEV_K = ['radio', 'wish', 'design', 'folio'];
  var devK = [], devOpen = function (i) { return earned(DEV_K[i]); };
  /* the steps and keys of what is not earned are not there at all */
  function applyGates() { var lv = LV(); keyName(); orbs.forEach(function (o, i) { o.classList.toggle('gated', lv < ORB_LV[i]); }); tabs.forEach(function (b, i) { b.classList.toggle('gated', lv < TAB_LV[i]); });
    var sk = $('#au-snd'); if (sk) sk.hidden = !earned('music'); if (DESK.el) DESK.el.classList.toggle('simple', !earned('desk')); var rk = DESK.el && DESK.el.querySelector('#sd-radio'); if (rk) rk.hidden = !earned('radio'); }
  /* a device opened: the studio's page in a window of its own over the aura, smoked glass and a green light; the eye on its bar brings one
     straight back. One window for all three (another device turns the same studio to its page); kept while the visit lasts */
  var WIN = null;
  function openDev(i, auto) {
    /* the radio as the simple music radio (make a song) needs only the music; as the complex radio, its own posters */
    var d = DEVS[i]; if (!d || !(devOpen(i) || (auto === 'song' && i === 0 && earned('music')))) return;
    if (!WIN) { WIN = document.createElement('section'); WIN.className = 'au-win'; WIN.setAttribute('role', 'dialog'); WIN.setAttribute('aria-label', 'The studio');
      WIN.innerHTML = '<header><i class="led"></i><b></b><nav>' + DEVS.map(function (q, j) { return '<button data-wd="' + j + '" aria-label="' + q[1] + '">' + svgI(q[3]) + '</button>'; }).join('') + '</nav><button class="au-wx" aria-label="Back to novel.global">' + svgI('eyet') + '</button></header><iframe title="The studio" allow="geolocation; camera; autoplay"></iframe>';
      root.appendChild(WIN); var fr = WIN.querySelector('iframe');
      /* the studio's own way home lands back here, not inside the window */
      fr.addEventListener('load', function () { try { var lp = fr.contentWindow.location.pathname; if (lp === '/' || lp === '/index.html') closeDev(); } catch (e) { /* not ours */ } });
      WIN.querySelector('.au-wx').addEventListener('click', closeDev);
      [].forEach.call(WIN.querySelectorAll('[data-wd]'), function (b) { b.addEventListener('click', function () { openDev(+b.dataset.wd); }); }); }
    var f = WIN.querySelector('iframe'), want = '/studio?from=aura&night=' + (DARK ? 1 : 0) + '&only=' + d[2] + (auto ? '&auto=' + auto : '') + '#' + d[2];
    if (f.getAttribute('src') !== want) f.setAttribute('src', want);
    WIN.classList.remove('away');
    WIN.className = 'au-win d-' + d[0]; WIN.querySelector('header b').textContent = d[1]; [].forEach.call(WIN.querySelectorAll('[data-wd]'), function (b) { b.classList.toggle('on', +b.dataset.wd === i); b.hidden = !devOpen(+b.dataset.wd); });
    deskDuck(true); beat('device'); beat('dev-' + i); WIN.hidden = false; WIN.classList.remove('away'); root.classList.add('win'); S.win = i; humSet(false); horn(i); try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* none */ }
  }
  /* closed, the studio is put away, not let go: kept its size and drawing, only unseen and untouchable, so a radio left on goes on
     playing under the aura, whatever step or device is open. Opened again, it is as it was left */
  function closeDev() { if (!WIN || WIN.hidden || WIN.classList.contains('away')) return; deskDuck(false); WIN.classList.add('away'); root.classList.remove('win'); S.win = null; humSet(S.mode !== 'seed' && !devOn()); bell(0, 0.16); }
  var devOn = function () { if (!WIN || !WIN.classList.contains('away')) return false; try { var d2 = WIN.querySelector('iframe').contentWindow.__da; return !!(d2 && d2.S.radio); } catch (e) { return false; } };
  /* let go for good: the desk's song is the one music now */
  function devLetGo() { if (!WIN || !WIN.classList.contains('away')) return; WIN.querySelector('iframe').setAttribute('src', 'about:blank'); WIN.classList.remove('away'); WIN.hidden = true; }
  /* made, in a device or here: a light leaves where it was made and goes up to the key of one's own, which takes it in */
  function made(kind, label, keep) {
    var l = store.get('da.made', []) || []; if (label !== false && keep !== false) { l.unshift({ k: kind, label: String(label || '').slice(0, 48), at: Date.now() }); l.splice(80); store.set('da.made', l); }
    var k = $('#au-yours'); if (!k || still) return; var r = k.getBoundingClientRect(), f = document.createElement('i'); f.className = 'au-fly';
    f.style.left = (innerWidth / 2) + 'px'; f.style.top = (innerHeight * 0.55) + 'px'; root.appendChild(f);
    requestAnimationFrame(function () { f.style.transform = 'translate(' + (r.left + r.width / 2 - innerWidth / 2) + 'px,' + (r.top + r.height / 2 - innerHeight * 0.55) + 'px) scale(.4)'; f.style.opacity = '.2'; });
    setTimeout(function () { f.remove(); k.classList.remove('took'); void k.offsetWidth; k.classList.add('took'); bell(5, 0.1); }, 1100);
  }
  window.addEventListener('message', function (e) {
    if (e.origin === location.origin && e.data && e.data.ng === 'made') { made(e.data.kind, false); return; }
    if (e.origin !== location.origin || !e.data || e.data.ng !== 'piece' || typeof e.data.url !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(e.data.url)) return;
    closeDev(); var p = piece(); p.blank = 1; var crisp = !!e.data.crisp;
    NG.loadImg(e.data.url).then(function (im) { var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height; addPiece({ k: 'im', src: crisp ? e.data.url : NG.shrink(im, 2400, 0.94), ar: h / Math.max(1, w), r: 0, b: false, crisp: crisp ? 1 : 0, wd: crisp ? 300 : h > w * 1.4 ? 360 : 460, x: 0.12, y: 0.08 }); bubbles(4); }).catch(function () {});
    if (S.mode === 'iruk' || S.mode === 'morph') step(2); else if (S.mode === 'globe' || S.mode === 'bang') toIruk(2); else { setMode('globe'); toIruk(2); }
  });
  api.dev = function (i) { if (i == null) closeDev(); else openDev(i); };
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
      o.connect(f); o2.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(out); } else g.connect(out); o.start(); o2.start(); return { f: f, g: g, p: p, o: o, o2: o2 }; }) };
    /* the drone grows with the piece, a little at each step and never loud: W.I.S.H. brings a fifth above, art a high shimmer that
       wanders, print a low breath under it all. One slow swell moves them, and the voices drift apart a few cents and back */
    var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 5; lfo.connect(lg); hum.v.forEach(function (v) { lg.connect(v.o2.detune); }); lfo.start();
    hum.ext = [];   /* only the rings' own drone: the layers that once grew under it played like a backing track */
    out.gain.setTargetAtTime(0.385, c.currentTime, 1.8); window.__auraHum = 0.385;
  }
  function humSet(on) { if (!hum) return; var c = NG.ac(); hum.out.gain.setTargetAtTime(on && !mute ? 0.385 : 0, c.currentTime, on ? 1 : 0.3); window.__auraHum = on && !mute ? 0.385 : 0; }
  function humFrame(rs, b) {
    if (!hum) return; var c = NG.ac(), tt = c.currentTime;
    hum.v.forEach(function (v, i) {
      if (rs) { var q = rs[i]; v.g.gain.setTargetAtTime(0.006 + 0.03 * q[2] * q[2], tt, 0.3); v.f.frequency.setTargetAtTime(260 + 1400 * q[2], tt, 0.3); if (v.p) v.p.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, (q[0] - L.cx) / L.R)), tt, 0.3); }
      else if (b) { v.g.gain.setTargetAtTime(0.014 + 0.012 * b.p, tt, 0.4); v.f.frequency.setTargetAtTime(300 + 500 * b.p + (i === S.stage % 3 ? 300 : 0) + 260 * humGrow(), tt, 0.5); if (v.p) v.p.pan.setTargetAtTime((i - 1) * 0.5, tt, 0.6); }
    });
    /* the layers come in slowly as the steps are reached (and stay while one goes back), and go out on the globe */
    if (hum.ext) { S.reach = Math.max(S.reach || 0, S.mode === 'iruk' ? S.stage : 0); hum.ext.forEach(function (e) { e.g.gain.setTargetAtTime(b && S.mode === 'iruk' && S.reach >= e.at ? e.top * (0.6 + 0.4 * humGrow()) : 0, tt, 4); }); window.__auraLayers = hum.ext.filter(function (e) { return S.mode === 'iruk' && S.reach >= e.at; }).length; }
  }
  /* how far the piece has come: lines written, things caught, things added */
  var humGrow = function () { if (!P) return 0; var l = (P.lines || []).filter(Boolean).length / 4, k = caught(P).length / 4, a = Math.min(1, (P.adds || []).length / 3); return Math.min(1, l * 0.45 + k * 0.3 + a * 0.25); };
  var DEG = [0, 3, 5, 7, 10, 12, 15];
  var AC0 = function () { return !!hum || !!window.__auraSound; };
  /* a device's own call: a deep fog horn, felt more than heard. Two reeds a hair apart over a sub an octave down, through a low
     filter that opens as it swells, sagging a little as it dies. Each device its own: the radio low and long on a fifth, the
     research board a minor third, the print shop lowest of all, short, on the octave */
  var HORNS = [[41.2, 1.5, 2.2], [36.7, 1.19, 1.8], [30.9, 2, 1.4]];
  function horn(i) { if (mute || !AC0()) return; var h = HORNS[i] || HORNS[0], c = NG.ac(), t = c.currentTime + 0.02, out = NG.bus(c), f = c.createBiquadFilter(), g = c.createGain(), dur = h[2];
    f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(70, t); f.frequency.linearRampToValueAtTime(260, t + 0.35); f.frequency.exponentialRampToValueAtTime(60, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.3); g.gain.setValueAtTime(0.5, t + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); f.connect(g); g.connect(out);
    [[h[0], 'sawtooth', 0.32, -6], [h[0], 'sawtooth', 0.32, 7], [h[0] * h[1], 'sawtooth', 0.14, 0], [h[0] / 2, 'sine', 0.9, 0]].forEach(function (v) { var o = c.createOscillator(), og = c.createGain(); o.type = v[1]; o.frequency.setValueAtTime(v[0], t); o.frequency.linearRampToValueAtTime(v[0] * 0.94, t + dur); o.detune.value = v[3]; og.gain.value = v[2]; o.connect(og); og.connect(f); o.start(t); o.stop(t + dur + 0.1); });
    window.__auraHorn = i; }
  /* a touch's sound: not a bell but a low textured rumble, quieter. A bamboo jegog struck low (after the gamelan of Kaneda's theme in
     Akira), a sub under it that swells and sags, and a breath of dust and crackle (after Burial's Untrue). Made each time, nothing recorded */
  var DUST = null;
  function bell(i, vol) { if (mute || !AC0()) return; var c = NG.ac(), out = NG.bus(c), t = c.currentTime + 0.02, v = (vol || 0.28) * 0.55, f = 55 * Math.pow(2, DEG[i % DEG.length] / 12);
    try { NG.INS.jegog.fn(c, out, t, f * 2, 0.8, v); } catch (e) { /* a voice missing */ }
    var o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.94, t + 2.4); lp.type = 'lowpass'; lp.frequency.value = 170;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.8, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 2.7);
    if (!DUST || DUST.sampleRate !== c.sampleRate) { var n = Math.floor(c.sampleRate * 1.2); DUST = c.createBuffer(1, n, c.sampleRate); var dd = DUST.getChannelData(0); for (var k = 0; k < n; k++) dd[k] = Math.random() < 0.003 ? Math.random() * 2 - 1 : (Math.random() * 2 - 1) * 0.05; }
    var s = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain(); s.buffer = DUST; bp.type = 'bandpass'; bp.frequency.value = 700 + (i % 7) * 140; bp.Q.value = 0.7;
    ng.gain.setValueAtTime(v * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); s.connect(bp); bp.connect(ng); ng.connect(out); s.start(t, Math.random() * 0.1); s.stop(t + 1.2); }
  /* a run of rumbles, one after another, low and slow: what a finished thing sounds like */
  function harp(seq) { if (mute || !AC0()) return; seq.forEach(function (d, i) { setTimeout(function () { bell(d, 0.22); }, i * 260); }); }
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
  /* the deep engine, the studio, as three devices: each opened in a window over the aura, the aura one touch away. One is earned with each
     poster printed, and rides the ring under the eye with the catch; all three are in the intel */
  var DEVS = [['radio', 'RADIO', 'radio', 'dradio'], ['board', 'RESEARCH BOARD', 'wish', 'dboard'], ['shop', 'DESIGN', 'print', 'dshop'], ['folio', 'PORTFOLIO', 'portfolio', 'dfolio']];
  var STEPS = [['notice', 'eyet'], ['W.I.S.H.', 'wish'], ['art', 'art'], ['print', 'print']];
  var ICON = {
    /* the irukandji's eye with its four tears: noticing, on the globe and on its tab; it blinks, its pupil breathes */
    eyet: '<g class="lid"><path d="M4 12.5c3.5-4.6 7.5-6.7 12-6.7s8.5 2.1 12 6.7c-3.5 4.6-7.5 6.7-12 6.7s-8.5-2.1-12-6.7z"/><circle cx="16" cy="12.5" r="3.6"/><circle cx="16" cy="12.5" r="1.3" class="f pu"/></g><path d="M10.5 18.5v8M14 19.2v9.5M18 19.2v9.5M21.5 18.5v8" class="d"/>',
    radio: '<circle cx="16" cy="19" r="2.2" class="f"/><path d="M16 21.5v8.5M12.4 15.2a5.2 5.2 0 0 1 7.2 0M9.3 12.1a9.6 9.6 0 0 1 13.4 0M6.2 9a14 14 0 0 1 19.6 0" class="d"/>',
    wish: '<path d="M9 13.5C9 8 12 5 16 5s7 3 7 8.5v1.2H9z"/><path d="M10.5 15v13M14 15v14M18 15v14M21.5 15v13" class="t"/>',
    art: '<path d="M5 26c6-3 4-10 11-12s9-8 11-9"/><circle cx="9" cy="9" r="3"/><path d="M20 22l6 4M22 18h6" class="d"/>',
    navmap: '<path d="M4 8.5l7.5-3 9 3 7.5-3v18l-7.5 3-9-3-7.5 3z"/><path d="M11.5 5.5v18M20.5 8.5v18" class="d"/><circle cx="16" cy="14" r="1.6"/>',
    wave: '<path d="M3 16c2.2-7 4.3-7 6.5 0s4.3 7 6.5 0 4.3-7 6.5 0 4.3 7 6.5 0"/><path d="M8 7.5c1.3-1.6 2.7-1.6 4 0M20 24.5c1.3 1.6 2.7 1.6 4 0" class="d"/>',
    pencil: '<path d="M22 4.5l5.5 5.5L12 25.5l-7 1.5 1.5-7z"/><path d="M19 7.5l5.5 5.5M6.5 20l5.5 5.5" class="d"/>',
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
    near: 'Places and wildlife nearby. Tap to add.',
    pxjelly: '<path d="M8 15c0-6 3.5-9 8-9s8 3 8 9z"/><path d="M11 18v6M14.5 18v8M17.5 18v8M21 18v6" class="d"/>',
    pxcoral: '<path d="M16 28V18M16 18l-5-6M11 12l-2-5M11 12l3-4M16 18l5-5M21 13l-1-5M21 13l4-3M16 22l-6-2"/><path d="M6 28h20" class="d"/>',
    pxtrash: '<ellipse cx="16" cy="12" rx="8" ry="5.5"/><ellipse cx="16" cy="11.5" rx="3.5" ry="1.8"/><path d="M11 16l1.5 9h7L21 16"/><circle cx="16" cy="21" r=".9" class="f"/>',
    pxclip: '<path d="M12 26V9a4 4 0 0 1 8 0v14a2.5 2.5 0 0 1-5 0V11"/>',
    dice: '<path d="M7 7h18v18H7z"/><circle cx="12" cy="12" r="1.3" class="f"/><circle cx="20" cy="20" r="1.3" class="f"/><circle cx="16" cy="16" r="1.3" class="f"/>',
    pin: '<path d="M16 28s-8-8.5-8-14a8 8 0 0 1 16 0c0 5.5-8 14-8 14z"/><circle cx="16" cy="14" r="2.8" class="f"/>',
    more: '<circle cx="16" cy="16" r="11.5"/><path d="M16 14.5v8"/><circle cx="16" cy="10.4" r="1.3" class="f"/>',
    /* the devices as hand-drawn glyphs, for the ring round the irukandji: a little off true, as drawn */
    hradio: '<path d="M5.6 13.4c6.9-.7 14-.5 20.9.3l-.5 12c-7 .5-13.8.4-20.4-.2z"/><path d="M8.8 13.1 22.6 5.3"/><circle cx="23" cy="5.1" r="1.1" class="f"/><circle cx="11.3" cy="19.6" r="3.1"/><path d="M11.3 17.9v1.8"/><path d="M17.9 17.4h5.7M18.1 19.9h5.2M18 22.5h4.1" class="d"/>',
    hboard: '<path d="M6.1 6.6c6.9-.5 13.4-.4 19.9.1l-.4 14.2c-6.5.4-13.1.4-19.5-.1z"/><path d="M10.3 21 7.6 27.2M21.8 21l2.7 6.1"/><path d="M9.6 10.2h4.6v3.7H9.7zM17.6 10.4h5v5.1h-4.9z" class="f"/><path d="M14.3 12.2l3.2 1.4M10.4 16.6h5.4" class="d"/>',
    /* the design device: play and imagination, a palette with a brush in it and a spark over it, not a printer */
    hshop: '<path d="M16.2 6.4c-6.3-.2-11 4.3-10.8 9.8.2 5.3 4.6 9.3 9.6 9.4 2.2 0 3-1.2 2.6-2.6-.5-1.6.4-2.9 2.1-2.9h3.4c2.6 0 4.1-1.6 4.1-4.1-.3-5.3-5-9.5-11-9.6z"/><circle cx="10.6" cy="15.4" r="1.5" class="f"/><circle cx="13.4" cy="10.8" r="1.5" class="f"/><circle cx="19" cy="10.6" r="1.5" class="f"/><path d="M27.6 21.2 21.4 27.2c-.9.8-2.2.5-2.3-.6"/><path d="M25.4 3.4v3.2M23.8 5h3.2" class="d"/>',
    list: '<path d="M6 9h14M6 16h14M6 23h9"/><path d="M23 19l5 3.5-5 3.5z" class="f"/>',
    qrc: '<path d="M6 6h8v8H6zM18 6h8v8h-8zM6 18h8v8H6z"/><path d="M9 9h2v2H9zM21 9h2v2h-2zM9 21h2v2H9z" class="f"/><path d="M18 18h3v3h-3zM23 23h3v3h-3zM23 18h3M18 26h3" class="d"/>',
    cons: '<path d="M6 22l7-9 6 5 7-10"/><circle cx="6" cy="22" r="1.8" class="f"/><circle cx="13" cy="13" r="1.8" class="f"/><circle cx="19" cy="18" r="1.8" class="f"/><circle cx="26" cy="8" r="1.8" class="f"/><path d="M19 18l3 7" class="d"/>',
    dradio: '<path d="M6 12h20v14H6z"/><path d="M9 16h6v6H9z" class="f"/><path d="M18 16h5M18 19h5M18 22h3" class="d"/><path d="M10 12L22 6"/>',
    dboard: '<path d="M5 7h22v18H5z"/><path d="M9 11h5v4H9zM18 11h5v6h-5zM9 19h6v3H9z" class="f"/><path d="M14 13l4 1M12 15v4" class="d"/>',
    /* the portfolio: a picture hung on a line, the printer's paper under it */
    hfolio: '<path d="M4.5 7.5c7.6-1.2 15.4-1.2 23 0"/><path d="M9 7.9l1.2 3.4M23 7.9l-1.2 3.4" class="d"/><path d="M8 11.2c5.4-.5 10.8-.5 16 0l-.4 10.7c-5.1.4-10.2.4-15.2 0z"/><path d="M11.4 18.6l3.2-3.4 2.6 2.4 2-1.8 2.6 2.8" class="d"/><path d="M12.4 25.4h7.2M14 28h4" class="d"/>',
    dfolio: '<path d="M6 10.5c6.7-.6 13.3-.6 20 0l-.5 12.5c-6.3.5-12.7.5-19 0z"/><path d="M10 19.6l4-4.2 3.2 3 2.4-2.2 3.2 3.4" class="d"/>',
    dshop: '<path d="M16 6c-6 0-10.5 4.3-10.5 9.6S9.8 25.4 15 25.4c2 0 2.8-1.1 2.4-2.4-.5-1.5.4-2.7 2-2.7h3.3c2.5 0 3.9-1.5 3.9-3.9C26.3 10.3 21.7 6 16 6z"/><circle cx="10.8" cy="15.2" r="1.4" class="f"/><circle cx="13.5" cy="10.8" r="1.4" class="f"/><circle cx="18.8" cy="10.6" r="1.4" class="f"/>',
    hum: '<path d="M3 16c2.4-6 4.8-6 7.2 0s4.8 6 7.2 0 4.8-6 7.2 0 3.6 4.5 4.4 3"/>',
    key: '<circle cx="11" cy="16" r="5.5"/><path d="M16.5 16H28M24 16v4M27.5 16v3"/>',
    mark: '<path d="M4 11h10v10H4z" class="f"/><circle cx="23" cy="16" r="5.6" class="f" style="opacity:.55"/>',
    wall: '<path d="M3 7c4 2 22 2 26 0"/><path d="M11 9v16h10V9" class="d"/><path d="M13 5.5v5M19 5.5v5"/>',
    pics: '<path d="M10 11h17v14H10z"/><path d="M10 22l5-5 4 4 2-2 6 6"/><path d="M5 6h17v3M5 6v14h3" class="d"/>',
    wpos: '<path d="M6 7h20M6 11h14" /><path d="M8 16h16v11H8z" class="d"/><path d="M27 15v9M24.5 21.5L27 24l2.5-2.5"/>',
    pic: '<path d="M5 8h22v17H5z"/><path d="M5 22l7-7 5 5 3-3 7 7" /><circle cx="21" cy="13" r="2"/>',
    act: '<path d="M16 4c3 5 7 8 7 13a7 7 0 0 1-14 0c0-5 4-8 7-13z"/><path d="M13 18l2 2 4-5"/>',
    sig: '<circle cx="16" cy="20" r="2" class="f"/><path d="M11 15a7 7 0 0 1 10 0M7.5 11.5a12 12 0 0 1 17 0M4 8a17 17 0 0 1 24 0"/><path d="M16 22v6" class="d"/>',
    copy: '<path d="M11 11h14v15H11z"/><path d="M7 21V6h14" class="d"/>',
    share: '<path d="M16 4v16M10 10l6-6 6 6"/><path d="M8 16v11h16V16" class="d"/>',
    in: '<path d="M16 4v16M10 14l6 6 6-6"/><path d="M6 26h20" class="d"/>',
    longer: '<path d="M10 5h12v22H10z" class="d"/><path d="M16 12v12M12 20l4 4 4-4"/>',
    shorter: '<path d="M10 5h12v14H10z" class="d"/><path d="M16 26V14M12 18l4-4 4 4"/>',
    paste: '<path d="M10 7h12v20H10z"/><path d="M13 5h6v4h-6z" class="f"/><path d="M13 15h6M13 19h6" class="d"/>',
    mic: '<path d="M12.5 6.5a3.5 3.5 0 0 1 7 0v8a3.5 3.5 0 0 1-7 0z"/><path d="M8.5 14a7.5 7.5 0 0 0 15 0M16 21.5V27M12 27h8" class="d"/>',
    ok: '<path d="M7 17l6 6 12-13"/>',
    moon2: '<path d="M20 5a11 11 0 1 0 7 15A9 9 0 0 1 20 5z"/><circle cx="24" cy="9" r="1" class="f"/><circle cx="27" cy="14" r=".8" class="f"/>'
  };
  /* what to do, said plainly in a few words, now and then: each line comes for a moment (longer for a longer one) and goes for a while.
     Nothing stays on the paper to be read over and over */
  /* INTENTION's and W.I.S.H.'s words: the site's own (config.js, through the build), any rewritten on the approval page laid over them.
     The last rewritten words are kept on the device, so they hold offline */
  /* the cities and data packs from the approval page, written as words: a line '# name' begins a city, 'centre lat, lng' places it,
     and every other line is one of its places, 'name, lat, lng'. Kept on the device, so they hold offline */
  /* dark: the deep grey night, chosen at the start's top left and kept; the studio, the devices and every page go with it */
  var DARK = !!store.get('da.aura.dark', false);
  var CITIES = [];
  function citiesOf(text) {
    var out = [], c = null; String(text || '').split(/\r?\n/).forEach(function (ln) { ln = ln.trim(); if (!ln) return;
      if (ln.charAt(0) === '#') { c = { name: ln.replace(/^#+\s*/, '').slice(0, 60), lat: NaN, lng: NaN, places: [] }; out.push(c); return; } if (!c) return;
      var m = ln.match(/^(.*?),\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/); if (!m) return; var nm = m[1].trim(), la = +m[2], lo = +m[3]; if (Math.abs(la) > 90 || Math.abs(lo) > 180) return;
      if (/^centre$|^center$/i.test(nm)) { c.lat = la; c.lng = lo; } else if (c.places.length < 400) c.places.push([nm.slice(0, 80), la, lo]); });
    return out.filter(function (c2) { if (!isFinite(c2.lat) && c2.places.length) { c2.lat = c2.places[0][1]; c2.lng = c2.places[0][2]; } return isFinite(c2.lat); });
  }
  var citiesSet = function (t) { CITIES = citiesOf(t); var D = NG.DB(); if (D && D.places) { var have = {}; D.places.forEach(function (q) { have[q[0]] = 1; }); CITIES.forEach(function (c) { c.places.forEach(function (q) { if (!have[q[0]]) { D.places.push(q); have[q[0]] = 1; } }); }); } };
  citiesSet(store.get('da.aura.cities', '')); NG.db().then(function () { citiesSet(store.get('da.aura.cities', '')); });
  var WORDS0 = B.words || {}, WORDS = {};
  var wordsSet = function (o) { WORDS = {}; Object.keys(WORDS0).forEach(function (k) { WORDS[k] = WORDS0[k]; }); if (o && typeof o === 'object') Object.keys(WORDS0).forEach(function (k) { if (typeof o[k] === 'string' && o[k].trim()) WORDS[k] = o[k].trim().slice(0, 240); }); };
  var wd = function (k, d) { return WORDS[k] || d || ''; };
  wordsSet(store.get('da.aura.words', null));
  var SAY = {
    globe: 'Start here. Tell us one small thing you noticed today.',
    notice: '', wish: '',
    art: 'Drag to move. Tap to edit.',
    artEmpty: 'Start a blank receipt',
    print: 'Print sends this to the novel.global printer on 80 mm paper, and it goes up on your wall. Pick blue or white paper first.',
    wall: 'Everything you have printed. Swipe through, tap one to see it full screen, or bring one back to keep working on it.',
    map: 'Tap where you saw it.',
    near: 'Places and lives within a short walk of here. Open it and tap any you want on your poster.',
    find: 'Type a name to find it.',
    vals: 'Today’s details. Tap to add.',
    month: 'What to look for this month.'
  };
  /* why El Niño matters now, from the season's own reports (sources in docs/sources.md) */
  var NINO_MORE = ['El Niño is a warming of the tropical Pacific that shifts weather around the world. For south-east Australia it usually means a hotter, drier spring and summer.',
    'Heat and dry ground stress wildlife first: birds, flying-foxes and possums struggle on days over 35°, and creeks and ponds shrink.',
    'More days of high fire danger. Know your area’s fire danger rating, and check VicEmergency before you go out.'];
  var NINO_WHY = 'El Niño is here and may be one of the strongest on record. Expect hotter, drier days and more fire risk. Wildlife feels it first.';
  var hint = function (t, cls2) { var long = t.length > 70; return '<p class="au-hint ' + (cls2 || '') + '" data-on="' + ((long ? Math.min(8, 2 + Math.round(t.length / 40)) : 2) + 5) + '" data-off="' + (long ? 28 : 20) + '">' + esc(t) + '</p>'; };
  /* the next step, always at the foot of the page: a dotted line to the next step's own icon, and where it leads */
  var NEXT = [[1, 'wish', 'next: your W.I.S.H.'], [2, 'art', 'next: make the poster'], [3, 'print', 'next: print it']];
  /* a few words in each part before the way on shows: three for the intention, two on every line of the poem */
  var words = function (t) { return String(t || '').trim().split(/\s+/).filter(Boolean).length; };
  var goReady = function (s) { if (s === 0) return !!P && words(P.say) >= 3; if (s === 1) return !!P && [0, 1, 2, 3].every(function (i) { return words(P.lines[i]) >= 2; }); return true; };
  var goGate = function () { var g = panel && panel.querySelector('.au-go[data-go="' + (S.stage + 1) + '"]'); if (g) g.classList.toggle('wait', !goReady(S.stage)); };
  var goKey = function (s) { var n2 = NEXT[s]; return n2 ? '<button class="au-go' + (goReady(s) ? '' : ' wait') + '" data-go="' + n2[0] + '" aria-label="' + n2[2] + '"><i></i>' + svgI(n2[1]) + '<b class="au-arrow"></b></button>' : ''; };
  /* one line at a time: when a step (or the catch) is opened, ten seconds of quiet, then its lines in turn, each for its own time,
     ten seconds apart, round again. Never two at once */
  var HS = { at: 0, i: -1, el: null, box: null };
  /* one word first: a step opened says, key by key, one plain word for what each does, quickly and in turn, and then is quiet,
     so the longer lines that follow have the page to themselves */
  var FW = 0;
  var flashWords = function (wait) { clearTimeout(FW); FW = setTimeout(function () {
    var on = [].filter.call(document.querySelectorAll('#aura [data-fw]'), function (e) { return e.offsetParent !== null && (panel.contains(e) || e.classList.contains('au-tab') && e.classList.contains('on')); });
    /* one at a time, each gone before the next comes: the first ten keys, never a crowd */
    on = on.slice(0, 10); on.forEach(function (e, i) { e.classList.remove('fw'); void e.offsetWidth; e.style.setProperty('--fd', (i * 2.3).toFixed(2) + 's'); e.classList.add('fw'); });
    FW = setTimeout(function () { on.forEach(function (e) { e.classList.remove('fw'); }); }, on.length * 2300 + 800); }, wait || 120); };
  var hintsQuiet = function () { HS.quiet = performance.now() / 1000; HS.at = HS.quiet + 10; HS.i = -1; if (HS.el) HS.el.classList.remove('on'); HS.el = null; };
  setInterval(function () {
    var t = performance.now() / 1000, box = S.deep ? deep : panel; if (!box) return;
    if (box !== HS.box) { HS.box = box; hintsQuiet(); }
    if (HS.el && !box.contains(HS.el)) { HS.el = null; HS.at = t + 10; }
    if (t < HS.at) return;
    if (HS.el) { HS.el.classList.remove('on'); HS.at = t + (+HS.el.dataset.rest || 10); HS.el = null; return; }
    var all = [].filter.call(box.querySelectorAll('.au-hint'), function (h) { return h.offsetParent !== null; }); if (!all.length) { HS.at = t + 2; return; }
    HS.i = (HS.i + 1) % all.length; var nx = all[HS.i]; if (nx.dataset.first && t - (HS.quiet || 0) < +nx.dataset.first) { HS.at = (HS.quiet || 0) + +nx.dataset.first; return; } HS.el = nx; HS.el.classList.add('on'); HS.at = t + (+HS.el.dataset.on || 7);
  }, 250);
  var svgI = function (k, cls2) { return '<svg class="' + (cls2 || 'au-i') + '" viewBox="0 0 32 32" aria-hidden="true">' + ICON[k] + '</svg>'; };
  var markI = function (g) { return '<svg class="au-i" viewBox="0 0 32 32" aria-hidden="true"><path d="' + MARKS[g] + '"/></svg>'; };
  ui.innerHTML =
    '<button id="au-seed" aria-label="Begin"></button>' +
    /* the three discs, each moving its ring its own way: the eye (to share what you noticed: the ring seen only near it), the wave (to
       make a song: the ring shaken where it passes), the pencil (to make a poster: the ring drawn behind it, a gap ahead). The eye in
       the middle, the irukandji's own, watches them pass, and opens the photo booth. Each says so once, plainly, then goes quiet */
    '<label id="au-eyec" role="button" tabindex="0" aria-label="Print a photo"><input type="file" accept="image/*" hidden><small class="au-ow" aria-hidden="true">print photo</small></label>' +
    [[0, 'go', 'notice', svgI('navmap')], [1, 'wish', 'story', svgI('pencil')], [2, 'art', 'make', svgI('wave')]].map(function (o, i) { return '<button class="au-orb" data-s="' + o[0] + '" data-go="' + o[1] + '" aria-label="' + o[2] + '"><i class="pt"></i>' + (i === 0 ? '<i class="au-ring"></i>' : '') + o[3] + '<small class="au-ow" aria-hidden="true">' + o[2] + '</small></button>'; }).join('') +
    '<button id="au-theme" aria-label="Dark or light" aria-pressed="' + DARK + '"><i></i><b></b></button>' +
    '<button id="au-talk" aria-label="Talk" hidden>' + svgI('sig') + '</button><section class="au-talkp" id="au-talkp" hidden aria-label="Talk"><nav></nav><ol></ol><form><input maxlength="280" autocomplete="off" aria-label="Say something" placeholder="…"><button aria-label="Send">↑</button></form></section>' + '<button id="au-yours" aria-label="Your code"><i></i>' + svgI('key') + '<b></b></button><label class="au-keyin" id="au-keyin" hidden><input maxlength="3" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" aria-label="The code on your print" placeholder="· · ·"></label>' + '<button id="au-todo" aria-label="Things to do" aria-expanded="false"><i></i><b></b></button><section class="au-todo" id="au-todol" hidden aria-label="Things to do"><i class="au-tent"></i><ol></ol></section>' +
    '<div id="au-base"><button id="au-open" aria-label="Open everything">' + svgI('key') + '</button><a id="au-admin" href="/admin" aria-label="novel.global"><svg viewBox="0 0 237 112" aria-hidden="true"><rect x="10" y="10" width="91.6" height="92" transform="rotate(-0.34 56 56)" style="fill:var(--ink);stroke:none"/><circle cx="178.3" cy="56.5" r="48.8" style="fill:#E25C40;stroke:none"/></svg></a></div>' +
    '<label id="au-bell" aria-label="The eye: a photograph of what you have noticed"><input type="file" accept="image/*" id="au-file" hidden></label>' +
    '<button id="au-up" aria-label="Back up to the globe"><i></i></button>' +
    STEPS.map(function (s, i) { return '<button class="au-tab" data-s="' + i + '" data-fw="' + [wd('intention.tab', 'intention'), wd('wish.tab', 'wish'), 'art', 'print'][i] + '" aria-label="' + s[0] + '">' + svgI(s[1]) + '</button>'; }).join('') +
    DEVS.map(function (d, i) { return '<button class="au-dev" data-dev="' + i + '" data-fw="' + d[1].toLowerCase() + '" aria-label="' + d[1] + '" hidden>' + svgI('h' + d[0]) + '<i class="led"></i></button>'; }).join('') +
    '<svg class="au-defs" width="0" height="0" aria-hidden="true"><filter id="au-hand" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter></svg>' +
    '<button id="au-catch" aria-label="What it has caught: the map, the life, the data, El Niño">' + svgI('catch') + '<b></b></button>' +
    '<button id="au-snd" aria-label="Sound"><i></i><svg viewBox="0 0 24 12" aria-hidden="true"><path d="M1 6c2.5-5 5-5 7.5 0s5 5 7.5 0 5-5 7 0"/></svg></button>' +
    '<section id="au-panel" aria-live="polite"></section><section id="au-deep" hidden></section>' +
    '';
  devK = [].slice.call(ui.querySelectorAll('.au-dev')); setTimeout(lvSync, 0);
  orbs = [].slice.call(ui.querySelectorAll('.au-orb')); tabs = [].slice.call(ui.querySelectorAll('.au-tab')); catchK = $('#au-catch');
  panel = $('#au-panel'); deep = $('#au-deep');
  function setMode(m) { if (m === 'globe' && typeof orbWords === 'function') setTimeout(function () { orbWords(); todoCheck(); }, 0); S.mode = m; S.t0 = performance.now(); root.className = 'm-' + m + ' st' + S.stage + (DARK ? ' dark' : '') + (S.deep ? ' deep' : '') + (typeof SH !== 'undefined' && SH.pswp ? ' showing' : '') + (L.big ? ' big' : '') + (DESK.el && !DESK.el.hidden ? ' desk' : '') + (S.win != null ? ' win' : '') + ($('#au-keyin') && !$('#au-keyin').hidden ? ' keyon' : ''); }
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
  var FX = store.get('da.aura.fx', 'base'), PHREAK = !!store.get('da.aura.phreak', false), FXM = { calm: [0.45, 0.6], base: [1, 1], chaos: [2.4, 1.9] };
  /* the phreak: lines of base64, the shape a poster travels in, drifting faintly across under the stars */
  var PH = null;
  function phreak(t) {
    if (!PHREAK) return; var abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    if (!PH || PH.w !== L.W) { PH = { w: L.W, rows: [] }; for (var i = 0; i < 14; i++) { var s = ''; for (var j = 0; j < 90; j++) s += abc.charAt(Math.floor(Math.random() * 64)); PH.rows.push({ s: s, y: (i + 0.5) * L.H / 14, v: (6 + Math.random() * 18) * (i % 2 ? 1 : -1), o: Math.random() * 400 }); } }
    x.save(); x.font = '10px "Departure Mono", ui-monospace, Menlo, monospace'; x.textBaseline = 'middle'; var m = FXM[FX] || FXM.base;
    PH.rows.forEach(function (r, i) { var off = still ? r.o : (r.o + t * r.v * m[1]) % 600; x.globalAlpha = 0.05 + 0.035 * Math.sin(t * 0.4 + i); x.fillStyle = DARK ? '#7CFFB0' : '#F4F1E8'; x.fillText(r.s, -600 + off, r.y); x.fillText(r.s, off, r.y);
      if (!still && Math.random() < 0.02 * m[0]) { var p = Math.floor(Math.random() * r.s.length); r.s = r.s.slice(0, p) + abc.charAt(Math.floor(Math.random() * 64)) + r.s.slice(p + 1); } });
    x.restore();
  }
  function draw1(now) {
    var fm = FXM[FX] || FXM.base, t = now / 1000, dt = Math.max(0, Math.min(0.05, last ? (now - last) / 1000 : 0.016)) * (still ? 1 : fm[1]), k = Math.max(0, (now - S.t0) / 1000); last = now;
    x.clearRect(0, 0, L.W, L.H); CUR = still ? [0, 0] : [noise(t * 0.035, 1.3, 0), noise(t * 0.035, 7.7, 0) * 0.5];
    if (!still && (S.mode === 'globe' || S.mode === 'bang')) S.spin += dt * 2 * Math.PI / 110;
    if (S.mode === 'iruk') under(t);
    phreak(t);
    snow(t, dt, Math.round((S.mode === 'seed' ? 14 : 70) * (still ? 1 : fm[0])));
    if (DARK) worms(t, dt);
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
    var ec = $('#au-eyec'); if (ec) { var sz = Math.round(L.R0 * 0.66); ec.style.width = ec.style.height = sz + 'px'; ec.style.transform = 'translate(' + (L.cx - sz / 2).toFixed(1) + 'px,' + (L.cy - sz / 2).toFixed(1) + 'px)'; ec.style.opacity = a; }
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
  function toIruk(stage) { if (S.mode !== 'globe' && S.mode !== 'bang') return; hintsQuiet(); if (stage !== 3 && done()) fresh(); if (!canStep(stage)) stage = 0; FORM.key = 'hang'; FORM.lines = FORM.rect = FORM.wline = FORM.from = LAST = null; S.stage = stage; S.deep = false; deep.hidden = true; paint(); setMode('morph'); bell(stage, 0.22); flashWords(1700); }
  function toGlobe() { if (S.mode !== 'iruk') return; S.deep = false; deep.hidden = true; setMode('unmorph'); bell(0, 0.18); }
  /* a printed piece is finished: the round is over. Going on (to any step but print, to the eye or to the catch) begins the next piece, clear;
     the finished one stays on the wall, to be brought back */
  var done = function () { return !!(P && P.sent); };
  function fresh() { S.reach = 0; P = null; S.sel = null; S.pix = false; MINI.c = null; draftSave(null); fillDots(); }
  /* where this phone is, for the approval page: posters made and the step it is on */
  NG.stageOf = function () { return ROUNDS + ' poster' + (ROUNDS === 1 ? '' : 's') + ' · ' + (S.mode === 'iruk' ? ['notice', 'wish', 'art', 'print'][S.stage] : 'start'); };
  /* the first round is a path: each step opens once the one before has something in it, none skipped; after the first poster, any */
  var canStep = function (i) { return LV() >= TAB_LV[i]; };
  function step(i) {
    if (!earned(i < 2 ? 'intention' : 'print')) return;
    if (!canStep(i)) return;
    hintsQuiet();
    if (i !== 3 && done()) fresh();
    var from = S.stage; if (i === S.stage && !S.deep) { paint(); keys(); return; }
    beat('step-' + i); S.stage = i; S.deep = false; S.sel = null; deep.hidden = true; deep.innerHTML = ''; cls(); paint(); keys(); bell(i); panel.scrollTop = 0; focusFirst(); flashWords();
    S.pass = { from: from, to: i, t0: performance.now() / 1000 }; if (L.tips) ripple(L.tips[i][0], L.tips[i][1] - 10);
  }
  var focusFirst = function () { if ('ontouchstart' in window) return; var f = panel.querySelector('#au-say, .au-wish textarea'); if (f) setTimeout(function () { f.focus(); }, 60); };
  $('#au-seed').addEventListener('click', bang);
  root.addEventListener('pointerdown', function (e) { if (S.mode === 'seed' && e.target === cv) bang(); });
  orbs.forEach(function (o) { o.addEventListener('click', function () { if (S.mode === 'bang') setMode('globe'); var go = o.dataset.go;
    beat('disc-' + o.dataset.s); toIruk(+o.dataset.s); }); });
  /* the eye in the middle: the photo booth, one tap */
  /* one touch: the eye asks the phone for a photo straight away, and the booth opens on it */
  $('#au-eyec').addEventListener('click', function () { if (S.mode === 'bang') setMode('globe'); bell(3, 0.18); beat('eye'); S.blink = performance.now() / 1000; });
  $('#au-eyec input').addEventListener('change', function () { var f = this.files && this.files[0], inp = this; if (f && NG.boothWith) NG.boothWith(f); setTimeout(function () { inp.value = ''; }, 1500); });
  /* the discs' words, one after another when the globe first shows, then gone; again on a hover */
  var owSaid = false;
  function orbWords() { if (owSaid || START.discWords === false) return; owSaid = true; orbs.concat([$('#au-eyec')]).forEach(function (o, i) { var w = o && o.querySelector('.au-ow'); if (!w) return; setTimeout(function () { w.classList.add('say'); setTimeout(function () { w.classList.remove('say'); }, 3200); }, 900 + i * 2600); }); }
  $('#au-up').addEventListener('click', toGlobe);
  /* the phone's bars: an iPhone takes a new colour only from a new tag, so the old one is swapped for one of the sky's colour */
  function barColour() { var col = DARK ? '#18191C' : '#17457F'; [].forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) { m.remove(); }); var m2 = document.createElement('meta'); m2.name = 'theme-color'; m2.content = col; document.head.appendChild(m2); document.documentElement.style.backgroundColor = col; document.body.style.backgroundColor = col; }
  function setDark(on) { DARK = !!on; setTimeout(barColour, 0); store.set('da.aura.dark', DARK); root.classList.toggle('dark', DARK); document.documentElement.classList.toggle('aura-dark', DARK); var b = $('#au-theme'); if (b) b.setAttribute('aria-pressed', String(DARK)); WORMS.length = 0; S.wormAt = 0; }
  document.documentElement.classList.toggle('aura-dark', DARK); setTimeout(barColour, 0);
  /* the checklist: what there is to do here, in plain words; done ones ticked, the next ones only dots until near, with a hint.
     It follows the approval page's settings for the devices */
  /* each thing as a word or two; ones not yet open show only how near they are; the mesh is a secret until done. "Print" is a print
     at a real printer: it means someone went and found one */
  function todoItems() {
    var lv = LV(), list = [];
    if (lv >= 1) list.push('Photo'); if (lv >= 2) list.push('Intention'); if (DESK.kept.length) list.push('Song'); if (lv >= 3) list.push('W.I.S.H.'); if (ROUNDS > 0) list.push('Poster'); if (lv >= 4) list.push('Design');
    if (store.get('da.aura.mesh', 0)) list.push('Mesh');
    return list;
  }
  function todoCheck() { var k = $('#au-todo'); if (!k) return; var skipped = GATES.mode === 'open' || ROUNDS >= MARK_ORDER.length; k.classList.toggle('gone', START.checklist !== true || skipped || !todoItems().length); }
  function todoFill() { var ol = $('#au-todol ol'); if (!ol) return; ol.innerHTML = todoItems().map(function (t) { return '<li class="done">' + esc(t) + '</li>'; }).join(''); }
  function todoShow() { todoCheck(); if ($('#au-todo').classList.contains('gone')) return; var l = $('#au-todol'); if (!l) return; todoFill(); l.hidden = false; root.classList.add('todo'); clearTimeout(S.todoT); S.todoT = setTimeout(function () { l.hidden = true; root.classList.remove('todo'); }, 10000); }
  $('#au-todo').addEventListener('click', function () { var l = $('#au-todol'), on = l.hidden; if (on) todoFill(); l.hidden = !on; this.setAttribute('aria-expanded', String(on)); root.classList.toggle('todo', on); bell(on ? 2 : 0, 0.12); });
  $('#au-theme').addEventListener('click', function () { setDark(!DARK); bell(DARK ? 0 : 4, 0.18); subSwell(); });
  /* open everything: every device on the ring and every mark, as if every poster were already made; asked once more first */
  NG.sureTap($('#au-open'), function () { ROUNDS = Math.max(ROUNDS, MARK_ORDER.length); store.set('da.aura.rounds', ROUNDS); harp([0, 2, 4, 7, 9]); root.classList.add('opened'); setTimeout(function () { root.classList.remove('opened'); }, 2400); if (DARK) for (var q = 0; q < 3; q++) worm(2, L.W * (0.3 + 0.2 * q), L.H * 0.5);
    /* and it shows what it opened: the key stays lit, and the irukandji comes with the radio held out, every device and mark now there */
    var ok = $('#au-open'); ok.classList.add('on'); ok.setAttribute('aria-label', 'Everything is open'); setTimeout(function () { if (S.mode === 'seed') bang(); setTimeout(function () { if (S.mode === 'globe' || S.mode === 'bang') toIruk(0); }, S.mode === 'globe' ? 300 : 3200); }, 700); });
  if (ROUNDS >= MARK_ORDER.length) { $('#au-open').classList.add('on'); $('#au-open').setAttribute('aria-label', 'Everything is open'); }
  api.dark = function (on) { if (on != null) setDark(on); return DARK; };
  /* the eye takes in a photograph from any step, and the step stays where it is (after a round, it begins the next piece) */
  $('#au-file').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (done()) { fresh(); if (S.stage === 3) step(0); } intake(f); bell(0, 0.24); ripple(L.bx, L.by + L.bh * 0.5); });
  tabs.forEach(function (b) { b.addEventListener('click', function () { step(+b.dataset.s); }); });
  devK.forEach(function (b) { b.addEventListener('click', function () { openDev(+b.dataset.dev); }); });
  catchK.addEventListener('click', function () { if (S.deep) closeDeep(); else openDeep(); bell(4, 0.2); var r = catchK.getBoundingClientRect(); ripple(r.left + r.width / 2, r.top + r.height / 2); });
  var bellK = $('#au-bell');
  bellK.addEventListener('pointerenter', function (e) { S.hEye = true; if (e.pointerType === 'mouse') deepTone(55); });
  bellK.addEventListener('pointerleave', function () { S.hEye = false; });
  catchK.addEventListener('pointerenter', function (e) { S.hHalo = true; if (e.pointerType === 'mouse') deepTone(73.4); });
  catchK.addEventListener('pointerleave', function () { S.hHalo = false; });
  $('#au-snd').addEventListener('click', function () { window.__auraSound = 1; try { var c0 = NG.ac(); if (c0.resume) c0.resume(); } catch (e) { /* no sound */ } if (!mute) humStart(); if (DESK.el && !DESK.el.hidden) deskClose(); else deskOpen(); });

  /* ───────── the piece: one at a time, kept as it is made, until it is printed and the round is over. The engine reads it underneath;
     nothing it knows is said unless it is caught ───────── */
  var P = null;
  var filled = function () { return !!(P && (P.photo || P.spPhoto || P.say || (P.lines || []).some(Boolean) || caught(P).length || (P.adds || []).length)); };
  var ready = function () { return !!(P && (P.blank || filled())); };
  function newPiece() { beat('begin'); return { id: 'n' + Date.now().toString(36), at: Date.now(), photo: '', thumb: '', say: '', tags: [], mine: true, who: NG.me(), lat: NG.map.lat, lng: NG.map.lng, src: 'MAP', art: 'photo', lines: ['', '', '', ''], catch: { map: false, life: '', data: [], nino: false }, pos: {}, adds: [], tf: {}, paper: 'blue', ptone: 'as' }; }
  var piece = function () { if (done()) fresh(); if (!P) { P = newPiece(); where(P); } return P; };
  /* the print dark or light: as chosen, else as the paper is */
  var START = store.get('da.aura.start', null) || {};
  var printNight = function () { if (P && P.pnight != null) return !!P.pnight; if (START.printNight === 'day') return false; if (START.printNight === 'night') return true; return !!(P && P.paper !== 'white'); };
  var KEEP = ['who', 'pnight', 'len', 'id', 'at', 'photo', 'thumb', 'say', 'wSay', 'tags', 'lat', 'lng', 'src', 'art', 'lines', 'catch', 'pos', 'adds', 'tf', 'paper', 'ptone', 'spPhoto', 'spCredit', 'sent', 'folioId', 'revealed', 'wx', 'wtop', 'blank', 'wallOnly', 'wm'];
  function pack(p) { var o = {}; KEEP.forEach(function (k) { if (p[k] !== undefined) o[k] = p[k]; }); o.noteId = p.note ? p.note.id : ''; return JSON.parse(JSON.stringify(o)); }
  function unpack(o) {
    var p = newPiece(); KEEP.forEach(function (k) { if (o[k] !== undefined) p[k] = o[k]; }); p.mine = true; p.catch = p.catch || { map: false, life: '', data: [], nino: false }; p.adds = p.adds || []; p.pos = p.pos || {}; p.tf = p.tf || {};
    p.note = o.noteId ? NG.notes().filter(function (n) { return n.id === o.noteId; })[0] || null : null; p.dirty = true; if (p.photo) eyeOf(p); if (p.spPhoto) spLoad(p); return p;
  }
  var draftT = 0, thinkT = 0;
  /* an intention: written (two words or more), or two or more things caught; then a song, art, or W.I.S.H. whole */
  function lvCheck() { if (!P) return; var said = (P.say || '').trim().split(/\s+/).filter(Boolean).length;
    if (said >= 2 || caught(P).length >= 2) lvUp(2);
    if (LV() >= 2 && ((P.adds || []).length || (P.lines || []).filter(function (l) { return l && l.trim(); }).length === 4)) lvUp(3);
    var bt = $('#au-built'); if (bt) bt.innerHTML = builtHTML(); }
  /* what was caught, shown as the start of an intention: each a word, joined by dots */
  function builtHTML() { if (!P) return ''; var C = caught(P), w = [];
    C.forEach(function (k) { var v = k === 'map' ? (NG.context(P)[0] || '') : k === 'life' ? ((lifeOf(P) || {}).cn || '') : k === 'data' ? ((P.catch.data || [])[0] || '') : 'Niño ' + ninoNow(); if (v) w.push('<span>' + esc(String(v).slice(0, 28)) + '</span>'); });
    return w.join('<i>·</i>'); }
  function changed() { if (!P) return; setTimeout(lvCheck, 0); P._base = null; if (P.sent) P.sent = 0; clearTimeout(draftT); draftT = setTimeout(function () { if (P) draftSave(pack(P)); }, 400); keys(); miniSoon(); }
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
  /* asked gently first (a rough fix comes quickly, and the phone's own question is given all the time it needs: on an iPhone the clock
     runs while the question is still on screen), then made precise once allowed. Refused, it says so, and does not ask again */
  function getPos(ok, no) {
    if (!navigator.geolocation) { if (no) no(0); return; }
    navigator.geolocation.getCurrentPosition(function (g) { S.locNo = 0; ok(g);
      navigator.geolocation.getCurrentPosition(function (g2) { if ((g2.coords.accuracy || 1e9) < (g.coords.accuracy || 1e9)) ok(g2); }, function () {}, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); },
    function (e) { if (e && e.code === 1) S.locNo = 1; if (no) no(e && e.code); }, { enableHighAccuracy: false, timeout: 60000, maximumAge: 120000 });
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
  var WL = ['w', 'i', 's', 'h'];
  var WISH_SAYS = function (i) { return wd(WL[i] + '.head'); }, WISH_HOW = function (i) { return wd(WL[i] + '.how'); };
  /* the marks one has: four to begin with, one more for every piece that reaches the wall */
  var ROUNDS = +store.get('da.aura.rounds', 0) || 0;
  var marksHave = function () { return MARK_ORDER.slice(0, Math.min(MARK_ORDER.length, 4 + ROUNDS)); };
  var PIX = { cells: 24, cur: 1, tone: 'ink', raf: 0, sub: 'jelly', seed: 1 };
  function paint() {
    var s = S.stage, h = '', pic = P && (P.photo || P.spPhoto);
    if (s === 0) {
      h = (P && P.photo ? '<figure class="au-ph"><img alt="" src="' + P.photo + '"><button class="au-rm" id="au-unph" aria-label="Let the photograph go">×</button></figure>' : '') +
        '<label class="au-line' + (P && P.say ? ' has' : '') + '" data-fw="' + esc(wd('intention.tab', 'intention')) + '"><span class="au-ask au-hint" data-on="7" data-off="20" aria-hidden="true">' + esc(wd('intention.ask')) + '</span><textarea id="au-say" rows="1" maxlength="200" aria-label="' + esc(wd('intention.ask')) + '" enterkeyhint="next"></textarea></label><p class="au-built" id="au-built" aria-live="polite">' + builtHTML() + '</p>' + hint(wd('intention.say')) + goKey(0);
    } else if (s === 1) {
      /* what was noticed comes with it: the picture, the life if caught, the day; the line becomes W */
      var L4 = P ? P.lines : ['', '', '', ''], f = P && lifeOf(P), said = P ? [f ? f.cn : '', NG.when(P.at).slice(0, 6)].filter(Boolean).join(' · ') : '';
      /* the intention heads the poem: what one wants to happen, then the four lines under it */
      h = (P && (pic || f) ? '<div class="au-whead">' + (pic ? '<img alt="" src="' + (P.photo || P.spPhoto) + '">' : '') + '<span>' + esc(said) + '</span></div>' : '') + (P && P.say ? '<p class="au-intent">' + esc(P.say) + '</p>' : '') +
        '<ol class="au-wish">' + [0, 1, 2, 3].map(function (i) { return '<li class="' + (L4[i] ? '' : 'empty') + '"><b data-say="' + esc(WISH_SAYS(i)) + '" data-fw="' + esc(wd(WL[i] + '.word')) + '" tabindex="-1">' + 'WISH'[i] + '</b><textarea data-i="' + i + '" rows="1" maxlength="160" aria-label="' + esc(WISH_SAYS(i) + ': ' + WISH_HOW(i)) + '" enterkeyhint="next">' + esc(L4[i] || '') + '</textarea><span class="au-wtip" aria-hidden="true"><em>' + esc(WISH_SAYS(i)) + '</em> ' + esc(WISH_HOW(i)) + '</span></li>'; }).join('') + '</ol>' + hint(wd('wish.say')) + goKey(1);
    } else if (s === 2) {
      if (ready()) { settle(); var mine = (NG.icons() || []).slice(-6), have = marksHave();
        /* in order of use: the hero photograph, more pictures, paste, words, speech, the lines above or below; then the making */
        h = '<div class="au-tray">' + '<label class="au-trayph" data-fw="photo" aria-label="The main photograph">' + svgI('pic') + '<input type="file" accept="image/*" id="au-file3" hidden></label>' +
          '<label class="au-trayph" data-fw="pictures" aria-label="Add pictures to the poster">' + svgI('pics') + '<input type="file" accept="image/*" id="au-file2" multiple hidden></label><button data-add="v" data-fw="paste" aria-label="Paste">' + svgI('paste') + '</button><button data-add="t" data-fw="words" aria-label="Add words">' + svgI('text') + '</button>' + (SR ? '<button data-add="mic" data-fw="speak" aria-label="Speak words onto the poster">' + svgI('mic') + '</button>' : '') +
          '<button data-add="wpos" data-fw="' + (P.wtop ? 'lines up' : 'lines down') + '" class="' + (P.wtop ? 'on' : '') + '" aria-label="The W.I.S.H. lines above or below the picture" aria-pressed="' + !!P.wtop + '">' + svgI('wpos') + '</button>' +
          '<button data-add="wm" data-fw="watermark" class="' + (P.wm ? 'on' : '') + '" aria-label="The mark as a watermark" aria-pressed="' + !!P.wm + '">' + svgI('mark') + '</button>' +
          '<button data-add="p" data-fw="pixel" class="' + (S.pix ? 'on' : '') + '" aria-label="The pixel irukandji">' + svgI('pix') + '</button>' + have.map(function (g, i) { return '<button data-mark="' + g + '"' + (i ? '' : ' data-fw="mark"') + ' class="' + (g === S.newMark ? 'new' : '') + '" aria-label="Add a mark: ' + g + '">' + markI(g) + '</button>'; }).join('') +
          STAMPS.map(function (w, g) { return '<button data-stamp="' + g + '"' + (g ? '' : ' data-fw="stamp"') + ' class="au-stamp" aria-label="A stamp: ' + esc(w) + '"><img alt="" src="' + stampThumb(g) + '"></button>'; }).join('') +
          '<button data-add="len+" data-fw="longer" aria-label="Longer">' + svgI('longer') + '</button><button data-add="len-" data-fw="shorter" aria-label="Shorter">' + svgI('shorter') + '</button>' +
          mine.map(function (ic, i) { return '<button data-ic="' + i + '" aria-label="Add your icon"><img alt="" src="' + esc(ic.src) + '"></button>'; }).join('') + '</div>' +
          (S.pix ? '<div class="au-pix"><nav class="au-subs">' + PIX_SUBS.map(function (q) { return '<button data-pxs="' + q + '" class="' + (PIX.sub === q ? 'on' : '') + '" aria-label="' + { jelly: 'The irukandji', coral: 'Coral', trash: 'Something the tide brought', clip: 'A paperclip' }[q] + '">' + svgI('px' + q) + '</button>'; }).join('') +
            STAMPS.map(function (w, g2) { return '<button data-pxs="st' + g2 + '" class="au-pxst' + (PIX.sub === 'st' + g2 ? ' on' : '') + '" aria-label="The stamp: ' + esc(w) + '"><img alt="" src="' + stampThumb(g2) + '"></button>'; }).join('') + '</nav>' +
            '<canvas width="96" height="96"></canvas><div>' + hand('au-sm', svgI('grid'), 'data-px="cells" aria-label="Cells"') + hand('au-sm', svgI('cur'), 'data-px="cur" aria-label="The current"') + (PIX.sub !== 'jelly' ? hand('au-sm', svgI('dice'), 'data-px="new" aria-label="Another one"') : '') +
            hand('au-sm', svgI('tone'), 'data-px="tone" aria-label="Its colour"') + hand('au-sm', svgI('pics'), 'data-px="hero" aria-label="As the main picture"') + hand('au-big au-place', svgI('plus'), 'data-px="put" aria-label="Put it on the poster"') + '</div></div>' : '') +
          '<figure class="au-poster au-drag"><canvas></canvas><div class="au-sel" hidden><textarea id="au-tx" rows="1" maxlength="90" aria-label="The words" hidden></textarea><nav class="au-tools">' +
          hand('', svgI('turn'), 'data-t="r" aria-label="Turn"') + hand('', '−', 'data-t="s-" aria-label="Smaller"') + hand('', '+', 'data-t="s+" aria-label="Larger"') + hand('', svgI('tone'), 'data-t="tone" aria-label="Tone"') + hand('', svgI('frame'), 'data-t="b" aria-label="Framed or not"') +
          hand('au-rm', '×', 'data-t="x" aria-label="Take it off"') + '</nav></div></figure>' + hint(SAY.art) + goKey(2); }
      else h = '<div class="au-press au-begin">' + hand('au-sm au-blankk', svgI('paper'), 'id="au-blank" aria-label="Begin a blank receipt"') + '</div>';
    } else {
      /* print is the showcase: the piece being made hangs in front on the same line as everything printed, its press under it;
         swiped along, each printed one can be printed again, saved, brought back or taken down */
      h = wallHTML();
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
      var keep = function () { var v = say.value.trim(); if (!v && !P) return; var p = piece(); p.say = v; changed(); goGate(); clearTimeout(thinkT); thinkT = setTimeout(think, 300); };
      say.addEventListener('input', function () { lab.classList.toggle('has', !!say.value); keep(); });
      say.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); think(); if (goReady(0)) step(1); } });
      starLine();
    }
    if (s === 1) {
      starLetters();
      /* a letter tapped says what goes on its line, there on the line, for a few seconds, and hands one the line */
      [].forEach.call(panel.querySelectorAll('.au-wish b'), function (bb) { bb.addEventListener('click', function () { var li = bb.parentNode; li.classList.add('tip'); clearTimeout(li.__t); li.__t = setTimeout(function () { li.classList.remove('tip'); }, 6000); var ta = li.querySelector('textarea'); if (ta) ta.focus(); }); });
      [].forEach.call(panel.querySelectorAll('textarea[data-i]'), function (ta) { var i = +ta.dataset.i; ta.addEventListener('input', function () { ta.parentNode.classList.toggle('empty', !ta.value); });
        var keep = function () { var v = ta.value.trim(); if (!v && !P) return; var p = piece(); p.lines[i] = v; goGate(); if (p.note) { p.note.wishText = p.lines.slice(); p.note.wish = p.lines.some(Boolean); NG.saveNotes(); } changed(); };
        ta.addEventListener('input', keep);
        ta.addEventListener('keydown', function (e) { if (e.key !== 'Enter') return; e.preventDefault(); keep(); bell(i + 1, 0.16); var nx = panel.querySelector('textarea[data-i="' + (i + 1) + '"]'); if (nx) nx.focus(); else if (ready() && goReady(1)) step(2); }); });
    }
    var bl = $('#au-blank'); if (bl) bl.addEventListener('click', function () { var p = piece(); p.blank = 1; changed(); paint(); bell(6, 0.2); flashWords(300); });
    if (s === 2 && ready()) {
      var add = addPiece; trayWire(panel.querySelector('.au-tray'));
      $('#au-file3').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (f) intake(f); });
      panel.querySelector('[data-add="wm"]').addEventListener('click', function () { P.wm = !P.wm; changed(); paint(); bell(5, 0.14); });
      panel.querySelector('[data-add="wpos"]').addEventListener('click', function () { P.wtop = !P.wtop; changed(); paint(); bell(3, 0.14); });
      [].forEach.call(panel.querySelectorAll('[data-mark]'), function (b) { b.addEventListener('click', function () { if (b.dataset.mark === S.newMark) S.newMark = null; add({ k: 's', g: b.dataset.mark }); }); });
      [].forEach.call(panel.querySelectorAll('[data-stamp]'), function (b) { b.addEventListener('click', function () { add({ k: 'st', g: +b.dataset.stamp, r: Math.round(Math.random() * 24 - 12) }); }); });
      [].forEach.call(panel.querySelectorAll('[data-ic]'), function (b) { b.addEventListener('click', function () { var ic = (NG.icons() || []).slice(-6)[+b.dataset.ic]; if (ic) add({ k: 'i', src: ic.src }); }); });
      panel.querySelector('[data-add="t"]').addEventListener('click', function () { if (touchy()) inBox('words'); else add({ k: 't', t: '' }); });
      var mk2 = panel.querySelector('[data-add="mic"]'); if (mk2) mk2.addEventListener('click', function () { inBox('mic'); });
      panel.querySelector('[data-add="p"]').addEventListener('click', function () { S.pix = !S.pix; paint(); bell(7, 0.16); });
      [].forEach.call(panel.querySelectorAll('[data-px]'), function (b) { b.addEventListener('click', function () { var k = b.dataset.px;
        if (k === 'cells') PIX.cells = PIX.cells === 16 ? 24 : PIX.cells === 24 ? 32 : 16; else if (k === 'cur') PIX.cur = PIX.cur % 3 + 1; else if (k === 'tone') { var tn = ['ink', 'blue'].concat(PIX.sub !== 'jelly' && !/^st/.test(PIX.sub) ? ['colour'] : [], picOf(P) && !/^st/.test(PIX.sub) ? ['photo'] : []); PIX.tone = tn[(tn.indexOf(PIX.tone) + 1) % tn.length]; }
        else if (k === 'hero') { var hc = pixArt(PIX.sub, PIX.cells, (performance.now() / 1000) * PIX.cur, PIX.tone, picOf(P), PIX.seed), big = document.createElement('canvas'); big.width = big.height = 960; var bgx = big.getContext('2d'); bgx.fillStyle = back(1); bgx.fillRect(0, 0, 960, 960); bgx.imageSmoothingEnabled = false; bgx.drawImage(hc, 0, 0, 960, 960);
          big.toBlob(function (bl) { if (bl) intake(new File([bl], 'pixel.png', { type: 'image/png' })); }, 'image/png'); bell(4, 0.16); return; }
        else if (k === 'new') PIX.seed = 1 + Math.floor(Math.random() * 9999);
        else add({ k: 'p', sub: PIX.sub, seed: PIX.seed, cells: PIX.cells, ph: (performance.now() / 1000) * PIX.cur, tone2: PIX.tone }); bell(2, 0.12); }); });
      [].forEach.call(panel.querySelectorAll('[data-pxs]'), function (b) { b.addEventListener('click', function () { PIX.sub = b.dataset.pxs; PIX.seed = 1 + Math.floor(Math.random() * 9999); if ((PIX.sub === 'jelly' || /^st/.test(PIX.sub)) && PIX.tone === 'colour') PIX.tone = 'ink'; if (/^st/.test(PIX.sub) && PIX.cells < 32) PIX.cells = 32; paint(); bell(4, 0.12); }); });
      var tx = $('#au-tx'); tx.addEventListener('input', function () { var a = selAdd(); if (a && a.k === 't') { a.t = tx.value; changed(); redraw(); } });
      [].forEach.call(panel.querySelectorAll('[data-t]'), function (b) { b.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); b.addEventListener('click', function (e) { e.stopPropagation(); tool(b.dataset.t); }); });
      /* pictures added to the poster: each its own piece, laid over what is there, never in its place */
      $('#au-file2').addEventListener('change', function () { var fs = [].slice.call(this.files || []); this.value = ''; addPics(fs); });
      [].forEach.call(panel.querySelectorAll('[data-add="len+"], [data-add="len-"], [data-add="v"]'), function (b) { b.addEventListener('click', function () { var k = b.dataset.add; if (k === 'v') { if (touchy() || !navigator.clipboard || !navigator.clipboard.read) inBox('paste'); else pasteKey(); } else lengthen(k === 'len+' ? 300 : -300); }); });
      redraw(); dragWire(); if (S.pix) pixRun();
    }
    if (s === 3) wallWire();
  }
  /* W.I.S.H.'s letters, never written: small stars drift in from round about and gather into each letter's shape, then twinkle where they
     settled, faint, brighter while its line is in hand. The letter itself stays in the page for screen readers, unseen */
  var STARS = { raf: 0 };
  /* the intention's line: no ruled line but stars that gather into a row of dots under the words, as W.I.S.H.'s letters do;
     brighter while it is being written in */
  var SLINE = { raf: 0 };
  function starLine() {
    cancelAnimationFrame(SLINE.raf); var lab = panel.querySelector('.au-line'), ta = lab && lab.querySelector('#au-say'); if (!ta || lab.querySelector('.au-sline')) return;
    var c = document.createElement('canvas'); c.className = 'au-sline'; c.setAttribute('aria-hidden', 'true'); lab.appendChild(c);
    var dp = Math.min(2, window.devicePixelRatio || 1), g = c.getContext('2d'), R = rnd(11), pts = [], W0 = 0, t0 = performance.now();
    var build = function () { var w = Math.max(40, Math.round(c.clientWidth)); if (w === W0) return; W0 = w; c.width = w * dp; c.height = 14 * dp; pts = [];
      for (var xx = 3; xx < w - 2; xx += 8) { var an = R() * 7, rr = 18 + R() * 60; pts.push({ x: xx, sx: xx + Math.cos(an) * rr, sy: 7 + Math.sin(an) * rr * 0.45, r: 0.85 + R() * 0.55, ph: R() * 7, dl: R() * 0.7 + xx / w * 0.6 }); } };
    (function tick(now) { if (!c.isConnected) return; build(); var t = (now - t0) / 1000, hot = document.activeElement === ta; g.setTransform(dp, 0, 0, dp, 0, 0); g.clearRect(0, 0, W0, 14); g.fillStyle = '#F4F1E8';
      pts.forEach(function (q) { var k2 = still ? 1 : Math.max(0, Math.min(1, (t - q.dl) / 1.6)); k2 = 1 - Math.pow(1 - k2, 3);
        var px = q.sx + (q.x - q.sx) * k2 + (still ? 0 : Math.sin(t * 0.7 + q.ph) * 0.25), py = q.sy + (7 - q.sy) * k2 + (still ? 0 : Math.cos(t * 0.6 + q.ph) * 0.25);
        g.globalAlpha = Math.max(0, (hot ? 0.95 : 0.55) * (0.62 + 0.38 * Math.sin(t * 1.4 + q.ph)) * (0.3 + 0.7 * k2)); g.beginPath(); g.arc(px, py, q.r, 0, 7); g.fill(); });
      SLINE.raf = requestAnimationFrame(tick); })(t0);
  }
  function starLetters() {
    cancelAnimationFrame(STARS.raf); var bs = [].slice.call(panel.querySelectorAll('.au-wish b')); if (!bs.length) return;
    var t0 = performance.now(), CW = 60, CH = 64, dp = Math.min(2, window.devicePixelRatio || 1);
    var sets = bs.map(function (bb, li) {
      var c = document.createElement('canvas'); c.width = CW * dp; c.height = CH * dp; c.className = 'au-stars'; c.setAttribute('aria-hidden', 'true');
      var off = document.createElement('canvas'); off.width = CW; off.height = CH; var o = off.getContext('2d'); o.font = '700 36px ' + SANS; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillText('WISH'.charAt(li), CW / 2, CH / 2 + 2);
      var dd = o.getImageData(0, 0, CW, CH).data, pts = [], R = rnd(li * 7 + 3);
      for (var y = 1; y < CH; y += 2.3) for (var x0 = 1; x0 < CW; x0 += 2.3) { if (dd[(Math.round(y) * CW + Math.round(x0)) * 4 + 3] > 140 && R() < 0.6) { var an = R() * 7, rr = 12 + R() * 26;
        pts.push({ x: x0 + (R() - 0.5), y: y + (R() - 0.5), sx: CW / 2 + Math.cos(an) * rr, sy: CH / 2 + Math.sin(an) * rr, r: 0.45 + R() * 0.8, ph: R() * 7, dl: R() * 0.9 + li * 0.3 }); } }
      bb.appendChild(c); return { c: c, g: c.getContext('2d'), pts: pts, li: bb.parentNode };
    });
    (function tick(now) { if (!sets[0].c.isConnected) return; var t = (now - t0) / 1000;
      sets.forEach(function (st) { var g = st.g, hot = st.li.matches(':focus-within'); g.setTransform(dp, 0, 0, dp, 0, 0); g.clearRect(0, 0, CW, CH); g.fillStyle = '#F4F1E8';
        st.pts.forEach(function (q) { var k = still ? 1 : Math.max(0, Math.min(1, (t - q.dl) / 1.8)); k = 1 - Math.pow(1 - k, 3);
          var px = q.sx + (q.x - q.sx) * k + (still ? 0 : Math.sin(t * 0.7 + q.ph) * 0.3), py = q.sy + (q.y - q.sy) * k + (still ? 0 : Math.cos(t * 0.6 + q.ph) * 0.3);
          g.globalAlpha = Math.max(0, (hot ? 1 : 0.72) * (0.55 + 0.45 * Math.sin(t * 1.5 + q.ph)) * (0.3 + 0.7 * k)); g.beginPath(); g.arc(px, py, q.r, 0, 7); g.fill(); }); });
      STARS.raf = requestAnimationFrame(tick); })(t0);
  }
  /* a row of keys wider than its room: the wheel turns it sideways, a mouse drags it along (a drag is never taken for a press) */
  function trayWire(tr) {
    if (!tr) return;
    tr.addEventListener('wheel', function (e) { if (tr.scrollWidth <= tr.clientWidth + 2 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; e.preventDefault(); tr.scrollLeft += e.deltaY; }, { passive: false });
    var dr = null;
    tr.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || tr.scrollWidth <= tr.clientWidth + 2) return; dr = { x: e.clientX, l: tr.scrollLeft, moved: 0, id: e.pointerId }; });
    tr.addEventListener('pointermove', function (e) { if (!dr) return; var dx = e.clientX - dr.x; dr.moved = Math.max(dr.moved, Math.abs(dx)); if (dr.moved > 4) { if (!tr.classList.contains('dragging')) { try { tr.setPointerCapture(dr.id); } catch (er) { /* fine */ } } tr.scrollLeft = dr.l - dx; tr.classList.add('dragging'); } });
    tr.addEventListener('pointerup', function () { if (!dr) return; var mv = dr.moved; dr = null; tr.classList.remove('dragging'); if (mv > 4) { var stop = function (e) { e.stopPropagation(); e.preventDefault(); }; tr.addEventListener('click', stop, true); setTimeout(function () { tr.removeEventListener('click', stop, true); }, 0); } });
  }
  /* the piece let go: a new one begins at the eye. What was printed stays on the wall */
  function letGo() { fresh(); if (S.stage === 0) paint(); else step(0); bell(0, 0.24); }
  /* a piece put on the poster: near the top, a little to one side, in hand at once */
  /* a photograph put on goes first and under: what was already put on moves down out of its way (the strip grows to hold it),
     and can be laid back over it by hand */
  function addPiece(a, under) { if (!P) return;
    if (under && P.adds.length) { if (!P._base) posterNow(P); var B0 = P._base, y0 = B0.band + 10, hh = (a.wd || 300) * Math.min(5, Math.max(0.2, a.ar || 0.75)) + 40;
      a.x = a.x != null ? a.x : (B0.W - (a.wd || 300)) / 2 / B0.W; a.y = y0 / B0.H;
      P.adds.forEach(function (o) { if (o.band || o.y == null) return; var py = o.y * B0.H; if (py + 40 >= y0) o.y = (py + hh) / B0.H; });
      P.adds.unshift(a); S.sel = 'a0'; changed(); redraw(); bell(6, 0.18); return; }
    a.x = a.x != null ? a.x : 0.3 + Math.random() * 0.2; a.y = a.y != null ? a.y : 0.12 + Math.random() * 0.2; P.adds.push(a); S.sel = 'a' + (P.adds.length - 1); changed(); redraw(); bell(6, 0.18); if (a.k === 't' && !a.t) setTimeout(function () { var t2 = $('#au-tx'); if (t2) t2.focus(); }, 80); }
  /* pictures, from the phone, the computer or the clipboard: each its own piece */
  function addPics(files) { (files || []).slice(0, 6).forEach(function (f, j) { var u = URL.createObjectURL(f);
    NG.loadImg(u).then(function (im) { var src = NG.shrink(im, 1400, 0.9); URL.revokeObjectURL(u); addPiece({ k: 'im', src: src, ar: (im.naturalHeight || im.height) / Math.max(1, im.naturalWidth || im.width), r: Math.round(Math.random() * 10 - 5) + j * 3 }, true); bubbles(3); }).catch(function () { URL.revokeObjectURL(u); }); }); }
  /* pasting: a line from the radios anywhere becomes the piece in hand; in art, pictures and words go on the poster */
  function pasted(items, text) {
    if (text && /ng:[-0-9a-z]+,/i.test(text)) return takeSig(text);
    if (S.mode !== 'iruk' || S.stage !== 2 || !P || !ready()) return false;
    if (items && items.length) { addPics(items); return true; }
    if (text && text.trim()) { addPiece({ k: 't', t: text.trim().slice(0, 90) }); return true; }
    return false;
  }
  document.addEventListener('paste', function (e) { if (asleep) return; var cd = e.clipboardData || {}, t = cd.getData ? cd.getData('text') : '', fs = [].slice.call(cd.files || []).filter(function (f) { return /^image\//.test(f.type); }), act = document.activeElement;
    if (!fs.length) fs = [].slice.call(cd.items || []).filter(function (it) { return it.kind === 'file' && /^image\//.test(it.type); }).map(function (it) { return it.getAsFile(); }).filter(Boolean);
    if (!fs.length && /^https?:\/\/\S+$/i.test((t || '').trim()) && S.mode === 'iruk' && S.stage === 2 && P) { var u0 = t.trim(); e.preventDefault(); closeBox();
      fetch(u0).then(function (r) { if (!r.ok || !/^image\//.test(r.headers.get('content-type') || '')) throw 0; return r.blob(); }).then(function (b) { addPics([new File([b], 'pasted', { type: b.type })]); })
        .catch(function () { addPiece({ k: 't', t: u0.slice(0, 90) }); }); return; }
    if (act && act.id === 'au-sigi') return; var typing = act && /^(TEXTAREA|INPUT)$/.test(act.tagName) && act.id !== 'au-tx'; if (typing && !fs.length && !/ng:[-0-9a-z]+,/i.test(t)) return;
    if (pasted(fs, fs.length ? '' : t)) { e.preventDefault(); closeBox(); } });
  /* the paste key: for a phone, where there is no keyboard to paste with */
  function pasteKey() {
    var cb = navigator.clipboard; if (!cb) return;
    var plain = function () { return cb.readText ? cb.readText().then(function (t) { pasted([], t); }) : Promise.resolve(); };
    (cb.read ? cb.read().then(function (items) { var imgs = [], texts = [];
      return Promise.all(items.map(function (it) { var ty = it.types.filter(function (q) { return /^image\//.test(q); })[0]; if (ty) return it.getType(ty).then(function (b) { imgs.push(new File([b], 'pasted', { type: ty })); });
        if (it.types.indexOf('text/plain') >= 0) return it.getType('text/plain').then(function (b) { return b.text(); }).then(function (t) { texts.push(t); }); })).then(function () { pasted(imgs, imgs.length ? '' : texts.join(' ')); }); }) : plain()).catch(function () { plain().catch(function () {}); });
  }
  /* on a phone: a box to paste into, type into or speak into, opened in the tap itself so the keyboard (and its own microphone) comes up.
     A picture or words pasted go straight on the poster; typed or spoken words go on with the tick, or when the speaking stops */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, REC = null;
  var touchy = function () { return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); };
  function closeBox() { if (REC) { try { REC.abort(); } catch (e) { /* gone */ } REC = null; } var el = $('#au-inbox'); if (el) el.remove(); }
  function inBox(mode) {
    closeBox(); if (!panel) return;
    var bx = document.createElement('div'); bx.className = 'au-inbox'; bx.id = 'au-inbox';
    bx.innerHTML = '<div class="au-inarea" id="au-inarea" contenteditable="true" role="textbox" spellcheck="true" autocapitalize="sentences" enterkeyhint="done" aria-label="' + (mode === 'paste' ? 'Paste here' : mode === 'mic' ? 'Speak' : 'Words') + '"></div>' +
      '<nav>' + (SR ? hand('au-sm', svgI('mic'), 'id="au-inmic" aria-label="Speak"') : '') + hand('au-sm', svgI('ok'), 'id="au-inok" aria-label="Put it on the poster"') + hand('au-sm au-nav', '×', 'id="au-inx" aria-label="Close"') + '</nav>';
    var fig = panel.querySelector('.au-poster'); if (fig) fig.parentNode.insertBefore(bx, fig); else panel.appendChild(bx);
    var ar = $('#au-inarea'); ar.focus();
    var put = function () { if (!ar.isConnected) return closeBox(); var t = (ar.innerText || ar.textContent || '').replace(/\s+/g, ' ').trim(); closeBox(); if (t && !pasted([], t)) addPiece({ k: 't', t: t.slice(0, 90) }); };
    ar.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); put(); } });
    $('#au-inok').addEventListener('click', put); $('#au-inx').addEventListener('click', function () { closeBox(); bell(1, 0.12); });
    var mic = $('#au-inmic'); if (mic) mic.addEventListener('click', function () { listen(ar, put); });
    if (mode === 'mic') listen(ar, put);
    setTimeout(function () { if (bx.isConnected && bx.scrollIntoView) bx.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
    bubbles(2);
  }
  /* speaking: the phone's own recogniser, its words appearing as they are heard; when it stops listening, they go on the poster */
  function listen(ar, done) {
    if (!SR) return; if (REC) { try { REC.stop(); } catch (e) { /* gone */ } return; }
    var r = REC = new SR(), base = (ar.innerText || '').trim(), mic = $('#au-inmic'); r.lang = navigator.language || 'en-AU'; r.interimResults = true; r.continuous = false;
    if (mic) mic.classList.add('on');
    r.onresult = function (e) { var t = ''; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; ar.textContent = (base ? base + ' ' : '') + t; };
    r.onend = function () { var on = REC === r; if (on) REC = null; var m2 = $('#au-inmic'); if (m2) m2.classList.remove('on'); if (on && (ar.innerText || '').trim()) done(); };
    r.onerror = function () { if (REC === r) REC = null; var m2 = $('#au-inmic'); if (m2) m2.classList.remove('on'); };
    try { r.start(); subSwell(); } catch (e) { REC = null; if (mic) mic.classList.remove('on'); }
  }
  /* the strip made longer or shorter, in steps; what is on it stays where it is */
  function lengthen(d) {
    if (!P) return; if (!P._base) posterNow(P); var H0 = P._base.H, band = caught(P).length ? 300 : 0;
    P.len = Math.max(-band, Math.min(3000, (P.len || 0) + d)); P._base = null; posterNow(P); if (P._base.H === H0) return;
    changed(); redraw(); subSwell();
  }
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
    if (!P) return; var sel = S.stage === 2 ? '.au-drag canvas' : '.au-eslide.now canvas', f = panel.querySelector(sel); if (!f) return;
    var go2 = function () { fontReady().then(function () { var g = panel.querySelector(sel); if (!g || !P) return; var o = posterNow(P); lastBoxes = o.boxes; g.width = o.c.width; g.height = o.c.height; g.getContext('2d').drawImage(o.c, 0, 0); selBox(); if (S.stage === 3) { saveSoon(o.c, 'novel-global-' + ((P.note && P.note.code) || 'piece') + '.png'); printPreview(); } }); };
    if (P.photo && !P.img) NG.loadImg(P.photo).then(function (im) { P.img = im; P._base = null; go2(); }).catch(go2); else go2();
  }
  /* at print, the piece shown as the paper will have it: the very sheet the printer is sent, dots and all */
  var PV = 0;
  function printPreview() { var my = ++PV; posterPrint(512).then(function (sh) { if (my !== PV || !sh || S.stage !== 3) return; var g = panel.querySelector('.au-eslide.now canvas'); if (!g) return; g.width = sh.width; g.height = sh.height; var x2 = g.getContext('2d'); x2.imageSmoothingEnabled = false; x2.drawImage(sh, 0, 0); g.classList.add('sheet'); }); }
  api.redraw = function () { redraw(); };
  /* saving a poster to the phone. An iPhone opens a data link and then does nothing with it, so the poster is made into a file ahead of
     time and the tap hands it straight to the share sheet (Save Image). Elsewhere it downloads as a file */
  var SAVE = { file: null };
  function saveSoon(c, name) { SAVE.file = null; try { c.toBlob(function (b) { if (b) SAVE.file = new File([b], name, { type: 'image/png' }); }, 'image/png'); } catch (e) { /* none */ } }
  function saveImg(file, make, name) {
    var go3 = function (blob) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); bubbles(4); };
    if (file) { go3(file); return; } make().then(function (c) { c.toBlob(function (b) { if (b) go3(b); }, 'image/png'); });
  }
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
    /* a touch only takes hold of a piece; anywhere else on the poster the page scrolls, so a long strip never gets stuck */
    c.addEventListener('touchstart', function (e) { var t = e.touches[0]; if (!t || e.touches.length > 1) return; var k = hit(at(t)); if (k && k !== 'pic') e.preventDefault(); }, { passive: false });
    c.addEventListener('pointerdown', function (e) { var p = at(e), k = hit(p);
      if (!k) { if (S.sel) { S.sel = null; selBox(); } return; }
      S.sel = k; selBox(); if (k === 'pic') return;
      e.preventDefault(); hold = { k: k, dx: p[0] - lastBoxes[k][0], dy: p[1] - lastBoxes[k][1], moved: 0, x0: e.clientX, y0: e.clientY }; try { c.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } c.classList.add('holding'); });
    c.addEventListener('pointermove', function (e) {
      var p = at(e); if (!hold) { c.style.cursor = hit(p) ? 'grab' : ''; return; }
      hold.moved = Math.max(hold.moved, Math.abs(e.clientX - hold.x0) + Math.abs(e.clientY - hold.y0));
      var b = lastBoxes[hold.k], W = c.width, H = c.height, nx = Math.max(0, Math.min(W - b[2], p[0] - hold.dx)) / W, ny = Math.max(0, Math.min(H - b[3], p[1] - hold.dy)) / H;
      if (hold.k.charAt(0) === 'a' && hold.k.length > 1) { var a = P.adds[+hold.k.slice(1)]; a.x = nx; a.y = ny; delete a.band; } else P.pos[hold.k] = [nx, ny];
      /* carried near the top or foot of the view, the page moves with it */
      var vr = panel.getBoundingClientRect(), edge = 56; if (e.clientY > vr.bottom - edge) panel.scrollTop += 12; else if (e.clientY < vr.top + edge) panel.scrollTop -= 12;
      if (!artRaf) artRaf = requestAnimationFrame(function () { artRaf = 0; redraw(); }); });
    var up = function () { if (!hold) return; var mv = hold.moved; hold = null; c.classList.remove('holding'); if (mv > 4) { changed(); bell(2, 0.14); } else { var a = selAdd(); if (a && a.k === 't') { var tx = $('#au-tx'); if (tx) tx.focus(); } } };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  }
  /* print: the receipt for the thermal head (the base's own, its photograph through the print pipeline, its code back to the site), the poster
     kept in colour on the wall. The round is over: the receipt goes up the print tentacle into the bell, a bead is added to its crown, a mark is earned */
  /* ───────── the receipt: the poster set again for the thermal head, at its own width, to its limits ─────────
     Words are drawn at the printer's own size and made pure black (no grey, no dither: a hot dot or none), so they come out
     as dark as the paper allows. Only the picture is dithered, and it runs edge to edge. What was caught or added below is kept
     as line work, crisp. The code is set large, a whole number of dots to each module, with clear paper round it.
     Light paper prints black on white; dark paper prints the head and the four lines reversed, white out of black */
  function printSheet(W, D) {
    /* the receipt is always black on white: reversed blocks print as white on white */
    var keep = P.paper, dark = false; P.paper = 'white'; P._base = null; PRINTMODE = true; var pc = posterNow(P), B0 = P._base;
    var gl = document.createElement('canvas'); gl.width = B0.W; gl.height = B0.H; drawItems(gl.getContext('2d'), P, B0, true);
    /* the pieces alone on white paper, as they print: what reaches up over the line under the words is taken from here, never the words */
    var io = document.createElement('canvas'); io.width = B0.W; io.height = B0.H; var iog = io.getContext('2d'); iog.fillStyle = '#fff'; iog.fillRect(0, 0, B0.W, B0.H); var w1 = WHITE; usePaper(true); drawItems(iog, P, B0); usePaper(w1); PRINTMODE = false; P.paper = keep; P._base = null;
    var src = pc.c, k = W / B0.W, m = 14, parts = [], PS = '"Archivo Narrow", "Arial Narrow", Arial, sans-serif';
    var mk = function (h) { var c = document.createElement('canvas'); c.width = W; c.height = Math.max(1, Math.round(h)); var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, c.height); return c; };
    /* every dot black or white: words and lines only, never the photograph */
    var hard = function (c, inv) { var g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data; for (var i = 0; i < d.length; i += 4) { var v = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) < 150 ? 0 : 255; if (inv) v = 255 - v; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } g.putImageData(im, 0, 0); return c; };
    var crop = function (y0, y1, x0, x1, from) { x0 = Math.max(0, Math.round(x0 || 0)); x1 = Math.min(B0.W, Math.round(x1 || B0.W)); y0 = Math.max(0, Math.round(y0)); y1 = Math.min(B0.H, Math.round(y1)); if (y1 - y0 < 4 || x1 - x0 < 4) return null; var kk = W / (x1 - x0), h = Math.round((y1 - y0) * kk), c = mk(h), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(from || src, x0, y0, x1 - x0, y1 - y0, 0, 0, W, h); return c; };
    /* words placed over the picture: not dithered with it but laid over it whole, black on a white halo (white on black, turned) */
    var lay = function (dc, y0, y1, x0, x1) { x0 = Math.max(0, Math.round(x0)); x1 = Math.min(B0.W, Math.round(x1)); y0 = Math.max(0, Math.round(y0)); y1 = Math.min(B0.H, Math.round(y1));
      var gc = document.createElement('canvas'); gc.width = dc.width; gc.height = dc.height; var gg = gc.getContext('2d'); gg.imageSmoothingQuality = 'high'; gg.drawImage(gl, x0, y0, x1 - x0, y1 - y0, 0, 0, dc.width, Math.round((y1 - y0) * W / (x1 - x0)));
      var a = gg.getImageData(0, 0, gc.width, gc.height).data, dx = dc.getContext('2d'), im = dx.getImageData(0, 0, dc.width, dc.height), d = im.data;
      for (var i = 0; i < d.length; i += 4) if (a[i + 3] > 110) { var v = (a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114) < 128 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      dx.putImageData(im, 0, 0); };
    /* a photograph's tones stretched to the full range and lifted a little in the dark, so it neither washes out nor sinks in the dither */
    var levels = function (c) { var g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, h = new Array(256).fill(0), n = d.length / 4;
      for (var i = 0; i < d.length; i += 4) h[Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114)]++;
      var lo = 0, hi = 255, acc = 0; while (lo < 255 && (acc += h[lo]) < n * 0.02) lo++; acc = 0; while (hi > 0 && (acc += h[hi]) < n * 0.02) hi--; if (hi - lo < 20) return;
      for (var j = 0; j < d.length; j += 4) for (var k = 0; k < 3; k++) { var v = Math.max(0, Math.min(1, (d[j + k] - lo) / (hi - lo))); d[j + k] = Math.round(Math.pow(v, 0.85) * 255); }
      g.putImageData(im, 0, 0); };
    var blank = function (c) { var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, n = 0; for (var i = 0; i < d.length; i += 16) if (d[i] < 150) n++; return n < 12; };
    /* the head: the mark, the name, the code */
    var hd = mk(78), hx = hd.getContext('2d'); hx.fillStyle = '#000'; hx.textBaseline = 'middle';
    var hmw = ngMark(hx, m + 1, 39, 26, '#000', dotFill(hx, 2)); hx.font = '700 34px "Helvetica Neue", Helvetica, Arial, sans-serif'; hx.fillText('novel.global', m + hmw + 14, 40);
    var code = (P.note && P.note.code) || '', day = NG.when(P.at || Date.now()).slice(0, 6) + (P.who ? ' · by ' + P.who : ''); if (code) { hx.font = '700 26px ' + PS; var cw = hx.measureText(code).width; hx.fillText(code, W - m - cw, 40); hx.font = '600 20px ' + PS; hx.fillText(day, W - m - cw - 14 - hx.measureText(day).width, 41); }
    if (!dark) hx.fillRect(m, 74, W - m * 2, 3); parts.push(hard(hd, dark));
    /* the picture, edge to edge, with everything laid over it */
    var picP = null; if (B0.art) { var ac = crop(B0.art[1] - 2, B0.art[1] + B0.art[3] + 2, B0.art[0] - 2, B0.art[0] + B0.art[2] + 2); if (ac) { levels(ac); var dc = NG.forPrint(ac, W, D); lay(dc, B0.art[1] - 2, B0.art[1] + B0.art[3] + 2, B0.art[0] - 2, B0.art[0] + B0.art[2] + 2); picP = dc; } }
    if (picP) picP._pic = 1; if (picP && !P.wtop) parts.push(picP);
    /* the words, at the printer's size */
    var tw = mk(10), tx = tw.getContext('2d'), lines = P.lines || [], rows = [], said = P.say && lines.indexOf(P.say) < 0 ? P.say : '';
    tx.font = '600 40px ' + PS; var tl = said ? wrap(tx, said, W - m * 2).slice(0, 4) : [];
    tx.font = '600 32px ' + PS; lines.forEach(function (l) { if (l) wrap(tx, l, W - m * 2).forEach(function (w, j) { rows.push([j ? '' : '·', w]); }); });
    if (tl.length || rows.length) {
      tw = mk(20 + tl.length * 48 + (tl.length && rows.length ? 12 : 0) + rows.length * 42 + lines.filter(Boolean).length * 10 + 16); tx = tw.getContext('2d'); tx.fillStyle = '#000'; tx.textBaseline = 'top'; var y = 16;
      tx.font = '600 40px ' + PS; tl.forEach(function (l) { tx.fillText(l, m, y); y += 48; }); if (tl.length && rows.length) y += 12;
      rows.forEach(function (r, i) { if (r[0] && i) y += 10; tx.font = '600 32px ' + PS; tx.fillText(r[1], m, y + 1); y += 42; });
      parts.push(hard(tw, dark));
    }
    if (picP && P.wtop) parts.push(picP);
    /* what was caught or added below the words, as line work */
    /* pictures placed there are photographs, not line work: they are dithered as the main picture is, the rest kept crisp */
    /* everything below the words to the foot, beside the code too; the code's own place left clear, as it is set again crisp below */
    /* the band below the words, as the poster lays it out: its pieces where they are, and the code in its own place in the same row.
       A piece reaching up over the line under the words comes through whole (only the pieces themselves, never the words beside them) */
    var boxes = items(P, B0).map(function (it) { var s2 = it.tf.s || 1; return [it.X - 10, it.Y - 10, it.X + it.w * s2 + 10, it.Y + it.h * s2 + 10]; });
    var line0 = B0.band - 16, top0 = line0, floor0 = B0.art ? B0.art[1] + B0.art[3] + 4 : 0;
    boxes.forEach(function (bq) { if (bq[3] > B0.band && bq[1] < line0) top0 = Math.max(floor0, Math.min(top0, bq[1])); });
    var bx = [top0, B0.H - 2, B0.pad - 8, B0.W - B0.pad + 8], bd = crop(bx[0], bx[1], bx[2], bx[3]), bk = W / (bx[3] - bx[2]);
    var clearQR = function (c) { if (!B0.qr) return; var g4 = c.getContext('2d'); g4.fillStyle = '#fff'; g4.fillRect((B0.qr.x - 16 - bx[2]) * bk, (B0.qr.y - 16 - bx[0]) * bk, (B0.qr.s + 32) * bk, (B0.qr.s + 32) * bk); };
    var aboveLine = function (c) { if (top0 >= line0) return; var hh = Math.round((line0 - top0) * bk), pc2 = crop(top0, line0, bx[2], bx[3], io); if (pc2) { var g5 = c.getContext('2d'); g5.fillStyle = '#fff'; g5.fillRect(0, 0, W, hh); g5.drawImage(pc2, 0, 0, W, hh); } };
    if (bd) { clearQR(bd); aboveLine(bd); var ln = mk(bd.height); ln.getContext('2d').drawImage(bd, 0, 0); hard(ln); var anyPic = false, md = null;
      if (!blank(ln)) { var pm = document.createElement('canvas'); pm.width = B0.W; pm.height = B0.H; var pg = pm.getContext('2d'); pg.fillStyle = '#000';
        items(P, B0).forEach(function (it) { var a2 = it.key.charAt(0) === 'a' && it.key.length > 1 ? P.adds[+it.key.slice(1)] : null; if (!a2 || a2.k !== 'im' || a2.crisp) return; anyPic = true;
          var s2 = it.tf.s || 1, w2 = it.w * s2, h2 = it.h * s2; pg.save(); pg.translate(it.X + w2 / 2, it.Y + h2 / 2); pg.rotate((it.tf.r || 0) * Math.PI / 180); pg.scale(s2, s2); pg.fillRect(-it.w / 2 - 8, -it.h / 2 - 8, it.w + 16, it.h + 16); pg.restore(); });
        if (anyPic) { var mc2 = crop(bx[0], bx[1], bx[2], bx[3], pm); md = mc2.getContext('2d').getImageData(0, 0, W, mc2.height).data; levels(bd); var dt = NG.forPrint(bd, W, D), dd = dt.getContext('2d').getImageData(0, 0, W, dt.height).data, lx = ln.getContext('2d'), li = lx.getImageData(0, 0, W, ln.height), l2 = li.data;
          for (var i3 = 0; i3 < l2.length && i3 < dd.length; i3 += 4) if (md[i3] < 128) { var v3 = dd[i3] < 128 ? 0 : 255; l2[i3] = l2[i3 + 1] = l2[i3 + 2] = v3; } lx.putImageData(li, 0, 0); } }
      /* the code where the poster has it, right-aligned to its place and as large as a phone needs (a whole number of dots to every
         square, four at least), its quiet paper round it; the band grows if the code needs more room than the poster gave it */
      var Q = window.qrcode, qk = null; if (Q && P.note && P.note.code && B0.qr) { try {
        var q = Q(0, 'M'); q.addData(NG.noteURL(P.note)); q.make(); var mc = q.getModuleCount(), want = Math.max(B0.qr.s * bk, 200), cell = Math.floor(Math.min(260, want) / mc);
        if (cell < 4) { q = Q(0, 'L'); q.addData(NG.noteURL(P.note)); q.make(); mc = q.getModuleCount(); cell = Math.max(4, Math.floor(Math.min(260, want) / mc)); }
        var side = cell * mc, quiet = cell * 2, qx = Math.round(Math.min(W - m - side, (B0.qr.x + B0.qr.s - bx[2]) * bk - side)), qy = Math.round(Math.max(quiet, (B0.qr.y - bx[0]) * bk));
        if (qy + side + quiet > ln.height) { var big = mk(qy + side + quiet + 6); big.getContext('2d').drawImage(ln, 0, 0); ln = big; }
        var qg = ln.getContext('2d'); qg.fillStyle = '#fff'; qg.fillRect(qx - quiet, qy - quiet, side + quiet * 2, side + quiet * 2); qg.fillStyle = '#000';
        for (var a = 0; a < mc; a++) for (var b = 0; b < mc; b++) if (q.isDark(a, b)) qg.fillRect(qx + b * cell, qy + a * cell, cell, cell);
        qk = [qx - quiet, qy - quiet, side + quiet * 2, side + quiet * 2]; } catch (e) { qk = null; } }
      /* no empty paper under the last mark */
      var ld = ln.getContext('2d').getImageData(0, 0, W, ln.height).data, last = 0; for (var yy3 = ln.height - 1; yy3 >= 0 && !last; yy3--) for (var xx3 = 0; xx3 < W; xx3 += 2) if (ld[(yy3 * W + xx3) * 4] < 128) { last = yy3; break; }
      if (last) { var lt = mk(Math.min(ln.height, last + 18)); lt.getContext('2d').drawImage(ln, 0, 0); if (md) lt._mask = md; if (qk) lt._keep = qk; parts.push(lt); } }
    /* blue paper prints as a night slip: the paper a fine dark shade (five dots in eight, in a regular weave, so it reads as a polished
       grey rather than a solid black the head would labour over), every word, line, mark and icon white with a thin dark edge to hold
       it. Photographs stay as they are; the code keeps a white tile of its own, so it always scans */
    var night = P.pnight != null ? !!P.pnight : START.printNight === 'day' ? false : START.printNight === 'night' ? true : keep !== 'white';
    if (night) parts = parts.map(function (c) { return c._pic ? c : nightOf(c, c._keep, c._mask); });
    /* one strip of paper; a little run-out at the end for the tear */
    var H = parts.reduce(function (s2, c) { return s2 + c.height; }, 0) + 40, out = mk(H), o = out.getContext('2d'), yy = 0;
    parts.forEach(function (c) { o.drawImage(c, 0, yy); yy += c.height; });
    var dk = night; if (dk) { o.fillStyle = '#000'; for (var ry = yy; ry < H; ry++) for (var rx = 0; rx < W; rx++) if (BAYER[(ry & 3) * 4 + (rx & 3)] < 10) o.fillRect(rx, ry, 1, 1); }
    if (P.wm) { var wc = mk(H), wx = wc.getContext('2d'), wh2 = (W - m * 2) * 0.42, top = H - 40; ngMark(wx, (W - wh2 * 2.36) / 2, Math.min(top - wh2, H * 0.46), wh2, dotFill(wx, 4), dotFill(wx, 7));
      var wd = wx.getImageData(0, 0, W, top).data, oi = o.getImageData(0, 0, W, top), od = oi.data; for (var i5 = 0; i5 < od.length; i5 += 4) if (wd[i5] < 128 && (dk ? od[i5] < 128 : od[i5] > 128)) { od[i5] = od[i5 + 1] = od[i5 + 2] = dk ? 255 : 0; } o.putImageData(oi, 0, 0); }
    return out;
  }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  /* a part of the receipt turned to night: ink to white, paper to the shade, a dark edge round every white mark; keep (a rectangle)
     and mask (a picture's place) are left as printed */
  function nightOf(c, keep, mask) {
    var g = c.getContext('2d'), w = c.width, h = c.height, im = g.getImageData(0, 0, w, h), d = im.data, ink = new Uint8Array(w * h), i, x, y;
    for (i = 0; i < w * h; i++) ink[i] = d[i * 4] < 128 ? 1 : 0;
    var kept = function (x2, y2) { return (keep && x2 >= keep[0] && x2 < keep[0] + keep[2] && y2 >= keep[1] && y2 < keep[1] + keep[3]) || (mask && mask[(y2 * w + x2) * 4] < 128); };
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { i = y * w + x; if (kept(x, y)) continue; var v;
      if (ink[i]) v = 255; else { var edge = false; for (var dy = -2; dy <= 2 && !edge; dy++) for (var dx = -2; dx <= 2; dx++) { var X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && ink[Y * w + X]) { edge = true; break; } }
        v = edge || BAYER[(y & 3) * 4 + (x & 3)] < 10 ? 0 : 255; }
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; }
    g.putImageData(im, 0, 0); return c;
  }
  function posterPrint(W) {
    if (!NG.forPrint || !NG.ditherLib) return Promise.resolve(null);
    return Promise.all([fontReady(), NG.ditherLib(), NG.qrLib ? NG.qrLib() : null]).then(function (r) { var out = printSheet(W, r[1]); S.lastPrint = [out.width, out.height]; S.lastSheet = out; return out; }).catch(function (e) { console.error('print sheet: ' + (e && e.stack || e)); return null; });
  }
  var PMODES = [['paper', 'print', '80 mm'], ['mesh', 'sig', '80 mm + mesh'], ['wall', 'wall', 'wall only']];
  S.pmode = store.get('da.aura.pmode', 'paper'); if (!PMODES.some(function (m) { return m[0] === S.pmode; })) S.pmode = 'paper';
  var pmode = function () { return PMODES.filter(function (m) { return m[0] === S.pmode; })[0]; };
  function printNow() {
    var n = settle(); if (!n) return; var btn = $('#au-print'), st = $('#au-pips'); btn.disabled = true; btn.classList.add('going'); st.innerHTML = NG.pips('sending');
    var art = P.photo ? 'photo' : 'net', photo = NG.PHOTOS[n.id] || P.photo || P.spPhoto || '', show2 = { line: 1, life: !!lifeOf(P), facts: 0, links: 0, code: 1 };
    var toWall = S.pmode === 'wall'; beat(toWall ? 'wall' : 'print');
    (toWall ? Promise.resolve('kept') : NG.printers().then(function (list) {
      var ps = list.filter(function (p) { return p.paired || p.id === (B.master && B.master.id); }), dest = ps.length ? ps[0].id : (B.master ? B.master.id : 'novelglobal'), paper2 = ps.length ? ps[0].paper : (B.master && B.master.paper) || 80;
      var Pp = (B.printers || {})[String(paper2 || 80)] || { dots: 512 }, W = Pp.dots - Pp.dots % 8;
      return posterPrint(W).then(function (c) { return c || NG.slip(n, photo, { lines: [], rel: [], call: null }, { art: photo ? 'photo' : art, wish: n.wish, show: show2 }, W); }).then(function (c) { return NG.sendNote(n, c, dest, n.wish, S.pmode === 'mesh' ? sigOf(P) : null); });
    })).then(function (s) {
      st.innerHTML = toWall ? '' : NG.pips(s, n.sent && n.sent.why); btn.classList.remove('going');
      if (!toWall && s !== 'failed') { lvUp((P.adds || []).length ? 4 : 3); store.set('da.aura.printed', 1); if (S.pmode === 'mesh') store.set('da.aura.mesh', 1); } if (!toWall && n.sent && n.sent.id) NG.follow(n, st); harp([0, 2, 4, 7]);
      return poster(P).then(function (c) {
        var first = !P.folioId, item = { id: P.folioId || 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), src: c.toDataURL('image/jpeg', 0.86), cap: titleOf(P), code: n.code, wall: toWall ? 1 : 0 };
        P.folioId = item.id; P.sent = 1; item.piece = pack(P); folioKeep(item); draftSave(pack(P)); miniMake();
        if (NG.meUsed) NG.meUsed(); made('poster', titleOf(P));
        if (first) { ROUNDS++; store.set('da.aura.rounds', ROUNDS); if (ROUNDS >= 2) lvUp(5); applyGates(); var have = marksHave(); if (have.length > 4 && ROUNDS + 4 <= MARK_ORDER.length) S.newMark = have[have.length - 1]; }
        S.round = performance.now() / 1000; S.sting = S.round;
        btn.disabled = false; btn.innerHTML = svgI('seed'); btn.setAttribute('aria-label', 'Begin a new piece');
        var hero = panel.querySelector('.au-hero'); if (hero) hero.classList.add('kept');
        setTimeout(function () { WALL = Math.max(0, showList().map(function (q) { return q.id; }).indexOf(item.id)); if (S.stage === 3) paint(); }, 2200);
      });
    }).catch(function () { st.innerHTML = NG.pips('failed'); btn.disabled = false; btn.classList.remove('going'); });
  }
  /* the wall, when nothing is being made: every finished piece in a light carousel (Embla), the one in front whole and its neighbours
     just showing either side. Dragged or swiped along; a touch opens it full screen; the one in front can be brought back or taken down */
  /* ───────── the signal: a piece folded into one line short enough for a LoRa radio (200 characters at most) and anything else that
     carries words (a message, paper, a voice). Unfolded anywhere, the engine grows it back into a whole poster from what it already knows:
     the life by its name, the place by its point, the day, El Niño, the marks laid where they go. Online it fills in the life's photograph.
       ng:<lat><lng>~<day>~<life>~<marks>~<intention>~<four lines>~<code>
     lat and lng in ten-thousandths, base 36; the day counted from 2026, base 36; marks a letter each (a–f the stamps, g–r the marks,
     w for white paper, n for El Niño) ───────── */
  var SIG0 = Date.UTC(2026, 0, 1), SIGMAX = 200;
  var b36 = function (n) { return (n < 0 ? '-' : '') + Math.abs(Math.round(n)).toString(36); };
  var clean = function (t) { return String(t || '').replace(/[~\n\r]+/g, ' ').replace(/\s+/g, ' ').trim(); };
  function sigOf(p) {
    var marks = (p.adds || []).map(function (a) { return a.k === 'st' ? 'abcdef'.charAt(a.g) : a.k === 's' ? 'ghijklmnopqr'.charAt(MARK_ORDER.indexOf(a.g)) : ''; }).join('').slice(0, 8) + (p.paper === 'white' ? 'w' : '') + (p.catch && p.catch.nino ? 'n' : '');
    var head = 'ng:' + b36((p.lat || 0) * 1e4) + ',' + b36((p.lng || 0) * 1e4) + '~' + b36(Math.max(0, Math.floor(((p.at || Date.now()) - SIG0) / 864e5))) + '~' + ((p.catch && p.catch.life) || '') + '~' + marks;
    var txt = [clean(p.say)].concat((p.lines || []).map(clean)), tail = '~' + ((p.note && p.note.code) || '');
    var fit = function () { return head + '~' + txt.join('~') + tail; };
    /* too long: the longest part loses its last word, again, until it fits */
    while (new Blob([fit()]).size > SIGMAX) { var k = 0; txt.forEach(function (t, i) { if (t.length > txt[k].length) k = i; }); var w = txt[k].split(' '); if (w.length > 1) w.pop(); else w = [txt[k].slice(0, Math.max(0, txt[k].length - 4))]; txt[k] = w.join(' '); if (!txt.join('').length) break; }
    return fit();
  }
  function pieceOf(code) {
    var m = String(code || '').trim().match(/ng:([-0-9a-z]+),([-0-9a-z]+)~([0-9a-z]*)~([^~]*)~([a-z]*)~([^~]*)~([^~]*)~([^~]*)~([^~]*)~([^~]*)(?:~([^~\s]*))?/i); if (!m) return null;
    var p = newPiece(), D = NG.DB(); p.lat = parseInt(m[1], 36) / 1e4; p.lng = parseInt(m[2], 36) / 1e4; p.src = 'TAP'; p.at = SIG0 + (parseInt(m[3] || '0', 36) || 0) * 864e5 + 12 * 36e5;
    if (m[4] && (!D || D.field.some(function (f) { return f.id === m[4]; }))) p.catch.life = m[4];
    p.say = m[6]; p.lines = [m[7], m[8], m[9], m[10]]; p.catch.map = true; p.catch.data = [NG.when(p.at).slice(0, 6).toLowerCase()];
    var marks = m[5] || '', n2 = 0; p.paper = marks.indexOf('w') >= 0 ? 'white' : 'blue'; p.catch.nino = marks.indexOf('n') >= 0;
    marks.replace(/[wn]/g, '').split('').forEach(function (ch, i) { var st = 'abcdef'.indexOf(ch), mk = 'ghijklmnopqr'.indexOf(ch), a = st >= 0 ? { k: 'st', g: st, r: (i % 2 ? 6 : -6) } : mk >= 0 ? { k: 's', g: MARK_ORDER[mk] } : null; if (!a) return;
      a.band = n2 + 1; a.x = a.y = 0; n2++; p.adds.push(a); });
    if (n2) p.len = Math.ceil(n2 / 3) * 240;
    p.from = (m[11] || '').toUpperCase(); return p;
  }
  /* a line pasted, typed or scanned back in: it becomes the piece in hand, at print, in front */
  function takeSig(code) {
    var p = pieceOf(code); if (!p) return false; if (done()) fresh(); P = p; think(); spFetch(P); draftSave(pack(P)); WALL = 0; subSwell(); bubbles(6);
    if (S.mode === 'iruk') { if (S.stage === 3) { closeSig(); paint(); } else step(3); } return true;
  }
  /* the signal sheet: the line itself, its square code, and where it can go (copied, handed to another app, sent to the radios); a line
     pasted into it is taken in. No words: signs alone */
  function openSig(f) {
    closeSig(); var piece0 = f && f.piece ? unpack(f.piece) : P, code = piece0 ? sigOf(piece0) : '', el = document.createElement('div'); el.className = 'au-sig'; el.id = 'au-sig';
    el.innerHTML = '<button class="au-back" id="au-sigx" aria-label="Close"><i></i></button>' + (code ? '<canvas class="au-sigq" width="200" height="200"></canvas><output class="au-sigt" id="au-sigt">' + esc(code) + '</output><b class="au-sign">' + new Blob([code]).size + '/' + SIGMAX + '</b>' +
      '<nav class="au-sigk">' + hand('au-sm', svgI('copy'), 'id="au-sigc" aria-label="Copy"') + hand('au-sm', svgI('save'), 'id="au-sigs" aria-label="Download"') + hand('au-sm', svgI('radio'), 'id="au-sigm" aria-label="Send to the radios"') + '<span class="au-pips" id="au-sigp"></span></nav>' : '') +
      '<label class="au-sigin">' + svgI('in') + '<textarea id="au-sigi" rows="2" maxlength="400" aria-label="Paste a line" spellcheck="false" autocapitalize="off"></textarea></label>';
    panel.appendChild(el); bubbles(4);
    $('#au-sigx').addEventListener('click', closeSig);
    if (code) {
      NG.qrLib().then(function (Q) { var c = el.querySelector('.au-sigq'); if (!Q || !c) return; try { var q = Q(0, 'L'); q.addData(code); q.make(); var n3 = q.getModuleCount(), cs = Math.floor(200 / (n3 + 4)), g = c.getContext('2d'); g.fillStyle = '#F4F1E8'; g.fillRect(0, 0, 200, 200); g.fillStyle = '#17457F'; var o = Math.floor((200 - cs * n3) / 2); for (var a = 0; a < n3; a++) for (var b = 0; b < n3; b++) if (q.isDark(a, b)) g.fillRect(o + b * cs, o + a * cs, cs, cs); } catch (e) { /* too long for a square */ } });
      $('#au-sigc').addEventListener('click', function () { var t = $('#au-sigt'); (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(code) : Promise.reject()).catch(function () { var r = document.createRange(); r.selectNodeContents(t); var sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); try { document.execCommand('copy'); } catch (e) { /* none */ } }); bubbles(3); this.classList.add('on'); });
      /* the signal's code kept as a picture, large and sharp */
      $('#au-sigs').addEventListener('click', function () { var q = el.querySelector('.au-sigq'); if (!q) return; var big = document.createElement('canvas'); big.width = big.height = 1200; var g2 = big.getContext('2d'); g2.imageSmoothingEnabled = false; g2.drawImage(q, 0, 0, 1200, 1200); saveImg(null, function () { return Promise.resolve(big); }, 'novel-global-signal.png'); });
      $('#au-sigm').addEventListener('click', function () { var b2 = this, st = $('#au-sigp'), n = piece0.note || (piece0 === P ? settle() : null); if (!n) { n = { code: piece0.from || '', lat: piece0.lat, lng: piece0.lng, say: piece0.say }; }
        b2.disabled = true; st.innerHTML = NG.pips('sending'); NG.sendMesh(n, code).then(function (s2) { st.innerHTML = NG.pips(s2); b2.disabled = false; subSwell(); }); });
    }
    var inp = $('#au-sigi'); inp.addEventListener('input', function () { if (/ng:[-0-9a-z]+,/i.test(inp.value) && pieceOf(inp.value)) takeSig(inp.value); });
  }
  /* one's own three characters: printed on what one prints (never on what the site shows), typed on another phone to carry on there;
     what was sent with them, each taken down from the site here (it is all still kept on the approval page) */
  /* the board: a few words in the section of the step one is on (notice, story, make, print), each by its maker's kin; a reply under
     what it answers. Written only with a code a print gave; read by anyone */
  var TK = { sec: 0, re: null };
  var TSECS = ['notice', 'story', 'make', 'print'];
  function talkOpen(i) {
    var p = $('#au-talkp'); TK.sec = i != null ? i : S.mode === 'iruk' ? S.stage : 0; TK.re = null; p.hidden = false; root.classList.add('talking');
    p.querySelector('nav').innerHTML = TSECS.map(function (q, j) { return '<button data-ts="' + j + '" class="' + (j === TK.sec ? 'on' : '') + '" aria-label="' + q + '">' + svgI(STEPS[j][1]) + '</button>'; }).join('') + '<button class="x" aria-label="Close">×</button>';
    [].forEach.call(p.querySelectorAll('[data-ts]'), function (b) { b.addEventListener('click', function () { talkOpen(+b.dataset.ts); }); });
    p.querySelector('.x').addEventListener('click', talkClose);
    var ol = p.querySelector('ol'), cached = store.get('da.talk.' + TSECS[TK.sec], []) || []; talkFill(ol, cached);
    fetch('/api/talk?s=' + TSECS[TK.sec]).then(function (r) { return r.json(); }).then(function (j) { var l = (j && j.talk) || []; store.set('da.talk.' + TSECS[TK.sec], l.slice(0, 40)); if (!p.hidden) talkFill(ol, l); }).catch(function () {});
  }
  function talkClose() { $('#au-talkp').hidden = true; root.classList.remove('talking'); }
  function talkFill(ol, l) {
    var top = l.filter(function (t) { return !t.re; }), kids = function (id) { return l.filter(function (t) { return t.re === id; }).reverse(); };
    var li = function (t, sub) { var kk = NG.kin(t.kin) || { n: '', m: 0 }; return '<li data-id="' + esc(t.id) + '" class="' + (sub ? 'sub' : '') + '"><i class="kin">' + markI(MARK_ORDER[kk.m]) + '</i><b>' + esc(kk.n) + '</b><span>' + esc(t.text) + '</span><small>' + esc(NG.moonsAgo(t.at)) + '</small></li>'; };
    ol.innerHTML = top.length ? top.map(function (t) { return li(t) + kids(t.id).map(function (c) { return li(c, 1); }).join(''); }).join('') : '<li class="none">·</li>';
    [].forEach.call(ol.querySelectorAll('li[data-id]:not(.sub)'), function (e) { e.addEventListener('click', function () { TK.re = TK.re === e.dataset.id ? null : e.dataset.id; [].forEach.call(ol.querySelectorAll('li'), function (q) { q.classList.toggle('re', q.dataset.id === TK.re); }); var i = $('#au-talkp input'); i.placeholder = TK.re ? '↳' : '…'; i.focus(); }); });
  }
  $('#au-talk').addEventListener('click', function () { if ($('#au-talkp').hidden) talkOpen(); else talkClose(); bell(3, 0.1); });
  $('#au-talkp form').addEventListener('submit', function (e) { e.preventDefault(); var i = this.querySelector('input'), t = i.value.trim(); if (!t) return;
    i.disabled = true; fetch('/api/talk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ s: TSECS[TK.sec], who: NG.me(), text: t, re: TK.re }) })
      .then(function (r) { i.disabled = false; if (r.status === 201) { i.value = ''; TK.re = null; i.placeholder = '…'; return r.json().then(function (j) { if (j.kin != null) { store.set('da.kin', j.kin); keyName(); } made('talk', t, false); talkOpen(TK.sec); }); }
        var k = $('#au-yours'); if (k) { k.classList.remove('took'); void k.offsetWidth; k.classList.add('took'); } bell(1, 0.1); })
      .catch(function () { i.disabled = false; }); });
  function keyName() { var b = $('#au-yours b'); if (!b) return; var on = store.get('da.who.pass', 0) && NG.me, kk = on && NG.kin ? NG.kin(store.get('da.kin', null)) : null; b.innerHTML = on ? esc(NG.me()) + (kk ? markI(MARK_ORDER[kk.m]) : '') : ''; if (kk) b.title = kk.n; var tk = $('#au-talk'); if (tk) tk.hidden = !on; var yk = $('#au-yours'); if (yk) yk.hidden = !!on && !root.classList.contains('keyon'); }
  $('#au-yours').addEventListener('click', function () { beat('yours'); var k = $('#au-keyin'), i = k.querySelector('input'); k.hidden = !k.hidden; root.classList.toggle('keyon', !k.hidden); if (!k.hidden) { i.value = ''; setTimeout(function () { i.focus(); }, 30); } bell(2, 0.1); });
  $('#au-keyin input').addEventListener('input', function () { var i = this, v = i.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 3); i.value = v; if (v.length < 3) return;
    i.disabled = true; NG.useCode(v).then(function (ok) { i.disabled = false; if (!ok) { i.value = ''; bell(1, 0.1); return; } $('#au-keyin').hidden = true; keyName(); root.classList.add('keyon'); setTimeout(function () { if ($('#au-keyin').hidden) root.classList.remove('keyon'); keyName(); }, 4000); harp([0, 4, 7]); }); });
  function closeSig() { var el = $('#au-sig'); if (el) el.remove(); }
  var WALL = 0, EMB = null;
  var making = function () { return !!P && !P.sent && filled(); };
  var showList = function () { return (making() ? [{ id: 'now', now: 1 }] : []).concat(slides()); };
  function wallHTML() {
    var all = showList(); if (!all.length) return '<button class="au-go" data-go="0" aria-label="Begin a piece"><i></i>' + svgI('seed') + '<b class="au-arrow"></b></button><div class="au-press">' + hand('au-sm', svgI('in'), 'id="au-sigk0" aria-label="Take in a line"') + '</div>';
    WALL = Math.max(0, Math.min(WALL, all.length - 1));
    return '<div class="au-line2" aria-hidden="true"></div><div class="au-wall"><div class="au-etrack">' + all.map(function (f, i) { return '<figure class="au-eslide' + (f.now ? ' now' : '') + '" data-n="' + i + '"><span class="au-hung"><i class="au-clip l"></i><i class="au-clip r"></i><b class="au-st' + (f.now ? ' mk' : f.wall ? '' : ' pr') + '">' + (f.now ? 'draft' : f.wall ? 'only here' : 'shared') + '</b>' + (f.now ? '<canvas></canvas>' : '<img alt="" src="' + f.src + '">') + '</span></figure>'; }).join('') + '</div></div>' +
      (all.length > 1 ? '<nav class="au-wdots">' + all.map(function (q, i) { return '<i class="' + (i === WALL ? 'on' : '') + '"></i>'; }).join('') + '</nav>' : '') +
      '<div class="au-press" id="au-wpress"></div>';
  }
  /* the press for the one in front: the piece being made (start again, paper, save, print), or a printed one (print again, save, bring back, take down) */
  function wallPress() {
    var all = showList(), f = all[WALL], pr = $('#au-wpress'); if (!f || !pr) return;
    var nav = function (d) { return all.length > 1 ? hand('au-sm au-nav', d < 0 ? '‹' : '›', 'data-w="' + d + '" aria-label="' + (d < 0 ? 'Before' : 'After') + '"') : ''; };
    var pm = pmode();
    if (f.now) pr.innerHTML = nav(-1) + hand('au-big', svgI('print'), 'id="au-print" data-fw="' + (S.pmode === 'wall' ? 'hang' : 'print') + '" aria-label="' + (S.pmode === 'wall' ? 'Hang it on the wall' : 'Print') + '"') +
      hand('au-sm au-mode m-' + S.pmode, svgI(pm[1]) + '<small class="au-mw">' + esc(pm[2]) + '</small>', 'id="au-mode" aria-label="Where it goes: ' + pm[2] + '"') + hand('au-sm', svgI('save'), 'id="au-save" data-fw="save" aria-label="Save"') + hand('au-sm au-morek', '<b>···</b>', 'id="au-more" aria-label="More" aria-expanded="false"') + '<span class="au-more" hidden>' + hand('au-sm', svgI('sig'), 'id="au-sigk" data-fw="signal" aria-label="Signal"') +
      hand('au-sm', svgI('paper'), 'id="au-paper" data-fw="paper" aria-label="Blue paper or white" aria-pressed="' + (P.paper === 'white') + '"') + hand('au-sm', svgI(printNight() ? 'moon2' : 'moon'), 'id="au-pnight" data-fw="' + (printNight() ? 'night print' : 'day print') + '" aria-label="Print it dark or light" aria-pressed="' + printNight() + '"') + hand('au-sm au-reset au-del', svgI('bin'), 'id="au-reset" data-fw="delete draft" aria-label="Delete this draft and start again"') + '</span><span class="au-pips" id="au-pips"></span>' + nav(1);
    else pr.innerHTML = nav(-1) + (f.piece ? hand('au-big', svgI('print'), 'id="au-again" data-fw="print again" aria-label="Print it again"') : '') + hand('au-sm', svgI('save'), 'id="au-wsave" data-fw="save" aria-label="Save"') +
      (f.piece ? hand('au-sm', svgI('sig'), 'id="au-sigk" data-fw="signal" aria-label="Signal"') : '') + (f.piece ? hand('au-sm', svgI('back'), 'id="au-bring" data-fw="rework" aria-label="Bring it back to work on"') : '') +
      (ownSlide(f) ? hand('au-sm au-del', svgI('bin'), 'id="au-drop" data-fw="delete" aria-label="Delete it from here"') : '') + (P && P.sent ? hand('au-sm au-seedk', svgI('seed'), 'id="au-print" data-fw="new" aria-label="Begin a new piece"') : '') + nav(1);
    [].forEach.call(pr.querySelectorAll('[data-w]'), function (b) { b.addEventListener('click', function () { if (EMB) { if (+b.dataset.w > 0) EMB.scrollNext(); else EMB.scrollPrev(); } else { WALL = (WALL + (+b.dataset.w) + all.length) % all.length; paint(); } }); });
    if (f.now) {
      $('#au-print').addEventListener('click', function () { printNow(); });
      /* the rest, folded: signal, paper, day or night, delete */
      $('#au-more').addEventListener('click', function () { var m = pr.querySelector('.au-more'), on = m.hidden; m.hidden = !on; this.setAttribute('aria-expanded', String(on)); bell(on ? 3 : 1, 0.08); });
      $('#au-mode').addEventListener('click', function () { var i = PMODES.indexOf(pmode()); S.pmode = PMODES[(i + 1) % PMODES.length][0]; store.set('da.aura.pmode', S.pmode); wallPress(); bell(4 + i, 0.14); flashWords(0); });
      $('#au-save').addEventListener('click', function () { saveImg(SAVE.file, function () { return poster(P); }, 'novel-global-' + ((P.note && P.note.code) || 'piece') + '.png'); });
      $('#au-pnight').addEventListener('click', function () { P.pnight = !printNight(); changed(); paint(); bell(P.pnight ? 2 : 5, 0.16); });
      $('#au-paper').addEventListener('click', function () { P.paper = P.paper === 'white' ? 'blue' : 'white'; changed(); redraw(); this.setAttribute('aria-pressed', String(P.paper === 'white')); bell(5, 0.16); });
      NG.sureTap($('#au-reset'), function () { letGo(); });
    } else {
      var sd = $('#au-print'); if (sd) sd.addEventListener('click', function () { letGo(); });
      var nm = 'novel-global-' + (f.code || 'poster') + '.jpg', wf = null; fetch(f.src).then(function (r) { return r.blob(); }).then(function (b) { wf = new File([b], nm, { type: b.type || 'image/jpeg' }); }).catch(function () {});
      var ws = $('#au-wsave'); if (ws) ws.addEventListener('click', function () { saveImg(wf, function () { return NG.loadImg(f.src).then(function (im) { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); return c; }); }, nm); });
      /* printed again: it comes forward as the piece in hand, goes to the printer, and takes its own place on the wall again */
      var ag = $('#au-again'); if (ag) NG.sureTap(ag, function () { P = unpack(f.piece); P.sent = 0; think(); WALL = 0; paint(); fontReady().then(function () { setTimeout(function () { if ($('#au-print')) printNow(); }, 400); }); bell(5, 0.2); });
      var br = $('#au-bring'); if (br) br.addEventListener('click', function () { P = unpack(f.piece); P.sent = 0; think(); draftSave(pack(P)); miniSoon(); bell(5, 0.22); step(2); });
      var dr = $('#au-drop'); if (dr) NG.sureTap(dr, function () { dropSlide(f).then(function () { WALL = Math.max(0, WALL - 1); paint(); }); bell(1, 0.16); });
    }
    var sk = $('#au-sigk'); if (sk) sk.addEventListener('click', function () { openSig(f.now ? null : f); });
    [].forEach.call(panel.querySelectorAll('.au-wdots i'), function (d, i) { d.classList.toggle('on', i === WALL); });
    [].forEach.call(panel.querySelectorAll('.au-eslide'), function (e2, i) { e2.classList.toggle('on', i === WALL); });
  }
  function wallWire() {
    var all = showList(), vp = panel.querySelector('.au-wall'); if (EMB) { try { EMB.destroy(); } catch (e) { /* gone */ } EMB = null; } var k0 = $('#au-sigk0'); if (k0) k0.addEventListener('click', function () { openSig(null); }); if (!all.length || !vp) return;
    wallPress(); if (making()) redraw();
    var srcs = function () { return all.map(function (f) { if (!f.now) return f; var c = panel.querySelector('.au-eslide.now canvas'); return { src: c && c.width > 10 ? c.toDataURL('image/jpeg', 0.9) : '' }; }).filter(function (q) { return q.src; }); };
    [].forEach.call(vp.querySelectorAll('.au-eslide'), function (fg) { fg.addEventListener('click', function () { var n2 = +fg.dataset.n; if (n2 !== WALL && EMB) { EMB.scrollTo(n2); return; } show(srcs(), making() ? n2 : n2); }); });
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
        ps.ui.registerElement({ name: 'aux', order: 9, isButton: true, tagName: 'button', title: '', ariaLabel: 'Close', html: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.4 11.8 11.6M11.7 4.3 4.3 11.7"/></svg>', onClick: function () { unshow(); }, appendTo: 'root', onInit: function (el) {
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
  document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; if (DESK.el && !DESK.el.hidden) { deskClose(); return; } if (WIN && !WIN.hidden) { closeDev(); return; } if (SH.pswp) { unshow(); return; } strays(); if (S.deep) closeDeep(); });

  /* ───────── the catch: the one thing it holds. The ground, the life, the readings, El Niño, all in one place, with no words over
     them; whatever is touched is caught onto the piece, and only that ever shows ───────── */
  var MAPV = { z: 16, lat: 0, lng: 0, draw: null };
  function openDeep() {
    if (S.stage === 3) return; S.deep = true; deep.hidden = false; cls(); var p = piece(); think();
    deep.innerHTML = '<button class="au-back" id="au-dx" aria-label="Back"><i></i></button>' +
      '<div class="au-c">' + (CITIES.length ? '<nav class="au-cities">' + '<button data-city="-1" data-fw="here" aria-label="Where I am">' + svgI('pin') + '</button>' + CITIES.map(function (c, i) { return '<button data-city="' + i + '">' + esc(c.name) + '</button>'; }).join('') + '</nav>' : '') + '<nav class="au-devs">' + DEVS.map(function (d, i) { return devOpen(i) ? '<button data-dv="' + i + '" data-fw="' + d[1].toLowerCase() + '" aria-label="' + d[1] + '">' + svgI(d[3]) + '<i class="led"></i></button>' : ''; }).join('') + '</nav><div class="au-cmap' + (p.catch.map ? ' on' : '') + '" id="au-cmap"><div class="au-map" id="au-map"><div class="au-tiles"></div><canvas></canvas></div><button class="au-me" id="au-me" aria-label="Find where I am"><i></i></button><button class="au-mback" id="au-mback" aria-label="Back to the card" hidden>' + svgI('back') + '</button></div><p class="au-locno" id="au-locno"' + (S.locNo ? '' : ' hidden') + '>Location is off. Turn it on in Settings, Privacy, Location Services.</p>' + hint(SAY.map) +
      '<details class="au-near" id="au-near"><summary aria-label="What is near here">' + svgI('near') + '<i></i></summary><ul id="au-nearl"></ul></details>' + hint(SAY.near) +
      '<label class="au-find"><svg class="au-i" viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="13" r="8"/><path d="M19 19l8 8"/></svg><input id="au-q" type="search" autocomplete="off" aria-label="Find a life"></label>' + hint(SAY.find) + '<ul class="au-names" id="au-names"></ul><ul class="au-spots" id="au-spots"></ul>' +
        /* stage 5: a place suggested where the map is, waiting on the approval page until shown to everyone */
        '<details class="au-sugg" id="au-sugg"><summary aria-label="Suggest a place here" data-fw="suggest a place">' + svgI('plus') + '</summary><form id="au-sform">' +
        '<input name="n" maxlength="80" required aria-label="Its name" placeholder="name"><input name="what" maxlength="200" aria-label="What it does" placeholder="what it does">' +
        '<input name="url" type="url" maxlength="300" aria-label="Its own site" placeholder="https://"><button aria-label="Send for approval">' + svgI('ok') + '</button><span class="au-st" id="au-sst"></span></form></details>' +
      '<details class="au-near au-rd" id="au-rd" open><summary aria-label="The readings here">' + svgI('cur') + '<i></i></summary><ul class="au-vals" id="au-vals"></ul></details>' + hint(SAY.vals) + '<div class="au-now"><button class="au-nino" id="au-nino" aria-pressed="' + !!p.catch.nino + '"></button>' +
      '<button class="au-seab" id="au-seab" aria-expanded="false" aria-label="This month: what to watch for, near here">' + svgI('moon2') + '<b>' + esc(NG.when(Date.now()).replace(/^\d+\s*/, '').slice(0, 3)) + '</b></button><button class="au-seab" id="au-actb" aria-expanded="false" aria-label="What to do now">' + svgI('act') + '</button><button class="au-seab" id="au-ninob" aria-expanded="false" aria-label="More about El Niño">' + svgI('more') + '</button></div>' + hint(NINO_WHY, 'au-why') +
      '<div class="au-ninomore" id="au-ninom" hidden>' + NINO_MORE.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '<p class="au-src"><span>Bureau of Meteorology, climate driver update</span><span>NOAA, ENSO advisory</span></p></div>' +
      '<ul class="au-acts" id="au-acts" hidden>' + ACTS.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul><ul class="au-sea" id="au-sea" hidden></ul>' +
      '<nav class="au-kinds" id="au-kinds">' + KINDS.map(function (k) { return '<button data-k="' + k[0] + '" class="' + (SPW.kind === k[0] ? 'on' : '') + '" aria-label="' + k[0] + '"><svg class="au-i" viewBox="0 0 32 32" aria-hidden="true">' + KIND_I[k[0]] + '</svg></button>'; }).join('') + '</nav>' +
      '<div class="au-spw" id="au-spw"></div><i class="au-spend" id="au-spend"></i></div>';
    $('#au-dx').addEventListener('click', closeDeep);
    /* a city chosen: the map goes there and the piece with it, its places now near, found and sung; where I am brings it home */
    var sf = $('#au-sform'); if (sf) sf.addEventListener('submit', function (e) { e.preventDefault(); var p2 = piece(), at = MAPV.pin || { lat: p2.lat, lng: p2.lng }, st2 = $('#au-sst'), btn2 = sf.querySelector('button');
      var o = { n: sf.n.value.trim(), what: sf.what.value.trim(), url: sf.url.value.trim(), lat: at.lat, lng: at.lng, cat: 'service' }; if (!o.n) return; btn2.disabled = true; st2.innerHTML = NG.pips('sending');
      fetch('/api/places', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) }).then(function (r) { return r.json().then(function (j) { return [r, j]; }); })
        .then(function (rj) { btn2.disabled = false; if (rj[0].ok) { st2.innerHTML = NG.pips('waiting'); sf.reset(); bubbles(3); } else st2.innerHTML = NG.pips('failed', rj[0].status + ' ' + (rj[1].error || '')); })
        .catch(function () { btn2.disabled = false; st2.innerHTML = NG.pips('failed'); }); });
    [].forEach.call(deep.querySelectorAll('[data-city]'), function (b) { b.addEventListener('click', function () { var i = +b.dataset.city, c = CITIES[i], p = piece();
      if (c) { p.lat = c.lat; p.lng = c.lng; p.src = 'TAP'; } else if (S.me) { p.lat = S.me[0]; p.lng = S.me[1]; p.src = 'HERE'; } else { findMe(true); return; }
      MAPV.pin = null; MAPV.back = null; MAPV.lat = p.lat; MAPV.lng = p.lng; NEAR = null; think(); changed(); if (MAPV.draw) MAPV.draw(); fill(); var nr2 = $('#au-near'); if (nr2 && nr2.open) setTimeout(nearFill, 10);
      [].forEach.call(deep.querySelectorAll('[data-city]'), function (q) { q.classList.toggle('on', q === b); }); bell(3 + Math.max(0, i), 0.16); subSwell(); }); });
    [].forEach.call(deep.querySelectorAll('[data-dv]'), function (b) { b.addEventListener('click', function () { openDev(+b.dataset.dv); }); });
    lens(); NG.db().then(function () { think(); fill(); }); fill();
    $('#au-q').addEventListener('input', fill);
    $('#au-me').addEventListener('click', function () { findMe(true); });
    MAPV.pin = MAPV.back = null; $('#au-mback').addEventListener('click', mapBack);
    $('#au-seab').addEventListener('click', function () { var ul = $('#au-sea'), op = ul.hidden; ul.hidden = !op; this.setAttribute('aria-expanded', String(op)); this.classList.toggle('on', op); if (op) { seaFill(); nearFill(); } bell(op ? 5 : 1, 0.14); });
    $('#au-near').addEventListener('toggle', function () { if (this.open) nearFill(); bell(3, 0.14); });
    $('#au-ninob').addEventListener('click', function () { var m2 = $('#au-ninom'), op = m2.hidden; m2.hidden = !op; this.setAttribute('aria-expanded', String(op)); this.classList.toggle('on', op); subSwell(); });
    $('#au-actb').addEventListener('click', function () { var ul = $('#au-acts'), op = ul.hidden; ul.hidden = !op; this.setAttribute('aria-expanded', String(op)); this.classList.toggle('on', op); subSwell(); });
    [].forEach.call(deep.querySelectorAll('[data-k]'), function (b) { b.addEventListener('click', function () { SPW.kind = b.dataset.k; [].forEach.call(deep.querySelectorAll('[data-k]'), function (q) { q.classList.toggle('on', q === b); }); spWall(); subSwell(); }); });
    NG.db().then(function () { spWall(); });
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
    }, function (code) { var b3 = $('#au-me'); if (b3) { b3.classList.remove('wait'); b3.classList.add('no'); } var ln = $('#au-locno'); if (ln) ln.hidden = code !== 1; });
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
    sn.slice(0, 9).forEach(function (q) { var f = q.f; rows.push({ id: f.id, t: f.cn, e: f.event || '', d: '', near: q.d != null ? NG.far(Math.round(q.d)) : q.w }); });
    ul.innerHTML = rows.map(function (r, i) { var on = r.id ? P.catch.life === r.id : P.catch.data.indexOf(r.v) >= 0;
      return '<li><button data-se="' + i + '" class="' + (on ? 'on' : '') + (r.near ? ' near' : '') + '" aria-pressed="' + on + '"><span class="t">' + esc(r.t) + (r.e ? ' <i>' + esc(r.e) + '</i>' : '') + '</span>' + (r.near ? '<small>' + esc(r.near) + '</small>' : '') + (r.d ? '<em>' + esc(r.d) + '</em>' : '') + '</button></li>'; }).join('');
    [].forEach.call(ul.querySelectorAll('[data-se]'), function (b) { b.addEventListener('click', function () { var r = rows[+b.dataset.se], on;
      if (r.id) { on = P.catch.life !== r.id; P.catch.life = on ? r.id : ''; P.revealed = 0; think(); spFetch(P); }
      else { var k = P.catch.data.indexOf(r.v); on = k < 0; if (on) P.catch.data.push(r.v); else P.catch.data.splice(k, 1); P.dirty = true; }
      fill(); seaFill(); ping(on); }); });
  }
  /* ───────── under the map: every life the engine knows, as a wall of photographs that keeps coming as it is scrolled (and comes
     round again), narrowed by kind with a small sign each. A card turns over to its name and what to know; from there it can be caught.
     Each photograph is fetched only when its card comes into view ───────── */
  var KINDS = [['all', null], ['birds', /^(bird|parrot|waterbird|owl|raptor)$/], ['mammals', /^(macropod|possum|flyingfox|bat|rodent|fox|cat|dog|rabbit)$/],
    ['frogs', /^(frog|lizard|snake|turtle)$/], ['insects', /^(butterfly|moth|bee|wasp|fly|beetle|bug|grasshopper|mantis|dragonfly)$/], ['small', /^(spider|orb|aquatic|snail|segmented)$/]];
  var KIND_I = { all: '<circle cx="11" cy="11" r="3"/><circle cx="21" cy="11" r="3"/><circle cx="11" cy="21" r="3"/><circle cx="21" cy="21" r="3"/>',
    birds: '<path d="M4 18c5-1 8-5 11-9 1 4 3 6 7 7 2-3 4-4 6-4-2 2-3 5-6 7-5 3-12 2-18-1z"/>',
    mammals: '<circle cx="9" cy="12" r="2.5"/><circle cx="16" cy="9" r="2.5"/><circle cx="23" cy="12" r="2.5"/><path d="M10 22c0-4 3-7 6-7s6 3 6 7c0 3-3 3-6 3s-6 0-6-3z"/>',
    frogs: '<circle cx="11" cy="10" r="3"/><circle cx="21" cy="10" r="3"/><path d="M6 17c3 6 17 6 20 0M5 24l5-3M27 24l-5-3"/>',
    insects: '<path d="M16 9v16"/><path d="M16 13c-3-6-10-6-10 0s7 5 10 2c3 3 10 6 10-2s-7-6-10 0"/><path d="M14 6l2 3 2-3"/>',
    small: '<circle cx="16" cy="17" r="4"/><path d="M12 15l-6-5M12 18l-7 1M12 20l-5 6M20 15l6-5M20 18l7 1M20 20l5 6"/>' };
  var SPW = { kind: 'all', n: 0, io: null, seen: null, ph: {} };
  function spList() { var D = NG.DB(); if (!D) return []; var re = KINDS.filter(function (k) { return k[0] === SPW.kind; })[0][1]; return D.field.filter(function (f) { return !re || re.test(f.g || ''); }); }
  function spWall() {
    var w = $('#au-spw'); if (!w) return; SPW.n = 0; w.innerHTML = ''; if (SPW.io) SPW.io.disconnect(); if (SPW.seen) SPW.seen.disconnect();
    SPW.seen = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { SPW.seen.unobserve(e.target); spPhoto(e.target); } }); }, { root: deep, rootMargin: '200px' }) : null;
    var more = function () { var L = spList(); if (!L.length) return; var h = ''; for (var i = 0; i < 12; i++) { var f = L[SPW.n % L.length]; SPW.n++; h += spCard(f); } w.insertAdjacentHTML('beforeend', h);
      [].forEach.call(w.querySelectorAll('.au-card:not([data-w])'), function (c) { c.setAttribute('data-w', '1'); if (SPW.seen) SPW.seen.observe(c); else spPhoto(c); }); };
    more(); more();
    var end = $('#au-spend'); SPW.io = 'IntersectionObserver' in window && end ? new IntersectionObserver(function (es) { if (es[0].isIntersecting) more(); }, { root: deep, rootMargin: '400px' }) : null; if (SPW.io) SPW.io.observe(end);
    if (!w.__w) { w.__w = 1; w.addEventListener('click', function (e) { var c = e.target.closest('.au-card'); if (!c) return; var f = (NG.DB().field || []).filter(function (q) { return q.id === c.dataset.id; })[0]; if (!f) return;
      if (e.target.closest('.au-cpin')) { spWhere(f, c); return; }
      if (e.target.closest('.au-cadd')) { var on = P.catch.life !== f.id; P.catch.life = on ? f.id : ''; P.revealed = 0; think(); spFetch(P); fill(); ping(on); [].forEach.call(w.querySelectorAll('.au-card'), function (q) { q.classList.toggle('got', q.dataset.id === P.catch.life); }); bubbles(5); return; }
      c.classList.toggle('flip'); bubbles(3); try { if (navigator.vibrate) navigator.vibrate(5); } catch (er) { /* no touch */ } }); }
  }
  function spCard(f) { var got = P && P.catch.life === f.id;
    return '<div class="au-card' + (got ? ' got' : '') + '" data-id="' + esc(f.id) + '" role="button" tabindex="0" aria-label="' + esc(f.cn) + '"><div class="au-cin"><div class="au-cf"><img alt="" loading="lazy"></div>' +
      '<div class="au-cb"><b>' + esc(f.cn) + '</b><i>' + esc(f.n || '') + '</i><span>' + esc(f.event || f.where || '') + '</span><button class="au-cadd" aria-label="Add to my poster">' + svgI('plus') + '</button><button class="au-cpin" aria-label="Where it was seen near here, on the map">' + svgI('pin') + '</button></div></div></div>'; }
  /* where a life was last seen near here (iNaturalist, as placing a noticing reveals sightings): the map goes there and marks it; a key on the
     map takes one back to the card and the map back to where it was */
  function spWhere(f, card) {
    if (!B.inat || !P) return; var mp = $('#au-cmap'); if (!mp) return; card.classList.add('busy');
    fetch(B.inat + '/observations?taxon_name=' + encodeURIComponent(f.n) + '&lat=' + P.lat.toFixed(4) + '&lng=' + P.lng.toFixed(4) + '&radius=25&per_page=1&order=desc&order_by=observed_on&locale=en').then(function (r) { return r.json(); }).then(function (j) {
      card.classList.remove('busy'); var o = ((j && j.results) || [])[0], c = o && o.geojson && o.geojson.coordinates; if (!c) { card.classList.add('none'); setTimeout(function () { card.classList.remove('none'); }, 1600); bell(0, 0.1); return; }
      MAPV.back = MAPV.back || { lat: MAPV.lat, lng: MAPV.lng, z: MAPV.z, top: deep.scrollTop, id: f.id }; MAPV.back.id = f.id; MAPV.pin = { lat: +c[1], lng: +c[0] };
      MAPV.lat = MAPV.pin.lat; MAPV.lng = MAPV.pin.lng; MAPV.z = 15; if (MAPV.draw) MAPV.draw(); var bk = $('#au-mback'); if (bk) bk.hidden = false;
      deep.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' }); bell(4, 0.16); bubbles(3);
    }).catch(function () { card.classList.remove('busy'); });
  }
  /* every named spot the map and the search share: places and waters from the field data (with any city's places added), the cities
     themselves, and one's own noticings by their words or code */
  function spotsAll() {
    var D = NG.DB(), out = [];
    if (D) { (D.places || []).forEach(function (q) { out.push({ t: q[0], lat: q[1], lng: q[2], k: 'p' }); }); (D.waters || []).forEach(function (q) { out.push({ t: q[0], lat: q[1], lng: q[2], k: 'w' }); }); }
    CITIES.forEach(function (c) { out.push({ t: c.name, lat: c.lat, lng: c.lng, k: 'c' }); c.places.forEach(function (q) { out.push({ t: q[0], lat: q[1], lng: q[2], k: 'p' }); }); });
    (NG.notes() || []).forEach(function (n) { if (isFinite(n.lat) && (n.say || n.code)) out.push({ t: (n.say || n.code).slice(0, 48), lat: +n.lat, lng: +n.lng, k: 'n', code: n.code }); });
    return out;
  }
  function findSpots(q) { q = q.toLowerCase(); var seen = {}; return spotsAll().filter(function (o) { var t = String(o.t).toLowerCase(); if (seen[t] || (t.indexOf(q) < 0 && String(o.code || '').toLowerCase() !== q)) return false; seen[t] = 1; return true; }).sort(function (a, b) { return String(a.t).toLowerCase().indexOf(q) - String(b.t).toLowerCase().indexOf(q); }); }
  function mapGo(lat, lng) {
    MAPV.back = MAPV.back || { lat: MAPV.lat, lng: MAPV.lng, z: MAPV.z, top: deep.scrollTop, id: '' }; MAPV.pin = { lat: lat, lng: lng }; MAPV.lat = lat; MAPV.lng = lng; MAPV.z = Math.max(MAPV.z, 16);
    if (MAPV.draw) MAPV.draw(); var bk = $('#au-mback'); if (bk) bk.hidden = false; deep.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' }); bell(4, 0.14);
  }
  function mapBack() { var b2 = MAPV.back; if (!b2) return; MAPV.lat = b2.lat; MAPV.lng = b2.lng; MAPV.z = b2.z; MAPV.pin = null; MAPV.back = null; if (MAPV.draw) MAPV.draw(); var bk = $('#au-mback'); if (bk) bk.hidden = true;
    deep.scrollTo({ top: b2.top, behavior: still ? 'auto' : 'smooth' }); var cd = deep.querySelector('.au-card[data-id="' + b2.id + '"]'); if (cd) { cd.classList.add('flip', 'lit'); setTimeout(function () { cd.classList.remove('lit'); }, 1800); } bell(2, 0.14); }
  function spPhoto(c) {
    var id = c.dataset.id, im = c.querySelector('img'), done2 = function (u) { if (u && im) { im.src = u; im.onload = function () { c.classList.add('in'); }; } else c.classList.add('none'); };
    if (SPW.ph[id] !== undefined) { done2(SPW.ph[id]); return; }
    var f = (NG.DB().field || []).filter(function (q) { return q.id === id; })[0]; if (!f || !B.inat) { done2(null); return; }
    fetch(B.inat + '/observations?taxon_name=' + encodeURIComponent(f.n) + '&photos=true&quality_grade=research&per_page=1&order_by=votes&locale=en').then(function (r) { return r.json(); }).then(function (j) {
      var o = ((j && j.results) || []).filter(function (q) { return q.photos && q.photos.length; })[0], u = o ? '/api/img?u=' + encodeURIComponent(String(o.photos[0].url).replace('square', 'small')) : null; SPW.ph[id] = u; done2(u); }).catch(function () { SPW.ph[id] = null; done2(null); });
  }
  /* El Niño: what to do now, plainly (sources in docs/sources.md) */
  var ACTS = ['Put out a shallow dish of water with a stick or stones in it, so small animals can climb out.', 'On hot days, check on older neighbours and anyone living alone.',
    'Check the fire danger rating each day on the VicEmergency app, and know when you would leave.', 'Keep pets inside in the heat. Keep cats in at night.',
    'Turn off outside lights at night. They draw moths and bats off course.', 'Found an injured or heat-stressed animal? Call Wildlife Victoria: 03 8400 7300.',
    'Don’t touch flying-foxes on the ground. Call Wildlife Victoria.', 'In an emergency, call 000.'];
  /* the new parts sound from below: a few bubbles rising, or a low swell */
  function bubbles(n) { if (mute || !AC0()) return; var c = NG.ac(), t = c.currentTime; for (var i = 0; i < (n || 4); i++) { var o = c.createOscillator(), g = c.createGain(), t0 = t + i * 0.06 + Math.random() * 0.04, f0 = 260 + Math.random() * 380;
      o.type = 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f0 * 2.2, t0 + 0.09); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.035, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      o.connect(g); g.connect(NG.bus(c)); o.start(t0); o.stop(t0 + 0.14); } }
  function subSwell() { if (mute || !AC0()) return; var c = NG.ac(), t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(48, t); o.frequency.exponentialRampToValueAtTime(36, t + 1.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); o.connect(g); g.connect(NG.bus(c)); o.start(t); o.stop(t + 1.7); }
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
    var spots = q.length > 1 ? findSpots(q).slice(0, 6) : [], pl = $('#au-spots');
    if (pl) { pl.innerHTML = spots.map(function (o, i) { return '<li><button data-spot="' + i + '" aria-label="' + esc(o.t) + ', on the map">' + svgI('pin') + esc(o.t) + '</button></li>'; }).join('');
      [].forEach.call(pl.querySelectorAll('[data-spot]'), function (b) { b.addEventListener('click', function () { var o = spots[+b.dataset.spot]; mapGo(o.lat, o.lng, o.t); }); }); }
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
      MAPV.spots = []; spotsAll().forEach(function (o) { var s3 = at(o.lat, o.lng); if (s3[0] < -10 || s3[1] < -10 || s3[0] > W + 10 || s3[1] > H + 10) return; MAPV.spots.push([s3[0], s3[1], o]); g.globalAlpha = o.k === 'n' ? 0.7 : 0.45; g.lineWidth = 1; g.beginPath(); g.arc(s3[0], s3[1], o.k === 'n' ? 3.5 : 4.5, 0, 7); g.stroke(); });
      if (MAPV.pin) { var sp = at(MAPV.pin.lat, MAPV.pin.lng); g.globalAlpha = 1; g.lineWidth = 1.2; g.beginPath(); g.arc(sp[0], sp[1], 11, 0, 7); g.stroke(); g.beginPath(); g.arc(sp[0], sp[1], 4, 0, 7); g.fill(); g.setLineDash([1.5, 4]); g.beginPath(); g.arc(sp[0], sp[1], 18, 0, 7); g.stroke(); g.setLineDash([]); }
      g.globalAlpha = 1; g.lineWidth = 1.4; g.beginPath(); g.arc(s0[0], s0[1], 9, Math.PI, 0); g.closePath(); g.stroke();
      for (var i = 0; i < 4; i++) for (var j = 1; j < 5; j++) { g.beginPath(); g.arc(s0[0] - 6 + i * 4, s0[1] + j * 4, 1, 0, 7); g.fill(); }
    }
    MAPV.draw = draw; draw(); setTimeout(draw, 60);
    var drag = null, moved = 0;
    el.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY, wx(MAPV.lng, MAPV.z), wy(MAPV.lat, MAPV.z)]; moved = 0; try { el.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } });
    el.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag[0], dy = e.clientY - drag[1]; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); MAPV.lng = ux(drag[2] - dx, MAPV.z); MAPV.lat = uy(drag[3] - dy, MAPV.z); draw(); });
    el.addEventListener('pointerup', function (e) {
      var rr0 = el.getBoundingClientRect(), hit = drag && moved < 6 ? (MAPV.spots || []).filter(function (s3) { return Math.hypot(s3[0] - (e.clientX - rr0.left), s3[1] - (e.clientY - rr0.top)) < 12; })[0] : null;
      if (hit) { var qi = $('#au-q'); if (qi) { qi.value = hit[2].t; fill(); } MAPV.pin = { lat: hit[2].lat, lng: hit[2].lng }; draw(); ping(true); drag = null; return; }
      if (drag && moved < 6) { var r = el.getBoundingClientRect(), X = wx(MAPV.lng, MAPV.z) + (e.clientX - r.left - el.clientWidth / 2), Y = wy(MAPV.lat, MAPV.z) + (e.clientY - r.top - el.clientHeight / 2);
        p.lat = uy(Y, MAPV.z); p.lng = ux(X, MAPV.z); p.src = 'TAP'; p.catch.map = true; NEAR = null; think(); var nr2 = $('#au-near'); if (nr2 && nr2.open) setTimeout(nearFill, 10); if (p.note) { p.note.lat = +p.lat.toFixed(5); p.note.lng = +p.lng.toFixed(5); NG.saveNotes(); } draw(); fill(); ping(true); }
      drag = null; });
    el.addEventListener('wheel', function (e) { e.preventDefault(); MAPV.z = Math.max(12, Math.min(B.maxzoom || 19, MAPV.z + (e.deltaY < 0 ? 1 : -1))); draw(); }, { passive: false });
    el.addEventListener('dblclick', function (e) { e.preventDefault(); p.catch.map = !p.catch.map; fill(); ping(p.catch.map); });
  }

  /* ───────── asleep under the base's pages, awake on the paper ───────── */
  /* stage 5: the places shown from the approval page, found by search and ringed on the map like the site's own (kept for offline) */
  var placesSet = function (list) { var D = NG.DB(); if (!D || !D.places || !list) return; var have = {}; D.places.forEach(function (q) { have[q[0]] = 1; }); list.forEach(function (q) { if (q && q.n && !have[q.n] && isFinite(q.lat)) { D.places.push([q.n, +q.lat, +q.lng]); have[q.n] = 1; } }); };
  NG.db().then(function () { placesSet(store.get('da.aura.places', [])); });
  fetch('/api/places').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (!j || !j.places) return; store.set('da.aura.places', j.places); NG.db().then(function () { placesSet(j.places); }); }).catch(function () {});
  fetch('/api/settings', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (st) { if (!st) return; var o = null; try { o = st.words ? JSON.parse(st.words) : {}; } catch (e) { o = {}; }
    var gt = null; try { gt = st.gates ? JSON.parse(st.gates) : null; } catch (e) { gt = null; } GATES = gt && gt.mode ? gt : { mode: 'earn', at: GATE_AT }; store.set('da.aura.gates', GATES); applyGates();
    var so = null; try { so = st.start ? JSON.parse(st.start) : null; } catch (e) { so = null; } START = so || {}; store.set('da.aura.start', START); todoCheck();
    FX = FXM[st.fx] ? st.fx : 'base'; store.set('da.aura.fx', FX); PHREAK = !!st.phreak; store.set('da.aura.phreak', PHREAK); PH = null;
    store.set('da.aura.words', o); wordsSet(o); store.set('da.aura.cities', st.cities || ''); citiesSet(st.cities || ''); NG.db().then(function () { citiesSet(st.cities || ''); }); tabs.forEach(function (b, i) { if (i < 2) b.setAttribute('data-fw', wd(i ? 'wish.tab' : 'intention.tab')); }); if (S.mode === 'iruk' && !S.deep && S.stage < 2 && !panel.contains(document.activeElement)) paint(); }).catch(function () {});
  /* a count of a thing happening, for the approval page's overview: no one is told apart */
  var beat = function (k) { try { fetch('/api/beat?k=' + k, { keepalive: true }).catch(function () {}); } catch (e) { /* uncounted */ } };
  beat('open-aura');
  api.awake = function () { return !asleep; };
  api.sleep = function () { asleep = true; devLetGo(); root.hidden = true; humSet(false); };
  var awakeFor = function () { return !location.hash || /^#booth/i.test(location.hash); };
  api.wake = function () { if (!awakeFor()) return; asleep = false; root.hidden = false; humSet(S.mode !== 'seed'); go(); };
  api.state = function () { return { mode: S.mode, stage: S.stage, deep: S.deep, sel: S.sel || null, piece: P ? { say: P.say, lat: P.lat, lng: P.lng, photo: !!P.photo, eye: !!P.eye, art: P.art, lines: P.lines, code: P.note && P.note.code, sent: !!P.sent, caught: caught(P), pos: P.pos, adds: P.adds, cn: P.note ? P.note.cn : '', folioId: P.folioId || '', tf: P.tf, paper: P.paper, ptone: P.ptone, spPhoto: !!P.spPhoto } : null, boxes: lastBoxes, halo: S.halo || 0, slip: !!MINI.c, round: !!S.round, form: FORM.key, frames: S.frames || 0, me: S.me || null, folio: slides().length, zoom: SH.pswp && SH.pswp.currSlide ? SH.pswp.currSlide.currZoomLevel / SH.pswp.currSlide.zoomLevels.initial : 1, showing: !!SH.pswp, shows: [SH.n || 0, SH.d || 0], pix: { sub: PIX.sub, tone: PIX.tone }, print: S.lastPrint || null, hum: window.__auraHum || 0, layers: window.__auraLayers || 0, pf: !!PF, noise: !!N3 }; };
  /* the last receipt as it went to the printer, for a look at it */
  /* the receipt as it would print, drawn without sending it (for checking it against the poster) */
  api.pixSubs = ['jelly', 'coral', 'trash', 'st0', 'st1', 'st3'];
  api.pix = function (sub) { usePaper(true); var c = pixArt(sub, 24, 0, 'ink', null, 1), o = document.createElement('canvas'); o.width = c.width; o.height = c.height; var g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0); usePaper(false); return o; };
  api.receipt = function (w) { return P ? posterPrint(w || 512).then(function (c) { return c ? c.toDataURL('image/png') : null; }) : Promise.resolve(null); };
  /* a piece added, moved to a place on the poster (fractions of its width and height), for checking the print against the poster */
  api.move = function (i, x, y) { var a = P && P.adds[i]; if (!a) return false; a.x = x; a.y = y; delete a.band; changed(); redraw(); return true; };
  api.sheet = function () { return S.lastSheet ? S.lastSheet.toDataURL('image/png') : null; };
  api.go = function (m, s) { if (m === 'globe') { if (S.mode === 'seed') bang(); setMode('globe'); } if (m === 'iruk') { setMode('globe'); toIruk(s || 0); } };
  addEventListener('resize', function () { layout(); if (MAPV.draw && S.deep) MAPV.draw(); selBox(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) go(); });
  addEventListener('hashchange', function () { if (!awakeFor()) api.sleep(); });
  var SONG_IN = /^#song=/i.test(location.hash) ? decodeURIComponent(location.hash.slice(6)) : '', SONGS_IN = /^#songs=/i.test(location.hash) ? decodeURIComponent(location.hash.slice(7)).split('~').filter(songOf).slice(0, 24) : [];
  if (SONG_IN || SONGS_IN.length) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ } }
  layout(); setMode('seed'); paint();
  /* the piece one was making comes back with one */
  draftLoad().then(function (o) { if (o && !P && !o.sent) { P = unpack(o); think(); fillDots(); paint(); } });
  /* the code on every print: its maker fetched once, early, so the first poster already carries it */
  if (NG.qrLib) NG.qrLib().then(function () { if (P) { P._base = null; if (S.stage >= 2) redraw(); } });
  if (!awakeFor()) api.sleep(); else go();
  if (SONG_IN && songOf(SONG_IN)) { bang(); setTimeout(function () { deskOpen(songOf(SONG_IN)); }, 900); }
  if (SONGS_IN.length) { SONGS_IN.slice().reverse().forEach(function (code) { if (!DESK.kept.some(function (q) { return q.code === code; })) DESK.kept.unshift({ code: code, at: Date.now() }); }); DESK.kept.splice(24); store.set('da.aura.songs', DESK.kept);
    bang(); setTimeout(function () { deskOpen(songOf(SONGS_IN[0])); deskKept(); }, 900); }
  fontReady();
})();
