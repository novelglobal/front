
/* ════════════════════════════════════════════════════════════════════
   THE CARD — the photograph large, the name, what El Niño does to this life and how long until it lands,
   something to learn, the strings tied so far and a note. W.I.S.H. is a praxis poem, in three steps, one button each:
   NOTICED is the intention to respond, and turns the card over to the W.I.S.H.; RESPONSE is the W.I.S.H. itself, taking on
   responsibility, theory joined to action and reflection, issued as a slip; DIRECT ACTION makes it a pledge, printed as a
   receipt at a partner place, sent by mesh, and kept on novel.global.
   ════════════════════════════════════════════════════════════════════ */
const rec = $('#record'), rScroll = $('#r-scroll'), heroBtn = $('#r-act'), altBtn = $('#r-alt');
/* the four lines, and what each one asks for */
const WISH = { w: ['What we know', 'The evidence: news, data, a theory'], i: ['It would be great', 'The belief: what should be true'], s: ["So let's create", 'The principle to work by'], h: ['Here is how it works', 'The tactic: what someone does'] };
/* a record opened from the bare map closes back to the bare map; one opened from a page closes back to that page */
function openRecord() {
  if (!S.open) { S.from = 'map'; setOpen(true); } else if (rec.hidden) S.from = 'view';
  rec.hidden = false; viewEl.hidden = true; document.body.classList.add('rec'); stopHeroes();
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', 'false'));
  rScroll.scrollTop = 0; life.placeHandle(); life.moved();
}
/* how: nothing (back to where it came from), 'switch' (another record follows), 'view' (a page replaces it) */
function closeRecord(how) {
  S.sel = null; S.mode = null; S.place = null; S.tribeSel = null; S.partnerSel = null; S.sig = null; S.issued = null;
  strings.close(); document.body.classList.remove('placing'); $('#radius').hidden = true;
  if (how === 'switch') return;
  const from = S.from; S.from = null;
  rec.hidden = true; viewEl.hidden = false; document.body.classList.remove('rec'); life.data();
  if (!how) { if (from === 'map') setOpen(false); else { renderView(); $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === S.view))); } }
  try { history.replaceState(null, '', S.open ? '#' + VIEWS[S.view].k : location.pathname + location.search); } catch (e) { /* file:// */ }
}
function goBack() {
  if (face === 'wish' || (face === 'signal' && S.mode === 'ping')) { showFace('front'); tick(1100); return; }
  if (face === 'place') { cancelPlace(); return; }
  tick(900); closeRecord();
}
$('#r-back').addEventListener('click', goBack);
$('#r-x').addEventListener('click', () => { if (S.mode === 'place') { cancelPlace(); return; } tick(800); closeRecord(); });
addEventListener('keydown', e => { if ((e.key === 'Delete' || e.key === 'Backspace') && S.mode === 'ping' && String(strings.peeked || '').startsWith('k:') && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); strings.removeKnot(strings.peeked); return; } if (e.key !== 'Escape') return; if (S.mode === 'ping' && strings.focus) { strings.unfocus(); fillLedger(); return; } if (S.mode === 'ping' && (strings.peeked || strings.ghost)) { e.preventDefault(); strings.unpeek(); tick(900); return; } if (S.mode) { e.preventDefault(); goBack(); } else if (S.open) setOpen(false); });

let face = 'front', flipping = null;
/* front to slip and back turn the card over; everything else arrives as a wipe */
function showFace(f) {
  if (f !== face && f !== 'front' && typeof strings !== 'undefined' && strings.peeked) strings.unpeek();
  const turn = !reduced() && face !== f && ['front', 'wish', 'signal'].includes(face) && ['front', 'wish', 'signal'].includes(f) && !rec.hidden;
  if (turn && rec.animate) {
    const dir = f === 'front' ? 1 : -1; if (flipping) flipping.cancel();
    const a = rec.animate([{ transform: 'perspective(1600px) rotateY(0deg)' }, { transform: `perspective(1600px) rotateY(${90 * dir}deg)` }], { duration: 170, easing: 'cubic-bezier(.5,0,1,.5)' }); flipping = a;
    /* the new face is painted at the half-turn; if the browser holds the animation back, a timer paints it anyway */
    const done = () => { if (flipping !== a) return; flipping = null; paintFace(f); rec.animate([{ transform: `perspective(1600px) rotateY(${-90 * dir}deg)` }, { transform: 'perspective(1600px) rotateY(0deg)' }], { duration: 230, easing: 'cubic-bezier(0,.5,.5,1)' }); };
    a.onfinish = done; setTimeout(done, 280);
    face = f; return;
  }
  paintFace(f, true);
}
const heroWord = (ic, w) => { heroBtn.innerHTML = `<span class="hw">${w}</span>${icon(ic)}`; heroBtn.setAttribute('aria-label', cap(w.toLowerCase())); };
const altWord = (ic, w) => { altBtn.innerHTML = `<span class="mono">${w}</span>${icon(ic)}`; };
function paintFace(f, wipe) {
  face = f; for (const [k, id] of [['front', 'r-front'], ['wish', 'r-wish'], ['signal', 'r-signal'], ['place', 'r-place']]) { const el = $('#' + id); el.hidden = k !== f; if (k === f && wipe) { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); } }
  rec.dataset.face = f; rScroll.scrollTop = 0; document.body.classList.toggle('placing', f === 'place');
  const o = S.mode === 'ping' ? S.byId.get(S.sel) : null; const tel = f === 'front' && o && (o.kind === 'injured' || o.kind === 'dead') ? telOf(o) : '';
  const lost = f === 'front' && o && o.kind === 'lost';
  altBtn.hidden = true; heroBtn.hidden = false; rec.classList.toggle('alarm', !!tel || lost); heroBtn.classList.remove('go'); altBtn.classList.add('go');
  if (f === 'wish') heroWord('receipt', 'RESPONSE');
  else if (f === 'signal') heroWord('print', 'DIRECT ACTION');
  else if (f === 'place') { heroWord('check', 'PLACE'); altWord('next', 'NOTICED'); altBtn.hidden = false; }
  else if (S.mode === 'tribe') heroWord('out', 'JOIN');
  else if (S.mode === 'partner') heroWord('out', 'VISIT');
  else if (tel) { heroWord('phone', o.kind === 'dead' ? 'REPORT' : 'CALL'); altWord('next', 'NOTICED'); altBtn.hidden = false; }
  else if (lost) { heroWord('lost', 'SEARCH'); altWord('next', 'NOTICED'); altBtn.hidden = false; }
  else { heroWord('next', 'NOTICED'); heroBtn.classList.add('go'); }
  if (f === 'wish' && !coarse()) setTimeout(() => { const t = WKEYS.map(k => $('#w-' + k)).find(x => !x.value); if (t) t.focus({ preventScroll: true }); }, 380);
  /* the way out is always the first thing in the bar */
  $('#r-back').classList.toggle('cancel', f === 'place'); $('#r-back').setAttribute('aria-label', f === 'place' ? 'Cancel' : 'Back');
  const o2 = S.mode === 'ping' ? S.byId.get(S.sel) : null; $('#r-hide').hidden = !(f === 'front' && o2 && !o2.hero);
  if (o2) $('#r-hide').dataset.tip = o2.user ? 'Delete' : 'Hide from the map';
  $('#r-note').hidden = f !== 'front' || S.mode !== 'ping';
}

/* ───────── opening ───────── */
/* opt.sig: a story, opened on its slip; its strings stand on the ground until the cell has a figure of its own.
   opt.cell: a story's cell opened on its card, not its slip */
function select(id, opt = {}) {
  const o = S.byId.get(id); if (!o) return;
  if (o.story && !opt.sig && !opt.cell) { openSignal(o.story); return; }
  const was = S.sel; if (S.mode) closeRecord('switch'); S.sel = id; S.mode = 'ping'; S.place = null; S.tribeSel = null; S.sig = opt.sig ? opt.sig.key : null; S.issued = opt.sig || null;
  strings.open(o, opt.sig); openRecord();
  if (S.mapReady) map.easeTo({ center: [o.lng, o.lat], zoom: Math.max(map.getZoom(), 15.4), offset: sheetOffset(), duration: reduced() ? 0 : 700 });
  life.hover(null); life.select();
  fillFront(o);
  if (opt.sig) { fillSignal(opt.sig); showFace('signal'); } else showFace('front');
  if (was !== id) { snd.tick(1900); buzz(6); }
  if (!o.ob) placesAround(o.lat, o.lng, rangeOf(o) + 80);
  try { history.replaceState(null, '', '#' + (opt.sig ? opt.sig.code : hashOf(o) || '')); } catch (e) { /* file:// */ }
}
function refreshRecord() {
  if (S.mode === 'ping') { const o = S.byId.get(S.sel); if (!o) return; if (face === 'front') fillFront(o, true); else if (face === 'wish') fillKnots(); }
  else if (S.mode === 'tribe') { const t = S.byId.get(S.tribeSel); if (t) fillTribe(t, true); }
  else if (S.mode === 'partner') { const p = partnerOf(S.partnerSel); if (p) fillPartner(p, true); }
  life.placeHandle();
}
/* a group already caring for a patch of ground */
function selectTribe(id) {
  const t = S.byId.get(id); if (!t || !t.isTribe) return;
  if (S.mode) closeRecord('switch');
  S.tribeSel = id; S.sel = null; S.mode = 'tribe'; S.place = null; S.sig = null; strings.close();
  openRecord();
  if (S.mapReady) { const la = t.blobs.map(b => b[0]), lo = t.blobs.map(b => b[1]); map.fitBounds([[Math.min(...lo) - 0.002, Math.min(...la) - 0.002], [Math.max(...lo) + 0.002, Math.max(...la) + 0.002]], { padding: framePad(), duration: reduced() ? 0 : 700, maxZoom: 16 }); }
  life.hover(null); life.select(); fillTribe(t); showFace('front'); snd.tick(1700);
  try { history.replaceState(null, '', '#' + t.tid); } catch (e) { /* file:// */ }
}

/* ───────── a partner place: its W.I.S.H. printer, whether it is listening, and the stories sent there ───────── */
function selectPartner(id) {
  const p = partnerOf(id); if (!p) return;
  if (S.mode) closeRecord('switch');
  S.partnerSel = id; S.sel = null; S.tribeSel = null; S.mode = 'partner'; S.place = null; S.sig = null; strings.close();
  openRecord();
  if (S.mapReady) map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 16), offset: sheetOffset(), duration: reduced() ? 0 : 700 });
  life.hover(null); life.select(); fillPartner(p); showFace('front'); snd.printer(420);
  loadPartners().then(() => { if (S.mode === 'partner' && S.partnerSel === id) fillPartner(p, true); });
  try { history.replaceState(null, '', '#P-' + id); } catch (e) { /* file:// */ }
}
function fillPartner(p, quiet) {
  const st = PSTATE[p.id] || {};
  $('#r-no').textContent = 'PARTNER · W.I.S.H. PRINTER'; $('#r-name').textContent = p.n; $('#r-latin').textContent = [p.addr, title(p.sub)].filter(Boolean).join(', ');
  if (!quiet) drawPrinterFigure(p, st);
  $('#r-chips').innerHTML = chip(st.ready ? 'PRINTER ONLINE' : p.printer ? 'PRINTER NOT YET ONLINE' : 'QUEUE', st.ready ? 'tb' : 'off') + (st.queued ? chip(`${st.queued} IN QUEUE`) : '') + (st.printed ? chip(`${st.printed} PRINTED`) : '') + chip(esc(p.paper + ' MM'), 'at') + (p.url ? `<a class="c lk" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(hostOf(p.url))} ${icon('out', 'sm')}</a>` : '');
  $('#r-chips').style.removeProperty('--c');
  $('#r-threat').hidden = true; $('#r-season').hidden = true; $('#r-ledger').hidden = true; $('#r-do').innerHTML = '';
  $('#r-learn').textContent = p.what || ''; $('#r-learn').hidden = !p.what;
  const sent = S.signals.filter(s => s.dest === p.id || ((SENT[s.code] || {}).dest === p.id));
  $('#r-strings').innerHTML = sent.length ? `<details class="reach" open><summary class="mono">SENT HERE · ${sent.length}</summary><ol>${sent.slice(0, 40).map(s => `<li><button type="button" class="nrow" data-sig="${esc(s.key)}"><img class="pg sm" src="${badgeImg({ tone: 'story', g: (s.pin || {}).g || 'paw', carried: true }, 30)}" alt=""><span class="n">${esc(s.code)} · ${esc(((s.pin || {}).cn || '').toUpperCase())}</span><small class="mono">${esc(sentWord(s).split(' · ')[0])}</small></button></li>`).join('')}</ol></details>` : '';
  $('#r-strings').hidden = !sent.length;
}
/* the printer, large, with a slip feeding out of it */
function drawPrinterFigure(p, st) {
  const cv = $('#r-glyph'), img = $('#r-img'); img.hidden = true; cv.hidden = false; $('#r-fig').classList.add('loaded'); $('#r-fig').classList.remove('alarm'); $('#r-credit').textContent = '';
  const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#E3F7F4'; x.fillRect(0, 0, cv.width, cv.height);
  M.printer(x, cv.width / 2, cv.height * 0.62, cv.height * 0.62, 0, !!st.ready);
}

/* ───────── hiding: any cell can leave the map on this device; a record placed here is deleted ───────── */
function toastUndo(msg, fn) { const t = $('#toast'); toast(msg, 4500); t.innerHTML = `<span>${esc(msg)}</span><button type="button">UNDO</button>`; t.querySelector('button').onclick = () => { fn(); t.hidden = true; tick(1600); }; }
function hideCell(id) {
  const o = S.byId.get(id); if (!o || o.hero) return;
  if (S.mode === 'ping' && S.sel === id) closeRecord();
  snd.snap(0); buzz(8);
  if (o.user && o.ev) { ledgerAdd({ type: 'redact', ref: o.ev.key }).then(ev => toastUndo('DELETED', () => { ledger.local = ledger.local.filter(e => e.key !== ev.key); store.set('da.ledger.v4', ledger.local); derive(); refresh(); })); return; }
  setHidden(id, true); life.data(); if (S.mode === 'ping') strings.refresh(); refreshPanel();
  toastUndo('HIDDEN', () => { setHidden(id, false); life.data(); if (S.mode === 'ping') strings.refresh(); refreshPanel(); });
}
$('#r-hide').addEventListener('click', () => { if (S.sel != null) hideCell(S.sel); });
/* ───────── the five: each can be changed to any life seen here or listed, or one of your own ───────── */
const guessGlyph = q => { for (const [re, g] of NAME_GLYPH) if (re.test(q)) return g; return 'paw'; };
function fiveOptions() {
  const m = new Map();
  for (const x of [...S.obs, ...S.hist]) { const t = x.tx; if (!t || !t.n || x.hum || !t.cn) continue; const k = t.n.toLowerCase(); if (!m.has(k)) m.set(k, { n: t.n, cn: t.cn, ic: t.ic, th: !!t.th, g: glyphOf(x), seen: 0 }); m.get(k).seen++; }
  for (const f of FIELD) { const k = f.n.toLowerCase(); if (!m.has(k)) m.set(k, { n: f.n, cn: f.cn.replace(/\s*\(.*\)$/, ''), ic: IC_OF_GLYPH[f.g] || 'Mammalia', th: f.st === 'T', g: f.g, seen: 0 }); }
  return [...m.values()];
}
function fiveResults(q) {
  const qq = norm(q); const all = fiveOptions(); const list = (qq ? all.filter(x => norm(`${x.cn} ${x.n}`).includes(qq)) : all.sort((a, b) => b.seen - a.seen)).slice(0, 8);
  const own = q.trim() && !list.some(x => norm(x.cn) === qq) ? { n: q.trim(), cn: cap(q.trim()), ic: IC_OF_GLYPH[guessGlyph(q)] || 'Animalia', g: guessGlyph(q), own: true } : null;
  $('#five-r').innerHTML = [...list, ...(own ? [own] : [])].map(x => `<li><button type="button" class="nrow" data-pick="${esc(JSON.stringify(x))}">${glyphSVG(x.g)}<span class="n">${esc(x.cn)}</span><small class="mono">${x.own ? 'YOUR OWN' : x.seen ? `${x.seen} SEEN` : ''}</small></button></li>`).join('');
}
function openFive(slot) {
  const el = $('#r-five'); if (!el.hidden && +el.dataset.slot === slot) { el.hidden = true; tick(1100); return; }
  el.dataset.slot = slot; el.hidden = false; tick(1600);
  el.innerHTML = `<input id="five-q" type="search" placeholder="Species" aria-label="Species" autocomplete="off"><ol id="five-r"></ol>${(store.get('da.five.v1', [])[slot] || null) ? '<button type="button" class="pill quiet" data-five-reset>RESET</button>' : ''}`;
  const q = $('#five-q'); q.addEventListener('input', debounce(() => fiveResults(q.value), 120)); fiveResults(''); if (!coarse()) q.focus();
}
$('#r-chips').addEventListener('click', e => { const b = e.target.closest('[data-five]'); if (b) openFive(+b.dataset.five); });
$('#r-five').addEventListener('click', e => {
  const slot = +$('#r-five').dataset.slot; const pick = e.target.closest('[data-pick]'); const reset = e.target.closest('[data-five-reset]'); if (!pick && !reset) return;
  if (reset) setFive(slot, null); else { const x = JSON.parse(pick.dataset.pick); setFive(slot, { n: x.n, cn: x.cn, ic: x.ic, th: !!x.th, g: x.g }); }
  snd.pluck(0.3, 0); buzz(8); const h = S.heroes.find(o => o.slot === slot); refresh(); if (h) select(h.id);
});

/* ───────── the picture: the photograph, large; or the thing itself, large, on its own colour ───────── */
const TONE_BG = { fauna: C.cobalt, night: C.navy, flora: C.tealDeep, event: C.navy, need: '#F1F3F2', offer: C.navy, injured: C.red, dead: C.black, lost: '#F1F3F2', story: C.cobalt, cold: '#9AA39D', hist: '#9AA39D' };
function figure(o) {
  const img = $('#r-img'), cv = $('#r-glyph'), cr = $('#r-credit'), fig = $('#r-fig'); const sub = o && !o.isTribe ? subjectOf(o) : null;
  img.hidden = true; cv.hidden = true; cr.textContent = ''; fig.classList.toggle('alarm', isAlarm(o)); fig.dataset.kind = o.kind || ''; fig.classList.remove('loaded');
  const own = o && !o.isTribe ? o.photo || (sub && sub.photo) : null;
  const show = () => { img.hidden = false; requestAnimationFrame(() => fig.classList.add('loaded')); };
  if (own) { img.onload = show; img.onerror = null; img.alt = nameOf(o); img.src = own; if (img.complete && img.naturalWidth) show(); cr.textContent = o.who ? `© ${o.who}` : ''; return; }
  if (sub && sub.ph && licOpen(sub.ph.l)) {
    img.alt = nameOf(o); img.onload = show; img.onerror = () => { if (!img.src.includes('/medium.')) img.src = photoURL(sub.ph.u, 'medium'); else { img.hidden = true; drawFigure(o); } };
    img.src = photoURL(sub.ph.u, 'large'); if (img.complete && img.naturalWidth) show();
    cr.textContent = sub.ph.a || licLabel(sub.ph.l); return;
  }
  drawFigure(o);
  if (sub && sub.ph && typeof sub.id === 'number') cr.innerHTML = `<a href="${CONFIG.INAT_WEB}${sub.id}" target="_blank" rel="noopener">© ${esc(sub.u.n || sub.u.l || '')}</a>`;
  /* no photograph of this one open to show: the photograph of its kind, when there is one, credited as such */
  const tid = !o.isTribe && sub && sub.tx && sub.tx.id; if (!tid) return;
  taxonInfo(tid).then(v => {
    if (!v || !v.ph || S.sel !== o.id || !img.hidden) return;
    img.alt = nameOf(o); img.onerror = null; img.onload = () => { if (S.sel !== o.id) return; cv.hidden = true; show(); life.redraw(); };
    img.src = photoURL(v.ph.u, 'medium'); cr.textContent = `ITS KIND · ${v.ph.a || licLabel(v.ph.l)}`;
  });
}
function drawFigure(o) {
  const cv = $('#r-glyph'); cv.hidden = false; $('#r-fig').classList.add('loaded'); const x = cv.getContext('2d'); const w = cv.width, h = cv.height; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
  if (o.isTribe) {   /* the patch itself, as it lies on the ground */
    const col = C.tribe[o.kind] || C.tribe.park; x.fillStyle = '#F1F3F2'; x.fillRect(0, 0, w, h);
    const la = o.blobs.map(b => b[0]), lo = o.blobs.map(b => b[1]); const a0 = Math.min(...la), a1 = Math.max(...la), b0 = Math.min(...lo), b1 = Math.max(...lo);
    const kx = 111320 * Math.cos(a0 * Math.PI / 180), ky = 110540; const W0 = (b1 - b0) * kx + 400, H0 = (a1 - a0) * ky + 400; const k = Math.min(w / W0, h / H0) * 0.9;
    x.save(); x.globalAlpha = 0.85; x.fillStyle = col; x.beginPath();
    for (const [a, b, r] of o.blobs) { const px = w / 2 + ((b - (b0 + b1) / 2) * kx) * k, py = h / 2 - ((a - (a0 + a1) / 2) * ky) * k; life.blob(x, px, py, Math.max(2, r * k), ((a * 7919 + b * 104729) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)); }
    x.fill(); x.restore(); return;
  }
  const b = life.badgeOf(o, 40);
  const bg = /^k-/.test(b.tone) ? C.kind[b.tone.slice(2)] : TONE_BG[b.tone] || C.cobalt; const fg = b.tone === 'dead' ? C.red : bg === '#F1F3F2' ? C.navy : C.white;
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  if (o.kind === 'lost') { x.save(); x.setLineDash([18, 14]); x.lineWidth = 6; x.strokeStyle = C.red; x.beginPath(); x.arc(w / 2, h / 2, h * 0.42, 0, Math.PI * 2); x.stroke(); x.restore(); }
  if (o.kind === 'dead') { x.strokeStyle = C.red; x.lineWidth = 8; x.beginPath(); x.arc(w / 2, h / 2, h * 0.4, 0, Math.PI * 2); x.stroke(); }
  if (b.g) M.glyph(x, b.g, w / 2, h / 2, h * 0.62, fg); else if (b.i) M.icon(x, b.i, w / 2, h / 2, h * 0.5, fg, 1.4);
}

/* ───────── the front ───────── */
const TAG_WORDS = { sound: 'SOUND', nature: 'NATURE', free: 'FREE', 'first-nations': 'FIRST NATIONS-LED', h5: 'BIRD FLU WATCH', refuge: 'COOL ROOM', kids: 'ALL AGES', walk: 'WALK' };
const chip = (t, cls = '', tip = '') => `<i class="c ${cls}"${tip ? ` data-tip="${esc(tip)}"` : ''}>${t}</i>`;
const live = o => !o.hist && !o.isEvent && !(o.hum && !(subjectOf(o).tx && subjectOf(o).tx.n) && o.kind !== 'need' && o.kind !== 'pulse');
/* a kind of life, whatever the record's age: its threat, its season, something to learn */
const kindLife = o => { if (o.isEvent || o.isTribe) return false; const sub = subjectOf(o); return !!(sub.tx && sub.tx.n) || !!o.g; };
function fillFront(o, quiet) {
  const sub = subjectOf(o); const L = live(o);
  $('#r-no').textContent = o.hero ? `${o.slot + 1} / ${HEROES.length} · IN GREATEST NEED` : `No. ${codeOf(o)}`;
  $('#r-name').textContent = nameOf(o);
  $('#r-latin').innerHTML = sub.tx && sub.tx.cn && sub.tx.n && sub.tx.cn !== sub.tx.n ? `<i>${esc(sub.tx.n)}</i>` : '';
  if (!quiet) figure(o);
  /* the chips: danger, when it lands, young, status, when and where it was seen */
  const dg = L && !isCold(o) ? degOf(o) : 0; const w = L && !isAlarm(o) ? whenOf(o) : null; const y = L && !isAlarm(o) ? youngOf(o) : null;
  const seenAt = o.hero ? (o.curated ? 'KNOWN SITES' : `${o.n} PAST SIGHTINGS`) : o.isEvent && o.start ? `${dayWord(o.start)} · ${fmtClock(o.start)}` : o.hist ? `${dayMonth(o.d)} ${String(o.d).slice(0, 4)}` : `${o.t ? fmtClock(o.t) + ' · ' : o.at && (o.comm || o.user) ? fmtClock(o.at) + ' · ' : ''}${o.d ? dayMonth(o.d) : ''}`;
  const st = sub.tx && !o.hum ? (sub.tx.th ? 'THREATENED' : sub.tx.intro ? 'INTRODUCED' : sub.tx.na ? 'NATIVE' : '') : '';
  const voice = (sub.so && sub.so.u) || o.sound;
  $('#r-chips').innerHTML = [
    dg ? chip(DEG[dg], `dg d${dg}`, 'Danger in the months ahead') : '',
    w ? chip(`${w.now ? 'NOW' : `${daysTo(w.start)} D`} · ${esc(w.w)}`, `wn${w.now ? ' now' : ''}`, w.why) : '',
    y ? chip(y.now ? 'YOUNG NOW' : `YOUNG · ${MON[y.m]}`, 'yg', 'When its young are due') : '',
    st ? chip(st, st === 'THREATENED' ? 'th' : '') : '',
    chip(esc([seenAt, placeOf(o)].filter(Boolean).join(' · ')), 'at'),
    o.n > 1 && !o.hero ? chip(`×${o.n}`) : '',
    typeof o.id === 'number' ? `<a class="c lk" href="${CONFIG.INAT_WEB}${o.id}" target="_blank" rel="noopener" data-tip="iNaturalist">iNat ${icon('out', 'sm')}</a>` : sub.tx && sub.tx.id ? `<a class="c lk" href="${CONFIG.INAT_TAXA}${sub.tx.id}" target="_blank" rel="noopener" data-tip="iNaturalist">iNat ${icon('out', 'sm')}</a>` : '',
    voice ? `<button type="button" class="c play" data-u="${esc(voice)}" aria-label="Play the call">${icon('play')}</button>` : '',
  ].join('');
  if (o.user && o.said && nameOf(o) !== o.said) $('#r-chips').insertAdjacentHTML('afterbegin', `<q class="said">${esc(o.said)}</q>`);
  if (o.hero) $('#r-chips').insertAdjacentHTML('beforeend', `<button type="button" class="c swap" data-five="${o.slot}" data-tip="Change this one">${icon('remix', 'sm')}CHANGE</button>`);
  $('#r-five').hidden = true; $('#r-note').value = noteOf(o);
  /* the threat, in a line; the hero's own reason under the pointer */
  const K = live(o) || kindLife(o); const th = K && !isAlarm(o) ? threatOf(o) : '';
  $('#r-threat').innerHTML = th ? `<span>${esc(th)}</span>` : ''; $('#r-threat').hidden = !th; $('#r-threat').className = `r-threat d${dg}`; $('#r-threat').dataset.tip = o.hero ? o.heroOf.why : (w ? w.why : '');
  /* something to learn: the field list's line, else iNaturalist's */
  const learn = K ? learnOf(o) : ''; const lr = $('#r-learn'); lr.textContent = learn ? cap(learn) : ''; lr.hidden = !learn;
  const tid = sub.tx && sub.tx.id; const sl = $('#r-season'); if (!quiet) { sl.innerHTML = ''; sl.hidden = true; }
  if (K && tid && !quiet) {
    if (!learn) taxonInfo(tid).then(v => { if (S.sel !== o.id || !v) return; if (v.sum) { lr.textContent = v.sum; lr.hidden = false; } if (v.cs && !st.includes(v.cs)) $('#r-chips').insertAdjacentHTML('beforeend', chip(esc(v.cs), 'th', 'Conservation status')); });
    seasonOf(tid).then(m => { if (S.sel !== o.id || !m || !m.some(Boolean)) return; sl.innerHTML = season(m); sl.hidden = false; });
  }
  /* who in its radius sells or leaves what harms it, and who can help */
  fillLedger();
  $('#r-do').innerHTML = urgentOf(o) + shareRow(o);
  fillStrings();
}
$('#r-chips').addEventListener('click', e => { const b = e.target.closest('.play'); if (b) life.play(b.dataset.u, b); });
/* the months it is seen here, from iNaturalist, under the outlook's danger */
function season(m) {
  const top = Math.max(...m); const now = new Date().getMonth(); const lvOf = mm => { for (let k = 0; k < OUT_N; k++) { const x = outMonth(k); if (x.m === mm) return x.lv; } return 0; };
  return `<div class="ss" data-tip="Seen here by month · iNaturalist">${m.map((v, i) => `<span class="d${lvOf(i)}${i === now ? ' now' : ''}" style="--i:${i}"><i style="height:${Math.max(4, Math.round(v / top * 100))}%"></i><b class="mono">${MON[i].charAt(0)}</b></span>`).join('')}</div>`;
}
/* only what is urgent or practical: an animal hurt, dead or lost; a gathering's place; a contact */
function urgentOf(o) {
  const fe = fieldOf(o); const L = [];
  const rowA = (ic, b, s, attrs = '', tag = 'a') => `<${tag} class="do" ${attrs}>${icon(ic)}<b>${b}</b>${s ? `<small>${s}</small>` : ''}</${tag}>`;
  if (o.kind === 'injured') { const tel = telOf(o); L.push(rowA('phone', tel === 'tel:1800675888' ? '1800 675 888' : tel === 'tel:136186' ? '136 186' : '(03) 8400 7300', `HURT · ${ago(o.at)}`, `href="${tel}"`)); if (fe && fe.harm) L.push(`<p class="harm">${icon('harm', 'sm')}${esc(cap(fe.harm))}</p>`); }
  if (o.kind === 'dead') { const tel = telOf(o); L.push(tel ? rowA('phone', tel === 'tel:1800675888' ? '1800 675 888' : '136 186', 'DEAD · DO NOT TOUCH', `href="${tel}"`) : rowA('out', 'COUNCIL', 'DEAD · DO NOT TOUCH', `href="${esc((LINKS.find(l => /MERRI-BEK/.test(l[0])) || [])[1] || '')}" target="_blank" rel="noopener"`)); }
  if (o.kind === 'lost') {
    L.push(`<button type="button" class="do tog" data-do="areas" aria-pressed="${!!prefs.areas}">${icon('lost')}<b>SEARCH AREA</b><small>${metres(life.searchOf(o))}</small></button>`);
    const ln = LINKS.find(l => /LOST/.test(l[0]) && (o.lat > -37.7835 ? /MERRI/.test(l[0]) : /MELBOURNE/.test(l[0]))); if (ln) L.push(rowA('out', 'FOUND IT?', ln[0], `href="${ln[1]}" target="_blank" rel="noopener"`));
  }
  if (o.isEvent) L.push(rowA('day', o.venue ? esc(o.venue) : dayWord(o.start), o.start ? `${dayWord(o.start)} · ${fmtClock(o.start)}` : '', o.link ? `href="${esc(o.link)}" target="_blank" rel="noopener"` : '', o.link ? 'a' : 'div'));
  if (o.contact) L.push(rowA(/@/.test(o.contact) ? 'out' : 'phone', esc(o.contact), '', `href="${/@/.test(o.contact) ? 'mailto:' : 'tel:'}${esc(o.contact.replace(/\s/g, ''))}"`));
  return L.join('');
}
/* a record placed here, shared: for everyone once approved; its contact stays on this device */
function shareRow(o) {
  if (!o.user || !o.ev) return ''; const v = SENT['rec:' + o.ev.key];
  const w = !v ? 'FOR EVERYONE · ONCE APPROVED' : v.status === 'shown' ? 'SHOWN TO EVERYONE' : v.status === 'refused' ? 'NOT SHOWN' : v.status === 'outbox' ? 'SENDS WHEN THERE IS A SIGNAL' : 'WAITING FOR APPROVAL';
  return `<button type="button" class="do share" data-do="share"${v ? ' disabled' : ''}>${icon('stories')}<b>${v ? 'SHARED' : 'SHARE'}</b><small>${w}</small></button>`;
}
$('#r-do').addEventListener('click', async e => {
  const b = e.target.closest('[data-do]'); if (!b) return; tick();
  if (b.dataset.do === 'areas') { prefs.areas = !prefs.areas; savePrefs(); b.setAttribute('aria-pressed', String(prefs.areas)); life.redraw(); }
  if (b.dataset.do === 'share') { const o = S.byId.get(S.sel); if (!o) return; b.disabled = true; try { const v = await shareRecord(o); toast(v.status === 'outbox' ? 'NO SIGNAL · IT WILL SEND' : 'SENT · WAITING FOR APPROVAL'); } catch (err) { toast(err.status === 429 ? 'TOO MANY · TRY SOON' : 'NOT SENT'); } if (S.sel === o.id) $('#r-do').innerHTML = urgentOf(o) + shareRow(o); }
});

/* ───────── the strings, on the card: the constellation as it forms, its song, and the print it will make ───────── */
const KNOT_W = { place: 'PLACE', person: 'PERSON', idea: 'IDEA' };
const FAM_W = f => (FAMILIES[f] || {}).w || '';
const KIND_ROW = n => n.t === 'biz' ? `<i class="role${(n.harm || []).length ? ' on' : ''}">${(n.harm || []).length ? (ROLES[n.harm[0]] || {}).w || '' : FAM_W(n.fam) || (ROLES[n.role] || {}).w || ''}</i>` : n.t === 'group' ? '<i class="role">GROUP</i>' : n.t === 'water' ? '<i class="role">WATER</i>' : n.t === 'custom' ? `<i class="role">${KNOT_W[n.kind] || 'KNOT'}</i>` : `<i class="role">${esc((M.KINDS[n.g] || '').toUpperCase())}</i>`;
const nodeMark = n => n.t === 'biz' ? `<i class="fm fm-${esc(n.fam || (ROLES[n.role] || {}).cat || 'service')}${(n.harm || []).length || (n.on && !n.harm) ? ' harm' : ''}${n.tied ? ' tied' : ''}"></i>` : n.t === 'group' ? `<i class="patch" style="--c:${C.tribe[n.kind] || C.tribe.park}"></i>` : n.t === 'water' ? icon('water', 'sm') : n.t === 'custom' ? `<i class="sq${n.tied ? ' tied' : ''}"></i>` : glyphSVG(n.g || 'paw');
function fillStrings() {
  const el = $('#r-strings'); const o = S.byId.get(S.sel); if (!o || S.mode !== 'ping' || o.ob) { el.innerHTML = ''; el.hidden = true; return; }
  const f = strings.fig; const n = f.e.length; const all = strings.reach(); const det = el.querySelector('details'); const open = det ? det.open : false; const pk = strings.peeked;
  const name = n ? strings.nameFor(o, f) : '';
  el.hidden = false;
  el.innerHTML = `<div class="st-bar"><span class="st-n mono" data-tip="Strings">${icon('string')}<b>${n}</b></span>`
    + `<button type="button" class="ib" data-st="playOpen" aria-label="Play" data-tip="Play"${n ? '' : ' disabled'}>${icon('play')}</button>`
    + `<button type="button" class="ib" data-st="trace" aria-label="Trace it" data-tip="How it formed"${n > 1 ? '' : ' disabled'}>${icon('trace')}</button>`
    + `<span class="st-sp"></span>`
    + `<button type="button" class="ib" data-st="undo" aria-label="Undo" data-tip="Undo"${n ? '' : ' disabled'}>${icon('undo')}</button>`
    + `<button type="button" class="ib" data-st="reset" aria-label="Cut all" data-tip="Cut all"${n ? '' : ' disabled'}>${icon('reset')}</button>`
    + `<button type="button" class="ib" data-st="restore" aria-label="Bring back" data-tip="Bring back"${f.prev ? '' : ' disabled'}>${icon('restore')}</button></div>`
    + (n ? `<div class="st-con"><button type="button" class="st-print" data-st="print" aria-label="The print it will make" data-tip="The print it will make"><canvas id="st-print" width="120" height="200"></canvas></button><div class="st-meta"><input class="con-n" id="con-n" value="${esc(name)}" maxlength="48" aria-label="The constellation's name" spellcheck="false"><span class="chart-wrap">${strings.chartOf(o.id, 72)}</span></div></div>` : '')
    + (all.length ? `<details class="reach"${open ? ' open' : ''}><summary class="mono">IN REACH · ${all.length}<span>${metres(rangeOf(o))}</span></summary><ol>${all.slice(0, 160).map(x => `<li><button type="button" class="nrow${x.tied ? ' on' : ''}${x.key === pk ? ' pk' : ''}" data-node="${esc(x.key)}">${nodeMark(x)}<span class="n">${esc(strings.labelOf(x.key) || x.n)}</span>${KIND_ROW(x)}<small class="mono">${metres(x.d)}</small></button><button type="button" class="tie${x.tied ? ' on' : ''}" data-tie="${esc(x.key)}" aria-pressed="${x.tied}" aria-label="${x.tied ? 'Let go' : 'Join'}">${icon(x.tied ? 'close' : 'string', 'sm')}</button></li>`).join('')}</ol></details>` : '');
  if (n) drawMini($('#st-print'), o);
}
$('#r-strings').addEventListener('click', e => {
  const s2 = e.target.closest('[data-st]'); if (s2) { const a = s2.dataset.st; if (a === 'print') { const o = S.byId.get(S.sel); if (o) toWish(o); return; } if (a === 'trace') { strings.traceIt(); fitWeb(); return; } strings[a](); return; }
  const t = e.target.closest('[data-tie]'); if (t) { strings.join(t.dataset.tie); return; }
  const n = e.target.closest('[data-node]'); if (n) { const k = n.dataset.node; if (k === strings.peeked) strings.act(k); else { strings.peek(k); bringIntoView(k); } }
});
$('#r-strings').addEventListener('contextmenu', e => { const n = e.target.closest('[data-node]'); if (!n) return; e.preventDefault(); strings.join(n.dataset.node); });
$('#r-strings').addEventListener('change', e => { if (e.target.id === 'con-n' && S.sel != null) { strings.rename(S.sel, e.target.value); tick(1500); } });
/* a knot chosen in the list is brought into view on the ground */
function bringIntoView(k) {
  const n = strings.pos(k); if (!n || !S.mapReady) return; const c = map.getContainer(); const right = c.clientWidth - (phone() ? 0 : Math.min(440, innerWidth * 0.4)); const bottom = phone() && S.open ? innerHeight * 0.42 : c.clientHeight;
  if (n.x < 40 || n.y < 40 || n.x > right - 40 || n.y > bottom - 40) map.easeTo({ center: [n.lng, n.lat], offset: sheetOffset(), duration: reduced() ? 0 : 500 });
}
/* the whole web in view */
function fitWeb() { const ex = strings.extent(); if (ex && S.mapReady) map.fitBounds(ex, { padding: framePad(), maxZoom: 17, duration: reduced() ? 0 : 700 }); }
function peekChanged(k) { if (face === 'front') $$('#r-strings .nrow').forEach(b => b.classList.toggle('pk', b.dataset.node === k)); }
/* anything that changes the figure changes the card, the ledger and the slip */
function stringsChanged() { if (S.mode !== 'ping') return; if (face === 'front') { fillStrings(); fillLedger(); } else if (face === 'wish') fillKnots(); }
/* places arriving (or not) for the life that is open */
function placesChanged() { if (S.mode !== 'ping') return; strings.refresh(); if (face === 'front') { fillLedger(); fillStrings(); } const lg = $('#r-ledger'); if (lg) lg.classList.toggle('busy', S.bizState === 'loading'); }
/* ───────── the ledger: who in its radius sells or leaves what harms it, and who can help, counted plainly ───────── */
const HELP_W = { circular: ['repairs, reuses or refills', 'repair, reuse or refill'], artists: ['artist or studio', 'artists and studios'], third: ['third space', 'third spaces'], network: ['network', 'networks'], brand: ['local label', 'local labels'] };
/* "15 sell takeaway containers", "1 sells pesticides" */
const plainN = (r, n) => { const t = (ROLES[r] || {}).plain || ''; return n === 1 ? t.replace(/^(\w+)/, w => (/(sh|ch|s)$/.test(w) ? w + 'es' : w + 's')) : t; };
function fillLedger() {
  const el = $('#r-ledger'); const o = S.byId.get(S.sel); if (!el) return; if (!o || S.mode !== 'ping' || o.ob || !strings.cell) { el.hidden = true; return; }
  const L = strings.ledgerOf(); const fo = strings.focus; const f = strings.fig; const allIn = ks => ks.every(k => f.e.some(([a, b]) => a === k || b === k));
  const row = (key, ks, mk, words) => `<li><button type="button" class="lg-row${fo === key ? ' on' : ''}${allIn(ks) ? ' in' : ''}" data-lg="${esc(key)}" data-n="${ks.length}">${mk}<b class="mono">${ks.length}</b><span>${esc(words)}</span>${allIn(ks) ? icon('string', 'sm') : fo === key ? `<i class="lg-go">${icon('string', 'sm')}</i>` : ''}</button></li>`;
  const harm = L.harm.map(([r, ks]) => row(r, ks, `<i class="fm fm-service harm"></i>`, plainN(r, ks.length)));
  const help = L.help.map(([fam, ks]) => row('fam:' + fam, ks, `<i class="fm fm-${fam}"></i>`, (HELP_W[fam] || [])[ks.length === 1 ? 0 : 1] || FAM_W(fam).toLowerCase()));
  el.innerHTML = (harm.length ? `<h4 class="lab red">${L.total} · HARM IT</h4><ol>${harm.join('')}</ol>` : '') + (help.length ? `<h4 class="lab">CAN HELP</h4><ol>${help.join('')}</ol>` : '');
  el.hidden = !harm.length && !help.length; el.classList.toggle('busy', S.bizState === 'loading');
}
/* a row once: those places lit on the ground; twice: all of them joined to the life */
$('#r-ledger').addEventListener('click', e => {
  const b = e.target.closest('[data-lg]'); if (!b) return; const key = b.dataset.lg; const L = strings.ledgerOf();
  const ks = key.startsWith('fam:') ? (L.help.find(([f]) => 'fam:' + f === key) || [0, []])[1] : (L.harm.find(([r]) => r === key) || [0, []])[1];
  if (strings.focus === key) { const n = strings.joinAll(ks); if (!n) tick(700); strings.unfocus(); fitWeb(); }
  else { strings.focusOn(key); tick(1600); }
  fillLedger();
});
$('#r-ledger').addEventListener('contextmenu', e => { const b = e.target.closest('[data-lg]'); if (!b) return; e.preventDefault(); const key = b.dataset.lg; const L = strings.ledgerOf(); const ks = key.startsWith('fam:') ? (L.help.find(([f]) => 'fam:' + f === key) || [0, []])[1] : (L.harm.find(([r]) => r === key) || [0, []])[1]; strings.joinAll(ks); strings.unfocus(); fillLedger(); });
/* a constellation from NOW: its life opened, the whole web framed, then lit or traced */
function showConstellation(id, how) {
  const o = S.byId.get(id); if (!o) return; select(id, { cell: true });
  setTimeout(() => { fitWeb(); setTimeout(() => { if (how === 'trace') strings.traceIt(); else strings.glow(); }, reduced() ? 30 : 760); }, 80);
}
/* notes on a cell, kept on this device, above NOTICED; the slip can carry them */
const NOTES = store.get('da.notes.v1', {});
const noteOf = o => (o && NOTES[o.id]) || '';
function setNote(o, t) { if (!o) return; if (t.trim()) NOTES[o.id] = t.slice(0, 280); else delete NOTES[o.id]; store.set('da.notes.v1', NOTES); }
$('#r-note').addEventListener('input', debounce(e => setNote(S.byId.get(S.sel), e.target.value), 250));

/* ───────── a group already caring for a patch of ground ───────── */
function fillTribe(t, quiet) {
  const col = C.tribe[t.kind] || C.tribe.park;
  $('#r-no').textContent = `No. ${t.tid}`; $('#r-name').textContent = t.n; $('#r-latin').innerHTML = '';
  if (!quiet) figure(t);
  const lives = livesIn(t); const atRisk = lives.filter(o => degOf(o) >= 3).length;
  $('#r-chips').innerHTML = chip(esc(t.w), 'tb', t.what) + chip(`${lives.length} LIVES`, '', 'Recorded on their ground') + (atRisk ? chip(`${atRisk} AT RISK`, 'dg d3', 'Severe danger in the months ahead') : '') + (t.when ? chip(esc(t.when.toUpperCase()), 'at') : '');
  $('#r-chips').style.setProperty('--c', col);
  $('#r-threat').hidden = true; $('#r-learn').hidden = true; $('#r-season').hidden = true; $('#r-ledger').hidden = true; $('#r-do').innerHTML = '';
  $('#r-strings').innerHTML = lives.length ? `<details class="reach"><summary class="mono">LIVES · ${lives.length}</summary><ol>${lives.sort((a, b) => degOf(b) - degOf(a)).slice(0, 40).map(o => `<li><button type="button" class="nrow" data-cell="${esc(String(o.id))}"><img class="pg sm" src="${pinOf(o)}" alt=""><span class="n">${esc(nameOf(o))}</span>${degChip(degOf(o))}</button></li>`).join('')}</ol></details>` : '';
  $('#r-strings').hidden = !lives.length;
}
$('#r-strings').addEventListener('click', e => { const c = e.target.closest('[data-cell]'); if (c) { const v = c.dataset.cell; select(/^\d+$/.test(v) ? +v : v); return; } const g = e.target.closest('[data-sig]'); if (g) openSignal(g.dataset.sig); });

/* ───────── the slip: four blank lines; whatever else it carries is chosen before it is issued ───────── */
const WKEYS = ['w', 'i', 's', 'h'];
const draftKey = o => 'da.draft.' + o.id;
const KINS = [['bird', 'parrot', 'waterbird', 'owl', 'raptor'], ['bee', 'butterfly', 'moth', 'fly', 'wasp', 'beetle', 'bug', 'grasshopper', 'mantis', 'dragonfly'], ['frog', 'turtle', 'aquatic', 'snail', 'segmented'], ['mammal', 'possum', 'flyingfox', 'bat', 'rodent', 'macropod', 'ape'], ['plant', 'fungi'], ['lizard', 'snake'], ['cat', 'dog'], ['fox', 'rabbit']];
const kinOf = g => KINS.find(x => x.includes(g)) || [g];
/* the brief a figure points to, kept with the signal: the life, the roles tied, a group or water tied, the months ahead */
function webBriefs(o, tied, n = 4) {
  if (!tied.length) return [];
  const g = lifeOf(o); const kin = kinOf(g); const roles = new Set(tied.filter(x => x.t === 'biz').flatMap(x => [x.role, ...(x.harm || [])])); const lifeGs = new Set(tied.filter(x => x.t === 'life').map(x => x.g));
  const group = tied.some(x => x.t === 'group'), water = tied.some(x => x.t === 'water'); const months = [0, 1, 2].map(i => outMonth(Math.min(OUT_N - 1, S.mo + i)).m);
  return BRIEFS.map(b => {
    let sc = b.g.includes(g) ? 6 : b.g.some(x => kin.includes(x)) ? 2 : b.g.includes('any') ? 2 : 0;
    const rl = b.roles.filter(r => roles.has(r)).length; sc += Math.min(2, rl) * 3;
    if (b.g.some(x => lifeGs.has(x))) sc += 2; if (water && b.th === 'water') sc += 2; if (group && b.roles.some(r => ['space', 'market', 'grower'].includes(r))) sc += 1;
    if (b.m.some(m => months.includes(m))) sc += 1; if (o.hero && o.heroOf.brief === b.id) sc += 3;
    return { b, sc, rl };
  }).filter(x => x.sc >= 5 && (x.rl || !roles.size)).sort((a, b) => b.sc - a.sc || a.b.id.localeCompare(b.b.id)).slice(0, n).map(x => x.b);
}
/* the slip, as it will print: filled from the cell, the four lines left blank */
function fillSlipHead(host, d) {
  host.querySelector('.sl-code').textContent = d.code || 'DA-····'; host.querySelector('.sl-time').textContent = fmtStamp(d.at || Date.now());
  const p = d.pin;
  host.querySelector('.sl-life').innerHTML = `<b>${esc((p.cn || p.n || '').toUpperCase())}</b>${p.cn && p.n && p.cn !== p.n ? `<i>${esc(p.n)}</i>` : ''}<dl class="sl-meta mono"><dt>SITE</dt><dd>${esc(p.place || '')} · ${(+p.lat).toFixed(4)} ${(+p.lng).toFixed(4)}</dd>${d.when ? `<dt class="sl-win">WINDOW</dt><dd class="sl-win">${esc(d.when)}${d.deg >= 2 ? ` · ${DEG[d.deg]}` : ''}</dd>` : ''}</dl>`;
}
function pinData(o) { const sub = subjectOf(o); return { id: typeof sub.id === 'number' ? sub.id : null, lat: +o.lat.toFixed(5), lng: +o.lng.toFixed(5), n: (sub.tx && sub.tx.n) || '', cn: nameOf(o), ic: (sub.tx && sub.tx.ic) || '', g: lifeOf(o), place: placeOf(o) }; }
function whenWord(o) { const w = whenOf(o); return w ? `${w.w} · ${w.now ? 'NOW' : `${daysTo(w.start)} D`}` : ''; }
let remixLines = null;
/* what the slip carries besides its four lines, remembered on this device */
const SLIP = Object.assign({ threat: true, note: true }, store.get('da.slip.v1', {}));
const saveSlip = () => store.set('da.slip.v1', SLIP);
/* the statement a slip opens with: a hero's own, else its kind's. Rewritten on the slip, it stays rewritten for that cell on this device */
const STS = store.get('da.st.v1', {});
const stDefault = o => { if (!o || isAlarm(o) || !(live(o) || kindLife(o))) return ''; if (o.hero && o.heroOf && o.heroOf.st) return o.heroOf.st; return STATEMENT[lifeOf(o)] || STATEMENT.paw || threatOf(o); };
const statementOf = o => (o && typeof STS[o.id] === 'string' ? STS[o.id] : stDefault(o));
function setStatement(o, t) { if (!o) return; if (t.trim() === stDefault(o).trim()) delete STS[o.id]; else STS[o.id] = t.slice(0, 320); store.set('da.st.v1', STS); }
const autoH = t => { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 2}px`; };
/* the statement and its window go on the slip together, or neither does */
function stOn() { const on = $('#w-threat-on').checked && !!$('#w-st').value.trim(); $('#w-threat').classList.toggle('off', !on); $$('#w-slip .sl-win').forEach(e => e.classList.toggle('off', !on)); }
function fillWish(o, from) {
  const slip = $('#w-slip'); const d = { pin: pinData(o), when: whenWord(o), deg: degOf(o), at: Date.now() };
  fillSlipHead(slip, d); $('#r-no').textContent = `No. ${codeOf(o)}`;
  const ta = $('#w-st'); ta.value = statementOf(o); ta.placeholder = 'A statement: what is happening to this life here'; $('#w-st-reset').hidden = ta.value === stDefault(o);
  $('#w-threat-on').checked = SLIP.threat; stOn();
  const draft = from || store.get(draftKey(o), null) || {};
  for (const k of WKEYS) { const t = $('#w-' + k); t.value = (draft[k] || '').slice(0, SIG.line); count(t); }
  $('#w-sign').value = S.me.by || ''; $('#w-foot').textContent = CONFIG.COUNTRY;
  const note = noteOf(o); $('#w-note-t').value = note; $('#w-note-on').checked = SLIP.note && !!note; $('#w-note').classList.toggle('off', !(SLIP.note && note));
  fillKnots(); fillWishFig(o);
  requestAnimationFrame(() => autoH(ta));
}
/* what each relation is, in a word: what it does that matters to this life, else what it is */
const knotWord = n => n.t === 'biz' ? ((ROLES[(n.harm || [])[0]] || ROLES[n.role] || {}).w || '') : n.t === 'group' ? 'GROUP' : n.t === 'water' ? 'WATER' : n.t === 'custom' ? KNOT_W[n.kind] || '' : String(M.KINDS[n.g] || '').toUpperCase();
function fillKnots() {
  const t = relOrder(strings.tied()); const el = $('#w-knots'); let no = 0;
  el.innerHTML = t.map((n, i) => { const g = relKind(n); const first = !i || relKind(t[i - 1]) !== g;
    return `<li class="${g}${n.inc ? '' : ' off'}"${first ? ` data-g="${REL_G[g]} · ${t.filter(x => relKind(x) === g).length}"` : ''}><label class="ck" data-tip="On the slip"><input type="checkbox" data-inc="${esc(n.key)}"${n.inc ? ' checked' : ''} aria-label="On the slip"><i></i></label><b class="mono kn-i">${n.inc ? pad2(++no) : '··'}</b><input class="kn" type="text" data-lb="${esc(n.key)}" value="${esc(n.label)}" maxlength="40" aria-label="Name on the slip" spellcheck="false"><small class="mono${g === 'harm' ? ' red' : ''}">${esc(knotWord(n))}</small></li>`; }).join('');
  el.hidden = !t.length;
}
$('#w-knots').addEventListener('change', e => { const c = e.target.closest('[data-inc]'); if (!c) return; strings.setInclude(c.dataset.inc, c.checked); let no = 0; $$('#w-knots li').forEach(li => { const on = li.querySelector('[data-inc]').checked; li.classList.toggle('off', !on); li.querySelector('.kn-i').textContent = on ? pad2(++no) : '··'; }); tick(c.checked ? 1800 : 1100); });
$('#w-knots').addEventListener('input', debounce(e => { const i = e.target.closest('[data-lb]'); if (i) strings.setLabel(i.dataset.lb, i.value); }, 250));
$('#w-threat-on').addEventListener('change', e => { SLIP.threat = e.target.checked; saveSlip(); stOn(); tick(SLIP.threat ? 1800 : 1100); });
$('#w-st').addEventListener('input', e => { autoH(e.target); const o = S.byId.get(S.sel); if (!o) return; setStatement(o, e.target.value); $('#w-st-reset').hidden = statementOf(o) === stDefault(o); if (e.target.value.trim() && !$('#w-threat-on').checked) { $('#w-threat-on').checked = true; SLIP.threat = true; saveSlip(); } stOn(); });
$('#w-st-reset').addEventListener('click', () => { const o = S.byId.get(S.sel); if (!o) return; delete STS[o.id]; store.set('da.st.v1', STS); const ta = $('#w-st'); ta.value = stDefault(o); autoH(ta); $('#w-st-reset').hidden = true; stOn(); tick(1500); });
$('#w-note-on').addEventListener('change', e => { SLIP.note = e.target.checked; saveSlip(); $('#w-note').classList.toggle('off', !SLIP.note); tick(SLIP.note ? 1800 : 1100); });
$('#w-note-t').addEventListener('input', debounce(e => { const o = S.byId.get(S.sel); setNote(o, e.target.value); const on = !!e.target.value.trim(); if (on && !$('#w-note-on').checked && SLIP.note) $('#w-note-on').checked = true; $('#w-note').classList.toggle('off', !($('#w-note-on').checked && on)); }, 250));
/* ───────── the photograph on the slip: the life's own, another of its kind seen near it, your own, or none ───────── */
const sameImg = (a, b) => !!a && !!b && a.k === b.k && (a.k !== 'inat' || a.u === b.u);
function imgList(o) { const all = photoChoices(o); const c = IMGS[o.id]; if (c && c.k === 'inat' && c.u && !all.some(x => sameImg(x, c))) all.unshift(c); if (OWN[o.id]) all.push({ k: 'own' }); return all; }
const wishCredit = (c, o) => c.k === 'rec' ? (o.who ? `© ${o.who}` : 'Photograph from the record') : figCredit({ img: c });
let wfN = 0;
async function fillWishFig(o) {
  const fig = $('#w-fig'), cv = $('#w-img'); const c = imgChoice(o); const list = imgList(o); const i = list.findIndex(x => sameImg(x, c)); const my = ++wfN;
  const none = c.k === 'none'; fig.classList.toggle('none', none); $('#w-imgs [data-img="none"]').setAttribute('aria-pressed', String(none));
  $$('#w-imgs [data-img="prev"], #w-imgs [data-img="next"]').forEach(b => { b.disabled = list.length < 2 && !none; });
  $('#w-imgn').textContent = !none && list.length > 1 ? `${i + 1}/${list.length}` : '';
  $('#w-cap').textContent = none ? (list.length ? 'NO PHOTOGRAPH' : 'NO OPEN PHOTOGRAPH') : wishCredit(c, o);
  if (none) { cv.width = 1; cv.height = 1; cv.dataset.img = ''; return; }
  const want = `${o.id}|${c.k}|${c.u || ''}`; if (cv.dataset.img !== want) { const x0 = cv.getContext('2d'); x0.fillStyle = '#E6E5DE'; x0.fillRect(0, 0, cv.width, cv.height); }
  cv.classList.add('wait');
  /* the card turns over first; then the photograph develops */
  await new Promise(r => setTimeout(r, reduced() ? 0 : 420)); if (my !== wfN) return;
  for (let i = 0; i < 40 && !fig.clientWidth; i++) await new Promise(r => setTimeout(r, 25));
  const W = fig.clientWidth || 320, H = Math.round(W * 0.75); const k = Math.min(2, devicePixelRatio || 1); const src = imgSrc(c, o.id, o, false);
  try { const bw = await bwCanvas(src, Math.round(W * k), Math.round(H * k), 2); if (my !== wfN) return; cv.width = bw.width; cv.height = bw.height; cv.getContext('2d').drawImage(bw, 0, 0); cv.classList.remove('grey'); }
  catch (e) {   /* a host that will not share its pixels: the photograph greyed by the browser instead */
    try { const im = await loadImage(src); if (my !== wfN) return; cv.width = Math.round(W * k); cv.height = Math.round(H * k); const x = cv.getContext('2d'); const sc = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight); x.drawImage(im, (cv.width - im.naturalWidth * sc) / 2, (cv.height - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc); cv.classList.add('grey'); }
    catch (e2) { if (my !== wfN) return; cv.width = Math.round(W * k); cv.height = Math.round(H * k); const x = cv.getContext('2d'); x.fillStyle = '#E6E5DE'; x.fillRect(0, 0, cv.width, cv.height); M.glyph(x, lifeOf(o), cv.width / 2, cv.height / 2, cv.height * 0.6, '#141412'); }
  }
  if (my === wfN) { cv.classList.remove('wait'); cv.dataset.img = want; }
}
$('#w-imgs').addEventListener('click', e => {
  const b = e.target.closest('[data-img]'); const o = S.byId.get(S.sel); if (!b || !o || b.disabled) return; const a = b.dataset.img;
  if (a === 'own') { $('#w-file').click(); return; }
  const list = imgList(o); const c = imgChoice(o);
  if (a === 'none') IMGS[o.id] = c.k === 'none' ? (list[0] || { k: 'none' }) : { k: 'none' };
  else { if (!list.length) { toast('NO OPEN PHOTOGRAPH'); return; } let i = list.findIndex(x => sameImg(x, c)); i = i < 0 ? 0 : (i + (a === 'next' ? 1 : -1) + list.length) % list.length; IMGS[o.id] = list[i]; }
  saveImgs(); fillWishFig(o); tick(a === 'none' ? 1100 : 1700); buzz(4);
});
/* your own photograph, made small enough to keep on this device */
$('#w-file').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; const o = S.byId.get(S.sel); if (!f || !o) return;
  try {
    const url = URL.createObjectURL(f); const im = await loadImage(url); const N = 800; const k = Math.min(1, N / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    OWN[o.id] = c.toDataURL('image/jpeg', 0.8); saveOwn(); IMGS[o.id] = { k: 'own' }; saveImgs(); fillWishFig(o); tick(2200); buzz(8);
  } catch (err) { toast('PHOTO WILL NOT OPEN'); }
  e.target.value = '';
});
/* the characters left on a line, shown only when few are left */
function count(t) { const left = SIG.line - t.value.length; const li = t.closest('li'); li.dataset.left = left <= 12 ? String(left) : ''; li.classList.toggle('full', !!t.value); }
const saveDraft = debounce(() => { const o = S.byId.get(S.sel); if (o && S.mode === 'ping') store.set(draftKey(o), Object.fromEntries(WKEYS.map(k => [k, $('#w-' + k).value]))); }, 300);
WKEYS.forEach(k => {
  const t = $('#w-' + k); t.maxLength = SIG.line;
  t.addEventListener('input', () => { count(t); saveDraft(); });
  t.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const i = WKEYS.indexOf(k); if (i < 3) $('#w-' + WKEYS[i + 1]).focus(); else heroBtn.click(); } });
});
$('#w-sign').addEventListener('input', e => { S.me.by = e.target.value.trim(); store.set('da.me', S.me); });
$('#r-wish').addEventListener('submit', e => e.preventDefault());

/* ───────── the main button ───────── */
heroBtn.addEventListener('click', async () => {
  if (face === 'place') { placeIt(false); return; }
  if (face === 'signal') { const s = S.issued || S.signals.find(x => x.key === S.sig); if (s) openSend(s); return; }
  if (S.mode === 'tribe') { const t = S.byId.get(S.tribeSel); if (t) window.open(t.link, '_blank', 'noopener'); return; }
  if (S.mode === 'partner') { const p = partnerOf(S.partnerSel); if (p && p.url) window.open(p.url, '_blank', 'noopener'); return; }
  const o = S.byId.get(S.sel); if (!o) return;
  if (face === 'front') {
    if (o.kind === 'injured' || o.kind === 'dead') { const tel = telOf(o); if (tel) { location.href = tel; return; } }
    if (o.kind === 'lost') { searchFor(o.id); return; }
    toWish(o); return;
  }
  if (face === 'wish') issue(o);
});
altBtn.addEventListener('click', () => { if (face === 'place') { placeIt(true); return; } const o = S.byId.get(S.sel); if (o) toWish(o); });
function toWish(o, from) { fillWish(o, from || remixLines); remixLines = null; showFace('wish'); buzz(6); snd.tick(1700); }
/* issued: the slip feeds out of the printer and becomes a signal. The four lines are asked for, never required:
   a record can be issued and printed as it stands */
async function issue(o) {
  const L = Object.fromEntries(WKEYS.map(k => [k, $('#w-' + k).value.trim()]));
  const st = $('#w-threat-on').checked ? $('#w-st').value.trim() : ''; const c = imgChoice(o);
  const img = c.k === 'rec' ? { k: 'own', a: o.who ? `© ${o.who}` : '' } : c;
  const sig = makeSignal(o, L, $('#w-sign').value.trim(), { statement: st, note: $('#w-note-on').checked ? $('#w-note-t').value.trim() : '', img });
  /* an own photograph stays on this device, kept under the signal's code */
  const own = c.k === 'own' ? OWN[o.id] : c.k === 'rec' ? o.photo : null; if (own && sig.img) { OWN[sig.code] = own; saveOwn(); }
  const ev = await ledgerAdd({ type: 'signal', ref: o.id, lat: sig.pin.lat, lng: sig.pin.lng, who: sig.who, data: sig });
  store.set(draftKey(o), null);
  const slip = $('#w-slip'); slip.querySelector('.sl-code').textContent = sig.code;
  snd.printer(1250); rec.classList.add('feeding');
  setTimeout(() => { rec.classList.remove('feeding'); S.issued = S.signals.find(x => x.key === ev.key) || { key: ev.key, ...sig }; fillSignal(S.issued); showFace('signal'); snd.tear(); buzz([12, 40, 18]); try { history.replaceState(null, '', '#' + sig.code); } catch (e) { /* file:// */ } }, reduced() ? 0 : 1250);
}

/* ───────── a new record by hand: a touch on empty ground in the radar, a long press, or a right-click ───────── */
const PLACE_KINDS = [
  { f: 'fauna', type: 'noticed', b: 1, word: 'SEEN' }, { f: 'flora', type: 'noticed', b: 5, word: 'PLANT' }, { f: 'injured', type: 'injured', b: 0, word: 'HURT' },
  { f: 'dead', type: 'dead', b: 0, word: 'DEAD' }, { f: 'lost', type: 'lost', b: 0, word: 'LOST' }, { f: 'need', type: 'need', b: 0, word: 'NEED' },
  { f: 'offer', type: 'offer', b: 0, word: 'OFFER' }, { f: 'event', type: 'event', b: 0, word: 'GATHER' },
];
const KIND_WORDS = [[3, /\b(dead|died|carcass|roadkill)\b/], [2, /\b(hurt|injur\w*|bleed\w*|hit by|limp\w*|dying|trapped|stuck|tangled|on the ground|can'?t fly|wounded)\b/], [4, /\b(lost|missing|escaped|has anyone seen|run away|ran off)\b/], [7, /\b(tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|walk|gig|workshop|meet|gathering|\d{1,2}(:\d{2})?\s?(am|pm))\b/], [5, /\b(need|needs|please help|looking for|wanted)\b/], [6, /\b(offer\w*|free|giving|spare|available|happy to)\b/], [1, /\b(tree|plant|flower\w*|grass|gum|wattle|moss|fung\w*|mushroom\w*|weed|seedling\w*|orchid\w*)\b/]];
const kindFrom = t => { for (const [k, re] of KIND_WORDS) if (re.test(t)) return k; return 0; };
const NAME_WORDS = [
  [/\bflying.?fox\w*\b/, 'pteropus poliocephalus'], [/\b(frogmouth|tawny)\b/, 'podargus strigoides'], [/\bowl\w*\b/, 'ninox strenua'],
  [/\b(cat|cats|kitten\w*)\b/, 'felis catus'], [/\b(dog|dogs|puppy|pup|whippet|greyhound|terrier|kelpie)\b/, 'canis familiaris'], [/\bfox(es)?\b/, 'vulpes vulpes'],
  [/\bringtail\w*\b/, 'pseudocheirus peregrinus'], [/\b(possum|possums|brushtail)\b/, 'trichosurus vulpecula'], [/\b(rabbit|rabbits|bunny)\b/, 'oryctolagus cuniculus'], [/\b(rakali|water.?rat)\b/, 'hydromys chrysogaster'],
  [/\bmagpie\w*\b/, 'gymnorhina tibicen'], [/\bkookaburra\w*\b/, 'dacelo novaeguineae'], [/\blorikeet\w*\b/, 'trichoglossus moluccanus'], [/\bcockatoo\w*\b/, 'cacatua galerita'], [/\bduck\w*\b/, 'anas superciliosa'],
  [/\bgull\w*\b/, 'chroicocephalus novaehollandiae'], [/\bibis\b/, 'threskiornis molucca'], [/\bmyna\w*\b/, 'acridotheres tristis'], [/\bwattlebird\w*\b/, 'anthochaera carunculata'], [/\b(fairy.?wren|wren)\w*\b/, 'malurus cyaneus'],
  [/\b(orb.?weaver|orb spider)\w*\b/, 'hortophora biapicata'], [/\bredback\w*\b/, 'latrodectus hasselti'], [/\bhuntsman\w*\b/, 'sparassidae'],
  [/\bblue.?tongue\w*\b/, 'tiliqua scincoides'], [/\bturtle\w*\b/, 'chelodina longicollis'], [/\bbogong\b/, 'agrotis infusa'], [/\bmantis\b/, 'orthodera ministralis'], [/\b(bee|bees|swarm)\b/, 'apis mellifera'], [/\b(european wasp|wasp nest|wasps?)\b/, 'vespula germanica'],
];
const GROUP_WORDS = [[/\bsnakes?\b/, { n: 'Serpentes', cn: 'Snake', ic: 'Reptilia' }], [/\bbats?\b/, { n: 'Chiroptera', cn: 'Microbat', ic: 'Mammalia' }], [/\bfrogs?\b/, { n: 'Anura', cn: 'Frog', ic: 'Amphibia' }], [/\bskinks?\b/, { n: 'Scincidae', cn: 'Skink', ic: 'Reptilia' }], [/\bbirds?\b/, { n: 'Aves', cn: 'Bird', ic: 'Aves' }]];
const IC_OF_GLYPH = { bird: 'Aves', parrot: 'Aves', waterbird: 'Aves', owl: 'Aves', raptor: 'Aves', frog: 'Amphibia', lizard: 'Reptilia', snake: 'Reptilia', turtle: 'Reptilia', bee: 'Insecta', wasp: 'Insecta', fly: 'Insecta', beetle: 'Insecta', bug: 'Insecta', butterfly: 'Insecta', moth: 'Insecta', mantis: 'Insecta', grasshopper: 'Insecta', dragonfly: 'Insecta', spider: 'Arachnida', orb: 'Arachnida', snail: 'Mollusca', plant: 'Plantae', fungi: 'Fungi' };
const speciesFrom = t => {
  for (const [re, n] of NAME_WORDS) if (re.test(t)) { const fe = FIELD_IX.get(n); if (fe) return { n: fe.n, cn: fe.cn.replace(/\s*\(.*\)$/, ''), ic: IC_OF_GLYPH[fe.g] || 'Mammalia', intro: fe.st === 'I', th: fe.st === 'T' }; }
  for (const [re, g] of GROUP_WORDS) if (re.test(t)) return { ...g, intro: false };
  return null;
};
const nightNow = () => { const h = new Date().getHours(); return h >= 20 || h < 6; };
/* what it is, by touch, when the words do not say: the kinds most often met here, and any other animal */
const LIFE_CHIPS = [['paw', 'ANIMAL'], ['bird', 'BIRD'], ['possum', 'POSSUM'], ['bat', 'BAT'], ['bee', 'BEE'], ['butterfly', 'BUTTERFLY'], ['beetle', 'BEETLE'], ['spider', 'SPIDER'], ['lizard', 'LIZARD'], ['snake', 'SNAKE'], ['frog', 'FROG'], ['turtle', 'TURTLE'], ['dog', 'DOG'], ['cat', 'CAT'], ['plant', 'PLANT']];
const LIFE_KINDS = ['fauna', 'flora', 'injured', 'dead', 'lost'];
/* a phone number or an email, nothing else */
const contactOK = v => !v || /^[^@\s/]+@[^@\s/]+\.[a-z]{2,}$/i.test(v) || /^\+?[\d\s()-]{8,18}$/.test(v);
/* how many: "three kittens", "2 foxes"; not a house number, not a time */
const COUNTS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, pair: 2, couple: 2, several: 3, dozen: 12 };
const countFrom = t => {
  const m = t.match(/\b(\d{1,2})\s+(?!(st|street|rd|road|ave|avenue|pde|parade|cres|ct|pl|lane|ln|am|pm|min|mins|minutes|hours|hrs|m|km|metres|meters)\b)[a-z]/);
  if (m && +m[1] > 1) return Math.min(99, +m[1]);
  for (const [w, n] of Object.entries(COUNTS)) if (new RegExp(`\\b${w}\\b`).test(t)) return n; return 0;
};
let placeImg = null;
function startPlace(lngLat) {
  if (S.mode) closeRecord('switch');
  S.mode = 'place'; S.sel = null; S.tribeSel = null; S.sig = null; S.place = { id: 'place', lat: lngLat.lat, lng: lngLat.lng, b: 1, kind: 0, auto: true, photo: null, tx: null, g: null };
  placeImg = null; $('#r-name').textContent = ''; $('#r-latin').innerHTML = '';
  $('#pl-text').value = ''; $('#pl-shot').classList.remove('has'); $('#pl-when').value = ''; $('#pl-contact').value = '';
  openRecord(); fillPlace(); showFace('place'); life.select(); placesAround(lngLat.lat, lngLat.lng, 400); snd.tick(1300); buzz(8);
  if (S.mapReady) map.easeTo({ center: [lngLat.lng, lngLat.lat], zoom: Math.max(map.getZoom(), 15.2), offset: sheetOffset(), duration: reduced() ? 0 : 700 });
  if (!coarse()) setTimeout(() => $('#pl-text').focus({ preventScroll: true }), 320);
}
/* out of placing, by any way out; whatever was begun can be brought back for a moment */
function cancelPlace() {
  const keep = S.place ? { p: { ...S.place }, img: placeImg, text: $('#pl-text').value, when: $('#pl-when').value, contact: $('#pl-contact').value } : null;
  snd.snap(0); closeRecord();
  if (keep && (keep.text.trim() || keep.img)) toastUndo('CANCELLED', () => { startPlace(keep.p); S.place = keep.p; placeImg = keep.img; $('#pl-text').value = keep.text; $('#pl-when').value = keep.when; $('#pl-contact').value = keep.contact; $('#pl-shot').classList.toggle('has', !!keep.img); fillPlace(); life.select(); });
}
function movePlace(ll) { const p = S.place; if (!p) return; p.lat = ll.lat; p.lng = ll.lng; fillPlace(); life.select(); tick(1500); }
/* the record as it will be: the photograph or the thing itself in a circle */
function drawPreview() {
  const p = S.place; const cv = $('#pl-disc'); const x = cv.getContext('2d'); const n = cv.width; const h = n / 2;
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, n, n);
  if (placeImg) {
    const k = PLACE_KINDS[p.kind];
    x.save(); x.beginPath(); x.arc(h, h, h, 0, Math.PI * 2); x.clip(); const s = Math.max(n / placeImg.naturalWidth, n / placeImg.naturalHeight); const w = placeImg.naturalWidth * s, ht = placeImg.naturalHeight * s; x.drawImage(placeImg, (n - w) / 2, (n - ht) / 2, w, ht); x.restore();
    if (['injured', 'lost', 'dead'].includes(k.f)) { x.beginPath(); x.arc(h, h, h - n / 40, 0, Math.PI * 2); x.lineWidth = n / 20; x.strokeStyle = k.f === 'dead' ? C.black : C.red; if (k.f === 'lost') x.setLineDash([n / 22, n / 22]); x.stroke(); x.setLineDash([]); }
    return;
  }
  M.badge(x, { ...life.badgeOf(p, 40), d: n * 0.98, fresh: false, sig: false, n: 0 }, h, h);
}
function fillPlace() {
  const p = S.place; const k = PLACE_KINDS[p.kind]; const night = nightNow(); const text = $('#pl-text').value.trim();
  p.tx = text ? speciesFrom(text.toLowerCase()) : null;
  const fe = p.tx ? FIELD_IX.get(p.tx.n.toLowerCase()) || (GROUP_REP[p.tx.n.toLowerCase()] ? FIELD_IX.get(GROUP_REP[p.tx.n.toLowerCase()]) : null) : null;
  $('#r-no').textContent = 'No. ——— NEW';
  const sky = $('#pl-sky'); sky.classList.toggle('night', night);
  $('#pl-time').textContent = fmtClock(Date.now()); $('#pl-sw').innerHTML = icon(night ? 'night' : 'day');
  $('#pl-where').textContent = suburbAt(p.lat, p.lng);
  $('#pl-kinds').innerHTML = PLACE_KINDS.map((x, i) => `<button type="button" class="chip k-${x.f}${i === p.kind ? ' on' : ''}" data-k="${i}" aria-pressed="${i === p.kind}">${x.word}</button>`).join('');
  const lifeOn = LIFE_KINDS.includes(k.f); $('#pl-lives').hidden = !lifeOn;
  const autoG = !p.g && p.tx ? glyphOf(p) : null;
  if (lifeOn) $('#pl-lives').innerHTML = LIFE_CHIPS.map(([g, w]) => `<button type="button" class="lchip${p.g === g ? ' on' : autoG === g ? ' auto' : ''}" data-g="${g}" aria-pressed="${p.g === g}" aria-label="${w}" data-tip="${w}">${glyphSVG(g)}</button>`).join('');
  const chosen = p.g && p.g !== 'paw' ? (M.KINDS[p.g] || '') : '';
  const name = p.tx ? p.tx.cn : chosen ? (k.f === 'injured' ? `${chosen}, hurt` : k.f === 'dead' ? `${chosen}, dead` : k.f === 'lost' ? `${chosen}, lost` : chosen) : k.f === 'injured' ? 'An animal, hurt' : k.f === 'dead' ? 'An animal, dead' : k.f === 'lost' ? 'An animal, lost' : k.f === 'flora' ? 'A plant' : k.f === 'fauna' ? 'An animal' : text ? text.slice(0, 48) : cap(k.word.toLowerCase());
  $('#pl-name').textContent = name; $('#pl-latin').innerHTML = p.tx ? `<i>${esc(p.tx.n)}</i>` : '';
  const tags = []; const n = countFrom(text.toLowerCase()); if (n > 1) tags.push(`×${n}`);
  if (night && ['fauna', 'injured', 'lost', 'dead'].includes(k.f)) tags.push('AFTER DARK');
  if (fe && fe.st === 'I') tags.push('INTRODUCED'); if (fe && fe.st === 'T') tags.push('THREATENED');
  $('#pl-tags').innerHTML = tags.map(w => `<span>${w}</span>`).join('');
  drawPreview();
  const tel = k.f === 'injured' ? (fe && fe.g === 'flyingfox' ? ['tel:136186', '136 186', 'DEECA'] : ['tel:0384007300', '(03) 8400 7300', 'WILDLIFE VICTORIA']) : k.f === 'dead' && fe && BIRDS.has(fe.g) ? ['tel:1800675888', '1800 675 888', 'SICK OR DEAD WILD BIRDS'] : null;
  const lostL = k.f === 'lost' ? LINKS.find(l => /LOST/.test(l[0]) && (p.lat > -37.7835 ? /MERRI/.test(l[0]) : /MELBOURNE/.test(l[0]))) || null : null;
  $('#pl-hint').innerHTML = (fe && fe.harm && !tel ? `<p class="harm">${icon('harm', 'sm')}${esc(cap(fe.harm))}</p>` : '')
    + (tel ? `<a class="callline alarm" href="${tel[0]}">${icon('phone')}<span class="mono">${tel[1]}</span><small>${tel[2]}</small></a>` : '')
    + (lostL ? `<a class="callline" href="${lostL[1]}" target="_blank" rel="noopener">${icon('out')}<span class="mono">LOST + FOUND</span><small>${esc(lostL[0])}</small></a>` : '');
  $('#pl-when').hidden = k.type !== 'event'; $('#pl-sign').value = S.me.by || '';
  rec.classList.toggle('alarm', k.f === 'injured' || k.f === 'dead');
}
const pop = () => { const d = $('#pl-disc'); d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop'); };
$('#pl-text').addEventListener('input', debounce(() => { const p = S.place; if (!p) return; const was = p.kind; if (p.auto) p.kind = kindFrom($('#pl-text').value.toLowerCase()); const had = p.tx && p.tx.n; fillPlace(); if (p.kind !== was || (p.tx && p.tx.n) !== had) { tick(p.kind !== was ? 1200 : 2000); pop(); } }, 160));
$('#pl-text').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); placeIt(false); } });
$('#pl-kinds').addEventListener('click', e => { const b = e.target.closest('[data-k]'); const p = S.place; if (!b || !p) return; p.kind = +b.dataset.k; p.auto = false; if (PLACE_KINDS[p.kind].f === 'flora' && p.g && !['plant', 'fungi'].includes(p.g)) p.g = null; if (PLACE_KINDS[p.kind].f !== 'flora' && ['plant', 'fungi'].includes(p.g)) p.g = null; fillPlace(); tick(1200); pop(); });
$('#pl-lives').addEventListener('click', e => {
  const b = e.target.closest('[data-g]'); const p = S.place; if (!b || !p) return; const g = b.dataset.g;
  p.g = p.g === g ? null : g;
  const f = PLACE_KINDS[p.kind].f; if (p.g === 'plant' && f !== 'flora') { p.kind = PLACE_KINDS.findIndex(x => x.f === 'flora'); p.auto = false; } else if (p.g && p.g !== 'plant' && f === 'flora') { p.kind = 0; p.auto = false; }
  fillPlace(); tick(1900); pop();
});
$('#pl-here').addEventListener('click', () => {
  if (!navigator.geolocation) { toast('NO LOCATION'); return; }
  const b = $('#pl-here'); b.classList.add('busy'); tick();
  navigator.geolocation.getCurrentPosition(pos => { b.classList.remove('busy'); const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude }; if (!inBox(ll.lat, ll.lng)) { toast('OUTSIDE THE MAP'); return; } movePlace(ll); if (S.mapReady) map.easeTo({ center: [ll.lng, ll.lat], zoom: Math.max(map.getZoom(), 16), offset: sheetOffset(), duration: reduced() ? 0 : 600 }); },
    () => { b.classList.remove('busy'); toast('TAP THE MAP'); }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
});
/* a photograph from the phone, made small enough to keep on this device */
$('#pl-photo').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; if (!f || !S.place) return;
  try {
    const url = URL.createObjectURL(f); const im = await loadImage(url); const N = 720; const k = Math.min(1, N / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    S.place.photo = c.toDataURL('image/jpeg', 0.78); placeImg = await loadImage(S.place.photo); $('#pl-shot').classList.add('has'); fillPlace(); tick(2200); buzz(8);
  } catch (err) { toast('PHOTO WILL NOT OPEN'); }
  e.target.value = '';
});
/* placed: the record joins the map; NOTICED goes straight on to the W.I.S.H. card */
async function placeIt(respond) {
  const p = S.place; if (!p) return; const k = PLACE_KINDS[p.kind]; const text = $('#pl-text').value.trim(); const sign = $('#pl-sign').value.trim();
  if (k.type === 'event' && !$('#pl-when').value) { nudge($('#pl-when')); return; }
  const contact = $('#pl-contact').value.trim(); if (!contactOK(contact)) { nudge($('#pl-contact')); toast('PHONE OR EMAIL ONLY'); return; }
  if (sign) { S.me.by = sign; store.set('da.me', S.me); }
  const dp = k.type === 'need' ? 3 : 4; const tx = p.tx || (text ? speciesFrom(text.toLowerCase()) : null); const n = countFrom(text.toLowerCase());
  const g = LIFE_KINDS.includes(k.f) ? (p.g || (tx ? null : life.badgeOf(p, 20).g)) : null;
  const data = { text: text || (tx ? tx.cn : p.g && p.g !== 'paw' ? M.KINDS[p.g] : ''), ...(tx ? { tx } : {}), ...(g ? { g } : {}), ...(contact ? { contact } : {}), ...(n > 1 ? { n } : {}), ...(p.photo ? { photo: p.photo } : {}), ...(k.type === 'event' ? { start: new Date($('#pl-when').value).toISOString() } : {}) };
  const ev = { type: k.type, lat: +p.lat.toFixed(dp), lng: +p.lng.toFixed(dp), b: tx && k.type === 'noticed' ? null : k.b, who: sign, data };
  const saved = await ledgerAdd(ev); $('#pl-text').value = '';
  buzz([12, 40, 18]); snd.pluck(0.3, 0);
  const id = 'u:' + saved.key; S.mode = null; S.place = null; document.body.classList.remove('placing');
  select(id); if (respond) { const o = S.byId.get(id); if (o) setTimeout(() => toWish(o), reduced() ? 0 : 420); }
}
const holdRing = $('#hold'); let pressT = 0, pressAt = null, held = false;
/* the click that ends a hold is part of the hold, not a tap on the marker it made */
function consumeHold() { const h = held; held = false; return h; }
const ringOff = () => holdRing.classList.remove('on');
const arm = e => { if (S.mode) return; pressAt = e.point; clearTimeout(pressT); holdRing.style.left = `${e.point.x}px`; holdRing.style.top = `${e.point.y}px`; holdRing.classList.remove('on'); void holdRing.offsetWidth; holdRing.classList.add('on'); pressT = setTimeout(() => { ringOff(); if (pressAt) { pressAt = null; held = true; life.offer(null); startPlace(e.lngLat); } }, 650); };
map.on('mousedown', e => { if (e.originalEvent.button === 0 && !life.hit(e.point.x, e.point.y, true)) arm(e); });
map.on('touchstart', e => { if (e.points && e.points.length > 1) { clearTimeout(pressT); pressAt = null; ringOff(); return; } if (!life.hit(e.point.x, e.point.y, true)) arm(e); });
const disarm = e => { if (!pressAt) return; if (!e || !e.point || Math.hypot(e.point.x - pressAt.x, e.point.y - pressAt.y) > 6) { clearTimeout(pressT); pressAt = null; ringOff(); } };
map.on('mousemove', disarm); map.on('touchmove', disarm); map.on('dragstart', () => disarm()); map.on('rotatestart', () => disarm()); map.on('pitchstart', () => disarm());
const release = () => { clearTimeout(pressT); pressAt = null; ringOff(); if (held) setTimeout(() => { held = false; }, 450); };
map.on('mouseup', release); map.on('touchend', release);
