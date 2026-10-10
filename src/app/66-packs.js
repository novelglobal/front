/* ════════════════════════════════════════════════════════════════════
   CELL PACKS — people's own cells, many at once: fruit trees, mesh nodes, water, shade, gardens, places that help.
   A pack is a .md, .csv or .json file (docs/cell-packs.md says how; another LLM can write one from a list or a map).
   It is read on this device and shown before it is sent; it waits for approval like any story; once shown, its cells
   stand on the map for everyone, and age like everything else on it.
   ════════════════════════════════════════════════════════════════════ */
const PACK_KINDS = {
  fruit: { w: 'FRUIT', type: 'offer', tone: 'offer', i: 'give' },
  tree: { w: 'TREE', type: 'noticed', tone: 'flora', g: 'plant' },
  garden: { w: 'GARDEN', type: 'noticed', tone: 'flora', i: 'plant' },
  node: { w: 'MESH NODE', type: 'offer', tone: 'offer', i: 'mesh' },
  water: { w: 'WATER', type: 'offer', tone: 'offer', i: 'water' },
  shade: { w: 'SHADE', type: 'offer', tone: 'offer', i: 'shade' },
  refuge: { w: 'REFUGE', type: 'offer', tone: 'offer', i: 'refuge' },
  place: { w: 'PLACE', type: 'offer', tone: 'offer', i: 'where' },
};
/* a kind named outright, or read from a name: "Lemon tree" is fruit, "Brunswick repeater" a mesh node */
const PACK_WORDS = { mesh: 'node', 'mesh node': 'node', meshtastic: 'node', 'fruit tree': 'fruit', bath: 'water', 'bird bath': 'water' };
const PACK_ALIAS = [['fruit', /\b(fruit|lemons?|oranges?|apples?|figs?|plums?|feijoas?|citrus|olives?|loquats?|mulberr\w*|pears?|quinces?|limes?|apricots?)\b/], ['node', /\b(node|mesh\w*|lora|radio|repeater|router)\b/],
  ['water', /\b(water|bath|bowl|tap|fountain|pond)\b/], ['shade', /\b(shade|cool)\b/], ['refuge', /\b(refuge|shelter|library)\b/], ['garden', /\b(garden|verge|plot|nursery|bed)\b/], ['tree', /\b(trees?|gum|eucalypt\w*|wattle|oak|elm|plane)\b/]];
const packKindOf = t => { const s = String(t || '').toLowerCase().trim(); return PACK_KINDS[s] ? s : PACK_WORDS[s] || ''; };
const packKindIn = t => { const s = String(t || '').toLowerCase(); for (const [k, re] of PACK_ALIAS) if (re.test(s)) return k; return ''; };
const PACK_MAX = 200;
const PACK_BOX = [-38.6, -37.3, 144.4, 145.6];   /* greater Melbourne: lat from, to; lng from, to */
const clipT = (t, n) => String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, n);
function packCell(c) {
  const lat = +c.lat, lng = +c.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < PACK_BOX[0] || lat > PACK_BOX[1] || lng < PACK_BOX[2] || lng > PACK_BOX[3]) return null;
  const k = packKindOf(c.kind) || packKindIn(c.kind) || packKindIn(c.name) || 'place'; const url = /^https:\/\/[^\s<>"']+$/.test(String(c.url || '')) ? String(c.url).slice(0, 200) : '';
  const note = clipT(c.note, 140);
  return { k, n: clipT(c.name, 60) || PACK_KINDS[k].w, lat: +lat.toFixed(5), lng: +lng.toFixed(5), ...(note ? { note } : {}), ...(url ? { url } : {}) };
}
const csvRow = l => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map(x => x.trim()); };
/* a pack read: its title, who made it, its cells, and how many lines could not be placed */
function parsePack(text, file = '') {
  const t = String(text || '').replace(/^﻿/, ''); const out = { title: '', by: '', cells: [], skipped: 0, file: clipT(file, 60) };
  const take = c => { const x = packCell(c); if (x && out.cells.length < PACK_MAX) out.cells.push(x); else out.skipped++; };
  /* JSON: { title, by, cells: [{ kind, name, lat, lng, note, url }] }, or the list alone */
  if (/\.json$/i.test(file) || /^\s*[[{]/.test(t)) {
    let j = null; try { j = JSON.parse(t); } catch (e) { j = null; }
    if (j) { const list = Array.isArray(j) ? j : Array.isArray(j.cells) ? j.cells : []; if (!Array.isArray(j)) { out.title = clipT(j.title, 60); out.by = clipT(j.by, 40); }
      for (const c of list) if (c && typeof c === 'object') take({ kind: c.kind || c.type, name: c.name || c.n || c.title, lat: c.lat != null ? c.lat : c.latitude, lng: c.lng != null ? c.lng : c.lon != null ? c.lon : c.longitude, note: c.note || c.description, url: c.url || c.link }); else out.skipped++;
      return out; }
  }
  const lines = t.split(/\r?\n/); const head = (lines[0] || '').toLowerCase();
  /* CSV: a first row naming its columns, lat and lng among them */
  if (!head.trim().startsWith('|') && head.includes(',') && csvRow(head).some(h => ['lat', 'latitude'].includes(h))) {
    const cols = csvRow(head); const at = (...ns) => cols.findIndex(h => ns.includes(h));
    const ix = { kind: at('kind', 'type'), name: at('name', 'title'), lat: at('lat', 'latitude'), lng: at('lng', 'lon', 'long', 'longitude'), note: at('note', 'notes', 'description'), url: at('url', 'link') };
    for (const l of lines.slice(1)) { if (!l.trim()) continue; const r = csvRow(l); const v = k => (ix[k] >= 0 ? r[ix[k]] : ''); take({ kind: v('kind'), name: v('name'), lat: v('lat'), lng: v('lng'), note: v('note'), url: v('url') }); }
    return out;
  }
  /* Markdown: '# a title', 'by: a name', then a cell a line, as a list or a table: kind | name | lat, lng | note | link */
  for (const l of lines) {
    const s = l.trim(); if (!s) continue;
    if (/^#\s+/.test(s)) { if (!out.title) out.title = clipT(s.replace(/^#+\s*/, ''), 60); continue; }
    const by = s.match(/^\**by\**\s*:\s*(.+)$/i); if (by) { out.by = clipT(by[1], 40); continue; }
    if (!/^([-*+]\s|\d+\.\s|\|)/.test(s) || /^\|?[\s:|-]+$/.test(s)) continue;
    const f = s.replace(/^([-*+]|\d+\.)\s*/, '').replace(/^\|/, '').replace(/\|$/, '').split('|').map(x => x.trim());
    const nums = [], words = [];
    for (const x of f) { const m = x.match(/^(-?\d{1,3}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)$/); if (m) nums.push(+m[1], +m[2]); else if (/^-?\d{1,3}\.\d+$/.test(x)) nums.push(+x); else if (x) words.push(x); }
    if (nums.length < 2) { if (!/\blat/i.test(s)) out.skipped++; continue; }   /* a table's first row names its columns */
    const url = words.find(w => /^https:\/\//.test(w)) || ''; const ws = words.filter(w => w !== url);
    const k = ws.length > 1 && packKindOf(ws[0]) ? ws.shift() : '';
    take({ kind: k, name: ws[0], lat: nums[0], lng: nums[1], note: ws.slice(1).join(' · '), url });
  }
  return out;
}
/* an approved pack, as records on the map like any other shared record */
function packRecords(x) {
  let d = null; try { d = JSON.parse(x.body); } catch (e) { return []; }
  return ((d && d.cells) || []).slice(0, PACK_MAX).map((c0, i) => {
    const c = packCell({ ...c0, kind: c0.k || c0.kind, name: c0.n || c0.name }); if (!c) return null; const K = PACK_KINDS[c.k];
    return { id: `p:${x.id}:${i}`, comm: true, shared: true, pack: x.code, pk: c.k, hid: x.code, hum: K.type !== 'noticed', kind: K.type, lat: c.lat, lng: c.lng, b: K.type === 'noticed' ? 5 : 0,
      at: x.at, t: new Date(x.at).toISOString(), age: Math.round((Date.now() - x.at) / 864e5), rare: 0.5, d: isoDay(new Date(x.at)), title: c.n, said: [c.note, c.url].filter(Boolean).join(' · '), who: clipT(d.by || d.title, 40), n: 0, ...(K.g ? { g: K.g } : {}) };
  }).filter(Boolean);
}
/* ───────── on STORIES, under the tools: read a pack, see it, send it for approval ───────── */
function packSection() {
  const pv = S.packPv; const tally = pv ? Object.entries(pv.cells.reduce((a, c) => ((a[c.k] = (a[c.k] || 0) + 1), a), {})).map(([k, n]) => `${n} ${PACK_KINDS[k].w}`).join(' · ') : '';
  return `<div class="pack" id="pack"><p class="pack-up mono"><label>${icon('plus', 'sm')}CELLS<small>.MD · .CSV · .JSON</small><input type="file" id="pack-f" accept=".md,.markdown,.txt,.csv,.json,text/markdown,text/plain,text/csv,application/json" hidden></label></p>`
    + (pv ? `<div class="pack-pv"><p class="mono"><b>${esc(pv.title || pv.file || 'A PACK')}</b>${pv.by ? ` · ${esc(pv.by)}` : ''}</p><p class="mono pk-n"><b>${pv.cells.length} CELLS</b>${tally ? ` · ${esc(tally)}` : ''}${pv.skipped ? ` · <i>${pv.skipped} NOT PLACED</i>` : ''}</p>`
      + `<ol class="pk-l">${pv.cells.slice(0, 6).map(c => `<li class="mono"><i>${PACK_KINDS[c.k].w}</i> ${esc(c.n)} <small>${c.lat.toFixed(4)} ${c.lng.toFixed(4)}</small></li>`).join('')}${pv.cells.length > 6 ? `<li class="mono"><small>+ ${pv.cells.length - 6} MORE</small></li>` : ''}</ol>`
      + (pv.sent ? `<p class="mono pk-sent">${icon('check', 'sm')}SENT · ${esc(pv.sent)}</p>` : `<p class="pk-acts">${pv.cells.length ? `<button type="button" class="pill" data-pack="send">${icon('share', 'sm')}SEND</button>` : ''}<button type="button" class="pill quiet" data-pack="cancel">${icon('close', 'sm')}CANCEL</button></p>`)
      + `</div>` : '')
    + `</div>`;
}
async function sendPack() {
  const pv = S.packPv; if (!pv || !pv.cells.length || pv.sent) return;
  const n = pv.cells.length; const lat = pv.cells.reduce((a, c) => a + c.lat, 0) / n, lng = pv.cells.reduce((a, c) => a + c.lng, 0) / n;
  const code = codeFor(`pack|${pv.title}|${n}|${Date.now()}`);
  const body = JSON.stringify({ title: pv.title || pv.file, by: pv.by || S.me.by || '', cells: pv.cells });
  try { const j = await post({ kind: 'cells', code, body, lat: +lat.toFixed(3), lng: +lng.toFixed(3), dest: '' }); SENT['pack:' + code] = { code, id: j.id, status: j.status, at: Date.now() }; saveSent(); S.packPv = { ...pv, sent: code }; snd.tear(); toast('SENT · WAITING FOR APPROVAL'); }
  catch (e) { toast(e.status === 429 ? 'TOO MANY · TRY SOON' : e.status === 400 ? 'NOT A PACK' : 'NOT SENT'); }
  refreshPanel();
}
$('#view').addEventListener('change', async e => {
  if (e.target.id !== 'pack-f' || !e.target.files || !e.target.files[0]) return; const f = e.target.files[0];
  if (f.size > 400e3) { toast('TOO LARGE'); return; }
  S.packPv = parsePack(await f.text(), f.name); snd.tick(1600); refreshPanel();
  if (!S.packPv.cells.length) toast('NO CELLS FOUND');
});
$('#view').addEventListener('click', e => { const b = e.target.closest('[data-pack]'); if (!b) return; if (b.dataset.pack === 'send') sendPack(); else { S.packPv = null; refreshPanel(); } });
