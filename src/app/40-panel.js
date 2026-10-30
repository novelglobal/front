
/* ════════════════════════════════════════════════════════════════════
   THE PAGE — closed until it is asked for. NOW: the months ahead, the five in greatest need, anything hurt or lost,
   and the gigs. STORIES: the signals people have issued, newest first, then the groups, the tools and the sources.
   ════════════════════════════════════════════════════════════════════ */
const panel = $('#panel'), rail = $('#rail'), viewEl = $('#view');
rail.innerHTML = VIEWS.map((v, i) => `<button type="button" class="tab${i < 3 ? '' : ' apart'}" data-i="${i}" aria-label="${v.long || v.label}" aria-pressed="false"><span class="sq">${icon(v.icon)}</span><span class="tab-w">${v.long || v.w}</span><span class="tab-s">${v.short || v.w}</span>${i < 3 ? '<i class="knot" aria-hidden="true"></i>' : ''}<i class="flag" hidden></i></button>`).join('');
/* the day's thread: a knot tied at each destination as the journey reaches it, and the string drawn on to it */
function drawThread() { const t = [0, 1, 2].filter(n => DAY[n]); $$('#rail .tab').forEach((b, i) => b.classList.toggle('tied', !!DAY[i])); rail.style.setProperty('--tp', `${t.length ? Math.max(...t) * 46 : 0}px`); }
function tie(n) {
  if (DAY[n]) return; DAY[n] = Date.now(); store.set('da.day.v1', DAY); drawThread();
}
drawThread();
rail.addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; const i = +b.dataset.i; tick(1400 + 160 * i);
  $$('#rail .tab.flash').forEach(t => t.classList.remove('flash')); b.classList.add('flash'); clearTimeout(rail.flashT); rail.flashT = setTimeout(() => b.classList.remove('flash'), 2000);
  /* on a phone, the tab already open folds its page away and back */
  if (phone() && i === S.view && S.open && !S.mode) { setPane(pane === 'page' ? 'main' : 'page'); return; }
  if (i === S.view && S.open && !S.mode) { setOpen(false); return; } if (phone()) pane = 'page'; setView(i); });
rail.addEventListener('keydown', e => { const b = e.target.closest('.tab'); if (!b) return; const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (!d) return; e.preventDefault(); const all = $$('#rail .tab'); all[(all.indexOf(b) + d + all.length) % all.length].focus(); });
new ResizeObserver(() => { if (S.mapReady) map.resize(); }).observe($('#world'));
/* a row that scrolls sideways says so: its edges fade where there is more of it, and the first time it shows on a phone it leans
   a little way along and back */
function edgeFade(el) {
  if (!el || el.dataset.fade) return; el.dataset.fade = '1';
  const f = () => { const room = el.scrollWidth - el.clientWidth; el.classList.toggle('fade-l', room > 4 && el.scrollLeft > 2); el.classList.toggle('fade-r', room > 4 && el.scrollLeft < room - 2); };
  el.addEventListener('scroll', f, { passive: true }); new ResizeObserver(f).observe(el); f();
}
function leanOnce(el, key) {
  if (!el || !phone() || reduced()) return; const room = el.scrollWidth - el.clientWidth; if (room < 24) return;
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) { return; }
  setTimeout(() => { el.scrollTo({ left: Math.min(80, room), behavior: 'smooth' }); setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 700); }, 600);
}
/* ───────── on a phone, one pane at a time: the dock holds the four pages and two keys, what the page works on (the map,
   the board, the press, the wall) and the page itself ───────── */
const MAIN_IC = { radio: 'radar', signals: 'base', signs: 'receipt', portfolio: 'stories' };
const MAIN_W = { radio: 'MAP', signals: 'BOARD', signs: 'PAPER', portfolio: 'WALL' };
let pane = 'page';
function syncDock() {
  const m = $('#dock [data-pane="main"]'), pg = $('#dock [data-pane="page"]'); if (!m) return; const shown = S.open ? pane : 'main';
  const k = VIEWS[S.view].k; m.innerHTML = `${icon(MAIN_IC[k] || 'radar', 'sm')}<span>${MAIN_W[k] || 'MAP'}</span>`; pg.innerHTML = `${icon('note', 'sm')}<span>PANEL</span>`;
  m.setAttribute('aria-pressed', String(shown === 'main')); pg.setAttribute('aria-pressed', String(shown === 'page'));
  const sb = $('#sheetbar'); if (sb) { sb.querySelector('.sb-t').textContent = VIEWS[S.view].long || VIEWS[S.view].w; sb.setAttribute('aria-expanded', String(shown === 'page')); }
  document.body.classList.toggle('pane-main', shown === 'main'); document.body.classList.toggle('pane-page', shown === 'page');
  /* on a phone the device lowered to its lip rolls W.I.S.H.'s receipt up with it */
  try { jrTabs(); } catch (e) { /* W.I.S.H. not built yet */ }
}
function setPane(p) {
  pane = p; if (p === 'main' && viewEl.contains(document.activeElement)) document.activeElement.blur(); if (p === 'page' && !S.open) setOpen(true); else syncDock(); railFit(p === 'main' ? 'lo' : 'dflt');
  setTimeout(() => { if (S.mapReady) map.resize(); if (p === 'main' && S.view === 2) fitZ(); }, 380);
}
$('#sheetbar').addEventListener('click', () => { setPane(pane === 'page' ? 'main' : 'page'); tick(pane === 'page' ? 1500 : 1200); });
$('#dock').addEventListener('click', e => { const b = e.target.closest('[data-pane]'); if (!b) return; setPane(b.dataset.pane); tick(b.dataset.pane === 'main' ? 1200 : 1500); });
/* every page but the radio covers the map, except W.I.S.H.'s front, which is held over the map itself; its back is the blueprint */
const offMap = i => i !== 0 && !(i === 1 && faceOf(1) === 'front');
function setOpen(on) {
  S.open = on; document.body.classList.toggle('shut', !on); buzz(5); syncDock();
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(on && +b.dataset.i === S.view && !S.mode)));
  if (!on) { stopHeroes(); showBoard(false); showZine(false); showGallery(false); document.body.classList.remove('off-map'); if (S.mode) closeRecord('view'); }
  else document.body.classList.toggle('off-map', offMap(S.view));
  jrShow();
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
const labI = (ic, tip, n) => `<h3 class="lab labi" data-tip="${esc(tip)}" aria-label="${esc(tip)}">${icon(ic, 'sm')}<span class="lab-w mono">${esc(String(tip).toUpperCase())}</span>${n != null ? `<b class="mono">${n}</b>` : ''}</h3>`;
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
  if (AURA_ONLY != null && i !== AURA_ONLY) { i = AURA_ONLY; part = null; }
  /* a first visit opens only the pages it has reached, and SELECT belongs to PRINT alone */
  if (simple() && i > jMax()) { i = jMax(); part = null; }
  if (simple() && i !== 2) closePick();
  const was = S.view; S.view = i; document.body.dataset.view = VIEWS[i].k; syncDock(); headBar(); unNudge(i);
  if (S.mode && !keep) closeRecord('view');
  if (!S.open) setOpen(true);
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
  if (was !== i) buzz(5);
  /* once started, the radio plays on under every page */
  document.body.classList.toggle('off-map', offMap(i));
  renderView(); life.data();
  viewEl.classList.remove('in'); void viewEl.offsetWidth; viewEl.classList.add('in');
  if (part) goPart(part);
  try { history.replaceState(null, '', '#' + (part || VIEWS[i].slug || VIEWS[i].k)); } catch (e) { /* file:// */ }
}
/* a part of a page by name */
const PARTS = { radio: [0, null], now: [0, null], outlook: [0, 'sec-heat'], tracks: [0, 'sec-heat'], five: [0, 'sec-five'], heroes: [0, 'sec-five'], alerts: [0, 'sec-alarms'], gigs: [0, 'sec-gigs'], events: [0, 'sec-gigs'],
  signals: [1, null], wish: [1, null], constellations: [1, 'sec-cons'], cons: [1, 'sec-cons'], groups: [1, 'sec-groups'],
  signs: [2, null], print: [2, null], slips: [2, 'sec-slips'], printers: [2, 'sec-prn'],
  portfolio: [3, null], stories: [3, null], board: [3, 'sec-board'], receive: [3, 'sec-board'], briefs: [3, 'sec-briefs'], tools: [3, 'sec-tools'], field: [3, 'sec-tools'], settings: [3, 'sec-set'], sources: [3, 'sec-src'] };
function goPart(part) { const id = (PARTS[part] || [])[1]; const el = id && document.getElementById(id); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; if (part === 'receive') openReceive(true); viewEl.scrollTop = Math.max(0, el.offsetTop - 8); }
function renderView() {
  if (S.mode) return;
  const k = VIEWS[S.view].k; const front = faceOf(S.view) === 'front'; document.body.dataset.face = front ? 'front' : 'back';
  viewEl.innerHTML = k === 'radio' ? (front ? radioFront() : viewRadio()) : k === 'signals' ? (front ? wishFront() : viewSignals()) : k === 'signs' ? (front ? printFront() : viewSigns()) : viewPortfolio();
  viewEl.scrollTop = 0; document.body.classList.toggle('off-map', S.open && offMap(S.view)); showBoard(k === 'signals' && S.open && !front); showZine(k === 'signs' && S.open); showGallery(k === 'portfolio' && S.open);
  const cov = $('#cover'); if (cov) cov.replaceChildren();
  jrShow();
  if (k === 'radio') { bindOutlook(); askHeroPhotos(); if (S.open) startHeroes(); } else stopHeroes();
  if (k === 'portfolio') { bindPortfolio(); fillDeck(); fillSongs(); }
  if (k === 'signs') { fillThumbs(); fillDeck(); }
  if (k === 'radio' && (T4.water || (S.wx.tmax || 0) >= HEAT.hot)) loadOverlays();
  growTA($('#wf-for')); jwMore($('#jw-for')); railFit();
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
const pickMonth = (k, read) => { if (read && timeOn()) setTime(false); k = clamp(k, 0, OUT_N - 1); if (read) S.moRead = S.moRead === k ? null : k; if (k === S.mo && !read) return; S.mo = k; setNino(outMonth(k).lv >= 4 && k !== nowK()); life.data(); const st = viewEl.scrollTop; renderView(); viewEl.scrollTop = st; tick(1500 + 50 * k); };
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
  const sy = e.target.closest('[data-style]'); if (sy) { prefs.slip = sy.dataset.style; savePrefs(); $$('#view [data-style]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.style === prefs.slip))); if (S.view === 2) showZine(true); tick(1500); return; }
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
const EQ_SEGS = 11, EQ_LIT = [4, 6, 7, 9, 11];
const segTone = i => Math.min(4, Math.floor(i / (EQ_SEGS / 5)));
/* the equaliser moves with the music, not a wave of its own: each column lifts with the mix as loud as its month is hot, a cap
   above it rises and falls back slowly, and every note of the sweep pulses the extreme months */
let eqRaf = 0, eqNote = 0; const EQK = new WeakMap();
function eqTick() {
  eqRaf = 0; const cols = $$('#view .mstrip.eq .mo'); if (!cols.length || !document.body.classList.contains('on-air') || document.hidden || reduced()) { cols.forEach(m => { const c = m.querySelector('.eq-c'); const base = +m.dataset.lit || 2; if (c) c.querySelectorAll('i:not(.eq-cap)').forEach((el, di) => { const idx = EQ_SEGS - 1 - di; el.classList.toggle('l', idx < base); el.classList.remove('snd'); el.classList.toggle('pk', idx === base - 1); }); EQK.delete(m); m.style.setProperty('--hot', (+m.dataset.heat || 0) + (prefs.nino ? 0.25 : 0)); }); return; }
  const lv = snd.level(), nt = snd.noteAt(); const hit = nt !== eqNote; eqNote = nt;
  /* each column the same height, in the same box: the heat of its month lights it to a level, the music lights more above
     that as loud as the month is hot, never past the top; a peak holds a moment and falls back */
  for (const m of cols) { const w = (+m.dataset.lv || 1) / 4, base = +m.dataset.lit || 2, c = m.querySelector('.eq-c'); const up = lv * w; const k = EQK.get(m) || { n: base, pk: base }; const n = Math.min(EQ_SEGS, base + Math.round((0.35 + up) * 5)); k.pk = Math.max(n, k.pk - 0.08);
    if (c && (n !== k.n || Math.round(k.pk) !== k.pkr)) { const segs = c.querySelectorAll('i:not(.eq-cap)'); segs.forEach((el, di) => { const idx = EQ_SEGS - 1 - di; el.classList.toggle('l', idx < n); el.classList.toggle('snd', idx >= base && idx < n); el.classList.toggle('pk', idx === Math.round(k.pk) - 1); }); k.n = n; k.pkr = Math.round(k.pk); }
    EQK.set(m, k); m.style.setProperty('--hot', Math.min(1.4, (+m.dataset.heat || 0) + up * 0.9 + (prefs.nino ? 0.25 : 0)).toFixed(3));
    if (hit && m.classList.contains('d4')) { m.classList.remove('hit'); void m.offsetWidth; m.classList.add('hit'); } }
  eqRaf = requestAnimationFrame(eqTick);
}
const eqWake = () => { if (!eqRaf) eqRaf = requestAnimationFrame(eqTick); };
setInterval(eqWake, 1000);
/* each month's heat for its colour: the outlook's level, eased, and after the coolest month rising again to the strip's end
   (next September), as the next season comes on */
function eqHeat() {
  const lv = [...Array(OUT_N).keys()].map(k => outMonth(k).lv / 4);
  const firstLo = lv.indexOf(Math.min(...lv)); const end = Math.min(0.62, Math.max(...lv)); const h = lv.map((v, k) => (k > firstLo ? Math.max(v, lv[firstLo] + (end - lv[firstLo]) * (k - firstLo) / Math.max(1, lv.length - 1 - firstLo)) : v));
  return h.map((v, k) => (h[k - 1] == null ? v : h[k + 1] == null ? (v * 2 + h[k - 1]) / 3 : (h[k - 1] + v * 2 + h[k + 1]) / 4));
}
function monthStrip() {
  const ks = [...Array(OUT_N).keys()]; const HT = eqHeat(); const now = nowK(); const span = k => k >= S.mo && k < S.mo + 3; const gs = monthKinds();
  const col = k => { const Mo = outMonth(k); const lit = EQ_LIT[Mo.lv] || 2; let segs = ''; for (let i = EQ_SEGS - 1; i >= 0; i--) segs += `<i class="${i < lit ? `l t${segTone(i)}` : ''}${i === lit - 1 ? ' pk' : ''}" style="--p:${(i / (EQ_SEGS - 1)).toFixed(2)}"></i>`;
    return `<button type="button" class="mo d${Mo.lv} h${Mo.h}${span(k) ? ' on' : ''}${k === now ? ' now' : ''}${S.moRead === k ? ' read' : ''}" data-mo="${k}" data-lv="${Mo.lv}" data-lit="${EQ_LIT[Mo.lv] || 2}" data-heat="${HT[k].toFixed(3)}" style="--hot:${HT[k].toFixed(3)}" aria-pressed="${S.moRead === k}" data-tip="${MON[Mo.m]} ${Mo.y} · ${DEG[Mo.lv]}"><span class="eq-c" style="--d:${(k * 0.17).toFixed(2)}s"><i class="eq-cap" aria-hidden="true"></i>${segs}</span><b class="mono">${MON[Mo.m].charAt(0)}</b></button>`; };
  return `<div class="mstrip eq" style="--n:${OUT_N}">${(CONFIG.FEATURES || {}).time ? `<button type="button" class="t-play" data-time aria-pressed="${timeOn()}" aria-label="Time">${icon(timeOn() ? 'pause' : 'play', 'sm')}</button>` : ''}<div class="ms-m" role="group" aria-label="Months">${ks.map(col).join('')}</div></div>`
    + (S.moRead != null ? readout(S.moRead, gs[S.moRead]) : '');
}
/* a month pressed: its data, every point the outlook holds, as a handheld's screen on a mission would show it. No sentences:
   the month and how far off, its danger, what the danger rests on, the ocean, the odds of heat and of rain, what is normal, the
   windows open, the lives they reach; the jellyfish in the glass behind */
const HZ = { f: 'BOM FORECAST', m: 'MODELS', p: 'NONE ISSUED' };
function readout(k, top) {
  const Mo = outMonth(k); const ws = OUT.windows.filter(w => inWin(w, Mo.m)); const at = (a) => ((a || [])[k] || '—');
  const gs = [top, ...ws.flatMap(w => w.g)].filter((g, i, a) => g && a.indexOf(g) === i).slice(0, 7); const days = Math.ceil((monthStart(k) - Date.now()) / 864e5);
  const row = (t, v, cls = '') => `<dt>${t}</dt><dd${cls ? ` class="${cls}"` : ''}>${v}</dd>`;
  return `<div class="eq-read eq-hud d${Mo.lv}" role="status" aria-label="${MON[Mo.m]} ${Mo.y}"><i class="hud-spec" aria-hidden="true">${M.jellySVG('currentColor', 'rgba(127,255,224,.06)', 96)}</i>`
    + `<p class="hud-h"><b>${MON[Mo.m]} ${Mo.y}</b><span>${String(k + 1).padStart(2, '0')}/${OUT_N}</span><span>${days > 0 ? `T−${days}D` : 'NOW'}</span></p>`
    + `<dl class="hud-d">${row('LV', `<i class="hud-bar">${[1, 2, 3, 4].map(n => `<b${n <= Mo.lv ? ' class="on"' : ''}></b>`).join('')}</i>${DEG[Mo.lv]}`)}${row('SRC', HZ[Mo.h] || '—')}${row('NIÑO3.4', at(OUT.nino))}`
    + `${row('TMAX>MED', at(OUT.tmax))}${row('HOT DAYS', at(OUT.hot))}${row('RAIN', at(OUT.rain))}${row('≥35° NORM', `${(OUT.hot35 || [])[Mo.m] || 0} D`)}`
    + `${row('WINDOW', ws.length ? ws.map(w => esc(w.w)).join(' · ') : '—')}${row('LIFE', gs.map(g => `<i data-tip="${esc(M.KINDS[g] || '')}">${glyphSVG(g)}</i>`).join(''), 'hud-life')}</dl></div>`;
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
/* the step waiting, as the screen says it; none once all are done */
function stepNow() {
  if (!(MIXES.length || wishStarted() || mineOf().length || POSTERS2.length || printedAny())) { const s1 = placed(), s2 = s1 && (S.connected || strings.list().length > 0); const n = !s1 ? 0 : !s2 ? 1 : 2; return { n: 3, now: n, w: ['find yourself', 'make a connection', 'start'][n], share: n === 2 }; }
  const p = placed() || !!prefs.placed, wi = wishStarted(), wo = mineOf().some(x => linesOf(x).length), mi = POSTERS2.length > 0, mo = printedAny();
  const rows = [{ w: 'where are you?', done: p }, { w: 'W.I.S.H.', done: wi && wo, go: 1 }, { w: 'make · print', done: mi && mo, go: 2 }]; const now = rows.findIndex(r => !r.done);
  return now < 0 ? { now: -1 } : { n: 3, now, w: rows[now].w, go: rows[now].go };
}
const stepAttr = () => { const st = stepNow(); return ` data-st='${esc(JSON.stringify(st))}'${st.share ? ' data-share-mix' : st.go != null ? ` data-go-view="${st.go}"` : ''}`; };
const stepWords = () => { const st = stepNow(); return st.now >= 0 ? String(st.w).toUpperCase() : 'EL NIÑO'; };
let cdT = 0;
setInterval(() => {
  const el = document.querySelector('#sec-heat .cd'); if (!el || document.hidden) return; cdT++; let st = null; try { st = JSON.parse(el.dataset.st || 'null'); } catch (e) { st = null; }
  const showSt = st && st.now >= 0 && (cdT % 8 >= 4 || !el.dataset.to);
  if (showSt) { el.textContent = stepWords(); el.classList.add('stp'); } else { if (el.dataset.to) el.textContent = countText(+el.dataset.to); el.classList.remove('stp'); }
}, 1000);
/* the clues, the only words on the radio: find yourself; tie something to something; then the signal */
/* the steps: one thin line, a dot for each, the words small under it. Done, the dot is filled; the one waiting is a ring that
   breathes; begun, a point inside the ring; to come, faint. The clues first, then the checklist, the same way */
function stepsHTML(rows, now, cls = '') {
  const done = rows.filter(r => r.done).length;
  return `<ol class="steps${cls}" aria-label="${done} of ${rows.length}">${rows.map((r, i) => {
    const inner = `<i class="st-d" aria-hidden="true"></i><span class="st-w">${r.w}</span>`;
    const tag = r.share ? `<button type="button" class="st-b" data-share-mix>${inner}</button>` : r.go != null ? `<button type="button" class="st-b" data-go-view="${r.go}">${inner}</button>` : `<span class="st-b">${inner}</span>`;
    return `<li class="st${r.done ? ' done' : `${i === now ? ' now' : ''}${r.part ? ' part' : ''}`}" data-step="${i + 1}">${tag}</li>`; }).join('')}</ol>`;
}
function cluesHTML() {
  const s1 = placed(), s2 = s1 && (S.connected || strings.list().length > 0); const n = !s1 ? 0 : !s2 ? 1 : 2;
  return stepsHTML([{ w: 'find yourself', done: s1 }, { w: 'make a connection', done: s2 }, { w: 'start', share: n === 2 }], n, ' clues');
}
/* once a signal is started: the checklist, on the same line of dots. Where; the W.I.S.H., begun and sent; a poster made and
   printed. All three met, start comes after them */
const wishStarted = () => S.signals.some(x => !x.ex && !x.shared && linesOf(x).length >= 2) || WKEYS.filter(k => String(WDRAFT[k] || '').trim()).length >= 2;
const printedAny = () => !!store.get('da.printed.v1', 0) || PROOFS.length > 0 || S.signals.some(x => !x.ex && !x.shared && /PRINTED/.test(sentWord(x)));
function checklistHTML() {
  const p = placed() || !!prefs.placed, wi = wishStarted(), wo = mineOf().some(x => linesOf(x).length), mi = POSTERS2.length > 0, mo = printedAny();
  const rows = [{ w: 'Where are you?', done: p }, { w: 'W.I.S.H.', done: wi && wo, part: wi || wo, go: 1 }, { w: 'Make · Print', done: mi && mo, part: mi || mo, go: 2 }];
  const now = rows.findIndex(r => !r.done);
  return stepsHTML(rows, now) + (now < 0 ? `<button type="button" class="st-go" data-share-mix>start</button>` : '');
}
/* ───────── the invisible hand: each step met is answered once, a few notes of glass and a glow where it was met ───────── */
const STEPS = () => [placed() || !!prefs.placed, !!(S.connected || strings.list().length), MIXES.length > 0, wishStarted(), mineOf().some(x => linesOf(x).length), POSTERS2.length > 0, printedAny()];
const STEP_ROW = [1, null, null, 2, 2, 3, 3];
let stepsWas = null;
function stepsCheck() {
  let now; try { now = STEPS(); } catch (e) { return; }
  if (!stepsWas) stepsWas = Array.isArray(prefs.steps) && prefs.steps.length === now.length ? prefs.steps : now;
  /* met once, a step stays met on this device: what met it can come and go (a story shown, then filed) without a second answer */
  const next = now.map((v, i) => !!(v || stepsWas[i]));
  next.forEach((v, i) => { if (v && !stepsWas[i]) won(i); });
  if (next.join() !== stepsWas.join()) { stepsWas = next; prefs.steps = next; savePrefs(); }
}
/* the steps a first visit met are kept without a sound: its gates answered them already */
function stepsQuiet() { try { const now = STEPS(); stepsWas = now.map((v, i) => !!(v || (stepsWas || prefs.steps || [])[i])); prefs.steps = stepsWas; savePrefs(); } catch (e) { /* as they were */ } }
function won(i) {
  if (simple()) return;   /* a first visit's gates answer for themselves (43-journey.js) */
  snd.reward(i + 1); document.body.classList.remove('won'); void document.body.offsetWidth; document.body.classList.add('won'); setTimeout(() => document.body.classList.remove('won'), 1600);
  const mk = $('.lk-mark'); if (mk) { mk.classList.remove('pulse'); void mk.offsetWidth; mk.classList.add('pulse'); }
  if (S.open && S.view === 0 && !S.mode) { refreshPanel(); const r = STEP_ROW[i] && document.querySelector(`.st[data-step="${STEP_ROW[i]}"]`); if (r) r.classList.add('won'); }
  if (i === STEPS().length - 1) dispatchEvent(new CustomEvent('da:muse'));
}
setInterval(stepsCheck, 1500);
/* the lockup: the muse and the name. Tapped, the muse pulses and rings; tapped five times quickly, the water fills with them */
const lockup = () => `<header class="lockup"><button type="button" class="lk-mark" data-muse aria-label="novel.global">${M.jellySVG('currentColor', 'var(--glass)', 44)}</button><b class="lk-n">novel.global</b></header>`;
let museN = 0, museT = 0;
document.addEventListener('click', e => { const b = e.target.closest('[data-muse]'); if (!b) return; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); if (Date.now() - (window.__shipT || 0) > 6000) { window.__shipT = Date.now(); snd.ship(); } else snd.jelly(0); museN = Date.now() - museT < 900 ? museN + 1 : 1; museT = Date.now(); if (museN >= 5) { museN = 0; dispatchEvent(new CustomEvent('da:muse')); } });
/* the head of every page: the muse and the name, level with the first key of the rail; the Country on the right */
const COUNTRIES = (CONFIG.COUNTRIES && CONFIG.COUNTRIES.length) ? CONFIG.COUNTRIES : [{ id: 'here', n: CONFIG.COUNTRY, s: CONFIG.SOVEREIGNTY || '' }];
const countryNow = () => COUNTRIES.find(c => c.id === prefs.ctry) || COUNTRIES[0];
const countryBar = () => { const c = countryNow(); return `<div class="ctry"><label class="ct-sel"><select id="ctry" aria-label="Country">${COUNTRIES.map(x => `<option value="${esc(x.id)}"${x.id === c.id ? ' selected' : ''}>${esc(x.n)}</option>`).join('')}${(CONFIG.SOON || []).length ? `<optgroup label="Soon">${CONFIG.SOON.map(n => `<option disabled>${esc(n)} · soon</option>`).join('')}</optgroup>` : ''}</select><span class="ct-n">${esc(c.n)}</span><span class="ct-s">${esc(c.s)}</span>${COUNTRIES.length > 1 ? icon('next', 'sm') : ''}</label></div>`; };
/* the Country stands at the head of the radio only, and fades slowly over a minute (it comes back under the pointer) */
/* on the portfolio the name goes: the muse swims across the head of the page, back and forth, pulsing as it goes */
const swim = () => `<div class="swim"><i class="sw-x"><i class="sw-y"><button type="button" class="lk-mark sw-j" data-muse aria-label="novel.global">${M.jellySVG('currentColor', 'var(--glass)', 44)}</button></i></i></div>`;
function headBar() { const h = $('#ph'); if (h) h.innerHTML = S.view === 3 ? swim() : lockup() + (S.view === 0 ? countryBar() : ''); }
document.addEventListener('change', e => { if (e.target.id !== 'ctry') return; prefs.ctry = e.target.value; savePrefs(); headBar(); });
/* the printers online, as a pager would say it: its light, its name, a buzz when one comes on */
const printersOn = () => [MASTER, ...PARTNERS].filter(p => p && (PSTATE[p.id] || {}).ready);
function pagerHTML() {
  const on = printersOn();
  /* small: a light and a printer; its words for a screen reader and on a long hover */
  const w = on.length ? 'PRINTER ONLINE' : 'PRINTER ONLINE SOON';
  return `<div class="pager${on.length ? ' on' : ''}" role="status" data-tip="${w}"><i class="pg-led"></i><i class="pg-buzz">${icon('print', 'sm')}</i><span class="pg-lcd mono">${w}</span></div>`;
}
function viewRadio() {
  const ex = extremeAhead();
  /* no words but the clues: El Niño's emergency counting down, in orange; the months as an equaliser; the one button; the
     layers as marks; the three clues. Every name is there on a long hover */
  return `<section class="band dev radio mod${upCls()}" id="sec-heat">${mods('DIRECT ACTION', 'RADIO')}${upMods()}${flipBtn()}
      ${pagerHTML()}<div class="vu" aria-hidden="true"><i class="vu-n"></i></div><p class="b-emerg mono" data-tip="El Niño emergency in"><b class="cd"${ex && !ex.now ? ` data-to="${ex.to}"` : ''}${stepAttr()}>${ex ? (ex.now ? 'NOW' : countText(ex.to)) : stepWords()}</b></p>
      ${monthStrip()}
      <div class="hp-row"><button type="button" class="hp-k${LOOP.on ? ' on' : ''}" data-loop aria-pressed="${LOOP.on}" aria-label="Loop: keep this sound playing wherever the radar goes">${icon('loop')}<small>loop</small></button>`
     + `<button type="button" class="hero-play${S.radio ? ' on' : ''}" data-radio aria-pressed="${S.radio}" aria-label="The radio" data-tip="The radio"><i class="hp-ring"></i>${icon(S.radio ? 'pause' : 'play')}</button>`
     + `<button type="button" class="hp-k hp-keep" data-song-keep aria-label="Keep this track" data-tip="Keep this track">${icon('download')}<small>keep</small></button></div>
      ${layersHTML()}
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
    + `<span class="cap"><strong class="act">${esc(act)}</strong><small class="tk-m mono">${[s.ex ? 'EXAMPLE' : s.shared ? '' : 'MINE', p.cn || p.n, p.place, s.at ? fmtStamp(s.at).split(' ')[0] : ''].filter(Boolean).map(esc).join(' · ')}</small></span>${st ? `<i class="st" aria-label="${esc(st)}"></i>` : ''}</button></li>`;
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
    + `<textarea id="qp-t" rows="7" maxlength="900" spellcheck="true" aria-label="A note to print" placeholder=" ">${esc(QP.t)}</textarea><i class="qp-caret" aria-hidden="true"></i>`
    + `<label class="qp-cam" aria-label="A photograph" data-tip="A photograph">${icon('camera')}<input type="file" id="qp-f" accept="image/*" hidden></label></div>`
    + `<button type="button" class="print-k qp-go${on.length ? ' on' : ''}" data-qp="go" aria-label="Send a message to ${esc(p ? p.n : 'the printer')}" data-tip="Message prints directly to novel.global if online"><i class="pk-led"></i>${icon('epson')}</button></section>`;
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
    const v = await directAction(s, MASTER ? MASTER.id : '', bytes, 'message'); store.set('da.printed.v1', Date.now()); snd.printer(900); ptPrint(cvs.toDataURL('image/png'), s.code, v && v.status); toast(v && v.status === 'outbox' ? '…' : '✓'); btn.classList.add('sent');
    /* sent: the form is cleared for the next message, the words and the photograph both */
    QP.t = ''; QP.img = ''; store.set('da.quick.v1', QP); { const t = $('#qp-t'); if (t) t.value = ''; const ph = $('#sec-quick .qp-ph'); if (ph) ph.remove(); }
    setTimeout(() => btn.classList.remove('sent'), 1600); return v;
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
    : ''; };
/* ───────── the gallery: beside the portfolio, the deck's main screen. Every poster finished here, and the example's zine first,
   on a strip that slides under a finger or the keys, one at a time (scroll snap: no library). Under the screen its number on a
   small display and the keys: back, close up, as a card, download, on ───────── */
let galleryAt = 0, galleryFocus = null;
const wallOf = () => [...(EXK ? [{ id: 'ex', ex: true, img: EXZ.url, at: Date.parse((EXAMPLES[0] || {}).at) || 0 }] : []), ...POSTERS2];
const wallNo = x => (x.ex ? '000' : String(POSTERS2.length - POSTERS2.indexOf(x)).padStart(3, '0'));
const wallCap = x => `№ ${wallNo(x)}${x.ex ? ' · EX' : ` · ${fmtStamp(x.at)}`}`;
function showGallery(on) {
  const g = $('#gallery'); if (!g) return; g.hidden = !on; if (!on) { gzReset(); g.classList.remove('full'); document.body.classList.remove('gl-full'); return; } const ps = wallOf();
  /* what was just printed comes first */
  if (galleryFocus) { const at = ps.findIndex(x => x.id === galleryFocus); if (at >= 0) galleryAt = at; galleryFocus = null; }
  galleryAt = clamp(galleryAt, 0, Math.max(0, ps.length - 1));
  /* drawn again only when what hangs on the wall has changed: a refresh from elsewhere (news arriving, a print's state) leaves
     the piece in view, its close-up and its card as they are, and only its number and light are read again */
  const sig = JSON.stringify([ps.map(x => [x.id, wallCap(x)]), deck().map(c => c.id)]); const tr0 = g.querySelector('.gl-track');
  if (tr0 && g.dataset.sig === sig) {
    /* a picture that has arrived since (the example's, made once a visit) goes into its own slide, nothing else redrawn */
    ps.forEach((x, i) => { const w = x.img && tr0.querySelector(`.gl-slide[data-i="${i}"] .gl-wait`); if (w) { const im = document.createElement('img'); im.src = x.img; im.alt = ''; im.draggable = false; w.replaceWith(im); } });
    if (Math.round(tr0.scrollLeft / Math.max(1, tr0.clientWidth)) !== galleryAt) tr0.scrollLeft = galleryAt * tr0.clientWidth; galleryRead(); return; }
  g.dataset.sig = ps.length ? sig : ''; gzReset();
  if (!ps.length) { g.innerHTML = `<div class="gl-none"><button type="button" class="key" data-go-view="2" aria-label="The print shop" data-tip="The print shop">${icon('receipt')}</button></div>`; return; }
  /* the example's zine is made once a visit; until then the muse waits in its place */
  if (ps.some(x => x.ex && !x.img)) exampleZineImage().then(u => { if (u && !$('#gallery').hidden && S.view === 3) showGallery(true); });
  const art = x => (x.img ? `<img src="${x.img}" alt="" draggable="false">` : `<i class="gl-wait" aria-hidden="true">${M.jellySVG('currentColor', 'transparent', 48)}</i>`);
  /* a carousel of pairs: each poster's own card, the noticing and its connections, standing beside it at full size, the poem's art */
  const pair = x => { const c = !x.ex && deck().find(v => v.id === 'p:' + x.id); return c ? `<div class="gl-pair">${cardBtn(c)}</div>` : ''; };
  const k = (gl, ic, w) => `<button type="button" class="gk" data-gl="${gl}" aria-label="${w}" data-tip="${w}">${icon(ic)}</button>`;
  g.innerHTML = `<div class="gl-deck"><div class="gl-screen"><ol class="gl-track" tabindex="0" aria-label="The wall">${ps.map((x, i) => `<li class="gl-slide" data-i="${i}"><figure class="gl-hero${x.ex ? ' ex' : ''}">${art(x)}${pair(x)}<figcaption class="vh">${wallCap(x)}</figcaption></figure></li>`).join('')}</ol></div>`
    + `<div class="gl-bar"><p class="gl-vfd mono" aria-live="polite"></p><div class="gl-keys">${k('prev', 'back', 'Back')}${k('zoom', 'search', 'Closer')}${k('full', 'out', 'Full screen')}${k('card', 'stories', 'As a card')}${k('png', 'download', 'Download')}${k('next', 'next', 'On')}</div></div></div>`;
  g.classList.toggle('with-cards', deck().some(c => c.kind !== 'poster')); galleryCards(); cardImgs();
  const tr = g.querySelector('.gl-track'); tr.scrollLeft = galleryAt * tr.clientWidth; galleryRead();
  /* slid to another: its number changes in place, its card slides with it; the screen itself is never drawn again while it moves */
  let q = 0; tr.addEventListener('scroll', () => { cancelAnimationFrame(q); q = requestAnimationFrame(() => { const i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); if (i !== galleryAt) { gzReset(); galleryAt = clamp(i, 0, ps.length - 1); galleryRead(); tick(1500); } }); }, { passive: true });
}
/* a card as it stands in the showcase: its face, its back (pressed, it turns over; pressed again, back), and a small key of its
   own, on its back, that opens it */
const cardKindW = c => (c.kind === 'fig' ? 'CONSTELLATION' : String(M.KINDS[c.g] || (c.kind === 'poster' ? 'POSTER' : 'LIFE')).toUpperCase());
const cardBack = c => `<b>${esc(String(c.name || '').toUpperCase())}</b><span>${cardKindW(c)}</span>${c.kind === 'life' && THREAT[c.g] ? `<small>${esc(THREAT[c.g])}</small>` : ''}${c.kind === 'poster' && cardIntel(c) ? `<small>${esc(cardIntel(c))}</small>` : ''}<i>№ ${String(c.n + 1).padStart(3, '0')}</i>`;
const cardBtn = c => `<button type="button" class="gc" data-gc="${esc(c.id)}" aria-label="${esc(c.name || 'A card')}"><span class="gc-in"><img class="gc-f" data-card-g="${esc(c.id)}" alt=""><span class="gc-b mono">${cardBack(c)}</span></span></button><button type="button" class="gc-go" data-gc-open="${esc(c.id)}" aria-label="Open the card">${icon('next', 'sm')}</button>`;
function cardImgs() { (async () => { for (const im of $$('#gallery img[data-card-g]:not([src])')) { const c = deck().find(v => v.id === im.dataset.cardG); if (!c) continue; try { const u = await cardURL(c, im.closest('.gl-pair') ? 6 : 2); if (im.isConnected) im.src = u; } catch (e) { /* left blank */ } } })(); }
/* the cards beside the screen: the lives and the constellations (a poster's own card stands with it, in the screen) */
function galleryCards() {
  const g = $('#gallery'); if (!g || g.hidden) return;
  const cs = deck().filter(c => c.kind !== 'poster').slice(0, 16);
  let aside = g.querySelector('.gl-cards'); if (!g.classList.contains('with-cards')) { if (aside) aside.remove(); return; }
  if (!aside) { aside = document.createElement('aside'); aside.className = 'gl-cards'; aside.setAttribute('aria-label', 'Cards'); g.appendChild(aside); }
  aside.innerHTML = `<ol>${cs.map((c, i) => `<li style="--i:${i}">${cardBtn(c)}</li>`).join('')}</ol>`;
  cardImgs();
}
/* on a phone the close-up key opens the piece full screen, over everything; there, a pinch or a press brings it closer */
function galleryFull(on) {
  const g = $('#gallery'); if (!g) return; on = on == null ? !g.classList.contains('full') : !!on; gzReset();
  g.classList.toggle('full', on); document.body.classList.toggle('gl-full', on); const k = g.querySelector('[data-gl="full"]'); if (k) k.setAttribute('aria-pressed', String(on));
  const tr = g.querySelector('.gl-track'); if (tr) requestAnimationFrame(() => { tr.scrollLeft = galleryAt * tr.clientWidth; });
}
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('gl-full')) galleryFull(false); });
/* the small display under the screen: which one, of how many; the keys that do not apply to it go quiet */
function galleryRead() {
  const g = $('#gallery'); const ps = wallOf(); const p = ps[galleryAt]; if (!g || !p) return;
  /* a print sent and not yet printed: its light amber, blinking, and where it has got to; printed, green */
  const sg = p.story ? S.signals.find(x => x.key === p.story) : null; const sw = sg ? sentWord(sg) : ''; const done = /^PRINTED/.test(sw);
  const v = g.querySelector('.gl-vfd'); if (v) v.innerHTML = `<b>${sw ? `<i class="gl-st${done ? ' done' : ''}" aria-hidden="true"></i>` : ''}${sw && !done ? `№ ${wallNo(p)}` : wallCap(p)}</b>${sw && !done ? `<span class="gl-sw">${esc(sw.split(' · ')[0])}</span>` : ''}<span>${String(galleryAt + 1).padStart(2, '0')} / ${String(ps.length).padStart(2, '0')}</span>`;
  g.classList.toggle('waiting', !!sw && !done);
  const dis = (k, off) => { const b = g.querySelector(`[data-gl="${k}"]`); if (b) b.disabled = !!off; };
  dis('prev', galleryAt === 0); dis('next', galleryAt >= ps.length - 1); dis('card', p.ex); dis('png', !p.img); dis('zoom', !p.img);
}
function galleryGo(i) { const tr = $('#gallery .gl-track'); if (!tr) return; tr.scrollTo({ left: clamp(i, 0, wallOf().length - 1) * tr.clientWidth, behavior: reduced() ? 'auto' : 'smooth' }); }
/* a poster or a zine, close up, at five sizes: half, three quarters, as wide as the screen allows, twice, three times, scrolled about; a press on it
   steps up and round again, keeping the place pressed under the finger. Esc, the cross or the dark around it closes it */
const lv0 = at => (at == null ? 2 : at);
function zoomArt(src, host, at) {
  const z = document.createElement('div'); z.className = `zoomv${host ? ' in' : ''}`; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', 'Close up');
  z.dataset.lv = lv0(at); z.innerHTML = `<div class="zv-s"><img src="${src}" alt="" draggable="false"></div><div class="zv-keys"><button type="button" class="gk" data-zv="out" aria-label="Smaller">${icon('minus')}</button><b class="zv-l mono">100%</b><button type="button" class="gk" data-zv="in" aria-label="Larger">${icon('plus')}</button><button type="button" class="gk" data-zv="x" aria-label="Close">${icon('close')}</button></div>`;
  (host || document.body).appendChild(z); tick(1600);
  const sc = z.querySelector('.zv-s'), im = z.querySelector('img'); const LV = [0.5, 0.75, 1, 2, 3]; let lv = at == null ? 2 : at; const base = () => Math.min((host ? host.clientWidth : innerWidth) * 0.92, 720);
  im.style.width = `${Math.round(base() * LV[lv])}px`; z.querySelector('.zv-l').textContent = `${Math.round(LV[lv] * 100)}%`;
  const set = (n, cx, cy) => {
    const r = im.getBoundingClientRect(); const fx = cx == null ? 0.5 : (cx - r.left) / r.width, fy = cy == null ? 0.5 : (cy - r.top) / r.height; const ax = cx == null ? sc.clientWidth / 2 : cx - sc.getBoundingClientRect().left, ay = cy == null ? sc.clientHeight / 2 : cy - sc.getBoundingClientRect().top;
    lv = n; z.dataset.lv = n; im.style.width = `${Math.round(base() * LV[n])}px`; z.querySelector('.zv-l').textContent = `${Math.round(LV[n] * 100)}%`; const r2 = im.getBoundingClientRect(); const ox = r2.left - sc.getBoundingClientRect().left + sc.scrollLeft, oy = r2.top - sc.getBoundingClientRect().top + sc.scrollTop;
    sc.scrollLeft = ox + fx * r2.width - ax; sc.scrollTop = oy + fy * r2.height - ay; tick(900 + n * 200);
  };
  const close = () => { z.remove(); removeEventListener('keydown', key); tick(1100); };
  const key = e => { if (e.key === 'Escape') close(); if (e.key === '+' || e.key === '=') set(Math.min(4, lv + 1)); if (e.key === '-') set(Math.max(0, lv - 1)); };
  addEventListener('keydown', key);
  z.addEventListener('click', e => {
    const b = e.target.closest('[data-zv]'); if (b) { if (b.dataset.zv === 'x') close(); else set(clamp(lv + (b.dataset.zv === 'in' ? 1 : -1), 0, 4)); return; }
    if (e.target === im) { set((lv + 1) % 5, e.clientX, e.clientY); return; }
    if (e.target === z || e.target === sc) close();
  });
}
document.addEventListener('click', e => {
  const g = e.target.closest('#gallery'); if (!g) return;
  const go = e.target.closest('[data-gc-open]'); if (go) { const c = deck().find(v => v.id === go.dataset.gcOpen); if (c) openCard(c); return; }
  const gc = e.target.closest('[data-gc]'); if (gc) { const on = !gc.classList.contains('over'); $$('#gallery .gc.over').forEach(x => x.classList.remove('over')); if (on) gc.classList.add('over'); tick(on ? 1700 : 1100); return; }
  if (e.target.closest('.gl-hero img')) return;   /* a press on the piece is its close-up, in place (gz) */
  const a = e.target.closest('[data-gl]'); const p = wallOf()[galleryAt]; if (!a || !p) { const gv = e.target.closest('[data-go-view]'); if (gv) setView(+gv.dataset.goView); return; }
  if (a.dataset.gl === 'prev') { galleryGo(galleryAt - 1); return; }
  if (a.dataset.gl === 'next') { galleryGo(galleryAt + 1); return; }
  /* the close-up key: the piece closer where it is, twice, three times, and back; the full key: the pair full screen */
  if (a.dataset.gl === 'zoom') { const im = gzIm(); if (im && p.img) { const s1 = GZ.im === im && GZ.s > 2.5 ? 1 : GZ.im === im && GZ.s > 1.5 ? 3 : 2; if (s1 === 1) gzReset(true); else gzTo(im, s1, null, null, true); a.setAttribute('aria-pressed', String(s1 > 1)); tick(1200 + s1 * 200); } return; }
  if (a.dataset.gl === 'full') { galleryFull(); tick(1600); return; }
  if (a.dataset.gl === 'card' && !p.ex) openPosterCard(p.id);
  if (a.dataset.gl === 'png' && p.img) { const l = document.createElement('a'); l.href = p.img; l.download = p.ex ? 'novel-global-example-zine.png' : `poster-${isoDay(new Date(p.at))}.jpg`; l.click(); tick(1800); }
});
/* close up inside the same screen, never a second window: the wheel or a pinch scales the piece about where it points,
   dragged it moves, a press or the close-up key takes it to twice its size and back; sliding to another lets it go */
const GZ = { im: null, s: 1, x: 0, y: 0, pts: new Map(), pinch: null, drag: null };
const gzIm = () => { const sl = $$('#gallery .gl-slide')[galleryAt]; return sl ? sl.querySelector('.gl-hero > img') : null; };
function gzApply(ease) { const im = GZ.im; if (!im) return; im.style.setProperty('transition', ease ? 'transform .22s ease-out' : 'none', 'important'); if (GZ.s > 1.001) im.style.setProperty('transform', `translate(${GZ.x.toFixed(1)}px,${GZ.y.toFixed(1)}px) scale(${GZ.s.toFixed(3)})`, 'important'); else im.style.removeProperty('transform'); im.classList.toggle('zoomed', GZ.s > 1.001); const tr = $('#gallery .gl-track'); if (tr) tr.classList.toggle('zooming', GZ.s > 1.001); }
function gzReset(ease) { if (GZ.im) { GZ.s = 1; GZ.x = 0; GZ.y = 0; gzApply(ease); } GZ.im = null; GZ.pts.clear(); GZ.pinch = null; GZ.drag = null; }
function gzTo(im, s1, px, py, ease) {
  if (GZ.im !== im) { gzReset(); GZ.im = im; }
  s1 = clamp(s1, 1, 4); if (s1 <= 1.001) { gzReset(ease); return; }
  const r = im.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (px == null) { px = cx; py = cy; }
  const qx = (px - cx) / GZ.s, qy = (py - cy) / GZ.s; GZ.x = px - cx + GZ.x - s1 * qx; GZ.y = py - cy + GZ.y - s1 * qy; GZ.s = s1; gzApply(ease);
}
document.addEventListener('wheel', e => { const im = e.target.closest && e.target.closest('#gallery .gl-hero > img'); if (!im || (Math.abs(e.deltaX) > Math.abs(e.deltaY) && !(GZ.im === im && GZ.s > 1.001))) return; e.preventDefault(); gzTo(im, (GZ.im === im ? GZ.s : 1) * Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY); }, { passive: false });
document.addEventListener('pointerdown', e => {
  const im = e.target.closest && e.target.closest('#gallery .gl-hero > img'); if (!im) return; if (GZ.im !== im) gzReset(); GZ.im = im; GZ.pts.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now() });
  if (GZ.pts.size === 2) { const [a, b] = [...GZ.pts.values()]; GZ.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: GZ.s }; GZ.drag = null; }
  else if (GZ.s > 1.001) { GZ.drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; im.setPointerCapture(e.pointerId); e.preventDefault(); }
});
addEventListener('pointermove', e => {
  const p = GZ.pts.get(e.pointerId); if (!p || !GZ.im) return; p.x = e.clientX; p.y = e.clientY;
  if (GZ.pinch && GZ.pts.size >= 2) { const [a, b] = [...GZ.pts.values()]; gzTo(GZ.im, GZ.pinch.s0 * Math.hypot(a.x - b.x, a.y - b.y) / GZ.pinch.d0, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
  if (GZ.drag && GZ.drag.id === e.pointerId) { GZ.x += e.clientX - GZ.drag.x; GZ.y += e.clientY - GZ.drag.y; GZ.drag.x = e.clientX; GZ.drag.y = e.clientY; gzApply(); }
});
const gzUp = e => {
  const p = GZ.pts.get(e.pointerId); if (!p) return; GZ.pts.delete(e.pointerId); if (GZ.pts.size < 2) GZ.pinch = null; if (GZ.drag && GZ.drag.id === e.pointerId) GZ.drag = null;
  /* a press that did not move: twice its size where pressed, or back */
  if (e.type === 'pointerup' && GZ.im && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 6 && performance.now() - p.t < 400 && !GZ.pts.size) { if (GZ.s > 1.001) gzReset(true); else gzTo(GZ.im, 2, e.clientX, e.clientY, true); }
};
addEventListener('pointerup', gzUp); addEventListener('pointercancel', gzUp);
document.addEventListener('keydown', e => { if (!e.target.closest || !e.target.closest('.gl-track')) return; const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); galleryGo(galleryAt + d); });
/* ───────── the printer itself, from above, as it sits at novel.global: the Raspberry Pi and its lights, the TM-T88 and its
   light, both lit as the printer is (online, waiting, off); and when something is sent, the paper comes out of its own slot,
   a pulse down the cable first and the words over the lid while it prints. The last print stays hanging from the slot ───────── */
const PT = store.get('da.pt.v1', null) || {};
function printerTop() {
  const p = MASTER ? PSTATE[MASTER.id] || {} : {}; const st = p.ready ? 'on' : 'off'; const fresh = PT.at && Date.now() - PT.at < 20000;
  return `<section class="sec pt-sec" id="sec-printer"><figure class="pt ${st}${fresh ? ' printing' : ''}${PT.img ? ' fed' : ''}"><img class="pt-ph" src="printer-top.jpg" alt="novel.global's printer and its Raspberry Pi, from above" width="900" height="1200" loading="lazy">`
    + `<i class="pt-led pt-pwr" aria-hidden="true"></i><i class="pt-led pt-act" aria-hidden="true"></i><i class="pt-led pt-prn" aria-hidden="true"></i>`
    + `<svg class="pt-wire" viewBox="0 0 900 1200" preserveAspectRatio="none" aria-hidden="true"><path d="M478 360 C 455 470 420 500 400 545"/></svg>`
    + `<span class="pt-slot" aria-hidden="true"><span class="pt-paper">${PT.img ? `<img src="${PT.img}" alt="">` : ''}</span></span>`
    + `<figcaption class="pt-cap mono"><b>${esc(String(MASTER ? MASTER.n : 'novel.global').toUpperCase())}</b><span>${p.ready ? 'ONLINE' : 'OFFLINE · PRINTS WAIT 24 H'}</span></figcaption>`
    + `<span class="pt-over mono" aria-live="polite">${fresh ? esc(PT.code || '') : ''}</span>`
    /* how to make one: a handbook to download, to build a printer of one's own and join the network */
    + `<a class="pt-build mono" href="build-a-solar-printer.txt" download="build-a-solar-direct-action-printer.txt">BUILD A SOLAR<br>THERMAL PRINTER</a></figure></section>`;
}
/* something sent to print: kept (the last one hangs from the slot), and played out now if the page is open, else on arrival */
function ptPrint(img, code, status) {
  PT.img = img; PT.code = code || ''; PT.at = Date.now(); PT.status = status || ''; store.set('da.pt.v1', { img: PT.img.length < 400000 ? PT.img : '', code: PT.code, at: PT.at });
  const f = $('#sec-printer .pt'); if (!f) return; const pp = f.querySelector('.pt-paper'); pp.innerHTML = `<img src="${img}" alt="">`;
  f.classList.remove('printing', 'fed'); void f.offsetWidth; f.classList.add('printing', 'fed');
  /* the code of what is printing, small, on the printer's lid above its sticker */
  const o = f.querySelector('.pt-over'); o.textContent = code || ''; o.classList.toggle('wait', status === 'outbox');
}
/* a short yes before what cannot be taken back: pressed once it asks SURE? for three seconds; pressed again, it is done */
function sure(btn, fn) {
  if (btn.classList.contains('sure')) { clearTimeout(btn.sureT); btn.classList.remove('sure'); fn(); return; }
  btn.classList.add('sure'); snd.tick(700); buzz([10, 30, 10]); clearTimeout(btn.sureT); btn.sureT = setTimeout(() => btn.classList.remove('sure'), 3000);
}
/* the one wall, here too: every poster finished on novel.global (kept by the aura in this browser), the newest first. A touch shows it
   large; the key goes to the wall itself, where it can be printed again, saved or taken down */
const wallSection = () => `<section class="sec wall" id="sec-wall" hidden><div class="lab-row">${labI('stories', 'Wall')}<a class="pill" href="/" aria-label="To the wall on novel.global" data-tip="To the wall">${icon('next', 'sm')}</a></div><ol class="wall-g" id="wall-g"></ol></section>`;
function wallFill() {
  const sec = $('#sec-wall'), ol = $('#wall-g'); if (!sec || !ol || !window.indexedDB) return;
  let q; try { q = indexedDB.open('novelglobal', 2); } catch (e) { return; }
  q.onupgradeneeded = () => { const d = q.result; for (const n of ['folio', 'piece']) if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); };
  q.onsuccess = () => { let d; try { d = q.result; const all = [], c = d.transaction('folio').objectStore('folio').openCursor();
    c.onsuccess = () => { const k = c.result; if (k) { all.push(k.value); k.continue(); return; } all.sort((a, b) => b.at - a.at); sec.hidden = !all.length;
      ol.innerHTML = all.slice(0, 24).map(f => `<li><button type="button" class="wall-k" aria-label="${esc(f.cap || f.code || 'A poster')}" data-tip="${esc([f.code, f.cap].filter(Boolean).join(' · '))}"><img src="${f.src}" alt="" loading="lazy"></button></li>`).join(''); }; } catch (e) { /* none yet */ } };
}
$('#view').addEventListener('click', e => { const k = e.target.closest('.wall-k'); if (!k) return; const on = !k.classList.contains('big'); $$('#wall-g .wall-k.big').forEach(x => x.classList.remove('big')); k.classList.toggle('big', on); tick(on ? 1500 : 1100); });
/* the board, in the portfolio: everyone's few words in the journey's four sections, by kin; written with the code from a print */
const TALK = { s: 'notice' };
const talkSection = () => IN_AURA ? `<section class="sec talk-sec" id="sec-talk">${labI('stories', 'Talk')}<div class="ts">${['notice', 'story', 'make', 'print'].map(k => `<button type="button" data-tks="${k}" class="${k === TALK.s ? 'on' : ''}">${k.toUpperCase()}</button>`).join('')}</div><ol></ol><form><input maxlength="280" autocomplete="off" aria-label="Say something" placeholder="…"><button type="submit" class="pill sq" aria-label="Send">↑</button></form></section>` : '';
async function talkFill() {
  const sec = $('#sec-talk'); if (!sec) return; const NGp = (() => { try { return window.parent.NG; } catch (e) { return null; } })(); const kinN = k => (NGp && NGp.kin && NGp.kin(k) ? NGp.kin(k).n : '');
  let l = []; try { l = ((await apiJSON('/talk?s=' + TALK.s)) || {}).talk || []; } catch (e) { l = []; }
  const top = l.filter(t => !t.re), kids = id => l.filter(t => t.re === id).reverse(), li = (t, sub) => `<li class="${sub ? 'sub' : ''}"><b>${esc(kinN(t.kin))}</b><small>${esc(NGp && NGp.moonsAgo ? NGp.moonsAgo(t.at) : '')}</small><span>${esc(t.text)}</span></li>`;
  sec.querySelector('ol').innerHTML = top.length ? top.map(t => li(t) + kids(t.id).map(c => li(c, 1)).join('')).join('') : '<li><span>·</span></li>';
  sec.querySelectorAll('[data-tks]').forEach(b => { b.onclick = () => { TALK.s = b.dataset.tks; sec.querySelectorAll('[data-tks]').forEach(q => q.classList.toggle('on', q === b)); talkFill(); }; });
  sec.querySelector('form').onsubmit = async e => { e.preventDefault(); const i = sec.querySelector('input'), t = i.value.trim(), who = store.get('da.who', ''); if (!t) return;
    if (!/^[A-HJ-NP-Z2-9]{3}$/.test(who)) { toast('🗝'); return; }
    try { await apiJSON('/talk', { method: 'POST', body: JSON.stringify({ s: TALK.s, who, text: t }) }); i.value = ''; talkFill(); } catch (er) { toast(er && er.status === 403 ? '🗝' : '·'); } };
}
function viewPortfolio() {
  loadPosts();
  const det = ['iNaturalist', 'Field list: sources in field.html', ...OUT.src.map(x => x[0]), 'Canopy: council urban forest strategies; cooling near 40% (Ziter et al., PNAS 2019)', 'City of Melbourne open data', `${IMG.attribution} · AWS Terrain Tiles`, 'OpenStreetMap', 'MapLibre · Poppins · IBM Plex Mono', CONFIG.COUNTRY];
  const sigs = S.signals;
  /* the W.I.S.H.es made here are among the stories, marked as one's own: one module, not two */
  setTimeout(wallFill, 30);
  if (IN_AURA) setTimeout(talkFill, 60);
  return printerTop() + quickHTML() + wallSection() + talkSection() + postsSection() + `<section class="sec board" id="sec-board"><div class="lab-row">${labI('stories', 'Stories', sigs.length)}<button type="button" class="pill sq" id="rx-open" aria-expanded="false" aria-label="Receive" data-tip="A code from a slip, or a link">${icon('receive', 'sm')}</button></div>`
      + `<form class="rx" id="rx" hidden><textarea id="rx-t" rows="2" aria-label="A code from a slip, or a link" placeholder="DA-····" spellcheck="false" autocapitalize="characters"></textarea><button type="submit" class="ib" aria-label="Receive">${icon('check')}</button></form>`
      /* eight as cards; the rest as a list, a photograph and a headline each */
      + (() => { const all = boardOrder(sigs); const more = all.slice(8); askKindPhotos(all); return `<ol class="sigs cards big">${all.slice(0, 8).map(sigRow).join('')}</ol>` + (more.length ? `<ol class="sigs list">${more.map(sigLine).join('')}</ol>` : ''); })()
      + `</section>`
    + songsHTML()
    + `<section class="sec tools" id="sec-tools">${labI('guide', 'Tools')}<div class="tool-pair">`
      + `<a class="tool" href="field.html" target="_blank" rel="noopener"><span class="tool-art" id="art-field" aria-hidden="true"></span><b>Field list</b><small class="mono">${FIELD.length}</small><i class="go">${icon('out')}</i></a>`
      + `<a class="tool guide" href="guide.html" target="_blank" rel="noopener"><span class="tool-art" id="art-guide" aria-hidden="true"></span><b>Guide</b><i class="go">${icon('out')}</i></a>`
      + `</div><div class="docs dl">${[['signals', 'download', 'SIGNALS', 'CSV'], ['field', 'download', 'FIELD LIST', 'CSV'], ['briefs', 'download', 'BRIEFS', 'CSV'], ['places', 'download', 'PLACES', 'CSV'], ['blank', 'print', 'BLANK W.I.S.H.', 'PRINT']].map(([k, ic, w, f]) => `<button type="button" data-doc="${k}" aria-label="${esc(w)}">${icon(ic)}<span>${esc(w)}</span><small class="mono">${f}</small></button>`).join('')}</div>`
      + packSection()
      + `</section>`
    + `<section class="sec" id="sec-set">${labI('motion', 'Settings')}<div class="set"><button type="button" class="tog lb" data-tip="Sound" aria-label="Sound" id="ix-sound" aria-pressed="${!!prefs.sound}">${icon('sound')}</button><button type="button" class="tog lb" data-tip="Motion" aria-label="Motion" id="ix-motion" aria-pressed="${!!prefs.motion}">${icon('motion')}</button><button type="button" class="tog lb" aria-label="Areas" id="ix-areas" aria-pressed="${!!prefs.areas}" data-tip="Areas: search areas for animals lost">${icon('lost')}</button><button type="button" class="tog lb" data-tip="Day or night: ${darkNow() ? 'night' : 'day'} now" aria-label="Day or dark" id="ix-night" aria-pressed="${darkNow()}">${icon(darkNow() ? 'night' : 'day')}</button><button type="button" class="tog lb" data-tip="Devices: the radio, W.I.S.H. and PRINT as hardware, or plain" aria-label="Devices" id="ix-devices" aria-pressed="${!document.documentElement.classList.contains('plain')}">${icon('radar')}</button><button type="button" class="tog lb" aria-label="Printers" id="ix-printers" aria-pressed="${!!prefs.printers}" data-tip="Printers: W.I.S.H. printers at partner places, on the map">${icon('receipt')}</button>${HIDE.size ? `<button type="button" class="tog lb" id="ix-hidden" aria-label="Show every hidden cell again" data-tip="${HIDE.size} hidden: show them all again">${icon('hide')}</button>` : ''}<label class="sig">${icon('sign')}<input id="ix-sign" type="text" maxlength="40" aria-label="Your name" placeholder="Name" value="${esc(S.me.by)}"></label><button type="button" class="tog lb" id="ix-journey" aria-label="The first visit again" data-tip="The first visit again">${icon('restore')}</button><button type="button" class="tog lb rst" id="ix-reset" aria-label="Start again" data-tip="Start again">${icon('reset')}</button></div>`
      + `<div class="rst-w" id="rst-w" hidden role="alertdialog" aria-label="Start again"><p>${icon('alert')}<span>Everything made on this device goes: signals, boards, W.I.S.H.es, posters, the press. This cannot be undone.</span></p><div class="rst-a"><button type="button" class="key" id="rst-no" aria-label="Keep it">${icon('close')}</button><button type="button" class="key rst-yes" id="rst-yes">${icon('reset')}<b class="mono">CLEAR</b></button></div></div></section>`
    + `<details class="sec" id="sec-briefs"><summary>${labI('note', 'Case studies', BRIEFS.length)}</summary><ol class="briefs">${BRIEFS.map(b => `<li><a href="${esc(b.url)}" target="_blank" rel="noopener" data-tip="${esc(cap(b.fact))}"><span class="bn mono">${b.id.slice(1)}</span><span class="nm"><b>${esc(b.t)}</b><small class="mono">${esc(b.after.toUpperCase())} · ${esc((b.city || '').toUpperCase())}${b.yr ? ` ${b.yr}` : ''} · ${THEMES[b.th] || ''}</small></span>${icon('out', 'sm')}</a></li>`).join('')}</ol></details>`
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
  const pf = $('#pack-f'); if (pf) pf.addEventListener('change', packFile);
  $('#rx').addEventListener('submit', e => { e.preventDefault(); const t = $('#rx-t').value.trim(); if (!t) { nudge($('#rx-t')); return; } receive(t); });
  $('#ix-sound').addEventListener('click', e => { prefs.sound = !prefs.sound; e.currentTarget.setAttribute('aria-pressed', String(prefs.sound)); savePrefs(); syncTracks(); tick(); });
  $('#ix-devices').addEventListener('click', e => { const on = document.documentElement.classList.contains('plain'); e.currentTarget.setAttribute('aria-pressed', String(on)); store.set('da.devices.v2', on ? 1 : 0); document.documentElement.classList.toggle('plain', !on); });
  $('#ix-motion').addEventListener('click', e => { prefs.motion = !prefs.motion; e.currentTarget.setAttribute('aria-pressed', String(prefs.motion)); savePrefs(); document.documentElement.classList.toggle('still', reduced()); life.data(); tick(); });
  $('#ix-areas').addEventListener('click', e => { prefs.areas = !prefs.areas; e.currentTarget.setAttribute('aria-pressed', String(prefs.areas)); savePrefs(); life.redraw(); tick(); });
  $('#ix-night').addEventListener('click', e => { prefs.night = !darkNow(); e.currentTarget.setAttribute('aria-pressed', String(prefs.night)); e.currentTarget.dataset.tip = `Day or night: ${prefs.night ? 'night' : 'day'} now`; const ic = e.currentTarget.querySelector('svg.i'); if (ic) ic.outerHTML = icon(prefs.night ? 'night' : 'day'); savePrefs(); applyNight(); tick(); });
  $('#ix-printers').addEventListener('click', e => { prefs.printers = !prefs.printers; e.currentTarget.setAttribute('aria-pressed', String(prefs.printers)); savePrefs(); life.redraw(); tick(); });
  const hb = $('#ix-hidden'); if (hb) hb.addEventListener('click', () => { const n = HIDE.size; showAllHidden(); life.data(); hb.remove(); toast(`${n} SHOWN`); snd.pluck(0.3, 0); });
  $('#ix-sign').addEventListener('input', e => { S.me.by = e.target.value.trim(); store.set('da.me', S.me); });
  $('#ix-journey').addEventListener('click', e => sure(e.currentTarget, jReplay));
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
