/* ════════════════════════════════════════════════════════════════════
   STRING FIGURES — inside an open life's radius every place, group, water, life and knot of your own is a knot,
   and a thin thread runs from the life to each place that sells or leaves what harms it.
   Click a knot to look: the string it would make, and its sound. Click it again, or right-click (hold, on a phone), to join it.
   Right-click a joined knot to let it go. Click open ground in the radius to add a knot of your own.
   Every figure is a constellation: named, kept on this device, listed on NOW, traced and played as a song.
   ════════════════════════════════════════════════════════════════════ */
const strings = (() => {
  const FIGS = store.get('da.figs.v1', {});
  const TAU = Math.PI * 2;
  let cell = null, nodes = new Map(), fig = blank(), shownAt = 0, peekKey = null, peekAt = 0, ghost = null;
  let glowUntil = 0, focus = null, focusAt = 0, trace = null;
  const plucks = new Map();
  const MAX_BIZ = 60;
  const pk = $('#peek'), capEl = $('#trace');
  function blank() { return { e: [], end: 'pin', prev: null, n: {}, c: {}, lb: {}, x: [], ts: {} }; }
  const eKey = ([a, b]) => `${a}|${b}`;
  const inFig = k => k === 'pin' || fig.e.some(([a, b]) => a === k || b === k);
  const idOf = k => (/^\d+$/.test(k) ? +k : k);
  function open(o) { cell = o; load(o); nodes = compute(o); shownAt = performance.now(); plucks.clear(); peekKey = null; ghost = null; focus = null; trace = null; pk.hidden = true; if (capEl) capEl.hidden = true; }
  /* a signal remixed: its figure becomes this cell's, where the cell has none of its own yet */
  function seed(o, s) {
    if (FIGS[o.id] || !(s.edges || []).length) return; const key = k => (k === 'pin' ? 'pin' : `s:${s.code}:${k}`); const n = {};
    for (const x of s.nodes || []) { const [la, ln] = dest(o.lat, o.lng, x.d, x.b); n[key(x.k)] = { t: x.t === 'custom' ? 'custom' : x.t, n: x.n, role: x.role, on: onNotice(x.role), fam: x.fam || (ROLES[x.role] || {}).cat, g: x.g, kind: x.kind, lat: +la.toFixed(5), lng: +ln.toFixed(5) }; }
    const e = s.edges.map(([a, b]) => [key(a), key(b)]); const t = Date.now();
    FIGS[o.id] = { e, end: e.length ? e[e.length - 1][1] : 'pin', prev: null, n, c: {}, lb: {}, x: [], ts: Object.fromEntries(e.map(x => [eKey(x), t])), born: t, t }; store.set('da.figs.v1', FIGS);
  }
  function close() { cell = null; nodes = new Map(); plucks.clear(); peekKey = null; ghost = null; focus = null; trace = null; pk.hidden = true; if (capEl) capEl.hidden = true; }
  function refresh() { if (cell) { const o = S.byId.get(cell.id) || cell; cell = o; nodes = compute(o); if (peekKey && !nodes.has(peekKey) && !String(peekKey).startsWith('x:')) unpeek(); else if (peekKey) card(); life.redraw(); } }
  /* ───────── the knots inside a radius ───────── */
  function compute(o) {
    const R = rangeOf(o); const out = new Map(); const press = new Set(PRESSURES[lifeOf(o)] || PRESSURES.paw || []);
    out.set('pin', { key: 'pin', t: 'pin', n: nameOf(o), lat: o.lat, lng: o.lng, d: 0, g: lifeOf(o) });
    const biz = [];
    for (const b of bizNear(o.lat, o.lng, R)) {
      const key = `b:${norm(b.n)}@${b.lat.toFixed(4)},${b.lng.toFixed(4)}`; if (out.has(key)) continue;
      const n = { key, t: 'biz', n: b.n, brand: b.b, role: b.role, on: onNotice(b.role), fam: b.fam, h: b.h, harm: b.h.filter(h => press.has(h)), cur: b.cur, url: b.url, what: b.what, addr: b.addr, a: b.a, lat: b.lat, lng: b.lng, d: b.d };
      out.set(key, n); biz.push(n);
    }
    /* listed places first, then the ones that harm this life, then the nearest */
    biz.sort((a, b) => (b.cur - a.cur) || ((b.harm.length > 0) - (a.harm.length > 0)) || a.d - b.d).forEach((n, i) => { n.rank = i; });
    for (const x of cellsAll()) {
      if (x.id === o.id || x.hist || x.ob || isCold(x) || x.isTribe) continue; const d = haversine(o.lat, o.lng, x.lat, x.lng); if (d > R) continue;
      out.set('o:' + x.id, { key: 'o:' + x.id, t: 'life', id: x.id, n: nameOf(x), g: lifeOf(x), hum: !!x.hum && !(x.tx && x.tx.n), kind: x.kind || '', user: !!x.user, lat: x.lat, lng: x.lng, d });
    }
    for (const t of S.tribes) {
      const p = tribeNear(t, o.lat, o.lng); if (!p || p.d > R) continue;
      const dd = haversine(o.lat, o.lng, p.lat, p.lng), k = dd > R * 0.85 ? (R * 0.85) / dd : 1;
      out.set('t:' + t.tid, { key: 't:' + t.tid, t: 'group', n: t.n, kind: t.kind, what: t.w, link: t.link, lat: o.lat + (p.lat - o.lat) * k, lng: o.lng + (p.lng - o.lng) * k, d: p.d });
    }
    const wn = waterNear(o.lat, o.lng); if (wn.n && wn.d <= R) out.set('w:' + norm(wn.n), { key: 'w:' + norm(wn.n), t: 'water', n: wn.n, lat: wn.lat, lng: wn.lng, d: wn.d });
    for (const [k, m] of Object.entries(fig.c || {})) out.set(k, { ...m, key: k, t: 'custom', d: haversine(o.lat, o.lng, m.lat, m.lng) });
    /* knots tied before stay, even when the radius has shrunk or the places have not loaded yet */
    for (const [k, m] of Object.entries(fig.n || {})) if (!out.has(k) && inFig(k)) out.set(k, { ...m, key: k, h: m.h || [], harm: (m.h || []).filter(r => press.has(r)), d: haversine(o.lat, o.lng, m.lat, m.lng), away: true });
    return out;
  }
  const metaOf = n => ({ t: n.t, n: n.n, role: n.role, on: n.on, fam: n.fam, ...(n.h && n.h.length ? { h: n.h } : {}), g: n.g, kind: n.kind, id: n.id, hum: n.hum, ...(n.url ? { url: n.url } : {}), lat: +n.lat.toFixed(5), lng: +n.lng.toFixed(5) });
  function load(o) {
    const f = FIGS[o.id]; fig = f ? { e: (f.e || []).map(x => [...x]), end: f.end || 'pin', prev: f.prev || null, n: { ...(f.n || {}) }, c: { ...(f.c || {}) }, lb: { ...(f.lb || {}) }, x: [...(f.x || [])], ts: { ...(f.ts || {}) }, born: f.born || ((f.e || []).length ? f.t || 1 : null), name: f.name || '' } : blank();
    if (!inFig(fig.end)) fig.end = 'pin';
  }
  function save() {
    if (!cell) return; const keep = new Set(['pin', ...fig.e.flat(), ...((fig.prev && fig.prev.e) || []).flat(), ...Object.keys(fig.c)]);
    const only = o => Object.fromEntries(Object.entries(o).filter(([k]) => keep.has(k)));
    fig.n = only(fig.n); fig.lb = only(fig.lb); fig.x = fig.x.filter(k => keep.has(k)); const live = new Set(fig.e.map(eKey)); fig.ts = Object.fromEntries(Object.entries(fig.ts || {}).filter(([k]) => live.has(k)));
    if (!fig.e.length && !fig.prev && !Object.keys(fig.c).length) delete FIGS[cell.id];
    else FIGS[cell.id] = { e: fig.e, end: fig.end, prev: fig.prev, n: fig.n, c: fig.c, lb: fig.lb, x: fig.x, ts: fig.ts, born: fig.born || null, ...(fig.name ? { name: fig.name } : {}), t: Date.now() };
    const ks = Object.keys(FIGS); if (ks.length > 80) ks.sort((a, b) => FIGS[a].t - FIGS[b].t).slice(0, ks.length - 80).forEach(k => delete FIGS[k]);
    store.set('da.figs.v1', FIGS);
  }
  /* ───────── where each knot is on the screen: a life where it has moved to ───────── */
  let itemsRef = null, itemIx = new Map();
  const itemOf = id => { if (itemsRef !== life.items) { itemsRef = life.items; itemIx = new Map(itemsRef.map(it => [it.o.id, it])); } return itemIx.get(id); };
  function pos(k) {
    const n = nodes.get(k) || (k === 'pin' && cell ? { key: 'pin', lat: cell.lat, lng: cell.lng } : null); if (!n) return null;
    if (n.t === 'life') { const it = itemOf(n.id); if (it) { n.x = it.x + it.dx; n.y = it.y + it.dy; n.r = it.b.d / 2; return n; } }
    const p = map.project([n.lng, n.lat]); n.x = p.x; n.y = p.y; n.r = n.t === 'water' ? 7 : n.t === 'group' ? 5.5 : n.t === 'pin' ? 14 : n.t === 'custom' ? 5.5 : n.cur ? 5.2 : 4.4; return n;
  }
  const lifeNode = id => !!cell && nodes.has('o:' + id);
  const focused = n => !!focus && (focus === n.key || (n.h || []).includes(focus) || (n.t === 'biz' && focus === 'fam:' + n.fam && !(n.harm || []).length));
  const visible = n => n.t !== 'biz' || n.cur || (n.harm || []).length > 0 || n.rank < MAX_BIZ || inFig(n.key) || n.away || n.key === peekKey || focused(n);
  /* ───────── drawing ───────── */
  const back = k => { k = clamp(k, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function curve(ctx, p, q, t0, now, i, part = 1) {
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1; const nx = -dy / L, ny = dx / L;
    const sag = Math.min(16, L * 0.055); let vib = 0;
    if (t0 != null && !reduced()) { const t = (now - t0) / 1000; if (t >= 0 && t < 1.8) { const f = 3 + 7 * (1 - clamp(L / 420, 0, 1)); vib = Math.min(15, L * 0.085) * Math.exp(-t / 0.4) * Math.sin(TAU * f * t); } }
    const sway = reduced() ? 0 : 0.7 * Math.sin(now / 1000 * 0.9 + i * 1.7);
    const mx = (p.x + q.x) / 2 + nx * (vib + sway), my = (p.y + q.y) / 2 + sag + ny * (vib + sway); const cx = 2 * mx - (p.x + q.x) / 2, cy = 2 * my - (p.y + q.y) / 2;
    ctx.moveTo(p.x, p.y);
    if (part >= 1) { ctx.quadraticCurveTo(cx, cy, q.x, q.y); return; }
    /* a string still being drawn: the first part of the curve */
    const T = clamp(part, 0, 1), ax = p.x + (cx - p.x) * T, ay = p.y + (cy - p.y) * T, bx = cx + (q.x - cx) * T, by = cy + (q.y - cy) * T;
    ctx.quadraticCurveTo(ax, ay, ax + (bx - ax) * T, ay + (by - ay) * T);
  }
  function lines(ctx, edges, at, now, tOf, alpha = 1, partOf = null, width = 1, hot = null) {
    if (!edges.length) return;
    ctx.save(); ctx.lineCap = 'round';
    for (const [w, c] of [[3.2 * width, 'rgba(0,0,0,.38)'], [1.5 * width, '#FFFFFF']]) {
      ctx.lineWidth = w;
      edges.forEach((e, i) => { const p = at(e[0]), q = at(e[1]); if (!p || !q) return; const part = partOf ? partOf(e, i) : 1; if (part <= 0) return; const t0 = tOf(e, i); ctx.strokeStyle = c !== '#FFFFFF' || !hot || !hot(e) ? c : C.orange; ctx.globalAlpha = typeof alpha === 'function' ? alpha(e, i, t0) : alpha; ctx.beginPath(); curve(ctx, p, q, t0, now, i, part); ctx.stroke(); });
    }
    ctx.restore();
  }
  /* a string to a place that sells or leaves what harms this life */
  const hotIn = nodeOf => e => e.some(k => { const n = k !== 'pin' && nodeOf(k); return !!n && n.t === 'biz' && (n.harm || []).length > 0; });
  /* the human ecology, drawn small: a diamond for a shop or a brand, filled by what it does; a room for a third space; three linked dots for a network */
  function placeMark(ctx, n, x, y, k, tied) {
    const r = (n.cur ? 5 : 4) * k * (tied ? 1.18 : 1); const harm = (n.harm || []).length > 0;
    const dia = (rr, fill, stroke, lw = 1.4) => { ctx.beginPath(); ctx.moveTo(x, y - rr); ctx.lineTo(x + rr, y); ctx.lineTo(x, y + rr); ctx.lineTo(x - rr, y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); };
    ctx.save();
    if (n.fam === 'third') { const h = r * 0.95; ctx.beginPath(); ctx.rect(x - h, y - h, h * 2, h * 2); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.navy; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, h * 0.38, 0, TAU); ctx.fillStyle = C.navy; ctx.fill(); }
    else if (n.fam === 'network') { const P = [[0, -r], [r * 0.95, r * 0.6], [-r * 0.95, r * 0.6]]; ctx.beginPath(); P.forEach(([a, b], i) => (i ? ctx.lineTo(x + a, y + b) : ctx.moveTo(x + a, y + b))); ctx.closePath(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.white; ctx.stroke(); for (const [a, b] of P) { ctx.beginPath(); ctx.arc(x + a, y + b, r * 0.42, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.navy; ctx.stroke(); } }
    else if (n.fam === 'artists') { dia(r, C.white, C.navy); ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, TAU); ctx.fillStyle = C.navy; ctx.fill(); }
    else if (n.fam === 'circular') dia(r, C.teal, C.navy);
    else if (n.fam === 'brand' && !harm) dia(r, C.cobalt, C.white, 1.2);
    else dia(r, harm ? C.neon : C.white, harm ? C.navy : C.cobalt);
    if (n.cur) { ctx.beginPath(); ctx.arc(x, y, r + 3.2, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke(); }
    ctx.restore();
  }
  function mark(ctx, n, x, y, k, tied) {
    if (k <= 0) return;
    if (n.t === 'biz') placeMark(ctx, n, x, y, k, tied);
    else if (n.t === 'group') { ctx.save(); ctx.beginPath(); ctx.arc(x, y, 5.6 * k, 0, TAU); ctx.fillStyle = C.tribe[n.kind] || C.tribe.park; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = C.white; ctx.stroke(); ctx.restore(); }
    else if (n.t === 'water') { ctx.save(); ctx.beginPath(); ctx.arc(x, y, 7.4 * k, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.restore(); M.icon(ctx, 'water', x, y, 10 * k, C.cobalt); }
    else if (n.t === 'custom') { const h = 5.4 * k; ctx.save(); ctx.beginPath(); ctx.rect(x - h, y - h, h * 2, h * 2); ctx.fillStyle = tied ? C.navy : C.white; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = tied ? C.white : C.navy; ctx.stroke(); ctx.restore(); M.icon(ctx, n.kind === 'person' ? 'people' : n.kind === 'idea' ? 'aware' : 'where', x, y, 8 * k, tied ? C.white : C.navy); }
    else if (n.t === 'life' && n.away) M.badge(ctx, { tone: n.hum ? 'offer' : M.toneOf(n.g), g: n.hum ? null : n.g, i: n.hum ? 'people' : null, d: 16 * k }, x, y);
  }
  /* a knot joined: a white ring; the knot the next string leaves from: a ring that breathes */
  function knotAt(ctx, k, x, y, r, now) {
    const tied = k === 'pin' ? fig.e.length > 0 : inFig(k); const end = fig.end === k;
    if (!tied && !end) return;
    ctx.save();
    if (tied && k !== 'pin') { ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke(); }
    if (end) { const s = reduced() ? 0 : Math.sin(now / 420); ctx.beginPath(); ctx.arc(x, y, r + 7 + s * 1.6, 0, TAU); ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.3; ctx.stroke(); }
    ctx.restore();
  }
  function draw(ctx, now, e) {
    if (!cell) return; const R = rangeOf(cell); const P = pos('pin');
    for (const n of nodes.values()) pos(n.key);
    /* threads of responsibility: from the life to each place that sells or leaves what harms it */
    if (P) {
      ctx.save(); ctx.lineCap = 'round';
      for (const n of nodes.values()) {
        if (n.t !== 'biz' || !(n.harm || []).length || n.x == null) continue; const k = reduced() ? 1 : clamp((e - 380 - (n.d / R) * 600) / 420, 0, 1); if (k <= 0) continue;
        const on = focus ? focused(n) : true; ctx.globalAlpha = (focus ? (on ? 0.95 : 0.1) : 0.42) * k; ctx.lineWidth = focus && on ? 1.6 : 1; ctx.strokeStyle = C.orange;
        ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(P.x + (n.x - P.x) * k, P.y + (n.y - P.y) * k); ctx.stroke();
      }
      ctx.restore();
    }
    /* the strings: whole, or drawn again one by one when the figure is traced */
    const traced = trace && now < trace.end; const glow = glowUntil > now ? (glowUntil - now) / 2600 : 0;
    const hot = hotIn(k => nodes.get(k));
    if (glow > 0) { ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 14 * glow; lines(ctx, fig.e, k => nodes.get(k), now, x => plucks.get(eKey(x)), 0.5 + 0.5 * glow, null, 1 + glow, hot); ctx.restore(); }
    lines(ctx, fig.e, k => nodes.get(k), now, x => plucks.get(eKey(x)), 1, traced ? (x, i) => clamp((now - trace.t0 - i * trace.step) / (trace.step * 0.8), 0, 1) : null, 1, hot);
    if (traced) traceCaption(now);
    else if (trace) { trace = null; if (capEl) capEl.hidden = true; }
    /* the string it would make, before it is made */
    let pv = peekKey && nodes.get(peekKey);
    const preview = (p, q) => { ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); curve(ctx, p, q, null, now, 0); ctx.strokeStyle = 'rgba(11,37,69,.5)'; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([6, 5]); ctx.lineDashOffset = reduced() ? 0 : -now / 40; ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); };
    if (pv && peekKey !== fig.end && !fig.e.some(([a, b]) => (a === fig.end && b === peekKey) || (b === fig.end && a === peekKey))) {
      const p = nodes.get(fig.end) || P; if (p && p.x != null) preview(p, pv);
    }
    /* a life outside the radius, looked at: the way out to it */
    if (peekKey && peekKey.startsWith('x:')) { const o = S.byId.get(idOf(peekKey.slice(2))); if (o && P) { const q = map.project([o.lng, o.lat]); pv = { x: q.x, y: q.y, r: 10 }; preview(P, pv); } }
    for (const n of nodes.values()) {
      if (n.t === 'pin' || !visible(n)) continue;
      const k = reduced() ? 1 : back((e - 560 - (n.d / R) * 520) / 260); const tied = inFig(n.key);
      if (n.t !== 'life' || n.away) mark(ctx, n, n.x, n.y, k, tied);
      if (focus && focused(n) && k >= 1) { const q = clamp((now - focusAt) / 300, 0, 1); ctx.save(); ctx.beginPath(); ctx.arc(n.x, n.y, (n.r || 5) + 5 + (1 - q) * 8, 0, TAU); ctx.strokeStyle = C.orange; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.4 + 0.6 * q; ctx.stroke(); ctx.restore(); }
      if (k >= 1) knotAt(ctx, n.key, n.x, n.y, n.r || 5, now);
    }
    if (pv && pv.x != null) { const q = clamp((now - peekAt) / 260, 0, 1); ctx.save(); ctx.beginPath(); ctx.arc(pv.x, pv.y, (pv.r || 5) + 6 + (1 - q) * 10, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.5 + 0.5 * q; ctx.stroke(); ctx.restore(); }
    drawLead(ctx);
    /* a constellation born: rings out from the life */
    if (fig.born && now - bornAt < 1400 && P) { const q = (now - bornAt) / 1400; for (const dq of [0, 0.18]) { const qq = clamp(q - dq, 0, 1); ctx.save(); ctx.beginPath(); ctx.arc(P.x, P.y, 16 + qq * 70, 0, TAU); ctx.strokeStyle = C.white; ctx.globalAlpha = (1 - qq) * 0.8; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); } }
    if (ghost) { const p = map.project([ghost.lng, ghost.lat]); const q = reduced() ? 1 : back((now - ghost.t) / 300); ctx.save(); ctx.beginPath(); ctx.rect(p.x - 7 * q, p.y - 7 * q, 14 * q, 14 * q); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = C.navy; ctx.stroke(); ctx.restore(); M.icon(ctx, 'plus', p.x, p.y, 10 * q, C.navy); }
  }
  /* ───────── touch ───────── */
  function hit(x, y, slack) {
    if (!cell) return null; let best = null;
    if (ghost) { const p = map.project([ghost.lng, ghost.lat]); if (Math.hypot(p.x - x, p.y - y) < 16) return { kind: 'node', key: '+', d: 0 }; }
    for (const n of nodes.values()) {
      if (!visible(n) || n.x == null) continue; const d = Math.hypot(n.x - x, n.y - y) - (n.r || 5) - (n.t === 'biz' ? 3 : 0);
      if (d <= slack && (!best || d < best.d)) best = { kind: 'node', key: n.key, d };
    }
    return best;
  }
  const panOf = k => { const n = pos(k); return n ? clamp((n.x / (innerWidth || 1)) * 2 - 1, -1, 1) : 0; };
  const lenOf = ([a, b]) => { const p = nodes.get(a), q = nodes.get(b); return p && q && cell ? clamp(haversine(p.lat, p.lng, q.lat, q.lng) / Math.max(100, rangeOf(cell)), 0, 1) : 0.5; };
  /* ───────── sound: each knot its own, each string its note ───────── */
  const SCALE = [196, 220.5, 245, 294, 326.7, 392, 441, 490, 588];
  const noteOf = len => SCALE[clamp(Math.round((1 - clamp(len, 0, 1)) * (SCALE.length - 1)), 0, SCALE.length - 1)];
  function soundOf(n) {
    if (!n) return { g: 'paw' };
    if (n.t === 'biz') return { fam: n.fam || (ROLES[n.role] || {}).cat || 'service' };
    if (n.t === 'group') return { fam: 'network' };
    if (n.t === 'water') return { g: 'aquatic' };
    if (n.t === 'custom') return n.kind === 'person' ? { fam: 'people' } : n.kind === 'idea' ? { g: 'butterfly' } : { g: 'plant' };
    if (n.t === 'life') return n.hum ? { fam: 'people' } : { g: n.g || 'paw' };
    return { g: n.g || 'paw' };
  }
  const voiceOf = k => soundOf(nodes.get(k));
  function changed() { life.redraw(); life.retag(); if (peekKey) card(); if (typeof stringsChanged === 'function') stringsChanged(); }
  /* ───────── the hand: a click looks, a second click (or a right-click) joins ───────── */
  function tap(k) {
    if (!cell) return;
    if (k === '+') { newKnot(); return; }
    if (k === 'pin') { unpeek(); playOpen(); return; }
    if (String(k).startsWith('x:')) { if (k === peekKey) bringIn(idOf(k.slice(2)), true); return; }
    if (!nodes.has(k)) return;
    if (k !== peekKey) { peek(k); return; }
    act(k);
  }
  /* right-click, or a long press: join a knot at once, or let it go */
  function join(k) {
    if (!cell || k === 'pin' || k === '+') return;
    if (String(k).startsWith('x:')) { bringIn(idOf(k.slice(2)), true); return; }
    if (!nodes.has(k)) return;
    if (inFig(k)) { untie(k); if (peekKey === k) card(); return; }
    tieTo(k, fig.end); if (peekKey && peekKey !== k) unpeek(); save(); changed();
  }
  let bornAt = 0;
  function tieTo(k, from, at = 0, quiet = false) {
    const n = nodes.get(k); if (!n || inFig(k)) return null; const now = performance.now();
    const e = [from, k]; fig.e.push(e); fig.n[k] = metaOf(n); if (from !== 'pin' && nodes.get(from)) fig.n[from] = metaOf(nodes.get(from));
    fig.ts[eKey(e)] = Date.now(); plucks.set(eKey(e), now + at * 1000); fig.end = k; fig.prev = null;
    if (!fig.born) { fig.born = Date.now(); bornAt = now; snd.born(); }
    if (!quiet) { const L = lenOf(e); snd.pluck(L, panOf(k)); snd.knot(voiceOf(k), noteOf(L), 0.12, 0.9, panOf(k)); }
    return e;
  }
  /* what a second click on a knot already looked at does: join it, carry on from it, or cut it */
  function act(k) {
    const n = nodes.get(k); if (!cell || !n || k === 'pin') return;
    if (k === fig.end) {
      for (let i = fig.e.length - 1; i >= 0; i--) { const [a, b] = fig.e[i]; if (a === k || b === k) { fig.e.splice(i, 1); fig.end = a === k ? b : a; break; } }
      if (!inFig(fig.end)) fig.end = 'pin';
      snd.snap(panOf(k)); save(); changed(); return;
    }
    if (inFig(k)) { fig.end = k; snd.tick(2300); buzz(4); save(); changed(); return; }
    tieTo(k, fig.end); save(); changed();
  }
  /* every place that does one thing, joined to the life at once: a fan of strings, plucked one after another */
  function joinAll(keys) {
    if (!cell) return 0; const ks = keys.filter(k => nodes.has(k) && !inFig(k)); if (!ks.length) return 0; const seq = [];
    ks.forEach((k, i) => { const e = tieTo(k, 'pin', i * 0.11, true); if (!e) return; const L = lenOf(e); seq.push({ f: noteOf(L), t: i * 0.11, pan: panOf(k), g: 0.07 }); });
    seq.push({ spec: voiceOf(ks[ks.length - 1]), f: noteOf(0.5), t: ks.length * 0.11 + 0.1, v: 0.8, pan: 0 });
    snd.song(seq); save(); changed(); return ks.length;
  }
  /* untie a knot wholly: every string to it */
  function untie(k) { const was = fig.e.length; fig.e = fig.e.filter(([a, b]) => a !== k && b !== k); if (!inFig(fig.end)) fig.end = fig.e.length ? fig.e[fig.e.length - 1][1] : 'pin'; if (fig.e.length !== was) { snd.snap(panOf(k)); save(); changed(); } }
  function undo() {
    if (!fig.e.length) { tick(600); return; } const e = fig.e.pop(); fig.end = inFig(e[0]) ? e[0] : 'pin';
    snd.snap(panOf(e[1])); save(); changed();
  }
  function reset() {
    if (!fig.e.length) { tick(600); return; } const lens = fig.e.map(lenOf);
    fig.prev = { e: fig.e, end: fig.end }; fig.e = []; fig.end = 'pin';
    snd.strum(lens.reverse(), -1); save(); changed();
  }
  function restore() {
    if (!fig.prev) { tick(600); return; } fig.e = fig.prev.e.map(x => [...x]); fig.end = fig.prev.end; fig.prev = null;
    const now = performance.now(); fig.e.forEach((e, i) => { plucks.set(eKey(e), now + i * 45); fig.ts[eKey(e)] = fig.ts[eKey(e)] || Date.now(); }); nodes = compute(cell);
    snd.strum(fig.e.map(lenOf), 1); save(); changed();
  }
  function strum(dir) { const now = performance.now(); fig.e.forEach((e, i) => plucks.set(eKey(e), now + i * 45)); snd.strum(fig.e.map(lenOf), dir); life.redraw(); }
  const busy = now => (S.mode === 'sig' && now - sigT < 2200) || !!ghost || !!peekKey || !!focus || glowUntil > now || !!trace || songUntil > now || (!!cell && (now - shownAt < 1800 || [...plucks.values()].some(t => now - t < 1800)));
  /* one kind of place lit up together; looked at a second time, joined together */
  function focusOn(f) { focus = f; focusAt = performance.now(); unpeek(); life.redraw(); }
  const unfocus = () => { if (focus) { focus = null; life.redraw(); } };

  /* ───────── looking: a small card beside the knot, its sound, and the string it would make ───────── */
  const ROLEW = r => (ROLES[r] || {}).w || '';
  const FAMW = f => (FAMILIES[f] || {}).w || '';
  const KINDW = { place: 'PLACE', person: 'PERSON', idea: 'IDEA' };
  function peek(k) { peekKey = k; peekAt = performance.now(); ghost = null; focus = null; buzz(3); card(); life.redraw(); life.retag(); const n = nodes.get(k); if (n) snd.knot(soundOf(n), noteOf(clamp((n.d || 0) / Math.max(100, rangeOf(cell)), 0, 1)), 0, 0.75, panOf(k)); if (typeof peekChanged === 'function') peekChanged(k); }
  function unpeek() { if (!peekKey && !ghost) return; peekKey = null; ghost = null; pk.hidden = true; lead = null; life.redraw(); life.retag(); if (typeof peekChanged === 'function') peekChanged(null); }
  /* a life outside the radius: looked at without losing the one open; a second click brings it in and joins it */
  function peekOut(id) {
    const o = S.byId.get(id); if (!o || !cell) return; if (peekKey === 'x:' + id) { bringIn(id, true); return; }
    peekKey = 'x:' + id; peekAt = performance.now(); ghost = null; card(); life.redraw(); snd.knot({ g: lifeOf(o) }, noteOf(0.9), 0, 0.7, 0);
  }
  function bringIn(id, tie) {
    const o = S.byId.get(id); if (!o || !cell) return; const d = haversine(cell.lat, cell.lng, o.lat, o.lng); if (d > CONFIG.RADIUS.max - 25) { tick(600); return; }
    if (d > rangeOf(cell)) { S.radius.set(cell.id, Math.min(CONFIG.RADIUS.max, Math.ceil((d + 25) / 10) * 10)); nodes = compute(cell); life.moved(); refreshRecord(); if (typeof placesAround === 'function') placesAround(cell.lat, cell.lng, rangeOf(cell) + 80); }
    const k = 'o:' + id; if (!nodes.has(k)) return; if (tie) { unpeek(); tieTo(k, fig.end); save(); changed(); } else peek(k);
  }
  /* the score of a knot's sound: its notes as dots on five lines, or a small wave for a person */
  function scoreSVG(spec) {
    const d = snd.describe(spec); if (d.people) return `<svg class="score" viewBox="0 0 44 14" aria-hidden="true"><path d="M2 7c4-6 6 6 10 0s6 6 10 0 6 6 10 0 6 6 10 0" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;
    let x = 4; const tot = d.notes.reduce((a, n) => a + n[1], 0) || 1; const dots = d.notes.map(([s2, dur]) => { const cx = x + (dur / tot) * 18; x += (dur / tot) * 36; return `<circle cx="${cx.toFixed(1)}" cy="${(11 - clamp(s2, -7, 24) * 0.36).toFixed(1)}" r="1.7"/>`; }).join('');
    return `<svg class="score" viewBox="0 0 44 14" aria-hidden="true"><path d="M0 2.5h44M0 5h44M0 7.5h44M0 10h44M0 12.5h44" stroke="currentColor" stroke-width=".4" opacity=".5"/><g fill="currentColor">${dots}</g></svg>`;
  }
  function card() {
    if (!peekKey) { pk.hidden = true; return; }
    if (peekKey === '+') return;
    let h = '';
    if (peekKey.startsWith('x:')) {
      const o = S.byId.get(idOf(peekKey.slice(2))); if (!o) { unpeek(); return; } const d = haversine(cell.lat, cell.lng, o.lat, o.lng);
      h = `${head(o, nameOf(o), `${esc((M.KINDS[lifeOf(o)] || '').toUpperCase())} · ${metres(d)}`, null, { g: lifeOf(o) }, 'open')}${!o.hum ? `<p class="pk-line">${esc(threatOf(o))}</p>` : ''}`;
    } else {
      const n = nodes.get(peekKey); if (!n) { unpeek(); return; }
      /* a place: what it does that harms this life comes first; what it is, after */
      const hr = n.t === 'biz' ? (n.harm || []) : []; const rw = hr.length ? ROLEW(hr[0]) : ROLEW(n.role);
      const what = n.t === 'biz' ? `${FAMW(n.fam)}${rw && rw !== FAMW(n.fam) ? ` · ${rw}` : ''}` : n.t === 'group' ? 'GROUP' : n.t === 'water' ? 'WATER' : n.t === 'custom' ? KINDW[n.kind] || 'KNOT' : esc((M.KINDS[n.g] || '').toUpperCase());
      const meta = [what, n.d ? metres(n.d) : ''].filter(Boolean).join(' · ');
      const o = n.t === 'life' ? S.byId.get(n.id) : null;
      const line = n.t === 'biz' ? (hr.length && !n.what ? (ROLES[hr[0]] || {}).duty : n.what || (ROLES[n.role] || {}).duty || '') : n.t === 'group' ? n.what || '' : o && !n.hum ? threatOf(o) : '';
      const harms = hr.slice(1).map(r => ROLEW(r)).filter(Boolean);
      h = `${head(o, labelOf(peekKey), meta, n, soundOf(n), o ? 'open' : (n.url || n.link) ? 'link' : '')}${line ? `<p class="pk-line">${esc(cap(line))}</p>` : ''}${harms.length ? `<p class="pk-harm mono">ALSO ${harms.join(' · ')}</p>` : ''}${n.addr ? `<p class="pk-addr mono">${esc(n.addr.toUpperCase())}</p>` : ''}`;
    }
    pk.innerHTML = h.replace(/(\d) (K?M)\b/g, '$1 $2'); pk.hidden = false; pk.classList.remove('in'); void pk.offsetWidth; pk.classList.add('in'); place();
  }
  function head(o, name, meta, n, spec, go) {
    const sub = o ? subjectOf(o) : null;
    const img = sub && sub.ph && licOpen(sub.ph.l) ? `<img src="${esc(photoURL(sub.ph.u, 'small'))}" alt="">` : o ? `<img src="${badgeImg(life.badgeOf(o, 40), 44)}" alt="">` : n && n.t === 'biz' ? `<i class="fm fm-${esc(n.fam || 'service')}${(n.harm || []).length ? ' harm' : ''}"></i>` : n && n.t === 'group' ? `<i class="patch" style="--c:${C.tribe[n.kind] || C.tribe.park}"></i>` : n && n.t === 'water' ? icon('water') : n && n.t === 'custom' ? `<i class="sq big${inFig(n.key) ? ' tied' : ''}">${icon(n.kind === 'person' ? 'people' : n.kind === 'idea' ? 'aware' : 'where', 'sm')}</i>` : icon('where');
    const url = n && (n.url || n.link);
    const nm = go === 'open' ? `<button type="button" class="pk-nm" data-pk="open">${esc(name)}</button>` : go === 'link' && url ? `<a class="pk-nm" href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>` : `<b class="pk-nm">${esc(name)}</b>`;
    return `<div class="pk-top">${img}<span class="pk-id">${nm}<small>${meta}</small></span><button type="button" class="pk-x" data-pk="close" aria-label="Close">${icon('close', 'sm')}</button></div>`;
  }
  /* the card sits outside the radius, on the knot's side, so every knot inside stays in reach; a thread leads back to the knot */
  let lead = null;
  function place() {
    lead = null; if (pk.hidden || !peekKey) return; let x0, y0;
    if (peekKey === '+' && ghost) { const p = map.project([ghost.lng, ghost.lat]); x0 = p.x; y0 = p.y; }
    else if (peekKey.startsWith('x:')) { const o = S.byId.get(idOf(peekKey.slice(2))); if (!o) return; const p = map.project([o.lng, o.lat]); x0 = p.x; y0 = p.y; }
    else { const n = pos(peekKey); if (!n) return; x0 = n.x; y0 = n.y; }
    const c = map.getContainer(); const W = c.clientWidth, H = c.clientHeight; const open = S.open && !phone() ? Math.min(440, innerWidth * 0.4) : 0; const bottom = phone() && S.open ? innerHeight * 0.42 : H;
    const w = pk.offsetWidth || 250, h = pk.offsetHeight || 120; const right = W - open - 8, low = bottom - 8;
    const fits = (x, y) => x >= 8 && y >= 8 && x + w <= right && y + h <= low;
    const ctr = cell ? map.project([cell.lng, cell.lat]) : null; let at = null;
    if (ctr && !peekKey.startsWith('x:')) {
      const e = map.project([cell.lng + rangeOf(cell) / (111320 * Math.cos(cell.lat * Math.PI / 180)), cell.lat]); const R = Math.abs(e.x - ctr.x) + 14;
      /* clear of the circle: a rectangle whose nearest corner or edge is outside it */
      const clear = (x, y) => { const nx = clamp(ctr.x, x, x + w), ny = clamp(ctr.y, y, y + h); return Math.hypot(nx - ctr.x, ny - ctr.y) >= R; };
      let dx = x0 - ctr.x, dy = y0 - ctr.y; const L = Math.hypot(dx, dy); if (L < 4) { dx = 1; dy = 0; } else { dx /= L; dy /= L; }
      const ext = Math.min(Math.abs(dx) > 1e-3 ? (w / 2) / Math.abs(dx) : 1e9, Math.abs(dy) > 1e-3 ? (h / 2) / Math.abs(dy) : 1e9);
      const ty = clamp(y0 - h / 2, 8, Math.max(8, low - h)), tx = clamp(x0 - w / 2, 8, Math.max(8, right - w));
      const cands = [[ctr.x + dx * (R + ext) - w / 2, ctr.y + dy * (R + ext) - h / 2], [ctr.x + R, ty], [ctr.x - R - w, ty], [tx, ctr.y + R], [tx, ctr.y - R - h], [8, 8], [right - w, 8], [8, low - h], [right - w, low - h]];
      at = cands.find(([x, y]) => fits(x, y) && clear(x, y)) || null;
    }
    /* no room outside the circle: beside the knot, then docked at an edge, never over the knot or the life at the centre */
    if (!at) {
      const box = ([x, y]) => [clamp(x, 8, Math.max(8, right - w)), clamp(y, 8, Math.max(8, low - h))];
      const over = ([x, y], px, py, m) => px > x - m && px < x + w + m && py > y - m && py < y + h + m;
      const side = ctr && x0 < ctr.x ? -1 : 1;
      const cands = [[side < 0 ? x0 - w - 18 : x0 + 18, y0 - h / 2], [side < 0 ? x0 + 18 : x0 - w - 18, y0 - h / 2], [x0 - w / 2, y0 - h - 18], [x0 - w / 2, y0 + 18], [8, 8], [right - w, 8], [8, low - h], [right - w, low - h]].map(box);
      at = cands.find(c2 => !over(c2, x0, y0, 10) && !(ctr && over(c2, ctr.x, ctr.y, 16))) || cands.find(c2 => !over(c2, x0, y0, 10)) || cands[0];
    }
    let [x, y] = at;
    x = clamp(x, 8, Math.max(8, right - w)); y = clamp(y, 8, Math.max(8, low - h));
    pk.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    const lx = clamp(x0, x, x + w), ly = clamp(y0, y, y + h); if (Math.hypot(lx - x0, ly - y0) > 14) lead = { x0, y0, x1: lx, y1: ly };
  }
  /* the thread from the card back to its knot */
  function drawLead(ctx) { if (!lead || pk.hidden) return; ctx.save(); ctx.beginPath(); ctx.moveTo(lead.x0, lead.y0); ctx.lineTo(lead.x1, lead.y1); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.restore(); }
  pk.addEventListener('click', e => {
    const b = e.target.closest('[data-pk]'); if (!b) return; const a = b.dataset.pk; const k = peekKey; if (!k) return;
    if (a === 'close') { unpeek(); tick(900); return; }
    if (a === 'open') { const id = idOf(k.startsWith('x:') ? k.slice(2) : String(nodes.get(k).id)); unpeek(); select(id); }
  });
  pk.addEventListener('contextmenu', e => { e.preventDefault(); if (peekKey) join(peekKey); });
  /* ───────── knots of your own: a place, a person or an idea, anywhere in the radius ───────── */
  function ground(ll) {
    if (!cell) return; if (peekKey || ghost || focus) { unpeek(); unfocus(); tick(900); return; }
    ghost = { lat: ll.lat, lng: ll.lng, t: performance.now() }; snd.tick(1300); life.redraw();
  }
  function newKnot() {
    if (!ghost) return; peekKey = '+'; peekAt = performance.now();
    pk.innerHTML = `<div class="pk-top">${icon('plus')}<span class="pk-id"><b class="pk-nm">&nbsp;</b><small>${metres(haversine(cell.lat, cell.lng, ghost.lat, ghost.lng))}</small></span><button type="button" class="pk-x" data-pk="close" aria-label="Close">${icon('close', 'sm')}</button></div>`
      + `<form class="pk-new" id="pk-new"><input id="pk-n" type="text" maxlength="40" placeholder="Name" aria-label="Name" autocomplete="off"><div class="pk-kinds">${Object.entries(KINDW).map(([k, w], i) => `<button type="button" class="chip${i ? '' : ' on'}" data-kind="${k}" aria-pressed="${!i}">${w}</button>`).join('')}</div><button type="submit" class="pk-main" aria-label="Add">${icon('check', 'sm')}</button></form>`;
    pk.hidden = false; pk.classList.remove('in'); void pk.offsetWidth; pk.classList.add('in'); place(); snd.tick(1700);
    const f = $('#pk-new'); let kind = 'place';
    f.addEventListener('click', e => { const c = e.target.closest('[data-kind]'); if (!c) return; kind = c.dataset.kind; f.querySelectorAll('[data-kind]').forEach(b => { b.classList.toggle('on', b === c); b.setAttribute('aria-pressed', String(b === c)); }); tick(1500); });
    f.addEventListener('submit', e => { e.preventDefault(); const name = $('#pk-n').value.trim(); if (!name) { nudge($('#pk-n')); return; } const k = 'k:' + Date.now().toString(36); fig.c[k] = { t: 'custom', n: name, kind, lat: +ghost.lat.toFixed(5), lng: +ghost.lng.toFixed(5) }; ghost = null; save(); nodes = compute(cell); peek(k); changed(); });
    if (!coarse()) setTimeout(() => { const i = $('#pk-n'); if (i) i.focus(); }, 60);
  }
  function removeKnot(k) { if (!fig.c[k]) return false; delete fig.c[k]; untie(k); save(); nodes = compute(cell); if (peekKey === k) unpeek(); changed(); snd.snap(0); return true; }
  /* ───────── what the card and the slip read ───────── */
  const labelOf = k => (fig.lb[k] != null ? fig.lb[k] : (nodes.get(k) || fig.n[k] || fig.c[k] || {}).n || '');
  const included = k => !fig.x.includes(k);
  function setInclude(k, on) { fig.x = fig.x.filter(x => x !== k); if (!on) fig.x.push(k); save(); }
  function setLabel(k, t) { const orig = (nodes.get(k) || fig.n[k] || {}).n || ''; if (!t.trim() || t.trim() === orig) delete fig.lb[k]; else fig.lb[k] = t.trim().slice(0, 40); save(); }
  const tied = () => { const seen = new Set(); const out = []; for (const [a, b] of fig.e) for (const k of [a, b]) if (k !== 'pin' && !seen.has(k)) { seen.add(k); const n = nodes.get(k) || (fig.n[k] && { ...fig.n[k], key: k }); if (n) out.push({ ...n, key: k, label: labelOf(k), inc: included(k) }); } return out; };
  function reach() {
    const order = { custom: 0, biz: 1, group: 2, water: 3, life: 4 };
    return [...nodes.values()].filter(n => n.t !== 'pin').map(n => ({ ...n, tied: inFig(n.key) })).sort((a, b) => (b.tied - a.tied) || order[a.t] - order[b.t] || ((b.cur ? 1 : 0) - (a.cur ? 1 : 0)) || ((b.harm || []).length - (a.harm || []).length) || a.d - b.d);
  }
  /* who in the radius does what harms this life, and who can help: counted in plain words, each a set of knots */
  function ledgerOf() {
    const harm = new Map(), help = new Map();
    for (const n of nodes.values()) {
      if (n.t !== 'biz' || n.away) continue;
      for (const r of n.harm || []) { if (!harm.has(r)) harm.set(r, []); harm.get(r).push(n.key); }
      if (!(n.harm || []).length && !n.on) { const f = n.fam || 'service'; if (f === 'service') continue; if (!help.has(f)) help.set(f, []); help.get(f).push(n.key); }
    }
    const press = PRESSURES[lifeOf(cell)] || [];
    return { harm: [...harm.entries()].sort((a, b) => press.indexOf(a[0]) - press.indexOf(b[0])), help: [...help.entries()].sort((a, b) => b[1].length - a[1].length), total: new Set([...harm.values()].flat()).size };
  }
  function tagHTML(k) {
    const n = nodes.get(k); if (!n || k === peekKey) return ''; const d = n.d ? ` · ${metres(n.d)}` : '';
    if (n.t === 'pin') return `<span class="tx"><b>${esc(n.n)}</b><small>${fig.e.length ? `${fig.e.length} ${icon('string', 'sm')}` : ''}</small></span>`;
    const what = n.t === 'biz' ? `<i class="role${(n.harm || []).length ? ' on' : ''}">${(n.harm || []).length ? ROLEW(n.harm[0]) : FAMW(n.fam) || ROLEW(n.role)}</i>` : n.t === 'group' ? 'GROUP' : n.t === 'water' ? 'WATER' : n.t === 'custom' ? KINDW[n.kind] || 'KNOT' : esc((M.KINDS[n.g] || '').toUpperCase());
    return `<span class="tx"><b>${esc(labelOf(k) || n.n)}</b><small>${what}${d}${inFig(k) ? ` · ${icon('string', 'sm')}` : ''}</small></span>`;
  }
  /* the figure carried by a signal: each knot kept as a bearing and a distance from the cell, so it can be drawn anywhere */
  function snapshot() {
    if (!cell) return { nodes: [], edges: [] }; const keys = []; const ix = k => { if (k === 'pin') return 'pin'; let i = keys.indexOf(k); if (i < 0) { keys.push(k); i = keys.length - 1; } return String.fromCharCode(97 + i); };
    /* a knot left off the slip passes its strings on: whatever was tied through it joins up past it */
    const rep = { pin: 'pin' }, seen = new Set(), edges = [];
    for (const [a, b] of fig.e) {
      const ra = rep[a] || (included(a) ? a : 'pin');
      if (!included(b)) { if (!rep[b]) rep[b] = ra; continue; }
      rep[b] = b; const id = [ra, b].sort().join('|'); if (ra === b || seen.has(id)) continue; seen.add(id); edges.push([ix(ra), ix(b)]);
    }
    const out = keys.map((k, i) => { const n = nodes.get(k) || fig.n[k] || fig.c[k] || {}; return { k: String.fromCharCode(97 + i), t: n.t, n: labelOf(k) || n.n, ...(n.role ? { role: n.role } : {}), ...(n.fam && n.t === 'biz' ? { fam: n.fam } : {}), ...(n.t === 'biz' ? { h: n.harm || (n.h || []).filter(r => (PRESSURES[lifeOf(cell)] || []).includes(r)) } : {}), ...(n.url ? { u: n.url } : {}), ...(n.g && n.t === 'life' ? { g: n.g } : {}), ...(n.kind && (n.t === 'group' || n.t === 'custom') ? { kind: n.kind } : {}), b: Math.round(bearing(cell.lat, cell.lng, n.lat, n.lng)), d: Math.round(haversine(cell.lat, cell.lng, n.lat, n.lng)) }; });
    return { nodes: out, edges };
  }
  /* a signal's figure, read only: its strings plucked once as it opens */
  let sigT = 0;
  const showSig = () => { sigT = performance.now(); life.redraw(); };
  function drawSig(ctx, now) {
    const s = S.signals.find(x => x.key === S.sig); if (!s || !s.pin) return; const P = map.project([s.pin.lng, s.pin.lat]);
    const at = k => { if (k === 'pin') return { x: P.x, y: P.y }; const n = (s.nodes || []).find(x => x.k === k); if (!n) return null; const [la, ln] = dest(s.pin.lat, s.pin.lng, n.d, n.b); const p = map.project([ln, la]); return { ...n, x: p.x, y: p.y }; };
    const t0 = sigT || now;
    const sn = k => { const n = (s.nodes || []).find(x => x.k === k); return n && { t: n.t, harm: harmsOfNode(n) }; };
    lines(ctx, s.edges || [], at, now, (e, i) => t0 + 300 + i * 60, 1, null, 1, hotIn(sn));
    for (const n of s.nodes || []) { const p = at(n.k); if (!p) continue; const k = reduced() ? 1 : back((now - t0 - 200) / 300); if (n.t === 'life') M.badge(ctx, { tone: M.toneOf(n.g || 'paw'), g: n.g || 'paw', d: 18 * k }, p.x, p.y); else mark(ctx, { ...n, on: onNotice(n.role), fam: n.fam || (ROLES[n.role] || {}).cat }, p.x, p.y, k, true); }
  }
  /* ───────── every figure the radar holds, faint; and played as a song from the radar's centre ───────── */
  let songUntil = 0; const songT = new Map();
  const figCells = () => Object.entries(FIGS).map(([id, f]) => ({ id: idOf(id), f, o: S.byId.get(idOf(id)) })).filter(c => c.o && (c.f.e || []).length && (!cell || c.o.id !== cell.id) && life.inScan(c.o.lat, c.o.lng) && !hiddenCell(c.o.id));
  const figAt = c => k => { const m = k === 'pin' ? c.o : c.f.n[k] || (c.f.c || {})[k]; if (!m) return null; const p = map.project([m.lng, m.lat]); return { x: p.x, y: p.y }; };
  function drawSaved(ctx, now) {
    if (S.mode === 'sig') return;
    for (const c of figCells()) { const press = new Set(PRESSURES[lifeOf(c.o)] || []); const mn = k => { const m = c.f.n[k]; return m && { t: m.t, harm: (m.h || []).filter(r => press.has(r)) }; };
      lines(ctx, c.f.e, figAt(c), now, (e, i) => songT.get(`${c.id}|${i}`), (e, i, t0) => (t0 != null && now - t0 > -50 && now - t0 < 1400 ? 1 : 0.34), null, 1, hotIn(mn)); }
  }
  /* each figure its own register, so the figures in one song are told apart */
  const REG = [1, 1.5, 0.75, 2, 1.125];
  /* one figure as notes: each string plucked in the order it was tied, and the knot at its end answering in its own sound */
  function figSeq(c, t0, reg, seq, now, open) {
    const at = k => (k === 'pin' ? c.o : c.f.n[k] || (c.f.c || {})[k] || (open ? nodes.get(k) : null));
    const panOfLL = (lat, lng) => clamp(map.project([lng, lat]).x / (innerWidth || 1) * 2 - 1, -1, 1); let t = t0, n = 0;
    c.f.e.slice(0, 24).forEach((e, i) => {
      const p = at(e[0]), q = at(e[1]); if (!p || !q) return; const L = clamp(haversine(p.lat, p.lng, q.lat, q.lng) / 600, 0, 1); const f = noteOf(L) * reg; const pan = panOfLL(q.lat, q.lng);
      seq.push({ f, t, pan, lat: q.lat, lng: q.lng });
      const sp = soundOf(q.t ? q : { t: 'pin', g: lifeOf(c.o) }); const d = snd.describe(sp);
      seq.push({ spec: sp, f, t: t + 0.14, v: 0.85, pan, quiet: true });
      if (open) plucks.set(eKey(e), now + t * 1000); else songT.set(`${c.id}|${i}`, now + t * 1000);
      t += clamp(d.len * 0.85, 0.55, 1.1); n++;
    });
    /* each tune comes home to its own life, softly */
    if (n) { seq.push({ spec: { g: lifeOf(c.o) }, f: SCALE[0] * reg * 2, t, v: 0.6, pan: panOfLL(c.o.lat, c.o.lng), lat: c.o.lat, lng: c.o.lng }); t += 1.1; }
    return t;
  }
  function song() {
    const seq = []; let t = 0; const c0 = S.scan; const now = performance.now(); songT.clear();
    const cells = figCells().sort((a, b) => bearing(c0.lat, c0.lng, a.o.lat, a.o.lng) - bearing(c0.lat, c0.lng, b.o.lat, b.o.lng));
    const all = cell && fig.e.length ? [{ id: cell.id, o: cell, f: fig, open: true }, ...cells] : cells;
    all.forEach((c, ci) => { if (t < 60) t = figSeq(c, t, REG[ci % REG.length], seq, now, !!c.open); });
    /* no strings yet: the lives the radar has found, each in its own sound, in the order the hand meets them */
    if (!seq.length) {
      life.items.filter(it => it.inS && life.seen().has(it.o.id) && life.shown(it) && !it.o.hist).sort((a, b) => a.sb - b.sb).slice(0, 16).forEach((it, i) => { const sp = { g: lifeOf(it.o) }; seq.push({ spec: sp, f: SCALE[(i * 3) % SCALE.length], t, v: 0.8, pan: clamp(it.x / (innerWidth || 1) * 2 - 1, -1, 1), lat: it.lat, lng: it.lng }); t += clamp(snd.describe(sp).len * 0.7, 0.4, 0.9); });
    }
    songUntil = now + t * 1000 + 1600; snd.song(seq); return seq.filter(n => n.lat != null).map(n => ({ ...n, at: now + n.t * 1000 }));
  }
  /* the open figure alone, as a song */
  function playOpen() { if (!cell || !fig.e.length) { strum(1); return []; } const seq = []; const now = performance.now(); const t = figSeq({ id: cell.id, o: cell, f: fig }, 0, 1, seq, now, true); songUntil = now + t * 1000 + 1200; snd.song(seq); life.redraw(); return seq; }
  /* ───────── constellations: every figure, named, kept, listed on NOW ───────── */
  const nameFor = (o, f) => (f && f.name) || (o ? `${nameOf(o)} · ${title(placeOf(o))}` : 'A constellation');
  function list() {
    const all = Object.entries(FIGS).filter(([, f]) => (f.e || []).length).map(([id, f]) => {
      const o = S.byId.get(idOf(id)); const keys = [...new Set(f.e.flat())].filter(k => k !== 'pin'); const m = k => f.n[k] || (f.c || {})[k] || {};
      const people = keys.filter(k => ['biz', 'group'].includes(m(k).t) || (m(k).t === 'custom' && m(k).kind === 'person') || m(k).hum).length;
      const lives = keys.filter(k => m(k).t === 'life' && !m(k).hum).length, water = keys.filter(k => m(k).t === 'water').length;
      return { id: idOf(id), o, f, name: nameFor(o, f), keys, people, lives, water, edges: f.e.length, born: f.born || f.t, t: f.t };
    }).filter(c => c.o).sort((a, b) => b.t - a.t);
    /* knots shared with other constellations: the web between webs */
    const by = new Map(); for (const c of all) for (const k of c.keys) { if (/^(k:|s:)/.test(k)) continue; if (!by.has(k)) by.set(k, []); by.get(k).push(c.id); }
    for (const c of all) { const sh = new Map(); for (const k of c.keys) for (const id of by.get(k) || []) if (id !== c.id) { if (!sh.has(id)) sh.set(id, []); sh.get(id).push(k); } c.shared = [...sh.entries()].map(([id, ks]) => ({ id, ks, name: (all.find(x => x.id === id) || {}).name || '' })); }
    return all;
  }
  function rename(id, name) { const f = FIGS[id]; if (!f) return; const t = String(name || '').trim().slice(0, 48); if (t && t !== nameFor(S.byId.get(idOf(id)), {})) f.name = t; else delete f.name; store.set('da.figs.v1', FIGS); if (cell && String(cell.id) === String(id)) fig.name = f.name || ''; }
  /* a constellation drawn as a star chart: the life at the centre ringed, people as small diamonds, lives as dots */
  function chartOf(id, size = 56) {
    const f = FIGS[id] || (cell && String(cell.id) === String(id) ? fig : null); const o = S.byId.get(idOf(id)); if (!f || !o) return '';
    const pts = { pin: { x: 0, y: 0, t: 'pin' } }; const kx = Math.cos(o.lat * Math.PI / 180);
    for (const k of new Set(f.e.flat())) { if (k === 'pin') continue; const m = f.n[k] || (f.c || {})[k]; if (m) pts[k] = { x: (m.lng - o.lng) * kx, y: -(m.lat - o.lat), t: m.t }; }
    const ext = Math.max(1e-5, ...Object.values(pts).map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))); const s = (size / 2 - 6) / ext; const c = size / 2;
    const P = k => pts[k] && [c + pts[k].x * s, c + pts[k].y * s];
    const ln = f.e.map(([a, b]) => { const p = P(a), q = P(b); return p && q ? `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}` : ''; }).join('');
    const dots = Object.entries(pts).map(([k, p]) => { const [x, y] = P(k); return p.t === 'pin' ? `<circle cx="${x}" cy="${y}" r="3.2" fill="none" stroke="currentColor" stroke-width="1.2"/>` : p.t === 'biz' || p.t === 'group' ? `<path d="M${x} ${(y - 2.4).toFixed(1)}l2.4 2.4-2.4 2.4-2.4-2.4z" fill="currentColor"/>` : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="currentColor"/>`; }).join('');
    return `<svg class="chart" viewBox="0 0 ${size} ${size}" aria-hidden="true"><path d="${ln}" fill="none" stroke="currentColor" stroke-width=".8" opacity=".7"/>${dots}</svg>`;
  }
  /* the whole web at once: every string lit, every knot in view */
  function glow() { glowUntil = performance.now() + 2600; strum(1); life.redraw(); }
  function extent() {
    if (!cell) return null; const ks = [...new Set(fig.e.flat())]; const pts = ks.map(k => (k === 'pin' ? cell : nodes.get(k) || fig.n[k] || fig.c[k])).filter(Boolean); if (pts.length < 2) return null;
    return [[Math.min(...pts.map(p => p.lng)), Math.min(...pts.map(p => p.lat))], [Math.max(...pts.map(p => p.lng)), Math.max(...pts.map(p => p.lat))]];
  }
  /* its origin story: the strings drawn again in the order they were tied, each with its sound, and a line that says which */
  function traceIt() {
    if (!cell || !fig.e.length) return; const now = performance.now(); const step = 900; const n = Math.min(fig.e.length, 24);
    trace = { t0: now + 250, step, end: now + 250 + n * step + 900, n };
    const seq = []; fig.e.slice(0, n).forEach((e, i) => { const q = nodes.get(e[1]) || fig.n[e[1]] || fig.c[e[1]]; const L = lenOf(e); const f = noteOf(L); const t = 0.25 + i * step / 1000; seq.push({ f, t: t + 0.05, pan: panOf(e[1]) }); if (q) seq.push({ spec: soundOf(q.t ? q : { g: 'paw' }), f, t: t + 0.2, v: 0.85, pan: panOf(e[1]) }); plucks.set(eKey(e), now + (t + 0.05) * 1000); });
    snd.song(seq); songUntil = trace.end; life.redraw();
  }
  function traceCaption(now) {
    if (!capEl || !trace) return; const i = clamp(Math.floor((now - trace.t0) / trace.step), 0, trace.n - 1); if (now < trace.t0) return;
    if (capEl.dataset.i === String(i) && !capEl.hidden) return; capEl.dataset.i = String(i);
    const [a, b] = fig.e[i]; const nm = k => (k === 'pin' ? nameOf(cell) : labelOf(k) || (nodes.get(k) || {}).n || ''); const ts = fig.ts[eKey(fig.e[i])];
    capEl.innerHTML = `<b class="mono">${i + 1}/${trace.n}</b><span>${esc(nm(a))} <i>→</i> ${esc(nm(b))}</span>${ts ? `<small class="mono">${fmtStamp(ts)}</small>` : ''}`; capEl.hidden = false;
  }
  /* one constellation as a song, from the list, wherever it is */
  function playFig(id) {
    const f = FIGS[id] || (cell && String(cell.id) === String(id) ? fig : null); const o = S.byId.get(idOf(id)); if (!f || !o) return 0;
    const seq = []; const now = performance.now(); const t = figSeq({ id: idOf(id), o, f, open: !!cell && cell.id === o.id }, 0, 1, seq, now, !!cell && cell.id === o.id); songUntil = now + t * 1000 + 1000; snd.song(seq); life.redraw(); return t;
  }
  return { open, seed, close, refresh, draw, drawSig, drawSaved, showSig, knotAt, hit, tap, join, act, joinAll, untie, undo, reset, restore, strum, busy, pos, lifeNode, tied, reach, ledgerOf, tagHTML, snapshot,
    peek, unpeek, peekOut, bringIn, ground, place, song, playOpen, labelOf, included, setInclude, setLabel, removeKnot, focusOn, unfocus, soundOf, scoreSVG,
    list, rename, chartOf, glow, extent, traceIt, playFig, nameFor,
    get cell() { return cell; }, get fig() { return fig; }, get nodes() { return nodes; }, get peeked() { return peekKey; }, get ghost() { return ghost; }, get focus() { return focus; }, get tracing() { return !!trace; }, inFig };
})();
