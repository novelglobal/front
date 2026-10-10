# Direct Action — developer handover

Direct Action is a web app for the El Niño summer of 2026–27, covering Brunswick to the Melbourne CBD. It shows live iNaturalist sightings on a radar over satellite imagery, with the El Niño threat to each life. When someone opens a life, its radius shows the human ecology around it: shops, brands, the circular economy, artists, third spaces and networks. People join string figures between the life and those places, listen to them, and write a W.I.S.H.

W.I.S.H. is the concept: a praxis poem. **NOTICED** is the intention to respond. **RESPONSE** is the W.I.S.H. itself: taking on responsibility, joining theory to action, and reflecting. **DIRECT ACTION** makes it a pledge, printed as a receipt at a partner place, sent by mesh where that place has a radio, and kept on novel.global. The name W.I.S.H. and its four lines stay as they are.

The app works offline in the browser. Stages 1 to 3 of `docs/roadmap.md` are built: the map fixes, stories shared with approval, and print queues pulled by a Raspberry Pi at each partner place. Next comes live data behind the Worker (stage 4).

Read this file first. Then read `README.md`, which is what users see, and `docs/brief.md`, which explains the product decisions and their sources.

## Status at a glance

| Area | State |
|---|---|
| Web app (map, cells, strings, ledger, constellations, slip, outputs, sharing, partners) | Built and working, with 160 browser checks and 18 server checks |
| Hosting | The Cloudflare Worker `front` builds this repo on every push. `main` is live at `novel.global`; any other branch, such as `staging`, gets its own preview address. See `docs/workflow.md` |
| Source and build | This tree is the GitHub repo `front`. `npm run build` writes `dist/`, which is the deployable site |
| Worker | `src/worker/index.js`: stories sent and approved, a print queue for each partner place, the approval page's requests, all on D1 (`front-db`; previews use `front-db-preview`) |
| Approval page | `/admin`, behind the `ADMIN_KEY` Worker secret. Stories wait there until shown or refused; printers are paired there |
| Print queue | Built on D1, not a Durable Object. Jobs wait for approval (unless a printer is set to print without it), a day at most |
| Pi receiver | `receiver/pull.py` (standard library; printd for the printer, Meshtastic for a radio), `da-pull.service`, and step-by-step setup in `receiver/README.md`. Tested end to end against the Worker; the hardware at Pickles is still to be set up |
| Live data behind the Worker | Not built. This is stage 4. Each browser still calls iNaturalist, Overpass and Open-Meteo directly |
| Prototype deadline | One receiver and one printer, with a repeatable end-to-end demo, by 16 October 2026 |

## What is built and working

### The map and the radar

- The map opens bare, with only the radar and two tabs. A slow hand sweeps the circle, and each life it passes stays on the map.
- The base layer is Esri World Imagery over AWS Terrain Tiles, drawn with MapLibre. There are no roads or labels. Tilting the map past about 22° switches on 3D terrain.
- Dragging the centre moves the radar, dragging the rim sets its reach (250 to 1,500 m), and clicking outside the circle sends the radar there. Clicking the centre plays every figure inside the radar as a song.
- Outside the radar, only urgent lives are shown: an animal hurt, dead or lost, a life in extreme danger, a threatened life, and the "five in greatest need".
- Holding the left button on open ground (or pressing and holding on a phone) starts a new record, which is saved on the device.

### A life and its radius

- Clicking or right-clicking a life opens its card and its own radius (50 to 1,500 m). The card shows the photograph, name, chips, threat, one fact, the months it is seen here, the ledger and the strings.
- Inside the radius every place, group, water body, other life and knot of the user's own becomes a knot. Places come from two sources:
  - `src/places.js` lists 54 real places by name: 17 circular, 13 artists, 11 third spaces, 6 brands, 6 networks and 1 service. Each has its address, site and a one-line description. Eleven positions are approximate and are marked `a: 1`.
  - OpenStreetMap places are fetched from Overpass per 0.01° tile and cached on the device for 14 days. Failed answers are never cached, and the app backs off for 90 seconds after a failure.
- Each place has a role. Ten roles are "on notice" (they harm life), such as takeaway containers, plastic bottles, litter, paint, pesticides, spraying, detergent and oil, night light, new clothing and microfibres. Fourteen roles are "to back", such as repair, reuse, refill, markets, growers, labels, studios, artist spaces, third spaces and networks.
- `DA_PRESSURES` in `config.js` maps each kind of life to the harms that matter to it. The ledger counts them in plain words, for example "15 sell takeaway containers" or "1 sells pesticides". It also counts the places that can help.
- A thin orange thread runs from the life to every place that harms it, and any string joined to such a place is drawn orange.

### The interaction grammar

- A click on a knot looks at it and plays its sound. A small card shows its name, what it does that matters here, and its distance. The card has no buttons, apart from a close button. The name opens the life or the place's own site.
- A second click, a right-click or a long press on a phone joins the knot. A right-click on a joined knot lets it go.
- A right-click on a life outside the radius widens the radius and joins that life.
- A right-click on open ground backs out of whatever is open and returns to the radar. It also cancels a record that is being placed. Esc does the same.
- Delete removes a knot that the user made. Clicking open ground inside the radius adds a knot of the user's own, which can be a place, a person or an idea.
- Clicking a ledger row once lights those places on the map. Clicking it again joins all of them to the life.

### Sounds

- Sounds use Web Audio and are soft, slow and sparse. Each kind of life has an instrument and a short motif, such as a whistle for birds, a kalimba for frogs, a music box for bees and butterflies, glass for bats and flying-foxes, and wood for lizards and turtles.
- Each part of the human ecology makes a small real sound: a sleeve for brands, two taps for the circular economy, a cup for services, a pencil for artists, a hum for third spaces, two hums for networks and a breath for people.
- A string plays a pitch set by its length. Sound can be turned off in Settings.

### Constellations

- Every figure is saved on the device, can be named, and is listed on the NOW page as it forms. Each entry shows a star chart, counts of places and lives, and links to other figures that share knots with it.
- A figure can be played as a song or traced string by string, in the order it was made, with a caption. The card also shows a small preview of the print the figure will make.

### The W.I.S.H. and the slip

- **NOTICED** turns the card over to the W.I.S.H. The photograph appears in black and white with Atkinson dithering. It can be changed to another photograph of the same life, the user's own photograph, or none. Only photographs whose licence allows a black and white version are offered (`licAdaptable`), and each is credited.
- The statement opens as two full sentences for that kind of life, from `DA_STATEMENT` or the hero's own statement. It can be rewritten, the edit is kept for that sighting, and it can be reset to the original.
- Below that are four blank W.I.S.H. lines of up to 48 characters each, with the relations to tick and rename, and an optional note. The letters W, I, S and H are never printed.
- **RESPONSE** issues the W.I.S.H. as a signal with a code such as `DA-7K2Q`, with all, some or none of its lines written. The signal is laid out like an archive record:
  - The photograph, as tall as everything under it, with its credit.
  - The life, its site and its window of danger, set small.
  - The statement and the lines written.
  - The figure as it lies on the ground, small, with numbered points and dashed strings to harmful places; then RELATIONS, numbered to match and grouped as HARM (in plain words), CARE and ALSO, with each listed place's site.
  - A QR code that carries the whole signal.
- **DIRECT ACTION** makes it a pledge: the slip is sent to a partner place's print queue (with ESC/POS bytes for that printer's paper and its 200-byte mesh line), or to novel.global alone. It waits for approval, then is printed, sent by mesh where the place has a radio, and kept on the board for everyone. The slip's status line follows it: waiting, in the queue, printed.

### Outputs

| Output | What it produces | Where it is made |
|---|---|---|
| 58 mm print | A browser print sized to a 58 mm strip | `printSlip()` in `60-paper.js` |
| ESC/POS | Raw bytes: initialise, the photograph as `GS v 0` raster in 255-row bands, the text, a native QR code (`GS ( k`, model 2) and a cut | `escpos()` |
| 1-BIT | A PNG 384 dots wide, two colours | `slipPNG(s, 384, 2)` |
| GAME BOY | A PNG 160 pixels wide in four greys | `slipPNG(s, 160, 4)` |
| MESH | Plain text of up to 200 bytes for a LoRa mesh radio | `meshText()` |
| PAGER | Plain text of up to 80 characters | `pagerText()` |
| LINK | The whole signal in a URL (`#x=…`) | `linkOf()`, `packSignal()` |

Each output machine is drawn as its hardware and links to a reference page about it. Pasting a link, a packed signal or a mesh message into RECEIVE on the STORIES page brings a signal back into the app.

### The pages

- **NOW** shows the El Niño outlook strip, the five in greatest need (each of which can be swapped for any life), anything hurt or lost right now, the constellations, and gigs.
- **STORIES** shows the signals board (the device's own signals plus three examples marked EX), the six caring groups, the tools (the field list, the guide, a blank slip to fill by hand, and four CSV downloads) and the settings.
- `field.html` is a field list of 204 kinds of life. `guide.html` is a visual key to every mark, kept under about 620 words.

### How data flows today

Everything runs in the browser. There is no server code yet.

| Data | Source | How it is fetched |
|---|---|---|
| Sightings | iNaturalist API | On open: up to 5 pages × 200 from the last 45 days, cached on the device for 60 minutes. While the page is visible, new sightings are fetched every 5 minutes with `id_above`. The same weeks in the past two years are also fetched |
| Photographs and sounds | iNaturalist open data (S3) | Direct from the browser. Dithering needs CORS (see known bugs) |
| Places | `places.js` plus Overpass | Per tile, as described above |
| Weather | Open-Meteo | Hourly |
| Drinking fountains and air temperature | City of Melbourne open data | Only on days of 35° or more |
| Gatherings | A published CSV (`EVENTS_URL`), empty by default | On open |
| Outlook, threats, statements, roles, heroes, groups | `config.js` | Bundled with the app |

## The stack

### Built today

- Plain HTML, CSS and JavaScript, with no framework and no bundler. The files in `src/app/` are concatenated in name order into one script, `dist/app.js`, which runs as a single IIFE. Data and settings are separate `window.DA_*` files so that non-developers can edit them.
- MapLibre GL 4, qrcode-generator, and the Poppins and IBM Plex Mono fonts (from Fontsource) are all vendored at build time. Nothing is loaded from a CDN.
- A service worker (`repo-static/sw.js`, cache `da-v10`) serves the app shell network-first and keeps the shell offline.
- Node 20 or later builds the site with `build.mjs` and runs the tests with Playwright and sharp.
- The built `dist/` is deployed as the Cloudflare Worker `front`, using static assets. The domain `novel.global` uses Cloudflare nameservers.

### Planned next (tasks 1 to 5)

```text
phone or laptop (the web app)
   │  POST /api/print/:receiver   ESC/POS bytes, base64
   ▼
Cloudflare Worker `front`        serves dist/ as static assets and handles /api/*
   │
   ▼
Durable Object `PrintQueue`      one instance per receiver; SQLite storage; jobs, leases, status
   ▲
   │  GET /api/receivers/:id/next   long-poll over Wi-Fi with a bearer token; no inbound ports
   │
Raspberry Pi 3 A+  ──  pull bridge (systemd)  ──  printd on 127.0.0.1:8080  ──  USB  ──  Epson TM-T88V
```

- **Why pull rather than push.** Receivers will sit in cafés and fashion shops. Pulling needs no inbound ports, no port forwarding, and no software installed by staff. It also keeps working behind any shop's Wi-Fi.
- **printd** ([HansF/printd](https://github.com/HansF/printd)) is a small FastAPI server that drives ESC/POS printers through python-escpos. It is push-only: clients POST to it. Its endpoints include `POST /print` (an image, converted to 1-bit and sent as a single `GS v 0` raster), `POST /print/raw` (base64 ESC/POS bytes), `/cut`, `/feed`, `/status` and `/healthz`. Authentication is a static bearer token, `PRINTD_API_KEY`. It is configured with environment variables: `PRINTD_PRINTER_KIND=usb`, `PRINTD_DEVICE=/dev/usb/lp0`, `PRINTD_PRINT_WIDTH`, `PRINTD_HOST` and `PRINTD_PORT`. Its README notes that a Raspberry Pi needs a udev rule so that the `lp` group owns `/dev/usb/lp0`, and that only one printer model has been verified. On the Pi, printd stays on localhost, and a small pull bridge feeds it.
- **Hardware:**
  - Epson TM-T88V (USB), powered by an Epson PS-180 (24 V).
  - Raspberry Pi 3 Model A+ (512 MB RAM) with a 5 V 2.5 A supply.
  - A 32 GB microSD card.
  - A USB-A to USB-B cable.
- **The TM-T88V's datasheet** gives 42 or 56 columns on 80 mm paper and 30 or 40 on 58 mm paper, depending on the font. Its resolution is about 180 dpi, so an 80 mm roll has roughly 512 printable dots across. The app's ESC/POS output is currently tuned for 58 mm (see known bugs). Hold FEED while switching the printer on to print its self-test, then confirm the paper width and settings before tuning anything.

## File structure

```text
.
├── HANDOVER.md            this file
├── README.md              user-facing; copied into dist/
├── docs/brief.md          the product brief: problem, decisions, sources
├── docs/roadmap.md        the stages from here to live, shared data
├── docs/workflow.md       how a change goes from this folder to a preview, then to novel.global
├── build.mjs              npm run build → dist/, stamped with its commit (and its branch on a preview)
├── wrangler.jsonc         the Worker `front`: dist/ as static assets, src/worker for everything else, two D1 databases
├── receiver/              the partner place's Raspberry Pi: pull.py, da-pull.service, da-pull.env.example, README.md
├── package.json           dependencies: maplibre-gl, qrcode-generator, @fontsource/*; dev: playwright, sharp, jsqr, wrangler
├── repo-static/           copied into dist/ as is: sw.js, manifest.webmanifest, icons, LICENSE, _headers, admin.html and admin.js (the approval page), vendor/LICENSES.md
├── src/
│   ├── worker/index.js    the Worker: /api/stories, receipts, photos, partners, printers (the receivers' pull) and admin
│   ├── worker/stamp.js    written by build.mjs: the build, whether it is a preview, the partner places. Never committed
│   ├── body.html          the app's markup (index.html is generated around it)
│   ├── app.css            every style (style.css = font faces + this)
│   ├── config.js          window.DA_*: settings and data (see below)
│   ├── places.js          window.DA_PLACES: the 57 listed places, the three partners among them
│   ├── marks.js           window.DA_MARKS: colours, icons, glyphs, badges, motion; shared by app, guide and paper
│   ├── field.js           window.DA_FIELD: 204 kinds of life (used by field.html and the app)
│   ├── briefs.js          window.DA_BRIEFS: 50 design briefs with sources
│   ├── examples.js        three example signals, marked EX
│   ├── field.html         the field list page
│   ├── guide.html         the visual key (fonts are injected at build)
│   └── app/               concatenated in name order into dist/app.js
│       ├── 00-core.js     helpers, state S, local storage, the sound engine `snd`
│       ├── 10-data.js     iNaturalist fetch and compact(), live polling, history, heroes, groups, weather, events, the local ledger
│       ├── 20-orbit.js    places: listed plus Overpass tiles; roles and harms for each place
│       ├── 30-map.js      MapLibre setup; click, right-click and long-press grammar; hot-day overlays
│       ├── 35-life.js     the radar, badges drawn on canvas, hit-testing, hover tags, the song
│       ├── 40-panel.js    rail; NOW (outlook, five, alarms, constellations, gigs); STORIES; CSV downloads
│       ├── 45-strings.js  string figures: knots, peek card, joins, ledgerOf, snapshot, constellations, trace
│       ├── 50-card.js     the card, ledger and strings section; the slip (statement, photograph, relations); issue; placing records
│       ├── 60-paper.js    signals: pack and unpack, text, QR, dithering, slip HTML, PNG, ESC/POS (58 or 80 mm), print, story cells, remix, receive
│       ├── 65-share.js    the shared board, DIRECT ACTION, the outbox, the sender's receipts, partners, RECEIVE by code
│       └── 70-boot.js     start-up, hash routing, live polling, tooltips, the debug handle window.__da
└── test/
    ├── run.mjs            Playwright end-to-end checks; every outside host is mocked, and /api/ goes to the real Worker on a fresh local database
    ├── api.mjs            the Worker's own checks, and pull.py run against it
    └── fixtures.mjs       fake sightings, places, map tiles, photographs and weather
```

`dist/` is build output and is ignored by git. Never edit files in `dist/` by hand. In particular, `dist/app.js` is a concatenation of `src/app/*.js`.

### `config.js` at a glance

| Key | What it holds |
|---|---|
| `DA_CONFIG` | `BBOX`, `DAYS`, `PAGES`, `HISTORY`, `INAT_API`, `IMAGERY`, `DEM_URL`, `WEATHER_URL`, `OVERPASS`, `OVERLAYS`, `RADIUS`, `SCAN`, `SIGNAL` (48 / 200 / 80), `PORTAL_URL`, `EVENTS_URL`, `ELNINO`, `COUNTRY`, `REFRESH_MIN`, `LIVE_MIN` |
| `DA_THREAT` and `DA_STATEMENT` | A one-line threat and a two-sentence statement for each kind of life |
| `DA_ROLES` | The 24 roles. Each has a word, a plain phrase, a duty line, a family, whether it is on notice, and an optional sourced fact |
| `DA_PRESSURES` | Kind of life → the harm roles that matter to it |
| `DA_FAMILIES` | The seven parts of the human ecology and their sounds |
| `DA_OUTLOOK` | The El Niño outlook by month, the danger windows and their sources |
| `DA_HEROES`, `DA_TRIBES`, `DA_WATERS`, `DA_CANOPY`, `DA_NEEDS` | The five in greatest need, the six caring groups, waterways, canopy cover and needs |
| `DA_OUTPUTS` | The output machines, their icons and reference links |
| `DA_PRINTERS` | Receipt paper: dots and columns for 58 mm and 80 mm |
| `DA_PARTNERS` | The partner places that print: id (its print queue), whether a printer is there now (marked on the map, always), its paper |
| `FRESH_H`, `SCAN.find` | Outside the radar, only the last 24 hours; on a first visit the radar may move up to 1.5 km to where most kinds of animals were seen |

### What the device stores (`localStorage`)

| Key | Contents |
|---|---|
| `da.ledger.v4` | Placed records and issued or received signals (the local board) |
| `da.figs.v1` | String figures for each cell, with timestamps, birth time and name (at most 80) |
| `da.notes.v1`, `da.st.v1`, `da.slip.v1`, `da.draft.<id>` | Notes, rewritten statements, slip options and drafts |
| `da.img.v1`, `da.own.v1` | The chosen photograph for each cell, and the user's own photographs (at most 14, as 800 px JPEGs) |
| `da.obs.v3`, `da.hist.v1`, `da.tx.v2`, `da.hg.v1`, `da.wx.v3`, `da.tiles.v5` | Caches for sightings, history, taxa (with their kind's photograph), histograms, weather and place tiles |
| `da.prefs`, `da.me`, `da.five.v1`, `da.hide.v1` | Settings (and `found`, once the first radar has looked for life), the user's name and device id, the swapped five, and hidden cells |
| `da.shared.v1`, `da.sent.v1`, `da.outbox.v1`, `da.partners.v1` | The board as last fetched; what this device sent and how far it got; what waits for a signal; the printers as last heard |

### What the server stores (D1)

| Table | Contents | Kept |
|---|---|---|
| `stories` | A story (its packed signal) or a record (JSON, never its contact), its photograph re-encoded on the device, where it is, the partner it was sent to, waiting, shown or refused | Shown: until deleted on the approval page. Waiting or refused: 30 days |
| `jobs` | A print for a partner's printer: its ESC/POS bytes and mesh line, held, queued, printing, printed, failed or expired | Waiting: a day. Printed: its status only, a week |
| `printers` | Each partner place's printer: its paper, whether it prints without approval, whether it has a mesh radio, a hash of its token, when it last asked | Until unpaired |
| `hits` | A count of requests, under a daily-salted hash of the sender's address, to slow anyone sending too many | An hour |

### The signal format

A signal travels as `#x=` followed by base64url-encoded JSON. The fields are as follows:

- `c` is the code and `t` is the issue time in minutes, in base 36.
- `p` is `[lat, lng, kind, common name, latin name, place, iNaturalist id]`.
- `l` holds the four lines.
- `k` holds the knots as `[key, type, name, role|kind, bearing, distance]`. A place that harms the life has its role prefixed with `!`.
- `e` holds the edges.
- `s` is the statement, or `1` when it is unchanged from the default.
- `o` is the note, `i` is the photograph as `photo-id.ext|attribution|licence|observation-id`, `b` is the brief and `y` is the name.

Keep this format backwards compatible, because printed QR codes will outlive releases.

## How to run

```sh
npm ci
npm run build                     # writes dist/
npm run dev                       # builds, then serves dist/ and the Worker at http://localhost:8787
npm test                          # builds, then runs every check (about 12 minutes in software WebGL)
ONLY=strings npm run test:one     # one group
```

On a new machine, install Playwright's Chromium once with `npx playwright install chromium`. `npm run test:api` runs the Worker's checks alone (Python runs `pull.py` against it where it is installed). The browser test groups are `smoke`, `first`, `radar`, `strings`, `places`, `wish`, `outputs`, `board`, `share`, `place`, `lost`, `hide`, `phone`, `hot`, `offline`, `field`, `events`, `guide` and `static`. Two more groups only run when named: `dbg` runs a script file inside the page, and `look` takes screenshots. Screenshots are written to `test/shots/`. In the browser console, `window.__da` exposes the app's state and functions for debugging.

## Design rules

- **The ground stays quiet.** The site lands on NOW, with the radar framed beside it; a link to another page lands on NOW too. Sound waits for a first touch (browsers keep pages quiet until then), when the radar plays what it has found so far. The radar is the only thing on the ground, with the partner places' printers. Nothing outside the radar is darkened, and only what is from the last 24 hours appears there.
- **Labels, not sentences.** The interface uses short labels. Full, plain sentences are kept for statements and documentation. Copy counts things instead of judging them, as in "15 sell takeaway containers". A place is counted by its kind of trade and never judged on its own. Nothing may claim that a place, council or group endorses the project.
- **Fixed colour meanings.**
  - Danger ahead, in the coming months, runs from pale orange (prepare) through orange and red to black (extreme): `--deg0` to `--deg4`.
  - Red, with its pulse or its call, means now: hurt, dead or lost.
  - The neon highlighter means on notice.
  - Teal is the page and the circular economy, cobalt is for lines and links, and navy is the ink.
  - The animal groups have their own colours in `marks.js`.
  - Never reuse orange, red or neon for anything else.
- **Two typefaces.** Use Poppins and IBM Plex Mono only. Numbers, codes, coordinates and labels are set in mono.
- **One mark family.** Every icon and glyph lives in `marks.js` on a 16-unit grid and feeds the app, the guide and the paper. Add new icons there.
- **Paper is an archive record.** It uses black and white only, with the photograph as half the slip and its credit under it. Labels are in mono. The constellation sits above the relations, small, its points numbered as the relations are, grouped as HARM, CARE and ALSO. No figure numbers, no compass words. The letters W, I, S and H never print, each line holds up to 48 characters, and a slip with no lines prints as it stands.
- **Three steps, three words.** NOTICED, RESPONSE, DIRECT ACTION. W.I.S.H. keeps its name.
- **Sound stays soft, slow and sparse.** A life is an instrument and a few notes. A person or place is a small real sound. There are no loops.
- **Interaction.** A click looks. A second click, a right-click or a long press joins. A right-click on a joined knot lets it go. A right-click on open ground backs out. Holding down adds a record. There are no buttons on the map cards.
- **Offline first.** Every feature must work offline before it works online. There are no accounts and no trackers. Nothing anyone sends is shown, or printed, until it is approved.
- **No names or authorship traces.** No personal names or authorship credits go in the code, the text or the commits. The `static` test group enforces this for the built site and for every file a commit would carry. Its private word list lives in `test/.private-words`, which git never sees.
- **The guide stays a key.** It must stay under about 620 words with no sentences, and the `guide` test group enforces this.

## Decisions already made

| Decision | Reason |
|---|---|
| No framework or bundler. The data lives in `window.DA_*` files | Anyone can edit the data, and the build stays trivial |
| Local-first, with no accounts | Privacy, offline use on the street, and nothing to administer |
| Satellite imagery and terrain with no roads or labels. The radar reveals lives as it sweeps | Attention goes to one patch of ground |
| A click looks first, and a second action joins | People curate the actors around a life instead of collecting them |
| W.I.S.H. lines start blank, with no suggestions, and the letters never print | The method is the engine, not the content |
| Places are listed by kind of trade, with a plain-words ledger | Responsibility without blame, and no claims of endorsement |
| Only photographs with adaptable licences are printed, and each is credited | Licences such as CC BY-ND do not allow a dithered version |
| Signals travel as links, QR codes, mesh text, pager lines and ESC/POS | They work without a server, and on hardware that has no screen |
| The listed places ship with the app | The ledger still works when Overpass fails or there is no signal |
| Printing uses pull, not push: the receivers poll the cloud | No inbound ports and no software installed by staff in cafés and shops |
| printd drives the printer, behind a thin pull bridge | The bridge reuses a maintained ESC/POS driver, so no driver code needs writing |
| The prototype has one receiver and one printer | The deadline is 16 October 2026 |
| The print queue and shared stories live in D1, not a Durable Object | A handful of printers polling every few seconds is light work; D1 keeps a preview's data apart with a second database, and needs no migration on deploy |
| The approval page is a password (the `ADMIN_KEY` secret), not Cloudflare Access | Nothing to set up beyond one secret; Access can be added in front of `/admin` later |
| A preview build uses its own database | Testing never reaches real stories or a real printer |

The following are out of scope for the prototype:

- Bluetooth printing.
- Venue management beyond pairing a printer.
- A custom PCB or enclosure.
- Accounts or billing.
- Rewriting ESC/POS drivers.

## Known bugs and risks

1. **Most of what people make is device-only until sent.** Figures, notes, statements, own photographs and hidden cells live in `localStorage`. Stories sent with DIRECT ACTION and records shared are kept on the server once approved; the rest is lost if site data is cleared.
2. **80 mm is set to 512 dots.** Confirm with the TM-T88V's self-test; if it shows 576, change `dots` for `80` in `DA_PRINTERS`.
3. **Long links lose their QR code in ESC/POS.** When the link reaches 1,200 bytes (a long rewritten statement and many relations), the ESC/POS output skips the QR code. The on-screen QR code and the PNG still carry it, but it becomes dense.
4. **printd sends an image as a single raster.** Epson's reference limits one `GS v 0` image to about 2,303 rows on this printer family, and a full slip rendered as an image can be taller than that. Send ESC/POS bytes through `/print/raw` instead, because the app already bands the photograph into 255-row strips.
5. **Dithering depends on CORS.** If an image host does not send CORS headers, the screen falls back to a CSS grey photograph, and the PNG and ESC/POS outputs drop the photograph. This has not been checked against live iNaturalist hosts. An image proxy fixes it (task 5).
6. **Overpass is fragile.** Public instances rate-limit and time out, and every browser queries them directly. The build environment's network policy blocked Overpass, so the live path has not been verified.
7. **iNaturalist load grows with every visitor.** Each browser fetches up to 1,000 sightings plus history, then polls every 5 minutes. iNaturalist throttles at 100 requests a minute and asks API users to stay at or below 60. It may block media downloads above 5 GB an hour or 24 GB a day. A shared cache in the Worker fixes this (task 5).
8. **`PORTAL_URL` is `https://novel.global/`.** Printed QR codes always point at the live site, even when printed from a preview.
9. **Releases must bump the service worker cache.** The shell is network-first, but offline users keep the old shell until the cache name changes. It is `da-v12` now. The service worker never keeps `/api/` or `/admin`.
16. **The approval page is a single password.** Anyone with `ADMIN_KEY` can show, refuse and pair printers. Keep it long and in a password manager; failed tries are slowed after ten in ten minutes.
17. **Mesh text is sent by the receiver's radio only.** A slip sent to the board alone, or to a place with no radio, does not go out by mesh.
10. **Leftovers are gone.** The repo now holds the source, and Cloudflare builds `dist/` from it, so `demo.js`, unused fonts and the GitHub Pages `CNAME` are no longer deployed. The icons in `repo-static/` carry no embedded metadata.
11. **Accessibility is limited.** Knots exist only on the canvas. Keyboard users reach them through the IN REACH list on the card, and only Esc and Delete have keyboard equivalents for the mouse grammar.
12. **Touch and sound are untested on real devices.** Long-press and hold-to-place have only been tested with headless touch emulation, and iOS Safari's long-press callout may interfere. Web Audio has not been tested with iOS's silent switch.
13. **Tests cover mocks only.** The tests take about 12 minutes in software WebGL. Every outside host is mocked, so there are no contract tests against the live services.
14. **The linter warns about six unused constants:** `CONTACTS`, `suburbOf`, `isNight`, `NEED_ST`, `panel` and `TAG_WORDS`.
15. **Eleven listed places are placed by street address.** They are marked `a: 1` and could be a few doors out.

## Next five tasks, in order

*Tasks 1 to 4 are built, in the form described in the status table: the queue on D1 rather than a Durable Object, polled every few seconds rather than long-polled, and DIRECT ACTION listing the partner places rather than pairing by a QR sticker. What is left of the 16 October demo is the hardware: set up the Pi and the TM-T88V at Pickles (`receiver/README.md`) and run the ten-in-a-row test. Task 5 is stage 4 in `docs/roadmap.md`.*

### 1. One repo, one deploy

*Done in the code (stage 0 in `docs/roadmap.md`). The Durable Object binding is added with task 2. The dashboard steps are in `docs/workflow.md`.*

- Check what `front` currently holds, and then make this tree its source. Use the repo root, or a `direct-action/` folder if `front` also hosts other parts of novel.global.
- Add a Wrangler config for the Worker `front`. It should serve `./dist` as static assets, run `src/worker/index.js` for `/api/*`, and bind a Durable Object `PRINT_QUEUE` with a `new_sqlite_classes: ["PrintQueue"]` migration. Requests that match a file in `dist/` are served as assets, and everything else reaches the Worker.
- Use `npm ci && npm run build` as the build command, and `npx wrangler deploy` to deploy.
- Set `PORTAL_URL` to `https://novel.global/` and bump the service worker cache name.
- Remove the leftover files listed in the known bugs, and settle which copies of the icons the build ships.
- **Done when:** `npm test` passes, a push to `main` deploys, `https://novel.global/` serves the app, and `/api/health` returns `ok`.

### 2. The print queue (Durable Object)

- Create a `PrintQueue` class with SQLite storage and one instance per receiver (`idFromName(receiverId)`). It needs these routes:
  - `POST /api/print/:receiver` takes `{ code, format: "escpos", data: base64 }`, up to about 256 KB, and returns `{ job, position }`.
  - `GET /api/receivers/:receiver/next` requires `Authorization: Bearer <token>`. It long-polls for up to 25 seconds, claims the oldest queued job with a 60-second lease, and returns the job or `204` when there is none.
  - `POST /api/receivers/:receiver/jobs/:job` takes `{ status: "printed" | "failed", error }`.
  - `GET /api/print/:receiver/:job` returns the job's status to the web app: queued, printing, printed or failed, with its position.
- Use a Durable Object alarm to return expired leases to the queue.
- Drop queued jobs after 24 hours. Keep only the status of printed jobs, without their content, for 7 days.
- Cap the queue at about 20 waiting jobs, so that nobody can drain a shop's paper.
- Protect `POST /api/print` with Turnstile and a per-IP rate limit.
- Keep the receiver token in a Worker secret for now, because there is only one receiver.
- **Done when:** a curl round trip works (enqueue, then claim, then mark printed), an expired lease puts the job back in the queue, and jobs survive a redeploy. Add tests that run in the Workers runtime, for example Vitest with the Workers pool.

### 3. The web app sends to the queue

- Add a `RECEIVER` output machine to `DA_OUTPUTS`.
- Pair a phone with a receiver by scanning a QR sticker on the receiver, which opens `https://novel.global/#r=<receiver>`. Remember the receiver for the session, and only show the machine when the phone is paired.
- Add printer profiles to `config.js`, for example `{ "58": { dots: 384, cols: 32 }, "tm-t88v-80": { dots: 512, cols: 42 } }`. Make `escpos(s, profile)` render the photograph at `profile.dots`, still in 255-row bands, and wrap the text at `profile.cols`. Confirm the dot count from the printer's self-test.
- POST the bytes to the queue and show QUEUED, then PRINTING, then PRINTED. If the phone is offline, keep the job and send it when the connection returns.
- **Done when:** a phone can issue a slip and send it, the job appears in the queue, and its status updates on the card.

### 4. The receiver (Raspberry Pi, printd and a pull bridge)

- Install Raspberry Pi OS Lite on the Pi 3 A+. Skip Docker, because the Pi has only 512 MB of RAM. Set up Wi-Fi and SSH with keys only.
- Install printd in a Python virtual environment under systemd. Set these:
  - `PRINTD_HOST=127.0.0.1`
  - `PRINTD_PORT=8080`
  - `PRINTD_PRINTER_KIND=usb`
  - `PRINTD_DEVICE=/dev/usb/lp0`
  - `PRINTD_PRINT_WIDTH=512`
  - A `PRINTD_API_KEY`
  - A udev rule so that the `lp` group owns `/dev/usb/lp0`
- Write the pull bridge in a new `receiver/` folder (`receiver/pull.py`, about 80 lines, run by `da-pull.service`). It long-polls `/next` with its token, sends `escpos` jobs to printd at `POST /print/raw`, then reports printed or failed. It should back off when the network fails, log to journald, and print a short READY slip at boot with the receiver id.
- For the printer, use the PS-180 supply, run the self-test (hold FEED while switching on), and connect USB-B to the Pi.
- **Done when (the 16 October demo):** both devices boot and print READY. From a phone, NOTICED, then DIRECT ACTION, then RECEIVER prints the slip within 10 seconds. This works ten times in a row, and the next job still prints after the Wi-Fi drops for a minute.

### 5. Live data through the Worker

- **Sightings:** add `GET /api/sightings?bbox&since`. The Worker calls iNaturalist itself, with a short edge cache of about 2 to 5 minutes, so all visitors share one upstream call. Point `INAT_API` at it, and keep the browser cache for offline use.
- **Photographs:** add `GET /api/img?u=`, a photo proxy limited to iNaturalist hosts. It adds CORS headers and caches the images, so dithering always works and the media limits are respected.
- **Places:** add `GET /api/places?tile=`, which runs Overpass on the server per 0.01° tile. Cache the answers for 14 days in D1 or KV, and never cache failures. Move the listed places into D1 with a way to edit them.
- **Database:** create D1 tables for sightings (with curation flags), events (replacing the CSV), places, and signals. Signal sharing is opt-in: sessions are wiped after 7 days unless saved as a package.
- **Live updates:** keep the 5-minute poll. Later, a Durable Object can broadcast new sightings inside a radar over a WebSocket.
- **Done when:** a sighting posted to iNaturalist appears within about 5 minutes, the app still opens offline with the last data it had, and no browser calls iNaturalist or Overpass directly.

## After the five

The fuller scope includes:

- Staged builds.
- Saving and sharing stories, settings and data as code or Markdown packages, or as sessions that wipe after a week.
- Curated human events alongside ecology sightings.
- More receivers in cafés and fashion shops.
- A global version of the radar, for the circular economy and multi-species ecology in climate emergencies anywhere.

To scale beyond Melbourne, these must become regional:

- The bounding box.
- The outlook and its sources.
- The listed places.
- The caring groups.
- The Country named in the footer.

## References

- printd: <https://github.com/HansF/printd>
- Epson ESC/POS command reference: <https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/index.html>
- Epson TM-T88V specifications: <https://epson.com.au/pos/products/printers/DisplaySpecs.asp?id=tmt88v>
- iNaturalist developer guidance: <https://www.inaturalist.org/pages/developers>
- Overpass API: <https://wiki.openstreetmap.org/wiki/Overpass_API>
- Cloudflare Workers static assets and Durable Objects: <https://developers.cloudflare.com/workers/static-assets/> and <https://developers.cloudflare.com/durable-objects/>
