/* ════════════════════════════════════════════════════════════════════
   PRINT SHOP — the press. The receipt is the page: a story waiting to print is set on a strip of thermal paper (80 mm by
   default; 58 mm; a Game Boy print; or an A5 zine), and drawn on by hand: stickers of every life in any colour, packs of
   one's own, a pen, shapes, stamps, tape, cut-out letters, photocopies. What is on the strip is what prints: here, or
   at novel.global's printer as the printer's own raster. Each paper is kept on this device (da.press.<format>)
   ════════════════════════════════════════════════════════════════════ */
const FORMATS = { r80: { dots: 512, w: 320, ic: 'receipt', n: '80' }, r58: { dots: 384, w: 240, ic: 'receipt', n: '58' }, gb: { dots: 160, w: 160, levels: 4, ic: 'gb', n: '' }, zine: { w: 420, h: 595, ic: 'base', n: 'A5' } };
const PRESS = { story: null, fmt: 'r80', pack: 'life', zl: 1 };   /* every visit opens on the 80 mm receipt */
const waiting = () => S.signals.filter(s => !s.ex && !s.shared && !/^PRINTED/.test(sentWord(s)));
const pressStory = () => S.signals.find(s => s.key === PRESS.story) || waiting()[0] || null;
let zc = null, zFmt = null;
const ZINE_PROPS = ['daKind', 'daStory', 'selectable', 'evented'];
const ZHIST = []; let zLast = '';
const zKey = () => 'da.press.' + PRESS.fmt;
const saveZine = debounce(() => { if (!zc) return; const json = zc.toJSON(ZINE_PROPS); const str = JSON.stringify(json); if (zLast && str !== zLast) { ZHIST.push(zLast); if (ZHIST.length > 40) ZHIST.shift(); } zLast = str; store.set(zKey(), { json, h: zc.getHeight() }); }, 300);
/* the tools: words, a headline, cut-out letters, a photocopy, a pen, shapes, a stamp, tape, ink, undo, remove. Icons only;
   their names come on a long hover */
const ZTOOLS = [['add', 'plus', 'Add'], ['text', 'quote', 'Words: again for another face'], ['head', 'sign', 'Headline: again for another face'], ['cut', 'remix', 'Cut-out letters'], ['image', 'camera', 'Photocopy'], ['draw', 'pencil', 'Pen'], ['shape', 'base', 'Shapes: again for another'], ['stamp', 'check', 'Stamp'], ['tape', 'minus', 'Tape: again for bandana, wire'], ['rag', 'base', 'Bandana: again to turn it'], ['undo', 'undo', 'Undo'], ['delete', 'close', 'Remove'], ['zoom', 'search', 'Closer: again for closer, then back']];
const SWATCH = ['#0C0E0E', '#FFFFFF', '#A9F0EC', '#FF5A1F', '#E6F84A', '#7FB8D6', '#B9A58C', '#8A1C1C'];
let ZCOL = store.get('da.zcol', '#0C0E0E');
/* the faces, turned round on the words keys: typewriter, a flourished serif, blackletter, a spray can, bubbles, the terminal */
const FACES = [{ f: '"IBM Plex Mono", monospace', k: 1 }, { f: '"Playfair Display", serif', st: 'italic', k: 1.5 }, { f: 'UnifrakturMaguntia, serif', k: 1.6 }, { f: '"Sedgwick Ave Display", cursive', k: 1.7 }, { f: '"Rubik Bubbles", sans-serif', k: 1.4 }, { f: 'VT323, monospace', k: 1.5 }];
let ZFACE = 0;
const faceCSS = (fc, px = 40) => `${fc.st || 'normal'} 400 ${px}px ${fc.f}`;
const faceReady = fc => (document.fonts ? document.fonts.load(faceCSS(fc)).catch(() => null) : Promise.resolve());
/* tape, turned round on its key: paper tape, a strip of bandana, barbed wire */
const TAPES = ['tape', 'rag', 'barb']; let ZTAPE = 0; let RAGINV = false;
function zineTools() {
  const t = $('#zine-tools'); if (t.childElementCount) return;
  t.innerHTML = `<input type="text" id="zine-words" maxlength="80" aria-label="Words" data-tip="Words for the page">` + ZTOOLS.map(([k, ic, w]) => `<button type="button" class="bt zt" data-zt="${k}" aria-label="${w}" data-tip="${w}">${keyFace(k) || icon(ic)}</button>`).join('')
    + `<span class="swatches" role="group" aria-label="Ink">${SWATCH.map(c => `<button type="button" class="sw${c === ZCOL ? ' on' : ''}" data-ink="${c}" style="--c:${c}" aria-label="Ink ${c}"></button>`).join('')}<label class="sw pick" aria-label="Any ink" data-tip="Any ink"><input type="color" id="zine-col" value="${ZCOL}"></label></span>`
    + '<input type="file" id="zine-file" accept="image/*" hidden>';
  $('#zine-label').textContent = 'PRINT SHOP · MODEL DA-04 · THERMAL 80 MM / 58 MM · A5 · RUNS ON WHAT IS LEFT OVER · HEAT-SENSITIVE PAPER: KEEP FROM SUN · PRINT WHAT YOU WILL DO';
}
/* what a key shows: the words keys in the face they will set, tape as the tape it lays, the bandana as itself */
function keyFace(k) {
  if (k === 'text' || k === 'head') { const fc = FACES[ZFACE]; return `<b class="aa${k === 'head' ? ' big' : ''}" style="font-family:${fc.f.replace(/"/g, "'")};font-style:${fc.st || 'normal'}">Aa</b>`; }
  if (k === 'tape') return `<i class="tp tp-${TAPES[ZTAPE]}" style="${TAPES[ZTAPE] === 'rag' ? `background-image:url(${ragURL(false)})` : TAPES[ZTAPE] === 'barb' ? `background-image:url(${barbURL('#E6EEF0')})` : ''}"></i>`;
  if (k === 'rag') return `<i class="rg" style="background-image:url(${ragURL(RAGINV)})"></i>`;
  if (k === 'zoom') return `<span class="zl">${icon('search')}<i class="zl-d">${[0, 1, 2].map(i => `<b${i <= PRESS.zl ? ' class="on"' : ''}></b>`).join('')}</i></span>`;
  return '';
}
const refaceKey = k => { const b = $(`#zine [data-zt="${k}"]`); if (b) b.innerHTML = keyFace(k); };
/* a bandana, black and white: a border of dots and scallops, paisley turned four ways about a medallion, flowers between */
const RAGS = new Map(); const TURN = Math.PI * 2;
function bandana(size, inv) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); const ink = inv ? '#F4F2EA' : '#0C0E0E', paper = inv ? '#0C0E0E' : '#F4F2EA';
  x.fillStyle = paper; x.fillRect(0, 0, size, size); x.fillStyle = ink; x.strokeStyle = ink; const s = size / 200;
  const paisley = (cx, cy, r, a) => { x.save(); x.translate(cx, cy); x.rotate(a); x.beginPath(); x.moveTo(0, r); x.bezierCurveTo(-r * 1.25, r * 0.55, -r * 0.95, -r * 1.15, 0, -r * 0.95); x.bezierCurveTo(r * 0.75, -r * 0.8, r * 1.05, -r * 0.1, r * 0.45, r * 0.25); x.bezierCurveTo(r * 0.15, r * 0.45, r * 0.55, r * 1.1, 0, r); x.fill();
    x.fillStyle = paper; x.beginPath(); x.arc(-r * 0.15, -r * 0.2, r * 0.42, 0, TURN); x.fill(); x.fillStyle = ink; x.beginPath(); x.arc(-r * 0.15, -r * 0.2, r * 0.2, 0, TURN); x.fill();
    for (let i = 0; i < 7; i++) { const t = i / 7 * TURN; x.beginPath(); x.arc(-r * 0.15 + Math.cos(t) * r * 0.32, -r * 0.2 + Math.sin(t) * r * 0.32, r * 0.05, 0, TURN); x.fillStyle = paper; x.fill(); } x.fillStyle = ink; x.restore(); };
  const flower = (cx, cy, r) => { for (let i = 0; i < 6; i++) { const t = i / 6 * TURN; x.beginPath(); x.ellipse(cx + Math.cos(t) * r * 0.55, cy + Math.sin(t) * r * 0.55, r * 0.42, r * 0.22, t, 0, TURN); x.fill(); } x.fillStyle = paper; x.beginPath(); x.arc(cx, cy, r * 0.2, 0, TURN); x.fill(); x.fillStyle = ink; };
  /* the border: a band, scallops, dots */
  x.lineWidth = 6 * s; x.strokeRect(9 * s, 9 * s, size - 18 * s, size - 18 * s); x.lineWidth = 1.5 * s; x.strokeRect(17 * s, 17 * s, size - 34 * s, size - 34 * s);
  for (let i = 0; i < 18; i++) { const p = 24 * s + i * (size - 48 * s) / 17; for (const [px, py] of [[p, 23 * s], [p, size - 23 * s], [23 * s, p], [size - 23 * s, p]]) { x.beginPath(); x.arc(px, py, 2.2 * s, 0, TURN); x.fill(); } }
  /* the field: paisley in fours about the middle, flowers in the corners, the medallion */
  const m = size / 2; for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2; const ca = Math.cos(a), sa = Math.sin(a);
    paisley(m + (ca * 42 - sa * 20) * s, m + (sa * 42 + ca * 20) * s, 15 * s, a + 0.6); paisley(m + (ca * 58 + sa * 28) * s, m + (sa * 58 - ca * 28) * s, 11 * s, a + 2.2); }
  for (const [fx, fy] of [[40, 40], [160, 40], [40, 160], [160, 160]]) flower(fx * s, fy * s, 11 * s);
  x.beginPath(); x.arc(m, m, 18 * s, 0, TURN); x.fill(); x.fillStyle = paper; x.beginPath(); x.arc(m, m, 12 * s, 0, TURN); x.fill(); x.fillStyle = ink; flower(m, m, 9 * s);
  return c;
}
const ragURL = inv => { const k = `k${inv}`; if (!RAGS.has(k)) RAGS.set(k, bandana(96, inv).toDataURL('image/png')); return RAGS.get(k); };
/* barbed wire: two strands twisted, a barb every so often */
function barbURL(col = ZCOL, w = 360, h = 44) {
  const k = `b${col}${w}`; if (RAGS.has(k)) return RAGS.get(k); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.strokeStyle = col; x.lineCap = 'round'; x.lineWidth = 2.2;
  for (const ph of [0, Math.PI]) { x.beginPath(); for (let i = 0; i <= w; i += 2) { const y = h / 2 + Math.sin(i / 9 + ph) * 3.2; if (i) x.lineTo(i, y); else x.moveTo(i, y); } x.stroke(); }
  x.lineWidth = 2; for (let b = 22; b < w - 10; b += 46) { x.beginPath(); x.moveTo(b - 7, h / 2 - 11); x.lineTo(b + 7, h / 2 + 11); x.moveTo(b + 7, h / 2 - 11); x.lineTo(b - 7, h / 2 + 11); x.stroke(); x.beginPath(); x.arc(b, h / 2, 3, 0, TURN); x.stroke(); }
  const u = c.toDataURL('image/png'); RAGS.set(k, u); return u;
}
/* the receipt shown larger than it prints, so the hand can work on it; the paper's own size stays the same underneath */
function fitZ() {
  if (!zc) return; const host = $('#zine .desk'); const F = FORMATS[PRESS.fmt]; const room = (host && host.clientWidth ? host.clientWidth : 640) - 48;
  const L = PRESS.fmt === 'zine' ? [0.6, 0.85, 1.25] : PRESS.fmt === 'gb' ? [1.4, 2.2, 3] : [1, 1.6, 2.4]; const z = PRESS.zl === 0 ? Math.min(L[0], Math.max(0.5, room / F.w)) : L[PRESS.zl]; PRESS.z = z;
  zc.setDimensions({ width: `${Math.round(zc.getWidth() * z)}px`, height: `${Math.round(zc.getHeight() * z)}px` }, { cssOnly: true });
}
addEventListener('resize', () => { if (zc && !$('#zine').hidden) fitZ(); });
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
  fitZ(); zc.renderAll(); return zc;
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
    zc.add(im); zc.sendToBack(im); const need = Math.ceil(im.getScaledHeight()) + 160; if (zc.getHeight() < need) { zc.setHeight(need); fitZ(); } zc.renderAll(); saveZine(); res();
  }));
}
const words = () => ($('#zine-words').value || '').trim();
const rnd = (a, b) => a + Math.random() * (b - a);
function cutOut(f, text, x, y) {
  const faces = ['VT323, monospace', 'Poppins, sans-serif', '"IBM Plex Mono", monospace', '"Playfair Display", serif', 'UnifrakturMaguntia, serif', '"Sedgwick Ave Display", cursive']; const papers = ['#FFFFFF', '#0C0E0E', '#E6F84A', '#A9F0EC', '#D9D4C7'];
  let dx = 0; const parts = [];
  for (const ch of text) { if (ch === ' ') { dx += 12; continue; } const bg = papers[Math.floor(Math.random() * papers.length)];
    const t = new f.Text(ch.toUpperCase(), { left: dx, top: rnd(-4, 4), fontFamily: faces[Math.floor(Math.random() * faces.length)], fontSize: Math.round(rnd(22, 34)), fontWeight: Math.random() < 0.5 ? 700 : 400, fill: bg === '#0C0E0E' ? '#FFFFFF' : '#0C0E0E', backgroundColor: bg, angle: rnd(-6, 6), padding: 2 });
    parts.push(t); dx += t.width + 4; }
  return new f.Group(parts, { left: x, top: y, daKind: 'cut' });
}
function photocopy(img) { const F = window.fabric.Image.filters; img.filters = [new F.Grayscale(), new F.Contrast({ contrast: 0.45 }), new F.Brightness({ brightness: 0.04 })]; img.applyFilters(); return img; }
/* a sticker, die-cut: the mark in the ink chosen, a white edge, a little shadow */
const STK = new Map();
function sticker(st) {
  if (st.w) return wordSticker(st);
  const key = `${st.g || st.i || 'j' + st.j}|${st.col}`; if (STK.has(key)) return STK.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 180; const x = c.getContext('2d');
  const draw = (col, dx = 0, dy = 0) => (st.j ? M.jelly(x, 90 + dx, 92 + dy, 150, col, st.j === 2 ? (col === '#FFFFFF' ? '#FFFFFF' : col + '44') : 'rgba(0,0,0,0)') : st.g ? M.glyph(x, st.g, 90 + dx, 90 + dy, 110, col) : M.icon(x, st.i, 90 + dx, 90 + dy, 104, col));
  if (st.j) { const t = document.createElement('canvas'); t.width = t.height = 180; const tx = t.getContext('2d'); const d2 = (col, dx, dy) => M.jelly(tx, 90 + dx, 92 + dy, 150, col, '#FFFFFF');
    for (let a = 0; a < 24; a++) d2('#FFFFFF', Math.cos(a / 24 * Math.PI * 2) * 8, Math.sin(a / 24 * Math.PI * 2) * 8); x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.shadowOffsetY = 3; x.drawImage(t, 0, 0); x.restore(); }
  else { x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.shadowOffsetY = 3; for (let a = 0; a < 16; a++) draw('#FFFFFF', Math.cos(a / 16 * Math.PI * 2) * 9, Math.sin(a / 16 * Math.PI * 2) * 9); x.restore(); }
  for (let a = 0; a < 16; a++) draw('#FFFFFF', Math.cos(a / 16 * Math.PI * 2) * 7, Math.sin(a / 16 * Math.PI * 2) * 7);
  draw(st.col || '#141412'); const url = c.toDataURL('image/png'); if (STK.size > 300) STK.clear(); STK.set(key, url); return url;
}
/* words as stickers: each in its own face, the ink inside a thick white edge, like the stickers on a laptop lid */
const WORDS_STK = [['W.I.S.H.', 4], ['R&D', 0], ['novel.global', 1], ['NOTICED', 3], ['RESPONSE', 2], ['DIRECT ACTION', 3], ['REPAIR', 4], ['KIN', 2], ['SLOW', 4], ['HOLD', 3], ['SHADE', 1], ['WATER', 4], ['ALWAYS', 5], ['YOURS', 1]];
function wordSticker(st) {
  const fc = FACES[st.f || 0]; const key = `w${st.w}|${st.f}|${st.col}|${document.fonts && document.fonts.check(faceCSS(fc, 40)) ? 1 : 0}`; if (STK.has(key)) return STK.get(key);
  const px = 46; const m = document.createElement('canvas').getContext('2d'); m.font = faceCSS(fc, px); const tw = Math.ceil(m.measureText(st.w).width);
  const c = document.createElement('canvas'); c.width = tw + 44; c.height = px + 50; const x = c.getContext('2d'); x.font = faceCSS(fc, px); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  const cx = c.width / 2, cy = c.height / 2 + 2; x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.shadowOffsetY = 3; x.lineWidth = 18; x.strokeStyle = '#FFFFFF'; x.strokeText(st.w, cx, cy); x.restore();
  x.lineWidth = 14; x.strokeStyle = '#FFFFFF'; x.strokeText(st.w, cx, cy); x.fillStyle = st.col || '#0C0E0E'; x.fillText(st.w, cx, cy);
  const url = c.toDataURL('image/png'); STK.set(key, url); return url;
}
/* the packs: each opens on the muse. Life; the jellyfish; the zone; sweet gore; the witch's; ink; turtles; words */
const J = [{ j: 1 }];
const PACKS_ALL = {
  life: [...J, ...Object.keys(M.KINDS).filter(g => g !== 'paw').map(g => ({ g })), ...['heat', 'rain', 'water', 'day', 'night', 'shade', 'refuge', 'plant', 'people', 'hug', 'give', 'harm', 'radar', 'receipt', 'string', 'mesh', 'note', 'sign'].map(i => ({ i }))],
  jelly: [{ j: 1 }, { j: 2 }, { i: 'jelly' }, { g: 'aquatic' }, { i: 'seaturtle' }, { i: 'drip' }, { i: 'zanom' }, { i: 'star5' }],
  zone: [...J, ...['zanom', 'znut', 'zdial', 'zfence', 'zstake', 'zjar', 'zhatch', 'zmask', 'zhaz', 'zgrid', 'ztripod', 'zfile', 'zeye', 'zpylon', 'zwire'].map(i => ({ i }))],
  goth: [...J, ...['skull', 'bheart', 'dagger', 'bones', 'coffin', 'eyeball', 'drip', 'stitch', 'tooth', 'ghost', 'plaster'].map(i => ({ i })), { g: 'bat' }, { g: 'spider' }],
  witch: [...J, ...['night', 'star5', 'candle', 'crystal', 'potion', 'hand', 'pent', 'skey'].map(i => ({ i })), { g: 'fungi' }, { g: 'moth' }, { g: 'snake' }, { g: 'orb' }],
  ink: [...J, ...['flame', 'wings', 'anchor', 'die', 'spade', 'bolt', 'eight', 'dagger', 'skull', 'bheart'].map(i => ({ i })), { g: 'snake' }, { g: 'bird' }],
  turtle: [...J, { g: 'turtle' }, { i: 'seaturtle' }, { i: 'tortoise' }, { i: 'shell' }],
  words: WORDS_STK.map(([w, f]) => ({ w, f })),
};
const PACK_FACE = { life: { g: 'bird' }, jelly: { j: 1 }, zone: { i: 'zanom' }, goth: { i: 'skull' }, witch: { i: 'night' }, ink: { i: 'flame' }, turtle: { i: 'seaturtle' }, words: { i: 'quote' } };
const stickNow = () => PACKS_ALL[PRESS.pack] || PACKS_ALL.life;
/* the sheet as it stands, in the ink chosen: drawn again once the faces of the word stickers have loaded */
const redrawSheet = () => { if (S.view === 2) $$('#view .stk[data-stk]').forEach(b => { const st = stickNow()[+b.dataset.stk]; if (st) b.querySelector('img').src = sticker({ ...st, col: ZCOL }); }); };
const STICK_ALL = PACKS_ALL.life;   /* the name an earlier build used */
/* packs of one's own: pictures made into stickers, kept on this device */
const PACKS = store.get('da.stk.v1', []);
function addPack(files) {
  return Promise.all([...files].slice(0, 24).map(fl => new Promise(res => { const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 256 / Math.max(im.width, im.height)); const t = document.createElement('canvas'); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height); res(t.toDataURL('image/png')); }; im.onerror = () => res(null); im.src = rd.result; }; rd.readAsDataURL(fl); })))
    .then(urls => { for (const u of urls.filter(Boolean)) PACKS.unshift(u); PACKS.splice(48); while (!store.set('da.stk.v1', PACKS) && PACKS.length) PACKS.pop(); });
}
async function zineTool(k) {
  const c = await showZine(true); if (!c) return; const f = window.fabric; const W = c.getWidth(); const x = rnd(16, W * 0.45), y = rnd(30, c.getHeight() * 0.7);
  /* words: placed in the face shown on the key; pressed again while they are chosen, the next face */
  if (k === 'text' || k === 'head') {
    const sel = c.getActiveObject(); const again = sel && sel.daKind === k; if (again) ZFACE = (ZFACE + 1) % FACES.length; const fc = FACES[ZFACE]; await faceReady(fc); refaceKey('text'); refaceKey('head');
    const look = { fontFamily: fc.f, fontStyle: fc.st || 'normal' }; if (window.fabric.util.clearFabricFontCache) window.fabric.util.clearFabricFontCache();
    if (again) { sel.set({ ...look, fontSize: k === 'head' ? Math.round(W / 7.5 * (fc.k > 1.2 ? 0.9 : 1)) : Math.round(13 * fc.k) }); sel.initDimensions && sel.initDimensions(); }
    else if (k === 'text') { const t = new f.Textbox(words() || '…', { left: x, top: y, width: W * 0.6, ...look, fontSize: Math.round(13 * fc.k), fill: ZCOL, daKind: 'text' }); c.add(t); c.setActiveObject(t); }
    else { const t = new f.Textbox((words() || '★').toUpperCase(), { left: 12, top: y, width: W - 24, ...look, fontSize: Math.round(W / 7.5 * (fc.k > 1.2 ? 0.9 : 1)), lineHeight: 0.9, fill: ZCOL, daKind: 'head' }); c.add(t); c.setActiveObject(t); }
  }
  if (k === 'cut') { const g = cutOut(f, words() || 'WISH', x, y); c.add(g); c.setActiveObject(g); }
  if (k === 'image') { $('#zine-file').click(); return; }
  if (k === 'zoom') { PRESS.zl = (PRESS.zl + 1) % 3; fitZ(); refaceKey('zoom'); snd.tick(1200 + PRESS.zl * 300); return; }
  if (k === 'add') { pickMenu($('#zine [data-zt="add"]'), addables(false), it => pieceOn(it.k, it.id)); return; }
  if (k === 'draw') { c.isDrawingMode = !c.isDrawingMode; c.freeDrawingBrush.color = ZCOL; c.freeDrawingBrush.width = 3; $('#zine [data-zt="draw"]').classList.toggle('on', c.isDrawingMode); return; }
  /* tape: paper tape, a strip of bandana, barbed wire; pressed again while one is chosen, it becomes the next */
  if (k === 'tape') {
    const sel = c.getActiveObject(); const again = sel && sel.daKind === 'tape'; if (again) ZTAPE = (ZTAPE + 1) % TAPES.length; refaceKey('tape');
    const at = again ? { left: sel.left, top: sel.top, angle: sel.angle } : { left: x, top: y, angle: rnd(-25, 25) }; if (again) c.remove(sel);
    const kind = TAPES[ZTAPE];
    if (kind === 'tape') { const r = new f.Rect({ ...at, width: W * 0.38, height: 26, fill: 'rgba(230,248,74,.5)', daKind: 'tape' }); c.add(r); c.setActiveObject(r); }
    else { const url = kind === 'rag' ? bandana(240, RAGINV).toDataURL('image/png') : barbURL(ZCOL); await new Promise(res => f.Image.fromURL(url, im => { if (kind === 'rag') im.set({ cropY: 90, height: 60 }); im.set({ ...at, daKind: 'tape' }); im.scaleToWidth(W * (kind === 'rag' ? 0.5 : 0.8)); c.add(im); c.setActiveObject(im); res(); })); }
  }
  /* a bandana patch; pressed again while it is chosen, it turns: black on white, white on black */
  if (k === 'rag') {
    const sel = c.getActiveObject(); const again = sel && sel.daKind === 'rag'; if (again) RAGINV = !RAGINV; refaceKey('rag'); refaceKey('tape');
    const at = again ? { left: sel.left, top: sel.top, angle: sel.angle, w: sel.getScaledWidth() } : { left: x, top: y, angle: rnd(-8, 8), w: Math.min(150, W * 0.45) }; if (again) c.remove(sel);
    await new Promise(res => f.Image.fromURL(bandana(300, RAGINV).toDataURL('image/png'), im => { im.set({ left: at.left, top: at.top, angle: at.angle, daKind: 'rag' }); im.scaleToWidth(at.w); c.add(im); c.setActiveObject(im); res(); }));
  }
  if (k === 'delete') { for (const o of c.getActiveObjects()) if (o.daKind !== 'base') c.remove(o); c.discardActiveObject(); }
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
  redrawSheet();
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
const CUTS = ['circle', 'stamp', 'scallop', 'hex', 'arch', 'heart', 'ticket'];
function cutPath(x, kind, c, R) {
  x.beginPath();
  if (kind === 'circle') x.arc(c, c, R, 0, TURN);
  else if (kind === 'hex') { for (let i = 0; i < 6; i++) { const a = i / 6 * TURN + Math.PI / 6; x[i ? 'lineTo' : 'moveTo'](c + Math.cos(a) * R, c + Math.sin(a) * R); } x.closePath(); }
  else if (kind === 'scallop') { const n = 14; for (let i = 0; i <= n * 8; i++) { const a = i / (n * 8) * TURN; const r = R * (0.9 + 0.1 * Math.cos(a * n)); x[i ? 'lineTo' : 'moveTo'](c + Math.cos(a) * r, c + Math.sin(a) * r); } x.closePath(); }
  else if (kind === 'stamp') { const w = R * 0.86; x.rect(c - w, c - w, w * 2, w * 2); }
  else if (kind === 'arch') { const w = R * 0.78; x.moveTo(c - w, c + R * 0.92); x.lineTo(c - w, c - R * 0.15); x.arc(c, c - R * 0.15, w, Math.PI, 0); x.lineTo(c + w, c + R * 0.92); x.closePath(); }
  else if (kind === 'heart') { const k = R / 16; x.moveTo(c, c + 14 * k); x.bezierCurveTo(c - 22 * k, c - 2 * k, c - 12 * k, c - 18 * k, c, c - 7 * k); x.bezierCurveTo(c + 12 * k, c - 18 * k, c + 22 * k, c - 2 * k, c, c + 14 * k); x.closePath(); }
  else { const w = R * 0.95, h = R * 0.62; x.moveTo(c - w, c - h); x.lineTo(c + w, c - h); x.arc(c + w, c, h * 0.28, -Math.PI / 2, Math.PI / 2, true); x.lineTo(c + w, c + h); x.lineTo(c - w, c + h); x.arc(c - w, c, h * 0.28, Math.PI / 2, -Math.PI / 2, true); x.closePath(); }
}
let cutN = 0;
function speciesSticker(sp, kind) {
  kind = kind || CUTS[(cutN++ + Math.floor(Math.random() * 3)) % CUTS.length];
  return new Promise(res => { const c = document.createElement('canvas'); c.width = c.height = 220; const x = c.getContext('2d'); const done = () => res(c.toDataURL('image/png'));
    x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.shadowOffsetY = 3; cutPath(x, kind, 110, 100); x.fillStyle = '#FFFFFF'; x.fill(); x.restore();
    /* a stamp's teeth, punched along its edges */
    if (kind === 'stamp') { const w = 86, n = 10; x.save(); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i <= n; i++) { const t = -w + 2 * w * i / n; for (const [px, py] of [[110 + t, 110 - w], [110 + t, 110 + w], [110 - w, 110 + t], [110 + w, 110 + t]]) { x.beginPath(); x.arc(px, py, 5.5, 0, TURN); x.fill(); } } x.restore(); }
    const glyph = () => { M.glyph(x, sp.g || 'paw', 110, 110, 110, '#141412'); done(); };
    if (!sp.ph) { glyph(); return; }
    loadImage(sp.ph, true).then(im => { x.save(); cutPath(x, kind, 110, 88); x.clip(); const k = Math.max(190 / im.width, 190 / im.height); x.drawImage(im, 110 - im.width * k / 2, 110 - im.height * k / 2, im.width * k, im.height * k); x.restore(); done(); }).catch(glyph); });
}
/* a kind of life as svg paths, for a constellation's ground */
const glyphPaths = (g, col) => (M.GLYPHS[g] || M.GLYPHS.paw || []).map(p => (p.f ? `<path d="${p.d}" fill="${col}"${p.rule ? ` fill-rule="${p.rule}"` : ''}/>` : `<path d="${p.d}" fill="none" stroke="${col}" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"/>`)).join('');
const figChart = g => { const gl = (g.o && glyphOf(g.o)) || 'paw';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" color="${ZCOL}"><g transform="translate(4 4) scale(12)" opacity=".16">${glyphPaths(gl, ZCOL)}</g><g transform="translate(20 20)">${strings.chartOf(g.id, 160).replace('<svg class="chart"', `<svg width="160" height="160" color="${ZCOL}"`)}</g></svg>`)}`; };
async function pieceOn(kind, id) {
  if (kind === 's') { const x = S.signals.find(v => v.key === id); if (!x) return; if (PRESS.fmt !== 'zine') { PRESS.story = id; await setBase(true); refreshPanel(); return; } const cvs = await slipCanvas(x, 384, 2, isTty(), isConn()); placeOnPage(cvs.toDataURL('image/png'), 'story', 150); }
  if (kind === 'r') { const o = myCells().find(v => String(v.id) === String(id)); if (o) placeOnPage(await cellSticker(o), 'sticker', 86); }
  if (kind === 'c') { const g = strings.list().find(v => String(v.id) === String(id)); if (g) placeOnPage(figChart(g), 'chart', 120); }
  if (kind === 'l') { const sp = SPECIES.find(v => v.id === String(id)); if (sp) placeOnPage(await speciesSticker(sp), 'sticker', 90); }
  if (kind === 'L') { const sp = radiusSpecies(24).find(v => v.id === String(id)); if (sp) placeOnPage(await speciesSticker(sp), 'sticker', 90); }
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
  snd.horn(); toast('✓'); life.redraw(); return POSTERS2[0];
}
/* ───────── a poster as a tarot card from an old handheld: four tones of the deep, a pixel frame with corner stars, its number
   in Roman at the head, the poster in an arched window, dithered, and the muse on the plate at its foot ───────── */
const TAROT_P = ['#0B1416', '#2E5552', '#8DBFB3', '#E4F2EA'];
const roman = n => { let r = ''; for (const [v, s] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { r += s; n -= v; } return r || '0'; };
async function tarotOf(p, n, scale = 3) {
  const W = 60, H = 100; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const [P0, P1, P2, P3] = TAROT_P;
  x.fillStyle = P0; x.fillRect(0, 0, W, H); x.fillStyle = P2; x.fillRect(2, 2, W - 4, 1); x.fillRect(2, H - 3, W - 4, 1); x.fillRect(2, 2, 1, H - 4); x.fillRect(W - 3, 2, 1, H - 4);
  x.fillStyle = P1; x.fillRect(4, 4, W - 8, 1); x.fillRect(4, H - 5, W - 8, 1); x.fillRect(4, 4, 1, H - 8); x.fillRect(W - 5, 4, 1, H - 8);
  for (const [sx, sy] of [[4, 4], [W - 5, 4], [4, H - 5], [W - 5, H - 5]]) { x.fillStyle = P3; x.fillRect(sx, sy - 1, 1, 3); x.fillRect(sx - 1, sy, 3, 1); }
  /* the window: the poster, small, in four tones by a 4 x 4 order */
  const im = await loadImage(p.img, false); const ww = 44, wh = 58, wx = 8, wy = 14; const t = document.createElement('canvas'); t.width = ww; t.height = wh; const tx = t.getContext('2d');
  const k = Math.max(ww / im.width, wh / im.height); tx.drawImage(im, (ww - im.width * k) / 2, 0, im.width * k, im.height * k);
  const d = tx.getImageData(0, 0, ww, wh); const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; const rgb = TAROT_P.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  for (let y = 0; y < wh; y++) for (let xx = 0; xx < ww; xx++) { const i = (y * ww + xx) * 4; const l = (0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]) / 255; const v = clamp(Math.floor(l * 3 + (B[(y % 4) * 4 + (xx % 4)] / 16 - 0.5) * 0.9 + 0.5), 0, 3); const [r, g, b] = rgb[v]; d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = b; d.data[i + 3] = 255; }
  tx.putImageData(d, 0, 0);
  x.save(); x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); x.lineTo(wx + ww, wy + wh); x.closePath(); x.clip(); x.drawImage(t, wx, wy); x.restore();
  x.strokeStyle = P3; x.lineWidth = 1; x.beginPath(); x.moveTo(wx - 0.5, wy + wh + 0.5); x.lineTo(wx - 0.5, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2 + 0.5, Math.PI, 0); x.lineTo(wx + ww + 0.5, wy + wh + 0.5); x.closePath(); x.stroke();
  /* its number, and the plate with the muse */
  x.fillStyle = P3; x.font = '400 10px VT323, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(roman(n + 1), W / 2, 9);
  x.fillStyle = P2; x.fillRect(8, 76, W - 16, 15); x.fillStyle = P0; x.fillRect(9, 77, W - 18, 13); M.icon(x, 'jelly', W / 2, 83.5, 11, P3);
  x.fillStyle = P1; for (let i = 0; i < 3; i++) { x.fillRect(14 + i * 3, 83, 1, 1); x.fillRect(W - 15 - i * 3, 83, 1, 1); }
  const out = document.createElement('canvas'); out.width = W * scale; out.height = H * scale; const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(c, 0, 0, out.width, out.height); return out;
}
/* a card turned over: large, in the middle, with the way to the press and the poster to keep */
async function openTarot(id) {
  const p = POSTERS2.find(x => x.id === id); if (!p) return; $$('.tarot-view').forEach(e => e.remove()); snd.jelly(0); tick(1500);
  const el = document.createElement('div'); el.className = 'tarot-view'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Poster');
  const c = await tarotOf(p, POSTERS2.length - 1 - POSTERS2.indexOf(p), 4); c.className = 'tv-card';
  el.innerHTML = `<div class="tv-in"><div class="tv-acts"><button type="button" class="key" data-tv="press" aria-label="To the print shop" data-tip="To the print shop">${icon('receipt')}</button><button type="button" class="key" data-tv="png" aria-label="The poster" data-tip="The poster">${icon('download')}</button><button type="button" class="key" data-tv="x" aria-label="Close">${icon('close')}</button></div></div>`;
  el.querySelector('.tv-in').prepend(c); document.body.appendChild(el);
  el.addEventListener('click', e => { const b = e.target.closest('[data-tv]'); if (b && b.dataset.tv === 'press') { el.remove(); setView(2); return; } if (b && b.dataset.tv === 'png') { const a = document.createElement('a'); a.href = p.img; a.download = `poster-${isoDay(new Date(p.at))}.jpg`; a.click(); return; } if (b || e.target === el) el.remove(); });
  const esc2 = e => { if (e.key === 'Escape') { el.remove(); removeEventListener('keydown', esc2); } }; addEventListener('keydown', esc2);
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
    tie(2); store.set('da.printed.v1', Date.now()); setTimeout(() => window.print(), 300); return;
  }
  if (k === 'poster') { await savePoster(); return; }
  if (k === 'png') { const a = document.createElement('a'); a.href = url; a.download = `${s ? s.code : 'sign'}-${PRESS.fmt}.png`; a.click(); tick(1800); return; }
  if (!s) { tick(600); return; }
  /* the printer's own bytes: the strip as drawn, in two inks, banded as the TM-T88 takes it, then a cut */
  const bytesOf = async () => { const dots = (F.dots || 512) - ((F.dots || 512) % 8); const h = Math.round(zc.getHeight() * dots / zc.getWidth()); const cv = await bwCanvas(url, dots, h, 2); return new Uint8Array([0x1B, 0x40, ...rasterOf(cv), 0x0A, 0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00]); };
  if (k === 'escpos') { download(`${s.code}.bin`, new Blob([await bytesOf()], { type: 'application/octet-stream' })); tick(1800); return; }
  if (k === 'mesh') { const t = meshText(s); const ok = await copyText(t); toast(ok ? `${bytes(t)} B` : t.slice(0, 60)); return; }
  if (k === 'send') { try { const v = await directAction(s, MASTER ? MASTER.id : '', PRESS.fmt === 'zine' ? null : await bytesOf()); tie(2); store.set('da.printed.v1', Date.now()); snd.tear(); toast(v.status === 'outbox' ? '…' : '✓'); refreshPanel(); } catch (e) { toast('✕'); } }
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
  const cells = myCells().slice(0, 12), figs = strings.list().slice(0, 12), sps = radiusSpecies(12); const pk = stickNow();
  return `<header class="ps-h" data-tip="Print shop"><span class="ps-printer${st.ready ? ' on' : ''}"><img src="${printerImg(MASTER || {}, st)}" alt=""><i class="ps-led"></i></span><i class="ps-sun" aria-hidden="true"></i></header>`
    + `<section class="sec lcd" id="sec-slips" data-tip="Stories waiting to print"><i class="lcd-ic">${icon('receipt')}<b class="mono">${ws.length}</b></i>`
      + (ws.length ? `<ol class="slips-l">${ws.map(s => `<li><button type="button" class="slip-row${cur && cur.key === s.key ? ' on' : ''}" data-press="${esc(s.key)}"><b class="mono">${esc(s.code)}</b><span class="nm">${esc(NAME_UP(s))}</span><i class="st-dot ${/QUEUE|PRINTING/.test(sentWord(s)) ? 'q' : /WAITING|SENDING/.test(sentWord(s)) ? 'w' : ''}"></i></button></li>`).join('')}</ol>` : '')
      + `</section>`
    + `<section class="sec" id="sec-style"><div class="seg keys" role="group" aria-label="Paper">${Object.keys(FORMATS).map(k => `<button type="button" class="key" data-pfmt="${k}" aria-pressed="${PRESS.fmt === k}" data-tip="${k === 'zine' ? 'A5 zine' : k === 'gb' ? 'Game Boy' : `${FORMATS[k].n} mm receipt`}">${PFMT_ICON(k)}</button>`).join('')}</div>`
      + `</section><section class="sec" id="sec-out"><h3 class="out-h"><span>PRINT</span></h3><div class="seg keys outs" role="group" aria-label="Print">${[['print', 'print', 'Print here'], ['send', 'radar', 'To novel.global'], ['poster', 'stories', 'Keep as a poster'], ['png', 'download', 'Picture'], ['escpos', 'escpos', 'Printer bytes'], ['mesh', 'mesh', 'Mesh line']].map(([k, ic, w]) => `<button type="button" class="key" data-pout="${k}" aria-label="${w}" data-tip="${w}">${icon(ic)}<i class="out-go" aria-hidden="true"></i></button>`).join('')}</div></section>`
    + (sps.length ? `<section class="sec" id="sec-near"><ol class="near">${sps.map(sp => `<li><button type="button" class="nr-b" data-piece="L" data-pid="${esc(sp.id)}" data-tip="${esc(sp.n)}"><img src="${esc(photoURL(sp.ph, 'square'))}" alt="" loading="lazy" referrerpolicy="no-referrer"></button></li>`).join('')}</ol></section>` : '')
    + (cells.length || figs.length ? `<section class="sec" id="sec-pieces"><ol class="pieces">${cells.map(o => `<li><button type="button" class="pc-b" data-piece="r" data-pid="${esc(String(o.id))}" data-tip="${esc(nameOf(o))}"><img src="${pinOf(o)}" alt=""></button></li>`).join('')}${figs.map(g => `<li><button type="button" class="pc-b" data-piece="c" data-pid="${esc(String(g.id))}" data-tip="${esc(g.name)}">${strings.chartOf(g.id, 40) || icon('string')}</button></li>`).join('')}</ol></section>` : '')
    + `<section class="sec" id="sec-stickers"><div class="seg packs" role="group" aria-label="Sticker packs">${Object.keys(PACKS_ALL).map(k => `<button type="button" class="pk-k" data-spack="${k}" aria-pressed="${PRESS.pack === k}" aria-label="${k}"><img src="${sticker({ ...PACK_FACE[k], col: PRESS.pack === k ? '#0C0E0E' : '#7F939B' })}" alt=""></button>`).join('')}</div>`
      + `<ol class="stickers${PRESS.pack === 'words' ? ' words' : ''}">${PRESS.pack === 'life' ? PACKS.map((u, i) => `<li><button type="button" class="stk own" data-pack="${i}" aria-label="Sticker"><img src="${u}" alt=""></button></li>`).join('') : ''}${pk.map((st, i) => `<li><button type="button" class="stk" data-stk="${i}" aria-label="Sticker" data-tip="${esc(st.w || (st.g ? M.KINDS[st.g] || st.g : st.i || ''))}"><img src="${sticker({ ...st, col: ZCOL })}" alt="" loading="lazy"></button></li>`).join('')}<li><label class="stk add" data-tip="Stickers of your own">${icon('plus')}<input type="file" id="pack-in" accept="image/*" multiple hidden></label></li></ol></section>`
    + `<section class="sec" id="sec-prn"><div class="docs"><button type="button" data-doc="blank" data-tip="A blank W.I.S.H. slip to fill by hand">${icon('print')}</button></div></section>`;
}
$('#view').addEventListener('click', e => {
  const ps = e.target.closest('[data-press]'); if (ps) { PRESS.story = ps.dataset.press; $$('#view [data-press]').forEach(b => b.classList.toggle('on', b === ps)); if (PRESS.fmt === 'zine') setFormat('r80'); else setBase(true); tick(1500); return; }
  const pf = e.target.closest('[data-pfmt]'); if (pf) { setFormat(pf.dataset.pfmt); return; }
  const po = e.target.closest('[data-pout]'); if (po) { pressOut(po.dataset.pout); return; }
  const sk = e.target.closest('[data-stk]'); if (sk) { const st = stickNow()[+sk.dataset.stk]; if (st.w) faceReady(FACES[st.f || 0]).then(() => placeOnPage(sticker({ ...st, col: ZCOL }), 'sticker', 130)); else placeOnPage(sticker({ ...st, col: ZCOL }), 'sticker', st.j ? 90 : 70); if (st.j) snd.jelly(0.3); return; }
  const sp = e.target.closest('[data-spack]'); if (sp) { PRESS.pack = sp.dataset.spack; refreshPanel(); snd.tick(1300 + Object.keys(PACKS_ALL).indexOf(PRESS.pack) * 120); if (PRESS.pack === 'words') Promise.all(FACES.map(faceReady)).then(redrawSheet); return; }
  const pk = e.target.closest('[data-pack]'); if (pk) { placeOnPage(PACKS[+pk.dataset.pack], 'sticker', 80); return; }
  const pc = e.target.closest('[data-piece]'); if (pc) { pieceOn(pc.dataset.piece, pc.dataset.pid); tick(1500); }
});
$('#view').addEventListener('change', async e => { if (e.target.id === 'proof-in') { const fl = e.target.files && e.target.files[0]; if (fl) await takeProof(fl); e.target.value = ''; return; } if (e.target.id !== 'pack-in') return; await addPack(e.target.files); e.target.value = ''; refreshPanel(); snd.tick(1900); });
