/* Direct Action · the Worker. Cloudflare serves any file in dist/ before this runs; everything else arrives here.

   /api/ is the app's own server, on one small database (D1):
   · stories people send: each waits for approval before anyone else sees it, or any printer prints it
   · the print queue of each partner place, which the receiver there (a Raspberry Pi) pulls from
   · the approval page's requests, behind the ADMIN_KEY secret

   Kept to a minimum: no accounts, no addresses kept. A sender's network address is only ever counted, hashed with a
   salt that changes each day, and forgotten within the hour. A story not approved within 30 days is deleted; a print
   job waits a day at most, and once printed only its status is kept, for a week. A preview build has its own database. */
import { BUILD, PREVIEW, PARTNERS } from './stamp.js';

const JSON_H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const TEXT_H = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: JSON_H });
const fail = (status, error) => json({ error }, status);
const now = () => Date.now();
const H = 3600e3, DAY = 24 * H;
const LIMIT = { body: 900e3, sig: 9000, record: 6000, cells: 60e3, cellsN: 200, photo: 420e3, escpos: 420e3, mesh: 240, waiting: 300, perPrinter: 20 };
/* a pack of cells: up to 200, each with a place on the ground and a short name */
const cellsOk = t => { if (typeof t !== 'string' || t.length > LIMIT.cells) return false; let d; try { d = JSON.parse(t); } catch (e) { return false; }
  return !!d && Array.isArray(d.cells) && d.cells.length >= 1 && d.cells.length <= LIMIT.cellsN && d.cells.every(c => c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180 && typeof c.n === 'string' && c.n.length <= 80); };
const CODE = /^DA-[0-9A-HJKMNP-TV-Z]{4}$/;

/* ───────── the database: made on first use, the same in a preview's database and the live one ───────── */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS stories (id TEXT PRIMARY KEY, code TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL,
     photo BLOB, lat REAL, lng REAL, dest TEXT, created INTEGER NOT NULL, decided INTEGER)`,
  `CREATE INDEX IF NOT EXISTS stories_status ON stories(status, decided)`,
  `CREATE INDEX IF NOT EXISTS stories_code ON stories(code)`,
  `CREATE TABLE IF NOT EXISTS printers (id TEXT PRIMARY KEY, name TEXT, paper TEXT, mesh INTEGER DEFAULT 0, auto INTEGER DEFAULT 0, token TEXT, seen INTEGER, created INTEGER)`,
  `CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, printer TEXT NOT NULL, story TEXT, code TEXT, escpos TEXT, mesh TEXT, status TEXT NOT NULL,
     lease INTEGER, tries INTEGER DEFAULT 0, error TEXT, created INTEGER NOT NULL, done INTEGER)`,
  `CREATE INDEX IF NOT EXISTS jobs_queue ON jobs(printer, status, created)`,
  `CREATE TABLE IF NOT EXISTS hits (k TEXT NOT NULL, t INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS hits_k ON hits(k, t)`,
];
const readied = new WeakMap();
function ready(db) {
  if (!readied.has(db)) readied.set(db, (async () => {
    await db.batch(SCHEMA.map(q => db.prepare(q)));
    /* live: shown online on the map, switched on the approval page (a column added after the first release) */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN live INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* every partner place has a print queue from the start; a printer joins it when its token is made on the approval page */
    if (PARTNERS.length) await db.batch(PARTNERS.map(p => db.prepare('INSERT OR IGNORE INTO printers (id, name, paper, created) VALUES (?, ?, ?, ?)').bind(p.id, p.n, p.paper, now())));
  })().catch(e => { readied.delete(db); throw e; }));
  return readied.get(db);
}
/* a preview keeps to its own database, so testing never reaches real stories or a real printer */
const dbOf = env => (PREVIEW && env.DB_PREVIEW) || env.DB;

/* ───────── small tools ───────── */
const enc = new TextEncoder();
async function sha256(s) { const d = await crypto.subtle.digest('SHA-256', enc.encode(s)); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
const rid = (n = 16) => { const a = crypto.getRandomValues(new Uint8Array(n)); return [...a].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); };
async function same(a, b) { const [x, y] = await Promise.all([sha256(String(a)), sha256(String(b))]); return crypto.subtle.timingSafeEqual ? crypto.subtle.timingSafeEqual(enc.encode(x), enc.encode(y)) : x === y; }
const bearer = req => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
const b64ok = (s, max) => typeof s === 'string' && s.length <= max && /^[A-Za-z0-9+/=_-]*$/.test(s);
function dataURL(s) { const m = typeof s === 'string' && s.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/); if (!m || m[1].length > LIMIT.photo) return null; const bin = atob(m[1]); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out[0] === 0xFF && out[1] === 0xD8 ? out : null; }
async function body(req) {
  const n = +(req.headers.get('content-length') || 0); if (n > LIMIT.body) throw Object.assign(new Error('too large'), { status: 413 });
  const t = await req.text(); if (t.length > LIMIT.body) throw Object.assign(new Error('too large'), { status: 413 });
  try { return JSON.parse(t || '{}'); } catch (e) { throw Object.assign(new Error('not json'), { status: 400 }); }
}
/* how often a visitor has asked: counted under a hash that changes daily, kept an hour */
async function tooMany(db, env, req, kind, max, windowMs) {
  const ip = req.headers.get('cf-connecting-ip') || 'local'; const day = new Date().toISOString().slice(0, 10);
  const k = `${kind}:${(await sha256(`${ip}|${day}|${env.ADMIN_KEY || ''}|direct-action`)).slice(0, 24)}`; const t = now();
  const { n } = await db.prepare('SELECT count(*) AS n FROM hits WHERE k = ? AND t > ?').bind(k, t - windowMs).first();
  if (n >= max) return true;
  await db.prepare('INSERT INTO hits (k, t) VALUES (?, ?)').bind(k, t).run(); return false;
}
/* the housekeeping, now and then: what has waited too long goes, and what was printed keeps only its status */
async function tidy(db) {
  const t = now();
  await db.batch([
    db.prepare('DELETE FROM hits WHERE t < ?').bind(t - H),
    db.prepare("UPDATE jobs SET status = 'expired', escpos = NULL, mesh = NULL, done = ? WHERE status IN ('held', 'queued') AND created < ?").bind(t, t - DAY),
    db.prepare("UPDATE jobs SET escpos = NULL, mesh = NULL WHERE status IN ('printed', 'failed', 'expired') AND escpos IS NOT NULL"),
    db.prepare('DELETE FROM jobs WHERE done IS NOT NULL AND done < ?').bind(t - 7 * DAY),
    db.prepare("DELETE FROM stories WHERE status IN ('waiting', 'refused') AND created < ?").bind(t - 30 * DAY),
  ]);
}

/* ───────── what the public sees ───────── */
const storyOut = r => ({ id: r.id, code: r.code, kind: r.kind, body: r.body, photo: !!r.has_photo, dest: r.dest || '', at: r.decided || r.created });
const PUBLIC_COLS = 'id, code, kind, body, dest, created, decided, photo IS NOT NULL AS has_photo';

async function listStories(db, url) {
  const since = Math.max(0, +(url.searchParams.get('since') || 0));
  const { results } = await db.prepare(`SELECT ${PUBLIC_COLS} FROM stories WHERE status = 'shown' AND decided > ? ORDER BY decided DESC LIMIT 200`).bind(since).all();
  return json({ stories: results.map(storyOut), at: now() });
}
async function oneStory(db, code) {
  const r = await db.prepare(`SELECT ${PUBLIC_COLS} FROM stories WHERE status = 'shown' AND code = ? ORDER BY decided DESC LIMIT 1`).bind(code).first();
  return r ? json({ story: storyOut(r) }) : fail(404, 'not found');
}
async function photo(db, id, any) {
  const r = await db.prepare(`SELECT photo, status FROM stories WHERE id = ?`).bind(id).first();
  if (!r || !r.photo || (!any && r.status !== 'shown')) return fail(404, 'not found');
  return new Response(new Uint8Array(r.photo), { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=3600', 'x-content-type-options': 'nosniff' } });
}
/* a story sent: it waits for approval. A job for the partner's printer waits with it, unless that printer prints without approval.
   dest 'mesh': no print, only its mesh line, to every paired printer whose radio is on (MESH), to go out over the local mesh */
async function send(db, env, req) {
  if (await tooMany(db, env, req, 'send', 8, 10 * 60e3)) return fail(429, 'too many');
  const b = await body(req); const kind = b.kind === 'record' || b.kind === 'cells' ? b.kind : 'story';
  if (!CODE.test(b.code || '')) return fail(400, 'code');
  if (kind === 'story' && !(typeof b.body === 'string' && /^[A-Za-z0-9_-]{20,}$/.test(b.body) && b.body.length <= LIMIT.sig)) return fail(400, 'story');
  if (kind === 'record' && !(typeof b.body === 'string' && b.body.length <= LIMIT.record && (() => { try { return typeof JSON.parse(b.body) === 'object'; } catch (e) { return false; } })())) return fail(400, 'record');
  if (kind === 'cells' && (!cellsOk(b.body) || b.dest || b.photo)) return fail(400, 'cells');
  const lat = +b.lat, lng = +b.lng; if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail(400, 'where');
  const pic = b.photo ? dataURL(b.photo) : null; if (b.photo && !pic) return fail(400, 'photo');
  const dest = typeof b.dest === 'string' && b.dest ? b.dest : ''; const toMesh = dest === 'mesh';
  const P = dest && !toMesh ? await db.prepare('SELECT * FROM printers WHERE id = ?').bind(dest).first() : null;
  if (dest && !toMesh && !P) return fail(400, 'dest');
  if (toMesh && !(typeof b.mesh === 'string' && b.mesh)) return fail(400, 'mesh');
  if (dest && b.escpos != null && !b64ok(b.escpos, LIMIT.escpos)) return fail(400, 'escpos');
  if (b.mesh != null && (typeof b.mesh !== 'string' || enc.encode(b.mesh).length > LIMIT.mesh)) return fail(400, 'mesh');
  const { n } = await db.prepare("SELECT count(*) AS n FROM stories WHERE status = 'waiting'").first(); if (n >= LIMIT.waiting) return fail(503, 'busy');
  const id = rid(); const t = now(); const ops = [db.prepare('INSERT INTO stories (id, code, kind, status, body, photo, lat, lng, dest, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, b.code, kind, 'waiting', b.body, pic, lat, lng, dest || null, t)];
  let job = null;
  if (P && (b.escpos || b.mesh)) {
    const { q } = await db.prepare("SELECT count(*) AS q FROM jobs WHERE printer = ? AND status IN ('held', 'queued', 'printing')").bind(dest).first(); if (q >= LIMIT.perPrinter) return fail(503, 'queue full');
    job = { id: rid(), status: P.auto ? 'queued' : 'held' };
    ops.push(db.prepare('INSERT INTO jobs (id, printer, story, code, escpos, mesh, status, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(job.id, dest, id, b.code, b.escpos || null, P.mesh ? (b.mesh || null) : null, job.status, t));
  }
  if (toMesh) {
    const { results: radios } = await db.prepare(`SELECT p.id, p.auto, (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('held', 'queued', 'printing')) AS q
      FROM printers p WHERE p.mesh = 1 AND p.token IS NOT NULL`).all();
    for (const r of radios) { if (r.q >= LIMIT.perPrinter) continue; const jb = { id: rid(), status: r.auto ? 'queued' : 'held' }; job = job || jb;
      ops.push(db.prepare('INSERT INTO jobs (id, printer, story, code, escpos, mesh, status, created) VALUES (?, ?, ?, ?, NULL, ?, ?, ?)').bind(jb.id, r.id, id, b.code, b.mesh, jb.status, t)); }
  }
  await db.batch(ops);
  return json({ id, status: 'waiting', job }, 201);
}
/* the sender's receipt: where their story is, and where its print is in the queue */
async function receipt(db, id) {
  const s = await db.prepare('SELECT id, code, status, dest FROM stories WHERE id = ?').bind(id).first(); if (!s) return fail(404, 'not found');
  const j = await db.prepare('SELECT id, printer, status, created, done FROM jobs WHERE story = ? ORDER BY created DESC LIMIT 1').bind(id).first();
  let ahead = 0; if (j && j.status === 'queued') ({ ahead } = await db.prepare("SELECT count(*) AS ahead FROM jobs WHERE printer = ? AND status IN ('queued', 'printing') AND created < ?").bind(j.printer, j.created).first());
  return json({ id, code: s.code, status: s.status, dest: s.dest || '', job: j ? { status: j.status, ahead, done: j.done || null } : null });
}
/* the partner places: whether a printer is there and listening, and how much it has printed */
async function partners(db) {
  const { results } = await db.prepare(`SELECT p.id, p.name, p.paper, p.mesh, p.live, p.token IS NOT NULL AS paired, p.seen,
      (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('queued', 'printing')) AS queued,
      (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'printed') AS printed FROM printers p ORDER BY p.created`).all();
  return json({ partners: results.map(p => ({ id: p.id, name: p.name, paper: p.paper, paired: !!p.paired, mesh: !!p.mesh && !!p.paired, live: !!p.live, ready: !!p.seen && now() - p.seen < 2 * 60e3, queued: p.queued, printed: p.printed })) });
}

/* ───────── a printer's receiver: it asks for the next job, prints it, and says how it went ───────── */
async function printerAuth(db, req, id) {
  const p = await db.prepare('SELECT * FROM printers WHERE id = ?').bind(id).first(); const tok = bearer(req);
  if (!p || !p.token || !tok || !(await same(await sha256(tok), p.token))) return null;
  await db.prepare('UPDATE printers SET seen = ? WHERE id = ?').bind(now(), id).run(); return p;
}
async function next(db, req, id) {
  if (!(await printerAuth(db, req, id))) return fail(401, 'token');
  const t = now();
  /* the oldest job waiting, or one whose printer went quiet while printing it: taken for a minute */
  const j = await db.prepare("SELECT * FROM jobs WHERE printer = ? AND (status = 'queued' OR (status = 'printing' AND lease < ?)) ORDER BY created LIMIT 1").bind(id, t).first();
  if (!j) return new Response(null, { status: 204, headers: TEXT_H });
  if (j.tries >= 5) { await db.prepare("UPDATE jobs SET status = 'failed', error = 'tried five times', done = ? WHERE id = ?").bind(t, j.id).run(); return new Response(null, { status: 204, headers: TEXT_H }); }
  await db.prepare("UPDATE jobs SET status = 'printing', lease = ?, tries = tries + 1 WHERE id = ?").bind(t + 60e3, j.id).run();
  return json({ job: j.id, code: j.code, escpos: j.escpos || null, mesh: j.mesh || null });
}
async function report(db, req, id, job) {
  if (!(await printerAuth(db, req, id))) return fail(401, 'token');
  const b = await body(req); const ok = b.status === 'printed'; if (!ok && b.status !== 'failed') return fail(400, 'status');
  await db.prepare(`UPDATE jobs SET status = ?, error = ?, done = ?, escpos = NULL, mesh = NULL WHERE id = ? AND printer = ? AND status = 'printing'`).bind(ok ? 'printed' : 'failed', ok ? null : String(b.error || '').slice(0, 200), now(), job, id).run();
  return json({ ok: true });
}

/* ───────── the approval page: everything waiting, shown, refused; the printers and their tokens ───────── */
async function adminAuth(db, env, req) {
  if (!env.ADMIN_KEY) return fail(503, 'set the ADMIN_KEY secret in Cloudflare first');
  if (await same(bearer(req), env.ADMIN_KEY)) return null;
  if (await tooMany(db, env, req, 'admin', 10, 10 * 60e3)) return fail(429, 'too many');
  return fail(401, 'password');
}
async function admin(db, env, req, parts) {
  const no = await adminAuth(db, env, req); if (no) return no;
  const [what, id] = parts;
  if (what === 'stories' && !id && req.method === 'GET') {
    const st = ['waiting', 'shown', 'refused'].includes(new URL(req.url).searchParams.get('status')) ? new URL(req.url).searchParams.get('status') : 'waiting';
    const { results } = await db.prepare(`SELECT s.id, s.code, s.kind, s.status, s.body, s.lat, s.lng, s.dest, s.created, s.decided, s.photo IS NOT NULL AS has_photo,
        (SELECT j.status FROM jobs j WHERE j.story = s.id ORDER BY j.created DESC LIMIT 1) AS job FROM stories s WHERE s.status = ? ORDER BY s.created DESC LIMIT 200`).bind(st).all();
    return json({ stories: results.map(r => ({ ...r, photo: !!r.has_photo, has_photo: undefined })) });
  }
  if (what === 'stories' && id && req.method === 'POST') {
    const b = await body(req); const t = now();
    if (b.action === 'show') { await db.batch([db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = ?").bind(t, id), db.prepare("UPDATE jobs SET status = 'queued' WHERE story = ? AND status = 'held'").bind(id)]); return json({ ok: true }); }
    if (b.action === 'refuse') { await db.batch([db.prepare("UPDATE stories SET status = 'refused', decided = ?, photo = NULL WHERE id = ?").bind(t, id), db.prepare("DELETE FROM jobs WHERE story = ? AND status IN ('held', 'queued')").bind(id)]); return json({ ok: true }); }
    if (b.action === 'delete') { await db.batch([db.prepare('DELETE FROM jobs WHERE story = ?').bind(id), db.prepare('DELETE FROM stories WHERE id = ?').bind(id)]); return json({ ok: true }); }
    return fail(400, 'action');
  }
  if (what === 'photos' && id) return photo(db, id, true);
  if (what === 'printers' && !id) {
    const { results } = await db.prepare(`SELECT p.id, p.name, p.paper, p.mesh, p.auto, p.live, p.token IS NOT NULL AS paired, p.seen,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'held') AS held,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('queued', 'printing')) AS queued,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'printed') AS printed,
        (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'failed') AS failed FROM printers p ORDER BY p.created`).all();
    return json({ printers: results });
  }
  if (what === 'printers' && id && req.method === 'POST') {
    const b = await body(req); const p = await db.prepare('SELECT id FROM printers WHERE id = ?').bind(id).first(); if (!p) return fail(404, 'not found');
    /* a printer's token is shown once, here, and kept only as a hash */
    if (b.action === 'token') { const tok = rid(32); await db.prepare('UPDATE printers SET token = ? WHERE id = ?').bind(await sha256(tok), id).run(); return json({ token: tok }); }
    if (b.action === 'unpair') { await db.prepare('UPDATE printers SET token = NULL, seen = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); }
    if (b.action === 'auto' || b.action === 'mesh' || b.action === 'live') { await db.prepare(`UPDATE printers SET ${b.action} = ? WHERE id = ?`).bind(b.on ? 1 : 0, id).run(); return json({ ok: true }); }
    if (b.action === 'paper' && ['58', '80'].includes(String(b.paper))) { await db.prepare('UPDATE printers SET paper = ? WHERE id = ?').bind(String(b.paper), id).run(); return json({ ok: true }); }
    if (b.action === 'test') { await db.prepare("INSERT INTO jobs (id, printer, code, mesh, status, created) VALUES (?, ?, 'DA-TEST', ?, 'queued', ?)").bind(rid(), id, 'DIRECT ACTION - test print', now()).run(); return json({ ok: true }); }
    return fail(400, 'action');
  }
  return fail(404, 'not found');
}

/* ───────── the router ───────── */
async function api(req, env, url) {
  const db = dbOf(env); if (!db) return fail(503, 'no database');
  await ready(db); if (Math.random() < 0.05) await tidy(db);
  const p = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean).map(decodeURIComponent); const m = req.method;
  if (p[0] === 'stories' && !p[1] && m === 'GET') return listStories(db, url);
  if (p[0] === 'stories' && !p[1] && m === 'POST') return send(db, env, req);
  if (p[0] === 'stories' && p[1] && m === 'GET') return CODE.test(p[1]) ? oneStory(db, p[1]) : fail(400, 'code');
  if (p[0] === 'receipts' && p[1] && m === 'GET') return receipt(db, p[1]);
  if (p[0] === 'photos' && p[1] && m === 'GET') return photo(db, p[1], false);
  if (p[0] === 'partners' && m === 'GET') return partners(db);
  if (p[0] === 'printers' && p[1] && p[2] === 'next' && m === 'GET') return next(db, req, p[1]);
  if (p[0] === 'printers' && p[1] && p[2] === 'jobs' && p[3] && m === 'POST') return report(db, req, p[1], p[3]);
  if (p[0] === 'admin') return admin(db, env, req, p.slice(1));
  return fail(404, 'not found');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return new Response(`ok ${BUILD}${PREVIEW ? ' preview' : ''}`, { headers: TEXT_H });
    if (url.pathname.startsWith('/api/')) {
      /* the app's own pages only: a request from another site is refused */
      const origin = request.headers.get('origin'); if (origin && request.method !== 'GET' && origin !== url.origin) return fail(403, 'origin');
      try { return await api(request, env, url); } catch (e) { return fail(e.status || 500, e.status ? e.message : 'error'); }
    }
    return env.ASSETS.fetch(request);
  },
};
