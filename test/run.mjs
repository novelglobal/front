// End-to-end check of dist/ in headless Chromium (software WebGL). Every outside host is mocked.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { observations, businesses, demTile, satTile, photo, ensemble, forecast, com, sensors, historic } from './fixtures.mjs';
import { createTestHarness } from 'wrangler';
const require = createRequire(import.meta.url);
const jsQR = require('jsqr');
const sharp = require('sharp');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const DIST = path.join(ROOT, 'dist');
const SHOTS = path.join(ROOT, 'test/shots'); if (!process.env.KEEP) fs.rmSync(SHOTS, { recursive: true, force: true }); fs.mkdirSync(SHOTS, { recursive: true });
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean); const run = name => (!ONLY.length && name !== 'dbg') || ONLY.includes(name);
/* the water OpenStreetMap would give: a bend of river between its two banks (120 m apart), and a pond */
const WATER = { elements: [
  { type: 'way', tags: { waterway: 'river', name: 'Yarra River' }, geometry: [[-37.8200, 144.9550], [-37.8210, 144.9600], [-37.8205, 144.9650], [-37.8190, 144.9700]].map(([lat, lon]) => ({ lat, lon })) },
  { type: 'relation', tags: { natural: 'water', water: 'river' }, members: [-0.00054, 0.00054].map(o => ({ type: 'way', role: 'outer', geometry: [[-37.8200, 144.9550], [-37.8210, 144.9600], [-37.8205, 144.9650], [-37.8190, 144.9700]].map(([lat, lon]) => ({ lat: lat + o, lon })) })) },
  { type: 'way', tags: { natural: 'water', water: 'pond' }, geometry: [[-37.7813, 144.9430], [-37.7810, 144.9438], [-37.7816, 144.9441], [-37.7819, 144.9433], [-37.7813, 144.9430]].map(([lat, lon]) => ({ lat, lon })) },
] };
const OBS = observations(230); const BIZ = businesses(); const HIST = [historic(1), historic(2)];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.md': 'text/markdown' };
const cache = new Map(); const unexpected = new Set();
const BASE_CONFIG = fs.readFileSync(path.join(DIST, 'config.js'), 'utf8');
/* the app's own server: the real Worker with a fresh local database, behind https://oan.test/api/ */
const ADMIN_KEY = 'test-admin-key-not-a-real-one';
const apiServer = createTestHarness({ root: ROOT, workers: [{ configPath: './wrangler.jsonc', secrets: { ADMIN_KEY } }] });
const API_O = (await apiServer.listen()).url.origin;
const admin = async (p, body) => { const r = await apiServer.fetch(new URL('/api/admin/' + p, API_O), { method: body ? 'POST' : 'GET', headers: { authorization: `Bearer ${ADMIN_KEY}`, 'content-type': 'application/json', origin: API_O }, body: body ? JSON.stringify(body) : undefined }); return r.json(); };

async function wire(ctx, { inat = true, config = BASE_CONFIG, tmax = 33, night = 0, worst = 30, ens = true, comOK = true, overpass = true, net = { down: false }, first = false, dark = false, front = false, journey = false, plain = false } = {}) {
  /* the studio, the back of every page, unless a check is about the fronts */
  /* the radar stays where it is pinned, unless a check is about a first visit */
  /* and by day (night is the default), unless a check is about the night */
  /* and the first visit's simple way through already walked, unless a check is about the journey itself */
  if (!first) await ctx.addInitScript(p => { try { if (!localStorage.getItem('da.prefs')) localStorage.setItem('da.prefs', p); } catch (e) { /* no storage */ } }, (dark ? '{"found":true,"start2":true,"night":true,"time":false,"placed":true,"journey":4' : '{"found":true,"start2":true,"night":false,"time":false,"placed":true,"journey":4') + (front ? '}' : ',"face":{"0":"back","1":"back","2":"back"}}'));
  else if (!journey) await ctx.addInitScript(() => { try { if (!localStorage.getItem('da.prefs')) localStorage.setItem('da.prefs', '{"journey":4}'); } catch (e) { /* no storage */ } });
  /* the studio's devices as built, unless a check is about the plain studio (after the prefs above, so they still stand) */
  if (!plain) await ctx.addInitScript(() => { try { localStorage.setItem('da.devices.v2', '1'); } catch (e) { /* no storage */ } });
  await ctx.route('**/*', async route => {
    const url = route.request().url(); const u = new URL(url);
    if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
    if (net.down) return route.abort('internetdisconnected');
    const ok = (body, type, extra = {}) => route.fulfill({ status: 200, body, headers: { 'content-type': type, 'access-control-allow-origin': '*', ...extra } });
    const json = o => ok(JSON.stringify(o), 'application/json');
    try {
      /* a photograph through novel.global: the same fake photograph, readable by the page */
      if ((u.host === 'oan.test' || u.host === 'novel.global') && u.pathname === '/api/img') {
        const m = (u.searchParams.get('u') || '').match(/photos\/(\d+)\/(\w+)\./); if (!m) return route.fulfill({ status: 400, body: 'u' });
        const size = { square: 75, small: 240, medium: 500, large: 1024 }[m[2]] || 240; const k = `p${m[1]}-${size}`; if (!cache.has(k)) cache.set(k, await photo(+m[1], size));
        return ok(cache.get(k), 'image/jpeg');
      }
      if ((u.host === 'oan.test' || u.host === 'novel.global') && u.pathname.startsWith('/api/')) {
        const rq = route.request(); const headers = { ...rq.headers(), origin: API_O }; delete headers.host;
        const r = await apiServer.fetch(new URL(u.pathname + u.search, API_O), { method: rq.method(), headers, body: rq.postDataBuffer() || undefined });
        return route.fulfill({ status: r.status, body: Buffer.from(await r.arrayBuffer()), headers: Object.fromEntries(r.headers) });
      }
      if (u.host === 'oan.test' || u.host === 'novel.global') {
        let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html'; if (!path.extname(p) && fs.existsSync(path.join(DIST, p + '.html'))) p += '.html';   /* /studio is studio.html, as Cloudflare serves it */
        if (p === '/config.js' && config) return ok(config, MIME['.js']);
        const f = path.join(DIST, p);
        if (!f.startsWith(DIST) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'not found' });
        return ok(fs.readFileSync(f), MIME[path.extname(f)] || 'application/octet-stream');
      }
      if (u.host === 'api.open-meteo.com') return json(forecast(tmax, night));
      if (u.host === 'ensemble-api.open-meteo.com') { if (!ens) return route.abort(); return json(ensemble(worst)); }
      if (u.host === 'data.melbourne.vic.gov.au') {
        if (!comOK) return route.abort();
        const ds = (u.pathname.match(/datasets\/([^/]+)/) || [])[1] || '';
        if (u.pathname.endsWith('/records')) return json(sensors());
        return json(com(ds));
      }
      if (u.host === 'api.inaturalist.org') {
        if (!inat) return route.abort();
        const tx = u.pathname.match(/\/taxa\/(\d+)$/);
        if (tx) return json({ total_results: 1, results: [{ id: +tx[1], name: 'Taxon ' + tx[1], observations_count: 1234, wikipedia_summary: '<p>The <b>test taxon</b> lives along the creeks of the inner north and feeds at dusk. It is seen most in summer.</p>', wikipedia_url: 'https://en.wikipedia.org/wiki/Test', conservation_statuses: +tx[1] % 3 === 0 ? [{ place: { name: 'Victoria' }, status_name: 'vulnerable' }] : [], establishment_means: { establishment_means: 'native' } }] });
        if (u.pathname.endsWith('/observations/histogram')) return json({ total_results: 12, results: { month_of_year: { 1: 9, 2: 7, 3: 5, 4: 3, 5: 1, 6: 0, 7: 1, 8: 2, 9: 4, 10: 8, 11: 12, 12: 10 } } });
        const m = u.pathname.match(/\/observations\/(\d+)$/);
        if (m) { const r = OBS.find(o => o.id === +m[1]); return json({ total_results: r ? 1 : 0, results: r ? [r] : [] }); }
        const d2 = u.searchParams.get('d2'); if (d2 && Date.now() - Date.parse(d2) > 300 * 864e5) { const y = Date.now() - Date.parse(d2) > 600 * 864e5 ? 1 : 0; return json({ total_results: HIST[y].length, results: HIST[y] }); }
        const page = +(u.searchParams.get('page') || 1), per = +(u.searchParams.get('per_page') || 200), above = +(u.searchParams.get('id_above') || 0);
        const tn = u.searchParams.get('taxon_name');
        const list = tn ? OBS.filter(o => o.taxon.name === tn || o.taxon.preferred_common_name === tn) : above ? OBS.filter(o => o.id > above).sort((a, b) => a.id - b.id) : OBS;
        return json({ total_results: list.length, page, per_page: per, results: list.slice((page - 1) * per, page * per) });
      }
      if (u.host === 's3.amazonaws.com' && u.pathname.includes('terrarium')) {
        const [z, x, y] = u.pathname.match(/terrarium\/(\d+)\/(\d+)\/(\d+)/).slice(1).map(Number);
        const k = 'd' + url; if (!cache.has(k)) cache.set(k, await demTile(z, x, y)); return ok(cache.get(k), 'image/png');
      }
      if (u.host === 'server.arcgisonline.com') {
        const [z, y, x] = u.pathname.match(/tile\/(\d+)\/(\d+)\/(\d+)/).slice(1).map(Number);
        const k = 's' + url; if (!cache.has(k)) cache.set(k, await satTile(z, x, y)); return ok(cache.get(k), 'image/jpeg');
      }
      if (u.host === 'inaturalist-open-data.s3.amazonaws.com' || (u.host === 'static.inaturalist.org' && u.pathname.startsWith('/photos'))) {
        const m = u.pathname.match(/photos\/(\d+)\/(\w+)\./); const size = { square: 75, small: 240, medium: 500, large: 1024 }[m[2]] || 240;
        const k = `p${m[1]}-${size}`; if (!cache.has(k)) cache.set(k, await photo(+m[1], size));
        const headers = { 'content-type': 'image/jpeg' }; if (u.host !== 'static.inaturalist.org') headers['access-control-allow-origin'] = '*';
        return route.fulfill({ status: 200, body: cache.get(k), headers });
      }
      if (u.host === 'static.inaturalist.org' && u.pathname.startsWith('/sounds')) return route.fulfill({ status: 200, body: Buffer.alloc(64), headers: { 'content-type': 'audio/mpeg' } });
      if (u.host.includes('overpass')) { if (!overpass) return route.abort(); return json(/waterway/.test(u.searchParams.get('data') || '') ? WATER : BIZ); }
      if (u.host === 'sheet.test') return ok(`title,start,venue,lat,lng,tags,link\n"Frog count, Merri Creek",${soon(4, 19.5)},Merri Creek,-37.7744,144.9839,nature free,https://example.org/frogs\nOutside the map,${soon(4, 19.5)},Somewhere,-38.5,145.5,free,\nLate set for the bats,${soon(5, 21)},Howler,-37.7690,144.9610,gig rrr,https://example.org/gig\n`, 'text/csv');
      unexpected.add(u.host + u.pathname.slice(0, 40)); return route.abort();
    } catch (e) { console.log('route error', url, e.message); return route.abort(); }
  });
}
/* a date a few days from now, at an hour, in Melbourne's summer time */
const soon = (days, hour) => { const d = new Date(Date.now() + days * 864e5); const ymd = d.toISOString().slice(0, 10); const h = Math.floor(hour), m = Math.round((hour - h) * 60); return `${ymd}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+11:00`; };
const errors = [];
const watch = (page, tag) => { page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(`[${tag}] ${m.text()}`); }); page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const check = (name, cond, info = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`);
const shot = async (page, file, opt = {}) => { try { await page.screenshot({ path: `${SHOTS}/${file}`, animations: 'disabled', timeout: 90000, ...opt }); } catch (e) { results.push(`WARN  screenshot ${file}: ${e.message.split('\n')[0]}`); } };
/* loaded, with NOW closed again (the site lands on NOW), so each check starts from the bare radar; keep: leave it open */
const ready = (page, extra = '', keep = false) => page.waitForFunction(new Function(`return !!(window.__da && window.__da.S.obs.length > 100 && window.__da.S.mapReady && window.__da.life.items.length > 100${extra})`), null, { timeout: 90000 })
  .then(() => page.evaluate(() => { const da = window.__da; if (!window.__noStart && !da.S.started) da.startRadio(false); }))
  .then(() => (keep ? null : page.evaluate(() => { const da = window.__da; if (da.S.open && !da.S.mode) da.setOpen(false); })));
const tap = async (page, sel, opt = {}) => { try { await page.click(sel, { timeout: 20000, ...opt }); } catch (e) { throw new Error(`click ${sel}: ${e.message.split('\n').find(l => /intercepts|Timeout|not/.test(l)) || e.message.split('\n')[0]}`); } };
const xy = (page, id) => page.evaluate(id => { const da = window.__da; const o = da.S.byId.get(id); if (!o) return null; const p = da.map.project([o.lng, o.lat]); const r = da.map.getContainer().getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; }, id);
const settle = page => page.evaluate(() => new Promise(res => { const m = window.__da.map; if (!m.isMoving()) { m.once('idle', res); m.triggerRepaint(); } else m.once('idle', res); setTimeout(res, 12000); }));
const face = page => page.evaluate(() => document.querySelector('#record').dataset.face);
const tab = (page, i) => tap(page, `#rail .tab[data-i="${i}"]`).then(() => page.waitForFunction(i => window.__da.S.view === i, i, { timeout: 8000 }));
const qrOf = async (page, sel) => {
  const svg = await page.evaluate(sel => document.querySelector(sel + ' svg').outerHTML.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="background:#fff" '), sel);
  const { data, info } = await sharp(Buffer.from(svg)).flatten({ background: '#ffffff' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const qr = jsQR(new Uint8ClampedArray(data), info.width, info.height); return qr ? qr.data : null;
};
const newCtx = (opts = {}) => browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', timezoneId: 'Australia/Melbourne', ...opts });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ORB = 284110000, FOX = 284110000 + 4 * 37;

// ───────── a scratch probe: ONLY=dbg DBG=file.js runs that file's body in the page and prints what it returns ─────────
if (ONLY.includes('dbg')) try {
  const ctx = await newCtx({ viewport: { width: +(process.env.W || 1440), height: +(process.env.H || 900) }, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference', ...(process.env.PHONE ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
  await wire(ctx, { tmax: +(process.env.TMAX || 33), night: +(process.env.NIGHT || 0), dark: !!process.env.DARK, front: !!process.env.FRONT, first: !!process.env.FIRST, journey: !!process.env.JOURNEY }); const page = await ctx.newPage(); watch(page, 'dbg');
  if (process.env.NOSTART || process.env.JOURNEY) await ctx.addInitScript(() => { window.__noStart = true; });
  await page.exposeFunction('__snap', (n, clip) => shot(page, n, clip ? { clip } : {}));
  if (process.env.AT) await page.clock.setFixedTime(new Date(process.env.AT));
  await page.goto('https://oan.test/studio' + (process.env.HASH || ''));
  /* ACT: a real click first, so the page may make sound (a browser allows none before a touch) */
  if (process.env.ACT) { await sleep(1500); await page.mouse.click(720, 450); }
  await ready(page); await sleep(+(process.env.WAIT || 1500));
  const out = process.env.DBG ? await page.evaluate(new Function(`return (async () => { ${fs.readFileSync(process.env.DBG, 'utf8')} })()`)) : null;
  console.log(JSON.stringify(out, null, 1));
  if (process.env.SHOT) await shot(page, process.env.SHOT);
  await ctx.close();
} catch (e) { results.push(`FAIL  section dbg: ${e.message.split('\n')[0]}`); }

// ───────── smoke: the bare radar, then the four destinations ─────────
if (run('smoke')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'smoke');
  await page.goto('https://oan.test/studio#stories'); await ready(page, '', true); await settle(page);
  const land = await page.evaluate(() => { const da = window.__da; const c = da.map.project([da.S.scan.lng, da.S.scan.lat]); const panel = document.querySelector('#panel').getBoundingClientRect(); return { open: da.S.open, view: da.S.view, five: document.querySelectorAll('#sec-five .hero-row').length, radarLeftOfPage: c.x < panel.left, hash: location.hash }; });
  check('the site lands on RADIO, the radar beside it, even from a link to another page', land.open && land.view === 0 && land.radarLeftOfPage && land.hash === '#radio', JSON.stringify(land));
  const adm = await page.evaluate(() => { const a = document.querySelector('.maplibregl-ctrl-attrib a.da-admin'); return a ? { href: a.getAttribute('href'), text: a.textContent, nextTo: !!(a.previousElementSibling && a.previousElementSibling.classList.contains('da-build')) } : null; });
  check('a small ADMIN link sits beside the build in the information corner', adm && adm.href === 'admin' && adm.text === 'ADMIN' && adm.nextTo, JSON.stringify(adm));
  await page.evaluate(() => window.__da.setOpen(false)); await page.waitForFunction(() => getComputedStyle(document.querySelector('#panel')).visibility === 'hidden', null, { timeout: 5000 }).catch(() => {});
  const a = await page.evaluate(() => { const da = window.__da; const vis = el => !!el && !el.hidden && el.getBoundingClientRect().width > 0; const panel = document.querySelector('#panel').getBoundingClientRect();
    return { shut: document.body.classList.contains('shut'), panelOff: panel.left >= innerWidth - 2, tabs: document.querySelectorAll('#rail .tab').length, knots: document.querySelectorAll('#rail .tab .knot').length, knob: vis(document.querySelector('#knob')), ring: vis(document.querySelector('#ring')), seen: da.life.seen().size, sweep: da.life.sweep, words: document.body.innerText.replace(/\s+/g, ' ').trim().split(' ').filter(w => /[a-z]{3,}/i.test(w)).length }; });
  check('closed, the page leaves only the radar, its two handles and four destinations, three on a thread', a.shut && a.panelOff && a.tabs === 4 && a.knots === 3 && a.knob && a.ring && a.words <= 12, JSON.stringify(a));
  await sleep(3500);
  const b = await page.evaluate(() => ({ seen: window.__da.life.seen().size, sweep: window.__da.life.sweep }));
  check('with the radio off the radar stands still', b.sweep === a.sweep, `${JSON.stringify(a)} → ${JSON.stringify(b)}`);
  await page.evaluate(() => { window.__blips = 0; const s = window.__da.snd; const o = s.ping; s.ping = (...a) => { const r = o.apply(s, a); if (r) window.__blips++; return r; }; });
  await page.keyboard.press('a'); await sleep(1800);
  const quiet = await page.evaluate(() => window.__blips);
  await page.evaluate(() => { window.__da.setOpen(true); window.__da.setView(0); }); await sleep(500); await page.click('#sec-heat [data-radio]'); await sleep(1500);
  /* a turn of the hand is eight seconds; a slow machine draws fewer frames, so the first sound is waited for, not timed */
  await page.waitForFunction(() => window.__blips >= 1, null, { timeout: 16000 }).catch(() => {});
  const bl = await page.evaluate(() => ({ blips: window.__blips, radio: window.__da.S.radio, sweep: window.__da.life.sweep, found: window.__da.life.items.filter(it => it.inS && window.__da.life.seen().has(it.o.id) && window.__da.life.shown(it) && !it.o.hist && it.b.tone !== 'cold').length }));
  check('nothing plays until the radio is turned on; on, the radar plays what it has found and goes on as it sweeps', quiet === 0 && bl.radio && bl.sweep !== b.sweep && bl.blips >= 1, JSON.stringify({ quiet, bl }));
  await page.evaluate(() => window.__da.setOpen(false)); await sleep(500);
  const v = await page.evaluate(async () => { const da = window.__da; da.life.reveal(); await new Promise(r => setTimeout(r, 300)); const its = da.life.items; const shown = its.filter(it => da.life.shown(it)); const out = shown.filter(it => !it.inS);
    const fresh = its.filter(it => !it.inS && it.flag && !it.capped).length; return { inside: shown.length - out.length, outside: out.length, fresh, signals: da.life.signals.length, red: da.life.signals.filter(x => x.red).length }; });
  check('every mark stands on the map, inside the radar or out: the radar plays, it does not reveal', v.outside > 20 && v.inside > 5 && v.signals === 0, JSON.stringify(v));
  const corner = await page.evaluate(() => (document.querySelector('.maplibregl-ctrl-attrib .da-build') || {}).textContent || '');
  check('the information corner carries the build', /^BUILD \w{7}/.test(corner), corner);
  const sp = await page.evaluate(() => { const da = window.__da; const its = da.life.items.filter(it => da.life.shown(it) && !it.binned && it.b.tone !== 'hist'); let raw = 0, drawn = 0;
    for (let i = 0; i < its.length; i++) for (let j = i + 1; j < its.length; j++) { const a = its[i], b = its[j]; const need = (a.b.d + b.b.d) / 2 * 0.7; const pa = da.map.project([a.lng, a.lat]), pb = da.map.project([b.lng, b.lat]); if (Math.hypot(pa.x - pb.x, pa.y - pb.y) < need) raw++; if (Math.hypot(a.x - b.x, a.y - b.y) < need) drawn++; }
    return { n: its.length, raw, drawn }; });
  check('marks are never drawn more crowded than they lie', sp.drawn <= sp.raw, JSON.stringify(sp));
  await sleep(300);
  const dk = await page.evaluate(() => { const da = window.__da; const cv = document.querySelector('canvas.life:not(.fx)'); const x = cv.getContext('2d'); const k = cv.width / cv.clientWidth; const c = da.map.project([da.S.scan.lng, da.S.scan.lat]); const e = da.map.project([da.S.scan.lng + da.S.scan.r / (111320 * Math.cos(da.S.scan.lat * Math.PI / 180)), da.S.scan.lat]); const R = e.x - c.x;
    const out = [], inn = []; for (let a = 0; a < 360; a += 10) for (const [f, arr] of [[1.45, out], [0.6, inn]]) { const px = c.x + Math.cos(a * Math.PI / 180) * R * f, py = c.y + Math.sin(a * Math.PI / 180) * R * f; if (px < 4 || py < 4 || px > cv.clientWidth - 4 || py > cv.clientHeight - 4) continue; if (da.life.items.some(it => da.life.shown(it) && Math.hypot(it.x - px, it.y - py) < 40)) continue; arr.push(x.getImageData(Math.round(px * k), Math.round(py * k), 1, 1).data[3]); }
    out.sort((a, b) => a - b); return { n: out.length, outMax: out[out.length - 1], inMin: Math.min(...inn) }; });
  check('nothing outside the radar is darkened', dk.n > 6 && dk.outMax === 0 && dk.inMin > 0, JSON.stringify(dk));
  const sz = await page.evaluate(async () => { const da = window.__da; const pick = () => da.life.items.find(it => !it.hero && /^k-/.test(it.b.tone)).b.d; da.map.jumpTo({ zoom: 13 }); await new Promise(r => setTimeout(r, 500)); const far = pick(); da.map.jumpTo({ zoom: 15.6 }); await new Promise(r => setTimeout(r, 500)); const near = pick(); da.map.jumpTo({ zoom: 14.6 }); return { far, near }; });
  check('icons are half size from afar, full size close in', sz.far <= sz.near * 0.6, JSON.stringify(sz));
  await settle(page); await shot(page, '01-radar.png');
  await tab(page, 0); await sleep(600);
  const now = await page.evaluate(() => { const band = document.querySelector('#sec-heat'); const order = [...band.children].filter(e => !/^(mod-|flip-b|hack)/.test(e.className)).map(e => e.className.split(' ')[0]); return { open: !document.body.classList.contains('shut'), five: document.querySelectorAll('#sec-five .hero-row').length, months: document.querySelectorAll('#sec-heat .mo').length, order, steps: [...band.querySelectorAll('.st, .sn')].filter(e => !e.closest('.steps')).length, heads: band.querySelectorAll('h3, .lab').length, counts: band.querySelectorAll('.lyr .n').length, tags: document.querySelectorAll('#view .lab, #view .chips, #view .dg, #view .pill, #view .gigs').length }; });
  check('RADIO, top to bottom: the printers’ pager and its VU meter, El Niño’s countdown (the steps on its screen), the equaliser on its own, play between loop and link, the layers; no headline, numbers, headings or tags', now.open && now.five === 0 && now.months === 12 && now.order.join() === 'pager,vu,b-emerg,mstrip,hp-row,lyrs' && now.steps === 0 && now.heads === 0 && now.counts === 0 && now.tags === 0, JSON.stringify(now));
  const nw = await page.evaluate(() => { const band = document.querySelector('#sec-heat'); const five = document.querySelector('#sec-five'); const rows = five ? [...five.querySelectorAll('.hero-row')] : [];
    return { five: rows.length, why: five ? five.dataset.tip : '', names: rows.map(r => (r.querySelector('.nm b') || {}).textContent), chips: rows.some(r => r.querySelector('.chips')), pics: rows.filter(r => r.querySelector('.h-pic img, .h-pic canvas')).length, words: band.innerText }; });
  const eq = await page.evaluate(async () => { const cols = [...document.querySelectorAll('#sec-heat .mo')]; const lit = cols.map(c => c.querySelectorAll('.eq-c i.l:not(.up)').length); const none = !document.querySelector('.eq-read');
    cols[3].click(); await new Promise(r => setTimeout(r, 400)); const rd = document.querySelector('.eq-read');
    const out = { cols: cols.length, segs: cols[0].querySelectorAll('.eq-c i:not(.up):not(.eq-cap)').length, lit, none, read: rd ? rd.innerText : '', hud: !!rd && rd.classList.contains('eq-hud'), rows: rd ? rd.querySelectorAll('.hud-d dt').length : 0, life: rd ? rd.querySelectorAll('.hud-life svg').length : 0, jelly: !!(rd && rd.querySelector('.hud-spec svg')) };
    const mo = i => document.querySelectorAll('#sec-heat .mo')[i]; mo(4).click(); await new Promise(r => setTimeout(r, 400)); out.next = (document.querySelector('.eq-read') || {}).innerText || ''; mo(4).click(); await new Promise(r => setTimeout(r, 300)); mo(3).click(); await new Promise(r => setTimeout(r, 300));
    document.querySelectorAll('#sec-heat .mo')[3].click(); await new Promise(r => setTimeout(r, 300)); out.closed = !document.querySelector('.eq-read'); return out; });
  check('the outlook is an equaliser; pressed, a month reads as a data screen: its level, the source, Niño 3.4, the odds of heat and rain, the window and the lives in it, the jellyfish behind; no sentences; the next month the same', eq.cols === 12 && eq.segs === 11 && Math.max(...eq.lit) === 11 && Math.min(...eq.lit) >= 1 && eq.none && eq.hud && /JAN 2027/.test(eq.read) && /EXTREME/.test(eq.read) && /NIÑO3\.4/.test(eq.read) && eq.rows === 9 && eq.life >= 3 && eq.jelly && !/[a-z]{3,} [a-z]{3,} [a-z]{3,}/.test(eq.read) && /FEB 2027/.test(eq.next) && eq.closed, JSON.stringify(eq));
  const fv = await page.evaluate(() => { const da = window.__da; return da.life.items.filter(it => it.hero && da.life.shown(it)).length; });
  check('the five in greatest need stand on the map, not in a list', nw.five === 0 && fv === 5, JSON.stringify({ five: nw.five, fv }));
  check('no watch chip, no stage names in the outlook', !/WATCH|EARLY HEAT|DRY FLOWERING|HOT NIGHTS|DROUGHT/.test(nw.words), nw.words.replace(/\s+/g, ' '));
  const hd = await page.evaluate(async () => { const ids = [...document.querySelectorAll('#view > section')].map(x => x.id).filter(Boolean); const d4 = [...document.querySelectorAll('#sec-heat .mo.d4 .eq-c i.l')]; const band = document.querySelector('#sec-heat'); const quiet = [...band.querySelectorAll('.cd, .hp-k small')].map(e => [e, e.textContent]); quiet.forEach(([e]) => { e.textContent = ''; }); const bare = band.innerText; quiet.forEach(([e, t]) => { e.textContent = t; }); const clues = ''; const cd = document.querySelector('#sec-heat .b-emerg .cd');
    const cdx = () => (document.querySelector('#sec-heat .b-emerg .cd') || {}).textContent || ''; for (let i = 0; i < 12 && !/D \d/.test(cdx()); i++) await new Promise(r => setTimeout(r, 500)); const c0 = cdx(); let c1 = c0; for (let i = 0; i < 20 && c1 === c0; i++) { await new Promise(r => setTimeout(r, 250)); c1 = cdx(); }
    return { words: bare.replace((document.querySelector('#sec-heat .pager') || {}).innerText || '\u0000', '').replace(/[\d:]+D?|NOW/g, '').replace(/\b[JFMASOND]\b/g, '').trim(), sun: !!document.querySelector('#sec-heat .b-emerg .sun use[href="#g-heat"]'), orange: getComputedStyle(document.querySelector('#sec-heat .b-emerg .cd')).color, c0, c1, tip: (document.querySelector('#sec-heat .b-emerg') || {}).dataset ? document.querySelector('#sec-heat .b-emerg').dataset.tip : '',
      ids, d4: d4.length, d4bg: [...new Set(d4.map(i => getComputedStyle(i).backgroundColor))], yr: [...document.querySelectorAll('#sec-heat .mo')].map(m => [...m.querySelectorAll('.eq-c i.l')].map(i => getComputedStyle(i).backgroundColor.match(/\d+/g).map(Number)).filter(([r, g, b]) => r >= 180 && r > g + 40 && r > b + 40).length), up: Math.min(...[...document.querySelectorAll('#sec-heat .mo.d4')].map(m => +m.dataset.lit)) - Math.max(...[...document.querySelectorAll('#sec-heat .mo:not(.d4)')].map(m => +m.dataset.lit)), segs: [...new Set([...document.querySelectorAll('#sec-heat .mo .eq-c')].map(c => c.querySelectorAll('i:not(.eq-cap)').length))], box: [...document.querySelectorAll('#sec-heat .mo .eq-c')].every(c => { const r = c.getBoundingClientRect(); return [...c.children].every(i => { const q = i.getBoundingClientRect(); return !q.height || (q.top >= r.top - 1 && q.bottom <= r.bottom + 1); }); }), tel: document.querySelectorAll('#view a[href^="tel:"]').length, stations: !!document.querySelector('#sec-tracks, .tk-lvl') }; });
  check('no words on the radio but the steps and the names under loop and link: the countdown and the months are marks and numbers', hd.words === '', JSON.stringify({ words: hd.words }));
  check('El Niño’s emergency counting down in orange, alone, without a sun, ticking, the step waiting between; its name on a long hover', !hd.sun && hd.orange !== 'rgb(237, 237, 237)' && /^\d+D \d\d:\d\d:\d\d$/.test(hd.c0) && hd.c0 !== hd.c1 && hd.tip === 'El Niño emergency in', JSON.stringify({ c0: hd.c0, c1: hd.c1, tip: hd.tip }));
  check('one box: every month the same column, none above it; extreme months lit red and higher than the rest; every month of the year in colour, none blank', hd.d4 >= 1 && hd.d4bg.every(c => { const [r, g] = c.match(/\d+/g).map(Number); return r >= 140 && g < 90; }) && hd.up >= 1 && hd.segs.length === 1 && hd.box && hd.yr.length >= 12 && hd.yr.every(n => n >= 3), JSON.stringify({ d4bg: hd.d4bg, up: hd.up, segs: hd.segs, box: hd.box, yr: hd.yr }));
  const wt = await page.evaluate(() => { const t = Object.values(JSON.parse(localStorage.getItem('da.water.v1') || '{}')); const r = t.flatMap(x => x.rivers || []); return { tiles: t.length, widths: r.length ? r[0][1].map(p => p[2]) : [], pools: t.reduce((n, x) => n + (x.pools || []).length, 0) }; });
  check('the water as it is: a river along its own course, as wide as its banks are apart (120 m), a pond as its shape', wt.tiles >= 1 && wt.widths.length >= 4 && wt.widths.every(w => w >= 100 && w <= 135) && wt.pools >= 1, JSON.stringify(wt));
  check('no stations panel, no numbers to ring, nothing under the radio', !hd.stations && hd.tel === 0 && hd.ids.join() === 'sec-heat', JSON.stringify(hd.ids));
  /* the layers: four live data layers to mix, every one on; each with its meter, what it holds, and its level */
  const tk = await page.evaluate(() => { const ks = [...document.querySelectorAll('#sec-heat [data-t4]')]; return { keys: ks.map(k => k.dataset.t4), words: ks.map(k => k.getAttribute('aria-label') + (k.innerText.trim() ? '!' : '')), on: ks.map(k => k.getAttribute('aria-pressed')), meters: document.querySelectorAll('#sec-heat .lyr .lv').length, counts: document.querySelectorAll('#sec-heat .lyr .n').length, vols: document.querySelectorAll('#sec-heat .lyr [data-vol]').length, mood: document.querySelectorAll('#sec-heat [data-lmood]').length, radio: !!document.querySelector('#sec-heat .hero-play[data-radio]') }; });
  check('the layers, LIFE, COMMUNITY, WATER, POLLUTION, as marks with no words: each its key, its mood, its meter and a simple volume; no numbers; every one on; the play button above', tk.keys.join() === 'life,community,water,pollution' && tk.words.join() === 'LIFE,COMMUNITY,WATER,POLLUTION' && tk.on.join() === 'true,true,true,true' && tk.meters === 4 && tk.counts === 0 && tk.vols === 4 && tk.mood === 4 && tk.radio, JSON.stringify(tk));
  const lives = () => page.evaluate(() => { const da = window.__da; da.life.reveal(); return da.life.items.filter(it => da.life.shown(it) && !it.o.story && !it.o.pack && !it.o.partner).length; });
  await page.evaluate(() => { window.__knots = []; const s = window.__da.snd; const o = s.ping; s.ping = (spec, ...a) => { window.__knots.push(spec); return o.call(s, spec, ...a); }; }); await sleep(6000);
  const ta = await page.evaluate(() => ({ n: window.__knots.length, lives: window.__knots.some(k => k.g) }));
  await page.click('#sec-heat [data-t4="life"]'); await sleep(300);
  const mu = await page.evaluate(() => ({ on: document.querySelector('#sec-heat [data-t4="life"]').getAttribute('aria-pressed'), kept: JSON.parse(localStorage.getItem('da.prefs')).mute }));
  const l0 = await lives();
  await admin('settings', { lifeLock: false }); await page.evaluate(() => window.__da.loadSettings()); await sleep(500);
  await page.click('#sec-heat [data-t4="life"]'); await sleep(300); const l1 = await lives(); await page.click('#sec-heat [data-t4="life"]'); await sleep(300); const l2 = await lives(); await page.click('#sec-heat [data-t4="life"]'); await sleep(300); const l3 = await lives();
  await admin('settings', { lifeLock: true }); await page.evaluate(() => window.__da.loadSettings()); await sleep(300);
  check('LIFE on air with the radio; off, it is muted and kept so, still on the map until unlocked on the approval page', ta.lives && ta.n >= 1 && mu.on === 'false' && mu.kept === true && l0 > 5 && l1 === l0 && l2 === 0 && l3 === l0, JSON.stringify({ ta, mu, l0, l1, l2, l3 }));
  await page.evaluate(() => { window.__da.setTrack4('community', false); window.__da.setTrack4('pollution', false); }); await sleep(200);
  await page.click('#sec-heat [data-t4="community"]'); await page.keyboard.press('4'); await page.evaluate(() => window.__da.setOpen(false)); await sleep(900);
  let pl; for (let i = 0; i < 6; i++) { pl = await page.evaluate(() => { const da = window.__da; const m = da.map.getContainer().getBoundingClientRect(); let n = 0; for (let x = 0; x < m.width; x += 6) for (let y = 0; y < m.height; y += 6) { const h = da.life.hit(x, y, true); if (h && h.kind === 'place') { n++; if (n > 3) break; } } return { n, kept: JSON.parse(localStorage.getItem('da.prefs')).t4 }; }); if (pl.n > 3) break; await sleep(500); }
  check('COMMUNITY by its key and POLLUTION by 4 on a keyboard bring the places onto the map, kept', pl.n > 3 && pl.kept.community === true && pl.kept.pollution === true, JSON.stringify(pl));
  const split = await page.evaluate(() => { const da = window.__da; da.setTrack4('pollution', false); return { t4: { ...da.T4 } }; });
  await page.evaluate(() => { window.__da.setOpen(true); window.__da.setView(0); }); await sleep(600);
  const cm0 = await page.evaluate(() => (document.querySelector('#sec-heat [data-lmood="community"]').getAttribute('aria-label').split(': ')[1] || '').toLowerCase());
  await page.click('#sec-heat [data-lmood="community"]'); await sleep(200);
  /* the hand turns once in eight seconds at one speed (stage C), so a whole turn is waited for, and a half more */
  await page.evaluate(() => { window.__knots = []; }); await page.waitForFunction(() => window.__knots.filter(k => k.fam).length >= 2, null, { timeout: 12000 }).catch(() => {});
  const tb = await page.evaluate(m0 => ({ n: window.__knots.filter(k => k.fam).length, m0, mood: (JSON.parse(localStorage.getItem('da.prefs')).lm || {}).community }), cm0);
  await page.click('#sec-heat [data-t4="community"]'); await sleep(400);
  const t0 = await page.evaluate(() => { const n = window.__knots.filter(k => k.fam).length; return new Promise(r => setTimeout(() => r({ still: window.__knots.filter(k => k.fam).length === n, on: !!window.__da.TRK.on.places }), 900)); });
  check('with COMMUNITY on, the sweep sounds each place it passes in its own small sound, in its own mood, and stops when off', !!tb.mood && tb.mood !== tb.m0 && tb.n >= 2 && t0.still && !t0.on && split.t4.pollution === false, JSON.stringify({ tb, t0, split }));
  const mo = await page.evaluate(() => { const was = window.__da.S.mo; document.querySelectorAll('#sec-heat .mo')[4].click(); return [was, window.__da.S.mo]; });
  check('a month on the strip moves the outlook', mo[1] === 4 && mo[0] !== 4, JSON.stringify(mo));
  /* time on the radar is kept for later: no play on the strip, and a turn leaves the outlook where it is */
  const tm = await page.evaluate(() => { const da = window.__da; const k0 = da.S.mo; da.turned(); return { k0, k1: da.S.mo, play: !!document.querySelector('#sec-heat [data-time]') }; });
  check('El Niño time is held back for now: no play, and a turn of the radar leaves the months as they are', tm.k1 === tm.k0 && !tm.play, JSON.stringify(tm));
  /* the dials alone are not a connection: the clue waits; a string tied is, and START follows */
  const cl0 = await page.evaluate(() => { const da = window.__da; da.setOpen(true); da.setView(0); return (() => { try { return JSON.parse(document.querySelector('#sec-heat .cd').dataset.st); } catch (e) { return {}; } })().w; });
  await page.evaluate(() => { const da = window.__da; da.markConnect(); da.setView(0); }); await sleep(400);
  check('turning the dials is not a connection; a string tied is, and then start', cl0 === 'make a connection' && await page.evaluate(() => { const s = (() => { try { return JSON.parse(document.querySelector('#sec-heat .cd').dataset.st); } catch (e) { return {}; } })(); return s.w === 'start' && s.now === 2 && s.share; }), cl0);
  const story = await page.evaluate(() => !!document.querySelector('#sec-heat [data-share-mix]'));
  await page.click('#sec-heat [data-share-mix]'); await sleep(900); const arc = 'START STORY';
  await page.waitForFunction(() => window.__da.S.view === 1 && !document.querySelector('#board').hidden && window.fabric, null, { timeout: 15000 }); await sleep(800);
  const mx = await page.evaluate(() => { const da = window.__da; const m = da.MIXES[0]; const kept = da.boardJSON(); return { view: da.S.view, radio: da.S.radio, v: m && m.v, where: m && !!m.where.place, layers: m && Object.keys(m.layers).join(), cells: m && Object.values(m.layers).every(L => Array.isArray(L.cells) && L.mood), life: m && m.layers.life.cells.length, sigs: document.querySelectorAll('#sec-book .g-sig').length, board: !document.querySelector('#board').hidden, cards: (kept.objects || []).filter(o => o.daKind === 'mix').length, kept: JSON.parse(localStorage.getItem('da.mixes.v1') || '[]').length }; });
  const md = await page.evaluate(() => window.__da.bookMD()); await page.click('#sec-book [data-mix]'); await sleep(500);
  const mp = await page.evaluate(() => ({ radio: window.__da.S.radio, view: window.__da.S.view }));
  check('START A SIGNAL, once a song is made, calls START STORY; the radio plays on and the whole mix lies on the active board in the WISH MAKER, under that board on the page; played again from there on RADIO', story && arc === 'START STORY' && mx.view === 1 && mx.radio && mx.v === 2 && mx.where && mx.layers === 'life,community,water,pollution' && mx.cells && mx.life > 0 && mx.sigs === 1 && mx.board && mx.cards === 1 && mx.kept === 1 && mp.radio && mp.view === 0, JSON.stringify({ mx, mp }));
  check('the field notes download as Markdown, each signal with its layers and cells', /^# Field book/.test(md) && /### LIFE/.test(md) && /### WATER/.test(md) && /partial \d+/.test(md), md.slice(0, 300));
  /* the board: a note joined to the signal, and let go again with one click on the string */
  await page.evaluate(() => { const da = window.__da; da.setRadio(false); da.setView(1); }); await sleep(900);
  const bd0 = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const bt = k => document.querySelector(`#board [data-bt="${k}"]`).click();
    const tools = [...document.querySelectorAll('#board [data-bt]')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.getAttribute('aria-label') + (b.textContent.trim() ? '!' : '')); bt('note'); await wait(300); const note = da.boardJSON(); bt('save'); await wait(200);
    const n = da.MIXES[0]; da.placeMix(n); await wait(300); bt('link'); await wait(100);
    const c = document.querySelector('#board-c'); const objs = window.__da.boardObjects(); const a = objs.find(o => o.daKind === 'mix'), b = objs.find(o => o.daKind === 'note');
    const ab = o => o.daKind === 'link' && ((o.daFrom === a.daId && o.daTo === b.daId) || (o.daFrom === b.daId && o.daTo === a.daId));
    window.__da.boardLink(a, b); bt('save'); await wait(300); const joined = da.boardJSON().objects.filter(ab).length;
    window.__da.boardLink(a, b); bt('save'); await wait(300); const gone = da.boardJSON().objects.filter(ab).length;
    return { tools: tools.join(), joined, let: gone, label: document.querySelector('#board-label').textContent }; });
  check('WISH MAKER board: keys as marks, their names on a long hover; the W.I.S.H. template, ZOOM and LOCK first after ADD; a note joined to a signal, and let go', bd0.tools === 'ADD,W.I.S.H.,ZOOM,LOCK,NOTE,SECT,LINK,PENCIL,IMG,UNDO,DEL,OUT,SAVE' && bd0.joined === 1 && bd0.let === 0 && /MODEL DA-03/.test(bd0.label), JSON.stringify(bd0));
  /* the W.I.S.H., written on the page and sent as a story waiting to print */
  const wf = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); for (const [k, v] of [['for', 'Bogong moths'], ['w', 'Moths fell 99.5% in three years'], ['i', 'Dark streets after ten'], ['s', 'Dark is a habitat'], ['h', 'Shopfronts off at close']]) { const el = document.querySelector('#wf-' + k); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
    const btn = document.querySelector('#wish-form .make-b').getAttribute('aria-label') + (document.querySelector('#wish-form .make-b').textContent.trim() ? '!' : ''); document.querySelector('#wish-form .make-b').click(); await wait(2500);
    const da = window.__da; await wait(800); return { btn, view: da.S.view, head: (document.querySelector('#sec-slips') || { dataset: {} }).dataset.tip, waiting: document.querySelectorAll('#sec-slips .slip-row').length, base: window.__da.zineObjects().some(o => o.daKind === 'base'), fmt: da.PRESS.fmt }; });
  check('the W.I.S.H. form, made, not sent; in the PRINT SHOP the story waits to print, set on an 80 mm receipt to draw on', wf.btn === 'Make the W.I.S.H.!' && wf.view === 2 && wf.head === 'Stories waiting to print' && wf.waiting === 1 && wf.base && wf.fmt === 'r80', JSON.stringify(wf));
  const zn = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const b0 = (window.__da.zineObjects().find(o => o.daKind === 'base') || {}).daStory; const sb = Object.assign(document.createElement('button'), { type: 'button' }); sb.dataset.style = 'conn'; document.querySelector('#view').appendChild(sb); sb.click(); await wait(1800); const b1 = (window.__da.zineObjects().find(o => o.daKind === 'base') || {}).daStory;
    document.querySelector('#view [data-pick="strip"]').click(); await wait(400); document.querySelector('#pick [data-pk-tab="stick"]').click(); await wait(300); document.querySelector('#pick [data-pk-pack="life"]').click(); await wait(500); const stk = document.querySelectorAll('#pick [data-pk-k="stk"]').length; document.querySelector('#pick [data-pk-k="stk"]').click(); await wait(900); document.querySelector('#pick [data-pk-x]').click(); document.querySelector('#zine-words').value = 'nature gets half';
    for (const k of ['head', 'cut', 'tape', 'text']) { document.querySelector(`#zine [data-zt="${k}"]`).click(); await wait(250); }
    await wait(400); const kept = JSON.parse(localStorage.getItem('da.press.r80') || '{}'); return { changed: b0 !== b1 && /true$/.test(b1 || ''), stk, map: getComputedStyle(document.querySelector('#cover')).display, kinds: [...new Set(((kept.json || {}).objects || []).map(o => o.daKind))].sort().join() }; });
  check('a style pressed sets the receipt again at once; every sticker in the ink chosen, a headline, cut-out letters, tape, typewritten words on the strip itself; the map covered', zn.changed && zn.stk >= 50 && zn.map === 'block' && zn.kinds === 'base,cut,head,sticker,tape,text', JSON.stringify(zn));
  /* what was made here, as pieces: the W.I.S.H. sent onto the WISH MAKER board, undone; onto the PRINT SHOP page, stamped */
  const pcs = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    out.shopPieces = 1; document.querySelector('#zine-words').value = 'received'; document.querySelector('#zine [data-zt="stamp"]').click(); await wait(600);
    out.page = [...new Set(JSON.parse(localStorage.getItem('da.press.r80')).json.objects.map(o => o.daKind).filter(k => k === 'base' || k === 'stamp'))].sort().join();
    da.setView(1); await wait(900); out.assets = document.querySelectorAll('#sec-assets [data-asset="s"]').length;
    const n0 = da.boardJSON().objects.length; document.querySelector('#view [data-pick="wish"]').click(); await wait(500); document.querySelector('#pick [data-pk-k="S"]').click(); await wait(500); for (let i = 0; i < 22 && da.boardJSON().objects.length === n0; i++) await wait(250); document.querySelector('#pick [data-pk-x]').click(); const n1 = da.boardJSON().objects.length;
    document.querySelector('#board [data-bt="undo"]').click(); await wait(500); out.board = [n0, n1, da.boardJSON().objects.length]; return out; });
  check('what was made here is a piece: the W.I.S.H. sent is the receipt, stamped by hand, and onto the WISH MAKER board, where UNDO takes it back', pcs.shopPieces >= 1 && pcs.page === 'base,stamp' && pcs.board[1] === pcs.board[0] + 1 && pcs.board[2] === pcs.board[0], JSON.stringify(pcs));
  const ck = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); da.setView(2); await wait(900); document.querySelector('#view [data-pout="poster"]').click(); await wait(1500); da.setView(0); await wait(700); const s = (() => { try { return JSON.parse(document.querySelector('#sec-heat .cd').dataset.st); } catch (e) { return {}; } })(); return { st: s, posters: da.POSTERS2.length, go: (document.querySelector('#sec-heat .cd') || { dataset: {} }).dataset.goView }; });
  check('once a signal is started, the countdown’s screen shows the checklist’s step waiting, make · print, and pressed goes there', ck.st.now === 2 && ck.st.n === 3 && ck.st.w === 'make · print' && ck.go === '2' && ck.posters === 1, JSON.stringify(ck));
  await page.evaluate(() => { const da = window.__da; da.setView(0); }); await sleep(500);
  const back = await page.evaluate(() => ({ cover: getComputedStyle(document.querySelector('#cover')).display, zine: document.querySelector('#zine').hidden, board: document.querySelector('#board').hidden }));
  check('only RADIO shows the ground', back.cover === 'none' && back.zine && back.board, JSON.stringify(back));
  await page.evaluate(() => window.__da.setRadio(false));
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setOpen(true); window.__da.setView(0); }); await sleep(500);
  await shot(page, '02-radio.png');
  /* SIGNALS: nothing made yet, the way back to the radar; the groups */
  await tab(page, 1); await sleep(600);
  const sg = await page.evaluate(() => ({ first: (document.querySelector('#view > section') || {}).id, pages: document.querySelectorAll('#sec-book .bgroup.on .g-sig').length, md: !!document.querySelector('#sec-book [data-book-md]'), board: !document.querySelector('#board').hidden, hash: location.hash }));
  check('W.I.S.H.: the handheld first, then the boards, the active one with its signal; the field notes to download; the board beside it', sg.first === 'sec-wish' && sg.pages === 1 && sg.md && sg.board && sg.hash === '#wish', JSON.stringify(sg));
  /* PRINT SHOP: no readings row (the style stays as set elsewhere), novel.global's printer alone, a blank slip */
  await tab(page, 2); await sleep(600);
  const sn = await page.evaluate(() => ({ styles: document.querySelectorAll('#view [data-style]').length, prn: document.querySelectorAll('.ps-printer').length, cafes: /Pickles|Kines|Elsie/.test(document.querySelector('#view').innerHTML), blank: !!document.querySelector('#view [data-doc="blank"]'), head: (document.querySelector('.ps-hl b') || {}).textContent, hidden: !!(document.querySelector('#ps-info') || {}).hidden, main: (() => { const k = document.querySelector('#sec-out .print-k'); return k ? { text: k.textContent.trim(), icon: !!k.querySelector('svg use[href="#g-epson"]'), on: k.classList.contains('on') } : null; })() }));
  check('PRINT: no readings row; novel.global’s printer alone at its head, named only when it is pressed; no print key on the studio side, the printers listed instead; the blank slip gone to the portfolio', sn.styles === 0 && sn.prn === 1 && !sn.cafes && !sn.blank && /NOVEL/.test(sn.head || '') && sn.hidden && !sn.main, JSON.stringify(sn));
  /* PORTFOLIO: the board, eight as cards, the rest as a list; the briefs, the tools */
  await tab(page, 3); await sleep(600);
  const st = await page.evaluate(() => { const cards = [...document.querySelectorAll('#sec-board .sig-row')], lines = [...document.querySelectorAll('#sec-board .sig-line')]; return { cards: cards.length, lines: lines.length, ex: [...cards, ...lines].filter(r => r.classList.contains('ex')).length, codes: [...cards, ...lines].map(r => r.querySelector('.code').textContent), art: [...cards, ...lines].every(r => r.querySelector('.art')), docs: document.querySelectorAll('#sec-tools [data-doc]').length, briefsShut: !document.querySelector('#sec-briefs').open, votes: document.querySelectorAll('.vote, [data-vote]').length, signup: /sign[- ]up/i.test(document.querySelector('#view').innerText) }; });
  check('PORTFOLIO: the W.I.S.H. sent here, and the orangutan, marked EX, each a card with its picture; the tools; no votes, no sign-up', st.cards === 2 && st.lines === 0 && st.ex === 1 && st.codes[1] === 'DA-0RNG' && st.art && st.docs === 5 && st.briefsShut && !st.votes && !st.signup, JSON.stringify(st));
  const tabc = await page.evaluate(() => [...document.querySelectorAll('#rail .tab')].map(t => { const b = t.getBoundingClientRect(), i = t.querySelector('svg').getBoundingClientRect(); return Math.round(Math.abs((i.left + i.width / 2) - (b.left + b.width / 2)) + Math.abs((i.top + i.height / 2) - (b.top + b.height / 2))); }));
  check('the tab icons sit at their centres', tabc.every(d => d <= 1), JSON.stringify(tabc));
  const order = await page.evaluate(() => [...document.querySelectorAll('#view > .sec, #view > details.sec')].map(x => x.id));
  check('the printer itself, from above, heads the portfolio, then the quick print, then the stories (the W.I.S.H.es finished here among them); the settings and sources at its foot; the posters on the wall beside it', order[0] === 'sec-printer' && order[1] === 'sec-quick' && order[2] === 'sec-board' && !order.includes('sec-wishes') && order.includes('sec-board') && order.indexOf('sec-board') < order.indexOf('sec-set') && order.includes('sec-set') && order.indexOf('sec-set') > order.indexOf('sec-tools'), order.join(' '));
  await shot(page, '03-portfolio.png');
  /* the day's thread: a life looked at ties the first knot */
  const th0 = await page.evaluate(() => document.querySelectorAll('#rail .tab.tied').length);
  await page.evaluate(() => { const da = window.__da; da.select(da.S.obs.find(o => o.tx).id); }); await sleep(600);
  const th1 = await page.evaluate(() => ({ tied: [...document.querySelectorAll('#rail .tab')].map(t => t.classList.contains('tied')), kept: !!JSON.parse(localStorage.getItem('da.day.v1'))[0], tp: document.querySelector('#rail').style.getPropertyValue('--tp') }));
  check('starting and sending the signal tied the second knot; noticing a life ties the first; kept for the day', th0 === 1 && th1.tied.join() === 'true,true,false,false' && th1.kept && th1.tp === '46px', JSON.stringify({ th0, th1 }));
  await page.evaluate(() => window.__da.closeRecord()); await sleep(300);
  await page.evaluate(() => { window.__da.setOpen(true); window.__da.setView(3); }); await sleep(400);
  await tap(page, '#rail .tab[data-i="3"]'); await sleep(500);
  check('the same tab closes the page again', await page.evaluate(() => document.body.classList.contains('shut')));
  /* novel.global: the name, the muse, the radio playing on; the press's keys, packs and faces; a poster as a cards; the board out */
  const ng = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    da.setOpen(true); da.setView(0); await wait(400); out.title = document.title; out.lockup = (document.querySelector('.lockup .lk-n') || {}).textContent; out.muse = !!document.querySelector('.lockup svg circle');
    out.icon = document.querySelector('#rail .tab[data-i="0"] use').getAttribute('href'); da.setRadio(true); da.setView(1); await wait(600); out.playsOn = da.S.radio;
    da.setView(2); await wait(1500); out.styles = document.querySelectorAll('#view [data-style]').length; out.packs = (() => { document.querySelector('#view [data-pick="strip"]').click(); document.querySelector('#pick [data-pk-tab="stick"]').click(); const n = document.querySelectorAll('#pick [data-pk-pack]').length; document.querySelector('#pick [data-pk-x]').click(); return n; })(); out.z = da.PRESS.z;
    const zt = k => document.querySelector(`#zine [data-zt="${k}"]`).click(); const nt = () => da.zineObjects().filter(o => o.daKind === 'text').length; const t0 = nt(); zt('text'); await wait(700); const f0 = (da.zineObjects().filter(o => o.daKind === 'text').pop() || {}).fontFamily; zt('text'); await wait(900); const f1 = (da.zineObjects().filter(o => o.daKind === 'text').pop() || {}).fontFamily;
    out.faces = [f0, f1]; out.texts = nt() - t0;
    zt('tape'); await wait(400); zt('tape'); await wait(900); const tp = da.zineObjects().filter(o => o.daKind === 'tape'); out.tape = (tp[tp.length - 1] || {}).type; zt('rag'); await wait(900); out.rag = da.zineObjects().some(o => o.daKind === 'rag');
    document.querySelector('#view [data-pick="strip"]').click(); await wait(400); document.querySelector('#pick [data-pk-tab="stick"]').click(); await wait(300); document.querySelector('#pick [data-pk-pack="goth"]').click(); await wait(400); out.goth = document.querySelectorAll('#pick [data-pk-k="stk"]').length; document.querySelector('#pick [data-pk-x]').click();
    const p = await da.savePoster(); da.setView(0); da.setOpen(false); da.map.jumpTo({ center: [p.lng, p.lat] }); da.life.redraw(); await wait(2500); const h = (() => { const q = da.POSTERS2.find(x => x.id === p.id)._hit; return q ? da.life.hit(q.x, q.y) : null; })(); out.hit = h && h.kind;
    await da.openPosterCard(p.id); await wait(400); out.card = !!document.querySelector('.card-view canvas.tv-card'); document.querySelector('.card-view [data-tv="x"]').click();
    da.setView(1); await wait(800); const pdf = await da.boardOut('pdf'); out.pdf = pdf ? await pdf.slice(0, 5).text() : null; return out; });
  check('novel.global: the name, the muse at the head of RADIO and on its tab; the radio plays on under the WISH MAKER', ng.title === 'novel.global' && ng.lockup === 'novel.global' && ng.muse && ng.icon === '#g-jelly' && ng.playsOn, JSON.stringify(ng));
  check('the PRINT SHOP: no readings row, the receipt larger than it prints, words again for another face, tape again for bandana, a bandana, eleven packs', ng.styles === 0 && ng.z > 1 && ng.faces[0] !== ng.faces[1] && ng.texts === 1 && ng.tape === 'image' && ng.rag && ng.packs === 11 && ng.goth > 10, JSON.stringify(ng));
  check('a poster on the map is a card that turns over; the board leaves as a PDF', ng.hit === 'poster' && ng.card && ng.pdf === '%PDF-', JSON.stringify(ng));
  /* the board's OUT key on the studio side: its menu is its own, so PNG takes the board away and SELECT stays shut */
  await page.evaluate(() => { window.__da.setOpen(true); window.__da.setView(1); }); await sleep(800);
  const [outPNG] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }).then(d => d.suggestedFilename(), () => ''), tap(page, '#board [data-bt="out"]').then(() => tap(page, '.pick [data-menu="0"]'))]); await sleep(400);
  const outSel = await page.evaluate(() => !!document.querySelector('#pick:not([hidden])'));
  check('the board’s OUT key: PNG downloads the board, and SELECT stays shut', /\.png$/.test(outPNG) && !outSel, JSON.stringify({ outPNG, outSel }));
  const ng2 = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    da.setOpen(true); da.setView(0); await wait(400); const m = document.querySelector('[data-lmood="water"]'); m.click(); m.click(); out.tip = m.dataset.tip; out.mood = (JSON.parse(localStorage.getItem('da.prefs')).lm || {}).water;
    da.setView(2); await wait(1200); const z = []; for (let i = 0; i < 3; i++) { document.querySelector('#zine [data-zt="zoom"]').click(); await wait(200); z.push(da.PRESS.z); } out.z = z;
    da.setView(3); await wait(800); out.gallery = !document.querySelector('#gallery').hidden && !!document.querySelector('#gallery .gl-hero img'); out.filed = document.querySelectorAll('#sec-board .sig-row').length;
    document.querySelector('#ix-reset').click(); await wait(200); out.warn = !document.querySelector('#rst-w').hidden; document.querySelector('#rst-no').click(); await wait(100); out.kept = document.querySelector('#rst-w').hidden && da.POSTERS2.length > 0;
    da.setView(0); await wait(300); return out; });
  check('a layer\'s mood names itself on the hover as it turns; the strip at three sizes; the posters on the wall beside the stories; start again only after a warning', !!ng2.mood && !ng2.tip && ng2.mood !== 'weight' && new Set(ng2.z).size === 3 && ng2.gallery && ng2.filed >= 1 && ng2.warn && ng2.kept, JSON.stringify(ng2));
  const v5 = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    out.soon = document.querySelectorAll('#ctry option[disabled]').length; out.sounds = ['ship', 'toot', 'reward'].every(k => typeof da.snd[k] === 'function') && !da.snd.bed && !da.snd.drone;
    da.setView(0); await wait(300); out.pager = (document.querySelector('#sec-heat .pg-lcd') || {}).textContent;
    da.setView(2); await wait(1200); document.querySelector('#view [data-pick="strip"]').click(); await wait(400); document.querySelector('#pick [data-pk-tab="lives"]').click(); await wait(300); document.querySelector('#pick [data-pk-k="wild"][data-pk-id="any"]').click(); await wait(1500); document.querySelector('#pick [data-pk-x]') && document.querySelector('#pick [data-pk-x]').click();
    const ph = () => da.zineObjects().filter(o => o.daPhoto).map(o => Math.round(o.getScaledWidth())).join(); out.w0 = ph();
    for (const m of ['dots', 'lines', 'atk']) { document.querySelector(`[data-photo="${m}"]`).click(); await wait(700); } out.w1 = ph();
    da.setView(0); return out; });
  check('the places to come in the Country list; PRINTER ONLINE SOON; the ship, the tug and the rewards, and no bed of sound or drone under the radio; a photograph keeps its size through every look', v5.soon >= 8 && v5.pager === 'PRINTER ONLINE SOON' && v5.sounds && v5.w0 && v5.w0 === v5.w1, JSON.stringify(v5));
  /* alpha 0.2: the loop and the link; the Country on the radio only; the form as an archive files it; the shop's keys say what
     they are for; the stickers in drawers; send message; a card with its poster, and no share */
  const a2 = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    da.setOpen(true); da.setView(0); await wait(400);
    out.ctry = !!document.querySelector('#ph .ctry'); out.fade = out.ctry ? getComputedStyle(document.querySelector('#ph .ctry')).animationName : '';
    document.querySelector('[data-loop]').click(); await wait(300); out.loop = da.LOOP.on && document.body.classList.contains('looping') && da.LOOPS.length > 0 && da.S.radio;
    const m = da.LOOP.m; const back = da.mixOfCode(da.mixCode(m)); out.code = da.mixCode(m);
    out.round = !!back && Math.abs(back.where.lat - m.where.lat) < 1e-4 && back.where.r === m.where.r && Object.keys(m.layers).every(k => back.layers[k].on === m.layers[k].on && back.layers[k].mood === m.layers[k].mood);
    document.querySelector('[data-loop]').click(); await wait(200); out.off = !da.LOOP.on;
    const nL = da.LOOPS.length; da.playLoop(da.LOOPS[0].id); await wait(300); out.again = da.LOOP.on && da.LOOP.m === da.LOOPS[0] && da.LOOPS.length === nL; da.setLoop(false); await wait(100);
    document.querySelector('[data-link]').click(); await wait(600); out.link = { art: /^data:image\/png/.test((document.querySelector('.link-view .lv-art') || {}).src || ''), keys: [...document.querySelectorAll('.link-view .tv-k b')].map(b => b.textContent).join('|') }; document.querySelector('.link-view [data-lk="x"]').click();
    da.setView(1); await wait(700); out.ctry1 = !!document.querySelector('#ph .ctry');
    out.form = { icons: document.querySelectorAll('#wish-form .wf-i, #wish-form .wf-no, #wish-form .wf-seal, #wish-form label:not(.vs-cam) svg').length, margin: [...document.querySelectorAll('#wish-form .wf-m')].map(b => b.textContent).join() };
    da.setView(2); await wait(1200); out.shop = { head: document.querySelectorAll('#view .out-h').length, caps: document.querySelectorAll('#view .cap').length, sw: [...document.querySelectorAll('#view .ph-sw')].filter(i => /^data:image\/png/.test(i.src)).length, order: [...document.querySelectorAll('#view section')].map(x => x.id).filter(Boolean).join() };
    const open = () => [...document.querySelectorAll('#view .drawer')].filter(d => !d.hidden).map(d => d.id).join(); out.drawers = document.querySelectorAll('#view [data-drawer]').length; out.drawer = [open()]; document.querySelector('[data-drawer="look"]').click(); await wait(200); out.drawer.push(open()); document.querySelector('[data-drawer="look"]').click(); await wait(200); out.drawer.push(open());
    document.querySelector('#view [data-pick="strip"]').click(); await wait(500); out.opts = [...new Set([...document.querySelectorAll('#pick [data-pk-k]')].map(b => b.dataset.pkK))].join(); const n0 = da.zineObjects().length; document.querySelector('#pick [data-pk-k="p"]').click(); await wait(1200); const n1 = da.zineObjects().length; document.querySelector('#pick .pk-link input').value = 'https://example.org/a-zine'; document.querySelector('#pick .pk-link button').click(); await wait(800); document.querySelector('#pick [data-pk-x]').click(); out.placed = [n0, n1, da.zineObjects().length, da.zineObjects().slice(-1)[0].daKind]; out.tips = document.querySelectorAll('#dr-look [data-tip], #dr-look .cap2').length;
    const base = da.zineObjects().find(o => o.daKind === 'base'); out.base = base ? { sel: base.selectable, x: base.lockMovementX, rot: base.lockRotation, ctl: base.hasControls } : null;
    da.setView(3); await wait(800); out.send = { text: ((document.querySelector('#sec-quick .qp-go') || {}).textContent || '').trim(), icon: !!document.querySelector('#sec-quick .qp-go svg use[href="#g-epson"]') }; { const t = document.querySelector('#qp-t'); t.value = 'A note to the printer'; t.dispatchEvent(new Event('input', { bubbles: true })); await wait(400); document.querySelector('#sec-quick .qp-go').click(); for (let i = 0; i < 24 && document.querySelector('#qp-t').value; i++) await wait(250); out.send.cleared = document.querySelector('#qp-t').value === '' && !(JSON.parse(localStorage.getItem('da.quick.v1') || '{}').t); out.send.tip = document.querySelector('#sec-quick .qp-go').dataset.tip; } { const f = document.querySelector('#sec-printer .pt'); const ph = f && f.querySelector('.pt-ph'); out.pt0 = { fig: !!f, photo: !!ph && /printer-top\.jpg/.test(ph.getAttribute('src') || ''), leds: f ? f.querySelectorAll('.pt-led').length : 0, lit: f ? (f.classList.contains('on') || f.classList.contains('off')) : false }; da.ptPrint('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'DA-TEST', 'waiting'); await wait(300); out.pt1 = { printing: f.classList.contains('printing'), paper: !!f.querySelector('.pt-paper img'), over: f.querySelector('.pt-over').textContent, build: /build-a-solar-printer\.txt/.test((f.querySelector('.pt-build') || {}).getAttribute ? f.querySelector('.pt-build').getAttribute('href') : '') }; } out.loops = document.querySelectorAll('#sec-loops').length; da.setView(2); await wait(900); document.querySelector('#view [data-pick="strip"]').click(); await wait(400); out.made = document.querySelectorAll('#pick [data-pk-k="R"]:not([data-pk-id=""])').length; document.querySelector('#pick [data-pk-x]').click(); da.setView(3); await wait(600);
    const card = da.deck().find(c => c.kind === 'poster'); if (card) { await da.openCard(card); await wait(500); out.card = { share: document.querySelectorAll('.card-view [data-tv="share"]').length, keys: [...document.querySelectorAll('.card-view .tv-k b')].map(b => b.textContent).join('|'), poster: !!document.querySelector('.card-view .tv-poster img') }; document.querySelector('.card-view [data-tv="x"]').click(); }
    da.setView(0); return out; });
  check('loop keeps this sound playing, and is kept, and plays again exactly as it was, kept among what SELECT offers in PRINT and not on the portfolio; its link carries the place and every layer and comes back the same; the link shows its picture and code', a2.loop && a2.round && a2.off && a2.again && a2.loops === 0 && a2.made >= 1 && /^-?\d+\.\d{4},-?\d+\.\d{4},\d+,([01]\d[0-9a-z]){4}$/.test(a2.code) && a2.link.art && a2.link.keys === 'copy link|onto the strip|save|close', JSON.stringify(a2));
  check('the Country stands on the radio only, fading; the W.I.S.H. a handheld, I and its poem lettered in the margin of its screen, no marks or numbers', a2.ctry && a2.fade === 'ctryfade' && !a2.ctry1 && a2.form.icons === 0 && a2.form.margin === 'I,W,I,S,H,BY', JSON.stringify(a2));
  check('the print shop in the order it is used, the story, the looks, then the paper and the keys out; no heading over the print key; the looks the one drawer, everything else to put down from SELECT; no hover words on the looks; a poster and a link placed from SELECT; the story at the head moves up and down only', a2.shop.head === 0 && a2.shop.caps >= 9 && a2.shop.sw >= 5 && /sec-slips,sec-drawers,sec-style,sec-out/.test(a2.shop.order) && a2.drawers === 1 && a2.drawer.join('|') === '|dr-look|' && a2.tips === 0 && /p/.test(a2.opts) && /R/.test(a2.opts) && a2.placed[1] === a2.placed[0] + 1 && a2.placed[2] === a2.placed[1] + 1 && a2.placed[3] === 'qr' && !!a2.base && a2.base.sel && a2.base.x && a2.base.rot && !a2.base.ctl, JSON.stringify(a2));
  check('the printer at novel.global from above, heading the portfolio: the photograph, its lights lit as the printer is; something sent comes out of its own slot, the words over the lid while it prints', !!a2.pt0 && a2.pt0.fig && a2.pt0.photo && a2.pt0.leds === 3 && a2.pt0.lit && a2.pt1.printing && a2.pt1.paper && a2.pt1.over === 'DA-TEST' && a2.pt1.build, JSON.stringify({ pt0: a2.pt0, pt1: a2.pt1 }));
  check('send message: a printer and no words, its hover saying it prints directly to novel.global if online; sent, the form clears; a card turned over beside its poster, its keys with their words, and no share', a2.send.text === '' && a2.send.icon && a2.send.cleared && a2.send.tip === 'Message prints directly to novel.global if online' && !!a2.card && a2.card.share === 0 && a2.card.poster && /to the W.I.S.H. board[\s\S]*to the print shop/.test(a2.card.keys), JSON.stringify(a2));
  const v11 = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    da.setOpen(true); da.setView(3); await wait(900); const n0 = document.querySelectorAll('#sec-songs .album').length; document.querySelector('#view [data-song-keep]').click(); await wait(1500);
    out.songs = [n0, document.querySelectorAll('#sec-songs .album').length, !!(document.querySelector('#sec-songs .al-card') || {}).src, !!document.querySelector('#sec-songs [data-song-share]')];
    out.order = [...document.querySelectorAll('#view > .sec, #view > details.sec')].map(x => x.id).filter(x => ['sec-board', 'sec-songs', 'sec-briefs', 'sec-src'].includes(x)).join();
    out.case = (document.querySelector('#sec-briefs .lab-w') || {}).textContent; out.count = [(document.querySelector('#sec-board .labi b') || {}).textContent, String(document.querySelectorAll('#sec-board .sig-row, #sec-board .sig-line').length)];
    out.build = (document.querySelector('#sec-printer .pt-build') || {}).textContent;
    da.setView(2); await wait(1500); const ks = [...document.querySelectorAll('#zine [data-zt]')].map(b => b.dataset.zt); out.keys = [ks.indexOf('zoom'), ks.indexOf('short') === ks.indexOf('len') + 1];
    return out; });
  check('novel.global: SONGS second, each kept song an album, its card slid out of the sleeve, played or shared; CASE STUDIES above the sources; the stories counted as shown; the build key: BUILD A SOLAR THERMAL PRINTER on two lines; on PRINT, closer second, shorter beside longer', v11.songs[1] === v11.songs[0] + 1 && v11.songs[2] && v11.songs[3] && v11.order === 'sec-board,sec-songs,sec-briefs,sec-src' && v11.case === 'CASE STUDIES' && v11.count[0] === v11.count[1] && v11.build === 'BUILD A SOLARTHERMAL PRINTER' && v11.keys[0] === 1 && v11.keys[1], JSON.stringify(v11));
  /* a link to the radio, opened: tuned there, its layers as they were, play waiting for a touch */
  await page.goto('https://oan.test/studio?fresh=1#mix=-37.7712,144.9601,750,121000010128'); await ready(page); await sleep(2500);
  const lk = await page.evaluate(() => { const da = window.__da; return { lat: +da.S.scan.lat.toFixed(4), r: da.S.scan.r, water: da.T4.water, comm: da.T4.community, poll: da.T4.pollution, mood: (da.prefs.lm || {}).pollution, view: da.S.view, radio: da.S.radio }; });
  check('a radio link opened tunes the radar where it was made, with its layers and moods, and waits for play', lk.lat === -37.7712 && lk.r === 750 && lk.water === false && lk.comm === false && lk.poll === true && lk.mood === 'blown' && lk.view === 0 && !lk.radio, JSON.stringify(lk));
  await ctx.close();
} catch (e) { results.push(`FAIL  section smoke: ${e.message.split('\n').slice(0, process.env.DBG_STACK ? 8 : 1).join(' | ')}`); }

// ───────── the portfolio: a post published on the approval page, listed in the app and read on its own page ─────────
if (run('portfolio')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'portfolio');
  const made = await admin('posts', { title: 'Fan night at Kines', cat: 'case study', summary: 'Twelve fans repaired before the first 35°.', body: 'We met at six.\n\n## What worked\n\nA queue, a bench, a list.', links: ['https://example.org/fans'], status: 'published' });
  await admin('posts', { title: 'A draft nobody sees', body: 'Not yet.' });
  await page.goto('https://oan.test/studio'); await ready(page); await tab(page, 3); await sleep(1200);
  const inApp = await page.evaluate(() => ({ view: window.__da.S.view, rows: [...document.querySelectorAll('#sec-work .sig-line')].map(a => ({ t: a.querySelector('.hl').textContent, href: a.getAttribute('href'), cat: a.querySelector('.code').textContent })) }));
  check('PORTFOLIO lists the work published, never a draft, each linking to its own page', inApp.view === 3 && inApp.rows.length === 1 && inApp.rows[0].t === 'Fan night at Kines' && inApp.rows[0].cat === 'CASE STUDY' && inApp.rows[0].href === `portfolio.html#${made.slug}`, JSON.stringify(inApp));
  await page.goto('https://oan.test/portfolio.html'); await sleep(1200);
  const idx = await page.evaluate(() => ({ home: document.querySelector('header .home').textContent, title: document.title, cats: [...document.querySelectorAll('h2.cat')].map(h => h.innerText.replace(/\s+/g, ' ')), rows: document.querySelectorAll('ol.list li').length, night: document.documentElement.classList.contains('night') }));
  await page.click('ol.list a'); await sleep(900);
  const one = await page.evaluate(() => ({ h1: document.querySelector('article h1').textContent, heads: [...document.querySelectorAll('article .body h3')].map(h => h.textContent), paras: document.querySelectorAll('article .body p').length, links: [...document.querySelectorAll('article .links a')].map(a => a.textContent), scripts: document.querySelectorAll('article script').length }));
  check('portfolio.html, novel.global: the work by category as a list with counts; a post on its own address, its body set as text', idx.home === 'novel.global' && idx.title === 'novel.global' && idx.cats.join() === 'CASE STUDY 1' && idx.rows === 1 && one.h1 === 'Fan night at Kines' && one.heads.join() === 'What worked' && one.paras === 2 && one.links.join() === 'example.org/fans' && !one.scripts, JSON.stringify({ idx, one }));
  await shot(page, '04-portfolio-post.png');
  /* published by hand on the approval page, as it is done for real: PUBLISH, and the post is listed for everyone */
  await page.goto('https://oan.test/admin.html'); await sleep(800);
  await page.fill('#key', ADMIN_KEY); await page.click('#gate button[type="submit"]'); await sleep(900);
  await page.click('#tabs [data-tab="posts"]'); await sleep(700);
  await page.click('button:has-text("NEW POST")'); await sleep(500);
  await page.fill('input[name="title"]', 'Published by hand'); await page.fill('textarea[name="body"]', 'One paragraph.');
  await page.click('form.ed button.on'); await sleep(1200);
  const byHand = await page.evaluate(async () => ({ note: (document.querySelector('.ed .note') || {}).textContent || '', list: ((await (await fetch('/api/posts', { cache: 'no-store' })).json()).posts || []).map(p => p.title) }));
  check('a post written and published by hand on the approval page is listed for everyone, and the page says it is live', /LIVE AT/.test(byHand.note) && byHand.list.includes('Published by hand'), JSON.stringify(byHand));
  for (const x of (await admin('posts')).posts) await admin(`posts/${x.id}`, { action: 'delete' });
  await ctx.close();
} catch (e) { results.push(`FAIL  section portfolio: ${e.message.split('\n')[0]}`); }

// ───────── the fronts: the quickest way from a sound to a receipt; the example; BOARD 00, and its editing from the approval page ─────────
if (run('fronts')) try {
  const ctx = await newCtx(); await wire(ctx, { first: true }); await ctx.addInitScript(() => { window.__noStart = true; }); const page = await ctx.newPage(); watch(page, 'fronts');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page); await sleep(800);
  const fr = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    da.setOpen(true); da.setView(0); await wait(700);
    out.nino = []; { const n = document.querySelector('#view [data-nino]'); n.click(); out.nino.push(!!da.prefs.nino, document.body.classList.contains('nino')); n.click(); out.nino.push(!!da.prefs.nino, document.body.classList.contains('nino')); }
    out.front = da.faceOf(0); out.keys = [...document.querySelectorAll('#view button')].map(b => (b.dataset.radio != null ? 'play' : b.dataset.knob ? 'knob' : b.className.split(' ')[0])); out.stock0 = !!document.querySelector('#view .dev.radio') && !document.querySelector('#view .mod, #view .mod-cap');
    out.up0 = ['up-lora', 'up-run', 'up-plate', 'h-screw'].every(c => !!document.querySelector(`#view .simple-r .dev.radio.upg .${c}`));
    out.flip = !!document.querySelector('#view [data-flip]'); out.step = (document.querySelector('#view .steps.clues .st.now .st-w') || {}).textContent;
    const v0 = +document.querySelector('[data-knob="water"]').getAttribute('aria-valuenow'); document.querySelector('[data-knob="water"]').click(); await wait(200); out.knob = [v0, +document.querySelector('[data-knob="water"]').getAttribute('aria-valuenow')];
    document.querySelector('#view [data-radio]').click(); await wait(2200);
    out.example = { loop: da.LOOP.on, radio: da.S.radio, near: Math.abs(da.S.scan.lat - (-37.7865)) < 0.001, r: da.S.scan.r, mood: (da.prefs.lm || {}).life, water: (da.prefs.lm || {}).water };
    await wait(7200); out.nudge = document.querySelector('#rail .tab[data-i="1"]').classList.contains('nudge');
    da.setView(1); await wait(900); out.nudged = document.querySelector('#rail .tab[data-i="1"]').classList.contains('nudge'); out.hash = location.hash;
    /* a receipt is of a life: one held from the ground before W.I.S.H. is looked at */
    { const o = da.S.obs.find(x => !x.hum && !x.hist && x.tx && x.tx.cn && x.lat); if (o) { da.jPick(da.jSelLife(o)); await wait(900); } }
    out.wish = { intent: !!document.querySelector('#view #jw-for'), offMap: document.body.classList.contains('off-map'), board: !document.querySelector('#board').hidden, jr: !!document.querySelector('#jr:not([hidden]) .jr-r img'), acts: document.querySelectorAll('#jr:not([hidden]) .jr-act').length, closed: document.querySelector('#jr .jr-acts').hidden, lines: document.querySelectorAll('#view .vs-poem textarea, #view #wf-by').length, camera: !!document.querySelector('#view input[type="file"]'), select: document.querySelectorAll('#view [data-pick]').length, stock: !document.querySelector('#view .mod, #view .mod-cap'), up: !!document.querySelector('#view .vs-body.upg .up-lora') && !!document.querySelector('#view .vs-body.upg .up-plate') };
    const f = document.querySelector('#jw-for'); f.value = 'Shade for the grey-headed flying-fox'; f.dispatchEvent(new Event('input', { bubbles: true })); await wait(1400);
    out.draft = da.JR.want; out.preview = /^data:image/.test((document.querySelector('#jr .jr-r img') || {}).src || '');
    document.querySelector('#view [data-flip]').click(); await wait(900); out.back1 = { face: da.faceOf(1), mod: !!document.querySelector('#view .visor.mod .mod-cap') && !!document.querySelector('#view .visor.mod .mod-label'), lines: ['w', 'i', 's', 'h'].map(x => (document.querySelector('#wf-' + x) || {}).value), hints: ['w', 'i', 's', 'h'].map(x => (document.querySelector('#wf-' + x) || {}).placeholder).join('|'), by: !!document.querySelector('#view #wf-by'), dice: document.querySelectorAll('#view [data-vs="dice"]').length };
    document.querySelector('#view [data-flip]').click(); await wait(900);
    document.querySelector('#view .vs-make').click(); await wait(2600); for (let i = 0; i < 16 && !['base', 'code'].every(k => da.zineObjects().some(o => o.daKind === k)); i++) await wait(250);
    out.made = { view: da.S.view, hash: location.hash, face: da.faceOf(2), base: da.zineObjects().some(o => o.daKind === 'base'), code: da.zineObjects().some(o => o.daKind === 'code'), tools: getComputedStyle(document.querySelector('#zine .tools')).display };
    out.pkeys = { all: document.querySelectorAll('#view button').length, tp: document.querySelectorAll('#view [data-tp]').length, print: document.querySelectorAll('#view [data-pout="send"]').length, sheet: document.querySelectorAll('#view .jp-sel .jp-stk').length, aa: !!document.querySelector('#view [data-tp="reset"]') && !document.querySelector('#view [data-jwords]'), paper: !!document.querySelector('#view .tp-slot .tp-paper'), slider: !!document.querySelector('#view .tp-win'), stock: !document.querySelector('#view .mod, #view .mod-cap'), up: !!document.querySelector('#view .dev.tepra.upg .up-lora') };
    out.info0 = document.querySelector('#tp-info').hidden && !document.querySelector('#tp-info').offsetHeight; document.querySelector('[data-prn]').click(); await wait(200); out.info1 = !document.querySelector('#tp-info').hidden && /NOVEL\.GLOBAL/.test(document.querySelector('#tp-info').textContent);
    const n0 = da.zineObjects().length; document.querySelector('#view .jp-sel').click(); await wait(500); document.querySelector('#pick [data-pk-tab="stick"]').click(); await wait(400); document.querySelector('#pick [data-pk-k="stk"]').click(); await wait(900); out.stk = da.zineObjects().length === n0 + 1; document.querySelector('#pick [data-pk-x]') && document.querySelector('#pick [data-pk-x]').click();
    document.querySelector('#view [data-flip]').click(); await wait(900); out.flipped = da.faceOf(2) === 'back' && !!document.querySelector('#view [data-drawer]') && !!document.querySelector('#view .dev.tepra.mod .mod-cap') && document.querySelector('#ps-info').hidden;
    da.setView(0); await wait(600); document.querySelector('#view [data-flip]').click(); await wait(900); out.back0 = da.faceOf(0) === 'back' && !!document.querySelector('#view .band.dev.radio.mod .mod-cable'); document.querySelector('#view [data-flip]').click(); await wait(900);
    return out; });
  check('the front of RADIO, for everyone once everything is open: the small radio, play, a knob for each track that turns off and through three filters (MIST, HALL, DEPTH), the red El Niño switch; upgraded, a LoRa antenna, wires and the jellyfish key on a board of its own; no clues under it', fr.front === 'front' && fr.flip && fr.stock0 && fr.up0 && fr.keys.filter(k => k === 'knob').length === 4 && fr.keys.filter(k => k === 'play').length === 1 && fr.keys.length === 7 && fr.keys.includes('rd-nino') && fr.keys.includes('flip-b') && fr.nino.join() === 'true,true,false,false' && !fr.step && fr.knob[1] === (fr.knob[0] + 1) % 4, JSON.stringify(fr));
  check('play before anywhere is chosen: the radio over Royal Park, deep and slow (DUB on the lives, WEIGHT on the water), playing what the hand finds there and no loop; then the W.I.S.H. tab glows until it is opened', !fr.example.loop && fr.example.radio && fr.example.near && fr.example.r === 700 && fr.example.mood === 'dub' && fr.example.water === 'weight' && fr.nudge && !fr.nudged && fr.hash === '#wish', JSON.stringify(fr));
  check('the front of W.I.S.H.: the intention device over the map, upgraded, no camera and no SELECT; its receipt beside it and six suggestions behind a tab, the intention shown as typed; turned over, the board and the handheld opened, its four lines empty, each showing what its letter stands for; make takes the receipt to PRINT, its tools over the strip once open', fr.wish.intent && !fr.wish.offMap && !fr.wish.board && fr.wish.jr && fr.wish.acts === 6 && fr.wish.closed && !fr.wish.camera && fr.wish.select === 0 && fr.wish.lines === 0 && fr.wish.stock && fr.wish.up && fr.draft === 'Shade for the grey-headed flying-fox' && fr.preview && fr.back1.face === 'back' && fr.back1.mod && fr.back1.by && fr.back1.lines.every(x => !x) && fr.back1.hints === "What we know|It would be great|So let's create|Here is how it works" && fr.back1.dice === 0 && fr.made.view === 2 && fr.made.hash === '#print' && fr.made.face === 'front' && fr.made.base && fr.made.code && fr.made.tools === 'flex', JSON.stringify(fr));
  check('the front of PRINT once everything is open: the same dongle a first visit has, a sheet of stickers to SELECT from, a key to start again, a keycap to take back, one closer, and print, its paper out of the slot and no window that reads as a slider; the printer\'s name and state out of sight until its light is pressed; upgraded; turned over, the studio on the opened label maker, and the radio opened too', fr.pkeys.all === 7 && fr.pkeys.tp === 3 && fr.pkeys.print === 1 && fr.pkeys.sheet >= 1 && fr.pkeys.aa && fr.pkeys.paper && !fr.pkeys.slider && fr.pkeys.stock && fr.pkeys.up && fr.info0 && fr.info1 && fr.stk && fr.flipped && fr.back0, JSON.stringify(fr));
  /* a connection laid on the W.I.S.H. board on purpose: W.I.S.H. opens on its board, and the Settings keys and the corner */
  const bf = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); da.setFace(1, 'front'); da.setView(0); await wait(600); const m = da.shareMix(); await wait(1600);
    const out = { mix: !!m, view: da.S.view, face: da.faceOf(1), board: !document.querySelector('#board').hidden, offMap: document.body.classList.contains('off-map') };
    da.setView(3); await wait(1200); const tops = [...document.querySelectorAll('#sec-set .set > .tog')].map(b => Math.round(b.getBoundingClientRect().top)); const at = document.querySelector('.maplibregl-ctrl-attrib');
    out.set = { keys: tops.length, level: new Set(tops).size === 1, name: !!document.querySelector('#sec-set .sig input') }; out.folded = !at.classList.contains('maplibregl-compact-show');
    const lm = da.prefs.lm; da.prefs.lm = { ...(lm || {}), life: 'jelly', pollution: 'haunt' }; out.retired = [da.moodOfLayer('life'), da.moodOfLayer('pollution')].join(); da.prefs.lm = lm;
    return out; });
  check('a connection laid on the W.I.S.H. board opens W.I.S.H. on its board, the blueprint, not its front', bf.mix && bf.view === 1 && bf.face === 'back' && bf.board && bf.offMap, JSON.stringify(bf));
  check('Settings: every key level on one line on a wide screen, the name under them; the information corner folded until it is pressed', bf.set.keys >= 7 && bf.set.level && bf.set.name && bf.folded, JSON.stringify(bf));
  check('a mood from before the one deep key sounds as the nearest deep one: JELLY as DUB, HAUNT as STAB', bf.retired === 'dub,stab', JSON.stringify(bf));
  await shot(page, '50-fronts.png');
  const ex = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    da.setView(1); await wait(600); if (da.faceOf(1) === 'front') { document.querySelector('#view [data-flip]').click(); await wait(900); }
    out.keys = [...document.querySelectorAll('#view .b-keys li')].map(li => (li.querySelector('input') ? li.querySelector('input').value : li.textContent.trim()));
    await da.switchBoard('b00'); await wait(6000);
    const objs = da.boardObjects(); const n0 = objs.length;
    out.b00 = { n: n0, locked: document.querySelector('#board').classList.contains('locked'), sections: objs.filter(o => o.daKind === 'section').length, steps: objs.filter(o => o.text && /^(NOTICED|RESPONSE|DIRECT ACTION)$/.test(o.text)).length, images: objs.filter(o => o.type === 'image').length, links: objs.filter(o => o.daKind === 'link').length, src: objs.filter(o => o.text && /↗/.test(o.text)).length };
    document.querySelector('#board [data-bt="note"]').click(); await wait(900);
    out.guard = { id: da.boardId(), b00: (JSON.parse(localStorage.getItem('da.board.b00')).json.objects || []).length === n0 };
    da.setView(2); await wait(800); if (da.faceOf(2) === 'front') { document.querySelector('#view [data-flip]').click(); await wait(900); }
    document.querySelector('#view [data-pick="strip"]').click(); await wait(500); out.opt = !!document.querySelector('#pick [data-pk-k="X"]');
    const story0 = da.PRESS.story; document.querySelector('#pick [data-pk-k="X"]').click(); await wait(7000); out.story0 = story0; document.querySelector('#pick [data-pk-x]') && document.querySelector('#pick [data-pk-x]').click();
    out.zine = { story: da.PRESS.story, kinds: [...new Set(da.zineObjects().map(o => o.daKind))].sort().join() };
    da.setView(3); await wait(9000);
    out.hero = { img: !!document.querySelector('#gallery .gl-hero.ex img'), cap: (document.querySelector('#gallery .gl-hero figcaption') || {}).textContent, swim: !!document.querySelector('#ph .swim .sw-j'), name: !!document.querySelector('#ph .lk-n') };
    return out; });
  check('BOARD 00 stands before BOARD 01: the example built from its kit, the three steps side by side, photographs, sources and strings; looked at, not changed, and nothing placed lands on it', ex.keys[0] === 'BOARD 00' && ex.keys[1] === 'BOARD 01' && ex.b00.locked && ex.b00.sections === 3 && ex.b00.steps === 3 && ex.b00.images >= 6 && ex.b00.links >= 10 && ex.b00.src >= 8 && ex.b00.n >= 40 && ex.guard.b00 && ex.guard.id !== 'b00', JSON.stringify(ex));
  check('the example zine, from the drawer: onto the receipt already there as art, that receipt kept; the portfolio\'s hero, the muse swimming where the name was', ex.opt && (ex.story0 ? ex.zine.story === ex.story0 : ex.zine.story === 'ex:DA-0RNG') && /art/.test(ex.zine.kinds) && /sticker/.test(ex.zine.kinds) && ex.hero.img && /000/.test(ex.hero.cap || '') && ex.hero.swim && !ex.hero.name, JSON.stringify(ex));
  await shot(page, '51-example-hero.png');
  /* BOARD 00 opened to editing on the approval page: changed here, sent, shown there, and then the example everyone is served */
  await admin('settings', { exampleEdit: true });
  const ed = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    await da.loadSettings(); da.setView(1); await wait(600); if (da.faceOf(1) === 'front') { document.querySelector('#view [data-flip]').click(); await wait(900); }
    await da.switchBoard('b00'); await wait(2500);
    out.open = !document.querySelector('#board').classList.contains('locked'); out.send = getComputedStyle(document.querySelector('#board [data-bt="exsend"]')).display !== 'none';
    const n0 = da.boardObjects().length; document.querySelector('#board [data-bt="note"]').click(); await wait(600); out.added = da.boardObjects().length === n0 + 1 && da.boardId() === 'b00';
    document.querySelector('#board [data-bt="exsend"]').click(); await wait(1500); return out; });
  const exw = (await admin('stories?status=waiting')).stories.filter(x => x.kind === 'example');
  if (exw[0]) await admin(`stories/${exw[0].id}`, { action: 'show' });
  const served = await (await apiServer.fetch(new URL('/api/example', API_O))).json();
  const pub = (await (await apiServer.fetch(new URL('/api/stories', API_O))).json()).stories.filter(x => x.kind === 'example').length;
  await admin('settings', { exampleEdit: false });
  const locked = await (await apiServer.fetch(new URL('/api/stories', API_O), { method: 'POST', headers: { 'content-type': 'application/json', origin: API_O }, body: JSON.stringify({ kind: 'example', code: 'DA-EX00', body: '{"objects":[]}', lat: -37.78, lng: 144.95 }) })).status;
  check('editing switched on at the approval page: BOARD 00 opens and changes, is sent, waits there, and once shown is the example everyone is served; locked again, nothing more is taken', ed.open && ed.send && ed.added && exw.length === 1 && !!served.board && served.board.objects.length >= 40 && pub === 0 && locked === 403, JSON.stringify({ ed, waiting: exw.length, served: !!served.board, pub, locked }));
  for (const st of ['waiting', 'shown']) for (const x of (await admin('stories?status=' + st)).stories.filter(y => y.kind === 'example')) await admin(`stories/${x.id}`, { action: 'delete' });
  /* more than one printer online: PRINT's light opens a short list, each with its light and its place, and the one chosen is kept */
  for (const id of ['pickles', 'kines']) await admin(`printers/${id}`, { action: 'live', on: true });
  const pc = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); await da.loadPartners(); da.setFace(2, 'front'); da.setView(2); await wait(900);
    document.querySelector('#view [data-prn]').click(); await wait(300); const ks = [...document.querySelectorAll('#view [data-prn-pick]')]; const out = { n: ks.length, places: ks.map(k => (k.querySelector('small') || {}).textContent || '').filter(Boolean).length };
    if (ks[1]) { ks[1].click(); await wait(200); out.chosen = da.prefs.prn === ks[1].dataset.prnPick && ks[1].classList.contains('on') && !ks[0].classList.contains('on'); } return out; });
  for (const id of ['pickles', 'kines']) await admin(`printers/${id}`, { action: 'live', on: false });
  check('more than one printer online: PRINT\'s light opens the printers to choose from, each with its light and its place, and the one chosen is kept', pc.n === 2 && pc.places === 2 && pc.chosen, JSON.stringify(pc));
  await ctx.close();
} catch (e) { results.push(`FAIL  section fronts: ${e.message.split('\n')[0]}`); }

// ───────── a first visit: no radar until a tap says where you are ─────────
if (run('first')) try {
  const ctx = await newCtx(); await wire(ctx, { first: true }); await ctx.addInitScript(() => { window.__noStart = true; }); const page = await ctx.newPage(); watch(page, 'first');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page); await sleep(800);
  const f = await page.evaluate(() => { const da = window.__da; return { placed: da.placed(), knob: document.querySelector('#knob').hidden, shown: da.life.items.filter(it => da.life.shown(it)).length, press: !document.querySelector('#arcade') && !document.querySelector('#view .steps') }; });
  check('a first visit: every mark on the map, no radar, nothing over the ground; no clues on the quick radio', !f.placed && f.knob && f.shown > 20 && f.press, JSON.stringify(f));
  check('day is the default on a first visit', await page.evaluate(() => !document.documentElement.classList.contains('night')));
  await page.evaluate(() => window.__da.setOpen(false)); await sleep(500);
  const m = await page.evaluate(() => { const r = window.__da.map.getContainer().getBoundingClientRect(); return [r.left + r.width * 0.42, r.top + r.height * 0.55]; });
  await page.mouse.click(m[0], m[1]); await sleep(700);
  const g = await page.evaluate(([x, y]) => { const da = window.__da; const r = da.map.getContainer().getBoundingClientRect(); const ll = da.map.unproject([x - r.left, y - r.top]); return { placed: da.placed(), knob: !document.querySelector('#knob').hidden, off: Math.round(da.haversine(ll.lat, ll.lng, da.S.scan.lat, da.S.scan.lng)), kept: JSON.parse(localStorage.getItem('da.prefs') || '{}').placed === true }; }, m);
  check('a tap on the map puts the radar down where it lands, and starts the radio', g.placed && g.knob && g.off < 20 && g.kept, JSON.stringify(g));
  await ctx.close();
} catch (e) { results.push(`FAIL  section first: ${e.message.split('\n')[0]}`); }

// ───────── the first visit: the simple way through, gate by gate, to everything open; at a desk's width and a phone's ─────────
/* a code read off a picture, as a phone's camera would */
const qrIn = async src => { const { data, info } = await sharp(Buffer.from(String(src).split(',')[1] || '', 'base64')).flatten({ background: '#ffffff' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const q = jsQR(new Uint8ClampedArray(data), info.width, info.height); return q ? q.data : null; };
/* where on the screen a life the sweep has found can be touched: inside the radar, clear of the device and the page, its mark alone under the finger */
const lifeSpot = (page, skip) => page.evaluate(skip => { const da = window.__da; da.life.reveal(); const r = da.map.getContainer().getBoundingClientRect(); const dev = document.querySelector('#view .dev'); const d = dev ? dev.getBoundingClientRect() : { left: innerWidth, top: innerHeight };
  for (const it of da.life.items) { if (!it.inS || it.binned || (it.pile || 0) >= 2 || typeof it.o.id !== 'number' || it.o.hum || it.o.hist || !da.life.shown(it)) continue; const x = it.x + (it.dx || 0), y = it.y + (it.dy || 0); const X = x + r.left, Y = y + r.top;
    if (X < 40 || Y < 70 || X > innerWidth - 40 || Y > innerHeight - 70 || (X > d.left - 30 && Y > d.top - 30 && Y < d.bottom + 30) || X > innerWidth - (innerWidth >= 760 ? 470 : 0) || (innerWidth < 760 && Y > d.top - 40)) continue;
    if (skip != null && (it.o.id === skip || !(document.elementFromPoint(X, Y) || { closest: () => null }).closest('#world, .maplibregl-canvas-container'))) continue;
    const h = da.life.hit(x, y, true); if (h && h.kind === 'cell' && h.id === it.o.id) return { id: it.o.id, n: da.S.byId.get(it.o.id) ? it.o.id : null, x: X, y: Y }; }
  return null; }, skip ?? null);
async function walkJourney(page, tag, phoneSize) {
  const out = {}; const st = () => page.evaluate(() => ({ j: window.__da.prefs.journey, view: window.__da.S.view, simple: window.__da.simple(), cls: ['simple', 'j0', 'j1', 'j2', 'j3'].filter(c => document.body.classList.contains(c)).join(' ') }));
  const press = async (sel, x) => (phoneSize ? page.tap(sel, { timeout: 20000, ...(x || {}) }) : tap(page, sel, x));
  /* 0: the map alone */
  out.s0 = await page.evaluate(() => { const da = window.__da; const vis = el => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0; const so = document.querySelector('.jr-sonar'); const sr = so.getBoundingClientRect(); return { j: da.prefs.journey, cls: document.body.classList.contains('j0'), placed: da.placed(), panel: vis(document.querySelector('#panel')), rail: vis(document.querySelector('#rail')), sonar: !so.hidden && sr.left > 0 && sr.left < innerWidth && sr.top > 0 && sr.top < innerHeight, printers: da.PARTNERS.every(p => p._x == null), start: Math.round(da.haversine(da.S.scan.lat, da.S.scan.lng, da.CONFIG.SCAN.lat, da.CONFIG.SCAN.lng)), pickles: (pk => Math.round(da.haversine(da.S.scan.lat, da.S.scan.lng, pk.lat, pk.lng)))(da.PARTNERS.find(p => p.id === 'pickles')) }; });
  await shot(page, `${tag}0-map.png`);
  /* 1: a touch on the map, and the radar lands where it fell, 500 m; the radio comes up, half its height, no jellyfish */
  const m = await page.evaluate(() => { const r = window.__da.map.getContainer().getBoundingClientRect(); return [r.left + r.width * 0.48, r.top + r.height * 0.36]; });
  if (phoneSize) await page.touchscreen.tap(m[0], m[1]); else await page.mouse.click(m[0], m[1]);
  await page.waitForFunction(() => window.__da.prefs.journey === 1 && !!document.querySelector('#view .simple-r .dev'), null, { timeout: 15000 }); await sleep(1400);
  await page.waitForFunction(() => { const d = document.querySelector('#view .simple-r .dev'); if (!d) return false; const r = d.getBoundingClientRect(); const k = `${Math.round(r.left)},${Math.round(r.top)}`; const same = window.__devK === k; window.__devK = k; return same; }, null, { polling: 250, timeout: 6000 }).catch(() => {});
  out.s1 = await page.evaluate(([x, y]) => { const da = window.__da; const r = da.map.getContainer().getBoundingClientRect(); const ll = da.map.unproject([x - r.left, y - r.top]); const dev = document.querySelector('#view .simple-r .dev').getBoundingClientRect();
    return { r: da.S.scan.r, placed: da.placed(), off: Math.round(da.haversine(ll.lat, ll.lng, da.S.scan.lat, da.S.scan.lng)), radio: da.S.radio, h: Math.round(dev.height), w: Math.round(dev.width), inView: dev.left >= 0 && dev.right <= innerWidth && dev.bottom <= innerHeight, flip: document.querySelectorAll('[data-flip]').length, keys: document.querySelectorAll('#view .simple-r [data-knob]').length, play: !!document.querySelector('#view .simple-r [data-radio]'), nino: !!document.querySelector('#view .simple-r [data-nino]'),
      tabs: [...document.querySelectorAll('#rail .tab')].map(t => getComputedStyle(t).visibility !== 'hidden') }; }, m);
  out.snd = await page.evaluate(() => { const da = window.__da; const n = document.querySelector('#view [data-nino]'); const t0 = da.life.tempo(); n.click(); const t1 = da.life.tempo(); const hot = document.body.classList.contains('nino'); n.click(); return { moods: ['life', 'community', 'water', 'pollution'].map(k => da.moodOfLayer(k)).join(), t0, t1, hot }; });
  await shot(page, `${tag}1-radio.png`);
  /* 2: a life touched: W.I.S.H. opens over the map with the receipt of it, the clear intention device, the stories */
  await page.evaluate(() => { const da = window.__da; da.map.easeTo({ center: [da.S.scan.lng, da.S.scan.lat], zoom: Math.max(da.map.getZoom(), 15.6), offset: innerWidth < 760 ? [0, -innerHeight * 0.2] : [-220, 0], duration: 0 }); }); await settle(page); await sleep(500);
  const spot = await lifeSpot(page); out.spot = !!spot;
  if (phoneSize) await page.touchscreen.tap(spot.x, spot.y); else await page.mouse.click(spot.x, spot.y);
  await page.waitForFunction(() => window.__da.prefs.journey === 2 && window.__da.S.view === 1 && !!document.querySelector('#jr:not([hidden]) .jr-r img[src^="data:"]'), null, { timeout: 15000 }); await sleep(900);
  /* the device at rest on its rail (on a phone it slides into place) */
  await page.waitForFunction(() => { const d = document.querySelector('#view .simple-w .vs-body'); if (!d) return false; const t = Math.round(d.getBoundingClientRect().top); const same = window.__devT === t; window.__devT = t; return same; }, null, { polling: 250, timeout: 6000 }).catch(() => {});
  out.s2 = await page.evaluate(id => { const da = window.__da; const b = el => { const r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
    const dev = document.querySelector('#view .simple-w .vs-body'); const cs = getComputedStyle(dev); const acts = [...document.querySelectorAll('#jr .jr-act')];
    return { sel: da.JR.sel && da.JR.sel.id === id, name: da.JR.sel && da.JR.sel.n, offMap: document.body.classList.contains('off-map'), mapSeen: !document.querySelector('#board:not([hidden])') && getComputedStyle(document.querySelector('#cover')).display === 'none', dev: b(dev), modded: !!dev.querySelector('.h-lora') && dev.querySelectorAll('.h-screw').length === 2 && !dev.querySelector('.up-lora'), same: new Set(acts.map(a => { const r = a.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })).size === 1, small: acts.some(a => a.querySelector('small')), select: document.querySelectorAll('#view [data-pick]').length, cam: document.querySelectorAll('#view input[type="file"]').length, flip: document.querySelectorAll('[data-flip]').length,
      rcpt: b(document.querySelector('#jr .jr-r img')), acts: acts.length, actFont: acts.length ? parseFloat(getComputedStyle(acts[0].querySelector('b')).fontSize) : 0, actBox: acts.length ? b(acts[0]) : null, src: document.querySelector('#jr .jr-r img').src, tabs: [...document.querySelectorAll('#rail .tab')].map(t => getComputedStyle(t).visibility !== 'hidden') }; }, spot.id);
  out.s2.qr = await qrIn(out.s2.src); out.s2.src = out.s2.src.length;
  /* what is held is kept in sight: the map slides it clear of the receipt, the suggestions and the device */
  await sleep(300); await page.waitForFunction(() => !window.__da.map.isMoving(), null, { timeout: 5000 }).catch(() => {});
  out.s2.closed = await page.evaluate(() => ({ list: document.querySelector('#jr .jr-acts').hidden, tab: document.querySelector('#jr .jr-tab').getAttribute('aria-expanded'), key: !!document.querySelector('#view .vs-sg[data-jtab]'), held: getComputedStyle(document.querySelector('.jr-held')).display !== 'none' && document.querySelectorAll('.jr-held .h').length === 1,
    clear: (() => { const h = document.querySelector('.jr-held .h'); if (!h) return false; const X = +h.getAttribute('cx'), Y = +h.getAttribute('cy'); return X > 0 && Y > 0 && X < innerWidth && Y < innerHeight && [...document.querySelectorAll('#jr .jr-r img, #jr .jr-tab, #view .simple-w .vs-body')].every(el => { const b = el.getBoundingClientRect(); return X < b.left || X > b.right || Y < b.top || Y > b.bottom; }); })() }));
  await press('#view .vs-sg'); await sleep(500); await page.waitForFunction(() => !document.getAnimations().some(a => a.animationName === 'jsgin' && a.playState === 'running'), null, { timeout: 5000 }).catch(() => {});
  out.s2.opened = await page.evaluate(() => ({ list: !document.querySelector('#jr .jr-acts').hidden, tab: document.querySelector('#jr .jr-tab').getAttribute('aria-expanded') }));
  Object.assign(out.s2, await page.evaluate(() => { const b = el => { const r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; }; const acts = [...document.querySelectorAll('#jr .jr-act')];
    return { same: new Set(acts.map(a => { const r = a.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })).size === 1 && acts[0].getBoundingClientRect().height > 0, actFont: acts.length ? parseFloat(getComputedStyle(acts[0].querySelector('b')).fontSize) : 0, actBox: acts.length ? b(acts[0]) : null, rcpt: b(document.querySelector('#jr .jr-r img')) }; }));
  await shot(page, `${tag}2-wish.png`);
  /* the intention device holds its size: a long intention scrolls in its two-line LCD, an arrow on the glass */
  const devAt = () => page.evaluate(() => { const d = document.querySelector('#view .simple-w .vs-body').getBoundingClientRect(), m = document.querySelector('#view .vs-make').getBoundingClientRect(); return { t: Math.round(d.top), h: Math.round(d.height), mb: Math.round(m.bottom), dt: document.documentElement.style.getPropertyValue('--dev-top') }; });
  const m0 = await devAt(); await page.fill('#jw-for', 'Shallow water out with a stone in it, under the old gum by the creek path, every hot day'); await sleep(900); const m1 = await devAt();
  out.fixed = { m0, m1, same: Math.abs(m0.t - m1.t) <= 1 && Math.abs(m0.h - m1.h) <= 1 && Math.abs(m0.mb - m1.mb) <= 1 && m0.dt === m1.dt, ...(await page.evaluate(() => { const f = document.querySelector('#jw-for'), l = f.parentNode; return { scroll: f.scrollHeight > f.clientHeight + 4, arrow: l.classList.contains('lcd-up') || l.classList.contains('lcd-dn') }; })) };
  await page.fill('#jw-for', ''); await sleep(400);
  if (!phoneSize) {
    /* the receipt rolled up into its clip: the map clear but for what is held; another life touched changes it, still rolled; the strip lets it down */
    const ft0 = await page.evaluate(() => Math.round(document.querySelector('#jr .jr-r').getBoundingClientRect().top));
    await press('#jr .jr-fold'); await sleep(200); await page.waitForFunction(() => !document.getAnimations().some(a => a.animationName === 'jroll' && a.playState === 'running'), null, { timeout: 4000 }).catch(() => {}); await sleep(150);
    const roll = await page.evaluate(id => { const j = document.querySelector('#jr'), im = j.querySelector('.jr-r img').getBoundingClientRect(); return { fold: j.classList.contains('fold'), sg: getComputedStyle(j.querySelector('.jr-sg')).display, h: Math.round(im.height), b: Math.round(im.bottom), ft: Math.round(j.querySelector('.jr-r').getBoundingClientRect().top), aria: j.querySelector('.jr-fold').getAttribute('aria-expanded'), held: getComputedStyle(document.querySelector('.jr-held')).display !== 'none', same: !!window.__da.JR.sel && window.__da.JR.sel.id === id }; }, spot.id);
    const other = await lifeSpot(page, spot.id); let changed = null;
    if (other) {
      const s0 = await page.evaluate(() => document.querySelector('#jr .jr-r img').src); await page.mouse.click(other.x, other.y);
      await page.waitForFunction(([id, s0]) => window.__da.JR.sel && window.__da.JR.sel.id === id && document.querySelector('#jr .jr-r img').src !== s0 && !window.__da.map.isMoving(), [other.id, s0], { timeout: 10000 }).catch(() => {});
      changed = await page.evaluate(id => ({ sel: !!window.__da.JR.sel && window.__da.JR.sel.id === id, fold: !!document.querySelector('#jr.fold'), now: document.querySelector('#view .vs-now').textContent.startsWith(String(window.__da.JR.sel.place || '').toUpperCase()) }), other.id);
    }
    await press('#jr .jr-r img'); await sleep(900); await page.waitForFunction(() => !window.__da.map.isMoving(), null, { timeout: 5000 }).catch(() => {});
    const unroll = await page.evaluate(() => ({ fold: !!document.querySelector('#jr.fold'), zoom: !!document.querySelector('.zoomv'), list: !document.querySelector('#jr .jr-acts').hidden, h: Math.round(document.querySelector('#jr .jr-r img').getBoundingClientRect().height) }));
    await page.evaluate(id => window.__da.select(id), spot.id); await page.waitForFunction(id => window.__da.JR.sel && window.__da.JR.sel.id === id, spot.id, { timeout: 8000 }).catch(() => {}); await sleep(900);
    out.roll = { roll, ft0, other: !!other, changed, unroll };
  } else {
    /* on a phone the tab lowers the device to its lip and rolls the receipt up with it, the map in full; the tab, the strip or a touch on its head brings both back */
    const t0 = (await devAt()).t; const tab = () => press('#rail .tab[data-i="1"]');
    const at = () => page.evaluate(() => { const j = document.querySelector('#jr'), im = j.querySelector('.jr-r img').getBoundingClientRect(), d = document.querySelector('#view .simple-w .vs-body').getBoundingClientRect(); return { main: document.body.classList.contains('pane-main'), fold: j.classList.contains('fold'), h: Math.round(im.height), above: im.bottom <= d.top - 4, t: Math.round(d.top), low: d.top >= innerHeight - 160, held: getComputedStyle(document.querySelector('.jr-held')).display !== 'none', focus: document.activeElement && document.activeElement.id === 'jw-for' }; });
    /* the device and the receipt come to rest: read once nothing has moved for a moment */
    const rest = async down => { await page.waitForFunction(([down, t0]) => { const d = document.querySelector('#view .simple-w .vs-body').getBoundingClientRect(), im = document.querySelector('#jr .jr-r img').getBoundingClientRect(); const ok = down ? document.body.classList.contains('pane-main') && d.top >= innerHeight - 160 && im.height <= 56 : document.body.classList.contains('pane-page') && Math.abs(d.top - t0) <= 2 && im.height > 200; return ok && !document.getAnimations().some(a => a.playState === 'running' && /jroll|hang/.test(a.animationName || '')); }, [down, t0], { timeout: 4000 }).catch(() => {}); await sleep(250); return at(); };
    await tab(); const lo = await rest(true); await shot(page, `${tag}2b-map.png`);
    await tab(); const up = await rest(false);
    await tab(); await rest(true); await press('#jr .jr-r img'); const strip = await rest(false);
    await tab(); await rest(true); const hb = await page.evaluate(() => { const r = document.querySelector('#view .simple-w .vs-body').getBoundingClientRect(); return [r.left + r.width * 0.3, r.top + 30]; });
    await page.touchscreen.tap(hb[0], hb[1]); const head = await rest(false);
    out.roll = { t0, lo, up, strip, head };
  }
  /* suggestions taken up, as many as wanted, each onto the receipt with its fact; then words of one's own, and make */
  await press('#jr li:first-child .jr-act'); await sleep(400); await press('#jr li:nth-child(5) .jr-act'); await sleep(500);
  out.story = await page.evaluate(() => ({ acts: window.__da.JR.acts.slice(), on: document.querySelectorAll('#jr .jr-act.on').length, field: document.querySelector('#jw-for').value, next: document.querySelector('#view .vs-make').classList.contains('next'), signal: window.__da.jSignal().acts.length }));
  const pv0 = await page.evaluate(() => document.querySelector('#jr .jr-r img').src);
  await page.fill('#jw-for', 'Water out for the flying-foxes'); await sleep(900);
  out.typed = await page.evaluate(p0 => ({ want: window.__da.JR.want, redrawn: document.querySelector('#jr .jr-r img').src !== p0 }), pv0);
  /* a place near it touched on the map is tied to the life: a connection, on the receipt */
  if (!phoneSize) {
    const pl = await page.evaluate(() => { const da = window.__da; const r = da.map.getContainer().getBoundingClientRect(); for (let i = 0; i < 600; i++) { const p = da.life.place(i); if (!p) break; if (p._x == null) continue; const X = p._x + r.left, Y = p._y + r.top; const el = document.elementFromPoint(X, Y); const h = da.life.hit(p._x, p._y, true); if (el && el.closest('.maplibregl-canvas-container, #world') && h && h.kind === 'place' && h.id === i) return { x: X, y: Y, n: p.n }; } return null; });
    out.tie = { found: !!pl };
    if (pl) { const p1 = await page.evaluate(() => document.querySelector('#jr .jr-r img').src); await page.mouse.click(pl.x, pl.y); await sleep(900); out.tie = await page.evaluate(([p0, n]) => { const f = window.__da.JR.sel.fig || { nodes: [] }; return { found: true, tied: f.nodes.length === 1 && f.nodes[0].n === n, j: window.__da.prefs.journey, view: window.__da.S.view, redrawn: document.querySelector('#jr .jr-r img').src !== p0 }; }, [p1, pl.n]); }
  }
  await press('#view .vs-make');
  /* 3: PRINT: the label maker at half its size, the receipt on the strip, its words typed on it, its code to scan */
  await page.waitForFunction(() => window.__da.prefs.journey === 3 && window.__da.S.view === 2 && window.__da.zineObjects().some(o => o.daKind === 'code'), null, { timeout: 20000 }); await sleep(1400);
  out.s3 = await page.evaluate(() => { const da = window.__da; const dev = document.querySelector('#view .simple-p .dev').getBoundingClientRect(); const objs = da.zineObjects(); const s = da.S.signals.find(x => x.key === da.JR.key) || {};
    return { h: Math.round(dev.height), w: Math.round(dev.width), kinds: objs.map(o => o.daKind).join(), sel: !!document.querySelector('#view .jp-sel'), hero: Math.round(document.querySelector('#view .jp-sel').getBoundingClientRect().width), print: document.querySelectorAll('#view [data-pout="send"]').length, lcd: document.querySelectorAll('#view #tp-words, #view .tp-lcd').length, flip: document.querySelectorAll('[data-flip]').length, note: s.note, jr: !!s.jr, code: s.code, src: objs.find(o => o.daKind === 'code').getSrc(), caret: !!document.querySelector('#jr-caret:not([hidden])'), cleared: !da.JR.sel && !da.JR.want && !(da.JR.acts || []).length }; });
  out.s3.qr = await qrIn(out.s3.src); out.s3.src = out.s3.src.length;
  /* and off the screen itself, at the size it shows, as a phone held up to it would */
  const cr = await page.evaluate(() => { const da = window.__da; const c = da.zineObjects().find(o => o.daKind === 'code'); const up = document.querySelector('#zine .upper-canvas'); const r = up.getBoundingClientRect(); const z = r.width / 320; const desk = document.querySelector('#zine .desk'); desk.scrollTop = Math.max(0, c.top * z - 40); const r2 = up.getBoundingClientRect(); return { x: Math.max(0, r2.left), y: Math.max(0, r2.top + c.top * z), width: Math.min(r2.width, innerWidth - r2.left), height: Math.min(c.getScaledHeight() * z, innerHeight - (r2.top + c.top * z)) }; });
  try { const png = await page.screenshot({ clip: cr, animations: 'disabled' }); const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); let q = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    /* a camera sees the screen finer than its pixels: read again at twice the size if the first read misses */
    if (!q) { const u = await sharp(png).resize(info.width * 2, info.height * 2, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); q = jsQR(new Uint8ClampedArray(u.data), u.info.width, u.info.height); }
    out.s3.screen = q ? q.data === out.s3.qr : false; out.s3.px = Math.round(cr.width); } catch (e) { out.s3.screen = String(e.message).slice(0, 60); }
  out.s3.unpacked = out.s3.qr ? await page.evaluate(q => { try { const s = window.__da.unpackSignal(q.split('#x=')[1]); return { code: s.code, note: s.note, n: s.pin.cn, tied: s.nodes.length }; } catch (e) { return null; } }, out.s3.qr) : null;
  out.s3.keys = await page.evaluate(() => ({ sheet: document.querySelectorAll('#view .jp-sel .jp-stk').length, aa: !!document.querySelector('#view [data-tp="reset"]') && !document.querySelector('#view [data-jwords]'), undo: !!document.querySelector('#view [data-tp="undo"]'), zoom: !!document.querySelector('#view [data-tp="zoom"]') }));
  /* words are typed on the receipt itself: a press on its caret */
  await page.waitForSelector('#jr-caret:not([hidden])', { timeout: 8000 }).catch(() => {}); await press('#jr-caret'); await sleep(300); await page.keyboard.type('Back at dusk'); await sleep(700);
  out.words = await page.evaluate(() => { const w = window.__da.zineObjects().find(o => o.daKind === 'words'); const c = window.__da.zineObjects().find(o => o.daKind === 'code'); return { text: w.text, below: c.top > w.top + w.getScaledHeight() }; });
  await shot(page, `${tag}3-print.png`);
  /* SELECT, the hero: the lives first, then stickers, nothing confusing; a life chosen lands on the receipt, the code kept clear on top */
  await press('#view .jp-sel'); await page.waitForSelector('#pick:not([hidden]) [data-pk-k]', { timeout: 10000 }); await sleep(400);
  out.pick = await page.evaluate(() => ({ simple: document.querySelector('#pick').classList.contains('simple'), tabs: [...document.querySelectorAll('#pick [data-pk-tab]')].map(b => b.dataset.pkTab + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(), lives: document.querySelectorAll('#pick [data-pk-k="L"], #pick [data-pk-k="W"]').length, made: document.querySelectorAll('#pick [data-pk-k="X"], #pick [data-pk-k="S"]').length }));
  const n0 = await page.evaluate(() => window.__da.zineObjects().length);
  await press('#pick [data-pk-k="L"]'); await page.waitForFunction(n0 => window.__da.zineObjects().length > n0, n0, { timeout: 12000 }).catch(() => {}); await sleep(600);
  out.placed = await page.evaluate(n0 => { const o = window.__da.zineObjects(); return { more: o.length === n0 + 1, top: o[o.length - 1].daKind }; }, n0);
  await shot(page, `${tag}4-select.png`);
  await press('#pick [data-pk-x]'); await sleep(300);
  /* 4: printed: everything opens; the print waits to print, the hero of the showcase; no glass rings for the steps it met */
  await page.evaluate(() => { const da = window.__da; window.__rw = 0; const r = da.snd.reward; da.snd.reward = (...a) => { window.__rw++; return r.apply(da.snd, a); }; });
  await press('#view [data-pout="send"]');
  await page.waitForFunction(() => window.__da.prefs.journey === 4 && window.__da.S.view === 3 && !!document.querySelector('#gallery .gl-vfd b'), null, { timeout: 20000 }); await sleep(1800);
  out.s4 = await page.evaluate(() => { const da = window.__da; return { rewards: window.__rw, card: (c => (c ? { name: c.name, intel: da.cardIntel(c) } : null))(da.deck().find(x => x.kind === 'poster')), gc: (document.querySelector('#gallery .gc-b b') || {}).textContent || '', simple: da.simple(), cls: document.body.classList.contains('simple'), waiting: document.querySelector('#gallery').classList.contains('waiting'), led: !!document.querySelector('#gallery .gl-st:not(.done)'), vfd: document.querySelector('#gallery .gl-vfd').textContent, hero: (() => { const tr = document.querySelector('#gallery .gl-track'); const i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); const im = document.querySelector(`#gallery .gl-slide[data-i="${i}"] img`); return !!im && im.src === (da.POSTERS2[0] || {}).img; })(), tabs: [...document.querySelectorAll('#rail .tab')].filter(t => getComputedStyle(t).visibility !== 'hidden').length, phonePane: document.body.classList.contains('pane-main'), strip: da.zineObjects().length, pstory: da.PRESS.story,
    board: (() => { try { const k = JSON.parse(localStorage.getItem('da.board.' + da.boardId())); return ((k && k.json && k.json.objects) || []).filter(o => o.daKind === 'receipt').length; } catch (e) { return -1; } })() }; });
  await shot(page, `${tag}5-showcase.png`);
  out.still = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const d0 = document.querySelector('#gallery .gl-deck'); const tr = document.querySelector('#gallery .gl-track'); const v0 = document.querySelector('#gallery .gl-vfd').textContent; tr.scrollTo({ left: 0 }); await wait(1600); return { same: d0 === document.querySelector('#gallery .gl-deck') && d0.isConnected, moved: document.querySelector('#gallery .gl-vfd').textContent !== v0 }; });
  out.flip = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); da.setView(0); await wait(600); const f0 = document.querySelectorAll('#view [data-flip]').length; da.setView(2); await wait(800); return [f0, document.querySelectorAll('#view [data-flip]').length, !!document.querySelector('#view .simple-p .jp-sel') && !!document.querySelector('#view .simple-p .up-lora') && !!document.querySelector('#view .simple-p .up-plate')]; });
  /* the first board, opened on the studio side of W.I.S.H.: its template, and what the first visit made already in W */
  out.tpl = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); da.setView(1); await wait(500); if (da.faceOf(1) === 'front') { document.querySelector('#view [data-flip]').click(); await wait(1800); }
    const o = da.boardObjects(); const txt = o.filter(x => x.text).map(x => x.text).join('|'); const made = o.filter(x => x.daKind === 'receipt' || x.daKind === 'print');
    const res = { id: da.boardId(), sections: o.filter(x => x.daKind === 'section').length, codec: o.filter(x => x.daKind === 'codec').length, keys: ['W ·', 'I ·', 'S ·', 'H ·', 'HOW THIS BOARD WORKS'].concat(txt.includes('make it real') ? ['make it real'] : []).filter(k => !txt.includes(k)), made: made.length, inW: made.every(x => x.left < 340 && x.top < 460) };
    da.CFG.template = 'W · WHAT WE SAW\nCounts and maps.\n\n140.85 · NOTE\nA note to write on.'; const w = da.tplWords(); res.words = [w.W[0], w.NOTE[1], w.HOW[0]]; da.CFG.template = '';
    document.querySelector('#view [data-flip]').click(); await wait(800); return res; });
  /* the radio sounds on once everything is open; and when a phone leaves its sound broken (running, nothing coming out), the
     next touch builds it again instead of waiting for a reload */
  const heard = () => page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); let ok = 0; const s = da.snd, o = s.ping; s.ping = (...a) => { const r = o.apply(s, a); if (r) ok++; return r; };
    for (let i = 0; i < 60 && !ok; i++) await wait(250); s.ping = o; return { ok, run: s.running(), radio: da.S.radio }; });
  await page.evaluate(() => window.__da.setView(0)); await sleep(600);
  out.snd0 = await heard();
  out.sick = await page.evaluate(() => { const s = window.__da.snd; s.__sicken(); return !s.running(); });
  await press('#view .rd-grille', { force: true }); await sleep(500);
  out.snd1 = await heard();
  return out;
}
if (run('journey')) try {
  /* at a desk's width */
  const ctx = await newCtx(); await wire(ctx, { first: true, journey: true }); await ctx.addInitScript(() => { window.__noStart = true; }); const page = await ctx.newPage(); watch(page, 'journey');
  /* the veil's own life, timed in the page: when the test first sees it depends on how long the page takes to load */
  await ctx.addInitScript(() => { window.__veil = {}; new MutationObserver(() => { const on = !!document.getElementById('jr-veil'); const t = performance.now(); if (on && !window.__veil.add) window.__veil.add = t; if (!on && window.__veil.add && !window.__veil.rm) window.__veil.rm = t; }).observe(document, { childList: true, subtree: true }); });
  await page.goto('https://oan.test/studio'); const v0 = Date.now();
  /* the veil first: small words alone over the map as it loads, gone by themselves */
  const vq = await page.waitForSelector('#jr-veil .jv-q', { timeout: 40000 }).then(el => el.textContent()).catch(() => ''); const v1 = Date.now();
  await page.waitForSelector('#jr-veil', { state: 'detached', timeout: 20000 }).catch(() => {}); const vt = await page.evaluate(() => Math.round((window.__veil.rm || 0) - (window.__veil.add || 0)));
  check('a first visit opens on a veil over the map: small words alone, What have you noticed?, held a few seconds and gone by itself', vq === 'What have you noticed?' && vt >= 3000 && vt < 12000, JSON.stringify({ vq, vt, load: v1 - v0 }));
  await ready(page); await settle(page); await sleep(1200);
  const d = await walkJourney(page, 'j-');
  check('a first visit: the map alone, no page, no rail, no radar; a sonar where life gathers says where to touch; no printer shown until one is online, and the map not opened on one', d.s0.j === 0 && d.s0.cls && !d.s0.placed && !d.s0.panel && !d.s0.rail && d.s0.sonar && d.s0.printers && d.s0.start < 50 && d.s0.pickles > 400, JSON.stringify(d.s0));
  check('the sound in one deep key at one tempo: LIFE after Boadicea (a choir for a cluster, a depth charge for a life in danger), COMMUNITY dust, WATER a falling sub, POLLUTION a low stab; El Niño turns the radar twice as fast and drives the heat, its notes still on the beat', d.snd.moods === 'boa,dust,weight,stab' && d.snd.t0 === 1 && d.snd.t1 === 2 && d.snd.hot, JSON.stringify(d.snd));
  check('a touch on the map: the radar lands where it fell, 500 m across its reach, and plays; the radio comes up at half its height with its switch, grille, play and knobs, no jellyfish; only RADIO on the rail', d.s1.r === 500 && d.s1.placed && d.s1.off < 30 && d.s1.radio && d.s1.h <= 150 && d.s1.inView && d.s1.flip === 0 && d.s1.keys === 4 && d.s1.play && d.s1.nino && d.s1.tabs.join() === 'true,false,false,false', JSON.stringify(d.s1));
  { const f = d.fixed || {}; check('the intention device holds its size: a long intention scrolls in its two-line screen with an arrow on the glass, and the device and its make key stay where they were', f.same && f.scroll && f.arrow, JSON.stringify(f)); }
  { const r = d.roll || {}; check('the receipt rolls up into its clip, pinned where its head hung, and the map is clear but for what is held; another life touched changes it while it stays rolled, the ring and the screen with it; the strip lets it down as it was', r.roll && r.roll.fold && r.roll.sg === 'none' && r.roll.h <= 56 && Math.abs(r.roll.ft - r.ft0) <= 4 && r.roll.aria === 'false' && r.roll.held && r.roll.same && r.other && r.changed && r.changed.sel && r.changed.fold && r.changed.now && r.unroll && !r.unroll.fold && !r.unroll.zoom && r.unroll.list && r.unroll.h > 200, JSON.stringify(r)); }
  check('a life touched opens W.I.S.H. over the map itself, the life still marked on the ground: its receipt as intel with no code on it, the intention device as small as the radio, old kit modded but not yet upgraded, no SELECT key; the suggestions closed behind a tab until the device\'s key opens them, six of one size and no small print; W.I.S.H. now on the rail', d.spot && d.s2.sel && !d.s2.offMap && d.s2.mapSeen && d.s2.qr === null && d.s2.rcpt.h > 200 && d.s2.dev.h <= 150 && Math.abs(d.s2.dev.w - d.s1.w) <= 40 && d.s2.modded && d.s2.select === 0 && d.s2.flip === 0 && d.s2.closed.list && d.s2.closed.tab === 'false' && d.s2.closed.key && d.s2.closed.held && d.s2.opened.list && d.s2.opened.tab === 'true' && d.s2.acts === 6 && d.s2.same && !d.s2.small && d.s2.actFont >= 11 && d.s2.tabs.join() === 'true,true,false,false', JSON.stringify(d.s2));
  check('what W.I.S.H. holds stays in sight: the map slides it clear of the receipt, the suggestions and the device', d.s2.closed.clear, JSON.stringify(d.s2.closed));
  check('what is made goes on the board too: the receipt waits on the studio side of W.I.S.H. once everything is open', d.s4.board === 1, JSON.stringify({ board: d.s4.board }));
  check('suggestions are taken up as many as wanted, each onto the receipt with its fact, the intention left as typed; the receipt shows what is typed as it is typed', d.story.acts.length === 2 && d.story.on === 2 && d.story.field === '' && d.story.next && d.story.signal === 2 && d.typed.want === 'Water out for the flying-foxes' && d.typed.redrawn, JSON.stringify({ story: d.story, typed: d.typed }));
  check('a place touched near the life on W.I.S.H. is tied to it, a connection on its receipt, and travels in its code', d.tie.tied && d.tie.j === 2 && d.tie.view === 1 && d.tie.redrawn && !!d.s3.unpacked && d.s3.unpacked.tied === 1, JSON.stringify({ tie: d.tie, unpacked: d.s3.unpacked }));
  check('make: PRINT opens with a label maker half the size, SELECT its hero and no form; the receipt on the strip, then its words, then its code, which a phone reads as the receipt itself, off the screen too', d.s3.screen === true && d.s3.h <= 170 && d.s3.w <= 340 && d.s3.sel && d.s3.hero >= 120 && d.s3.print === 1 && d.s3.lcd === 0 && d.s3.flip === 0 && d.s3.kinds === 'base,ink,words,code' && d.s3.jr && d.s3.caret && /^https:\/\/novel\.global\/#x=/.test(d.s3.qr || '') && !!d.s3.unpacked && d.s3.unpacked.code === d.s3.code && d.s3.unpacked.note === 'Water out for the flying-foxes', JSON.stringify(d.s3));
  check('PRINT on a first visit is a dongle: a sheet of stickers for some bling, a key to start again and one closer, words and photographs from SELECT or typed on the receipt itself, the code moving down to stay under them', d.s3.keys.sheet >= 1 && d.s3.keys.aa && d.s3.keys.undo && d.s3.keys.zoom && d.words.text === 'Back at dusk' && d.words.below, JSON.stringify({ keys: d.s3.keys, words: d.words }));
  check('SELECT on a first visit: the lives first, then the stickers, nothing made yet to confuse; a life chosen lands on the receipt and the code stays on top', d.pick.simple && d.pick.tabs === 'lives*,stick' && d.pick.lives >= 3 && d.pick.made === 0 && d.placed.more && d.placed.top === 'code', JSON.stringify({ pick: d.pick, placed: d.placed }));
  const waiting = (await admin('stories?status=waiting')).stories.filter(x => x.code === d.s3.code);
  check('a line: once its receipt goes to PRINT, W.I.S.H. is clear for what is noticed next; once printed, PRINT is clear too, the print kept on the wall', d.s3.cleared && d.s4.strip === 0 && d.s4.pstory === null && d.s4.hero, JSON.stringify({ cleared: d.s3.cleared, strip: d.s4.strip, pstory: d.s4.pstory, hero: d.s4.hero }));
  check('everything opened answers with the chord alone: no glass rings for the steps the first visit met', d.s4.rewards === 0, JSON.stringify({ rewards: d.s4.rewards }));
  check('the print\'s card carries its poster: the life, the day it was made and its intel, on its back too; the showcase holds still as it slides, its number changing, its screen not drawn again', !!d.s4.card && d.s4.card.name === d.s2.name && /\d\d\.\d\d\.\d\d/.test(d.s4.card.intel) && d.s4.gc === String(d.s2.name || '').toUpperCase() && d.still.same && d.still.moved, JSON.stringify({ card: d.s4.card, gc: d.s4.gc, name: d.s2.name, still: d.still }));
  check('print: it goes to novel.global\'s printer through approval, and is the hero of the showcase, waiting to print, its light amber; everything is open, every device upgraded with its jellyfish key and LoRa antenna, PRINT the same dongle', !d.s4.simple && !d.s4.cls && d.s4.waiting && d.s4.led && /№ 001/.test(d.s4.vfd) && /WAITING/.test(d.s4.vfd) && d.s4.hero && d.s4.tabs === 4 && waiting.length === 1 && d.flip[0] === 1 && d.flip[1] === 1 && d.flip[2], JSON.stringify({ s4: d.s4, flip: d.flip, waiting: waiting.length }));
  await page.reload(); await ready(page); await sleep(800);
  const again = await page.evaluate(() => ({ j: window.__da.prefs.journey, simple: window.__da.simple(), cls: document.body.classList.contains('simple'), tabs: [...document.querySelectorAll('#rail .tab')].filter(t => getComputedStyle(t).visibility !== 'hidden').length }));
  check('the first board opens on its template: a box for each of W, I, S and H and how the board works beside them, nothing under it, and what the first visit made already in W; the words as rewritten on the approval page', d.tpl.id !== 'b00' && d.tpl.sections === 4 && d.tpl.codec === 0 && !d.tpl.keys.length && d.tpl.made >= 1 && d.tpl.inW && d.tpl.words.join('|') === 'W · WHAT WE SAW|A note to write on.|HOW THIS BOARD WORKS', JSON.stringify(d.tpl));
  check('the radio keeps sounding once everything is open; broken as a phone can leave it, the next touch brings the sound back without a reload', d.snd0.ok >= 1 && d.snd0.run && d.snd0.radio && d.sick && d.snd1.ok >= 1 && d.snd1.run, JSON.stringify({ snd0: d.snd0, sick: d.sick, snd1: d.snd1 }));
  check('done once on this device, it stays done', again.j === 4 && !again.simple && !again.cls && again.tabs === 4, JSON.stringify(again));
  /* Settings plays it again, from the bare map; nothing made is lost */
  const posters = await page.evaluate(() => window.__da.POSTERS2.length);
  await page.evaluate(() => window.__da.setView(3)); await sleep(800); await tap(page, '#ix-journey'); await sleep(300); await tap(page, '#ix-journey'); await page.waitForNavigation({ timeout: 20000 }).catch(() => {}); await ready(page); await sleep(800);
  const rp = await page.evaluate(() => ({ j: window.__da.prefs.journey, j0: document.body.classList.contains('j0'), posters: window.__da.POSTERS2.length, sel: window.__da.JR.sel }));
  check('Settings plays the first visit again from the bare map, and what was made stays', rp.j === 0 && rp.j0 && rp.posters === posters && !rp.sel, JSON.stringify(rp));
  for (const x of (await admin('stories?status=waiting')).stories.filter(y => y.code === d.s3.code)) await admin(`stories/${x.id}`, { action: 'delete' });
  await ctx.close();
  /* at a phone's width: the same way through, each device on its rail, what it holds in view above it */
  const pc = await newCtx({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await wire(pc, { first: true, journey: true }); await pc.addInitScript(() => { window.__noStart = true; }); const pp = await pc.newPage(); watch(pp, 'journey-phone');
  await pp.goto('https://oan.test/studio');
  const pv = await pp.waitForSelector('#jr-veil .jv-q', { timeout: 40000 }).then(() => true).catch(() => false); const tv0 = Date.now();
  await pp.tap('#jr-veil').catch(() => {}); await pp.waitForSelector('#jr-veil', { state: 'detached', timeout: 8000 }).catch(() => {}); const tv = Date.now() - tv0;
  check('on a phone the veil goes at a touch', pv && tv < 4800, JSON.stringify({ pv, tv }));
  await ready(pp); await settle(pp); await sleep(1200);
  const p = await walkJourney(pp, 'jp-', true);
  const layout = p.s2.rcpt.b <= p.s2.actBox.t + 2 && p.s2.actBox.b <= p.s2.dev.t + 2 && p.s2.rcpt.t >= 0 && p.s2.dev.r <= 390 && p.s2.dev.l >= 0 && p.s2.actBox.l >= 8 && p.s2.closed.clear;
  check('on a phone: the map alone, then the radio rides its rail at half its height, RADIO alone on the bar', p.s0.j === 0 && !p.s0.panel && !p.s0.rail && p.s1.r === 500 && p.s1.h <= 150 && p.s1.inView && p.s1.flip === 0 && p.s1.tabs.join() === 'true,false,false,false', JSON.stringify({ s0: p.s0, s1: p.s1 }));
  { const f = p.fixed || {}; check('on a phone the intention device holds its size: a long intention scrolls in its two-line screen with an arrow on the glass, the device, its make key and its place on the rail where they were', f.same && f.scroll && f.arrow, JSON.stringify(f)); }
  { const r = p.roll || {}; check('on a phone the W.I.S.H. tab lowers the device to its lip and rolls the receipt up with it, the map in full, the held life still ringed; the tab, the strip or a touch on its head brings both back, the device where it was', r.lo && r.lo.main && r.lo.fold && r.lo.h <= 56 && r.lo.above && r.lo.low && r.lo.held && !r.lo.focus && r.up && !r.up.main && !r.up.fold && Math.abs(r.up.t - r.t0) <= 2 && r.strip && !r.strip.main && !r.strip.fold && r.head && !r.head.main && !r.head.fold && !r.head.focus && Math.abs(r.head.t - r.t0) <= 2, JSON.stringify(r)); }
  check('on a phone W.I.S.H. holds the receipt over the map, the suggestions under it and the intention device under them, nothing over anything', p.spot && p.s2.qr === null && p.s2.acts === 6 && p.s2.same && p.s2.select === 0 && p.s2.modded && layout, JSON.stringify(p.s2));
  check('on a phone PRINT: the receipt, its words typed on it, its code read by a phone off the screen; SELECT the hero; printed, the showcase holds it waiting, and everything opens', p.s3.screen === true && p.s3.h <= 170 && p.s3.kinds === 'base,ink,words,code' && /^https:\/\/novel\.global\/#x=/.test(p.s3.qr || '') && p.words.text === 'Back at dusk' && p.pick.tabs === 'lives*,stick' && p.placed.more && !p.s4.simple && p.s4.waiting && p.s4.phonePane && p.s4.tabs === 4 && p.flip[0] === 1, JSON.stringify({ s3: p.s3, words: p.words, pick: p.pick, s4: p.s4, flip: p.flip }));
  check('on a phone nothing spills sideways at any gate', await pp.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0);
  for (const x of (await admin('stories?status=waiting')).stories.filter(y => y.code === p.s3.code)) await admin(`stories/${x.id}`, { action: 'delete' });
  await pc.close();
  /* the easter egg: the tiny NOVEL.GLOBAL in the information corner, pressed twice, opens everything at once */
  const ec = await newCtx(); await wire(ec, { first: true, journey: true }); await ec.addInitScript(() => { window.__noStart = true; }); const ep = await ec.newPage(); watch(ep, 'journey-egg');
  await ep.goto('https://oan.test/studio'); await ep.waitForSelector('#jr-veil', { state: 'detached', timeout: 15000 }).catch(() => {}); await ready(ep); await sleep(800);
  await tap(ep, '.maplibregl-ctrl-attrib-button'); await sleep(300); await ep.dblclick('.da-egg'); await sleep(1500);
  const egg = await ep.evaluate(() => ({ j: window.__da.prefs.journey, simple: window.__da.simple(), open: window.__da.S.open, flip: document.querySelectorAll('#view [data-flip]').length, tabs: [...document.querySelectorAll('#rail .tab')].filter(t => getComputedStyle(t).visibility !== 'hidden').length }));
  check('the easter egg: NOVEL.GLOBAL in the information corner, pressed twice, opens everything at once', egg.j === 4 && !egg.simple && egg.open && egg.flip === 1 && egg.tabs === 4, JSON.stringify(egg));
  /* a link someone was sent skips the bare map: the radio is there, tuned where the link was made */
  await ep.evaluate(() => localStorage.clear());
  await ep.goto('https://oan.test/studio?fresh=2#mix=-37.7712,144.9601,750,121000010128'); await ready(ep, '', true); await sleep(2500);
  const ln = await ep.evaluate(() => ({ j: window.__da.prefs.journey, open: window.__da.S.open, radio: !!document.querySelector('#view .simple-r .dev'), lat: +window.__da.S.scan.lat.toFixed(4), r: window.__da.S.scan.r, panel: getComputedStyle(document.querySelector('#panel')).display !== 'none' }));
  check('a link someone was sent skips the bare map: the small radio is there, tuned where the link was made', ln.j === 1 && ln.open && ln.radio && ln.panel && ln.lat === -37.7712 && ln.r === 750, JSON.stringify(ln));
  await ec.close();
} catch (e) { results.push(`FAIL  section journey: ${e.message.split('\n')[0]}`); }

// ───────── the radar: moved, resized, kept ─────────
if (run('radar')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'radar');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page); await sleep(400);
  const scrXY = (la, ln) => page.evaluate(([la, ln]) => { const da = window.__da; const p = da.map.project([ln, la]); const r = da.map.getContainer().getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; }, [la, ln]);
  await page.evaluate(() => { const da = window.__da; da.life.reveal(); window.__song = null; const o = da.snd.song; da.snd.song = seq => { window.__song = seq; return o.call(da.snd, seq); }; });
  const kd = await (await page.$('#knob')).boundingBox(); await page.mouse.click(kd.x + kd.width / 2, kd.y + kd.height / 2); await sleep(300);
  const sg = await page.evaluate(() => ({ notes: (window.__song || []).length, sing: document.querySelector('#knob').classList.contains('sing'), dot: getComputedStyle(document.querySelector('#knob'), '::before').width, hit: Math.round(document.querySelector('#knob').getBoundingClientRect().width) }));
  check('the centre is a small dot with a full-size touch, and a tap on it plays what the radar holds', sg.notes > 0 && sg.sing && parseFloat(sg.dot) <= 8 && sg.hit >= 34, JSON.stringify(sg));
  const s0 = await page.evaluate(() => ({ ...window.__da.S.scan }));
  const t = { la: s0.lat - 0.0042, ln: s0.lng + 0.0045 }; const [tx, ty] = await scrXY(t.la, t.ln);
  await page.mouse.click(tx, ty); await sleep(1400);
  const s1 = await page.evaluate(() => ({ ...window.__da.S.scan }));
  check('a tap outside the radar moves it there', Math.abs(s1.lat - t.la) < 0.0006 && Math.abs(s1.lng - t.ln) < 0.0006, `${JSON.stringify(s0)} → ${JSON.stringify(s1)}`);
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('da.prefs') || '{}').scan);
  check('the radar is kept where it was left', kept && Math.abs(kept.lat - s1.lat) < 0.0002, JSON.stringify(kept));
  const pr = await page.evaluate(() => { const da = window.__da; return da.life.items.filter(it => da.life.seen().has(it.o.id) && !it.inS).length; });
  check('what the radar left behind is no longer shown', pr === 0, String(pr));
  await settle(page);
  const rb = await (await page.$('#ring')).boundingBox(); await page.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2); await page.mouse.down(); await page.mouse.move(rb.x + rb.width / 2 + 140, rb.y + rb.height / 2, { steps: 10 }); await page.mouse.up(); await sleep(400);
  const r1 = await page.evaluate(() => window.__da.S.scan.r);
  check('dragging the rim widens its reach', r1 > s1.r + 100 && r1 <= 1500, `${s1.r} → ${r1}`);
  const wide = await page.evaluate(() => { const da = window.__da; const ins = da.life.items.filter(i => i.inS); return { inside: ins.length, seen: ins.filter(i => da.life.seen().has(i.o.id)).length }; });
  check('a wider reach shows all it holds at once, without waiting for the hand', wide.inside > 0 && wide.seen === wide.inside, JSON.stringify(wide));
  const rb2 = await (await page.$('#ring')).boundingBox(); const kc = await (await page.$('#knob')).boundingBox(); await page.mouse.move(rb2.x + rb2.width / 2, rb2.y + rb2.height / 2); await page.mouse.down(); await page.mouse.move(kc.x + kc.width / 2 + 6, kc.y + kc.height / 2, { steps: 10 }); await page.mouse.up(); await sleep(300);
  check('the reach stops at its least', await page.evaluate(() => window.__da.S.scan.r) === 250);
  const kb = await (await page.$('#knob')).boundingBox(); await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2); await page.mouse.down(); await page.mouse.move(kb.x + kb.width / 2 - 160, kb.y + kb.height / 2 + 60, { steps: 10 }); await page.mouse.up(); await sleep(400);
  const s2 = await page.evaluate(() => ({ ...window.__da.S.scan }));
  check('dragging the centre moves the radar with it', s2.lng < s1.lng - 0.001 && s2.lat < s1.lat, `${JSON.stringify(s1)} → ${JSON.stringify(s2)}`);
  await page.focus('#knob'); await page.keyboard.press('ArrowUp'); await sleep(300);
  const s3 = await page.evaluate(() => ({ ...window.__da.S.scan }));
  check('the arrow keys move it too', s3.lat > s2.lat + 0.0004, `${s2.lat} → ${s3.lat}`);
  const [ix, iy] = await scrXY(s3.lat + 0.0006, s3.lng + 0.0004);
  await page.evaluate(() => window.__da.life.reveal());
  await page.mouse.click(ix, iy); await sleep(1400);
  const sc4 = await page.evaluate(() => ({ ...window.__da.S.scan, mode: window.__da.S.mode }));
  check('a short click inside the radar glides it there, and places nothing', !sc4.mode && Math.abs(sc4.lat - (s3.lat + 0.0006)) < 0.0003 && Math.abs(sc4.lng - (s3.lng + 0.0004)) < 0.0003, JSON.stringify(sc4));
  const [hx, hy] = await scrXY(sc4.lat + 0.0005, sc4.lng - 0.0006);
  await page.mouse.move(hx, hy); await page.mouse.down(); await sleep(900); await page.mouse.up(); await sleep(600);
  check('only a long press makes a new record', await page.evaluate(() => window.__da.S.mode) === 'place');
  await tap(page, '#r-back'); await sleep(500);
  check('back from placing returns to the bare radar', await page.evaluate(() => !window.__da.S.mode && document.body.classList.contains('shut')));
  /* a life alone under the pointer where it is drawn, looked for without the side effects of a press; closer in if none is */
  const [rid, rx, ry] = await page.evaluate(async () => { const da = window.__da; const find = () => { da.life.reveal(); const r = da.map.getContainer().getBoundingClientRect(); const it = da.life.items.find(i => i.inS && da.life.shown(i) && !i.binned && (i.pile || 0) < 2 && typeof i.o.id === 'number' && !i.o.hum && i.x > 60 && i.y > 60 && i.x < r.width - 60 && i.y < r.height - 60 && (() => { const h = da.life.hit(i.x + (i.dx || 0), i.y + (i.dy || 0), true); return h && h.kind === 'cell' && h.id === i.o.id; })()); return it ? [it.o.id, it.x + (it.dx || 0) + r.left, it.y + (it.dy || 0) + r.top] : null; };
    let f = find(); if (!f) { da.map.jumpTo({ center: [da.S.scan.lng, da.S.scan.lat], zoom: 16.4 }); await new Promise(res => setTimeout(res, 1200)); f = find(); } return f || [null, 0, 0]; });
  await page.mouse.click(rx, ry, { button: 'right' }); await sleep(1200);
  check('a right-click on a life opens it', await page.evaluate(id => window.__da.S.mode === 'ping' && window.__da.S.sel === id, rid));
  await page.keyboard.press('Escape'); await sleep(600);
  await page.reload(); await ready(page); await sleep(500);
  const s4 = await page.evaluate(() => ({ ...window.__da.S.scan }));
  check('after a reload the radar is where it was left', Math.abs(s4.lat - sc4.lat) < 0.0002 && s4.r === 250, JSON.stringify(s4));
  await ctx.close();
} catch (e) { results.push(`FAIL  section radar: ${e.message.split('\n')[0]}`); }

/* a cell inside the radar near the most places, opened by a click on its icon */
const openNear = async page => {
  const id = await page.evaluate(() => { const da = window.__da; da.life.reveal(); const its = da.life.items.filter(it => it.inS && da.life.shown(it) && typeof it.o.id === 'number' && !it.o.hist && !it.o.hum && it.b.tone !== 'flora' && it.b.tone !== 'cold'); its.sort((a, b) => da.bizNear(b.lat, b.lng, 300).length - da.bizNear(a.lat, a.lng, 300).length); return its[0] && its[0].o.id; });
  await page.evaluate(id => { const da = window.__da; const o = da.S.byId.get(id); da.map.jumpTo({ center: [o.lng, o.lat], zoom: 15.6 }); }, id); await settle(page); await sleep(400);
  const [x, y] = await xy(page, id); await page.mouse.click(x, y); await sleep(1600);
  return id;
};
const nodeXY = (page, key) => page.evaluate(k => { const da = window.__da; const n = da.strings.pos(k); const r = da.map.getContainer().getBoundingClientRect(); return n ? [n.x + r.left, n.y + r.top] : null; }, key);
const fig = page => page.evaluate(() => ({ e: window.__da.strings.fig.e.length, end: window.__da.strings.fig.end, prev: !!window.__da.strings.fig.prev }));

// ───────── strings: looked at first, tied, carried on, cut, untied, your own, outside, kept ─────────
const clickNode = async (page, k) => { const p = await nodeXY(page, k); await page.mouse.click(p[0], p[1]); await sleep(300); };
/* a point on the ground with nothing on it: inside the open cell's radius, or outside it */
const bareXY = (page, inside) => page.evaluate(inside => { const da = window.__da; const o = da.S.byId.get(da.S.sel); const R = da.rangeOf(o); const r = da.map.getContainer().getBoundingClientRect(); const right = r.width - (innerWidth >= 760 ? 460 : 20);
  for (const k of inside ? [0.55, 0.4, 0.7] : [1.6, 2.2, 1.3]) for (let a = 0; a < 360; a += 15) { const la = o.lat + Math.cos(a * Math.PI / 180) * R * k / 111320, ln = o.lng + Math.sin(a * Math.PI / 180) * R * k / (111320 * Math.cos(o.lat * Math.PI / 180)); const p = da.map.project([ln, la]); if (p.x < 40 || p.y < 40 || p.x > right || p.y > r.height - 40) continue; if (!da.life.hit(p.x, p.y)) return [p.x + r.left, p.y + r.top]; }
  return null; }, inside);
if (run('strings')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'strings');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  const id = await openNear(page);
  const card = await page.evaluate(() => { const da = window.__da; const img = document.querySelector('#r-img'); return { mode: da.S.mode, face: da.face(), open: !document.body.classList.contains('shut'), photo: !img.hidden && img.naturalWidth > 0, figH: document.querySelector('#r-fig').getBoundingClientRect().height, name: document.querySelector('#r-name').textContent, threat: document.querySelector('#r-threat').textContent, chips: document.querySelectorAll('#r-chips .c').length, knob: document.querySelector('#knob').hidden }; });
  check('a click on a life opens its card: the photograph large, the name, the threat, the chips', card.mode === 'ping' && card.face === 'front' && card.open && card.photo && card.figH >= 260 && card.name && card.threat.length > 8 && card.chips >= 2 && card.knob, JSON.stringify(card));
  const sw0 = await page.evaluate(() => window.__da.life.sweep); await sleep(1200);
  check('the sweep stops while a cell is open', await page.evaluate(() => window.__da.life.sweep) === sw0);
  const nodes = await page.evaluate(() => { const ns = [...window.__da.strings.nodes.values()]; const biz = ns.filter(n => n.t === 'biz'); return { all: ns.length, biz: biz.map(n => n.key), listed: biz.filter(n => n.cur).length, fams: [...new Set(biz.map(n => n.fam))], harm: biz.filter(n => (n.harm || []).length).length, kinds: [...new Set(ns.map(n => n.t))] }; });
  check('inside its radius the human ecology is knots: places listed by name and from the map, in their parts', nodes.biz.length >= 3 && nodes.listed >= 1 && nodes.fams.length >= 3 && nodes.kinds.includes('pin'), JSON.stringify({ ...nodes, biz: nodes.biz.length }));
  const [k1, k2, k3] = nodes.biz;
  await clickNode(page, k1);
  const pk = await page.evaluate(() => { const da = window.__da; const c = document.querySelector('#peek'); const r = c.getBoundingClientRect(); return { peeked: da.strings.peeked, card: !c.hidden && r.width > 150, buttons: [...c.querySelectorAll('button')].map(b => b.dataset.pk || b.className), words: c.innerText.split(/\s+/).length, name: (c.querySelector('.pk-nm') || {}).textContent, score: !!c.querySelector('.pk-snd svg'), e: da.strings.fig.e.length, mode: da.S.mode, inMap: r.left >= 0 && r.right <= innerWidth - 400 }; });
  check('a click looks at a knot first: its name and one line, no notes, nothing to press', pk.peeked === k1 && pk.card && pk.buttons.every(b => b === 'close') && pk.name && !pk.score && pk.words <= 34 && pk.e === 0 && pk.mode === 'ping' && pk.inMap, JSON.stringify(pk));
  await shot(page, '10-peek.png');
  await clickNode(page, k1); let f = await fig(page);
  check('the same knot again joins it', f.e === 1 && f.end === k1, JSON.stringify(f));
  const z0 = await page.evaluate(() => window.__da.map.getZoom());
  const p2 = await nodeXY(page, k2); await page.mouse.dblclick(p2[0], p2[1]); await sleep(600); f = await fig(page);
  const z1 = await page.evaluate(() => window.__da.map.getZoom());
  check('a double-click joins too, and the map stays put', f.e === 2 && f.end === k2 && Math.abs(z1 - z0) < 0.01, JSON.stringify({ ...f, z0, z1 }));
  check('the card counts the strings', await page.evaluate(() => document.querySelector('#r-strings .st-n b').textContent) === '2');
  await clickNode(page, k1); await clickNode(page, k1); f = await fig(page);
  check('a joined knot, twice, carries on from there', f.e === 2 && f.end === k1, JSON.stringify(f));
  await clickNode(page, k3); await clickNode(page, k3); f = await fig(page);
  const tied3 = f.e === 3 && f.end === k3;
  await clickNode(page, k3); f = await fig(page);
  check('the last knot, clicked again, cuts its string', tied3 && f.e === 2 && f.end === k1, JSON.stringify(f));
  const p3 = await nodeXY(page, k3); await page.mouse.click(p3[0], p3[1], { button: 'right' }); await sleep(300); f = await fig(page);
  const rj = f.e === 3 && f.end === k3;
  const p2b = await nodeXY(page, k2); await page.mouse.click(p2b[0], p2b[1], { button: 'right' }); await sleep(300); f = await fig(page);
  check('a right-click joins a knot at once, and on a joined knot lets it go', rj && f.e === 2 && f.end === k3 && !(await page.evaluate(k => window.__da.strings.inFig(k), k2)), JSON.stringify(f));
  const kept1 = await page.evaluate(() => (JSON.parse(localStorage.getItem('da.figs.v1') || '{}')[window.__da.S.sel] || { e: [] }).e.length);
  check('what the right button joins is kept', kept1 === 2, String(kept1));
  const hotStr = await page.evaluate(k => { const da = window.__da; const n = da.strings.nodes.get(k); return { harm: (n.harm || []).length > 0 }; }, k3);
  const gp0 = await bareXY(page, true); await page.mouse.click(gp0[0], gp0[1], { button: 'right' }); await sleep(700);
  const rc = await page.evaluate(() => ({ mode: window.__da.S.mode, shut: document.body.classList.contains('shut'), ghost: !!window.__da.strings.ghost, place: !!window.__da.S.place }));
  check('a right-click on open ground backs out to the radar, keeping the figure', !rc.mode && rc.shut && !rc.ghost && !rc.place && (await page.evaluate(() => (JSON.parse(localStorage.getItem('da.figs.v1') || '{}')[Object.keys(JSON.parse(localStorage.getItem('da.figs.v1') || '{}'))[0]] || { e: [] }).e.length)) === 2, JSON.stringify({ rc, hotStr }));
  await page.evaluate(id => window.__da.select(id), id); await sleep(1400); f = await fig(page);
  await tap(page, '#r-strings [data-st="undo"]'); await sleep(200); f = await fig(page);
  check('undo takes back the last string', f.e === 1 && f.end === k1, JSON.stringify(f));
  await clickNode(page, k2); await clickNode(page, k2); f = await fig(page);
  await tap(page, '#r-strings [data-st="reset"]'); await sleep(200); const fr = await fig(page);
  check('cut all leaves nothing joined, and can be brought back', f.e === 2 && fr.e === 0 && fr.prev, JSON.stringify(fr));
  await tap(page, '#r-strings [data-st="restore"]'); await sleep(200); f = await fig(page);
  check('bring back restores the figure', f.e === 2, JSON.stringify(f));
  await page.evaluate(() => { document.querySelector('#r-strings details').open = true; }); await sleep(200);
  const row = await page.evaluate(() => { const r = [...document.querySelectorAll('#r-strings .nrow')].find(b => !b.classList.contains('on')); r.click(); return r.dataset.node; }); await sleep(400);
  const lr = await page.evaluate(() => ({ peeked: window.__da.strings.peeked, e: window.__da.strings.fig.e.length, pk: !!document.querySelector('#r-strings .nrow.pk') }));
  check('a knot in the list is looked at first', lr.peeked === row && lr.e === 2 && lr.pk, JSON.stringify(lr));
  await page.evaluate(k => document.querySelector(`#r-strings [data-tie="${CSS.escape(k)}"]`).click(), row); await sleep(300); f = await fig(page);
  check('its string button joins it', f.e === 3 && f.end === row, JSON.stringify(f));
  await page.keyboard.press('Escape'); await sleep(200);
  check('Esc steps back from looking before it closes anything', await page.evaluate(() => window.__da.S.mode === 'ping'));
  await page.evaluate(() => window.__da.strings.unpeek()); await sleep(200);
  const gp = await bareXY(page, true);
  await page.mouse.click(gp[0], gp[1]); await sleep(400);
  const gh = await page.evaluate(() => !!window.__da.strings.ghost);
  await page.mouse.click(gp[0], gp[1]); await sleep(500);
  const form = await page.evaluate(() => !!document.querySelector('#pk-new'));
  await page.fill('#pk-n', 'Side gate tap'); await page.click('#peek [data-kind="place"]'); await page.click('#pk-new .pk-main'); await sleep(400);
  const own = await page.evaluate(() => { const s = window.__da.strings; const ks = Object.keys(s.fig.c); return { n: ks.length, peeked: s.peeked, key: ks[0], name: ks[0] && s.fig.c[ks[0]].n, row: !!document.querySelector(`#r-strings [data-node="${CSS.escape(ks[0] || '')}"]`) }; });
  check('open ground inside the radius takes a knot of your own', gh && form && own.n === 1 && own.peeked === own.key && own.name === 'Side gate tap' && own.row, JSON.stringify({ gh, form, ...own }));
  await clickNode(page, own.key); f = await fig(page);
  check('your own knot joins like any other', f.e === 4 && f.end === own.key, JSON.stringify(f));
  /* the ledger: who in the radius sells or leaves what harms this life, and who can help */
  const lg = await page.evaluate(() => { const el = document.querySelector('#r-ledger'); const rows = [...el.querySelectorAll('[data-lg]')]; return { shown: !el.hidden, heads: [...el.querySelectorAll('h4')].map(h => h.textContent), rows: rows.map(r => ({ k: r.dataset.lg, n: +r.dataset.n, t: r.querySelector('span').textContent })) }; });
  const harmRows = lg.rows.filter(r => !r.k.startsWith('fam:'));
  check('the card counts plainly who in the radius sells or leaves what harms this life, and who can help', lg.shown && lg.rows.length >= 2 && lg.rows.every(r => r.n >= 1 && /^[a-z]/.test(r.t)) && (harmRows.length ? /HARM IT/.test(lg.heads[0]) && harmRows.every(r => /^(sell|leave|light|wash|spray)/.test(r.t)) : true) && lg.heads.some(h => /CAN HELP/.test(h)), JSON.stringify(lg));
  const target = harmRows[0] || lg.rows[0]; const e0 = (await fig(page)).e;
  const pending = await page.evaluate(k => { const s = window.__da.strings; const L = s.ledgerOf(); const ks = k.startsWith('fam:') ? (L.help.find(([f]) => 'fam:' + f === k) || [0, []])[1] : (L.harm.find(([r]) => r === k) || [0, []])[1]; return ks.filter(x => !s.inFig(x)).length; }, target.k);
  await page.evaluate(k => document.querySelector(`#r-ledger [data-lg="${CSS.escape(k)}"]`).click(), target.k); await sleep(400);
  const fo = await page.evaluate(() => ({ focus: window.__da.strings.focus, on: !!document.querySelector('#r-ledger .lg-row.on') }));
  await page.evaluate(k => document.querySelector(`#r-ledger [data-lg="${CSS.escape(k)}"]`).click(), target.k); await sleep(1200); f = await fig(page);
  const allIn = await page.evaluate(k => !!document.querySelector(`#r-ledger [data-lg="${CSS.escape(k)}"].in`), target.k);
  check('a row once lights those places; twice, joins them all to the life', fo.focus === target.k && fo.on && f.e === e0 + pending && allIn, JSON.stringify({ fo, e0, e: f.e, pending, n: target.n, allIn }));
  await shot(page, '11-ledger.png');
  await page.evaluate(() => window.__da.map.jumpTo({ zoom: 14.4 })); await settle(page); await sleep(400);
  const outId = await page.evaluate(() => { const da = window.__da; const o = da.S.byId.get(da.S.sel); const R = da.rangeOf(o); const r = da.map.getContainer().getBoundingClientRect();
    const it = da.life.items.find(i => i.o.id !== o.id && da.life.shown(i) && !i.o.hist && !i.o.ob && !i.o.story && !da.isCold(i.o) && !i.binned && da.haversine(o.lat, o.lng, i.lat, i.lng) > R + 40 && da.haversine(o.lat, o.lng, i.lat, i.lng) < 1400 && i.x > 50 && i.y > 50 && i.x < r.width - 480 && i.y < r.height - 50 && (() => { const h = da.life.hit(i.x, i.y); return h && h.kind === 'cell' && h.id === i.o.id; })());
    return it ? it.o.id : null; });
  if (outId != null) {
    const [ox, oy] = await xy(page, outId); await page.mouse.click(ox, oy); await sleep(400);
    const po = await page.evaluate(() => ({ sel: window.__da.S.sel, peeked: window.__da.strings.peeked, buttons: [...document.querySelectorAll('#peek button')].map(b => b.dataset.pk) }));
    check('a life outside the radius is looked at, and the cell keeps its focus', po.sel === id && po.peeked === 'x:' + outId && po.buttons.every(b => b === 'open' || b === 'close'), JSON.stringify(po));
    const [ox2, oy2] = await xy(page, outId); await page.mouse.click(ox2, oy2, { button: 'right' }); await sleep(700);
    const bi = await page.evaluate(k => ({ node: window.__da.strings.nodes.has(k), tied: window.__da.strings.inFig(k), sel: window.__da.S.sel }), 'o:' + outId);
    check('a right-click on it widens the radius to take it in, and joins it', bi.node && bi.tied && bi.sel === id, JSON.stringify(bi));
  } else check('a life outside the radius is looked at, and the cell keeps its focus', false, 'none on screen');
  await shot(page, '12-strings.png');
  /* every figure is a constellation: named, kept, listed on NOW, traced */
  await page.fill('#con-n', 'Side gate web'); await page.press('#con-n', 'Tab'); await sleep(300);
  const before = await fig(page);
  await page.reload(); await ready(page); await settle(page);
  await page.evaluate(id => window.__da.select(id), id); await sleep(1200); f = await fig(page);
  const ownKept = await page.evaluate(() => ({ c: Object.keys(window.__da.strings.fig.c).length, name: document.querySelector('#con-n').value, born: !!window.__da.strings.fig.born }));
  check('the figure, its name and the knot of your own are kept for the cell', f.e === before.e && ownKept.c === 1 && ownKept.name === 'Side gate web' && ownKept.born, JSON.stringify({ f, ownKept }));
  await page.evaluate(() => { const s = window.__da.strings; s.peek(Object.keys(s.fig.c)[0]); }); await sleep(200);
  await page.keyboard.press('Delete'); await sleep(400);
  const del = await page.evaluate(() => ({ c: Object.keys(window.__da.strings.fig.c).length, e: window.__da.strings.fig.e.length }));
  check('Delete removes a knot of your own', del.c === 0 && del.e < f.e, JSON.stringify(del));
  const op = await bareXY(page, false);
  await clickNode(page, k1); await page.mouse.click(op[0], op[1]); await sleep(500);
  const st = await page.evaluate(() => ({ mode: window.__da.S.mode, peeked: window.__da.strings.peeked }));
  check('a click outside the radius closes only what is looked at; the cell stays open', st.mode === 'ping' && !st.peeked, JSON.stringify(st));
  await page.keyboard.press('Escape'); await sleep(600);
  check('Esc closes the cell and the sweep goes on', await page.evaluate(() => !window.__da.S.mode && document.body.classList.contains('shut')));
  await tab(page, 1); await sleep(600);
  const knots = await page.evaluate(() => [...document.querySelectorAll('#rail .tab')].map(t => t.classList.contains('tied')).join());
  check('a string tied ties the second knot on the thread', knots === 'true,true,false,false', knots);
  const cons = await page.evaluate(() => [...document.querySelectorAll('#sec-cons li.con')].map(li => ({ name: li.querySelector('.nm b').textContent, chart: !!li.querySelector('.con-chart svg path'), play: !!li.querySelector('[data-con-play]'), trace: !!li.querySelector('[data-con-trace]') })));
  check('SIGNALS lists the constellations as they form, each with its chart, its song and its story', cons.length >= 1 && cons[0].name === 'Side gate web' && cons[0].chart && cons[0].play && cons[0].trace, JSON.stringify(cons));
  await shot(page, '13-signals-cons.png');
  await page.evaluate(() => { window.__songs = 0; const da = window.__da; const o = da.snd.song; da.snd.song = seq => { window.__songs++; return o.call(da.snd, seq); }; });
  await page.click('#sec-cons [data-con-play]'); await sleep(300);
  check('a constellation plays as a song from the list', await page.evaluate(() => window.__songs) >= 1);
  await page.click('#sec-cons [data-con-trace]'); await sleep(1700);
  const tr = await page.evaluate(id => ({ sel: window.__da.S.sel, tracing: window.__da.strings.tracing, cap: (document.querySelector('#trace') || {}).innerText || '', shown: !document.querySelector('#trace').hidden }), id);
  check('its story is traced on the ground, string by string, in the order it formed', tr.sel === id && tr.tracing && tr.shown && /^\d+\/\d+/.test(tr.cap) && /→/.test(tr.cap), JSON.stringify(tr));
  await shot(page, '14-trace.png');
  await ctx.close();
} catch (e) { results.push(`FAIL  section strings: ${e.message.split('\n')[0]}`); }

// ───────── places: the listed places stand without OpenStreetMap, and a failed answer is never kept ─────────
if (run('places')) try {
  const ctx = await newCtx(); await wire(ctx, { overpass: false }); const page = await ctx.newPage(); watch(page, 'places');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  const pl = await page.evaluate(async () => { const da = window.__da; const P = da.PLACES; const lib = P.find(p => /Brunswick Library/.test(p.n)) || P[0];
    da.map.jumpTo({ center: [lib.lng, lib.lat], zoom: 15.6 }); const o = da.life.items.map(i => i.o).filter(o => typeof o.id === 'number' && !o.hum && !o.hist).sort((a, b) => da.haversine(a.lat, a.lng, lib.lat, lib.lng) - da.haversine(b.lat, b.lng, lib.lat, lib.lng))[0];
    da.select(o.id); await new Promise(r => setTimeout(r, 2500));
    const biz = [...da.strings.nodes.values()].filter(n => n.t === 'biz');
    return { listed: P.length, near: biz.length, allListed: biz.every(n => n.cur), withSite: biz.filter(n => n.url).length, state: da.S.bizState, tiles: Object.keys(JSON.parse(localStorage.getItem('da.tiles.v5') || '{}')).length, fams: [...new Set(P.map(p => p.cat))].sort() }; });
  check('with OpenStreetMap unreachable, the places listed by name still stand around a life, each with its site', pl.listed >= 50 && pl.near >= 1 && pl.allListed && pl.withSite === pl.near && pl.state === 'off', JSON.stringify(pl));
  check('a failed answer is not kept', pl.tiles === 0, JSON.stringify(pl));
  check('the list covers every part of the human ecology', ['artists', 'brand', 'circular', 'network', 'third'].every(f => pl.fams.includes(f)), JSON.stringify(pl.fams));
  const pk = await page.evaluate(async () => { const da = window.__da; const n = [...da.strings.nodes.values()].find(x => x.t === 'biz' && x.url); da.strings.peek(n.key); await new Promise(r => setTimeout(r, 300)); const a = document.querySelector('#peek a.pk-nm'); return { href: a && a.href, url: n.url, line: (document.querySelector('#peek .pk-line') || {}).textContent }; });
  check('a listed place links to its own site from its name', pk.href && pk.href.replace(/\/$/, '') === pk.url.replace(/\/$/, '') && pk.line, JSON.stringify(pk));
  await ctx.close();
} catch (e) { results.push(`FAIL  section places: ${e.message.split('\n')[0]}`); }

/* the four lines filled by hand, then issued */
/* the four lines on the receipt are off unless asked for */
const wishLinesOn = page => page.evaluate(() => { const b = document.querySelector('#w-wtog'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
const fillAndIssue = async page => {
  await wishLinesOn(page); for (const k of ['w', 'i', 's', 'h']) await page.fill('#w-' + k, `A line for ${k}`);
  await tap(page, '#r-alt'); await page.waitForFunction(() => window.__da.face() === 'signal', null, { timeout: 15000 }); await sleep(600);
};
/* each knot looked at, then tied */
const tieNodes = async (page, keys) => { for (const k of keys) { await clickNode(page, k); await clickNode(page, k); } };

// ───────── the slip: its photograph and statement changeable, four blank lines, chosen before it is issued ─────────
if (run('wish')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'wish');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  await openNear(page);
  const btn = await page.evaluate(async () => { const da = window.__da; const b = document.querySelector('#r-act'); const out = { label: b.getAttribute('aria-label'), words: (b.querySelector('.hw') || {}).textContent || '', go: b.classList.contains('go'), bg: getComputedStyle(b).backgroundColor }; const n0 = da.SPECIES.length; b.click(); await new Promise(r => setTimeout(r, 700)); out.sent = da.SPECIES.length - n0 === 1 || da.SPECIES[0].id === String(da.S.sel); out.face = da.face(); return out; });
  check('the card leads on with no words: its species card goes to the WISH MAKER, in orange; the card stays open', btn.label === 'To the WISH maker' && !btn.words.trim() && btn.go && btn.bg === 'rgb(255, 122, 0)' && btn.sent && btn.face === 'front', JSON.stringify(btn));
  const ks = await page.evaluate(() => [...window.__da.strings.nodes.values()].filter(n => n.t === 'biz').slice(0, 3).map(n => n.key));
  await tieNodes(page, ks);
  const mini = await page.evaluate(() => { const c = document.querySelector('#st-print'); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let ink = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 100) ink++; return { w: c.width, h: c.height, ink }; });
  check('the card shows the print the figure will make, small', mini && mini.ink > 200, JSON.stringify(mini));
  const NOTE = 'A bowl of water by the side gate';
  await page.fill('#r-note', NOTE); await sleep(400);
  const nt = await page.evaluate(() => { const n = document.querySelector('#r-note'); return { last: document.querySelector('#r-front').lastElementChild === n, shown: !n.hidden && n.getBoundingClientRect().height > 30, kept: JSON.parse(localStorage.getItem('da.notes.v1') || '{}') }; });
  check('notes sit just above NOTICED, kept on this device', nt.last && nt.shown && Object.values(nt.kept).includes(NOTE), JSON.stringify(nt));
  await page.evaluate(() => { const da = window.__da; da.toWish(da.S.byId.get(da.S.sel)); }); await sleep(1400);
  const w0 = await page.evaluate(() => ({ face: window.__da.face(), main: document.querySelector('#r-act .hw').textContent, values: ['w', 'i', 's', 'h'].map(k => document.querySelector('#w-' + k).value), max: ['w', 'i', 's', 'h'].map(k => document.querySelector('#w-' + k).maxLength), ph: ['w', 'i', 's', 'h'].map(k => document.querySelector('#w-' + k).placeholder), letters: document.querySelectorAll('#w-slip .sl-wish label, #w-slip .sl-wish b').length, sug: document.querySelectorAll('#w-sug, #r-wish [data-s], #r-wish select').length, life: document.querySelector('#w-slip .sl-life b').textContent, site: document.querySelector('#w-slip .sl-meta dd').textContent, code: document.querySelector('#w-slip .sl-code').textContent, off: document.querySelector('#w-slip').classList.contains('wish-off'), alt: (document.querySelector('#r-alt .mono') || {}).textContent }));
  check('it turns over to the receipt: the four lines of 48 there but off until asked for; TO THE BOARD lays it on the board, STORY issues it', w0.face === 'wish' && w0.main === 'W.I.S.H.' && w0.off && w0.alt === 'PRINT' && w0.values.every(v => v === '') && w0.max.every(m => m === 48) && /^What we know/.test(w0.ph[0]) && /^It would be great/.test(w0.ph[1]) && /^So let's create/.test(w0.ph[2]) && /^Here is how it works/.test(w0.ph[3]) && !w0.letters && !w0.sug && w0.life.length > 5 && /-37\.\d{4} 144\.\d{4}/.test(w0.site) && w0.code === 'DA-····', JSON.stringify(w0));
  /* the photograph: black and white, changeable, or none */
  const im0 = await page.evaluate(() => { const c = document.querySelector('#w-img'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const vals = new Set(); for (let i = 0; i < d.length; i += 4 * 97) vals.add(d[i] === d[i + 1] && d[i + 1] === d[i + 2] ? d[i] : -1); return { w: c.width, h: c.height, vals: [...vals].sort((a, b) => a - b), n: document.querySelector('#w-imgn').textContent, cap: document.querySelector('#w-cap').textContent, ratio: c.getBoundingClientRect().height / c.getBoundingClientRect().width }; });
  check('the slip opens with the photograph in black and white, credited, with no figure number', im0.w > 100 && im0.vals.length <= 2 && !im0.vals.includes(-1) && !/FIG/.test(im0.cap) && /iNaturalist/i.test(im0.cap) && im0.ratio > 0.7, JSON.stringify(im0));
  const nOf = await page.evaluate(() => window.__da.imgList(window.__da.S.byId.get(window.__da.S.sel)).length);
  if (nOf > 1) { await tap(page, '#w-imgs [data-img="next"]'); await sleep(900); }
  const im1 = await page.evaluate(() => ({ n: document.querySelector('#w-imgn').textContent, kept: JSON.parse(localStorage.getItem('da.img.v1') || '{}')[window.__da.S.sel] }));
  check('another photograph can be chosen, and the choice is kept', nOf < 2 || (im1.n.startsWith('2/') && im1.kept && im1.kept.k === 'inat'), JSON.stringify({ nOf, ...im1 }));
  await tap(page, '#w-imgs [data-img="none"]'); await sleep(300);
  const none = await page.evaluate(() => ({ none: document.querySelector('#w-fig').classList.contains('none'), img: getComputedStyle(document.querySelector('#w-img')).display }));
  await tap(page, '#w-imgs [data-img="none"]'); await sleep(900);
  const back = await page.evaluate(() => !document.querySelector('#w-fig').classList.contains('none'));
  check('or none, and back again', none.none && none.img === 'none' && back, JSON.stringify({ ...none, back }));
  /* the statement: rewritten here, or as it was */
  const st0 = await page.evaluate(() => ({ v: document.querySelector('#w-st').value, reset: !document.querySelector('#w-st-reset').hidden, dflt: window.__da.stDefault(window.__da.S.byId.get(window.__da.S.sel)) }));
  check('the statement is there to be rewritten: two full sentences for this life', st0.v === st0.dflt && st0.v.length > 80 && (st0.v.match(/\. /g) || []).length >= 1 && !st0.reset, JSON.stringify(st0));
  const ST = 'Nine shops in reach sell what washes into its drain.';
  await page.fill('#w-st', ST); await sleep(300);
  const st1 = await page.evaluate(() => ({ reset: !document.querySelector('#w-st-reset').hidden, kept: JSON.parse(localStorage.getItem('da.st.v1') || '{}')[window.__da.S.sel] }));
  check('a statement rewritten is kept for this life, with a way back', st1.reset && st1.kept === ST, JSON.stringify(st1));
  await tap(page, '#w-st-reset'); await sleep(300);
  const st2 = await page.evaluate(() => ({ v: document.querySelector('#w-st').value, kept: JSON.parse(localStorage.getItem('da.st.v1') || '{}')[window.__da.S.sel] }));
  check('and set back as it was', st2.v === st0.v && st2.kept === undefined, JSON.stringify(st2));
  await page.fill('#w-st', ST); await sleep(300);
  const kn = await page.evaluate(() => [...document.querySelectorAll('#w-knots li')].map(li => ({ on: li.querySelector('[data-inc]').checked, name: li.querySelector('[data-lb]').value, word: li.querySelector('small').textContent, no: li.querySelector('.kn-i').textContent })));
  check('the slip lists the relations joined, numbered, each ticked and named with what it does', kn.length === 3 && kn.every((k, i) => k.on && k.name && k.word && k.no === String(i + 1).padStart(2, '0')), JSON.stringify(kn));
  await page.uncheck('#w-knots li:nth-child(2) [data-inc]'); await page.fill('#w-knots li:nth-child(1) [data-lb]', 'The corner shop'); await sleep(400);
  const nn = await page.evaluate(() => ({ note: document.querySelector('#w-note-t').value, on: document.querySelector('#w-note-on').checked }));
  check('the note comes across, ticked to print', nn.note === NOTE && nn.on, JSON.stringify(nn));
  await wishLinesOn(page); await page.fill('#w-h', ''); await page.type('#w-h', 'x'.repeat(60));
  check('a line stops at 48 characters', (await page.evaluate(() => document.querySelector('#w-h').value.length)) === 48);
  await page.evaluate(() => { document.querySelector('#r-scroll').scrollTop = 0; });
  await shot(page, '20-wish.png');
  await fillAndIssue(page);
  const s = await page.evaluate(() => { const da = window.__da; const s = da.S.signals[0]; const fig = document.querySelector('#s-slip .sl-fig'); const body = document.querySelector('#s-slip .sl-body'); const img = document.querySelector('#s-slip .sl-img');
    return { face: da.face(), code: s.code, mine: s.mine, lines: s.lines, nodes: s.nodes.map(n => n.n), edges: s.edges.length, note: s.note, threat: s.threat, img: s.img, letters: document.querySelectorAll('#s-slip .sl-wish b, #s-slip .sl-wish label').length, poem: [...document.querySelectorAll('#s-slip .sl-wish li')].map(li => li.textContent), slipNote: (document.querySelector('#s-slip .sl-note') || {}).textContent, hash: location.hash, qr: !!document.querySelector('#s-slip .sl-qr svg'),
      fig: fig && { h: fig.offsetHeight, w: fig.offsetWidth, body: body.offsetHeight, dithered: /^data:image\/png/.test(img.src), cap: fig.querySelector('.sl-cap').textContent }, rel: [...document.querySelectorAll('#s-slip .sl-rel li')].map(li => li.querySelector('b').textContent + ' ' + li.querySelector('span').textContent), fig2: !!document.querySelector('#s-slip .sl-fig2 svg'), noFig: !/FIG\.|NORTH UP/.test(document.querySelector('#s-slip').innerText), chartFirst: document.querySelector('#s-slip .sl-rel').firstElementChild.classList.contains('sl-fig2') }; });
  check('issued: the code, the four lines with no letters, the knots chosen and renamed, the statement rewritten, the note', s.face === 'signal' && /^DA-[0-9A-HJKMNP-TV-Z]{4}$/.test(s.code) && s.mine && Object.values(s.lines).every(Boolean) && s.nodes.length === 2 && s.nodes[0] === 'The corner shop' && s.edges === 2 && s.note === NOTE && s.threat === ST && !s.letters && s.poem[0] === 'A line for w' && /^NOTE\s+/.test(s.slipNote) && s.slipNote.endsWith(NOTE) && s.hash === '#' + s.code && s.qr, JSON.stringify(s));
  check('set as an archive record: the photograph in black and white, credited, as tall as the slip under it; the figure above the relations it numbers; no FIG. or NORTH UP', s.img && s.img.k === 'inat' && s.fig && s.fig.dithered && s.fig.h >= s.fig.w * 0.8 && s.fig.h >= Math.min(s.fig.body, s.fig.w * 1.2) - 2 && /iNaturalist/.test(s.fig.cap) && s.rel[0] === '01 The corner shop' && s.fig2 && s.noFig && s.chartFirst, JSON.stringify({ img: s.img, fig: s.fig, rel: s.rel, noFig: s.noFig, chartFirst: s.chartFirst }));
  const story = await page.evaluate(() => ({ groups: [...document.querySelectorAll('#s-slip .sl-rel li[data-g]')].map(li => li.dataset.g), harm: [...document.querySelectorAll('#s-slip .sl-rel li.harm small')].map(x => x.textContent), nums: [...document.querySelectorAll('#s-slip .sl-fig2 svg text')].map(t => t.textContent), dashed: !!document.querySelector('#s-slip .sl-fig2 svg path[stroke-dasharray]') }));
  check('the relations tell the story: what harms it first, in plain words; every point numbered in FIG. 2', /^HARM · 1/.test(story.groups[0]) && /^(sells|leaves|lights|washes|sprays) /.test(story.harm[0]) && story.nums.join(',') === '1,2' && story.dashed, JSON.stringify(story));
  const link = await qrOf(page, '#s-slip .sl-qr');
  check('the slip carries the whole signal in its code, linked to the live site', !!link && link.startsWith('https://novel.global/#x='), String(link).slice(0, 80));
  await shot(page, '21-signal.png');
  await tap(page, '#r-back'); await sleep(600);
  check('back from the signal returns to its card', await face(page) === 'front');
  await page.evaluate(() => window.__da.closeRecord()); await page.evaluate(() => window.__da.setView(3)); await sleep(500);
  const top = await page.evaluate(() => { const r = document.querySelector('#sec-board .sig-row'); return { code: r.querySelector('.code').textContent, ex: r.classList.contains('ex'), count: document.querySelector('#sec-board .lab').textContent }; });
  check('the board shows it first, above the examples', top.code === s.code && !top.ex && +String(top.count).replace(/\D/g, '') === 2, JSON.stringify(top));
  const ctx2 = await newCtx(); await wire(ctx2); const p2 = await ctx2.newPage(); watch(p2, 'wish-recv');
  await p2.goto(link); await ready(p2); await sleep(2200);
  const rv = await p2.evaluate(code => { const da = window.__da; const s = da.S.signals.find(x => x.code === code); const img = document.querySelector('#s-slip .sl-img'); return { have: !!s, recv: s && s.recv, mode: da.S.mode, face: da.face(), lines: s && s.lines.h, note: s && s.note, threat: s && s.threat, img: s && s.img && s.img.k, shown: !!img && /^data:image\/png/.test(img.src) }; }, s.code);
  check('the link opens the signal on another device, received, with its statement, its photograph and its note', rv.have && rv.recv && rv.mode === 'ping' && rv.face === 'signal' && rv.lines === s.lines.h && rv.note === NOTE && rv.threat === ST && rv.img === 'inat' && rv.shown, JSON.stringify(rv));
  await ctx2.close();
  await ctx.close();
} catch (e) { results.push(`FAIL  section wish: ${e.message.split('\n')[0]}`); }

// ───────── outputs: a slip, a mesh message, a pager line, two images, raw bytes ─────────
if (run('outputs')) try {
  const ctx = await newCtx({ acceptDownloads: true }); await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://oan.test' }); await wire(ctx); const page = await ctx.newPage(); watch(page, 'outputs');
  await page.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  await openNear(page);
  const ks = await page.evaluate(() => [...window.__da.strings.nodes.values()].filter(n => n.t === 'biz').slice(0, 2).map(n => n.key));
  await tieNodes(page, ks);
  const cn = await page.evaluate(() => { const c = window.__da.strings.list()[0]; return c ? c.name : ''; });
  check('a constellation, once more than the life alone, is named for what it holds: the place, the life, its shape', /^The \S+ \S+ (Tie|Line|Kite|Crown|Net|Web)$/.test(cn), cn);
  await page.evaluate(() => { const da = window.__da; da.toWish(da.S.byId.get(da.S.sel)); }); await sleep(800); await fillAndIssue(page);
  const code = await page.evaluate(() => window.__da.S.signals[0].code);
  await tap(page, '#s-out [data-out="mesh"]'); await sleep(400);
  const mesh = await page.evaluate(() => document.querySelector('#s-text').textContent); const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check('MESH: 200 bytes at most, the code first, the four lines without their letters, copied', Buffer.byteLength(mesh) <= 200 && mesh.startsWith(code) && clip.replace(/\r\n/g, '\n') === mesh && /\nA line for w\n/.test(mesh) && /\nA line for h$/.test(mesh) && !/\n[WISH] /.test(mesh), `${Buffer.byteLength(mesh)} B`);
  await tap(page, '#s-out [data-out="pager"]'); await sleep(300);
  const pager = await page.evaluate(() => document.querySelector('#s-text').textContent);
  check('PAGER: 80 plain characters at most', pager.length <= 80 && /^[\x20-\x7E]+$/.test(pager) && pager.startsWith(code), pager);
  const dl = async sel => { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click(sel)]); const f = `${SHOTS}/${d.suggestedFilename()}`; await d.saveAs(f); return f; };
  const bits = await dl('#s-out [data-out="bits"]'); const bm = await sharp(bits).metadata(); const braw = await sharp(bits).greyscale().raw().toBuffer();
  const bset = new Set(braw); check('1-BIT: 384 dots wide, black and white only', bm.width === 384 && bset.size <= 2, `${bm.width}×${bm.height} · ${[...bset].join(',')}`);
  let dark = 0; for (let y = 60; y < 340; y++) for (let x = 0; x < 384; x++) if (braw[y * 384 + x] < 128) dark++; const share = dark / (280 * 384);
  check('1-BIT: the photograph dithered at the head of the slip, half of it', share > 0.08 && share < 0.92 && bm.height > 384 * 0.8 * 2, `${(share * 100).toFixed(0)}% ink · ${bm.height} rows`);
  const gb = await dl('#s-out [data-out="gb"]'); const gm = await sharp(gb).metadata(); const graw = await sharp(gb).greyscale().raw().toBuffer();
  const gset = new Set(graw); check('GB: 160 pixels wide, four greys', gm.width === 160 && gset.size <= 4, `${gm.width}×${gm.height} · ${[...gset].join(',')}`);
  const bin = fs.readFileSync(await dl('#s-out [data-out="escpos"]'));
  const hasQR = bin.includes(Buffer.from([0x1D, 0x28, 0x6B])); check('ESC/POS: initialise, the slip, a QR code, a cut', bin[0] === 0x1B && bin[1] === 0x40 && hasQR && bin.slice(-4).equals(Buffer.from([0x1D, 0x56, 0x42, 0x00])) && bin.includes(Buffer.from(code)), `${bin.length} bytes`);
  check('ESC/POS: the photograph as raster lines, 48 bytes a row', bin.includes(Buffer.from([0x1D, 0x76, 0x30, 0x00, 48, 0])) && bin.length > 48 * 300, `${bin.length} bytes`);
  const refs = await page.evaluate(() => [...document.querySelectorAll('#s-out .out-w')].map(w => ({ k: w.querySelector('[data-out]').dataset.out, icon: !!w.querySelector('.out svg use'), ref: (w.querySelector('a.out-ref') || {}).href || '' })));
  check('each machine is drawn as itself and links to what it is, the browser 58 mm print among them', refs.length === 7 && refs.some(r => r.k === 'print') && refs.every(r => r.icon && /^https:\/\//.test(r.ref)) && refs.some(r => /Game_Boy_Printer/.test(r.ref)) && refs.some(r => /meshtastic/.test(r.ref)) && refs.some(r => /escpos/.test(r.ref)), JSON.stringify(refs));
  await tap(page, '#s-out [data-out="link"]'); await sleep(400);
  check('LINK: the whole signal in a link', /#x=[A-Za-z0-9_-]{40,}/.test(await page.evaluate(() => document.querySelector('#s-text').textContent)));
  await tap(page, '#s-out [data-out="print"]'); await page.waitForFunction(() => window.__printed >= 1, null, { timeout: 15000 });
  const pg = await page.evaluate(() => ({ size: (document.querySelector('#page-size') || {}).textContent, text: (window.__lastSlip || {}).text || '' }));
  check('PRINT: a strip 58 mm wide with the code and the four lines', /size:58mm \d+mm/.test(pg.size) && pg.text.includes(code), JSON.stringify(pg).slice(0, 160));
  /* two styles: the paper slip as it was, and the terminal, chosen with > beside PIN: the hero, the code, the name, the lines */
  const t0 = await page.evaluate(async () => { const da = window.__da; const s = da.S.signals[0]; const acts = [...document.querySelectorAll('#s-acts [data-sa]')].map(x => x.dataset.sa);
    return { tty: da.isTty(), acts, cls: document.querySelector('#s-slip').classList.contains('tty'), hero: getComputedStyle(document.querySelector('#s-slip .sl-hero')).display, text: da.slipText(s, 32).split('\n'), btn: document.querySelector('#s-acts [data-sa="style"]').textContent }; });
  check('the paper slip stays as it was until > is chosen, beside PIN', !t0.tty && !t0.cls && t0.hero === 'none' && t0.text[0] === t0.text[0].toUpperCase() && !/^DIRECT|^DA-/.test(t0.text[0]) && t0.text.some(l => /DA-\w{4}/.test(l)) && !t0.text.some(l => /^(CODE|SITE|ISSUED)\b/.test(l)) && t0.text.some(l => /SOVEREIGNTY HAS NEVER BEEN CEDED/.test(l)) && t0.btn === '>' && t0.acts.indexOf('style') === t0.acts.indexOf('pin') + 1, JSON.stringify(t0));
  await tap(page, '#s-acts [data-sa="style"]'); await sleep(1500);
  const t1 = await page.evaluate(async () => { const da = window.__da; const s = da.S.signals[0]; const b58 = await da.escpos(s, '58'); const str = new TextDecoder('latin1').decode(b58); const btn = document.querySelector('#s-acts [data-sa="style"]'); const q = sel => document.querySelector('#s-slip ' + sel); const shown = sel => !!q(sel) && getComputedStyle(q(sel)).display !== 'none';
    const hero = q('.sl-hero').getBoundingClientRect(); const slip = document.querySelector('#s-slip').getBoundingClientRect(); const hi = q('.sl-hi');
    return { tty: da.isTty(), kept: JSON.parse(localStorage.getItem('da.prefs')).slip, pressed: btn.getAttribute('aria-pressed'), btnFont: getComputedStyle(btn).fontFamily, slipFont: getComputedStyle(q('.sl-code')).fontFamily, vt: document.fonts.check('16px VT323'),
      hero: { w: Math.round(hero.width), h: Math.round(hero.height), full: Math.abs(hero.width - slip.width) < 2, img: /^data:image\/png/.test(hi.src || ''), art: q('.sl-hero').classList.contains('art') },
      hidden: ['.sl-threat', '.sl-rel', '.sl-fig'].filter(x => q(x)).every(x => !shown(x)), meta: q('.sl-meta').innerText.trim(), lines: document.querySelectorAll('#s-slip .sl-wish li').length, bg: getComputedStyle(document.querySelector('#s-slip')).backgroundImage,
      text: da.slipText(s, 32).split('\n'), rel: /RELATIONS|SITE/.test(str), rev: b58.some((v, i) => v === 0x1D && b58[i + 1] === 0x42 && b58[i + 2] === 1), rasterFirst: b58.findIndex((v, i) => v === 0x1D && b58[i + 1] === 0x76) < str.indexOf(s.code), cut: [...b58.slice(-4)].join() === '29,86,66,0', code58: str.includes(s.code) }; });
  check('the terminal: > on, in VT323; the slip in VT323 on plain paper', t1.tty && t1.kept === 'tty' && t1.pressed === 'true' && /VT323/.test(t1.btnFont) && /VT323/.test(t1.slipFont) && t1.vt && t1.bg === 'none', JSON.stringify(t1));
  check('the terminal is the most minimal: the life as a hero, square, the width of the slip; its code, name and lines; nothing more', t1.hero.full && Math.abs(t1.hero.w - t1.hero.h) < 2 && (t1.hero.img || t1.hero.art) && t1.hidden && t1.lines === 4 && /^DA-\w{4}$/.test(t1.meta) && !t1.text[0].startsWith('DA-') && t1.text.some(l => /^DA-\w{4} \. \d\d\.\d\d\.\d\d/.test(l)) && t1.text.filter(l => l.startsWith('> ')).length === 4 && !t1.text.some(l => /SITE|WINDOW|RELATIONS/.test(l)), JSON.stringify({ hero: t1.hero, hidden: t1.hidden, meta: t1.meta, lines: t1.lines, text: t1.text }));
  check('the same at the printer: the hero first, then the code, the name, the lines; no bar, no relations', t1.rasterFirst && !t1.rev && !t1.rel && t1.cut && t1.code58, JSON.stringify({ rasterFirst: t1.rasterFirst, rev: t1.rev, rel: t1.rel }));
  const tb = await dl('#s-out [data-out="bits"]'); const tm = await sharp(tb).metadata(); const traw = await sharp(tb).greyscale().raw().toBuffer();
  let heroInk = 0; for (let y = 0; y < 384; y++) for (let x = 0; x < 384; x++) if (traw[y * 384 + x] < 128) heroInk++; const hs = heroInk / (384 * 384);
  check('1-BIT as the terminal: 384 dots, two inks, the hero square across its head', tm.width === 384 && new Set(traw).size <= 2 && hs > 0.05 && hs < 0.95 && tm.height > 384 + 200, `${tm.width}×${tm.height} · hero ${(hs * 100).toFixed(0)}% ink`);
  await tap(page, '#s-acts [data-sa="style"]'); await sleep(700);
  const t2 = await page.evaluate(() => ({ tty: window.__da.isTty(), cls: document.querySelector('#s-slip').classList.contains('tty'), font: getComputedStyle(document.querySelector('#s-slip .sl-code')).fontFamily }));
  check('and back to the paper slip, in its own type', !t2.tty && !t2.cls && /IBM Plex Mono/.test(t2.font), JSON.stringify(t2));
  await page.emulateMedia({ media: 'print' }); const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true }); await page.emulateMedia({ media: 'screen' }); fs.writeFileSync(`${SHOTS}/slip.pdf`, pdf);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length; const box = (pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/) || []).slice(1).map(Number);
  check('the slip prints as one strip, 58 mm wide', pages === 1 && Math.abs(box[0] - 164.4) < 3, `${pages} page · ${box.join('×')} pt`);
  await page.evaluate(() => window.__da.printBlank()); await page.waitForFunction(() => window.__printed >= 2, null, { timeout: 15000 });
  check('a blank slip prints for filling in by hand', await page.evaluate(() => /DA-____/.test(window.__lastSlip.text)));
  const csv = fs.readFileSync(await (async () => { await page.evaluate(() => { window.__da.closeRecord(); window.__da.setView(3); }); await sleep(500); return dl('#sec-tools [data-doc="signals"]'); })(), 'utf8');
  check('the signals download as a table', csv.split('\n').length === 3 && csv.startsWith('code,issued') && csv.includes(code), `${csv.split('\n').length} rows`);
  await ctx.close();
} catch (e) { results.push(`FAIL  section outputs: ${e.message.split('\n')[0]}`); }

// ───────── the board: examples, remix, receiving, removing ─────────
if (run('board')) try {
  const ctx = await newCtx(); await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://oan.test' }); await wire(ctx); const page = await ctx.newPage(); watch(page, 'board');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  await tab(page, 3); await sleep(400);
  await page.click('#sec-board [data-sig="ex:DA-0RNG"]'); await sleep(2200);
  const ex = await page.evaluate(() => { const da = window.__da; const c = da.map.getCenter(); const s = da.S.signals.find(x => x.code === 'DA-0RNG'); return { mode: da.S.mode, sel: da.S.sel, face: da.face(), no: document.querySelector('#r-no').textContent, near: Math.hypot(c.lat - s.pin.lat, c.lng - s.pin.lng) < 0.01, knots: document.querySelectorAll('#s-slip .sl-knots li').length, live: [...da.strings.nodes.keys()].filter(k => k.startsWith('s:DA-0RNG:')).length, marks: da.life.items.filter(i => i.o.code === 'DA-0RNG').length, acts: [...document.querySelectorAll('#s-acts [data-sa]')].map(b => b.dataset.sa).join(' ') }; });
  check('an example opens as one cell, open and live, its slip turned up, marked EX and not removable', ex.mode === 'ping' && ex.sel === 'sp:DA-0RNG' && ex.face === 'signal' && /EX/.test(ex.no) && ex.near && ex.knots === 3 && ex.live === 3 && ex.marks === 1 && ex.acts === 'remix pin style conn', JSON.stringify(ex));
  await settle(page); await clickNode(page, 's:DA-0RNG:a');
  const lk = await page.evaluate(() => ({ peeked: window.__da.strings.peeked, card: !document.querySelector('#peek').hidden }));
  check('its knots can be looked at, like any other', lk.peeked === 's:DA-0RNG:a' && lk.card, JSON.stringify(lk));
  await shot(page, '30-example.png');
  await tap(page, '#s-acts [data-sa="remix"]'); await sleep(1800);
  const rm = await page.evaluate(() => { const da = window.__da; return { sel: da.S.sel, face: da.face(), lines: ['w', 'i', 's', 'h'].map(k => document.querySelector('#w-' + k).value), fig: da.strings.fig.e.length }; });
  check('REMIX opens the slip on the same life with its lines and its figure', rm.sel === 'sp:DA-0RNG' && rm.face === 'wish' && rm.lines.every(Boolean) && rm.fig === 3, JSON.stringify(rm));
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setView(3); }); await sleep(400);
  await tap(page, '#rx-open'); await page.fill('#rx-t', 'DA-TST1 BOGONG MOTH\n-37.7700,144.9600\nW Moths fell 99.5% in three years\nI Dark streets\nS Dark is a habitat.\nH Lights off at close'); await tap(page, '#rx button[type="submit"]'); await sleep(1500);
  const rx = await page.evaluate(() => { const da = window.__da; const s = da.S.signals.find(x => x.code === 'DA-TST1'); return { have: !!s, recv: s && s.recv, mode: da.S.mode, h: s && s.lines.h }; });
  check('RECEIVE takes a mesh message pasted in', rx.have && rx.recv && rx.mode === 'ping' && rx.h === 'Lights off at close', JSON.stringify(rx));
  await page.evaluate(() => window.__da.receive('DA-TST2 GREY-HEADED FLYING-FOX\n-37.7800,144.9500\nCamps cook above 42 degrees\nShade before the heat\nWater is a habitat\nHose the trees at noon')); await sleep(900);
  const rx2 = await page.evaluate(() => { const s = window.__da.S.signals.find(x => x.code === 'DA-TST2'); return s && s.lines; });
  check('and one without letters, line by line', rx2 && rx2.w === 'Camps cook above 42 degrees' && rx2.h === 'Hose the trees at noon', JSON.stringify(rx2));
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setView(3); }); await sleep(400);
  await tap(page, '#rx-open'); await page.fill('#rx-t', ' da-0rng '); await tap(page, '#rx button[type="submit"]'); await sleep(1200);
  const rc = await page.evaluate(() => ({ code: window.__da.S.issued && window.__da.S.issued.code, face: window.__da.face(), mode: window.__da.S.mode }));
  await page.evaluate(() => window.__da.receive('DA-ZZZZ')); await sleep(600);
  const nf = await page.evaluate(() => document.querySelector('#toast').textContent);
  check('RECEIVE takes the code printed on a slip, as it is typed, and says when there is none', rc.code === 'DA-0RNG' && rc.face === 'signal' && rc.mode === 'ping' && /DA-ZZZZ · NOT FOUND/.test(nf), JSON.stringify({ rc, nf }));
  const n0 = await page.evaluate(() => window.__da.S.signals.length);
  const packed = await page.evaluate(() => window.__da.linkOf(window.__da.S.signals.find(x => x.code === 'DA-0RNG')) || '#x=' + window.__da.packSignal(window.__da.S.signals.find(x => x.code === 'DA-0RNG')));
  await page.evaluate(t => window.__da.receive(t), packed); await sleep(900);
  check('a signal already here opens, and is not added twice', await page.evaluate(n => window.__da.S.signals.length === n && window.__da.S.signals.find(x => x.key === window.__da.S.sig).code === 'DA-0RNG', n0));
  await page.evaluate(() => window.__da.receive('hello')); await sleep(300);
  check('anything else is turned away', await page.evaluate(() => document.querySelector('#toast').textContent) === 'NOT A SIGNAL');
  await page.evaluate(() => { const s = window.__da.S.signals.find(x => x.code === 'DA-TST1'); window.__da.openSignal(s.key); }); await sleep(800);
  await tap(page, '#s-acts [data-sa="remove"]'); await sleep(700);
  check('REMOVE takes a received signal off the board', await page.evaluate(() => !window.__da.S.signals.some(x => x.code === 'DA-TST1')));
  await page.evaluate(() => window.__da.closeRecord()); await sleep(400);
  await page.evaluate(() => window.__da.openSignal('ex:DA-0RNG')); await sleep(2200);
  const exp = await page.evaluate(async () => { const da = window.__da; const s = da.S.signals.find(x => x.code === 'DA-0RNG'); const img = document.querySelector('#s-slip .sl-fig .sl-img'); const b = await da.escpos(s, '58');
    return { img: !!img && /^data:image\/png/.test(img.src || ''), cap: (document.querySelector('#s-slip .sl-cap') || {}).textContent || '', head: (document.querySelector('#s-slip .sl-life b') || {}).textContent, code: (document.querySelector('#s-slip .sl-meta .sl-code') || {}).textContent, raster: b.some((v, i) => v === 0x1D && b[i + 1] === 0x76) }; });
  check('the example prints with the life as the heading and the code among the details', exp.head === 'SUMATRAN ORANGUTAN' && exp.code === 'DA-0RNG', JSON.stringify(exp));
  await ctx.close();
} catch (e) { results.push(`FAIL  section board: ${e.message.split('\n')[0]}`); }

// ───────── sharing: NOTICED, RESPONSE with nothing written, DIRECT ACTION to a partner; approval; the board; RECEIVE by code ─────────
if (run('share')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'share');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  await openNear(page);
  await page.evaluate(() => { const da = window.__da; da.toWish(da.S.byId.get(da.S.sel)); }); await sleep(1200);
  const w = await page.evaluate(() => ({ face: window.__da.face(), main: document.querySelector('#r-act .hw').textContent }));
  const n0 = await page.evaluate(() => (window.__da.boardJSON().objects || []).filter(o => o.daKind === 'receipt').length);
  await tap(page, '#r-act'); await sleep(2500);
  const tb = await page.evaluate(() => ({ face: window.__da.face(), n: (window.__da.boardJSON().objects || []).filter(o => o.daKind === 'receipt').length }));
  check('TO THE BOARD lays the receipt, as an image, on the board open in the WISH MAKER; the card stays', tb.n === n0 + 1 && tb.face === 'wish', JSON.stringify({ n0, tb }));
  await tap(page, '#r-alt'); await page.waitForFunction(() => window.__da.face() === 'signal', null, { timeout: 15000 }); await sleep(700);
  const s0 = await page.evaluate(() => { const da = window.__da; const s = da.S.issued; return { code: s.code, lines: Object.values(s.lines).filter(Boolean).length, poem: !!document.querySelector('#s-slip .sl-wish'), main: document.querySelector('#r-act .hw').textContent, mesh: da.meshText(s), pager: da.pagerText(s) }; });
  check('the receipt issued as a story with nothing written; then TO PRINT', w.face === 'wish' && w.main === 'W.I.S.H.' && s0.lines === 0 && !s0.poem && s0.main === 'TO PRINT' && !/\n\n|\n$/.test(s0.mesh) && s0.pager.startsWith(s0.code), JSON.stringify({ w, s0 }));
  const bin = await page.evaluate(async () => { const da = window.__da; const b58 = await da.escpos(da.S.issued, '58'), b80 = await da.escpos(da.S.issued, '80'); const has = (b, w) => { for (let i = 0; i < b.length - 6; i++) if (b[i] === 0x1D && b[i + 1] === 0x76 && b[i + 2] === 0x30 && b[i + 4] === w) return true; return false; }; const txt = String.fromCharCode(...b80.slice(0, 4000)); return { w58: has(b58, 48), w80: has(b80, 64), fig: /FIG\.|NORTH UP/.test(String.fromCharCode(...b58)) }; });
  check('ESC/POS for 58 mm and for 80 mm paper, with no FIG. or NORTH UP', bin.w58 && bin.w80 && !bin.fig, JSON.stringify(bin));
  await tap(page, '#r-act'); await sleep(1600);
  const dp = await page.evaluate(code => ({ view: window.__da.S.view, mode: window.__da.S.mode, story: window.__da.PRESS.story === window.__da.S.signals.find(x => x.code === code).key, base: window.__da.zineObjects().some(o => o.daKind === 'base') }), s0.code);
  check('TO PRINT takes the receipt to the ZINEMAKER, at the head of the strip, ready to print', dp.view === 2 && !dp.mode && dp.story && dp.base, JSON.stringify(dp));
  /* the server's side of a print to a place: it waits for approval, its print with it */
  await page.evaluate(async code => { const da = window.__da; const s = da.S.signals.find(x => x.code === code); await da.directAction(s, 'pickles'); da.openSignal(s.key); }, s0.code); await sleep(1200);
  const st0 = await page.evaluate(() => document.querySelector('#s-status').textContent);
  const waiting = await admin('stories?status=waiting'); const mine = waiting.stories.find(x => x.code === s0.code);
  check('sent to Pickles: it waits for approval, its print with it, and says so', /PICKLES MILK BAR/.test(st0) && mine && mine.dest === 'pickles' && mine.job === 'held', JSON.stringify({ st0, mine: mine && { code: mine.code, dest: mine.dest, job: mine.job } }));
  await admin(`stories/${mine.id}`, { action: 'show' });
  await page.evaluate(() => window.__da.checkSent()); await sleep(900);
  const st1 = await page.evaluate(() => document.querySelector('#s-status').textContent);
  check('approved: the sender sees it join the printer queue', /IN THE QUEUE/.test(st1) && /PICKLES/.test(st1), st1);
  /* another device: the board shows it to everyone */
  const ctx2 = await newCtx(); await wire(ctx2); const p2 = await ctx2.newPage(); watch(p2, 'share-2');
  await p2.goto('https://oan.test/studio'); await ready(p2); await sleep(1500); await tab(p2, 3); await sleep(600);
  const b2 = await p2.evaluate(code => { const r = [...document.querySelectorAll('#sec-board .sig-row')].find(x => x.querySelector('.code').textContent === code); return { row: !!r, sh: !!r && r.classList.contains('sh'), st: r ? (r.querySelector('.st') || { getAttribute: () => '' }).getAttribute('aria-label') || '' : '' }; }, s0.code);
  check('on another device it stands on the board, for everyone', b2.row && b2.sh && /SHOWN/.test(b2.st), JSON.stringify(b2));
  await ctx2.close();
  /* a story approved before CONFIG.SHARED_SINCE, made while the site was being built, is shown nowhere */
  const ctxC = await newCtx(); await wire(ctxC, { config: BASE_CONFIG.replace(/SHARED_SINCE: '[^']*'/, "SHARED_SINCE: '2099-01-01T00:00:00Z'") }); const pC = await ctxC.newPage(); watch(pC, 'share-cut');
  await pC.goto('https://oan.test/studio'); await ready(pC); await sleep(1500);
  const cut = await pC.evaluate(code => ({ shared: window.__da.S.shared.length, here: window.__da.S.signals.some(x => x.code === code), cfg: window.__da.CONFIG.SHARED_SINCE }), s0.code);
  check('a story approved before the cut-off is shown nowhere: the ones made while the site was being built are gone', cut.shared === 0 && !cut.here && /2099/.test(cut.cfg), JSON.stringify(cut));
  await ctxC.close();
  /* a third device, from the code printed on the slip */
  const ctx3 = await newCtx(); await wire(ctx3); const p3 = await ctx3.newPage(); watch(p3, 'share-3');
  await p3.goto('https://oan.test/studio'); await ready(p3); await p3.evaluate(() => localStorage.removeItem('da.shared.v1')); await tab(p3, 3); await sleep(400);
  await tap(p3, '#rx-open'); await p3.fill('#rx-t', s0.code.toLowerCase()); await tap(p3, '#rx button[type="submit"]'); await sleep(1600);
  const r3 = await p3.evaluate(() => ({ code: window.__da.S.issued && window.__da.S.issued.code, face: window.__da.face(), mode: window.__da.S.mode }));
  check('RECEIVE: the code printed on the slip brings the story up on any device', r3.code === s0.code && r3.face === 'signal' && r3.mode === 'ping', JSON.stringify(r3));
  await ctx3.close();
  /* the printer at Pickles: always on the map, its own card */
  await page.evaluate(() => { const da = window.__da; da.closeRecord(); da.setView(0); da.setOpen(false); da.life.moveScan(-37.758, 144.952, false); }); await sleep(500);
  const pk = await page.evaluate(() => { const da = window.__da; const p = da.PARTNERS.find(x => x.id === 'pickles'); da.map.jumpTo({ center: [p.lng, p.lat], zoom: 15.2 }); return { lat: p.lat, lng: p.lng }; }); await settle(page); await sleep(500);
  const pxy = await page.evaluate(({ lat, lng }) => { const da = window.__da; const q = da.map.project([lng, lat]); const r = da.map.getContainer().getBoundingClientRect(); return { x: q.x + r.left, y: q.y + r.top, hit: (da.life.hit(q.x, q.y) || {}).kind, inScan: da.life.inScan(lat, lng) }; }, pk);
  await page.mouse.click(pxy.x, pxy.y); await sleep(1400);
  const pc = await page.evaluate(() => ({ mode: window.__da.S.mode, name: document.querySelector('#r-name').textContent, no: document.querySelector('#r-no').textContent, main: document.querySelector('#r-act .hw').textContent, chips: document.querySelector('#r-chips').textContent, sent: document.querySelectorAll('#r-strings [data-sig]').length }));
  check('Pickles Milk Bar: its printer on the map, outside the radar too, opening its card', !pxy.inScan && pxy.hit === 'partner' && pc.mode === 'partner' && pc.name === 'Pickles Milk Bar' && /PRINTER/.test(pc.no) && pc.main === 'VISIT' && /80 MM/.test(pc.chips) && pc.sent >= 1, JSON.stringify({ pxy, pc }));
  await shot(page, '35-partner.png');
  /* switched online on the approval page: its icon on the map is online at once, without a Pi */
  await admin('printers/kines', { action: 'live', on: true }); await page.evaluate(() => window.__da.loadPartners()); await sleep(300);
  const kon = await page.evaluate(() => { const da = window.__da; return { ready: !!(da.PSTATE.kines || {}).ready, heard: !!(da.PSTATE.kines || {}).heard }; });
  await admin('printers/kines', { action: 'live', on: false }); await page.evaluate(() => window.__da.loadPartners()); await sleep(300);
  const koff = await page.evaluate(() => !!(window.__da.PSTATE.kines || {}).ready);
  check('a printer switched online on the approval page shows online on the map, and offline again', kon.ready && !kon.heard && !koff, JSON.stringify({ kon, koff }));
  /* a record placed here, shared */
  await page.evaluate(() => { const da = window.__da; da.closeRecord(); da.startPlace({ lat: -37.7712, lng: 144.9611 }); }); await sleep(700);
  await page.fill('#pl-text', 'a magpie nesting low'); await page.fill('#pl-contact', '0400 000 000'); await tap(page, '#r-act'); await sleep(1500);
  await tap(page, '#r-do [data-do="share"]'); await sleep(1500);
  const rs = await page.evaluate(() => (document.querySelector('#r-do .share small') || {}).textContent);
  const recs = (await admin('stories?status=waiting')).stories.filter(x => x.kind === 'record');
  check('a record placed here is shared for approval, without its contact', /WAITING FOR APPROVAL/.test(rs) && recs.length === 1 && /magpie/.test(recs[0].body) && !/0400/.test(recs[0].body), JSON.stringify({ rs, recs: recs.map(r => r.body) }));
  /* a pack of cells: read from a Markdown file, seen, sent for approval, then on the map for everyone */
  await page.evaluate(() => { const da = window.__da; da.closeRecord(); da.setOpen(true); da.setView(3); }); await sleep(700);
  const MD = ['# Fruit and radios', 'by: Merri Street neighbours', '', '- fruit | Lemon tree, laneway | -37.7701, 144.9602 | pick freely', '- node | Rooftop repeater | -37.7664, 144.9731 | LongFast | https://meshtastic.org',
    '| kind | name | lat | lng |', '|---|---|---|---|', '| water | Bird bath | -37.7688 | 144.9705 |', '- Fig on the corner | -37.7712, 144.9611', '- tree | Somewhere far | -33.86, 151.21', '- no place at all'].join('\n');
  await page.setInputFiles('#pack-f', { name: 'fruit-and-radios.md', mimeType: 'text/markdown', buffer: Buffer.from(MD) }); await page.waitForSelector('#pack .pk-n', { timeout: 15000 }).catch(() => {}); await sleep(200);
  const pv = await page.evaluate(() => ({ n: (document.querySelector('#pack .pk-n') || {}).textContent || '', rows: [...document.querySelectorAll('#pack .pk-l li')].map(li => li.textContent), send: !!document.querySelector('#pack [data-pack="send"]'), cells: (window.__da.S.packPv || {}).cells }));
  check('a cell pack in Markdown is read and shown before it is sent: four placed, by kind; two left out', /4 CELLS/.test(pv.n) && /2 NOT PLACED/.test(pv.n) && pv.send && pv.cells.map(c => c.k).join() === 'fruit,node,water,fruit' && pv.cells[1].url === 'https://meshtastic.org', JSON.stringify(pv));
  const e0 = errors.length; await tap(page, '#pack [data-pack="send"]'); await sleep(1200);
  const packs = (await admin('stories?status=waiting')).stories.filter(x => x.kind === 'cells');
  const sentNote = await page.evaluate(() => (document.querySelector('#pack .pk-sent') || {}).textContent || ''); const setOff = errors.slice(e0);
  check('sent for approval, as a pack, nothing on the map yet, and nothing else set off', packs.length === 1 && JSON.parse(packs[0].body).cells.length === 4 && /SENT · DA-/.test(sentNote) && !setOff.length && !(await page.evaluate(() => window.__da.S.community.some(o => o.pack))), JSON.stringify({ n: packs.length, sentNote, setOff }));
  await admin(`stories/${packs[0].id}`, { action: 'show' });
  await page.evaluate(() => window.__da.loadShared()); await sleep(800);
  const onMap = await page.evaluate(() => { const da = window.__da; const its = da.life.items.filter(it => it.o.pack); return { n: its.length, kinds: its.map(it => it.o.pk).sort().join(), tones: [...new Set(its.map(it => it.b.tone))].sort().join(), icons: its.map(it => it.b.i || it.b.g).sort().join(), who: (its[0] || {}).o && its[0].o.who }; });
  check('approved, its cells stand on the map for everyone, each as its kind', onMap.n === 4 && onMap.kinds === 'fruit,fruit,node,water' && onMap.tones === 'offer' && /mesh/.test(onMap.icons) && /give/.test(onMap.icons) && onMap.who === 'Merri Street neighbours', JSON.stringify(onMap));
  await page.evaluate(() => { const da = window.__da; da.setOpen(true); da.setView(0); }); await sleep(700);
  const ptk = await page.evaluate(() => { const da = window.__da; da.setRadio(true); const t = [...document.querySelectorAll('#sec-heat [data-t4="community"]')].length; da.snd.wake(); da.setTrack4('community', true); const on = Object.entries(da.TRK.on).filter(([k, v]) => k.startsWith('p:') && v).map(([k]) => k); const seen = da.life.items.filter(it => it.o.pack && da.life.shown(it)).length; da.setTrack4('community', false); const off = Object.entries(da.TRK.on).filter(([k, v]) => k.startsWith('p:') && v).length; da.setRadio(false); return { t, on, seen, off }; });
  check('a pack of cells sounds with COMMUNITY when the radio is on, and stops with it', ptk.t === 1 && ptk.on.length === 1 && ptk.off === 0, JSON.stringify(ptk));
  /* this group's stories go, so the other checks see the board as it was */
  for (const st of ['waiting', 'shown', 'refused']) for (const x of (await admin('stories?status=' + st)).stories) await admin(`stories/${x.id}`, { action: 'delete' });
  await ctx.close();
} catch (e) { results.push(`FAIL  section share: ${e.message.split('\n')[0]}`); }

// ───────── placing a record by hand ─────────
if (run('place')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'place');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  const c = await page.evaluate(() => { const da = window.__da; const p = da.map.project([da.S.scan.lng + 0.001, da.S.scan.lat + 0.0005]); const r = da.map.getContainer().getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; });
  await page.mouse.click(c[0], c[1], { button: 'right' }); await sleep(900);
  check('a right-click on open ground makes no record', await page.evaluate(() => !window.__da.S.mode));
  await page.mouse.move(c[0], c[1]); await page.mouse.down(); await sleep(900); await page.mouse.up(); await sleep(700);
  const p0 = await page.evaluate(() => ({ mode: window.__da.S.mode, face: window.__da.face(), kind: document.querySelector('#pl-kinds .chip.on').textContent, life: (document.querySelector('#pl-lives .lchip.on, #pl-lives .lchip.auto') || {}).dataset, alt: document.querySelector('#r-alt').textContent, main: document.querySelector('#r-act').textContent }));
  check('holding the left button starts a record: SEEN, any animal, PLACE or NOTICED', p0.mode === 'place' && p0.face === 'place' && p0.kind === 'SEEN' && /NOTICED/.test(p0.alt) && /PLACE/.test(p0.main), JSON.stringify(p0));
  await tap(page, '#r-back'); await sleep(500);
  check('back cancels it without the close button', await page.evaluate(() => !window.__da.S.mode && document.body.classList.contains('shut')));
  await page.mouse.move(c[0], c[1]); await page.mouse.down(); await sleep(900); await page.mouse.up(); await sleep(700);
  const again = await page.evaluate(() => window.__da.S.mode) === 'place';
  await page.mouse.click(c[0] + 40, c[1] + 40, { button: 'right' }); await sleep(600);
  check('and holding again starts another; a right-click cancels it', again && await page.evaluate(() => !window.__da.S.mode));
  await page.mouse.move(c[0], c[1]); await page.mouse.down(); await sleep(900); await page.mouse.up(); await sleep(700);
  await page.fill('#pl-text', 'a ringtail possum on the ground, hurt'); await sleep(700);
  const p1 = await page.evaluate(() => ({ kind: document.querySelector('#pl-kinds .chip.on').textContent, name: document.querySelector('#pl-name').textContent, call: (document.querySelector('#pl-hint a[href^="tel:"]') || {}).href }));
  check('the words choose the kind, the species and the call', p1.kind === 'HURT' && p1.name === 'Common Ringtail Possum' && /0384007300/.test(p1.call), JSON.stringify(p1));
  await page.fill('#pl-contact', '@possum_lover'); await tap(page, '#r-act'); await sleep(500);
  check('social media handles are refused', await page.evaluate(() => window.__da.S.mode) === 'place');
  await page.fill('#pl-contact', ''); await tap(page, '#r-act'); await sleep(1500);
  const p2 = await page.evaluate(() => { const da = window.__da; const o = da.S.byId.get(da.S.sel); return { mode: da.S.mode, user: !!(o && o.user), kind: o && o.kind, main: document.querySelector('#r-act .hw').textContent, alt: !document.querySelector('#r-alt').hidden }; });
  check('placed without a name: it opens with CALL first and NOTICED second', p2.mode === 'ping' && p2.user && p2.kind === 'injured' && p2.main === 'CALL' && p2.alt, JSON.stringify(p2));
  await page.evaluate(() => { const da = window.__da; da.closeRecord(); da.life.moveScan(-37.80, 144.95, false); }); await sleep(800);
  const fl = await page.evaluate(() => { const da = window.__da; const it = da.life.items.find(i => i.o.user && i.o.kind === 'injured'); return { flag: it.flag, inS: it.inS, shown: da.life.shown(it), pulse: it.pulse }; });
  check('an animal hurt stays on the map in red when the radar moves away', fl.flag && !fl.inS && fl.shown && fl.pulse === 3, JSON.stringify(fl));
  const kinds = await page.evaluate(async () => { const da = window.__da; da.startPlace({ lat: -37.7712, lng: 144.9611 }); await new Promise(r => setTimeout(r, 700)); const chips = [...document.querySelectorAll('#pl-lives [data-g]')].map(b => b.dataset.tip); const k = document.querySelector('#pl-kind'); if (k) { k.value = 'Stick insect'; k.dispatchEvent(new Event('input', { bubbles: true })); } await new Promise(r => setTimeout(r, 500)); const out = { insect: chips.includes('INSECT'), moth: chips.includes('MOTH'), input: !!k, name: document.querySelector('#pl-name').textContent }; da.closeRecord(); return out; });
  check('a sighting of one’s own: INSECT and MOTH among the kinds, and any kind typed names it', kinds.insect && kinds.moth && kinds.input && kinds.name === 'Stick insect', JSON.stringify(kinds));
  await page.evaluate(() => window.__da.startPlace({ lat: -37.7712, lng: 144.9611 })); await sleep(800);
  await page.fill('#pl-text', 'an orb weaver on the fence'); await sleep(500); await tap(page, '#r-alt'); await sleep(1800);
  const p3 = await page.evaluate(() => { const da = window.__da; const o = da.S.byId.get(da.S.sel); return { face: da.face(), name: o && o.tx && o.tx.cn, life: document.querySelector('#w-slip .sl-life b').textContent }; });
  check('NOTICED places it and goes straight to the slip', p3.face === 'wish' && /orb/i.test(p3.life), JSON.stringify(p3));
  await page.evaluate(() => window.__da.closeRecord()); await sleep(300);
  await page.evaluate(() => window.__da.startPlace({ lat: -37.7712, lng: 144.9611 })); await sleep(1200);
  await page.fill('#pl-text', 'a blue-tongue under the shed'); await sleep(300);
  const mk = await page.evaluate(() => { const da = window.__da; const p = da.map.project([da.S.place.lng, da.S.place.lat]); const r = da.map.getContainer().getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; });
  await page.mouse.click(mk[0], mk[1]); await sleep(600);
  const cx1 = await page.evaluate(() => ({ mode: window.__da.S.mode, toast: document.querySelector('#toast').textContent, undo: !!document.querySelector('#toast button') }));
  check('a tap on the marker itself cancels placing, with UNDO', !cx1.mode && /CANCELLED/.test(cx1.toast) && cx1.undo, JSON.stringify(cx1));
  await page.click('#toast button'); await sleep(900);
  const cx2 = await page.evaluate(() => ({ mode: window.__da.S.mode, text: document.querySelector('#pl-text').value, back: document.querySelector('#r-back').classList.contains('cancel') }));
  check('UNDO brings back what was begun; the way out reads CANCEL', cx2.mode === 'place' && cx2.text === 'a blue-tongue under the shed' && cx2.back, JSON.stringify(cx2));
  const away = await page.evaluate(() => { const da = window.__da; const p = da.map.project([da.S.place.lng - 0.012, da.S.place.lat]); const r = da.map.getContainer().getBoundingClientRect(); return [Math.max(20, p.x + r.left), p.y + r.top]; });
  await page.mouse.click(away[0], away[1]); await sleep(600);
  check('a tap outside its radius cancels it too', await page.evaluate(() => !window.__da.S.mode));
  await ctx.close();
} catch (e) { results.push(`FAIL  section place: ${e.message.split('\n')[0]}`); }

// ───────── hiding any cell; changing the five ─────────
if (run('hide')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'hide');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  const it = await page.evaluate(() => { const da = window.__da; da.life.reveal(); const r = da.map.getContainer().getBoundingClientRect(); const it = da.life.items.find(i => i.inS && da.life.shown(i) && !i.binned && !i.o.hero && !i.o.user && typeof i.o.id === 'number' && i.x > 80 && i.y > 120 && i.x < r.width - 320 && i.y < r.height - 120 && (() => { const h = da.life.hit(i.x, i.y); return h && h.id === i.o.id; })()); return it && it.o.id; });
  const [x, y] = await xy(page, it); await page.mouse.move(x, y, { steps: 4 }); await sleep(600);
  const tagOf = () => page.evaluate(id => { const t = document.querySelector('#tag'); const r = t.getBoundingClientRect(); const it = window.__da.life.items.find(i => i.o.id === id); const m = window.__da.map.getContainer().getBoundingClientRect();
    return { tag: !t.hidden, hide: !!t.querySelector('.hide'), img: t.querySelectorAll('img').length, beside: it ? Math.min(Math.abs(r.left - (m.left + it.x + it.dx)), Math.abs(r.right - (m.left + it.x + it.dx))) : -1, level: it ? Math.abs((r.top + r.bottom) / 2 - (m.top + it.y + it.dy)) : -1 }; }, it);
  /* the pointer comes to rest over the mark: the tag follows within 40 ms, or later on a busy machine; waited for, up to 3 s */
  const landed = async () => { let t = await tagOf(); for (let k = 0; k < 20 && !(t.tag && t.level <= 12 && t.beside >= 44 && t.beside <= 62); k++) { await sleep(150); t = await tagOf(); } return t; };
  let tg = await landed(); if (!tg.tag) { await page.mouse.move(x + 40, y + 40); await settle(page); await sleep(300); const [x2, y2] = await xy(page, it); await page.mouse.move(x2, y2, { steps: 4 }); await sleep(800); tg = await landed(); }
  check('every cell under the pointer has a small hide button', tg.tag && tg.hide, JSON.stringify(tg));
  check('the tag under the pointer is words only, level with the mark and beside the photograph it grows into', tg.img === 0 && tg.beside >= 44 && tg.beside <= 62 && tg.level <= 12, JSON.stringify(tg));
  await page.click('#tag .hide'); await sleep(500);
  const h1 = await page.evaluate(id => ({ gone: !window.__da.life.items.some(i => i.o.id === id), kept: JSON.parse(localStorage.getItem('da.hide.v1') || '[]').includes(String(id)), toast: document.querySelector('#toast').textContent }), it);
  check('HIDE takes it off the map, on this device, with UNDO', h1.gone && h1.kept && /HIDDEN/.test(h1.toast), JSON.stringify(h1));
  await page.click('#toast button'); await sleep(400);
  check('UNDO puts it back', await page.evaluate(id => window.__da.life.items.some(i => i.o.id === id), it));
  await page.evaluate(id => window.__da.select(id), it); await sleep(1200);
  await tap(page, '#r-hide'); await sleep(500);
  const h2 = await page.evaluate(id => ({ mode: window.__da.S.mode, gone: !window.__da.life.items.some(i => i.o.id === id) }), it);
  check('its card hides it too, and closes', !h2.mode && h2.gone, JSON.stringify(h2));
  await page.evaluate(() => window.__da.select(window.__da.S.heroes[0].id)); await sleep(1400);
  const hf = await page.evaluate(() => ({ hide: !document.querySelector('#r-hide').hidden, change: !!document.querySelector('#r-chips [data-five]'), name: document.querySelector('#r-name').textContent }));
  check('the five carry CHANGE instead of HIDE', !hf.hide && hf.change, JSON.stringify(hf));
  await tap(page, '#r-chips [data-five]'); await sleep(300); await page.fill('#five-q', 'frog'); await sleep(500);
  const pick = await page.evaluate(() => document.querySelector('#five-r .nrow .n').textContent);
  await tap(page, '#five-r [data-five-pick]'); await sleep(1600);
  const f1 = await page.evaluate(() => { const o = window.__da.S.byId.get(window.__da.S.sel) || {}; return { name: document.querySelector('#r-name').textContent, slot: o.slot, hero: !!o.hero, five: window.__da.S.heroes.length, stored: (JSON.parse(localStorage.getItem('da.five.v1') || '[]')[0] || {}).cn, select: !!document.querySelector('#pick:not([hidden])') }; });
  check('CHANGE swaps one of the five for any life', f1.name === pick && f1.slot === 0 && f1.hero && f1.five === 5 && f1.stored === pick, JSON.stringify({ pick, ...f1 }));
  check('and SELECT stays shut', !f1.select, JSON.stringify(f1));
  await tap(page, '#r-chips [data-five]'); await sleep(300); await page.fill('#five-q', 'Night garden visitor'); await sleep(500);
  const ownRow = await page.evaluate(() => [...document.querySelectorAll('#five-r .nrow')].map(b => b.textContent).find(t => /YOUR OWN/.test(t)) || '');
  check('or for one of your own', /Night garden visitor/i.test(ownRow), ownRow);
  await tap(page, '#r-five [data-five-reset]'); await sleep(1600);
  const f2 = await page.evaluate(() => ({ name: document.querySelector('#r-name').textContent, stored: (JSON.parse(localStorage.getItem('da.five.v1') || '[]')[0]) || null }));
  check('RESET brings the first back', f2.name === hf.name && !f2.stored, JSON.stringify(f2));
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setOpen(true); window.__da.setView(3); }); await sleep(700);
  const sh = await page.evaluate(() => (document.querySelector('#ix-hidden') || { dataset: {} }).dataset.tip || '');
  await tap(page, '#ix-hidden'); await sleep(500);
  const back = await page.evaluate(id => window.__da.life.items.some(i => i.o.id === id) && !document.querySelector('#ix-hidden'), it);
  check('settings counts what is hidden, and brings it all back', /^1 hidden/.test(sh) && back, sh);
  await ctx.close();
} catch (e) { results.push(`FAIL  section hide: ${e.message.split('\n')[0]}`); }

// ───────── an animal lost: its search area, on and off ─────────
if (run('lost')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'lost');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page);
  await page.evaluate(() => { const da = window.__da; da.startPlace({ lat: -37.7660, lng: 144.9580 }); }); await sleep(600);
  await page.fill('#pl-text', 'lost dog, a kelpie, ran off'); await sleep(500); await tap(page, '#r-act'); await sleep(1400);
  const l0 = await page.evaluate(() => { const da = window.__da; const it = da.life.items.find(i => i.o.kind === 'lost'); return { main: document.querySelector('#r-act .hw').textContent, areas: da.prefs.areas, radar: it && it.radar, toggle: !!document.querySelector('#r-do [data-do="areas"]') }; });
  check('a lost animal opens with SEARCH; its area is off until asked for', l0.main === 'SEARCH' && !l0.areas && l0.radar >= 800 && l0.toggle, JSON.stringify(l0));
  await tap(page, '#r-do [data-do="areas"]'); await sleep(300);
  check('the area toggles on from its card', await page.evaluate(() => window.__da.prefs.areas === true && document.querySelector('#r-do [data-do="areas"]').getAttribute('aria-pressed') === 'true'));
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setView(3); }); await sleep(400);
  await tap(page, '#ix-areas'); await sleep(200);
  check('and off again from the settings', await page.evaluate(() => window.__da.prefs.areas === false));
  await ctx.close();
} catch (e) { results.push(`FAIL  section lost: ${e.message.split('\n')[0]}`); }

// ───────── a phone: the radar above, the sheet below ─────────
if (run('phone')) try {
  const ctx = await newCtx({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await wire(ctx); const page = await ctx.newPage(); watch(page, 'phone');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page); await sleep(800);
  const a = await page.evaluate(() => { const p = document.querySelector('#panel').getBoundingClientRect(); return { shut: document.body.classList.contains('shut'), off: p.top >= innerHeight - 2, tabs: [...document.querySelectorAll('#rail .tab')].map(t => Math.round(t.getBoundingClientRect().right)), knob: !document.querySelector('#knob').hidden }; });
  check('on a phone the radar has the screen; the page waits below', a.shut && a.off && a.knob && a.tabs.every(r => r <= 390), JSON.stringify(a));
  const ic = await page.evaluate(() => { const b = document.querySelector('.maplibregl-ctrl-attrib-button'); const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const rail = document.querySelector('#rail').getBoundingClientRect(); const tabs = [...document.querySelectorAll('#rail .tab')].map(t => t.getBoundingClientRect());
    return { hit: top === b || b.contains(top), gap: Math.round(rail.top - r.bottom), tabH: Math.min(...tabs.map(t => Math.round(t.height))), tabW: Math.min(...tabs.map(t => Math.round(t.width))), railH: Math.round(rail.height) }; });
  check('on a phone the information corner, with the way to the approval page, stands clear above the tab bar and the page, and takes a touch; the tabs smaller, still a finger wide', ic.hit && ic.gap >= 44 && ic.tabH >= 44 && ic.tabW >= 44 && ic.railH <= 56, JSON.stringify(ic));
  await shot(page, 'p01-radar.png');
  await page.tap('#rail .tab[data-i="0"]'); await sleep(700);
  const s = await page.evaluate(() => { const pn = document.querySelector('#panel'); const dv = document.querySelector('#view #sec-heat, #view .dev').getBoundingClientRect(); const fk = document.querySelector('#view [data-flip]').getBoundingClientRect(); const dock = innerHeight - pn.getBoundingClientRect().bottom; return { devTop: Math.round(dv.top), devBottom: Math.round(dv.bottom), foot: Math.round(innerHeight - dock), key: Math.round(fk.bottom), bg: getComputedStyle(pn).backgroundColor, bar: getComputedStyle(document.querySelector('#sheetbar')).display, over: document.documentElement.scrollWidth - innerWidth }; });
  check('on a phone the device rides its rail over the big screen: its foot just above the dock, its turn-over key in view, the screen above it clear, no sheet or bar behind it, and nothing spills sideways', s.devTop >= 40 && s.devBottom <= s.foot && s.devBottom >= s.foot - 40 && s.key <= s.foot && s.bg === 'rgba(0, 0, 0, 0)' && s.bar === 'none' && s.over <= 0, JSON.stringify(s));
  await shot(page, 'p02-now.png');
  const id = await page.evaluate(() => { const da = window.__da; da.life.reveal(); const it = da.life.items.find(i => i.inS && typeof i.o.id === 'number' && !i.o.hist && !i.o.hum && i.b.tone !== 'flora' && i.b.tone !== 'cold'); return it.o.id; });
  await page.evaluate(() => window.__da.setOpen(false)); await sleep(500);
  await page.evaluate(id => { const o = window.__da.S.byId.get(id); window.__da.map.jumpTo({ center: [o.lng, o.lat], zoom: 15.6 }); }, id); await settle(page);
  const [x, y] = await xy(page, id); await page.touchscreen.tap(x, y); await sleep(1600);
  const c = await page.evaluate(() => ({ mode: window.__da.S.mode, fig: Math.round(document.querySelector('#r-fig').getBoundingClientRect().height), hero: !!document.querySelector('#r-act').getBoundingClientRect().height }));
  check('a tap opens the card in the sheet, the photograph first', c.mode === 'ping' && c.fig >= 180 && c.hero, JSON.stringify(c));
  await shot(page, 'p03-card.png');
  const kk = await page.evaluate(() => { const n = [...window.__da.strings.nodes.values()].find(n => n.t !== 'pin' && n.x != null && n.y > 30 && n.y < innerHeight * 0.38 && n.x > 30 && n.x < innerWidth - 30); return n ? n.key : null; });
  if (kk) { const p = await nodeXY(page, kk); await page.touchscreen.tap(p[0], p[1]); await sleep(600);
    const pv = await page.evaluate(() => { const c = document.querySelector('#peek').getBoundingClientRect(); return { peeked: window.__da.strings.peeked, bottom: Math.round(c.bottom), left: Math.round(c.left), right: Math.round(c.right), sheet: Math.round(document.querySelector('#panel').getBoundingClientRect().top) }; });
    check('on a phone a knot is looked at above the sheet', pv.peeked === kk && pv.bottom <= pv.sheet + 2 && pv.left >= 0 && pv.right <= 390, JSON.stringify(pv)); await shot(page, 'p03b-peek.png');
    await page.touchscreen.tap(p[0], p[1]); await sleep(400);
    check('and joined with a second tap', await page.evaluate(k => window.__da.strings.fig.e.some(e => e.includes(k)), kk));
    const kk2 = await page.evaluate(k0 => { const n = [...window.__da.strings.nodes.values()].find(n => n.t !== 'pin' && n.key !== k0 && !window.__da.strings.inFig(n.key) && n.x != null && n.y > 30 && n.y < innerHeight * 0.38 && n.x > 30 && n.x < innerWidth - 30); return n ? n.key : null; }, kk);
    if (kk2) {
      const q = await nodeXY(page, kk2); const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: q[0], y: q[1] }] }); await sleep(700); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(600);
      const lp = await page.evaluate(k => ({ tied: window.__da.strings.inFig(k), mode: window.__da.S.mode, place: !!window.__da.S.place }), kk2);
      check('a long press on a knot joins it at once, and makes no record', lp.tied && lp.mode === 'ping' && !lp.place, JSON.stringify(lp));
    }
  } else check('on a phone a knot is looked at above the sheet', false, 'no knot above the sheet');
  await page.evaluate(() => { const da = window.__da; da.toWish(da.S.byId.get(da.S.sel)); }); await sleep(900);
  const w = await page.evaluate(() => { const s = document.querySelector('#w-slip').getBoundingClientRect(); return { face: window.__da.face(), left: s.left, right: s.right, over: document.documentElement.scrollWidth - innerWidth }; });
  check('the slip fits the phone', w.face === 'wish' && w.left >= 0 && w.right <= 390 && w.over <= 0, JSON.stringify(w));
  await shot(page, 'p04-wish.png');
  /* the press on a phone: a finger on bare paper scrolls the strip (the page keeps the touch); on a piece, it moves the piece */
  const tz = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); da.closeRecord && da.closeRecord(); da.setOpen(true); da.setView(2); await wait(1500); da.setPane('main'); await wait(900);
    const up = document.querySelector('#zine .upper-canvas'); const r = up.getBoundingClientRect();
    const touch = (x, y) => { const t = new Touch({ identifier: Date.now(), target: up, clientX: x, clientY: y }); const ev = new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true }); up.dispatchEvent(ev); document.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], bubbles: true, cancelable: true })); return ev.defaultPrevented; };
    const bare = touch(r.left + r.width / 2, r.top + Math.min(r.height - 20, 300));
    await da.zineTool('shape'); await wait(300); const o = da.zineObjects().filter(x => x.daKind === 'shape').pop(); const c = o.getCenterPoint(); const k = r.width / 320;
    const onPiece = touch(r.left + c.x * k, r.top + c.y * k); const d = document.querySelector('#zine .desk');
    return { bare, onPiece, block: getComputedStyle(d).display }; });
  check('on a phone a finger on bare paper scrolls the strip; on a piece it moves the piece', tz.bare === false && tz.onPiece === true && tz.block === 'block', JSON.stringify(tz));
  await ctx.close();
} catch (e) { results.push(`FAIL  section phone: ${e.message.split('\n')[0]}`); }

// ───────── a hot day: drinking water and the air temperature now, inside the radar ─────────
if (run('hot')) try {
  const ctx = await newCtx(); await wire(ctx, { tmax: 41, night: 8 }); const page = await ctx.newPage(); watch(page, 'hot');
  await page.goto('https://oan.test/studio'); await ready(page); await sleep(800);
  await tab(page, 0);
  await page.waitForFunction(() => window.__da.S.sensors.length > 0 && window.__da.S.fountains.length > 0, null, { timeout: 30000 }).catch(() => {});
  const hot = await page.evaluate(() => ({ tmax: window.__da.S.wx.tmax, sensors: window.__da.S.sensors.length, fountains: window.__da.S.fountains.length }));
  check('on a day over the heat line, the drinking water and the air temperature arrive', hot.tmax >= 40 && hot.sensors > 0 && hot.fountains > 0, JSON.stringify(hot));
  await ctx.close();
  const ctx2 = await newCtx(); await wire(ctx2, { tmax: 24 }); const p2 = await ctx2.newPage(); watch(p2, 'mild');
  await p2.goto('https://oan.test/studio'); await ready(p2); await tab(p2, 0); await sleep(1500);
  check('on a mild day the water and the air temperature stay away, unless WATER is on (it is, by default)', await p2.evaluate(() => (window.__da.S.sensors.length === 0 && window.__da.S.fountains.length === 0) || window.__da.T4.water));
  await ctx2.close();
} catch (e) { results.push(`FAIL  section hot: ${e.message.split('\n')[0]}`); }

// ───────── no signal: the radar, the five and the examples still stand ─────────
if (run('offline')) try {
  const ctx = await newCtx(); await wire(ctx, { inat: false, ens: false, comOK: false }); const page = await ctx.newPage(); watch(page, 'offline');
  await page.goto('https://oan.test/studio');
  await page.waitForFunction(() => window.__da && window.__da.S.mapReady && document.body.classList.contains('nosignal'), null, { timeout: 60000 });
  await sleep(800); await tab(page, 3); await sleep(400);
  const off = await page.evaluate(() => ({ items: window.__da.life.items.length, five: window.__da.S.heroes.length, sigs: document.querySelectorAll('#sec-board .sig-row, #sec-board .sig-line').length, codes: [...document.querySelectorAll('#sec-board .code')].map(c => c.textContent).join(' ') }));
  check('without a signal the five and the example still stand', off.five === 5 && off.items >= 5 && off.sigs === 1, JSON.stringify(off));
  await ctx.close();
} catch (e) { results.push(`FAIL  section offline: ${e.message.split('\n')[0]}`); }

// ───────── night: as the device is set, or chosen in Settings; the page darkens, the ground dims, a slip stays paper ─────────
if (run('night')) try {
  const ctx = await newCtx(); await wire(ctx, { dark: true }); const page = await ctx.newPage(); watch(page, 'night');
  await page.goto('https://oan.test/studio'); await ready(page, '', true); await settle(page);
  const n0 = await page.evaluate(() => ({ night: document.documentElement.classList.contains('night'), page: getComputedStyle(document.querySelector('#panel')).backgroundColor, ground: getComputedStyle(document.querySelector('.maplibregl-canvas')).filter }));
  check('night, chosen: the page darkens, the ground dims', n0.night && (n0.page.match(/\d+/g) || [255, 255, 255]).slice(0, 3).reduce((x, y) => x + +y, 0) < 160 && /brightness/.test(n0.ground), JSON.stringify(n0));
  await tab(page, 3); await sleep(500); await tap(page, '#ix-night'); await sleep(300);
  const n1 = await page.evaluate(() => ({ night: document.documentElement.classList.contains('night'), kept: JSON.parse(localStorage.getItem('da.prefs')).night, pressed: document.querySelector('#ix-night').getAttribute('aria-pressed') }));
  check('and NIGHT in Settings turns it off, or on, and keeps it', !n1.night && n1.kept === false && n1.pressed === 'false', JSON.stringify(n1));
  await tap(page, '#ix-night'); await sleep(300); await page.evaluate(() => window.__da.openSignal('ex:DA-0RNG')); await sleep(1500);
  const n2 = await page.evaluate(() => ({ night: document.documentElement.classList.contains('night'), slip: getComputedStyle(document.querySelector('#s-slip')).backgroundColor, tty: document.querySelector('#s-slip').classList.contains('tty') }));
  check('a slip stays paper at night, set as the terminal', n2.night && n2.slip === 'rgb(252, 251, 247)' && n2.tty, JSON.stringify(n2));
  /* every tab's icon stands out from its tab at night, pressed or not */
  const tn = await page.evaluate(() => [...document.querySelectorAll('#rail .tab')].map(t => { const rgb = s => { const m = (s.match(/[\d.]+/g) || []).map(Number); const a = m.length > 3 ? m[3] : 1; return m.slice(0, 3).map(v => v * a + 8 * (1 - a)); }; const c = s => rgb(s).reduce((a, b) => a + b, 0); return Math.round(Math.abs(c(getComputedStyle(t).color) - c(getComputedStyle(t).backgroundColor))); }));
  check('at night every tab icon stands out from its tab', tn.every(d => d > 300), JSON.stringify(tn));
  await shot(page, '70-night.png');
  await ctx.close();
} catch (e) { results.push(`FAIL  section night: ${e.message.split('\n')[0]}`); }

// ───────── the field list page ─────────
if (run('field')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'field');
  await page.goto('https://oan.test/studio'); await ready(page); await sleep(600);
  await page.goto('https://oan.test/field.html'); await sleep(900);
  const f = await page.evaluate(() => ({ rows: document.querySelectorAll('#rows tr').length, glyphs: document.querySelectorAll('#tools [data-g]').length, maps: document.querySelectorAll('#rows a[href^="studio#"]').length, overflow: document.documentElement.scrollWidth - innerWidth }));
  check('the field list renders every kind, with links to the map', f.rows >= 200 && f.glyphs >= 30 && f.maps >= 5 && f.overflow <= 0, JSON.stringify(f));
  const href = await page.evaluate(() => document.querySelector('#rows a[href^="studio#"]').getAttribute('href'));
  await page.goto('https://oan.test/' + href); await ready(page); await sleep(1500);
  const sel = await page.evaluate(() => ({ sel: window.__da.S.sel, face: window.__da.face(), hidden: document.querySelector('#record').hidden }));
  check('a MAP link opens its life on the map', sel.sel != null && !sel.hidden && sel.face === 'front', `${href} → ${JSON.stringify(sel)}`);
  await ctx.close();
} catch (e) { results.push(`FAIL  section field: ${e.message.split('\n')[0]}`); }

// ───────── gatherings from a published sheet ─────────
if (run('events')) try {
  const ctx = await newCtx(); await wire(ctx, { config: BASE_CONFIG.replace("EVENTS_URL: ''", "EVENTS_URL: 'https://sheet.test/events.csv'") }); const page = await ctx.newPage(); watch(page, 'events');
  await page.goto('https://oan.test/studio'); await ready(page); await sleep(800); await tab(page, 0); await sleep(400);
  const ev = await page.evaluate(() => { const da = window.__da; const e = da.S.community.filter(o => String(o.id).startsWith('e:')); const its = da.life.items.filter(it => String(it.o.id).startsWith('e:')); return { n: e.length, title: e[0] && e[0].title, onMap: its.filter(it => da.life.shown(it)).length, gig: its.some(it => it.b.tone === 'event' && it.b.i === 'hug') }; });
  check('a published sheet of gatherings stands on the map, a gig with a hug', ev.n === 2 && ev.title === 'Frog count, Merri Creek' && ev.onMap === 2 && ev.gig, JSON.stringify(ev));
  await page.evaluate(() => { location.hash = 'E01'; }); await sleep(900);
  check('#E01 opens the gathering', await page.evaluate(() => window.__da.S.sel) === 'e:1');
  await ctx.close();
} catch (e) { results.push(`FAIL  section events: ${e.message.split('\n')[0]}`); }

// ───────── the guide ─────────
if (run('guide')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'guide');
  await page.goto('https://oan.test/guide.html'); await sleep(1400);
  const g = await page.evaluate(() => { const n = s => document.querySelectorAll(s).length; return { key: n('#key li'), kc: n('#kind-colours li'), radar: n('#radar-steps li'), strings: n('#string-steps li'), sounds: n('#snd-lives li') + n('#snd-people li'), refs: n('#outs a[href^="https"]'), wish: n('#wish-slip ol li'), five: n('#five-steps li'), outs: n('#outs li'), degs: n('#degs li'), wins: n('#wins li'), heroes: n('#heroes li'), on: n('#roles-on li'), back: n('#roles-back li'), groups: n('#group-list li'), calls: n('#calls li'), words: document.body.innerText.split(/\s+/).length, sentences: (document.body.innerText.match(/[a-z]{3,}\.(\s|$)/g) || []).length, overflow: document.documentElement.scrollWidth - innerWidth }; });
  check('the guide is a key: the radar, the icons, the strings, the lines, the outputs, the danger, the places, the groups', g.key === 22 && g.kc === 8 && g.radar === 8 && g.strings === 22 && g.sounds === 15 && g.wish === 4 && g.five === 2 && g.outs === 8 && g.refs === 7 && g.degs === 5 && g.wins === 4 && g.heroes === 5 && g.on === 10 && g.back === 14 && g.groups === 6 && g.calls === 9 && g.overflow <= 0, JSON.stringify(g));
  check('the guide is labels, not prose', g.words < 620 && g.sentences === 0, `${g.words} words · ${g.sentences} sentences`);
  await shot(page, '60-guide.png', { fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(500);
  check('the guide fits a phone', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0);
  await ctx.close();
} catch (e) { results.push(`FAIL  section guide: ${e.message.split('\n')[0]}`); }

// ───────── no names, no traces, nothing invented left over ─────────
if (run('static')) try {
  /* the words to keep out: general ones here, private ones (names, tools) one per line in test/.private-words, which never leaves this machine */
  const priv = path.join(ROOT, 'test/.private-words'); const words = ['co-authored', 'generated with', 'ai-generated', 'utm_source', ...(fs.existsSync(priv) ? fs.readFileSync(priv, 'utf8').split(/\r?\n/).map(w => w.trim()).filter(Boolean) : [])];
  const bad = new RegExp(words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i'); const hits = [];
  const left = /DA_DEMO|demo\.js|specimen|sign-up sheet|signed up|upvote/i; const old = [];
  for (const f of fs.readdirSync(DIST, { recursive: true })) { const p = path.join(DIST, f); if (fs.statSync(p).isDirectory() || /\.(png|woff2)$/.test(f) || /maplibre|qrcode/.test(f)) continue; const t = fs.readFileSync(p, 'utf8'); const m = t.match(bad); if (m) hits.push(`${f}: ${m[0]}`); const o = t.match(left); if (o) old.push(`${f}: ${o[0]}`); }
  /* and every file a commit would carry, because the repository is public; this file holds the list, so it is skipped */
  let repo = []; try { repo = require('child_process').execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT }).toString().split('\n'); } catch (e) { /* no git: the site alone is checked */ }
  for (const f of repo) { const p = path.join(ROOT, f); if (!f || f === 'test/run.mjs' || /\.(png|woff2)$/.test(f) || !fs.existsSync(p)) continue; const m = fs.readFileSync(p, 'utf8').match(bad); if (m) hits.push(`${f}: ${m[0]}`); }
  check('no names or authorship traces in the site or the repository', !hits.length, hits.join(' · '));
  check('no demo data, sign-up, votes or specimens left in the repository', !old.length, old.join(' · '));
  const readme = fs.readFileSync(path.join(DIST, 'README.md'), 'utf8');
  check('the README is short', readme.split('\n').length <= 40, `${readme.split('\n').length} lines`);
} catch (e) { results.push(`FAIL  section static: ${e.message.split('\n')[0]}`); }

// ───────── the base, at /: one question, a photograph and a line, its key facts and few connections, printed or queued ─────────
/* a JPEG that says where and when it was taken, as a phone's camera writes it: Carlton Gardens, 23 October 2026 */
async function exifJPEG() {
  const jpg = await sharp({ create: { width: 320, height: 240, channels: 3, background: { r: 90, g: 140, b: 70 } } }).jpeg().toBuffer();
  const t = Buffer.alloc(178); t.write('II', 0); t.writeUInt16LE(42, 2); t.writeUInt32LE(8, 4);
  const ent = (o, tag, type, count, val) => { t.writeUInt16LE(tag, o); t.writeUInt16LE(type, o + 2); t.writeUInt32LE(count, o + 4); if (typeof val === 'string') t.write(val, o + 8, 'latin1'); else t.writeUInt32LE(val, o + 8); };
  t.writeUInt16LE(2, 8); ent(10, 0x8769, 4, 1, 38); ent(22, 0x8825, 4, 1, 76);
  t.writeUInt16LE(1, 38); ent(40, 0x9003, 2, 20, 56); t.write('2026:10:23 14:05:00\0', 56, 'latin1');
  t.writeUInt16LE(4, 76); ent(78, 1, 2, 2, 'S\0'); ent(90, 2, 5, 3, 130); ent(102, 3, 2, 2, 'E\0'); ent(114, 4, 5, 3, 154);
  [[37, 1], [48, 1], [216, 10], [144, 1], [58, 1], [1704, 100]].forEach(([a, b], i) => { t.writeUInt32LE(a, 130 + i * 8); t.writeUInt32LE(b, 134 + i * 8); });
  const head = Buffer.alloc(10); head.writeUInt16BE(0xFFE1, 0); head.writeUInt16BE(2 + 6 + t.length, 2); head.write('Exif\0\0', 4, 'latin1');
  return Buffer.concat([jpg.subarray(0, 2), head, t, jpg.subarray(2)]);
}
if (run('base')) try {
  const src = fs.readFileSync(path.join(ROOT, 'src/base/base.js'), 'utf8');
  check('the base is plain script for old phones: no optional chaining, no ??, no class fields', !/\?\.[a-zA-Z_$[(]|\?\?/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/'(?:\\.|[^'\\])*'/g, "''")));
  const ctx = await newCtx({ timezoneId: 'Australia/Melbourne' }); await wire(ctx, { plain: true }); const page = await ctx.newPage(); watch(page, 'base');
  const loaded = []; page.on('request', r => loaded.push(new URL(r.url()).pathname));
  await page.clock.setFixedTime(new Date('2026-10-23T14:20:00+11:00'));
  await page.goto('https://oan.test/?base'); await page.waitForSelector('#o-radio'); await sleep(600);
  await page.waitForFunction(() => window.__base.nowItems().length > 0, null, { timeout: 8000 }).catch(() => {});
  const spot = () => page.evaluate(() => ['#o-radio', '#o-wish', '#o-print'].map(q => document.querySelector(q).style.transform));
  const t1 = await spot(); await sleep(1500); const t2 = await spot();
  const home = await page.evaluate(() => ({ orbs: [...document.querySelectorAll('#orrery .orb')].map(a => a.getAttribute('aria-label') + '>' + a.getAttribute('href') + (a.textContent.trim() ? '+words' : '')), rings: document.querySelectorAll('#rg path.rf').length, words: document.body.innerText.trim(), shown: ['#top', '#oled', '#dock', '#sheet'].filter(q => { const e = document.querySelector(q); return e && !e.hidden && getComputedStyle(e).display !== 'none'; }), bg: getComputedStyle(document.querySelector('#home')).backgroundColor, paper: (getComputedStyle(document.querySelector('#home')).backgroundImage.match(/feTurbulence/g) || []).length, knots: document.querySelectorAll('#net circle').length, gl: !!document.querySelector('canvas'), now: window.__base.nowItems().map(i => i.k + ': ' + i.t) }));
  check('the start is blueprint paper with three hand-drawn rings turning, a page riding each (RADIO, W.I.S.H., PRINT): no words, no menus, no heading', home.orbs.join() === 'RADIO>#radio,W.I.S.H.>#wish,PRINT>#print' && home.rings === 3 && home.words === '' && !home.shown.length && home.bg === 'rgb(23, 69, 127)' && home.paper >= 2 && !home.knots && !home.gl, JSON.stringify(home).slice(0, 400));
  check('the rings turn and the pages ride them', t1.join() !== t2.join() && t1.every(Boolean), JSON.stringify([t1[0], t2[0]]));
  const st1 = await page.evaluate(() => ({ fav: document.querySelector('link[rel=icon]').getAttribute('href'), nums: document.querySelectorAll('#orrery .orb svg.num').length }));
  await page.mouse.click(30, 30); await sleep(600);
  const humOn = await page.evaluate(() => window.__hum);
  check('the start: the irukandji-globe as the icon, each page numbered by hand (1, 2, 3), and a quiet hum that begins at the first touch', st1.fav === 'iruk.svg' && st1.nums === 3 && humOn === 1, JSON.stringify({ st1, humOn }));
  check('the base loads no map library, nothing of the studio, and one small pixel font for the box (Departure Mono)', !loaded.some(p => /maplibre|fonts|app\.js|style\.css|config\.js|field\.js/.test(p)) && loaded.filter(p => /\.woff2$/.test(p)).every(p => /departure-mono\.woff2$/.test(p)), loaded.filter(p => !/tile/.test(p)).join(' '));
  check('NOW in October: fledglings on the ground and El Niño\'s early heat, a line each, four at most', home.now.length <= 4 && home.now.some(t => /^YOUNG: Fledglings on the ground: .*magpies.*lorikeets/.test(t)) && home.now.some(t => /^EL NIÑO: Early heat/.test(t)), JSON.stringify(home.now));
  await shot(page, 'b01-home.png');
  /* a lorikeet fledgling in Carlton Gardens: the photograph says where */
  await page.evaluate(() => document.querySelector('#o-print').click()); await page.waitForSelector('#sheet .eye .shot', { state: 'attached' });
  await page.setInputFiles('#sheet .eye .shot', { name: 'lori.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() });
  await page.waitForSelector('#n-next', { timeout: 15000 });
  const w = await page.evaluate(() => ({ where: document.querySelector('#n-where').textContent, img: !!document.querySelector('#sheet .ph img'), loc: document.querySelector('#n-loc').classList.contains('on') }));
  check('the photograph reaches the next screen, with where and when it says it was taken (Carlton Gardens)', w.img && w.loc && /^23 OCT 14:05 · 37\.806\dS 144\.971\dE$/.test(w.where), JSON.stringify(w));
  /* a photograph that will not draw still goes on, without its picture */
  await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#print'); await page.waitForSelector('#sheet .eye .shot', { state: 'attached' });
  const broken = await page.evaluate(() => new Promise(r => { const f = new File([new Uint8Array([1, 2, 3, 4])], 'x.jpg', { type: 'image/jpeg' }); const s = document.querySelector('#sheet .eye .shot'); const dt = new DataTransfer(); dt.items.add(f); s.files = dt.files; s.dispatchEvent(new Event('change')); setTimeout(() => r({ next: !!document.querySelector('#n-next'), img: !!document.querySelector('#sheet .ph img') }), 4000); }));
  check('a photograph that will not draw never stalls: the noticing goes on without its picture', broken.next && !broken.img, JSON.stringify(broken));
  await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#print'); await page.waitForSelector('#sheet .eye .shot', { state: 'attached' });
  await page.setInputFiles('#sheet .eye .shot', { name: 'lori.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }); await page.waitForSelector('#sheet .ph img', { timeout: 8000 });
  await page.fill('#n-say', 'lorikeet fledgling on the path, not flying'); await sleep(900);
  await page.waitForFunction(() => document.querySelector('#n-sp'), null, { timeout: 8000 }).catch(() => {});
  const n = await page.evaluate(() => ({ who: [...document.querySelectorAll('#n-sp option')].map(o => o.textContent), key: [...document.querySelectorAll('#n-alert .alert p')].map(l => l.textContent), call: (document.querySelector('#n-alert .call') || {}).textContent || '', chips: document.querySelectorAll('#sheet .chip').length, data: (window.__base.notes()[0] || {}).data }));
  check('who it may be is one small list, Rainbow Lorikeet first, Musk Lorikeet offered, — for none; no tags or chips', n.who[0] === 'Rainbow Lorikeet' && n.who.includes('Musk Lorikeet') && n.who[n.who.length - 1] === '—' && !n.chips, JSON.stringify(n.who) + n.chips);
  check('a real alert, three lines at most: what to do with a fledgling, the season with El Niño, who to call', n.key.length <= 3 && /fledgling: leave it/.test(n.key[0]) && n.key.some(k => /BREEDING JUN–JAN/.test(k) && /El Niño, early heat/.test(k)) && /WILDLIFE VICTORIA.*8400 7300/.test(n.call), JSON.stringify(n.key) + n.call);
  const quiet = await page.evaluate(() => { const t = document.querySelector('#n-say'); t.value = 'a nice tree shadow'; t.dispatchEvent(new Event('input')); return new Promise(r => setTimeout(() => r(document.querySelector('#n-alert').innerHTML), 500)); });
  check('nothing to say, nothing said: no alert for a line with no need and no life in it', quiet === '', quiet.slice(0, 120));
  await page.fill('#n-say', 'lorikeet fledgling on the path, not flying'); await sleep(500);
  const broad = await page.evaluate(() => { const b = window.__base; return ['affected by El Niño', 'hot day, lots of birds', 'magpie swooping cyclists', 'snake on the creek path', 'dead raven in the gutter'].map(t => { const r = b.read({ id: 'x', say: t, tags: [], lat: -37.8, lng: 144.97 }); return { t, issue: r.issue ? r.issue.k : '', rel: r.rel.length, lines: r.lines.length, call: r.call ? r.call.label : '' }; }); });
  check('the engine stays narrow: nothing reads as everything, each need finds its own call', broad.every(r => r.rel <= 3 && r.lines <= 3) && broad[0].rel === 0 && broad[2].issue === 'swoop' && broad[3].issue === 'snake' && /DEECA/.test(broad[3].call) && broad[4].issue === 'dead' && /SICK OR DEAD/.test(broad[4].call), JSON.stringify(broad));
  await shot(page, 'b02-notice.png');
  await tap(page, '#n-next');
  /* the reveal: read from what it keeps (the sightings tied to the noticing); the knots counted if the moment is still on screen */
  const seen = await (await page.waitForFunction(() => { const n0 = window.__base.notes()[0]; if (!n0 || !n0.seen) return null; const l = [...document.querySelectorAll('#n-seen li:not(.wait)')]; const ids = n0.seen.map(s => s.id); const k = l.length ? window.__base.hits().knots.filter(h => ids.includes(h.n.id)).length : ids.length; if (l.length && k < ids.length && !window.__kw) { window.__kw = Date.now(); return null; } if (l.length && k < ids.length && Date.now() - window.__kw < 3000) return null; return { rows: n0.seen.map(s => s.cn + ' ' + (s.d || '')), shown: l.length, knots: k }; }, null, { timeout: 15000, polling: 50 })).jsonValue();
  check('placed: the knot falls on the ground and a few nearby sightings of the same and related lives are revealed and tied to it, three at most', seen.rows.length >= 1 && seen.rows.length <= 3 && /Rainbow Lorikeet/.test(seen.rows[0]) && seen.knots === seen.rows.length, JSON.stringify(seen));
  check('the data travels with it: suburb, nearest water, canopy, today\'s heat, Niño 3.4', (await page.evaluate(() => window.__base.notes()[0].data.join())) === 'CARLTON,CARLTON GARDENS PONDS,CANOPY 22%,29° TODAY,NIÑO 3.4 +2.8');
  await shot(page, 'b02b-placed.png');
  await page.waitForSelector('#p-slip canvas', { timeout: 10000 });
  await page.waitForFunction(() => document.querySelector('#p-to option') && document.querySelector('#p-to').value, null, { timeout: 8000 }); await sleep(600);
  const pr = await page.evaluate(() => { const c = document.querySelector('#p-slip canvas'); return { w: c.width, h: c.height, to: document.querySelector('#p-to').value, dots: document.querySelectorAll('#p-dots [data-a]').length, notes: window.__base.notes().length, words: [...document.querySelectorAll('#sheet button, #sheet a')].filter(b => b.offsetParent && b.textContent.trim().length > 1).map(b => b.textContent.trim()) }; });
  check('the design stage: the receipt 80 mm wide for novel.global, four arts as glyphs, no words on its keys', pr.notes === 1 && pr.w === 512 && pr.h > 700 && pr.to === 'novelglobal' && pr.dots === 4 && !pr.words.length, JSON.stringify(pr));
  await page.evaluate(() => { window.__said = []; const f = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t) { window.__said.push(String(t)); return f.apply(this, arguments); }; });
  await tap(page, '#p-wish'); await sleep(900);
  const ws = await page.evaluate(() => ({ lines: window.__base.wish().map(l => l[1]), said: window.__said, h: document.querySelector('#p-slip canvas').height }));
  check('W.I.S.H. on the receipt: four lines as a poem from the template, the place and time first, never the letters', ws.lines.length === 4 && /Rainbow Lorikeet at Carlton Gardens Ponds/.test(ws.lines[0]) && ws.lines.every(l => ws.said.some(s => l.indexOf(s) === 0 || s.indexOf(l.slice(0, 12)) === 0)) && !ws.said.some(s => /^[WISH]\b/.test(s.trim()) && s.trim().length <= 2), JSON.stringify(ws.lines) + JSON.stringify(ws.said.filter(s => s.length < 4)));
  await tap(page, '#p-dots [data-a="sign"]'); await sleep(800);
  const sg = await page.evaluate(() => { const c = document.querySelector('#p-slip canvas'); const x = c.getContext('2d').getImageData(0, 10, c.width, 1).data; let dark = 0; for (let i = 0; i < x.length; i += 4) if (x[i] < 128) dark++; return { band: dark / (x.length / 4), w: c.width, h: c.height }; });
  check('SIGN: the same noticing as a sign for the place, a black band across its head, still 80 mm wide', sg.band > 0.9 && sg.w === 512 && sg.h > 500, JSON.stringify(sg));
  await shot(page, 'b03c-sign.png'); await tap(page, '#p-dots [data-a="photo"]'); await sleep(500);
  await shot(page, 'b03-design.png');
  await tap(page, '#p-send'); await page.waitForFunction(() => /●/.test(document.querySelector('#p-st').textContent) && document.querySelector('#p-send').textContent === '→', null, { timeout: 10000 });
  const st = await page.evaluate(() => ({ pips: document.querySelector('#p-st').textContent, words: document.querySelector('#p-st').innerText.replace(/[●○✕\s]/g, '') }));
  const waiting = await admin('stories?status=waiting'); const rec = (waiting.stories || []).find(s => s.kind === 'record' && /fledgling/.test(s.body));
  const body = rec ? JSON.parse(rec.body) : {};
  check('PRINT sends it to novel.global\'s printer as a noticing with its photograph and its W.I.S.H.; status as pips, no words', !!rec && rec.photo && body.type === 'noticed' && body.tx && body.tx.cn === 'Rainbow Lorikeet' && body.issue === 'young' && body.wish.length === 4 && rec.dest === 'novelglobal' && /^●[●○]{2}$/.test(st.pips.trim()) && !st.words, JSON.stringify(st) + JSON.stringify(rec || waiting).slice(0, 300));
  /* no share step: → goes to its thread on W.I.S.H. */
  await tap(page, '#p-send'); await page.waitForSelector('.wish-grid #w-new');
  const th = await page.evaluate(() => ({ h: (document.querySelector('.wish-grid h2') || {}).textContent, hero: !!document.querySelector('.wish-grid .hero'), first: [...document.querySelectorAll('.reply')].map(r => r.innerText), opts: [...document.querySelectorAll('#w-new select')].map(s => s.options.length), shut: [...document.querySelectorAll('#w-new select')].every(s => s.value === '' && s.options[0].textContent === '▾') }));
  check('then its thread: the poster as hero, the poem it was sent with, and four lines to answer, each with a minimised list of lines that fit it', /lorikeet fledgling/.test(th.h) && th.hero && th.first.length === 1 && /Rainbow Lorikeet/.test(th.first[0]) && th.opts.length === 4 && th.opts.every(k => k >= 3) && th.shut, JSON.stringify(th));
  const stock = await page.evaluate(() => [...document.querySelectorAll('#w-new select option, #w-new textarea')].map(o => o.textContent || o.value).filter(t => /water and shade|sign at the spot|printed here|taped up|neighbours. net|this place kept for|who know the/i.test(t)));
  check('no stock lines in W.I.S.H.: every suggestion is the need\'s own, the life\'s own, a number to call or a case that worked', !stock.length, JSON.stringify(stock));
  await page.selectOption('#w-new select[data-o="1"]', { index: 1 }); await sleep(200);
  const picked = await page.evaluate(() => document.querySelector('#w-new [data-l="1"]').value);
  await page.fill('#w-new [data-l="2"]', 'A sign on the gate, and water out'); await tap(page, '#w-post');
  await page.waitForFunction(() => document.querySelectorAll('.reply').length === 2, null, { timeout: 8000 }); await sleep(800);
  const wr = (((await admin('stories?status=waiting')).stories) || []).map(s => JSON.parse(s.body)).find(b => b.type === 'wish');
  check('a W.I.S.H. answered: a line picked from the list, a line written, kept in the thread at once and sent as a reply to its poster', !!picked && !!wr && wr.re === rec.code && wr.lines[1] === picked && wr.lines[2] === 'A sign on the gate, and water out', JSON.stringify(wr) + picked);
  await shot(page, 'b03b-thread.png');
  /* RADIO: a 4-track played from the map's own cells, and the web of noticing */
  await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#radio'); await page.waitForSelector('#deck', { timeout: 8000 });
  await page.waitForFunction(() => document.querySelectorAll('#r-body .tiles button').length > 3, null, { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => document.querySelectorAll('#net circle').length > 10, null, { timeout: 15000 }).catch(() => {});
  const radio = await page.evaluate(() => ({ sos: document.querySelectorAll('#sheet .sos').length, tracks: document.querySelectorAll('#deck .ins').length, steps: document.querySelectorAll('#deck .cells').length && document.querySelector('#deck .cells').children.length, tiles: document.querySelectorAll('#r-body .tiles button').length, photos: [...document.querySelectorAll('#r-body .tiles button')].filter(b => b.style.backgroundImage).length, mine: document.querySelectorAll('#r-body .tiles button.mine').length, knots: document.querySelectorAll('#net circle').length, tones: new Set([...document.querySelectorAll('#net circle.cell')].map(c => c.style.fill)).size, studio: !!document.querySelector('#sheet a[href^="studio"]') }));
  check('RADIO: no numbers on top (they are under HELP), a 4-track of 16 steps, the sightings about now as photographs with one\'s own, every cell a dot in the earth tone of its kind', !radio.sos && radio.tracks === 4 && radio.steps === 16 && radio.tiles > 10 && radio.photos > 5 && radio.mine >= 1 && radio.knots > 10 && radio.tones >= 3 && !radio.studio, JSON.stringify(radio));
  await page.click('#r-min'); await sleep(300);
  const mn = await page.evaluate(() => ({ h: document.querySelector('#sheet').getBoundingClientRect().height, min: document.querySelector('#sheet').classList.contains('min') }));
  await page.click('#r-min'); await sleep(200);
  check('RADIO folds away to show the whole map, and back', mn.min && mn.h <= 120 && !(await page.evaluate(() => document.querySelector('#sheet').classList.contains('min'))), JSON.stringify(mn));
  const bar = await page.evaluate(() => ({ keys: [...document.querySelectorAll('#top a.pg, #top button, #top label')].map(k => k.getAttribute('href') || k.id), dock: !!document.querySelector('#dock'), x: (() => { const x = document.querySelector('#sheet .hd .x'); return x ? !x.hidden : false; })(), hum: window.__hum || 0, rec: !!document.querySelector('#r-rec.on') }));
  check('one bar, in order: the three pages, then the map, the guide, + and where-I-am, light and dark; no dock; no × on a page; the start\'s hum stopped', bar.keys.join() === '#radio,#wish,#print,b-map,b-search,b-add,b-me,b-theme' && !bar.dock && !bar.x && bar.hum === 0, JSON.stringify(bar));
  const url0 = page.url();
  await page.evaluate(() => { window.__notes = 0; const A = window.AudioContext; window.AudioContext = function () { const c = new A(); const o = c.createOscillator.bind(c); c.createOscillator = function () { window.__notes++; return o(); }; return c; }; });
  await tap(page, '#d-play'); await sleep(1200);
  const sd = await page.evaluate(() => ({ placed: window.__base.song().tracks.reduce((a, t) => a + t.steps.filter(Boolean).length, 0), sounds: window.__notes }));
  await tap(page, '#d-play'); await page.click('#deck .cells[data-t="0"] button[data-s="3"]'); await sleep(200);
  const empty = await page.evaluate(() => window.__base.song().tracks[0].steps.filter(Boolean).length);
  check('▶ on an empty deck plays nothing, and an empty step touched with no cell open stays empty: no sound that is not a cell on the map', sd.placed === 0 && sd.sounds === 0 && empty === 0, JSON.stringify({ sd, empty }));
  await tap(page, '#d-rec'); await sleep(300);
  for (let k = 0; k < 4; k++) { await page.click(`#r-body .tiles button:nth-child(${k + 2})`); await sleep(260); }
  const rc = await page.evaluate(() => { const st = window.__base.song().tracks.flatMap(t => t.steps.filter(Boolean)); const ids = [...document.querySelectorAll('#r-body .tiles button')].slice(1, 5).map(b => b.id.slice(2)); return { notes: st.length, tied: st.every(x => ids.includes(x.id) && x.t && x.g), on: window.__base.seq().on, peek: !document.querySelector('#peek').hidden }; });
  check('● records: each tile touched places its own cell on the armed track, like tape, pitched by its kind and named, and nothing opens over it', rc.notes >= 2 && rc.tied && rc.on && !rc.peek, JSON.stringify(rc));
  await tap(page, '#d-rec');
  await tap(page, '#d-undo'); await sleep(150);
  const un = await page.evaluate(() => window.__base.song().tracks.reduce((a, t) => a + t.steps.filter(Boolean).length, 0));
  check('↶ takes back the last change to the deck, one at a time', un === rc.notes - 1, JSON.stringify({ before: rc.notes, after: un }));
  await page.click('#deck .ins[data-t="1"]'); await page.click('#deck .ins[data-t="1"]'); await sleep(200);
  const set = await page.evaluate(() => ({ open: !!document.querySelector('#deck .set'), ins: [...document.querySelectorAll('#deck .set [data-ins]')].map(b => b.title) }));
  await page.click('#deck .set [data-ins="taiko"]'); await sleep(150);
  check('a double tap on a track opens its settings: the instruments (paired gamelan, bamboo bass, choir, harp, kecak breath, soft drum), level, pitch, length, mute', set.open && set.ins.join() === 'gamelan,jegog,voice,harp,chak,taiko' && (await page.evaluate(() => window.__base.song().tracks[1].ins)) === 'taiko', JSON.stringify(set));
  await tap(page, '#d-radar'); await sleep(400);
  const sw = await page.evaluate(() => ({ len: window.__base.song().tracks[0].steps.length, bars: document.querySelectorAll('#deck .bars [data-pg]').length, kept: window.__base.song().tracks[0].steps.filter(Boolean).length }));
  await tap(page, '#d-radar');
  check('◎ the radar turns the song to four bars, one full sweep, to record the whole turn of the web; what was there is kept', sw.len === 64 && sw.bars === 4 && sw.kept >= 1, JSON.stringify(sw));
  const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await tap(page, '#d-wav'); const file = await dl;
  const kept = await page.evaluate(() => ({ bpm: window.__base.song().bpm, room: window.__base.room(), songs: document.querySelectorAll('.songs li').length, wav: window.__lastWav || 0, loop: window.__lastLoop, store: JSON.parse(localStorage.getItem('da.base.songs') || '[]').length }));
  check('every voice goes into one room: Freeverb\'s long hall, a slow chorus, Tuna\'s ping-pong delay', !!kept.room && kept.room.freeverb && kept.room.tuna, JSON.stringify(kept.room));
  check('⇩ keeps the song and downloads it as a loop (WAV): whole turns of the song, the tail folded to the start, no fade, so it carries on when repeated', kept.songs === 1 && kept.store === 1 && !!kept.loop && kept.loop.samples === Math.round(44100 * 64 * 60 / kept.bpm / 4) && kept.wav === 44 + kept.loop.samples * 4 && !!file && /loop\.wav$/.test(file.suggestedFilename()), JSON.stringify(kept));
  /* a cell opened: its photograph large, its name to the guide here, no link out; ＋ puts it in the track */
  const seq0 = await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.web') || '{"seq":[]}').seq.length);
  const lori = await page.evaluate(() => { const b = [...document.querySelectorAll('#r-body .tiles button:not(.mine)')].find(x => /Rainbow Lorikeet/.test(x.title)); return b ? b.id : null; });
  await page.click(lori ? '#' + lori : '#r-body .tiles button:not(.mine)'); await sleep(500);
  const pk = await page.evaluate(() => ({ peek: !document.querySelector('#peek').hidden, ph: (document.querySelector('#peek .pk-ph') || { offsetHeight: 0 }).offsetHeight, guide: !!document.querySelector('#pk-g'), out: [...document.querySelectorAll('#peek a')].filter(a => a.target === '_blank' || /inaturalist/.test(a.href)).length, deck: !!document.querySelector('#deck') }));
  check('a cell opens as a card in place: its photograph large, its name a way into the guide, no link out to its source; RADIO stays', pk.peek && pk.ph >= 150 && pk.guide && !pk.out && pk.deck && page.url() === url0, JSON.stringify(pk) + page.url());
  await page.click('#pk-g'); await sleep(250);
  const unf = await page.evaluate(() => ({ more: !document.querySelector('#pk-more').hidden, spec: document.querySelectorAll('#pk-more dl.spec dt').length, yr: !!document.querySelector('#pk-more table.yr'), deck: !!document.querySelector('#deck'), tab: [...document.querySelectorAll('#top a.pg.on')].map(a => a.getAttribute('href')).join() }));
  check('its name unfolds what the guide says inside the card, and RADIO stays, marked in the dock as the page one is on', unf.more && unf.spec >= 2 && unf.yr && unf.deck && unf.tab === '#radio' && page.url() === url0, JSON.stringify(unf));
  await page.evaluate(() => { const t = window.__base.song().tracks[0]; t.steps = Array(t.steps.length).fill(null); }); await page.click('#deck .ins[data-t="0"]'); await sleep(450); await page.click('#pk-add'); await sleep(200);
  const added = await page.evaluate(() => window.__base.song().tracks[0].steps.filter(Boolean).map(x => x.t));
  const s9 = await page.evaluate(() => +document.querySelectorAll('#deck .cells[data-t="0"] button')[9].dataset.s);
  await page.click(`#deck .cells[data-t="0"] button[data-s="${s9}"]`); await sleep(200);
  const at9 = await page.evaluate(s9 => (window.__base.song().tracks[0].steps[s9] || {}).t, s9);
  check('the cell open goes into the armed track by ＋, or onto any step touched while it is open', added.length === 1 && /Rainbow Lorikeet/.test(added[0]) && /Rainbow Lorikeet/.test(at9 || ''), JSON.stringify({ added, at9, s9, dbg: await page.evaluate(() => ({ on: window.__base.seq().on, page: window.__base.seq().page, filled: window.__base.song().tracks.map(t => t.steps.map((x, i) => x ? i : -1).filter(i => i >= 0)), len: window.__base.song().tracks.map(t => t.steps.length), peek: !document.querySelector('#peek').hidden })) }));
  /* the web: built only from what is opened, each line with its reason */
  const tiles2 = await page.evaluate(() => [...document.querySelectorAll('#r-body .tiles button:not(.mine)')].filter(x => !/Rainbow Lorikeet/.test(x.title)).slice(0, 2).map(b => '#' + b.id));
  for (const t of tiles2) { await page.click('#pk-x').catch(() => {}); await page.click(t); await sleep(400); }
  const web = await page.evaluate(() => { const W = JSON.parse(localStorage.getItem('da.base.web')); const why = window.__base.hits().sticks.map(s => s.why).filter(Boolean); return { seq: W.seq.length, trail: document.querySelectorAll('#net path.w.trail').length, why: why.slice(0, 4), opened: why.some(w => /^opened .+, then .+/.test(w)) }; });
  await page.click('#pk-x').catch(() => {}); await page.click('#r-rec'); const s0 = await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.web')).seq.length);
  await page.click('#r-body .tiles button:nth-child(9)'); await sleep(300); const s1 = await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.web')).seq.length);
  await page.click('#pk-x').catch(() => {}); await page.click('#r-rec');
  check('the path\'s memory turns off and on: off, a cell opened is not tied into the web', s1 === s0 && await page.evaluate(() => !!document.querySelector('#r-rec.on')), JSON.stringify({ s0, s1 }));
  check('the web of noticing builds as cells are opened: kept, each one tied to the one before by a trail stick that says why', web.seq >= seq0 + 3 && web.trail >= 2 && web.opened, JSON.stringify(web));
  await sleep(300); const dr = await page.evaluate(() => ({ glides: window.__glides || 0, ...window.__base.drone() }));
  check('the web has a voice, fluid not stepped: each new stick a glide from cell to cell, and a held tone for each life opened', dr.on && dr.glides >= 2 && dr.voices >= 1, JSON.stringify(dr));
  await page.click('#pk-x').catch(() => {}); await tap(page, '#d-play');
  const ik = await page.evaluate(() => window.__base.iruk(Array.from({ length: 9 }, (_, i) => ({ id: 'x' + i, cn: 'Rainbow Lorikeet', lat: -37.8, lng: 144.97 }))).concat(['|'], window.__base.iruk(Array.from({ length: 3 }, (_, i) => ({ id: 'y' + i, cn: 'Noisy Miner', lat: -37.8, lng: 144.97 })))));
  check('an irukandji forms for every four of a life opened, never more than four tentacles, none for three', ik.join() === '4,4,|', JSON.stringify(ik));
  /* collections: each with its own shape; added to the web and kept, not replacing; what prints or downloads, shown */
  await tap(page, '#r-way [data-w="sets"]'); await page.waitForSelector('#r-body .list.sets'); await sleep(300);
  const sets = await page.evaluate(() => ({ t: [...document.querySelectorAll('#r-body [data-c] span')].map(s => s.textContent), shapes: [...document.querySelectorAll('#r-body [data-c] svg.shape')].map(s => s.innerHTML).filter(Boolean) }));
  await page.click('#r-body [data-c="0"]'); await sleep(400); await page.click('#r-body [data-c="1"]'); await sleep(900);
  const sel = await page.evaluate(() => { const c = document.querySelector('#r-pv canvas'); let ink = 0; if (c && c.width) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < d.length; i += 16) if (d[i] < 150) ink++; } return { sets: JSON.parse(localStorage.getItem('da.base.web')).sets.map(s => s.t), chips: document.querySelectorAll('#r-sets button[data-x]').length, w: c ? c.width : 0, ink, swell: document.querySelectorAll('#net path.w.swell').length, rough: !!window.rough, d3: !!(window.d3 && window.d3.forceSimulation) }; });
  check('SETS: every collection with its own shape; two touched are both added to the web and kept, each shown as a swell and a chip to take off', sets.t.includes('Rainbow Lorikeet') && sets.shapes.length === sets.t.length && new Set(sets.shapes).size > 1 && sel.sets.length === 2 && sel.chips === 2 && sel.swell >= 1, JSON.stringify({ t: sets.t.slice(0, 4), sel }));
  check('what prints or downloads is shown first: the web laid out by d3-force and drawn by hand with Rough.js', sel.w === 720 && sel.ink > 50 && sel.rough && sel.d3, JSON.stringify(sel));
  const wd = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await page.click('#r-dl'); const wf = await wd;
  await page.click('#r-pr'); await page.waitForFunction(() => /●/.test(document.querySelector('#r-pst').textContent), null, { timeout: 10000 });
  const wrec = (((await admin('stories?status=waiting')).stories) || []).find(x => x.kind === 'record' && /"web"/.test(x.body));
  check('⇩ downloads the web as a picture; ⎙ prints it on novel.global\'s printer', !!wf && /novel-global-web\.png$/.test(wf.suggestedFilename()) && !!wrec && wrec.dest === 'novelglobal', String(wf && wf.suggestedFilename()) + JSON.stringify(wrec || {}).slice(0, 120));
  await page.click('#r-sets button[data-x="0"]'); await sleep(300);
  check('× takes one set off and leaves the other', (await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.web')).sets.length)) === 1);
  await tap(page, '#d-undo'); await sleep(300);
  check('↶ brings a set taken off back', (await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.web')).sets.length)) === 2 && (await page.evaluate(() => document.querySelectorAll('#r-sets button[data-x]').length)) === 2);
  /* the path, a constellation of its own: hidden, and with no sets the map and the print are free of lines and the voice is quiet */
  await page.click('#r-pc'); await sleep(200);
  while (await page.$('#r-sets button[data-x]')) { await page.click('#r-sets button[data-x]'); await sleep(200); }
  await sleep(2500);
  const bare = await page.evaluate(() => ({ path: JSON.parse(localStorage.getItem('da.base.web')).path, lines: document.querySelectorAll('#net path.w').length, jelly: document.querySelectorAll('#net .jelly').length, pv: !!document.querySelector('#r-pv .empty'), voices: window.__base.drone().voices }));
  check('your path hides like any set: with none shown, the map and the print are free of lines and the web\'s voice falls quiet', bare.path === false && !bare.lines && !bare.jelly && bare.pv && bare.voices === 0, JSON.stringify(bare));
  await tap(page, '#r-path'); await sleep(400);
  check('and shows again', await page.evaluate(() => document.querySelectorAll('#net path.w.trail').length > 0 && !!document.querySelector('#r-pv canvas')));
  await page.click('#r-path-x'); await sleep(100);
  const asked = await page.evaluate(() => ({ sure: document.querySelector('#r-path-x').classList.contains('sure'), seq: JSON.parse(localStorage.getItem('da.base.web')).seq.length }));
  await page.click('#r-path-x'); await sleep(300);
  const cleared = await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.web')).seq.length);
  await page.click('.toast.undo'); await sleep(300);
  const back1 = await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.web')).seq.length);
  check('anything made is taken away only with a check (✓), and ↶ puts it back: your path cleared and restored', asked.sure && asked.seq > 0 && cleared === 0 && back1 === asked.seq, JSON.stringify({ asked, cleared, back1 }));
  await tap(page, '#r-way [data-w="help"]'); await sleep(500);
  const help = await page.evaluate(() => [...document.querySelectorAll('#r-body .list a')].map(a => a.getAttribute('href')));
  check('HELP has every number to call', help.includes('tel:000') && help.includes('tel:0384007300'), help.length + '');
  /* W.I.S.H.: a news page of strategies */
  await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#wish'); await page.waitForSelector('.wish-grid');
  const wl = await page.evaluate(() => ({ hero: (document.querySelector('.wish-grid .hero h3') || {}).textContent, rows: document.querySelectorAll('ol.hn li').length, meta: (document.querySelector('ol.hn .meta') || {}).textContent }));
  const tr = await page.evaluate(() => { const li = document.querySelector('.tree li:not(.root)'); const dp = li && li.querySelector('.dp'); return { rows: [...document.querySelectorAll('.tree li:not(.root)')].map(l => l.querySelector('i').textContent.replace(/[├└─ ]/g, '')), hidden: dp ? getComputedStyle(dp).display : '' }; });
  await page.hover('.tree li:not(.root)'); const shownDp = await page.evaluate(() => getComputedStyle(document.querySelector('.tree li:not(.root) .dp')).display);
  check('a thread as a small tree of what it touches (its life, what was near, …), the data behind each kept back until pointed at', tr.rows.includes('life') && tr.rows.includes('near') && tr.hidden === 'none' && shownDp === 'inline', JSON.stringify({ tr, shownDp }));
  await page.click('#w-edit'); await page.fill('#w-ed [data-l="1"]', 'Pets kept in while they learn to fly'); await page.click('#w-save'); await sleep(300);
  check('one\'s own W.I.S.H. can be changed and kept', (await page.evaluate(() => window.__base.notes().find(n => n.wishText && /fledgling/.test(n.say)).wishText[1])) === 'Pets kept in while they learn to fly');
  await page.click('#w-make'); await page.fill('#nw-life', 'Tawny Frogmouth'); await page.dispatchEvent('#nw-life', 'change'); await sleep(300);
  const nwOpts = await page.evaluate(() => document.querySelectorAll('#nw-lines select[data-o="1"] option').length);
  await page.fill('#nw-lines [data-l="0"]', 'Lights down along the creek'); await page.dispatchEvent('#nw-lines [data-l="0"]', 'input'); await page.click('#nw-ok'); await sleep(400);
  const nw = await page.evaluate(() => { const n = window.__base.notes()[0]; return { wish: n.wish, cn: n.cn, say: n.say, h: (document.querySelector('.wish-grid h2') || {}).textContent }; });
  check('a W.I.S.H. begun without a noticing: a life, its lines (with the lines that fit it), made into a thread of its own', nw.wish && nw.cn === 'Tawny Frogmouth' && nw.say === 'Lights down along the creek' && /Lights down/.test(nw.h) && nwOpts >= 2, JSON.stringify({ nw, nwOpts }));
  const wm = await page.evaluate(() => ({ cls: document.body.classList.contains('wishmap'), posters: document.querySelectorAll('#net .wishmap .poster').length, me: document.querySelectorAll('#net .wishmap .poster.me').length, q: !!document.querySelector('#w-q') }));
  check('beside W.I.S.H., the map shows only its posters, framed, the one open ringed with its constellation, and a search over the threads', wm.cls && wm.posters >= 1 && wm.me === 1 && wm.q, JSON.stringify(wm));
  await page.fill('#w-q', 'zzzz no such thing'); await sleep(300);
  const none = await page.evaluate(() => ({ posters: document.querySelectorAll('#net .wishmap .poster').length, empty: !!document.querySelector('#w-list .empty') }));
  await page.fill('#w-q', 'fledgling'); await sleep(300);
  const some = await page.evaluate(() => ({ posters: document.querySelectorAll('#net .wishmap .poster').length, rows: document.querySelectorAll('#w-list ol.hn li').length }));
  check('the search narrows the threads and the map together', none.posters === 0 && none.empty && some.posters >= 1 && some.rows >= 1, JSON.stringify({ none, some }));
  const pk2 = await page.evaluate(() => { const k = window.__base.hits().knots.find(h => h.wish); return k ? [k.x, k.y] : null; });
  if (pk2) { await page.mouse.click(pk2[0], pk2[1]); await sleep(400); }
  const h2now = await page.evaluate(() => (document.querySelector('.wish-grid h2') || {}).textContent || '');
  check('a poster touched on the map opens its thread beside it, nothing else', !!pk2 && /lorikeet fledgling/.test(h2now) && page.url().endsWith('#wish'), String(pk2) + page.url() + ' ' + h2now);
  check('W.I.S.H. is a ranked thread of strategies: the hero poster and its headline, then the list with points, place, age, replies and pips', /lorikeet fledgling/.test(wl.hero) && wl.rows >= 1 && /^▲ \d+ · Carlton · .* · 2 ✎ ●/.test(wl.meta), JSON.stringify(wl));
  await page.goto('https://oan.test/?base#shop'); await page.waitForSelector('#s-prn li:not(.empty)', { timeout: 8000 }).catch(() => {}); await sleep(800);
  const shop = await page.evaluate(() => ({ rec: [...document.querySelectorAll('#s-rec small')].map(s => s.textContent), prn: document.querySelectorAll('#s-prn li').length, build: !!document.querySelector('a[href="build-a-solar-printer.txt"]'), packs: !!document.querySelector('#pk-out'), add: [...document.querySelectorAll('#sheet a[href^="studio"]')].map(a => a.getAttribute('href') + '|' + !!a.querySelector('use[href="#g-crayon"]')).join(), tears: document.querySelectorAll('#sheet .eye .threads path').length, wipe: !!document.querySelector('#s-wipe'), prns: [...document.querySelectorAll('#s-prn li')].map(l => l.textContent), held: /HELD/.test(document.querySelector('#sheet').innerText) }));
  check('SHOP: one\'s posters with where each is as pips, novel.global\'s printer and no other, how to build one, packs and beside them a crayon to novel.global for class; the eye with four tears; a wipe key; never "held for a yes"', /^[●○]{3}$/.test(shop.rec[0]) && shop.prn === 1 && /novel\.global|novelglobal/i.test(shop.prns[0]) && shop.build && shop.packs && shop.add === 'studio|true' && shop.tears === 4 && shop.wipe && !shop.held, JSON.stringify(shop));
  /* the composer: an 80 mm piece of what was made */
  const heads = await page.evaluate(() => [...document.querySelectorAll('#sheet .lbl')].map(l => l.textContent));
  await page.click('#comp [data-add="web"]'); await sleep(900); await page.click('#comp [data-add="song"]'); await sleep(600);
  await page.click('#comp [data-add="text"]'); await page.fill('#c-text', 'what holds'); await sleep(900);
  await page.click('#comp [data-add="poster"]'); await page.click('#c-pick [data-p]'); await sleep(1200);
  const c1 = await page.evaluate(() => ({ blocks: JSON.parse(localStorage.getItem('da.base.comp')).blocks.map(b => b.k), w: (document.querySelector('#c-pv canvas') || {}).width, h: (document.querySelector('#c-pv canvas') || {}).height }));
  await page.click('#comp [data-b="0"]'); await page.click('#c-dn'); await page.click('#c-sz'); await sleep(400);
  const c2 = await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.comp')).blocks.map(b => b.k + b.size));
  await page.click('#c-undo'); await sleep(300); const c3 = await page.evaluate(() => JSON.parse(localStorage.getItem('da.base.comp')).blocks.map(b => b.k + b.size));
  check('PRINT composes an 80 mm piece from what was made (the web, the song as its score, words, a poster), each block moved, sized, undone; every group under a small head', c1.blocks.join() === 'web,song,text,poster' && c1.w === 512 && c1.h > 900 && c2.join() === 'song2,web3,text2,poster2' && c3.join() === 'song2,web2,text2,poster2' && heads.includes('COMPOSE · 80 MM') && heads.includes('ADD') && heads.includes('PIECE'), JSON.stringify({ c1, c2, c3, heads }));
  await page.click('#c-pr'); await page.waitForFunction(() => { const p = document.querySelector('#c-st .pips'); return p && p.title && p.title !== 'sending'; }, null, { timeout: 10000 });
  const pce = (((await admin('stories?status=waiting')).stories) || []).find(x => x.kind === 'record' && /"piece"/.test(x.body));
  check('the piece prints at novel.global, 80 mm', !!pce && pce.dest === 'novelglobal' && JSON.parse(pce.body).blocks.length === 4, JSON.stringify(pce || {}).slice(0, 160));
  await page.click('#c-show'); await page.waitForSelector('#sh-hero', { timeout: 10000 }); await sleep(800);
  const sh = await page.evaluate(() => ({ hash: location.hash, hero: (document.querySelector('#sh-hero') || {}).src || '', web: (document.querySelector('#sh-web') || {}).width || 0, pieces: document.querySelectorAll('.show-strip [data-sh]').length, blue: getComputedStyle(document.querySelector('#sheet')).backgroundColor }));
  check('★ sends it to the showcase: on blueprint paper, the piece as hero, the journey\'s web beside it, every piece kept below', sh.hash === '#showcase' && /^data:image\/jpeg/.test(sh.hero) && sh.web > 100 && sh.pieces === 1 && sh.blue === 'rgb(23, 69, 127)', JSON.stringify(sh).slice(0, 200));
  await page.click('#sheet .hd .x'); await sleep(500);
  check('back from the showcase is PRINT', page.url().endsWith('#print'));
  await page.click('#comp [data-b="0"]').catch(() => {});
  const n0 = await page.evaluate(() => window.__base.notes().length);
  await page.click('#s-rec [data-rm="0"]'); await sleep(100); const n1 = await page.evaluate(() => window.__base.notes().length);
  await page.click('#s-rec [data-rm="0"]'); await sleep(300); const n2 = await page.evaluate(() => window.__base.notes().length);
  await page.click('.toast.undo'); await sleep(300); const n3 = await page.evaluate(() => window.__base.notes().length);
  check('a poster in PRINT is deleted only on the second touch (✓), and ↶ brings it back', n1 === n0 && n2 === n0 - 1 && n3 === n0, JSON.stringify([n0, n1, n2, n3]));
  await page.click('#s-rec [data-i="0"]'); await page.waitForSelector('#p-slip canvas'); await page.click('#sheet .hd .x'); await sleep(400);
  check('a poster opened from PRINT closes back to PRINT, not to the start', await page.evaluate(() => !!document.querySelector('#s-rec') && document.body.classList.contains('away')));
  /* the studio is its own site now, the devices site for class: devices on, no bar back to the base over its words */
  { const sp = await ctx.newPage(); await sp.addInitScript(() => { try { localStorage.removeItem('da.devices.v2'); } catch (e) { /* fine */ } }); await sp.goto('https://oan.test/studio?from=base'); await sp.waitForFunction(() => window.__da && window.__da.S.mapReady, null, { timeout: 60000 }); await sleep(2000);
    const so = await sp.evaluate(() => ({ plain: document.documentElement.classList.contains('plain'), veil: !!document.querySelector('#jr-veil'), home: (document.querySelector('#to-base') || {}).getAttribute ? document.querySelector('#to-base').getAttribute('href') : null }));
    check('the studio stands apart: its devices on by default, no first visit from a link, and no bar back to the base', !so.plain && !so.veil && so.home === null, JSON.stringify(so)); await sp.close(); }
  /* the guide: grouped and minimised first */
  await page.goto('https://oan.test/?base#radio'); await tap(page, '#b-search'); await page.waitForSelector('.idx'); await page.waitForFunction(() => document.querySelectorAll('.idx details.sec').length >= 5, null, { timeout: 8000 });
  const idx = await page.evaluate(() => [...document.querySelectorAll('.idx details.sec')].map(d => d.querySelector('h3').firstChild.textContent + (d.open ? '+' : '')));
  check('the GUIDE: Now open, the rest minimised: If you find, Who to call, In season, Neighbours, What worked elsewhere', idx.join() === 'Now+,If you find,Who to call,In season · Oct,Neighbours,What worked elsewhere', JSON.stringify(idx));
  await page.evaluate(() => { document.querySelectorAll('.idx details.sec')[4].open = true; }); await page.click('.idx details.sub summary:has-text("Owls and frogmouths")'); await sleep(200); await page.click('.idx details.sub [data-sp="tawny-frogmouth"]'); await sleep(300);
  const life = await page.evaluate(() => ({ h: document.querySelector('#sheet h2').textContent, yr: document.querySelectorAll('#sheet table.yr td.f2').length, now: !!document.querySelector('#sheet table.yr td.m'), spec: document.querySelectorAll('#sheet dl.spec dt').length }));
  check('a neighbour in the guide: its status, where, what to watch for, its year as a data sheet', life.h === 'Tawny Frogmouth' && life.yr >= 5 && life.now && life.spec >= 3, JSON.stringify(life));
  await shot(page, 'b04b-guide.png');
  await page.click('#sheet .back'); await page.fill('#q', 'frogmouth'); await sleep(300);
  check('one field searches the guide', await page.evaluate(() => !!document.querySelector('#g-out [data-sp="tawny-frogmouth"]')));
  await page.fill('#q', 'lights'); await sleep(300);
  const cs = await page.evaluate(() => { const d = document.querySelector('#g-out details.case'); if (!d) return null; d.querySelector('summary').click(); return { open: d.open, fact: (d.querySelector('p') || {}).textContent || '', out: [...document.querySelectorAll('#g-out a[target=_blank]')].every(a => a.classList.contains('src')) }; });
  check('what worked elsewhere opens where it is: what was done, and its source last and small', !!cs && cs.open && cs.fact.length > 20 && cs.out, JSON.stringify(cs));
  /* the map: filled, every mark explains itself, a card in place */
  await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#radio'); await sleep(500); await tap(page, '#b-map');
  await page.waitForFunction(() => window.__base.hits().knots.length > 10, null, { timeout: 15000 }).catch(() => {}); await sleep(1500);
  const mh = await page.evaluate(() => { const h = window.__base.hits(); const kn = h.knots; const on = kn.find(x => x.x > 80 && x.x < innerWidth - 80 && x.y > 80 && x.y < innerHeight - 120 && !kn.some(o => o !== x && Math.hypot(o.x - x.x, o.y - x.y) < 18)); return { knots: kn.length, sticks: h.sticks.length, at: on ? [on.x, on.y] : null, home: getComputedStyle(document.querySelector('#home')).display }; });
  if (mh.at) await page.mouse.move(mh.at[0], mh.at[1]); await sleep(300);
  const tip = await page.evaluate(() => { const t = document.querySelector('#tip'); return t.hidden ? '' : t.textContent; });
  check('MAP is filled with what is about, and a knot says what it is when the pointer is over it', mh.knots > 10 && mh.home === 'none' && /\S+ · /.test(tip), JSON.stringify(mh) + tip);
  const box = await page.evaluate(() => { const o = document.querySelector('#oled'); const b1 = o.querySelector('.l1 b').textContent; o.click(); return { shown: getComputedStyle(o).display !== 'none', wrap: getComputedStyle(o.querySelector('.l2')).whiteSpace, crawl: getComputedStyle(o.querySelector('.l2 span')).animationName, b1, b2: o.querySelector('.l1 b').textContent, n: o.querySelector('.l1 i').textContent }; });
  check('on the map, the box at the foot: what is urgent and in season, whole and still, a touch for the next', box.shown && box.wrap === 'normal' && box.crawl === 'none' && box.b1 !== box.b2 && /^\d+\/\d+$/.test(box.n), JSON.stringify(box));
  const at2 = await page.evaluate(() => { const kn = window.__base.hits().knots; const on = kn.find(x => x.x > 80 && x.x < innerWidth - 80 && x.y > 80 && x.y < innerHeight - 120 && !kn.some(o => o !== x && Math.hypot(o.x - x.x, o.y - x.y) < 18)); return on ? [on.x, on.y] : null; });
  const u1 = page.url(); if (at2) await page.mouse.click(at2[0], at2[1]); await sleep(500);
  check('a knot touched opens its card in place, never another page', await page.evaluate(() => !document.querySelector('#peek').hidden) && page.url() === u1, page.url());
  await page.click('#pk-x');
  const before = await page.evaluate(() => window.__base.notes().length);
  await page.setInputFiles('#m-add', [{ name: 'creek.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }, { name: 'frog-call.mp3', mimeType: 'audio/mpeg', buffer: Buffer.alloc(2000) }]); await sleep(1200);
  const mp = await page.evaluate(() => ({ tiles: document.querySelectorAll('#tiles img').length, notes: window.__base.notes().length, call: window.__base.notes().some(n => n.call && n.audio) }));
  check('+ adds photographs and calls at once, a photograph where it was taken; the map goes to them and the first opens', mp.tiles > 3 && mp.notes === before + 2 && mp.call && await page.evaluate(() => !document.querySelector('#peek').hidden), JSON.stringify(mp));
  await page.context().grantPermissions(['geolocation']); await page.context().setGeolocation({ latitude: -37.8001, longitude: 144.9652 });
  await page.click('#pk-x').catch(() => {}); await page.click('#b-me'); await sleep(800);
  check('◎ finds where one is on the map and marks it', await page.evaluate(() => !!document.querySelector('#net .me-dot')));
  await page.click('#b-map'); await sleep(800);
  check('closing the map returns to the page it was opened from, not the start', page.url().endsWith('#radio') && await page.evaluate(() => !!document.querySelector('#deck')), page.url());
  await shot(page, 'b04c-map.png');
  /* the pixel board */
  await page.goto('https://oan.test/?base#pixel'); await page.waitForSelector('#pb-in', { state: 'attached' });
  await page.setInputFiles('#pb-in', { name: 'a.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }); await page.waitForSelector('#pb canvas', { timeout: 5000 });
  const px = await page.evaluate(() => { const c = document.querySelector('#pb canvas'); return { w: c.width, frames: document.querySelectorAll('#pb-f button').length }; });
  check('the pixel board turns a picture into wonky pixels', px.w > 100 && px.frames === 1, JSON.stringify(px));
  await page.click('#pb-c [data-v="128"]'); await sleep(300);
  const p128 = await page.evaluate(() => document.querySelector('#pb canvas').width);
  await page.click('#pb-icon'); await sleep(500);
  const ic1 = await page.evaluate(() => window.__base.icons().length);
  check('the pixel maker goes to 128 cells, and its art becomes an icon for posters', p128 >= 512 && ic1 === 1, JSON.stringify({ p128, ic1 }));
  const gd = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await page.click('#pb-gif'); const gf = await gd;
  check('its sprite saves moving, as a GIF (gifenc)', !!gf && /\.gif$/.test(gf.suggestedFilename()) && (await page.evaluate(() => window.__lastGif || 0)) > 200, String(gf && gf.suggestedFilename()));
  await page.click('#sheet .hd .x'); await sleep(600);
  check('closing the pixel maker goes back to PRINT, not the start', page.url().endsWith('#print') && await page.evaluate(() => !!document.querySelector('#s-rec') && !!document.querySelector('#s-ico [data-ic]')), page.url());
  const png1 = (await sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png().toBuffer()).toString('base64');
  await page.setInputFiles('#s-ico-in', { name: 'pack.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ pack: 'novel.global/icons', name: 'test', icons: [{ src: 'data:image/png;base64,' + png1, t: 'dot' }] })) }); await sleep(800);
  check('an icon pack adds its icons to PRINT', (await page.evaluate(() => window.__base.icons().length)) === 2);
  await page.click('#s-ico [data-ic]'); await sleep(300); await page.click('#s-rec [data-i="0"]'); await page.waitForSelector('#p-ico [data-ic]'); await page.click('#p-ico [data-ic]'); await sleep(900);
  const iconOn = await page.evaluate(() => ({ icon: (window.__base.notes()[0].icon || '').slice(0, 10), on: document.querySelectorAll('#p-ico button.on').length }));
  check('on the design stage an icon goes on the poster, stamped in its art, and stands for it on the map', iconOn.icon === 'data:image' && iconOn.on === 1, JSON.stringify(iconOn));
  await page.click('#sheet .hd .x'); await sleep(400);
  const ex = await page.evaluate(async b64 => { await new Promise(r => { const s = document.createElement('script'); s.src = 'vendor/exifr.js'; s.onload = r; s.onerror = r; document.head.appendChild(s); }); const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); const o = await window.exifr.parse(bin.buffer, { gps: true }); return o ? [o.latitude, o.longitude] : null; }, (await exifJPEG()).toString('base64'));
  check('exifr reads where a photograph was taken when the small reader cannot (HEIC and others)', !!ex && Math.abs(ex[0] + 37.806) < 0.01 && Math.abs(ex[1] - 144.971) < 0.01, JSON.stringify(ex));
  await page.goto('https://oan.test/?base#print'); await page.waitForSelector('#s-wipe'); await page.click('#s-wipe'); await sleep(200);
  const w1 = await page.evaluate(() => ({ sure: document.querySelector('#s-wipe').classList.contains('sure'), notes: window.__base.notes().length }));
  await Promise.all([page.waitForNavigation({ timeout: 10000 }).catch(() => null), page.click('#s-wipe')]); await sleep(1200);
  const w2 = await page.evaluate(() => ({ keys: Object.keys(localStorage).filter(k => /^da\.base\./.test(k) && k !== 'da.base.theme'), hash: location.hash, start: (document.querySelector('#aura') ? !document.querySelector('#aura').hidden : getComputedStyle(document.querySelector('#home')).display !== 'none') }));
  check('wipe asks first (✓), then everything this device made is gone and the start returns', w1.sure && w1.notes > 0 && !w2.keys.filter(k => !/da\.base\.(packs|song|web)$/.test(k)).length && !w2.hash && w2.start, JSON.stringify({ w1, w2 }));
  /* a studio link still opens the studio */
  await page.goto('https://oan.test/#mix=-37.7712,144.9601,750,121000010128'); await page.waitForURL(/\/studio#mix=/, { timeout: 8000 }).catch(() => {});
  check('a link the studio made (#mix=…) goes on to the studio', /\/studio#mix=-37\.7712/.test(page.url()), page.url());
  /* the booth: a printer's own page, reached by the QR sticker kept with SHOP's downloads */
  await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#shop'); await page.waitForSelector('#s-qr');
  const dq = page.waitForEvent('download', { timeout: 10000 }).catch(() => null); await page.click('#s-qr'); const qf = await dq;
  const qrTo = qf ? await (async () => { const { data, info } = await sharp(await qf.path()).flatten({ background: '#ffffff' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const q = jsQR(new Uint8ClampedArray(data), info.width, info.height); return q ? q.data : null; })() : null;
  check('SHOP keeps the booth\'s QR sticker with the other downloads, and it reads as the booth\'s page', qrTo === 'https://oan.test/#booth', String(qrTo));
  await page.evaluate(() => { window.__said = []; const f = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t) { window.__said.push(String(t)); return f.apply(this, arguments); }; });
  await page.click('#s-poster'); await page.waitForFunction(() => /●/.test(document.querySelector('#s-pst').textContent), null, { timeout: 10000 });
  const pw = (((await admin('stories?status=waiting')).stories) || []).find(x => x.kind === 'record' && /"poster"/.test(x.body));
  const pc0 = await page.evaluate(async () => { const c = await window.__base.poster('novelglobal', 512); return { url: c.toDataURL('image/png'), w: c.width, said: [...new Set(window.__said)] }; });
  const onPoster = await qrIn(pc0.url);
  check('SHOP prints the poster on the 80 mm printer: PRINT FREE in big ASCII letters on two lines, its only words beside novel.global, its code drawn in terminal cells and still read by a camera', !!pw && pw.dest === 'novelglobal' && pc0.w === 512 && pc0.said.includes('| _ \\| _ \\|_ _|| \\| ||_   _|') && pc0.said.includes('|_|  |_|_\\|___||___|') && !pc0.said.some(t => /PRINT|FREE/.test(t)) && onPoster === 'https://oan.test/#booth', JSON.stringify({ said: pc0.said.slice(0, 12), onPoster, dest: pw && pw.dest }));
  await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#booth'); await page.waitForSelector('#booth .am');
  const b0 = await page.evaluate(() => ({ keys: [...document.querySelectorAll('#booth label, #booth button, #booth a')].map(k => k.textContent.trim()), cams: [...document.querySelectorAll('#booth input[type=file]')].map(i => i.hasAttribute('capture')), shown: [...document.body.children].filter(e => !/^(SVG|svg|SCRIPT)$/.test(e.tagName) && getComputedStyle(e).display !== 'none').map(e => e.id || e.tagName) }));
  await shot(page, 'b06-booth.png');
  check('the booth: nothing but take or upload a photograph, as small ASCII keys; nothing else of the site shows', b0.keys.join() === '[ (o) ],[ ^ ]' && b0.cams.join() === 'true,false' && b0.shown.join() === 'booth', JSON.stringify(b0));
  await page.setInputFiles('#booth input:not([capture])', { name: 'me.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() });
  await page.waitForFunction(() => { const c = document.querySelector('#bt-pv canvas'); return c && c.width > 100; }, null, { timeout: 10000 }); await sleep(300);
  const ed = await page.evaluate(() => { const c = document.querySelector('#bt-pv canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, Math.round(c.height * 0.6)).data; let mid = 0, ink = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 20 && d[i] < 235) mid++; if (d[i] < 20) ink++; } return { w: c.width, mid, ink: +(ink / (d.length / 4)).toFixed(2), keys: [...document.querySelectorAll('#booth button')].map(b => b.textContent) }; });
  check('then stickers and words in an ASCII menu, the photograph shown as it will print: dithered to one bit at the printer\'s 512 dots (CanvasDither)', ed.w === 512 && ed.mid === 0 && ed.ink > 0.1 && ed.ink < 0.9 && ed.keys.includes('[ <3 ]') && ed.keys.includes('[ Aa ]') && ed.keys.includes('[ >> ]'), JSON.stringify(ed));
  await page.click('#bt-st [data-k="1"]'); const bx = await page.locator('#bt-pv canvas').boundingBox(); await page.mouse.click(bx.x + bx.width * 0.3, bx.y + bx.height * 0.3); await sleep(200);
  await page.click('#bt-aa'); await page.fill('#bt-w', 'hello from carlton'); await shot(page, 'b06b-booth-edit.png'); await page.click('#bt-go');
  await page.waitForSelector('#bt-again', { timeout: 10000, state: 'attached' }); await page.waitForFunction(() => /●/.test(document.querySelector('#bt-pip').textContent), null, { timeout: 10000 });
  const bw = (((await admin('stories?status=waiting')).stories) || []).find(x => x.kind === 'record' && /"booth"/.test(x.body));
  const bb = bw ? JSON.parse(bw.body) : {};
  const out = await page.evaluate(() => ({ url: document.querySelector('.pv.slip canvas').toDataURL('image/png'), w: document.querySelector('.pv.slip canvas').width, keys: [...document.querySelectorAll('#bt-on > *')].map(k => k.textContent.trim() + '>' + (k.getAttribute('href') || '')), st: window.__base.notes()[0].st }));
  const onSlip = await qrIn(out.url);
  check('⎙ prints it: sent to the printer with its colour photograph for the gallery, its words, and the receipt\'s small code opens its page on the site', !!bw && bw.photo && bw.dest === 'novelglobal' && bb.type === 'booth' && bb.text === 'hello from carlton' && out.w === 512 && onSlip === 'https://oan.test/#n=' + bw.code, JSON.stringify({ bb, onSlip, code: bw && bw.code }));
  await sleep(600); await shot(page, 'b06c-booth-sent.png');
  const hid = await page.evaluate(() => document.querySelector('#bt-again').hidden);
  check('once sent, two ways on and no more: again (hidden through an unseen wait of two to five minutes, against printing on repeat), or novel.global', out.keys.join() === '[ ↺ ]>,[ novel.global ]>https://oan.test/' && hid, JSON.stringify(out.keys) + hid);
  await page.click('#bt-site'); await page.waitForFunction(() => !document.body.classList.contains('booth') && (document.querySelector('#aura') ? !document.querySelector('#aura').hidden : getComputedStyle(document.querySelector('#home')).display !== 'none'), null, { timeout: 8000 });
  check('novel.global opens the full site, and the booth photograph is kept as one\'s own, out of the W.I.S.H. thread', await page.evaluate(() => window.__base.notes()[0].booth === true && !location.hash));
  const wait = await page.evaluate(() => (+localStorage.getItem('da.booth.next')) - Date.now());
  await page.goto('https://oan.test/?base#booth'); await page.waitForSelector('#booth .art'); await sleep(300);
  const locked = await page.evaluate(() => document.querySelectorAll('#booth label, #booth button').length + '|' + [...document.querySelectorAll('#booth a')].map(a => a.textContent.trim()).join());
  await page.evaluate(() => localStorage.setItem('da.booth.next', '0')); await page.reload(); await page.waitForSelector('#booth .am');
  check('the wait holds through a reload: only novel.global until it is over, then the two again', wait > 110e3 && wait < 301e3 && locked === '0|[ novel.global ]', JSON.stringify({ wait, locked }));
  await ctx.close();
  /* on a phone: nothing wider than the screen */
  const pc = await newCtx({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await wire(pc); const pp = await pc.newPage(); watch(pp, 'base-phone');
  await pp.goto('https://oan.test/?base'); await sleep(1500); await shot(pp, 'b05-phone.png');
  await pp.goto('https://oan.test/?base'); await pp.goto('https://oan.test/?base#print'); await pp.waitForSelector('#sheet .eye .shot', { state: 'attached' });
  await pp.setInputFiles('#sheet .eye .shot', { name: 'lori.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }); await pp.waitForSelector('#n-next'); await pp.fill('#n-say', 'lorikeet fledgling'); await sleep(700); await shot(pp, 'b07-phone-notice.png');
  await pp.click('#n-next'); await pp.waitForSelector('#p-slip canvas'); await sleep(500); await shot(pp, 'b08-phone-s.png');
  await pp.goto('https://oan.test/?base'); await pp.goto('https://oan.test/?base#radio'); await pp.waitForSelector('#sheet .grip'); await sleep(600);
  const g = await pp.locator('#sheet .grip').boundingBox(), hA = await pp.evaluate(() => document.querySelector('#sheet').getBoundingClientRect().height);
  await pp.mouse.move(g.x + g.width / 2, g.y + 8); await pp.mouse.down(); await pp.mouse.move(g.x + g.width / 2, g.y + 260, { steps: 8 }); await pp.mouse.up(); await sleep(300);
  const hB = await pp.evaluate(() => document.querySelector('#sheet').getBoundingClientRect().height);
  check('on a phone RADIO slides down on a rail to show the map, and settles', hB < hA - 120, JSON.stringify({ hA, hB }));
  await pp.goto('https://oan.test/?base'); await pp.goto('https://oan.test/?base#print'); await pp.waitForSelector('#sheet .eye .shot', { state: 'attached' });
  await pp.setInputFiles('#sheet .eye .shot', { name: 'lori.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }); await pp.waitForSelector('#n-next'); await pp.click('#n-next'); await pp.waitForSelector('#p-slip canvas'); await sleep(500);
  const still = await pp.evaluate(() => ({ vp: document.querySelector('meta[name=viewport]').content, ta: getComputedStyle(document.documentElement).touchAction, fields: [...document.querySelectorAll('#sheet textarea, #sheet input, #sheet select')].filter(e => e.offsetParent).map(e => getComputedStyle(e).fontSize) }));
  check('on a phone the page holds still: no zoom on a double tap, none when a field is touched', /maximum-scale=1/.test(still.vp) && still.ta === 'manipulation' && still.fields.length && still.fields.every(f => parseFloat(f) >= 16), JSON.stringify(still));
  const wide = await pp.evaluate(() => Math.max(document.documentElement.scrollWidth, document.querySelector('#sheet').scrollWidth));
  check('on a phone the base fits the screen', wide <= 375, String(wide));
  await pc.close();
} catch (e) { results.push(`FAIL  section base: ${e.message.split('\n')[0]} — after: ${(results[results.length - 1] || '').slice(6, 90)} @${((e.stack || '').match(/run\.mjs:(\d+)/) || [])[1]}`); }

// ───────── aura: the showcase at /. The seed, the bang, the globe, the irukandji, one piece through its four steps (ONLY=aura) ─────────
for (const AD of (process.env.AURA_DESK ? [true] : [false, true])) if (run('aura')) try {
  const tag = AD ? 'desk' : 'phone', P = AD ? 'ad' : 'ap';
  if (!AD) { const src = fs.readFileSync(path.join(ROOT, 'src/base/aura.js'), 'utf8');
    check('the aura is plain script for old phones too: no optional chaining, no ??', !/\?\.[a-zA-Z_$[(]|\?\?/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/'(?:\\.|[^'\\])*'/g, "''")));
    check('the aura never opens another window', !/target=["']?_blank|window\.open\(/.test(src)); }
  const geo = { geolocation: { latitude: -37.7712, longitude: 144.9611, accuracy: 30 }, permissions: ['geolocation'] };
  const ctx = await newCtx(AD ? { timezoneId: 'Australia/Melbourne', ...geo } : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, timezoneId: 'Australia/Melbourne', ...geo });
  await ctx.setExtraHTTPHeaders({ 'cf-connecting-ip': AD ? '10.9.0.2' : '10.9.0.1' }); await wire(ctx, { plain: true }); const page = await ctx.newPage(); watch(page, 'aura-' + tag);
  const st = () => page.evaluate(() => window.AURA.state());
  const panelText = () => page.evaluate(() => document.querySelector('#au-panel').innerText.trim());
  const toIruk = async s => { await page.mouse.click(AD ? 720 : 195, AD ? 450 : 422); await sleep(3000); await page.evaluate(n => document.querySelector(`.au-orb[data-s="${n}"]`).click(), s); await page.waitForFunction(() => window.AURA.state().mode === 'iruk', null, { timeout: 5000 }); await sleep(600); };
  await page.goto('https://oan.test/'); await page.waitForSelector('#aura'); await sleep(900); await shot(page, `${P}01-seed.png`);
  const s0 = await st(); const vis0 = await page.evaluate(() => ({ home: getComputedStyle(document.querySelector('#home')).display, orbs: [...document.querySelectorAll('.au-orb')].filter(o => getComputedStyle(o).display !== 'none').length, top: getComputedStyle(document.querySelector('#top')).display }));
  check(`aura (${tag}): the start is a seed of light alone on the paper, no rings, keys or words yet`, s0.mode === 'seed' && vis0.home === 'none' && vis0.orbs === 0 && vis0.top === 'none', JSON.stringify({ s0, vis0 }));
  await page.mouse.click(AD ? 720 : 195, AD ? 450 : 422); await sleep(700); const s1 = await st(); await shot(page, `${P}02-bang.png`);
  await sleep(2600); const s2 = await st(); await shot(page, `${P}03-globe.png`);
  check(`aura (${tag}): a touch bursts it into the globe, and the drone begins at 70% of the base's (0.385)`, s1.mode === 'bang' && s2.mode === 'globe' && Math.abs(s2.hum - 0.385) < 1e-6, JSON.stringify({ s1: s1.mode, s2: s2.mode, hum: s2.hum }));
  const g = await page.evaluate(() => [...document.querySelectorAll('.au-orb')].map(o => ({ l: o.getAttribute('aria-label'), n: !o.querySelector('.au-rune, .au-n'), ring: !!o.querySelector('.au-ring'), op: +o.style.opacity, call: getComputedStyle(o.querySelector('.au-i')).animationName })));
  const bl = await page.evaluate(() => { const e = getComputedStyle(document.querySelector('#au-base')); return e.animationName + ' ' + e.animationDelay; });
  check(`aura (${tag}): the start's corner (open everything, and the mark) waits fifteen seconds on the globe before it shows, faint`, bl === 'au-late 15s', bl);
  check(`aura (${tag}): RADIO, W.I.S.H. and PRINT ride the rings as icons alone (no numbers, no signs); only the first is lit and calls`, g.length === 3 && g.every(o => o.n && o.op > 0.2) && g.map(o => o.l).join() === 'RADIO,W.I.S.H.,PRINT' && g[0].call === 'au-call' && g[0].ring && !g[1].ring && g[1].call !== 'au-call', JSON.stringify(g));
  check(`aura (${tag}): the hand-drawn lines and the drift are the brought-in projects (perfect-freehand, simplex-noise)`, s2.pf && s2.noise, JSON.stringify(s2));
  await page.evaluate(() => document.querySelector('.au-orb[data-s="0"]').click()); await sleep(500); const sm = await st(); await shot(page, `${P}04-morph.png`); await page.waitForFunction(() => window.AURA.state().mode === 'iruk', null, { timeout: 5000 }); await sleep(150);
  const s3 = await st(); const ik = await page.evaluate(() => ({ tabs: [...document.querySelectorAll('.au-tab')].map(t => t.getAttribute('aria-label') + (t.classList.contains('on') ? '*' : '')), words: [...document.querySelectorAll('.au-tab')].map(t => t.textContent.trim()).join(''),
    held: [...document.querySelectorAll('#au-catch, .au-grab')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id), url: location.href, eye: !!document.querySelector('#au-bell input[type=file]') && !document.querySelector('#au-panel .au-eye'),
    keys: [...document.querySelectorAll('#au-panel button:not(.au-go)')].length, go: !!document.querySelector('#au-panel .au-go[data-go="1"] .au-arrow') && document.querySelector('#au-panel .au-go').textContent.trim() === '', nums: document.querySelectorAll('.au-tab .au-n').length, titles: document.querySelectorAll('#aura [title]').length, ask: document.querySelector('.au-ask').textContent, ask0: document.querySelector('.au-ask').dataset.on + '/' + document.querySelector('.au-ask').dataset.off,
    gap: (() => { const b = document.querySelector('#au-bell').getBoundingClientRect(), c = document.querySelector('#au-catch').getBoundingClientRect(); return Math.round(c.top - b.bottom); })() }));
  await page.mouse.move(150, 300); const qt0 = Date.now(); await page.waitForFunction(() => document.querySelector('.au-ask').classList.contains('on'), null, { timeout: 22000 }).catch(() => {}); const ask1 = await page.evaluate(() => ({ on: document.querySelector('.au-ask').classList.contains('on'), hint: document.querySelector('#au-panel p.au-hint').textContent, many: document.querySelectorAll('#aura .au-hint.on').length })); await shot(page, `${P}05-iruk.png`);
  check(`aura (${tag}): a page touched draws the rings in as the irukandji on the same paper: the bell is the eye, four steps at the tips as icons alone, one thing held below it, no words on hover`, sm.mode === 'morph' && s3.mode === 'iruk' && ik.url === 'https://oan.test/' && ik.tabs.join() === 'notice*,W.I.S.H.,art,print' && ik.words === '' && ik.held.join() === 'au-catch' && ik.eye && ik.keys === 0 && ik.titles === 0, JSON.stringify({ sm: sm.mode, s3: s3.mode, ik }));
  { const h0 = (await st()).halo; await page.mouse.move(300, 300); await sleep(700); await page.mouse.move(320, 310); await sleep(700); const h1 = (await st()).halo;
    check(`aura (${tag}): the thing held turns slowly round the tentacles, on a halo no one sees`, h1 > h0, JSON.stringify({ h0, h1 })); }
  check(`aura (${tag}): "what’s your intention?" and what to do come one at a time, after ten seconds of quiet, said plainly; the next step waits at the foot as a sign alone; no numbers by the steps`, ik.nums === 0 && ik.ask === 'what’s your intention?' && ik.ask0 === '7/20' && ask1.on && ask1.many === 1 && /write what you want to happen/.test(ask1.hint) && ik.go, JSON.stringify({ ask0: ik.ask0, ask1, go: ik.go }));
  if (AD) { await page.hover('#au-bell'); await sleep(200); const tone = await page.evaluate(() => window.__auraTone); await page.mouse.move(5, 500);
    check(`aura (${tag}): the eye and the thing held breathe, and sound a deep tone when the pointer finds them`, tone === 55 && await page.evaluate(() => getComputedStyle(document.querySelector('#au-catch')).animationName === 'au-breathe'), String(tone)); }
  const gate0 = await page.evaluate(() => document.querySelector('.au-go').classList.contains('wait'));
  await page.fill('#au-say', 'rainbow lorikeet fledgling on the path'); await sleep(500); const t1 = await panelText();
  const gate1 = await page.evaluate(() => document.querySelector('.au-go').classList.contains('wait'));
  check(`aura (${tag}): the way on shows only once the intention has a few words`, gate0 && !gate1, JSON.stringify({ gate0, gate1 }));
  const nx = await page.evaluate(() => (document.querySelector('.au-tab.next') || {}).dataset);
  check(`aura (${tag}): the line, and nothing said about it (no life, no place, no time) until it is caught; the next step breathes`, !/carlton|oct/i.test(t1.replace('rainbow lorikeet fledgling on the path', '')) && nx && nx.s === '1', JSON.stringify({ t1, nx }));
  await page.focus('#au-say'); await page.keyboard.press('Enter'); await sleep(900);
  const w0 = await page.evaluate(() => ({ intent: (document.querySelector('.au-intent') || {}).textContent, gate: document.querySelector('.au-go').classList.contains('wait'), v: [...document.querySelectorAll('.au-wish textarea')].map(t => t.value), says: [...document.querySelectorAll('.au-wish b')].map(b => b.dataset.say), alts: document.querySelectorAll('.au-alt').length, on: document.querySelector('.au-tab.on').getAttribute('aria-label') }));
  check(`aura (${tag}): the intention heads the poem, the four lines start empty (the way on hidden till each has words), each letter's words there when looked for`, w0.on === 'W.I.S.H.' && w0.intent === 'rainbow lorikeet fledgling on the path' && w0.gate && w0.v.every(v => v === '') && w0.alts === 0 && w0.says.join('|') === 'What we know|It would be great|So let’s create|Here’s how it works', JSON.stringify(w0));
  await sleep(1100); await page.mouse.move(100, 300); await sleep(300); const f0 = (await st()).frames; await sleep(500); const wf = await page.evaluate(f0 => ({ form: window.AURA.state().form, mode: window.AURA.state().mode, hidden: document.hidden, loose: document.querySelector('#aura').classList.contains('loose'), beads: getComputedStyle(document.querySelector('.au-wish li'), '::after').backgroundImage, drift: document.querySelector('.au-tab').style.transform }), f0);
  await page.mouse.move(140, 320); await sleep(600); const drift2 = await page.evaluate(() => document.querySelector('.au-tab').style.transform); await shot(page, `${P}06-lines.png`);
  check(`aura (${tag}): in W.I.S.H. the four tentacles are the four lines, and the steps they let go of drift`, wf.form === 'wish' && wf.loose && /radial-gradient/.test(wf.beads) && wf.drift !== drift2, JSON.stringify({ ...wf, drift2 }));
  { const lb = page.locator('.au-wish li:nth-child(2) b'); if (AD) await lb.click(); else await lb.tap(); await page.waitForFunction(() => +getComputedStyle(document.querySelector('.au-wish li:nth-child(2) .au-wtip')).opacity > 0.6, null, { timeout: 4000 }).catch(() => {});
    const tip = await page.evaluate(() => { const t = document.querySelector('.au-wish li:nth-child(2) .au-wtip'); return { op: +getComputedStyle(t).opacity, txt: t.textContent }; }); await shot(page, `${P}06-tip.png`);
    check(`aura (${tag}): a letter pointed at or tapped says on its own line what goes there`, tip.op > 0.4 && /It would be great/.test(tip.txt) && /what you want to happen/.test(tip.txt), JSON.stringify(tip)); await page.mouse.move(5, 500); }
  await page.setInputFiles('#au-file', { name: 'lori.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }); await page.waitForFunction(() => window.AURA.state().piece.eye, null, { timeout: 8000 }).catch(() => {}); await sleep(300);
  const cam = await st(); await shot(page, `${P}07-eye.png`);
  const wph = await page.evaluate(() => { const i = document.querySelector('.au-whead img'); return i ? Math.abs(i.getBoundingClientRect().width / i.getBoundingClientRect().height - i.naturalWidth / i.naturalHeight) < 0.03 : false; });
  check(`aura (${tag}): the eye takes a photograph from W.I.S.H. and the step stays: what it saw sits in its pupil, and over the four lines, small and whole`, cam.stage === 1 && cam.piece.photo && cam.piece.eye && wph, JSON.stringify({ stage: cam.stage, photo: cam.piece.photo, eye: cam.piece.eye, wph }));
  const L4 = ['rainbow lorikeet fledgling on the path', 'Left to its parents', 'We walk round, dogs on leads', 'Until it flies'];
  await tap(page, '.au-wish textarea[data-i="0"]'); for (const l of L4) { await page.keyboard.type(l); await page.keyboard.press('Enter'); await sleep(150); } await sleep(600);
  const w1 = await st();
  check(`aura (${tag}): the four lines are one's own, written straight through (Enter goes on to the next, the last on to the art)`, JSON.stringify(w1.piece.lines) === JSON.stringify(L4) && w1.stage === 2, JSON.stringify({ lines: w1.piece.lines, stage: w1.stage }));
  await tap(page, '#au-catch', { force: true }); await sleep(1300); await shot(page, `${P}08-catch.png`);
  const c0 = await page.evaluate(() => ({ deep: window.AURA.state().deep, heads: document.querySelectorAll('#au-deep h1,#au-deep h2,#au-deep h3,#au-deep .au-dh,#au-deep em,#au-deep small').length, names: [...document.querySelectorAll('#au-names button')].map(b => b.textContent), map: !!document.querySelector('#au-map'), vals: document.querySelectorAll('#au-vals button').length, nino: !!document.querySelector('#au-nino:not([hidden]) .au-spark'), tiles: document.querySelectorAll('.au-tiles img').length, blend: getComputedStyle(document.querySelector('.au-tiles img') || document.body).mixBlendMode }));
  check(`aura (${tag}): the map, the lives, the readings and El Niño are one thing held, opened in the page's place, with no headings or notes over them`, c0.deep && c0.heads === 0 && c0.map && c0.vals > 1 && c0.nino && c0.tiles > 0 && c0.blend === 'luminosity', JSON.stringify(c0));
  check(`aura (${tag}): no life is offered: only the one named in one's own words shows until one is looked for`, c0.names.join() === 'Rainbow Lorikeet', JSON.stringify(c0.names));
  /* under the map: every life as a wall of photographs, by kind; a card turns over and can be caught; what to do now under El Niño */
  await page.waitForFunction(() => document.querySelectorAll('#au-spw .au-card').length >= 12, null, { timeout: 8000 }).catch(() => {});
  const sw0 = await page.evaluate(() => ({ n: document.querySelectorAll('#au-spw .au-card').length, kinds: document.querySelectorAll('#au-kinds button').length }));
  await page.evaluate(() => document.querySelector('#au-kinds [data-k="frogs"]').click()); await sleep(500);
  const sw1 = await page.evaluate(() => [...document.querySelectorAll('#au-spw .au-card')].slice(0, 6).map(c => (window.NG.DB().field.find(f => f.id === c.dataset.id) || {}).g));
  await page.evaluate(() => { const c = document.querySelector('#au-spw .au-card'); c.scrollIntoView(); c.click(); }); await sleep(700); await shot(page, `${P}08d-cards.png`);
  const flip = await page.evaluate(() => document.querySelector('#au-spw .au-card').classList.contains('flip'));
  check(`aura (${tag}): under the map, every life as a wall of photographs that keeps coming, narrowed by kind with small signs; a card turns over`, sw0.n >= 12 && sw0.kinds === 6 && sw1.length && sw1.every(g => /^(frog|lizard|snake|turtle)$/.test(g)) && flip, JSON.stringify({ sw0, sw1, flip }));
  await page.evaluate(() => document.querySelector('#au-kinds [data-k="all"]').click()); await sleep(300);
  await page.evaluate(() => document.querySelector('#au-actb').click()); await sleep(300);
  const acts = await page.evaluate(() => [...document.querySelectorAll('#au-acts li')].map(l => l.textContent));
  check(`aura (${tag}): El Niño has what to do now, in plain words (water out for wildlife, neighbours, fire danger, who to call)`, acts.length >= 6 && acts.some(a => /Wildlife Victoria/.test(a)) && acts.some(a => /VicEmergency/.test(a)), JSON.stringify(acts.slice(0, 3)));
  await page.evaluate(() => document.querySelector('#au-actb').click());
  await page.waitForFunction(() => window.AURA.state().me, null, { timeout: 6000 }).catch(() => {}); const me = (await st()).me;
  check(`aura (${tag}): the map shows where one is (the phone asked)`, me && Math.abs(me[0] + 37.7712) < 1e-3, JSON.stringify(me));
  await tap(page, '#au-near summary'); await page.waitForFunction(() => document.querySelectorAll('#au-nearl button').length > 1, null, { timeout: 8000 }).catch(() => {}); await shot(page, `${P}08b-near.png`);
  const nr = await page.evaluate(() => [...document.querySelectorAll('#au-nearl button')].map(b => b.firstChild.textContent));
  await tap(page, '#au-nearl button'); await sleep(300); const nc = (await st()).piece.caught;
  check(`aura (${tag}): what is near this place unfolds from one line, and a touch catches it`, nr.length > 1 && nc.includes('data'), JSON.stringify({ nr, nc }));
  await tap(page, '#au-near summary'); await sleep(200);
  const mb = await page.locator('#au-map').boundingBox(); await page.mouse.click(mb.x + mb.width * 0.6, mb.y + mb.height * 0.4); await sleep(400);
  await tap(page, '#au-names button'); await sleep(250); await page.fill('#au-q', 'frog'); await sleep(300);
  const found = await page.evaluate(() => [...document.querySelectorAll('#au-names button')].map(b => b.textContent));
  check(`aura (${tag}): a life is found by its name, and what was caught stays`, found[0] === 'Rainbow Lorikeet' && found.length > 1 && found.slice(1).every(n => /frog/i.test(n)), JSON.stringify(found));
  await page.waitForFunction(() => window.AURA.state().piece.spPhoto, null, { timeout: 8000 }).catch(() => {});
  check(`aura (${tag}): the life caught brings its own photograph, credited, for when there is none of one's own`, (await st()).piece.spPhoto, '');
  await tap(page, '#au-seab'); await page.waitForFunction(() => document.querySelectorAll('#au-sea button').length > 2, null, { timeout: 8000 }).catch(() => {}); await sleep(600); await shot(page, `${P}08c-season.png`);
  const sea = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#au-sea button .t')].map(b => b.textContent), near: [...document.querySelectorAll('#au-sea button.near small')].map(b => b.textContent), ninoH: Math.round(document.querySelector('#au-nino').getBoundingClientRect().height) }));
  const why = await page.evaluate(() => (document.querySelector('.au-why') || {}).textContent || '');
  check(`aura (${tag}): El Niño says why it matters now, in plain words`, /El Niño is here/.test(why) && /fire risk/.test(why) && why.length < 200, why.slice(0, 120));
  check(`aura (${tag}): El Niño is small, and this month opens to what to watch for, those seen within a kilometre first`, sea.rows.length > 2 && sea.ninoH < 90, JSON.stringify(sea));
  await tap(page, '#au-seab'); await sleep(200);
  await page.fill('#au-q', ''); await tap(page, '#au-vals li:nth-child(1) button'); await sleep(250); await tap(page, '#au-nino'); await sleep(250);
  const c1 = await st(); const dots = await page.evaluate(() => document.querySelector('#au-catch b').textContent);
  check(`aura (${tag}): what is touched is caught (the life, a reading, El Niño, the map where it was), counted on the thing held`, ['map', 'life', 'data', 'nino'].every(k => c1.piece.caught.includes(k)) && dots.length === 4, JSON.stringify({ caught: c1.piece.caught, dots }));
  await tap(page, '#au-dx'); await sleep(1600); await shot(page, `${P}09-art.png`);
  const af = (await st()).form; check(`aura (${tag}): in art the four tentacles are the four sides round the piece`, af === 'frame2', af);
  const lay = (await st()).layers; check(`aura (${tag}): only the rings' own drone, no backing layers grown under it`, lay === 0, String(lay));
  const a = await page.evaluate(() => { const c = document.querySelector('.au-drag canvas'), x = c.getContext('2d'); let sat = 0; for (let i = 0; i < 40; i++) { const d = x.getImageData(Math.floor(c.width * (0.2 + i / 70)), Math.floor(c.height * 0.2), 1, 1).data; sat = Math.max(sat, Math.max(d[0], d[1], d[2]) - Math.min(d[0], d[1], d[2])); }
    return { arts: [...document.querySelectorAll('[data-art]')].map(b => b.dataset.art + (b.classList.contains('on') ? '*' : '') + (b.textContent.trim() ? '+words' : '')), thumbs: [...document.querySelectorAll('[data-art] canvas')].filter(c => c.width > 0).length, marks: document.querySelectorAll('.au-tray [data-mark]').length, stamps: document.querySelectorAll('.au-tray [data-stamp]').length, words: !!document.querySelector('.au-tray [data-add="t"]'), w: c.width, sat }; });
  check(`aura (${tag}): one way of drawing it, the photograph whole in colour on blueprint; marks and words to add`, a.arts.length === 0 && a.marks >= 4 && a.stamps === 6 && a.words && a.w === 900 && a.sat > 40, JSON.stringify(a));
  await tap(page, '.au-tray [data-mark="star"]'); await sleep(500); await tap(page, '.au-tray [data-add="t"]'); await sleep(300);
  /* on a phone, words come through a box focused in the tap itself (so the keyboard and its microphone come up), and go on with Enter or the tick */
  const ibx = await page.evaluate(() => ({ box: !!document.querySelector('#au-inbox'), focus: (document.activeElement || {}).id || '', edit: document.querySelector('#au-inarea') ? getComputedStyle(document.querySelector('#au-inarea')).userSelect : '' }));
  if (!AD) check(`aura (${tag}): on a phone, adding words opens a box with the cursor in it, ready to type, dictate or paste`, ibx.box && ibx.focus === 'au-inarea' && ibx.edit === 'text', JSON.stringify(ibx));
  await page.keyboard.type('hello, small one'); if (ibx.box) await page.keyboard.press('Enter'); await sleep(600); await shot(page, `${P}10-added.png`);
  const ad1 = await st(); await tap(page, '.au-tray [data-mark="heart"]'); await sleep(400); const sel = (await st()).sel; await tap(page, '.au-sel .au-rm'); await sleep(400); const ad2 = await st();
  check(`aura (${tag}): marks and words go on the poster, the one chosen can be taken off`, ad1.piece.adds.length === 2 && ad1.piece.adds[1].t === 'hello, small one' && sel === 'a2' && ad2.piece.adds.length === 2 && ad2.piece.adds.every(x => x.g !== 'heart'), JSON.stringify({ adds: ad1.piece.adds.map(x => x.g || x.t), sel, after: ad2.piece.adds.map(x => x.g || x.t) }));
  const before = (await st()).piece.pos.life; const cb = await page.locator('.au-drag canvas').boundingBox(); const dim = await page.evaluate(() => { const c = document.querySelector('.au-drag canvas'); return [c.width, c.height]; });
  const lb = (await st()).boxes.life, k = cb.width / dim[0], px = cb.x + (lb[0] + 30) * k, py = cb.y + (lb[1] + 30) * k;
  await page.mouse.move(px, py); await page.mouse.down(); await page.mouse.move(px - 120 * k, py - 400 * k, { steps: 6 }); await page.mouse.up(); await sleep(500); await shot(page, `${P}11-placed.png`);
  const after = (await st()).piece.pos.life;
  check(`aura (${tag}): the caught things are scraps on the poster, placed by hand`, !before && after && after[1] < 0.8, JSON.stringify({ before, after }));
  /* the one in hand turned, sized, toned, framed or not; the words typed on the poster only */
  await page.evaluate(() => window.AURA.state()); for (const t of ['r', 's+', 'tone', 'b']) { await page.evaluate(t => document.querySelector(`.au-sel [data-t="${t}"]`).click(), t); await sleep(150); }
  const tfl = (await st()).piece.tf.life || {};
  check(`aura (${tag}): what is in hand turns, grows, changes tone and loses its frame`, tfl.r === 15 && Math.abs(tfl.s - 1.15) < 1e-6 && tfl.tone === 'turn' && tfl.b === false, JSON.stringify(tfl));
  await tap(page, '.au-tray [data-stamp="3"]'); await sleep(400); await tap(page, '.au-tray [data-stamp="0"]'); await sleep(500); await shot(page, `${P}11b-stamps.png`);
  const sp = await st(); const stamps = sp.piece.adds.filter(x => x.k === 'st').map(x => x.g);
  check(`aura (${tag}): the stamps go on the poster (stay with the trouble, novel.global), and come off`, stamps.join() === '3,0' && sp.sel === 'a' + (sp.piece.adds.length - 1), JSON.stringify({ stamps, sel: sp.sel }));
  await page.evaluate(() => document.querySelector('.au-sel [data-t="x"]').click()); await sleep(300);
  await tap(page, '.au-tray [data-add="p"]'); await sleep(600); const pixOn = await page.evaluate(() => !!document.querySelector('.au-pix canvas')); await shot(page, `${P}11c-pix.png`);
  await page.evaluate(() => document.querySelector('[data-px="cells"]').click()); await page.evaluate(() => document.querySelector('[data-px="put"]').click()); await sleep(400);
  const px2 = (await st()).piece.adds.filter(x => x.k === 'p');
  check(`aura (${tag}): the pixel irukandji moves while it is made, and one moment of it goes on the poster`, pixOn && px2.length === 1 && px2[0].cells === 32, JSON.stringify({ pixOn, px2 }));
  for (const sub of ['coral', 'trash', 'clip']) { await page.evaluate(q => document.querySelector(`[data-pxs="${q}"]`).click(), sub); await sleep(250); for (let k = 0; k < 5 && (await st()).pix.tone !== 'colour'; k++) await page.evaluate(() => document.querySelector('[data-px="tone"]').click()); await page.evaluate(() => document.querySelector('[data-px="put"]').click()); await sleep(250); }
  await shot(page, `${P}11d-found.png`); const found2 = (await st()).piece.adds.filter(x => x.k === 'p').map(x => x.sub + ':' + x.tone2);
  check(`aura (${tag}): beside it, coral, what the tide brings and paperclips, each its own and in colour if wanted`, found2.join() === 'jelly:ink,coral:colour,trash:colour,clip:colour', JSON.stringify(found2));
  await tap(page, '.au-tray [data-add="p"]'); await sleep(300);
  const nA = (await st()).piece.adds.length; await page.setInputFiles('.au-tray #au-file2', [{ name: 'a.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }, { name: 'b.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }]);
  await page.waitForFunction(n => window.AURA.state().piece.adds.filter(a => a.k === 'im').length === 2, null, { timeout: 8000 }).catch(() => {}); await sleep(600); await shot(page, `${P}11e-pictures.png`);
  const cp = await st(); const ims = cp.piece.adds.filter(a => a.k === 'im');
  await page.evaluate(() => document.querySelector('.au-sel [data-t="x"]').click()); await sleep(300); const cp2 = await st();
  /* the strip longer and shorter, what is on it staying put; pasting words; the page scrolling over the poster */
  const len0 = await page.evaluate(() => document.querySelector('.au-drag canvas').height); const ys0 = (await st()).piece.adds.map(a => a.y);
  await page.evaluate(() => document.querySelector('[data-add="len+"]').click()); await sleep(600);
  const len1 = await page.evaluate(() => document.querySelector('.au-drag canvas').height); const ys1 = (await st()).piece.adds.map(a => a.y);
  await page.evaluate(() => document.querySelector('[data-add="len-"]').click()); await sleep(600); const len2 = await page.evaluate(() => document.querySelector('.au-drag canvas').height);
  check(`aura (${tag}): the 80 mm strip is made longer and shorter, and what is on it stays where it was`, len1 === len0 + 300 && len2 === len0 && ys0.every((y, i) => Math.abs(y * len0 - ys1[i] * len1) < 1), JSON.stringify({ len0, len1, len2 }));
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); const dt = new DataTransfer(); dt.setData('text/plain', 'pasted words'); document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })); }); await sleep(500);
  const pw = (await st()).piece.adds.filter(a => a.k === 't').map(a => a.t);
  const ta2 = await page.evaluate(() => getComputedStyle(document.querySelector('.au-drag canvas')).touchAction);
  if (!AD) { await page.evaluate(() => document.querySelector('[data-add="v"]').click()); await sleep(300);
    const pb = await page.evaluate(() => { const ar = document.querySelector('#au-inarea'), on = document.activeElement === ar; const dt = new DataTransfer(); dt.setData('text/plain', 'from the box'); ar.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })); return on; }); await sleep(500);
    const pb2 = await page.evaluate(() => ({ box: !!document.querySelector('#au-inbox'), t: window.AURA.state().piece.adds.filter(a => a.k === 't').map(a => a.t) }));
    check(`aura (${tag}): on a phone, the paste key opens the box with the cursor in it; pasted there, the words go on the poster and the box closes`, pb && !pb2.box && pb2.t.includes('from the box'), JSON.stringify({ pb, pb2 })); }
  check(`aura (${tag}): words pasted go on the poster; the poster scrolls with the page unless a piece is in hand`, pw.includes('pasted words') && /pan-y/.test(ta2), JSON.stringify({ pw, ta2 }));
  check(`aura (${tag}): pictures added in art go on the poster as pieces of their own (the photograph stays), and come off again`, ims.length === 2 && cp.piece.photo && cp.piece.adds.length === nA + 2 && cp2.piece.adds.length === nA + 1, JSON.stringify({ ims: ims.length, photo: cp.piece.photo, n: [nA, cp.piece.adds.length, cp2.piece.adds.length] }));
  const txw = await page.evaluate(() => { const t = document.querySelector('#au-tx'), b = t && t.closest('.au-sel'); return t ? { col: getComputedStyle(t).color, inSel: !!b, pos: getComputedStyle(t).position } : null; });
  check(`aura (${tag}): words are typed on the poster only, nowhere beside it`, txw && txw.inSel && txw.pos === 'absolute' && /rgba\(0, 0, 0, 0\)|transparent/.test(txw.col), JSON.stringify(txw));
  await tap(page, '.au-tab[data-s=\"3\"]', { force: true }); await sleep(1500); await shot(page, `${P}12-print.png`);
  const pv = await page.evaluate(() => ({ keys: [...document.querySelectorAll('#au-panel button')].map(b => b.id), words: [...document.querySelectorAll('#au-panel .au-press button')].map(b => b.textContent.trim()).join(''), catchShown: getComputedStyle(document.querySelector('#au-catch')).display, hero: !!document.querySelector('.au-eslide.now canvas'), strip: !!document.querySelector('.au-strip'), photo: !!document.querySelector('.au-press #au-file2') }));
  const qr = await page.evaluate(() => { const c = document.querySelector('.au-eslide.now canvas'), x = c.getContext('2d'), q = 260, d = x.getImageData(c.width - 56 - q, c.height - 56 - q, q, q).data; let light = 0, dark = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 225 && d[i + 1] > 225) light++; else if (d[i] < 60 && d[i + 2] > 100) dark++; } return { light, dark }; });
  check(`aura (${tag}): every poster carries a small code back to the site, dark on light so a phone reads it`, qr.light > 3000 && qr.dark > 1500, JSON.stringify(qr));
  await tap(page, '#au-paper'); await sleep(500);
  const wp = await page.evaluate(() => { const c = document.querySelector('.au-eslide.now canvas'), d = c.getContext('2d').getImageData(20, 20, 1, 1).data; return { paper: window.AURA.state().piece.paper, px: [...d].slice(0, 3) }; }); await shot(page, `${P}12b-white.png`);
  check(`aura (${tag}): the poster prints on blue or on white, its words and marks turned to stay seen`, wp.paper === 'white' && wp.px.every(v => v > 200), JSON.stringify(wp));
  await tap(page, '#au-paper'); await sleep(400);
  check(`aura (${tag}): print is this one piece and one press, first, then where it goes (its only words), save, signal, paper and start again last: no row of others; the thing held is put down`, pv.hero && pv.keys.join() === 'au-print,au-mode,au-save,au-sigk,au-paper,au-reset' && !pv.photo && /^(80 mm|80 mm \+ mesh|wall only)$/.test(pv.words) && pv.catchShown === 'none' && !pv.strip, JSON.stringify(pv));
  await tap(page, '#au-print'); await page.waitForFunction(() => { const p = document.querySelector('#au-pips .pips'); return p && p.title !== 'sending'; }, null, { timeout: 15000 }).catch(() => {}); const pips0 = await page.evaluate(() => (document.querySelector('#au-pips .pips') || {}).title); await sleep(600); const rnd = await st(); await shot(page, `${P}12c-round.png`);
  const sheet = await page.evaluate(async () => { const u = window.AURA.sheet(); if (!u) return null; const im = new Image(); im.src = u; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let grey = 0, black = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] !== 0 && d[i] !== 255) grey++; else if (!d[i]) black++; } return { u, w: c.width, h: c.height, grey, black }; });
  if (sheet) fs.writeFileSync(`${SHOTS}/${P}12d-receipt.png`, Buffer.from(sheet.u.split(',')[1], 'base64'));
  check(`aura (${tag}): the receipt is every dot black or white (no faded greys), at the printer's full width`, sheet && sheet.grey === 0 && sheet.black > 2000 && sheet.w >= 512, JSON.stringify(sheet && { w: sheet.w, h: sheet.h, grey: sheet.grey, black: sheet.black }));
  check(`aura (${tag}): what goes to the 80 mm printer is the poster itself, all its art, at the printer's width`, rnd.print && rnd.print[0] >= 512 && rnd.print[0] <= 576 && rnd.print[1] > rnd.print[0], JSON.stringify(rnd.print));
  check(`aura (${tag}): printed, the round is over: the receipt rises up the print tentacle and the irukandji takes a bead`, rnd.round && rnd.piece.sent, JSON.stringify({ round: rnd.round, sent: rnd.piece.sent }));
  await page.waitForFunction(() => document.querySelector('#au-panel .au-wall .au-eslide.on img'), null, { timeout: 8000 }).catch(() => {}); await sleep(900); await shot(page, `${P}12e-wall.png`);
  const wl = await page.evaluate(() => ({ wall: !!document.querySelector('#au-panel .au-wall'), hero: !!document.querySelector('.au-eslide.now'), again: !!document.querySelector('#au-again'), clips: document.querySelectorAll('.au-eslide.on .au-clip').length, form: window.AURA.state().form, seed: (document.querySelector('#au-print') || { getAttribute: () => '' }).getAttribute('aria-label'), words: [...document.querySelectorAll('#au-panel .au-hint')].length }));
  const rnd2 = await page.evaluate(() => [...document.querySelectorAll('#au-wpress .au-k')].map(b => { const r = b.getBoundingClientRect(), sm = b.matches('.au-sm:not(.au-nav)'), cs = getComputedStyle(b), bf = getComputedStyle(b, '::before');
    return Math.abs(r.width - r.height) < 1 && /flex/.test(cs.display) && (!sm || (cs.borderTopStyle === 'none' && /svg/.test(bf.backgroundImage) && Math.abs(parseFloat(bf.width) - r.width) < 1)); }));
  check(`aura (${tag}): the press's keys are round, never squeezed: fixed squares, the small ones ringed by a drawn circle of round dots (not a dotted border, which Safari draws uneven)`, rnd2.length >= 3 && rnd2.every(Boolean), JSON.stringify(rnd2));
  check(`aura (${tag}): printed, it goes up on the wall: hung by two clips on the line the print tentacle has become, a seed to begin again, a press to print it again, no words`, wl.wall && !wl.hero && wl.again && wl.clips === 2 && wl.form === 'line' && wl.seed === 'Begin a new piece' && wl.words === 0, JSON.stringify(wl));
  await tap(page, '.au-eslide.on'); await page.waitForFunction(() => window.AURA.state().showing && document.querySelector('.pswp .au-x') && [...document.querySelectorAll('.pswp img.pswp__img:not(.pswp__img--placeholder)')].some(i => i.complete && i.naturalWidth), null, { timeout: 8000 }).catch(() => {}); await sleep(900);
  const pr = await page.evaluate(() => ({ pips: null, show: window.AURA.state().showing, folio: window.AURA.state().folio, img: (() => { const i = [...document.querySelectorAll('.pswp img.pswp__img:not(.pswp__img--placeholder)')].find(q => { const r = q.getBoundingClientRect(); return r.width && r.left >= -1 && r.right <= innerWidth + 1; }); if (!i) return {}; const r = i.getBoundingClientRect(); return { nw: i.naturalWidth, nh: i.naturalHeight, rw: r.width, rh: r.height, top: r.top, bottom: r.bottom, right: r.right, vh: innerHeight }; })(),
    x: (() => { const e = document.querySelector('.pswp .au-x'); if (!e) return {}; const r = e.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width }; })() }));
  await shot(page, `${P}13-folio.png`);
  const near = Math.hypot(pr.x.cx - pr.img.right, pr.x.cy - pr.img.top);
  check(`aura (${tag}): print sends the poster to novel.global, keeps it in colour on the wall, and opens it whole and full screen (PhotoSwipe)`, /waiting|shown|queued|printing|printed|held/.test(pips0) && pr.show && pr.folio === 1 && pr.img.nw === 900 && Math.abs(pr.img.rw / pr.img.rh - pr.img.nw / pr.img.nh) < 0.02 && pr.img.top >= 0 && pr.img.bottom <= pr.img.vh, JSON.stringify(pr));
  check(`aura (${tag}): the close sits on the poster's own corner, small and still easy to touch`, near < 40 && pr.x.w >= 30 && pr.x.w <= 36, JSON.stringify({ near, x: pr.x }));
  const zb = (await st()).zoom;
  await page.mouse.click(pr.img.right - pr.img.rw / 2, pr.img.top + pr.img.rh / 2); await page.waitForFunction(() => window.AURA.state().zoom > 1.5, null, { timeout: 3000 }).catch(() => {}); await sleep(400); const za = (await st()).zoom; await shot(page, `${P}14-zoom.png`);
  check(`aura (${tag}): the portfolio zooms in place, no new window`, Math.abs(zb - 1) < 0.01 && za > 1.5 && page.url() === 'https://oan.test/', zb + ' → ' + za);
  await page.keyboard.press('Escape'); await page.waitForFunction(() => !window.AURA.state().showing, null, { timeout: 4000 }).catch(() => {}); await sleep(300);
  const rec = (((await admin('stories?status=waiting')).stories) || []).filter(x => x.kind === 'record').map(x => JSON.parse(x.body)).find(b => b.text === 'rainbow lorikeet fledgling on the path');
  check(`aura (${tag}): the record carries one's own lines and only what was caught`, rec && JSON.stringify(rec.wish) === JSON.stringify(L4) && rec.tx && /Lorikeet/.test(rec.tx.cn), JSON.stringify(rec || {}).slice(0, 300));
  const sent = await page.evaluate(() => document.querySelector('#au-print').getAttribute('aria-label'));
  /* a printed piece does not come back as the next visit's start: notice is clear */
  await page.reload(); await page.waitForSelector('#aura'); await sleep(800); await toIruk(0); await sleep(500);
  const stale = await page.evaluate(() => ({ piece: window.AURA.state().piece, ph: !!document.querySelector('#au-panel .au-ph'), say: document.querySelector('#au-say').value }));
  check(`aura (${tag}): coming back after a print, notice is clear (the printed piece is on the wall, not left on the page)`, stale.piece === null && !stale.ph && stale.say === '', JSON.stringify(stale));
  /* printed, the round is over: going on begins the next piece, clear, and what is written there is what goes to print */
  await tap(page, '.au-tab[data-s=\"1\"]', { force: true }); await sleep(600);
  const nx1 = await page.evaluate(() => ({ piece: window.AURA.state().piece, v: [...document.querySelectorAll('.au-wish textarea')].map(t => t.value) }));
  await page.fill('.au-wish textarea[data-i="3"]', 'Until it flies, and after'); await tap(page, '.au-tab[data-s=\"3\"]', { force: true }); await sleep(1200);
  const both = await page.evaluate(() => ({ n: document.querySelectorAll('.au-eslide').length, now: document.querySelector('.au-eslide').classList.contains('now') && document.querySelector('.au-eslide').classList.contains('on') }));
  check(`aura (${tag}): print is the showcase: the piece being made in front, everything printed on the same line`, both.n === 2 && both.now, JSON.stringify(both));
  const nx2 = await page.evaluate(() => ({ lines: window.AURA.state().piece.lines, sent: window.AURA.state().piece.sent, hero: !!document.querySelector('.au-eslide.now canvas'), label: (document.querySelector('#au-print') || {}).getAttribute && document.querySelector('#au-print').getAttribute('aria-label') }));
  check(`aura (${tag}): printed, the round is over: the next W.I.S.H. begins clear, and goes to print as itself`, sent === 'Begin a new piece' && nx1.piece === null && nx1.v.every(v => v === '') && nx2.lines[3] === 'Until it flies, and after' && !nx2.lines[0] && !nx2.sent && nx2.hero && nx2.label === 'Print', JSON.stringify({ sent, nx1, nx2 }));
  /* the piece comes back with one, kept as it was typed even straight after a step */
  await tap(page, '.au-tab[data-s=\"1\"]', { force: true }); await sleep(400); await page.fill('.au-wish textarea[data-i="1"]', 'kept on the way'); await tap(page, '.au-tab[data-s=\"0\"]', { force: true }); await sleep(450);
  await page.reload(); await page.waitForSelector('#aura'); await sleep(800); await toIruk(1); await sleep(500);
  const back = await st();
  check(`aura (${tag}): the piece one was making is kept, every word, even typed just before changing step`, back.piece && back.piece.lines[3] === 'Until it flies, and after' && back.piece.lines[1] === 'kept on the way', JSON.stringify(back.piece && back.piece.lines));
  /* let go with its check: notice is clear */
  await tap(page, '.au-tab[data-s=\"3\"]', { force: true }); await sleep(800); await tap(page, '#au-reset'); await sleep(200); await tap(page, '#au-reset'); await sleep(600);
  const fresh = await page.evaluate(() => ({ piece: window.AURA.state().piece, stage: window.AURA.state().stage, ph: !!document.querySelector('#au-panel .au-ph'), say: (document.querySelector('#au-say') || {}).value }));
  check(`aura (${tag}): start again lets the piece go (with a check), and notice is clear`, fresh.piece === null && fresh.stage === 0 && !fresh.ph && fresh.say === '', JSON.stringify(fresh));
  await tap(page, '.au-tab[data-s=\"3\"]', { force: true }); await sleep(900); await sleep(600); const wall = await page.evaluate(() => ({ img: !!document.querySelector('.au-wall .au-eslide.on img'), emb: !!window.EmblaCarousel, n: document.querySelectorAll('.au-eslide').length, bring: !!document.querySelector('#au-bring'), drop: !!document.querySelector('#au-drop') })); await shot(page, `${P}15-wall.png`);
  check(`aura (${tag}): print with nothing being made is the wall, a light carousel (Embla) of what was printed`, wall.img && wall.emb && wall.n >= 1 && wall.bring && wall.drop, JSON.stringify(wall));
  await tap(page, '.au-eslide.on'); await page.waitForFunction(() => window.AURA.state().showing, null, { timeout: 6000 }).catch(() => {}); const wsh = (await st()).showing; await sleep(500); await page.keyboard.press('Escape'); await page.waitForFunction(() => !window.AURA.state().showing && !document.querySelector('.pswp'), null, { timeout: 5000 }).catch(() => {}); await sleep(300);
  check(`aura (${tag}): a touch on the one in front opens it full screen`, wsh, String(wsh));
  await tap(page, '#au-bring'); await sleep(1200); const br = await st();
  check(`aura (${tag}): a finished piece is brought back to be worked on, everything as it was`, br.stage === 2 && br.piece && br.piece.lines[0] === L4[0] && br.piece.caught.length === 4 && br.piece.folioId && !br.piece.sent, JSON.stringify({ stage: br.stage, lines: br.piece && br.piece.lines }));
  await tap(page, '.au-tab[data-s=\"3\"]', { force: true }); await sleep(800); await tap(page, '#au-reset'); await sleep(200); await tap(page, '#au-reset'); await sleep(600);
  await tap(page, '.au-tab[data-s=\"3\"]', { force: true }); await sleep(800);
  /* the signal: a printed piece folded into one short line, and that line grown back into a whole piece */
  await tap(page, '#au-sigk'); await sleep(600); await shot(page, `${P}15b-signal.png`);
  const code = await page.evaluate(() => (document.querySelector('#au-sigt') || {}).textContent || '');
  const bytes = Buffer.byteLength(code);
  await page.fill('#au-sigi', code); await sleep(1500);
  const grown = await st();
  check(`aura (${tag}): a piece folds into one line short enough for a LoRa radio, and that line grows back into the whole piece`, /^ng:/.test(code) && bytes <= 200 && grown.stage === 3 && grown.piece && grown.piece.say === 'rainbow lorikeet fledgling on the path' && grown.piece.lines.filter(Boolean).length === 4 && grown.piece.caught.includes('life') && grown.piece.caught.includes('map'), JSON.stringify({ code, bytes, stage: grown.stage, piece: grown.piece && { say: grown.piece.say, lines: grown.piece.lines, caught: grown.piece.caught } }));
  await tap(page, '#au-reset'); await sleep(200); await tap(page, '#au-reset'); await sleep(600); await tap(page, '.au-tab[data-s=\"3\"]', { force: true }); await sleep(800);
  await tap(page, '#au-drop'); await sleep(200); await tap(page, '#au-drop'); await sleep(800); const dropped = await st();
  check(`aura (${tag}): a finished piece is taken down from the wall (with a check)`, dropped.folio === 0, String(dropped.folio));
  /* the deep engine as devices: one earned with a poster rides the ring under the eye; opened, the studio in a window over the aura, its own first visit skipped, the eye on its bar back */
  const dv = await page.evaluate(async () => { document.querySelector('.au-tab[data-s="0"]').click(); await new Promise(r => setTimeout(r, 400)); const ring = [...document.querySelectorAll('.au-dev:not([hidden])')].map(b => b.dataset.dev).join(); window.AURA.dev(0); await new Promise(r => setTimeout(r, 400)); const w = document.querySelector('.au-win'), f = w && w.querySelector('iframe');
    const open = !!w && !w.hidden, src = f ? f.getAttribute('src') : ''; w.querySelector('.au-wx').click(); await new Promise(r => setTimeout(r, 200)); const shut = w.classList.contains('away') && f.getAttribute('src') !== 'about:blank'; window.AURA.dev(2); await new Promise(r => setTimeout(r, 2500)); let view = ''; try { view = f.contentDocument.body.dataset.view; } catch (e) { /* none */ } w.querySelector('.au-wx').click(); return { ring, open, src, shut, view }; });
  check(`aura (${tag}): a poster printed earns a device, and the irukandji holds out the one its step calls for (the radio while noticing); opened, the studio in a window over the aura, and the eye on its bar brings one back`, dv.ring === '0' && dv.open && /^\/studio\?from=aura&night=[01]#radio$/.test(dv.src) && dv.shut && dv.view === 'signs', JSON.stringify(dv));
  /* the sound desk: behind the sound key, a song made from the poster's lines, kept, and rendered as a loop of 45 seconds */
  await tap(page, '#au-snd'); await sleep(500); await shot(page, `${P}15c-sound.png`);
  const sd = await page.evaluate(async () => { const d = document.querySelector('.au-desk'); document.querySelector('#sd-keep').click(); const s = window.AURA.desk(); const l = await window.AURA.songLoop(); window.AURA.desk(false); return { open: !!d, code: s && s.code, kept: window.AURA.desk(false) && s.kept, loop: l }; });
  check(`aura (${tag}): the sound key opens the sound desk: a song made of the poster's own words, kept, and saved as a loop of 45 seconds`, sd.open && /^v1\d\d[.0-9]{32}(-[.0-9]{32}){3}$/.test(sd.code || '') && (sd.code.replace(/[^0-9]/g, '').length > 12) && sd.kept >= 1 && sd.loop && sd.loop.seconds === 45 && sd.loop.bytes > 1e6, JSON.stringify({ open: sd.open, code: sd.code, kept: sd.kept, loop: sd.loop }));
  await tap(page, '#au-up'); await page.waitForFunction(() => window.AURA.state().mode === 'globe', null, { timeout: 5000 }).catch(() => {}); const s4 = await st(); await shot(page, `${P}16-back.png`);
  check(`aura (${tag}): the line rising at the top takes it back up to the globe`, s4.mode === 'globe', s4.mode);
  await page.goto('https://oan.test/#radio'); await sleep(1200); const bs = await page.evaluate(() => ({ aura: document.querySelector('#aura').hidden, sheet: !document.querySelector('#sheet').hidden }));
  check(`aura (${tag}): the base's pages still open by link, the aura asleep under them`, bs.aura && bs.sheet, JSON.stringify(bs));
  await ctx.close();
} catch (e) { results.push(`FAIL  section aura: ${e.message.split('\n')[0]}`); }

// ───────── walk: every way through the base, on a phone, as a first visitor (ONLY=walk, screenshots for review) ─────────
if (ONLY.includes('walk')) try {
  const D = !!process.env.DESK;
  const ctx = await newCtx(D ? { viewport: { width: 1440, height: 900 } } : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await wire(ctx, { first: true, journey: true, plain: true }); const page = await ctx.newPage(); watch(page, 'walk');
  const W = async (n) => { await sleep(700); await shot(page, `w${D ? 'd' : ''}${n}.png`); };
  const step = async (n, f) => { try { await f(); } catch (e) { const at = await page.evaluate(() => { const s = document.querySelector('#sheet'); return (s.hidden ? 'hidden ' : '') + s.className + ' | ' + s.textContent.slice(0, 160) + ' | ' + [...s.querySelectorAll('[id]')].map(e => e.id).join(','); }).catch(() => ''); results.push(`FAIL  walk ${n}: ${e.message.split('\n')[0]} — ${at}`); } };
  await page.goto('https://oan.test/?base'); await sleep(2500); await W('01-open');
  await sleep(3000); await W('01b-turned');
  await step('photo', async () => { await page.evaluate(() => document.querySelector('#o-print').click()); await page.waitForSelector('#sheet .shot', { state: 'attached' }); await sleep(600); await W('02-print'); await page.setInputFiles('#sheet .shot', { name: 'lori.jpg', mimeType: 'image/jpeg', buffer: await exifJPEG() }); await page.waitForSelector('#n-say', { timeout: 10000 }); await W('03-photo'); });
  await step('line', async () => { await page.fill('#n-say', 'lorikeet fledgling on the path'); await sleep(1200); await W('04-line'); });
  await step('placed', async () => { await tap(page, '#n-next'); await page.waitForSelector('#n-seen, #p-slip', { state: 'attached' }); await sleep(2200); await W('06-placed'); });
  await step('design', async () => { await tap(page, '#n-print').catch(() => {}); await page.waitForSelector('#p-slip canvas'); await W('07-design');
    await tap(page, '#p-dots [data-a="sign"]'); await sleep(900); await W('07b-sign'); await tap(page, '#p-dots [data-a="photo"]'); await tap(page, '#p-wish'); await sleep(900); await W('08-wish'); });
  await step('send', async () => { await tap(page, '#p-send'); await sleep(1500); await W('09-sent'); await tap(page, '#p-send'); await page.waitForSelector('.wish-grid'); await sleep(800); await W('10-thread'); });
  await step('reply', async () => { await page.selectOption('#w-new select[data-o="1"]', { index: 2 }); await sleep(200); await tap(page, '#w-post'); await sleep(1200); await W('10b-replied'); });
  await step('radio', async () => { await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#radio'); await page.waitForFunction(() => document.querySelectorAll('.tiles button').length > 3, null, { timeout: 15000 }); await sleep(1500); await W('12-radio');
    await tap(page, '#d-rec'); await sleep(400); for (let k = 0; k < 4; k++) { await page.click(`.tiles button:nth-child(${k + 2})`); await sleep(260); } await W('12a-recorded');
    await page.click('#deck .ins[data-t="1"]'); await page.click('#deck .ins[data-t="1"]'); await sleep(300); await W('12b-settings');
    await tap(page, '#d-rec'); await tap(page, '#d-radar'); await sleep(2500); await W('12c-radar'); await tap(page, '#d-radar'); await tap(page, '#d-play');
    await page.click('.tiles button:nth-child(3)'); await sleep(800); await W('12d-peek'); });
  await step('sets', async () => { for (const k of [4, 5, 6, 7]) { await tap(page, '#pk-x').catch(() => {}); await page.click(`.tiles button:nth-child(${k})`); await sleep(500); } await tap(page, '#pk-x').catch(() => {});
    await tap(page, '#r-min'); await sleep(900); await W('12g-folded'); await tap(page, '#r-min'); await sleep(300);
    await tap(page, '#r-way [data-w="sets"]'); await sleep(600); await page.click('#r-body [data-c="0"]'); await sleep(500); await page.click('#r-body [data-c="1"]'); await sleep(1800); await W('12e-sets'); await tap(page, '#r-way [data-w="help"]'); await sleep(600); await W('12f-help'); });
  await step('wish', async () => { await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#wish'); await page.waitForSelector('.wish-grid'); await sleep(1200); await W('13-wish'); });
  await step('shop', async () => { await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#shop'); await sleep(1500); await W('14-shop'); });
  await step('map', async () => { await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#radio'); await sleep(600); await tap(page, '#b-map'); await sleep(3000); await W('15-map');
    const k = await page.evaluate(() => { const h = window.__base.hits().knots; const n = h.find(x => x.x > 40 && x.y > 120 && x.x < innerWidth - 40 && x.y < innerHeight - 120); return n ? [n.x, n.y] : null; });
    if (k) { await page.mouse.move(k[0], k[1]); await sleep(400); await W('15b-hover'); await page.mouse.click(k[0], k[1]); await sleep(800); await W('15c-peek'); } });
  await step('guide', async () => { await page.goto('https://oan.test/?base'); await page.goto('https://oan.test/?base#guide'); await sleep(1200); await page.click('.idx details.sec:nth-child(5) > summary').catch(() => {}); await sleep(400); await W('16-guide'); });
  await page.goto('https://oan.test/?base'); await sleep(800); await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await sleep(400); await W('17-light');
  await ctx.close();
} catch (e) { results.push(`FAIL  section walk: ${e.message.split('\n')[0]}`); }

// ───────── studio: what the base's keys open, the first visit already walked (ONLY=studiolook) ─────────
if (ONLY.includes('studiolook')) try {
  for (const [tag, vp] of [['p', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['d', { width: 1440, height: 900 }]]) {
    const ctx = await newCtx({ viewport: { width: vp.width, height: vp.height }, ...vp }); await wire(ctx, { front: true }); const page = await ctx.newPage(); watch(page, 'studiolook');
    for (const h of ['radio', 'wish', 'print', 'portfolio']) { await page.goto('https://oan.test/studio#' + h); await sleep(9000); await shot(page, `s-${tag}-${h}.png`); }
    await ctx.close();
  }
} catch (e) { results.push(`FAIL  section studiolook: ${e.message.split('\n')[0]}`); }

if (ONLY.includes('pt')) try {
  const ctx = await newCtx({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await wire(ctx, { first: true, journey: true }); const page = await ctx.newPage();
  for (const h of ['wish', 'print', 'radio']) { await page.goto('https://oan.test/studio?from=base#' + h); await sleep(8000);
    console.log(h, await page.evaluate(() => [[347, 758], [347, 760], [30, 20], [100, 20], [195, 25], [200, 700]].map(([x, y]) => { const e = document.elementFromPoint(x, y); const chain = []; let n = e; for (let i = 0; i < 4 && n; i++, n = n.parentElement) chain.push(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).join('.') : '')); return x + ',' + y + ' ' + chain.join(' < '); }).join('\n'))); }
  await ctx.close();
} catch (e) { results.push(`FAIL  section pt: ${e.message.split('\n')[0]}`); }
// ───────── look: screenshots for review only (ONLY=look) ─────────
if (ONLY.includes('look')) try {
  const W = +(process.env.W || 1440), Hh = +(process.env.H || 900); const phone = !!process.env.PHONE;
  const ctx = await newCtx({ viewport: { width: W, height: Hh }, ...(phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) }); await wire(ctx); const page = await ctx.newPage(); watch(page, 'look');
  await page.goto('https://oan.test/studio'); await ready(page); await settle(page); await sleep(2500);
  const P = phone ? 'p-' : '';
  await shot(page, `${P}l01-radar.png`);
  await page.evaluate(() => { window.__da.life.reveal(); window.__da.setView(0); }); await sleep(1500); await shot(page, `${P}l02-now.png`);
  await page.evaluate(() => window.__da.setView(3)); await sleep(1500); await shot(page, `${P}l03-stories.png`);
  await page.evaluate(() => { const s = window.__da.S.signals.find(x => x.code === 'DA-0RNG'); window.__da.openSignal(s.key); }); await sleep(2500); await shot(page, `${P}l04-example.png`);
  await page.evaluate(() => window.__da.closeRecord()); await sleep(300);
  await page.evaluate(() => window.__da.selectTribe('tribe:T03')); await sleep(2200); await shot(page, `${P}l05-group.png`);
  await page.evaluate(() => window.__da.select(window.__da.S.heroes[0].id)); await sleep(2500); await shot(page, `${P}l06-hero.png`);
  await page.evaluate(() => { document.querySelector('#r-scroll').scrollTop = 600; }); await sleep(500); await shot(page, `${P}l07-hero-lower.png`);
  await page.evaluate(() => window.__da.closeRecord()); await sleep(300);
  await page.evaluate(() => window.__da.startPlace({ lat: -37.7712, lng: 144.9611 })); await sleep(1500); await shot(page, `${P}l08-place.png`);
  await page.evaluate(() => { const t = document.querySelector('#pl-text'); t.value = 'a ringtail possum on the ground, hurt'; t.dispatchEvent(new Event('input')); }); await sleep(900); await shot(page, `${P}l09-place-hurt.png`);
  await page.evaluate(() => window.__da.closeRecord()); await sleep(300);
  await page.evaluate(() => { const da = window.__da; da.life.reveal(); const it = da.life.items.find(i => i.inS && typeof i.o.id === 'number' && !i.o.hum && i.b.tone !== 'flora'); da.select(it.o.id); }); await sleep(2500); await shot(page, `${P}l10-card.png`);
  await page.evaluate(() => { const da = window.__da; const ns = [...da.strings.nodes.values()].filter(n => n.t !== 'pin').slice(0, 4); ns.forEach(n => { da.strings.tap(n.key); da.strings.tap(n.key); }); da.strings.tap(ns[0].key); }); await sleep(600); await shot(page, `${P}l11-strings.png`);
  await page.evaluate(() => { document.querySelector('#r-scroll').scrollTop = 900; document.querySelector('#r-strings details') && (document.querySelector('#r-strings details').open = true); }); await sleep(500); await shot(page, `${P}l12-card-lower.png`);
  await ctx.close();
} catch (e) { results.push(`FAIL  section look: ${e.message.split('\n')[0]}`); }

await browser.close(); await apiServer.close();
const fails = results.filter(r => r.startsWith('FAIL'));
console.log(results.join('\n'));
if (errors.length) console.log('\nERRORS\n' + [...new Set(errors)].slice(0, 30).join('\n'));
if (unexpected.size) console.log('\nUNEXPECTED HOSTS\n' + [...unexpected].join('\n'));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
