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

  /* ───────── the cards, as data: the same shape the engine's card takes (title, line, art layers, what it opens, its island) ───────── */
  var CARDS = [
    { id: 'wish', size: 'full', hero: 1, title: 'I W.I.S.H.', after: 'helps you tell stories of change', tag: 'STRATEGIC INNOVATION', key: 'MORE LIFE', opens: 'aura', island: 'novelglobal', art: 'rings', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'radio', size: 'full', title: 'DIRECT ACTION RADIO', line: 'Making music into events', opens: 'radio', island: 'novelglobal', art: 'radar', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'zine', size: 'half', title: 'PICKLES LANDSCAPE ZINE MAKER', arrow: 1, opens: 'stack:tall', island: 'pickles', art: 'strip', motion: 'shadow', where: [-37.8136, 144.9631] },
    { id: 'kit', size: 'half', lower: 1, title: 'unearth your own island', opens: 'kit', island: 'novelglobal', art: 'kit', motion: 'speed', where: [-37.8136, 144.9631] },
    { id: 'space', size: 'half', title: 'THIS SPACE IS YOURS', line: 'Archipelagos builder', opens: 'panel', island: 'novelglobal', art: 'isles', motion: 'shadow', where: [-37.8136, 144.9631] }
  ];
  var MOTION = store.get('da.hm.motion', null);   // null: each card's own; or 'shadow' / 'speed' for all

  /* ───────── the art: three layers to a card, back, middle and front, white line on the card's paper (placeholders until the art comes) ───────── */
  var svg = function (body, vb) { return '<svg viewBox="' + (vb || '0 0 400 600') + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + body + '</svg>'; };
  var rnd = function (seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  function grain(seed, n) { var r = rnd(seed), o = ''; for (var i = 0; i < n; i++) o += '<circle class="f" cx="' + (r() * 400).toFixed(1) + '" cy="' + (r() * 600).toFixed(1) + '" r="' + (0.4 + r() * 0.9).toFixed(2) + '"/>'; return o; }
  function wobble(pts, seed, amt) { var r = rnd(seed); return 'M' + pts.map(function (p) { return (p[0] + (r() - 0.5) * amt).toFixed(1) + ' ' + (p[1] + (r() - 0.5) * amt).toFixed(1); }).join('L'); }
  function ring(cx, cy, rx, ry, seed) { var pts = []; for (var i = 0; i <= 64; i++) { var a = i / 64 * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return '<path d="' + wobble(pts, seed, 2.2) + '"/>'; }
  var ART = {
    rings: function () { return [svg(grain(3, 160)), svg(ring(250, 330, 150, 60, 4) + ring(250, 330, 110, 150, 5) + ring(250, 330, 170, 110, 6)), svg('<circle class="f" cx="105" cy="300" r="4"/><circle class="f" cx="345" cy="380" r="3"/><circle class="f" cx="250" cy="182" r="3.5"/>')]; },
    radar: function () { var g = ''; for (var i = 0; i < 9; i++) g += '<path d="M0 ' + (i * 75) + 'H400M' + (i * 50) + ' 0V600" stroke-dasharray="1 6"/>';
      var dots = '', r = rnd(9); for (var k = 0; k < 12; k++) dots += '<circle class="f" cx="' + (90 + r() * 220).toFixed(0) + '" cy="' + (250 + r() * 220).toFixed(0) + '" r="2.4"/>';
      return [svg(g), svg(ring(200, 380, 150, 150, 11) + ring(200, 380, 95, 95, 12) + ring(200, 380, 45, 45, 13) + '<path d="M50 380H350M200 230V530"/>' + dots),
        svg('<g class="hm-sweep" style="transform-origin:200px 380px"><path d="M200 380L306 274" stroke-width="2"/><path d="M200 380L306 274A150 150 0 0 1 350 380Z" class="f" opacity=".12"/></g><path d="M188 362L216 380L188 398Z" stroke-width="2.4"/>')]; },
    strip: function () { var r = rnd(21), ridge = [], i; for (i = 0; i <= 40; i++) ridge.push([i * 10, 380 - Math.abs(Math.sin(i * 0.37) * 120) - r() * 30 - (i > 14 && i < 24 ? 90 - Math.abs(i - 19) * 14 : 0)]);
      return [svg('<rect x="30" y="80" width="340" height="440" rx="2" stroke-dasharray="2 5"/>' + grain(22, 90)), svg('<path d="' + wobble(ridge, 23, 3) + '"/><path d="' + wobble(ridge.map(function (p) { return [p[0], p[1] + 40]; }), 24, 4) + '" stroke-dasharray="2 4"/>'), svg('<path d="M60 470H340" stroke-width="3"/>')]; },
    kit: function () { return ['<img alt="" src="printer-top.jpg" loading="lazy">', svg('<path d="' + wobble([[20, 420], [120, 400], [200, 440], [300, 410], [390, 450]], 31, 6) + '" stroke-dasharray="1 5" stroke-width="2"/>'),
      svg('<rect x="230" y="300" width="120" height="80" rx="6"/><path d="M246 316h20v14h-20zM300 312h36M300 324h36M300 336h22"/><circle cx="246" cy="368" r="3"/><circle cx="334" cy="368" r="3"/>')]; },
    isles: function () { var r = rnd(41), o = ''; for (var i = 0; i < 9; i++) { var x = 40 + r() * 320, y = 160 + r() * 360, s = 8 + r() * 26; o += ring(x, y, s, s * 0.7, 50 + i); }
      return [svg(grain(42, 120)), svg(o), svg('<path d="M200 330v40M180 350h40" stroke-width="2.4"/>')]; }
  };

  /* ───────── the page ───────── */
  var root = D.createElement('div'); root.id = 'hm';
  root.innerHTML = '<header id="hm-top" aria-label="The reef"><canvas aria-hidden="true"></canvas><nav>' +
    '<button id="hm-theme" aria-label="Light or dark"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" class="f"/></svg></button></nav></header>' +
    '<div id="hm-reef" aria-hidden="true"><canvas></canvas></div>' +
    '<main id="hm-col">' + CARDS.map(cardHTML).join('') + '</main><nav class="hm-dots" aria-hidden="true">' + CARDS.map(function () { return '<i></i>'; }).join('') + '</nav>' +
    '<section id="hm-x" role="dialog" aria-modal="true" aria-label=""><header><button class="hm-back" aria-label="Back">‹</button><b></b></header><div class="hm-body"></div></section>' +
    '<section id="hm-sb" aria-label="Switchboard"><button class="grab" aria-label="The switchboard, larger or smaller"></button><span class="cb" aria-hidden="true"></span><button class="rs">RESET</button><div class="jk"></div></section>';
  D.body.appendChild(root);
  var col = $('#hm-col'), xv = $('#hm-x'), cards = $$('.hm-card', col);
  /* the cards as novel.global writes them on the approval page (CARDS): # a card, then its lines; the order they are written in */
  var OPENS = /^(aura|radio|kit|panel|stack:[a-z0-9-]{1,24})$/, KEYS = ['title', 'line', 'after', 'tag', 'key', 'island', 'opens', 'where', 'motion', 'art', 'size'], SKINS = ['wish', 'radio', 'zine', 'kit', 'space'];
  function applyCards(text) {
    if (!text) return; var order = [], hide = {};
    String(text).split(/\n(?=\s*#)/).forEach(function (blk) { var ls = blk.split('\n'), m = /^\s*#\s*([a-z0-9-]{1,24})\s*$/i.exec(ls[0] || ''); if (!m) return; var id = m[1].toLowerCase(), c = byId(id);
      if (!c) { c = { id: id, size: 'half', title: id.toUpperCase(), opens: 'panel', island: 'novelglobal', art: 'isles', motion: 'shadow', where: [-37.8136, 144.9631] }; CARDS.push(c); } order.push(id);
      ls.slice(1).forEach(function (l) { var kv = /^\s*([a-z]+)\s*(?::\s*(.*))?$/i.exec(l); if (!kv) return; var k = kv[1].toLowerCase(), v = (kv[2] || '').trim().slice(0, 120);
        if (k === 'hide') hide[id] = 1; else if (k === 'where') { var ll = v.split(',').map(Number); if (ll.length === 2 && ll.every(isFinite)) c.where = ll; }
        else if (k === 'opens') { if (OPENS.test(v)) c.opens = v; } else if (k === 'motion') { if (/^(shadow|speed)$/.test(v)) c.motion = v; } else if (k === 'art') { if (ART[v]) c.art = v; } else if (k === 'size') { if (/^(full|half)$/.test(v)) c.size = v; }
        else if (k === 'skin') { if (SKINS.indexOf(v) >= 0) c.skin = v; } else if (k === 'island') c.island = v.toLowerCase().replace(/[^a-z0-9-]/g, ''); else if (KEYS.indexOf(k) >= 0) c[k] = v; }); });
    CARDS.sort(function (a, b) { var i = order.indexOf(a.id), j = order.indexOf(b.id); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
    for (var i = CARDS.length - 1; i >= 0; i--) if (hide[CARDS[i].id]) CARDS.splice(i, 1);
    col.innerHTML = CARDS.map(cardHTML).join(''); cards = $$('.hm-card', col); $('.hm-dots').innerHTML = CARDS.map(function () { return '<i></i>'; }).join(''); radars(); lamps(); parallax();
  }
  fetch('/api/settings').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { applyCards(j.cards); }).catch(function () { /* the cards as they started */ });

  function cardHTML(c) {
    var art = (ART[c.art] || ART.isles)(), mo = MOTION || c.motion;
    var radar = '<button class="hm-rk" data-radar="' + c.id + '" hidden aria-label="Find its printer"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></svg></button>';
    var inner = c.hero
      ? '<h2 class="hm-t"><span class="box">' + esc(c.title) + '</span> ' + esc(c.after) + '</h2><p class="hm-tag">' + esc(c.tag) + '</p><span class="hm-lamps"></span><button class="hm-strip" data-strip hidden>TALL ↗</button><span class="hm-sp"></span>' +
        '<button class="hm-go" data-open="' + c.id + '"><span class="ph"></span><b>' + esc(c.key) + '</b><i class="hm-arrow">→</i></button>'
      : '<h2 class="hm-t' + (c.lower ? ' lc' : '') + '">' + esc(c.title) + (c.arrow ? ' <span class="hm-arrow">→</span>' : '') + '</h2>' + (c.line ? '<p class="hm-line">' + esc(c.line) + '</p>' : '') + '<span class="hm-lamps"></span><span class="hm-sp"></span>';
    return '<article class="hm-card ' + c.size + (c.hero ? ' hero' : '') + ' ' + mo + ' sk-' + (c.skin || c.id) + '" data-id="' + c.id + '" aria-label="' + esc(c.title) + '">' +
      '<div class="hm-art">' + ['b', 'm', 't'].map(function (k, i) { return '<div class="hm-l ' + k + '">' + art[i] + '</div>'; }).join('') + '</div>' +
      (c.hero ? '' : '<button class="hm-open" data-open="' + c.id + '" aria-label="Open ' + esc(c.title) + '"></button>') +
      '<div class="hm-keys">' + radar + '</div><div class="hm-in">' + inner + '</div><div class="hm-bcn" hidden></div></article>';
  }
  var byId = function (id) { return CARDS.filter(function (c) { return c.id === id; })[0]; };

  /* ───────── motion: the three layers move at three speeds as the column scrolls, inside the card's own art ───────── */
  var DEPTH = { shadow: [0.05, 0.12, 0.2], speed: [0.1, 0.26, 0.46] }, tick = 0;
  function parallax() {
    tick = 0; var vh = innerHeight;
    cards.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom < -40 || r.top > vh + 40) return;
      var p = Math.max(-1.2, Math.min(1.2, (r.top + r.height / 2 - vh / 2) / vh)), d = DEPTH[el.classList.contains('speed') ? 'speed' : 'shadow'], ls = el.querySelectorAll('.hm-l');
      for (var i = 0; i < ls.length; i++) ls[i].style.transform = RM.matches ? '' : 'translate3d(0,' + (p * d[i] * r.height).toFixed(1) + 'px,0)'; });
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
    body.innerHTML = '<ol class="hm-list">' + list.map(function (s) { if (!s) return '<li class="gap" aria-hidden="true"></li>';
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
    var a = AU(), dark = a && a.dark ? a.dark() : false, mo = MOTION || 'own';
    body.innerHTML = '<p class="hm-h">MOTION</p><div class="hm-row">' + [['own', 'EACH CARD'], ['shadow', 'SHADOW'], ['speed', 'SPEED']].map(function (m) { return '<button class="hm-btn' + (mo === m[0] ? ' on' : '') + '" data-mo="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>' +
      '<p class="hm-h">LIGHT</p><div class="hm-row"><button class="hm-btn' + (dark ? '' : ' on') + '" data-dk="0">DAY</button><button class="hm-btn' + (dark ? ' on' : '') + '" data-dk="1">NIGHT</button></div>' +
      '<p class="hm-h">SWITCHBOARD</p><div class="hm-row"><button class="hm-btn" id="hm-rewire">AS IT STARTED</button></div>' +
      '<div id="hm-keeper"></div><p class="hm-h">THE NETWORK</p><ol class="hm-list hm-isles"><li>· · ·</li></ol>';
    $$('[data-mo]', body).forEach(function (b) { b.addEventListener('click', function () { MOTION = b.dataset.mo === 'own' ? null : b.dataset.mo; store.set('da.hm.motion', MOTION); find('style'); cards.forEach(function (el) { var c = byId(el.dataset.id); el.classList.remove('shadow', 'speed'); el.classList.add(MOTION || c.motion); }); $$('[data-mo]', body).forEach(function (q) { q.classList.toggle('on', q === b); }); beep(550, 0.05); }); });
    $$('[data-dk]', body).forEach(function (b) { b.addEventListener('click', function () { var aa = AU(); if (aa && aa.dark) aa.dark(b.dataset.dk === '1'); $$('[data-dk]', body).forEach(function (q) { q.classList.toggle('on', q === b); }); }); });
    $('#hm-rewire', body).addEventListener('click', function () { WIRES = START.slice(); saveWires(); drawCables(); lamps(); beep(440, 0.08); });
    keeperIn($('#hm-keeper', body));
    partners(true).then(function (l) { var ol = $('.hm-isles', body); if (ol) ol.innerHTML = l.length ? l.map(function (p) { return '<li class="' + (p.ready ? 'on' : '') + '"><i></i><span>' + esc(p.name || p.id) + (p.number ? ' · ' + p.number : '') + '</span></li>'; }).join('') : '<li>—</li>'; });
  }

  /* an island keeper's own controls: their key (from the welcome slip) opens their one island, nothing else */
  function keeperIn(box) {
    var key = store.get('da.hm.key', ''); if (!key || !box) return;
    var call = function (o) { return fetch('/api/island', Object.assign({ headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' } }, o || {})).then(function (r) { if (r.status === 401) { store.set('da.hm.key', ''); throw new Error('key'); } return r.json(); }); };
    var fill = function (p) { box.innerHTML = '<p class="hm-h">YOUR ISLAND' + (p.number ? ' · ' + p.number : '') + '</p><ol class="hm-list hm-isles"><li class="' + (p.ready ? 'on' : '') + '"><i></i><span>' + esc(p.name) + ' · ' + p.queued + ' WAITING · ' + p.printed + ' PRINTED</span></li></ol>' +
      '<p class="hm-h">CONNECTIONS</p><div class="hm-row">' + (p.all || []).map(function (k) { return '<button class="hm-btn' + ((p.links || []).indexOf(k) >= 0 ? ' on' : '') + '" data-ln="' + k + '" aria-pressed="' + ((p.links || []).indexOf(k) >= 0) + '">' + ({ wish: 'W.I.S.H.', radio: 'RADIO', art: 'ART', words: 'WORDS', cards: 'CARDS', codes: 'CODES' }[k] || k.toUpperCase()) + '</button>'; }).join('') + '</div>' +
      '<div class="hm-row"><button class="hm-btn" data-rn>RENAME</button><button class="hm-btn" data-out>FORGET THIS KEY</button></div>';
      $$('[data-ln]', box).forEach(function (b) { b.addEventListener('click', function () { var l = (p.links || []).slice(), k = b.dataset.ln, i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k); call({ method: 'POST', body: JSON.stringify({ links: l }) }).then(fill); beep(i >= 0 ? 330 : 660, 0.05); }); });
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
  function radars() { cards.forEach(function (el) { var c = byId(el.dataset.id), p = PRN.filter(function (q) { return q.id === c.island; })[0], k = el.querySelector('[data-radar]'); if (k) k.hidden = !(p && p.ready); }); }
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

  /* ───────── the Irukandji: a clear box bell the size of a fingernail, four long tentacles beaded with stinging cells, swimming in pulses ───────── */
  var top = $('#hm-top'), tcv = top.querySelector('canvas'), tx = tcv.getContext('2d'), dpr = 1;
  function topSize() { dpr = Math.min(2, devicePixelRatio || 1); tcv.width = Math.round(tcv.clientWidth * dpr); tcv.height = Math.round(tcv.clientHeight * dpr); }
  /* the Irukandji as it is in the water: a clear box bell, its crown ahead, four long fine tentacles from the rim's corners trailing almost
     straight behind, beaded with stinging cells only near the bell, and a faint eye in the middle that sees everything. It drifts slowly,
     crown first, and comes round again from the other side (each tentacle is laid out from the rim, never sprung, so nothing can spin) */
  var J = { x: 120, y: 24, a: Math.PI - 0.18, ph: 0, blink: 0, pulse: 0, sp: 3, drift: 0 }, NT = 44;
  function swim(dt, w, h) {
    J.ph += dt / 3.6; var c = J.ph % 1, p = c < 0.3 ? Math.sin(c / 0.3 * Math.PI) : 0; J.pulse = p;
    J.drift += dt; J.a = Math.PI - 0.16 + Math.sin(J.drift * 0.11) * 0.22;
    J.sp += (2 + p * 7 - J.sp) * Math.min(1, dt * 1.4);
    J.x += Math.cos(J.a) * J.sp * dt; J.y += Math.sin(J.a) * J.sp * dt + (h * 0.5 - J.y) * dt * 0.12;
    if (J.x < -30) { J.x = w + 30; J.y = h * (0.35 + Math.random() * 0.3); }
  }
  function tentacles(t) {
    var back = J.a + Math.PI, out = [], sq = 1 - J.pulse * 0.12;
    for (var i = 0; i < 4; i++) {
      var f = [-1, -0.42, 0.42, 1][i], side = J.a + Math.PI / 2;
      var rx = J.x - Math.cos(J.a) * 7.5 + Math.cos(side) * f * 5.4 * sq, ry = J.y - Math.sin(J.a) * 7.5 + Math.sin(side) * f * 5.4 * sq;
      var pts = [[rx, ry]], ang = back + f * 0.05;
      for (var j = 1; j < NT; j++) { var k = j / NT; ang += Math.sin(t * 0.35 - j * 0.12 + i * 1.9) * 0.006 + 0.0012 * k; pts.push([pts[j - 1][0] + Math.cos(ang) * 5, pts[j - 1][1] + Math.sin(ang) * 5]); }
      out.push(pts);
    }
    return out;
  }
  function drawJelly(g, s, t) {
    g.save(); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    var line = function (pts, w, a) { g.strokeStyle = 'rgba(236,243,250,' + a + ')'; g.lineWidth = w; g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); };
    var dot = function (x, y, r, a) { g.fillStyle = 'rgba(236,243,250,' + a + ')'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    tentacles(t).forEach(function (pts, i) { var far = i === 1 || i === 2; line(pts, far ? 0.45 : 0.65, far ? 0.32 : 0.55);
      for (var j = 1; j < NT * 0.2; j++) dot(pts[j][0], pts[j][1], 0.55, far ? 0.4 : 0.7); });
    /* the bell: a box with rounded shoulders, the crown ahead, the rim behind a little narrower, its corners turned out where the tentacles go */
    var p = J.pulse, L = 15 * (1 + p * 0.05), W = 6.4 * (1 - p * 0.12);
    g.translate(J.x, J.y); g.rotate(J.a);
    var bell = new Path2D(); bell.moveTo(-L * 0.5, -W * 0.86); bell.lineTo(L * 0.22, -W); bell.bezierCurveTo(L * 0.5, -W * 1.02, L * 0.56, -W * 0.5, L * 0.56, 0); bell.bezierCurveTo(L * 0.56, W * 0.5, L * 0.5, W * 1.02, L * 0.22, W); bell.lineTo(-L * 0.5, W * 0.86); bell.quadraticCurveTo(-L * 0.44, 0, -L * 0.5, -W * 0.86);
    g.fillStyle = 'rgba(214,228,242,.10)'; g.fill(bell); g.strokeStyle = 'rgba(236,243,250,.55)'; g.lineWidth = 0.7; g.stroke(bell);
    /* the light along its shoulders and the rim's corners turned out */
    g.strokeStyle = 'rgba(244,248,252,.85)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-L * 0.3, -W * 0.9); g.lineTo(L * 0.2, -W * 0.98); g.quadraticCurveTo(L * 0.46, -W * 0.96, L * 0.53, -W * 0.45); g.stroke();
    g.strokeStyle = 'rgba(236,243,250,.5)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-L * 0.5, -W * 0.86); g.lineTo(-L * 0.62, -W * 0.92); g.moveTo(-L * 0.5, W * 0.86); g.lineTo(-L * 0.62, W * 0.92); g.stroke();
    /* inside: the stomach's thread down the middle, a faint inner wall */
    g.strokeStyle = 'rgba(236,243,250,.3)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(L * 0.42, 0); g.quadraticCurveTo(0, W * 0.12, -L * 0.45, 0); g.moveTo(L * 0.18, -W * 0.7); g.quadraticCurveTo(-L * 0.1, -W * 0.62, -L * 0.42, -W * 0.68); g.stroke();
    /* the eye: faint, in the middle of the bell, seeing everything; it closes now and then, and when touched */
    var bk = J.blink > 0 ? 0.1 : Math.min(1, Math.abs(((t + 2.2) % 9.1) - 0.16) / 0.16), eh = W * 0.42 * Math.max(0.1, bk), ew = L * 0.2;
    g.strokeStyle = 'rgba(244,248,252,.32)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-ew + L * 0.05, 0); g.quadraticCurveTo(L * 0.05, -eh * 1.6, ew + L * 0.05, 0); g.quadraticCurveTo(L * 0.05, eh * 1.6, -ew + L * 0.05, 0); g.stroke();
    if (bk > 0.3) { g.beginPath(); g.arc(L * 0.05, 0, eh * 0.62, 0, 7); g.stroke(); dot(L * 0.05, 0, eh * 0.28, 0.4); }
    g.restore();
  }
  function bellHit(cx, cy) { var r = tcv.getBoundingClientRect(), sx = r.width / Math.max(1, VW), x = (cx - r.left) / sx, y = (cy - r.top) / sx; return Math.hypot(x - J.x, y - J.y) < 22; }
  var VW = 360, VH = 52;
  /* the eye: the fog horn. Held: a quick photograph, printed */
  var hold = null, held = false;
  top.addEventListener('pointerdown', function (e) { if (e.target.closest('nav')) return; held = false; if (bellHit(e.clientX, e.clientY)) hold = setTimeout(function () { held = true; hold = null; J.blink = 0.4; quickPrint(); }, 650); });
  top.addEventListener('pointerup', function () { if (hold) { clearTimeout(hold); hold = null; } });
  top.addEventListener('pointerleave', function () { if (hold) { clearTimeout(hold); hold = null; } });
  top.addEventListener('click', function (e) { if (e.target.closest('nav')) return; if (held) { held = false; return; }
    if (bellHit(e.clientX, e.clientY)) { J.blink = 0.25; horn(); J.sp += 4; return; }
    if (away) { history.back(); return; } reef(!root.classList.contains('reef')); });
  $('#hm-theme').addEventListener('click', function (e) { e.stopPropagation(); var a = AU(); if (a && a.dark) a.dark(!a.dark()); beep(520, 0.05); });

  /* ───────── the reef: white line on the water, alive to a touch (placeholder for the game to come) ───────── */
  var rf = $('#hm-reef'), rcv = rf.querySelector('canvas'), rx = rcv.getContext('2d'), RB = null, RW = 0, RH = 0, PT = { x: -999, y: -999, vx: 0, vy: 0, t: 0 };
  var FISH = [], SNOW = [], WORMS = [], SNAKE = { x: -120, y: 0, t: 0 }, SLUG = { u: 0.15, gill: 1 }, RIP = [];
  function reef(on) { root.classList.toggle('reef', on); top.setAttribute('aria-expanded', String(on)); if (on) { reefSize(); beep(220, 0.12); } }
  function reefSize() {
    var w = rf.clientWidth || innerWidth, h = Math.min(innerHeight * 0.68, 640); if (w === RW && h === RH && RB) return; RW = w; RH = h;
    rcv.width = Math.round(w * dpr); rcv.height = Math.round(h * dpr); rcv.style.height = h + 'px';
    RB = D.createElement('canvas'); RB.width = rcv.width; RB.height = rcv.height; var g = RB.getContext('2d'), r = rnd(77), sea = h * 0.74; g.scale(dpr, dpr);
    g.strokeStyle = 'rgba(244,241,232,.85)'; g.lineWidth = 1.2; g.lineCap = 'round'; g.lineJoin = 'round';
    var line = function (pts, j) { g.beginPath(); pts.forEach(function (p, i) { var x = p[0] + (r() - 0.5) * (j || 1.5), y = p[1] + (r() - 0.5) * (j || 1.5); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); };
    var bed = []; for (var x = 0; x <= w; x += 8) bed.push([x, sea + Math.sin(x * 0.03) * 3 + (r() - 0.5) * 3]); line(bed, 0.5);
    for (var a = 0; a < w; a += 70 + r() * 40) { g.beginPath(); g.moveTo(a, sea + 4); g.bezierCurveTo(a, sea + 50 + r() * 40, a + 50, sea + 50 + r() * 40, a + 50, sea + 4); g.stroke(); }
    /* dead staghorn: forks, broken tips */
    (function branch(x0, y0, ang, len, d) { if (d > 6 || len < 6) return; var x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len; line([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2], [x1, y1]], 2); if (r() < 0.82) branch(x1, y1, ang - 0.35 - r() * 0.3, len * 0.78, d + 1); if (r() < 0.7) branch(x1, y1, ang + 0.3 + r() * 0.3, len * 0.72, d + 1); })(w * 0.18, sea, -Math.PI / 2, h * 0.16, 0);
    /* the bommie: a dome with brain grooves */
    var bx = w * 0.5, bw2 = Math.min(w * 0.22, 140), bh = h * 0.2; g.beginPath(); g.moveTo(bx - bw2, sea); g.bezierCurveTo(bx - bw2, sea - bh * 1.2, bx + bw2, sea - bh * 1.3, bx + bw2, sea); g.stroke();
    for (var k = 1; k < 5; k++) { var pts = []; for (var q = 0; q <= 20; q++) { var u = q / 20, xx = bx - bw2 * (1 - k * 0.18) + u * 2 * bw2 * (1 - k * 0.18); pts.push([xx, sea - bh * (1 - k * 0.2) * Math.sin(u * Math.PI) * 0.9 + Math.sin(u * 30) * 2]); } g.globalAlpha = 0.45; line(pts, 1); g.globalAlpha = 1; }
    WORMS = []; for (var wi = 0; wi < 6; wi++) { var u2 = 0.18 + wi * 0.13; WORMS.push({ x: bx - bw2 + u2 * 2 * bw2, y: sea - bh * 1.1 * Math.sin(u2 * Math.PI) * 0.75, out: 1, hue: wi }); }
    /* a sea fan, a plate, a starfish on the rubble */
    var fx = w * 0.84; for (var f = 0; f < 9; f++) line([[fx, sea], [fx + (f - 4) * 6, sea - h * 0.12], [fx + (f - 4) * 12, sea - h * 0.2 - r() * 10]], 2);
    var sx2 = w * 0.33, sy = sea + 22; g.beginPath(); for (var s2 = 0; s2 <= 10; s2++) { var an = s2 / 10 * Math.PI * 2 - Math.PI / 2, rr = s2 % 2 ? 4 : 11; g[s2 ? 'lineTo' : 'moveTo'](sx2 + Math.cos(an) * rr, sy + Math.sin(an) * rr); } g.closePath(); g.stroke();
    g.beginPath(); g.ellipse(w * 0.68, sea - 6, 30, 5, -0.08, 0, Math.PI * 2); g.stroke();
    FISH = []; for (var fi = 0; fi < 9; fi++) FISH.push({ x: r() * w, y: h * (0.2 + r() * 0.35), a: r() < 0.5 ? 0 : Math.PI, v: 14 + r() * 10, s: 0.7 + r() * 0.6, w: r() * 6 });
    SNOW = []; for (var si2 = 0; si2 < 80; si2++) SNOW.push({ x: r() * w, y: r() * h, vx: 0, vy: 4 + r() * 6, r: 0.4 + r() * 1 });
    SNAKE.y = h * 0.45; SLUG.bx = bx; SLUG.bw = bw2; SLUG.bh = bh; SLUG.sea = sea;
  }
  function drawReef(dt, t) {
    var g = rx, w = RW, h = RH; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, rcv.width, rcv.height); g.drawImage(RB, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = 'round'; g.lineJoin = 'round'; PT.vx *= 0.9; PT.vy *= 0.9; var near = function (x, y, d) { return Math.hypot(x - PT.x, y - PT.y) < d; };
    g.fillStyle = 'rgba(244,241,232,.55)'; SNOW.forEach(function (s) { var dx = s.x - PT.x, dy = s.y - PT.y, d = Math.hypot(dx, dy); if (d < 90) { s.vx += PT.vx * 0.02 + dx / d * 0.6; s.vy += PT.vy * 0.02 + dy / d * 0.6; } s.vx *= 0.96; s.vy += (5 - s.vy) * 0.02; s.x += s.vx * dt; s.y += s.vy * dt; if (s.y > h) { s.y = -2; s.x = Math.random() * w; } if (s.x < 0) s.x += w; if (s.x > w) s.x -= w; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); });
    g.strokeStyle = 'rgba(244,241,232,.9)'; g.lineWidth = 1.1;
    WORMS.forEach(function (o) { var want = near(o.x, o.y, 70) ? 0 : 1; o.out += (want - o.out) * (want ? 0.02 : 0.25); if (o.out < 0.05) return; g.beginPath(); for (var i = 0; i < 6; i++) { var yy = o.y - i * 3.2 * o.out, ww = (6 - i) * 1.3 * o.out; g.moveTo(o.x - ww, yy); g.lineTo(o.x + ww, yy - 2 * o.out); } g.stroke(); });
    FISH.forEach(function (f) { if (near(f.x, f.y, 100)) { var aw = Math.atan2(f.y - PT.y, f.x - PT.x); f.a += Math.atan2(Math.sin(aw - f.a), Math.cos(aw - f.a)) * 0.2; f.v = Math.min(80, f.v + 6); } else { f.v += (16 - f.v) * 0.02; f.a += Math.sin(t * 0.7 + f.w) * 0.004; }
      if (f.y < 20) f.a += 0.05; if (f.y > h * 0.62) f.a -= 0.05; f.x += Math.cos(f.a) * f.v * dt; f.y += Math.sin(f.a) * f.v * dt * 0.5; if (f.x < -20) f.x = w + 20; if (f.x > w + 20) f.x = -20;
      g.save(); g.translate(f.x, f.y); g.rotate(f.a); g.scale(f.s, f.s); var wag = Math.sin(t * 9 + f.w) * 2.5; g.beginPath(); g.moveTo(9, 0); g.quadraticCurveTo(0, -5, -8, 0); g.quadraticCurveTo(0, 5, 9, 0); g.moveTo(-8, 0); g.lineTo(-14, -4 + wag); g.lineTo(-13, 4 + wag); g.lineTo(-8, 0); g.stroke(); g.beginPath(); g.arc(5, -1, 0.9, 0, 7); g.fillStyle = INK; g.fill(); g.restore(); });
    SNAKE.t += dt; SNAKE.x += dt * 16; if (SNAKE.x > w + 200) SNAKE.x = -200; var sy0 = SNAKE.y + Math.sin(SNAKE.t * 0.3) * 20;
    g.lineWidth = 2.2; for (var b = 0; b < 22; b++) { var x0 = SNAKE.x - b * 6, y0 = sy0 + Math.sin(SNAKE.t * 3 - b * 0.45) * 6, x1 = x0 - 6, y1 = sy0 + Math.sin(SNAKE.t * 3 - (b + 1) * 0.45) * 6; g.globalAlpha = b % 2 ? 0.95 : 0.35; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } g.globalAlpha = 1; g.lineWidth = 1.1;
    if (SLUG.bx) { SLUG.u += dt * 0.004; if (SLUG.u > 0.85) SLUG.u = 0.15; var ux = SLUG.bx - SLUG.bw + SLUG.u * 2 * SLUG.bw, uy = SLUG.sea - SLUG.bh * 1.15 * Math.sin(SLUG.u * Math.PI) * 0.92 - 3; SLUG.gill += ((near(ux, uy, 60) ? 0 : 1) - SLUG.gill) * 0.1;
      g.beginPath(); g.ellipse(ux, uy, 10, 3.2, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(ux + 8, uy - 2); g.lineTo(ux + 11, uy - 7); g.moveTo(ux + 6, uy - 2); g.lineTo(ux + 7, uy - 7); for (var gi = 0; gi < 4; gi++) { g.moveTo(ux - 6, uy - 2); g.lineTo(ux - 6 + Math.cos(-2 - gi * 0.35) * 6 * SLUG.gill, uy - 2 + Math.sin(-2 - gi * 0.35) * 6 * SLUG.gill); } g.stroke(); }
    RIP = RIP.filter(function (q) { q.r += dt * 120; q.a -= dt * 1.4; if (q.a <= 0) return false; g.globalAlpha = q.a; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.stroke(); g.globalAlpha = 1; return true; });
  }
  var pt = function (e) { var r = rcv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  rf.addEventListener('pointermove', function (e) { var p = pt(e); PT.vx = (p[0] - PT.x) * 2; PT.vy = (p[1] - PT.y) * 2; PT.x = p[0]; PT.y = p[1]; });
  rf.addEventListener('pointerdown', function (e) { var p = pt(e); PT.x = p[0]; PT.y = p[1]; RIP.push({ x: p[0], y: p[1], r: 2, a: 0.8 }); beep(180 + Math.random() * 120, 0.08); });
  rf.addEventListener('pointerleave', function () { PT.x = PT.y = -999; });

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
  jk.innerHTML = SLOTS.map(function (s) { var on = found(s[0]); return '<div class="sl' + (on ? '' : ' lk') + '" data-s="' + s[0] + '"' + (on ? ' data-n="' + s[1] + '" title="' + s[1] + '"' : '') + '><span class="g" aria-hidden="true"><svg viewBox="0 0 24 24">' + s[3] + '</svg><i class="led"></i></span><button class="j" data-j="' + s[0] + '" aria-label="' + (on ? s[1] : 'Not found yet') + '"></button></div>'; }).join('') + '<svg class="cab" aria-hidden="true"></svg>';
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
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; requestAnimationFrame(frame); if (D.hidden) return;
    var w = tcv.clientWidth, h = tcv.clientHeight; if (Math.round(w * dpr) !== tcv.width || Math.round(h * dpr) !== tcv.height) topSize(); VW = w; VH = h;
    if (!RM.matches) swim(dt, w, h); J.blink = Math.max(0, J.blink - dt);
    tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, tcv.width, tcv.height); drawJelly(tx, dpr, now / 1000);
    if (root.classList.contains('reef') && !away && RB) drawReef(RM.matches ? 0 : dt, now / 1000);
  }
  requestAnimationFrame(frame);
  requestAnimationFrame(function () { parallax(); drawCables(); lamps(); if (/[?&]panel\b/.test(location.search)) { history.replaceState(null, '', location.pathname); open('space'); } });
  window.HOME = { open: open, home: home, wired: wired, find: find, wires: function () { return WIRES.slice(); }, reef: reef, cards: CARDS };
})();
