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
const LIMIT = { example: 700e3, body: 2.4e6, sig: 9000, record: 20e3, cells: 60e3, cellsN: 200, photo: 420e3, escpos: 900e3, mesh: 240, waiting: 2000, perPrinter: 20, sends: 20 };
/* a pack of cells: up to 200, each with a place on the ground and a short name */
const cellsOk = t => { if (typeof t !== 'string' || t.length > LIMIT.cells) return false; let d; try { d = JSON.parse(t); } catch (e) { return false; }
  return !!d && Array.isArray(d.cells) && d.cells.length >= 1 && d.cells.length <= LIMIT.cellsN && d.cells.every(c => c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180 && typeof c.n === 'string' && c.n.length <= 80); };
const CODE = /^DA-[0-9A-HJKMNP-TV-Z]{4}$/;
/* a maker's own three characters (no I, O, 0 or 1), printed on what they make: with it they find and take down their own things */
const WHO = /^[A-HJ-NP-Z2-9]{3}$/;

/* ───────── the database: made on first use, the same in a preview's database and the live one ───────── */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS stories (id TEXT PRIMARY KEY, code TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL,
     photo BLOB, lat REAL, lng REAL, dest TEXT, created INTEGER NOT NULL, decided INTEGER)`,
  `CREATE INDEX IF NOT EXISTS stories_status ON stories(status, decided)`,
  `CREATE INDEX IF NOT EXISTS stories_code ON stories(code)`,
  /* a maker by their three characters: when first and last seen, how many sent, the stage they were at (for the approval page only) */
  `CREATE TABLE IF NOT EXISTS makers (who TEXT PRIMARY KEY, first INTEGER NOT NULL, last INTEGER NOT NULL, posts INTEGER NOT NULL DEFAULT 0, stage TEXT)`,
  /* the board: a few words by a maker (shown by their kin, never their code), in one of the journey's four sections, or a reply to one */
  `CREATE TABLE IF NOT EXISTS talk (id TEXT PRIMARY KEY, sec TEXT NOT NULL, who TEXT NOT NULL, text TEXT NOT NULL, re TEXT, at INTEGER NOT NULL, hidden INTEGER)`,
  `CREATE INDEX IF NOT EXISTS talk_sec ON talk(sec, at)`,
  `CREATE TABLE IF NOT EXISTS printers (id TEXT PRIMARY KEY, name TEXT, paper TEXT, mesh INTEGER DEFAULT 0, auto INTEGER DEFAULT 0, token TEXT, seen INTEGER, created INTEGER)`,
  `CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, printer TEXT NOT NULL, story TEXT, code TEXT, escpos TEXT, mesh TEXT, status TEXT NOT NULL,
     lease INTEGER, tries INTEGER DEFAULT 0, error TEXT, created INTEGER NOT NULL, done INTEGER)`,
  `CREATE INDEX IF NOT EXISTS jobs_queue ON jobs(printer, status, created)`,
  `CREATE TABLE IF NOT EXISTS hits (k TEXT NOT NULL, t INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, slug TEXT UNIQUE, title TEXT NOT NULL, summary TEXT, body TEXT, cat TEXT, links TEXT, day TEXT, status TEXT NOT NULL DEFAULT 'draft', cover BLOB, created INTEGER, updated INTEGER)`,
  `CREATE INDEX IF NOT EXISTS hits_k ON hits(k, t)`,
  /* OpenStreetMap as asked of Overpass, kept a tile at a time for everyone: a tile's elements as JSON, and when they came */
  `CREATE TABLE IF NOT EXISTS osm (k TEXT PRIMARY KEY, body TEXT NOT NULL, at INTEGER NOT NULL)`,
  /* stage 5: the listed places of the human ecology, beyond the ones written into places.js: added on the approval page, or
     suggested by anyone and waiting there until shown */
  `CREATE TABLE IF NOT EXISTS places (id TEXT PRIMARY KEY, n TEXT NOT NULL, cat TEXT, role TEXT, addr TEXT, sub TEXT, url TEXT, what TEXT,
     lat REAL NOT NULL, lng REAL NOT NULL, status TEXT NOT NULL, src TEXT, created INTEGER NOT NULL, decided INTEGER)`,
  `CREATE INDEX IF NOT EXISTS places_status ON places(status, decided)`,
  /* traffic: how many of each thing happened on a day, nothing more (no addresses, no visitors told apart) */
  `CREATE TABLE IF NOT EXISTS traffic (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))`,
];
const readied = new WeakMap();
function ready(db) {
  if (!readied.has(db)) readied.set(db, (async () => {
    await db.batch(SCHEMA.map(q => db.prepare(q)));
    /* live: shown online on the map, switched on the approval page (a column added after the first release) */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN live INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* star: a story the approval page holds up, first on the board */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN star INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* who: the maker's three characters; gone: when its maker took it down (off the site, still all here on the approval page) */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN who TEXT').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE stories ADD COLUMN gone INTEGER').run(); } catch (e) { /* already there */ }
    /* thumb: a small one-bit picture of the print, "w,h,base64", for the touch screen to show while it waits */
    try { await db.prepare('ALTER TABLE jobs ADD COLUMN thumb TEXT').run(); } catch (e) { /* already there */ }
    /* origin: where a story came from, for the approval page only: the page, the city and country Cloudflare saw (never the address), phone or computer, the stage, its mesh line */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN origin TEXT').run(); } catch (e) { /* already there */ }
    /* lv: the furthest a maker's journey has reached (0 to 4), so a code typed on another phone brings it back */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN lv INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* kin: each maker's own species and mark, handed out in turn so no two share one (0, 1, 2 ...) */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN kin INTEGER').run(); } catch (e) { /* already there */ }
    /* can: what a printer's receiver says it can do besides print ('off'); off: when TURN OFF was pressed for it */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN can TEXT').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN off INTEGER').run(); } catch (e) { /* already there */ }
    /* touch: the hash of a small touch screen's token; while set, that screen is where a held slip is printed or squashed */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN touch TEXT').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN touch_seen INTEGER').run(); } catch (e) { /* already there */ }
    /* the Wi-Fi each is on and how strongly, as each last said (JSON: { n, rssi, at }); and a Wi-Fi setup asked for */
    for (const col of ['net TEXT', 'touch_net TEXT', 'wifi INTEGER']) { try { await db.prepare(`ALTER TABLE printers ADD COLUMN ${col}`).run(); } catch (e) { /* already there */ } }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN refused TEXT').run(); } catch (e) { /* already there */ }
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
    db.prepare("DELETE FROM stories WHERE status IN ('waiting', 'refused', 'deleted') AND created < ?").bind(t - 365 * DAY),
    db.prepare('DELETE FROM traffic WHERE day < ?').bind(new Date(t - 400 * DAY).toISOString().slice(0, 10)),
    db.prepare('DELETE FROM osm WHERE at < ?').bind(t - 45 * DAY),
    db.prepare("DELETE FROM places WHERE status IN ('waiting', 'refused', 'deleted') AND created < ?").bind(t - 365 * DAY),
  ]);
}

/* ───────── what the public sees ───────── */
const storyOut = r => ({ id: r.id, code: r.code, kind: r.kind, body: r.body, photo: !!r.has_photo, dest: r.dest || '', at: r.decided || r.created, star: !!r.star, printed: r.printed || 0 });
const PUBLIC_COLS = "id, code, kind, body, dest, created, decided, photo IS NOT NULL AS has_photo, star, (SELECT count(*) FROM jobs j WHERE j.story = stories.id AND j.status = 'printed') AS printed";

async function listStories(db, url) {
  const since = Math.max(0, +(url.searchParams.get('since') || 0));
  const { results } = await db.prepare(`SELECT ${PUBLIC_COLS} FROM stories WHERE status = 'shown' AND gone IS NULL AND kind NOT IN ('example', 'message') AND decided > ? ORDER BY decided DESC LIMIT 200`).bind(since).all();
  return json({ stories: results.map(storyOut), at: now() });
}
/* the example board everyone sees: the latest one approved, or none (then the example built into the site stands) */
async function exampleBoard(db) {
  const r = await db.prepare("SELECT body, decided FROM stories WHERE kind = 'example' AND status = 'shown' ORDER BY decided DESC LIMIT 1").first();
  let board = null; try { board = r ? JSON.parse(r.body) : null; } catch (e) { board = null; }
  return json({ board, at: r ? r.decided : 0 });
}
async function oneStory(db, code) {
  const r = await db.prepare(`SELECT ${PUBLIC_COLS} FROM stories WHERE status = 'shown' AND gone IS NULL AND kind != 'message' AND code = ? ORDER BY decided DESC LIMIT 1`).bind(code).first();
  return r ? json({ story: storyOut(r) }) : fail(404, 'not found');
}
async function photo(db, id, any) {
  const r = await db.prepare(`SELECT photo, status, kind, gone FROM stories WHERE id = ?`).bind(id).first();
  if (!r || !r.photo || (!any && (r.status !== 'shown' || r.gone || r.kind === 'message'))) return fail(404, 'not found');
  return new Response(new Uint8Array(r.photo), { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=3600', 'x-content-type-options': 'nosniff' } });
}
/* a maker's own, by their three characters: what they sent (the words only of what is on the site), and taking one down.
   Taken down is off the site only: the approval page keeps it as it was. Asked too often from one place, it waits */
/* a maker's kin, given if they have none yet (makers from before kin, or one only known by a code typed) */
async function kinOf(db, who) {
  let mk = await db.prepare('SELECT lv, kin FROM makers WHERE who = ?').bind(who).first(); if (!mk) return null;
  if (mk.kin == null) { await db.prepare('UPDATE makers SET kin = (SELECT COALESCE(MAX(kin), -1) + 1 FROM makers) WHERE who = ? AND kin IS NULL').bind(who).run(); mk = await db.prepare('SELECT lv, kin FROM makers WHERE who = ?').bind(who).first(); }
  return mk;
}
/* the board: the latest of a section (or all), each by its maker's kin; written only with a code a print gave (a maker the site knows) */
const SECS = ['notice', 'story', 'make', 'print'];
async function talkList(db, url) {
  const s = url.searchParams.get('s'); const sec = SECS.includes(s) ? s : null;
  const { results } = await db.prepare(`SELECT t.id, t.sec, t.text, t.re, t.at, m.kin FROM talk t LEFT JOIN makers m ON m.who = t.who WHERE t.hidden IS NULL${sec ? ' AND t.sec = ?' : ''} ORDER BY t.at DESC LIMIT 80`).bind(...(sec ? [sec] : [])).all();
  return json({ talk: results });
}
async function talkSay(db, env, req) {
  const b = await body(req); const who = typeof b.who === 'string' ? b.who : '', text = typeof b.text === 'string' ? b.text.trim().slice(0, 280) : '';
  if (!WHO.test(who) || !text || !SECS.includes(b.s)) return fail(400, 'talk');
  const mk = await kinOf(db, who); if (!mk) return fail(403, 'key');   // a code no print has given
  if (await tooMany(db, env, req, 'talk', 20, 10 * 60e3)) return fail(429, 'too many');
  const re = typeof b.re === 'string' && /^[a-z0-9]{6,24}$/.test(b.re) ? b.re : null, id = rid(), t = now();
  await db.batch([db.prepare('INSERT INTO talk (id, sec, who, text, re, at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, b.s, who, text, re, t), db.prepare('UPDATE makers SET last = ? WHERE who = ?').bind(t, who)]);
  return json({ id, kin: mk.kin, at: t }, 201);
}
async function mine(db, env, req, who, id) {
  if (!WHO.test(who || '')) return fail(400, 'who');
  if (await tooMany(db, env, req, 'mine', 60, 10 * 60e3)) return fail(429, 'too many');
  await db.prepare('UPDATE makers SET last = ? WHERE who = ?').bind(now(), who).run();
  if (id) { const r = await db.prepare('UPDATE stories SET gone = ? WHERE id = ? AND who = ? AND gone IS NULL').bind(now(), id, who).run(); return r.meta && r.meta.changes ? json({ ok: true }) : fail(404, 'not found'); }
  const { results } = await db.prepare(`SELECT id, code, kind, status, body, created, decided, photo IS NOT NULL AS has_photo FROM stories WHERE who = ? AND gone IS NULL AND kind NOT IN ('example', 'message') ORDER BY created DESC LIMIT 100`).bind(who).all();
  const mk = await kinOf(db, who);
  return json({ lv: (mk && mk.lv) || 0, kin: mk ? mk.kin : null, mine: results.map(r => ({ id: r.id, code: r.code, kind: r.kind, shown: r.status === 'shown', at: r.created, photo: r.status === 'shown' && !!r.has_photo, body: r.status === 'shown' ? r.body : '' })) });
}
/* a story sent: it waits for approval. A job for the partner's printer waits with it, unless that printer prints without approval.
   dest 'mesh': no print, only its mesh line, to every paired printer whose radio is on (MESH), to go out over the local mesh */
async function send(db, env, req) {
  const b = await body(req);
  /* a send refused for a printer is noted on it, for the approval page to show */
  const refuse = async (code, why) => { if (typeof b.dest === 'string' && b.dest && b.dest !== 'mesh') { try { await db.prepare('UPDATE printers SET refused = ? WHERE id = ?').bind(JSON.stringify({ why, at: now() }), b.dest).run(); } catch (e) { /* no such printer */ } } return fail(code, why); };
  if (await tooMany(db, env, req, 'send', LIMIT.sends, 10 * 60e3)) return refuse(429, 'too many sends from one place in ten minutes');
  const kind = ['record', 'cells', 'example', 'message'].includes(b.kind) ? b.kind : 'story';
  if (!CODE.test(b.code || '')) return fail(400, 'code');
  /* a message to novel.global (the portfolio's send message) is a story kept private: printed once approved, never listed */
  if ((kind === 'story' || kind === 'message') && !(typeof b.body === 'string' && /^[A-Za-z0-9_-]{20,}$/.test(b.body) && b.body.length <= LIMIT.sig)) return fail(400, 'story');
  if (kind === 'record' && !(typeof b.body === 'string' && b.body.length <= LIMIT.record && (() => { try { return typeof JSON.parse(b.body) === 'object'; } catch (e) { return false; } })())) return refuse(400, 'record too long');
  if (kind === 'cells' && (!cellsOk(b.body) || b.dest || b.photo)) return fail(400, 'cells');
  /* BOARD 00, the example, rewritten: only while it is open to editing on the approval page, and shown only once approved */
  if (kind === 'example' && !(await settingsOf(db)).exampleEdit) return fail(403, 'locked');
  if (kind === 'example' && (b.dest || b.photo || !(typeof b.body === 'string' && b.body.length <= LIMIT.example && (() => { try { const j = JSON.parse(b.body); return !!j && Array.isArray(j.objects); } catch (e) { return false; } })()))) return fail(400, 'example');
  const lat = +b.lat, lng = +b.lng; if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail(400, 'where');
  const pic = b.photo ? dataURL(b.photo) : null;   // a photograph too large or of another kind is left off; the print still goes
  const dest = typeof b.dest === 'string' && b.dest ? b.dest : ''; const toMesh = dest === 'mesh';
  const P = dest && !toMesh ? await db.prepare('SELECT * FROM printers WHERE id = ?').bind(dest).first() : null;
  if (dest && !toMesh && !P) return fail(400, 'dest');
  if (toMesh && !(typeof b.mesh === 'string' && b.mesh)) return fail(400, 'mesh');
  if (dest && b.escpos != null && !b64ok(b.escpos, LIMIT.escpos)) return refuse(400, 'the print is too long');
  if (b.mesh != null && (typeof b.mesh !== 'string' || enc.encode(b.mesh).length > LIMIT.mesh)) return fail(400, 'mesh');
  const { n } = await db.prepare("SELECT count(*) AS n FROM stories WHERE status = 'waiting'").first(); if (n >= LIMIT.waiting) return refuse(503, 'too many stories waiting for approval');
  const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null;
  const cf = req.cf || {}, ua = req.headers.get('user-agent') || '', str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  const origin = JSON.stringify({ from: str(b.from, 24), stage: str(b.stage, 60), city: str(cf.city, 40), region: str(cf.region, 40), country: str(cf.country, 4), dev: /Mobi|Android|iPhone|iPad/i.test(ua) ? 'phone' : 'computer', mesh: str(b.mesh, 240) });
  const id = rid(); const t = now(); const ops = [db.prepare('INSERT INTO stories (id, code, kind, status, body, photo, lat, lng, dest, created, who, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, b.code, kind, 'waiting', b.body, pic, lat, lng, dest || null, t, who, origin)];
  let job = null;
  if (P && (b.escpos || b.mesh)) {
    const { q } = await db.prepare("SELECT count(*) AS q FROM jobs WHERE printer = ? AND status IN ('held', 'queued', 'printing')").bind(dest).first(); if (q >= LIMIT.perPrinter) return refuse(503, 'its queue is full');
    job = { id: rid(), status: P.auto ? 'queued' : 'held' };
    const thumb = typeof b.thumb === 'string' && /^\d{1,3},\d{1,3},[A-Za-z0-9+/=]{1,2400}$/.test(b.thumb) ? b.thumb : null;
    ops.push(db.prepare('INSERT INTO jobs (id, printer, story, code, escpos, mesh, status, created, thumb) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(job.id, dest, id, b.code, b.escpos || null, P.mesh ? (b.mesh || null) : null, job.status, t, thumb));
  }
  if (toMesh) {
    const { results: radios } = await db.prepare(`SELECT p.id, p.auto, (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('held', 'queued', 'printing')) AS q
      FROM printers p WHERE p.mesh = 1 AND p.token IS NOT NULL`).all();
    for (const r of radios) { if (r.q >= LIMIT.perPrinter) continue; const jb = { id: rid(), status: 'queued' }; job = job || jb;
      ops.push(db.prepare('INSERT INTO jobs (id, printer, story, code, escpos, mesh, status, created) VALUES (?, ?, ?, ?, NULL, ?, ?, ?)').bind(jb.id, r.id, id, b.code, b.mesh, jb.status, t)); }
  }
  const lv = Math.max(0, Math.min(4, Math.round(+b.lv || 0)));
  if (who) ops.push(db.prepare('INSERT INTO makers (who, first, last, posts, stage, lv, kin) VALUES (?, ?, ?, 1, ?, ?, (SELECT COALESCE(MAX(kin), -1) + 1 FROM makers)) ON CONFLICT(who) DO UPDATE SET last = excluded.last, posts = posts + 1, stage = COALESCE(excluded.stage, stage), lv = max(COALESCE(lv, 0), excluded.lv)').bind(who, t, t, typeof b.stage === 'string' && b.stage ? b.stage.slice(0, 60) : null, lv));
  await db.batch(ops);
  return json({ id, status: 'waiting', job }, 201);
}
/* the sender's receipt: where their story is, and where its print is in the queue */
async function receipt(db, id) {
  const s = await db.prepare('SELECT id, code, status, dest FROM stories WHERE id = ?').bind(id).first(); if (!s) return fail(404, 'not found');
  const j = await db.prepare('SELECT id, printer, status, created, done, error FROM jobs WHERE story = ? ORDER BY created DESC LIMIT 1').bind(id).first();
  let ahead = 0; if (j && j.status === 'queued') ({ ahead } = await db.prepare("SELECT count(*) AS ahead FROM jobs WHERE printer = ? AND status IN ('queued', 'printing') AND created < ?").bind(j.printer, j.created).first());
  return json({ id, code: s.code, status: s.status, dest: s.dest || '', job: j ? { status: j.status, ahead, done: j.done || null, error: j.status === 'failed' ? String(j.error || '').slice(0, 60) : null } : null });
}
/* the site's own settings, for everyone: whether the nature station stays on for every visitor (lifeLock, on unless unlocked);
   whether BOARD 00, the example, can be rewritten and sent here for approval (exampleEdit, off unless switched on) */
const SETTINGS = { lifeLock: true, exampleEdit: false, phreak: false };
/* and words: the first board's template, as rewritten on the approval page (empty: the site's own, in config.js) */
/* gates: how the devices are earned (JSON: mode earn | open | closed, at: the posters for each); fx: the aura's motion (calm | base | chaos);
   curations: the portfolio's twelve groups (JSON: [{ k, name, about }]) */
/* start: the start page and the booth (JSON: discWords, checklist, printNight paper | day | night, boothHome s, boothGap minutes between prints from one phone) */
const TEXTS = { template: 6000, words: 4000, cities: 40000, gates: 300, fx: 20, curations: 6000, start: 600 };
async function settingsOf(db) { const { results } = await db.prepare('SELECT k, v FROM settings').all(); const out = { ...SETTINGS, ...Object.fromEntries(Object.keys(TEXTS).map(k => [k, ''])) }; for (const r of results) { if (r.k in SETTINGS) out[r.k] = r.v === '1'; else if (r.k in TEXTS) out[r.k] = r.v; } return out; }
/* the partner places: whether a printer is there and listening, and how much it has printed */
async function partners(db) {
  const { results } = await db.prepare(`SELECT p.id, p.name, p.paper, p.mesh, p.live, p.token IS NOT NULL AS paired, p.seen,
      (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('queued', 'printing')) AS queued,
      (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'printed') AS printed FROM printers p ORDER BY p.created`).all();
  return json({ partners: results.map(p => ({ id: p.id, name: p.name, paper: p.paper, paired: !!p.paired, mesh: !!p.mesh && !!p.paired, live: !!p.live, ready: !!p.seen && now() - p.seen < 2 * 60e3, queued: p.queued, printed: p.printed })) });
}

/* ───────── a printer's receiver: it asks for the next job, prints it, and says how it went ───────── */
async function printerAuth(db, req, id, can) {
  const p = await db.prepare('SELECT * FROM printers WHERE id = ?').bind(id).first(); const tok = bearer(req);
  if (!p || !p.token || !tok || !(await same(await sha256(tok), p.token))) return null;
  if (!p.seen || now() - p.seen > 60e3 || (can !== undefined && can !== p.can)) await (can === undefined ? db.prepare('UPDATE printers SET seen = ? WHERE id = ?').bind(now(), id) : db.prepare('UPDATE printers SET seen = ?, can = ? WHERE id = ?').bind(now(), can, id)).run(); return p;
}
async function next(db, req, id) {
  const can = (new URL(req.url).searchParams.get('can') || '').slice(0, 40);
  const p = await printerAuth(db, req, id, can); if (!p) return fail(401, 'token');
  const t = now();
  { const pn = netOf(new URL(req.url)); if (pn) { const o = JSON.parse(pn), was = (() => { try { return JSON.parse(p.net || 'null'); } catch (e) { return null; } })(); if (!was || was.n !== o.n || Math.abs((was.rssi || 0) - (o.rssi || 0)) > 6 || o.at - was.at > 60e3) await db.prepare('UPDATE printers SET net = ? WHERE id = ?').bind(pn, id).run(); } }
  /* CHANGE WI-FI, pressed on the approval page in the last two minutes: the receiver opens its setup Wi-Fi (only one that says it can) */
  if (p.wifi) { await db.prepare('UPDATE printers SET wifi = NULL WHERE id = ?').bind(id).run(); if (t - p.wifi < 2 * 60e3 && /\bwifi\b/.test(can)) return json({ wifi: true }); }
  /* TURN OFF, pressed on the approval page in the last two minutes, comes before any slip. An older one is dropped, so a
     printer moved and switched on days later is never turned off by it; a receiver that cannot turn off is never sent it */
  if (p.off) { await db.prepare('UPDATE printers SET off = NULL WHERE id = ?').bind(id).run(); if (t - p.off < 2 * 60e3 && /\boff\b/.test(can)) return json({ off: true }); }
  /* the oldest job waiting, or one whose printer went quiet while printing it: taken for a minute. Paper always first: a line for the
     mesh alone waits until no print does, since the radio can take most of a minute to answer and a print should never wait on it */
  const j = await db.prepare("SELECT * FROM jobs WHERE printer = ? AND (status = 'queued' OR (status = 'printing' AND lease < ?)) ORDER BY (escpos IS NULL), created LIMIT 1").bind(id, t).first();
  if (!j) return new Response(null, { status: 204, headers: TEXT_H });
  if (j.tries >= 5) { await db.prepare("UPDATE jobs SET status = 'failed', error = 'tried five times', done = ? WHERE id = ?").bind(t, j.id).run(); return new Response(null, { status: 204, headers: TEXT_H }); }
  /* a slip with both paper and a mesh line: the line goes on as a job of its own, taken next, so a print that fails never keeps it off the mesh */
  if (j.escpos && j.mesh) { await db.batch([db.prepare("INSERT INTO jobs (id, printer, story, code, mesh, status, created) VALUES (?, ?, ?, ?, ?, 'queued', ?)").bind(rid(), id, j.story, j.code, j.mesh, j.created), db.prepare('UPDATE jobs SET mesh = NULL WHERE id = ?').bind(j.id)]); j.mesh = null; }
  await db.prepare("UPDATE jobs SET status = 'printing', lease = ?, tries = tries + 1 WHERE id = ?").bind(t + 60e3, j.id).run();
  return json({ job: j.id, code: j.code, escpos: j.escpos || null, mesh: j.mesh || null });
}
/* ───────── a printer's touch screen: the slips held for it, each shown with the jellyfish; one press prints it, a long press squashes it ───────── */
async function touchAuth(db, req, id) {
  const p = await db.prepare('SELECT * FROM printers WHERE id = ?').bind(id).first(); const tok = bearer(req);
  if (!p || !p.touch || !tok || !(await same(await sha256(tok), p.touch))) return null;
  if (!p.touch_seen || now() - p.touch_seen > 60e3) await db.prepare('UPDATE printers SET touch_seen = ? WHERE id = ?').bind(now(), id).run(); return p;
}
const netOf = url => { const n = (url.searchParams.get('net') || '').slice(0, 40), r = +url.searchParams.get('rssi'), ip = url.searchParams.get('ip') || ''; return n ? JSON.stringify({ n, rssi: Number.isFinite(r) ? Math.max(-120, Math.min(0, Math.round(r))) : null, ...(/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) ? { ip } : {}), at: now() }) : null; };
async function touchList(db, req, id) {
  const p0 = await touchAuth(db, req, id); if (!p0) return fail(401, 'token');
  { const tn = netOf(new URL(req.url)); if (tn) { const o = JSON.parse(tn), was = (() => { try { return JSON.parse(p0.touch_net || 'null'); } catch (e) { return null; } })(); if (!was || was.n !== o.n || Math.abs((was.rssi || 0) - (o.rssi || 0)) > 6 || o.at - was.at > 60e3) await db.prepare('UPDATE printers SET touch_net = ? WHERE id = ?').bind(tn, id).run(); } }
  const { results } = await db.prepare(`SELECT j.id, j.code, j.created, j.escpos IS NOT NULL AS paper, j.thumb, s.body FROM jobs j LEFT JOIN stories s ON s.id = j.story WHERE j.printer = ? AND j.status = 'held' ORDER BY j.created LIMIT 5`).bind(id).all();
  const c = await db.prepare("SELECT sum(status = 'held') AS w, sum(status IN ('queued', 'printing')) AS q FROM jobs WHERE printer = ?").bind(id).first();
  return json({ waiting: (c && c.w) || 0, printing: (c && c.q) || 0, held: results.map((r, i) => { let b = {}; try { b = JSON.parse(r.body || '{}'); } catch (e) { /* none */ }
    return { job: r.id, code: r.code || '', at: r.created, say: String(b.text || '').slice(0, 140), wish: (Array.isArray(b.wish) ? b.wish : []).map(w => String(w).slice(0, 90)).slice(0, 4), life: b.tx && b.tx.cn ? String(b.tx.cn).slice(0, 40) : '', paper: !!r.paper, ...(i === 0 && r.thumb ? { img: r.thumb } : {}) }; }) });
}
async function touchAct(db, req, id, job) {
  if (!(await touchAuth(db, req, id))) return fail(401, 'token');
  const b = await body(req);
  /* the screen's hidden menu: the printer's Pi asked to turn off, as TURN OFF on the approval page does */
  if (job === 'off' && b.action === 'off') { await db.prepare('UPDATE printers SET off = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
  if (b.action === 'print') { await db.batch([db.prepare("UPDATE jobs SET status = 'queued' WHERE id = ? AND printer = ? AND status = 'held'").bind(job, id), db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = (SELECT story FROM jobs WHERE id = ?) AND status = 'waiting'").bind(now(), job)]); return json({ ok: true }); }
  if (b.action === 'squash') { await db.batch([db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE id = (SELECT story FROM jobs WHERE id = ?) AND status = 'waiting'").bind(now(), job), db.prepare("DELETE FROM jobs WHERE id = ? AND printer = ? AND status = 'held'").bind(job, id)]); return json({ ok: true }); }
  return fail(400, 'action');
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
    const st = ['waiting', 'shown', 'refused', 'deleted'].includes(new URL(req.url).searchParams.get('status')) ? new URL(req.url).searchParams.get('status') : 'waiting';
    const { results } = await db.prepare(`SELECT s.id, s.code, s.kind, s.status, s.body, s.lat, s.lng, s.dest, s.created, s.decided, s.photo IS NOT NULL AS has_photo, s.star, s.who, s.gone, s.origin,
        (SELECT j.printer || ' ' || j.status || COALESCE(' ' || j.error, '') FROM jobs j WHERE j.story = s.id ORDER BY j.created DESC LIMIT 1) AS jobat,
        (SELECT j.status FROM jobs j WHERE j.story = s.id ORDER BY j.created DESC LIMIT 1) AS job FROM stories s WHERE s.status = ? ORDER BY s.created DESC LIMIT 200`).bind(st).all();
    return json({ stories: results.map(r => ({ ...r, photo: !!r.has_photo, has_photo: undefined })) });
  }
  if (what === 'stories' && id === 'clear' && req.method === 'POST') {   // everything waiting refused at once, its held prints with it
    await db.batch([db.prepare("DELETE FROM jobs WHERE status = 'held' AND story IN (SELECT id FROM stories WHERE status = 'waiting')"), db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE status = 'waiting'").bind(now())]);
    return json({ ok: true });
  }
  if (what === 'stories' && id && req.method === 'POST') {
    const b = await body(req); const t = now();
    if (b.action === 'show') { await db.batch([db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = ?").bind(t, id), db.prepare("UPDATE jobs SET status = 'queued' WHERE story = ? AND status = 'held'").bind(id)]); return json({ ok: true }); }
    if (b.action === 'refuse') { await db.batch([db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE id = ?").bind(t, id), db.prepare("DELETE FROM jobs WHERE story = ? AND status IN ('held', 'queued')").bind(id)]); return json({ ok: true }); }
    if (b.action === 'ungone') { await db.prepare('UPDATE stories SET gone = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); }   // taken down by its maker, put back
    if (b.action === 'star' || b.action === 'unstar') { await db.prepare('UPDATE stories SET star = ? WHERE id = ?').bind(b.action === 'star' ? 1 : 0, id).run(); return json({ ok: true }); }
    /* deleted is archived: off the site and out of every queue, still here on the approval page, and brought back as waiting */
    if (b.action === 'delete') { await db.batch([db.prepare("DELETE FROM jobs WHERE story = ? AND status IN ('held', 'queued')").bind(id), db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE id = ?").bind(t, id)]); return json({ ok: true }); }
    if (b.action === 'restore') { await db.prepare("UPDATE stories SET status = 'waiting', decided = NULL WHERE id = ?").bind(id).run(); return json({ ok: true }); }
    if (b.action === 'purge') { await db.batch([db.prepare('DELETE FROM jobs WHERE story = ?').bind(id), db.prepare("DELETE FROM stories WHERE id = ? AND status = 'deleted'").bind(id)]); return json({ ok: true }); }
    return fail(400, 'action');
  }
  if (what === 'photos' && id) return photo(db, id, true);
  if (what === 'talk' && !id && req.method === 'GET') { const { results } = await db.prepare('SELECT t.*, m.kin FROM talk t LEFT JOIN makers m ON m.who = t.who ORDER BY t.at DESC LIMIT 300').all(); return json({ talk: results }); }
  if (what === 'talk' && id && req.method === 'POST') { const b = await body(req); if (b.action === 'hide' || b.action === 'show') { await db.prepare('UPDATE talk SET hidden = ? WHERE id = ?').bind(b.action === 'hide' ? now() : null, id).run(); return json({ ok: true }); } if (b.action === 'delete') { await db.prepare('DELETE FROM talk WHERE id = ?').bind(id).run(); return json({ ok: true }); } return fail(400, 'action'); }
  if (what === 'makers' && !id && req.method === 'GET') { const { results } = await db.prepare(`SELECT m.who, m.first, m.last, m.posts, m.stage, m.kin, m.lv, (SELECT count(*) FROM talk t WHERE t.who = m.who) AS said, (SELECT count(*) FROM stories s WHERE s.who = m.who AND s.status = 'shown' AND s.gone IS NULL) AS shown, (SELECT count(*) FROM stories s WHERE s.who = m.who AND s.gone IS NOT NULL) AS gone FROM makers m ORDER BY m.last DESC LIMIT 500`).all(); return json({ makers: results }); }
  /* the portfolio's posts: every one, drafts too; one to edit; saved; deleted */
  if (what === 'posts' && !id && req.method === 'GET') { const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts ORDER BY day DESC, created DESC LIMIT 500`).all(); return json({ posts: results.map(postOut) }); }
  if (what === 'posts' && !id && req.method === 'POST') return savePost(db, req);
  if (what === 'posts' && id && parts[2] === 'cover') return postCover(db, id, true);
  if (what === 'posts' && id && req.method === 'GET') return onePost(db, id, true);
  if (what === 'posts' && id && req.method === 'POST') { const b = await body(req); if (b.action !== 'delete') return fail(400, 'action'); await db.prepare("UPDATE posts SET status = 'deleted', updated = ? WHERE id = ?").bind(now(), id).run(); return json({ ok: true }); }
  if (what === 'settings' && req.method === 'POST') { const b = await body(req); const put = (k, v) => db.prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, v).run();
    for (const k of Object.keys(SETTINGS)) if (typeof b[k] === 'boolean') await put(k, b[k] ? '1' : '0');
    for (const [k, max] of Object.entries(TEXTS)) if (typeof b[k] === 'string') await put(k, b[k].replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').slice(0, max));
    return json(await settingsOf(db)); }
  if (what === 'settings' && req.method === 'GET') return json(await settingsOf(db));
  if (what === 'places' && id === 'import' && req.method === 'POST') return importPlaces(db, req);
  if (what === 'places') return adminPlaces(db, req, id);
  if (what === 'overview' && req.method === 'GET') return overview(db);
  if (what === 'traffic' && req.method === 'GET') { const { results } = await db.prepare('SELECT day, k, n FROM traffic WHERE day >= ? ORDER BY day DESC, k').bind(new Date(now() - 60 * DAY).toISOString().slice(0, 10)).all(); return json({ traffic: results }); }
  if (what === 'export' && req.method === 'GET') return exportAll(db);
  if (what === 'reset' && req.method === 'POST') return resetSite(db, req);
  if (what === 'printers' && !id) {
    const { results } = await db.prepare(`SELECT p.id, p.name, p.paper, p.mesh, p.auto, p.live, p.token IS NOT NULL AS paired, p.touch IS NOT NULL AS touch, p.touch_seen, p.refused, p.seen, p.can, p.off, p.net, p.touch_net, p.wifi,
        (SELECT json_object('code', j.code, 'status', j.status, 'at', j.created, 'error', j.error, 'mesh', j.mesh IS NOT NULL, 'paper', j.escpos IS NOT NULL) FROM jobs j WHERE j.printer = p.id ORDER BY j.created DESC LIMIT 1) AS last,
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
    /* the touch screen's own token, shown once; a printer with one holds every slip for its screen */
    if (b.action === 'touch') { if (!b.on) { await db.prepare('UPDATE printers SET touch = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); } const tok = rid(24); await db.prepare('UPDATE printers SET touch = ?, auto = 0 WHERE id = ?').bind(await sha256(tok), id).run(); return json({ token: tok }); }
    if (b.action === 'unpair') { await db.prepare('UPDATE printers SET token = NULL, seen = NULL, can = NULL, off = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); }
    /* TURN OFF: the receiver is handed it the next time it asks, if that is within two minutes */
    if (b.action === 'wifi') { await db.prepare('UPDATE printers SET wifi = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
    if (b.action === 'off') { await db.prepare('UPDATE printers SET off = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
    if (b.action === 'auto' || b.action === 'mesh' || b.action === 'live') { await db.prepare(`UPDATE printers SET ${b.action} = ? WHERE id = ?`).bind(b.on ? 1 : 0, id).run(); return json({ ok: true }); }
    if (b.action === 'paper' && ['58', '80'].includes(String(b.paper))) { await db.prepare('UPDATE printers SET paper = ? WHERE id = ?').bind(String(b.paper), id).run(); return json({ ok: true }); }
    if (b.action === 'test') { await db.prepare("INSERT INTO jobs (id, printer, code, mesh, status, created) VALUES (?, ?, 'DA-TEST', ?, 'queued', ?)").bind(rid(), id, 'DIRECT ACTION - test print', now()).run(); return json({ ok: true }); }
    return fail(400, 'action');
  }
  return fail(404, 'not found');
}

/* ───────── a photograph passed through, so the page may read its pixels: to dither it for a slip, a PNG or a printer.
   iNaturalist's photographs only; kept a day at the edge ───────── */
const IMG_HOSTS = ['inaturalist-open-data.s3.amazonaws.com', 'static.inaturalist.org'];
async function imgThrough(url) {
  let t; try { t = new URL(url.searchParams.get('u') || ''); } catch (e) { return fail(400, 'u'); }
  if (t.protocol !== 'https:' || !IMG_HOSTS.includes(t.hostname) || !t.pathname.startsWith('/photos/')) return fail(400, 'u');
  const r = await fetch(t.toString(), { cf: { cacheEverything: true, cacheTtl: 86400 } }); const type = r.headers.get('content-type') || '';
  if (!r.ok || !type.startsWith('image/') || +(r.headers.get('content-length') || 0) > 8e6) return fail(502, 'img');
  return new Response(r.body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
}

/* ───────── live data through novel.global (stage 4): iNaturalist and OpenStreetMap are asked here, once for everyone, and never by
   a visitor's browser. What comes back is kept: iNaturalist's answers at the edge for minutes (sightings) to a week (names), and
   OpenStreetMap's a tile at a time in the database for two weeks (places) or a month (water). A failure is never kept ───────── */
const UA = { 'user-agent': 'novel.global (https://novel.global)', accept: 'application/json' };
/* the iNaturalist routes the site uses, and how long each answer is good for, in seconds */
const INAT_PATHS = [[/^observations$/, 180], [/^observations\/histogram$/, 86400], [/^observations\/\d{1,12}$/, 3600], [/^taxa$/, 604800], [/^taxa\/\d{1,10}$/, 604800]];
let inatRest = 0;   // while iNaturalist turns novel.global away: answered at once, so the browser goes round
async function inatThrough(url) {
  const path = url.pathname.slice('/api/inat/'.length), rule = INAT_PATHS.find(r => r[0].test(path));
  if (!rule || url.search.length > 2000) return fail(400, 'inat');
  if (Date.now() < inatRest) return fail(429, 'inat');
  let r; try { r = await fetch(`https://api.inaturalist.org/v1/${path}${url.search}`, { headers: UA, cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': rule[1], '300-599': 0 } } }); } catch (e) { return fail(502, 'inat'); }
  if (!r.ok) { if (r.status === 429 || r.status === 403) inatRest = Date.now() + 60e3; return fail(r.status === 429 ? 429 : 502, 'inat'); }
  return new Response(r.body, { headers: { ...JSON_H, 'cache-control': `public, max-age=${Math.min(rule[1], 300)}` } });
}
/* the two things asked of OpenStreetMap: the places with a name (as the radar's knots), and the water. Built here from a box of
   whole tiles, so nothing else can be asked through novel.global */
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const OSM_Q = {
  places: { tile: 0.01, most: 8, keep: 14 * DAY, q: bb => `[out:json][timeout:25];(nwr["shop"]["name"](${bb});nwr["amenity"~"^(cafe|restaurant|fast_food|bar|pub|ice_cream|food_court|biergarten|fuel|car_wash|car_rental|pharmacy|bank|veterinary|marketplace|nightclub|theatre|arts_centre|music_venue|cinema|community_centre|events_venue|library|social_centre|townhall|coworking_space|studio)$"]["name"](${bb});nwr["craft"]["name"](${bb});nwr["office"]["name"](${bb});nwr["leisure"~"^(hackerspace|swimming_pool|sports_centre|garden)$"]["name"](${bb});nwr["tourism"~"^(gallery|museum)$"]["name"](${bb}););out center tags qt;` },
  water: { tile: 0.05, most: 1, keep: 30 * DAY, q: bb => `[out:json][timeout:25];(way["waterway"~"^(river|stream|canal)$"](${bb});way["natural"="water"](${bb});way["waterway"="riverbank"](${bb});relation["natural"="water"](${bb}););out geom(${bb}) qt;` },
};
const osmOut = elements => new Response(JSON.stringify({ elements }), { headers: { ...JSON_H, 'cache-control': 'public, max-age=3600' } });
async function osmThrough(db, env, req, url) {
  const kind = url.searchParams.get('q'), K = OSM_Q[kind], bb = (url.searchParams.get('bb') || '').split(',').map(Number);
  if (!K || bb.length !== 4 || !bb.every(Number.isFinite)) return fail(400, 'bb');
  const ix = bb.map(v => Math.round(v / K.tile)); if (bb.some((v, i) => Math.abs(v / K.tile - ix[i]) > 1e-6)) return fail(400, 'bb');
  const [i0, j0, i1, j1] = ix; if (i1 <= i0 || j1 <= j0 || i1 - i0 > K.most || j1 - j0 > K.most || Math.abs(bb[0]) > 90 || Math.abs(bb[2]) > 90 || Math.abs(bb[1]) > 180 || Math.abs(bb[3]) > 180) return fail(400, 'bb');
  const keyOf = (i, j) => `${kind}:${i},${j}`, keys = []; for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) keys.push(keyOf(i, j));
  const { results } = await db.prepare(`SELECT k, body, at FROM osm WHERE k IN (${keys.map(() => '?').join(',')})`).bind(...keys).all();
  const have = new Map(results.map(r => [r.k, r])), t = now(), stale = keys.filter(k => !have.has(k) || t - have.get(k).at > K.keep);
  const all = () => keys.flatMap(k => (have.has(k) ? JSON.parse(have.get(k).body) : []));
  if (!stale.length) return osmOut(all());
  /* asked of Overpass only for the tiles missing, at most so often from one place; meanwhile what is kept, even if old, still serves */
  if (await tooMany(db, env, req, 'osm', 40, 10 * 60e3)) return have.size ? osmOut(all()) : fail(429, 'osm');
  const sq = stale.map(k => k.split(':')[1].split(',').map(Number)), box = [Math.min(...sq.map(q => q[0])), Math.min(...sq.map(q => q[1])), Math.max(...sq.map(q => q[0])) + 1, Math.max(...sq.map(q => q[1])) + 1].map(v => (v * K.tile).toFixed(4)).join(',');
  for (const u of OVERPASS) {
    let j; try { const r = await fetch(`${u}?data=${encodeURIComponent(K.q(box))}`, { headers: UA, signal: AbortSignal.timeout(20000) }); if (!r.ok) continue; j = await r.json(); } catch (e) { continue; }
    if (!j || !Array.isArray(j.elements) || (j.remark && /error|time/i.test(j.remark))) continue;
    /* each element kept with the tile it stands in (water: its one tile, whole); a tile with nothing in it is kept too, as empty */
    const by = new Map(stale.map(k => [k, []]));
    for (const el of j.elements) { if (K.most === 1) { by.get(stale[0]).push(el); continue; } const la = el.lat != null ? el.lat : el.center && el.center.lat, ln = el.lon != null ? el.lon : el.center && el.center.lon; if (la == null) continue;
      const k = keyOf(Math.floor(la / K.tile), Math.floor(ln / K.tile)); if (by.has(k)) by.get(k).push(el); }
    const ops = []; for (const [k, els] of by) { const body = JSON.stringify(els); have.set(k, { k, body, at: t }); if (body.length < 1.5e6) ops.push(db.prepare('INSERT OR REPLACE INTO osm (k, body, at) VALUES (?, ?, ?)').bind(k, body, t)); }
    if (ops.length) await db.batch(ops);
    return osmOut(all());
  }
  return have.size ? osmOut(all()) : fail(502, 'osm');
}

/* ───────── stage 5, places and people: a place is its name, what kind of place (cat), what it does near a life (role), where it is
   (address, suburb, lat, lng), its own site and a line on what it does. Shown ones are read by every visitor and join the listed
   places on the map, in search and on the radar; a suggestion waits on the approval page like a story ───────── */
const PLACE_CATS = ['brand', 'circular', 'service', 'artists', 'third', 'network'];
const PLACE_COLS = 'id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created, decided';
function placeOf(b) {
  const n = str(b.n, 80), lat = +b.lat, lng = +b.lng, url = str(b.url, 300);
  if (!n || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { n, cat: PLACE_CATS.includes(b.cat) ? b.cat : 'service', role: /^[a-z]{1,20}$/.test(b.role || '') ? b.role : '', addr: str(b.addr, 120), sub: str(b.sub, 60),
    url: /^https:\/\/[^\s<>"]+$/.test(url) ? url : '', what: str(b.what, 200), lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
}
async function listPlaces(db) {
  const { results } = await db.prepare("SELECT id, n, cat, role, addr, sub, url, what, lat, lng FROM places WHERE status = 'shown' ORDER BY n LIMIT 2000").all();
  return new Response(JSON.stringify({ places: results }), { headers: { ...JSON_H, 'cache-control': 'public, max-age=300' } });
}
async function suggestPlace(db, env, req) {
  if (await tooMany(db, env, req, 'place', 6, 10 * 60e3)) return fail(429, 'too many places from one place in ten minutes');
  const p = placeOf(await body(req)); if (!p) return fail(400, 'place');
  const { n } = await db.prepare("SELECT count(*) AS n FROM places WHERE status = 'waiting'").first(); if (n >= 500) return fail(503, 'too many places waiting');
  const id = rid(); await db.prepare('INSERT INTO places (id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, 'waiting', 'suggested', now()).run();
  return json({ id, status: 'waiting' }, 201);
}
async function adminPlaces(db, req, id) {
  if (req.method === 'GET') { const st = ['waiting', 'shown', 'refused', 'deleted'].includes(new URL(req.url).searchParams.get('status')) ? new URL(req.url).searchParams.get('status') : 'waiting';
    const { results } = await db.prepare(`SELECT ${PLACE_COLS} FROM places WHERE status = ? ORDER BY created DESC LIMIT 1000`).bind(st).all(); return json({ places: results }); }
  if (req.method !== 'POST') return fail(405, 'method');
  const b = await body(req), t = now();
  /* added here: shown at once */
  if (!id) { const p = placeOf(b); if (!p) return fail(400, 'place'); const nid = rid();
    await db.prepare('INSERT INTO places (id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created, decided) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(nid, p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, 'shown', 'admin', t, t).run(); return json({ id: nid, status: 'shown' }, 201); }
  if (b.action === 'show' || b.action === 'refuse') { await db.prepare('UPDATE places SET status = ?, decided = ? WHERE id = ?').bind(b.action === 'show' ? 'shown' : 'refused', t, id).run(); return json({ ok: true }); }
  if (b.action === 'delete') { await db.prepare("UPDATE places SET status = 'deleted', decided = ? WHERE id = ?").bind(t, id).run(); return json({ ok: true }); }
  if (b.action === 'restore') { await db.prepare("UPDATE places SET status = 'waiting', decided = NULL WHERE id = ?").bind(id).run(); return json({ ok: true }); }
  if (b.action === 'purge') { await db.prepare("DELETE FROM places WHERE id = ? AND status = 'deleted'").bind(id).run(); return json({ ok: true }); }
  if (b.action === 'edit') { const p = placeOf(b); if (!p) return fail(400, 'place');
    await db.prepare('UPDATE places SET n = ?, cat = ?, role = ?, addr = ?, sub = ?, url = ?, what = ?, lat = ?, lng = ? WHERE id = ?').bind(p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, id).run(); return json({ ok: true }); }
  return fail(400, 'action');
}

/* ───────── the approval page's own: the whole site at a glance, everything as one file, places brought in by the hundred, and the
   site set back to its base. A reset archives (nothing is lost: it can be brought back from the archive) and never touches the
   printers, their tokens, or the password ───────── */
const COUNT = async (db, table, extra = '') => { const { results } = await db.prepare(`SELECT status, count(*) AS n FROM ${table} ${extra} GROUP BY status`).all(); return Object.fromEntries(results.map(r => [r.status, r.n])); };
async function overview(db) {
  const day = new Date().toISOString().slice(0, 10), wk = new Date(now() - 7 * DAY).toISOString().slice(0, 10);
  const [stories, places, posts, jobs] = await Promise.all([COUNT(db, 'stories'), COUNT(db, 'places'), COUNT(db, 'posts'), COUNT(db, 'jobs', `WHERE created > ${now() - 7 * DAY}`)]);
  const { results: pr } = await db.prepare('SELECT id, name, seen, token IS NOT NULL AS paired, mesh, auto, touch IS NOT NULL AS touch FROM printers ORDER BY id').all();
  const { results: tr } = await db.prepare('SELECT k, sum(n) AS n, max(day = ?) AS today FROM traffic WHERE day >= ? GROUP BY k').bind(day, wk).all();
  const { results: td } = await db.prepare('SELECT k, n FROM traffic WHERE day = ?').bind(day).all();
  return json({ stories, places, posts, jobs, printers: pr, week: Object.fromEntries(tr.map(r => [r.k, r.n])), today: Object.fromEntries(td.map(r => [r.k, r.n])), at: now() });
}
async function exportAll(db) {
  const q = async s => (await db.prepare(s).all()).results;
  const out = { site: 'novel.global', build: BUILD, at: new Date().toISOString(),
    talk: await q('SELECT * FROM talk ORDER BY at DESC'), makers: await q('SELECT * FROM makers ORDER BY first'),
    stories: await q('SELECT id, code, kind, status, body, lat, lng, dest, created, decided, star, who, gone, photo IS NOT NULL AS has_photo FROM stories ORDER BY created DESC'),
    places: await q(`SELECT ${PLACE_COLS} FROM places ORDER BY created DESC`), posts: await q('SELECT id, slug, title, summary, body, cat, links, day, status, created, updated FROM posts ORDER BY created DESC'),
    printers: await q('SELECT id, name, paper, mesh, auto, live, seen, token IS NOT NULL AS paired FROM printers ORDER BY id'), settings: await settingsOf(db), traffic: await q('SELECT day, k, n FROM traffic ORDER BY day DESC, k') };
  return new Response(JSON.stringify(out, null, 1), { headers: { ...JSON_H, 'content-disposition': `attachment; filename="novel-global-${out.at.slice(0, 10)}.json"` } });
}
async function importPlaces(db, req) {
  const b = await body(req); const list = Array.isArray(b.places) ? b.places.slice(0, 2000) : []; const t = now(); const ops = []; let bad = 0;
  for (const raw of list) { const p = placeOf(raw || {}); if (!p) { bad++; continue; } ops.push(db.prepare('INSERT INTO places (id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created, decided) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(rid(), p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, 'shown', 'import', t, t)); }
  for (let i = 0; i < ops.length; i += 50) await db.batch(ops.slice(i, i + 50));
  return json({ added: ops.length, bad });
}
async function resetSite(db, req) {
  const b = await body(req), t = now(), ops = [];
  if (b.stories) ops.push(db.prepare("DELETE FROM jobs WHERE status IN ('held', 'queued')"), db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE status != 'deleted' AND kind != 'example'").bind(t));
  if (b.example) ops.push(db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE kind = 'example'").bind(t));
  if (b.places) ops.push(db.prepare("UPDATE places SET status = 'deleted', decided = ? WHERE status != 'deleted'").bind(t));
  if (b.posts) ops.push(db.prepare("UPDATE posts SET status = 'draft', updated = ? WHERE status = 'published'").bind(t));
  if (b.words) ops.push(db.prepare("DELETE FROM settings WHERE k IN ('template', 'words', 'cities')"));
  if (b.settings) ops.push(db.prepare("DELETE FROM settings WHERE k IN ('lifeLock', 'exampleEdit', 'phreak', 'gates', 'fx', 'start')"));
  if (b.traffic) ops.push(db.prepare('DELETE FROM traffic'));
  if (!ops.length) return fail(400, 'nothing');
  await db.batch(ops); return json({ ok: true });
}
/* traffic: a day's count of each kind of thing, added after the answer has gone */
const BEATS = ['open-aura', 'open-studio', 'open-portfolio', 'begin', 'print', 'wall', 'song', 'device'];
/* the journey, counted step by step (never who): levels reached, discs and the eye pressed, steps opened, devices, the booth, the desk */
const JOURNEY = /^(lv[1-4]|disc-[0-2]|eye|step-[0-3]|dev-[0-2]|booth-(open|print|save)|desk-(open|play|keep)|yours)$/;
function trafficKey(url, m) {
  const p = url.pathname.replace(/^\/api\//, '').split('/')[0];
  if (p === 'beat') { const k = url.searchParams.get('k'); return BEATS.includes(k) || JOURNEY.test(k || '') ? k : null; }
  if (['inat', 'osm', 'img', 'places', 'stories', 'posts', 'receipts'].includes(p)) return p + (m === 'POST' ? ':sent' : '');
  return null;
}
function tally(env, ctx, url, m) {
  const k = trafficKey(url, m), db = dbOf(env); if (!k || !db || !ctx) return;
  ctx.waitUntil((async () => { try { await ready(db); await db.prepare('INSERT INTO traffic (day, k, n) VALUES (?, ?, 1) ON CONFLICT(day, k) DO UPDATE SET n = n + 1').bind(new Date().toISOString().slice(0, 10), k).run(); } catch (e) { /* a count missed */ } })());
}

/* ───────── the portfolio: posts written on the approval page, drafts until published. Only published posts are read here ───────── */
const POST_COLS = 'id, slug, title, summary, cat, day, status, cover IS NOT NULL AS has_cover, updated';
const postOut = r => ({ ...r, cover: !!r.has_cover, has_cover: undefined, links: r.links ? JSON.parse(r.links) : undefined });
async function listPosts(db) { const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts WHERE status = 'published' ORDER BY day DESC, created DESC LIMIT 300`).all(); return json({ posts: results.map(postOut) }); }
async function onePost(db, slug, any) {
  const r = await db.prepare(`SELECT ${POST_COLS}, body, links FROM posts WHERE ${any ? 'id' : 'slug'} = ?${any ? '' : " AND status = 'published'"}`).bind(slug).first();
  return r ? json({ post: postOut(r) }) : fail(404, 'not found');
}
async function postCover(db, key, any) {
  const r = await db.prepare(`SELECT cover FROM posts WHERE ${any ? 'id' : 'slug'} = ?${any ? '' : " AND status = 'published'"}`).bind(key).first();
  if (!r || !r.cover) return fail(404, 'not found');
  return new Response(new Uint8Array(r.cover), { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=600', 'x-content-type-options': 'nosniff' } });
}
const slugOf = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'post';
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
async function savePost(db, req) {
  const b = await body(req); const title = str(b.title, 140); if (!title) return fail(400, 'title');
  const links = (Array.isArray(b.links) ? b.links : []).map(u => str(u, 300)).filter(u => /^https:\/\/[^\s]+$/.test(u)).slice(0, 12);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(b.day || '') ? b.day : new Date().toISOString().slice(0, 10);
  const status = b.status === 'published' ? 'published' : 'draft'; const t = now();
  const pic = b.cover ? dataURL(b.cover) : null; if (b.cover && !pic) return fail(400, 'cover');
  const id = typeof b.id === 'string' && /^[A-Za-z0-9_-]{8,40}$/.test(b.id) ? b.id : rid();
  const was = await db.prepare('SELECT id, slug FROM posts WHERE id = ?').bind(id).first();
  /* a post keeps its address once made; a new one takes its title's, numbered if that is taken */
  let slug = was ? was.slug : slugOf(str(b.slug, 60) || title); if (!was) for (let i = 2; await db.prepare('SELECT 1 FROM posts WHERE slug = ?').bind(slug).first(); i++) slug = `${slugOf(title).slice(0, 55)}-${i}`;
  const f = [title, str(b.summary, 400), str(b.body, 40000), str(b.cat, 40).toUpperCase(), JSON.stringify(links), day, status, t];
  if (was) await db.prepare(`UPDATE posts SET title = ?, summary = ?, body = ?, cat = ?, links = ?, day = ?, status = ?, updated = ?${pic || b.cover === null ? ', cover = ?' : ''} WHERE id = ?`).bind(...f, ...(pic || b.cover === null ? [pic] : []), id).run();
  else await db.prepare('INSERT INTO posts (title, summary, body, cat, links, day, status, updated, cover, id, slug, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(...f, pic, id, slug, t).run();
  return json({ id, slug, status }, was ? 200 : 201);
}

/* ───────── the router ───────── */
async function api(req, env, url, ctx) {
  tally(env, ctx, url, req.method);
  if (url.pathname === '/api/beat') return new Response(null, { status: 204, headers: TEXT_H });
  if (url.pathname === '/api/img' && req.method === 'GET') return imgThrough(url);
  if (url.pathname.startsWith('/api/inat/') && req.method === 'GET') return inatThrough(url);
  const db = dbOf(env); if (!db) return fail(503, 'no database');
  await ready(db); if (Math.random() < 0.05) await tidy(db);
  const p = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean).map(decodeURIComponent); const m = req.method;
  if (p[0] === 'stories' && !p[1] && m === 'GET') return listStories(db, url);
  if (p[0] === 'stories' && !p[1] && m === 'POST') return send(db, env, req);
  if (p[0] === 'stories' && p[1] && m === 'GET') return CODE.test(p[1]) ? oneStory(db, p[1]) : fail(400, 'code');
  if (p[0] === 'receipts' && p[1] && m === 'GET') return receipt(db, p[1]);
  if (p[0] === 'talk' && !p[1] && m === 'GET') return talkList(db, url);
  if (p[0] === 'talk' && !p[1] && m === 'POST') return talkSay(db, env, req);
  if (p[0] === 'mine' && p[1] && !p[3] && (m === 'GET' && !p[2] || m === 'POST' && p[2])) return mine(db, env, req, p[1], p[2]);
  if (p[0] === 'photos' && p[1] && m === 'GET') return photo(db, p[1], false);
  if (p[0] === 'partners' && m === 'GET') return partners(db);
  if (p[0] === 'osm' && !p[1] && m === 'GET') return osmThrough(db, env, req, url);
  if (p[0] === 'places' && !p[1] && m === 'GET') return listPlaces(db);
  if (p[0] === 'places' && !p[1] && m === 'POST') return suggestPlace(db, env, req);
  if (p[0] === 'posts' && !p[1] && m === 'GET') return listPosts(db);
  if (p[0] === 'posts' && p[1] && p[2] === 'cover' && m === 'GET') return postCover(db, p[1], false);
  if (p[0] === 'posts' && p[1] && !p[2] && m === 'GET') return onePost(db, p[1], false);
  if (p[0] === 'settings' && m === 'GET') return json(await settingsOf(db));
  if (p[0] === 'example' && m === 'GET') return exampleBoard(db);
  if (p[0] === 'printers' && p[1] && p[2] === 'next' && m === 'GET') return next(db, req, p[1]);
  if (p[0] === 'printers' && p[1] && p[2] === 'jobs' && p[3] && m === 'POST') return report(db, req, p[1], p[3]);
  if (p[0] === 'touch' && p[1] && !p[2] && m === 'GET') return touchList(db, req, p[1]);
  if (p[0] === 'touch' && p[1] && p[2] && m === 'POST') return touchAct(db, req, p[1], p[2]);
  if (p[0] === 'admin') return admin(db, env, req, p.slice(1));
  return fail(404, 'not found');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return new Response(`ok ${BUILD}${PREVIEW ? ' preview' : ''}`, { headers: TEXT_H });
    if (url.pathname.startsWith('/api/')) {
      /* the app's own pages only: a request from another site is refused */
      const origin = request.headers.get('origin'); if (origin && request.method !== 'GET' && origin !== url.origin) return fail(403, 'origin');
      try { return await api(request, env, url, ctx); } catch (e) { return fail(e.status || 500, e.status ? e.message : 'error'); }
    }
    return env.ASSETS.fetch(request);
  },
};
