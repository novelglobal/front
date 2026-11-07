/* the home of cards (brief 1.1): one column of art cards, a card to a screen, with the Irukandji's banner over it (the reef under
   the banner when it is pressed) and the switchboard under it, where cards are wired together. Every experience opens from its
   card and comes back to it: the aura (I W.I.S.H.), the radio, an island's stack, the island kit, the control panel */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  if (!H.classList.contains('aura-on') || /[?&](aura|base)\b/.test(location.search)) return;
  H.classList.add('hm-on');
  var NG = window.NG || {}, AU = function () { return window.AURA || null; };
  var store = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private window */ } } };
  var RM = matchMedia('(prefers-reduced-motion: reduce)');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var INK = '#F4F1E8';

  var BLUE = '#17457F';

  /* ───────── the cards, as data: the same shape the engine's card takes (title, line, art, what it opens, its island) ───────── */
  /* each card is mostly black and white, a quarter blueprint blue (the one band that flows down through every card, each time in that
     card's own medium), and one small colour it owns: the strategy's dark green, the radio's lavender, the zine's tomato, the island's
     amber, the archipelagos' coral */
  var CARDS = [
    { id: 'wish', size: 'full', title: 'CIRCULAR STRATEGY', opens: 'aura', island: 'novelglobal', art: 'photos', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'radio', size: 'full', title: 'DIRECT ACTION RADIO', opens: 'radio', island: 'novelglobal', art: 'blocks', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'zine', size: 'full', title: 'ZINE MAKER', opens: 'stack:tall', island: 'pickles', art: 'dots', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'kit', size: 'full', title: 'ISLAND', line: 'BUILD A THERMAL SOLAR PRINTER', tag: 'ONE CLICK INSTALL', opens: 'kit', island: 'novelglobal', art: 'printer', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'space', size: 'full', title: 'ISLAND ARCHIPELAGOS', line: 'by novel.global', hub: 'https://github.com/novelglobal/island-engine', opens: 'panel', island: 'novelglobal', art: 'forms', motion: 'shadow', where: [-37.8136, 144.9631] }
  ];
  var SKINS = ['wish', 'radio', 'zine', 'kit', 'space'];
  var MOTION = store.get('da.hm.motion', null);   // null: each card's own; or 'shadow' / 'speed' for all
  var OWN = { wish: '#24402E', radio: '#B9B2F6', zine: '#FF5436', kit: '#FFB000', space: '#F59878' };
  var OWNPICS = { novelglobal: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '/cards/chair-' + n + '.jpg'; }), radio: ['/cards/radio.jpg'] };
  var CPICS = {};   // each card's own pictures, from /api/cards: { pics: [url], speed, shade }

  /* ───────── the art: three layers to a card (back, middle, front), painted to the card's size ───────── */
  var rnd = function (seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  /* grain and flaws: the paper's tooth, a few specks knocked out, a scratch or two */
  function grain(g, w, h, n, col, seed, rmax) { var r = rnd(seed || 5); g.fillStyle = col; for (var i = 0; i < n; i++) { g.globalAlpha = 0.25 + r() * 0.6; g.fillRect(r() * w, r() * h, 0.6 + r() * (rmax || 1.1), 0.6 + r() * (rmax || 1.1)); } g.globalAlpha = 1; }
  function flaws(g, w, h, seed, k) { var r = rnd(seed); g.save(); g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 260 * (k || 1); i++) { g.globalAlpha = 0.3 + r() * 0.7; g.beginPath(); g.arc(r() * w, r() * h, 0.4 + r() * r() * 2.6, 0, 7); g.fill(); }
    g.lineCap = 'round'; for (var s = 0; s < 6 * (k || 1); s++) { var x = r() * w, y = r() * h, a = r() * 7, L = 20 + r() * 120; g.globalAlpha = 0.25 + r() * 0.4; g.lineWidth = 0.4 + r() * 1.1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.3) * L * 0.5, y + Math.sin(a + 0.3) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    g.restore(); }
  /* the flowing band: where it comes in at the top of each card and leaves at the foot, so the column holds one band from end to end */
  var FLOW = [0.2, 0.78, 0.26, 0.72, 0.32, 0.7, 0.24, 0.8];
  function bandPts(w, h, i) { var a = FLOW[i % FLOW.length] * w, b = FLOW[(i + 1) % FLOW.length] * w, P = [[a, -0.06 * h], [a, 0.42 * h], [b, 0.58 * h], [b, 1.06 * h]], out = [];
    for (var k = 0; k <= 80; k++) { var u = k / 80, v = 1 - u, c = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u]; out.push([0, 1].map(function (j) { return c[0] * P[0][j] + c[1] * P[1][j] + c[2] * P[2][j] + c[3] * P[3][j]; })); }
    return out; }
  function trace(g, pts) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); }
  function band(g, w, h, i, how) {
    var pts = bandPts(w, h, i), bw = Math.min(w, h) * 0.17, r = rnd(60 + i);
    var nrm = function (k) { var a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [-dy / d, dx / d]; };
    g.save(); g.lineCap = 'butt'; g.lineJoin = 'round';
    if (how === 'dots') { g.fillStyle = BLUE; for (var k = 0; k < pts.length; k++) for (var q = -2; q <= 2; q++) { var n = nrm(k), off = q * bw * 0.2 + (r() - 0.5) * 3; if (k % 1 === 0) { g.beginPath(); g.arc(pts[k][0] + n[0] * off + (r() - 0.5) * 2, pts[k][1] + n[1] * off + (r() - 0.5) * 2, bw * (0.07 + r() * 0.04), 0, 7); g.fill(); } } }
    else if (how === 'blocks') { g.fillStyle = BLUE; for (var k2 = 0; k2 < pts.length; k2 += 3) { var p = pts[k2]; g.fillRect(Math.round(p[0] - bw * 0.62), Math.round(p[1] - bw * 0.3), Math.round(bw * 1.24), Math.round(bw * 0.62)); } }
    else if (how === 'tube') { [[1, '#0B2547'], [0.86, '#123A6B'], [0.62, BLUE], [0.36, '#3F72B5'], [0.12, '#B9D2F2']].forEach(function (s, j) { g.strokeStyle = s[1]; g.lineWidth = bw * s[0]; g.lineCap = 'round'; g.save(); g.translate(-j * bw * 0.04, -j * bw * 0.05); trace(g, pts); g.stroke(); g.restore(); }); g.restore(); return; }
    else { g.strokeStyle = BLUE; g.lineWidth = bw; trace(g, pts); g.stroke();
      if (how === 'tape') { g.fillStyle = BLUE; for (var e = 0; e < pts.length; e += 2) for (var sd = -1; sd <= 1; sd += 2) { var n2 = nrm(e); g.beginPath(); g.arc(pts[e][0] + n2[0] * bw * 0.5 * sd, pts[e][1] + n2[1] * bw * 0.5 * sd, 1 + r() * 3.2, 0, 7); g.fill(); } } }
    g.restore();
    /* its grain: lighter specks and a few darker, then the flaws knocked through */
    g.save(); g.globalCompositeOperation = 'source-atop'; grain(g, w, h, Math.round(w * h / 90), 'rgba(255,255,255,.22)', 70 + i, 1.4); grain(g, w, h, Math.round(w * h / 160), 'rgba(4,14,30,.35)', 80 + i, 1.6); g.restore();
    flaws(g, w, h, 90 + i, 0.6);
  }

  /* the forms of the reef and the archipelagos, rounded and lit: soft coral, a chrome flower, glass with beads in it, a ribbed disc, honey */
  function coral(g, x, y, s, col, seed, lite) {
    var r = rnd(seed), fingers = [];
    for (var k = 0; k < 9; k++) { var bx = x + (k - 4) * s * 0.12 + (r() - 0.5) * s * 0.06, L = s * (0.45 + r() * 0.5), a = -Math.PI / 2 + (k - 4) * 0.13 + (r() - 0.5) * 0.3, pts = [[bx, y]];
      for (var j = 1; j <= 8; j++) { a += (r() - 0.5) * 0.35; var lp = pts[j - 1]; pts.push([lp[0] + Math.cos(a) * L / 8, lp[1] + Math.sin(a) * L / 8]); } fingers.push(pts); }
    var t = s * 0.11; g.lineCap = 'round'; g.lineJoin = 'round';
    fingers.forEach(function (pts) { g.strokeStyle = shade(col, -0.32); g.lineWidth = t * 1.06; g.save(); g.translate(t * 0.14, t * 0.18); trace(g, pts); g.stroke(); g.restore(); });
    fingers.forEach(function (pts) { g.strokeStyle = col; g.lineWidth = t; trace(g, pts); g.stroke(); g.strokeStyle = shade(col, 0.28); g.lineWidth = t * 0.42; g.save(); g.translate(-t * 0.16, -t * 0.12); trace(g, pts); g.stroke(); g.restore(); });
    /* the fur: short hairs out from every finger, light at the tips */
    g.lineWidth = 0.7; fingers.forEach(function (pts) { for (var j = 1; j < pts.length; j++) for (var q = 0; q < 14; q++) { var u = r(), px = pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, py = pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u, an = r() * 7, rr = t * 0.5;
      g.strokeStyle = r() < 0.5 ? shade(col, 0.4) : shade(col, lite ? 0.1 : -0.1); g.globalAlpha = 0.55; g.beginPath(); g.moveTo(px + Math.cos(an) * rr * 0.7, py + Math.sin(an) * rr * 0.7); g.lineTo(px + Math.cos(an) * (rr + t * 0.22), py + Math.sin(an) * (rr + t * 0.22)); g.stroke(); } }); g.globalAlpha = 1;
  }
  function chrome(g, x, y, R, rot) {
    [1, 0.72, 0.46].forEach(function (k, lv) { var n = [26, 20, 14][lv], rr = R * k;
      for (var i = 0; i < n; i++) { var a0 = rot + lv * 0.4 + i / n * Math.PI * 2, a1 = a0 + Math.PI * 2 / n, v = (Math.sin(a0 * 3 + lv) + 1) / 2;
        g.fillStyle = ['#1C1C1E', '#F4F4F2', '#7A7A7E', '#FFFFFF', '#3A3A3E'][(i + lv) % 5]; g.globalAlpha = 0.75 + v * 0.25;
        g.beginPath(); g.moveTo(x, y); g.arc(x, y, rr, a0, a1); g.closePath(); g.fill();
        g.beginPath(); g.arc(x + Math.cos((a0 + a1) / 2) * rr, y + Math.sin((a0 + a1) / 2) * rr * 0.98, rr * Math.PI / n * 0.9, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, rr * 0.98, rot, rot + 2); g.stroke(); });
  }
  function glass(g, x, y, R, bead, seed) {
    var r = rnd(seed || 11);
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + r(), d = R * (i ? 0.55 : 0), bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d * 0.8, br = R * (0.42 + r() * 0.16);
      g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.1; g.stroke();
      g.strokeStyle = 'rgba(10,20,40,.22)'; g.lineWidth = 2; g.beginPath(); g.arc(bx + br * 0.06, by + br * 0.08, br * 0.9, 0.3, 2.6); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(bx - br * 0.38, by - br * 0.42, br * 0.16, br * 0.07, -0.7, 0, 7); g.fill(); }
    if (bead) for (var b = 0; b < 26; b++) { var ba = r() * 7, bd = r() * R * 0.7, bb = 1 + r() * R * 0.07; g.fillStyle = r() < 0.7 ? bead : '#FFF6D0'; g.beginPath(); g.arc(x + Math.cos(ba) * bd, y + Math.sin(ba) * bd * 0.8, bb, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x + Math.cos(ba) * bd - bb * 0.3, y + Math.sin(ba) * bd * 0.8 - bb * 0.3, bb * 0.3, 0, 7); g.fill(); }
  }
  function disc(g, x, y, R, col) {
    for (var i = 0; i < 28; i++) { var a0 = i / 28 * Math.PI * 2, a1 = a0 + Math.PI * 2 / 28; g.fillStyle = i % 2 ? col : shade(col, 0.22); g.beginPath(); g.moveTo(x, y); g.arc(x, y, R * (0.94 + (i % 2) * 0.06), a0, a1); g.closePath(); g.fill(); }
    g.fillStyle = shade(col, -0.35); g.beginPath(); g.arc(x, y, R * 0.05, 0, 7); g.fill();
  }
  function honey(g, x, y, R, seed) {
    var r = rnd(seed || 21); g.fillStyle = 'rgba(244,196,92,.78)'; g.beginPath(); for (var i = 0; i <= 14; i++) { var a = i / 14 * Math.PI * 2, rr = R * (0.85 + r() * 0.25); g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,200,.5)'; for (var b = 0; b < 7; b++) { g.beginPath(); g.arc(x + (r() - 0.5) * R, y + (r() - 0.6) * R * 0.7, R * (0.08 + r() * 0.1), 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.4; g.beginPath(); g.arc(x - R * 0.2, y - R * 0.25, R * 0.5, 3.6, 4.6); g.stroke();
  }
  function shade(hex, k) { var n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { return Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)); }); return 'rgb(' + c.join(',') + ')'; }
  /* black type set as dots, the way a dot-matrix poster sets it: the letters drawn once, then read back as blobs along their strokes */
  function dotText(g, text, x, y, size, col, seed) {
    var c = D.createElement('canvas'), cg = c.getContext('2d'); cg.font = '600 ' + size + 'px "Archivo Narrow", Arial, sans-serif'; var tw = Math.ceil(cg.measureText(text).width) + 8;
    c.width = tw; c.height = Math.ceil(size * 1.2); cg.font = '600 ' + size + 'px "Archivo Narrow", Arial, sans-serif'; cg.textBaseline = 'top'; cg.fillText(text, 4, size * 0.08);
    var d = cg.getImageData(0, 0, c.width, c.height).data, st = Math.max(3, Math.round(size / 13)), r = rnd(seed || 3); g.fillStyle = col;
    for (var yy = 0; yy < c.height; yy += st) for (var xx = 0; xx < c.width; xx += st) if (d[(yy * c.width + xx) * 4 + 3] > 140) { g.beginPath(); g.arc(x + xx + (r() - 0.5) * st * 0.5, y + yy + (r() - 0.5) * st * 0.5, st * (0.55 + r() * 0.35), 0, 7); g.fill(); }
    return tw;
  }
  var ART = {
    /* CIRCULAR STRATEGY: photographs above, turning; under them a dark patchy green with nothing on it; the band across both */
    photos: function (L, w, h, i) { var g = L.b, seam = h * 0.56;
      g.fillStyle = '#16271C'; g.fillRect(0, seam, w, h - seam); var r = rnd(14);
      for (var k = 0; k < 90; k++) { var px = r() * w, py = seam + r() * (h - seam), pr = 20 + r() * Math.min(w, h) * 0.22; g.fillStyle = ['#24402E', '#1C3324', '#2D4C36', '#122016'][k % 4]; g.globalAlpha = 0.18 + r() * 0.3; g.beginPath(); g.ellipse(px, py, pr, pr * (0.5 + r() * 0.5), r() * 3, 0, 7); g.fill(); }
      g.globalAlpha = 1; grain(g, w, h, Math.round(w * h / 60), 'rgba(255,255,255,.08)', 15); flaws(g, w, h, 16, 0.4);
      g.clearRect(0, 0, w, seam); band(L.m, w, h, i, 'solid'); L.m.clearRect(0, 0, w, seam); },
    /* DIRECT ACTION RADIO: grey paper (or the picture set behind it), the band as stepped blocks; the words are blocks of their own */
    blocks: function (L, w, h, i) { var g = L.b; g.fillStyle = '#D9D8D4'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 40), 'rgba(0,0,0,.12)', 31); band(L.m, w, h, i, 'blocks'); },
    /* ZINE MAKER: white paper, black dots: the words, a ridge and a sun, all in blobs; the band in blue dots */
    dots: function (L, w, h, i) { var g = L.b; g.fillStyle = '#F7F6F2'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 70), 'rgba(0,0,0,.08)', 41);
      band(L.m, w, h, i, 'dots'); var t = L.t, s = Math.min(w * 0.2, h * 0.16), r = rnd(43), ox = w * 0.06, oy = h * 0.14;
      dotText(t, 'ZINE', ox, oy, s, '#0A0A0A', 44); dotText(t, 'MAKER', ox, oy + s * 0.98, s, '#0A0A0A', 45);
      /* the ridge of a landscape strip, in lines of dots, and the sun, the zine's own tomato */
      for (var ln = 0; ln < 3; ln++) for (var x = 0; x < w; x += 7) { var y = h * (0.7 + ln * 0.06) - Math.abs(Math.sin(x / w * 5 + ln)) * h * 0.08 - (x > w * 0.4 && x < w * 0.7 ? (1 - Math.abs(x / w - 0.55) / 0.15) * h * 0.1 : 0); t.fillStyle = '#0A0A0A'; t.beginPath(); t.arc(x + (r() - 0.5) * 2, y + (r() - 0.5) * 2, 2 + r() * 1.6 - ln * 0.4, 0, 7); t.fill(); }
      var sx = w * 0.78, sy = h * 0.52, sr = Math.min(w, h) * 0.08; t.fillStyle = OWN.zine; for (var q = 0; q < 70; q++) { var a = r() * 7, d = Math.sqrt(r()) * sr; t.beginPath(); t.arc(sx + Math.cos(a) * d, sy + Math.sin(a) * d, 2.2 + r() * 2, 0, 7); t.fill(); }
      for (var ry = 0; ry < 12; ry++) { var ra = ry / 12 * Math.PI * 2; for (var rd = sr * 1.3; rd < sr * 2.1; rd += 6) { t.beginPath(); t.arc(sx + Math.cos(ra) * rd, sy + Math.sin(ra) * rd, 1.8, 0, 7); t.fill(); } } },
    /* ISLAND: the printer on pale paper, the band as torn tape behind it */
    printer: function (L, w, h, i) { var g = L.b; g.fillStyle = '#EEEDEA'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 50), 'rgba(0,0,0,.1)', 51); band(L.m, w, h, i, 'tape'); },
    /* ISLAND ARCHIPELAGOS: rounded forms on soft grey, all in greys but the coral, which is its own; the band a glossy tube */
    forms: function (L, w, h, i) { var g = L.b; g.fillStyle = '#E2E0DD'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 70), 'rgba(0,0,0,.07)', 61);
      band(L.m, w, h, i, 'tube'); var t = L.t, s = Math.min(w, h);
      coral(t, w * 0.62, h * 0.6, s * 0.5, OWN.space, 62, true); chrome(t, w * 0.3, h * 0.72, s * 0.17, 0.4); glass(t, w * 0.7, h * 0.78, s * 0.12, null, 63); },
    plain: function (L, w, h, i) { var g = L.b; g.fillStyle = '#ECEBE7'; g.fillRect(0, 0, w, h); grain(g, w, h, Math.round(w * h / 60), 'rgba(0,0,0,.08)', 71); band(L.m, w, h, i, 'solid'); }
  };
  ART.isles = ART.plain;

  /* ───────── the page ───────── */
  var SNORKEL = '<svg viewBox="0 0 24 24"><path d="M3 10.5c0-1.4 1.1-2.5 2.5-2.5h7c1.4 0 2.5 1.1 2.5 2.5v1c0 1.4-1.1 2.5-2.5 2.5H11l-1.5-1.6L8 14H5.5C4.1 14 3 12.9 3 11.5z"/><path d="M18.5 3v11.5a4.5 4.5 0 0 1-4.5 4.5h-3"/></svg>';
  var root = D.createElement('div'); root.id = 'hm';
  root.innerHTML = '<header id="hm-top" aria-label="The sea" aria-expanded="false"><canvas aria-hidden="true"></canvas><nav>' +
    '<button id="hm-snork" aria-label="Back up to the surface" hidden>' + SNORKEL + '</button>' +
    '<button id="hm-theme" aria-label="Light or dark"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" class="f"/></svg></button></nav></header>' +
    '<main id="hm-col">' + CARDS.map(cardHTML).join('') + '</main><nav class="hm-dots" aria-hidden="true">' + CARDS.map(function () { return '<i></i>'; }).join('') + '</nav>' +
    '<section id="hm-x" role="dialog" aria-modal="true" aria-label=""><header><button class="hm-back" aria-label="Back">‹</button><b></b></header><div class="hm-body"></div></section>' +
    '<section id="hm-sb" aria-label="Switchboard"><button class="grab" aria-label="The switchboard, larger or smaller"></button><span class="cb" aria-hidden="true"></span><button class="rs">RESET</button><div class="jk"></div></section>';
  D.body.appendChild(root);
  var col = $('#hm-col'), xv = $('#hm-x'), cards = $$('.hm-card', col);
  /* the cards as novel.global writes them on the approval page (CARDS): # a card, then its lines; the order they are written in */
  var OPENS = /^(aura|radio|kit|panel|stack:[a-z0-9-]{1,24})$/, KEYS = ['title', 'line', 'tag', 'island', 'opens', 'where', 'motion', 'art', 'size'];
  function applyCards(text) {
    if (text) { var order = [], hide = {};
      String(text).split(/\n(?=\s*#)/).forEach(function (blk) { var ls = blk.split('\n'), m = /^\s*#\s*([a-z0-9-]{1,24})\s*$/i.exec(ls[0] || ''); if (!m) return; var id = m[1].toLowerCase(), c = byId(id);
        if (!c) { c = { id: id, size: 'full', title: id.toUpperCase(), opens: 'panel', island: 'novelglobal', art: 'plain', motion: 'shadow', where: [-37.8136, 144.9631] }; CARDS.push(c); } order.push(id);
        ls.slice(1).forEach(function (l) { var kv = /^\s*([a-z]+)\s*(?::\s*(.*))?$/i.exec(l); if (!kv) return; var k = kv[1].toLowerCase(), v = (kv[2] || '').trim().slice(0, 120);
          if (k === 'hide') hide[id] = 1; else if (k === 'where') { var ll = v.split(',').map(Number); if (ll.length === 2 && ll.every(isFinite)) c.where = ll; }
          else if (k === 'opens') { if (OPENS.test(v)) c.opens = v; } else if (k === 'motion') { if (/^(shadow|speed)$/.test(v)) c.motion = v; } else if (k === 'art') { if (ART[v]) c.art = v; } else if (k === 'size') { if (/^(full|half)$/.test(v)) c.size = v; }
          else if (k === 'hub') { if (/^https:\/\/[^\s"<>]+$/.test(v)) c.hub = v; } else if (k === 'skin') { if (SKINS.indexOf(v) >= 0) c.skin = v; } else if (k === 'island') c.island = v.toLowerCase().replace(/[^a-z0-9-]/g, ''); else if (KEYS.indexOf(k) >= 0) c[k] = v; }); });
      CARDS.sort(function (a, b) { var i = order.indexOf(a.id), j = order.indexOf(b.id); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
      for (var i = CARDS.length - 1; i >= 0; i--) if (hide[CARDS[i].id]) CARDS.splice(i, 1); }
    col.innerHTML = CARDS.map(cardHTML).join(''); cards = $$('.hm-card', col); $('.hm-dots').innerHTML = CARDS.map(function () { return '<i></i>'; }).join(''); paintAll(); pics(); radars(); lamps(); parallax();
  }
  var CARDS_TXT = null;
  fetch('/api/settings').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { CARDS_TXT = j.cards || ''; if (CARDS_TXT) applyCards(CARDS_TXT); }).catch(function () { /* the cards as they started */ });

  function cardHTML(c, i) {
    var mo = MOTION || c.motion || 'shadow', sk = c.skin || (SKINS.indexOf(c.id) >= 0 ? c.id : c.isle ? 'isle' : 'plain');
    var keys = '<button class="hm-rk" data-radar="' + c.id + '" hidden aria-label="Find its printer"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></svg></button>' +
      (c.hub ? '<a class="hm-rk" href="' + esc(c.hub) + '" target="_blank" rel="noopener" aria-label="The building hub"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></a>' : '');
    var t = esc(c.title), inner;
    if (sk === 'radio') { var ks = [1, 0.78, 0.6, 0.47, 0.37, 0.29, 0.23, 0.18, 0.14, 0.11];
      inner = '<h2 class="hm-t kas">' + t.split(' ').map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</h2><div class="kas" aria-hidden="true">' + ks.slice(1).map(function (k, j) { return '<span style="--fk:' + k + '"' + (j === 2 ? ' class="own"' : '') + '>' + t + '</span>'; }).join('') + '</div><span class="hm-lamps"></span>'; }
    else if (sk === 'zine') inner = '<h2 class="hm-t vh">' + t + '</h2><span class="hm-lamps"></span><button class="hm-strip" data-strip hidden>TALL ↗</button>';
    else if (sk === 'kit') inner = '<h2 class="hm-t">' + t + '</h2>' + (c.line ? '<p class="hm-line">' + esc(c.line) + '</p>' : '') + '<span class="hm-sp"></span>' + (c.tag ? '<p class="hm-tag"><i></i>' + esc(c.tag) + '</p>' : '') + '<span class="hm-lamps"></span>';
    else if (sk === 'space') inner = '<h2 class="hm-t">' + t + '</h2>' + (c.line ? '<p class="hm-by">' + esc(c.line) + '</p>' : '') + '<span class="hm-sp"></span><span class="hm-lamps"></span>';
    else if (sk === 'wish') inner = '<span class="hm-sp"></span><h2 class="hm-t">' + t + '</h2><span class="hm-lamps"></span>';
    else inner = '<h2 class="hm-t">' + t + '</h2>' + (c.line ? '<p class="hm-line">' + esc(c.line) + '</p>' : '') + '<span class="hm-sp"></span><span class="hm-lamps"></span>';
    var extra = sk === 'wish' || c.art === 'photos' ? '<div class="hm-pics"></div>' : sk === 'radio' ? '<div class="hm-bgimg"></div>' : '';
    var front = sk === 'kit' ? '<div class="hm-prn" aria-hidden="true"><div class="ph"></div><i class="paper"></i><i class="led"></i></div>' : '';
    return '<article class="hm-card ' + (c.size || 'full') + ' ' + mo + ' sk-' + sk + '" data-id="' + c.id + '" data-i="' + i + '" aria-label="' + t + '">' +
      '<div class="hm-art"><div class="hm-l b">' + extra + '<canvas></canvas></div><div class="hm-l m"><canvas></canvas></div><div class="hm-l t"><canvas></canvas>' + front + '</div></div>' +
      '<button class="hm-open" data-open="' + c.id + '" aria-label="Open ' + t + '"></button>' +
      '<div class="hm-keys">' + keys + '</div><div class="hm-in">' + inner + '</div><div class="hm-bcn" hidden></div></article>';
  }
  /* each card painted to its own size; again when the size changes */
  function paint(el) {
    var c = byId(el.dataset.id); if (!c) return; var i = +el.dataset.i, L = {}, w = 0, h = 0, k = Math.min(1.5, devicePixelRatio || 1);
    ['b', 'm', 't'].forEach(function (n) { var cv = el.querySelector('.hm-l.' + n + ' > canvas'), lw = cv.parentNode.clientWidth, lh = cv.parentNode.clientHeight; w = lw; h = lh;
      cv.width = Math.round(lw * k); cv.height = Math.round(lh * k); var g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); L[n] = g; });
    if (!w || !h) return; el.dataset.pw = w + 'x' + h; (ART[c.art] || ART.plain)(L, w, h, i);
  }
  function paintAll(force) { cards.forEach(function (el) { var l = el.querySelector('.hm-l.b'); if (force || el.dataset.pw !== l.clientWidth + 'x' + l.clientHeight) paint(el); }); }
  var FONTS = D.fonts && D.fonts.ready ? D.fonts.ready : Promise.resolve(); FONTS.then(function () { paintAll(true); });
  var pT = 0; addEventListener('resize', function () { clearTimeout(pT); pT = setTimeout(paintAll, 180); });

  /* ───────── each card's own pictures: the strategy's photographs turning, the picture behind the radio ───────── */
  var TURN = [];
  function pics() {
    TURN.forEach(clearInterval); TURN = [];
    cards.forEach(function (el) { var id = el.dataset.id, cp = CPICS[id] || {}, own = OWNPICS[id === 'wish' ? 'novelglobal' : id];
      if (own && !(cp.pics && cp.pics.length)) cp = { pics: own, speed: cp.speed, shade: cp.shade };
      var box = el.querySelector('.hm-pics'), bg = el.querySelector('.hm-bgimg');
      if (box) { var ls = (cp.pics || []).slice(0, 10); box.innerHTML = ls.map(function (u, j) { return '<img alt="" decoding="async" fetchpriority="' + (j ? 'low' : 'high') + '" src="' + esc(u) + '"' + (j === 0 ? ' class="on"' : '') + '>'; }).join(''); box.classList.toggle('none', !ls.length);
        /* every photograph is fetched and decoded before it is shown, and one not yet ready is passed over, so each change is instant */
        if (ls.length > 1 && !RM.matches) { (function (box, ms) { var at = 0, ims = $$('img', box), ok = ims.map(function () { return false; });
          ims.forEach(function (im, j) { (im.decode ? im.decode() : Promise.resolve()).then(function () { ok[j] = true; }, function () {}); });
          TURN.push(setInterval(function () { if (D.hidden || away) return; var n = at; do { n = (n + 1) % ims.length; } while (!ok[n] && n !== at); if (n === at) return; ims[at].classList.remove('on'); at = n; ims[at].classList.add('on'); }, ms)); })(box, Math.max(1, cp.speed || 2) * 1000); } }
      if (bg) { var u = (cp.pics || [])[0]; bg.style.backgroundImage = u ? 'url("' + u.replace(/"/g, '') + '")' : ''; bg.style.opacity = u ? String(cp.shade == null ? 0.35 : cp.shade) : '0'; } });
  }
  /* an island whose keeper has given it pictures, with CARDS switched on, stands in the column too */
  function isleCards() { var add = false;
    PRN.forEach(function (p) { if (!p.links || p.links.indexOf('cards') < 0 || p.id === 'novelglobal' || byId(p.id) || !(CPICS[p.id] && CPICS[p.id].pics.length)) return;
      CARDS.push({ id: p.id, size: 'full', title: String(p.name || p.id).toUpperCase().slice(0, 40), opens: 'panel', island: p.id, art: 'photos', isle: 1, motion: 'shadow', where: [-37.8136, 144.9631] }); add = true; });
    if (add) applyCards(''); }
  fetch('/api/cards').then(function (r) { return r.ok ? r.json() : { cards: {} }; }).then(function (j) { CPICS = j.cards || {}; pics(); partners().then(isleCards); }).catch(function () { /* none yet */ });

  var byId = function (id) { return CARDS.filter(function (c) { return c.id === id; })[0]; };

  /* ───────── motion: the three layers move at three speeds as the column scrolls, inside the card's own art ───────── */
  /* three layers to every card: the picture stays put; the words drift down a little as the card goes by; the top layer (band, dots, forms) runs fastest. On ISLAND the printer is the picture, so its layer stays put too */
  var DEPTH = { shadow: [0, 0.1, 0.18], speed: [0, 0.18, 0.32] }, WORDS = 0.035, tick = 0;
  function parallax() {
    tick = 0; var vh = innerHeight;
    cards.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom < -40 || r.top > vh + 40) return;
      var p = Math.max(-1.2, Math.min(1.2, (r.top + r.height / 2 - vh / 2) / vh)), d = DEPTH[el.classList.contains('speed') ? 'speed' : 'shadow'], ls = el.querySelectorAll('.hm-l');
      var still = !!el.querySelector('.hm-prn'), inn = el.querySelector('.hm-in');
      for (var i = 0; i < ls.length; i++) ls[i].style.transform = RM.matches || (still && i === 2) ? '' : 'translate3d(0,' + (p * d[i] * r.height).toFixed(1) + 'px,0)';
      if (inn) inn.style.transform = RM.matches ? '' : 'translate3d(0,' + (-p * WORDS * r.height).toFixed(1) + 'px,0)'; });
    var at = Math.round(col.scrollTop / Math.max(1, cards[0].offsetHeight)), n = 0, best = 1e9; cards.forEach(function (el, i) { var dd = Math.abs(el.getBoundingClientRect().top - col.getBoundingClientRect().top); if (dd < best) { best = dd; n = i; } });
    $$('.hm-dots i').forEach(function (d, i) { d.classList.toggle('on', i === (at >= 0 ? n : 0)); });
  }
  col.addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(parallax); }, { passive: true });
  addEventListener('resize', function () { if (!tick) tick = requestAnimationFrame(parallax); });
  /* a key turns the page, as a swipe does */
  addEventListener('keydown', function (e) { if (H.classList.contains('hm-away') || xv.classList.contains('on') || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    var d = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key]; if (!d) { if (e.key === 'Escape' && root.classList.contains('reef')) reef(false); return; } e.preventDefault();
    var tops = cards.map(function (el) { return el.offsetTop; }), y = col.scrollTop + 12, i = 0; while (i < tops.length - 1 && tops[i + 1] <= y) i++;
    var to = cards[Math.max(0, Math.min(cards.length - 1, i + d))]; col.scrollTo({ top: to.offsetTop - parseFloat(getComputedStyle(col).scrollPaddingTop || 0), behavior: RM.matches ? 'auto' : 'smooth' }); });

  /* ───────── away and back: every experience leaves from its card and returns to it ───────── */
  var away = false;
  function goAway(then) {
    away = true; H.classList.add('hm-away'); history.pushState({ hm: 'away' }, ''); var a = AU();
    if (a && a.wake) { a.wake(); } if (then) setTimeout(then, 60);
  }
  function home() {
    if (xv.classList.contains('on')) shut(true); if (!away) return; away = false; H.classList.remove('hm-away'); var a = AU(); if (a && a.sleep) a.sleep(); lamps(); parallax();
  }
  addEventListener('popstate', function () { if (xv.classList.contains('on')) shut(true); else if (away) home(); });
  setTimeout(function () { var a = AU(); if (location.hash && a && a.wake) { away = true; H.classList.add('hm-away'); } else if (a && a.sleep) a.sleep(); }, 0);

  function open(id, opt) {
    var c = byId(id); if (!c) return; beep(660, 0.06);
    if (c.opens === 'aura') return goAway(function () { var a = AU(); if (a && a.go) a.go('iruk', 0); });
    if (c.opens === 'radio') return goAway(function () { var a = AU(); if (a && a.dev) a.dev(0); });
    if (/^stack:/.test(c.opens)) return sheet(c.title, function (b) { stackIn(b, c.opens.slice(6), opt); });
    if (c.opens === 'kit') return sheet(c.title, kitIn);
    if (c.opens === 'panel') return sheet(c.title, panelIn);
  }
  /* the sheet: an experience in the column's own place, the back key to the card it came from */
  function sheet(title, fill) {
    xv.querySelector('header b').textContent = title; xv.setAttribute('aria-label', title); var body = xv.querySelector('.hm-body');
    [].slice.call(xv.children).forEach(function (n) { if (n.tagName === 'IFRAME') n.remove(); }); body.hidden = false; body.innerHTML = '';
    fill(body); xv.classList.add('on'); history.pushState({ hm: 'x' }, ''); setTimeout(function () { xv.querySelector('.hm-back').focus(); }, 50);
  }
  function shut(fromPop) { xv.classList.remove('on'); setTimeout(function () { [].slice.call(xv.children).forEach(function (n) { if (n.tagName === 'IFRAME') n.remove(); }); }, 460); if (!fromPop) history.back(); }
  xv.querySelector('.hm-back').addEventListener('click', function () { shut(false); beep(330, 0.05); });
  root.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); open(o.dataset.open); return; }
    var r = e.target.closest('[data-radar]'); if (r) { beacon(r.dataset.radar, r); return; }
    if (e.target.closest('[data-strip]')) { open('zine', { fill: 1 }); }
  });

  /* an island's experience (a stack) played in the sheet; wired to W.I.S.H., it starts from W.I.S.H.'s photograph and intention */
  function stackIn(body, id, opt) {
    body.hidden = true; var fr = D.createElement('iframe'); fr.title = id; fr.src = 'x.html?in=1#' + id.replace(/[^a-z0-9-]/g, ''); xv.appendChild(fr);
    if (opt && opt.fill || wired('wish', 'zine')) fr.addEventListener('load', function () { var a = AU(), p = a && a.piece ? a.piece() : null; if (p && (p.photo || p.say)) fr.contentWindow.postMessage({ hm: 'fill', img: p.photo || '', words: (p.say || '').toUpperCase().slice(0, 22) }, location.origin); });
  }
  /* the island kit: the checklist, kept with the aura's, and printed as a slip */
  function kitIn(body) {
    var a = AU(), list = (a && a.isle ? a.isle() : []) || [], got = store.get('da.isle.v1', []) || [];
    body.innerHTML = '<div class="hm-row"><a class="hm-btn big" href="https://github.com/novelglobal/island-kit" target="_blank" rel="noopener">ONE CLICK INSTALL ↗</a></div><ol class="hm-list">' + list.map(function (s) { if (!s) return '<li class="gap" aria-hidden="true"></li>';
      return '<li role="checkbox" tabindex="0" data-k="' + s[0] + '" aria-checked="' + (got.indexOf(s[0]) >= 0) + '"><i></i><span>' + (s[2] ? '<a href="' + s[2] + '" rel="noopener" target="_blank">' + esc(s[1]) + ' ↗</a>' : esc(s[1])) + '</span></li>'; }).join('') + '</ol>' +
      '<div class="hm-row"><button class="hm-btn big" id="hm-kprint">PRINT IT</button></div><p class="hm-say" aria-live="polite"></p>';
    $$('[data-k]', body).forEach(function (li) { var flip = function () { var on = li.getAttribute('aria-checked') !== 'true'; li.setAttribute('aria-checked', String(on)); store.set('da.isle.v1', $$('[aria-checked="true"]', body).map(function (q) { return q.dataset.k; })); beep(on ? 880 : 440, 0.05); };
      li.addEventListener('click', function (e) { if (!e.target.closest('a')) flip(); }); li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } }); });
    $('#hm-kprint', body).addEventListener('click', function () { var say = $('.hm-say', body), ticks = store.get('da.isle.v1', []) || [];
      var cv = window.SLIPS && SLIPS.checklist ? SLIPS.checklist(ticks, 512) : listSlip(list, ticks); say.textContent = '· · ·'; printCanvas(cv, 'kit').then(function (s) { say.textContent = s === 'held' ? 'WAITING FOR THE PRINTER’S YES' : s ? 'PRINTING' : '×'; }, function () { say.textContent = '× NO PRINTER ONLINE'; }); });
  }
  function listSlip(list, ticks) {
    var W = 512, rows = list.filter(Boolean), c = D.createElement('canvas'); c.width = W; c.height = 120 + rows.length * 58; var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, c.height); g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineWidth = 3; g.font = '700 34px "Archivo Narrow", Arial, sans-serif'; g.fillText('AN ISLAND', 24, 60);
    g.font = '26px "Archivo Narrow", Arial, sans-serif'; rows.forEach(function (s, i) { var y = 110 + i * 58; g.strokeRect(24, y - 24, 28, 28); if (ticks.indexOf(s[0]) >= 0) g.fillRect(30, y - 18, 16, 16); g.fillText(s[1].slice(0, 30), 68, y); });
    return c;
  }
  /* the control panel: this phone's settings and the network behind the site; island keepers' controls arrive with their key (stage H3) */
  function panelIn(body) {
    var dark = NIGHT, mo = MOTION || 'own';
    body.innerHTML = '<div class="hm-row"><a class="hm-btn big" href="https://github.com/novelglobal/island-engine" target="_blank" rel="noopener">THE BUILDING HUB ↗</a></div><p class="hm-h">MOTION</p><div class="hm-row">' + [['own', 'EACH CARD'], ['shadow', 'SHADOW'], ['speed', 'SPEED']].map(function (m) { return '<button class="hm-btn' + (mo === m[0] ? ' on' : '') + '" data-mo="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>' +
      '<p class="hm-h">LIGHT</p><div class="hm-row"><button class="hm-btn' + (dark ? '' : ' on') + '" data-dk="0">DAY</button><button class="hm-btn' + (dark ? ' on' : '') + '" data-dk="1">NIGHT</button></div>' +
      '<p class="hm-h">SWITCHBOARD</p><div class="hm-row"><button class="hm-btn" id="hm-rewire">AS IT STARTED</button></div>' +
      '<div id="hm-keeper"></div><p class="hm-h">THE NETWORK</p><ol class="hm-list hm-isles"><li>· · ·</li></ol>';
    $$('[data-mo]', body).forEach(function (b) { b.addEventListener('click', function () { MOTION = b.dataset.mo === 'own' ? null : b.dataset.mo; store.set('da.hm.motion', MOTION); find('style'); cards.forEach(function (el) { var c = byId(el.dataset.id); el.classList.remove('shadow', 'speed'); el.classList.add(MOTION || c.motion); }); $$('[data-mo]', body).forEach(function (q) { q.classList.toggle('on', q === b); }); beep(550, 0.05); }); });
    $$('[data-dk]', body).forEach(function (b) { b.addEventListener('click', function () { setNight(b.dataset.dk === '1'); $$('[data-dk]', body).forEach(function (q) { q.classList.toggle('on', q === b); }); }); });
    $('#hm-rewire', body).addEventListener('click', function () { WIRES = START.slice(); saveWires(); drawCables(); lamps(); beep(440, 0.08); });
    keeperIn($('#hm-keeper', body));
    partners(true).then(function (l) { var ol = $('.hm-isles', body); if (ol) ol.innerHTML = l.length ? l.map(function (p) { return '<li class="' + (p.ready ? 'on' : '') + '"><i></i><span>' + esc(p.name || p.id) + (p.number ? ' · ' + p.number : '') + '</span></li>'; }).join('') : '<li>—</li>'; });
  }

  /* a picture made small enough to send: at most 1600 on its long side, as a JPEG (which also drops where it was taken) */
  function shrinkPic(file) { return new Promise(function (ok, no) { var u = URL.createObjectURL(file), im = new Image(); im.onload = function () { var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = D.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(function (b) { if (b) ok(b); else no(new Error('shrink')); }, 'image/jpeg', 0.84); }; im.onerror = no; im.src = u; }); }
  /* an island keeper's own controls: their key (from the welcome slip) opens their one island, nothing else */
  function keeperIn(box) {
    var key = store.get('da.hm.key', ''); if (!key || !box) return;
    var call = function (o) { return fetch('/api/island', Object.assign({ headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' } }, o || {})).then(function (r) { if (r.status === 401) { store.set('da.hm.key', ''); throw new Error('key'); } return r.json(); }); };
    var fill = function (p) { box.innerHTML = '<p class="hm-h">YOUR ISLAND' + (p.number ? ' · ' + p.number : '') + '</p><ol class="hm-list hm-isles"><li class="' + (p.ready ? 'on' : '') + '"><i></i><span>' + esc(p.name) + ' · ' + p.queued + ' WAITING · ' + p.printed + ' PRINTED</span></li></ol>' +
      '<p class="hm-h">CONNECTIONS</p><div class="hm-row">' + (p.all || []).map(function (k) { return '<button class="hm-btn' + ((p.links || []).indexOf(k) >= 0 ? ' on' : '') + '" data-ln="' + k + '" aria-pressed="' + ((p.links || []).indexOf(k) >= 0) + '">' + ({ wish: 'W.I.S.H.', radio: 'RADIO', art: 'ART', words: 'WORDS', cards: 'CARDS', codes: 'CODES' }[k] || k.toUpperCase()) + '</button>'; }).join('') + '</div>' +
      '<p class="hm-h">ITS CARD · UP TO TEN PICTURES</p><div class="hm-pgrid">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { var q = (p.pics || []).filter(function (x) { return x.slot === n; })[0]; return '<button class="hm-pslot' + (q ? ' on' : '') + '" data-ps="' + n + '" aria-label="' + (q ? 'Take this picture away' : 'Add a picture') + '">' + (q ? '<img alt="" src="' + esc(q.url) + '">' : '+') + '</button>'; }).join('') + '</div>' +
      '<div class="hm-row">' + [2, 3, 5, 8].map(function (n) { return '<button class="hm-btn' + ((p.speed || 2) === n ? ' on' : '') + '" data-sp="' + n + '">' + n + ' S</button>'; }).join('') + '</div>' +
      '<div class="hm-row"><button class="hm-btn" data-rn>RENAME</button><button class="hm-btn" data-out>FORGET THIS KEY</button></div>';
      $$('[data-ln]', box).forEach(function (b) { b.addEventListener('click', function () { var l = (p.links || []).slice(), k = b.dataset.ln, i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k); call({ method: 'POST', body: JSON.stringify({ links: l }) }).then(fill); beep(i >= 0 ? 330 : 660, 0.05); }); });
      $$('[data-ps]', box).forEach(function (b) { b.addEventListener('click', function () { var n = +b.dataset.ps;
        if (b.classList.contains('on')) { if (confirm('Take this picture off your card?')) fetch('/api/island/pics/' + n, { method: 'DELETE', headers: { authorization: 'Bearer ' + key } }).then(function () { return call(); }).then(fill); return; }
        var fi = D.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.addEventListener('change', function () { var file = fi.files && fi.files[0]; if (!file) return; b.textContent = '·'; shrinkPic(file).then(function (bl) { return fetch('/api/island/pics/' + n, { method: 'PUT', headers: { authorization: 'Bearer ' + key, 'content-type': 'image/jpeg' }, body: bl }); }).then(function () { return call(); }).then(fill, function () { b.textContent = '×'; }); }); fi.click(); }); });
      $$('[data-sp]', box).forEach(function (b) { b.addEventListener('click', function () { call({ method: 'POST', body: JSON.stringify({ speed: +b.dataset.sp }) }).then(fill); beep(550, 0.05); }); });
      $('[data-rn]', box).addEventListener('click', function () { var n = prompt('Its name', p.name); if (n && n.trim()) call({ method: 'POST', body: JSON.stringify({ name: n.trim() }) }).then(fill); });
      $('[data-out]', box).addEventListener('click', function () { if (confirm('Forget this island’s key on this phone? The slip still has it.')) { store.set('da.hm.key', ''); box.innerHTML = ''; } }); };
    box.innerHTML = '<p class="hm-h">YOUR ISLAND</p><p class="hm-say">· · ·</p>'; call().then(fill, function () { box.innerHTML = '<p class="hm-h">YOUR ISLAND</p><p class="hm-say">THE KEY DID NOT OPEN IT</p>'; });
  }

  /* ───────── printing from the home: a canvas to the printer that is listening ───────── */
  function printCanvas(cv, was) { if (!NG.printAgain) return Promise.reject(new Error('no base')); return NG.printAgain(cv.toDataURL('image/png'), was); }
  function quickPrint() {
    var f = D.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.setAttribute('capture', 'environment');
    f.addEventListener('change', function () { var file = f.files && f.files[0]; if (!file) return; find('booth'); var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { var W = 512, c; if (window.SLIPS && SLIPS.quick) c = SLIPS.quick(im, W); else { c = D.createElement('canvas'); c.width = W; c.height = Math.round(W * im.naturalHeight / im.naturalWidth); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); }
        URL.revokeObjectURL(u); horn(0.6); printCanvas(c, 'quick').then(function () { if (NG.toast) NG.toast('PRINTING'); }, function () { if (NG.toast) NG.toast('NO PRINTER ONLINE'); }); };
      im.src = u; });
    f.click();
  }

  /* ───────── the printers: who is listening, for the radar keys ───────── */
  var PRN = [], PRN_AT = 0;
  function partners(force) { if (!force && Date.now() - PRN_AT < 60e3) return Promise.resolve(PRN); return fetch('/api/partners').then(function (r) { return r.ok ? r.json() : { partners: [] }; }).then(function (j) { PRN = j.partners || []; PRN_AT = Date.now(); radars(); return PRN; }).catch(function () { return PRN; }); }
  function radars() { cards.forEach(function (el) { var c = byId(el.dataset.id), p = PRN.filter(function (q) { return q.id === c.island; })[0], k = el.querySelector('[data-radar]'); if (k) k.hidden = !(p && p.ready); el.classList.toggle('live', !!(p && p.ready)); }); }
  partners(); setInterval(function () { if (!D.hidden && !away) partners(true); }, 60e3);

  /* ───────── the beacon: a card turned into a compass to its printer, from this phone's place ───────── */
  var HEAD = null, BCN = null;
  function beacon(id, key) {
    var el = col.querySelector('[data-id="' + id + '"]'), b = el.querySelector('.hm-bcn'), c = byId(id);
    if (!b.hidden) { b.hidden = true; key.classList.remove('on'); BCN = null; return; }
    key.classList.add('on'); find('map'); b.hidden = false; b.innerHTML = '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="60" stroke-dasharray="1 5"/><path d="M100 4v10M100 186v10M4 100h10M186 100h10"/><text x="100" y="30" text-anchor="middle" font-size="12" fill="currentColor" stroke="none">N</text><g class="ndl"><path d="M100 22L108 100L100 110L92 100Z"/></g></svg>' +
      '<dl><div><dt>DISTANCE</dt><dd data-d>…</dd></div><div><dt>BEARING</dt><dd data-b>…</dd></div><div><dt>PRINTER</dt><dd>' + esc((PRN.filter(function (q) { return q.id === c.island; })[0] || {}).ready ? 'ON' : 'OFF') + '</dd></div></dl>';
    BCN = { el: b, c: c, brg: 0 };
    var ask = window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission ? DeviceOrientationEvent.requestPermission().catch(function () { return 'denied'; }) : Promise.resolve('granted');
    ask.then(function (ok) { if (ok === 'granted') addEventListener('deviceorientation', orient, true); });
    if (!navigator.geolocation) { b.querySelector('[data-d]').textContent = '—'; return; }
    navigator.geolocation.getCurrentPosition(function (pos) { if (!BCN) return; var la = pos.coords.latitude, ln = pos.coords.longitude, t = c.where, R = 6371e3, r1 = la * Math.PI / 180, r2 = t[0] * Math.PI / 180, dl = (t[1] - ln) * Math.PI / 180, df = (t[0] - la) * Math.PI / 180;
      var h = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(r1) * Math.cos(r2) * Math.sin(dl / 2) * Math.sin(dl / 2), d = 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      var brg = (Math.atan2(Math.sin(dl) * Math.cos(r2), Math.cos(r1) * Math.sin(r2) - Math.sin(r1) * Math.cos(r2) * Math.cos(dl)) * 180 / Math.PI + 360) % 360;
      BCN.brg = brg; b.querySelector('[data-d]').textContent = d < 1000 ? Math.round(d) + ' M' : (d / 1000).toFixed(d < 10e3 ? 1 : 0) + ' KM'; b.querySelector('[data-b]').textContent = Math.round(brg) + '° ' + ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(brg / 45) % 8]; needle(); beep(990, 0.05);
    }, function () { b.querySelector('[data-d]').textContent = '—'; }, { enableHighAccuracy: true, timeout: 12e3, maximumAge: 60e3 });
  }
  function orient(e) { HEAD = e.webkitCompassHeading != null ? e.webkitCompassHeading : e.alpha != null ? 360 - e.alpha : null; needle(); }
  function needle() { if (!BCN) return; var n = BCN.el.querySelector('.ndl'); if (n) n.style.transform = 'rotate(' + (BCN.brg - (HEAD || 0)) + 'deg)'; }

  /* ───────── sound: only what a touch causes ───────── */
  var AC = null; function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
  function beep(f, len) { var c = ac(); if (!c) return; var o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08); o.connect(g).connect(c.destination); o.start(t); o.stop(t + len + 0.1); }
  /* the fog horn: two low reeds a little apart and a sub under them, through a closing filter */
  function horn(len) { var c = ac(); if (!c) return; var t = c.currentTime, L = len || 2.2, out = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(180, t); lp.frequency.linearRampToValueAtTime(520, t + 0.3); lp.frequency.linearRampToValueAtTime(240, t + L); lp.Q.value = 3;
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.22, t + 0.25); out.gain.setValueAtTime(0.22, t + L - 0.5); out.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.6); lp.connect(out).connect(c.destination);
    [[73.4, 'sawtooth'], [73.9, 'sawtooth'], [36.7, 'sine']].forEach(function (v) { var o = c.createOscillator(); o.type = v[1]; o.frequency.value = v[0]; o.frequency.setValueAtTime(v[0] * 0.97, t); o.frequency.linearRampToValueAtTime(v[0], t + 0.4); o.connect(lp); o.start(t); o.stop(t + L + 0.7); }); }


  /* ───────── the sea: the banner is its surface; pressed, the sea opens down into the reef, one water with no line between ───────── */
  var top = $('#hm-top'), tcv = top.querySelector('canvas'), tx = tcv.getContext('2d'), dpr = 1, TOPH = 52, CH = 52, VW = 360;
  var NIGHT = store.get('da.hm.night', null); if (NIGHT == null) { var a0 = AU(); NIGHT = !!(a0 && a0.dark && a0.dark()); }
  function setNight(on, quiet) { NIGHT = !!on; store.set('da.hm.night', NIGHT); root.classList.toggle('night', NIGHT); var a = AU(); if (a && a.dark && a.dark() !== NIGHT) a.dark(NIGHT); RB = null; if (!quiet) beep(NIGHT ? 392 : 523, 0.05); }
  setNight(NIGHT, true);
  function reefH() { return Math.round(Math.min(innerHeight * 0.68, 640)); }
  function seaSize() {
    dpr = Math.min(2, devicePixelRatio || 1); TOPH = parseFloat(getComputedStyle(top).getPropertyValue('--hm-top')) || top.clientHeight || 52; VW = top.clientWidth || innerWidth; CH = TOPH + reefH();
    tcv.style.height = CH + 'px'; tcv.width = Math.round(VW * dpr); tcv.height = Math.round(CH * dpr); RB = null;
  }

  /* ───────── the Irukandji, as it was first drawn: the box bell in one line with its shadow line, the eye in dots, four dots where the
     tentacles leave, four fine tentacles beaded with stinging cells. What is new: the eye is faint, the beads stop a fifth of the way
     down, and it swims slowly, crown first, with a pulse and a long glide; open the sea and it goes down into it ───────── */
  var J = { x: 150, y: 26, vx: -3, vy: 0, a: Math.PI - 0.25, ph: Math.random(), p: 0, blink: 0, s: 1, tx: 0, ty: 0, until: 0 }, NTJ = 40, NRJ = 40;
  var noise = function (a, b, c) { return Math.sin(a * 1.7 + b * 2.3 + c) * 0.5 + Math.sin(a * 0.9 - b * 1.3 + c * 1.9) * 0.3 + Math.sin(b * 3.1 + c * 0.7) * 0.2; };
  function swim(dt, t, open) {
    J.ph += dt / 5.4; var c = J.ph % 1; J.p = c < 0.28 ? Math.sin(c / 0.28 * Math.PI / 2) : Math.cos((c - 0.28) / 0.72 * Math.PI / 2);
    var S = J.s, lo = TOPH * 0.5;
    if (open) { if (t > J.until || Math.hypot(J.tx - J.x, J.ty - J.y) < 40) { J.tx = VW * (0.12 + Math.random() * 0.76); J.ty = TOPH + (CH - TOPH) * (0.12 + Math.random() * 0.6); J.until = t + 16 + Math.random() * 12; } }
    else { J.tx = J.x - 80; J.ty = lo + Math.sin(t * 0.07) * TOPH * 0.12; }
    var want = Math.atan2(J.ty - J.y, J.tx - J.x), d = Math.atan2(Math.sin(want - J.a), Math.cos(want - J.a)); J.a += d * Math.min(1, dt * (open ? 0.7 : 0.3));
    if (c < 0.28) { var th = (open ? 22 : 11) * S * dt; J.vx += Math.cos(J.a) * th; J.vy += Math.sin(J.a) * th; }
    J.vx *= Math.pow(0.5, dt); J.vy *= Math.pow(0.5, dt); J.vy += 0.5 * dt;
    J.x += J.vx * dt; J.y += J.vy * dt;
    if (!open) { J.y += (lo - J.y) * Math.min(1, dt * 0.6); if (J.x < -50) { J.x = VW + 50; J.y = lo; } if (J.x > VW + 60) J.x = -40; }
    else { J.x = Math.max(-30, Math.min(VW + 30, J.x)); J.y = Math.max(8, Math.min(CH - 40, J.y)); }
    var ws = (open ? 1.45 : 1) * (VW > 900 ? 1.25 : 1); J.s += (ws - J.s) * Math.min(1, dt * 0.8);
  }
  function drawJelly(g, t) {
    var S = J.s, ink = function (a) { return 'rgba(244,241,232,' + a.toFixed(3) + ')'; };
    var line = function (pts, w, a) { g.strokeStyle = ink(a); g.lineWidth = w; trace(g, pts); g.stroke(); };
    var dot = function (x, y, r, a) { g.fillStyle = ink(a); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    var bw = 15 * S, bh = 12.5 * S, p = RM.matches ? 0 : J.p, w = bw * (1 - 0.07 * p) / 2, h = bh * (1 + 0.045 * p), topY = -h * 0.55 + (bh - h) * 0.3, bot = topY + h;
    g.save(); g.translate(J.x, J.y); g.rotate(J.a + Math.PI / 2); g.lineCap = 'round'; g.lineJoin = 'round';
    /* its sideways drift, seen from the bell: the tentacles lean away from it */
    var ca = Math.cos(-(J.a + Math.PI / 2)), sa = Math.sin(-(J.a + Math.PI / 2)), lvx = J.vx * ca - J.vy * sa, lvy = J.vx * sa + J.vy * ca;
    var TL = bh * (S > 1.2 ? 4.6 : 3.4), ts = RM.matches ? 0 : t * 0.6, ph = J.ph * Math.PI * 2;
    for (var i = 0; i < 4; i++) {
      var rx = (i - 1.5) / 1.5 * w * 0.82, pts = [];
      for (var j = 0; j < NTJ; j++) { var s = j / (NTJ - 1), env = Math.min(1, j / 4);
        /* alive: a slow wave runs down each one, a drift of its own, and every stroke of the bell sends a ripple after it */
        var x = rx + (i - 1.5) * s * TL * 0.05 + (noise(i * 3.3, s * 2.2, ts * 0.8) * bh * 0.65 + Math.sin(s * (6 + i) - ts * 2.6 + i * 1.7) * bh * 0.3 + Math.sin(ph - s * 4.5 + i) * bh * 0.16) * s * env - lvx * 0.5 * s * s * S;
        var y = bot - 1 + s * TL * (1 - Math.min(0.25, Math.abs(lvy) * 0.01)) * (1 - 0.07 * p * (1 - s * 0.6)) + noise(i * 7.1, s * 3, ts * 0.6) * bh * 0.22 * s;
        pts.push([x, y]); }
      var far = i === 1 || i === 2;
      line(pts, 0.8, far ? 0.4 : 0.55); line(pts.map(function (q) { return [q[0] + 1.3, q[1] - 0.8]; }).slice(0, NTJ - 6), 0.3, 0.16);
      /* the beads of stinging cells: only the first fifth, below the bell */
      for (var b = 1; b < NTJ * 0.2; b++) dot(pts[b][0], pts[b][1], b % 3 === 0 ? 1.15 * Math.sqrt(S) : 0.75 * Math.sqrt(S), 0.32 + 0.22 * Math.sin(t * 1.4 - b * 0.5 + i));
    }
    /* the bell: the arch of the first drawing, its lip nearly straight */
    var B = [];
    for (var k = 0; k < NRJ; k++) { var u = k / NRJ, X, Y; if (u < 0.8) { var an = Math.PI * (1 - u / 0.8), cu = Math.cos(an), su = Math.sin(an); X = Math.pow(Math.abs(cu), 0.55) * (cu < 0 ? -1 : 1) * w; Y = bot - Math.pow(su, 0.42) * h * (0.94 + 0.06 * su); } else { var q2 = (u - 0.8) / 0.2; X = w - 2 * w * q2; Y = bot - Math.sin(q2 * Math.PI) * h * 0.09; } B.push([X, Y]); }
    B.push(B[0]); g.fillStyle = 'rgba(244,241,232,.06)'; trace(g, B); g.fill();
    line(B, 1.1 * Math.sqrt(S), 0.92); line(B.map(function (q) { return [q[0] + 1, q[1] + 0.7]; }), 0.35, 0.22);
    /* the eye, faint, in dots: it sees everything, and blinks */
    var bk = J.blink > 0 ? 0.08 : Math.min(1, Math.abs(((t + 2.2) % 8.3) - 0.14) / 0.14), eh = h * 0.27 * Math.max(0.08, bk), ew = w * 0.74, ey = topY + h * 0.52;
    for (var e = 0; e < 26; e++) { var ue = e / 26 * Math.PI * 2, ce = Math.cos(ue), se = Math.sin(ue); dot(ce * ew, ey + se * eh * (0.35 + 0.65 * Math.abs(se)), 0.6 * Math.sqrt(S), 0.34); }
    var pr = h * 0.25 * Math.max(0.08, bk); g.strokeStyle = ink(0.3); g.lineWidth = 0.5; g.beginPath(); g.arc(0, ey, pr, 0, 7); g.stroke(); dot(0, ey, pr * 0.42, 0.38);
    [-0.62, -0.22, 0.22, 0.62].forEach(function (f) { dot(f * w, bot - bh * 0.1, 0.9 * Math.sqrt(S), 0.8); });
    g.restore();
  }
  function bellHit(cx, cy) { var r = tcv.getBoundingClientRect(); return Math.hypot(cx - r.left - J.x, cy - r.top - J.y) < 20 * J.s; }
  /* the eye: the fog horn. Held: a quick photograph, printed */
  var hold = null, held = false;
  top.addEventListener('pointerdown', function (e) { if (e.target.closest('nav')) return; held = false; if (bellHit(e.clientX, e.clientY)) hold = setTimeout(function () { held = true; hold = null; J.blink = 0.4; quickPrint(); }, 650);
    else if (root.classList.contains('reef')) { var p = pt(e); PT.x = p[0]; PT.y = p[1]; RIP.push({ x: p[0], y: p[1], r: 2, a: 0.8 }); beep(180 + Math.random() * 120, 0.08); } });
  top.addEventListener('pointerup', function () { if (hold) { clearTimeout(hold); hold = null; } });
  top.addEventListener('pointerleave', function () { if (hold) { clearTimeout(hold); hold = null; } PT.x = PT.y = -999; });
  top.addEventListener('click', function (e) { if (e.target.closest('nav')) return; if (held) { held = false; return; }
    if (bellHit(e.clientX, e.clientY)) { J.blink = 0.25; horn(); J.vx += Math.cos(J.a) * 6; J.vy += Math.sin(J.a) * 6; return; }
    if (away) { history.back(); return; } if (!root.classList.contains('reef')) reef(true); });
  $('#hm-theme').addEventListener('click', function (e) { e.stopPropagation(); setNight(!NIGHT); });
  $('#hm-snork').addEventListener('click', function (e) { e.stopPropagation(); reef(false); });

  /* ───────── the reef: the forms rounded and lit, in their own colours; the life on it in white line, alive to a touch ───────── */
  var RB = null, PT = { x: -999, y: -999, vx: 0, vy: 0 };
  var FISH = [], SNOW = [], WORMS = [], SNAKE = { x: -120, y: 0, t: 0 }, SLUG = { u: 0.15, gill: 1 }, RIP = [], STAR = null;
  function reef(on) { root.classList.toggle('reef', on); top.setAttribute('aria-expanded', String(on)); $('#hm-snork').hidden = !on; if (on) { beep(220, 0.12); J.until = 0; } else beep(330, 0.08); }
  function reefBuild() {
    var w = VW, h = CH, y0 = TOPH, rh = h - y0; RB = D.createElement('canvas'); RB.width = tcv.width; RB.height = tcv.height; var g = RB.getContext('2d'), r = rnd(77), sea = y0 + rh * 0.86, s = Math.min(w, rh);
    g.scale(dpr, dpr);
    /* light from above: a few soft shafts */
    g.save(); g.globalCompositeOperation = 'lighter'; for (var k = 0; k < 5; k++) { var x0 = w * (0.1 + r() * 0.8); g.fillStyle = 'rgba(160,200,255,' + (NIGHT ? 0.025 : 0.05) + ')'; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 40, 0); g.lineTo(x0 + 160 + r() * 80, h); g.lineTo(x0 + 60, h); g.closePath(); g.fill(); } g.restore();
    /* the floor: sand in a few soft bands */
    g.fillStyle = NIGHT ? 'rgba(20,34,56,.9)' : 'rgba(214,200,170,.92)'; g.beginPath(); g.moveTo(0, sea); for (var x = 0; x <= w; x += 12) g.lineTo(x, sea + Math.sin(x * 0.02) * 4 + (r() - 0.5) * 3); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    grain(g, w, h, Math.round(w * rh / 30), NIGHT ? 'rgba(255,255,255,.06)' : 'rgba(80,60,30,.18)', 78);
    /* the forms, back to front */
    disc(g, w * 0.5, sea + 4, s * 0.16, '#3A63C8');
    coral(g, w * 0.18, sea + 6, s * 0.62, '#F7B58C', 79, false); coral(g, w * 0.86, sea + 8, s * 0.46, '#F4A07C', 80, false);
    chrome(g, w * 0.36, sea - s * 0.02, s * 0.12, 0.2);
    honey(g, w * 0.66, sea - s * 0.04, s * 0.11, 81);
    glass(g, w * 0.58, sea - s * 0.16, s * 0.1, '#F2C230', 82);
    /* the white-line life sits on the forms */
    WORMS = []; for (var wi = 0; wi < 5; wi++) WORMS.push({ x: w * 0.58 + (wi - 2) * s * 0.035, y: sea - s * 0.24 - Math.abs(wi - 2) * -s * 0.01, out: 1 });
    STAR = { x: w * 0.3, y: sea + 18 };
    FISH = []; for (var fi = 0; fi < 9; fi++) FISH.push({ x: r() * w, y: y0 + rh * (0.15 + r() * 0.45), a: r() < 0.5 ? 0 : Math.PI, v: 14 + r() * 10, s: 0.7 + r() * 0.6, w: r() * 6 });
    SNOW = []; for (var si2 = 0; si2 < 90; si2++) SNOW.push({ x: r() * w, y: y0 + r() * rh, vx: 0, vy: 4 + r() * 6, r: 0.4 + r() * 1 });
    SNAKE.y = y0 + rh * 0.45; SLUG.sea = sea; SLUG.w = w;
  }
  function drawReef(dt, t) {
    var g = tx, w = VW, h = CH, y0 = TOPH; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(RB, 0, 0); g.restore();
    g.lineCap = 'round'; g.lineJoin = 'round'; PT.vx *= 0.9; PT.vy *= 0.9; var near = function (x, y, d) { return Math.hypot(x - PT.x, y - PT.y) < d; };
    g.fillStyle = 'rgba(244,241,232,.55)'; SNOW.forEach(function (s) { var dx = s.x - PT.x, dy = s.y - PT.y, d = Math.hypot(dx, dy); if (d < 90) { s.vx += PT.vx * 0.02 + dx / d * 0.6; s.vy += PT.vy * 0.02 + dy / d * 0.6; } s.vx *= 0.96; s.vy += (5 - s.vy) * 0.02; s.x += s.vx * dt; s.y += s.vy * dt; if (s.y > h) { s.y = y0 - 10; s.x = Math.random() * w; } if (s.x < 0) s.x += w; if (s.x > w) s.x -= w; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); });
    g.strokeStyle = 'rgba(244,241,232,.92)'; g.lineWidth = 1.1;
    WORMS.forEach(function (o) { var want = near(o.x, o.y, 70) ? 0 : 1; o.out += (want - o.out) * (want ? 0.02 : 0.25); if (o.out < 0.05) return; g.beginPath(); for (var i = 0; i < 6; i++) { var yy = o.y - i * 3.2 * o.out, ww = (6 - i) * 1.3 * o.out; g.moveTo(o.x - ww, yy); g.lineTo(o.x + ww, yy - 2 * o.out); } g.stroke(); });
    if (STAR) { g.beginPath(); for (var s2 = 0; s2 <= 10; s2++) { var an = s2 / 10 * Math.PI * 2 - Math.PI / 2 + Math.sin(t * 0.2) * 0.05, rr = s2 % 2 ? 4 : 11; g[s2 ? 'lineTo' : 'moveTo'](STAR.x + Math.cos(an) * rr, STAR.y + Math.sin(an) * rr); } g.closePath(); g.stroke(); }
    FISH.forEach(function (f) { if (near(f.x, f.y, 100)) { var aw = Math.atan2(f.y - PT.y, f.x - PT.x); f.a += Math.atan2(Math.sin(aw - f.a), Math.cos(aw - f.a)) * 0.2; f.v = Math.min(80, f.v + 6); } else { f.v += (16 - f.v) * 0.02; f.a += Math.sin(t * 0.7 + f.w) * 0.004; }
      if (f.y < y0 + 20) f.a += 0.05; if (f.y > y0 + (h - y0) * 0.62) f.a -= 0.05; f.x += Math.cos(f.a) * f.v * dt; f.y += Math.sin(f.a) * f.v * dt * 0.5; if (f.x < -20) f.x = w + 20; if (f.x > w + 20) f.x = -20;
      g.save(); g.translate(f.x, f.y); g.rotate(f.a); g.scale(f.s, f.s); var wag = Math.sin(t * 9 + f.w) * 2.5; g.beginPath(); g.moveTo(9, 0); g.quadraticCurveTo(0, -5, -8, 0); g.quadraticCurveTo(0, 5, 9, 0); g.moveTo(-8, 0); g.lineTo(-14, -4 + wag); g.lineTo(-13, 4 + wag); g.lineTo(-8, 0); g.stroke(); g.beginPath(); g.arc(5, -1, 0.9, 0, 7); g.fillStyle = INK; g.fill(); g.restore(); });
    SNAKE.t += dt; SNAKE.x += dt * 16; if (SNAKE.x > w + 200) SNAKE.x = -200; var sy0 = SNAKE.y + Math.sin(SNAKE.t * 0.3) * 20;
    g.lineWidth = 2.2; for (var b = 0; b < 22; b++) { var x0 = SNAKE.x - b * 6, yA = sy0 + Math.sin(SNAKE.t * 3 - b * 0.45) * 6, x1 = x0 - 6, y1 = sy0 + Math.sin(SNAKE.t * 3 - (b + 1) * 0.45) * 6; g.globalAlpha = b % 2 ? 0.95 : 0.35; g.beginPath(); g.moveTo(x0, yA); g.lineTo(x1, y1); g.stroke(); } g.globalAlpha = 1; g.lineWidth = 1.1;
    if (SLUG.sea) { SLUG.u += dt * 0.004; if (SLUG.u > 0.95) SLUG.u = 0.05; var ux = SLUG.u * SLUG.w, uy = SLUG.sea + 8; SLUG.gill += ((near(ux, uy, 60) ? 0 : 1) - SLUG.gill) * 0.1;
      g.beginPath(); g.ellipse(ux, uy, 10, 3.2, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(ux + 8, uy - 2); g.lineTo(ux + 11, uy - 7); g.moveTo(ux + 6, uy - 2); g.lineTo(ux + 7, uy - 7); for (var gi = 0; gi < 4; gi++) { g.moveTo(ux - 6, uy - 2); g.lineTo(ux - 6 + Math.cos(-2 - gi * 0.35) * 6 * SLUG.gill, uy - 2 + Math.sin(-2 - gi * 0.35) * 6 * SLUG.gill); } g.stroke(); }
    RIP = RIP.filter(function (q) { q.r += dt * 120; q.a -= dt * 1.4; if (q.a <= 0) return false; g.globalAlpha = q.a; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.stroke(); g.globalAlpha = 1; return true; });
  }
  var pt = function (e) { var r = tcv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  top.addEventListener('pointermove', function (e) { if (!root.classList.contains('reef')) return; var p = pt(e); PT.vx = (p[0] - PT.x) * 2; PT.vy = (p[1] - PT.y) * 2; PT.x = p[0]; PT.y = p[1]; });

  /* ───────── the switchboard: one jack to each thing, each by its own mark; the starting ones lit, the rest dark holes until found ───────── */
  var G = function (s) { return s; };
  var SLOTS = [
    /* the starting seven: open to everyone */
    ['wish', 'I W.I.S.H.', 1, G('<path d="M2 12h20"/><circle cx="5.5" cy="12" r="1.9" class="f"/><circle cx="10" cy="12" r="1.9" class="f"/><circle cx="14.5" cy="12" r="1.9" class="f"/><circle cx="19" cy="12" r="1.9" class="f"/>')],
    ['radio', 'DIRECT ACTION RADIO', 1, G('<path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 12l6.4-6.4"/><circle cx="12" cy="12" r="1.6" class="f"/><circle cx="7" cy="15" r=".9" class="f"/>')],
    ['zine', 'LANDSCAPE ZINE', 1, G('<path d="M9 2h6v20H9z"/><path d="M9 15l2-4 1.3 2 1.2-3.5L15 13"/>')],
    ['kit', 'ISLAND KIT', 1, G('<path d="M3 7h18v11H3z"/><path d="M6 10h4v4H6z"/><path d="M13 10h5M13 13h5" stroke-dasharray="1 1.6"/><circle cx="5" cy="16.3" r=".7" class="f"/><circle cx="19" cy="16.3" r=".7" class="f"/>')],
    ['space', 'ARCHIPELAGOS ENGINE', 1, G('<path d="M4.5 9.5c0-2 1.6-3 3.2-2.6 1.4.4 1.8 2.2.8 3.3-1.2 1.2-4 .9-4-.7zM14 6.5c.6-1.6 3.2-1.8 4-.3.7 1.3-.5 2.6-2 2.5-1.3 0-2.4-1-2-2.2zM12.5 17c.2-2.4 3.6-3 5-1.4 1.3 1.6-.4 3.8-2.6 3.6-1.5-.1-2.5-1-2.4-2.2z"/><path d="M8.8 10.5l4.6 5M11 8.6l3-1.2" stroke-dasharray=".2 2"/>')],
    ['reef', 'THE REEF', 1, G('<path d="M12 22V13M12 16l-4-5V7M12 14l4-4V5M8 11l-2.5-2"/><path d="M3 22h18"/>')],
    ['eye', 'THE EYE', 1, G('<path d="M2.5 12C6 7 9 5.5 12 5.5S18 7 21.5 12C18 17 15 18.5 12 18.5S6 17 2.5 12z"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1.1" class="f"/>')],
    /* found by doing: each lights the first time it is done here */
    ['moon', 'THE MOON', 0, G('<path d="M15 3.5a8.5 8.5 0 1 0 5.5 14A7 7 0 0 1 15 3.5z"/>')],
    ['stamp', 'A PRINT MADE', 0, G('<path d="M5 4h14v16H5z" stroke-dasharray="1.2 1.4"/><path d="M8 8h8v6H8z"/>')],
    ['signal', 'KIN', 0, G('<path d="M4 9c2-2 4-2 6 0s4 2 6 0 4-2 4-2M4 15c2-2 4-2 6 0s4 2 6 0 4-2 4-2" stroke-dasharray=".2 2.2"/>')],
    ['map', 'A BEACON FOLLOWED', 0, G('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>')],
    ['style', 'A MOTION CHOSEN', 0, G('<path d="M4 4h10v10H4z"/><path d="M10 10h10v10H10z"/>')],
    ['booth', 'A PHOTO HELD', 0, G('<circle cx="12" cy="12" r="8"/><path d="M12 4l3 6M20 12l-6 1M14 19l-3-5M5 16l5-3M5 7l4 4"/>')],
    ['folio', 'A SONG KEPT', 0, G('<path d="M6 3h11v15H6z"/><path d="M8.5 20.5h11v-15" />')]
  ];
  /* the third row: islands, each found by a code from its print or a visit; their marks are islands of their own shape */
  for (var si3 = 0; si3 < 7; si3++) (function (n) { var r = rnd(90 + n), pts = []; for (var q = 0; q < 9; q++) { var an = q / 9 * Math.PI * 2, rr = 5 + r() * 3.5; pts.push((12 + Math.cos(an) * rr).toFixed(1) + ' ' + (12 + Math.sin(an) * rr * 0.8).toFixed(1)); }
    SLOTS.push(['isle' + n, 'AN ISLAND', 0, '<path d="M' + pts.join('L') + 'Z"/>' + '<circle cx="12" cy="12" r="1" class="f"/>']); })(si3);
  var FOUND = store.get('da.sb.found', []) || [];
  function found(id) { var s = SLOTS.filter(function (q) { return q[0] === id; })[0]; return !!s && (s[2] === 1 || FOUND.indexOf(id) >= 0); }
  function find(id) { if (found(id) || !SLOTS.some(function (q) { return q[0] === id; })) return; FOUND.push(id); store.set('da.sb.found', FOUND); var sl = jk && jk.querySelector('[data-s="' + id + '"]'); if (sl) { var nm = SLOTS.filter(function (q) { return q[0] === id; })[0][1]; sl.classList.remove('lk'); sl.dataset.n = nm; sl.title = nm; sl.querySelector('.j').setAttribute('aria-label', nm); sl.classList.add('new'); setTimeout(function () { sl.classList.remove('new'); }, 2400); } beep(784, 0.08); setTimeout(function () { beep(1175, 0.1); }, 110); }
  /* what is found already, from what this phone has done */
  (function () { var h = new Date().getHours(); if (h >= 19 || h < 6) FOUND.indexOf('moon') < 0 && FOUND.push('moon'); if (store.get('da.aura.printed', 0)) FOUND.indexOf('stamp') < 0 && FOUND.push('stamp'); if ((store.get('da.kin', []) || []).length) FOUND.indexOf('signal') < 0 && FOUND.push('signal'); if ((store.get('da.aura.songs', []) || []).length) FOUND.indexOf('folio') < 0 && FOUND.push('folio'); store.set('da.sb.found', FOUND); })();

  /* the wiring: pairs of slots; the first cable, RADIO to W.I.S.H., is there from the start and can be pulled out */
  var START = [['radio', 'wish']], MAXW = 4, CAB = ['#E9C46A', '#5CE07A', '#F07167', '#8ECAE6', '#F4F1E8', '#C77DFF'];
  var WIRES = store.get('da.sb.v2', null);
  if (!WIRES) { var old = store.get('da.sb.v1', null); WIRES = old ? old.map(function (w) { return w.map(function (x) { x = String(x).split('.')[0]; return x === 'iruk' ? 'eye' : x; }); }).filter(function (w) { return w[0] !== w[1]; }) : START.slice(); }
  WIRES = WIRES.slice(-MAXW);
  var sb = $('#hm-sb'), jk = sb.querySelector('.jk');
  var SC = { wish: '#7CF2B0', radio: '#B9B2F6', zine: '#FF5436', kit: '#FFB000', space: '#F59878', reef: '#4FC3F7', eye: '#F4F1E8', moon: '#E9E4FF', stamp: '#FF8A5B', signal: '#5CE07A', map: '#FFD84D', style: '#FF6FB5', booth: '#9AE6FF', folio: '#C9F27C' };
  jk.innerHTML = SLOTS.map(function (s, n) { var on = found(s[0]), sc = SC[s[0]] || ['#FF6FB5', '#9AE6FF', '#FFD84D', '#7CF2B0', '#FF8A5B', '#B9B2F6', '#4FC3F7'][n % 7]; return '<div class="sl' + (on ? '' : ' lk') + '" style="--sc:' + sc + '" data-s="' + s[0] + '"' + (on ? ' data-n="' + s[1] + '" title="' + s[1] + '"' : '') + '><span class="g" aria-hidden="true"><svg viewBox="0 0 24 24">' + s[3] + '</svg><i class="led"></i></span><button class="j" data-j="' + s[0] + '" aria-label="' + (on ? s[1] : 'Not found yet') + '"></button></div>'; }).join('') + '<svg class="cab" aria-hidden="true"></svg>';
  var cab = jk.querySelector('svg.cab');
  function saveWires() { store.set('da.sb.v2', WIRES); }
  function wired(a, b) { return WIRES.some(function (w) { return (w[0] === a && w[1] === b) || (w[0] === b && w[1] === a); }); }
  function jpos(id) { var j = jk.querySelector('[data-j="' + id + '"]'), r = j.getBoundingClientRect(), o = jk.getBoundingClientRect(); return [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top]; }
  function sag(a, b) { var d = Math.hypot(b[0] - a[0], b[1] - a[1]), s = 18 + d * 0.28; return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'C' + a[0].toFixed(1) + ' ' + (a[1] + s).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + (b[1] + s).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
  function drawCables(extra) {
    var o = WIRES.map(function (w, i) { var a = jpos(w[0]), b = jpos(w[1]), c = CAB[i % CAB.length]; return '<path d="' + sag(a, b) + '" stroke="' + c + '"/><circle cx="' + a[0] + '" cy="' + a[1] + '" r="4" fill="' + c + '"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="4" fill="' + c + '"/>'; }).join('');
    cab.innerHTML = o + (extra || ''); var cb = sb.querySelector('.cb'); if (cb) cb.innerHTML = CAB.slice(0, MAXW).map(function (c, i) { return '<i' + (i < WIRES.length ? ' class="in"' : '') + ' style="background:' + c + '"></i>'; }).join(''); $$('.sl', jk).forEach(function (sl) { sl.classList.toggle('on', WIRES.some(function (w) { return w[0] === sl.dataset.s || w[1] === sl.dataset.s; })); });
  }
  /* what a wire does, either way round: each known pair changes a card; anything else still answers, with a spark and a note */
  var DOES = { 'radio+wish': 'song', 'wish+zine': 'strip', 'radio+zine': 'code', 'kit+wish': 'step', 'kit+zine': 'step' };
  var pairKey = function (a, b) { return [a, b].sort().join('+'); };
  function lamps() {
    cards.forEach(function (el) { var id = el.dataset.id, l = el.querySelector('.hm-lamps'); if (!l) return; l.innerHTML = WIRES.filter(function (w) { return w[0] === id || w[1] === id; }).map(function (w) { var i = WIRES.indexOf(w); return '<i style="color:' + CAB[i % CAB.length] + '"></i>'; }).join(''); });
    var st = $('[data-strip]'); if (st) st.hidden = !wired('wish', 'zine');
  }
  var drag = null;
  jk.addEventListener('pointerdown', function (e) { var j = e.target.closest('.j'); if (!j) return; e.preventDefault(); ac(); if (!found(j.dataset.j)) { spark(j.dataset.j); return; } drag = { from: j.dataset.j, x: e.clientX, y: e.clientY, moved: false }; j.setPointerCapture(e.pointerId); j.parentNode.classList.add('hot'); beep(330, 0.04); });
  jk.addEventListener('pointermove', function (e) { if (!drag) return; if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true; if (!drag.moved) return;
    var o = jk.getBoundingClientRect(), a = jpos(drag.from), b = [e.clientX - o.left, e.clientY - o.top]; drawCables('<path d="' + sag(a, b) + '" stroke="' + CAB[WIRES.length % CAB.length] + '"/>');
    var over = D.elementFromPoint(e.clientX, e.clientY), osl = over && over.closest && over.closest('.sl'); $$('.sl', jk).forEach(function (q) { q.classList.toggle('hot', q.dataset.s === drag.from || q === osl); }); });
  function up(e) { if (!drag) return; var from = drag.from, moved = drag.moved; drag = null; $$('.sl', jk).forEach(function (q) { q.classList.remove('hot'); });
    if (!moved) { var at = -1; WIRES.forEach(function (w, i) { if (w[0] === from || w[1] === from) at = i; }); if (at >= 0) { WIRES.splice(at, 1); saveWires(); drawCables(); lamps(); beep(196, 0.1); } else say(from); return; }
    var t = D.elementFromPoint(e.clientX, e.clientY), sl = t && t.closest && t.closest('.sl'), to = sl && sl.dataset.s;
    if (to && to !== from && found(to) && !wired(from, to) && WIRES.length >= MAXW) { sb.classList.remove('full'); void sb.offsetWidth; sb.classList.add('full'); to = null; }
    if (!to || to === from || !found(to)) { if (to && !found(to)) spark(to); var o = jk.getBoundingClientRect(), a = jpos(from), b = [e.clientX - o.left, e.clientY - o.top]; drawCables('<path class="fall" d="' + sag(a, [b[0], o.height + 30]) + '" stroke="' + CAB[WIRES.length % CAB.length] + '"/>'); setTimeout(function () { drawCables(); }, 520); beep(150, 0.12); return; }
    if (!wired(from, to)) { WIRES.push([from, to]); saveWires(); } drawCables(); lamps();
    if (DOES[pairKey(from, to)]) { beep(660, 0.06); setTimeout(function () { beep(880, 0.08); }, 80); } else spark(to); }
  jk.addEventListener('pointerup', up); jk.addEventListener('pointercancel', up);
  /* a mistake still does something: the slot sparks and sings its own note */
  function spark(id) { var sl = jk.querySelector('[data-s="' + id + '"]'); if (!sl) return; sl.classList.remove('zap'); void sl.offsetWidth; sl.classList.add('zap'); beep(220 * Math.pow(2, (SLOTS.map(function (c) { return c[0]; }).indexOf(id) % 12) / 12), 0.18); }
  /* its name, only for a moment, only once found */
  function say(id) { var sl = jk.querySelector('[data-s="' + id + '"]'); if (!sl || !found(id)) { spark(id); return; } $$('.sl.say', jk).forEach(function (q) { if (q !== sl) q.classList.remove('say'); }); sl.classList.add('say'); clearTimeout(sl.__t); sl.__t = setTimeout(function () { sl.classList.remove('say'); }, 1800); beep(440, 0.04); }
  sb.querySelector('.grab').addEventListener('click', function () { sb.classList.toggle('big'); setTimeout(drawCables, 420); beep(sb.classList.contains('big') ? 440 : 330, 0.05); });
  sb.querySelector('.rs').addEventListener('click', function () { WIRES = START.slice(); saveWires(); drawCables(); lamps(); beep(440, 0.08); });
  addEventListener('resize', function () { drawCables(); });

  /* ───────── one loop for everything that moves ───────── */
  var last = performance.now(), wasOpen = false;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; requestAnimationFrame(frame); if (D.hidden) return;
    if (Math.round((top.clientWidth || innerWidth) * dpr) !== tcv.width || Math.abs(TOPH + reefH() - CH) > 1) seaSize();
    var open = root.classList.contains('reef') && !away, t = now / 1000;
    if (!RM.matches) swim(dt, t, open); J.blink = Math.max(0, J.blink - dt);
    /* only as much of the sea as shows is cleared and drawn */
    var showH = open || wasOpen ? CH : TOPH + 4 + 60 * J.s; wasOpen = open || top.clientHeight > TOPH + 2;
    tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, tcv.width, Math.min(tcv.height, Math.ceil(showH * dpr)));
    tx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (wasOpen) { if (!RB) reefBuild(); drawReef(RM.matches ? 0 : dt, t); }
    drawJelly(tx, t);
  }
  seaSize(); requestAnimationFrame(frame);
  requestAnimationFrame(function () { paintAll(); parallax(); drawCables(); lamps(); if (/[?&]panel\b/.test(location.search)) { history.replaceState(null, '', location.pathname); open('space'); } });
  window.HOME = { open: open, home: home, wired: wired, find: find, wires: function () { return WIRES.slice(); }, reef: reef, cards: CARDS, night: setNight, J: J };
})();
