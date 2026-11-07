// The Worker's own checks: stories sent, held for approval, shown; print jobs held, queued, pulled and reported; the limits.
// Runs the Worker locally with a fresh database (wrangler's test harness). `npm run build` first, for src/worker/stamp.js.
import { createTestHarness } from 'wrangler';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = 'test-admin-key-not-a-real-one';
const results = []; const check = (name, cond, info = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`);
const server = createTestHarness({ root: ROOT, workers: [{ configPath: './wrangler.jsonc', secrets: { ADMIN_KEY: KEY } }] });
const { url } = await server.listen(); const O = url.origin;
const call = async (p, { method = 'GET', body, key, token, origin = O, raw, ip } = {}) => {
  const headers = { origin }; if (ip) headers['cf-connecting-ip'] = ip; if (body !== undefined) headers['content-type'] = 'application/json'; if (key) headers.authorization = `Bearer ${key}`; if (token) headers.authorization = `Bearer ${token}`;
  const r = await server.fetch(new URL(p, O), { method, headers, body: raw != null ? raw : body !== undefined ? JSON.stringify(body) : undefined });
  const t = r.headers.get('content-type') || ''; return { status: r.status, type: t, island: r.headers.get('x-island'), json: /json/.test(t) ? await r.json() : null, text: /text/.test(t) ? await r.text() : null, bin: /image/.test(t) ? Buffer.from(await r.arrayBuffer()) : null };
};
const SIG = Buffer.from(JSON.stringify({ c: 'DA-7K2Q', t: 'hs0d7', p: [-37.77, 144.96, 'bird', 'Noisy Miner', 'Manorina melanocephala', 'BRUNSWICK', 0], l: ['A line', '', '', ''], k: [], e: [] })).toString('base64url');
const JPEG_B = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xFF, 0xD9]), JPEG = 'data:image/jpeg;base64,' + JPEG_B.toString('base64');
const story = (code, extra = {}) => ({ kind: 'story', code, body: SIG, lat: -37.77, lng: 144.96, ...extra });

try {
  /* what is made is a draft until the approval page shows it on the site: these checks show it */
  { const st0 = await call('/api/settings'); check('what people make starts hidden from visitors, the example shown', st0.json.madeShow === false && st0.json.exampleShow === true, JSON.stringify(st0.json)); await call('/api/admin/settings', { method: 'POST', key: KEY, body: { madeShow: true } }); }
  const h = await call('/api/health');
  check('health answers ok with the build', h.status === 200 && /^ok \w+/.test(h.text), h.text);
  const pa = await call('/api/partners');
  check('every partner place has a print queue, none paired yet', pa.status === 200 && ['pickles', 'kines', 'elsie'].every(id => pa.json.partners.some(p => p.id === id && !p.paired && !p.ready)), JSON.stringify(pa.json));
  check('novel.global has its own print queue too', pa.json.partners.some(p => p.id === 'novelglobal'), JSON.stringify(pa.json.partners.map(p => p.id)));
  /* stage 5: a place suggested waits; shown on the approval page it is listed for everyone, changed, and deleted */
  const pg = await call('/api/places', { method: 'POST', body: { n: 'Test Repair Cafe', what: 'Fixes things', url: 'https://example.org/', lat: -37.77, lng: 144.97, cat: 'circular' }, ip: '10.9.9.9' });
  const pBad = await call('/api/places', { method: 'POST', body: { n: '', lat: 900, lng: 0 }, ip: '10.9.9.9' });
  const pl0 = await call('/api/places'), pw = await call('/api/admin/places?status=waiting', { key: KEY });
  await call(`/api/admin/places/${pg.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } }); const pl1 = await call('/api/places');
  await call(`/api/admin/places/${pg.json.id}`, { method: 'POST', key: KEY, body: { action: 'edit', n: 'Test Repair Café', lat: -37.771, lng: 144.971, cat: 'circular' } }); const pl2 = await call('/api/places');
  const pAdd = await call('/api/admin/places', { method: 'POST', key: KEY, body: { n: 'Added Here', lat: -37.76, lng: 144.96 } }), pNo = await call('/api/admin/places?status=waiting', { ip: '10.8.8.8' });
  await call(`/api/admin/places/${pg.json.id}`, { method: 'POST', key: KEY, body: { action: 'delete' } }); const pl3 = await call('/api/places');
  check('a place suggested waits, then is listed once shown, changed, added and deleted on the approval page', pg.status === 201 && pBad.status === 400 && !pl0.json.places.some(p => p.id === pg.json.id) && pw.json.places.some(p => p.id === pg.json.id)
    && pl1.json.places.some(p => p.id === pg.json.id) && pl2.json.places.some(p => p.n === 'Test Repair Café') && pAdd.status === 201 && pNo.status === 401 && !pl3.json.places.some(p => p.id === pg.json.id) && pl3.json.places.some(p => p.n === 'Added Here'),
    JSON.stringify([pg.status, pBad.status, pl1.json.places.length, pl3.json.places.map(p => p.n)]));
  /* stage 4: iNaturalist and OpenStreetMap through novel.global, and nothing else through it */
  const ia = await call('/api/inat/users/1'), ib = await call('/api/inat/observations/x'), ic = await call('/api/inat/../admin/stories');
  check('iNaturalist through novel.global: only the routes the site uses', ia.status === 400 && ib.status === 400 && ic.status !== 200, JSON.stringify([ia.status, ib.status, ic.status]));
  const oa = await call('/api/osm?q=shops&bb=-37.78,144.96,-37.77,144.97'), ob = await call('/api/osm?q=places&bb=-37.785,144.96,-37.77,144.97'), oc = await call('/api/osm?q=places&bb=-37.9,144.9,-37.7,145.1'),
    od = await call('/api/osm?q=water&bb=-37.8,144.95,-37.7,145.05'), oe = await call('/api/osm?q=places&bb=-37.77,144.96,-37.78,144.97'), of = await call('/api/osm?q=places&bb=1,2,3');
  check('OpenStreetMap through novel.global: only places or water, in whole tiles, a few at a time', [oa, ob, oc, od, oe, of].every(r => r.status === 400), JSON.stringify([oa, ob, oc, od, oe, of].map(r => r.status)));
  const im1 = await call('/api/img?u=' + encodeURIComponent('https://example.org/photos/1/medium.jpg')), im2 = await call('/api/img?u=' + encodeURIComponent('http://static.inaturalist.org/photos/1/medium.jpg')), im3 = await call('/api/img?u=' + encodeURIComponent('https://static.inaturalist.org/sounds/1.mp3'));
  check('photographs pass through from iNaturalist only', im1.status === 400 && im2.status === 400 && im3.status === 400, `${im1.status} ${im2.status} ${im3.status}`);

  /* a story sent to Pickles: it waits, and so does its print */
  const s1 = await call('/api/stories', { method: 'POST', body: story('DA-7K2Q', { dest: 'pickles', escpos: Buffer.from([0x1B, 0x40, 65, 10]).toString('base64'), mesh: 'DA-7K2Q NOISY MINER', photo: JPEG }) });
  check('a story sent waits for approval, and its print waits with it', s1.status === 201 && s1.json.status === 'waiting' && s1.json.job && s1.json.job.status === 'held', JSON.stringify(s1.json));
  const pub0 = await call('/api/stories'); const one0 = await call('/api/stories/DA-7K2Q'); const ph0 = await call(`/api/photos/${s1.json.id}`);
  check('until it is approved nobody else sees it, nor its photograph', pub0.json.stories.length === 0 && one0.status === 404 && ph0.status === 404, `${pub0.json.stories.length} · ${one0.status} · ${ph0.status}`);
  const r0 = await call(`/api/receipts/${s1.json.id}`);
  check('the sender can see where it is', r0.status === 200 && r0.json.status === 'waiting' && r0.json.job.status === 'held', JSON.stringify(r0.json));

  /* the approval page */
  const a0 = await call('/api/admin/stories'); const a1 = await call('/api/admin/stories', { key: 'wrong' });
  check('the approval page refuses anyone without the password', a0.status === 401 && a1.status === 401, `${a0.status} · ${a1.status}`);
  const a2 = await call('/api/admin/stories?status=waiting', { key: KEY });
  check('with it, everything waiting is listed', a2.status === 200 && a2.json.stories.some(s => s.id === s1.json.id && s.photo && s.dest === 'pickles' && s.job === 'held'), JSON.stringify(a2.json.stories.map(s => s.code)));
  const tok = await call('/api/admin/printers/pickles', { method: 'POST', key: KEY, body: { action: 'token' } });
  check('a printer token is made once, on the approval page', tok.status === 200 && /^[a-z2-9]{32}$/.test(tok.json.token), JSON.stringify(tok.json));
  const T = tok.json.token;
  const n0 = await call('/api/printers/pickles/next', { token: T }); const nx = await call('/api/printers/pickles/next', { token: 'nope' });
  check('a held print is not given to the printer; a wrong token gets nothing', n0.status === 204 && nx.status === 401, `${n0.status} · ${nx.status}`);
  const pa2 = await call('/api/partners');
  check('the printer that asked shows as ready', pa2.json.partners.find(p => p.id === 'pickles').ready === true, JSON.stringify(pa2.json.partners[0]));

  await call(`/api/admin/stories/${s1.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } });
  { const ov = await call('/api/admin/overview', { key: KEY }); check('a photograph is kept in R2, not in the database, and counted there', ov.json.use.r2 >= JPEG_B.length, JSON.stringify(ov.json.use)); }
  const pub1 = await call('/api/stories'); const one1 = await call('/api/stories/DA-7K2Q'); const ph1 = await call(`/api/photos/${s1.json.id}`); const r1 = await call(`/api/receipts/${s1.json.id}`);
  check('approved: it is shown to everyone, with its photograph, and its print joins the queue', pub1.json.stories.filter(s => s.kind === 'story').length === 1 && pub1.json.stories[0].body === SIG && one1.status === 200 && ph1.status === 200 && ph1.type === 'image/jpeg' && !!ph1.bin && ph1.bin.equals(JPEG_B) && r1.json.job.status === 'queued' && r1.json.job.ahead === 0, JSON.stringify({ n: pub1.json.stories.length, r: r1.json }));

  /* the receiver at Pickles pulls it, prints it, and says so */
  const j1 = await call('/api/printers/pickles/next', { token: T }); const j2 = await call('/api/printers/pickles/next', { token: T });
  check('the printer takes the job, with its ESC/POS bytes and its mesh line; nobody else gets it while it prints', j1.status === 200 && j1.json.code === 'DA-7K2Q' && j1.json.escpos && j1.json.mesh === null && j2.status === 204, JSON.stringify({ j1: j1.json && { ...j1.json, escpos: !!j1.json.escpos }, j2: j2.status }));
  await call(`/api/printers/pickles/jobs/${j1.json.job}`, { method: 'POST', token: T, body: { status: 'printed' } });
  const r2 = await call(`/api/receipts/${s1.json.id}`);
  check('and once printed, the sender sees it printed', r2.json.job.status === 'printed' && !!r2.json.job.done, JSON.stringify(r2.json));
  /* 1.0 C: the calibration strip goes to the printer with its own bytes; garbage is refused; the styles setting keeps a mod pack */
  { const esc = Buffer.from([0x1B, 0x40, 0x1D, 0x76, 0x30, 0, 1, 0, 1, 0, 0xFF]).toString('base64');
    const sp = await call('/api/admin/printers/pickles', { method: 'POST', key: KEY, body: { action: 'strip', escpos: esc } }), sx = await call('/api/admin/printers/pickles', { method: 'POST', key: KEY, body: { action: 'strip', escpos: '<b>' } });
    const js = await call('/api/printers/pickles/next', { token: T }); if (js.json && js.json.job) await call(`/api/printers/pickles/jobs/${js.json.job}`, { method: 'POST', token: T, body: { status: 'printed' } });
    const pack = JSON.stringify({ packs: [{ name: 'A PACK', by: 'an artist', styles: [{ id: 'grain', fonts: { body: 'mono' } }], off: [] }] });
    await call('/api/admin/settings', { method: 'POST', key: KEY, body: { styles: pack } }); const pub = await call('/api/settings');
    check('the calibration strip prints with its own bytes (garbage refused); a mod pack is kept in the settings every phone reads', sp.status === 200 && sx.status === 400 && js.json && js.json.code === 'DA-STRIP' && js.json.escpos === esc && pub.json.styles === pack,
      JSON.stringify([sp.status, sx.status, js.json && js.json.code, pub.json.styles && pub.json.styles.length])); }

  /* held up on the approval page: starred for everyone, with how often it has printed */
  await call(`/api/admin/stories/${s1.json.id}`, { method: 'POST', key: KEY, body: { action: 'star' } });
  const sp = (await call('/api/stories')).json.stories.find(x => x.code === 'DA-7K2Q');
  check('a story starred on the approval page comes to everyone starred, with its prints counted', sp && sp.star === true && sp.printed === 1, JSON.stringify(sp && { star: sp.star, printed: sp.printed }));

  /* refused: never shown, never printed */
  const s2 = await call('/api/stories', { method: 'POST', body: story('DA-8M3R', { dest: 'pickles', escpos: 'G0A=' }) });
  await call(`/api/admin/stories/${s2.json.id}`, { method: 'POST', key: KEY, body: { action: 'refuse' } });
  const r3 = await call(`/api/receipts/${s2.json.id}`); const one3 = await call('/api/stories/DA-8M3R'); const n3 = await call('/api/printers/pickles/next', { token: T });
  check('refused: never shown, never printed', r3.json.status === 'refused' && !r3.json.job && one3.status === 404 && n3.status === 204, JSON.stringify({ r3: r3.json, one: one3.status, next: n3.status }));

  /* a printer trusted to print without approval */
  await call('/api/admin/printers/kines', { method: 'POST', key: KEY, body: { action: 'auto', on: true } });
  const s4 = await call('/api/stories', { method: 'POST', body: story('DA-9N4S', { dest: 'kines', escpos: 'G0A=' }) });
  check('a printer set to print without approval queues at once; the story still waits to be shown', s4.json.job.status === 'queued' && (await call('/api/stories/DA-9N4S')).status === 404, JSON.stringify(s4.json));

  /* the nature station: on the map for every visitor, unless unlocked on the approval page */
  const st0 = await call('/api/settings'); const stx = await call('/api/admin/settings', { method: 'POST', body: { lifeLock: false } });
  const st1 = await call('/api/admin/settings', { method: 'POST', key: KEY, body: { lifeLock: false } }); const st2 = await call('/api/settings');
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { lifeLock: true } }); const st3 = await call('/api/settings');
  check('the nature station is locked on for everyone until unlocked on the approval page; nobody else can', st0.json.lifeLock === true && stx.status === 401 && st1.json.lifeLock === false && st2.json.lifeLock === false && st3.json.lifeLock === true, JSON.stringify({ st0: st0.json, stx: stx.status, st2: st2.json, st3: st3.json }));

  /* the first board's template, in words: rewritten on the approval page and served to everyone; nobody else can; too long is cut */
  const tw = 'W · WHAT WE SAW\nCounts and maps.\n\n140.85 · NOTE\nA note.';
  const tpx = await call('/api/admin/settings', { method: 'POST', body: { template: 'no' } });
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { template: tw } }); const tp1 = (await call('/api/settings')).json.template;
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { template: 'x'.repeat(7000) } }); const tp2 = (await call('/api/settings')).json.template.length;
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { template: '' } }); const tp3 = (await call('/api/settings')).json.template;
  check('the first board\'s words are rewritten on the approval page and served to everyone; nobody else can; too long is cut; emptied, the site\'s own stand', tpx.status === 401 && tp1 === tw && tp2 === 6000 && tp3 === '', JSON.stringify({ tpx: tpx.status, tp1, tp2, tp3 }));
  /* INTENTION's and W.I.S.H.'s words, the same way: only those rewritten, as JSON */
  const ww = JSON.stringify({ 'w.word': 'stories', 'intention.ask': 'what will you do?' });
  const wwx = await call('/api/admin/settings', { method: 'POST', body: { words: ww } });
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { words: ww } }); const ww1 = (await call('/api/settings')).json.words;
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { words: '' } }); const ww2 = (await call('/api/settings')).json.words;
  check('INTENTION\'s and W.I.S.H.\'s words are rewritten on the approval page and served to everyone; nobody else can; emptied, the site\'s own stand', wwx.status === 401 && ww1 === ww && ww2 === '', JSON.stringify({ wwx: wwx.status, ww1, ww2 }));
  /* cities and data packs, written as words on the approval page and served to everyone */
  const cityW = '# Sydney\ncentre, -33.8688, 151.2093\nThe Rocks, -33.8599, 151.2090';
  const cityX = await call('/api/admin/settings', { method: 'POST', body: { cities: cityW } });
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { cities: cityW } }); const city1 = (await call('/api/settings')).json.cities;
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { cities: '' } }); const city2 = (await call('/api/settings')).json.cities;
  check('cities and their places are written on the approval page and served to everyone; nobody else can; emptied, none', cityX.status === 401 && city1 === cityW && city2 === '', JSON.stringify({ cityX: cityX.status, city1, city2 }));

  /* online on the map: switched on the approval page, with or without a Pi listening */
  const lv0 = (await call('/api/partners')).json.partners.find(p => p.id === 'elsie');
  const lvx = await call('/api/admin/printers/elsie', { method: 'POST', body: { action: 'live', on: true } });
  await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'live', on: true } });
  const lv1 = (await call('/api/partners')).json.partners.find(p => p.id === 'elsie');
  await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'live', on: false } });
  const lv2 = (await call('/api/partners')).json.partners.find(p => p.id === 'elsie');
  check('a printer is switched online on the map from the approval page, and off again; nobody else can', lv0.live === false && lvx.status === 401 && lv1.live === true && lv2.live === false, JSON.stringify({ lv0, lvx: lvx.status, lv1, lv2 }));
  /* the starting printers are two-way with every connection on, for remixing; TWO-WAY is switched on the approval page */
  await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'two', on: false } });
  const tw1 = (await call('/api/partners')).json.partners.find(p => p.id === 'elsie');
  await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'two', on: true } });
  const tw2 = (await call('/api/partners')).json.partners.find(p => p.id === 'elsie');
  check('a starting island is two-way with every connection on; the approval page makes it one-way, and two-way again', lv0.two === true && lv0.links.length === 6 && tw1.two === false && tw2.two === true, JSON.stringify({ lv0: lv0.two, links: lv0.links, tw1: tw1.two, tw2: tw2.two }));

  /* renamed on the approval page: the name changes everywhere, the id (and every link and token) stays; nobody else can */
  const nm1 = await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'name', name: '  Elsie   Corner  Bar ' } });
  const nmP = (await call('/api/partners')).json.partners.find(p => p.id === 'elsie');
  await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'name', name: lv0.name } });
  check('a printer is renamed on the approval page, its id kept', nm1.status === 200 && nmP && nmP.name === 'Elsie Corner Bar', JSON.stringify({ nm1: nm1.status, nmP }));

  /* to the local mesh: nothing printed; the mesh line goes to each paired printer whose radio is on, once approved */
  await call('/api/admin/printers/pickles', { method: 'POST', key: KEY, body: { action: 'mesh', on: true } });
  const MESH = 'DA-M5H1 NOISY MINER\n-37.7700,144.9600\nA line';
  const m0 = await call('/api/stories', { method: 'POST', ip: '10.0.0.6', body: story('DA-M5H1', { dest: 'mesh' }) });
  const m1 = await call('/api/stories', { method: 'POST', ip: '10.0.0.6', body: story('DA-M5H1', { dest: 'mesh', mesh: MESH }) });
  const pm = (await call('/api/partners')).json.partners;
  check('sent to the local mesh: it goes at once, with a mesh line for each radio that is on', m0.status === 400 && m1.status === 201 && m1.json.job && m1.json.job.status === 'queued' && pm.find(p => p.id === 'pickles').mesh === true && pm.find(p => p.id === 'kines').mesh === false, JSON.stringify({ m0: m0.status, m1: m1.json, pm }));
  await call(`/api/admin/stories/${m1.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } });
  const mj = await call('/api/printers/pickles/next', { token: T });
  check('the radio gets the mesh line alone, no bytes to print', mj.status === 200 && mj.json.code === 'DA-M5H1' && mj.json.escpos === null && mj.json.mesh === MESH, JSON.stringify(mj.json));
  await call(`/api/printers/pickles/jobs/${mj.json.job}`, { method: 'POST', token: T, body: { status: 'printed' } });

  /* a touch screen beside a printer: its own token, shown once; every slip waits for it; a press prints, a long press squashes */
  const tc = await call('/api/admin/printers/kines', { method: 'POST', key: KEY, body: { action: 'touch', on: true } }); const TT = tc.json && tc.json.token;
  const tcx = await call('/api/admin/printers/kines', { method: 'POST', body: { action: 'touch', on: true } });
  await call('/api/touch/kines', { token: TT });   // the screen checks in (it asks every two seconds); a screen not heard from is passed by
  const WISH = { type: 'noticed', lat: -37.77, lng: 144.96, text: 'to keep the creek cool', wish: ['One', 'Two', 'Three', 'Four'], tx: { n: 'Manorina melanocephala', cn: 'Noisy Miner' } };
  const tA = await call('/api/stories', { method: 'POST', ip: '10.0.0.8', body: { kind: 'record', code: 'DA-T0CA', body: JSON.stringify(WISH), lat: -37.77, lng: 144.96, dest: 'kines', escpos: 'G0A=' } });
  const tB = await call('/api/stories', { method: 'POST', ip: '10.0.0.8', body: { kind: 'record', code: 'DA-T0CB', body: JSON.stringify(WISH), lat: -37.77, lng: 144.96, dest: 'kines', escpos: 'G0A=' } });
  const tl = await call('/api/touch/kines', { token: TT }); const tlx = await call('/api/touch/kines', { token: 'nope' }); const tly = await call('/api/touch/pickles', { token: TT });
  const h0 = tl.json && tl.json.held.find(h => h.code === 'DA-T0CA');
  check('a touch screen has its own token, shown once; with it on, slips wait and it sees them with their words; no other token or printer', tcx.status === 401 && typeof TT === 'string' && TT.length > 16 && tA.json.job.status === 'held' && tl.status === 200 && h0 && h0.say === 'to keep the creek cool' && h0.wish.length === 4 && h0.life === 'Noisy Miner' && h0.paper === true && tl.json.waiting === 2 && tl.json.wait === 2 && tl.json.printing >= 1 && tlx.status === 401 && tly.status === 401,
    JSON.stringify({ tcx: tcx.status, tA: tA.json.job, tl: tl.status, waiting: tl.json && tl.json.waiting, printing: tl.json && tl.json.printing, h0, tlx: tlx.status, tly: tly.status }));
  const pr = await call(`/api/touch/kines/${tA.json.job.id}`, { method: 'POST', token: TT, body: { action: 'print' } });
  const sq = await call(`/api/touch/kines/${tB.json.job.id}`, { method: 'POST', token: TT, body: { action: 'squash' } });
  const rA = await call(`/api/receipts/${tA.json.id}`); const rB = await call(`/api/receipts/${tB.json.id}`); const tl2 = await call('/api/touch/kines', { token: TT });
  await call('/api/admin/printers/kines', { method: 'POST', key: KEY, body: { action: 'touch', on: false } }); const tl3 = await call('/api/touch/kines', { token: TT });
  check('one press prints (queued), a long press squashes (gone); turned off, the token stops at once', pr.status === 200 && sq.status === 200 && rA.json.job.status === 'queued' && !rB.json.job && tl2.json.held.every(h => h.job !== tA.json.job.id && h.job !== tB.json.job.id) && tl3.status === 401,
    JSON.stringify({ pr: pr.status, sq: sq.status, a: rA.json.job, b: rB.json.job, tl3: tl3.status }));

  /* a pack of cells: waits like any story, then everyone has it */
  const PACK = JSON.stringify({ title: 'Fruit and radios', by: 'neighbours', cells: [{ k: 'fruit', n: 'Lemon tree', lat: -37.7701, lng: 144.9602 }, { k: 'node', n: 'Rooftop repeater', lat: -37.7664, lng: 144.9731 }] });
  const c0 = await call('/api/stories', { method: 'POST', ip: '10.0.0.7', body: { kind: 'cells', code: 'DA-C3KS', body: PACK, lat: -37.768, lng: 144.967 } });
  const cbad = await Promise.all([{ cells: [] }, { cells: [{ n: 'x', lat: 'here', lng: 1 }] }, { cells: Array.from({ length: 201 }, () => ({ n: 'x', lat: -37.7, lng: 144.9 })) }]
    .map(b => call('/api/stories', { method: 'POST', ip: '10.0.0.7', body: { kind: 'cells', code: 'DA-C3KT', body: JSON.stringify(b), lat: -37.768, lng: 144.967 } })));
  const cw = (await call('/api/admin/stories?status=waiting', { key: KEY })).json.stories.find(s => s.code === 'DA-C3KS');
  await call(`/api/admin/stories/${c0.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } });
  const cpub = (await call('/api/stories')).json.stories.find(s => s.code === 'DA-C3KS');
  check('a pack of cells waits for approval, then is shown to everyone; an empty, unplaced or oversized pack is refused', c0.status === 201 && !c0.json.job && cw && cw.kind === 'cells' && cpub && JSON.parse(cpub.body).cells.length === 2 && cbad.map(b => b.status).join() === '400,400,400', JSON.stringify({ c0: c0.status, bad: cbad.map(b => b.status), cpub: !!cpub }));

  /* what is refused at the door */
  const bad = await Promise.all([
    call('/api/stories', { method: 'POST', body: story('DA-IIII') }),
    call('/api/stories', { method: 'POST', body: story('DA-1234', { body: '<script>' }) }),
    call('/api/stories', { method: 'POST', body: story('DA-1234', { dest: 'nowhere' }) }),
    call('/api/stories', { method: 'POST', body: story('DA-1234', { photo: 'data:image/png;base64,AAAA' }) }),
    call('/api/stories', { method: 'POST', body: story('DA-1234'), origin: 'https://elsewhere.example' }),
    call('/api/stories', { method: 'POST', raw: '{"kind":"story",' + '"x":"' + 'a'.repeat(1000000) + '"}' }),
  ]);
  check('a bad code, a bad story, an unknown place, another site, too large: each refused; a photograph not a JPEG is left off and the rest goes', bad.map(b => b.status).join(',') === '400,400,400,201,403,400', bad.map(b => b.status).join(','));
  /* the portfolio: a post written on the approval page is a draft, unseen, until published */
  const pd0 = await call('/api/admin/posts', { method: 'POST', body: { title: 'Fan night, a case study', cat: 'work', summary: 'What happened', body: 'One.\n\nTwo.', links: ['https://example.org/a', 'javascript:alert(1)'], cover: JPEG } });
  const pd = await call('/api/admin/posts', { method: 'POST', key: KEY, body: { title: 'Fan night, a case study', cat: 'work', summary: 'What happened', body: 'One.\n\nTwo.', links: ['https://example.org/a', 'javascript:alert(1)'], cover: JPEG } });
  const po0 = await call('/api/posts'); const one0p = await call('/api/posts/fan-night-a-case-study');
  check('a post without the password is refused; with it, it waits as a draft nobody sees', pd0.status === 401 && pd.status === 201 && pd.json.slug === 'fan-night-a-case-study' && po0.json.posts.length === 0 && one0p.status === 404, `${pd0.status} ${pd.status} ${JSON.stringify(pd.json)} ${po0.json.posts.length} ${one0p.status}`);
  await call('/api/admin/posts', { method: 'POST', key: KEY, body: { id: pd.json.id, title: 'Fan night, a case study', cat: 'work', summary: 'What happened', body: 'One.\n\nTwo.', links: ['https://example.org/a'], status: 'published' } });
  const po1 = await call('/api/posts'); const po1one = await call('/api/posts/fan-night-a-case-study'); const cov = await call('/api/posts/fan-night-a-case-study/cover');
  check('published, it is listed with its category and cover, and only https links are kept', po1.json.posts.length === 1 && po1.json.posts[0].cat === 'WORK' && po1.json.posts[0].cover && po1one.json.post.links.join() === 'https://example.org/a' && cov.status === 200 && cov.type === 'image/jpeg' && !!cov.bin && cov.bin.equals(JPEG_B), `${JSON.stringify(po1.json)} ${cov.status}`);
  await call(`/api/admin/posts/${pd.json.id}`, { method: 'POST', key: KEY, body: { action: 'delete' } });
  check('deleted, it is gone', (await call('/api/posts')).json.posts.length === 0);
  /* in the field: the Pi and its screen say which Wi-Fi they are on, for the approval page; CHANGE WI-FI reaches only a receiver that says it can */
  const te = await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'token' } }); const TE = te.json.token;
  await call('/api/printers/elsie/next?net=Cafe%20Wi-Fi&rssi=-52', { token: TE }); const TT2 = (await call('/api/admin/printers/kines', { method: 'POST', key: KEY, body: { action: 'touch', on: true } })).json.token; await call('/api/touch/kines?net=Cafe%20Wi-Fi&rssi=-71', { token: TT2 });
  const pl = (await call('/api/admin/printers', { key: KEY })).json.printers, pe = pl.find(x => x.id === 'elsie'), pk = pl.find(x => x.id === 'kines');
  await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'wifi' } }); const wOld = await call('/api/printers/elsie/next', { token: TE });
  await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'wifi' } }); const wNew = await call('/api/printers/elsie/next?can=off%20wifi', { token: TE });
  check('the Pi and its screen say which Wi-Fi they are on; CHANGE WI-FI reaches only a receiver that says it can', JSON.parse(pe.net).n === 'Cafe Wi-Fi' && JSON.parse(pe.net).rssi === -52 && JSON.parse(pk.touch_net).n === 'Cafe Wi-Fi' && !(wOld.json && wOld.json.wifi) && wNew.json && wNew.json.wifi === true, JSON.stringify({ net: pe.net, tnet: pk.touch_net, old: wOld.status, nw: wNew.json }));
  /* the approval page's overhaul: archived not lost, brought back; counts of things; everything as one file; places by the hundred; settings; back to base */
  const ar = await call('/api/stories', { method: 'POST', body: story('DA-ARC1'), ip: '10.7.7.7' });
  await call(`/api/admin/stories/${ar.json.id}`, { method: 'POST', key: KEY, body: { action: 'refuse' } }); const arP = await call(`/api/admin/photos/${ar.json.id}`, { key: KEY });
  await call(`/api/admin/stories/${ar.json.id}`, { method: 'POST', key: KEY, body: { action: 'delete' } }); const arD = await call('/api/admin/stories?status=deleted', { key: KEY });
  await call(`/api/admin/stories/${ar.json.id}`, { method: 'POST', key: KEY, body: { action: 'restore' } }); const arW = await call('/api/admin/stories?status=waiting', { key: KEY });
  check('a story archived stays on the approval page and comes back to waiting', arD.json.stories.some(x => x.id === ar.json.id) && arW.json.stories.some(x => x.id === ar.json.id), JSON.stringify([arD.json.stories.length, arW.json.stories.length, arP.status]));
  await call('/api/beat?k=open-aura'); await call('/api/beat?k=begin'); await call('/api/beat?k=nonsense'); await new Promise(r => setTimeout(r, 400));
  const ov = await call('/api/admin/overview', { key: KEY }), tr = await call('/api/admin/traffic', { key: KEY }), ovNo = await call('/api/admin/overview', { ip: '10.6.6.6' });
  check('the overview counts what waits and what happened (things, never people), and only with the password', ov.status === 200 && ov.json.stories.waiting >= 1 && Array.isArray(ov.json.printers) && tr.json.traffic.some(r => r.k === 'open-aura') && !tr.json.traffic.some(r => r.k === 'nonsense') && ovNo.status === 401, JSON.stringify({ today: ov.json.today, n: tr.json.traffic.length }));
  const wm = await call('/api/warm', { method: 'POST' });
  check('the day is measured against the free allowances, and setting out towards a print wakes the printers', wm.status === 204 && ov.json.use && ov.json.use.req > 0 && ov.json.use.cap.req === 100e3 && ov.json.use.level === 0, JSON.stringify(ov.json.use));
  const kind = { id: 12345, n: 'Gymnorhina tibicen', cn: 'Australian Magpie', ic: 'Aves', g: 'bird', ph: 'https://inaturalist-open-data.s3.amazonaws.com/photos/1/square.jpg' };
  const k1 = await call('/api/species', { method: 'POST', body: { kinds: [kind, { id: 'x', n: 'bad' }] } }), k2 = await call('/api/species', { method: 'POST', body: { kinds: [kind] } }), kl = await call('/api/admin/species', { key: KEY }), kn = await call('/api/admin/species', { ip: '10.7.7.7' });
  check('each kind of life met is kept once, for the approval page only', k1.json.added === 1 && k2.json.added === 0 && kl.json.species.some(x => x.id === 12345 && x.ph) && kn.status === 401, JSON.stringify([k1.json, k2.json, kn.status]));
  const im = await call('/api/admin/places/import', { method: 'POST', key: KEY, body: { places: [{ n: 'Imported One', lat: -37.77, lng: 144.96, cat: 'third' }, { n: 'Imported Two', lat: '-37.771', lng: '144.961' }, { n: '', lat: 1, lng: 1 }] } });
  const ex = await call('/api/admin/export', { key: KEY });
  check('everything comes away as one file (never a token), and places come in by the hundred', im.json.added === 2 && im.json.bad === 1 && ex.status === 200 && ex.json.places.some(p => p.n === 'Imported One') && ex.json.stories.length > 0 && !JSON.stringify(ex.json.printers).includes('token"'), JSON.stringify(im.json));
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { gates: JSON.stringify({ mode: 'open', at: [1, 2, 3] }), fx: 'chaos', phreak: true, curations: JSON.stringify([{ name: 'Radio', about: 'x' }]), notice: JSON.stringify({ off: true, text: 'A notice.' }), country: JSON.stringify({ off: false, head: 'A COUNTRY', text: '' }) } }); const stG = await call('/api/settings');
  check('settings for everyone: how devices are earned, the motion, the phreak, the twelve curations, the first visit notice, the Country over the map', JSON.parse(stG.json.gates).mode === 'open' && stG.json.fx === 'chaos' && stG.json.phreak === true && JSON.parse(stG.json.curations)[0].name === 'Radio' && JSON.parse(stG.json.notice).off === true && JSON.parse(stG.json.notice).text === 'A notice.' && JSON.parse(stG.json.country).head === 'A COUNTRY', JSON.stringify(stG.json).slice(0, 200));
  /* sent with no printer: waiting for approval, or on the site at once when the approval page says so; never a print */
  const sn0 = await call('/api/stories', { method: 'POST', ip: '10.0.0.31', body: { kind: 'record', who: 'K7S', code: 'DA-S3N0', body: JSON.stringify(WISH), lat: -37.77, lng: 144.96 } });
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { sendLive: true } });
  const sn1 = await call('/api/stories', { method: 'POST', ip: '10.0.0.31', body: { kind: 'record', who: 'K7S', code: 'DA-S3N1', body: JSON.stringify(WISH), lat: -37.77, lng: 144.96 } });
  const snp = await call('/api/stories', { method: 'POST', ip: '10.0.0.31', body: { kind: 'record', who: 'K7S', code: 'DA-S3N2', body: JSON.stringify(WISH), lat: -37.77, lng: 144.96, dest: 'kines', escpos: 'G0A=' } });
  const snm = await call('/api/mine/K7S'); await call('/api/admin/settings', { method: 'POST', key: KEY, body: { sendLive: false } });
  check('sent with no printer: waiting for approval as built, on the site at once when STRAIGHT ON THE SITE is ticked (a print still waits), and never counted as printed', sn0.json.status === 'waiting' && sn1.json.status === 'shown' && snp.json.status === 'waiting' && snm.json.printed === false, JSON.stringify({ a: sn0.json.status, b: sn1.json.status, p: snp.json.status, printed: snm.json.printed }));
  /* the gallery's answers: its words edited, a reply from novel.global in its talk, filed under a portfolio group; and an upload's original kept as it came */
  const gid = sn0.json.id, gp = b => call('/api/admin/stories/' + gid, { method: 'POST', key: KEY, body: b });
  const ge = await gp({ action: 'edit', text: 'edited here' }), gr = await gp({ action: 'reply', text: 'thank you' }), gg = await gp({ action: 'group', grp: 'Radio' }), gbad = await call('/api/admin/stories/' + gid, { method: 'POST', key: KEY, body: { action: 'reply', text: '' } });
  const gl = ((await call('/api/admin/stories?status=waiting', { key: KEY })).json.stories || []).find(x => x.id === gid) || {}, gt = ((await call('/api/admin/talk', { key: KEY })).json.talk || []).find(t => t.text === 'thank you') || {};
  check('the gallery: its words edited, a reply said in its talk as novel.global, filed under a group', ge.status === 200 && gr.status === 200 && gg.status === 200 && gbad.status === 400 && JSON.parse(gl.body).text === 'edited here' && gl.grp === 'Radio' && gt.sec === 'p.DA-S3N0' && gt.k === 'ng', JSON.stringify({ g: gl.grp, t: gt.sec, k: gt.k }));
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const og = await call('/api/stories', { method: 'POST', ip: '10.0.0.32', body: { kind: 'record', who: 'K7S', code: 'DA-0R1G', body: JSON.stringify(WISH), lat: -37.77, lng: 144.96, full: png } });
  const ogr = og.json.id ? await call('/api/admin/full/' + og.json.id, { key: KEY }) : null;
  check('an upload\'s original is kept as it came (its own kind of file), for the approval page to download', !!ogr && ogr.status === 200 && ogr.type === 'image/png', String(ogr && ogr.status) + ' ' + (ogr && ogr.type));
  const rs0 = await call('/api/admin/reset', { method: 'POST', key: KEY, body: {} }); const rs = await call('/api/admin/reset', { method: 'POST', key: KEY, body: { places: true, settings: true } });
  const plR = await call('/api/places'), stR = await call('/api/settings'), prR = await call('/api/partners'), arch = await call('/api/admin/places?status=deleted', { key: KEY });
  check('back to base: places to the archive, settings as built, the printers untouched', rs0.status === 400 && rs.status === 200 && plR.json.places.length === 0 && arch.json.places.length >= 2 && stR.json.fx === '' && stR.json.phreak === false && prR.json.partners.length >= 4, JSON.stringify([plR.json.places.length, arch.json.places.length, stR.json.fx]));
  /* the receiver itself: pull.py, against this Worker, writing the slip to a file instead of a printer */
  const py = (process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python']).find(c => { try { return spawnSync(c, ['--version']).status === 0; } catch (e) { return false; } });
  if (py) {
    const tk = (await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'token' } })).json.token;
    const BYTES = Buffer.from([0x1B, 0x40, 0x44, 0x41, 0x0A, 0x1D, 0x56, 0x42, 0x00]);
    const s5 = await call('/api/stories', { method: 'POST', ip: '10.0.0.5', body: story('DA-5P6T', { dest: 'elsie', escpos: BYTES.toString('base64') }) });
    await call(`/api/admin/stories/${s5.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'da-pull-'));
    const run = spawnSync(py, [path.join(ROOT, 'receiver/pull.py'), '--once', '--no-ready'], { env: { ...process.env, DA_SERVER: O, DA_PRINTER: 'elsie', DA_TOKEN: tk, DA_DRY: '1', DA_DRY_DIR: dir }, encoding: 'utf8', timeout: 60000 });
    const files = fs.readdirSync(dir); const got = files.length ? fs.readFileSync(path.join(dir, files[0])) : Buffer.alloc(0); const r5 = await call(`/api/receipts/${s5.json.id}`);
    check('the receiver pulls an approved slip, prints its bytes as sent, and reports it printed', run.status === 0 && got.equals(BYTES) && r5.json.job.status === 'printed', JSON.stringify({ exit: run.status, files, job: r5.json.job, log: (run.stdout + run.stderr).trim().split('\n').slice(-2) }));
    fs.rmSync(dir, { recursive: true, force: true });
    /* TURN OFF on the approval page: dropped by a receiver that cannot turn off; handed once to one that can, which prints a slip and leaves the note that turns its Pi off */
    await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'off' } });
    const old = await call('/api/printers/elsie/next', { token: tk });
    await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'off' } });
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'da-off-')); const note = path.join(dir2, 'off');
    const run2 = spawnSync(py, [path.join(ROOT, 'receiver/pull.py'), '--once', '--no-ready'], { env: { ...process.env, DA_SERVER: O, DA_PRINTER: 'elsie', DA_TOKEN: tk, DA_DRY: '1', DA_DRY_DIR: dir2, DA_OFF_FILE: note }, encoding: 'utf8', timeout: 60000 });
    const slips = fs.readdirSync(dir2).filter(f => f.startsWith('da-slip-')); const slip = slips.length ? fs.readFileSync(path.join(dir2, slips[0]), 'latin1') : '';
    const again = await call('/api/printers/elsie/next?can=off', { token: tk }); const pl = await call('/api/admin/printers', { key: KEY });
    check('TURN OFF: dropped by a receiver that cannot; handed once to one that can, which prints a slip and asks its Pi to turn off', old.status === 204 && run2.status === 0 && fs.existsSync(note) && /TURNING OFF/.test(slip) && again.status === 204 && pl.json.printers.find(p => p.id === 'elsie').can === 'off',
      JSON.stringify({ old: old.status, exit: run2.status, note: fs.existsSync(note), slips: slips.length, again: again.status, can: (pl.json.printers.find(p => p.id === 'elsie') || {}).can, log: (run2.stdout + run2.stderr).slice(-300) }));
    fs.rmSync(dir2, { recursive: true, force: true });
  } else results.push('SKIP  the receiver: no Python here');
  /* an island pairs without a token typed: a code asked for, looked up and approved here, then its token handed over once and working */
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { openJoin: false } });
  { const pk = await call('/api/pair', { method: 'POST', ip: '192.0.2.40', body: { name: 'Laundromate', paper: '58' } }), D = pk.json && pk.json.device, C = pk.json && pk.json.code;
    const w0 = await call('/api/pair/poll', { method: 'POST', body: { device: D } }), bad = await call('/api/pair/poll', { method: 'POST', body: { device: 'nope' } });
    const lk = await call(`/api/admin/pair/${C.slice(0, 4)}-${C.slice(4).toLowerCase()}`, { key: KEY }), lkNo = await call(`/api/admin/pair/${C}`);
    const ap = await call(`/api/admin/pair/${C}`, { method: 'POST', key: KEY, body: { printer: '' } });
    const got = await call('/api/pair/poll', { method: 'POST', body: { device: D } }), twice = await call('/api/pair/poll', { method: 'POST', body: { device: D } });
    const nx = await call(`/api/printers/${got.json && got.json.printer}/next`, { token: got.json && got.json.token }), pl = (await call('/api/admin/printers', { key: KEY })).json.printers;
    check('an island pairs by a printed code: approved on the approval page, it is handed a new printer and a working token once', pk.status === 201 && /^[A-Z2-9]{8}$/.test(C) && w0.status === 202 && bad.status === 404 && lk.status === 200 && lk.json.name === 'Laundromate'
      && [401, 429].includes(lkNo.status) && ap.json.printer === 'laundromate' && got.status === 200 && got.json.printer === 'laundromate' && got.json.token.length === 32 && twice.status === 404 && nx.status === 204 && pl.some(p => p.id === 'laundromate' && p.paired && String(p.paper) === '58') && lk.json.paper === '58',
      JSON.stringify([pk.status, w0.status, bad.status, lk.status, lkNo.status, ap.json, got.status, twice.status, nx.status]));
    const nums = pl.filter(p => p.number != null).map(p => p.number), mine = pl.find(p => p.id === 'laundromate') || {};
    const tk2 = got.json && got.json.token, mv = await call('/api/admin/printers/laundromate', { method: 'POST', key: KEY, body: { action: 'number', number: 9 } });
    const nx9 = await call('/api/printers/laundromate/next', { token: tk2 }), taken = await call('/api/admin/printers/elsie', { method: 'POST', key: KEY, body: { action: 'number', number: 9 } });
    check('island numbers: novel.global 1, each printer 2 and up the first time it is paired, the newest last, none shared, none for one never paired; an island is told its own when paired and on every ask; ISLAND N sets one by hand, never one taken',
      (pl.find(p => p.id === 'novelglobal') || {}).number === 1 && pl.every(p => p.id === 'novelglobal' || (p.paired ? p.number >= 2 : true)) && pl.some(p => !p.paired && p.number == null) && new Set(nums).size === nums.length
      && mine.number === Math.max(...nums) && mine.number >= 2 && got.json.number === mine.number && nx.island === String(mine.number) && mv.status === 200 && nx9.island === '9' && taken.status === 409,
      JSON.stringify({ nums, got: got.json && got.json.number, header: nx.island, mv: mv.status, nx9: nx9.island, taken: taken.status })); }
  /* open joining (the pilot): an island is in at its first ask, with a token and its keeper's key; it starts one-way with no connections */
  await call('/api/admin/settings', { method: 'POST', key: KEY, body: { openJoin: true } });
  { const pk = await call('/api/pair', { method: 'POST', ip: '192.0.2.41', body: { name: 'Tide Pool', paper: '80' } }), D = pk.json && pk.json.device;
    const got = await call('/api/pair/poll', { method: 'POST', body: { device: D } }), K = got.json && got.json.key, id = got.json && got.json.printer;
    const mine = await call('/api/island', { token: K }), wrong = await call('/api/island', { token: 'x'.repeat(32) }), none = await call('/api/island');
    const ng = await call('/api/island', { token: 'nope' }), pt = (await call('/api/partners')).json.partners.find(p => p.id === id) || {};
    check('open joining: a new island is in at its first ask, handed its token and its keeper\'s key once; one-way with no connections; the key opens its own island and nothing else',
      got.status === 200 && id === 'tide-pool' && got.json.token.length === 32 && K.length === 32 && mine.status === 200 && mine.json.id === id && mine.json.two === false && mine.json.links.length === 0
      && wrong.status === 401 && none.status === 401 && ng.status === 401 && pt.two === false && pt.links.length === 0, JSON.stringify([got.status, id, mine.status, mine.json, wrong.status, none.status, pt]));
    /* a W.I.S.H. piece prints there only once its keeper switches W.I.S.H. on; its own stacks always do */
    const esc = Buffer.from([0x1B, 0x40, 65, 10]).toString('base64');
    const no = await call('/api/stories', { method: 'POST', ip: '10.0.0.77', body: story('DA-4TPX', { kind: 'record', body: JSON.stringify(WISH), dest: id, escpos: esc }) }), own = await call('/api/stories', { method: 'POST', ip: '10.0.0.77', body: story('DA-4TPY', { kind: 'record', body: JSON.stringify(WISH), dest: id, escpos: esc, stage: 'stack' }) });
    const on = await call('/api/island', { method: 'POST', token: K, body: { links: ['wish', 'nonsense'] } }), yes = await call('/api/stories', { method: 'POST', ip: '10.0.0.77', body: story('DA-4TPZ', { kind: 'record', body: JSON.stringify(WISH), dest: id, escpos: esc }) });
    check('connections: a W.I.S.H. piece is refused by an island without W.I.S.H. on and printed once its keeper switches it on; its own stacks print either way; nothing but the six connections is kept',
      no.status === 403 && [200, 201].includes(own.status) && on.json.links.join() === 'wish' && [200, 201].includes(yes.status), JSON.stringify([no.status, own.status, on.json && on.json.links, yes.status]));
    await call('/api/admin/settings', { method: 'POST', key: KEY, body: { openJoin: false } });
    const pk2 = await call('/api/pair', { method: 'POST', ip: '192.0.2.42', body: { name: 'Shut Gate' } }), w2 = await call('/api/pair/poll', { method: 'POST', body: { device: pk2.json && pk2.json.device } });
    check('with open joining off, a new island waits for the approval page again', w2.status === 202, String(w2.status));
    await call('/api/admin/settings', { method: 'POST', key: KEY, body: { openJoin: true } }); }
  /* a message to novel.global, from the portfolio: approved, it prints; it is never listed for anyone, nor its photograph */
  const ms = await call('/api/stories', { method: 'POST', ip: '203.0.113.77', body: story('DA-3MSG', { kind: 'message', dest: 'novelglobal', escpos: Buffer.from([0x1B, 0x40, 72, 10]).toString('base64'), photo: JPEG }) });
  await call(`/api/admin/stories/${ms.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } });
  const mp = await call('/api/stories'); const mc = await call('/api/stories/DA-3MSG'); const mph = await call(`/api/photos/${ms.json.id}`); const mr = await call(`/api/receipts/${ms.json.id}`);
  check('a message is private: approved, its print joins the queue; it is never listed, found by its code, nor its photograph shown', ms.status === 201 && !mp.json.stories.some(x => x.code === 'DA-3MSG') && mc.status === 404 && mph.status === 404 && mr.json.job && mr.json.job.status === 'queued', JSON.stringify({ s: ms.status, listed: mp.json.stories.some(x => x.code === 'DA-3MSG'), mc: mc.status, mph: mph.status, job: mr.json.job }));
  /* a maker's own three characters: their things listed by them alone, taken down off the site by them, kept and put back on the approval page */
  const w1 = await call('/api/stories', { method: 'POST', ip: '198.51.100.9', body: story('DA-3WHY', { who: 'K7Q' }) });
  await call(`/api/admin/stories/${w1.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } });
  const wl = await call('/api/mine/K7Q', { ip: '198.51.100.9' }), wo = await call('/api/mine/ZZ9', { ip: '198.51.100.9' }), wbad = await call('/api/mine/k7', { ip: '198.51.100.9' });
  const wpub = await call('/api/stories'), wnot = await call(`/api/mine/ZZ9/${w1.json.id}`, { method: 'POST', ip: '198.51.100.9', body: {} });
  const wdrop = await call(`/api/mine/K7Q/${w1.json.id}`, { method: 'POST', ip: '198.51.100.9', body: {} });
  const wpub2 = await call('/api/stories'), wone = await call('/api/stories/DA-3WHY'), wl2 = await call('/api/mine/K7Q', { ip: '198.51.100.9' }), wad = await call('/api/admin/stories?status=shown', { key: KEY });
  const kept = (wad.json.stories || []).find(x => x.id === w1.json.id) || {};
  await call(`/api/admin/stories/${w1.json.id}`, { method: 'POST', key: KEY, body: { action: 'ungone' } }); const wpub3 = await call('/api/stories');
  check('a maker code: their things listed by it alone (never with anyone else, never the code in public), taken down off the site by it only, still on the approval page, and put back from there',
    wl.json.mine.length === 1 && wl.json.mine[0].code === 'DA-3WHY' && wo.json.mine.length === 0 && wbad.status === 400 && wpub.json.stories.some(x => x.code === 'DA-3WHY' && !('who' in x)) && wnot.status === 404 &&
    wdrop.status === 200 && !wpub2.json.stories.some(x => x.code === 'DA-3WHY') && wone.status === 404 && wl2.json.mine.length === 0 && kept.who === 'K7Q' && !!kept.gone && wpub3.json.stories.some(x => x.code === 'DA-3WHY'),
    JSON.stringify({ wl: wl.json, wo: wo.json, wbad: wbad.status, wnot: wnot.status, wdrop: wdrop.status, wone: wone.status, kept: { who: kept.who, gone: kept.gone } }));
  /* the board: written only with a code a print gave, read by anyone by kin (never the code), a reply under what it answers, hidden from the approval page */
  const kp = await call('/api/stories', { method: 'POST', body: story('DA-4PQR', { dest: 'pickles', who: 'K7Q', escpos: Buffer.from([0x1B, 0x40, 66, 10]).toString('base64') }) });
  await call(`/api/admin/stories/${kp.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } });
  for (let i = 0; i < 12; i++) { const nj = await call('/api/printers/pickles/next', { token: T }); if (nj.status !== 200) break; await call(`/api/printers/pickles/jobs/${nj.json.job}`, { method: 'POST', token: T, body: { status: 'printed' } }); }
  const kMine = await call('/api/mine/K7Q');
  check('a printer still marks the codes it printed for', kMine.json.printed === true, JSON.stringify([kMine.json.printed]));
  const kNo = await call('/api/talk', { method: 'POST', ip: '198.51.100.11', body: { s: 'make', who: 'ZZ8', text: 'hello' } });
  const kA = await call('/api/talk', { method: 'POST', ip: '198.51.100.11', body: { s: 'notice', who: 'K7Q', text: 'a lorikeet by the creek' } });
  const kB = await call('/api/talk', { method: 'POST', ip: '198.51.100.11', body: { s: 'notice', who: 'K7Q', text: 'and its parents', re: kA.json.id } });
  const kL = await call('/api/talk?s=notice&who=K7Q'), kS = await call('/api/talk?s=story&who=K7Q'), kAnon = await call('/api/talk?s=notice'), kGuess = await call('/api/talk?s=notice&who=ZZ8');
  await call(`/api/admin/talk/${kB.json.id}`, { method: 'POST', key: KEY, body: { action: 'hide' } }); const kL2 = await call('/api/talk?s=notice&who=K7Q'), kAd = await call('/api/admin/talk', { key: KEY });
  const pA = await call('/api/talk', { method: 'POST', ip: '198.51.100.12', body: { s: 'p.DA-4PQR', who: 'K7Q', text: 'swap for a magpie one?', k: 'swap' } }), pL = await call('/api/talk?s=p.DA-4PQR&who=K7Q'), pNx = await call('/api/talk?s=p.DA-ZZZZ&who=K7Q');
  const liv1 = await call('/api/live', { method: 'POST', ip: '198.51.100.13', body: { who: 'ZZ8', code: 'DA-4PQR' } }), liv2 = await call('/api/live', { method: 'POST', ip: '198.51.100.13', body: { who: 'K7Q', code: 'DA-4PQR' } }), liv3 = await call('/api/live', { method: 'POST', ip: '198.51.100.13', body: { who: 'K7Q', code: 'nope' } });
  const m888 = await call('/api/talk', { method: 'POST', ip: '198.51.100.14', body: { s: 'notice', who: '888', text: 'master' } }), m888b = await call('/api/live', { method: 'POST', ip: '198.51.100.14', body: { who: '888', code: 'DA-4PQR' } });
  check('888 is the master code, reserved: no one talks or posts with it', m888.status === 400 && m888b.status === 400, JSON.stringify([m888.status, m888b.status]));
  check('a printed poster put live for everyone only by its own code, and only with its picture', liv1.status === 404 && [200, 409].includes(liv2.status) && liv3.status === 400, JSON.stringify([liv1.status, liv2.status, liv3.status]));
  check('each poster shown on the site has its own talk, a word marked as a swap or a share', pA.status === 201 && pL.json.talk.length === 1 && pL.json.talk[0].k === 'swap' && pNx.status === 400, JSON.stringify([pA.status, pL.json, pNx.status]));
  check('the board: any code may talk (one the site has not met is met as it does); a maker can, shown by their kin and never their code; a reply sits under what it answers; hidden, it leaves the board but stays on the approval page',
    kNo.status === 201 && kAnon.status === 400 && kGuess.status === 200 && kA.status === 201 && kB.status === 201 && Number.isInteger(kA.json.kin) && kL.json.talk.length === 2 && kL.json.talk.every(t => !('who' in t) && t.kin === kA.json.kin) && kL.json.talk.some(t => t.re === kA.json.id) && kS.json.talk.length === 0 && kL2.json.talk.length === 1 && kAd.json.talk.filter(t => t.k !== 'ng').length === 3 && kAd.json.talk.some(t => t.hidden && t.who === 'K7Q'),
    JSON.stringify({ no: kNo.status, a: kA.json, l: kL.json, ad: (kAd.json.talk || []).length }));
  /* a maker on the approval page: everything they did; deleted, their stories go to the archive and their posts and record go */
  const qA = await call('/api/stories', { method: 'POST', ip: '198.51.100.21', body: story('DA-4QXA', { who: 'Q4X', dest: 'pickles', escpos: Buffer.from([0x1B, 0x40, 67, 10]).toString('base64') }) });
  await call(`/api/admin/stories/${qA.json.id}`, { method: 'POST', key: KEY, body: { action: 'show' } });
  for (let i = 0; i < 12; i++) { const nj = await call('/api/printers/pickles/next', { token: T }); if (nj.status !== 200) break; await call(`/api/printers/pickles/jobs/${nj.json.job}`, { method: 'POST', token: T, body: { status: 'printed' } }); }
  await call('/api/talk', { method: 'POST', ip: '198.51.100.21', body: { s: 'make', who: 'Q4X', text: 'a kelp forest of paper' } });
  const qM = await call('/api/admin/makers/Q4X', { key: KEY }), qMx = await call('/api/admin/makers/Q4X');
  const qD = await call('/api/admin/makers/Q4X', { method: 'POST', key: KEY, body: { action: 'delete' } });
  const qM2 = await call('/api/admin/makers/Q4X', { key: KEY }), qT = await call('/api/talk?s=make&who=K7Q'), qAr = await call('/api/admin/stories?status=deleted', { key: KEY });
  check('a maker on the approval page: what they sent and said, for the approval page only; deleted, their stories are archived and their posts and record are gone',
    qA.status === 201 && qM.status === 200 && qM.json.stories.length === 1 && qM.json.talk.length === 1 && (qMx.status === 401 || qMx.status === 429) && qD.status === 200 && qM2.status === 404 && !qT.json.talk.some(t => t.text === 'a kelp forest of paper') && qAr.json.stories.some(x => x.code === 'DA-4QXA'),
    JSON.stringify({ m: qM.status, x: qMx.status, d: qD.status, m2: qM2.status }));
  { await call('/api/admin/settings', { method: 'POST', key: KEY, body: { madeShow: false } }); const [hs, ho, hp, hph, hpa, ha] = await Promise.all([call('/api/stories'), call('/api/stories/DA-7K2Q'), call('/api/posters'), call(`/api/photos/${s1.json.id}`), call('/api/talk?s=p.DA-7K2Q&who=K7Q'), call('/api/admin/stories?status=shown', { key: KEY })]);
    check('switched off, visitors see nothing made (no stories, posters, photographs or poster talk), the approval page still sees it all', hs.json.stories.length === 0 && ho.status === 404 && hp.json.posters.length === 0 && hph.status === 404 && hpa.status >= 400 && ha.json.stories.length > 0, [hs.json.stories.length, ho.status, hp.json.posters.length, hph.status, hpa.status, ha.json.stories.length].join());
    await call('/api/admin/settings', { method: 'POST', key: KEY, body: { madeShow: true } }); }
  /* a tape: kept on novel.global to be saved from any phone, under its one name, and refused without a code or a proper name */
  { const up = (q, t = 'audio/wav') => server.fetch(new URL('/api/tapes?' + q, O), { method: 'POST', headers: { origin: O, 'content-type': t }, body: Buffer.alloc(2048, 7) });
    const a = await up('who=K7Q&name=novel-global-tape-carlton-ab12.wav'), aj = a.status === 201 ? await a.json() : {}, g = aj.url ? await server.fetch(new URL(aj.url, O)) : null;
    const no1 = (await up('who=&name=novel-global-tape-x-ab12.wav')).status, no2 = (await up('who=K7Q&name=song.wav')).status, no3 = (await up('who=K7Q&name=novel-global-tape-x-ab12.wav', 'text/html')).status;
    const cd = g ? g.headers.get('content-disposition') : '', len = g ? (await g.arrayBuffer()).byteLength : 0;
    check('a tape is kept for half a moon and saved under its one name; without a code, a proper name or a sound it is refused', a.status === 201 && aj.until - Date.now() > 13 * 864e5 && g && g.status === 200 && /novel-global-tape-carlton-ab12.wav/.test(cd) && len === 2048 && no1 === 400 && no2 === 400 && no3 === 400, JSON.stringify({ s: a.status, cd, len, no1, no2, no3 })); }
  /* a card's pictures: only the approval page puts them up; a picture or nothing, kept in its slot, listed with how fast they turn */
  { const put = (p, b, k) => server.fetch(new URL(p, O), { method: 'PUT', headers: { origin: O, ...(k ? { authorization: `Bearer ${k}` } : {}) }, body: b });
    const no = (await put('/api/admin/cards/wish/0', JPEG_B)).status, bad = (await put('/api/admin/cards/wish/0', Buffer.from('<html>'), KEY)).status, ok = (await put('/api/admin/cards/wish/3', JPEG_B, KEY)).status;
    await call('/api/admin/cards/wish', { method: 'POST', key: KEY, body: { speed: 8 } });
    const l = (await call('/api/cards')).json.cards.wish || {}, pic = l.pics && l.pics[0] ? await call(l.pics[0]) : {};
    const del = (await call('/api/admin/cards/wish/3', { method: 'DELETE', key: KEY })).status, after = ((await call('/api/cards')).json.cards.wish || {}).pics || [];
    check('a card\'s pictures: only the approval page puts them up, only pictures, listed by slot with their speed, and taken down again', (no === 401 || no === 429) && bad === 415 && ok === 200 && /\/api\/cards\/wish\/3\?/.test(l.pics[0]) && l.speed === 8 && pic.status === 200 && del === 200 && after.length === 0, JSON.stringify({ no, bad, ok, l, p: pic.status, del, after })); }
  let last = 0; for (let i = 0; i < 21; i++) last = (await call('/api/stories', { method: 'POST', body: story('DA-2' + 'ABCDEFGHJKMNPQRSTVWXY'[i] + 'QR') })).status;
  check('a visitor sending too many in ten minutes is asked to wait', last === 429, String(last));
} catch (e) { results.push(`FAIL  api: ${e.stack || e.message}`); }
await server.close();
console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
