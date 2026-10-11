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
const VIEWS = [
  { k: 'now', icon: 'now', label: 'Now', w: 'NOW' },
  { k: 'stories', icon: 'stories', label: 'Stories', w: 'STORIES' },
];
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
const loadImage = (src, cors) => new Promise((res, rej) => { const im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => rej(new Error('image')); im.src = src; });
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
const seeTrack = id => { if (id === 'life' && CFG.lifeLock) return true; const v = (prefs.trk || {})[id]; return v == null ? (id in TRK_SEE ? TRK_SEE[id] : true) : !!v; };
/* the print location: the first partner place with a W.I.S.H. printer */
const printAt = () => { const d = (window.DA_PARTNERS || []).find(x => x.printer); const p = d && PLACES.find(x => x.partner === d.id); return p ? { lat: +p.lat, lng: +p.lng } : null; };
const prefs = Object.assign({ sound: true, motion: true, areas: false, printers: true, scan: null }, store.get('da.prefs', {}));
const savePrefs = () => store.set('da.prefs', prefs);
/* night: as the device is set, until chosen in Settings. The page darkens and the ground dims; a slip stays paper */
const darkNow = () => (prefs.night != null ? !!prefs.night : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches));
const applyNight = () => document.documentElement.classList.toggle('night', darkNow());
applyNight(); try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (prefs.night == null) applyNight(); }); } catch (e) { /* no media queries */ }
const me = Object.assign({ by: '', dev: '' }, store.get('da.me', {}));
if (!me.dev) { me.dev = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; store.set('da.me', me); }
const S = {
  obs: [], byId: new Map(), user: [], community: [], hist: [],
  view: 0, open: false, sel: null, mode: null, place: null, mo: 0, tribeSel: null, sig: null,
  wx: store.get('da.wx.v3', { t: 0, tmax: null, tmin: null, rain: null, days: [] }),
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
  let ctx = null, bus = null, wet = null, hall = null, lastBlip = 0, droneG = null;
  const active = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
  function ready() {
    if (!prefs.sound || !active()) return null;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)(); bus = ctx.createGain(); bus.gain.value = 0.42;
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; bus.connect(comp); comp.connect(ctx.destination);
        /* a small, soft room: two short delays fed back through a low-pass */
        wet = ctx.createGain(); wet.gain.value = 0.14; const d1 = ctx.createDelay(1), d2 = ctx.createDelay(1); d1.delayTime.value = 0.113; d2.delayTime.value = 0.171;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const fb = ctx.createGain(); fb.gain.value = 0.42;
        wet.connect(d1); wet.connect(d2); d1.connect(lp); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(bus);
        /* and a long, dark hall behind it: every sound that goes into the room also drifts into it */
        hall = ctx.createConvolver(); hall.buffer = hallBuffer(3.8); const hg = ctx.createGain(); hg.gain.value = 0.6; wet.connect(hall); hall.connect(hg); hg.connect(bus);
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
  /* ───────── the stations: no music, no grid; resonances from the ground, at chance moments, on one harmonic series ───────── */
  /* a short burst of filtered noise: drops, breath, grit */
  function burst(t, dur, type, f, q, v, pan, room) { const s0 = ctx.createBufferSource(); s0.buffer = noise(dur + 0.02); const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s0.connect(fl); fl.connect(g); out(g, pan, room); s0.start(t); s0.stop(t + dur + 0.03); }
  /* FOG: a bowed resonance. A partial and its octave a hair apart, so they beat slowly; breath through a narrow band at the pitch */
  function bow(f, t, dur, v, pan) {
    const end = t + dur + 2.4; const e = ctx.createGain();
    for (const [m, g, dt] of [[1, 1, 0], [2.003, 0.32, 3], [3.01, 0.12, -4]]) { const o = osc('sine', f * m, t, end); o.detune.value = dt; vib(o, t, end, 0.2 + Math.random() * 0.3, f * 0.002, 0.8); const gg = ctx.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(e); }
    const nb = ctx.createBufferSource(); nb.buffer = noise(Math.min(6, dur + 2.4)); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 18; const ng = ctx.createGain(); ng.gain.value = 0.35; nb.connect(bp); bp.connect(ng); ng.connect(e); nb.start(t); nb.stop(end);
    const a = ctx.createGain(); e.connect(a); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + Math.min(2.2, dur * 0.45)); a.gain.setValueAtTime(Math.max(0.0002, v), t + dur); a.gain.exponentialRampToValueAtTime(0.0001, end);
    out(a, pan, 1.7);
  }
  /* RAIN: a glint. A short ping whose overtone is not quite in tune with it, and a drop of noise under it */
  function glint(f, t, v, pan) {
    const L = 0.08 + Math.random() * 0.4; const o = osc('sine', f, t, t + L + 0.05); const m = osc('sine', f * 1.414, t, t + L + 0.05); const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 0.9, t); mg.gain.exponentialRampToValueAtTime(1, t + L); m.connect(mg); mg.connect(o.frequency);
    const e = ctx.createGain(); o.connect(e); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + 0.003); e.gain.exponentialRampToValueAtTime(0.0001, t + L); out(e, pan, 1.3);
    if (Math.random() < 0.5) burst(t + Math.random() * 0.05, 0.02 + Math.random() * 0.04, 'highpass', 3000 + Math.random() * 4000, 0.8, v * 0.5, -pan, 0.6);
  }
  /* WEIGHT: a low swell, a sine under the series with a rumble of noise closed in a low filter */
  function swell(f, t, dur, v, pan) {
    const end = t + dur + 3; const o = osc('sine', f, t, end); vib(o, t, end, 0.08, f * 0.01, 0); const e = ctx.createGain(); o.connect(e);
    const nb = ctx.createBufferSource(); nb.buffer = noise(Math.min(7, dur + 3)); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 4; const ng = ctx.createGain(); ng.gain.value = 0.6; nb.connect(lp); lp.connect(ng); ng.connect(e); nb.start(t); nb.stop(end);
    const a = ctx.createGain(); e.connect(a); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + dur * 0.6); a.gain.exponentialRampToValueAtTime(0.0001, end); out(a, pan, 0.9);
  }
  function bell(f, t, v, pan) { const e = ctx.createGain(); for (const [m, gg, dec] of [[1, 1, 3.2], [2.76, 0.2, 1.4], [5.4, 0.06, 0.6]]) { const o = osc('sine', f * m * wob(), t, t + dec); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * gg), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); o.connect(g); g.connect(e); } out(e, pan, 1.6); }
  /* the drone under the radar: two low reeds and a sine, closed in a slow filter, swelling as the sweep's trail crosses life */
  function droneOn() {
    if (droneG) return; droneG = ctx.createGain(); droneG.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 2;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045; const lg = ctx.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    for (const [f, ty, g] of [[73.42, 'sawtooth', 0.35], [110.0, 'sawtooth', 0.22], [55.0, 'sine', 0.6]]) { const o = ctx.createOscillator(); o.type = ty; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 9; const gg = ctx.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(lp); o.start(); }
    lp.connect(droneG); out(droneG, 0, 1.2);
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
    /* a cell found by the sweep: a soft bell, low near the centre and higher towards the rim, in a dark mode; a plant rings
       an octave up, glass; an animal in danger rings with its neighbour a semitone off, strange, so it is heard */
    blip(k = 0.5, d = 0.5, soft = false) {
      if (!ready()) return; const now = performance.now(); if (now - lastBlip < 110) return; lastBlip = now;
      const H = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16]; const i = Math.min(H.length - 1, Math.floor(clamp(d, 0, 0.999) * H.length));
      const f = 55 * H[i] * (k <= 0.15 ? 2 : 1); const t = ctx.currentTime + 0.01; const pan = (Math.random() - 0.5) * 0.8;
      const v = soft ? 0.009 : 0.022; bell(f, t, v, pan); if (k >= 0.85) bell(f * Math.pow(2, 1 / 12), t + 0.04, v * 0.55, -pan);
    },
    /* the drone: 0 to 1, how much life the sweep's trail is crossing now */
    drone(level) { if (!ready()) return; droneOn(); droneG.gain.setTargetAtTime(0.004 + clamp(level, 0, 1) * 0.03, ctx.currentTime, 0.9); },
    droneOff() { if (droneG && ctx) droneG.gain.setTargetAtTime(0, ctx.currentTime, 0.4); },
    /* a cell on a station sounds, once: a life as the mood's texture (FOG bowed, RAIN a glint, WEIGHT a low swell) at its
       place in the series; a place in its own small real sound; a cell people added as a bell. opt: dur, v, pan, mood */
    cell(spec, f, at = 0, opt = {}) {
      if (!ready()) return; const t = ctx.currentTime + Math.max(0, at); const v = opt.v == null ? 0.05 : opt.v; const pan = opt.pan || 0; const md = opt.mood || 'fog';
      if (opt.bell) { bell(f, t, v * 0.5, pan); return; }
      if (spec.fam) { knotAt(spec, f, t, v * 4, pan); return; }
      if (md === 'rain') glint(f * 2, t, v * 0.7, pan); else if (md === 'weight') swell(f / 2, t, opt.dur || 4, v * 1.4, pan); else bow(f, t, opt.dur || 4, v * 0.8, pan);
    },
    /* a connection sounding: the knots of a string figure, together, rolled slowly, each at its place in the series */
    tie(fs, at = 0, v = 0.03) { if (!ready()) return; const t = ctx.currentTime + at; fs.forEach((f, i) => bell(f, t + i * (0.18 + Math.random() * 0.2), v, (i / Math.max(1, fs.length - 1) - 0.5) * 1.2)); },
    /* a thermal head stepping: filtered noise in short strokes */
    printer(ms = 1200) {
      buzz([18, 36, 18, 36, 18, 36, 40]); if (!ready()) return;
      const t = ctx.currentTime, d = ms / 1000; const s = ctx.createBufferSource(); s.buffer = noise(d);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 1.4;
      const g = ctx.createGain(); g.gain.value = 0; const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 38; const lg = ctx.createGain(); lg.gain.value = 0.04;
      lfo.connect(lg); lg.connect(g.gain); s.connect(bp); bp.connect(g); g.connect(bus); s.start(t); lfo.start(t); s.stop(t + d); lfo.stop(t + d);
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
