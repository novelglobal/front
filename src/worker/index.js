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
const LIMIT = { example: 700e3, body: 4.2e6, sig: 9000, record: 20e3, cells: 60e3, cellsN: 200, photo: 420e3, full: 14e6, bodyBig: 20e6, escpos: 900e3, mesh: 240, waiting: 2000, perPrinter: 20, sends: 20 };
/* a pack of cells: up to 200, each with a place on the ground and a short name */
const cellsOk = t => { if (typeof t !== 'string' || t.length > LIMIT.cells) return false; let d; try { d = JSON.parse(t); } catch (e) { return false; }
  return !!d && Array.isArray(d.cells) && d.cells.length >= 1 && d.cells.length <= LIMIT.cellsN && d.cells.every(c => c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180 && typeof c.n === 'string' && c.n.length <= 80); };
const CODE = /^DA-[0-9A-HJKMNP-TV-Z]{4}$/;
/* a maker's own three characters (no I, O, 0 or 1), printed on what they make: with it they find and take down their own things */
/* a maker's code; 888 is the master's, the main board's, reserved on every island: it opens the showcase on a phone and is never
   anyone's (no phone makes it, since every code mixes letters and numbers, and none may talk, post or claim with it) */
const SHOWCASE = '888', WHO0 = /^[A-HJ-NP-Z2-9]{3}$/, WHO = { test: s => WHO0.test(s) && s !== SHOWCASE };

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
  /* species: every kind of life the devices have met, told once by the first device to meet it (iNaturalist's id, names, group, mark, a photograph) */
  `CREATE TABLE IF NOT EXISTS species (id INTEGER PRIMARY KEY, n TEXT NOT NULL, cn TEXT, ic TEXT, g TEXT, ph TEXT, first INTEGER NOT NULL)`,
  /* tapes: a loop recorded on the radio, its file kept in R2 for half a moon to be saved from any phone, then cleared */
  /* a card's own pictures, kept in R2 (card/<card>/<slot>): up to ten to turn through, or one behind it; and how fast they turn, how strongly it shows */
  `CREATE TABLE IF NOT EXISTS cardpics (card TEXT NOT NULL, slot INTEGER NOT NULL, type TEXT NOT NULL, bytes INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (card, slot))`,
  `CREATE TABLE IF NOT EXISTS cardset (card TEXT PRIMARY KEY, speed REAL, shade REAL)`,
  `CREATE TABLE IF NOT EXISTS tapes (id TEXT PRIMARY KEY, who TEXT, name TEXT NOT NULL, type TEXT NOT NULL, bytes INTEGER NOT NULL, at INTEGER NOT NULL)`,
];
/* SCHEMA_V: the database's version. Raise it by one whenever a table or a column is added below: each database (the live one and the
   preview's) then makes the changes once and keeps the number, and every start after is one read */
const SCHEMA_V = 9;
const readied = new WeakMap();
function ready(db) {
  if (!readied.has(db)) readied.set(db, (async () => {
    const at = await db.prepare("SELECT v FROM settings WHERE k = '~schema'").first().catch(() => null);
    if (!at || +at.v < SCHEMA_V) await upgrade(db);
    /* every partner place has a print queue from the start; a printer joins it when its token is made on the approval page */
    if (PARTNERS.length) await db.batch(PARTNERS.map(p => db.prepare('INSERT OR IGNORE INTO printers (id, name, paper, created, links, two) VALUES (?, ?, ?, ?, ?, 1)').bind(p.id, p.n, p.paper, now(), '*')));
    await numberPrinters(db);
  })().catch(e => { readied.delete(db); throw e; }));
  return readied.get(db);
}
async function upgrade(db) {
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
    /* full: its full-size photograph is kept in Cloudflare's storage (R2, bound as MEDIA), for the approval page only */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN full INTEGER').run(); } catch (e) { /* already there */ }
    /* lv: the furthest a maker's journey has reached (0 to 4), so a code typed on another phone brings it back */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN lv INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* kin: each maker's own species and mark, handed out in turn so no two share one (0, 1, 2 ...) */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN kin INTEGER').run(); } catch (e) { /* already there */ }
    /* printed: when a printer first printed something of this maker's. Only a code a printer has given opens the talk (a save never
       does). Those already printed for, by what is still kept, keep it */
    try { await db.prepare('ALTER TABLE makers ADD COLUMN printed INTEGER').run();
      await db.prepare("UPDATE makers SET printed = last WHERE printed IS NULL AND who IN (SELECT s.who FROM stories s WHERE s.who IS NOT NULL AND (s.stage = 'booth' OR s.id IN (SELECT story FROM jobs WHERE status = 'printed') OR (s.dest != '' AND s.dest != 'mesh' AND s.status = 'shown')))").run(); } catch (e) { /* already there */ }
    /* k: what a word in the talk is for: said, a swap, or sharing */
    try { await db.prepare('ALTER TABLE talk ADD COLUMN k TEXT').run(); } catch (e) { /* already there */ }
    /* art: the poster as designed, kept in R2 (its size), for the wall of posters; quiet: its talk closed on the approval page */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN art INTEGER').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE stories ADD COLUMN quiet INTEGER').run(); } catch (e) { /* already there */ }
    /* version 3. grp: the portfolio group a piece is filed under on the approval page (kept here; not on the site yet) */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN grp TEXT').run(); } catch (e) { /* already there */ }
    /* can: what a printer's receiver says it can do besides print ('off'); off: when TURN OFF was pressed for it */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN can TEXT').run(); } catch (e) { /* already there */ }
    /* warm: when someone last set out towards a print (the make step), so the printers ask quickly for a while */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN warm INTEGER').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN off INTEGER').run(); } catch (e) { /* already there */ }
    /* touch: the hash of a small touch screen's token; while set, that screen is where a held slip is printed or squashed */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN touch TEXT').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN touch_seen INTEGER').run(); } catch (e) { /* already there */ }
    /* the Wi-Fi each is on and how strongly, as each last said (JSON: { n, rssi, at }); and a Wi-Fi setup asked for */
    for (const col of ['net TEXT', 'touch_net TEXT', 'wifi INTEGER']) { try { await db.prepare(`ALTER TABLE printers ADD COLUMN ${col}`).run(); } catch (e) { /* already there */ } }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN refused TEXT').run(); } catch (e) { /* already there */ }
    /* two: an island granted two-way. novel.global may always use an island's printer; two-way lets the island's own experiences print on novel.global's too */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN two INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* version 6. number: its island number on the novel.global network (numberPrinters) */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN number INTEGER').run(); } catch (e) { /* already there */ }
    /* version 7. owner: the hash of the island keeper's key (handed over once, at pairing); self: it joined by itself, while joining was open */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN owner TEXT').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE printers ADD COLUMN self INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
    /* version 8. links: the connections it has switched on (LINKS, or * for all). novel.global's printers and the starting ones have every one, and two-way */
    try { await db.prepare('ALTER TABLE printers ADD COLUMN links TEXT').run(); } catch (e) { /* already there */ }
    await db.prepare("UPDATE printers SET links = '*', two = 1 WHERE links IS NULL AND COALESCE(self, 0) = 0").run();
    /* version 2. pic, cov: a photograph or a portfolio cover kept in R2 (its size), no longer inside the database */
    try { await db.prepare('ALTER TABLE stories ADD COLUMN pic INTEGER').run(); } catch (e) { /* already there */ }
    try { await db.prepare('ALTER TABLE posts ADD COLUMN cov INTEGER').run(); } catch (e) { /* already there */ }
    await db.prepare("INSERT INTO settings (k, v) VALUES ('~schema', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(String(SCHEMA_V)).run();
}
/* each printer's island number, given the first time it is paired, in that order: novel.global's own is 1, the islands 2 and up. It stays
   through unpairing and is never given again; ISLAND N on the approval page sets it by hand */
async function numberPrinters(db) {
  await db.prepare("UPDATE printers SET number = 1 WHERE id = 'novelglobal' AND number IS NULL").run();
  const { results } = await db.prepare("SELECT id FROM printers WHERE number IS NULL AND token IS NOT NULL AND id != 'novelglobal' ORDER BY created, id").all(); if (!results.length) return;
  let n = Math.max(1, (await db.prepare('SELECT max(number) AS n FROM printers').first()).n || 0);
  await db.batch(results.map(r => db.prepare('UPDATE printers SET number = ? WHERE id = ?').bind(++n, r.id)));
}
/* a preview keeps to its own database, so testing never reaches real stories or a real printer */
/* ───────── staying inside Cloudflare's free allowances. Each copy of the Worker counts its requests and the rows it writes, and adds
   them to the day's count about once a minute (one write, not one a request). Past six tenths of a day's allowance the site goes
   calm (the printers ask less often); past eight and a half it rests (talk and new places wait for tomorrow, printing goes on) ───────── */
const CAP = { req: 100e3, w: 100e3, r2: 10e9 };   // the Workers free plan's requests a day, D1's rows written a day, R2's free storage
const USE = { day: '', req: 0, w: 0, keys: {}, at: 0, sum: { req: 0, w: 0 }, level: 0, warmAt: 0 };
const levelOf = () => { const r = Math.max((USE.sum.req + USE.req) / CAP.req, (USE.sum.w + USE.w) / CAP.w); return r >= 0.85 ? 2 : r >= 0.6 ? 1 : 0; };
const metered = new WeakMap();
function meterOf(db) {
  if (!db) return db; if (metered.has(db)) return metered.get(db);
  const add = r => { USE.w += (r && r.meta && r.meta.rows_written) || 0; return r; };
  try { const SP = Object.getPrototypeOf(db.prepare('SELECT 1')); if (!SP.__ng) { const run = SP.run; SP.run = async function (...a) { return add(await run.apply(this, a)); }; SP.__ng = true; } } catch (e) { /* uncounted */ }
  const m = new Proxy(db, { get(t, k) { if (k === 'batch') return async s => { const r = await t.batch(s); (r || []).forEach(add); return r; }; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
  metered.set(db, m); return m;
}
const dbOf = env => meterOf((PREVIEW && env.DB_PREVIEW) || env.DB);
function settle(env, ctx, force) {
  const db = dbOf(env), t = now(), day = new Date(t).toISOString().slice(0, 10);
  if (USE.day !== day) { if (USE.day) force = true; }
  if (!db || (!force && (!ctx || t - USE.at < 60e3))) return;
  const d = USE.day || day, rows = { ...USE.keys, '~req': USE.req, '~w': USE.w }; USE.keys = {}; USE.req = 0; USE.w = 0; USE.at = t;
  if (USE.day !== day) { USE.day = day; USE.sum = { req: 0, w: 0 }; }
  const p = (async () => { try { await ready(db);
    const up = Object.entries(rows).filter(([, n]) => n > 0).map(([k, n]) => db.prepare('INSERT INTO traffic (day, k, n) VALUES (?, ?, ?) ON CONFLICT(day, k) DO UPDATE SET n = n + excluded.n').bind(d, k, n));
    if (up.length) await db.batch(up);
    const { results } = await db.prepare("SELECT k, n FROM traffic WHERE day = ? AND k IN ('~req', '~w')").bind(day).all();
    for (const r of results) USE.sum[r.k.slice(1)] = r.n; USE.level = levelOf();
  } catch (e) { /* counted next time */ } })();
  if (ctx) ctx.waitUntil(p); return p;
}
/* how long a printer or its screen waits before asking again: quick while someone is on their way to print (or a slip waits), slow otherwise */
const waitOf = (p, busy) => { const L = Math.max(USE.level, levelOf()), warm = busy || (p.warm && now() - p.warm < 5 * 60e3); return warm ? [2, 4, 8][L] : [20, 60, 120][L]; };

/* ───────── small tools ───────── */
const enc = new TextEncoder();
async function sha256(s) { const d = await crypto.subtle.digest('SHA-256', enc.encode(s)); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
const rid = (n = 16) => { const a = crypto.getRandomValues(new Uint8Array(n)); return [...a].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); };
async function same(a, b) { const [x, y] = await Promise.all([sha256(String(a)), sha256(String(b))]); return crypto.subtle.timingSafeEqual ? crypto.subtle.timingSafeEqual(enc.encode(x), enc.encode(y)) : x === y; }
const bearer = req => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
const b64ok = (s, max) => typeof s === 'string' && s.length <= max && /^[A-Za-z0-9+/=_-]*$/.test(s);
/* an upload's original file, as it came (a photograph of any of the usual kinds), with its kind */
function dataFile(s, max) { const m = typeof s === 'string' && s.match(/^data:(image\/(?:jpeg|png|webp|heic|heif|gif|avif));base64,([A-Za-z0-9+/=]+)$/); if (!m || m[2].length > max) return null; const bin = atob(m[2]); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return { bytes: out, type: m[1] }; }
function dataURL(s, max = LIMIT.photo) { const m = typeof s === 'string' && s.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/); if (!m || m[1].length > max) return null; const bin = atob(m[1]); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out[0] === 0xFF && out[1] === 0xD8 ? out : null; }
async function body(req, max = LIMIT.body) {
  const n = +(req.headers.get('content-length') || 0); if (n > max) throw Object.assign(new Error('too large'), { status: 413 });
  const t = await req.text(); if (t.length > max) throw Object.assign(new Error('too large'), { status: 413 });
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
async function tidy(db, env) {
  const t = now(); await tapesGo(db, env);
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
const PUBLIC_COLS = "id, code, kind, body, dest, created, decided, (photo IS NOT NULL OR pic IS NOT NULL) AS has_photo, star, (SELECT count(*) FROM jobs j WHERE j.story = stories.id AND j.status = 'printed') AS printed";

async function listStories(db, url) {
  if (!(await madeOn(db))) return json({ stories: [], at: now() });
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
  if (!(await madeOn(db))) return fail(404, 'not found');
  const r = await db.prepare(`SELECT ${PUBLIC_COLS} FROM stories WHERE status = 'shown' AND gone IS NULL AND kind != 'message' AND code = ? ORDER BY decided DESC LIMIT 1`).bind(code).first();
  return r ? json({ story: storyOut(r) }) : fail(404, 'not found');
}
async function photo(db, env, id, any) {
  const r = await db.prepare(`SELECT photo, pic, status, kind, gone FROM stories WHERE id = ?`).bind(id).first();
  if (!r || !(r.photo || r.pic) || (!any && (r.status !== 'shown' || r.gone || r.kind === 'message' || !(await madeOn(db))))) return fail(404, 'not found');
  const o = !r.photo && env.MEDIA ? await env.MEDIA.get(photoKey(id)) : null; if (!r.photo && !o) return fail(404, 'not found');
  return new Response(o ? o.body : new Uint8Array(r.photo), { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=3600', 'x-content-type-options': 'nosniff' } });
}
/* a maker's own, by their three characters: what they sent (the words only of what is on the site), and taking one down.
   Taken down is off the site only: the approval page keeps it as it was. Asked too often from one place, it waits */
/* a maker's kin, given if they have none yet (makers from before kin, or one only known by a code typed) */
async function kinOf(db, who) {
  let mk = await db.prepare('SELECT lv, kin, printed FROM makers WHERE who = ?').bind(who).first(); if (!mk) return null;
  if (mk.kin == null) { await db.prepare('UPDATE makers SET kin = (SELECT COALESCE(MAX(kin), -1) + 1 FROM makers) WHERE who = ? AND kin IS NULL').bind(who).run(); mk = await db.prepare('SELECT lv, kin, printed FROM makers WHERE who = ?').bind(who).first(); }
  return mk;
}
/* the board: the latest of a section (or all), each by its maker's kin; written only with a code a print gave (a maker the site knows) */
const SECS = ['notice', 'story', 'make', 'print'];
const POSTER_SEC = /^p\.DA-[0-9A-HJKMNP-TV-Z]{4}$/, SONG_SEC = /^p\.S-[0-9a-z]{6}$/;
/* a talk's place: a step, or a poster shown on the site (never a private message, never one taken down); its own maker can
   always talk on it, shown or still a draft */
async function secOf(db, s, who) {
  if (SECS.includes(s) || SONG_SEC.test(s || '')) return s;   // a song's art: anyone who has it may talk on it
  if (!POSTER_SEC.test(s || '')) return null;
  if (who && (await db.prepare("SELECT 1 AS k FROM stories WHERE code = ? AND who = ? AND gone IS NULL AND kind != 'message'").bind(s.slice(2), who).first())) return s;
  if (!(await madeOn(db))) return null;
  return (await db.prepare("SELECT 1 AS k FROM stories WHERE code = ? AND status = 'shown' AND gone IS NULL AND quiet IS NULL AND kind != 'message'").bind(s.slice(2)).first()) ? s : null;
}
const TALK_K = ['swap', 'share'];
async function talkList(db, env, req, url) {
  const s = url.searchParams.get('s'), who = url.searchParams.get('who') || ''; if (!WHO.test(who)) return fail(400, 'talk');
  if (await tooMany(db, env, req, 'talkr', 120, 10 * 60e3)) return fail(429, 'too many');
  const sec = await secOf(db, s, who); if (!sec) return fail(400, 'talk');
  const { results } = await db.prepare(`SELECT t.id, t.sec, t.text, t.re, t.at, t.k, m.kin FROM talk t LEFT JOIN makers m ON m.who = t.who WHERE t.hidden IS NULL${sec ? ' AND t.sec = ?' : ''} ORDER BY t.at DESC LIMIT 80`).bind(...(sec ? [sec] : [])).all();
  return json({ talk: results });
}
/* bot protection (Cloudflare Turnstile, free): a person's token checked once the TURNSTILE_SECRET secret is set; until then everyone passes */
async function human(env, req, tok) {
  if (!env.TURNSTILE_SECRET) return true; if (typeof tok !== 'string' || !tok || tok.length > 2048) return false;
  const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', tok); const ip = req.headers.get('cf-connecting-ip'); if (ip) f.append('remoteip', ip);
  try { const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f }); return !!(await r.json()).success; } catch (e) { return false; }
}
/* where a story's full photograph is kept in R2; a preview build keeps its own apart */
const mediaKey = id => `${PREVIEW ? 'preview/' : ''}full/${id}.jpg`;
const photoKey = id => `${PREVIEW ? 'preview/' : ''}photo/${id}.jpg`, coverKey = id => `${PREVIEW ? 'preview/' : ''}cover/${id}.jpg`;
/* a photograph into R2 while there is room under the 8 GB kept for it: true once it is there */
async function toR2(db, env, key, bytes) { if (!env.MEDIA || !bytes || (await r2Bytes(db)) + bytes.length >= CAP.r2 * 0.8) return false; try { await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } }); return true; } catch (e) { return false; } }
/* the photographs still inside the database moved to R2, a few at a time (the approval page's overview asks for it as it refreshes) */
async function movePhotos(db, env, n = 10) {
  if (!env.MEDIA) return 0; let moved = 0;
  const { results: st } = await db.prepare('SELECT id, photo FROM stories WHERE photo IS NOT NULL LIMIT ?').bind(n).all();
  for (const r of st) { const b = new Uint8Array(r.photo); if (await toR2(db, env, photoKey(r.id), b)) { await db.prepare('UPDATE stories SET photo = NULL, pic = ? WHERE id = ?').bind(b.length, r.id).run(); moved++; } }
  const { results: po } = await db.prepare('SELECT id, cover FROM posts WHERE cover IS NOT NULL LIMIT ?').bind(n).all();
  for (const r of po) { const b = new Uint8Array(r.cover); if (await toR2(db, env, coverKey(r.id), b)) { await db.prepare('UPDATE posts SET cover = NULL, cov = ? WHERE id = ?').bind(b.length, r.id).run(); moved++; } }
  return moved;
}
async function talkSay(db, env, req) {
  const b = await body(req); const who = typeof b.who === 'string' ? b.who : '', text = typeof b.text === 'string' ? b.text.trim().slice(0, 280) : '';
  const sec = WHO.test(who) && text ? await secOf(db, b.s, who) : null; if (!sec) return fail(400, 'talk');
  if (levelOf() >= 2) return fail(503, 'resting');
  if (await tooMany(db, env, req, 'talk', 20, 10 * 60e3)) return fail(429, 'too many');
  if (!(await human(env, req, b.cf))) return fail(403, 'human');
  /* anyone with a code may talk (kept in check by the limits, the hours and the approval page, which can hide a word); a code
     the site has not met yet is met here */
  await db.prepare('INSERT INTO makers (who, first, last, posts, stage, lv, kin) VALUES (?, ?, ?, 0, NULL, 0, (SELECT COALESCE(MAX(kin), -1) + 1 FROM makers)) ON CONFLICT(who) DO NOTHING').bind(who, now(), now()).run();
  const mk = await kinOf(db, who); if (!mk) return fail(400, 'talk');
  const re = typeof b.re === 'string' && /^[a-z0-9]{6,24}$/.test(b.re) ? b.re : null, id = rid(), t = now();
  await db.batch([db.prepare('INSERT INTO talk (id, sec, who, text, re, at, k) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, sec, who, text, re, t, TALK_K.includes(b.k) ? b.k : null), db.prepare('UPDATE makers SET last = ? WHERE who = ?').bind(t, who)]);
  return json({ id, kin: mk.kin, at: t }, 201);
}
/* a tape: the loop as recorded (WAV, or what the phone made), up to 16 MB, from a maker's code; kept half a moon, then cleared.
   Its name is the one it is saved under, the same wherever it is saved from */
const TAPE = { bytes: 16e6, keep: 14 * DAY, types: /^audio\/(wav|x-wav|webm|mp4|ogg)$/ };
const tapeKey = id => `${PREVIEW ? 'preview/' : ''}tape/${id}`;
async function tapeUp(db, env, req, url) {
  const who = url.searchParams.get('who') || '', type = String(req.headers.get('content-type') || '').split(';')[0].trim();
  const name = String(url.searchParams.get('name') || '').toLowerCase().replace(/[^a-z0-9.-]+/g, '-').slice(0, 80);
  if (!WHO.test(who) || !TAPE.types.test(type) || !/^novel-global-[a-z0-9-]+\.(wav|webm|m4a|ogg)$/.test(name)) return fail(400, 'tape');
  if (!env.MEDIA) return fail(503, 'no room');
  const n = +(req.headers.get('content-length') || 0); if (n > TAPE.bytes) return fail(413, 'too big');
  if (await tooMany(db, env, req, 'tape', 12, H)) return fail(429, 'too many');
  const b = new Uint8Array(await req.arrayBuffer()); if (!b.length || b.length > TAPE.bytes) return fail(413, 'too big');
  if ((await r2Bytes(db)) + b.length >= CAP.r2 * 0.8) return fail(503, 'no room');
  const id = rid(12), t = now(); await env.MEDIA.put(tapeKey(id), b, { httpMetadata: { contentType: type } });
  await db.prepare('INSERT INTO tapes (id, who, name, type, bytes, at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, who, name, type, b.length, t).run();
  return json({ id, url: `/api/tapes/${id}`, name, until: t + TAPE.keep }, 201);
}
async function tapeGet(db, env, id) {
  if (!/^[a-z0-9]{6,24}$/.test(id)) return fail(404, 'not found');
  const r = await db.prepare('SELECT name, type, at FROM tapes WHERE id = ?').bind(id).first(); if (!r || now() - r.at > TAPE.keep || !env.MEDIA) return fail(404, 'not found');
  const o = await env.MEDIA.get(tapeKey(id)); if (!o) return fail(404, 'not found');
  return new Response(o.body, { headers: { 'content-type': r.type, 'content-disposition': `attachment; filename="${r.name}"`, 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff' } });
}
/* the tapes older than half a moon: their files cleared from R2 and their rows gone, a few at a time */
async function tapesGo(db, env) {
  const { results } = await db.prepare('SELECT id FROM tapes WHERE at < ? LIMIT 50').bind(now() - TAPE.keep).all().catch(() => ({ results: [] }));
  for (const r of results) { if (env && env.MEDIA) await env.MEDIA.delete(tapeKey(r.id)).catch(() => {}); await db.prepare('DELETE FROM tapes WHERE id = ?').bind(r.id).run(); }
}
/* one's own printed poster put live by its maker's code: shown on the site's wall for everyone at once, no approval first (the
   approval page can still take it down); never one refused or taken down, never a message */
async function live(db, env, req) {
  const b = await body(req), who = typeof b.who === 'string' ? b.who : '';
  if (!WHO.test(who) || !CODE.test(b.code || '')) return fail(400, 'live');
  if (await tooMany(db, env, req, 'live', 12, 10 * 60e3)) return fail(429, 'too many');
  if (!(await madeOn(db))) return fail(503, 'closed');
  const s = await db.prepare("SELECT id, status, art FROM stories WHERE code = ? AND who = ? AND gone IS NULL AND kind NOT IN ('message', 'example') ORDER BY created DESC LIMIT 1").bind(b.code, who).first();
  if (!s || ['refused', 'deleted', 'expired'].includes(s.status)) return fail(404, 'not found');
  if (!s.art) return fail(409, 'no picture');
  if (s.status !== 'shown') await db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = ?").bind(now(), s.id).run();
  return json({ ok: true, id: s.id });
}
async function mine(db, env, req, who, id) {
  if (!WHO.test(who || '')) return fail(400, 'who');
  if (await tooMany(db, env, req, 'mine', 60, 10 * 60e3)) return fail(429, 'too many');
  await db.prepare('UPDATE makers SET last = ? WHERE who = ?').bind(now(), who).run();
  if (id) { const r = await db.prepare('UPDATE stories SET gone = ? WHERE id = ? AND who = ? AND gone IS NULL').bind(now(), id, who).run(); return r.meta && r.meta.changes ? json({ ok: true }) : fail(404, 'not found'); }
  const { results } = await db.prepare(`SELECT id, code, kind, status, body, created, decided, (photo IS NOT NULL OR pic IS NOT NULL) AS has_photo FROM stories WHERE who = ? AND gone IS NULL AND kind NOT IN ('example', 'message') ORDER BY created DESC LIMIT 100`).bind(who).all();
  const mk = await kinOf(db, who);
  return json({ lv: (mk && mk.lv) || 0, kin: mk ? mk.kin : null, printed: !!(mk && mk.printed), mine: results.map(r => ({ id: r.id, code: r.code, kind: r.kind, shown: r.status === 'shown', at: r.created, photo: r.status === 'shown' && !!r.has_photo, body: r.status === 'shown' ? r.body : '' })) });
}
/* a story sent: it waits for approval. A job for the partner's printer waits with it, unless that printer prints without approval.
   dest 'mesh': no print, only its mesh line, to every paired printer whose radio is on (MESH), to go out over the local mesh */
async function send(db, env, req) {
  const b = await body(req, LIMIT.bodyBig);
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
  if (P && P.id !== 'novelglobal' && b.stage !== 'stack' && !linksOf(P.links).includes('wish')) return refuse(403, 'this island has not switched on W.I.S.H.');
  if (toMesh && !(typeof b.mesh === 'string' && b.mesh)) return fail(400, 'mesh');
  if (dest && b.escpos != null && !b64ok(b.escpos, LIMIT.escpos)) return refuse(400, 'the print is too long');
  if (b.mesh != null && (typeof b.mesh !== 'string' || enc.encode(b.mesh).length > LIMIT.mesh)) return fail(400, 'mesh');
  const { n } = await db.prepare("SELECT count(*) AS n FROM stories WHERE status = 'waiting'").first(); if (n >= LIMIT.waiting) return refuse(503, 'too many stories waiting for approval');
  const who = typeof b.who === 'string' && WHO.test(b.who) ? b.who : null;
  const cf = req.cf || {}, ua = req.headers.get('user-agent') || '', str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  const origin = JSON.stringify({ from: str(b.from, 24), stage: str(b.stage, 60), city: str(cf.city, 40), region: str(cf.region, 40), country: str(cf.country, 4), dev: /Mobi|Android|iPhone|iPad/i.test(ua) ? 'phone' : 'computer', mesh: str(b.mesh, 240) });
  const id = rid(); const t = now(); const inR2 = pic ? await toR2(db, env, photoKey(id), pic) : false;
  const live = !dest && kind === 'record' && !!(await settingsOf(db)).sendLive, st0 = live ? 'shown' : 'waiting';
  const ops = [db.prepare('INSERT INTO stories (id, code, kind, status, body, photo, pic, lat, lng, dest, created, decided, who, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, b.code, kind, st0, b.body, inR2 ? null : pic, inR2 ? pic.length : null, lat, lng, dest || null, t, live ? t : null, who, origin)];
  let job = null;
  if (P && (b.escpos || b.mesh)) {
    const { q } = await db.prepare("SELECT count(*) AS q FROM jobs WHERE printer = ? AND status IN ('held', 'queued', 'printing')").bind(dest).first(); if (q >= LIMIT.perPrinter) return refuse(503, 'its queue is full');
    /* held for the touch screen only while it is there: a screen not heard from for two and a half minutes is passed by */
    const screenGone = P.touch && (!P.touch_seen || t - P.touch_seen > 150e3);
    job = { id: rid(), status: P.auto || screenGone ? 'queued' : 'held' };
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
  if (dest && !toMesh) ops.push(db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(t, dest));
  await db.batch(ops);
  /* the full photograph, kept in R2 when it is bound; the print and the site never need it */
  const lowRes = (await settingsOf(db)).lowRes, full = env.MEDIA && b.full && !lowRes ? dataFile(b.full, LIMIT.full) : null, art = env.MEDIA && b.art ? dataURL(b.art, LIMIT.full) : null;
  if (art && (await r2Bytes(db)) + art.length < CAP.r2 * 0.8) { try { await env.MEDIA.put(`art/${id}`, art, { httpMetadata: { contentType: 'image/jpeg' } }); await db.prepare('UPDATE stories SET art = ? WHERE id = ?').bind(art.length, id).run(); } catch (e) { /* kept without it */ } }
  if (full && (await r2Bytes(db)) + full.bytes.length < CAP.r2 * 0.8) { try { await env.MEDIA.put(mediaKey(id), full.bytes, { httpMetadata: { contentType: full.type } }); await db.prepare('UPDATE stories SET full = ? WHERE id = ?').bind(full.bytes.length, id).run(); } catch (e) { /* the story is kept without it */ } }
  return json({ id, status: st0, job }, 201);
}
/* the sender's receipt: where their story is, and where its print is in the queue */
async function receipt(db, id) {
  const s = await db.prepare('SELECT id, code, status, dest FROM stories WHERE id = ?').bind(id).first(); if (!s) return fail(404, 'not found');
  const j = await db.prepare('SELECT id, printer, status, created, done, error FROM jobs WHERE story = ? ORDER BY created DESC LIMIT 1').bind(id).first();
  let ahead = 0; if (j && j.status === 'queued') ({ ahead } = await db.prepare("SELECT count(*) AS ahead FROM jobs WHERE printer = ? AND status IN ('queued', 'printing') AND created < ?").bind(j.printer, j.created).first());
  return json({ id, code: s.code, status: s.status, dest: s.dest || '', job: j ? { status: j.status, ahead, done: j.done || null, error: j.status === 'failed' ? String(j.error || '').slice(0, 60) : null } : null });
}
/* every pull adds to the engine: a device tells the kinds of life it has met for the first time, and those new here are kept (an
   insert that finds one already kept writes nothing). Resting, they wait for the device's next pull */
const PH_OK = /^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/[\w./-]{1,240}$/;
async function learnKinds(db, env, req) {
  if (levelOf() >= 2) return fail(503, 'resting');
  const b = await body(req), list = Array.isArray(b.kinds) ? b.kinds.slice(0, 60) : []; if (!list.length) return fail(400, 'kinds');
  if (await tooMany(db, env, req, 'kinds', 12, 10 * 60e3)) return fail(429, 'too many');
  const s = (v, n, re) => (typeof v === 'string' && v.length <= n && (!re || re.test(v)) ? v : ''), t = now();
  const ok = list.filter(k => k && Number.isInteger(k.id) && k.id > 0 && k.id < 1e10 && s(k.n, 120));
  if (!ok.length) return fail(400, 'kinds');
  const r = await db.batch(ok.map(k => db.prepare('INSERT OR IGNORE INTO species (id, n, cn, ic, g, ph, first) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(k.id, s(k.n, 120), s(k.cn, 120), s(k.ic, 30, /^[A-Za-z]+$/), s(k.g, 24, /^[a-z-]+$/), s(k.ph, 300, PH_OK), t)));
  return json({ added: r.reduce((n, x) => n + ((x && x.meta && x.meta.changes) || 0), 0) });
}
/* the site's own settings, for everyone: whether the nature station stays on for every visitor (lifeLock, on unless unlocked);
   whether BOARD 00, the example, can be rewritten and sent here for approval (exampleEdit, off unless switched on) */
/* lowRes: keep only the print-sized photograph, never the full-size one (off: full size in R2) */
/* madeShow: what people make (stories, posters, packs, their photographs and talk) shown to visitors; off, every one of them stays a
   draft, decided on here and seen by no one else. exampleShow: the example poster and BOARD 00 shown to visitors */
/* moonShow: the moon tonight beside SOUND in the dark, and the moon each thing was made under in the corner of every print and piece kept */
/* sendLive: a piece sent to novel.global with no printer (and no mesh) shown on the site at once; off, it waits here for approval. A print
   is the only thing that opens the devices, either way */
const SETTINGS = { openJoin: true, lifeLock: true, exampleEdit: false, phreak: false, lowRes: false, madeShow: false, exampleShow: true, moonShow: true, sendLive: false };
const madeOn = async db => !!(await settingsOf(db)).madeShow;
/* and words: the first board's template, as rewritten on the approval page (empty: the site's own, in config.js) */
/* gates: how the devices are earned (JSON: mode earn | open | closed, at: the posters for each); fx: the aura's motion (calm | base | chaos);
   curations: the portfolio's twelve groups (JSON: [{ k, name, about }]) */
/* start: the start page and the booth (JSON: discWords, checklist, printNight paper | day | night, boothHome s, boothGap minutes between prints from one phone) */
/* notice: the words above the rings on a first visit (JSON: off, head, text; empty: the site's own); country: the words over El Niño's
   map the first time it opens on a phone (JSON: off, head, text; empty: the Country and its sovereignty from config.js) */
/* printq: how prints are made (JSON: preset soft | crisp | bold | screen | graphic, and any of its tweaks set apart: clip, gamma, contrast,
   sharpen, dither (auto: chosen for each picture), lineCut, bolden, minText, heat; and cal { b, m, w }, the curve read off the printed
   calibration strip; empty: crisp as it is) */
/* styles: the artists' mod packs added on the approval page (JSON: { packs: [{ name, by, styles: [...], off: [style ids not shown] }] };
   every style is checked again on each phone by thermal.js before it is used) */
/* groups: the portfolio's groups a piece can be filed under on the approval page, one to a line (kept here; not on the site yet) */
const TEXTS = { template: 6000, words: 4000, cities: 40000, gates: 300, fx: 20, curations: 6000, start: 600, notice: 1500, country: 600, groups: 600, printq: 800, sources: 8000, epoch: 40, styles: 100000, cards: 8000 };
/* what the full-size photographs take in R2: full holds each one's size (1, for those kept before sizes were, counts as the largest) */
async function r2Bytes(db) { const r = await db.prepare(`SELECT coalesce(sum(CASE WHEN full = 1 THEN ${LIMIT.full} ELSE coalesce(full, 0) END), 0) + coalesce(sum(art), 0) + coalesce(sum(pic), 0) AS b FROM stories WHERE full IS NOT NULL OR art IS NOT NULL OR pic IS NOT NULL`).first(); const c = await db.prepare('SELECT coalesce(sum(cov), 0) AS b FROM posts').first().catch(() => null); const tp = await db.prepare('SELECT coalesce(sum(bytes), 0) AS b FROM tapes').first().catch(() => null); const cp = await db.prepare('SELECT coalesce(sum(bytes), 0) AS b FROM cardpics').first().catch(() => null); return ((r && r.b) || 0) + ((c && c.b) || 0) + ((tp && tp.b) || 0) + ((cp && cp.b) || 0); }
/* the wall of posters: every poster shown on the site, as designed, the starred first; each with how much its talk has said */
async function posters(db) {
  if (!(await madeOn(db))) return json({ posters: [] });
  const { results } = await db.prepare("SELECT s.id, s.code, s.created AS at, s.star, s.quiet IS NOT NULL AS quiet, m.kin, (SELECT count(*) FROM talk t WHERE t.sec = 'p.' || s.code AND t.hidden IS NULL) AS said FROM stories s LEFT JOIN makers m ON m.who = s.who WHERE s.status = 'shown' AND s.gone IS NULL AND s.art IS NOT NULL AND s.kind != 'message' ORDER BY s.star DESC, s.created DESC LIMIT 120").all();
  return new Response(JSON.stringify({ posters: results.map(r => ({ ...r, star: !!r.star, quiet: !!r.quiet })) }), { headers: { ...JSON_H, 'cache-control': 'public, max-age=120' } });
}
async function posterArt(db, env, id, any) {
  if (!any && !(await madeOn(db))) return fail(404, 'not found');
  const s = await db.prepare(`SELECT id FROM stories WHERE id = ? AND art IS NOT NULL${any ? '' : " AND status = 'shown' AND gone IS NULL AND kind != 'message'"}`).bind(id).first(); if (!s || !env.MEDIA) return fail(404, 'not found');
  const o = await env.MEDIA.get(`art/${id}`); if (!o) return fail(404, 'not found');
  return new Response(o.body, { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
}
async function settingsOf(db) { const { results } = await db.prepare('SELECT k, v FROM settings').all(); const out = { ...SETTINGS, ...Object.fromEntries(Object.keys(TEXTS).map(k => [k, ''])) }; for (const r of results) { if (r.k in SETTINGS) out[r.k] = r.v === '1'; else if (r.k in TEXTS) out[r.k] = r.v; } return out; }
/* the partner places: whether a printer is there and listening, and how much it has printed */
async function partners(db) {
  const { results } = await db.prepare(`SELECT p.id, p.name, p.paper, p.mesh, p.live, p.two, p.links, p.token IS NOT NULL AS paired, p.seen,
      (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status IN ('queued', 'printing')) AS queued,
      (SELECT count(*) FROM jobs j WHERE j.printer = p.id AND j.status = 'printed') AS printed FROM printers p ORDER BY p.created`).all();
  return json({ partners: results.map(p => ({ id: p.id, name: p.name, paper: p.paper, paired: !!p.paired, mesh: !!p.mesh && !!p.paired, live: !!p.live, two: !!p.two, links: p.id === 'novelglobal' ? LINKS : linksOf(p.links), ready: !!p.seen && now() - p.seen < 2 * 60e3, queued: p.queued, printed: p.printed })) });
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
  if (p.touch && (!p.touch_seen || t - p.touch_seen > 150e3)) await db.prepare("UPDATE jobs SET status = 'queued' WHERE printer = ? AND status = 'held' AND created < ?").bind(id, t - 20e3).run();
  const j = await db.prepare("SELECT * FROM jobs WHERE printer = ? AND (status = 'queued' OR (status = 'printing' AND lease < ?)) ORDER BY (escpos IS NULL), created LIMIT 1").bind(id, t).first();
  const hint = { 'x-wait': String(waitOf(p, !!j)), 'x-island': String(p.number || '') };
  if (!j) return new Response(null, { status: 204, headers: { ...TEXT_H, ...hint } });
  if (j.tries >= 5) { await db.prepare("UPDATE jobs SET status = 'failed', error = 'tried five times', done = ? WHERE id = ?").bind(t, j.id).run(); return new Response(null, { status: 204, headers: TEXT_H }); }
  /* a slip with both paper and a mesh line: the line goes on as a job of its own, taken next, so a print that fails never keeps it off the mesh */
  if (j.escpos && j.mesh) { await db.batch([db.prepare("INSERT INTO jobs (id, printer, story, code, mesh, status, created) VALUES (?, ?, ?, ?, ?, 'queued', ?)").bind(rid(), id, j.story, j.code, j.mesh, j.created), db.prepare('UPDATE jobs SET mesh = NULL WHERE id = ?').bind(j.id)]); j.mesh = null; }
  await db.prepare("UPDATE jobs SET status = 'printing', lease = ?, tries = tries + 1 WHERE id = ?").bind(t + 60e3, j.id).run();
  const r = json({ job: j.id, code: j.code, escpos: j.escpos || null, mesh: j.mesh || null }); for (const k in hint) r.headers.set(k, hint[k]); return r;
}
/* ───────── a printer's touch screen: the slips held for it, each shown with the jellyfish; one press prints it, a long press squashes it ───────── */
async function touchAuth(db, req, id) {
  const p = await db.prepare('SELECT * FROM printers WHERE id = ?').bind(id).first(); const tok = bearer(req);
  if (!p || !p.touch || !tok || !(await same(await sha256(tok), p.touch))) return null;
  if (!p.touch_seen || now() - p.touch_seen > 60e3) await db.prepare('UPDATE printers SET touch_seen = ? WHERE id = ?').bind(now(), id).run(); return p;
}
const netOf = url => { const n = (url.searchParams.get('net') || '').slice(0, 40), r = +url.searchParams.get('rssi'), ip = url.searchParams.get('ip') || ''; return n ? JSON.stringify({ n, rssi: Number.isFinite(r) ? Math.max(-120, Math.min(0, Math.round(r))) : null, ...(/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) ? { ip } : {}), ...(/^[\w .·:-]{1,24}$/.test(url.searchParams.get('v') || '') ? { v: url.searchParams.get('v') } : {}), at: now() }) : null; };
async function touchList(db, req, id) {
  const p0 = await touchAuth(db, req, id); if (!p0) return fail(401, 'token');
  { const tn = netOf(new URL(req.url)); if (tn) { const o = JSON.parse(tn), was = (() => { try { return JSON.parse(p0.touch_net || 'null'); } catch (e) { return null; } })(); if (!was || was.n !== o.n || Math.abs((was.rssi || 0) - (o.rssi || 0)) > 6 || o.at - was.at > 60e3) await db.prepare('UPDATE printers SET touch_net = ? WHERE id = ?').bind(tn, id).run(); } }
  const { results } = await db.prepare(`SELECT j.id, j.code, j.created, j.escpos IS NOT NULL AS paper, j.thumb, s.body FROM jobs j LEFT JOIN stories s ON s.id = j.story WHERE j.printer = ? AND j.status = 'held' ORDER BY j.created LIMIT 5`).bind(id).all();
  const c = await db.prepare("SELECT sum(status = 'held') AS w, sum(status IN ('queued', 'printing')) AS q FROM jobs WHERE printer = ?").bind(id).first();
  return json({ wait: waitOf(p0, !!(c && (c.w || c.q))), waiting: (c && c.w) || 0, printing: (c && c.q) || 0, held: results.map((r, i) => { let b = {}; try { b = JSON.parse(r.body || '{}'); } catch (e) { /* none */ }
    return { job: r.id, code: r.code || '', at: r.created, say: String(b.text || '').slice(0, 140), wish: (Array.isArray(b.wish) ? b.wish : []).map(w => String(w).slice(0, 90)).slice(0, 4), life: b.tx && b.tx.cn ? String(b.tx.cn).slice(0, 40) : '', paper: !!r.paper, ...(i === 0 && r.thumb ? { img: r.thumb } : {}) }; }) });
}
async function touchAct(db, req, id, job) {
  if (!(await touchAuth(db, req, id))) return fail(401, 'token');
  const b = await body(req);
  /* the screen's hidden menu: the printer's Pi asked to turn off, as TURN OFF on the approval page does */
  if (job === 'off' && b.action === 'off') { await db.prepare('UPDATE printers SET off = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
  if (b.action === 'print') { await db.batch([db.prepare("UPDATE jobs SET status = 'queued' WHERE id = ? AND printer = ? AND status = 'held'").bind(job, id), db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = (SELECT story FROM jobs WHERE id = ?) AND status = 'waiting'").bind(now(), job), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(now(), id)]); return json({ ok: true }); }
  if (b.action === 'squash') { await db.batch([db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE id = (SELECT story FROM jobs WHERE id = ?) AND status = 'waiting'").bind(now(), job), db.prepare("DELETE FROM jobs WHERE id = ? AND printer = ? AND status = 'held'").bind(job, id)]); return json({ ok: true }); }
  return fail(400, 'action');
}
async function report(db, req, id, job) {
  if (!(await printerAuth(db, req, id))) return fail(401, 'token');
  const b = await body(req); const ok = b.status === 'printed'; if (!ok && b.status !== 'failed') return fail(400, 'status');
  await db.prepare(`UPDATE jobs SET status = ?, error = ?, done = ?, escpos = NULL, mesh = NULL WHERE id = ? AND printer = ? AND status = 'printing'`).bind(ok ? 'printed' : 'failed', ok ? null : String(b.error || '').slice(0, 200), now(), job, id).run();
  if (ok) await db.prepare('UPDATE makers SET printed = ? WHERE printed IS NULL AND who = (SELECT s.who FROM jobs j JOIN stories s ON s.id = j.story WHERE j.id = ?)').bind(now(), job).run();
  return json({ ok: true });
}

/* ───────── an island pairs without a token typed: it asks for a code, prints it, and asks again until the code is approved on the
   approval page; then it is handed its printer and a token, once. A code lasts a quarter of an hour; only its hash of the island's
   own secret is kept, and no token is kept at all (it is made at the moment it is handed over). The table is made on first use ───────── */
const PAIR_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', PAIR_FOR = 15 * 60e3;
const pairsReady = new WeakMap();
const pairs = db => { if (!pairsReady.has(db)) pairsReady.set(db, db.prepare('CREATE TABLE IF NOT EXISTS pairs (code TEXT PRIMARY KEY, device TEXT NOT NULL, name TEXT, printer TEXT, created INTEGER NOT NULL)').run().then(() => db.prepare('ALTER TABLE pairs ADD COLUMN paper TEXT').run().catch(() => {})).catch(e => { pairsReady.delete(db); throw e; })); return pairsReady.get(db); };
const pairCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
async function pairAsk(db, env, req) {
  if (await tooMany(db, env, req, 'pair', 12, H)) return fail(429, 'too many');
  await pairs(db); const b = await body(req, 2048), t = now();
  const a = crypto.getRandomValues(new Uint8Array(8)), code = [...a].map(x => PAIR_ABC[x % 32]).join(''), device = rid(32);
  const name = String(b.name || '').replace(/[^\w .·'&-]/g, '').trim().slice(0, 40), paper = ['58', '80'].includes(String(b.paper)) ? String(b.paper) : null;
  await db.batch([db.prepare('DELETE FROM pairs WHERE created < ?').bind(t - PAIR_FOR), db.prepare('INSERT INTO pairs (code, device, name, paper, created) VALUES (?, ?, ?, ?, ?)').bind(code, await sha256(device), name, paper, t)]);
  return json({ code, device, every: 5, expires: t + PAIR_FOR }, 201);
}
const ISLANDS_MAX = 160;
/* the connections a printer can switch on: each lets one kind of thing from the network work on it, or its own be shared out.
   wish: W.I.S.H. pieces and their codes print here; radio: songs; art: styles, stamps and icons; words: copy; cards: its experiences
   shown and wired on the switchboard; codes: its find-codes open the other islands in the same connections */
const LINKS = ['wish', 'radio', 'art', 'words', 'cards', 'codes'];
const linksOf = v => v === '*' || v == null ? LINKS.slice() : String(v || '').split(',').filter(x => LINKS.includes(x));
const linksIn = a => { const l = LINKS.filter(x => (a || []).includes(x)); return l.length === LINKS.length ? '*' : l.join(','); };
async function newPrinter(db, name, paper, self) {
  const base = String(name || 'island').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'island';
  let id = base; for (let i = 2; await db.prepare('SELECT 1 FROM printers WHERE id = ?').bind(id).first(); i++) id = `${base}-${i}`;
  await db.prepare('INSERT INTO printers (id, name, paper, created, self, links, two) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, String(name || id).slice(0, 40), paper || '80', now(), self ? 1 : 0, self ? '' : '*', self ? 0 : 1).run();
  return id;
}
async function pairPoll(db, req) {
  await pairs(db); const b = await body(req, 2048); if (typeof b.device !== 'string' || b.device.length > 64) return fail(400, 'device');
  const r = await db.prepare('SELECT * FROM pairs WHERE device = ? AND created > ?').bind(await sha256(b.device), now() - PAIR_FOR).first();
  if (!r) return fail(404, 'gone');
  if (!r.printer) {
    const open = (await settingsOf(db)).openJoin, n = await db.prepare('SELECT count(*) AS n FROM printers').first();
    if (!open || (n && n.n >= ISLANDS_MAX)) return json({ waiting: true, every: 5 }, 202);
    r.printer = await newPrinter(db, r.name || 'island', r.paper, true);
  }
  const tok = rid(32), key = rid(32);
  await db.batch([db.prepare('UPDATE printers SET token = ?, owner = ?, seen = NULL, can = NULL, off = NULL, paper = COALESCE(?, paper) WHERE id = ?').bind(await sha256(tok), await sha256(key), r.paper || null, r.printer), db.prepare('DELETE FROM pairs WHERE code = ?').bind(r.code)]);
  await numberPrinters(db); const p = await db.prepare('SELECT number FROM printers WHERE id = ?').bind(r.printer).first();
  return json({ printer: r.printer, token: tok, key, number: (p && p.number) || null });
}
/* ───────── a card's own pictures: the approval page sets novel.global's cards; an island keeper sets their own island's card (its printer's id) ───────── */
const CARD_ID = /^[a-z0-9-]{1,24}$/, PICS = 10, PIC_MAX = 1.6e6;
const picType = b => b[0] === 0xFF && b[1] === 0xD8 ? 'image/jpeg' : b[0] === 0x89 && b[1] === 0x50 ? 'image/png' : b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45 ? 'image/webp' : null;
async function cardSet(db, card, b) {
  const was = (await db.prepare('SELECT speed, shade FROM cardset WHERE card = ?').bind(card).first()) || {};
  const speed = b.speed != null && isFinite(+b.speed) ? Math.max(1, Math.min(60, +b.speed)) : was.speed == null ? null : was.speed;
  const shade = b.shade != null && isFinite(+b.shade) ? Math.max(0, Math.min(1, +b.shade)) : was.shade == null ? null : was.shade;
  await db.prepare('INSERT INTO cardset (card, speed, shade) VALUES (?, ?, ?) ON CONFLICT(card) DO UPDATE SET speed = excluded.speed, shade = excluded.shade').bind(card, speed, shade).run();
  return { ok: true, card, speed, shade };
}
async function cardPut(db, env, req, card, slot) {
  const n = +slot; if (!/^\d$/.test(String(slot)) || n >= PICS) return fail(400, 'slot');
  if (req.method === 'DELETE') { if (env.MEDIA) await env.MEDIA.delete(`card/${card}/${n}`).catch(() => {}); await db.prepare('DELETE FROM cardpics WHERE card = ? AND slot = ?').bind(card, n).run(); return json({ ok: true }); }
  if (!env.MEDIA) return fail(503, 'no media');
  const b = new Uint8Array(await req.arrayBuffer()); if (!b.length || b.length > PIC_MAX) return fail(413, 'too big'); const type = picType(b); if (!type) return fail(415, 'not a picture');
  if ((await r2Bytes(db)) + b.length >= CAP.r2 * 0.8) return fail(507, 'full');
  await env.MEDIA.put(`card/${card}/${n}`, b, { httpMetadata: { contentType: type } });
  await db.prepare('INSERT INTO cardpics (card, slot, type, bytes, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(card, slot) DO UPDATE SET type = excluded.type, bytes = excluded.bytes, at = excluded.at').bind(card, n, type, b.length, now()).run();
  return json({ ok: true, card, slot: n });
}
async function cardList(db) {
  const { results: pics } = await db.prepare('SELECT card, slot, at FROM cardpics ORDER BY card, slot').all(), { results: set } = await db.prepare('SELECT card, speed, shade FROM cardset').all();
  const out = {}; const of = c => out[c] || (out[c] = { pics: [], speed: null, shade: null });
  for (const r of pics) of(r.card).pics.push(`/api/cards/${r.card}/${r.slot}?v=${r.at}`);
  for (const r of set) { const o = of(r.card); o.speed = r.speed; o.shade = r.shade; }
  return new Response(JSON.stringify({ cards: out }), { headers: { ...JSON_H, 'cache-control': 'public, max-age=60' } });
}
async function cardPic(db, env, card, slot) {
  if (!CARD_ID.test(card) || !/^\d$/.test(slot) || !env.MEDIA) return fail(404, 'not found');
  const o = await env.MEDIA.get(`card/${card}/${slot}`); if (!o) return fail(404, 'not found');
  return new Response(o.body, { headers: { 'content-type': (o.httpMetadata && o.httpMetadata.contentType) || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
}
async function keeperPic(db, env, req, slot) {
  if (await tooMany(db, env, req, 'keeper', 60, 10 * 60e3)) return fail(429, 'too many');
  const k = bearer(req); if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) return fail(401, 'key');
  const p = await db.prepare('SELECT id FROM printers WHERE owner = ?').bind(await sha256(k)).first(); if (!p || p.id === 'novelglobal' || !CARD_ID.test(p.id)) return fail(401, 'key');
  return cardPut(db, env, req, p.id, slot);
}
/* the island keeper's own door: their key opens their one printer's row, never novel.global's, another island's, or any story */
async function keeper(db, env, req) {
  if (await tooMany(db, env, req, 'keeper', 60, 10 * 60e3)) return fail(429, 'too many');
  const k = bearer(req); if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) return fail(401, 'key');
  const p = await db.prepare('SELECT id, name, paper, number, two, links, seen, (SELECT count(*) FROM jobs j WHERE j.printer = printers.id AND j.status IN (\'queued\', \'held\')) AS queued, (SELECT count(*) FROM jobs j WHERE j.printer = printers.id AND j.status = \'printed\') AS printed FROM printers WHERE owner = ?').bind(await sha256(k)).first();
  if (!p || p.id === 'novelglobal') return fail(401, 'key');
  if (req.method === 'POST') { const b = await body(req, 2048), name = String(b.name || '').replace(/[^\w .·'&-]/g, '').trim().slice(0, 40); if (name) { await db.prepare('UPDATE printers SET name = ? WHERE id = ?').bind(name, p.id).run(); p.name = name; }
    if (b.speed != null) await cardSet(db, p.id, { speed: b.speed });
    if (Array.isArray(b.links)) { p.links = linksIn(b.links.map(String)); await db.prepare('UPDATE printers SET links = ? WHERE id = ?').bind(p.links, p.id).run(); } }
  const cps = (await db.prepare('SELECT slot, at FROM cardpics WHERE card = ? ORDER BY slot').bind(p.id).all()).results, cst = (await db.prepare('SELECT speed FROM cardset WHERE card = ?').bind(p.id).first()) || {};
  return json({ id: p.id, name: p.name, paper: p.paper, number: p.number, two: !!p.two, links: linksOf(p.links), all: LINKS, pics: cps.map(r => ({ slot: r.slot, url: `/api/cards/${p.id}/${r.slot}?v=${r.at}` })), speed: cst.speed == null ? null : cst.speed, ready: !!p.seen && now() - p.seen < 120e3, queued: p.queued, printed: p.printed });
}
/* the approval page: a code looked up (from the island's slip, scanned), then approved for a printer here or a new one by the island's name */
async function adminPair(db, req, code) {
  await pairs(db); code = pairCode(code);
  const r = code.length === 8 && await db.prepare('SELECT code, name, paper, printer, created FROM pairs WHERE code = ? AND created > ?').bind(code, now() - PAIR_FOR).first();
  if (!r) return fail(404, 'no such code, or it is older than a quarter of an hour');
  if (req.method === 'GET') return json(r);
  const b = await body(req); let id = String(b.printer || '');
  if (!id) id = await newPrinter(db, b.name || r.name || 'island', r.paper, false); else if (!(await db.prepare('SELECT 1 FROM printers WHERE id = ?').bind(id).first())) return fail(404, 'no such printer');
  await db.prepare('UPDATE pairs SET printer = ? WHERE code = ?').bind(id, code).run();
  return json({ ok: true, printer: id });
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
  if (what === 'cards' && id && CARD_ID.test(id)) { if (parts[2] != null && !parts[3] && (req.method === 'PUT' || req.method === 'DELETE')) return cardPut(db, env, req, id, parts[2]); if (!parts[2] && req.method === 'POST') { const b = await body(req, 1024); return json(await cardSet(db, id, b)); } }
  if (what === 'stories' && !id && req.method === 'GET') {
    const st = ['waiting', 'shown', 'refused', 'deleted'].includes(new URL(req.url).searchParams.get('status')) ? new URL(req.url).searchParams.get('status') : 'waiting';
    const { results } = await db.prepare(`SELECT s.id, s.code, s.kind, s.status, s.body, s.lat, s.lng, s.dest, s.created, s.decided, (s.photo IS NOT NULL OR s.pic IS NOT NULL) AS has_photo, s.full, s.star, s.who, s.gone, s.origin, s.art, s.quiet, s.grp, (SELECT count(*) FROM talk t WHERE t.sec = 'p.' || s.code) AS said,
        (SELECT j.printer || ' ' || j.status || COALESCE(' ' || j.error, '') FROM jobs j WHERE j.story = s.id ORDER BY j.created DESC LIMIT 1) AS jobat,
        (SELECT j.thumb FROM jobs j WHERE j.story = s.id AND j.thumb IS NOT NULL LIMIT 1) AS thumb,
        (SELECT j.status FROM jobs j WHERE j.story = s.id ORDER BY j.created DESC LIMIT 1) AS job FROM stories s WHERE s.status = ? ORDER BY s.created DESC LIMIT 1000`).bind(st).all();
    return json({ stories: results.map(r => ({ ...r, photo: !!r.has_photo, has_photo: undefined })) });
  }
  if (what === 'stories' && id === 'clear' && req.method === 'POST') {   // everything waiting refused at once, its held prints with it
    await db.batch([db.prepare("DELETE FROM jobs WHERE status = 'held' AND story IN (SELECT id FROM stories WHERE status = 'waiting')"), db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE status = 'waiting'").bind(now())]);
    return json({ ok: true });
  }
  if (what === 'stories' && id && req.method === 'POST') {
    const b = await body(req); const t = now();
    if (b.action === 'show') { await db.batch([db.prepare("UPDATE stories SET status = 'shown', decided = ? WHERE id = ?").bind(t, id), db.prepare("UPDATE jobs SET status = 'queued' WHERE story = ? AND status = 'held'").bind(id), db.prepare('UPDATE printers SET warm = ? WHERE id IN (SELECT printer FROM jobs WHERE story = ?)').bind(t, id)]); return json({ ok: true }); }
    if (b.action === 'refuse') { await db.batch([db.prepare("UPDATE stories SET status = 'refused', decided = ? WHERE id = ?").bind(t, id), db.prepare("DELETE FROM jobs WHERE story = ? AND status IN ('held', 'queued')").bind(id)]); return json({ ok: true }); }
    if (b.action === 'ungone') { await db.prepare('UPDATE stories SET gone = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); }   // taken down by its maker, put back
    /* its words changed on the approval page (a record's words; a packed story is left as it was sent) */
    if (b.action === 'edit') { const text = typeof b.text === 'string' ? b.text.trim().slice(0, 280) : null; const r = await db.prepare('SELECT kind, body FROM stories WHERE id = ?').bind(id).first(); if (text == null || !r || r.kind === 'story' || r.kind === 'message') return fail(400, 'edit');
      let j = {}; try { j = JSON.parse(r.body) || {}; } catch (e) { return fail(400, 'edit'); } j.text = text; await db.prepare('UPDATE stories SET body = ? WHERE id = ?').bind(JSON.stringify(j), id).run(); return json({ ok: true }); }
    /* a reply from novel.global, said in the piece's own talk */
    if (b.action === 'reply') { const text = typeof b.text === 'string' ? b.text.trim().slice(0, 280) : ''; const r = await db.prepare('SELECT code FROM stories WHERE id = ?').bind(id).first(); if (!text || !r || !r.code) return fail(400, 'reply');
      const tid = rid(); await db.prepare("INSERT INTO talk (id, sec, who, text, re, at, k) VALUES (?, ?, 'NG', ?, NULL, ?, 'ng')").bind(tid, 'p.' + r.code, text, t).run(); return json({ ok: true, id: tid }); }
    /* filed under a portfolio group, or under none */
    if (b.action === 'group') { const g = typeof b.grp === 'string' && b.grp.trim() ? b.grp.trim().slice(0, 40) : null; await db.prepare('UPDATE stories SET grp = ? WHERE id = ?').bind(g, id).run(); return json({ ok: true }); }
    /* a poster's talk closed (nothing more said or read there) or opened again */
    if (b.action === 'quiet' || b.action === 'unquiet') { await db.prepare('UPDATE stories SET quiet = ? WHERE id = ?').bind(b.action === 'quiet' ? now() : null, id).run(); return json({ ok: true }); }
    if (b.action === 'star' || b.action === 'unstar') { await db.prepare('UPDATE stories SET star = ? WHERE id = ?').bind(b.action === 'star' ? 1 : 0, id).run(); return json({ ok: true }); }
    /* deleted is archived: off the site and out of every queue, still here on the approval page, and brought back as waiting */
    if (b.action === 'delete') { await db.batch([db.prepare("DELETE FROM jobs WHERE story = ? AND status IN ('held', 'queued')").bind(id), db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE id = ?").bind(t, id)]); return json({ ok: true }); }
    if (b.action === 'restore') { await db.prepare("UPDATE stories SET status = 'waiting', decided = NULL WHERE id = ?").bind(id).run(); return json({ ok: true }); }
    if (b.action === 'purge') { if (env.MEDIA) { await env.MEDIA.delete(mediaKey(id)).catch(() => {}); await env.MEDIA.delete(`art/${id}`).catch(() => {}); await env.MEDIA.delete(photoKey(id)).catch(() => {}); } await db.batch([db.prepare('DELETE FROM jobs WHERE story = ?').bind(id), db.prepare("DELETE FROM stories WHERE id = ? AND status = 'deleted'").bind(id)]); return json({ ok: true }); }
    return fail(400, 'action');
  }
  if (what === 'photos' && id) return photo(db, env, id, true);
  if (what === 'full' && id) { const o = env.MEDIA ? await env.MEDIA.get(mediaKey(id)) : null; if (!o) return fail(404, 'not found'); return new Response(o.body, { headers: { 'content-type': (o.httpMetadata && o.httpMetadata.contentType) || 'image/jpeg', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } }); }
  if (what === 'art' && id && req.method === 'GET') return posterArt(db, env, id, true);
  if (what === 'species' && !id && req.method === 'GET') { const { results } = await db.prepare('SELECT * FROM species ORDER BY first DESC LIMIT 5000').all(); return json({ species: results }); }
  if (what === 'species' && id && req.method === 'POST') { await db.prepare('DELETE FROM species WHERE id = ?').bind(+id || 0).run(); return json({ ok: true }); }
  if (what === 'talk' && !id && req.method === 'GET') { const { results } = await db.prepare('SELECT t.*, m.kin FROM talk t LEFT JOIN makers m ON m.who = t.who ORDER BY t.at DESC LIMIT 300').all(); return json({ talk: results }); }
  if (what === 'talk' && id && req.method === 'POST') { const b = await body(req); if (b.action === 'hide' || b.action === 'show') { await db.prepare('UPDATE talk SET hidden = ? WHERE id = ?').bind(b.action === 'hide' ? now() : null, id).run(); return json({ ok: true }); } if (b.action === 'delete') { await db.prepare('DELETE FROM talk WHERE id = ?').bind(id).run(); return json({ ok: true }); } return fail(400, 'action'); }
  /* one maker: everything they did (what they sent, in every state, and what they said on the board), and deleting them:
     their stories to the archive (still kept, to purge from there), their board posts and their record gone */
  if (what === 'makers' && id && req.method === 'GET') {
    const m = await db.prepare('SELECT * FROM makers WHERE who = ?').bind(id).first(); if (!m) return fail(404, 'not found');
    const { results: st } = await db.prepare("SELECT s.id, s.code, s.kind, s.status, s.body, s.created, s.decided, s.gone, s.origin, (s.photo IS NOT NULL OR s.pic IS NOT NULL) AS has_photo, (SELECT j.thumb FROM jobs j WHERE j.story = s.id AND j.thumb IS NOT NULL LIMIT 1) AS thumb FROM stories s WHERE s.who = ? ORDER BY s.created DESC LIMIT 500").bind(id).all();
    const { results: tk } = await db.prepare('SELECT id, sec, text, re, at, hidden FROM talk WHERE who = ? ORDER BY at DESC LIMIT 500').bind(id).all();
    return json({ maker: m, stories: st.map(r => ({ ...r, photo: !!r.has_photo, has_photo: undefined })), talk: tk });
  }
  if (what === 'makers' && id && req.method === 'POST') { const b = await body(req); if (b.action !== 'delete') return fail(400, 'action');
    await db.batch([db.prepare("DELETE FROM jobs WHERE status IN ('held', 'queued') AND story IN (SELECT id FROM stories WHERE who = ?)").bind(id), db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE who = ? AND status != 'deleted'").bind(now(), id), db.prepare('DELETE FROM talk WHERE who = ?').bind(id), db.prepare('DELETE FROM makers WHERE who = ?').bind(id)]);
    return json({ ok: true }); }
  if (what === 'makers' && !id && req.method === 'GET') { const { results } = await db.prepare(`SELECT m.who, m.first, m.last, m.posts, m.stage, m.kin, m.lv, (SELECT count(*) FROM talk t WHERE t.who = m.who) AS said, (SELECT count(*) FROM stories s WHERE s.who = m.who AND s.status = 'shown' AND s.gone IS NULL) AS shown, (SELECT count(*) FROM stories s WHERE s.who = m.who AND s.gone IS NOT NULL) AS gone FROM makers m ORDER BY m.last DESC LIMIT 500`).all(); return json({ makers: results }); }
  /* the portfolio's posts: every one, drafts too; one to edit; saved; deleted */
  if (what === 'posts' && !id && req.method === 'GET') { const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts ORDER BY day DESC, created DESC LIMIT 500`).all(); return json({ posts: results.map(postOut) }); }
  if (what === 'posts' && !id && req.method === 'POST') return savePost(db, env, req);
  if (what === 'posts' && id && parts[2] === 'cover') return postCover(db, env, id, true);
  if (what === 'posts' && id && req.method === 'GET') return onePost(db, id, true);
  if (what === 'posts' && id && req.method === 'POST') { const b = await body(req); if (b.action !== 'delete') return fail(400, 'action'); await db.prepare("UPDATE posts SET status = 'deleted', updated = ? WHERE id = ?").bind(now(), id).run(); return json({ ok: true }); }
  if (what === 'settings' && req.method === 'POST') { const b = await body(req); const put = (k, v) => db.prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, v).run();
    for (const k of Object.keys(SETTINGS)) if (typeof b[k] === 'boolean') await put(k, b[k] ? '1' : '0');
    for (const [k, max] of Object.entries(TEXTS)) if (typeof b[k] === 'string') await put(k, b[k].replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').slice(0, max));
    return json(await settingsOf(db)); }
  if (what === 'settings' && req.method === 'GET') return json(await settingsOf(db));
  if (what === 'places' && id === 'import' && req.method === 'POST') return importPlaces(db, req);
  if (what === 'places') return adminPlaces(db, req, id);
  /* the counts read here include this copy's, not yet added */
  if ((what === 'overview' || what === 'traffic') && req.method === 'GET') await settle(env, null, true);
  if (what === 'overview' && req.method === 'GET') { await movePhotos(db, env).catch(() => 0); return overview(db); }
  if (what === 'traffic' && req.method === 'GET') { const { results } = await db.prepare('SELECT day, k, n FROM traffic WHERE day >= ? ORDER BY day DESC, k').bind(new Date(now() - 60 * DAY).toISOString().slice(0, 10)).all(); return json({ traffic: results }); }
  if (what === 'export' && req.method === 'GET') return exportAll(db);
  if (what === 'restore' && req.method === 'POST') return restoreAll(db, req);
  if (what === 'reset' && req.method === 'POST') return resetSite(db, env, req);
  if (what === 'pair' && id && (req.method === 'GET' || req.method === 'POST')) return adminPair(db, req, id);
  if (what === 'printers' && !id) {
    const { results } = await db.prepare(`SELECT p.id, p.name, p.number, p.paper, p.mesh, p.auto, p.live, p.two, p.links, p.self, p.token IS NOT NULL AS paired, p.touch IS NOT NULL AS touch, p.touch_seen, p.refused, p.seen, p.can, p.off, p.net, p.touch_net, p.wifi,
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
    if (b.action === 'token') { const tok = rid(32); await db.prepare('UPDATE printers SET token = ? WHERE id = ?').bind(await sha256(tok), id).run(); await numberPrinters(db); return json({ token: tok }); }
    if (b.action === 'number') { const n = +b.number; if (!Number.isInteger(n) || n < 2 || id === 'novelglobal') return fail(400, 'number');
      if (await db.prepare('SELECT 1 FROM printers WHERE number = ? AND id != ?').bind(n, id).first()) return fail(409, 'that number is taken');
      await db.prepare('UPDATE printers SET number = ? WHERE id = ?').bind(n, id).run(); return json({ ok: true, number: n }); }
    /* the touch screen's own token, shown once; a printer with one holds every slip for its screen */
    if (b.action === 'touch') { if (!b.on) { await db.prepare('UPDATE printers SET touch = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); } const tok = rid(24); await db.prepare('UPDATE printers SET touch = ?, auto = 0 WHERE id = ?').bind(await sha256(tok), id).run(); return json({ token: tok }); }
    if (b.action === 'unpair') { await db.prepare('UPDATE printers SET token = NULL, seen = NULL, can = NULL, off = NULL WHERE id = ?').bind(id).run(); return json({ ok: true }); }
    /* TURN OFF: the receiver is handed it the next time it asks, if that is within two minutes */
    if (b.action === 'wifi') { await db.prepare('UPDATE printers SET wifi = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
    if (b.action === 'off') { await db.prepare('UPDATE printers SET off = ? WHERE id = ? AND token IS NOT NULL').bind(now(), id).run(); return json({ ok: true }); }
    if (b.action === 'links' && Array.isArray(b.links)) { await db.prepare('UPDATE printers SET links = ? WHERE id = ?').bind(linksIn(b.links.map(String)), id).run(); return json({ ok: true }); }
    if (b.action === 'auto' || b.action === 'mesh' || b.action === 'live' || b.action === 'two') { await db.prepare(`UPDATE printers SET ${b.action} = ? WHERE id = ?`).bind(b.on ? 1 : 0, id).run(); return json({ ok: true }); }
    /* its name, said everywhere it is shown (the site shows its first word); its id, and so every link and token, stays as it is */
    if (b.action === 'name') { const n = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 40); if (!n) return fail(400, 'name'); await db.prepare('UPDATE printers SET name = ? WHERE id = ?').bind(n, id).run(); return json({ ok: true, name: n }); }
    if (b.action === 'paper' && ['58', '80'].includes(String(b.paper))) { await db.prepare('UPDATE printers SET paper = ? WHERE id = ?').bind(String(b.paper), id).run(); return json({ ok: true }); }
    /* the calibration strip, drawn on the approval page as the printer's own dots */
    if (b.action === 'strip') { if (!b64ok(b.escpos, LIMIT.escpos)) return fail(400, 'strip'); await db.batch([db.prepare("INSERT INTO jobs (id, printer, code, escpos, status, created) VALUES (?, ?, 'DA-STRIP', ?, 'queued', ?)").bind(rid(), id, b.escpos, now()), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(now(), id)]); return json({ ok: true }); }
    if (b.action === 'test') { await db.batch([db.prepare("INSERT INTO jobs (id, printer, code, mesh, status, created) VALUES (?, ?, 'DA-TEST', ?, 'queued', ?)").bind(rid(), id, 'DIRECT ACTION - test print', now()), db.prepare('UPDATE printers SET warm = ? WHERE id = ?').bind(now(), id)]); return json({ ok: true }); }
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
  if (levelOf() >= 2) return fail(503, 'resting');
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
  const { results: td } = await db.prepare('SELECT k, n FROM traffic WHERE day = ?').bind(day).all(); const today = Object.fromEntries(td.map(r => [r.k, r.n]));
  const r2 = await r2Bytes(db), use = { req: (today['~req'] || 0) + USE.req, w: (today['~w'] || 0) + USE.w, r2, cap: CAP, level: levelOf() };
  return json({ use, stories, places, posts, jobs, printers: pr, week: Object.fromEntries(tr.map(r => [r.k, r.n])), today, at: now() });
}
async function exportAll(db) {
  const q = async s => (await db.prepare(s).all()).results;
  const out = { site: 'novel.global', build: BUILD, at: new Date().toISOString(),
    talk: await q('SELECT * FROM talk ORDER BY at DESC'), makers: await q('SELECT * FROM makers ORDER BY first'),
    stories: await q('SELECT id, code, kind, status, body, lat, lng, dest, created, decided, star, who, gone, origin, full, (photo IS NOT NULL OR pic IS NOT NULL) AS has_photo FROM stories ORDER BY created DESC'),
    places: await q(`SELECT ${PLACE_COLS} FROM places ORDER BY created DESC`), posts: await q('SELECT id, slug, title, summary, body, cat, links, day, status, created, updated FROM posts ORDER BY created DESC'),
    printers: await q('SELECT id, name, paper, mesh, auto, live, seen, token IS NOT NULL AS paired FROM printers ORDER BY id'), settings: await settingsOf(db), species: await q('SELECT * FROM species ORDER BY first'), traffic: await q('SELECT day, k, n FROM traffic ORDER BY day DESC, k') };
  return new Response(JSON.stringify(out, null, 1), { headers: { ...JSON_H, 'content-disposition': `attachment; filename="novel-global-${out.at.slice(0, 10)}.json"` } });
}
/* a backup brought back (the file DATA downloads): settings set as they were; places, posts, makers, the talk and the stories put back
   where they are missing, nothing here overwritten. Photographs stay in the backup's zip; printers are paired again, by hand */
async function restoreAll(db, req) {
  const t = await req.text(); if (t.length > 60e6) return fail(413, 'too large'); let j; try { j = JSON.parse(t); } catch (e) { return fail(400, 'not json'); }
  if (!j || j.site !== 'novel.global') return fail(400, 'not a backup');
  const v = x => (typeof x === 'string' || typeof x === 'number' ? x : x === true ? 1 : x === false ? 0 : null), ops = [], n = {};
  const put = (tab, cols, rows) => { const ok = (Array.isArray(rows) ? rows : []).filter(r => r && typeof r === 'object' && v(r[cols[0]]) != null).slice(0, 20000); n[tab] = ok.length;
    for (const r of ok) ops.push(db.prepare(`INSERT OR IGNORE INTO ${tab} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...cols.map(c => v(r[c])))); };
  const set = (k, x) => ops.push(db.prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, x));
  for (const [k, x] of Object.entries(j.settings || {})) { if (k in SETTINGS && typeof x === 'boolean') set(k, x ? '1' : '0'); else if (k in TEXTS && typeof x === 'string') set(k, x.slice(0, TEXTS[k])); }
  put('places', PLACE_COLS.split(', '), j.places);
  put('posts', ['id', 'slug', 'title', 'summary', 'body', 'cat', 'links', 'day', 'status', 'created', 'updated'], j.posts);
  put('makers', ['who', 'first', 'last', 'posts', 'stage', 'lv', 'kin'], j.makers);
  put('talk', ['id', 'sec', 'who', 'text', 're', 'at', 'hidden'], j.talk);
  put('stories', ['id', 'code', 'kind', 'status', 'body', 'lat', 'lng', 'dest', 'created', 'decided', 'star', 'who', 'gone', 'origin'], j.stories);
  for (let i = 0; i < ops.length; i += 50) await db.batch(ops.slice(i, i + 50));
  return json({ ok: true, ...n });
}
async function importPlaces(db, req) {
  const b = await body(req); const list = Array.isArray(b.places) ? b.places.slice(0, 2000) : []; const t = now(); const ops = []; let bad = 0;
  for (const raw of list) { const p = placeOf(raw || {}); if (!p) { bad++; continue; } ops.push(db.prepare('INSERT INTO places (id, n, cat, role, addr, sub, url, what, lat, lng, status, src, created, decided) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(rid(), p.n, p.cat, p.role, p.addr, p.sub, p.url, p.what, p.lat, p.lng, 'shown', 'import', t, t)); }
  for (let i = 0; i < ops.length; i += 50) await db.batch(ops.slice(i, i + 50));
  return json({ added: ops.length, bad });
}
async function resetSite(db, env, req) {
  const b = await body(req), t = now(), ops = [];
  /* a fresh start, for good: every maker, poster (BOARD 00 aside), word of talk, tape, print and first sighting gone, their photographs
     and recordings with them; the epoch moved, so every phone lets go of what it kept on its next visit. 888 is no maker, so it stays */
  if (b.fresh) { if (env.MEDIA) { const { results } = await db.prepare("SELECT id FROM stories WHERE kind != 'example'").all(); for (const r of results) for (const k of [mediaKey(r.id), photoKey(r.id), `art/${r.id}`]) await env.MEDIA.delete(k).catch(() => {});
      const tp = await db.prepare('SELECT id FROM tapes').all(); for (const r of tp.results) await env.MEDIA.delete(tapeKey(r.id)).catch(() => {}); }
    ops.push(db.prepare('DELETE FROM jobs'), db.prepare("DELETE FROM stories WHERE kind != 'example'"), db.prepare('DELETE FROM makers'), db.prepare('DELETE FROM talk'), db.prepare('DELETE FROM tapes'), db.prepare('DELETE FROM hits'), db.prepare('DELETE FROM species'),
      db.prepare("INSERT INTO settings (k, v) VALUES ('epoch', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind('e' + t.toString(36))); }
  if (b.stories) ops.push(db.prepare("DELETE FROM jobs WHERE status IN ('held', 'queued')"), db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE status != 'deleted' AND kind != 'example'").bind(t));
  if (b.example) ops.push(db.prepare("UPDATE stories SET status = 'deleted', decided = ? WHERE kind = 'example'").bind(t));
  if (b.places) ops.push(db.prepare("UPDATE places SET status = 'deleted', decided = ? WHERE status != 'deleted'").bind(t));
  if (b.posts) ops.push(db.prepare("UPDATE posts SET status = 'draft', updated = ? WHERE status = 'published'").bind(t));
  if (b.words) ops.push(db.prepare("DELETE FROM settings WHERE k IN ('template', 'words', 'cities')"));
  if (b.settings) ops.push(db.prepare("DELETE FROM settings WHERE k IN ('lifeLock', 'exampleEdit', 'phreak', 'sendLive', 'gates', 'fx', 'start', 'notice', 'country')"));
  if (b.traffic) ops.push(db.prepare('DELETE FROM traffic'));
  if (!ops.length) return fail(400, 'nothing');
  await db.batch(ops); return json({ ok: true });
}
/* traffic: a day's count of each kind of thing, added after the answer has gone */
const BEATS = ['open-aura', 'open-studio', 'open-portfolio', 'begin', 'print', 'wall', 'song', 'device'];
/* the journey, counted step by step (never who): levels reached, discs and the eye pressed, steps opened, devices, the booth, the desk */
const JOURNEY = /^(lv[1-6]|disc-[0-2]|eye|step-[0-3]|dev-[0-3]|booth-(open|print|save)|desk-(open|play|keep)|yours|talk|plain-(asked|ddg|still)|showcase)$/;
function trafficKey(url, m) {
  const p = url.pathname.replace(/^\/api\//, '').split('/')[0];
  if (p === 'beat') { const k = url.searchParams.get('k'); return BEATS.includes(k) || JOURNEY.test(k || '') ? k : null; }
  if (['inat', 'osm', 'img', 'places', 'stories', 'posts', 'receipts'].includes(p)) return p + (m === 'POST' ? ':sent' : '');
  return null;
}
function tally(url, m) { USE.req++; const k = trafficKey(url, m); if (k) USE.keys[k] = (USE.keys[k] || 0) + 1; }

/* ───────── the portfolio: posts written on the approval page, drafts until published. Only published posts are read here ───────── */
const POST_COLS = 'id, slug, title, summary, cat, day, status, (cover IS NOT NULL OR cov IS NOT NULL) AS has_cover, updated';
const postOut = r => ({ ...r, cover: !!r.has_cover, has_cover: undefined, links: r.links ? JSON.parse(r.links) : undefined });
async function listPosts(db) { const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts WHERE status = 'published' ORDER BY day DESC, created DESC LIMIT 300`).all(); return json({ posts: results.map(postOut) }); }
async function onePost(db, slug, any) {
  const r = await db.prepare(`SELECT ${POST_COLS}, body, links FROM posts WHERE ${any ? 'id' : 'slug'} = ?${any ? '' : " AND status = 'published'"}`).bind(slug).first();
  return r ? json({ post: postOut(r) }) : fail(404, 'not found');
}
async function postCover(db, env, key, any) {
  const r = await db.prepare(`SELECT id, cover, cov FROM posts WHERE ${any ? 'id' : 'slug'} = ?${any ? '' : " AND status = 'published'"}`).bind(key).first();
  if (!r || !(r.cover || r.cov)) return fail(404, 'not found');
  const o = !r.cover && env.MEDIA ? await env.MEDIA.get(coverKey(r.id)) : null; if (!r.cover && !o) return fail(404, 'not found');
  return new Response(o ? o.body : new Uint8Array(r.cover), { headers: { 'content-type': 'image/jpeg', 'cache-control': any ? 'no-store' : 'public, max-age=600', 'x-content-type-options': 'nosniff' } });
}
const slugOf = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'post';
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
async function savePost(db, env, req) {
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
  /* the cover into R2 when it can (its old one there let go when it is changed or taken off), else kept in the database */
  const inR2 = pic ? await toR2(db, env, coverKey(id), pic) : false; if (!inR2 && (pic || b.cover === null) && env.MEDIA) await env.MEDIA.delete(coverKey(id)).catch(() => {});
  const cv = pic || b.cover === null ? [inR2 ? null : pic, inR2 ? pic.length : null] : null;
  if (was) await db.prepare(`UPDATE posts SET title = ?, summary = ?, body = ?, cat = ?, links = ?, day = ?, status = ?, updated = ?${cv ? ', cover = ?, cov = ?' : ''} WHERE id = ?`).bind(...f, ...(cv || []), id).run();
  else await db.prepare('INSERT INTO posts (title, summary, body, cat, links, day, status, updated, cover, cov, id, slug, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(...f, inR2 ? null : pic, inR2 ? pic.length : null, id, slug, t).run();
  return json({ id, slug, status }, was ? 200 : 201);
}

/* ───────── the router ───────── */
async function api(req, env, url, ctx) {
  tally(url, req.method); settle(env, ctx);
  if (url.pathname === '/api/beat') return new Response(null, { status: 204, headers: TEXT_H });
  if (url.pathname === '/api/img' && req.method === 'GET') return imgThrough(url);
  if (url.pathname.startsWith('/api/inat/') && req.method === 'GET') return inatThrough(url);
  const db = dbOf(env); if (!db) return fail(503, 'no database');
  await ready(db); if (Math.random() < 0.05) await tidy(db, env);
  const p = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean).map(decodeURIComponent); const m = req.method;
  if (p[0] === 'stories' && !p[1] && m === 'GET') return listStories(db, url);
  if (p[0] === 'stories' && !p[1] && m === 'POST') return send(db, env, req);
  if (p[0] === 'stories' && p[1] && m === 'GET') return CODE.test(p[1]) ? oneStory(db, p[1]) : fail(400, 'code');
  if (p[0] === 'receipts' && p[1] && m === 'GET') return receipt(db, p[1]);
  if (p[0] === 'talk' && !p[1] && m === 'GET') return talkList(db, env, req, url);
  if (p[0] === 'talk' && !p[1] && m === 'POST') return talkSay(db, env, req);
  if (p[0] === 'live' && !p[1] && m === 'POST') return live(db, env, req);
  if (p[0] === 'tapes' && !p[1] && m === 'POST') return tapeUp(db, env, req, url);
  if (p[0] === 'tapes' && p[1] && !p[2] && m === 'GET') return tapeGet(db, env, p[1]);
  if (p[0] === 'mine' && p[1] && !p[3] && (m === 'GET' && !p[2] || m === 'POST' && p[2])) return mine(db, env, req, p[1], p[2]);
  if (p[0] === 'photos' && p[1] && m === 'GET') return photo(db, env, p[1], false);
  if (p[0] === 'partners' && m === 'GET') return partners(db);
  if (p[0] === 'osm' && !p[1] && m === 'GET') return osmThrough(db, env, req, url);
  if (p[0] === 'places' && !p[1] && m === 'GET') return listPlaces(db);
  if (p[0] === 'places' && !p[1] && m === 'POST') return suggestPlace(db, env, req);
  if (p[0] === 'posts' && !p[1] && m === 'GET') return listPosts(db);
  if (p[0] === 'posts' && p[1] && p[2] === 'cover' && m === 'GET') return postCover(db, env, p[1], false);
  if (p[0] === 'posts' && p[1] && !p[2] && m === 'GET') return onePost(db, p[1], false);
  if (p[0] === 'settings' && m === 'GET') return json({ ...(await settingsOf(db)), cfsite: env.TURNSTILE_SITE || '', media: !!env.MEDIA, calm: levelOf() });
  if (p[0] === 'example' && m === 'GET') return exampleBoard(db);
  if (p[0] === 'species' && !p[1] && m === 'POST') return learnKinds(db, env, req);
  if (p[0] === 'posters' && !p[1] && m === 'GET') return posters(db);
  if (p[0] === 'posters' && p[1] && !p[2] && m === 'GET') return posterArt(db, env, p[1], false);
  /* someone has set out towards a print: every printer asks quickly for the next few minutes (at most one write a minute from each copy) */
  if (p[0] === 'warm' && !p[1] && m === 'POST') { if (now() - USE.warmAt > 60e3) { USE.warmAt = now(); await db.prepare('UPDATE printers SET warm = ? WHERE token IS NOT NULL OR touch IS NOT NULL').bind(now()).run(); } return new Response(null, { status: 204, headers: TEXT_H }); }
  if (p[0] === 'printers' && p[1] && p[2] === 'next' && m === 'GET') return next(db, req, p[1]);
  if (p[0] === 'printers' && p[1] && p[2] === 'jobs' && p[3] && m === 'POST') return report(db, req, p[1], p[3]);
  if (p[0] === 'pair' && !p[1] && m === 'POST') return pairAsk(db, env, req);
  if (p[0] === 'pair' && p[1] === 'poll' && !p[2] && m === 'POST') return pairPoll(db, req);
  if (p[0] === 'island' && !p[1] && (m === 'GET' || m === 'POST')) return keeper(db, env, req);
  if (p[0] === 'island' && p[1] === 'pics' && p[2] && !p[3] && (m === 'PUT' || m === 'DELETE')) return keeperPic(db, env, req, p[2]);
  if (p[0] === 'cards' && !p[1] && m === 'GET') return cardList(db);
  if (p[0] === 'cards' && p[1] && p[2] && !p[3] && m === 'GET') return cardPic(db, env, p[1], p[2]);
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
