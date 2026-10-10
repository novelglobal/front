/* ════════════════════════════════════════════════════════════════════
   TRACKS — two beats from inside the radar. The lives, each kind in its own call (animals, insects, plants, and us);
   the human ecology, each part in its own small sound (brands, businesses, third spaces, groups). Each is built from
   what is there now, so a radar moved somewhere else plays something else. A third, one's own, is added on STORIES
   under CELLS and kept on this device only. Shown with restraint: a dot, the voices, a fine trace of the beat.
   ════════════════════════════════════════════════════════════════════ */
const TRK_STEP = 0.3, TRK_N = 8;                                       /* eight steps a bar, 2.4 s */
const TRK_PAT = { a: [1, 0, 1, 1, 0, 1, 1, 0], b: [0, 1, 0, 0, 1, 0, 0, 1] };   /* the lives on the beat, the places between it */
const TRK_SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
const TRK_FAMS = ['brand', 'service', 'third', 'network', 'circular', 'artists'];
const FAM_IC = { brand: 'sign', service: 'give', third: 'host', network: 'people', circular: 'remix', artists: 'note', people: 'hug' };
const TRK = { on: { a: false, b: false, c: false }, step: 0, next: 0, timer: 0, hits: { a: 0, b: 0 }, voices: { a: [], b: [] }, own: null, audio: null };
/* what each side plays: the kinds of life in the radar, most seen first; the parts of the human ecology in it */
function trackVoices(k) {
  if (k === 'a') {
    const n = new Map();
    for (const it of life.items) { if (!it.inS || it.o.hist || it.o.ob || it.o.story || it.o.pack || it.b.tone === 'hist' || isCold(it.o)) continue; const g = it.o.hum ? 'human' : glyphOf(it.o); if (g) n.set(g, (n.get(g) || 0) + 1); }
    return [...n].sort((x, y) => y[1] - x[1]).slice(0, 8).map(([g]) => ({ g, spec: { g: g === 'human' ? 'ape' : g } }));
  }
  const fams = new Set(bizNear(S.scan.lat, S.scan.lng, S.scan.r).map(b => b.fam));
  return TRK_FAMS.filter(f => fams.has(f)).map(fam => ({ fam, spec: { fam } }));
}
const voxHTML = k => TRK.voices[k].map((v, i) => `<i class="v" data-v="${i}">${k === 'a' ? glyphSVG(v.g) : icon(FAM_IC[v.fam] || 'people')}</i>`).join('');
function freshVoices() {
  for (const k of ['a', 'b']) {
    const vs = trackVoices(k); const was = TRK.voices[k].map(v => v.g || v.fam).join(); TRK.voices[k] = vs;
    const el = document.querySelector(`#sec-tracks [data-trk="${k}"]`); if (el && vs.map(v => v.g || v.fam).join() !== was) { el.querySelector('.vox').innerHTML = voxHTML(k); el.querySelector('.beat').innerHTML = beatTrace(k); el.disabled = !vs.length; }
  }
}
/* the beat: steps scheduled a little ahead, each side's voices taking turns, a pentatonic step apart */
function trkTick() {
  if (!TRK.on.a && !TRK.on.b) { clearInterval(TRK.timer); TRK.timer = 0; return; }
  if (!prefs.sound) { stopTracks(); return; }
  const now = performance.now() / 1000; if (TRK.next < now) TRK.next = now + 0.05;
  while (TRK.next < now + 0.3) {
    const i = TRK.step % TRK_N, at = TRK.next - now; if (i === 0) freshVoices();
    for (const k of ['a', 'b']) {
      const vs = TRK.voices[k]; if (!TRK.on[k] || !TRK_PAT[k][i] || !vs.length) continue;
      const vi = TRK.hits[k]++ % vs.length; const bar = Math.floor(TRK.step / TRK_N);
      const f = 262 * Math.pow(2, TRK_SCALE[(vi * 2 + bar) % TRK_SCALE.length] / 12);
      snd.knot(vs[vi].spec, f, at, k === 'a' ? 0.75 : 0.6, k === 'a' ? -0.3 : 0.3);
      setTimeout(() => { const v = document.querySelector(`#sec-tracks [data-trk="${k}"] .v[data-v="${vi}"]`); if (v) { v.classList.add('hit'); setTimeout(() => v.classList.remove('hit'), 220); } }, Math.max(0, at * 1000));
    }
    TRK.step++; TRK.next += TRK_STEP;
  }
}
function setTrack(k, on) {
  TRK.on[k] = on; const el = document.querySelector(`#sec-tracks [data-trk="${k}"]`); if (el) { el.classList.toggle('on', on); el.setAttribute('aria-pressed', String(on)); }
  if (k === 'c') { if (on && TRK.own) { if (!TRK.audio) { TRK.audio = new Audio(URL.createObjectURL(TRK.own.blob)); TRK.audio.loop = true; TRK.audio.volume = 0.7; } TRK.audio.play().catch(() => setTrack('c', false)); } else if (TRK.audio) TRK.audio.pause(); return; }
  if (on && !TRK.timer) { if (!TRK.on.a || !TRK.on.b) { TRK.step = 0; TRK.next = 0; } freshVoices(); TRK.timer = setInterval(trkTick, 60); trkTick(); }
}
function stopTracks() { for (const k of ['a', 'b', 'c']) if (TRK.on[k]) setTrack(k, false); }
/* a fine trace of the beat, as a pen draws it on moving paper: a mark at each step a voice sounds, drawn twice over so it
   can feed past without a seam. One's own track traces its loudness */
function traceSVG(ys) {
  const n = ys.length, pts = []; for (let r = 0; r < 2; r++) ys.forEach((y, i) => pts.push(`${((r * n + i) / (2 * n) * 200).toFixed(1)},${(8 - y * 6.5).toFixed(1)}`));
  pts.push(`200,${(8 - ys[0] * 6.5).toFixed(1)}`);
  return `<svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.join(' ')}"/></svg>`;
}
function beatTrace(k) {
  const vs = TRK.voices[k]; const ys = []; let h = 0;
  for (let i = 0; i < TRK_N; i++) for (let j = 0; j < 4; j++) { const hit = TRK_PAT[k][i] && vs.length; const v = hit ? (j === 1 ? 0.55 + 0.45 * (((h % vs.length) + 1) / vs.length) : j === 2 ? -0.35 : 0) : 0; if (hit && j === 3) h++; ys.push(v); }
  return traceSVG(ys);
}
const ownTrace = pk => traceSVG((pk && pk.length ? pk : [0]).map((v, i) => (i % 2 ? -v : v) * 0.9));
function tracksSection() {
  TRK.voices.a = trackVoices('a'); TRK.voices.b = trackVoices('b');
  const row = (k, inner, trace, extra = '', tip = '') => `<li><button type="button" class="trk${TRK.on[k] ? ' on' : ''}" data-trk="${k}" aria-pressed="${TRK.on[k]}"${tip ? ` data-tip="${esc(tip)}"` : ''}${k !== 'c' && !TRK.voices[k].length ? ' disabled' : ''}><i class="dot" aria-hidden="true"></i><span class="vox">${inner}</span><span class="beat">${trace}</span></button>${extra}</li>`;
  return `<section class="sec tracks" id="sec-tracks">${lab('Tracks')}<ol class="deck">${row('a', voxHTML('a'), beatTrace('a'))}${row('b', voxHTML('b'), beatTrace('b'))}`
    + (TRK.own ? row('c', '', ownTrace(TRK.own.peaks), `<button type="button" class="ib trk-x" data-trk-x aria-label="Remove">${icon('close', 'sm')}</button>`, TRK.own.name) : '')
    + `</ol></section>`;
}
$('#view').addEventListener('click', e => {
  const x = e.target.closest('[data-trk-x]'); if (x) { setTrack('c', false); if (TRK.audio) { URL.revokeObjectURL(TRK.audio.src); TRK.audio = null; } TRK.own = null; idbTracks.del('own').catch(() => {}); refreshPanel(); return; }
  const b = e.target.closest('[data-trk]'); if (!b || b.disabled) return;
  if (!prefs.sound) { toast('SOUND OFF'); return; }
  setTrack(b.dataset.trk, !TRK.on[b.dataset.trk]); buzz(4);
});
/* ───────── a track of one's own: added on STORIES, kept in this browser (IndexedDB), never sent ───────── */
const idbTracks = (() => {
  let db = null; const open = () => db || (db = new Promise((res, rej) => { const r = indexedDB.open('da.tracks', 1); r.onupgradeneeded = () => r.result.createObjectStore('t'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const run = (mode, fn) => open().then(d => new Promise((res, rej) => { const t = d.transaction('t', mode); const q = fn(t.objectStore('t')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  return { get: k => run('readonly', s => s.get(k)), put: (k, v) => run('readwrite', s => s.put(v, k)), del: k => run('readwrite', s => s.delete(k)) };
})();
async function peaksOf(blob) {
  try { const ac = new OfflineAudioContext(1, 8000, 8000); const buf = await ac.decodeAudioData(await blob.arrayBuffer()); const d = buf.getChannelData(0); const n = 48, w = Math.max(1, Math.floor(d.length / n)); const out = [];
    for (let i = 0; i < n; i++) { let m = 0; for (let j = i * w; j < Math.min(d.length, (i + 1) * w); j += 16) m = Math.max(m, Math.abs(d[j])); out.push(m); }
    const top = Math.max(0.01, ...out); return out.map(v => +(v / top).toFixed(2)); } catch (e) { return null; }
}
const trackUp = () => `<p class="pack-up mono"><label>${icon('plus', 'sm')}TRACKS<small>.MP3 · .WAV · .M4A</small><input type="file" id="trk-f" accept="audio/*,.mp3,.wav,.m4a,.ogg" hidden></label></p>`;
$('#view').addEventListener('change', async e => {
  if (e.target.id !== 'trk-f' || !e.target.files || !e.target.files[0]) return; const f = e.target.files[0];
  if (f.size > 12e6) { toast('TOO LARGE'); return; }
  const peaks = await peaksOf(f); if (!peaks) { toast('NOT A TRACK'); return; }
  setTrack('c', false); if (TRK.audio) { URL.revokeObjectURL(TRK.audio.src); TRK.audio = null; }
  TRK.own = { name: clipT(f.name, 60), blob: f, peaks }; idbTracks.put('own', { name: TRK.own.name, blob: f, peaks }).catch(() => { /* kept for this visit only */ });
  snd.tick(1600); toast('TRACKS'); refreshPanel();
});
try { idbTracks.get('own').then(v => { if (v && v.blob) { TRK.own = { name: v.name || '', blob: v.blob, peaks: v.peaks || [] }; if (S.view === 0) refreshPanel(); } }).catch(() => {}); } catch (e) { /* no IndexedDB here */ }
