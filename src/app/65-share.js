
/* ════════════════════════════════════════════════════════════════════
   SHARED — the stories people send, shown to everyone once approved; DIRECT ACTION to a partner place's printer;
   RECEIVE by the code printed on a slip. The app stands without the server: what was last fetched is kept on this
   device, and what cannot be sent yet waits in an outbox until there is a signal.
   ════════════════════════════════════════════════════════════════════ */
const API = '/api';
/* the partner places, each with its entry in places.js: where DIRECT ACTION can send a slip to print */
const PARTNERS = (window.DA_PARTNERS || []).map(p => { const pl = PLACES.find(x => x.partner === p.id) || {}; return { ...p, n: pl.n || p.id, sub: pl.sub || '', addr: pl.addr || '', url: pl.url || '', what: pl.what || '', lat: +pl.lat, lng: +pl.lng, paper: String(p.paper || 58) }; }).filter(p => Number.isFinite(p.lat));
const partnerOf = id => PARTNERS.find(p => p.id === id) || null;
const SHARED = store.get('da.shared.v1', { t: 0, list: [] });   /* the stories shown to everyone, as last fetched */
const SENT = store.get('da.sent.v1', {});                       /* what this device sent: code → where, and how far it has got */
const OUTBOX = store.get('da.outbox.v1', []);                   /* what could not be sent yet */
const PSTATE = store.get('da.partners.v1', {});                 /* each partner's printer, as last heard */
const saveSent = () => store.set('da.sent.v1', SENT);
async function apiJSON(path, opt = {}) {
  const r = await fetch(API + path, { ...opt, headers: { 'content-type': 'application/json', ...(opt.headers || {}) } });
  if (r.status === 204) return null; const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || String(r.status)), { status: r.status }); return j;
}
const b64bytes = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };

/* ───────── what everyone sees: approved stories, as signals like any other; approved records, on the map ───────── */
function sharedSignal(x) {
  try {
    const s = unpackSignal(x.body);
    return { ...s, key: 'sh:' + x.id, shared: true, sid: x.id, dest: x.dest || '', at: x.at || s.at, ...(x.photo ? { photo: `${API}/photos/${x.id}`, img: { k: 'own', a: (s.img && s.img.a) || '' } } : {}) };
  } catch (e) { return null; }
}
function sharedRecord(x) {
  try {
    const d = JSON.parse(x.body); const hum = ['need', 'offer', 'event', 'injured', 'lost', 'dead'].includes(d.type); if (!PLACED.has(d.type)) return null;
    const tx = d.tx && d.tx.n ? { id: null, n: d.tx.n, cn: d.tx.cn || d.tx.n, ic: d.tx.ic || 'Animalia', th: !!d.tx.th, na: !d.tx.intro, intro: !!d.tx.intro } : undefined;
    const o = { id: 'r:' + x.id, comm: true, shared: true, hid: x.code, hum, kind: d.type, lat: +d.lat, lng: +d.lng, b: hum ? 0 : tx ? undefined : 5, at: x.at, t: new Date(x.at).toISOString(), age: Math.round((Date.now() - x.at) / 864e5), rare: 0.5, d: isoDay(new Date(x.at)), title: d.text || (tx ? tx.cn : ''), said: d.text || '', who: d.who || '', n: +d.n || 0, tx, ...(d.g ? { g: d.g } : {}), ...(x.photo ? { photo: `${API}/photos/${x.id}` } : {}) };
    if (d.type === 'event') Object.assign(o, { isEvent: true, start: Date.parse(d.start) || null });
    return Number.isFinite(o.lat) && Number.isFinite(o.lng) ? o : null;
  } catch (e) { return null; }
}
function applyShared() {
  S.shared = SHARED.list.filter(x => x.kind === 'story').map(sharedSignal).filter(Boolean);
  const recs = [...SHARED.list.filter(x => x.kind === 'record').map(sharedRecord).filter(Boolean), ...SHARED.list.filter(x => x.kind === 'cells').flatMap(packRecords)];
  for (const o of S.community.filter(x => x.shared)) S.byId.delete(o.id);
  S.community = [...S.community.filter(x => !x.shared), ...recs]; for (const o of recs) S.byId.set(o.id, o);
  derive(); refresh();
}
async function loadShared() {
  try { const j = await apiJSON('/stories'); SHARED.t = Date.now(); SHARED.list = (j && j.stories) || []; store.set('da.shared.v1', SHARED); } catch (e) { /* no signal: the last answer stands */ }
  applyShared();
}

/* ───────── DIRECT ACTION: the slip sent to a partner place's printer, or to the board alone. Either way it waits for approval ───────── */
/* an own photograph made small enough to send: re-encoded here, which also drops where and how it was taken */
async function photoToSend(src) {
  try { const im = await loadImage(src); for (const [N, q] of [[800, 0.8], [640, 0.72], [480, 0.65]]) { const k = Math.min(1, N / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); const u = c.toDataURL('image/jpeg', q); if (u.length < 400e3) return u; } } catch (e) { /* no photograph, then */ }
  return null;
}
async function post(payload) { return apiJSON('/stories', { method: 'POST', body: JSON.stringify(payload) }); }
async function directAction(s0, dest) {
  /* a place someone marked themselves, perhaps a garden, goes out to about 100 m; a sighting from iNaturalist is already public */
  const s = s0.pin && !s0.pin.id ? { ...s0, pin: { ...s0.pin, lat: +(+s0.pin.lat).toFixed(3), lng: +(+s0.pin.lng).toFixed(3) } } : s0;
  const p = dest && dest !== 'mesh' ? partnerOf(dest) : null;
  const payload = { kind: 'story', code: s.code, body: packSignal(s), lat: +s.pin.lat, lng: +s.pin.lng, dest: p ? p.id : dest === 'mesh' ? 'mesh' : '', mesh: meshText(s) };
  if (p) { try { payload.escpos = b64bytes(await escpos(s, p.paper)); } catch (e) { /* the words go without the bytes */ } }
  const own = s.img && s.img.k === 'own' ? sigSrc(s, false) : ''; if (own && /^data:/.test(own)) { const ph = await photoToSend(own); if (ph) payload.photo = ph; }
  SENT[s.code] = { dest: payload.dest, status: 'sending', at: Date.now() }; saveSent();
  try { const j = await post(payload); SENT[s.code] = { ...SENT[s.code], id: j.id, status: j.status, job: j.job ? j.job.status : null }; }
  catch (e) {
    if (e.status) { delete SENT[s.code]; saveSent(); throw e; }
    OUTBOX.push(payload); store.set('da.outbox.v1', OUTBOX); SENT[s.code].status = 'outbox';   /* no signal: it goes when there is one */
  }
  saveSent(); return SENT[s.code];
}
/* a record placed on the map, shared: what it is and where, its photograph; never its contact */
async function shareRecord(o) {
  const e = o.ev || {}; const d = e.data || {}; const dp = o.kind === 'need' ? 3 : 4;
  const rec = { type: o.kind, lat: +(+o.lat).toFixed(dp), lng: +(+o.lng).toFixed(dp), text: d.text || '', ...(d.tx ? { tx: d.tx } : {}), ...(d.g ? { g: d.g } : {}), ...(d.n ? { n: d.n } : {}), ...(d.start ? { start: d.start } : {}), ...(o.who ? { who: o.who } : {}) };
  const code = codeFor(`${e.key}|record`); const payload = { kind: 'record', code, body: JSON.stringify(rec), lat: rec.lat, lng: rec.lng, dest: '' };
  if (o.photo) { const ph = await photoToSend(o.photo); if (ph) payload.photo = ph; }
  const key = 'rec:' + e.key; SENT[key] = { code, status: 'sending', at: Date.now() }; saveSent();
  try { const j = await post(payload); SENT[key] = { ...SENT[key], id: j.id, status: j.status }; }
  catch (err) { if (err.status) { delete SENT[key]; saveSent(); throw err; } OUTBOX.push(payload); store.set('da.outbox.v1', OUTBOX); SENT[key].status = 'outbox'; }
  saveSent(); return SENT[key];
}
async function flushOutbox() {
  if (!OUTBOX.length || !navigator.onLine) return;
  for (const payload of [...OUTBOX]) {
    try {
      const j = await post(payload); OUTBOX.splice(OUTBOX.indexOf(payload), 1);
      const key = Object.keys(SENT).find(k => (k === payload.code || SENT[k].code === payload.code) && SENT[k].status === 'outbox'); if (key) SENT[key] = { ...SENT[key], id: j.id, status: j.status, job: j.job ? j.job.status : null };
    } catch (e) { if (e.status) OUTBOX.splice(OUTBOX.indexOf(payload), 1); else break; }
  }
  store.set('da.outbox.v1', OUTBOX); saveSent(); refreshSent();
}
addEventListener('online', () => flushOutbox());
/* how far each slip sent from here has got: waiting, shown, refused; held, queued, printing, printed */
async function checkSent() {
  const open = Object.entries(SENT).filter(([, v]) => v.id && (v.status === 'waiting' || (v.job && !['printed', 'failed', 'expired'].includes(v.job))) && Date.now() - v.at < 8 * 864e5);
  let changed = false;
  for (const [k, v] of open.slice(0, 12)) {
    try { const r = await apiJSON('/receipts/' + v.id); const job = r.job ? r.job.status : null; if (r.status !== v.status || job !== v.job) { SENT[k] = { ...v, status: r.status, job, ahead: r.job ? r.job.ahead : 0 }; changed = true; if (r.status === 'shown') loadShared(); } } catch (e) { if (e.status === 404) { delete SENT[k]; changed = true; } }
  }
  if (changed) { saveSent(); refreshSent(); }
}
/* the site's own settings, as they are now */
async function loadSettings() {
  try { const j = await apiJSON('/settings'); if (j && typeof j.lifeLock === 'boolean' && j.lifeLock !== CFG.lifeLock) { CFG.lifeLock = j.lifeLock; store.set('da.cfg.v1', CFG); if (S.view === 0) refreshPanel(); if (S.mapReady) { life.redraw(); life.moved(); } } } catch (e) { /* as last heard */ }
}
/* the printers, as they are now */
async function loadPartners() {
  try { const j = await apiJSON('/partners'); for (const p of (j && j.partners) || []) PSTATE[p.id] = { ready: !!(p.ready || p.live), heard: !!p.ready, paired: p.paired, mesh: p.mesh, queued: p.queued, printed: p.printed, t: Date.now() }; store.set('da.partners.v1', PSTATE); if (S.mapReady) life.redraw(); } catch (e) { /* as last heard */ }
  return PSTATE;
}
/* a slip's status, in a label */
function sentWord(s) {
  const v = SENT[s.code]; const d = v && v.dest ? v.dest : s.dest || ''; const p = d && d !== 'mesh' ? partnerOf(d) : null; const at = p ? p.n.toUpperCase() : d === 'mesh' ? 'THE MESH' : 'THE BOARD';
  if (!v) return s.shared ? (p ? `SHOWN · SENT TO ${at}` : 'SHOWN ON THE BOARD') : '';
  if (v.status === 'sending') return `SENDING · ${at}`;
  if (v.status === 'outbox') return `NO SIGNAL · SENDS WHEN THERE IS · ${at}`;
  if (v.status === 'refused') return 'NOT SHOWN';
  if (v.job === 'printed') return `PRINTED · ${at}`;
  if (v.job === 'printing') return `PRINTING · ${at}`;
  if (v.job === 'queued') return `IN THE QUEUE${v.ahead ? ` · ${v.ahead} AHEAD` : ''} · ${at}`;
  if (v.job === 'failed' || v.job === 'expired') return `NOT PRINTED · ${at}`;
  return v.status === 'shown' ? `SHOWN · ${at}` : `WAITING FOR APPROVAL · ${at}`;
}
/* anything showing a slip's status is redrawn when it changes */
function refreshSent() { if (S.issued && face === 'signal') fillSentLine(S.issued); refreshPanel(); }

/* ───────── RECEIVE: a code printed on a slip brings its story up, from this device or the board ───────── */
const codeIn = t => { const m = String(t || '').toUpperCase().replace(/[\s_.]/g, '').match(/^DA-?([0-9A-Z]{4})$/); return m ? 'DA-' + m[1].replace(/O/g, '0').replace(/[IL]/g, '1') : ''; };
async function receiveCode(code) {
  const have = S.signals.find(x => x.code === code); if (have) { openSignal(have.key); return have; }
  try {
    const j = await apiJSON('/stories/' + code); if (!j || !j.story) throw Object.assign(new Error('none'), { status: 404 });
    SHARED.list = [j.story, ...SHARED.list.filter(x => x.id !== j.story.id)]; store.set('da.shared.v1', SHARED); applyShared();
    const s = S.signals.find(x => x.code === code); if (s) { snd.pluck(0.4, 0); openSignal(s.key); } return s || null;
  } catch (e) { toast(e.status === 404 ? `${code} · NOT FOUND` : 'NO SIGNAL'); nudge($('#rx-t')); return null; }
}
