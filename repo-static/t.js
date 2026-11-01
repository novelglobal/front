/* the touch screen's QR (novel.global/t): the photo booth, or the start, as the approval page says; the booth if it cannot say */
(function () {
  var go = function (to) { location.replace(to === 'home' ? '/' : '/#booth'); };
  var t = setTimeout(function () { go('booth'); }, 2500);
  fetch('/api/settings', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (s) { var o = {}; try { o = s.start ? JSON.parse(s.start) : {}; } catch (e) { o = {}; } clearTimeout(t); go(o.touchTo); })
    .catch(function () { clearTimeout(t); go('booth'); });
})();
