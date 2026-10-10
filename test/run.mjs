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

async function wire(ctx, { inat = true, config = BASE_CONFIG, tmax = 33, night = 0, worst = 30, ens = true, comOK = true, overpass = true, net = { down: false }, first = false } = {}) {
  /* the radar stays where it is pinned, unless a check is about a first visit */
  if (!first) await ctx.addInitScript(() => { try { if (!localStorage.getItem('da.prefs')) localStorage.setItem('da.prefs', '{"found":true}'); } catch (e) { /* no storage */ } });
  await ctx.route('**/*', async route => {
    const url = route.request().url(); const u = new URL(url);
    if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
    if (net.down) return route.abort('internetdisconnected');
    const ok = (body, type, extra = {}) => route.fulfill({ status: 200, body, headers: { 'content-type': type, 'access-control-allow-origin': '*', ...extra } });
    const json = o => ok(JSON.stringify(o), 'application/json');
    try {
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
  await wire(ctx, { tmax: +(process.env.TMAX || 33), night: +(process.env.NIGHT || 0) }); const page = await ctx.newPage(); watch(page, 'dbg');
  await page.exposeFunction('__snap', (n, clip) => shot(page, n, clip ? { clip } : {}));
  if (process.env.AT) await page.clock.setFixedTime(new Date(process.env.AT));
  await page.goto('https://oan.test/index.html' + (process.env.HASH || ''));
  await ready(page); await sleep(+(process.env.WAIT || 1500));
  const out = process.env.DBG ? await page.evaluate(new Function(`return (async () => { ${fs.readFileSync(process.env.DBG, 'utf8')} })()`)) : null;
  console.log(JSON.stringify(out, null, 1));
  if (process.env.SHOT) await shot(page, process.env.SHOT);
  await ctx.close();
} catch (e) { results.push(`FAIL  section dbg: ${e.message.split('\n')[0]}`); }

// ───────── smoke: the bare radar, then the two pages ─────────
if (run('smoke')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'smoke');
  await page.goto('https://oan.test/index.html#stories'); await ready(page, '', true); await settle(page);
  const land = await page.evaluate(() => { const da = window.__da; const c = da.map.project([da.S.scan.lng, da.S.scan.lat]); const panel = document.querySelector('#panel').getBoundingClientRect(); return { open: da.S.open, view: da.S.view, five: document.querySelectorAll('#sec-five .hero-row').length, radarLeftOfPage: c.x < panel.left, hash: location.hash }; });
  check('the site lands on NOW, the radar beside it, even from a link to another page', land.open && land.view === 0 && land.five === 5 && land.radarLeftOfPage && land.hash === '#now', JSON.stringify(land));
  const adm = await page.evaluate(() => { const a = document.querySelector('.maplibregl-ctrl-attrib a.da-admin'); return a ? { href: a.getAttribute('href'), text: a.textContent, nextTo: !!(a.previousElementSibling && a.previousElementSibling.classList.contains('da-build')) } : null; });
  check('a small ADMIN link sits beside the build in the information corner', adm && adm.href === 'admin' && adm.text === 'ADMIN' && adm.nextTo, JSON.stringify(adm));
  await page.evaluate(() => window.__da.setOpen(false)); await sleep(600);
  const a = await page.evaluate(() => { const da = window.__da; const vis = el => !!el && !el.hidden && el.getBoundingClientRect().width > 0; const panel = document.querySelector('#panel').getBoundingClientRect();
    return { shut: document.body.classList.contains('shut'), panelOff: panel.left >= innerWidth - 2, tabs: document.querySelectorAll('#rail .tab').length, knob: vis(document.querySelector('#knob')), ring: vis(document.querySelector('#ring')), seen: da.life.seen().size, sweep: da.life.sweep, words: document.body.innerText.replace(/\s+/g, ' ').trim().split(' ').filter(w => /[a-z]{3,}/i.test(w)).length }; });
  check('closed, the page leaves only the radar and its two handles', a.shut && a.panelOff && a.tabs === 2 && a.knob && a.ring && a.words <= 12, JSON.stringify(a));
  await sleep(3500);
  const b = await page.evaluate(() => ({ seen: window.__da.life.seen().size, sweep: window.__da.life.sweep }));
  check('the sweep turns and finds what lies inside it', b.sweep !== a.sweep && b.seen > a.seen, `${JSON.stringify(a)} → ${JSON.stringify(b)}`);
  await page.evaluate(() => { window.__blips = 0; const s = window.__da.snd; const o = s.blip; s.blip = k => { window.__blips++; return o.call(s, k); }; });
  await page.keyboard.press('a'); await sleep(2600);
  const bl = await page.evaluate(() => ({ blips: window.__blips, found: window.__da.life.items.filter(it => it.inS && window.__da.life.seen().has(it.o.id) && window.__da.life.shown(it) && !it.o.hist && it.b.tone !== 'cold').length }));
  check('at the first touch the radar plays what it has found so far, and goes on as it sweeps', bl.found > 0 && bl.blips >= Math.min(bl.found, 16), JSON.stringify(bl));
  const v = await page.evaluate(() => { const da = window.__da; da.life.reveal(); const its = da.life.items; const shown = its.filter(it => da.life.shown(it)); const out = shown.filter(it => !it.inS);
    return { shown: shown.length, inside: shown.length - out.length, outside: out.length, hidden: its.filter(it => !it.inS && !da.life.shown(it)).length, allFresh: out.every(it => it.flag && da.isFresh(it.o) && Date.now() - da.stampOf(it.o) < 864e5 + 6e4), freshHidden: its.filter(it => !it.inS && da.isFresh(it.o) && !da.life.shown(it)).length }; });
  check('outside the radar, one rule: only what is from the last 24 hours', v.allFresh && v.outside > 0 && v.freshHidden === 0 && v.inside > 5 && v.hidden > 50, JSON.stringify(v));
  const corner = await page.evaluate(() => (document.querySelector('.maplibregl-ctrl-attrib .da-build') || {}).textContent || '');
  check('the information corner carries the build', /^BUILD \w{7}/.test(corner), corner);
  const sp = await page.evaluate(() => { const da = window.__da; const its = da.life.items.filter(it => da.life.shown(it) && !it.binned && it.b.tone !== 'hist'); let raw = 0, drawn = 0;
    for (let i = 0; i < its.length; i++) for (let j = i + 1; j < its.length; j++) { const a = its[i], b = its[j]; const need = (a.b.d + b.b.d) / 2 * 0.7; const pa = da.map.project([a.lng, a.lat]), pb = da.map.project([b.lng, b.lat]); if (Math.hypot(pa.x - pb.x, pa.y - pb.y) < need) raw++; if (Math.hypot(a.x - b.x, a.y - b.y) < need) drawn++; }
    return { n: its.length, raw, drawn }; });
  check('marks that would sit on each other move apart', sp.drawn <= sp.raw && (sp.raw === 0 || sp.drawn < sp.raw), JSON.stringify(sp));
  await sleep(300);
  const dk = await page.evaluate(() => { const da = window.__da; const cv = document.querySelector('canvas.life:not(.fx)'); const x = cv.getContext('2d'); const k = cv.width / cv.clientWidth; const c = da.map.project([da.S.scan.lng, da.S.scan.lat]); const e = da.map.project([da.S.scan.lng + da.S.scan.r / (111320 * Math.cos(da.S.scan.lat * Math.PI / 180)), da.S.scan.lat]); const R = e.x - c.x;
    const out = [], inn = []; for (let a = 0; a < 360; a += 10) for (const [f, arr] of [[1.45, out], [0.6, inn]]) { const px = c.x + Math.cos(a * Math.PI / 180) * R * f, py = c.y + Math.sin(a * Math.PI / 180) * R * f; if (px < 4 || py < 4 || px > cv.clientWidth - 4 || py > cv.clientHeight - 4) continue; if (da.life.items.some(it => da.life.shown(it) && Math.hypot(it.x - px, it.y - py) < 40)) continue; arr.push(x.getImageData(Math.round(px * k), Math.round(py * k), 1, 1).data[3]); }
    out.sort((a, b) => a - b); return { n: out.length, outMax: out[out.length - 1], inMin: Math.min(...inn) }; });
  check('nothing outside the radar is darkened', dk.n > 6 && dk.outMax === 0 && dk.inMin > 0, JSON.stringify(dk));
  const sz = await page.evaluate(async () => { const da = window.__da; const pick = () => da.life.items.find(it => !it.hero && /^k-/.test(it.b.tone)).b.d; da.map.jumpTo({ zoom: 13 }); await new Promise(r => setTimeout(r, 500)); const far = pick(); da.map.jumpTo({ zoom: 15.6 }); await new Promise(r => setTimeout(r, 500)); const near = pick(); da.map.jumpTo({ zoom: 14.6 }); return { far, near }; });
  check('icons are half size from afar, full size close in', sz.far <= sz.near * 0.6, JSON.stringify(sz));
  await settle(page); await shot(page, '01-radar.png');
  await tab(page, 0); await sleep(600);
  const now = await page.evaluate(() => ({ open: !document.body.classList.contains('shut'), five: document.querySelectorAll('#sec-five .hero-row').length, months: document.querySelectorAll('#sec-heat .mo').length, count: (document.querySelector('.b-count b') || {}).textContent, gigs: document.querySelectorAll('#sec-gigs .gigs a').length, sentences: (document.querySelector('#view').innerText.match(/[a-z]{3,}[.!?](\s|$)/g) || []).length }));
  check('NOW: the outlook, the five, the gigs, in labels and no sentences', now.open && now.five === 5 && now.months === 12 && !!now.count && now.gigs === 2 && now.sentences === 0, JSON.stringify(now));
  const nw = await page.evaluate(() => { const band = document.querySelector('#sec-heat'); const kinds = [...band.querySelectorAll('.kinds span')]; const pics = [...document.querySelectorAll('#sec-five .h-pic')]; const five = document.querySelector('#sec-five').getBoundingClientRect();
    const deg = ['--deg0', '--deg1', '--deg2', '--deg3', '--deg4'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim().toLowerCase());
    return { bg: getComputedStyle(band).backgroundColor, kinds: kinds.length, us: band.querySelectorAll('.kinds .us use[href="#k-human"]').length, kindWords: kinds.map(k => k.textContent.trim()).join(''), pics: pics.length, picsWithMark: pics.filter(p => (p.querySelector('img') || p.querySelector('canvas')) && p.querySelector('svg use')).length, fiveH: Math.round(five.height), deg }; });
  check('the outlook runs orange to red to black on paper, over every kind of life, us among them, with no words', nw.bg !== 'rgb(11, 37, 69)' && nw.kinds === 12 && nw.us === 1 && nw.kindWords === '' && nw.deg[0] !== nw.deg[4] && nw.deg[4] === '#141412' && nw.deg[3] === '#d62e1f', JSON.stringify(nw));
  check('the five: a strip of photographs, each with its mark, in little room', nw.pics === 5 && nw.picsWithMark === 5 && nw.fiveH < 190, JSON.stringify({ pics: nw.pics, marks: nw.picsWithMark, h: nw.fiveH }));
  const mo = await page.evaluate(() => { const was = window.__da.S.mo; document.querySelectorAll('#sec-heat .mo')[4].click(); return [was, window.__da.S.mo]; });
  check('a month on the strip moves the outlook', mo[1] === 4 && mo[0] !== 4, JSON.stringify(mo));
  const hero = await page.evaluate(() => { const r = document.querySelector('#sec-five .hero-row'); return { tip: r.dataset.tip, chips: r.querySelectorAll('.chips i').length }; });
  check('each of the five carries its danger and the days until its window', hero.chips >= 2 && hero.tip.length > 10, JSON.stringify(hero));
  await shot(page, '02-now.png');
  await tab(page, 1); await sleep(600);
  const st = await page.evaluate(() => { const rows = [...document.querySelectorAll('#sec-signals .sig-row')]; return { rows: rows.length, ex: rows.filter(r => r.classList.contains('ex')).length, codes: rows.map(r => r.querySelector('b').textContent), groups: document.querySelectorAll('#sec-groups .row').length, docs: document.querySelectorAll('#sec-tools [data-doc]').length, briefsShut: !document.querySelector('#sec-briefs').open, votes: document.querySelectorAll('.vote, [data-vote]').length, signup: /sign[- ]up/i.test(document.querySelector('#view').innerText) }; });
  check('STORIES: the signals board with three examples marked EX, the groups and the tools; no votes, no sign-up', st.rows === 3 && st.ex === 3 && st.codes.includes('DA-0RNG') && st.groups === 6 && st.docs === 5 && st.briefsShut && !st.votes && !st.signup, JSON.stringify(st));
  const order = await page.evaluate(() => [...document.querySelectorAll('#view > .sec, #view > details.sec')].map(x => x.id));
  check('the signals are the board at the top; the groups sit lower, small', order[0] === 'sec-signals' && order.indexOf('sec-groups') > order.indexOf('sec-tools'), order.join(' '));
  await shot(page, '03-stories.png');
  await tap(page, '#rail .tab[data-i="1"]'); await sleep(500);
  check('the same tab closes the page again', await page.evaluate(() => document.body.classList.contains('shut')));
  await ctx.close();
} catch (e) { results.push(`FAIL  section smoke: ${e.message.split('\n')[0]}`); }

// ───────── a first visit: the radar starts where most kinds of animals were seen lately ─────────
if (run('first')) try {
  const ctx = await newCtx(); await wire(ctx, { first: true }); const page = await ctx.newPage(); watch(page, 'first');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page); await sleep(800);
  const f = await page.evaluate(() => { const da = window.__da; const C = da.CONFIG.SCAN; const kinds = (lat, lng) => new Set(da.S.obs.filter(o => !o.ob && !o.hum && !da.isCold(o) && !['Plantae', 'Fungi'].includes((o.tx || {}).ic) && da.haversine(lat, lng, o.lat, o.lng) <= da.S.scan.r).map(o => o.tx.id || o.tx.n)).size;
    return { found: JSON.parse(localStorage.getItem('da.prefs') || '{}').found === true, moved: Math.round(da.haversine(C.lat, C.lng, da.S.scan.lat, da.S.scan.lng)), within: da.haversine(C.lat, C.lng, da.S.scan.lat, da.S.scan.lng) <= C.find + 1, at: kinds(da.S.scan.lat, da.S.scan.lng), start: kinds(C.lat, C.lng) }; });
  check('on a first visit the radar moves, once, to where more kinds of animals were seen lately, close by', f.found && f.within && f.at >= f.start, JSON.stringify(f));
  await ctx.close();
} catch (e) { results.push(`FAIL  section first: ${e.message.split('\n')[0]}`); }

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
  await page.mouse.click(ix, iy); await sleep(500);
  await page.mouse.click(ix, iy); await sleep(900);
  check('a tap inside offers a new record, and a second tap starts it', await page.evaluate(() => window.__da.S.mode) === 'place');
  await tap(page, '#r-back'); await sleep(500);
  check('back from placing returns to the bare radar', await page.evaluate(() => !window.__da.S.mode && document.body.classList.contains('shut')));
  const rid = await page.evaluate(() => { const da = window.__da; da.life.reveal(); const r = da.map.getContainer().getBoundingClientRect(); const it = da.life.items.find(i => i.inS && da.life.shown(i) && !i.binned && typeof i.o.id === 'number' && !i.o.hum && i.x > 60 && i.y > 60 && i.x < r.width - 60 && i.y < r.height - 60 && (() => { const h = da.life.hit(i.x, i.y); return h && h.kind === 'cell' && h.id === i.o.id; })()); return it && it.o.id; });
  const [rx, ry] = await xy(page, rid); await page.mouse.click(rx, ry, { button: 'right' }); await sleep(1200);
  check('a right-click on a life opens it', await page.evaluate(id => window.__da.S.mode === 'ping' && window.__da.S.sel === id, rid));
  await page.keyboard.press('Escape'); await sleep(600);
  await page.reload(); await ready(page); await sleep(500);
  const s4 = await page.evaluate(() => ({ ...window.__da.S.scan }));
  check('after a reload the radar is where it was left', Math.abs(s4.lat - s3.lat) < 0.0002 && s4.r === 250, JSON.stringify(s4));
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
    const it = da.life.items.find(i => i.o.id !== o.id && da.life.shown(i) && !i.o.hist && !i.o.ob && !da.isCold(i.o) && !i.binned && da.haversine(o.lat, o.lng, i.lat, i.lng) > R + 40 && da.haversine(o.lat, o.lng, i.lat, i.lng) < 1400 && i.x > 50 && i.y > 50 && i.x < r.width - 480 && i.y < r.height - 50 && (() => { const h = da.life.hit(i.x, i.y); return h && h.kind === 'cell' && h.id === i.o.id; })());
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
  await tab(page, 0); await sleep(600);
  const cons = await page.evaluate(() => [...document.querySelectorAll('#sec-cons li.con')].map(li => ({ name: li.querySelector('.nm b').textContent, chart: !!li.querySelector('.con-chart svg path'), play: !!li.querySelector('[data-con-play]'), trace: !!li.querySelector('[data-con-trace]') })));
  check('NOW lists the constellations as they form, each with its chart, its song and its story', cons.length >= 1 && cons[0].name === 'Side gate web' && cons[0].chart && cons[0].play && cons[0].trace, JSON.stringify(cons));
  await shot(page, '13-now-cons.png');
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
const fillAndIssue = async page => {
  for (const k of ['w', 'i', 's', 'h']) await page.fill('#w-' + k, `A line for ${k}`);
  await tap(page, '#r-act'); await page.waitForFunction(() => window.__da.face() === 'signal', null, { timeout: 15000 }); await sleep(600);
};
/* each knot looked at, then tied */
const tieNodes = async (page, keys) => { for (const k of keys) { await clickNode(page, k); await clickNode(page, k); } };

// ───────── the slip: its photograph and statement changeable, four blank lines, chosen before it is issued ─────────
if (run('wish')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'wish');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
  await openNear(page);
  const btn = await page.evaluate(() => { const b = document.querySelector('#r-act'); return { label: b.querySelector('.hw').textContent, go: b.classList.contains('go'), bg: getComputedStyle(b).backgroundColor }; });
  check('the main button is NOTICED, in orange', btn.label === 'NOTICED' && btn.go && btn.bg === 'rgb(255, 122, 0)', JSON.stringify(btn));
  const ks = await page.evaluate(() => [...window.__da.strings.nodes.values()].filter(n => n.t === 'biz').slice(0, 3).map(n => n.key));
  await tieNodes(page, ks);
  const mini = await page.evaluate(() => { const c = document.querySelector('#st-print'); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let ink = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 100) ink++; return { w: c.width, h: c.height, ink }; });
  check('the card shows the print the figure will make, small', mini && mini.ink > 200, JSON.stringify(mini));
  const NOTE = 'A bowl of water by the side gate';
  await page.fill('#r-note', NOTE); await sleep(400);
  const nt = await page.evaluate(() => { const n = document.querySelector('#r-note'); return { last: document.querySelector('#r-front').lastElementChild === n, shown: !n.hidden && n.getBoundingClientRect().height > 30, kept: JSON.parse(localStorage.getItem('da.notes.v1') || '{}') }; });
  check('notes sit just above NOTICED, kept on this device', nt.last && nt.shown && Object.values(nt.kept).includes(NOTE), JSON.stringify(nt));
  await tap(page, '#r-act'); await sleep(1400);
  const w0 = await page.evaluate(() => ({ face: window.__da.face(), main: document.querySelector('#r-act .hw').textContent, values: ['w', 'i', 's', 'h'].map(k => document.querySelector('#w-' + k).value), max: ['w', 'i', 's', 'h'].map(k => document.querySelector('#w-' + k).maxLength), ph: ['w', 'i', 's', 'h'].map(k => document.querySelector('#w-' + k).placeholder), letters: document.querySelectorAll('#w-slip .sl-wish label, #w-slip .sl-wish b').length, sug: document.querySelectorAll('#w-sug, [data-s], select').length, life: document.querySelector('#w-slip .sl-life b').textContent, site: document.querySelector('#w-slip .sl-meta dd').textContent, code: document.querySelector('#w-slip .sl-code').textContent }));
  check('it turns over to a blank slip: four empty lines of 48, each saying what it is for; RESPONSE issues it', w0.face === 'wish' && w0.main === 'RESPONSE' && w0.values.every(v => v === '') && w0.max.every(m => m === 48) && /^What we know/.test(w0.ph[0]) && /^It would be great/.test(w0.ph[1]) && /^So let's create/.test(w0.ph[2]) && /^Here is how it works/.test(w0.ph[3]) && !w0.letters && !w0.sug && w0.life.length > 5 && /-37\.\d{4} 144\.\d{4}/.test(w0.site) && w0.code === 'DA-····', JSON.stringify(w0));
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
  await page.fill('#w-h', ''); await page.type('#w-h', 'x'.repeat(60));
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
  await page.evaluate(() => window.__da.closeRecord()); await page.evaluate(() => window.__da.setView(1)); await sleep(500);
  const top = await page.evaluate(() => { const r = document.querySelector('#sec-signals .sig-row'); return { code: r.querySelector('b').textContent, ex: r.classList.contains('ex'), count: document.querySelector('#sec-signals .lab').textContent }; });
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
  await tap(page, '#r-act'); await sleep(800); await fillAndIssue(page);
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
  await page.emulateMedia({ media: 'print' }); const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true }); await page.emulateMedia({ media: 'screen' }); fs.writeFileSync(`${SHOTS}/slip.pdf`, pdf);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length; const box = (pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/) || []).slice(1).map(Number);
  check('the slip prints as one strip, 58 mm wide', pages === 1 && Math.abs(box[0] - 164.4) < 3, `${pages} page · ${box.join('×')} pt`);
  await page.evaluate(() => window.__da.printBlank()); await page.waitForFunction(() => window.__printed >= 2, null, { timeout: 15000 });
  check('a blank slip prints for filling in by hand', await page.evaluate(() => /DA-____/.test(window.__lastSlip.text)));
  const csv = fs.readFileSync(await (async () => { await page.evaluate(() => { window.__da.closeRecord(); window.__da.setView(1); }); await sleep(500); return dl('#sec-tools [data-doc="signals"]'); })(), 'utf8');
  check('the signals download as a table', csv.split('\n').length === 5 && csv.startsWith('code,issued') && csv.includes(code), `${csv.split('\n').length} rows`);
  await ctx.close();
} catch (e) { results.push(`FAIL  section outputs: ${e.message.split('\n')[0]}`); }

// ───────── the board: examples, remix, receiving, removing ─────────
if (run('board')) try {
  const ctx = await newCtx(); await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://oan.test' }); await wire(ctx); const page = await ctx.newPage(); watch(page, 'board');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
  await tab(page, 1); await sleep(400);
  await page.click('#sec-signals .sig-row[data-sig="ex:DA-0RNG"]'); await sleep(2200);
  const ex = await page.evaluate(() => { const da = window.__da; const c = da.map.getCenter(); const s = da.S.signals.find(x => x.code === 'DA-0RNG'); return { mode: da.S.mode, sel: da.S.sel, face: da.face(), no: document.querySelector('#r-no').textContent, near: Math.hypot(c.lat - s.pin.lat, c.lng - s.pin.lng) < 0.01, knots: document.querySelectorAll('#s-slip .sl-knots li').length, live: [...da.strings.nodes.keys()].filter(k => k.startsWith('s:DA-0RNG:')).length, marks: da.life.items.filter(i => i.o.code === 'DA-0RNG').length, acts: [...document.querySelectorAll('#s-acts [data-sa]')].map(b => b.dataset.sa).join(' ') }; });
  check('an example opens as one cell, open and live, its slip turned up, marked EX and not removable', ex.mode === 'ping' && ex.sel === 'sp:DA-0RNG' && ex.face === 'signal' && /EX/.test(ex.no) && ex.near && ex.knots === 3 && ex.live === 3 && ex.marks === 1 && ex.acts === 'remix pin', JSON.stringify(ex));
  await settle(page); await clickNode(page, 's:DA-0RNG:a');
  const lk = await page.evaluate(() => ({ peeked: window.__da.strings.peeked, card: !document.querySelector('#peek').hidden }));
  check('its knots can be looked at, like any other', lk.peeked === 's:DA-0RNG:a' && lk.card, JSON.stringify(lk));
  await shot(page, '30-example.png');
  await tap(page, '#s-acts [data-sa="remix"]'); await sleep(1800);
  const rm = await page.evaluate(() => { const da = window.__da; return { sel: da.S.sel, face: da.face(), lines: ['w', 'i', 's', 'h'].map(k => document.querySelector('#w-' + k).value), fig: da.strings.fig.e.length }; });
  check('REMIX opens the slip on the same life with its lines and its figure', rm.sel === 'sp:DA-0RNG' && rm.face === 'wish' && rm.lines.every(Boolean) && rm.fig === 3, JSON.stringify(rm));
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setView(1); }); await sleep(400);
  await tap(page, '#rx-open'); await page.fill('#rx-t', 'DA-TST1 BOGONG MOTH\n-37.7700,144.9600\nW Moths fell 99.5% in three years\nI Dark streets\nS Dark is a habitat.\nH Lights off at close'); await tap(page, '#rx button[type="submit"]'); await sleep(1500);
  const rx = await page.evaluate(() => { const da = window.__da; const s = da.S.signals.find(x => x.code === 'DA-TST1'); return { have: !!s, recv: s && s.recv, mode: da.S.mode, h: s && s.lines.h }; });
  check('RECEIVE takes a mesh message pasted in', rx.have && rx.recv && rx.mode === 'ping' && rx.h === 'Lights off at close', JSON.stringify(rx));
  await page.evaluate(() => window.__da.receive('DA-TST2 GREY-HEADED FLYING-FOX\n-37.7800,144.9500\nCamps cook above 42 degrees\nShade before the heat\nWater is a habitat\nHose the trees at noon')); await sleep(900);
  const rx2 = await page.evaluate(() => { const s = window.__da.S.signals.find(x => x.code === 'DA-TST2'); return s && s.lines; });
  check('and one without letters, line by line', rx2 && rx2.w === 'Camps cook above 42 degrees' && rx2.h === 'Hose the trees at noon', JSON.stringify(rx2));
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setView(1); }); await sleep(400);
  await tap(page, '#rx-open'); await page.fill('#rx-t', ' da-0rng '); await tap(page, '#rx button[type="submit"]'); await sleep(1200);
  const rc = await page.evaluate(() => ({ code: window.__da.S.issued && window.__da.S.issued.code, face: window.__da.face(), mode: window.__da.S.mode }));
  await page.evaluate(() => window.__da.receive('DA-ZZZZ')); await sleep(600);
  const nf = await page.evaluate(() => document.querySelector('#toast').textContent);
  check('RECEIVE takes the code printed on a slip, as it is typed, and says when there is none', rc.code === 'DA-0RNG' && rc.face === 'signal' && rc.mode === 'ping' && /DA-ZZZZ · NOT FOUND/.test(nf), JSON.stringify({ rc, nf }));
  const n0 = await page.evaluate(() => window.__da.S.signals.length);
  const packed = await page.evaluate(() => window.__da.linkOf(window.__da.S.signals.find(x => x.code === 'DA-GHFF')) || '#x=' + window.__da.packSignal(window.__da.S.signals.find(x => x.code === 'DA-GHFF')));
  await page.evaluate(t => window.__da.receive(t), packed); await sleep(900);
  check('a signal already here opens, and is not added twice', await page.evaluate(n => window.__da.S.signals.length === n && window.__da.S.signals.find(x => x.key === window.__da.S.sig).code === 'DA-GHFF', n0));
  await page.evaluate(() => window.__da.receive('hello')); await sleep(300);
  check('anything else is turned away', await page.evaluate(() => document.querySelector('#toast').textContent) === 'NOT A SIGNAL');
  await page.evaluate(() => { const s = window.__da.S.signals.find(x => x.code === 'DA-TST1'); window.__da.openSignal(s.key); }); await sleep(800);
  await tap(page, '#s-acts [data-sa="remove"]'); await sleep(700);
  check('REMOVE takes a received signal off the board', await page.evaluate(() => !window.__da.S.signals.some(x => x.code === 'DA-TST1')));
  await ctx.close();
} catch (e) { results.push(`FAIL  section board: ${e.message.split('\n')[0]}`); }

// ───────── sharing: NOTICED, RESPONSE with nothing written, DIRECT ACTION to a partner; approval; the board; RECEIVE by code ─────────
if (run('share')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'share');
  await page.goto('https://oan.test/index.html'); await ready(page); await settle(page);
  await openNear(page);
  await tap(page, '#r-act'); await sleep(1200);
  const w = await page.evaluate(() => ({ face: window.__da.face(), main: document.querySelector('#r-act .hw').textContent }));
  await tap(page, '#r-act'); await page.waitForFunction(() => window.__da.face() === 'signal', null, { timeout: 15000 }); await sleep(700);
  const s0 = await page.evaluate(() => { const da = window.__da; const s = da.S.issued; return { code: s.code, lines: Object.values(s.lines).filter(Boolean).length, poem: !!document.querySelector('#s-slip .sl-wish'), main: document.querySelector('#r-act .hw').textContent, mesh: da.meshText(s), pager: da.pagerText(s) }; });
  check('three steps, three words: NOTICED, RESPONSE, DIRECT ACTION; RESPONSE issues a slip with nothing written', w.face === 'wish' && w.main === 'RESPONSE' && s0.lines === 0 && !s0.poem && s0.main === 'DIRECT ACTION' && !/\n\n|\n$/.test(s0.mesh) && s0.pager.startsWith(s0.code), JSON.stringify({ w, s0 }));
  const bin = await page.evaluate(async () => { const da = window.__da; const b58 = await da.escpos(da.S.issued, '58'), b80 = await da.escpos(da.S.issued, '80'); const has = (b, w) => { for (let i = 0; i < b.length - 6; i++) if (b[i] === 0x1D && b[i + 1] === 0x76 && b[i + 2] === 0x30 && b[i + 4] === w) return true; return false; }; const txt = String.fromCharCode(...b80.slice(0, 4000)); return { w58: has(b58, 48), w80: has(b80, 64), fig: /FIG\.|NORTH UP/.test(String.fromCharCode(...b58)) }; });
  check('ESC/POS for 58 mm and for 80 mm paper, with no FIG. or NORTH UP', bin.w58 && bin.w80 && !bin.fig, JSON.stringify(bin));
  await tap(page, '#r-act'); await sleep(900);
  const dl = await page.evaluate(() => [...document.querySelectorAll('#s-send [data-dest]')].map(b => ({ d: b.dataset.dest, t: b.querySelector('b').textContent })));
  check('DIRECT ACTION lists the partner places that print, and the board', dl.length === 4 && ['pickles', 'kines', 'elsie', ''].every(d => dl.some(x => x.d === d)) && dl.some(x => /Pickles Milk Bar/.test(x.t)), JSON.stringify(dl));
  await page.click('#s-send [data-dest="pickles"]'); await page.waitForFunction(() => /WAITING FOR APPROVAL/.test(document.querySelector('#s-status').textContent), null, { timeout: 20000 });
  const st0 = await page.evaluate(() => document.querySelector('#s-status').textContent);
  const waiting = await admin('stories?status=waiting'); const mine = waiting.stories.find(x => x.code === s0.code);
  check('sent to Pickles: it waits for approval, its print with it, and says so', /PICKLES MILK BAR/.test(st0) && mine && mine.dest === 'pickles' && mine.job === 'held', JSON.stringify({ st0, mine: mine && { code: mine.code, dest: mine.dest, job: mine.job } }));
  await admin(`stories/${mine.id}`, { action: 'show' });
  await page.evaluate(() => window.__da.checkSent()); await sleep(900);
  const st1 = await page.evaluate(() => document.querySelector('#s-status').textContent);
  check('approved: the sender sees it join the printer queue', /IN THE QUEUE/.test(st1) && /PICKLES/.test(st1), st1);
  /* another device: the board shows it to everyone */
  const ctx2 = await newCtx(); await wire(ctx2); const p2 = await ctx2.newPage(); watch(p2, 'share-2');
  await p2.goto('https://oan.test/index.html'); await ready(p2); await sleep(1500); await tab(p2, 1); await sleep(600);
  const b2 = await p2.evaluate(code => { const r = [...document.querySelectorAll('#sec-signals .sig-row')].find(x => x.querySelector('b').textContent === code); return { row: !!r, sh: !!r && r.classList.contains('sh'), st: r ? (r.querySelector('.st') || {}).textContent : '' }; }, s0.code);
  check('on another device it stands on the board, for everyone', b2.row && b2.sh && /SHOWN/.test(b2.st), JSON.stringify(b2));
  await ctx2.close();
  /* a third device, from the code printed on the slip */
  const ctx3 = await newCtx(); await wire(ctx3); const p3 = await ctx3.newPage(); watch(p3, 'share-3');
  await p3.goto('https://oan.test/index.html'); await ready(p3); await p3.evaluate(() => localStorage.removeItem('da.shared.v1')); await tab(p3, 1); await sleep(400);
  await tap(p3, '#rx-open'); await p3.fill('#rx-t', s0.code.toLowerCase()); await tap(p3, '#rx button[type="submit"]'); await sleep(1600);
  const r3 = await p3.evaluate(() => ({ code: window.__da.S.issued && window.__da.S.issued.code, face: window.__da.face(), mode: window.__da.S.mode }));
  check('RECEIVE: the code printed on the slip brings the story up on any device', r3.code === s0.code && r3.face === 'signal' && r3.mode === 'ping', JSON.stringify(r3));
  await ctx3.close();
  /* the printer at Pickles: always on the map, its own card */
  await page.evaluate(() => { const da = window.__da; da.closeRecord(); da.life.moveScan(-37.758, 144.952, false); }); await sleep(500);
  const pk = await page.evaluate(() => { const da = window.__da; const p = da.PARTNERS.find(x => x.id === 'pickles'); da.map.jumpTo({ center: [p.lng, p.lat], zoom: 15.2 }); return { lat: p.lat, lng: p.lng }; }); await settle(page); await sleep(500);
  const pxy = await page.evaluate(({ lat, lng }) => { const da = window.__da; const q = da.map.project([lng, lat]); const r = da.map.getContainer().getBoundingClientRect(); return { x: q.x + r.left, y: q.y + r.top, hit: (da.life.hit(q.x, q.y) || {}).kind, inScan: da.life.inScan(lat, lng) }; }, pk);
  await page.mouse.click(pxy.x, pxy.y); await sleep(1400);
  const pc = await page.evaluate(() => ({ mode: window.__da.S.mode, name: document.querySelector('#r-name').textContent, no: document.querySelector('#r-no').textContent, main: document.querySelector('#r-act .hw').textContent, chips: document.querySelector('#r-chips').textContent, sent: document.querySelectorAll('#r-strings [data-sig]').length }));
  check('Pickles Milk Bar: its printer on the map, outside the radar too, opening its card', !pxy.inScan && pxy.hit === 'partner' && pc.mode === 'partner' && pc.name === 'Pickles Milk Bar' && /PRINTER/.test(pc.no) && pc.main === 'VISIT' && /80 MM/.test(pc.chips) && pc.sent >= 1, JSON.stringify({ pxy, pc }));
  await shot(page, '35-partner.png');
  /* a record placed here, shared */
  await page.evaluate(() => { const da = window.__da; da.closeRecord(); da.startPlace({ lat: -37.7712, lng: 144.9611 }); }); await sleep(700);
  await page.fill('#pl-text', 'a magpie nesting low'); await page.fill('#pl-contact', '0400 000 000'); await tap(page, '#r-act'); await sleep(1500);
  await tap(page, '#r-do [data-do="share"]'); await sleep(1500);
  const rs = await page.evaluate(() => (document.querySelector('#r-do .share small') || {}).textContent);
  const recs = (await admin('stories?status=waiting')).stories.filter(x => x.kind === 'record');
  check('a record placed here is shared for approval, without its contact', /WAITING FOR APPROVAL/.test(rs) && recs.length === 1 && /magpie/.test(recs[0].body) && !/0400/.test(recs[0].body), JSON.stringify({ rs, recs: recs.map(r => r.body) }));
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
  const fl = await page.evaluate(() => { const da = window.__da; const it = da.life.items.find(i => i.o.user && i.o.kind === 'injured'); return { flag: it.flag, inS: it.inS, shown: da.life.shown(it) }; });
  check('an animal hurt stays shown when the radar moves away', fl.flag && !fl.inS && fl.shown, JSON.stringify(fl));
  await tab(page, 0); await sleep(400);
  check('NOW lists it, with the call one touch away', await page.evaluate(() => !!document.querySelector('#sec-alarms li.injured a[href^="tel:"]')));
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
  const tagOf = () => page.evaluate(() => ({ tag: !document.querySelector('#tag').hidden, hide: !!document.querySelector('#tag .hide') }));
  let tg = await tagOf(); if (!tg.tag) { await page.mouse.move(x + 40, y + 40); await settle(page); await sleep(300); const [x2, y2] = await xy(page, it); await page.mouse.move(x2, y2, { steps: 4 }); await sleep(800); tg = await tagOf(); }
  check('every cell under the pointer has a small hide button', tg.tag && tg.hide, JSON.stringify(tg));
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
  await tap(page, '#five-r [data-pick]'); await sleep(1600);
  const f1 = await page.evaluate(() => { const o = window.__da.S.byId.get(window.__da.S.sel) || {}; return { name: document.querySelector('#r-name').textContent, slot: o.slot, hero: !!o.hero, five: window.__da.S.heroes.length, stored: (JSON.parse(localStorage.getItem('da.five.v1') || '[]')[0] || {}).cn }; });
  check('CHANGE swaps one of the five for any life', f1.name === pick && f1.slot === 0 && f1.hero && f1.five === 5 && f1.stored === pick, JSON.stringify({ pick, ...f1 }));
  await tap(page, '#r-chips [data-five]'); await sleep(300); await page.fill('#five-q', 'Night garden visitor'); await sleep(500);
  const ownRow = await page.evaluate(() => [...document.querySelectorAll('#five-r .nrow')].map(b => b.textContent).find(t => /YOUR OWN/.test(t)) || '');
  check('or for one of your own', /Night garden visitor/i.test(ownRow), ownRow);
  await tap(page, '#r-five [data-five-reset]'); await sleep(1600);
  const f2 = await page.evaluate(() => ({ name: document.querySelector('#r-name').textContent, stored: (JSON.parse(localStorage.getItem('da.five.v1') || '[]')[0]) || null }));
  check('RESET brings the first back', f2.name === hf.name && !f2.stored, JSON.stringify(f2));
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setOpen(true); window.__da.setView(1); }); await sleep(700);
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
  await page.evaluate(() => { window.__da.closeRecord(); window.__da.setView(1); }); await sleep(400);
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
  await shot(page, 'p01-radar.png');
  await page.tap('#rail .tab[data-i="0"]'); await sleep(700);
  const s = await page.evaluate(() => { const p = document.querySelector('#panel').getBoundingClientRect(); return { top: Math.round(p.top), h: Math.round(p.height), over: document.documentElement.scrollWidth - innerWidth }; });
  check('NOW comes up as a sheet over the lower half', s.top > 300 && s.top < 420 && s.over <= 0, JSON.stringify(s));
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
  await page.tap('#r-act'); await sleep(900);
  const w = await page.evaluate(() => { const s = document.querySelector('#w-slip').getBoundingClientRect(); return { face: window.__da.face(), left: s.left, right: s.right, over: document.documentElement.scrollWidth - innerWidth }; });
  check('the slip fits the phone', w.face === 'wish' && w.left >= 0 && w.right <= 390 && w.over <= 0, JSON.stringify(w));
  await shot(page, 'p04-wish.png');
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
  check('on a mild day they stay away', await p2.evaluate(() => window.__da.S.sensors.length === 0 && window.__da.S.fountains.length === 0));
  await ctx2.close();
} catch (e) { results.push(`FAIL  section hot: ${e.message.split('\n')[0]}`); }

// ───────── no signal: the radar, the five and the examples still stand ─────────
if (run('offline')) try {
  const ctx = await newCtx(); await wire(ctx, { inat: false, ens: false, comOK: false }); const page = await ctx.newPage(); watch(page, 'offline');
  await page.goto('https://oan.test/index.html');
  await page.waitForFunction(() => window.__da && window.__da.S.mapReady && document.body.classList.contains('nosignal'), null, { timeout: 60000 });
  await sleep(800); await tab(page, 1); await sleep(400);
  const off = await page.evaluate(() => ({ items: window.__da.life.items.length, five: window.__da.S.heroes.length, sigs: document.querySelectorAll('#sec-signals .sig-row').length }));
  check('without a signal the five and the example signals still stand', off.five === 5 && off.items >= 5 && off.sigs === 3, JSON.stringify(off));
  await ctx.close();
} catch (e) { results.push(`FAIL  section offline: ${e.message.split('\n')[0]}`); }

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
  const ev = await page.evaluate(() => { const S = window.__da.S; const e = S.community.filter(o => String(o.id).startsWith('e:')); const rows = [...document.querySelectorAll('#sec-gigs ol li')]; const r = rows.find(li => /Late set for the bats/.test(li.textContent)); return { n: e.length, title: e[0] && e[0].title, hug: !!(r && r.querySelector('.gig use[href="#g-hug"]')), first: rows[0] && /Late set/.test(rows[0].textContent) }; });
  check('a published sheet of gatherings joins NOW, gigs first with a hug', ev.n === 2 && ev.title === 'Frog count, Merri Creek' && ev.hug && ev.first, JSON.stringify(ev));
  await page.evaluate(() => { location.hash = 'E01'; }); await sleep(900);
  check('#E01 opens the gathering', await page.evaluate(() => window.__da.S.sel) === 'e:1');
  await ctx.close();
} catch (e) { results.push(`FAIL  section events: ${e.message.split('\n')[0]}`); }

// ───────── the guide ─────────
if (run('guide')) try {
  const ctx = await newCtx(); await wire(ctx); const page = await ctx.newPage(); watch(page, 'guide');
  await page.goto('https://oan.test/guide.html'); await sleep(1400);
  const g = await page.evaluate(() => { const n = s => document.querySelectorAll(s).length; return { key: n('#key li'), kc: n('#kind-colours li'), radar: n('#radar-steps li'), strings: n('#string-steps li'), sounds: n('#snd-lives li') + n('#snd-people li'), refs: n('#outs a[href^="https"]'), wish: n('#wish-slip ol li'), five: n('#five-steps li'), outs: n('#outs li'), degs: n('#degs li'), wins: n('#wins li'), heroes: n('#heroes li'), on: n('#roles-on li'), back: n('#roles-back li'), groups: n('#group-list li'), calls: n('#calls li'), words: document.body.innerText.split(/\s+/).length, sentences: (document.body.innerText.match(/[a-z]{3,}\.(\s|$)/g) || []).length, overflow: document.documentElement.scrollWidth - innerWidth }; });
  check('the guide is a key: the radar, the icons, the strings, the lines, the outputs, the danger, the places, the groups', g.key === 21 && g.kc === 8 && g.radar === 8 && g.strings === 22 && g.sounds === 15 && g.wish === 4 && g.five === 2 && g.outs === 8 && g.refs === 7 && g.degs === 5 && g.wins === 4 && g.heroes === 5 && g.on === 10 && g.back === 14 && g.groups === 6 && g.calls === 9 && g.overflow <= 0, JSON.stringify(g));
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
  await page.evaluate(() => window.__da.setView(1)); await sleep(1500); await shot(page, `${P}l03-stories.png`);
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
