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
    try { if (t === 'printers') await printers(); else if (t === 'stations') await stations(); else if (t === 'posts') await posts(); else await stories(t); } catch (e) { if (e.message !== 'locked') main.replaceChildren(el('p', { class: 'empty', text: 'NO ANSWER · TRY AGAIN' })); }
  }

  /* ───────── stories: what each one says, its photograph, where it was sent ───────── */
  async function photoOf(id, img) { try { const r = await api('photos/' + id); img.src = URL.createObjectURL(await r.blob()); } catch (e) { img.remove(); } }
  async function act(id, action, card) {
    if (action === 'delete' && !confirm('Delete this for good?')) return;
    await api('stories/' + id, { method: 'POST', body: JSON.stringify({ action }) });
    card.querySelector('.acts').replaceChildren(el('span', { class: 'done', text: action === 'show' ? 'SHOWN · AND SENT TO PRINT' : action === 'refuse' ? 'REFUSED' : 'DELETED' }));
  }
  function storyCard(x) {
    const card = el('article', { class: 'card' + (x.kind !== 'story' && x.kind !== 'message' ? ' rec' : '') });
    const dest = x.dest ? `TO ${x.dest.toUpperCase()}` : 'THE BOARD ONLY'; const meta = `${x.code} · ${x.kind.toUpperCase()} · ${when(x.created)} · ${dest}${x.job ? ` · PRINT ${x.job.toUpperCase()}` : ''}`;
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
      x.status !== 'shown' ? el('button', { type: 'button', class: 'on', text: x.kind === 'message' ? 'PRINT' : 'SHOW', onclick: () => act(x.id, 'show', card) }) : null,
      x.status !== 'refused' ? el('button', { type: 'button', text: 'REFUSE', onclick: () => act(x.id, 'refuse', card) }) : null,
      el('button', { type: 'button', class: 'no', text: 'DELETE', onclick: () => act(x.id, 'delete', card) }));
    const img = x.photo ? el('img', { alt: '' }) : null; if (img) photoOf(x.id, img);
    card.append(...(x.kind !== 'story' && x.kind !== 'message' ? [] : [img || el('div')]), el('div', {}, body, acts));
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
    /* TURN OFF shows only while its receiver is listening and says it can: the Pi prints a slip, then shuts down safely */
    const fresh = t => t && Date.now() - t < 2 * 60e3; const canOff = p.paired && /\boff\b/.test(p.can || ''), listening = fresh(p.seen);
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
    main.replaceChildren(card, ex);
  }
  async function printers() { const r = await api('printers'); const { printers: list } = await r.json(); main.replaceChildren(...list.map(printerCard)); }

  /* ───────── the portfolio: posts written here, kept as drafts until published; a cover, a category, links ───────── */
  async function coverOf(id, img) { try { const r = await api(`posts/${id}/cover`); img.src = URL.createObjectURL(await r.blob()); } catch (e) { /* none */ } }
  async function posts() {
    const r = await api('posts'); const { posts: list } = await r.json();
    const rows = list.map(x => { const img = x.cover ? el('img', { alt: '' }) : el('span', { class: 'ph' }); if (x.cover) coverOf(x.id, img);
      return el('div', { class: 'post-row' }, img, el('div', {}, el('b', { text: x.title }), el('span', { class: 'note', text: `${x.status === 'published' ? 'PUBLISHED' : 'DRAFT'} · ${x.cat || 'WORK'} · ${x.day || ''} · /portfolio.html#${x.slug}` })),
        el('button', { type: 'button', text: 'EDIT', onclick: () => editor(x.id) })); });
    main.replaceChildren(el('div', { class: 'acts', style: 'margin:0 0 12px' }, el('button', { type: 'button', class: 'on', text: 'NEW POST', onclick: () => editor(null) }), el('a', { href: 'portfolio.html', target: '_blank', rel: 'noopener', class: 'note', text: 'THE PORTFOLIO ↗' })),
      ...(rows.length ? rows : [el('p', { class: 'empty', text: 'NO POSTS YET' })]));
  }
  /* a cover chosen on this device: made smaller and re-encoded here, which also drops its location and camera details */
  const shrink = file => new Promise((res, rej) => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); let q = 0.82, u = c.toDataURL('image/jpeg', q); while (u.length > 400e3 && q > 0.4) { q -= 0.08; u = c.toDataURL('image/jpeg', q); } while (u.length > 400e3 && c.width > 320) { const t = document.createElement('canvas'); t.width = Math.round(c.width * 0.8); t.height = Math.round(c.height * 0.8); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); c.width = t.width; c.height = t.height; c.getContext('2d').drawImage(t, 0, 0); u = c.toDataURL('image/jpeg', 0.7); } URL.revokeObjectURL(im.src); res(u); }; im.onerror = rej; im.src = URL.createObjectURL(file); });
  async function editor(id) {
    const x = id ? (await (await api('posts/' + id)).json()).post : { title: '', summary: '', body: '', cat: '', links: [], day: new Date().toISOString().slice(0, 10), status: 'draft' };
    let cover; const cv = el('img', { class: 'cv', alt: '' }); if (id && x.cover) coverOf(id, cv);
    const f = (n, tag = 'input', attrs = {}) => el(tag, { name: n, ...attrs });
    const title = f('title', 'input', { maxlength: 140, required: true }); title.value = x.title;
    const cat = f('cat', 'input', { maxlength: 40, placeholder: 'WORK · HARDWARE · WRITING' }); cat.value = x.cat || '';
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
      el('label', {}, 'TITLE', title), el('div', { class: 'two' }, el('label', {}, 'CATEGORY', cat), el('label', {}, 'DATE', day)),
      el('label', {}, 'SUMMARY', sum), el('label', {}, 'BODY', body), el('label', {}, 'LINKS', links),
      el('label', {}, 'COVER', cv, pick),
      el('div', { class: 'acts' },
        el('button', { type: 'button', text: 'SAVE DRAFT', onclick: () => save('draft') }),
        el('button', { type: 'button', class: 'on', text: x.status === 'published' ? 'UPDATE' : 'PUBLISH', onclick: () => save('published') }),
        x.status === 'published' ? el('button', { type: 'button', text: 'UNPUBLISH', onclick: () => save('draft') }) : null,
        el('button', { type: 'button', text: 'PREVIEW', onclick: async () => { await save(x.status === 'published' ? 'published' : 'draft'); window.open(`portfolio.html?preview=${encodeURIComponent(id)}`, '_blank'); } }),
        id ? el('button', { type: 'button', class: 'no', text: 'DELETE', onclick: async () => { if (!confirm('Delete this post for good?')) return; await api('posts/' + id, { method: 'POST', body: JSON.stringify({ action: 'delete' }) }); show('posts'); } }) : null,
        el('button', { type: 'button', text: 'BACK', onclick: () => show('posts') }), note)));
  }

  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  $('#out').addEventListener('click', () => lock('LOCKED'));
  $('#gate').addEventListener('submit', e => { e.preventDefault(); KEY = $('#key').value.trim(); if (!KEY) return; sessionStorage.setItem('da.admin', KEY); open(); });
  if (KEY) open();
})();
