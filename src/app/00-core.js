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
if (!Number.isFinite(prefs.journey)) { prefs.journey = NEW_HERE ? 0 : 4; savePrefs(); }
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
  scan: (() => { const c = CONFIG.SCAN || { lat: -37.769, lng: 144.963, r: 500, min: 250, max: 1500 }; const p = prefs.start2 ? prefs.scan || {} : printAt() || {}; const ok = p.lat != null && inBox(p.lat, p.lng); return { lat: ok ? p.lat : c.lat, lng: ok ? p.lng : c.lng, r: prefs.start2 ? clamp(+p.r || c.r, c.min || 250, c.max || 1500) : c.r }; })(),
};
const reduced = () => !prefs.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────── touch answers: a short buzz where phones allow it, and small sounds made here, not loaded ───────── */
const buzz = ms => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) { /* no haptics */ } };
const snd = (() => {
  let ctx = null, bus = null, wet = null, hall = null, lastBlip = 0, hasLadder = false;
  const active = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
  function ready() {
    if (!prefs.sound || !active()) return null;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)(); bus = ctx.createGain(); bus.gain.value = 0.65;   /* a third louder than it was */
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 2; bus.connect(comp); comp.connect(ctx.destination);
        /* a small, soft room: two short delays fed back through a low-pass */
        wet = ctx.createGain(); wet.gain.value = 0.14; const d1 = ctx.createDelay(1), d2 = ctx.createDelay(1); d1.delayTime.value = 0.113; d2.delayTime.value = 0.171;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const fb = ctx.createGain(); fb.gain.value = 0.42;
        wet.connect(d1); wet.connect(d2); d1.connect(lp); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(bus);
        /* and a long, dark hall behind it: every sound that goes into the room also drifts into it */
        hall = ctx.createConvolver(); hall.buffer = hallBuffer(3.8); const hg = ctx.createGain(); hg.gain.value = 0.6; wet.connect(hall); hall.connect(hg); hg.connect(bus);
        /* the Moog ladder (ladder.js), once it has loaded; a plain low-pass until then */
        try { if (ctx.audioWorklet) ctx.audioWorklet.addModule('ladder.js').then(() => { hasLadder = true; }).catch(() => {}); } catch (e) { /* a plain low-pass */ }
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  /* the hall's tail: noise falling away over a few seconds, darker as it goes */
  function hallBuffer(sec) {
    const sr = ctx.sampleRate, n = Math.floor(sr * sec), b = ctx.createBuffer(2, n, sr); const r = seeded('hall');
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += ((r() * 2 - 1) - lp) * (0.85 - 0.8 * t); d[i] = lp * Math.pow(1 - t, 2.4) * 0.6; } }
    return b;
  }
  /* every sound leaves through a panner: mostly dry, a little into the room */
  function out(node, pan = 0, room = 1) {
    let n = node; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); n = p; }
    n.connect(bus); if (room) { const r = ctx.createGain(); r.gain.value = room; n.connect(r); r.connect(wet); }
  }
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
  function noise(dur) { const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); const r = seeded(dur); for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; return b; }
  const env = (g, t, a, peak, hold, rel) => { const p = Math.max(0.0002, peak); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p, t + a); g.gain.setValueAtTime(p, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel); };
  const osc = (type, f, t, end) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end + 0.05); return o; };
  const vib = (o, t, end, rate, depth, delay = 0) => { const l = ctx.createOscillator(); l.frequency.value = rate; const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(depth, t + delay + 0.08); l.connect(g); g.connect(o.frequency); l.start(t); l.stop(end + 0.05); };
  const semi = (f, n) => f * Math.pow(2, n / 12);

  /* ───────── the lives play small instruments, each call cut down to a few soft notes, a little out of tune ───────── */
  const wob = () => Math.pow(2, (Math.random() - 0.5) * 0.016);
  const INST = {
    /* birds: a soft whistle */
    whistle(f, t, d, v, pan) { f *= wob(); const end = t + 0.05 + d + 0.18; const o = osc('sine', f, t, end); vib(o, t, end, 5.6, f * 0.007, 0.04); const e = ctx.createGain(); o.connect(e); env(e, t, 0.05, v, d, 0.18); out(e, pan); },
    /* insects: a music-box tine */
    box(f, t, d, v, pan) { f *= wob(); const e = ctx.createGain(); for (const [m, gg] of [[1, 1], [3.98, 0.12]]) { const o = osc('sine', f * m, t, t + 0.8); const g = ctx.createGain(); g.gain.value = gg; o.connect(g); g.connect(e); }
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(v, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.75); out(e, pan); },
    /* frogs and beetles: a kalimba, wood and thumb */
    kalimba(f, t, d, v, pan) { f *= wob(); const e = ctx.createGain(); const o = osc('sine', f, t, t + 0.6); o.connect(e); const o2 = osc('sine', f * 4.9, t, t + 0.12); const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.18, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08); o2.connect(g2); g2.connect(e);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(v, t + 0.006); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); out(e, pan); },
    /* spiders, snails and worms: a string */
    harp(f, t, d, v, pan) { const s2 = ctx.createBufferSource(); s2.buffer = string(f * wob(), 1.6, 0.9968); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const g = ctx.createGain(); g.gain.value = v * 1.5; s2.connect(lp); lp.connect(g); out(g, pan); s2.start(t); },
    /* mammals: a soft boop that bends down */
    boop(f, t, d, v, pan) { f *= wob(); const end = t + d + 0.2; const o = osc('sine', f * 1.12, t, end); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + d + 0.1); const e = ctx.createGain(); o.connect(e); env(e, t, 0.03, v, d * 0.4, d * 0.6 + 0.15); out(e, pan); },
    /* owls: a hollow note that falls a little */
    hoot(f, t, d, v, pan) { const end = t + 0.1 + d + 0.3; const o = osc('sine', f * 1.02, t, end); o.frequency.exponentialRampToValueAtTime(f * 0.94, end); const e = ctx.createGain(); o.connect(e); env(e, t, 0.1, v, d * 0.6, 0.3); out(e, pan); },
    /* flying-foxes, bats, water and plants: glass */
    chime(f, t, d, v, pan) { f *= wob(); const e = ctx.createGain(); for (const [m, gg, dec] of [[1, 1, 1.6], [2.76, 0.32, 0.8], [5.4, 0.12, 0.4]]) { const o = osc('sine', f * m, t, t + dec); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * gg, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); o.connect(g); g.connect(e); } out(e, pan, 1.3); },
    /* reptiles: a small low bonk */
    bonk(f, t, d, v, pan) { const o = osc('sine', f * 1.5, t, t + 0.35); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); const e = ctx.createGain(); o.connect(e); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(v, t + 0.005); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); out(e, pan); },
  };
  const INST_W = { whistle: 'WHISTLE', box: 'MUSIC BOX', kalimba: 'KALIMBA', harp: 'STRING', boop: 'BOOP', hoot: 'HOLLOW WHISTLE', chime: 'GLASS', bonk: 'WOOD' };
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
    cup: (f, t, v, pan) => { for (const [m, gg] of [[2150, 1], [3420, 0.5]]) { const o = osc('sine', m * wob(), t, t + 0.3); const e = ctx.createGain(); o.connect(e); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(v * 0.18 * gg, t + 0.002); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.26); out(e, pan, 0.8); } },
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
  /* ───────── the radar is the instrument: a cell sounds when the sweep reaches it, in the mood's texture. Not chimes ─────────
     FOG: a breath of a voice, a vowel that bends down into the hall. RAIN: a crushed glitch that stutters. WEIGHT: a thud that
     sinks. New is brighter; danger bends further, or stutters longer, or doubles a semitone off */
  const VOW = [[730, 1090], [570, 840], [300, 870], [440, 1020], [270, 2290], [660, 1700]];
  function breath(f, t, v, pan, bright, danger, vi) {
    const L = 0.45 + Math.random() * 0.6; const o = osc('sawtooth', f, t, t + L + 0.1); o.frequency.exponentialRampToValueAtTime(f * (danger ? 0.84 : 0.96), t + L);
    const [f1, f2] = VOW[vi % VOW.length]; const e = ctx.createGain();
    for (const [ff, g] of [[f1, 1], [f2, 0.45]]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = 7; const gg = ctx.createGain(); gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(e); }
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 3400 : 1300; e.connect(lp);
    const a = ctx.createGain(); lp.connect(a); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 2.2), t + 0.05); a.gain.exponentialRampToValueAtTime(0.0001, t + L); out(a, pan, 2.4);
  }
  let crushCurve = null;
  const crusher = () => { if (!crushCurve) { crushCurve = new Float32Array(1024); for (let i = 0; i < 1024; i++) crushCurve[i] = Math.round((i / 512 - 1) * 4) / 4; } const w = ctx.createWaveShaper(); w.curve = crushCurve; return w; };
  function glitch(f, t, v, pan, bright, danger) {
    const n = 2 + Math.floor(Math.random() * 3) + (danger ? 3 : 0); let tt = t;
    for (let i = 0; i < n; i++) {
      const L = 0.02 + Math.random() * 0.05; const o = osc(i % 2 ? 'square' : 'sawtooth', f * (i % 3 === 2 ? 2 : 1) * (1 + (Math.random() - 0.5) * 0.03), tt, tt + L + 0.02);
      const w = crusher(); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = (bright ? 2800 : 1500) * (0.6 + Math.random() * 0.8); bp.Q.value = 3;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * Math.pow(0.72, i)), tt + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, tt + L);
      o.connect(w); w.connect(bp); bp.connect(g); out(g, clamp(pan + (Math.random() - 0.5) * 0.5, -1, 1), 1.1); tt += L + Math.random() * 0.07;
    }
    burst(t, 0.012, 'highpass', 5200, 0.8, v * 0.5, -pan, 0.4);
  }
  function thud(f, t, v, pan, bright, danger) {
    for (const m of danger ? [1, 1.06] : [1]) { const o = osc('sine', f * 2 * m, t, t + 1.3); o.frequency.exponentialRampToValueAtTime(f / 2 * m, t + 0.4); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 900 : 380; const e = ctx.createGain(); o.connect(lp); lp.connect(e); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 2.4), t + 0.012); e.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); out(e, pan, 1.7); }
    burst(t, 0.2, 'lowpass', 260, 1, v * 0.9, pan, 1.3);
  }
  /* ───────── the ladder: a Moog filter, its cutoff and resonance as params (a biquad stands in until it has loaded) ───────── */
  function ladder(cut, res = 0.3, drive = 1) {
    if (hasLadder) { try { const n = new AudioWorkletNode(ctx, 'ladder', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }); const c = n.parameters.get('cutoff'), r = n.parameters.get('resonance'), d = n.parameters.get('drive'); c.value = cut; r.value = res; d.value = drive; return { node: n, cut: c, res: r, drive: d }; } catch (e) { /* the biquad */ } }
    const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = cut; b.Q.value = 0.7 + res * 14; return { node: b, cut: b.frequency, res: b.Q, drive: null };
  }
  let blowCurve = null;
  const blower = () => { if (!blowCurve) { blowCurve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; blowCurve[i] = Math.tanh(x * 9) * 0.9 + Math.sin(x * 23) * 0.06; } } const w = ctx.createWaveShaper(); w.curve = blowCurve; w.oversample = '2x'; return w; };
  /* dust on a record: sparse clicks, high and dry */
  function crackle(t, dur, v, pan) {
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); const r = seeded('dust' + dur);
    for (let i = 0; i < n; i++) if (r() < 0.0016) { const a = (r() * 2 - 1); for (let k = 0; k < 6 && i + k < n; k++) d[i + k] = a * Math.pow(0.5, k); }
    const s0 = ctx.createBufferSource(); s0.buffer = b; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400; const g = ctx.createGain(); g.gain.value = v;
    s0.connect(hp); hp.connect(g); out(g, pan, 0.3); s0.start(t);
  }
  /* JELLY: a glass bell that opens and closes as a bell does in the water, slow, into the hall */
  function jellyV(f, t, v, pan, bright) {
    const L = 2.8; const e = ctx.createGain();
    for (const [m, g] of [[1, 1], [2.003, 0.35], [3.01, 0.12]]) { const o = osc('sine', f * m * wob(), t, t + L); const gg = ctx.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(e); }
    const lf = ladder(f * 0.9, 0.55, 1.2); e.connect(lf.node); lf.cut.setValueAtTime(f * 0.9, t); lf.cut.exponentialRampToValueAtTime(f * (bright ? 7 : 5), t + 0.55); lf.cut.exponentialRampToValueAtTime(f * 1.1, t + L);
    const a = ctx.createGain(); lf.node.connect(a); env(a, t, 0.4, v * 2.2, 0.3, L - 0.8); out(a, pan, 2.8);
  }
  /* BURIAL: dust, a voice cut into two syllables a fourth apart and pitched down, and a sub that swells under them */
  function burialV(f, t, v, pan, bright, danger, vi) {
    crackle(t, 0.9, v * 0.9, -pan);
    const chop = (ff, tt, L, vv, k) => { const o = osc('sawtooth', ff, tt, tt + L + 0.05); o.frequency.exponentialRampToValueAtTime(ff * (danger ? 0.8 : 0.94), tt + L); const [f1, f2] = VOW[k % VOW.length]; const e = ctx.createGain();
      for (const [fq, g] of [[f1 * 0.8, 1], [f2 * 0.8, 0.4]]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 6; const gg = ctx.createGain(); gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(e); }
      const a = ctx.createGain(); e.connect(a); a.gain.setValueAtTime(0.0001, tt); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, vv), tt + 0.012); a.gain.setValueAtTime(vv, tt + L * 0.7); a.gain.exponentialRampToValueAtTime(0.0001, tt + L); out(a, pan, 2.2); };
    chop(f * 0.5, t, 0.17, v * 2.4, vi || 0); chop(f * 0.375, t + 0.24, 0.26, v * 1.8, (vi || 0) + 1);
    const sb = osc('sine', f / 4, t, t + 1.6); const sg = ctx.createGain(); sb.connect(sg); env(sg, t, 0.5, v * 2, 0.2, 0.9); out(sg, 0, 0.4);
  }
  /* HAUNT: a wavering electric voice that rises into its note, doubled a hair apart, and stops as if cut from tape */
  function hauntV(f, t, v, pan) {
    const L = 0.95; const lf = ladder(f * 3, 0.35, 1); const a = ctx.createGain();
    for (const dt of [-7, 7]) { const o = osc('triangle', semi(f, -1), t, t + L + 0.1); o.frequency.exponentialRampToValueAtTime(f, t + 0.28); o.detune.value = dt; vib(o, t, t + L, 5.4, f * 0.012, 0.2); o.connect(lf.node); }
    lf.node.connect(a); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 2.2), t + L); a.gain.linearRampToValueAtTime(0.0001, t + L + 0.05); out(a, pan, 2.4);
  }
  /* VOODOO: a low string through a ladder that squelches shut, the swamp under it */
  function voodooV(f, t, v, pan, bright, danger) {
    const o = osc('sawtooth', f / 2, t, t + 0.7); const lf = ladder(f * 8, danger ? 1.02 : 0.9, 1.6); o.connect(lf.node);
    lf.cut.setValueAtTime(f * (bright ? 12 : 8), t); lf.cut.exponentialRampToValueAtTime(f * 0.7, t + 0.36);
    const a = ctx.createGain(); lf.node.connect(a); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 2.6), t + 0.006); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.62); out(a, pan, 1.5);
  }
  /* CHEEKY: three bubbles rising, each a small sine that swoops up, left and right */
  function cheekV(f, t, v, pan) {
    for (let i = 0; i < 3; i++) { const tt = t + i * 0.075; const o = osc('sine', f * (1.6 + i * 0.3), tt, tt + 0.09); o.frequency.exponentialRampToValueAtTime(f * (2.6 + i * 0.5), tt + 0.06); const e = ctx.createGain(); o.connect(e);
      e.gain.setValueAtTime(0.0001, tt); e.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 1.3), tt + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, tt + 0.08); out(e, clamp(pan + (i % 2 ? 0.4 : -0.4), -1, 1), 0.7); }
  }
  /* BLOWN: a deep tone driven through the ladder until it breaks up, then clipped again; low and ugly on purpose */
  function blownV(f, t, v, pan, bright, danger) {
    const L = 1.3; const e = ctx.createGain(); for (const [ty, m] of [['sine', 0.25], ['sawtooth', 0.5]]) { const o = osc(ty, f * m, t, t + L); o.frequency.exponentialRampToValueAtTime(f * m * (danger ? 0.86 : 0.97), t + L); o.connect(e); }
    const lf = ladder(f * 1.4, 0.62, 6); e.connect(lf.node); const w = blower(); lf.node.connect(w); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 1800 : 900; w.connect(lp);
    const a = ctx.createGain(); lp.connect(a); env(a, t, 0.03, v * 1.6, 0.4, L - 0.5); out(a, pan, 1.2);
  }
  /* COLLECTIVE: a small choir in a canyon. Three voices on an open chord, each vowel opening as it sings, every note thrown back
     left and right twice, softer each time; round and bright, no drums */
  /* DUB: a deep round note from below, and a short muted chord thrown into a tape echo that repeats and darkens, a dotted
     eighth at 120 apart. Every note is a cell the hand found; nothing plays under them. The voice a cell has decides which:
     the note and the chord, the chord alone, or the note alone */
  let dubIn = null;
  function dubEcho() {
    if (dubIn) return dubIn;
    dubIn = ctx.createGain(); const d = ctx.createDelay(2); d.delayTime.value = 0.375; const fb = ctx.createGain(); fb.gain.value = 0.5;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 220; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
    dubIn.connect(d); d.connect(hp); hp.connect(lp); lp.connect(fb); fb.connect(d);
    const o = ctx.createGain(); o.gain.value = 0.8; lp.connect(o); out(o, 0, 0.5);
    return dubIn;
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
      for (const n of k === 0 ? [0, 3, 7] : [0, 5, 10]) for (const dt of [-7, 7]) { const so = osc('sawtooth', semi(c, n), t, t + 0.22); so.detune.value = dt; so.connect(bp); }
      env(e, t, 0.004, v * (danger ? 0.9 : 0.6), 0.05, 0.1); out(e, pan, 0.3); e.connect(dubEcho());
    }
  }
  function collectiveV(f, t, v, pan, bright, danger, vi) {
    const chord = [0, 7, (vi || 0) % 2 ? 16 : 15]; const L = 0.62;
    for (let echo = 0; echo < 3; echo++) {
      const te = t + echo * 0.21, ve = v * Math.pow(0.48, echo), pe = echo ? (echo % 2 ? -0.75 : 0.75) : pan;
      chord.forEach((st, i) => {
        const ff = semi(f, st) * wob(), t0 = te + i * 0.035; const o = osc('sawtooth', ff, t0, t0 + L + 0.1); vib(o, t0, t0 + L, 4.8 + i * 0.5, ff * 0.009, 0.12);
        const [f1, f2] = VOW[((vi || 0) + i + echo) % VOW.length]; const e = ctx.createGain();
        for (const [fq, g] of [[f1, 1], [f2, 0.5]]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(fq * 0.62, t0); bp.frequency.linearRampToValueAtTime(fq * (bright ? 1.15 : 1), t0 + L * 0.6); bp.Q.value = 6.5; const gg = ctx.createGain(); gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(e); }
        const a = ctx.createGain(); e.connect(a); env(a, t0, 0.07, Math.max(0.0002, ve * (danger ? 1.6 : 1.35)), L * 0.32, L * 0.55); out(a, clamp(pe + (i - 1) * 0.32, -1, 1), 2.2);
      });
    }
  }
  /* what a knot sounds like, as a word and notes: for its sound, and for the little score on its card */
  function describe(spec = {}) {
    if (spec.fam) { const F = FAMILIES[spec.fam] || FAMILIES.people || { sound: 'breath' }; const sd = F.sound || 'breath'; return { people: sd, w: SOUND_W[sd] || '', notes: [[0, 0.5]], len: sd === 'pencil' ? 0.45 : sd === 'taps' ? 0.4 : sd === 'cup' ? 0.4 : 0.75 }; }
    const [inst, notes] = MOTIF[spec.g] || MOTIF.paw; return { inst, w: INST_W[inst], notes, len: notes.reduce((a, x) => a + x[1], 0) + 0.3 };
  }
  function knotAt(spec, f, t0, v, pan) {
    const d = describe(spec);
    if (d.people) { (SOUNDS[d.people] || SOUNDS.breath)(f, t0, GAIN.people * v, pan); return d.len; }
    let t = t0; for (const [s2, dur] of d.notes) { INST[d.inst](semi(f, s2), t, dur, (GAIN[d.inst] || 0.06) * v, pan); t += dur; }
    return d.len;
  }
  return {
    describe,
    /* woken inside a touch itself, as phones require: true once sound can play */
    wake() { const c = ready(); if (!c) return false; try { const b = c.createBuffer(1, 1, 22050); const s0 = c.createBufferSource(); s0.buffer = b; s0.connect(c.destination); s0.start(0); } catch (e) { /* silent */ } return true; },
    /* a dry click for a press */
    tick(f = 1700) {
      buzz(3); if (!ready()) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.035);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.06);
    },
    /* a knot's own sound: an animal's instrument, or a voice for the people; f is the string's own note */
    knot(spec, f = 330, at = 0, v = 1, pan = 0) { if (!ready()) return describe(spec).len; return knotAt(spec, f, ctx.currentTime + at, v, pan); },
    /* a string tied: shorter strings ring higher */
    pluck(len = 0.5, pan = 0, gain = 0.15) { buzz(8); if (!ready()) return; play(string(150 + (1 - clamp(len, 0, 1)) * 470, 2, 0.997), gain, 0, pan, 3600); },
    /* a string cut: muted, low */
    snap(pan = 0) { buzz([4, 24, 4]); if (!ready()) return; play(string(98, 0.35, 0.95), 0.18, 0, pan, 1600); },
    /* every string at once, slowly, high to low */
    strum(lens = [], dir = 1) { buzz(6); if (!ready()) return; const L = lens.length ? lens : [0.5]; L.forEach((l, i) => play(string(150 + (1 - clamp(l, 0, 1)) * 470, 2, 0.997), 0.09, i * 0.09, dir * (i / Math.max(1, L.length - 1) - 0.5), 3600)); },
    /* a song: each string plucked in the order it was tied, and each knot answering in its own voice */
    song(seq = []) { buzz(6); if (!ready() || !seq.length) return; const t0 = ctx.currentTime + 0.06; for (const n of seq.slice(0, 180)) { if (n.spec) knotAt(n.spec, n.f, t0 + n.t, n.v || 0.8, n.pan || 0); else play(string(n.f, n.dur || 2, n.dc || 0.997), n.g || 0.09, t0 - ctx.currentTime + n.t, n.pan || 0, n.cut || 3600); } },
    /* a constellation born: four glass notes, rising */
    born() { buzz([6, 30, 6]); if (!ready()) return; const t = ctx.currentTime; [0, 7, 12, 19].forEach((s2, i) => INST.chime(semi(523, s2), t + i * 0.14, 0.2, 0.025, (i - 1.5) * 0.3)); },
    /* a cell reached by the sweep. spec: { g } a life, { fam } a place (its own small real sound). opt: v, pan, mood, bright
       (new), danger, vi (which voice) */
    ping(spec, f, opt = {}) {
      if (!ready()) return false; const now = performance.now(); if (now - lastBlip < 55) return false; lastBlip = now;
      const t0 = ctx.currentTime + 0.01; const t = prefs.nino ? Math.ceil(t0 / 0.125) * 0.125 : t0; const v = opt.v == null ? 0.05 : opt.v; const pan = opt.pan || 0; const md = opt.mood || 'fog';
      const V = { rain: glitch, jelly: jellyV, burial: burialV, haunt: hauntV, voodoo: voodooV, cheek: cheekV, collective: collectiveV, dub: dubV, blown: blownV }[md];
      if (spec.fam && !V && md !== 'weight') knotAt(spec, f, t, v * 5, pan); else if (md === 'weight') thud(f / 2, t, v, pan, opt.bright, opt.danger); else if (V) V(f, t, v, pan, opt.bright, opt.danger, opt.vi || 0); else breath(f, t, v, pan, opt.bright, opt.danger, opt.vi || 0);
      return true;
    },
    /* a thermal head stepping: filtered noise in short strokes */
    printer(ms = 1200) {
      buzz([18, 36, 18, 36, 18, 36, 40]); if (!ready()) return;
      const t = ctx.currentTime, d = ms / 1000; const s = ctx.createBufferSource(); s.buffer = noise(d);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 1.4;
      const g = ctx.createGain(); g.gain.value = 0; const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 38; const lg = ctx.createGain(); lg.gain.value = 0.04;
      lfo.connect(lg); lg.connect(g.gain); s.connect(bp); bp.connect(g); g.connect(bus); s.start(t); lfo.start(t); s.stop(t + d); lfo.stop(t + d);
    },
    /* a fog horn, far off over the water: for a poster put up. Two low reeds a little apart, the ladder opening and closing */
    horn() {
      buzz([40, 60, 120]); if (!ready()) return; const t = ctx.currentTime + 0.02;
      const blast = (t0, L, v) => { const lf = ladder(160, 0.4, 2.2); const e = ctx.createGain();
        for (const [ty, f, g] of [['sawtooth', 73.4, 0.5], ['sawtooth', 77.6, 0.4], ['square', 36.7, 0.35]]) { const o = osc(ty, f, t0, t0 + L + 1.4); o.frequency.setValueAtTime(f * 0.96, t0); o.frequency.exponentialRampToValueAtTime(f, t0 + 0.4); const gg = ctx.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(e); }
        e.connect(lf.node); lf.cut.setValueAtTime(160, t0); lf.cut.exponentialRampToValueAtTime(620, t0 + 0.6); lf.cut.setValueAtTime(620, t0 + L); lf.cut.exponentialRampToValueAtTime(140, t0 + L + 1.2);
        const a = ctx.createGain(); lf.node.connect(a); a.gain.setValueAtTime(0.0001, t0); a.gain.exponentialRampToValueAtTime(v, t0 + 0.45); a.gain.setValueAtTime(v, t0 + L); a.gain.exponentialRampToValueAtTime(0.0001, t0 + L + 1.3); out(a, 0, 2.2); };
      blast(t, 1.8, 0.16); blast(t + 3.1, 0.7, 0.11);
    },
    /* the muse: a bell of glass that opens and closes */
    jelly(pan = 0) { if (!ready()) return; jellyV(523.25, ctx.currentTime + 0.02, 0.05, pan, true); },
    /* a container ship's horn in fog, as deep as a speaker will carry: low reeds through the ladder, driven, a sub under it */
    ship() {
      buzz([60, 80, 200]); if (!ready()) return; const t = ctx.currentTime + 0.03, L = 2.6;
      const lf = ladder(90, 0.5, 3.6); const e = ctx.createGain();
      for (const [ty, f, g] of [['sawtooth', 46.25, 0.55], ['sawtooth', 46.9, 0.45], ['sawtooth', 92.5, 0.25], ['square', 23.1, 0.3]]) { const o = osc(ty, f * 0.97, t, t + L + 2.6); o.frequency.exponentialRampToValueAtTime(f, t + 0.7); const gg = ctx.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(e); }
      e.connect(lf.node); lf.cut.setValueAtTime(90, t); lf.cut.exponentialRampToValueAtTime(520, t + 0.9); lf.cut.setValueAtTime(520, t + L); lf.cut.exponentialRampToValueAtTime(70, t + L + 2.2);
      const a = ctx.createGain(); lf.node.connect(a); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(0.24, t + 0.7); a.gain.setValueAtTime(0.24, t + L); a.gain.exponentialRampToValueAtTime(0.0001, t + L + 2.4); out(a, 0, 2.6);
      const sb = osc('sine', 46.25, t, t + L + 2.4); const sg = ctx.createGain(); sb.connect(sg); env(sg, t, 0.8, 0.22, L - 0.6, 2); out(sg, 0, 0.3);
    },
    /* the same, small and kind: a tug's two notes, for the radar set down */
    toot() {
      buzz([20, 40, 20]); if (!ready()) return; const t = ctx.currentTime + 0.02;
      const note = (t0, f, L) => { const lf = ladder(240, 0.45, 1.8); const e = ctx.createGain(); for (const [ty, m, g] of [['sawtooth', 1, 0.5], ['sawtooth', 1.007, 0.4], ['triangle', 0.5, 0.35]]) { const o = osc(ty, f * m, t0, t0 + L + 0.6); const gg = ctx.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(e); }
        e.connect(lf.node); lf.cut.setValueAtTime(240, t0); lf.cut.exponentialRampToValueAtTime(900, t0 + 0.12); lf.cut.exponentialRampToValueAtTime(200, t0 + L + 0.4);
        const a = ctx.createGain(); lf.node.connect(a); a.gain.setValueAtTime(0.0001, t0); a.gain.exponentialRampToValueAtTime(0.09, t0 + 0.06); a.gain.setValueAtTime(0.09, t0 + L); a.gain.exponentialRampToValueAtTime(0.0001, t0 + L + 0.5); out(a, 0, 1.8); };
      note(t, 110, 0.32); note(t + 0.42, 98, 0.55);
    },
    /* a step met: a few notes of glass over a soft low swell, more of them the further along; never the same twice in a row */
    reward(n = 1) {
      buzz([10, 30, 10, 30, 40]); if (!ready()) return; const t = ctx.currentTime + 0.03; const base = [392, 440, 494, 523.25, 587.33][(n - 1) % 5];
      [0, 7, 12, 16, 19].slice(0, 2 + Math.min(3, n)).forEach((st, i) => INST.chime(semi(base, st), t + i * 0.11, 0.3, 0.03, (i - 1.5) * 0.25));
      jellyV(base / 2, t, 0.03, 0, true); const sb = osc('sine', base / 8, t, t + 2.2); const sg = ctx.createGain(); sb.connect(sg); env(sg, t, 0.4, 0.08, 0.4, 1.2); out(sg, 0, 0.6);
    },
    /* a gate passed on a first visit: one more note of a rising figure in A minor, the dub stab into its echo; the last
       gate, the whole chord at once and the muse's bell over it */
    gate(n = 1) {
      buzz(n >= 4 ? [12, 40, 12, 40, 60] : [8, 30, 8]); if (!ready()) return; const t = ctx.currentTime + 0.04; const F = [110, 130.81, 164.81, 196, 220];
      if (n >= 4) { F.forEach((f, i) => dubV(f, t + i * 0.04, 0.06, (i - 2) * 0.3, true, false, i ? 1 : 0)); jellyV(440, t + 0.12, 0.04, 0, true); return; }
      for (let i = 0; i < n; i++) dubV(F[i], t + i * 0.25, 0.06, (i - (n - 1) / 2) * 0.3, true, false, i === n - 1 ? 0 : 2);
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
