/* ════════════════════════════════════════════════════════════════════
   SELECT — one key on W.I.S.H. and PRINT, both faces, opens everything there is to put down: what has been made here (the
   example, stories, posters, songs, cards, constellations, boards, codes, any link), the stickers in their packs, and the lives
   near and further out. Chosen, it goes where that page works: onto the strip in PRINT, onto the board on W.I.S.H.'s studio
   side, and onto the receipt as its picture on W.I.S.H.'s quick side. A sheet from the foot on a phone, a panel beside the
   device on a wider screen. It is an uncased OLED module: bare board, black glass, pixel type, a small word under each key
   that matters, and a bright jumper wire from a header on the device it was opened from, following it wherever it is dragged
   ════════════════════════════════════════════════════════════════════ */
const PICK = { tab: 'made', to: 'strip' };
const PICK_TABS = [['made', 'stories', 'Made here', 'MADE'], ['stick', 'star5', 'Stickers', 'STICKERS'], ['lives', 'fauna', 'Lives', 'LIVES']];
/* the word under each kind of piece */
const PICK_W = { X: 'EXAMPLE', S: 'STORY', p: 'POSTER', R: 'SONG', T: 'CARD', c: 'SONG', b: 'BOARD', q: 'CODE' };
/* a first visit has made nothing yet: the lives near come first, then the stickers */
const pickTabs = () => (simple() ? [PICK_TABS[2], PICK_TABS[1]] : PICK_TABS);
function pickBody() {
  const t = PICK.tab, strip = PICK.to === 'strip';
  /* on the board, what is already on it shows as chosen; pressed again it comes off */
  const onB = PICK.to === 'board' && typeof boardPicks === 'function' ? boardPicks() : new Set();
  const it = (k, id, art, tip, cls = '') => `<li><button type="button" class="pk-it${cls}${onB.has(`${k}:${id}`) ? ' chosen' : ''}" data-pk-k="${k}" data-pk-id="${esc(String(id))}" aria-pressed="${onB.has(`${k}:${id}`)}" aria-label="${esc(tip)}">${art}${t === 'made' && PICK_W[k] ? `<i class="pk-kw" aria-hidden="true">${PICK_W[k]}</i>` : ''}</button></li>`;
  const img = (src, extra = '') => `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer"${extra}>`;
  /* first in every tab: words of one's own, and a photograph of one's own, onto whatever SELECT is wired to */
  const own = `${it('txt', '', '<b class="pk-aa">Aa</b>', 'Words, of one\'s own', ' ic own')}${it('img', '', icon('camera'), 'A photograph of one\'s own', ' ic own')}`;
  if (t === 'made') {
    const mine = S.signals.filter(x => !x.ex && !x.shared);
    const items = [
      ...(EXK ? [it('X', 'ex', EXZ.url ? img(EXZ.url) : icon('jelly'), 'The example zine')] : []),
      ...mine.slice(0, 12).map(x => it('S', x.key, `<img data-pk-slip="${esc(x.key)}" alt="">`, `${x.code}`)),
      ...POSTERS2.slice(0, 18).map(p => it('p', p.id, img(p.img), 'A poster')),
      ...(placed() ? [it('R', '', icon('sound'), 'The radio, now', ' ic')] : []),
      ...LOOPS.slice(0, 8).map(l => it('R', l.id, img(loopArt(l)), 'A song kept', ' round')),
      ...deck().slice(0, 24).map(c => it('T', c.id, `<img data-pk-card="${esc(c.id)}" alt="">`, c.name || 'A card')),
      ...strings.list().slice(0, 12).map(g => it('c', g.id, strings.chartOf(g.id, 56) || icon('string'), g.name, ' ic')),
      ...(strip ? BOARDS.map(b => it('b', b.id, `${icon('base')}<small>${esc(b.n)}</small>`, b.n, ' ic')) : []),
      ...(strip ? mine.slice(0, 12).map(x => it('q', x.key, `${icon('qr')}<small>${esc(x.code)}</small>`, `QR · ${x.code}`, ' ic')) : []),
    ];
    return `<ol class="pk-grid">${own}${items.join('')}</ol><form class="pk-link"><input type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://" aria-label="A link, as a code to scan"><button type="submit" class="ib" aria-label="The link as a code">${icon('qr')}<i class="pk-kw" aria-hidden="true">LINK</i></button></form>`;
  }
  if (t === 'stick') {
    const pk = stickNow();
    return `<div class="pk-packs">${Object.keys(PACKS_ALL).map(k => `<button type="button" class="pk-pack" data-pk-pack="${k}" aria-pressed="${PRESS.pack === k}" aria-label="${PACK_W[k]}"><img src="${sticker({ ...PACK_FACE[k], col: PRESS.pack === k ? '#0C0E0E' : '#7F939B' })}" alt=""></button>`).join('')}</div>`
      + `<ol class="pk-grid stk-g">${own}${PRESS.pack === 'life' ? PACKS.map((u, i) => it('pk', i, img(u), 'Sticker')).join('') : ''}${pk.map((st, i) => it('stk', i, img(sticker({ ...st, col: ZCOL })), st.w || 'Sticker')).join('')}<li><label class="pk-it ic" aria-label="Stickers of your own: pictures from this device">${icon('plus')}<input type="file" class="pk-own" accept="image/*" multiple hidden></label></li></ol>`;
  }
  const sps = radiusSpecies(18); const more = it('wild', 'more', icon('receive'), 'More animals, from further out', ` ic${wildBusy ? ' busy' : ''}`);
  const lives = [...sps.map(sp => ({ sp, k: 'L' })), ...WILD.map(sp => ({ sp, k: 'W' }))].slice(0, 30).map(({ sp, k }) => it(k, sp.id, img(photoURL(sp.ph, 'square')), sp.n)).join('');
  /* a first visit: the lives themselves, the nearest first, and more from further out last */
  if (simple()) return `<ol class="pk-grid round">${own}${lives}${more}</ol>`;
  return `<ol class="pk-grid round">${own}${it('wild', 'any', icon('die'), 'An animal, any', ' ic')}${it('wild', 'new', icon('star5'), 'The newest animal seen', ' ic')}${more}` + lives + '</ol>';
}
function pickRender() {
  const el = $('#pick'); if (!el) return;
  /* the lives' key shows a life, the nearest with a photograph */
  const face = k => { const sp = k === 'lives' && simple() ? radiusSpecies(1)[0] : null; return sp ? `<img class="pk-tf" src="${esc(photoURL(sp.ph, 'square'))}" alt="">` : null; };
  el.querySelector('.pk-tabs').innerHTML = pickTabs().map(([k, ic, w, word]) => `<button type="button" class="pk-tab" data-pk-tab="${k}" aria-pressed="${PICK.tab === k}" aria-label="${w}">${face(k) || icon(ic)}<i class="pk-tl" aria-hidden="true"></i><small class="pk-w" aria-hidden="true">${word}</small></button>`).join('');
  el.classList.toggle('simple', simple()); el.dataset.tab = PICK.tab;
  el.querySelector('.sel-b').innerHTML = pickBody(); pickFill(); requestAnimationFrame(selWire);
}
/* the pictures that take a moment: the stories as receipts, the cards */
async function pickFill() {
  for (const im of $$('#pick img[data-pk-slip]')) { const x = S.signals.find(v => v.key === im.dataset.pkSlip); if (!x) continue; try { const c = await slipCanvas(x, 120, 2, false, false); if (im.isConnected) im.src = c.toDataURL('image/png'); } catch (e) { /* left blank */ } }
  for (const im of $$('#pick img[data-pk-card]')) { const c = deck().find(v => v.id === im.dataset.pkCard); if (!c) continue; try { const u = await cardURL(c, 1); if (im.isConnected) im.src = u; } catch (e) { /* left blank */ } }
}
function openPick(to) {
  PICK.to = to; PICK.tab = simple() ? 'lives' : 'made'; let el = $('#pick');
  if (!el) {
    el = document.createElement('div'); el.id = 'pick'; el.className = 'sel'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Select');
    el.innerHTML = `<div class="sel-in"><i class="sel-pins" aria-hidden="true"></i><header class="sel-h"><i class="sel-grip" aria-hidden="true"></i><div class="pk-tabs"></div><button type="button" class="ib pk-x" data-pk-x aria-label="Close">${icon('close')}<small class="pk-w" aria-hidden="true">CLOSE</small></button></header><div class="sel-b"></div></div>`;
    document.body.appendChild(el);
  }
  el.dataset.to = to; el.hidden = false; pickRender(); snd.tick(1600); requestAnimationFrame(selWire);
}
const closePick = () => { const el = $('#pick'); if (el) el.hidden = true; selWire(); };
/* the jumper wire: from the key SELECT was opened by, sagging, to the header on the module's board */
let pickFrom = null;
const selWireEl = (() => { const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); el.setAttribute('class', 'sel-wire'); el.setAttribute('aria-hidden', 'true'); el.style.display = 'none'; document.body.appendChild(el); return el; })();
/* SELECT is never open without its wire: when the key it hangs from is gone (the page drawn again, another page, the device
   turned over), the wire moves to the SELECT key of the device now in front; with no device that takes a piece, it closes */
/* it hangs only from the main device's own key: the toolbars' ADD keys open it, but its wire goes to the device */
const PICK_KEYS = '#view [data-pick], #view [data-tp="pick"]';
const seen = el => !!el && el.isConnected && el.offsetParent !== null;
function selWire() {
  const sh = $('#pick'); const box = sh && $('#pick .sel-in'); const open = !!box && !sh.hidden;
  if (open && !seen(pickFrom)) { pickFrom = $$(PICK_KEYS).find(seen) || null; if (!pickFrom) { sh.hidden = true; } else { PICK.to = pickTo(); sh.dataset.to = PICK.to; } }
  const on = open && !sh.hidden && seen(pickFrom);
  selWireEl.style.display = on ? '' : 'none'; if (!on) return;
  const a = pickFrom.getBoundingClientRect(), b = box.getBoundingClientRect(); const x0 = a.left + a.width / 2, y0 = a.bottom - 4, x1 = b.left + 30, y1 = b.top - 2;
  const sag = Math.min(180, 40 + Math.hypot(x1 - x0, y1 - y0) * 0.3);
  selWireEl.setAttribute('width', innerWidth); selWireEl.setAttribute('height', innerHeight);
  selWireEl.innerHTML = `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}C${x0.toFixed(1)} ${(y0 + sag).toFixed(1)} ${x1.toFixed(1)} ${(y1 + sag).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}"/><rect x="${(x0 - 4).toFixed(1)}" y="${(y0 - 5).toFixed(1)}" width="8" height="10" rx="1.5"/><rect x="${(x1 - 4).toFixed(1)}" y="${(y1 - 8).toFixed(1)}" width="8" height="10" rx="1.5"/>`;
}
addEventListener('resize', selWire); addEventListener('scroll', selWire, true);
/* and checked as pages change under it */
setInterval(() => { const sh = $('#pick'); if (sh && !sh.hidden) selWire(); }, 300);
/* the device's key it was opened by, or the device's own when a toolbar's ADD opened it */
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('[data-pick], [data-tp="pick"], [data-zt="add"], [data-bt="add"]'); if (!t) return; pickFrom = t.matches('[data-zt="add"], [data-bt="add"]') ? ($$(PICK_KEYS).find(seen) || null) : t; }, true);
/* a picture for any of them, for the board or the receipt */
async function pickURL(k, id) {
  if (k === 'X') return exampleZineImage();
  if (k === 'S') { const x = S.signals.find(v => v.key === id); return x ? (await slipCanvas(x, 384, 2, isTty(), isConn())).toDataURL('image/png') : null; }
  if (k === 'p') return (POSTERS2.find(v => v.id === id) || {}).img || null;
  if (k === 'R') { const m = (id && (LOOPS.find(l => l.id === id) || MIXES.find(l => l.id === id))) || (placed() ? mixNow() : null); return m ? mixArt(m, mixURL(m)) : null; }
  if (k === 'T') { const c = deck().find(v => v.id === id); return c ? cardURL(c, 3) : null; }
  if (k === 'c') { const g = strings.list().find(v => String(v.id) === String(id)); return g ? figChart(g) : null; }
  if (k === 'stk') { const st = stickNow()[+id]; if (!st) return null; if (st.w) await faceReady(FACES[st.f || 0]); return sticker({ ...st, col: ZCOL }); }
  if (k === 'pk') return PACKS[+id] || null;
  if (k === 'L' || k === 'W') { const sp = (k === 'L' ? radiusSpecies(24) : WILD).find(v => v.id === String(id)); return sp ? speciesSticker(sp) : null; }
  if (k === 'wild') { const sp = wildSpecies(id); return sp ? speciesSticker(sp) : null; }
  return null;
}
/* a copy of what was chosen flies onto the receipt, so it is seen to land */
function flyToStrip(from) {
  const d = $('#zine .desk'); if (!d || !from || reduced() || $('#zine').hidden) return; const a = from.getBoundingClientRect(), b = d.getBoundingClientRect(); const im = from.querySelector('img');
  const el = document.createElement('div'); el.className = 'fly pk-fly'; el.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`; if (im && im.src) el.style.backgroundImage = `url("${im.src}")`; document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top + b.height * 0.42 - a.top - a.height / 2}px) scale(.6) rotate(8deg)`; el.style.opacity = '0'; });
  setTimeout(() => el.remove(), 650);
}
/* where a piece goes: the page open now, not the one SELECT was opened on */
const pickTo = () => (S.view === 2 ? 'strip' : S.view === 1 ? (faceOf(1) === 'back' ? 'board' : 'photo') : PICK.to);
async function pickPut(k, id, btn) {
  PICK.to = pickTo(); const sh = $('#pick'); if (sh) sh.dataset.to = PICK.to;
  if (k === 'wild' && id === 'more') { pullWild(); tick(1500); setTimeout(pickRender, 1600); return; }
  /* one's own words: typed on the receipt (its own words box), a new line of words on a strip of art, a note on the board */
  if (k === 'txt') { closePick(); if (PICK.to === 'strip') { if (typeof jObj === 'function' && jObj('words')) jEdit(); else await zineTool('text'); } else if (PICK.to === 'board') await boardTool('note'); else { const f = $('#jw-for') || $('#wf-for'); if (f) f.focus(); } snd.tick(1500); return; }
  /* one's own photograph: chosen from the phone or the computer, onto the same */
  if (k === 'img') { if (PICK.to === 'strip') $('#zine-file').click(); else if (PICK.to === 'board') $('#board-file').click(); else { const f = $('#wf-photo'); if (f) f.click(); else tick(600); } return; }
  if (btn) { btn.classList.add('put'); setTimeout(() => btn.classList.remove('put'), 500); if (PICK.to === 'strip') flyToStrip(btn); }
  if (PICK.to === 'strip') {
    if (k === 'stk') { const st = stickNow()[+id]; if (!st) return; if (st.w) await faceReady(FACES[st.f || 0]); placeOnPage(sticker({ ...st, col: ZCOL }), 'sticker', st.w ? 130 : st.j ? 90 : 70, false, stickerColour(st)); if (st.j) snd.jelly(0.3); }
    else if (k === 'pk') placeOnPage(PACKS[+id], 'sticker', 90, true);
    else if (k === 'wild') { const u = await pickURL(k, id); if (u) placeOnPage(u, 'sticker', 96, true); else tick(600); }
    else await pieceOn(k, id);
  } else {
    /* chosen already on the board: taken off again */
    if (PICK.to === 'board' && typeof boardUnpick === 'function' && boardUnpick(`${k}:${id}`)) { pickRender(); snd.tick(900); return; }
    const u = await pickURL(k, id); if (!u) { tick(600); return; }
    const big = /^(X|S|p|T|R)$/.test(k);
    if (PICK.to === 'board') { await addToBoard(big ? await thumbOf(u, 360) : u, k === 'stk' || k === 'pk' ? 'sticker' : 'art', big ? 200 : 110, `${k}:${id}`); pickRender(); }
    else { WDRAFT.photo = await thumbOf(u, 700); store.set('da.wish.v1', WDRAFT); refreshPanel(); }
  }
  tick(1500);
}
document.addEventListener('click', e => {
  /* SELECT's key opens it, and pressed again while it hangs from that key, closes it */
  const opener = e.target.closest('[data-pick]'); if (opener) { const sh = $('#pick'); if (sh && !sh.hidden && (pickFrom === opener || pickFrom === null)) { closePick(); tick(1000); return; } openPick(opener.dataset.pick === 'wish' ? (faceOf(1) === 'back' ? 'board' : 'photo') : opener.dataset.pick); return; }
  const el = e.target.closest('#pick'); if (!el) return;
  if (e.target === el || e.target.closest('[data-pk-x]')) { closePick(); tick(1000); return; }
  const tb = e.target.closest('[data-pk-tab]'); if (tb) { PICK.tab = tb.dataset.pkTab; pickRender(); snd.tick(1400); return; }
  const pp = e.target.closest('[data-pk-pack]'); if (pp) { PRESS.pack = pp.dataset.pkPack; if (PRESS.pack === 'words' || PRESS.pack === 'ideas') Promise.all(FACES.map(faceReady)).then(pickRender); pickRender(); snd.tick(1300); return; }
  const b = e.target.closest('[data-pk-k]'); if (b) pickPut(b.dataset.pkK, b.dataset.pkId, b);
});
document.addEventListener('submit', e => {
  if (!e.target.closest('#pick .pk-link')) return; e.preventDefault(); const inp = e.target.querySelector('input'); const u = (inp.value || '').trim(); if (!u) { nudge(inp); return; }
  const mx = (u.match(/#mix=([^&\s]+)/) || [])[1]; const m = mx ? mixOfCode(decodeURIComponent(mx)) : null; const art = m ? mixArt(m, u) : qrImage(u); if (!art) { tick(600); return; }
  if (PICK.to === 'strip') placeOnPage(art, m ? 'art' : 'qr', m ? 240 : 120); else if (PICK.to === 'board') addToBoard(art, 'art', 140); else { thumbOf(art, 700).then(p => { WDRAFT.photo = p; store.set('da.wish.v1', WDRAFT); refreshPanel(); }); }
  inp.value = ''; tick(1500);
});
document.addEventListener('change', async e => { if (!e.target.closest('#pick .pk-own')) return; await addPack(e.target.files); e.target.value = ''; PRESS.pack = 'life'; pickRender(); snd.tick(1900); });
addEventListener('keydown', e => { if (e.key === 'Escape' && $('#pick') && !$('#pick').hidden) closePick(); });

/* the sheet dragged by its head, anywhere on the screen; where it was left, it opens again */
let selDrag = null;
document.addEventListener('pointerdown', e => { const h = e.target.closest('#pick .sel-h'); if (!h || e.target.closest('button')) return; const box = $('#pick .sel-in'); const r = box.getBoundingClientRect(); selDrag = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top }; h.setPointerCapture(e.pointerId); e.preventDefault(); });
document.addEventListener('pointermove', e => { if (!selDrag || e.pointerId !== selDrag.id) return; const box = $('#pick .sel-in'); const w = box.offsetWidth, hh = box.offsetHeight; const x = clamp(e.clientX - selDrag.dx, 4, innerWidth - w - 4), y = clamp(e.clientY - selDrag.dy, 4, innerHeight - hh - 4); $('#pick').classList.add('moved'); box.style.left = `${x}px`; box.style.top = `${y}px`; selWire(); });
document.addEventListener('pointerup', e => { if (selDrag && e.pointerId === selDrag.id) selDrag = null; });
/* a row wider than SELECT (the sticker packs, a phone's tray): on a desk the wheel turns it sideways and a mouse drags it, as a
   finger does; a drag is not a press */
const sideRow = t => t && t.closest && t.closest('.pk-packs, #pick .pk-grid');
document.addEventListener('wheel', e => { const row = sideRow(e.target); if (!row || row.scrollWidth <= row.clientWidth + 2 || getComputedStyle(row).overflowX === 'visible' || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return; e.preventDefault(); row.scrollLeft += e.deltaY; }, { passive: false });
let rowDrag = null;
document.addEventListener('pointerdown', e => { const row = e.pointerType === 'mouse' && e.button === 0 && sideRow(e.target); rowDrag = row && row.scrollWidth > row.clientWidth + 2 ? { row, x: e.clientX, l: row.scrollLeft, on: false } : null; });
addEventListener('pointermove', e => { const d = rowDrag; if (!d) return; const dx = e.clientX - d.x; if (!d.on && Math.abs(dx) < 6) return; d.on = true; d.row.scrollLeft = d.l - dx; });
addEventListener('pointerup', () => { const d = rowDrag; rowDrag = null; if (!d || !d.on) return; const stop = ev => { ev.stopPropagation(); ev.preventDefault(); }; addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => removeEventListener('click', stop, { capture: true }), 300); });
