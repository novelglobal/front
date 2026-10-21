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
const OBS = observations(230); const BIZ = businesses(); const HIST = [historic(1), historic(2)];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.md': 'text/markdown' };
const cache = new Map(); const unexpected = new Set();
const BASE_CONFIG = fs.readFileSync(path.join(DIST, 'config.js'), 'utf8');
/* the app's own server: the real Worker with a fresh local database, behind https://oan.test/api/ */
const ADMIN_KEY = 'test-admin-key-not-a-real-one';
const apiServer = createTestHarness({ root: ROOT, workers: [{ configPath: './wrangler.jsonc', secrets: { ADMIN_KEY } }] });
const API_O = (await apiServer.listen()).url.origin;
const admin = async (p, body) => { const r = await apiServer.fetch(new URL('/api/admin/' + p, API_O), { method: body ? 'POST' : 'GET', headers: { authorization: `Bearer ${ADMIN_KEY}`, 'content-type': 'application/json', origin: API_O }, body: body ? JSON.stringify(body) : undefined }); return r.json(); };

async function wire(ctx, { inat = true, config = BASE_CONFIG, tmax = 33, night = 0, worst = 30, ens = true, comOK = true, overpass = true, net = { down: false }, first = false, dark = false, front = false, journey = false } = {}) {
  /* the studio, the back of every page, unless a check is about the fronts */
  /* the radar stays where it is pinned, unless a check is about a first visit */
  /* and by day (night is the default), unless a check is about the night */
  /* and the first visit's simple way through already walked, unless a check is about the journey itself */
  if (!first) await ctx.addInitScript(p => { try { if (!localStorage.getItem('da.prefs')) localStorage.setItem('da.prefs', p); } catch (e) { /* no storage */ } }, (dark ? '{"found":true,"start2":true,"night":true,"time":false,"placed":true,"journey":4' : '{"found":true,"start2":true,"night":false,"time":false,"placed":true,"journey":4') + (front ? '}' : ',"face":{"0":"back","1":"back","2":"back"}}'));
  else if (!journey) await ctx.addInitScript(() => { try { if (!localStorage.getItem('da.prefs')) localStorage.setItem('da.prefs', '{"journey":4}'); } catch (e) { /* no storage */ } });
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
        let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
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
        const list = above ? OBS.filter(o => o.id > above).sort((a, b) => a.id - b.id) : OBS;
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
      if (u.host.includes('overpass')) { if (!overpass) return route.abort(); return json(BIZ); }
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
  await page.goto('https://oan.test/index.html' + (process.env.HASH || ''));
  await ready(page); await sleep(+(process.env.WAIT || 1500));
  const out = process.env.DBG ? await page.evaluate(new Function(`return (async () => { ${fs.readFileSync(process.env.DBG, 'utf8')} })()`)) : null;
  console.log(JSON.stringify(out, null, 1));
  if (process.env.SHOT) await shot(page, process.env.SHOT);
  await ctx.close();
} catch (e) { results.push(`FAIL  section dbg: ${e.message.split('\n')[0]}`); }

// ───────── smoke: the bare radar, then the four destinations ─────────
if (run('smoke')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'smoke');
  await page.goto('https://oan.test/index.html#stories'); await ready(page, '', true); await settle(page);
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
  await page.evaluate(() => { window.__da.setOpen(true); window.__da.setView(0); }); await sleep(500); await page.click('#sec-heat [data-radio]'); await sleep(8600);
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
  const now = await page.evaluate(() => { const band = document.querySelector('#sec-heat'); const order = [...band.children].filter(e => !/^(mod-|flip-b)/.test(e.className)).map(e => e.className.split(' ')[0]); return { open: !document.body.classList.contains('shut'), five: document.querySelectorAll('#sec-five .hero-row').length, months: document.querySelectorAll('#sec-heat .mo').length, order, steps: [...band.querySelectorAll('.st, .sn')].filter(e => !e.closest('.steps')).length, heads: band.querySelectorAll('h3, .lab').length, counts: band.querySelectorAll('.lyr .n').length, tags: document.querySelectorAll('#view .lab, #view .chips, #view .dg, #view .pill, #view .gigs').length }; });
  check('RADIO, top to bottom: the printers’ pager, El Niño’s countdown (the steps on its screen), the equaliser on its own, play between loop and link, the layers; no headline, numbers, headings or tags', now.open && now.five === 0 && now.months === 12 && now.order.join() === 'pager,b-emerg,mstrip,hp-row,lyrs' && now.steps === 0 && now.heads === 0 && now.counts === 0 && now.tags === 0, JSON.stringify(now));
  const nw = await page.evaluate(() => { const band = document.querySelector('#sec-heat'); const five = document.querySelector('#sec-five'); const rows = five ? [...five.querySelectorAll('.hero-row')] : [];
    return { five: rows.length, why: five ? five.dataset.tip : '', names: rows.map(r => (r.querySelector('.nm b') || {}).textContent), chips: rows.some(r => r.querySelector('.chips')), pics: rows.filter(r => r.querySelector('.h-pic img, .h-pic canvas')).length, words: band.innerText }; });
  const eq = await page.evaluate(async () => { const cols = [...document.querySelectorAll('#sec-heat .mo')]; const lit = cols.map(c => c.querySelectorAll('.eq-c i.l:not(.up)').length); const none = !document.querySelector('.eq-read');
    cols[3].click(); await new Promise(r => setTimeout(r, 400)); const rd = document.querySelector('.eq-read');
    const out = { cols: cols.length, segs: cols[0].querySelectorAll('.eq-c i:not(.up)').length, lit, none, read: rd ? rd.innerText : '', hud: !!rd && rd.classList.contains('eq-hud'), rows: rd ? rd.querySelectorAll('.hud-d dt').length : 0, life: rd ? rd.querySelectorAll('.hud-life svg').length : 0, jelly: !!(rd && rd.querySelector('.hud-spec svg')) };
    const mo = i => document.querySelectorAll('#sec-heat .mo')[i]; mo(4).click(); await new Promise(r => setTimeout(r, 400)); out.next = (document.querySelector('.eq-read') || {}).innerText || ''; mo(4).click(); await new Promise(r => setTimeout(r, 300)); mo(3).click(); await new Promise(r => setTimeout(r, 300));
    document.querySelectorAll('#sec-heat .mo')[3].click(); await new Promise(r => setTimeout(r, 300)); out.closed = !document.querySelector('.eq-read'); return out; });
  check('the outlook is an equaliser; pressed, a month reads as a data screen: its level, the source, Niño 3.4, the odds of heat and rain, the window and the lives in it, the jellyfish behind; no sentences; the next month the same', eq.cols === 12 && eq.segs === 10 && Math.max(...eq.lit) === 10 && Math.min(...eq.lit) >= 1 && eq.none && eq.hud && /JAN 2027/.test(eq.read) && /EXTREME/.test(eq.read) && /NIÑO3\.4/.test(eq.read) && eq.rows === 9 && eq.life >= 3 && eq.jelly && !/[a-z]{3,} [a-z]{3,} [a-z]{3,}/.test(eq.read) && /FEB 2027/.test(eq.next) && eq.closed, JSON.stringify(eq));
  const fv = await page.evaluate(() => { const da = window.__da; return da.life.items.filter(it => it.hero && da.life.shown(it)).length; });
  check('the five in greatest need stand on the map, not in a list', nw.five === 0 && fv === 5, JSON.stringify({ five: nw.five, fv }));
  check('no watch chip, no stage names in the outlook', !/WATCH|EARLY HEAT|DRY FLOWERING|HOT NIGHTS|DROUGHT/.test(nw.words), nw.words.replace(/\s+/g, ' '));
  const hd = await page.evaluate(async () => { const ids = [...document.querySelectorAll('#view > section')].map(x => x.id).filter(Boolean); const d4 = [...document.querySelectorAll('#sec-heat .mo.d4 .eq-c i.l')]; const band = document.querySelector('#sec-heat'); const quiet = [...band.querySelectorAll('.cd, .hp-k small')].map(e => [e, e.textContent]); quiet.forEach(([e]) => { e.textContent = ''; }); const bare = band.innerText; quiet.forEach(([e, t]) => { e.textContent = t; }); const clues = ''; const cd = document.querySelector('#sec-heat .b-emerg .cd');
    const cdx = () => (document.querySelector('#sec-heat .b-emerg .cd') || {}).textContent || ''; for (let i = 0; i < 12 && !/D \d/.test(cdx()); i++) await new Promise(r => setTimeout(r, 500)); const c0 = cdx(); let c1 = c0; for (let i = 0; i < 20 && c1 === c0; i++) { await new Promise(r => setTimeout(r, 250)); c1 = cdx(); }
    return { words: bare.replace((document.querySelector('#sec-heat .pager') || {}).innerText || '\u0000', '').replace(/[\d:]+D?|NOW/g, '').replace(/\b[JFMASOND]\b/g, '').trim(), sun: !!document.querySelector('#sec-heat .b-emerg .sun use[href="#g-heat"]'), orange: getComputedStyle(document.querySelector('#sec-heat .b-emerg .cd')).color, c0, c1, tip: (document.querySelector('#sec-heat .b-emerg') || {}).dataset ? document.querySelector('#sec-heat .b-emerg').dataset.tip : '',
      ids, d4: d4.length, d4bg: [...new Set(d4.map(i => getComputedStyle(i).backgroundColor))], up: document.querySelectorAll('#sec-heat .mo.d4 .eq-c i.up').length, tel: document.querySelectorAll('#view a[href^="tel:"]').length, stations: !!document.querySelector('#sec-tracks, .tk-lvl') }; });
  check('no words on the radio but the steps and the names under loop and link: the countdown and the months are marks and numbers', hd.words === '', JSON.stringify({ words: hd.words }));
  check('El Niño’s emergency counting down in orange, alone, without a sun, ticking, the step waiting between; its name on a long hover', !hd.sun && hd.orange !== 'rgb(237, 237, 237)' && /^\d+D \d\d:\d\d:\d\d$/.test(hd.c0) && hd.c0 !== hd.c1 && hd.tip === 'El Niño emergency in', JSON.stringify({ c0: hd.c0, c1: hd.c1, tip: hd.tip }));
  check('extreme months reach black, and stand taller than the rest, blocks of their own above the column', hd.d4 >= 1 && hd.d4bg.includes('rgb(20, 20, 18)') && hd.up >= 3, JSON.stringify({ d4bg: hd.d4bg, up: hd.up }));
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
  const pl = await page.evaluate(() => { const da = window.__da; const m = da.map.getContainer().getBoundingClientRect(); let n = 0; for (let x = 0; x < m.width; x += 6) for (let y = 0; y < m.height; y += 6) { const h = da.life.hit(x, y, true); if (h && h.kind === 'place') { n++; if (n > 3) break; } } return { n, kept: JSON.parse(localStorage.getItem('da.prefs')).t4 }; });
  check('COMMUNITY by its key and POLLUTION by 4 on a keyboard bring the places onto the map, kept', pl.n > 3 && pl.kept.community === true && pl.kept.pollution === true, JSON.stringify(pl));
  const split = await page.evaluate(() => { const da = window.__da; da.setTrack4('pollution', false); return { t4: { ...da.T4 } }; });
  await page.evaluate(() => { window.__da.setOpen(true); window.__da.setView(0); }); await sleep(600);
  const cm0 = await page.evaluate(() => (document.querySelector('#sec-heat [data-lmood="community"]').getAttribute('aria-label').split(': ')[1] || '').toLowerCase());
  await page.click('#sec-heat [data-lmood="community"]'); await sleep(200);
  await page.evaluate(() => { window.__knots = []; }); await sleep(5000);
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
  check('WISH MAKER board: keys as marks, their names on a long hover, UNDO, ZOOM and LOCK among them; a note joined to a signal, and let go', bd0.tools === 'ADD,NOTE,SECT,LINK,PENCIL,IMG,UNDO,DEL,ZOOM,LOCK,OUT,SAVE' && bd0.joined === 1 && bd0.let === 0 && /MODEL DA-03/.test(bd0.label), JSON.stringify(bd0));
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
  check('the quick print heads the portfolio, then the W.I.S.H.es finished here, then the stories; the settings and sources at its foot; the posters on the wall beside it', order[0] === 'sec-quick' && order[1] === 'sec-wishes' && order.includes('sec-board') && order.indexOf('sec-board') < order.indexOf('sec-set') && order.includes('sec-set') && order.indexOf('sec-set') > order.indexOf('sec-tools'), order.join(' '));
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
  check('the PRINT SHOP: no readings row, the receipt larger than it prints, words again for another face, tape again for bandana, a bandana, nine packs', ng.styles === 0 && ng.z > 1 && ng.faces[0] !== ng.faces[1] && ng.texts === 1 && ng.tape === 'image' && ng.rag && ng.packs === 9 && ng.goth > 10, JSON.stringify(ng));
  check('a poster on the map is a card that turns over; the board leaves as a PDF', ng.hit === 'poster' && ng.card && ng.pdf === '%PDF-', JSON.stringify(ng));
  /* the board's OUT key on the studio side: its menu is its own, so PNG takes the board away and SELECT stays shut */
  await page.evaluate(() => { window.__da.setOpen(true); window.__da.setView(1); }); await sleep(800);
  const [outPNG] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }).then(d => d.suggestedFilename(), () => ''), tap(page, '#board [data-bt="out"]').then(() => tap(page, '.pick [data-menu="0"]'))]); await sleep(400);
  const outSel = await page.evaluate(() => !!document.querySelector('#pick:not([hidden])'));
  check('the board’s OUT key: PNG downloads the board, and SELECT stays shut', /\.png$/.test(outPNG) && !outSel, JSON.stringify({ outPNG, outSel }));
  const ng2 = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    da.setOpen(true); da.setView(0); await wait(400); const m = document.querySelector('[data-lmood="water"]'); m.click(); m.click(); out.tip = m.dataset.tip; out.mood = (JSON.parse(localStorage.getItem('da.prefs')).lm || {}).water;
    da.setView(2); await wait(1200); const z = []; for (let i = 0; i < 3; i++) { document.querySelector('#zine [data-zt="zoom"]').click(); await wait(200); z.push(da.PRESS.z); } out.z = z;
    da.setView(3); await wait(800); out.gallery = !document.querySelector('#gallery').hidden && !!document.querySelector('#gallery .gl-hero img'); out.filed = document.querySelectorAll('#sec-wishes .filed-b').length;
    document.querySelector('#ix-reset').click(); await wait(200); out.warn = !document.querySelector('#rst-w').hidden; document.querySelector('#rst-no').click(); await wait(100); out.kept = document.querySelector('#rst-w').hidden && da.POSTERS2.length > 0;
    da.setView(0); await wait(300); return out; });
  check('a layer\'s mood names itself on the hover as it turns; the strip at three sizes; the posters on the wall beside the filed W.I.S.H.es; start again only after a warning', !!ng2.mood && !ng2.tip && ng2.mood !== 'weight' && new Set(ng2.z).size === 3 && ng2.gallery && ng2.filed >= 1 && ng2.warn && ng2.kept, JSON.stringify(ng2));
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
    da.setView(3); await wait(800); out.send = { text: ((document.querySelector('#sec-quick .qp-go') || {}).textContent || '').trim(), icon: !!document.querySelector('#sec-quick .qp-go svg use[href="#g-epson"]') }; out.loops = document.querySelectorAll('#sec-loops').length; da.setView(2); await wait(900); document.querySelector('#view [data-pick="strip"]').click(); await wait(400); out.made = document.querySelectorAll('#pick [data-pk-k="R"]:not([data-pk-id=""])').length; document.querySelector('#pick [data-pk-x]').click(); da.setView(3); await wait(600);
    const card = da.deck().find(c => c.kind === 'poster'); if (card) { await da.openCard(card); await wait(500); out.card = { share: document.querySelectorAll('.card-view [data-tv="share"]').length, keys: [...document.querySelectorAll('.card-view .tv-k b')].map(b => b.textContent).join('|'), poster: !!document.querySelector('.card-view .tv-poster img') }; document.querySelector('.card-view [data-tv="x"]').click(); }
    da.setView(0); return out; });
  check('loop keeps this sound playing, and is kept, and plays again exactly as it was, kept among what SELECT offers in PRINT and not on the portfolio; its link carries the place and every layer and comes back the same; the link shows its picture and code', a2.loop && a2.round && a2.off && a2.again && a2.loops === 0 && a2.made >= 1 && /^-?\d+\.\d{4},-?\d+\.\d{4},\d+,([01]\d[0-9a-z]){4}$/.test(a2.code) && a2.link.art && a2.link.keys === 'copy link|onto the strip|save|close', JSON.stringify(a2));
  check('the Country stands on the radio only, fading; the W.I.S.H. a handheld, I and its poem lettered in the margin of its screen, no marks or numbers', a2.ctry && a2.fade === 'ctryfade' && !a2.ctry1 && a2.form.icons === 0 && a2.form.margin === 'I,W,I,S,H,BY', JSON.stringify(a2));
  check('the print shop in the order it is used, the story, the looks, then the paper and the keys out; no heading over the print key; the looks the one drawer, everything else to put down from SELECT; no hover words on the looks; a poster and a link placed from SELECT; the story at the head moves up and down only', a2.shop.head === 0 && a2.shop.caps >= 9 && a2.shop.sw >= 5 && /sec-slips,sec-drawers,sec-style,sec-out/.test(a2.shop.order) && a2.drawers === 1 && a2.drawer.join('|') === '|dr-look|' && a2.tips === 0 && /p/.test(a2.opts) && /R/.test(a2.opts) && a2.placed[1] === a2.placed[0] + 1 && a2.placed[2] === a2.placed[1] + 1 && a2.placed[3] === 'qr' && !!a2.base && a2.base.sel && a2.base.x && a2.base.rot && !a2.base.ctl, JSON.stringify(a2));
  check('send message: a printer and no words; a card turned over beside its poster, its keys with their words, and no share', a2.send.text === '' && a2.send.icon && !!a2.card && a2.card.share === 0 && a2.card.poster && /onto the strip/.test(a2.card.keys), JSON.stringify(a2));
  /* a link to the radio, opened: tuned there, its layers as they were, play waiting for a touch */
  await page.goto('https://oan.test/index.html?fresh=1#mix=-37.7712,144.9601,750,121000010128'); await ready(page); await sleep(2500);
  const lk = await page.evaluate(() => { const da = window.__da; return { lat: +da.S.scan.lat.toFixed(4), r: da.S.scan.r, water: da.T4.water, comm: da.T4.community, poll: da.T4.pollution, mood: (da.prefs.lm || {}).pollution, view: da.S.view, radio: da.S.radio }; });
  check('a radio link opened tunes the radar where it was made, with its layers and moods, and waits for play', lk.lat === -37.7712 && lk.r === 750 && lk.water === false && lk.comm === false && lk.poll === true && lk.mood === 'blown' && lk.view === 0 && !lk.radio, JSON.stringify(lk));
  await ctx.close();
} catch (e) { results.push(`FAIL  section smoke: ${e.message.split('\n').slice(0, process.env.DBG_STACK ? 8 : 1).join(' | ')}`); }

// ───────── the portfolio: a post published on the approval page, listed in the app and read on its own page ─────────
if (run('portfolio')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'portfolio');
  const made = await admin('posts', { title: 'Fan night at Kines', cat: 'case study', summary: 'Twelve fans repaired before the first 35°.', body: 'We met at six.\n\n## What worked\n\nA queue, a bench, a list.', links: ['https://example.org/fans'], status: 'published' });
  await admin('posts', { title: 'A draft nobody sees', body: 'Not yet.' });
  await page.goto('https://oan.test/index.html'); await ready(page); await tab(page, 3); await sleep(1200);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page); await sleep(800);
  const fr = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    da.setOpen(true); da.setView(0); await wait(700);
    out.nino = []; { const n = document.querySelector('#view [data-nino]'); n.click(); out.nino.push(!!da.prefs.nino, document.body.classList.contains('nino')); n.click(); out.nino.push(!!da.prefs.nino, document.body.classList.contains('nino')); }
    out.front = da.faceOf(0); out.keys = [...document.querySelectorAll('#view button')].map(b => (b.dataset.radio != null ? 'play' : b.dataset.knob ? 'knob' : b.className.split(' ')[0])); out.stock0 = !!document.querySelector('#view .dev.radio') && !document.querySelector('#view .mod, #view .mod-cap');
    out.flip = !!document.querySelector('#view [data-flip]'); out.step = (document.querySelector('#view .steps.clues .st.now .st-w') || {}).textContent;
    const v0 = +document.querySelector('[data-knob="water"]').getAttribute('aria-valuenow'); document.querySelector('[data-knob="water"]').click(); await wait(200); out.knob = [v0, +document.querySelector('[data-knob="water"]').getAttribute('aria-valuenow')];
    document.querySelector('#view [data-radio]').click(); await wait(2200);
    out.example = { loop: da.LOOP.on, radio: da.S.radio, near: Math.abs(da.S.scan.lat - (-37.7865)) < 0.001, r: da.S.scan.r, mood: (da.prefs.lm || {}).life, water: (da.prefs.lm || {}).water };
    await wait(7200); out.nudge = document.querySelector('#rail .tab[data-i="1"]').classList.contains('nudge');
    da.setView(1); await wait(900); out.nudged = document.querySelector('#rail .tab[data-i="1"]').classList.contains('nudge'); out.hash = location.hash;
    out.wish = { intent: !!document.querySelector('#view .visor #wf-for'), board: !document.querySelector('#board').hidden, tip: (document.querySelector('#view .vs-i') || { dataset: {} }).dataset.tip, lines: document.querySelectorAll('#view .vs-poem textarea, #view #wf-by').length, camera: !!document.querySelector('#view .vs-cam #wf-photo[accept^="image"]'), stock: !document.querySelector('#view .mod, #view .mod-cap') };
    const f = document.querySelector('#wf-for'); f.value = 'Shade for the grey-headed flying-fox'; f.dispatchEvent(new Event('input', { bubbles: true })); await wait(1400);
    out.draft = ['w', 'i', 's', 'h'].map(x => da.WDRAFT[x]); out.preview = !!document.querySelector('#cover .wpv img');
    document.querySelector('#view [data-flip]').click(); await wait(900); out.back1 = { face: da.faceOf(1), mod: !!document.querySelector('#view .visor.mod .mod-cap') && !!document.querySelector('#view .visor.mod .mod-label'), lines: ['w', 'i', 's', 'h'].map(x => (document.querySelector('#wf-' + x) || {}).value), hints: ['w', 'i', 's', 'h'].map(x => (document.querySelector('#wf-' + x) || {}).placeholder).join('|'), by: !!document.querySelector('#view #wf-by'), dice: document.querySelectorAll('#view [data-vs="dice"]').length };
    document.querySelector('#view [data-flip]').click(); await wait(900);
    document.querySelector('#view .vs-make').click(); await wait(2600);
    out.made = { view: da.S.view, hash: location.hash, face: da.faceOf(2), base: da.zineObjects().some(o => o.daKind === 'base'), tools: getComputedStyle(document.querySelector('#zine .tools')).display };
    out.pkeys = { all: document.querySelectorAll('#view button').length, tp: document.querySelectorAll('#view [data-tp]').length, print: document.querySelectorAll('#view [data-pout="send"]').length, stock: !document.querySelector('#view .mod, #view .mod-cap') };
    out.info0 = document.querySelector('#tp-info').hidden && !document.querySelector('#tp-info').offsetHeight; document.querySelector('[data-prn]').click(); await wait(200); out.info1 = !document.querySelector('#tp-info').hidden && /NOVEL\.GLOBAL/.test(document.querySelector('#tp-info').textContent);
    const n0 = da.zineObjects().length; document.querySelector('[data-tp="pick"]').click(); await wait(500); document.querySelector('#pick [data-pk-tab="stick"]').click(); await wait(400); document.querySelector('#pick [data-pk-k="stk"]').click(); await wait(900); out.stk = da.zineObjects().length === n0 + 1; document.querySelector('#pick [data-pk-x]') && document.querySelector('#pick [data-pk-x]').click();
    document.querySelector('#view [data-flip]').click(); await wait(900); out.flipped = da.faceOf(2) === 'back' && !!document.querySelector('#view [data-drawer]') && !!document.querySelector('#view .dev.tepra.mod .mod-cap') && document.querySelector('#ps-info').hidden;
    da.setView(0); await wait(600); document.querySelector('#view [data-flip]').click(); await wait(900); out.back0 = da.faceOf(0) === 'back' && !!document.querySelector('#view .band.dev.radio.mod .mod-cable'); document.querySelector('#view [data-flip]').click(); await wait(900);
    return out; });
  check('the front of RADIO: a smoked radio as it ships, play, a knob for each track that turns off and through three levels, the red El Niño switch, the jellyfish that turns it over; no clues under it', fr.front === 'front' && fr.flip && fr.stock0 && fr.keys.filter(k => k === 'knob').length === 4 && fr.keys.filter(k => k === 'play').length === 1 && fr.keys.length === 7 && fr.keys.includes('rd-nino') && fr.keys.includes('flip-b') && fr.nino.join() === 'true,true,false,false' && !fr.step && fr.knob[1] === (fr.knob[0] + 1) % 4, JSON.stringify(fr));
  check('play before anywhere is chosen: the radio over Royal Park, deep and slow (DUB on the lives, WEIGHT on the water), playing what the hand finds there and no loop; then the W.I.S.H. tab glows until it is opened', !fr.example.loop && fr.example.radio && fr.example.near && fr.example.r === 700 && fr.example.mood === 'dub' && fr.example.water === 'weight' && fr.nudge && !fr.nudged && fr.hash === '#wish', JSON.stringify(fr));
  check('the front of W.I.S.H.: one line, I (Intention), and a camera, no dice; nothing written for anyone, the receipt beside it; turned over, the same handheld opened, its four lines empty, each showing what its letter stands for; make takes the intention alone to PRINT', fr.wish.intent && !fr.wish.board && fr.wish.tip === 'Intention' && fr.wish.lines === 0 && fr.wish.camera && fr.wish.stock && fr.draft.every(x => !x) && fr.preview && fr.back1.face === 'back' && fr.back1.mod && fr.back1.by && fr.back1.lines.every(x => !x) && fr.back1.hints === "What we know|It would be great|So let's create|Here is how it works" && fr.back1.dice === 0 && fr.made.view === 2 && fr.made.hash === '#print' && fr.made.base && fr.made.tools === 'none', JSON.stringify(fr));
  check('the front of PRINT: the receipt alone, three keys, one to take back, and one to print; the name and state of the printer out of sight until its light is pressed; turned over, the studio on the opened label maker, and the radio opened too', fr.pkeys.all === 7 && fr.pkeys.tp === 4 && fr.pkeys.print === 1 && fr.pkeys.stock && fr.info0 && fr.info1 && fr.stk && fr.flipped && fr.back0, JSON.stringify(fr));
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
    document.querySelector('#pick [data-pk-k="X"]').click(); await wait(7000); document.querySelector('#pick [data-pk-x]') && document.querySelector('#pick [data-pk-x]').click();
    out.zine = { story: da.PRESS.story, kinds: [...new Set(da.zineObjects().map(o => o.daKind))].sort().join() };
    da.setView(3); await wait(9000);
    out.hero = { img: !!document.querySelector('#gallery .gl-hero.ex img'), cap: (document.querySelector('#gallery .gl-hero figcaption') || {}).textContent, swim: !!document.querySelector('#ph .swim .sw-j'), name: !!document.querySelector('#ph .lk-n') };
    return out; });
  check('BOARD 00 stands before BOARD 01: the example built from its kit, the three steps side by side, photographs, sources and strings; looked at, not changed, and nothing placed lands on it', ex.keys[0] === 'BOARD 00' && ex.keys[1] === 'BOARD 01' && ex.b00.locked && ex.b00.sections === 3 && ex.b00.steps === 3 && ex.b00.images >= 6 && ex.b00.links >= 10 && ex.b00.src >= 8 && ex.b00.n >= 40 && ex.guard.b00 && ex.guard.id !== 'b00', JSON.stringify(ex));
  check('the example zine, from the drawer: its receipt at the head, a photograph, the muse, its sound, BOARD 00 and a stamp; the portfolio\'s hero, the muse swimming where the name was', ex.opt && ex.zine.story === 'ex:DA-0RNG' && /art/.test(ex.zine.kinds) && /board/.test(ex.zine.kinds) && /stamp/.test(ex.zine.kinds) && /sticker/.test(ex.zine.kinds) && ex.hero.img && /000/.test(ex.hero.cap || '') && ex.hero.swim && !ex.hero.name, JSON.stringify(ex));
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
  await ctx.close();
} catch (e) { results.push(`FAIL  section fronts: ${e.message.split('\n')[0]}`); }

// ───────── a first visit: no radar until a tap says where you are ─────────
if (run('first')) try {
  const ctx = await newCtx(); await wire(ctx, { first: true }); await ctx.addInitScript(() => { window.__noStart = true; }); const page = await ctx.newPage(); watch(page, 'first');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page); await sleep(800);
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
const lifeSpot = page => page.evaluate(() => { const da = window.__da; da.life.reveal(); const r = da.map.getContainer().getBoundingClientRect(); const dev = document.querySelector('#view .dev'); const d = dev ? dev.getBoundingClientRect() : { left: innerWidth, top: innerHeight };
  for (const it of da.life.items) { if (!it.inS || it.binned || (it.pile || 0) >= 2 || typeof it.o.id !== 'number' || it.o.hum || it.o.hist || !da.life.shown(it)) continue; const x = it.x + (it.dx || 0), y = it.y + (it.dy || 0); const X = x + r.left, Y = y + r.top;
    if (X < 40 || Y < 70 || X > innerWidth - 40 || Y > innerHeight - 70 || (X > d.left - 30 && Y > d.top - 30 && Y < d.bottom + 30) || X > innerWidth - (innerWidth >= 760 ? 470 : 0) || (innerWidth < 760 && Y > d.top - 40)) continue;
    const h = da.life.hit(x, y, true); if (h && h.kind === 'cell' && h.id === it.o.id) return { id: it.o.id, n: da.S.byId.get(it.o.id) ? it.o.id : null, x: X, y: Y }; }
  return null; });
async function walkJourney(page, tag, phoneSize) {
  const out = {}; const st = () => page.evaluate(() => ({ j: window.__da.prefs.journey, view: window.__da.S.view, simple: window.__da.simple(), cls: ['simple', 'j0', 'j1', 'j2', 'j3'].filter(c => document.body.classList.contains(c)).join(' ') }));
  const press = async (sel, x) => (phoneSize ? page.tap(sel, { timeout: 20000 }) : tap(page, sel, x));
  /* 0: the map alone */
  out.s0 = await page.evaluate(() => { const da = window.__da; const vis = el => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0; const so = document.querySelector('.jr-sonar'); const sr = so.getBoundingClientRect(); return { j: da.prefs.journey, cls: document.body.classList.contains('j0'), placed: da.placed(), panel: vis(document.querySelector('#panel')), rail: vis(document.querySelector('#rail')), sonar: !so.hidden && sr.left > 0 && sr.left < innerWidth && sr.top > 0 && sr.top < innerHeight }; });
  await shot(page, `${tag}0-map.png`);
  /* 1: a touch on the map, and the radar lands where it fell, 500 m; the radio comes up, half its height, no jellyfish */
  const m = await page.evaluate(() => { const r = window.__da.map.getContainer().getBoundingClientRect(); return [r.left + r.width * 0.48, r.top + r.height * 0.36]; });
  if (phoneSize) await page.touchscreen.tap(m[0], m[1]); else await page.mouse.click(m[0], m[1]);
  await page.waitForFunction(() => window.__da.prefs.journey === 1 && !!document.querySelector('#view .simple-r .dev'), null, { timeout: 15000 }); await sleep(1400);
  out.s1 = await page.evaluate(([x, y]) => { const da = window.__da; const r = da.map.getContainer().getBoundingClientRect(); const ll = da.map.unproject([x - r.left, y - r.top]); const dev = document.querySelector('#view .simple-r .dev').getBoundingClientRect();
    return { r: da.S.scan.r, placed: da.placed(), off: Math.round(da.haversine(ll.lat, ll.lng, da.S.scan.lat, da.S.scan.lng)), radio: da.S.radio, h: Math.round(dev.height), w: Math.round(dev.width), inView: dev.left >= 0 && dev.right <= innerWidth && dev.bottom <= innerHeight, flip: document.querySelectorAll('[data-flip]').length, keys: document.querySelectorAll('#view .simple-r [data-knob]').length, play: !!document.querySelector('#view .simple-r [data-radio]'), nino: !!document.querySelector('#view .simple-r [data-nino]'),
      tabs: [...document.querySelectorAll('#rail .tab')].map(t => getComputedStyle(t).visibility !== 'hidden') }; }, m);
  await shot(page, `${tag}1-radio.png`);
  /* 2: a life touched: W.I.S.H. opens over the map with the receipt of it, the clear intention device, the stories */
  await page.evaluate(() => { const da = window.__da; da.map.easeTo({ center: [da.S.scan.lng, da.S.scan.lat], zoom: Math.max(da.map.getZoom(), 15.6), offset: innerWidth < 760 ? [0, -innerHeight * 0.2] : [-220, 0], duration: 0 }); }); await settle(page); await sleep(500);
  const spot = await lifeSpot(page); out.spot = !!spot;
  if (phoneSize) await page.touchscreen.tap(spot.x, spot.y); else await page.mouse.click(spot.x, spot.y);
  await page.waitForFunction(() => window.__da.prefs.journey === 2 && window.__da.S.view === 1 && !!document.querySelector('#jr:not([hidden]) .jr-r img[src^="data:"]'), null, { timeout: 15000 }); await sleep(900);
  out.s2 = await page.evaluate(id => { const da = window.__da; const b = el => { const r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
    const dev = document.querySelector('#view .simple-w .vs-body'); const cs = getComputedStyle(dev); const acts = [...document.querySelectorAll('#jr .jr-act')];
    return { sel: da.JR.sel && da.JR.sel.id === id, offMap: document.body.classList.contains('off-map'), mapSeen: !document.querySelector('#board:not([hidden])') && getComputedStyle(document.querySelector('#cover')).display === 'none', dev: b(dev), clear: /rgba\([^)]*0?\.[0-2]\d*\)/.test(cs.backgroundImage) && cs.backdropFilter === 'none', select: document.querySelectorAll('#view [data-pick]').length, cam: document.querySelectorAll('#view input[type="file"]').length, flip: document.querySelectorAll('[data-flip]').length,
      rcpt: b(document.querySelector('#jr .jr-r img')), acts: acts.length, actFont: acts.length ? parseFloat(getComputedStyle(acts[0].querySelector('b')).fontSize) : 0, actBox: acts.length ? b(acts[0]) : null, src: document.querySelector('#jr .jr-r img').src, tabs: [...document.querySelectorAll('#rail .tab')].map(t => getComputedStyle(t).visibility !== 'hidden') }; }, spot.id);
  out.s2.qr = await qrIn(out.s2.src); out.s2.src = out.s2.src.length;
  await shot(page, `${tag}2-wish.png`);
  /* a story taken up is the intention; then words of one's own, and make */
  await press('#jr li:first-child .jr-act'); await sleep(500);
  out.story = await page.evaluate(() => ({ want: window.__da.JR.want, field: document.querySelector('#jw-for').value, next: document.querySelector('#view .vs-make').classList.contains('next') }));
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
    return { h: Math.round(dev.height), w: Math.round(dev.width), kinds: objs.map(o => o.daKind).join(), sel: !!document.querySelector('#view .jp-sel'), hero: Math.round(document.querySelector('#view .jp-sel').getBoundingClientRect().width), print: document.querySelectorAll('#view [data-pout="send"]').length, lcd: document.querySelectorAll('#view #tp-words, #view .tp-lcd').length, flip: document.querySelectorAll('[data-flip]').length, note: s.note, jr: !!s.jr, code: s.code, src: objs.find(o => o.daKind === 'code').getSrc(), caret: !!document.querySelector('#jr-caret:not([hidden])') }; });
  out.s3.qr = await qrIn(out.s3.src); out.s3.src = out.s3.src.length;
  /* and off the screen itself, at the size it shows, as a phone held up to it would */
  const cr = await page.evaluate(() => { const da = window.__da; const c = da.zineObjects().find(o => o.daKind === 'code'); const up = document.querySelector('#zine .upper-canvas'); const r = up.getBoundingClientRect(); const z = r.width / 320; const desk = document.querySelector('#zine .desk'); desk.scrollTop = Math.max(0, c.top * z - 40); const r2 = up.getBoundingClientRect(); return { x: Math.max(0, r2.left), y: Math.max(0, r2.top + c.top * z), width: Math.min(r2.width, innerWidth - r2.left), height: Math.min(c.getScaledHeight() * z, innerHeight - (r2.top + c.top * z)) }; });
  try { const png = await page.screenshot({ clip: cr, animations: 'disabled' }); const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const q = jsQR(new Uint8ClampedArray(data), info.width, info.height); out.s3.screen = q ? q.data === out.s3.qr : false; out.s3.px = Math.round(cr.width); } catch (e) { out.s3.screen = String(e.message).slice(0, 60); }
  out.s3.unpacked = out.s3.qr ? await page.evaluate(q => { try { const s = window.__da.unpackSignal(q.split('#x=')[1]); return { code: s.code, note: s.note, n: s.pin.cn, tied: s.nodes.length }; } catch (e) { return null; } }, out.s3.qr) : null;
  await press('#jr-caret'); await sleep(300); await page.keyboard.type('Back at dusk'); await sleep(700);
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
  /* 4: printed: everything opens; the print waits to print, the hero of the showcase */
  await press('#view [data-pout="send"]');
  await page.waitForFunction(() => window.__da.prefs.journey === 4 && window.__da.S.view === 3 && !!document.querySelector('#gallery .gl-vfd b'), null, { timeout: 20000 }); await sleep(1800);
  out.s4 = await page.evaluate(() => { const da = window.__da; return { simple: da.simple(), cls: document.body.classList.contains('simple'), waiting: document.querySelector('#gallery').classList.contains('waiting'), led: !!document.querySelector('#gallery .gl-st:not(.done)'), vfd: document.querySelector('#gallery .gl-vfd').textContent, hero: (() => { const tr = document.querySelector('#gallery .gl-track'); const i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); const im = document.querySelector(`#gallery .gl-slide[data-i="${i}"] img`); return !!im && im.src === (da.POSTERS2[0] || {}).img; })(), tabs: [...document.querySelectorAll('#rail .tab')].filter(t => getComputedStyle(t).visibility !== 'hidden').length, phonePane: document.body.classList.contains('pane-main') }; });
  await shot(page, `${tag}5-showcase.png`);
  out.flip = await page.evaluate(async () => { const da = window.__da; const wait = ms => new Promise(r => setTimeout(r, ms)); da.setView(0); await wait(600); const f0 = document.querySelectorAll('#view [data-flip]').length; da.setView(2); await wait(800); return [f0, document.querySelectorAll('#view [data-flip]').length, !!document.querySelector('#view .dev.tepra .tp-lcd')]; });
  return out;
}
if (run('journey')) try {
  /* at a desk's width */
  const ctx = await newCtx(); await wire(ctx, { first: true, journey: true }); await ctx.addInitScript(() => { window.__noStart = true; }); const page = await ctx.newPage(); watch(page, 'journey');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page); await sleep(1200);
  const d = await walkJourney(page, 'j-');
  check('a first visit: the map alone, no page, no rail, no radar; a sonar where life gathers says where to touch', d.s0.j === 0 && d.s0.cls && !d.s0.placed && !d.s0.panel && !d.s0.rail && d.s0.sonar, JSON.stringify(d.s0));
  check('a touch on the map: the radar lands where it fell, 500 m across its reach, and plays; the radio comes up at half its height with its switch, grille, play and knobs, no jellyfish; only RADIO on the rail', d.s1.r === 500 && d.s1.placed && d.s1.off < 30 && d.s1.radio && d.s1.h <= 150 && d.s1.inView && d.s1.flip === 0 && d.s1.keys === 4 && d.s1.play && d.s1.nino && d.s1.tabs.join() === 'true,false,false,false', JSON.stringify(d.s1));
  check('a life touched opens W.I.S.H. over the map itself: its receipt as intel with no code on it, the intention device as small as the radio and clear, no SELECT key, three stories easy to read; W.I.S.H. now on the rail', d.spot && d.s2.sel && !d.s2.offMap && d.s2.mapSeen && d.s2.qr === null && d.s2.rcpt.h > 200 && d.s2.dev.h <= 150 && Math.abs(d.s2.dev.w - d.s1.w) <= 40 && d.s2.clear && d.s2.select === 0 && d.s2.flip === 0 && d.s2.acts === 3 && d.s2.actFont >= 14 && d.s2.tabs.join() === 'true,true,false,false', JSON.stringify(d.s2));
  check('a story taken up is the intention, and the receipt shows what is typed as it is typed', !!d.story.want && d.story.field === d.story.want && d.story.next && d.typed.want === 'Water out for the flying-foxes' && d.typed.redrawn, JSON.stringify({ story: d.story, typed: d.typed }));
  check('a place touched near the life on W.I.S.H. is tied to it, a connection on its receipt, and travels in its code', d.tie.tied && d.tie.j === 2 && d.tie.view === 1 && d.tie.redrawn && !!d.s3.unpacked && d.s3.unpacked.tied === 1, JSON.stringify({ tie: d.tie, unpacked: d.s3.unpacked }));
  check('make: PRINT opens with a label maker half the size, SELECT its hero and no form; the receipt on the strip, then its words, then its code, which a phone reads as the receipt itself, off the screen too', d.s3.screen === true && d.s3.h <= 170 && d.s3.w <= 340 && d.s3.sel && d.s3.hero >= 120 && d.s3.print === 1 && d.s3.lcd === 0 && d.s3.flip === 0 && d.s3.kinds === 'base,words,code' && d.s3.jr && d.s3.caret && /^https:\/\/novel\.global\/#x=/.test(d.s3.qr || '') && !!d.s3.unpacked && d.s3.unpacked.code === d.s3.code && d.s3.unpacked.note === 'Water out for the flying-foxes', JSON.stringify(d.s3));
  check('the words are typed on the receipt itself, and the code moves down to stay under them', d.words.text === 'Back at dusk' && d.words.below, JSON.stringify(d.words));
  check('SELECT on a first visit: the lives first, then the stickers, nothing made yet to confuse; a life chosen lands on the receipt and the code stays on top', d.pick.simple && d.pick.tabs === 'lives*,stick' && d.pick.lives >= 3 && d.pick.made === 0 && d.placed.more && d.placed.top === 'code', JSON.stringify({ pick: d.pick, placed: d.placed }));
  const waiting = (await admin('stories?status=waiting')).stories.filter(x => x.code === d.s3.code);
  check('print: it goes to novel.global\'s printer through approval, and is the hero of the showcase, waiting to print, its light amber; everything is open, the jellyfish on every device', !d.s4.simple && !d.s4.cls && d.s4.waiting && d.s4.led && /№ 001/.test(d.s4.vfd) && /WAITING/.test(d.s4.vfd) && d.s4.hero && d.s4.tabs === 4 && waiting.length === 1 && d.flip[0] === 1 && d.flip[1] === 1 && d.flip[2], JSON.stringify({ s4: d.s4, flip: d.flip, waiting: waiting.length }));
  await page.reload(); await ready(page); await sleep(800);
  const again = await page.evaluate(() => ({ j: window.__da.prefs.journey, simple: window.__da.simple(), cls: document.body.classList.contains('simple'), tabs: [...document.querySelectorAll('#rail .tab')].filter(t => getComputedStyle(t).visibility !== 'hidden').length }));
  check('done once on this device, it stays done', again.j === 4 && !again.simple && !again.cls && again.tabs === 4, JSON.stringify(again));
  /* Settings plays it again, from the bare map; nothing made is lost */
  const posters = await page.evaluate(() => window.__da.POSTERS2.length);
  await page.evaluate(() => window.__da.setView(3)); await sleep(800); await tap(page, '#ix-journey'); await page.waitForNavigation({ timeout: 20000 }).catch(() => {}); await ready(page); await sleep(800);
  const rp = await page.evaluate(() => ({ j: window.__da.prefs.journey, j0: document.body.classList.contains('j0'), posters: window.__da.POSTERS2.length, sel: window.__da.JR.sel }));
  check('Settings plays the first visit again from the bare map, and what was made stays', rp.j === 0 && rp.j0 && rp.posters === posters && !rp.sel, JSON.stringify(rp));
  for (const x of (await admin('stories?status=waiting')).stories.filter(y => y.code === d.s3.code)) await admin(`stories/${x.id}`, { action: 'delete' });
  await ctx.close();
  /* at a phone's width: the same way through, each device on its rail, what it holds in view above it */
  const pc = await newCtx({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await wire(pc, { first: true, journey: true }); await pc.addInitScript(() => { window.__noStart = true; }); const pp = await pc.newPage(); watch(pp, 'journey-phone');
  await pp.goto('https://oan.test/index.html'); await ready(pp); await settle(pp); await sleep(1200);
  const p = await walkJourney(pp, 'jp-', true);
  const layout = p.s2.rcpt.b <= p.s2.actBox.t + 2 && p.s2.actBox.b <= p.s2.dev.t + 2 && p.s2.rcpt.t >= 0 && p.s2.dev.r <= 390 && p.s2.dev.l >= 0;
  check('on a phone: the map alone, then the radio rides its rail at half its height, RADIO alone on the bar', p.s0.j === 0 && !p.s0.panel && !p.s0.rail && p.s1.r === 500 && p.s1.h <= 150 && p.s1.inView && p.s1.flip === 0 && p.s1.tabs.join() === 'true,false,false,false', JSON.stringify({ s0: p.s0, s1: p.s1 }));
  check('on a phone W.I.S.H. holds the receipt over the map, the stories under it and the clear intention device under them, nothing over anything', p.spot && p.s2.qr === null && p.s2.acts === 3 && p.s2.select === 0 && p.s2.clear && layout, JSON.stringify(p.s2));
  check('on a phone PRINT: the receipt, its words typed on it, its code read by a phone off the screen; SELECT the hero; printed, the showcase holds it waiting, and everything opens', p.s3.screen === true && p.s3.h <= 170 && p.s3.kinds === 'base,words,code' && /^https:\/\/novel\.global\/#x=/.test(p.s3.qr || '') && p.words.text === 'Back at dusk' && p.pick.tabs === 'lives*,stick' && p.placed.more && !p.s4.simple && p.s4.waiting && p.s4.phonePane && p.s4.tabs === 4 && p.flip[0] === 1, JSON.stringify({ s3: p.s3, words: p.words, pick: p.pick, s4: p.s4, flip: p.flip }));
  check('on a phone nothing spills sideways at any gate', await pp.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0);
  for (const x of (await admin('stories?status=waiting')).stories.filter(y => y.code === p.s3.code)) await admin(`stories/${x.id}`, { action: 'delete' });
  await pc.close();
  /* the easter egg: the tiny NOVEL.GLOBAL in the information corner, pressed twice, opens everything at once */
  const ec = await newCtx(); await wire(ec, { first: true, journey: true }); await ec.addInitScript(() => { window.__noStart = true; }); const ep = await ec.newPage(); watch(ep, 'journey-egg');
  await ep.goto('https://oan.test/index.html'); await ready(ep); await sleep(800);
  await tap(ep, '.maplibregl-ctrl-attrib-button'); await sleep(300); await ep.dblclick('.da-egg'); await sleep(1500);
  const egg = await ep.evaluate(() => ({ j: window.__da.prefs.journey, simple: window.__da.simple(), open: window.__da.S.open, flip: document.querySelectorAll('#view [data-flip]').length, tabs: [...document.querySelectorAll('#rail .tab')].filter(t => getComputedStyle(t).visibility !== 'hidden').length }));
  check('the easter egg: NOVEL.GLOBAL in the information corner, pressed twice, opens everything at once', egg.j === 4 && !egg.simple && egg.open && egg.flip === 1 && egg.tabs === 4, JSON.stringify(egg));
  /* a link someone was sent skips the bare map: the radio is there, tuned where the link was made */
  await ep.evaluate(() => localStorage.clear());
  await ep.goto('https://oan.test/index.html?fresh=2#mix=-37.7712,144.9601,750,121000010128'); await ready(ep, '', true); await sleep(2500);
  const ln = await ep.evaluate(() => ({ j: window.__da.prefs.journey, open: window.__da.S.open, radio: !!document.querySelector('#view .simple-r .dev'), lat: +window.__da.S.scan.lat.toFixed(4), r: window.__da.S.scan.r, panel: getComputedStyle(document.querySelector('#panel')).display !== 'none' }));
  check('a link someone was sent skips the bare map: the small radio is there, tuned where the link was made', ln.j === 1 && ln.open && ln.radio && ln.panel && ln.lat === -37.7712 && ln.r === 750, JSON.stringify(ln));
  await ec.close();
} catch (e) { results.push(`FAIL  section journey: ${e.message.split('\n')[0]}`); }

// ───────── the radar: moved, resized, kept ─────────
if (run('radar')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'radar');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page); await sleep(400);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
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
  check('the board shows it first, above the examples', top.code === s.code && !top.ex && /1/.test(top.count), JSON.stringify(top));
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
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
  await p2.goto('https://oan.test/index.html'); await ready(p2); await sleep(1500); await tab(p2, 3); await sleep(600);
  const b2 = await p2.evaluate(code => { const r = [...document.querySelectorAll('#sec-board .sig-row')].find(x => x.querySelector('.code').textContent === code); return { row: !!r, sh: !!r && r.classList.contains('sh'), st: r ? (r.querySelector('.st') || { getAttribute: () => '' }).getAttribute('aria-label') || '' : '' }; }, s0.code);
  check('on another device it stands on the board, for everyone', b2.row && b2.sh && /SHOWN/.test(b2.st), JSON.stringify(b2));
  await ctx2.close();
  /* a story approved before CONFIG.SHARED_SINCE, made while the site was being built, is shown nowhere */
  const ctxC = await newCtx(); await wire(ctxC, { config: BASE_CONFIG.replace(/SHARED_SINCE: '[^']*'/, "SHARED_SINCE: '2099-01-01T00:00:00Z'") }); const pC = await ctxC.newPage(); watch(pC, 'share-cut');
  await pC.goto('https://oan.test/index.html'); await ready(pC); await sleep(1500);
  const cut = await pC.evaluate(code => ({ shared: window.__da.S.shared.length, here: window.__da.S.signals.some(x => x.code === code), cfg: window.__da.CONFIG.SHARED_SINCE }), s0.code);
  check('a story approved before the cut-off is shown nowhere: the ones made while the site was being built are gone', cut.shared === 0 && !cut.here && /2099/.test(cut.cfg), JSON.stringify(cut));
  await ctxC.close();
  /* a third device, from the code printed on the slip */
  const ctx3 = await newCtx(); await wire(ctx3); const p3 = await ctx3.newPage(); watch(p3, 'share-3');
  await p3.goto('https://oan.test/index.html'); await ready(p3); await p3.evaluate(() => localStorage.removeItem('da.shared.v1')); await tab(p3, 3); await sleep(400);
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
  await page.setInputFiles('#pack-f', { name: 'fruit-and-radios.md', mimeType: 'text/markdown', buffer: Buffer.from(MD) }); await sleep(600);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
  const it = await page.evaluate(() => { const da = window.__da; da.life.reveal(); const r = da.map.getContainer().getBoundingClientRect(); const it = da.life.items.find(i => i.inS && da.life.shown(i) && !i.binned && !i.o.hero && !i.o.user && typeof i.o.id === 'number' && i.x > 80 && i.y > 120 && i.x < r.width - 320 && i.y < r.height - 120 && (() => { const h = da.life.hit(i.x, i.y); return h && h.id === i.o.id; })()); return it && it.o.id; });
  const [x, y] = await xy(page, it); await page.mouse.move(x, y, { steps: 4 }); await sleep(600);
  const tagOf = () => page.evaluate(id => { const t = document.querySelector('#tag'); const r = t.getBoundingClientRect(); const it = window.__da.life.items.find(i => i.o.id === id); const m = window.__da.map.getContainer().getBoundingClientRect();
    return { tag: !t.hidden, hide: !!t.querySelector('.hide'), img: t.querySelectorAll('img').length, beside: it ? Math.min(Math.abs(r.left - (m.left + it.x + it.dx)), Math.abs(r.right - (m.left + it.x + it.dx))) : -1, level: it ? Math.abs((r.top + r.bottom) / 2 - (m.top + it.y + it.dy)) : -1 }; }, it);
  let tg = await tagOf(); if (!tg.tag) { await page.mouse.move(x + 40, y + 40); await settle(page); await sleep(300); const [x2, y2] = await xy(page, it); await page.mouse.move(x2, y2, { steps: 4 }); await sleep(800); tg = await tagOf(); }
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
  const sh = await page.evaluate(() => (document.querySelector('#ix-hidden') || {}).textContent || '');
  await tap(page, '#ix-hidden'); await sleep(500);
  const back = await page.evaluate(id => window.__da.life.items.some(i => i.o.id === id) && !document.querySelector('#ix-hidden'), it);
  check('settings counts what is hidden, and brings it all back', /1 HIDDEN/.test(sh) && back, sh);
  await ctx.close();
} catch (e) { results.push(`FAIL  section hide: ${e.message.split('\n')[0]}`); }

// ───────── an animal lost: its search area, on and off ─────────
if (run('lost')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'lost');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page); await sleep(800);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await sleep(800);
  await tab(page, 0);
  await page.waitForFunction(() => window.__da.S.sensors.length > 0 && window.__da.S.fountains.length > 0, null, { timeout: 30000 }).catch(() => {});
  const hot = await page.evaluate(() => ({ tmax: window.__da.S.wx.tmax, sensors: window.__da.S.sensors.length, fountains: window.__da.S.fountains.length }));
  check('on a day over the heat line, the drinking water and the air temperature arrive', hot.tmax >= 40 && hot.sensors > 0 && hot.fountains > 0, JSON.stringify(hot));
  await ctx.close();
  const ctx2 = await newCtx(); await wire(ctx2, { tmax: 24 }); const p2 = await ctx2.newPage(); watch(p2, 'mild');
  await p2.goto('https://oan.test/index.html'); await ready(p2); await tab(p2, 0); await sleep(1500);
  check('on a mild day the water and the air temperature stay away, unless WATER is on (it is, by default)', await p2.evaluate(() => (window.__da.S.sensors.length === 0 && window.__da.S.fountains.length === 0) || window.__da.T4.water));
  await ctx2.close();
} catch (e) { results.push(`FAIL  section hot: ${e.message.split('\n')[0]}`); }

// ───────── no signal: the radar, the five and the examples still stand ─────────
if (run('offline')) try {
  const ctx = await newCtx(); await wire(ctx, { inat: false, ens: false, comOK: false }); const page = await ctx.newPage(); watch(page, 'offline');
  await page.goto('https://oan.test/index.html');
  await page.waitForFunction(() => window.__da && window.__da.S.mapReady && document.body.classList.contains('nosignal'), null, { timeout: 60000 });
  await sleep(800); await tab(page, 3); await sleep(400);
  const off = await page.evaluate(() => ({ items: window.__da.life.items.length, five: window.__da.S.heroes.length, sigs: document.querySelectorAll('#sec-board .sig-row, #sec-board .sig-line').length, codes: [...document.querySelectorAll('#sec-board .code')].map(c => c.textContent).join(' ') }));
  check('without a signal the five and the example still stand', off.five === 5 && off.items >= 5 && off.sigs === 1, JSON.stringify(off));
  await ctx.close();
} catch (e) { results.push(`FAIL  section offline: ${e.message.split('\n')[0]}`); }

// ───────── night: as the device is set, or chosen in Settings; the page darkens, the ground dims, a slip stays paper ─────────
if (run('night')) try {
  const ctx = await newCtx(); await wire(ctx, { dark: true }); const page = await ctx.newPage(); watch(page, 'night');
  await page.goto('https://oan.test/index.html'); await ready(page, '', true); await settle(page);
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
  await page.goto('https://oan.test/index.html'); await ready(page); await sleep(600);
  await page.goto('https://oan.test/field.html'); await sleep(900);
  const f = await page.evaluate(() => ({ rows: document.querySelectorAll('#rows tr').length, glyphs: document.querySelectorAll('#tools [data-g]').length, maps: document.querySelectorAll('#rows a[href^="index.html#"]').length, overflow: document.documentElement.scrollWidth - innerWidth }));
  check('the field list renders every kind, with links to the map', f.rows >= 200 && f.glyphs >= 30 && f.maps >= 5 && f.overflow <= 0, JSON.stringify(f));
  const href = await page.evaluate(() => document.querySelector('#rows a[href^="index.html#"]').getAttribute('href'));
  await page.goto('https://oan.test/' + href); await ready(page); await sleep(1500);
  const sel = await page.evaluate(() => ({ sel: window.__da.S.sel, face: window.__da.face(), hidden: document.querySelector('#record').hidden }));
  check('a MAP link opens its life on the map', sel.sel != null && !sel.hidden && sel.face === 'front', `${href} → ${JSON.stringify(sel)}`);
  await ctx.close();
} catch (e) { results.push(`FAIL  section field: ${e.message.split('\n')[0]}`); }

// ───────── gatherings from a published sheet ─────────
if (run('events')) try {
  const ctx = await newCtx(); await wire(ctx, { config: BASE_CONFIG.replace("EVENTS_URL: ''", "EVENTS_URL: 'https://sheet.test/events.csv'") }); const page = await ctx.newPage(); watch(page, 'events');
  await page.goto('https://oan.test/index.html'); await ready(page); await sleep(800); await tab(page, 0); await sleep(400);
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

// ───────── look: screenshots for review only (ONLY=look) ─────────
if (ONLY.includes('look')) try {
  const W = +(process.env.W || 1440), Hh = +(process.env.H || 900); const phone = !!process.env.PHONE;
  const ctx = await newCtx({ viewport: { width: W, height: Hh }, ...(phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) }); await wire(ctx); const page = await ctx.newPage(); watch(page, 'look');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page); await sleep(2500);
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
