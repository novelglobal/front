/* ════════════════════════════════════════════════════════════════════
   STATIONS — collections of the map. The radar is the instrument: when the sweep reaches a cell, the cell sounds, and a small
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
const voiceMark = v => (v.g ? glyphSVG(v.g) : v.fam ? icon(FAM_IC[v.fam] || 'people') : PACK_KINDS[v.pk].g ? glyphSVG(PACK_KINDS[v.pk].g) : icon(PACK_KINDS[v.pk].i));
const voxHTML = id => (TRK.voices[id] || []).map((v, i) => `<i class="v" data-v="${i}">${voiceMark(v)}</i>`).join('');
const tkSel = id => `#sec-tracks [data-tk="${CSS.escape(id)}"]`;
/* a cell reached by the sweep: does its station let it sound, and how. True if it sounded */
function flashVoice(id, key) { const vs = TRK.voices[id] || []; const n = vs.findIndex(v => (v.g || v.fam || v.pk) === key); if (n < 0) return n; const v = document.querySelector(`${tkSel(id)} .v[data-v="${n}"]`); if (v) { v.classList.add('hit'); setTimeout(() => v.classList.remove('hit'), 420); } return n; }
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
function tracksSection() {
  const list = trackList(); for (const t of list) TRK.voices[t.id] = trackVoices(t.id);
  const row = t => { const on = !!TRK.on[t.id], see = seeTrack(t.id);
    return `<li class="tk${on ? ' on' : ''}${see ? ' seen' : ''}" data-tk="${esc(t.id)}"${t.tip ? ` data-tip="${esc(t.tip)}"` : ''}>`
      + `<button type="button" class="tk-see" aria-pressed="${see}" aria-label="On the map"${t.id === 'life' && CFG.lifeLock ? ' disabled' : ''}><i></i></button>`
      + `<span class="vox">${voxHTML(t.id)}</span>`
      + `<input type="range" class="tk-lvl" min="0" max="100" step="1" value="${Math.round(lvlOf(t.id) * 100)}" aria-label="Level" style="--v:${Math.round(lvlOf(t.id) * 100)}%">`
      + `<button type="button" class="tk-play${t.id === 'life' && !on ? ' muted' : ''}" aria-pressed="${on}" aria-label="${t.id === 'life' ? 'Sound' : 'Play'}"${(TRK.voices[t.id] || []).length ? '' : ' disabled'}>${playIcon(t.id, on)}</button>`
      + `</li>`; };
  const moods = Object.entries(MOODS).map(([k, m]) => `<button type="button" class="mood" data-mood="${k}" aria-pressed="${moodOf() === k}" aria-label="${m.w}" data-tip="${m.w}">${icon(m.ic, 'sm')}</button>`).join('');
  const mute = `<button type="button" class="mood mute${prefs.sound ? '' : ' muted'}" data-mute-all aria-pressed="${!prefs.sound}" aria-label="Sound off" data-tip="${prefs.sound ? 'Sound off' : 'Sound on'}">${icon('sound', 'sm')}</button>`;
  return `<section class="sec tracks" id="sec-tracks"><div class="lab-row">${lab('Stations')}<span class="moods" role="group" aria-label="Mood">${moods}${mute}</span></div><ol class="deck">${list.map(row).join('')}</ol></section>`;
}
$('#view').addEventListener('input', e => {
  const f = e.target.closest('.tk-lvl'); if (!f) return; const r = f.closest('[data-tk]'); prefs.lvl = { ...(prefs.lvl || {}), [r.dataset.tk]: +f.value / 100 }; f.style.setProperty('--v', `${f.value}%`); savePrefs();
});
$('#view').addEventListener('click', e => {
  /* everything quiet, or back: the radar, its drone and every station; nature comes back on air unless muted */
  if (e.target.closest('[data-mute-all]')) {
    prefs.sound = !prefs.sound; savePrefs(); if (!prefs.sound) { stopTracks(); snd.droneOff(); } else { snd.wake(); if (!prefs.mute) setTrack('life', true); }
    const b = e.target.closest('[data-mute-all]'); b.classList.toggle('muted', !prefs.sound); b.setAttribute('aria-pressed', String(!prefs.sound)); const ix = document.querySelector('#ix-sound'); if (ix) ix.setAttribute('aria-pressed', String(prefs.sound)); if (prefs.sound) snd.tick(1700); return;
  }
  const md = e.target.closest('[data-mood]');
  if (md) { prefs.mood = md.dataset.mood; savePrefs(); document.querySelectorAll('#sec-tracks [data-mood]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mood === prefs.mood))); snd.tick(1400); buzz(4); return; }
  const r = e.target.closest('[data-tk]'); if (!r) return; const id = r.dataset.tk;
  if (e.target.closest('.tk-lvl')) return;
  if (e.target.closest('.tk-see')) { seeIt(id, !seeTrack(id)); snd.tick(seeTrack(id) ? 1900 : 1200); buzz(4); return; }
  const p = e.target.closest('.tk-play'); if (!p || p.disabled) return;
  if (!prefs.sound) { toast('SOUND OFF'); return; }
  const on = !TRK.on[id]; setTrack(id, on); if (id === 'life') { prefs.mute = !on; savePrefs(); } buzz(4);
});
/* an earlier build kept a track of one's own here; its store goes */
try { indexedDB.deleteDatabase('da.tracks'); } catch (e) { /* none */ }
