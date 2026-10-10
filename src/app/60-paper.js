/* ════════════════════════════════════════════════════════════════════
   SIGNALS — a slip issued from a cell, set like an archive record: a photograph in black and white as half of it,
   the life, where and when, its statement, four lines, the relations tied, a note, a name and a code.
   It leaves through a 58 mm printer, raw ESC/POS, a pocket 1-bit printer, the Game Boy Printer, a mesh radio,
   a pager or a link, and comes back in by pasting any of them.
   ════════════════════════════════════════════════════════════════════ */
function portalBase() {
  if (CONFIG.PORTAL_URL) return CONFIG.PORTAL_URL.replace(/#.*$/, '');
  if (/^https?:$/.test(location.protocol) && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)) return location.origin + location.pathname;
  return '';
}
const CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function codeFor(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h >>>= 0; let s = ''; for (let i = 0; i < 4; i++) { s += CROCK[h % 32]; h = Math.floor(h / 32); } return 'DA-' + s; }
/* opt: statement (what it says, or nothing), note (the notes, when kept), img (the photograph chosen) */
function makeSignal(o, L, who, opt = {}) {
  const at = Date.now(); const pin = pinData(o); const fig = strings.snapshot(); const st = opt.statement != null ? opt.statement : '';
  const brief = (webBriefs(o, strings.tied(), 1)[0] || {}).id || null; const img = opt.img && opt.img.k !== 'none' ? opt.img : null;
  return { v: 1, code: codeFor(`${at}|${pin.lat}|${pin.lng}|${L.h}|${S.me.dev}`), at, pin, threat: st.slice(0, 320), when: st ? whenWord(o) : '', deg: st ? degOf(o) : 0, lines: L, nodes: fig.nodes, edges: fig.edges, ...(opt.note ? { note: opt.note.slice(0, 280) } : {}), ...(brief ? { brief } : {}), ...(img ? { img: img.k === 'inat' ? { k: 'inat', u: img.u, a: img.a || '', l: img.l || '', oid: img.oid || null } : { k: 'own', ...(img.a ? { a: img.a } : {}) } } : {}), who: who || '' };
}
/* ───────── carrying it: a link, compact enough for a QR code on a 58 mm slip ───────── */
const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))));
const INAT_PHOTOS = 'https://inaturalist-open-data.s3.amazonaws.com/photos/';
const photoKey = u => { const m = String(u || '').match(/\/photos\/(\d+)\/\w+\.(\w+)/); return m ? `${m[1]}.${m[2]}` : ''; };
/* the statement a life opens with, wherever the app runs: a link carries a flag instead of the words when it is unchanged */
const stOf = p => { const h = HEROES.find(x => x.n && x.n === p.n); return (h && h.st) || STATEMENT[p.g] || ''; };
function packSignal(s) {
  const p = s.pin || {}; const im = s.img && s.img.k === 'inat' && photoKey(s.img.u) ? [photoKey(s.img.u), s.img.a || '', s.img.l || '', s.img.oid || 0].join('|') : '';
  return b64u(JSON.stringify({ c: s.code, t: Math.round(s.at / 60000).toString(36), p: [p.lat, p.lng, p.g || '', p.cn || '', p.n || '', p.place || '', p.id || 0], l: WKEYS.map(k => (s.lines || {})[k] || ''), k: (s.nodes || []).map(n => [n.k, n.t, n.n, (n.t === 'biz' ? ((n.h || [])[0] ? '!' + n.h[0] : n.role) : n.g || n.kind) || '', n.b, n.d]), e: s.edges || [], ...(s.threat ? { s: s.threat === stOf(p) ? 1 : s.threat } : {}), ...(s.note ? { o: s.note } : {}), ...(im ? { i: im } : {}), ...(s.brief ? { b: s.brief } : {}), ...(s.who ? { y: s.who } : {}) }));
}
function unpackSignal(x) {
  const j = JSON.parse(unb64u(x)); const [lat, lng, g, cn, n, place, id] = j.p || [];
  if (!/^DA-[0-9A-Z]{4}$/.test(j.c || '') || !Number.isFinite(+lat) || !Number.isFinite(+lng)) throw new Error('signal');
  const pin = { lat: +lat, lng: +lng, g: g || 'paw', cn: cn || '', n: n || '', place: place || suburbAt(+lat, +lng), id: +id || null };
  const nodes = (j.k || []).map(([k, t, nn, r, b, d]) => ({ k, t, n: nn, ...(t === 'biz' ? (String(r).startsWith('!') ? { role: r.slice(1), h: [r.slice(1)] } : { role: r, h: [] }) : t === 'life' ? { g: r } : t === 'group' ? { kind: r } : {}), b: +b, d: +d }));
  const [ik, ia, il, io] = String(j.i || '').split('|'); const img = ik && /^\d+\.\w+$/.test(ik) ? { k: 'inat', u: `${INAT_PHOTOS}${ik.replace('.', '/medium.')}`, a: ia || '', l: il || '', oid: +io || null } : null;
  return { v: 1, code: j.c, at: parseInt(j.t, 36) * 60000 || Date.now(), pin, threat: j.s === 1 ? stOf(pin) : j.s ? String(j.s).slice(0, 320) : '', when: '', deg: 0, lines: Object.fromEntries(WKEYS.map((k, i) => [k, String((j.l || [])[i] || '').slice(0, SIG.line)])), nodes, edges: (j.e || []).filter(e => Array.isArray(e) && e.length === 2), ...(j.o ? { note: String(j.o).slice(0, 280) } : {}), ...(img ? { img } : {}), ...(j.b ? { brief: j.b } : {}), who: j.y || '' };
}
const linkOf = s => { const b = portalBase(); return b ? `${b}#x=${packSignal(s)}` : ''; };
/* ───────── plain text: a mesh message, a pager line, a slip in 32 columns ───────── */
const ascii = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/°/g, '').replace(/×/g, 'x').replace(/·/g, '-').replace(/[^\x20-\x7E\n]/g, '');
const bytes = t => new TextEncoder().encode(t).length;
const NAME_UP = s => String((s.pin && (s.pin.cn || s.pin.n)) || '').toUpperCase();
/* a mesh message, 200 bytes at most: the code, the life, where it is, and the four lines, the longest cut first.
   The lines carry no letters: W.I.S.H. is how they are written, not what is sent */
function meshText(s, max = SIG.mesh) {
  const L = { ...(s.lines || {}) }; const p = s.pin || {};
  const head = `${s.code} ${NAME_UP(s)}`; const where = `${(+p.lat).toFixed(4)},${(+p.lng).toFixed(4)}`;
  const build = () => [head, where, ...WKEYS.map(k => L[k] || '').filter(Boolean)].join('\n');
  let t = build(); let guard = 400;
  while (bytes(t) > max && guard--) {
    const k = ['i', 'w', 's', 'h'].sort((a, b) => (L[b] || '').length - (L[a] || '').length)[0]; const w = (L[k] || '').replace(/…$/, '').split(' ');
    if (w.length <= 1) { L[k] = (L[k] || '').slice(0, -2) + '…'; } else { w.pop(); L[k] = w.join(' ') + '…'; }
    t = build();
  }
  return t;
}
/* a pager line, 80 plain characters at most: the code, the life, and how it works */
function pagerText(s, max = SIG.pager) {
  const last = linesOf(s).pop() || ''; let t = ascii(`${s.code} ${NAME_UP(s)}${last ? `: ${last}` : ''}`); if (t.length > max) t = t.slice(0, max - 3).replace(/\s+\S*$/, '') + '...'; return t;
}
const wrap = (t, n, indent = '') => { const out = []; let line = ''; for (const w of String(t || '').split(/\s+/).filter(Boolean)) { if (!line) line = w; else if ((line + ' ' + w).length <= n - (out.length ? indent.length : 0)) line += ' ' + w; else { out.push(line); line = w; } } if (line) out.push(line); return out.map((l, i) => (i ? indent + l : l)); };
/* the story the relations tell: what harms the life, what cares for it, and what else is part of it */
const CARE_FAMS = ['circular', 'artists', 'third', 'network', 'brand'];
const harmsOfNode = n => (n.t !== 'biz' ? [] : Array.isArray(n.harm) ? n.harm : Array.isArray(n.h) ? n.h : onNotice(n.role) ? [n.role] : []);
const relKind = n => (harmsOfNode(n).length ? 'harm' : n.t === 'biz' && !onNotice(n.role) && CARE_FAMS.includes(n.fam || (ROLES[n.role] || {}).cat) ? 'care' : 'also');
const REL_G = { harm: 'HARM', care: 'CARE', also: 'ALSO' };
const relOrder = nodes => ['harm', 'care', 'also'].flatMap(g => nodes.filter(n => relKind(n) === g));
const urlOf = n => n.u || n.url || ((n.t === 'biz' && PLACES.find(p => p.n === n.n)) || {}).url || '';
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
/* "sells pesticides"; "repair"; "water" */
const relPhrase = n => { const hs = harmsOfNode(n); return hs.length ? hs.slice(0, 2).map(r => plainN(r, 1)).join(', ') : relWord(n).toLowerCase(); };
/* what each relation is, in a word */
const relWord = n => n.t === 'biz' ? (ROLES[(n.h || [])[0]] || ROLES[n.role] || {}).w || '' : n.t === 'group' ? 'GROUP' : n.t === 'water' ? 'WATER' : n.t === 'custom' ? ({ place: 'PLACE', person: 'PERSON', idea: 'IDEA' })[n.kind] || '' : n.t === 'life' ? String(M.KINDS[n.g] || '').toUpperCase() : '';
const figCredit = s => { const im = s.img || {}; return im.k === 'inat' ? [im.a ? im.a.replace(/^\(c\)\s*/i, '© ').replace(/,\s*some rights reserved/i, '') : '', im.oid ? `iNaturalist ${im.oid}` : 'iNaturalist'].filter(Boolean).join(' · ') : im.k === 'own' ? im.a || 'Photograph by the issuer' : ''; };
/* two styles for every slip, on screen, on paper and at the printer: the paper slip, and a teletype log (prefs.slip 'tty') */
const isTty = () => prefs.slip === 'tty';
const TTY_WORD = 'PHR34K';
const SCRAMBLE = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789#%&*/<>=+';
function scramble(el, word, ms = 520) {
  if (!el || reduced()) { if (el) el.textContent = word; return; }
  const t0 = performance.now(); clearInterval(el._scr);
  el._scr = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); const n = Math.floor(k * word.length);
    el.textContent = word.slice(0, n) + [...word.slice(n)].map(c => (c === ' ' ? ' ' : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)])).join('');
    if (k >= 1) { clearInterval(el._scr); el.textContent = word; } }, 38);
}
/* the slip in 32 columns, as a thermal printer's first font sets it; as a teletype, a log */
const padTo = (a, b, cols) => a + ' '.repeat(Math.max(1, cols - a.length - b.length)) + b;
/* a check on the words, as old transmissions carried one: the code and the four lines, to four hex digits (CRC-16) */
const chkOf = s => { let h = 0x1D0F; for (const c of `${s.code}|${linesOf(s).join('|')}`) { h ^= (c.charCodeAt(0) & 0xFF) << 8; for (let i = 0; i < 8; i++) h = h & 0x8000 ? ((h << 1) ^ 0x1021) & 0xFFFF : (h << 1) & 0xFFFF; } return h.toString(16).toUpperCase().padStart(4, '0'); };
const modeOf = s => [s.mode, s.scale].filter(Boolean).join(' / ');
function slipText(s, cols = 32, tty = isTty()) {
  const rule = '-'.repeat(cols); const p = s.pin || {}; const out = [];
  const pad = (a, b) => padTo(a, b, cols);
  const field = (k, v) => wrap(v, cols - 7).map((l, i) => (i ? '       ' : (k + '       ').slice(0, 7)) + l);
  if (tty) out.push(pad('DIRECT ACTION', s.code), pad(`TX ${fmtStamp(s.at)}`, 'W.I.S.H.'), '='.repeat(cols));
  else out.push(pad('DIRECT ACTION', s.code), fmtStamp(s.at), rule);
  if (s.img && s.img.k !== 'none') out.push(...wrap(figCredit(s), cols, '  '), rule);
  out.push(...wrap(NAME_UP(s), cols)); if (p.n && p.n !== p.cn) out.push(...wrap(p.n, cols));
  out.push(...field('SITE', `${p.place || ''} ${(+p.lat).toFixed(4)} ${(+p.lng).toFixed(4)}`.trim()));
  if (s.when) out.push(...field('WINDOW', s.when));
  if (modeOf(s)) out.push(...field('MODE', modeOf(s)));
  if (s.threat) { out.push(rule); out.push(...wrap(s.threat, cols)); }
  const L = linesOf(s); if (L.length) { out.push(rule); for (const l of L) out.push(...wrap(l, cols)); }
  const rels = relOrder(s.nodes || []);
  /* RELATIONS: the line a printer's figure is set above (ESC/POS draws it there) */
  if (rels.length) { out.push(rule, 'RELATIONS'); let g0 = ''; rels.forEach((n, i) => { const g = relKind(n); if (g !== g0) { out.push(`${REL_G[g]} · ${rels.filter(x => relKind(x) === g).length}`); g0 = g; } out.push(...wrap(`${pad2(i + 1)} ${n.n}`, cols, '   ')); const u = hostOf(urlOf(n)); out.push(...wrap(`${relPhrase(n)}${u ? ` · ${u}` : ''}`, cols - 3).map(l => '   ' + l)); }); }
  if (s.note) { out.push(rule); out.push(...field('NOTE', s.note)); }
  if (s.who) out.push(rule, `- ${s.who}`);
  return ascii(out.join('\n'));
}
/* the foot of the log, under its code: where it is filed, its check, the Country it stands on, the end of the transmission */
function slipFoot(s, cols = 32, tty = isTty()) {
  if (!tty) return ascii(CONFIG.COUNTRY);
  return ascii(['='.repeat(cols), padTo(`ACC. ${s.code}`, `CHK ${chkOf(s)}`, cols), ...wrap(CONFIG.COUNTRY, cols), padTo('KEEP . FILE . ACT', 'EOT', cols)].join('\n'));
}
/* ───────── the QR code: the link when the app is hosted, else the mesh message itself ───────── */
function qrOf(text, ec = 'L') { try { const qr = qrcode(0, ec); qr.addData(unescape(encodeURIComponent(text))); qr.make(); return qr; } catch (e) { return null; } }
const qrText = s => linkOf(s) || meshText(s);
function renderQR(host, text) {
  const qr = qrOf(text); if (!qr) { host.innerHTML = ''; return; } const n = qr.getModuleCount(), N = n + 4; let p = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) p += `M${c + 2} ${r + 2}h1v1h-1z`;
  host.innerHTML = `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="QR code"><path d="${p}" fill="#000"/></svg>`;
}

/* ───────── the photograph: chosen before the slip is issued, printed in black and white ───────── */
const IMGS = store.get('da.img.v1', {});      /* cell → the photograph chosen */
const OWN = store.get('da.own.v1', {});       /* a cell's or a signal's own photograph, small, on this device */
const saveImgs = () => store.set('da.img.v1', IMGS);
function saveOwn() { const ks = Object.keys(OWN); while (ks.length > 14) delete OWN[ks.shift()]; while (!store.set('da.own.v1', OWN) && Object.keys(OWN).length) delete OWN[Object.keys(OWN)[0]]; }
/* every photograph this life could print with: its own, then the same kind seen nearby; only licences that allow a black and white version */
function photoChoices(o) {
  const out = []; const seen = new Set(); const sub = subjectOf(o);
  const add = (x, ph) => { if (!ph || !ph.u || !licAdaptable(ph.l) || seen.has(ph.u)) return; seen.add(ph.u); out.push({ k: 'inat', u: ph.u, a: ph.a || '', l: ph.l, oid: typeof x.id === 'number' ? x.id : null }); };
  if (o.photo) out.push({ k: 'rec' });
  if (sub && sub.ph) add(sub, sub.ph); for (const ph of (sub && sub.phs) || []) add(sub, ph);
  const tn = sub && sub.tx && sub.tx.n; if (tn) [...S.obs, ...S.hist].filter(x => x.tx && x.tx.n === tn && x !== sub && x.ph).sort((a, b) => haversine(o.lat, o.lng, a.lat, a.lng) - haversine(o.lat, o.lng, b.lat, b.lng)).slice(0, 14).forEach(x => add(x, x.ph));
  return out;
}
function imgChoice(o) {
  const c = IMGS[o.id]; const all = photoChoices(o);
  if (c && (c.k === 'none' || (c.k === 'own' && OWN[o.id]) || (c.k === 'inat' && all.some(x => x.u === c.u)) || (c.k === 'rec' && o.photo))) return c;
  return all[0] || { k: 'none' };
}
const imgSrc = (c, key, o, big) => (c.k === 'inat' ? photoURL(c.u, big ? 'large' : 'medium') : c.k === 'own' ? OWN[key] || '' : c.k === 'rec' && o ? o.photo || '' : '');
/* a slip's photograph: from iNaturalist, from this device, or, for a story from the board, from the server */
const sigSrc = (s, big) => (s.img ? imgSrc(s.img, s.code, null, big) || (s.img.k === 'own' && s.photo) || '' : '');
/* the contrast stretched, so a photograph holds up as dots */
function autolevel(id) {
  const d = id.data, n = d.length / 4; const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2])]++;
  let lo = 0, hi = 255, acc = 0; for (; lo < 255 && (acc += hist[lo]) < n * 0.02; lo++); acc = 0; for (; hi > 0 && (acc += hist[hi]) < n * 0.02; hi--);
  const k = 255 / Math.max(24, hi - lo); for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) d[i * 4 + c] = clamp((d[i * 4 + c] - lo) * k, 0, 255);
  return id;
}
const BW = new Map();
/* a photograph cut to a frame and dithered: two inks for a thermal head, four greys for a Game Boy */
async function bwCanvas(src, W, H, levels = 2) {
  const key = `${src.slice(0, 120)}|${src.length}|${W}|${H}|${levels}`; if (BW.has(key)) return BW.get(key);
  const im = await loadImage(src, !/^data:/.test(src));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight); x.drawImage(im, (W - im.naturalWidth * sc) / 2, (H - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc);
  x.putImageData(dither(autolevel(x.getImageData(0, 0, W, H)), levels), 0, 0);
  if (BW.size > 48) BW.clear(); BW.set(key, cv); return cv;
}
/* the frame is as tall as everything under it: the photograph is half the slip */
function fitFig(host, cap) {
  const fig = host.querySelector('.sl-fig'); const body = host.querySelector('.sl-body'); if (!fig || !body || fig.classList.contains('none') || fig.classList.contains('blank')) return;
  const W = fig.clientWidth || 200; fig.style.height = `${Math.round(clamp(body.offsetHeight, W * 0.8, W * cap))}px`;
}
async function fillFig(host, s, press) {
  const fig = host.querySelector('.sl-fig'); const im = host.querySelector('.sl-img'); if (!fig || !im) return;
  const src = sigSrc(s, press); if (!src) { fig.classList.add('none'); return; }
  /* a face still turning over has no size yet: wait for it */
  for (let i = 0; i < 60 && !fig.clientWidth; i++) await new Promise(r => setTimeout(r, 25));
  if (!fig.clientWidth || !fig.isConnected) return;
  fitFig(host, press ? 1.6 : 1.2); const W = fig.clientWidth, H = fig.clientHeight; const k = press ? 416 / Math.max(1, W) : Math.min(2, devicePixelRatio || 1);
  try { const cv = await bwCanvas(src, Math.round(W * k), Math.round(H * k), 2); im.src = cv.toDataURL('image/png'); im.classList.remove('grey'); }
  catch (e) { im.src = src; im.classList.add('grey'); }   /* a host that will not share its pixels: grey by the browser instead */
}
/* the constellation, drawn as it sits on the ground: bearings and distances from the life */
/* each point where it lies around the life, numbered as the index numbers it */
function chartPts(s) { const pts = { pin: { x: 0, y: 0, t: 'pin' } }; relOrder(s.nodes || []).forEach((n, i) => { const r = n.b * Math.PI / 180; pts[n.k] = { x: Math.sin(r) * n.d, y: -Math.cos(r) * n.d, t: n.t, g: relKind(n), no: i + 1 }; }); return pts; }
const chartFit = (pts, half, pad) => { const ext = Math.max(1, ...Object.values(pts).map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))); return (half - pad) / ext; };
function chartSVG(s, size = 64) {
  const pts = chartPts(s); const k = chartFit(pts, size / 2, 7), c = size / 2; const P = key => pts[key] && [c + pts[key].x * k, c + pts[key].y * k]; const f = v => v.toFixed(1);
  const seg = hot => (s.edges || []).filter(([a, b]) => ((pts[a] || {}).g === 'harm' || (pts[b] || {}).g === 'harm') === hot).map(([a, b]) => { const p = P(a), q = P(b); return p && q ? `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}` : ''; }).join('');
  const dots = Object.entries(pts).map(([key, p]) => { const [x, y] = P(key);
    const mk = p.t === 'pin' ? `<circle cx="${f(x)}" cy="${f(y)}" r="2.8" fill="#fff" stroke="#000" stroke-width="1"/>` : p.t === 'biz' || p.t === 'group' ? `<path d="M${f(x)} ${f(y - 2.4)}l2.4 2.4-2.4 2.4-2.4-2.4z" fill="${p.g === 'harm' ? '#000' : '#fff'}" stroke="#000" stroke-width=".8"/>` : `<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="#000"/>`;
    return mk + (p.no ? `<text x="${f(x + 3)}" y="${f(y - 2.6)}" font-size="4.6" font-family="IBM Plex Mono, monospace" fill="#000">${p.no}</text>` : ''); }).join('');
  const solid = seg(false), dashed = seg(true);
  return `<svg class="sl-chart" viewBox="0 0 ${size} ${size}" aria-label="The constellation">${solid ? `<path d="${solid}" fill="none" stroke="#000" stroke-width=".7"/>` : ''}${dashed ? `<path d="${dashed}" fill="none" stroke="#000" stroke-width=".7" stroke-dasharray="1.6 1.2"/>` : ''}${dots}</svg>`;
}
function drawChart(x, s, cx, cy, size, lw = 1) {
  const pts = chartPts(s); const k = chartFit(pts, size / 2, 7 * lw); const P = key => pts[key] && [cx + pts[key].x * k, cy + pts[key].y * k];
  x.save(); x.strokeStyle = '#000'; x.fillStyle = '#000'; x.lineWidth = lw;
  for (const hot of [false, true]) { x.setLineDash(hot ? [2 * lw, 1.6 * lw] : []); x.beginPath(); for (const [a, b] of s.edges || []) { if (((pts[a] || {}).g === 'harm' || (pts[b] || {}).g === 'harm') !== hot) continue; const p = P(a), q = P(b); if (p && q) { x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); } } x.stroke(); }
  x.setLineDash([]); x.font = `500 ${Math.max(7, Math.round(6.5 * lw))}px "IBM Plex Mono", monospace`; x.textBaseline = 'alphabetic';
  for (const [key, p] of Object.entries(pts)) { const [px, py] = P(key); x.beginPath();
    if (p.t === 'pin') { x.arc(px, py, 3 * lw, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); x.stroke(); x.fillStyle = '#000'; }
    else if (p.t === 'biz' || p.t === 'group') { const r = 2.6 * lw; x.moveTo(px, py - r); x.lineTo(px + r, py); x.lineTo(px, py + r); x.lineTo(px - r, py); x.closePath(); if (p.g === 'harm') x.fill(); else { x.fillStyle = '#fff'; x.fill(); x.stroke(); x.fillStyle = '#000'; } }
    else { x.arc(px, py, 1.8 * lw, 0, Math.PI * 2); x.fill(); }
    if (p.no && lw >= 0.9) x.fillText(String(p.no), px + 3.4 * lw, py - 2.8 * lw); }
  x.restore();
}
/* ───────── the slip on the page, set like an archive record ───────── */
/* the lines written, in order: a slip can carry all four, some, or none */
const linesOf = s => WKEYS.map(k => String((s.lines || {})[k] || '').trim()).filter(Boolean);
function slipHTML(s, blank) {
  const p = s.pin || {}; const hasImg = !blank && s.img && s.img.k !== 'none'; const L = linesOf(s);
  const rels = relOrder(s.nodes || []); const nOf = g => rels.filter(x => relKind(x) === g).length;
  const src = blank ? [] : [...new Set(s.src || [])];
  return `<div class="sl-perf" aria-hidden="true"></div><div class="sl-bar mono"><b>DIRECT ACTION</b><span>W.I.S.H. · TX</span></div><header class="sl-head mono"><span><b class="sl-code">${esc(s.code || 'DA-····')}</b>${s.ex ? '<i class="ex">EX</i>' : ''}</span><span class="sl-time">${blank ? '__.__.__ __:__' : fmtStamp(s.at)}</span></header>`
    + (blank ? `<figure class="sl-fig blank"></figure>` : hasImg ? `<figure class="sl-fig"><img class="sl-img" alt=""><figcaption class="sl-cap mono">${esc(figCredit(s))}</figcaption></figure>` : '')
    + `<div class="sl-body"><div class="sl-life">${blank ? '<b>&nbsp;</b><span class="mono ln"></span>' : `<b>${esc(NAME_UP(s))}</b>${p.n && p.n !== p.cn ? `<i>${esc(p.n)}</i>` : ''}<dl class="sl-meta mono"><dt>SITE</dt><dd>${esc(p.place || '')} · ${(+p.lat).toFixed(4)} ${(+p.lng).toFixed(4)}</dd>${s.when ? `<dt>WINDOW</dt><dd>${esc(s.when)}${s.deg >= 2 ? ` · ${DEG[s.deg]}` : ''}</dd>` : ''}${modeOf(s) ? `<dt>MODE</dt><dd>${esc(modeOf(s))}</dd>` : ''}</dl>`}</div>`
    + (s.threat ? `<p class="sl-threat">${esc(s.threat)}</p>` : '')
    + (blank ? `<ol class="sl-wish poem">${WKEYS.map(k => `<li><small>${esc(WISH[k][0].toLowerCase())}</small></li>`).join('')}</ol>` : L.length ? `<ol class="sl-wish poem">${L.map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol>` : '')
    /* the figure first, as it lies on the ground; then each relation, numbered as the figure numbers it */
    + (rels.length ? `<div class="sl-rel">${rels.length > 1 ? `<figure class="sl-fig2">${chartSVG(s, 72)}</figure>` : ''}<h5 class="sl-h">RELATIONS</h5><ol class="sl-knots">${rels.map((n, i) => { const g = relKind(n); const u = urlOf(n); const first = !i || relKind(rels[i - 1]) !== g; return `<li class="${g}"${first ? ` data-g="${REL_G[g]} · ${nOf(g)}"` : ''}><b class="mono">${pad2(i + 1)}</b><span>${esc(n.n)}${u ? ` <a class="sl-u mono" href="${esc(u)}" target="_blank" rel="noopener">${esc(hostOf(u))}</a>` : ''}</span><small${g === 'harm' ? ' class="red"' : ''}>${esc(relPhrase(n))}</small></li>`; }).join('')}</ol></div>` : '')
    + (s.note ? `<p class="sl-note"><b class="mono">NOTE</b> ${esc(s.note)}</p>` : '')
    + (s.who ? `<p class="sl-who mono">— ${esc(s.who)}</p>` : '')
    /* where an example's lines come from: on screen only, never printed */
    + (src.length ? `<p class="sl-src mono"><b>SOURCES</b>${src.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">${pad2(i + 1)} ${esc(hostOf(u))}</a>`).join('')}</p>` : '')
    + `<div class="sl-qr"></div><p class="sl-acc mono"><span>ACC. ${esc(s.code || 'DA-····')}</span><span>${blank ? 'CHK ····' : `CHK ${chkOf(s)}`}</span></p><p class="sl-foot mono">${esc(CONFIG.COUNTRY)}</p><p class="sl-eot mono"><span>KEEP · FILE · ACT</span><b>EOT</b></p></div>`;
}
function fillSignal(s) {
  const host = $('#s-slip'); host.innerHTML = slipHTML(s); renderQR(host.querySelector('.sl-qr'), qrText(s)); fillFig(host, s, false);
  host.classList.toggle('ex', !!s.ex); host.classList.toggle('tty', isTty());
  $('#r-no').textContent = `${s.code}${s.ex ? ' · EX' : s.recv ? ' · RECEIVED' : ''}`;
  /* each machine as itself, with a link to what it is */
  $('#s-out').innerHTML = OUTPUTS.map(m => `<span class="out-w"><button type="button" class="out" data-out="${m.k}" data-tip="${esc(m.tip)}">${icon(m.ic)}<small>${m.w}</small></button><a class="out-ref" href="${esc(m.ref)}" target="_blank" rel="noopener" aria-label="What a ${esc(m.w)} is" data-tip="What it is">${icon('out', 'sm')}</a></span>`).join('');
  const mine = !s.ex; $('#s-acts').innerHTML = `<button type="button" class="pill" data-sa="remix">${icon('remix', 'sm')}REMIX</button><button type="button" class="pill" data-sa="pin">${icon('where', 'sm')}PIN</button><button type="button" class="pill tty-b" data-sa="style" aria-pressed="${isTty()}" data-tip="Teletype: on screen, on paper and at the printer">${icon('escpos', 'sm')}<span class="scr">${TTY_WORD}</span></button>${mine ? `<button type="button" class="pill quiet" data-sa="remove">${icon('close', 'sm')}REMOVE</button>` : ''}`;
  $('#s-text').hidden = true; $('#s-send').hidden = true; fillSentLine(s);
}
/* where a slip has got to: sent, waiting, shown, in a queue, printed */
function fillSentLine(s) { const el = $('#s-status'); const w = sentWord(s); el.textContent = w; el.hidden = !w; el.classList.toggle('done', /^(PRINTED|SHOWN)/.test(w)); }
/* DIRECT ACTION: the W.I.S.H. becomes a pledge, printed at a partner place, nearest the life first, sent by mesh where that place has a radio, and kept on novel.global */
function openSend(s) {
  const el = $('#s-send'); if (!el.hidden) { el.hidden = true; tick(1100); return; }
  if (s.ex) { toast('AN EXAMPLE'); return; }
  const draw = () => {
    const p0 = s.pin || {}; const list = [...PARTNERS].sort((a, b) => haversine(p0.lat, p0.lng, a.lat, a.lng) - haversine(p0.lat, p0.lng, b.lat, b.lng));
    el.innerHTML = `<h4 class="lab">PRINT AS A PLEDGE</h4><ol>${list.map(p => { const st = PSTATE[p.id] || {}; const d = Number.isFinite(+p0.lat) ? metres(haversine(p0.lat, p0.lng, p.lat, p.lng)) : '';
        return `<li><button type="button" class="dest${p.printer ? ' on' : ''}" data-dest="${esc(p.id)}"><img class="pm" src="${printerImg(p, st)}" alt=""><span class="nm"><b>${esc(p.n)}</b><small class="mono">${esc(p.sub.toUpperCase())}${d ? ` · ${d}` : ''} · ${st.ready ? 'PRINTER ONLINE' : p.printer ? 'NOT YET ONLINE · WAITS IN QUEUE' : 'QUEUE'}${st.queued ? ` · ${st.queued} IN QUEUE` : ''}</small></span></button></li>`; }).join('')}`
      /* the local mesh: every partner's radio that is on carries the pledge's short line, node to node; nothing printed */
      + (() => { const on = PARTNERS.filter(p => (PSTATE[p.id] || {}).mesh); const air = on.filter(p => (PSTATE[p.id] || {}).ready).length;
        return `<li><button type="button" class="dest mesh" data-dest="mesh"><span class="pm board">${icon('mesh')}</span><span class="nm"><b>Local mesh nodes</b><small class="mono">MESHTASTIC · ${bytes(meshText(s))} B · ${on.length ? `${air} OF ${on.length} ON AIR` : 'NO RADIO YET · KEPT FOR WHEN THERE IS'}</small></span></button></li>`; })()
      + `<li><button type="button" class="dest" data-dest=""><span class="pm board">${icon('stories')}</span><span class="nm"><b>novel.global</b><small class="mono">KEPT ONLINE · FOR EVERYONE</small></span></button></li></ol>`
      + `<p class="s-wait mono">${icon('check', 'sm')}KEPT ON NOVEL.GLOBAL · PRINTED · BY MESH · ONCE APPROVED</p>`;
  };
  draw(); el.hidden = false; tick(1700); el.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  loadPartners().then(() => { if (!el.hidden) draw(); });
}
$('#s-send').addEventListener('click', async e => {
  const b = e.target.closest('[data-dest]'); const s = S.issued || S.signals.find(x => x.key === S.sig); if (!b || !s) return;
  const el = $('#s-send'); el.hidden = true; snd.printer(900); buzz([12, 40, 18]);
  try { const v = await directAction(s, b.dataset.dest); fillSentLine(s); toast(v.status === 'outbox' ? 'NO SIGNAL · IT WILL SEND' : 'SENT · WAITING FOR APPROVAL'); refreshPanel(); }
  catch (err) { toast(err.status === 429 ? 'TOO MANY · TRY SOON' : err.status === 503 ? 'BUSY · TRY SOON' : 'NOT SENT'); fillSentLine(s); }
});
$('#s-out').addEventListener('click', e => { const b = e.target.closest('[data-out]'); const s = S.issued || S.signals.find(x => x.key === S.sig); if (b && s) output(b.dataset.out, s, b); });
$('#s-acts').addEventListener('click', async e => {
  const b = e.target.closest('[data-sa]'); const s = S.issued || S.signals.find(x => x.key === S.sig); if (!b || !s) return; const a = b.dataset.sa; tick(1500);
  if (a === 'remix') remixSignal(s);
  if (a === 'pin' && S.mapReady) map.easeTo({ center: [s.pin.lng, s.pin.lat], zoom: Math.max(map.getZoom(), 16), offset: sheetOffset(), duration: reduced() ? 0 : 600 });
  if (a === 'remove') { await ledgerAdd({ type: 'redact', ref: s.key }); snd.snap(0); closeRecord(); }
  if (a === 'style') { prefs.slip = isTty() ? 'paper' : 'tty'; savePrefs(); b.setAttribute('aria-pressed', String(isTty())); snd.tick(1800); buzz(6);
    const host = $('#s-slip'); host.classList.toggle('tty', isTty()); scramble(b.querySelector('.scr'), TTY_WORD);
    if (isTty()) for (const el of host.querySelectorAll('.sl-code, .sl-life b, .sl-acc span')) scramble(el, el.textContent); }
});
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; } }
async function output(k, s, btn) {
  const pre = $('#s-text'); const show = t => { pre.hidden = false; pre.textContent = t; pre.dataset.n = k === 'mesh' ? `${bytes(t)} B` : `${t.length}`; };
  if (k === 'print') { printSlip(s); return; }
  if (k === 'mesh' || k === 'pager') { const t = k === 'mesh' ? meshText(s) : pagerText(s); show(t); const ok = await copyText(t); toast(ok ? `COPIED · ${pre.dataset.n}` : pre.dataset.n); snd.tick(2100); buzz(6); return; }
  if (k === 'link') { const url = linkOf(s); const t = url || meshText(s); try { if (navigator.share && url) { await navigator.share({ title: s.code, text: (s.lines || {}).h || '', url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } show(t); toast((await copyText(t)) ? 'COPIED' : s.code); return; }
  btn.classList.add('busy'); snd.printer(700);
  try {
    if (k === 'bits') download(`${s.code}-384.png`, await slipPNG(s, 384, 2));
    if (k === 'gb') download(`${s.code}-gb-160.png`, await slipPNG(s, 160, 4));
    if (k === 'escpos') download(`${s.code}.bin`, new Blob([await escpos(s)], { type: 'application/octet-stream' }));
    snd.tear();
  } finally { btn.classList.remove('busy'); }
}
/* ───────── images for small printers: 384 dots for a 58 mm thermal head, 160 for a Game Boy printer ───────── */
const ATK = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
function dither(img, levels) {
  const d = img.data, w = img.width, h = img.height; const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255 * (d[i * 4 + 3] / 255) + (1 - d[i * 4 + 3] / 255);
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let v;
    if (levels === 2) {   /* Atkinson: an eighth of the error to six neighbours, a quarter let go: crisp, bright */
      const o = g[i] < 0.5 ? 0 : 1; const err = (g[i] - o) / 8; v = o;
      for (let j = 0; j < 6; j++) { const xx = x + ATK[j][0], yy = y + ATK[j][1]; if (xx >= 0 && xx < w && yy < h) g[yy * w + xx] += err; }
    } else { const t = (B4[(y % 4) * 4 + (x % 4)] + 0.5) / 16 - 0.5; v = clamp(Math.round(g[i] * (levels - 1) + t), 0, levels - 1) / (levels - 1); }   /* ordered, as a Game Boy camera does */
    const c = Math.round(v * 255); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = c; d[i * 4 + 3] = 255;
  }
  return img;
}
/* the slip as an image: its words set first, to learn how tall they are; then the photograph as tall as the words under it */
async function slipCanvas(s, W, levels, tty = isTty()) {
  /* the teletype sets every word in VT323, a terminal's type, a third larger to read the same */
  const k = W / 384; const pad = Math.round(14 * k); const mono = (px, wt = 500) => (tty ? `400 ${Math.max(9, Math.round(px * 1.32 * k))}px VT323, monospace` : `${wt} ${Math.max(7, Math.round(px * k))}px "IBM Plex Mono", monospace`); const sans = (wt, px) => `${wt} ${Math.max(8, Math.round(px * k))}px Poppins, sans-serif`;
  try { await document.fonts.ready; if (tty) await document.fonts.load('16px VT323'); } catch (e) { /* fallback type */ }
  const T = document.createElement('canvas'); T.width = W; T.height = 6000; const x = T.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, T.height); x.fillStyle = '#000'; x.textBaseline = 'top';
  let y = Math.round(6 * k); const p = s.pin || {};
  /* words set to the width they have, measured in the face they are set in */
  const wrapPx = (t, maxW) => { const out = []; let line = ''; for (const w of String(t || '').split(/\s+/).filter(Boolean)) { const next = line ? `${line} ${w}` : w; if (!line || x.measureText(next).width <= maxW) line = next; else { out.push(line); line = w; } } if (line) out.push(line); return out; };
  const text = (t, font, lh, indent = '', at = pad) => { x.font = font; for (const l of wrapPx(t, W - pad - at)) { x.fillText(l, at, y); y += lh; } };
  const rule = () => { y += Math.round(6 * k); x.fillRect(pad, y, W - pad * 2, Math.max(1, Math.round(1.5 * k))); y += Math.round(10 * k); };
  const field = (kk, v) => { x.font = mono(10, 600); x.fillText(kk, pad, y + Math.round(2 * k)); const y0 = y; text(v, mono(12), Math.round(16 * k), '', pad + Math.round(70 * k)); if (y === y0) y += Math.round(16 * k); };
  if (s.img && s.img.k !== 'none') { text(figCredit(s), mono(10), Math.round(14 * k)); rule(); }
  const sansT = (wt, px) => (tty ? mono(px) : sans(wt, px));
  text(NAME_UP(s), sansT(700, 18), Math.round(22 * k)); if (p.n && p.n !== p.cn) text(p.n, sansT(400, 12), Math.round(16 * k));
  y += Math.round(3 * k); field('SITE', `${p.place || ''} · ${(+p.lat).toFixed(4)} ${(+p.lng).toFixed(4)}`); if (s.when) field('WINDOW', `${s.when}${s.deg >= 2 ? ` · ${DEG[s.deg]}` : ''}`);
  if (s.threat) { rule(); text(s.threat, sansT(500, 15), Math.round(20 * k)); }
  const lines = linesOf(s); if (lines.length) { rule(); for (const l of lines) { text(l, mono(16, 600), Math.round(21 * k)); y += Math.round(7 * k); } }
  const rels = relOrder(s.nodes || []);
  if (rels.length) {
    rule();
    /* the figure first, as it lies on the ground, numbered as the relations under it are */
    if (rels.length > 1) { const cw = Math.min(W - pad * 2, Math.round(116 * k)); drawChart(x, s, W / 2, y + cw / 2, cw, Math.max(1, k * 1.2)); y += cw + Math.round(10 * k); }
    x.font = mono(11, 600); x.fillText('RELATIONS', pad, y); y += Math.round(17 * k); let g0 = '';
    rels.forEach((n, i) => {
      const g = relKind(n); if (g !== g0) { g0 = g; y += Math.round(3 * k); x.font = mono(10, 600); x.fillText(`${REL_G[g]} · ${rels.filter(r => relKind(r) === g).length}`, pad, y); y += Math.round(15 * k); }
      x.font = mono(12, 600); x.fillText(pad2(i + 1), pad, y); text(n.n, mono(12, 600), Math.round(16 * k), '', pad + Math.round(28 * k));
      const u = hostOf(urlOf(n)); text(`${relPhrase(n)}${u ? ` · ${u}` : ''}`, mono(11), Math.round(15 * k), '', pad + Math.round(28 * k));
      y += Math.round(4 * k);
    });
  }
  if (s.note) { rule(); field('NOTE', s.note); }
  if (s.who) { rule(); text(`— ${s.who}`, mono(13), Math.round(18 * k)); }
  /* the code: the link, or the mesh message; at a size a phone can read off thermal paper */
  const qr = qrOf(qrText(s)); if (qr) { const n = qr.getModuleCount(); const m = Math.floor((W - pad * 2) / (n + 4)); if (m >= (levels === 2 ? 3 : 1) && n * m <= W) { y += Math.round(10 * k); const ox = Math.round((W - n * m) / 2); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) x.fillRect(ox + c * m, y + r * m, m, m); y += n * m + Math.round(8 * k); } }
  if (tty) {
    const twin = (a, b, font) => { x.font = font; x.fillText(a, pad, y); x.fillText(b, W - pad - x.measureText(b).width, y); };
    const thin = Math.max(1, Math.round(1.5 * k)); x.fillRect(pad, y, W - pad * 2, thin); y += thin + Math.max(2, Math.round(2 * k)); x.fillRect(pad, y, W - pad * 2, thin); y += Math.round(9 * k);
    twin(`ACC. ${s.code}`, `CHK ${chkOf(s)}`, mono(11, 600)); y += Math.round(17 * k);
    text(CONFIG.COUNTRY, mono(10), Math.round(14 * k)); y += Math.round(4 * k);
    twin('KEEP · FILE · ACT', 'EOT', mono(10, 600)); y += Math.round(14 * k) + pad;
  } else { text(CONFIG.COUNTRY, mono(10), Math.round(14 * k)); y += pad; }
  const textH = y;
  /* the head of the slip, then the photograph: as tall as everything under it, between four fifths and eight fifths of its width */
  const barH = tty ? Math.round(20 * k) : 0; const headH = barH + Math.round(36 * k); const src = sigSrc(s, false); let photo = null; let imgH = 0;
  if (src) { imgH = Math.round(clamp(textH, W * 0.8, W * 1.6)); try { photo = await bwCanvas(src, W, imgH, levels); } catch (e) { photo = null; } }
  if (!photo) { imgH = src ? Math.round(W * 0.5) : 0; }
  const out = document.createElement('canvas'); out.width = W; out.height = headH + imgH + Math.round(10 * k) + textH; const o2 = out.getContext('2d'); o2.fillStyle = '#fff'; o2.fillRect(0, 0, W, out.height); o2.fillStyle = '#000'; o2.textBaseline = 'top';
  /* the head: a bar printed in reverse, as an old terminal marked a transmission; then the code and when */
  if (tty) { o2.fillRect(0, 0, W, barH); o2.fillStyle = '#fff'; o2.font = mono(11, 600); o2.fillText('DIRECT ACTION', pad, Math.round(5 * k)); const tx = 'W.I.S.H. · TX'; o2.fillText(tx, W - pad - o2.measureText(tx).width, Math.round(5 * k)); o2.fillStyle = '#000'; }
  o2.font = mono(18, 600); o2.fillText(s.code, pad, barH + Math.round(9 * k)); o2.font = mono(13); const st = fmtStamp(s.at); o2.fillText(st, W - pad - o2.measureText(st).width, barH + Math.round(12 * k));
  if (photo) o2.drawImage(photo, 0, headH);
  else if (imgH) M.glyph(o2, p.g || 'paw', W / 2, headH + imgH / 2, imgH * 0.7, '#000');
  o2.drawImage(T, 0, 0, W, textH, 0, headH + imgH + Math.round(10 * k), W, textH);
  /* everything to the printer's inks: two for a thermal head, four greys for a Game Boy */
  const id = o2.getImageData(0, 0, W, out.height); const d = id.data; for (let i = 0; i < d.length; i += 4) { const v = d[i] / 255; const q = levels === 2 ? (v < 0.55 ? 0 : 1) : Math.round(v * 3) / 3; d[i] = d[i + 1] = d[i + 2] = Math.round(q * 255); d[i + 3] = 255; }
  o2.putImageData(id, 0, 0);
  return out;
}
async function slipPNG(s, W, levels, tty = isTty()) { const cv = await slipCanvas(s, W, levels, tty); return new Promise(res => cv.toBlob(b => res(b), 'image/png')); }
/* ───────── raw bytes for an ESC/POS receipt printer: the photograph as raster lines, the slip with its figure above the relations,
   a QR code and a cut. The paper sets the width: 384 dots and 32 columns on 58 mm, about 512 and 42 on 80 mm (DA_PRINTERS) ───────── */
const PRINTERS = window.DA_PRINTERS || { 58: { w: '58 MM', dots: 384, cols: 32 } };
/* a black and white canvas as GS v 0 raster, in bands of up to 255 rows */
function rasterOf(cv) {
  const W = cv.width, H = cv.height, bw = W >> 3; const d = cv.getContext('2d').getImageData(0, 0, W, H).data; const out = [];
  for (let y0 = 0; y0 < H; y0 += 255) {
    const h = Math.min(255, H - y0); out.push(0x1D, 0x76, 0x30, 0x00, bw & 0xFF, bw >> 8, h & 0xFF, h >> 8);
    for (let y = y0; y < y0 + h; y++) for (let xb = 0; xb < bw; xb++) { let v = 0; for (let bit = 0; bit < 8; bit++) if (d[(y * W + xb * 8 + bit) * 4] < 128) v |= 0x80 >> bit; out.push(v); }
  }
  return out;
}
async function escpos(s, paper = '58', tty = isTty()) {
  const P = PRINTERS[paper] || PRINTERS[58] || { dots: 384, cols: 32 }; const W = P.dots - (P.dots % 8);
  const b = []; const put = (...a) => { for (const v of a) b.push(v); }; const txt = t => { for (const ch of ascii(t)) put(ch.charCodeAt(0)); }; const img = cv => { for (const v of rasterOf(cv)) b.push(v); put(0x0A); };
  put(0x1B, 0x40, 0x1B, 0x74, 0x00);                                        /* initialise; code page 437 */
  if (tty) { put(0x1D, 0x42, 0x01, 0x1B, 0x45, 0x01); txt(padTo(' DIRECT ACTION', 'W.I.S.H. - TX ', P.cols) + '\n'); put(0x1D, 0x42, 0x00); }   /* a bar printed in reverse */
  put(0x1B, 0x61, 0x01, 0x1B, 0x45, 0x01, 0x1D, 0x21, 0x11); txt(s.code + '\n'); put(0x1D, 0x21, 0x00, 0x1B, 0x45, 0x00, 0x1B, 0x61, 0x00);
  /* the photograph, square, the width of the paper */
  const src = sigSrc(s, false);
  if (src) { try { img(await bwCanvas(src, W, W, 2)); } catch (e) { /* no pixels to share: the words alone */ } }
  const lines = slipText(s, P.cols, tty).split('\n').slice(1); const ri = lines.indexOf('RELATIONS');
  txt((ri < 0 ? lines : lines.slice(0, ri)).join('\n') + '\n');
  if (ri >= 0) {
    /* the figure as it lies on the ground, above the relations it numbers */
    if (relOrder(s.nodes || []).length > 1) { const H = Math.round(W * 0.5) & ~7; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); drawChart(x, s, W / 2, H / 2, H - 8, W / 200); img(cv); }
    txt(lines.slice(ri).join('\n') + '\n');
  }
  const q = unescape(encodeURIComponent(qrText(s))); const n = q.length + 3;
  if (q.length < 1200) {   /* up to about version 26 at three dots a module: still inside 384 dots */
    put(0x1B, 0x61, 0x01);
    put(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);              /* model 2 */
    put(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, q.length > 600 ? 0x03 : q.length > 300 ? 0x04 : 0x06);   /* module size */
    put(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30);                    /* error correction L */
    put(0x1D, 0x28, 0x6B, n & 0xFF, n >> 8, 0x31, 0x50, 0x30); for (const ch of q) put(ch.charCodeAt(0) & 0xFF);
    put(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);                    /* print it */
    put(0x0A, 0x1B, 0x61, 0x00);
  }
  txt(slipFoot(s, P.cols, tty) + '\n'); put(0x1B, 0x64, 0x04, 0x1D, 0x56, 0x42, 0x00);   /* feed, cut */
  return new Uint8Array(b);
}
/* ───────── printed from the browser: a strip 58 mm wide, as long as the slip ───────── */
let pressBusy = Promise.resolve();
const serial = job => { const run = () => job(); pressBusy = pressBusy.then(run, run); return pressBusy; };
function printSheet(el) {
  const mm = Math.ceil(el.offsetHeight * 25.4 / 96) + 6;
  let st = $('#page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); } st.textContent = `@page{size:58mm ${Math.max(60, mm)}mm;margin:0}`;
  window.__lastSlip = { mm, text: el.textContent.replace(/\s+/g, ' ').trim() };
  window.print();
}
function printSlip(s, blank) {
  return serial(async () => {
    const el = $('#p-slip'); el.innerHTML = slipHTML(s, blank); el.classList.toggle('blank', !!blank); el.classList.toggle('tty', isTty());
    if (!blank) renderQR(el.querySelector('.sl-qr'), qrText(s)); else el.querySelector('.sl-qr').innerHTML = '';
    try { await document.fonts.ready; if (isTty()) await document.fonts.load('16px VT323'); } catch (e) { /* fallback type */ }
    if (!blank) await fillFig(el, s, true);
    snd.printer(900); printSheet(el);
  });
}
function printBlank() { printSlip({ code: 'DA-____', at: Date.now(), pin: {}, lines: {}, nodes: [] }, true); }
/* ───────── the print it will make, small, on the card: so it can be seen before it exists ───────── */
let miniN = 0;
async function drawMini(cv, o) {
  if (!cv || !o) return; const my = ++miniN; const x = cv.getContext('2d'); const W = cv.width, H = cv.height; const k = W / 120;
  const fig = strings.snapshot(); const c = imgChoice(o); const src = imgSrc(c, o.id, o, false);
  const paint = photo => {
    if (my !== miniN) return; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.fillStyle = '#FCFBF7'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#141412'; let y = 6 * k; x.fillRect(6 * k, y, 30 * k, 3 * k); x.fillRect(W - 30 * k, y, 24 * k, 3 * k); y += 7 * k;
    const ih = Math.round(H * 0.42); if (photo) x.drawImage(photo, 0, y, W, ih); else { x.fillStyle = '#E6E5DE'; x.fillRect(0, y, W, ih); M.glyph(x, lifeOf(o), W / 2, y + ih / 2, ih * 0.6, '#141412'); x.fillStyle = '#141412'; } y += ih + 6 * k;
    x.fillRect(6 * k, y, Math.min(W - 12 * k, 8 * k + nameOf(o).length * 3.2 * k), 4.5 * k); y += 9 * k;
    x.globalAlpha = 0.35; for (let i = 0; i < 2; i++) { x.fillRect(6 * k, y, (W - 12 * k) * (i ? 0.62 : 1), 2.4 * k); y += 5 * k; } x.globalAlpha = 1; y += 2 * k;
    for (let i = 0; i < 4; i++) { x.fillRect(6 * k, y, (W - 12 * k) * [0.82, 0.7, 0.9, 0.66][i], 3 * k); y += 6.5 * k; }
    /* the figure, then the relations under it */
    y += 2 * k; const cw = Math.min(30 * k, H - y - 18 * k);
    if (fig.nodes.length > 1 && cw > 14 * k) { drawChart(x, fig, W / 2, y + cw / 2, cw, Math.max(0.6, k * 0.55)); y += cw + 3 * k; }
    x.globalAlpha = 0.5; for (let i = 0; i < Math.min(4, fig.nodes.length) && y + 3 * k < H; i++) { x.fillRect(6 * k, y, (W - 12 * k) * 0.6, 2.2 * k); y += 4.5 * k; } x.globalAlpha = 1;
  };
  paint(null);
  if (src) try { paint(await bwCanvas(src, W, Math.round(H * 0.42), 2)); } catch (e) { /* the mark stands in */ }
}

/* ───────── a story opened: its life, open and live, with the slip turned up. Its knots can be looked at and joined like any other ───────── */
function openSignal(key) {
  const s = S.signals.find(x => x.key === key || x.code === key); if (!s) return;
  select(cellOfSignal(s).id, { sig: s });
}
/* a story's cell: the sighting itself when it is here, else a cell of its own, made from what the story carries.
   One cell, one mark: the story stands where its life was, and opens as that life */
function cellOfSignal(s) {
  const p = s.pin || {}; if (p.id && S.byId.has(p.id) && !S.byId.get(p.id).story) return S.byId.get(p.id);
  const id = 'sp:' + s.code; if (S.byId.has(id)) return S.byId.get(id);
  const im = s.img && s.img.k === 'inat' && s.img.u ? { u: s.img.u, l: s.img.l || 'cc-by-nc', a: s.img.a || '' } : null; const own = s.img && s.img.k === 'own' ? OWN[s.code] || s.photo || null : null;
  const o = { id, sigPin: true, story: s.key, code: s.code, ex: !!s.ex, shared: !!s.shared, g: p.g || 'paw', lat: +p.lat, lng: +p.lng, at: s.at, d: isoDay(new Date(s.at)), age: 0, rare: 0.5, ...(im ? { ph: im } : {}), ...(own ? { photo: own } : {}),
    tx: { id: null, n: p.n || p.cn || '', cn: p.cn || p.n || '', ic: p.ic || IC_OF_GLYPH[p.g] || 'Animalia', th: false, na: true, intro: false } };
  S.byId.set(id, o); return o;
}
/* every story with a place on the ground, as the cell it stands in */
function storyCells() { const out = []; for (const s of S.signals) { if (!s.pin || !Number.isFinite(+s.pin.lat) || !Number.isFinite(+s.pin.lng)) continue; const o = cellOfSignal(s); if (o.story && !out.includes(o)) out.push(o); } return out; }
function remixSignal(s) {
  const o = cellOfSignal(s); strings.seed(o, s); remixLines = { ...(s.lines || {}) };
  if (s.img && s.img.k === 'inat' && !IMGS[o.id]) { IMGS[o.id] = s.img; saveImgs(); }
  select(o.id, { cell: true }); setTimeout(() => { if (S.sel === o.id) toWish(o); }, reduced() ? 0 : 450);
}
/* receiving: a link, the packed signal, or a mesh message pasted in */
async function receive(text) {
  let s = null; const t = String(text).trim();
  /* the code printed on a slip: its story, from this device or the board */
  const code = codeIn(t); if (code) return receiveCode(code);
  try {
    const m = t.match(/#x=([A-Za-z0-9_-]+)/) || t.match(/^([A-Za-z0-9_-]{40,})$/);
    if (m) s = unpackSignal(m[1]);
    else if (/^DA-[0-9A-Z]{4}\b/.test(t)) {
      const L = t.split(/\n/); const code = L[0].slice(0, 7); const name = L[0].slice(8).trim(); const ll = (L[1] || '').match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (!ll) throw new Error('where'); const lines = {}; L.slice(2).filter(l => l.trim()).slice(0, 4).forEach((l, i) => { const mm = l.match(/^([WISH])\s+(.*)$/); lines[mm ? mm[1].toLowerCase() : WKEYS[i]] = (mm ? mm[2] : l).trim().slice(0, SIG.line); });
      s = { v: 1, code, at: Date.now(), pin: { lat: +ll[1], lng: +ll[2], cn: title(name), n: '', g: 'paw', place: suburbAt(+ll[1], +ll[2]) }, threat: '', when: '', deg: 0, lines, nodes: [], edges: [] };
    }
  } catch (e) { s = null; }
  if (!s) { toast('NOT A SIGNAL'); nudge($('#rx-t')); return null; }
  const have = S.signals.find(x => x.code === s.code);
  if (!have) { const ev = await ledgerAdd({ type: 'signal', lat: s.pin.lat, lng: s.pin.lng, who: s.who || '', data: { ...s, recv: true } }); snd.pluck(0.4, 0); openSignal(ev.key); }
  else openSignal(have.key);
  return s;
}
