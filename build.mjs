#!/usr/bin/env node
/* Assemble the site in dist/: plain files, no bundler. `npm run build` */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const nm = path.join(root, 'node_modules'), out = path.join(root, 'dist'), src = path.join(root, 'src');
const read = p => fs.readFileSync(p, 'utf8');
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
/* the build: its commit, and its branch only when Cloudflare names it, so a local build looks like the live one */
const git = cmd => { try { return execSync(`git ${cmd}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const sha = (process.env.WORKERS_CI_COMMIT_SHA || git('rev-parse HEAD') || 'local').slice(0, 7);
const branch = (process.env.WORKERS_CI_BRANCH || '').replace(/[^\w./-]/g, '');
const preview = !!branch && branch !== 'main';
/* lighter over the wire: the app, its style, the QR code and the marks go out minified when esbuild is at hand (it comes with
   wrangler); the commented sources stay in src/. config.js and the other data files go out as written. DA_NOMIN=1 to read them */
let min = code => code;
try { const { transformSync } = await import('esbuild'); if (!process.env.DA_NOMIN) min = (code, loader) => transformSync(code, { loader, minify: true, legalComments: 'none' }).code; } catch { /* plain files */ }

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'vendor/fonts'), { recursive: true });
fs.cpSync(path.join(root, 'repo-static'), out, { recursive: true });
copy(path.join(root, 'README.md'), path.join(out, 'README.md'));
copy(path.join(nm, 'maplibre-gl/dist/maplibre-gl.js'), path.join(out, 'vendor/maplibre-gl.js'));
copy(path.join(nm, 'maplibre-gl/dist/maplibre-gl.css'), path.join(out, 'vendor/maplibre-gl.css'));
fs.writeFileSync(path.join(out, 'vendor/qrcode.js'), '/* qrcode-generator 1.4.4, (c) 2009 Kazuhiko Arase, MIT licence: vendor/LICENSES.md */\n' + min(read(path.join(nm, 'qrcode-generator/qrcode.js')), 'js'));

/* type: Poppins (display, labels, text), IBM Plex Mono (numbers, coordinates, codes), VT323 for the teletype slip, and four faces for the press */
const fonts = [['Poppins', 200, 'normal', 'poppins'], ['Poppins', 400, 'normal', 'poppins'], ['Poppins', 400, 'italic', 'poppins'],
  ['Poppins', 600, 'normal', 'poppins'], ['Poppins', 700, 'normal', 'poppins'],
  ['IBM Plex Mono', 400, 'normal', 'ibm-plex-mono'], ['IBM Plex Mono', 500, 'normal', 'ibm-plex-mono'], ['IBM Plex Mono', 600, 'normal', 'ibm-plex-mono'],
  ['VT323', 400, 'normal', 'vt323'],
  /* for the press: a flourished serif, a blackletter as on a rider's arm, a spray can, and bubble letters */
  ['Playfair Display', 400, 'italic', 'playfair-display'], ['Playfair Display', 700, 'italic', 'playfair-display'],
  ['UnifrakturMaguntia', 400, 'normal', 'unifrakturmaguntia'], ['Sedgwick Ave Display', 400, 'normal', 'sedgwick-ave-display'], ['Rubik Bubbles', 400, 'normal', 'rubik-bubbles']];
const faces = [], files = [];
for (const [fam, w, st, pkg] of fonts) {
  const file = `${pkg}-latin-${w}-${st}.woff2`; files.push(`vendor/fonts/${file}`);
  copy(path.join(nm, `@fontsource/${pkg}/files/${file}`), path.join(out, 'vendor/fonts', file));
  faces.push(`@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};font-display:swap;src:url(vendor/fonts/${file}) format('woff2')}`);
}
fs.writeFileSync(path.join(out, 'style.css'), '/* Type: Poppins, IBM Plex Mono, VT323, Playfair Display, UnifrakturMaguntia, Sedgwick Ave Display and Rubik Bubbles, SIL Open Font License, kept in vendor/fonts */\n' + faces.join('\n') + '\n\n' + min(read(path.join(src, 'app.css')), 'css'));
/* the app: every file in src/app, in name order, as one script */
fs.writeFileSync(path.join(out, 'app.js'), min(fs.readdirSync(path.join(src, 'app')).filter(f => f.endsWith('.js')).sort().map(f => read(path.join(src, 'app', f))).join('\n'), 'js'));
for (const name of ['config.js', 'places.js', 'examples.js', 'field.js', 'briefs.js', 'field.html']) copy(path.join(src, name), path.join(out, name));
fs.writeFileSync(path.join(out, 'marks.js'), min(read(path.join(src, 'marks.js')), 'js'));
/* the guide reads the same marks and words as the app, in the same type */
fs.writeFileSync(path.join(out, 'guide.html'), read(path.join(src, 'guide.html')).replace('/*FONTS*/', faces.join('\n')));
fs.writeFileSync(path.join(out, 'portfolio.html'), read(path.join(src, 'portfolio.html')).replace('/*FONTS*/', faces.join('\n')));
fs.appendFileSync(path.join(out, 'vendor/LICENSES.md'), '\n## Fonts, `fonts/`\n\nPoppins (Indian Type Foundry, Jonny Pinhorn), IBM Plex Mono (IBM, Mike Abbink, Bold Monday), VT323 (Peter Hull), Playfair Display (Claus Eggers Sorensen), UnifrakturMaguntia (j. "mach" wust), Sedgwick Ave Display (Kevin Burke, Pedro Vergani) and Rubik Bubbles (NaN, Luke Prowse), each under the SIL Open Font License 1.1: https://openfontlicense.org\n');
const sw = read(path.join(out, 'sw.js')).replace("'vendor/qrcode.js', ", "'vendor/qrcode.js', " + files.map(f => `'${f}'`).join(', ') + ', ');
fs.writeFileSync(path.join(out, 'sw.js'), sw);
/* a preview is never indexed by search engines */
if (preview) fs.appendFileSync(path.join(out, '_headers'), '\n/*\n  X-Robots-Tag: noindex, nofollow\n');
/* the Worker learns which build it is, so a preview keeps to its own database, and the partner places that print,
   from the same settings the app reads. Written here, never by hand, never committed */
const win = {}; vm.runInNewContext(read(path.join(src, 'config.js')) + '\n' + read(path.join(src, 'places.js')), { window: win });
const partners = (win.DA_PARTNERS || []).map(p => { const pl = (win.DA_PLACES || []).find(x => x.partner === p.id) || {}; return { id: p.id, n: pl.n || p.id, sub: pl.sub || '', paper: String(p.paper || 58), printer: !!p.printer }; });
if (win.DA_MASTER) partners.unshift({ id: win.DA_MASTER.id, n: win.DA_MASTER.n, sub: '', paper: String(win.DA_MASTER.paper || 80), printer: true });
fs.writeFileSync(path.join(src, 'worker', 'stamp.js'), `/* written by build.mjs: never edited by hand, never committed */\nexport const BUILD = ${JSON.stringify(sha)};\nexport const PREVIEW = ${preview};\nexport const PARTNERS = ${JSON.stringify(partners)};\n`);
/* the studio: the whole radio, W.I.S.H. and PRINT, as it was built through the pilot, at /studio */
const body = read(path.join(src, 'body.html'));
fs.writeFileSync(path.join(out, 'studio.html'), `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>novel.global</title>
<meta name="description" content="novel.global: research and development for direct action. Listen to the lives around you, make a W.I.S.H., print it.">
<meta name="theme-color" content="#06090B">
<meta name="da-build" content="${sha}${preview ? ` ${branch}` : ''}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="icon" href="icon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preload" href="vendor/fonts/poppins-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="vendor/fonts/poppins-latin-200-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="vendor/fonts/ibm-plex-mono-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="vendor/maplibre-gl.css">
<link rel="stylesheet" href="style.css">
<script>
/* plain unless the devices were turned back on; and a visitor sent here by the base never walks the first visit again: the base is the first visit now */
try { var dp = JSON.parse(localStorage.getItem('da.prefs') || '{}'); if (localStorage.getItem('da.devices') !== '1') document.documentElement.classList.add('plain');
  if (/[?&]from=base/.test(location.search)) { window.__fromBase = true; if ((dp.journey || 0) < 4) { dp.journey = 4; localStorage.setItem('da.prefs', JSON.stringify(dp)); } history.replaceState(null, '', location.pathname + location.hash); } } catch (e) { document.documentElement.classList.add('plain'); }
</script>
</head>
<body>
${body}
<script src="config.js"></script>
<script src="places.js"></script>
<script src="examples.js"></script>
<script src="field.js"></script>
<script src="briefs.js"></script>
<script src="marks.js"></script>
<script src="vendor/maplibre-gl.js"></script>
<script src="vendor/qrcode.js"></script>
<script src="app.js"></script>
</body>
</html>
`);
/* the base, at /: what was noticed, a photograph and a sentence, its key facts and a few connections, printed. No map library, no
   webfonts, no data until asked for: the field list, the outlook and the case studies come as one pack, base-db.json */
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] != null && o[k] !== '').map(k => [k, o[k]]));
const lib = {}; vm.runInNewContext(read(path.join(src, 'field.js')) + '\n' + read(path.join(src, 'briefs.js')), { window: lib });
const O = win.DA_OUTLOOK || {};
fs.writeFileSync(path.join(out, 'base-db.json'), JSON.stringify({
  v: sha,
  field: (lib.DA_FIELD || []).map(f => pick(f, ['id', 'cn', 'n', 'g', 'st', 'where', 'act', 'brd', 'heat', 'water', 'event', 'aware', 'harm', 'help', 'call', 'note'])),
  briefs: (lib.DA_BRIEFS || []).map(b => pick(b, ['id', 'th', 't', 'after', 'city', 'yr', 'fact', 'url', 'g', 'm', 'dz', 'i'])),
  outlook: pick(O, ['start', 'h', 'say', 'windows', 'nino', 'tmax', 'hot']),
  links: win.DA_LINKS || [],
  /* where a noticing is: the named places and waters near it, and the suburb's canopy */
  places: (win.DA_PLACES || []).map(p => [p.n, +(+p.lat).toFixed(5), +(+p.lng).toFixed(5)]),
  waters: ((win.DA_WATERS || {}).points || []).map(w => [w[0], w[1], w[2]]),
  canopy: Object.fromEntries(Object.entries(win.DA_CANOPY || {}).filter(([k, v]) => v && v.pc).map(([k, v]) => [k, v.pc])),
}));
const BASE = { imagery: win.DA_CONFIG.IMAGERY.url, maxzoom: win.DA_CONFIG.IMAGERY.maxzoom, credit: win.DA_CONFIG.IMAGERY.attribution, centre: [win.DA_CONFIG.SCAN.lat, win.DA_CONFIG.SCAN.lng], bbox: win.DA_CONFIG.BBOX,
  portal: win.DA_CONFIG.PORTAL_URL, inat: win.DA_CONFIG.INAT_API, master: win.DA_MASTER || null, printers: win.DA_PRINTERS || {}, contacts: win.DA_CONTACTS || [], build: sha };
fs.writeFileSync(path.join(out, 'base.css'), min(read(path.join(src, 'base', 'base.css')), 'css'));
fs.writeFileSync(path.join(out, 'base.js'), min(read(path.join(src, 'base', 'base.js')), 'js'));
fs.writeFileSync(path.join(out, 'index.html'), read(path.join(src, 'base', 'index.html')).replace('/*BASE*/', 'window.BASE = ' + JSON.stringify(BASE).replace(/</g, '\\u003c') + ';').replace('%BUILD%', sha + (preview ? ` ${branch}` : '')));
const listing = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => (d.isDirectory() ? listing(path.join(dir, d.name), base) : [path.relative(base, path.join(dir, d.name))])).sort();
const all = listing(out);
console.log(`${all.length} files, ${Math.round(all.reduce((n, f) => n + fs.statSync(path.join(out, f)).size, 0) / 1024)} KB in dist/, build ${sha}${preview ? `, PREVIEW ${branch}` : ''}`);
