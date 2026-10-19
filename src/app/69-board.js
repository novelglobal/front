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
if (window.DA_EXAMPLE_KIT && !BOARDS.some(b => b.id === 'b00')) { BOARDS.unshift({ id: 'b00', n: 'BOARD 00', at: 0, ex: true }); store.set('da.boards.v1', BOARDS); }
let boardId = BOARDS.some(b => b.id === prefs.board) ? prefs.board : (BOARDS.find(b => !b.ex) || BOARDS[0]).id;
const boardOf = id => store.get('da.board.' + id, null);
const boardJSON = () => { const k = boardOf(boardId); return (k && k.json) || { objects: [] }; };
const HIST = []; let histLast = '';
function saveBoard(say) {
  if (!cv || exLocked()) return; const json = cv.toJSON(BOARD_PROPS); const str = JSON.stringify(json);
  if (histLast && str !== histLast) { HIST.push(histLast); if (HIST.length > 40) HIST.shift(); } histLast = str;
  store.set('da.board.' + boardId, { v: BOARD_V, json, ...(boardId === 'b00' ? { ex: 'edit', at: Date.now() } : {}) }); if (say) toast('SAVED');
}
/* one step back: the board as it was before the last change */
async function undoBoard() { if (!cv || !HIST.length || exLocked()) { tick(600); return; } const prev = HIST.pop(); histLast = prev; await new Promise(r => cv.loadFromJSON(JSON.parse(prev), r)); for (const l of cv.getObjects('line')) l.set({ selectable: false, evented: true, hoverCursor: 'pointer' }); cv.renderAll(); store.set('da.board.' + boardId, { v: BOARD_V, json: JSON.parse(prev) }); snd.tick(1100); }
const saveSoon = debounce(() => saveBoard(false), 400);
/* the board's keys, as on a piece of hardware: an icon, and its short word printed under it */
const TOOLS = [['add', 'plus', 'ADD'], ['note', 'note', 'NOTE'], ['section', 'base', 'SECT'], ['link', 'string', 'LINK'], ['pencil', 'pencil', 'PENCIL'], ['image', 'camera', 'IMG'], ['undo', 'undo', 'UNDO'], ['delete', 'close', 'DEL'], ['zoom', 'search', 'ZOOM'], ['lock', 'anchor', 'LOCK'], ['out', 'download', 'OUT'], ['save', 'check', 'SAVE'], ['exsend', 'share', 'SEND THE EXAMPLE FOR APPROVAL']];
function boardTools() {
  const t = $('#board-tools'); if (t.childElementCount) return;
  t.innerHTML = TOOLS.map(([k, ic, w]) => `<button type="button" class="bt" data-bt="${k}" aria-label="${w}" data-tip="${w}">${icon(ic)}</button>`).join('') + '<input type="file" id="board-file" accept="image/*" hidden>';
  $('#board-label').textContent = 'WISH MAKER · MODEL DA-03 · IN: SIGNALS, CELLS, CONSTELLATIONS · OUT: STORIES TO PRINT · LINK JOINS, A CLICK ON A STRING LETS IT GO · CONTAINS LIVE DATA';
  edgeFade(t);
}
/* the board shows over the ground while SIGNALS is open */
const boardW = host => host.clientWidth - (parseFloat(getComputedStyle(host).paddingRight) || 0);
async function showBoard(on) {
  const host = $('#board'); host.hidden = !on; if (!on) return null;
  boardTools();
  const f = await loadFabric().catch(() => null); if (!f) return null;
  leanOnce($('#board-tools'), 'da.lean.board'); const W = boardW(host), H = host.clientHeight - 52 - 26;
  if (!cv) {
    cv = new f.Canvas('board-c', { width: W, height: H, selection: true, preserveObjectStacking: true, targetFindTolerance: 6, perPixelTargetFind: true });
    await loadBoard();
    cv.on('object:moving', () => follow()); cv.on('object:modified', saveSoon); cv.on('text:changed', saveSoon);
    cv.on('path:created', e => { if (e.path) e.path.set({ daKind: 'pen', daId: uid('d') }); saveSoon(); });
    cv.on('mouse:down', e => { if (e.target && e.target.daKind === 'link' && !linkArmed) { unjoin(e.target); return; } linking(e.target); });
    boardPanBind();
    addEventListener('resize', () => { if (!host.hidden) { cv.setWidth(boardW(host)); cv.setHeight(host.clientHeight - 78); if (boardId === 'b00') exFrame(); cv.renderAll(); } });
  } else { cv.setWidth(W); cv.setHeight(H); if (boardId === 'b00') exFrame(); }
  cv.renderAll(); return cv;
}
async function loadBoard() {
  if (boardId === 'b00') await ensureExample();
  cv.clear(); HIST.length = 0; const k = boardOf(boardId); histLast = k && k.json ? JSON.stringify(k.json) : ''; if (k && k.json) await new Promise(r => cv.loadFromJSON(k.json, r)); for (const l of cv.getObjects('line')) l.set({ selectable: false, evented: true, hoverCursor: 'pointer' });
  exFrame(); cv.renderAll();
}
/* BOARD 00 is looked at, not moved, unless the approval page has it open to editing; and it is framed whole in the view */
/* the board's view: three sizes (the key, or the wheel between them); its bare ground dragged moves it about, the page never
   lost; LOCK holds everything on it still, so any drag moves the view */
const BZ = [0.55, 1, 1.7]; let bzi = 1, bBase = 1, bLock = false, bPan = null;
function boardZoomStep() { bzi = (bzi + 1) % BZ.length; boardZoomTo(bBase * BZ[bzi]); const b = $('#board [data-bt="zoom"]'); if (b) b.dataset.z = String(bzi); }
function boardZoomTo(z, x, y) { if (!cv) return; cv.zoomToPoint(new window.fabric.Point(x == null ? cv.getWidth() / 2 : x, y == null ? cv.getHeight() / 2 : y), clamp(z, 0.25, 3)); cv.requestRenderAll(); }
const ptOf = e => { const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX, y: t.clientY }; };
function boardPanBind() {
  cv.on('mouse:down', e => { if (cv.isDrawingMode || linkArmed || (e.target && !bLock && e.target.selectable !== false)) return; bPan = ptOf(e.e); cv.setCursor('grabbing'); });
  cv.on('mouse:move', e => { if (!bPan) return; const p = ptOf(e.e); const vt = cv.viewportTransform; vt[4] += p.x - bPan.x; vt[5] += p.y - bPan.y; bPan = p; cv.requestRenderAll(); });
  cv.on('mouse:up', () => { if (!bPan) return; bPan = null; cv.setViewportTransform(cv.viewportTransform); });
  cv.on('mouse:wheel', o => { const z = cv.getZoom() * Math.pow(0.999, o.e.deltaY); boardZoomTo(z, o.e.offsetX, o.e.offsetY); o.e.preventDefault(); o.e.stopPropagation(); });
}
function exFrame(keepView) {
  if (!cv) return; const ex = boardId === 'b00', locked = exLocked() || bLock; $('#board').classList.toggle('locked', exLocked()); $('#board').classList.toggle('ex-edit', ex && !exLocked());
  cv.selection = false; for (const o of cv.getObjects()) if (o.daKind !== 'link') o.set({ selectable: !locked, evented: !locked, hoverCursor: locked ? 'grab' : 'move' });
  if (keepView) { cv.requestRenderAll(); return; }
  bzi = 1; if (!ex) { bBase = 1; cv.setViewportTransform([1, 0, 0, 1, 0, 0]); return; }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; const cols = cv.getObjects().filter(o => o.daKind === 'section'); for (const o of cols.length ? cols : cv.getObjects()) { const r = o.getBoundingRect(true, true); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.left + r.width); y1 = Math.max(y1, r.top + r.height); }
  if (!Number.isFinite(x0)) return; const W = cv.getWidth(), H = cv.getHeight(), pad = 18; if (W < 120 || H < 120) { requestAnimationFrame(exFrame); return; } const z = Math.min(1.2, (W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
  bBase = z; cv.setViewportTransform([z, 0, 0, z, pad - x0 * z + (W - pad * 2 - (x1 - x0) * z) / 2, pad - y0 * z]);
}
async function switchBoard(id) { if (!BOARDS.some(b => b.id === id)) return; saveBoard(false); boardId = id; prefs.board = id; savePrefs(); if (cv) await loadBoard(); refreshPanel(); snd.tick(1500); }
function newBoard() { const id = uid('b'); BOARDS.push({ id, n: `BOARD ${pad2(BOARDS.filter(b => !b.ex).length + 1)}`, at: Date.now() }); store.set('da.boards.v1', BOARDS); switchBoard(id); }
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
  const l = new f.Line([ca.x, ca.y, cb.x, cb.y], { stroke: '#FF5A1F', strokeWidth: 1.6, strokeDashArray: [5, 4], selectable: false, evented: true, hoverCursor: 'pointer', daFrom: a.daId, daTo: b.daId, daKind: 'link' });
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
  const look = { mix: { fill: '#0C0E0E', backgroundColor: '#F4F2EA', fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, width: 250 }, note: { fill: '#0C0E0E', backgroundColor: '#E6F84A', fontFamily: 'VT323, monospace', fontSize: 20, width: 180 },
    fig: { fill: '#0C0E0E', backgroundColor: '#DCEFEE', fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, width: 180 },
    cell: { fill: '#0C0E0E', backgroundColor: '#FFFFFF', fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, width: 200 },
    slip: { fill: '#141412', backgroundColor: '#FFFFFF', fontFamily: 'VT323, monospace', fontSize: 19, width: 230 } }[kind] || {};
  return new f.Textbox(text, { left: x, top: y, padding: 12, lineHeight: 1.25, daId: id, daKind: kind, editable: true, borderColor: '#FF5A1F', cornerColor: '#FF5A1F', cornerSize: 8, transparentCorners: false, ...look, ...o });
}
const free = () => { const n = cv.getObjects().filter(o => o.daKind && o.daKind !== 'link').length; return { x: 40 + (n % 4) * 270, y: 40 + Math.floor(n / 4) * 230 }; };
const names = (cells, n = 6) => [...new Set((cells || []).map(c => c.n))].slice(0, n).join(', ');
/* what a signal from the radio says: where and when; what each layer heard, by name; its constellations */
function mixText(m) {
  const L = m.layers || {}; const n = k => ((L[k] || {}).on ? ((L[k] || {}).cells || []).length : '–');
  return [`${m.where.place.toUpperCase()} · ${fmtStamp(m.at)}`, `LIFE ${n('life')}  PLACES ${n('community')}  WATER ${n('water')}  HARM ${n('pollution')}`,
    ...((m.figs || []).length ? [m.figs.map(g => g.name).join(' · ')] : [])].join('\n');
}
async function placeMix(m) {
  await workBoard(); const c = await showBoard(true); if (!c) return; const f = window.fabric;
  if (m.board !== boardId) { m.board = boardId; store.set('da.mixes.v1', MIXES); }
  if (byId(m.id)) { c.setActiveObject(byId(m.id)); c.renderAll(); return; }
  const p = free(); const mc = textCard(f, m.id, 'mix', mixText(m), p.x, p.y, { daMix: m.id }); c.add(mc);
  (m.figs || []).forEach((g, i) => { const fc = textCard(f, `${m.id}:${g.id}`, 'fig', [g.name, ...(g.knots || []).slice(0, 8).map(k => `· ${k.n}`)].join('\n'), p.x + 300, p.y + i * 150); c.add(fc); joinCards(mc, fc); });
  radiusSpecies(6).forEach((sp, i) => photoCard(sp.ph, `${m.id}:sp:${sp.id}`, p.x + i * 84, p.y + mc.height + 60, 76, mc));
  c.setActiveObject(mc); c.renderAll(); saveBoard(false); refreshPanel();
}
/* a photograph pinned to the board, made smaller first, and strung to a card */
function photoCard(url, id, x, y, w, to) {
  if (!url || !cv) return; loadImage(url, true).then(im => { const t = document.createElement('canvas'); const k = Math.min(1, 400 / Math.max(im.width, im.height)); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
    window.fabric.Image.fromURL(t.toDataURL('image/jpeg', 0.82), img => { if (byId(id)) return; img.set({ left: x, top: y, daId: id, daKind: 'image', stroke: '#FFFFFF', strokeWidth: 6 }); img.scaleToWidth(w); cv.add(img); if (to) joinCards(to, img); cv.renderAll(); saveSoon(); }); }).catch(() => {});
}
/* a picture laid on the active board from anywhere: onto the canvas if it is drawn, else into the board as kept */
/* a picture made small enough to keep on a board in this browser */
async function thumbOf(url, w = 240) { const im = await loadImage(url, false); const k = Math.min(1, w / im.width); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const x = c.getContext('2d'); x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.82); }
async function addToBoard(url, kind = 'receipt', w = 220) {
  await workBoard(); const id = uid('a'); const im = await loadImage(url, false); const k = w / im.width;
  if (cv) { await new Promise(res => window.fabric.Image.fromURL(url, img => { const p = free(); img.set({ left: p.x, top: p.y, daId: id, daKind: kind }); img.scaleToWidth(w); cv.add(img); cv.renderAll(); saveBoard(false); res(); })); return id; }
  const kept = boardOf(boardId) || {}; const json = kept.json || { version: '5.3.0', objects: [] }; json.objects = json.objects || [];
  const n = json.objects.filter(o => o.daKind && o.daKind !== 'link').length;
  json.objects.push({ type: 'image', version: '5.3.0', originX: 'left', originY: 'top', left: 40 + (n % 4) * 270, top: 40 + Math.floor(n / 4) * 230, width: im.width, height: im.height, scaleX: k, scaleY: k, src: url, crossOrigin: null, daId: id, daKind: kind });
  store.set('da.board.' + boardId, { v: BOARD_V, json }); return id;
}
/* any board as a picture, drawn apart from the page, on white: for the press */
async function boardImage(id) {
  const f = await loadFabric().catch(() => null); if (id === boardId && cv) saveBoard(false); const kept = boardOf(id); if (!f || !kept || !kept.json || !(kept.json.objects || []).length) return null;
  const sc = new f.StaticCanvas(null, { width: 10, height: 10 }); await new Promise(r => sc.loadFromJSON(kept.json, r)); const objs = sc.getObjects(); if (!objs.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const o of objs) { const r = o.getBoundingRect(true, true); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.left + r.width); y1 = Math.max(y1, r.top + r.height); }
  const pad = 24, W = x1 - x0 + pad * 2, H = y1 - y0 + pad * 2, k = Math.min(2, 1600 / Math.max(W, H)); sc.backgroundColor = '#FFFFFF';
  const url = sc.toDataURL({ format: 'png', left: x0 - pad, top: y0 - pad, width: W, height: H, multiplier: k }); sc.dispose(); return url;
}
/* a constellation as art: its chart over the faint shape of its life, its song as a row of bars, its name */
function figArt(g, col = '#0C0E0E') {
  const gl = (g.o && glyphOf(g.o)) || 'paw'; const ks = (g.keys || []).length ? g.keys : ['pin'];
  const bars = Array.from({ length: 34 }, (_, i) => { const p = partialOf(`${ks[i % ks.length]}|${i}`); return Math.max(2, (3 + (p % 9) * 2.6) * Math.sin(Math.PI * (i + 0.5) / 34)); });
  const chart = strings.chartOf(g.id, 150).replace('<svg class="chart"', `<svg width="150" height="150" color="${col}"`);
  const name = String(g.name || '').replace(/[<&>]/g, '').toUpperCase().slice(0, 34);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="250" viewBox="0 0 240 250"><g transform="translate(36 2) scale(10.5)" opacity=".14">${glyphPaths(gl, col)}</g><g transform="translate(45 6)">${chart}</g><g transform="translate(10 188)" fill="${col}">${bars.map((h, i) => `<rect x="${i * 6.4}" y="${-h / 2}" width="3.6" height="${h}" rx="1.8"/>`).join('')}</g><text x="120" y="236" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="1.5" fill="${col}">${name}</text></svg>`)}`;
}
/* ───────── species cards: a life met on the radio, sent here. Its name, its Latin, where, what it needs ───────── */
const SPECIES = store.get('da.species.v1', []);
function spOf(o) {
  const sub = subjectOf(o) || o; const g = glyphOf(o) || 'paw'; const ph = (sub.ph && licOpen(sub.ph.l) && sub.ph.u) || o.photo || '';
  return { id: String(o.id), n: nameOf(o), latin: (sub.tx && sub.tx.n) || '', g, place: placeOf(o), lat: +(+o.lat).toFixed(4), lng: +(+o.lng).toFixed(4), ph: ph && !/^data:/.test(ph) ? photoURL(ph, 'medium') : ph, st: STATEMENT[g] || '', at: Date.now() };
}
function keepSpecies(sp) {
  const i = SPECIES.findIndex(x => x.id === sp.id); if (i >= 0) SPECIES.splice(i, 1); SPECIES.unshift(sp); SPECIES.splice(60);
  while (!store.set('da.species.v1', SPECIES) && SPECIES.length > 1) SPECIES.pop(); return sp;
}
/* the lives in the radar now that have an open photograph: one of each, in the order the map holds them */
function radiusSpecies(n = 12) {
  const seen = new Set(), out = [];
  for (const it of life.items) { if (!it.inS || it.o.story || it.o.pack || it.o.hist || it.o.hum || isCold(it.o)) continue; const sp = spOf(it.o); const k = sp.latin || sp.n; if (!sp.ph || seen.has(k)) continue; seen.add(k); out.push(sp); if (out.length >= n) break; }
  return out;
}
function sendSpecies(o) {
  const sp = keepSpecies(spOf(o)); const g = sp.g;
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
const speciesText = sp => [sp.n, sp.latin].filter(Boolean).join('\n');
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
  ...radiusSpecies(12).filter(sp => !SPECIES.some(x => x.id === sp.id)).map(sp => ({ k: 'L', id: sp.id, sp, n: sp.n, ic: icon('radar', 'sm') })),
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
  await workBoard(); const c = await showBoard(true); if (!c) return; const f = window.fabric; const p = free(); const aid = `${kind}:${id}`;
  if (byId(aid)) { c.setActiveObject(byId(aid)); c.renderAll(); return; }
  if (kind === 'r') { const o = myCells().find(x => String(x.id) === String(id)); if (!o) return; const card = textCard(f, aid, 'cell', assetText.r(o), p.x, p.y); c.add(card);
    if (o.photo) f.Image.fromURL(o.photo, im => { im.set({ left: p.x, top: p.y + card.height + 30, daId: `${aid}:img`, daKind: 'image' }); im.scaleToWidth(200); c.add(im); joinCards(card, im); c.renderAll(); saveSoon(); }); }
  if (kind === 's') { const x = S.signals.find(v => v.key === id); if (!x) return; c.add(textCard(f, aid, 'slip', assetText.s(x), p.x, p.y)); }
  if (kind === 'l') { const sp = SPECIES.find(v => v.id === String(id)); if (!sp) return; const card = textCard(f, aid, 'cell', speciesText(sp), p.x, p.y); c.add(card);
    photoCard(sp.ph, `${aid}:img`, p.x, p.y + card.height + 30, 200, card); }
  if (kind === 'c') { const g = strings.list().find(v => String(v.id) === String(id)); if (!g) return; await new Promise(res => f.Image.fromURL(figArt(g, darkNow() ? '#F2F6FF' : '#0C0E0E'), im => { im.set({ left: p.x, top: p.y, daId: aid, daKind: 'fig' }); im.scaleToWidth(220); c.add(im); res(); })); }
  c.setActiveObject(byId(aid)); c.renderAll(); saveBoard(false); snd.tick(1500);
}
const assetRow = (kind, id, ic, word) => `<li><button type="button" class="as-b" data-asset="${kind}" data-aid="${esc(String(id))}" aria-label="On the board">${ic}<span class="mono">${esc(word)}</span>${icon('plus', 'sm')}</button></li>`;
function consStrip() {
  const cs = strings.list().slice(0, 12);
  if (!cs.length) return `<section class="sec figs-row" id="sec-figs"><button type="button" class="fig-make" data-make-fig>${icon('string')}<span>make a constellation</span></button></section>`;
  return `<section class="sec figs-row" id="sec-figs"><ol class="figs-l">${cs.map(g => `<li><button type="button" class="fig-t" data-asset="c" data-aid="${esc(String(g.id))}" aria-label="${esc(g.name)} onto the board"><img src="${figArt(g, darkNow() ? '#DCE7EA' : '#0C0E0E')}" alt=""><span>${esc(g.name)}</span></button></li>`).join('')}<li><button type="button" class="fig-t fig-new" data-make-fig aria-label="Another constellation" data-tip="Another constellation">${icon('plus')}</button></li></ol></section>`;
}
/* a constellation begun from here: the radio, the nearest life in the radar opened, its strings in reach listed to tie */
function makeConstellation() {
  setView(0); const cand = life.items.filter(it => it.inS && !it.o.story && !it.o.pack && !it.o.hist && !it.o.hum).sort((a, b) => haversine(a.lat, a.lng, S.scan.lat, S.scan.lng) - haversine(b.lat, b.lng, S.scan.lat, S.scan.lng));
  if (!cand.length) { tick(600); return; } setTimeout(() => { select(cand[0].o.id); setTimeout(() => { const r = $('#r-strings'); if (r) r.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); }, 700); }, 200);
}
$('#view').addEventListener('click', e => { if (e.target.closest('[data-make-fig]')) { makeConstellation(); tick(1500); } });
function assetsHTML() {
  const cells = myCells().slice(0, 12), slips = S.signals.filter(x => !x.ex && !x.shared).slice(0, 8), figs = strings.list().slice(0, 12), sps = SPECIES.slice(0, 18);
  if (!cells.length && !slips.length && !sps.length) return '';
  const tile = (kind, id, art, tip, cls = '') => `<li><button type="button" class="pc-t${cls}" data-asset="${kind}" data-aid="${esc(String(id))}" aria-label="${esc(tip)}" data-tip="${esc(tip)}">${art}</button></li>`;
  return `<section class="sec assets" id="sec-assets"><ol class="pcs">${sps.map(sp => tile('l', sp.id, sp.ph ? `<img src="${esc(photoURL(sp.ph, 'square'))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : glyphSVG(sp.g), sp.n, ' sp')).join('')}`
    + `${cells.map(o => tile('r', o.id, `<img src="${pinOf(o)}" alt="">`, nameOf(o))).join('')}${slips.map(x => tile('s', x.key, icon('receipt'), `${NAME_UP(x)} · ${x.code}`, ' slip')).join('')}</ol></section>`;
}
/* a note, or several, from field notes in Markdown: each heading and what is under it */
async function notesIn(md) {
  await workBoard(); const c = await showBoard(true); if (!c) return 0; const f = window.fabric;
  const parts = String(md).split(/\n(?=#{1,3} )/).map(t => t.trim()).filter(Boolean).slice(0, 24);
  parts.forEach((t, i) => { const p = free(); c.add(textCard(f, uid('n'), 'note', t.replace(/^#{1,3} /, '').slice(0, 1200), p.x, p.y)); });
  c.renderAll(); saveBoard(false); return parts.length;
}
async function boardTool(k) {
  if (k === 'exsend') { sendExample(); return; }
  if (k === 'zoom' || k === 'lock') { const c0 = await showBoard(true); if (!c0) return; if (k === 'zoom') boardZoomStep(); else { bLock = !bLock; exFrame(true); $('#board').classList.toggle('pinned', bLock); const b = $('#board [data-bt="lock"]'); if (b) b.setAttribute('aria-pressed', String(bLock)); } tick(bLock ? 900 : 1500); return; }
  if (exLocked() && k !== 'out') { await workBoard(); }
  const c = await showBoard(true); if (!c) return; const f = window.fabric; const p = free(); const sel = c.getActiveObject();
  if (k === 'note') { const n = textCard(f, uid('n'), 'note', 'A note', p.x, p.y); c.add(n); c.setActiveObject(n); n.enterEditing(); n.selectAll(); }
  if (k === 'section') { const r = new f.Rect({ left: p.x - 20, top: p.y - 20, width: 560, height: 360, fill: 'rgba(143,169,196,.08)', stroke: '#8FA9C4', strokeDashArray: [2, 4], rx: 2, ry: 2, daId: uid('s'), daKind: 'section' });
    const t = textCard(f, uid('st'), 'note', 'SECTION', p.x - 10, p.y - 52, { backgroundColor: 'transparent', fill: '#8FA9C4', fontSize: 24, width: 300 }); c.add(r); c.sendToBack(r); c.add(t); c.setActiveObject(t); }
  if (k === 'link') { linkArmed = !linkArmed; linkFrom = null; $('#board [data-bt="link"]').classList.toggle('on', linkArmed); if (linkArmed && sel && sel.daId) { linkFrom = sel; } return; }
  if (k === 'image') { $('#board-file').click(); return; }
  if (k === 'pencil') { c.isDrawingMode = !c.isDrawingMode; c.freeDrawingBrush.color = darkNow() ? '#F2F6FF' : '#0C0E0E'; c.freeDrawingBrush.width = 2; $('#board [data-bt="pencil"]').classList.toggle('on', c.isDrawingMode); snd.tick(1500); return; }
  if (k === 'out') { pickMenu($('#board [data-bt="out"]'), [{ k: 'png', n: 'PNG', ic: icon('camera', 'sm') }, { k: 'pdf', n: 'PDF', ic: icon('note', 'sm') }], it => boardOut(it.k)); return; }
  if (k === 'add') { pickMenu($('#board [data-bt="add"]'), addables(true), it => (it.k === 'm' ? placeMix(MIXES.find(m => m.id === it.id)) : it.k === 'L' ? placeAsset('l', keepSpecies(it.sp).id) : placeAsset(it.k, it.id))); return; }
  if (k === 'delete') { const all = c.getActiveObjects(); if (!all.length) return; for (const o of all) { c.remove(o); for (const l of c.getObjects('line')) if (l.daFrom === o.daId || l.daTo === o.daId) c.remove(l); } c.discardActiveObject(); }
  if (k === 'save') { saveBoard(true); return; }
  if (k === 'undo') { undoBoard(); return; }
  c.renderAll(); saveSoon(); snd.tick(1500);
}
/* ───────── the board out: everything on it, framed with a margin, on the drafting paper it lies on. A picture, or a PDF of one
   page holding that picture ───────── */
async function boardPicture() {
  const c = await showBoard(true); if (!c) return null; c.discardActiveObject(); c.renderAll(); const objs = c.getObjects(); if (!objs.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const o of objs) { const r = o.getBoundingRect(true, true); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.left + r.width); y1 = Math.max(y1, r.top + r.height); }
  const pad = 48, W = x1 - x0 + pad * 2, H = y1 - y0 + pad * 2, k = Math.min(2, 4200 / Math.max(W, H));
  const png = c.toDataURL({ format: 'png', left: x0 - pad, top: y0 - pad, width: W, height: H, multiplier: k }); const im = await loadImage(png, false);
  const out = document.createElement('canvas'); out.width = Math.round(W * k); out.height = Math.round(H * k); const x = out.getContext('2d'); const dark = darkNow();
  x.fillStyle = dark ? '#123A66' : '#F4F8F8'; x.fillRect(0, 0, out.width, out.height);
  const step = 26 * k; for (let gx = 0, i = 0; gx < out.width; gx += step, i++) { x.fillStyle = dark ? `rgba(220,235,255,${i % 5 ? 0.1 : 0.22})` : `rgba(40,120,140,${i % 5 ? 0.07 : 0.16})`; x.fillRect(gx, 0, 1, out.height); }
  for (let gy = 0, i = 0; gy < out.height; gy += step, i++) { x.fillStyle = dark ? `rgba(220,235,255,${i % 5 ? 0.1 : 0.22})` : `rgba(40,120,140,${i % 5 ? 0.07 : 0.16})`; x.fillRect(0, gy, out.width, 1); }
  x.drawImage(im, 0, 0, out.width, out.height);
  /* the muse, faint, in the corner: a watermark on everything that leaves */
  M.jelly(x, out.width - 40 * k, out.height - 44 * k, 56 * k, dark ? 'rgba(242,246,255,.35)' : 'rgba(12,14,14,.25)', 'rgba(0,0,0,0)');
  return out;
}
/* a PDF of one page, the picture filling it: written by hand, a JPEG inside */
function pdfOf(jpeg, w, h) {
  const enc = new TextEncoder(); const parts = []; const offs = []; let len = 0; const pw = Math.round(w * 0.75), ph = Math.round(h * 0.75);
  const push = v => { const b = typeof v === 'string' ? enc.encode(v) : v; parts.push(b); len += b.length; };
  const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n${body}\nendobj\n`); };
  push('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>'); obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offs[4] = len; push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`); push(jpeg); push('\nendstream\nendobj\n');
  const cs = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`; obj(5, `<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
  const xref = len; push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map(n => `${String(offs[n]).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: 'application/pdf' });
}
async function boardOut(kind) {
  const pic = await boardPicture(); if (!pic) { tick(600); return null; } const b = BOARDS.find(x => x.id === boardId) || { n: 'board' }; const name = `${b.n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${isoDay(new Date())}`;
  if (kind === 'pdf') { const url = pic.toDataURL('image/jpeg', 0.9); const bin = atob(url.split(',')[1]); const jpeg = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) jpeg[i] = bin.charCodeAt(i); const blob = pdfOf(jpeg, pic.width, pic.height); download(`${name}.pdf`, blob); tick(1800); return blob; }
  const a = document.createElement('a'); a.href = pic.toDataURL('image/png'); a.download = `${name}.png`; a.click(); tick(1800); return pic;
}
/* an image from this device, made smaller first: chosen, pasted (a screenshot, a picture copied anywhere) or dropped on */
$('#board').addEventListener('change', e => { const fl = e.target.files && e.target.files[0]; if (!fl || e.target.id !== 'board-file') return; boardImageIn(fl); e.target.value = ''; });
const typing = el => !!el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName || '') || el.isContentEditable || (cv && cv.getActiveObject() && cv.getActiveObject().isEditing));
document.addEventListener('paste', e => {
  if (S.view !== 1 || !S.open || $('#board').hidden || typing(document.activeElement)) return;
  const it = [...((e.clipboardData && e.clipboardData.items) || [])].find(x => /^image\//.test(x.type)); if (!it) return;
  e.preventDefault(); const fl = it.getAsFile(); if (fl) { boardImageIn(fl); snd.tick(1700); }
});
$('#board').addEventListener('dragover', e => { if ([...(e.dataTransfer.items || [])].some(x => /^image\//.test(x.type))) { e.preventDefault(); $('#board').classList.add('drop'); } });
$('#board').addEventListener('dragleave', () => $('#board').classList.remove('drop'));
$('#board').addEventListener('drop', e => { $('#board').classList.remove('drop'); const fl = [...(e.dataTransfer.files || [])].find(f => /^image\//.test(f.type)); if (!fl) return; e.preventDefault(); boardImageIn(fl); });
async function boardImageIn(fl) {
  await workBoard(); const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = async () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)); const t = document.createElement('canvas'); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
    const c = await showBoard(true); const p = free(); window.fabric.Image.fromURL(t.toDataURL('image/jpeg', 0.82), img => { img.set({ left: p.x, top: p.y, daId: uid('i'), daKind: 'image' }); img.scaleToWidth(220); c.add(img); c.setActiveObject(img); c.renderAll(); saveSoon(); }); }; im.src = rd.result; };
  rd.readAsDataURL(fl);
}
$('#board').addEventListener('click', e => { const b = e.target.closest('[data-bt]'); if (b) boardTool(b.dataset.bt); });

/* ───────── the W.I.S.H.: the master form. Four lines written for a signal, sent on as a story waiting to print ───────── */
/* what a W.I.S.H. is for: a species (sent here, or in the radar now), the climate emergency, or the circular economy */
const INTENT = {
  climate: ['Heat', 'El Niño', 'Drought', 'Water', 'Shade', 'Smoke', 'Haze', 'Flood', 'Fire', 'Hot nights', 'Heatwave', 'Canopy', 'Cool streets', 'Dry soil', 'Storm water', 'A cool room for the street'],
  circular: ['Repair', 'Reuse', 'Share', 'Refill', 'Compost', 'Swap', 'Mend', 'Grow', 'Upcycle', 'Lend', 'Borrow', 'Rewear', 'Second hand', 'Less plastic', 'Local fibre', 'Fair wages', 'Who made it', 'Palm oil off the label', 'Forest fibre'],
  community: ['A street party', 'A seed swap', 'A repair café', 'A tool library', 'A water stop', 'A shade sail', 'A quiet hour', 'A nest box', 'A frog pond', 'A bee hotel', 'A pollinator strip', 'A dark night', 'A wildlife crossing', 'A community garden', 'A clothing swap', 'A free fridge', 'A neighbour check-in', 'Bare ground for bees', 'Water up high for possums', 'Snap traps, not bait'],
};
/* prompts that begin an intention, each finished with a life seen here */
const PROMPTS = ['Shade for the', 'Water for the', 'A home for the', 'Food for the', 'Dark nights for the', 'A safe road for the', 'A corridor for the', 'Less poison for the'];
function intentOptions() {
  const sps = [...new Map([...SPECIES, ...radiusSpecies(24)].map(sp => [sp.n, sp])).values()].map(sp => sp.n).slice(0, 24);
  const kinds = FIELD.map(e => e.cn).filter(Boolean);
  const prompts = sps.slice(0, 8).flatMap(n => PROMPTS.map(p => `${p} ${n.toLowerCase()}`));
  return [...new Set([...prompts, ...sps, ...INTENT.climate, ...INTENT.circular, ...INTENT.community, ...kinds])].map(n => `<option value="${esc(n)}"></option>`).join('');
}
const WDRAFT = store.get('da.wish.v1', { mix: '', w: '', i: '', s: '', h: '', by: '' });
/* the form itself is the handheld (42-faces.js): its front asks for the intention, its back, modded, holds the whole poem */
$('#view').addEventListener('input', e => { if (!e.target.closest('#wish-form')) return; for (const k of [...WKEYS, 'by']) { const el = $('#wf-' + k); if (el) WDRAFT[k] = el.value; } const fr = $('#wf-for'); if (fr) WDRAFT.for = fr.value; store.set('da.wish.v1', WDRAFT); });
$('#view').addEventListener('change', e => { if (e.target.id === 'wf-for') { WDRAFT.for = e.target.value; store.set('da.wish.v1', WDRAFT); } });
$('#view').addEventListener('submit', e => {
  if (e.target.id !== 'wish-form') return; e.preventDefault();
  if (faceOf(1) === 'back') { const empty = ['for', ...WKEYS].map(k => $('#wf-' + k)).filter(el => el && !el.value.trim()); if (empty.length) { empty.forEach(el => el.classList.add('need')); nudge(empty[0]); tick(600); return; } }
  sendSignal();
});
/* the W.I.S.H. becomes a story: where the signal was, its four lines, its constellations; kept here, waiting to print */
async function sendSignal() {
  const L = Object.fromEntries(WKEYS.map(k => { const el = $('#wf-' + k); return [k, String(el ? el.value : WDRAFT[k] || '').trim()]; }));
  const m = MIXES[0]; const fr = String(($('#wf-for') || {}).value || WDRAFT.for || '').trim();
  if (!WKEYS.some(k => L[k]) && !fr) { nudge($('#wf-for') || $('#wf-w')); return null; } const forN = fr.replace(/^[lce]:/, '').trim(); const fsp = forN ? [...SPECIES, ...radiusSpecies(12)].find(x => x.n.toLowerCase() === forN.toLowerCase()) : null;
  const where = m ? m.where : { lat: +S.scan.lat.toFixed(4), lng: +S.scan.lng.toFixed(4), place: suburbAt(S.scan.lat, S.scan.lng) };
  const lead = m && ((m.layers.life || {}).cells || [])[0];
  const at = Date.now(); const byEl = $('#wf-by'); const who = String(byEl ? byEl.value : (WDRAFT.by || S.me.by || '')).trim();
  const pin = { id: null, lat: where.lat, lng: where.lng, n: fsp ? fsp.n : '', cn: where.place, ic: '', g: (fsp && fsp.g) || (lead && lead.g) || 'paw', place: where.place };
  const sig = { v: 1, code: codeFor(`${at}|${pin.lat}|${pin.lng}|${L.h}|${S.me.dev}`), at, pin, threat: '', when: '', deg: 0, lines: L, nodes: [], edges: [], who, ...(fr ? { for: fr } : {}), ...(m ? { mix: m.id } : {}), note: [forN, ...((m && m.figs) || []).map(g => g.name)].filter(Boolean).join(' · ') };
  if (WDRAFT.photo) { OWN[sig.code] = WDRAFT.photo; saveOwn(); sig.img = { k: 'own', a: '' }; }
  const ev = await ledgerAdd({ type: 'signal', lat: pin.lat, lng: pin.lng, who, data: sig });
  Object.assign(WDRAFT, { w: '', i: '', s: '', h: '', auto: {}, photo: '' }); store.set('da.wish.v1', WDRAFT);
  tie(1); snd.printer(900); buzz([10, 40, 10]); toast('✓');
  slipCanvas(sig, 384, 2, false, false).then(c => thumbOf(c.toDataURL('image/png'), 240)).then(u => addToBoard(u, 'receipt', 200)).catch(() => {});
  PRESS.story = ev.key; setView(2); return sig;
}
/* ───────── the book: the boards, the signals and constellations under each, and the field notes ───────── */
const LAYER_W = Object.fromEntries(LAYERS.map(L => [L.k, L.w]));
const mdEsc = t => String(t == null ? '' : t).replace(/([*_`#|[\]])/g, '\\$1');
function bookMD() {
  const out = ['# Field book', '', `novel.global · ${fmtStamp(Date.now())}`, ''];
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
const sigRow2 = m => { const gs = [...new Set(((m.layers.life || {}).cells || []).map(c => c.g).filter(Boolean))].slice(0, 6);
  return `<li class="g-sig"><button type="button" class="g-play" data-mix="${esc(m.id)}" aria-label="Play on the radio" data-tip="${esc(`${m.where.place} · ${fmtStamp(m.at)}`)}">${icon('play', 'sm')}</button><span class="g-lives">${gs.map(g => glyphSVG(g)).join('')}</span><small class="mono">${fmtStamp(m.at).split(' ')[1] || ''}</small></li>`; };
function viewSignals() {
  const on = BOARDS.find(b => b.id === boardId) || BOARDS[0]; const ms = MIXES.filter(m => (m.board || (BOARDS.find(b => !b.ex) || BOARDS[0]).id) === on.id);
  return wishDevice(true) + consStrip() + assetsHTML()
    + `<section class="sec book" id="sec-book"><div class="bk-h"><ol class="b-keys">${BOARDS.map(b => `<li>${b.ex ? `<button type="button" class="b-key ex mono" data-board="${esc(b.id)}" aria-pressed="${b.id === on.id}">${esc(b.n)}</button>` : b.id === on.id ? `<input class="bg-n mono" data-board-name="${esc(b.id)}" value="${esc(b.n)}" maxlength="32" aria-label="The board's name">` : `<button type="button" class="b-key mono" data-board="${esc(b.id)}" aria-pressed="false">${esc(b.n)}</button>`}</li>`).join('')}</ol>`
    + `<span class="bk-a"><button type="button" class="ib" data-new-board aria-label="A new board" data-tip="A new board">${icon('plus')}</button><button type="button" class="ib io" data-book-md aria-label="Download the field notes" data-tip="Field notes, out">${icon('download')}<small class="mono">.MD</small></button><label class="ib io" aria-label="Bring field notes in" data-tip="Field notes, in">${icon('receive')}<small class="mono">.MD</small><input type="file" id="md-in" accept=".md,text/markdown,text/plain" hidden></label></span></div>`
    + `<div class="bgroup on">${ms.length ? `<ol class="g-sigs">${ms.map(sigRow2).join('')}</ol>` : ''}</div></section>` + consSection();
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
