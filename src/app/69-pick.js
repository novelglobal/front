/* ════════════════════════════════════════════════════════════════════
   SELECT — one key on W.I.S.H. and PRINT, both faces, opens everything there is to put down: what has been made here (the
   example, stories, posters, songs, cards, constellations, boards, codes, any link), the stickers in their packs, and the lives
   near and further out. Chosen, it goes where that page works: onto the strip in PRINT, onto the board on W.I.S.H.'s studio
   side, and onto the receipt as its picture on W.I.S.H.'s quick side. A sheet from the foot on a phone, a panel beside the
   device on a wider screen
   ════════════════════════════════════════════════════════════════════ */
const PICK = { tab: 'made', to: 'strip' };
const PICK_TABS = [['made', 'stories', 'Made here'], ['stick', 'star5', 'Stickers'], ['lives', 'fauna', 'Lives']];
function pickBody() {
  const t = PICK.tab, strip = PICK.to === 'strip';
  const it = (k, id, art, tip, cls = '') => `<li><button type="button" class="pk-it${cls}" data-pk-k="${k}" data-pk-id="${esc(String(id))}" aria-label="${esc(tip)}">${art}</button></li>`;
  const img = (src, extra = '') => `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer"${extra}>`;
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
    return `<ol class="pk-grid">${items.join('')}</ol><form class="pk-link"><input type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://" aria-label="A link, as a code to scan"><button type="submit" class="ib" aria-label="The link as a code">${icon('qr')}</button></form>`;
  }
  if (t === 'stick') {
    const pk = stickNow();
    return `<div class="pk-packs">${Object.keys(PACKS_ALL).map(k => `<button type="button" class="pk-pack" data-pk-pack="${k}" aria-pressed="${PRESS.pack === k}" aria-label="${PACK_W[k]}"><img src="${sticker({ ...PACK_FACE[k], col: PRESS.pack === k ? '#0C0E0E' : '#7F939B' })}" alt=""></button>`).join('')}</div>`
      + `<ol class="pk-grid stk-g">${PRESS.pack === 'life' ? PACKS.map((u, i) => it('pk', i, img(u), 'Sticker')).join('') : ''}${pk.map((st, i) => it('stk', i, img(sticker({ ...st, col: ZCOL })), st.w || 'Sticker')).join('')}<li><label class="pk-it ic" aria-label="Stickers of your own: pictures from this device">${icon('plus')}<input type="file" class="pk-own" accept="image/*" multiple hidden></label></li></ol>`;
  }
  const sps = radiusSpecies(18);
  return `<ol class="pk-grid round">${it('wild', 'any', icon('die'), 'An animal, any', ' ic')}${it('wild', 'new', icon('star5'), 'The newest animal seen', ' ic')}${it('wild', 'more', icon('receive'), 'More animals, from further out', ` ic${wildBusy ? ' busy' : ''}`)}`
    + [...sps.map(sp => ({ sp, k: 'L' })), ...WILD.map(sp => ({ sp, k: 'W' }))].slice(0, 30).map(({ sp, k }) => it(k, sp.id, img(photoURL(sp.ph, 'square')), sp.n)).join('') + '</ol>';
}
function pickRender() {
  const el = $('#pick'); if (!el) return;
  el.querySelector('.pk-tabs').innerHTML = PICK_TABS.map(([k, ic, w]) => `<button type="button" class="pk-tab" data-pk-tab="${k}" aria-pressed="${PICK.tab === k}" aria-label="${w}">${icon(ic)}</button>`).join('');
  el.querySelector('.sel-b').innerHTML = pickBody(); pickFill();
}
/* the pictures that take a moment: the stories as receipts, the cards */
async function pickFill() {
  for (const im of $$('#pick img[data-pk-slip]')) { const x = S.signals.find(v => v.key === im.dataset.pkSlip); if (!x) continue; try { const c = await slipCanvas(x, 120, 2, false, false); if (im.isConnected) im.src = c.toDataURL('image/png'); } catch (e) { /* left blank */ } }
  for (const im of $$('#pick img[data-pk-card]')) { const c = deck().find(v => v.id === im.dataset.pkCard); if (!c) continue; try { const u = await cardURL(c, 1); if (im.isConnected) im.src = u; } catch (e) { /* left blank */ } }
}
function openPick(to) {
  PICK.to = to; PICK.tab = 'made'; let el = $('#pick');
  if (!el) {
    el = document.createElement('div'); el.id = 'pick'; el.className = 'sel'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Select');
    el.innerHTML = `<div class="sel-in"><header class="sel-h"><i class="sel-grip" aria-hidden="true"></i><div class="pk-tabs"></div><button type="button" class="ib pk-x" data-pk-x aria-label="Close">${icon('close')}</button></header><div class="sel-b"></div></div>`;
    document.body.appendChild(el);
  }
  el.dataset.to = to; el.hidden = false; pickRender(); snd.tick(1600); buzz(5);
}
const closePick = () => { const el = $('#pick'); if (el) el.hidden = true; };
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
/* where a piece goes: the page open now, not the one SELECT was opened on */
const pickTo = () => (S.view === 2 ? 'strip' : S.view === 1 ? (faceOf(1) === 'back' ? 'board' : 'photo') : PICK.to);
async function pickPut(k, id, btn) {
  PICK.to = pickTo(); const sh = $('#pick'); if (sh) sh.dataset.to = PICK.to;
  if (k === 'wild' && id === 'more') { pullWild(); tick(1500); setTimeout(pickRender, 1600); return; }
  if (btn) { btn.classList.add('put'); setTimeout(() => btn.classList.remove('put'), 500); }
  if (PICK.to === 'strip') {
    if (k === 'stk') { const st = stickNow()[+id]; if (!st) return; if (st.w) await faceReady(FACES[st.f || 0]); placeOnPage(sticker({ ...st, col: ZCOL }), 'sticker', st.w ? 130 : st.j ? 90 : 70); if (st.j) snd.jelly(0.3); }
    else if (k === 'pk') placeOnPage(PACKS[+id], 'sticker', 90, true);
    else if (k === 'wild') { const u = await pickURL(k, id); if (u) placeOnPage(u, 'sticker', 96, true); else tick(600); }
    else await pieceOn(k, id);
  } else {
    const u = await pickURL(k, id); if (!u) { tick(600); return; }
    const big = /^(X|S|p|T|R)$/.test(k);
    if (PICK.to === 'board') await addToBoard(big ? await thumbOf(u, 360) : u, k === 'stk' || k === 'pk' ? 'sticker' : 'art', big ? 200 : 110);
    else { WDRAFT.photo = await thumbOf(u, 700); store.set('da.wish.v1', WDRAFT); refreshPanel(); wishPreview(); }
  }
  tick(1500); buzz(5);
}
document.addEventListener('click', e => {
  const opener = e.target.closest('[data-pick]'); if (opener) { openPick(opener.dataset.pick === 'wish' ? (faceOf(1) === 'back' ? 'board' : 'photo') : opener.dataset.pick); return; }
  const el = e.target.closest('#pick'); if (!el) return;
  if (e.target === el || e.target.closest('[data-pk-x]')) { closePick(); tick(1000); return; }
  const tb = e.target.closest('[data-pk-tab]'); if (tb) { PICK.tab = tb.dataset.pkTab; pickRender(); snd.tick(1400); return; }
  const pp = e.target.closest('[data-pk-pack]'); if (pp) { PRESS.pack = pp.dataset.pkPack; if (PRESS.pack === 'words' || PRESS.pack === 'ideas') Promise.all(FACES.map(faceReady)).then(pickRender); pickRender(); snd.tick(1300); return; }
  const b = e.target.closest('[data-pk-k]'); if (b) pickPut(b.dataset.pkK, b.dataset.pkId, b);
});
document.addEventListener('submit', e => {
  if (!e.target.closest('#pick .pk-link')) return; e.preventDefault(); const inp = e.target.querySelector('input'); const u = (inp.value || '').trim(); if (!u) { nudge(inp); return; }
  const mx = (u.match(/#mix=([^&\s]+)/) || [])[1]; const m = mx ? mixOfCode(decodeURIComponent(mx)) : null; const art = m ? mixArt(m, u) : qrImage(u); if (!art) { tick(600); return; }
  if (PICK.to === 'strip') placeOnPage(art, m ? 'art' : 'qr', m ? 240 : 120); else if (PICK.to === 'board') addToBoard(art, 'art', 140); else { thumbOf(art, 700).then(p => { WDRAFT.photo = p; store.set('da.wish.v1', WDRAFT); refreshPanel(); wishPreview(); }); }
  inp.value = ''; tick(1500);
});
document.addEventListener('change', async e => { if (!e.target.closest('#pick .pk-own')) return; await addPack(e.target.files); e.target.value = ''; PRESS.pack = 'life'; pickRender(); snd.tick(1900); });
addEventListener('keydown', e => { if (e.key === 'Escape' && $('#pick') && !$('#pick').hidden) closePick(); });

/* the sheet dragged by its head, anywhere on the screen; where it was left, it opens again */
let selDrag = null;
document.addEventListener('pointerdown', e => { const h = e.target.closest('#pick .sel-h'); if (!h || e.target.closest('button')) return; const box = $('#pick .sel-in'); const r = box.getBoundingClientRect(); selDrag = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top }; h.setPointerCapture(e.pointerId); e.preventDefault(); });
document.addEventListener('pointermove', e => { if (!selDrag || e.pointerId !== selDrag.id) return; const box = $('#pick .sel-in'); const w = box.offsetWidth, hh = box.offsetHeight; const x = clamp(e.clientX - selDrag.dx, 4, innerWidth - w - 4), y = clamp(e.clientY - selDrag.dy, 4, innerHeight - hh - 4); $('#pick').classList.add('moved'); box.style.left = `${x}px`; box.style.top = `${y}px`; });
document.addEventListener('pointerup', e => { if (selDrag && e.pointerId === selDrag.id) selDrag = null; });
