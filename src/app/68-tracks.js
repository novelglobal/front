/* ════════════════════════════════════════════════════════════════════
   TRACKS (stations in an earlier build) — collections of the map. The radar is the instrument: when the sweep reaches a cell, the cell sounds, and a small
   ring shows where. A station decides whether its cells sound, its fader how loud, the mood how: FOG a breath of a voice,
   RAIN a crushed glitch, WEIGHT a thud. Nothing plays on its own: no tune, no grid, no backing. What sounds is what is there:
   pitch from the kind's place on one harmonic series, brighter if new, fainter as it ages, bent or doubled if in danger;
   places in their own small real sounds when their station is on; and under the trail, a drone that swells only over clusters
   of life. Nature is always seen (unless unlocked on the approval page) and on from the first touch, and can be muted.
   ════════════════════════════════════════════════════════════════════ */
const MOODS = { fog: { w: 'FOG', ic: 'dusk' }, rain: { w: 'RAIN', ic: 'rain' }, weight: { w: 'WEIGHT', ic: 'night' } };
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
  const o = it.o; const id = o.pack ? 'p:' + o.pack : 'life'; if (!TRK.on[id] || !prefs.sound) return false; const L = lvlOf(id); if (L < 0.02) return false;
  const g = o.pack ? o.pk : o.hum ? 'human' : glyphOf(o); const vi = flashVoice(id, g);
  return snd.ping(o.pack ? (PACK_SPEC[o.pk] && PACK_SPEC[o.pk].fam ? PACK_SPEC[o.pk] : { g }) : { g }, F0 * partialOf(g || 'x') * (it.b.tone === 'flora' ? 2 : 1),
    { mood: moodOf(), v: 0.05 * L * (first ? 1 : 0.6) * (0.35 + 0.65 * (it.fade == null ? 1 : it.fade)), pan: clamp((it.x / (innerWidth || 1)) * 2 - 1, -1, 1) * 0.7, bright: !!it.flag, danger: !!(it.alarm || it.b.dz >= 3), vi: Math.max(0, vi) });
}
function pingPlace(p) {
  if (!TRK.on.places || !prefs.sound) return false; const L = lvlOf('places'); if (L < 0.02) return false;
  /* a busy street is not a wall of sound: the places listed by name always, a third of the rest */
  if (!p.cur && partialOf(p.n) % 3) return false; flashVoice('places', p.fam);
  return snd.ping({ fam: p.fam }, F0 * partialOf(p.fam), { mood: moodOf(), v: 0.04 * L, pan: clamp(((p._x || 0) / (innerWidth || 1)) * 2 - 1, -1, 1) * 0.7 });
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
/* TRACKS: four domains of the living system, as four keys on the radio, and 1 to 4 on a keyboard. A key lit is on the map and
   on air. CLIMATE: the air temperature now and drinking water; LIVING: the lives; EXPOSURE: the places on notice, that harm
   life; COMMUNITY: the places that care, and the sound of every pack of cells shown to everyone. No panel, no faders */
const TRACKS = [{ k: 'climate', w: 'CLIMATE', ic: 'heat' }, { k: 'living', w: 'LIVING', ic: 'fauna' }, { k: 'exposure', w: 'EXPOSURE', ic: 'harm' }, { k: 'community', w: 'COMMUNITY', ic: 'people' }];
const trackOn = k => (k === 'living' ? !prefs.mute : !!T4[k]);
/* what each key holds, for its hover: counts only */
function trackCount(k) {
  if (k === 'living') return life.items.filter(it => it.inS && !it.o.story && !it.o.pack && !it.o.hist).length;
  if (k === 'climate') return S.sensors.length + S.fountains.length;
  const ps = bizNear(S.scan.lat, S.scan.lng, S.scan.r); const ex = ps.filter(b => (b.h || []).length).length;
  return k === 'exposure' ? ex : ps.length - ex + (SHARED.list || []).filter(x => x.kind === 'cells').length;
}
function setTrack4(k, on) {
  if (k === 'living') { prefs.mute = !on; if (!CFG.lifeLock) prefs.trk = { ...(prefs.trk || {}), life: on }; savePrefs(); setTrack('life', on && prefs.sound); }
  else { T4[k] = on; prefs.t4 = { ...T4 }; savePrefs(); }
  if (k === 'climate' && on) loadOverlays();
  setTrack('places', (T4.exposure || T4.community) && prefs.sound);
  for (const t of trackList()) if (t.id.startsWith('p:')) setTrack(t.id, T4.community && prefs.sound);
  document.querySelectorAll(`[data-t4="${k}"]`).forEach(b => b.setAttribute('aria-pressed', String(on)));
  life.redraw(); life.moved(); snd.tick(on ? 1900 : 1200); buzz(4);
}
function tracksKeys() {
  const m = MOODS[moodOf()];
  return `<div class="t4" role="group" aria-label="Tracks">${TRACKS.map((t, i) => `<button type="button" class="t4k" data-t4="${t.k}" aria-pressed="${trackOn(t.k)}" aria-keyshortcuts="${i + 1}" data-tip="${t.w} · ${trackCount(t.k)}">${icon(t.ic, 'sm')}<small>${t.w}</small></button>`).join('')}`
    + `<span class="t4s"><button type="button" class="t4m" data-mood-next aria-label="Mood: ${m.w}" data-tip="${m.w}">${icon(m.ic, 'sm')}</button><button type="button" class="t4m${prefs.sound ? '' : ' muted'}" data-mute-all aria-pressed="${!prefs.sound}" aria-label="Sound off" data-tip="${prefs.sound ? 'Sound off' : 'Sound on'}">${icon('sound', 'sm')}</button></span></div>`;
}
$('#view').addEventListener('click', e => {
  /* everything quiet, or back: the radar, its drone and every track; nature comes back on air unless muted */
  const mu = e.target.closest('[data-mute-all]');
  if (mu) {
    prefs.sound = !prefs.sound; savePrefs(); if (!prefs.sound) { stopTracks(); snd.droneOff(); } else { snd.wake(); if (!prefs.mute) setTrack('life', true); if (T4.exposure || T4.community) setTrack('places', true); }
    mu.classList.toggle('muted', !prefs.sound); mu.setAttribute('aria-pressed', String(!prefs.sound)); mu.dataset.tip = prefs.sound ? 'Sound off' : 'Sound on'; const ix = document.querySelector('#ix-sound'); if (ix) ix.setAttribute('aria-pressed', String(prefs.sound)); if (prefs.sound) snd.tick(1700); return;
  }
  const md = e.target.closest('[data-mood-next]');
  if (md) { const ks = Object.keys(MOODS); prefs.mood = ks[(ks.indexOf(moodOf()) + 1) % ks.length]; savePrefs(); const m = MOODS[prefs.mood]; md.innerHTML = icon(m.ic, 'sm'); md.dataset.tip = m.w; md.setAttribute('aria-label', `Mood: ${m.w}`); snd.tick(1400); buzz(4); return; }
  const t = e.target.closest('[data-t4]'); if (t) setTrack4(t.dataset.t4, !trackOn(t.dataset.t4));
});
/* 1 to 4 on a keyboard: the four tracks, as the radio's presets */
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '') || (e.target && e.target.isContentEditable)) return;
  const i = '1234'.indexOf(e.key); if (i < 0) return; const k = TRACKS[i].k; setTrack4(k, !trackOn(k));
});
/* an earlier build kept a track of one's own here; its store goes */
try { indexedDB.deleteDatabase('da.tracks'); } catch (e) { /* none */ }
