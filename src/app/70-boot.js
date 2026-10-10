
/* ───────── deep links: a page by name; #x=… a signal carried in the link; #DA-XXXX a signal here; #T01 a group;
   #U… a record placed here; #E01 a gathering; any other code an iNaturalist sighting ───────── */
let pendingHash = location.hash.replace(/^#/, '');
const viewOfHash = h => { const p = PARTS[String(h).toLowerCase()]; return p ? p[0] : -1; };
const isLocalHash = h => viewOfHash(h) >= 0 || /^(T\d{2}|E\d{2}|DA-[0-9A-Z]{4}|P-[a-z0-9-]+|x=.+)$/i.test(h);
async function handleHash() {
  const h = decodeURIComponent(pendingHash || ''); pendingHash = ''; if (!h) return;
  const v = viewOfHash(h); if (v >= 0) { const part = h.toLowerCase(); setView(v, false, PARTS[part][1] ? part : null); return; }
  if (/^x=/.test(h)) { await receive('#' + h); return; }
  if (/^DA-[0-9A-Z]{4}$/i.test(h)) { const s = S.signals.find(x => x.code === h.toUpperCase()); if (s) openSignal(s.key); else receiveCode(h.toUpperCase()); return; }
  if (/^P-[a-z0-9-]+$/i.test(h)) { selectPartner(h.slice(2).toLowerCase()); return; }
  if (/^T\d{2}$/i.test(h)) { const id = 'tribe:' + h.toUpperCase(); if (S.byId.has(id)) selectTribe(id); return; }
  if (/^E\d{2}$/i.test(h)) { const id = 'e:' + (+h.slice(1)); if (S.byId.has(id)) select(id); return; }
  if (/^U[0-9a-z]{8,}$/i.test(h)) { const id = 'u:' + h.slice(1); if (S.byId.has(id)) select(id); else toast('NOT ON THIS DEVICE'); return; }
  const m = h.match(/^([0-9A-Za-z]{3,9})$/); if (!m) return; const id = parseInt(m[1].toLowerCase(), 36);
  if (S.byId.has(id)) { select(id); return; }
  try {
    const j = await (await fetch(`${CONFIG.INAT_API}/observations/${id}?locale=en&preferred_place_id=${CONFIG.PLACE_PREF}`)).json(); const o = j.results && j.results[0] && compact(j.results[0]); if (!o) throw new Error('none');
    const day = parseDay(o.d); const today = new Date(); today.setHours(0, 0, 0, 0); Object.assign(o, { ext: true, age: day ? Math.round((today - day) / 864e5) : 99, rare: 0.6, isNew: false });
    S.obs.push(o); S.byId.set(o.id, o); refresh(); select(o.id);
  } catch (e) { toast(`${m[1]} ?`); }
}
addEventListener('hashchange', () => {
  const h = location.hash.replace(/^#/, ''); const cur = S.mode === 'ping' ? S.byId.get(S.sel) : null;
  if (!h || (cur && h === hashOf(cur))) return;
  pendingHash = h; if (isLocalHash(h) || S.obs.length) handleHash();
});

/* ───────── live: while the page is open, and whenever it comes back ───────── */
document.addEventListener('visibilitychange', () => { if (document.hidden) return; if (Date.now() - S.lastSignal > CONFIG.REFRESH_MIN * 60000) { fetchSightings(true); loadWeather(); } else liveTick(); });
setInterval(() => { if (!document.hidden) liveTick(); }, Math.max(1, CONFIG.LIVE_MIN || 5) * 60000);

/* ───────── a word on hover: every [data-tip] says what it is; on touch, a tap shows it for a moment ───────── */
const tipEl = $('#tip'); let tipFor = null, tipT = 0;
function showTip(el) {
  const t = el && el.dataset.tip; if (!t) return; tipFor = el; tipEl.textContent = t; tipEl.hidden = false;
  const r = el.getBoundingClientRect(); const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - 8; if (y < 6) y = r.bottom + 8; x = clamp(x, 6, Math.max(6, innerWidth - w - 6));
  tipEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}
function hideTip() { clearTimeout(tipT); tipFor = null; tipEl.hidden = true; }
document.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const el = e.target.closest('[data-tip]'); if (el === tipFor) return; clearTimeout(tipT); if (!el) { hideTip(); return; } tipT = setTimeout(() => showTip(el), 140); });
document.addEventListener('pointerout', e => { if (e.pointerType !== 'mouse') return; const el = e.target.closest('[data-tip]'); if (el && !el.contains(e.relatedTarget)) hideTip(); });
document.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); if (el && !coarse()) showTip(el); });
document.addEventListener('focusout', () => hideTip());
document.addEventListener('input', () => hideTip(), true);
document.addEventListener('scroll', () => hideTip(), true);
document.addEventListener('click', e => { if (!coarse()) return; const el = e.target.closest('[data-tip]'); if (!el || e.target.closest('button, a, textarea, input, select, summary')) return; showTip(el); clearTimeout(tipT); tipT = setTimeout(hideTip, 2600); });
/* every press answers with a small click, and the page's own buttons with a little more */
document.addEventListener('click', e => { const b = e.target.closest('summary'); if (b) tick(1300); });

/* ───────── boot ───────── */
document.title = CONFIG.NAME.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase());
document.body.dataset.view = VIEWS[0].k; document.body.classList.add('shut'); document.documentElement.classList.toggle('still', !prefs.motion);
/* a preview says so, so it is never mistaken for the live site */
if (BUILD.branch) { const t = document.createElement('div'); t.className = 'preview mono'; t.setAttribute('aria-hidden', 'true'); t.textContent = `PREVIEW · ${BUILD.branch.toUpperCase()} · ${BUILD.sha.toUpperCase()}`; document.body.appendChild(t); }
S.mo = nowK();
derive(); buildTribes(); buildHeroes(); renderView(); flags(); loadEvents();
/* the stories shown to everyone: as last fetched at once, then fresh; anything waiting to be sent goes */
applyShared(); loadShared(); flushOutbox(); checkSent(); loadPartners();
/* the landing page is NOW: a link to a page, or a part of one, lands there too; a link to a life, a story or a place opens it */
if (!pendingHash || viewOfHash(pendingHash) >= 0) { pendingHash = ''; setView(0); }
/* sound waits for a first touch; then the radar plays what it has found so far */
const firstTouch = () => { removeEventListener('pointerdown', firstTouch, true); removeEventListener('keydown', firstTouch, true); setTimeout(() => life.replay(), 60); };
addEventListener('pointerdown', firstTouch, true); addEventListener('keydown', firstTouch, true);
if (isLocalHash(pendingHash)) handleHash();
loadWeather().then(() => fetchSightings(false)).then(() => { if (pendingHash) handleHash(); else life.findStart(); }).then(() => fetchHistory());
placesAround(S.scan.lat, S.scan.lng, S.scan.r);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { /* online-only is fine */ });
window.__da = { S, CONFIG, M, FIELD, BRIEFS, EXAMPLES, map, ledger, life, strings, select, setView, setOpen, closeRecord, refresh, alarmsNow, fieldOf, glyphOf, isCold, live: liveTick, fetchHistory, derive, startPlace, selectTribe,
  degOf, whenOf, threatOf, youngOf, needsOf, needLine, waterNear, outMonth, nowK, canopyAt, canopyOf, pickMonth, roleOfRow, onNotice, suburbAt, placeOf, lifeOf, inTribe, livesIn, bizNear, placesAround, harmsOfRow,
  webBriefs, makeSignal, meshText, pagerText, slipText, escpos, slipPNG, packSignal, unpackSignal, linkOf, receive, openSignal, printSlip, printBlank, remixSignal, toWish, issue, snd, prefs, hideCell, setFive, fiveList, haversine, rangeOf, nameOf, statementOf, stDefault, imgChoice, imgList, photoChoices, IMGS, OWN, showConstellation, fitWeb, fillLedger, bwCanvas, slipCanvas, slipHTML, PLACES, ROLES, PRESSURES, isFresh, stampOf, checkSent, loadShared, directAction, shareRecord, sentWord, PARTNERS, PSTATE, selectPartner, setScan: (...a) => life.setScan(...a), face: () => face };
})();
