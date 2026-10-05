(() => {
'use strict';
const CONFIG = window.DA_CONFIG, SCALES = window.DA_SCALES, TRAITS = window.DA_TRAITS, SECTORS = window.DA_SECTORS, ROLES = window.DA_ROLES;
const OUT = window.DA_OUTLOOK, CANOPY = window.DA_CANOPY, BRIEFS = window.DA_BRIEFS || [];
const NEEDS = window.DA_NEEDS || {}, HEROES = window.DA_HEROES || [], TRIBES = window.DA_TRIBES || [], WATERS = window.DA_WATERS || { lines: [], points: [] }, GIGS = window.DA_GIGS || {};
const CANOPY_TARGET = (window.DA_CANOPY_TARGET || { pc: 40 }).pc;
const HEAT = window.DA_HEAT, CONTACTS = window.DA_CONTACTS, LINKS = window.DA_LINKS, DEMO = CONFIG.DEMO ? window.DA_DEMO : null;
const M = window.DA_MARKS, C = M.C, FIELD = window.DA_FIELD || [];
/* two pages, as two positions of a point: NOW (the situation: now, the forecast, alerts) and STORIES (the response: stories, people, the archive) */
const VIEWS = [
  { k: 'now', icon: 'now', label: 'Now', w: 'NOW' },
  { k: 'stories', icon: 'stories', label: 'Stories', w: 'STORIES' },
];
const WORDS = M.WORDS;
const word = k => WORDS[k] || String(k || '').toUpperCase();
/* how far a response has come: noticed, made right, made to work, made beautiful */
const STAGES = ['NOTICED', 'MAKE IT RIGHT', 'MAKE IT WORK', 'MAKE IT BEAUTIFUL'];
/* degrees of danger in the months ahead: orange, deeper as it rises. Red is kept for now. */
const DEG = ['LOW', 'WATCH', 'HIGH', 'SEVERE', 'EXTREME'];
const HUMAN_KINDS = ['need', 'offer', 'event', 'pulse', 'refuge'];
const buzz = ms => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) { /* no haptics */ } };
/* a touch answers: a dry click of a few milliseconds when sound is on, and the smallest buzz a phone allows */
let actx = null;
function tick(f = 1700) {
  buzz(3);
  if (!prefs.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.035);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.06);
  } catch (e) { /* silence is fine */ }
}
const icon = (name, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#g-${name}"/></svg>`;
const glyphSVG = (name, cls = '') => `<svg class="i k ${cls}" aria-hidden="true"><use href="#k-${name}"/></svg>`;
(function sprite() { const host = document.querySelector('svg.sprite'); if (host) host.innerHTML = M.sprite(); })();

/* ───────── small tools ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad2 = n => String(n).padStart(2, '0');
const pad3 = n => String(n).padStart(3, '0');
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const fmtDate = t => { const d = new Date(t); return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`; };
const fmtClock = t => { const d = new Date(t); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fmtDay = t => { const d = new Date(t); return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
/* a day as people say it: today, tonight, tomorrow, or the day's name */
const dayWord = t => { const d = new Date(t), a = new Date(t), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); const n = Math.round((a - b) / 864e5); return n === 0 ? (d.getHours() >= 17 ? 'TONIGHT' : 'TODAY') : n === 1 ? 'TOMORROW' : n > 1 && n < 7 ? DOW[d.getDay()] : fmtDay(t); };
const isoDay = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseDay = s => { if (!s) return null; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return y ? new Date(y, m - 1, d) : null; };
const dayMonth = s => { const d = parseDay(s); return d ? `${d.getDate()} ${MON[d.getMonth()]}` : ''; };
const daysFrom = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const toCode = id => (typeof id === 'number' ? id.toString(36) : String(id)).toUpperCase();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const coord = (lat, lng) => `${lat < 0 ? '−' : ''}${Math.abs(lat).toFixed(4)}  ${lng.toFixed(4)}`;
const norm = s => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/\b(the|hotel|bar|club|venue|cafe|café)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function countdown(t, now = Date.now()) {
  const s = Math.floor((t - now) / 1000); if (s <= 0) return '00:00:00';
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return `${d ? d + 'd ' : ''}${pad2(h)}:${pad2(m)}:${pad2(x)}`;
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
};
const loadImage = (src, cors) => new Promise((res, rej) => { const im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => rej(new Error('image')); im.src = src; });
let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
function nudge(el) { if (!el) return; el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); el.focus({ preventScroll: true }); buzz(20); }
const debounce = (fn, ms) => { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const haversine = (a, b, c, d) => { const R = 6371000, r = Math.PI / 180; const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const coarse = () => matchMedia('(pointer: coarse)').matches;
const reduced = () => !prefs.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;
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
/* the suburb a point is in: the nearest suburb centre, close enough for a label and a canopy figure */
const CENTRES = [['BRUNSWICK', -37.7667, 144.9600], ['BRUNSWICK EAST', -37.7712, 144.9790], ['BRUNSWICK WEST', -37.7650, 144.9420], ['PARKVILLE', -37.7860, 144.9500], ['PRINCES HILL', -37.7832, 144.9655],
  ['CARLTON NORTH', -37.7845, 144.9735], ['FITZROY NORTH', -37.7835, 144.9860], ['CLIFTON HILL', -37.7890, 144.9970], ['CARLTON', -37.7990, 144.9665], ['FITZROY', -37.7990, 144.9785], ['COLLINGWOOD', -37.8020, 144.9890],
  ['NORTH MELBOURNE', -37.7985, 144.9450], ['KENSINGTON', -37.7930, 144.9290], ['FLEMINGTON', -37.7835, 144.9300], ['WEST MELBOURNE', -37.8070, 144.9430], ['MELBOURNE', -37.8136, 144.9631], ['EAST MELBOURNE', -37.8130, 144.9850],
  ['DOCKLANDS', -37.8150, 144.9460], ['SOUTHBANK', -37.8225, 144.9640]];
const suburbAt = (lat, lng) => { let best = CENTRES[0][0], bd = 1e9; for (const [n, a, b] of CENTRES) { const d = (a - lat) ** 2 + ((b - lng) * 0.79) ** 2; if (d < bd) { bd = d; best = n; } } return best; };
const title = s => String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
/* the suburb of a record: the observer's own place name for a sighting, the nearest centre for anything else */
const placeOf = o => { const s = typeof o.id === 'number' && o.pg ? o.pg.toLowerCase() : ''; if (s) for (const n of SUBURBS) if (s.includes(n.toLowerCase()) && CENTRES.some(c => c[0] === n.toUpperCase())) return n.toUpperCase(); return suburbAt(o.lat, o.lng); };

/* ───────── state ───────── */
const prefs = Object.assign({ sound: true, motion: true, base: null }, store.get('da.prefs', {}));
const me = Object.assign({ by: '', pay: '', dev: '' }, store.get('da.me', {}));
if (!me.dev) { me.dev = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; store.set('da.me', me); }
const S = {
  obs: [], byId: new Map(), user: [], community: [], stories: [], hist: [],
  view: 0, open: true, sel: null, bizSel: null, mode: null, place: null, filed: null, mo: 0, brief: null,
  wx: store.get('da.wx.v3', { t: 0, tmax: null, tmin: null, rain: null, days: [] }),
  lastVisit: store.get('da.lastVisit', 0), lastSignal: 0, stale: false, me,
  stats: new Map(), resp: new Map(), biz: null, bizLoading: null, grids: new Map(), radius: new Map(),
  orbit: { cell: new Map(), biz: new Map() }, arrivals: new Set(), mapReady: false, sensors: [], fountains: [],
  heroes: [], tribes: [], tribeSel: null,
};


/* ════════════════════════════════════════════════════════════════════
   DANGER — each life against the El Niño months ahead: the Bureau's outlook, how hard heat and drought are
   on its kind, whether the heat lands while it breeds, and how bare the ground is where it lives.
   ════════════════════════════════════════════════════════════════════ */
const kindOf = o => (o.hum ? 'Human' : (o.tx && o.tx.ic) || 'Unknown');
function bandOf(o) { if (o.b != null) return o.b; const ic = kindOf(o); const i = SCALES.findIndex(s => s.taxa.includes(ic)); return i < 0 ? 5 : i; }
const planted = o => !!o.cap && ['Plantae', 'Fungi'].includes(kindOf(o));
const keptAnimal = o => !!o.cap && !planted(o);
const genusOf = o => (o.tx && o.tx.n ? o.tx.n.split(' ')[0] : '');
const rangeOf = o => (S.radius.get(o.id) || (o.hum ? 400 : keptAnimal(o) ? 400 : SCALES[bandOf(o)].range));
/* the field list (field.js): what each kind of life needs through the year; by species, else by genus when only one is listed */
const FIELD_IX = new Map(), GENUS_IX = new Map();
for (const e of FIELD) {
  const n = e.n.toLowerCase().trim(); FIELD_IX.set(n, e); const g = n.split(/\s+/)[0];
  if (!/\s/.test(n)) GENUS_IX.set(g, e);
  else if (!GENUS_IX.has(g)) GENUS_IX.set(g, e);
  else { const prev = GENUS_IX.get(g); if (prev && /\s/.test(prev.n)) GENUS_IX.set(g, null); }
}
/* a word that names a group, not a species: the field list answers with the one most often met here */
const GROUP_REP = { serpentes: 'notechis scutatus', chiroptera: 'chalinolobus gouldii', microchiroptera: 'chalinolobus gouldii', anura: 'crinia signifera', scincidae: 'lampropholis guichenoti' };
const fieldOf = o => { const sub = o && subjectOf(o); const n = sub && sub.tx && sub.tx.n ? sub.tx.n.toLowerCase().trim() : ''; if (!n) return null; return FIELD_IX.get(n) || FIELD_IX.get(n.split(/\s+/).slice(0, 2).join(' ')) || GENUS_IX.get(n.split(/\s+/)[0]) || (GROUP_REP[n] ? FIELD_IX.get(GROUP_REP[n]) : null) || null; };
const ICONIC_GLYPH = { Aves: 'bird', Mammalia: 'mammal', Reptilia: 'lizard', Amphibia: 'frog', Actinopterygii: 'aquatic', Insecta: 'beetle', Arachnida: 'spider', Mollusca: 'snail', Plantae: 'plant', Fungi: 'fungi', Animalia: 'segmented', Chromista: 'plant', Protozoa: 'segmented', Unknown: 'plant' };
/* a kind the field list does not hold: read its common name, then its class */
const NAME_GLYPH = [[/flying-?fox/i, 'flyingfox'], [/\bbat\b/i, 'bat'], [/possum|glider/i, 'possum'], [/\bbee\b|bees$/i, 'bee'], [/butterfl|\bskipper\b|\b(admiral|jezebel|swallowtail|brown)\b/i, 'butterfly'], [/\bmoth\b/i, 'moth'], [/wasp|hornet/i, 'wasp'], [/hoverfly|\bfly\b/i, 'fly'], [/dragonfly|damselfly/i, 'dragonfly'],
  [/orb-?weaver/i, 'orb'], [/spider/i, 'spider'], [/beetle|ladybird|weevil/i, 'beetle'], [/grasshopper|cricket|katydid/i, 'grasshopper'], [/mantis/i, 'mantis'], [/\bbug\b|aphid|cicada|psyllid|lerp/i, 'bug'], [/snail|slug/i, 'snail'], [/worm/i, 'segmented'],
  [/frog|toadlet|froglet/i, 'frog'], [/turtle|tortoise/i, 'turtle'], [/skink|gecko|lizard|dragon\b/i, 'lizard'], [/snake/i, 'snake'], [/\b(fish|eel|galaxias|carp|mosquitofish)\b/i, 'aquatic'],
  [/owl|frogmouth|boobook/i, 'owl'], [/hawk|kite|falcon|eagle|goshawk/i, 'raptor'], [/duck|swan|heron|egret|ibis|cormorant|grebe|moorhen|coot|gull|darter|swamphen|teal/i, 'waterbird'], [/lorikeet|rosella|cockatoo|corella|galah|parrot/i, 'parrot'], [/orang-?utan|gorilla|chimpanzee/i, 'ape']];
const glyphOf = o => { if (o && o.user && o.g) return o.g; const fe = fieldOf(o); if (fe) return fe.g; const sub = subjectOf(o); const cn = sub.tx && sub.tx.cn; if (cn && !o.hum) for (const [re, g] of NAME_GLYPH) if (re.test(cn)) return g; if (sub.tx && sub.tx.ic && ICONIC_GLYPH[sub.tx.ic]) return ICONIC_GLYPH[sub.tx.ic]; return o.hum ? 'human' : 'plant'; };
/* whose record it is: a record of people that names an animal speaks for the animal */
const lifeOf = o => { if (o.user && o.g) return o.g; const sub = subjectOf(o); return o.hum && !(sub && sub.tx && sub.tx.n) ? 'human' : glyphOf(o); };
/* gone cold: a sighting more than three weeks old, or one from this season in a past year */
const COLD_DAYS = 21;
const isCold = o => !!o.hist || ((typeof o.id === 'number' || o.specimen) && !o.hum && o.age != null && o.age > COLD_DAYS);
const hourOf = o => (o.t ? new Date(o.t).getHours() : null);
const isNight = o => { const h = hourOf(o); return h != null && (h >= 20 || h < 5); };
function traitsOf(o) {
  const n = (o.tx && o.tx.n) || '';
  for (const [g, h, w, note] of TRAITS.special) if (n.startsWith(g)) return [h, w, note];
  const g = o.tx ? kindOf(o) : SCALES[bandOf(o)].taxa[0];
  const t = TRAITS.groups[g] || TRAITS.groups.Unknown; return [t[0], t[1], ''];
}
/* the outlook, month by month (config.js) */
const OUT_N = OUT.lv.length;
const outMonth = k => { const [y, m] = OUT.start; const t = m + k; return { k, m: t % 12, y: y + Math.floor(t / 12), lv: OUT.lv[k] || 0, h: OUT.h[k] || 'p' }; };
const nowK = () => { const d = new Date(); const [y, m] = OUT.start; return clamp((d.getFullYear() - y) * 12 + d.getMonth() - m, 0, OUT_N - 1); };
const inWin = (w, m) => (w.a <= w.b ? m >= w.a && m <= w.b : m >= w.a || m <= w.b);
const monthsWord = (a, b) => (a === b ? MON[a] : `${MON[a]}–${MON[b]}`);
/* the canopy where a point is: by suburb where measured, else by council */
const canopyAt = (lat, lng, sb = suburbAt(lat, lng)) => Object.assign({ sb, pc: 15, yr: 2018, by: 'MELBOURNE' }, CANOPY[sb] || {});
/* the canopy of the suburb a record names */
const canopyOf = o => canopyAt(o.lat, o.lng, placeOf(o));
/* degrees of danger for a life in a month: 0 low · 1 watch · 2 high · 3 severe · 4 extreme.
   The month's outlook, scaled by how hard heat (twice) and drought (once) are on its kind; more when the heat lands
   while a heat-sensitive kind breeds or in one of the unseasonable windows; a little more on bare ground; less for introduced kinds. */
function degAt(o, k) {
  if (!o || o.hist) return 0;
  const M = outMonth(k);
  if (o.hum) return o.story || o.kind === 'pulse' || o.kind === 'need' || o.kind === 'refuge' ? M.lv : 0;
  const sub = subjectOf(o); if (keptAnimal(sub)) return 0;
  const fe = fieldOf(o); const [th, tw] = traitsOf(sub); const g = glyphOf(o);
  const heat = fe ? fe.heat || 0 : Math.min(3, th), water = fe ? fe.water || 0 : Math.min(3, tw);
  let lv = M.lv; if (fe && fe.act && fe.act[M.m] === '.') lv = Math.max(0, lv - 1);
  let d = lv * ((2 * heat + water) / 3) / 3;
  const born = !!(fe && fe.brd && fe.brd[M.m] === 'B');
  if (M.lv >= 2 && heat >= 2 && (born || OUT.windows.some(w => inWin(w, M.m) && w.g.includes(g)))) d += 0.6;   /* the wrong moment */
  if (M.lv >= 3 && heat >= 2 && canopyOf(o).pc < 15) d += 0.3;                                    /* bare ground */
  if (sub.tx && sub.tx.intro) d -= 1;
  return d >= 3.6 ? 4 : d >= 2.8 ? 3 : d >= 1.8 ? 2 : d >= 0.9 ? 1 : 0;
}
const degCache = new Map();
function degOf(o, k0 = S.mo, span = 3) {
  const key = `${o.id}|${k0}|${span}|${S.radius.get(o.id) || 0}`; if (degCache.has(key)) return degCache.get(key);
  let best = 0; for (let k = k0; k < Math.min(OUT_N, k0 + span); k++) best = Math.max(best, degAt(o, k));
  degCache.set(key, best); if (degCache.size > 6000) degCache.clear(); return best;
}
/* when it is worst: the months ahead at its highest degree */
function worstWhen(o, k0 = S.mo, span = 3) {
  let top = 0, a = -1, b = -1;
  for (let k = k0; k < Math.min(OUT_N, k0 + span); k++) { const d = degAt(o, k); if (d > top) { top = d; a = b = k; } else if (d === top && top > 0 && b === k - 1) b = k; }
  return top ? { deg: top, a, b, word: monthsWord(outMonth(a).m, outMonth(b).m) } : null;
}
/* the unseasonable window it falls in, if any */
const windowOf = (o, k0 = S.mo, span = 3) => { const g = lifeOf(o); for (let k = k0; k < Math.min(OUT_N, k0 + span); k++) { const m = outMonth(k).m; const w = OUT.windows.find(x => inWin(x, m) && x.g.includes(g)); if (w) return w; } return null; };
/* what a life needs within its radius, and what threatens it there: three readings chosen for its kind (DA_NEEDS in config.js) */
const POLLINATORS = new Set(['bee', 'butterfly', 'moth', 'fly', 'wasp', 'parrot', 'flyingfox']);
const INSECTS = new Set(['bee', 'butterfly', 'moth', 'fly', 'wasp', 'beetle', 'bug', 'grasshopper', 'mantis', 'dragonfly']);
const FOOD_GENERA = new Set(['citrus', 'malus', 'prunus', 'pyrus', 'olea', 'vitis', 'eriobotrya', 'morus', 'feijoa', 'acca', 'rubus', 'fragaria', 'persea', 'diospyros', 'punica', 'macadamia', 'cydonia', 'juglans', 'corylus', 'castanea', 'passiflora', 'actinidia', 'ribes', 'vaccinium', 'solanum', 'cucurbita', 'rosmarinus', 'ocimum']);
const NECTAR_GENERA = new Set(['eucalyptus', 'corymbia', 'angophora', 'grevillea', 'banksia', 'callistemon', 'melaleuca', 'correa', 'acacia', 'leptospermum', 'bursaria', 'hakea', 'westringia', 'hardenbergia', 'chrysocephalum', 'brachyscome', 'xerochrysum', 'dianella', 'goodenia', 'pelargonium', 'salvia', 'lavandula', 'echium', 'borago', 'agastache', 'lomandra', 'eremophila', 'kunzea', 'olearia', 'senecio', 'arctotheca', 'taraxacum', 'trifolium', 'hypochaeris']);
const genusOfX = x => ((x.tx && x.tx.n) || '').toLowerCase().split(/\s+/)[0];
const isFood = x => { const n = ((x.tx && x.tx.n) || '').toLowerCase(); return n.startsWith('ficus') || FOOD_GENERA.has(n.split(' ')[0]); };
const isPlant = x => ['Plantae'].includes(kindOf(x)) || (!x.tx && bandOf(x) === 5);
/* the nearest water: a creek, the river or a wetland, by the straight line */
function waterNear(lat, lng) {
  const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540; let best = { d: Infinity, n: '' };
  const seg = (a, b) => { const ax = (a[1] - lng) * kx, ay = (a[0] - lat) * ky, bx = (b[1] - lng) * kx, by = (b[0] - lat) * ky; const dx = bx - ax, dy = by - ay; const t = clamp(-(ax * dx + ay * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(ax + t * dx, ay + t * dy); };
  for (const [n, pts] of WATERS.lines) for (let i = 0; i < pts.length - 1; i++) { const d = seg(pts[i], pts[i + 1]); if (d < best.d) best = { d, n }; }
  for (const [n, a, b] of WATERS.points) { const d = haversine(lat, lng, a, b); if (d < best.d) best = { d, n }; }
  return best;
}
/* one count of each kind within a radius: the lives recorded now and in past years, and the places around */
function countsAt(lat, lng, R, self) {
  const c = { insects: 0, flowers: 0, fruit: 0, plants: 0, prey: 0, hollows: 0, pollinators: 0, cats: 0, wildlife: 0, checkins: 0, cool: 0 }; const kinds = new Set();
  for (const x of [...S.obs, ...S.hist, ...S.stories, ...S.user]) {
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
  for (const h of S.community) { if (haversine(lat, lng, h.lat, h.lng) > R) continue; if (h.kind === 'pulse') c.checkins += h.n || 1; if (h.kind === 'refuge' || (h.tags || []).includes('refuge')) c.cool++; }
  c.kinds = kinds.size;
  return c;
}
/* the middle of the map: median counts within 300 m of forty records spread across it */
let normKey = '', norms = {};
function needNorms() {
  const key = `${S.obs.length}|${S.hist.length}|${S.stories.length}`; if (key === normKey) return norms; normKey = key;
  const pool = S.obs.filter(o => !o.ob); if (pool.length < 10) { norms = {}; return norms; } const step = Math.max(1, Math.floor(pool.length / 40)); const all = {};
  for (let i = 0; i < pool.length; i += step) { const c = countsAt(pool[i].lat, pool[i].lng, 300, pool[i]); for (const k in c) (all[k] = all[k] || []).push(c[k]); }
  const med = a => { a.sort((x, y) => x - y); return a[Math.floor(a.length / 2)] || 0; };
  norms = Object.fromEntries(Object.entries(all).map(([k, a]) => [k, med(a)])); return norms;
}
/* each reading: its word, how to read it, and what makes it ok, low, missing, or a threat nearby */
const NEED_INFO = {
  insects: ['INSECTS', 'Insects to eat'], flowers: ['FLOWERS', 'Nectar and pollen plants'], fruit: ['FRUIT', 'Fruit trees and figs'], plants: ['PLANTS', 'Plants to eat and hide in'],
  prey: ['PREY', 'Rats, mice and possums to hunt'], hollows: ['OLD GUMS', 'Gums old enough to grow hollows'], pollinators: ['POLLINATORS', 'Bees, moths, flies, wasps, lorikeets and flying-foxes that carry pollen'],
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
    if (k === 'canopy') { const cn = canopyOf(o); return { k, w, v: `${cn.pc}%`, n: cn.pc, st: cn.pc >= CANOPY_TARGET ? 'ok' : cn.pc >= 10 ? 'low' : 'none', tip: `${what} in ${title(cn.sb)}, ${cn.yr}: ${cn.pc}%.${cn.streets ? ` Street trees alone: ${cn.streets}%.` : ''} Cooling starts near ${CANOPY_TARGET}%.` }; }
    if (k === 'water') { const wn = waterNear(o.lat, o.lng); const d = Math.round(wn.d / 10) * 10; return { k, w, v: d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${d} m`, n: d, st: d <= 250 ? 'ok' : d <= 800 ? 'low' : 'none', tip: `${what}: ${wn.n}, ${d >= 1000 ? (d / 1000).toFixed(1) + ' km' : d + ' m'} away.` }; }
    if (THREAT_ROLE[k]) { const n = near.filter(b => b.role === THREAT_ROLE[k]).length; return { k, w, v: String(n), n, threat: true, st: n ? 'near' : 'ok', tip: `${what}, within ${R} m: ${n}.` }; }
    if (k === 'cats') { const n = c.cats; return { k, w, v: String(n), n, threat: true, st: n ? 'near' : 'ok', tip: `${what}, within ${R} m: ${n}.` }; }
    /* for a hunter brought here, the readings turn round: the native animals within its reach are at risk from it */
    if (k === 'wildlife') { const n = c.wildlife; return { k, w, v: String(n), n, st: n ? 'risk' : 'ok', tip: `${what}, within ${R} m: ${n}. Each is at risk from it.` }; }
    /* against what a patch of this size usually holds here (the median within 300 m, scaled to this radius), and never fewer than a floor */
    const n = c[k] || 0; const want = Math.max(NEED_FLOOR[k] ?? 3, Math.round((N[k] || 0) * Math.min(9, (R / 300) ** 2)));
    return { k, w, v: String(n), n, st: n === 0 ? 'none' : n < want ? 'low' : 'ok', tip: `${what}, within ${R} m: ${n}. A patch this size here usually has ${want}.` };
  });
  needCache.set(key, out); if (needCache.size > 400) needCache.clear(); return out;
}
/* the short of it: what is missing and what is near, in a line */
const NEED_ST = { ok: 'OK', low: 'LOW', none: 'MISSING', near: 'NEARBY', risk: 'AT RISK' };
function needLine(o) { const n = needsOf(o); const by = st => n.filter(x => x.st === st).map(x => x.w); const miss = by('none'), low = by('low'), near = by('near'), risk = n.filter(x => x.st === 'risk');
  return [risk.length ? risk.map(x => `${x.v} ${x.w} AT RISK`).join(', ') : '', miss.length ? `MISSING ${miss.join(', ')}` : '', low.length ? `LOW ${low.join(', ')}` : '', near.length ? `${near.join(', ')} NEARBY` : ''].filter(Boolean).join(' · '); }

/* ───────── the five in greatest need, where past sightings say they live ───────── */
function buildHeroes() {
  const hs = [];
  for (const h of HEROES) {
    const key = h.n.toLowerCase(); const pts = [];
    for (const x of [...S.obs, ...S.hist, ...S.stories]) { const sub = subjectOf(x); if (sub.tx && sub.tx.n && sub.tx.n.toLowerCase().startsWith(key) && inBox(x.lat, x.lng)) pts.push([x.lat, x.lng]); }
    const curated = pts.length < 3; const home = curated ? [...pts, ...h.home] : pts.slice(0, 60);
    /* it lives where its sightings gather most */
    let best = home[0], bn = -1; for (const p of home) { const n = home.filter(q => haversine(p[0], p[1], q[0], q[1]) < 450).length; if (n > bn) { bn = n; best = p; } }
    const o = { id: 'hero:' + h.id, hero: h.id, heroOf: h, lat: best[0], lng: best[1], b: bandOf({ tx: { ic: h.ic } }), tx: { id: null, n: h.n, cn: h.cn, ic: h.ic, th: !!h.th, na: true, intro: false }, n: pts.length, home, curated, rare: 1, spec: false, d: null };
    hs.push(o);
  }
  for (const o of S.heroes) S.byId.delete(o.id);
  S.heroes = hs; for (const o of hs) S.byId.set(o.id, o);
}
/* ───────── groups already caring for a patch of ground: each patch as overlapping circles ───────── */
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
const livesIn = t => cellsAll().filter(o => !o.hum && !isCold(o) && !o.isTribe && inTribe(t, o.lat, o.lng));

/* ───────── weather today: kept for the hot-day layers on the ground (drinking water, air temperature now) ───────── */
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
  return {
    id: r.id, d: r.observed_on || (r.time_observed_at || '').slice(0, 10), t: r.time_observed_at || null, c: r.created_at || null,
    lat: +c[1], lng: +c[0], ob: !!(r.obscured || gp(r.geoprivacy) || gp(r.taxon_geoprivacy)), cap: !!r.captive, q: r.quality_grade || '', pg: r.place_guess || '',
    tx: { id: t.id || null, n: t.name || r.species_guess || 'Unidentified', cn: t.preferred_common_name || '', ic: t.iconic_taxon_name || 'Unknown', th: !!t.threatened, na: t.native === true, intro: t.introduced === true },
    u: { l: (r.user && r.user.login) || '', n: (r.user && r.user.name) || '' },
    ph: ph ? { u: ph.url, l: ph.license_code || null, a: ph.attribution || '' } : null,
    so: so ? { u: so.file_url, l: so.license_code || null } : null,
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
  S.obs = list; S.byId = new Map(list.map(o => [o.id, o]));
  for (const u of [...S.user, ...S.community, ...S.stories, ...S.hist, ...S.heroes, ...S.tribes]) S.byId.set(u.id, u);
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
/* the same weeks in past years: what has been seen here at this time before (cold, dotted) */
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
  const own = S.hist.filter(o => o.specimen);
  S.hist = [...own, ...list.filter(o => !S.byId.has(o.id) || S.byId.get(o.id).hist).map(o => { const day = parseDay(o.d); return Object.assign(o, { hist: true, age: day ? Math.round((today - day) / 864e5) : 400, rare: 0.3 }); })];
  for (const o of S.hist) S.byId.set(o.id, o);
  life.data();
}
async function liveTick() {
  const n = await fetchNew(); await loadWeather();
  refreshPanel();
  return n;
}

/* ════════════════════════════════════════════════════════════════════
   SPECIMENS — the demo's stories, partners and community records (demo.js)
   ════════════════════════════════════════════════════════════════════ */
function loadDemo() {
  if (!DEMO) return;
  const at = (n, h = 12, m = 0) => { const d = daysFrom(n); d.setHours(h, m, 0, 0); return d.getTime(); };
  /* a community record happened 'ago' minutes before now, or on day d at an hour */
  const when = h => { const t = h.ago != null ? Date.now() - h.ago * 60000 : h.d != null ? at(h.d, h.h ?? 9, h.m || 0) : Date.now(); return { at: t, d: h.ago != null || h.d != null ? isoDay(new Date(t)) : null, age: h.ago != null ? h.ago / 1440 : h.d != null ? -h.d : 0 }; };
  S.stories = DEMO.stories.map(st => ({
    id: 'story:' + st.id, sid: st.id, story: true, spec: true, lat: st.lat, lng: st.lng, b: st.b, hum: st.b === 0,
    tx: { id: null, n: st.tx.n, cn: st.tx.cn, ic: st.tx.ic, th: !!st.tx.th, na: !st.tx.intro, intro: !!st.tx.intro }, d: isoDay(daysFrom(st.d)), at: at(st.d, 10),
    age: -st.d, done: !!st.done, who: st.who, rare: 0.7,
  }));
  S.community = DEMO.community.map(h => ({
    id: 'h:' + h.id, hid: h.id, comm: true, hum: true, b: 0, kind: h.kind, spec: !h.real, real: !!h.real, lat: h.lat, lng: h.lng,
    title: h.title, n: h.n || 0, tags: h.tags || [], link: h.link || '', tel: h.tel || '', venue: h.venue || '', isEvent: h.kind === 'event', g: h.g || null, i: h.i || null, search: h.search || 0,
    tx: h.tx ? { id: null, n: h.tx.n, cn: h.tx.cn, ic: h.tx.ic, th: !!h.tx.th, na: !h.tx.intro, intro: !!h.tx.intro } : undefined,
    start: h.start ? at(h.start[0], h.start[1], h.start[2]) : null, ...when(h),
  }));
  /* specimen sightings: kept beside the live ones; past seasons go with the history */
  const seen = (DEMO.sightings || []).map(f => {
    const when = at(f.d, f.h ?? 12, f.m || 0);
    return { id: 'f:' + f.id, fid: f.id, specimen: true, spec: true, ext: true, d: isoDay(new Date(when)), t: new Date(when).toISOString(), c: null, lat: f.lat, lng: f.lng, ob: false, cap: false, q: 'specimen', pg: '',
      tx: { id: null, n: f.tx.n, cn: f.tx.cn, ic: f.tx.ic, th: !!f.tx.th, na: !f.tx.intro, intro: !!f.tx.intro }, u: { l: '', n: '' }, ph: null, so: null,
      age: Math.max(0, -f.d), rare: 0.55, n: f.n || 1, note: f.note || '', hist: !!f.hist, isNew: false };
  });
  S.obs = [...S.obs.filter(o => !o.specimen), ...seen.filter(o => !o.hist)];
  S.hist = [...S.hist.filter(o => !o.specimen), ...seen.filter(o => o.hist)];
  for (const c of [...S.stories, ...S.community, ...seen]) S.byId.set(c.id, c);
}
/* gatherings from a published sheet, curated by hand from community radio guides and club listings, with permission:
   title, start (ISO date and time), venue, lat, lng, tags (nature free first-nations sound walk kids), link */
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
      n++; const o = { id: 'e:' + n, hid: 'E' + pad2(n), comm: true, hum: true, b: 0, kind: 'event', isEvent: true, spec: false, real: true, lat, lng, title: g('title'), venue: g('venue'), start, tags: g('tags').toLowerCase().split(/[\s;|]+/).filter(Boolean), link: g('link'), tel: '', n: 0, at: Date.now(), d: isoDay(new Date()), age: 0 };
      S.community = S.community.filter(x => x.id !== o.id); S.community.push(o); S.byId.set(o.id, o);
    }
    if (n) refresh();
    return n;
  } catch (e) { return 0; }
}
const partnerById = id => (S.biz || []).findIndex(b => b[5] && b[5].id === id);

/* ════════════════════════════════════════════════════════════════════
   LEDGER — on this device: joins, drafts, responses, pledges, did-its, placed cells
   ════════════════════════════════════════════════════════════════════ */
const ledger = { local: store.get('da.ledger.v3', null) || store.get('da.ledger.v2', []) };
const evKey = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
function ledgerAll() {
  const redacted = new Set(ledger.local.filter(e => e.type === 'redact').map(e => e.ref));
  return ledger.local.filter(e => e && e.key && !redacted.has(e.key)).sort((a, b) => (a.at || 0) - (b.at || 0));
}
async function ledgerAdd(ev) {
  ev.key = ev.key || evKey(); ev.at = ev.at || Date.now(); ev.who = ev.who != null ? ev.who : (S.me.by || ''); ev.dev = S.me.dev;
  ledger.local.push(ev); store.set('da.ledger.v3', ledger.local);
  derive(); refresh();
  return ev;
}
const STAGE_OF_TYPE = { noticed: 0, draft: 1, poster: 2, done: 3, need: 0, offer: 0, event: 0, injured: 0, lost: 0, dead: 0 };
const blankStat = () => ({ joins: new Set(), drafts: [], resps: [] });
/* a response joins three kinds of data: the life it answers, the designer's four lines, and the patrons who carry it */
function responseOf(e, cell) {
  const d = e.data || {};
  const patrons = (d.patrons || []).filter(p => p && p.n).map(p => ({ n: String(p.n), bi: p.bi != null ? +p.bi : null, amt: +p.amt || 0, st: p.st || 'asked', by: e.dev || '', person: !!p.person }));
  return { key: e.key, ev: e, cell, who: e.who || '', dev: e.dev || '', letter: d.letter || 'A', issued: d.issued || e.at, data: d, brief: d.brief || null, patrons, hostList: [...(d.hosts || [])].map(String), did: new Set(), backers: new Set(), voters: new Set(), votes0: 0, placed: e.type === 'poster', spec: !!e.spec };
}
function demoResponses(resp, st) {
  if (!DEMO) return;
  for (const s of DEMO.stories) {
    const cell = 'story:' + s.id; const at = daysFrom(s.d).getTime();
    /* a poster is supported two ways: people who give, and places that host it */
    const ev = { key: s.id, type: 'notice', ref: cell, at, who: s.who, dev: 'specimen', spec: true, data: { w: s.w, i: s.i, s: s.s, h: s.h, letter: 'A', issued: at, brief: s.after || null, hosts: (s.hosts || []).map(pid => (DEMO.partners.find(x => x.id === pid) || {}).n).filter(Boolean), patrons: (s.givers || []).map(([n, stt]) => ({ n, st: stt, person: true })) } };
    const r = responseOf(ev, cell); r.patrons.forEach(p => { p.by = 'specimen'; if (p.st !== 'asked') r.backers.add(p.n); });
    for (let k = 0; k < (s.did || 0); k++) r.did.add('specimen-' + k);
    r.done = !!s.done; r.votes0 = s.votes || 0; resp.set(r.key, r); st(cell).resps.push(r.key);
  }
}
function derive() {
  const stats = new Map(); const user = []; const resp = new Map(); const later = [];
  const st = id => { if (!stats.has(id)) stats.set(id, blankStat()); return stats.get(id); };
  demoResponses(resp, st);
  for (const e of ledgerAll()) {
    if (e.type === 'join' && e.ref != null) st(e.ref).joins.add(e.dev || e.who || e.key);
    else if (e.type === 'draft' && e.ref != null) st(e.ref).drafts.push(e);
    else if (e.type === 'notice') { if (e.ref == null) continue; const r = responseOf(e, e.ref); resp.set(e.key, r); st(e.ref).resps.push(e.key); }
    else if (e.type === 'pledge' || e.type === 'did' || e.type === 'host' || e.type === 'vote') later.push(e);
    else if (STAGE_OF_TYPE[e.type] !== undefined) {
      const u = userPing(e); user.push(u);
      if (e.type === 'poster') { const r = responseOf(e, u.id); resp.set(e.key, r); st(u.id).resps.push(e.key); }
    }
  }
  for (const e of later) {
    const r = resp.get((e.data || {}).of); if (!r) continue; const d = e.data || {};
    if (e.type === 'did') { if (e.dev && e.dev !== r.dev) r.did.add(e.dev); continue; }
    if (e.type === 'vote') { if (e.dev) r.voters.add(e.dev); continue; }
    if (e.type === 'host') { const h = String(d.n || '').trim(); if (h && !r.hostList.some(x => norm(x) === norm(h))) r.hostList.push(h); continue; }
    const name = String(d.n || '').trim(); if (!name) continue;
    const mine = e.dev && e.dev === r.dev; let p = r.patrons.find(x => norm(x.n) === norm(name));
    if (!p) { p = { n: name, bi: d.bi != null ? +d.bi : null, amt: 0, st: 'asked', by: e.dev || '' }; r.patrons.push(p); }
    if (+d.amt > 0) p.amt = +d.amt;
    if (d.st === 'given' || d.st === 'paid') p.st = 'given'; else if (d.st === 'pledged' || d.st === 'asked') p.st = d.st;
    if (!mine) r.backers.add(e.dev || name);
  }
  for (const u of S.user) S.byId.delete(u.id);
  S.user = user; for (const u of user) S.byId.set(u.id, u);
  /* funded: someone has given to it. Supported: given to, or put up on a wall. Amounts are the givers' own business. */
  for (const r of resp.values()) {
    r.given = r.patrons.filter(p => p.st === 'given').length; r.pledged = r.patrons.filter(p => p.st === 'pledged').length;
    r.funded = r.given > 0; r.hosts = r.hostList.length; r.status = r.funded ? 'given' : r.pledged ? 'pledged' : r.patrons.length ? 'asked' : 'none';
    r.score = 3 * r.did.size + 2 * r.backers.size + (r.funded ? 4 : 0) + 2 * Math.min(3, r.hosts);
    r.votes = (r.votes0 || 0) + r.voters.size; r.voted = r.voters.has(S.me.dev);
  }
  for (const s of stats.values()) s.resps.sort((a, b) => (resp.get(b).score - resp.get(a).score) || (resp.get(b).issued - resp.get(a).issued));
  S.stats = stats; S.resp = resp;
}
function userPing(e) {
  const d = e.data || {}; const hum = ['need', 'offer', 'event', 'injured', 'lost', 'dead'].includes(e.type);
  const tx = d.tx && d.tx.n ? { id: null, n: d.tx.n, cn: d.tx.cn || d.tx.n, ic: d.tx.ic || 'Animalia', th: !!d.tx.th, na: !d.tx.intro, intro: !!d.tx.intro } : undefined;
  const u = { id: 'u:' + e.key, ev: e, user: true, hum, kind: e.type, lat: +e.lat, lng: +e.lng, b: hum ? 0 : e.b != null ? e.b : tx ? undefined : 5, st: STAGE_OF_TYPE[e.type], ref: e.ref, at: e.at, t: new Date(e.at).toISOString(), who: e.who || '', age: Math.round((Date.now() - e.at) / 864e5), rare: 0.5, d: isoDay(new Date(e.at)), sound: d.sound || '', title: d.text || d.note || '', said: d.text || '', photo: d.photo || null, n: +d.n || 0, tx };
  if (e.type === 'event') Object.assign(u, { isEvent: true, title: d.text || '', start: Date.parse(d.start) || null, venue: d.venue || '', link: d.link || '' });
  if (hum && tx) u.title = d.text || tx.cn;
  if (d.g) u.g = d.g; if (d.contact) u.contact = d.contact;
  return u;
}
const statOf = o => S.stats.get(o.id) || blankStat();
const respsOf = o => statOf(o).resps.map(k => S.resp.get(k)).filter(Boolean);
const didOf = o => respsOf(o).reduce((a, r) => a + r.did.size, 0);
function stageOf(o) {
  const s = statOf(o); const rs = respsOf(o);
  const fromResp = rs.some(r => r.did.size || r.done) ? 3 : rs.length ? 2 : (s.joins.size || s.drafts.length) ? 1 : 0;
  return Math.max(o.user ? (o.st || 0) : 0, fromResp);
}


/* ════════════════════════════════════════════════════════════════════
   THE RADIUS OF RESPONSIBILITY — every record holds the businesses and brands inside its radius, each with its role:
   on notice for what it leaves behind (single-use, new clothing, rat poison, night light, runoff, roaming cats),
   or worth backing for what it repairs, reuses, makes, grows and hosts.
   ════════════════════════════════════════════════════════════════════ */
function sectorOf(t) {
  const a = t.amenity, s = t.shop, c = t.craft, o = t.office; const has = (v, list) => v && list.includes(v);
  if (has(a, ['nightclub', 'theatre', 'arts_centre', 'music_venue', 'cinema', 'community_centre', 'events_venue'])) return 'VENUE';
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
/* the role a named place plays, from its OpenStreetMap tags */
function roleOfTags(t) {
  const a = t.amenity, s = t.shop, c = t.craft, o = t.office; const has = (v, list) => v && list.includes(v);
  if (has(s, ['second_hand', 'charity']) || t.second_hand === 'only') return 'reuse';
  if (has(c, ['tailor', 'dressmaker', 'shoemaker', 'upholsterer']) || has(s, ['tailor', 'repair', 'bicycle', 'shoe_repair'])) return 'repair';
  if (has(s, ['clothes', 'shoes', 'boutique', 'fashion_accessories', 'bag'])) return 'fashion';
  if (has(s, ['laundry', 'dry_cleaning'])) return 'fibres';
  if (s === 'garden_centre') return 'grower';
  if (has(s, ['hardware', 'doityourself', 'trade', 'agrarian'])) return 'poison';
  if (a === 'marketplace') return 'market';
  if (has(a, ['arts_centre', 'community_centre']) || s === 'art') return 'space';
  if (has(c, ['pottery', 'jeweller', 'printer', 'sculptor', 'carpenter']) || has(o, ['architect', 'design'])) return 'studio';
  if (has(s, ['organic', 'health_food', 'zero_waste', 'bulk'])) return 'coop';
  if (has(a, ['fast_food', 'ice_cream', 'food_court', 'pharmacy']) || has(s, ['convenience', 'supermarket', 'alcohol', 'beverages', 'kiosk', 'confectionery', 'chemist'])) return 'litter';
  if (has(a, ['fuel', 'car_wash']) || has(s, ['car_repair', 'car', 'tyres'])) return 'runoff';
  if (a === 'veterinary') return 'vet';
  if (s === 'pet') return 'pets';
  if (has(a, ['nightclub', 'bar', 'pub']) || o) return 'light';
  return 'owner';
}
const GRID = 0.004;
let bizGrid = new Map();
function indexBiz() { bizGrid = new Map(); (S.biz || []).forEach((b, i) => { const k = `${Math.floor(b[3] / GRID)},${Math.floor(b[4] / GRID)}`; if (!bizGrid.has(k)) bizGrid.set(k, []); bizGrid.get(k).push(i); }); }
function bizNear(lat, lng, R) {
  const out = []; if (!S.biz) return out;
  const di = Math.ceil(R / 111000 / GRID), dj = Math.ceil(R / (111000 * Math.cos(lat * Math.PI / 180)) / GRID), ci = Math.floor(lat / GRID), cj = Math.floor(lng / GRID);
  for (let i = ci - di; i <= ci + di; i++) for (let j = cj - dj; j <= cj + dj; j++) {
    const a = bizGrid.get(`${i},${j}`); if (!a) continue;
    for (const k of a) { const b = S.biz[k]; const d = haversine(lat, lng, b[3], b[4]); if (d <= R) out.push({ i: k, n: b[0], b: b[1], sec: b[2], lat: b[3], lng: b[4], d, partner: !!(b[5] && b[5].partner), role: roleOfRow(b) }); }
  }
  return out.sort((a, b) => a.d - b.d);
}
/* a business's role: its own, else its kind of trade's */
const roleOfRow = b => (b[5] && b[5].role) || (SECTORS[b[2]] || {}).role || 'owner';
const onNotice = role => !!(ROLES[role] && ROLES[role].on);
/* in the demo, the area's businesses and brands are the specimen roster; live, every named business on OpenStreetMap.
   None is signed up until it says so. */
const partnerRows = () => (DEMO ? DEMO.partners.map(p => [p.n, p.b || '', p.sec, p.lat, p.lng, { partner: !!p.signed, id: p.id, role: p.role }]) : []);
function useBusinesses(osm) {
  const rows = partnerRows(); const names = new Set(rows.map(r => norm(r[0])));
  for (const b of osm || []) if (!names.has(norm(b[0]))) rows.push(b);
  S.biz = rows; indexBiz(); refresh();
}
function loadBusinesses() {
  if (S.biz && S.bizFull) return Promise.resolve(S.biz);
  if (S.bizLoading) return S.bizLoading;
  if (!S.biz) useBusinesses([]);
  if (DEMO) { S.bizFull = true; return Promise.resolve(S.biz); }
  S.bizLoading = (async () => {
    const cached = store.get('da.biz.v3', null);
    if (cached && cached.list && Date.now() - cached.t < 7 * 864e5) { useBusinesses(cached.list); S.bizFull = true; return S.biz; }
    const bb = `${B.s - 0.006},${B.w - 0.008},${B.n + 0.006},${B.e + 0.008}`;
    const q = `[out:json][timeout:90];(nwr["shop"]["name"](${bb});nwr["amenity"~"^(cafe|restaurant|fast_food|bar|pub|ice_cream|food_court|biergarten|fuel|car_wash|car_rental|pharmacy|bank|veterinary|marketplace|nightclub|theatre|arts_centre|music_venue|cinema|community_centre|events_venue)$"]["name"](${bb});nwr["craft"]["name"](${bb});nwr["office"]["name"](${bb}););out center tags;`;
    for (const url of CONFIG.OVERPASS) {
      try {
        const res = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json(); const seen = new Set(); const list = [];
        for (const el of j.elements || []) {
          const t = el.tags || {}; const lat = el.lat != null ? el.lat : el.center && el.center.lat; const lng = el.lon != null ? el.lon : el.center && el.center.lon;
          if (lat == null || !t.name) continue; const k = `${t.name}|${lat.toFixed(4)}|${lng.toFixed(4)}`; if (seen.has(k)) continue; seen.add(k);
          list.push([t.name, t.brand && t.brand !== t.name ? t.brand : '', sectorOf(t), +lat.toFixed(5), +lng.toFixed(5), { role: roleOfTags(t) }]);
        }
        store.set('da.biz.v3', { t: Date.now(), list }); useBusinesses(list); S.bizFull = true; return S.biz;
      } catch (e) { /* the next mirror */ }
    }
    S.bizLoading = null; return S.biz;
  })();
  return S.bizLoading;
}
const within = o => (!S.biz || o.ob ? [] : bizNear(o.lat, o.lng, rangeOf(o)));
const liveEvent = u => !u.isEvent || !u.start || u.start + 3 * 3600e3 > Date.now();
/* a gig: tagged gig, or listed by Triple R (rrr) or Resident Advisor (ra) */
const isGig = o => !!o && !!o.isEvent && (o.tags || []).some(t => t === 'gig' || t === 'rrr' || t === 'ra');
const gigOf = o => ((o && o.tags) || []).map(t => GIGS[t]).find(Boolean) || null;
const cellsAll = () => [...S.obs.filter(o => !o.ob), ...S.user.filter(liveEvent), ...S.community.filter(c => c.kind !== 'refuge' && liveEvent(c)), ...S.stories, ...S.heroes];
/* each record holds the places in its radius, nearest first; each place holds the lives that reach it, most at risk first */
function computeOrbit() {
  const cell = new Map(), biz = new Map();
  if (S.biz) for (const o of cellsAll()) {
    const rows = within(o); if (!rows.length) continue; cell.set(o.id, rows);
    const deg = degOf(o);
    for (const r of rows) { let z = biz.get(r.i); if (!z) biz.set(r.i, z = { i: r.i, cells: [], deg: 0 }); z.cells.push({ id: o.id, d: r.d, deg }); z.deg = Math.max(z.deg, deg); }
  }
  for (const z of biz.values()) z.cells.sort((a, b) => b.deg - a.deg || a.d - b.d);
  S.orbit = { cell, biz };
}
/* the radius a business answers for: what it leaves behind travels this far */
const BIZ_R = 400;
/* the life it touches most: the nearest record of a kind its role reaches, within 3 km (litter rides the drains to the creek) */
function linkedLife(z) {
  const gs = (ROLES[z.role] || {}).g || []; if (!gs.length) return null; let best = null;
  for (const o of cellsAll()) { if (o.hum || isCold(o) || !gs.includes(glyphOf(o))) continue; const d = haversine(z.lat, z.lng, o.lat, o.lng); if (d < 3000 && (!best || d < best.d)) best = { o, d }; }
  return best;
}
const bizOf = i => { const b = S.biz && S.biz[i]; if (!b) return null; const z = S.orbit.biz.get(i) || { cells: [], deg: 0 }; return { i, n: b[0], brand: b[1], sec: b[2], lat: b[3], lng: b[4], partner: !!(b[5] && b[5].partner), pid: b[5] && b[5].id, role: roleOfRow(b), ...z }; };
const subjectOf = o => (o.ref != null && S.byId.get(o.ref) ? S.byId.get(o.ref) : o);
/* what a business has signed: every response it backs, and the briefs they belong to */
const pledgesOf = name => [...S.resp.values()].flatMap(r => r.patrons.filter(p => norm(p.n) === norm(name)).map(p => ({ r, p })));


/* ════════════════════════════════════════════════════════════════════
   THE GROUND — the satellite photograph on the land's own relief, always. No roads, no labels:
   the place as it is, so the marks above it (35-life.js) are the only things that speak.
   Colour is held back a little, so a cobalt point, the signal colour and the red mark stay legible on any roof or canopy.
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
    { id: 'ground', type: 'background', paint: { 'background-color': '#2C3631' } },
    { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-saturation': -0.32, 'raster-contrast': -0.04, 'raster-brightness-max': 0.94, 'raster-fade-duration': 0 } },
    { id: 'shade', type: 'hillshade', source: 'demShade', paint: { 'hillshade-exaggeration': 0.2, 'hillshade-shadow-color': '#0B2545', 'hillshade-highlight-color': '#FFFFFF', 'hillshade-accent-color': '#0B2545' } },
  ],
};
/* the frame: on a phone the white page is a sheet over the lower half, so the ground is framed above it */
const framePad = () => (innerWidth < 760 ? { top: 24, left: 16, right: 60, bottom: Math.round(innerHeight * (S.open ? 0.56 : 0)) + 16 } : 32);
const map = new maplibregl.Map({
  container: 'world', style, bounds: [[B.w, B.s], [B.e, B.n]], fitBoundsOptions: { padding: framePad() }, pitch: 0, bearing: 0, maxPitch: 70,
  attributionControl: false, fadeDuration: 0, renderWorldCopies: false,
  maxBounds: [[B.w - 0.07, B.s - 0.06], [B.e + 0.07, B.n + 0.06]],
});
map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: `<a href="#archive" class="da-about">${CONFIG.NAME} · ${CONFIG.BY.toUpperCase()}</a> · iNaturalist · © OpenStreetMap · Open-Meteo` }), 'bottom-left');
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a.da-about'); if (a) { e.preventDefault(); setView(1, false, 'archive'); } });
const sheetOffset = () => (innerWidth < 760 && S.open ? [0, -innerHeight * (document.body.classList.contains('placing') ? 0.37 : 0.26)] : [0, 0]);
map.on('load', () => {
  S.mapReady = true;
  const open = S.byId.get(S.sel);
  if (open) map.jumpTo({ center: [open.lng, open.lat], zoom: 15.6 });
  else { const cam = map.cameraForBounds([[B.w, B.s], [B.e, B.n]], { padding: framePad() }); if (cam && !reduced()) { map.jumpTo({ ...cam, zoom: cam.zoom - 0.7 }); map.easeTo({ ...cam, duration: 1400, easing: t => 1 - Math.pow(1 - t, 3) }); } else if (cam) map.jumpTo(cam); }
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
  life.stopTour();
  if (S.mode === 'place') { movePlace(e.lngLat); return; }   /* while placing, a touch on the ground moves the point */
  const h = life.hit(e.point.x, e.point.y);
  if (!h) { if (S.mode) closeRecord(); else { life.offer(e.lngLat); tick(1300); } return; }   /* empty ground: offer a new record here */
  if (h.kind === 'zoom') return;
  if (h.kind === 'new') { life.offer(null); startPlace({ lat: h.lat, lng: h.lng }); return; }
  if (h.kind === 'partner') { selectBiz(h.bi); return; }
  if (h.kind === 'tribe') { selectTribe(h.id); return; }
  select(h.id);
});
let hoverT = 0, hoverId = null;
map.on('mousemove', e => {
  if (hoverT) return; hoverT = setTimeout(() => { hoverT = 0; }, 40);
  const h = life.hit(e.point.x, e.point.y, true); map.getCanvas().style.cursor = h ? 'pointer' : '';
  const id = h && h.kind === 'cell' ? h.id : null;
  if (id !== hoverId) { hoverId = id; life.hover(id != null ? S.byId.get(id) : null); }
});
map.getCanvas().addEventListener('mouseleave', () => { hoverId = null; life.hover(null); });
map.on('contextmenu', e => { e.preventDefault(); life.stopTour(); if (S.mode === 'place') movePlace(e.lngLat); else startPlace(e.lngLat); });

/* ───────── City of Melbourne: drinking water and air temperature now, under ALERTS ───────── */
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
   THE GROUND, ALIVE — two canvases over the photograph.
   The still one holds plants, gatherings, people's needs and offers, posters, the past, and the web of a selection.
   The moving one holds the animals, each moving the way its kind moves and each kind in its own colour, and the alarms:
   a hurt animal's pulse, a lost animal's search area swept by a slow hand. An orange ring marks the lives the months ahead
   put in danger. The five in greatest need move across the ground they are known from. No words are written on the ground.
   Every icon is the thing itself, and every icon can be clicked.
   ════════════════════════════════════════════════════════════════════ */
const life = (() => {
  const make = cls => { const c = document.createElement('canvas'); c.className = cls; c.setAttribute('aria-hidden', 'true'); return c; };
  const baseCv = make('life'), fxCv = make('life fx');
  let bx = null, fx = null, W = 0, H = 0, dpr = 1, items = [], movers = [], net = [], bins = [], hidden = new Set(), curD = 0;
  let dirty = true, fxDirty = true, raf = 0, lastFx = 0, lastText = 0, wasSelecting = false, hoverIt = null;
  const tagEl = $('#tag'), handle = $('#radius');
  let tagCell = null, tagHide = 0, tourT = 0, tourOn = false, toured = false, tourTries = 0;
  let selT = 0, dragging = false;
  const audio = new Audio(); audio.preload = 'none'; let playing = '';
  const DIM = 0.3, TAU = Math.PI * 2;
  function resize() {
    if (!bx) return; const c = map.getContainer(); dpr = Math.min(2, devicePixelRatio || 1); W = c.clientWidth; H = c.clientHeight;
    for (const cv of [baseCv, fxCv]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = `${W}px`; cv.style.height = `${H}px`; }
    dirty = true;
  }
  function start() {
    const host = map.getCanvas().parentNode; host.appendChild(baseCv); host.appendChild(fxCv);
    bx = baseCv.getContext('2d'); fx = fxCv.getContext('2d'); resize(); data();
    if (!raf) raf = requestAnimationFrame(frame);
    /* no words on the ground: the tour that named records on arrival is gone; a tag shows only under the pointer */
    ['pointerdown', 'wheel', 'keydown'].forEach(n => addEventListener(n, stopTour, { passive: true }));
  }

  /* ───────── what each record is: the thing itself, in the shape of its kind of record ───────── */
  const sizeAt = () => { const z = S.mapReady ? map.getZoom() : 14; return clamp(Math.round((16 + (z - 12.5) * 4) / 2) * 2, 16, 28); };
  const PLACE_TONE = { flora: 'flora', injured: 'injured', dead: 'dead', lost: 'lost', need: 'need', offer: 'offer', event: 'event' };
  const PLACE_ICON = { need: 'plus', offer: 'give', event: 'people', injured: 'injured', dead: 'harm' };
  const PLANT_Z = 15.4;   /* plants show only close up, and small */
  function badgeOf(o, d0) {
    const d = d0 || sizeAt();
    if (o.id === 'place') {
      const k = PLACE_KINDS[o.kind] || PLACE_KINDS[0]; const g = placeGlyph(o);
      return { tone: k.f === 'fauna' ? M.toneOf(g) : PLACE_TONE[k.f] || 'k-other', g, i: g ? null : PLACE_ICON[k.f] || 'plus', d: d + 6 };
    }
    if (o.hero) { const deg = degOf(o); return { tone: M.toneOf(glyphOf(o)), g: glyphOf(o), d: d + 14, dz: deg >= 3 ? deg : 0, sig: !!o.tx.th, hero: true }; }
    if (o.hist) return { tone: 'hist', d: Math.max(8, Math.round(d * 0.42)) };
    if (o.story) return { tone: 'story', g: o.hum ? null : glyphOf(o), i: o.hum ? 'people' : null, d: d + 2, carried: !!o.done };
    if (o.kind === 'injured') return { tone: 'injured', g: o.tx ? glyphOf(o) : null, i: o.tx ? null : 'injured', d: d + 4 };
    if (o.kind === 'dead') return { tone: 'dead', g: o.tx ? glyphOf(o) : null, i: o.tx ? null : 'harm', d: d + 2 };
    if (o.kind === 'lost') return { tone: 'lost', g: o.tx ? glyphOf(o) : 'mammal', d: d + 4 };
    if (o.hum) {
      const k = o.kind; const gig = isGig(o); const i = gig ? 'hug' : o.i || (k === 'event' ? ((o.tags || []).includes('sound') ? 'sound' : 'people') : k === 'offer' ? 'give' : k === 'pulse' ? 'people' : k === 'refuge' ? 'refuge' : 'plus');
      if (gig) return { tone: 'event', g: null, i, d: d + 2 };
      return { tone: k === 'event' ? 'event' : k === 'offer' || k === 'pulse' ? 'offer' : 'need', g: o.g || null, i: o.g ? null : i, d, fresh: !!(o.user && Date.now() - o.at < 864e5) };
    }
    const sub = subjectOf(o); const g = glyphOf(o); const flora = ['Plantae', 'Fungi'].includes(kindOf(sub)) || bandOf(o) === 5 || g === 'plant' || g === 'fungi';
    if (isCold(o)) return { tone: 'cold', g, d: Math.max(12, Math.round(d * 0.64)) };
    const deg = degOf(o);
    const fresh = !!(o.isNew || (o.arrived && Date.now() - o.arrived < 7 * 864e5) || (o.user && Date.now() - o.at < 864e5));
    if (flora) return { tone: 'flora', g, d: Math.max(10, Math.round(d * 0.55)), sig: !!(sub.tx && sub.tx.th), dz: deg >= 3 ? deg : 0 };
    return { tone: M.toneOf(g), g, d: d + (o.user ? 2 : 0) + (deg >= 3 ? 2 : 0), sig: !!(sub.tx && sub.tx.th), fresh, n: o.n > 1 ? o.n : 0, dz: deg >= 3 ? deg : 0 };
  }
  /* the kind of life a record being placed will carry: the one chosen, else the one the words name, else any animal */
  function placeGlyph(p) { const k = PLACE_KINDS[p.kind] || PLACE_KINDS[0]; if (p.g) return p.g; if (p.tx) return glyphOf(p); if (k.f === 'flora') return 'plant'; return ['fauna', 'injured', 'dead', 'lost'].includes(k.f) ? 'paw' : null; }
  /* how far to search for an animal lost: a dog runs, a cat hides close */
  const searchOf = o => o.search || ({ dog: 900, cat: 350 }[glyphOf(o)] || 500);
  const MOVING = new Set(['k-bird', 'k-mammal', 'k-insect', 'k-spider', 'k-reptile', 'k-water', 'k-other']);
  /* which records speak on each page; the rest step back */
  function role(o, v) {
    if (v === 'stories') return o.story || respsOf(o).length || (o.hum && o.kind !== 'injured' && o.kind !== 'lost' && o.kind !== 'dead') ? 1 : 0;
    return 1;
  }
  function data() {
    if (!bx) return; const v = VIEWS[S.view].k; items = []; const now = Date.now(); curD = sizeAt();
    for (const o of [...S.hist, ...S.obs.filter(x => !x.ob), ...S.user.filter(liveEvent), ...S.community.filter(liveEvent), ...S.stories, ...S.heroes]) {
      const b = badgeOf(o, curD); const on = role(o, v); if (!on) b.a = DIM;
      const r0 = seeded(`${o.id}|${WEEK}`);
      items.push({ o, b, lng: o.lng, lat: o.lat, x: 0, y: 0, dx: 0, dy: 0, phase: r0(), on, resp: !o.story && !o.hist && respsOf(o).length > 0, pulse: 0, pc: null, radar: 0, moving: false, hero: !!o.hero });
    }
    for (const it of items) {
      const o = it.o; if (!it.on) continue;
      if (o.kind === 'injured' && now - o.at < 12 * 3600e3) { it.pulse = 3; it.pc = C.red; }
      else if (o.kind === 'lost' && now - o.at < 72 * 3600e3) it.radar = searchOf(o);
      else if (o.arrived && now - o.arrived < 5 * 60e3) { it.pulse = 2; it.pc = C.red; }
    }
    /* the three lives in extreme danger in the months ahead keep a slow orange ring */
    items.filter(it => it.on && !it.pulse && !it.o.hum && it.b.dz >= 4)
      .sort((a, b) => (b.hero - a.hero) || ((b.o.rare || 0) - (a.o.rare || 0))).slice(0, 4).forEach(it => { it.pulse = 1; it.pc = C.orange; });
    for (const it of items) it.moving = !reduced() && it.on && (it.hero || (MOVING.has(it.b.tone) && !M.STILL.has(it.b.g)));
    const rank = it => (it.b.tone === 'hist' ? 0 : it.b.tone === 'cold' ? 1 : it.b.tone === 'flora' ? 1.5 : !it.on ? 2 : it.hero ? 7 : it.moving ? 4 : it.pulse || it.radar ? 6 : 3);
    items.sort((a, b) => rank(a) - rank(b));
    movers = items.filter(it => it.moving || it.pulse || it.radar);
    networks(); dirty = true; fxDirty = true;
  }
  /* the network of support: each poster to the places that host it, and to any business that gave */
  function networks() {
    net = [];
    const at = n => (S.biz ? S.biz.findIndex(b => norm(b[0]) === norm(n)) : -1);
    for (const r of S.resp.values()) {
      const o = S.byId.get(r.cell); if (!o) continue;
      for (const n of r.hostList) { const bi = at(n); if (bi >= 0) net.push({ o, r, p: { n, st: 'host' }, bi, lat: S.biz[bi][3], lng: S.biz[bi][4], x: 0, y: 0, ox: 0, oy: 0 }); }
      for (const p of r.patrons) { if (p.person) continue; const bi = p.bi != null ? p.bi : at(p.n); if (bi >= 0 && S.biz[bi]) net.push({ o, r, p, bi, lat: S.biz[bi][3], lng: S.biz[bi][4], x: 0, y: 0, ox: 0, oy: 0 }); }
    }
  }
  function project() {
    const d = sizeAt(); if (d !== curD) { curD = d; for (const it of items) { const a = it.b.a; it.b = badgeOf(it.o, d); if (a != null) it.b.a = a; } }
    for (const it of items) { const p = map.project([it.lng, it.lat]); it.x = p.x; it.y = p.y; }
    for (const l of net) { const a = map.project([l.lng, l.lat]), b = map.project([l.o.lng, l.o.lat]); l.x = a.x; l.y = a.y; l.ox = b.x; l.oy = b.y; }
    for (const s of S.sensors) { const p = map.project([s.lng, s.lat]); s.x = p.x; s.y = p.y; }
    for (const f of S.fountains) { const p = map.project([f.lng, f.lat]); f.x = p.x; f.y = p.y; }
    cluster(); if (tagCell) placeTag(); placeHandle();
  }
  /* density: at a distance, quiet records that share a place become one stack, showing the kind seen most */
  function cluster() {
    bins = []; hidden = new Set(); const z = map.getZoom();
    for (const it of items) if ((it.b.tone === 'hist' && z < 13) || (it.b.tone === 'flora' && z < PLANT_Z && it.o.id !== S.sel && !it.resp && !it.o.story)) hidden.add(it);
    if (z >= 14.2) return;
    const G = curD + 8, m = new Map();
    for (const it of items) { if (!it.on || hidden.has(it) || it.b.tone === 'hist' || it.pulse || it.radar || it.hero || it.o.story || it.o.hum || it.o.id === S.sel) continue; const k = `${Math.floor(it.x / G)},${Math.floor(it.y / G)}`; if (!m.has(k)) m.set(k, []); m.get(k).push(it); }
    for (const list of m.values()) {
      if (list.length < 3) continue; let x = 0, y = 0; const count = new Map();
      for (const it of list) { x += it.x; y += it.y; hidden.add(it); const key = `${it.b.g}|${it.b.tone}`; count.set(key, (count.get(key) || 0) + 1); }
      const [g, tone] = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0].split('|');
      bins.push({ x: x / list.length, y: y / list.length, n: list.length, b: { g, tone: tone === 'cold' ? M.toneOf(g) : tone, d: curD, n: 3 } });
    }
  }

  /* ───────── drawing ───────── */
  /* the edge of the survey: a hairline frame, so the edge of what is known is visible */
  function frameLine(ctx) {
    const c = [[B.w, B.n], [B.e, B.n], [B.e, B.s], [B.w, B.s]].map(p => map.project(p));
    ctx.save(); ctx.beginPath(); c.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.setLineDash([1, 3]); ctx.stroke(); ctx.restore();
  }
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const metresPerPixel = lat => 78271.51696 * Math.cos(lat * Math.PI / 180) / Math.pow(2, map.getZoom());   // MapLibre zooms in 512-pixel tiles
  const selected = () => S.byId.get(S.sel) || (S.mode === 'place' ? S.place : null);
  /* one icon, from its bitmap, where its motion has taken it */
  function drawItem(ctx, it, m) {
    const sp = M.badgeSprite(it.b, dpr); const x = it.x + (m ? m.dx : 0), y = it.y + (m ? m.dy : 0);
    if (m && m.thread) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(it.x, it.y - it.b.d * 1.7); ctx.lineTo(x, y - it.b.d / 2); ctx.stroke(); ctx.restore(); }
    if (it.b.a != null) ctx.globalAlpha = it.b.a;
    if (m && (m.rot || m.sx !== 1)) { ctx.save(); ctx.translate(x, y); ctx.rotate(m.rot); ctx.scale(m.sx, 1); ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore(); }
    else ctx.drawImage(sp.cv, x - sp.size / 2, y - sp.size / 2, sp.size, sp.size);
    ctx.globalAlpha = 1;
    if (it.resp && it.on) { const r = it.b.d / 2, s = 3.4, ox = x - r * 0.78, oy = y - r * 0.78; ctx.save(); ctx.fillStyle = C.white; ctx.fillRect(ox - s - 1.2, oy - s - 1.2, s * 2 + 2.4, s * 2 + 2.4); ctx.fillStyle = C.cobalt; ctx.fillRect(ox - s, oy - s, s * 2, s * 2); ctx.restore(); }
  }
  /* the selection: a point becomes a line, the line a boundary, the boundary a plane, and the plane shows what it held */
  function selection(ctx, now) {
    const o = selected(); if (!o || S.mode === 'biz') return;
    const it = items.find(x => x.o === o); const p0 = map.project([o.lng, o.lat]); const x = p0.x, y = p0.y;
    const e = reduced() ? 9999 : now - selT; const kA = ease(e / 220), kB = ease((e - 160) / 520), kC = ease((e - 560) / 320);
    const R = rangeOf(o); const rp = R / metresPerPixel(o.lat);
    ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + 8 + (W + 4 - x - 8) * kA, y); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    if (kC > 0) { ctx.save(); ctx.globalAlpha = 0.2 * kC; ctx.beginPath(); ctx.arc(x, y, rp, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.restore(); }
    if (kB > 0) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, rp, -Math.PI / 2, -Math.PI / 2 + TAU * kB); ctx.strokeStyle = C.white; ctx.lineWidth = dragging ? 2.4 : 1.6; ctx.stroke(); ctx.restore(); }
    if (kB >= 1) {
      ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rp, y); ctx.stroke(); ctx.restore();
    }
    if (e > 760) {
      const rows = S.orbit.cell.get(o.id) || (S.mode === 'place' ? within(o) : []);
      const mode = focusK || 'zone'; const quiet = mode !== 'zone' && mode !== 'biz';
      const hosts = new Set(respsOf(o).flatMap(r => r.hostList.map(norm)));
      const fits = new Set(((BRIEFS.find(x => x.id === S.brief) || {}).roles || []));
      rows.slice(0, 60).forEach(b => {
        const k = reduced() ? 1 : ease((e - 760 - (b.d / R) * 520) / 260); if (k <= 0) return;
        const p = map.project([b.lng, b.lat]); const me = mode === 'biz' && b.i === focusKey; const host = hosts.has(norm(b.n)); const on = onNotice(b.role); const fit = fits.has(b.role);
        const a = k * (quiet ? 0.14 : mode === 'biz' ? (me ? 1 : 0.2) : 1);
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = me || fit ? C.white : on ? C.neon : 'rgba(255,255,255,.75)'; ctx.lineWidth = me ? 2.6 : fit ? 2.2 : on ? 1.6 : 1; ctx.setLineDash(host || me || on || fit ? [] : [2, 3]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.restore();
        M.pin(ctx, { f: 'partner', s: host || fit, on, half: false, r: (me ? 4.6 : fit ? 4.2 : 3.4), a }, p.x, p.y);
      });
      if (mode === 'biz') { const b = S.biz && S.biz[focusKey]; if (b && !rows.some(r => r.i === focusKey)) { const q = map.project([b[4], b[3]]); ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = 2.2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore(); M.pin(ctx, { f: 'partner', s: false, r: 5.4 }, q.x, q.y); } }
      else if (mode === 'heat') heatWeb(ctx, o, x, y, R);
      else if (mode === 'poster') posterWeb(ctx, x, y);
    }
    const b = it ? it.b : badgeOf(o);
    M.badge(ctx, { ...b, a: 1, d: Math.round((b.tone === 'hist' || b.tone === 'cold' ? curD : b.d) * (1 + 0.42 * kA)), tone: b.tone === 'hist' || b.tone === 'cold' ? 'fauna' : b.tone, g: b.g || (b.tone === 'hist' ? glyphOf(o) : null) }, x, y);
  }
  /* the webs a record can show, chosen by what the pointer rests on in the card */
  /* danger: the lives inside the boundary the months ahead put in severe danger */
  function heatWeb(ctx, o, x, y, R) {
    let n = 0; ctx.save();
    for (const it of items) {
      if (it.o === o || it.o.hum || it.b.tone === 'cold' || it.b.tone === 'hist' || !(it.b.dz >= 3)) continue;
      if (haversine(o.lat, o.lng, it.lat, it.lng) > R) continue; n++;
      const px = it.x + it.dx, py = it.y + it.dy;
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(px, py, it.b.d / 2 + 7, 0, TAU); ctx.fillStyle = 'rgba(255,122,0,.35)'; ctx.fill();
      ctx.strokeStyle = C.orange; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px, py); ctx.stroke();
    }
    ctx.restore();
    return n;
  }
  /* a poster: lines to the places that host it */
  function posterWeb(ctx, x, y) {
    const r = S.resp.get(focusKey); if (!r) return 'POSTER';
    const marks = [];
    for (const h of r.hostList) { const bi = S.biz ? S.biz.findIndex(b => norm(b[0]) === norm(h)) : -1; if (bi >= 0) marks.push({ b: S.biz[bi] }); }
    ctx.save();
    for (const m of marks) { const q = map.project([m.b[4], m.b[3]]); m.x = q.x; m.y = q.y; ctx.strokeStyle = C.white; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.strokeRect(q.x - 8, q.y - 8, 16, 16); }
    ctx.restore();
    for (const m of marks) M.pin(ctx, { f: 'partner', s: true, r: 5 }, m.x, m.y);
    return marks.length;
  }
  let focusK = null, focusKey = null;
  function focus(k, key) { k = k || null; key = key == null ? null : key; if (k === focusK && key === focusKey) return; focusK = k; focusKey = key; dirty = true; }
  /* a business: the radius it answers for, and a line to every life in it; the lives its role touches most, drawn bold */
  function business(ctx) {
    if (S.mode !== 'biz') return; const z = bizOf(S.bizSel); if (!z) return; const p = map.project([z.lng, z.lat]);
    const rp = BIZ_R / metresPerPixel(z.lat); const on = onNotice(z.role); const gs = (ROLES[z.role] || {}).g || [];
    ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y, rp, 0, TAU); ctx.fillStyle = on ? 'rgba(230,248,74,.22)' : 'rgba(255,255,255,.12)'; ctx.fill();
    ctx.setLineDash([4, 3]); ctx.lineWidth = 1.6; ctx.strokeStyle = on ? C.neon : C.white; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    ctx.save();
    for (const it of items) {
      if (it.o.hum || it.b.tone === 'hist' || hidden.has(it)) continue; if (haversine(z.lat, z.lng, it.lat, it.lng) > BIZ_R) continue;
      const linked = gs.includes(glyphOf(it.o)); ctx.globalAlpha = linked ? 1 : 0.55; ctx.strokeStyle = linked ? (on ? C.neon : C.white) : 'rgba(255,255,255,.7)'; ctx.lineWidth = linked ? 2.2 : 0.8;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(it.x + it.dx, it.y + it.dy); ctx.stroke();
    }
    ctx.restore();
    M.pin(ctx, { f: 'partner', s: z.partner, on, r: 6 }, p.x, p.y);
  }
  /* the support layer: each poster to the places that host it */
  function network(ctx, v) {
    if (v !== 'stories' && !(S.sel && String(S.sel).startsWith('story:'))) return;
    const sel = S.sel;
    ctx.save();
    for (const l of net) {
      const on = sel ? l.o.id === sel : true; if (!on && !l.o.story) continue;
      ctx.globalAlpha = on ? (sel ? 1 : 0.6) : 0.15; ctx.strokeStyle = C.white; ctx.lineWidth = sel && on ? 1.8 : 1.1; ctx.setLineDash(l.p.st === 'host' ? [] : [2, 3]);
      ctx.beginPath(); ctx.moveTo(l.ox, l.oy); ctx.lineTo(l.x, l.y); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    for (const l of net) {
      const on = sel ? l.o.id === sel : true; if (!on && !l.o.story) continue;
      M.pin(ctx, { f: 'partner', s: true, r: sel && on ? 5.2 : 4, a: on ? 1 : 0.3 }, l.x, l.y);
    }
  }
  /* on NOW: soft orange planes under the lives in extreme danger in the months chosen */
  function fields(ctx) {
    for (const it of items) {
      if (!it.on || it.o.hum || !(it.b.dz >= 4) || it.b.tone === 'flora' || off(it) || hidden.has(it)) continue;
      ctx.save(); ctx.globalAlpha = 0.42; ctx.beginPath(); ctx.arc(it.x, it.y, it.b.d / 2 + 13, 0, TAU); ctx.fillStyle = C.orange; ctx.fill(); ctx.restore();
    }
  }
  const off = (it, m = 50) => it.x < -m || it.y < -m || it.x > W + m || it.y > H + m;
  /* patches on the ground: on NOW, where the five in greatest need are known to live; on STORIES, the ground groups already care for */
  /* ground cared for, drawn as patches: each blob an uneven round, the same shape every time it is drawn */
  function blob(ctx, x, y, r, seed) {
    const n = 18, pt = i => { const a = (i / n) * TAU; const k = 1 + 0.15 * Math.sin(a * 3 + seed) + 0.07 * Math.sin(a * 5 + seed * 1.7); return [x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]; };
    const P = Array.from({ length: n }, (_, i) => pt(i)); const mid = i => { const a = P[i % n], b = P[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    const m0 = mid(n - 1); ctx.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const m = mid(i); ctx.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); } ctx.closePath();
  }
  function patch(ctx, blobs, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
    for (const [la, ln, r] of blobs) { const p = map.project([ln, la]); const rp = r / metresPerPixel(la); if (p.x < -rp * 1.3 || p.y < -rp * 1.3 || p.x > W + rp * 1.3 || p.y > H + rp * 1.3) continue; blob(ctx, p.x, p.y, rp, ((la * 7919 + ln * 104729) % TAU + TAU) % TAU); }
    ctx.fill(); ctx.restore();
  }
  function zones(ctx, v) {
    /* the homes of the five: plain from above, fainter close in, so they never bury what is on the ground */
    const zf = clamp(1 - (map.getZoom() - 14.8) * 0.4, 0.3, 1);
    if (v === 'now' && S.mode !== 'tribe') for (const h of S.heroes) { const sel = S.sel === h.id; patch(ctx, h.home.map(([a, b]) => [a, b, 170]), C.kind[M.GROUP[glyphOf(h)]] || C.kind.other, sel ? 0.36 : 0.15 * zf); }
    if (v === 'stories' || S.mode === 'tribe') for (const t of S.tribes) { const sel = S.tribeSel === t.id; patch(ctx, t.blobs, C.tribe[t.kind] || C.tribe.park, sel ? 0.55 : S.tribeSel ? 0.16 : 0.32); }
  }
  /* the still layer */
  function drawBase(now, selecting) {
    const v = VIEWS[S.view].k; const ctx = bx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    frameLine(ctx);
    zones(ctx, v);
    if (v === 'now') fields(ctx);
    network(ctx, v);
    for (const it of items) { if (it.moving || it.pulse || it.radar || off(it) || hidden.has(it) || it.o.id === S.sel) continue; drawItem(ctx, it, null); }
    for (const b of bins) { const sp = M.badgeSprite(b.b, dpr); ctx.drawImage(sp.cv, b.x - sp.size / 2, b.y - sp.size / 2, sp.size, sp.size); }
    if (v === 'now' && (S.wx.tmax || 0) >= HEAT.hot) {   /* on a hot day: the drinking water and the air temperature now */
      for (const f of S.fountains) { if (f.x == null) continue; ctx.save(); ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.restore(); M.icon(ctx, 'water', f.x, f.y, 10, C.cobalt); }
      for (const s of S.sensors) {
        if (s.x == null) continue; const txt = `${s.t.toFixed(1)}°`; ctx.save(); ctx.font = '500 10px "IBM Plex Mono", monospace'; const w = ctx.measureText(txt).width + 8;
        ctx.fillStyle = s.t >= HEAT.hot ? C.orange : C.white; ctx.fillRect(s.x - w / 2, s.y - 7, w, 14); ctx.fillStyle = C.navy; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, s.x, s.y + 0.5); ctx.restore();
      }
    }
    business(ctx);
    if (!selecting) selection(ctx, now);
  }
  /* the moving layer: lost animals' search areas, the animals themselves, alarms, the record under the pointer */
  function drawFx(now, selecting) {
    const ctx = fx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const t = now / 1000, still = reduced(); const amp = clamp((map.getZoom() - 12) / 3, 0.35, 1);
    /* a lost animal's search area belongs to NOW; on STORIES and among the groups it would only hide the ground */
    if (S.view === 0 && S.mode !== 'tribe') for (const it of movers) { if (!it.radar || hidden.has(it)) continue; const R = it.radar / metresPerPixel(it.lat); if (it.x < -R || it.y < -R || it.x > W + R || it.y > H + R) continue; M.radar(ctx, it.x, it.y, R, still ? 0 : t, it.phase); }
    for (const it of movers) {
      if (off(it) || hidden.has(it) || it.o.id === S.sel) continue;
      if (it.pulse && !still) M.pulse(ctx, { pulse: it.pulse, pc: it.pc, r: it.b.d / 2 - 2, f: 'fauna' }, it.x, it.y, t, it.phase);
      let m = null; if (it.moving && !still) { m = it.hero ? M.heroMotion(it.o.heroOf.move, t, it.phase, amp) : M.motion(it.b.g, t, it.phase, amp); it.dx = m.dx; it.dy = m.dy; } else { it.dx = 0; it.dy = 0; }
      drawItem(ctx, it, m);
    }
    if (hoverIt && hoverIt.o.id !== S.sel && !off(hoverIt) && !hidden.has(hoverIt)) { const r = hoverIt.b.d / 2 + 5; ctx.save(); ctx.beginPath(); ctx.arc(hoverIt.x + hoverIt.dx, hoverIt.y + hoverIt.dy, r, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
    if (selecting) selection(ctx, now);
    /* the record being placed breathes: one ring leaving it, until it is placed */
    if (S.mode === 'place' && S.place && !still) { const q = map.project([S.place.lng, S.place.lat]); const k = (now / 1400) % 1; ctx.save(); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(q.x, q.y, 14 + k * 26, 0, TAU); ctx.strokeStyle = C.white; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore(); }
    if (ghost) { const q = map.project([ghost.lng, ghost.lat]); M.badge(ctx, { tone: 'need', i: 'plus', d: 30 }, q.x, q.y); }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || !bx) return;
    const selecting = !!selT && !reduced() && now - selT < 1700;
    if (selecting !== wasSelecting) { wasSelecting = selecting; dirty = true; }
    if (dirty) { dirty = false; project(); drawBase(now, selecting); fxDirty = true; }
    const moving = !reduced() && (movers.length > 0 || selecting || S.mode === 'place');
    if (fxDirty || (moving && now - lastFx >= (selecting ? 1000 / 30 : 1000 / 24) - 2)) { fxDirty = false; lastFx = now; drawFx(now, selecting); }
    secondHand(now);
  }
  function secondHand(now) { if (now - lastText < 1000) return; lastText = now; }
  /* a touch on empty ground offers a new record there */
  let ghost = null, ghostT = 0;
  function offer(ll) { ghost = ll ? { lat: ll.lat, lng: ll.lng } : null; clearTimeout(ghostT); if (ghost) ghostT = setTimeout(() => { ghost = null; fxDirty = true; }, 3500); fxDirty = true; }

  /* ───────── the radius instrument: drag the boundary; what it holds changes with it ───────── */
  function placeHandle() {
    const o = S.mode === 'ping' || S.mode === 'place' ? selected() : null;
    if (!o || !S.mapReady || o.ob || o.hist) { handle.hidden = true; return; }
    const p = map.project([o.lng, o.lat]); const rp = rangeOf(o) / metresPerPixel(o.lat); const hx = p.x + rp;
    if (hx > W - 10 || hx < 10 || p.y < 10 || p.y > H - 10) { handle.hidden = true; return; }
    handle.hidden = false; handle.style.transform = `translate(${Math.round(hx)}px, ${Math.round(p.y)}px)`;
  }
  const commitRadius = debounce(() => { computeOrbit(); refreshRecord(); }, 120);
  handle.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); dragging = true; handle.setPointerCapture(e.pointerId); handle.classList.add('on'); map.dragPan.disable(); });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return; const o = selected(); if (!o) return;
    const r = map.getContainer().getBoundingClientRect(); const ll = map.unproject([e.clientX - r.left, e.clientY - r.top]);
    const R = clamp(haversine(o.lat, o.lng, ll.lat, ll.lng), CONFIG.RADIUS.min, CONFIG.RADIUS.max);
    S.radius.set(o.id, Math.round(R / 10) * 10); placeHandle(); commitRadius(); dirty = true;
  });
  const endDrag = () => { if (!dragging) return; dragging = false; handle.classList.remove('on'); map.dragPan.enable(); computeOrbit(); refreshRecord(); dirty = true; buzz(6); };
  handle.addEventListener('pointerup', endDrag); handle.addEventListener('pointercancel', endDrag);
  handle.addEventListener('keydown', e => { const o = selected(); if (!o) return; const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 25 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -25 : 0; if (!d) return; e.preventDefault(); S.radius.set(o.id, clamp(rangeOf(o) + d, CONFIG.RADIUS.min, CONFIG.RADIUS.max)); placeHandle(); commitRadius(); dirty = true; });

  /* ───────── hit-testing where things are drawn, moving ones where they have moved to ───────── */
  function hit(x, y, peek) {
    const slack = coarse() ? 10 : 5; let best = null;
    const consider = (d, h) => { if (d <= slack && (!best || d < best.d)) best = { ...h, d }; };
    if (ghost) { const q = map.project([ghost.lng, ghost.lat]); if (Math.hypot(q.x - x, q.y - y) < 20) return { kind: 'new', lat: ghost.lat, lng: ghost.lng, d: 0 }; }
    if (S.view === 1 || (S.sel && String(S.sel).startsWith('story:'))) for (const l of net) consider(Math.hypot(l.x - x, l.y - y) - 5, { kind: 'partner', bi: l.bi });
    for (const b of bins) if (Math.abs(b.x - x) < b.b.d / 2 + 4 && Math.abs(b.y - y) < b.b.d / 2 + 4) { if (!peek) map.easeTo({ center: map.unproject([b.x, b.y]), zoom: map.getZoom() + 1.6, duration: reduced() ? 0 : 500 }); return { kind: 'zoom', d: 0 }; }
    for (const it of items) { if (hidden.has(it)) continue; const d = Math.hypot(it.x + it.dx - x, it.y + it.dy - y) - it.b.d / 2; consider(d + (it.on ? 0 : 6) + (it.b.tone === 'hist' ? 3 : 0), { kind: 'cell', id: it.o.id }); }
    const sel = S.byId.get(S.sel);
    if (sel) for (const b of (S.orbit.cell.get(sel.id) || []).slice(0, 60)) { const p = map.project([b.lng, b.lat]); consider(Math.hypot(p.x - x, p.y - y) - 4, { kind: 'partner', bi: b.i }); }
    if (!best && !peek && (S.view === 1 || S.mode === 'tribe')) { const ll = map.unproject([x, y]); const t = S.tribes.find(tr => inTribe(tr, ll.lat, ll.lng)); if (t) return { kind: 'tribe', id: t.id, d: 0 }; }
    return best;
  }

  /* ───────── the tag: on pointing, and on the tour ───────── */
  function tagHTML(o) {
    const sub = subjectOf(o);
    const ph = o.photo ? `<img src="${esc(o.photo)}" alt="">` : sub.ph && licOpen(sub.ph.l) ? `<img src="${esc(photoURL(sub.ph.u, 'small'))}" alt="">` : `<img src="${badgeImg(badgeOf(o, 40), 44)}" alt="">`;
    const voice = (sub.so && sub.so.u) || o.sound;
    const when = o.isEvent && o.start ? dayWord(o.start) : o.story ? '' : o.hist ? String(o.d).slice(0, 4) : o.at && (o.comm || o.user) ? `${fmtClock(o.at)}` : o.t ? fmtClock(o.t) : '';
    const w = !o.hum && !isCold(o) && !isAlarm(o) ? worstWhen(o) : null;
    return `${ph}<span class="tx"><b>${esc(nameOf(o))}</b>${when ? `<small>${esc(when)}</small>` : ''}${w && w.deg >= 2 ? `<small class="dg d${w.deg}">${DEG[w.deg]} · ${w.word}</small>` : ''}</span>${voice ? `<button type="button" class="play" data-u="${esc(voice)}" aria-label="Play the call">${icon(playing === voice && !audio.paused ? 'pause' : 'play')}</button>` : ''}`;
  }
  function placeTag() {
    const p = map.project([tagCell.lng, tagCell.lat]); const w = tagEl.offsetWidth || 220, h = tagEl.offsetHeight || 60;
    let x = p.x + 18, y = p.y - h - 14; if (x + w > W - 8) x = p.x - w - 18; if (y < 8) y = p.y + 18; x = clamp(x, 8, Math.max(8, W - w - 8));
    tagEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
  function showTag(o) { clearTimeout(tagHide); if (!o) return; tagCell = o; tagEl.innerHTML = tagHTML(o); tagEl.classList.toggle('alarm', isAlarm(o)); tagEl.hidden = false; placeTag(); }
  function hover(o) {
    if (tourOn && o) stopTour();
    const it = o ? items.find(x => x.o === o) || null : null; if (it !== hoverIt) { hoverIt = it; fxDirty = true; }
    if (o) { showTag(o); return; }
    clearTimeout(tagHide); tagHide = setTimeout(() => { if (!tagEl.matches(':hover')) { tagEl.hidden = true; tagCell = null; } }, 300);
  }
  tagEl.addEventListener('mouseleave', () => hover(null));
  tagEl.addEventListener('click', e => {
    const b = e.target.closest('.play'); if (b) { e.stopPropagation(); play(b.dataset.u, b); return; }
    if (tagCell) { const id = tagCell.id; tagEl.hidden = true; tagCell = null; stopTour(); select(id); }
  });
  function play(url, btn) {
    if (!prefs.sound) { toast('Sound is off.'); return; }
    if (playing === url && !audio.paused) { audio.pause(); if (btn) btn.innerHTML = icon('play'); return; }
    playing = url; audio.src = url; audio.play().then(() => { if (btn) btn.innerHTML = icon('pause'); }).catch(() => toast('This call will not play here.'));
    audio.onended = () => { if (btn) btn.innerHTML = icon('play'); };
  }
  /* each visit opens on what matters now: an animal hurt, dead or lost, then what is new or in danger */
  function startTour() {
    if (toured || S.mode || S.view) return;
    if (!S.obs.some(o => typeof o.id === 'number')) { if (++tourTries < 20) { setTimeout(startTour, 1500); return; } }
    toured = true;
    const alarms = alarmsNow();
    let list = S.obs.filter(o => !o.ob && !isCold(o) && (o.isNew || o.arrived)).sort((a, b) => (b.c || '').localeCompare(a.c || ''));
    if (!list.length) { const r = seeded(WEEK); list = S.obs.filter(o => !o.ob && !isCold(o) && degOf(o) >= 3).sort(() => r() - 0.5); }
    list = [...alarms, ...list].slice(0, 5); if (!list.length) return;
    tourOn = true; let i = 0;
    const step = () => { if (!tourOn) return; if (i >= list.length) { stopTour(); return; } const o = list[i++]; const p = map.project([o.lng, o.lat]); if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) { step(); return; } showTag(o); tourT = setTimeout(step, 3200); };
    step();
  }
  function stopTour() { if (!tourOn) return; tourOn = false; clearTimeout(tourT); tagEl.hidden = true; tagCell = null; }
  return {
    start, data, resize, moved: () => { dirty = true; }, hover, play, stopTour, hit, badgeOf, offer, searchOf, blob,
    select: () => { selT = performance.now(); focusK = null; focusKey = null; ghost = null; dirty = true; }, placeHandle, focus,
    get focused() { return focusK; },
    get items() { return items; }, get net() { return net; }, get bins() { return bins; }, get movers() { return movers; }, get hidden() { return hidden; },
  };
})();
function needsSupport(r) { if (r.funded || r.done) return false; const o = S.byId.get(r.cell); return !!o; }


/* ════════════════════════════════════════════════════════════════════
   THE WHITE PAGE — two pages. NOW is the emergency: the El Niño months ahead, the five lives in greatest need,
   what is hurt or lost right now, the lives in danger, the briefs for the season, and the gigs and gatherings.
   STORIES is the response: the field list, the guide and the downloads first, then the posters people vote up,
   the groups already caring for the ground, fifty briefs that have worked elsewhere, the businesses, the archive.
   ════════════════════════════════════════════════════════════════════ */
const panel = $('#panel'), rail = $('#rail'), viewEl = $('#view');
rail.innerHTML = VIEWS.map((v, i) => `<button type="button" class="tab" data-i="${i}" aria-label="${v.label}" title="${v.label}" aria-pressed="${i === 0}"><span class="sq">${icon(v.icon)}</span><small class="tw">${v.w}</small><i class="flag" hidden></i></button>`).join('');
rail.addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; tick(1400 + 160 * +b.dataset.i); const i = +b.dataset.i; if (i === S.view && !S.mode) { setOpen(!S.open); return; } setView(i); });
rail.addEventListener('keydown', e => { const b = e.target.closest('.tab'); if (!b) return; const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (!d) return; e.preventDefault(); const all = $$('#rail .tab'); all[(all.indexOf(b) + d + all.length) % all.length].focus(); });
new ResizeObserver(() => { if (S.mapReady) map.resize(); }).observe($('#world'));
function setOpen(on) { S.open = on; document.body.classList.toggle('shut', !on); buzz(5); }

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
/* a section's title */
const sh = (t, cls = '') => `<h3 class="sh ${cls}">${t}</h3>`;
/* a degree of danger, in orange, with the months it is worst */
const degChip = (deg, word = '') => (deg ? `<i class="dg d${deg}">${DEG[deg]}${word ? ` · ${word}` : ''}</i>` : '');
const row = (o, sub = '', right = '') => `<li><button type="button" class="row" data-id="${esc(String(o.id))}"><img class="pg" src="${pinOf(o)}" alt=""><span class="nm"><b>${esc(nameOf(o))}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="rt">${right}</span></button></li>`;
const elapsed = t => { const s = Math.max(0, Math.floor((Date.now() - t) / 1000)); const h = Math.floor(s / 3600); return h >= 48 ? `${Math.floor(h / 24)} DAYS` : h >= 1 ? `${h} H ${pad2(Math.floor(s % 3600 / 60))}` : `${Math.floor(s / 60)} MIN`; };
const since = t => `<span class="cdn up mono" data-up="${t}">${elapsed(t)}</span>`;
/* right now: an animal hurt in the last twelve hours, found dead in the last two days, or lost in the last three */
const alarmsNow = () => { const now = Date.now(); const ord = { injured: 0, dead: 1, lost: 2 }; return [...S.community, ...S.user].filter(o => (o.kind === 'injured' && now - o.at < 12 * 3600e3) || (o.kind === 'dead' && now - o.at < 48 * 3600e3) || (o.kind === 'lost' && now - o.at < 72 * 3600e3)).sort((a, b) => ord[a.kind] - ord[b.kind] || b.at - a.at); };
const BIRDS = new Set(['bird', 'parrot', 'waterbird', 'owl', 'raptor']);
const telOf = o => (o.tel ? o.tel : o.kind === 'injured' ? ((o.tags || []).includes('h5') ? 'tel:1800675888' : 'tel:0384007300') : o.kind === 'dead' && ((o.tags || []).includes('h5') || BIRDS.has(glyphOf(o))) ? 'tel:1800675888' : '');
const ACT_OF = { injured: 'CALL', dead: 'REPORT', lost: 'SEARCH' };
const alarmRow = o => { const tel = telOf(o); const act = o.kind === 'lost' ? `<button type="button" class="callb lostb" data-search="${esc(String(o.id))}">${icon('lost')}<small>SEARCH</small></button>` : tel ? `<a class="callb${o.kind === 'dead' ? ' deadb' : ''}" href="${tel}">${icon('phone')}<small>${ACT_OF[o.kind]}</small></a>` : o.link ? `<a class="callb" href="${esc(o.link)}" target="_blank" rel="noopener">${icon('out')}<small>OPEN</small></a>` : '';
  return `<li class="alarm ${o.kind}"><button type="button" class="row" data-id="${esc(String(o.id))}"><img class="pg" src="${pinOf(o)}" alt=""><span class="nm"><b>${esc(nameOf(o))}</b><small>${o.kind === 'injured' ? 'HURT' : o.kind === 'dead' ? 'DEAD · DO NOT TOUCH' : 'LOST'} · ${since(o.at)} AGO</small></span></button>${act}</li>`; };

/* ───────── the two pages ───────── */
function setView(i, keep, part) {
  const was = S.view; S.view = i; document.body.dataset.view = VIEWS[i].k;
  $$('#rail .tab').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
  if (!S.open) setOpen(true);
  if (S.mode && !keep) closeRecord(true);
  if (was !== i) buzz(5);
  renderView(); life.data();
  if (was !== i) { viewEl.classList.remove('in'); void viewEl.offsetWidth; viewEl.classList.add('in'); }
  if (part) goPart(part);
  try { history.replaceState(null, '', i ? '#' + (part || VIEWS[i].k) : location.pathname + location.search); } catch (e) { /* file:// */ }
}
/* a part of a page by name */
const PARTS = { now: [0, null], outlook: [0, 'sec-heat'], forecast: [0, 'sec-heat'], heroes: [0, 'sec-heroes'], alerts: [0, 'sec-alarms'], emergencies: [0, 'sec-alarms'], noticing: [0, 'sec-noticing'], briefs: [0, 'sec-briefs'], events: [0, 'sec-events'], gigs: [0, 'sec-events'],
  stories: [1, null], tools: [1, 'sec-tools'], field: [1, 'sec-tools'], posters: [1, 'sec-posters'], funded: [1, 'sec-posters'], unfunded: [1, 'sec-posters'], support: [1, 'sec-posters'], groups: [1, 'sec-tribes'], tribes: [1, 'sec-tribes'],
  library: [1, 'sec-library'], partners: [1, 'sec-partners'], businesses: [1, 'sec-partners'], archive: [1, 'sec-archive'] };
function goPart(part) { const id = (PARTS[part] || [])[1]; const el = id && document.getElementById(id); if (el) viewEl.scrollTop = Math.max(0, el.offsetTop - 8); }
function renderView() {
  if (S.mode) return;
  const k = VIEWS[S.view].k;
  viewEl.innerHTML = k === 'now' ? viewNow() : viewStories();
  viewEl.scrollTop = 0;
  if (k === 'now') { bindOutlook(); startHeroes(); } else { stopHeroes(); bindArchive(); fillMinis(); fillTools(); }
  if (k === 'now' && (S.wx.tmax || 0) >= HEAT.hot) loadOverlays();
}
/* a refresh keeps the place on the page, and never takes a search from under the hand */
function refreshPanel() {
  flags(); if (S.mode) return;
  const q = $('#ix-q'); if (q && (q.value || document.activeElement === q)) return;
  const st = viewEl.scrollTop; renderView(); viewEl.scrollTop = st;
}
let refreshQ = 0;
function refresh() { if (refreshQ) return; refreshQ = requestAnimationFrame(() => { refreshQ = 0; buildHeroes(); computeOrbit(); life.data(); refreshPanel(); if (S.mode) refreshRecord(); }); }
setInterval(() => { $$('#panel .cdn[data-up]').forEach(t => { t.textContent = elapsed(+t.dataset.up); }); }, 1000);
/* a month chosen on the strip: the page and the ground show that stretch of three months */
const pickMonth = k => { k = clamp(k, 0, OUT_N - 1); if (k === S.mo) return; S.mo = k; life.data(); const st = viewEl.scrollTop; renderView(); viewEl.scrollTop = st; tick(1500 + 50 * k); };
/* the search area of an animal lost: the whole of it on the ground */
function searchFor(id) { const o = S.byId.get(id); if (!o) return; select(id); const R = life.searchOf(o); const dLat = R / 111000, dLng = R / (111000 * Math.cos(o.lat * Math.PI / 180)); if (S.mapReady) setTimeout(() => map.fitBounds([[o.lng - dLng, o.lat - dLat], [o.lng + dLng, o.lat + dLat]], { padding: framePad(), duration: reduced() ? 0 : 700 }), 60); }
/* one vote per device for a poster; a second touch takes it back */
async function vote(key) {
  const r = S.resp.get(key); if (!r) return;
  const gone = new Set(ledger.local.filter(x => x.type === 'redact').map(x => x.ref));
  const mine = ledger.local.find(e => e.type === 'vote' && e.dev === S.me.dev && (e.data || {}).of === key && !gone.has(e.key));
  if (mine) await ledgerAdd({ type: 'redact', ref: mine.key }); else await ledgerAdd({ type: 'vote', ref: r.cell, data: { of: key } });
  tick(mine ? 1300 : 2100); buzz(6);
}
viewEl.addEventListener('click', e => {
  const sr = e.target.closest('[data-search]'); if (sr) { searchFor(sr.dataset.search); return; }
  const vt = e.target.closest('[data-vote]'); if (vt) { vote(vt.dataset.vote); return; }
  const sp = e.target.closest('[data-support]'); if (sp) { const r = S.resp.get(sp.dataset.key); const o = r && S.byId.get(r.cell); if (o) openViewer(o, r.ev, sp.dataset.support); return; }
  const sl = e.target.closest('[data-poster]'); if (sl) { const r = S.resp.get(sl.dataset.poster); const o = r && S.byId.get(r.cell); if (o) openViewer(o, r.ev); return; }
  const mo = e.target.closest('[data-mo]'); if (mo) { pickMonth(+mo.dataset.mo); return; }
  const gp = e.target.closest('[data-part]'); if (gp) { const P = PARTS[gp.dataset.part]; if (P) setView(P[0], false, gp.dataset.part); return; }
  const th = e.target.closest('[data-th]'); if (th) { libTheme = th.dataset.th; const st = viewEl.scrollTop; renderView(); viewEl.scrollTop = st; tick(); return; }
  if (e.target.closest('a[href]')) return;
  const tr = e.target.closest('[data-tribe]'); if (tr) { selectTribe(tr.dataset.tribe); return; }
  const br = e.target.closest('[data-brief]'); if (br) { openBrief(br.dataset.brief, br.dataset.for); return; }
  const b = e.target.closest('[data-id]'); if (b) { const v = b.dataset.id; select(/^\d+$/.test(v) ? +v : v); return; }
  const z = e.target.closest('[data-bi]'); if (z) { selectBiz(+z.dataset.bi); return; }
  const more = e.target.closest('[data-more]'); if (more) { partnersAll = !partnersAll; const st = viewEl.scrollTop; renderView(); viewEl.scrollTop = st; tick(); return; }
  if (e.target.closest('#first')) { const q = $('#ix-q'); if (q) { goPart('archive'); q.placeholder = 'Your business'; q.focus(); } }
});
/* the rail keeps two flags: something hurt, dead or lost right now; a poster that needs support */
function flags() {
  const f = $$('#rail .flag');
  f[0].hidden = !alarmsNow().length;
  f[1].hidden = ![...S.resp.values()].some(needsSupport);
}

/* ───────── NOW — the months ahead as a warning, the five in greatest need, then what is happening around it ───────── */
/* time to get ready, in the unit that reads best */
function readyIn() {
  const until = CONFIG.CHALLENGE && Date.parse(CONFIG.CHALLENGE.until); if (!until) return null; const d = Math.max(0, Math.ceil((until - Date.now()) / 864e5));
  return d >= 45 ? [Math.round(d / 30.4), 'MONTHS'] : d >= 25 ? [1, 'MONTH'] : d >= 14 ? [Math.round(d / 7), 'WEEKS'] : [d, d === 1 ? 'DAY' : 'DAYS'];
}
const HORIZON = { f: 'FORECAST', m: 'MODELLED', p: 'NO OUTLOOK YET' };
/* twelve months as a strip: each a bar in its degree of orange; the three chosen stand forward */
function monthStrip() {
  const ks = [...Array(OUT_N).keys()]; const now = nowK();
  const groups = []; for (const k of ks) { const h = outMonth(k).h; const g = groups[groups.length - 1]; if (g && g.h === h) g.n++; else groups.push({ h, a: k, n: 1 }); }
  const span = k => k >= S.mo && k < S.mo + 3;
  const wins = OUT.windows.map(w => { const a = ks.find(k => inWin(w, outMonth(k).m)); let b = a; while (b + 1 < OUT_N && inWin(w, outMonth(b + 1).m)) b++; return { ...w, ka: a, kb: b }; }).filter(w => w.ka != null);
  return `<div class="mstrip" style="--n:${OUT_N}">`
    + `<div class="ms-h">${groups.map(g => `<span class="mono h${g.h}" style="grid-column:${g.a + 1} / span ${g.n}">${HORIZON[g.h]}</span>`).join('')}</div>`
    + `<div class="ms-m" role="group" aria-label="Months">${ks.map(k => { const M = outMonth(k); return `<button type="button" class="mo d${M.lv} h${M.h}${span(k) ? ' on' : ''}${k === now ? ' now' : ''}" data-mo="${k}" aria-pressed="${k === S.mo}" data-tip="${MON[M.m]} ${M.y} · ${DEG[M.lv]}"><i></i><b class="mono">${MON[M.m].charAt(0)}</b></button>`; }).join('')}</div>`
    + `<div class="ms-w">${wins.map((w, i) => `<span class="mono" style="grid-column:${w.ka + 1} / ${w.kb + 2};grid-row:${i + 1}" data-tip="${esc(w.why)}">${w.w}</span>`).join('')}</div>`
    + `</div>`;
}
function bindOutlook() {
  const st = $('#sec-heat .ms-m'); if (!st) return;
  st.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); pickMonth(S.mo + d); const b = $(`#sec-heat [data-mo="${S.mo}"]`); if (b) b.focus(); });
}
/* the five in greatest need: each moving its own way, with its degree, what is missing where it lives, and the brief that answers it */
const heroesRanked = () => [...S.heroes].map(o => ({ o, deg: degOf(o), w: worstWhen(o) })).sort((a, b) => b.deg - a.deg || (b.o.n - a.o.n));
function heroSection() {
  if (!S.heroes.length) return '';
  return `<section class="sec heroes" id="sec-heroes">${sh('Five in greatest need')}<ol class="hero-list">${heroesRanked().map(({ o, deg, w }) => {
    const h = o.heroOf; const b = BRIEFS.find(x => x.id === h.brief); const line = needLine(o);
    return `<li><button type="button" class="hero-row" data-id="${esc(o.id)}" data-tip="${esc(h.why)}"><canvas class="hero-cv" width="128" height="128" data-hero="${esc(o.id)}" aria-hidden="true"></canvas><span class="nm"><b>${esc(h.cn)}</b>${degChip(deg, w ? w.word : '')}${line ? `<small class="need mono">${esc(line)}</small>` : ''}</span></button>`
      + (b ? `<button type="button" class="hero-brief" data-brief="${b.id}" data-for="${esc(o.id)}" data-tip="After ${esc(b.after)}, ${esc(b.city)}">${icon('next', 'sm')}<span>${esc(b.t)}</span></button>` : '') + `</li>`;
  }).join('')}</ol></section>`;
}
/* the heroes on the page move as they do on the ground */
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
/* the lives most in danger over the chosen months, one of each kind; the five above are not repeated */
function inDanger(limit = 12) {
  const seen = new Map(); const heroN = new Set(S.heroes.map(h => h.tx.n.toLowerCase()));
  for (const o of cellsAll()) {
    if (o.hero || o.story || isCold(o) || o.isEvent || isAlarm(o) || o.kind === 'refuge' || (o.hum && o.kind !== 'pulse' && o.kind !== 'need')) continue;
    const sub = subjectOf(o); if (sub.tx && sub.tx.n && heroN.has(sub.tx.n.toLowerCase())) continue;
    const k = nameOf(o); const deg = degOf(o); const score = deg * 10 + (o.isNew || o.arrived ? 4 : 0) + (o.specimen ? 3 : 0) + (o.tx && o.tx.th ? 2 : 0) + (o.rare || 0);
    const g = seen.get(k); if (!g || score > g.score) seen.set(k, { o, score, deg });
  }
  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
/* the briefs that fit the chosen months: matched to the lives in danger now, one life each, none the five already carry */
function briefsFor(lives, n = 3) {
  const out = []; const used = new Set(S.heroes.map(h => h.heroOf.brief));
  for (const { o } of lives) { for (const m of matchBriefs(o, 2)) { if (used.has(m.b.id)) continue; used.add(m.b.id); out.push({ b: m.b, o }); break; } if (out.length >= n) break; }
  return out;
}
/* a brief and what it is connected to: the life it is for, or the kinds of life it serves, and the businesses that can carry it */
const kindIcons = b => (b.g.includes('any') ? [glyphSVG('paw')] : b.g.slice(0, 4).map(g => glyphSVG(g))).join('');
const briefRow = (b, o) => `<li><button type="button" class="brow" data-brief="${b.id}"${o ? ` data-for="${esc(String(o.id))}"` : ''}><span class="bn mono">${b.id.slice(1)}</span><span class="nm"><b>${esc(b.t)}</b><small>AFTER ${esc(b.after.toUpperCase())}${b.city ? ` · ${esc(b.city.toUpperCase())}` : ''}${b.yr ? ` ${b.yr}` : ''}</small><span class="link mono">${o ? `<span class="for">FOR</span><img class="pg xs" src="${pinOf(o)}" alt=""><span>${esc(nameOf(o).toUpperCase())}</span>` : `<span class="kinds" aria-hidden="true">${kindIcons(b)}</span>`}${b.roles.slice(0, 2).map(roleChip).join('')}</span></span></button>${b.url ? `<a class="src" href="${esc(b.url)}" target="_blank" rel="noopener" aria-label="Source">${icon('out', 'sm')}</a>` : ''}</li>`;
const statusWord = o => { const b = life.badgeOf(o, 20); return b.fresh ? 'NEW' : b.sig ? 'THREATENED' : o.kind === 'need' ? 'NEEDED' : o.kind === 'pulse' ? 'CHECK-INS' : ''; };
/* gigs and gatherings: a gig carries a hug, and the listing it came from */
const eventRow = o => { const gig = isGig(o); const src = gigOf(o); const tags = (o.tags || []).filter(t => TAG_WORDS[t] && !['walk', 'kids', 'sound'].includes(t)).slice(0, 2).map(t => TAG_WORDS[t]);
  return row(o, [dayWord(o.start), ...(gig ? [`<span class="gig">${icon('hug', 'sm')}${src ? src.w : 'GIG'}</span>`] : []), ...tags].join(' · ')); };
function viewNow() {
  const ready = readyIn(); const alarms = alarmsNow(); const k0 = S.mo, k1 = Math.min(OUT_N - 1, S.mo + 2);
  const lives = inDanger(8); const briefs = briefsFor(lives, 3);
  const events = [...S.community, ...S.user].filter(o => o.isEvent && liveEvent(o)).sort((a, b) => (isGig(b) - isGig(a)) || (a.start || 0) - (b.start || 0));
  const span = monthsWord(outMonth(k0).m, outMonth(k1).m); const h = outMonth(k0).h;
  return `<section class="warn" id="sec-heat">
      <div class="w-top"><span class="wt" aria-hidden="true"></span><span class="mono">CLIMATE EMERGENCY · ${esc(CONFIG.ELNINO)}</span></div>
      <p class="w-lede">Likely the strongest El Niño on record, peaking this summer.</p>
      ${ready ? `<div class="w-count"><b>${ready[0]}</b><span class="mono">${ready[1]} TO<br>GET READY</span></div>` : ''}
      ${monthStrip()}
      <p class="w-say"><b class="mono">${span} · ${HORIZON[h]}</b>${esc(OUT.say[h])}</p>
      <a class="w-off mono" href="https://emergency.vic.gov.au" target="_blank" rel="noopener">OFFICIAL WARNINGS ${icon('out', 'sm')}</a>
    </section>`
    + heroSection()
    + `<section class="sec alarms" id="sec-alarms">${sh('Local emergencies right now', 'red')}${alarms.length ? `<ol class="rows">${alarms.map(alarmRow).join('')}</ol>` : '<p class="calm mono">NOTHING HURT OR LOST NEARBY</p>'}<div class="calls2 mono"><a href="tel:000">000</a><a href="tel:0384007300">WILDLIFE VICTORIA (03) 8400 7300</a></div></section>`
    + (lives.length ? `<section class="sec" id="sec-noticing">${sh('Noticing')}<ol class="rows">${lives.map(({ o, deg }) => { const w = deg ? worstWhen(o) : null; const st = statusWord(o); return row(o, [degChip(deg, w ? w.word : ''), st ? `<span>${st}</span>` : ''].filter(Boolean).join('')); }).join('')}</ol></section>` : '')
    + (briefs.length ? `<section class="sec" id="sec-briefs">${sh(`Briefs for ${span}`)}<ol class="briefs">${briefs.map(x => briefRow(x.b, x.o)).join('')}</ol><button type="button" class="more mono" data-part="library">ALL ${BRIEFS.length} BRIEFS</button></section>` : '')
    + `<section class="sec" id="sec-events">${sh('Gigs and gatherings')}${events.length ? `<ol class="rows">${events.map(eventRow).join('')}</ol>` : ''}<p class="gigs mono">${Object.values(GIGS).map(g => `<a href="${esc(g.url)}" target="_blank" rel="noopener">${icon('hug', 'sm')}<span>${esc(g.n.toUpperCase())}</span>${icon('out', 'sm')}</a>`).join('')}</p></section>`
    + emptyIf(!S.obs.length && !S.stories.length);
}

/* ───────── STORIES — the tools first, then the posters people vote up, the groups, the briefs, the businesses, the archive ───────── */
let partnersAll = false, libTheme = 'all';
const THEMES = [['all', 'ALL'], ['heat', 'HEAT'], ['water', 'WATER'], ['pollinate', 'POLLINATORS'], ['diversity', 'DIVERSITY'], ['night', 'NIGHT'], ['food', 'FOOD'], ['circular', 'CIRCULAR'], ['cats', 'CATS']];
const DOCS = [['posters', 'csv', 'The posters, who made them, their briefs, votes and support'], ['businesses', 'csv', 'Every business, its role and the lives in its radius'], ['records', 'csv', 'Every record on the map, its danger and what it needs'], ['briefs', 'csv', 'The fifty briefs and their precedents'], ['field', 'csv', 'The field list as a table'], ['blank', 'pdf', 'A blank poster to fill by hand']];
function viewStories() {
  const rs = [...S.resp.values()].filter(r => S.byId.get(r.cell)).sort((a, b) => (b.votes - a.votes) || (b.score - a.score) || (b.issued - a.issued));
  const top = rs.slice(0, 20);
  const det = [
    'iNaturalist', DEMO ? 'Specimen stories, businesses and people: invented to show how it works' : '', 'Field list: sources in field.html',
    ...OUT.src.map(x => x[0]), 'Canopy: Merri-bek, Yarra and City of Melbourne urban forest strategies; cooling near 40% (Ziter et al., PNAS 2019)', 'City of Melbourne open data', `${IMG.attribution} · AWS Terrain Tiles`, 'MapLibre · Poppins · IBM Plex Mono', CONFIG.COUNTRY,
  ].filter(Boolean);
  const card = (r, i) => { const o = S.byId.get(r.cell); const b = r.brief && BRIEFS.find(x => x.id === r.brief);
    return `<li class="pcard${r.funded ? ' funded' : ''}"><button type="button" class="s-mini" data-key="${esc(r.key)}" data-poster="${esc(r.key)}" aria-label="Open the poster"><span class="blank"></span></button>`
      + `<div class="pc-meta"><button type="button" class="pc-life" data-id="${esc(String(o.id))}"><img class="pg" src="${pinOf(o)}" alt=""><span><b>${esc(nameOf(o))}</b><small>${esc(r.who || '')}${b ? ` · AFTER ${esc(b.after.toUpperCase())}` : ''}</small></span></button>`
      + `<div class="pc-row"><span class="rank mono">${i + 1}</span><span class="pc-st mono${r.funded ? '' : ' need'}">${r.funded ? 'FUNDED' : 'UNFUNDED'}${r.hosts ? ' · ON SHOW' : ''}</span><button type="button" class="vote mono" data-vote="${esc(r.key)}" aria-pressed="${!!r.voted}" aria-label="${r.voted ? 'Take back your vote' : 'Vote it up'}" data-tip="${r.voted ? 'Take back your vote' : 'Vote it up'}">▲ ${r.votes}</button></div>`
      + (r.funded ? '' : `<div class="sup">${r.hosts ? '' : `<button type="button" class="pill" data-support="host" data-key="${esc(r.key)}" data-tip="Put it up in your window or on your wall">${icon('host', 'sm')}HOST IT</button>`}<button type="button" class="pill" data-support="give" data-key="${esc(r.key)}" data-tip="Pay for the print and the work">${icon('give', 'sm')}GIVE</button></div>`)
      + `</div></li>`; };
  const lib = BRIEFS.filter(b => libTheme === 'all' || b.th === libTheme);
  return `<section class="sec tools" id="sec-tools"><div class="tool-pair">`
      + `<a class="tool" href="field.html" target="_blank" rel="noopener"><span class="tool-art" id="art-field" aria-hidden="true"></span><b>Field list</b><small class="mono">${FIELD.length} KINDS OF LIFE · THEIR MONTHS, THE HEAT AND WHO TO CALL</small><i class="go">${icon('out')}</i></a>`
      + `<a class="tool" href="guide.html" target="_blank" rel="noopener"><span class="tool-art" id="art-guide" aria-hidden="true"></span><b>Guide</b><small class="mono">EVERY ICON, COLOUR, READING AND LINE</small><i class="go">${icon('out')}</i></a>`
      + `</div><div class="docs">${DOCS.map(([k, t, tip]) => `<button type="button" data-doc="${k}" data-tip="${esc(tip)}">${icon(t === 'pdf' ? 'print' : 'download')}<span>${k}</span><small>${t}</small></button>`).join('')}</div></section>`
    + `<section class="sec" id="sec-posters">${sh(`Posters · top ${Math.min(20, rs.length)}`)}<ol class="pgrid">${top.map(card).join('')}</ol></section>`
    + `<section class="sec" id="sec-tribes">${sh('Groups already caring')}<ol class="rows tribes">${S.tribes.map(t => `<li><button type="button" class="row" data-tribe="${esc(t.id)}"><i class="patch" style="--c:${(C.tribe[t.kind] || C.tribe.park)}"></i><span class="nm"><b>${esc(t.n)}</b><small>${esc(t.w)}</small></span></button><a class="src" href="${esc(t.link)}" target="_blank" rel="noopener" aria-label="Their site">${icon('out', 'sm')}</a></li>`).join('')}</ol></section>`
    + `<section class="sec" id="sec-library">${sh('Briefs')}<div class="themes">${THEMES.map(([k, w]) => `<button type="button" class="pill${libTheme === k ? ' on' : ''}" data-th="${k}" aria-pressed="${libTheme === k}">${w}</button>`).join('')}</div><ol class="briefs">${lib.map(b => briefRow(b, null)).join('')}</ol></section>`
    + partnersSection()
    + `<section class="sec" id="sec-archive">${sh('Archive')}<label class="find">${icon('search')}<input id="ix-q" type="search" aria-label="Search" placeholder="Search" autocomplete="off"></label><ol class="rows" id="ix-results"></ol>`
    + `<div class="set"><button type="button" class="tog lb" id="ix-sound" aria-pressed="${!!prefs.sound}">${icon('sound')}<small>SOUND</small></button><button type="button" class="tog lb" id="ix-motion" aria-pressed="${!!prefs.motion}">${icon('motion')}<small>MOTION</small></button><label class="sig">${icon('sign')}<input id="ix-sign" type="text" maxlength="40" aria-label="Your name" placeholder="Your name" value="${esc(S.me.by)}"></label></div>`
    + `<ul class="det">${det.map(v => `<li>${esc(v)}</li>`).join('')}</ul></section>`;
}
/* the two tools, drawn: kinds of life in their colours; the icons of the guide */
function fillTools() {
  const art = (id, list) => { const host = $('#' + id); if (!host) return; host.innerHTML = list.map(b => `<img src="${badgeImg(b, 30)}" alt="">`).join(''); };
  art('art-field', ['bird', 'possum', 'bee', 'orb', 'lizard', 'frog', 'moth', 'turtle'].map(g => ({ tone: M.toneOf(g), g })));
  art('art-guide', [{ tone: 'k-mammal', g: 'flyingfox', dz: 3 }, { tone: 'injured', g: 'possum' }, { tone: 'lost', g: 'dog' }, { tone: 'event', i: 'hug' }, { tone: 'story', g: 'bee', carried: true }, { tone: 'need', i: 'shade' }, { tone: 'flora', g: 'plant' }, { tone: 'dead', g: 'bird' }]);
}
/* the businesses and brands of the area: a diamond each, filled when signed up; on notice in highlighter, to back in cobalt */
const roleChip = role => { const R = ROLES[role]; return R ? `<i class="role${R.on ? ' on' : ''}" data-tip="${esc(R.duty)}">${R.w}</i>` : ''; };
function partnersSection() {
  const biz = S.biz || []; if (!biz.length) return '';
  const signed = biz.filter(b => b[5] && b[5].partner).length; const onN = biz.filter(b => onNotice(roleOfRow(b))).length;
  const rows = biz.map((b, i) => ({ i, b, z: bizOf(i), signed: !!(b[5] && b[5].partner), role: roleOfRow(b) })).sort((a, b) => (b.signed - a.signed) || (onNotice(b.role) - onNotice(a.role)) || (b.z ? b.z.cells.length : 0) - (a.z ? a.z.cells.length : 0) || a.b[0].localeCompare(b.b[0]));
  const shown = partnersAll ? rows : rows.slice(0, 6);
  return `<section class="sec partners" id="sec-partners">${sh('Businesses')}<div class="all"><b class="thin">${signed}<small>/${biz.length}</small></b><span class="mono">SIGNED UP</span></div>`
    + `<div class="lattice" aria-hidden="true">${rows.map(r => `<i class="dm ${r.signed ? 'paid' : onNotice(r.role) ? 'on' : ''}"></i>`).join('')}</div>`
    + `<p class="split mono"><span><i class="dm on"></i>${onN} ON NOTICE</span><span><i class="dm"></i>${biz.length - onN} TO BACK</span></p>`
    + `${signed ? '' : '<button type="button" class="first" id="first">BE THE FIRST TO SIGN UP</button>'}`
    + `<ol class="rows">${shown.map(r => `<li><button type="button" class="row" data-bi="${r.i}"><i class="dm big ${r.signed ? 'paid' : onNotice(r.role) ? 'on' : ''}"></i><span class="nm"><b>${esc(r.b[0])}</b><small>${roleChip(r.role)}</small></span></button></li>`).join('')}</ol>`
    + (rows.length > 6 ? `<button type="button" class="more mono" data-more="partners">${partnersAll ? 'FEWER' : 'ALL ' + rows.length}</button>` : '') + `</section>`;
}
/* each poster in the lists as its own small image */
const thumbs = new Map();
function fillThumb(host) {
  if (!host || host.dataset.done) return; const key = host.dataset.key; host.dataset.done = '1';
  const put = node => { if (node && host.isConnected) { host.innerHTML = ''; const c = node.cloneNode(true); host.appendChild(c); fitMini(c); } };
  if (thumbs.has(key)) { put(thumbs.get(key)); return; }
  const r = S.resp.get(key); const o = r && S.byId.get(r.cell); if (!o) return;
  posterThumb(o, r.ev).then(node => { if (node) { thumbs.set(key, node); put(node); } });
}
const fillMinis = () => $$('#view .s-mini, #r-resp .s-mini').forEach(fillThumb);
function bindArchive() {
  const q = $('#ix-q'); if (!q) return; q.addEventListener('input', debounce(() => search(q.value), 120));
  $('#ix-sound').addEventListener('click', e => { prefs.sound = !prefs.sound; e.currentTarget.setAttribute('aria-pressed', String(prefs.sound)); savePrefs(); tick(); });
  $('#ix-motion').addEventListener('click', e => { prefs.motion = !prefs.motion; e.currentTarget.setAttribute('aria-pressed', String(prefs.motion)); savePrefs(); document.documentElement.classList.toggle('still', !prefs.motion); life.data(); tick(); });
  $('#ix-sign').addEventListener('input', e => { S.me.by = e.target.value.trim(); store.set('da.me', S.me); });
  $$('#view [data-doc]').forEach(b => b.addEventListener('click', () => takeAway(b.dataset.doc)));
}
const savePrefs = () => store.set('da.prefs', prefs);
function search(q) {
  const el = $('#ix-results'); if (!el) return; q = norm(q); if (q.length < 2) { el.innerHTML = ''; return; }
  const out = []; const seen = new Set();
  for (const o of [...cellsAll(), ...S.community, ...S.hist]) { const sub = subjectOf(o); const hay = norm([nameOf(o), sub.tx && sub.tx.n, o.who, o.title].filter(Boolean).join(' ')); if (hay.includes(q) && !seen.has(o.id)) { seen.add(o.id); out.push(row(o, typeof o.id === 'number' ? suburbOf(o.pg) : o.story ? esc(o.who || '') : '')); } }
  for (const t of S.tribes) if (norm(`${t.n} ${t.w}`).includes(q)) out.push(`<li><button type="button" class="row" data-tribe="${esc(t.id)}"><i class="patch" style="--c:${(C.tribe[t.kind] || C.tribe.park)}"></i><span class="nm"><b>${esc(t.n)}</b><small>${esc(t.w)}</small></span></button></li>`);
  (S.biz || []).forEach((b, i) => { if (norm(`${b[0]} ${b[1]}`).includes(q)) out.push(`<li><button type="button" class="row" data-bi="${i}"><i class="dm big ${b[5] && b[5].partner ? 'paid' : onNotice(roleOfRow(b)) ? 'on' : ''}"></i><span class="nm"><b>${esc(b[0])}</b><small>${roleChip(roleOfRow(b))}</small></span></button></li>`); });
  for (const b of BRIEFS) if (norm(`${b.t} ${b.after} ${b.city}`).includes(q)) out.push(briefRow(b, null));
  el.innerHTML = out.slice(0, 40).join('') || '<li class="none"></li>';
}
/* data to take away */
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\n');
function download(name, text, type = 'text/csv') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
function takeAway(k) {
  const day = isoDay(new Date());
  if (k === 'posters') download(`direct-action-posters-${day}.csv`, toCSV([['record', 'name', 'by', 'issued', 'brief', 'w', 'i', 's', 'h', 'votes', 'funded', 'givers', 'hosts', 'did', 'specimen'], ...[...S.resp.values()].map(r => [r.cell, nameOf(S.byId.get(r.cell)), r.who, new Date(r.issued).toISOString(), r.brief || '', r.data.w, r.data.i, r.data.s, r.data.h, r.votes, r.funded ? 1 : 0, r.given, r.hostList.join('; '), r.did.size, r.spec ? 1 : 0])]));
  if (k === 'businesses') download(`direct-action-businesses-${day}.csv`, toCSV([['business', 'brand', 'role', 'on_notice', 'lat', 'lng', 'signed_up', 'lives_in_reach', 'specimen'], ...(S.biz || []).map((b, i) => { const z = bizOf(i); const role = roleOfRow(b); return [b[0], b[1], (ROLES[role] || {}).w || role, onNotice(role) ? 1 : 0, b[3], b[4], b[5] && b[5].partner ? 1 : 0, z ? z.cells.length : 0, DEMO && b[5] && b[5].id ? 1 : 0]; })]));
  if (k === 'records') download(`direct-action-records-${day}.csv`, toCSV([['id', 'name', 'latin', 'lat', 'lng', 'kind', 'danger', 'worst_months', 'canopy_pc', 'needs', 'posters', 'link'], ...cellsAll().map(o => { const sub = subjectOf(o); const w = worstWhen(o); return [o.id, nameOf(o), sub.tx ? sub.tx.n : '', o.lat, o.lng, o.hum && !(sub.tx && sub.tx.n) ? 'PEOPLE' : (M.KINDS[lifeOf(o)] || '').toUpperCase(), DEG[degOf(o)], w ? w.word : '', canopyOf(o).pc, o.hum && !(sub.tx && sub.tx.n) ? '' : needLine(o), respsOf(o).length, typeof o.id === 'number' ? CONFIG.INAT_WEB + o.id : o.link || '']; })]));
  if (k === 'briefs') download(`direct-action-briefs-${day}.csv`, toCSV([['id', 'brief', 'after', 'where', 'year', 'fact', 'source', 'theme', 'lives', 'roles', 'months', 'i', 's', 'h'], ...BRIEFS.map(b => [b.id, b.t, b.after, b.city, b.yr || '', b.fact, b.url, b.th, b.g.join(' '), b.roles.join(' '), b.m.map(m => MON[m]).join(' '), b.i, b.s, b.h])]));
  if (k === 'field') download(`direct-action-field-list-${day}.csv`, toCSV([['common_name', 'scientific_name', 'kind', 'status', 'where', 'active_jan_dec', 'young_jan_dec', 'time', 'heat', 'water', 'event', 'notice', 'do_no_harm', 'help', 'call', 'note', 'sources'], ...FIELD.map(e => [e.cn, e.n, e.g, e.st, e.where, e.act, e.brd, e.time, e.heat, e.water, e.event, e.aware, e.harm, e.help, e.call, e.note, (e.src || []).join(' ')])]));
  if (k === 'blank') { const blank = { id: 'blank', user: true, b: 5, lat: (B.s + B.n) / 2, lng: (B.w + B.e) / 2, ev: { key: 'blank', data: {} } }; printDoc('notice', blank, { key: 'blank', at: Date.now(), who: '', data: { w: '', i: '', s: '', h: '' } }); }
}
/* empty: a single point on an empty plane */
const emptyIf = c => (c ? `<div class="empty"><i></i></div>` : '');
function signalLost() { document.body.classList.add('nosignal'); if (!S.mode) renderView(); }


/* ════════════════════════════════════════════════════════════════════
   THE CARD — every life, poster, person and business opens as one card on the white page:
   the picture large, the name, what the months ahead hold for it and what the ground around it holds,
   the briefs that fit, its posters as images, and the places it can go.
   The card turns over to write the four lines from a brief, and turns again to become the poster.
   ════════════════════════════════════════════════════════════════════ */
const rec = $('#record'), rScroll = $('#r-scroll'), heroBtn = $('#r-act');
const nameOf = o => {
  if (!o) return ''; const sub = subjectOf(o); const d = (o.ev && o.ev.data) || {};
  if (o.isEvent || o.comm || (o.user && o.hum && o.title)) return o.title;
  if (sub.tx) return sub.tx.cn || sub.tx.n;
  return d.text || d.note || d.h || o.title || (o.hum ? 'People' : SCALES[bandOf(o)].label.split(' · ')[0]);
};
const codeOf = o => (typeof o.id === 'number' ? toCode(o.id) : o.story ? o.sid : o.comm ? o.hid : o.fid ? o.fid : o.user ? toCode(String(o.ev.key).slice(-6)) : String(o.id).toUpperCase());
const hashOf = o => (typeof o.id === 'number' ? toCode(o.id) : o.story ? o.sid : o.comm ? o.hid : o.fid ? o.fid : o.user ? 'U' + o.ev.key : '');
const isAlarm = o => !!o && (o.kind === 'injured' || o.kind === 'lost' || o.kind === 'dead');
/* the four lines, and what each one asks for */
const WISH = { W: ['What we know', 'The evidence: news, data or theory.'], I: ['It would be great', 'The belief: what should be true.'], S: ["So let's create", 'The principle to work by.'], H: ['Here is how it works', 'The tactic: what someone does.'] };
const wishTip = k => `${k} · ${WISH[k][0]}. ${WISH[k][1]}`;
function openRecord() {
  rec.hidden = false; viewEl.hidden = true; document.body.classList.add('rec'); if (!S.open) setOpen(true);
  rScroll.scrollTop = 0; life.placeHandle(); life.moved();
}
function closeRecord(fromView) {
  S.sel = null; S.bizSel = null; S.mode = null; S.place = null; S.filed = null; S.brief = null; S.tribeSel = null;
  rec.hidden = true; viewEl.hidden = false; document.body.classList.remove('rec', 'placing');
  $('#radius').hidden = true; if (!fromView) renderView(); life.data();
  try { history.replaceState(null, '', S.view ? '#' + VIEWS[S.view].k : location.pathname + location.search); } catch (e) { /* file:// */ }
}
$('#r-x').addEventListener('click', () => closeRecord());
$('#r-back').addEventListener('click', () => { if (face === 'back' || face === 'filed') { showFace('front'); return; } closeRecord(); });
addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('#viewer').hidden) { closeViewer(); return; } if (S.mode) { if (face !== 'front' && S.mode === 'ping') showFace('front'); else closeRecord(); } });

let face = 'front', flipping = null;
/* front to back and back to poster turn the card over; everything else arrives as a line becoming a plane */
function showFace(f) {
  const turn = !reduced() && ((face === 'front' && f === 'back') || (face === 'back' && (f === 'front' || f === 'filed')) || (face === 'filed' && f === 'front')) && !rec.hidden;
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
const heroWord = (ic, w) => { heroBtn.innerHTML = `<span class="hw">${w}</span>${icon(ic)}`; heroBtn.setAttribute('aria-label', w.charAt(0) + w.slice(1).toLowerCase()); };
function paintFace(f, wipe) {
  face = f; for (const [k, id] of [['front', 'r-front'], ['back', 'r-form'], ['filed', 'r-filed'], ['place', 'r-place']]) { const el = $('#' + id); el.hidden = k !== f; if (k === f && wipe) { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); } }
  rec.dataset.face = f; rScroll.scrollTop = 0; document.body.classList.toggle('placing', f === 'place');
  heroBtn.hidden = f === 'filed';
  const o = S.mode === 'ping' ? S.byId.get(S.sel) : null; const calls = f === 'front' && o && (o.kind === 'injured' || o.kind === 'dead') && !!telOf(o);
  const [hi, hw] = f === 'back' ? ['check', 'MAKE THE POSTER'] : f === 'place' ? ['check', 'PLACE IT'] : S.mode === 'biz' ? ['print', 'SIGN-UP SHEET'] : S.mode === 'tribe' ? ['out', 'JOIN THEM'] : calls ? ['phone', o.kind === 'dead' ? 'REPORT IT' : 'CALL NOW'] : ['next', 'IMAGINE THE POSTER'];
  heroWord(hi, hw);
  rec.classList.toggle('alarm', calls); $('#r-alt').hidden = !calls;
  if (f === 'back' && !coarse()) setTimeout(() => { const t = $$('#r-form textarea').find(x => !x.value); if (t) t.focus({ preventScroll: true }); }, 380);
}

/* ───────── opening ───────── */
function select(id, brief) {
  const o = S.byId.get(id); if (!o) return;
  S.sel = id; S.bizSel = null; S.mode = 'ping'; S.filed = null; S.place = null; S.brief = brief || null; S.tribeSel = null;
  if (S.mapReady) map.easeTo({ center: [o.lng, o.lat], zoom: Math.max(map.getZoom(), 15.4), offset: sheetOffset(), duration: reduced() ? 0 : 700 });
  life.stopTour(); life.hover(null); life.select();
  fillFront(o); showFace('front'); openRecord();
  if (!o.ob) loadBusinesses();
  try { history.replaceState(null, '', '#' + hashOf(o)); } catch (e) { /* file:// */ }
}
function selectBiz(i) {
  const z = bizOf(i); if (!z) return;
  S.bizSel = i; S.sel = null; S.mode = 'biz'; S.place = null; S.filed = null; S.brief = null; S.tribeSel = null;
  if (S.mapReady) map.easeTo({ center: [z.lng, z.lat], zoom: Math.max(map.getZoom(), 15), offset: sheetOffset(), duration: reduced() ? 0 : 700 });
  life.stopTour(); life.hover(null); fillBiz(z); showFace('front'); openRecord();
  try { history.replaceState(null, '', `#B${toCode(i)}`); } catch (e) { /* file:// */ }
}
function refreshRecord() {
  if (S.mode === 'ping') { const o = S.byId.get(S.sel); if (!o) return; if (face === 'front') fillFront(o, true); else if (face === 'back') fillPatrons(o, true); }
  else if (S.mode === 'biz') { const z = bizOf(S.bizSel); if (z) fillBiz(z, true); }
  else if (S.mode === 'tribe') { const t = S.byId.get(S.tribeSel); if (t) fillTribe(t, true); }
  life.placeHandle();
}
/* a group already caring for a patch of ground: what it does, the lives in its care, and the briefs to bring it */
function selectTribe(id) {
  const t = S.byId.get(id); if (!t || !t.isTribe) return;
  S.tribeSel = id; S.sel = null; S.bizSel = null; S.mode = 'tribe'; S.place = null; S.filed = null; S.brief = null;
  if (S.mapReady) { const la = t.blobs.map(b => b[0]), lo = t.blobs.map(b => b[1]); map.fitBounds([[Math.min(...lo) - 0.002, Math.min(...la) - 0.002], [Math.max(...lo) + 0.002, Math.max(...la) + 0.002]], { padding: framePad(), duration: reduced() ? 0 : 700, maxZoom: 16 }); }
  life.stopTour(); life.hover(null); life.select(); fillTribe(t); showFace('front'); openRecord();
  try { history.replaceState(null, '', '#' + t.tid); } catch (e) { /* file:// */ }
}
/* a brief chosen anywhere: open the life it fits best, with the brief on top */
function openBrief(id, forId) {
  const b = BRIEFS.find(x => x.id === id); if (!b) return;
  let o = forId != null ? S.byId.get(/^\d+$/.test(forId) ? +forId : forId) : null;
  if (!o) { let best = null; for (const c of cellsAll()) { if (isCold(c) || isAlarm(c) || c.isTribe) continue; const g = lifeOf(c); if (!b.g.includes(g) && !b.g.includes('any')) continue; const sc = degOf(c) * 10 + (c.story ? 3 : 0) + (c.rare || 0); if (!best || sc > best.sc) best = { c, sc }; } o = best && best.c; }
  if (!o) { toast('Nothing on the map fits this brief yet.'); return; }
  select(o.id, id);
}

/* ───────── the picture: the photograph, large; or the thing itself, large, on its own colour ───────── */
const TONE_BG = { fauna: C.cobalt, night: C.navy, danger: C.orange, flora: C.tealDeep, event: C.navy, need: C.white, offer: C.navy, injured: C.red, dead: C.black, lost: C.white, story: C.cobalt, cold: '#9AA39D', hist: '#9AA39D' };
function figure(o) {
  const img = $('#r-img'), cv = $('#r-glyph'), cr = $('#r-credit'), fig = $('#r-fig'); const sub = o && (o.isBiz || o.isTribe) ? null : subjectOf(o);
  img.hidden = true; cv.hidden = true; cr.textContent = ''; fig.classList.toggle('alarm', isAlarm(o)); fig.dataset.kind = o.kind || (o.isBiz ? 'biz' : '');
  const own = o && !o.isBiz && !o.isTribe ? o.photo || (sub && sub.photo) : null;
  if (own) { img.onerror = null; img.hidden = false; img.alt = nameOf(o); img.src = own; cr.textContent = o.who ? `© ${o.who}` : ''; return; }
  if (sub && sub.ph && licOpen(sub.ph.l)) {
    img.hidden = false; img.alt = nameOf(o); img.src = photoURL(sub.ph.u, 'large');
    img.onerror = () => { if (!img.src.includes('/medium.')) img.src = photoURL(sub.ph.u, 'medium'); else { img.hidden = true; drawFigure(o); } };
    cr.textContent = sub.ph.a || licLabel(sub.ph.l); return;
  }
  drawFigure(o);
  if (sub && sub.ph) cr.innerHTML = `<a href="${CONFIG.INAT_WEB}${sub.id}" target="_blank" rel="noopener">© ${esc(sub.u.n || sub.u.l || '')}</a>`;
}
function drawFigure(o) {
  const cv = $('#r-glyph'); cv.hidden = false; const x = cv.getContext('2d'); const w = cv.width, h = cv.height; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
  if (o.isTribe) {   /* the patch itself, as it lies on the ground */
    const col = C.tribe[o.kind] || C.tribe.park; x.fillStyle = '#F1F3F2'; x.fillRect(0, 0, w, h);
    const la = o.blobs.map(b => b[0]), lo = o.blobs.map(b => b[1]); const a0 = Math.min(...la), a1 = Math.max(...la), b0 = Math.min(...lo), b1 = Math.max(...lo);
    const kx = 111320 * Math.cos(a0 * Math.PI / 180), ky = 110540; const W0 = (b1 - b0) * kx + 400, H0 = (a1 - a0) * ky + 400; const k = Math.min(w / W0, h / H0) * 0.9;
    x.save(); x.globalAlpha = 0.85; x.fillStyle = col; x.beginPath();
    for (const [a, b, r] of o.blobs) { const px = w / 2 + ((b - (b0 + b1) / 2) * kx) * k, py = h / 2 - ((a - (a0 + a1) / 2) * ky) * k; life.blob(x, px, py, Math.max(2, r * k), ((a * 7919 + b * 104729) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)); }
    x.fill(); x.restore(); return;
  }
  if (o.isBiz) { const on = onNotice(o.role); x.fillStyle = on ? C.neon : C.cobalt; x.fillRect(0, 0, w, h); M.pin(x, { f: 'partner', s: !on, on, r: h * 0.12 }, w / 2, h / 2); return; }
  const b = life.badgeOf(o, 40); const kc = g => C.kind[M.GROUP[g]] || C.kind.other;
  const bg0 = /^k-/.test(b.tone) ? C.kind[b.tone.slice(2)] : b.tone === 'story' && b.g ? kc(b.g) : TONE_BG[b.tone] || C.cobalt; const bg = bg0 === C.white ? '#F1F3F2' : bg0; const fg = b.tone === 'dead' ? C.red : [C.orange, '#F1F3F2'].includes(bg) ? C.navy : C.white;
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  if (o.kind === 'lost') { x.save(); x.setLineDash([18, 14]); x.lineWidth = 6; x.strokeStyle = C.red; x.beginPath(); x.arc(w / 2, h / 2, h * 0.42, 0, Math.PI * 2); x.stroke(); x.restore(); }
  if (o.kind === 'dead') { x.strokeStyle = C.red; x.lineWidth = 8; x.beginPath(); x.arc(w / 2, h / 2, h * 0.4, 0, Math.PI * 2); x.stroke(); }
  if (b.g) M.glyph(x, b.g, w / 2, h / 2, h * 0.62, fg); else if (b.i) M.icon(x, b.i, w / 2, h / 2, h * 0.5, fg, 1.4);
}

/* ───────── the front ───────── */
const TAG_WORDS = { sound: 'SOUND', nature: 'NATURE', free: 'FREE', 'first-nations': 'FIRST NATIONS-LED', h5: 'BIRD FLU WATCH', refuge: 'COOL ROOM', kids: 'ALL AGES', walk: 'WALK' };
const cap = t => (t ? String(t).charAt(0).toUpperCase() + String(t).slice(1) : '');
const ago = t => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`; };
/* the danger to a life in one sentence */
const dangerOf = o => { const D = window.DA_DANGER || {}; return D[lifeOf(o)] || D.mammal || ''; };
/* a fact, and the step it asks for */
const doRow = (ic, fact, step, opt = {}) => `<li${opt.focus ? ` data-focus="${opt.focus}"` : ''}${opt.cls ? ` class="${opt.cls}"` : ''}><span class="di">${icon(ic)}</span><span class="dt"><b>${fact}</b>${step ? `<span class="ds">${opt.href ? `<a href="${opt.href}"${/^http/.test(opt.href) ? ' target="_blank" rel="noopener"' : ''}>${step}${icon('next', 'sm')}</a>` : opt.act ? `<button type="button" data-do="${opt.act}">${step}${icon('next', 'sm')}</button>` : step}</span>` : ''}</span></li>`;
/* only what is urgent or practical: an animal hurt, dead or lost; a gathering's time and place; what a person asked for */
function urgentOf(o) {
  const fe = fieldOf(o); const L = [];
  if (o.kind === 'injured') { const tel = telOf(o); L.push(doRow('injured', `Hurt ${ago(o.at)}`, tel === 'tel:1800675888' ? 'Call 1800 675 888' : 'Call Wildlife Victoria', { href: tel, cls: 'red' })); if (fe && fe.harm) L.push(doRow('harm', 'Do not handle it', cap(fe.harm))); }
  if (o.kind === 'dead') { const tel = telOf(o); L.push(doRow('harm', 'Dead · do not touch it', tel ? 'Report it: 1800 675 888' : 'Tell the council', { href: tel || (LINKS.find(l => /MERRI-BEK/.test(l[0])) || [])[1], cls: 'black' })); }
  if (o.kind === 'lost') { L.push(doRow('lost', `Lost ${ago(o.at)}`, 'Search the area', { act: 'search', cls: 'red' })); const ln = LINKS.find(l => /LOST/.test(l[0]) && (o.lat > -37.7835 ? /MERRI/.test(l[0]) : /MELBOURNE/.test(l[0]))); if (ln) L.push(doRow('out', 'Found it?', 'Council lost and found', { href: ln[1] })); }
  if (o.isEvent && o.start) L.push(doRow('day', `${dayWord(o.start)} · ${fmtClock(o.start)}`, o.venue ? esc(o.venue) : '', o.link ? { href: o.link } : {}));
  if (o.hum && !o.isEvent && !isAlarm(o) && !o.story) L.push(doRow(o.kind === 'offer' ? 'give' : o.kind === 'refuge' ? 'refuge' : 'people', o.kind === 'offer' ? 'Offered' : o.kind === 'refuge' ? 'A cool room' : o.kind === 'pulse' ? 'Check-ins' : 'Needed', o.link ? 'Open' : '', o.link ? { href: o.link } : {}));
  return L.join('');
}
/* the triage, in four readings: the danger in the months ahead, then the three things this kind of life needs here,
   each marked ok, low, missing, or a threat nearby (DA_NEEDS in config.js) */
function triage(o) {
  const w = worstWhen(o);
  return `<li class="t-deg d${w ? w.deg : 0}" data-focus="heat" data-tip="Danger to this life over the months chosen on NOW: the Bureau's outlook, how hard heat and drought are on its kind, whether the heat lands while it breeds or flowers, and the canopy where it lives."><b>${w ? DEG[w.deg] : 'LOW'}</b><small>${w ? `DANGER · ${w.word}` : 'DANGER'}</small></li>`
    + needsOf(o).map(n => `<li class="nd nd-${n.st}" data-tip="${esc(n.tip)}"><b>${esc(n.v)}</b><small>${n.w}</small><i class="st mono">${NEED_ST[n.st]}</i></li>`).join('');
}
/* the briefs that fit a record: its kind of life, the months chosen, and the places in its radius */
const GROUPS = [['bird', 'parrot', 'waterbird', 'owl', 'raptor'], ['bee', 'butterfly', 'moth', 'fly', 'wasp', 'beetle', 'bug', 'grasshopper', 'mantis', 'dragonfly'], ['frog', 'turtle', 'aquatic', 'snail', 'segmented'], ['mammal', 'possum', 'flyingfox', 'bat', 'rodent', 'macropod'], ['plant', 'fungi'], ['lizard', 'snake'], ['cat', 'dog'], ['fox', 'rabbit']];
const kinOf = g => GROUPS.find(x => x.includes(g)) || [g];
function matchBriefs(o, n = 3) {
  const g = lifeOf(o); const kin = kinOf(g); const months = [0, 1, 2].map(i => outMonth(Math.min(OUT_N - 1, S.mo + i)).m);
  const roles = new Set((S.orbit.cell.get(o.id) || within(o)).map(b => b.role)); const mine = new Set(respsOf(o).map(r => r.brief).filter(Boolean));
  const hero = o.hero ? o.heroOf.brief : null;
  return BRIEFS.map(b => {
    const exact = b.g.includes(g), near = !exact && b.g.some(x => kin.includes(x));
    let sc = exact ? 6 : near ? 2 : b.g.includes('any') ? 2 : 0; if (!sc) return null;
    const mo = b.m.some(m => months.includes(m)); if (mo) sc += 3;
    const rl = b.roles.filter(r => roles.has(r)); if (rl.length) sc += 2; if (mine.has(b.id)) sc += 5; if (hero === b.id) sc += 6;
    return { b, sc, why: { g: exact || near ? g : 'any', mo, rl } };
  }).filter(x => x && x.sc >= 6).sort((a, b) => b.sc - a.sc || a.b.id.localeCompare(b.b.id)).slice(0, n);
}
/* the briefs a business can carry: those it leads first, then those whose lives its role touches */
const briefsForRole = (role, n = 3) => { const R = ROLES[role] || {}; return BRIEFS.filter(b => b.roles.includes(role)).map(b => ({ b, sc: (b.roles[0] === role ? 2 : 0) + (b.g.some(g => (R.g || []).includes(g)) ? 1 : 0) - b.roles.indexOf(role) * 0.1 })).sort((a, b) => b.sc - a.sc).slice(0, n).map(x => ({ b: x.b, why: { role } })); };
/* why a brief is here: the life it serves, the months it starts in, the places near that can carry it */
function whyChips(b, why) {
  if (!why) return '';
  if (why.role) return `<span class="why mono"><span>CARRIED BY</span>${roleChip(why.role)}${b.g.length ? `<span class="kinds">${kindIcons(b)}</span>` : ''}</span>`;
  if (why.tribe) { const common = b.g.filter(g => why.tribe.g.includes(g)); return `<span class="why mono"><span class="ok">IN THEIR CARE</span>${common.length ? `<span class="kinds">${common.slice(0, 4).map(g => glyphSVG(g)).join('')}</span>` : ''}</span>`; }
  const mo = why.mo ? `<span class="ok">${b.m.filter(m => [0, 1, 2].some(i => outMonth(Math.min(OUT_N - 1, S.mo + i)).m === m)).map(m => MON[m]).slice(0, 3).join(' ')}</span>` : `<span>FROM ${MON[b.m[0]]}</span>`;
  return `<span class="why mono">${why.g !== 'any' ? `<span class="ok">${glyphSVG(why.g)}${esc((M.KINDS[why.g] || why.g).toUpperCase())}</span>` : '<span>ANY LIFE</span>'}${mo}${why.rl.slice(0, 2).map(r => `${roleChip(r)}`).join('')}${why.rl.length ? '<span class="ok">NEARBY</span>' : ''}</span>`;
}
/* the nearest business in a radius that fits a brief: the one its {biz} names */
function bizFor(o, b) {
  const rows = (S.orbit.cell.get(o.id) || within(o) || []); const fit = rows.find(r => b.roles.includes(r.role)) || rows.find(r => !onNotice(r.role)) || rows[0];
  if (fit) return fit; const near = o.lat ? bizNear(o.lat, o.lng, 800) : []; return near.find(r => b.roles.includes(r.role)) || near[0] || null;
}
/* two lines on the poster: each line is measured in the poster's own type, at the poster's own width */
const PM = { w: $('#pm-w'), h: $('#pm-h') };
function posterLines(text, k) { const p = k === 'h' ? PM.h : PM.w; p.textContent = text || ' '; const lh = parseFloat(getComputedStyle(p).lineHeight) || 1; return Math.round(p.scrollHeight / lh); }
const fitsPoster = (text, k) => text.length <= 96 && posterLines(text, k) <= 2;
/* a brief's lines, filled for this place; a long name gives way to a short one */
function fillLine(t, o, b, k) {
  const z = t.includes('{biz}') ? bizFor(o, b) : null; const place = title(placeOf(o));
  const names = z ? [z.n, z.b || z.n.split(' ').slice(0, 2).join(' '), 'the shop'] : ['the shop'];
  for (const n of names) { const s = t.replace(/\{biz\}/g, n).replace(/\{place\}/g, place); if (fitsPoster(s, k)) return s; }
  return t.replace(/\{biz\}/g, 'the shop').replace(/\{place\}/g, place);
}
const briefCard = (b, on, why) => `<li class="${on ? 'on' : ''}"><button type="button" class="bcard" data-pick="${b.id}" aria-pressed="${!!on}"><b>${esc(b.t)}</b><small class="mono">AFTER ${esc(b.after.toUpperCase())} · ${esc((b.city || '').toUpperCase())}${b.yr ? ` ${b.yr}` : ''}</small><span class="bf">${esc(cap(b.fact))}</span>${whyChips(b, why)}</button>${b.url ? `<a class="src" href="${esc(b.url)}" target="_blank" rel="noopener" aria-label="Source">${icon('out', 'sm')}</a>` : ''}</li>`;
function fillFront(o, quiet) {
  const sub = subjectOf(o); const rs = respsOf(o);
  $('#r-no').textContent = o.hero ? `IN GREATEST NEED · ${HEROES.findIndex(h => h.id === o.hero) + 1} OF ${HEROES.length}` : `No. ${codeOf(o)}`; $('#r-spec').hidden = !o.spec;
  $('#r-name').textContent = nameOf(o);
  $('#r-latin').innerHTML = o.isEvent || o.comm && !o.tx ? '' : sub.tx && sub.tx.cn && sub.tx.n ? `<i>${esc(sub.tx.n)}</i>` : '';
  if (!quiet) figure(o);
  /* when and where: only on the card */
  const when = o.hero ? (o.curated ? 'HOME · KNOWN SITES' : `HOME · ${o.n} PAST SIGHTINGS`) : o.isEvent ? '' : o.story ? `${esc(o.who || '')}` : o.hist ? `${dayMonth(o.d)} ${String(o.d).slice(0, 4)}` : `${o.t ? fmtClock(o.t) + ' · ' : o.at && (o.comm || o.user) ? fmtClock(o.at) + ' · ' : ''}${o.d ? dayMonth(o.d) : ''}`;
  const where = placeOf(o);
  const voice = (sub.so && sub.so.u) || o.sound;
  $('#r-when').innerHTML = `<span>${[when, where].filter(Boolean).join(' · ')}</span>${o.n > 1 && !o.hero ? `<span>×${o.n}</span>` : ''}${o.spec ? '' : typeof o.id === 'number' ? `<a href="${CONFIG.INAT_WEB}${o.id}" target="_blank" rel="noopener">iNat ${icon('out', 'sm')}</a>` : ''}${voice ? `<button type="button" class="play" data-u="${esc(voice)}" aria-label="Play the call">${icon('play')}</button>` : ''}`;
  if (o.user && o.said && nameOf(o) !== o.said) $('#r-when').insertAdjacentHTML('afterbegin', `<q class="said">${esc(o.said)}</q>`);
  if (o.contact) $('#r-when').insertAdjacentHTML('beforeend', `<a class="ct" href="${/@/.test(o.contact) ? 'mailto:' : 'tel:'}${esc(o.contact.replace(/\s/g, ''))}">${icon(/@/.test(o.contact) ? 'out' : 'phone', 'sm')}${esc(o.contact)}</a>`);
  /* the ground and the months ahead, in five readings; then the danger in a sentence; then anything urgent */
  const live = !o.hist && !(o.hum && !o.story && o.kind !== 'pulse' && o.kind !== 'need');
  $('#r-tri').innerHTML = live ? triage(o) : ''; $('#r-tri').hidden = !live; $('#r-tri').classList.toggle('four', live);
  const w = live && !isCold(o) ? windowOf(o) : null; const dg = live ? degOf(o) : 0; const dz = live && !isAlarm(o) && !o.isEvent ? (o.hero ? o.heroOf.why : dangerOf(o)) : '';
  $('#r-danger').innerHTML = dz ? `<b class="mono">${w ? w.w : 'THE DANGER'}</b><span>${esc(dz)}</span>` : ''; $('#r-danger').hidden = !dz; $('#r-danger').className = `r-danger d${dg}`;
  $('#r-do').innerHTML = urgentOf(o);
  /* the briefs: the one chosen first */
  const ms = isAlarm(o) || o.isEvent || o.hist ? [] : matchBriefs(o, 3);
  if (S.brief && !ms.some(m => m.b.id === S.brief)) { const b = BRIEFS.find(x => x.id === S.brief); if (b) ms.unshift({ b }); }
  if (!ms.some(m => m.b.id === S.brief)) S.brief = ms.length ? ms[0].b.id : null;
  $('#r-brief').innerHTML = ms.length ? `<h3 class="sh">Briefs</h3><ol class="briefs cards">${ms.slice(0, 3).map(m => briefCard(m.b, m.b.id === S.brief, m.why)).join('')}</ol>` : '';
  fillPosters(o, rs);
  fillOrbit(o);
  heroBtn.hidden = false;
}
$('#r-when').addEventListener('click', e => { const b = e.target.closest('.play'); if (b) life.play(b.dataset.u, b); });
$('#r-brief').addEventListener('click', e => {
  if (e.target.closest('a[href]')) return; const b = e.target.closest('[data-pick]'); if (!b) return; const id = b.dataset.pick; tick();
  if (S.mode === 'biz') { const z = bizOf(S.bizSel); const L = z && linkedLife(z); const o = L ? L.o : null; if (o) { select(o.id, id); return; } toast('No life near enough for this brief.'); return; }
  if (S.brief === id) { heroBtn.click(); return; }
  if (S.mode === 'tribe') { const t = S.byId.get(S.tribeSel); const lives = t ? livesIn(t) : []; const b = BRIEFS.find(x => x.id === id); const o = b && lives.filter(x => b.g.includes(lifeOf(x))).sort((a, c) => degOf(c) - degOf(a))[0]; if (o) { select(o.id, id); return; } openBrief(id); return; }
  S.brief = id; $$('#r-brief li').forEach(li => { const on = li.querySelector('[data-pick]').dataset.pick === id; li.classList.toggle('on', on); li.querySelector('[data-pick]').setAttribute('aria-pressed', String(on)); }); fillOrbit(S.byId.get(S.sel)); life.moved();
});
$('#r-do').addEventListener('click', e => {
  const b = e.target.closest('[data-do]'); if (!b) return; const a = b.dataset.do; tick();
  if (S.mode === 'biz') { if (a === 'sign') printBiz(S.bizSel); if (a === 'life') { const z = bizOf(S.bizSel); const L = z && linkedLife(z); if (L) select(L.o.id); } return; }
  const o = S.byId.get(S.sel); if (!o) return;
  if (a === 'search') searchFor(o.id);
});
/* the posters on a record, as the posters themselves */
function fillPosters(o, rs) {
  const el = $('#r-resp'); if (!rs.length) { el.innerHTML = ''; return; }
  const sorted = [...rs.filter(r => r.done || r.funded), ...rs.filter(r => !(r.done || r.funded))];
  el.innerHTML = `<h3 class="sh">Posters</h3><ol class="pstrip">${sorted.map(r => `<li><button type="button" class="s-mini" data-key="${esc(r.key)}" data-poster="${esc(r.key)}" aria-label="Open the poster"><span class="blank"></span></button><small class="mono${r.funded ? '' : ' need'}">${r.funded ? 'FUNDED' : 'UNFUNDED'}${r.hosts ? ' · ON SHOW' : ''}</small></li>`).join('')}</ol>`;
  fillMinis();
}
$('#r-resp').addEventListener('click', e => { const t = e.target.closest('[data-poster]'); if (!t) return; const r = S.resp.get(t.dataset.poster); const o = r && S.byId.get(r.cell); if (r && o) openViewer(o, r.ev); });
/* where it goes: the places in its radius, by role; those that fit the chosen brief first */
function fillOrbit(o) {
  const el = $('#r-orbit'); if (o.ob || o.kind === 'refuge' || o.hist) { el.innerHTML = ''; return; }
  if (!S.biz) { el.innerHTML = '<div class="empty sm"><i></i></div>'; return; }
  const b = BRIEFS.find(x => x.id === S.brief); const fit = r => (b && b.roles.includes(r.role) ? 0 : 1);
  const rows = [...(S.orbit.cell.get(o.id) || [])].sort((x, y) => fit(x) - fit(y) || x.d - y.d); const hosts = new Set(respsOf(o).flatMap(r => r.hostList.map(norm)));
  if (!rows.length) { el.innerHTML = ''; return; }
  const all = el.classList.contains('all'); const on = rows.filter(r => onNotice(r.role)).length;
  const nFit = b ? rows.filter(r => b.roles.includes(r.role)).length : 0;
  el.innerHTML = `<h3 class="sh">Where it goes</h3><p class="split mono">${b ? `<span class="fitn">${nFit} FIT THE BRIEF</span>` : ''}<span><i class="dm on"></i>${on} ON NOTICE</span><span><i class="dm"></i>${rows.length - on} TO BACK</span></p><ol class="orbit">${rows.slice(0, all ? 80 : 6).map(r => { const host = hosts.has(norm(r.n)), fits = !!(b && b.roles.includes(r.role)); return `<li class="${host ? 'host' : ''}${fits ? ' fit' : ''}"><button type="button" data-bi="${r.i}"><i class="dm ${host ? 'paid' : onNotice(r.role) ? 'on' : ''}"></i><span class="n">${esc(r.n)}</span>${roleChip(r.role)}${host ? '<small class="mono">ON SHOW</small>' : fits ? '<small class="mono fitw">FITS</small>' : ''}</button></li>`; }).join('')}</ol>${rows.length > 6 ? `<button type="button" class="more mono">${all ? 'FEWER' : 'ALL ' + rows.length}</button>` : ''}`;
}
$('#r-orbit').addEventListener('click', e => { const b = e.target.closest('[data-bi]'); if (b) { selectBiz(+b.dataset.bi); return; } if (e.target.closest('.more')) { $('#r-orbit').classList.toggle('all'); const o = S.byId.get(S.sel); if (o) fillOrbit(o); } });

/* the web follows the pointer: the places, the danger, a poster's hosts, one business */
const focusFrom = t => {
  const b = t.closest('[data-bi]'); if (b && b.closest('#r-orbit, #pat-list')) { life.focus('biz', +b.dataset.bi); return; }
  const p = t.closest('[data-poster]'); if (p && p.closest('#r-resp')) { life.focus('poster', p.dataset.poster); return; }
  const f = t.closest('[data-focus]'); life.focus(f ? f.dataset.focus : null);
};
rScroll.addEventListener('pointerover', e => { if (e.pointerType === 'mouse' && S.mode === 'ping') focusFrom(e.target); });
rScroll.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') life.focus(null); });
rScroll.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && S.mode === 'ping') focusFrom(e.target); }, { passive: true });

/* ───────── a business: its role, the radius it answers for, the life it touches most, and the briefs it can carry ───────── */
function fillBiz(z, quiet) {
  const R = ROLES[z.role] || ROLES.owner; const on = !!R.on;
  $('#r-no').textContent = `No. B${toCode(z.i)}`; $('#r-spec').hidden = !DEMO; $('#r-name').textContent = z.n; $('#r-latin').innerHTML = roleChip(z.role);
  if (!quiet) figure({ isBiz: true, partner: z.partner, role: z.role });
  $('#r-when').innerHTML = `<span>${suburbAt(z.lat, z.lng)}${z.brand ? ` · ${esc(z.brand.toUpperCase())}` : ''}</span>`;
  const lives = cellsAll().filter(o => !o.hum && !isCold(o) && haversine(z.lat, z.lng, o.lat, o.lng) <= BIZ_R); const atRisk = lives.filter(o => degOf(o) >= 3).length;
  $('#r-tri').hidden = false; $('#r-tri').classList.add('four');
  $('#r-tri').innerHTML = `<li class="t-role${on ? ' on' : ''}" data-tip="${esc(R.duty)}"><b>${R.w}</b><small>${on ? 'ON NOTICE' : 'TO BACK'}</small></li><li data-tip="The radius a business answers for."><b>${BIZ_R} M</b><small>RADIUS</small></li><li data-tip="Lives recorded inside its radius."><b>${lives.length}</b><small>LIVES</small></li><li class="t-deg d${atRisk ? 3 : 0}" data-tip="Lives inside its radius in severe danger over the months chosen on NOW."><b>${atRisk}</b><small>AT RISK</small></li>`;
  $('#r-danger').hidden = false; $('#r-danger').className = `r-danger duty${on ? ' on' : ''}`;
  $('#r-danger').innerHTML = `<b class="mono">${on ? 'ON NOTICE' : 'WORTH BACKING'}</b><span>${esc(R.duty)}.${R.line ? ` ${esc(R.line)}` : ''}</span>${R.src ? `<a class="src" href="${esc(R.src)}" target="_blank" rel="noopener" aria-label="Source">${icon('out', 'sm')}</a>` : ''}`;
  const L = linkedLife(z);
  $('#r-do').innerHTML = (L ? doRow('fauna', `${esc(nameOf(L.o))} · ${L.d < 1000 ? Math.round(L.d / 10) * 10 + ' m' : (L.d / 1000).toFixed(1) + ' km'}`, 'The life it touches most', { act: 'life' }) : '')
    + doRow('partner', z.partner ? 'Signed up' : 'Not signed up yet', z.partner ? '' : 'Print the sign-up sheet', z.partner ? {} : { act: 'sign' });
  const ms = briefsForRole(z.role, 3);
  $('#r-brief').innerHTML = ms.length ? `<h3 class="sh">Briefs it can carry</h3><ol class="briefs cards">${ms.map(m => briefCard(m.b, false, m.why)).join('')}</ol>` : '';
  $('#r-resp').innerHTML = '';
  $('#r-orbit').innerHTML = lives.length ? `<h3 class="sh">Lives in its radius</h3><ol class="orbit lives">${lives.sort((a, b) => degOf(b) - degOf(a)).slice(0, 12).map(o => `<li><button type="button" data-cell="${esc(String(o.id))}"><img class="pg sm" src="${pinOf(o)}" alt=""><span class="n">${esc(nameOf(o))}</span>${degChip(degOf(o))}</button></li>`).join('')}</ol>` : '';
}
for (const id of ['#r-resp', '#r-orbit']) $(id).addEventListener('click', e => { const c = e.target.closest('[data-cell]'); if (c) { const v = c.dataset.cell; select(/^\d+$/.test(v) ? +v : v); } });

/* ───────── a group already caring for a patch of ground: what it does, the lives in its care, the briefs to bring it ───────── */
function fillTribe(t, quiet) {
  const col = C.tribe[t.kind] || C.tribe.park;
  $('#r-no').textContent = `No. ${t.tid}`; $('#r-spec').hidden = true; $('#r-name').textContent = t.n; $('#r-latin').innerHTML = `<i class="role tribe" style="--c:${col}">${esc(t.w)}</i>`;
  if (!quiet) figure(t);
  $('#r-when').innerHTML = `<span>${esc(t.when || 'Their next days out are on their site')}</span>`;
  const lives = livesIn(t).sort((a, b) => degOf(b) - degOf(a)); const atRisk = lives.filter(o => degOf(o) >= 3).length;
  const posters = [...S.resp.values()].filter(r => { const o = S.byId.get(r.cell); return o && inTribe(t, o.lat, o.lng); });
  $('#r-tri').hidden = false; $('#r-tri').classList.add('four');
  $('#r-tri').innerHTML = `<li data-tip="Lives recorded inside the ground they care for."><b>${lives.length}</b><small>LIVES</small></li><li class="t-deg d${atRisk ? 3 : 0}" data-tip="Lives there in severe danger over the months chosen on NOW."><b>${atRisk}</b><small>AT RISK</small></li><li data-tip="Posters made for lives on their ground."><b>${posters.length}</b><small>POSTERS</small></li><li data-tip="Briefs that fit what they care for."><b>${t.briefs.length}</b><small>BRIEFS</small></li>`;
  $('#r-danger').hidden = false; $('#r-danger').className = 'r-danger tribe'; $('#r-danger').style.setProperty('--c', col);
  $('#r-danger').innerHTML = `<b class="mono">WHAT THEY DO</b><span>${esc(t.what)}</span>`;
  $('#r-do').innerHTML = doRow('out', 'Join them', 'Their site', { href: t.link });
  const ms = t.briefs.map(id => BRIEFS.find(b => b.id === id)).filter(Boolean);
  $('#r-brief').innerHTML = ms.length ? `<h3 class="sh">Briefs to bring them</h3><ol class="briefs cards">${ms.map(b => briefCard(b, false, { tribe: t })).join('')}</ol>` : '';
  $('#r-resp').innerHTML = posters.length ? `<h3 class="sh">Posters on their ground</h3><ol class="pstrip">${posters.map(r => `<li><button type="button" class="s-mini" data-key="${esc(r.key)}" data-poster="${esc(r.key)}" aria-label="Open the poster"><span class="blank"></span></button><small class="mono${r.funded ? '' : ' need'}">${r.funded ? 'FUNDED' : 'UNFUNDED'}</small></li>`).join('')}</ol>` : '';
  fillMinis();
  $('#r-orbit').innerHTML = lives.length ? `<h3 class="sh">Lives in their care</h3><ol class="orbit lives">${lives.slice(0, 12).map(o => `<li><button type="button" data-cell="${esc(String(o.id))}"><img class="pg sm" src="${pinOf(o)}" alt=""><span class="n">${esc(nameOf(o))}</span>${degChip(degOf(o))}</button></li>`).join('')}</ol>` : '';
}

/* ───────── the back: a brief becomes four lines, each in its box; the places that could host it or give ───────── */
const draftKey = o => 'da.draft.' + o.id;
let remixOf = null;
function remix(o, r) { remixOf = r.key; S.brief = r.brief || S.brief; fillBack(o, r.data); showFace('back'); tick(); }
/* the first line is what is known about this life; the other three come from the brief, filled for this place */
function fromBrief(o, b) { return { w: dangerOf(o), i: b ? fillLine(b.i, o, b, 'i') : '', s: b ? fillLine(b.s, o, b, 's') : '', h: b ? fillLine(b.h, o, b, 'h') : '' }; }
function fillBack(o, from) {
  /* a record that opened on its call (hurt, dead) has no brief chosen yet: the best fit comes first. A lost animal's poster is its own. */
  if (!S.brief && o.kind !== 'lost') { const m = matchBriefs(o, 1)[0]; if (m) S.brief = m.b.id; }
  const b = BRIEFS.find(x => x.id === S.brief);
  $('#r-no').innerHTML = `No. ${codeOf(o)}${remixOf ? ` · ${icon('remix', 'sm')} REMIX` : ''}`;
  if (!from) remixOf = null;
  const draft = from || store.get(draftKey(o), null) || fromBrief(o, b);
  for (const k of ['w', 'i', 's', 'h']) { const t = $('#w-' + k); t.value = (draft[k] || '').slice(0, +t.maxLength || 96); fitBox(t); }
  briefHead(o);
  $('#w-sign').value = S.me.by || '';
  fillPatrons(o);
}
/* which brief the lines came from, and the others that fit */
function briefHead(o) {
  const ms = o.kind === 'lost' ? [] : matchBriefs(o, 6).map(m => m.b); const b = BRIEFS.find(x => x.id === S.brief); if (b && !ms.includes(b)) ms.unshift(b);
  const i = Math.max(0, ms.findIndex(x => x.id === S.brief));
  $('#w-brief').innerHTML = ms.length ? `<button type="button" class="ib" data-bstep="-1" aria-label="Previous brief"${ms.length < 2 ? ' disabled' : ''}>${icon('back')}</button><span class="wb-t"><small class="mono">BRIEF ${i + 1}/${ms.length}</small><b>${esc(ms[i].t)}</b><small class="mono">AFTER ${esc(ms[i].after.toUpperCase())}</small></span><button type="button" class="ib" data-bstep="1" aria-label="Next brief"${ms.length < 2 ? ' disabled' : ''}>${icon('next')}</button>` : '';
  $('#w-brief').dataset.list = ms.map(x => x.id).join(',');
}
$('#w-brief').addEventListener('click', e => {
  const st = e.target.closest('[data-bstep]'); if (!st) return; const o = S.byId.get(S.sel); if (!o) return;
  const list = ($('#w-brief').dataset.list || '').split(',').filter(Boolean); if (list.length < 2) return;
  const i = (list.indexOf(S.brief) + +st.dataset.bstep + list.length) % list.length; S.brief = list[i]; const b = BRIEFS.find(x => x.id === S.brief);
  const f = fromBrief(o, b); for (const k of ['i', 's', 'h']) { const t = $('#w-' + k); t.value = f[k]; fitBox(t); } briefHead(o); fillPatrons(o); tick();
});
/* each place near the record can host the poster, give, or both; the ones the brief needs come first */
const placeRow = (b, c = {}) => `<li data-n="${esc(b.n)}"${b.i != null ? ` data-bi="${b.i}"` : ''} class="${c.on ? 'on' : ''}${c.host ? ' host' : ''}"><span class="n">${esc(b.n)}${roleChip(b.role)}</span><button type="button" class="hs" aria-pressed="${!!c.host}" data-tip="Put the poster up there">${icon('host', 'sm')}HOST</button><button type="button" class="tg" aria-pressed="${!!c.on}" data-tip="Ask it to give">${icon('give', 'sm')}GIVE</button></li>`;
function fillPatrons(o, keep) {
  const b = BRIEFS.find(x => x.id === S.brief); const fit = r => (b && b.roles.includes(r.role) ? 0 : onNotice(r.role) ? 1 : 2);
  const zone = [...(S.orbit.cell.get(o.id) || (o.lat ? within(o) : []))].sort((x, y) => fit(x) - fit(y) || x.d - y.d).slice(0, 6);
  const near = o.lat ? bizNear(o.lat, o.lng, 1500).filter(x => !zone.some(z => z.i === x.i)).sort((x, y) => fit(x) - fit(y) || x.d - y.d).slice(0, Math.max(0, 6 - zone.length)) : [];
  const rows = [...zone, ...near];
  const chosen = keep ? new Map($$('#pat-list li[data-n]').map(li => [li.dataset.n, { on: li.classList.contains('on'), host: li.classList.contains('host') }])) : new Map();
  $('#pat-list').innerHTML = rows.map(r => placeRow(r, chosen.get(r.n))).join('');
}
$('#pat-list').addEventListener('click', e => {
  const btn = e.target.closest('.hs, .tg'); if (!btn) return; const li = btn.closest('li'); const cls = btn.classList.contains('hs') ? 'host' : 'on';
  const on = !li.classList.contains(cls); li.classList.toggle(cls, on); btn.setAttribute('aria-pressed', String(on)); tick();
});
$('#r-form').addEventListener('submit', e => e.preventDefault());
/* who the poster asks: places to host it, places to give; no amounts until someone gives */
function readPlaces() {
  return { patrons: $$('#pat-list li.on').map(li => ({ n: li.dataset.n, bi: li.dataset.bi != null ? +li.dataset.bi : null, st: 'asked' })), hosts: $$('#pat-list li.host').map(li => li.dataset.n) };
}
/* two lines at most on the poster: no new lines, and the words stop where the poster's second line ends.
   The box grows to show every word; on a narrow screen that can take a third line on the card, never on the poster. */
function fitBox(t) {
  const k = t.id.slice(2); let guard = 200;
  while (t.value.length && !fitsPoster(t.value, k) && guard--) t.value = t.value.slice(0, -1);
  t.style.height = ''; if (t.scrollHeight > t.clientHeight + 1) t.style.height = `${t.scrollHeight}px`;
  t.closest('.w').dataset.left = String(fitsPoster(`${t.value} mm`, k) ? t.maxLength - t.value.length : 0);
}
$$('#r-form textarea').forEach(t => {
  t.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
  t.addEventListener('input', () => { if (t.value.includes('\n')) t.value = t.value.replace(/\s*\n\s*/g, ' '); fitBox(t); });
  t.addEventListener('input', debounce(() => { const o = S.byId.get(S.sel); if (o && S.mode === 'ping') store.set(draftKey(o), { w: $('#w-w').value, i: $('#w-i').value, s: $('#w-s').value, h: $('#w-h').value }); }, 300));
});
$('#w-sign').addEventListener('input', e => { S.me.by = e.target.value.trim(); store.set('da.me', S.me); });
function nextLetterFor(o) { const used = new Set(respsOf(o).map(r => r.letter)); for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!used.has(c)) return c; return 'Z'; }

/* ───────── the hero: imagine the poster, make it, place a record, call ───────── */
heroBtn.addEventListener('click', async () => {
  if (S.mode === 'biz') { printBiz(S.bizSel); return; }
  if (S.mode === 'tribe') { const t = S.byId.get(S.tribeSel); if (t) window.open(t.link, '_blank', 'noopener'); return; }
  if (face === 'place') { placeIt(); return; }
  const o = S.byId.get(S.sel); if (!o) return;
  if (face === 'front' && (o.kind === 'injured' || o.kind === 'dead')) { const tel = telOf(o); if (tel) { location.href = tel; return; } }
  if (face === 'front') {
    if (!S.stats.get(o.id) || !statOf(o).joins.has(S.me.dev)) ledgerAdd({ type: 'join', ref: o.id, lat: o.lat, lng: o.lng, b: bandOf(o) });
    fillBack(o); showFace('back'); buzz(6); return;
  }
  if (face === 'back') {
    const v = k => $('#w-' + k).value.trim(); const W = { w: v('w'), i: v('i'), s: v('s'), h: v('h') };
    const missing = ['w', 'i', 's', 'h'].find(k => !W[k]); if (missing) { nudge($('#w-' + missing)); return; }
    const sign = $('#w-sign').value.trim(); if (!sign) { nudge($('#w-sign')); return; }
    const subject = subjectOf(o);
    const ev = await ledgerAdd({ type: 'notice', ref: o.id, lat: +o.lat.toFixed(4), lng: +o.lng.toFixed(4), b: bandOf(o), who: sign, data: { ...W, letter: nextLetterFor(o), issued: Date.now(), valid: Date.now() + CONFIG.VALID_DAYS * 864e5, brief: S.brief || null, snap: typeof subject.id === 'number' ? snapshot(subject) : null, after: remixOf || undefined, ...readPlaces() } });
    remixOf = null;
    store.set(draftKey(o), null); showFiled(o, ev); life.select(); buzz([14, 50, 24]);
  }
});
/* an animal hurt or dead: the call comes first; a poster can still answer it */
$('#r-alt').addEventListener('click', () => { const o = S.byId.get(S.sel); if (!o) return; if (!S.stats.get(o.id) || !statOf(o).joins.has(S.me.dev)) ledgerAdd({ type: 'join', ref: o.id, lat: o.lat, lng: o.lng, b: bandOf(o) }); fillBack(o); showFace('back'); tick(); });
function snapshot(o) { return { id: o.id, d: o.d, t: o.t, lat: +o.lat.toFixed(4), lng: +o.lng.toFixed(4), ob: o.ob, cap: o.cap, q: o.q, pg: suburbOf(o.pg), tx: o.tx, u: o.u, ph: o.ph }; }

/* ───────── made: the poster ───────── */
function showFiled(o, ev) {
  S.filed = { o, ev }; showFace('filed');
  const host = $('#r-sheet'); host.innerHTML = '<div class="blank"></div>';
  posterThumb(o, ev).then(node => { if (node && S.filed && S.filed.ev === ev) { host.innerHTML = ''; host.appendChild(node); fitMini(node); } });
}
$('#r-sheet').addEventListener('click', () => { if (S.filed) openViewer(S.filed.o, S.filed.ev); });
$('#f-print').addEventListener('click', () => printDoc('notice'));
$('#f-share').addEventListener('click', () => { if (S.filed) share(S.filed.o, S.filed.ev); });

/* ───────── a new record by hand: a touch on empty ground, a long press, or a right-click ─────────
   Say what it is in a few words and add a photo if there is one. The words choose the kind, the species and how many. */
const PLACE_KINDS = [
  { f: 'fauna', type: 'noticed', b: 1, word: 'SEEN', go: 'PLACE IT' }, { f: 'flora', type: 'noticed', b: 5, word: 'PLANT', go: 'PLACE IT' }, { f: 'injured', type: 'injured', b: 0, word: 'HURT', go: 'ALERT' },
  { f: 'dead', type: 'dead', b: 0, word: 'DEAD', go: 'ALERT' }, { f: 'lost', type: 'lost', b: 0, word: 'LOST', go: 'ALERT' }, { f: 'need', type: 'need', b: 0, word: 'NEED', go: 'ASK' },
  { f: 'offer', type: 'offer', b: 0, word: 'OFFER', go: 'OFFER IT' }, { f: 'event', type: 'event', b: 0, word: 'GATHER', go: 'INVITE' },
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
const LIFE_CHIPS = [['bird', 'BIRD'], ['possum', 'POSSUM'], ['bat', 'BAT'], ['bee', 'BEE'], ['butterfly', 'BUTTERFLY'], ['beetle', 'BEETLE'], ['spider', 'SPIDER'], ['lizard', 'LIZARD'], ['snake', 'SNAKE'], ['frog', 'FROG'], ['turtle', 'TURTLE'], ['plant', 'PLANT'], ['paw', 'OTHER']];
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
  S.mode = 'place'; S.sel = null; S.bizSel = null; S.filed = null; S.tribeSel = null; S.place = { id: 'place', lat: lngLat.lat, lng: lngLat.lng, b: 1, kind: 0, auto: true, photo: null, tx: null, g: null };
  placeImg = null; $('#r-spec').hidden = true; $('#r-name').textContent = ''; $('#r-latin').innerHTML = '';
  $('#pl-text').value = ''; $('#pl-shot').classList.remove('has'); $('#pl-when').value = ''; $('#pl-contact').value = '';
  fillPlace(); showFace('place'); openRecord(); life.select(); loadBusinesses(); tick(1300);
  if (S.mapReady) map.easeTo({ center: [lngLat.lng, lngLat.lat], zoom: Math.max(map.getZoom(), 15.2), offset: sheetOffset(), duration: reduced() ? 0 : 700 });
  if (!coarse()) setTimeout(() => $('#pl-text').focus({ preventScroll: true }), 320);
}
function movePlace(ll) { const p = S.place; if (!p) return; p.lat = ll.lat; p.lng = ll.lng; fillPlace(); life.select(); tick(1500); }
/* the card as it will be: the photograph or the thing itself in a circle, the name, the kind */
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
  const p = S.place; const k = PLACE_KINDS[p.kind]; const now = new Date(); const night = nightNow(); const text = $('#pl-text').value.trim();
  p.tx = text ? speciesFrom(text.toLowerCase()) : null;
  const fe = p.tx ? FIELD_IX.get(p.tx.n.toLowerCase()) || (GROUP_REP[p.tx.n.toLowerCase()] ? FIELD_IX.get(GROUP_REP[p.tx.n.toLowerCase()]) : null) : null;
  $('#r-no').textContent = 'No. ——— NEW';
  /* the sky: night after eight, day before; the time large, the place small */
  const sky = $('#pl-sky'); sky.classList.toggle('night', night);
  $('#pl-time').textContent = fmtClock(now); $('#pl-sw').innerHTML = `${icon(night ? 'night' : 'day')}<small>${night ? 'AFTER DARK' : 'DAYLIGHT'}</small>`;
  $('#pl-where').textContent = suburbAt(p.lat, p.lng);
  /* the card forming */
  $('#pl-kind').className = `kind k-${k.f}`; $('#pl-kind').innerHTML = `<b>${k.word}</b>${icon('turn', 'sm')}`;
  /* what happened, and what it is: each a row of choices; the words choose first, a touch overrides */
  $('#pl-kinds').innerHTML = PLACE_KINDS.map((x, i) => `<button type="button" class="chip k-${x.f}${i === p.kind ? ' on' : ''}" data-k="${i}" aria-pressed="${i === p.kind}">${x.word}</button>`).join('');
  const lifeOn = LIFE_KINDS.includes(k.f); $('#pl-lives').hidden = !lifeOn; $('#pl-lives-h').hidden = !lifeOn;
  const autoG = !p.g && p.tx ? glyphOf(p) : null;
  if (lifeOn) $('#pl-lives').innerHTML = LIFE_CHIPS.map(([g, w]) => `<button type="button" class="lchip${p.g === g ? ' on' : autoG === g ? ' auto' : ''}" data-g="${g}" aria-pressed="${p.g === g}" aria-label="${w}" title="${w}">${glyphSVG(g)}<small>${w}</small></button>`).join('');
  const chosen = p.g ? (M.KINDS[p.g] || '') : '';
  const name = p.tx ? p.tx.cn : chosen && p.g !== 'paw' ? (k.f === 'injured' ? `${chosen}, hurt` : k.f === 'dead' ? `${chosen}, dead` : k.f === 'lost' ? `${chosen}, lost` : chosen) : k.f === 'injured' ? 'An animal, hurt' : k.f === 'dead' ? 'An animal, dead' : k.f === 'lost' ? 'An animal, lost' : k.f === 'flora' ? 'A plant' : k.f === 'fauna' ? 'An animal' : text ? text.slice(0, 48) : cap(k.word.toLowerCase());
  $('#pl-name').textContent = name; $('#pl-latin').innerHTML = p.tx ? `<i>${esc(p.tx.n)}</i>` : '';
  const tags = []; const n = countFrom(text.toLowerCase()); if (n > 1) tags.push([null, `×${n}`]);
  if (night && ['fauna', 'injured', 'lost', 'dead'].includes(k.f)) tags.push(['night', 'AFTER DARK']);
  if (fe && fe.st === 'I') tags.push([null, 'INTRODUCED']); if (fe && fe.st === 'T') tags.push([null, 'THREATENED']);
  $('#pl-tags').innerHTML = tags.map(([ic, w]) => `<span>${ic ? icon(ic, 'sm') : ''}${w}</span>`).join('');
  drawPreview();
  /* what to do, at once */
  const tel = k.f === 'injured' ? ['tel:0384007300', '(03) 8400 7300', 'WILDLIFE VICTORIA'] : k.f === 'dead' && fe && BIRDS.has(fe.g) ? ['tel:1800675888', '1800 675 888', 'SICK OR DEAD WILD BIRDS'] : null;
  const lostL = k.f === 'lost' ? LINKS.find(l => /LOST/.test(l[0]) && (p.lat > -37.7835 ? /MERRI/.test(l[0]) : /MELBOURNE/.test(l[0]))) || null : null;
  $('#pl-hint').innerHTML = (fe && fe.harm && !tel ? `<ul class="r-do">${doRow('harm', cap(fe.harm), '')}</ul>` : '')
    + (tel ? `<a class="callline alarm" href="${tel[0]}">${icon('phone')}<span class="mono">${tel[1]}</span><small>${tel[2]}</small></a>` : '')
    + (lostL ? `<a class="callline" href="${lostL[1]}" target="_blank" rel="noopener">${icon('out')}<span class="mono">LOST + FOUND</span><small>${esc(lostL[0])}</small></a>` : '');
  $('#pl-when').hidden = k.type !== 'event'; $('#pl-sign').value = S.me.by || '';
  heroWord('check', k.go); rec.classList.toggle('alarm', k.f === 'injured' || k.f === 'dead');
}
const pop = () => { const d = $('#pl-disc'); d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop'); };
$('#pl-text').addEventListener('input', debounce(() => { const p = S.place; if (!p) return; const was = p.kind; if (p.auto) p.kind = kindFrom($('#pl-text').value.toLowerCase()); const had = p.tx && p.tx.n; fillPlace(); if (p.kind !== was || (p.tx && p.tx.n) !== had) { tick(p.kind !== was ? 1200 : 2000); pop(); } }, 160));
$('#pl-text').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); placeIt(); } });
$('#pl-kind').addEventListener('click', () => { const b = $('#pl-kinds .chip.on') || $('#pl-kinds .chip'); if (b) b.focus(); tick(1200); });
$('#pl-kinds').addEventListener('click', e => { const b = e.target.closest('[data-k]'); const p = S.place; if (!b || !p) return; p.kind = +b.dataset.k; p.auto = false; if (PLACE_KINDS[p.kind].f === 'flora' && p.g && !['plant', 'fungi'].includes(p.g)) p.g = null; if (PLACE_KINDS[p.kind].f !== 'flora' && ['plant', 'fungi'].includes(p.g)) p.g = null; fillPlace(); tick(1200); pop(); });
$('#pl-lives').addEventListener('click', e => {
  const b = e.target.closest('[data-g]'); const p = S.place; if (!b || !p) return; const g = b.dataset.g;
  p.g = p.g === g ? null : g;
  const f = PLACE_KINDS[p.kind].f; if (p.g === 'plant' && f !== 'flora') { p.kind = PLACE_KINDS.findIndex(x => x.f === 'flora'); p.auto = false; } else if (p.g && p.g !== 'plant' && f === 'flora') { p.kind = 0; p.auto = false; }
  fillPlace(); tick(1900); pop();
});
$('#pl-here').addEventListener('click', () => {
  if (!navigator.geolocation) { toast('This device cannot say where it is.'); return; }
  const b = $('#pl-here'); b.classList.add('busy'); tick();
  navigator.geolocation.getCurrentPosition(pos => { b.classList.remove('busy'); const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude }; if (!inBox(ll.lat, ll.lng)) { toast('That is outside the map.'); return; } movePlace(ll); if (S.mapReady) map.easeTo({ center: [ll.lng, ll.lat], zoom: Math.max(map.getZoom(), 16), offset: sheetOffset(), duration: reduced() ? 0 : 600 }); },
    () => { b.classList.remove('busy'); toast('Tap the map where it is.'); }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
});
/* a photograph from the phone, made small enough to keep on this device */
$('#pl-photo').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; if (!f || !S.place) return;
  try {
    const url = URL.createObjectURL(f); const im = await loadImage(url); const N = 720; const k = Math.min(1, N / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    S.place.photo = c.toDataURL('image/jpeg', 0.78); placeImg = await loadImage(S.place.photo); $('#pl-shot').classList.add('has'); fillPlace(); tick(2200); buzz(8);
  } catch (err) { toast('That photo will not open here.'); }
  e.target.value = '';
});
async function placeIt() {
  const p = S.place; if (!p) return; const k = PLACE_KINDS[p.kind]; const text = $('#pl-text').value.trim(); const sign = $('#pl-sign').value.trim();
  if (!text && !p.photo) { nudge($('#pl-text')); return; }
  if (k.type === 'event' && !$('#pl-when').value) { nudge($('#pl-when')); return; }
  if (!sign) { nudge($('#pl-sign')); return; }
  const contact = $('#pl-contact').value.trim(); if (!contactOK(contact)) { nudge($('#pl-contact')); toast('A phone number or an email, please. No social media.'); return; }
  S.me.by = sign; store.set('da.me', S.me);
  const dp = k.type === 'need' ? 3 : 4; const tx = p.tx || speciesFrom(text.toLowerCase()); const n = countFrom(text.toLowerCase());
  const g = LIFE_KINDS.includes(k.f) ? (p.g || (tx ? null : life.badgeOf(p, 20).g)) : null;
  const data = { text: text || (tx ? tx.cn : p.g ? M.KINDS[p.g] : ''), ...(tx ? { tx } : {}), ...(g ? { g } : {}), ...(contact ? { contact } : {}), ...(n > 1 ? { n } : {}), ...(p.photo ? { photo: p.photo } : {}), ...(k.type === 'event' ? { start: new Date($('#pl-when').value).toISOString() } : {}) };
  const ev = { type: k.type, lat: +p.lat.toFixed(dp), lng: +p.lng.toFixed(dp), b: tx && k.type === 'noticed' ? null : k.b, who: sign, data };
  const saved = await ledgerAdd(ev); $('#pl-text').value = '';
  buzz([12, 40, 18]); tick(900); closeRecord(); select('u:' + saved.key);
}
const holdRing = $('#hold'); let pressT = 0, pressAt = null;
const ringOff = () => holdRing.classList.remove('on');
const arm = e => { if (S.mode) return; pressAt = e.point; clearTimeout(pressT); holdRing.style.left = `${e.point.x}px`; holdRing.style.top = `${e.point.y}px`; holdRing.classList.remove('on'); void holdRing.offsetWidth; holdRing.classList.add('on'); pressT = setTimeout(() => { ringOff(); if (pressAt) { pressAt = null; life.offer(null); startPlace(e.lngLat); } }, 650); };
map.on('mousedown', e => { if (e.originalEvent.button === 0 && !life.hit(e.point.x, e.point.y, true)) arm(e); });
map.on('touchstart', e => { if (e.points && e.points.length > 1) { clearTimeout(pressT); pressAt = null; ringOff(); return; } if (!life.hit(e.point.x, e.point.y, true)) arm(e); });
const disarm = e => { if (!pressAt) return; if (!e || !e.point || Math.hypot(e.point.x - pressAt.x, e.point.y - pressAt.y) > 6) { clearTimeout(pressT); pressAt = null; ringOff(); } };
map.on('mousemove', disarm); map.on('touchmove', disarm); map.on('dragstart', () => disarm()); map.on('rotatestart', () => disarm()); map.on('pitchstart', () => disarm());
map.on('mouseup', () => { clearTimeout(pressT); pressAt = null; ringOff(); }); map.on('touchend', () => { clearTimeout(pressT); pressAt = null; ringOff(); });


/* ════════════════════════════════════════════════════════════════════
   THE POSTER — A4, a climate emergency warning a passer-by can read in the order they need it:
   the warning, what was seen, what it is, the months ahead and the danger they bring it,
   then the four lines that ask something of them (a third of the sheet), a code to answer it, and who to call.
   ════════════════════════════════════════════════════════════════════ */
function portalBase() {
  if (CONFIG.PORTAL_URL) return CONFIG.PORTAL_URL.replace(/#.*$/, '');
  if (/^https?:$/.test(location.protocol) && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)) return location.origin + location.pathname;
  return '';
}
function renderQR(host, text) {
  try { const qr = qrcode(0, 'M'); qr.addData(text); qr.make(); const n = qr.getModuleCount(), N = n + 4; let p = '', dark = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) { p += `M${c + 2} ${r + 2}h1v1h-1z`; dark++; }
    host.innerHTML = `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="QR code"><path d="${p}" fill="#000"/></svg>`; host._ratio = dark / (N * N);
  } catch (e) { host.innerHTML = ''; host._ratio = 0; }
}
function subjectFor(o, ev) {
  const sub = subjectOf(o); if (sub && sub.tx) return sub;
  const snap = ev && ev.data && ev.data.snap; if (snap) return { ...snap, age: 0 };
  return { id: null, user: true, isEvent: o.isEvent, start: o.start, d: isoDay(new Date(ev ? ev.at : Date.now())), t: null, lat: o.lat, lng: o.lng, ob: o.id === 'blank', cap: false, q: '', pg: '', hum: o.hum, tx: { n: '', cn: o.id === 'blank' ? '' : nameOf(o), ic: o.hum ? 'Human' : SCALES[bandOf(o)].taxa[0], th: false, na: false, intro: false }, u: { l: '', n: (ev && ev.who) || '' }, ph: null };
}
const codeFor = (o, ev) => (o.id === 'blank' ? '______' : codeOf(o));
const targetFor = (o, ev) => {
  const b = portalBase(); if (o.id === 'blank') return b || 'https://www.inaturalist.org';
  if (b) return `${b}#${hashOf(o) || 'U' + ev.key}`;
  return typeof o.id === 'number' ? `${CONFIG.INAT_WEB}${o.id}` : 'https://www.inaturalist.org';
};
async function buildNotice(o, ev) {
  const d = ev.data || {}; const P = id => document.getElementById(id); const blank = o.id === 'blank';
  const sub = blank ? null : subjectFor(o, ev); const resp = S.resp.get(ev.key); const fe = blank ? null : fieldOf(o);
  const poster = P('poster'); poster.classList.toggle('blank', blank);
  /* the warning */
  P('p-kicker').textContent = `CLIMATE EMERGENCY RESPONSE · ${CONFIG.ELNINO}`;
  /* the headline names the unseasonable stretch this life faces; otherwise the season itself */
  const win = blank ? null : windowOf(o, nowK(), 6); P('p-head').textContent = win ? cap(win.w.toLowerCase()) : 'Hotter, drier';
  /* what was seen: the photograph, plain; or the thing itself, large */
  const ph = P('p-photo'); ph.innerHTML = ''; let credit = '';
  const own = !blank && (o.photo || (sub && sub.photo));
  const src = own || (!blank && sub.ph && licAdaptable(sub.ph.l) ? photoURL(sub.ph.u, 'large') : null);
  if (src) { const im = await loadImage(src, !own).catch(() => null); if (im) { const el = document.createElement('img'); el.src = src; el.alt = ''; ph.appendChild(el); credit = own ? (o.who ? `PHOTO ${o.who}` : '') : `PHOTO © ${sub.u.n || sub.u.l} · ${licLabel(sub.ph.l)}`; } }
  if (!ph.firstChild) {   /* no photograph: the thing itself, drawn as a vector so it prints sharp and survives every copy of the sheet */
    const b = blank ? null : life.badgeOf(o, 40); const ref = b ? (b.g ? `k-${b.g}` : b.i ? `g-${b.i}` : '') : '';
    ph.innerHTML = `<svg class="pw-glyph${b && b.i ? ' ic' : ''}" viewBox="0 0 16 16" aria-hidden="true">${ref ? `<use href="#${ref}"/>` : ''}</svg>`;
  }
  P('p-prov').textContent = credit;
  /* what it is */
  const name = blank ? '' : (sub.tx && (sub.tx.cn || sub.tx.n)) || nameOf(o);
  const night = !blank && (isNight(o) || (sub && isNight(sub)));
  P('p-seen').textContent = blank ? '' : [o.kind === 'injured' ? 'HURT' : o.kind === 'dead' ? 'FOUND DEAD' : o.kind === 'lost' ? 'LOST' : o.isEvent ? 'GATHERING' : lifeOf(o) === 'human' ? 'PEOPLE' : 'SEEN', night ? 'AFTER DARK' : '', `IN ${placeOf(o)}`].filter(Boolean).join(' · ');
  const nm = P('p-name'); nm.textContent = name; nm.style.fontSize = name.length > 30 ? 'calc(var(--pt) * 24)' : name.length > 20 ? 'calc(var(--pt) * 29)' : '';
  P('p-latin').textContent = !blank && sub.tx && sub.tx.cn && sub.tx.n ? sub.tx.n : '';
  /* why it matters: the months ahead, and the danger they bring this life; for an animal hurt or dead, what not to do */
  const danger = blank ? '' : dangerOf(o);
  const w = blank ? null : worstWhen(o, nowK(), 6); const k0 = nowK(); const span = monthsWord(outMonth(k0).m, outMonth(Math.min(OUT_N - 1, k0 + 2)).m);
  const harm = o.kind === 'dead' ? 'Do not touch it. Report it.' : o.kind === 'injured' ? 'Do not handle it. Call for help.' : '';
  /* said plainly, without headings: the months and their degree; the danger once, in bold; and the ground itself, its canopy
     against the 40% that cools a street, with what this life is short of there (or, for a hunter brought here, what is at risk from it).
     For an animal hurt or dead, what not to do comes before the ground. */
  const cn = blank ? null : canopyOf(o); const said = danger && norm(d.w || '') === norm(danger);
  const needs = blank || (o.hum && !(sub && sub.tx && sub.tx.n)) || o.isEvent ? [] : needsOf(o);
  const short = needs.filter(n => n.st === 'none' || n.st === 'low').map(n => n.w); const near = needs.filter(n => n.st === 'near').map(n => n.w); const risk = needs.find(n => n.st === 'risk');
  const within = `${Math.round(Math.max(300, rangeOf(o)) / 50) * 50} m`;
  /* the canopy has its own line, so it is not said again among the needs */
  const shortX = cn ? short.filter(x => x !== 'CANOPY') : short;
  const lack = risk ? `${risk.n} NATIVE ANIMAL${risk.n === 1 ? '' : 'S'} AT RISK` : shortX.length ? `NEEDS ${shortX.slice(0, 2).join(' & ')}` : near.length ? `${near.slice(0, 2).join(' & ')} NEARBY` : '';
  const ground = cn ? `<div class="pw-ground"><strong>CANOPY ${cn.pc}%</strong><strong>SHOULD BE ${CANOPY_TARGET}%+</strong>${lack ? `<strong>${lack}</strong>` : ''}<p>Canopy for ${esc(title(cn.sb))}, ${cn.yr}.${lack ? ` Counted within ${within}.` : ''}</p></div>`
    : lack ? `<div class="pw-ground"><strong>${lack}</strong><p>Counted within ${within}.</p></div>` : '';
  const cols = [`<div class="pw-out"><strong>${w ? `${w.word} · ${DEG[w.deg]} DANGER` : span}</strong><p>Hotter and drier than normal. Likely the strongest El Niño on record.</p></div>`];
  if (danger && !said) cols.push(`<div class="pw-dz"><p>${esc(danger)}</p></div>`);
  if (harm) cols.push(`<div><strong>DO NO HARM</strong><p>${esc(harm)}</p></div>`);
  if (cols.length < 3) cols.push(ground);
  P('p-why').innerHTML = blank ? '<div><strong>MONTHS · DANGER</strong><i class="ln"></i></div><div><strong>CANOPY · WHAT IT NEEDS HERE</strong><i class="ln"></i></div>' : cols.filter(Boolean).join('');
  /* the four lines, each under its name in full */
  const after = d.after && S.resp.get(d.after);
  P('p-wish').innerHTML = ['W', 'I', 'S', 'H'].map(k => `<div class="pw-l${k === 'H' ? ' h' : ''}"><span class="pw-lab">${WISH[k][0].toUpperCase()}</span><p>${esc(d[k.toLowerCase()] || '')}</p></div>`).join('')
    + (blank ? '' : `<div class="pw-sign">${esc(ev.who || '')}${after ? ` · AFTER ${esc(after.who || after.letter)}` : ''}</div>`);
  /* the answer: a code, the precedent, the places it is on show, a contact, who to call */
  renderQR(P('p-qr'), targetFor(o, ev));
  const brief = !blank && d.brief && BRIEFS.find(x => x.id === d.brief);
  P('p-after').innerHTML = brief ? `<b>AFTER</b>${esc(brief.after)}, ${esc(brief.city)}${brief.yr ? ` ${brief.yr}` : ''}` : '';
  const hosts = resp ? resp.hostList : (d.hosts || []);
  P('p-biz').innerHTML = blank ? '<b>ON SHOW AT</b><i class="ln"></i>' : hosts.length ? `<b>ON SHOW AT</b>${hosts.slice(0, 4).map(esc).join(' · ')}` : '';
  P('p-contact').innerHTML = !blank && o.contact ? `<b>CONTACT</b>${esc(o.contact)}` : '';
  P('p-emerg').innerHTML = '<b>HURT WILDLIFE</b>(03) 8400 7300 <b>EMERGENCY</b>000';
  P('p-country').textContent = CONFIG.COUNTRY;
  try { await document.fonts.ready; } catch (e) { /* fallback type */ }
  return estimateInk(poster);
}
/* the sign-up sheet for a business: its role, the lives in its radius, and what signing up means */
async function buildBizQuote(i) {
  const z = bizOf(i); const P = id => document.getElementById(id); if (!z) return 0;
  const R = ROLES[z.role] || ROLES.owner; const url = portalBase() ? `${portalBase()}#B${toCode(i)}` : 'https://www.inaturalist.org';
  const lives = cellsAll().filter(o => !o.hum && !isCold(o) && haversine(z.lat, z.lng, o.lat, o.lng) <= BIZ_R).sort((a, b) => degOf(b) - degOf(a));
  P('q-for').textContent = z.n;
  P('q-act').innerHTML = `<b>${R.w} · ${R.on ? 'ON NOTICE' : 'WORTH BACKING'}</b><span>${esc(R.duty)} (${BIZ_R} m).${R.line ? ` ${esc(R.line)}` : ''}</span>${DEMO ? '<em>SPECIMEN</em>' : ''}`;
  P('q-items').innerHTML = `<tbody>${lives.slice(0, 10).map(o => `<tr><td>${esc(nameOf(o))}</td><td class="r">${degOf(o) >= 2 ? DEG[degOf(o)] : ''}</td></tr>`).join('')}</tbody>`;
  P('q-opts').innerHTML = ['SIGN UP', 'HOST POSTERS', 'FUND A BRIEF', 'SUPPLY IN KIND'].map(t => `<span><i></i>${t}</span>`).join('');
  P('q-method').textContent = 'Signing up means a window for posters and support for the briefs near you. Nothing is owed.';
  renderQR(P('q-qr'), url); P('q-country').textContent = CONFIG.COUNTRY;
  try { await document.fonts.ready; } catch (e) { /* fallback type */ }
  return estimateInk(P('quote'));
}
let dens = null;
function glyphDensity() {
  if (dens) return dens; const c = document.createElement('canvas'); c.width = 1100; c.height = 150; const x = c.getContext('2d', { willReadFrequently: true });
  const sample = 'Afteryoufillthekettlerefillthedishinshade0123456789WISHOUTSIDEANIMALNEWS'; dens = {};
  for (const wt of ['400', '700']) { x.clearRect(0, 0, c.width, c.height); x.fillStyle = '#000'; x.textBaseline = 'top'; x.font = `${wt} 40px Poppins, sans-serif`; const adv = x.measureText('M').width || 24;
    for (let i = 0, r = 0; i < sample.length; i += 25, r++) x.fillText(sample.slice(i, i + 25), 0, r * 46);
    const d = x.getImageData(0, 0, c.width, c.height).data; let a = 0; for (let i = 3; i < d.length; i += 4) a += d[i] / 255; dens[wt] = { adv: adv / 40, k: a / (sample.length * adv * 40) }; }
  return dens;
}
function estimateInk(doc) {
  const W = doc.offsetWidth, H = doc.offsetHeight; if (!W) return 0; const D = glyphDensity(); let ink = 0;
  const tw = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { const el = n.parentElement; if (!el || el.closest('[hidden]') || el.closest('svg')) continue; const ch = n.nodeValue.replace(/\s/g, '').length; if (!ch) continue;
    const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize) || 12; const dd = D[parseInt(cs.fontWeight, 10) >= 600 ? '700' : '400']; ink += ch * dd.adv * fs * fs * dd.k; }
  for (const el of doc.querySelectorAll('*')) { if (el.closest('[hidden]') || el.closest('svg')) continue; const cs = getComputedStyle(el); const w = el.offsetWidth, h = el.offsetHeight; if (!w && !h) continue;
    for (const [side, len] of [['Top', w], ['Bottom', w], ['Left', h], ['Right', h]]) { const st = cs[`border${side}Style`]; if (st === 'none' || st === 'hidden') continue; let bw = parseFloat(cs[`border${side}Width`]) || 0; if (st === 'dotted') bw *= 0.5; else if (st === 'dashed') bw *= 0.6; ink += bw * len; }
    /* a solid fill, such as the warning band, counts by how dark it is */
    const bg = (cs.backgroundColor || '').match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    if (bg && el.tagName !== 'CANVAS' && el.tagName !== 'IMG') { const a = bg[4] == null ? 1 : +bg[4]; ink += a * (1 - (0.2126 * bg[1] + 0.7152 * bg[2] + 0.0722 * bg[3]) / 255) * w * h; } }
  for (const m of doc.querySelectorAll('canvas, img')) { if (m.hidden || m.closest('[hidden]')) continue; ink += (m._ink != null ? m._ink : 0.36) * m.offsetWidth * m.offsetHeight; }
  for (const g of doc.querySelectorAll('.pw-glyph')) if (g.querySelector('use')) ink += 0.16 * g.parentElement.offsetWidth * g.parentElement.offsetHeight;
  for (const s of doc.querySelectorAll('.p-dia')) { const r = s.getBoundingClientRect(); ink += s._ink != null ? s._ink * (r.width / 210) * (r.width / 210) + 0.012 * r.width * r.height : 0.035 * r.width * r.height; }
  for (const q of doc.querySelectorAll('.p-qr')) if (q._ratio) ink += q._ratio * q.offsetWidth * q.offsetHeight;
  return clamp(ink / (W * H) * 100, 0, 100);
}
let pressBusy = Promise.resolve();
const serial = job => { const run = () => job(); pressBusy = pressBusy.then(run, run); return pressBusy; };
function printSheet(which) {
  $$('#press > .poster').forEach(p => p.classList.toggle('printing', p.id === which));
  let st = $('#page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); } st.textContent = '@page{size:A4 portrait;margin:0}';
  window.print();
}
function printDoc(which, o, ev) {
  if (!o || !ev) { if (!S.filed) return; ({ o, ev } = S.filed); }
  document.body.classList.add('busy');
  return serial(async () => { const ink = await buildNotice(o, ev); window.__lastInk = ink; document.body.classList.remove('busy'); printSheet('poster'); });
}
function printBiz(i) { document.body.classList.add('busy'); return serial(async () => { window.__lastInk = await buildBizQuote(i); document.body.classList.remove('busy'); printSheet('quote'); }); }
async function share(o, ev) {
  const url = targetFor(o, ev); const text = `${nameOf(o)}: ${(ev.data && ev.data.h) || ''}`;
  try { if (navigator.share) { await navigator.share({ title: CONFIG.NAME, text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast('Copied.'); } catch (e) { toast(url); }
}

/* ───────── the sheet, in the record and full size ───────── */
const thumbCache = new Map();
function cloneSheet(src) {
  const c = src.cloneNode(true); const a = src.querySelectorAll('canvas'), b = c.querySelectorAll('canvas');
  a.forEach((cv, i) => { b[i].width = cv.width; b[i].height = cv.height; b[i].getContext('2d').drawImage(cv, 0, 0); b[i]._ink = cv._ink; });
  c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); c.classList.remove('printing'); return c;
}
function posterThumb(o, ev) {
  const r = S.resp.get(ev.key); const key = `${ev.key}|${r ? r.patrons.map(p => p.n + p.st).join(',') + '|' + r.hostList.join(',') : ''}`;
  return serial(async () => {
    if (!thumbCache.has(key)) { await buildNotice(o, ev); thumbCache.set(key, cloneSheet($('#poster'))); }
    const w = document.createElement('div'); w.className = 'mini'; w.appendChild(cloneSheet(thumbCache.get(key)));
    requestAnimationFrame(() => fitMini(w)); return w;
  });
}
function fitMini(w) { const p = w.firstElementChild; if (!p || !w.clientWidth) return; w.style.setProperty('--k', (w.clientWidth / p.offsetWidth).toFixed(4)); }
addEventListener('resize', debounce(() => $$('.mini').forEach(fitMini), 120));
/* ───────── the poster, full size: and the three ways to support it ───────── */
let viewing = null, formMode = null;
async function openViewer(o, ev, act) {
  if (!o || !ev) return;
  viewing = { o, ev }; const v = $('#viewer'); v.hidden = false; const host = $('#v-sheet'); host.innerHTML = '<div class="blank"></div>';
  slip(); showForm(act === 'host' || act === 'give' ? act : null);
  const names = new Set(); for (const b of bizNear(o.lat, o.lng, 1500)) names.add(b.n);
  $('#v-list').innerHTML = [...names].slice(0, 300).map(n => `<option value="${esc(n)}">`).join('');
  const node = await posterThumb(o, ev); if (!viewing || viewing.ev !== ev) return; host.innerHTML = ''; host.appendChild(node); fitMini(node);
}
function slip() {
  if (!viewing) return; const r = S.resp.get(viewing.ev.key); if (!r) return;
  const mine = r.dev === S.me.dev; const did = r.did.has(S.me.dev);
  const b = r.brief && BRIEFS.find(x => x.id === r.brief);
  $('#v-head').innerHTML = `<b>${esc(nameOf(viewing.o))}</b><small class="mono">${esc(r.who || '')}${r.spec ? ' · SPECIMEN' : ''}</small>${b ? `<small class="mono vb">AFTER ${esc(b.after.toUpperCase())}${b.city ? ` · ${esc(b.city.toUpperCase())}` : ''}</small>` : ''}<span class="vst mono${r.funded ? '' : ' need'}">${r.funded ? 'FUNDED' : 'UNFUNDED'}${r.hosts ? ' · ON SHOW' : ''}</span>`;
  const dd = $('#v-did'); dd.disabled = mine || did; dd.dataset.state = mine ? 'yours' : did ? 'done' : 'open';
}
function showForm(mode) {
  formMode = mode; const f = $('#v-form'); f.hidden = !mode;
  $('#v-host').classList.toggle('on', mode === 'host'); $('#v-give').classList.toggle('on', mode === 'give');
  if (!mode) return; $('#v-ba').hidden = mode !== 'give'; $('#v-bn').value = ''; $('#v-ba').value = '';
  $('#v-bn').placeholder = mode === 'host' ? 'Where it will go' : 'Your name'; $('#v-bn').setAttribute('list', mode === 'host' ? 'v-list' : ''); $('#v-ba').placeholder = 'e.g. $20';
  setTimeout(() => $('#v-bn').focus(), 30);
}
$('#v-host').addEventListener('click', () => { showForm(formMode === 'host' ? null : 'host'); tick(); });
$('#v-give').addEventListener('click', () => { showForm(formMode === 'give' ? null : 'give'); tick(); });
$('#v-did').addEventListener('click', async () => { if (!viewing) return; const r = S.resp.get(viewing.ev.key); if (!r || r.dev === S.me.dev || r.did.has(S.me.dev)) return; await ledgerAdd({ type: 'did', ref: r.cell, data: { of: r.key } }); slip(); buzz([10, 30, 10]); tick(); });
$('#v-form').addEventListener('submit', async e => {
  e.preventDefault(); if (!viewing || !formMode) return; const r = S.resp.get(viewing.ev.key); if (!r) return;
  const n = $('#v-bn').value.trim(); if (!n) { nudge($('#v-bn')); return; }
  if (formMode === 'host') await ledgerAdd({ type: 'host', ref: r.cell, data: { of: r.key, n } });
  else { const amt = parseFloat(String($('#v-ba').value).replace(/[^\d.]/g, '')) || 0; if (!amt) { nudge($('#v-ba')); return; } await ledgerAdd({ type: 'pledge', ref: r.cell, data: { of: r.key, n, amt, st: 'given' } }); }
  showForm(null); slip(); buzz([10, 40, 10]); tick(); thumbCache.clear(); thumbs.clear();
  const v = viewing; const node = await posterThumb(v.o, v.ev); if (viewing === v) { const host = $('#v-sheet'); host.innerHTML = ''; host.appendChild(node); fitMini(node); }
});
function closeViewer() { $('#viewer').hidden = true; viewing = null; showForm(null); }
$('#v-print').addEventListener('click', () => { if (viewing) printDoc('notice', viewing.o, viewing.ev); });
$('#v-share').addEventListener('click', () => { if (viewing) share(viewing.o, viewing.ev); });
$('#v-remix').addEventListener('click', () => { if (!viewing) return; const { o, ev } = viewing; const r = S.resp.get(ev.key); closeViewer(); if (!r) return; if (S.sel !== o.id || S.mode !== 'ping') select(o.id, r.brief); remix(o, r); });
$('#v-x').addEventListener('click', closeViewer);
$('#viewer').addEventListener('click', e => { if (e.target.id === 'viewer') closeViewer(); });


/* ───────── deep links: a view by name; #S01 a story; #H01 a community record; #U… a placed record or a response; #B… a business; any other code an iNaturalist sighting ───────── */
let pendingHash = location.hash.replace(/^#/, '');
const viewOfHash = h => { const p = PARTS[String(h).toLowerCase()]; return p ? p[0] : -1; };
const isLocalHash = h => viewOfHash(h) >= 0 || /^[SHFET]\d{2}$/i.test(h);
async function handleHash() {
  const h = decodeURIComponent(pendingHash || ''); pendingHash = ''; if (!h) return;
  const v = viewOfHash(h); if (v >= 0) { const part = h.toLowerCase(); setView(v, false, PARTS[part][1] ? part : null); return; }
  if (/^S\d{2}$/i.test(h)) { const id = 'story:' + h.toUpperCase(); if (S.byId.has(id)) { if (S.view !== 1) setView(1, true); select(id); } return; }
  if (/^H\d{2}$/i.test(h)) { const id = 'h:' + h.toUpperCase(); if (S.byId.has(id)) select(id); return; }
  if (/^F\d{2}$/i.test(h)) { const id = 'f:' + h.toUpperCase(); if (S.byId.has(id)) select(id); return; }
  if (/^E\d{2}$/i.test(h)) { const id = 'e:' + (+h.slice(1)); if (S.byId.has(id)) select(id); return; }
  if (/^T\d{2}$/i.test(h)) { const id = 'tribe:' + h.toUpperCase(); if (S.byId.has(id)) { if (S.view !== 1) setView(1, true); selectTribe(id); } return; }
  if (/^U[0-9a-z]{8,}$/i.test(h)) {
    const key = h.slice(1); const r = S.resp.get(key); const id = r ? r.cell : 'u:' + key;
    const o = S.byId.get(id); if (!o) { toast('Not on this device.'); return; }
    select(id); if (r) setTimeout(() => openViewer(o, r.ev), 500);
    return;
  }
  if (/^B[0-9A-Z]{1,3}$/.test(h)) { await loadBusinesses(); computeOrbit(); const i = parseInt(h.slice(1).toLowerCase(), 36); if (bizOf(i)) selectBiz(i); return; }
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

/* ───────── a word on hover: every [data-tip] explains itself in a line; on touch, a tap shows it for a moment ───────── */
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
document.addEventListener('click', e => { if (!coarse()) return; const el = e.target.closest('[data-tip]'); if (!el || e.target.closest('button, a, textarea, input, select')) return; showTip(el); clearTimeout(tipT); tipT = setTimeout(hideTip, 2800); });

/* ───────── boot ───────── */
document.title = CONFIG.NAME.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase());
document.body.dataset.view = VIEWS[0].k; document.documentElement.classList.toggle('still', !prefs.motion);
S.mo = nowK();
loadDemo(); derive(); buildTribes(); buildHeroes(); computeOrbit(); renderView(); flags(); loadEvents();
if (isLocalHash(pendingHash)) handleHash();
loadWeather().then(() => fetchSightings(false)).then(() => { if (pendingHash) handleHash(); }).then(() => fetchHistory());
loadBusinesses();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { /* online-only is fine */ });
window.__da = { S, CONFIG, M, FIELD, BRIEFS, map, ledger, life, select, selectBiz, setView, closeRecord, refresh, computeOrbit, bizOf, alarmsNow, fieldOf, glyphOf, isCold, live: liveTick, fetchHistory, openViewer, derive, startPlace,
  degOf, worstWhen, windowOf, needsOf, needLine, waterNear, matchBriefs, openBrief, outMonth, nowK, canopyAt, canopyOf, pickMonth, linkedLife, roleOfRow, onNotice, suburbAt, placeOf, fromBrief, fitsPoster, dangerOf, lifeOf, selectTribe, inTribe, livesIn, vote, buildNotice, printDoc };
})();
