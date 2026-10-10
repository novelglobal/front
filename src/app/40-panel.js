
/* ════════════════════════════════════════════════════════════════════
   THE PAGE — closed until it is asked for. NOW: the months ahead, the five in greatest need, anything hurt or lost,
   and the gigs. STORIES: the signals people have issued, newest first, then the groups, the tools and the sources.
   ════════════════════════════════════════════════════════════════════ */
const panel = $('#panel'), rail = $('#rail'), viewEl = $('#view');
rail.innerHTML = VIEWS.map((v, i) => `<button type="button" class="tab" data-i="${i}" aria-label="${v.label}" data-tip="${v.w}" aria-pressed="false"><span class="sq">${icon(v.icon)}</span><i class="flag" hidden></i></button>`).join('');
rail.addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; const i = +b.dataset.i; tick(1400 + 160 * i); if (i === S.view && S.open && !S.mode) { setOpen(false); return; } setView(i); });
rail.addEventListener('keydown', e => { const b = e.target.closest('.tab'); if (!b) return; const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (!d) return; e.preventDefault(); const all = $$('#rail .tab'); all[(all.indexOf(b) + d + all.length) % all.length].focus(); });
new ResizeObserver(() => { if (S.mapReady) map.resize(); }).observe($('#world'));
function setOpen(on) {
  S.open = on; document.body.classList.toggle('shut', !on); buzz(5);
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(on && +b.dataset.i === S.view && !S.mode)));
  if (!on) { stopHeroes(); if (S.mode) closeRecord('view'); }
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

/* ───────── the two pages ───────── */
function setView(i, keep, part) {
  const was = S.view; S.view = i; document.body.dataset.view = VIEWS[i].k;
  if (S.mode && !keep) closeRecord('view');
  if (!S.open) setOpen(true);
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
  if (was !== i) buzz(5);
  renderView(); life.data();
  viewEl.classList.remove('in'); void viewEl.offsetWidth; viewEl.classList.add('in');
  if (part) goPart(part);
  try { history.replaceState(null, '', '#' + (part || VIEWS[i].k)); } catch (e) { /* file:// */ }
}
/* a part of a page by name */
const PARTS = { now: [0, null], outlook: [0, 'sec-heat'], five: [0, 'sec-five'], heroes: [0, 'sec-five'], alerts: [0, 'sec-alarms'], constellations: [0, 'sec-cons'], cons: [0, 'sec-cons'], gigs: [0, 'sec-gigs'], events: [0, 'sec-gigs'],
  stories: [1, null], signals: [1, 'sec-signals'], receive: [1, 'sec-signals'], groups: [1, 'sec-groups'], tools: [1, 'sec-tools'], field: [1, 'sec-tools'], briefs: [1, 'sec-briefs'], settings: [1, 'sec-set'], sources: [1, 'sec-src'] };
function goPart(part) { const id = (PARTS[part] || [])[1]; const el = id && document.getElementById(id); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; if (part === 'receive') openReceive(true); viewEl.scrollTop = Math.max(0, el.offsetTop - 8); }
function renderView() {
  if (S.mode) return;
  const k = VIEWS[S.view].k;
  viewEl.innerHTML = k === 'now' ? viewNow() : viewStories();
  viewEl.scrollTop = 0;
  if (k === 'now') { bindOutlook(); askHeroPhotos(); if (S.open) startHeroes(); } else { stopHeroes(); bindStories(); }
  if (k === 'now' && (S.wx.tmax || 0) >= HEAT.hot) loadOverlays();
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
const pickMonth = k => { k = clamp(k, 0, OUT_N - 1); if (k === S.mo) return; S.mo = k; life.data(); const st = viewEl.scrollTop; renderView(); viewEl.scrollTop = st; tick(1500 + 50 * k); };
/* the search area of an animal lost: shown, and the whole of it framed */
function searchFor(id) {
  const o = S.byId.get(id); if (!o) return; if (!prefs.areas) { prefs.areas = true; savePrefs(); }
  select(id); const R = life.searchOf(o); const dLat = R / 111000, dLng = R / (111000 * Math.cos(o.lat * Math.PI / 180));
  if (S.mapReady) setTimeout(() => map.fitBounds([[o.lng - dLng, o.lat - dLat], [o.lng + dLng, o.lat + dLat]], { padding: framePad(), duration: reduced() ? 0 : 700 }), 60);
}
viewEl.addEventListener('click', e => {
  const sr = e.target.closest('[data-search]'); if (sr) { searchFor(sr.dataset.search); return; }
  const mo = e.target.closest('[data-mo]'); if (mo) { pickMonth(+mo.dataset.mo); return; }
  const gp = e.target.closest('[data-part]'); if (gp) { const P = PARTS[gp.dataset.part]; if (P) setView(P[0], false, gp.dataset.part); return; }
  const sg = e.target.closest('[data-sig]'); if (sg) { openSignal(sg.dataset.sig); return; }
  const dc = e.target.closest('[data-doc]'); if (dc) { takeAway(dc.dataset.doc); return; }
  if (e.target.closest('a[href]')) return;
  const tr = e.target.closest('[data-tribe]'); if (tr) { selectTribe(tr.dataset.tribe); return; }
  const b = e.target.closest('[data-id]'); if (b) { const v = b.dataset.id; select(/^\d+$/.test(v) ? +v : v); }
});
/* the rail keeps one flag: something hurt, dead or lost right now */
function flags() { const f = $$('#rail .flag'); if (f[0]) f[0].hidden = !alarmsNow().length; }

/* ───────── NOW ───────── */
const HORIZON = { f: 'FORECAST', m: 'MODELLED', p: 'NO OUTLOOK YET' };
/* the next unseasonable stretch, and the days until it lands */
function nextWindow() {
  const k0 = nowK(); let best = null;
  for (const w of OUT.windows) { const r = windowRun(w, k0); if (r && (!best || r.a < best.a)) best = { ...r, start: monthStart(r.a), now: r.a === k0 }; }
  return best;
}
/* twelve months as a strip: each a bar in its degree of orange; the three chosen stand forward */
function monthStrip() {
  const ks = [...Array(OUT_N).keys()]; const now = nowK();
  const span = k => k >= S.mo && k < S.mo + 3;
  const wins = OUT.windows.map(w => { const a = ks.find(k => inWin(w, outMonth(k).m)); let b = a; while (b + 1 < OUT_N && inWin(w, outMonth(b + 1).m)) b++; return { ...w, ka: a, kb: b }; }).filter(w => w.ka != null);
  return `<div class="mstrip" style="--n:${OUT_N}">`
    + `<div class="ms-m" role="group" aria-label="Months">${ks.map(k => { const Mo = outMonth(k); return `<button type="button" class="mo d${Mo.lv} h${Mo.h}${span(k) ? ' on' : ''}${k === now ? ' now' : ''}" data-mo="${k}" aria-pressed="${k === S.mo}" data-tip="${MON[Mo.m]} ${Mo.y} · ${DEG[Mo.lv]} · ${HORIZON[Mo.h]}"><i></i><b class="mono">${MON[Mo.m].charAt(0)}</b></button>`; }).join('')}</div>`
    + `<div class="ms-w">${wins.map((w, i) => `<span class="mono" style="grid-column:${w.ka + 1} / ${w.kb + 2};grid-row:${i + 1}" data-tip="${esc(w.why)}">${w.w}</span>`).join('')}</div>`
    + `</div>`;
}
function bindOutlook() {
  const st = $('#sec-heat .ms-m'); if (!st) return;
  st.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); pickMonth(S.mo + d); const b = $(`#sec-heat [data-mo="${S.mo}"]`); if (b) b.focus(); });
}
const heroesRanked = () => [...S.heroes].map(o => ({ o, deg: degOf(o), w: whenOf(o) })).sort((a, b) => b.deg - a.deg || (b.o.n - a.o.n));
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
/* every kind of life the months ahead reach, us among them: each kind's mark over its danger in the months chosen */
const KIND_LINE = ['flyingfox', 'bird', 'possum', 'bat', 'frog', 'turtle', 'lizard', 'bee', 'butterfly', 'aquatic', 'plant', 'human'];
const KIND_IC = { aquatic: 'Actinopterygii', possum: 'Mammalia', bat: 'Mammalia', flyingfox: 'Mammalia' };
function kindDeg(g) {
  if (g === 'human') return degOf({ id: 'kind:human', hum: true, kind: 'need', lat: S.scan.lat, lng: S.scan.lng });
  const fe = FIELD.find(f => f.g === g && f.st !== 'I') || FIELD.find(f => f.g === g);
  return degOf({ id: 'kind:' + g, g, lat: S.scan.lat, lng: S.scan.lng, tx: { id: null, n: fe ? fe.n : '', cn: fe ? fe.cn : '', ic: KIND_IC[g] || IC_OF_GLYPH[g] || 'Mammalia', na: true } });
}
const kindsRow = () => `<div class="kinds" style="--n:${KIND_LINE.length}" aria-hidden="true">${KIND_LINE.map(g => { const d = kindDeg(g); return `<span class="d${d}${g === 'human' ? ' us' : ''}" data-tip="${esc(M.KINDS[g] || '')} · ${DEG[d]}">${glyphSVG(g)}<i></i></span>`; }).join('')}</div>`;
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
function viewNow() {
  const nw = nextWindow(); const alarms = alarmsNow(); const k0 = S.mo, k1 = Math.min(OUT_N - 1, S.mo + 2);
  const events = [...S.community, ...S.user].filter(o => o.isEvent && liveEvent(o)).sort((a, b) => (isGig(b) - isGig(a)) || (a.start || 0) - (b.start || 0));
  const lvNow = outMonth(nowK()).lv;
  const ex = extremeAhead();
  /* the headline is the act; under it, the time left to act before extreme heat, ticking */
  return `<section class="band" id="sec-heat">
      <div class="b-top"><span class="mono el">${esc(CONFIG.ELNINO)}</span>${degChip(lvNow)}</div>
      <h2 class="b-head">DIRECT ACTION</h2>
      ${ex ? `<div class="b-count${ex.now ? ' now' : ''}" data-tip="${esc(ex.tip)}"><i class="sun d4">${icon('heat')}</i>${ex.now ? '<b class="cd">NOW</b>' : `<b class="cd" data-to="${ex.to}">${countText(ex.to)}</b>`}</div>` : ''}
      ${monthStrip()}
      ${kindsRow()}
      <p class="b-span mono"><b>${monthsWord(outMonth(k0).m, outMonth(k1).m)}</b> · ${HORIZON[outMonth(k0).h]}</p>
      <a class="b-off mono" href="https://emergency.vic.gov.au" target="_blank" rel="noopener">VICEMERGENCY ${icon('out', 'sm')}</a>
    </section>`
    + (alarms.length ? `<section class="sec alarms" id="sec-alarms">${lab('Now', 'red')}<ol class="rows">${alarms.map(alarmRow).join('')}</ol></section>` : '')
    + consSection()
    + `<section class="sec" id="sec-gigs">${lab('Gigs')}${events.length ? `<ol class="rows">${events.map(eventRow).join('')}</ol>` : ''}<p class="gigs mono">${Object.values(GIGS).map(g => `<a href="${esc(g.url)}" target="_blank" rel="noopener" data-tip="${esc(g.n)}">${icon('hug', 'sm')}<span>${esc(g.w)}</span>${icon('out', 'sm')}</a>`).join('')}</p></section>`
    + (S.heroes.length ? `<section class="sec five" id="sec-five">${lab('Five in greatest need')}<ol class="hero-list">${heroesRanked().map(({ o, deg, w }) => `<li><button type="button" class="hero-row" data-id="${esc(o.id)}" data-tip="${esc(o.heroOf.why || o.heroOf.cn)}">${heroPic(o)}<span class="nm"><b>${esc(o.heroOf.cn)}</b><span class="chips">${degChip(deg)}${w ? `<i class="wn${w.now ? ' now' : ''}">${w.now ? 'NOW' : `${daysTo(w.start)} D`}</i>` : ''}</span></span></button></li>`).join('')}</ol></section>` : '');
}

/* ───────── constellations: every string figure, newest first, as it forms; the knots it shares with others ───────── */
const conRow = c => {
  const fresh = Date.now() - (c.t || 0) < 10 * 60e3;
  const sh = (c.shared || []).slice(0, 3).map(x => `<button type="button" class="con-sh" data-con="${esc(String(x.id))}" data-tip="${x.ks.length} shared">${esc(x.name)}</button>`).join('');
  return `<li class="con${fresh ? ' fresh' : ''}"><button type="button" class="con-row" data-con="${esc(String(c.id))}" aria-label="${esc(c.name)}"><span class="con-chart">${strings.chartOf(c.id, 44)}</span><span class="nm"><b>${esc(c.name)}</b><small class="mono"><i class="mk dia"></i>${c.people} <i class="mk dot"></i>${c.lives}${c.water ? ` <i class="mk wav"></i>${c.water}` : ''} · ${c.edges} ${icon('string', 'sm')} · ${ago(c.born)}</small></span></button>`
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

/* ───────── STORIES: the signals board, newest first ───────── */
const THEMES = { heat: 'HEAT', water: 'WATER', pollinate: 'POLLINATORS', diversity: 'DIVERSITY', night: 'NIGHT', food: 'FOOD', circular: 'CIRCULAR', cats: 'CATS' };
/* the board: every slip, this device's and the ones shown to everyone, each with where it has got to */
const sigRow = s => {
  const p = s.pin || {}; const kn = (s.edges || []).length; const st = sentWord(s); const last = linesOf(s).pop() || s.threat || '';
  return `<li><button type="button" class="sig-row${s.ex ? ' ex' : ''}${s.shared ? ' sh' : ''}" data-sig="${esc(s.key)}"><img class="pg" src="${badgeImg({ tone: 'story', g: p.g || 'paw', carried: !s.ex }, 34)}" alt=""><span class="sg"><span class="sg-t"><b class="mono">${esc(s.code)}</b>${esc(last)}</span><small class="mono">${esc((p.cn || p.n || '').toUpperCase())} · ${esc(p.place || '')} · ${ago(s.at)}${kn ? ` · ${kn} ${icon('string', 'sm')}` : ''}${s.recv ? ' · RECEIVED' : ''}${s.ex ? ' · EX' : ''}</small>${st ? `<small class="mono st">${esc(st)}</small>` : ''}</span></button></li>`;
};
function viewStories() {
  const det = ['iNaturalist', 'Field list: sources in field.html', ...OUT.src.map(x => x[0]), 'Canopy: council urban forest strategies; cooling near 40% (Ziter et al., PNAS 2019)', 'City of Melbourne open data', `${IMG.attribution} · AWS Terrain Tiles`, 'OpenStreetMap', 'MapLibre · Poppins · IBM Plex Mono', CONFIG.COUNTRY];
  const sigs = S.signals;
  return `<section class="sec board" id="sec-signals"><div class="lab-row">${lab(`Signals · ${sigs.filter(s => !s.ex).length}`)}<button type="button" class="pill" id="rx-open" aria-expanded="false" data-tip="A code from a slip, or a link">${icon('receive', 'sm')}RECEIVE</button></div>`
      + `<form class="rx" id="rx" hidden><textarea id="rx-t" rows="2" aria-label="A code from a slip, or a link" placeholder="DA-····" spellcheck="false" autocapitalize="characters"></textarea><button type="submit" class="ib" aria-label="Receive">${icon('check')}</button></form>`
      + `<ol class="sigs">${sigs.map(sigRow).join('')}</ol></section>`
    + `<section class="sec tools" id="sec-tools">${lab('Tools')}<div class="tool-pair">`
      + `<a class="tool" href="field.html" target="_blank" rel="noopener"><span class="tool-art" id="art-field" aria-hidden="true"></span><b>Field list</b><small class="mono">${FIELD.length}</small><i class="go">${icon('out')}</i></a>`
      + `<a class="tool" href="guide.html" target="_blank" rel="noopener"><span class="tool-art" id="art-guide" aria-hidden="true"></span><b>Guide</b><i class="go">${icon('out')}</i></a>`
      + `</div><div class="docs">${[['blank', 'print', 'BLANK SLIP', 'A blank W.I.S.H. slip to fill by hand'], ['signals', 'download', 'SIGNALS', 'CSV'], ['field', 'download', 'FIELD LIST', 'CSV'], ['briefs', 'download', 'BRIEFS', 'CSV'], ['places', 'download', 'PLACES', 'CSV: the places listed by name']].map(([k, ic, w, tip]) => `<button type="button" data-doc="${k}" data-tip="${esc(tip)}">${icon(ic)}<span>${w}</span></button>`).join('')}</div>`
      + packSection()
      + `</section>`
    + `<details class="sec" id="sec-briefs"><summary>${lab(`Briefs · ${BRIEFS.length}`)}</summary><ol class="briefs">${BRIEFS.map(b => `<li><a href="${esc(b.url)}" target="_blank" rel="noopener" data-tip="${esc(cap(b.fact))}"><span class="bn mono">${b.id.slice(1)}</span><span class="nm"><b>${esc(b.t)}</b><small class="mono">${esc(b.after.toUpperCase())} · ${esc((b.city || '').toUpperCase())}${b.yr ? ` ${b.yr}` : ''} · ${THEMES[b.th] || ''}</small></span>${icon('out', 'sm')}</a></li>`).join('')}</ol></details>`
    /* the groups already caring for ground here: small, each opens its patch and its site */
    + `<section class="sec groups" id="sec-groups">${lab('Groups')}<ol class="tribes-s">${S.tribes.map(t => `<li><button type="button" class="row" data-tribe="${esc(t.id)}" data-tip="${esc(t.w)}"><i class="patch" style="--c:${(C.tribe[t.kind] || C.tribe.park)}"></i><b>${esc(t.n)}</b></button></li>`).join('')}</ol></section>`
    + `<section class="sec" id="sec-set">${lab('Settings')}<div class="set"><button type="button" class="tog lb" id="ix-sound" aria-pressed="${!!prefs.sound}">${icon('sound')}<small>SOUND</small></button><button type="button" class="tog lb" id="ix-motion" aria-pressed="${!!prefs.motion}">${icon('motion')}<small>MOTION</small></button><button type="button" class="tog lb" id="ix-areas" aria-pressed="${!!prefs.areas}" data-tip="Search areas for animals lost">${icon('lost')}<small>AREAS</small></button><button type="button" class="tog lb" id="ix-printers" aria-pressed="${!!prefs.printers}" data-tip="W.I.S.H. printers at partner places, on the map">${icon('receipt')}<small>PRINTERS</small></button>${HIDE.size ? `<button type="button" class="tog" id="ix-hidden" data-tip="Show every hidden cell again">${icon('hide')}<small>${HIDE.size} HIDDEN</small></button>` : ''}<label class="sig">${icon('sign')}<input id="ix-sign" type="text" maxlength="40" aria-label="Your name" placeholder="Name" value="${esc(S.me.by)}"></label></div></section>`
    + `<details class="sec" id="sec-src"><summary>${lab('Sources')}</summary><ul class="det">${det.map(v => `<li>${esc(v)}</li>`).join('')}</ul></details>`;
}
function openReceive(on) { const f = $('#rx'), b = $('#rx-open'); if (!f) return; f.hidden = !on; b.setAttribute('aria-expanded', String(on)); if (on) setTimeout(() => $('#rx-t').focus(), 30); }
function bindStories() {
  const art = (id, list) => { const host = $('#' + id); if (host) host.innerHTML = list.map(b => `<img src="${badgeImg(b, 30)}" alt="">`).join(''); };
  art('art-field', ['bird', 'possum', 'bee', 'orb', 'lizard', 'frog', 'moth', 'turtle'].map(g => ({ tone: M.toneOf(g), g })));
  art('art-guide', [{ tone: 'k-mammal', g: 'flyingfox', dz: 3 }, { tone: 'injured', g: 'possum' }, { tone: 'lost', g: 'dog' }, { tone: 'event', i: 'hug' }, { tone: 'story', g: 'bee', carried: true }, { tone: 'need', i: 'shade' }, { tone: 'flora', g: 'plant' }, { tone: 'dead', g: 'bird' }]);
  $('#rx-open').addEventListener('click', () => { openReceive($('#rx').hidden); tick(1500); });
  $('#rx').addEventListener('submit', e => { e.preventDefault(); const t = $('#rx-t').value.trim(); if (!t) { nudge($('#rx-t')); return; } receive(t); });
  $('#ix-sound').addEventListener('click', e => { prefs.sound = !prefs.sound; e.currentTarget.setAttribute('aria-pressed', String(prefs.sound)); savePrefs(); tick(); });
  $('#ix-motion').addEventListener('click', e => { prefs.motion = !prefs.motion; e.currentTarget.setAttribute('aria-pressed', String(prefs.motion)); savePrefs(); document.documentElement.classList.toggle('still', !prefs.motion); life.data(); tick(); });
  $('#ix-areas').addEventListener('click', e => { prefs.areas = !prefs.areas; e.currentTarget.setAttribute('aria-pressed', String(prefs.areas)); savePrefs(); life.redraw(); tick(); });
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
