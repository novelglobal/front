#!/usr/bin/env node
/* Assemble the site in dist/: plain files, no bundler. `npm run build` */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
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

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'vendor/fonts'), { recursive: true });
fs.cpSync(path.join(root, 'repo-static'), out, { recursive: true });
copy(path.join(root, 'README.md'), path.join(out, 'README.md'));
copy(path.join(nm, 'maplibre-gl/dist/maplibre-gl.js'), path.join(out, 'vendor/maplibre-gl.js'));
copy(path.join(nm, 'maplibre-gl/dist/maplibre-gl.css'), path.join(out, 'vendor/maplibre-gl.css'));
copy(path.join(nm, 'qrcode-generator/qrcode.js'), path.join(out, 'vendor/qrcode.js'));

/* type: Poppins (display, labels, text) and IBM Plex Mono (numbers, coordinates, codes) */
const fonts = [['Poppins', 200, 'normal', 'poppins'], ['Poppins', 400, 'normal', 'poppins'], ['Poppins', 400, 'italic', 'poppins'],
  ['Poppins', 600, 'normal', 'poppins'], ['Poppins', 700, 'normal', 'poppins'],
  ['IBM Plex Mono', 400, 'normal', 'ibm-plex-mono'], ['IBM Plex Mono', 500, 'normal', 'ibm-plex-mono'], ['IBM Plex Mono', 600, 'normal', 'ibm-plex-mono']];
const faces = [], files = [];
for (const [fam, w, st, pkg] of fonts) {
  const file = `${pkg}-latin-${w}-${st}.woff2`; files.push(`vendor/fonts/${file}`);
  copy(path.join(nm, `@fontsource/${pkg}/files/${file}`), path.join(out, 'vendor/fonts', file));
  faces.push(`@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};font-display:swap;src:url(vendor/fonts/${file}) format('woff2')}`);
}
fs.writeFileSync(path.join(out, 'style.css'), '/* Type: Poppins and IBM Plex Mono, SIL Open Font License, kept in vendor/fonts */\n' + faces.join('\n') + '\n\n' + read(path.join(src, 'app.css')));
/* the app: every file in src/app, in name order, as one script */
fs.writeFileSync(path.join(out, 'app.js'), fs.readdirSync(path.join(src, 'app')).filter(f => f.endsWith('.js')).sort().map(f => read(path.join(src, 'app', f))).join('\n'));
for (const name of ['config.js', 'places.js', 'examples.js', 'field.js', 'briefs.js', 'marks.js', 'field.html']) copy(path.join(src, name), path.join(out, name));
/* the guide reads the same marks and words as the app, in the same type */
fs.writeFileSync(path.join(out, 'guide.html'), read(path.join(src, 'guide.html')).replace('/*FONTS*/', faces.join('\n')));
fs.appendFileSync(path.join(out, 'vendor/LICENSES.md'), '\n## Fonts — `fonts/`\n\nPoppins (Indian Type Foundry, Jonny Pinhorn) and IBM Plex Mono (IBM, Mike Abbink, Bold Monday), each under the SIL Open Font License 1.1: https://openfontlicense.org\n');
const sw = read(path.join(out, 'sw.js')).replace("'vendor/qrcode.js', ", "'vendor/qrcode.js', " + files.map(f => `'${f}'`).join(', ') + ', ');
fs.writeFileSync(path.join(out, 'sw.js'), sw);
/* a preview is never indexed by search engines */
if (preview) fs.appendFileSync(path.join(out, '_headers'), '\n/*\n  X-Robots-Tag: noindex, nofollow\n');
const body = read(path.join(src, 'body.html'));
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Direct Action</title>
<meta name="description" content="A radar over Brunswick to the city: live iNaturalist sightings, the El Niño threat to each life, string figures between them and the places around them, and a four-line W.I.S.H. slip for small printers, mesh radios and pagers.">
<meta name="theme-color" content="#0CCBBD">
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
const listing = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => (d.isDirectory() ? listing(path.join(dir, d.name), base) : [path.relative(base, path.join(dir, d.name))])).sort();
const all = listing(out);
console.log(`${all.length} files · ${Math.round(all.reduce((n, f) => n + fs.statSync(path.join(out, f)).size, 0) / 1024)} KB in dist/ · build ${sha}${preview ? ` · PREVIEW ${branch}` : ''}`);
