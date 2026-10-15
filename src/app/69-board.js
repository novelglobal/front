/* ════════════════════════════════════════════════════════════════════
   SIGNALS — the strategic black book. A board over the ground, drawn with Fabric.js (MIT), the canvas the open dreamboard
   project is built on, and a field book beside it. Each signal sent from the radio lands as a card that can be rewritten:
   where, what each layer heard, the constellations. Notes, sections, images and strings are added and joined by hand; a
   W.I.S.H. poster is filled in on the board and published to SIGNS, to print. The whole book downloads as Markdown.
   The board is kept as Fabric's JSON (da.board.v1); the pages are the mixes (da.mixes.v1)
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
function saveBoard(say) { if (!cv) return; store.set('da.board.v1', { v: BOARD_V, json: cv.toJSON(BOARD_PROPS) }); if (say) toast('SAVED'); }
const saveSoon = debounce(() => saveBoard(false), 400);
/* the tools along the top of the board: icons only */
const TOOLS = [['note', 'note', 'A note'], ['section', 'base', 'A section'], ['link', 'string', 'Join two'], ['image', 'camera', 'An image'], ['wish', 'sign', 'A W.I.S.H. poster'], ['publish', 'print', 'Publish the poster to SIGNS'], ['delete', 'close', 'Remove'], ['save', 'check', 'Save']];
function boardTools() { const t = $('#board-tools'); if (t.childElementCount) return; t.innerHTML = TOOLS.map(([k, ic, tip]) => `<button type="button" class="bt" data-bt="${k}" aria-label="${tip}" data-tip="${tip}">${icon(ic)}</button>`).join('') + '<input type="file" id="board-file" accept="image/*" hidden>'; }
/* the board shows over the ground while SIGNALS is open */
async function showBoard(on) {
  const host = $('#board'); host.hidden = !on; if (!on) return null;
  boardTools();
  const f = await loadFabric().catch(() => null); if (!f) return null;
  const W = host.clientWidth, H = host.clientHeight - 52;
  if (!cv) {
    cv = new f.Canvas('board-c', { width: W, height: H, selection: true, preserveObjectStacking: true });
    const kept = store.get('da.board.v1', null); if (kept && kept.json && kept.v === BOARD_V) await new Promise(r => cv.loadFromJSON(kept.json, r));
    cv.on('object:moving', e => follow()); cv.on('object:modified', saveSoon); cv.on('text:changed', saveSoon);
    cv.on('mouse:down', e => linking(e.target));
    addEventListener('resize', () => { if (!host.hidden) { cv.setWidth(host.clientWidth); cv.setHeight(host.clientHeight - 52); cv.renderAll(); } });
  } else { cv.setWidth(W); cv.setHeight(H); }
  cv.renderAll(); return cv;
}
const byId = id => cv.getObjects().find(o => o.daId === id);
/* strings follow the cards they join */
function follow() {
  if (!cv) return;
  for (const l of cv.getObjects('line')) { const a = byId(l.daFrom), b = byId(l.daTo); if (!a || !b) continue; const ca = a.getCenterPoint(), cb = b.getCenterPoint(); l.set({ x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y }); l.setCoords(); }
  cv.requestRenderAll();
}
function joinCards(a, b) {
  const f = window.fabric; if (!a || !b || a === b || !a.daId || !b.daId) return;
  if (cv.getObjects('line').some(l => (l.daFrom === a.daId && l.daTo === b.daId) || (l.daFrom === b.daId && l.daTo === a.daId))) return;
  const ca = a.getCenterPoint(), cb = b.getCenterPoint();
  const l = new f.Line([ca.x, ca.y, cb.x, cb.y], { stroke: '#8C7469', strokeWidth: 1.4, strokeDashArray: [5, 4], selectable: false, evented: false, daFrom: a.daId, daTo: b.daId, daKind: 'link' });
  cv.add(l); cv.sendToBack(l); for (const o of cv.getObjects().filter(o => o.daKind === 'section')) cv.sendToBack(o); saveSoon();
}
/* joining: the tool armed, then one card, then another */
let linkFrom = null, linkArmed = false;
function linking(t) {
  if (!linkArmed) return; if (!t || !t.daId || t.daKind === 'link') return;
  if (!linkFrom) { linkFrom = t; snd.tick(1500); return; }
  joinCards(linkFrom, t); linkFrom = null; linkArmed = false; $('#board [data-bt="link"]').classList.remove('on'); snd.knot({ fam: 'people' }, F0 * 5, 0, 0.6, 0);
}
/* a card is one piece of editable text on paper: double-click to rewrite it */
function textCard(f, id, kind, text, x, y, o = {}) {
  const look = { mix: { fill: '#141412', backgroundColor: '#FCFBF7', fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, width: 240 }, note: { fill: '#141412', backgroundColor: '#F2E6A6', fontFamily: 'VT323, monospace', fontSize: 20, width: 180 },
    fig: { fill: '#141412', backgroundColor: '#EFECE3', fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, width: 180 }, wish: { fill: '#141412', backgroundColor: '#FFFFFF', fontFamily: 'VT323, monospace', fontSize: 22, width: 300 } }[kind];
  return new f.Textbox(text, { left: x, top: y, padding: 12, lineHeight: 1.25, daId: id, daKind: kind, splitByGrapheme: false, editable: true, ...look, ...o });
}
const free = () => { const n = cv.getObjects().filter(o => o.daKind && o.daKind !== 'link').length; return { x: 40 + (n % 4) * 270, y: 40 + Math.floor(n / 4) * 230 }; };
const names = (cells, n = 6) => [...new Set((cells || []).map(c => c.n))].slice(0, n).join(', ');
/* what a signal sent from the radio says: where and when; what each layer heard, by name; its constellations */
function mixText(m) {
  const L = m.layers || {}; const line = (k, w) => { const x = L[k] || {}; return x.on ? `${w} · ${(MOODS[x.mood] || {}).w || ''}\n  ${names(x.cells) || '—'}` : `${w} · OFF`; };
  return [`${m.where.place} · ${fmtStamp(m.at)}`, `${m.where.lat}, ${m.where.lng} · ${metres(m.where.r)}`, '', line('life', 'LIFE'), line('community', 'COMMUNITY'), line('water', 'WATER'), line('pollution', 'POLLUTION'),
    ...((m.figs || []).length ? ['', `CONSTELLATIONS · ${m.figs.map(g => g.name).join(', ')}`] : [])].join('\n');
}
async function placeMix(m) {
  const c = await showBoard(true); if (!c) return; const f = window.fabric;
  if (byId(m.id)) { c.setActiveObject(byId(m.id)); c.renderAll(); return; }
  const p = free(); const mc = textCard(f, m.id, 'mix', mixText(m), p.x, p.y, { daMix: m.id }); c.add(mc);
  (m.figs || []).forEach((g, i) => { const fc = textCard(f, `${m.id}:${g.id}`, 'fig', [g.name, ...(g.knots || []).slice(0, 8).map(k => `· ${k.n}`)].join('\n'), p.x + 290, p.y + i * 150); c.add(fc); joinCards(mc, fc); });
  c.setActiveObject(mc); c.renderAll(); saveBoard(false);
}
/* the W.I.S.H. poster: four lines to fill in, the signal it answers at its head */
function wishText(m) {
  return ['W.I.S.H.', m ? `${m.where.place} · ${fmtStamp(m.at)}` : fmtStamp(Date.now()), '', `${WISH.w[0].toUpperCase()}`, '…', '', `${WISH.i[0].toUpperCase()}`, '…', '', `${WISH.s[0].toUpperCase()}`, '…', '', `${WISH.h[0].toUpperCase()}`, '…', '', '— by ______   signed ______'].join('\n');
}
async function boardTool(k) {
  const c = await showBoard(true); if (!c) return; const f = window.fabric; const p = free(); const sel = c.getActiveObject();
  if (k === 'note') { const n = textCard(f, uid('n'), 'note', 'A note', p.x, p.y); c.add(n); c.setActiveObject(n); n.enterEditing(); n.selectAll(); }
  if (k === 'section') { const r = new f.Rect({ left: p.x - 20, top: p.y - 20, width: 560, height: 360, fill: 'rgba(255,255,255,.035)', stroke: 'rgba(255,255,255,.35)', strokeDashArray: [2, 4], rx: 4, ry: 4, daId: uid('s'), daKind: 'section' });
    const t = textCard(f, uid('st'), 'note', 'SECTION', p.x - 10, p.y - 52, { backgroundColor: 'transparent', fill: '#EDEDED', fontSize: 24, width: 300 }); c.add(r); c.sendToBack(r); c.add(t); c.setActiveObject(t); }
  if (k === 'link') { linkArmed = !linkArmed; linkFrom = null; $('#board [data-bt="link"]').classList.toggle('on', linkArmed); if (linkArmed && sel && sel.daId) { linkFrom = sel; } return; }
  if (k === 'image') { $('#board-file').click(); return; }
  if (k === 'wish') { const m = sel && sel.daMix ? MIXES.find(x => x.id === sel.daMix) : MIXES[0]; const w = textCard(f, uid('w'), 'wish', wishText(m), p.x, p.y); c.add(w); if (sel && sel.daId) joinCards(sel, w); c.setActiveObject(w); }
  if (k === 'publish') { const w = sel && sel.daKind === 'wish' ? sel : c.getObjects().filter(o => o.daKind === 'wish').pop(); if (!w) { toast('A W.I.S.H. POSTER FIRST'); return; } publishPoster(w); return; }
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
/* a poster published: drawn as an image, kept for SIGNS, where it is laid out and printed */
const POSTERS = store.get('da.posters.v1', []);
function publishPoster(w) {
  const was = w.backgroundColor; const url = w.toDataURL({ format: 'png', multiplier: 2 }); w.set('backgroundColor', was);
  POSTERS.unshift({ id: uid('p'), at: Date.now(), text: w.text, png: url }); while (POSTERS.length > 12) POSTERS.pop();
  while (!store.set('da.posters.v1', POSTERS) && POSTERS.length > 1) POSTERS.pop();
  tie(2); toast('PUBLISHED TO SIGNS'); snd.printer(700); setView(2);
}
/* ───────── the book: pages as the mixes, the board's own words, and their markdown ───────── */
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
  /* the board's words: the cards as rewritten, the notes, the sections, the posters */
  const kept = store.get('da.board.v1', null); const objs = ((kept && kept.json && kept.json.objects) || []).filter(o => o.text && o.daKind);
  if (objs.length) { out.push('## The board', ''); for (const o of objs) out.push(`### ${o.daKind.toUpperCase()}`, '', ...String(o.text).split('\n').map(l => (l ? `> ${l}` : '>')), ''); }
  return out.join('\n');
}
const bookPage = m => `<li class="page"><div class="pg-h"><b class="mono">${esc(m.where.place)}</b><small class="mono">${fmtStamp(m.at)}</small>`
  + `<span class="pg-a"><button type="button" class="ib" data-mix="${esc(m.id)}" aria-label="Play">${icon('play', 'sm')}</button><button type="button" class="ib" data-board-mix="${esc(m.id)}" aria-label="On the board">${icon('plus', 'sm')}</button></span></div>`
  + `<ol class="pg-l">${LAYERS.map(L => { const x = m.layers[L.k] || {}; return `<li class="${x.on ? 'on' : ''}">${icon(L.ic, 'sm')}${x.on ? icon((MOODS[x.mood] || MOODS.fog).ic, 'sm') : ''}</li>`; }).join('')}${(m.figs || []).length ? `<li class="on">${icon('string', 'sm')}</li>` : ''}</ol></li>`;
function viewSignals() {
  return `<section class="sec book" id="sec-book"><div class="bk-h"><b class="b-head bk-t">FIELD BOOK</b><button type="button" class="ib" data-book-md aria-label="Download the field book">${icon('download')}</button></div>`
    + (MIXES.length ? `<ol class="pages">${MIXES.map(bookPage).join('')}</ol>` : '') + `</section>`
    + consSection();
}
$('#view').addEventListener('click', e => {
  if (e.target.closest('[data-book-md]')) { download(`field-book-${isoDay(new Date())}.md`, bookMD(), 'text/markdown;charset=utf-8'); tick(1800); return; }
  const bm = e.target.closest('[data-board-mix]'); if (bm) { const m = MIXES.find(x => x.id === bm.dataset.boardMix); if (m) placeMix(m); tick(1500); }
});
