/* ════════════════════════════════════════════════════════════════════
   THE AIR OVER THE GROUND — small sprites, barely there, drawn from the real weather. Heat rises as shimmer, more of it on a
   hotter day and in a hotter month of the outlook; the sun glints; rain falls only while rain is falling now. Nothing is said; it is
   only felt. Still when motion is off, when the ground is covered, and when the page is hidden
   ════════════════════════════════════════════════════════════════════ */
function weatherFx() {
  const host = $('#world'); if (!host || $('#wx-fx')) return;
  const cv = document.createElement('canvas'); cv.id = 'wx-fx'; cv.className = 'wx-fx'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
  const x = cv.getContext('2d'); let W = 0, H = 0, dpr = 1, last = 0, raf = 0; const sp = [];
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = host.clientWidth; H = host.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
  size(); addEventListener('resize', size);
  /* how hot the air is: today's top, or the month's degree on the outlook, whichever is hotter */
  const heat = () => Math.max(clamp((Math.max(S.wx.tmax || 20, (S.wx.now || {}).t || 0) - 22) / 16, 0, 1), (outMonth(nowK()).lv || 0) / 4 * 0.6);
  const wet = () => clamp(((S.wx.now || {}).p || 0) / 1.5, 0, 1);
  /* the ghosts: a jellyfish drifting up through the air now and then, pulsing; five taps on the muse fill the water with them */
  const jel = (a = 0.14) => ({ k: 'jel', x: W * (0.1 + Math.random() * 0.8), y: H + 60, v: 9 + Math.random() * 8, t: 0, life: 40, ph: Math.random() * 6.28, a, s: 26 + Math.random() * 30, sw: (Math.random() - 0.5) * 0.4 });
  addEventListener('da:muse', () => { for (let i = 0; i < 9; i++) { const g = jel(0.32); g.y = H + 40 + i * 50; g.v = 18 + Math.random() * 14; g.life = 30; sp.push(g); } });
  const spawn = kind => (kind === 'rain' ? { k: 'rain', x: Math.random() * W, y: -10, v: 220 + Math.random() * 120, a: 0.16 + Math.random() * 0.14 }
    : kind === 'glint' ? { k: 'glint', x: Math.random() * W, y: Math.random() * H, t: 0, life: 1.2 + Math.random(), a: 0.5 }
      : { k: 'heat', x: Math.random() * W, y: H * (0.25 + Math.random() * 0.8), v: 8 + Math.random() * 10, t: 0, life: 3 + Math.random() * 3, ph: Math.random() * 6.28, a: 0.10 + Math.random() * 0.16 });
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || reduced() || !prefs.motion || document.body.classList.contains('off-map') && !document.body.classList.contains('shut')) { if (sp.length) { sp.length = 0; x.clearRect(0, 0, cv.width, cv.height); } return; }
    if (now - last < 50) return; const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const h = heat(), w = wet(); const want = { heat: Math.round(4 + 34 * h), glint: Math.round(h * 4), rain: Math.round(60 * w) };
    for (const k of Object.keys(want)) { const n = sp.filter(s => s.k === k).length; for (let i = n; i < want[k]; i++) if (Math.random() < 0.08) sp.push(spawn(k)); }
    if (!sp.some(s => s.k === 'jel') && Math.random() < (darkNow() ? 0.0016 : 0.0006)) sp.push(jel());
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    for (let i = sp.length - 1; i >= 0; i--) {
      const s = sp[i];
      if (s.k === 'rain') { s.y += s.v * dt; s.x -= s.v * 0.18 * dt; x.strokeStyle = `rgba(190,215,255,${s.a})`; x.lineWidth = 1; x.beginPath(); x.moveTo(s.x, s.y); x.lineTo(s.x + 1.6, s.y - 9); x.stroke(); if (s.y > H + 10) sp.splice(i, 1); continue; }
      if (s.k === 'jel') { s.t += dt; s.y -= s.v * dt * (0.6 + 0.4 * Math.max(0, Math.sin(s.ph + s.t * 1.6))); s.x += s.sw * Math.sin(s.t * 0.3) ; if (s.y < -80 || s.t > s.life) { sp.splice(i, 1); continue; } const pu = Math.max(0, Math.sin(s.ph + s.t * 1.6)); const a = s.a * Math.min(1, s.t / 3);
        M.jelly(x, s.x, s.y, s.s, `rgba(221,246,242,${a.toFixed(3)})`, `rgba(169,240,236,${(a * 0.35).toFixed(3)})`, pu); continue; }
      s.t += dt; const k = s.t / s.life; if (k >= 1) { sp.splice(i, 1); continue; } const fade = Math.sin(k * Math.PI);
      if (s.k === 'glint') { const r = 3 + 4 * fade; x.fillStyle = `rgba(255,230,160,${(s.a * fade).toFixed(3)})`; x.fillRect(s.x - r, s.y - 0.5, r * 2, 1); x.fillRect(s.x - 0.5, s.y - r, 1, r * 2); continue; }
      /* a heat sprite: a short wavering line, pixel-stepped, rising and fading */
      s.y -= s.v * dt; const a = (s.a * fade).toFixed(3); x.fillStyle = `rgba(255,${120 + Math.round(60 * (1 - h))},60,${a})`;
      for (let j = 0; j < 7; j++) { const px = s.x + j * 3; const py = s.y + Math.round(Math.sin(s.ph + j * 0.9 + s.t * 3) * 2); x.fillRect(px, py, 2, 2); }
    }
  }
  raf = requestAnimationFrame(frame);
}
