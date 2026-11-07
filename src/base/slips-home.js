/* novel.global, the slips the column prints: the build checklist as a receipt, and the quick photo print (a long press on the banner).
   Drawn on the printer's own dots with THERMAL (thermal.js comes first); the words solid ink, only the photograph dithered.
   SLIPS.ready() loads the QR library; checklist and quick draw at once, a slip without its QR if the library is not there yet. */
(function () {
  'use strict';
  var T = window.THERMAL, S = {};

  /* the list, in order: AN ISLAND (the keys as in aura.js ISLE, so a tick on the phone prints as done), then the parts from
     build-a-solar-printer.txt, each with its own key. A 0 is a gap */
  S.ISLE = [['pi', 'Raspberry Pi 3'], ['printer', 'Epson TM-T88V'], ['card', 'microSD card, 8 GB'], 0,
    ['imager', 'Raspberry Pi Imager'], ['image', 'Island card'], ['write', 'Imager › card › Use custom › island card'], ['on', 'Printer on the Pi’s USB, power on'], ['scan', 'Scan the slip it prints']];
  S.PARTS = [
    ['CORE', [['c-prn', 'Epson TM-T88V receipt printer, USB'], ['c-psu', 'Epson PS-180 power supply, 24 V'], ['c-paper', '80 mm thermal paper rolls'], ['c-pi', 'Raspberry Pi 3 Model A+'],
      ['c-sd', '32 GB microSD card'], ['c-os', 'Raspberry Pi OS Lite, 64-bit'], ['c-usb', 'USB-A to USB-B cable'], ['c-sun', '100 W 12 V solar panel'], ['c-mppt', '10 A MPPT charge controller'],
      ['c-bat', '12.8 V 50 Ah LiFePO4 battery'], ['c-boost', '12 V to 24 V DC boost converter, 5 A'], ['c-buck', '12 V to 5 V USB buck converter, 3 A'], ['c-fuse', 'Inline fuse holders, blade fuses'],
      ['c-cable', '2.5 mm2 cable, MC4 connectors'], ['c-wifi', 'Wi-Fi or a phone hotspot']]],
    ['MODS', [['m-btn', 'Momentary push button, GPIO 5'], ['m-led', 'Status LED, 330 ohm resistor, GPIO 6'], ['m-box', 'IP65 enclosure'], ['m-gland', 'Cable glands'], ['m-slot', 'Paper slot with a rain lip'], ['m-mount', 'Mounting brackets']]],
    ['HACKS', [['h-prn', 'Any 80 mm ESC/POS printer, salvaged'], ['h-phone', 'Old phone as the hotspot'], ['h-car', 'Car battery, 12 V USB adapter'], ['h-lunch', 'Lunchbox enclosure'], ['h-clip', 'Bulldog clip paper catcher']]],
    ['UPGRADES', [['u-lora', 'Meshtastic LoRa node, Heltec V3 or RAK WisBlock'], ['u-ant', '915 MHz antenna'], ['u-pi', 'Raspberry Pi 4 or 5'], ['u-bat', '100 Ah battery'], ['u-low', 'Paper-low sensor'], ['u-t88', 'Epson TM-T88VI']]]
  ];
  S.URL = 'https://novel.global/';

  S.ready = function () {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    return new Promise(function (res) { var s = document.createElement('script'); s.src = 'vendor/qrcode.js'; s.onload = function () { res(window.qrcode || null); }; s.onerror = function () { res(null); }; document.head.appendChild(s); });
  };

  var canvas = function (W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.textBaseline = 'top'; return c; };
  var crop = function (c, H) { var o = document.createElement('canvas'); o.width = c.width; o.height = Math.max(1, Math.round(H)); o.getContext('2d').drawImage(c, 0, 0); return o; };
  /* a QR of whole dots, its quiet zone the paper around it; 0 when the library is not loaded */
  var qr = function (x, text, cx, y, side) {
    if (!window.qrcode) return 0;
    try { var q = window.qrcode(0, 'M'); q.addData(text); q.make(); var n = q.getModuleCount(), m = Math.max(2, Math.floor(side / n)), ox = Math.round(cx - n * m / 2);
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (q.isDark(i, j)) x.fillRect(ox + j * m, y + i * m, m, m); return n * m; } catch (e) { return 0; }
  };
  /* words cut to the width, whole words, a second line if they need it */
  var lines = function (x, t, w) { var out = [], cur = ''; String(t).split(' ').forEach(function (wd) { var n = cur ? cur + ' ' + wd : wd; if (cur && x.measureText(n).width > w) { out.push(cur); cur = wd; } else cur = n; }); if (cur) out.push(cur); return out; };

  /* ───────── the build checklist ─────────
     ticks: the keys ticked (an array, or an object of key: true). Done: a solid box with a paper tick; to do: an open box two dots thick */
  S.checklist = function (ticks, W) {
    var g = T.grid(W), u = g.dots / 512, D = g.dots, sz = function (n) { return Math.max(1, Math.round(n * u)); }, pad = sz(18);
    var on = {}; (Array.isArray(ticks) ? ticks : Object.keys(ticks || {}).filter(function (k) { return ticks[k]; })).forEach(function (k) { on[k] = true; });
    var c = canvas(D, sz(4200)), x = c.getContext('2d'), y = pad, bx = sz(22), lh = sz(31), tw = D - pad * 2 - bx - sz(14);
    var rule = function (n) { x.fillRect(pad, y, D - pad * 2, sz(n)); y += sz(n); };
    x.font = T.font(null, 'sans', sz(16), true); x.fillText('NOVEL.GLOBAL', pad, y); var f = 'DA-ISL-01'; x.fillText(f, D - pad - x.measureText(f).width, y); y += sz(26); rule(3); y += sz(14);
    x.font = T.font(null, 'sans', sz(38), true); lines(x, 'UNEARTH YOUR OWN ISLAND', D - pad * 2).forEach(function (l) { x.fillText(l, pad, y); y += sz(42); });
    x.font = T.font(null, 'narrow', sz(20), true); x.fillText('Second-hand only. Newer models will not work.', pad, y); y += sz(34);
    var item = function (k, t) {
      var done = !!on[k], top = y + sz(4);
      if (done) { x.fillRect(pad, top, bx, bx); x.strokeStyle = '#fff'; x.lineWidth = sz(3); x.lineCap = 'square'; x.beginPath(); x.moveTo(pad + bx * 0.22, top + bx * 0.52); x.lineTo(pad + bx * 0.42, top + bx * 0.74); x.lineTo(pad + bx * 0.8, top + bx * 0.26); x.stroke(); }
      else { var w2 = sz(2); x.fillRect(pad, top, bx, w2); x.fillRect(pad, top + bx - w2, bx, w2); x.fillRect(pad, top, w2, bx); x.fillRect(pad + bx - w2, top, w2, bx); }
      x.font = T.font(null, 'sans', sz(21), true); lines(x, t, tw).forEach(function (l, i) { x.fillText(l, pad + bx + sz(14), y + sz(4) + i * sz(25)); if (i) y += sz(25); });
      y += lh; return done;
    };
    var head = function (t, list) { var n = list.filter(function (s) { return s && on[s[0]]; }).length, m = list.filter(Boolean).length;
      y += sz(10); rule(2); y += sz(10); x.font = T.font(null, 'sans', sz(22), true); x.fillText(t, pad, y); var r = n + ' / ' + m; x.font = T.font(null, 'mono', sz(20), true); x.fillText(r, D - pad - x.measureText(r).width, y + sz(2)); y += sz(36); };
    head('AN ISLAND', S.ISLE); S.ISLE.forEach(function (s) { if (!s) y += sz(12); else item(s[0], s[1]); });
    S.PARTS.forEach(function (p) { head(p[0], p[1]); p[1].forEach(function (s) { item(s[0], s[1]); }); });
    y += sz(14); rule(3); y += sz(26);
    var q = qr(x, S.URL, D / 2, y, sz(180)); if (q) y += q + sz(14);
    x.font = T.font(null, 'sans', sz(20), true); var s2 = 'NOVEL.GLOBAL'; x.fillText(s2, (D - x.measureText(s2).width) / 2, y); y += sz(24) + pad * 2;
    return T.solid(crop(c, y), 128);
  };

  /* ───────── the quick photo print ─────────
     img: an image, a canvas or a video frame. One photograph edge to edge, then the moon it was taken under and the code. Nothing else.
     o: { code, t (when), lat (the moon as seen from there), cal (the measured curve; else the site's) } */
  S.quick = function (img, W, o) {
    o = o || {}; var g = T.grid(W), D = g.dots, u = D / 512, sz = function (n) { return Math.max(1, Math.round(n * u)); };
    var iw = img.naturalWidth || img.videoWidth || img.width, ih = img.naturalHeight || img.videoHeight || img.height; if (!iw || !ih) return null;
    var ph = Math.round(Math.min(D * 1.5, Math.max(D * 0.6, D * ih / iw))), s = Math.max(D / iw, ph / ih), dw = iw * s, dh = ih * s;
    var pc = canvas(D, ph), px = pc.getContext('2d'); px.imageSmoothingQuality = 'high'; px.drawImage(img, (D - dw) / 2, (ph - dh) / 2, dw, dh);
    var im = px.getImageData(0, 0, D, ph), d = im.data, n = D * ph, L = new Float32Array(n), hist = new Uint32Array(256), i;
    for (i = 0; i < n; i++) { L[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114; hist[L[i] | 0]++; }
    /* the tones stretched to fill black to paper (the darkest and lightest 1% let go), a little sharpening for the edges, then the curve */
    var lo = 0, hi = 255, acc = 0; for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > n * 0.01) { lo = i; break; } } acc = 0; for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc > n * 0.01) { hi = i; break; } }
    var sp = Math.max(24, hi - lo), B = new Float32Array(n), xx, yy;
    for (i = 0; i < n; i++) L[i] = Math.max(0, Math.min(255, (L[i] - lo) * 255 / sp));
    for (yy = 0; yy < ph; yy++) for (xx = 0; xx < D; xx++) { i = yy * D + xx; var a = L[i], m = (L[i - (xx > 0)] + L[i + (xx < D - 1)] + L[i - (yy > 0) * D] + L[i + (yy < ph - 1) * D]) / 4; B[i] = Math.max(0, Math.min(255, a + (a - m) * 0.9)); }
    var cal = o.cal || (window.NG && NG.pq && NG.pq().cal) || null, lut = T.curve(cal || T.CAL);
    /* the curve, then the ends held: what was meant black prints solid, what was meant paper stays bare */
    for (i = 0; i < n; i++) B[i] = B[i] < 10 ? 0 : B[i] > 245 ? 255 : lut[B[i] | 0];
    T.dots(B, D, ph, T.pick(B, D, ph));
    for (i = 0; i < n; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = B[i]; d[i * 4 + 3] = 255; } px.putImageData(im, 0, 0);
    /* the foot: the moon as a disc and its light, the code beside it, both solid ink */
    var fh = sz(96), c = canvas(D, ph + fh + sz(40)), x = c.getContext('2d'), fc = canvas(D, fh), fx = fc.getContext('2d'), r = sz(26), cy = Math.round(fh / 2), mx = sz(18) + r;
    if (window.NG && NG.moon && NG.moonPath) { var mo = NG.moon(o.t || Date.now()), la = isFinite(+o.lat) ? +o.lat : -37.8;
      fx.lineWidth = sz(3); fx.strokeStyle = '#000'; fx.beginPath(); fx.arc(mx, cy, r, 0, Math.PI * 2); fx.stroke(); fx.save(); fx.translate(mx, cy); fx.fill(new Path2D(NG.moonPath(mo.f, la, r))); fx.restore(); }
    if (o.code) { var t = String(o.code).toUpperCase(), fs = sz(52); fx.font = T.font(null, 'mono', fs, true); while (fx.measureText(t).width > D - mx - r - sz(48) && fs > sz(20)) { fs -= sz(2); fx.font = T.font(null, 'mono', fs, true); }
      fx.textBaseline = 'middle'; fx.fillText(t, D - sz(18) - fx.measureText(t).width, cy + sz(2)); }
    T.solid(fc, 128); x.drawImage(pc, 0, 0); x.drawImage(fc, 0, ph + sz(12));
    return c;
  };

  window.SLIPS = S;
})();
