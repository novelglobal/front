// Synthetic fixtures for offline testing ONLY (the cloud sandbox cannot reach iNaturalist, AWS or OSM).
// Nothing here ships in the app.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

let seed = 7;
export const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const wpick = (arr, w) => { const t = w.reduce((a, b) => a + b, 0); let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };

export const BBOX = { s: -37.823, w: 144.925, n: -37.748, e: 145.000 };
const MERRI = [[-37.746, 144.981], [-37.755, 144.984], [-37.762, 144.981], [-37.768, 144.985], [-37.775, 144.988], [-37.783, 144.992], [-37.790, 144.996], [-37.799, 144.999]];
const MOONEE = [[-37.746, 144.930], [-37.758, 144.932], [-37.770, 144.936], [-37.782, 144.939], [-37.795, 144.942], [-37.808, 144.940], [-37.817, 144.942]];
const YARRA = [[-37.822, 144.935], [-37.821, 144.955], [-37.819, 144.970], [-37.818, 144.985], [-37.815, 144.998]];
const PITS = [[-37.7655, 144.9555, 130, 8], [-37.7595, 144.9700, 90, 6], [-37.7710, 144.9640, 80, 7]];
const mx = (a, b) => [(b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180) * 111320, (b[0] - a[0]) * 110540];
function distSeg(p, a, b) {
  const [bx, by] = mx(a, b); const [px, py] = mx(a, p);
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by || 1)));
  return Math.hypot(px - t * bx, py - t * by);
}
const distLine = (p, line) => { let d = Infinity; for (let i = 0; i < line.length - 1; i++) d = Math.min(d, distSeg(p, line[i], line[i + 1])); return d; };
const hash = (x, y) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
export function elev(lat, lng) {
  const t = (lat - BBOX.s) / (BBOX.n - BBOX.s);
  let e = 6 + 44 * Math.pow(Math.max(0, t), 0.8);
  e += 2.5 * Math.sin(lng * 420) * Math.cos(lat * 310);
  const p = [lat, lng];
  e -= 16 * Math.exp(-((distLine(p, MERRI) / 170) ** 2));
  e -= 11 * Math.exp(-((distLine(p, MOONEE) / 210) ** 2));
  e -= 7 * Math.exp(-((distLine(p, YARRA) / 320) ** 2));
  for (const [a, b, r, d] of PITS) { const dd = Math.hypot(...mx([a, b], p)); if (dd < r) e -= d * (1 - (dd / r) ** 2); }
  e += 9 * Math.exp(-((Math.hypot(...mx([-37.811, 144.955], p)) / 650) ** 2));
  e += (hash(lat * 1e4, lng * 1e4) - 0.5) * 0.25;
  return Math.max(0.5, e);
}
const t2lon = (x, z) => x / 2 ** z * 360 - 180;
const t2lat = (y, z) => { const n = Math.PI - 2 * Math.PI * y / 2 ** z; return 180 / Math.PI * Math.atan(Math.sinh(n)); };
export async function demTile(z, x, y) {
  const buf = Buffer.alloc(256 * 256 * 3);
  for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
    const lat = t2lat(y + (j + 0.5) / 256, z), lng = t2lon(x + (i + 0.5) / 256, z);
    const v = elev(lat, lng) + 32768; const k = (j * 256 + i) * 3;
    buf[k] = Math.floor(v / 256); buf[k + 1] = Math.floor(v) % 256; buf[k + 2] = Math.floor((v - Math.floor(v)) * 256);
  }
  return sharp(buf, { raw: { width: 256, height: 256, channels: 3 } }).png().toBuffer();
}
export async function satTile(z, x, y) {
  const buf = Buffer.alloc(256 * 256 * 3);
  for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
    const lat = t2lat(y + (j + 0.5) / 256, z), lng = t2lon(x + (i + 0.5) / 256, z);
    const p = [lat, lng]; const k = (j * 256 + i) * 3;
    const city = Math.max(0, Math.min(1, (-37.795 - lat) / -0.02 * -1));
    const nearCreek = Math.min(distLine(p, MERRI), distLine(p, MOONEE));
    const park = Math.hypot(...mx([-37.787, 144.952], p)) < 900 || nearCreek < 90;
    const gx = Math.abs(((lng * 2200) % 1 + 1) % 1 - 0.5) < 0.06, gy = Math.abs(((lat * 2900) % 1 + 1) % 1 - 0.5) < 0.05;
    const n = hash(lat * 9e4, lng * 9e4);
    let c;
    if (distLine(p, YARRA) < 60) c = [40, 52, 50];
    else if (park) c = [52 + 30 * n, 78 + 40 * n, 46 + 18 * n];
    else if (gx || gy) c = [92 + 30 * n, 92 + 30 * n, 96 + 30 * n];
    else { const roof = n > 0.55; c = roof ? [150 + 60 * n - city * 20, 140 + 50 * n, 132 + 40 * n] : [70 + 40 * n, 92 + 40 * n * (1 - city), 64 + 20 * n]; }
    buf[k] = c[0]; buf[k + 1] = c[1]; buf[k + 2] = c[2];
  }
  return sharp(buf, { raw: { width: 256, height: 256, channels: 3 } }).jpeg({ quality: 70 }).toBuffer();
}
export async function photo(id, size) {
  const W = size, H = Math.round(size * 0.75); const buf = Buffer.alloc(W * H * 3);
  const cx = W * (0.4 + (id % 7) / 30), cy = H * 0.5, r = W * 0.22;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 3; const d = Math.hypot(i - cx, j - cy) / r;
    const bg = 120 + 60 * Math.sin(i / 37 + id) * Math.cos(j / 23);
    const v = d < 1 ? 40 + 120 * d + 30 * Math.sin(i / 3) : bg;
    buf[k] = v * 0.9; buf[k + 1] = Math.min(255, v * 1.05); buf[k + 2] = v * 0.7;
  }
  return sharp(buf, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 80 }).toBuffer();
}

const TAXA = [
  [101, 'Trichoglossus moluccanus', 'Rainbow Lorikeet', 'Aves', 12, {}],
  [102, 'Manorina melanocephala', 'Noisy Miner', 'Aves', 10, {}],
  [103, 'Gymnorhina tibicen', 'Australian Magpie', 'Aves', 9, {}],
  [104, 'Corvus mellori', 'Little Raven', 'Aves', 6, {}],
  [105, 'Malurus cyaneus', 'Superb Fairywren', 'Aves', 4, { creek: MERRI }],
  [106, 'Anthochaera carunculata', 'Red Wattlebird', 'Aves', 6, {}],
  [107, 'Podargus strigoides', 'Tawny Frogmouth', 'Aves', 2, {}],
  [108, 'Falco peregrinus', 'Peregrine Falcon', 'Aves', 1, { at: [-37.8166, 144.9631] }],
  [109, 'Anas superciliosa', 'Pacific Black Duck', 'Aves', 4, { creek: MERRI }],
  [201, 'Pteropus poliocephalus', 'Grey-headed Flying-fox', 'Mammalia', 2, { th: true }],
  [202, 'Trichosurus vulpecula', 'Common Brushtail Possum', 'Mammalia', 5, {}],
  [203, 'Pseudocheirus peregrinus', 'Common Ringtail Possum', 'Mammalia', 4, {}],
  [204, 'Hydromys chrysogaster', 'Rakali', 'Mammalia', 1, { creek: MERRI }],
  [205, 'Pongo abelii', 'Sumatran Orangutan', 'Mammalia', 1, { cap: true, at: [-37.7841, 144.9515] }],
  [301, 'Tiliqua scincoides', 'Eastern Blue-tongued Lizard', 'Reptilia', 3, {}],
  [302, 'Lampropholis guichenoti', 'Garden Skink', 'Reptilia', 3, {}],
  [303, 'Crinia signifera', 'Common Eastern Froglet', 'Amphibia', 4, { creek: MERRI, sound: true }],
  [304, 'Limnodynastes dumerilii', 'Eastern Banjo Frog', 'Amphibia', 2, { creek: MOONEE }],
  [305, 'Litoria raniformis', 'Growling Grass Frog', 'Amphibia', 1, { ob: true, th: true }],
  [401, 'Hortophora transversa', 'Common Garden Orb-weaver', 'Arachnida', 4, {}],
  [402, 'Badumna insignis', 'Black House Spider', 'Arachnida', 3, {}],
  [403, 'Apis mellifera', 'Western Honey Bee', 'Insecta', 6, { intro: true }],
  [404, 'Vanessa kershawi', 'Australian Painted Lady', 'Insecta', 3, {}],
  [405, 'Pieris rapae', 'Cabbage White', 'Insecta', 4, { intro: true }],
  [406, 'Amegilla asserta', 'Blue-banded Bee', 'Insecta', 2, {}],
  [407, 'Harmonia conformis', 'Common Spotted Ladybird', 'Insecta', 2, {}],
  [408, 'Cornu aspersum', 'Garden Snail', 'Mollusca', 2, { intro: true }],
  [501, 'Eucalyptus camaldulensis', 'River Red Gum', 'Plantae', 6, { creek: MERRI }],
  [502, 'Themeda triandra', 'Kangaroo Grass', 'Plantae', 2, {}],
  [503, 'Arctotheca calendula', 'Capeweed', 'Plantae', 3, { intro: true }],
  [504, 'Oxalis pes-caprae', 'Soursob', 'Plantae', 4, { intro: true }],
  [505, 'Chrysocephalum apiculatum', 'Common Everlasting', 'Plantae', 2, {}],
  [601, 'Tremella mesenterica', 'Yellow Brain', 'Fungi', 1, {}],
];
const USERS = [['jlee', 'J. Lee'], ['mokafor', 'M. Okafor'], ['sam_brunswick', ''], ['priya.r', 'Priya R.'], ['tkelly', 'T. Kelly'], ['merri_walker', '']];
const LICS = [['cc-by-nc', 60], ['cc-by', 15], ['cc0', 5], [null, 10], ['cc-by-nc-nd', 5], ['cc-by-sa', 5]];
function along(line) { const i = Math.floor(rnd() * (line.length - 1)); const t = rnd(); return [line[i][0] + (line[i + 1][0] - line[i][0]) * t + (rnd() - 0.5) * 0.0012, line[i][1] + (line[i + 1][1] - line[i][1]) * t + (rnd() - 0.5) * 0.0012]; }
export function observations(n = 230) {
  const now = new Date(); const out = [];
  const forced = [401, 205, 303, 108, 201, 305];
  for (let k = 0; k < n; k++) {
    const T = k < forced.length ? TAXA.find(t => t[0] === forced[k]) : wpick(TAXA, TAXA.map(t => t[4]));
    const [tid, name, common, iconic, , o] = T;
    let lat, lng;
    if (o.at) { lat = o.at[0] + (rnd() - 0.5) * 0.0008; lng = o.at[1] + (rnd() - 0.5) * 0.0008; }
    else if (o.creek) [lat, lng] = along(o.creek);
    else if (rnd() < 0.62) { lat = -37.752 - rnd() * 0.03; lng = 144.935 + rnd() * 0.055; }
    else { lat = BBOX.s + 0.003 + rnd() * (BBOX.n - BBOX.s - 0.006); lng = BBOX.w + 0.003 + rnd() * (BBOX.e - BBOX.w - 0.006); }
    if (k === 0) { lat = -37.7668; lng = 144.9628; }
    const age = k < forced.length ? k % 3 : Math.floor(rnd() ** 1.6 * 29);
    const d = new Date(now); d.setDate(d.getDate() - age); d.setHours(6 + Math.floor(rnd() * 15), Math.floor(rnd() * 60));
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const lic = k === 0 ? 'cc-by-nc' : k === 2 ? null : wpick(LICS.map(l => l[0]), LICS.map(l => l[1]));
    const pid = 900000 + k; const [login, uname] = pick(USERS);
    const host = lic && licOpen(lic) ? 'https://inaturalist-open-data.s3.amazonaws.com' : 'https://static.inaturalist.org';
    const obscured = !!o.ob;
    if (obscured) { lat = -37.70 - rnd() * 0.15; lng = 144.90 + rnd() * 0.15; lat = Math.max(BBOX.s + 0.01, Math.min(BBOX.n - 0.01, lat)); lng = Math.max(BBOX.w + 0.01, Math.min(BBOX.e - 0.01, lng)); }
    out.push({
      id: 284110000 + k * 37, uri: `https://www.inaturalist.org/observations/${284110000 + k * 37}`,
      observed_on: day, time_observed_at: d.toISOString(), created_at: new Date(d.getTime() + 3600e3 * (2 + rnd() * 30)).toISOString(),
      location: `${lat},${lng}`, geojson: { type: 'Point', coordinates: [lng, lat] },
      obscured, geoprivacy: null, taxon_geoprivacy: obscured ? 'obscured' : 'open', captive: !!o.cap,
      quality_grade: o.cap ? 'casual' : rnd() < 0.62 ? 'research' : 'needs_id',
      place_guess: lat > -37.783 ? pick(['Brunswick VIC 3056, Australia', 'Brunswick East VIC 3057, Australia', 'Brunswick West VIC 3055, Australia', 'Merri Creek Trail, Brunswick East VIC, Australia']) : lat > -37.805 ? pick(['Parkville VIC 3052, Australia', 'Carlton North VIC 3054, Australia', 'Fitzroy North VIC 3068, Australia']) : pick(['Melbourne VIC 3000, Australia', 'East Melbourne VIC 3002, Australia']),
      positional_accuracy: 12, species_guess: common,
      taxon: { id: tid, name, preferred_common_name: common, iconic_taxon_name: iconic, rank: 'species', threatened: !!o.th, native: !o.intro && !o.cap, introduced: !!o.intro, endemic: false },
      user: { id: 10 + USERS.findIndex(u => u[0] === login), login, name: uname },
      photos: [{ id: pid, url: `${host}/photos/${pid}/square.jpg`, license_code: lic, attribution: lic ? `(c) ${uname || login}, some rights reserved (${lic.toUpperCase().replace('CC-', 'CC ').replace(/-/g, '-')})` : `(c) ${uname || login}, all rights reserved` }],
      sounds: o.sound ? [{ id: 5000 + k, file_url: `https://static.inaturalist.org/sounds/${5000 + k}.mp3`, license_code: 'cc-by-nc' }] : [],
    });
  }
  return out;
}
const licOpen = l => ['cc0', 'cc-by', 'cc-by-nc', 'cc-by-sa', 'cc-by-nc-sa', 'cc-by-nd', 'cc-by-nc-nd'].includes(l);

const SEC_TAGS = { FOOD: [['amenity', 'cafe'], ['amenity', 'restaurant'], ['amenity', 'bar'], ['shop', 'bakery']], FASHION: [['shop', 'clothes'], ['shop', 'second_hand'], ['shop', 'fabric'], ['craft', 'tailor']], RETAIL: [['shop', 'books'], ['shop', 'gift'], ['shop', 'variety_store']], GROCERY: [['shop', 'supermarket'], ['shop', 'convenience'], ['shop', 'greengrocer']], CARE: [['amenity', 'pharmacy'], ['shop', 'hairdresser'], ['shop', 'beauty']], GARDEN: [['shop', 'hardware'], ['shop', 'garden_centre'], ['shop', 'florist']], MOTOR: [['amenity', 'fuel'], ['shop', 'car_repair']], PETS: [['shop', 'pet'], ['amenity', 'veterinary']], OFFICE: [['office', 'company'], ['amenity', 'bank'], ['office', 'estate_agent']] };
const SEC_W = { FOOD: 34, FASHION: 15, RETAIL: 18, GROCERY: 8, CARE: 10, GARDEN: 4, MOTOR: 3, PETS: 3, OFFICE: 7 };
export function businesses() {
  const els = []; let id = 1;
  const strip = (name, lng, s, n, count, jitter = 0.00025) => { for (let i = 0; i < count; i++) { const sec = wpick(Object.keys(SEC_W), Object.values(SEC_W)); const [k, v] = pick(SEC_TAGS[sec]); els.push({ type: 'node', id: id++, lat: s + (n - s) * rnd(), lon: lng + (rnd() - 0.5) * jitter * 2, tags: { name: `${name} ${v.replace('_', ' ')} ${i + 1}`, [k]: v } }); } };
  strip('Sydney Rd', 144.9615, -37.783, -37.750, 140);
  strip('Lygon St', 144.9718, -37.800, -37.770, 60);
  strip('Nicholson St', 144.9776, -37.790, -37.755, 22);
  strip('Melville Rd', 144.9473, -37.780, -37.752, 16);
  for (let i = 0; i < 260; i++) { const sec = wpick(Object.keys(SEC_W), Object.values(SEC_W)); const [k, v] = pick(SEC_TAGS[sec]); els.push({ type: 'node', id: id++, lat: -37.818 + rnd() * 0.011, lon: 144.955 + rnd() * 0.017, tags: { name: `CBD ${v.replace('_', ' ')} ${i + 1}`, [k]: v, ...(rnd() < 0.08 ? { brand: 'Chainco' } : {}) } }); }
  els.push({ type: 'way', id: id++, center: { lat: -37.7665, lon: 144.9612 }, tags: { name: 'Sydney Rd hardware & garden', shop: 'hardware' } });
  els.push({ type: 'node', id: id++, lat: -37.7676, lon: 144.9614, tags: { name: 'Brunswick Ballroom', amenity: 'music_venue' } });
  els.push({ type: 'way', id: id++, center: { lat: -37.7712, lon: 144.9609 }, tags: { name: 'Brunswick Town Hall', amenity: 'community_centre' } });
  els.push({ type: 'node', id: id++, lat: -37.7741, lon: 144.9662, tags: { name: 'The Retreat Hotel', amenity: 'pub' } });
  return { version: 0.6, elements: els };
}

/* the next ten days, as the Bureau's ensemble would give them: a control run and seventeen members */
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function ensemble(base = 30) {
  const days = []; const t0 = new Date(); t0.setHours(12, 0, 0, 0);
  for (let i = 0; i < 10; i++) { const d = new Date(t0); d.setDate(d.getDate() + i); days.push(iso(d)); }
  const curve = [base - 2, base + 1, base + 6, base + 12, base + 9, base + 3, base - 1, base, base + 2, base - 3];
  const daily = { time: days, temperature_2m_max: curve.map(v => +(v - 1).toFixed(1)), precipitation_sum: curve.map((v, i) => i === 6 ? 4 : 0.4) };
  for (let m = 1; m <= 17; m++) {
    const k = String(m).padStart(2, '0');
    daily[`temperature_2m_max_member${k}`] = curve.map((v, i) => +(v - 3 + ((m * 7 + i * 3) % 10) * 0.4).toFixed(1));
    daily[`precipitation_sum_member${k}`] = curve.map((v, i) => +(((m + i) % 5) * 0.6).toFixed(1));
  }
  return { latitude: -37.775, longitude: 144.962, daily };
}
export function forecast(tmax = 33, nightLift = 0) {
  const days = []; const t0 = new Date(); t0.setHours(12, 0, 0, 0);
  for (let i = 0; i < 16; i++) { const d = new Date(t0); d.setDate(d.getDate() + i); days.push(iso(d)); }
  const max = days.map((_, i) => tmax + [-4, 0, -2, 3, 1, -5, -6, -3, 0, 2, 4, -1, -2, 0, 1, -3][i]);
  const min = max.map((v, i) => +(v - 13 + nightLift + (i % 3)).toFixed(1));
  return { daily: { time: days, temperature_2m_max: max, temperature_2m_min: min, precipitation_sum: days.map((_, i) => (i % 6 === 5 ? 3.2 : i === 1 ? 0.2 : 0)) } };
}

/* City of Melbourne open data, in the shapes the Explore API v2.1 returns */
export function com(dataset) {
  const pts = (n, f) => ({ type: 'FeatureCollection', features: Array.from({ length: n }, (_, i) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [144.950 + rnd() * 0.035, -37.822 + rnd() * 0.03] }, properties: f(i) })) });
  if (/tree-planting/.test(dataset)) return { type: 'FeatureCollection', features: Array.from({ length: 14 }, (_, i) => { const lat = -37.80 - i * 0.0014, lng = 144.952 + (i % 4) * 0.006; return { type: 'Feature', geometry: { type: 'LineString', coordinates: [[lng, lat], [lng + 0.004, lat + 0.0006], [lng + 0.008, lat + 0.0002]] }, properties: { str_from: `Street ${i}`, schedule: `Year ${1 + (i % 5)} (${2025 + (i % 5)}/${26 + (i % 5)})` } }; }) };
  if (/drinking-fountains/.test(dataset)) return pts(18, i => ({ description: `Fountain ${i}` }));
  if (/insect/.test(dataset)) return pts(40, i => ({ taxa: 'Insecta', sighting_date: '2015-02-0' + (1 + i % 9) }));
  if (/butterfly/.test(dataset)) return pts(25, i => ({ datetime: '2017-01-1' + (i % 9), common_name: 'Cabbage White' }));
  return { type: 'FeatureCollection', features: [] };
}
export function sensors() {
  return { total_count: 9, results: Array.from({ length: 9 }, (_, i) => ({ device_id: `ef-${i}`, received_at: new Date().toISOString(), airtemperature: +(29 + i * 0.7).toFixed(1), relativehumidity: 30, latlong: { lat: -37.805 - (i % 3) * 0.004, lon: 144.955 + Math.floor(i / 3) * 0.008 } })) };
}

/* the same weeks in a past year: a few research-grade records, re-dated */
export function historic(year = 1, n = 70) {
  const base = observations(n).filter(o => !o.obscured);
  return base.map((o, k) => {
    const d = new Date(o.time_observed_at); d.setFullYear(d.getFullYear() - year); d.setDate(d.getDate() - (k % 9));
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { ...o, id: 270000000 + year * 100000 + k, observed_on: day, time_observed_at: d.toISOString(), created_at: d.toISOString(), quality_grade: 'research' };
  });
}
