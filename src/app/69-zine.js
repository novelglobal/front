/* ════════════════════════════════════════════════════════════════════
   PRINT SHOP — the press. The receipt is the page: a story waiting to print is set on a strip of thermal paper (80 mm by
   default; 58 mm; a Game Boy print; or an A5 zine), and drawn on by hand: stickers of every life in any colour, packs of
   one's own, a pen, shapes, stamps, tape, cut-out letters, photocopies. What is on the strip is what prints: here, or
   at novel.global's printer as the printer's own raster. Each paper is kept on this device (da.press.<format>)
   ════════════════════════════════════════════════════════════════════ */
const FORMATS = { r80: { dots: 512, w: 320, ic: 'receipt', n: '80' }, r58: { dots: 384, w: 240, ic: 'receipt', n: '58' }, gb: { dots: 160, w: 160, levels: 4, ic: 'gb', n: '' }, zine: { w: 420, h: 595, ic: 'base', n: 'A5' } };
const PRESS = { story: null, fmt: 'r80', pack: 'life', zl: 1, drawer: null };   /* every visit opens on the 80 mm receipt, the drawers shut */
const waiting = () => S.signals.filter(s => !s.ex && !s.shared && !/^PRINTED/.test(sentWord(s)));
const pressStory = () => S.signals.find(s => s.key === PRESS.story) || waiting()[0] || null;
let zc = null, zFmt = null;
const ZINE_PROPS = ['daKind', 'daStory', 'selectable', 'evented', 'daSrc', 'daPhoto', 'daMode'];
const ZHIST = []; let zLast = '';
const zKey = () => 'da.press.' + PRESS.fmt;
const saveZine = debounce(() => { if (!zc) return; const json = zc.toJSON(ZINE_PROPS); const str = JSON.stringify(json); if (zLast && str !== zLast) { ZHIST.push(zLast); if (ZHIST.length > 40) ZHIST.shift(); } zLast = str; store.set(zKey(), { json, h: zc.getHeight() }); }, 300);
/* the tools: words, a headline, cut-out letters, a photocopy, a pen, shapes, a stamp, tape, ink, undo, remove. Icons only;
   their names come on a long hover */
const ZTOOLS = [['add', 'plus', 'Add'], ['text', 'quote', 'Words: again for another face'], ['head', 'sign', 'Headline: again for another face'], ['cut', 'remix', 'Cut-out letters'], ['image', 'camera', 'Photocopy'], ['draw', 'pencil', 'Pen'], ['shape', 'base', 'Shapes: again for another'], ['stamp', 'check', 'Stamp'], ['tape', 'minus', 'Tape: again for bandana, wire'], ['rag', 'base', 'Bandana: again to turn it'], ['undo', 'undo', 'Undo'], ['delete', 'close', 'Remove'], ['len', 'receipt', 'Longer paper: again for more'], ['zoom', 'search', 'Closer: again for closer, then back']];
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
  edgeFade(t);
}
/* what a key shows: the words keys in the face they will set, tape as the tape it lays, the bandana as itself */
function keyFace(k) {
  if (k === 'text' || k === 'head') { const fc = FACES[ZFACE]; return `<b class="aa${k === 'head' ? ' big' : ''}" style="font-family:${fc.f.replace(/"/g, "'")};font-style:${fc.st || 'normal'}">Aa</b>`; }
  if (k === 'tape') return `<i class="tp tp-${TAPES[ZTAPE]}" style="${TAPES[ZTAPE] === 'rag' ? `background-image:url(${ragURL(false)})` : TAPES[ZTAPE] === 'barb' ? `background-image:url(${barbURL('#E6EEF0')})` : ''}"></i>`;
  if (k === 'rag') return `<i class="rg" style="background-image:url(${ragURL(RAGINV)})"></i>`;
  if (k === 'len') return `<span class="ln-k">${icon('receipt')}<i class="ln-d" aria-hidden="true"></i></span>`;
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
async function inkPhoto(src, wDots, mode = photoMode()) {
  const im = await loadImage(src, false); const w = Math.max(8, Math.round(wDots)), h = Math.max(8, Math.round(w * im.height / im.width));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h);
  const id = x.getImageData(0, 0, w, h); const a = new Uint8ClampedArray(w * h); for (let i = 0; i < w * h; i++) a[i] = id.data[i * 4 + 3];
  const flat = document.createElement('canvas'); flat.width = w; flat.height = h; const fx = flat.getContext('2d', { willReadFrequently: true }); fx.fillStyle = '#fff'; fx.fillRect(0, 0, w, h); fx.drawImage(c, 0, 0);
  const out = dither(autolevel(fx.getImageData(0, 0, w, h)), 2, mode); for (let i = 0; i < w * h; i++) out.data[i * 4 + 3] = a[i] > 128 ? 255 : 0;
  x.putImageData(out, 0, 0); return c.toDataURL('image/png');
}
/* every photograph on the strip (photocopies, the photographs of lives) set again in the look chosen */
async function inkAll(list, mode = photoMode()) {
  if (!zc) return; const F = FORMATS[PRESS.fmt]; const k = (F.dots || F.w * 2) / F.w;
  for (const o of (list || zc.getObjects().filter(x => x.daSrc))) {
    /* its size on the strip is kept exactly: the new picture takes the same width and height the old one had */
    const sw = o.width * o.scaleX, sh = o.height * o.scaleY; const url = await inkPhoto(o.daSrc, sw * k, mode);
    await new Promise(res => o.setSrc(url, () => { o.set({ scaleX: sw / o.width, scaleY: sh / o.height, daMode: mode }); o.setCoords(); res(); }));
  }
  zc.renderAll(); saveZine();
}
/* animals from further out, pulled in fresh each time: a random draw of open photographs from around the city, one of each kind
   in turn so the mix is wide (birds, mammals, reptiles, frogs, fish, molluscs, spiders and insects) */
const WILD = []; let wildBusy = false;
async function pullWild() {
  if (wildBusy) return; wildBusy = true; if (S.view === 2) refreshPanel();
  try {
    const q = new URLSearchParams({ nelat: -37.0, nelng: 146.0, swlat: -38.6, swlng: 144.2, iconic_taxa: 'Aves,Mammalia,Reptilia,Amphibia,Actinopterygii,Mollusca,Arachnida,Insecta', photos: 'true', photo_license: 'cc0,cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa', quality_grade: 'research', order_by: 'random', per_page: 80, locale: 'en', preferred_place_id: CONFIG.PLACE_PREF });
    const r = await fetch(`${CONFIG.INAT_API}/observations?${q}`, { headers: { Accept: 'application/json' } }); const j = r.ok ? await r.json() : { results: [] };
    const got = (j.results || []).map(compact).filter(Boolean).map(o => spOf(o)).filter(sp => sp.ph);
    const byG = new Map(); for (const sp of got) { const k = M.GROUP[sp.g] || 'other'; if (!byG.has(k)) byG.set(k, []); byG.get(k).push(sp); }
    const mix = []; while (mix.length < 12 && [...byG.values()].some(l => l.length)) for (const l of byG.values()) if (l.length && mix.length < 12) mix.push(l.shift());
    if (mix.length) WILD.splice(0, WILD.length, ...mix);
  } catch (e) { /* the ones here will do */ } finally { wildBusy = false; }
  if (S.view === 2) refreshPanel();
}
/* an animal's photograph from anywhere on the map: any one, or the newest seen */
const PLANTISH = new Set(['plant', 'fungi']);
function wildSpecies(which) {
  const all = S.obs.filter(o => !o.hum && !PLANTISH.has(glyphOf(o)) && !isCold(o)).map(o => ({ o, sp: spOf(o) })).filter(x => x.sp.ph);
  if (!all.length) return null; if (which === 'new') return all.sort((a, b) => (stampOf(b.o) || 0) - (stampOf(a.o) || 0))[0].sp;
  return all[Math.floor(Math.random() * all.length)].sp;
}
const PHOTO_MODES = [{ k: 'atk', w: 'Diffused' }, { k: 'dots', w: 'Halftone dots' }, { k: 'bayer', w: 'Ordered' }, { k: 'lines', w: 'Engraved lines' }, { k: 'hard', w: 'Hard' }];
const photoMode = () => (PHOTO_MODES.some(m => m.k === prefs.photo) ? prefs.photo : 'atk');
/* the receipt shown larger than it prints, so the hand can work on it; the paper's own size stays the same underneath */
function fitZ() {
  if (!zc) return; const host = $('#zine .desk'); const F = FORMATS[PRESS.fmt]; const room = (host && host.clientWidth ? host.clientWidth : 640) - 48;
  const fit = Math.max(0.3, room / F.w); const roomH = (host && host.clientHeight ? host.clientHeight : 700) - 64; const all = Math.max(0.12, Math.min(fit, roomH / zc.getHeight()));
  const L = phone() ? [all, fit, fit * 1.7] : PRESS.fmt === 'zine' ? [all, 0.85, 1.25] : PRESS.fmt === 'gb' ? [all, 2.2, 3] : [all, 1.6, 2.4]; const z = L[PRESS.zl]; PRESS.z = z;
  zc.setDimensions({ width: `${Math.round(zc.getWidth() * z)}px`, height: `${Math.round(zc.getHeight() * z)}px` }, { cssOnly: true });
  zc.renderAll();   /* on a sharp screen the size set again clears the paper: it is drawn again at once */
}
addEventListener('resize', () => { if (zc && !$('#zine').hidden) fitZ(); });
/* the paper on the desk: the story set on it as it prints, and whatever is drawn over it */
async function showZine(on) {
  if (on && faceOf(2) === 'front' && PRESS.fmt !== 'r80') PRESS.fmt = 'r80';
  const host = $('#zine'); host.hidden = !on; if (!on) return null;
  zineTools(); const f = await loadFabric().catch(() => null); if (!f) return null;
  const F = FORMATS[PRESS.fmt]; host.dataset.fmt = PRESS.fmt;
  if (!zc) {
    zc = new f.Canvas('zine-c', { width: F.w, height: F.h || 520, backgroundColor: '#FFFFFF', preserveObjectStacking: true, allowTouchScrolling: true, selection: !phone() });
    zc.on('object:modified', saveZine); zc.on('text:changed', saveZine); zc.on('path:created', e => { if (e.path) e.path.set('daKind', 'pen'); saveZine(); });
    /* the story at the head moves up and down only, and stays on the paper; let down past the end, the paper grows to hold it */
    zc.on('object:moving', e => { const o = e.target; if (o && o.daKind === 'base') o.set({ left: 0, top: clamp(o.top, 60 - o.getScaledHeight(), zc.getHeight() - 60) }); });
    zc.on('object:modified', e => { const o = e.target; if (!o || o.daKind !== 'base') return; const need = Math.ceil(o.top + o.getScaledHeight()) + 80; if (zc.getHeight() < need) { zc.setHeight(need); fitZ(); zc.renderAll(); saveZine(); } });
    /* a finger on bare paper, or on the story before it is chosen, scrolls the strip: Fabric would keep every touch for itself.
       A tap still chooses (the browser's own click follows it); a piece chosen, or any sticker, moves under the finger */
    zc.wrapperEl.addEventListener('touchstart', e => { if (zc.isDrawingMode || e.touches.length !== 1) return; const t = zc.findTarget(e, false); if (!t || (t.daKind === 'base' && zc.getActiveObject() !== t)) e.stopPropagation(); }, { capture: true, passive: true });
  }
  if (zFmt !== PRESS.fmt) {
    zFmt = PRESS.fmt; zc.clear(); zc.setBackgroundColor(PRESS.fmt === 'zine' ? '#F4F1EA' : '#FFFFFF', () => {}); ZHIST.length = 0;
    const kept = store.get(zKey(), null); zc.setWidth(F.w); zc.setHeight((kept && kept.h) || F.h || 520);
    if (kept && kept.json) { zLast = JSON.stringify(kept.json); await new Promise(r => zc.loadFromJSON(kept.json, r)); zc.setBackgroundColor(PRESS.fmt === 'zine' ? '#F4F1EA' : '#FFFFFF', () => {}); } else zLast = '';
  }
  if (PRESS.fmt !== 'zine') await setBase(false);
  fitZ(); zc.renderAll(); leanOnce($('#zine-tools'), 'da.lean.zine'); return zc;
}
/* the story, as the printer's head draws it, at the head of the strip; set again when the story or its style changes */
let baseN = 0;
const lockBase = o => o.set({ left: 0, selectable: true, evented: true, lockMovementX: true, lockScalingX: true, lockScalingY: true, lockRotation: true, lockSkewingX: true, lockSkewingY: true, hasControls: false, borderColor: '#E8450F', borderScaleFactor: 2, hoverCursor: 'ns-resize', moveCursor: 'ns-resize' });
async function setBase(force) {
  const s = pressStory(); const F = FORMATS[PRESS.fmt]; if (!zc || PRESS.fmt === 'zine') return;
  const was = zc.getObjects().find(o => o.daKind === 'base'); const style = `${isTty()}${isConn()}`;
  if (!s) { if (was) zc.remove(was); return; }
  if (was && !force && was.daStory === `${s.key}|${style}`) { lockBase(was); return; }
  const my = ++baseN; const cvs = await slipCanvas(s, F.dots - (F.dots % 8), F.levels || 2, isTty(), isConn()).catch(() => null); if (!cvs || my !== baseN) return;
  await new Promise(res => window.fabric.Image.fromURL(cvs.toDataURL('image/png'), im => {
    const old = zc.getObjects().find(o => o.daKind === 'base'); const top0 = old ? old.top || 0 : 0; if (old) zc.remove(old);
    im.set({ top: top0, daKind: 'base', daStory: `${s.key}|${style}` }); lockBase(im); im.scaleToWidth(F.w);
    zc.add(im); zc.sendToBack(im); const need = Math.ceil(top0 + im.getScaledHeight()) + 160; if (zc.getHeight() < need) { zc.setHeight(need); fitZ(); } zc.renderAll(); saveZine(); res();
  }));
}
const words = () => ((($('#tp-words') || {}).value || '').trim() || ($('#zine-words').value || '').trim());
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
/* the ideas the work stands on: each a word sticker in its own face, its meaning on a long hover */
const IDEAS = [
  ["Chaos Magic", "Speculative design methods that use non-linear, irrational thinking to disrupt rigid design templates"],
  ["Sympoiesis", "Making-with nature to relinquish human control over ecological systems"],
  ["HyperNormalisation", "Retreating into simplified, fake digital realities because complex global crises feel impossible to solve"],
  ["Köpskam", "Swedish environmental shame surrounding new consumption and fast-fashion waste"],
  ["Kyber", "The cybernetic art of steering feedback loops between human desire, art, and industry"],
  ["Praxis", "Action oriented towards changing society, bridging theory (theoria) and making (poiesis)"],
  ["Quietwear", "Signal-jamming fashion designed to reduce screen enmeshment and promote human-to-human connection"],
  ["Alterlife", "Life that is permanently entangled with capitalism, chemical pollution, and industrial history"],
  ["Sonic Fiction", "Sound signatures embedded in physical objects that serve as portals for decentralised storytelling"],
  ["Headless Brand", "A decentralised utility brand where users hold read, write, and administrative permissions"],
  ["Shadow Places", "The unseen, ruined territories that bear the hidden ecological costs of modern fashion consumption"],
  ["Temporal Myopia", "Fixating on short-term sales or gratification hits while destroying long-term connection and brand trust"],
  ["Uncanny Valley", "The psychological discomfort triggered when AI representations appear almost, but not quite, human"],
  ["Alien Others", "Machine intelligences framed as coexisting non-human companions rather than second-rate humans"],
  ["Negative Capability", "The strategic mindskill of dwelling in uncertainty, friction, and doubt without prematurely grasping for facts"],
  ["Radiance", "The intentional, ethical clarity that ensures technological innovation serves purposeful goals"],
  ["Digital Phreaking", "Reclaiming creative control and autonomy from monolithic, controlling AI platforms"],
  ["W.I.S.H. Engine", "Strategic narrative flow: What We Know, Wouldn't It Be Great, So Let's Create, Here's How It Works"],
  ["B=MAT", "Behavioural design model balancing Motivation, Ability, and Triggers to shift human habits"],
  ["Data-driven Biophilia", "Translating environmental flow data and microbial activity directly into responsive textile dynamics"],
  ["More Life", "Portfolio framework prioritising sustainable, vibrant, and ecologically generative futures"],
  ["Xeno-euphoria", "A state of liberation achieved through temporary escape from digital dysphoria and social scrutiny"],
  ["Savannah Thinkers", "Evolutionary human instincts seeking immediate tribal status, approval, and fast-fashion belonging"],
  ["Tropical Potential", "Tapping into lush, complex, and unconstrained creative potential beyond basic survival loops"],
  ["Raving", "A collaborative feminist practice of producing styles for living inside digital machines"],
  ["4D Knit", "Self-assembling textiles engineered to adapt their physical form based on heat and environmental variables"],
  ["Micro-Mycelium", "Cultivating construction waste-fed fungal leather for localised, zero-waste manufacturing"],
  ["Ganoderma", "Specific fungal species grown in urban micro-labs to create bio-materials"],
  ["Spirulina", "Algae-fed bio-reactors powered by solar energy to produce zero-chemical textile dyes"],
  ["Wampum", "Pre-digital networks where cultural lore was embedded in physical artifacts and rivers rather than pixels"],
  ["Meridian", "The tipping point where peak technological achievement meets societal darkening or environmental collapse"],
  ["Theoria", "The Greek discipline of deep contemplation and pure strategic thought"],
  ["Poiesis", "The physical act of making, crafting, or material production"],
  ["Public Pedagogy", "Open-source, shared syllabi and knowledge networks used to democratise creative education"],
  ["Reverse Fashion", "Rebranding second-hand clothing through exposed seams, flipped tags, and visible mending"],
];
/* the packs: each opens on the muse. Life; the jellyfish; the zone; sweet gore; the witch's; ink; turtles; words */
const J = [{ j: 1 }];
const PACKS_ALL = {
  life: [...Object.keys(M.KINDS).filter(g => g !== 'paw').map(g => ({ g })), ...['heat', 'rain', 'water', 'day', 'night', 'shade', 'refuge', 'plant', 'people', 'hug', 'give', 'harm', 'radar', 'receipt', 'string', 'mesh', 'note', 'sign'].map(i => ({ i }))],
  jelly: [{ j: 1 }, { j: 2 }, { i: 'jelly' }, { g: 'aquatic' }, { i: 'seaturtle' }, { i: 'drip' }, { i: 'zanom' }, { i: 'star5' }],
  zone: [...['zanom', 'znut', 'zdial', 'zfence', 'zstake', 'zjar', 'zhatch', 'zmask', 'zhaz', 'zgrid', 'ztripod', 'zfile', 'zeye', 'zpylon', 'zwire'].map(i => ({ i }))],
  goth: [...['skull', 'bheart', 'dagger', 'bones', 'coffin', 'eyeball', 'drip', 'stitch', 'tooth', 'ghost', 'plaster'].map(i => ({ i })), { g: 'bat' }, { g: 'spider' }],
  witch: [...['night', 'star5', 'candle', 'crystal', 'potion', 'hand', 'pent', 'skey'].map(i => ({ i })), { g: 'fungi' }, { g: 'moth' }, { g: 'snake' }, { g: 'orb' }],
  ink: [...['flame', 'wings', 'anchor', 'die', 'spade', 'bolt', 'eight', 'dagger', 'skull', 'bheart'].map(i => ({ i })), { g: 'snake' }, { g: 'bird' }],
  turtle: [{ g: 'turtle' }, { i: 'seaturtle' }, { i: 'tortoise' }, { i: 'shell' }],
  words: WORDS_STK.map(([w, f]) => ({ w, f })),
  ideas: IDEAS.map(([w, d], i) => ({ w, f: [1, 3, 4, 2, 0, 5][i % 6], d })),
};
const PACK_FACE = { ideas: { i: 'zfile' }, life: { g: 'bird' }, jelly: { j: 1 }, zone: { i: 'zanom' }, goth: { i: 'skull' }, witch: { i: 'night' }, ink: { i: 'flame' }, turtle: { i: 'seaturtle' }, words: { i: 'quote' } };
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
  const c = await showZine(true); if (!c) return; const f = window.fabric; const W = c.getWidth(); const at = viewSpot(); const x = clamp(at.x - W * 0.2, 8, W * 0.55), y = Math.max(20, at.y);
  /* words: placed in the face shown on the key; pressed again while they are chosen, the next face */
  if (k === 'text' || k === 'head') {
    const sel = c.getActiveObject(); const again = sel && sel.daKind === k; if (again) ZFACE = (ZFACE + 1) % FACES.length; const fc = FACES[ZFACE]; await faceReady(fc); refaceKey('text'); refaceKey('head');
    const look = { fontFamily: fc.f, fontStyle: fc.st || 'normal' }; if (window.fabric.util.clearFabricFontCache) window.fabric.util.clearFabricFontCache();
    if (again) { sel.set({ ...look, fontSize: k === 'head' ? Math.round(W / 7.5 * (fc.k > 1.2 ? 0.9 : 1)) : Math.round(13 * fc.k) }); sel.initDimensions && sel.initDimensions(); }
    else if (k === 'text') { const t = new f.Textbox(words() || '…', { left: x, top: y, width: W * 0.6, ...look, fontSize: Math.round(13 * fc.k), fill: ZCOL, daKind: 'text' }); c.add(t); c.setActiveObject(t); }
    else { const t = new f.Textbox((words() || '★').toUpperCase(), { left: 12, top: y, width: W - 24, ...look, fontSize: Math.round(W / 7.5 * (fc.k > 1.2 ? 0.9 : 1)), lineHeight: 0.9, fill: ZCOL, daKind: 'head' }); c.add(t); c.setActiveObject(t); }
  }
  if (k === 'stk') { const ks = ['jelly', 'life', 'zone', 'goth', 'witch', 'ink', 'turtle']; const pk = PACKS_ALL[ks[Math.floor(Math.random() * ks.length)]]; const st = pk[Math.floor(Math.random() * pk.length)]; placeOnPage(sticker({ ...st, col: ZCOL }), 'sticker', st.j ? 90 : 70); if (st.j) snd.jelly(0.3); return; }
  if (k === 'cut') { const g = cutOut(f, words() || 'WISH', x, y); c.add(g); c.setActiveObject(g); }
  if (k === 'image') { $('#zine-file').click(); return; }
  if (k === 'zoom') { PRESS.zl = (PRESS.zl + 1) % 3; fitZ(); refaceKey('zoom'); snd.tick(1200 + PRESS.zl * 300); return; }
  if (k === 'len') { c.setHeight(c.getHeight() + Math.round(c.getWidth() * 0.75)); fitZ(); c.renderAll(); saveZine(); snd.printer(300); const d = $('#zine .desk'); if (d) d.scrollTo({ top: d.scrollHeight, behavior: reduced() ? 'auto' : 'smooth' }); return; }
  if (k === 'add') { const mine = S.signals.filter(x => !x.ex && !x.shared).slice(0, 12);
    pickMenu($('#zine [data-zt="add"]'), [...POSTERS2.slice(0, 12).map((p, i) => ({ k: 'p', id: p.id, n: `Poster № ${String(POSTERS2.length - i).padStart(3, '0')}`, ic: `<img src="${p.img}" alt="">` })), ...mine.map(x => ({ k: 'S', id: x.key, n: `${x.code} · ${NAME_UP(x)}`, ic: icon('receipt', 'sm') })), ...mine.map(x => ({ k: 'q', id: x.key, n: `QR · ${x.code} · its song`, ic: icon('qr', 'sm') })), ...deck().slice(0, 24).map(c => ({ k: 'T', id: c.id, n: `Card · ${c.name || `№ ${String(c.n + 1).padStart(3, '0')}`}`, ic: icon('stories', 'sm') })), ...(placed() ? [{ k: 'R', id: '', n: 'Radio · this sound as a link', ic: icon('qr', 'sm') }] : []), ...LOOPS.slice(0, 6).map(l => ({ k: 'R', id: l.id, n: `Loop · ${l.where.place || ''} · ${fmtStamp(l.at)}`, ic: icon('loop', 'sm') })), ...BOARDS.map(b => ({ k: 'b', id: b.id, n: b.n, ic: icon('base', 'sm') })), ...addables(false)], it => pieceOn(it.k, it.id)); return; }
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
/* the middle of the part of the strip in view, in the strip's own units */
function viewSpot() {
  const desk = $('#zine .desk'), el = zc && zc.upperCanvasEl; if (!desk || !el) return { x: 40, y: 60 }; const d = desk.getBoundingClientRect(), r = el.getBoundingClientRect(); const z = r.width / zc.getWidth() || 1;
  const bot = phone() && S.open ? Math.min(d.bottom, $('#panel').getBoundingClientRect().top) : d.bottom;
  const cx = (clamp((d.left + d.right) / 2, r.left, r.right) - r.left) / z, cy = (clamp((d.top + bot) / 2, r.top, r.bottom) - r.top) / z; return { x: cx + rnd(-30, 30), y: cy + rnd(-30, 30) };
}
async function placeOnPage(url, kind, width, photo) {
  const c = await showZine(true); if (!c) return; const at = viewSpot(); const src = url; const F = FORMATS[PRESS.fmt]; const wd = Math.min(width, c.getWidth() * (kind === 'board' ? 0.94 : 0.6));
  if (photo) url = await inkPhoto(src, wd * (F.dots || F.w * 2) / F.w);
  window.fabric.Image.fromURL(url, im => { if (photo) im.set({ daSrc: src, daPhoto: true }); const w = Math.min(width, c.getWidth() * (kind === 'board' ? 0.94 : 0.6)); im.set({ originX: 'center', originY: 'center', left: clamp(at.x, w / 2, c.getWidth() - w / 2), top: Math.max(20, at.y), angle: kind === 'sticker' ? rnd(-12, 12) : 0, daKind: kind }); im.scaleToWidth(w); c.add(im); c.setActiveObject(im); c.renderAll(); saveZine(); snd.tick(1700); buzz(4); });
}
function cellSticker(o) {
  if (o.photo) return loadImage(o.photo, false).then(im => photoFrame(im, FRAMES[cutN++ % FRAMES.length])).catch(() => cellSticker({ ...o, photo: null }));
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
const FRAMES = ['plain', 'polaroid', 'stamp', 'round', 'deckle'];
function photoFrame(im, kind) {
  const maxW = 220, k = Math.min(maxW / im.width, maxW / im.height, 1.6); const w = Math.round(im.width * k), h = Math.round(im.height * k);
  const pad = kind === 'polaroid' ? 10 : 8, foot = kind === 'polaroid' ? 30 : pad; const W = w + pad * 2, H = h + pad + foot;
  const c = document.createElement('canvas'); c.width = W + 16; c.height = H + 16; const x = c.getContext('2d'); const ox = 8, oy = 6;
  x.save(); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 7; x.shadowOffsetY = 3; x.fillStyle = '#fff';
  if (kind === 'round') { x.beginPath(); x.roundRect ? x.roundRect(ox, oy, W, H, 18) : x.rect(ox, oy, W, H); x.fill(); } else x.fillRect(ox, oy, W, H); x.restore();
  if (kind === 'stamp') { x.save(); x.globalCompositeOperation = 'destination-out'; for (let t = 0; t <= W; t += 10) for (const yy of [oy, oy + H]) { x.beginPath(); x.arc(ox + t, yy, 3.6, 0, TURN); x.fill(); } for (let t = 0; t <= H; t += 10) for (const xx of [ox, ox + W]) { x.beginPath(); x.arc(xx, oy + t, 3.6, 0, TURN); x.fill(); } x.restore(); }
  if (kind === 'deckle') { x.save(); x.globalCompositeOperation = 'destination-out'; const r = seeded('deckle' + W + H); for (let t = 0; t < W; t += 3) { x.fillRect(ox + t, oy - 1, 3, r() * 3); x.fillRect(ox + t, oy + H - r() * 3 + 1, 3, 4); } for (let t = 0; t < H; t += 3) { x.fillRect(ox - 1, oy + t, r() * 3, 3); x.fillRect(ox + W - r() * 3 + 1, oy + t, 4, 3); } x.restore(); }
  if (kind === 'round') { x.save(); x.beginPath(); x.roundRect ? x.roundRect(ox + pad, oy + pad, w, h, 12) : x.rect(ox + pad, oy + pad, w, h); x.clip(); x.drawImage(im, ox + pad, oy + pad, w, h); x.restore(); }
  else x.drawImage(im, ox + pad, oy + pad, w, h);
  return c.toDataURL('image/png');
}
function speciesSticker(sp, kind) {
  kind = kind || FRAMES[(cutN++ + Math.floor(Math.random() * 2)) % FRAMES.length];
  return new Promise(res => {
    const glyph = () => { const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d'); x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.beginPath(); x.arc(100, 100, 92, 0, TURN); x.fillStyle = '#FFFFFF'; x.fill(); x.restore(); M.glyph(x, sp.g || 'paw', 100, 100, 110, '#141412'); res(c.toDataURL('image/png')); };
    if (!sp.ph) { glyph(); return; }
    loadImage(sp.ph, true).then(im => res(photoFrame(im, kind))).catch(glyph);
  });
}
/* a kind of life as svg paths, for a constellation's ground */
const glyphPaths = (g, col) => (M.GLYPHS[g] || M.GLYPHS.paw || []).map(p => (p.f ? `<path d="${p.d}" fill="${col}"${p.rule ? ` fill-rule="${p.rule}"` : ''}/>` : `<path d="${p.d}" fill="none" stroke="${col}" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"/>`)).join('');
const figChart = g => figArt(g, ZCOL);
async function pieceOn(kind, id) {
  if (kind === 's') { const x = S.signals.find(v => v.key === id); if (!x) return; if (PRESS.fmt !== 'zine') { PRESS.story = id; await setBase(true); refreshPanel(); return; } const cvs = await slipCanvas(x, 384, 2, isTty(), isConn()); placeOnPage(cvs.toDataURL('image/png'), 'story', 150); }
  if (kind === 'r') { const o = myCells().find(v => String(v.id) === String(id)); if (o) placeOnPage(await cellSticker(o), 'sticker', 86, !!o.photo); }
  if (kind === 'c') { const g = strings.list().find(v => String(v.id) === String(id)); if (g) placeOnPage(figChart(g), 'chart', 120); }
  if (kind === 'l') { const sp = SPECIES.find(v => v.id === String(id)); if (sp) placeOnPage(await speciesSticker(sp), 'sticker', 90, !!sp.ph); }
  if (kind === 'L') { const sp = radiusSpecies(24).find(v => v.id === String(id)); if (sp) placeOnPage(await speciesSticker(sp), 'sticker', 90, !!sp.ph); }
  if (kind === 'W') { const sp = WILD.find(v => v.id === String(id)); if (sp) placeOnPage(await speciesSticker(sp), 'sticker', 96, true); }
  if (kind === 'b') { const u = await boardImage(id); if (u) placeOnPage(u, 'board', 600); else tick(600); }
  if (kind === 'p') { const p = POSTERS2.find(v => v.id === id); if (p) placeOnPage(p.img, 'poster', 600); }
  if (kind === 'X') { placeExampleZine(); return; }
  if (kind === 'T') { const card = deck().find(c => c.id === id); if (card) placeOnPage(await mountArt(await cardURL(card, 3)), 'art', 200); }
  if (kind === 'R') { const m = (id && (LOOPS.find(l => l.id === id) || MIXES.find(l => l.id === id))) || (placed() ? mixNow() : null); if (m) placeOnPage(mixArt(m, mixURL(m)), 'art', 240); }
  if (kind === 'S') { const x = S.signals.find(v => v.key === id); if (x) { const cvs = await slipCanvas(x, 384, 2, isTty(), isConn()); placeOnPage(cvs.toDataURL('image/png'), 'story', 220); } }
  if (kind === 'q') { const x = S.signals.find(v => v.key === id); const t = x ? qrText(x) : CONFIG.PORTAL_URL; const u = qrImage(t); if (u) placeOnPage(u, 'qr', 120); }
}
function setFormat(k) { if (!FORMATS[k]) return; PRESS.fmt = k; $$('#view [data-pfmt]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pfmt === k))); showZine(true); tick(1500); buzz(4); }
/* a print sent: a small clear printer, hand-drawn, the paper feeding out, then torn; no words */
function feedAnim(url) {
  const d = $('#zine .desk'); if (!d || reduced()) return;
  const el = document.createElement('div'); el.className = 'feed'; el.innerHTML = `<i class="fp-body"></i><i class="fp-slot"></i><i class="fp-led"></i><span class="fp-paper"><img src="${url}" alt=""></span>`;
  d.appendChild(el); snd.printer(1400); setTimeout(() => el.classList.add('torn'), 1500); setTimeout(() => el.remove(), 2600);
}
const POSTERS2 = store.get('da.posters2.v1', []);
let lastPoster = '';
async function savePoster(quiet) {
  const out = await stripOut(); if (!out) return; const sig = `${out.url.length}|${out.url.slice(-80)}`; if (quiet && sig === lastPoster) return POSTERS2[0]; lastPoster = sig; const s = pressStory(); const im = await loadImage(out.url, false);
  const k = Math.min(1, 360 / im.width); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
  const where = s && s.pin ? { lat: +s.pin.lat, lng: +s.pin.lng } : { lat: S.scan.lat, lng: S.scan.lng };
  const figs = strings.list().filter(g => g.o && life.inScan(g.o.lat, g.o.lng)).slice(0, 3).map(g => String(g.id));
  POSTERS2.unshift({ id: uid('p'), at: Date.now(), img: c.toDataURL('image/jpeg', 0.8), ...where, figs, ...(s ? { story: s.key } : {}) }); POSTERS2.splice(12);
  while (!store.set('da.posters2.v1', POSTERS2) && POSTERS2.length > 1) POSTERS2.pop();
  if (!quiet) { snd.horn(); toast('✓'); } life.redraw(); return POSTERS2[0];
}
/* ───────── a poster as a card from an old handheld: four tones of the deep, a pixel frame with corner stars, its number
   in Roman at the head, the poster in an arched window, dithered, and the muse on the plate at its foot ───────── */
/* the deck's palettes, four tones each, as an old handheld had them: the deep, the sun, acid, leaf, the handheld's own green, ember */
const CARD_PALS = { deep: ['#0B1416', '#2E5552', '#8DBFB3', '#E4F2EA'], sun: ['#2A0E00', '#B83A00', '#FF7A1A', '#FFE8BF'], acid: ['#1A2200', '#5B7600', '#C9F200', '#F7FFD6'], leaf: ['#0D2610', '#2C6A28', '#86D14B', '#EAF8CF'], gb: ['#0F380F', '#306230', '#8BAC0F', '#C4DE6A'], ember: ['#260A00', '#8A2B00', '#FFB000', '#FFF2B3'] };
const CARD_P = CARD_PALS.deep;
const palOf = id => { const ks = ['sun', 'acid', 'leaf', 'deep', 'gb', 'ember']; let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return CARD_PALS[ks[h % ks.length]]; };
const roman = n => { let r = ''; for (const [v, s] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { r += s; n -= v; } return r || '0'; };
async function cardArt(p, n, scale = 3, pal) {
  const W = 60, H = 100; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const PAL = pal || palOf(p.id); const [P0, P1, P2, P3] = PAL;
  x.fillStyle = P0; x.fillRect(0, 0, W, H); x.fillStyle = P2; x.fillRect(2, 2, W - 4, 1); x.fillRect(2, H - 3, W - 4, 1); x.fillRect(2, 2, 1, H - 4); x.fillRect(W - 3, 2, 1, H - 4);
  x.fillStyle = P1; x.fillRect(4, 4, W - 8, 1); x.fillRect(4, H - 5, W - 8, 1); x.fillRect(4, 4, 1, H - 8); x.fillRect(W - 5, 4, 1, H - 8);
  for (const [sx, sy] of [[4, 4], [W - 5, 4], [4, H - 5], [W - 5, H - 5]]) { x.fillStyle = P3; x.fillRect(sx, sy - 1, 1, 3); x.fillRect(sx - 1, sy, 3, 1); }
  /* the window: the poster, small, in four tones by a 4 x 4 order */
  const im = await loadImage(p.img, !/^data:/.test(p.img)); const ww = 44, wh = 58, wx = 8, wy = 14; const t = document.createElement('canvas'); t.width = ww; t.height = wh; const tx = t.getContext('2d');
  const k = Math.max(ww / im.width, wh / im.height); tx.drawImage(im, (ww - im.width * k) / 2, 0, im.width * k, im.height * k);
  const d = tx.getImageData(0, 0, ww, wh); const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; const rgb = PAL.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  for (let y = 0; y < wh; y++) for (let xx = 0; xx < ww; xx++) { const i = (y * ww + xx) * 4; const l = (0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]) / 255; const v = clamp(Math.floor(l * 3 + (B[(y % 4) * 4 + (xx % 4)] / 16 - 0.5) * 0.9 + 0.5), 0, 3); const [r, g, b] = rgb[v]; d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = b; d.data[i + 3] = 255; }
  tx.putImageData(d, 0, 0);
  x.save(); x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); x.lineTo(wx + ww, wy + wh); x.closePath(); x.clip(); x.drawImage(t, wx, wy); x.restore();
  x.strokeStyle = P3; x.lineWidth = 1; x.beginPath(); x.moveTo(wx - 0.5, wy + wh + 0.5); x.lineTo(wx - 0.5, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2 + 0.5, Math.PI, 0); x.lineTo(wx + ww + 0.5, wy + wh + 0.5); x.closePath(); x.stroke();
  /* its number, and the plate with the muse */
  x.fillStyle = P3; x.font = '400 10px VT323, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(roman(n + 1), W / 2, 9);
  x.fillStyle = P2; x.fillRect(8, 76, W - 16, 15); x.fillStyle = P0; x.fillRect(9, 77, W - 18, 13); if (p.g) M.glyph(x, p.g, W / 2, 83.5, 11, P3); else M.icon(x, 'jelly', W / 2, 83.5, 11, P3);
  x.fillStyle = P1; for (let i = 0; i < 3; i++) { x.fillRect(14 + i * 3, 83, 1, 1); x.fillRect(W - 15 - i * 3, 83, 1, 1); }
  const out = document.createElement('canvas'); out.width = W * scale; out.height = H * scale; const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(c, 0, 0, out.width, out.height); return out;
}
/* ───────── the deck: every poster made, every life sent to the W.I.S.H.MAKER, every constellation, each a card of its own
   in its own palette. Kept here as tokens; turned over large; shared, saved, or laid on the strip as a sticker ───────── */
function deck() {
  return [...POSTERS2.map((p, i) => ({ id: 'p:' + p.id, img: p.img, n: POSTERS2.length - 1 - i, kind: 'poster', ref: p.id })),
    ...SPECIES.filter(sp => sp.ph).map((sp, i) => ({ id: 'l:' + sp.id, img: sp.ph, g: sp.g, n: i, kind: 'life', name: sp.n })),
    ...strings.list().map((g, i) => ({ id: 'c:' + g.id, img: figArt(g, '#000000'), g: glyphOf(g.o) || null, n: i, kind: 'fig', name: g.name }))];
}
const CARDS = new Map();
async function cardURL(card, scale = 2) { const k = `${card.id}|${scale}`; if (!CARDS.has(k)) { const c = await cardArt(card, card.n, scale); CARDS.set(k, c.toDataURL('image/png')); if (CARDS.size > 120) CARDS.delete(CARDS.keys().next().value); } return CARDS.get(k); }
async function fillDeck() { for (const im of $$('#view img[data-card]')) { const card = deck().find(c => c.id === im.dataset.card); if (!card) continue; try { const u = await cardURL(card, 2); if (im.isConnected) im.src = u; } catch (e) { /* the card waits */ } } }
const deckHTML = () => { const d = deck(); return d.length ? `<section class="sec deck" id="sec-deck"><ol class="deck-l">${d.slice(0, 48).map(c => `<li><button type="button" class="card-b" data-open-card="${esc(c.id)}" aria-label="${esc(c.name || 'A card')}"><img data-card="${esc(c.id)}" alt=""></button></li>`).join('')}</ol></section>` : ''; };
$('#view').addEventListener('click', e => { const b = e.target.closest('[data-open-card]'); if (b) { const card = deck().find(c => c.id === b.dataset.openCard); if (card) openCard(card); } });
/* a card laid on the strip as a piece of art: square to the paper, on a white mount with a fine rule round it */
async function mountArt(url, w = 360) {
  const im = await loadImage(url, false); const k = w / im.width; const iw = Math.round(im.width * k), ih = Math.round(im.height * k); const pad = Math.round(w * 0.09);
  const c = document.createElement('canvas'); c.width = iw + pad * 2; c.height = ih + Math.round(pad * 2.6); const x = c.getContext('2d');
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height); x.strokeStyle = '#0C0E0E'; x.lineWidth = 2; x.strokeRect(1, 1, c.width - 2, c.height - 2);
  x.imageSmoothingEnabled = false; x.drawImage(im, pad, pad, iw, ih); x.lineWidth = 1; x.strokeRect(pad - 0.5, pad - 0.5, iw + 1, ih + 1);
  return c.toDataURL('image/png');
}
/* what a card is with: the constellation it belongs to, and the poster it came from (else the one made nearest it) */
function cardKin(card) {
  const figs = strings.list().filter(g => g.o); const byNear = (lat, lng, key) => (a, b) => haversine(lat, lng, ...key(a)) - haversine(lat, lng, ...key(b));
  let poster = card.kind === 'poster' ? POSTERS2.find(p => 'p:' + p.id === card.id) || null : null;
  let fig = card.kind === 'fig' ? strings.list().find(g => 'c:' + g.id === card.id) || null : card.kind === 'life' ? figs.find(g => nameOf(g.o) === card.name) || figs.find(g => card.g && glyphOf(g.o) === card.g) || null : null;
  if (!fig && poster && (poster.figs || []).length) fig = figs.find(g => poster.figs.includes(String(g.id))) || null;
  if (!fig && poster && figs.length) fig = [...figs].sort(byNear(poster.lat, poster.lng, g => [g.o.lat, g.o.lng]))[0];
  if (!fig && figs.length) fig = figs[0];
  if (!poster && POSTERS2.length) poster = fig ? [...POSTERS2].sort(byNear(fig.o.lat, fig.o.lng, p => [p.lat, p.lng]))[0] : POSTERS2[0];
  return { fig, poster };
}
async function openCard(card) {
  $$('.card-view').forEach(e => e.remove()); snd.jelly(0); tick(1500);
  const el = document.createElement('div'); el.className = 'card-view'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', card.name || 'A card');
  const c = await cardArt(card, card.n, 4); c.className = 'tv-card'; const { fig, poster } = cardKin(card);
  const acts = [['strip', 'receipt', 'onto the strip', 'placed as art, to print'], ...(poster ? [['png', 'download', 'keep the poster', 'saved as a picture']] : []), ['x', 'close', 'close', '']];
  el.innerHTML = `<div class="tv-in"><div class="tv-spread">`
    + (poster ? `<figure class="tv-side tv-poster"><img src="${poster.img}" alt=""><figcaption class="mono">poster</figcaption></figure>` : '')
    + `<div class="tv-mid"></div>`
    + (fig ? `<figure class="tv-side tv-fig"><img src="${figArt(fig, '#DCE7EA')}" alt=""><figcaption class="mono">${esc(fig.name)}</figcaption></figure>` : '')
    + `</div>${card.name ? `<p class="tv-name mono">${esc(card.name)}</p>` : ''}<div class="tv-acts">${acts.map(([k, ic, w, sm]) => `<button type="button" class="tv-k" data-tv="${k}">${icon(ic)}<b>${w}</b>${sm ? `<small>${sm}</small>` : ''}</button>`).join('')}</div></div>`;
  el.querySelector('.tv-mid').append(c); document.body.appendChild(el);
  const close = () => { el.remove(); removeEventListener('keydown', escK); }; const escK = e => { if (e.key === 'Escape') close(); }; addEventListener('keydown', escK);
  el.addEventListener('click', async e => { const b = e.target.closest('[data-tv]');
    if (b && b.dataset.tv === 'strip') { close(); setView(2); setTimeout(async () => placeOnPage(await mountArt(await cardURL(card, 3)), 'art', 200), 500); return; }
    if (b && b.dataset.tv === 'png' && poster) { const a = document.createElement('a'); a.href = poster.img; a.download = `poster-${isoDay(new Date(poster.at || Date.now()))}.jpg`; a.click(); tick(1800); return; }
    if (b || e.target === el) close(); });
}
/* a poster's card, from the map */
function openPosterCard(id) { const card = deck().find(c => c.id === 'p:' + id); if (card) return openCard(card); }
/* a receipt printed, proved: a photograph of it held up, taken while novel.global's printer is online */
const PROOFS = store.get('da.proofs.v1', []);
async function takeProof(file) {
  await loadPartners(); const st = MASTER ? PSTATE[MASTER.id] || {} : {};
  if (!st.ready) { const t = document.querySelector('[data-check="4"]'); if (t) { t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope'); } snd.tick(500); buzz([30, 40, 30]); return false; }
  const url = await new Promise(res => { const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 640 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; im.onerror = () => res(''); im.src = rd.result; }; rd.readAsDataURL(file); });
  if (!url) return false; PROOFS.unshift({ at: Date.now(), img: url, printer: MASTER ? MASTER.id : '' }); PROOFS.splice(6); while (!store.set('da.proofs.v1', PROOFS) && PROOFS.length > 1) PROOFS.pop();
  tie(2); snd.tear(); buzz([10, 40, 10]); refreshPanel(); return true;
}
/* a code to scan, black on white with its quiet margin */
function qrImage(text) {
  const qr = qrOf(text); if (!qr) return null; const n = qr.getModuleCount(), m = 6, q = 4; const c = document.createElement('canvas'); c.width = c.height = (n + q * 2) * m; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#000'; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) x.fillRect((k + q) * m, (r + q) * m, m, m); return c.toDataURL('image/png');
}
/* a strip with no story at its head goes as one of its own: a code, where the radar is, and nothing else */
function stripSignal() {
  const at = Date.now();
  return { v: 1, code: codeFor(`${at}|strip|${S.me.dev}`), at, pin: { id: null, lat: +S.scan.lat.toFixed(3), lng: +S.scan.lng.toFixed(3), n: '', cn: 'PRINT SHOP', g: 'paw', place: suburbAt(S.scan.lat, S.scan.lng) }, threat: '', when: '', deg: 0, lines: { w: '', i: '', s: '', h: '' }, nodes: [], edges: [], who: S.me.by || '' };
}
/* what is on the strip, as the printer's head will lay it down */
async function stripOut() { if (!zc) return null; zc.discardActiveObject(); zc.renderAll(); const F = FORMATS[PRESS.fmt]; const url = zc.toDataURL({ format: 'png', multiplier: F.dots ? F.dots / F.w : 3 }); return { url, F }; }
async function pressOut(k) {
  const s = pressStory(); const out = await stripOut(); if (!out) return; const { url, F } = out;
  if (k === 'print' || k === 'send') feedAnim(url);
  if (k === 'print' || k === 'send' || k === 'png') savePoster(true).catch(() => {});
  if (k === 'print') {
    const el = $('#p-slip'); el.innerHTML = `<img src="${url}" alt="" style="width:100%;display:block">`; el.className = 'slip print zine';
    let st = $('#page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); }
    st.textContent = PRESS.fmt === 'zine' ? '@page{size:A5;margin:0}' : `@page{size:${F.n === '58' ? 58 : 80}mm ${Math.ceil(zc.getHeight() / F.w * (F.n === '58' ? 58 : 80)) + 6}mm;margin:0}`;
    tie(2); store.set('da.printed.v1', Date.now()); setTimeout(() => window.print(), 300); return;
  }
  if (k === 'poster') { await savePoster(); return; }
  if (k === 'png') { const a = document.createElement('a'); a.href = url; a.download = `${s ? s.code : 'sign'}-${PRESS.fmt}.png`; a.click(); tick(1800); return; }
  const sg = s || stripSignal();
  /* the printer's own bytes: the strip as drawn, in two inks, banded as the TM-T88 takes it, then a cut */
  const bytesOf = async () => { const dots = (F.dots || 512) - ((F.dots || 512) % 8); const h = Math.round(zc.getHeight() * dots / zc.getWidth()); const cv = await bwCanvas(url, dots, h, 2, 'atk'); return new Uint8Array([0x1B, 0x40, ...rasterOf(cv), 0x0A, 0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00]); };
  if (k === 'escpos') { download(`${sg.code}.bin`, new Blob([await bytesOf()], { type: 'application/octet-stream' })); tick(1800); return; }
  if (k === 'mesh') { const t = meshText(sg); const ok = await copyText(t); toast(ok ? `${bytes(t)} B` : t.slice(0, 60)); return; }
  if (k === 'send') {
    const btn = document.querySelector('#view .print-k'); if (btn) btn.classList.add('busy');
    try { const v = await directAction(sg, MASTER ? MASTER.id : '', PRESS.fmt === 'zine' ? null : await bytesOf()); tie(2); store.set('da.printed.v1', Date.now()); snd.tear(); toast(v.status === 'outbox' ? 'NO SIGNAL · SENDS WHEN THERE IS ONE' : 'SENT · WAITING FOR APPROVAL'); refreshPanel(); }
    catch (e) { toast(e.status === 429 ? 'TOO MANY · TRY AGAIN SOON' : e.status === 503 ? 'THE QUEUE IS FULL' : /escpos|story/.test(e.message || '') ? 'TOO LONG TO SEND' : 'NOT SENT'); }
    finally { if (btn) btn.classList.remove('busy'); }
  }
}
$('#zine').addEventListener('click', e => { const b = e.target.closest('[data-zt]'); if (b) { zineTool(b.dataset.zt); return; } const ink = e.target.closest('[data-ink]'); if (ink) { setInk(ink.dataset.ink); snd.tick(1300); } });
$('#zine').addEventListener('change', e => {
  const fl = e.target.files && e.target.files[0]; if (!fl || e.target.id !== 'zine-file') return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = async () => { const k = Math.min(1, 1200 / Math.max(im.width, im.height)); const t = document.createElement('canvas'); t.width = Math.round(im.width * k); t.height = Math.round(im.height * k); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
    const c = await showZine(true); const src = t.toDataURL('image/jpeg', 0.85); const F = FORMATS[PRESS.fmt]; const w = c.getWidth() * 0.8; const at = viewSpot();
    window.fabric.Image.fromURL(await inkPhoto(src, w * (F.dots || F.w * 2) / F.w), img => { img.set({ left: 10, top: Math.max(20, at.y - 60), angle: rnd(-3, 3), daKind: 'image', daSrc: src }); img.scaleToWidth(w); c.add(img); c.setActiveObject(img); c.renderAll(); saveZine(); }); }; im.src = rd.result; };
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
/* each key says what it is for, small, under its mark: a sense check at a glance */
const PFMT_W = { r80: 'receipt', r58: 'ticket', gb: '4 tones', zine: 'zine' };
const PHOTO_FOR = { atk: ['soft', 'faces, fur'], dots: ['halftone', 'posters'], bayer: ['grid', 'pixel art'], lines: ['engraved', 'plants, bark'], hard: ['bold', 'type, marks'] };
const OUTS = [['print', 'print', 'PRINT<br>LOCAL', 'Print on this device'], ['poster', 'stories', 'SAVE<br>WALL', 'Save to the portfolio wall'], ['png', 'download', 'EXPORT<br>PNG', 'Export as a PNG image'], ['escpos', 'escpos', 'EXPORT<br>ESC/POS', 'Export printer bytes (.bin) for a receipt printer on a cable'], ['mesh', 'mesh', 'COPY<br>MESH', 'Copy as a mesh message, to send by radio']];
const PACK_W = { life: 'life', jelly: 'jelly', zone: 'zone', goth: 'goth', witch: 'witch', ink: 'ink', turtle: 'turtles', words: 'words', ideas: 'ideas' };
const DRAWERS = [['look', 'camera', 'The photograph'], ['life', 'fauna', 'Animals'], ['stick', 'star5', 'Stickers'], ['place', 'plus', 'What has been made here']];
/* everything made here, to place on the strip: the stories, the posters, the sounds (now, the loops kept, the signals started),
   the cards, the constellations, the boards, and each story's code */
function placeOptions() {
  const mine = S.signals.filter(x => !x.ex && !x.shared); const no = n => String(n).padStart(3, '0');
  const grp = (label, items) => (items.length ? `<optgroup label="${label}">${items.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('')}</optgroup>` : '');
  return '<option value="" selected disabled>…</option>'
    + (EXK ? grp('Example', [['X|ex', `${EXK.code} · the orangutan zine`]]) : '')
    + grp('Stories', mine.map(x => [`S|${x.key}`, `${x.code} · ${NAME_UP(x)}`]))
    + grp('Posters', POSTERS2.map((p, i) => [`p|${p.id}`, `Poster № ${no(POSTERS2.length - i)} · ${fmtStamp(p.at)}`]))
    + grp('Sound', [...(placed() ? [['R|', 'The radio, now']] : []), ...LOOPS.map(l => [`R|${l.id}`, `Loop · ${(l.where || {}).place || ''} · ${fmtStamp(l.at)}`]), ...MIXES.map(m => [`R|${m.id}`, `Signal · ${(m.where || {}).place || ''} · ${fmtStamp(m.at)}`])])
    + grp('Cards', deck().slice(0, 24).map(c => [`T|${c.id}`, c.name || `Card № ${no(c.n + 1)}`]))
    + grp('Constellations', strings.list().map(g => [`c|${g.id}`, g.name]))
    + grp('Boards', BOARDS.map(b => [`b|${b.id}`, b.n]))
    + grp('Codes', mine.map(x => [`q|${x.key}`, `QR · ${x.code}`]));
}
/* each look shown on the same small picture, a lit ball on a ramp, so the difference reads at once */
const SWS = new Map();
function swatchOf(mode) {
  if (SWS.has(mode)) return SWS.get(mode); const w = 84, h = 48; const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true });
  const lg = x.createLinearGradient(0, 0, w, 0); lg.addColorStop(0, '#141414'); lg.addColorStop(1, '#F4F4F4'); x.fillStyle = lg; x.fillRect(0, 0, w, h);
  const rg = x.createRadialGradient(w * 0.44, h * 0.36, 1, w * 0.5, h * 0.52, h * 0.44); rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(0.55, '#8C8C8C'); rg.addColorStop(1, '#161616'); x.fillStyle = rg; x.beginPath(); x.arc(w * 0.5, h * 0.52, h * 0.4, 0, TURN); x.fill();
  x.putImageData(dither(x.getImageData(0, 0, w, h), 2, mode), 0, 0); const u = c.toDataURL('image/png'); SWS.set(mode, u); return u;
}
function viewSigns() {
  const ws = waiting(); const cur = pressStory(); const st = MASTER ? PSTATE[MASTER.id] || {} : {};
  const cells = myCells().slice(0, 12), figs = strings.list().slice(0, 12), sps = radiusSpecies(12); const pk = stickNow();
  const on = printersOn();
  return `<div class="dev tepra mod">${mods('PRINT', '03 · DIRECT ACTION')}${flipBtn()}<header class="ps-h${on.length ? ' on' : ''}"><button type="button" class="ps-printer${st.ready ? ' on' : ''}" data-prn aria-expanded="false" aria-label="The printer: its name and state"><img src="${printerImg(MASTER || {}, st)}" alt=""><i class="ps-led"></i></button><span class="ps-hl" id="ps-info" hidden><b>${on.length ? on.map(p => esc(String(p.n).toUpperCase())).join(' · ') : (MASTER ? esc(String(MASTER.n).toUpperCase()) : '')}</b><small class="mono"><i class="ps-dot"></i>${on.length ? 'ONLINE' : 'OFFLINE · PRINTS WAIT 24 H'}</small></span></header>`
    + `<section class="sec lcd" id="sec-slips" data-tip="Stories waiting to print"><i class="lcd-ic">${icon('receipt')}<b class="mono">${ws.length}</b></i>`
      + (ws.length ? `<ol class="slips-l">${ws.map(s => `<li><button type="button" class="slip-row${cur && cur.key === s.key ? ' on' : ''}" data-press="${esc(s.key)}"><b class="mono">${esc(s.code)}</b><span class="nm">${esc(NAME_UP(s))}</span><i class="st-dot ${/QUEUE|PRINTING/.test(sentWord(s)) ? 'q' : /WAITING|SENDING/.test(sentWord(s)) ? 'w' : ''}"></i></button></li>`).join('')}</ol>` : '')
      + `</section>`
      /* what goes on the strip, in the order it is used, in four drawers, one open at a time, each its mark: the looks, the
         animals, the stickers, and what has been made here to place on the strip */
      + `<section class="sec" id="sec-drawers"><div class="seg keys drawers" role="group" aria-label="Drawers">${DRAWERS.map(([k, ic, w]) => `<button type="button" class="key dr-k" data-drawer="${k}" aria-pressed="${PRESS.drawer === k}" aria-label="${w}">${k === 'look' ? `<img class="ph-sw" src="${swatchOf(photoMode())}" alt="">` : k === 'life' ? glyphSVG('bird') : icon(ic)}</button>`).join('')}</div>`
      + `<div class="drawer" id="dr-look"${PRESS.drawer === 'look' ? '' : ' hidden'}><div class="seg keys photo-k" role="group" aria-label="The photograph">${PHOTO_MODES.map(m => `<button type="button" class="key ph-k cap-k" data-photo="${m.k}" aria-pressed="${photoMode() === m.k}" aria-label="${m.w}"><img class="ph-sw" src="${swatchOf(m.k)}" alt=""><small class="cap mono">${PHOTO_FOR[m.k][0]}</small></button>`).join('')}</div></div>`
      + `<div class="drawer" id="dr-life"${PRESS.drawer === 'life' ? '' : ' hidden'}><ol class="near"><li><button type="button" class="nr-b nr-k" data-wild="any" aria-label="An animal, any">${icon('die')}</button></li><li><button type="button" class="nr-b nr-k" data-wild="new" aria-label="The newest animal seen">${icon('star5')}</button></li><li><button type="button" class="nr-b nr-k${wildBusy ? ' busy' : ''}" data-wild="more" aria-label="More animals, from further out">${icon('receive')}</button></li>${[...WILD.map(sp => ({ sp, k: 'W' })), ...sps.map(sp => ({ sp, k: 'L' }))].slice(0, 15).map(({ sp, k }) => `<li><button type="button" class="nr-b" data-piece="${k}" data-pid="${esc(sp.id)}" data-tip="${esc(sp.n)}"><img src="${esc(photoURL(sp.ph, 'square'))}" alt="" loading="lazy" referrerpolicy="no-referrer"></button></li>`).join('')}</ol></div>`
      + `<div class="drawer" id="dr-stick"${PRESS.drawer === 'stick' ? '' : ' hidden'}><div class="seg packs" role="group" aria-label="Sticker packs">${Object.keys(PACKS_ALL).map(k => `<button type="button" class="pk-k" data-spack="${k}" aria-pressed="${PRESS.pack === k}" aria-label="${PACK_W[k]}"><img src="${sticker({ ...PACK_FACE[k], col: PRESS.pack === k ? '#0C0E0E' : '#7F939B' })}" alt=""></button>`).join('')}</div>`
        + `<ol class="stickers${PRESS.pack === 'words' || PRESS.pack === 'ideas' ? ' words' : ''}">${PRESS.pack === 'life' ? PACKS.map((u, i) => `<li><button type="button" class="stk own" data-pack="${i}" aria-label="Sticker"><img src="${u}" alt=""></button></li>`).join('') : ''}${pk.map((st, i) => `<li><button type="button" class="stk" data-stk="${i}" aria-label="Sticker"${st.d ? ` data-tip="${esc(`${st.w}: ${st.d}`)}"` : ''}><img src="${sticker({ ...st, col: ZCOL })}" alt="" loading="lazy"></button></li>`).join('')}<li><label class="stk add" aria-label="Stickers of your own: pictures from this device">${icon('plus')}<input type="file" id="pack-in" accept="image/*" multiple hidden></label></li></ol></div>`
      + `<div class="drawer" id="dr-place"${PRESS.drawer === 'place' ? '' : ' hidden'}><label class="pl-pick">${icon('plus')}<select id="pl-sel" aria-label="Place on the strip">${placeOptions()}</select></label>`
        + `<form class="pl-link" id="pl-link"><input id="pl-url" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://" aria-label="A link, as a code on the strip"><button type="submit" class="ib" aria-label="The link as a code on the strip">${icon('qr')}</button></form>`
        + (cells.length || figs.length ? `<ol class="pieces">${cells.map(o => `<li><button type="button" class="pc-b" data-piece="r" data-pid="${esc(String(o.id))}" data-tip="${esc(nameOf(o))}"><img src="${pinOf(o)}" alt=""></button></li>`).join('')}${figs.map(g => `<li><button type="button" class="pc-b" data-piece="c" data-pid="${esc(String(g.id))}" data-tip="${esc(g.name)}">${strings.chartOf(g.id, 40) || icon('string')}</button></li>`).join('')}</ol>` : '')
        + `</div></section>`
      /* then the paper, and the keys that send it out */
    + `<section class="sec" id="sec-style"><div class="seg keys fmt-k" role="group" aria-label="Paper">${Object.keys(FORMATS).map(k => `<button type="button" class="key cap-k" data-pfmt="${k}" aria-pressed="${PRESS.fmt === k}" data-tip="${k === 'zine' ? 'A5 zine' : k === 'gb' ? 'Game Boy' : `${FORMATS[k].n} mm receipt`}">${PFMT_ICON(k)}<small class="cap mono">${PFMT_W[k]}</small></button>`).join('')}</div></section>`
      + `<section class="sec" id="sec-out"><button type="button" class="print-k pk-ic${on.length ? ' on' : ''}${cur ? ' next' : ''}" data-pout="send" aria-label="Print receipt" data-tip="${on.length ? 'Print: online' : 'Print: offline, it waits'}">${icon('epson')}</button>`
      + `<div class="seg keys outs" role="group" aria-label="Other ways out">${OUTS.map(([k, ic, w, tip]) => `<button type="button" class="key cap-k" data-pout="${k}" aria-label="${tip}" data-tip="${tip}">${icon(ic)}<small class="cap mono">${w}</small></button>`).join('')}</div></section>`
    + `</div>`
    ;
}
$('#view').addEventListener('click', e => {
  const ps = e.target.closest('[data-press]'); if (ps) { PRESS.story = ps.dataset.press; $$('#view [data-press]').forEach(b => b.classList.toggle('on', b === ps)); if (PRESS.fmt === 'zine') setFormat('r80'); else setBase(true); tick(1500); return; }
  const pf = e.target.closest('[data-pfmt]'); if (pf) { setFormat(pf.dataset.pfmt); return; }
  const phm = e.target.closest('[data-photo]'); if (phm) { const sel = zc ? zc.getActiveObjects().filter(o => o.daSrc) : []; $$('#view [data-photo]').forEach(b => b.setAttribute('aria-pressed', String(b === phm)));
    if (sel.length) inkAll(sel, phm.dataset.photo); else { prefs.photo = phm.dataset.photo; savePrefs(); THUMBS.clear(); setBase(true); } tick(1300); return; }
  const po = e.target.closest('[data-pout]'); if (po) { pressOut(po.dataset.pout); return; }
  const sk = e.target.closest('[data-stk]'); if (sk) { const st = stickNow()[+sk.dataset.stk]; if (st.w) faceReady(FACES[st.f || 0]).then(() => placeOnPage(sticker({ ...st, col: ZCOL }), 'sticker', 130)); else placeOnPage(sticker({ ...st, col: ZCOL }), 'sticker', st.j ? 90 : 70); if (st.j) snd.jelly(0.3); return; }
  /* a drawer: pressed, it opens (and any other shuts); pressed again, it shuts */
  const dr = e.target.closest('[data-drawer]'); if (dr) { const k = dr.dataset.drawer; PRESS.drawer = PRESS.drawer === k ? null : k; $$('#view [data-drawer]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.drawer === PRESS.drawer))); $$('#view .drawer').forEach(d => { d.hidden = d.id !== 'dr-' + PRESS.drawer; }); snd.tick(PRESS.drawer ? 1400 : 1000); buzz(4); if (PRESS.drawer === 'stick' && (PRESS.pack === 'words' || PRESS.pack === 'ideas')) Promise.all(FACES.map(faceReady)).then(redrawSheet); return; }
  const sp = e.target.closest('[data-spack]'); if (sp) { const k = sp.dataset.spack; PRESS.pack = k; PRESS.drawer = 'stick'; refreshPanel(); snd.tick(1300 + Object.keys(PACKS_ALL).indexOf(k) * 120); if (k === 'words' || k === 'ideas') Promise.all(FACES.map(faceReady)).then(redrawSheet); return; }
  const pk = e.target.closest('[data-pack]'); if (pk) { placeOnPage(PACKS[+pk.dataset.pack], 'sticker', 90, true); return; }
  const pc = e.target.closest('[data-piece]'); if (pc) { pieceOn(pc.dataset.piece, pc.dataset.pid); tick(1500); }
  const wd = e.target.closest('[data-wild]'); if (wd && wd.dataset.wild === 'more') { pullWild(); tick(1500); return; } if (wd) { const sp = wildSpecies(wd.dataset.wild); if (sp) speciesSticker(sp).then(u => placeOnPage(u, 'sticker', 96, true)); else tick(600); return; }
});
/* what has been made, chosen, goes onto the strip; on a phone the strip comes up to show it */
$('#view').addEventListener('change', e => { if (e.target.id !== 'pl-sel') return; const [k, id] = e.target.value.split('|'); e.target.value = ''; if (!k) return; pieceOn(k, id); if (phone()) setPane('main'); tick(1500); });
/* a link, any link, as a code to scan; a link to the radio as its picture */
$('#view').addEventListener('submit', e => {
  if (e.target.id !== 'pl-link') return; e.preventDefault(); const u = ($('#pl-url').value || '').trim(); if (!u) { nudge($('#pl-url')); return; }
  const mx = (u.match(/#mix=([^&\s]+)/) || [])[1]; const m = mx ? mixOfCode(decodeURIComponent(mx)) : null;
  const img = m ? mixArt(m, u) : qrImage(u); if (!img) { tick(600); return; } placeOnPage(img, m ? 'art' : 'qr', m ? 240 : 120); $('#pl-url').value = ''; if (phone()) setPane('main');
});
$('#view').addEventListener('change', async e => { if (e.target.id === 'proof-in') { const fl = e.target.files && e.target.files[0]; if (fl) await takeProof(fl); e.target.value = ''; return; } if (e.target.id !== 'pack-in') return; await addPack(e.target.files); e.target.value = ''; refreshPanel(); snd.tick(1900); });
