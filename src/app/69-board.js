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
function saveBoard(say) { if (!cv) return; store.set('da.board.' + boardId, { v: BOARD_V, json: cv.toJSON(BOARD_PROPS) }); if (say) toast('SAVED'); }
const saveSoon = debounce(() => saveBoard(false), 400);
/* the board's keys, as on a piece of hardware: an icon, and its short word printed under it */
const TOOLS = [['note', 'note', 'NOTE'], ['section', 'base', 'SECT'], ['link', 'string', 'LINK'], ['image', 'camera', 'IMG'], ['delete', 'close', 'DEL'], ['save', 'check', 'SAVE']];
function boardTools() {
  const t = $('#board-tools'); if (t.childElementCount) return;
  t.innerHTML = TOOLS.map(([k, ic, w]) => `<button type="button" class="bt" data-bt="${k}" aria-label="${w}">${icon(ic)}<small>${w}</small></button>`).join('') + '<input type="file" id="board-file" accept="image/*" hidden>';
  $('#board-label').textContent = 'SIGNAL BOARD · MODEL DA-03 · IN: SIGNALS FROM THE RADIO · OUT: STORIES TO PRINT · LINK JOINS, CLICK A STRING TO LET IT GO · CONTAINS LIVE DATA';
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
async function loadBoard() { cv.clear(); const k = boardOf(boardId); if (k && k.json) await new Promise(r => cv.loadFromJSON(k.json, r)); for (const l of cv.getObjects('line')) l.set({ selectable: false, evented: true, hoverCursor: 'pointer' }); cv.renderAll(); }
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
    fig: { fill: '#E9F2F0', backgroundColor: 'rgba(255,255,255,.08)', fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, width: 180 } }[kind] || {};
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
  if (k === 'delete') { const all = c.getActiveObjects(); if (!all.length) return; for (const o of all) { c.remove(o); for (const l of c.getObjects('line')) if (l.daFrom === o.daId || l.daTo === o.daId) c.remove(l); } c.discardActiveObject(); }
  if (k === 'save') { saveBoard(true); return; }
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
function wishForm() {
  const ms = MIXES; const sel = ms.some(m => m.id === WDRAFT.mix) ? WDRAFT.mix : (ms[0] || {}).id || '';
  return `<form class="wish-form" id="wish-form" autocomplete="off"><b class="b-head wf-t">W.I.S.H.</b>`
    + (ms.length ? `<select id="wf-mix" aria-label="The signal it answers">${ms.map(m => `<option value="${esc(m.id)}"${m.id === sel ? ' selected' : ''}>${esc(m.where.place)} · ${fmtStamp(m.at)}</option>`).join('')}</select>` : '')
    + WKEYS.map(k => `<label class="wf-l"><span class="mono">${esc(WISH[k][0].toUpperCase())}</span><input id="wf-${k}" type="text" maxlength="${SIG.line}" value="${esc(WDRAFT[k] || '')}" placeholder="${esc(WISH[k][1])}" spellcheck="true"></label>`).join('')
    + `<label class="wf-l by"><span class="mono">BY</span><input id="wf-by" type="text" maxlength="40" value="${esc(WDRAFT.by || S.me.by || '')}" placeholder="name"></label>`
    + `<button type="submit" class="send-b">${icon('share', 'sm')}<span>SEND THE SIGNAL</span></button></form>`;
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
    return `<li class="bgroup${on ? ' on' : ''}"><button type="button" class="bg-h" data-board="${esc(b.id)}" aria-pressed="${on}"><b class="mono">${esc(b.n)}</b><small class="mono">${ms.length} · ${figs.length}</small></button>`
      + (ms.length ? `<ol class="g-sigs">${ms.map(sigRow2).join('')}</ol>` : '') + (figs.length ? `<ol class="g-figs">${figs.map(g => `<li class="mono">${icon('string', 'sm')}${esc(g.name)}</li>`).join('')}</ol>` : '') + (on ? consSection() : '') + `</li>`; }).join('');
  return `<section class="sec" id="sec-wish">${wishForm()}</section>`
    + `<section class="sec book" id="sec-book"><div class="bk-h"><b class="b-head bk-t">BOARDS</b><span class="bk-a"><button type="button" class="ib" data-new-board aria-label="A new board">${icon('plus')}</button><button type="button" class="ib" data-book-md aria-label="Download the field notes">${icon('download')}</button><label class="ib" aria-label="Bring field notes in">${icon('receive')}<input type="file" id="md-in" accept=".md,text/markdown,text/plain" hidden></label></span></div>`
    + `<ol class="bgroups">${groups}</ol></section>`;
}
$('#view').addEventListener('click', e => {
  if (e.target.closest('[data-book-md]')) { download(`field-notes-${isoDay(new Date())}.md`, bookMD(), 'text/markdown;charset=utf-8'); tick(1800); return; }
  if (e.target.closest('[data-new-board]')) { newBoard(); return; }
  const bd = e.target.closest('[data-board]'); if (bd) { switchBoard(bd.dataset.board); return; }
  const bm = e.target.closest('[data-board-mix]'); if (bm) { const m = MIXES.find(x => x.id === bm.dataset.boardMix); if (m) placeMix(m); tick(1500); }
});
$('#view').addEventListener('change', async e => {
  if (e.target.id !== 'md-in') return; const fl = e.target.files && e.target.files[0]; if (!fl) return;
  const n = await notesIn(await fl.text()); toast(`${n} NOTES IN`); e.target.value = '';
});
