
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
/* fresh: from the last 24 hours. A record or a story when it was made, a sighting when it was posted, a gathering when it starts */
const FRESH_MS = (CONFIG.FRESH_H || 24) * 3600e3;
const stampOf = o => (!o ? 0 : o.isEvent && o.start ? o.start : o.at || (o.c ? Date.parse(o.c) : 0) || (o.t ? Date.parse(o.t) : 0) || 0);
const isFresh = o => { if (!o || o.hist || o.hero) return false; const t = stampOf(o); if (!t) return false; const now = Date.now(); return o.isEvent && o.start ? t > now - FRESH_MS && t < now + FRESH_MS : t <= now + 60e3 && now - t < FRESH_MS; };
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
const TXI = store.get('da.tx.v2', {}), HGI = store.get('da.hg.v1', {});
const MONTH30 = 30 * 864e5;
async function taxonInfo(id) {
  if (!id) return null; if (TXI[id] && Date.now() - TXI[id].t < MONTH30) return TXI[id];
  try {
    const j = await (await fetch(`${CONFIG.INAT_API}/taxa/${id}?locale=en&preferred_place_id=${CONFIG.PLACE_PREF}`)).json(); const t = (j.results || [])[0]; if (!t) return null;
    const sum = String(t.wikipedia_summary || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    const first = (sum.match(/^.{20,}?[.!?](?=\s|$)/) || [sum])[0].trim();
    const cs = (t.conservation_statuses || []).find(c => c.place && /victoria/i.test(c.place.name || '')) || (t.conservation_statuses || []).find(c => c.place && /australia/i.test(c.place.name || '')) || t.conservation_status || null;
    const em = (t.establishment_means && t.establishment_means.establishment_means) || '';
    /* the photograph iNaturalist shows for the kind: used where a sighting has none open to show */
    const dp = t.default_photo || {}; const ph = dp.medium_url && licOpen(dp.license_code) ? { u: dp.medium_url, l: dp.license_code, a: dp.attribution || '' } : null;
    const v = { t: Date.now(), sum: first.length > 180 ? first.slice(0, 177) + '…' : first, obs: t.observations_count || 0, cs: cs ? String(cs.status_name || cs.status || '').toUpperCase() : '', em: em.toUpperCase(), wiki: t.wikipedia_url || '', ph };
    TXI[id] = v; store.set('da.tx.v2', TXI); return v;
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
async function liveTick() { const n = await fetchNew(); await loadWeather(); loadShared(); checkSent(); loadPartners(); loadSettings(); refreshPanel(); return n; }

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
  /* the board: this device's slips and the stories shown to everyone, newest first; then the examples */
  const codes = new Set(sigs.map(s => s.code)); const shown = new Set((S.shared || []).map(s => s.code));
  for (const s of sigs) if (shown.has(s.code)) s.shown = true;
  S.signals = [...sigs, ...(S.shared || []).filter(s => !codes.has(s.code))].sort((a, b) => b.at - a.at).concat(EXAMPLES.map(x => ({ key: 'ex:' + x.code, ex: true, ...x, at: Date.parse(x.at) })));
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
