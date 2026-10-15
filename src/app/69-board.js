/* ════════════════════════════════════════════════════════════════════
   SIGNALS — the strategic black book. On the page: the W.I.S.H., the master form, written for a signal and sent on to be
   printed; then the boards, each with the signals and constellations laid on it. Beside the page, the active board over the
   ground, drawn with Fabric.js (MIT), the canvas the open dreamboard project is built on: the signals as cards that can be
   rewritten, notes, sections, images, and strings joined and let go. Field notes go out and come back in as Markdown.
   Boards: da.boards.v1, each kept as Fabric's JSON in da.board.<id>; the signals from the radio: da.mixes.v1
   ════════════════════════════════════════════════════════════════════ */
const BOARD_V = 2;
let fabLoad = null, cv = null;
function loadFabric() {
  if (window.fabric) return Promise.resolve(window.fabric);
  if (!fabLoad) fabLoad = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/fabric.min.js'; s.onload = () => res(window.fabric); s.onerror = () => { fabLoad = null; rej(new Error('fabric')); }; document.head.appendChild(s); });
  return fabLoad;
}
const BOARD_PROPS = ['daId', 'daFrom', 'daTo', 'daKind', 'daMix'];
const uid = p => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
/* the boards: the first carries over a board kept before there were several */
const BOARDS = (() => { const b = store.get('da.boards.v1', null); if (Array.isArray(b) && b.length) return b; const old = store.get('da.board.v1', null); if (old && old.json) store.set('da.board.b1', old); const first = [{ id: 'b1', n: 'BOARD 01', at: Date.now() }]; store.set('da.boards.v1', first); return first; })();
let boardId = BOARDS.some(b => b.id === prefs.board) ? prefs.board : BOARDS[0].id;
const boardOf = id => store.get('da.board.' + id, null);
const boardJSON = () => { const k = boardOf(boardId); return (k && k.json) || { objects: [] }; };
const HIST = []; let histLast = '';
function saveBoard(say) {
  if (!cv) return; const json = cv.toJSON(BOARD_PROPS); const str = JSON.stringify(json);
  if (histLast && str !== histLast) { HIST.push(histLast); if (HIST.length > 40) HIST.shift(); } histLast = str;
  store.set('da.board.' + boardId, { v: BOARD_V, json }); if (say) toast('SAVED');
}
/* one step back: the board as it was before the last change */
async function undoBoard() { if (!cv || !HIST.length) { tick(600); return; } const prev = HIST.pop(); histLast = prev; await new Promise(r => cv.loadFromJSON(JSON.parse(prev), r)); for (const l of cv.getObjects('line')) l.set({ selectable: false, evented: true, hoverCursor: 'pointer' }); cv.renderAll(); store.set('da.board.' + boardId, { v: BOARD_V, json: JSON.parse(prev) }); snd.tick(1100); }
const saveSoon = debounce(() => saveBoard(false), 400);
/* the board's keys, as on a piece of hardware: an icon, and its short word printed under it */
const TOOLS = [['add', 'plus', 'ADD'], ['note', 'note', 'NOTE'], ['section', 'base', 'SECT'], ['link', 'string', 'LINK'], ['image', 'camera', 'IMG'], ['undo', 'undo', 'UNDO'], ['delete', 'close', 'DEL'], ['save', 'check', 'SAVE']];
function boardTools() {
  const t = $('#board-tools'); if (t.childElementCount) return;
  t.innerHTML = TOOLS.map(([k, ic, w]) => `<button type="button" class="bt" data-bt="${k}" aria-label="${w}" data-tip="${w}">${icon(ic)}</button>`).join('') + '<input type="file" id="board-file" accept="image/*" hidden>';
  $('#board-label').textContent = 'WISH MAKER · MODEL DA-03 · IN: SIGNALS, CELLS, CONSTELLATIONS · OUT: STORIES TO PRINT · LINK JOINS, A CLICK ON A STRING LETS IT GO · CONTAINS LIVE DATA';
}
/* the board shows over the ground while SIGNALS is open */
async function showBoard(on) {
  const host = $('#board'); host.hidden = !on; if (!on) return null;
  boardTools();
  const f = await loadFabric().catch(() => null); if (!f) return null;
  const W = host.clientWidth, H = host.clientHeight - 52 - 26;
  if (!cv) {
    cv = new f.Canvas('board-c', { width: W, height: H, selection: true, preserveObjectStacking: true, targetFindTolerance: 6, perPixelTargetFind: true });
    await loadBoard();
    cv.on('object:moving', () => follow()); cv.on('object:modified', saveSoon); cv.on('text:changed', saveSoon);
    cv.on('mouse:down', e => { if (e.target && e.target.daKind === 'link' && !linkArmed) { unjoin(e.target); return; } linking(e.target); });
    addEventListener('resize', () => { if (!host.hidden) { cv.setWidth(host.clientWidth); cv.setHeight(host.clientHeight - 78); cv.renderAll(); } });
  } else { cv.setWidth(W); cv.setHeight(H); }
  cv.renderAll(); return cv;
}
async function loadBoard() { cv.clear(); HIST.length = 0; const k = boardOf(boardId); histLast = k && k.json ? JSON.stringify(k.json) : ''; if (k && k.json) await new Promise(r => cv.loadFromJSON(k.json, r)); for (const l of cv.getObjects('line')) l.set({ selectable: false, evented: true, hoverCursor: 'pointer' }); cv.renderAll(); }
async function switchBoard(id) { if (!BOARDS.some(b => b.id === id)) return; saveBoard(false); boardId = id; prefs.board = id; savePrefs(); if (cv) await loadBoard(); refreshPanel(); snd.tick(1500); }
function newBoard() { const id = uid('b'); BOARDS.push({ id, n: `BOARD ${pad2(BOARDS.length + 1)}`, at: Date.now() }); store.set('da.boards.v1', BOARDS); switchBoard(id); }
const byId = id => cv.getObjects().find(o => o.daId === id);
/* strings follow the cards they join */
function follow() {
  if (!cv) return;
  for (const l of cv.getObjects('line')) { const a = byId(l.daFrom), b = byId(l.daTo); if (!a || !b) continue; const ca = a.getCenterPoint(), cb = b.getCenterPoint(); l.set({ x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y }); l.setCoords(); }
  cv.requestRenderAll();
}
const linkOf2 = (a, b) => cv.getObjects('line').find(l => (l.daFrom === a.daId && l.daTo === b.daId) || (l.daFrom === b.daId && l.daTo === a.daId));
function joinCards(a, b) {
  const f = window.fabric; if (!a || !b || a === b || !a.daId || !b.daId) return;
  const was = linkOf2(a, b); if (was) { unjoin(was); return; }
  const ca = a.getCenterPoint(), cb = b.getCenterPoint();
  const l = new f.Line([ca.x, ca.y, cb.x, cb.y], { stroke: '#7FD1C2', strokeWidth: 1.6, strokeDashArray: [5, 4], selectable: false, evented: true, hoverCursor: 'pointer', daFrom: a.daId, daTo: b.daId, daKind: 'link' });
  cv.add(l); cv.sendToBack(l); for (const o of cv.getObjects().filter(o => o.daKind === 'section')) cv.sendToBack(o); saveSoon();
}
/* a string let go: one click on it */
function unjoin(l) { cv.remove(l); cv.requestRenderAll(); saveSoon(); snd.pluck(0.2, 0); buzz(4); }
/* joining: the key pressed, then one card, then another; the same two again lets them go */
let linkFrom = null, linkArmed = false;
function linking(t) {
  if (!linkArmed) return; if (!t || !t.daId || t.daKind === 'link') return;
  if (!linkFrom) { linkFrom = t; snd.tick(1500); return; }
  joinCards(linkFrom, t); linkFrom = null; linkArmed = false; $('#board [data-bt="link"]').classList.remove('on'); snd.knot({ fam: 'people' }, F0 * 5, 0, 0.6, 0);
}
/* a card is one piece of editable text on its own clear plate: double-click to rewrite it */
function textCard(f, id, kind, text, x, y, o = {}) {
  const look = { mix: { fill: '#E9F2F0', backgroundColor: 'rgba(160,210,200,.16)', fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, width: 250 }, note: { fill: '#141412', backgroundColor: '#E8F0B8', fontFamily: 'VT323, monospace', fontSize: 20, width: 180 },
    fig: { fill: '#E9F2F0', backgroundColor: 'rgba(255,255,255,.08)', fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, width: 180 },
    cell: { fill: '#E9F2F0', backgroundColor: 'rgba(138,111,209,.22)', fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, width: 200 },
    slip: { fill: '#141412', backgroundColor: '#FFFFFF', fontFamily: 'VT323, monospace', fontSize: 19, width: 230 } }[kind] || {};
  return new f.Textbox(text, { left: x, top: y, padding: 12, lineHeight: 1.25, daId: id, daKind: kind, editable: true, borderColor: '#7FD1C2', cornerColor: '#7FD1C2', ...look, ...o });
}
const free = () => { const n = cv.getObjects().filter(o => o.daKind && o.daKind !== 'link').length; return { x: 40 + (n % 4) * 270, y: 40 + Math.floor(n / 4) * 230 }; };
const names = (cells, n = 6) => [...new Set((cells || []).map(c => c.n))].slice(0, n).join(', ');
/* what a signal from the radio says: where and when; what each layer heard, by name; its constellations */
function mixText(m) {
  const L = m.layers || {}; const line = (k, w) => { const x = L[k] || {}; return x.on ? `${w} · ${(MOODS[x.mood] || {}).w || ''}\n  ${names(x.cells) || '—'}` : `${w} · OFF`; };
  return [`${m.where.place} · ${fmtStamp(m.at)}`, `${m.where.lat}, ${m.where.lng} · ${metres(m.where.r)}`, '', line('life', 'LIFE'), line('community', 'COMMUNITY'), line('water', 'WATER'), line('pollution', 'POLLUTION'),
    ...((m.figs || []).length ? ['', `CONSTELLATIONS · ${m.figs.map(g => g.name).join(', ')}`] : [])].join('\n');
}
async function placeMix(m) {
  const c = await showBoard(true); if (!c) return; const f = window.fabric;
  if (m.board !== boardId) { m.board = boardId; store.set('da.mixes.v1', MIXES); }
  if (byId(m.id)) { c.setActiveObject(byId(m.id)); c.renderAll(); return; }
  const p = free(); const mc = textCard(f, m.id, 'mix', mixText(m), p.x, p.y, { daMix: m.id }); c.add(mc);
  (m.figs || []).forEach((g, i) => { const fc = textCard(f, `${m.id}:${g.id}`, 'fig', [g.name, ...(g.knots || []).slice(0, 8).map(k => `· ${k.n}`)].join('\n'), p.x + 300, p.y + i * 150); c.add(fc); joinCards(mc, fc); });
  c.setActiveObject(mc); c.renderAll(); saveBoard(false); refreshPanel();
}
/* ───────── species cards: a life met on the radio, sent here. Its name, its Latin, where, what it needs ───────── */
const SPECIES = store.get('da.species.v1', []);
function sendSpecies(o) {
  const sub = subjectOf(o) || o; const g = glyphOf(o) || 'paw'; const ph = (sub.ph && licOpen(sub.ph.l) && sub.ph.u) || o.photo || '';
  const sp = { id: String(o.id), n: nameOf(o), latin: (sub.tx && sub.tx.n) || '', g, place: placeOf(o), lat: +(+o.lat).toFixed(4), lng: +(+o.lng).toFixed(4), ph: ph && !/^data:/.test(ph) ? photoURL(ph, 'medium') : ph, st: STATEMENT[g] || '', at: Date.now() };
  const i = SPECIES.findIndex(x => x.id === sp.id); if (i >= 0) SPECIES.splice(i, 1); SPECIES.unshift(sp); SPECIES.splice(60);
  while (!store.set('da.species.v1', SPECIES) && SPECIES.length > 1) SPECIES.pop();
  markTweak(); flyToTab(1, $('#r-fig')); snd.knot({ g }, F0 * partialOf(g), 0, 0.7, 0); buzz([8, 30, 8]);
  return sp;
}
/* a small copy of the card flies to its tab on the rail */
function flyToTab(i, from) {
  const tab = $(`#rail .tab[data-i="${i}"]`); if (!tab || !from || reduced()) return; const a = from.getBoundingClientRect(), b = tab.getBoundingClientRect();
  const el = document.createElement('div'); el.className = 'fly'; el.style.cssText = `left:${a.left + a.width / 2 - 36}px;top:${a.top + a.height / 2 - 36}px`; document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px,${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.25) rotate(-12deg)`; el.style.opacity = '.2'; });
  setTimeout(() => { el.remove(); tab.classList.add('got'); setTimeout(() => tab.classList.remove('got'), 600); }, 650);
}
const speciesText = sp => [sp.n, sp.latin, `${sp.place} · ${fmtStamp(sp.at)}`, sp.st ? '' : null, sp.st || null].filter(v => v != null).join('\n');
/* a pixel menu, as an old handheld lists its options: a box, a row each, the chosen one barred */
function pickMenu(btn, items, onPick) {
  $$('.pick').forEach(x => x.remove()); if (!items.length) { tick(600); return; }
  const r = btn.getBoundingClientRect(); const el = document.createElement('div'); el.className = 'pick';
  el.innerHTML = `<ol>${items.map((it, i) => `<li><button type="button" data-pick="${i}">${it.ic}<span>${esc(it.n)}</span></button></li>`).join('')}</ol>`;
  el.style.left = `${Math.min(innerWidth - 270, r.left)}px`; el.style.top = `${r.bottom + 6}px`; document.body.appendChild(el); snd.tick(1600);
  const close = ev => { if (ev && el.contains(ev.target)) return; el.remove(); document.removeEventListener('pointerdown', close, true); };
  setTimeout(() => document.addEventListener('pointerdown', close, true), 0);
  el.addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (!b) return; const it = items[+b.dataset.pick]; close(); onPick(it); });
}
/* what can be added: the species sent, the constellations, the cells made, the signals */
const addables = withSignals => [
  ...SPECIES.slice(0, 20).map(sp => ({ k: 'l', id: sp.id, n: sp.n, ic: glyphSVG(sp.g) })),
  ...strings.list().slice(0, 20).map(g => ({ k: 'c', id: g.id, n: g.name, ic: icon('string', 'sm') })),
  ...myCells().slice(0, 20).map(o => ({ k: 'r', id: o.id, n: nameOf(o), ic: `<img src="${pinOf(o)}" alt="">` })),
  ...(withSignals ? MIXES.slice(0, 10).map(m => ({ k: 'm', id: m.id, n: `${m.where.place} · ${fmtStamp(m.at)}`, ic: icon('radar', 'sm') })) : []),
];
/* what this device has made, ready to lay on the board: cells placed on the map, W.I.S.H. issued or sent, constellations */
const myCells = () => S.user.filter(o => !o.story && (o.ev || o.title));
const assetText = {
  r: o => [nameOf(o), ((o.ev && o.ev.data) || {}).text || o.title || '', `${placeOf(o)} · ${fmtStamp(o.at || Date.now())}`].filter(Boolean).join('\n'),
  s: x => [`${x.code} · ${NAME_UP(x)}`, '', ...linesOf(x).map(l => `> ${l}`), ...(x.who ? ['', `— ${x.who}`] : [])].join('\n'),
  c: c => [c.name, ...c.keys.slice(0, 10).map(k => `· ${((c.f.n || {})[k] || (c.f.c || {})[k] || {}).n || k}`)].join('\n'),
};
async function placeAsset(kind, id) {
  const c = await showBoard(true); if (!c) return; const f = window.fabric; const p = free(); const aid = `${kind}:${id}`;
  if (byId(aid)) { c.setActiveObject(byId(aid)); c.renderAll(); return; }
  if (kind === 'r') { const o = myCells().find(x => String(x.id) === String(id)); if (!o) return; const card = textCard(f, aid, 'cell', assetText.r(o), p.x, p.y); c.add(card);
    if (o.photo) f.Image.fromURL(o.photo, im => { im.set({ left: p.x, top: p.y + card.height + 30, daId: `${aid}:img`, daKind: 'image' }); im.scaleToWidth(200); c.add(im); joinCards(card, im); c.renderAll(); saveSoon(); }); }
  if (kind === 's') { const x = S.signals.find(v => v.key === id); if (!x) return; c.add(textCard(f, aid, 'slip', assetText.s(x), p.x, p.y)); }
  if (kind === 'l') { const sp = SPECIES.find(v => v.id === String(id)); if (!sp) return; const card = textCard(f, aid, 'cell', speciesText(sp), p.x, p.y); c.add(card);
    if (sp.ph) loadImage(sp.ph, true).then(im => { const t = document.createElement('canvas'); const k = Math.min(1, 400 / Math.max(im.width, im.height)); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height); f.Image.fromURL(t.toDataURL('image/jpeg', 0.82), img => { img.set({ left: p.x, top: p.y + card.height + 30, daId: `${aid}:img`, daKind: 'image' }); img.scaleToWidth(200); c.add(img); joinCards(card, img); c.renderAll(); saveSoon(); }); }).catch(() => {}); }
  if (kind === 'c') { const g = strings.list().find(v => String(v.id) === String(id)); if (!g) return; c.add(textCard(f, aid, 'fig', assetText.c(g), p.x, p.y)); }
  c.setActiveObject(byId(aid)); c.renderAll(); saveBoard(false); snd.tick(1500);
}
const assetRow = (kind, id, ic, word) => `<li><button type="button" class="as-b" data-asset="${kind}" data-aid="${esc(String(id))}" aria-label="On the board">${ic}<span class="mono">${esc(word)}</span>${icon('plus', 'sm')}</button></li>`;
function assetsHTML() {
  const cells = myCells().slice(0, 20), slips = S.signals.filter(x => !x.ex && !x.shared).slice(0, 20), figs = strings.list().slice(0, 20), sps = SPECIES.slice(0, 20);
  if (!cells.length && !slips.length && !figs.length && !sps.length) return '';
  return `<section class="sec assets" id="sec-assets"><ol class="as-l">${sps.map(sp => assetRow('l', sp.id, glyphSVG(sp.g), sp.n)).join('')}${cells.map(o => assetRow('r', o.id, `<img src="${pinOf(o)}" alt="">`, nameOf(o))).join('')}${slips.map(x => assetRow('s', x.key, icon('receipt', 'sm'), `${x.code} · ${NAME_UP(x)}`)).join('')}${figs.map(g => assetRow('c', g.id, icon('string', 'sm'), g.name)).join('')}</ol></section>`;
}
/* a note, or several, from field notes in Markdown: each heading and what is under it */
async function notesIn(md) {
  const c = await showBoard(true); if (!c) return 0; const f = window.fabric;
  const parts = String(md).split(/\n(?=#{1,3} )/).map(t => t.trim()).filter(Boolean).slice(0, 24);
  parts.forEach((t, i) => { const p = free(); c.add(textCard(f, uid('n'), 'note', t.replace(/^#{1,3} /, '').slice(0, 1200), p.x, p.y)); });
  c.renderAll(); saveBoard(false); return parts.length;
}
async function boardTool(k) {
  const c = await showBoard(true); if (!c) return; const f = window.fabric; const p = free(); const sel = c.getActiveObject();
  if (k === 'note') { const n = textCard(f, uid('n'), 'note', 'A note', p.x, p.y); c.add(n); c.setActiveObject(n); n.enterEditing(); n.selectAll(); }
  if (k === 'section') { const r = new f.Rect({ left: p.x - 20, top: p.y - 20, width: 560, height: 360, fill: 'rgba(127,209,194,.05)', stroke: 'rgba(127,209,194,.5)', strokeDashArray: [2, 4], rx: 6, ry: 6, daId: uid('s'), daKind: 'section' });
    const t = textCard(f, uid('st'), 'note', 'SECTION', p.x - 10, p.y - 52, { backgroundColor: 'transparent', fill: '#B9E6DD', fontSize: 24, width: 300 }); c.add(r); c.sendToBack(r); c.add(t); c.setActiveObject(t); }
  if (k === 'link') { linkArmed = !linkArmed; linkFrom = null; $('#board [data-bt="link"]').classList.toggle('on', linkArmed); if (linkArmed && sel && sel.daId) { linkFrom = sel; } return; }
  if (k === 'image') { $('#board-file').click(); return; }
  if (k === 'add') { pickMenu($('#board [data-bt="add"]'), addables(true), it => (it.k === 'm' ? placeMix(MIXES.find(m => m.id === it.id)) : placeAsset(it.k, it.id))); return; }
  if (k === 'delete') { const all = c.getActiveObjects(); if (!all.length) return; for (const o of all) { c.remove(o); for (const l of c.getObjects('line')) if (l.daFrom === o.daId || l.daTo === o.daId) c.remove(l); } c.discardActiveObject(); }
  if (k === 'save') { saveBoard(true); return; }
  if (k === 'undo') { undoBoard(); return; }
  c.renderAll(); saveSoon(); snd.tick(1500);
}
/* an image from this device, made smaller first */
$('#board').addEventListener('change', e => {
  const fl = e.target.files && e.target.files[0]; if (!fl || e.target.id !== 'board-file') return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = async () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)); const t = document.createElement('canvas'); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
    const c = await showBoard(true); const p = free(); window.fabric.Image.fromURL(t.toDataURL('image/jpeg', 0.82), img => { img.set({ left: p.x, top: p.y, daId: uid('i'), daKind: 'image' }); img.scaleToWidth(220); c.add(img); c.setActiveObject(img); c.renderAll(); saveSoon(); }); }; im.src = rd.result; };
  rd.readAsDataURL(fl); e.target.value = '';
});
$('#board').addEventListener('click', e => { const b = e.target.closest('[data-bt]'); if (b) boardTool(b.dataset.bt); });

/* ───────── the W.I.S.H.: the master form. Four lines written for a signal, sent on as a story waiting to print ───────── */
const WDRAFT = store.get('da.wish.v1', { mix: '', w: '', i: '', s: '', h: '', by: '' });
/* each line's sign: what we know (looked for), it would be great (the sun), so let's create (made anew), here is how (by hand) */
const W_IC = { w: 'search', i: 'day', s: 'remix', h: 'hug' };
function wishForm() {
  const ms = MIXES; const sel = ms.some(m => m.id === WDRAFT.mix) ? WDRAFT.mix : (ms[0] || {}).id || '';
  return `<form class="wish-form" id="wish-form" autocomplete="off"><span class="wf-keys" aria-label="W.I.S.H." data-tip="W.I.S.H.">${WKEYS.map(k => `<b class="wk wk-${k}">${k.toUpperCase()}</b>`).join('')}</span>`
    + (ms.length ? `<select id="wf-mix" aria-label="The signal it answers">${ms.map(m => `<option value="${esc(m.id)}"${m.id === sel ? ' selected' : ''}>${esc(m.where.place)} · ${fmtStamp(m.at)}</option>`).join('')}</select>` : '')
    + WKEYS.map(k => `<label class="wf-l wl-${k}" data-tip="${esc(WISH[k][1])}"><i class="wf-i">${icon(W_IC[k])}</i><input id="wf-${k}" type="text" maxlength="${SIG.line}" value="${esc(WDRAFT[k] || '')}" placeholder="${esc(WISH[k][0])}" aria-label="${esc(WISH[k][0])}" spellcheck="true"></label>`).join('')
    + `<label class="wf-l by" data-tip="By"><i class="wf-i">${icon('sign')}</i><input id="wf-by" type="text" maxlength="40" value="${esc(WDRAFT.by || S.me.by || '')}" placeholder="…" aria-label="By"></label>`
    + `<button type="submit" class="send-b" aria-label="Send the signal" data-tip="Send the signal">${icon('share')}<i class="sb-arrow" aria-hidden="true"></i></button></form>`;
}
$('#view').addEventListener('input', e => { if (!e.target.closest('#wish-form')) return; for (const k of [...WKEYS, 'by']) { const el = $('#wf-' + k); if (el) WDRAFT[k] = el.value; } const mx = $('#wf-mix'); if (mx) WDRAFT.mix = mx.value; store.set('da.wish.v1', WDRAFT); });
$('#view').addEventListener('change', e => { if (e.target.id === 'wf-mix') { WDRAFT.mix = e.target.value; store.set('da.wish.v1', WDRAFT); } });
$('#view').addEventListener('submit', e => { if (e.target.id !== 'wish-form') return; e.preventDefault(); sendSignal(); });
/* the W.I.S.H. becomes a story: where the signal was, its four lines, its constellations; kept here, waiting to print */
async function sendSignal() {
  const L = Object.fromEntries(WKEYS.map(k => [k, String(($('#wf-' + k) || {}).value || '').trim()]));
  if (!WKEYS.some(k => L[k])) { nudge($('#wf-w')); return null; }
  const m = MIXES.find(x => x.id === (($('#wf-mix') || {}).value || WDRAFT.mix)) || MIXES[0];
  const where = m ? m.where : { lat: +S.scan.lat.toFixed(4), lng: +S.scan.lng.toFixed(4), place: suburbAt(S.scan.lat, S.scan.lng) };
  const lead = m && ((m.layers.life || {}).cells || [])[0];
  const at = Date.now(); const who = String(($('#wf-by') || {}).value || '').trim();
  const pin = { id: null, lat: where.lat, lng: where.lng, n: '', cn: where.place, ic: '', g: (lead && lead.g) || 'paw', place: where.place };
  const sig = { v: 1, code: codeFor(`${at}|${pin.lat}|${pin.lng}|${L.h}|${S.me.dev}`), at, pin, threat: '', when: '', deg: 0, lines: L, nodes: [], edges: [], who, ...(m ? { mix: m.id, note: (m.figs || []).map(g => g.name).join(' · ') } : {}) };
  const ev = await ledgerAdd({ type: 'signal', lat: pin.lat, lng: pin.lng, who, data: sig });
  Object.assign(WDRAFT, { w: '', i: '', s: '', h: '' }); store.set('da.wish.v1', WDRAFT);
  tie(1); snd.printer(900); buzz([10, 40, 10]); toast('SENT · WAITING TO PRINT');
  PRESS.story = ev.key; setView(2); return sig;
}
/* ───────── the book: the boards, the signals and constellations under each, and the field notes ───────── */
const LAYER_W = Object.fromEntries(LAYERS.map(L => [L.k, L.w]));
const mdEsc = t => String(t == null ? '' : t).replace(/([*_`#|[\]])/g, '\\$1');
function bookMD() {
  const out = ['# Field book', '', `DIRECT ACTION RADIO · novel.global · ${fmtStamp(Date.now())}`, ''];
  for (const m of MIXES) {
    out.push(`## ${mdEsc(m.where.place)} · ${fmtStamp(m.at)}`, '', `- Where: ${m.where.lat}, ${m.where.lng} · ${metres(m.where.r)}`, `- Loop: one turn of the radar, ${m.loop || CONFIG.SCAN.turn || 8} s`, '');
    for (const [k, L] of Object.entries(m.layers)) {
      out.push(`### ${LAYER_W[k] || k}`, '', `- ${L.on ? 'On' : 'Off'} · mood ${(MOODS[L.mood] || {}).w || ''} · level ${Math.round(L.lvl * 100)}% · ${(L.cells || []).length} cells`);
      for (const cl of (L.cells || []).slice(0, 40)) out.push(`  - ${mdEsc(cl.n)} · ${cl.d} m at ${cl.b}°${cl.p ? ` · partial ${cl.p}` : ''}`);
      out.push('');
    }
    if ((m.figs || []).length) { out.push('### Constellations', ''); for (const g of m.figs) { out.push(`- **${mdEsc(g.name)}**: ${(g.knots || []).map(k => mdEsc(k.n)).join(', ')}`); for (const [a, b] of g.edges || []) out.push(`  - ${mdEsc(a)} → ${mdEsc(b)}`); } out.push(''); }
  }
  /* each board's words: the cards as rewritten, the notes, the sections */
  if (cv) saveBoard(false);
  for (const b of BOARDS) { const objs = (((boardOf(b.id) || {}).json || {}).objects || []).filter(o => o.text && o.daKind); if (!objs.length) continue; out.push(`## ${b.n}`, ''); for (const o of objs) out.push(`### ${o.daKind.toUpperCase()}`, '', ...String(o.text).split('\n').map(l => (l ? `> ${l}` : '>')), ''); }
  return out.join('\n');
}
const sigRow2 = m => `<li class="g-sig"><span class="mono">${esc(m.where.place)} · ${fmtStamp(m.at)}</span><span class="pg-l">${LAYERS.map(L => { const x = m.layers[L.k] || {}; return `<i class="${x.on ? 'on' : ''}">${icon(L.ic, 'sm')}${x.on ? icon((MOODS[x.mood] || MOODS.fog).ic, 'sm') : ''}</i>`; }).join('')}</span>`
  + `<span class="pg-a"><button type="button" class="ib" data-mix="${esc(m.id)}" aria-label="Play on the radio">${icon('play', 'sm')}</button><button type="button" class="ib" data-board-mix="${esc(m.id)}" aria-label="On this board">${icon('plus', 'sm')}</button></span></li>`;
function viewSignals() {
  const groups = BOARDS.map(b => { const on = b.id === boardId; const ms = MIXES.filter(m => (m.board || BOARDS[0].id) === b.id); const figs = ms.flatMap(m => m.figs || []);
    return `<li class="bgroup${on ? ' on' : ''}">${on ? `<div class="bg-h"><input class="bg-n mono" data-board-name="${esc(b.id)}" value="${esc(b.n)}" maxlength="32" aria-label="The board's name"><small class="mono">${ms.length} · ${figs.length}</small></div>` : `<button type="button" class="bg-h" data-board="${esc(b.id)}" aria-pressed="false"><b class="mono">${esc(b.n)}</b><small class="mono">${ms.length} · ${figs.length}</small></button>`}`
      + (ms.length ? `<ol class="g-sigs">${ms.map(sigRow2).join('')}</ol>` : '') + (figs.length ? `<ol class="g-figs">${figs.map(g => `<li class="mono">${icon('string', 'sm')}${esc(g.name)}</li>`).join('')}</ol>` : '') + (on ? consSection() : '') + `</li>`; }).join('');
  return `<section class="sec" id="sec-wish">${wishForm()}</section>` + assetsHTML()
    + `<section class="sec book" id="sec-book"><div class="bk-h"><i class="bk-ic" data-tip="Boards">${icon('base')}</i><span class="bk-a"><button type="button" class="ib" data-new-board aria-label="A new board">${icon('plus')}</button><button type="button" class="ib" data-book-md aria-label="Download the field notes">${icon('download')}</button><label class="ib" aria-label="Bring field notes in">${icon('receive')}<input type="file" id="md-in" accept=".md,text/markdown,text/plain" hidden></label></span></div>`
    + `<ol class="bgroups">${groups}</ol></section>`;
}
$('#view').addEventListener('click', e => {
  if (e.target.closest('[data-book-md]')) { download(`field-notes-${isoDay(new Date())}.md`, bookMD(), 'text/markdown;charset=utf-8'); tick(1800); return; }
  if (e.target.closest('[data-new-board]')) { newBoard(); return; }
  const bd = e.target.closest('[data-board]'); if (bd) { switchBoard(bd.dataset.board); return; }
  const bm = e.target.closest('[data-board-mix]'); if (bm) { const m = MIXES.find(x => x.id === bm.dataset.boardMix); if (m) placeMix(m); tick(1500); return; }
  const as = e.target.closest('[data-asset]'); if (as) placeAsset(as.dataset.asset, as.dataset.aid);
});
/* a board's name, rewritten where it stands */
$('#view').addEventListener('input', debounce(e => { const n = e.target.closest('[data-board-name]'); if (!n) return; const b = BOARDS.find(x => x.id === n.dataset.boardName); if (b) { b.n = n.value.trim().slice(0, 32) || b.n; store.set('da.boards.v1', BOARDS); } }, 300));
$('#view').addEventListener('change', async e => {
  if (e.target.id !== 'md-in') return; const fl = e.target.files && e.target.files[0]; if (!fl) return;
  const n = await notesIn(await fl.text()); toast(`${n} NOTES IN`); e.target.value = '';
});
