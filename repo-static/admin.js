/* Direct Action · the approval page. Everything sent waits here until it is shown or refused; the printers are paired here.
   The password is the ADMIN_KEY secret set in Cloudflare. It is kept in this tab only (sessionStorage) and sent with each
   request; nothing here is cached. Everything shown is set as text, never as markup. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const main = $('#main'); let KEY = sessionStorage.getItem('da.admin') || ''; let tab = 'overview';
  const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'text') e.textContent = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v != null && v !== false) e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null) e.append(c); return e; };
  async function api(path, opt = {}) {
    const r = await fetch('/api/admin/' + path, { ...opt, cache: 'no-store', headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' } });
    if (r.status === 401 || r.status === 429 || r.status === 503) { const j = await r.json().catch(() => ({})); lock(r.status === 401 ? 'WRONG PASSWORD' : r.status === 429 ? 'TOO MANY TRIES · WAIT TEN MINUTES' : String(j.error || 'NOT SET UP').toUpperCase()); throw new Error('locked'); }
    if (!r.ok) throw new Error(String(r.status)); return r;
  }
  const when = t => (t ? new Date(t).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '');
  /* a story as it travels: base64url JSON, the same format as a slip's link */
  const unpack = b => { try { return JSON.parse(decodeURIComponent(escape(atob(b.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b.length + 3) % 4))))); } catch (e) { return null; } };

  function lock(note) { KEY = ''; sessionStorage.removeItem('da.admin'); $('#tabs').hidden = true; main.replaceChildren(gate()); if (note) $('#gate-note').textContent = note; }
  function gate() {
    const f = el('form', { class: 'gate', id: 'gate', onsubmit: e => { e.preventDefault(); KEY = $('#key').value.trim(); if (!KEY) return; sessionStorage.setItem('da.admin', KEY); open(); } },
      el('b', { text: 'Approval' }), el('input', { id: 'key', type: 'password', autocomplete: 'current-password', 'aria-label': 'Password', placeholder: 'Password', required: true }),
      el('button', { type: 'submit', text: 'OPEN' }), el('p', { class: 'note', id: 'gate-note' }));
    return f;
  }
  async function open() { $('#tabs').hidden = false; await show(tab); badges(); }
  /* how many wait, beside their names in the rail */
  async function badges() { try { const o = await (await api('overview')).json(); $('#n-waiting').textContent = o.stories.waiting || ''; $('#n-places').textContent = o.places.waiting || ''; } catch (e) { /* later */ } }
  /* a page's own heading, and a line on what it is for */
  const head = (t, lede) => [el('h2', { text: t }), lede ? el('p', { class: 'lede', text: lede }) : null];
  async function show(t) {
    tab = t; document.querySelectorAll('#tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    main.replaceChildren(el('p', { class: 'empty', text: 'LOADING' }));
    try { if (t === 'overview') await overview(); else if (t === 'printers') await printers(); else if (t === 'stations') await stations(); else if (t === 'places') await places(); else if (t === 'posts') await posts(); else if (t === 'site') await site(); else if (t === 'data') await data(); else if (t === 'guide') guide(); else if (t === 'makers') await makers(); else await stories(t); } catch (e) { if (e.message !== 'locked') main.replaceChildren(el('p', { class: 'empty', text: 'NO ANSWER · TRY AGAIN' })); }
  }

  /* ───────── makers: each by their three characters, newest first; when seen by the moon, the date after ───────── */
  const LUNA = 29.530588853 * 864e5, NEW0 = Date.UTC(2000, 0, 6, 18, 14), MOONS = ['NEW', 'WAXING CRESCENT', 'FIRST QUARTER', 'WAXING GIBBOUS', 'FULL', 'WANING GIBBOUS', 'LAST QUARTER', 'WANING CRESCENT'];
  const moonOf = t => { const x = (t - NEW0) / LUNA, f = x - Math.floor(x); return MOONS[Math.floor(f * 8 + 0.5) % 8] + ' MOON'; };
  const moonsAgo = t => { const k = Math.floor((Date.now() - NEW0) / LUNA) - Math.floor((t - NEW0) / LUNA); return k <= 0 ? 'THIS MOON' : k === 1 ? 'LAST MOON' : k + ' MOONS AGO'; };
  async function makers() {
    const j = await (await api('makers')).json(), list = j.makers || [];
    const rows = list.map(m => el('tr', {}, el('td', { class: 'mono', text: m.who }), el('td', { text: String(m.posts) }), el('td', { text: String(m.shown || 0) }), el('td', { text: m.gone ? String(m.gone) : '' }), el('td', { text: (m.stage || '').toUpperCase() }),
      el('td', { text: moonsAgo(m.last) + ' · ' + moonOf(m.last) }), el('td', { class: 'soft', text: when(m.last) }), el('td', { class: 'soft', text: moonsAgo(m.first) })));
    main.replaceChildren(...head('Makers', 'Everyone who has sent something, by the three characters on their prints. Their stage is where they were when they last sent. A phone keeps its code for one moon from its last use; then it makes a new one, unless its maker scans their pass.'),
      list.length ? el('table', { class: 'makers' }, el('thead', {}, el('tr', {}, ...['CODE', 'SENT', 'ON THE SITE', 'TAKEN DOWN', 'STAGE', 'LAST SEEN', 'DATE', 'FIRST SEEN'].map(h => el('th', { text: h })))), el('tbody', {}, ...rows)) : el('p', { class: 'empty', text: 'NO ONE YET' }));
  }

  /* ───────── stories: what each one says, its photograph, where it was sent ───────── */
  async function photoOf(id, img) { try { const r = await api('photos/' + id); img.src = URL.createObjectURL(await r.blob()); } catch (e) { img.remove(); } }
  async function act(id, action, card) {
    if (action === 'purge' && !confirm('Delete this for good? It cannot be brought back.')) return;
    await api('stories/' + id, { method: 'POST', body: JSON.stringify({ action }) });
    card.querySelector('.acts').replaceChildren(el('span', { class: 'done', text: { show: 'SHOWN · AND SENT TO PRINT', refuse: 'REFUSED', delete: 'ARCHIVED · IT CAN BE BROUGHT BACK FROM ARCHIVE', restore: 'BACK IN WAITING', purge: 'DELETED FOR GOOD' }[action] || 'DONE' }));
    badges();
  }
  function storyCard(x) {
    const card = el('article', { class: 'card' + (x.kind !== 'story' && x.kind !== 'message' ? ' rec' : '') });
    const dest = x.dest ? `TO ${x.dest.toUpperCase()}` : 'THE BOARD ONLY'; const meta = `${x.code} · ${x.kind.toUpperCase()} · ${when(x.created)} · ${dest}${x.job ? ` · PRINT ${x.job.toUpperCase()}` : ''}${x.who ? ` · BY ${x.who}` : ''}${x.gone ? ` · TAKEN DOWN BY ITS MAKER ${when(x.gone)} (OFF THE SITE, KEPT HERE)` : ''}`;
    let body;
    if (x.kind === 'story' || x.kind === 'message') {
      const j = unpack(x.body) || {}; const p = j.p || []; const lines = (j.l || []).filter(Boolean);
      body = [el('h3', { text: x.kind === 'message' ? 'MESSAGE · PRIVATE: PRINTS, NEVER ON THE MAP' : `${p[3] || p[4] || 'A life'}` }), el('div', { class: 'meta', text: `${meta} · ${p[5] || ''} ${(+p[0]).toFixed(4)} ${(+p[1]).toFixed(4)}` }),
        typeof j.s === 'string' ? el('p', { text: j.s }) : null, lines.length ? el('ol', {}, lines.map(l => el('li', { text: l }))) : el('p', { class: 'note', text: 'NO LINES' }),
        (j.k || []).length ? el('p', { class: 'note', text: 'RELATIONS · ' + j.k.map(k => k[2]).join(' · ') }) : null, j.o ? el('p', { text: 'NOTE · ' + j.o }) : null, j.y ? el('p', { class: 'note', text: '— ' + j.y }) : null];
    } else if (x.kind === 'example') {
      /* BOARD 00 rewritten: what it holds; shown, it becomes the example everyone sees */
      let j = {}; try { j = JSON.parse(x.body); } catch (e) { /* shown as it is */ } const objs = Array.isArray(j.objects) ? j.objects : [];
      const words = objs.filter(o => typeof o.text === 'string' && o.text.trim()).map(o => o.text.trim().split('\n')[0]).slice(0, 12);
      body = [el('h3', { text: `EXAMPLE · BOARD 00 · ${objs.length} PIECES` }), el('div', { class: 'meta', text: meta }), el('p', { class: 'note', text: 'SHOW MAKES THIS THE EXAMPLE EVERY VISITOR SEES.' }),
        words.length ? el('ol', {}, words.map(w => el('li', { text: w }))) : null];
    } else if (x.kind === 'cells') {
      /* a pack of cells: its title, who sent it, and every cell, to check before it goes on the map */
      let j = {}; try { j = JSON.parse(x.body); } catch (e) { /* shown as it is */ } const cells = Array.isArray(j.cells) ? j.cells : [];
      body = [el('h3', { text: `CELLS · ${j.title || 'A pack'} · ${cells.length}` }), el('div', { class: 'meta', text: `${meta} · AROUND ${x.lat} ${x.lng}` }), j.by ? el('p', { class: 'note', text: '— ' + j.by }) : null,
        el('ol', {}, cells.slice(0, 60).map(c => el('li', { text: `${String(c.k || 'place').toUpperCase()} · ${c.n || ''} · ${(+c.lat).toFixed(4)} ${(+c.lng).toFixed(4)}${c.note ? ' · ' + c.note : ''}${c.url ? ' · ' + c.url : ''}` }))),
        cells.length > 60 ? el('p', { class: 'note', text: `+ ${cells.length - 60} more` }) : null];
    } else {
      let j = {}; try { j = JSON.parse(x.body); } catch (e) { /* shown as it is */ }
      body = [el('h3', { text: `${String(j.type || 'record').toUpperCase()} · ${j.text || (j.tx && j.tx.cn) || ''}` }), el('div', { class: 'meta', text: `${meta} · ${j.lat} ${j.lng}` }), j.who ? el('p', { class: 'note', text: '— ' + j.who }) : null];
    }
    const acts = el('div', { class: 'acts' },
      x.status === 'shown' && x.kind === 'story' ? el('button', { type: 'button', class: x.star ? 'on' : '', text: x.star ? '★ STARRED' : '☆ STAR', onclick: async () => { await api('stories/' + x.id, { method: 'POST', body: JSON.stringify({ action: x.star ? 'unstar' : 'star' }) }); show('shown'); } }) : null,
      x.gone ? el('button', { type: 'button', class: 'on', text: 'BACK ON THE SITE', onclick: async () => { await api('stories/' + x.id, { method: 'POST', body: JSON.stringify({ action: 'ungone' }) }); x.gone = null; card.querySelector('.meta').textContent = card.querySelector('.meta').textContent.replace(/ · TAKEN DOWN BY ITS MAKER.*$/, ''); } }) : null,
      x.status === 'deleted' ? el('button', { type: 'button', class: 'on', text: 'BRING BACK', onclick: () => act(x.id, 'restore', card) }) : null,
      x.status !== 'shown' && x.status !== 'deleted' ? el('button', { type: 'button', class: 'on', text: x.kind === 'message' ? 'PRINT' : 'SHOW', onclick: () => act(x.id, 'show', card) }) : null,
      x.status !== 'refused' && x.status !== 'deleted' ? el('button', { type: 'button', text: 'REFUSE', onclick: () => act(x.id, 'refuse', card) }) : null,
      x.status === 'deleted' ? el('button', { type: 'button', class: 'no', text: 'DELETE FOR GOOD', onclick: () => act(x.id, 'purge', card) }) : el('button', { type: 'button', class: 'no', text: 'ARCHIVE', onclick: () => act(x.id, 'delete', card) }),
      x.photo ? el('button', { type: 'button', text: 'PHOTO ↓', onclick: async () => { const r = await api('photos/' + x.id); const a = el('a', { href: URL.createObjectURL(await r.blob()), download: `novel-global-${x.code}.jpg` }); document.body.append(a); a.click(); a.remove(); } }) : null);
    const img = x.photo ? el('img', { alt: '' }) : null; if (img) photoOf(x.id, img);
    card.append(...(x.kind !== 'story' && x.kind !== 'message' ? [] : [img || el('div')]), el('div', {}, body, acts));
    return card;
  }
  async function stories(st) {
    const r = await api('stories?status=' + st); const { stories: list } = await r.json();
    const clear = st === 'waiting' && list.length ? [el('button', { type: 'button', text: `CLEAR ALL ${list.length} WAITING`, onclick: async () => { if (!confirm(`Refuse and clear all ${list.length} waiting, with their held prints?`)) return; await api('stories/clear', { method: 'POST', body: '{}' }); stories(st); } })] : [];
    const T = { waiting: ['Waiting', 'Everything sent to novel.global waits here until it is shown (and printed, where it was sent to a printer) or refused.'], shown: ['Shown', 'On the map and the board for everyone. Star one to hold it up first.'], refused: ['Refused', 'Kept here, photographs and all, and never shown. Archive one to put it away.'], deleted: ['Archive', 'Everything archived or reset, kept for a year: bring one back to waiting, or delete it for good.'] }[st] || [st, ''];
    let extra = []; if (st === 'deleted') { const gone = (await (await api('places?status=deleted')).json()).places || []; if (gone.length) extra = [el('h3', { class: 'lbl', text: `ARCHIVED PLACES · ${gone.length}` }), ...gone.map(p => el('article', { class: 'card' }, el('div', {}, el('b', { text: p.n }), el('p', { class: 'note', text: [p.cat, p.what, `${p.lat}, ${p.lng}`].filter(Boolean).join(' · ') }),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'BRING BACK', onclick: async () => { await api('places/' + p.id, { method: 'POST', body: JSON.stringify({ action: 'restore' }) }); show('deleted'); } }), el('button', { type: 'button', class: 'no', text: 'DELETE FOR GOOD', onclick: async () => { if (!confirm('Delete this place for good?')) return; await api('places/' + p.id, { method: 'POST', body: JSON.stringify({ action: 'purge' }) }); show('deleted'); } })))))]; }
    main.replaceChildren(...head(T[0], T[1]), ...clear, ...(list.length ? list.map(storyCard) : [el('p', { class: 'empty', text: st === 'waiting' ? 'NOTHING WAITING' : 'NONE' })]), ...extra);
  }

  /* ───────── printers: paired with a token shown once; printing with or without approval; a test print ───────── */
  async function setP(id, body) { const r = await api('printers/' + id, { method: 'POST', body: JSON.stringify(body) }); return r.json(); }
  function printerCard(p) {
    const seen = p.seen ? `HEARD ${when(p.seen)}` : 'NOT HEARD YET'; const card = el('section', { class: 'printer' });
    /* TURN OFF shows only while its receiver is listening and says it can: the Pi prints a slip, then shuts down safely */
    const fresh = t => t && Date.now() - t < 2 * 60e3; const canOff = p.paired && /\boff\b/.test(p.can || ''), listening = fresh(p.seen);
    const tok = el('div', { class: 'token', hidden: true });
    card.append(el('h3', { text: p.name || p.id }),
      el('div', { class: 'note', text: `${p.id.toUpperCase()} · ${p.paper} MM · ${p.paired ? 'PAIRED' : 'NOT PAIRED'} · ${seen} · ${p.held} WAITING APPROVAL · ${p.queued} IN QUEUE · ${p.printed} PRINTED · ${p.failed} FAILED` }),
      /* how it is, at a glance: each part ✓ or ✗, and the last slip sent here with what became of it */
      (() => { let L = null; try { L = p.last ? JSON.parse(p.last) : null; } catch (e) { /* none */ } const ok = b => b ? '✓' : '✗';
        const pi = `${ok(fresh(p.seen))} PI ${p.seen ? 'HEARD ' + when(p.seen) : 'NEVER HEARD'}`;
        const scr = p.touch ? `${ok(fresh(p.touch_seen))} SCREEN ${p.touch_seen ? 'ASKED ' + when(p.touch_seen) : 'NEVER ASKED (its three lines, or its site?)'}` : '· NO SCREEN';
        const mesh = `${p.mesh ? '✓ MESH ON' : '· MESH OFF'}`;
        const last = L ? `LAST SLIP ${L.code || ''} ${String(L.status).toUpperCase()} ${when(L.at)}${L.paper ? '' : ' (RADIO ONLY)'}${L.mesh ? ' · WITH A MESH LINE' : ''}${L.error ? ' · ' + L.error : ''}` : '✗ NO SLIP HAS BEEN SENT TO THIS PRINTER';
        const hint = !L ? 'Pieces go to the printer chosen on the site; make one on this site and print it here.' : L.status === 'held' ? (p.touch ? 'Waiting for a press on the touch screen.' : 'Waiting for approval below.') : L.status === 'queued' ? (fresh(p.seen) ? 'The Pi will take it in a moment.' : 'Waiting for the Pi to ask.') : L.status === 'failed' ? 'The Pi could not print it: see the error (printd answered 500 means the printer is off or unplugged).' : '';
        let R = null; try { R = p.refused ? JSON.parse(p.refused) : null; } catch (e) { /* none */ } const ref = R && (!L || R.at > L.at) ? `  ·  ✗ LAST SEND REFUSED ${when(R.at)}: ${R.why}` : '';
        return el('div', { class: 'note', text: `${pi}  ·  ${scr}  ·  ${mesh}  ·  ${last}${ref}${hint ? '  —  ' + hint : ''}` }); })(),
      /* the Wi-Fi each is on, as each last said: the same, or not; and how strong */
      (() => { const J = v => { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } }; const a = J(p.net), b = J(p.touch_net); if (!a && !b) return null;
        const bars = r => (r == null ? '' : r > -60 ? ' STRONG' : r > -70 ? ' GOOD' : r > -78 ? ' WEAK' : ' TOO WEAK'); const one = (who, x) => (x ? `${who} ON ${x.n} (${x.rssi} dBm${bars(x.rssi)})${x.ip ? ' AT ' + x.ip : ''} ${when(x.at)}` : `${who} HAS NOT SAID`);
        const same = a && b ? (a.n === b.n ? '✓ THE SAME WI-FI' : '✗ NOT THE SAME WI-FI: SET THE SCREEN (HOLD BOOT 3 S) OR THE PI (CHANGE WI-FI) TO ONE BOTH REACH') : '';
        return el('div', { class: 'note', text: [one('PI', a), p.touch ? one('SCREEN', b) : '', same].filter(Boolean).join('  ·  ') }); })(),
      el('div', { class: 'acts' },
        el('button', { type: 'button', text: p.paired ? 'NEW TOKEN' : 'PAIR A PRINTER', onclick: async () => { if (p.paired && !confirm('A new token stops the old one working. Go on?')) return; const j = await setP(p.id, { action: 'token' }); tok.hidden = false; tok.textContent = `This token shows once. Put it on the receiver, in /etc/da-pull.env:\n\nDA_SERVER=${location.origin}\nDA_PRINTER=${p.id}\nDA_TOKEN=${j.token}`; } }),
        p.paired ? el('button', { type: 'button', class: 'no', text: 'UNPAIR', onclick: async () => { await setP(p.id, { action: 'unpair' }); show('printers'); } }) : null,
        el('button', { type: 'button', class: p.auto ? 'on' : '', text: p.auto ? 'PRINTS WITHOUT APPROVAL' : 'PRINTS AFTER APPROVAL', onclick: async () => { await setP(p.id, { action: 'auto', on: !p.auto }); show('printers'); } }),
        el('button', { type: 'button', class: p.mesh ? 'on' : '', text: p.mesh ? 'MESH ON' : 'MESH OFF', onclick: async () => { await setP(p.id, { action: 'mesh', on: !p.mesh }); show('printers'); } }),
        /* a small touch screen beside the printer: every slip waits on it; one press of the jellyfish prints, a long press squashes it */
        el('button', { type: 'button', class: p.touch ? 'on' : '', text: p.touch ? 'TOUCH SCREEN ON' : 'TOUCH SCREEN OFF', onclick: async () => {
          if (p.touch) { if (!confirm('Turn the touch screen off? Slips go back to approval here.')) return; await setP(p.id, { action: 'touch', on: false }); show('printers'); return; }
          const j = await setP(p.id, { action: 'touch', on: true }); tok.hidden = false;
          tok.textContent = `This touch token shows once. Put these three lines in the screen's sketch (novel-touch.ino), then upload it:\n\n#define NG_HOST    "${location.host}"\n#define NG_PRINTER "${p.id}"\n#define NG_TOKEN   "${j.token}"\n\nEvery slip for this printer now waits on the screen. One press of the jellyfish prints it; a long press squashes it.`; } }),
        /* the printer's icon on the map: online when switched on here, or while its Pi is listening */
        el('button', { type: 'button', class: p.live ? 'on' : '', text: p.live ? 'ONLINE ON THE MAP' : 'NOT YET ONLINE ON THE MAP', onclick: async () => { await setP(p.id, { action: 'live', on: !p.live }); show('printers'); } }),
        el('button', { type: 'button', text: `PAPER ${p.paper === '80' ? '58' : '80'} MM`, onclick: async () => { await setP(p.id, { action: 'paper', paper: p.paper === '80' ? '58' : '80' }); show('printers'); } }),
        p.paired && /\bwifi\b/.test(p.can || '') ? el('button', { type: 'button', text: fresh(p.wifi) ? 'OPENING ITS WI-FI SETUP' : 'CHANGE WI-FI', onclick: async () => { if (!confirm('Open this printer\'s Wi-Fi setup? It leaves its Wi-Fi, prints its setup slip with a code to scan, and waits ten minutes for a phone to choose another.')) return; await setP(p.id, { action: 'wifi' }); show('printers'); } }) : null,
        p.paired ? el('button', { type: 'button', text: 'TEST PRINT', onclick: async () => { await setP(p.id, { action: 'test' }); show('printers'); } }) : null,
        canOff && !listening ? el('button', { type: 'button', disabled: true, text: 'OFF OR OUT OF WI-FI' }) : null,
        canOff && listening ? el('button', { type: 'button', class: 'no', text: fresh(p.off) ? 'TURNING OFF' : 'TURN OFF', onclick: async () => { if (!confirm('Turn this printer off? It prints a slip, then shuts down. Unplug it once its green light stops.')) return; await setP(p.id, { action: 'off' }); show('printers'); } }) : null),
      tok);
    return card;
  }
  /* ───────── tracks: LIVING, the lives, stays on the map for every visitor, unless unlocked here ───────── */
  async function stations() {
    const r = await api('settings'); const st = await r.json(); const card = el('section', { class: 'printer' });
    card.append(el('h3', { text: 'LIVING' }), el('div', { class: 'note', text: st.lifeLock ? 'ALWAYS ON THE MAP FOR EVERY VISITOR. THEY CAN MUTE IT.' : 'UNLOCKED: VISITORS CAN TAKE IT OFF THE MAP.' }),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: st.lifeLock ? 'on' : '', text: st.lifeLock ? 'LOCKED ON' : 'UNLOCKED', onclick: async () => { await api('settings', { method: 'POST', body: JSON.stringify({ lifeLock: !st.lifeLock }) }); show('stations'); } })));
    /* BOARD 00, the example: as everyone sees it, or open to rewriting in the W.I.S.H. tab and sending here */
    const ex = el('section', { class: 'printer' }); ex.append(el('h3', { text: 'BOARD 00 · THE EXAMPLE' }), el('div', { class: 'note', text: st.exampleEdit ? 'OPEN TO EDITING: CHANGE IT IN W.I.S.H. → BOARD 00, PRESS SEND, THEN SHOW IT HERE UNDER WAITING.' : 'LOCKED: EVERY VISITOR SEES IT AS IT IS.' }),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: st.exampleEdit ? 'on' : '', text: st.exampleEdit ? 'EDITING ON' : 'LOCKED', onclick: async () => { await api('settings', { method: 'POST', body: JSON.stringify({ exampleEdit: !st.exampleEdit }) }); show('stations'); } })));
    /* the first board's template: its words, a note to a paragraph, its title on its first line; empty, the site's own */
    const own = ((window.DA_CONFIG || {}).TEMPLATE || []).map(([, t, d]) => `${t}\n${d}`).join('\n\n');
    const ta = el('textarea', { class: 'body', maxlength: 6000, spellcheck: 'true', 'aria-label': 'The first board, in words' }); ta.value = st.template || own;
    const tp = el('section', { class: 'printer ed' }); tp.append(el('h3', { text: 'BOARD 01 · THE TEMPLATE' }),
      el('div', { class: 'note', text: `EVERY NEW VISITOR'S FIRST BOARD: A BOX FOR EACH OF W, I, S AND H, AND A NOTE ON EACH TOOL. A BLANK LINE BETWEEN NOTES; A NOTE'S FIRST LINE IS ITS TITLE, AND ITS TITLE HOLDS ITS KEY (W, I, S, H, HOW, NOTE, SECT, LINK, IMG, ZOOM, LOCK, OUT). ${st.template ? 'REWRITTEN HERE.' : "THE SITE'S OWN WORDS."}` }), ta,
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'SAVE', onclick: async () => { await api('settings', { method: 'POST', body: JSON.stringify({ template: ta.value.trim() === own.trim() ? '' : ta.value }) }); show('stations'); } }),
        el('button', { type: 'button', text: "THE SITE'S OWN WORDS", onclick: async () => { if (!confirm("Go back to the site's own words for the template?")) return; await api('settings', { method: 'POST', body: JSON.stringify({ template: '' }) }); show('stations'); } })));
    main.replaceChildren(...head('Words and boards', 'The living layer, BOARD 00 and the first board, the words on INTENTION and W.I.S.H., and the cities to make in.'), card, ex, tp, wordsCard(st), citiesCard(st));
  }
  /* ───────── places (stage 5): the listed places beyond the ones written into the site. Suggestions from visitors wait here, to show
     or refuse; places shown can be changed or deleted; a new one can be added, shown at once ───────── */
  const PCATS = [['service', 'SERVICE'], ['circular', 'CIRCULAR · REPAIR, REUSE, REFILL'], ['brand', 'BRAND'], ['artists', 'ARTISTS'], ['third', 'THIRD SPACE'], ['network', 'NETWORK']];
  function placeForm(p, done) {
    const f = {}; const row = (k, label, attrs = {}) => { f[k] = el('input', { type: 'text', 'aria-label': label, placeholder: label, ...attrs }); f[k].value = p && p[k] != null ? String(p[k]) : ''; return f[k]; };
    const cat = el('select', { 'aria-label': 'Kind of place' }, ...PCATS.map(([v, t]) => el('option', { value: v, text: t }))); cat.value = (p && p.cat) || 'service';
    const form = el('form', { class: 'pform', onsubmit: async e => { e.preventDefault(); const o = { cat: cat.value }; for (const k of Object.keys(f)) o[k] = f[k].value.trim();
        if (!o.n || !Number.isFinite(+o.lat) || !Number.isFinite(+o.lng)) { alert('A name, and its latitude and longitude, are needed.'); return; } await done(o); } },
      row('n', 'NAME', { maxlength: 80, required: true }), cat, row('what', 'WHAT IT DOES, IN A LINE', { maxlength: 200 }), row('addr', 'ADDRESS', { maxlength: 120 }), row('sub', 'SUBURB', { maxlength: 60 }),
      row('url', 'ITS OWN SITE (https://…)', { maxlength: 300 }), row('lat', 'LATITUDE, e.g. -37.7718', { inputmode: 'decimal' }), row('lng', 'LONGITUDE, e.g. 144.9782', { inputmode: 'decimal' }), row('role', 'ROLE (one word, optional)', { maxlength: 20 }),
      el('div', { class: 'acts' }, el('button', { type: 'submit', class: 'on', text: p ? 'SAVE' : 'ADD AND SHOW' })));
    return form;
  }
  async function places() {
    const get = async st => (await (await api('places?status=' + st)).json()).places || [];
    const [wait, shown] = await Promise.all([get('waiting'), get('shown')]);
    const post = async (path, o) => { await api(path, { method: 'POST', body: JSON.stringify(o) }); show('places'); };
    const add = el('section', { class: 'printer ed' }); add.append(el('h3', { text: 'ADD A PLACE' }), el('div', { class: 'note', text: 'SHOWN AT ONCE ON NOVEL.GLOBAL: ON THE MAP, IN SEARCH AND ON THE RADAR, BESIDE THE PLACES ALREADY WRITTEN INTO THE SITE. RIGHT-CLICK A SPOT IN A MAP APP TO COPY ITS LATITUDE AND LONGITUDE.' }), placeForm(null, o => post('places', o)));
    const card = (p, waiting) => { const c = el('article', { class: 'card' }); const ed = el('div', { hidden: true });
      c.append(el('b', { text: p.n }), el('p', { text: [p.cat.toUpperCase(), p.what, [p.addr, p.sub].filter(Boolean).join(', '), `${p.lat}, ${p.lng}`].filter(Boolean).join(' · ') }),
        p.url ? el('p', { class: 'note', text: p.url }) : null, el('p', { class: 'note', text: (p.src === 'suggested' ? 'SUGGESTED ' : 'ADDED ') + when(p.created) }),
        el('div', { class: 'acts' }, ...(waiting ? [el('button', { type: 'button', class: 'on', text: 'SHOW', onclick: () => post('places/' + p.id, { action: 'show' }) }), el('button', { type: 'button', class: 'no', text: 'REFUSE', onclick: () => post('places/' + p.id, { action: 'refuse' }) })] : []),
          el('button', { type: 'button', text: 'CHANGE', onclick: () => { ed.hidden = !ed.hidden; } }),
          el('button', { type: 'button', class: 'no', text: 'ARCHIVE', onclick: () => post('places/' + p.id, { action: 'delete' }) })), ed);
      ed.append(placeForm(p, o => post('places/' + p.id, { action: 'edit', ...o }))); return c; };
    main.replaceChildren(...head('Places', 'The places of the human ecology beyond those written into the site: suggested by visitors, or added here. Shown ones are on the map, in search and on the radar for everyone.'), el('h3', { class: 'lbl', text: `SUGGESTED, WAITING · ${wait.length}` }), ...(wait.length ? wait.map(p => card(p, true)) : [el('p', { class: 'empty', text: 'NONE WAITING' })]),
      add, el('h3', { class: 'lbl', text: `SHOWN · ${shown.length}` }), ...shown.map(p => card(p, false)));
  }
  /* INTENTION and W.I.S.H. on the aura (/): every heading, line and hover, and the one quick word shown first. Each field holds the site's
     own words until changed; only the words changed are kept, and an emptied field goes back to the site's own */
  const WORD_LABELS = [['intention.tab', 'INTENTION · ITS QUICK WORD'], ['intention.ask', 'INTENTION · THE QUESTION ON ITS LINE'], ['intention.say', 'INTENTION · THE LINE THAT COMES AND GOES'],
    ['wish.tab', 'W.I.S.H. · ITS QUICK WORD'], ['wish.say', 'W.I.S.H. · THE LINE THAT COMES AND GOES'],
    ...['w', 'i', 's', 'h'].flatMap(l => [[`${l}.word`, `${l.toUpperCase()} · ITS QUICK WORD`], [`${l}.head`, `${l.toUpperCase()} · ITS HEADING (ON HOVER)`], [`${l}.how`, `${l.toUpperCase()} · WHAT GOES ON ITS LINE (ON HOVER)`]])];
  /* cities and data packs: another place to make in, written plainly; the aura reads them, a chip each in its intel */
  const CITY_EG = '# Sydney\ncentre, -33.8688, 151.2093\nPaddington Reservoir Gardens, -33.8843, 151.2262\nThe Rocks, -33.8599, 151.2090';
  function citiesCard(st) {
    const ta = el('textarea', { class: 'body', maxlength: 40000, spellcheck: 'false', 'aria-label': 'Cities and their places', placeholder: CITY_EG }); ta.value = st.cities || '';
    const n = (st.cities || '').split(/\n/).filter(l => /^#/.test(l.trim())).length;
    const sec = el('section', { class: 'printer ed' }); sec.append(el('h3', { text: 'CITIES AND DATA PACKS' }),
      el('div', { class: 'note', text: `NEW PLACES TO MAKE IN. A LINE STARTING WITH # NAMES A CITY; "centre, lat, lng" PUTS IT ON THE MAP; EVERY OTHER LINE IS ONE OF ITS PLACES: NAME, LAT, LNG. EACH CITY BECOMES A CHIP IN THE INTEL ON NOVEL.GLOBAL, ITS PLACES FOUND BY SEARCH, SHOWN ON THE MAP, NEAR WHOEVER STANDS THERE AND IN THEIR SONGS. ${n ? `${n} ${n === 1 ? 'CITY' : 'CITIES'} NOW.` : 'NONE YET.'}` }), ta,
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'SAVE', onclick: async () => { await api('settings', { method: 'POST', body: JSON.stringify({ cities: ta.value.trim() }) }); show('stations'); } }),
        el('button', { type: 'button', text: 'NONE', onclick: async () => { if (!confirm('Take every city off?')) return; await api('settings', { method: 'POST', body: JSON.stringify({ cities: '' }) }); show('stations'); } })));
    return sec;
  }
  function wordsCard(st) {
    const own = (window.DA_CONFIG || {}).WORDS || {}; let saved = {}; try { saved = st.words ? JSON.parse(st.words) : {}; } catch (e) { saved = {}; }
    const fields = WORD_LABELS.map(([k, label]) => { const inp = el('input', { type: 'text', maxlength: 240, spellcheck: 'true', placeholder: own[k] || '' }); inp.value = saved[k] || own[k] || ''; inp.dataset.k = k; return el('label', { text: label }, inp); });
    const changed = Object.keys(saved).filter(k => saved[k] && saved[k] !== own[k]).length;
    const sec = el('section', { class: 'printer ed' }); sec.append(el('h3', { text: 'INTENTION AND W.I.S.H. · THE WORDS' }),
      el('div', { class: 'note', text: `THE HEADINGS, LINES AND HOVERS ON THE FIRST TWO STEPS OF NOVEL.GLOBAL, AND THE ONE WORD SHOWN FIRST UNDER EACH. ${changed ? `${changed} REWRITTEN HERE.` : "THE SITE'S OWN WORDS."} SAVED WORDS REACH VISITORS THE NEXT TIME THEY OPEN THE SITE.` }), ...fields,
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'SAVE', onclick: async () => { const out = {}; fields.forEach(f => { const i = f.querySelector('input'), v = i.value.trim(); if (v && v !== own[i.dataset.k]) out[i.dataset.k] = v; });
        await api('settings', { method: 'POST', body: JSON.stringify({ words: Object.keys(out).length ? JSON.stringify(out) : '' }) }); show('stations'); } }),
        el('button', { type: 'button', text: "THE SITE'S OWN WORDS", onclick: async () => { if (!confirm("Go back to the site's own words for INTENTION and W.I.S.H.?")) return; await api('settings', { method: 'POST', body: JSON.stringify({ words: '' }) }); show('stations'); } })));
    return sec;
  }
  async function printers() { const r = await api('printers'); const { printers: list } = await r.json(); main.replaceChildren(...head('Printers', 'Each partner place and novel.global itself: paired with a token shown once, printing with or without approval, its touch screen and its radio.'), ...list.map(printerCard)); }

  /* ───────── the portfolio: posts written here, kept as drafts until published; a cover, a category, links ───────── */
  async function coverOf(id, img) { try { const r = await api(`posts/${id}/cover`); img.src = URL.createObjectURL(await r.blob()); } catch (e) { /* none */ } }
  async function posts() {
    const r = await api('posts'); const { posts: list } = await r.json();
    const rows = list.map(x => { const img = x.cover ? el('img', { alt: '' }) : el('span', { class: 'ph' }); if (x.cover) coverOf(x.id, img);
      return el('div', { class: 'post-row' }, img, el('div', {}, el('b', { text: x.title }), el('span', { class: 'note', text: `${{ published: 'PUBLISHED', deleted: 'ARCHIVED' }[x.status] || 'DRAFT'} · ${x.cat || 'WORK'} · ${x.day || ''} · /portfolio.html#${x.slug}` })),
        el('button', { type: 'button', text: 'EDIT', onclick: () => editor(x.id) })); });
    main.replaceChildren(...head('Portfolio', 'Posts for novel.global/portfolio.html, kept as drafts until published, each in one of the twelve curations named in SETTINGS.'), el('div', { class: 'acts', style: 'margin:0 0 12px' }, el('button', { type: 'button', class: 'on', text: 'NEW POST', onclick: () => editor(null) }), el('a', { href: 'portfolio.html', target: '_blank', rel: 'noopener', class: 'note', text: 'THE PORTFOLIO ↗' })),
      ...(rows.length ? rows : [el('p', { class: 'empty', text: 'NO POSTS YET' })]));
  }
  /* a cover chosen on this device: made smaller and re-encoded here, which also drops its location and camera details */
  const shrink = file => new Promise((res, rej) => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); let q = 0.82, u = c.toDataURL('image/jpeg', q); while (u.length > 400e3 && q > 0.4) { q -= 0.08; u = c.toDataURL('image/jpeg', q); } while (u.length > 400e3 && c.width > 320) { const t = document.createElement('canvas'); t.width = Math.round(c.width * 0.8); t.height = Math.round(c.height * 0.8); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); c.width = t.width; c.height = t.height; c.getContext('2d').drawImage(t, 0, 0); u = c.toDataURL('image/jpeg', 0.7); } URL.revokeObjectURL(im.src); res(u); }; im.onerror = rej; im.src = URL.createObjectURL(file); });
  async function editor(id) {
    const x = id ? (await (await api('posts/' + id)).json()).post : { title: '', summary: '', body: '', cat: '', links: [], day: new Date().toISOString().slice(0, 10), status: 'draft' };
    let cover; const cv = el('img', { class: 'cv', alt: '' }); if (id && x.cover) coverOf(id, cv);
    const f = (n, tag = 'input', attrs = {}) => el(tag, { name: n, ...attrs });
    const title = f('title', 'input', { maxlength: 140, required: true }); title.value = x.title;
    const cat = f('cat', 'input', { maxlength: 40, placeholder: 'ONE OF THE TWELVE CURATIONS', list: 'cur-list' }); cat.value = x.cat || '';
    const curs = await curationsOf(); const dl = el('datalist', { id: 'cur-list' }, ...curs.filter(c => c.name).map(c => el('option', { value: c.name })));
    const day = f('day', 'input', { type: 'date' }); day.value = x.day || '';
    const sum = f('summary', 'textarea', { rows: 2, maxlength: 400 }); sum.value = x.summary || '';
    const body = f('body', 'textarea', { class: 'body', maxlength: 40000, placeholder: 'Paragraphs between blank lines. A line starting ## is a heading.' }); body.value = x.body || '';
    const links = f('links', 'textarea', { rows: 3, placeholder: 'https://… one a line' }); links.value = (x.links || []).join('\n');
    const pick = f('cover', 'input', { type: 'file', accept: 'image/*' }); pick.addEventListener('change', async () => { const fl = pick.files[0]; if (!fl) return; cover = await shrink(fl); cv.src = URL.createObjectURL(fl); });
    const note = el('span', { class: 'note' });
    const save = async status => {
      if (!title.value.trim()) { title.focus(); return; }
      note.textContent = 'SAVING…';
      let j; try { const r = await api('posts', { method: 'POST', body: JSON.stringify({ id: id || undefined, title: title.value, cat: cat.value, day: day.value, summary: sum.value, body: body.value, links: links.value.split('\n').map(s => s.trim()).filter(Boolean), status, ...(cover ? { cover } : {}) }) }); j = await r.json(); }
      catch (e) { if (e.message !== 'locked') note.textContent = `NOT SAVED · ${e.message === '413' ? 'TOO LARGE: A SMALLER COVER' : e.message === '400' ? 'THE COVER COULD NOT BE READ: TRY ANOTHER' : `THE SERVER SAID ${e.message}`}`; return null; }
      id = j.id; if (status !== 'published') { note.textContent = 'SAVED AS A DRAFT'; return j; }
      /* published: checked against what everyone is served, so the word on the page is the truth */
      const live = await fetch('/api/posts', { cache: 'no-store' }).then(r => r.json()).then(x => (x.posts || []).some(q => q.slug === j.slug)).catch(() => false);
      note.textContent = live ? `PUBLISHED · LIVE AT /portfolio.html#${j.slug}` : 'SAVED, BUT NOT YET LISTED FOR EVERYONE: PRESS PUBLISH AGAIN'; return j;
    };
    main.replaceChildren(el('form', { class: 'ed', onsubmit: e => e.preventDefault() },
      el('label', {}, 'TITLE', title), el('div', { class: 'two' }, el('label', {}, 'CURATION', cat, dl), el('label', {}, 'DATE', day)),
      el('label', {}, 'SUMMARY', sum), el('label', {}, 'BODY', body), el('label', {}, 'LINKS', links),
      el('label', {}, 'COVER', cv, pick),
      el('div', { class: 'acts' },
        el('button', { type: 'button', text: 'SAVE DRAFT', onclick: () => save('draft') }),
        el('button', { type: 'button', class: 'on', text: x.status === 'published' ? 'UPDATE' : 'PUBLISH', onclick: () => save('published') }),
        x.status === 'published' ? el('button', { type: 'button', text: 'UNPUBLISH', onclick: () => save('draft') }) : null,
        el('button', { type: 'button', text: 'PREVIEW', onclick: async () => { await save(x.status === 'published' ? 'published' : 'draft'); window.open(`portfolio.html?preview=${encodeURIComponent(id)}`, '_blank'); } }),
        id ? el('button', { type: 'button', class: 'no', text: 'ARCHIVE', onclick: async () => { if (!confirm('Archive this post? It comes off the portfolio and stays here as ARCHIVED.')) return; await api('posts/' + id, { method: 'POST', body: JSON.stringify({ action: 'delete' }) }); show('posts'); } }) : null,
        el('button', { type: 'button', text: 'BACK', onclick: () => show('posts') }), note)));
  }

  /* ───────── the overview: what waits, what is on, what happened today and this week ───────── */
  const TRAFFIC = { 'open-aura': 'novel.global opened', 'open-studio': 'studio opened', 'open-portfolio': 'portfolio opened', begin: 'pieces begun', print: 'prints pressed', wall: 'hung on the wall', song: 'songs kept', device: 'devices opened', 'stories:sent': 'stories sent', stories: 'stories read', 'places:sent': 'places suggested', places: 'places read', inat: 'iNaturalist asked', osm: 'OpenStreetMap asked', img: 'photographs passed', posts: 'portfolio read', receipts: 'prints followed' };
  /* the overview, as a dashboard: dark glass, thin lines, readouts in brackets, gauges, a two-week trace; it refreshes itself every
     half minute while open, and a snapshot of it can be saved */
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = (tag, a) => { const e = document.createElementNS(svgNS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); return e; };
  function gauge(parts, label) {   // a ring, each part an arc in its own shade; the total in its middle
    const tot = parts.reduce((a, p) => a + (p[0] || 0), 0), g = svg('svg', { viewBox: '0 0 120 120', class: 'gauge' }); let at = -90;
    g.append(svg('circle', { cx: 60, cy: 60, r: 46, fill: 'none', stroke: 'rgba(127,227,211,.12)', 'stroke-width': 8 }));
    parts.forEach(([n, col]) => { if (!n || !tot) return; const a0 = at * Math.PI / 180, a1 = (at + 360 * n / tot - 1.5) * Math.PI / 180, big = n / tot > 0.5 ? 1 : 0;
      g.append(svg('path', { d: `M${60 + 46 * Math.cos(a0)} ${60 + 46 * Math.sin(a0)} A46 46 0 ${big} 1 ${60 + 46 * Math.cos(a1)} ${60 + 46 * Math.sin(a1)}`, fill: 'none', stroke: col, 'stroke-width': 8 })); at += 360 * n / tot; });
    const t = svg('text', { x: 60, y: 58, 'text-anchor': 'middle', class: 'gn' }); t.textContent = String(tot); const l = svg('text', { x: 60, y: 76, 'text-anchor': 'middle', class: 'gl' }); l.textContent = label; g.append(t, l); return g;
  }
  function trace(vals, w = 520, h = 90) {   // the days as a line, newest at the right, each day a tick
    const g = svg('svg', { viewBox: `0 0 ${w} ${h}`, class: 'trace', preserveAspectRatio: 'none' }), top = Math.max(1, ...vals), n = vals.length;
    for (let i = 0; i <= 4; i++) g.append(svg('line', { x1: 0, x2: w, y1: (h - 8) * i / 4 + 4, y2: (h - 8) * i / 4 + 4, stroke: 'rgba(127,227,211,.08)' }));
    const pts = vals.map((v, i) => [n < 2 ? w / 2 : i * (w - 8) / (n - 1) + 4, h - 4 - (h - 8) * v / top]);
    if (pts.length) { g.append(svg('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#7FE3D3', 'stroke-width': 1.5 })); pts.forEach(p => g.append(svg('circle', { cx: p[0], cy: p[1], r: 2, fill: '#7FE3D3' }))); }
    return g;
  }
  let ovT = null;
  async function overview() {
    clearTimeout(ovT);
    const o = await (await api('overview')).json(); const tr = (await (await api('traffic')).json()).traffic || [];
    if (tab !== 'overview') return;
    const S = o.stories, Pl = o.places, Po = o.posts, J = o.jobs, fresh = t => t && Date.now() - t < 2 * 60e3;
    const read = (n, label, to, hot) => el('button', { type: 'button', class: 'rd' + (hot && n ? ' hot' : ''), onclick: () => to && show(to) }, el('b', { text: String(n || 0).padStart(3, '0') }), el('span', { text: label }));
    const days = [...new Set(tr.map(r => r.day))].sort().slice(-14), per = (d, re) => tr.filter(r => r.day === d && re.test(r.k)).reduce((a, r) => a + r.n, 0);
    const keys = Object.keys(TRAFFIC).filter(k => o.week[k] || o.today[k]), top = Math.max(1, ...keys.map(k => o.week[k] || 0));
    const hud = el('section', { class: 'hud' },
      el('header', {}, el('b', { text: 'NOVEL.GLOBAL // STATUS' }), el('span', { text: 'SYNC ' + new Date(o.at).toLocaleTimeString('en-AU') }),
        el('button', { type: 'button', text: 'SAVE SNAPSHOT', onclick: () => { const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify({ ...o, traffic: tr }, null, 1)], { type: 'application/json' })), download: `novel-global-status-${new Date().toISOString().slice(0, 16).replace(':', '')}.json` }); document.body.append(a); a.click(); a.remove(); } })),
      el('div', { class: 'row' },
        el('div', { class: 'cell g' }, gauge([[S.waiting, '#E25C40'], [S.shown, '#7FE3D3'], [S.refused, '#5F6B7A'], [S.deleted, '#2A3542']], 'SENT')),
        el('div', { class: 'cell g' }, gauge([[Pl.waiting, '#E25C40'], [Pl.shown, '#7FE3D3'], [Pl.deleted, '#2A3542']], 'PLACES')),
        el('div', { class: 'cell g' }, gauge([[J.printed, '#7FE3D3'], [(J.queued || 0) + (J.held || 0), '#F2C14E'], [J.failed, '#E25C40']], 'PRINTS 7D')),
        el('div', { class: 'cell rds' }, read(S.waiting, 'WAITING', 'waiting', 1), read(Pl.waiting, 'PLACES IN', 'places', 1), read((J.queued || 0) + (J.held || 0), 'IN A QUEUE', 'printers', 1), read(J.failed, 'FAILED 7D', 'printers', 1), read(Po.published, 'POSTS LIVE', 'posts'), read(S.deleted, 'ARCHIVED', 'deleted'))),
      el('div', { class: 'cell' }, el('i', { class: 'cap', text: 'VISITS · 14 DAYS' }), trace(days.map(d => per(d, /^open-/))), el('div', { class: 'ticks' }, ...days.map(d => el('span', { text: d.slice(8) })))),
      el('div', { class: 'row' },
        el('div', { class: 'cell' }, el('i', { class: 'cap', text: 'UNITS' }), ...o.printers.map(p => el('div', { class: 'unit' + (fresh(p.seen) ? ' live' : '') }, el('i', { class: 'led' }), el('b', { text: (p.name || p.id).toUpperCase() }),
          el('span', { text: [p.paired ? 'PAIRED' : 'UNPAIRED', p.seen ? (fresh(p.seen) ? 'LISTENING' : 'LAST ' + when(p.seen)) : 'NEVER HEARD', p.mesh ? 'MESH' : '', p.touch ? 'SCREEN' : ''].filter(Boolean).join(' · ') })))),
        el('div', { class: 'cell' }, el('i', { class: 'cap', text: 'ACTIVITY · TODAY / 7 DAYS' }), ...(keys.length ? keys.map(k => el('div', { class: 'act' }, el('span', { text: TRAFFIC[k].toUpperCase() }), el('i', { class: 'bar', style: `width:${Math.round(100 * (o.week[k] || 0) / top)}%` }), el('b', { text: `${o.today[k] || 0} / ${o.week[k] || 0}` }))) : [el('span', { class: 'cap', text: 'NOTHING COUNTED YET' })]))));
    main.replaceChildren(...head('Overview', 'Counts of things, never of people.'), hud);
    ovT = setTimeout(() => { if (tab === 'overview') overview().catch(() => {}); }, 30000);
  }


  /* ───────── settings: how the devices are earned, the aura's motion, the phreak, the twelve curations, and going back to base ───────── */
  async function curationsOf() { try { const st = await (await api('settings')).json(); const c = st.curations ? JSON.parse(st.curations) : []; return Array.from({ length: 12 }, (_, i) => c[i] || { name: '', about: '' }); } catch (e) { return Array.from({ length: 12 }, () => ({ name: '', about: '' })); } }
  async function site() {
    const st = await (await api('settings')).json(); let g = {}; try { g = st.gates ? JSON.parse(st.gates) : {}; } catch (e) { g = {}; }
    const save = async o => { await api('settings', { method: 'POST', body: JSON.stringify(o) }); show('site'); };
    /* each setting says, in plain words, what it changes, what to type, and what a visitor then sees */
    const hint = t => el('small', { class: 'hint', text: t });
    /* the devices, like a game: earned one a poster (as set), all open, or all closed */
    /* seven devices, each earned on its own: 0 is open from the start */
    const mode = el('select', {}, ...[['earn', 'EARNED: EACH AFTER ITS OWN NUMBER OF POSTERS'], ['open', 'OPEN: ALL FROM THE START'], ['closed', 'CLOSED: ONLY THOSE SET TO 0']].map(([v, t]) => el('option', { value: v, text: t }))); mode.value = g.mode || 'earn';
    const DEVS7 = [['music', 'MUSIC (THE SOUND KEY)', 0, 'The round sound key, top right of the first screen. Plays the music and the desk.'], ['intention', 'INTENTION AND W.I.S.H.', 0, 'Writing what was noticed and the four W.I.S.H. lines.'],
      ['print', 'ART AND PRINT', 0, 'Making the poster (stickers, photos, pixel art) and printing it.'], ['radio', 'RADIO (COMPLEX)', 1, 'The full radio in the studio: layers, moods, the map.'], ['wish', 'RESEARCH BOARD', 2, 'The studio board for gathering species, notes and places.'],
      ['design', 'DESIGN (COMPLEX ART)', 3, 'The studio print shop: full poster design.'], ['desk', 'FOUR-TRACK DESK', 4, 'The four-layer sound desk.']];
    const old = Array.isArray(g.at) ? { radio: g.at[0], wish: g.at[1], design: g.at[2] } : (g.at || {});
    const at = DEVS7.map(([k, , d]) => { const n = el('input', { type: 'number', min: 0, max: 50, step: 1 }); n.value = String(old[k] != null ? old[k] : d); n.dataset.k = k; return n; });
    const gates = el('section', { class: 'ed' }, el('h3', { text: 'DEVICES' }),
      hint('Seven parts of the site a visitor can open, like levels in a game. Each number is how many posters a visitor must make before that part opens on their phone: a whole number from 0 to 50, where 0 means open from the very first visit. Saved, it reaches visitors the next time they load the site; a part a visitor already opened stays open for them.'),
      el('label', {}, 'MODE', mode), hint('EARNED: each part opens at its own number. OPEN: all seven show to everyone straight away (the numbers are ignored). CLOSED: only parts set to 0 show, the rest stay hidden for everyone.'),
      el('div', { class: 'three' }, ...DEVS7.map(([, t, , d], i) => el('label', {}, t, at[i], hint(d)))),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'SAVE', onclick: () => save({ gates: JSON.stringify({ mode: mode.value, at: Object.fromEntries(at.map(n => [n.dataset.k, Math.max(0, Math.min(50, Math.round(+n.value || 0)))])) }) }) })));
    /* motion: calm, as built, or chaos; and the phreak, base64 drifting under the stars */
    const fx = el('select', {}, ...[['calm', 'CALM: SLOWER, FEWER PARTICLES'], ['base', 'AS BUILT'], ['chaos', 'CHAOS: FASTER, MORE, RESTLESS']].map(([v, t]) => el('option', { value: v, text: t }))); fx.value = st.fx || 'base';
    const motion = el('section', { class: 'ed' }, el('h3', { text: 'MOTION AND PHREAK' }), el('p', { class: 'note', text: 'HOW THE AURA MOVES FOR EVERY VISITOR. A VISITOR WHO ASKS THEIR DEVICE FOR LESS MOTION ALWAYS GETS STILLNESS. PHREAK: LINES OF BASE64, THE SHAPE A POSTER TRAVELS IN, DRIFT FAINTLY UNDER THE STARS.' }),
      el('label', {}, 'MOTION', fx), hint('CALM: slower, with fewer stars and particles. AS BUILT: as designed. CHAOS: faster, more of them, restless. Applies to every visitor on their next load.'),
      el('label', { class: 'check' }, (() => { const c = el('input', { type: 'checkbox' }); c.checked = !!st.phreak; c.id = 'phreak'; return c; })(), 'BASE64 PHREAK'), hint('Ticked: faint lines of base64 (the text a poster becomes when it travels by mesh radio) drift under the stars. Unticked: none.'),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'SAVE', onclick: () => save({ fx: fx.value, phreak: $('#phreak').checked }) })));
    /* the twelve curations of the portfolio */
    const curs = await curationsOf(); const rows = curs.map((c, i) => { const n = el('input', { type: 'text', maxlength: 40, placeholder: `CURATION ${String(i + 1).padStart(2, '0')}` }), a = el('input', { type: 'text', maxlength: 200, placeholder: 'A LINE ABOUT IT (OPTIONAL)' }); n.value = c.name || ''; a.value = c.about || ''; return [n, a]; });
    const cur = el('section', { class: 'ed' }, el('h3', { text: 'PORTFOLIO · THE TWELVE CURATIONS' }), el('p', { class: 'note', text: 'TWELVE THEMES OR CURATIONS, EACH A TAB ON THE PORTFOLIO. A POST JOINS ONE BY ITS CURATION (CHOSEN WHEN IT IS WRITTEN). ONLY NAMED ONES SHOW.' }),
      hint('NAME: up to 40 characters, the tab\'s title on the portfolio. ABOUT: up to 200 characters, one line under it (leave empty for none). A tab with no name is hidden. Renaming keeps the posts in it. Saved, the portfolio shows it straight away.'),
      ...rows.map(([n, a], i) => el('div', { class: 'two' }, el('label', {}, String(i + 1).padStart(2, '0'), n), el('label', {}, 'ABOUT', a))),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'SAVE', onclick: () => save({ curations: JSON.stringify(rows.map(([n, a]) => ({ name: n.value.trim(), about: a.value.trim() }))) }) })));
    /* back to base: archived (so it can come back), never the printers, their tokens or the password */
    const R = ['stories', 'example', 'places', 'posts', 'words', 'settings', 'traffic'], RL = { stories: 'EVERY STORY, NOTICING AND PACK (TO THE ARCHIVE)', example: 'BOARD 00 BACK TO THE SITE\'S OWN', places: 'EVERY PLACE ADDED OR SUGGESTED (TO THE ARCHIVE)', posts: 'EVERY PUBLISHED POST BACK TO A DRAFT', words: 'THE WORDS, THE TEMPLATE AND THE CITIES BACK TO THE SITE\'S OWN', settings: 'THESE SETTINGS BACK TO AS BUILT', traffic: 'THE COUNTS' };
    const boxes = R.map(k => { const c = el('input', { type: 'checkbox' }); c.dataset.k = k; return el('label', { class: 'check' }, c, RL[k]); });
    const reset = el('section', { class: 'ed' }, el('h3', { text: 'BACK TO THE BASE VERSION' }), el('p', { class: 'note', text: 'CHOOSE WHAT GOES BACK. STORIES AND PLACES GO TO THE ARCHIVE, WHERE THEY CAN BE BROUGHT BACK. THE PRINTERS, THEIR TOKENS AND THE PASSWORD ARE NEVER TOUCHED, SO EVERYTHING KEEPS WORKING.' }), hint('Tick each thing to put back, press RESET WHAT IS TICKED, then type RESET in capitals to confirm. Stories and places move to the Archive section (bring any back from there). Posts become drafts. Words, BOARD 00 and these settings return to how the site was built. The counts start again from zero. What visitors made on their own phones stays with them.'), ...boxes,
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'no', text: 'RESET WHAT IS TICKED', onclick: async () => { const o = {}; boxes.forEach(b => { const c = b.querySelector('input'); if (c.checked) o[c.dataset.k] = true; }); if (!Object.keys(o).length) return; if (prompt('Type RESET to go back to the base version for what is ticked.') !== 'RESET') return; await api('reset', { method: 'POST', body: JSON.stringify(o) }); show('overview'); badges(); } })),
      el('h3', { text: 'THIS BROWSER' }), el('p', { class: 'note', text: 'CLEARS WHAT HAS BEEN MADE IN THIS BROWSER ON NOVEL.GLOBAL: POSTERS ON ITS WALL, THE PIECE BEING MADE, KEPT SONGS, BOARDS AND THE STUDIO\'S POSTERS. NOTHING ON THE SERVER, AND THIS PAGE STAYS OPEN.' }),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'no', text: 'CLEAR THIS BROWSER', onclick: async () => { if (!confirm('Clear everything made in this browser on novel.global?')) return; Object.keys(localStorage).filter(k => /^da\./.test(k)).forEach(k => localStorage.removeItem(k)); await new Promise(r => { try { const q = indexedDB.deleteDatabase('novelglobal'); q.onsuccess = q.onerror = q.onblocked = r; } catch (e) { r(); } }); alert('Cleared. novel.global opens as new in this browser.'); } })));
    /* the start and the booth: the discs' words, the checklist, how a print starts, the booth's timing */
    let so = {}; try { so = st.start ? JSON.parse(st.start) : {}; } catch (e) { so = {}; }
    const chk = (id, on, t) => el('label', { class: 'check' }, (() => { const c = el('input', { type: 'checkbox', id }); c.checked = on; return c; })(), t);
    const pn = el('select', {}, ...[['paper', 'AS THE PAPER: BLUE PRINTS NIGHT, WHITE PRINTS DAY'], ['day', 'ALWAYS DAY: BLACK ON WHITE'], ['night', 'ALWAYS NIGHT: WHITE ON A DARK SHADE']].map(([v, t]) => el('option', { value: v, text: t }))); pn.value = so.printNight || 'paper';
    const num = (v, mn, mx, stp) => { const n = el('input', { type: 'number', min: mn, max: mx, step: stp }); n.value = String(v); return n; };
    const bh = num(so.boothHome != null ? so.boothHome : 10, 1, 60, 0.5), bg = num(so.boothGap != null ? so.boothGap : 10, 0, 240, 1);
    const start = el('section', { class: 'ed' }, el('h3', { text: 'START AND BOOTH' }),
      chk('so-words', so.discWords !== false, 'THE THREE DISCS SAY WHAT THEY DO, ONCE'), hint('Ticked: under the three round buttons on the first screen, their words (Share what you noticed, Make a song, Print a photo) show once, then fade. Unticked: the buttons alone, no words.'),
      chk('so-check', so.checklist !== false, 'THE CHECKLIST BESIDE DAY AND NIGHT'), hint('Ticked: a short list sits top left (Notice, Poster, Print, Song, Photo, and how far the next parts are) and ticks itself as a visitor does each; once all are done it goes for good. Unticked: never shown.'),
      el('label', {}, 'A PRINT STARTS', pn), hint('How a poster first prints on the 80 mm paper. AS THE PAPER: a blue poster prints dark (white on a dark shade), a white poster prints light. ALWAYS DAY: black on white. ALWAYS NIGHT: white on a dark shade. A visitor can still flip it with the moon key before they print.'),
      el('div', { class: 'three' }, el('label', {}, 'BOOTH: THE PASS SHOWS FOR (SECONDS)', bh, hint('After a booth print or save, the pass (the visitor\'s three-character code, with Save your pass) shows this long, then the phone goes to novel.global. 1 to 60, halves allowed. As built: 10.')),
        el('label', {}, 'BOOTH: MINUTES BETWEEN PRINTS FROM ONE PHONE', bg, hint('After printing, the same phone can print again after this many minutes. Until then the print button counts down; save still works. Whole minutes, 0 to 240; 0 means no wait. As built: 10. Counted on each phone, so another phone can print straight away.'))),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'SAVE', onclick: () => save({ start: JSON.stringify({ discWords: $('#so-words').checked, checklist: $('#so-check').checked, printNight: pn.value, boothHome: Math.max(1, Math.min(60, +bh.value || 10)), boothGap: Math.max(0, Math.min(240, Math.round(+bg.value || 0))) }) }) })));
    main.replaceChildren(...head('Settings', 'How novel.global behaves for everyone. Saved settings reach visitors the next time they open the site.'), gates, start, motion, cur, reset);
  }

  /* ───────── data: everything as one file, the places and stories as sheets, places brought in by the hundred ───────── */
  const save = (name, text, type) => { const a = el('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); a.remove(); };
  const csv = (rows, cols) => [cols.join(','), ...rows.map(r => cols.map(c => { const v = r[c] == null ? '' : String(r[c]); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','))].join('\n');
  const PCOLS = ['n', 'cat', 'role', 'what', 'addr', 'sub', 'url', 'lat', 'lng'];
  const parseCSV = t => { const rows = []; let row = [], v = '', q = false; for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"' && t[i + 1] === '"') { v += '"'; i++; } else if (ch === '"') q = false; else v += ch; } else if (ch === '"') q = true; else if (ch === ',') { row.push(v); v = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(v); rows.push(row); row = []; v = ''; } else v += ch; } if (v || row.length) { row.push(v); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
  async function data() {
    const all = async () => (await api('export')).json();
    const dl = el('section', { class: 'ed' }, el('h3', { text: 'DOWNLOAD' }), el('p', { class: 'note', text: 'EVERYTHING AS ONE FILE (STORIES, PLACES, POSTS, PRINTERS WITHOUT THEIR TOKENS, SETTINGS, COUNTS), OR THE PLACES AND STORIES AS SHEETS FOR A SPREADSHEET. PHOTOGRAPHS DOWNLOAD ONE AT A TIME FROM EACH STORY (PHOTO ↓).' }),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'EVERYTHING (.JSON)', onclick: async () => { const j = await all(); save(`novel-global-${j.at.slice(0, 10)}.json`, JSON.stringify(j, null, 1), 'application/json'); } }),
        el('button', { type: 'button', text: 'PLACES (.CSV)', onclick: async () => { const j = await all(); save('novel-global-places.csv', csv(j.places, [...PCOLS, 'status', 'src']), 'text/csv'); } }),
        el('button', { type: 'button', text: 'STORIES (.CSV)', onclick: async () => { const j = await all(); save('novel-global-stories.csv', csv(j.stories, ['code', 'kind', 'status', 'who', 'gone', 'lat', 'lng', 'dest', 'created', 'decided', 'has_photo']), 'text/csv'); } }),
        el('button', { type: 'button', text: 'COUNTS (.CSV)', onclick: async () => { const j = await all(); save('novel-global-counts.csv', csv(j.traffic, ['day', 'k', 'n']), 'text/csv'); } })));
    const ta = el('textarea', { class: 'body', spellcheck: 'false', placeholder: 'n,cat,role,what,addr,sub,url,lat,lng\nBrunswick Tool Library,circular,repair,A tool library with a repair café,127 Nicholson St,Brunswick East,https://www.brunswicktoollibrary.org/,-37.7718,144.9782' });
    const file = el('input', { type: 'file', accept: '.csv,.json,text/csv,application/json' }); file.addEventListener('change', async () => { const f = file.files[0]; if (f) ta.value = await f.text(); });
    const out = el('span', { class: 'note' });
    const imp = el('section', { class: 'ed' }, el('h3', { text: 'BRING IN PLACES' }),
      el('p', { class: 'note', text: 'A SHEET (CSV) WITH A FIRST ROW OF COLUMN NAMES, OR JSON (A LIST OF PLACES). COLUMNS: n (THE NAME, NEEDED), cat (service, circular, brand, artists, third OR network), role (ONE WORD), what (A LINE), addr, sub (SUBURB), url (https:// ONLY), lat AND lng (NEEDED, DECIMAL). EACH ONE IS SHOWN AT ONCE; UP TO 2000 AT A TIME.' }), file, ta,
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'on', text: 'BRING THEM IN', onclick: async () => { const t = ta.value.trim(); if (!t) return; let list;
        try { if (/^[\[{]/.test(t)) { const j = JSON.parse(t); list = Array.isArray(j) ? j : j.places || []; } else { const [hd, ...rs] = parseCSV(t); const h = hd.map(x => x.trim().toLowerCase()); list = rs.map(r => Object.fromEntries(h.map((k, i) => [k, (r[i] || '').trim()]))); } } catch (e) { out.textContent = 'COULD NOT READ IT: ' + e.message; return; }
        const r = await (await api('places/import', { method: 'POST', body: JSON.stringify({ places: list }) })).json(); out.textContent = `${r.added} ADDED${r.bad ? `, ${r.bad} LEFT OUT (NO NAME, OR NO PLACE)` : ''}`; badges(); } }), out));
    main.replaceChildren(...head('Data', 'Take everything away, or bring places in.'), dl, imp);
  }

  /* ───────── the guide: how each part works, the stack, and where things are ───────── */
  const G = [
    ['Every day', ['Open OVERVIEW: the numbers in coral want a look. WAITING holds what was sent: SHOW puts it on the map and the board, and sends it to its printer; REFUSE keeps it here, never shown; ARCHIVE puts it away (ARCHIVE can bring it back for a year).', 'PLACES SUGGESTED by visitors wait the same way under PLACES.']],
    ['Printers', ['PAIR A PRINTER shows a token once: it goes on the Raspberry Pi in /etc/da-pull.env. PRINTS AFTER APPROVAL holds each slip here (or on its touch screen, if one is paired) until shown; PRINTS WITHOUT APPROVAL prints at once.', 'MESH ON sends a line to the T-Beam only for slips sent to the mesh. Paper always prints before any mesh line.', 'TEST PRINT, TURN OFF and the state of each part (Pi, screen, mesh, the last slip) are on each printer.']],
    ['Places', ['Add one under PLACES, or many under DATA → BRING IN PLACES from a sheet. A sheet has a first row of column names: n, cat, role, what, addr, sub, url, lat, lng. Right-click a spot in a map app to copy its latitude and longitude.', 'Places written into the site itself (places.js) are always there too.']],
    ['Words, boards and cities', ['WORDS AND BOARDS rewrites the words on INTENTION and W.I.S.H., the first board every visitor gets, and BOARD 00 (open it to editing, change it in the studio, send it, then show it under WAITING).', 'Cities: a line # Name begins a city, "centre, lat, lng" places it, and each other line is "name, lat, lng".']],
    ['Signing in', ['The password is the ADMIN_KEY secret set in Cloudflare (Workers & Pages → front → Settings → Variables and Secrets). It is kept only in this browser tab until it is closed or LOCK is pressed.']],
    ['Devices and motion', ['SETTINGS → DEVICES: seven devices, each earned on its own after the number of posters set beside it (0: open from the start). The simple ones are the music, INTENTION with W.I.S.H., and art and print; the complex ones are the radio, the research board, design and the four-track desk. One never opens another. OPEN makes all open; CLOSED leaves only those set to 0.', 'MOTION: calm, as built or chaos; PHREAK lays faint lines of base64 under the stars. A visitor who asks their device for less motion always gets stillness.']],
    ['Portfolio', ['Name up to twelve curations under SETTINGS; each named one is a tab on novel.global/portfolio.html. Write posts under PORTFOLIO and give each its curation. Drafts are seen only here (PREVIEW).']],
    ['Going back to base', ['SETTINGS → BACK TO THE BASE VERSION: tick what goes back, then type RESET. Stories and places go to the ARCHIVE (they can come back); the printers, their tokens and the password are never touched.', 'CLEAR THIS BROWSER empties what was made in this browser (posters on its wall, songs, boards), for testing as a new visitor.']],
    ['Data and privacy', ['Counts are of things, never of people: no addresses, no visitors told apart. Everything sent is kept for a year (archived ones too), then goes. Photographs are seen only here unless shown.', 'DATA downloads everything as one file, or places, stories and counts as sheets.']],
    ['The stack', ['novel.global is one Cloudflare Worker (src/worker/index.js) serving the site from dist/ with a D1 database (stories, jobs, printers, places, posts, settings, counts). It asks iNaturalist and OpenStreetMap for everyone, and the browser asks them itself when they turn the Worker away.', 'The receipts print on an Epson TM-T88V through a Raspberry Pi (receiver/pull.py asks for jobs every 3 seconds), with a Meshtastic T-Beam for the mesh and an optional touch screen.', 'The site: plain JavaScript, MapLibre for the studio map, Fabric for the boards and print shop, Web Audio for every sound (nothing recorded). The staging branch is the preview; main is live.']],
    ['Links', [['Cloudflare dashboard', 'https://dash.cloudflare.com/'], ['The code on GitHub', 'https://github.com/novelglobal/front'], ['iNaturalist API', 'https://api.inaturalist.org/v1/docs/'], ['OpenStreetMap Overpass', 'https://wiki.openstreetmap.org/wiki/Overpass_API'], ['Meshtastic', 'https://meshtastic.org/docs/'], ['Epson ESC/POS', 'https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/index.html']]],
  ];
  function guide() {
    main.replaceChildren(...head('Guide', 'How each part of novel.global works, and where things are.'), ...G.map(([t, ps]) => el('section', { class: 'guide' }, el('h3', { text: t }),
      ...ps.map(p => Array.isArray(p) ? el('p', {}, el('a', { href: p[1], target: '_blank', rel: 'noopener', text: p[0] + ' ↗' })) : el('p', { text: p })))));
  }

  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  $('#out').addEventListener('click', () => lock('LOCKED'));
  $('#gate').addEventListener('submit', e => { e.preventDefault(); KEY = $('#key').value.trim(); if (!KEY) return; sessionStorage.setItem('da.admin', KEY); open(); });
  if (KEY) open();
})();
