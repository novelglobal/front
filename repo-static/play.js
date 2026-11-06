/* novel.global, the farm (1.0 B, a first playable, on staging only). A real paddock near Melbourne, picked for each new farm from the
   imagery the map already uses and redrawn in five flat tones of paper and pixel: no gradients, even opacity only. The one Irukandji
   drifts over it, very small and slow; pressed, the fog horn and it draws in to the ball; pressed again, the three rings open over the
   farm, holding the five words as much as has been unlocked. A story box played through puts an unlock in the hand; placed on the
   paddock, it works on the ground round it. Each farm keeps what was placed on it; a new farm starts bare. No words on the ground.
   The farm's stages and the box are island-engine's packs (board-farm, story-riparian), copied here until the engine serves them.
   Plain script for old phones, as the base: no ?. or ?? */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full or private: kept for the visit */ } }
  };
  var ALL = /(^|#|&)888($|&)/.test(location.hash);   /* the showcase: everything open */

  /* ───────── the ground: tones, and real paddocks to pick from (grazing and cropping country round Melbourne) ───────── */
  var TONES = { straw: '#D9C78F', dust: '#BBA57C', dry: '#9DA16E', gum: '#55623F', water: '#647F84' };
  var TK = ['straw', 'dust', 'dry', 'gum', 'water'], PAPER = '#EFE8D6', INK = '43,42,38';
  var PLACES = [[-37.735, 144.385], [-37.935, 144.480], [-37.405, 144.800], [-37.285, 144.985], [-38.030, 144.300], [-37.620, 144.205], [-37.505, 145.050], [-37.835, 144.255]];
  var Z = 16, N = 128;   /* 3 × 3 tiles at zoom 16, about 1.45 km across, redrawn as 128 cells */
  var IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';

  /* ───────── the farm's stages: the board pack, in order. Each placed by hand, then acting on the ground round it ───────── */
  var STAGES = [
    { id: 'keyline', as: 'line', acts: [['spread', 'dry', 120]] },
    { id: 'weirs', after: ['keyline'], as: 'strokes', acts: [['hold', 'water', 60, 'water']] },
    { id: 'pools', after: ['weirs'], as: 'water', acts: [['hold', 'water', 40, 'frogs']] },
    { id: 'fencing', after: ['pools'], as: 'dots', acts: [['thicken', 'dry', 30, 'grass']] },
    { id: 'soil', after: ['keyline'], as: 'dots', acts: [['grow', 'dry', 50, 'insects']] },
    { id: 'cells', after: ['soil'], as: 'line', acts: [['grow', 'dry', 100, 'grass']] },
    { id: 'burning', after: ['cells'], as: 'area', acts: [['grow', 'dry', 60, 'grass']] },
    { id: 'grass', after: ['fencing', 'cells'], as: 'dots', acts: [['spread', 'dry', 80, 'insects']] },
    { id: 'shelterbelt', after: ['grass'], as: 'dots', acts: [['shade', 'gum', 60, 'birds']] },
    { id: 'covenant', after: ['shelterbelt'], as: 'line', acts: [['thicken', 'gum', 120]] },
    { id: 'corridor', after: ['covenant', 'fencing'], as: 'area', acts: [['link', 'gum', 300, 'birds']] },
    { id: 'trees', after: ['shelterbelt'], as: 'ring', acts: [['attract', '', 40, 'birds']] },
    { id: 'dam', after: ['pools'], as: 'water', acts: [['cool', 'water', 50, 'frogs']] },
    { id: 'zones', after: ['soil'], as: 'ring', acts: [['grow', 'dry', 40]] },
    { id: 'rows', after: ['zones'], as: 'line', acts: [['grow', 'dry', 60, 'insects']] },
    { id: 'refuge', after: ['corridor', 'trees'], as: 'line', acts: [['attract', '', 100, 'birds']] },
    { id: 'scrub', after: ['refuge'], as: 'area', acts: [['spread', 'gum', 150, 'birds']] },
    { id: 'cover', after: ['rows'], as: 'dots', acts: [['grow', 'dry', 80, 'insects']] },
    { id: 'ponds', after: ['dam'], as: 'water', acts: [['hold', 'water', 30, 'frogs']] }
  ];
  var GROW = 45e3;   /* how long a placed stage takes to reach its full reach */

  /* ───────── the box: the riparian drain, from the story pack ───────── */
  var BOX = {
    id: 'riparian-drain', title: 'THE DRAIN THAT HOLDS', headline: 'What falls on the street runs to the creek.', src: 'melbournewater.com.au',
    receipts: [
      { list: ['a flooded gutter after the storm', 'leaves held at the grate', 'a dry creek a street away'], big: 'Street drains that hold water for the roots, and still stop the flood.' },
      { list: ['Stormwater carries the street into the creek.', 'Hard ground sends the rain away fast.', 'Sponge cities and leaky weirs slow water down and let it soak in.'], k: 'mcmc.org.au · sponge city · mulloon institute' },
      { art: 'dial', big: 'A kerb that drinks: leaves and water pool in a planted pit under the grate, and spill to the pipe only when it is full.' },
      { art: 'cover', big: 'A trial on one street: three grates over planted pits, a water-level and soil sensor on a mesh node, a printed sign at each.' },
      { big: 'Street drains that hold water for the roots, and still stop the flood.', list: ['the council’s drains team: the three pits', 'the creek’s own committee: the plants', 'a café’s printer: each week’s readings slip', 'a neighbour for each grate: the leaves'] }
    ]
  };

  /* ───────── state: farms by place, what was placed on each, what waits in the hand ───────── */
  var F = store.get('ng.farm.v1', null) || { cur: '', farms: {}, hand: [], words: 1, seen: 0 };
  var save = function () { store.set('ng.farm.v1', F); };
  var keyOf = function (p) { return p[0].toFixed(3) + ',' + p[1].toFixed(3); };
  var farm = function () { return F.farms[F.cur]; };
  function newFarm() {
    var used = Object.keys(F.farms), left = PLACES.filter(function (p) { return used.indexOf(keyOf(p)) < 0; });
    var p = (left.length ? left : PLACES)[Math.floor(Math.random() * (left.length || PLACES.length))], k = keyOf(p);
    if (!F.farms[k]) F.farms[k] = { at: p, placed: [], made: Date.now() };
    F.cur = k; save(); return F.farms[k];
  }
  if (!F.cur || !F.farms[F.cur]) newFarm();

  /* ───────── a small seeded noise, so the same farm grows the same way on every visit ───────── */
  function hash(i, j, s) { var h = (i * 374761393 + j * 668265263 + s * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function noise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  /* ───────── the paddock: the tiles read, each cell given the tone it is nearest, by its place among all the cells ───────── */
  var cells = null;   /* N × N tone indexes, before anything is placed */
  function tile(x, y) { var t = Math.pow(2, Z); x = ((x % t) + t) % t; return IMAGERY + Z + '/' + y + '/' + x; }
  function tileXY(lat, lng) { var t = Math.pow(2, Z), r = lat * Math.PI / 180; return [(lng + 180) / 360 * t, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * t]; }
  function readGround(f) {
    var cached = store.get('ng.farm.ground.' + F.cur, null); if (cached && cached.length === N * N) return Promise.resolve(cached.split('').map(Number));
    var xy = tileXY(f.at[0], f.at[1]), tx = Math.floor(xy[0]), ty = Math.floor(xy[1]);
    var c = document.createElement('canvas'); c.width = c.height = 768; var x = c.getContext('2d');
    var jobs = [];
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) (function (dx, dy) {
      jobs.push(new Promise(function (res) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { x.drawImage(im, (dx + 1) * 256, (dy + 1) * 256); res(1); }; im.onerror = function () { res(0); }; im.src = tile(tx + dx, ty + dy); }));
    })(dx, dy);
    return Promise.all(jobs).then(function (ok) {
      if (ok.filter(Boolean).length < 5) return made();
      var s = document.createElement('canvas'); s.width = s.height = N; var sx = s.getContext('2d'); sx.imageSmoothingEnabled = true; sx.drawImage(c, 0, 0, N, N); c.width = c.height = 0;
      var d; try { d = sx.getImageData(0, 0, N, N).data; } catch (e) { return made(); }
      var L = [], i, out = new Array(N * N);
      for (i = 0; i < N * N; i++) L.push(0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]);
      var sorted = L.slice().sort(function (a, b) { return a - b; }), q = function (p) { return sorted[Math.floor(p * (sorted.length - 1))]; };
      /* an El Niño summer: most of it straw and dust, the dark of the trees kept only where it is darkest */
      var q1 = q(0.07), q2 = q(0.17), q3 = q(0.48);
      for (i = 0; i < N * N; i++) {
        var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], l = L[i];
        out[i] = b > g + 3 && b > r && l < q2 ? 4 : l < q1 ? 3 : l < q2 ? (g > r ? 2 : 1) : l < q3 ? 1 : 0;
      }
      out = wash(wash(out));
      store.set('ng.farm.ground.' + F.cur, out.join('')); return out;
    });
  }
  /* a wash: each cell takes the tone most of its neighbours have, so the pixels pool into shapes, as paint does */
  function wash(a) {
    var o = a.slice(), c = [0, 0, 0, 0, 0];
    for (var j = 1; j < N - 1; j++) for (var i = 1; i < N - 1; i++) {
      c[0] = c[1] = c[2] = c[3] = c[4] = 0; for (var y = -1; y <= 1; y++) for (var x = -1; x <= 1; x++) c[a[(j + y) * N + i + x]]++;
      var best = a[j * N + i], m = c[best]; for (var k = 0; k < 5; k++) if (c[k] > m + 1) { m = c[k]; best = k; } o[j * N + i] = best;
    }
    return o;
  }
  /* no imagery (offline, or refused): a paddock made from the farm's own place, so it is still that farm */
  function made() { var f = farm(), s = Math.round(Math.abs(f.at[0] * 1000 + f.at[1] * 1000)), out = [];
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var n = noise(i / 18, j / 18, s) * 0.7 + noise(i / 5, j / 5, s + 1) * 0.3; out.push(n < 0.22 ? 3 : n < 0.36 ? 2 : n < 0.62 ? 1 : 0); }
    return out; }

  /* ───────── what has been placed, worked onto the ground ───────── */
  var MPC = 1450 / N;   /* metres a cell, near enough at this latitude */
  function grown(now) {
    var g = cells.slice(), f = farm(), busy = false;
    f.placed.forEach(function (p, pi) {
      var st = stage(p.id); if (!st) return; var k = Math.min(1, (now - p.t) / GROW); if (k < 1) busy = true;
      st.acts.forEach(function (a) {
        var R = a[2] / MPC * (0.25 + 0.75 * k), tone = TK.indexOf(a[1]), R2 = Math.ceil(R * 1.2);
        for (var j = Math.max(0, p.y - R2); j < Math.min(N, p.y + R2 + 1); j++) for (var i = Math.max(0, p.x - R2); i < Math.min(N, p.x + R2 + 1); i++) {
          var dd = Math.sqrt((i - p.x) * (i - p.x) + (j - p.y) * (j - p.y)) / R, n = noise(i / 3.3, j / 3.3, pi * 7 + 3); if (dd > 0.55 + 0.6 * n) continue;
          var at = j * N + i, was = g[at];
          if (a[0] === 'hold' || a[0] === 'cool') { if (dd < 0.32 + 0.25 * n) g[at] = 4; else if (was < 2) g[at] = 2; }
          else if (a[0] === 'spread' || a[0] === 'grow') { if (was < 2) g[at] = tone >= 0 ? tone : 2; else if (tone === 3 && was === 2 && dd < 0.6) g[at] = 3; }
          else if (a[0] === 'thicken' || a[0] === 'shade' || a[0] === 'link') { if (was < 2) g[at] = 2; if (dd < 0.5 && was !== 4 && (tone === 3 || n > 0.55)) g[at] = 3; }
        }
      });
    });
    return { g: g, busy: busy };
  }
  var stage = function (id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i]; return null; };
  function nextStage() {
    var f = farm(), done = f.placed.map(function (p) { return p.id; }).concat(F.hand);
    for (var i = 0; i < STAGES.length; i++) { var s = STAGES[i]; if (done.indexOf(s.id) >= 0) continue; if ((s.after || []).every(function (a) { return done.indexOf(a) >= 0; })) return s.id; }
    return null;
  }

  /* ───────── drawing: the paper, the washes, the grain, the marks placed, the balance line ───────── */
  var cv, cx, life, lx, W = 0, H = 0, dpr = 1, S = 1, OX = 0, OY = 0, growing = false;
  function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; [cv, life].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    S = Math.max(W, H) / N; if (S * N < Math.max(W, H)) S += 0.5; OX = (W - S * N) / 2; OY = (H - S * N) / 2; paint(true); }
  /* the paddock is drawn one pixel a cell into a small buffer, then scaled up crisp in one draw */
  var rgb = function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
  var RGB = TK.map(function (k) { return rgb(TONES[k]); }), PRGB = rgb(PAPER), buf = null, bx, bimg;
  /* drawn again only when asked, or while something placed is still growing */
  function paint(force) {
    if (!cells) { cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.fillStyle = PAPER; cx.fillRect(0, 0, W, H); return; }
    if (!force && !growing) return;
    var r = grown(Date.now()), g = r.g, i, j; growing = r.busy;
    var s0 = Math.round(Math.abs(farm().at[0] * 991));
    if (!buf) { buf = document.createElement('canvas'); buf.width = buf.height = N; bx = buf.getContext('2d'); bimg = bx.createImageData(N, N); }
    for (var c = 0, d = bimg.data; c < N * N; c++) {
      var t = g[c] === 0 && hash(c % N, (c / N) | 0, s0) < 0.012 ? PRGB : RGB[g[c]];   /* the paper, showing through a wash */
      d[c * 4] = t[0]; d[c * 4 + 1] = t[1]; d[c * 4 + 2] = t[2]; d[c * 4 + 3] = 255;
    }
    bx.putImageData(bimg, 0, 0);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.imageSmoothingEnabled = false; cx.drawImage(buf, OX, OY, S * N, S * N);
    /* grain: sparse dots of ink, all at one opacity */
    cx.fillStyle = 'rgba(' + INK + ',.16)';
    for (j = 0; j < N * 2; j++) for (i = 0; i < N * 2; i++) if (hash(i, j, s0 + 9) < 0.012) cx.fillRect(OX + i * S / 2, OY + j * S / 2, 1, 1);
    /* the marks of what was placed, in line and dot */
    cx.strokeStyle = 'rgba(' + INK + ',.75)'; cx.fillStyle = 'rgba(' + INK + ',.75)'; cx.lineWidth = 1.2; cx.lineCap = 'round';
    farm().placed.forEach(function (p) { var st = stage(p.id); if (st) mark(cx, st.as, OX + (p.x + 0.5) * S, OY + (p.y + 0.5) * S, S * 1.6); });
    /* the balance: farm light against habitat dark, along the foot */
    var nat = 0; for (i = 0; i < g.length; i++) if (g[i] >= 3) nat++; var share = nat / g.length;
    var y = H - 2, hx = W * Math.min(1, share * 2);
    cx.fillStyle = TONES.dry; cx.fillRect(0, y, W, 2); cx.fillStyle = TONES.gum; cx.fillRect(0, y, hx, 2);
  }
  function mark(x, as, px, py, u) {
    x.beginPath();
    if (as === 'line') { x.moveTo(px - u * 2.2, py + u * 0.4); x.lineTo(px + u * 2.2, py - u * 0.4); x.stroke(); }
    else if (as === 'strokes') { for (var k = -1; k <= 1; k++) { x.moveTo(px + k * u * 0.9 - u * 0.5, py - u * 0.6); x.lineTo(px + k * u * 0.9 + u * 0.5, py + u * 0.6); } x.stroke(); }
    else if (as === 'dots') { for (var d = -2; d <= 2; d++) { x.moveTo(px + d * u * 0.9 + 1.2, py); x.arc(px + d * u * 0.9, py, 1.2, 0, 7); } x.fill(); }
    else if (as === 'ring') { x.arc(px, py, u * 1.2, 0, 7); x.stroke(); }
    else if (as === 'area') { x.rect(px - u, py - u, u * 2, u * 2); x.stroke(); }
    else { x.fillStyle = TONES.water; x.arc(px, py, u * 0.7, 0, 7); x.fill(); x.fillStyle = 'rgba(' + INK + ',.75)'; }
  }

  /* ───────── life: what arrives where something was placed, once it has grown. Dots only ───────── */
  var lived = false, LIVES = { birds: 1, frogs: 1, insects: 1 };
  function lifeFrame(now) {
    /* nothing grown enough to bring life: the layer is left alone */
    var any = farm().placed.some(function (p) { var st = stage(p.id); return st && now - p.t >= GROW * 0.6 && st.acts.some(function (a) { return LIVES[a[3]]; }); });
    if (!any && !lived) return; lived = any;
    lx.setTransform(dpr, 0, 0, dpr, 0, 0); lx.clearRect(0, 0, W, H); lx.fillStyle = 'rgba(' + INK + ',.8)';
    farm().placed.forEach(function (p, pi) {
      var st = stage(p.id); if (!st) return; var k = Math.min(1, (now - p.t) / GROW); if (k < 0.6) return;
      st.acts.forEach(function (a) {
        var kind = a[3], n = kind === 'birds' ? 5 : kind === 'frogs' ? 4 : kind === 'insects' ? 7 : 0, R = a[2] / MPC * S * 0.45;
        for (var b = 0; b < n; b++) {
          var ph = hash(pi, b, 5) * 6.28, sp = 0.00012 + hash(pi, b, 6) * 0.0002, cxp = OX + (p.x + 0.5) * S, cyp = OY + (p.y + 0.5) * S, X, Y, sz = 1.4;
          if (kind === 'birds') { X = cxp + Math.cos(now * sp + ph) * R * (0.6 + hash(pi, b, 7)); Y = cyp + Math.sin(now * sp * 1.3 + ph) * R * 0.5 - R * 0.3; sz = 1.6; }
          else if (kind === 'frogs') { if (Math.sin(now * 0.002 + ph * 3) < 0.6) continue; X = cxp + Math.cos(ph) * R * 0.5; Y = cyp + Math.sin(ph) * R * 0.4; sz = 1.2; }
          else { X = cxp + Math.cos(ph) * R * 0.7 + Math.sin(now * 0.004 + b) * 2; Y = cyp + Math.sin(ph) * R * 0.6 + Math.cos(now * 0.005 + b) * 2; sz = 0.9; }
          lx.fillRect(X - sz / 2, Y - sz / 2, sz, sz);
        }
      });
    });
  }

  /* ───────── the fog horn: two low reeds, a little apart, the grunt at its end, far off ───────── */
  var AC = null;
  function horn() {
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return; }
    var t = AC.currentTime + 0.02, out = AC.createGain(), lp = AC.createBiquadFilter(), dl = AC.createDelay(), fb = AC.createGain(), wet = AC.createGain();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(720, t + 0.5); lp.frequency.linearRampToValueAtTime(300, t + 3.2); lp.Q.value = 3;
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.32, t + 0.35); out.gain.setValueAtTime(0.32, t + 2.1); out.gain.linearRampToValueAtTime(0, t + 3.3);
    dl.delayTime.value = 0.42; fb.gain.value = 0.38; wet.gain.value = 0.45;
    [[92, 'sawtooth', 1], [92.7, 'sawtooth', 0.8], [46, 'square', 0.35]].forEach(function (v) {
      var o = AC.createOscillator(), g = AC.createGain(); o.type = v[1]; o.frequency.setValueAtTime(v[0], t); o.frequency.setValueAtTime(v[0], t + 2.2); o.frequency.exponentialRampToValueAtTime(v[0] * 0.74, t + 3.1);
      g.gain.value = v[2] * 0.33; o.connect(g); g.connect(lp); o.start(t); o.stop(t + 3.4);
    });
    lp.connect(out); out.connect(AC.destination); out.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(AC.destination);
  }
  function tick(f) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f || 660; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.55); } catch (e) { /* no sound */ } }

  /* ───────── the ghost: the one Irukandji, very small, drifting slowly ───────── */
  var IRUK = '<svg viewBox="8 6 48 54" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round">%P</g></svg>';
  var ghost, mode = 'ghost', gx = 0.5, gy = 0.4, t0 = Date.now();
  function irukSVG(done) {
    fetch('iruk.svg').then(function (r) { return r.text(); }).then(function (s) {
      var g = (s.match(/<g[^>]*>([\s\S]*?)<\/g>/) || [])[1] || '';
      var under = g.replace(/<path /g, '<path stroke="rgba(43,42,38,.4)" stroke-width="5.2" '), over = g.replace(/<path /g, '<path stroke="#F7F4EC" stroke-width="2.6" ');
      done(IRUK.replace('%P', under + over));
    }).catch(function () { done(IRUK.replace('%P', '<circle cx="32" cy="22" r="10" stroke="#F7F4EC" stroke-width="2.6"/>')); });
  }
  function drift(now) {
    if (mode !== 'ghost') return; var t = (now - t0) / 1000;
    gx = 0.5 + 0.34 * Math.sin(t * 0.021 + 0.4) + 0.06 * Math.sin(t * 0.083); gy = 0.42 + 0.26 * Math.sin(t * 0.017 + 1.3) + 0.04 * Math.cos(t * 0.11);
    ghost.style.transform = 'translate(' + (gx * W).toFixed(1) + 'px,' + (gy * H).toFixed(1) + 'px) rotate(' + (Math.sin(t * 0.5) * 6).toFixed(1) + 'deg)';
  }
  function press() {
    if (mode === 'ghost') { mode = 'ball'; ghost.classList.add('ball'); horn(); return; }
    if (mode === 'ball') { mode = 'rings'; tick(440); openRings(); return; }
    shut();
  }
  function shut() { mode = 'ghost'; ghost.classList.remove('ball'); $('#rings').classList.remove('on'); closeBack(); [].forEach.call(document.querySelectorAll('.blk'), function (b) { b.classList.remove('on', 'flip'); });
    ghost.style.transition = 'transform 2.4s ease'; setTimeout(function () { ghost.style.transition = ''; }, 2400); }

  /* ───────── the rings, and the five words on them, as many as have been earned ───────── */
  var WORDS = ['PLAY', 'KEEP', 'FIND', 'MAKE', 'STACK'];
  var earnedWords = function () { var n = farm().placed.length, all = Object.keys(F.farms).reduce(function (s, k) { return s + F.farms[k].placed.length; }, 0);
    return ALL ? 5 : 1 + (all >= 1 ? 1 : 0) + (all >= 2 ? 1 : 0) + (all >= 3 ? 1 : 0) + (all >= 4 || n >= 4 ? 1 : 0); };
  function openRings() {
    var R = Math.min(W, H) * 0.36, cxp = gx * W, cyp = gy * H;
    cxp = Math.max(R + 16, Math.min(W - R - 16, cxp)); cyp = Math.max(R * 0.7 + 30, Math.min(H - R * 0.7 - 110, cyp));
    ghost.style.transition = 'transform .9s ease'; ghost.style.transform = 'translate(' + cxp + 'px,' + cyp + 'px)'; setTimeout(function () { ghost.style.transition = ''; }, 950);
    gx = cxp / W; gy = cyp / H;
    var E = [[1, 0.34, -12], [0.82, 0.62, 28], [0.64, 0.96, -58]], svg = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
    E.forEach(function (e, k) { var a = '<ellipse cx="' + cxp + '" cy="' + cyp + '" rx="' + (R * e[0]) + '" ry="' + (R * e[0] * e[1]) + '" transform="rotate(' + e[2] + ' ' + cxp + ' ' + cyp + ')" style="animation-delay:' + (k * 0.18) + 's"'; svg += a + ' class="under"/>' + a + '/>'; });
    /* one dot on the outer ring for every stage placed on this farm */
    farm().placed.forEach(function (p, i) { var th = -Math.PI / 2 + i * 0.33, x = cxp + Math.cos(th) * R, y = cyp + Math.sin(th) * R * E[0][1]; var rot = E[0][2] * Math.PI / 180, X = cxp + (x - cxp) * Math.cos(rot) - (y - cyp) * Math.sin(rot), Y = cyp + (x - cxp) * Math.sin(rot) + (y - cyp) * Math.cos(rot);
      svg += '<circle cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="2.4" fill="#F7F4EC" stroke="rgba(43,42,38,.5)"/>'; });
    $('#rings').innerHTML = svg + '</svg>'; $('#rings').classList.add('on');
    var n = earnedWords(), at = [[-90, 1, 0], [30, 0.82, 1], [150, 0.82, 1], [210, 0.64, 2], [-30, 0.64, 2]];
    WORDS.forEach(function (w, i) {
      var b = $('#blk-' + w); if (i >= n) { b.classList.remove('on'); return; }
      var a = at[i], e = E[a[2]], th = a[0] * Math.PI / 180, x = Math.cos(th) * R * e[0], y = Math.sin(th) * R * e[0] * e[1], rot = e[2] * Math.PI / 180;
      b.style.left = (cxp + x * Math.cos(rot) - y * Math.sin(rot)) + 'px'; b.style.top = (cyp + x * Math.sin(rot) + y * Math.cos(rot)) + 'px';
      setTimeout(function () { b.classList.add('on'); }, 500 + i * 140);
    });
  }

  /* ───────── a word flipped: its settings, and a path of tabs to go deeper ───────── */
  var back, open = '';
  function flip(w) {
    var b = $('#blk-' + w), was = open === w; [].forEach.call(document.querySelectorAll('.blk'), function (x) { x.classList.remove('flip'); }); closeBack(); if (was) return;
    b.classList.add('flip'); open = w; tick(880); setTimeout(function () { showBack(w, []); }, 320);
  }
  function closeBack() { open = ''; if (back) back.classList.remove('on'); }
  var TREE = { MAKE: { ISLAND: ['novel.global', 'Brunswick to the city'], STEPS: ['catch', 'draw', 'dial', 'craft', 'strings'], PACKS: ['map', 'lives', 'sound', 'styles', 'story', 'farm'], PRINTER: ['TM-T88V', '80'], PEOPLE: ['code', 'approved'] } };
  var STACK = [['hosted', 'pi'], ['online', 'offline'], ['mesh', 'none'], ['80', '58'], ['esc/pos', 'star']];
  function showBack(w, path) {
    var h = '';
    if (w === 'PLAY') h = '<div class="row"><button class="boxk" aria-label="' + BOX.title + '"><canvas class="box" width="20" height="32"></canvas></button></div>';
    else if (w === 'KEEP') { h = '<div class="row">' + Object.keys(F.farms).map(function (k, i) { var f = F.farms[k]; return '<button class="w' + (k === F.cur ? ' at' : '') + '" data-farm="' + k + '">' + (i + 1) + ' ' + '·'.repeat(Math.min(9, f.placed.length)) + '</button>'; }).join('') + (Object.keys(F.farms).length < 3 ? '<button class="w" data-new="1" aria-label="new farm">↻</button>' : '') + '</div>'; }
    else if (w === 'FIND') h = '<div class="row"><button class="w" data-find="1" aria-label="find a printer"><svg width="44" height="44" viewBox="-22 -22 44 44"><circle r="20" fill="none" stroke="currentColor"/><path id="needle" d="M0-16 L4 0 L0 16 L-4 0Z" fill="currentColor" opacity=".8"/></svg></button><span id="dist"></span></div>';
    else if (w === 'MAKE') { var at = path[0] || '', T = TREE.MAKE;
      h = '<div class="path"><button class="' + (at ? '' : 'at') + '" data-path="">MAKE</button>' + Object.keys(T).map(function (k) { return '<button class="' + (at === k ? 'at' : '') + '" data-path="' + k + '">' + k + '</button>'; }).join('') + '</div>' + (at ? '<div class="row">' + T[at].map(function (v) { return '<span class="w">' + v + '</span>'; }).join('') + '</div>' : ''); }
    else if (w === 'STACK') { var st = store.get('ng.stack', [0, 0, 0, 0, 0]); h = '<div class="row">' + STACK.map(function (p, i) { return '<button class="w at" data-stack="' + i + '">' + p[st[i] || 0] + '</button>'; }).join('') + '</div>'; }
    back.innerHTML = h; back.classList.add('on');
    if (w === 'PLAY') cover($('.box', back));
  }
  /* the box's cover: a kerb grate over a planted pit, roots below, in pixels */
  function cover(c) {
    var x = c.getContext('2d'), w = c.width, h = c.height, r = function (cl, a, b, cw, ch) { x.fillStyle = cl; x.fillRect(a, b, cw, ch); };
    r('#E9E4D6', 0, 0, w, h); r('#8E8A80', 0, 0, w, 9); r('#6F6B62', 0, 9, w, 2); r(TONES.dust, 0, 11, w, h - 11);
    for (var i = 4; i < 16; i += 2) r('#2B2A26', i, 7, 1, 4);
    r(TONES.water, 5, 13, 10, 3); r(TONES.dry, 4, 12, 3, 2); r(TONES.dry, 13, 12, 3, 2);
    [[7, 16, 1, 0], [10, 16, 0, 1], [13, 16, -1, 0]].forEach(function (q) { var a = q[0], b = q[1]; for (var k = 0; k < 13; k++) { r(TONES.gum, a, b, 1, 1); b++; if (k % 3 === 1) a += q[2] || (k % 2 ? 1 : -1); } });
    r('#2B2A26', 0, 30, w, 2);
  }

  /* ───────── the box opened: up to five receipts, pulled from the slot one at a time, then the Irukandji ───────── */
  var slot, ri = -1;
  function moonSVG(sz) {
    var p = (((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853) / 29.530588853, r = sz / 2 - 1, k = Math.cos(2 * Math.PI * p), wax = p < 0.5, rx = Math.abs(k) * r;
    var d = 'M0,' + (-r) + ' A' + r + ',' + r + ' 0 0,' + (wax ? 1 : 0) + ' 0,' + r + ' A' + rx.toFixed(2) + ',' + r + ' 0 0,' + (wax ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0)) + ' 0,' + (-r) + 'Z';
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="' + (-sz / 2) + ' ' + (-sz / 2) + ' ' + sz + ' ' + sz + '"><circle r="' + r + '" fill="none" stroke="#111"/><path d="' + d + '" fill="#111"/></svg>';
  }
  function qr(s) { try { var q = qrcode(0, 'M'); q.addData(s); q.make(); return q.createSvgTag(2, 0); } catch (e) { return ''; } }
  function receiptHTML(rc, i) {
    var h = '';
    if (i === 0) h += '<p class="k">' + BOX.title + '</p>';
    if (rc.list && i !== 4) h += '<ul>' + rc.list.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>';
    if (rc.art === 'dial') h += '<canvas class="dialart" width="64" height="24" style="width:100%;image-rendering:pixelated;margin:0 0 10px"></canvas>';
    if (rc.art === 'cover') h += '<canvas class="coverart" width="20" height="32" style="width:40%;image-rendering:pixelated;margin:0 0 10px"></canvas>';
    if (rc.big) h += '<h2>' + rc.big + '</h2>';
    if (rc.list && i === 4) h += '<ul>' + rc.list.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>';
    if (rc.k) h += '<p class="k">' + rc.k + '</p>';
    return h + '<div class="ft">' + moonSVG(18) + qr(location.origin + '/play.html#box=' + BOX.id) + '</div><i class="cut"></i>';
  }
  function dialArt(c) { var x = c.getContext('2d'); for (var i = 0; i < 64; i++) for (var j = 0; j < 24; j++) { var now = i < 32, n = noise(i / 4, j / 4, 3); x.fillStyle = TONES[now ? (n < 0.3 ? 'dust' : 'straw') : (n < 0.32 ? 'water' : n < 0.55 ? 'gum' : 'dry')]; x.fillRect(i, j, 1, 1); } x.fillStyle = '#111'; x.fillRect(32, 0, 1, 24); }
  function openBox() {
    slot.innerHTML = '<div class="r out" style="transition:none"><h2>' + BOX.headline + '</h2><p class="k">' + BOX.src + '</p><canvas class="coverart" width="20" height="32" style="width:30%;image-rendering:pixelated"></canvas><i class="cut"></i></div><button class="key" aria-label="your own"></button>';
    cover($('.coverart', slot)); irukSVG(function (s) { $('.key', slot).innerHTML = s.replace('<svg ', '<svg width="34" height="34" '); });
    slot.classList.add('on'); ri = -1; tick(520);
  }
  function nextReceipt() {
    var cur = slot.querySelector('.r.out'); if (cur) { cur.classList.add('gone'); cur.classList.remove('out'); setTimeout(function () { if (cur.parentNode) cur.parentNode.removeChild(cur); }, 900); }
    ri++; if (ri >= BOX.receipts.length) { $('.key', slot).classList.add('on'); tick(330); return; }
    var d = document.createElement('div'); d.className = 'r'; d.innerHTML = receiptHTML(BOX.receipts[ri], ri); slot.insertBefore(d, $('.key', slot));
    var c1 = $('.dialart', d); if (c1) dialArt(c1); var c2 = $('.coverart', d); if (c2) cover(c2);
    void d.offsetWidth; d.classList.add('out'); tick(500 + ri * 70);
  }
  function endBox() { slot.classList.remove('on'); slot.innerHTML = ''; var s = nextStage(); if (s) { F.hand.push(s); save(); } handShow(); horn(); shut(); }

  /* ───────── the hand: an unlock waiting to be put down, wherever the person chooses ───────── */
  var hand, hc;
  function handShow() {
    if (!F.hand.length) { hand.classList.remove('on'); return; } var st = stage(F.hand[0]); hand.classList.add('on');
    var x = hc.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, 40, 40); x.fillStyle = 'rgba(247,244,236,.94)'; x.beginPath(); x.arc(20, 20, 18, 0, 7); x.fill();
    x.strokeStyle = 'rgba(' + INK + ',.8)'; x.fillStyle = 'rgba(' + INK + ',.8)'; x.lineWidth = 1.2; x.lineCap = 'round'; mark(x, st.as, 20, 20, 4.2);
  }
  function handDrag(e) {
    if (!F.hand.length) return; e.preventDefault(); hand.classList.add('drag'); hand.setPointerCapture && hand.setPointerCapture(e.pointerId);
    var move = function (ev) { hand.style.left = ev.clientX + 'px'; hand.style.bottom = 'auto'; hand.style.top = (ev.clientY - 20) + 'px'; };
    var up = function (ev) {
      hand.removeEventListener('pointermove', move); hand.removeEventListener('pointerup', up); hand.classList.remove('drag'); hand.style.left = ''; hand.style.top = ''; hand.style.bottom = '';
      var i = Math.floor((ev.clientX - OX) / S), j = Math.floor((ev.clientY - OY) / S);
      if (ev.clientY < H - 70 && i >= 0 && j >= 0 && i < N && j < N) { farm().placed.push({ id: F.hand.shift(), x: i, y: j, t: Date.now() }); save(); tick(220); setTimeout(function () { tick(330); }, 120); growing = true; paint(true); }
      handShow();
    };
    move(e); hand.addEventListener('pointermove', move); hand.addEventListener('pointerup', up);
  }

  /* ───────── the finder: the nearest printer, its bearing and distance, turning with the phone ───────── */
  var PRINTERS = [[-37.769, 144.963], [-37.782166, 144.970341], [-37.7642, 144.961028], [-37.765917, 144.972855]];
  function find() {
    var go = function () { navigator.geolocation.getCurrentPosition(function (g) {
      var la = g.coords.latitude, lo = g.coords.longitude, best = null;
      PRINTERS.forEach(function (p) { var dy = (p[0] - la) * 111320, dx = (p[1] - lo) * 111320 * Math.cos(la * Math.PI / 180), d = Math.sqrt(dx * dx + dy * dy); if (!best || d < best.d) best = { d: d, b: Math.atan2(dx, dy) * 180 / Math.PI }; });
      var head = 0, set = function () { var n = $('#needle'); if (n) n.setAttribute('transform', 'rotate(' + (best.b - head) + ')'); var t = $('#dist'); if (t) t.textContent = best.d < 1000 ? Math.round(best.d) + ' m' : (best.d / 1000).toFixed(1) + ' km'; };
      set(); window.addEventListener('deviceorientation', function (o) { if (o.webkitCompassHeading != null) head = o.webkitCompassHeading; else if (o.alpha != null) head = 360 - o.alpha; set(); });
    }, function () { tick(180); }, { enableHighAccuracy: true, timeout: 15000 }); };
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then(go, go); else go();
  }

  /* ───────── start ───────── */
  function build() {
    document.body.innerHTML = '<canvas id="ground"></canvas><canvas id="life"></canvas><div id="rings"></div>' +
      WORDS.map(function (w) { return '<button class="blk" id="blk-' + w + '" data-w="' + w + '"><span class="in"><span class="f">' + w + '</span><span class="b">' + w + '</span></span></button>'; }).join('') +
      '<button id="ghost" aria-label="novel.global"><i class="ball"></i></button><div id="back"></div><div id="hand"><canvas width="80" height="80" style="width:40px;height:40px"></canvas></div><div id="slot"></div><div id="credit">Imagery © Esri, Maxar, Earthstar Geographics</div>';
    cv = $('#ground'); cx = cv.getContext('2d', { alpha: false }); life = $('#life'); lx = life.getContext('2d'); ghost = $('#ghost'); back = $('#back'); hand = $('#hand'); hc = $('canvas', hand); slot = $('#slot');
    irukSVG(function (s) { ghost.insertAdjacentHTML('afterbegin', s); });
    ghost.addEventListener('click', function (e) { e.stopPropagation(); press(); });
    $('#rings').addEventListener('click', function () { shut(); });
    [].forEach.call(document.querySelectorAll('.blk'), function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); flip(b.getAttribute('data-w')); }); });
    back.addEventListener('click', function (e) {
      e.stopPropagation(); var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
      if (t.classList.contains('boxk')) { shut(); openBox(); return; }
      if (t.hasAttribute('data-farm')) { F.cur = t.getAttribute('data-farm'); save(); loadFarm(); shut(); return; }
      if (t.hasAttribute('data-new')) { newFarm(); loadFarm(); shut(); return; }
      if (t.hasAttribute('data-find')) { find(); return; }
      if (t.hasAttribute('data-path')) { showBack('MAKE', [t.getAttribute('data-path')]); tick(760); return; }
      if (t.hasAttribute('data-stack')) { var st = store.get('ng.stack', [0, 0, 0, 0, 0]), i = +t.getAttribute('data-stack'); st[i] = st[i] ? 0 : 1; store.set('ng.stack', st); showBack('STACK', []); tick(st[i] ? 700 : 600); }
    });
    slot.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.key')) { endBox(); return; } if (ri < BOX.receipts.length) nextReceipt(); });
    hand.addEventListener('pointerdown', handDrag);
    var rs = 0; window.addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(size, 150); }); size(); loadFarm(); handShow();
    if (/box=/.test(location.hash)) openBox();
    /* one slow clock: the ghost 25 times a second, life 12, growth every second and a half; nothing behind an open box */
    var last = 0, lastPaint = 0, lastDrift = 0;
    (function frame() { requestAnimationFrame(frame); var t = Date.now(); if (slot.classList.contains('on')) return;
      if (t - lastDrift > 40) { lastDrift = t; drift(t); }
      if (cells && t - last > 80) { last = t; lifeFrame(t); }
      if (growing && t - lastPaint > 1500) { lastPaint = t; paint(false); } })();
  }
  function loadFarm() { cells = null; paint(true); readGround(farm()).then(function (c) { cells = c; growing = true; paint(true); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
