/* ════════════════════════════════════════════════════════════════════
   SIGNALS — the strategic black book. A field book kept on this device: every mix shared from the radio is a page, with
   all of its sound (each layer: on or off, its mood and level, every cell it played, where), its constellations and their
   connections. Beside it, a board over the map where the pages are laid out and joined, drawn with Fabric.js (MIT), the
   canvas the open dreamboard project is built on. The whole book downloads as Markdown, to keep or carry elsewhere.
   The board is kept as Fabric's own JSON (da.board.v1); the book's pages are the mixes (da.mixes.v1)
   ════════════════════════════════════════════════════════════════════ */
const BOARD_V = 1;
let fabLoad = null, cv = null;
function loadFabric() {
  if (window.fabric) return Promise.resolve(window.fabric);
  if (!fabLoad) fabLoad = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/fabric.min.js'; s.onload = () => res(window.fabric); s.onerror = () => { fabLoad = null; rej(new Error('fabric')); }; document.head.appendChild(s); });
  return fabLoad;
}
const BOARD_PROPS = ['daId', 'daFrom', 'daTo', 'daKind'];
const saveBoard = () => { if (cv) store.set('da.board.v1', { v: BOARD_V, json: cv.toJSON(BOARD_PROPS) }); };
/* the board shows over the map while SIGNALS is open */
async function showBoard(on) {
  const host = $('#board'); host.hidden = !on; document.body.classList.toggle('boarding', on); if (!on) return null;
  const f = await loadFabric().catch(() => null); if (!f) return null;
  const W = host.clientWidth, H = host.clientHeight;
  if (!cv) {
    cv = new f.Canvas('board-c', { width: W, height: H, backgroundColor: 'transparent', selection: true, preserveObjectStacking: true });
    const kept = store.get('da.board.v1', null); if (kept && kept.json) await new Promise(r => cv.loadFromJSON(kept.json, r));
    /* a card moved: the strings joined to it follow */
    cv.on('object:moving', e => follow(e.target)); cv.on('object:modified', saveBoard);
    addEventListener('resize', () => { if (!host.hidden) { cv.setWidth(host.clientWidth); cv.setHeight(host.clientHeight); cv.renderAll(); } });
  } else { cv.setWidth(W); cv.setHeight(H); }
  cv.renderAll(); return cv;
}
function follow(card) {
  if (!cv || !card || !card.daId) return;
  for (const l of cv.getObjects('line')) {
    const a = cv.getObjects().find(o => o.daId === l.daFrom), b = cv.getObjects().find(o => o.daId === l.daTo); if (!a || !b) continue;
    const ca = a.getCenterPoint(), cb = b.getCenterPoint(); l.set({ x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y }); l.setCoords();
  }
  cv.requestRenderAll();
}
/* a card on the board: paper, the radio's type, words in lines */
function card(f, id, kind, lines, x, y, w = 210) {
  const head = new f.Textbox(lines[0], { left: 12, top: 10, width: w - 24, fontFamily: 'VT323, monospace', fontSize: 20, lineHeight: 1, fill: '#141412' });
  const top = 18 + head.calcTextHeight();
  const body = new f.Textbox(lines.slice(1).join('\n'), { left: 12, top, width: w - 24, fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, lineHeight: 1.3, fill: '#3B3A36' });
  const h = top + 12 + body.calcTextHeight();
  const paper = new f.Rect({ left: 0, top: 0, width: w, height: h, fill: kind === 'mix' ? '#FCFBF7' : '#EFECE3', stroke: kind === 'mix' ? '#8C7469' : '#C9C4B6', strokeWidth: kind === 'mix' ? 2 : 1, rx: 2, ry: 2 });
  return new f.Group([paper, head, body], { left: x, top: y, daId: id, daKind: kind, hasControls: false, hoverCursor: 'grab' });
}
const LAYER_W = Object.fromEntries(LAYERS.map(L => [L.k, L.w]));
const layerLine = (k, L) => `${LAYER_W[k] || k.toUpperCase()} ${L.on ? (MOODS[L.mood] || {}).w || '' : 'OFF'}${L.on ? ` ${Math.round(L.lvl * 100)}%` : ''} · ${(L.cells || []).length}`;
/* a mix laid out: its card, and each constellation in it beside it, joined by a string */
async function placeMix(m) {
  const c = await showBoard(true); if (!c) return; const f = window.fabric;
  if (c.getObjects().some(o => o.daId === m.id)) return;
  const n = c.getObjects().filter(o => o.daKind === 'mix').length; const x = 40 + (n % 3) * 300, y = 40 + Math.floor(n / 3) * 260;
  const mc = card(f, m.id, 'mix', [`${m.where.place}\n${fmtStamp(m.at)}`, ...Object.entries(m.layers).map(([k, L]) => layerLine(k, L))], x, y); c.add(mc);
  (m.figs || []).forEach((g, i) => {
    const fc = card(f, `${m.id}:${g.id}`, 'fig', [g.name, ...(g.knots || []).slice(0, 8).map(k => k.n), `${(g.edges || []).length} STRINGS`], x + 240, y + i * 120, 170); c.add(fc);
    const a = mc.getCenterPoint(), b = fc.getCenterPoint();
    const l = new f.Line([a.x, a.y, b.x, b.y], { stroke: '#8C7469', strokeWidth: 1.2, strokeDashArray: [4, 3], selectable: false, evented: false, daFrom: m.id, daTo: `${m.id}:${g.id}` }); c.add(l); c.sendToBack(l);
  });
  c.renderAll(); saveBoard();
}
/* ───────── the book: pages as the mixes, and their markdown ───────── */
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
    if ((m.figs || []).length) {
      out.push('### Constellations', '');
      for (const g of m.figs) { out.push(`- **${mdEsc(g.name)}**: ${(g.knots || []).map(k => mdEsc(k.n)).join(', ')}`); for (const [a, b] of g.edges || []) out.push(`  - ${mdEsc(a)} → ${mdEsc(b)}`); }
      out.push('');
    }
  }
  return out.join('\n');
}
const bookPage = m => `<li class="page"><div class="pg-h"><b class="mono">${esc(m.where.place)}</b><small class="mono">${fmtStamp(m.at)}</small>`
  + `<span class="pg-a"><button type="button" class="ib" data-mix="${esc(m.id)}" aria-label="Play">${icon('play', 'sm')}</button><button type="button" class="ib" data-board-mix="${esc(m.id)}" aria-label="On the board">${icon('plus', 'sm')}</button></span></div>`
  + `<ol class="pg-l">${LAYERS.map(L => { const x = m.layers[L.k] || {}; return `<li class="${x.on ? 'on' : ''}">${icon(L.ic, 'sm')}${x.on ? icon((MOODS[x.mood] || MOODS.fog).ic, 'sm') : ''}<span class="mono">${(x.cells || []).length}</span></li>`; }).join('')}${(m.figs || []).length ? `<li class="on">${icon('string', 'sm')}<span class="mono">${m.figs.length}</span></li>` : ''}</ol></li>`;
function viewSignals() {
  return `<section class="sec book" id="sec-book"><div class="bk-h"><b class="b-head bk-t">FIELD BOOK</b><button type="button" class="ib" data-book-md aria-label="Download the field book" ${MIXES.length ? '' : 'disabled'}>${icon('download')}</button></div>`
    + (MIXES.length ? `<ol class="pages">${MIXES.map(bookPage).join('')}</ol>` : `<button type="button" class="to-radar" data-to-radar aria-label="The radar">${icon('radar')}</button>`) + `</section>`
    /* the constellations made on this device, each to play or trace */
    + consSection();
}
$('#view').addEventListener('click', e => {
  if (e.target.closest('[data-book-md]')) { download(`field-book-${isoDay(new Date())}.md`, bookMD(), 'text/markdown;charset=utf-8'); tick(1800); return; }
  const bm = e.target.closest('[data-board-mix]'); if (bm) { const m = MIXES.find(x => x.id === bm.dataset.boardMix); if (m) placeMix(m); tick(1500); }
});
