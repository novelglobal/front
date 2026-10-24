/* CanvasDither 1.0.1, (c) 2017 Niels Leenheer, MIT licence: vendor/LICENSES.md. https://github.com/NielsLeenheer/CanvasDither
   Made for receipt printers. Ported to plain script for old phones; the error is carried in a float buffer, not a clamped one,
   so dark error is never lost at the edges of light (the only change). window.CanvasDither: grayscale, threshold, bayer,
   floydsteinberg, atkinson; each takes a canvas's ImageData and returns it in one bit. */
(function () {
  function lum(d, i) { return d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; }
  function fill(d, i, v) { d[i] = d[i + 1] = d[i + 2] = v; }
  function grayscale(image) { var d = image.data; for (var i = 0; i < d.length; i += 4) fill(d, i, lum(d, i)); return image; }
  function threshold(image, t) { var d = image.data; for (var i = 0; i < d.length; i += 4) fill(d, i, lum(d, i) < t ? 0 : 255); return image; }
  function bayer(image, t) {
    var map = [[15, 135, 45, 165], [195, 75, 225, 105], [60, 180, 30, 150], [240, 120, 210, 90]], d = image.data, w = image.width;
    for (var i = 0; i < d.length; i += 4) { var p = i / 4, x = p % w, y = Math.floor(p / w); fill(d, i, Math.floor((lum(d, i) + map[x % 4][y % 4]) / 2) < t ? 0 : 255); }
    return image;
  }
  function diffuse(image, taps, div) {
    var d = image.data, w = image.width, n = w * image.height, L = new Float32Array(n + 2 * w + 2);
    for (var l = 0, i = 0; l < n; l++, i += 4) L[l] = lum(d, i);
    for (l = 0, i = 0; l < n; l++, i += 4) {
      var v = L[l] < 129 ? 0 : 255, e = (L[l] - v) / div; fill(d, i, v);
      for (var k = 0; k < taps.length; k += 2) L[l + taps[k]] += e * taps[k + 1];
    }
    return image;
  }
  function floydsteinberg(image) { var w = image.width; return diffuse(image, [1, 7, w - 1, 3, w, 5, w + 1, 1], 16); }
  function atkinson(image) { var w = image.width; return diffuse(image, [1, 1, 2, 1, w - 1, 1, w, 1, w + 1, 1, 2 * w, 1], 8); }
  window.CanvasDither = { grayscale: grayscale, threshold: threshold, bayer: bayer, floydsteinberg: floydsteinberg, atkinson: atkinson };
})();
