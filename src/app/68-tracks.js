/* ════════════════════════════════════════════════════════════════════
   STATIONS — collections of the map, each seen on it or not, played or not, and as loud as its fader. The lives (animals,
   insects, plants, and us) are a choir: each kind a voice, holding the chord and, one at a time, singing a short line. The
   human ecology (brands, businesses, third spaces, groups) is the kit: each part its own sound in the beat. A pack of cells
   people add rings as bells. All built from what is in the radar now, in D minor, in one of three moods: FOG (pads, no
   drums), RAIN (crackle, a shuffled two-step), WEIGHT (slow, heavy, dub). Nature is always seen (unless unlocked on the
   approval page) and on air from the first touch, and can be muted; the others start off.
   ════════════════════════════════════════════════════════════════════ */
const MOODS = { fog: { bpm: 64, swing: 0, w: 'FOG', ic: 'dusk' }, rain: { bpm: 134, swing: 0.17, w: 'RAIN', ic: 'rain' }, weight: { bpm: 70, swing: 0, w: 'WEIGHT', ic: 'night' } };
const moodOf = () => (MOODS[prefs.mood] ? prefs.mood : 'fog');
/* D minor: i, VI, III, v, two bars each. A low root for the bass, and the chord the choir holds */
const CHORDS = [[38, [62, 65, 69, 72]], [34, [58, 62, 65, 69]], [41, [57, 60, 65, 69]], [33, [57, 60, 64, 67]]];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
/* where in sixteen steps each part of the kit falls, by mood; and where a voice sings its line */
const BEAT = { rain: { kick: [0, 10], rim: [4, 12], hat: [2, 6, 10, 14], shaker: [7, 15], clap: [12], tick: [3, 11] }, weight: { kick: [0, 8], rim: [8], hat: [4, 12], shaker: [14], clap: [], tick: [6] }, fog: {} };
const CHOP = { fog: [3, 10], rain: [2, 7, 11, 14], weight: [8] };
const KIT_OF = { brand: 'kick', service: 'hat', third: 'rim', network: 'shaker', circular: 'clap', artists: 'tick', people: 'shaker' };
const lvlOf = id => { const v = (prefs.lvl || {})[id]; return v == null ? (id === 'life' ? 0.8 : 0.7) : clamp(v, 0, 1); };
const TRK_FAMS = ['brand', 'service', 'third', 'network', 'circular', 'artists'];
const FAM_IC = { brand: 'sign', service: 'give', third: 'host', network: 'people', circular: 'remix', artists: 'note', people: 'hug' };
/* a pack's cells, sounded as the lives and places nearest them */
const PACK_SPEC = { fruit: { g: 'plant' }, tree: { g: 'plant' }, garden: { g: 'bee' }, node: { fam: 'network' }, water: { g: 'aquatic' }, shade: { fam: 'third' }, refuge: { fam: 'people' }, place: { fam: 'service' } };
const TRK = { on: {}, step: 0, next: 0, timer: 0, hits: {}, voices: {} };
/* a station's sixteen steps in the mood it is in: where it sounds */
const patOf = id => { const md = moodOf(); const on = id === 'life' ? [0, ...CHOP[md]] : id === 'places' ? (md === 'fog' ? [0, 8] : [...new Set(Object.values(BEAT[md]).flat())]) : [5, 13]; return [...Array(16).keys()].map(i => (on.includes(i) ? 1 : 0)); };
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
/* the score: sixteenth steps scheduled a little ahead. Nature holds the chord at each change and, one voice at a time, sings a
   line; the places play their parts of the kit (in FOG, low bells instead); the cells people add ring high; RAIN crackles */
function sound(id, n, spec, f, at, opt) {
  snd.cell(spec, f, at, opt);
  setTimeout(() => { const v = document.querySelector(`${tkSel(id)} .v[data-v="${n}"]`); if (v) { v.classList.add('hit'); setTimeout(() => v.classList.remove('hit'), 260); } }, Math.max(0, at * 1000));
}
function trkTick() {
  const ids = Object.keys(TRK.on).filter(k => TRK.on[k]); if (!ids.length) { clearInterval(TRK.timer); TRK.timer = 0; return; }
  if (!prefs.sound) { stopTracks(); return; }
  const md = moodOf(), Mo = MOODS[md], step = 60 / Mo.bpm / 4;
  const now = performance.now() / 1000; if (TRK.next < now) TRK.next = now + 0.05;
  while (TRK.next < now + 0.3) {
    const i = TRK.step % 16, bar = Math.floor(TRK.step / 16), at = TRK.next - now + (i % 2 ? Mo.swing * step : 0);
    if (i === 0) freshVoices();
    const [root, tones] = CHORDS[Math.floor(bar / 2) % CHORDS.length]; const change = i === 0 && bar % 2 === 0;
    for (const id of ids) {
      const vs = TRK.voices[id] || []; const L = lvlOf(id); if (!vs.length || L < 0.02) continue;
      const next = () => (TRK.hits[id] = (TRK.hits[id] || 0) + 1) % vs.length;
      if (id === 'life') {
        if (change) vs.slice(0, 4).forEach((v, n) => sound(id, n, v.spec, mtof(tones[n % tones.length] - (md === 'weight' ? 12 : 0)), at, { dur: step * 30, v: 0.045 * L, pan: (n - 1.5) * 0.45, vowel: md === 'weight' ? 'o' : n % 2 ? 'o' : 'a' }));
        if (CHOP[md].includes(i) && Math.random() < 0.8) { const n = next(); const m = tones[(n + bar) % tones.length] + (md === 'rain' ? 12 : 0) + (Math.random() < 0.2 ? 2 : 0); sound(id, n, vs[n].spec, mtof(m), at, { dur: md === 'rain' ? step * 1.6 : step * 6, v: 0.075 * L, pan: -0.35 + n * 0.1 }); }
      } else if (id === 'places') {
        if (md === 'fog') { if (i === 0 || i === 8) { const n = next(); sound(id, n, vs[n].spec, mtof(tones[n % tones.length] - 12), at, { v: 0.05 * L, bell: true, pan: 0.3 }); } }
        else {
          vs.forEach((v, n) => { const k = KIT_OF[v.fam]; if ((BEAT[md][k] || []).includes(i)) sound(id, n, v.spec, 0, at, { v: (k === 'kick' ? 0.1 : 0.055) * L, mood: md, pan: (n - 2) * 0.15 }); });
          if (change || (md === 'rain' && i === 10)) snd.bass(mtof(root), at, step * (md === 'weight' ? 14 : 6), 0.09 * L);
        }
      } else if ((i === 5 || i === 13) && Math.random() < 0.6) { const n = next(); sound(id, n, vs[n].spec, mtof(tones[n % tones.length] + 24), at, { v: 0.05 * L, bell: true, pan: 0.5 }); }
    }
    if (md === 'rain' && i === 0) snd.crackle(at, step * 16, 0.01);
    TRK.step++; TRK.next += step;
  }
}
const playIcon = (id, on) => (id === 'life' ? icon('sound', 'sm') : icon(on ? 'pause' : 'play', 'sm'));
function setTrack(id, on) {
  TRK.on[id] = on; const el = document.querySelector(tkSel(id));
  if (el) { el.classList.toggle('on', on); const b = el.querySelector('.tk-play'); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('muted', id === 'life' && !on); b.innerHTML = playIcon(id, on); }
  if (on && !TRK.timer) { TRK.step = 0; TRK.next = 0; freshVoices(); TRK.timer = setInterval(trkTick, 60); trkTick(); }
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
