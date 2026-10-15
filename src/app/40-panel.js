
/* ════════════════════════════════════════════════════════════════════
   THE PAGE — closed until it is asked for. NOW: the months ahead, the five in greatest need, anything hurt or lost,
   and the gigs. STORIES: the signals people have issued, newest first, then the groups, the tools and the sources.
   ════════════════════════════════════════════════════════════════════ */
const panel = $('#panel'), rail = $('#rail'), viewEl = $('#view');
rail.innerHTML = VIEWS.map((v, i) => `<button type="button" class="tab${i < 3 ? '' : ' apart'}" data-i="${i}" aria-label="${v.label}" data-tip="${v.w}" aria-pressed="false"><span class="sq">${icon(v.icon)}</span>${i < 3 ? '<i class="knot" aria-hidden="true"></i>' : ''}<i class="flag" hidden></i></button>`).join('');
/* the day's thread: a knot tied at each destination as the journey reaches it, and the string drawn on to it */
function drawThread() { const t = [0, 1, 2].filter(n => DAY[n]); $$('#rail .tab').forEach((b, i) => b.classList.toggle('tied', !!DAY[i])); rail.style.setProperty('--tp', `${t.length ? Math.max(...t) * 46 : 0}px`); }
function tie(n) {
  if (DAY[n]) return; DAY[n] = Date.now(); store.set('da.day.v1', DAY); drawThread();
  if (prefs.sound) snd.knot({ fam: 'people' }, F0 * [4, 5, 6][n], 0.05, 0.6, 0.6);
}
drawThread();
rail.addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; const i = +b.dataset.i; tick(1400 + 160 * i); if (i === S.view && S.open && !S.mode) { setOpen(false); return; } setView(i); });
rail.addEventListener('keydown', e => { const b = e.target.closest('.tab'); if (!b) return; const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (!d) return; e.preventDefault(); const all = $$('#rail .tab'); all[(all.indexOf(b) + d + all.length) % all.length].focus(); });
new ResizeObserver(() => { if (S.mapReady) map.resize(); }).observe($('#world'));
function setOpen(on) {
  S.open = on; document.body.classList.toggle('shut', !on); buzz(5);
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(on && +b.dataset.i === S.view && !S.mode)));
  if (!on) { stopHeroes(); showBoard(false); showZine(false); document.body.classList.remove('off-map'); if (S.mode) closeRecord('view'); }
  else document.body.classList.toggle('off-map', S.view !== 0);
  /* on a phone the sheet covers the lower half: the radar moves up into the half left open */
  if (phone() && S.mapReady && !S.mode) map.easeTo({ center: [S.scan.lng, S.scan.lat], offset: on ? [0, -innerHeight * 0.27] : [0, 0], duration: reduced() ? 0 : 500 });
  life.moved();
}

/* the living icon, small, for the page: the same icon as on the ground */
const imgCache = new Map();
function badgeImg(b, size = 36) {
  const key = JSON.stringify([b.g, b.i, b.tone, b.sig, b.fresh, b.n > 1, b.carried, b.hot, b.dz, size]);
  if (imgCache.has(key)) return imgCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size * 2; const x = c.getContext('2d'); x.scale(2, 2);
  M.badge(x, { ...b, d: Math.round(size * 0.72), a: 1 }, size / 2, size / 2);
  const url = c.toDataURL(); imgCache.set(key, url); return url;
}
const pinOf = o => badgeImg(life.badgeOf(o, 22));
/* a partner's W.I.S.H. printer, small, for the page: its light on when the printer is listening */
function printerImg(p, st = {}) { const key = `printer|${!!st.ready}`; if (imgCache.has(key)) return imgCache.get(key); const c = document.createElement('canvas'); c.width = c.height = 88; const x = c.getContext('2d'); x.scale(2, 2); M.printer(x, 22, 25, 32, 0, !!st.ready); const u = c.toDataURL(); imgCache.set(key, u); return u; }
const lab = (t, cls = '') => `<h3 class="lab ${cls}">${t}</h3>`;
/* a degree of danger, in orange; and how long until it lands */
const degChip = (deg, word = '') => (deg ? `<i class="dg d${deg}">${DEG[deg]}${word ? ` · ${word}` : ''}</i>` : '');
const whenChip = w => (w ? `<i class="wn${w.now ? ' now' : ''}" data-tip="${esc(w.why)}">${w.now ? 'NOW' : `${daysTo(w.start)} D`} · ${esc(w.w)}</i>` : '');
const row = (o, sub = '', right = '') => `<li><button type="button" class="row" data-id="${esc(String(o.id))}"><img class="pg" src="${pinOf(o)}" alt=""><span class="nm"><b>${esc(nameOf(o))}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="rt">${right}</span></button></li>`;
const elapsed = t => { const s = Math.max(0, Math.floor((Date.now() - t) / 1000)); const h = Math.floor(s / 3600); return h >= 48 ? `${Math.floor(h / 24)} D` : h >= 1 ? `${h} H ${pad2(Math.floor(s % 3600 / 60))}` : `${Math.floor(s / 60)} MIN`; };
const since = t => `<span class="cdn up mono" data-up="${t}">${elapsed(t)}</span>`;
/* right now: an animal hurt, dead or lost in the last 24 hours */
const alarmsNow = () => { const ord = { injured: 0, dead: 1, lost: 2 }; return [...S.community, ...S.user].filter(o => isAlarm(o) && isFresh(o)).sort((a, b) => ord[a.kind] - ord[b.kind] || b.at - a.at); };
const BIRDS = new Set(['bird', 'parrot', 'waterbird', 'owl', 'raptor']);
const telOf = o => (o.tel ? o.tel : o.kind === 'injured' ? ((o.tags || []).includes('h5') ? 'tel:1800675888' : glyphOf(o) === 'flyingfox' ? 'tel:136186' : 'tel:0384007300') : o.kind === 'dead' && ((o.tags || []).includes('h5') || BIRDS.has(glyphOf(o))) ? 'tel:1800675888' : o.kind === 'dead' && glyphOf(o) === 'flyingfox' ? 'tel:136186' : '');
const alarmRow = o => { const tel = telOf(o); const act = o.kind === 'lost' ? `<button type="button" class="callb lostb" data-search="${esc(String(o.id))}">${icon('lost')}<small>SEARCH</small></button>` : tel ? `<a class="callb${o.kind === 'dead' ? ' deadb' : ''}" href="${tel}">${icon('phone')}<small>${o.kind === 'dead' ? 'REPORT' : 'CALL'}</small></a>` : '';
  return `<li class="alarm ${o.kind}"><button type="button" class="row" data-id="${esc(String(o.id))}"><img class="pg" src="${pinOf(o)}" alt=""><span class="nm"><b>${esc(nameOf(o))}</b><small>${o.kind === 'injured' ? 'HURT' : o.kind === 'dead' ? 'DEAD · DO NOT TOUCH' : 'LOST'} · ${since(o.at)}</small></span></button>${act}</li>`; };

/* ───────── the four destinations ───────── */
function setView(i, keep, part) {
  const was = S.view; S.view = i; document.body.dataset.view = VIEWS[i].k;
  if (S.mode && !keep) closeRecord('view');
  if (!S.open) setOpen(true);
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
  if (was !== i) buzz(5);
  if (i !== 0 && S.radio) setRadio(false);
  document.body.classList.toggle('off-map', i !== 0);
  renderView(); life.data();
  viewEl.classList.remove('in'); void viewEl.offsetWidth; viewEl.classList.add('in');
  if (part) goPart(part);
  try { history.replaceState(null, '', '#' + (part || VIEWS[i].k)); } catch (e) { /* file:// */ }
}
/* a part of a page by name */
const PARTS = { radio: [0, null], now: [0, null], outlook: [0, 'sec-heat'], tracks: [0, 'sec-heat'], five: [0, 'sec-five'], heroes: [0, 'sec-five'], alerts: [0, 'sec-alarms'], gigs: [0, 'sec-gigs'], events: [0, 'sec-gigs'],
  signals: [1, null], constellations: [1, 'sec-cons'], cons: [1, 'sec-cons'], groups: [1, 'sec-groups'],
  signs: [2, null], slips: [2, 'sec-slips'], printers: [2, 'sec-prn'],
  portfolio: [3, null], stories: [3, null], board: [3, 'sec-board'], receive: [3, 'sec-board'], briefs: [3, 'sec-briefs'], tools: [3, 'sec-tools'], field: [3, 'sec-tools'], settings: [3, 'sec-set'], sources: [3, 'sec-src'] };
function goPart(part) { const id = (PARTS[part] || [])[1]; const el = id && document.getElementById(id); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; if (part === 'receive') openReceive(true); viewEl.scrollTop = Math.max(0, el.offsetTop - 8); }
function renderView() {
  if (S.mode) return;
  const k = VIEWS[S.view].k;
  viewEl.innerHTML = k === 'radio' ? viewRadio() : k === 'signals' ? viewSignals() : k === 'signs' ? viewSigns() : viewPortfolio();
  viewEl.scrollTop = 0; document.body.classList.toggle('off-map', S.open && S.view !== 0); showBoard(k === 'signals' && S.open); showZine(k === 'signs' && S.open);
  if (k === 'radio') { bindOutlook(); askHeroPhotos(); if (S.open) startHeroes(); } else stopHeroes();
  if (k === 'portfolio') bindPortfolio();
  if (k === 'radio' && (T4.water || (S.wx.tmax || 0) >= HEAT.hot)) loadOverlays();
}
/* a refresh keeps the place on the page, and never takes text from under the hand */
function refreshPanel() {
  flags(); if (S.mode || !S.open) return;
  const a = document.activeElement; if (a && viewEl.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) return;
  const st = viewEl.scrollTop; renderView(); viewEl.scrollTop = st;
}
let refreshQ = 0;
function refresh() { if (refreshQ) return; refreshQ = requestAnimationFrame(() => { refreshQ = 0; buildHeroes(); life.data(); if (S.mode === 'ping') strings.refresh(); refreshPanel(); if (S.mode) refreshRecord(); }); }
setInterval(() => { $$('#panel .cdn[data-up]').forEach(t => { t.textContent = elapsed(+t.dataset.up); }); }, 1000);
/* a month chosen on the strip: the page and the ground show that stretch of three months */
/* a month pressed: the outlook moves to it, and its readout opens; pressed again, the readout closes */
const pickMonth = (k, read) => { if (read && timeOn()) setTime(false); k = clamp(k, 0, OUT_N - 1); if (read) S.moRead = S.moRead === k ? null : k; if (k === S.mo && !read) return; S.mo = k; life.data(); const st = viewEl.scrollTop; renderView(); viewEl.scrollTop = st; tick(1500 + 50 * k); };
/* the search area of an animal lost: shown, and the whole of it framed */
function searchFor(id) {
  const o = S.byId.get(id); if (!o) return; if (!prefs.areas) { prefs.areas = true; savePrefs(); }
  select(id); const R = life.searchOf(o); const dLat = R / 111000, dLng = R / (111000 * Math.cos(o.lat * Math.PI / 180));
  if (S.mapReady) setTimeout(() => map.fitBounds([[o.lng - dLng, o.lat - dLat], [o.lng + dLng, o.lat + dLat]], { padding: framePad(), duration: reduced() ? 0 : 700 }), 60);
}
viewEl.addEventListener('click', e => {
  const sr = e.target.closest('[data-search]'); if (sr) { searchFor(sr.dataset.search); return; }
  const mo = e.target.closest('[data-mo]'); if (mo) { pickMonth(+mo.dataset.mo, true); return; }
  if (e.target.closest('[data-time]')) { setTime(!timeOn()); return; }
  if (e.target.closest('[data-share-mix]')) { shareMix(); return; }
  const pm = e.target.closest('[data-mix]'); if (pm) { playMix(pm.dataset.mix); return; }
  const gp = e.target.closest('[data-part]'); if (gp) { const P = PARTS[gp.dataset.part]; if (P) setView(P[0], false, gp.dataset.part); return; }
  const sg = e.target.closest('[data-sig]'); if (sg) { openSignal(sg.dataset.sig); return; }
  const dc = e.target.closest('[data-doc]'); if (dc) { takeAway(dc.dataset.doc); return; }
  const sy = e.target.closest('[data-style]'); if (sy) { prefs.slip = sy.dataset.style; savePrefs(); $$('#view [data-style]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.style === prefs.slip))); if (S.view === 2) showZine(true); tick(1500); buzz(4); return; }
  if (e.target.closest('[data-to-radar]')) { setOpen(false); return; }
  if (e.target.closest('a[href]')) return;
  const tr = e.target.closest('[data-tribe]'); if (tr) { selectTribe(tr.dataset.tribe); return; }
  const b = e.target.closest('[data-id]'); if (b) { const v = b.dataset.id; select(/^\d+$/.test(v) ? +v : v); }
});
/* the rail keeps one flag: something hurt, dead or lost right now */
function flags() { const f = $$('#rail .flag'); if (f[0]) f[0].hidden = !alarmsNow().length; }

/* ───────── NOW ───────── */
/* what each month's danger rests on: a published outlook, a modelled scenario, or nothing issued yet */
const HORIZON = { f: 'OUTLOOK', m: 'SCENARIO', p: 'NO OUTLOOK YET' };
/* the radar is time: each turn of the hand moves the outlook a month on, and back to now after the last. A month pressed, or a
   life looked at, holds it there. The months are the outlook's own; nothing is added past them */
/* time on the radar is held back until it is developed: CONFIG.FEATURES.time turns it on */
const timeOn = () => !!(CONFIG.FEATURES || {}).time && prefs.time !== false;
function stepMonth(k) {
  S.mo = k; life.data();
  $$('#sec-heat .mo').forEach(b => { const i = +b.dataset.mo; b.classList.toggle('on', i >= k && i < k + 3); });
  const sp = $('#sec-heat .b-span'); if (sp) sp.innerHTML = spanText(k);
}
function turned() { if (!timeOn() || S.mode || S.moRead != null) return; stepMonth(S.mo + 1 >= OUT_N ? nowK() : S.mo + 1); }
function setTime(on) { prefs.time = on; savePrefs(); const b = $('#sec-heat [data-time]'); if (b) { b.setAttribute('aria-pressed', String(on)); b.innerHTML = icon(on ? 'pause' : 'play', 'sm'); b.dataset.tip = on ? 'Hold' : 'Play'; } tick(on ? 1600 : 1100); }
const spanText = k => `<b>${monthsWord(outMonth(k).m, outMonth(Math.min(OUT_N - 1, k + 2)).m)}</b> · <span class="hz">${HORIZON[outMonth(k).h]}</span>`;
/* the next unseasonable stretch, and the days until it lands */
function nextWindow() {
  const k0 = nowK(); let best = null;
  for (const w of OUT.windows) { const r = windowRun(w, k0); if (r && (!best || r.a < best.a)) best = { ...r, start: monthStart(r.a), now: r.a === k0 }; }
  return best;
}
/* the kind of life most under threat in each month: how hard heat and dry are on it, whether its young are about, whether
   a window of the outlook reaches it; a different kind from the month before where one is close; us among them */
function monthKinds() {
  const picks = []; let prev = '';
  for (let k = 0; k < OUT_N; k++) {
    const m = outMonth(k).m; const best = new Map();
    for (const e of FIELD) {
      if (!e.g || e.st === 'I') continue; const a = (e.act || '')[m], b = (e.brd || '')[m];
      const life = b === 'B' ? 2 : a === 'A' ? 1.5 : a === 'a' ? 1 : 0.15;
      const win = OUT.windows.some(w => inWin(w, m) && w.g.includes(e.g)) ? 2.5 : 0;
      const sc = ((e.heat || 0) + (e.water || 0)) * life + win + (e.st === 'T' ? 1 : 0); if (sc > (best.get(e.g) || 0)) best.set(e.g, sc);
    }
    const r = [...best].sort((x, y) => y[1] - x[1]); let g = r[0] ? r[0][0] : 'paw'; if (g === prev && r[1] && r[1][1] >= r[0][1] * 0.85) g = r[1][0];
    picks.push(g); prev = g;
  }
  const hn = OUT.windows.find(w => w.g.includes('human'));
  if (hn && !picks.includes('human')) { const ks = [...Array(OUT_N).keys()].filter(k => inWin(hn, outMonth(k).m)); if (ks.length) picks[ks[Math.floor(ks.length / 2)]] = 'human'; }
  return picks;
}
/* the outlook as a graphic equaliser: a column of lit segments for every month, as high as its heat, from orange through red
   to black at the extreme. Pressed, a month opens its readout: the month, its danger, its window, and the lives it reaches */
const EQ_SEGS = 10, EQ_LIT = [2, 4, 6, 8, 10];
const segTone = i => (i < 3 ? 0 : i < 5 ? 1 : i < 7 ? 2 : i < 9 ? 3 : 4);
function monthStrip() {
  const ks = [...Array(OUT_N).keys()]; const now = nowK(); const span = k => k >= S.mo && k < S.mo + 3; const gs = monthKinds();
  const col = k => { const Mo = outMonth(k); const lit = EQ_LIT[Mo.lv] || 2; let segs = ''; for (let i = EQ_SEGS - 1; i >= 0; i--) segs += `<i class="${i < lit ? `l t${segTone(i)}` : ''}${i === lit - 1 ? ' pk' : ''}"></i>`;
    return `<button type="button" class="mo d${Mo.lv} h${Mo.h}${span(k) ? ' on' : ''}${k === now ? ' now' : ''}${S.moRead === k ? ' read' : ''}" data-mo="${k}" aria-pressed="${S.moRead === k}" data-tip="${MON[Mo.m]} ${Mo.y} · ${DEG[Mo.lv]}"><span class="eq-c" style="--d:${(k * 0.17).toFixed(2)}s">${segs}</span><b class="mono">${MON[Mo.m].charAt(0)}</b></button>`; };
  return `<div class="mstrip eq" style="--n:${OUT_N}">${(CONFIG.FEATURES || {}).time ? `<button type="button" class="t-play" data-time aria-pressed="${timeOn()}" aria-label="Time">${icon(timeOn() ? 'pause' : 'play', 'sm')}</button>` : ''}<div class="ms-m" role="group" aria-label="Months">${ks.map(col).join('')}</div></div>`
    + (S.moRead != null ? readout(S.moRead, gs[S.moRead]) : '');
}
/* a month's readout: as a stereo's display would show it */
function readout(k, top) {
  const Mo = outMonth(k); const m = Mo.m; const ws = OUT.windows.filter(w => inWin(w, m));
  const gs = [top, ...ws.flatMap(w => w.g)].filter((g, i, a) => g && a.indexOf(g) === i).slice(0, 7);
  return `<div class="eq-read" role="status"><p class="mono"><b>${MON[m]} ${Mo.y}</b><span>${DEG[Mo.lv]}</span>${ws.map(w => `<span>${esc(w.w)}</span>`).join('')}<span class="hz">${HORIZON[Mo.h]}</span></p>`
    /* a window's reason is a relationship to look into, and says so; the outlook's own words are its summary */
    + (ws.length ? `<p class="why">${esc(ws[0].why)} <span class="hz mono">HYPOTHESIS</span></p>` : `<p class="why">${esc(OUT.say[Mo.h] || '')}</p>`)
    + `<p class="eq-k">${gs.map(g => `<i class="${g === 'human' ? 'us' : ''}" data-tip="${esc(M.KINDS[g] || '')}">${glyphSVG(g)}</i>`).join('')}</p></div>`;
}
function bindOutlook() {
  const st = $('#sec-heat .ms-m'); if (!st) return;
  st.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); pickMonth(S.mo + d); const b = $(`#sec-heat [data-mo="${S.mo}"]`); if (b) b.focus(); });
}
const heroesRanked = () => [...S.heroes].map(o => ({ o, deg: degOf(o), w: whenOf(o) })).sort((a, b) => b.deg - a.deg || (b.o.n - a.o.n));
/* the five in greatest need where the radar is: the lives inside it ranked by danger in the months ahead, whether they are
   threatened, in trouble now, and how hard heat and dry are on their kind; one of each kind; the five chosen fill any gap */
function fiveHere() {
  const best = new Map();
  for (const it of life.items) {
    const o = it.o; if (!it.inS || o.hist || o.ob || o.hum || o.story || o.pack || isCold(o) || it.b.tone === 'hist') continue;
    const fe = fieldOf(o) || {}; const deg = degOf(o);
    const sc = deg * 10 + (o.tx && o.tx.th ? 9 : 0) + (it.alarm ? 25 : 0) + (fe.heat || 0) * 1.5 + (fe.water || 0) * 1.2 + (o.hero ? 4 : 0);
    const k = (o.tx && (o.tx.id || o.tx.n)) || o.id; const was = best.get(k); if (!was || sc > was.sc) best.set(k, { o, deg, sc, w: whenOf(o) });
  }
  const here = [...best.values()].sort((a, b) => b.sc - a.sc).slice(0, 5);
  for (const h of heroesRanked()) { if (here.length >= 5) break; if (!here.some(x => (x.o.tx || {}).n === (h.o.tx || {}).n)) here.push(h); }
  return here;
}
/* how the five are chosen, said on the heading's hover: the ranking is this page's own, not a universal one */
const FIVE_WHY = 'Inside the radar · ranked by the danger in the months ahead, a threatened status, trouble now, and how hard heat and dry are on its kind · one of each kind';
const whyOf = (o, w) => (w && w.why) || threatOf(o) || (o.heroOf && o.heroOf.why) || '';
let heroRaf = 0;
function stopHeroes() { cancelAnimationFrame(heroRaf); heroRaf = 0; }
function startHeroes() {
  stopHeroes(); const cvs = $$('#view .hero-cv'); if (!cvs.length) return;
  const draw = now => {
    const t = now / 1000; let live = false;
    for (const cv of cvs) {
      if (!cv.isConnected) continue; live = true; const o = S.byId.get(cv.dataset.hero); if (!o) continue;
      const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.scale(cv.width / 64, cv.height / 64);
      const b = { ...life.badgeOf(o, 30), d: 34, a: 1 }; const m = reduced() ? { dx: 0, dy: 0, rot: 0, sx: 1 } : M.heroMotion(o.heroOf.move, t, 0.3, 0.32);
      x.save(); x.translate(32 + m.dx, 32 + m.dy); x.rotate(m.rot || 0); x.scale(m.sx || 1, 1); M.badge(x, b, 0, 0); x.restore();
    }
    if (live && !reduced()) heroRaf = requestAnimationFrame(draw); else heroRaf = 0;
  };
  heroRaf = requestAnimationFrame(draw);
}
/* one of the five: its photograph, or its mark moving where there is none, with its kind's mark */
const heroPhoto = o => (o.ph && licOpen(o.ph.l) && o.ph.u) || (o.tx && o.tx.id && TXI[o.tx.id] && TXI[o.tx.id].ph && TXI[o.tx.id].ph.u) || '';
const heroPic = o => { const ph = heroPhoto(o); return `<span class="h-pic">${ph ? `<img src="${esc(photoURL(ph, 'small'))}" alt="" loading="lazy">` : `<canvas class="hero-cv" width="104" height="104" data-hero="${esc(o.id)}" aria-hidden="true"></canvas>`}${glyphSVG(glyphOf(o))}</span>`; };
/* a hero with no photograph of its own yet: its kind's, once iNaturalist has answered */
let heroAsked = false;
function askHeroPhotos() { if (heroAsked) return; heroAsked = true; const want = S.heroes.filter(o => !heroPhoto(o) && o.tx && o.tx.id); if (want.length) Promise.all(want.map(o => taxonInfo(o.tx.id))).then(() => { if (S.view === 0) refreshPanel(); }); }
const eventRow = o => { const gig = isGig(o); const src = gigOf(o); return row(o, [dayWord(o.start), o.start ? fmtClock(o.start) : '', ...(gig ? [`<span class="gig">${icon('hug', 'sm')}${src ? src.w : 'GIG'}</span>`] : [])].filter(Boolean).join(' · ')); };
/* the countdown to act: to the first month of extreme heat ahead, ticking; NOW while it is here */
function extremeAhead() {
  const k0 = nowK(); let k = -1; for (let i = k0; i < OUT_N; i++) if (outMonth(i).lv >= 4) { k = i; break; }
  if (k < 0) return null; const Mo = outMonth(k); return { now: k === k0, to: monthStart(k), tip: `${DEG[4]} · ${MON[Mo.m]} ${Mo.y}` };
}
const pad2s = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');
const countText = to => { const s = Math.max(0, (to - Date.now()) / 1000); return `${Math.floor(s / 86400)}D ${pad2s(s % 86400 / 3600)}:${pad2s(s % 3600 / 60)}:${pad2s(s % 60)}`; };
setInterval(() => { const el = document.querySelector('#sec-heat .cd[data-to]'); if (el && !document.hidden) el.textContent = countText(+el.dataset.to); }, 1000);
function viewRadio() {
  const ex = extremeAhead();
  /* the radio, top to bottom: its name; how long until El Niño's emergency, in orange; the months as an equaliser; the one
     button that turns it on (a first tap on the map does too); the layers to mix; the signal sent on. No headings */
  return `<section class="band" id="sec-heat">
      <h2 class="b-head">DIRECT ACTION RADIO</h2>
      ${ex ? `<p class="b-emerg mono" data-tip="${esc(ex.tip)}"><span>EL NIÑO EMERGENCY IN</span>${ex.now ? '<b class="cd">NOW</b>' : `<b class="cd" data-to="${ex.to}">${countText(ex.to)}</b>`}</p>` : ''}
      ${monthStrip()}
      <button type="button" class="hero-play${S.radio ? ' on' : ''}" data-radio aria-pressed="${S.radio}" aria-label="Turn on the radio"><i class="hp-ring"></i>${icon(S.radio ? 'pause' : 'play')}</button>
      ${layersHTML()}
      <button type="button" class="share-b" data-share-mix aria-label="Start a signal">${icon('share', 'sm')}<span>START A SIGNAL</span></button>
    </section>`;
}

/* ───────── constellations: every string figure, newest first, as it forms; the knots it shares with others ───────── */
const conRow = c => {
  const fresh = Date.now() - (c.t || 0) < 10 * 60e3;
  const sh = (c.shared || []).slice(0, 3).map(x => `<button type="button" class="con-sh" data-con="${esc(String(x.id))}" data-tip="${x.ks.length} shared">${esc(x.name)}</button>`).join('');
  return `<li class="con${fresh ? ' fresh' : ''}"><button type="button" class="con-row" data-con="${esc(String(c.id))}" aria-label="${esc(c.name)}"><span class="con-chart">${strings.chartOf(c.id, 44)}</span><span class="nm"><b style="--k:${(C.kind[M.GROUP[glyphOf(c.o)]] || C.kind.other)}">${esc(c.name)}</b><small class="mono"><i class="mk dia"></i>${c.people} <i class="mk dot"></i>${c.lives}${c.water ? ` <i class="mk wav"></i>${c.water}` : ''} · ${c.edges} ${icon('string', 'sm')} · ${ago(c.born)}</small></span></button>`
    + `<button type="button" class="ib" data-con-play="${esc(String(c.id))}" aria-label="Play" data-tip="Play">${icon('play')}</button><button type="button" class="ib" data-con-trace="${esc(String(c.id))}" aria-label="How it formed" data-tip="How it formed">${icon('trace')}</button>`
    + (sh ? `<p class="con-shs mono">${icon('string', 'sm')}${sh}</p>` : '') + `</li>`;
};
function consSection() {
  const cs = strings.list(); if (!cs.length) return '';
  return `<section class="sec cons" id="sec-cons"><div class="lab-row">${lab(`Constellations · ${cs.length}`)}<button type="button" class="ib" data-con-all aria-label="Play them all" data-tip="Play them all">${icon('play')}</button></div><ol class="cons-l">${cs.slice(0, 40).map(conRow).join('')}</ol></section>`;
}
/* one after another, each its own tune */
let conQ = 0;
function playAll() { clearTimeout(conQ); const cs = strings.list().slice(0, 8); let i = 0; const next = () => { if (i >= cs.length) return; const t = strings.playFig(cs[i++].id); conQ = setTimeout(next, (Math.max(0.6, t) + 0.5) * 1000); }; next(); }
viewEl.addEventListener('click', e => {
  const pl = e.target.closest('[data-con-play]'); if (pl) { e.stopPropagation(); clearTimeout(conQ); const v = pl.dataset.conPlay; if (!strings.playFig(/^\d+$/.test(v) ? +v : v)) tick(700); return; }
  const tr = e.target.closest('[data-con-trace]'); if (tr) { e.stopPropagation(); const v = tr.dataset.conTrace; showConstellation(/^\d+$/.test(v) ? +v : v, 'trace'); return; }
  const al = e.target.closest('[data-con-all]'); if (al) { e.stopPropagation(); playAll(); return; }
  const c = e.target.closest('[data-con]'); if (c) { e.stopPropagation(); const v = c.dataset.con; showConstellation(/^\d+$/.test(v) ? +v : v, 'glow'); }
}, true);

/* ───────── the board of stories, newest first ───────── */
const THEMES = { heat: 'HEAT', water: 'WATER', pollinate: 'POLLINATORS', diversity: 'DIVERSITY', night: 'NIGHT', food: 'FOOD', circular: 'CIRCULAR', cats: 'CATS' };
/* the board: every slip, this device's and the ones shown to everyone, each with where it has got to */
/* a signal as a story card, every one the same shape: its photograph (its own, else its kind's) or its mark; what to do,
   bold, first; the story under it, plain; the life; the code small in the corner. Held up: gold, doubled; printed: gold */
const sigArt = s => { const own = sigSrc(s, false); const kp = kindPhoto(s); const ph = own || (kp ? photoURL(kp.u, 'medium') : ''); const p = s.pin || {};
  return ph ? `<img class="art" src="${esc(ph)}" alt="" loading="lazy">` : `<span class="art mark">${glyphSVG(p.g || 'paw')}</span>`; };
const printedOf = s => s.printed || (SENT[s.code] && SENT[s.code].job === 'printed' ? 1 : 0);
const sigRow = s => {
  const p = s.pin || {}; const st = sentWord(s); const tier = s.star ? 2 : printedOf(s) ? 1 : 0; const L = linesOf(s);
  const act = L[L.length - 1] || s.threat || p.cn || p.n || '';
  return `<li><button type="button" class="sig-row${s.ex ? ' ex' : ''}${s.shared ? ' sh' : ''}${tier ? ` t${tier}` : ''}" data-sig="${esc(s.key)}" data-tip="${esc([p.cn || p.n, s.threat].filter(Boolean).join(' · '))}"><b class="mono code">${esc(s.code)}</b>${sigArt(s)}`
    + `<span class="cap"><strong class="act">${esc(act)}</strong></span>${st ? `<i class="st" aria-label="${esc(st)}"></i>` : ''}</button></li>`;
};
/* the board's order, behind the scenes: the four printed most, or held up on the approval page; then the newest */
function boardOrder(sigs) {
  const score = s => (s.star ? 1000 : 0) + printedOf(s);
  const top = [...sigs].filter(s => score(s) > 0).sort((a, b) => score(b) - score(a) || b.at - a.at).slice(0, 4);
  return [...top, ...sigs.filter(s => !top.includes(s)).sort((a, b) => b.at - a.at)];
}
/* ───────── SIGNALS: the work of a response. The figures tied around a life, the W.I.S.H. issued from them, and the groups
   already caring for the ground. The writing itself happens on the life's card, beside the map it came from ───────── */
const mineOf = () => S.signals.filter(s => !s.ex && !s.shared);
/* ───────── SIGNS: the studio for paper. Three ways a slip is set, the slips issued here as the receipts they make, the
   printers that take them, and a blank to fill by hand ───────── */
const STYLES = [{ k: 'paper', w: 'PAPER', ic: 'receipt' }, { k: 'tty', w: '>', ic: '' }, { k: 'conn', w: 'CONNECTION', ic: 'string' }];
const styleNow = () => (isConn() ? 'conn' : isTty() ? 'tty' : 'paper');
/* ───────── PORTFOLIO: what has been made, to learn from. Work written on the approval page, the board of stories, the
   briefs they answer, the tools. The work opens on its own page, portfolio.html ───────── */
const POSTS = store.get('da.posts.v1', []); let postsAsked = false;
async function loadPosts() {
  if (postsAsked) return; postsAsked = true;
  try { const j = await apiJSON('/posts'); POSTS.splice(0, POSTS.length, ...((j && j.posts) || []).slice(0, 60)); store.set('da.posts.v1', POSTS); if (S.view === 3 && !S.mode) refreshPanel(); } catch (e) { /* as last heard */ }
}
const postsSection = () => (POSTS.length ? `<section class="sec" id="sec-work"><div class="lab-row">${lab(`Work · ${POSTS.length}`)}<a class="pill" href="portfolio.html" target="_blank" rel="noopener">${icon('out', 'sm')}NOVEL.GLOBAL</a></div><ol class="sigs list">${POSTS.slice(0, 12).map(x => `<li><a class="sig-line" href="portfolio.html#${encodeURIComponent(x.slug)}" target="_blank" rel="noopener">${x.cover ? `<img class="art" src="/api/posts/${encodeURIComponent(x.slug)}/cover" alt="" loading="lazy">` : `<span class="art mark">${icon('stories')}</span>`}<span class="hl">${esc(x.title)}</span><b class="mono code">${esc(x.cat || 'WORK')}</b></a></li>`).join('')}</ol></section>` : '');
function viewPortfolio() {
  loadPosts();
  const det = ['iNaturalist', 'Field list: sources in field.html', ...OUT.src.map(x => x[0]), 'Canopy: council urban forest strategies; cooling near 40% (Ziter et al., PNAS 2019)', 'City of Melbourne open data', `${IMG.attribution} · AWS Terrain Tiles`, 'OpenStreetMap', 'MapLibre · Poppins · IBM Plex Mono', CONFIG.COUNTRY];
  const sigs = S.signals;
  return postsSection() + `<section class="sec board" id="sec-board"><div class="lab-row">${lab(`Stories · ${sigs.filter(s => !s.ex).length}`)}<button type="button" class="pill" id="rx-open" aria-expanded="false" data-tip="A code from a slip, or a link">${icon('receive', 'sm')}RECEIVE</button></div>`
      + `<form class="rx" id="rx" hidden><textarea id="rx-t" rows="2" aria-label="A code from a slip, or a link" placeholder="DA-····" spellcheck="false" autocapitalize="characters"></textarea><button type="submit" class="ib" aria-label="Receive">${icon('check')}</button></form>`
      /* eight as cards; the rest as a list, a photograph and a headline each */
      + (() => { const all = boardOrder(sigs); const more = all.slice(8); askKindPhotos(all); return `<ol class="sigs cards big">${all.slice(0, 8).map(sigRow).join('')}</ol>` + (more.length ? `<ol class="sigs list">${more.map(sigLine).join('')}</ol>` : ''); })()
      + `</section>`
    + `<details class="sec" id="sec-briefs"><summary>${lab(`Briefs · ${BRIEFS.length}`)}</summary><ol class="briefs">${BRIEFS.map(b => `<li><a href="${esc(b.url)}" target="_blank" rel="noopener" data-tip="${esc(cap(b.fact))}"><span class="bn mono">${b.id.slice(1)}</span><span class="nm"><b>${esc(b.t)}</b><small class="mono">${esc(b.after.toUpperCase())} · ${esc((b.city || '').toUpperCase())}${b.yr ? ` ${b.yr}` : ''} · ${THEMES[b.th] || ''}</small></span>${icon('out', 'sm')}</a></li>`).join('')}</ol></details>`
    + `<section class="sec tools" id="sec-tools">${lab('Tools')}<div class="tool-pair">`
      + `<a class="tool" href="field.html" target="_blank" rel="noopener"><span class="tool-art" id="art-field" aria-hidden="true"></span><b>Field list</b><small class="mono">${FIELD.length}</small><i class="go">${icon('out')}</i></a>`
      + `<a class="tool guide" href="guide.html" target="_blank" rel="noopener"><span class="tool-art" id="art-guide" aria-hidden="true"></span><b>Guide</b><i class="go">${icon('out')}</i></a>`
      + `</div><div class="docs">${[['signals', 'download', 'SIGNALS', 'CSV'], ['field', 'download', 'FIELD LIST', 'CSV'], ['briefs', 'download', 'BRIEFS', 'CSV'], ['places', 'download', 'PLACES', 'CSV: the places listed by name']].map(([k, ic, w, tip]) => `<button type="button" data-doc="${k}" data-tip="${esc(tip)}">${icon(ic)}<span>${w}</span></button>`).join('')}</div>`
      + packSection()
      + `</section>`
    + `<section class="sec" id="sec-set">${lab('Settings')}<div class="set"><button type="button" class="tog lb" id="ix-sound" aria-pressed="${!!prefs.sound}">${icon('sound')}<small>SOUND</small></button><button type="button" class="tog lb" id="ix-motion" aria-pressed="${!!prefs.motion}">${icon('motion')}<small>MOTION</small></button><button type="button" class="tog lb" id="ix-areas" aria-pressed="${!!prefs.areas}" data-tip="Search areas for animals lost">${icon('lost')}<small>AREAS</small></button><button type="button" class="tog lb" id="ix-night" aria-pressed="${darkNow()}">${icon('night')}<small>NIGHT</small></button><button type="button" class="tog lb" id="ix-printers" aria-pressed="${!!prefs.printers}" data-tip="W.I.S.H. printers at partner places, on the map">${icon('receipt')}<small>PRINTERS</small></button>${HIDE.size ? `<button type="button" class="tog" id="ix-hidden" data-tip="Show every hidden cell again">${icon('hide')}<small>${HIDE.size} HIDDEN</small></button>` : ''}<label class="sig">${icon('sign')}<input id="ix-sign" type="text" maxlength="40" aria-label="Your name" placeholder="Name" value="${esc(S.me.by)}"></label></div></section>`
    + `<details class="sec" id="sec-src"><summary>${lab('Sources')}</summary><ul class="det">${det.map(v => `<li>${esc(v)}</li>`).join('')}</ul></details>`;
}
/* a story as a line, as a forum lists them: a small photograph, the headline, the code */
const sigLine = s => { const p = s.pin || {}; const L = linesOf(s); const act = L[L.length - 1] || s.threat || p.cn || p.n || '';
  return `<li><button type="button" class="sig-line${s.ex ? ' ex' : ''}" data-sig="${esc(s.key)}" data-tip="${esc([p.cn || p.n, s.threat].filter(Boolean).join(' · '))}">${sigArt(s)}<span class="hl">${esc(act)}</span><b class="mono code">${esc(s.code)}</b></button></li>`; };
function openReceive(on) { const f = $('#rx'), b = $('#rx-open'); if (!f) return; f.hidden = !on; b.setAttribute('aria-expanded', String(on)); if (on) setTimeout(() => $('#rx-t').focus(), 30); }
function bindPortfolio() {
  const art = (id, list) => { const host = $('#' + id); if (host) host.innerHTML = list.map(b => `<img src="${badgeImg(b, 30)}" alt="">`).join(''); };
  art('art-field', ['bird', 'possum', 'bee', 'orb', 'lizard', 'frog', 'moth', 'turtle'].map(g => ({ tone: M.toneOf(g), g })));
  art('art-guide', [{ tone: 'k-mammal', g: 'flyingfox', dz: 3 }, { tone: 'injured', g: 'possum' }, { tone: 'lost', g: 'dog' }, { tone: 'event', i: 'hug' }, { tone: 'story', g: 'bee', carried: true }, { tone: 'need', i: 'shade' }, { tone: 'flora', g: 'plant' }, { tone: 'dead', g: 'bird' }]);
  $('#rx-open').addEventListener('click', () => { openReceive($('#rx').hidden); tick(1500); });
  $('#rx').addEventListener('submit', e => { e.preventDefault(); const t = $('#rx-t').value.trim(); if (!t) { nudge($('#rx-t')); return; } receive(t); });
  $('#ix-sound').addEventListener('click', e => { prefs.sound = !prefs.sound; e.currentTarget.setAttribute('aria-pressed', String(prefs.sound)); savePrefs(); if (!prefs.sound) { stopTracks(); snd.droneOff(); } tick(); });
  $('#ix-motion').addEventListener('click', e => { prefs.motion = !prefs.motion; e.currentTarget.setAttribute('aria-pressed', String(prefs.motion)); savePrefs(); document.documentElement.classList.toggle('still', !prefs.motion); life.data(); tick(); });
  $('#ix-areas').addEventListener('click', e => { prefs.areas = !prefs.areas; e.currentTarget.setAttribute('aria-pressed', String(prefs.areas)); savePrefs(); life.redraw(); tick(); });
  $('#ix-night').addEventListener('click', e => { prefs.night = !darkNow(); e.currentTarget.setAttribute('aria-pressed', String(prefs.night)); savePrefs(); applyNight(); tick(); });
  $('#ix-printers').addEventListener('click', e => { prefs.printers = !prefs.printers; e.currentTarget.setAttribute('aria-pressed', String(prefs.printers)); savePrefs(); life.redraw(); tick(); });
  const hb = $('#ix-hidden'); if (hb) hb.addEventListener('click', () => { const n = HIDE.size; showAllHidden(); life.data(); hb.remove(); toast(`${n} SHOWN`); snd.pluck(0.3, 0); });
  $('#ix-sign').addEventListener('input', e => { S.me.by = e.target.value.trim(); store.set('da.me', S.me); });
}
/* data to take away */
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\n');
function download(name, data, type = 'text/csv;charset=utf-8') { const a = document.createElement('a'); a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
function takeAway(k) {
  const day = isoDay(new Date()); tick(1800);
  if (k === 'signals') download(`direct-action-signals-${day}.csv`, toCSV([['code', 'issued', 'by', 'life', 'latin', 'lat', 'lng', 'place', 'threat', 'when', 'w', 'i', 's', 'h', 'knots', 'brief', 'example'], ...S.signals.map(s => { const p = s.pin || {}; return [s.code, new Date(s.at).toISOString(), s.who || '', p.cn || '', p.n || '', p.lat, p.lng, p.place || '', s.threat || '', s.when || '', ...['w', 'i', 's', 'h'].map(x => (s.lines || {})[x] || ''), (s.nodes || []).map(n => n.n).join('; '), s.brief || '', s.ex ? 1 : 0]; })]));
  if (k === 'briefs') download(`direct-action-briefs-${day}.csv`, toCSV([['id', 'brief', 'after', 'where', 'year', 'fact', 'source', 'theme', 'lives', 'roles', 'months', 'i', 's', 'h'], ...BRIEFS.map(b => [b.id, b.t, b.after, b.city, b.yr || '', b.fact, b.url, b.th, b.g.join(' '), b.roles.join(' '), b.m.map(m => MON[m]).join(' '), b.i, b.s, b.h])]));
  if (k === 'field') download(`direct-action-field-list-${day}.csv`, toCSV([['common_name', 'scientific_name', 'kind', 'status', 'where', 'active_jan_dec', 'young_jan_dec', 'time', 'heat', 'water', 'event', 'notice', 'do_no_harm', 'help', 'call', 'note', 'sources'], ...FIELD.map(e => [e.cn, e.n, e.g, e.st, e.where, e.act, e.brd, e.time, e.heat, e.water, e.event, e.aware, e.harm, e.help, e.call, e.note, (e.src || []).join(' ')])]));
  if (k === 'places') download(`direct-action-places-${day}.csv`, toCSV([['name', 'part', 'role', 'address', 'suburb', 'site', 'what', 'lat', 'lng', 'approximate'], ...PLACES.map(p => [p.n, (FAMILIES[p.cat] || {}).w || p.cat, (ROLES[p.role] || {}).w || p.role, p.addr || '', p.sub || '', p.url || '', p.what || '', p.lat, p.lng, p.a ? 1 : 0])]));
  if (k === 'blank') printBlank();
}
function signalLost() { document.body.classList.add('nosignal'); if (!S.mode) renderView(); }
