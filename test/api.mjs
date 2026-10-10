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
  const t = r.headers.get('content-type') || ''; return { status: r.status, type: t, json: /json/.test(t) ? await r.json() : null, text: /text/.test(t) ? await r.text() : null };
};
const SIG = Buffer.from(JSON.stringify({ c: 'DA-7K2Q', t: 'hs0d7', p: [-37.77, 144.96, 'bird', 'Noisy Miner', 'Manorina melanocephala', 'BRUNSWICK', 0], l: ['A line', '', '', ''], k: [], e: [] })).toString('base64url');
const JPEG = 'data:image/jpeg;base64,' + Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xFF, 0xD9]).toString('base64');
const story = (code, extra = {}) => ({ kind: 'story', code, body: SIG, lat: -37.77, lng: 144.96, ...extra });

try {
  const h = await call('/api/health');
  check('health answers ok with the build', h.status === 200 && /^ok \w+/.test(h.text), h.text);
  const pa = await call('/api/partners');
  check('every partner place has a print queue, none paired yet', pa.status === 200 && ['pickles', 'kines', 'elsie'].every(id => pa.json.partners.some(p => p.id === id && !p.paired && !p.ready)), JSON.stringify(pa.json));

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
  const pub1 = await call('/api/stories'); const one1 = await call('/api/stories/DA-7K2Q'); const ph1 = await call(`/api/photos/${s1.json.id}`); const r1 = await call(`/api/receipts/${s1.json.id}`);
  check('approved: it is shown to everyone, with its photograph, and its print joins the queue', pub1.json.stories.length === 1 && pub1.json.stories[0].body === SIG && one1.status === 200 && ph1.status === 200 && ph1.type === 'image/jpeg' && r1.json.job.status === 'queued' && r1.json.job.ahead === 0, JSON.stringify({ n: pub1.json.stories.length, r: r1.json }));

  /* the receiver at Pickles pulls it, prints it, and says so */
  const j1 = await call('/api/printers/pickles/next', { token: T }); const j2 = await call('/api/printers/pickles/next', { token: T });
  check('the printer takes the job, with its ESC/POS bytes and its mesh line; nobody else gets it while it prints', j1.status === 200 && j1.json.code === 'DA-7K2Q' && j1.json.escpos && j1.json.mesh === null && j2.status === 204, JSON.stringify({ j1: j1.json && { ...j1.json, escpos: !!j1.json.escpos }, j2: j2.status }));
  await call(`/api/printers/pickles/jobs/${j1.json.job}`, { method: 'POST', token: T, body: { status: 'printed' } });
  const r2 = await call(`/api/receipts/${s1.json.id}`);
  check('and once printed, the sender sees it printed', r2.json.job.status === 'printed' && !!r2.json.job.done, JSON.stringify(r2.json));

  /* refused: never shown, never printed */
  const s2 = await call('/api/stories', { method: 'POST', body: story('DA-8M3R', { dest: 'pickles', escpos: 'G0A=' }) });
  await call(`/api/admin/stories/${s2.json.id}`, { method: 'POST', key: KEY, body: { action: 'refuse' } });
  const r3 = await call(`/api/receipts/${s2.json.id}`); const one3 = await call('/api/stories/DA-8M3R'); const n3 = await call('/api/printers/pickles/next', { token: T });
  check('refused: never shown, never printed', r3.json.status === 'refused' && !r3.json.job && one3.status === 404 && n3.status === 204, JSON.stringify({ r3: r3.json, one: one3.status, next: n3.status }));

  /* a printer trusted to print without approval */
  await call('/api/admin/printers/kines', { method: 'POST', key: KEY, body: { action: 'auto', on: true } });
  const s4 = await call('/api/stories', { method: 'POST', body: story('DA-9N4S', { dest: 'kines', escpos: 'G0A=' }) });
  check('a printer set to print without approval queues at once; the story still waits to be shown', s4.json.job.status === 'queued' && (await call('/api/stories/DA-9N4S')).status === 404, JSON.stringify(s4.json));

  /* what is refused at the door */
  const bad = await Promise.all([
    call('/api/stories', { method: 'POST', body: story('DA-IIII') }),
    call('/api/stories', { method: 'POST', body: story('DA-1234', { body: '<script>' }) }),
    call('/api/stories', { method: 'POST', body: story('DA-1234', { dest: 'nowhere' }) }),
    call('/api/stories', { method: 'POST', body: story('DA-1234', { photo: 'data:image/png;base64,AAAA' }) }),
    call('/api/stories', { method: 'POST', body: story('DA-1234'), origin: 'https://elsewhere.example' }),
    call('/api/stories', { method: 'POST', raw: '{"kind":"story",' + '"x":"' + 'a'.repeat(1000000) + '"}' }),
  ]);
  check('a bad code, a bad story, an unknown place, a photograph not a JPEG, another site, too large: each refused', bad.map(b => b.status).join(',') === '400,400,400,400,403,413', bad.map(b => b.status).join(','));
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
  } else results.push('SKIP  the receiver: no Python here');
  let last = 0; for (let i = 0; i < 9; i++) last = (await call('/api/stories', { method: 'POST', body: story('DA-2' + 'ABCDEFGHJ'[i] + 'QR') })).status;
  check('a visitor sending too many in ten minutes is asked to wait', last === 429, String(last));
} catch (e) { results.push(`FAIL  api: ${e.stack || e.message}`); }
await server.close();
console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
