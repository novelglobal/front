/* ════════════════════════════════════════════════════════════════════
   TRACKS — collections of the map, each a track: seen on the map or not, played or not. The lives (animals, insects,
   plants, and us), each kind in its own call; the human ecology (brands, businesses, third spaces, groups), each part in
   its own small sound; and each pack of cells people add (fruit trees, mesh nodes, water, shade). A track's beat is built
   from what is there now, so a radar moved somewhere else plays something else. Seen at first: the lives and the packs.
   Played at first: none. Shown with restraint: a light for seen, the voices, a fine trace of the beat, play.
   ════════════════════════════════════════════════════════════════════ */
const TRK_STEP = 0.3, TRK_N = 8;                                       /* eight steps a bar, 2.4 s */
const TRK_PAT = { life: [1, 0, 1, 1, 0, 1, 1, 0], places: [0, 1, 0, 0, 1, 0, 0, 1], pack: [1, 0, 0, 1, 0, 0, 1, 0] };   /* the lives on the beat, the places between it */
const TRK_SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
const TRK_FAMS = ['brand', 'service', 'third', 'network', 'circular', 'artists'];
const FAM_IC = { brand: 'sign', service: 'give', third: 'host', network: 'people', circular: 'remix', artists: 'note', people: 'hug' };
/* a pack's cells, sounded as the lives and places nearest them */
const PACK_SPEC = { fruit: { g: 'plant' }, tree: { g: 'plant' }, garden: { g: 'bee' }, node: { fam: 'network' }, water: { g: 'aquatic' }, shade: { fam: 'third' }, refuge: { fam: 'people' }, place: { fam: 'service' } };
const TRK = { on: {}, step: 0, next: 0, timer: 0, hits: {}, voices: {} };
const patOf = id => TRK_PAT[id] || TRK_PAT.pack;
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
/* the beat: steps scheduled a little ahead, each track's voices taking turns, a pentatonic step apart */
function trkTick() {
  const ids = Object.keys(TRK.on).filter(k => TRK.on[k]); if (!ids.length) { clearInterval(TRK.timer); TRK.timer = 0; return; }
  if (!prefs.sound) { stopTracks(); return; }
  const now = performance.now() / 1000; if (TRK.next < now) TRK.next = now + 0.05;
  while (TRK.next < now + 0.3) {
    const i = TRK.step % TRK_N, at = TRK.next - now; if (i === 0) freshVoices();
    ids.forEach((id, n) => {
      const vs = TRK.voices[id] || []; if (!patOf(id)[i] || !vs.length) return;
      const vi = (TRK.hits[id] = (TRK.hits[id] || 0) + 1) % vs.length; const bar = Math.floor(TRK.step / TRK_N);
      const f = 262 * Math.pow(2, TRK_SCALE[(vi * 2 + bar + n) % TRK_SCALE.length] / 12);
      snd.knot(vs[vi].spec, f, at, id === 'life' ? 0.75 : 0.6, id === 'life' ? -0.3 : id === 'places' ? 0.3 : 0);
      setTimeout(() => { const v = document.querySelector(`${tkSel(id)} .v[data-v="${vi}"]`); if (v) { v.classList.add('hit'); setTimeout(() => v.classList.remove('hit'), 220); } }, Math.max(0, at * 1000));
    });
    TRK.step++; TRK.next += TRK_STEP;
  }
}
function setTrack(id, on) {
  TRK.on[id] = on; const el = document.querySelector(tkSel(id));
  if (el) { el.classList.toggle('on', on); const b = el.querySelector('.tk-play'); b.setAttribute('aria-pressed', String(on)); b.innerHTML = icon(on ? 'pause' : 'play', 'sm'); }
  if (on && !TRK.timer) { TRK.step = 0; TRK.next = 0; freshVoices(); TRK.timer = setInterval(trkTick, 60); trkTick(); }
}
function stopTracks() { for (const id of Object.keys(TRK.on)) if (TRK.on[id]) setTrack(id, false); }
/* seen on the map, or not: kept on this device */
function seeIt(id, on) {
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
  for (let i = 0; i < TRK_N; i++) for (let j = 0; j < 4; j++) { const hit = P[i] && vs.length; const v = hit ? (j === 1 ? 0.55 + 0.45 * (((h % vs.length) + 1) / vs.length) : j === 2 ? -0.35 : 0) : 0; if (hit && j === 3) h++; ys.push(v); }
  return traceSVG(ys);
}
function tracksSection() {
  const list = trackList(); for (const t of list) TRK.voices[t.id] = trackVoices(t.id);
  const row = t => { const on = !!TRK.on[t.id], see = seeTrack(t.id);
    return `<li class="tk${on ? ' on' : ''}${see ? ' seen' : ''}" data-tk="${esc(t.id)}"${t.tip ? ` data-tip="${esc(t.tip)}"` : ''}>`
      + `<button type="button" class="tk-see" aria-pressed="${see}" aria-label="On the map"><i></i></button>`
      + `<span class="vox">${voxHTML(t.id)}</span>`
      + `<button type="button" class="tk-play" aria-pressed="${on}" aria-label="Play"${(TRK.voices[t.id] || []).length ? '' : ' disabled'}>${icon(on ? 'pause' : 'play', 'sm')}</button>`
      + `<span class="beat">${beatTrace(t.id)}</span></li>`; };
  return `<section class="sec tracks" id="sec-tracks">${lab('Stations')}<ol class="deck">${list.map(row).join('')}</ol></section>`;
}
$('#view').addEventListener('click', e => {
  const r = e.target.closest('[data-tk]'); if (!r) return; const id = r.dataset.tk;
  if (e.target.closest('.tk-see')) { seeIt(id, !seeTrack(id)); snd.tick(seeTrack(id) ? 1900 : 1200); buzz(4); return; }
  const p = e.target.closest('.tk-play'); if (!p || p.disabled) return;
  if (!prefs.sound) { toast('SOUND OFF'); return; }
  setTrack(id, !TRK.on[id]); buzz(4);
});
/* an earlier build kept a track of one's own here; its store goes */
try { indexedDB.deleteDatabase('da.tracks'); } catch (e) { /* none */ }
