
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
/* ───────── on a phone, one pane at a time: the dock holds the four pages and two keys, what the page works on (the map,
   the board, the press, the wall) and the page itself ───────── */
const MAIN_IC = { radio: 'radar', signals: 'base', signs: 'receipt', portfolio: 'stories' };
let pane = 'page';
function syncDock() {
  const m = $('#dock [data-pane="main"]'), pg = $('#dock [data-pane="page"]'); if (!m) return; const shown = S.open ? pane : 'main';
  m.innerHTML = icon(MAIN_IC[VIEWS[S.view].k] || 'radar'); pg.innerHTML = icon('note');
  m.setAttribute('aria-pressed', String(shown === 'main')); pg.setAttribute('aria-pressed', String(shown === 'page'));
  document.body.classList.toggle('pane-main', shown === 'main'); document.body.classList.toggle('pane-page', shown === 'page');
}
function setPane(p) {
  pane = p; if (p === 'page' && !S.open) setOpen(true); else syncDock();
  setTimeout(() => { if (S.mapReady) map.resize(); if (p === 'main' && S.view === 2) fitZ(); }, 380);
}
$('#dock').addEventListener('click', e => { const b = e.target.closest('[data-pane]'); if (!b) return; setPane(b.dataset.pane); tick(b.dataset.pane === 'main' ? 1200 : 1500); });
function setOpen(on) {
  S.open = on; document.body.classList.toggle('shut', !on); buzz(5); syncDock();
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(on && +b.dataset.i === S.view && !S.mode)));
  if (!on) { stopHeroes(); showBoard(false); showZine(false); showGallery(false); document.body.classList.remove('off-map'); if (S.mode) closeRecord('view'); }
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
const labI = (ic, tip, n) => `<h3 class="lab labi" data-tip="${esc(tip)}" aria-label="${esc(tip)}">${icon(ic, 'sm')}${n != null ? `<b class="mono">${n}</b>` : ''}</h3>`;
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
  const was = S.view; S.view = i; document.body.dataset.view = VIEWS[i].k; syncDock();
  if (S.mode && !keep) closeRecord('view');
  if (!S.open) setOpen(true);
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
  if (was !== i) buzz(5);
  /* once started, the radio plays on under every page */
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
  viewEl.scrollTop = 0; document.body.classList.toggle('off-map', S.open && S.view !== 0); showBoard(k === 'signals' && S.open); showZine(k === 'signs' && S.open); showGallery(k === 'portfolio' && S.open);
  if (k === 'radio') { bindOutlook(); askHeroPhotos(); if (S.open) startHeroes(); } else stopHeroes();
  if (k === 'portfolio') bindPortfolio();
  if (k === 'signs') fillThumbs();
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
  const gv = e.target.closest('[data-go-view]'); if (gv) { setView(+gv.dataset.goView); return; }
  if (e.target.closest('[data-share-mix]')) { const t = e.target.closest('.clue'); if (t) t.classList.add('go'); snd.knot({ fam: 'people' }, F0 * 6, 0, 0.7, 0); setTimeout(() => shareMix(), reduced() ? 0 : 420); return; }
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
  const col = k => { const Mo = outMonth(k); const lit = EQ_LIT[Mo.lv] || 2; let segs = Mo.lv >= 4 ? '<i class="l t4 up"></i>'.repeat(3) : ''; for (let i = EQ_SEGS - 1; i >= 0; i--) segs += `<i class="${i < lit ? `l t${segTone(i)}` : ''}${i === lit - 1 ? ' pk' : ''}"></i>`;
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
/* the clues: drawn marks, and the only words on the radio. Find yourself; tie something to something; then the signal */
const CLUE_IC = {
  compass: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 3.2l1.7 4.8L8 12.8 6.3 8z" fill="currentColor"/></svg>',
  chain: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.2" y="5.4" width="7.6" height="5.2" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="7.2" y="5.4" width="7.6" height="5.2" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  q: '<b class="cq" aria-hidden="true">?</b>',
};
function cluesHTML() {
  const s1 = placed(), s2 = s1 && S.tweaked;
  const tile = (n, state, ics, words, act = '') => `<li class="clue ${state}" data-clue="${n}">${act ? `<button type="button" class="clue-b" ${act}>` : '<div class="clue-b">'}<span class="ci">${ics}</span>${words ? `<span class="cw">${words}</span>` : '<span class="cw"></span>'}${state === 'done' ? `<i class="ck">${icon('check', 'sm')}</i>` : state === 'locked' ? '<i class="lk" aria-hidden="true"></i>' : ''}${act ? '</button>' : '</div>'}</li>`;
  return `<ol class="clues">`
    + tile(1, s1 ? 'done' : 'now', icon('search'), 'find yourself')
    + tile(2, !s1 ? 'locked' : s2 ? 'done' : 'now', CLUE_IC.chain, 'make a connection')
    + tile(3, s2 ? 'now' : 'locked', icon('share'), 'START', s2 ? 'data-share-mix' : 'disabled')
    + `</ol>`;
}
/* once a signal is started: the checklist, as an old handheld's manual lists what it does. Each a coloured tile and its
   mark, the line, and a box ticked when done */
const wishStarted = () => S.signals.some(x => !x.ex && !x.shared && linesOf(x).length >= 2) || WKEYS.filter(k => String(WDRAFT[k] || '').trim()).length >= 2;
const printedAny = () => !!store.get('da.printed.v1', 0) || PROOFS.length > 0 || S.signals.some(x => !x.ex && !x.shared && /PRINTED/.test(sentWord(x)));
function checklistHTML() {
  const rows = [
    { ok: placed() || !!prefs.placed, ic: CLUE_IC.compass, w: 'Where are you?' },
    { ok: wishStarted(), ic: '<b class="cl-wk">W</b>', w: 'Start a W.I.S.H.', go: 1 },
    { ok: mineOf().some(x => linesOf(x).length), ic: icon('sign'), w: 'Finish a W.I.S.H.', go: 1 },
    { ok: POSTERS2.length > 0, ic: icon('stories'), w: 'Make a poster', go: 2 },
    { ok: printedAny(), ic: icon('print'), w: 'Print', go: 3 },
  ];
  const done = rows.filter(r => r.ok).length;
  return `<ol class="checks" aria-label="${done} of ${rows.length}">${rows.map((r, i) => `<li class="chk${r.ok ? ' ok' : ''}" data-check="${i + 1}">`
    + `<button type="button" class="chk-b"${r.go != null ? ` data-go-view="${r.go}"` : ''}><b class="chk-n mono">${String(i + 1).padStart(2, '0')}</b><span class="chk-w">${r.w}</span><i class="chk-box">${r.ok ? icon('check', 'sm') : ''}</i></button></li>`).join('')}</ol>`
    + (done === rows.length ? `<button type="button" class="start-k" data-share-mix data-tip="Start another signal">${icon('share')}<span>START</span></button>` : '');
}
/* the lockup: the muse and the name. Tapped, the muse pulses and rings; tapped five times quickly, the water fills with them */
const lockup = () => `<header class="lockup"><button type="button" class="lk-mark" data-muse aria-label="novel.global">${M.jellySVG('currentColor', 'var(--glass)', 44)}</button><b class="lk-n">novel.global</b></header>`;
let museN = 0, museT = 0;
document.addEventListener('click', e => { const b = e.target.closest('[data-muse]'); if (!b) return; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); snd.jelly(0); museN = Date.now() - museT < 900 ? museN + 1 : 1; museT = Date.now(); if (museN >= 5) { museN = 0; dispatchEvent(new CustomEvent('da:muse')); } });
/* the head of every page: the muse and the name, level with the first key of the rail; the Country on the right */
const COUNTRIES = (CONFIG.COUNTRIES && CONFIG.COUNTRIES.length) ? CONFIG.COUNTRIES : [{ id: 'here', n: CONFIG.COUNTRY, s: CONFIG.SOVEREIGNTY || '' }];
const countryNow = () => COUNTRIES.find(c => c.id === prefs.ctry) || COUNTRIES[0];
const countryBar = () => { const c = countryNow(); return `<div class="ctry"><label class="ct-sel"><select id="ctry" aria-label="Country">${COUNTRIES.map(x => `<option value="${esc(x.id)}"${x.id === c.id ? ' selected' : ''}>${esc(x.n)}</option>`).join('')}</select><span class="ct-n">${esc(c.n)}</span><span class="ct-s">${esc(c.s)}</span>${COUNTRIES.length > 1 ? icon('next', 'sm') : ''}</label></div>`; };
function headBar() { const h = $('#ph'); if (h) h.innerHTML = lockup() + countryBar(); }
document.addEventListener('change', e => { if (e.target.id !== 'ctry') return; prefs.ctry = e.target.value; savePrefs(); headBar(); });
/* the printers online, as a pager would say it: its light, its name, a buzz when one comes on */
const printersOn = () => [MASTER, ...PARTNERS].filter(p => p && (PSTATE[p.id] || {}).ready);
function pagerHTML() {
  const on = printersOn();
  return `<div class="pager${on.length ? ' on' : ''}" role="status" data-tip="${on.length ? 'Printers online' : 'No printer online'}"><i class="pg-led"></i><span class="pg-lcd mono">${on.length ? on.map(p => esc(String(p.n).toUpperCase())).join(' · ') : '— — —'}</span>${on.length ? `<i class="pg-buzz">${icon('print', 'sm')}</i>` : ''}</div>`;
}
function viewRadio() {
  const ex = extremeAhead();
  /* no words but the clues: El Niño's emergency counting down, in orange; the months as an equaliser; the one button; the
     layers as marks; the three clues. Every name is there on a long hover */
  return `<section class="band" id="sec-heat">
      ${pagerHTML()}${ex ? `<p class="b-emerg mono" data-tip="El Niño emergency in"><i class="sun">${icon('heat')}</i>${ex.now ? '<b class="cd">NOW</b>' : `<b class="cd" data-to="${ex.to}">${countText(ex.to)}</b>`}</p>` : ''}
      ${monthStrip()}
      <button type="button" class="hero-play${S.radio ? ' on' : ''}" data-radio aria-pressed="${S.radio}" aria-label="The radio" data-tip="The radio"><i class="hp-ring"></i>${icon(S.radio ? 'pause' : 'play')}</button>
      ${layersHTML()}
      ${MIXES.length ? checklistHTML() : cluesHTML()}
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
  return `<section class="sec cons" id="sec-cons"><div class="lab-row">${labI('string', 'Constellations', cs.length)}<button type="button" class="ib" data-con-all aria-label="Play them all" data-tip="Play them all">${icon('play')}</button></div><ol class="cons-l">${cs.slice(0, 40).map(conRow).join('')}</ol></section>`;
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
const postsSection = () => (POSTS.length ? `<section class="sec" id="sec-work"><div class="lab-row">${labI('out', 'Work', POSTS.length)}<a class="pill" href="portfolio.html" target="_blank" rel="noopener">${icon('out', 'sm')}NOVEL.GLOBAL</a></div><ol class="sigs list">${POSTS.slice(0, 12).map(x => `<li><a class="sig-line" href="portfolio.html#${encodeURIComponent(x.slug)}" target="_blank" rel="noopener">${x.cover ? `<img class="art" src="/api/posts/${encodeURIComponent(x.slug)}/cover" alt="" loading="lazy">` : `<span class="art mark">${icon('stories')}</span>`}<span class="hl">${esc(x.title)}</span><b class="mono code">${esc(x.cat || 'WORK')}</b></a></li>`).join('')}</ol></section>` : '');
const postersHero = () => (POSTERS2.length ? `<section class="sec posters-hero" id="sec-posters"><figure class="ph-hero"><img src="${POSTERS2[0].img}" alt=""></figure>${POSTERS2.length > 1 ? `<ol class="ph-more">${POSTERS2.slice(1).map(p => `<li><img src="${p.img}" alt=""></li>`).join('')}</ol>` : ''}</section>` : '');
/* ───────── the quick print: a blank 80 mm receipt to write on, a photograph if wanted, and one key, the printer. Kept as it is
   typed (da.quick.v1). Sent as a story would be: it waits on the approval page, and novel.global's printer takes it ───────── */
const QP = Object.assign({ t: '', img: '', w: 0.8 }, store.get('da.quick.v1', {}));
const saveQP = debounce(() => store.set('da.quick.v1', QP), 300);
function quickHTML() {
  const on = printersOn(); const p = on[0] || MASTER;
  return `<section class="sec quick" id="sec-quick"><div class="qp-paper">`
    + (QP.img ? `<figure class="qp-ph"><img src="${QP.img}" alt="" style="width:${Math.round(QP.w * 100)}%"><button type="button" class="qp-x" data-qp="rm" aria-label="Take the photograph off">${icon('close', 'sm')}</button><input type="range" class="qp-sz" id="qp-sz" min="30" max="100" value="${Math.round(QP.w * 100)}" aria-label="The photograph's size"></figure>` : '')
    + `<textarea id="qp-t" rows="7" maxlength="900" spellcheck="true" aria-label="A note to print" placeholder="A note, a list, an idea">${esc(QP.t)}</textarea>`
    + `<label class="qp-cam" aria-label="A photograph" data-tip="A photograph">${icon('camera')}<input type="file" id="qp-f" accept="image/*" hidden></label></div>`
    + `<button type="button" class="print-k qp-go${on.length ? ' on' : ''}" data-qp="go" aria-label="Print on ${esc(p ? p.n : 'the printer')}"><i class="pk-led"></i><b>${esc(String(p ? p.n : 'PRINT').toUpperCase())}</b>${icon('print')}</button></section>`;
}
/* the note as the printer's head will lay it down: the photograph dithered at its size, the words in the receipt's type */
async function quickCanvas(W = 512) {
  const k = W / 384, pad = Math.round(16 * k); try { await document.fonts.load('16px "IBM Plex Mono"'); } catch (e) { /* fallback type */ }
  const T = document.createElement('canvas'); T.width = W; T.height = 5000; const x = T.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, T.height); x.fillStyle = '#000'; x.textBaseline = 'top';
  let y = pad; if (QP.img) { const im = await loadImage(QP.img, false); const w = Math.round(W * QP.w) & ~7, h = Math.round(w * im.height / im.width); const ph = await bwCanvas(QP.img, w, h, 2); x.drawImage(ph, Math.round((W - w) / 2), y); y += h + pad; }
  x.font = `500 ${Math.round(17 * k)}px "IBM Plex Mono", monospace`; const lh = Math.round(23 * k);
  for (const para of String(QP.t || '').split('\n')) { let line = ''; const words = para.split(/(\s+)/); if (!para.trim()) { y += lh; continue; }
    for (const w of words) { const next = line + w; if (line && x.measureText(next).width > W - pad * 2) { x.fillText(line.trimEnd(), pad, y); y += lh; line = w.trimStart(); } else line = next; } if (line) { x.fillText(line, pad, y); y += lh; } }
  y += Math.round(8 * k); x.font = `500 ${Math.round(10 * k)}px "IBM Plex Mono", monospace`; x.fillText(fmtStamp(Date.now()), pad, y); y += Math.round(14 * k) + pad;
  const out = document.createElement('canvas'); out.width = W; out.height = y; const o = out.getContext('2d'); o.drawImage(T, 0, 0);
  const id = o.getImageData(0, 0, W, y); const d = id.data; for (let i = 0; i < d.length; i += 4) { const v = d[i] < 140 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } o.putImageData(id, 0, 0);
  return out;
}
async function quickPrint(btn) {
  if (!String(QP.t || '').trim() && !QP.img) { nudge($('#qp-t')); return null; }
  btn.classList.add('busy');
  try {
    const cvs = await quickCanvas(512); const bytes = new Uint8Array([0x1B, 0x40, ...rasterOf(cvs), 0x0A, 0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00]);
    const at = Date.now(); const first = String(QP.t || '').trim().split('\n')[0].slice(0, 40);
    const s = { v: 1, code: codeFor(`${at}|note|${S.me.dev}`), at, pin: { id: null, lat: +S.scan.lat.toFixed(3), lng: +S.scan.lng.toFixed(3), n: '', cn: 'NOTE', g: 'paw', place: suburbAt(S.scan.lat, S.scan.lng) }, threat: '', when: '', deg: 0, lines: { w: first, i: '', s: '', h: '' }, nodes: [], edges: [], who: S.me.by || '', note: String(QP.t || '').slice(0, 280) };
    const v = await directAction(s, MASTER ? MASTER.id : '', bytes); store.set('da.printed.v1', Date.now()); snd.printer(900); toast(v && v.status === 'outbox' ? '…' : '✓'); btn.classList.add('sent'); setTimeout(() => btn.classList.remove('sent'), 1600); return v;
  } catch (e) { toast('✕'); return null; } finally { btn.classList.remove('busy'); }
}
$('#view').addEventListener('input', e => {
  if (e.target.id === 'qp-t') { QP.t = e.target.value; saveQP(); }
  if (e.target.id === 'qp-sz') { QP.w = +e.target.value / 100; const im = $('#sec-quick .qp-ph img'); if (im) im.style.width = `${e.target.value}%`; saveQP(); }
});
$('#view').addEventListener('change', e => {
  if (e.target.id !== 'qp-f') return; const fl = e.target.files && e.target.files[0]; if (!fl) return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    QP.img = c.toDataURL('image/jpeg', 0.82); while (!store.set('da.quick.v1', QP) && QP.img.length > 40000) { QP.img = c.toDataURL('image/jpeg', 0.5); break; } refreshPanel(); tick(1700); }; im.src = rd.result; };
  rd.readAsDataURL(fl); e.target.value = '';
});
$('#view').addEventListener('click', e => {
  const q = e.target.closest('[data-qp]'); if (!q) return;
  if (q.dataset.qp === 'rm') { QP.img = ''; store.set('da.quick.v1', QP); refreshPanel(); tick(1100); }
  if (q.dataset.qp === 'go') quickPrint(q);
});
/* the W.I.S.H.es finished here, as filed: their number, the day, what each was for, and the four lines */
const wishesSection = () => { const ws = mineOf().filter(x => linesOf(x).length);
  return ws.length ? `<section class="sec wishes" id="sec-wishes"><ol class="filed">${ws.slice(0, 24).map((x, i) => `<li><button type="button" class="filed-b" data-sig="${esc(x.key)}"><span class="fl-h mono"><b>№ ${String(ws.length - i).padStart(3, '0')}</b><span>${esc(x.code)}</span><span>${fmtStamp(x.at)}</span></span>${x.note ? `<span class="fl-for">${esc(x.note.split(' · ')[0])}</span>` : ''}<ol class="fl-l">${WKEYS.map(k => (x.lines || {})[k] ? `<li><b>${k.toUpperCase()}</b>${esc(x.lines[k])}</li>` : '').join('')}</ol></button></li>`).join('')}</ol></section>`
    : `<section class="sec wishes" id="sec-wishes"><button type="button" class="filed-none" data-go-view="1" aria-label="The WISH MAKER">${icon('sign')}</button></section>`; };
/* ───────── the gallery: beside the portfolio, the posters finished here, the newest as the hero, the rest on the wall ───────── */
let galleryAt = 0;
function showGallery(on) {
  const g = $('#gallery'); if (!g) return; g.hidden = !on; if (!on) return; const ps = POSTERS2; galleryAt = Math.min(galleryAt, Math.max(0, ps.length - 1));
  if (!ps.length) { g.innerHTML = `<div class="gl-none"><button type="button" class="key" data-go-view="2" aria-label="The print shop" data-tip="The print shop">${icon('receipt')}</button></div>`; return; }
  const p = ps[galleryAt];
  g.innerHTML = `<figure class="gl-hero"><img src="${p.img}" alt=""><figcaption class="mono">№ ${String(ps.length - galleryAt).padStart(3, '0')} · ${fmtStamp(p.at)}</figcaption></figure>`
    + `<div class="gl-acts"><button type="button" class="key" data-gl="tarot" aria-label="As a card" data-tip="As a card">${icon('stories')}</button><button type="button" class="key" data-gl="png" aria-label="Download" data-tip="Download">${icon('download')}</button></div>`
    + (ps.length > 1 ? `<ol class="gl-wall">${ps.map((x, i) => `<li><button type="button" class="gl-t${i === galleryAt ? ' on' : ''}" data-gl-i="${i}" style="--r:${((i * 37) % 7 - 3) * 0.8}deg"><img src="${x.img}" alt=""></button></li>`).join('')}</ol>` : '');
}
document.addEventListener('click', e => {
  const g = e.target.closest('#gallery'); if (!g) return;
  const t = e.target.closest('[data-gl-i]'); if (t) { galleryAt = +t.dataset.glI; showGallery(true); tick(1500); return; }
  const a = e.target.closest('[data-gl]'); const p = POSTERS2[galleryAt]; if (!a || !p) { const gv = e.target.closest('[data-go-view]'); if (gv) setView(+gv.dataset.goView); return; }
  if (a.dataset.gl === 'tarot') openTarot(p.id);
  if (a.dataset.gl === 'png') { const l = document.createElement('a'); l.href = p.img; l.download = `poster-${isoDay(new Date(p.at))}.jpg`; l.click(); tick(1800); }
});
function viewPortfolio() {
  loadPosts();
  const det = ['iNaturalist', 'Field list: sources in field.html', ...OUT.src.map(x => x[0]), 'Canopy: council urban forest strategies; cooling near 40% (Ziter et al., PNAS 2019)', 'City of Melbourne open data', `${IMG.attribution} · AWS Terrain Tiles`, 'OpenStreetMap', 'MapLibre · Poppins · IBM Plex Mono', CONFIG.COUNTRY];
  const sigs = S.signals;
  return quickHTML() + wishesSection() + postsSection() + `<section class="sec board" id="sec-board"><div class="lab-row">${labI('stories', 'Stories', sigs.filter(s => !s.ex).length)}<button type="button" class="pill sq" id="rx-open" aria-expanded="false" aria-label="Receive" data-tip="A code from a slip, or a link">${icon('receive', 'sm')}</button></div>`
      + `<form class="rx" id="rx" hidden><textarea id="rx-t" rows="2" aria-label="A code from a slip, or a link" placeholder="DA-····" spellcheck="false" autocapitalize="characters"></textarea><button type="submit" class="ib" aria-label="Receive">${icon('check')}</button></form>`
      /* eight as cards; the rest as a list, a photograph and a headline each */
      + (() => { const all = boardOrder(sigs); const more = all.slice(8); askKindPhotos(all); return `<ol class="sigs cards big">${all.slice(0, 8).map(sigRow).join('')}</ol>` + (more.length ? `<ol class="sigs list">${more.map(sigLine).join('')}</ol>` : ''); })()
      + `</section>`
    + `<details class="sec" id="sec-briefs"><summary>${labI('note', 'Briefs', BRIEFS.length)}</summary><ol class="briefs">${BRIEFS.map(b => `<li><a href="${esc(b.url)}" target="_blank" rel="noopener" data-tip="${esc(cap(b.fact))}"><span class="bn mono">${b.id.slice(1)}</span><span class="nm"><b>${esc(b.t)}</b><small class="mono">${esc(b.after.toUpperCase())} · ${esc((b.city || '').toUpperCase())}${b.yr ? ` ${b.yr}` : ''} · ${THEMES[b.th] || ''}</small></span>${icon('out', 'sm')}</a></li>`).join('')}</ol></details>`
    + `<section class="sec tools" id="sec-tools">${labI('guide', 'Tools')}<div class="tool-pair">`
      + `<a class="tool" href="field.html" target="_blank" rel="noopener"><span class="tool-art" id="art-field" aria-hidden="true"></span><b>Field list</b><small class="mono">${FIELD.length}</small><i class="go">${icon('out')}</i></a>`
      + `<a class="tool guide" href="guide.html" target="_blank" rel="noopener"><span class="tool-art" id="art-guide" aria-hidden="true"></span><b>Guide</b><i class="go">${icon('out')}</i></a>`
      + `</div><div class="docs dl">${[['signals', 'download', 'SIGNALS', 'CSV'], ['field', 'download', 'FIELD LIST', 'CSV'], ['briefs', 'download', 'BRIEFS', 'CSV'], ['places', 'download', 'PLACES', 'CSV'], ['blank', 'print', 'BLANK W.I.S.H.', 'PRINT']].map(([k, ic, w, f]) => `<button type="button" data-doc="${k}" aria-label="${esc(w)}">${icon(ic)}<span>${esc(w)}</span><small class="mono">${f}</small></button>`).join('')}</div>`
      + packSection()
      + `</section>`
    + `<section class="sec" id="sec-set">${labI('motion', 'Settings')}<div class="set"><button type="button" class="tog lb" data-tip="Sound" aria-label="Sound" id="ix-sound" aria-pressed="${!!prefs.sound}">${icon('sound')}</button><button type="button" class="tog lb" data-tip="Motion" aria-label="Motion" id="ix-motion" aria-pressed="${!!prefs.motion}">${icon('motion')}</button><button type="button" class="tog lb" data-tip="Areas" aria-label="Areas" id="ix-areas" aria-pressed="${!!prefs.areas}" data-tip="Search areas for animals lost">${icon('lost')}</button><button type="button" class="tog lb" data-tip="Night" aria-label="Night" id="ix-night" aria-pressed="${darkNow()}">${icon('night')}</button><button type="button" class="tog lb" data-tip="Printers" aria-label="Printers" id="ix-printers" aria-pressed="${!!prefs.printers}" data-tip="W.I.S.H. printers at partner places, on the map">${icon('receipt')}</button>${HIDE.size ? `<button type="button" class="tog" id="ix-hidden" data-tip="Show every hidden cell again">${icon('hide')}<small>${HIDE.size} HIDDEN</small></button>` : ''}<label class="sig">${icon('sign')}<input id="ix-sign" type="text" maxlength="40" aria-label="Your name" placeholder="Name" value="${esc(S.me.by)}"></label><button type="button" class="tog lb rst" id="ix-reset" aria-label="Start again" data-tip="Start again">${icon('reset')}</button></div>`
      + `<div class="rst-w" id="rst-w" hidden role="alertdialog" aria-label="Start again"><p>${icon('alert')}<span>Everything made on this device goes: signals, boards, W.I.S.H.es, posters, the press. This cannot be undone.</span></p><div class="rst-a"><button type="button" class="key" id="rst-no" aria-label="Keep it">${icon('close')}</button><button type="button" class="key rst-yes" id="rst-yes">${icon('reset')}<b class="mono">CLEAR</b></button></div></div></section>`
    + `<details class="sec" id="sec-src"><summary>${labI('quote', 'Sources')}</summary><ul class="det">${det.map(v => `<li>${esc(v)}</li>`).join('')}</ul></details>`;
}
/* a story as a line, as a forum lists them: a small photograph, the headline, the code */
const sigLine = s => { const p = s.pin || {}; const L = linesOf(s); const act = L[L.length - 1] || s.threat || p.cn || p.n || '';
  return `<li><button type="button" class="sig-line${s.ex ? ' ex' : ''}" data-sig="${esc(s.key)}" data-tip="${esc([p.cn || p.n, s.threat].filter(Boolean).join(' · '))}">${sigArt(s)}<span class="hl">${esc(act)}</span><b class="mono code">${esc(s.code)}</b></button></li>`; };
function openReceive(on) { const f = $('#rx'), b = $('#rx-open'); if (!f) return; f.hidden = !on; b.setAttribute('aria-expanded', String(on)); if (on) setTimeout(() => $('#rx-t').focus(), 30); }
/* start again: everything made on this device cleared (the caches of what was fetched stay), then a fresh page */
const KEEP_ON_RESET = /^da\.(obs|hist|tx|hg|wx|tiles|shared|partners|posts|kph|me|cfg)\b/;
function resetAll() {
  try { for (const k of Object.keys(localStorage)) if (/^da\./.test(k) && !KEEP_ON_RESET.test(k)) localStorage.removeItem(k); } catch (e) { /* no storage */ }
  snd.tear(); setTimeout(() => location.reload(), 250);
}
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
  $('#ix-reset').addEventListener('click', () => { $('#rst-w').hidden = false; snd.tick(600); buzz([20, 40, 20]); $('#rst-w').scrollIntoView({ block: 'nearest' }); });
  $('#rst-no').addEventListener('click', () => { $('#rst-w').hidden = true; tick(1400); });
  $('#rst-yes').addEventListener('click', () => resetAll());
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
