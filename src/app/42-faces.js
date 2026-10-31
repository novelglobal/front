/* ════════════════════════════════════════════════════════════════════
   THE FRONTS — RADIO, W.I.S.H. and PRINT each have two faces, and each face is a piece of hardware. The front is the small
   device a first visit walks through, the same for everyone after it: a radio half its height, the intention device over the
   map, PRINT's dongle with SELECT its hero. Each is old analogue kit, modded: smoked shells, odd screws, a stub antenna, a pin
   header, a cable tie. Once everything is open each front shows its upgrade, a LoRa module with its antenna and wires, and the
   jellyfish key on a small board of its own: the mod that turns it over. The back is the same device opened: clear acrylic on standoffs, its
   board in view, a cable plugged in, its plate, holding the whole studio.
   ════════════════════════════════════════════════════════════════════ */
const FACED = [0, 1, 2];
/* a first visit sees the fronts alone (43-journey.js) */
const faceOf = i => (FACED.includes(i) ? (!simple() && (prefs.face || {})[i] === 'back' ? 'back' : 'front') : 'back');
function setFace(i, f) { prefs.face = { ...(prefs.face || {}), [i]: f }; savePrefs(); }
/* a connection laid on the board on purpose: W.I.S.H. opens on its board, the blueprint, not its front */
const toBoardFace = () => { if (!simple()) setFace(1, 'back'); };
/* the key that turns a device over: the jellyfish, small and round, in the same place on every device and both its faces, at
   its foot on the right; submarine yellow on the quick side, green going to blue on the studio side. It wiggles on each page
   until it has been pressed there once */
const FLIP_SVG = '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 9V6.4C3 3.6 5.2 2 8 2s5 1.6 5 4.4V9c-1.5.6-3.2.9-5 .9S4.5 9.6 3 9z" fill="currentColor"/><path d="M4.8 10.6c-.6 1.3.6 2.1 0 3.4M7 10.9c-.6 1.5.6 2.3 0 3.8M9 10.9c-.6 1.5.6 2.3 0 3.8M11.2 10.6c-.6 1.3.6 2.1 0 3.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
const flipBtn = () => { const f = faceOf(S.view); return FACED.includes(S.view) && !simple() ? `<button type="button" class="flip-b${(prefs.flipped || {})[S.view] ? '' : ' hint'}" data-flip data-face="${f}" aria-label="${f === 'front' ? 'Turn over: the studio' : 'Turn back: the quick way'}">${FLIP_SVG}</button>` : ''; };
function flip() {
  const i = S.view; if (!FACED.includes(i) || S.mode || simple()) return; const to = faceOf(i) === 'front' ? 'back' : 'front'; snd.tick(to === 'back' ? 1250 : 1750);
  prefs.flipped = { ...(prefs.flipped || {}), [i]: 1 };
  const go = () => { setFace(i, to); headBar(); renderView(); viewEl.scrollTop = 0; };
  if (reduced()) { go(); return; }
  /* the other face at once, settling in one short turn: never faded out and back. The page's own fade (.in) is taken off first: left on, it ran again from nothing as the turn ended, and the device strobed */
  viewEl.classList.remove('flip-in', 'flip-out', 'in'); go(); void viewEl.offsetWidth; viewEl.classList.add('flip-in'); setTimeout(() => viewEl.classList.remove('flip-in'), 280);
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
  if (e.type === 'pointerup') { const stop = ev => { if (!ev.isTrusted) return; ev.stopPropagation(); ev.preventDefault(); removeEventListener('click', stop, { capture: true }); }; addEventListener('click', stop, { capture: true }); setTimeout(() => removeEventListener('click', stop, { capture: true }), 400); }
  pane = RAIL.y >= RAIL.lo - 8 ? 'main' : 'page'; if (pane === 'main' && viewEl.contains(document.activeElement)) document.activeElement.blur(); syncDock();
}
addEventListener('pointerup', railEnd); addEventListener('pointercancel', railEnd);

/* what an opened device shows: its board at the head, four standoffs, one cable plugged in, and its plate: its name, its step */
const mods = (n, st) => `<i class="mod-cap" aria-hidden="true"></i>${['tl', 'tr', 'bl', 'br'].map(c => `<i class="mod-bolt ${c}" aria-hidden="true"></i>`).join('')}<i class="mod-cable" aria-hidden="true"></i><span class="mod-label" data-n="${n}" data-st="${st}" aria-hidden="true"><i></i></span>`;

/* ───────── the upgrade, once everything is open: a LoRa module glued on at the head, its stubby antenna and its jumper wires, a
   run of cable down the side to the jellyfish key on a small board of its own. A first visit's devices have none of it ───────── */
const upMods = () => (simple() ? '' : '<i class="hack up-lora" aria-hidden="true"></i><i class="hack up-run" aria-hidden="true"></i><i class="hack up-plate" aria-hidden="true"></i>');
const upCls = () => (simple() ? '' : ' upg');
/* two screws that do not match, as a device opened and closed again by hand would have */
const SCREWS = '<i class="hack h-screw a" aria-hidden="true"></i><i class="hack h-screw b" aria-hidden="true"></i>';

/* ───────── RADIO, the front: the smoked radio at half its height. The El Niño switch, the grille, play, a knob for each layer,
   in one row ───────── */
const KNOB_A = [-135, -81, -27, 27, 81, 135];
/* a knob is a layer's filter: off, then MIST, HALL, DEPTH, BLOOM, LUNG; the level stays where it is */
const knobPos = k => (trackOn(k) ? FXS.indexOf(fxOf(k)) + 1 : 0);
/* the El Niño switch, on both faces of the radio: one setting, one speed */
const ninoSwitch = () => `<button type="button" class="rd-nino${prefs.nino ? ' on' : ''}" data-nino role="switch" aria-checked="${!!prefs.nino}" aria-label="El Niño: 120 BPM" data-tip="El Niño · 120 BPM"><i class="rn-lever" aria-hidden="true"></i></button><b class="rn-tag" aria-hidden="true">EL NIÑO</b>`;
function radioFront() {
  return `<section class="band front-r simple-r" id="sec-heat"><div class="dev radio jr-dev${upCls()}"><i class="hack h-jump" aria-hidden="true"></i>${SCREWS}${ninoSwitch()}`
    + `<i class="rd-grille" aria-hidden="true"></i><button type="button" class="rd-play${S.radio ? ' on' : ''}" data-radio aria-pressed="${S.radio}" aria-label="${!S.started && !prefs.placed ? 'Play the example' : 'Play'}"><i class="rd-led" aria-hidden="true"></i>${icon(S.radio ? 'pause' : 'play')}</button>`
    + `${knobsHTML()}${upMods()}${flipBtn()}</div></section>`;
}
/* a knob for each layer: off, then three levels, its ticks lit as far as it is turned, its layer's mark under it */
const knobsHTML = () => `<ol class="rd-knobs">${LAYERS.map(L => { const p = knobPos(L.k); return `<li class="rd-k${p ? ' on' : ''}" data-lyr="${L.k}"><button type="button" class="rd-knob" data-knob="${L.k}" role="slider" aria-label="${L.w}" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${p}" aria-valuetext="${p ? FXS[p - 1].toUpperCase() : 'OFF'}" data-tip="${L.w} · ${p ? FXS[p - 1].toUpperCase() : 'OFF'}" style="--a:${KNOB_A[p]}deg"><i class="kn-ind"></i></button>`
  + `<i class="kn-ticks" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<b${n <= p ? ' class="on"' : ''}></b>`).join('')}</i><span class="kn-ic" aria-hidden="true">${icon(L.ic, 'sm')}</span></li>`; }).join('')}</ol>`;
/* a knob turned: a click goes round, off, one, two, three; arrow keys step and stop at the ends */
function turnKnob(k, d, stop) {
  const p0 = knobPos(k); let p = p0 + d; p = stop ? clamp(p, 0, 5) : (p + 6) % 6; if (p === p0) { tick(600); return; }
  if (!p) setTrack4(k, false); else { prefs.fx = { ...(prefs.fx || {}), [k]: FXS[p - 1] }; savePrefs(); if (!trackOn(k)) setTrack4(k, true); }
  const b = $(`#view [data-knob="${k}"]`); if (b) { b.style.setProperty('--a', `${KNOB_A[p]}deg`); b.setAttribute('aria-valuenow', String(p)); b.setAttribute('aria-valuetext', p ? FXS[p - 1].toUpperCase() : 'OFF'); b.dataset.tip = `${b.getAttribute('aria-label')} · ${p ? FXS[p - 1].toUpperCase() : 'OFF'}`; const li = b.closest('.rd-k'); li.classList.toggle('on', !!p); li.querySelectorAll('.kn-ticks b').forEach((x, n) => x.classList.toggle('on', n < p)); }
  snd.tick(800 + p * 320);
  /* turned to an instrument, the layer is heard through it at once: a note of its own, then two more */
  if (p && prefs.sound) { const spec = k === 'life' ? { g: 'bird' } : k === 'water' ? { g: 'aquatic' } : { fam: k === 'pollution' ? 'brand' : 'third' }; const f0 = F0 * partialOf(spec.g || spec.fam);
    [0, 1, 2].forEach(i => setTimeout(() => snd.ping(spec, f0 * [1, 1.5, 2][i], { mood: moodOfLayer(k), v: 0.05, pan: (i - 1) * 0.4, cluster: i === 2, fx: FXS[p - 1] }), 120 + i * 260)); }
}
viewEl.addEventListener('click', e => { const k = e.target.closest('[data-knob]'); if (k) turnKnob(k.dataset.knob, 1, false); });
/* the red switch: El Niño. Everything is at 120 BPM already, so it changes heat, not speed: the sound opened and harder, the
   radar red. It is the same setting as an extreme month chosen on the studio side: on, the outlook moves to the first extreme
   month ahead; off, back to now; and an extreme month chosen there turns it on */
function setNino(on) {
  on = !!on; if (!!prefs.nino === on) return; prefs.nino = on; savePrefs(); document.body.classList.toggle('nino', on); snd.heat(on);
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
  return `<section class="sec ${back ? 'back-w' : 'front-w'}" id="sec-wish"><form class="wish-form visor${back ? ' mod' : ''}" id="wish-form" autocomplete="off"><div class="dev vs-body${back ? upCls() : ''}">${back ? mods('DIRECT ACTION', 'W.I.S.H.') + upMods() : '<i class="hack h-ant" aria-hidden="true"></i><i class="hack h-pins" aria-hidden="true"></i>'}<i class="vs-rib l" aria-hidden="true"></i><i class="vs-rib r" aria-hidden="true"></i>`
    + `<div class="vs-screen"><div class="vs-bar"><b class="vs-tab">${back ? 'W.I.S.H.' : 'INTENTION'}</b><span class="vs-now">${esc(String(where || '').toUpperCase())} ${fmtClock(Date.now())}</span></div>`
    + `<label class="vs-i" data-tip="Intention">${back ? '<b class="vs-m wf-m" aria-hidden="true">I</b>' : ''}<textarea id="wf-for" rows="1" maxlength="90" autocomplete="off" spellcheck="false" aria-label="Intention" placeholder=" ">${esc(String(L.for || '').replace(/^[lce]:/, ''))}</textarea><i class="vs-cur" aria-hidden="true"></i></label><ol class="vs-sug" id="wf-sug" hidden></ol>`
    + (back ? `<ol class="vs-poem">${WKEYS.map(k => `<li data-tip="${esc(WISH[k][1])}"><b class="wf-m" aria-hidden="true">${k.toUpperCase()}</b><textarea id="wf-${k}" rows="2" maxlength="${SIG.line}" aria-label="${esc(WISH[k][0])}" placeholder="${esc(WISH[k][0])}" spellcheck="true">${esc(L[k] || '')}</textarea></li>`).join('')}</ol>`
      + `<label class="vs-by" data-tip="By"><b class="wf-m" aria-hidden="true">BY</b><input id="wf-by" type="text" maxlength="40" value="${esc(L.by || S.me.by || '')}" aria-label="By" spellcheck="false"></label>` : '')
    + `<div class="vs-att">${photo}<button type="button" class="vs-cam vs-clr" data-pick="wish" aria-label="Select: art, songs, stickers, lives">${icon('plus')}</button><button type="button" class="vs-cam vs-clr" data-vs="clear" aria-label="Clear">${icon('close')}</button><input type="file" id="wf-photo" accept="image/*" hidden></div></div>`
    + `<div class="vs-keys"><button type="submit" class="vs-make make-b${String(L.for || '').trim() ? ' next' : ''}" aria-label="Make the W.I.S.H."><i class="vs-oval"></i><b>make</b></button></div>`
    + `${flipBtn()}</div></form></section>`;
}
/* ───────── W.I.S.H., the front: the intention device, the radio's size, over the map: its screen that asks for the intention,
   the key that opens the suggestions, and make. A handheld in smoked jade, its grip on one side, a stub LoRa antenna at its
   corner (the upgrade's own module takes its place once everything is open), a pin header at its foot ───────── */
function wishFront() {
  return `<section class="sec front-w simple-w" id="sec-wish"><form class="wish-form visor jw" id="jw-form" autocomplete="off"><div class="dev vs-body jr-dev${upCls()}"><i class="vs-rib l" aria-hidden="true"></i><i class="hack h-lora" aria-hidden="true"></i>${SCREWS}<i class="hack h-pins" aria-hidden="true"></i>`
    + `<div class="vs-screen"><div class="vs-bar"><b class="vs-tab">INTENTION</b><span class="vs-now">${esc(jNowW())}</span></div>`
    + `<label class="vs-i"><textarea id="jw-for" rows="2" maxlength="90" enterkeyhint="go" autocomplete="off" spellcheck="true" aria-label="Intention" placeholder=" ">${esc(JR.want || '')}</textarea><i class="vs-cur" aria-hidden="true"></i></label>`
    /* where SELECT once was: the key that opens the suggestions beside the receipt */
    + `<button type="button" class="vs-sg" data-jtab aria-expanded="false" aria-label="Suggestions">${icon('stories')}<b class="jt-n" aria-hidden="true"></b></button></div>`
    + `<button type="submit" class="vs-make make-b${jWants() ? ' next' : ''}" aria-label="Make the W.I.S.H."><b>make</b></button>`
    + `${upMods()}${flipBtn()}</div></form></section>`;
}
viewEl.addEventListener('input', e => { if (!e.target.closest('#wish-form')) return; if (e.target.id === 'wf-for') { const mk = $('#view .vs-make'); if (mk) mk.classList.toggle('next', !!e.target.value.trim()); } });
viewEl.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.target.closest('.vs-poem textarea') || e.target.id === 'wf-for')) e.preventDefault(); if (e.key === 'Escape' && e.target.id === 'wf-for') sugShow(false); });
const growTA = el => { if (!el) return; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; };
/* the LCD's place and time: what W.I.S.H. holds, or where the radar stands */
const jNowW = () => `${String(jSel().place || suburbAt(S.scan.lat, S.scan.lng) || '').toUpperCase()} ${fmtClock(Date.now())}`;
/* the intention's screen is a two-line character LCD: what is longer scrolls inside it, a small arrow on the glass for what is
   out of sight; the device never grows */
const jwMore = el => { if (!el) return; const p = el.parentNode, m = el.scrollHeight - el.clientHeight; p.classList.toggle('lcd-up', el.scrollTop > 1); p.classList.toggle('lcd-dn', m - el.scrollTop > 1); };
viewEl.addEventListener('scroll', e => { if (e.target.id === 'jw-for') jwMore(e.target); }, true);
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
  if (b.dataset.vs === 'clear') { for (const k of ['for', ...WKEYS]) { const el = $('#wf-' + k); if (el) el.value = ''; WDRAFT[k] = ''; } WDRAFT.auto = {}; WDRAFT.photo = ''; WDRAFT.act = ''; store.set('da.wish.v1', WDRAFT); refreshPanel(); snd.tick(900); }
  if (b.dataset.vs === 'sug') { SUGON = !SUGON; b.setAttribute('aria-pressed', String(SUGON)); sugShow(SUGON); snd.tick(SUGON ? 1700 : 1000); return; }
  if (b.dataset.vs === 'unphoto') { WDRAFT.photo = ''; store.set('da.wish.v1', WDRAFT); refreshPanel(); snd.tick(1000); }
});
/* a photograph for the W.I.S.H., taken or chosen: made small here, and printed at the head of its receipt */
viewEl.addEventListener('change', e => {
  if (e.target.id !== 'wf-photo') return; const fl = e.target.files && e.target.files[0]; if (!fl) return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    WDRAFT.photo = c.toDataURL('image/jpeg', 0.8); if (!store.set('da.wish.v1', WDRAFT)) { WDRAFT.photo = c.toDataURL('image/jpeg', 0.55); store.set('da.wish.v1', WDRAFT); } refreshPanel(); tick(1800); }; im.src = rd.result; };
  rd.readAsDataURL(fl); e.target.value = '';
});
/* ───────── PRINT, the front, for everyone: a dongle. SELECT its hero, a sheet of die-cut stickers for some bling; a key that
   types words on the receipt itself; a keycap from another machine that takes back; and the printer, its light its state.
   Once everything is open it carries its upgrade, the jellyfish key turning it over to the studio ───────── */
/* which printer a print goes to: the one chosen, while it is online; else the first online; else novel.global's own, where it
   waits */
const prnNow = () => { const on = printersOn(); return on.find(p => p.id === prefs.prn) || on[0] || MASTER; };
const prnPlace = p => (p === MASTER ? 'NOVEL.GLOBAL' : String(p.sub ? title(p.sub) : p.addr || '').toUpperCase());
function printFront() {
  const s = pressStory(); const on = printersOn(); const p = prnNow();
  /* more than one online: each with its light and its place, to choose from */
  const info = on.length > 1 ? `<b>PRINT ON</b>${on.map(x => `<button type="button" class="jp-prn${x === p ? ' on' : ''}" data-prn-pick="${esc(x.id)}" aria-pressed="${x === p}"><i class="tp-led"></i><b>${esc(String(x.n).toUpperCase())}</b><small>${esc(prnPlace(x))}</small></button>`).join('')}`
    : `<b>${esc(String(p ? p.n : 'novel.global').toUpperCase())}</b><small>${on.length ? 'ONLINE' : 'OFFLINE · PRINTS WAIT 24 H'}</small>`;
  const stk = radiusSpecies(3).map((sp, i) => `<i class="jp-stk s${i}"><img src="${esc(photoURL(sp.ph, 'square'))}" alt="" loading="lazy"></i>`).join('');
  return `<section class="sec front-p simple-p" id="sec-out"><div class="dev tepra jr-dev${upCls()}"><div class="tp-slot" aria-hidden="true"><i class="tp-paper"></i></div>${SCREWS}<i class="hack h-tie" aria-hidden="true"></i>`
    + `<div class="jp-row"><button type="button" class="jp-sel" data-pick="strip" aria-label="Select: stickers, lives"><span class="jp-sheet" aria-hidden="true">${stk}<i class="jp-stk jelly">${M.jellySVG('#0F3B40', 'rgba(127,255,224,.55)', 30)}</i><i class="jp-peel"></i></span><i class="jp-plus" aria-hidden="true">${icon('plus')}</i></button>`
    + `<span class="jp-keys"><button type="button" class="tp-k jp-zoom" data-tp="zoom" aria-label="Closer: the receipt fitted, wide, close" data-tip="ZOOM">${icon('search')}</button><button type="button" class="tp-k jp-undo" data-tp="undo" aria-label="Back: undo, or take off what is chosen" data-tip="BACK">${icon('undo')}</button><button type="button" class="tp-k jp-reset" data-tp="reset" aria-label="Delete: the receipt bare, as it came" data-tip="DELETE">${icon('close')}</button></span>`
    + `<button type="button" class="print-k tp-prn${on.length ? ' on' : ''}${s ? ' next' : ''}" data-pout="send" aria-label="${IN_AURA ? 'Onto my poster' : 'Print receipt'}">${icon(IN_AURA ? 'stories' : 'epson')}</button></div>`
    + `<button type="button" class="tp-i${on.length ? ' on' : ''}" data-prn aria-expanded="false" aria-label="The printer: its name and state"><i class="tp-led"></i></button><span class="tp-info jp-info${on.length > 1 ? ' many' : ''}" id="tp-info" hidden>${info}</span>`
    + `${upMods()}${flipBtn()}</div></section>`;
}
/* a printer chosen from those online: kept, and the list stays open on it */
viewEl.addEventListener('click', e => { const b = e.target.closest('[data-prn-pick]'); if (!b) return; prefs.prn = b.dataset.prnPick; savePrefs(); $$('#view [data-prn-pick]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); snd.tick(1800); });
/* the dongle's words key: the caret on the receipt, and the keyboard types onto the paper */
viewEl.addEventListener('click', e => { if (e.target.closest('[data-jwords]')) { jEdit(); snd.tick(1500); } });
viewEl.addEventListener('click', e => { const o = e.target.closest('[data-outs]'); if (!o) return; const sec = o.closest('#sec-out'); const on = !sec.classList.contains('open'); sec.classList.toggle('open', on); o.setAttribute('aria-expanded', String(on)); tick(on ? 1500 : 1000); });
viewEl.addEventListener('click', e => {
  const k = e.target.closest('[data-tp]'); if (k) { if (k.dataset.tp === 'pick') { openPick('strip'); return; } if (k.dataset.tp === 'undo') { const sel = zc ? zc.getActiveObjects().filter(o => !ZFIXED.includes(o.daKind)) : []; zineTool(sel.length ? 'delete' : 'undo'); return; } zineTool(k.dataset.tp); return; }
  const pr = e.target.closest('[data-prn]'); if (pr) { const i = $('#tp-info') || $('#ps-info'); if (!i) return; i.hidden = !i.hidden; pr.setAttribute('aria-expanded', String(!i.hidden)); snd.tick(i.hidden ? 1100 : 1800); }
});
