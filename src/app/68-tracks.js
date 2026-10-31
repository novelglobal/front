/* ════════════════════════════════════════════════════════════════════
   TRACKS (stations in an earlier build) — collections of the map. The radar is the instrument: when the sweep reaches a cell, the cell sounds, and a small
   ring shows where. A station decides whether its cells sound, its fader how loud, the mood how: FOG a breath of a voice,
   RAIN a crushed glitch, WEIGHT a thud. Nothing plays on its own: no tune, no grid, no backing. What sounds is what is there:
   pitch from the kind's place on one harmonic series, brighter if new, fainter as it ages, bent or doubled if in danger;
   places in their own small real sounds when their station is on; and under the trail, a drone that swells only over clusters
   of life. Nature is always seen (unless unlocked on the approval page) and on from the first touch, and can be muted.
   ════════════════════════════════════════════════════════════════════ */
/* the moods, turned round on each layer's key. Since the sound moved to one deep key at 120 BPM (brief 0.06, stage C) six are
   left: DUB, WEIGHT (a sub that drops), DUST, STAB, FOG and BURIAL. The others stay listed only so a radio link made with one
   still reads, and sound as the nearest deep one (MOOD_AS); new moods go at the end, since a link keeps a mood by its place */
const MOODS = { fog: { w: 'FOG', ic: 'dusk' }, rain: { w: 'RAIN', ic: 'rain' }, weight: { w: 'WEIGHT', ic: 'night' }, jelly: { w: 'JELLY', ic: 'jelly' }, burial: { w: 'BURIAL', ic: 'ghost' }, haunt: { w: 'HAUNT', ic: 'zanom' }, voodoo: { w: 'VOODOO', ic: 'candle' }, cheek: { w: 'CHEEKY', ic: 'star5' }, blown: { w: 'BLOWN', ic: 'flame' }, collective: { w: 'COLLECTIVE', ic: 'people' }, dub: { w: 'DUB', ic: 'sound' }, dust: { w: 'DUST', ic: 'ground' }, stab: { w: 'STAB', ic: 'harm' }, boa: { w: 'BOADICEA', ic: 'jelly' } };
const MOOD_AS = { rain: 'dust', jelly: 'dub', haunt: 'stab', voodoo: 'stab', cheek: 'dust', blown: 'stab', collective: 'dub' };
const MOOD_ON = ['boa', 'dub', 'weight', 'dust', 'stab', 'fog', 'burial'];
const moodIs = m => (MOODS[m] ? MOOD_AS[m] || m : null);
const moodOf = () => moodIs(prefs.mood) || 'fog';
const F0 = 55, PARTIALS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16];
const partialOf = key => { let h = 2166136261; for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return PARTIALS[(h >>> 0) % PARTIALS.length]; };
const lvlOf = id => { const v = (prefs.lvl || {})[id]; return v == null ? (id === 'life' ? 0.8 : 0.7) : clamp(v, 0, 1); };
const TRK_FAMS = ['brand', 'service', 'third', 'network', 'circular', 'artists'];
const FAM_IC = { brand: 'sign', service: 'give', third: 'host', network: 'people', circular: 'remix', artists: 'note', people: 'hug' };
/* a pack's cells, sounded as the lives and places nearest them */
const PACK_SPEC = { fruit: { g: 'plant' }, tree: { g: 'plant' }, garden: { g: 'bee' }, node: { fam: 'network' }, water: { g: 'aquatic' }, shade: { fam: 'third' }, refuge: { fam: 'people' }, place: { fam: 'service' } };
const TRK = { on: {}, voices: {} };
/* the tracks there are: the lives, the places, and every pack of cells shown to everyone */
function trackList() {
  const packs = (SHARED.list || []).filter(x => x.kind === 'cells').map(x => { let d = {}; try { d = JSON.parse(x.body); } catch (e) { /* none */ }
    return { id: 'p:' + x.code, tip: d.title || '', kinds: [...new Set((d.cells || []).map(c => c.k))].filter(k => PACK_KINDS[k]).slice(0, 8) }; });
  return [{ id: 'life' }, { id: 'places' }, ...packs];
}
/* what each track plays: the kinds of life in the radar, most seen first; the parts of the human ecology in it; a pack's kinds */
function trackVoices(id) {
  if (id === 'life') {
    const n = new Map();
    for (const it of life.items) { if (!it.inS || it.o.hist || it.o.ob || it.o.story || it.o.pack || it.b.tone === 'hist' || isCold(it.o)) continue; const g = it.o.hum ? 'human' : glyphOf(it.o); if (g) n.set(g, (n.get(g) || 0) + 1); }
    return [...n].sort((x, y) => y[1] - x[1]).slice(0, 8).map(([g]) => ({ g, spec: { g: g === 'human' ? 'ape' : g } }));
  }
  if (id === 'places') { const fams = new Set(bizNear(S.scan.lat, S.scan.lng, S.scan.r).map(b => b.fam)); return TRK_FAMS.filter(f => fams.has(f)).map(fam => ({ fam, spec: { fam } })); }
  const t = trackList().find(x => x.id === id); return t ? t.kinds.map(k => ({ pk: k, spec: PACK_SPEC[k] || PACK_SPEC.place })) : [];
}
const tkSel = id => `[data-tk="${CSS.escape(id)}"]`;
/* each kind keeps its own voice, from its name */
const flashVoice = (id, key) => partialOf(key || 'x') % 8;
function pingCell(it, first) {
  const o = it.o; const id = o.pack ? 'p:' + o.pack : 'life'; if (!TRK.on[id] || !prefs.sound || LOOP.live) return false; const L = lvlOf(o.pack ? 'community' : 'life'); if (L < 0.02) return false; flashLayer(o.pack ? 'community' : 'life');
  const g = o.pack ? o.pk : o.hum ? 'human' : glyphOf(o); const vi = flashVoice(id, g);
  return snd.ping(o.pack ? (PACK_SPEC[o.pk] && PACK_SPEC[o.pk].fam ? PACK_SPEC[o.pk] : { g }) : { g }, F0 * partialOf(g || 'x') * (it.b.tone === 'flora' ? 2 : 1),
    { mood: moodOfLayer(o.pack ? 'community' : 'life'), v: 0.05 * L * (first ? 1 : 0.6) * (0.35 + 0.65 * (it.fade == null ? 1 : it.fade)), pan: Math.sin((it.sb || 0) * Math.PI / 180) * 0.7, bright: !!it.flag, danger: !!(it.alarm || it.b.dz >= 3), vi: Math.max(0, vi), cluster: (it.pile || 0) >= 2, fx: fxOf(o.pack ? 'community' : 'life') });
}
function pingPlace(p) {
  if (!TRK.on.places || !prefs.sound || LOOP.live) return false; const L = lvlOf(p.on ? 'pollution' : 'community'); if (L < 0.02) return false;
  /* a busy street is not a wall of sound: the places listed by name always, a third of the rest */
  if (!p.cur && partialOf(p.n) % 3) return false; flashLayer(p.on ? 'pollution' : 'community');
  return snd.ping({ fam: p.fam }, F0 * partialOf(p.fam), { mood: moodOfLayer(p.on ? 'pollution' : 'community'), vi: partialOf(p.n || p.fam) % 8, v: 0.04 * L, pan: Math.sin((p.sb || 0) * Math.PI / 180) * 0.7, fx: fxOf(p.on ? 'pollution' : 'community') });
}
const playIcon = (id, on) => (id === 'life' ? icon('sound', 'sm') : icon(on ? 'pause' : 'play', 'sm'));
function setTrack(id, on) {
  TRK.on[id] = on; const el = document.querySelector(tkSel(id));
  if (el) { el.classList.toggle('on', on); const b = el.querySelector('.tk-play'); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('muted', id === 'life' && !on); b.innerHTML = playIcon(id, on); }
}
function stopTracks() { for (const id of Object.keys(TRK.on)) if (TRK.on[id]) setTrack(id, false); }
/* seen on the map, or not: kept on this device */
function seeIt(id, on) {
  if (id === 'life' && CFG.lifeLock) return;
  prefs.trk = { ...(prefs.trk || {}), [id]: on }; savePrefs();
  const el = document.querySelector(tkSel(id)); if (el) { el.classList.toggle('seen', on); el.querySelector('.tk-see').setAttribute('aria-pressed', String(on)); }
  life.redraw(); life.moved();
}
/* how fresh a station's data is, for its hover: how many are in the radar, the newest, when the list was last checked */
function freshOf(id) {
  if (id === 'life') { const its = life.items.filter(it => it.inS && !it.o.story && !it.o.pack && !it.o.hist); const newest = Math.max(0, ...its.map(it => stampOf(it.o) || 0)); return [`${its.length}`, newest ? `NEWEST ${ago(newest)}` : '', S.lastSignal ? `CHECKED ${ago(S.lastSignal)}` : ''].filter(Boolean).join(' · '); }
  if (id === 'places') return `${bizNear(S.scan.lat, S.scan.lng, S.scan.r).length}`;
  const x = (SHARED.list || []).find(y => 'p:' + y.code === id); return x ? `${(JSON.parse(x.body || '{}').cells || []).length} · ${ago(x.at)}` : '';
}
/* ════════════════════════════════════════════════════════════════════
   THE RADIO — live data layers, mixed. Each layer is live data on the map: what it holds, a meter that moves as the sweep
   plays it, a level, and on or off. The radio plays nothing until it is turned on; then the sweep plays every layer that is
   on, and every constellation it passes. The mix (where, which layers, how loud, the mood, the constellations) is shared to
   SIGNALS as a small versioned object: MIX_V, mixNow(). A layer is added here, in LAYERS, with its key, word, icon, count
   and the internal tracks it switches; nothing else needs to change
   ════════════════════════════════════════════════════════════════════ */
const LAYERS = [
  { k: 'life', w: 'LIFE', ic: 'fauna', trk: () => ['life'] },
  { k: 'community', w: 'COMMUNITY', ic: 'people', trk: () => ['places', ...trackList().filter(t => t.id.startsWith('p:')).map(t => t.id)] },
  { k: 'water', w: 'WATER', ic: 'water', trk: () => ['water'] },
  { k: 'pollution', w: 'POLLUTION', ic: 'harm', trk: () => ['places'] },
];
const TRACKS = LAYERS;   /* the name an earlier build used */
const trackOn = k => (k === 'life' ? !prefs.mute : !!T4[k]);
const layerLvl = k => lvlOf(k);
/* each layer has its own mood: FOG, RAIN or WEIGHT, changed on its row */
/* the radio as it first sounds, before a mood is turned: deep and slow, dub and ambient. LIFE a dub chord stab into tape echo,
   WATER a sub note that drops, COMMUNITY filtered dust and noise, POLLUTION a low detuned stab */
const LM_DEF = { life: 'dub', community: 'dust', water: 'weight', pollution: 'stab' };
/* a first visit hears LIFE after Boadicea: a choir for a cluster, a depth charge for a life in danger, a round low note for the rest */
const moodOfLayer = k => moodIs((prefs.lm || {})[k]) || moodIs(prefs.mood) || (k === 'life' && simple() ? 'boa' : LM_DEF[k]) || 'dub';
/* the filter each layer is heard through, as its knob is turned: MIST, HALL, DEPTH */
const FXS = ['mist', 'hall', 'depth'];
const fxOf = k => (FXS.includes((prefs.fx || {})[k]) ? prefs.fx[k] : 'mist');
/* what each layer holds inside the radar now: a count, nothing more */
function trackCount(k) {
  if (k === 'life') return life.items.filter(it => it.inS && !it.o.story && !it.o.pack && !it.o.hist).length;
  if (k === 'water') return life.climateIn().length;
  const ps = bizNear(S.scan.lat, S.scan.lng, S.scan.r); const ex = ps.filter(b => (b.h || []).length).length;
  return k === 'pollution' ? ex : ps.length - ex + (SHARED.list || []).filter(x => x.kind === 'cells').length;
}
/* the internal tracks follow the radio and the layers: on air only while the radio is on */
function syncTracks() {
  const on = id => S.radio && prefs.sound && LAYERS.some(L => trackOn(L.k) && L.trk().includes(id));
  for (const id of ['life', 'places', 'water', ...trackList().filter(t => t.id.startsWith('p:')).map(t => t.id)]) { const v = on(id); if (!!TRK.on[id] !== v) setTrack(id, v); }
}
function setTrack4(k, on) {
  if (k === 'life') { prefs.mute = !on; if (!CFG.lifeLock) prefs.trk = { ...(prefs.trk || {}), life: on }; }
  else T4[k] = on;
  prefs.t4 = { ...T4 }; savePrefs();
  if (k === 'water' && on) loadOverlays();
  syncTracks();
  document.querySelectorAll(`[data-t4="${k}"]`).forEach(b => { b.setAttribute('aria-pressed', String(on)); const row = b.closest('.lyr'); if (row) row.classList.toggle('on', on); });
  life.redraw(); life.moved(); snd.tick(on ? 1900 : 1200);
}
/* the radio on: the sound woken inside the touch, and every layer that is on played by the sweep. Off: quiet, and still */
/* the first clue lived over the ground in an earlier build; it is in the page now */
function arcadeOff() { const el = $('#arcade'); if (el) el.hidden = true; }
/* started: the radar stands where it was last, or where the touch was, or where the map is looking */
function startRadio(play = true, at) {
  arcadeOff();
  if (!S.started) {
    S.started = true; const c = at || (prefs.placed ? null : S.mapReady ? map.getCenter() : null);
    if (c) { prefs.placed = true; savePrefs(); life.setScan(c.lat, c.lng, CONFIG.SCAN_FIRST || 500, true); tootOrTick(); } else life.setScan(null, null, null, false);
  }
  life.redraw(); life.moved(); if (play) setRadio(true); if (S.open && S.view === 0 && !S.mode) refreshPanel();
}
/* a song made: a layer changed, a mood, a volume, a string tied. Only then can a signal start */
/* a connection made: a string tied, a constellation begun. Only then does the next clue wait */
function markConnect() {
  /* a first visit: a string tied is something noticed too, and W.I.S.H. holds the life and its figure (43-journey.js) */
  if (simple() && prefs.journey >= 1 && S.mode === 'ping') { const c = jSelConn(); if (c) setTimeout(() => { if (S.mode === 'ping') closeRecord('view'); jPick(c); }, reduced() ? 0 : 420); }
  if (S.connected) return; S.connected = true; markTweak(); if (S.open && S.view === 0 && !S.mode) refreshPanel();
}
function markTweak() { if (S.tweaked) return; S.tweaked = true; if (S.open && S.view === 0 && !S.mode) refreshPanel(); }
function setRadio(on) {
  if (on && !S.started) { startRadio(true); return; }
  S.radio = on; if (!on && LOOP.on) setLoop(false, null); try { if (IN_AURA) window.parent.postMessage({ ng: 'radio', on: !!on }, location.origin); } catch (e) { /* alone */ }
  if (on) { snd.wake(); if (!prefs.sound) { prefs.sound = true; savePrefs(); } nudgeWishSoon(); }
  syncTracks(); if (on) life.replay();
  document.querySelectorAll('[data-radio]').forEach(b => { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); const ic = b.querySelector('svg.i'); if (ic) ic.outerHTML = icon(on ? 'pause' : 'play'); else b.insertAdjacentHTML('beforeend', icon(on ? 'pause' : 'play')); });
  document.body.classList.toggle('on-air', on); buzz(on ? [8, 30, 8] : 6); life.redraw(); life.moved();
}
/* the radio's VU meter, on its studio side: the needle kicks with every cell the sweep plays and falls back */
let vuT = 0, vuV = 0;
function vuKick() { const n = document.querySelector('#view .vu'); if (!n) return; vuV = Math.min(1, vuV * 0.6 + 0.42); n.style.setProperty('--v', vuV.toFixed(2)); clearTimeout(vuT); vuT = setTimeout(() => { vuV = 0; n.style.setProperty('--v', '0'); }, 160); }
/* a layer's meter moves as the sweep plays it */
function flashLayer(k) {
  vuKick();
  const m = document.querySelector(`.lyr[data-lyr="${k}"] .lv`); if (!m) return; const i = m.children[Math.floor(Math.random() * m.children.length)];
  if (i) { i.classList.add('hit'); setTimeout(() => i.classList.remove('hit'), 380); }
}
/* water: a drop; a pond or wetland lower, a fountain higher */
function pingClimate(c) {
  if (!TRK.on.water || !prefs.sound || LOOP.live) return false; flashLayer('water');
  return snd.ping({ g: 'aquatic' }, F0 * (c.k === 'fountain' ? 12 : 6), { mood: moodOfLayer('water'), v: 0.045 * layerLvl('water'), pan: Math.sin((c.sb || 0) * Math.PI / 180) * 0.7, fx: fxOf('water') });
}
/* a layer's volume, three steps: quiet, half, full */
const VOLS = [0.18, 0.5, 1];
const volStep = k => VOLS.reduce((best, v, i) => (Math.abs(v - layerLvl(k)) < Math.abs(VOLS[best] - layerLvl(k)) ? i : best), 0);
function layersHTML() {
  return `<ol class="lyrs" role="group" aria-label="Layers">${LAYERS.map((L, i) => { const on = trackOn(L.k); const m = MOODS[moodOfLayer(L.k)]; const v = volStep(L.k);
    return `<li class="lyr${on ? ' on' : ''}" data-lyr="${L.k}"><button type="button" class="lyr-k" data-t4="${L.k}" aria-pressed="${on}" aria-keyshortcuts="${i + 1}" aria-label="${L.w}" data-tip="${L.w}">${icon(L.ic)}</button>`
      + `<button type="button" class="lyr-m" data-lmood="${L.k}" aria-label="${L.w} mood: ${m.w}">${icon(m.ic, 'sm')}</button>`
      + `<span class="lv" aria-hidden="true">${'<i></i>'.repeat(8)}</span>`
      + `<button type="button" class="lyr-v" data-vol="${L.k}" data-v="${v}" aria-label="${L.w} volume">${'<i></i>'.repeat(3)}</button></li>`; }).join('')}</ol>`;
}
$('#view').addEventListener('input', e => {
  const f = e.target.closest('[data-lvl]'); if (!f) return; prefs.lvl = { ...(prefs.lvl || {}), [f.dataset.lvl]: +f.value / 100 }; f.style.setProperty('--v', `${f.value}%`); savePrefs();
});
$('#view').addEventListener('click', e => {
  if (e.target.closest('[data-loop]')) { setLoop(!LOOP.live); return; }
  const lp = e.target.closest('[data-loop-play]'); if (lp) { playLoop(lp.dataset.loopPlay); return; }
  const fk = e.target.closest('[data-t4k]'); if (fk) { toggleTrack(fk.dataset.t4k); return; }
  const fs = e.target.closest('[data-t4save]'); if (fs) { saveFour(fs); return; }
  const fx = e.target.closest('[data-t4x]'); if (fx) { const id = fx.dataset.t4x; LOOP.ms = LOOP.ms.filter(t => t.m.id !== id); const j = LOOPS.findIndex(l => l.id === id); if (j >= 0) LOOPS.splice(j, 1); store.set('da.loops.v1', LOOPS); loopSync(false); refreshFour(); return; }
  const r = e.target.closest('[data-radio]'); if (r) { r.classList.add('press'); setTimeout(() => r.classList.remove('press'), 160); snd.tick(S.radio ? 900 : 2200); buzz(12); if (!S.radio && !S.started && !prefs.placed && EXK) { playExample(); return; } setRadio(!S.radio); return; }
  /* a layer's volume: quiet, half, full, round again */
  const vb = e.target.closest('[data-vol]'); if (vb) { const k = vb.dataset.vol; const n = (volStep(k) + 1) % VOLS.length; prefs.lvl = { ...(prefs.lvl || {}), [k]: VOLS[n] }; savePrefs(); vb.dataset.v = String(n); snd.tick(1200 + n * 300); return; }
  /* a layer's mood, turned: FOG, RAIN, WEIGHT */
  const lm = e.target.closest('[data-lmood]');
  if (lm) { const k = lm.dataset.lmood; const ks = MOOD_ON; const nx = ks[(ks.indexOf(moodOfLayer(k)) + 1) % ks.length]; prefs.lm = { ...(prefs.lm || {}), [k]: nx }; savePrefs(); lm.innerHTML = icon(MOODS[nx].ic, 'sm'); lm.setAttribute('aria-label', `${k} mood: ${MOODS[nx].w}`); if (typeof hideTip === 'function') hideTip(); snd.tick(1400); return; }
  const t = e.target.closest('[data-t4]'); if (t) setTrack4(t.dataset.t4, !trackOn(t.dataset.t4));
});
/* 1 to 4 on a keyboard: the four layers */
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '') || (e.target && e.target.isContentEditable)) return;
  const i = '1234'.indexOf(e.key); if (i < 0) return; const k = LAYERS[i].k; setTrack4(k, !trackOn(k));
});
/* ───────── the mix: what is shared to SIGNALS, and later to a board of mixes. Versioned, plain data, nothing more ───────── */
const MIX_V = 2;
const MIXES = store.get('da.mixes.v1', []);
/* every cell a layer would play from here: its name, where it lies (bearing and distance from the radar's centre), and its
   pitch on the series. Played in order of bearing, one turn of the radar is the loop */
function layerCells(k) {
  const rd = v => Math.round(v); const at = (lat, lng) => ({ b: rd(bearing(S.scan.lat, S.scan.lng, lat, lng)), d: rd(haversine(S.scan.lat, S.scan.lng, lat, lng)) });
  if (k === 'life') return life.items.filter(it => it.inS && !it.o.pack && !it.o.hist && it.b.tone !== 'cold' && life.shown(it)).slice(0, 160).map(it => { const g = it.o.hum ? 'human' : glyphOf(it.o); return { n: nameOf(it.o), g, ...at(it.lat, it.lng), p: partialOf(g || 'x'), fa: +(0.35 + 0.65 * (it.fade == null ? 1 : it.fade)).toFixed(2), ...(it.b.tone === 'flora' ? { fl: 1 } : {}), ...(it.flag ? { br: 1 } : {}), ...(it.alarm || it.b.dz >= 3 ? { dz: 1 } : {}) }; });
  if (k === 'water') return life.climateIn().slice(0, 40).map(c => ({ n: c.n || 'Drinking water', k: c.k, ...at(c.lat, c.lng), p: c.k === 'fountain' ? 12 : 6 }));
  return bizNear(S.scan.lat, S.scan.lng, S.scan.r).filter(b => ((b.h || []).length ? k === 'pollution' : k === 'community')).slice(0, 120).map(b => ({ n: b.n, fam: b.fam, ...at(b.lat, b.lng), p: partialOf(b.fam), ...(b.cur ? { cur: 1 } : {}) }));
}
function mixNow() {
  const figs = strings.list().filter(c => c.o && life.inScan(c.o.lat, c.o.lng)).map(c => { const m = k => (c.f.n || {})[k] || (c.f.c || {})[k] || {}; const nm = k => (k === 'pin' ? nameOf(c.o) : m(k).n || k);
    return { id: c.id, name: c.name, b: Math.round(bearing(S.scan.lat, S.scan.lng, c.o.lat, c.o.lng)), lives: c.lives, people: c.people, knots: c.keys.map(k => ({ n: nm(k), t: m(k).t || '' })), edges: (c.f.e || []).map(([a, b]) => [nm(a), nm(b)]) }; });
  return { v: MIX_V, id: 'mx' + Date.now().toString(36), at: Date.now(), loop: CONFIG.SCAN.turn || 8, where: { lat: +S.scan.lat.toFixed(4), lng: +S.scan.lng.toFixed(4), r: S.scan.r, place: suburbAt(S.scan.lat, S.scan.lng) },
    layers: Object.fromEntries(LAYERS.map(L => [L.k, { on: trackOn(L.k), lvl: +layerLvl(L.k).toFixed(2), mood: moodOfLayer(L.k), n: trackCount(L.k), cells: layerCells(L.k) }])), figs };
}
/* the mix shared: it goes onto the board in the WISH MAKER, a page in the field book; the radio plays on */
function shareMix() {
  if (!placed()) { toast('WHERE ARE YOU?'); return null; }
  const m = mixNow(); MIXES.unshift(m); MIXES.splice(30); store.set('da.mixes.v1', MIXES); tie(1); snd.tick(2100); buzz([10, 40, 10]);
  toBoardFace(); setView(1); placeMix(m); return m;
}
/* a mix tuned in: the radar where it was, its layers, levels and moods; on air when asked (a link waits for a touch) */
function tuneMix(m, play) {
  if (S.view !== 0) setView(0);
  prefs.placed = true; life.setScan(m.where.lat, m.where.lng, m.where.r, true); if (S.mapReady) map.easeTo({ center: [m.where.lng, m.where.lat], zoom: scanZoom(m.where.r), offset: sheetOffset(), duration: reduced() ? 0 : 800 });
  prefs.lm = { ...(prefs.lm || {}), ...Object.fromEntries(Object.entries(m.layers).filter(([, v]) => v.mood).map(([k, v]) => [k, v.mood])) }; prefs.lvl = { ...(prefs.lvl || {}), ...Object.fromEntries(Object.entries(m.layers).map(([k, v]) => [k, v.lvl])) };
  for (const [k, v] of Object.entries(m.layers)) { if (k === 'life') prefs.mute = !v.on; else if (k in T4) T4[k] = !!v.on; }
  prefs.t4 = { ...T4 }; savePrefs(); syncTracks();
  if (play) setRadio(true); else if (S.open && S.view === 0 && !S.mode) refreshPanel();
}
function playMix(id) { const m = MIXES.find(x => x.id === id) || LOOPS.find(x => x.id === id); if (m) tuneMix(m, true); }
/* ───────── the loop: the radio as it sounds now, kept on this device (da.loops.v1) and played round and round from where it
   was made. The radar can move on: it is quiet while the loop plays, and a dashed ring stays where the loop was grounded ───────── */
const LOOPS = store.get('da.loops.v1', []);
const LOOP = { on: false, live: false, m: null, t0: 0, last: 0, timer: 0, ms: [] };   // live: LOOP itself going round (the radar quiet under it)   // ms: the tracks going round, { m, t0, last, live }
const loopDur = m => Math.max(2, +((m && m.loop) || CONFIG.SCAN.turn || 8)) * 1000 / ((life.tempo && life.tempo()) || 1);
const loopBearing = () => (LOOP.m ? ((performance.now() - LOOP.t0) % loopDur(LOOP.m)) / loopDur(LOOP.m) * 360 : 0);
function loopTick() {
  const now = performance.now(), hold = !LOOP.on || document.hidden || !prefs.sound || !S.radio;
  for (const tr of LOOP.ms) { const last = tr.last; tr.last = now; if (!hold) loopOne(tr, last, now); }
}
function loopOne(tr, last, now) {
  const D = loopDur(tr.m); const a = ((last - tr.t0) % D) / D * 360, b = ((now - tr.t0) % D) / D * 360;
  const crossed = deg => (a <= b ? deg > a && deg <= b : deg > a || deg <= b);
  /* each cell sounded exactly as the radar sounds it, so a loop kept is the radio as it was: the live loop with the layer keys as
     they are now, a kept track with its own, and quieter the more tracks go round together */
  const share = 1 / Math.sqrt(LOOP.ms.length || 1);
  for (const [k, L] of Object.entries(tr.m.layers || {})) {
    const lvl = (tr.live ? lvlOf(k) : (L.lvl == null ? 0.7 : +L.lvl)) * share; if (!(tr.live ? trackOn(k) : L.on) || lvl < 0.02) continue; const mood = tr.live ? moodOfLayer(k) : L.mood || moodOfLayer(k);
    for (const c of L.cells || []) {
      if (!crossed(c.b)) continue; const pan = Math.sin(c.b * Math.PI / 180) * 0.7; let ok = false;
      if (k === 'life') { const g = c.g || 'paw', pp = c.p || partialOf(g); ok = snd.ping({ g }, F0 * pp * (c.fl ? 2 : 1), { mood, v: 0.05 * lvl * 0.6 * (c.fa || 1), pan, bright: !!c.br, danger: !!c.dz, vi: pp % 8, fx: fxOf('life') }); }
      else if (k === 'water') ok = snd.ping({ g: 'aquatic' }, F0 * (c.p || 6), { mood, v: 0.045 * lvl, pan, fx: fxOf('water') });
      else { if (!c.cur && partialOf(c.n || '') % 3) continue; ok = snd.ping({ fam: c.fam || 'service' }, F0 * (c.p || 4), { mood, vi: partialOf(c.n || c.fam || '') % 8, v: 0.04 * lvl, pan, fx: fxOf(k) }); }
      if (ok) flashLayer(k);
    }
  }
  for (const f of tr.m.figs || []) if (f.b != null && crossed(f.b)) strings.playFig(f.id);
}
/* where the radar is: placed where the map is looking, if it has not been yet (the radio opened in the aura's window) */
const here = () => { if (!placed()) startRadio(false); return placed() && !!S.scan && Number.isFinite(+S.scan.lat); };
/* a song kept: newest first, eight at most, smaller and smaller until this phone has room for it */
function keepLoop(m) {
  LOOPS.unshift(m); LOOPS.splice(8);
  if (!store.set('da.loops.v1', LOOPS)) for (const l of LOOPS) for (const L of Object.values(l.layers || {})) if ((L.cells || []).length > 24) L.cells = L.cells.filter((c, i) => i % 2 === 0);
  while (!store.set('da.loops.v1', LOOPS) && LOOPS.length > 1) LOOPS.pop();
  return LOOPS[0] === m;
}
const trackOf = m => ({ m, t0: performance.now() - ((life.sweepAt ? life.sweepAt() : 0) / 360) * loopDur(m), last: performance.now(), live: false });
/* the tracks going round, said to the keys, the ring on the map and the timer */
function loopSync(on) {
  LOOP.on = LOOP.ms.length > 0; LOOP.live = LOOP.ms.some(t => t.live); LOOP.m = LOOP.on ? LOOP.ms[0].m : null; LOOP.t0 = LOOP.on ? LOOP.ms[0].t0 : 0;
  clearInterval(LOOP.timer); if (LOOP.on) { LOOP.timer = setInterval(loopTick, snd.lite ? 80 : 40); if (!S.radio) setRadio(true); }
  $$('[data-loop]').forEach(b => { b.setAttribute('aria-pressed', String(LOOP.live)); b.classList.toggle('on', LOOP.live); });
  $$('[data-t4k]').forEach(b => { const o = LOOP.ms.some(t => t.m.id === b.dataset.t4k); b.setAttribute('aria-pressed', String(o)); b.classList.toggle('on', o); });
  document.body.classList.toggle('looping', LOOP.on); snd.tick(on ? 1900 : 1100); buzz(on ? [6, 30, 6] : 5); life.redraw();
}
/* LOOP: the radio as it sounds now, kept and going round (or every track stopped) */
function setLoop(on, kept) {
  if (on && !kept && !here()) { toast('WHERE ARE YOU?'); return; }
  LOOP.ms = LOOP.ms.filter(t => !t.live);
  if (on) { const m = kept || mixNow(); if (!kept) keepLoop(m); if (!LOOP.ms.some(t => t.m.id === m.id)) LOOP.ms.unshift({ ...trackOf(m), live: !kept }); while (LOOP.ms.length > 5) LOOP.ms.pop(); if (!kept) refreshFour(); }
  else if (kept === null) LOOP.ms = [];
  loopSync(on);
}
/* one of the four tracks in or out; a fifth lets the first go */
function toggleTrack(id) {
  const i = LOOP.ms.findIndex(t => t.m.id === id), m = LOOPS.find(l => l.id === id); if (!m && i < 0) return;
  if (i >= 0) LOOP.ms.splice(i, 1); else { LOOP.ms.push(trackOf(m)); while (LOOP.ms.length > 4) LOOP.ms.shift(); }
  loopSync(i < 0);
}
/* a kept song played again exactly as it was made: a track going round with the others */
function playLoop(id) { toggleTrack(id); }
/* the four-track on the radio: the four songs kept last, each a key that goes round with the others; × lets one go */
function fourHTML() {
  return `<ol class="four" role="group" aria-label="Four-track">${[0, 1, 2, 3].map(i => { const l = LOOPS[i]; if (!l) return `<li><span class="f4 none mono" aria-hidden="true">${i + 1}</span></li>`;
    const on = LOOP.ms.some(t => t.m.id === l.id), nm = esc((l.where || {}).place || 'RADIO');
    return `<li><button type="button" class="f4${on ? ' on' : ''}" data-t4k="${esc(l.id)}" aria-pressed="${on}" aria-label="Track ${i + 1}: ${nm}" data-tip="${nm}"><img src="${loopArt(l)}" alt=""><small class="mono">${i + 1}</small></button><button type="button" class="f4x" data-t4x="${esc(l.id)}" aria-label="Let track ${i + 1} go">×</button></li>`; }).join('')}<li><button type="button" class="f4 f4s" data-t4save aria-label="Save the tracks going round as one sound file" data-tip="Save them together"${LOOPS.length ? '' : ' disabled'}>${icon('download')}<small class="mono">save</small></button></li></ol>`;
}
/* the tracks going round, together, as one sound file: two turns of the longest (a minute at most). None going round, the four kept last go round for it */
async function saveFour(btn) {
  if (!LOOP.ms.some(t => !t.live)) { LOOP.ms = LOOP.ms.filter(t => t.live).concat(LOOPS.slice(0, 4).map(trackOf)); loopSync(true); }
  if (!LOOP.ms.length) { toast('KEEP A TRACK FIRST'); return; }
  const ms = Math.min(60e3, 2 * Math.max(...LOOP.ms.map(t => loopDur(t.m)))) + 400; btn.disabled = true; btn.classList.add('rec'); toast('● ' + Math.round(ms / 1000) + ' S');
  try { const b = await snd.record(ms); const place = String((LOOP.ms[0].m.where || {}).place || 'radio').toLowerCase().replace(/[^a-z0-9]+/g, '-'); const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = `novel-global-four-track-${place}-${new Date().toISOString().slice(0, 10)}.${/mp4/.test(b.type) ? 'm4a' : 'webm'}`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60e3); toast('✓ SAVED'); made('song', 'four-track');
  } catch (e) { toast('THIS BROWSER CANNOT RECORD'); }
  btn.disabled = false; btn.classList.remove('rec');
}
function refreshFour() { const f = $('#view .four'); if (f) f.outerHTML = fourHTML(); }
/* the loops kept, in the portfolio: each its picture, its place and its day; pressed, it plays again */
const LART = new Map();
const loopArt = l => { if (!LART.has(l.id)) { LART.set(l.id, mixArt(l, mixURL(l))); if (LART.size > 16) LART.delete(LART.keys().next().value); } return LART.get(l.id); };
/* the songs kept, on novel.global, as albums: the radar's picture of each as its sleeve, its own card slid out of the sleeve as
   a record is, its place and its day; play it again here, or share it as a link. A key keeps the radar's song as it is now */
const songCard = (l, i) => ({ id: 's:' + l.id, img: loopArt(l), kind: 'song', name: (l.where || {}).place || 'RADIO', n: i, at: l.at });
const songsHTML = () => `<section class="sec songs" id="sec-songs"><div class="lab-row">${labI('sound', 'Songs', LOOPS.length)}<button type="button" class="pill sq" data-song-keep aria-label="Keep the radar's song as it is now" data-tip="Keep the radar's song">${icon('plus', 'sm')}</button></div>`
  + (LOOPS.length ? `<ol class="albums">${LOOPS.map((l, i) => `<li class="album"><button type="button" class="al-sleeve" data-loop-play="${esc(l.id)}" aria-label="Play ${esc((l.where || {}).place || 'this song')}"><img class="al-art" src="${loopArt(l)}" alt=""><img class="al-card" data-song-card="${i}" alt=""></button>`
    + `<span class="al-t"><b>${esc((l.where || {}).place || 'RADIO')}</b><small class="mono">${Math.round((l.where || {}).r || 0)} M · ${fmtStamp(l.at).split(' ')[0]}</small></span>`
    + `<span class="al-k"><button type="button" class="ib" data-loop-play="${esc(l.id)}" aria-label="Play" data-tip="Play">${icon('play', 'sm')}</button><button type="button" class="ib" data-song-share="${esc(l.id)}" aria-label="Copy its link" data-tip="Copy its link">${icon('share', 'sm')}</button><button type="button" class="ib" data-song-poster="${esc(l.id)}" aria-label="Onto my poster" data-tip="Onto my poster">${icon('plus', 'sm')}</button></span></li>`).join('')}</ol>`
    : '<p class="al-none mono">NO SONGS KEPT YET · + KEEPS THE RADAR\'S SONG</p>') + '</section>';
async function fillSongs() { for (const im of $$('#view img[data-song-card]')) { const l = LOOPS[+im.dataset.songCard]; if (!l) continue; try { const c = await cardArt(songCard(l, +im.dataset.songCard), +im.dataset.songCard, 2); if (im.isConnected) im.src = c.toDataURL('image/png'); } catch (e) { /* the sleeve alone */ } } }
$('#view').addEventListener('click', async e => {
  if (e.target.closest('[data-song-keep]')) { if (!here()) { toast('WHERE ARE YOU?'); return; } const m = mixNow(); const ok = keepLoop(m); snd.tick(ok ? 1900 : 700); toast(ok ? '✓ TRACK 1' : 'NO ROOM ON THIS PHONE'); if (ok) made('song', (m.where || {}).place || 'RADIO'); refreshFour(); if (S.view !== 0) refreshPanel(); return; }
  /* a kept track onto the poster: its card, in the aura's poster or on the strip */
  const sp = e.target.closest('[data-song-poster]'); if (sp) { const l = LOOPS.find(x => x.id === sp.dataset.songPoster); if (!l) return; const art = mixArt(l, mixURL(l)); if (IN_AURA) toAura(art, true); else { setView(2); setTimeout(() => placeOnPage(art, 'art', 240), 500); } snd.tick(1900); return; }
  const sh = e.target.closest('[data-song-share]'); if (sh) { const l = LOOPS.find(x => x.id === sh.dataset.songShare); if (!l) return; const url = mixURL(l);
    const ok = await copyText(url); toast(ok ? 'LINK COPIED' : url.slice(0, 60)); }
});
/* ───────── the radio as a link: the place, its reach, and each layer's on, volume and mood, short enough for a code on a
   receipt. Opened, it tunes the radio there; a touch on play and it sounds ───────── */
const volIdx = v => VOLS.reduce((best, q, i) => (Math.abs(q - v) < Math.abs(VOLS[best] - v) ? i : best), 0);
function mixCode(m) {
  const ks = Object.keys(MOODS); const w = m.where;
  return `${(+w.lat).toFixed(4)},${(+w.lng).toFixed(4)},${Math.round(w.r)},${LAYERS.map(L => { const x = (m.layers || {})[L.k] || {}; return `${x.on ? 1 : 0}${volIdx(x.lvl == null ? 0.7 : x.lvl)}${Math.max(0, ks.indexOf(x.mood)).toString(36)}`; }).join('')}`;
}
const mixURL = m => `${String(/\.workers\.dev$|localhost|\.test$/.test(location.hostname) ? location.origin + '/' : CONFIG.PORTAL_URL || location.origin + '/').replace(/#.*$/, '')}#mix=${mixCode(m)}`;
function mixOfCode(code) {
  const [lat, lng, r, L] = String(code || '').split(','); const ks = Object.keys(MOODS);
  if (!Number.isFinite(+lat) || !Number.isFinite(+lng) || !/^([01]\d[0-9a-z]){4}$/.test(L || '')) return null;
  const layers = Object.fromEntries(LAYERS.map((Lr, i) => { const s = L.slice(i * 3, i * 3 + 3); return [Lr.k, { on: s[0] === '1', lvl: VOLS[+s[1]] || 0.7, mood: ks[parseInt(s[2], 36)] || 'fog' }]; }));
  return { v: MIX_V, id: 'mx' + Date.now().toString(36), at: Date.now(), loop: CONFIG.SCAN.turn || 8, where: { lat: +lat, lng: +lng, r: clamp(+r || 500, CONFIG.SCAN.min || 250, CONFIG.SCAN.max || 1500), place: suburbAt(+lat, +lng) }, layers };
}
/* its sound as a picture: the circle it is played round, each cell where it lies (a life a dot, water a ring, a place a square,
   harm a cross), the hand at north, and the code to scan. Black on white, so it prints as it shows */
function mixArt(m, url) {
  const TAU = Math.PI * 2;
  const W = 600, H = 820, cx = 300, cy = 352, R = 236; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); x.fillStyle = '#0C0E0E'; x.strokeStyle = '#0C0E0E';
  x.font = '600 22px Poppins, sans-serif'; x.textBaseline = 'alphabetic'; x.fillText(String(m.where.place || '').toUpperCase(), 36, 64);
  x.font = '500 13px "IBM Plex Mono", monospace'; x.textAlign = 'right'; x.fillText(`${Math.round(m.where.r)} M · ${loopDur(m) / 1000} S`, W - 36, 64); x.textAlign = 'left';
  x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.stroke();
  x.lineWidth = 1; x.globalAlpha = 0.35; for (const f of [0.33, 0.66]) { x.beginPath(); x.arc(cx, cy, R * f, 0, TAU); x.stroke(); } x.globalAlpha = 1;
  x.beginPath(); x.moveTo(cx, cy - R - 16); x.lineTo(cx - 7, cy - R - 4); x.lineTo(cx + 7, cy - R - 4); x.closePath(); x.fill();
  /* the wake behind the hand, then the hand */
  for (let i = 0; i < 18; i++) { const a0 = -Math.PI / 2 - (i + 1) * 0.045, a1 = -Math.PI / 2 - i * 0.045; x.globalAlpha = 0.16 * (1 - i / 18); x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, a0, a1); x.closePath(); x.fill(); } x.globalAlpha = 1;
  x.lineWidth = 2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx, cy - R); x.stroke();
  for (const [k, L] of Object.entries(m.layers || {})) {
    if (!L.on) continue; const s = 0.6 + 0.6 * (L.lvl == null ? 0.7 : L.lvl);
    for (const cl of L.cells || []) {
      const a = (cl.b - 90) * Math.PI / 180, d = clamp(cl.d / (m.where.r || 500), 0, 1) * R; const px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d; const r = (2.4 + (cl.p || 4) % 4) * s;
      x.beginPath();
      if (k === 'life') { x.arc(px, py, r, 0, TAU); x.fill(); }
      else if (k === 'water') { x.lineWidth = 1.6; x.arc(px, py, r + 1.5, 0, TAU); x.stroke(); }
      else if (k === 'community') { x.rect(px - r, py - r, r * 2, r * 2); x.fill(); }
      else { x.lineWidth = 2; x.moveTo(px - r, py - r); x.lineTo(px + r, py + r); x.moveTo(px + r, py - r); x.lineTo(px - r, py + r); x.stroke(); }
    }
  }
  x.beginPath(); x.arc(cx, cy, 5, 0, TAU); x.fill();
  /* the foot: the name, the layers on, the code */
  const on = LAYERS.filter(L => (m.layers[L.k] || {}).on).map(L => `${L.w} ${((MOODS[(m.layers[L.k] || {}).mood] || {}).w || '')}`.trim());
  x.font = '600 30px Poppins, sans-serif'; x.fillText('novel.global', 36, 668);
  x.font = '500 12.5px "IBM Plex Mono", monospace'; on.forEach((t, i) => x.fillText(t, 36, 700 + i * 19));
  const qr = qrOf(url, 'M'); if (qr) { const n = qr.getModuleCount(), S2 = 176, mm = S2 / n, ox = W - 36 - S2, oy = 612; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) x.fillRect(Math.floor(ox + k * mm), Math.floor(oy + r * mm), Math.ceil(mm), Math.ceil(mm)); }
  return c.toDataURL('image/png');
}
/* an earlier build kept a track of one's own here; its store goes */
try { indexedDB.deleteDatabase('da.tracks'); } catch (e) { /* none */ }
/* ───────── a link's song: a QR on a receipt, a code, a mix sent. Opened, its song plays in the background at the first touch
   (a browser lets nothing sound before one), round and round, the figure tied there and the lives around it, without leaving
   the page it opened on; its key floats over the map to stop it and start it again, and a small key beside it keeps the place
   and its layers among the loops ───────── */
const LSONG = { armed: false, on: false, timer: 0 };
function linkSongKey() {
  let k = $('#song-k'); if (!k) { k = document.createElement('div'); k.id = 'song-k'; k.className = 'song-k'; k.innerHTML = `<button type="button" class="sk-play" data-lsong aria-pressed="false" aria-label="This link's song">${icon('play')}<i class="sk-ring" aria-hidden="true"></i></button><button type="button" class="sk-keep" data-lsong-keep aria-label="Keep this song">${icon('plus', 'sm')}</button>`; document.body.appendChild(k); }
  k.hidden = !LSONG.armed; const b = k.querySelector('[data-lsong]'); b.setAttribute('aria-pressed', String(LSONG.on)); b.classList.toggle('on', LSONG.on); b.querySelector('svg.i').outerHTML = icon(LSONG.on ? 'pause' : 'play');
}
function linkSong(on) {
  clearTimeout(LSONG.timer); LSONG.on = !!on;
  if (on) {
    snd.wake(); if (!prefs.sound) { prefs.sound = true; savePrefs(); }
    const round = () => { if (!LSONG.on) return; const seq = strings.song() || []; const end = seq.length ? Math.max(...seq.map(n => n.at)) - performance.now() : 0; LSONG.timer = setTimeout(round, Math.max(4000, end + 2000)); };
    round();
  }
  linkSongKey();
}
const linkArm = () => { LSONG.armed = true; linkSongKey(); };
document.addEventListener('click', e => {
  if (e.target.closest('[data-lsong]')) { linkSong(!LSONG.on); return; }
  if (e.target.closest('[data-lsong-keep]')) { const m = mixNow(); LOOPS.unshift(m); LOOPS.splice(8); while (!store.set('da.loops.v1', LOOPS) && LOOPS.length > 1) LOOPS.pop(); toast('KEPT · LOOPS'); snd.tick(1900); }
});
/* the first touch on a page a link opened starts its song, unless that touch is on the song's own key */
addEventListener('pointerup', e => { if (!LSONG.armed || LSONG.on || LSONG.started || (e.target.closest && e.target.closest('#song-k'))) return; LSONG.started = true; linkSong(true); }, true);
