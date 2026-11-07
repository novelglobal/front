/* novel.global, an island's experience played from its stack: blocks as data (stacks/<id>.json), the same on any printer of the
   network. The first is TALL: a photograph blown up into a strip of paper 300 mm long, moved by hand, with a line of words down its
   length in white or black. Permissions: novel.global may always play an island's experience and print on its printer; the island's
   own experiences print on novel.global's printer only once novel.global has made it TWO-WAY (the approval page) */
(function () {
  'use strict';
  var T = window.THERMAL, $ = function (s) { return document.querySelector(s); };
  var CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var code = function () { var s = 'DA-'; var r = new Uint8Array(4); crypto.getRandomValues(r); for (var i = 0; i < 4; i++) s += CROCK[r[i] % 32]; return s; };
  var api = function (p, o) { return fetch('/api' + p, Object.assign({ headers: { 'content-type': 'application/json' } }, o || {})).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); }); };
  var word = function (p) { return String(p.name || p.id).trim().split(/\s+/)[0].toUpperCase(); };

  /* the blocks this player knows; a block of another kind is left out, never run */
  var S = { stack: null, img: null, turn: 0, ox: 0.5, oy: 0.5, ink: 'white', words: '', to: null, prns: [], W: 512, H: 2126 };
  /* the poster is landscape: made upright on dcv (300 mm across, the paper's width high), turned a quarter onto pcv to print down the
     strip. A wide screen shows it as it is read, a phone as the paper comes out */
  var dcv, dcx, pcv, pcx, cv, stage, ditherT = 0, WIDE = window.matchMedia('(min-width: 640px)');
  var block = function (k) { return (S.stack.blocks || []).filter(function (b) { return b.k === k; })[0] || null; };
  var DW = function () { return S.H; }, DH = function () { return S.W; };

  function size() {
    var st = block('strip') || { mm: [72, 300] }, g = T.grid((S.stack.printer || {}).dots || 512), mm = st.mm || [72, 300];
    S.W = g.dots; S.H = Math.round(mm[1] / 25.4 * g.dpi); dcv.width = DW(); dcv.height = DH(); pcv.width = S.W; pcv.height = S.H; view();
  }
  function view() {
    var c = WIDE.matches ? dcv : pcv; if (cv === c) return; if (cv) cv.remove(); cv = c; stage.insertBefore(cv, stage.firstChild);
    stage.classList.toggle('wide', WIDE.matches); stage.style.aspectRatio = cv.width + ' / ' + cv.height;
  }
  /* how far the photograph overhangs the poster, across and down, at the turn and size it is drawn */
  function fit() {
    var im = S.img, q = S.turn % 2, rw = q ? im.height : im.width, rh = q ? im.width : im.height, s = Math.max(DW() / rw, DH() / rh);
    return { s: s, ex: rw * s - DW(), ey: rh * s - DH() };
  }
  function photo() {
    var W = DW(), H = DH(), f = fit(), im = S.img;
    dcx.save(); dcx.fillStyle = '#fff'; dcx.fillRect(0, 0, W, H);
    dcx.translate(W / 2 + (0.5 - S.ox) * f.ex, H / 2 + (0.5 - S.oy) * f.ey); dcx.rotate(S.turn * Math.PI / 2);
    dcx.drawImage(im, -im.width * f.s / 2, -im.height * f.s / 2, im.width * f.s, im.height * f.s); dcx.restore();
  }
  /* the dots: the measured curve, then the dither the picture asks for */
  function dots() {
    var W = DW(), H = DH(), id = dcx.getImageData(0, 0, W, H), d = id.data, L = new Float32Array(W * H), lut = T.curve(T.CAL), i;
    for (i = 0; i < W * H; i++) L[i] = lut[Math.round(d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114)];
    T.dots(L, W, H, T.pick(L, W, H)); for (i = 0; i < W * H; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = L[i]; d[i * 4 + 3] = 255; }
    dcx.putImageData(id, 0, 0);
  }
  /* the words, one line across, solid ink over the dots */
  function words() {
    var t = S.words.trim(); if (!t) return; var W = DW(), H = DH(), face = '"Avenir Next", "Century Gothic", Futura, "Helvetica Neue", Arial, sans-serif';
    dcx.save(); dcx.font = '300 100px ' + face; var w = dcx.measureText(t).width || 1, px = Math.min(100 * W * 0.86 / w, H * 0.46 / 0.72);
    dcx.font = '300 ' + Math.round(px) + 'px ' + face; dcx.fillStyle = S.ink === 'black' ? '#000' : '#fff'; dcx.textAlign = 'center'; dcx.textBaseline = 'middle';
    dcx.fillText(t, W / 2, H / 2); dcx.restore();
  }
  /* the poster turned a quarter, clockwise, onto the strip: its words read down the paper */
  function turnOut() { pcx.save(); pcx.translate(S.W, 0); pcx.rotate(Math.PI / 2); pcx.drawImage(dcv, 0, 0); pcx.restore(); }
  /* drawn at once in colour while the hand moves it; its dots a moment after */
  function draw(now) {
    if (!S.img) { dcx.fillStyle = '#fff'; dcx.fillRect(0, 0, DW(), DH()); words(); turnOut(); return; }
    photo(); words(); turnOut(); clearTimeout(ditherT);
    var fin = function () { photo(); dots(); words(); turnOut(); };
    if (now) fin(); else ditherT = setTimeout(fin, 160);
  }

  function take(file) {
    if (!file) return; var u = URL.createObjectURL(file), im = new Image();
    im.onload = function () { S.img = im; S.turn = 0; S.ox = S.oy = 0.5; stage.classList.add('has'); draw(true); keys(); };
    im.src = u;
  }
  /* a hand's move on the screen, as a move on the poster: on a phone the paper is shown turned, so down the screen is across the poster */
  function move(dx, dy) {
    if (!S.img) return; var f = fit(), k = cv.width / cv.clientWidth, px = WIDE.matches ? dx * k : dy * k, py = WIDE.matches ? dy * k : -dx * k;
    if (f.ex > 1) S.ox = Math.max(0, Math.min(1, S.ox - px / f.ex));
    if (f.ey > 1) S.oy = Math.max(0, Math.min(1, S.oy - py / f.ey));
    draw(false);
  }

  function keys() {
    var go = $('#go'); if (go) go.disabled = !S.img || !S.to;
    [].forEach.call(document.querySelectorAll('#to button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === S.to)); });
  }
  /* where it may print: its own island always; novel.global's printer once the island is two-way, or always when played on novel.global */
  var IN = /[?&]in=1/.test(location.search);
  function printers() {
    return api('/partners').then(function (j) {
      var l = j.partners || [], isl = l.filter(function (p) { return p.id === S.stack.island && p.paired; })[0], ng = l.filter(function (p) { return p.id === 'novelglobal'; })[0];
      var to = (block('print') || {}).to || ['island'];
      S.prns = [].concat(isl && to.indexOf('island') >= 0 ? [isl] : [], ng && to.indexOf('novelglobal') >= 0 && (IN || (isl && isl.two)) ? [ng] : []);
      S.to = S.prns.length ? S.prns[0].id : null; $('#led').classList.toggle('on', !!(isl && isl.ready));
      $('#to').innerHTML = S.prns.length > 1 ? S.prns.map(function (p) { return '<button type="button" data-p="' + p.id + '"><i class="led' + (p.ready ? ' on' : '') + '"></i>' + word(p) + '</button>'; }).join('') : '';
      keys();
    }).catch(function () { S.prns = []; S.to = null; keys(); });
  }
  function print() {
    var go = $('#go'), st = $('#st'); if (!S.img || !S.to) return; go.disabled = true; draw(true);
    var w = S.stack.where || [0, 0], c = code(), body = { type: 'stack', stack: S.stack.id, text: S.words.trim().slice(0, 60), lat: w[0], lng: w[1] };
    st.textContent = '· · ·';
    api('/stories', { method: 'POST', body: JSON.stringify({ kind: 'record', code: c, body: JSON.stringify(body), lat: w[0], lng: w[1], dest: S.to, escpos: T.raster(pcv, 0), from: S.stack.id, stage: 'stack' }) })
      .then(function () { st.textContent = c; }, function () { st.textContent = '×'; }).then(function () { go.disabled = false; });
  }

  function build() {
    var x = $('#x'), wd = block('words') || {}, ph = block('photo') || {};
    $('#nm').textContent = S.stack.name || S.stack.id;
    x.insertAdjacentHTML('beforeend', '<div class="desk"><div class="stage" id="stage"><label class="add" aria-label="Photo">+<input type="file" accept="image/*"></label></div>' +
      '<div class="side">' + (block('words') ? '<input id="w" maxlength="' + (wd.max || 22) + '" aria-label="Words" autocomplete="off" spellcheck="false">' : '') +
      '<div class="row">' + (ph.from ? '<button type="button" id="ph" aria-label="Another photo">+</button>' : '') + '<button type="button" id="turn" aria-label="Turn">↻</button>' +
      (wd.ink && wd.ink.length > 1 ? '<button type="button" id="ink" aria-label="White or black words"><i class="sw w"></i></button>' : '') + '</div>' +
      '<div class="row" id="to"></div><button type="button" id="go" disabled>PRINT</button><p id="st"></p></div></div>');
    stage = $('#stage'); dcv = document.createElement('canvas'); pcv = document.createElement('canvas'); dcx = dcv.getContext('2d', { willReadFrequently: true }); pcx = pcv.getContext('2d');
    size(); draw(true); (WIDE.addEventListener ? WIDE.addEventListener('change', view) : WIDE.addListener(view));
    var file = stage.querySelector('input'); file.addEventListener('change', function () { take(file.files[0]); file.value = ''; });
    if ($('#ph')) $('#ph').addEventListener('click', function () { file.click(); });
    $('#turn').addEventListener('click', function () { if (!S.img) return; S.turn = (S.turn + 1) % 4; S.ox = S.oy = 0.5; draw(true); });
    if ($('#ink')) $('#ink').addEventListener('click', function () { S.ink = S.ink === 'white' ? 'black' : 'white'; this.firstChild.className = 'sw ' + (S.ink === 'white' ? 'w' : 'k'); draw(true); });
    if ($('#w')) $('#w').addEventListener('input', function () { S.words = this.value.toUpperCase(); draw(!S.img); });
    $('#to').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { S.to = b.dataset.p; keys(); } });
    $('#go').addEventListener('click', print);
    /* moved by hand, or by scrolling: down the length, or across when it overhangs that way */
    var at = null;
    stage.addEventListener('pointerdown', function (e) { if (!S.img) return; at = [e.clientX, e.clientY]; stage.classList.add('drag'); stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', function (e) { if (!at) return; move(e.clientX - at[0], e.clientY - at[1]); at = [e.clientX, e.clientY]; });
    var up = function () { if (at) { at = null; stage.classList.remove('drag'); draw(true); } };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', function (e) { if (!S.img) return; e.preventDefault(); var f = fit(), d = (e.deltaY || e.deltaX) * 0.5, down = f.ey >= f.ex; if (WIDE.matches) move(down ? 0 : -d, down ? -d : 0); else move(down ? d : 0, down ? 0 : -d); }, { passive: false });
    printers();
  }

  /* played on novel.global and wired to W.I.S.H. on its switchboard: W.I.S.H.'s photograph and intention arrive as the strip's own */
  addEventListener('message', function (e) { var d = e.data || {}; if (e.origin !== location.origin || d.hm !== 'fill' || !stage) return;
    if (d.words && $('#w')) { $('#w').value = String(d.words).toUpperCase().slice(0, 22); S.words = $('#w').value; }
    if (d.img) fetch(d.img).then(function (r) { return r.blob(); }).then(take).catch(function () { draw(true); }); else draw(true); });
  document.addEventListener('DOMContentLoaded', function () {
    if (IN) document.documentElement.className = 'in';
    var id = (location.hash.slice(1) || 'tall').replace(/[^a-z0-9-]/g, '');
    fetch('stacks/' + id + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (s) { S.stack = s; build(); })
      .catch(function () { $('#nm').textContent = '—'; });
  });
  window.STACK = S;
})();
