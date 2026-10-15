/* ════════════════════════════════════════════════════════════════════
   SIGNS — the press. A page laid out by hand, as a zine is: typewritten words, a headline, letters cut from elsewhere, a
   photograph run through the photocopier, stickers of the lives, tape, and the W.I.S.H. posters published from SIGNALS.
   Drawn with Fabric.js on a page of A5 or a receipt's 80 mm; kept on this device (da.zine.v1); exported as a picture, or
   printed. Built in the spirit of browser zine makers, written here
   ════════════════════════════════════════════════════════════════════ */
const ZPAGES = { a5: { w: 420, h: 595, w2: 'A5', css: 'A5' }, receipt: { w: 302, h: 760, w2: '80 MM', css: '80mm 200mm' } };
let zc = null, zPage = store.get('da.zine.v1', {}).page || 'a5';
const ZINE_PROPS = ['daKind'];
const saveZine = debounce(() => { if (zc) store.set('da.zine.v1', { page: zPage, json: zc.toJSON(ZINE_PROPS) }); }, 400);
const ZTOOLS = [['text', 'quote', 'Typewritten'], ['head', 'sign', 'A headline'], ['cut', 'remix', 'Cut-out letters'], ['image', 'camera', 'A photocopy'], ['sticker', 'fauna', 'A sticker'], ['tape', 'minus', 'Tape'],
  ['delete', 'close', 'Remove'], ['png', 'download', 'Save as a picture'], ['print', 'print', 'Print']];
function zineTools() {
  const t = $('#zine-tools'); if (t.childElementCount) return;
  t.innerHTML = `<input type="text" id="zine-words" maxlength="80" placeholder="words" aria-label="Words to place">` + ZTOOLS.map(([k, ic, tip]) => `<button type="button" class="bt" data-zt="${k}" aria-label="${tip}" data-tip="${tip}">${icon(ic)}</button>`).join('')
    + `<span class="zt-page">${Object.entries(ZPAGES).map(([k, p]) => `<button type="button" class="bt pg${k === zPage ? ' on' : ''}" data-zpage="${k}">${p.w2}</button>`).join('')}</span><input type="file" id="zine-file" accept="image/*" hidden>`;
}
async function showZine(on) {
  const host = $('#zine'); host.hidden = !on; if (!on) return null;
  zineTools(); const f = await loadFabric().catch(() => null); if (!f) return null;
  if (!zc) {
    const P = ZPAGES[zPage]; zc = new f.Canvas('zine-c', { width: P.w, height: P.h, backgroundColor: '#F4F1EA', preserveObjectStacking: true });
    const kept = store.get('da.zine.v1', null); if (kept && kept.json) await new Promise(r => zc.loadFromJSON(kept.json, r));
    zc.on('object:modified', saveZine); zc.on('text:changed', saveZine);
  }
  zc.renderAll(); return zc;
}
const words = () => ($('#zine-words').value || '').trim();
const rnd = (a, b) => a + Math.random() * (b - a);
/* letters cut from different pages: each its own face, size and paper */
function cutOut(f, text, x, y) {
  const faces = ['VT323, monospace', 'Poppins, sans-serif', '"IBM Plex Mono", monospace', 'Georgia, serif'];
  const papers = ['#FFFFFF', '#141412', '#E9E2CF', '#8C7469', '#F2E6A6'];
  let dx = 0; const parts = [];
  for (const ch of text) {
    if (ch === ' ') { dx += 12; continue; }
    const bg = papers[Math.floor(Math.random() * papers.length)]; const size = Math.round(rnd(22, 34));
    const t = new f.Text(ch.toUpperCase(), { left: dx, top: rnd(-4, 4), fontFamily: faces[Math.floor(Math.random() * faces.length)], fontSize: size, fontWeight: Math.random() < 0.5 ? 700 : 400, fill: bg === '#141412' || bg === '#8C7469' ? '#FFFFFF' : '#141412', backgroundColor: bg, angle: rnd(-6, 6), padding: 2 });
    parts.push(t); dx += t.width + 4;
  }
  return new f.Group(parts, { left: x, top: y, daKind: 'cut' });
}
/* a photocopy: grey, hard, a little blown out */
function photocopy(img) { const F = window.fabric.Image.filters; img.filters = [new F.Grayscale(), new F.Contrast({ contrast: 0.45 }), new F.Brightness({ brightness: 0.04 })]; img.applyFilters(); return img; }
/* a sticker of a life, drawn from the same marks as the map */
function sticker(g) { const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(80, 80, 76, 0, Math.PI * 2); x.fill(); M.glyph(x, g, 80, 80, 112, '#141412'); return c.toDataURL('image/png'); }
const STICK = ['bird', 'bee', 'frog', 'flyingfox', 'possum', 'plant', 'butterfly', 'lizard'];
let stickN = 0;
async function zineTool(k) {
  const c = await showZine(true); if (!c) return; const f = window.fabric; const W = c.getWidth(); const x = rnd(30, W * 0.4), y = rnd(30, c.getHeight() * 0.6);
  if (k === 'text') { const t = new f.Textbox(words() || 'typewritten words', { left: x, top: y, width: W * 0.55, fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fill: '#141412', daKind: 'text' }); c.add(t); c.setActiveObject(t); }
  if (k === 'head') { const t = new f.Textbox((words() || 'DIRECT ACTION').toUpperCase(), { left: 24, top: y, width: W - 48, fontFamily: 'VT323, monospace', fontSize: 56, lineHeight: 0.9, fill: '#141412', daKind: 'head' }); c.add(t); c.setActiveObject(t); }
  if (k === 'cut') { const g = cutOut(f, words() || 'WISH', x, y); c.add(g); c.setActiveObject(g); }
  if (k === 'image') { $('#zine-file').click(); return; }
  if (k === 'sticker') { const g = STICK[stickN++ % STICK.length]; f.Image.fromURL(sticker(g), im => { im.set({ left: x, top: y, angle: rnd(-12, 12), daKind: 'sticker' }); im.scaleToWidth(70); c.add(im); c.setActiveObject(im); c.renderAll(); saveZine(); }); return; }
  if (k === 'tape') { const r = new f.Rect({ left: x, top: y, width: 120, height: 28, fill: 'rgba(233,226,207,.78)', angle: rnd(-25, 25), daKind: 'tape' }); c.add(r); c.setActiveObject(r); }
  if (k === 'delete') { for (const o of c.getActiveObjects()) c.remove(o); c.discardActiveObject(); }
  if (k === 'png') { c.discardActiveObject(); c.renderAll(); const a = document.createElement('a'); a.href = c.toDataURL({ format: 'png', multiplier: 3 }); a.download = `sign-${isoDay(new Date())}.png`; a.click(); tick(1800); return; }
  if (k === 'print') { printZine(); return; }
  c.renderAll(); saveZine(); snd.tick(1500);
}
/* printed as it is laid out: the page as a picture, at its own paper size */
function printZine() {
  if (!zc) return; zc.discardActiveObject(); zc.renderAll(); const P = ZPAGES[zPage];
  const el = $('#p-slip'); el.innerHTML = `<img src="${zc.toDataURL({ format: 'png', multiplier: 3 })}" alt="" style="width:100%;display:block">`; el.className = 'slip print zine';
  let st = $('#page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); } st.textContent = `@page{size:${P.css};margin:0}`;
  snd.printer(900); window.print();
}
/* a poster published from SIGNALS, onto the page */
function placePoster(id) {
  const p = POSTERS.find(x => x.id === id); if (!p) return;
  showZine(true).then(c => { if (!c) return; window.fabric.Image.fromURL(p.png, im => { im.set({ left: 20, top: 20, daKind: 'poster' }); im.scaleToWidth(c.getWidth() - 40); c.add(im); c.setActiveObject(im); c.renderAll(); saveZine(); }); });
}
function setPage(k) {
  if (!ZPAGES[k] || !zc) return; zPage = k; const P = ZPAGES[k]; zc.setWidth(P.w); zc.setHeight(P.h); zc.renderAll(); saveZine();
  $$('#zine [data-zpage]').forEach(b => b.classList.toggle('on', b.dataset.zpage === k));
}
$('#zine').addEventListener('click', e => { const b = e.target.closest('[data-zt]'); if (b) { zineTool(b.dataset.zt); return; } const pg = e.target.closest('[data-zpage]'); if (pg) setPage(pg.dataset.zpage); });
$('#zine').addEventListener('change', e => {
  const fl = e.target.files && e.target.files[0]; if (!fl || e.target.id !== 'zine-file') return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = async () => { const k = Math.min(1, 1200 / Math.max(im.width, im.height)); const t = document.createElement('canvas'); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
    const c = await showZine(true); window.fabric.Image.fromURL(t.toDataURL('image/jpeg', 0.85), img => { photocopy(img); img.set({ left: 24, top: 24, angle: rnd(-3, 3), daKind: 'image' }); img.scaleToWidth(c.getWidth() * 0.7); c.add(img); c.setActiveObject(img); c.renderAll(); saveZine(); }); }; im.src = rd.result; };
  rd.readAsDataURL(fl); e.target.value = '';
});
$('#view').addEventListener('click', e => { const pp = e.target.closest('[data-poster]'); if (pp) { placePoster(pp.dataset.poster); tick(1500); } });
