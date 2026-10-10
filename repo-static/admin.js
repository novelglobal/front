/* Direct Action · the approval page. Everything sent waits here until it is shown or refused; the printers are paired here.
   The password is the ADMIN_KEY secret set in Cloudflare. It is kept in this tab only (sessionStorage) and sent with each
   request; nothing here is cached. Everything shown is set as text, never as markup. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const main = $('#main'); let KEY = sessionStorage.getItem('da.admin') || ''; let tab = 'waiting';
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
      el('button', { type: 'submit', text: 'OPEN' }), el('p', { class: 'note', id: 'gate-note', text: 'THE ADMIN_KEY SECRET SET IN CLOUDFLARE · KEPT ONLY IN THIS TAB' }));
    return f;
  }
  async function open() { $('#tabs').hidden = false; await show(tab); }
  async function show(t) {
    tab = t; document.querySelectorAll('#tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    main.replaceChildren(el('p', { class: 'empty', text: 'LOADING' }));
    try { if (t === 'printers') await printers(); else if (t === 'stations') await stations(); else await stories(t); } catch (e) { if (e.message !== 'locked') main.replaceChildren(el('p', { class: 'empty', text: 'NO ANSWER · TRY AGAIN' })); }
  }

  /* ───────── stories: what each one says, its photograph, where it was sent ───────── */
  async function photoOf(id, img) { try { const r = await api('photos/' + id); img.src = URL.createObjectURL(await r.blob()); } catch (e) { img.remove(); } }
  async function act(id, action, card) {
    if (action === 'delete' && !confirm('Delete this for good?')) return;
    await api('stories/' + id, { method: 'POST', body: JSON.stringify({ action }) });
    card.querySelector('.acts').replaceChildren(el('span', { class: 'done', text: action === 'show' ? 'SHOWN · AND SENT TO PRINT' : action === 'refuse' ? 'REFUSED' : 'DELETED' }));
  }
  function storyCard(x) {
    const card = el('article', { class: 'card' + (x.kind !== 'story' ? ' rec' : '') });
    const dest = x.dest ? `TO ${x.dest.toUpperCase()}` : 'THE BOARD ONLY'; const meta = `${x.code} · ${x.kind.toUpperCase()} · ${when(x.created)} · ${dest}${x.job ? ` · PRINT ${x.job.toUpperCase()}` : ''}`;
    let body;
    if (x.kind === 'story') {
      const j = unpack(x.body) || {}; const p = j.p || []; const lines = (j.l || []).filter(Boolean);
      body = [el('h3', { text: `${p[3] || p[4] || 'A life'}` }), el('div', { class: 'meta', text: `${meta} · ${p[5] || ''} ${(+p[0]).toFixed(4)} ${(+p[1]).toFixed(4)}` }),
        typeof j.s === 'string' ? el('p', { text: j.s }) : null, lines.length ? el('ol', {}, lines.map(l => el('li', { text: l }))) : el('p', { class: 'note', text: 'NO LINES' }),
        (j.k || []).length ? el('p', { class: 'note', text: 'RELATIONS · ' + j.k.map(k => k[2]).join(' · ') }) : null, j.o ? el('p', { text: 'NOTE · ' + j.o }) : null, j.y ? el('p', { class: 'note', text: '— ' + j.y }) : null];
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
      x.status !== 'shown' ? el('button', { type: 'button', class: 'on', text: 'SHOW', onclick: () => act(x.id, 'show', card) }) : null,
      x.status !== 'refused' ? el('button', { type: 'button', text: 'REFUSE', onclick: () => act(x.id, 'refuse', card) }) : null,
      el('button', { type: 'button', class: 'no', text: 'DELETE', onclick: () => act(x.id, 'delete', card) }));
    const img = x.photo ? el('img', { alt: '' }) : null; if (img) photoOf(x.id, img);
    card.append(...(x.kind !== 'story' ? [] : [img || el('div')]), el('div', {}, body, acts));
    return card;
  }
  async function stories(st) {
    const r = await api('stories?status=' + st); const { stories: list } = await r.json();
    main.replaceChildren(...(list.length ? list.map(storyCard) : [el('p', { class: 'empty', text: st === 'waiting' ? 'NOTHING WAITING' : 'NONE' })]));
  }

  /* ───────── printers: paired with a token shown once; printing with or without approval; a test print ───────── */
  async function setP(id, body) { const r = await api('printers/' + id, { method: 'POST', body: JSON.stringify(body) }); return r.json(); }
  function printerCard(p) {
    const seen = p.seen ? `HEARD ${when(p.seen)}` : 'NOT HEARD YET'; const card = el('section', { class: 'printer' });
    const tok = el('div', { class: 'token', hidden: true });
    card.append(el('h3', { text: p.name || p.id }),
      el('div', { class: 'note', text: `${p.id.toUpperCase()} · ${p.paper} MM · ${p.paired ? 'PAIRED' : 'NOT PAIRED'} · ${seen} · ${p.held} WAITING APPROVAL · ${p.queued} IN QUEUE · ${p.printed} PRINTED · ${p.failed} FAILED` }),
      el('div', { class: 'acts' },
        el('button', { type: 'button', text: p.paired ? 'NEW TOKEN' : 'PAIR A PRINTER', onclick: async () => { if (p.paired && !confirm('A new token stops the old one working. Go on?')) return; const j = await setP(p.id, { action: 'token' }); tok.hidden = false; tok.textContent = `This token shows once. Put it on the receiver, in /etc/da-pull.env:\n\nDA_SERVER=${location.origin}\nDA_PRINTER=${p.id}\nDA_TOKEN=${j.token}`; } }),
        p.paired ? el('button', { type: 'button', class: 'no', text: 'UNPAIR', onclick: async () => { await setP(p.id, { action: 'unpair' }); show('printers'); } }) : null,
        el('button', { type: 'button', class: p.auto ? 'on' : '', text: p.auto ? 'PRINTS WITHOUT APPROVAL' : 'PRINTS AFTER APPROVAL', onclick: async () => { await setP(p.id, { action: 'auto', on: !p.auto }); show('printers'); } }),
        el('button', { type: 'button', class: p.mesh ? 'on' : '', text: p.mesh ? 'MESH ON' : 'MESH OFF', onclick: async () => { await setP(p.id, { action: 'mesh', on: !p.mesh }); show('printers'); } }),
        /* the printer's icon on the map: online when switched on here, or while its Pi is listening */
        el('button', { type: 'button', class: p.live ? 'on' : '', text: p.live ? 'ONLINE ON THE MAP' : 'NOT YET ONLINE ON THE MAP', onclick: async () => { await setP(p.id, { action: 'live', on: !p.live }); show('printers'); } }),
        el('button', { type: 'button', text: `PAPER ${p.paper === '80' ? '58' : '80'} MM`, onclick: async () => { await setP(p.id, { action: 'paper', paper: p.paper === '80' ? '58' : '80' }); show('printers'); } }),
        p.paired ? el('button', { type: 'button', text: 'TEST PRINT', onclick: async () => { await setP(p.id, { action: 'test' }); show('printers'); } }) : null),
      tok);
    return card;
  }
  /* ───────── stations: the nature station stays on for every visitor, unless unlocked here ───────── */
  async function stations() {
    const r = await api('settings'); const st = await r.json(); const card = el('section', { class: 'printer' });
    card.append(el('h3', { text: 'Nature station' }), el('div', { class: 'note', text: st.lifeLock ? 'ALWAYS ON THE MAP FOR EVERY VISITOR. THEY CAN MUTE IT.' : 'UNLOCKED: VISITORS CAN TAKE IT OFF THE MAP.' }),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: st.lifeLock ? 'on' : '', text: st.lifeLock ? 'LOCKED ON' : 'UNLOCKED', onclick: async () => { await api('settings', { method: 'POST', body: JSON.stringify({ lifeLock: !st.lifeLock }) }); show('stations'); } })));
    main.replaceChildren(card);
  }
  async function printers() { const r = await api('printers'); const { printers: list } = await r.json(); main.replaceChildren(...list.map(printerCard)); }

  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  $('#out').addEventListener('click', () => lock('LOCKED'));
  $('#gate').addEventListener('submit', e => { e.preventDefault(); KEY = $('#key').value.trim(); if (!KEY) return; sessionStorage.setItem('da.admin', KEY); open(); });
  if (KEY) open();
})();
