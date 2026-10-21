/* ════════════════════════════════════════════════════════════════════
   THE FIRST VISIT — one simple way through, gate by gate, before the whole of it. The map alone; a tap, and the radar lands
   with a small radio. Something noticed (a life, a place, a printer, a group, a string tied), and W.I.S.H. opens over the map:
   the receipt as intel, the intention device beside it, a few stories to take up. An intention made, and PRINT: the receipt,
   the words typed on it, SELECT to add to it, the code to scan. Printed, and everything is there, the jellyfish keys too.
   RADIO is for discovering, W.I.S.H. for what we noticed, PRINT for remembering: said by light, motion and sound, never words.
   prefs.journey keeps how far: 0 the map, 1 the radio, 2 W.I.S.H., 3 PRINT, 4 done. Done on a device, it stays done; a link
   someone was sent skips the bare map; the tiny NOVEL.GLOBAL in the information corner, pressed twice, opens everything;
   Settings plays it again. What a first visit walks through is how the fronts work for everyone after it: W.I.S.H.'s front over
   the map with its receipt as intel and its suggestions, and PRINT's receipt with its words and its code (42-faces.js draws
   the devices)
   ════════════════════════════════════════════════════════════════════ */
const JR = Object.assign({ sel: null, want: '', acts: [], key: '' }, store.get('da.journey.v1', {})); if (!Array.isArray(JR.acts)) JR.acts = []; delete JR.act;
const saveJR = () => store.set('da.journey.v1', JR);
/* the furthest page a first visit has reached: RADIO with the radar, then W.I.S.H., then PRINT */
const jMax = () => (simple() ? clamp(prefs.journey - 1, 0, 2) : 3);
function jMarks() {
  const b = document.body, on = simple();
  b.classList.toggle('simple', on); for (let i = 0; i < 4; i++) b.classList.toggle(`j${i}`, on && prefs.journey === i);
  $$('#rail .tab').forEach(t => t.classList.toggle('locked', on && +t.dataset.i > jMax()));
}
/* a gate passed: kept, the next page let in, and answered with a note more of the rising figure and a breath of light */
function jGo(st, quiet) {
  if (!simple() || st <= prefs.journey) return false;
  prefs.journey = Math.min(4, st); savePrefs(); jMarks(); jHint();
  /* PRINT is next: its drawing engine is fetched now, so the strip opens at once */
  if (st === 2) (window.requestIdleCallback || setTimeout)(() => loadFabric().catch(() => {}));
  if (prefs.journey >= 4) { jDone(quiet); return true; }
  if (quiet) return true;
  snd.gate(st + 1); jLight();
  const t = $(`#rail .tab[data-i="${st - 1}"]`); if (t) { t.classList.remove('arrive'); void t.offsetWidth; t.classList.add('arrive'); setTimeout(() => t.classList.remove('arrive'), 1800); }
  document.body.classList.remove('jr-in'); void document.body.offsetWidth; document.body.classList.add('jr-in'); setTimeout(() => document.body.classList.remove('jr-in'), 1400);
  return true;
}
/* light, from the edges in, and gone */
function jLight(big) {
  if (reduced() && !big) return; const el = document.createElement('i'); el.className = `jr-light${big ? ' big' : ''}`; el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el); setTimeout(() => el.remove(), big ? 2400 : 1300);
}
/* everything unlocked: the rising figure brought home, the jellyfish rise, and every page comes back as it is, its key to turn it over */
function jDone(quiet) {
  prefs.journey = 4; savePrefs(); stepsQuiet(); jMarks(); jHint(); jrShow();
  if (!quiet) { snd.gate(5); jLight(true); jBurst(); }
  if (S.open && !S.mode) { headBar(); renderView(); }
}
function jBurst() {
  const el = document.createElement('div'); el.className = 'jr-burst'; el.setAttribute('aria-hidden', 'true'); const r = seeded(String(Date.now()));
  el.innerHTML = Array.from({ length: 12 }, (_, i) => `<i class="jr-j" style="--x:${Math.round(4 + r() * 88)}%;--d:${(i * 0.16 + r() * 0.3).toFixed(2)}s;--s:${(0.6 + r() * 0.9).toFixed(2)};--w:${Math.round(r() * 40 - 20)}px">${M.jellySVG('currentColor', 'rgba(127,255,224,.16)', 64)}</i>`).join('');
  document.body.appendChild(el); setTimeout(() => el.remove(), reduced() ? 1800 : 5600);
}

/* ───────── the next thing to touch says so with light alone: a soft sonar ring rising from it. On the bare map, where life
   gathers round the radar's first place; on the radio, the life the sweep has found that the heat puts most at risk ───────── */
const sonar = (() => { const el = document.createElement('i'); el.className = 'jr-sonar'; el.hidden = true; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<b></b><b></b><b></b>'; document.body.appendChild(el); return el; })();
let hintIt = null;
/* where life gathers on the screen now: the marks counted in small squares, the square with the most round it, the middle of
   those marks; the middle of the map until there are any */
let gatherK = '', gatherXY = null;
function gatherAt() {
  const c = map.getCenter(), r = map.getContainer().getBoundingClientRect(); const k = `${c.lng.toFixed(5)}|${c.lat.toFixed(5)}|${map.getZoom().toFixed(2)}|${life.items.length}|${Math.round(r.width)}`;
  if (k === gatherK) return gatherXY; gatherK = k; gatherXY = [r.width / 2, r.height / 2];
  const G = 64, B = new Map(); const cellOf = it => [Math.floor((it.x + (it.dx || 0)) / G), Math.floor((it.y + (it.dy || 0)) / G)];
  const pts = life.items.filter(it => it.x != null && !it.o.hist && !it.o.story && !it.o.pack && life.shown(it) && it.x > 40 && it.y > 70 && it.x < r.width - 40 && it.y < r.height - 70);
  for (const it of pts) { const [i, j] = cellOf(it); B.set(`${i},${j}`, (B.get(`${i},${j}`) || 0) + 1); }
  let best = null, bs = 0; for (const key of B.keys()) { const [i, j] = key.split(',').map(Number); let s = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += B.get(`${i + a},${j + b}`) || 0; if (s > bs) { bs = s; best = [i, j]; } }
  if (best) { const near = pts.filter(it => { const [i, j] = cellOf(it); return Math.abs(i - best[0]) <= 1 && Math.abs(j - best[1]) <= 1; }); gatherXY = [near.reduce((a, it) => a + it.x + (it.dx || 0), 0) / near.length, near.reduce((a, it) => a + it.y + (it.dy || 0), 0) / near.length]; }
  return gatherXY;
}
function jHint() {
  const st = simple() ? prefs.journey : 4; let at = null;
  if (st === 0 && S.mapReady && !$('#jr-veil')) at = gatherAt();
  else if (st === 1 && S.mapReady && S.view === 0 && !S.mode && placed()) {
    if (!hintIt || !hintIt.inS || !life.shown(hintIt) || hintIt.binned) hintIt = life.items.filter(it => it.inS && !it.binned && life.shown(it) && typeof it.o.id === 'number' && !it.o.hum && !it.o.hist && !isCold(it.o) && life.seen().has(it.o.id)).sort((a, b) => degOf(b.o) - degOf(a.o) || (b.b.tier || 0) - (a.b.tier || 0))[0] || null;
    if (hintIt) at = [hintIt.x + (hintIt.dx || 0), hintIt.y + (hintIt.dy || 0)];
  }
  /* on W.I.S.H., a life held and nothing tied to it yet: the place nearest it, to tie a string to */
  else if (st === 2 && !phone() && S.mapReady && S.view === 1 && !S.mode && JR.sel && JR.sel.k === 'life' && !((JR.sel.fig || {}).nodes || []).length) {
    let bd = 600; for (let i = 0; i < 600; i++) { const p = life.place(i); if (!p) break; if (p._x == null) continue; const d = haversine(JR.sel.lat, JR.sel.lng, p.lat, p.lng); if (d < bd) { bd = d; at = [p._x, p._y]; } }
  }
  if (at) { const r = map.getContainer().getBoundingClientRect(); const x = r.left + at[0], y = r.top + at[1]; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) at = null; else sonar.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`; }
  sonar.hidden = !at; sonar.classList.toggle('on', !!at && st >= 1);
}
map.on('move', () => { if (simple()) jHint(); jHeld(); });
setInterval(() => { if (simple() || !sonar.hidden) jHint(); }, 900);

/* ───────── the veil, on a first visit only: dark and half clear over the map as it loads, small white words, held five
   seconds or until a touch. A touch is answered with the first sound, one deep note and its echo ───────── */
function jVeil() {
  if (!simple() || prefs.journey > 0 || $('#jr-veil')) return;
  const v = document.createElement('div'); v.id = 'jr-veil'; v.className = 'jr-veil'; v.innerHTML = '<p class="jv-q">What have you noticed?</p>';
  document.body.appendChild(v); document.body.classList.add('veiled');
  let gone = false; const go = touched => { if (gone) return; gone = true; clearTimeout(t); if (touched) snd.gate(1); v.classList.add('out'); document.body.classList.remove('veiled'); setTimeout(() => { v.remove(); jHint(); }, reduced() ? 0 : 900); };
  const t = setTimeout(() => go(false), 5000);
  v.addEventListener('click', e => { e.preventDefault(); go(true); });
}

/* ───────── the map, on a first visit: any tap puts the radar down there, and the radio comes up with it ───────── */
function jRadio() {
  if (!jGo(1)) return; hintIt = null;
  setTimeout(() => { setView(0); if (phone()) setPane('page'); }, reduced() ? 0 : 160);
}
/* W.I.S.H.'s front stands over the map: there, once everything is open as on a first visit, what is touched is what is noticed */
const wishOverMap = () => S.open && S.view === 1 && faceOf(1) === 'front' && !S.mode;
/* what was touched on the map: a place of the human ecology is a location noticed (a life goes through select). On a first
   visit from any page it has reached; once everything is open, on W.I.S.H.'s front */
function jTap(h) {
  if (!h || (simple() ? prefs.journey < 1 : !wishOverMap())) return false;
  if (h.kind === 'place') { const p = life.place(h.id); if (!p) return false; if (S.view === 1 && JR.sel && JR.sel.k === 'life') return jTie(p); return jPick(jSelPlace(p), [p._x, p._y]); }
  if (h.kind === 'new') return true;
  return false;
}

/* ───────── something noticed: kept as the receipt will need it, since the map's own records come and go, and W.I.S.H. opens
   over the map to hold it. The first time, its tab flies into the rail first ───────── */
function jPick(sel, at) {
  if (!sel || (simple() && prefs.journey < 1)) return false;
  const first = simple() && prefs.journey < 2; JR.sel = sel; if (first) JR.want = '';
  /* the suggestions taken up stay while they still fit what is held */
  JR.acts = first ? [] : (JR.acts || []).filter(k => jActs().some(a => a.k === k)); saveJR(); hintIt = null; life.hover(null); $('#tag').hidden = true;
  /* in its own voice; the first time, the gate's note answers alone */
  if (!first) { const pl = sel.k === 'place'; snd.knot(pl ? { fam: sel.fam } : { g: sel.g }, F0 * partialOf(pl ? sel.fam : sel.g), 0, 0.7, 0); }
  if (first) { jGo(2); jFly(at, 1); setTimeout(() => { setView(1); if (phone()) setPane('page'); }, reduced() ? 0 : 560); }
  else { if (S.view !== 1) setView(1); else { jrShow(); jPreview(); } }
  return true;
}
/* a small copy of what was touched flies from where it was to its tab */
function jFly(at, i) {
  if (!at || reduced()) return; const r = map.getContainer().getBoundingClientRect(); const el = document.createElement('i');
  el.style.cssText = `position:fixed;left:${Math.round(r.left + at[0])}px;top:${Math.round(r.top + at[1])}px;width:2px;height:2px`; document.body.appendChild(el);
  flyToTab(i, el); setTimeout(() => el.remove(), 50);
}
const PHONE_W = { 'tel:1800675888': '1800 675 888', 'tel:136186': '136 186', 'tel:0384007300': '(03) 8400 7300' };
const ALARM_W = { injured: 'HURT', dead: 'DEAD · DO NOT TOUCH', lost: 'LOST' };
/* a life (or any record on the map): its photograph that may print, its name, its danger ahead, why, where and when */
function jSelLife(o) {
  const sub = subjectOf(o); const c = o.isTribe ? { k: 'none' } : imgChoice(o); const alarm = isAlarm(o) ? o.kind : ''; const K = !o.isTribe && (live(o) || kindLife(o));
  const img = c.k === 'inat' ? { k: 'inat', u: c.u, a: c.a || '', l: c.l || '', oid: c.oid || null } : null;
  return { k: 'life', id: o.id, iid: typeof sub.id === 'number' ? sub.id : null, lat: +(+o.lat).toFixed(5), lng: +(+o.lng).toFixed(5), n: nameOf(o), latin: sub.tx && sub.tx.cn && sub.tx.n && sub.tx.n !== sub.tx.cn ? sub.tx.n : '', g: lifeOf(o), place: placeOf(o),
    deg: K && !alarm && !isCold(o) ? degOf(o) : 0, when: K && !alarm ? whenWord(o) : '', threat: K && !alarm ? threatOf(o) : '', alarm, tel: alarm ? telOf(o) : '', seen: stampOf(o) || 0, img, ...(o.photo && /^data:/.test(o.photo) ? { photo: o.photo } : {}) };
}
/* a place of the human ecology: its part, what it does that matters here, where */
function jSelPlace(p) {
  const b = bizNear(p.lat, p.lng, 40).find(x => x.n === p.n) || {}; const role = b.role || '';
  const harm = (b.h || []).map(r => (ROLES[r] || {}).w).filter(Boolean);
  return { k: 'place', n: p.n, fam: p.fam || b.fam || 'service', role, harm, lat: +(+p.lat).toFixed(5), lng: +(+p.lng).toFixed(5), place: suburbAt(p.lat, p.lng), addr: b.addr || '', g: 'paw' };
}
const jSelPrinter = p => ({ k: 'printer', id: p.id, n: p.n, lat: +(+p.lat).toFixed(5), lng: +(+p.lng).toFixed(5), place: suburbAt(p.lat, p.lng), addr: [p.addr, title(p.sub)].filter(Boolean).join(', '), on: !!(PSTATE[p.id] || {}).ready, g: 'paw' });
const jSelGroup = t => ({ k: 'group', id: t.id, n: t.n, w: t.w || '', when: t.when || '', kind: t.kind, lat: +(+t.lat).toFixed(5), lng: +(+t.lng).toFixed(5), place: suburbAt(t.lat, t.lng), g: 'paw' });
/* on W.I.S.H., a place touched while a life is held is tied to it: a string from the life to the place, on the receipt with
   what that place does that matters here; touched again, it is let go */
function jTie(p) {
  const s = JR.sel; if (!s || s.k !== 'life') return false; const b = bizNear(p.lat, p.lng, 40).find(x => x.n === p.n) || {}; const key = `b:${p.n}`;
  const fig = s.fig && s.fig.nodes ? s.fig : { nodes: [], edges: [] }; const at = fig.nodes.findIndex(n => n.k === key);
  if (at >= 0) { fig.nodes.splice(at, 1); fig.edges = fig.edges.filter(e => !e.includes(key)); snd.snap(0); }
  else { if (fig.nodes.length >= 4) { const k0 = fig.nodes.shift().k; fig.edges = fig.edges.filter(e => !e.includes(k0)); } const d = haversine(s.lat, s.lng, p.lat, p.lng);
    fig.nodes.push({ k: key, t: 'biz', n: p.n, role: b.role || '', h: b.h || [], fam: p.fam || b.fam || 'service', b: Math.round(bearing(s.lat, s.lng, p.lat, p.lng)), d: Math.round(d) }); fig.edges.push(['pin', key]); snd.pluck(clamp(d / 600, 0, 1), 0); }
  s.fig = fig; saveJR(); jHint(); jHeld(); jPreview(); buzz(6); return true;
}
/* a string tied: the life, and the figure as it lies on the ground */
function jSelConn() { const o = S.byId.get(S.sel); if (!o) return null; return { ...jSelLife(o), fig: strings.snapshot() }; }
/* nothing touched yet, once everything is open: the receipt is of where the radar stands */
const jHere = () => ({ k: 'here', n: suburbAt(S.scan.lat, S.scan.lng), lat: +S.scan.lat.toFixed(5), lng: +S.scan.lng.toFixed(5), place: suburbAt(S.scan.lat, S.scan.lng), g: 'paw' });
const jSel = () => JR.sel || jHere();
/* an intention of one's own, or a suggestion taken up: either is enough to make */
const jWants = () => !!(String(JR.want || '').trim() || (JR.acts || []).length);

/* ───────── the receipt, as intel and not as art: what was noticed and nothing more. The photograph or the thing's own mark,
   its name, its danger ahead and when, one line of why, a number to call when it is hurt, the string tied, where and when;
   then the intention, heavy, once there is one, and the story's how. On W.I.S.H. it carries no code to scan ───────── */
function jSignal(code, at) {
  const s = jSel(); const want = String(JR.want || '').trim(); const acts = jChosen();
  /* a line too long for its four is cut after its last whole word */
  const cut = t => { t = String(t || ''); if (t.length <= SIG.line) return t; const c = t.slice(0, SIG.line - 1); return `${c.replace(/\s+\S*$/, '') || c}…`; };
  /* the four lines carry it too, short, for wherever the story goes without its receipt: what we know, the intention, what to do */
  const L = { w: cut((acts[0] || {}).f), i: cut(want || (acts[0] || {}).w), s: cut(acts.map(a => a.w).join(' · ')), h: '' }; const fig = s.fig || { nodes: [], edges: [] }; const fr = want || acts.map(a => a.w).join(' · ');
  return { v: 1, code: code || 'DA-····', at: at || Date.now(), pin: { id: s.iid || null, lat: s.lat, lng: s.lng, n: s.latin || '', cn: s.n || '', g: s.g || 'paw', place: s.place || suburbAt(s.lat, s.lng) }, threat: '', when: s.when || '', deg: s.deg || 0, lines: L, nodes: fig.nodes || [], edges: fig.edges || [], who: S.me.by || '', ...(fr ? { for: fr, note: want } : {}), acts: acts.map(a => ({ k: a.k, w: a.w, f: a.f })), ...(s.img ? { img: s.img } : {}), jr: 1, jsel: s };
}
/* a place's part as a mark, in ink: a diamond for a shop or a brand, a room for a third space, three linked dots for a network */
function famArt(x, fam, harm, cx, cy, R) {
  x.save(); x.fillStyle = '#000'; x.strokeStyle = '#000'; x.lineWidth = R * 0.12;
  const dia = (rr, fill) => { x.beginPath(); x.moveTo(cx, cy - rr); x.lineTo(cx + rr, cy); x.lineTo(cx, cy + rr); x.lineTo(cx - rr, cy); x.closePath(); if (fill) x.fill(); else x.stroke(); };
  if (fam === 'third') { const h = R * 0.8; x.strokeRect(cx - h, cy - h, h * 2, h * 2); x.beginPath(); x.arc(cx, cy, h * 0.34, 0, Math.PI * 2); x.fill(); }
  else if (fam === 'network') { const P = [[0, -R], [R * 0.95, R * 0.6], [-R * 0.95, R * 0.6]]; x.beginPath(); P.forEach(([a, b], i) => (i ? x.lineTo(cx + a, cy + b) : x.moveTo(cx + a, cy + b))); x.closePath(); x.stroke(); for (const [a, b] of P) { x.beginPath(); x.arc(cx + a, cy + b, R * 0.3, 0, Math.PI * 2); x.fill(); } }
  else { dia(R, harm); if (!harm) { dia(R * 0.62, false); x.beginPath(); x.arc(cx, cy, R * 0.18, 0, Math.PI * 2); x.fill(); } }
  x.restore();
}
async function intelCanvas(sel, s, W = 384, levels = 2) {
  sel = sel || {}; const k = W / 384, pad = Math.round(16 * k); const p = s.pin || {};
  try { await document.fonts.load('700 20px Poppins'); await document.fonts.load('italic 400 12px Poppins'); await document.fonts.load('500 12px "IBM Plex Mono"'); } catch (e) { /* fallback type */ }
  const T = document.createElement('canvas'); T.width = W; T.height = 3600; const x = T.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, T.height); x.fillStyle = '#000'; x.textBaseline = 'top';
  const mono = (px, wt = 500) => `${wt} ${Math.max(7, Math.round(px * k))}px "IBM Plex Mono", monospace`; const sans = (wt, px, st = '') => `${st} ${wt} ${Math.max(8, Math.round(px * k))}px Poppins, sans-serif`;
  const wrapPx = (t, maxW) => { const out = []; let line = ''; for (const w of String(t || '').split(/\s+/).filter(Boolean)) { const next = line ? `${line} ${w}` : w; if (!line || x.measureText(next).width <= maxW) line = next; else { out.push(line); line = w; } } if (line) out.push(line); return out; };
  let y = Math.round(12 * k);
  const text = (t, font, lh, at = pad) => { x.font = font; for (const l of wrapPx(t, W - pad - at)) { x.fillText(l, at, y); y += lh; } };
  const rule = (h = 1.5) => { y += Math.round(6 * k); x.fillRect(pad, y, W - pad * 2, Math.max(1, Math.round(h * k))); y += Math.round(10 * k); };
  /* what kind of thing, small, over its name */
  const kind = sel.k === 'place' ? [(FAMILIES[sel.fam] || {}).w, ...(sel.harm && sel.harm.length ? sel.harm : [(ROLES[sel.role] || {}).w])] : sel.k === 'group' ? [sel.w] : sel.k === 'printer' ? [sel.on ? 'ONLINE' : 'NOT YET ONLINE'] : [];
  if (kind.filter(Boolean).length) text([...new Set(kind.filter(Boolean))].join(' · '), mono(10.5, 600), Math.round(15 * k));
  text(String(sel.n || p.cn || p.place || '').toUpperCase(), sans(700, 22), Math.round(26 * k));
  if (sel.latin) text(sel.latin, sans(400, 12.5, 'italic'), Math.round(17 * k));
  /* the danger ahead: four blocks, as many filled as it is high, its word and when it lands */
  if (s.deg >= 1) {
    y += Math.round(4 * k); const b = Math.round(9 * k), g = Math.round(3 * k);
    for (let i = 0; i < 4; i++) { if (i < s.deg) x.fillRect(pad + i * (b + g), y + Math.round(2 * k), b, b); else x.strokeRect(pad + i * (b + g) + 0.5, y + Math.round(2 * k) + 0.5, b - 1, b - 1); }
    x.font = mono(11, 600); x.fillText(`${DEG[s.deg]}${s.when ? ` · ${s.when}` : ''}`, pad + 4 * (b + g) + Math.round(6 * k), y); y += Math.round(18 * k);
  }
  if (sel.threat) { y += Math.round(2 * k); text(sel.threat, sans(500, 14), Math.round(19 * k)); }
  if (sel.alarm) { y += Math.round(4 * k); text(`${ALARM_W[sel.alarm] || ''}${sel.seen ? ` · ${ago(sel.seen)}` : ''}`, mono(12, 600), Math.round(17 * k)); if (sel.tel) text(PHONE_W[sel.tel] || sel.tel.replace(/^tel:/, ''), sans(700, 20), Math.round(24 * k)); }
  if (sel.when && sel.k === 'group') text(sel.when, mono(10.5), Math.round(15 * k));
  /* the string tied: each place it reaches, under a small drawn string */
  const rels = relOrder(s.nodes || []).slice(0, 4);
  if (rels.length) {
    rule();
    for (const n of rels) {
      const cy = y + Math.round(8 * k); x.save(); x.lineWidth = Math.max(1, 1.6 * k); x.beginPath(); x.moveTo(pad, cy); x.quadraticCurveTo(pad + 12 * k, cy - 7 * k, pad + 24 * k, cy); x.stroke();
      x.beginPath(); x.arc(pad, cy, 2.6 * k, 0, Math.PI * 2); x.arc(pad + 24 * k, cy, 2.6 * k, 0, Math.PI * 2); x.fill(); x.restore();
      const y0 = y; text(n.n, mono(12, 600), Math.round(16 * k), pad + Math.round(34 * k)); const ph = relPhrase(n); if (ph) text(ph, mono(10.5), Math.round(14 * k), pad + Math.round(34 * k)); if (y === y0) y += Math.round(16 * k); y += Math.round(4 * k);
    }
  }
  if (sel.addr) text(sel.addr, mono(10.5), Math.round(15 * k));
  rule(1);
  text([p.place || sel.place, `${(+p.lat).toFixed(4)} ${(+p.lng).toFixed(4)}`, sel.seen ? fmtStamp(sel.seen) : ''].filter(Boolean).join(' · '), mono(9), Math.round(13 * k));
  /* the intention, as a manifesto, heavy and close set; then each suggestion taken up: what to do, and the plain fact behind it */
  const want = String(s.note || '').trim(); const acts = s.acts || [];
  if (want || acts.length) { y += Math.round(8 * k); x.fillRect(pad, y, W - pad * 2, Math.max(2, Math.round(4 * k))); y += Math.round(14 * k); }
  if (want) text(want.toUpperCase(), sans(700, 20), Math.round(23 * k));
  for (const a of acts) { y += Math.round(7 * k); const b = Math.round(7 * k); x.fillRect(pad, y + Math.round(3 * k), b, b); text(String(a.w || '').toUpperCase(), mono(12, 700), Math.round(16 * k), pad + Math.round(15 * k)); text(a.f, mono(11), Math.round(15 * k), pad + Math.round(15 * k)); }
  /* an earlier receipt: its story's how */
  const how = acts.length ? [] : [(s.lines || {}).s, (s.lines || {}).h].filter(Boolean);
  if (how.length) { y += Math.round(6 * k); for (const l of how) { x.font = mono(11.5, 600); x.fillText('>', pad, y); text(l, mono(11.5), Math.round(16 * k), pad + Math.round(14 * k)); y += Math.round(3 * k); } }
  y += pad; const textH = y;
  /* the head: the photograph as it prints, its credit under it; or the thing's own mark, large, in ink */
  const src = sel.photo || (s.img ? sigSrc(s, false) : ''); let head = null; let headH = 0;
  if (src) { headH = Math.round(W * 0.66); try { head = await bwCanvas(src, W, headH, levels); } catch (e) { head = null; } }
  if (!head) headH = sel.k === 'life' ? Math.round(W * 0.42) : Math.round(W * 0.34);
  const credit = head && s.img ? figCredit(s) : ''; const creditH = credit ? Math.round(16 * k) : 0;
  const out = document.createElement('canvas'); out.width = W; out.height = headH + creditH + textH; const o2 = out.getContext('2d'); o2.fillStyle = '#fff'; o2.fillRect(0, 0, W, out.height); o2.fillStyle = '#000'; o2.textBaseline = 'top';
  if (head) o2.drawImage(head, 0, 0);
  else if (sel.k === 'place') famArt(o2, sel.fam, !!(sel.harm || []).length, W / 2, headH / 2, headH * 0.3);
  else if (sel.k === 'printer') M.printer(o2, W / 2, headH * 0.66, headH * 0.66, 0, false);
  else if (sel.k === 'group') { o2.save(); o2.beginPath(); for (let i = 0; i < 9; i++) life.blob(o2, W / 2 + Math.cos(i * 2.4) * headH * 0.22 * (i % 3) / 2, headH / 2 + Math.sin(i * 2.4) * headH * 0.16 * (i % 3) / 2, headH * 0.16, i); o2.fill(); o2.restore(); }
  /* where the radar stands: its rings, its hand and the point it turns on */
  else if (sel.k === 'here') { const R = headH * 0.36, cx = W / 2, cy = headH / 2; o2.save(); o2.strokeStyle = '#000'; for (const [f, lw] of [[1, 3], [0.66, 1.5], [0.33, 1.5]]) { o2.lineWidth = lw * k; o2.beginPath(); o2.arc(cx, cy, R * f, 0, Math.PI * 2); o2.stroke(); } o2.lineWidth = 2.5 * k; o2.beginPath(); o2.moveTo(cx, cy); o2.lineTo(cx + R * 0.7, cy - R * 0.7); o2.stroke(); o2.beginPath(); o2.arc(cx, cy, 4 * k, 0, Math.PI * 2); o2.fill(); o2.restore(); }
  else M.glyph(o2, p.g || 'paw', W / 2, headH / 2, headH * 0.66, '#000');
  if (credit) { o2.font = mono(8.5); o2.fillText(credit, pad, headH + Math.round(4 * k)); }
  o2.drawImage(T, 0, 0, W, textH, 0, headH + creditH, W, textH);
  const id = o2.getImageData(0, 0, W, out.height); const d = id.data; for (let i = 0; i < d.length; i += 4) { const v = d[i] / 255; const q = levels === 2 ? (v < 0.55 ? 0 : 1) : Math.round(v * 3) / 3; d[i] = d[i + 1] = d[i + 2] = Math.round(q * 255); d[i + 3] = 255; }
  o2.putImageData(id, 0, 0); return out;
}
/* the foot of the printed receipt: the code to scan, as large as the paper allows, its quiet margin kept, black on white, so a
   phone's camera reads it off the paper or the screen; the code and the time; the Country */
async function jCodeCanvas(s, W = 512) {
  const k = W / 384, pad = Math.round(16 * k); try { await document.fonts.load('500 12px "IBM Plex Mono"'); } catch (e) { /* fallback type */ }
  const qr = qrOf(linkOf(s) || meshText(s), 'M') || qrOf(linkOf(s) || meshText(s), 'L'); const n = qr ? qr.getModuleCount() : 0; const m = n ? Math.max(2, Math.floor((W - pad * 2) * 0.86 / (n + 8))) : 0;
  const side = n ? (n + 8) * m : 0; const H = side + Math.round(70 * k);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.textBaseline = 'top';
  const ox = Math.round((W - side) / 2) + 4 * m; if (qr) for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) x.fillRect(ox + q * m, 4 * m + r * m, m, m);
  let y = side; x.font = `600 ${Math.round(11 * k)}px "IBM Plex Mono", monospace`; x.fillText(`${s.code} · ${fmtStamp(s.at)}`, pad, y); y += Math.round(18 * k);
  x.font = `500 ${Math.round(9.5 * k)}px "IBM Plex Mono", monospace`; x.fillText(CONFIG.COUNTRY, pad, y); y += Math.round(13 * k); x.font = `600 ${Math.round(9.5 * k)}px "IBM Plex Mono", monospace`; x.fillText(CONFIG.SOVEREIGNTY || '', pad, y);
  return c;
}

/* ───────── W.I.S.H.'s screen over the map: the receipt, and suggestions to take up, as many as are wanted. Each is something to
   do and one plain fact behind it that most people do not know: three for anyone, three for the kind of life noticed. Pressed,
   it goes on the receipt; pressed again, it comes off ───────── */
const TIPS = {
  animal: [{ k: 'bowl', ic: 'water', w: 'Shallow water out', f: 'Deep bowls drown small animals. A stone in it lets them climb out.' },
    { k: 'natives', ic: 'flora', w: 'Plant local natives', f: 'Local plants feed the insects local birds raise their young on.' },
    { k: 'rescue', ic: 'phone', w: 'Save the rescue number', f: 'Wildlife Victoria sends rescuers for hurt wildlife: 03 8400 7300.' }],
  pet: [{ k: 'paws', ic: 'heat', w: 'Test the path', f: 'Too hot for your hand for five seconds is too hot for paws.' },
    { k: 'car', ic: 'harm', w: 'Never leave them in a car', f: 'A parked car can get twice as hot inside as the air outside.' },
    { k: 'petsigns', ic: 'aware', w: 'Know the signs', f: 'Heavy panting, drooling and wobbly legs mean a pet is overheating.' }],
  plant: [{ k: 'soak', ic: 'water', w: 'One deep soak a week', f: 'A deep soak grows deeper roots than a little water every day.' },
    { k: 'mulch', ic: 'mulch', w: 'Mulch the ground', f: 'Mulch keeps soil cooler and stops the water drying off the top.' },
    { k: 'ask', ic: 'tree', w: 'Ask for a street tree', f: 'Most councils plant a street tree outside a home if asked.' }],
  people: [{ k: 'neighbour', ic: 'people', w: 'Check on a neighbour', f: 'Heatwaves kill more Australians than any other natural disaster.' },
    { k: 'stroke', ic: 'aware', w: 'Know heatstroke', f: 'Confused, hot dry skin, no sweat: that is heatstroke. Call 000.' },
    { k: 'cool', ic: 'refuge', w: 'Find a cool place', f: 'Libraries and shopping centres are free cool places on hot days.' }],
  place: [{ k: 'shade', ic: 'shade', w: 'Ask for shade', f: 'Ground in a tree’s shade can be 20° cooler than bare bitumen.' },
    { k: 'vote', ic: 'check', w: 'Vote for cooler streets', f: 'Victoria votes on 28 November 2026. Ask candidates about heat.' },
    { k: 'neighbour', ic: 'people', w: 'Check on a neighbour', f: 'Heatwaves kill more Australians than any other natural disaster.' }],
};
const TIPS_OF = {
  bird: [{ k: 'bath', ic: 'bird', w: 'A bird bath up high', f: 'Birds can’t sweat. They pant to cool down and lose water fast.' },
    { k: 'bread', ic: 'harm', w: 'No bread for birds', f: 'Bread fills birds up without the food they need.' },
    { k: 'catsin', ic: 'cat', w: 'Cats in at night', f: 'Roaming pet cats kill over 300 million animals a year here.' }],
  bat: [{ k: 'net', ic: 'flyingfox', w: 'Fine netting only', f: 'If a finger fits through the holes, the net can trap a flying-fox.' },
    { k: 'nohands', ic: 'harm', w: 'Don’t touch a bat', f: 'Bats can carry a virus. Only vaccinated carers handle them.' },
    { k: 'camp', ic: 'heat', w: 'Report a hot camp', f: 'Above 42° flying-foxes start to die in their camps.' }],
  mammal: [{ k: 'daylight', ic: 'possum', w: 'Look twice in daylight', f: 'A possum on the ground in the day, in heat, is in trouble.' },
    { k: 'nestbox', ic: 'refuge', w: 'Put up a nest box', f: 'Tree hollows take a century to form. A nest box stands in.' },
    { k: 'uphigh', ic: 'water', w: 'Water up off the ground', f: 'A bowl hung in a tree keeps possums out of reach of dogs and cats.' }],
  native: [{ k: 'dusk', ic: 'harm', w: 'Slow down at dusk', f: 'Most native animals hit by cars are hit at dusk and dawn.' },
    { k: 'lead', ic: 'dog', w: 'Dogs on a lead in parks', f: 'Dogs off a lead chase and stress wildlife even when they catch nothing.' },
    { k: 'nestbox', ic: 'refuge', w: 'Put up a nest box', f: 'Tree hollows take a century to form. A nest box stands in.' }],
  feral: [{ k: 'foxes', ic: 'aware', w: 'Report foxes', f: 'Foxes and cats drove most of Australia’s lost small mammals extinct.' },
    { k: 'compost', ic: 'harm', w: 'Lid on the compost', f: 'Open compost and pet food left out feed foxes and rats.' },
    { k: 'catsin', ic: 'cat', w: 'Cats in at night', f: 'Roaming pet cats kill over 300 million animals a year here.' }],
  reptile: [{ k: 'bait', ic: 'harm', w: 'Skip the snail bait', f: 'Blue-tongues eat snails, and snail bait can poison them.' },
    { k: 'logs', ic: 'refuge', w: 'Leave logs and rocks', f: 'Lizards can’t sweat. They cool off under logs and rocks.' },
    { k: 'mow', ic: 'lizard', w: 'Look before you mow', f: 'Lizards shelter in long grass on hot days.' }],
  frog: [{ k: 'pond', ic: 'wetland', w: 'Make a frog pond', f: 'Frogs breathe partly through their skin, so it must stay wet.' },
    { k: 'sprays', ic: 'spray', w: 'No sprays near water', f: 'Garden sprays soak straight through frog skin.' },
    { k: 'nofish', ic: 'frog', w: 'No goldfish in it', f: 'Goldfish eat tadpoles. Frog ponds work best without fish.' }],
  water: [{ k: 'drains', ic: 'water', w: 'Nothing down the drain', f: 'Street drains run straight to the creek, not to treatment.' },
    { k: 'creekshade', ic: 'shade', w: 'Shade the creek', f: 'Shaded water holds more oxygen for fish on hot days.' },
    { k: 'litter', ic: 'harm', w: 'Pick up one piece', f: 'Litter on the street reaches the bay after rain.' }],
  insect: [{ k: 'pebbles', ic: 'bee', w: 'Pebbles in a dish', f: 'Bees carry water home to cool their hive on hot days.' },
    { k: 'flowers', ic: 'flower', w: 'Grow summer flowers', f: 'Australia has more than 1,600 kinds of native bee.' },
    { k: 'leaves', ic: 'mulch', w: 'Leave the leaf litter', f: 'Fallen leaves are home to beetles, spiders and the skinks that eat them.' }],
  small: [{ k: 'leaves', ic: 'mulch', w: 'Leave the leaf litter', f: 'Fallen leaves are home to beetles, spiders and the skinks that eat them.' },
    { k: 'spiders', ic: 'spider', w: 'Let the spiders be', f: 'Most garden spiders are harmless and eat flies and mosquitoes.' },
    { k: 'cover', ic: 'ground', w: 'Keep soil covered', f: 'Worms go deep or die when bare soil bakes in the sun.' }],
  plant: [{ k: 'young', ic: 'tree', w: 'Water young trees', f: 'Street trees need watering for their first two or three summers.' },
    { k: 'west', ic: 'shade', w: 'Shade the west side', f: 'Ground in a tree’s shade can be 20° cooler than bare bitumen.' },
    { k: 'fallen', ic: 'mulch', w: 'Leave fallen leaves', f: 'Fallen leaves feed the soil the tree grows in.' }],
  fungi: [{ k: 'stand', ic: 'fungi', w: 'Leave it standing', f: 'A mushroom is only the fruit. The fungus lives on underground.' },
    { k: 'wood', ic: 'tree', w: 'Keep the old wood', f: 'Fungi break down dead wood and give its food back to the soil.' },
    { k: 'deathcap', ic: 'harm', w: 'Look, don’t eat', f: 'Death caps grow under oaks in Melbourne and can kill.' }],
  dog: [{ k: 'early', ic: 'dog', w: 'Walk before 8 am', f: 'Dogs cool down mostly by panting. They barely sweat.' },
    { k: 'cooltowel', ic: 'water', w: 'Cool water, not ice', f: 'Cool water, not ice, is safest for an overheated dog.' },
    { k: 'flatface', ic: 'aware', w: 'Watch flat-faced dogs', f: 'Pugs and bulldogs overheat far faster than other dogs.' }],
  cat: [{ k: 'catsin', ic: 'cat', w: 'Cats in at night', f: 'Roaming pet cats kill over 300 million animals a year here.' },
    { k: 'tiles', ic: 'refuge', w: 'A cool tiled spot', f: 'A cat that pants is already in trouble.' },
    { k: 'catrun', ic: 'hug', w: 'Build a cat run', f: 'Cats kept safe at home live longer, away from cars and fights.' }],
  people: [{ k: 'blinds', ic: 'heat', w: 'Close blinds by 9 am', f: 'Blinds shut before the sun hits the glass keep the heat out.' },
    { k: 'older', ic: 'people', w: 'Ring an older relative', f: 'Older people often don’t feel thirsty, even when they need water.' },
    { k: 'nights', ic: 'night', w: 'Plan for hot nights', f: 'A night that stays hot gives the body no time to recover.' }],
  place: [{ k: 'young', ic: 'tree', w: 'Water young trees', f: 'Street trees need watering for their first two or three summers.' },
    { k: 'drains', ic: 'water', w: 'Nothing down the drain', f: 'Street drains run straight to the creek, not to treatment.' },
    { k: 'cool', ic: 'refuge', w: 'Find a cool place', f: 'Libraries and shopping centres are free cool places on hot days.' }],
};
const TIP_BY = Object.fromEntries([...Object.values(TIPS), ...Object.values(TIPS_OF)].flat().map(t => [t.k, t]));
/* what kind of thing is held: for anyone, by its broad kind; for its own three, by its kind of life */
function jKinds(s) {
  const g = s.k === 'life' ? s.g || 'paw' : ''; const grp = M.GROUP[g];
  if (s.k !== 'life') return ['place', 'place'];
  if (g === 'human' || g === 'ape') return ['people', 'people'];
  if (g === 'dog' || g === 'cat') return ['pet', g];
  if (['plant', 'tree', 'flower', 'grass'].includes(g)) return ['plant', 'plant'];
  if (g === 'fungi') return ['plant', 'fungi'];
  if (g === 'flyingfox' || g === 'bat') return ['animal', 'bat'];
  if (['fox', 'rabbit', 'rodent'].includes(g)) return ['animal', 'feral'];
  if (g === 'frog') return ['animal', 'frog'];
  if (g === 'aquatic') return ['animal', 'water'];
  if (g === 'possum') return ['animal', 'mammal'];
  return ['animal', { bird: 'bird', mammal: 'native', reptile: 'reptile', insect: 'insect', spider: 'small' }[grp] || 'native'];
}
function jActs() { const [a, b] = jKinds(jSel()); const out = []; for (const t of [...TIPS[a], ...TIPS_OF[b]]) if (!out.some(x => x.k === t.k)) out.push(t); return out; }
const jChosen = () => (JR.acts || []).map(k => TIP_BY[k]).filter(Boolean);
let jrEl = null;
/* the suggestions wait behind a tab at the receipt's side, closed, until it or the key on the intention device is pressed;
   the key carries how many are taken up */
let jrOpen = false;
function jrTabs() {
  const n = (JR.acts || []).length;
  $$('[data-jtab]').forEach(b => { b.setAttribute('aria-expanded', String(jrOpen)); b.classList.toggle('open', jrOpen); b.classList.toggle('next', b.classList.contains('vs-sg') && !jrOpen && !n && !String(JR.want || '').trim()); const c = b.querySelector('.jt-n'); if (c) c.textContent = n ? String(n) : ''; });
  if (jrEl) { jrEl.classList.toggle('open', jrOpen); const l = jrEl.querySelector('.jr-acts'); if (l) l.hidden = !jrOpen; }
}
function jrToggle(on) { jrOpen = on == null ? !jrOpen : !!on; jrTabs(); snd.tick(jrOpen ? 1600 : 1000); }
function jrShow() {
  const on = wishOverMap() && (!simple() || (prefs.journey >= 2 && !!JR.sel));
  if (!jrEl) { if (!on) { jHeld(); return; } jrEl = document.createElement('div'); jrEl.className = 'jr'; jrEl.id = 'jr'; document.body.appendChild(jrEl); }
  jrEl.hidden = !on; jHeld(); if (!on) return;
  if (!jrEl.firstChild) jrEl.innerHTML = `<figure class="jr-r"><img alt="" data-zoom></figure><div class="jr-sg"><button type="button" class="jr-tab" data-jtab aria-expanded="false" aria-label="Suggestions">${icon('stories')}<i class="jt-c" aria-hidden="true">${icon('next', 'sm')}</i></button><ol class="jr-acts" aria-label="Suggestions to take up" hidden></ol></div>`;
  jrEl.querySelector('.jr-acts').innerHTML = jActs().map(a => { const on2 = (JR.acts || []).includes(a.k); return `<li><button type="button" class="jr-act${on2 ? ' on' : ''}" data-jact="${a.k}" aria-pressed="${on2}"><i class="act-ic">${M.ICONS[a.ic] ? icon(a.ic) : glyphSVG(a.ic)}</i><b>${esc(a.w)}</b></button></li>`; }).join('');
  jrTabs(); jPreview();
}
/* ───────── what W.I.S.H. holds stays marked on the ground while it is open: a steady ring where it is, and a string to each
   place tied to it ───────── */
const heldEl = (() => { const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); el.setAttribute('class', 'jr-held'); el.setAttribute('aria-hidden', 'true'); el.style.display = 'none'; document.body.appendChild(el); return el; })();
function jHeld() {
  const s = JR.sel; const on = !!s && s.lat != null && s.k !== 'here' && wishOverMap() && S.mapReady && !$('#jr-veil');
  heldEl.style.display = on ? '' : 'none'; if (!on) return;
  const r = map.getContainer().getBoundingClientRect(); const at = (lat, lng) => { const q = map.project([lng, lat]); return [Math.round(r.left + q.x), Math.round(r.top + q.y)]; };
  const [x, y] = at(s.lat, s.lng); const ties = ((s.fig || {}).nodes || []).filter(n => n.b != null && n.d != null).map(n => { const [la, ln] = dest(s.lat, s.lng, n.d, n.b); return at(la, ln); });
  heldEl.setAttribute('width', innerWidth); heldEl.setAttribute('height', innerHeight);
  heldEl.innerHTML = ties.map(([a, b]) => `<line x1="${x}" y1="${y}" x2="${a}" y2="${b}"/><circle class="k" cx="${a}" cy="${b}" r="6"/>`).join('') + `<circle class="h" cx="${x}" cy="${y}" r="21"/><circle class="h2" cx="${x}" cy="${y}" r="29"/>`;
}
addEventListener('resize', jHeld);
/* and kept in sight: if the receipt, the suggestions or the device would cover it, the map slides it to the nearest clear
   ground, once for each thing held */
let clearK = '';
function jClear() {
  const s = JR.sel; if (!s || s.lat == null || s.k === 'here' || !wishOverMap() || !S.mapReady || !jrEl || jrEl.hidden) return;
  const key = `${s.k}|${s.id || s.n}|${s.lat}|${s.lng}`; if (key === clearK) return; clearK = key;
  const r = map.getContainer().getBoundingClientRect(); const q = map.project([s.lng, s.lat]); const x = r.left + q.x, y = r.top + q.y;
  /* where everything stands with the suggestions shut and open, so opening them never covers it */
  const measure = () => [...jrEl.querySelectorAll('.jr-r img, .jr-tab, .jr-acts:not([hidden])'), $('#view .dev'), rail].filter(Boolean).map(el => el.getBoundingClientRect()).filter(b => b.width && b.height);
  const boxes = measure(); const l = jrEl.querySelector('.jr-acts');
  if (l && l.hidden) { l.hidden = false; l.style.animation = 'none'; boxes.push(...measure()); l.hidden = true; l.style.animation = ''; }
  const top = phone() ? 60 : 40, bot = innerHeight - (phone() ? (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock')) || 70) : 40);
  const right = phone() ? innerWidth : Math.min(innerWidth, panel.getBoundingClientRect().left || innerWidth);
  const free = (X, Y) => X > 30 && X < right - 30 && Y > top && Y < bot && !boxes.some(b => X > b.left - 34 && X < b.right + 34 && Y > b.top - 34 && Y < b.bottom + 34);
  if (free(x, y)) return;
  let best = null, bd = Infinity; for (let gx = 0.04; gx < 1; gx += 0.03) for (let gy = 0.04; gy < 1; gy += 0.03) { const X = innerWidth * gx, Y = innerHeight * gy; if (!free(X, Y)) continue; const d = (X - x) ** 2 + (Y - y) ** 2; if (d < bd) { bd = d; best = [X, Y]; } }
  if (best) map.panBy([x - best[0], y - best[1]], { duration: reduced() ? 0 : 700 });
}
let jpvN = 0;
const jPreview = debounce(async () => {
  if (!jrEl || jrEl.hidden) return; const my = ++jpvN;
  const cv = await intelCanvas(jSel(), jSignal(), 384, 2).catch(() => null); if (!cv || my !== jpvN || !jrEl || jrEl.hidden) return;
  const im = jrEl.querySelector('.jr-r img'); if (!im) return; im.src = cv.toDataURL('image/png');
  (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => requestAnimationFrame(jClear));
}, 220);
const jWantSave = debounce(saveJR, 300);
const jMakeLit = () => { const mk = $('#view .vs-make'); if (mk) mk.classList.toggle('next', jWants()); };
document.addEventListener('click', e => {
  if (e.target.closest('[data-jtab]')) { jrToggle(); return; }
  const a = e.target.closest('#jr [data-jact]');
  if (a) { const k = a.dataset.jact; const on = !(JR.acts || []).includes(k); JR.acts = on ? [...(JR.acts || []), k] : JR.acts.filter(x => x !== k); saveJR();
    a.classList.toggle('on', on); a.setAttribute('aria-pressed', String(on)); jMakeLit(); jrTabs(); jPreview(); snd.tick(on ? 1800 : 1000); return; }
  const z = e.target.closest('#jr [data-zoom]'); if (z && z.src) zoomArt(z.src);
});
viewEl.addEventListener('input', e => { if (e.target.id !== 'jw-for') return; JR.want = e.target.value; jWantSave(); growTA(e.target); jMakeLit(); jrTabs(); jPreview(); });
viewEl.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'jw-for') { e.preventDefault(); $('#jw-form').requestSubmit ? $('#jw-form').requestSubmit() : jMake(); } });
viewEl.addEventListener('submit', e => { if (e.target.id !== 'jw-form') return; e.preventDefault(); jMake(); });
/* make: the receipt is made, kept here as a signal waiting to print, and flies to PRINT, which opens for it; W.I.S.H. is
   cleared behind it */
let jMaking = false;
async function jMake() {
  if (jMaking) return; const f = $('#jw-for'); const want = String(f ? f.value : JR.want || '').trim();
  if (!want && !(JR.acts || []).length) { nudge(f); tick(600); return; }
  if (simple() && !JR.sel) { tick(600); return; }
  jMaking = true;
  try {
    JR.want = want; const at = Date.now(); const s0 = jSignal(null, at); const sig = { ...s0, code: codeFor(`${at}|${s0.pin.lat}|${s0.pin.lng}|${s0.for || ''}|${S.me.dev}`) };
    const sel = jSel(); if (sel.photo) { OWN[sig.code] = sel.photo; saveOwn(); sig.img = { k: 'own', a: '' }; }
    const ev = await ledgerAdd({ type: 'signal', lat: sig.pin.lat, lng: sig.pin.lng, who: sig.who, data: sig }); JR.key = ev.key; saveJR();
    /* a first make is answered by the gate's note alone; the printer belongs to PRINT */
    const im = $('#jr .jr-r img'); const first = simple() && prefs.journey < 3;
    tie(1); if (!first) snd.printer(700); jBoard(sig);
    /* handed on, as on a line: the receipt goes to PRINT, and W.I.S.H. is left clear for what is noticed next */
    JR.sel = null; JR.want = ''; JR.acts = []; jrOpen = false; clearK = ''; saveJR();
    PRESS.story = ev.key; PRESS.fmt = 'r80'; PRESS.zl = 0; jFresh = true; if (!simple()) setFace(2, 'front');
    if (first) jGo(3); if (im) flyToTab(2, im);
    setTimeout(() => { setView(2); if (phone()) setPane('page'); }, reduced() ? 0 : 560);
  } finally { jMaking = false; }
}

/* what is made goes on the board too, its receipt with any string tied in it, so the studio side of W.I.S.H. opens on the story
   so far */
async function jBoard(s) {
  try { const cv = await intelCanvas(s.jsel, s, 256, 2); await addToBoard(cv.toDataURL('image/png'), 'receipt', 200); } catch (e) { /* the board can wait */ }
}

/* ───────── PRINT's receipt, on the strip: the intel at its head, the words typed under it on the paper itself, the code to
   scan at its foot, always on top so nothing placed can cover it. What is on the strip is what prints ───────── */
let jFresh = false;
const jObj = k => (zc ? zc.getObjects().find(o => o.daKind === k) : null);
async function jStrip() {
  if (!zc || PRESS.fmt !== 'r80') return; const s = pressStory(); const f = window.fabric; const W = zc.getWidth();
  /* any other story keeps its own code in its slip: a first visit's code and empty words go, words typed stay as words */
  if (!s || !s.jr) { const c0 = jObj('code'), w0 = jObj('words'); if (c0) zc.remove(c0); if (w0 && !w0.text) zc.remove(w0); else if (w0) w0.set({ daKind: 'text', lockMovementX: false, lockMovementY: false, lockScalingX: false, lockScalingY: false, lockRotation: false, hasControls: true }); if (c0 || w0) { zc.renderAll(); saveZine(); } jCaret(); return; }
  if (jFresh) { jFresh = false; for (const o of zc.getObjects().filter(o => o.daKind !== 'base')) zc.remove(o); }
  const base = jObj('base'); if (!base) return;
  let words = jObj('words');
  if (!words) {
    words = new f.Textbox('', { left: 14, top: 0, width: W - 28, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500, fontSize: 15, lineHeight: 1.3, fill: '#0C0E0E', daKind: 'words', lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true, hasControls: false, borderColor: 'rgba(14,143,132,.55)', editingBorderColor: 'rgba(14,143,132,.9)', cursorColor: '#0C0E0E', cursorWidth: 3, hoverCursor: 'text' });
    zc.add(words);
  }
  words.set({ lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true, hasControls: false, hoverCursor: 'text' }); jWordsBind(words);
  let code = jObj('code');
  if (!code || code.daStory !== s.key) {
    if (code) zc.remove(code); const cv = await jCodeCanvas(s, FORMATS.r80.dots); if (!zc) return;
    code = await new Promise(res => f.Image.fromURL(cv.toDataURL('image/png'), im => { im.set({ left: 0, daKind: 'code', daStory: s.key, selectable: false, evented: false }); im.scaleToWidth(W); zc.add(im); res(im); }));
  }
  jLayout(); saveZine();
}
function jLayout() {
  const base = jObj('base'), words = jObj('words'), code = jObj('code'); if (!base || !words) return;
  words.set({ top: Math.round(base.top + base.getScaledHeight() + 12) }); words.setCoords();
  const wh = Math.max(words.getScaledHeight(), 64);
  if (code) { code.set({ top: Math.round(words.top + wh + 16) }); code.setCoords(); zc.bringToFront(code); }
  const need = Math.ceil((code ? code.top + code.getScaledHeight() : words.top + wh) + 18); if (Math.abs(zc.getHeight() - need) > 2) { zc.setHeight(need); fitZ(); }
  zc.renderAll(); jCaret();
}
/* the words box: a press on it, or on the blinking caret, and the keyboard types onto the paper */
function jWordsBind(w) {
  if (w.__jr) return; w.__jr = true;
  w.on('mousedown', () => { if (!w.isEditing) { zc.setActiveObject(w); w.enterEditing(); if (w.hiddenTextarea) w.hiddenTextarea.focus(); jCaret(); } });
  w.on('changed', () => { jLayout(); saveZine(); });
  w.on('editing:entered', jCaret); w.on('editing:exited', () => { jCaret(); saveZine(); });
}
function jEdit() {
  const w = jObj('words'); if (!w || !zc) return; zc.setActiveObject(w); if (!w.isEditing) w.enterEditing(); if (w.hiddenTextarea) w.hiddenTextarea.focus({ preventScroll: true }); w.selectionStart = w.selectionEnd = w.text.length; zc.renderAll(); jCaret();
}
/* a caret blinks where the words go while the paper is bare; it never prints */
function jCaret() {
  const w = jObj('words'); let c = $('#jr-caret');
  const show = faceOf(2) === 'front' && w && !w.isEditing && !w.text && S.view === 2 && !$('#zine').hidden;
  if (!show) { if (c) c.hidden = true; return; }
  if (!c) { c = document.createElement('button'); c.type = 'button'; c.id = 'jr-caret'; c.className = 'jr-caret'; c.setAttribute('aria-label', 'Words on the receipt'); c.addEventListener('click', jEdit); }
  if (c.parentNode !== zc.wrapperEl) zc.wrapperEl.appendChild(c);
  const z = (zc.upperCanvasEl.getBoundingClientRect().width / zc.getWidth()) || 1; c.style.left = `${Math.round((w.left + 2) * z)}px`; c.style.top = `${Math.round((w.top + 2) * z)}px`; c.style.height = `${Math.round(18 * z)}px`; c.style.width = `${Math.max(8, Math.round(9 * z))}px`; c.hidden = false;
}
addEventListener('resize', () => setTimeout(jCaret, 60));
/* what is placed on the receipt lands on its picture, in turn round its edges, never over its words or its code */
function jLand() {
  const W = zc.getWidth(), base = jObj('base'); const n = zc.getObjects().filter(o => !ZFIXED.includes(o.daKind)).length;
  const P = [[0.8, 0.62], [0.2, 0.6], [0.66, 0.2], [0.34, 0.24], [0.5, 0.7]]; const [fx, fy] = P[n % P.length]; const head = Math.min(W * 0.66, base ? base.getScaledHeight() * 0.4 : W * 0.5);
  return { x: W * fx + rnd(-10, 10), y: (base ? base.top : 0) + head * fy + rnd(-8, 8) };
}

/* ───────── printed: everything opens, and the receipt waits to print as the hero of the showcase ───────── */
function jPrinted(poster) {
  if (!simple()) return; galleryFocus = poster ? poster.id : null;
  jGo(4); setTimeout(() => { setView(3); if (phone()) setPane('main'); }, reduced() ? 0 : 900);
}
/* the easter egg: the tiny NOVEL.GLOBAL in the information corner, pressed twice, opens everything at once */
let eggT = 0;
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.da-egg'); if (!b) return; e.preventDefault(); e.stopPropagation(); if (!simple()) return;
  if (Date.now() - eggT < 500) { eggT = 0; jGo(4); setOpen(true); setView(S.view); } else eggT = Date.now();
}, true);
/* Settings: the first visit again, from the bare map; nothing made is lost */
function jReplay() {
  prefs.journey = 0; savePrefs(); store.set('da.journey.v1', {}); snd.tear(); buzz([10, 30, 10]);
  setTimeout(() => { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ } location.reload(); }, 260);
}
/* a link someone was sent is not held at the bare map: a radio link, a story, a life, a group, a printer */
const jLinked = h => !!h && viewOfHash(h) < 0 && (isLocalHash(h) || /^U[0-9a-z]{8,}$/i.test(h) || /^[0-9A-Za-z]{3,9}$/.test(h));
