/* ════════════════════════════════════════════════════════════════════
   TRACKS (stations in an earlier build) — collections of the map. The radar is the instrument: when the sweep reaches a cell, the cell sounds, and a small
   ring shows where. A station decides whether its cells sound, its fader how loud, the mood how: FOG a breath of a voice,
   RAIN a crushed glitch, WEIGHT a thud. Nothing plays on its own: no tune, no grid, no backing. What sounds is what is there:
   pitch from the kind's place on one harmonic series, brighter if new, fainter as it ages, bent or doubled if in danger;
   places in their own small real sounds when their station is on; and under the trail, a drone that swells only over clusters
   of life. Nature is always seen (unless unlocked on the approval page) and on from the first touch, and can be muted.
   ════════════════════════════════════════════════════════════════════ */
/* the moods, turned round on each layer's key: the first three, then the muse, a buried voice, a haunted one, the swamp, bubbles,
   and a tone blown out. Each sounds a cell its own way (snd.ping) and shades the drone */
const MOODS = { fog: { w: 'FOG', ic: 'dusk' }, rain: { w: 'RAIN', ic: 'rain' }, weight: { w: 'WEIGHT', ic: 'night' }, jelly: { w: 'JELLY', ic: 'jelly' }, burial: { w: 'BURIAL', ic: 'ghost' }, haunt: { w: 'HAUNT', ic: 'zanom' }, voodoo: { w: 'VOODOO', ic: 'candle' }, cheek: { w: 'CHEEKY', ic: 'star5' }, blown: { w: 'BLOWN', ic: 'flame' } };
const moodOf = () => (MOODS[prefs.mood] ? prefs.mood : 'fog');
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
  const o = it.o; const id = o.pack ? 'p:' + o.pack : 'life'; if (!TRK.on[id] || !prefs.sound) return false; const L = lvlOf(o.pack ? 'community' : 'life'); if (L < 0.02) return false; flashLayer(o.pack ? 'community' : 'life');
  const g = o.pack ? o.pk : o.hum ? 'human' : glyphOf(o); const vi = flashVoice(id, g);
  return snd.ping(o.pack ? (PACK_SPEC[o.pk] && PACK_SPEC[o.pk].fam ? PACK_SPEC[o.pk] : { g }) : { g }, F0 * partialOf(g || 'x') * (it.b.tone === 'flora' ? 2 : 1),
    { mood: moodOfLayer(o.pack ? 'community' : 'life'), v: 0.05 * L * (first ? 1 : 0.6) * (0.35 + 0.65 * (it.fade == null ? 1 : it.fade)), pan: clamp((it.x / (innerWidth || 1)) * 2 - 1, -1, 1) * 0.7, bright: !!it.flag, danger: !!(it.alarm || it.b.dz >= 3), vi: Math.max(0, vi) });
}
function pingPlace(p) {
  if (!TRK.on.places || !prefs.sound) return false; const L = lvlOf(p.on ? 'pollution' : 'community'); if (L < 0.02) return false;
  /* a busy street is not a wall of sound: the places listed by name always, a third of the rest */
  if (!p.cur && partialOf(p.n) % 3) return false; flashLayer(p.on ? 'pollution' : 'community');
  return snd.ping({ fam: p.fam }, F0 * partialOf(p.fam), { mood: moodOfLayer(p.on ? 'pollution' : 'community'), v: 0.04 * L, pan: clamp(((p._x || 0) / (innerWidth || 1)) * 2 - 1, -1, 1) * 0.7 });
}
const playIcon = (id, on) => (id === 'life' ? icon('sound', 'sm') : icon(on ? 'pause' : 'play', 'sm'));
function setTrack(id, on) {
  TRK.on[id] = on; const el = document.querySelector(tkSel(id));
  if (el) { el.classList.toggle('on', on); const b = el.querySelector('.tk-play'); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('muted', id === 'life' && !on); b.innerHTML = playIcon(id, on); }
  if (!on && id === 'life') snd.droneOff();
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
const moodOfLayer = k => { const m = (prefs.lm || {})[k]; return MOODS[m] ? m : moodOf(); };
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
  prefs.t4 = { ...T4 }; savePrefs(); markTweak();
  if (k === 'water' && on) loadOverlays();
  syncTracks();
  document.querySelectorAll(`[data-t4="${k}"]`).forEach(b => { b.setAttribute('aria-pressed', String(on)); const row = b.closest('.lyr'); if (row) row.classList.toggle('on', on); });
  life.redraw(); life.moved(); snd.tick(on ? 1900 : 1200); buzz(4);
}
/* the radio on: the sound woken inside the touch, and every layer that is on played by the sweep. Off: quiet, and still */
/* the first clue lived over the ground in an earlier build; it is in the page now */
function arcadeOff() { const el = $('#arcade'); if (el) el.hidden = true; }
/* started: the radar stands where it was last, or where the touch was, or where the map is looking */
function startRadio(play = true, at) {
  arcadeOff();
  if (!S.started) {
    S.started = true; const c = at || (prefs.placed ? null : S.mapReady ? map.getCenter() : null);
    if (c) { prefs.placed = true; savePrefs(); life.setScan(c.lat, c.lng, null, true); } else life.setScan(null, null, null, false);
  }
  life.redraw(); life.moved(); if (play) setRadio(true); if (S.open && S.view === 0 && !S.mode) refreshPanel();
}
/* a song made: a layer changed, a mood, a volume, a string tied. Only then can a signal start */
function markTweak() { if (S.tweaked) return; S.tweaked = true; snd.knot({ fam: 'people' }, F0 * 5, 0, 0.6, 0); if (S.open && S.view === 0 && !S.mode) refreshPanel(); }
function setRadio(on) {
  if (on && !S.started) { startRadio(true); return; }
  S.radio = on;
  if (on) { snd.wake(); if (!prefs.sound) { prefs.sound = true; savePrefs(); } }
  syncTracks(); if (on) life.replay(); else snd.droneOff();
  document.querySelectorAll('[data-radio]').forEach(b => { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); b.innerHTML = `<i class="hp-ring"></i>${icon(on ? 'pause' : 'play')}`; });
  document.body.classList.toggle('on-air', on); buzz(on ? [8, 30, 8] : 6); life.redraw(); life.moved();
}
/* a layer's meter moves as the sweep plays it */
function flashLayer(k) {
  const m = document.querySelector(`.lyr[data-lyr="${k}"] .lv`); if (!m) return; const i = m.children[Math.floor(Math.random() * m.children.length)];
  if (i) { i.classList.add('hit'); setTimeout(() => i.classList.remove('hit'), 380); }
}
/* water: a drop; a pond or wetland lower, a fountain higher */
function pingClimate(c) {
  if (!TRK.on.water || !prefs.sound) return false; flashLayer('water');
  return snd.ping({ g: 'aquatic' }, F0 * (c.k === 'fountain' ? 12 : 6), { mood: moodOfLayer('water'), v: 0.045 * layerLvl('water'), pan: 0 });
}
/* a layer's volume, three steps: quiet, half, full */
const VOLS = [0.35, 0.7, 1];
const volStep = k => VOLS.reduce((best, v, i) => (Math.abs(v - layerLvl(k)) < Math.abs(VOLS[best] - layerLvl(k)) ? i : best), 0);
function layersHTML() {
  return `<ol class="lyrs" role="group" aria-label="Layers">${LAYERS.map((L, i) => { const on = trackOn(L.k); const m = MOODS[moodOfLayer(L.k)]; const v = volStep(L.k);
    return `<li class="lyr${on ? ' on' : ''}" data-lyr="${L.k}"><button type="button" class="lyr-k" data-t4="${L.k}" aria-pressed="${on}" aria-keyshortcuts="${i + 1}" aria-label="${L.w}" data-tip="${L.w}">${icon(L.ic)}</button>`
      + `<button type="button" class="lyr-m" data-lmood="${L.k}" aria-label="${L.w} mood: ${m.w}" data-tip="${m.w}">${icon(m.ic, 'sm')}</button>`
      + `<span class="lv" aria-hidden="true">${'<i></i>'.repeat(8)}</span>`
      + `<button type="button" class="lyr-v" data-vol="${L.k}" data-v="${v}" aria-label="${L.w} volume">${'<i></i>'.repeat(3)}</button></li>`; }).join('')}</ol>`;
}
$('#view').addEventListener('input', e => {
  const f = e.target.closest('[data-lvl]'); if (!f) return; prefs.lvl = { ...(prefs.lvl || {}), [f.dataset.lvl]: +f.value / 100 }; f.style.setProperty('--v', `${f.value}%`); savePrefs();
});
$('#view').addEventListener('click', e => {
  const r = e.target.closest('[data-radio]'); if (r) { r.classList.add('press'); setTimeout(() => r.classList.remove('press'), 160); snd.tick(S.radio ? 900 : 2200); buzz(12); setRadio(!S.radio); return; }
  /* a layer's volume: quiet, half, full, round again */
  const vb = e.target.closest('[data-vol]'); if (vb) { const k = vb.dataset.vol; const n = (volStep(k) + 1) % VOLS.length; prefs.lvl = { ...(prefs.lvl || {}), [k]: VOLS[n] }; savePrefs(); markTweak(); vb.dataset.v = String(n); snd.tick(1200 + n * 300); buzz(4); return; }
  /* a layer's mood, turned: FOG, RAIN, WEIGHT */
  const lm = e.target.closest('[data-lmood]');
  if (lm) { const k = lm.dataset.lmood; const ks = Object.keys(MOODS); const nx = ks[(ks.indexOf(moodOfLayer(k)) + 1) % ks.length]; prefs.lm = { ...(prefs.lm || {}), [k]: nx }; savePrefs(); markTweak(); lm.innerHTML = icon(MOODS[nx].ic, 'sm'); lm.setAttribute('aria-label', `${k} mood: ${MOODS[nx].w}`); lm.dataset.tip = MOODS[nx].w; if (typeof hideTip === 'function') hideTip(); snd.tick(1400); buzz(4); return; }
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
  if (k === 'life') return life.items.filter(it => it.inS && !it.o.story && !it.o.pack && !it.o.hist && it.b.tone !== 'cold').slice(0, 60).map(it => { const g = it.o.hum ? 'human' : glyphOf(it.o); return { n: nameOf(it.o), g, ...at(it.lat, it.lng), p: partialOf(g || 'x') }; });
  if (k === 'water') return life.climateIn().slice(0, 40).map(c => ({ n: c.n || 'Drinking water', k: c.k, ...at(c.lat, c.lng), p: c.k === 'fountain' ? 12 : 6 }));
  return bizNear(S.scan.lat, S.scan.lng, S.scan.r).filter(b => ((b.h || []).length ? k === 'pollution' : k === 'community')).slice(0, 40).map(b => ({ n: b.n, fam: b.fam, ...at(b.lat, b.lng), p: partialOf(b.fam) }));
}
function mixNow() {
  const figs = strings.list().filter(c => c.o && life.inScan(c.o.lat, c.o.lng)).map(c => { const m = k => (c.f.n || {})[k] || (c.f.c || {})[k] || {}; const nm = k => (k === 'pin' ? nameOf(c.o) : m(k).n || k);
    return { id: c.id, name: c.name, lives: c.lives, people: c.people, knots: c.keys.map(k => ({ n: nm(k), t: m(k).t || '' })), edges: (c.f.e || []).map(([a, b]) => [nm(a), nm(b)]) }; });
  return { v: MIX_V, id: 'mx' + Date.now().toString(36), at: Date.now(), loop: CONFIG.SCAN.turn || 8, where: { lat: +S.scan.lat.toFixed(4), lng: +S.scan.lng.toFixed(4), r: S.scan.r, place: suburbAt(S.scan.lat, S.scan.lng) },
    layers: Object.fromEntries(LAYERS.map(L => [L.k, { on: trackOn(L.k), lvl: +layerLvl(L.k).toFixed(2), mood: moodOfLayer(L.k), n: trackCount(L.k), cells: layerCells(L.k) }])), figs };
}
/* the mix shared: it goes onto the board in the WISH MAKER, a page in the field book; the radio plays on */
function shareMix() {
  if (!placed()) { toast('WHERE ARE YOU?'); return null; }
  const m = mixNow(); MIXES.unshift(m); MIXES.splice(30); store.set('da.mixes.v1', MIXES); tie(1); snd.tick(2100); buzz([10, 40, 10]);
  setView(1); placeMix(m); return m;
}
/* a mix played again: the radar where it was, its layers, levels and mood, on air */
function playMix(id) {
  const m = MIXES.find(x => x.id === id); if (!m) return; if (S.view !== 0) setView(0);
  prefs.placed = true; life.setScan(m.where.lat, m.where.lng, m.where.r, true); if (S.mapReady) map.easeTo({ center: [m.where.lng, m.where.lat], duration: reduced() ? 0 : 700 });
  prefs.lm = { ...(prefs.lm || {}), ...Object.fromEntries(Object.entries(m.layers).filter(([, v]) => v.mood).map(([k, v]) => [k, v.mood])) }; prefs.lvl = { ...(prefs.lvl || {}), ...Object.fromEntries(Object.entries(m.layers).map(([k, v]) => [k, v.lvl])) };
  for (const [k, v] of Object.entries(m.layers)) { if (k === 'life') prefs.mute = !v.on; else if (k in T4) T4[k] = !!v.on; }
  prefs.t4 = { ...T4 }; savePrefs(); setRadio(true);
}
/* an earlier build kept a track of one's own here; its store goes */
try { indexedDB.deleteDatabase('da.tracks'); } catch (e) { /* none */ }
