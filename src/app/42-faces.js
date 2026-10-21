/* ════════════════════════════════════════════════════════════════════
   THE FRONTS — RADIO, W.I.S.H. and PRINT each have two faces, and each face is a piece of hardware. The front is the device as
   it ships, a matte shell of smoked plastic, what is inside seen softly through it: the shortest way from a sound to a receipt.
   The back is the same device opened: clear acrylic on standoffs, its board in view, a cable plugged in, its plate, holding the
   whole studio. A slow tool and a quick act, settled by a turn of the device rather than a lesson first: the jellyfish key at its foot turns
   it over.
   ════════════════════════════════════════════════════════════════════ */
const FACED = [0, 1, 2];
/* a first visit sees the fronts alone (43-journey.js) */
const faceOf = i => (FACED.includes(i) ? (!simple() && (prefs.face || {})[i] === 'back' ? 'back' : 'front') : 'back');
function setFace(i, f) { prefs.face = { ...(prefs.face || {}), [i]: f }; savePrefs(); }
/* the key that turns a device over: the jellyfish, small and round, in the same place on every device and both its faces, at
   its foot on the right; submarine yellow on the quick side, green going to blue on the studio side. It wiggles on each page
   until it has been pressed there once */
const FLIP_SVG = '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 9V6.4C3 3.6 5.2 2 8 2s5 1.6 5 4.4V9c-1.5.6-3.2.9-5 .9S4.5 9.6 3 9z" fill="currentColor"/><path d="M4.8 10.6c-.6 1.3.6 2.1 0 3.4M7 10.9c-.6 1.5.6 2.3 0 3.8M9 10.9c-.6 1.5.6 2.3 0 3.8M11.2 10.6c-.6 1.3.6 2.1 0 3.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
const flipBtn = () => { const f = faceOf(S.view); return FACED.includes(S.view) && !simple() ? `<button type="button" class="flip-b${(prefs.flipped || {})[S.view] ? '' : ' hint'}" data-flip data-face="${f}" aria-label="${f === 'front' ? 'Turn over: the studio' : 'Turn back: the quick way'}">${FLIP_SVG}</button>` : ''; };
function flip() {
  const i = S.view; if (!FACED.includes(i) || S.mode || simple()) return; const to = faceOf(i) === 'front' ? 'back' : 'front'; snd.tick(to === 'back' ? 1250 : 1750); buzz(6);
  prefs.flipped = { ...(prefs.flipped || {}), [i]: 1 };
  const go = () => { setFace(i, to); headBar(); renderView(); viewEl.scrollTop = 0; };
  if (reduced()) { go(); return; }
  viewEl.classList.remove('flip-in'); viewEl.classList.add('flip-out');
  setTimeout(() => { go(); viewEl.classList.remove('flip-out'); viewEl.classList.add('flip-in'); setTimeout(() => viewEl.classList.remove('flip-in'), 380); }, 190);
}
document.addEventListener('click', e => { if (e.target.closest('[data-flip]')) flip(); });
/* ───────── on a phone the device rides a rail: up from the foot over the big screen, and a finger slides it up and down, never
   sideways and never larger, from all of it in view to only its head showing; the tab pressed again lowers it, and brings it
   back. Where its head stands is shared (--dev-top), so the receipt and the strip keep clear of it ───────── */
const RAIL = { y: 0, lo: 0, hi: 0, dflt: 0, key: '', drag: null };
const LIP = 58;
const railOn = () => phone() && S.open && !S.mode && S.view < 3 && !document.body.classList.contains('rec');
const railAnchor = () => viewEl.querySelector('.dev.tepra, #sec-heat, #sec-wish, #sec-out') || viewEl.firstElementChild;
function railSet(y) {
  RAIL.y = clamp(y, RAIL.hi, RAIL.lo); viewEl.style.setProperty('--rail', `${Math.round(RAIL.y)}px`);
  const a = railAnchor(); document.documentElement.style.setProperty('--dev-top', `${Math.round(Math.max(0, RAIL.y + (a ? a.offsetTop : 0)))}px`);
}
function railFit(to) {
  if (!railOn()) { viewEl.style.removeProperty('--rail'); document.documentElement.style.removeProperty('--dev-top'); RAIL.key = ''; return; }
  const avail = $('#panel').clientHeight, D = viewEl.offsetHeight; if (!avail || !D) return;
  const a = railAnchor(); const ab = a ? a.offsetTop + a.offsetHeight : D;
  RAIL.hi = avail - D; RAIL.lo = Math.max(RAIL.hi, avail - LIP); RAIL.dflt = clamp(avail - ab - 6, RAIL.hi, RAIL.lo);
  const key = `${S.view}|${faceOf(S.view)}`;
  if (to === 'lo') railSet(RAIL.lo); else if (to === 'dflt' || key !== RAIL.key) railSet(pane === 'main' ? RAIL.lo : RAIL.dflt); else railSet(RAIL.y);
  RAIL.key = key;
}
new ResizeObserver(() => { if (railOn() && !RAIL.drag) railFit(); }).observe(viewEl);
addEventListener('resize', () => railFit());
viewEl.addEventListener('pointerdown', e => {
  if (!railOn() || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('input, textarea, select, [contenteditable]')) return;
  RAIL.drag = { id: e.pointerId, y0: e.clientY, r0: RAIL.y, on: false };
});
addEventListener('pointermove', e => {
  const d = RAIL.drag; if (!d || e.pointerId !== d.id) return; const dy = e.clientY - d.y0;
  if (!d.on) { if (Math.abs(dy) < 8) return; d.on = true; document.body.classList.add('railing'); }
  railSet(d.r0 + dy);
});
function railEnd(e) {
  const d = RAIL.drag; if (!d || e.pointerId !== d.id) return; RAIL.drag = null; if (!d.on) return;
  document.body.classList.remove('railing');
  /* a slide is not a press: the click that ends it is let go */
  if (e.type === 'pointerup') { const stop = ev => { ev.stopPropagation(); ev.preventDefault(); }; addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => removeEventListener('click', stop, { capture: true }), 400); }
  pane = RAIL.y >= RAIL.lo - 8 ? 'main' : 'page'; syncDock();
}
addEventListener('pointerup', railEnd); addEventListener('pointercancel', railEnd);

/* what an opened device shows: its board at the head, four standoffs, one cable plugged in, and its plate: its name, its step */
const mods = (n, st) => `<i class="mod-cap" aria-hidden="true"></i>${['tl', 'tr', 'bl', 'br'].map(c => `<i class="mod-bolt ${c}" aria-hidden="true"></i>`).join('')}<i class="mod-cable" aria-hidden="true"></i><span class="mod-label" data-n="${n}" data-st="${st}" aria-hidden="true"><i></i></span>`;

/* ───────── RADIO, the front: a smoked radio, matte. A speaker behind the grille, one key, play; a knob for each track, off and
   three levels; the steps under it ───────── */
const KNOB_A = [-135, -45, 45, 135];
const knobPos = k => (trackOn(k) ? volStep(k) + 1 : 0);
/* the El Niño switch, on both faces of the radio: one setting, one speed */
const ninoSwitch = () => `<button type="button" class="rd-nino${prefs.nino ? ' on' : ''}" data-nino role="switch" aria-checked="${!!prefs.nino}" aria-label="El Niño: 120 BPM" data-tip="El Niño · 120 BPM"><i class="rn-lever" aria-hidden="true"></i></button><b class="rn-tag" aria-hidden="true">EL NIÑO</b>`;
function radioFront() {
  const first = !S.started && !prefs.placed;
  return `<section class="band front-r" id="sec-heat"><div class="dev radio"><i class="hack h-jump" aria-hidden="true"></i>`
    + `${ninoSwitch()}`
    + `<div class="rd-top"><i class="rd-grille" aria-hidden="true"></i><button type="button" class="rd-play${S.radio ? ' on' : ''}" data-radio aria-pressed="${S.radio}" aria-label="${first ? 'Play the example' : 'Play'}"><i class="rd-led" aria-hidden="true"></i>${icon(S.radio ? 'pause' : 'play')}</button></div>`
    + `${knobsHTML()}${flipBtn()}</div></section>`;
}
/* a knob for each layer: off, then three levels, its ticks lit as far as it is turned, its layer's mark under it */
const knobsHTML = () => `<ol class="rd-knobs">${LAYERS.map(L => { const p = knobPos(L.k); return `<li class="rd-k${p ? ' on' : ''}" data-lyr="${L.k}"><button type="button" class="rd-knob" data-knob="${L.k}" role="slider" aria-label="${L.w}" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${p}" style="--a:${KNOB_A[p]}deg"><i class="kn-ind"></i></button>`
  + `<i class="kn-ticks" aria-hidden="true">${[1, 2, 3].map(n => `<b${n <= p ? ' class="on"' : ''}></b>`).join('')}</i><span class="kn-ic" aria-hidden="true">${icon(L.ic, 'sm')}</span></li>`; }).join('')}</ol>`;
/* a knob turned: a click goes round, off, one, two, three; arrow keys step and stop at the ends */
function turnKnob(k, d, stop) {
  const p0 = knobPos(k); let p = p0 + d; p = stop ? clamp(p, 0, 3) : (p + 4) % 4; if (p === p0) { tick(600); return; }
  if (!p) setTrack4(k, false); else { prefs.lvl = { ...(prefs.lvl || {}), [k]: VOLS[p - 1] }; savePrefs(); if (!trackOn(k)) setTrack4(k, true); }
  const b = $(`#view [data-knob="${k}"]`); if (b) { b.style.setProperty('--a', `${KNOB_A[p]}deg`); b.setAttribute('aria-valuenow', String(p)); const li = b.closest('.rd-k'); li.classList.toggle('on', !!p); li.querySelectorAll('.kn-ticks b').forEach((x, n) => x.classList.toggle('on', n < p)); }
  snd.tick(800 + p * 320); buzz(4);
}
viewEl.addEventListener('click', e => { const k = e.target.closest('[data-knob]'); if (k) turnKnob(k.dataset.knob, 1, false); });
/* the red switch: El Niño at 120 BPM. It is the same setting as an extreme month chosen on the studio side: on, the outlook
   moves to the first extreme month ahead; off, back to now; and an extreme month chosen there turns it on */
function setNino(on) {
  on = !!on; if (!!prefs.nino === on) return; prefs.nino = on; savePrefs(); document.body.classList.toggle('nino', on);
  $$('#view [data-nino]').forEach(b => { b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); life.moved(); life.redraw();
}
viewEl.addEventListener('click', e => {
  const b = e.target.closest('[data-nino]'); if (!b) return; const on = !prefs.nino; setNino(on);
  const ext = [...Array(OUT_N).keys()].find(k => k > nowK() && outMonth(k).lv >= 4); S.mo = on && ext != null ? ext : nowK(); S.moRead = null; life.data();
  snd.tick(on ? 2400 : 900); buzz(on ? [10, 20, 10] : 6);
});
viewEl.addEventListener('keydown', e => { const k = e.target.closest('[data-knob]'); if (!k) return; const d = /Right|Up/.test(e.key) ? 1 : /Left|Down/.test(e.key) ? -1 : 0; if (!d) return; e.preventDefault(); e.stopPropagation(); turnKnob(k.dataset.knob, d, true); });
/* once the radio has played a while, and no W.I.S.H. is begun, its tab glows until it is opened */
let nudgeT = 0;
function nudgeWishSoon() { clearTimeout(nudgeT); nudgeT = setTimeout(() => { if (S.radio && S.view !== 1 && !wishStarted()) { const t = $('#rail .tab[data-i="1"]'); if (t) t.classList.add('nudge'); } }, 6500); }
function unNudge(i) { if (i === 1) { const t = $('#rail .tab[data-i="1"]'); if (t) t.classList.remove('nudge'); } }

/* ───────── W.I.S.H.: a handheld in smoked jade. The front asks one thing, I, the intention, and takes a photograph if one is
   given; the receipt beside it shows it as it will print. The back is the same handheld opened: the poem's four lines on its
   screen, each showing what its letter stands for until it is written, the name, the photograph ───────── */
function wishDevice(back) {
  const where = suburbAt(S.scan.lat, S.scan.lng); const L = WDRAFT;
  const photo = L.photo ? `<span class="vs-ph"><img src="${L.photo}" alt=""><button type="button" class="vs-phx" data-vs="unphoto" aria-label="Take the photograph off">${icon('close', 'sm')}</button></span>` : '';
  return `<section class="sec ${back ? 'back-w' : 'front-w'}" id="sec-wish"><form class="wish-form visor${back ? ' mod' : ''}" id="wish-form" autocomplete="off"><div class="dev vs-body">${back ? mods('DIRECT ACTION', 'W.I.S.H.') : '<i class="hack h-ant" aria-hidden="true"></i><i class="hack h-pins" aria-hidden="true"></i>'}<i class="vs-rib l" aria-hidden="true"></i><i class="vs-rib r" aria-hidden="true"></i>`
    + `<div class="vs-screen"><div class="vs-bar"><b class="vs-tab">${back ? 'W.I.S.H.' : 'INTENTION'}</b><span class="vs-now">${esc(String(where || '').toUpperCase())} ${fmtClock(Date.now())}</span></div>`
    + `<label class="vs-i" data-tip="Intention">${back ? '<b class="vs-m wf-m" aria-hidden="true">I</b>' : ''}<textarea id="wf-for" rows="1" maxlength="90" autocomplete="off" spellcheck="false" aria-label="Intention" placeholder=" ">${esc(String(L.for || '').replace(/^[lce]:/, ''))}</textarea><i class="vs-cur" aria-hidden="true"></i></label><ol class="vs-sug" id="wf-sug" hidden></ol>`
    + (back ? `<ol class="vs-poem">${WKEYS.map(k => `<li data-tip="${esc(WISH[k][1])}"><b class="wf-m" aria-hidden="true">${k.toUpperCase()}</b><textarea id="wf-${k}" rows="2" maxlength="${SIG.line}" aria-label="${esc(WISH[k][0])}" placeholder="${esc(WISH[k][0])}" spellcheck="true">${esc(L[k] || '')}</textarea></li>`).join('')}</ol>`
      + `<label class="vs-by" data-tip="By"><b class="wf-m" aria-hidden="true">BY</b><input id="wf-by" type="text" maxlength="40" value="${esc(L.by || S.me.by || '')}" aria-label="By" spellcheck="false"></label>` : '')
    + `<div class="vs-att">${photo}<button type="button" class="vs-cam vs-clr" data-pick="wish" aria-label="Select: art, songs, stickers, lives">${icon('plus')}</button><button type="button" class="vs-cam vs-clr" data-vs="clear" aria-label="Clear">${icon('close')}</button><label class="vs-cam" aria-label="A photograph: take one, or choose one">${icon('camera')}<input type="file" id="wf-photo" accept="image/*" hidden></label></div></div>`
    + `<div class="vs-keys"><button type="submit" class="vs-make make-b${String(L.for || '').trim() ? ' next' : ''}" aria-label="Make the W.I.S.H."><i class="vs-oval"></i><b>make</b></button></div>`
    + `${flipBtn()}</div></form></section>`;
}
const wishFront = () => wishDevice(false);
viewEl.addEventListener('input', e => { if (!e.target.closest('#wish-form')) return; wishPreview(); if (e.target.id === 'wf-for') { const mk = $('#view .vs-make'); if (mk) mk.classList.toggle('next', !!e.target.value.trim()); } });
viewEl.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.target.closest('.vs-poem textarea') || e.target.id === 'wf-for')) e.preventDefault(); if (e.key === 'Escape' && e.target.id === 'wf-for') sugShow(false); });
const growTA = el => { if (!el) return; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; };
let INTENTS = null, SUGON = false;
const intentList = () => INTENTS || (INTENTS = [...intentOptions().matchAll(/value="([^"]*)"/g)].map(m => { const t = document.createElement('textarea'); t.innerHTML = m[1]; return t.value; }));
function sugShow(on) {
  const ol = $('#wf-sug'), f = $('#wf-for'); if (!ol || !f) return; if (!on) { ol.hidden = true; return; }
  const q = f.value.trim().toLowerCase(); const ops = intentList().filter(x => !q || x.toLowerCase().includes(q)).filter(x => x.toLowerCase() !== q).slice(0, 5);
  ol.innerHTML = ops.map(x => `<li><button type="button" data-sug="${esc(x)}">${esc(x)}</button></li>`).join(''); ol.hidden = !ops.length;
}
viewEl.addEventListener('focusin', e => { if (e.target.id === 'wf-for' && SUGON) sugShow(true); });
viewEl.addEventListener('focusout', e => { if (e.target.id === 'wf-for') setTimeout(() => sugShow(false), 180); });
viewEl.addEventListener('input', e => { if (e.target.id === 'wf-for') { growTA(e.target); if (SUGON) sugShow(true); } if (e.target.closest('.vs-poem textarea')) e.target.classList.remove('need'); });
viewEl.addEventListener('click', e => { const b = e.target.closest('[data-sug]'); if (!b) return; const f = $('#wf-for'); f.value = b.dataset.sug; f.dispatchEvent(new Event('input', { bubbles: true })); growTA(f); sugShow(false); snd.tick(1700); });
viewEl.addEventListener('click', e => {
  const b = e.target.closest('[data-vs]'); if (!b) return;
  if (b.dataset.vs === 'clear') { for (const k of ['for', ...WKEYS]) { const el = $('#wf-' + k); if (el) el.value = ''; WDRAFT[k] = ''; } WDRAFT.auto = {}; WDRAFT.photo = ''; WDRAFT.act = ''; store.set('da.wish.v1', WDRAFT); refreshPanel(); wishPreview(); snd.tick(900); }
  if (b.dataset.vs === 'sug') { SUGON = !SUGON; b.setAttribute('aria-pressed', String(SUGON)); sugShow(SUGON); snd.tick(SUGON ? 1700 : 1000); return; }
  if (b.dataset.vs === 'unphoto') { WDRAFT.photo = ''; store.set('da.wish.v1', WDRAFT); refreshPanel(); wishPreview(); snd.tick(1000); }
});
/* a photograph for the W.I.S.H., taken or chosen: made small here, and printed at the head of its receipt */
viewEl.addEventListener('change', e => {
  if (e.target.id !== 'wf-photo') return; const fl = e.target.files && e.target.files[0]; if (!fl) return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    WDRAFT.photo = c.toDataURL('image/jpeg', 0.8); if (!store.set('da.wish.v1', WDRAFT)) { WDRAFT.photo = c.toDataURL('image/jpeg', 0.55); store.set('da.wish.v1', WDRAFT); } refreshPanel(); wishPreview(); tick(1800); buzz(6); }; im.src = rd.result; };
  rd.readAsDataURL(fl); e.target.value = '';
});
/* the receipt as it will print, beside the handheld, drawn again as the lines change */
function draftSignal() {
  const L = Object.fromEntries(WKEYS.map(k => [k, String(WDRAFT[k] || '').trim()])); const fr = String(WDRAFT.for || '').replace(/^[lce]:/, '').trim(); const lat = +S.scan.lat.toFixed(4), lng = +S.scan.lng.toFixed(4); const place = suburbAt(S.scan.lat, S.scan.lng);
  return { v: 1, code: 'DA-····', at: Date.now(), pin: { id: null, lat, lng, n: '', cn: place, ic: '', g: 'paw', place }, threat: '', when: '', deg: 0, lines: L, nodes: [], edges: [], who: WDRAFT.by || S.me.by || '', ...(fr ? { for: fr, note: fr } : {}), ...(WDRAFT.photo ? { img: { k: 'own', a: '' }, photo: WDRAFT.photo } : {}) };
}
let pvN = 0;
const ACTIONS = [{"k": "people", "ic": "people", "for": "Check on a neighbour", "w": "Heat kills more Australians than any disaster", "i": "No one on our street alone on a 35° day", "s": "Call or knock twice on every hot day", "h": "Dizzy, confused, not sweating: call 000"}, {"k": "houses", "ic": "heat", "for": "Cool the house", "w": "A shut blind keeps the sun out of the room", "i": "A cool room in every home on the street", "s": "Close blinds and curtains by 9 am", "h": "Open up when the cool change comes"}, {"k": "pets", "ic": "paw", "for": "Keep pets cool", "w": "Hot paths can burn paws", "i": "Pets in shade, with water, all day", "s": "Two bowls of water, in the shade", "h": "Walk before 8 am; test the path by hand"}, {"k": "animals", "ic": "water", "for": "Water for wildlife", "w": "Birds and flying-foxes suffer in heatwaves", "i": "Water in reach for every small life", "s": "Shallow dish, stones to climb out, in shade", "h": "Animal down? Wildlife Victoria 03 8400 7300"}, {"k": "street", "ic": "tree", "for": "Water a street tree", "w": "Young street trees die in a dry summer", "i": "Every young tree on our street lives", "s": "A bucket of water a week at its base", "h": "Ask the council for a tree outside"}, {"k": "shade", "ic": "shade", "for": "Make shade", "w": "Shaded ground is far cooler than bare", "i": "Shade where people wait and play", "s": "Plant a deciduous tree on the west side", "h": "Ask for shade at the bus stop"}, {"k": "voting", "ic": "check", "for": "Vote for cooler streets", "w": "Victoria votes on 28 November 2026", "i": "Every candidate asked about heat", "s": "Check you are enrolled: vec.vic.gov.au", "h": "Ask your candidates for their canopy plan"}];
/* the big screen beside the quick W.I.S.H.: real actions to take up, each with its steps, so every receipt is a reminder of
   something to do; the receipt as it will print (pressed, close up, within the screen); and the lives the radar holds that the
   heat ahead puts most at risk, animals first, few insects, no plants, each pressed to add it to the intention */
function needLives(n = 6) {
  const seen = new Set(), out = []; let ins = 0;
  const its = life.items.filter(it => it.inS && !it.o.story && !it.o.pack && !it.o.hist && !it.o.hum && !isCold(it.o) && it.b.tone !== 'flora').sort((a, b) => (b.o.hero ? 1 : 0) - (a.o.hero ? 1 : 0) || degOf(b.o) - degOf(a.o) || (b.b.tier || 0) - (a.b.tier || 0));
  for (const it of its) { const sp = spOf(it.o); const k = sp.latin || sp.n; if (!sp.ph || seen.has(k)) continue; const grp = M.GROUP[sp.g]; if (grp === 'insect' || grp === 'spider') { if (ins >= 1) continue; ins++; } seen.add(k); out.push(sp); if (out.length >= n) break; }
  return out;
}
const wishPreview = debounce(async () => {
  const cov = $('#cover'); if (!cov) return; if (!(S.open && S.view === 1 && faceOf(1) === 'front' && !S.mode)) { cov.replaceChildren(); return; }
  const my = ++pvN; const cvs = await slipCanvas(draftSignal(), 384, 2, false, false).catch(() => null); if (!cvs || my !== pvN || faceOf(1) !== 'front' || S.view !== 1) return;
  let fig = cov.querySelector('.wpv');
  if (!fig) {
    fig = document.createElement('div'); fig.className = 'wpv';
    fig.innerHTML = `<button type="button" class="wpv-ex" data-wpv="ex" aria-pressed="false" aria-label="Examples to remix">${icon('stories')}</button><div class="wpv-show"><ol class="wpv-acts" aria-label="Actions to take up">${ACTIONS.map(a => `<li><button type="button" class="act-b" data-act="${a.k}"><i class="act-ic">${M.ICONS[a.ic] ? icon(a.ic) : glyphSVG(a.ic)}</i><b>${esc(a.for)}</b><small>${esc(a.s)}</small><small>${esc(a.h)}</small></button></li>`).join('')}</ol><ul class="wpv-eco"></ul></div><figure class="wpv-r"><img alt="" data-zoom></figure>`;
    cov.replaceChildren(fig);
  }
  $$('#cover [data-act]').forEach(b => b.classList.toggle('on', WDRAFT.act === b.dataset.act));
  fig.querySelector('.wpv-r img').src = cvs.toDataURL('image/png');
  fig.querySelector('.wpv-eco').innerHTML = needLives(6).map(sp => `<li><button type="button" class="eco-b" data-eco="${esc(sp.n)}" aria-label="${esc(sp.n)}" data-tip="${esc(sp.n)}"><img src="${esc(sp.ph)}" alt="" loading="lazy"></button>${/^\d+$/.test(sp.id) ? `<a class="eco-l" href="https://www.inaturalist.org/observations/${sp.id}" target="_blank" rel="noopener" aria-label="The sighting">${icon('out', 'sm')}</a>` : ''}</li>`).join('');
}, 320);
document.addEventListener('click', e => {
  if (!e.target.closest('#cover')) return;
  const tg = e.target.closest('[data-wpv]'); if (tg) { const w = $('#cover .wpv'); const k = tg.dataset.wpv; const on = !w.classList.contains('show-' + k); w.classList.toggle('show-' + k, on); tg.setAttribute('aria-pressed', String(on)); tick(on ? 1500 : 1000); return; }
  const z = e.target.closest('[data-zoom]'); if (z) { zoomArt(z.src, $('#cover')); return; }
  const a = e.target.closest('[data-act]'); if (a) { const A = ACTIONS.find(x => x.k === a.dataset.act); if (!A) return; const off = WDRAFT.act === A.k; for (const k of WKEYS) WDRAFT[k] = off ? '' : A[k]; WDRAFT.act = off ? '' : A.k; store.set('da.wish.v1', WDRAFT); wishPreview(); snd.tick(off ? 1000 : 1800); buzz(5); return; }
  const b = e.target.closest('[data-eco]'); if (b) { const im = b.querySelector('img'); if (!im) return; thumbOf(im.src, 700).then(u => { WDRAFT.photo = u; store.set('da.wish.v1', WDRAFT); refreshPanel(); wishPreview(); }).catch(() => tick(600)); snd.tick(1700); buzz(5); }
});
const fillWDraftFor = () => { const f = $('#wf-for'); if (f) { WDRAFT.for = f.value; store.set('da.wish.v1', WDRAFT); } wishPreview(); };

/* ───────── PRINT, the front: a label maker in matte graphite, its board seen through a smoked cap. Its screen holds the words
   to set; three keys, words, a sticker, a photograph; and one key, the printer, that prints. The printer's name and state stay
   out of sight until its light is pressed ───────── */
const TP_KEYS = [['text', '', 'teal', 'Words'], ['pick', 'plus', 'green', 'Select: art, songs, stickers, lives'], ['image', 'camera', 'orange', 'A photograph'], ['undo', 'undo', 'grey', 'Undo: or take off what is chosen']];
function printFront() {
  const s = pressStory(); const on = printersOn(); const p = on[0] || MASTER;
  return `<section class="sec front-p" id="sec-out"><div class="dev tepra"><i class="hack h-tie" aria-hidden="true"></i><i class="hack h-lora" aria-hidden="true"></i><i class="hack h-node" aria-hidden="true"></i><div class="tp-lid" aria-hidden="true"><i class="tp-win"></i><i class="tp-latch"></i></div>`
    + `<label class="tp-lcd"><span class="tp-l1">${s ? esc(s.code) : '80 MM'}</span><span class="tp-info" id="tp-info" hidden><b>${esc(String(p ? p.n : 'novel.global').toUpperCase())}</b><small>${on.length ? 'ONLINE' : 'OFFLINE · PRINTS WAIT 24 H'}</small></span><input id="tp-words" maxlength="80" spellcheck="true" autocomplete="off" placeholder=" " aria-label="Words for the strip"><i class="tp-cur" aria-hidden="true"></i></label>`
    + `<div class="tp-keys">${TP_KEYS.map(([k, ic, c, w]) => `<button type="button" class="tp-k tk-${c}" data-tp="${k}" aria-label="${w}">${k === 'text' ? '<b>Aa</b>' : icon(ic)}</button>`).join('')}</div>`
    + `<div class="tp-foot"><button type="button" class="print-k tp-prn${on.length ? ' on' : ''}${s ? ' next' : ''}" data-pout="send" aria-label="Print receipt">${icon('epson')}</button><button type="button" class="tp-i${on.length ? ' on' : ''}" data-prn aria-expanded="false" aria-label="The printer: its name and state"><i class="tp-led"></i></button></div>`
    + `${flipBtn()}</div></section>`;
}
viewEl.addEventListener('click', e => { const o = e.target.closest('[data-outs]'); if (!o) return; const sec = o.closest('#sec-out'); const on = !sec.classList.contains('open'); sec.classList.toggle('open', on); o.setAttribute('aria-expanded', String(on)); tick(on ? 1500 : 1000); });
viewEl.addEventListener('click', e => {
  const k = e.target.closest('[data-tp]'); if (k) { if (k.dataset.tp === 'pick') { openPick('strip'); return; } if (k.dataset.tp === 'undo') { const sel = zc ? zc.getActiveObjects().filter(o => !ZFIXED.includes(o.daKind)) : []; zineTool(sel.length ? 'delete' : 'undo'); return; } zineTool(k.dataset.tp); return; }
  const pr = e.target.closest('[data-prn]'); if (pr) { const i = $('#tp-info') || $('#ps-info'); if (!i) return; i.hidden = !i.hidden; pr.setAttribute('aria-expanded', String(!i.hidden)); snd.tick(i.hidden ? 1100 : 1800); buzz(5); }
});
