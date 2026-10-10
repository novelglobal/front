/* ════════════════════════════════════════════════════════════════════
   DIRECT ACTION — THE MARKS
   Seven primitives: point, line, circle, plane, grid, type, number. Every mark below is built from them,
   and each variation carries one property of the record it stands for. Shared by the map, the paper and the guide.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  /* the colours, as an open book: the teal page, the white page, a cobalt line, grey for what has gone quiet,
     the danger coming in the months ahead from orange through red to black as it rises, red for now,
     and a highlighter for what a business is on notice for. Type sits on each page in the ink that page can carry. */
  const C = {
    teal: '#0CCBBD', tealLift: '#7FE0D7', tealDeep: '#007A72',
    white: '#FFFFFF', grey: '#C8C8C8', greyText: '#6B6B6B', ink: '#1C1C1A',
    cobalt: '#0067B8', cobaltDeep: '#004A87', navy: '#0B2545', clay: '#8C7469',
    neon: '#E6F84A', red: '#E8453C', black: '#000000',
    orange: '#FF7A00', deg: ['#FFC27A', '#FF9A2E', '#FF6A00', '#D62E1F', '#141412'],
    /* each kind of animal in its own colour, clear of the orange, red and highlighter that carry danger, now and notice */
    kind: { bird: '#1F6FD1', mammal: '#8E44C9', insect: '#D6336C', spider: '#7A5230', reptile: '#5F8A1C', water: '#0B93AE', other: '#56677A' },
    /* the patches people already care for */
    tribe: { creek: '#19A7C4', park: '#4CAF50', farm: '#E3A92B', gardens: '#B07CE8' },
  };
  const TAU = Math.PI * 2;

  /* ───────── icons: a 16-unit grid; strokes 1.5 unless noted; fills knock out with even-odd ───────── */
  const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
  const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
  const S = (d, w = 1.5, dash) => ({ d, w, dash }), F = (d, rule) => ({ d, f: 1, rule });
  const ICONS = {
    /* the six views, as positions of a point in a plane: central, golden, rising, radial, dispersed, dense */
    now: [F(circ(8, 8, 2.3))],
    stories: [S('M.8 6.1h14.4M9.9 .8v14.4', 0.9), F(circ(9.9, 6.1, 2))],
    forecast: [F(circ(2.6, 12.8, 0.95)), F(circ(6, 10.2, 1.35)), F(circ(9.6, 7.2, 1.8)), F(circ(13.2, 3.8, 2.3))],
    alerts: [F(circ(8, 8, 1.9)), F([0, 1, 2, 3, 4, 5, 6, 7].map(i => circ(8 + Math.cos(i * Math.PI / 4) * 5.6, 8 + Math.sin(i * Math.PI / 4) * 5.6, 0.95)).join(''))],
    community: [F([[3.6, 3.6], [12.4, 3.6], [3.6, 12.4], [12.4, 12.4]].map(([x, y]) => circ(x, y, 1.6)).join(''))],
    archive: [F([3.5, 8, 12.5].flatMap(y => [3.5, 8, 12.5].map(x => circ(x, y, 1.25))).join(''))],
    /* actions */
    close: [S('M3.6 3.6l8.8 8.8M12.4 3.6l-8.8 8.8', 1.5)],
    back: [S('M13.5 8H2.8M6.6 4.2L2.8 8l3.8 3.8', 1.5)],
    next: [S('M2.5 8h10.7M9.4 4.2L13.2 8l-3.8 3.8', 1.5)],
    plus: [S('M8 3v10M3 8h10', 1.5)],
    minus: [S('M3 8h10', 1.5)],
    check: [S('M3.2 8.4l3 3 6.6-7', 1.8)],
    search: [S(circ(6.8, 6.8, 4.2), 1.5), S('M10 10l4 4', 1.6)],
    download: [S('M8 2.4v8M4.8 7.4L8 10.6l3.2-3.2M2.6 13.4h10.8', 1.5)],
    out: [S('M6.4 3H3v10h10V9.6M9 2.6h4.4V7M13.4 2.6L7.2 8.8', 1.4)],
    print: [S('M4.4 6V2.6h7.2V6M4.4 11.4H2.4V6h11.2v5.4h-2M4.4 9.2h7.2v4.2H4.4z', 1.4)],
    quote: [S('M3.4 2.2h9.2v11.6H3.4z', 1.4), S('M5.6 5.4h4.8M5.6 7.8h4.8M5.6 10.2h3', 1.1)],
    share: [S('M8 10.4V2.6M4.8 5.8L8 2.6l3.2 3.2M2.8 8.6v4.8h10.4V8.6', 1.4)],
    play: [F('M4.6 3.2l8 4.8-8 4.8z')],
    pause: [F('M4.2 3.2h2.8v9.6H4.2zM9 3.2h2.8v9.6H9z')],
    turn: [S('M3 8.2a5 5 0 1 0 1.5-3.6M3 2.4v3.4h3.4', 1.4)],
    sign: [S('M2 12.6c2-2.6 3.4-6 5.2-6s-.6 5.4 1.4 5.4 2.6-3.2 5.4-3.2', 1.4)],
    sound: [F(circ(4.6, 8, 1.8)), S('M8.2 5.2a4 4 0 0 1 0 5.6M10.8 3a7 7 0 0 1 0 10', 1.4)],
    motion: [S('M1.6 8c2-3.4 4-3.4 6.4 0s4.4 3.4 6.4 0', 1.4)],
    base: [S('M8 2.4l5.6 3-5.6 3-5.6-3z', 1.3), S('M2.4 8.6l5.6 3 5.6-3', 1.3)],
    guide: [S(circ(5, 5, 2.4), 1.3), S('M9.4 2.6h4v4h-4zM2.6 11.4h10.8', 1.3)],
    /* help: things to do, now, this season, for years */
    water: [S('M8 1.8c2.8 3.6 4.4 5.8 4.4 8a4.4 4.4 0 0 1-8.8 0c0-2.2 1.6-4.4 4.4-8z', 1.4)],
    shade: [F('M1.6 4.2h12.8v2.2H1.6z'), F(circ(8, 11.2, 1.9))],
    refuge: [S(circ(8, 8, 5.2), 1.4), S('M1 8h14', 1.4)],
    people: [F(circ(4.8, 5.4, 2.3)), F(circ(11.2, 5.4, 2.3)), F('M1.4 14.6v-2a3.4 3.2 0 0 1 6.8 0v2z'), F('M7.8 14.6v-2a3.4 3.2 0 0 1 6.8 0v2z')],
    hug: [F(circ(5.6, 4.4, 2.2)), F(circ(10.4, 4.4, 2.2)), S('M1.8 15c.2-3.8 2.6-6.4 6.2-6.4s6 2.6 6.2 6.4', 1.6), S('M4 11.8c2.6 2 5.4 2 8 0', 1.6)],
    still: [F(circ(8, 8, 1.9)), S(circ(8, 8, 5.6), 1.2, [1.6, 2])],
    cat: [S('M3 3h10v10H3z', 1.4), F(circ(8, 8, 1.9))],
    plant: [S('M8 14.4V7', 1.5), F('M4.6 2.4h6.8v4.6H4.6z')],
    spray: [S('M3 3h10v10H3z', 1.4), S('M3 13L13 3', 1.4)],
    canopy: [S(circ(8, 6, 4.6), 1.4), S('M8 10.6v4', 1.5)],
    corridor: [F(circ(2.8, 8, 1.8)), F(circ(13.2, 8, 1.8)), S('M4.6 8h6.8', 1.4)],
    wetland: [S('M1.6 6.4c1.8-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 2-1.4 3.2-.6M1.6 10.4c1.8-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 2-1.4 3.2-.6', 1.3)],
    mulch: [F('M2 10.6h12v2.6H2z'), S('M4 8l1.4-1.6M8 8V5.6M12 8l-1.4-1.6', 1.2)],
    ground: [S('M1.6 6h12.8M1.6 9.4h12.8M1.6 12.8h12.8', 1.2)],
    phone: [S('M5 1.8h6v12.4H5z', 1.4), F(circ(8, 11.8, 0.9))],
    heat: [F(circ(8, 8, 2.6)), S('M8 1.2v2.2M8 12.6v2.2M1.2 8h2.2M12.6 8h2.2M3.2 3.2l1.5 1.5M11.3 11.3l1.5 1.5M3.2 12.8l1.5-1.5M11.3 4.7l1.5-1.5', 1.2)],
    rain: [S('M4 3.4l-1.6 4M8.4 3.4L6.8 7.4M12.8 3.4l-1.6 4M6.2 9l-1.6 4M10.6 9L9 13', 1.3)],
    /* reading a record: notice, do no harm, help; the time of day it is about */
    aware: [S('M1.4 8c2.2-3.4 4.4-4.6 6.6-4.6s4.4 1.2 6.6 4.6c-2.2 3.4-4.4 4.6-6.6 4.6S3.6 11.4 1.4 8z', 1.3), F(circ(8, 8, 2))],
    harm: [S(circ(8, 8, 5.6), 1.4), S('M4 12L12 4', 1.4)],
    aid: [S('M8 3.2v9.6M3.2 8h9.6', 2)],
    day: [F(circ(8, 8, 3)), S('M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8', 1.3)],
    dusk: [S('M1.6 11.6h12.8', 1.3), F('M4.2 11.6a3.8 3.8 0 0 1 7.6 0z')],
    night: [F('M10.4 2.2a6 6 0 1 0 3.4 10.6A4.8 4.8 0 0 1 10.4 2.2z')],
    any: [S(circ(8, 8, 5), 1.3), F('M8 3a5 5 0 0 0 0 10z')],
    past: [S(circ(8, 8, 5), 1.3, [1.2, 1.8]), F(circ(8, 8, 1.4))],
    camera: [S('M2 5.2h3l1.2-1.8h3.6L11 5.2h3v7.6H2z', 1.3), S(circ(8, 8.8, 2.4), 1.3)],
    alert: [S('M8 2.4L14.2 13H1.8z', 1.4), S('M8 6.4v3.2', 1.6), F(circ(8, 11.4, 0.85))],
    where: [S(circ(8, 8, 4.4), 1.3), F(circ(8, 8, 1.3)), S('M8 1.2v2.2M8 12.6v2.2M1.2 8h2.2M12.6 8h2.2', 1.2)],
    host: [S('M3.6 4h8.8v9.6H3.6z', 1.3), F(circ(8, 4, 1.3)), S('M5.8 7.6h4.4M5.8 10h3', 1.1)],
    give: [S('M8 2.6L13.4 8 8 13.4 2.6 8z', 1.4), F('M8 5.4L10.6 8 8 10.6 5.4 8z')],
    remix: [S('M2.6 5h7.6l-2-2M13.4 11H5.8l2 2', 1.4), F(circ(13, 5, 1.3)), F(circ(3, 11, 1.3))],
    trace: [S('M2.6 12.6L6 7.4l4 3.2 3.4-6.2', 1.2, [1.4, 1.4]), F(circ(2.6, 12.6, 1.4) + circ(6, 7.4, 1.4) + circ(10, 10.6, 1.4)), S('M11.2 4.6l2.4-.4.4 2.4', 1.2)],
    /* the machines a signal leaves through */
    roll: [S(ell(5, 8, 2.6, 5.6), 1.2), S(ell(5, 8, 0.9, 1.9), 1), S('M5 2.4h6.6v11.2H5M11.6 2.4v11.2l1-.9 1 .9V2.4', 1.2)],
    epson: [S('M1.6 7.2h12.8v6.4H1.6z', 1.3), S('M3.4 7.2l1.2-2.6h6.8l1.2 2.6', 1.2), S('M5 4.6V1.4h6v3.2', 1.1), S('M6.4 2.8h3.2', 0.9), F(circ(12, 10.4, 0.9)), S('M3.6 11.6h4', 1)],
    catprinter: [S('M2.6 6.6h10.8v7.2H2.6z', 1.3), S('M2.8 6.6L3.6 3l2.4 3.6M13.2 6.6L12.4 3 10 6.6', 1.2), S('M5.4 6.6V1.8h5.2v4.8', 1), F(circ(6, 10, 0.75) + circ(10, 10, 0.75))],
    gbprinter: [S('M2 4.2h12v9.6H2z', 1.3), S('M5 4.2V1.4h6v2.8', 1.1), S('M3.6 6.8h8.8M3.6 8.6h8.8M3.6 10.4h8.8', 0.8), F(circ(12.2, 12.2, 0.8))],
    lora: [S('M4 6.2h8v8H4z', 1.3), S('M10.4 6.2V1.6', 1.3), F(circ(10.4, 1.6, 0.9)), S('M12.6 2.6a3 3 0 0 1 0 3.4M14.2 1.4a5 5 0 0 1 0 5.8', 1), S('M5.8 8.6h4.4M5.8 10.6h2.4', 0.9)],
    pager: [S('M1.8 4h12.4v8.4H1.8z', 1.3), S('M3.6 5.8h6.6v3.4H3.6z', 1), S('M11.6 6.2v2.6', 1.2), S('M5 14.2h6', 1.1), S('M4.6 7.5h4', 0.8)],
    qr: [F('M2 2h5v5H2zM3.4 3.4v2.2h2.2V3.4zM9 2h5v5H9zM10.4 3.4v2.2h2.2V3.4zM2 9h5v5H2zM3.4 10.4v2.2h2.2v-2.2zM9 9h2v2H9zM12 9h2v2h-2zM9 12h2v2H9zM12 12h2v2h-2z', 'evenodd')],
    hide: [S('M1.4 8c2.2-3.4 4.4-4.6 6.6-4.6s4.4 1.2 6.6 4.6c-2.2 3.4-4.4 4.6-6.6 4.6S3.6 11.4 1.4 8z', 1.3), F(circ(8, 8, 2)), S('M2.4 13.6L13.6 2.4', 1.5)],
    note: [S('M3 2.2h7.4L13 4.8v9H3z', 1.3), S('M5.4 6.8h5.2M5.4 9.4h5.2M5.4 12h3', 1.1)],
    /* strings and signals */
    string: [F(circ(2.6, 5, 1.6) + circ(13.4, 5, 1.6)), S('M2.6 5Q8 12.6 13.4 5', 1.3)],
    undo: [S('M5.4 3.6L2.4 6.6l3 3', 1.5), S('M2.6 6.6h6.4a3.6 3.6 0 0 1 0 7.2H6.2', 1.5)],
    reset: [S(circ(4.2, 11.6, 2) + circ(11.8, 11.6, 2), 1.3), S('M5.6 10.2L12.6 2.4M10.4 10.2L3.4 2.4', 1.3)],
    restore: [S('M10.6 3.6l3 3-3 3', 1.5), S('M13.4 6.6H7a3.6 3.6 0 0 0 0 7.2h2.8', 1.5)],
    receipt: [S('M3.6 1.8h8.8v12.4l-1.47-1.2-1.47 1.2-1.46-1.2L8 14.2l-1.47-1.2-1.46 1.2-1.47-1.2-1.47 1.2z', 1.3), S('M5.8 5h4.4M5.8 7.6h4.4M5.8 10.2h2.6', 1.1)],
    receive: [S('M8 2v7.6M4.8 6.4L8 9.6l3.2-3.2', 1.5), S('M2.4 10.4v3.2h11.2v-3.2', 1.4)],
    mesh: [S('M3 12L8 3.4 13 12z', 1.1), F(circ(3, 12, 1.7) + circ(13, 12, 1.7) + circ(8, 3.4, 1.7))],
    bits: [F('M2 2h3v3H2zM8 2h3v3H8zM5 5h3v3H5zM11 5h3v3h-3zM2 8h3v3H2zM8 8h3v3H8zM5 11h3v3H5zM11 11h3v3h-3z')],
    gb: [S('M4 1.6h8v12.8H4z', 1.3), F('M5.6 3.4h4.8v4H5.6z'), F(circ(10.4, 10.8, 0.9) + circ(9, 12.2, 0.9)), S('M5.2 11.5h2.2M6.3 10.4v2.2', 1)],
    escpos: [S('M3 7.4h10v5H3z', 1.3), S('M5 7.4V2.2h6v5.2M5 12.4v2.2h6v-2.2', 1.2), S('M6.6 4.2h2.8', 1)],
    radar: [S(circ(8, 8, 6), 1.2), S(circ(8, 8, 3), 0.9), S('M8 8l4.2-4.2', 1.4), F(circ(8, 8, 1.1))],
    injured: [F(circ(8, 8, 2.2)), S('M12.6 10.8A5.4 5.4 0 1 1 13.3 6.6', 1.6)],
    lost: [S(circ(6.4, 9.6, 4), 1.3, [1.4, 1.6]), F(circ(13, 3, 1.8)), S('M9.3 6.8l2.3-2.4', 1.1, [0.8, 1.4])],
    /* the forms, for legends */
    fauna: [F(circ(8, 8, 3.6))],
    flora: [F('M4.6 4.6h6.8v6.8H4.6z')],
    human: [S(circ(8, 8, 3.8), 1.3), S('M8 1.4v13.2M1.4 8h13.2', 1.2)],
    partner: [S('M8 2.6L13.4 8 8 13.4 2.6 8z', 1.5)],
    story: [F(`M3.2 3.2h9.6v9.6H3.2z${circ(8, 8, 2)}`, 'evenodd')],
  };

  /* ───────── the kinds of life: each a composition of no more than four primitives ───────── */
  const spiral = (cx, cy, turns, a, b) => { let d = ''; for (let i = 0; i <= turns * 24; i++) { const t = i / 24 * Math.PI * 2, r = a + b * t; d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`; } return d; };
  const beads = (pts, r) => pts.map(([x, y]) => circ(x, y, r)).join('');
  const GLYPHS = {
    bird: [F('M3.6 8.2L14.4 13.2 5.8 12.8z'), F(circ(5.2, 5.8, 2.2)), S('M3 5.6H1.4M7 12.9v1.7', 1.3)],
    parrot: [F(circ(5.4, 5.4, 2.7)), S('M7.2 7.4l6.6 7', 2.2), S('M2.9 5.2c-1.2.8-1.1 2.4.2 2.6', 1.2)],
    waterbird: [S('M1.4 12.9h13.2', 1.2), F('M3.2 12.9a4.8 3.8 0 0 1 9.6 0z'), F(circ(11.6, 6.2, 1.8)), S('M11.3 7.8l-.5 2.6M13.2 6.2h1.6', 1.4)],
    owl: [S(circ(5, 7.4, 2.7) + circ(11, 7.4, 2.7), 1.4), F(circ(5, 7.4, 1) + circ(11, 7.4, 1)), F('M7.1 10.8L8 12.6l.9-1.8z')],
    raptor: [S('M1.2 9.4Q4.6 4.4 8 8q3.4-3.6 6.8 1.4', 1.5), F(circ(8, 8.4, 1.6)), S('M8 9.8v3', 1.4)],
    mammal: [F(`M2.4 12.4a5.6 5.6 0 0 1 11.2 0z${circ(10.2, 9.8, 0.9)}`, 'evenodd'), S('M1.4 12.4h13.2', 1.2)],
    macropod: [F('M5.4 14.4L10.6 4.6l1.6 9.6z'), F(circ(11.2, 3.2, 1.7)), S('M6.4 13.6L1.2 15.2', 1.4)],
    possum: [F(`${circ(6, 6, 3.6)}${circ(4.8, 5.2, 0.7)}`, 'evenodd'), S('M8.6 8.8c2.4 2 4.8 3.4 4.4 5.2-.4 1.4-2.4 1.2-2-.4', 1.4)],
    flyingfox: [S('M2.4 2.4h11.2M6.6 2.4V4M9.4 2.4V4', 1.3), F(ell(8, 8.4, 3, 4.4)), F(circ(8, 14.2, 1.5))],
    bat: [F('M1 6Q8 3.4 15 6l-3.2 3.6-1.4-1.6L8 10.6 5.6 8 4.2 9.6z'), F(circ(8, 5.4, 1.2))],
    rodent: [F(ell(6.2, 9.6, 3.6, 2.4)), F(circ(4.4, 7.2, 1.2)), S('M9.6 10.2c2.2 1 3.4-1.8 5.4-.8', 1.1)],
    fox: [F(`M2.6 5h10.8L8 13.6z M2.6 5l1.2-3.8L6.4 5z M13.4 5l-1.2-3.8L9.6 5z ${circ(6, 7, 0.9)}${circ(10, 7, 0.9)}`, 'evenodd')],
    cat: [F(`M3 6.2h10v7.6H3z M3 6.2l1.6-3.6L7 6.2z M13 6.2l-1.6-3.6L9 6.2z ${circ(6, 9.4, 0.9)}${circ(10, 9.4, 0.9)}`, 'evenodd')],
    dog: [F(`${circ(8, 8.8, 4)}${circ(6.5, 8, 0.8)}${circ(9.5, 8, 0.8)}`, 'evenodd'), F('M4.4 5.4C1.4 5.8 1.2 10.6 3 11.6l1.6-3zM11.6 5.4c3 .4 3.2 5.2 1.4 6.2l-1.6-3z')],
    rabbit: [F(ell(6, 4.6, 1.3, 3.6) + ell(10, 4.6, 1.3, 3.6)), F(`${circ(8, 11.4, 3.6)}${circ(6.6, 10.8, 0.7)}`, 'evenodd')],
    lizard: [F(circ(3.4, 3.6, 1.7)), S('M4.6 4.8c2.4 2.2 3 4.6 4.4 6.2s3.4 3 5.6 3.4', 1.5), S('M3.8 8.6l3.6-2.4M7.6 12.6l3.6-2.6', 1.2)],
    snake: [S('M1.6 12.6C3.6 7.8 6.4 7.8 8 10.4s4.6 2.6 6.4-2.8', 1.7), F(circ(14.2, 6.4, 1.7))],
    turtle: [S('M5 4.6h6l2.8 4.2-2.8 4.2H5L2.2 8.8z', 1.4), F(circ(8, 8.8, 1.5)), F(circ(8, 2.4, 1.3))],
    frog: [F('M2.4 13.2a5.6 5.6 0 0 1 11.2 0z'), F(circ(5, 6.8, 1.9) + circ(11, 6.8, 1.9))],
    butterfly: [F('M8 8L2 3l.8 10z'), F('M8 8l6-5-.8 10z'), S('M8 4.6v7.8M8 4.6L6.6 2.2M8 4.6l1.4-2.4', 1.1)],
    moth: [F('M8 3.4L1.6 12.6 8 10.6l6.4 2z'), S('M8 3.4L6.4 1.6M8 3.4l1.6-1.8', 1.1)],
    bee: [S(ell(8, 9.6, 3.2, 4.4), 1.4), S('M4.9 8.4h6.2M5.1 10.9h5.8', 1.4), S(circ(4.2, 4.6, 1.8) + circ(11.8, 4.6, 1.8), 1.1)],
    wasp: [F(circ(5.4, 5.8, 2.2)), F(`${circ(11, 11, 3.2)}M8.4 11.6h5.2v1.1H8.4z`, 'evenodd'), S('M7 7.4l1.6 1.6M5.6 3.6l5-2.2', 1.1)],
    fly: [F(ell(8, 10.6, 2, 3.4)), S('M7.4 7.8L2.4 4.2q-.6 2.6 5 3.6zM8.6 7.8l5-3.6q.6 2.6-5 3.6z', 1.2), F(circ(8, 6.4, 1.3))],
    beetle: [F('M7.4 4.6A4.9 4.9 0 0 0 7.4 14.4zM8.6 4.6a4.9 4.9 0 0 1 0 9.8z'), F(circ(8, 2.8, 1.5))],
    bug: [S('M2.6 3.4h10.8v4.2L8 14.4 2.6 7.6z', 1.4), F('M5.2 3.4L8 9.2l2.8-5.8z')],
    spider: [F(circ(8, 9, 2.3)), F(circ(8, 5.6, 1.3)), S('M6.2 8L1.6 4.4M6 9.2H1.2M6.2 10.4l-4.6 3.2M9.8 8l4.6-3.6M10 9.2h4.8M9.8 10.4l4.6 3.2', 1.1)],
    orb: [S('M8 1.4v13.2M1.4 8h13.2M3.3 3.3l9.4 9.4M12.7 3.3l-9.4 9.4', 0.8), S(circ(8, 8, 2.6) + circ(8, 8, 5.2), 0.9), F(circ(10.6, 10.6, 1.7))],
    grasshopper: [S('M2 10.6l9-3', 2.1), F(circ(12.6, 7.1, 1.6)), S('M6.4 9.2l3.4-4.8 2.8 8.6M13.6 5.9l1.6-3.4', 1.2)],
    mantis: [S('M8 15V6.6', 1.8), F('M6.2 3.2h3.6L8 6z'), S('M8 8.2L4.8 6.2l.6 3.4M8 11.4l3.6 2.2', 1.3)],
    dragonfly: [S('M8 3.6V15', 1.5), F(circ(8, 2.4, 1.5)), S('M1.6 5.8h12.8M2.4 8.4h11.2', 1.4)],
    aquatic: [F(ell(8, 7, 2.4, 3.6)), S('M5.8 7.8l-4.2 2.6M10.2 7.8l4.2 2.6', 1.3), S('M1.4 13.6q3.3-1.6 6.6 0t6.6 0', 1.1)],
    snail: [S(spiral(8.4, 7.2, 2, 0.3, 0.46), 1.3), S('M1.6 14.2h12.8', 1.4)],
    segmented: [F(beads([[2.2, 10.6], [4.1, 8.8], [6.1, 8.1], [8.1, 8.7], [10, 10], [12, 10.4], [13.9, 9.4]], 1.15))],
    fungi: [F('M2.4 8.6a5.6 5.2 0 0 1 11.2 0z'), S('M8 8.6v5.8', 2)],
    plant: [S('M8 15V5', 1.4), F('M8 9.4Q3.4 9 2.6 5q4.2.4 5.4 4.4zM8 7.2q4.6-.6 5.4-4.6Q9.2 3 8 7.2z')],
    human: [S(circ(8, 8, 3.8), 1.3), S('M8 1.4v13.2M1.4 8h13.2', 1.2)],
    paw: [F(circ(3.8, 7, 1.5) + circ(6.4, 3.9, 1.5) + circ(9.6, 3.9, 1.5) + circ(12.2, 7, 1.5)), F(ell(8, 11.2, 3.6, 2.9))],
    ape: [F(`${circ(8, 4.4, 3)}${ell(8, 5.1, 1.7, 1.3)}`, 'evenodd'), F(ell(8, 11, 2.9, 3.4)), S('M5.3 8.6C2.9 9.4 1.9 12 1.6 15M10.7 8.6c2.4.8 3.4 3.4 3.7 6.4', 1.5)],
  };

  /* svg sprite, for the page: icons as #g-name, kinds of life as #k-name */
  const symbol = (prefix, n, parts) => `<symbol id="${prefix}-${n}" viewBox="0 0 16 16">${parts.map(p => p.f
      ? `<path d="${p.d}" fill="currentColor"${p.rule ? ` fill-rule="${p.rule}"` : ''}/>`
      : `<path d="${p.d}" fill="none" stroke="currentColor" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"${p.dash ? ` stroke-dasharray="${p.dash.join(' ')}"` : ''}/>`).join('')}</symbol>`;
  function sprite() {
    return Object.entries(ICONS).map(([n, parts]) => symbol('g', n, parts)).join('') + Object.entries(GLYPHS).map(([n, parts]) => symbol('k', n, parts)).join('');
  }
  /* the same icons as paths, for canvas */
  let PATHS = null, GPATHS = null;
  const compile = set => Object.fromEntries(Object.entries(set).map(([n, parts]) => [n, parts.map(p => ({ ...p, p: new Path2D(p.d) }))]));
  const paths = () => PATHS || (PATHS = compile(ICONS));
  const gpaths = () => GPATHS || (GPATHS = compile(GLYPHS));
  function icon(ctx, name, x, y, size, color, lineScale = 1) { draw16(ctx, paths()[name], x, y, size, color, lineScale); }
  function glyph(ctx, name, x, y, size, color, lineScale = 1) { draw16(ctx, gpaths()[name] || gpaths().bird, x, y, size, color, lineScale); }
  function draw16(ctx, parts, x, y, size, color, lineScale) {
    if (!parts) return; const k = size / 16;
    ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(k, k); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const pt of parts) {
      if (pt.f) { ctx.fillStyle = color; ctx.fill(pt.p, pt.rule || 'nonzero'); }
      else { ctx.strokeStyle = color; ctx.lineWidth = pt.w * lineScale; ctx.setLineDash(pt.dash || []); ctx.stroke(pt.p); ctx.setLineDash([]); }
    }
    ctx.restore();
  }

  /* ───────── the pin: one record as a composition of primitives ─────────
     p = {
       f:     form — 'fauna' point · 'flora' square · 'need' cross · 'offer' cross+point · 'event' registration mark ·
              'pulse' ring of points · 'refuge' ring+line · 'story' plane holding a point · 'partner' diamond
       s:     solid (verified · signed · done) or open (awaiting · asked · in progress) — the texture of certainty
       r:     radius in px — rarity
       lv:    0–4 threat now — encircling lines: 2 one ring, 3 a double line, 4 multiple lines; 3+ fills with the signal
       age:   days since — a tick, its angle the time (north = today, a full turn = 30 days)
       fut:   days until (events) — the same tick, dotted
       sig:   significant (threatened) — crop marks
       voice: a recording — two arcs
       fresh: new since the last visit — a short red mark
       n:     a count (pulse, cluster) — points in a lattice; beside a sighting, how many were seen
       night: seen after dark — half the point is night
       roam:  a hunter that roams (fox, cat) — the dotted line it travels
       cold:  gone cold, weeks old — a small grey point;  hist: this season in a past year — a dotted ring
       f 'injured': a point held by a broken circle;  f 'lost': an empty dotted place and the point that left it
       pulse, pc: which few records move, and in what colour (see pulse)
       dim, sel, a: emphasis
     } */
  function knock(ctx, draw, w = 3) { ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = w; ctx.lineJoin = 'round'; draw(); ctx.stroke(); ctx.restore(); }
  function form(ctx, f, x, y, r) {
    ctx.beginPath();
    switch (f) {
      case 'flora': { const h = r * 0.92; ctx.rect(x - h, y - h, h * 2, h * 2); break; }
      case 'partner': { const h = r * 1.25; ctx.moveTo(x, y - h); ctx.lineTo(x + h, y); ctx.lineTo(x, y + h); ctx.lineTo(x - h, y); ctx.closePath(); break; }
      case 'story': { const h = r * 1.15; ctx.rect(x - h, y - h, h * 2, h * 2); break; }
      default: ctx.arc(x, y, r, 0, TAU);
    }
  }
  function lattice(ctx, x, y, n, color, gap = 3.2, rad = 1.15) {
    const m = Math.min(9, n); ctx.fillStyle = color;
    for (let i = 0; i < m; i++) { const cx = x + ((i % 3) - 1) * gap, cy = y + (Math.floor(i / 3) - 1) * gap; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fill(); }
  }
  function pin(ctx, p, x, y, t = 0) {
    const r = p.r || 3.6; const a = p.a != null ? p.a : p.dim ? 0.28 : 1; const hot = (p.lv || 0) >= 3;
    const ink = C.cobalt; const line = 1.2;
    /* gone cold: a small grey point and nothing else; a past season: a dotted grey ring */
    if (p.cold || p.hist) {
      ctx.save(); ctx.globalAlpha = a * (p.hist ? 0.9 : 0.95); const rr = p.hist ? 2.2 : Math.max(1.9, r * 0.6);
      ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU);
      if (p.hist) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); ctx.setLineDash([1.1, 1.3]); ctx.strokeStyle = C.white; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.fillStyle = C.grey; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = C.white; ctx.stroke(); }
      ctx.restore(); return;
    }
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    /* encircling lines: how urgent, now */
    if (p.lv >= 2 && !p.dim) {
      const n = p.lv - 1; ctx.strokeStyle = p.lv >= 4 ? C.cobaltDeep : C.cobalt; ctx.lineWidth = 1;
      for (let i = 1; i <= n; i++) { ctx.beginPath(); ctx.arc(x, y, r + 1.6 + i * 2.7, 0, TAU); ctx.stroke(); }
    }
    /* the form */
    const f = p.f || 'fauna';
    if (f === 'injured') {                                   /* a point held by a broken circle: an animal hurt, now */
      ctx.beginPath(); ctx.arc(x, y, r + 3.4, 0, TAU); ctx.fillStyle = C.white; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r + 3.4, 0.5, TAU - 0.35); ctx.strokeStyle = C.red; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, TAU); ctx.fillStyle = C.red; ctx.fill();
    } else if (f === 'lost') {                               /* the place it belongs, empty; the point that left it */
      const R = r + 1.8, ox = x + R + 5.4, oy = y - R - 5.4;
      ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.setLineDash([1.6, 1.6]); ctx.strokeStyle = C.cobaltDeep; ctx.lineWidth = 1.3; ctx.stroke();
      if (!p.moving) {
        ctx.beginPath(); ctx.moveTo(x + R * 0.72, y - R * 0.72); ctx.lineTo(ox, oy); ctx.setLineDash([1, 2]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(ox, oy, 2.7, 0, TAU); ctx.lineWidth = 2.4; ctx.strokeStyle = C.white; ctx.stroke(); ctx.fillStyle = C.red; ctx.fill();
      }
    } else if (f === 'need' || f === 'offer' || f === 'event') {
      const arm = r + (f === 'event' ? 4.2 : 2.2);
      const cross = () => { ctx.beginPath(); ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y); ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm); };
      knock(ctx, cross, 3.6); cross(); ctx.strokeStyle = C.navy; ctx.lineWidth = 1.5; ctx.stroke();
      if (f === 'event') { ctx.beginPath(); ctx.arc(x, y, r + 0.6, 0, TAU); ctx.lineWidth = 3.4; ctx.strokeStyle = C.white; ctx.stroke(); ctx.lineWidth = 1.4; ctx.strokeStyle = C.navy; ctx.stroke(); if (p.sound) { ctx.lineWidth = 1; for (const rr of [r + 3.2, r + 5.4]) { ctx.beginPath(); ctx.arc(x, y, rr, -0.5, 0.5); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, rr, Math.PI - 0.5, Math.PI + 0.5); ctx.stroke(); } } }
      /* a need is a gap at the crossing; an offer fills it */
      if (f === 'offer') { ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, TAU); ctx.fillStyle = C.navy; ctx.fill(); }
      if (f === 'need') { ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = C.navy; ctx.stroke(); }
    } else if (f === 'pulse') {
      ctx.beginPath(); ctx.arc(x, y, r + 3.2, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = C.cobaltDeep; ctx.stroke();
      lattice(ctx, x, y, p.n || 3, C.cobaltDeep, 2.7, 0.95);
    } else if (f === 'refuge') {
      ctx.beginPath(); ctx.arc(x, y, r + 1.4, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = C.cobaltDeep; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - r - 4.6, y); ctx.lineTo(x + r + 4.6, y); ctx.stroke();
    } else {
      form(ctx, f, x, y, r); ctx.lineWidth = 3; ctx.strokeStyle = C.white; ctx.stroke();                       // the knock-out
      form(ctx, f, x, y, r);
      const tone = f === 'flora' ? C.tealDeep : f === 'partner' && p.on ? C.navy : ink;
      if (p.s) { ctx.fillStyle = hot ? C.orange : tone; ctx.fill(); ctx.lineWidth = line; ctx.strokeStyle = hot ? C.navy : tone; ctx.stroke(); }
      else { ctx.fillStyle = hot ? C.orange : f === 'partner' && p.on ? C.neon : C.white; ctx.fill(); ctx.lineWidth = line + 0.2; ctx.strokeStyle = hot ? C.navy : tone; ctx.setLineDash(f === 'partner' || f === 'story' ? [] : [1.6, 1.4]); ctx.stroke(); ctx.setLineDash([]); }
      if (f === 'story' || (f === 'partner' && p.half)) { ctx.beginPath(); ctx.arc(x, y, r * (f === 'story' ? 0.42 : 0.5), 0, TAU); ctx.fillStyle = p.s ? C.white : ink; ctx.fill(); }
      /* after dark: the left half of the point is night */
      if (p.night && (f === 'fauna' || f === 'flora')) { ctx.save(); form(ctx, f, x, y, r); ctx.clip(); ctx.fillStyle = C.navy; ctx.fillRect(x - r - 2, y - r - 2, r + 2, 2 * r + 4); ctx.restore(); form(ctx, f, x, y, r); ctx.lineWidth = line; ctx.strokeStyle = C.navy; ctx.stroke(); }
      /* a hunter that roams: the line it travels */
      if (p.roam) { ctx.beginPath(); ctx.moveTo(x - r * 0.8 - 1.4, y + r * 0.8 + 1.4); ctx.lineTo(x - r - 10, y + r + 10); ctx.setLineDash([2, 2]); ctx.strokeStyle = C.navy; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); }
      /* more than one: a count as points beside it */
      if (p.n > 1 && (f === 'fauna' || f === 'flora')) { ctx.fillStyle = C.navy; for (let i = 0; i < Math.min(5, p.n); i++) { ctx.beginPath(); ctx.arc(x + r + 3.4 + i * 3, y + r + 2.6, 0.95, 0, TAU); ctx.fill(); } }
    }
    if (!p.dim) {
      /* the tick: time as an angle */
      const tk = p.fut != null ? p.fut / 14 : p.age != null && p.age > 1 ? p.age / 30 : null;
      if (tk != null) {
        const th = -Math.PI / 2 + Math.min(1, tk) * TAU, r0 = r + 1.8, r1 = r + 6.4;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(th) * r0, y + Math.sin(th) * r0); ctx.lineTo(x + Math.cos(th) * r1, y + Math.sin(th) * r1);
        ctx.strokeStyle = C.cobaltDeep; ctx.lineWidth = 1.1; ctx.setLineDash(p.fut != null ? [1, 1.6] : []); ctx.stroke(); ctx.setLineDash([]);
      }
      /* crop marks: significant */
      if (p.sig) {
        const d = r + 7.2, l = 2.8; ctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(x + sx * d, y + sy * (d - l)); ctx.lineTo(x + sx * d, y + sy * d); ctx.lineTo(x + sx * (d - l), y + sy * d); }
        ctx.strokeStyle = C.cobaltDeep; ctx.lineWidth = 1; ctx.stroke();
      }
      /* a recording: two arcs */
      if (p.voice) { ctx.strokeStyle = C.cobaltDeep; ctx.lineWidth = 1; for (const rr of [r + 3.2, r + 5.6]) { ctx.beginPath(); ctx.arc(x, y, rr, -0.6, 0.6); ctx.stroke(); } }
      /* new: a red mark */
      if (p.fresh) { ctx.beginPath(); ctx.moveTo(x + r + 2.2, y - r - 4.6); ctx.lineTo(x + r + 2.2, y - r - 0.8); ctx.strokeStyle = C.red; ctx.lineWidth = 1.6; ctx.stroke(); }
    }
    ctx.restore();
  }
  /* rhythm: most records hold still; a few keep a pulse, a ring that leaves and fades.
     1 slow (in danger soon) · 2 steady (lost, just arrived) · 3 quick, doubled (hurt, now) */
  function pulse(ctx, p, x, y, t, phase = 0) {
    const lv = p.pulse || 0; if (!lv || p.dim) return;
    if (p.f === 'lost') {                                     /* the lost point searches around the place it left */
      const R = (p.r || 3.4) + 1.8, a = (t / 3 + phase) * TAU, ox = x + Math.cos(a) * (R + 6.6), oy = y + Math.sin(a) * (R + 6.6);
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, R + 6.6, 0, TAU); ctx.setLineDash([0.8, 2.6]); ctx.strokeStyle = C.white; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(ox, oy, 2.4, 0, TAU); ctx.lineWidth = 2; ctx.strokeStyle = C.white; ctx.stroke(); ctx.fillStyle = C.red; ctx.fill(); ctx.restore(); return;
    }
    if (p.f === 'event') {                                    /* a gathering within a day: a hand sweeps the hour */
      const R = (p.r || 3.6) + 4.2, a = -Math.PI / 2 + ((t / 6 + phase) % 1) * TAU;
      ctx.save(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (R + 3), y + Math.sin(a) * (R + 3)); ctx.strokeStyle = C.red; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore(); return;
    }
    const P = lv >= 3 ? 1.15 : lv === 2 ? 2.1 : 3.6, reach = lv >= 3 ? 20 : 15;
    for (const off of lv >= 3 ? [0, 0.5] : [0]) {
      const k = ((t / P + phase + off) % 1 + 1) % 1, r = (p.r || 3.6) + 3.4 + k * reach;
      ctx.save(); ctx.globalAlpha = (1 - k) * (lv >= 3 ? 0.95 : 0.8); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = p.pc || C.cobalt; ctx.lineWidth = lv >= 3 ? 1.9 : 1.3; ctx.stroke(); ctx.restore();
    }
  }
  /* density: many records in one place become a lattice; past nine, a field of hatched lines */
  function cluster(ctx, x, y, n, hot) {
    ctx.save(); const h = 7.2;
    ctx.fillStyle = hot ? C.orange : C.white; ctx.fillRect(x - h, y - h, h * 2, h * 2);
    ctx.strokeStyle = C.cobalt; ctx.lineWidth = 1; ctx.strokeRect(x - h + 0.5, y - h + 0.5, h * 2 - 1, h * 2 - 1);
    if (n <= 9) lattice(ctx, x, y, n, C.cobalt, 4, 1.25);
    else {
      const lines = Math.min(14, 3 + Math.round(Math.log2(n) * 2)); ctx.beginPath(); ctx.rect(x - h + 1, y - h + 1, h * 2 - 2, h * 2 - 2); ctx.clip();
      ctx.beginPath(); for (let i = 0; i <= lines; i++) { const o = -h * 2 + (i / lines) * h * 4; ctx.moveTo(x + o - h, y + h); ctx.lineTo(x + o + h, y - h); } ctx.strokeStyle = C.cobalt; ctx.lineWidth = 0.9; ctx.stroke();
    }
    ctx.restore();
  }
  /* a label on the ground: type knocked out of the image */
  function label(ctx, text, x, y, o = {}) {
    ctx.save(); ctx.font = o.font || '600 10.5px Poppins, sans-serif'; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = o.halo || C.white; ctx.lineWidth = o.hw || 3.4; ctx.strokeText(text, x, y);
    ctx.fillStyle = o.color || C.navy; ctx.fillText(text, x, y); ctx.restore();
  }

  /* ───────── the living icon ─────────
     What a record is, drawn large enough to read on the photograph: the kind of life or the thing itself,
     in a shape that says what sort of record it is. Animals sit in discs (cobalt by day, navy after dark),
     plants in teal squares, gatherings in navy calendar pages, needs in rings and offers in discs,
     an animal hurt in red, an animal dead in black with a red mark, an animal lost in a white dashed disc,
     a signal as a white slip. A life the months ahead put in severe danger turns orange; a plant in danger wears an orange ring.
     b = { g: kind of life (GLYPHS), i: or an icon (ICONS), tone, d: diameter in px, sig, fresh, n, carried, hot, a } */
  const TONES = {
    'k-bird': [C.kind.bird, C.white], 'k-mammal': [C.kind.mammal, C.white], 'k-insect': [C.kind.insect, C.white], 'k-spider': [C.kind.spider, C.white],
    'k-reptile': [C.kind.reptile, C.white], 'k-water': [C.kind.water, C.white], 'k-other': [C.kind.other, C.white],
    fauna: [C.cobalt, C.white], night: [C.navy, C.white], flora: [C.tealDeep, C.white], danger: [C.orange, C.navy],
    event: [C.navy, C.white], need: [C.white, C.navy], offer: [C.navy, C.white], injured: [C.red, C.white], dead: [C.black, C.red],
    lost: [C.white, C.navy], story: [C.clay, C.white], hero: [C.clay, C.white], cold: ['#9AA39D', C.white], hist: ['rgba(255,255,255,.3)', C.white],
  };
  /* a W.I.S.H. receipt printer, as it stands on a counter: a body with a sloped lid and its slot, a slip curling out of it
     (a torn edge, a block of dithered photograph, lines of print), a feed button and a light. on: online, the light lit and the
     slip feeding a little and back (t: seconds). Not yet online, it is quiet: greys, the slot empty, the light out */
  function printer(ctx, x, y, d, t, on) {
    const k = d / 32; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    const ink = on ? C.ink : '#6F756F', body = on ? '#FFFFFF' : '#E3E2DB', lid = on ? '#2A2B28' : '#9A9F99';
    const sh = (b, oy) => { ctx.shadowColor = on ? 'rgba(0,0,0,.38)' : 'rgba(0,0,0,.18)'; ctx.shadowBlur = b; ctx.shadowOffsetY = oy; };
    if (on) {
      /* the slip: it leans back a little as it rises, its top torn */
      const feed = t ? 1.6 + 2.2 * (0.5 + 0.5 * Math.sin(t * 1.4)) : 2.6; const top = -17 - feed, L = -7, R = 7, lean = 1.2;
      sh(4, 1); ctx.beginPath(); ctx.moveTo(L, -4); ctx.bezierCurveTo(L, -9, L + lean, top + 6, L + lean, top + 1.6);
      for (let i = 0; i <= 7; i++) ctx.lineTo(L + lean + i * ((R - L) / 7), top + (i % 2 ? 0 : 1.6));
      ctx.bezierCurveTo(R + lean, top + 6, R, -9, R, -4); ctx.closePath(); ctx.fillStyle = '#FCFBF7'; ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.stroke();
      /* what is printed on it: a block of photograph, dithered, then three lines */
      ctx.save(); ctx.beginPath(); ctx.rect(L, top + 2, R - L + lean, -4 - top - 2); ctx.clip();
      const px = L + lean + 2.4, py = top + 4.2; ctx.fillStyle = ink;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if ((r + c) % 2 === 0 || (r === 1 && c === 2)) ctx.fillRect(px + c * 1.15, py + r * 1.15, 1.15, 1.15);
      ctx.fillRect(px + 5.6, py + 0.3, 4.4, 1.1); ctx.fillRect(px + 5.6, py + 2.6, 3, 1.1);
      [9.2, 6.2, 8].forEach((w, i) => ctx.fillRect(px - 0.2, py + 6.4 + i * 2.6, w, 1.1));
      ctx.restore();
    } else {
      /* not yet online: a short stub of blank paper, torn */
      const top = -11.5, L = -6, R = 6; ctx.beginPath(); ctx.moveTo(L, -4); ctx.lineTo(L, top + 1.4); for (let i = 0; i <= 6; i++) ctx.lineTo(L + i * ((R - L) / 6), top + (i % 2 ? 0 : 1.4)); ctx.lineTo(R, -4); ctx.closePath();
      ctx.fillStyle = '#EFEEE8'; ctx.fill(); ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.stroke();
    }
    /* the body: a sloped lid over the front, the slot across it */
    sh(on ? 5 : 3, on ? 1.6 : 1); ctx.beginPath();
    ctx.moveTo(-13, 12); ctx.lineTo(-13, -1); ctx.quadraticCurveTo(-13, -6, -8.5, -6); ctx.lineTo(8.5, -6); ctx.quadraticCurveTo(13, -6, 13, -1); ctx.lineTo(13, 12); ctx.closePath();
    ctx.fillStyle = body; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 1.6; ctx.strokeStyle = ink; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-13, 1.6); ctx.lineTo(13, 1.6); ctx.lineWidth = 1.1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12.2, 1.2); ctx.lineTo(-12.2, -1); ctx.quadraticCurveTo(-12.2, -5.2, -8.5, -5.2); ctx.lineTo(8.5, -5.2); ctx.quadraticCurveTo(12.2, -5.2, 12.2, -1); ctx.lineTo(12.2, 1.2); ctx.closePath(); ctx.fillStyle = lid; ctx.fill();
    ctx.fillStyle = on ? '#000' : '#7E837D'; ctx.fillRect(-8.2, -4.6, 16.4, 1.5);
    /* the foot, the feed button, the light */
    ctx.fillStyle = ink; ctx.beginPath(); rrect(ctx, -12, 11.2, 24, 1.8, 0.9); ctx.fill();
    ctx.beginPath(); rrect(ctx, -10, 5.4, 5.4, 2.4, 1.2); ctx.fillStyle = on ? '#C9CBC6' : '#C4C4BC'; ctx.fill();
    if (on) { ctx.beginPath(); ctx.arc(8.6, 6.6, 3.4, 0, TAU); ctx.fillStyle = 'rgba(12,203,189,.28)'; ctx.fill(); ctx.beginPath(); ctx.arc(8.6, 6.6, 1.9, 0, TAU); ctx.fillStyle = C.teal; ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(8.6, 6.6, 1.7, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = '#8A8F89'; ctx.stroke(); }
    ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function shape(ctx, tone, x, y, r) {
    ctx.beginPath();
    if (tone === 'flora') rrect(ctx, x - r * 0.92, y - r * 0.92, r * 1.84, r * 1.84, r * 0.34);
    else if (tone === 'event') rrect(ctx, x - r * 0.95, y - r * 0.86, r * 1.9, r * 1.86, r * 0.16);
    else if (tone === 'story') rrect(ctx, x - r * 0.74, y - r * 1.04, r * 1.48, r * 2.08, 1.5);
    else ctx.arc(x, y, r, 0, TAU);
  }
  function badge(ctx, b, x, y) {
    const d = b.d || 22, r = d / 2, [bg, fg] = TONES[b.tone] || TONES.fauna;
    ctx.save(); if (b.a != null) ctx.globalAlpha = b.a;
    if (b.tone === 'hist') { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = bg; ctx.fill(); ctx.setLineDash([1.4, 1.6]); ctx.lineWidth = 1.1; ctx.strokeStyle = C.white; ctx.stroke(); ctx.restore(); return; }
    /* more than one seen: discs stacked behind */
    if (b.n > 1) for (let k = Math.min(2, b.n - 1); k >= 1; k--) { ctx.beginPath(); ctx.arc(x + k * 3.4, y - k * 3.4, r, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = bg === C.white ? C.navy : bg; ctx.stroke(); }
    shape(ctx, b.tone, x, y, r);
    ctx.shadowColor = 'rgba(0,0,0,.38)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 1.5; ctx.fillStyle = bg; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.6; ctx.strokeStyle = ['need', 'lost', 'story'].includes(b.tone) ? C.navy : b.tone === 'dead' ? C.red : C.white;
    if (b.tone === 'lost') ctx.setLineDash([2.6, 2.2]); ctx.stroke(); ctx.setLineDash([]);
    /* a gathering: the rings of a calendar page */
    if (b.tone === 'event') { ctx.fillStyle = C.white; for (const sx of [-0.45, 0.45]) { ctx.beginPath(); ctx.arc(x + sx * r, y - r * 0.86, r * 0.13, 0, TAU); ctx.fill(); } }
    /* a signal: the slip's top band */
    if (b.tone === 'story') { ctx.fillStyle = b.carried ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.45)'; ctx.fillRect(x - r * 0.74 + 1, y - r * 1.04 + 1, r * 1.48 - 2, r * 0.42); }
    const gs = d * (b.tone === 'story' ? 0.58 : b.tone === 'event' ? 0.6 : 0.66), gy = b.tone === 'story' ? y + r * 0.18 : b.tone === 'event' ? y + r * 0.08 : y;
    if (b.i) icon(ctx, b.i, x, gy, gs * 0.9, fg, 1.1); else if (b.g) glyph(ctx, b.g, x, gy, gs, fg);
    /* danger in the months ahead: a red ring when severe, a black ring at the extreme */
    const dz = b.dz || (b.hot ? 3 : 0);
    if (dz >= 3) { const R0 = r + (dz >= 4 ? 3.6 : 2.6); if (dz >= 4) { ctx.beginPath(); ctx.arc(x, y, R0, 0, TAU); ctx.lineWidth = 5.6; ctx.strokeStyle = C.white; ctx.stroke(); } ctx.beginPath(); ctx.arc(x, y, R0, 0, TAU); ctx.lineWidth = dz >= 4 ? 3.4 : 2.2; ctx.strokeStyle = C.deg[dz]; ctx.stroke(); }
    /* threatened: a dashed ring */
    if (b.sig) { ctx.beginPath(); ctx.arc(x, y, r + (dz >= 3 ? 7 : 3.4), 0, TAU); ctx.lineWidth = 1.2; ctx.strokeStyle = C.white; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]); }
    /* new: a red point at the shoulder */
    if (b.fresh) { ctx.beginPath(); ctx.arc(x + r * 0.76, y - r * 0.76, Math.max(2.6, d * 0.13), 0, TAU); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = C.white; ctx.stroke(); }
    ctx.restore();
  }
  /* each icon drawn once into a bitmap, then placed: hundreds can move at once */
  const SPR = new Map();
  function badgeSprite(b, dpr = 1) {
    const key = [b.g, b.i, b.tone, b.d, b.sig ? 1 : 0, b.fresh ? 1 : 0, b.n > 1 ? Math.min(3, b.n) : 0, b.carried ? 1 : 0, b.hot ? 1 : 0, b.dz || 0, dpr].join('|');
    let sp = SPR.get(key); if (sp) return sp;
    const size = Math.ceil((b.d || 22) + 26); const cv = document.createElement('canvas'); cv.width = cv.height = Math.ceil(size * dpr);
    const x = cv.getContext('2d'); x.scale(dpr, dpr); badge(x, { ...b, a: 1 }, size / 2, size / 2);
    sp = { cv, size }; SPR.set(key, sp); if (SPR.size > 1200) SPR.delete(SPR.keys().next().value);
    return sp;
  }
  /* how each kind of life moves: small, true to its kind, never far from where it was seen.
     Plants, fungi, gatherings and people hold still. */
  const hsh = (k, s) => { const v = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease3 = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const STILL = new Set(['plant', 'fungi', 'human']);
  function motion(g, t, ph, amp = 1) {
    const T = t + ph * 37; let dx = 0, dy = 0, rot = 0, sx = 1, thread = 0;
    const flit = (P, R, hop) => { const k = Math.floor(T / P), p = T / P - k; const a0 = hsh(k - 1, ph) * TAU, a1 = hsh(k, ph) * TAU, r0 = R * (0.5 + 0.5 * hsh(k - 1, ph + 1)), r1 = R * (0.5 + 0.5 * hsh(k, ph + 1)); const e = p < 0.14 ? ease3(p / 0.14) : 1; dx = lerp(Math.cos(a0) * r0, Math.cos(a1) * r1, e); dy = lerp(Math.sin(a0) * r0, Math.sin(a1) * r1, e) - (hop && p < 0.14 ? Math.sin(Math.PI * p / 0.14) * hop : 0); };
    switch (g) {
      case 'bird': case 'parrot': flit(2.4, 6, 3); break;                                         // a quick hop, a pause, a hop
      case 'waterbird': dx = 5 * Math.sin(T * 0.35); dy = 1.6 * Math.sin(T * 0.7); break;             // a slow glide
      case 'raptor': dx = 7 * Math.cos(T * 0.45); dy = 4 * Math.sin(T * 0.45); rot = 0.22 * Math.sin(T * 0.45); break;   // circling
      case 'owl': { const s2 = Math.sin(T * 0.7); rot = s2 > 0.75 ? 0.4 : s2 < -0.75 ? -0.4 : 0; break; }                // still, a turn of the head
      case 'bat': case 'flyingfox': dx = 6 * Math.sin(T * 1.25); dy = 3 * Math.sin(T * 2.5); break;                    // looping
      case 'rabbit': case 'macropod': { const p = (T / 1.7) % 1; dy = p < 0.3 ? -Math.sin(Math.PI * p / 0.3) * 4 : 0; dx = 3 * Math.sin(T * 0.2); break; }
      case 'frog': { const P = 3.4, p = (T / P) % 1; dy = p < 0.18 ? -Math.sin(Math.PI * p / 0.18) * 6 : 0; dx = Math.floor(T / P) % 2 ? 2.4 : -2.4; break; }   // waits, then hops
      case 'bee': case 'wasp': case 'fly': dx = 2.4 * Math.sin(T * 13.1) + 2 * Math.sin(T * 3.1); dy = 2.4 * Math.cos(T * 11.3) + 1.6 * Math.sin(T * 2.3); break;   // never still
      case 'butterfly': case 'moth': dx = 5 * Math.sin(T * 1.1); dy = 2.6 * Math.sin(T * 2.2); sx = 0.7 + 0.3 * Math.abs(Math.cos(T * 9)); break;   // flutter
      case 'dragonfly': flit(2.2, 7, 0); break;
      case 'spider': case 'orb': dy = 3.4 * Math.sin(T * 0.9); thread = 1; break;                  // on its thread
      case 'lizard': { const P = 4.2, k = Math.floor(T / P), p = T / P - k; const e = p < 0.06 ? p / 0.06 : 1; dx = lerp(hsh(k - 1, ph) * 8 - 4, hsh(k, ph) * 8 - 4, e); break; }   // a dart, then sun
      case 'snake': rot = 0.2 * Math.sin(T * 1.6); dx = 1.6 * Math.sin(T * 0.8); break;
      case 'turtle': case 'snail': case 'segmented': dx = 2.6 * Math.sin(T * 0.12); break;          // a slow creep
      case 'aquatic': dx = 4 * Math.sin(T * 0.6); dy = Math.sin(T * 1.2); rot = 0.15 * Math.cos(T * 0.6); break;
      case 'grasshopper': { const p = (T / 3) % 1; dx = 3 * Math.sin(T * 0.4); dy = p < 0.15 ? -Math.sin(Math.PI * p / 0.15) * 5 : 0; break; }
      case 'beetle': case 'bug': case 'mantis': dx = 2.4 * Math.sin(T * 0.35); dy = 1.2 * Math.sin(T * 0.5); break;
      default: dx = 4.5 * Math.sin(T * 0.29) + 1.8 * Math.sin(T * 0.83); dy = 3.5 * Math.sin(T * 0.23 + 1.3) + 1.4 * Math.sin(T * 0.67);   // mammals wander
    }
    return { dx: dx * amp, dy: dy * amp, rot, sx, thread };
  }
  /* an animal lost: the area to search, swept by a slow hand */
  function radar(ctx, x, y, R, t, ph = 0, word = '') {
    const a = ((t / 4.5 + ph) % 1) * TAU - Math.PI / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = 'rgba(232,69,60,.10)'; ctx.fill();
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.8; ctx.strokeStyle = C.red; ctx.stroke(); ctx.setLineDash([]);
    for (const k of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.arc(x, y, R * k, 0, TAU); ctx.lineWidth = 0.9; ctx.strokeStyle = 'rgba(232,69,60,.5)'; ctx.stroke(); }
    if (ctx.createConicGradient) { const gr = ctx.createConicGradient(a - 1.1, x, y); gr.addColorStop(0, 'rgba(232,69,60,0)'); gr.addColorStop(1.1 / TAU, 'rgba(232,69,60,.38)'); gr.addColorStop(1.1 / TAU + 0.001, 'rgba(232,69,60,0)'); gr.addColorStop(1, 'rgba(232,69,60,0)'); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, a - 1.1, a); ctx.closePath(); ctx.fillStyle = gr; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.lineWidth = 2; ctx.strokeStyle = C.red; ctx.stroke();
    if (word && R > 34) label(ctx, word, x, y - R - 9, { font: '600 10px "IBM Plex Mono", monospace', align: 'center', color: C.red });
    ctx.restore();
  }

  /* every simple mark carries a word or two, set small under it, so nothing has to be guessed */
  const WORDS = {
    water: 'WATER', shade: 'SHADE', people: 'CHECK IN', still: 'LEAVE BE', plant: 'PLANT', corridor: 'CORRIDOR', refuge: 'COOL ROOM',
    canopy: 'CANOPY', wetland: 'WETLAND', mulch: 'MULCH', ground: 'GROUND', spray: 'NO SPRAY', cat: 'CATS IN', rain: 'RAIN',
    where: 'PLACE', day: 'DAY', night: 'NIGHT', dusk: 'DUSK', any: 'ANY TIME', heat: 'DANGER', partner: 'PLACES', check: 'DONE', past: 'PAST YEARS',
    sound: 'VOICE', out: 'LINK', human: 'PEOPLE', injured: 'HURT', lost: 'LOST', phone: 'CALL', fauna: 'LIVES', story: 'SIGNALS',
    aware: 'NOTICE', harm: 'NO HARM', aid: 'HELP', hug: 'GIG', string: 'STRING', undo: 'UNDO', reset: 'CUT ALL', restore: 'BRING BACK', receipt: 'DIRECT ACTION', hide: 'HIDE', note: 'NOTES', trace: 'TRACE', roll: '58 MM', epson: 'ESC/POS', catprinter: '1-BIT', gbprinter: 'GAME BOY', lora: 'MESH', pager: 'PAGER', qr: 'LINK',
    receive: 'RECEIVE', mesh: 'MESH', bits: '1-BIT', gb: 'GAME BOY', escpos: 'ESC/POS', radar: 'RADAR',
  };

  /* the kinds of life, in words, for every hover */
  const KINDS = {
    bird: 'Bird', parrot: 'Parrot or cockatoo', waterbird: 'Waterbird', owl: 'Owl or frogmouth', raptor: 'Bird of prey', mammal: 'Mammal', macropod: 'Kangaroo or wallaby', possum: 'Possum',
    flyingfox: 'Flying-fox', bat: 'Microbat', rodent: 'Native rodent', fox: 'Fox', cat: 'Cat', dog: 'Dog', rabbit: 'Rabbit', lizard: 'Lizard or skink', snake: 'Snake', turtle: 'Turtle',
    frog: 'Frog', butterfly: 'Butterfly', moth: 'Moth', bee: 'Bee', wasp: 'Wasp', fly: 'Fly or hoverfly', beetle: 'Beetle', bug: 'True bug', spider: 'Spider', orb: 'Orb-weaver',
    grasshopper: 'Grasshopper or cricket', mantis: 'Mantis', dragonfly: 'Dragonfly or damselfly', aquatic: 'Fish and water life', snail: 'Snail or slug', segmented: 'Worm', fungi: 'Fungus', plant: 'Plant', human: 'People',
    paw: 'Animal', ape: 'Orangutan',
  };
  /* the kinds of animal, as six colours: a glyph's group */
  const GROUP = {
    bird: 'bird', parrot: 'bird', waterbird: 'bird', owl: 'bird', raptor: 'bird',
    mammal: 'mammal', macropod: 'mammal', possum: 'mammal', flyingfox: 'mammal', bat: 'mammal', rodent: 'mammal', fox: 'mammal', cat: 'mammal', dog: 'mammal', rabbit: 'mammal', ape: 'mammal',
    butterfly: 'insect', moth: 'insect', bee: 'insect', wasp: 'insect', fly: 'insect', beetle: 'insect', bug: 'insect', grasshopper: 'insect', mantis: 'insect', dragonfly: 'insect',
    spider: 'spider', orb: 'spider', snail: 'spider', segmented: 'spider',
    lizard: 'reptile', snake: 'reptile', turtle: 'reptile', frog: 'water', aquatic: 'water', paw: 'other',
  };
  const GROUP_WORDS = { bird: 'BIRDS', mammal: 'MAMMALS', insect: 'INSECTS', spider: 'SPIDERS, SNAILS, WORMS', reptile: 'REPTILES', water: 'FROGS, FISH', other: 'ANIMAL' };
  const toneOf = g => (GROUP[g] ? 'k-' + GROUP[g] : 'k-other');

  /* the living icons, each with its word: no key is needed on the map, but the guide shows them all */
  const KEY = [
    [{ tone: 'k-bird', g: 'bird' }, 'BIRDS'], [{ tone: 'k-mammal', g: 'possum' }, 'MAMMALS'], [{ tone: 'k-insect', g: 'bee' }, 'INSECTS'], [{ tone: 'k-spider', g: 'orb' }, 'SPIDERS, SNAILS'],
    [{ tone: 'k-reptile', g: 'lizard' }, 'REPTILES'], [{ tone: 'k-water', g: 'frog' }, 'FROGS, FISH'], [{ tone: 'flora', g: 'plant', d: 16 }, 'PLANTS, CLOSE UP'], [{ tone: 'k-mammal', g: 'flyingfox', dz: 3 }, 'SEVERE DANGER'],
    [{ tone: 'k-reptile', g: 'turtle', dz: 4 }, 'EXTREME DANGER'], [{ tone: 'k-water', g: 'frog', sig: true }, 'THREATENED'], [{ tone: 'k-insect', g: 'bee', fresh: true }, 'NEW'], [{ tone: 'hist' }, 'PAST YEARS'],
    [{ tone: 'injured', g: 'possum' }, 'HURT'], [{ tone: 'dead', g: 'bird' }, 'DEAD'], [{ tone: 'lost', g: 'dog' }, 'LOST'], [{ tone: 'need', i: 'shade' }, 'NEED'],
    [{ tone: 'offer', i: 'refuge' }, 'OFFER'], [{ tone: 'event', g: 'frog' }, 'GATHER'], [{ tone: 'event', i: 'hug' }, 'GIG'], [{ tone: 'story', g: 'bee', carried: true }, 'SIGNAL'],
  ];
  /* the five in greatest need move in a way of their own, across the ground they are known from */
  function heroMotion(move, t, ph = 0, amp = 1) {
    const T = t + ph * 11; let dx = 0, dy = 0, rot = 0, sx = 1;
    switch (move) {
      case 'flap': dx = 26 * Math.sin(T * 0.32); dy = 11 * Math.sin(T * 0.64); sx = 0.55 + 0.45 * Math.abs(Math.sin(T * 5.2)); break;         // wings beating on a slow loop between trees
      case 'climb': dy = 12 * Math.sin(T * 0.5); dx = 2 * Math.sin(T * 1.7); rot = 0.12 * Math.sin(T * 0.9); break;                          // up and down a trunk
      case 'flutter': { const a = T * 1.6; dx = 13 * Math.cos(a) + 2.4 * Math.sin(T * 17); dy = 9 * Math.sin(a) + 2.4 * Math.cos(T * 13); sx = 0.6 + 0.4 * Math.abs(Math.cos(T * 11)); break; }   // circling a light
      case 'walk': { const k = Math.sin(T * 0.16); dx = 22 * k; dy = 3 * Math.sin(T * 0.9); sx = Math.cos(T * 0.16) >= 0 ? 1 : -1; break; }   // a slow walk to water and back
      case 'hop': { const P = 2.6, i = Math.floor(T / P), p = T / P - i; const pts = [[-14, 6], [10, 2], [2, -10]]; const a0 = pts[(i + 2) % 3], a1 = pts[i % 3]; const e = Math.min(1, p / 0.22); dx = a0[0] + (a1[0] - a0[0]) * e; dy = a0[1] + (a1[1] - a0[1]) * e - (p < 0.22 ? Math.sin(Math.PI * e) * 12 : 0); break; }
      default: break;
    }
    return { dx: dx * amp, dy: dy * amp, rot, sx };
  }

  window.DA_MARKS = { C, ICONS, GLYPHS, WORDS, KINDS, KEY, TONES, STILL, GROUP, GROUP_WORDS, toneOf, sprite, icon, glyph, pin, printer, pulse, cluster, label, lattice, badge, badgeSprite, motion, heroMotion, radar };
})();
