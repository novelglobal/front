/* ════════════════════════════════════════════════════════════════════
   SIGNS — the press. The stories waiting to print, each shown on the desk as the paper will carry it: a heat-printed
   receipt by default (80 mm, or 58 mm), a Game Boy print, or laid out on an A5 page like a zine. Its style (PAPER, the
   terminal >, CONNECTION) changes what the paper says. Out: printed here, sent to novel.global's printer, saved as a
   picture or as the printer's own bytes, or as a mesh line. Stickers come from the signal itself: its lives, its places,
   its water, cut out. The page is drawn with Fabric.js and kept on this device (da.zine.v1)
   ════════════════════════════════════════════════════════════════════ */
const FORMATS = { r80: { w: '80 MM', dots: 512, paper: '80', css: '80mm' }, r58: { w: '58 MM', dots: 384, paper: '58', css: '58mm' }, gb: { w: 'GAME BOY', dots: 160, levels: 4, css: '58mm' }, zine: { w: 'A5 ZINE', css: 'A5' } };
const PRESS = { story: null, fmt: FORMATS[prefs.pfmt] ? prefs.pfmt : 'r80' };
const waiting = () => S.signals.filter(s => !s.ex && !s.shared && !/^PRINTED/.test(sentWord(s)));
const pressStory = () => S.signals.find(s => s.key === PRESS.story) || waiting()[0] || null;
let zc = null;
const ZINE_PROPS = ['daKind'];
const ZHIST = []; let zLast = '';
const saveZine = debounce(() => { if (!zc) return; const json = zc.toJSON(ZINE_PROPS); const str = JSON.stringify(json); if (zLast && str !== zLast) { ZHIST.push(zLast); if (ZHIST.length > 40) ZHIST.shift(); } zLast = str; store.set('da.zine.v1', { json }); }, 300);
const ZTOOLS = [['text', 'quote', 'TYPE'], ['head', 'sign', 'HEAD'], ['cut', 'remix', 'CUT'], ['image', 'camera', 'COPY'], ['draw', 'trace', 'PEN'], ['shape', 'base', 'SHAPE'], ['stamp', 'check', 'STAMP'], ['tape', 'minus', 'TAPE'], ['undo', 'undo', 'UNDO'], ['delete', 'close', 'DEL']];
let ZCOL = store.get('da.zcol', '#141412');
function zineTools() {
  const t = $('#zine-tools'); if (t.childElementCount) return;
  t.innerHTML = `<input type="text" id="zine-words" maxlength="80" placeholder="words" aria-label="Words to place">` + ZTOOLS.map(([k, ic, w]) => `<button type="button" class="bt zt" data-zt="${k}" aria-label="${w}">${icon(ic)}<small>${w}</small></button>`).join('') + `<label class="bt zcol" aria-label="Colour"><input type="color" id="zine-col" value="${ZCOL}"><small>INK</small></label>` + '<input type="file" id="zine-file" accept="image/*" hidden>';
  $('#zine-label').textContent = 'PRINT SHOP · MODEL DA-04 · THERMAL 80 MM / 58 MM · A5 · RUNS ON WHAT IS LEFT OVER · HEAT-SENSITIVE PAPER: KEEP FROM SUN · PRINT WHAT YOU WILL DO';
}
/* the desk: the story as it will print, or the page */
async function showZine(on) {
  const host = $('#zine'); host.hidden = !on; if (!on) return null;
  zineTools(); const page = PRESS.fmt === 'zine'; host.classList.toggle('paging', page);
  if (!page) { await drawRoll(); return null; }
  const f = await loadFabric().catch(() => null); if (!f) return null;
  if (!zc) {
    zc = new f.Canvas('zine-c', { width: 420, height: 595, backgroundColor: '#F4F1EA', preserveObjectStacking: true });
    const kept = store.get('da.zine.v1', null); if (kept && kept.json) { zLast = JSON.stringify(kept.json); await new Promise(r => zc.loadFromJSON(kept.json, r)); }
    zc.on('object:modified', saveZine); zc.on('text:changed', saveZine); zc.on('path:created', e => { if (e.path) e.path.set('daKind', 'pen'); saveZine(); });
  }
  zc.renderAll(); return zc;
}
/* the roll: the story drawn as the printer's head would, in its inks */
let rollN = 0;
async function drawRoll() {
  const el = $('#press-roll'); const s = pressStory(); const F = FORMATS[PRESS.fmt]; const my = ++rollN;
  if (!s) { el.innerHTML = '<i class="roll-blank"></i>'; return; }
  const cvs = await slipCanvas(s, F.dots - (F.dots % 8), F.levels || 2, isTty(), isConn()).catch(() => null); if (my !== rollN || !cvs) return;
  el.innerHTML = `<img src="${cvs.toDataURL('image/png')}" alt="" class="roll-img ${PRESS.fmt}">`;
}
const words = () => ($('#zine-words').value || '').trim();
const rnd = (a, b) => a + Math.random() * (b - a);
/* letters cut from different pages: each its own face, size and paper */
function cutOut(f, text, x, y) {
  const faces = ['VT323, monospace', 'Poppins, sans-serif', '"IBM Plex Mono", monospace', 'Georgia, serif'];
  const papers = ['#FFFFFF', '#141412', '#E9E2CF', '#7FD1C2', '#E8F0B8'];
  let dx = 0; const parts = [];
  for (const ch of text) {
    if (ch === ' ') { dx += 12; continue; }
    const bg = papers[Math.floor(Math.random() * papers.length)];
    const t = new f.Text(ch.toUpperCase(), { left: dx, top: rnd(-4, 4), fontFamily: faces[Math.floor(Math.random() * faces.length)], fontSize: Math.round(rnd(22, 34)), fontWeight: Math.random() < 0.5 ? 700 : 400, fill: bg === '#141412' ? '#FFFFFF' : '#141412', backgroundColor: bg, angle: rnd(-6, 6), padding: 2 });
    parts.push(t); dx += t.width + 4;
  }
  return new f.Group(parts, { left: x, top: y, daKind: 'cut' });
}
/* a photocopy: grey, hard, a little blown out */
function photocopy(img) { const F = window.fabric.Image.filters; img.filters = [new F.Grayscale(), new F.Contrast({ contrast: 0.45 }), new F.Brightness({ brightness: 0.04 })]; img.applyFilters(); return img; }
/* a sticker, die-cut: the mark in ink, a white edge around it, a little shadow; drawn from the same marks as the map */
function sticker(st) {
  const c = document.createElement('canvas'); c.width = c.height = 180; const x = c.getContext('2d'); const draw = (col, dx = 0, dy = 0) => (st.g ? M.glyph(x, st.g, 90 + dx, 90 + dy, 110, col) : M.icon(x, st.i, 90 + dx, 90 + dy, 104, col));
  x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.shadowOffsetY = 3; for (let a = 0; a < 16; a++) draw('#FFFFFF', Math.cos(a / 16 * Math.PI * 2) * 9, Math.sin(a / 16 * Math.PI * 2) * 9); x.restore();
  for (let a = 0; a < 16; a++) draw('#FFFFFF', Math.cos(a / 16 * Math.PI * 2) * 7, Math.sin(a / 16 * Math.PI * 2) * 7);
  draw(st.col || '#141412'); return c.toDataURL('image/png');
}
/* the stickers a signal gives: each kind of life it heard, each part of the community and what pollutes, its water */
function stickersOf(s) {
  const m = (s && s.mix && MIXES.find(x => x.id === s.mix)) || MIXES[0]; const out = []; const seen = new Set(); const add = st => { const k = st.g || st.i; if (seen.has(k) || out.length >= 18) return; seen.add(k); out.push(st); };
  if (s && s.pin && s.pin.g) add({ g: s.pin.g, col: C.kind[M.GROUP[s.pin.g]] || '#141412' });
  if (m) { for (const c of (m.layers.life || {}).cells || []) if (c.g) add({ g: c.g === 'human' ? 'ape' : c.g, col: C.kind[M.GROUP[c.g]] || '#141412' });
    for (const k of ['community', 'pollution']) for (const c of (m.layers[k] || {}).cells || []) if (c.fam) add({ i: FAM_IC[c.fam] || 'people', col: k === 'pollution' ? '#D62E1F' : '#0B2545' });
    if (((m.layers.water || {}).cells || []).length) add({ i: 'water', col: '#0067B8' }); }
  for (const i of ['radar', 'receipt', 'string']) add({ i, col: '#141412' });
  return out;
}
async function zineTool(k) {
  if (PRESS.fmt !== 'zine') setFormat('zine');
  const c = await showZine(true); if (!c) return; const f = window.fabric; const W = c.getWidth(); const x = rnd(30, W * 0.4), y = rnd(30, c.getHeight() * 0.6);
  if (k === 'text') { const t = new f.Textbox(words() || 'typewritten words', { left: x, top: y, width: W * 0.55, fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fill: ZCOL, daKind: 'text' }); c.add(t); c.setActiveObject(t); }
  if (k === 'head') { const t = new f.Textbox((words() || 'DIRECT ACTION').toUpperCase(), { left: 24, top: y, width: W - 48, fontFamily: 'VT323, monospace', fontSize: 56, lineHeight: 0.9, fill: ZCOL, daKind: 'head' }); c.add(t); c.setActiveObject(t); }
  if (k === 'cut') { const g = cutOut(f, words() || 'WISH', x, y); c.add(g); c.setActiveObject(g); }
  if (k === 'image') { $('#zine-file').click(); return; }
  if (k === 'tape') { const r = new f.Rect({ left: x, top: y, width: 120, height: 28, fill: 'rgba(233,226,207,.78)', angle: rnd(-25, 25), daKind: 'tape' }); c.add(r); c.setActiveObject(r); }
  if (k === 'delete') { for (const o of c.getActiveObjects()) c.remove(o); c.discardActiveObject(); }
  /* the pen: drawn by hand, in the ink chosen */
  if (k === 'draw') { c.isDrawingMode = !c.isDrawingMode; c.freeDrawingBrush.color = ZCOL; c.freeDrawingBrush.width = 3; $('#zine [data-zt="draw"]').classList.toggle('on', c.isDrawingMode); return; }
  /* shapes in turn: a dot, a burst, an arrow, a box */
  if (k === 'shape') { const n = (zineTool.n = ((zineTool.n || 0) + 1) % 4); let o;
    if (n === 1) o = new f.Circle({ left: x, top: y, radius: 34, fill: ZCOL, daKind: 'shape' });
    if (n === 2) { const pts = []; for (let i = 0; i < 24; i++) { const r = i % 2 ? 22 : 44; const a = i / 24 * Math.PI * 2; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); } o = new f.Polygon(pts, { left: x, top: y, fill: ZCOL, daKind: 'shape' }); }
    if (n === 3) o = new f.Path('M0 10 L60 10 L60 0 L84 18 L60 36 L60 26 L0 26 Z', { left: x, top: y, fill: ZCOL, angle: rnd(-20, 20), daKind: 'shape' });
    if (n === 0) o = new f.Rect({ left: x, top: y, width: 110, height: 70, fill: 'transparent', stroke: ZCOL, strokeWidth: 3, daKind: 'shape' });
    c.add(o); c.setActiveObject(o); }
  /* a rubber stamp: the words in a rough box, slightly crooked, half-inked */
  if (k === 'stamp') { const t = new f.Text((words() || 'RECEIVED').toUpperCase(), { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, fontSize: 22, fill: ZCOL, opacity: 0.82, padding: 8 });
    const r = new f.Rect({ width: t.width + 22, height: t.height + 16, left: -11, top: -8, fill: 'transparent', stroke: ZCOL, strokeWidth: 3, rx: 4, ry: 4, opacity: 0.82 });
    const g = new f.Group([r, t], { left: x, top: y, angle: rnd(-9, 9), daKind: 'stamp' }); c.add(g); c.setActiveObject(g); }
  if (k === 'undo') { if (!ZHIST.length) { tick(600); return; } const prev = ZHIST.pop(); zLast = prev; await new Promise(r => c.loadFromJSON(JSON.parse(prev), r)); c.renderAll(); store.set('da.zine.v1', { json: JSON.parse(prev) }); snd.tick(1100); return; }
  c.renderAll(); saveZine(); snd.tick(1500);
}
/* a colour of one's own: for the pen, the shapes, the stamps, and whatever is chosen on the page */
$('#zine').addEventListener('input', e => {
  if (e.target.id !== 'zine-col') return; ZCOL = e.target.value; store.set('da.zcol', ZCOL); if (!zc) return; zc.freeDrawingBrush.color = ZCOL;
  for (const o of zc.getActiveObjects()) { if (o.type === 'path' && !o.fill) o.set('stroke', ZCOL); else if (o.type === 'group') o.getObjects().forEach(x => (x.type === 'rect' ? x.set('stroke', ZCOL) : x.set('fill', ZCOL))); else if (o.stroke && o.fill === 'transparent') o.set('stroke', ZCOL); else o.set('fill', ZCOL); }
  zc.renderAll(); saveZine();
});
/* onto the page: a sticker, or the story itself as it prints */
async function placeOnPage(url, kind, width) {
  if (PRESS.fmt !== 'zine') setFormat('zine');
  const c = await showZine(true); if (!c) return;
  window.fabric.Image.fromURL(url, im => { im.set({ left: rnd(30, 200), top: rnd(30, 300), angle: kind === 'sticker' ? rnd(-12, 12) : 0, daKind: kind }); im.scaleToWidth(width); c.add(im); c.setActiveObject(im); c.renderAll(); saveZine(); });
}
function setFormat(k) { if (!FORMATS[k]) return; PRESS.fmt = k; prefs.pfmt = k; savePrefs(); $$('#view [data-pfmt]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pfmt === k))); showZine(true); tick(1500); }
/* what this device made, as pieces for the page: each story as its receipt, each cell as a sticker of its photograph or
   its mark, each constellation as its chart */
function cellSticker(o) {
  return new Promise(res => { const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d');
    const done = () => res(c.toDataURL('image/png')); x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.beginPath(); x.arc(100, 100, 92, 0, Math.PI * 2); x.fillStyle = '#FFFFFF'; x.fill(); x.restore();
    if (o.photo) { const im = new Image(); im.onload = () => { x.save(); x.beginPath(); x.arc(100, 100, 82, 0, Math.PI * 2); x.clip(); const k = Math.max(164 / im.width, 164 / im.height); x.drawImage(im, 100 - im.width * k / 2, 100 - im.height * k / 2, im.width * k, im.height * k); x.restore(); done(); }; im.onerror = done; im.src = o.photo; }
    else { M.glyph(x, glyphOf(o) || 'paw', 100, 100, 110, '#141412'); done(); } });
}
const figChart = g => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" rx="10" fill="#fff"/><g transform="translate(10 10)">${strings.chartOf(g.id, 160)}</g></svg>`)}`;
async function pieceOn(kind, id) {
  if (kind === 's') { const x = S.signals.find(v => v.key === id); if (!x) return; const cvs = await slipCanvas(x, 384, 2, isTty(), isConn()); placeOnPage(cvs.toDataURL('image/png'), 'story', 150); }
  if (kind === 'r') { const o = myCells().find(v => String(v.id) === String(id)); if (o) placeOnPage(await cellSticker(o), 'sticker', 86); }
  if (kind === 'c') { const g = strings.list().find(v => String(v.id) === String(id)); if (g) placeOnPage(figChart(g), 'chart', 120); }
}
/* the press's outputs */
async function pressOut(k) {
  const s = pressStory(); const F = FORMATS[PRESS.fmt];
  if (k === 'print' || k === 'send') feedAnim();
  if (k === 'print') {
    let url = ''; if (PRESS.fmt === 'zine') { if (!zc) return; zc.discardActiveObject(); zc.renderAll(); url = zc.toDataURL({ format: 'png', multiplier: 3 }); } else { const img = $('#press-roll img'); if (!img) return; url = img.src; }
    const el = $('#p-slip'); el.innerHTML = `<img src="${url}" alt="" style="width:100%;display:block;image-rendering:pixelated">`; el.className = 'slip print zine';
    let st = $('#page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); } st.textContent = PRESS.fmt === 'zine' ? '@page{size:A5;margin:0}' : `@page{size:${F.css} ${Math.ceil(($('#press-roll img').naturalHeight / F.dots) * parseInt(F.css, 10)) + 6}mm;margin:0}`;
    tie(2); snd.printer(900); window.print(); return;
  }
  if (k === 'png') { const url = PRESS.fmt === 'zine' ? (zc && zc.toDataURL({ format: 'png', multiplier: 3 })) : ($('#press-roll img') || {}).src; if (!url) return; const a = document.createElement('a'); a.href = url; a.download = `${s ? s.code : 'sign'}-${PRESS.fmt}.png`; a.click(); tick(1800); return; }
  if (!s) { toast('NOTHING WAITING'); return; }
  if (k === 'escpos') { download(`${s.code}.bin`, new Blob([await escpos(s, F.paper || '80')], { type: 'application/octet-stream' })); tick(1800); return; }
  if (k === 'mesh') { const t = meshText(s); const ok = await copyText(t); toast(ok ? `COPIED · ${bytes(t)} B` : t.slice(0, 60)); return; }
  if (k === 'send') { try { const v = await directAction(s, MASTER ? MASTER.id : ''); tie(2); toast(v.status === 'outbox' ? 'NO SIGNAL · IT WILL SEND' : 'SENT · WAITING FOR APPROVAL'); refreshPanel(); } catch (e) { toast('NOT SENT'); } }
}
$('#zine').addEventListener('click', e => { const b = e.target.closest('[data-zt]'); if (b) zineTool(b.dataset.zt); });
$('#zine').addEventListener('change', e => {
  const fl = e.target.files && e.target.files[0]; if (!fl || e.target.id !== 'zine-file') return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = async () => { const k = Math.min(1, 1200 / Math.max(im.width, im.height)); const t = document.createElement('canvas'); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
    const c = await showZine(true); window.fabric.Image.fromURL(t.toDataURL('image/jpeg', 0.85), img => { photocopy(img); img.set({ left: 24, top: 24, angle: rnd(-3, 3), daKind: 'image' }); img.scaleToWidth(c.getWidth() * 0.7); c.add(img); c.setActiveObject(img); c.renderAll(); saveZine(); }); }; im.src = rd.result; };
  rd.readAsDataURL(fl); e.target.value = '';
});
function feedAnim() {
  const d = $('#zine .desk'); if (!d || reduced()) return; const img = ($('#press-roll img') || {}).src || (zc && zc.toDataURL({ format: 'png', multiplier: 0.5 })) || '';
  const el = document.createElement('div'); el.className = 'feed'; el.innerHTML = `<i class="fp-body"></i><i class="fp-slot"></i><i class="fp-led"></i><span class="fp-paper"><img src="${img}" alt=""></span>`;
  d.appendChild(el); snd.printer(1400); setTimeout(() => el.classList.add('torn'), 1500); setTimeout(() => el.remove(), 2600);
}
/* ───────── the SIGNS page: the stories waiting to print, how they print, where they go, the stickers ───────── */
function viewSigns() {
  const ws = waiting(); const cur = pressStory(); const prn = [MASTER].filter(Boolean); const stks = stickersOf(cur);
  const cells = myCells().slice(0, 12), figs = strings.list().slice(0, 12), mine = S.signals.filter(x => !x.ex && !x.shared).slice(0, 12);
  return `<header class="ps-h"><i class="ps-sun" aria-hidden="true"></i><h2 class="b-head ps-t">PRINT SHOP</h2></header>`
    + `<section class="sec" id="sec-slips"><b class="b-head bk-t">STORIES WAITING TO PRINT</b>`
      + (ws.length ? `<ol class="slips-l">${ws.map(s => `<li><button type="button" class="slip-row${cur && cur.key === s.key ? ' on' : ''}" data-press="${esc(s.key)}"><b class="mono">${esc(s.code)}</b><span class="nm">${esc(NAME_UP(s))}</span><small class="mono">${esc(sentWord(s) || fmtStamp(s.at))}</small></button></li>`).join('')}</ol>` : '')
      + `</section>`
    + `<section class="sec" id="sec-style"><div class="seg" role="group" aria-label="Format">${Object.entries(FORMATS).map(([k, F]) => `<button type="button" class="sty" data-pfmt="${k}" aria-pressed="${PRESS.fmt === k}">${F.w}</button>`).join('')}</div>`
      + `<div class="seg" role="group" aria-label="Style">${STYLES.map(t => `<button type="button" class="sty${t.k === 'tty' ? ' tty-b' : ''}" data-style="${t.k}" aria-pressed="${styleNow() === t.k}">${t.ic ? icon(t.ic, 'sm') : ''}<span>${t.w}</span></button>`).join('')}</div>`
      + `<div class="seg outs" role="group" aria-label="Out">${[['print', 'print', 'PRINT'], ['send', 'receipt', 'NOVEL.GLOBAL'], ['png', 'download', 'PNG'], ['escpos', 'escpos', 'ESC/POS'], ['mesh', 'mesh', 'MESH']].map(([k, ic, w]) => `<button type="button" class="sty" data-pout="${k}">${icon(ic, 'sm')}<span>${w}</span></button>`).join('')}</div></section>`
    + (cells.length || figs.length || mine.length ? `<section class="sec" id="sec-pieces"><ol class="pieces">${mine.map(x => `<li><button type="button" class="pc-b" data-piece="s" data-pid="${esc(x.key)}" aria-label="On the page">${icon('receipt')}<small class="mono">${esc(x.code)}</small></button></li>`).join('')}${cells.map(o => `<li><button type="button" class="pc-b" data-piece="r" data-pid="${esc(String(o.id))}" aria-label="On the page"><img src="${pinOf(o)}" alt=""><small class="mono">${esc(nameOf(o).slice(0, 14))}</small></button></li>`).join('')}${figs.map(g => `<li><button type="button" class="pc-b" data-piece="c" data-pid="${esc(String(g.id))}" aria-label="On the page">${icon('string')}<small class="mono">${esc(g.name.slice(0, 14))}</small></button></li>`).join('')}</ol></section>` : '')
    + (stks.length ? `<section class="sec" id="sec-stickers"><ol class="stickers">${stks.map((st, i) => `<li><button type="button" class="stk" data-stk="${i}" aria-label="On the page"><img src="${sticker(st)}" alt=""></button></li>`).join('')}</ol></section>` : '')
    + `<section class="sec" id="sec-prn"><ol class="prn-l">${prn.map(p => { const st = PSTATE[p.id] || {}; return `<li class="${st.ready ? 'on' : ''}"><img class="pm" src="${printerImg(p, st)}" alt=""><span class="nm"><b>${esc(p.n)}</b><small class="mono">${st.ready ? 'ONLINE' : 'NOT YET ONLINE'}${st.printed ? ` · ${st.printed} PRINTED` : ''}${st.queued ? ` · ${st.queued} IN QUEUE` : ''}</small></span></li>`; }).join('')}</ol>`
      + `<div class="docs"><button type="button" data-doc="blank" data-tip="A blank W.I.S.H. slip to fill by hand">${icon('print')}<span>BLANK SLIP</span></button></div></section>`;
}
$('#view').addEventListener('click', e => {
  const ps = e.target.closest('[data-press]'); if (ps) { PRESS.story = ps.dataset.press; $$('#view [data-press]').forEach(b => b.classList.toggle('on', b === ps)); showZine(true); tick(1500); return; }
  const pf = e.target.closest('[data-pfmt]'); if (pf) { setFormat(pf.dataset.pfmt); return; }
  const po = e.target.closest('[data-pout]'); if (po) { pressOut(po.dataset.pout); return; }
  const sk = e.target.closest('[data-stk]'); if (sk) { placeOnPage(sk.querySelector('img').src, 'sticker', 74); tick(1500); return; }
  const pc = e.target.closest('[data-piece]'); if (pc) { pieceOn(pc.dataset.piece, pc.dataset.pid); tick(1500); }
});
