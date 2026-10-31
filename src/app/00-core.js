(() => {
'use strict';
const CONFIG = window.DA_CONFIG, SCALES = window.DA_SCALES, TRAITS = window.DA_TRAITS, SECTORS = window.DA_SECTORS, ROLES = window.DA_ROLES;
const OUT = window.DA_OUTLOOK, CANOPY = window.DA_CANOPY, BRIEFS = window.DA_BRIEFS || [], THREAT = window.DA_THREAT || {};
const NEEDS = window.DA_NEEDS || {}, HEROES = window.DA_HEROES || [], TRIBES = window.DA_TRIBES || [], WATERS = window.DA_WATERS || { lines: [], points: [] }, GIGS = window.DA_GIGS || {};
const CANOPY_TARGET = (window.DA_CANOPY_TARGET || { pc: 40 }).pc;
const HEAT = window.DA_HEAT, CONTACTS = window.DA_CONTACTS, LINKS = window.DA_LINKS, EXAMPLES = window.DA_EXAMPLES || [];
const M = window.DA_MARKS, C = M.C, FIELD = window.DA_FIELD || [];
const PLACES = window.DA_PLACES || [], FAMILIES = window.DA_FAMILIES || {}, STATEMENT = window.DA_STATEMENT || {}, PRESSURES = window.DA_PRESSURES || {}, OUTPUTS = window.DA_OUTPUTS || [];
const SIG = Object.assign({ line: 48, mesh: 200, pager: 80 }, CONFIG.SIGNAL || {});
/* the build this page came from: its commit, and a branch only on a preview */
const BUILD = (() => { const [sha = '', branch = ''] = ((document.querySelector('meta[name="da-build"]') || {}).content || '').split(' '); return { sha, branch }; })();
/* four destinations. The first three are one journey, tied along a thread: notice on the radio, respond in signals, act in
   signs. The portfolio stands apart. Behind the scenes: make it right, make it work, make it beautiful */
const VIEWS = [
  { k: 'radio', icon: 'jelly', label: 'Radio', w: 'RADIO', short: 'RADIO', long: 'RADIO', slug: 'radio', was: 'now' },
  { k: 'signals', icon: 'string', label: 'W.I.S.H.', w: 'W.I.S.H.', short: 'W.I.S.H.', long: 'W.I.S.H.', slug: 'wish' },
  { k: 'signs', icon: 'receipt', label: 'Print', w: 'PRINT', short: 'PRINT', long: 'PRINT', slug: 'print' },
  { k: 'portfolio', icon: 'stories', label: 'Portfolio', w: 'PORTFOLIO', short: 'novel.global', long: 'novel.global', slug: 'portfolio', was: 'stories' },
];
const viewIx = k => Math.max(0, VIEWS.findIndex(v => v.k === k || v.was === k));
/* degrees of danger in the months ahead: orange, deeper as it rises. Red is kept for now. */
const DEG = ['LOW', 'WATCH', 'HIGH', 'SEVERE', 'EXTREME'];
const icon = (name, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#g-${name}"/></svg>`;
const glyphSVG = (name, cls = '') => `<svg class="i k ${cls}" aria-hidden="true"><use href="#k-${name}"/></svg>`;
(function sprite() { const host = document.querySelector('svg.sprite'); if (host) host.innerHTML = M.sprite(); })();

/* ───────── small tools ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad2 = n => String(n).padStart(2, '0');
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const fmtClock = t => { const d = new Date(t); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fmtDay = t => { const d = new Date(t); return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
const fmtStamp = t => { const d = new Date(t); return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)} ${fmtClock(t)}`; };
const dayWord = t => { const d = new Date(t), a = new Date(t), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); const n = Math.round((a - b) / 864e5); return n === 0 ? (d.getHours() >= 17 ? 'TONIGHT' : 'TODAY') : n === 1 ? 'TOMORROW' : n > 1 && n < 7 ? DOW[d.getDay()] : fmtDay(t); };
const isoDay = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseDay = s => { if (!s) return null; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return y ? new Date(y, m - 1, d) : null; };
const dayMonth = s => { const d = parseDay(s); return d ? `${d.getDate()} ${MON[d.getMonth()]}` : ''; };
const ago = t => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m}M` : m < 48 * 60 ? `${Math.round(m / 60)}H` : `${Math.round(m / 1440)}D`; };
const toCode = id => (typeof id === 'number' ? id.toString(36) : String(id)).toUpperCase();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
const cap = t => (t ? String(t).charAt(0).toUpperCase() + String(t).slice(1) : '');
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
};
/* what is too large for localStorage (pictures): IndexedDB, novelglobal-kept; each answer a promise, null where there is none */
const big = (() => {
  let db = null; const open = () => db || (db = new Promise(res => { try { const q = indexedDB.open('novelglobal-kept', 1); q.onupgradeneeded = () => q.result.createObjectStore('kv'); q.onsuccess = () => res(q.result); q.onerror = () => res(null); } catch (e) { res(null); } }));
  const tx = (mode, fn) => open().then(d => (d ? new Promise(res => { try { const t = d.transaction('kv', mode), r = fn(t.objectStore('kv')); t.oncomplete = () => res(r && r.result !== undefined ? r.result : mode === 'readwrite' ? true : null); t.onerror = t.onabort = () => res(null); } catch (e) { res(null); } }) : null));
  return { get: k => tx('readonly', s => s.get(k)), set: (k, v) => tx('readwrite', s => s.put(v, k)), del: k => tx('readwrite', s => s.delete(k)), keys: () => tx('readonly', s => s.getAllKeys()) };
})();
const loadOne = (src, cors) => new Promise((res, rej) => { const im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => rej(new Error('image')); im.src = src; });
/* a photograph whose pixels are needed (to dither it for paper): through novel.global, which lets the page read it; else
   straight from its host, asked afresh so a copy the browser kept without that permission is not used */
const PHOTO_HOST = /^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\//;
const loadImage = (src, cors) => {
  if (!cors || !PHOTO_HOST.test(src)) return loadOne(src, cors);
  const fresh = () => loadOne(src + (src.includes('?') ? '&' : '?') + 'da=1', true);
  return /^https?:$/.test(location.protocol) ? loadOne(`/api/img?u=${encodeURIComponent(src)}`, true).catch(fresh) : fresh();
};
let toastT = 0;
function toast(msg, ms = 2400) { const t = $('#toast'); t.textContent = msg; t.hidden = false; t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms); }
function nudge(el) { if (!el) return; el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); el.focus({ preventScroll: true }); buzz(20); }
const debounce = (fn, ms) => { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const haversine = (a, b, c, d) => { const R = 6371000, r = Math.PI / 180; const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const bearing = (a, b, c, d) => { const r = Math.PI / 180; const y = Math.sin((d - b) * r) * Math.cos(c * r), x = Math.cos(a * r) * Math.sin(c * r) - Math.sin(a * r) * Math.cos(c * r) * Math.cos((d - b) * r); return (Math.atan2(y, x) / r + 360) % 360; };
const metres = d => (d < 1000 ? `${Math.round(d / 10) * 10} M` : `${(d / 1000).toFixed(1)} KM`);
const coarse = () => matchMedia('(pointer: coarse)').matches;
const B = CONFIG.BBOX;
const inBox = (lat, lng) => lat >= B.s && lat <= B.n && lng >= B.w && lng <= B.e;
const seeded = key => { let h = 2166136261; for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const WEEK = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const w1 = new Date(d.getFullYear(), 0, 4); return `${d.getFullYear()}-W${pad2(1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7))}`; })();
const LIC = { 'cc0': 'CC0', 'cc-by': 'CC BY', 'cc-by-nc': 'CC BY-NC', 'cc-by-sa': 'CC BY-SA', 'cc-by-nc-sa': 'CC BY-NC-SA', 'cc-by-nd': 'CC BY-ND', 'cc-by-nc-nd': 'CC BY-NC-ND' };
const licLabel = l => l ? (LIC[String(l).toLowerCase()] || String(l).toUpperCase()) : '©';
const licOpen = l => !!l && Object.keys(LIC).includes(String(l).toLowerCase());
const licAdaptable = l => !!l && ['cc0', 'cc-by', 'cc-by-nc', 'cc-by-sa', 'cc-by-nc-sa'].includes(String(l).toLowerCase());
const photoURL = (u, size) => u ? u.replace(/\/(square|thumb|small|medium|large|original)\.(\w+)(\?.*)?$/i, `/${size}.$2$3`) : '';
const SUBURBS = ['Brunswick East', 'Brunswick West', 'Brunswick', 'Coburg North', 'Coburg', 'Pascoe Vale South', 'Parkville', 'Carlton North', 'Princes Hill', 'Fitzroy North', 'Clifton Hill', 'North Melbourne', 'West Melbourne', 'East Melbourne', 'Southbank', 'Docklands', 'Collingwood', 'Abbotsford', 'Northcote', 'Essendon', 'Moonee Ponds', 'Flemington', 'Kensington', 'Carlton', 'Fitzroy', 'Melbourne'];
const suburbOf = pg => { const s = (pg || '').toLowerCase(); for (const n of SUBURBS) if (s.includes(n.toLowerCase())) return n.toUpperCase(); return 'BRUNSWICK'; };
const CENTRES = [['BRUNSWICK', -37.7667, 144.9600], ['BRUNSWICK EAST', -37.7712, 144.9790], ['BRUNSWICK WEST', -37.7650, 144.9420], ['PARKVILLE', -37.7860, 144.9500], ['PRINCES HILL', -37.7832, 144.9655],
  ['CARLTON NORTH', -37.7845, 144.9735], ['FITZROY NORTH', -37.7835, 144.9860], ['CLIFTON HILL', -37.7890, 144.9970], ['CARLTON', -37.7990, 144.9665], ['FITZROY', -37.7990, 144.9785], ['COLLINGWOOD', -37.8020, 144.9890],
  ['NORTH MELBOURNE', -37.7985, 144.9450], ['KENSINGTON', -37.7930, 144.9290], ['FLEMINGTON', -37.7835, 144.9300], ['WEST MELBOURNE', -37.8070, 144.9430], ['MELBOURNE', -37.8136, 144.9631], ['EAST MELBOURNE', -37.8130, 144.9850],
  ['DOCKLANDS', -37.8150, 144.9460], ['SOUTHBANK', -37.8225, 144.9640]];
const suburbAt = (lat, lng) => { let best = CENTRES[0][0], bd = 1e9; for (const [n, a, b] of CENTRES) { const d = (a - lat) ** 2 + ((b - lng) * 0.79) ** 2; if (d < bd) { bd = d; best = n; } } return best; };
const title = s => String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const placeOf = o => { const s = typeof o.id === 'number' && o.pg ? o.pg.toLowerCase() : ''; if (s) for (const n of SUBURBS) if (s.includes(n.toLowerCase()) && CENTRES.some(c => c[0] === n.toUpperCase())) return n.toUpperCase(); return suburbAt(o.lat, o.lng); };

/* ───────── state ───────── */
/* tracks: collections of the map, each seen on it or not. The lives are seen, the places are not, a pack of cells is */
const TRK_SEE = { life: true, places: false };
/* the site's own settings, as last heard: the nature station stays on the map for everyone unless unlocked on the approval page */
const CFG = Object.assign({ lifeLock: true }, store.get('da.cfg.v1', {}));
/* the example (its poster on the wall and BOARD 00) shown: as the approval page has it, and always while it is open to editing */
const exShown = () => CFG.exampleShow !== false || !!CFG.exampleEdit;
const seeTrack = id => {
  if (id === 'life' && CFG.lifeLock) return true;
  /* the places are two tracks: EXPOSURE, those on notice; COMMUNITY, those that care */
  if (id === 'places') return !!(T4.pollution || T4.community);
  const v = (prefs.trk || {})[id]; return v == null ? (id in TRK_SEE ? TRK_SEE[id] : true) : !!v;
};
/* the print location: the first partner place with a W.I.S.H. printer */
const printAt = () => { const d = (window.DA_PARTNERS || []).find(x => x.printer); const p = d && PLACES.find(x => x.partner === d.id); return p ? { lat: +p.lat, lng: +p.lng } : null; };
const NEW_HERE = store.get('da.prefs', null) == null;
const prefs = Object.assign({ sound: true, motion: true, areas: false, printers: true, scan: null }, store.get('da.prefs', {}));
const savePrefs = () => store.set('da.prefs', prefs);
/* the first visit is one simple way through, gate by gate (43-journey.js): 0 the map, 1 the radio, 2 W.I.S.H., 3 PRINT, 4 done.
   A device that has been here before has done it */
const IN_AURA = window.parent !== window && /[?&]from=aura\b/.test(location.search);
/* the one device the aura opened this window for: its page, and no other */
let AURA_ONLY = IN_AURA ? ({ radio: 0, wish: 1, print: 2, portfolio: 3 })[new URLSearchParams(location.search).get('only')] : undefined;
if (AURA_ONLY != null) document.documentElement.classList.add('only-' + ['radio', 'wish', 'print', 'portfolio'][AURA_ONLY]);   // one device in the aura's window: laid out for it alone
/* the research board alone, on a phone: while the board is up, the W.I.S.H. device rests at the foot with only its top edge showing; a touch on it brings it up, a touch on the board puts it back */
const wishFold = on => { const p = document.querySelector('#panel'), v = document.querySelector('#view'); if (!p || !v) return; if (!on) { p.style.transition = 'transform .35s ease'; p.style.removeProperty('transform'); document.body.classList.add('wish-up'); return; }
  p.style.transition = 'none'; p.style.removeProperty('transform'); void p.offsetHeight; const r = v.getBoundingClientRect(); void p.offsetHeight; p.style.transition = 'transform .35s ease'; p.style.setProperty('transform', `translateY(${Math.max(0, innerHeight - r.top - 72)}px)`, 'important'); document.body.classList.remove('wish-up'); };
if (IN_AURA) {
  let swallow = 0;
  document.addEventListener('pointerdown', e => { if (AURA_ONLY !== 1 || innerWidth > 760 || !document.documentElement.classList.contains('board-on')) return; if (e.target.closest('#board')) { if (document.body.classList.contains('wish-up')) wishFold(true); return; } if (e.target.closest('#panel') && !document.body.classList.contains('wish-up')) { wishFold(false); swallow = Date.now(); } }, true);
  document.addEventListener('click', e => { if (AURA_ONLY === 1 && Date.now() - swallow < 600 && e.target.closest('#panel')) { e.preventDefault(); e.stopPropagation(); } }, true);
  let wasOn = false; new MutationObserver(() => { const on = AURA_ONLY === 1 && document.documentElement.classList.contains('board-on') && innerWidth <= 760; if (on === wasOn) return; wasOn = on; setTimeout(() => wishFold(on), on ? 400 : 0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}
if (IN_AURA) { document.documentElement.classList.add('in-aura'); const nq = new URLSearchParams(location.search).get('night'); if (nq != null) prefs.night = nq === '1'; }
/* a picture made here handed to the aura, which puts it on the poster in hand; crisp keeps it line work on the receipt (a code, a score) */
/* iNaturalist through novel.global (stage 4), with a way round: iNaturalist limits the shared addresses Cloudflare asks from, so when
   novel.global is turned away, or slow, the browser asks iNaturalist itself, as it did before. Every call to CONFIG.INAT_API goes this way */
{ const fetch0 = window.fetch.bind(window), DIRECT = 'https://api.inaturalist.org/v1/';
  window.fetch = (u, o) => { const s = typeof u === 'string' ? u : ''; if (!s.startsWith('/api/inat/')) return fetch0(u, o); const direct = () => fetch0(DIRECT + s.slice(10), o);
    return fetch0(s, { ...(o || {}), ...(AbortSignal.timeout ? { signal: AbortSignal.timeout(8000) } : {}) }).then(r => (r.ok ? r : direct())).catch(direct); }; }
/* made: kept in one's own list (shared with the aura, newest first), and said to the aura so its light follows it home */
const made = (kind, label, lat, lng) => { try { if (IN_AURA) window.parent.postMessage({ ng: 'made', kind, label: String(label || '').slice(0, 48) }, location.origin); } catch (e) { /* alone */ } };
const toAura = (url, crisp) => { try { window.parent.postMessage({ ng: 'piece', url, crisp: !!crisp }, location.origin); return true; } catch (e) { return false; } };
if (!Number.isFinite(prefs.journey) || (IN_AURA && prefs.journey < 4)) { prefs.journey = NEW_HERE && !IN_AURA ? 0 : 4; savePrefs(); }
const simple = () => prefs.journey < 4;
/* the radar stands only once the radio is started, each visit: PRESS PLAY, or a tap on the map. Where it stood is kept */
const placed = () => !!S.started;
/* the tracks on the map besides the lives: every one on, until a key turns it off (a visit before this kept them off: on again once) */
if (prefs.t4v !== 2) { prefs.t4 = { water: true, pollution: true, community: true }; prefs.mute = false; prefs.t4v = 2; savePrefs(); }
const T4 = Object.assign({ water: true, pollution: true, community: true }, prefs.t4 || {});
/* the day's thread: noticed, responded, acted. It starts again each day */
const DAY = (() => { const t = store.get('da.day.v1', {}); const d = new Date(); const today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; return t.d === today ? t : { d: today }; })();
/* night is the default, until turned off in Settings. The page darkens and the ground dims; a slip stays paper */
const darkNow = () => (prefs.night != null ? !!prefs.night : false);
const applyNight = () => document.documentElement.classList.toggle('night', darkNow());
applyNight();
const me = Object.assign({ by: '', dev: '' }, store.get('da.me', {}));
if (!me.dev) { me.dev = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; store.set('da.me', me); }
const S = {
  obs: [], byId: new Map(), user: [], community: [], hist: [],
  view: 0, open: false, radio: false, started: false, tweaked: false, sel: null, mode: null, place: null, mo: 0, tribeSel: null, sig: null,
  wx: store.get('da.wx.v4', { t: 0, tmax: null, tmin: null, rain: null, now: null, days: [] }),
  lastVisit: store.get('da.lastVisit', 0), lastSignal: 0, stale: false, me,
  biz: null, bizLoading: null, radius: new Map(), orbit: { cell: new Map() }, arrivals: new Set(), mapReady: false, sensors: [], fountains: [],
  heroes: [], tribes: [], signals: [], shared: [], partnerSel: null,
  /* the radar: where it is pinned and how far it reaches, kept between visits. A first visit starts at the print location,
     at 500 m, until the visitor's own place is known (findStart) */
  /* a first visit opens on the city's own centre, not on a printer: nothing is pointed at before the visitor chooses */
  scan: (() => { const c = CONFIG.SCAN || { lat: -37.769, lng: 144.963, r: 500, min: 250, max: 1500 }; const p = prefs.start2 ? prefs.scan || {} : simple() ? {} : printAt() || {}; const ok = p.lat != null && inBox(p.lat, p.lng); return { lat: ok ? p.lat : c.lat, lng: ok ? p.lng : c.lng, r: prefs.start2 ? clamp(+p.r || c.r, c.min || 250, c.max || 1500) : c.r }; })(),
};
const reduced = () => !prefs.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────── touch answers: a short buzz where phones allow it, and small sounds made here, not loaded ───────── */
/* an iPhone has no vibrate, but Safari gives a haptic when a switch is flipped inside a touch: a hidden one, made at the first
   pattern and flipped for patterns only (the real moments: a gate, a set down, a print), never for every tick */
let iosSw;
const buzz = ms => { try {
  if (!navigator.userActivation || navigator.userActivation.hasBeenActive) {
    if (navigator.vibrate) navigator.vibrate(ms);
    else if (Array.isArray(ms) && (!navigator.userActivation || navigator.userActivation.isActive) && document.body) {
      if (iosSw === undefined) { iosSw = document.createElement('label'); iosSw.setAttribute('aria-hidden', 'true'); iosSw.style.cssText = 'position:fixed;left:-9px;top:0;width:1px;height:1px;opacity:0;pointer-events:none'; iosSw.innerHTML = '<input type="checkbox" switch tabindex="-1">'; document.body.appendChild(iosSw); }
      iosSw.click();
    }
  } } catch (e) { /* no haptics */ } };
/* an old phone or tablet: the aura's own reading when inside it, else the same test (few cores, little memory, no audio worklets) */
const LITE = (() => { try { const ng = IN_AURA && window.parent.NG; if (ng && typeof ng.lite === 'boolean') return ng.lite; return (navigator.hardwareConcurrency || 2) <= 4 || (navigator.deviceMemory || 4) <= 2 || !window.AudioWorkletNode; } catch (e) { return false; } })();
const snd = (() => {
  let FQB = null;
  let ctx = null, bus = null, wet = null, hall = null, lastBlip = 0, hasLadder = false, mixLP = null, heatWS = null, drive = null, mon = null, stabLad = null, tap = null;
  const active = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
  /* ───────── the sound watched over. A phone can leave its sound "running" with its clock stopped, or give it back silent
     after something else took it; a voice can blow the mix up. Any of these, and the whole of it is built again at the next
     touch, as a reload would, instead of staying quiet until one ───────── */
  let sick = false, ctSeen = -1, ctAt = 0; const MONB = new Float32Array(512);
  function clockOK() {
    if (!ctx || ctx.state !== 'running') return false; const now = performance.now();
    if (ctx.currentTime !== ctSeen) { ctSeen = ctx.currentTime; ctAt = now; return true; } return now - ctAt < 1500;
  }
  function rebuild() {
    const old = ctx; ctx = null; bus = wet = hall = mixLP = heatWS = mon = stabLad = dubIn = tap = null; hasLadder = false; sick = false; ctSeen = -1; SLOTS.clear(); KS.clear(); NZ.clear(); CK.clear(); for (const k of Object.keys(FXB)) delete FXB[k];
    try { if (old && old.state !== 'closed') old.close().catch(() => {}); } catch (e) { /* gone */ }
  }
  setInterval(() => {
    if (!ctx || document.hidden || sick) return;
    if (ctx.state === 'running' && !clockOK()) sick = true;
    else if (mon && ctx.state === 'running') { mon.getFloatTimeDomainData(MONB); for (let i = 0; i < MONB.length; i += 8) if (!Number.isFinite(MONB[i])) { sick = true; break; } }
    /* broken while the radio plays: built again now (a phone still waits for a touch to let it sound) */
    if (sick && S.radio) ready();
  }, 1000);
  function ready() {
    if (!prefs.sound || !active()) return null;
    try {
      if (ctx && (sick || ctx.state === 'closed')) rebuild();
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; try { ctx = new AC({ latencyHint: 'playback' }); } catch (e) { ctx = new AC(); } bus = ctx.createGain(); bus.gain.value = 0.65;   /* a third louder than it was */
        /* the whole mix through a soft low-pass, so it stays deep and never shrill; El Niño opens it and drives it harder */
        heatWS = ctx.createWaveShaper(); mixLP = ctx.createBiquadFilter(); mixLP.type = 'lowpass'; mixLP.Q.value = 0.5;
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 2;
        /* the tamer: no ding, squeak or honk gets through sharp. A dip where a squeak lives, and the very top let down */
        const dip = ctx.createBiquadFilter(); dip.type = 'peaking'; dip.frequency.value = 2800; dip.Q.value = 1.1; dip.gain.value = -7;
        const shelf = ctx.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 4800; shelf.gain.value = -6;
        bus.connect(dip); dip.connect(shelf); shelf.connect(heatWS); heatWS.connect(mixLP); mixLP.connect(comp); comp.connect(ctx.destination); heatSet(!!prefs.nino, true);
        mon = ctx.createAnalyser(); mon.fftSize = 1024; comp.connect(mon); tap = comp;
        /* a small, soft room: two short delays fed back through a low-pass */
        wet = ctx.createGain(); wet.gain.value = 0.14; const d1 = ctx.createDelay(1), d2 = ctx.createDelay(1); d1.delayTime.value = 0.113; d2.delayTime.value = 0.171;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const fb = ctx.createGain(); fb.gain.value = 0.42;
        wet.connect(d1); wet.connect(d2); d1.connect(lp); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(bus);
        /* and a long, dark hall behind it: every sound that goes into the room also drifts into it */
        hall = ctx.createConvolver(); hall.buffer = hallBuffer(LITE ? 1.6 : 3.8); const hg = ctx.createGain(); hg.gain.value = 0.6; wet.connect(hall); hall.connect(hg); hg.connect(bus);
        /* the Moog ladder (ladder.js), once it has loaded; a plain low-pass until then */
        try { if (ctx.audioWorklet) ctx.audioWorklet.addModule('ladder.js').then(() => { hasLadder = true; }).catch(() => {}); } catch (e) { /* a plain low-pass */ }
      }
      /* a phone suspends sound when the page is put away, and some ("interrupted") only give it back inside a touch */
      if (ctx.state !== 'running' && ctx.state !== 'closed') { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
      return ctx;
    } catch (e) { return null; }
  }
  function heatSet(on, now) {
    if (!drive) { drive = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; drive[i] = Math.tanh(x * 2.4) / Math.tanh(2.4); } }
    mixLP.frequency.setTargetAtTime(on ? 7600 : 3200, ctx.currentTime, now ? 0.001 : 0.35); heatWS.curve = on ? drive : null;
  }
  /* ───────── one key and one tempo: A minor, from the low A, and 120 BPM. Every note a cell plays is moved to the nearest note
     of the scale, low; every sound lands on the next sixteenth of the bar; never a wall, two sounds a sixteenth at most ───────── */
  const AMIN = [0, 2, 3, 5, 7, 8, 10, 12];
  const qn = f => { const n = 12 * Math.log2(f / 55); const o = Math.floor(n / 12), d = n - o * 12; let best = 0; for (const st of AMIN) if (Math.abs(d - st) < Math.abs(d - best)) best = st; return 55 * Math.pow(2, (o * 12 + best) / 12); };
  const qf = f => { let x = f; while (x > 440) x /= 2; while (x < 55) x *= 2; return qn(x); };
  const SIX = 0.125; const SLOTS = new Map();
  const onGrid = t => Math.ceil((t - 0.004) / SIX) * SIX;
  /* notes laid out ahead (a constellation's song) are made a moment before they sound, not all at once: a long song never builds
     hundreds of voices in one go, so nothing stutters while the radio plays over it. Each still sounds on its own sixteenth */
  const AHEAD = []; let aheadT = 0;
  function drain() {
    if (!ctx) AHEAD.length = 0; const now = ctx ? ctx.currentTime : 0;
    for (let i = 0; i < AHEAD.length;) { const a = AHEAD[i]; if (a.t > now + 0.3) { i++; continue; } AHEAD.splice(i, 1); if (a.t > now - 0.05) try { a.fn(); } catch (e) { /* a voice missing */ } }
    if (!AHEAD.length) { clearInterval(aheadT); aheadT = 0; }
  }
  function later(t, fn) { AHEAD.push({ t, fn }); if (!aheadT) aheadT = setInterval(drain, 40); drain(); }
  function room(t, force) { const k = Math.round(t / SIX); const n = SLOTS.get(k) || 0; if (n >= (LITE ? 1 : 2) && !force) return false; SLOTS.set(k, n + 1); if (SLOTS.size > 48) for (const key of [...SLOTS.keys()]) if (key < k - 16) SLOTS.delete(key); return true; }
  /* the hall's tail: noise falling away over a few seconds, darker as it goes */
  function hallBuffer(sec) {
    const sr = ctx.sampleRate, n = Math.floor(sr * sec), b = ctx.createBuffer(2, n, sr); const r = seeded('hall');
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += ((r() * 2 - 1) - lp) * (0.85 - 0.8 * t); d[i] = lp * Math.pow(1 - t, 2.4) * 0.6; } }
    return b;
  }
  /* every sound leaves through a panner: mostly dry, a little into the room */
  function out(node, pan = 0, room = 1) {
    let n = node; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); n = p; }
    const fx = fxNow && fxBus(fxNow); n.connect(fx ? fx.in : bus); const rm = room * (fx ? fx.room : 1); if (rm) { const r = ctx.createGain(); r.gain.value = rm; n.connect(r); r.connect(wet); }
  }
  /* ───────── the three filters a layer can be heard through (the radio's knobs choose them): MIST, soft and close, every
     edge rounded off; HALL, the note let go into a long dark hall, ethereal, a choir's room; DEPTH, under water, the note into
     the dub echo and the low end only. Each takes the ding, the squeak and the honk out of whatever plays through it ───────── */
  let fxNow = null; const FXB = {};
  function fxBus(k) {
    if (FXB[k]) return FXB[k]; const was = fxNow; fxNow = null;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4; const g = ctx.createGain(); lp.connect(g); g.connect(bus); let rm = 1;
    if (k === 'mist') { lp.frequency.value = 1300; g.gain.value = 1.05; rm = 0.6; }
    else if (k === 'hall') { lp.frequency.value = 2600; g.gain.value = 0.5; rm = 3.6; const h = ctx.createGain(); h.gain.value = 1.3; lp.connect(h); h.connect(hall); }
    /* BLOOM: the note opened out, its low end let go, into an echo that keeps coming back brighter than it left and on into the hall: dreamy, far */
    else if (k === 'bloom') { lp.frequency.value = 7000; g.gain.value = 0.55; rm = 4.2; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 320; lp.connect(hp);
      const d = ctx.createDelay(1); d.delayTime.value = 0.25; const fb = ctx.createGain(); fb.gain.value = 0.58; const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 4200;
      hp.connect(d); d.connect(dl); dl.connect(fb); fb.connect(d); dl.connect(g); const dg = ctx.createGain(); dg.gain.value = 0.5; dl.connect(dg); dg.connect(hall); const h = ctx.createGain(); h.gain.value = 1.4; hp.connect(h); h.connect(hall); }
    /* LUNG: the whole layer breathes, its filter opening and closing slowly, one breath in eight seconds, as if heard from under water */
    else if (k === 'lung') { lp.frequency.value = 1100; lp.Q.value = 2.2; g.gain.value = 1.1; rm = 1.2; const lfo = ctx.createOscillator(); lfo.frequency.value = 0.125; const lg = ctx.createGain(); lg.gain.value = 800; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); }
    else { lp.frequency.value = 380; g.gain.value = 1.4; rm = 0.25; const d = ctx.createGain(); d.gain.value = 1; lp.connect(d); d.connect(dubEcho()); }
    fxNow = was; return (FXB[k] = { in: lp, room: rm });
  }
  const withFx = (k, fn) => { const was = fxNow; fxNow = k; try { return fn(); } finally { fxNow = was; } };
  /* a plucked string: a burst of noise through a short delay line that loses a little each pass */
  const KS = new Map();
  function string(freq, dur = 1.4, damp = 0.9965) {
    const key = `${Math.round(freq)}|${dur}|${damp}`; if (KS.has(key)) return KS.get(key);
    const sr = ctx.sampleRate, n = Math.floor(sr * dur), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const P = Math.max(2, Math.round(sr / freq)), line = new Float32Array(P); const r = seeded(key);
    for (let i = 0; i < P; i++) line[i] = r() * 2 - 1;
    for (let i = 0, j = 0; i < n; i++) { const a = line[j], b = line[(j + 1) % P]; d[i] = a; line[j] = damp * 0.5 * (a + b); j = (j + 1) % P; }
    for (let i = 0; i < 48; i++) d[i] *= i / 48;
    for (let i = 0; i < 2048; i++) d[n - 1 - i] *= i / 2048;
    KS.set(key, buf); while (KS.size > 40) KS.delete(KS.keys().next().value); return buf;
  }
  function play(buf, gain, at = 0, pan = 0, cut = 4800) {
    const s = ctx.createBufferSource(); s.buffer = buf; const g = ctx.createGain(); g.gain.value = gain; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut;
    s.connect(lp); lp.connect(g); out(g, pan, 0.8); s.start(ctx.currentTime + at);
  }
  /* the same seed gives the same samples, so each length is made once */
  const NZ = new Map(), CK = new Map();
  function noise(dur) { if (NZ.has(dur)) return NZ.get(dur); const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); const r = seeded(dur); for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; NZ.set(dur, b); return b; }
  const env = (g, t, a, peak, hold, rel) => { const p = Math.max(0.0002, peak); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p, t + a); g.gain.setValueAtTime(p, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel); };
  const osc = (type, f, t, end) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end + 0.05); return o; };
  const vib = (o, t, end, rate, depth, delay = 0) => { const l = ctx.createOscillator(); l.frequency.value = rate; const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(depth, t + delay + 0.08); l.connect(g); g.connect(o.frequency); l.start(t); l.stop(end + 0.05); };
  const semi = (f, n) => f * Math.pow(2, n / 12);

  /* ───────── the lives play small instruments, each call cut down to a few soft notes, a little out of tune ───────── */
  const wob = () => Math.pow(2, (Math.random() - 0.5) * 0.016);
  const INST = {
    /* frogs and beetles: a kalimba, wood and thumb */
    kalimba(f, t, d, v, pan) { f *= wob(); const e = ctx.createGain(); const o = osc('sine', f, t, t + 0.6); o.connect(e); const o2 = osc('sine', f * 4.9, t, t + 0.12); const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.18, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08); o2.connect(g2); g2.connect(e);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(v, t + 0.006); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); out(e, pan); },
    /* spiders, snails and worms: a string */
    harp(f, t, d, v, pan) { const s2 = ctx.createBufferSource(); s2.buffer = string(f * wob(), 1.6, 0.9968); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const g = ctx.createGain(); g.gain.value = v * 1.5; s2.connect(lp); lp.connect(g); out(g, pan); s2.start(t); },
    /* mammals: a soft boop that bends down */
    boop(f, t, d, v, pan) { f *= wob(); const end = t + d + 0.2; const o = osc('sine', f * 1.12, t, end); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + d + 0.1); const e = ctx.createGain(); o.connect(e); env(e, t, 0.03, v, d * 0.4, d * 0.6 + 0.15); out(e, pan); },
    /* owls: a hollow note that falls a little */
    hoot(f, t, d, v, pan) { const end = t + 0.1 + d + 0.3; const o = osc('sine', f * 1.02, t, end); o.frequency.exponentialRampToValueAtTime(f * 0.94, end); const e = ctx.createGain(); o.connect(e); env(e, t, 0.1, v, d * 0.6, 0.3); out(e, pan); },
    /* reptiles: a small low bonk */
    bonk(f, t, d, v, pan) { const o = osc('sine', f * 1.5, t, t + 0.35); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); const e = ctx.createGain(); o.connect(e); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(v, t + 0.005); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); out(e, pan); },
  };
  const INST_W = { kalimba: 'KALIMBA', harp: 'STRING', boop: 'BOOP', hoot: 'HOLLOW NOTE', bonk: 'WOOD' };
  /* the whistle, the music box and the glass went with the move to one deep key: their calls go to the hollow note, the
     kalimba and the string */
  const INST_AS = { whistle: 'hoot', box: 'kalimba', chime: 'harp' };
  /* each kind's call: an instrument and a few notes, in semitones above the string's own note, with how long each lasts */
  const MOTIF = {
    bird: ['whistle', [[0, 0.16], [4, 0.16], [7, 0.34]]], parrot: ['box', [[7, 0.12], [12, 0.12], [7, 0.22]]], waterbird: ['whistle', [[0, 0.34], [-5, 0.48]]],
    owl: ['hoot', [[0, 0.5], [-2, 0.66]]], raptor: ['whistle', [[12, 0.24], [7, 0.5]]],
    bee: ['box', [[0, 0.1], [2, 0.1], [0, 0.1], [2, 0.18]]], wasp: ['box', [[2, 0.1], [0, 0.1], [2, 0.18]]], fly: ['box', [[0, 0.09], [1, 0.09], [0, 0.16]]],
    beetle: ['kalimba', [[0, 0.22], [3, 0.3]]], bug: ['box', [[5, 0.14], [3, 0.2]]], butterfly: ['box', [[0, 0.13], [4, 0.13], [7, 0.13], [12, 0.26]]],
    moth: ['box', [[7, 0.36], [5, 0.52]]], grasshopper: ['box', [[12, 0.08], [12, 0.08], [12, 0.08], [12, 0.16]]], mantis: ['harp', [[0, 0.36], [5, 0.36]]],
    dragonfly: ['chime', [[12, 0.26], [19, 0.46]]], spider: ['harp', [[0, 0.26], [7, 0.26], [12, 0.44]]], orb: ['harp', [[0, 0.24], [7, 0.24], [12, 0.24], [7, 0.44]]],
    snail: ['harp', [[-5, 0.66]]], segmented: ['harp', [[-7, 0.66]]], frog: ['kalimba', [[0, 0.28], [0, 0.36]]],
    turtle: ['bonk', [[0, 0.46], [-5, 0.56]]], lizard: ['bonk', [[0, 0.26], [2, 0.36]]], snake: ['bonk', [[-2, 0.66]]],
    mammal: ['boop', [[0, 0.3], [3, 0.4]]], possum: ['boop', [[0, 0.28], [3, 0.28], [0, 0.42]]], macropod: ['bonk', [[0, 0.3], [0, 0.4]]], rodent: ['box', [[12, 0.11], [14, 0.17]]],
    flyingfox: ['chime', [[12, 0.34], [7, 0.34], [3, 0.56]]], bat: ['chime', [[19, 0.2], [24, 0.32]]],
    fox: ['harp', [[0, 0.26], [5, 0.4]]], cat: ['harp', [[7, 0.26], [0, 0.4]]], dog: ['boop', [[0, 0.22], [0, 0.32]]], rabbit: ['box', [[7, 0.13], [12, 0.22]]],
    aquatic: ['chime', [[0, 0.54], [7, 0.64]]], plant: ['chime', [[0, 0.9]]], fungi: ['chime', [[-5, 0.9]]], ape: ['boop', [[0, 0.4], [-2, 0.4], [0, 0.56]]], paw: ['kalimba', [[0, 0.36]]],
  };
  /* ───────── the people make small, real sounds, close up: a sleeve, two taps, a cup, a pencil, a hum, a breath ───────── */
  const softNoise = (t, dur, f0, f1, q, v, pan, room = 0.6) => { const s2 = ctx.createBufferSource(); s2.buffer = noise(dur); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur); bp.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s2.connect(bp); bp.connect(g); out(g, pan, room); s2.start(t); };
  function hum(f, t, d, v, pan) { f *= wob(); const end = t + 0.18 + d + 0.35; const o = osc('triangle', f, t, end); vib(o, t, end, 4.8, f * 0.006, 0.15); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; const e = ctx.createGain(); o.connect(lp); lp.connect(e); env(e, t, 0.18, v, d, 0.35); out(e, pan, 0.9); }
  const SOUNDS = {
    swish: (f, t, v, pan) => softNoise(t, 0.38, 1600, 4200, 1.1, v * 0.5, pan),
    taps: (f, t, v, pan) => { for (const dt of [0, 0.17]) { const o = osc('sine', 560 * wob(), t + dt, t + dt + 0.08); const e = ctx.createGain(); o.connect(e); e.gain.setValueAtTime(0.0001, t + dt); e.gain.exponentialRampToValueAtTime(v * 0.6, t + dt + 0.003); e.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.07); out(e, pan, 0.4); softNoise(t + dt, 0.03, 2500, 1800, 2, v * 0.25, pan, 0.2); } },
    /* a cup set down: a dull knock now, not a ring of glass */
    cup: (f, t, v, pan) => softNoise(t, 0.12, 900, 520, 4, v * 0.42, pan, 0.4),
    pencil: (f, t, v, pan) => { for (const dt of [0, 0.11, 0.2]) softNoise(t + dt, 0.07, 3600, 5200, 3, v * 0.22, pan, 0.2); },
    hum: (f, t, v, pan) => hum(f * 0.5, t, 0.6, v * 0.5, pan),
    hums: (f, t, v, pan) => { hum(f * 0.5, t, 0.6, v * 0.36, pan - 0.25); hum(f * 0.75, t + 0.09, 0.55, v * 0.32, pan + 0.25); },
    breath: (f, t, v, pan) => { softNoise(t, 0.5, 700, 1100, 0.8, v * 0.2, pan, 0.3); hum(f * 0.5, t + 0.2, 0.3, v * 0.25, pan); },
  };
  const GAIN = { whistle: 0.06, box: 0.05, kalimba: 0.09, harp: 0.05, boop: 0.08, hoot: 0.07, chime: 0.035, bonk: 0.09, people: 0.3 };
  const SOUND_W = { swish: 'A SLEEVE', taps: 'TWO TAPS', cup: 'A CUP', pencil: 'A PENCIL', hum: 'A HUM', hums: 'TWO HUMS', breath: 'A BREATH' };
  /* ───────── noise, for grit and drops ───────── */
  /* a short burst of filtered noise: drops, breath, grit */
  function burst(t, dur, type, f, q, v, pan, room) { const s0 = ctx.createBufferSource(); s0.buffer = noise(dur + 0.02); const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s0.connect(fl); fl.connect(g); out(g, pan, room); s0.start(t); s0.stop(t + dur + 0.03); }
  /* ───────── the radar is the instrument: a cell sounds when the sweep reaches it, in its layer's voice. Not chimes ─────────
     LIFE the dub stab into its echo, WATER a sub that drops, COMMUNITY dust and noise, POLLUTION a low stab; FOG a breath of a
     voice, a vowel that bends down into the hall; BURIAL a voice buried in dust. New is brighter; danger bends further, or
     doubles */
  const VOW = [[730, 1090], [570, 840], [300, 870], [440, 1020], [270, 2290], [660, 1700]];
  function breath(f, t, v, pan, bright, danger, vi) {
    const L = 0.45 + Math.random() * 0.6; const o = osc('sawtooth', f, t, t + L + 0.1); o.frequency.exponentialRampToValueAtTime(f * (danger ? 0.84 : 0.96), t + L);
    const [f1, f2] = VOW[vi % VOW.length]; const e = ctx.createGain();
    for (const [ff, g] of [[f1, 1], [f2, 0.45]]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = 7; const gg = ctx.createGain(); gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(e); }
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 3400 : 1300; e.connect(lp);
    const a = ctx.createGain(); lp.connect(a); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 2.2), t + 0.05); a.gain.exponentialRampToValueAtTime(0.0001, t + L); out(a, pan, 2.4);
  }
  /* ───────── the ladder: a Moog filter, its cutoff and resonance as params (a biquad stands in until it has loaded) ───────── */
  function ladder(cut, res = 0.3, drive = 1, keep = false) {
    if (hasLadder) { try { const n = new AudioWorkletNode(ctx, 'ladder', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: { keep } }); const c = n.parameters.get('cutoff'), r = n.parameters.get('resonance'), d = n.parameters.get('drive'); c.value = cut; r.value = res; d.value = drive; return { node: n, cut: c, res: r, drive: d }; } catch (e) { /* the biquad */ } }
    const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = cut; b.Q.value = 0.7 + res * 14; return { node: b, cut: b.frequency, res: b.Q, drive: null };
  }
  /* dust on a record: sparse clicks, high and dry */
  function crackle(t, dur, v, pan) {
    let b = CK.get(dur);
    if (!b) { const n = Math.floor(ctx.sampleRate * dur), d = (b = ctx.createBuffer(1, n, ctx.sampleRate)).getChannelData(0); const r = seeded('dust' + dur);
      for (let i = 0; i < n; i++) if (r() < 0.0016) { const a = (r() * 2 - 1); for (let k = 0; k < 6 && i + k < n; k++) d[i + k] = a * Math.pow(0.5, k); } CK.set(dur, b); }
    const s0 = ctx.createBufferSource(); s0.buffer = b; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400; const g = ctx.createGain(); g.gain.value = v;
    s0.connect(hp); hp.connect(g); out(g, pan, 0.3); s0.start(t);
  }
  /* BURIAL: dust, a voice cut into two syllables a fourth apart and pitched down, and a sub that swells under them */
  function burialV(f, t, v, pan, bright, danger, vi) {
    crackle(t, 0.9, v * 0.9, -pan);
    const chop = (ff, tt, L, vv, k) => { const o = osc('sawtooth', ff, tt, tt + L + 0.05); o.frequency.exponentialRampToValueAtTime(ff * (danger ? 0.8 : 0.94), tt + L); const [f1, f2] = VOW[k % VOW.length]; const e = ctx.createGain();
      for (const [fq, g] of [[f1 * 0.8, 1], [f2 * 0.8, 0.4]]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 6; const gg = ctx.createGain(); gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(e); }
      const a = ctx.createGain(); e.connect(a); a.gain.setValueAtTime(0.0001, tt); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, vv), tt + 0.012); a.gain.setValueAtTime(vv, tt + L * 0.7); a.gain.exponentialRampToValueAtTime(0.0001, tt + L); out(a, pan, 2.2); };
    chop(qn(f * 0.5), t, 0.17, v * 2.4, vi || 0); chop(qn(f * 0.375), t + 0.25, 0.26, v * 1.8, (vi || 0) + 1);
    const sb = osc('sine', f / 4, t, t + 1.6); const sg = ctx.createGain(); sb.connect(sg); env(sg, t, 0.5, v * 2, 0.2, 0.9); out(sg, 0, 0.4);
  }
  /* DUB: a deep round note from below, and a short muted chord thrown into a tape echo that repeats and darkens, a dotted
     eighth at 120 apart. Every note is a cell the hand found; nothing plays under them. The voice a cell has decides which:
     the note and the chord, the chord alone, or the note alone */
  let dubIn = null;
  function dubEcho() {
    if (dubIn) return dubIn; const was = fxNow; fxNow = null;
    dubIn = ctx.createGain(); const d = ctx.createDelay(2); d.delayTime.value = 0.375; const fb = ctx.createGain(); fb.gain.value = 0.5;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 220; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
    dubIn.connect(d); d.connect(hp); hp.connect(lp); lp.connect(fb); fb.connect(d);
    const o = ctx.createGain(); o.gain.value = 0.8; lp.connect(o); out(o, 0, 0.5);
    fxNow = was; return dubIn;
  }
  function dubV(f, t, v, pan, bright, danger, vi) {
    const k = (vi || 0) % 3;
    if (k !== 1) {
      let b = f; while (b > 82) b /= 2; while (b < 41) b *= 2;
      const e = ctx.createGain(); const o = osc('sine', b * 1.6, t, t + 1.9); o.frequency.exponentialRampToValueAtTime(b, t + 0.08); o.connect(e);
      const o2 = osc('triangle', b * 2, t, t + 0.6); const g2 = ctx.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(e);
      env(e, t, 0.01, v * 3, 0.16, 1.4); out(e, pan * 0.25, 0.2);
    }
    if (k !== 2) {
      let c = f; while (c > 560) c /= 2; while (c < 280) c *= 2;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = bright ? 1500 : 1000; bp.Q.value = 1.6; const e = ctx.createGain(); bp.connect(e);
      for (const n of k === 0 ? [0, 3, 7] : [0, 5, 10]) for (const dt of [-7, 7]) { const so = osc('sawtooth', qn(semi(c, n)), t, t + 0.22); so.detune.value = dt; so.connect(bp); }
      env(e, t, 0.004, v * (danger ? 0.9 : 0.6), 0.05, 0.1); out(e, pan, 0.3); e.connect(dubEcho());
    }
  }
  /* WATER: a sub note that drops, round and slow, nothing over it */
  function dropV(f, t, v, pan, bright) {
    let b = f; while (b > 110) b /= 2; while (b < 55) b *= 2;
    const o = osc('sine', b * 2, t, t + 1.5); o.frequency.exponentialRampToValueAtTime(b, t + 0.35);
    const o2 = osc('triangle', b, t, t + 0.6); const g2 = ctx.createGain(); g2.gain.value = bright ? 0.22 : 0.12; o2.connect(g2);
    const e = ctx.createGain(); o.connect(e); g2.connect(e); env(e, t, 0.02, v * 3.2, 0.12, 1.15); out(e, pan * 0.4, 0.5);
  }
  /* ───────── after Boadicea (1987): no backing track, only what the hand finds. A choir's 'ah', low and wide, for a cluster
     of lives; a depth charge, a sub that falls away into the echo, for a life in danger; a round low note for the rest ───────── */
  function choirV(f, t, v, pan) {
    let b = f; while (b > 220) b /= 2; while (b < 110) b *= 2; const end = t + 4.4;
    const e = ctx.createGain(); const fm = [[700, 6, 1], [1150, 8, 0.5], [2600, 10, 0.16]].map(([fq, q, g]) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = q; const gg = ctx.createGain(); gg.gain.value = g; bp.connect(gg); gg.connect(e); return bp; });
    for (const [m, dt, g] of [[1, -9, 1], [1, 8, 1], [1.5, 3, 0.45], [0.5, 0, 0.5]]) { const o = osc('sawtooth', qn(b * m), t, end); o.detune.value = dt; vib(o, t, end, 4.4, b * m * 0.004, 0.6); const og = ctx.createGain(); og.gain.value = g; o.connect(og); fm.forEach(bp => og.connect(bp)); }
    env(e, t, 0.9, v * 2.4, 0.9, 2.5); out(e, pan * 0.6, 2.2);
  }
  function depthV(f, t, v, pan) {
    const o = osc('sine', 96, t, t + 3); o.frequency.exponentialRampToValueAtTime(34, t + 1.5); const e = ctx.createGain(); o.connect(e); env(e, t, 0.008, v * 4.2, 0.05, 2.3);
    const th = ctx.createBufferSource(); th.buffer = noise(0.4); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 150; const tg = ctx.createGain(); tg.gain.setValueAtTime(v * 3, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); th.connect(lp); lp.connect(tg); tg.connect(e); th.start(t);
    out(e, pan * 0.2, 0.7); const s2 = ctx.createGain(); s2.gain.value = 0.45; e.connect(s2); s2.connect(dubEcho());
  }
  /* ───────── after Animal Collective's My Girls (2009), what it is made of and never the song. COLLECTIVE: plucked notes going
     round one chord, quick and even, under voices stacked into one slow 'ooh', far off in the hall, and a soft pulse under them,
     a heart heard through water. The more lives together, the more voices ───────── */
  function collectiveV(f, t, v, pan, bright, danger, vi, cluster) {
    let b = f; while (b > 440) b /= 2; while (b < 220) b *= 2;
    const ns = (vi || 0) % 2 ? [0, 7, 12, 16, 19, 16, 12, 7] : [0, 4, 7, 12, 16, 12, 7, 4];
    ns.forEach((n, i) => { const tt = t + i * SIX / 2, ff = qn(semi(b, n)), e = ctx.createGain();
      for (const [ty, dt, g] of [['triangle', -6, 1], ['sawtooth', 6, 0.22]]) { const o = osc(ty, ff, tt, tt + 0.3); o.detune.value = dt; const og = ctx.createGain(); og.gain.value = g; o.connect(og); og.connect(e); }
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 3200 : 1900; e.connect(lp); const a = ctx.createGain(); lp.connect(a); env(a, tt, 0.004, v * (1.3 - i * 0.07), 0.02, 0.22); out(a, pan + Math.sin(i * 1.3) * 0.35, 2.6); });
    oohV(b / 2, t, v * (cluster ? 0.9 : 0.55), -pan * 0.5, cluster || danger ? 3 : 2);
    const k = osc('sine', 110, t, t + 0.5); k.frequency.exponentialRampToValueAtTime(42, t + 0.18); const kg = ctx.createGain(); k.connect(kg); env(kg, t, 0.004, v * 2.2, 0.02, 0.32); out(kg, 0, 0.15);
  }
  /* voices stacked into one 'ooh': a few, each a little apart in time and tune, swelling slowly and let go into the hall */
  function oohV(f, t, v, pan, n = 2) {
    const end = t + 3.6, e = ctx.createGain(); const fm = [[350, 7, 1], [800, 9, 0.35]].map(([fq, q, g]) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = q; const gg = ctx.createGain(); gg.gain.value = g; bp.connect(gg); gg.connect(e); return bp; });
    for (let i = 0; i < n; i++) { const o = osc('sawtooth', qn(f * [1, 1.5, 2][i % 3]), t, end); o.detune.value = (i - (n - 1) / 2) * 9; vib(o, t, end, 4.8 + i * 0.4, f * 0.005, 0.5); const og = ctx.createGain(); og.gain.value = 1 / (i + 1); o.connect(og); fm.forEach(bp => og.connect(bp)); }
    env(e, t, 1.1, v * 2.2, 0.6, 1.8); out(e, pan, 3);
  }
  /* BREATH: a breath taken and let go under water, the in rising and the out falling, a hum in the chest on the note under the
     out, and now and then a few small bubbles. As slow as breathing is */
  function breathV(f, t, v, pan, bright, danger, vi) {
    const inL = 0.9 + ((vi || 0) % 3) * 0.2, outL = inL * 1.5, end = t + inL + outL, P = x => Math.max(0.0002, x);
    const s0 = ctx.createBufferSource(); s0.buffer = noise(2.8); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(380, t); bp.frequency.exponentialRampToValueAtTime(bright ? 1500 : 1100, t + inL); bp.frequency.exponentialRampToValueAtTime(260, end);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(P(v * 1.6), t + inL * 0.9); g.gain.exponentialRampToValueAtTime(P(v * 0.5), t + inL + 0.12); g.gain.exponentialRampToValueAtTime(P(v * 1.3), t + inL + outL * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, end);
    s0.connect(bp); bp.connect(lp); lp.connect(g); out(g, pan * 0.5, 1.4); s0.start(t); s0.stop(end + 0.05);
    let h = f; while (h > 165) h /= 2; while (h < 82) h *= 2; const ht = t + inL, ho = osc('sine', h, ht, end), ho2 = osc('triangle', h * 2, ht, end);
    const hf = ctx.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 300; hf.Q.value = 3; const hg = ctx.createGain(), h2 = ctx.createGain(); h2.gain.value = 0.25; ho2.connect(h2); h2.connect(hf); ho.connect(hg); hf.connect(hg);
    env(hg, ht, 0.4, v * (danger ? 1.6 : 1.1), outL * 0.4, outL * 0.5); out(hg, pan * 0.3, 1);
    if (!((vi || 0) % 2)) for (let i = 0; i < 3; i++) { const bt = ht + 0.2 + i * 0.13 + Math.random() * 0.05, bf = 700 + Math.random() * 900, bo = osc('sine', bf, bt, bt + 0.08); bo.frequency.exponentialRampToValueAtTime(bf * 1.8, bt + 0.06); const bg = ctx.createGain(); env(bg, bt, 0.003, v * 0.5, 0.01, 0.05); bo.connect(bg); out(bg, pan + (Math.random() - 0.5) * 0.6, 0.8); }
  }
  /* a fuzz: the wave pushed into a soft clip, harder as k grows; each strength made once */
  const CURVES = new Map();
  const shaper = k => { if (!CURVES.has(k)) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = Math.tanh((i / (n - 1) * 2 - 1) * k); CURVES.set(k, c); } const w = ctx.createWaveShaper(); w.curve = CURVES.get(k); w.oversample = '2x'; return w; };
  /* RIOT, after Atari Teenage Riot: a break run too fast, its kick and snare torn through a clipped fuzz, and now and then a voice
     that screams upward through a narrow mouth. No louder than the others: its edge is in the tear, not the level */
  function riotV(f, t, v, pan, bright, danger, vi) {
    const w = shaper(danger ? 14 : 8), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 6400 : 5200; const o0 = ctx.createGain(); o0.gain.value = 0.5; w.connect(lp); lp.connect(o0); out(o0, pan * 0.4, 0.4);
    const pat = (vi || 0) % 2 ? [1, 0, 2, 2, 0, 2, 1, 2] : [1, 2, 0, 2, 1, 0, 2, 2], st = SIX / 2;
    pat.forEach((h, i) => { const tt = t + i * st; if (!h) return;
      if (h === 1) { const k = osc('sine', 160, tt, tt + 0.2); k.frequency.exponentialRampToValueAtTime(45, tt + 0.08); const kg = ctx.createGain(); env(kg, tt, 0.002, v * 3, 0.01, 0.14); k.connect(kg); kg.connect(w); }
      else { const s0 = ctx.createBufferSource(); s0.buffer = noise(0.2); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.9; const sg = ctx.createGain(); env(sg, tt, 0.001, v * 2.4, 0.01, 0.07); s0.connect(bp); bp.connect(sg); sg.connect(w); s0.start(tt); s0.stop(tt + 0.2); } });
    if ((vi || 0) % 3 === 0 || danger) { const L = 0.7, so = osc('sawtooth', qn(f), t, t + L); so.frequency.exponentialRampToValueAtTime(f * 2.5, t + L); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 8; bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(2800, t + L);
      const sg = ctx.createGain(); env(sg, t, 0.02, v * 1.6, L * 0.6, L * 0.35); so.connect(bp); bp.connect(sg); const w2 = shaper(20); sg.connect(w2); const g2 = ctx.createGain(); g2.gain.value = 0.35; w2.connect(g2); out(g2, -pan, 1.2); }
  }
  /* RIFF, after the Yeah Yeah Yeahs: a kit played straight (kick, hat, snare, hat), and a fuzzed guitar on two notes cut short like
     a hand on the strings, the third let ring */
  function riffV(f, t, v, pan, bright, danger, vi) {
    let r = f; while (r > 165) r /= 2; while (r < 82) r *= 2;
    ['k', 'h', 's', 'h'].forEach((d, i) => { const tt = t + i * SIX;
      if (d === 'k') { const k = osc('sine', 130, tt, tt + 0.3); k.frequency.exponentialRampToValueAtTime(48, tt + 0.1); const kg = ctx.createGain(); env(kg, tt, 0.002, v * 3, 0.02, 0.22); k.connect(kg); out(kg, 0, 0.2); return; }
      const s0 = ctx.createBufferSource(); s0.buffer = noise(0.25); const fl = ctx.createBiquadFilter(); fl.type = d === 's' ? 'bandpass' : 'highpass'; fl.frequency.value = d === 's' ? 1700 : 7000; const sg = ctx.createGain(); env(sg, tt, 0.001, v * (d === 's' ? 2 : 0.6), 0.01, d === 's' ? 0.14 : 0.04); s0.connect(fl); fl.connect(sg); out(sg, d === 's' ? pan * 0.2 : 0.3, d === 's' ? 1 : 0.3); s0.start(tt); s0.stop(tt + 0.25); });
    const w = shaper(danger ? 12 : 6), cab = ctx.createBiquadFilter(); cab.type = 'lowpass'; cab.frequency.value = bright ? 3600 : 2600; const go = ctx.createGain(); go.gain.value = 0.4; w.connect(cab); cab.connect(go); out(go, pan, 0.6);
    ((vi || 0) % 2 ? [0, 0, 3] : [0, 5, 7]).forEach((n, i) => { const tt = t + i * SIX * 1.5, L = i === 2 ? 0.5 : 0.11, ff = qn(semi(r, n)), e = ctx.createGain(); for (const m of [1, 1.5, 2]) { const o = osc('sawtooth', ff * m, tt, tt + L + 0.05); o.detune.value = m === 1.5 ? 4 : 0; o.connect(e); } env(e, tt, 0.003, v * 0.9, L * 0.6, L * 0.4); e.connect(w); });
  }
  /* the knob a layer is heard through is its instrument in the mix: MIST ambient and close, the soft pluck, the choir for a
     cluster, the depth charge for a life in danger; HALL ethereal, the choir on every note and air an octave above it; DEPTH
     electro, a sub pulse under the note and the note an octave up into the dub echo. El Niño heats each: a breath of choir over
     the mist, the octave of air always in the hall, a quick arpeggio over the depth */
  function boaV(f, t, v, pan, bright, danger, vi, cluster) {
    const k = fxNow || 'mist', hot = !!prefs.nino;
    if (k === 'hall') { choirV(f, t, v * 0.9, pan); if (cluster || hot) choirV(f * 2, t + SIX, v * 0.45, -pan); if (danger) depthV(f, t, v * 0.6, pan); return; }
    if (k === 'depth') { depthV(f, t, v * 0.8, pan); dubV(f * 2, t + SIX, v * 0.6, pan, true, danger, 2); if (hot) { dubV(f * 3, t + SIX * 2, v * 0.35, -pan, true, false, 2); dubV(f * 4, t + SIX * 3, v * 0.25, pan, true, false, 2); } return; }
    if (danger) depthV(f, t, v, pan);
    if (cluster) choirV(f, t + (danger ? SIX * 2 : 0), v * 0.8, pan);
    if (!danger && !cluster) dubV(f, t, v * 0.8, pan, bright, false, 2);
    if (hot) choirV(f, t + SIX * 2, v * 0.4, -pan);
  }
  /* COMMUNITY: dust on a record, and a breath of noise filtered round the note, falling */
  function dustV(f, t, v, pan, bright) {
    crackle(t, 0.6, v * 1.1, -pan);
    let c = f; while (c < 220) c *= 2; while (c > 880) c /= 2;
    const s0 = ctx.createBufferSource(); s0.buffer = noise(0.72); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(c * 2, t); bp.frequency.exponentialRampToValueAtTime(c, t + 0.5); bp.Q.value = bright ? 9 : 6;
    const g = ctx.createGain(); env(g, t, 0.06, v * 2.6, 0.08, 0.5); s0.connect(bp); bp.connect(g); out(g, pan, 1.6); s0.start(t); s0.stop(t + 0.74);
  }
  /* one ladder for every stab, kept for as long as the sound lives: a phone building and dropping a worklet for each stab is
     what tired its sound out. Built again as the real ladder once ladder.js has loaded */
  function stabLadder() {
    if (stabLad && (stabLad.wk || !hasLadder)) return stabLad;
    if (stabLad) try { stabLad.node.disconnect(); } catch (e) { /* gone */ }
    const lf = ladder(650, 0.35, 1.1, true); lf.wk = hasLadder; const o = ctx.createGain(); lf.node.connect(o); out(o, 0, 0.6); o.connect(dubEcho());
    stabLad = lf; return lf;
  }
  /* POLLUTION: a low stab, saws pulled apart, through the ladder, cut short into the echo; more of them in danger */
  function stabV(f, t, v, pan, bright, danger) {
    let b = f; while (b > 165) b /= 2; while (b < 82) b *= 2;
    const lf = stabLadder(); const r = danger ? 0.55 : 0.35;
    lf.cut.cancelScheduledValues(t); lf.cut.setValueAtTime(bright ? 1300 : 650, t); lf.cut.exponentialRampToValueAtTime(200, t + 0.28);
    lf.res.setValueAtTime(lf.wk ? r : 0.7 + r * 14, t); if (lf.drive) lf.drive.setValueAtTime(prefs.nino ? 2.2 : 1.1, t);
    const e = ctx.createGain(); env(e, t, 0.005, v * 1.9, 0.06, 0.22); e.connect(lf.node);
    for (const dt of danger ? [-26, 0, 26] : [-17, 17]) { const o = osc('sawtooth', b, t, t + 0.34); o.detune.value = dt; o.connect(e); }
  }
  /* what a knot sounds like, as a word and notes: for its sound, and for the little score on its card */
  function describe(spec = {}) {
    if (spec.fam) { const F = FAMILIES[spec.fam] || FAMILIES.people || { sound: 'breath' }; const sd = F.sound || 'breath'; return { people: sd, w: SOUND_W[sd] || '', notes: [[0, 0.5]], len: sd === 'pencil' ? 0.45 : sd === 'taps' ? 0.4 : sd === 'cup' ? 0.4 : 0.75 }; }
    const [inst0, notes] = MOTIF[spec.g] || MOTIF.paw; const inst = INST_AS[inst0] || inst0; return { inst, w: INST_W[inst], notes, len: notes.reduce((a, x) => a + x[1], 0) + 0.3 };
  }
  function knotAt(spec, f, t0, v, pan) {
    const d = describe(spec);
    if (d.people) { (SOUNDS[d.people] || SOUNDS.breath)(f, t0, GAIN.people * v, pan); return d.len; }
    let t = t0; for (const [s2, dur] of d.notes) { INST[d.inst](qn(semi(f, s2)), t, dur, (GAIN[d.inst] || 0.06) * v, pan); t += dur; }
    return d.len;
  }
  /* the turn made 32 kHz round its own circle (a short windowed sinc, its taps wrapping from the end to the start, so the join stays
     unbroken), then written as 16-bit WAV */
  function wavLoop(chans, sr) {
    const R = Math.min(sr, 32000), N = chans[0].length, M = Math.round(N * R / sr), st = N / M, fc = R < sr ? 0.45 * R / sr : 0.5, W = R < sr ? 8 : 0;
    const out = chans.map(x => { if (!W) return x; const y = new Float32Array(M); for (let k = 0; k < M; k++) { const p = k * st, i0 = Math.floor(p); let s = 0;
      for (let j = i0 - W + 1; j <= i0 + W; j++) { const t = p - j, w = 0.5 + 0.5 * Math.cos(Math.PI * t / W), h = t ? Math.sin(2 * Math.PI * fc * t) / (Math.PI * t) : 2 * fc; s += x[((j % N) + N) % N] * h * w; }
      y[k] = s; } return y; });
    const n = out[0].length, ch = out.length, ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab), str = (p, s) => { for (let i = 0; i < s.length; i++) v.setUint8(p + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
    v.setUint32(24, R, true); v.setUint32(28, R * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * ch * 2, true);
    for (let k = 0, o = 44; k < n; k++) for (let j = 0; j < ch; j++, o += 2) { const x = Math.max(-1, Math.min(1, out[j][k])); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7FFF, true); }
    return new Blob([ab], { type: 'audio/wav' });
  }
  return {
    describe,
    /* woken inside a touch itself, as phones require: true once sound can play */
    lite: LITE,
    /* one turn of what reaches the speaker, as a WAV that loops on itself: the mix taken sample by sample (no encoder, so no gap at
       either end), one turn and its tail, the tail (echo, hall) laid back over the head as it would ring into the next turn, cut to the
       turn exactly; no fade. 32 kHz stereo, 16-bit: about a megabyte for an eight-second turn */
    record(ms, tail = 3000) {
      const c = ready(); if (!c || !tap || !c.createScriptProcessor) return Promise.reject(new Error('none'));
      const sr = c.sampleRate, N = Math.round(ms / 1000 * sr), want = N + Math.round(tail / 1000 * sr), L = [], R = []; let got = 0;
      const sp = c.createScriptProcessor(4096, 2, 2);
      return new Promise((ok, no) => {
        sp.onaudioprocess = e => { if (got >= want) return; const ib = e.inputBuffer, l = ib.getChannelData(0), r = ib.numberOfChannels > 1 ? ib.getChannelData(1) : l; L.push(new Float32Array(l)); R.push(new Float32Array(r)); got += l.length;
          if (got < want) return; try { tap.disconnect(sp); sp.disconnect(); } catch (er) { /* gone */ }
          try { ok(wavLoop([L, R].map(parts => { const o = new Float32Array(N); let k = 0; for (const p of parts) for (let i = 0; i < p.length && k < want; i++, k++) o[k % N] += p[i]; return o; }), sr)); } catch (er) { no(er); } };
        tap.connect(sp); sp.connect(c.destination); setTimeout(() => { if (got < want) { try { tap.disconnect(sp); sp.disconnect(); } catch (er) { /* gone */ } no(new Error('record')); } }, ms + tail + 4000); });
    },
    wake() { const c = ready(); if (!c) return false; try { const b = c.createBuffer(1, 1, 22050); const s0 = c.createBufferSource(); s0.buffer = b; s0.connect(c.destination); s0.start(0); } catch (e) { /* silent */ } return true; },
    /* El Niño: the same tempo, more heat: the mix opened and driven harder */
    heat(on) { if (ctx && mixLP) heatSet(!!on); },
    /* sounding now, or waiting for a touch to be given its sound back */
    running: () => !!ctx && !sick && clockOK(),
    /* how loud the whole mix is now, 0 to 1, read off its output; and when the last note of the sweep sounded */
    level() { if (!mon || !ctx || ctx.state !== 'running' || sick) return 0; mon.getFloatTimeDomainData(MONB); let s = 0; for (let i = 0; i < MONB.length; i += 2) { const v = MONB[i]; if (Number.isFinite(v)) s += v * v; } return Math.min(1, Math.sqrt(s / (MONB.length / 2)) * 5); },
    noteAt: () => lastBlip,
    /* what is sounding, as n bands from low to high (40 Hz to 9 kHz, spaced as the ear hears them), each 0 to 1 */
    bands(n) { const o = new Array(n).fill(0); if (!mon || !ctx || ctx.state !== 'running' || sick) return o; if (!FQB || FQB.length !== mon.frequencyBinCount) FQB = new Uint8Array(mon.frequencyBinCount); mon.getByteFrequencyData(FQB);
      const hz = ctx.sampleRate / 2 / FQB.length; for (let i = 0; i < n; i++) { const a = Math.max(1, Math.floor(40 * Math.pow(225, i / n) / hz)), b = Math.max(a + 1, Math.floor(40 * Math.pow(225, (i + 1) / n) / hz)); let m = 0; for (let j = a; j < b && j < FQB.length; j++) m = Math.max(m, FQB[j]); o[i] = m / 255; } return o; },
    /* for the checks: the sound as a phone can leave it, running with nothing coming out */
    __sicken() { sick = true; },
    /* a dry click for a press: at once, but on a note of the key, so a knob turned climbs the scale */
    tick(f = 1700) {
      buzz(8); if (!ready()) return;
      /* low and round, a fingertip on wood: never above the E an octave over middle A */
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); let q = qn(f); while (q > 660) q /= 2;
      o.type = 'sine'; o.frequency.setValueAtTime(q, t); o.frequency.exponentialRampToValueAtTime(q * 0.6, t + 0.04);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.06);
    },
    /* a knot's own sound: an animal's instrument, or a voice for the people; f is the string's own note */
    knot(spec, f = 330, at = 0, v = 1, pan = 0) { if (!ready()) return describe(spec).len; const t = onGrid(ctx.currentTime + at); room(t, true); return knotAt(spec, qf(f), t, v, pan); },
    /* a string tied: shorter strings ring higher */
    pluck(len = 0.5, pan = 0, gain = 0.15) { buzz(8); if (!ready()) return; const t = onGrid(ctx.currentTime + 0.01); room(t, true); play(string(qn(150 + (1 - clamp(len, 0, 1)) * 470), 2, 0.997), gain * 0.75, t - ctx.currentTime, pan, 1700); },
    /* a string cut: muted, low */
    snap(pan = 0) { buzz([4, 24, 4]); if (!ready()) return; play(string(98, 0.35, 0.95), 0.18, 0, pan, 1600); },
    /* every string at once, slowly, high to low */
    strum(lens = [], dir = 1) { buzz(6); if (!ready()) return; const L = lens.length ? lens : [0.5]; const t0 = onGrid(ctx.currentTime + 0.01) - ctx.currentTime; L.forEach((l, i) => play(string(qn(150 + (1 - clamp(l, 0, 1)) * 470), 2, 0.997), 0.09, t0 + i * SIX, dir * (i / Math.max(1, L.length - 1) - 0.5), 3600)); },
    /* a song: each string plucked in the order it was tied, and each knot answering in its own voice */
    song(seq = []) { buzz(6); if (!ready() || !seq.length) return; const t0 = onGrid(ctx.currentTime + 0.06);
      for (const n of seq.slice(0, 180)) { const t = t0 + Math.round(n.t / SIX) * SIX; if (!room(t)) continue; later(t, () => { if (n.spec) knotAt(n.spec, qf(n.f), t, n.v || 0.8, n.pan || 0); else play(string(qn(n.f), n.dur || 2, n.dc || 0.997), n.g || 0.09, Math.max(0, t - ctx.currentTime), n.pan || 0, n.cut || 3600); }); } },
    /* a constellation born: four notes of the dub stab, rising, a sixteenth apart */
    born() { buzz([6, 30, 6]); if (!ready()) return; const t = onGrid(ctx.currentTime + 0.01); room(t, true); withFx('mist', () => [110, 130.81, 164.81, 220].forEach((f, i) => dubV(f, t + i * SIX, 0.04, (i - 1.5) * 0.3, true, false, 2))); },
    /* a cell reached by the sweep. spec: { g } a life, { fam } a place (its own small real sound). opt: v, pan, mood, bright
       (new), danger, vi (which voice) */
    ping(spec, f, opt = {}) {
      /* sure: a kept song's note, already one of the few its sixteenth holds, never dropped for another */
      if (!ready()) return false; const now = performance.now(); if (!opt.sure && now - lastBlip < 55) return false;
      const t = onGrid(ctx.currentTime + 0.03); if (!room(t, !!opt.sure)) return false; lastBlip = now;
      const v = opt.v == null ? 0.05 : opt.v; const pan = opt.pan || 0; const md = opt.mood || 'dub'; const fq = qf(f); const bright = !!opt.bright || !!prefs.nino;
      /* the voices left after the move to one deep key: LIFE's dub stab, WATER's falling sub, COMMUNITY's dust, POLLUTION's stab,
         a breath of a voice, a buried one; the places in a breath sound as their own small real sounds */
      const V = { dub: dubV, weight: dropV, dust: dustV, stab: stabV, burial: burialV, fog: breath, boa: boaV, collective: collectiveV, breath: breathV, riot: riotV, riff: riffV }[md] || dubV;
      withFx(opt.fx || 'mist', () => { if (spec.fam && md === 'fog') knotAt(spec, fq, t, v * 5, pan); else V(fq, t, v, pan, bright, opt.danger, opt.vi || 0, opt.cluster); });
      return true;
    },
    /* a thermal head stepping: filtered noise in short strokes (the square swings the level from nothing to full, 38 a second),
       faded out at the end instead of cut */
    printer(ms = 1200) {
      buzz([18, 36, 18, 36, 18, 36, 40]); if (!ready()) return;
      const t = ctx.currentTime, d = ms / 1000; const s = ctx.createBufferSource(); s.buffer = noise(d);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.1;
      const g = ctx.createGain(); g.gain.value = 0.04; const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 38; const lg = ctx.createGain(); lg.gain.value = 0.04;
      const f = ctx.createGain(); f.gain.setValueAtTime(1, t + Math.max(0, d - 0.05)); f.gain.linearRampToValueAtTime(0, t + d);
      lfo.connect(lg); lg.connect(g.gain); s.connect(bp); bp.connect(g); g.connect(f); f.connect(bus); s.start(t); lfo.start(t); s.stop(t + d); lfo.stop(t + d);
    },
    /* a poster put up: the low A as a dub stab, and the sub falling under it */
    horn() { buzz([40, 60, 120]); if (!ready()) return; const t = onGrid(ctx.currentTime + 0.02); room(t, true); depthV(55, t, 0.05, 0); withFx('hall', () => choirV(220, t + SIX * 2, 0.05, 0)); },
    /* the muse: one soft chord of the dub stab, high in the key */
    jelly(pan = 0) { if (!ready()) return; const t = onGrid(ctx.currentTime + 0.02); room(t, true); withFx('hall', () => choirV(220, t, 0.03, pan)); },
    /* the muse tapped: the low A and its fifth, swelling slowly and away */
    ship() { buzz([60, 80, 200]); if (!ready()) return; const t = onGrid(ctx.currentTime + 0.03); room(t, true); for (const [f, g] of [[55, 1], [82.41, 0.5], [110, 0.22]]) { const o = osc('sine', f, t, t + 3.4); const e = ctx.createGain(); o.connect(e); env(e, t, 0.7, 0.13 * g, 1.2, 1.4); out(e, 0, 0.6); } },
    /* the radar set down: two notes of the dub stab, the A and the E above it */
    toot() { buzz([20, 40, 20]); if (!ready()) return; const t = onGrid(ctx.currentTime + 0.02); room(t, true); withFx('mist', () => { dubV(110, t, 0.05, -0.2, false, false, 2); choirV(164.81, t + SIX * 3, 0.035, 0.2); }); },
    /* a step met: the dub stab rising, a note more the further along, in the same key as everything; never glass */
    reward(n = 1) {
      buzz([10, 30, 10, 30, 40]); if (!ready()) return; const t = onGrid(ctx.currentTime + 0.03); room(t, true); const F = [110, 130.81, 146.83, 164.81, 196, 220]; const k = Math.min(F.length, 1 + n);
      withFx('mist', () => { for (let i = 0; i < k; i++) dubV(F[i], t + i * SIX * 2, 0.05, (i - (k - 1) / 2) * 0.3, true, false, i === k - 1 ? 0 : 2); });
    },
    /* a gate passed on a first visit: one more note of a rising figure in A minor, the dub stab into its echo (the veil one,
       the radar two, W.I.S.H. three, PRINT four); everything open, the figure run through on the sixteenths to the high A,
       its home chord, and the sub falling under it */
    gate(n = 1) {
      buzz(n >= 5 ? [12, 40, 12, 40, 60] : [8, 30, 8]); if (!ready()) return; const t = onGrid(ctx.currentTime + 0.04); room(t, true); const F = [110, 130.81, 164.81, 196, 220];
      const k = Math.min(n, 5), step = n >= 5 ? SIX : SIX * 2;
      withFx('hall', () => { for (let i = 0; i < k; i++) dubV(F[i], t + i * step, 0.06, (i - (k - 1) / 2) * 0.3, true, false, i === k - 1 ? 0 : 2); });
      /* everything open: the choir comes in under the last note, and the depth charge falls under it */
      if (n >= 5) { depthV(110, t + step * k, 0.06, 0); withFx('hall', () => choirV(220, t + step * (k - 1), 0.05, 0)); }
    },
    /* paper torn off */
    tear() {
      buzz(12); if (!ready()) return; const t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = noise(0.22);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(4200, t); bp.frequency.exponentialRampToValueAtTime(900, t + 0.2);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); s.connect(bp); bp.connect(g); g.connect(bus); s.start(t);
    },
  };
})();
const tick = f => snd.tick(f);
