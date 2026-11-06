/* novel.global, thermal-first: what the receipt printer can lay down, and the styles a receipt is set in. Shared by the base, the aura
   and the approval page (build.mjs puts it in front of base.js and admin.js), plain script for old phones.
   The TM-T88V lays 512 dots across 72 mm of 80 mm paper (180 dpi); a 203 dpi printer lays 576. Every word is drawn on that grid and
   made solid ink (a hot dot or none, never grey, never dithered). Only photographs are dithered, after a curve measured on the printer
   itself (the calibration strip), with the dots chosen for each picture. */
(function () {
  'use strict';
  var T = {};
  /* the printer's own grid: its dots across, its dots to the inch */
  T.grid = function (dots) { dots = +dots || 512; return { dots: dots - dots % 8, dpi: dots >= 576 ? 203 : 180 }; };

  /* ───────── the measured curve ─────────
     The strip prints eleven patches, 0 (black) to 10 (paper), each as the dither lays it with nothing else done (Floyd-Steinberg, which
     keeps every level; Atkinson would make 1 black and 9 paper by itself). Three are read by eye:
     b the lightest that still looks solid black, m the one that looks half way between black and paper, w the darkest that looks like
     bare paper. The curve sends a tone wanted on paper to the level that prints it: black to b, half grey to m, paper to w */
  T.CAL = { b: 1, m: 6, w: 10 };
  T.cal = function (c) { c = c || {}; var b = Math.max(0, Math.min(8, +c.b)), m = +c.m, w = Math.max(2, Math.min(10, +c.w)); if (!isFinite(b)) b = T.CAL.b; if (!isFinite(w)) w = T.CAL.w; if (w <= b + 1) w = Math.min(10, b + 2);
    if (!isFinite(m) || m <= b || m >= w) m = (b + w) / 2; return { b: b, m: m, w: w }; };
  /* a table of 256: the lightness wanted (0 black) to the lightness given to the dots */
  T.curve = function (c) {
    var k = T.cal(c), lut = new Uint8Array(256), i, t, v;
    for (i = 0; i < 256; i++) { t = i / 255; v = t < 0.5 ? k.b + (k.m - k.b) * (t / 0.5) : k.m + (k.w - k.m) * ((t - 0.5) / 0.5); lut[i] = Math.round(Math.max(0, Math.min(1, v / 10)) * 255); }
    return lut;
  };

  /* ───────── the dots ───────── */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  T.BAYER = BAYER;
  /* L: lightness, a Float32Array, made 0 or 255 in place. atkinson (clean, bright), floyd (fuller, holds the darks), bayer (an even
     screen), none (black or white at half) */
  T.dots = function (L, W, H, how) {
    var n = W * H, g = L, i, x, y, e, o;
    if (how === 'none') { for (i = 0; i < n; i++) g[i] = g[i] < 128 ? 0 : 255; return g; }
    if (how === 'bayer') { for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; g[i] = g[i] < (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) * 16 ? 0 : 255; } return g; }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; o = g[i] < 128 ? 0 : 255; e = g[i] - o; g[i] = o;
      if (how === 'floyd') { if (x + 1 < W) g[i + 1] += e * 7 / 16; if (y + 1 < H) { if (x > 0) g[i + W - 1] += e * 3 / 16; g[i + W] += e * 5 / 16; if (x + 1 < W) g[i + W + 1] += e / 16; } }
      else { e /= 8; if (x + 1 < W) g[i + 1] += e; if (x + 2 < W) g[i + 2] += e; if (y + 1 < H) { if (x > 0) g[i + W - 1] += e; g[i + W] += e; if (x + 1 < W) g[i + W + 1] += e; } if (y + 2 < H) g[i + 2 * W] += e; } }
    return g;
  };
  /* the dots for this picture: a graphic (few mid-tones) black or white; a busy one Atkinson, so its edges stay clean; a dark one or a
     soft one Floyd-Steinberg, so the shadows and the gradients hold */
  T.pick = function (L, W, H) {
    var n = W * H, step = Math.max(1, Math.floor(n / 40000)), mid = 0, sum = 0, edge = 0, k = 0, i, v;
    for (i = 0; i < n - 1; i += step) { v = L[i]; sum += v; if (v > 56 && v < 200) mid++; if ((i + 1) % W) edge += Math.abs(L[i + 1] - v); k++; }
    if (!k) return 'atkinson'; var mean = sum / k, ms = mid / k, ed = edge / k;
    if (ms < 0.16) return 'none';
    if (ed > 18) return 'atkinson';
    if (mean < 105) return 'floyd';
    if (mean > 175) return 'atkinson';
    return 'floyd';
  };

  /* ───────── to the printer ─────────
     heat: the head's darkness (GS ( K, function 49: under 0 lighter, over 0 darker and slower) */
  T.raster = function (cv, heat) {
    var W = cv.width, H = cv.height, bw = W >> 3, d = cv.getContext('2d').getImageData(0, 0, W, H).data, out = [0x1B, 0x40], ht = Math.max(-6, Math.min(8, Math.round(+heat || 0)));
    if (ht) out.push(0x1D, 0x28, 0x4B, 0x02, 0x00, 0x31, ht < 0 ? 256 + ht : ht);
    for (var y0 = 0; y0 < H; y0 += 255) {
      var h = Math.min(255, H - y0); out.push(0x1D, 0x76, 0x30, 0x00, bw & 0xFF, bw >> 8, h & 0xFF, h >> 8);
      for (var y = y0; y < y0 + h; y++) for (var xb = 0; xb < bw; xb++) { var v = 0; for (var bit = 0; bit < 8; bit++) if (d[(y * W + xb * 8 + bit) * 4] < 128) v |= 0x80 >> bit; out.push(v); }
    }
    out.push(0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00);
    var s = ''; for (var i = 0; i < out.length; i += 0x8000) s += String.fromCharCode.apply(null, out.slice(i, i + 0x8000)); return btoa(s);
  };
  /* a canvas made solid ink: every dot below the cut black, the rest paper */
  T.solid = function (c, cut) {
    var g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, k = cut || 128;
    for (var i = 0; i < d.length; i += 4) { var v = (d[i + 3] < 128 ? 255 : d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) < k ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  };

  /* ───────── the fonts that print clean at one bit: heavy enough that no stroke is thinner than a dot ─────────
     [weight, family]. hand is the poster's own on screen; on paper it is set in sans */
  T.FONTS = {
    sans: ['700', '"Helvetica Neue", Helvetica, Arial, sans-serif'],
    narrow: ['600', '"Archivo Narrow", "Arial Narrow", "Helvetica Neue", Arial, sans-serif'],
    serif: ['900', 'Fraunces, "Cooper Black", Georgia, serif'],
    mono: ['700', 'ui-monospace, Menlo, Consolas, "Courier New", monospace'],
    hand: ['400', '"Architects Daughter", "Comic Sans MS", "Bradley Hand", cursive']
  };
  T.PAPER_FONTS = ['sans', 'narrow', 'serif', 'mono'];
  /* a font key as a CSS font: "sans", "narrow:500", or "asset:<name>" (a font the style carries); px already on the grid */
  T.font = function (st, key, px, paper) {
    var k = String(key || 'sans'), wt = null, m = k.match(/^(\w+):(\d{3})$/); if (m) { k = m[1]; wt = m[2]; }
    var a = /^asset:([\w-]{1,24})$/.exec(String(key || ''));
    if (a && st && st.assets && st.assets[a[1]] && /^data:font\//.test(st.assets[a[1]])) return '400 ' + px + 'px "' + famOf(st, a[1]) + '", ' + T.FONTS.sans[1];
    if (!T.FONTS[k] || (paper && k === 'hand')) k = 'sans'; var f = T.FONTS[k]; return (wt || f[0]) + ' ' + px + 'px ' + f[1];
  };
  var famOf = function (st, name) { return 'ngs-' + String(st.id || 's').replace(/[^\w-]/g, '') + '-' + name; };
  var LOADED = {};
  /* the fonts a style carries, made ready once (a promise; never fails) */
  T.fontsOf = function (st) {
    if (!st || !st.assets || !window.FontFace || !document.fonts) return Promise.resolve();
    return Promise.all(Object.keys(st.assets).filter(function (n) { return /^data:font\//.test(st.assets[n]); }).map(function (n) {
      var fam = famOf(st, n); if (LOADED[fam]) return LOADED[fam];
      try { var ff = new FontFace(fam, 'url(' + st.assets[n] + ')'); return (LOADED[fam] = ff.load().then(function (f) { document.fonts.add(f); }).catch(function () {})); } catch (e) { return Promise.resolve(); }
    })).then(function () {});
  };

  /* ───────── styles: one JSON (and its assets) sets the whole receipt ─────────
     fonts { head, body, small } on paper; screen { head, body, small } on screen (else the same); size: the words on paper against the
     poster as drawn (1.3: a third bigger); lead: line spacing; margin; photo { dither (auto | atkinson | floyd | bayer | none),
     contrast, sharpen, gamma }; frame (hand | rule | box | none) round the picture; rule (dots | solid | none) under the words;
     top (mark | band | none): the mark and the name, or the same reversed out of a solid black band; night (solid | shade): a dark
     print solid black, or a fine shade; colours { paper, ink } on screen (the paper key swaps them); mark: an asset (a small image)
     printed at the foot; assets { name: data URL } fonts (woff2) and images (png) */
  T.HOUSE = [
    { id: 'house', name: 'HOUSE', by: 'novel.global', fonts: { head: 'sans', body: 'sans', small: 'sans' }, screen: { head: 'hand', body: 'narrow', small: 'sans:500' },
      size: 1.3, lead: 1, margin: 1, photo: {}, frame: 'hand', rule: 'dots', top: 'mark', night: 'solid' },
    { id: 'press', name: 'PRESS', by: 'novel.global', fonts: { head: 'mono', body: 'mono', small: 'mono' }, size: 1.25, lead: 1.05, margin: 0.8,
      photo: { dither: 'floyd', contrast: 0.5, sharpen: 1.3, gamma: 0.7 }, frame: 'box', rule: 'solid', top: 'band', night: 'solid', colours: { paper: '#0E0F11', ink: '#E8E6DF' } },
    { id: 'quiet', name: 'QUIET', by: 'novel.global', fonts: { head: 'narrow', body: 'narrow', small: 'narrow:500' }, size: 1.2, lead: 1.15, margin: 1.25,
      photo: { dither: 'atkinson', contrast: 0.15, sharpen: 0.8 }, frame: 'none', rule: 'none', top: 'mark', night: 'solid', colours: { paper: '#F7F5EE', ink: '#1B1B1B' } },
    { id: 'loud', name: 'LOUD', by: 'novel.global', fonts: { head: 'serif', body: 'sans', small: 'sans' }, size: 1.5, lead: 0.95, margin: 0.7,
      photo: { dither: 'auto', contrast: 0.65, sharpen: 1.5, gamma: 0.66 }, frame: 'rule', rule: 'solid', top: 'band', night: 'solid' }
  ];
  var ONE = { frame: ['hand', 'rule', 'box', 'none'], rule: ['dots', 'solid', 'none'], top: ['mark', 'band', 'none'], night: ['solid', 'shade'], dither: ['auto', 'atkinson', 'floyd', 'bayer', 'none'] };
  var num = function (v, lo, hi, d) { v = +v; return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  var word = function (v, n) { return String(v == null ? '' : v).replace(/[^\w .·'&+-]/g, '').trim().slice(0, n); };
  var col = function (v) { return /^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : null; };
  var fkey = function (v, assets) { var s = String(v || ''); if (/^asset:[\w-]{1,24}$/.test(s) && assets && assets[s.slice(6)]) return s; return /^(sans|narrow|serif|mono|hand)(:[1-9]00)?$/.test(s) ? s : null; };
  /* a style as it may be used: every field checked and kept within its bounds, anything else let go. An artist's pack is never trusted */
  T.clean = function (s) {
    if (!s || typeof s !== 'object') return null; var o = { id: word(s.id, 32).replace(/[^\w-]/g, '') || 's' + Math.abs(hash(JSON.stringify(s))).toString(36), name: word(s.name, 24).toUpperCase() || 'STYLE', by: word(s.by, 40) };
    var A = {}, tot = 0; if (s.assets && typeof s.assets === 'object') Object.keys(s.assets).slice(0, 6).forEach(function (n) { var v = String(s.assets[n] || ''), nm = String(n).replace(/[^\w-]/g, '').slice(0, 24);
      if (nm && /^data:(font\/(woff2|woff|ttf|otf)|image\/(png|jpeg|webp));base64,[A-Za-z0-9+/=]+$/.test(v) && tot + v.length <= 90000) { A[nm] = v; tot += v.length; } });
    if (Object.keys(A).length) o.assets = A;
    var F = function (f) { var r = {}; if (!f || typeof f !== 'object') return null; ['head', 'body', 'small'].forEach(function (k) { var v = fkey(f[k], A); if (v) r[k] = v; }); return Object.keys(r).length ? r : null; };
    o.fonts = F(s.fonts) || { head: 'sans', body: 'sans', small: 'sans' }; ['head', 'body', 'small'].forEach(function (k) { if (!o.fonts[k]) o.fonts[k] = o.fonts.body || o.fonts.head || 'sans'; }); var sc = F(s.screen); if (sc) o.screen = sc;
    o.size = num(s.size, 0.8, 2, 1.3); o.lead = num(s.lead, 0.8, 1.6, 1); o.margin = num(s.margin, 0.5, 1.8, 1);
    var p = s.photo && typeof s.photo === 'object' ? s.photo : {}; o.photo = {}; if (ONE.dither.indexOf(p.dither) >= 0) o.photo.dither = p.dither;
    if (p.contrast != null) o.photo.contrast = num(p.contrast, 0, 1, 0.25); if (p.sharpen != null) o.photo.sharpen = num(p.sharpen, 0, 2.5, 1); if (p.gamma != null) o.photo.gamma = num(p.gamma, 0.3, 1.6, 0.8);
    ['frame', 'rule', 'top', 'night'].forEach(function (k) { o[k] = ONE[k].indexOf(s[k]) >= 0 ? s[k] : ONE[k][0]; });
    if (s.colours && col(s.colours.paper) && col(s.colours.ink)) o.colours = { paper: col(s.colours.paper), ink: col(s.colours.ink) };
    if (s.mark && A[String(s.mark)] && /^data:image\//.test(A[String(s.mark)])) o.mark = String(s.mark);
    return o;
  };
  /* a mod pack: { name, by, styles: [...] }, or one style alone */
  T.pack = function (j) {
    if (typeof j === 'string') { try { j = JSON.parse(j); } catch (e) { return null; } }
    if (!j || typeof j !== 'object') return null; var list = Array.isArray(j.styles) ? j.styles : j.fonts || j.photo ? [j] : [];
    var styles = list.slice(0, 12).map(T.clean).filter(Boolean); if (!styles.length) return null;
    return { name: word(j.name, 40).toUpperCase() || styles[0].name, by: word(j.by, 40), styles: styles };
  };
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  T.hash = hash;
  T.HOUSE = T.HOUSE.map(T.clean);
  /* the darker of a style's two colours is its dark paper */
  T.lum = function (hex) { var n = parseInt(String(hex).slice(1), 16); return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114; };
  T.rgb = function (hex) { var n = parseInt(String(hex).slice(1), 16); return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };

  /* ───────── the calibration strip ─────────
     W dots wide. Eleven patches as the printer lays them (nothing done but the dots), numbered 0 to 10; the same through the curve as
     it is now (an even ramp once tuned); a solid black block (stripes or grey in it: more heat); words at four sizes in each paper font;
     lines one, two and three dots thick */
  T.strip = function (o) {
    o = o || {}; var g0 = T.grid(o.dots), W = g0.dots, how = o.dither === 'bayer' ? 'bayer' : 'floyd', lut = T.curve(o.cal), u = W / 512, pad = Math.round(16 * u);
    var pw = Math.floor((W - pad * 2) / 11), ph = Math.round(64 * u), H = Math.round(980 * u), c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.textBaseline = 'top';
    var sz = function (n) { return Math.round(n * u); }, y = pad;
    x.font = T.font(null, 'sans', sz(26)); x.fillText('CALIBRATION', pad, y); x.font = T.font(null, 'sans', sz(16)); var r = g0.dots + ' DOTS · ' + g0.dpi + ' DPI · HEAT ' + (o.heat || 0); x.fillText(r, W - pad - x.measureText(r).width, y + sz(8)); y += sz(44);
    var row = function (label, map) {
      x.font = T.font(null, 'sans', sz(16)); x.fillText(label, pad, y); y += sz(24);
      var L = new Float32Array(pw * ph); for (var i = 0; i <= 10; i++) { var v = map(Math.round(i * 25.5)); for (var q = 0; q < L.length; q++) L[q] = v; T.dots(L, pw, ph, how);
        var im = x.createImageData(pw, ph); for (q = 0; q < L.length; q++) { im.data[q * 4] = im.data[q * 4 + 1] = im.data[q * 4 + 2] = L[q]; im.data[q * 4 + 3] = 255; } x.putImageData(im, pad + i * pw, y);
        x.fillStyle = '#000'; x.font = T.font(null, 'mono', sz(18)); var t = String(i); x.fillText(t, pad + i * pw + (pw - x.measureText(t).width) / 2, y + ph + sz(4)); }
      y += ph + sz(34);
    };
    row('AS IT PRINTS  ·  ' + how.toUpperCase(), function (v) { return v; });
    var k = T.cal(o.cal); row('THROUGH THE CURVE  ·  ' + k.b + ' / ' + k.m + ' / ' + k.w, function (v) { return lut[v]; });
    x.font = T.font(null, 'sans', sz(16)); x.fillText('SOLID BLACK', pad, y); y += sz(24); x.fillRect(pad, y, W - pad * 2, sz(90)); y += sz(90) + sz(22);
    T.PAPER_FONTS.forEach(function (f) { var xx = pad; [14, 18, 24, 32].forEach(function (n) { x.font = T.font(null, f, sz(n)); var t = f + ' ' + n; x.fillText(t, xx, y + sz(32 - n)); xx += x.measureText(t).width + sz(14); }); y += sz(44); });
    y += sz(6); [1, 2, 3].forEach(function (n) { x.fillRect(pad, y, W - pad * 2, n); y += sz(14); });
    x.font = T.font(null, 'sans', sz(14)); ['b: the lightest patch still solid black', 'm: the patch half way to paper', 'w: the darkest patch that looks like paper'].forEach(function (t) { y += sz(4); x.fillText(t, pad, y); y += sz(20); });
    var out = document.createElement('canvas'); out.width = W; out.height = Math.min(H, y + pad); out.getContext('2d').drawImage(c, 0, 0);
    return T.solid(out, 128);
  };

  window.THERMAL = T;
})();
