/* ════════════════════════════════════════════════════════════════════
   THE EXAMPLE — DA-0RNG, opened up, as the lesson the rest is learned from. Its sound: the radio over Royal Park, pressed before
   anywhere is chosen, a small choir with bubbles and glass, the orangutan's own constellation sung with the lives around it.
   BOARD 00: everything behind its W.I.S.H., laid out as the three steps, NOTICED, RESPONSE, DIRECT ACTION, every fact with its
   source. Its zine: the receipt and what was made around it, placed on the strip from the drawer, and the portfolio's hero.
   BOARD 00 stands as built here, or as last approved on the approval page (/api/example). It can be rewritten only while the
   approval page has it open to editing; what is sent from here waits there, to be shown.
   ════════════════════════════════════════════════════════════════════ */
const EXK = window.DA_EXAMPLE_KIT || null;
const EXR = store.get('da.exr.v1', { at: 0, board: null });   /* the example as last approved, from the server */
const exSignal = () => (EXK ? S.signals.find(s => s.key === 'ex:' + EXK.code) : null) || null;
const exEditable = () => !!CFG.exampleEdit;
const exLocked = () => boardId === 'b00' && !exEditable();
/* the board to work on: never the example while it is locked */
async function workBoard() { if (!exLocked()) return; const b = BOARDS.find(x => !x.ex); if (b) await switchBoard(b.id); }

/* ───────── the sound ───────── */
function exampleMix() {
  const s = exSignal(); const p = (s && s.pin) || { lat: -37.7841, lng: 144.9515, place: 'PARKVILLE' }; const k = (EXK && EXK.mix) || { r: 600, layers: {} };
  return { v: MIX_V, id: 'mx-ex', at: Date.now(), loop: CONFIG.SCAN.turn || 8, where: { lat: p.lat, lng: p.lng, r: k.r || 600, place: p.place || suburbAt(p.lat, p.lng) }, layers: JSON.parse(JSON.stringify(k.layers || {})) };
}
/* play pressed before anywhere is chosen: the radar goes to Royal Park, the layers take the example's levels and moods, and the
   loop plays what the radar holds there, with the orangutan and its strings at the head of every turn */
function playExample() {
  const m = exampleMix(); tuneMix(m, false); prefs.placed = true; savePrefs();
  setTimeout(() => {
    const live = mixNow(); live.id = 'mx-ex';
    for (const [k, L] of Object.entries(m.layers)) if (live.layers[k]) Object.assign(live.layers[k], { on: !!L.on, lvl: L.lvl, mood: L.mood });
    const s = exSignal();
    if (s) {
      live.layers.life.cells = [{ n: s.pin.cn || 'Sumatran Orangutan', g: 'ape', b: 0, d: 1, p: partialOf('ape') }, ...(live.layers.life.cells || [])];
      live.layers.community.cells = [...(s.nodes || []).map(n => ({ n: n.n, fam: n.t === 'group' ? 'network' : ((ROLES[n.role] || {}).cat || 'artists'), b: n.b, d: n.d, p: partialOf(n.n) })), ...(live.layers.community.cells || [])];
    }
    setLoop(true, live); nudgeWishSoon();
  }, 420);
}

/* ───────── BOARD 00 ───────── */
const EXB_V = 1;
const viaProxy = u => (/^https?:/.test(location.protocol) && /^https?:\/\//.test(u) ? `/api/img?u=${encodeURIComponent(u)}` : u);
/* sources kept as addresses on this site, so the board loads the same on the preview and the live site */
const relSrc = json => { for (const o of (json && json.objects) || []) if (o.type === 'image' && typeof o.src === 'string' && o.src.startsWith(location.origin)) o.src = o.src.slice(location.origin.length); return json; };
async function exampleBoardJSON() {
  const f = await loadFabric(); const K = EXK; const s = exSignal(); if (!K || !s) return { version: f.version, objects: [] };
  try { await Promise.all(['20px VT323', '11px "IBM Plex Mono"', '600 22px Poppins'].map(q => document.fonts.load(q))); } catch (e) { /* the fallback faces */ }
  const back = [], links = [], front = []; const put = o => { front.push(o); return o; };
  const card = (kind, text, x, y, o = {}) => put(textCard(f, uid(kind[0]), kind, text, x, y, o));
  const sect = (x, y, w, h, title) => { back.push(new f.Rect({ left: x, top: y, width: w, height: h, fill: 'rgba(143,169,196,.07)', stroke: '#8FA9C4', strokeDashArray: [2, 4], rx: 2, ry: 2, daId: uid('s'), daKind: 'section' })); back.push(textCard(f, uid('st'), 'note', title, x + 4, y - 44, { backgroundColor: 'transparent', fill: '#8FA9C4', fontSize: 28, width: w - 8, padding: 4 })); };
  const img = (url, x, y, w, o = {}) => new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } }; setTimeout(() => fin(null), 9000);
    f.Image.fromURL(url, im => { if (!im || !im.width) return fin(null); im.set({ left: x, top: y, daId: uid('i'), daKind: 'image', ...o }); im.scaleToWidth(w); fin(put(im)); }, { crossOrigin: 'anonymous' }); });
  const link = (a, b) => { if (!a || !b) return; const ca = a.getCenterPoint(), cb = b.getCenterPoint(); links.push(new f.Line([ca.x, ca.y, cb.x, cb.y], { stroke: '#FF5A1F', strokeWidth: 1.6, strokeDashArray: [5, 4], selectable: false, evented: true, hoverCursor: 'pointer', daFrom: a.daId, daTo: b.daId, daKind: 'link' })); };
  const bottom = o => (o ? o.top + (o.getScaledHeight ? o.getScaledHeight() : o.height) : 0);
  /* the three steps, side by side */
  sect(10, 52, 372, 900, 'NOTICED'); sect(402, 52, 372, 900, 'RESPONSE'); sect(794, 52, 380, 900, 'DIRECT ACTION');
  /* NOTICED: the life, photographed where it lives; what is true now, each with its source */
  const P = K.photos.map(p => viaProxy(p.u));
  const p0 = await img(P[0], 22, 66, 204, { stroke: '#FFFFFF', strokeWidth: 6 }); const p1 = await img(P[1], 236, 66, 134, { stroke: '#FFFFFF', strokeWidth: 6 });
  const p2 = await img(P[2], 236, Math.max(66, bottom(p1)) + 10, 134, { stroke: '#FFFFFF', strokeWidth: 6, angle: 2 });
  let y = Math.max(bottom(p0), bottom(p2), 200) + 10;
  const credit = card('cell', `PHOTOGRAPHS · iNaturalist · ${[...new Set(K.photos.map(p => p.by))].join(' · ')} · GUNUNG LEUSER, SUMATRA`, 22, y, { fontSize: 8.5, width: 348, backgroundColor: 'transparent', padding: 4 }); y = bottom(credit) + 10;
  const facts = K.noticed.map(n => { const c = card('cell', `${n.t}\n${n.d}\n↗ ${hostOf(n.src)}`, 22, y, { width: 348, fontSize: 10.5 }); y = bottom(c) + 10; return c; });
  link(p0, facts[0]);
  /* RESPONSE: the four lines, and under each the research, the principle or the case it came from */
  y = 66; const L = s.lines || {};
  const lines = WKEYS.map(k => { const c = card('slip', `${k.toUpperCase()}  ${L[k] || ''}`, 414, y, { width: 348, fontSize: 18 }); y = bottom(c) + 8; return c; });
  y += 10; const from = K.response.map((r, i) => { const c = card('fig', `${r.t}\n${r.d}${r.src ? `\n↗ ${hostOf(r.src)}` : ''}`, 414 + (i % 2) * 178, y + Math.floor(i / 2) * 118, { width: 170, fontSize: 9.5 }); return c; });
  y = Math.max(...from.map(bottom)) + 14;
  const cases = K.cases.map((c, i) => card('note', `${c.t}\n${c.by}\n${c.d}`, 414 + (i % 2) * 178, y + Math.floor(i / 2) * 150, { width: 170, fontSize: 15, lineHeight: 1.05 }));
  link(facts[1], lines[0]); lines.forEach((l, i) => link(l, from[i])); link(from[3], cases[2]); link(from[1], cases[0]); link(from[1], cases[1]);
  /* DIRECT ACTION: the receipt, its sound, what it makes, and its strings */
  const slip = await slipCanvas(s, 384, 2, false, false).catch(() => null);
  const rc = slip ? await img(slip.toDataURL('image/png'), 806, 66, 178, { daKind: 'receipt' }) : null;
  const mix = exampleMix(); const mx = await img(mixArt(mix, mixURL(mix)), 994, 66, 168, { daKind: 'image' });
  const kit = card('note', `${K.action.t}\n${K.action.d}`, 994, bottom(mx) + 12, { width: 168, fontSize: 15, lineHeight: 1.05 });
  y = Math.max(bottom(rc), bottom(kit)) + 24;
  const pin = card('cell', `${(s.pin.cn || '').toUpperCase()}\n${s.pin.place || ''} · ${(+s.pin.lat).toFixed(4)} ${(+s.pin.lng).toFixed(4)}`, 806, y, { width: 176, fontSize: 10 });
  const nodes = {}; (s.nodes || []).forEach((n, i) => { nodes[n.k] = card('fig', `${n.n}\n${String((ROLES[n.role] || {}).w || (n.t === 'group' ? 'GROUP' : '')).toUpperCase()}`, i === 2 ? 806 : 994, i === 2 ? y + 104 : y + i * 92, { width: 168, fontSize: 10 }); });
  for (const [a, b] of s.edges || []) link(a === 'pin' ? pin : nodes[a], b === 'pin' ? pin : nodes[b]);
  link(lines[3], kit); link(mx, pin); link(lines[0], rc);
  const p3 = await img(P[3], 994, y + 196, 120, { stroke: '#FFFFFF', strokeWidth: 5, angle: -3 }); link(pin, p3);
  card('cell', K.intel, 806, Math.max(bottom(p3), y + 230) + 18, { width: 356, fontSize: 9.5 });
  /* stickers, as on any board: the muse and the life */
  await img(sticker({ j: 1, col: '#0C0E0E' }), 1092, 2, 72, { angle: 8 }); await img(sticker({ g: 'ape', col: '#0C0E0E' }), 316, 6, 58, { angle: -6 });
  return relSrc({ version: f.version, objects: [...back, ...links, ...front].map(o => o.toObject(BOARD_PROPS)) });
}
/* BOARD 00 as it should stand now: approved on the server, rewritten here while editing is on, or built from the kit */
async function ensureExample() {
  if (!EXK) return; const kept = boardOf('b00');
  if (EXR.board && (!kept || !kept.json || (kept.at || 0) < EXR.at)) { store.set('da.board.b00', { v: BOARD_V, ex: 'remote', at: EXR.at, json: EXR.board }); return; }
  if (kept && kept.json && (kept.ex === 'remote' || kept.ex === 'edit' || kept.exv === EXB_V)) return;
  const json = await exampleBoardJSON(); store.set('da.board.b00', { v: BOARD_V, ex: 'built', exv: EXB_V, at: 0, json });
}
/* the example everyone sees, as last approved */
async function loadExample() {
  try { const j = await apiJSON('/example'); if (j && j.board && j.at > (EXR.at || 0)) { EXR.at = j.at; EXR.board = j.board; store.set('da.exr.v1', EXR); EXZ.url = ''; if (boardId === 'b00' && cv) loadBoard(); } } catch (e) { /* as last heard */ }
}
/* the example, rewritten here while the approval page allows it, sent there to be shown */
async function sendExample() {
  if (!exEditable() || boardId !== 'b00' || !cv) { tick(600); return; }
  saveBoard(false); const json = relSrc(JSON.parse(JSON.stringify(cv.toJSON(BOARD_PROPS)))); const s = exSignal(); const p = (s && s.pin) || { lat: -37.7841, lng: 144.9515 };
  try { await apiJSON('/stories', { method: 'POST', body: JSON.stringify({ kind: 'example', code: 'DA-EX00', body: JSON.stringify(json), lat: p.lat, lng: p.lng }) }); toast('SENT · WAITING FOR APPROVAL'); snd.tear(); }
  catch (e) { toast(e.status === 403 ? 'LOCKED ON THE APPROVAL PAGE' : e.status === 413 ? 'TOO LARGE TO SEND' : 'NOT SENT'); }
}

/* ───────── the example zine: the receipt at the head of the strip, and under it what was made around it ───────── */
const EXZ = { url: '' };
const fImg = url => new Promise(res => window.fabric.Image.fromURL(url, im => res(im && im.width ? im : null), { crossOrigin: 'anonymous' }));
async function exampleZinePieces(y0, W = 320) {
  const f = await loadFabric(); const K = EXK; const out = []; let y = y0; if (!K) return { out, y };
  const ph = await loadImage(K.photos[0].u, true).catch(() => null);
  if (ph) { const u = await inkPhoto(photoFrame(ph, 'polaroid'), 200 * 1.6); const im = await fImg(u); if (im) { im.set({ left: 22, top: y, angle: -3, daKind: 'image' }); im.scaleToWidth(200); out.push(im); } }
  const jel = await fImg(sticker({ j: 1, col: '#0C0E0E' })); if (jel) { jel.set({ left: 222, top: y + 26, angle: 9, daKind: 'sticker' }); jel.scaleToWidth(84); out.push(jel); }
  y += 236;
  const head = new f.Textbox('NEST KIT', { left: 14, top: y, width: W - 28, fontFamily: 'UnifrakturMaguntia, serif', fontSize: 46, lineHeight: 0.9, fill: '#0C0E0E', daKind: 'head' }); out.push(head); y += 62;
  const mix = exampleMix(); const mx = await fImg(mixArt(mix, mixURL(mix))); if (mx) { mx.set({ left: (W - 230) / 2, top: y, daKind: 'art' }); mx.scaleToWidth(230); out.push(mx); y += mx.getScaledHeight() + 16; }
  if (boardId === 'b00' && cv) saveBoard(false); await ensureExample(); const bu = await boardImage('b00');
  if (bu) { const u = await inkPhoto(bu, 300 * 1.6); const bi = await fImg(u); if (bi) { bi.set({ left: 10, top: y, daKind: 'board' }); bi.scaleToWidth(300); out.push(bi); y += bi.getScaledHeight() + 14; } }
  const intel = new f.Textbox(K.intel, { left: 12, top: y, width: W - 24, fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, fill: '#0C0E0E', daKind: 'text' }); out.push(intel); y += 34;
  const t = new f.Text('EX · BOARD 00', { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, fontSize: 16, fill: '#0C0E0E', opacity: 0.82, padding: 8 });
  const r = new f.Rect({ width: t.width + 22, height: t.height + 16, left: -11, top: -8, fill: 'transparent', stroke: '#0C0E0E', strokeWidth: 3, rx: 4, ry: 4, opacity: 0.82 });
  out.push(new f.Group([r, t], { left: W - t.width - 40, top: y, angle: -7, daKind: 'stamp' })); y += 56;
  return { out, y };
}
/* chosen from the drawer: the strip becomes the example (what was on it can come back with undo) */
async function placeExampleZine() {
  if (!EXK) return; PRESS.fmt = 'r80'; PRESS.story = 'ex:' + EXK.code; const c = await showZine(true); if (!c) return;
  for (const o of c.getObjects().filter(o => o.daKind !== 'base')) c.remove(o);
  await setBase(true); const base = c.getObjects().find(o => o.daKind === 'base'); const y0 = base ? base.top + base.getScaledHeight() + 18 : 20;
  const { out, y } = await exampleZinePieces(y0); for (const o of out) c.add(o);
  if (c.getHeight() < y + 30) c.setHeight(y + 30); fitZ(); c.renderAll(); saveZine(); snd.printer(600); refreshPanel();
}
/* the same zine as a picture, for the portfolio's hero: made once a visit, on paper, apart from the strip */
async function exampleZineImage() {
  if (EXZ.url) return EXZ.url; if (EXZ.busy) return EXZ.busy;
  EXZ.busy = (async () => {
    const f = await loadFabric().catch(() => null); const s = exSignal(); if (!f || !s) return '';
    const W = 320; const slip = await slipCanvas(s, 512, 2, false, false).catch(() => null); if (!slip) return '';
    const sc = new f.StaticCanvas(null, { width: W, height: 3000, backgroundColor: '#FFFFFF' });
    const base = await fImg(slip.toDataURL('image/png')); if (base) { base.set({ left: 0, top: 0 }); base.scaleToWidth(W); sc.add(base); }
    const { out, y } = await exampleZinePieces((base ? base.getScaledHeight() : 0) + 18, W); for (const o of out) sc.add(o);
    sc.setHeight(Math.ceil(y + 24)); sc.renderAll(); const url = sc.toDataURL({ format: 'png', multiplier: 1.6 }); sc.dispose(); EXZ.url = url; return url;
  })().catch(() => '').finally(() => { EXZ.busy = null; });
  return EXZ.busy;
}
