/* ════════════════════════════════════════════════════════════════════
   THE FRONTS — RADIO, W.I.S.H. and PRINT each have two faces, and each face is a piece of hardware. The front is the device as
   it ships, a matte shell of smoked plastic, what is inside seen softly through it: the shortest way from a sound to a receipt.
   The back is the same device opened: clear acrylic on standoffs, its board in view, a cable plugged in, its plate, holding the
   whole studio. A slow tool and a quick act, settled by a turn of the page rather than a lesson first: the corner at the head of
   the page turns it over.
   ════════════════════════════════════════════════════════════════════ */
const FACED = [0, 1, 2];
const faceOf = i => (FACED.includes(i) ? ((prefs.face || {})[i] === 'back' ? 'back' : 'front') : 'back');
function setFace(i, f) { prefs.face = { ...(prefs.face || {}), [i]: f }; savePrefs(); }
/* the corner: folded down at the head of every faced page, its underside the other face. The first time it lifts, once */
const flipKey = () => { const f = faceOf(S.view); return FACED.includes(S.view) ? `<button type="button" class="flip-k${sessionSeen('flip' + S.view) ? '' : ' hint'}" data-flip data-face="${f}" aria-label="${f === 'front' ? 'Turn over: the studio' : 'Turn back: the quick way'}"><i class="fl-ear" aria-hidden="true"></i></button>` : ''; };
function sessionSeen(k) { try { if (sessionStorage.getItem('da.seen.' + k)) return true; sessionStorage.setItem('da.seen.' + k, '1'); } catch (e) { return true; } return false; }
function flip() {
  const i = S.view; if (!FACED.includes(i) || S.mode) return; const to = faceOf(i) === 'front' ? 'back' : 'front'; snd.tick(to === 'back' ? 1250 : 1750); buzz(6);
  const go = () => { setFace(i, to); headBar(); renderView(); viewEl.scrollTop = 0; };
  if (reduced()) { go(); return; }
  viewEl.classList.remove('flip-in'); viewEl.classList.add('flip-out');
  setTimeout(() => { go(); viewEl.classList.remove('flip-out'); viewEl.classList.add('flip-in'); setTimeout(() => viewEl.classList.remove('flip-in'), 380); }, 190);
}
document.addEventListener('click', e => { if (e.target.closest('[data-flip]')) flip(); });
/* what an opened device shows: its board at the head, four standoffs, one cable plugged in, and its plate: its name, its step */
const mods = (n, st) => `<i class="mod-cap" aria-hidden="true"></i>${['tl', 'tr', 'bl', 'br'].map(c => `<i class="mod-bolt ${c}" aria-hidden="true"></i>`).join('')}<i class="mod-cable" aria-hidden="true"></i><span class="mod-label" data-n="${n}" data-st="${st}" aria-hidden="true"><i></i></span>`;

/* ───────── RADIO, the front: a smoked radio, matte. A speaker behind the grille, one key, play; a knob for each track, off and
   three levels; the steps under it ───────── */
const KNOB_A = [-135, -45, 45, 135];
const knobPos = k => (trackOn(k) ? volStep(k) + 1 : 0);
function radioFront() {
  const first = !S.started && !prefs.placed;
  return `<section class="band front-r" id="sec-heat"><div class="dev radio">`
    + `<div class="rd-top"><i class="rd-grille" aria-hidden="true"></i><button type="button" class="rd-play${S.radio ? ' on' : ''}" data-radio aria-pressed="${S.radio}" aria-label="${first ? 'Play the example' : 'Play'}"><i class="rd-led" aria-hidden="true"></i>${icon(S.radio ? 'pause' : 'play')}</button></div>`
    + `<ol class="rd-knobs">${LAYERS.map(L => { const p = knobPos(L.k); return `<li class="rd-k${p ? ' on' : ''}" data-lyr="${L.k}"><button type="button" class="rd-knob" data-knob="${L.k}" role="slider" aria-label="${L.w}" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${p}" style="--a:${KNOB_A[p]}deg"><i class="kn-ind"></i></button>`
      + `<i class="kn-ticks" aria-hidden="true">${[1, 2, 3].map(n => `<b${n <= p ? ' class="on"' : ''}></b>`).join('')}</i><span class="kn-ic" aria-hidden="true">${icon(L.ic, 'sm')}</span></li>`; }).join('')}</ol>`
    + `</div>${MIXES.length || wishStarted() || mineOf().length || POSTERS2.length || printedAny() ? checklistHTML() : cluesHTML()}</section>`;
}
/* a knob turned: a click goes round, off, one, two, three; arrow keys step and stop at the ends */
function turnKnob(k, d, stop) {
  const p0 = knobPos(k); let p = p0 + d; p = stop ? clamp(p, 0, 3) : (p + 4) % 4; if (p === p0) { tick(600); return; }
  if (!p) setTrack4(k, false); else { prefs.lvl = { ...(prefs.lvl || {}), [k]: VOLS[p - 1] }; savePrefs(); if (!trackOn(k)) setTrack4(k, true); }
  const b = $(`#view [data-knob="${k}"]`); if (b) { b.style.setProperty('--a', `${KNOB_A[p]}deg`); b.setAttribute('aria-valuenow', String(p)); const li = b.closest('.rd-k'); li.classList.toggle('on', !!p); li.querySelectorAll('.kn-ticks b').forEach((x, n) => x.classList.toggle('on', n < p)); }
  snd.tick(800 + p * 320); buzz(4);
}
viewEl.addEventListener('click', e => { const k = e.target.closest('[data-knob]'); if (k) turnKnob(k.dataset.knob, 1, false); });
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
  return `<section class="sec ${back ? 'back-w' : 'front-w'}" id="sec-wish"><form class="wish-form visor${back ? ' mod' : ''}" id="wish-form" autocomplete="off"><div class="dev vs-body">${back ? mods('W.I.S.H.', '02 · RESPONSE') : ''}<i class="vs-rib l" aria-hidden="true"></i><i class="vs-rib r" aria-hidden="true"></i>`
    + `<div class="vs-screen"><div class="vs-bar"><b class="vs-tab">W.I.S.H.</b><span class="vs-now">${esc(String(where || '').toUpperCase())} ${fmtClock(Date.now())}</span></div>`
    + `<label class="vs-i" data-tip="Intention"><b class="vs-m wf-m" aria-hidden="true">I</b><input id="wf-for" list="wf-for-l" maxlength="60" autocomplete="off" spellcheck="false" aria-label="Intention" placeholder=" " value="${esc(String(L.for || '').replace(/^[lce]:/, ''))}"><i class="vs-cur" aria-hidden="true"></i></label><datalist id="wf-for-l">${intentOptions()}</datalist>`
    + (back ? `<ol class="vs-poem">${WKEYS.map(k => `<li data-tip="${esc(WISH[k][1])}"><b class="wf-m" aria-hidden="true">${k.toUpperCase()}</b><textarea id="wf-${k}" rows="2" maxlength="${SIG.line}" aria-label="${esc(WISH[k][0])}" placeholder="${esc(WISH[k][0])}" spellcheck="true">${esc(L[k] || '')}</textarea></li>`).join('')}</ol>`
      + `<label class="vs-by" data-tip="By"><b class="wf-m" aria-hidden="true">BY</b><input id="wf-by" type="text" maxlength="40" value="${esc(L.by || S.me.by || '')}" aria-label="By" spellcheck="false"></label>` : '')
    + `<div class="vs-att">${photo}<label class="vs-cam" aria-label="A photograph: take one, or choose one">${icon('camera')}<input type="file" id="wf-photo" accept="image/*" hidden></label></div></div>`
    + `<div class="vs-keys"><button type="submit" class="vs-make make-b" aria-label="Make the W.I.S.H."><i class="vs-oval"></i><b>make</b></button><button type="button" class="vs-btn" data-vs="clear" aria-label="Clear">${icon('close')}</button></div>`
    + `</div></form></section>`;
}
const wishFront = () => wishDevice(false);
viewEl.addEventListener('input', e => { if (e.target.closest('#wish-form')) wishPreview(); });
viewEl.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('.vs-poem textarea')) e.preventDefault(); });
viewEl.addEventListener('click', e => {
  const b = e.target.closest('[data-vs]'); if (!b) return;
  if (b.dataset.vs === 'clear') { for (const k of ['for', ...WKEYS]) { const el = $('#wf-' + k); if (el) el.value = ''; WDRAFT[k] = ''; } WDRAFT.auto = {}; WDRAFT.photo = ''; store.set('da.wish.v1', WDRAFT); refreshPanel(); wishPreview(); snd.tick(900); }
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
const wishPreview = debounce(async () => {
  const cov = $('#cover'); if (!cov) return; if (!(S.open && S.view === 1 && faceOf(1) === 'front' && !S.mode)) { cov.replaceChildren(); return; }
  const my = ++pvN; const cvs = await slipCanvas(draftSignal(), 384, 2, false, false).catch(() => null); if (!cvs || my !== pvN || faceOf(1) !== 'front' || S.view !== 1) return;
  let fig = cov.querySelector('.wpv'); if (!fig) { fig = document.createElement('figure'); fig.className = 'wpv'; fig.innerHTML = '<img alt="">'; cov.replaceChildren(fig); }
  fig.querySelector('img').src = cvs.toDataURL('image/png');
}, 320);

/* ───────── PRINT, the front: a label maker in matte graphite, its board seen through a smoked cap. Its screen holds the words
   to set; three keys, words, a sticker, a photograph; and one key, the printer, that prints. The printer's name and state stay
   out of sight until its light is pressed ───────── */
const TP_KEYS = [['text', '', 'teal', 'Words'], ['stk', 'star5', 'green', 'A sticker'], ['image', 'camera', 'orange', 'A photograph']];
function printFront() {
  const s = pressStory(); const on = printersOn(); const p = on[0] || MASTER;
  return `<section class="sec front-p" id="sec-out"><div class="dev tepra"><div class="tp-lid" aria-hidden="true"><i class="tp-win"></i><i class="tp-latch"></i></div>`
    + `<label class="tp-lcd"><span class="tp-l1">${s ? esc(s.code) : '80 MM'}</span><span class="tp-info" id="tp-info" hidden><b>${esc(String(p ? p.n : 'novel.global').toUpperCase())}</b><small>${on.length ? 'ONLINE' : 'OFFLINE · PRINTS WAIT 24 H'}</small></span><input id="tp-words" maxlength="80" spellcheck="true" autocomplete="off" placeholder=" " aria-label="Words for the strip"><i class="tp-cur" aria-hidden="true"></i></label>`
    + `<div class="tp-keys">${TP_KEYS.map(([k, ic, c, w]) => `<button type="button" class="tp-k tk-${c}" data-tp="${k}" aria-label="${w}">${k === 'text' ? '<b>Aa</b>' : icon(ic)}</button>`).join('')}</div>`
    + `<div class="tp-foot"><button type="button" class="print-k tp-prn${on.length ? ' on' : ''}" data-pout="send" aria-label="Print receipt">${icon('epson')}</button><button type="button" class="tp-i${on.length ? ' on' : ''}" data-prn aria-expanded="false" aria-label="The printer: its name and state"><i class="tp-led"></i></button></div>`
    + `</div></section>`;
}
viewEl.addEventListener('click', e => {
  const k = e.target.closest('[data-tp]'); if (k) { zineTool(k.dataset.tp); if (phone() && k.dataset.tp !== 'image') setPane('main'); return; }
  const pr = e.target.closest('[data-prn]'); if (pr) { const i = $('#tp-info') || $('#ps-info'); if (!i) return; i.hidden = !i.hidden; pr.setAttribute('aria-expanded', String(!i.hidden)); snd.tick(i.hidden ? 1100 : 1800); buzz(5); }
});
