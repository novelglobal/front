/* ════════════════════════════════════════════════════════════════════
   PRINT SHOP — the press. The receipt is the page: a story waiting to print is set on a strip of thermal paper (80 mm by
   default; 58 mm; a Game Boy print; or an A5 zine), and drawn on by hand: stickers of every life in any colour, packs of
   one's own, a pen, shapes, stamps, tape, cut-out letters, photocopies. What is on the strip is what prints: here, or
   at novel.global's printer as the printer's own raster. Each paper is kept on this device (da.press.<format>)
   ════════════════════════════════════════════════════════════════════ */
const FORMATS = { r80: { dots: 512, w: 320, ic: 'receipt', n: '80' }, r58: { dots: 384, w: 240, ic: 'receipt', n: '58' }, gb: { dots: 160, w: 160, levels: 4, ic: 'gb', n: '' }, zine: { w: 420, h: 595, ic: 'base', n: 'A5' } };
const PRESS = { story: null, fmt: 'r80' };   /* every visit opens on the 80 mm receipt */
const waiting = () => S.signals.filter(s => !s.ex && !s.shared && !/^PRINTED/.test(sentWord(s)));
const pressStory = () => S.signals.find(s => s.key === PRESS.story) || waiting()[0] || null;
let zc = null, zFmt = null;
const ZINE_PROPS = ['daKind', 'daStory', 'selectable', 'evented'];
const ZHIST = []; let zLast = '';
const zKey = () => 'da.press.' + PRESS.fmt;
const saveZine = debounce(() => { if (!zc) return; const json = zc.toJSON(ZINE_PROPS); const str = JSON.stringify(json); if (zLast && str !== zLast) { ZHIST.push(zLast); if (ZHIST.length > 40) ZHIST.shift(); } zLast = str; store.set(zKey(), { json, h: zc.getHeight() }); }, 300);
/* the tools: words, a headline, cut-out letters, a photocopy, a pen, shapes, a stamp, tape, ink, undo, remove. Icons only;
   their names come on a long hover */
const ZTOOLS = [['add', 'plus', 'Add'], ['text', 'quote', 'Typewritten'], ['head', 'sign', 'Headline'], ['cut', 'remix', 'Cut-out letters'], ['image', 'camera', 'Photocopy'], ['draw', 'trace', 'Pen'], ['shape', 'base', 'Shapes'], ['stamp', 'check', 'Stamp'], ['tape', 'minus', 'Tape'], ['undo', 'undo', 'Undo'], ['delete', 'close', 'Remove']];
const SWATCH = ['#141412', '#E0218A', '#FF7EB0', '#FF8A1F', '#FFD23F', '#7FD1C2', '#3FA7D6', '#6B4FC0', '#FFFFFF'];
let ZCOL = store.get('da.zcol', '#141412');
function zineTools() {
  const t = $('#zine-tools'); if (t.childElementCount) return;
  t.innerHTML = `<input type="text" id="zine-words" maxlength="80" aria-label="Words" data-tip="Words for the page">` + ZTOOLS.map(([k, ic, w]) => `<button type="button" class="bt zt" data-zt="${k}" aria-label="${w}" data-tip="${w}">${icon(ic)}</button>`).join('')
    + `<span class="swatches" role="group" aria-label="Ink">${SWATCH.map(c => `<button type="button" class="sw${c === ZCOL ? ' on' : ''}" data-ink="${c}" style="--c:${c}" aria-label="Ink ${c}"></button>`).join('')}<label class="sw pick" aria-label="Any ink" data-tip="Any ink"><input type="color" id="zine-col" value="${ZCOL}"></label></span>`
    + '<input type="file" id="zine-file" accept="image/*" hidden>';
  $('#zine-label').textContent = 'PRINT SHOP · MODEL DA-04 · THERMAL 80 MM / 58 MM · A5 · RUNS ON WHAT IS LEFT OVER · HEAT-SENSITIVE PAPER: KEEP FROM SUN · PRINT WHAT YOU WILL DO';
}
/* the paper on the desk: the story set on it as it prints, and whatever is drawn over it */
async function showZine(on) {
  const host = $('#zine'); host.hidden = !on; if (!on) return null;
  zineTools(); const f = await loadFabric().catch(() => null); if (!f) return null;
  const F = FORMATS[PRESS.fmt]; host.dataset.fmt = PRESS.fmt;
  if (!zc) { zc = new f.Canvas('zine-c', { width: F.w, height: F.h || 520, backgroundColor: '#FFFFFF', preserveObjectStacking: true }); zc.on('object:modified', saveZine); zc.on('text:changed', saveZine); zc.on('path:created', e => { if (e.path) e.path.set('daKind', 'pen'); saveZine(); }); }
  if (zFmt !== PRESS.fmt) {
    zFmt = PRESS.fmt; zc.clear(); zc.setBackgroundColor(PRESS.fmt === 'zine' ? '#F4F1EA' : '#FFFFFF', () => {}); ZHIST.length = 0;
    const kept = store.get(zKey(), null); zc.setWidth(F.w); zc.setHeight((kept && kept.h) || F.h || 520);
    if (kept && kept.json) { zLast = JSON.stringify(kept.json); await new Promise(r => zc.loadFromJSON(kept.json, r)); zc.setBackgroundColor(PRESS.fmt === 'zine' ? '#F4F1EA' : '#FFFFFF', () => {}); } else zLast = '';
  }
  if (PRESS.fmt !== 'zine') await setBase(false);
  zc.renderAll(); return zc;
}
/* the story, as the printer's head draws it, at the head of the strip; set again when the story or its style changes */
let baseN = 0;
async function setBase(force) {
  const s = pressStory(); const F = FORMATS[PRESS.fmt]; if (!zc || PRESS.fmt === 'zine') return;
  const was = zc.getObjects().find(o => o.daKind === 'base'); const style = `${isTty()}${isConn()}`;
  if (!s) { if (was) zc.remove(was); return; }
  if (was && !force && was.daStory === `${s.key}|${style}`) return;
  const my = ++baseN; const cvs = await slipCanvas(s, F.dots - (F.dots % 8), F.levels || 2, isTty(), isConn()).catch(() => null); if (!cvs || my !== baseN) return;
  await new Promise(res => window.fabric.Image.fromURL(cvs.toDataURL('image/png'), im => {
    const old = zc.getObjects().find(o => o.daKind === 'base'); if (old) zc.remove(old);
    im.set({ left: 0, top: 0, selectable: false, evented: false, daKind: 'base', daStory: `${s.key}|${style}` }); im.scaleToWidth(F.w);
    zc.add(im); zc.sendToBack(im); const need = Math.ceil(im.getScaledHeight()) + 160; if (zc.getHeight() < need) zc.setHeight(need); zc.renderAll(); saveZine(); res();
  }));
}
const words = () => ($('#zine-words').value || '').trim();
const rnd = (a, b) => a + Math.random() * (b - a);
function cutOut(f, text, x, y) {
  const faces = ['VT323, monospace', 'Poppins, sans-serif', '"IBM Plex Mono", monospace', 'Georgia, serif']; const papers = ['#FFFFFF', '#141412', '#FFD23F', '#FF7EB0', '#7FD1C2'];
  let dx = 0; const parts = [];
  for (const ch of text) { if (ch === ' ') { dx += 12; continue; } const bg = papers[Math.floor(Math.random() * papers.length)];
    const t = new f.Text(ch.toUpperCase(), { left: dx, top: rnd(-4, 4), fontFamily: faces[Math.floor(Math.random() * faces.length)], fontSize: Math.round(rnd(22, 34)), fontWeight: Math.random() < 0.5 ? 700 : 400, fill: bg === '#141412' ? '#FFFFFF' : '#141412', backgroundColor: bg, angle: rnd(-6, 6), padding: 2 });
    parts.push(t); dx += t.width + 4; }
  return new f.Group(parts, { left: x, top: y, daKind: 'cut' });
}
function photocopy(img) { const F = window.fabric.Image.filters; img.filters = [new F.Grayscale(), new F.Contrast({ contrast: 0.45 }), new F.Brightness({ brightness: 0.04 })]; img.applyFilters(); return img; }
/* a sticker, die-cut: the mark in the ink chosen, a white edge, a little shadow */
const STK = new Map();
function sticker(st) {
  const key = `${st.g || st.i}|${st.col}`; if (STK.has(key)) return STK.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 180; const x = c.getContext('2d'); const draw = (col, dx = 0, dy = 0) => (st.g ? M.glyph(x, st.g, 90 + dx, 90 + dy, 110, col) : M.icon(x, st.i, 90 + dx, 90 + dy, 104, col));
  x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.shadowOffsetY = 3; for (let a = 0; a < 16; a++) draw('#FFFFFF', Math.cos(a / 16 * Math.PI * 2) * 9, Math.sin(a / 16 * Math.PI * 2) * 9); x.restore();
  for (let a = 0; a < 16; a++) draw('#FFFFFF', Math.cos(a / 16 * Math.PI * 2) * 7, Math.sin(a / 16 * Math.PI * 2) * 7);
  draw(st.col || '#141412'); const url = c.toDataURL('image/png'); if (STK.size > 300) STK.clear(); STK.set(key, url); return url;
}
/* every sticker there is: each kind of life, and the marks of the places, the weather and the press */
const STICK_ALL = [...Object.keys(M.KINDS).filter(g => g !== 'paw').map(g => ({ g })), ...['heat', 'rain', 'water', 'day', 'night', 'shade', 'refuge', 'plant', 'people', 'hug', 'give', 'harm', 'radar', 'receipt', 'string', 'mesh', 'note', 'sign'].map(i => ({ i }))];
/* packs of one's own: pictures made into stickers, kept on this device */
const PACKS = store.get('da.stk.v1', []);
function addPack(files) {
  return Promise.all([...files].slice(0, 24).map(fl => new Promise(res => { const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 256 / Math.max(im.width, im.height)); const t = document.createElement('canvas'); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height); res(t.toDataURL('image/png')); }; im.onerror = () => res(null); im.src = rd.result; }; rd.readAsDataURL(fl); })))
    .then(urls => { for (const u of urls.filter(Boolean)) PACKS.unshift(u); PACKS.splice(48); while (!store.set('da.stk.v1', PACKS) && PACKS.length) PACKS.pop(); });
}
async function zineTool(k) {
  const c = await showZine(true); if (!c) return; const f = window.fabric; const W = c.getWidth(); const x = rnd(16, W * 0.45), y = rnd(30, c.getHeight() * 0.7);
  if (k === 'text') { const t = new f.Textbox(words() || '…', { left: x, top: y, width: W * 0.6, fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fill: ZCOL, daKind: 'text' }); c.add(t); c.setActiveObject(t); }
  if (k === 'head') { const t = new f.Textbox((words() || '★').toUpperCase(), { left: 12, top: y, width: W - 24, fontFamily: 'VT323, monospace', fontSize: Math.round(W / 7.5), lineHeight: 0.9, fill: ZCOL, daKind: 'head' }); c.add(t); c.setActiveObject(t); }
  if (k === 'cut') { const g = cutOut(f, words() || 'WISH', x, y); c.add(g); c.setActiveObject(g); }
  if (k === 'image') { $('#zine-file').click(); return; }
  if (k === 'add') { pickMenu($('#zine [data-zt="add"]'), addables(false), it => pieceOn(it.k, it.id)); return; }
  if (k === 'tape') { const r = new f.Rect({ left: x, top: y, width: W * 0.38, height: 26, fill: 'rgba(255,210,63,.55)', angle: rnd(-25, 25), daKind: 'tape' }); c.add(r); c.setActiveObject(r); }
  if (k === 'delete') { for (const o of c.getActiveObjects()) if (o.daKind !== 'base') c.remove(o); c.discardActiveObject(); }
  if (k === 'draw') { c.isDrawingMode = !c.isDrawingMode; c.freeDrawingBrush.color = ZCOL; c.freeDrawingBrush.width = 3; $('#zine [data-zt="draw"]').classList.toggle('on', c.isDrawingMode); return; }
  if (k === 'shape') { const n = (zineTool.n = ((zineTool.n || 0) + 1) % 4); let o;
    if (n === 1) o = new f.Circle({ left: x, top: y, radius: 30, fill: ZCOL, daKind: 'shape' });
    if (n === 2) { const pts = []; for (let i = 0; i < 24; i++) { const r = i % 2 ? 20 : 40; const a = i / 24 * Math.PI * 2; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); } o = new f.Polygon(pts, { left: x, top: y, fill: ZCOL, daKind: 'shape' }); }
    if (n === 3) o = new f.Path('M0 10 L60 10 L60 0 L84 18 L60 36 L60 26 L0 26 Z', { left: x, top: y, fill: ZCOL, angle: rnd(-20, 20), daKind: 'shape' });
    if (n === 0) o = new f.Rect({ left: x, top: y, width: W * 0.4, height: 60, fill: 'transparent', stroke: ZCOL, strokeWidth: 3, daKind: 'shape' });
    c.add(o); c.setActiveObject(o); }
  if (k === 'stamp') { const t = new f.Text((words() || '✓').toUpperCase(), { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, fontSize: 22, fill: ZCOL, opacity: 0.82, padding: 8 });
    const r = new f.Rect({ width: t.width + 22, height: t.height + 16, left: -11, top: -8, fill: 'transparent', stroke: ZCOL, strokeWidth: 3, rx: 4, ry: 4, opacity: 0.82 });
    const g = new f.Group([r, t], { left: x, top: y, angle: rnd(-9, 9), daKind: 'stamp' }); c.add(g); c.setActiveObject(g); }
  if (k === 'undo') { if (!ZHIST.length) { tick(600); return; } const prev = ZHIST.pop(); zLast = prev; await new Promise(r => c.loadFromJSON(JSON.parse(prev), r)); c.renderAll(); store.set(zKey(), { json: JSON.parse(prev), h: c.getHeight() }); snd.tick(1100); return; }
  c.renderAll(); saveZine(); snd.tick(1500); buzz(4);
}
function setInk(col) {
  ZCOL = col; store.set('da.zcol', ZCOL); $$('#zine .sw[data-ink]').forEach(b => b.classList.toggle('on', b.dataset.ink === col)); const pk = $('#zine-col'); if (pk) pk.value = col;
  if (zc) { zc.freeDrawingBrush.color = ZCOL; for (const o of zc.getActiveObjects()) { if (o.daKind === 'base') continue; if (o.type === 'path' && !o.fill) o.set('stroke', ZCOL); else if (o.type === 'group') o.getObjects().forEach(x => (x.type === 'rect' ? x.set('stroke', ZCOL) : x.set('fill', ZCOL))); else if (o.stroke && o.fill === 'transparent') o.set('stroke', ZCOL); else if (o.type !== 'image') o.set('fill', ZCOL); } zc.renderAll(); saveZine(); }
  if (S.view === 2) $$('#view .stk[data-stk]').forEach(b => { const st = STICK_ALL[+b.dataset.stk]; if (st) b.querySelector('img').src = sticker({ ...st, col: ZCOL }); });
}
$('#zine').addEventListener('input', e => { if (e.target.id === 'zine-col') setInk(e.target.value); });
async function placeOnPage(url, kind, width) {
  const c = await showZine(true); if (!c) return;
  window.fabric.Image.fromURL(url, im => { im.set({ left: rnd(10, c.getWidth() * 0.5), top: rnd(20, c.getHeight() * 0.7), angle: kind === 'sticker' ? rnd(-12, 12) : 0, daKind: kind }); im.scaleToWidth(Math.min(width, c.getWidth() * 0.6)); c.add(im); c.setActiveObject(im); c.renderAll(); saveZine(); snd.tick(1700); buzz(4); });
}
function cellSticker(o) {
  return new Promise(res => { const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d');
    const done = () => res(c.toDataURL('image/png')); x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.beginPath(); x.arc(100, 100, 92, 0, Math.PI * 2); x.fillStyle = '#FFFFFF'; x.fill(); x.restore();
    if (o.photo) { const im = new Image(); im.onload = () => { x.save(); x.beginPath(); x.arc(100, 100, 82, 0, Math.PI * 2); x.clip(); const k = Math.max(164 / im.width, 164 / im.height); x.drawImage(im, 100 - im.width * k / 2, 100 - im.height * k / 2, im.width * k, im.height * k); x.restore(); done(); }; im.onerror = done; im.src = o.photo; }
    else { M.glyph(x, glyphOf(o) || 'paw', 100, 100, 110, '#141412'); done(); } });
}
function speciesSticker(sp) {
  return new Promise(res => { const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d'); const done = () => res(c.toDataURL('image/png'));
    x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.beginPath(); x.arc(100, 100, 92, 0, Math.PI * 2); x.fillStyle = '#FFFFFF'; x.fill(); x.restore();
    const glyph = () => { M.glyph(x, sp.g || 'paw', 100, 100, 110, '#141412'); done(); };
    if (!sp.ph) { glyph(); return; }
    loadImage(sp.ph, true).then(im => { x.save(); x.beginPath(); x.arc(100, 100, 82, 0, Math.PI * 2); x.clip(); const k = Math.max(164 / im.width, 164 / im.height); x.drawImage(im, 100 - im.width * k / 2, 100 - im.height * k / 2, im.width * k, im.height * k); x.restore(); done(); }).catch(glyph); });
}
const figChart = g => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" rx="10" fill="#fff"/><g transform="translate(10 10)">${strings.chartOf(g.id, 160)}</g></svg>`)}`;
async function pieceOn(kind, id) {
  if (kind === 's') { const x = S.signals.find(v => v.key === id); if (!x) return; if (PRESS.fmt !== 'zine') { PRESS.story = id; await setBase(true); refreshPanel(); return; } const cvs = await slipCanvas(x, 384, 2, isTty(), isConn()); placeOnPage(cvs.toDataURL('image/png'), 'story', 150); }
  if (kind === 'r') { const o = myCells().find(v => String(v.id) === String(id)); if (o) placeOnPage(await cellSticker(o), 'sticker', 86); }
  if (kind === 'c') { const g = strings.list().find(v => String(v.id) === String(id)); if (g) placeOnPage(figChart(g), 'chart', 120); }
  if (kind === 'l') { const sp = SPECIES.find(v => v.id === String(id)); if (sp) placeOnPage(await speciesSticker(sp), 'sticker', 90); }
}
function setFormat(k) { if (!FORMATS[k]) return; PRESS.fmt = k; $$('#view [data-pfmt]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pfmt === k))); showZine(true); tick(1500); buzz(4); }
/* a print sent: a small clear printer, hand-drawn, the paper feeding out, then torn; no words */
function feedAnim(url) {
  const d = $('#zine .desk'); if (!d || reduced()) return;
  const el = document.createElement('div'); el.className = 'feed'; el.innerHTML = `<i class="fp-body"></i><i class="fp-slot"></i><i class="fp-led"></i><span class="fp-paper"><img src="${url}" alt=""></span>`;
  d.appendChild(el); snd.printer(1400); setTimeout(() => el.classList.add('torn'), 1500); setTimeout(() => el.remove(), 2600);
}
const POSTERS2 = store.get('da.posters2.v1', []);
async function savePoster() {
  const out = await stripOut(); if (!out) return; const s = pressStory(); const im = await loadImage(out.url, false);
  const k = Math.min(1, 360 / im.width); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
  const where = s && s.pin ? { lat: +s.pin.lat, lng: +s.pin.lng } : { lat: S.scan.lat, lng: S.scan.lng };
  POSTERS2.unshift({ id: uid('p'), at: Date.now(), img: c.toDataURL('image/jpeg', 0.8), ...where }); POSTERS2.splice(12);
  while (!store.set('da.posters2.v1', POSTERS2) && POSTERS2.length > 1) POSTERS2.pop();
  snd.tear(); buzz([10, 40, 10]); toast('✓'); life.redraw(); return POSTERS2[0];
}
/* a receipt printed, proved: a photograph of it held up, taken while novel.global's printer is online */
const PROOFS = store.get('da.proofs.v1', []);
async function takeProof(file) {
  await loadPartners(); const st = MASTER ? PSTATE[MASTER.id] || {} : {};
  if (!st.ready) { const t = document.querySelector('[data-check="4"]'); if (t) { t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope'); } snd.tick(500); buzz([30, 40, 30]); return false; }
  const url = await new Promise(res => { const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 640 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; im.onerror = () => res(''); im.src = rd.result; }; rd.readAsDataURL(file); });
  if (!url) return false; PROOFS.unshift({ at: Date.now(), img: url, printer: MASTER ? MASTER.id : '' }); PROOFS.splice(6); while (!store.set('da.proofs.v1', PROOFS) && PROOFS.length > 1) PROOFS.pop();
  tie(2); snd.tear(); buzz([10, 40, 10]); refreshPanel(); return true;
}
/* what is on the strip, as the printer's head will lay it down */
async function stripOut() { if (!zc) return null; zc.discardActiveObject(); zc.renderAll(); const F = FORMATS[PRESS.fmt]; const url = zc.toDataURL({ format: 'png', multiplier: F.dots ? F.dots / F.w : 3 }); return { url, F }; }
async function pressOut(k) {
  const s = pressStory(); const out = await stripOut(); if (!out) return; const { url, F } = out;
  if (k === 'print' || k === 'send') feedAnim(url);
  if (k === 'print') {
    const el = $('#p-slip'); el.innerHTML = `<img src="${url}" alt="" style="width:100%;display:block">`; el.className = 'slip print zine';
    let st = $('#page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); }
    st.textContent = PRESS.fmt === 'zine' ? '@page{size:A5;margin:0}' : `@page{size:${F.n === '58' ? 58 : 80}mm ${Math.ceil(zc.getHeight() / F.w * (F.n === '58' ? 58 : 80)) + 6}mm;margin:0}`;
    tie(2); setTimeout(() => window.print(), 300); return;
  }
  if (k === 'poster') { await savePoster(); return; }
  if (k === 'png') { const a = document.createElement('a'); a.href = url; a.download = `${s ? s.code : 'sign'}-${PRESS.fmt}.png`; a.click(); tick(1800); return; }
  if (!s) { tick(600); return; }
  /* the printer's own bytes: the strip as drawn, in two inks, banded as the TM-T88 takes it, then a cut */
  const bytesOf = async () => { const dots = (F.dots || 512) - ((F.dots || 512) % 8); const h = Math.round(zc.getHeight() * dots / zc.getWidth()); const cv = await bwCanvas(url, dots, h, 2); return new Uint8Array([0x1B, 0x40, ...rasterOf(cv), 0x0A, 0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00]); };
  if (k === 'escpos') { download(`${s.code}.bin`, new Blob([await bytesOf()], { type: 'application/octet-stream' })); tick(1800); return; }
  if (k === 'mesh') { const t = meshText(s); const ok = await copyText(t); toast(ok ? `${bytes(t)} B` : t.slice(0, 60)); return; }
  if (k === 'send') { try { const v = await directAction(s, MASTER ? MASTER.id : '', PRESS.fmt === 'zine' ? null : await bytesOf()); tie(2); snd.tear(); toast(v.status === 'outbox' ? '…' : '✓'); refreshPanel(); } catch (e) { toast('✕'); } }
}
$('#zine').addEventListener('click', e => { const b = e.target.closest('[data-zt]'); if (b) { zineTool(b.dataset.zt); return; } const ink = e.target.closest('[data-ink]'); if (ink) { setInk(ink.dataset.ink); snd.tick(1300); } });
$('#zine').addEventListener('change', e => {
  const fl = e.target.files && e.target.files[0]; if (!fl || e.target.id !== 'zine-file') return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = async () => { const k = Math.min(1, 1200 / Math.max(im.width, im.height)); const t = document.createElement('canvas'); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
    const c = await showZine(true); window.fabric.Image.fromURL(t.toDataURL('image/jpeg', 0.85), img => { photocopy(img); img.set({ left: 10, top: 40, angle: rnd(-3, 3), daKind: 'image' }); img.scaleToWidth(c.getWidth() * 0.8); c.add(img); c.setActiveObject(img); c.renderAll(); saveZine(); }); }; im.src = rd.result; };
  rd.readAsDataURL(fl); e.target.value = '';
});
/* each reading's small strip, drawn from the story itself */
const THUMBS = new Map();
async function fillThumbs() {
  const s = pressStory(); for (const img of $$('#view img[data-thumb]')) {
    const st = img.dataset.thumb; if (!s) { img.replaceWith(Object.assign(document.createElement('i'), { innerHTML: icon(st === 'conn' ? 'string' : st === 'tty' ? 'trace' : 'note') })); continue; }
    const key = `${s.key}|${st}`; if (!THUMBS.has(key)) { const cv = await slipCanvas(s, 96, 2, st === 'tty', st === 'conn').catch(() => null); if (!cv) continue; THUMBS.set(key, cv.toDataURL('image/png')); if (THUMBS.size > 60) THUMBS.delete(THUMBS.keys().next().value); }
    if (img.isConnected) img.src = THUMBS.get(key);
  }
}
/* ───────── the PRINT SHOP page: no words. A printer; the stories waiting; the paper; how it reads; where it goes; what to
   put on it ───────── */
const PFMT_ICON = k => (k === 'gb' ? `${icon('gb')}` : k === 'zine' ? `${icon('base')}<b class="mono">A5</b>` : `${icon('receipt')}<b class="mono">${FORMATS[k].n}</b>`);
function viewSigns() {
  const ws = waiting(); const cur = pressStory(); const st = MASTER ? PSTATE[MASTER.id] || {} : {};
  const cells = myCells().slice(0, 12), figs = strings.list().slice(0, 12);
  return `<header class="ps-h" data-tip="Print shop"><span class="ps-printer${st.ready ? ' on' : ''}"><img src="${printerImg(MASTER || {}, st)}" alt=""><i class="ps-led"></i></span><i class="ps-sun" aria-hidden="true"></i></header>`
    + `<section class="sec lcd" id="sec-slips" data-tip="Stories waiting to print"><i class="lcd-ic">${icon('receipt')}<b class="mono">${ws.length}</b></i>`
      + (ws.length ? `<ol class="slips-l">${ws.map(s => `<li><button type="button" class="slip-row${cur && cur.key === s.key ? ' on' : ''}" data-press="${esc(s.key)}"><b class="mono">${esc(s.code)}</b><span class="nm">${esc(NAME_UP(s))}</span><i class="st-dot ${/QUEUE|PRINTING/.test(sentWord(s)) ? 'q' : /WAITING|SENDING/.test(sentWord(s)) ? 'w' : ''}"></i></button></li>`).join('')}</ol>` : '')
      + `</section>`
    + `<section class="sec" id="sec-style"><div class="seg keys" role="group" aria-label="Paper">${Object.keys(FORMATS).map(k => `<button type="button" class="key" data-pfmt="${k}" aria-pressed="${PRESS.fmt === k}" data-tip="${k === 'zine' ? 'A5 zine' : k === 'gb' ? 'Game Boy' : `${FORMATS[k].n} mm receipt`}">${PFMT_ICON(k)}</button>`).join('')}</div>`
      + `<div class="seg keys thumbs" role="group" aria-label="How it reads">${STYLES.map(t => `<button type="button" class="key thumb-k" data-style="${t.k}" aria-pressed="${styleNow() === t.k}" data-tip="${t.k === 'paper' ? 'Archive slip: the photograph, the record, the relations' : t.k === 'tty' ? 'Terminal: the photograph and the four lines' : 'Connection: a group near the life to join, and the next step'}"><img class="thumb" data-thumb="${t.k}" alt=""></button>`).join('')}</div>`
      + `<div class="seg keys outs" role="group" aria-label="Out">${[['print', 'print', 'Print here'], ['send', 'radar', 'To novel.global'], ['poster', 'stories', 'Keep as a poster'], ['png', 'download', 'Picture'], ['escpos', 'escpos', 'Printer bytes'], ['mesh', 'mesh', 'Mesh line']].map(([k, ic, w]) => `<button type="button" class="key" data-pout="${k}" data-tip="${w}">${icon(ic)}</button>`).join('')}</div></section>`
    + (cells.length || figs.length ? `<section class="sec" id="sec-pieces"><ol class="pieces">${cells.map(o => `<li><button type="button" class="pc-b" data-piece="r" data-pid="${esc(String(o.id))}" data-tip="${esc(nameOf(o))}"><img src="${pinOf(o)}" alt=""></button></li>`).join('')}${figs.map(g => `<li><button type="button" class="pc-b" data-piece="c" data-pid="${esc(String(g.id))}" data-tip="${esc(g.name)}">${icon('string')}</button></li>`).join('')}</ol></section>` : '')
    + `<section class="sec" id="sec-stickers"><ol class="stickers">${PACKS.map((u, i) => `<li><button type="button" class="stk own" data-pack="${i}" aria-label="Sticker"><img src="${u}" alt=""></button></li>`).join('')}${STICK_ALL.map((st, i) => `<li><button type="button" class="stk" data-stk="${i}" aria-label="Sticker" data-tip="${esc(st.g ? M.KINDS[st.g] || st.g : st.i)}"><img src="${sticker({ ...st, col: ZCOL })}" alt="" loading="lazy"></button></li>`).join('')}<li><label class="stk add" data-tip="Stickers of your own">${icon('plus')}<input type="file" id="pack-in" accept="image/*" multiple hidden></label></li></ol></section>`
    + `<section class="sec" id="sec-prn"><div class="docs"><button type="button" data-doc="blank" data-tip="A blank W.I.S.H. slip to fill by hand">${icon('print')}</button></div></section>`;
}
$('#view').addEventListener('click', e => {
  const ps = e.target.closest('[data-press]'); if (ps) { PRESS.story = ps.dataset.press; $$('#view [data-press]').forEach(b => b.classList.toggle('on', b === ps)); if (PRESS.fmt === 'zine') setFormat('r80'); else setBase(true); tick(1500); return; }
  const pf = e.target.closest('[data-pfmt]'); if (pf) { setFormat(pf.dataset.pfmt); return; }
  const po = e.target.closest('[data-pout]'); if (po) { pressOut(po.dataset.pout); return; }
  const sk = e.target.closest('[data-stk]'); if (sk) { const st = STICK_ALL[+sk.dataset.stk]; placeOnPage(sticker({ ...st, col: ZCOL }), 'sticker', 70); return; }
  const pk = e.target.closest('[data-pack]'); if (pk) { placeOnPage(PACKS[+pk.dataset.pack], 'sticker', 80); return; }
  const pc = e.target.closest('[data-piece]'); if (pc) { pieceOn(pc.dataset.piece, pc.dataset.pid); tick(1500); }
});
$('#view').addEventListener('change', async e => { if (e.target.id === 'proof-in') { const fl = e.target.files && e.target.files[0]; if (fl) await takeProof(fl); e.target.value = ''; return; } if (e.target.id !== 'pack-in') return; await addPack(e.target.files); e.target.value = ''; refreshPanel(); snd.tick(1900); });
