/* ════════════════════════════════════════════════════════════════════
   STATIONS — collections of the map, each seen on it or not, sounding or not, as loud as its fader. No music: no chords, no
   grid, no beat. Every cell has a place on one harmonic series over a low A, set by its kind, so whatever sounds together
   agrees; when it sounds is chance, more often the more there is in the radar. The lives sound as the mood's texture
   (FOG long bowed resonances, RAIN glints and drops, WEIGHT low swells), the places in their own small real sounds, the cells
   people add as bells; and the string figures near the radar sound their knots together, slowly rolled. Nature is always seen
   (unless unlocked on the approval page) and on from the first touch, and can be muted; the others start off.
   ════════════════════════════════════════════════════════════════════ */
/* a mood is a texture and a density: how often, on average, a station sounds each second, and for how long */
const MOODS = { fog: { rate: 0.6, dur: [3, 7], w: 'FOG', ic: 'dusk' }, rain: { rate: 1.8, dur: [0.1, 0.4], w: 'RAIN', ic: 'rain' }, weight: { rate: 0.25, dur: [4, 9], w: 'WEIGHT', ic: 'night' } };
const moodOf = () => (MOODS[prefs.mood] ? prefs.mood : 'fog');
/* one harmonic series over a low A: every kind and every place takes a partial of it, the same each time */
const F0 = 55, PARTIALS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16];
const partialOf = key => { let h = 2166136261; for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return PARTIALS[(h >>> 0) % PARTIALS.length]; };
const fOf = v => F0 * partialOf(v.g || v.fam || v.pk || 'x');
const lvlOf = id => { const v = (prefs.lvl || {})[id]; return v == null ? (id === 'life' ? 0.8 : 0.7) : clamp(v, 0, 1); };
const TRK_FAMS = ['brand', 'service', 'third', 'network', 'circular', 'artists'];
const FAM_IC = { brand: 'sign', service: 'give', third: 'host', network: 'people', circular: 'remix', artists: 'note', people: 'hug' };
/* a pack's cells, sounded as the lives and places nearest them */
const PACK_SPEC = { fruit: { g: 'plant' }, tree: { g: 'plant' }, garden: { g: 'bee' }, node: { fam: 'network' }, water: { g: 'aquatic' }, shade: { fam: 'third' }, refuge: { fam: 'people' }, place: { fam: 'service' } };
const TRK = { on: {}, step: 0, next: 0, timer: 0, hits: {}, voices: {} };
/* a station's trace: where, by chance, it sounded; seeded by the station and its mood, so it is the same each time */
const patOf = id => { const r = seeded(`${id}|${moodOf()}`); const p = MOODS[moodOf()].rate; return [...Array(16).keys()].map(() => (r() < Math.min(0.8, p * 0.6) ? 1 : 0)); };
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
function freshVoices() {
  for (const t of trackList()) {
    const vs = trackVoices(t.id); const key = v => v.g || v.fam || v.pk; const was = (TRK.voices[t.id] || []).map(key).join(); TRK.voices[t.id] = vs;
    const el = document.querySelector(tkSel(t.id)); if (el && vs.map(key).join() !== was) { el.querySelector('.vox').innerHTML = voxHTML(t.id); el.querySelector('.beat').innerHTML = beatTrace(t.id); }
  }
}
/* chance: every tick, each station on may sound, more often the more cells it holds, and as the mood allows. Nothing
   lines up, but everything is on one series, so whatever meets agrees. Now and then a string figure near the radar sounds */
function sound(id, n, spec, f, at, opt) {
  snd.cell(spec, f, at, opt);
  setTimeout(() => { const v = document.querySelector(`${tkSel(id)} .v[data-v="${n}"]`); if (v) { v.classList.add('hit'); setTimeout(() => v.classList.remove('hit'), 420); } }, Math.max(0, at * 1000));
}
function strike(id, md) {
  const vs = TRK.voices[id] || []; if (!vs.length) return; const L = lvlOf(id); const Mo = MOODS[md]; const n = Math.floor(Math.random() * vs.length); const v = vs[n];
  const dur = Mo.dur[0] + Math.random() * (Mo.dur[1] - Mo.dur[0]); const pan = (Math.random() - 0.5) * 1.4; const at = Math.random() * 0.2;
  if (id === 'life') sound(id, n, v.spec, fOf(v), at, { mood: md, dur, v: 0.05 * L, pan });
  else if (id === 'places') sound(id, n, v.spec, fOf(v), at, { mood: md, v: 0.05 * L, pan });
  else sound(id, n, v.spec, fOf(v) * 2, at, { bell: true, v: 0.06 * L, pan });
  /* in RAIN, a glint often brings a few more, close behind, like drops from a branch */
  if (md === 'rain' && id === 'life' && Math.random() < 0.4) for (let k = 1; k < 2 + Math.floor(Math.random() * 4); k++) { const m = Math.floor(Math.random() * vs.length); sound(id, m, vs[m].spec, fOf(vs[m]), at + k * (0.05 + Math.random() * 0.15), { mood: md, v: 0.035 * L, pan: pan + (Math.random() - 0.5) * 0.4 }); }
}
/* the string figures whose lives are in the radar: their knots, each at its place in the series, sounded together */
function connection() {
  try {
    const cs = strings.list().filter(c => c.o && life.inScan(c.o.lat, c.o.lng)); if (!cs.length) return;
    const c = cs[Math.floor(Math.random() * cs.length)]; const m = k => (c.f.n || {})[k] || (c.f.c || {})[k] || {};
    const fs = [F0 * partialOf(glyphOf(c.o)), ...c.keys.map(k => { const x = m(k); return F0 * partialOf(x.g || x.fam || x.t || k); })].slice(0, 6);
    snd.tie(fs, 0.1, 0.028 * lvlOf('life'));
  } catch (e) { /* no figures yet */ }
}
function trkTick() {
  const ids = Object.keys(TRK.on).filter(k => TRK.on[k]); if (!ids.length) { clearInterval(TRK.timer); TRK.timer = 0; return; }
  if (!prefs.sound) { stopTracks(); return; }
  const md = moodOf(), Mo = MOODS[md]; const now = performance.now() / 1000; const dt = TRK.next ? Math.min(0.25, now - TRK.next) : 0.06; TRK.next = now;
  if (Math.floor(now / 4) !== TRK.step) { TRK.step = Math.floor(now / 4); freshVoices(); }
  for (const id of ids) { const vs = TRK.voices[id] || []; if (!vs.length || lvlOf(id) < 0.02) continue; const rate = Mo.rate * (0.5 + 0.12 * vs.length) * (id === 'life' ? 1 : id === 'places' ? 0.8 : 0.4); if (Math.random() < rate * dt) strike(id, md); }
  if (TRK.on.life && Math.random() < dt / 14) connection();
}
const playIcon = (id, on) => (id === 'life' ? icon('sound', 'sm') : icon(on ? 'pause' : 'play', 'sm'));
function setTrack(id, on) {
  TRK.on[id] = on; const el = document.querySelector(tkSel(id));
  if (el) { el.classList.toggle('on', on); const b = el.querySelector('.tk-play'); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('muted', id === 'life' && !on); b.innerHTML = playIcon(id, on); }
  if (on && !TRK.timer) { TRK.step = 0; TRK.next = 0; freshVoices(); TRK.timer = setInterval(trkTick, 60); }
  /* a station switched on is heard at once */
  if (on && prefs.sound) { freshVoices(); strike(id, moodOf()); }
}
function stopTracks() { for (const id of Object.keys(TRK.on)) if (TRK.on[id]) setTrack(id, false); }
/* seen on the map, or not: kept on this device */
function seeIt(id, on) {
  if (id === 'life' && CFG.lifeLock) return;
  prefs.trk = { ...(prefs.trk || {}), [id]: on }; savePrefs();
  const el = document.querySelector(tkSel(id)); if (el) { el.classList.toggle('seen', on); el.querySelector('.tk-see').setAttribute('aria-pressed', String(on)); }
  life.redraw(); life.moved();
}
/* a fine trace of the beat, as a pen draws it on moving paper: a mark at each step a voice sounds, drawn twice over so it
   can feed past without a seam */
function traceSVG(ys) {
  const n = ys.length, pts = []; for (let r = 0; r < 2; r++) ys.forEach((y, i) => pts.push(`${((r * n + i) / (2 * n) * 200).toFixed(1)},${(8 - y * 6.5).toFixed(1)}`));
  pts.push(`200,${(8 - ys[0] * 6.5).toFixed(1)}`);
  return `<svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.join(' ')}"/></svg>`;
}
function beatTrace(id) {
  const vs = TRK.voices[id] || []; const P = patOf(id); const ys = []; let h = 0;
  for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { const hit = P[i] && vs.length; const v = hit ? (j === 1 ? 0.55 + 0.45 * (((h % vs.length) + 1) / vs.length) : j === 2 ? -0.35 : 0) : 0; if (hit && j === 3) h++; ys.push(v); }
  return traceSVG(ys);
}
function tracksSection() {
  const list = trackList(); for (const t of list) TRK.voices[t.id] = trackVoices(t.id);
  const row = t => { const on = !!TRK.on[t.id], see = seeTrack(t.id);
    return `<li class="tk${on ? ' on' : ''}${see ? ' seen' : ''}" data-tk="${esc(t.id)}"${t.tip ? ` data-tip="${esc(t.tip)}"` : ''}>`
      + `<button type="button" class="tk-see" aria-pressed="${see}" aria-label="On the map"${t.id === 'life' && CFG.lifeLock ? ' disabled' : ''}><i></i></button>`
      + `<span class="vox">${voxHTML(t.id)}</span>`
      + `<input type="range" class="tk-lvl" min="0" max="100" step="1" value="${Math.round(lvlOf(t.id) * 100)}" aria-label="Level" style="--v:${Math.round(lvlOf(t.id) * 100)}%">`
      + `<button type="button" class="tk-play${t.id === 'life' && !on ? ' muted' : ''}" aria-pressed="${on}" aria-label="${t.id === 'life' ? 'Sound' : 'Play'}"${(TRK.voices[t.id] || []).length ? '' : ' disabled'}>${playIcon(t.id, on)}</button>`
      + `<span class="beat">${beatTrace(t.id)}</span></li>`; };
  const moods = Object.entries(MOODS).map(([k, m]) => `<button type="button" class="mood" data-mood="${k}" aria-pressed="${moodOf() === k}" aria-label="${m.w}" data-tip="${m.w}">${icon(m.ic, 'sm')}</button>`).join('');
  return `<section class="sec tracks" id="sec-tracks"><div class="lab-row">${lab('Stations')}<span class="moods" role="group" aria-label="Mood">${moods}</span></div><ol class="deck">${list.map(row).join('')}</ol></section>`;
}
$('#view').addEventListener('input', e => {
  const f = e.target.closest('.tk-lvl'); if (!f) return; const r = f.closest('[data-tk]'); prefs.lvl = { ...(prefs.lvl || {}), [r.dataset.tk]: +f.value / 100 }; f.style.setProperty('--v', `${f.value}%`); savePrefs();
});
$('#view').addEventListener('click', e => {
  const md = e.target.closest('[data-mood]');
  if (md) { prefs.mood = md.dataset.mood; savePrefs(); TRK.step = 0; TRK.next = 0; document.querySelectorAll('#sec-tracks [data-mood]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mood === prefs.mood))); for (const t of trackList()) { const el = document.querySelector(tkSel(t.id)); if (el) el.querySelector('.beat').innerHTML = beatTrace(t.id); } snd.tick(1400); buzz(4); return; }
  const r = e.target.closest('[data-tk]'); if (!r) return; const id = r.dataset.tk;
  if (e.target.closest('.tk-lvl')) return;
  if (e.target.closest('.tk-see')) { seeIt(id, !seeTrack(id)); snd.tick(seeTrack(id) ? 1900 : 1200); buzz(4); return; }
  const p = e.target.closest('.tk-play'); if (!p || p.disabled) return;
  if (!prefs.sound) { toast('SOUND OFF'); return; }
  const on = !TRK.on[id]; setTrack(id, on); if (id === 'life') { prefs.mute = !on; savePrefs(); } buzz(4);
});
/* an earlier build kept a track of one's own here; its store goes */
try { indexedDB.deleteDatabase('da.tracks'); } catch (e) { /* none */ }
