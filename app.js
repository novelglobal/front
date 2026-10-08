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
const prefs = Object.assign({ sound: true, motion: true, areas: false, scan: null }, store.get('da.prefs', {}));
const savePrefs = () => store.set('da.prefs', prefs);
const me = Object.assign({ by: '', dev: '' }, store.get('da.me', {}));
if (!me.dev) { me.dev = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; store.set('da.me', me); }
const S = {
  obs: [], byId: new Map(), user: [], community: [], hist: [],
  view: 0, open: false, sel: null, mode: null, place: null, mo: 0, tribeSel: null, sig: null,
  wx: store.get('da.wx.v3', { t: 0, tmax: null, tmin: null, rain: null, days: [] }),
  lastVisit: store.get('da.lastVisit', 0), lastSignal: 0, stale: false, me,
  biz: null, bizLoading: null, radius: new Map(), orbit: { cell: new Map() }, arrivals: new Set(), mapReady: false, sensors: [], fountains: [],
  heroes: [], tribes: [], signals: [],
  /* the radar: where it is pinned and how far it reaches, kept between visits */
  scan: (() => { const c = CONFIG.SCAN || { lat: -37.769, lng: 144.963, r: 520, min: 250, max: 1500 }; const p = prefs.scan || {}; const ok = p.lat != null && inBox(p.lat, p.lng); return { lat: ok ? p.lat : c.lat, lng: ok ? p.lng : c.lng, r: clamp(+p.r || c.r, c.min || 250, c.max || 1500) }; })(),
};
const reduced = () => !prefs.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────── touch answers: a short buzz where phones allow it, and small sounds made here, not loaded ───────── */
const buzz = ms => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) { /* no haptics */ } };
const snd = (() => {
  let ctx = null, bus = null, wet = null, lastBlip = 0;
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
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
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
    KS.set(key, buf); return buf;
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
    /* a cell found by the sweep */
    blip(k = 0.5) {
      if (!ready()) return; const now = performance.now(); if (now - lastBlip < 110) return; lastBlip = now;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(900 + k * 900, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.016, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.18);
    },
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


/* ════════════════════════════════════════════════════════════════════
   DANGER — each life against the El Niño months ahead: the Bureau's outlook, how hard heat and drought are
   on its kind, whether the heat lands while it breeds, and how bare the ground is where it lives.
   ════════════════════════════════════════════════════════════════════ */
const kindOf = o => (o.hum ? 'Human' : (o.tx && o.tx.ic) || 'Unknown');
function bandOf(o) { if (o.b != null) return o.b; const ic = kindOf(o); const i = SCALES.findIndex(s => s.taxa.includes(ic)); return i < 0 ? 5 : i; }
const planted = o => !!o.cap && ['Plantae', 'Fungi'].includes(kindOf(o));
const keptAnimal = o => !!o.cap && !planted(o);
const rangeOf = o => (S.radius.get(o.id) || (o.hum ? 400 : keptAnimal(o) ? 400 : SCALES[bandOf(o)].range));
/* the field list (field.js): what each kind of life needs through the year; by species, else by genus when only one is listed */
const FIELD_IX = new Map(), GENUS_IX = new Map();
for (const e of FIELD) {
  const n = e.n.toLowerCase().trim(); FIELD_IX.set(n, e); const g = n.split(/\s+/)[0];
  if (!/\s/.test(n)) GENUS_IX.set(g, e);
  else if (!GENUS_IX.has(g)) GENUS_IX.set(g, e);
  else { const prev = GENUS_IX.get(g); if (prev && /\s/.test(prev.n)) GENUS_IX.set(g, null); }
}
const GROUP_REP = { serpentes: 'notechis scutatus', chiroptera: 'chalinolobus gouldii', microchiroptera: 'chalinolobus gouldii', anura: 'crinia signifera', scincidae: 'lampropholis guichenoti' };
const fieldOf = o => { const sub = o && subjectOf(o); const n = sub && sub.tx && sub.tx.n ? sub.tx.n.toLowerCase().trim() : ''; if (!n) return null; return FIELD_IX.get(n) || FIELD_IX.get(n.split(/\s+/).slice(0, 2).join(' ')) || GENUS_IX.get(n.split(/\s+/)[0]) || (GROUP_REP[n] ? FIELD_IX.get(GROUP_REP[n]) : null) || null; };
const ICONIC_GLYPH = { Aves: 'bird', Mammalia: 'mammal', Reptilia: 'lizard', Amphibia: 'frog', Actinopterygii: 'aquatic', Insecta: 'beetle', Arachnida: 'spider', Mollusca: 'snail', Plantae: 'plant', Fungi: 'fungi', Animalia: 'segmented', Chromista: 'plant', Protozoa: 'segmented', Unknown: 'plant' };
const NAME_GLYPH = [[/flying-?fox/i, 'flyingfox'], [/\bbat\b/i, 'bat'], [/possum|glider/i, 'possum'], [/\bbee\b|bees$/i, 'bee'], [/butterfl|\bskipper\b|\b(admiral|jezebel|swallowtail|brown)\b/i, 'butterfly'], [/\bmoth\b/i, 'moth'], [/wasp|hornet/i, 'wasp'], [/hoverfly|\bfly\b/i, 'fly'], [/dragonfly|damselfly/i, 'dragonfly'],
  [/orb-?weaver/i, 'orb'], [/spider/i, 'spider'], [/beetle|ladybird|weevil/i, 'beetle'], [/grasshopper|cricket|katydid/i, 'grasshopper'], [/mantis/i, 'mantis'], [/\bbug\b|aphid|cicada|psyllid|lerp/i, 'bug'], [/snail|slug/i, 'snail'], [/worm/i, 'segmented'],
  [/frog|toadlet|froglet/i, 'frog'], [/turtle|tortoise/i, 'turtle'], [/skink|gecko|lizard|dragon\b/i, 'lizard'], [/snake/i, 'snake'], [/\b(fish|eel|galaxias|carp|mosquitofish)\b/i, 'aquatic'],
  [/owl|frogmouth|boobook/i, 'owl'], [/hawk|kite|falcon|eagle|goshawk/i, 'raptor'], [/duck|swan|heron|egret|ibis|cormorant|grebe|moorhen|coot|gull|darter|swamphen|teal/i, 'waterbird'], [/lorikeet|rosella|cockatoo|corella|galah|parrot/i, 'parrot'], [/orang-?utan|gorilla|chimpanzee/i, 'ape']];
const glyphOf = o => { if (o && o.user && o.g) return o.g; if (o && o.sigPin && o.g) return o.g; const fe = fieldOf(o); if (fe) return fe.g; const sub = subjectOf(o); const cn = sub.tx && sub.tx.cn; if (cn && !o.hum) for (const [re, g] of NAME_GLYPH) if (re.test(cn)) return g; if (sub.tx && sub.tx.ic && ICONIC_GLYPH[sub.tx.ic]) return ICONIC_GLYPH[sub.tx.ic]; return o.hum ? 'human' : 'plant'; };
const lifeOf = o => { if ((o.user || o.sigPin) && o.g) return o.g; const sub = subjectOf(o); return o.hum && !(sub && sub.tx && sub.tx.n) ? 'human' : glyphOf(o); };
const COLD_DAYS = 21;
const isCold = o => !!o.hist || (typeof o.id === 'number' && !o.hum && o.age != null && o.age > COLD_DAYS);
const hourOf = o => (o.t ? new Date(o.t).getHours() : null);
const isNight = o => { const h = hourOf(o); return h != null && (h >= 20 || h < 5); };
function traitsOf(o) {
  const n = (o.tx && o.tx.n) || '';
  for (const [g, h, w, note] of TRAITS.special) if (n.startsWith(g)) return [h, w, note];
  const g = o.tx ? kindOf(o) : SCALES[bandOf(o)].taxa[0];
  const t = TRAITS.groups[g] || TRAITS.groups.Unknown; return [t[0], t[1], ''];
}
const OUT_N = OUT.lv.length;
const outMonth = k => { const [y, m] = OUT.start; const t = m + k; return { k, m: t % 12, y: y + Math.floor(t / 12), lv: OUT.lv[k] || 0, h: OUT.h[k] || 'p' }; };
const nowK = () => { const d = new Date(); const [y, m] = OUT.start; return clamp((d.getFullYear() - y) * 12 + d.getMonth() - m, 0, OUT_N - 1); };
const inWin = (w, m) => (w.a <= w.b ? m >= w.a && m <= w.b : m >= w.a || m <= w.b);
const monthsWord = (a, b) => (a === b ? MON[a] : `${MON[a]}–${MON[b]}`);
const canopyAt = (lat, lng, sb = suburbAt(lat, lng)) => Object.assign({ sb, pc: 15, yr: 2018, by: 'MELBOURNE' }, CANOPY[sb] || {});
const canopyOf = o => canopyAt(o.lat, o.lng, placeOf(o));
function degAt(o, k) {
  if (!o || o.hist) return 0;
  const Mo = outMonth(k);
  if (o.hum) return o.kind === 'need' ? Mo.lv : 0;
  const sub = subjectOf(o); if (keptAnimal(sub)) return 0;
  const fe = fieldOf(o); const [th, tw] = traitsOf(sub); const g = glyphOf(o);
  const heat = fe ? fe.heat || 0 : Math.min(3, th), water = fe ? fe.water || 0 : Math.min(3, tw);
  let lv = Mo.lv; if (fe && fe.act && fe.act[Mo.m] === '.') lv = Math.max(0, lv - 1);
  let d = lv * ((2 * heat + water) / 3) / 3;
  const born = !!(fe && fe.brd && fe.brd[Mo.m] === 'B');
  if (Mo.lv >= 2 && heat >= 2 && (born || OUT.windows.some(w => inWin(w, Mo.m) && w.g.includes(g)))) d += 0.6;
  if (Mo.lv >= 3 && heat >= 2 && canopyOf(o).pc < 15) d += 0.3;
  if (sub.tx && sub.tx.intro) d -= 1;
  return d >= 3.6 ? 4 : d >= 2.8 ? 3 : d >= 1.8 ? 2 : d >= 0.9 ? 1 : 0;
}
const degCache = new Map();
function degOf(o, k0 = S.mo, span = 3) {
  const key = `${o.id}|${k0}|${span}`; if (degCache.has(key)) return degCache.get(key);
  let best = 0; for (let k = k0; k < Math.min(OUT_N, k0 + span); k++) best = Math.max(best, degAt(o, k));
  degCache.set(key, best); if (degCache.size > 6000) degCache.clear(); return best;
}
function worstWhen(o, k0 = S.mo, span = 3) {
  let top = 0, a = -1, b = -1;
  for (let k = k0; k < Math.min(OUT_N, k0 + span); k++) { const d = degAt(o, k); if (d > top) { top = d; a = b = k; } else if (d === top && top > 0 && b === k - 1) b = k; }
  return top ? { deg: top, a, b, word: monthsWord(outMonth(a).m, outMonth(b).m) } : null;
}
/* the threat, in a line: what El Niño does to this kind of life */
const threatOf = o => THREAT[lifeOf(o)] || THREAT.paw || '';
/* when it lands: the first unseasonable window that names this kind, else its worst stretch in the next six months */
const monthStart = k => { const m = outMonth(k); return new Date(m.y, m.m, 1).getTime(); };
const monthEnd = k => { const m = outMonth(k); return new Date(m.y, m.m + 1, 0, 23, 59).getTime(); };
function windowRun(w, k0) { let a = -1; for (let k = k0; k < OUT_N; k++) if (inWin(w, outMonth(k).m)) { a = k; break; } if (a < 0) return null; let b = a; while (b + 1 < OUT_N && inWin(w, outMonth(b + 1).m)) b++; return { w, a, b }; }
function whenOf(o) {
  const g = lifeOf(o); const k0 = nowK();
  const runs = OUT.windows.filter(w => w.g.includes(g)).map(w => windowRun(w, k0)).filter(Boolean).sort((x, y) => x.a - y.a);
  if (runs.length) { const r = runs[0]; return { w: r.w.w, why: r.w.why, word: monthsWord(outMonth(r.a).m, outMonth(r.b).m), start: monthStart(r.a), end: monthEnd(r.b), now: r.a === k0 }; }
  const ww = worstWhen(o, k0, 6); if (!ww || ww.deg < 2) return null;
  return { w: 'PEAK', why: 'Its worst months in the outlook.', word: ww.word, start: monthStart(ww.a), end: monthEnd(ww.b), now: ww.a === k0 };
}
const daysTo = t => Math.max(0, Math.ceil((t - Date.now()) / 864e5));
/* the next month its young are due, from the field list */
function youngOf(o) { const fe = fieldOf(o); if (!fe || !fe.brd) return null; const m0 = new Date().getMonth(); for (let i = 0; i < 12; i++) { const m = (m0 + i) % 12; if (fe.brd[m] === 'B') return { m, now: i === 0 }; } return null; }
/* something to learn: the field list's line, else iNaturalist's (fetched on opening the card) */
const learnOf = o => { const fe = fieldOf(o); return fe ? fe.aware || fe.note || '' : ''; };
/* ───────── iNaturalist, further in: a taxon's summary and status, and the months it is seen here ───────── */
const TXI = store.get('da.tx.v1', {}), HGI = store.get('da.hg.v1', {});
const MONTH30 = 30 * 864e5;
async function taxonInfo(id) {
  if (!id) return null; if (TXI[id] && Date.now() - TXI[id].t < MONTH30) return TXI[id];
  try {
    const j = await (await fetch(`${CONFIG.INAT_API}/taxa/${id}?locale=en&preferred_place_id=${CONFIG.PLACE_PREF}`)).json(); const t = (j.results || [])[0]; if (!t) return null;
    const sum = String(t.wikipedia_summary || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    const first = (sum.match(/^.{20,}?[.!?](?=\s|$)/) || [sum])[0].trim();
    const cs = (t.conservation_statuses || []).find(c => c.place && /victoria/i.test(c.place.name || '')) || (t.conservation_statuses || []).find(c => c.place && /australia/i.test(c.place.name || '')) || t.conservation_status || null;
    const em = (t.establishment_means && t.establishment_means.establishment_means) || '';
    const v = { t: Date.now(), sum: first.length > 180 ? first.slice(0, 177) + '…' : first, obs: t.observations_count || 0, cs: cs ? String(cs.status_name || cs.status || '').toUpperCase() : '', em: em.toUpperCase(), wiki: t.wikipedia_url || '' };
    TXI[id] = v; store.set('da.tx.v1', TXI); return v;
  } catch (e) { return null; }
}
async function seasonOf(id) {
  if (!id) return null; if (HGI[id] && Date.now() - HGI[id].t < MONTH30) return HGI[id].m;
  try {
    const q = new URLSearchParams({ taxon_id: id, nelat: B.n + 0.1, nelng: B.e + 0.1, swlat: B.s - 0.1, swlng: B.w - 0.1, interval: 'month_of_year', date_field: 'observed', verifiable: 'true' });
    const j = await (await fetch(`${CONFIG.INAT_API}/observations/histogram?${q}`)).json(); const r = (j.results && j.results.month_of_year) || {};
    const m = Array.from({ length: 12 }, (_, i) => +r[i + 1] || 0); HGI[id] = { t: Date.now(), m }; store.set('da.hg.v1', HGI); return m;
  } catch (e) { return null; }
}
/* ───────── what a life needs within its radius, and what threatens it there (DA_NEEDS in config.js) ───────── */
const POLLINATORS = new Set(['bee', 'butterfly', 'moth', 'fly', 'wasp', 'parrot', 'flyingfox']);
const INSECTS = new Set(['bee', 'butterfly', 'moth', 'fly', 'wasp', 'beetle', 'bug', 'grasshopper', 'mantis', 'dragonfly']);
const FOOD_GENERA = new Set(['citrus', 'malus', 'prunus', 'pyrus', 'olea', 'vitis', 'eriobotrya', 'morus', 'feijoa', 'acca', 'rubus', 'fragaria', 'persea', 'diospyros', 'punica', 'macadamia', 'cydonia', 'juglans', 'corylus', 'castanea', 'passiflora', 'actinidia', 'ribes', 'vaccinium', 'solanum', 'cucurbita', 'rosmarinus', 'ocimum']);
const NECTAR_GENERA = new Set(['eucalyptus', 'corymbia', 'angophora', 'grevillea', 'banksia', 'callistemon', 'melaleuca', 'correa', 'acacia', 'leptospermum', 'bursaria', 'hakea', 'westringia', 'hardenbergia', 'chrysocephalum', 'brachyscome', 'xerochrysum', 'dianella', 'goodenia', 'pelargonium', 'salvia', 'lavandula', 'echium', 'borago', 'agastache', 'lomandra', 'eremophila', 'kunzea', 'olearia', 'senecio', 'arctotheca', 'taraxacum', 'trifolium', 'hypochaeris']);
const genusOfX = x => ((x.tx && x.tx.n) || '').toLowerCase().split(/\s+/)[0];
const isFood = x => { const n = ((x.tx && x.tx.n) || '').toLowerCase(); return n.startsWith('ficus') || FOOD_GENERA.has(n.split(' ')[0]); };
const isPlant = x => ['Plantae'].includes(kindOf(x)) || (!x.tx && bandOf(x) === 5);
function waterNear(lat, lng) {
  const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540; let best = { d: Infinity, n: '', lat, lng };
  const seg = (a, b) => { const ax = (a[1] - lng) * kx, ay = (a[0] - lat) * ky, bx = (b[1] - lng) * kx, by = (b[0] - lat) * ky; const dx = bx - ax, dy = by - ay; const t = clamp(-(ax * dx + ay * dy) / (dx * dx + dy * dy || 1), 0, 1); return { d: Math.hypot(ax + t * dx, ay + t * dy), lat: a[0] + (b[0] - a[0]) * t, lng: a[1] + (b[1] - a[1]) * t }; };
  for (const [n, pts] of WATERS.lines) for (let i = 0; i < pts.length - 1; i++) { const s2 = seg(pts[i], pts[i + 1]); if (s2.d < best.d) best = { ...s2, n }; }
  for (const [n, a, b] of WATERS.points) { const d = haversine(lat, lng, a, b); if (d < best.d) best = { d, n, lat: a, lng: b }; }
  return best;
}
function countsAt(lat, lng, R, self) {
  const c = { insects: 0, flowers: 0, fruit: 0, plants: 0, prey: 0, hollows: 0, pollinators: 0, cats: 0, wildlife: 0, checkins: 0, cool: 0 }; const kinds = new Set();
  for (const x of [...S.obs, ...S.hist, ...S.user]) {
    if (x === self || x.ob || haversine(lat, lng, x.lat, x.lng) > R) continue; const sub = subjectOf(x);
    if (sub.tx && sub.tx.n) kinds.add(sub.tx.n.toLowerCase().split(/\s+/).slice(0, 2).join(' '));
    const g = glyphOf(x), gn = genusOfX(sub);
    if (INSECTS.has(g)) c.insects++; if (POLLINATORS.has(g)) c.pollinators++;
    if (isPlant(sub)) { c.plants++; if (NECTAR_GENERA.has(gn)) c.flowers++; if (gn === 'eucalyptus' || gn === 'corymbia') c.hollows++; }
    if (isFood(sub)) c.fruit++;
    if (g === 'rodent' || g === 'possum') c.prey++;
    if (g === 'cat') c.cats++;
    if (['bird', 'parrot', 'lizard', 'snake', 'possum', 'rodent', 'frog', 'turtle', 'bat'].includes(g) && !(sub.tx && sub.tx.intro)) c.wildlife++;
  }
  for (const h of S.community) { if (haversine(lat, lng, h.lat, h.lng) > R) continue; if (h.kind === 'pulse') c.checkins += h.n || 1; if ((h.tags || []).includes('refuge')) c.cool++; }
  c.kinds = kinds.size;
  return c;
}
let normKey = '', norms = {};
function needNorms() {
  const key = `${S.obs.length}|${S.hist.length}`; if (key === normKey) return norms; normKey = key;
  const pool = S.obs.filter(o => !o.ob); if (pool.length < 10) { norms = {}; return norms; } const step = Math.max(1, Math.floor(pool.length / 40)); const all = {};
  for (let i = 0; i < pool.length; i += step) { const c = countsAt(pool[i].lat, pool[i].lng, 300, pool[i]); for (const k in c) (all[k] = all[k] || []).push(c[k]); }
  const med = a => { a.sort((x, y) => x - y); return a[Math.floor(a.length / 2)] || 0; };
  norms = Object.fromEntries(Object.entries(all).map(([k, a]) => [k, med(a)])); return norms;
}
const NEED_INFO = {
  insects: ['INSECTS', 'Insects to eat'], flowers: ['FLOWERS', 'Nectar and pollen plants'], fruit: ['FRUIT', 'Fruit trees and figs'], plants: ['PLANTS', 'Plants to eat and hide in'],
  prey: ['PREY', 'Rats, mice and possums to hunt'], hollows: ['OLD GUMS', 'Gums old enough to grow hollows'], pollinators: ['POLLINATORS', 'Bees, moths, flies, wasps, lorikeets and flying-foxes'],
  kinds: ['DIVERSITY', 'Kinds of life recorded'], cool: ['COOL ROOMS', 'Cool rooms open in a heatwave'], checkins: ['CHECK-INS', 'People checking on each other'],
  water: ['WATER', 'The nearest creek, river or wetland'], canopy: ['CANOPY', 'Ground under trees'],
  cats: ['CATS', 'Cats recorded'], poison: ['BAITS', 'Shops selling baits, pellets or sprays'], light: ['NIGHT LIGHT', 'Shopfronts and offices lit at night'], litter: ['SINGLE-USE', 'Sellers of single-use packaging'],
  runoff: ['RUNOFF', 'Car washes and garages draining to the creek'], fibres: ['FIBRES', 'Laundromats washing synthetics'], wildlife: ['WILDLIFE', 'Native animals within reach'],
};
const THREAT_ROLE = { poison: 'poison', light: 'light', litter: 'litter', runoff: 'runoff', fibres: 'fibres' };
const NEED_FLOOR = { hollows: 1, kinds: 12, checkins: 2, cool: 1, prey: 2 };
const needCache = new Map();
function needsOf(o) {
  const R = Math.max(300, rangeOf(o)); const key = `${o.id}|${R}|${S.obs.length}|${S.hist.length}|${(S.biz || []).length}|${S.user.length}`;
  if (needCache.has(key)) return needCache.get(key);
  const g = lifeOf(o); const list = NEEDS[g] || NEEDS.paw || ['canopy', 'water', 'cats'];
  const c = countsAt(o.lat, o.lng, R, o); const N = needNorms(); const near = (S.biz ? bizNear(o.lat, o.lng, R) : []);
  const out = list.map(k => {
    const [w, what] = NEED_INFO[k] || [k.toUpperCase(), ''];
    if (k === 'canopy') { const cn = canopyOf(o); return { k, w, v: `${cn.pc}%`, n: cn.pc, st: cn.pc >= CANOPY_TARGET ? 'ok' : cn.pc >= 10 ? 'low' : 'none', tip: `${what} · ${title(cn.sb)} ${cn.yr}: ${cn.pc}% · cools at ${CANOPY_TARGET}%` }; }
    if (k === 'water') { const wn = waterNear(o.lat, o.lng); const d = Math.round(wn.d / 10) * 10; return { k, w, v: metres(d), n: d, st: d <= 250 ? 'ok' : d <= 800 ? 'low' : 'none', tip: `${wn.n} · ${metres(d)}` }; }
    if (THREAT_ROLE[k]) { const n = near.filter(b => b.role === THREAT_ROLE[k]).length; return { k, w, v: String(n), n, threat: true, st: n ? 'near' : 'ok', tip: `${what} · ${n} in ${R} m` }; }
    if (k === 'cats') { const n = c.cats; return { k, w, v: String(n), n, threat: true, st: n ? 'near' : 'ok', tip: `${what} · ${n} in ${R} m` }; }
    if (k === 'wildlife') { const n = c.wildlife; return { k, w, v: String(n), n, st: n ? 'risk' : 'ok', tip: `${what} · ${n} in ${R} m` }; }
    const n = c[k] || 0; const want = Math.max(NEED_FLOOR[k] ?? 3, Math.round((N[k] || 0) * Math.min(9, (R / 300) ** 2)));
    return { k, w, v: String(n), n, want, st: n === 0 ? 'none' : n < want ? 'low' : 'ok', tip: `${what} · ${n} in ${R} m · usual ${want}` };
  });
  needCache.set(key, out); if (needCache.size > 400) needCache.clear(); return out;
}
const NEED_ST = { ok: 'OK', low: 'LOW', none: 'MISSING', near: 'NEARBY', risk: 'AT RISK' };
function needLine(o) { const n = needsOf(o); const by = st => n.filter(x => x.st === st).map(x => x.w); const miss = by('none'), low = by('low'), near = by('near'), risk = n.filter(x => x.st === 'risk');
  return [risk.length ? risk.map(x => `${x.v} ${x.w} AT RISK`).join(', ') : '', miss.length ? `MISSING ${miss.join(', ')}` : '', low.length ? `LOW ${low.join(', ')}` : '', near.length ? `${near.join(', ')} NEARBY` : ''].filter(Boolean).join(' · '); }

/* ───────── cells hidden from the map, kept on this device ───────── */
const HIDE = new Set(store.get('da.hide.v1', []).map(String));
const hiddenCell = id => HIDE.has(String(id));
function setHidden(id, on) { if (on) HIDE.add(String(id)); else HIDE.delete(String(id)); store.set('da.hide.v1', [...HIDE]); }
function showAllHidden() { HIDE.clear(); store.set('da.hide.v1', []); }

/* ───────── the five in greatest need, where past sightings say they live; any of them can be changed on this device ───────── */
const MOVE_OF = { Aves: 'flap', Mammalia: 'climb', Insecta: 'flutter', Arachnida: 'climb', Reptilia: 'walk', Amphibia: 'hop', Actinopterygii: 'walk', Mollusca: 'walk' };
function fiveList() {
  const over = store.get('da.five.v1', []);
  return HEROES.map((h, i) => { const c = over[i]; if (!c || !c.n) return h; const g = c.g || 'paw'; const b = BRIEFS.find(x => x.g.includes(g)) || {};
    return { id: `x${i}-${norm(c.n).replace(/\s+/g, '-').slice(0, 24)}`, n: c.n, cn: c.cn || c.n, ic: c.ic || 'Animalia', th: !!c.th, move: MOVE_OF[c.ic] || 'walk', brief: b.id || null, why: '', home: [], custom: true, slot: i, g }; });
}
function setFive(slot, c) { const over = store.get('da.five.v1', []); while (over.length < HEROES.length) over.push(null); over[slot] = c; store.set('da.five.v1', over); buildHeroes(); }
function buildHeroes() {
  const hs = [];
  for (const [slot, h] of fiveList().entries()) {
    const key = h.n.toLowerCase(); const pts = []; let ph = null;
    for (const x of [...S.obs, ...S.hist]) { const sub = subjectOf(x); if (sub.tx && sub.tx.n && sub.tx.n.toLowerCase().startsWith(key) && inBox(x.lat, x.lng)) { pts.push([x.lat, x.lng]); if (!ph && x.ph && licOpen(x.ph.l)) ph = x; } }
    const curated = pts.length < 3; const home = curated ? [...pts, ...(h.home || [])] : pts.slice(0, 60);
    if (!home.length) home.push([S.scan.lat + 0.0012 * Math.cos(slot * 1.3), S.scan.lng + 0.0016 * Math.sin(slot * 1.3)]);
    let best = home[0], bn = -1; for (const p of home) { const n = home.filter(q => haversine(p[0], p[1], q[0], q[1]) < 450).length; if (n > bn) { bn = n; best = p; } }
    hs.push({ id: 'hero:' + h.id, hero: h.id, heroOf: h, slot, g: h.g, sigPin: !!h.custom, lat: best[0], lng: best[1], b: bandOf({ tx: { ic: h.ic } }), tx: { id: ph ? ph.tx.id : null, n: h.n, cn: h.cn, ic: h.ic, th: !!h.th, na: true, intro: false }, ph: ph ? ph.ph : null, u: ph ? ph.u : null, so: null, n: pts.length, home, curated, rare: 1, d: null });
  }
  for (const o of S.heroes) S.byId.delete(o.id);
  S.heroes = hs; for (const o of hs) S.byId.set(o.id, o);
}
/* ───────── groups already caring for a patch of ground ───────── */
function buildTribes() {
  S.tribes = TRIBES.map(t => {
    const r0 = seeded(t.id); const blobs = []; const z = t.zone || {};
    const rnd = (a, b) => a + (b - a) * r0();
    if (z.line) { const ln = (WATERS.lines.find(l => l[0] === z.line) || [0, []])[1]; for (let i = 0; i < ln.length - 1; i++) { const [a, b] = [ln[i], ln[i + 1]]; const L = haversine(a[0], a[1], b[0], b[1]); const n = Math.max(1, Math.round(L / 110)); for (let k = 0; k < n; k++) { const f = k / n; const j = (r0() - 0.5) * 0.0011; blobs.push([a[0] + (b[0] - a[0]) * f + j, a[1] + (b[1] - a[1]) * f - j, rnd(z.w * 0.5, z.w * 1.15)]); } } }
    if (z.pts) for (const [la, ln, r] of z.pts) blobs.push([la, ln, r]);
    if (z.area) { const la = z.area.map(p => p[0]), lo = z.area.map(p => p[1]); for (let k = 0; k < (z.n || 20); k++) blobs.push([rnd(Math.min(...la), Math.max(...la)), rnd(Math.min(...lo), Math.max(...lo)), rnd(z.r[0], z.r[1])]); }
    if (z.scatter) { const [[a1, b1], [a2, b2]] = z.scatter; for (let k = 0; k < (z.n || 30); k++) blobs.push([rnd(Math.min(a1, a2), Math.max(a1, a2)), rnd(Math.min(b1, b2), Math.max(b1, b2)), rnd(z.r[0], z.r[1])]); }
    const lat = blobs.reduce((s2, b) => s2 + b[0], 0) / (blobs.length || 1), lng = blobs.reduce((s2, b) => s2 + b[1], 0) / (blobs.length || 1);
    return { ...t, blobs, lat, lng, id: 'tribe:' + t.id, tid: t.id, isTribe: true };
  });
  for (const t of S.tribes) S.byId.set(t.id, t);
}
const inTribe = (t, lat, lng) => t.blobs.some(([a, b, r]) => haversine(lat, lng, a, b) <= r);
/* the nearest point of a group's ground, and how far it is */
const tribeNear = (t, lat, lng) => { let best = null; for (const [a, b, r] of t.blobs) { const d = Math.max(0, haversine(lat, lng, a, b) - r); if (!best || d < best.d) best = { d, lat: a, lng: b }; } return best; };
const livesIn = t => cellsAll().filter(o => !o.hum && !isCold(o) && !o.isTribe && inTribe(t, o.lat, o.lng));

/* ───────── weather today: for the hot-day layers on the ground ───────── */
async function loadWeather() {
  if (S.wx.t && Date.now() - S.wx.t < 60 * 60000 && (S.wx.days || []).length > 3) return false;
  try {
    const j = await (await fetch(CONFIG.WEATHER_URL)).json(); const D = j.daily || {};
    const tm = D.temperature_2m_max || [], tn = D.temperature_2m_min || [], pr = D.precipitation_sum || [];
    S.wx = { t: Date.now(), tmax: Math.max(...tm.slice(0, 2).filter(v => v != null)), tmin: tn[1] ?? tn[0] ?? null, rain: pr.slice(0, 3).reduce((a, b) => a + (b || 0), 0), days: (D.time || []).map((d, i) => ({ d, t: tm[i], n: tn[i] ?? null, p: pr[i] })) };
    store.set('da.wx.v3', S.wx);
    if (S.obs.length) refresh();
    return true;
  } catch (e) { return false; }
}

/* ════════════════════════════════════════════════════════════════════
   SIGHTINGS — iNaturalist, any record with a photo or a sound
   ════════════════════════════════════════════════════════════════════ */
function compact(r) {
  const c = r.geojson && r.geojson.coordinates; if (!c) return null;
  const t = r.taxon || {}; const ph = (r.photos || [])[0]; const so = (r.sounds || [])[0]; if (!ph && !so) return null;
  const gp = v => v === 'obscured' || v === 'private';
  /* the other photographs of the same sighting, where their licence lets the slip print them in black and white */
  const phs = (r.photos || []).slice(1, 4).filter(p => p && p.url && licAdaptable(p.license_code)).map(p => ({ u: p.url, l: p.license_code, a: p.attribution || '' }));
  return {
    id: r.id, d: r.observed_on || (r.time_observed_at || '').slice(0, 10), t: r.time_observed_at || null, c: r.created_at || null,
    lat: +c[1], lng: +c[0], ob: !!(r.obscured || gp(r.geoprivacy) || gp(r.taxon_geoprivacy)), cap: !!r.captive, q: r.quality_grade || '', pg: r.place_guess || '',
    tx: { id: t.id || null, n: t.name || r.species_guess || 'Unidentified', cn: t.preferred_common_name || '', ic: t.iconic_taxon_name || 'Unknown', th: !!t.threatened, na: t.native === true, intro: t.introduced === true },
    u: { l: (r.user && r.user.login) || '', n: (r.user && r.user.name) || '' },
    ph: ph ? { u: ph.url, l: ph.license_code || null, a: ph.attribution || '' } : null,
    so: so ? { u: so.file_url, l: so.license_code || null } : null, ...(phs.length ? { phs } : {}),
  };
}
async function fetchSightings(force) {
  const cache = store.get('da.obs.v3', null);
  if (cache && !force && Date.now() - cache.t < CONFIG.REFRESH_MIN * 60000) { useSightings(cache.obs, cache.t, false); return; }
  if (cache && !S.obs.length) useSightings(cache.obs, cache.t, true);
  const d1 = isoDay(new Date(Date.now() - CONFIG.DAYS * 864e5));
  const q = new URLSearchParams({ nelat: B.n, nelng: B.e, swlat: B.s, swlng: B.w, d1, order_by: 'observed_on', order: 'desc', per_page: 200, locale: 'en', preferred_place_id: CONFIG.PLACE_PREF });
  try {
    const all = [];
    for (let page = 1; page <= CONFIG.PAGES; page++) {
      const res = await fetch(`${CONFIG.INAT_API}/observations?${q}&page=${page}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json(); all.push(...(j.results || []));
      if ((j.total_results || 0) <= page * 200) break;
    }
    const obs = all.map(compact).filter(Boolean); const t = Date.now();
    if (!store.set('da.obs.v3', { t, obs })) store.set('da.obs.v3', { t, obs: obs.slice(0, 250) });
    useSightings(obs, t, false);
  } catch (e) {
    if (cache) useSightings(cache.obs, cache.t, true);
    else { S.offline = true; signalLost(); }
  }
}
function useSightings(list, t, stale) {
  const keep = S.obs.filter(o => o.ext);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const counts = new Map(); const key = o => o.tx.id || o.tx.n;
  for (const o of list) counts.set(key(o), (counts.get(key(o)) || 0) + 1);
  const maxc = Math.max(2, ...counts.values());
  for (const o of list) {
    const day = parseDay(o.d);
    o.age = day ? Math.max(0, Math.round((today - day) / 864e5)) : 99;
    o.rare = 1 - Math.log(counts.get(key(o))) / Math.log(maxc + 1);
    o.isNew = !!(S.lastVisit && o.c && Date.parse(o.c) > S.lastVisit);
  }
  list.sort((a, b) => (b.d || '').localeCompare(a.d || '') || (b.t || '').localeCompare(a.t || '') || b.id - a.id);
  for (const k of keep) if (!list.some(o => o.id === k.id)) list.push(k);
  const made = [...S.byId.values()].filter(o => o.sigPin);   /* cells made from signals stay */
  S.obs = list; S.byId = new Map(list.map(o => [o.id, o]));
  for (const u of [...S.user, ...S.community, ...S.hist, ...S.heroes, ...S.tribes, ...made]) S.byId.set(u.id, u);
  S.lastSignal = t; S.stale = stale; S.offline = false;
  derive(); refresh();
  if (!stale) setTimeout(() => store.set('da.lastVisit', Date.now()), 4000);
  handleHash();
}
async function fetchNew() {
  if (document.hidden) return 0;
  if (!S.obs.length || S.offline) { await fetchSightings(true); return 0; }
  const maxId = S.obs.reduce((m, o) => (!o.ext && typeof o.id === 'number' && o.id > m ? o.id : m), 0);
  const d1 = isoDay(new Date(Date.now() - CONFIG.DAYS * 864e5));
  const q = new URLSearchParams({ nelat: B.n, nelng: B.e, swlat: B.s, swlng: B.w, d1, id_above: maxId, order_by: 'id', order: 'asc', per_page: 200, locale: 'en', preferred_place_id: CONFIG.PLACE_PREF });
  try {
    const res = await fetch(`${CONFIG.INAT_API}/observations?${q}`, { headers: { Accept: 'application/json' } }); if (!res.ok) return 0;
    const fresh = ((await res.json()).results || []).map(compact).filter(o => o && !S.byId.has(o.id));
    if (!fresh.length) return 0;
    const list = [...S.obs.filter(o => !o.ext), ...fresh]; const t = Date.now();
    if (!store.set('da.obs.v3', { t, obs: list })) store.set('da.obs.v3', { t, obs: list.slice(0, 250) });
    for (const o of fresh) if (!o.ob) { S.arrivals.add(o.id); o.arrived = Date.now(); }
    useSightings(list, t, false);
    return fresh.length;
  } catch (e) { return 0; }
}
async function fetchHistory() {
  const H = CONFIG.HISTORY; if (!H || !H.years) return;
  const cache = store.get('da.hist.v1', null); let list = cache && Date.now() - cache.t < 3 * 864e5 ? cache.list : null;
  if (!list) {
    list = [];
    for (let y = 1; y <= H.years; y++) {
      const a = new Date(); a.setFullYear(a.getFullYear() - y);
      const q = new URLSearchParams({ nelat: B.n, nelng: B.e, swlat: B.s, swlng: B.w, d1: isoDay(new Date(a.getTime() - H.days * 864e5)), d2: isoDay(new Date(a.getTime() + H.days * 864e5)), quality_grade: 'research', order_by: 'observed_on', order: 'desc', per_page: H.per || 200, locale: 'en', preferred_place_id: CONFIG.PLACE_PREF });
      try { const res = await fetch(`${CONFIG.INAT_API}/observations?${q}`, { headers: { Accept: 'application/json' } }); if (!res.ok) continue; for (const r of (await res.json()).results || []) { const o = compact(r); if (o && !o.ob) list.push(o); } } catch (e) { /* the past can wait */ }
    }
    if (list.length && !store.set('da.hist.v1', { t: Date.now(), list })) store.set('da.hist.v1', { t: Date.now(), list: list.slice(0, 160) });
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  S.hist = list.filter(o => !S.byId.has(o.id) || S.byId.get(o.id).hist).map(o => { const day = parseDay(o.d); return Object.assign(o, { hist: true, age: day ? Math.round((today - day) / 864e5) : 400, rare: 0.3 }); });
  for (const o of S.hist) S.byId.set(o.id, o);
  life.data();
}
async function liveTick() { const n = await fetchNew(); await loadWeather(); refreshPanel(); return n; }

/* gatherings from a published sheet: title, start, venue, lat, lng, tags (nature free gig rrr ra …), link */
const parseCSV = t => {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
};
async function loadEvents() {
  if (!CONFIG.EVENTS_URL) return 0;
  try {
    const rows = parseCSV(await (await fetch(CONFIG.EVENTS_URL)).text()); const head = (rows.shift() || []).map(h => h.trim().toLowerCase()); let n = 0;
    for (const r of rows) {
      const g = k => { const i = head.indexOf(k); return i >= 0 ? String(r[i] || '').trim() : ''; };
      const lat = +g('lat'), lng = +g('lng'), start = Date.parse(g('start')); if (!g('title') || !inBox(lat, lng) || !start) continue;
      n++; const o = { id: 'e:' + n, hid: 'E' + pad2(n), comm: true, hum: true, b: 0, kind: 'event', isEvent: true, real: true, lat, lng, title: g('title'), venue: g('venue'), start, tags: g('tags').toLowerCase().split(/[\s;|]+/).filter(Boolean), link: g('link'), n: 0, at: Date.now(), d: isoDay(new Date()), age: 0 };
      S.community = S.community.filter(x => x.id !== o.id); S.community.push(o); S.byId.set(o.id, o);
    }
    if (n) refresh();
    return n;
  } catch (e) { return 0; }
}

/* ════════════════════════════════════════════════════════════════════
   LEDGER — on this device: placed records and signals
   ════════════════════════════════════════════════════════════════════ */
const ledger = { local: store.get('da.ledger.v4', []) };
const evKey = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
function ledgerAll() {
  const redacted = new Set(ledger.local.filter(e => e.type === 'redact').map(e => e.ref));
  return ledger.local.filter(e => e && e.key && !redacted.has(e.key)).sort((a, b) => (a.at || 0) - (b.at || 0));
}
async function ledgerAdd(ev) {
  ev.key = ev.key || evKey(); ev.at = ev.at || Date.now(); ev.who = ev.who != null ? ev.who : (S.me.by || ''); ev.dev = S.me.dev;
  ledger.local.push(ev); store.set('da.ledger.v4', ledger.local);
  derive(); refresh();
  return ev;
}
const PLACED = new Set(['noticed', 'need', 'offer', 'event', 'injured', 'lost', 'dead']);
function derive() {
  const user = []; const sigs = [];
  for (const e of ledgerAll()) {
    if (PLACED.has(e.type)) user.push(userPing(e));
    else if (e.type === 'signal') sigs.push({ key: e.key, at: e.at, who: e.who || '', mine: e.dev === S.me.dev && !(e.data || {}).recv, ...(e.data || {}) });
  }
  for (const u of S.user) S.byId.delete(u.id);
  S.user = user; for (const u of user) S.byId.set(u.id, u);
  S.signals = [...sigs.sort((a, b) => b.at - a.at), ...EXAMPLES.map(x => ({ key: 'ex:' + x.code, ex: true, ...x, at: Date.parse(x.at) }))];
}
function userPing(e) {
  const d = e.data || {}; const hum = ['need', 'offer', 'event', 'injured', 'lost', 'dead'].includes(e.type);
  const tx = d.tx && d.tx.n ? { id: null, n: d.tx.n, cn: d.tx.cn || d.tx.n, ic: d.tx.ic || 'Animalia', th: !!d.tx.th, na: !d.tx.intro, intro: !!d.tx.intro } : undefined;
  const u = { id: 'u:' + e.key, ev: e, user: true, hum, kind: e.type, lat: +e.lat, lng: +e.lng, b: hum ? 0 : e.b != null ? e.b : tx ? undefined : 5, at: e.at, t: new Date(e.at).toISOString(), who: e.who || '', age: Math.round((Date.now() - e.at) / 864e5), rare: 0.5, d: isoDay(new Date(e.at)), title: d.text || '', said: d.text || '', photo: d.photo || null, n: +d.n || 0, tx };
  if (e.type === 'event') Object.assign(u, { isEvent: true, title: d.text || '', start: Date.parse(d.start) || null, venue: d.venue || '', link: d.link || '' });
  if (hum && tx) u.title = d.text || tx.cn;
  if (d.g) u.g = d.g; if (d.contact) u.contact = d.contact;
  return u;
}


/* ════════════════════════════════════════════════════════════════════
   PLACES — the human ecology around each life. The places and networks in places.js are always here, offline too.
   Around a life just opened, every named business OpenStreetMap knows is fetched a small square at a time and kept.
   Each place belongs to one part of the human ecology (brands, circular, services, artists, third spaces, networks)
   and plays a role near the lives around it; a shop can also sell what harms them (takeaway containers, plastic bottles,
   paint, pesticides). They appear only inside an open cell's radius, as knots a string can be tied to.
   ════════════════════════════════════════════════════════════════════ */
function sectorOf(t) {
  const a = t.amenity, s = t.shop, c = t.craft, o = t.office; const has = (v, list) => v && list.includes(v);
  if (has(a, ['nightclub', 'theatre', 'arts_centre', 'music_venue', 'cinema', 'community_centre', 'events_venue', 'library', 'social_centre'])) return 'VENUE';
  if (has(a, ['cafe', 'restaurant', 'fast_food', 'bar', 'pub', 'ice_cream', 'food_court', 'biergarten']) || has(s, ['bakery', 'deli', 'confectionery', 'coffee', 'beverages', 'alcohol', 'wine', 'pastry', 'chocolate', 'tea'])) return 'FOOD';
  if (has(s, ['supermarket', 'convenience', 'greengrocer', 'butcher', 'grocery', 'organic', 'health_food', 'seafood', 'frozen_food']) || a === 'marketplace') return 'GROCERY';
  if (has(s, ['hardware', 'doityourself', 'garden_centre', 'trade', 'building_materials', 'paint', 'agrarian', 'florist']) || c === 'gardener') return 'GARDEN';
  if (has(s, ['clothes', 'fabric', 'shoes', 'boutique', 'fashion_accessories', 'bag', 'second_hand', 'tailor', 'sewing', 'haberdashery', 'dry_cleaning', 'laundry', 'textiles', 'jewelry', 'leather']) || has(c, ['tailor', 'dressmaker', 'upholsterer', 'shoemaker'])) return 'FASHION';
  if (has(a, ['fuel', 'car_wash', 'car_rental']) || has(s, ['car', 'car_repair', 'car_parts', 'tyres', 'motorcycle'])) return 'MOTOR';
  if (a === 'pharmacy' || has(s, ['chemist', 'beauty', 'hairdresser', 'cosmetics', 'perfumery', 'massage', 'tattoo', 'nail_salon'])) return 'CARE';
  if (a === 'veterinary' || has(s, ['pet', 'pet_grooming'])) return 'PETS';
  if (o || a === 'bank') return 'OFFICE';
  return 'RETAIL';
}
/* what a named place sells or leaves that harms a life near it, from its OpenStreetMap tags; most shops harm nothing */
function harmsOfTags(t) {
  const a = t.amenity, s = t.shop, c = t.craft, o = t.office; const has = (v, list) => v && list.includes(v); const h = [];
  if (/\b(pest|termite|weed|spray)/i.test(t.name || '') || c === 'gardener' || s === 'landscaping') h.push('spraying');
  if (has(a, ['cafe', 'restaurant', 'fast_food', 'ice_cream', 'food_court']) || has(s, ['bakery', 'coffee', 'deli', 'convenience', 'kiosk'])) h.push('takeaway');
  if (has(a, ['fast_food', 'bar', 'pub', 'nightclub', 'biergarten'])) h.push('litter');
  if (has(s, ['convenience', 'kiosk', 'supermarket', 'alcohol', 'beverages', 'wine', 'chemist']) || has(a, ['fuel', 'pharmacy'])) h.push('bottles');
  if (has(s, ['paint', 'hardware', 'doityourself', 'trade', 'building_materials'])) h.push('paint');
  if (has(s, ['hardware', 'doityourself', 'garden_centre', 'agrarian', 'supermarket']) || /\bpest/i.test(t.name || '')) h.push('poison');
  if (has(a, ['fuel', 'car_wash']) || has(s, ['car_repair', 'car', 'tyres', 'motorcycle'])) h.push('runoff');
  if (has(s, ['laundry', 'dry_cleaning'])) h.push('fibres');
  if (has(s, ['clothes', 'shoes', 'boutique', 'fashion_accessories', 'bag']) && t.second_hand !== 'only') h.push('fashion');
  if (has(a, ['bar', 'pub', 'nightclub']) || (o && !has(o, ['association', 'ngo', 'charity', 'foundation']))) h.push('light');
  return [...new Set(h)];
}
/* the role a named place plays, from its OpenStreetMap tags: what it does first, else the harm it does */
function roleOfTags(t) {
  const a = t.amenity, s = t.shop, c = t.craft, o = t.office, l = t.leisure; const has = (v, list) => v && list.includes(v);
  if (has(a, ['library', 'community_centre', 'social_centre', 'townhall']) || has(l, ['swimming_pool', 'sports_centre']) || (l === 'garden' && /community/.test(t['garden:type'] || ''))) return 'third';
  if (has(o, ['association', 'ngo', 'charity', 'foundation']) || (a === 'studio' && /radio/.test(t.studio || ''))) return 'network';
  if (has(s, ['second_hand', 'charity']) || t.second_hand === 'only') return 'reuse';
  if (has(c, ['tailor', 'dressmaker', 'shoemaker', 'upholsterer']) || has(s, ['tailor', 'repair', 'bicycle', 'shoe_repair', 'fabric', 'sewing', 'haberdashery', 'textiles'])) return 'repair';
  if (has(s, ['organic', 'health_food', 'zero_waste', 'bulk'])) return 'coop';
  if (s === 'garden_centre') return 'grower';
  if (a === 'marketplace') return 'market';
  if (has(a, ['arts_centre']) || has(t.tourism, ['gallery', 'museum']) || s === 'art') return 'space';
  if (has(c, ['pottery', 'jeweller', 'printer', 'sculptor', 'carpenter']) || has(o, ['architect', 'design', 'coworking']) || s === 'copyshop' || l === 'hackerspace' || a === 'coworking_space') return 'studio';
  if (a === 'veterinary') return 'vet';
  if (s === 'pet') return 'pets';
  return harmsOfTags(t)[0] || 'owner';
}
const GRID = 0.004;
let bizGrid = new Map();
function indexBiz() { bizGrid = new Map(); (S.biz || []).forEach((b, i) => { const k = `${Math.floor(b[3] / GRID)},${Math.floor(b[4] / GRID)}`; if (!bizGrid.has(k)) bizGrid.set(k, []); bizGrid.get(k).push(i); }); }
function bizNear(lat, lng, R) {
  const out = []; if (!S.biz) return out;
  const di = Math.ceil(R / 111000 / GRID), dj = Math.ceil(R / (111000 * Math.cos(lat * Math.PI / 180)) / GRID), ci = Math.floor(lat / GRID), cj = Math.floor(lng / GRID);
  for (let i = ci - di; i <= ci + di; i++) for (let j = cj - dj; j <= cj + dj; j++) {
    const a = bizGrid.get(`${i},${j}`); if (!a) continue;
    for (const k of a) { const b = S.biz[k]; const d = haversine(lat, lng, b[3], b[4]); if (d <= R) { const m = b[5] || {}; out.push({ i: k, n: b[0], b: b[1], sec: b[2], lat: b[3], lng: b[4], d, role: roleOfRow(b), h: harmsOfRow(b), fam: famOf(roleOfRow(b), m), cur: !!m.cur, url: m.url || '', what: m.what || '', addr: m.addr || '', a: !!m.a }); } }
  }
  return out.sort((a, b) => a.d - b.d);
}
/* a place's role: its own, else its kind of trade's; and the harms it does, its own, else its role's when that is one */
const roleOfRow = b => (b[5] && b[5].role) || (SECTORS[b[2]] || {}).role || 'owner';
const harmsOfRow = b => (b[5] && b[5].h) || (ROLES[roleOfRow(b)] && ROLES[roleOfRow(b)].on ? [roleOfRow(b)] : []);
const famOf = (role, m) => (m && m.cat) || (ROLES[role] || {}).cat || 'service';
const onNotice = role => !!(ROLES[role] && ROLES[role].on);
/* the places listed here: on the map from the first moment, offline too */
const LISTED = PLACES.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map(p => [p.n, '', 'LISTED', p.lat, p.lng, { role: p.role, cat: p.cat, url: p.url, what: p.what, addr: [p.addr, p.sub].filter(Boolean).join(', '), cur: 1, ...(p.a ? { a: 1 } : {}) }]);
/* OpenStreetMap, a square of about a kilometre at a time, kept a fortnight (an empty square, a day) */
const TILE = 0.01, TILES = store.get('da.tiles.v5', {});
try { localStorage.removeItem('da.biz.v4'); } catch (e) { /* old cache gone */ }
const tileKey = (i, j) => `${i},${j}`;
const freshTile = t => !!t && Date.now() - t.t < ((t.rows || []).length ? 14 : 1) * 864e5;
function rebuildBiz() {
  const rows = [...LISTED]; const seen = new Set(LISTED.map(r => `${norm(r[0])}|${r[3].toFixed(3)}|${r[4].toFixed(3)}`));
  const listedNear = r => LISTED.some(l => haversine(l[3], l[4], r[3], r[4]) < 90 && (norm(l[0]).includes(norm(r[0])) || norm(r[0]).includes(norm(l[0]).split(' ').slice(0, 2).join(' '))));
  for (const t of Object.values(TILES)) for (const r of t.rows || []) { const k = `${norm(r[0])}|${(+r[3]).toFixed(3)}|${(+r[4]).toFixed(3)}`; if (seen.has(k) || listedNear(r)) continue; seen.add(k); rows.push(r); }
  S.biz = rows; indexBiz();
}
function saveTiles() {
  const keys = Object.keys(TILES).sort((a, b) => TILES[a].t - TILES[b].t); while (keys.length > 40) delete TILES[keys.shift()];
  while (!store.set('da.tiles.v5', TILES) && keys.length) delete TILES[keys.shift()];
}
rebuildBiz();
const tilesFor = (lat, lng, R) => { const di = R / 111320, dj = R / (111320 * Math.cos(lat * Math.PI / 180)); const out = []; for (let i = Math.floor((lat - di) / TILE); i <= Math.floor((lat + di) / TILE); i++) for (let j = Math.floor((lng - dj) / TILE); j <= Math.floor((lng + dj) / TILE); j++) out.push([i, j]); return out; };
const PLACE_Q = bb => `[out:json][timeout:25];(nwr["shop"]["name"](${bb});nwr["amenity"~"^(cafe|restaurant|fast_food|bar|pub|ice_cream|food_court|biergarten|fuel|car_wash|car_rental|pharmacy|bank|veterinary|marketplace|nightclub|theatre|arts_centre|music_venue|cinema|community_centre|events_venue|library|social_centre|townhall|coworking_space|studio)$"]["name"](${bb});nwr["craft"]["name"](${bb});nwr["office"]["name"](${bb});nwr["leisure"~"^(hackerspace|swimming_pool|sports_centre|garden)$"]["name"](${bb});nwr["tourism"~"^(gallery|museum)$"]["name"](${bb}););out center tags qt;`;
let placesBusy = null, placesFailAt = 0;
/* the places around a point, fetched if not yet kept; whatever happens the listed places are already here */
function placesAround(lat, lng, R) {
  const need = tilesFor(lat, lng, R).filter(([i, j]) => !freshTile(TILES[tileKey(i, j)]));
  if (!need.length) { S.bizState = 'ok'; return Promise.resolve(S.biz); }
  if (placesBusy) return placesBusy;
  if (Date.now() - placesFailAt < 90000) { S.bizState = 'off'; return Promise.resolve(S.biz); }
  S.bizState = 'loading'; if (typeof placesChanged === 'function') placesChanged();
  placesBusy = (async () => {
    const is = need.map(t => t[0]), js = need.map(t => t[1]);
    const bb = [Math.min(...is) * TILE, Math.min(...js) * TILE, (Math.max(...is) + 1) * TILE, (Math.max(...js) + 1) * TILE].map(v => v.toFixed(4)).join(',');
    for (const url of CONFIG.OVERPASS) {
      try {
        const res = await fetch(`${url}?data=${encodeURIComponent(PLACE_Q(bb))}`); if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json(); if (j.remark && /error|time/i.test(j.remark)) throw new Error(j.remark);
        const by = new Map(need.map(([i, k]) => [tileKey(i, k), []]));
        for (const el of j.elements || []) {
          const t = el.tags || {}; const la = el.lat != null ? el.lat : el.center && el.center.lat; const ln = el.lon != null ? el.lon : el.center && el.center.lon; if (la == null || !t.name) continue;
          const key = tileKey(Math.floor(la / TILE), Math.floor(ln / TILE)); if (!by.has(key)) continue;
          const role = roleOfTags(t), h = harmsOfTags(t), url = t.website || t['contact:website'] || t.url || '';
          by.get(key).push([t.name, t.brand && t.brand !== t.name ? t.brand : '', sectorOf(t), +la.toFixed(5), +ln.toFixed(5), { role, ...(h.length ? { h } : {}), ...(/^https?:\/\//.test(url) ? { url } : {}) }]);
        }
        const now = Date.now(); for (const [k, rows] of by) TILES[k] = { t: now, rows };
        saveTiles(); rebuildBiz(); S.bizState = 'ok'; placesBusy = null; if (typeof placesChanged === 'function') placesChanged(); return S.biz;
      } catch (e) { /* the next mirror */ }
    }
    placesFailAt = Date.now(); S.bizState = 'off'; placesBusy = null; if (typeof placesChanged === 'function') placesChanged(); return S.biz;
  })();
  return placesBusy;
}
const liveEvent = u => !u.isEvent || !u.start || u.start + 3 * 3600e3 > Date.now();
/* a gig: tagged gig, or listed by Triple R (rrr) or Resident Advisor (ra) */
const isGig = o => !!o && !!o.isEvent && (o.tags || []).some(t => t === 'gig' || t === 'rrr' || t === 'ra');
const gigOf = o => ((o && o.tags) || []).map(t => GIGS[t]).find(Boolean) || null;
const cellsAll = () => [...S.obs.filter(o => !o.ob), ...S.user.filter(liveEvent), ...S.community.filter(c => c.kind !== 'refuge' && liveEvent(c)), ...S.heroes].filter(o => !hiddenCell(o.id));
const subjectOf = o => (o.ref != null && S.byId.get(o.ref) ? S.byId.get(o.ref) : o);


/* ════════════════════════════════════════════════════════════════════
   THE GROUND — the satellite photograph on the land's own relief. No roads, no labels:
   the marks above it (35-life.js) are the only things that speak, and only where the radar has looked.
   ════════════════════════════════════════════════════════════════════ */
const IMG = CONFIG.IMAGERY;
const style = {
  version: 8,
  transition: { duration: 0, delay: 0 },
  sources: {
    sat: { type: 'raster', tiles: [IMG.url], tileSize: 256, maxzoom: IMG.maxzoom || 19, attribution: IMG.attribution },
    dem: { type: 'raster-dem', tiles: [CONFIG.DEM_URL], tileSize: 256, maxzoom: 15, encoding: 'terrarium', attribution: 'Terrain: AWS Terrain Tiles, GA 5 m DEM' },
    demShade: { type: 'raster-dem', tiles: [CONFIG.DEM_URL], tileSize: 256, maxzoom: 15, encoding: 'terrarium' },
  },
  layers: [
    { id: 'ground', type: 'background', paint: { 'background-color': '#1E2622' } },
    { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-saturation': -0.38, 'raster-contrast': -0.04, 'raster-brightness-max': 0.9, 'raster-fade-duration': 0 } },
    { id: 'shade', type: 'hillshade', source: 'demShade', paint: { 'hillshade-exaggeration': 0.2, 'hillshade-shadow-color': '#0B2545', 'hillshade-highlight-color': '#FFFFFF', 'hillshade-accent-color': '#0B2545' } },
  ],
};
/* the frame: on a phone the card is a sheet over the lower half, so the ground is framed above it; on a desk it sits to the right */
const phone = () => innerWidth < 760;
const framePad = () => (phone() ? { top: 24, left: 16, right: 16, bottom: Math.round(innerHeight * (S.open ? 0.56 : 0)) + 16 } : { top: 32, left: 32, bottom: 32, right: (S.open ? Math.min(440, innerWidth * 0.4) : 0) + 64 });
const sheetOffset = () => (phone() && S.open ? [0, -innerHeight * (document.body.classList.contains('placing') ? 0.37 : 0.26)] : !phone() && S.open ? [-Math.min(440, innerWidth * 0.4) / 2, 0] : [0, 0]);
/* the zoom at which the radar fills a good part of the screen */
const metresPerPx = (lat, z) => 78271.51696 * Math.cos(lat * Math.PI / 180) / Math.pow(2, z);
function scanZoom(r = S.scan.r) { const c = $('#world'); const dim = Math.min(c.clientWidth || innerWidth, (c.clientHeight || innerHeight) * (phone() && S.open ? 0.5 : 1)); return clamp(Math.log2(78271.51696 * Math.cos(S.scan.lat * Math.PI / 180) / (r / (dim * 0.36))), 12.5, 17.5); }
const map = new maplibregl.Map({
  container: 'world', style, center: [S.scan.lng, S.scan.lat], zoom: 13, pitch: 0, bearing: 0, maxPitch: 70,
  attributionControl: false, fadeDuration: 0, renderWorldCopies: false,
  maxBounds: [[B.w - 0.07, B.s - 0.06], [B.e + 0.07, B.n + 0.06]],
});
map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: `<a href="#sources" class="da-about">${CONFIG.NAME} · ${CONFIG.BY.toUpperCase()}</a> · iNaturalist · © OpenStreetMap · Open-Meteo` }), 'bottom-left');
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a.da-about'); if (a) { e.preventDefault(); setView(1, false, 'sources'); } });
map.on('load', () => {
  S.mapReady = true;
  const open = S.byId.get(S.sel); const sg = S.mode === 'sig' && S.signals.find(x => x.key === S.sig);
  if (open) map.jumpTo({ center: [open.lng, open.lat], zoom: 15.6 });
  else if (sg && sg.pin) map.jumpTo({ center: [sg.pin.lng, sg.pin.lat], zoom: 15.6 });
  else { const z = scanZoom(); if (!reduced()) { map.jumpTo({ center: [S.scan.lng, S.scan.lat], zoom: z - 0.8 }); map.easeTo({ zoom: z, duration: 1600, easing: t => 1 - Math.pow(1 - t, 3) }); } else map.jumpTo({ center: [S.scan.lng, S.scan.lat], zoom: z }); }
  const fold = () => { const a = document.querySelector('.maplibregl-ctrl-attrib'); if (a) a.classList.remove('maplibregl-compact-show'); };
  fold(); setTimeout(fold, 200);
  life.start(); refresh();
});
map.on('error', () => { /* a tile that cannot load stays blank; offline is a normal state */ });
map.on('move', () => life.moved());
map.on('resize', () => life.resize());

/* tilt far enough and the ground rises: the terrain in three dimensions under the same photograph */
let raised = false;
map.on('pitchend', () => {
  const want = map.getPitch() > 22; if (want === raised) return; raised = want;
  try { map.setTerrain(want ? { source: 'dem', exaggeration: CONFIG.TERRAIN_EXAGGERATION } : null); } catch (e) { /* flat is fine */ }
  life.moved();
});

/* ───────── touch: everything on the ground is hit-tested where it is drawn ───────── */
map.on('click', e => {
  /* while placing: a touch inside the marker's radius moves it there; on the marker itself or outside the radius, placing is cancelled */
  if (S.mode === 'place') { if (consumeHold()) return; const p = S.place; const q = p && map.project([p.lng, p.lat]); if (p && (Math.hypot(q.x - e.point.x, q.y - e.point.y) < 18 || haversine(p.lat, p.lng, e.lngLat.lat, e.lngLat.lng) > rangeOf(p))) { cancelPlace(); return; } movePlace(e.lngLat); return; }
  const h = life.hit(e.point.x, e.point.y);
  /* an open cell keeps its focus: knots are looked at, then tied; a life outside its radius is only looked at */
  if (S.mode === 'ping') {
    if (knotHeld) { knotHeld = false; return; }
    if (h && h.kind === 'node') { strings.tap(h.key); return; }
    if (h && h.kind === 'cell') { if (h.id === S.sel) strings.tap('pin'); else strings.peekOut(h.id); return; }
    if (h && h.kind === 'zoom') return;
    const o = S.byId.get(S.sel); if (o && haversine(o.lat, o.lng, e.lngLat.lat, e.lngLat.lng) <= rangeOf(o)) { strings.ground(e.lngLat); return; }
    strings.unpeek(); tick(800); return;
  }
  if (h) {
    if (h.kind === 'zoom') return;
    if (h.kind === 'node') { strings.tap(h.key); return; }
    if (h.kind === 'new') { life.offer(null); startPlace({ lat: h.lat, lng: h.lng }); return; }
    if (h.kind === 'tribe') { selectTribe(h.id); return; }
    if (h.kind === 'sig') { openSignal(h.key); return; }
    select(h.id); return;
  }
  if (S.mode) { closeRecord(); return; }
  /* inside the radar: offer a new record here; outside it: the radar goes there */
  if (life.inScan(e.lngLat.lat, e.lngLat.lng)) { life.offer(e.lngLat); tick(1300); }
  else life.moveScan(e.lngLat.lat, e.lngLat.lng, true);
});
/* a double tap ties instead of zooming while a cell or a marker is open */
map.on('dblclick', e => { if (S.mode === 'ping' || S.mode === 'place') e.preventDefault(); });
let hoverT = 0, hoverKey = null;
map.on('mousemove', e => {
  if (hoverT) return; hoverT = setTimeout(() => { hoverT = 0; }, 40);
  const h = life.hit(e.point.x, e.point.y, true); const canvas = map.getCanvas();
  canvas.style.cursor = h ? 'pointer' : S.mode === 'ping' || S.mode === 'place' || life.inScan(map.unproject(e.point).lat, map.unproject(e.point).lng) ? '' : 'crosshair';
  const key = h ? (h.kind === 'node' ? 'n:' + h.key : h.kind === 'cell' ? 'c:' + h.id : h.kind === 'sig' ? 's:' + h.key : null) : null;
  if (key !== hoverKey) { hoverKey = key; life.hover(h && key ? h : null); }
});
map.getCanvas().addEventListener('mouseleave', () => { hoverKey = null; life.hover(null); });
/* the right button joins: in an open life a knot is joined or let go, another life is brought in and joined, the life itself plays;
   with nothing open it opens what is under it. It never makes a record: holding the left button down does that */
let lastTouch = 0;
map.on('contextmenu', e => {
  e.preventDefault(); if (performance.now() - lastTouch < 900) return;
  if (S.mode === 'place') { cancelPlace(); return; }
  const h = life.hit(e.point.x, e.point.y, true);
  /* on open ground the right button backs out: whatever is open closes and the radar carries on */
  if (!h || h.kind === 'zoom') { if (S.mode) { tick(900); closeRecord(); } return; }
  if (S.mode === 'ping') { if (h.kind === 'node') strings.join(h.key); else if (h.kind === 'cell') { if (h.id === S.sel) strings.playOpen(); else strings.join('x:' + h.id); } return; }
  if (h.kind === 'cell') select(h.id); else if (h.kind === 'tribe') selectTribe(h.id); else if (h.kind === 'sig') openSignal(h.key);
});
/* on a phone a long press on a knot is the right button: it joins at once, or lets go */
let knotT = 0, knotPt = null, knotHeld = false;
map.on('touchstart', e => {
  lastTouch = performance.now(); clearTimeout(knotT); knotPt = null;
  if (S.mode !== 'ping' || (e.points && e.points.length > 1)) return;
  const h = life.hit(e.point.x, e.point.y, true); if (!h || (h.kind !== 'node' && h.kind !== 'cell')) return;
  knotPt = e.point; knotT = setTimeout(() => { if (!knotPt) return; knotPt = null; knotHeld = true; buzz(10); if (h.kind === 'node') strings.join(h.key); else if (h.id === S.sel) strings.playOpen(); else strings.join('x:' + h.id); }, 480);
});
map.on('touchmove', e => { if (knotPt && (!e.point || Math.hypot(e.point.x - knotPt.x, e.point.y - knotPt.y) > 8)) { clearTimeout(knotT); knotPt = null; } });
map.on('touchend', () => { clearTimeout(knotT); knotPt = null; if (knotHeld) setTimeout(() => { knotHeld = false; }, 450); });
map.on('dragstart', () => { clearTimeout(knotT); knotPt = null; });

/* ───────── City of Melbourne: drinking water and air temperature now, on a hot day ───────── */
const overlayState = {};
const geoOf = r => { for (const k of ['geo_point_2d', 'latlong', 'location', 'lat_long', 'coordinates', 'geolocation']) { const g = r[k]; if (g && typeof g === 'object' && (g.lat != null || g.latitude != null)) return [+(g.lon ?? g.longitude ?? g.lng), +(g.lat ?? g.latitude)]; } if (r.latitude != null && r.longitude != null) return [+r.longitude, +r.latitude]; if (r.lat != null && (r.lon != null || r.lng != null)) return [+(r.lon ?? r.lng), +r.lat]; return null; };
async function loadOverlays() {
  if (overlayState.started) return; overlayState.started = true;
  await Promise.all((CONFIG.OVERLAYS || []).map(async ov => {
    try {
      const url = `${CONFIG.OVERLAY_API}${ov.dataset}/${ov.kind === 'temp' ? `records?${ov.query || 'limit=100'}` : 'exports/geojson?limit=-1'}`;
      let j = await (await fetch(url)).json(); let n = 0;
      if (ov.kind === 'temp' && !(j.results || []).length && ov.query) j = await (await fetch(`${CONFIG.OVERLAY_API}${ov.dataset}/records?limit=100`)).json();
      if (ov.kind === 'temp') {
        const seen = new Set();
        for (const r of j.results || []) {
          const g = geoOf(r); if (!g || !inBox(g[1], g[0])) continue; const dev = r.device_id || r.devid || r.sensor_id || r.site_id || `${g[0].toFixed(4)},${g[1].toFixed(4)}`; if (seen.has(dev)) continue;
          const tk = Object.keys(r).find(k => /temp/i.test(k) && Number.isFinite(+r[k]) && r[k] !== null); if (!tk) continue; seen.add(dev);
          S.sensors.push({ lng: g[0], lat: g[1], t: +r[tk] }); n++;
        }
      } else {
        for (const f of j.features || []) { const g = f.geometry; if (!g || g.type !== 'Point') continue; const [lng, lat] = g.coordinates; if (!inBox(lat, lng)) continue; S.fountains.push({ lat, lng }); n++; }
      }
      overlayState[ov.id] = n ? `${n}` : 'empty';
    } catch (e) { overlayState[ov.id] = 'unavailable'; }
  }));
  life.data();
}


/* ════════════════════════════════════════════════════════════════════
   THE RADAR — the map holds nothing until the radar has looked. A slow hand sweeps the pinned circle and each life
   it passes appears and stays while the radar stays. Outside it only what cannot wait is shown: an animal hurt,
   dead or lost, a life in extreme danger, a threatened one, and the five in greatest need.
   Open a cell and the sweep stops: its own radius opens, and everything inside it becomes a knot for a string.
   Two canvases over the photograph: the ground (the radar's mask, ticks and patches) and the marks.
   ════════════════════════════════════════════════════════════════════ */
const nameOf = o => {
  if (!o) return ''; const sub = subjectOf(o); const d = (o.ev && o.ev.data) || {};
  if (o.isEvent || o.comm || (o.user && o.hum && o.title)) return o.title;
  if (sub.tx) return sub.tx.cn || sub.tx.n;
  return d.text || o.title || (o.hum ? 'People' : SCALES[bandOf(o)].label.split(' · ')[0]);
};
const isAlarm = o => !!o && (o.kind === 'injured' || o.kind === 'lost' || o.kind === 'dead');
const codeOf = o => (typeof o.id === 'number' ? toCode(o.id) : o.comm ? o.hid : o.user ? toCode(String(o.ev.key).slice(-6)) : o.hero ? 'H·' + o.hero.toUpperCase() : String(o.id).toUpperCase());
const hashOf = o => (typeof o.id === 'number' ? toCode(o.id) : o.comm ? o.hid : o.user ? 'U' + o.ev.key : o.isTribe ? o.tid : '');
/* a point a distance and a bearing away: flat, which holds well inside a few kilometres */
const KY = 110540;
const dest = (lat, lng, d, brg) => { const r = brg * Math.PI / 180; return [lat + d * Math.cos(r) / KY, lng + d * Math.sin(r) / (111320 * Math.cos(lat * Math.PI / 180))]; };
const life = (() => {
  const make = cls => { const c = document.createElement('canvas'); c.className = cls; c.setAttribute('aria-hidden', 'true'); return c; };
  const baseCv = make('life'), fxCv = make('life fx');
  let bx = null, fx = null, W = 0, H = 0, dpr = 1, items = [], movers = [], bins = [], curD = 0;
  let dirty = true, fxDirty = true, raf = 0, lastFx = 0, hoverH = null;
  const tagEl = $('#tag'), handle = $('#radius'), knob = $('#knob'), ringK = $('#ring');
  let selT = 0, dragging = false, ringPts = [], cellPts = [];
  const audio = new Audio(); audio.preload = 'none'; let playing = '';
  const TAU = Math.PI * 2, SC = Object.assign({ min: 250, max: 1500, turn: 8 }, CONFIG.SCAN || {});
  /* the sweep, as a bearing; what it has found, and when */
  let sweepB = 0, lastSweep = 0; const seen = new Map(); let songFx = [];
  /* the centre, pressed: every string inside the radar played as a song */
  let singT = 0;
  function song() { songFx = strings.song(); fxDirty = true; if (!songFx.length) { tick(700); return; } const end = Math.max(...songFx.map(n => n.at)) - performance.now() + 500; knob.classList.add('sing'); clearTimeout(singT); singT = setTimeout(() => knob.classList.remove('sing'), end); }
  function resize() {
    if (!bx) return; const c = map.getContainer(); dpr = Math.min(2, devicePixelRatio || 1); W = c.clientWidth; H = c.clientHeight;
    for (const cv of [baseCv, fxCv]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = `${W}px`; cv.style.height = `${H}px`; }
    dirty = true;
  }
  function start() {
    const host = map.getCanvas().parentNode; host.appendChild(baseCv); host.appendChild(fxCv);
    bx = baseCv.getContext('2d'); fx = fxCv.getContext('2d'); resize(); data();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  /* ───────── what each record is: the thing itself, in the shape of its kind of record ───────── */
  const zoomNow = () => (S.mapReady ? map.getZoom() : 14);
  /* icons are half size from afar and full size close in: the ground asks to be approached */
  const kzAt = z => clamp(0.5 + (z - 13.2) * 0.25, 0.5, 1);
  const sizeAt = (z = zoomNow()) => Math.max(8, Math.round(clamp(16 + (z - 12.5) * 4, 16, 28) * kzAt(z) / 2) * 2);
  const PLACE_TONE = { flora: 'flora', injured: 'injured', dead: 'dead', lost: 'lost', need: 'need', offer: 'offer', event: 'event' };
  const PLACE_ICON = { need: 'plus', offer: 'give', event: 'people', injured: 'injured', dead: 'harm' };
  const PLANT_Z = 15.4;   /* plants show only close up, and small */
  function badgeOf(o, d0) {
    const d = d0 || sizeAt();
    if (o.id === 'place') {
      const k = PLACE_KINDS[o.kind] || PLACE_KINDS[0]; const g = placeGlyph(o);
      return { tone: k.f === 'fauna' ? M.toneOf(g) : PLACE_TONE[k.f] || 'k-other', g, i: g ? null : PLACE_ICON[k.f] || 'plus', d: Math.max(d, 18) + 6 };
    }
    if (o.hero) { const deg = degOf(o); return { tone: M.toneOf(glyphOf(o)), g: glyphOf(o), d: d + Math.round(d * 0.5), dz: deg >= 3 ? deg : 0, sig: !!o.tx.th, hero: true }; }
    if (o.hist) return { tone: 'hist', d: Math.max(6, Math.round(d * 0.42)) };
    if (o.kind === 'injured') return { tone: 'injured', g: o.tx || o.g ? glyphOf(o) : null, i: o.tx || o.g ? null : 'injured', d: d + 4 };
    if (o.kind === 'dead') return { tone: 'dead', g: o.tx || o.g ? glyphOf(o) : null, i: o.tx || o.g ? null : 'harm', d: d + 2 };
    if (o.kind === 'lost') return { tone: 'lost', g: o.tx || o.g ? glyphOf(o) : 'paw', d: d + 4 };
    if (o.hum) {
      const k = o.kind; const gig = isGig(o); const i = gig ? 'hug' : o.i || (k === 'event' ? ((o.tags || []).includes('sound') ? 'sound' : 'people') : k === 'offer' ? 'give' : k === 'pulse' ? 'people' : k === 'refuge' ? 'refuge' : 'plus');
      if (gig) return { tone: 'event', g: null, i, d: d + 2 };
      return { tone: k === 'event' ? 'event' : k === 'offer' || k === 'pulse' ? 'offer' : 'need', g: o.g || null, i: o.g ? null : i, d, fresh: !!(o.user && Date.now() - o.at < 864e5) };
    }
    const sub = subjectOf(o); const g = glyphOf(o); const flora = ['Plantae', 'Fungi'].includes(kindOf(sub)) || bandOf(o) === 5 || g === 'plant' || g === 'fungi';
    if (isCold(o)) return { tone: 'cold', g, d: Math.max(8, Math.round(d * 0.64)) };
    const deg = degOf(o);
    const fresh = !!(o.isNew || (o.arrived && Date.now() - o.arrived < 7 * 864e5) || (o.user && Date.now() - o.at < 864e5));
    if (flora) return { tone: 'flora', g, d: Math.max(8, Math.round(d * 0.55)), sig: !!(sub.tx && sub.tx.th), dz: deg >= 3 ? deg : 0 };
    return { tone: M.toneOf(g), g, d: d + (o.user ? 2 : 0) + (deg >= 3 ? 2 : 0), sig: !!(sub.tx && sub.tx.th), fresh, n: o.n > 1 ? o.n : 0, dz: deg >= 3 ? deg : 0 };
  }
  /* the kind of life a record being placed will carry: the one chosen, else the one the words name, else any animal */
  function placeGlyph(p) { const k = PLACE_KINDS[p.kind] || PLACE_KINDS[0]; if (p.g) return p.g; if (p.tx) return glyphOf(p); if (k.f === 'flora') return 'plant'; return ['fauna', 'injured', 'dead', 'lost'].includes(k.f) ? 'paw' : null; }
  /* how far to search for an animal lost: a dog runs, a cat hides close */
  const searchOf = o => o.search || ({ dog: 900, cat: 350 }[glyphOf(o)] || 500);
  const MOVING = new Set(['k-bird', 'k-mammal', 'k-insect', 'k-spider', 'k-reptile', 'k-water', 'k-other']);
  function data() {
    if (!bx) return; items = []; const now = Date.now(); curD = sizeAt();
    for (const o of [...S.hist, ...S.obs.filter(x => !x.ob), ...S.user.filter(liveEvent), ...S.community.filter(liveEvent), ...S.heroes]) {
      if (hiddenCell(o.id)) continue;
      const b = badgeOf(o, curD); const r0 = seeded(`${o.id}|${WEEK}`);
      const it = { o, b, lng: o.lng, lat: o.lat, x: 0, y: 0, dx: 0, dy: 0, phase: r0(), pulse: 0, pc: null, radar: 0, moving: false, hero: !!o.hero, sd: 0, sb: 0, inS: false };
      it.alarm = (o.kind === 'injured' && now - o.at < 12 * 3600e3) || (o.kind === 'dead' && now - o.at < 48 * 3600e3) || (o.kind === 'lost' && now - o.at < 72 * 3600e3);
      /* what deserves to be seen outside the radar: hurt, dead or lost now; extreme danger; threatened; the five; what this device just placed */
      const quiet = b.tone === 'hist' || b.tone === 'cold' || b.tone === 'flora';
      it.flag = it.alarm || it.hero || (!quiet && (b.dz >= 4 || !!(o.tx && o.tx.th && !o.hum))) || !!(o.user && now - o.at < 864e5);
      items.push(it);
    }
    for (const it of items) {
      const o = it.o;
      if (o.kind === 'injured' && it.alarm) { it.pulse = 3; it.pc = C.red; }
      else if (o.kind === 'lost' && it.alarm) { it.pulse = 2; it.pc = C.red; it.radar = searchOf(o); }
      else if (o.arrived && now - o.arrived < 5 * 60e3) { it.pulse = 2; it.pc = C.red; }
    }
    /* the lives in extreme danger in the months ahead keep a slow orange ring */
    items.filter(it => !it.pulse && !it.o.hum && it.b.dz >= 4).sort((a, b) => (b.hero - a.hero) || ((b.o.rare || 0) - (a.o.rare || 0))).slice(0, 4).forEach(it => { it.pulse = 1; it.pc = C.orange; });
    for (const it of items) it.moving = !reduced() && (it.hero || (MOVING.has(it.b.tone) && !M.STILL.has(it.b.g)));
    const rank = it => (it.b.tone === 'hist' ? 0 : it.b.tone === 'cold' ? 1 : it.b.tone === 'flora' ? 1.5 : it.hero ? 7 : it.moving ? 4 : it.pulse || it.radar ? 6 : 3);
    items.sort((a, b) => rank(a) - rank(b));
    movers = items.filter(it => it.moving || it.pulse || it.radar);
    scanGeo(); if (reduced()) revealAll();
    dirty = true; fxDirty = true;
  }

  /* ───────── the radar ───────── */
  const inScan = (lat, lng) => haversine(S.scan.lat, S.scan.lng, lat, lng) <= S.scan.r;
  function scanGeo() {
    for (const it of items) { it.sd = haversine(S.scan.lat, S.scan.lng, it.lat, it.lng); it.sb = bearing(S.scan.lat, S.scan.lng, it.lat, it.lng); it.inS = it.sd <= S.scan.r; if (!it.inS) seen.delete(it.o.id); }
  }
  function revealAll() { const t = performance.now() - 2000; for (const it of items) if (it.inS && !seen.has(it.o.id)) seen.set(it.o.id, t); }
  const paused = () => !!S.mode || document.hidden;
  const running = () => !reduced() && !paused();
  /* the hand moves on; whatever lies between where it was and where it is now is found */
  function sweep(now) {
    const dt = lastSweep ? Math.min(0.12, (now - lastSweep) / 1000) : 0; lastSweep = now;
    if (reduced()) { revealAll(); return; }
    if (!running() || !dt) return;
    const b0 = sweepB, b1 = sweepB + 360 * dt / SC.turn; sweepB = b1 % 360;
    for (const it of items) {
      if (!it.inS || seen.has(it.o.id)) continue;
      let a = it.sb; if (a < b0) a += 360; if (a > b0 && a <= b1) { seen.set(it.o.id, now); if (!it.o.hist && it.b.tone !== 'cold') snd.blip(it.b.dz >= 3 ? 0.9 : it.b.tone === 'flora' ? 0.1 : 0.45); }
    }
  }
  let scanSave = 0;
  function setScan(lat, lng, r, save) {
    if (lat != null) { S.scan.lat = clamp(lat, B.s, B.n); S.scan.lng = clamp(lng, B.w, B.e); }
    if (r != null) S.scan.r = Math.round(clamp(r, SC.min, SC.max) / 10) * 10;
    scanGeo(); dirty = true; fxDirty = true; placeKnobs();
    if (save) { clearTimeout(scanSave); scanSave = setTimeout(() => { prefs.scan = { lat: +S.scan.lat.toFixed(5), lng: +S.scan.lng.toFixed(5), r: S.scan.r }; savePrefs(); }, 250); }
  }
  /* the radar glides to a new place: the hand keeps sweeping as it goes */
  let glide = 0;
  function moveScan(lat, lng, anim) {
    if (!inBox(lat, lng)) { tick(600); return; }
    cancelAnimationFrame(glide); const a = { lat: S.scan.lat, lng: S.scan.lng }; const t0 = performance.now(); const dur = anim && !reduced() ? 520 : 0;
    snd.tick(700); buzz(6);
    const step = now => { const k = dur ? Math.min(1, (now - t0) / dur) : 1; const e = 1 - Math.pow(1 - k, 3); setScan(a.lat + (lat - a.lat) * e, a.lng + (lng - a.lng) * e, null, k >= 1); if (k < 1) glide = requestAnimationFrame(step); else snd.tick(1100); };
    glide = requestAnimationFrame(step);
  }

  /* ───────── where everything is on the screen ───────── */
  const metresPerPixel = lat => metresPerPx(lat, map.getZoom());
  const ringOf = (lat, lng, r, n = 72) => { const pts = []; for (let i = 0; i < n; i++) { const [a, b] = dest(lat, lng, r, (i / n) * 360); const p = map.project([b, a]); pts.push([p.x, p.y]); } return pts; };
  const selected = () => (S.mode === 'ping' ? S.byId.get(S.sel) : S.mode === 'place' ? S.place : null);
  function project() {
    const d = sizeAt(); if (d !== curD) { curD = d; for (const it of items) it.b = badgeOf(it.o, d); }
    for (const it of items) { const p = map.project([it.lng, it.lat]); it.x = p.x; it.y = p.y; }
    for (const s of S.sensors) { const p = map.project([s.lng, s.lat]); s.x = p.x; s.y = p.y; }
    for (const f of S.fountains) { const p = map.project([f.lng, f.lat]); f.x = p.x; f.y = p.y; }
    ringPts = ringOf(S.scan.lat, S.scan.lng, S.scan.r);
    const o = selected(); cellPts = o ? ringOf(o.lat, o.lng, rangeOf(o)) : [];
    cluster(); if (hoverH) placeTag(); placeHandle(); placeKnobs(); strings.place();
  }
  const zoomQuiet = () => zoomNow() < 14.2;
  /* what the ground shows, item by item */
  function shown(it) {
    const o = it.o; if (S.mode === 'ping' && o.id === S.sel) return false;
    if (S.mode === 'ping' && strings.lifeNode(o.id)) return true;
    const found = it.inS && seen.has(o.id); const z = zoomNow();
    if (it.b.tone === 'hist') return found && z >= 14;
    if (it.b.tone === 'flora') return found && z >= PLANT_Z;
    return it.flag || found;
  }
  /* density: at a distance, quiet records that share a place become one stack, showing the kind seen most */
  function cluster() {
    bins = []; if (!zoomQuiet()) { for (const it of items) it.binned = false; return; }
    const G = curD + 10, m = new Map();
    for (const it of items) {
      it.binned = false; if (!shown(it) || it.flag || it.pulse || it.b.tone === 'hist' || it.o.hum || (S.mode === 'ping' && strings.lifeNode(it.o.id))) continue;
      const k = `${Math.floor(it.x / G)},${Math.floor(it.y / G)}`; if (!m.has(k)) m.set(k, []); m.get(k).push(it);
    }
    for (const list of m.values()) {
      if (list.length < 3) continue; let x = 0, y = 0; const count = new Map();
      for (const it of list) { x += it.x; y += it.y; it.binned = true; const key = `${it.b.g}|${it.b.tone}`; count.set(key, (count.get(key) || 0) + 1); }
      const [g, tone] = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0].split('|');
      bins.push({ x: x / list.length, y: y / list.length, n: list.length, b: { g, tone: tone === 'cold' ? M.toneOf(g) : tone, d: curD + 2, n: 3 } });
    }
  }

  /* ───────── the ground layer: the radar's mask and ticks, the patches it holds, water and heat on a hot day ───────── */
  const off = (x, y, m = 50) => x < -m || y < -m || x > W + m || y > H + m;
  const poly = (ctx, pts) => { pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
  function frameLine(ctx) {
    const c = [[B.w, B.n], [B.e, B.n], [B.e, B.s], [B.w, B.s]].map(p => map.project(p));
    ctx.save(); ctx.beginPath(); c.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.setLineDash([1, 3]); ctx.stroke(); ctx.restore();
  }
  /* patches on the ground, each an uneven round, the same shape every time it is drawn */
  function blob(ctx, x, y, r, seed) {
    const n = 18, pt = i => { const a = (i / n) * TAU; const k = 1 + 0.15 * Math.sin(a * 3 + seed) + 0.07 * Math.sin(a * 5 + seed * 1.7); return [x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]; };
    const P = Array.from({ length: n }, (_, i) => pt(i)); const mid = i => { const a = P[i % n], b = P[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    const m0 = mid(n - 1); ctx.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const m = mid(i); ctx.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); } ctx.closePath();
  }
  function patch(ctx, blobs, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
    for (const [la, ln, r] of blobs) { const p = map.project([ln, la]); const rp = r / metresPerPixel(la); if (off(p.x, p.y, rp * 1.3)) continue; blob(ctx, p.x, p.y, rp, ((la * 7919 + ln * 104729) % TAU + TAU) % TAU); }
    ctx.fill(); ctx.restore();
  }
  function drawBase() {
    const ctx = bx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    frameLine(ctx);
    const cellOpen = S.mode === 'ping' && cellPts.length;
    /* nothing outside is darkened: an alert anywhere stays as clear as the ground. Inside, a faint light marks where the radar
       or an open cell looks; a signal's figure is ringed */
    const sig = S.mode === 'sig' && S.signals.find(x => x.key === S.sig); const sigPts = sig && sig.pin ? ringOf(sig.pin.lat, sig.pin.lng, Math.max(260, ...(sig.nodes || []).map(n => n.d + 90))) : null;
    const lit = cellOpen ? cellPts : sigPts || (S.mode === 'tribe' ? null : ringPts);
    if (lit) { ctx.save(); ctx.beginPath(); poly(ctx, lit); ctx.fillStyle = cellOpen || sigPts ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)'; ctx.fill(); ctx.restore(); }
    if (sigPts) { ctx.save(); ctx.beginPath(); poly(ctx, sigPts); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
    /* the groups' ground shows only inside an open cell, while its strings are being made; a group chosen shows whole */
    if (cellOpen || S.mode === 'tribe') {
      ctx.save(); if (cellOpen) { ctx.beginPath(); poly(ctx, cellPts); ctx.clip(); }
      for (const t of S.tribes) { const sel = S.tribeSel === t.id; if (S.mode === 'tribe' && !sel) continue; patch(ctx, t.blobs, C.tribe[t.kind] || C.tribe.park, sel ? 0.5 : 0.22); }
      ctx.restore();
    }
    /* a hero chosen: the ground it is known from */
    const h = S.mode === 'ping' && S.byId.get(S.sel); if (h && h.hero) patch(ctx, h.home.map(([a, b]) => [a, b, 170]), C.kind[M.GROUP[glyphOf(h)]] || C.kind.other, 0.3);
    /* the radar's rim: a hairline with a tick every ten degrees, longer every thirty, a notch at north */
    if (ringPts.length) {
      const cp = map.project([S.scan.lng, S.scan.lat]);
      const quiet = cellOpen || !!sigPts || S.mode === 'tribe'; ctx.save(); ctx.globalAlpha = quiet ? 0.35 : 1; ctx.beginPath(); poly(ctx, ringPts); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.1; if (quiet) ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath();
      for (let i = 0; i < 72; i += 2) { const [x, y] = ringPts[i]; const dx = cp.x - x, dy = cp.y - y, L = Math.hypot(dx, dy) || 1; const k = i % 6 === 0 ? 9 : 4; ctx.moveTo(x, y); ctx.lineTo(x + dx / L * k, y + dy / L * k); }
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 1.2; ctx.stroke();
      const [nx, ny] = ringPts[0]; const ux = (nx - cp.x) / (Math.hypot(nx - cp.x, ny - cp.y) || 1), uy = (ny - cp.y) / (Math.hypot(nx - cp.x, ny - cp.y) || 1);
      ctx.beginPath(); ctx.moveTo(nx + ux * 9, ny + uy * 9); ctx.lineTo(nx + ux * 2 - uy * 4, ny + uy * 2 + ux * 4); ctx.lineTo(nx + ux * 2 + uy * 4, ny + uy * 2 - ux * 4); ctx.closePath(); ctx.fillStyle = C.white; ctx.fill();
      ctx.restore();
    }
    /* on a hot day, inside the radar: drinking water, and the air temperature now */
    if ((S.wx.tmax || 0) >= HEAT.hot) {
      for (const f of S.fountains) { if (f.x == null || !inScan(f.lat, f.lng)) continue; ctx.save(); ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.restore(); M.icon(ctx, 'water', f.x, f.y, 10, C.cobalt); }
      for (const s of S.sensors) {
        if (s.x == null || !inScan(s.lat, s.lng)) continue; const txt = `${s.t.toFixed(1)}°`; ctx.save(); ctx.font = '500 10px "IBM Plex Mono", monospace'; const w = ctx.measureText(txt).width + 8;
        ctx.fillStyle = s.t >= HEAT.hot ? C.orange : C.white; ctx.fillRect(s.x - w / 2, s.y - 7, w, 14); ctx.fillStyle = C.navy; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, s.x, s.y + 0.5); ctx.restore();
      }
    }
  }

  /* ───────── the marks layer ───────── */
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const back = k => { k = clamp(k, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function drawItem(ctx, it, m, a = 1, k = 1) {
    const sp = M.badgeSprite(it.b, dpr); const x = it.x + (m ? m.dx : 0), y = it.y + (m ? m.dy : 0);
    if (m && m.thread) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(it.x, it.y - it.b.d * 1.7); ctx.lineTo(x, y - it.b.d / 2); ctx.stroke(); ctx.restore(); }
    ctx.globalAlpha = a;
    if ((m && (m.rot || m.sx !== 1)) || k !== 1) { ctx.save(); ctx.translate(x, y); if (m) { ctx.rotate(m.rot || 0); ctx.scale(m.sx || 1, 1); } ctx.scale(k, k); ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore(); }
    else ctx.drawImage(sp.cv, x - sp.size / 2, y - sp.size / 2, sp.size, sp.size);
    ctx.globalAlpha = 1;
  }
  /* the hand and its wake, drawn on the ground */
  function hand(ctx) {
    const c = map.project([S.scan.lng, S.scan.lat]); const at = b => { const [la, ln] = dest(S.scan.lat, S.scan.lng, S.scan.r, b); return map.project([ln, la]); };
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const b1 = sweepB - i * 3, b0 = b1 - 3; const p0 = at(b0), p1 = at((b0 + b1) / 2), p2 = at(b1);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath();
      ctx.fillStyle = `rgba(190,245,238,${(0.17 * Math.pow(1 - i / 14, 1.7)).toFixed(3)})`; ctx.fill();
    }
    const tip = at(sweepB); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(tip.x, tip.y); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }
  /* the cell chosen: a point becomes a line, the line a boundary, and the boundary holds the knots */
  function selection(ctx, now) {
    const o = selected(); if (!o) return;
    const p0 = map.project([o.lng, o.lat]); const x = p0.x, y = p0.y;
    const e = reduced() ? 9999 : now - selT; const kA = ease(e / 200), kB = ease((e - 120) / 480);
    if (cellPts.length && kB > 0) {
      const n = Math.max(2, Math.round(cellPts.length * kB));
      ctx.save(); ctx.beginPath(); for (let i = 0; i <= n; i++) { const [px, py] = cellPts[i % cellPts.length]; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.strokeStyle = C.white; ctx.lineWidth = dragging ? 2.4 : 1.5; ctx.stroke(); ctx.restore();
    }
    if (S.mode === 'ping') strings.draw(ctx, now, e);
    const it = items.find(z => z.o === o); const b = it ? it.b : badgeOf(o);
    const big = Math.round((b.tone === 'hist' || b.tone === 'cold' ? Math.max(curD, 18) : Math.max(b.d, 20)) * (1 + 0.36 * kA));
    M.badge(ctx, { ...b, a: 1, d: big, tone: b.tone === 'hist' || b.tone === 'cold' ? M.toneOf(glyphOf(o)) : b.tone, g: b.g || (b.tone === 'hist' ? glyphOf(o) : null) }, x, y);
    if (S.mode === 'ping') strings.knotAt(ctx, 'pin', x, y, big / 2, now);
  }
  function drawFx(now) {
    const ctx = fx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const t = now / 1000, still = reduced(); const amp = clamp((zoomNow() - 12) / 3, 0.35, 1); const cellOpen = S.mode === 'ping';
    /* a lost animal's search area, when search areas are on */
    if (prefs.areas && S.mode !== 'tribe') for (const it of movers) { if (!it.radar || !shown(it)) continue; const R = it.radar / metresPerPixel(it.lat); if (off(it.x, it.y, R)) continue; M.radar(ctx, it.x, it.y, R, still ? 0 : t, it.phase); }
    if (!cellOpen && S.mode !== 'place' && !still) hand(ctx);
    strings.drawSaved(ctx, now);
    for (const b of bins) { const sp = M.badgeSprite(b.b, dpr); ctx.drawImage(sp.cv, b.x - sp.size / 2, b.y - sp.size / 2, sp.size, sp.size); }
    for (const it of items) {
      if (it.binned || !shown(it) || off(it.x, it.y)) continue;
      const node = cellOpen && strings.lifeNode(it.o.id); const a = it.alarm ? 1 : cellOpen && !node ? 0.45 : S.mode === 'tribe' || S.mode === 'sig' ? 0.55 : 1;
      if (it.pulse && !still && a === 1) M.pulse(ctx, { pulse: it.pulse, pc: it.pc, r: it.b.d / 2 - 2, f: 'fauna' }, it.x, it.y, t, it.phase);
      let m = null; if (it.moving && !still) { m = it.hero ? M.heroMotion(it.o.heroOf.move, t, it.phase, amp) : M.motion(it.b.g, t, it.phase, amp); it.dx = m.dx; it.dy = m.dy; } else { it.dx = 0; it.dy = 0; }
      /* found by the sweep: it arrives with a small overshoot and a ring that leaves it */
      const rv = seen.get(it.o.id); const age = rv != null && !it.flag ? now - rv : 9999; const k = age < 420 ? back(age / 420) : 1;
      if (age < 700 && !still) { const q = age / 700; ctx.save(); ctx.globalAlpha = (1 - q) * 0.9; ctx.beginPath(); ctx.arc(it.x, it.y, it.b.d / 2 + 2 + q * 16, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore(); }
      drawItem(ctx, it, m, a, k);
    }
    /* a song from the centre: each note lights where it was tied */
    for (const n of songFx) { const q = (now - n.at) / 700; if (q < 0 || q > 1) continue; const p = map.project([n.lng, n.lat]); ctx.save(); ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(p.x, p.y, 6 + q * 22, 0, TAU); ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
    if (S.view === 1 || S.mode === 'sig') sigPins(ctx, now);
    if (S.mode === 'sig') strings.drawSig(ctx, now);
    selection(ctx, now);
    if (hoverH && hoverH.kind === 'cell') { const it = items.find(z => z.o.id === hoverH.id); if (it && it.o.id !== S.sel && shown(it)) { ctx.save(); ctx.beginPath(); ctx.arc(it.x + it.dx, it.y + it.dy, it.b.d / 2 + 5, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); } }
    /* the record being placed breathes: one ring leaving it, until it is placed */
    if (S.mode === 'place' && S.place && !still) { const q = map.project([S.place.lng, S.place.lat]); const k = (now / 1400) % 1; ctx.save(); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(q.x, q.y, 14 + k * 26, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore(); }
    if (ghost) { const q = map.project([ghost.lng, ghost.lat]); const k = still ? 1 : back((now - ghost.t) / 300); M.badge(ctx, { tone: 'need', i: 'plus', d: Math.round(28 * k) || 1 }, q.x, q.y); }
  }
  /* signals on the ground: each a small receipt where its life was */
  function sigPins(ctx) {
    for (const s of S.signals) {
      const p = s.pin; if (!p || p.lat == null) continue; const q = map.project([p.lng, p.lat]); s._x = q.x; s._y = q.y; if (off(q.x, q.y)) continue;
      const on = S.mode === 'sig' && S.sig === s.key; M.badge(ctx, { tone: 'story', g: p.g || 'paw', d: Math.max(16, curD) + (on ? 10 : 2), carried: !s.ex, a: S.mode === 'sig' && !on ? 0.5 : 1 }, q.x, q.y);
    }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || !bx) { lastSweep = 0; return; }
    if (dirty) { dirty = false; project(); drawBase(); fxDirty = true; }
    sweep(now);
    const selecting = !!selT && !reduced() && now - selT < 1400;
    const animating = !reduced() && (running() || movers.length > 0 || selecting || S.mode === 'place' || !!ghost || strings.busy(now) || songFx.some(n => now - n.at < 800));
    if (fxDirty || (animating && now - lastFx >= 1000 / 30 - 2)) { fxDirty = false; lastFx = now; drawFx(now); }
  }
  /* a touch on empty ground inside the radar offers a new record there */
  let ghost = null, ghostT = 0;
  function offer(ll) { ghost = ll ? { lat: ll.lat, lng: ll.lng, t: performance.now() } : null; clearTimeout(ghostT); if (ghost) ghostT = setTimeout(() => { ghost = null; fxDirty = true; }, 3500); fxDirty = true; }

  /* ───────── the radar's two handles: the centre moves it, the rim resizes it ───────── */
  function placeKnobs() {
    if (!S.mapReady || !knob) return; const hide = S.mode === 'ping' || S.mode === 'place';
    const c = map.project([S.scan.lng, S.scan.lat]); const [la, ln] = dest(S.scan.lat, S.scan.lng, S.scan.r, 90); const e = map.project([ln, la]);
    knob.hidden = hide || off(c.x, c.y, -6); ringK.hidden = hide || off(e.x, e.y, -6);
    knob.style.transform = `translate(${Math.round(c.x)}px, ${Math.round(c.y)}px)`; ringK.style.transform = `translate(${Math.round(e.x)}px, ${Math.round(e.y)}px)`;
    ringK.dataset.r = metres(S.scan.r);
  }
  const llAt = e => { const r = map.getContainer().getBoundingClientRect(); return map.unproject([e.clientX - r.left, e.clientY - r.top]); };
  let knobDrag = null;
  const grab = (el, kind) => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); knobDrag = { kind, id: e.pointerId, moved: false, x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); el.classList.add('on'); map.dragPan.disable(); snd.tick(1500); });
    el.addEventListener('pointermove', e => {
      if (!knobDrag || knobDrag.kind !== kind) return; if (!knobDrag.moved && Math.hypot(e.clientX - knobDrag.x, e.clientY - knobDrag.y) < 4) return; const ll = llAt(e); knobDrag.moved = true;
      if (kind === 'move') setScan(ll.lat, ll.lng, null, false);
      else { const r0 = S.scan.r; setScan(null, null, haversine(S.scan.lat, S.scan.lng, ll.lat, ll.lng), false); if (Math.abs(S.scan.r - r0) >= 50 || Math.floor(S.scan.r / 100) !== Math.floor(r0 / 100)) snd.tick(900 + S.scan.r / 2); }
    });
    const end = () => { if (!knobDrag || knobDrag.kind !== kind) return; const moved = knobDrag.moved; knobDrag = null; el.classList.remove('on'); map.dragPan.enable(); if (!moved && kind === 'move') { song(); return; } setScan(null, null, null, true); snd.tick(1100); buzz(6); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', e => {
      if (kind === 'move' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); song(); return; }
      const k = { ArrowUp: 0, ArrowRight: 90, ArrowDown: 180, ArrowLeft: 270 }[e.key]; if (k == null) return; e.preventDefault();
      if (kind === 'move') { const [la, ln] = dest(S.scan.lat, S.scan.lng, 60, k); setScan(la, ln, null, true); }
      else setScan(null, null, S.scan.r + (k === 0 || k === 90 ? 50 : -50), true);
      snd.tick(1200);
    });
  };
  if (knob) { grab(knob, 'move'); grab(ringK, 'size'); }

  /* ───────── a cell's own radius: drag the boundary; the knots inside change with it ───────── */
  function placeHandle() {
    const o = S.mode === 'ping' || S.mode === 'place' ? selected() : null;
    if (!o || !S.mapReady || o.ob || o.hist) { handle.hidden = true; return; }
    const [la, ln] = dest(o.lat, o.lng, rangeOf(o), 90); const p = map.project([ln, la]);
    if (off(p.x, p.y, -10)) { handle.hidden = true; return; }
    handle.hidden = false; handle.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`; handle.dataset.r = metres(rangeOf(o));
  }
  const commitRadius = debounce(() => { strings.refresh(); refreshRecord(); }, 140);
  handle.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); dragging = true; handle.setPointerCapture(e.pointerId); handle.classList.add('on'); map.dragPan.disable(); snd.tick(1500); });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return; const o = selected(); if (!o) return; const ll = llAt(e);
    const R = Math.round(clamp(haversine(o.lat, o.lng, ll.lat, ll.lng), CONFIG.RADIUS.min, CONFIG.RADIUS.max) / 10) * 10; const was = rangeOf(o);
    S.radius.set(o.id, R); if (Math.floor(R / 100) !== Math.floor(was / 100)) snd.tick(900 + R / 2); placeHandle(); commitRadius(); dirty = true;
  });
  const endDrag = () => { if (!dragging) return; dragging = false; handle.classList.remove('on'); map.dragPan.enable(); strings.refresh(); refreshRecord(); dirty = true; buzz(6); snd.tick(1100); };
  handle.addEventListener('pointerup', endDrag); handle.addEventListener('pointercancel', endDrag);
  handle.addEventListener('keydown', e => { const o = selected(); if (!o) return; const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 25 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -25 : 0; if (!d) return; e.preventDefault(); S.radius.set(o.id, clamp(rangeOf(o) + d, CONFIG.RADIUS.min, CONFIG.RADIUS.max)); placeHandle(); commitRadius(); dirty = true; });

  /* ───────── hit-testing where things are drawn, moving ones where they have moved to ───────── */
  function hit(x, y, peek) {
    const slack = coarse() ? 10 : 5; let best = null;
    const consider = (d, h) => { if (d <= slack && (!best || d < best.d)) best = { ...h, d }; };
    if (ghost) { const q = map.project([ghost.lng, ghost.lat]); if (Math.hypot(q.x - x, q.y - y) < 20) return { kind: 'new', lat: ghost.lat, lng: ghost.lng, d: 0 }; }
    if (S.mode === 'ping') { const n = strings.hit(x, y, slack); if (n) return n; }
    if (S.view === 1 || S.mode === 'sig') for (const s of S.signals) if (s._x != null) consider(Math.hypot(s._x - x, s._y - y) - 9, { kind: 'sig', key: s.key });
    for (const b of bins) if (Math.abs(b.x - x) < b.b.d / 2 + 4 && Math.abs(b.y - y) < b.b.d / 2 + 4) { if (!peek) { map.easeTo({ center: map.unproject([b.x, b.y]), zoom: map.getZoom() + 1.6, duration: reduced() ? 0 : 500 }); tick(1600); } return { kind: 'zoom', d: 0 }; }
    for (const it of items) { if (it.binned || !shown(it) || off(it.x, it.y)) continue; const d = Math.hypot(it.x + it.dx - x, it.y + it.dy - y) - it.b.d / 2; consider(d + (it.b.tone === 'hist' ? 3 : 0) + (S.mode === 'ping' ? 4 : 0), { kind: 'cell', id: it.o.id }); }
    if (!best && !peek && S.mode !== 'ping') { const ll = map.unproject([x, y]); const t = S.tribes.find(tr => (S.mode === 'tribe' || inScan(ll.lat, ll.lng)) && inTribe(tr, ll.lat, ll.lng)); if (t) return { kind: 'tribe', id: t.id, d: 0 }; }
    return best;
  }

  /* ───────── the tag: a name under the pointer, nothing more ───────── */
  function tagHTML(h) {
    if (h.kind === 'node') return strings.tagHTML(h.key);
    if (h.kind === 'sig') { const s = S.signals.find(x => x.key === h.key); return s ? `<span class="tx"><b class="mono">${esc(s.code)}${s.ex ? ' · EX' : ''}</b><small>${esc((s.lines || {}).h || '')}</small></span>` : ''; }
    const o = S.byId.get(h.id); if (!o) return ''; const sub = subjectOf(o);
    const ph = o.photo ? `<img src="${esc(o.photo)}" alt="">` : sub.ph && licOpen(sub.ph.l) ? `<img src="${esc(photoURL(sub.ph.u, 'small'))}" alt="">` : `<img src="${badgeImg(badgeOf(o, 40), 44)}" alt="">`;
    const voice = (sub.so && sub.so.u) || o.sound;
    const when = o.isEvent && o.start ? dayWord(o.start) : o.hist ? String(o.d).slice(0, 4) : o.at && (o.comm || o.user) ? fmtClock(o.at) : o.t ? fmtClock(o.t) : '';
    const w = !o.hum && !isCold(o) && !isAlarm(o) ? whenOf(o) : null; const dg = !o.hum && !isCold(o) ? degOf(o) : 0;
    return `${ph}<span class="tx"><b>${esc(nameOf(o))}</b>${when ? `<small>${esc(when)}</small>` : ''}${dg >= 2 ? `<small class="dg d${dg}">${DEG[dg]}${w ? ` · ${w.now ? 'NOW' : `${daysTo(w.start)} D`}` : ''}</small>` : ''}</span>${voice ? `<button type="button" class="play" data-u="${esc(voice)}" aria-label="Play the call">${icon(playing === voice && !audio.paused ? 'pause' : 'play')}</button>` : ''}${o.hero ? '' : `<button type="button" class="hide" data-hide="${esc(String(o.id))}" aria-label="${o.user ? 'Delete' : 'Hide'}" data-tip="${o.user ? 'Delete' : 'Hide from the map'}">${icon('hide', 'sm')}</button>`}`;
  }
  function placeTag() {
    let x0, y0;
    if (hoverH.kind === 'node') { const n = strings.pos(hoverH.key); if (!n) return; x0 = n.x; y0 = n.y; }
    else if (hoverH.kind === 'sig') { const s = S.signals.find(z => z.key === hoverH.key); if (!s || s._x == null) return; x0 = s._x; y0 = s._y; }
    else { const o = S.byId.get(hoverH.id); if (!o) return; const p = map.project([o.lng, o.lat]); x0 = p.x; y0 = p.y; }
    const w = tagEl.offsetWidth || 220, h = tagEl.offsetHeight || 60;
    let x = x0 + 18, y = y0 - h - 14; if (x + w > W - 8) x = x0 - w - 18; if (y < 8) y = y0 + 18; x = clamp(x, 8, Math.max(8, W - w - 8));
    tagEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
  let tagHide = 0;
  function hover(h) {
    if (h && hoverH && h.kind === hoverH.kind && h.id === hoverH.id && h.key === hoverH.key) return;
    fxDirty = true;
    if (h) { clearTimeout(tagHide); const html = tagHTML(h); if (!html) return; hoverH = h; tagEl.innerHTML = html; tagEl.classList.toggle('alarm', h.kind === 'cell' && isAlarm(S.byId.get(h.id))); tagEl.classList.toggle('node', h.kind === 'node'); tagEl.hidden = false; placeTag(); return; }
    clearTimeout(tagHide); tagHide = setTimeout(() => { if (!tagEl.matches(':hover')) { tagEl.hidden = true; hoverH = null; fxDirty = true; } }, 260);
  }
  /* the tag under the pointer, rewritten when what it names has changed */
  function retag() { if (!hoverH || tagEl.hidden) return; const html = tagHTML(hoverH); if (!html) { tagEl.hidden = true; hoverH = null; fxDirty = true; return; } tagEl.innerHTML = html; placeTag(); }
  tagEl.addEventListener('mouseleave', () => hover(null));
  /* the right button on a name joins it, as it does on the knot itself */
  tagEl.addEventListener('contextmenu', e => { if (!hoverH) return; e.preventDefault(); const h = hoverH; if (h.kind === 'node') strings.join(h.key); else if (h.kind === 'cell') { if (S.mode === 'ping' && h.id !== S.sel) strings.join('x:' + h.id); else if (!S.mode) select(h.id); } });
  tagEl.addEventListener('click', e => {
    const b = e.target.closest('.play'); if (b) { e.stopPropagation(); play(b.dataset.u, b); return; }
    const hd = e.target.closest('[data-hide]'); if (hd) { e.stopPropagation(); const v = hd.dataset.hide; tagEl.hidden = true; hoverH = null; hideCell(/^\d+$/.test(v) ? +v : v); return; }
    if (!hoverH) return; const h = hoverH; tagEl.hidden = true; hoverH = null;
    if (h.kind === 'cell') { if (S.mode === 'ping' && h.id !== S.sel) strings.peekOut(h.id); else select(h.id); } else if (h.kind === 'node') strings.tap(h.key); else if (h.kind === 'sig') openSignal(h.key);
  });
  function play(url, btn) {
    if (!prefs.sound) { toast('SOUND OFF'); return; }
    if (playing === url && !audio.paused) { audio.pause(); if (btn) btn.innerHTML = icon('play'); return; }
    playing = url; audio.src = url; audio.play().then(() => { if (btn) btn.innerHTML = icon('pause'); }).catch(() => toast('NO SOUND HERE'));
    audio.onended = () => { if (btn) btn.innerHTML = icon('play'); };
  }
  return {
    start, data, resize, moved: () => { dirty = true; }, redraw: () => { fxDirty = true; }, hover, retag, play, hit, badgeOf, offer, searchOf, blob, inScan, moveScan, setScan,
    select: () => { selT = performance.now(); ghost = null; dirty = true; fxDirty = true; }, placeHandle,
    seen: () => seen, reveal: revealAll, song, get sweep() { return sweepB; }, set sweep(v) { sweepB = v; },
    get items() { return items; }, get bins() { return bins; }, get movers() { return movers; }, shown,
  };
})();


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
const lab = (t, cls = '') => `<h3 class="lab ${cls}">${t}</h3>`;
/* a degree of danger, in orange; and how long until it lands */
const degChip = (deg, word = '') => (deg ? `<i class="dg d${deg}">${DEG[deg]}${word ? ` · ${word}` : ''}</i>` : '');
const whenChip = w => (w ? `<i class="wn${w.now ? ' now' : ''}" data-tip="${esc(w.why)}">${w.now ? 'NOW' : `${daysTo(w.start)} D`} · ${esc(w.w)}</i>` : '');
const row = (o, sub = '', right = '') => `<li><button type="button" class="row" data-id="${esc(String(o.id))}"><img class="pg" src="${pinOf(o)}" alt=""><span class="nm"><b>${esc(nameOf(o))}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="rt">${right}</span></button></li>`;
const elapsed = t => { const s = Math.max(0, Math.floor((Date.now() - t) / 1000)); const h = Math.floor(s / 3600); return h >= 48 ? `${Math.floor(h / 24)} D` : h >= 1 ? `${h} H ${pad2(Math.floor(s % 3600 / 60))}` : `${Math.floor(s / 60)} MIN`; };
const since = t => `<span class="cdn up mono" data-up="${t}">${elapsed(t)}</span>`;
/* right now: an animal hurt in the last twelve hours, found dead in the last two days, or lost in the last three */
const alarmsNow = () => { const now = Date.now(); const ord = { injured: 0, dead: 1, lost: 2 }; return [...S.community, ...S.user].filter(o => (o.kind === 'injured' && now - o.at < 12 * 3600e3) || (o.kind === 'dead' && now - o.at < 48 * 3600e3) || (o.kind === 'lost' && now - o.at < 72 * 3600e3)).sort((a, b) => ord[a.kind] - ord[b.kind] || b.at - a.at); };
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
  if (k === 'now') { bindOutlook(); if (S.open) startHeroes(); } else { stopHeroes(); bindStories(); }
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
const eventRow = o => { const gig = isGig(o); const src = gigOf(o); return row(o, [dayWord(o.start), o.start ? fmtClock(o.start) : '', ...(gig ? [`<span class="gig">${icon('hug', 'sm')}${src ? src.w : 'GIG'}</span>`] : [])].filter(Boolean).join(' · ')); };
function viewNow() {
  const nw = nextWindow(); const alarms = alarmsNow(); const k0 = S.mo, k1 = Math.min(OUT_N - 1, S.mo + 2);
  const events = [...S.community, ...S.user].filter(o => o.isEvent && liveEvent(o)).sort((a, b) => (isGig(b) - isGig(a)) || (a.start || 0) - (b.start || 0));
  const lvNow = outMonth(nowK()).lv;
  return `<section class="band" id="sec-heat">
      <div class="b-top"><span class="mono">${esc(CONFIG.ELNINO)}</span>${degChip(lvNow)}</div>
      ${nw ? `<div class="b-count" data-tip="${esc(nw.w.why)}"><b>${nw.now ? 'NOW' : daysTo(nw.start)}</b><span class="mono">${nw.now ? '' : 'DAYS TO<br>'}${esc(nw.w.w)}</span></div>` : ''}
      ${monthStrip()}
      <p class="b-span mono"><b>${monthsWord(outMonth(k0).m, outMonth(k1).m)}</b> · ${HORIZON[outMonth(k0).h]}</p>
      <a class="b-off mono" href="https://emergency.vic.gov.au" target="_blank" rel="noopener">VICEMERGENCY ${icon('out', 'sm')}</a>
    </section>`
    + (S.heroes.length ? `<section class="sec five" id="sec-five">${lab('Five in greatest need')}<ol class="hero-list">${heroesRanked().map(({ o, deg, w }) => `<li><button type="button" class="hero-row" data-id="${esc(o.id)}" data-tip="${esc(o.heroOf.why)}"><canvas class="hero-cv" width="128" height="128" data-hero="${esc(o.id)}" aria-hidden="true"></canvas><span class="nm"><b>${esc(o.heroOf.cn)}</b><span class="chips">${degChip(deg)}${whenChip(w)}</span></span></button></li>`).join('')}</ol></section>` : '')
    + (alarms.length ? `<section class="sec alarms" id="sec-alarms">${lab('Now', 'red')}<ol class="rows">${alarms.map(alarmRow).join('')}</ol></section>` : '')
    + consSection()
    + `<section class="sec" id="sec-gigs">${lab('Gigs')}${events.length ? `<ol class="rows">${events.map(eventRow).join('')}</ol>` : ''}<p class="gigs mono">${Object.values(GIGS).map(g => `<a href="${esc(g.url)}" target="_blank" rel="noopener" data-tip="${esc(g.n)}">${icon('hug', 'sm')}<span>${esc(g.w)}</span>${icon('out', 'sm')}</a>`).join('')}</p></section>`
    + `<section class="sec calls"><div class="calls2 mono"><a href="tel:000">000</a><a href="tel:0384007300" data-tip="Wildlife Victoria">WILDLIFE (03) 8400 7300</a><a href="tel:136186" data-tip="DEECA: flying-foxes in heat stress">136 186</a></div></section>`;
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
const sigRow = (s, i) => {
  const p = s.pin || {}; const kn = (s.edges || []).length;
  return `<li><button type="button" class="sig-row${s.ex ? ' ex' : ''}" data-sig="${esc(s.key)}"><span class="rk mono">${i + 1}</span><span class="sg"><span class="sg-t"><b class="mono">${esc(s.code)}</b>${esc((s.lines || {}).h || '')}</span><small class="mono">${esc((p.cn || p.n || '').toUpperCase())} · ${esc(p.place || '')} · ${ago(s.at)}${kn ? ` · ${kn} ${icon('string', 'sm')}` : ''}${s.recv ? ' · RECEIVED' : ''}${s.ex ? ' · EX' : ''}</small></span></button></li>`;
};
function viewStories() {
  const det = ['iNaturalist', 'Field list: sources in field.html', ...OUT.src.map(x => x[0]), 'Canopy: council urban forest strategies; cooling near 40% (Ziter et al., PNAS 2019)', 'City of Melbourne open data', `${IMG.attribution} · AWS Terrain Tiles`, 'OpenStreetMap', 'MapLibre · Poppins · IBM Plex Mono', CONFIG.COUNTRY];
  const sigs = S.signals;
  return `<section class="sec board" id="sec-signals"><div class="lab-row">${lab(`Signals · ${sigs.filter(s => !s.ex).length}`)}<button type="button" class="pill" id="rx-open" aria-expanded="false">${icon('receive', 'sm')}RECEIVE</button></div>`
      + `<form class="rx" id="rx" hidden><textarea id="rx-t" rows="3" aria-label="Signal" placeholder="DA-…" spellcheck="false"></textarea><button type="submit" class="ib" aria-label="Receive">${icon('check')}</button></form>`
      + `<ol class="sigs">${sigs.map(sigRow).join('')}</ol></section>`
    + `<section class="sec" id="sec-groups">${lab('Groups')}<ol class="rows tribes">${S.tribes.map(t => `<li><button type="button" class="row" data-tribe="${esc(t.id)}"><i class="patch" style="--c:${(C.tribe[t.kind] || C.tribe.park)}"></i><span class="nm"><b>${esc(t.n)}</b><small>${esc(t.w)}</small></span></button><a class="src" href="${esc(t.link)}" target="_blank" rel="noopener" aria-label="Their site">${icon('out', 'sm')}</a></li>`).join('')}</ol></section>`
    + `<section class="sec tools" id="sec-tools">${lab('Tools')}<div class="tool-pair">`
      + `<a class="tool" href="field.html" target="_blank" rel="noopener"><span class="tool-art" id="art-field" aria-hidden="true"></span><b>Field list</b><small class="mono">${FIELD.length}</small><i class="go">${icon('out')}</i></a>`
      + `<a class="tool" href="guide.html" target="_blank" rel="noopener"><span class="tool-art" id="art-guide" aria-hidden="true"></span><b>Guide</b><i class="go">${icon('out')}</i></a>`
      + `</div><div class="docs">${[['blank', 'print', 'BLANK SLIP', 'A blank W.I.S.H. slip to fill by hand'], ['signals', 'download', 'SIGNALS', 'CSV'], ['field', 'download', 'FIELD LIST', 'CSV'], ['briefs', 'download', 'BRIEFS', 'CSV'], ['places', 'download', 'PLACES', 'CSV: the places listed by name']].map(([k, ic, w, tip]) => `<button type="button" data-doc="${k}" data-tip="${esc(tip)}">${icon(ic)}<span>${w}</span></button>`).join('')}</div></section>`
    + `<details class="sec" id="sec-briefs"><summary>${lab(`Briefs · ${BRIEFS.length}`)}</summary><ol class="briefs">${BRIEFS.map(b => `<li><a href="${esc(b.url)}" target="_blank" rel="noopener" data-tip="${esc(cap(b.fact))}"><span class="bn mono">${b.id.slice(1)}</span><span class="nm"><b>${esc(b.t)}</b><small class="mono">${esc(b.after.toUpperCase())} · ${esc((b.city || '').toUpperCase())}${b.yr ? ` ${b.yr}` : ''} · ${THEMES[b.th] || ''}</small></span>${icon('out', 'sm')}</a></li>`).join('')}</ol></details>`
    + `<section class="sec" id="sec-set">${lab('Settings')}<div class="set"><button type="button" class="tog lb" id="ix-sound" aria-pressed="${!!prefs.sound}">${icon('sound')}<small>SOUND</small></button><button type="button" class="tog lb" id="ix-motion" aria-pressed="${!!prefs.motion}">${icon('motion')}<small>MOTION</small></button><button type="button" class="tog lb" id="ix-areas" aria-pressed="${!!prefs.areas}" data-tip="Search areas for animals lost">${icon('lost')}<small>AREAS</small></button>${HIDE.size ? `<button type="button" class="tog" id="ix-hidden" data-tip="Show every hidden cell again">${icon('hide')}<small>${HIDE.size} HIDDEN</small></button>` : ''}<label class="sig">${icon('sign')}<input id="ix-sign" type="text" maxlength="40" aria-label="Your name" placeholder="Name" value="${esc(S.me.by)}"></label></div></section>`
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

/* ════════════════════════════════════════════════════════════════════
   STRING FIGURES — inside an open life's radius every place, group, water, life and knot of your own is a knot,
   and a thin thread runs from the life to each place that sells or leaves what harms it.
   Click a knot to look: the string it would make, and its sound. Click it again, or right-click (hold, on a phone), to join it.
   Right-click a joined knot to let it go. Click open ground in the radius to add a knot of your own.
   Every figure is a constellation: named, kept on this device, listed on NOW, traced and played as a song.
   ════════════════════════════════════════════════════════════════════ */
const strings = (() => {
  const FIGS = store.get('da.figs.v1', {});
  const TAU = Math.PI * 2;
  let cell = null, nodes = new Map(), fig = blank(), shownAt = 0, peekKey = null, peekAt = 0, ghost = null;
  let glowUntil = 0, focus = null, focusAt = 0, trace = null;
  const plucks = new Map();
  const MAX_BIZ = 60;
  const pk = $('#peek'), capEl = $('#trace');
  function blank() { return { e: [], end: 'pin', prev: null, n: {}, c: {}, lb: {}, x: [], ts: {} }; }
  const eKey = ([a, b]) => `${a}|${b}`;
  const inFig = k => k === 'pin' || fig.e.some(([a, b]) => a === k || b === k);
  const idOf = k => (/^\d+$/.test(k) ? +k : k);
  function open(o) { cell = o; load(o); nodes = compute(o); shownAt = performance.now(); plucks.clear(); peekKey = null; ghost = null; focus = null; trace = null; pk.hidden = true; if (capEl) capEl.hidden = true; }
  /* a signal remixed: its figure becomes this cell's, where the cell has none of its own yet */
  function seed(o, s) {
    if (FIGS[o.id] || !(s.edges || []).length) return; const key = k => (k === 'pin' ? 'pin' : `s:${s.code}:${k}`); const n = {};
    for (const x of s.nodes || []) { const [la, ln] = dest(o.lat, o.lng, x.d, x.b); n[key(x.k)] = { t: x.t === 'custom' ? 'custom' : x.t, n: x.n, role: x.role, on: onNotice(x.role), fam: x.fam || (ROLES[x.role] || {}).cat, g: x.g, kind: x.kind, lat: +la.toFixed(5), lng: +ln.toFixed(5) }; }
    const e = s.edges.map(([a, b]) => [key(a), key(b)]); const t = Date.now();
    FIGS[o.id] = { e, end: e.length ? e[e.length - 1][1] : 'pin', prev: null, n, c: {}, lb: {}, x: [], ts: Object.fromEntries(e.map(x => [eKey(x), t])), born: t, t }; store.set('da.figs.v1', FIGS);
  }
  function close() { cell = null; nodes = new Map(); plucks.clear(); peekKey = null; ghost = null; focus = null; trace = null; pk.hidden = true; if (capEl) capEl.hidden = true; }
  function refresh() { if (cell) { const o = S.byId.get(cell.id) || cell; cell = o; nodes = compute(o); if (peekKey && !nodes.has(peekKey) && !String(peekKey).startsWith('x:')) unpeek(); else if (peekKey) card(); life.redraw(); } }
  /* ───────── the knots inside a radius ───────── */
  function compute(o) {
    const R = rangeOf(o); const out = new Map(); const press = new Set(PRESSURES[lifeOf(o)] || PRESSURES.paw || []);
    out.set('pin', { key: 'pin', t: 'pin', n: nameOf(o), lat: o.lat, lng: o.lng, d: 0, g: lifeOf(o) });
    const biz = [];
    for (const b of bizNear(o.lat, o.lng, R)) {
      const key = `b:${norm(b.n)}@${b.lat.toFixed(4)},${b.lng.toFixed(4)}`; if (out.has(key)) continue;
      const n = { key, t: 'biz', n: b.n, brand: b.b, role: b.role, on: onNotice(b.role), fam: b.fam, h: b.h, harm: b.h.filter(h => press.has(h)), cur: b.cur, url: b.url, what: b.what, addr: b.addr, a: b.a, lat: b.lat, lng: b.lng, d: b.d };
      out.set(key, n); biz.push(n);
    }
    /* listed places first, then the ones that harm this life, then the nearest */
    biz.sort((a, b) => (b.cur - a.cur) || ((b.harm.length > 0) - (a.harm.length > 0)) || a.d - b.d).forEach((n, i) => { n.rank = i; });
    for (const x of cellsAll()) {
      if (x.id === o.id || x.hist || x.ob || isCold(x) || x.isTribe) continue; const d = haversine(o.lat, o.lng, x.lat, x.lng); if (d > R) continue;
      out.set('o:' + x.id, { key: 'o:' + x.id, t: 'life', id: x.id, n: nameOf(x), g: lifeOf(x), hum: !!x.hum && !(x.tx && x.tx.n), kind: x.kind || '', user: !!x.user, lat: x.lat, lng: x.lng, d });
    }
    for (const t of S.tribes) {
      const p = tribeNear(t, o.lat, o.lng); if (!p || p.d > R) continue;
      const dd = haversine(o.lat, o.lng, p.lat, p.lng), k = dd > R * 0.85 ? (R * 0.85) / dd : 1;
      out.set('t:' + t.tid, { key: 't:' + t.tid, t: 'group', n: t.n, kind: t.kind, what: t.w, link: t.link, lat: o.lat + (p.lat - o.lat) * k, lng: o.lng + (p.lng - o.lng) * k, d: p.d });
    }
    const wn = waterNear(o.lat, o.lng); if (wn.n && wn.d <= R) out.set('w:' + norm(wn.n), { key: 'w:' + norm(wn.n), t: 'water', n: wn.n, lat: wn.lat, lng: wn.lng, d: wn.d });
    for (const [k, m] of Object.entries(fig.c || {})) out.set(k, { ...m, key: k, t: 'custom', d: haversine(o.lat, o.lng, m.lat, m.lng) });
    /* knots tied before stay, even when the radius has shrunk or the places have not loaded yet */
    for (const [k, m] of Object.entries(fig.n || {})) if (!out.has(k) && inFig(k)) out.set(k, { ...m, key: k, h: m.h || [], harm: (m.h || []).filter(r => press.has(r)), d: haversine(o.lat, o.lng, m.lat, m.lng), away: true });
    return out;
  }
  const metaOf = n => ({ t: n.t, n: n.n, role: n.role, on: n.on, fam: n.fam, ...(n.h && n.h.length ? { h: n.h } : {}), g: n.g, kind: n.kind, id: n.id, hum: n.hum, ...(n.url ? { url: n.url } : {}), lat: +n.lat.toFixed(5), lng: +n.lng.toFixed(5) });
  function load(o) {
    const f = FIGS[o.id]; fig = f ? { e: (f.e || []).map(x => [...x]), end: f.end || 'pin', prev: f.prev || null, n: { ...(f.n || {}) }, c: { ...(f.c || {}) }, lb: { ...(f.lb || {}) }, x: [...(f.x || [])], ts: { ...(f.ts || {}) }, born: f.born || ((f.e || []).length ? f.t || 1 : null), name: f.name || '' } : blank();
    if (!inFig(fig.end)) fig.end = 'pin';
  }
  function save() {
    if (!cell) return; const keep = new Set(['pin', ...fig.e.flat(), ...((fig.prev && fig.prev.e) || []).flat(), ...Object.keys(fig.c)]);
    const only = o => Object.fromEntries(Object.entries(o).filter(([k]) => keep.has(k)));
    fig.n = only(fig.n); fig.lb = only(fig.lb); fig.x = fig.x.filter(k => keep.has(k)); const live = new Set(fig.e.map(eKey)); fig.ts = Object.fromEntries(Object.entries(fig.ts || {}).filter(([k]) => live.has(k)));
    if (!fig.e.length && !fig.prev && !Object.keys(fig.c).length) delete FIGS[cell.id];
    else FIGS[cell.id] = { e: fig.e, end: fig.end, prev: fig.prev, n: fig.n, c: fig.c, lb: fig.lb, x: fig.x, ts: fig.ts, born: fig.born || null, ...(fig.name ? { name: fig.name } : {}), t: Date.now() };
    const ks = Object.keys(FIGS); if (ks.length > 80) ks.sort((a, b) => FIGS[a].t - FIGS[b].t).slice(0, ks.length - 80).forEach(k => delete FIGS[k]);
    store.set('da.figs.v1', FIGS);
  }
  /* ───────── where each knot is on the screen: a life where it has moved to ───────── */
  let itemsRef = null, itemIx = new Map();
  const itemOf = id => { if (itemsRef !== life.items) { itemsRef = life.items; itemIx = new Map(itemsRef.map(it => [it.o.id, it])); } return itemIx.get(id); };
  function pos(k) {
    const n = nodes.get(k) || (k === 'pin' && cell ? { key: 'pin', lat: cell.lat, lng: cell.lng } : null); if (!n) return null;
    if (n.t === 'life') { const it = itemOf(n.id); if (it) { n.x = it.x + it.dx; n.y = it.y + it.dy; n.r = it.b.d / 2; return n; } }
    const p = map.project([n.lng, n.lat]); n.x = p.x; n.y = p.y; n.r = n.t === 'water' ? 7 : n.t === 'group' ? 5.5 : n.t === 'pin' ? 14 : n.t === 'custom' ? 5.5 : n.cur ? 5.2 : 4.4; return n;
  }
  const lifeNode = id => !!cell && nodes.has('o:' + id);
  const focused = n => !!focus && (focus === n.key || (n.h || []).includes(focus) || (n.t === 'biz' && focus === 'fam:' + n.fam && !(n.harm || []).length));
  const visible = n => n.t !== 'biz' || n.cur || (n.harm || []).length > 0 || n.rank < MAX_BIZ || inFig(n.key) || n.away || n.key === peekKey || focused(n);
  /* ───────── drawing ───────── */
  const back = k => { k = clamp(k, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function curve(ctx, p, q, t0, now, i, part = 1) {
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1; const nx = -dy / L, ny = dx / L;
    const sag = Math.min(16, L * 0.055); let vib = 0;
    if (t0 != null && !reduced()) { const t = (now - t0) / 1000; if (t >= 0 && t < 1.8) { const f = 3 + 7 * (1 - clamp(L / 420, 0, 1)); vib = Math.min(15, L * 0.085) * Math.exp(-t / 0.4) * Math.sin(TAU * f * t); } }
    const sway = reduced() ? 0 : 0.7 * Math.sin(now / 1000 * 0.9 + i * 1.7);
    const mx = (p.x + q.x) / 2 + nx * (vib + sway), my = (p.y + q.y) / 2 + sag + ny * (vib + sway); const cx = 2 * mx - (p.x + q.x) / 2, cy = 2 * my - (p.y + q.y) / 2;
    ctx.moveTo(p.x, p.y);
    if (part >= 1) { ctx.quadraticCurveTo(cx, cy, q.x, q.y); return; }
    /* a string still being drawn: the first part of the curve */
    const T = clamp(part, 0, 1), ax = p.x + (cx - p.x) * T, ay = p.y + (cy - p.y) * T, bx = cx + (q.x - cx) * T, by = cy + (q.y - cy) * T;
    ctx.quadraticCurveTo(ax, ay, ax + (bx - ax) * T, ay + (by - ay) * T);
  }
  function lines(ctx, edges, at, now, tOf, alpha = 1, partOf = null, width = 1, hot = null) {
    if (!edges.length) return;
    ctx.save(); ctx.lineCap = 'round';
    for (const [w, c] of [[3.2 * width, 'rgba(0,0,0,.38)'], [1.5 * width, '#FFFFFF']]) {
      ctx.lineWidth = w;
      edges.forEach((e, i) => { const p = at(e[0]), q = at(e[1]); if (!p || !q) return; const part = partOf ? partOf(e, i) : 1; if (part <= 0) return; const t0 = tOf(e, i); ctx.strokeStyle = c !== '#FFFFFF' || !hot || !hot(e) ? c : C.orange; ctx.globalAlpha = typeof alpha === 'function' ? alpha(e, i, t0) : alpha; ctx.beginPath(); curve(ctx, p, q, t0, now, i, part); ctx.stroke(); });
    }
    ctx.restore();
  }
  /* a string to a place that sells or leaves what harms this life */
  const hotIn = nodeOf => e => e.some(k => { const n = k !== 'pin' && nodeOf(k); return !!n && n.t === 'biz' && (n.harm || []).length > 0; });
  /* the human ecology, drawn small: a diamond for a shop or a brand, filled by what it does; a room for a third space; three linked dots for a network */
  function placeMark(ctx, n, x, y, k, tied) {
    const r = (n.cur ? 5 : 4) * k * (tied ? 1.18 : 1); const harm = (n.harm || []).length > 0;
    const dia = (rr, fill, stroke, lw = 1.4) => { ctx.beginPath(); ctx.moveTo(x, y - rr); ctx.lineTo(x + rr, y); ctx.lineTo(x, y + rr); ctx.lineTo(x - rr, y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); };
    ctx.save();
    if (n.fam === 'third') { const h = r * 0.95; ctx.beginPath(); ctx.rect(x - h, y - h, h * 2, h * 2); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.navy; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, h * 0.38, 0, TAU); ctx.fillStyle = C.navy; ctx.fill(); }
    else if (n.fam === 'network') { const P = [[0, -r], [r * 0.95, r * 0.6], [-r * 0.95, r * 0.6]]; ctx.beginPath(); P.forEach(([a, b], i) => (i ? ctx.lineTo(x + a, y + b) : ctx.moveTo(x + a, y + b))); ctx.closePath(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.white; ctx.stroke(); for (const [a, b] of P) { ctx.beginPath(); ctx.arc(x + a, y + b, r * 0.42, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.navy; ctx.stroke(); } }
    else if (n.fam === 'artists') { dia(r, C.white, C.navy); ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, TAU); ctx.fillStyle = C.navy; ctx.fill(); }
    else if (n.fam === 'circular') dia(r, C.teal, C.navy);
    else if (n.fam === 'brand' && !harm) dia(r, C.cobalt, C.white, 1.2);
    else dia(r, harm ? C.neon : C.white, harm ? C.navy : C.cobalt);
    if (n.cur) { ctx.beginPath(); ctx.arc(x, y, r + 3.2, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke(); }
    ctx.restore();
  }
  function mark(ctx, n, x, y, k, tied) {
    if (k <= 0) return;
    if (n.t === 'biz') placeMark(ctx, n, x, y, k, tied);
    else if (n.t === 'group') { ctx.save(); ctx.beginPath(); ctx.arc(x, y, 5.6 * k, 0, TAU); ctx.fillStyle = C.tribe[n.kind] || C.tribe.park; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = C.white; ctx.stroke(); ctx.restore(); }
    else if (n.t === 'water') { ctx.save(); ctx.beginPath(); ctx.arc(x, y, 7.4 * k, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.restore(); M.icon(ctx, 'water', x, y, 10 * k, C.cobalt); }
    else if (n.t === 'custom') { const h = 5.4 * k; ctx.save(); ctx.beginPath(); ctx.rect(x - h, y - h, h * 2, h * 2); ctx.fillStyle = tied ? C.navy : C.white; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = tied ? C.white : C.navy; ctx.stroke(); ctx.restore(); M.icon(ctx, n.kind === 'person' ? 'people' : n.kind === 'idea' ? 'aware' : 'where', x, y, 8 * k, tied ? C.white : C.navy); }
    else if (n.t === 'life' && n.away) M.badge(ctx, { tone: n.hum ? 'offer' : M.toneOf(n.g), g: n.hum ? null : n.g, i: n.hum ? 'people' : null, d: 16 * k }, x, y);
  }
  /* a knot joined: a white ring; the knot the next string leaves from: a ring that breathes */
  function knotAt(ctx, k, x, y, r, now) {
    const tied = k === 'pin' ? fig.e.length > 0 : inFig(k); const end = fig.end === k;
    if (!tied && !end) return;
    ctx.save();
    if (tied && k !== 'pin') { ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke(); }
    if (end) { const s = reduced() ? 0 : Math.sin(now / 420); ctx.beginPath(); ctx.arc(x, y, r + 7 + s * 1.6, 0, TAU); ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.3; ctx.stroke(); }
    ctx.restore();
  }
  function draw(ctx, now, e) {
    if (!cell) return; const R = rangeOf(cell); const P = pos('pin');
    for (const n of nodes.values()) pos(n.key);
    /* threads of responsibility: from the life to each place that sells or leaves what harms it */
    if (P) {
      ctx.save(); ctx.lineCap = 'round';
      for (const n of nodes.values()) {
        if (n.t !== 'biz' || !(n.harm || []).length || n.x == null) continue; const k = reduced() ? 1 : clamp((e - 380 - (n.d / R) * 600) / 420, 0, 1); if (k <= 0) continue;
        const on = focus ? focused(n) : true; ctx.globalAlpha = (focus ? (on ? 0.95 : 0.1) : 0.42) * k; ctx.lineWidth = focus && on ? 1.6 : 1; ctx.strokeStyle = C.orange;
        ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(P.x + (n.x - P.x) * k, P.y + (n.y - P.y) * k); ctx.stroke();
      }
      ctx.restore();
    }
    /* the strings: whole, or drawn again one by one when the figure is traced */
    const traced = trace && now < trace.end; const glow = glowUntil > now ? (glowUntil - now) / 2600 : 0;
    const hot = hotIn(k => nodes.get(k));
    if (glow > 0) { ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 14 * glow; lines(ctx, fig.e, k => nodes.get(k), now, x => plucks.get(eKey(x)), 0.5 + 0.5 * glow, null, 1 + glow, hot); ctx.restore(); }
    lines(ctx, fig.e, k => nodes.get(k), now, x => plucks.get(eKey(x)), 1, traced ? (x, i) => clamp((now - trace.t0 - i * trace.step) / (trace.step * 0.8), 0, 1) : null, 1, hot);
    if (traced) traceCaption(now);
    else if (trace) { trace = null; if (capEl) capEl.hidden = true; }
    /* the string it would make, before it is made */
    let pv = peekKey && nodes.get(peekKey);
    const preview = (p, q) => { ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); curve(ctx, p, q, null, now, 0); ctx.strokeStyle = 'rgba(11,37,69,.5)'; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([6, 5]); ctx.lineDashOffset = reduced() ? 0 : -now / 40; ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); };
    if (pv && peekKey !== fig.end && !fig.e.some(([a, b]) => (a === fig.end && b === peekKey) || (b === fig.end && a === peekKey))) {
      const p = nodes.get(fig.end) || P; if (p && p.x != null) preview(p, pv);
    }
    /* a life outside the radius, looked at: the way out to it */
    if (peekKey && peekKey.startsWith('x:')) { const o = S.byId.get(idOf(peekKey.slice(2))); if (o && P) { const q = map.project([o.lng, o.lat]); pv = { x: q.x, y: q.y, r: 10 }; preview(P, pv); } }
    for (const n of nodes.values()) {
      if (n.t === 'pin' || !visible(n)) continue;
      const k = reduced() ? 1 : back((e - 560 - (n.d / R) * 520) / 260); const tied = inFig(n.key);
      if (n.t !== 'life' || n.away) mark(ctx, n, n.x, n.y, k, tied);
      if (focus && focused(n) && k >= 1) { const q = clamp((now - focusAt) / 300, 0, 1); ctx.save(); ctx.beginPath(); ctx.arc(n.x, n.y, (n.r || 5) + 5 + (1 - q) * 8, 0, TAU); ctx.strokeStyle = C.orange; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.4 + 0.6 * q; ctx.stroke(); ctx.restore(); }
      if (k >= 1) knotAt(ctx, n.key, n.x, n.y, n.r || 5, now);
    }
    if (pv && pv.x != null) { const q = clamp((now - peekAt) / 260, 0, 1); ctx.save(); ctx.beginPath(); ctx.arc(pv.x, pv.y, (pv.r || 5) + 6 + (1 - q) * 10, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.5 + 0.5 * q; ctx.stroke(); ctx.restore(); }
    drawLead(ctx);
    /* a constellation born: rings out from the life */
    if (fig.born && now - bornAt < 1400 && P) { const q = (now - bornAt) / 1400; for (const dq of [0, 0.18]) { const qq = clamp(q - dq, 0, 1); ctx.save(); ctx.beginPath(); ctx.arc(P.x, P.y, 16 + qq * 70, 0, TAU); ctx.strokeStyle = C.white; ctx.globalAlpha = (1 - qq) * 0.8; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); } }
    if (ghost) { const p = map.project([ghost.lng, ghost.lat]); const q = reduced() ? 1 : back((now - ghost.t) / 300); ctx.save(); ctx.beginPath(); ctx.rect(p.x - 7 * q, p.y - 7 * q, 14 * q, 14 * q); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = C.navy; ctx.stroke(); ctx.restore(); M.icon(ctx, 'plus', p.x, p.y, 10 * q, C.navy); }
  }
  /* ───────── touch ───────── */
  function hit(x, y, slack) {
    if (!cell) return null; let best = null;
    if (ghost) { const p = map.project([ghost.lng, ghost.lat]); if (Math.hypot(p.x - x, p.y - y) < 16) return { kind: 'node', key: '+', d: 0 }; }
    for (const n of nodes.values()) {
      if (!visible(n) || n.x == null) continue; const d = Math.hypot(n.x - x, n.y - y) - (n.r || 5) - (n.t === 'biz' ? 3 : 0);
      if (d <= slack && (!best || d < best.d)) best = { kind: 'node', key: n.key, d };
    }
    return best;
  }
  const panOf = k => { const n = pos(k); return n ? clamp((n.x / (innerWidth || 1)) * 2 - 1, -1, 1) : 0; };
  const lenOf = ([a, b]) => { const p = nodes.get(a), q = nodes.get(b); return p && q && cell ? clamp(haversine(p.lat, p.lng, q.lat, q.lng) / Math.max(100, rangeOf(cell)), 0, 1) : 0.5; };
  /* ───────── sound: each knot its own, each string its note ───────── */
  const SCALE = [196, 220.5, 245, 294, 326.7, 392, 441, 490, 588];
  const noteOf = len => SCALE[clamp(Math.round((1 - clamp(len, 0, 1)) * (SCALE.length - 1)), 0, SCALE.length - 1)];
  function soundOf(n) {
    if (!n) return { g: 'paw' };
    if (n.t === 'biz') return { fam: n.fam || (ROLES[n.role] || {}).cat || 'service' };
    if (n.t === 'group') return { fam: 'network' };
    if (n.t === 'water') return { g: 'aquatic' };
    if (n.t === 'custom') return n.kind === 'person' ? { fam: 'people' } : n.kind === 'idea' ? { g: 'butterfly' } : { g: 'plant' };
    if (n.t === 'life') return n.hum ? { fam: 'people' } : { g: n.g || 'paw' };
    return { g: n.g || 'paw' };
  }
  const voiceOf = k => soundOf(nodes.get(k));
  function changed() { life.redraw(); life.retag(); if (peekKey) card(); if (typeof stringsChanged === 'function') stringsChanged(); }
  /* ───────── the hand: a click looks, a second click (or a right-click) joins ───────── */
  function tap(k) {
    if (!cell) return;
    if (k === '+') { newKnot(); return; }
    if (k === 'pin') { unpeek(); playOpen(); return; }
    if (String(k).startsWith('x:')) { if (k === peekKey) bringIn(idOf(k.slice(2)), true); return; }
    if (!nodes.has(k)) return;
    if (k !== peekKey) { peek(k); return; }
    act(k);
  }
  /* right-click, or a long press: join a knot at once, or let it go */
  function join(k) {
    if (!cell || k === 'pin' || k === '+') return;
    if (String(k).startsWith('x:')) { bringIn(idOf(k.slice(2)), true); return; }
    if (!nodes.has(k)) return;
    if (inFig(k)) { untie(k); if (peekKey === k) card(); return; }
    tieTo(k, fig.end); if (peekKey && peekKey !== k) unpeek(); save(); changed();
  }
  let bornAt = 0;
  function tieTo(k, from, at = 0, quiet = false) {
    const n = nodes.get(k); if (!n || inFig(k)) return null; const now = performance.now();
    const e = [from, k]; fig.e.push(e); fig.n[k] = metaOf(n); if (from !== 'pin' && nodes.get(from)) fig.n[from] = metaOf(nodes.get(from));
    fig.ts[eKey(e)] = Date.now(); plucks.set(eKey(e), now + at * 1000); fig.end = k; fig.prev = null;
    if (!fig.born) { fig.born = Date.now(); bornAt = now; snd.born(); }
    if (!quiet) { const L = lenOf(e); snd.pluck(L, panOf(k)); snd.knot(voiceOf(k), noteOf(L), 0.12, 0.9, panOf(k)); }
    return e;
  }
  /* what a second click on a knot already looked at does: join it, carry on from it, or cut it */
  function act(k) {
    const n = nodes.get(k); if (!cell || !n || k === 'pin') return;
    if (k === fig.end) {
      for (let i = fig.e.length - 1; i >= 0; i--) { const [a, b] = fig.e[i]; if (a === k || b === k) { fig.e.splice(i, 1); fig.end = a === k ? b : a; break; } }
      if (!inFig(fig.end)) fig.end = 'pin';
      snd.snap(panOf(k)); save(); changed(); return;
    }
    if (inFig(k)) { fig.end = k; snd.tick(2300); buzz(4); save(); changed(); return; }
    tieTo(k, fig.end); save(); changed();
  }
  /* every place that does one thing, joined to the life at once: a fan of strings, plucked one after another */
  function joinAll(keys) {
    if (!cell) return 0; const ks = keys.filter(k => nodes.has(k) && !inFig(k)); if (!ks.length) return 0; const seq = [];
    ks.forEach((k, i) => { const e = tieTo(k, 'pin', i * 0.11, true); if (!e) return; const L = lenOf(e); seq.push({ f: noteOf(L), t: i * 0.11, pan: panOf(k), g: 0.07 }); });
    seq.push({ spec: voiceOf(ks[ks.length - 1]), f: noteOf(0.5), t: ks.length * 0.11 + 0.1, v: 0.8, pan: 0 });
    snd.song(seq); save(); changed(); return ks.length;
  }
  /* untie a knot wholly: every string to it */
  function untie(k) { const was = fig.e.length; fig.e = fig.e.filter(([a, b]) => a !== k && b !== k); if (!inFig(fig.end)) fig.end = fig.e.length ? fig.e[fig.e.length - 1][1] : 'pin'; if (fig.e.length !== was) { snd.snap(panOf(k)); save(); changed(); } }
  function undo() {
    if (!fig.e.length) { tick(600); return; } const e = fig.e.pop(); fig.end = inFig(e[0]) ? e[0] : 'pin';
    snd.snap(panOf(e[1])); save(); changed();
  }
  function reset() {
    if (!fig.e.length) { tick(600); return; } const lens = fig.e.map(lenOf);
    fig.prev = { e: fig.e, end: fig.end }; fig.e = []; fig.end = 'pin';
    snd.strum(lens.reverse(), -1); save(); changed();
  }
  function restore() {
    if (!fig.prev) { tick(600); return; } fig.e = fig.prev.e.map(x => [...x]); fig.end = fig.prev.end; fig.prev = null;
    const now = performance.now(); fig.e.forEach((e, i) => { plucks.set(eKey(e), now + i * 45); fig.ts[eKey(e)] = fig.ts[eKey(e)] || Date.now(); }); nodes = compute(cell);
    snd.strum(fig.e.map(lenOf), 1); save(); changed();
  }
  function strum(dir) { const now = performance.now(); fig.e.forEach((e, i) => plucks.set(eKey(e), now + i * 45)); snd.strum(fig.e.map(lenOf), dir); life.redraw(); }
  const busy = now => (S.mode === 'sig' && now - sigT < 2200) || !!ghost || !!peekKey || !!focus || glowUntil > now || !!trace || songUntil > now || (!!cell && (now - shownAt < 1800 || [...plucks.values()].some(t => now - t < 1800)));
  /* one kind of place lit up together; looked at a second time, joined together */
  function focusOn(f) { focus = f; focusAt = performance.now(); unpeek(); life.redraw(); }
  const unfocus = () => { if (focus) { focus = null; life.redraw(); } };

  /* ───────── looking: a small card beside the knot, its sound, and the string it would make ───────── */
  const ROLEW = r => (ROLES[r] || {}).w || '';
  const FAMW = f => (FAMILIES[f] || {}).w || '';
  const KINDW = { place: 'PLACE', person: 'PERSON', idea: 'IDEA' };
  function peek(k) { peekKey = k; peekAt = performance.now(); ghost = null; focus = null; buzz(3); card(); life.redraw(); life.retag(); const n = nodes.get(k); if (n) snd.knot(soundOf(n), noteOf(clamp((n.d || 0) / Math.max(100, rangeOf(cell)), 0, 1)), 0, 0.75, panOf(k)); if (typeof peekChanged === 'function') peekChanged(k); }
  function unpeek() { if (!peekKey && !ghost) return; peekKey = null; ghost = null; pk.hidden = true; lead = null; life.redraw(); life.retag(); if (typeof peekChanged === 'function') peekChanged(null); }
  /* a life outside the radius: looked at without losing the one open; a second click brings it in and joins it */
  function peekOut(id) {
    const o = S.byId.get(id); if (!o || !cell) return; if (peekKey === 'x:' + id) { bringIn(id, true); return; }
    peekKey = 'x:' + id; peekAt = performance.now(); ghost = null; card(); life.redraw(); snd.knot({ g: lifeOf(o) }, noteOf(0.9), 0, 0.7, 0);
  }
  function bringIn(id, tie) {
    const o = S.byId.get(id); if (!o || !cell) return; const d = haversine(cell.lat, cell.lng, o.lat, o.lng); if (d > CONFIG.RADIUS.max - 25) { tick(600); return; }
    if (d > rangeOf(cell)) { S.radius.set(cell.id, Math.min(CONFIG.RADIUS.max, Math.ceil((d + 25) / 10) * 10)); nodes = compute(cell); life.moved(); refreshRecord(); if (typeof placesAround === 'function') placesAround(cell.lat, cell.lng, rangeOf(cell) + 80); }
    const k = 'o:' + id; if (!nodes.has(k)) return; if (tie) { unpeek(); tieTo(k, fig.end); save(); changed(); } else peek(k);
  }
  /* the score of a knot's sound: its notes as dots on five lines, or a small wave for a person */
  function scoreSVG(spec) {
    const d = snd.describe(spec); if (d.people) return `<svg class="score" viewBox="0 0 44 14" aria-hidden="true"><path d="M2 7c4-6 6 6 10 0s6 6 10 0 6 6 10 0 6 6 10 0" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;
    let x = 4; const tot = d.notes.reduce((a, n) => a + n[1], 0) || 1; const dots = d.notes.map(([s2, dur]) => { const cx = x + (dur / tot) * 18; x += (dur / tot) * 36; return `<circle cx="${cx.toFixed(1)}" cy="${(11 - clamp(s2, -7, 24) * 0.36).toFixed(1)}" r="1.7"/>`; }).join('');
    return `<svg class="score" viewBox="0 0 44 14" aria-hidden="true"><path d="M0 2.5h44M0 5h44M0 7.5h44M0 10h44M0 12.5h44" stroke="currentColor" stroke-width=".4" opacity=".5"/><g fill="currentColor">${dots}</g></svg>`;
  }
  function card() {
    if (!peekKey) { pk.hidden = true; return; }
    if (peekKey === '+') return;
    let h = '';
    if (peekKey.startsWith('x:')) {
      const o = S.byId.get(idOf(peekKey.slice(2))); if (!o) { unpeek(); return; } const d = haversine(cell.lat, cell.lng, o.lat, o.lng);
      h = `${head(o, nameOf(o), `${esc((M.KINDS[lifeOf(o)] || '').toUpperCase())} · ${metres(d)}`, null, { g: lifeOf(o) }, 'open')}${!o.hum ? `<p class="pk-line">${esc(threatOf(o))}</p>` : ''}`;
    } else {
      const n = nodes.get(peekKey); if (!n) { unpeek(); return; }
      /* a place: what it does that harms this life comes first; what it is, after */
      const hr = n.t === 'biz' ? (n.harm || []) : []; const rw = hr.length ? ROLEW(hr[0]) : ROLEW(n.role);
      const what = n.t === 'biz' ? `${FAMW(n.fam)}${rw && rw !== FAMW(n.fam) ? ` · ${rw}` : ''}` : n.t === 'group' ? 'GROUP' : n.t === 'water' ? 'WATER' : n.t === 'custom' ? KINDW[n.kind] || 'KNOT' : esc((M.KINDS[n.g] || '').toUpperCase());
      const meta = [what, n.d ? metres(n.d) : ''].filter(Boolean).join(' · ');
      const o = n.t === 'life' ? S.byId.get(n.id) : null;
      const line = n.t === 'biz' ? (hr.length && !n.what ? (ROLES[hr[0]] || {}).duty : n.what || (ROLES[n.role] || {}).duty || '') : n.t === 'group' ? n.what || '' : o && !n.hum ? threatOf(o) : '';
      const harms = hr.slice(1).map(r => ROLEW(r)).filter(Boolean);
      h = `${head(o, labelOf(peekKey), meta, n, soundOf(n), o ? 'open' : (n.url || n.link) ? 'link' : '')}${line ? `<p class="pk-line">${esc(cap(line))}</p>` : ''}${harms.length ? `<p class="pk-harm mono">ALSO ${harms.join(' · ')}</p>` : ''}${n.addr ? `<p class="pk-addr mono">${esc(n.addr.toUpperCase())}</p>` : ''}`;
    }
    pk.innerHTML = h.replace(/(\d) (K?M)\b/g, '$1 $2'); pk.hidden = false; pk.classList.remove('in'); void pk.offsetWidth; pk.classList.add('in'); place();
  }
  function head(o, name, meta, n, spec, go) {
    const sub = o ? subjectOf(o) : null;
    const img = sub && sub.ph && licOpen(sub.ph.l) ? `<img src="${esc(photoURL(sub.ph.u, 'small'))}" alt="">` : o ? `<img src="${badgeImg(life.badgeOf(o, 40), 44)}" alt="">` : n && n.t === 'biz' ? `<i class="fm fm-${esc(n.fam || 'service')}${(n.harm || []).length ? ' harm' : ''}"></i>` : n && n.t === 'group' ? `<i class="patch" style="--c:${C.tribe[n.kind] || C.tribe.park}"></i>` : n && n.t === 'water' ? icon('water') : n && n.t === 'custom' ? `<i class="sq big${inFig(n.key) ? ' tied' : ''}">${icon(n.kind === 'person' ? 'people' : n.kind === 'idea' ? 'aware' : 'where', 'sm')}</i>` : icon('where');
    const url = n && (n.url || n.link);
    const nm = go === 'open' ? `<button type="button" class="pk-nm" data-pk="open">${esc(name)}</button>` : go === 'link' && url ? `<a class="pk-nm" href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>` : `<b class="pk-nm">${esc(name)}</b>`;
    return `<div class="pk-top">${img}<span class="pk-id">${nm}<small>${meta}</small></span><button type="button" class="pk-x" data-pk="close" aria-label="Close">${icon('close', 'sm')}</button></div>`;
  }
  /* the card sits outside the radius, on the knot's side, so every knot inside stays in reach; a thread leads back to the knot */
  let lead = null;
  function place() {
    lead = null; if (pk.hidden || !peekKey) return; let x0, y0;
    if (peekKey === '+' && ghost) { const p = map.project([ghost.lng, ghost.lat]); x0 = p.x; y0 = p.y; }
    else if (peekKey.startsWith('x:')) { const o = S.byId.get(idOf(peekKey.slice(2))); if (!o) return; const p = map.project([o.lng, o.lat]); x0 = p.x; y0 = p.y; }
    else { const n = pos(peekKey); if (!n) return; x0 = n.x; y0 = n.y; }
    const c = map.getContainer(); const W = c.clientWidth, H = c.clientHeight; const open = S.open && !phone() ? Math.min(440, innerWidth * 0.4) : 0; const bottom = phone() && S.open ? innerHeight * 0.42 : H;
    const w = pk.offsetWidth || 250, h = pk.offsetHeight || 120; const right = W - open - 8, low = bottom - 8;
    const fits = (x, y) => x >= 8 && y >= 8 && x + w <= right && y + h <= low;
    const ctr = cell ? map.project([cell.lng, cell.lat]) : null; let at = null;
    if (ctr && !peekKey.startsWith('x:')) {
      const e = map.project([cell.lng + rangeOf(cell) / (111320 * Math.cos(cell.lat * Math.PI / 180)), cell.lat]); const R = Math.abs(e.x - ctr.x) + 14;
      /* clear of the circle: a rectangle whose nearest corner or edge is outside it */
      const clear = (x, y) => { const nx = clamp(ctr.x, x, x + w), ny = clamp(ctr.y, y, y + h); return Math.hypot(nx - ctr.x, ny - ctr.y) >= R; };
      let dx = x0 - ctr.x, dy = y0 - ctr.y; const L = Math.hypot(dx, dy); if (L < 4) { dx = 1; dy = 0; } else { dx /= L; dy /= L; }
      const ext = Math.min(Math.abs(dx) > 1e-3 ? (w / 2) / Math.abs(dx) : 1e9, Math.abs(dy) > 1e-3 ? (h / 2) / Math.abs(dy) : 1e9);
      const ty = clamp(y0 - h / 2, 8, Math.max(8, low - h)), tx = clamp(x0 - w / 2, 8, Math.max(8, right - w));
      const cands = [[ctr.x + dx * (R + ext) - w / 2, ctr.y + dy * (R + ext) - h / 2], [ctr.x + R, ty], [ctr.x - R - w, ty], [tx, ctr.y + R], [tx, ctr.y - R - h], [8, 8], [right - w, 8], [8, low - h], [right - w, low - h]];
      at = cands.find(([x, y]) => fits(x, y) && clear(x, y)) || null;
    }
    /* no room outside the circle: beside the knot, then docked at an edge, never over the knot or the life at the centre */
    if (!at) {
      const box = ([x, y]) => [clamp(x, 8, Math.max(8, right - w)), clamp(y, 8, Math.max(8, low - h))];
      const over = ([x, y], px, py, m) => px > x - m && px < x + w + m && py > y - m && py < y + h + m;
      const side = ctr && x0 < ctr.x ? -1 : 1;
      const cands = [[side < 0 ? x0 - w - 18 : x0 + 18, y0 - h / 2], [side < 0 ? x0 + 18 : x0 - w - 18, y0 - h / 2], [x0 - w / 2, y0 - h - 18], [x0 - w / 2, y0 + 18], [8, 8], [right - w, 8], [8, low - h], [right - w, low - h]].map(box);
      at = cands.find(c2 => !over(c2, x0, y0, 10) && !(ctr && over(c2, ctr.x, ctr.y, 16))) || cands.find(c2 => !over(c2, x0, y0, 10)) || cands[0];
    }
    let [x, y] = at;
    x = clamp(x, 8, Math.max(8, right - w)); y = clamp(y, 8, Math.max(8, low - h));
    pk.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    const lx = clamp(x0, x, x + w), ly = clamp(y0, y, y + h); if (Math.hypot(lx - x0, ly - y0) > 14) lead = { x0, y0, x1: lx, y1: ly };
  }
  /* the thread from the card back to its knot */
  function drawLead(ctx) { if (!lead || pk.hidden) return; ctx.save(); ctx.beginPath(); ctx.moveTo(lead.x0, lead.y0); ctx.lineTo(lead.x1, lead.y1); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.restore(); }
  pk.addEventListener('click', e => {
    const b = e.target.closest('[data-pk]'); if (!b) return; const a = b.dataset.pk; const k = peekKey; if (!k) return;
    if (a === 'close') { unpeek(); tick(900); return; }
    if (a === 'open') { const id = idOf(k.startsWith('x:') ? k.slice(2) : String(nodes.get(k).id)); unpeek(); select(id); }
  });
  pk.addEventListener('contextmenu', e => { e.preventDefault(); if (peekKey) join(peekKey); });
  /* ───────── knots of your own: a place, a person or an idea, anywhere in the radius ───────── */
  function ground(ll) {
    if (!cell) return; if (peekKey || ghost || focus) { unpeek(); unfocus(); tick(900); return; }
    ghost = { lat: ll.lat, lng: ll.lng, t: performance.now() }; snd.tick(1300); life.redraw();
  }
  function newKnot() {
    if (!ghost) return; peekKey = '+'; peekAt = performance.now();
    pk.innerHTML = `<div class="pk-top">${icon('plus')}<span class="pk-id"><b class="pk-nm">&nbsp;</b><small>${metres(haversine(cell.lat, cell.lng, ghost.lat, ghost.lng))}</small></span><button type="button" class="pk-x" data-pk="close" aria-label="Close">${icon('close', 'sm')}</button></div>`
      + `<form class="pk-new" id="pk-new"><input id="pk-n" type="text" maxlength="40" placeholder="Name" aria-label="Name" autocomplete="off"><div class="pk-kinds">${Object.entries(KINDW).map(([k, w], i) => `<button type="button" class="chip${i ? '' : ' on'}" data-kind="${k}" aria-pressed="${!i}">${w}</button>`).join('')}</div><button type="submit" class="pk-main" aria-label="Add">${icon('check', 'sm')}</button></form>`;
    pk.hidden = false; pk.classList.remove('in'); void pk.offsetWidth; pk.classList.add('in'); place(); snd.tick(1700);
    const f = $('#pk-new'); let kind = 'place';
    f.addEventListener('click', e => { const c = e.target.closest('[data-kind]'); if (!c) return; kind = c.dataset.kind; f.querySelectorAll('[data-kind]').forEach(b => { b.classList.toggle('on', b === c); b.setAttribute('aria-pressed', String(b === c)); }); tick(1500); });
    f.addEventListener('submit', e => { e.preventDefault(); const name = $('#pk-n').value.trim(); if (!name) { nudge($('#pk-n')); return; } const k = 'k:' + Date.now().toString(36); fig.c[k] = { t: 'custom', n: name, kind, lat: +ghost.lat.toFixed(5), lng: +ghost.lng.toFixed(5) }; ghost = null; save(); nodes = compute(cell); peek(k); changed(); });
    if (!coarse()) setTimeout(() => { const i = $('#pk-n'); if (i) i.focus(); }, 60);
  }
  function removeKnot(k) { if (!fig.c[k]) return false; delete fig.c[k]; untie(k); save(); nodes = compute(cell); if (peekKey === k) unpeek(); changed(); snd.snap(0); return true; }
  /* ───────── what the card and the slip read ───────── */
  const labelOf = k => (fig.lb[k] != null ? fig.lb[k] : (nodes.get(k) || fig.n[k] || fig.c[k] || {}).n || '');
  const included = k => !fig.x.includes(k);
  function setInclude(k, on) { fig.x = fig.x.filter(x => x !== k); if (!on) fig.x.push(k); save(); }
  function setLabel(k, t) { const orig = (nodes.get(k) || fig.n[k] || {}).n || ''; if (!t.trim() || t.trim() === orig) delete fig.lb[k]; else fig.lb[k] = t.trim().slice(0, 40); save(); }
  const tied = () => { const seen = new Set(); const out = []; for (const [a, b] of fig.e) for (const k of [a, b]) if (k !== 'pin' && !seen.has(k)) { seen.add(k); const n = nodes.get(k) || (fig.n[k] && { ...fig.n[k], key: k }); if (n) out.push({ ...n, key: k, label: labelOf(k), inc: included(k) }); } return out; };
  function reach() {
    const order = { custom: 0, biz: 1, group: 2, water: 3, life: 4 };
    return [...nodes.values()].filter(n => n.t !== 'pin').map(n => ({ ...n, tied: inFig(n.key) })).sort((a, b) => (b.tied - a.tied) || order[a.t] - order[b.t] || ((b.cur ? 1 : 0) - (a.cur ? 1 : 0)) || ((b.harm || []).length - (a.harm || []).length) || a.d - b.d);
  }
  /* who in the radius does what harms this life, and who can help: counted in plain words, each a set of knots */
  function ledgerOf() {
    const harm = new Map(), help = new Map();
    for (const n of nodes.values()) {
      if (n.t !== 'biz' || n.away) continue;
      for (const r of n.harm || []) { if (!harm.has(r)) harm.set(r, []); harm.get(r).push(n.key); }
      if (!(n.harm || []).length && !n.on) { const f = n.fam || 'service'; if (f === 'service') continue; if (!help.has(f)) help.set(f, []); help.get(f).push(n.key); }
    }
    const press = PRESSURES[lifeOf(cell)] || [];
    return { harm: [...harm.entries()].sort((a, b) => press.indexOf(a[0]) - press.indexOf(b[0])), help: [...help.entries()].sort((a, b) => b[1].length - a[1].length), total: new Set([...harm.values()].flat()).size };
  }
  function tagHTML(k) {
    const n = nodes.get(k); if (!n || k === peekKey) return ''; const d = n.d ? ` · ${metres(n.d)}` : '';
    if (n.t === 'pin') return `<span class="tx"><b>${esc(n.n)}</b><small>${fig.e.length ? `${fig.e.length} ${icon('string', 'sm')}` : ''}</small></span>`;
    const what = n.t === 'biz' ? `<i class="role${(n.harm || []).length ? ' on' : ''}">${(n.harm || []).length ? ROLEW(n.harm[0]) : FAMW(n.fam) || ROLEW(n.role)}</i>` : n.t === 'group' ? 'GROUP' : n.t === 'water' ? 'WATER' : n.t === 'custom' ? KINDW[n.kind] || 'KNOT' : esc((M.KINDS[n.g] || '').toUpperCase());
    return `<span class="tx"><b>${esc(labelOf(k) || n.n)}</b><small>${what}${d}${inFig(k) ? ` · ${icon('string', 'sm')}` : ''}</small></span>`;
  }
  /* the figure carried by a signal: each knot kept as a bearing and a distance from the cell, so it can be drawn anywhere */
  function snapshot() {
    if (!cell) return { nodes: [], edges: [] }; const keys = []; const ix = k => { if (k === 'pin') return 'pin'; let i = keys.indexOf(k); if (i < 0) { keys.push(k); i = keys.length - 1; } return String.fromCharCode(97 + i); };
    /* a knot left off the slip passes its strings on: whatever was tied through it joins up past it */
    const rep = { pin: 'pin' }, seen = new Set(), edges = [];
    for (const [a, b] of fig.e) {
      const ra = rep[a] || (included(a) ? a : 'pin');
      if (!included(b)) { if (!rep[b]) rep[b] = ra; continue; }
      rep[b] = b; const id = [ra, b].sort().join('|'); if (ra === b || seen.has(id)) continue; seen.add(id); edges.push([ix(ra), ix(b)]);
    }
    const out = keys.map((k, i) => { const n = nodes.get(k) || fig.n[k] || fig.c[k] || {}; return { k: String.fromCharCode(97 + i), t: n.t, n: labelOf(k) || n.n, ...(n.role ? { role: n.role } : {}), ...(n.fam && n.t === 'biz' ? { fam: n.fam } : {}), ...(n.t === 'biz' ? { h: n.harm || (n.h || []).filter(r => (PRESSURES[lifeOf(cell)] || []).includes(r)) } : {}), ...(n.url ? { u: n.url } : {}), ...(n.g && n.t === 'life' ? { g: n.g } : {}), ...(n.kind && (n.t === 'group' || n.t === 'custom') ? { kind: n.kind } : {}), b: Math.round(bearing(cell.lat, cell.lng, n.lat, n.lng)), d: Math.round(haversine(cell.lat, cell.lng, n.lat, n.lng)) }; });
    return { nodes: out, edges };
  }
  /* a signal's figure, read only: its strings plucked once as it opens */
  let sigT = 0;
  const showSig = () => { sigT = performance.now(); life.redraw(); };
  function drawSig(ctx, now) {
    const s = S.signals.find(x => x.key === S.sig); if (!s || !s.pin) return; const P = map.project([s.pin.lng, s.pin.lat]);
    const at = k => { if (k === 'pin') return { x: P.x, y: P.y }; const n = (s.nodes || []).find(x => x.k === k); if (!n) return null; const [la, ln] = dest(s.pin.lat, s.pin.lng, n.d, n.b); const p = map.project([ln, la]); return { ...n, x: p.x, y: p.y }; };
    const t0 = sigT || now;
    const sn = k => { const n = (s.nodes || []).find(x => x.k === k); return n && { t: n.t, harm: harmsOfNode(n) }; };
    lines(ctx, s.edges || [], at, now, (e, i) => t0 + 300 + i * 60, 1, null, 1, hotIn(sn));
    for (const n of s.nodes || []) { const p = at(n.k); if (!p) continue; const k = reduced() ? 1 : back((now - t0 - 200) / 300); if (n.t === 'life') M.badge(ctx, { tone: M.toneOf(n.g || 'paw'), g: n.g || 'paw', d: 18 * k }, p.x, p.y); else mark(ctx, { ...n, on: onNotice(n.role), fam: n.fam || (ROLES[n.role] || {}).cat }, p.x, p.y, k, true); }
  }
  /* ───────── every figure the radar holds, faint; and played as a song from the radar's centre ───────── */
  let songUntil = 0; const songT = new Map();
  const figCells = () => Object.entries(FIGS).map(([id, f]) => ({ id: idOf(id), f, o: S.byId.get(idOf(id)) })).filter(c => c.o && (c.f.e || []).length && (!cell || c.o.id !== cell.id) && life.inScan(c.o.lat, c.o.lng) && !hiddenCell(c.o.id));
  const figAt = c => k => { const m = k === 'pin' ? c.o : c.f.n[k] || (c.f.c || {})[k]; if (!m) return null; const p = map.project([m.lng, m.lat]); return { x: p.x, y: p.y }; };
  function drawSaved(ctx, now) {
    if (S.mode === 'sig') return;
    for (const c of figCells()) { const press = new Set(PRESSURES[lifeOf(c.o)] || []); const mn = k => { const m = c.f.n[k]; return m && { t: m.t, harm: (m.h || []).filter(r => press.has(r)) }; };
      lines(ctx, c.f.e, figAt(c), now, (e, i) => songT.get(`${c.id}|${i}`), (e, i, t0) => (t0 != null && now - t0 > -50 && now - t0 < 1400 ? 1 : 0.34), null, 1, hotIn(mn)); }
  }
  /* each figure its own register, so the figures in one song are told apart */
  const REG = [1, 1.5, 0.75, 2, 1.125];
  /* one figure as notes: each string plucked in the order it was tied, and the knot at its end answering in its own sound */
  function figSeq(c, t0, reg, seq, now, open) {
    const at = k => (k === 'pin' ? c.o : c.f.n[k] || (c.f.c || {})[k] || (open ? nodes.get(k) : null));
    const panOfLL = (lat, lng) => clamp(map.project([lng, lat]).x / (innerWidth || 1) * 2 - 1, -1, 1); let t = t0, n = 0;
    c.f.e.slice(0, 24).forEach((e, i) => {
      const p = at(e[0]), q = at(e[1]); if (!p || !q) return; const L = clamp(haversine(p.lat, p.lng, q.lat, q.lng) / 600, 0, 1); const f = noteOf(L) * reg; const pan = panOfLL(q.lat, q.lng);
      seq.push({ f, t, pan, lat: q.lat, lng: q.lng });
      const sp = soundOf(q.t ? q : { t: 'pin', g: lifeOf(c.o) }); const d = snd.describe(sp);
      seq.push({ spec: sp, f, t: t + 0.14, v: 0.85, pan, quiet: true });
      if (open) plucks.set(eKey(e), now + t * 1000); else songT.set(`${c.id}|${i}`, now + t * 1000);
      t += clamp(d.len * 0.85, 0.55, 1.1); n++;
    });
    /* each tune comes home to its own life, softly */
    if (n) { seq.push({ spec: { g: lifeOf(c.o) }, f: SCALE[0] * reg * 2, t, v: 0.6, pan: panOfLL(c.o.lat, c.o.lng), lat: c.o.lat, lng: c.o.lng }); t += 1.1; }
    return t;
  }
  function song() {
    const seq = []; let t = 0; const c0 = S.scan; const now = performance.now(); songT.clear();
    const cells = figCells().sort((a, b) => bearing(c0.lat, c0.lng, a.o.lat, a.o.lng) - bearing(c0.lat, c0.lng, b.o.lat, b.o.lng));
    const all = cell && fig.e.length ? [{ id: cell.id, o: cell, f: fig, open: true }, ...cells] : cells;
    all.forEach((c, ci) => { if (t < 60) t = figSeq(c, t, REG[ci % REG.length], seq, now, !!c.open); });
    /* no strings yet: the lives the radar has found, each in its own sound, in the order the hand meets them */
    if (!seq.length) {
      life.items.filter(it => it.inS && life.seen().has(it.o.id) && life.shown(it) && !it.o.hist).sort((a, b) => a.sb - b.sb).slice(0, 16).forEach((it, i) => { const sp = { g: lifeOf(it.o) }; seq.push({ spec: sp, f: SCALE[(i * 3) % SCALE.length], t, v: 0.8, pan: clamp(it.x / (innerWidth || 1) * 2 - 1, -1, 1), lat: it.lat, lng: it.lng }); t += clamp(snd.describe(sp).len * 0.7, 0.4, 0.9); });
    }
    songUntil = now + t * 1000 + 1600; snd.song(seq); return seq.filter(n => n.lat != null).map(n => ({ ...n, at: now + n.t * 1000 }));
  }
  /* the open figure alone, as a song */
  function playOpen() { if (!cell || !fig.e.length) { strum(1); return []; } const seq = []; const now = performance.now(); const t = figSeq({ id: cell.id, o: cell, f: fig }, 0, 1, seq, now, true); songUntil = now + t * 1000 + 1200; snd.song(seq); life.redraw(); return seq; }
  /* ───────── constellations: every figure, named, kept, listed on NOW ───────── */
  const nameFor = (o, f) => (f && f.name) || (o ? `${nameOf(o)} · ${title(placeOf(o))}` : 'A constellation');
  function list() {
    const all = Object.entries(FIGS).filter(([, f]) => (f.e || []).length).map(([id, f]) => {
      const o = S.byId.get(idOf(id)); const keys = [...new Set(f.e.flat())].filter(k => k !== 'pin'); const m = k => f.n[k] || (f.c || {})[k] || {};
      const people = keys.filter(k => ['biz', 'group'].includes(m(k).t) || (m(k).t === 'custom' && m(k).kind === 'person') || m(k).hum).length;
      const lives = keys.filter(k => m(k).t === 'life' && !m(k).hum).length, water = keys.filter(k => m(k).t === 'water').length;
      return { id: idOf(id), o, f, name: nameFor(o, f), keys, people, lives, water, edges: f.e.length, born: f.born || f.t, t: f.t };
    }).filter(c => c.o).sort((a, b) => b.t - a.t);
    /* knots shared with other constellations: the web between webs */
    const by = new Map(); for (const c of all) for (const k of c.keys) { if (/^(k:|s:)/.test(k)) continue; if (!by.has(k)) by.set(k, []); by.get(k).push(c.id); }
    for (const c of all) { const sh = new Map(); for (const k of c.keys) for (const id of by.get(k) || []) if (id !== c.id) { if (!sh.has(id)) sh.set(id, []); sh.get(id).push(k); } c.shared = [...sh.entries()].map(([id, ks]) => ({ id, ks, name: (all.find(x => x.id === id) || {}).name || '' })); }
    return all;
  }
  function rename(id, name) { const f = FIGS[id]; if (!f) return; const t = String(name || '').trim().slice(0, 48); if (t && t !== nameFor(S.byId.get(idOf(id)), {})) f.name = t; else delete f.name; store.set('da.figs.v1', FIGS); if (cell && String(cell.id) === String(id)) fig.name = f.name || ''; }
  /* a constellation drawn as a star chart: the life at the centre ringed, people as small diamonds, lives as dots */
  function chartOf(id, size = 56) {
    const f = FIGS[id] || (cell && String(cell.id) === String(id) ? fig : null); const o = S.byId.get(idOf(id)); if (!f || !o) return '';
    const pts = { pin: { x: 0, y: 0, t: 'pin' } }; const kx = Math.cos(o.lat * Math.PI / 180);
    for (const k of new Set(f.e.flat())) { if (k === 'pin') continue; const m = f.n[k] || (f.c || {})[k]; if (m) pts[k] = { x: (m.lng - o.lng) * kx, y: -(m.lat - o.lat), t: m.t }; }
    const ext = Math.max(1e-5, ...Object.values(pts).map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))); const s = (size / 2 - 6) / ext; const c = size / 2;
    const P = k => pts[k] && [c + pts[k].x * s, c + pts[k].y * s];
    const ln = f.e.map(([a, b]) => { const p = P(a), q = P(b); return p && q ? `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}` : ''; }).join('');
    const dots = Object.entries(pts).map(([k, p]) => { const [x, y] = P(k); return p.t === 'pin' ? `<circle cx="${x}" cy="${y}" r="3.2" fill="none" stroke="currentColor" stroke-width="1.2"/>` : p.t === 'biz' || p.t === 'group' ? `<path d="M${x} ${(y - 2.4).toFixed(1)}l2.4 2.4-2.4 2.4-2.4-2.4z" fill="currentColor"/>` : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="currentColor"/>`; }).join('');
    return `<svg class="chart" viewBox="0 0 ${size} ${size}" aria-hidden="true"><path d="${ln}" fill="none" stroke="currentColor" stroke-width=".8" opacity=".7"/>${dots}</svg>`;
  }
  /* the whole web at once: every string lit, every knot in view */
  function glow() { glowUntil = performance.now() + 2600; strum(1); life.redraw(); }
  function extent() {
    if (!cell) return null; const ks = [...new Set(fig.e.flat())]; const pts = ks.map(k => (k === 'pin' ? cell : nodes.get(k) || fig.n[k] || fig.c[k])).filter(Boolean); if (pts.length < 2) return null;
    return [[Math.min(...pts.map(p => p.lng)), Math.min(...pts.map(p => p.lat))], [Math.max(...pts.map(p => p.lng)), Math.max(...pts.map(p => p.lat))]];
  }
  /* its origin story: the strings drawn again in the order they were tied, each with its sound, and a line that says which */
  function traceIt() {
    if (!cell || !fig.e.length) return; const now = performance.now(); const step = 900; const n = Math.min(fig.e.length, 24);
    trace = { t0: now + 250, step, end: now + 250 + n * step + 900, n };
    const seq = []; fig.e.slice(0, n).forEach((e, i) => { const q = nodes.get(e[1]) || fig.n[e[1]] || fig.c[e[1]]; const L = lenOf(e); const f = noteOf(L); const t = 0.25 + i * step / 1000; seq.push({ f, t: t + 0.05, pan: panOf(e[1]) }); if (q) seq.push({ spec: soundOf(q.t ? q : { g: 'paw' }), f, t: t + 0.2, v: 0.85, pan: panOf(e[1]) }); plucks.set(eKey(e), now + (t + 0.05) * 1000); });
    snd.song(seq); songUntil = trace.end; life.redraw();
  }
  function traceCaption(now) {
    if (!capEl || !trace) return; const i = clamp(Math.floor((now - trace.t0) / trace.step), 0, trace.n - 1); if (now < trace.t0) return;
    if (capEl.dataset.i === String(i) && !capEl.hidden) return; capEl.dataset.i = String(i);
    const [a, b] = fig.e[i]; const nm = k => (k === 'pin' ? nameOf(cell) : labelOf(k) || (nodes.get(k) || {}).n || ''); const ts = fig.ts[eKey(fig.e[i])];
    capEl.innerHTML = `<b class="mono">${i + 1}/${trace.n}</b><span>${esc(nm(a))} <i>→</i> ${esc(nm(b))}</span>${ts ? `<small class="mono">${fmtStamp(ts)}</small>` : ''}`; capEl.hidden = false;
  }
  /* one constellation as a song, from the list, wherever it is */
  function playFig(id) {
    const f = FIGS[id] || (cell && String(cell.id) === String(id) ? fig : null); const o = S.byId.get(idOf(id)); if (!f || !o) return 0;
    const seq = []; const now = performance.now(); const t = figSeq({ id: idOf(id), o, f, open: !!cell && cell.id === o.id }, 0, 1, seq, now, !!cell && cell.id === o.id); songUntil = now + t * 1000 + 1000; snd.song(seq); life.redraw(); return t;
  }
  return { open, seed, close, refresh, draw, drawSig, drawSaved, showSig, knotAt, hit, tap, join, act, joinAll, untie, undo, reset, restore, strum, busy, pos, lifeNode, tied, reach, ledgerOf, tagHTML, snapshot,
    peek, unpeek, peekOut, bringIn, ground, place, song, playOpen, labelOf, included, setInclude, setLabel, removeKnot, focusOn, unfocus, soundOf, scoreSVG,
    list, rename, chartOf, glow, extent, traceIt, playFig, nameFor,
    get cell() { return cell; }, get fig() { return fig; }, get nodes() { return nodes; }, get peeked() { return peekKey; }, get ghost() { return ghost; }, get focus() { return focus; }, get tracing() { return !!trace; }, inFig };
})();


/* ════════════════════════════════════════════════════════════════════
   THE CARD — the photograph large, the name, what El Niño does to this life and how long until it lands,
   something to learn, the strings tied so far and a note. DIRECT RESPONSE turns it over to a blank slip of four lines;
   what else it carries is chosen before it is issued, and the slip issued becomes a signal.
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
  S.sel = null; S.mode = null; S.place = null; S.tribeSel = null; S.sig = null; S.issued = null;
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
  if (f === 'wish') heroWord('receipt', 'DIRECT ACTION');
  else if (f === 'signal') heroWord('print', 'PRINT');
  else if (f === 'place') { heroWord('check', 'PLACE'); altWord('next', 'NOTICED'); altBtn.hidden = false; }
  else if (S.mode === 'tribe') heroWord('out', 'JOIN');
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
function select(id) {
  const o = S.byId.get(id); if (!o) return;
  const was = S.sel; if (S.mode) closeRecord('switch'); S.sel = id; S.mode = 'ping'; S.place = null; S.tribeSel = null; S.sig = null; S.issued = null;
  strings.open(o); openRecord();
  if (S.mapReady) map.easeTo({ center: [o.lng, o.lat], zoom: Math.max(map.getZoom(), 15.4), offset: sheetOffset(), duration: reduced() ? 0 : 700 });
  life.hover(null); life.select();
  fillFront(o); showFace('front');
  if (was !== id) { snd.tick(1900); buzz(6); }
  if (!o.ob) placesAround(o.lat, o.lng, rangeOf(o) + 80);
  try { history.replaceState(null, '', '#' + (hashOf(o) || '')); } catch (e) { /* file:// */ }
}
function refreshRecord() {
  if (S.mode === 'ping') { const o = S.byId.get(S.sel); if (!o) return; if (face === 'front') fillFront(o, true); else if (face === 'wish') fillKnots(); }
  else if (S.mode === 'tribe') { const t = S.byId.get(S.tribeSel); if (t) fillTribe(t, true); }
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
  $('#r-do').innerHTML = urgentOf(o);
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
$('#r-do').addEventListener('click', e => {
  const b = e.target.closest('[data-do]'); if (!b) return; tick();
  if (b.dataset.do === 'areas') { prefs.areas = !prefs.areas; savePrefs(); b.setAttribute('aria-pressed', String(prefs.areas)); life.redraw(); }
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
  const o = S.byId.get(id); if (!o) return; select(id);
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
$('#r-strings').addEventListener('click', e => { const c = e.target.closest('[data-cell]'); if (c) { const v = c.dataset.cell; select(/^\d+$/.test(v) ? +v : v); } });

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
  $('#w-cap').textContent = none ? (list.length ? 'FIG. 1 · NONE' : 'FIG. 1 · NO OPEN PHOTOGRAPH') : `FIG. 1 · ${wishCredit(c, o)}`;
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
  if (face === 'signal') { const s = S.issued || S.signals.find(x => x.key === S.sig); if (s) printSlip(s); return; }
  if (S.mode === 'tribe') { const t = S.byId.get(S.tribeSel); if (t) window.open(t.link, '_blank', 'noopener'); return; }
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
/* issued: the slip feeds out of the printer and becomes a signal */
async function issue(o) {
  const L = Object.fromEntries(WKEYS.map(k => [k, $('#w-' + k).value.trim()]));
  const missing = WKEYS.find(k => !L[k]); if (missing) { nudge($('#w-' + missing)); return; }
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
/* placed: the record joins the map; DIRECT RESPONSE goes straight on to the slip */
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

/* ════════════════════════════════════════════════════════════════════
   SIGNALS — a slip issued from a cell, set like an archive record: a photograph in black and white as half of it,
   the life, where and when, its statement, four lines, the relations tied, a note, a name and a code.
   It leaves through a 58 mm printer, raw ESC/POS, a pocket 1-bit printer, the Game Boy Printer, a mesh radio,
   a pager or a link, and comes back in by pasting any of them.
   ════════════════════════════════════════════════════════════════════ */
function portalBase() {
  if (CONFIG.PORTAL_URL) return CONFIG.PORTAL_URL.replace(/#.*$/, '');
  if (/^https?:$/.test(location.protocol) && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)) return location.origin + location.pathname;
  return '';
}
const CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function codeFor(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h >>>= 0; let s = ''; for (let i = 0; i < 4; i++) { s += CROCK[h % 32]; h = Math.floor(h / 32); } return 'DA-' + s; }
/* opt: statement (what it says, or nothing), note (the notes, when kept), img (the photograph chosen) */
function makeSignal(o, L, who, opt = {}) {
  const at = Date.now(); const pin = pinData(o); const fig = strings.snapshot(); const st = opt.statement != null ? opt.statement : '';
  const brief = (webBriefs(o, strings.tied(), 1)[0] || {}).id || null; const img = opt.img && opt.img.k !== 'none' ? opt.img : null;
  return { v: 1, code: codeFor(`${at}|${pin.lat}|${pin.lng}|${L.h}|${S.me.dev}`), at, pin, threat: st.slice(0, 320), when: st ? whenWord(o) : '', deg: st ? degOf(o) : 0, lines: L, nodes: fig.nodes, edges: fig.edges, ...(opt.note ? { note: opt.note.slice(0, 280) } : {}), ...(brief ? { brief } : {}), ...(img ? { img: img.k === 'inat' ? { k: 'inat', u: img.u, a: img.a || '', l: img.l || '', oid: img.oid || null } : { k: 'own', ...(img.a ? { a: img.a } : {}) } } : {}), who: who || '' };
}
/* ───────── carrying it: a link, compact enough for a QR code on a 58 mm slip ───────── */
const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))));
const INAT_PHOTOS = 'https://inaturalist-open-data.s3.amazonaws.com/photos/';
const photoKey = u => { const m = String(u || '').match(/\/photos\/(\d+)\/\w+\.(\w+)/); return m ? `${m[1]}.${m[2]}` : ''; };
/* the statement a life opens with, wherever the app runs: a link carries a flag instead of the words when it is unchanged */
const stOf = p => { const h = HEROES.find(x => x.n && x.n === p.n); return (h && h.st) || STATEMENT[p.g] || ''; };
function packSignal(s) {
  const p = s.pin || {}; const im = s.img && s.img.k === 'inat' && photoKey(s.img.u) ? [photoKey(s.img.u), s.img.a || '', s.img.l || '', s.img.oid || 0].join('|') : '';
  return b64u(JSON.stringify({ c: s.code, t: Math.round(s.at / 60000).toString(36), p: [p.lat, p.lng, p.g || '', p.cn || '', p.n || '', p.place || '', p.id || 0], l: WKEYS.map(k => (s.lines || {})[k] || ''), k: (s.nodes || []).map(n => [n.k, n.t, n.n, (n.t === 'biz' ? ((n.h || [])[0] ? '!' + n.h[0] : n.role) : n.g || n.kind) || '', n.b, n.d]), e: s.edges || [], ...(s.threat ? { s: s.threat === stOf(p) ? 1 : s.threat } : {}), ...(s.note ? { o: s.note } : {}), ...(im ? { i: im } : {}), ...(s.brief ? { b: s.brief } : {}), ...(s.who ? { y: s.who } : {}) }));
}
function unpackSignal(x) {
  const j = JSON.parse(unb64u(x)); const [lat, lng, g, cn, n, place, id] = j.p || [];
  if (!/^DA-[0-9A-Z]{4}$/.test(j.c || '') || !Number.isFinite(+lat) || !Number.isFinite(+lng)) throw new Error('signal');
  const pin = { lat: +lat, lng: +lng, g: g || 'paw', cn: cn || '', n: n || '', place: place || suburbAt(+lat, +lng), id: +id || null };
  const nodes = (j.k || []).map(([k, t, nn, r, b, d]) => ({ k, t, n: nn, ...(t === 'biz' ? (String(r).startsWith('!') ? { role: r.slice(1), h: [r.slice(1)] } : { role: r, h: [] }) : t === 'life' ? { g: r } : t === 'group' ? { kind: r } : {}), b: +b, d: +d }));
  const [ik, ia, il, io] = String(j.i || '').split('|'); const img = ik && /^\d+\.\w+$/.test(ik) ? { k: 'inat', u: `${INAT_PHOTOS}${ik.replace('.', '/medium.')}`, a: ia || '', l: il || '', oid: +io || null } : null;
  return { v: 1, code: j.c, at: parseInt(j.t, 36) * 60000 || Date.now(), pin, threat: j.s === 1 ? stOf(pin) : j.s ? String(j.s).slice(0, 320) : '', when: '', deg: 0, lines: Object.fromEntries(WKEYS.map((k, i) => [k, String((j.l || [])[i] || '').slice(0, SIG.line)])), nodes, edges: (j.e || []).filter(e => Array.isArray(e) && e.length === 2), ...(j.o ? { note: String(j.o).slice(0, 280) } : {}), ...(img ? { img } : {}), ...(j.b ? { brief: j.b } : {}), who: j.y || '' };
}
const linkOf = s => { const b = portalBase(); return b ? `${b}#x=${packSignal(s)}` : ''; };
/* ───────── plain text: a mesh message, a pager line, a slip in 32 columns ───────── */
const ascii = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/°/g, '').replace(/×/g, 'x').replace(/·/g, '-').replace(/[^\x20-\x7E\n]/g, '');
const bytes = t => new TextEncoder().encode(t).length;
const NAME_UP = s => String((s.pin && (s.pin.cn || s.pin.n)) || '').toUpperCase();
/* a mesh message, 200 bytes at most: the code, the life, where it is, and the four lines, the longest cut first.
   The lines carry no letters: W.I.S.H. is how they are written, not what is sent */
function meshText(s, max = SIG.mesh) {
  const L = { ...(s.lines || {}) }; const p = s.pin || {};
  const head = `${s.code} ${NAME_UP(s)}`; const where = `${(+p.lat).toFixed(4)},${(+p.lng).toFixed(4)}`;
  const build = () => [head, where, ...WKEYS.map(k => L[k] || '')].join('\n');
  let t = build(); let guard = 400;
  while (bytes(t) > max && guard--) {
    const k = ['i', 'w', 's', 'h'].sort((a, b) => (L[b] || '').length - (L[a] || '').length)[0]; const w = (L[k] || '').replace(/…$/, '').split(' ');
    if (w.length <= 1) { L[k] = (L[k] || '').slice(0, -2) + '…'; } else { w.pop(); L[k] = w.join(' ') + '…'; }
    t = build();
  }
  return t;
}
/* a pager line, 80 plain characters at most: the code, the life, and how it works */
function pagerText(s, max = SIG.pager) {
  let t = ascii(`${s.code} ${NAME_UP(s)}: ${(s.lines || {}).h || ''}`); if (t.length > max) t = t.slice(0, max - 3).replace(/\s+\S*$/, '') + '...'; return t;
}
const wrap = (t, n, indent = '') => { const out = []; let line = ''; for (const w of String(t || '').split(/\s+/).filter(Boolean)) { if (!line) line = w; else if ((line + ' ' + w).length <= n - (out.length ? indent.length : 0)) line += ' ' + w; else { out.push(line); line = w; } } if (line) out.push(line); return out.map((l, i) => (i ? indent + l : l)); };
/* the story the relations tell: what harms the life, what cares for it, and what else is part of it */
const CARE_FAMS = ['circular', 'artists', 'third', 'network', 'brand'];
const harmsOfNode = n => (n.t !== 'biz' ? [] : Array.isArray(n.harm) ? n.harm : Array.isArray(n.h) ? n.h : onNotice(n.role) ? [n.role] : []);
const relKind = n => (harmsOfNode(n).length ? 'harm' : n.t === 'biz' && !onNotice(n.role) && CARE_FAMS.includes(n.fam || (ROLES[n.role] || {}).cat) ? 'care' : 'also');
const REL_G = { harm: 'HARM', care: 'CARE', also: 'ALSO' };
const relOrder = nodes => ['harm', 'care', 'also'].flatMap(g => nodes.filter(n => relKind(n) === g));
const urlOf = n => n.u || n.url || ((n.t === 'biz' && PLACES.find(p => p.n === n.n)) || {}).url || '';
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
/* "sells pesticides"; "repair"; "water" */
const relPhrase = n => { const hs = harmsOfNode(n); return hs.length ? hs.slice(0, 2).map(r => plainN(r, 1)).join(', ') : relWord(n).toLowerCase(); };
/* what each relation is, in a word */
const relWord = n => n.t === 'biz' ? (ROLES[(n.h || [])[0]] || ROLES[n.role] || {}).w || '' : n.t === 'group' ? 'GROUP' : n.t === 'water' ? 'WATER' : n.t === 'custom' ? ({ place: 'PLACE', person: 'PERSON', idea: 'IDEA' })[n.kind] || '' : n.t === 'life' ? String(M.KINDS[n.g] || '').toUpperCase() : '';
const figCredit = s => { const im = s.img || {}; return im.k === 'inat' ? [im.a ? im.a.replace(/^\(c\)\s*/i, '© ').replace(/,\s*some rights reserved/i, '') : '', im.oid ? `iNaturalist ${im.oid}` : 'iNaturalist'].filter(Boolean).join(' · ') : im.k === 'own' ? im.a || 'Photograph by the issuer' : ''; };
/* the slip in 32 columns, as a thermal printer's first font sets it */
function slipText(s, cols = 32) {
  const rule = '-'.repeat(cols); const p = s.pin || {}; const out = [];
  const pad = (a, b) => a + ' '.repeat(Math.max(1, cols - a.length - b.length)) + b;
  const field = (k, v) => wrap(v, cols - 7).map((l, i) => (i ? '       ' : (k + '       ').slice(0, 7)) + l);
  out.push(pad('DIRECT ACTION', s.code), fmtStamp(s.at), rule);
  if (s.img && s.img.k !== 'none') out.push(...wrap(`FIG. 1  ${figCredit(s)}`, cols, '        '), rule);
  out.push(...wrap(NAME_UP(s), cols)); if (p.n && p.n !== p.cn) out.push(...wrap(p.n, cols));
  out.push(...field('SITE', `${p.place || ''} ${(+p.lat).toFixed(4)} ${(+p.lng).toFixed(4)}`.trim()));
  if (s.when) out.push(...field('WINDOW', s.when));
  if (s.threat) { out.push(rule); out.push(...wrap(s.threat, cols)); }
  out.push(rule);
  for (const k of WKEYS) out.push(...wrap((s.lines || {})[k] || '', cols));
  const rels = relOrder(s.nodes || []);
  if (rels.length) { out.push(rule, 'RELATIONS'); let g0 = ''; rels.forEach((n, i) => { const g = relKind(n); if (g !== g0) { out.push(`${REL_G[g]} · ${rels.filter(x => relKind(x) === g).length}`); g0 = g; } out.push(...wrap(`${pad2(i + 1)} ${n.n}`, cols, '   ')); const u = hostOf(urlOf(n)); out.push(...wrap(`${relPhrase(n)}${u ? ` · ${u}` : ''}`, cols - 3).map(l => '   ' + l)); }); }
  if (s.note) { out.push(rule); out.push(...field('NOTE', s.note)); }
  if (s.who) out.push(rule, `- ${s.who}`);
  return ascii(out.join('\n'));
}
/* ───────── the QR code: the link when the app is hosted, else the mesh message itself ───────── */
function qrOf(text, ec = 'L') { try { const qr = qrcode(0, ec); qr.addData(unescape(encodeURIComponent(text))); qr.make(); return qr; } catch (e) { return null; } }
const qrText = s => linkOf(s) || meshText(s);
function renderQR(host, text) {
  const qr = qrOf(text); if (!qr) { host.innerHTML = ''; return; } const n = qr.getModuleCount(), N = n + 4; let p = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) p += `M${c + 2} ${r + 2}h1v1h-1z`;
  host.innerHTML = `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="QR code"><path d="${p}" fill="#000"/></svg>`;
}

/* ───────── the photograph: chosen before the slip is issued, printed in black and white ───────── */
const IMGS = store.get('da.img.v1', {});      /* cell → the photograph chosen */
const OWN = store.get('da.own.v1', {});       /* a cell's or a signal's own photograph, small, on this device */
const saveImgs = () => store.set('da.img.v1', IMGS);
function saveOwn() { const ks = Object.keys(OWN); while (ks.length > 14) delete OWN[ks.shift()]; while (!store.set('da.own.v1', OWN) && Object.keys(OWN).length) delete OWN[Object.keys(OWN)[0]]; }
/* every photograph this life could print with: its own, then the same kind seen nearby; only licences that allow a black and white version */
function photoChoices(o) {
  const out = []; const seen = new Set(); const sub = subjectOf(o);
  const add = (x, ph) => { if (!ph || !ph.u || !licAdaptable(ph.l) || seen.has(ph.u)) return; seen.add(ph.u); out.push({ k: 'inat', u: ph.u, a: ph.a || '', l: ph.l, oid: typeof x.id === 'number' ? x.id : null }); };
  if (o.photo) out.push({ k: 'rec' });
  if (sub && sub.ph) add(sub, sub.ph); for (const ph of (sub && sub.phs) || []) add(sub, ph);
  const tn = sub && sub.tx && sub.tx.n; if (tn) [...S.obs, ...S.hist].filter(x => x.tx && x.tx.n === tn && x !== sub && x.ph).sort((a, b) => haversine(o.lat, o.lng, a.lat, a.lng) - haversine(o.lat, o.lng, b.lat, b.lng)).slice(0, 14).forEach(x => add(x, x.ph));
  return out;
}
function imgChoice(o) {
  const c = IMGS[o.id]; const all = photoChoices(o);
  if (c && (c.k === 'none' || (c.k === 'own' && OWN[o.id]) || (c.k === 'inat' && all.some(x => x.u === c.u)) || (c.k === 'rec' && o.photo))) return c;
  return all[0] || { k: 'none' };
}
const imgSrc = (c, key, o, big) => (c.k === 'inat' ? photoURL(c.u, big ? 'large' : 'medium') : c.k === 'own' ? OWN[key] || '' : c.k === 'rec' && o ? o.photo || '' : '');
const sigSrc = (s, big) => (s.img ? imgSrc(s.img, s.code, null, big) : '');
/* the contrast stretched, so a photograph holds up as dots */
function autolevel(id) {
  const d = id.data, n = d.length / 4; const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2])]++;
  let lo = 0, hi = 255, acc = 0; for (; lo < 255 && (acc += hist[lo]) < n * 0.02; lo++); acc = 0; for (; hi > 0 && (acc += hist[hi]) < n * 0.02; hi--);
  const k = 255 / Math.max(24, hi - lo); for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) d[i * 4 + c] = clamp((d[i * 4 + c] - lo) * k, 0, 255);
  return id;
}
const BW = new Map();
/* a photograph cut to a frame and dithered: two inks for a thermal head, four greys for a Game Boy */
async function bwCanvas(src, W, H, levels = 2) {
  const key = `${src.slice(0, 120)}|${src.length}|${W}|${H}|${levels}`; if (BW.has(key)) return BW.get(key);
  const im = await loadImage(src, !/^data:/.test(src));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight); x.drawImage(im, (W - im.naturalWidth * sc) / 2, (H - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc);
  x.putImageData(dither(autolevel(x.getImageData(0, 0, W, H)), levels), 0, 0);
  if (BW.size > 48) BW.clear(); BW.set(key, cv); return cv;
}
/* the frame is as tall as everything under it: the photograph is half the slip */
function fitFig(host, cap) {
  const fig = host.querySelector('.sl-fig'); const body = host.querySelector('.sl-body'); if (!fig || !body || fig.classList.contains('none') || fig.classList.contains('blank')) return;
  const W = fig.clientWidth || 200; fig.style.height = `${Math.round(clamp(body.offsetHeight, W * 0.8, W * cap))}px`;
}
async function fillFig(host, s, press) {
  const fig = host.querySelector('.sl-fig'); const im = host.querySelector('.sl-img'); if (!fig || !im) return;
  const src = sigSrc(s, press); if (!src) { fig.classList.add('none'); return; }
  /* a face still turning over has no size yet: wait for it */
  for (let i = 0; i < 60 && !fig.clientWidth; i++) await new Promise(r => setTimeout(r, 25));
  if (!fig.clientWidth || !fig.isConnected) return;
  fitFig(host, press ? 1.6 : 1.2); const W = fig.clientWidth, H = fig.clientHeight; const k = press ? 416 / Math.max(1, W) : Math.min(2, devicePixelRatio || 1);
  try { const cv = await bwCanvas(src, Math.round(W * k), Math.round(H * k), 2); im.src = cv.toDataURL('image/png'); im.classList.remove('grey'); }
  catch (e) { im.src = src; im.classList.add('grey'); }   /* a host that will not share its pixels: grey by the browser instead */
}
/* the constellation, drawn as it sits on the ground: bearings and distances from the life */
/* each point where it lies around the life, numbered as the index numbers it */
function chartPts(s) { const pts = { pin: { x: 0, y: 0, t: 'pin' } }; relOrder(s.nodes || []).forEach((n, i) => { const r = n.b * Math.PI / 180; pts[n.k] = { x: Math.sin(r) * n.d, y: -Math.cos(r) * n.d, t: n.t, g: relKind(n), no: i + 1 }; }); return pts; }
const chartFit = (pts, half, pad) => { const ext = Math.max(1, ...Object.values(pts).map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))); return (half - pad) / ext; };
function chartSVG(s, size = 64) {
  const pts = chartPts(s); const k = chartFit(pts, size / 2, 7), c = size / 2; const P = key => pts[key] && [c + pts[key].x * k, c + pts[key].y * k]; const f = v => v.toFixed(1);
  const seg = hot => (s.edges || []).filter(([a, b]) => ((pts[a] || {}).g === 'harm' || (pts[b] || {}).g === 'harm') === hot).map(([a, b]) => { const p = P(a), q = P(b); return p && q ? `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}` : ''; }).join('');
  const dots = Object.entries(pts).map(([key, p]) => { const [x, y] = P(key);
    const mk = p.t === 'pin' ? `<circle cx="${f(x)}" cy="${f(y)}" r="2.8" fill="#fff" stroke="#000" stroke-width="1"/>` : p.t === 'biz' || p.t === 'group' ? `<path d="M${f(x)} ${f(y - 2.4)}l2.4 2.4-2.4 2.4-2.4-2.4z" fill="${p.g === 'harm' ? '#000' : '#fff'}" stroke="#000" stroke-width=".8"/>` : `<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="#000"/>`;
    return mk + (p.no ? `<text x="${f(x + 3)}" y="${f(y - 2.6)}" font-size="4.6" font-family="IBM Plex Mono, monospace" fill="#000">${p.no}</text>` : ''); }).join('');
  const solid = seg(false), dashed = seg(true);
  return `<svg class="sl-chart" viewBox="0 0 ${size} ${size}" aria-label="The constellation">${solid ? `<path d="${solid}" fill="none" stroke="#000" stroke-width=".7"/>` : ''}${dashed ? `<path d="${dashed}" fill="none" stroke="#000" stroke-width=".7" stroke-dasharray="1.6 1.2"/>` : ''}${dots}</svg>`;
}
function drawChart(x, s, cx, cy, size, lw = 1) {
  const pts = chartPts(s); const k = chartFit(pts, size / 2, 7 * lw); const P = key => pts[key] && [cx + pts[key].x * k, cy + pts[key].y * k];
  x.save(); x.strokeStyle = '#000'; x.fillStyle = '#000'; x.lineWidth = lw;
  for (const hot of [false, true]) { x.setLineDash(hot ? [2 * lw, 1.6 * lw] : []); x.beginPath(); for (const [a, b] of s.edges || []) { if (((pts[a] || {}).g === 'harm' || (pts[b] || {}).g === 'harm') !== hot) continue; const p = P(a), q = P(b); if (p && q) { x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); } } x.stroke(); }
  x.setLineDash([]); x.font = `500 ${Math.max(7, Math.round(6.5 * lw))}px "IBM Plex Mono", monospace`; x.textBaseline = 'alphabetic';
  for (const [key, p] of Object.entries(pts)) { const [px, py] = P(key); x.beginPath();
    if (p.t === 'pin') { x.arc(px, py, 3 * lw, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); x.stroke(); x.fillStyle = '#000'; }
    else if (p.t === 'biz' || p.t === 'group') { const r = 2.6 * lw; x.moveTo(px, py - r); x.lineTo(px + r, py); x.lineTo(px, py + r); x.lineTo(px - r, py); x.closePath(); if (p.g === 'harm') x.fill(); else { x.fillStyle = '#fff'; x.fill(); x.stroke(); x.fillStyle = '#000'; } }
    else { x.arc(px, py, 1.8 * lw, 0, Math.PI * 2); x.fill(); }
    if (p.no && lw >= 0.9) x.fillText(String(p.no), px + 3.4 * lw, py - 2.8 * lw); }
  x.restore();
}
/* ───────── the slip on the page, set like an archive record ───────── */
function slipHTML(s, blank) {
  const p = s.pin || {}; const hasImg = !blank && s.img && s.img.k !== 'none';
  const rels = relOrder(s.nodes || []); const nOf = g => rels.filter(x => relKind(x) === g).length;
  return `<div class="sl-perf" aria-hidden="true"></div><header class="sl-head mono"><span><b class="sl-code">${esc(s.code || 'DA-····')}</b>${s.ex ? '<i class="ex">EX</i>' : ''}</span><span class="sl-time">${blank ? '__.__.__ __:__' : fmtStamp(s.at)}</span></header>`
    + (blank ? `<figure class="sl-fig blank"><span class="mono">FIG. 1</span></figure>` : hasImg ? `<figure class="sl-fig"><img class="sl-img" alt=""><figcaption class="sl-cap mono">FIG. 1 · ${esc(figCredit(s))}</figcaption></figure>` : '')
    + `<div class="sl-body"><div class="sl-life">${blank ? '<b>&nbsp;</b><span class="mono ln"></span>' : `<b>${esc(NAME_UP(s))}</b>${p.n && p.n !== p.cn ? `<i>${esc(p.n)}</i>` : ''}<dl class="sl-meta mono"><dt>SITE</dt><dd>${esc(p.place || '')} · ${(+p.lat).toFixed(4)} ${(+p.lng).toFixed(4)}</dd>${s.when ? `<dt>WINDOW</dt><dd>${esc(s.when)}${s.deg >= 2 ? ` · ${DEG[s.deg]}` : ''}</dd>` : ''}</dl>`}</div>`
    + (s.threat ? `<p class="sl-threat">${esc(s.threat)}</p>` : '')
    + `<ol class="sl-wish poem">${WKEYS.map(k => `<li>${blank ? `<small>${esc(WISH[k][0].toLowerCase())}</small>` : `<span>${esc((s.lines || {})[k] || '')}</span>`}</li>`).join('')}</ol>`
    + (rels.length ? `<div class="sl-rel"><h5 class="sl-h">RELATIONS</h5><ol class="sl-knots">${rels.map((n, i) => { const g = relKind(n); const u = urlOf(n); const first = !i || relKind(rels[i - 1]) !== g; return `<li class="${g}"${first ? ` data-g="${REL_G[g]} · ${nOf(g)}"` : ''}><b class="mono">${pad2(i + 1)}</b><span>${esc(n.n)}${u ? ` <a class="sl-u mono" href="${esc(u)}" target="_blank" rel="noopener">${esc(hostOf(u))}</a>` : ''}</span><small${g === 'harm' ? ' class="red"' : ''}>${esc(relPhrase(n))}</small></li>`; }).join('')}</ol>${rels.length > 1 ? `<figure class="sl-fig2">${chartSVG(s, 72)}<figcaption class="mono">FIG. 2 · ${rels.length} RELATIONS · NORTH UP</figcaption></figure>` : ''}</div>` : '')
    + (s.note ? `<p class="sl-note"><b class="mono">NOTE</b> ${esc(s.note)}</p>` : '')
    + (s.who ? `<p class="sl-who mono">— ${esc(s.who)}</p>` : '')
    + `<div class="sl-qr"></div><p class="sl-foot mono">${esc(CONFIG.COUNTRY)}</p></div>`;
}
function fillSignal(s) {
  const host = $('#s-slip'); host.innerHTML = slipHTML(s); renderQR(host.querySelector('.sl-qr'), qrText(s)); fillFig(host, s, false);
  host.classList.toggle('ex', !!s.ex);
  $('#r-no').textContent = `${s.code}${s.ex ? ' · EX' : s.recv ? ' · RECEIVED' : ''}`;
  /* each machine as itself, with a link to what it is */
  $('#s-out').innerHTML = OUTPUTS.filter(m => m.k !== 'print').map(m => `<span class="out-w"><button type="button" class="out" data-out="${m.k}" data-tip="${esc(m.tip)}">${icon(m.ic)}<small>${m.w}</small></button><a class="out-ref" href="${esc(m.ref)}" target="_blank" rel="noopener" aria-label="What a ${esc(m.w)} is" data-tip="What it is">${icon('out', 'sm')}</a></span>`).join('');
  const mine = !s.ex; $('#s-acts').innerHTML = `<button type="button" class="pill" data-sa="remix">${icon('remix', 'sm')}REMIX</button><button type="button" class="pill" data-sa="pin">${icon('where', 'sm')}PIN</button>${mine ? `<button type="button" class="pill quiet" data-sa="remove">${icon('close', 'sm')}REMOVE</button>` : ''}`;
  $('#s-text').hidden = true;
}
$('#s-out').addEventListener('click', e => { const b = e.target.closest('[data-out]'); const s = S.issued || S.signals.find(x => x.key === S.sig); if (b && s) output(b.dataset.out, s, b); });
$('#s-acts').addEventListener('click', async e => {
  const b = e.target.closest('[data-sa]'); const s = S.issued || S.signals.find(x => x.key === S.sig); if (!b || !s) return; const a = b.dataset.sa; tick(1500);
  if (a === 'remix') remixSignal(s);
  if (a === 'pin' && S.mapReady) map.easeTo({ center: [s.pin.lng, s.pin.lat], zoom: Math.max(map.getZoom(), 16), offset: sheetOffset(), duration: reduced() ? 0 : 600 });
  if (a === 'remove') { await ledgerAdd({ type: 'redact', ref: s.key }); snd.snap(0); closeRecord(); }
});
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; } }
async function output(k, s, btn) {
  const pre = $('#s-text'); const show = t => { pre.hidden = false; pre.textContent = t; pre.dataset.n = k === 'mesh' ? `${bytes(t)} B` : `${t.length}`; };
  if (k === 'mesh' || k === 'pager') { const t = k === 'mesh' ? meshText(s) : pagerText(s); show(t); const ok = await copyText(t); toast(ok ? `COPIED · ${pre.dataset.n}` : pre.dataset.n); snd.tick(2100); buzz(6); return; }
  if (k === 'link') { const url = linkOf(s); const t = url || meshText(s); try { if (navigator.share && url) { await navigator.share({ title: s.code, text: (s.lines || {}).h || '', url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } show(t); toast((await copyText(t)) ? 'COPIED' : s.code); return; }
  btn.classList.add('busy'); snd.printer(700);
  try {
    if (k === 'bits') download(`${s.code}-384.png`, await slipPNG(s, 384, 2));
    if (k === 'gb') download(`${s.code}-gb-160.png`, await slipPNG(s, 160, 4));
    if (k === 'escpos') download(`${s.code}.bin`, new Blob([await escpos(s)], { type: 'application/octet-stream' }));
    snd.tear();
  } finally { btn.classList.remove('busy'); }
}
/* ───────── images for small printers: 384 dots for a 58 mm thermal head, 160 for a Game Boy printer ───────── */
const ATK = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
function dither(img, levels) {
  const d = img.data, w = img.width, h = img.height; const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255 * (d[i * 4 + 3] / 255) + (1 - d[i * 4 + 3] / 255);
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let v;
    if (levels === 2) {   /* Atkinson: an eighth of the error to six neighbours, a quarter let go: crisp, bright */
      const o = g[i] < 0.5 ? 0 : 1; const err = (g[i] - o) / 8; v = o;
      for (let j = 0; j < 6; j++) { const xx = x + ATK[j][0], yy = y + ATK[j][1]; if (xx >= 0 && xx < w && yy < h) g[yy * w + xx] += err; }
    } else { const t = (B4[(y % 4) * 4 + (x % 4)] + 0.5) / 16 - 0.5; v = clamp(Math.round(g[i] * (levels - 1) + t), 0, levels - 1) / (levels - 1); }   /* ordered, as a Game Boy camera does */
    const c = Math.round(v * 255); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = c; d[i * 4 + 3] = 255;
  }
  return img;
}
/* the slip as an image: its words set first, to learn how tall they are; then the photograph as tall as the words under it */
async function slipCanvas(s, W, levels) {
  const k = W / 384; const pad = Math.round(14 * k); const mono = (px, wt = 500) => `${wt} ${Math.max(7, Math.round(px * k))}px "IBM Plex Mono", monospace`; const sans = (wt, px) => `${wt} ${Math.max(8, Math.round(px * k))}px Poppins, sans-serif`;
  try { await document.fonts.ready; } catch (e) { /* fallback type */ }
  const T = document.createElement('canvas'); T.width = W; T.height = 6000; const x = T.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, T.height); x.fillStyle = '#000'; x.textBaseline = 'top';
  let y = Math.round(6 * k); const p = s.pin || {};
  /* words set to the width they have, measured in the face they are set in */
  const wrapPx = (t, maxW) => { const out = []; let line = ''; for (const w of String(t || '').split(/\s+/).filter(Boolean)) { const next = line ? `${line} ${w}` : w; if (!line || x.measureText(next).width <= maxW) line = next; else { out.push(line); line = w; } } if (line) out.push(line); return out; };
  const text = (t, font, lh, indent = '', at = pad) => { x.font = font; for (const l of wrapPx(t, W - pad - at)) { x.fillText(l, at, y); y += lh; } };
  const rule = () => { y += Math.round(6 * k); x.fillRect(pad, y, W - pad * 2, Math.max(1, Math.round(1.5 * k))); y += Math.round(10 * k); };
  const field = (kk, v) => { x.font = mono(11, 600); x.fillText(kk, pad, y + Math.round(2 * k)); const y0 = y; text(v, mono(13), Math.round(18 * k), '', pad + Math.round(76 * k)); if (y === y0) y += Math.round(18 * k); };
  if (s.img && s.img.k !== 'none') { text(`FIG. 1 · ${figCredit(s)}`, mono(10.5), Math.round(15 * k)); rule(); }
  text(NAME_UP(s), sans(700, 21), Math.round(25 * k)); if (p.n && p.n !== p.cn) text(p.n, sans(400, 14), Math.round(19 * k));
  y += Math.round(4 * k); field('SITE', `${p.place || ''} · ${(+p.lat).toFixed(4)} ${(+p.lng).toFixed(4)}`); if (s.when) field('WINDOW', `${s.when}${s.deg >= 2 ? ` · ${DEG[s.deg]}` : ''}`);
  if (s.threat) { rule(); text(s.threat, sans(500, 15), Math.round(20 * k)); }
  rule();
  for (const kk of WKEYS) { text((s.lines || {})[kk] || '', mono(16, 600), Math.round(21 * k)); y += Math.round(7 * k); }
  const rels = relOrder(s.nodes || []);
  if (rels.length) {
    rule(); x.font = mono(11, 600); x.fillText('RELATIONS', pad, y); y += Math.round(17 * k); let g0 = '';
    rels.forEach((n, i) => {
      const g = relKind(n); if (g !== g0) { g0 = g; y += Math.round(3 * k); x.font = mono(10, 600); x.fillText(`${REL_G[g]} · ${rels.filter(r => relKind(r) === g).length}`, pad, y); y += Math.round(15 * k); }
      x.font = mono(12, 600); x.fillText(pad2(i + 1), pad, y); text(n.n, mono(12, 600), Math.round(16 * k), '', pad + Math.round(28 * k));
      const u = hostOf(urlOf(n)); text(`${relPhrase(n)}${u ? ` · ${u}` : ''}`, mono(11), Math.round(15 * k), '', pad + Math.round(28 * k));
      y += Math.round(4 * k);
    });
    if (rels.length > 1) { const cw = Math.min(W - pad * 2, Math.round(150 * k)); y += Math.round(6 * k); drawChart(x, s, W / 2, y + cw / 2, cw, Math.max(1, k * 1.2)); y += cw + Math.round(4 * k); x.font = mono(9); text(`FIG. 2 · ${rels.length} RELATIONS · NORTH UP`, mono(9), Math.round(13 * k)); }
  }
  if (s.note) { rule(); field('NOTE', s.note); }
  if (s.who) { rule(); text(`— ${s.who}`, mono(13), Math.round(18 * k)); }
  /* the code: the link, or the mesh message; at a size a phone can read off thermal paper */
  const qr = qrOf(qrText(s)); if (qr) { const n = qr.getModuleCount(); const m = Math.floor((W - pad * 2) / (n + 4)); if (m >= (levels === 2 ? 3 : 1) && n * m <= W) { y += Math.round(10 * k); const ox = Math.round((W - n * m) / 2); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) x.fillRect(ox + c * m, y + r * m, m, m); y += n * m + Math.round(8 * k); } }
  text(CONFIG.COUNTRY, mono(10), Math.round(14 * k)); y += pad;
  const textH = y;
  /* the head of the slip, then the photograph: as tall as everything under it, between four fifths and eight fifths of its width */
  const headH = Math.round(36 * k); const src = sigSrc(s, false); let photo = null; let imgH = 0;
  if (src) { imgH = Math.round(clamp(textH, W * 0.8, W * 1.6)); try { photo = await bwCanvas(src, W, imgH, levels); } catch (e) { photo = null; } }
  if (!photo) { imgH = src ? Math.round(W * 0.5) : 0; }
  const out = document.createElement('canvas'); out.width = W; out.height = headH + imgH + Math.round(10 * k) + textH; const o2 = out.getContext('2d'); o2.fillStyle = '#fff'; o2.fillRect(0, 0, W, out.height); o2.fillStyle = '#000'; o2.textBaseline = 'top';
  o2.font = mono(18, 600); o2.fillText(s.code, pad, Math.round(9 * k)); o2.font = mono(13); const st = fmtStamp(s.at); o2.fillText(st, W - pad - o2.measureText(st).width, Math.round(12 * k));
  if (photo) o2.drawImage(photo, 0, headH);
  else if (imgH) M.glyph(o2, p.g || 'paw', W / 2, headH + imgH / 2, imgH * 0.7, '#000');
  o2.drawImage(T, 0, 0, W, textH, 0, headH + imgH + Math.round(10 * k), W, textH);
  /* everything to the printer's inks: two for a thermal head, four greys for a Game Boy */
  const id = o2.getImageData(0, 0, W, out.height); const d = id.data; for (let i = 0; i < d.length; i += 4) { const v = d[i] / 255; const q = levels === 2 ? (v < 0.55 ? 0 : 1) : Math.round(v * 3) / 3; d[i] = d[i + 1] = d[i + 2] = Math.round(q * 255); d[i + 3] = 255; }
  o2.putImageData(id, 0, 0);
  return out;
}
async function slipPNG(s, W, levels) { const cv = await slipCanvas(s, W, levels); return new Promise(res => cv.toBlob(b => res(b), 'image/png')); }
/* ───────── raw bytes for an ESC/POS receipt printer: the photograph as raster lines, the slip, a QR code, a cut ───────── */
async function escpos(s) {
  const b = []; const put = (...a) => { for (const v of a) b.push(v); }; const txt = t => { for (const ch of ascii(t)) put(ch.charCodeAt(0)); };
  put(0x1B, 0x40, 0x1B, 0x74, 0x00);                                        /* initialise; code page 437 */
  put(0x1B, 0x61, 0x01, 0x1B, 0x45, 0x01, 0x1D, 0x21, 0x11); txt(s.code + '\n'); put(0x1D, 0x21, 0x00, 0x1B, 0x45, 0x00, 0x1B, 0x61, 0x00);
  /* the photograph: GS v 0, in bands of 255 rows, 48 bytes a row for 384 dots */
  const src = sigSrc(s, false);
  if (src) {
    try {
      const W = 384; const Hh = 384; const cv = await bwCanvas(src, W, Hh, 2); const d = cv.getContext('2d').getImageData(0, 0, W, Hh).data;
      for (let y0 = 0; y0 < Hh; y0 += 255) {
        const h = Math.min(255, Hh - y0); put(0x1D, 0x76, 0x30, 0x00, 48, 0, h & 0xFF, h >> 8);
        for (let y = y0; y < y0 + h; y++) for (let xb = 0; xb < 48; xb++) { let v = 0; for (let bit = 0; bit < 8; bit++) if (d[(y * W + xb * 8 + bit) * 4] < 128) v |= 0x80 >> bit; put(v); }
      }
      put(0x0A);
    } catch (e) { /* no pixels to share: the words alone */ }
  }
  txt(slipText(s).split('\n').slice(1).join('\n') + '\n');
  const q = unescape(encodeURIComponent(qrText(s))); const n = q.length + 3;
  if (q.length < 1200) {   /* up to about version 26 at three dots a module: still inside 384 dots */
    put(0x1B, 0x61, 0x01);
    put(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);              /* model 2 */
    put(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, q.length > 600 ? 0x03 : q.length > 300 ? 0x04 : 0x06);   /* module size */
    put(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30);                    /* error correction L */
    put(0x1D, 0x28, 0x6B, n & 0xFF, n >> 8, 0x31, 0x50, 0x30); for (const ch of q) put(ch.charCodeAt(0) & 0xFF);
    put(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);                    /* print it */
    put(0x0A, 0x1B, 0x61, 0x00);
  }
  txt(CONFIG.COUNTRY + '\n'); put(0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00);   /* feed, cut */
  return new Uint8Array(b);
}
/* ───────── printed from the browser: a strip 58 mm wide, as long as the slip ───────── */
let pressBusy = Promise.resolve();
const serial = job => { const run = () => job(); pressBusy = pressBusy.then(run, run); return pressBusy; };
function printSheet(el) {
  const mm = Math.ceil(el.offsetHeight * 25.4 / 96) + 6;
  let st = $('#page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); } st.textContent = `@page{size:58mm ${Math.max(60, mm)}mm;margin:0}`;
  window.__lastSlip = { mm, text: el.textContent.replace(/\s+/g, ' ').trim() };
  window.print();
}
function printSlip(s, blank) {
  return serial(async () => {
    const el = $('#p-slip'); el.innerHTML = slipHTML(s, blank); el.classList.toggle('blank', !!blank);
    if (!blank) renderQR(el.querySelector('.sl-qr'), qrText(s)); else el.querySelector('.sl-qr').innerHTML = '';
    try { await document.fonts.ready; } catch (e) { /* fallback type */ }
    if (!blank) await fillFig(el, s, true);
    snd.printer(900); printSheet(el);
  });
}
function printBlank() { printSlip({ code: 'DA-____', at: Date.now(), pin: {}, lines: {}, nodes: [] }, true); }
/* ───────── the print it will make, small, on the card: so it can be seen before it exists ───────── */
let miniN = 0;
async function drawMini(cv, o) {
  if (!cv || !o) return; const my = ++miniN; const x = cv.getContext('2d'); const W = cv.width, H = cv.height; const k = W / 120;
  const fig = strings.snapshot(); const c = imgChoice(o); const src = imgSrc(c, o.id, o, false);
  const paint = photo => {
    if (my !== miniN) return; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.fillStyle = '#FCFBF7'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#141412'; let y = 6 * k; x.fillRect(6 * k, y, 30 * k, 3 * k); x.fillRect(W - 30 * k, y, 24 * k, 3 * k); y += 7 * k;
    const ih = Math.round(H * 0.42); if (photo) x.drawImage(photo, 0, y, W, ih); else { x.fillStyle = '#E6E5DE'; x.fillRect(0, y, W, ih); M.glyph(x, lifeOf(o), W / 2, y + ih / 2, ih * 0.6, '#141412'); x.fillStyle = '#141412'; } y += ih + 6 * k;
    x.fillRect(6 * k, y, Math.min(W - 12 * k, 8 * k + nameOf(o).length * 3.2 * k), 4.5 * k); y += 9 * k;
    x.globalAlpha = 0.35; for (let i = 0; i < 2; i++) { x.fillRect(6 * k, y, (W - 12 * k) * (i ? 0.62 : 1), 2.4 * k); y += 5 * k; } x.globalAlpha = 1; y += 2 * k;
    for (let i = 0; i < 4; i++) { x.fillRect(6 * k, y, (W - 12 * k) * [0.82, 0.7, 0.9, 0.66][i], 3 * k); y += 6.5 * k; }
    y += 2 * k; const cw = Math.min(40 * k, H - y - 8 * k); x.globalAlpha = 0.5; for (let i = 0; i < Math.min(5, fig.nodes.length); i++) x.fillRect(6 * k, y + i * 5 * k, (W - 12 * k) * 0.5, 2.2 * k); x.globalAlpha = 1;
    if (fig.nodes.length > 1 && cw > 16 * k) drawChart(x, fig, W - 6 * k - cw / 2, y + cw / 2, cw, Math.max(0.6, k * 0.55));
  };
  paint(null);
  if (src) try { paint(await bwCanvas(src, W, Math.round(H * 0.42), 2)); } catch (e) { /* the mark stands in */ }
}

/* ───────── the board: open a signal, its figure on the ground ───────── */
function openSignal(key) {
  const s = S.signals.find(x => x.key === key || x.code === key); if (!s) return;
  if (S.mode) closeRecord('switch');
  S.mode = 'sig'; S.sig = s.key; S.issued = null; openRecord(); fillSignal(s); showFace('signal'); strings.showSig(); life.select(); snd.tick(1800); buzz(5);
  if (S.mapReady && s.pin) map.easeTo({ center: [s.pin.lng, s.pin.lat], zoom: Math.max(map.getZoom(), 15.6), offset: sheetOffset(), duration: reduced() ? 0 : 700 });
  try { history.replaceState(null, '', '#' + s.code); } catch (e) { /* file:// */ }
}
/* a signal's cell: the sighting itself when it is here, else a cell made from what the signal carries */
function cellOfSignal(s) {
  const p = s.pin || {}; if (p.id && S.byId.has(p.id)) return S.byId.get(p.id);
  const id = 'sp:' + s.code; if (S.byId.has(id)) return S.byId.get(id);
  const o = { id, sigPin: true, g: p.g || 'paw', lat: +p.lat, lng: +p.lng, d: isoDay(new Date(s.at)), age: 0, rare: 0.5, tx: { id: null, n: p.n || p.cn || '', cn: p.cn || p.n || '', ic: p.ic || IC_OF_GLYPH[p.g] || 'Animalia', th: false, na: true, intro: false } };
  S.byId.set(id, o); return o;
}
function remixSignal(s) {
  const o = cellOfSignal(s); strings.seed(o, s); remixLines = { ...(s.lines || {}) };
  if (s.img && s.img.k === 'inat' && !IMGS[o.id]) { IMGS[o.id] = s.img; saveImgs(); }
  select(o.id); setTimeout(() => { if (S.sel === o.id) toWish(o); }, reduced() ? 0 : 450);
}
/* receiving: a link, the packed signal, or a mesh message pasted in */
async function receive(text) {
  let s = null; const t = String(text).trim();
  try {
    const m = t.match(/#x=([A-Za-z0-9_-]+)/) || t.match(/^([A-Za-z0-9_-]{40,})$/);
    if (m) s = unpackSignal(m[1]);
    else if (/^DA-[0-9A-Z]{4}\b/.test(t)) {
      const L = t.split(/\n/); const code = L[0].slice(0, 7); const name = L[0].slice(8).trim(); const ll = (L[1] || '').match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (!ll) throw new Error('where'); const lines = {}; L.slice(2).filter(l => l.trim()).slice(0, 4).forEach((l, i) => { const mm = l.match(/^([WISH])\s+(.*)$/); lines[mm ? mm[1].toLowerCase() : WKEYS[i]] = (mm ? mm[2] : l).trim().slice(0, SIG.line); });
      s = { v: 1, code, at: Date.now(), pin: { lat: +ll[1], lng: +ll[2], cn: title(name), n: '', g: 'paw', place: suburbAt(+ll[1], +ll[2]) }, threat: '', when: '', deg: 0, lines, nodes: [], edges: [] };
    }
  } catch (e) { s = null; }
  if (!s) { toast('NOT A SIGNAL'); nudge($('#rx-t')); return null; }
  const have = S.signals.find(x => x.code === s.code);
  if (!have) { const ev = await ledgerAdd({ type: 'signal', lat: s.pin.lat, lng: s.pin.lng, who: s.who || '', data: { ...s, recv: true } }); snd.pluck(0.4, 0); openSignal(ev.key); }
  else openSignal(have.key);
  return s;
}


/* ───────── deep links: a page by name; #x=… a signal carried in the link; #DA-XXXX a signal here; #T01 a group;
   #U… a record placed here; #E01 a gathering; any other code an iNaturalist sighting ───────── */
let pendingHash = location.hash.replace(/^#/, '');
const viewOfHash = h => { const p = PARTS[String(h).toLowerCase()]; return p ? p[0] : -1; };
const isLocalHash = h => viewOfHash(h) >= 0 || /^(T\d{2}|E\d{2}|DA-[0-9A-Z]{4}|x=.+)$/i.test(h);
async function handleHash() {
  const h = decodeURIComponent(pendingHash || ''); pendingHash = ''; if (!h) return;
  const v = viewOfHash(h); if (v >= 0) { const part = h.toLowerCase(); setView(v, false, PARTS[part][1] ? part : null); return; }
  if (/^x=/.test(h)) { await receive('#' + h); return; }
  if (/^DA-[0-9A-Z]{4}$/i.test(h)) { const s = S.signals.find(x => x.code === h.toUpperCase()); if (s) openSignal(s.key); return; }
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
S.mo = nowK();
derive(); buildTribes(); buildHeroes(); renderView(); flags(); loadEvents();
if (isLocalHash(pendingHash)) handleHash();
loadWeather().then(() => fetchSightings(false)).then(() => { if (pendingHash) handleHash(); }).then(() => fetchHistory());
placesAround(S.scan.lat, S.scan.lng, S.scan.r);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { /* online-only is fine */ });
window.__da = { S, CONFIG, M, FIELD, BRIEFS, EXAMPLES, map, ledger, life, strings, select, setView, setOpen, closeRecord, refresh, alarmsNow, fieldOf, glyphOf, isCold, live: liveTick, fetchHistory, derive, startPlace, selectTribe,
  degOf, whenOf, threatOf, youngOf, needsOf, needLine, waterNear, outMonth, nowK, canopyAt, canopyOf, pickMonth, roleOfRow, onNotice, suburbAt, placeOf, lifeOf, inTribe, livesIn, bizNear, placesAround, harmsOfRow,
  webBriefs, makeSignal, meshText, pagerText, slipText, escpos, slipPNG, packSignal, unpackSignal, linkOf, receive, openSignal, printSlip, printBlank, remixSignal, toWish, issue, snd, prefs, hideCell, setFive, fiveList, haversine, rangeOf, nameOf, statementOf, stDefault, imgChoice, imgList, photoChoices, IMGS, OWN, showConstellation, fitWeb, fillLedger, bwCanvas, slipCanvas, slipHTML, PLACES, ROLES, PRESSURES, face: () => face };
})();
