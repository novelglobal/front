# novel.global — brief 0.12: islands

Written 31 October 2026 from the owner's notes of the same day, then revised the same day with the owner's decisions and a
check of the whole engine. Nothing in it is built yet. Build it in the order of the stages at the end, one stage to a session,
each checked on staging before the next. Where this brief and an earlier one differ, this one wins.

## Purpose (for the team, never on screen)

This section is the design manifesto. None of it is ever written into the experience: no copy, no slogans, no explanations.
It decides what is built and how it feels.

novel.global is a platform and an ecosystem for telling better stories in a safer way than online or social media allow. It
is an antidote to modern anxiety, and to social infrastructure that harms and exploits creativity, communities and third
spaces. Screens ask for no physical, real response; novel.global always ends in one: a place visited, a print in the hand, a
person met.

**The single-minded idea: you can only belong where you have been.**

It is built as an archipelago. Each island is a closed group of at most 160 people round one solar thermal printer, its hub.
Its lore comes from Leon Krier's city of small, complete quarters, joined but never merged, and from Japan's closed country
(sakoku, about 1639 to 1853), two centuries with the doors mostly shut in which ukiyo-e, kabuki and haiku came of age.
Isolation as shelter; safety as the ground of creative belonging.

## The owner's decisions (31 October 2026)

1. **Physically visiting is the only way in.** A person joins a printer's group only at that printer: the passport is printed
   there. They can belong to every group they have visited; there is no limit on the number of islands, only on each one.
2. **160 is the ceiling, and the wait list is the only way past it.** Someone who visits a full island is put in its queue.
   They can always see, simply and at a glance, that they have asked and their number in the queue. Beside the number, a way
   to build their own island and run their own novel.global.
3. **A code lives for 7 days.** Without a request for 7 more, it is deleted: removed from every island and the site, kept on
   the approval page, and able to be brought back from there. Extending (and seeing the days left) is hidden in the main
   journey and shown in the portfolio. Each visit to a hub renews it too, as being there is the point.
4. **No copy.** The queue, the days left, the renew key and the build-your-own way are marks, numbers, light and motion.
5. **Every island has its own ground.** Its own map, places, water, sightings and species for wherever its hub is, always cut to
   the same size as Melbourne's (about 8 km north to south and 6.5 km east to west, centred on the hub). Islands in one city may
   overlap; where they do, they share the ground and keep their own people. Seen together, the islands are a patchy map of the
   world: the places where innovation and intervention stories are being made.
6. **Melbourne is the blueprint.** The one-click install builds what Melbourne has: the same engine, journey and devices, drawn
   from the new island's own ground. It takes other thermal printers, other Pi boards, other touch screens and displays.
7. **The install is one stop and a pleasure.** In the spirit of the best open-source sharing: a checklist of parts, a single
   run that sets up everything, an ASCII title card and plain install notes, and small bit-tone music while it works. No names,
   logos or references to anywhere else: only the aesthetic and the generosity.
8. **One USB stick, any Pi with Wi-Fi.** Plugging the stick into a Pi sets up the whole hub: networking, the printer, the
   screen, the files and a bare novel.global, with no Melbourne map, species or base data. Setup then asks for the place and
   lets the owner make it their own: tweaks, species, layers, their own sounds and songs, their own icons, the full suite.
   The engine and the print system stay the same underneath, adaptable and modular.
9. **Online, an island gets its own keys.** Once it reaches the internet the hub makes its keys, pairs, takes updates and
   joins the site from anywhere in the world as its own island.
10. **They run it; the owner sees it all.** Each island's owner manages and controls everything on it: approvals, members,
    signals, its look and sound. novel.global's approval page can see, track and view every island, and close one only
    under the safety rules.
11. **Automated, modular, hackable.** Approvals, onboarding, setup and stages are as automatic and as open to change as
    possible, while the deep, simple journey flows the same on every island.

Still open (the defaults below are used unless the owner says otherwise):

- Can islands see each other's posters on the archipelago, or only their marks and glow? *Default: only marks and glow.*
- The age to join, and who moderates an island's talk. *Default: 16 and over; the hub's owner moderates, and the approval page
  can close any island.*
- Is LOW RES only the storage switch, or also the older dotted print look? *Default: only the storage switch.*

## How it should feel (the experience lens)

The next build needs the eye of an experiential designer: journey and joy mapping, emotional before functional, distinctive
art direction with restraint.

1. **Copy-free.** Marks, light, motion and sound. A word appears only to a resting hand, as now.
2. **One continuous scene.** No jumps. An island is reached as the jellyfish moves: the globe turns, the sea rises, the island
   comes up out of it. Every change is a camera move or a tide, never a page load.
3. **Emotional before functional.** Joining is arriving somewhere, not signing up; a print received is a gift held out, not a
   notification.
4. **Restraint.** One new visual idea: the archipelago. Islands are drawn as the rings and devices are now (ink, few lines,
   dark-strange-clean), each island's shape grown from its own code so no two are alike.
5. **Safety you can feel.** It is always plain which island you are on. Nothing from outside reaches you unless it is
   signed. Leaving is one gesture, and quiet.

### The journey, mapped for joy

| Moment | What the person feels | What they see | The joy |
|---|---|---|---|
| Hearing of an island | Curiosity | A printed slip passed hand to hand: an island's mark and a code | Something real before anything online |
| Finding the hub | Anticipation | On the globe the island glows; its hub has a countdown and a ring where it will be | Being there when the countdown lands |
| Arriving | Welcome | The hub prints the passport: their mark, the island's mark, the seal, a code | A certificate in the hand that no one else has |
| Arriving at a full island | Patience, not rejection | Their place in the queue as a number on a small ring that fills; beside it, the seed of their own island | Being counted, and offered somewhere to begin |
| Belonging | Recognition | The island's talk, each member by their kin mark; prints held out by the jellyfish | Being known by a mark, not a name |
| Making | Pride | Notice, W.I.S.H., make and print, with the island's seal on the poster | A poster carrying the island's stamp |
| Receiving | Surprise | A print held by the jellyfish: tap to open, keep it on the wall, or let it float away | Choosing what stays |
| Keeping it alive | Care, not pressure | In the portfolio only: the days left as seven marks fading, one key to add seven | Tending something, like a plant |
| Leaving | Relief | One gesture; their mark fades from the island's ring | Leaving is easy, so staying is a choice |

## The engine, checked: what works, what is broken, what will not scale

What works, and must not break: the aura's journey (seed, bang, globe, jellyfish, the four steps and their devices), the poster
engine and the receipt as designed, the touch screen's approval at the printer, the Pi bridge, the approval page, the stage
talk, R2, Turnstile, backups, and the automated checks (about 290 browser checks and 48 server checks).

What is broken or costly, measured on 31 October 2026:

| Finding | Why it matters | The fix |
|---|---|---|
| **Polling ate the free plan.** Each Pi asked every 3 seconds and each touch screen every 2: about 72,000 requests a day for one hub, against the free plan's 100,000 | A second hub would have run the site out | **Done (da-v135):** the printers ask every 20 seconds when nothing is happening, and every 2 seconds from the moment someone reaches the make step, a slip waits, or a print is approved: about 9,000 a day for a hub. The print still lands within 2 seconds of the press |
| **Every count was a database write** (the traffic count on most requests) | D1's free plan allows 100,000 rows written a day | **Done (da-v135):** counts are kept in memory and added once a minute. Rate limits still write a row, but only on sends, talk, places and the map |
| **Nothing stopped the site running past the free allowances** | Cloudflare would stop answering, or R2 would start to charge, before anyone knew | **Done (da-v135):** a daily meter. Past 60% of the requests or rows written the printers ask less often; past 85% talk and new places wait for tomorrow while printing goes on. Full-size photographs stop at 8 GB of R2's free 10. The approval page's overview shows all three bars |
| **Photographs are kept inside D1** (stories.photo and the portfolio covers as blobs) | D1 is 5 GB on the free plan, and slow to back up | Photographs to R2 (as the full-size ones already are); D1 keeps only a key |
| **Two apps on one page.** The aura (base.js and aura.js, 385 KB) opens the studio in a frame with its own app (app.js, 524 KB), map, data and sound | Double memory, double fetching, and two audio engines on old phones; the source of stutters | One audio engine (the aura's) that the studio borrows; the studio's map and data loaded only when a device opens, and kept warm after |
| **Three receipt makers:** the base's slip, the aura's poster and print sheet, and the studio's paper | Three places to fix one bug; prints that differ by where they were made | One poster engine (the aura's, now printing as designed) used by all three |
| **The device keeps its world in localStorage** (pieces, notes, loops, the wall's JPEGs), which is small and fails when full | Lost work on phones with many posters | IndexedDB for pictures and sound; the server keeps what a code needs to come back |
| **Database changes run at every cold start** as `ALTER TABLE` tries | Slow first requests, silent drift between the live and preview databases | Numbered D1 migrations run by `wrangler d1 migrations` at deploy |
| **One 680-line Worker file** does everything | Hard to change one part safely | Split by area (stories, print queue, talk, islands, admin) behind the same routes; no behaviour change |
| **Three-character codes** in one shared space (about 32,000 possible) | Fine for one island, too few and too guessable for an archipelago | A code is three characters within its island, and the passport's signature makes it whole; codes never cross islands unsigned |
| **The checks take ten minutes** in one 2,200-line file | Fewer runs, slower fixes | Split by area, run in parallel; the API checks first, as now |

## The new map of functionality

Four layers, each with one job. Every feature lives in exactly one.

| Layer | Its job | What lives there |
|---|---|---|
| **The experience** (aura, base, studio) | Feeling and making | The journey, the devices, the poster engine, one sound engine, the archipelago scene. No business rules |
| **The island** (one Durable Object each) | Belonging | Roster of 160, the queue, the talk, prints held for members, the hub's socket, countdowns and alerts, the 7-day clock |
| **The hub** (novel.global's Worker, D1, R2) | Certifying and connecting | The register of islands, charters, the master key, the approval page, backups, the build kit, the public map |
| **The printer** (Pi, touch screen, radio) | The physical response | Printing passports and posters, approving at the printer, the local mesh, its own key |

## What to build

### 1. Islands of 160

- **Each island is a Durable Object** (SQLite-backed, now on the Workers free plan). Nothing of one island is in another's
  object, which is what makes it self-contained.
- **novel.global's D1 keeps only the register:** each island's id, mark, charter, hub, rough place and member count.
- **The queue:** someone who visits a full island takes the next number. The island shows them their number on a small ring
  that fills as places open, and beside it the seed of their own island (BUILD A HUB). A place opening goes to the first in
  the queue, who is told by a print held out by the jellyfish.
- **Many islands, one person:** a person holds a passport for every island they have visited, and moves between them on the
  archipelago. The stage talk built in 0.11 becomes each island's own.

### 2. The 7-day life of a code

- Every code has a clock of 7 days. A visit to any of its hubs, or the renew key, adds 7 more.
- The renew key and the days left (seven marks, fading) are in the portfolio only, never in the main journey.
- At zero the code is deleted from its islands and the site, and moved to the approval page's archive, where it can be
  brought back. Its posters stay where they were printed.

### 3. The certification layer

- **Keys, not accounts.** novel.global's master key (Ed25519, a Cloudflare secret) signs each island's **charter**: its id,
  mark, hub key and the limit of 160.
- **Each hub makes its own key** at setup, and it never leaves the hub. It signs each member's **passport**: their code, the
  island and the date of the visit.
- **A passport is a receipt** with a QR code that checks offline: the passport leads to the hub, the hub's charter to
  novel.global. A forged, expired or struck passport fails without a network call.
- **Striking a passport:** the hub's owner and the approval page can do it; the island refuses it from then on.

### 4. The hub kit: every printer its own island, Melbourne as the blueprint

Each island has its own approval page, where its owner controls everything on it. novel.global's approval page gains **ISLANDS**,
where every island can be seen, tracked and viewed (members, prints, signals, health, version). novel.global gains **BUILD A HUB**, drawn as a parts sheet, and the queue links to it.

- **The USB stick:** a folder to copy onto any USB stick. Plugged into a Raspberry Pi already running its usual system with
  Wi-Fi, it installs itself (one udev rule on first boot of the card image, or one line typed once on a Pi already set up),
  finds the printer and the screen, and opens setup on the screen or on a phone joined to the hub's own Wi-Fi.
- **A bare start:** the base novel.global with no Melbourne map, species or base data. The island's own pack (place, field
  list, layers, sounds, songs, icons, words) lives in one folder of plain files on the hub and on its island, so it can be
  changed by hand, in setup, or on its own approval page, and backed up as one zip.
- **Modular underneath:** the same engine, journey and print system on every island; each part (printer driver, screen,
  mesh, sound set, icon set, data layers) is a module that can be swapped or added without touching the others.
- **Its own ground:** at claim, the hub's rough place sets its island's box, the same size as Melbourne's. The island then
  builds its ground once, through the routes the site already has (iNaturalist sightings and species, OpenStreetMap places and
  water), and keeps it, so it works offline from then on. Its field list starts as the kinds met there (as SPECIES does now)
  and grows with every pull; Melbourne's 204 hand-written kinds are the example of where it can get to.
- **The checklist of parts:** the printer as built now (Pi, printer, panel, battery, the touch screen, an optional mesh
  radio), as the plain technical list (core, mods, hacks, upgrades), each part with what else works in its place:
  - printers: any 58 or 80 mm ESC/POS thermal printer over USB, network or Bluetooth (through python-escpos);
  - computers: any Raspberry Pi from the Zero 2 W up, or another small Linux board;
  - screens: the ESP32 touch screen as now, any HDMI or DSI touch display shown as a page in kiosk mode, or none.
- **The install itself:** one card image, or one line on a Pi already running. It opens on an ASCII title card with the
  island's mark, plays bit-tone music made by the site's own synth while it works, ticks through the checklist (found the
  printer, found the screen, joined the Wi-Fi, claimed the island, built the ground, printed the first page), and ends with
  install notes printed on the receipt. Every step can be run again on its own.
- **One-click install:** a ready Raspberry Pi card image with the bridge, Wi-Fi setup and touch-screen pairing inside. Written
  with Raspberry Pi Imager, the hub asks only for power and Wi-Fi. The one-line install stays for those with a Pi already.
- **Claim by print:** the new hub prints a claim code; the owner types it on novel.global; novel.global signs the charter; the
  hub prints the island's first page and its owner's passport.
- **Their own novel.global:** stay on novel.global (nothing to run), or deploy a copy with a Deploy to Cloudflare button. The
  copy registers its charter with novel.global and stays part of the archipelago.
- **One hub seeds the next:** an owner can print a builder's slip (the parts list and a claim code) for someone building the
  next printer.

### 5. Signals from the hub

- **A countdown and a place:** the owner sets when, and roughly where, the hub appears next. Members see the countdown, and a
  ring on the map (never a point) until it lands.
- **Alerts as prints:** an alert arrives as a sealed print the jellyfish holds out. **Tap** opens it, **keep** hangs it on
  the wall, **float away** lets it drift off and go from the island. Unopened prints float away after a moon.

### 6. LOW RES, as a choice

On the approval page under DATA, a **LOW RES** switch, **off by default**. Off: full-size photographs kept in R2 (as now). On:
only the small print-sized picture is kept, to save storage. The receipt always prints the poster as designed.

## Cloudflare, only what is needed

Everything stays inside the free allowances, and the meter (da-v135) keeps it there. Nothing is added that costs money or needs watching.

| Feature | What it does here | Plan |
|---|---|---|
| Durable Objects (SQLite) | One per island: roster, queue, talk, held prints, the 7-day clocks, the hub's socket | Free, 5 GB per account (check the limits page) |
| Hibernating WebSockets | Only if a hub ever needs to hear in under 2 seconds; the waking polls do the job for now | Part of Durable Objects |
| Durable Object alarms | The 7-day clock, countdowns landing, prints floating away | Part of Durable Objects |
| D1 | The register of islands and charters; migrations at deploy | Free |
| R2 | Every photograph, the hub image, island archives; lifecycle rules | Free to 10 GB |
| Turnstile | The talk (on); claiming a hub; joining a queue | Free |
| Cloudflare Tunnel | A hub reachable by its owner without opening ports | Free |

## GitHub projects to bring in

| Project | Why |
|---|---|
| `cloudflare/agents` (Agents SDK) | Durable Objects with state, WebSockets, alarms and scheduling made simple: the shape of an island |
| `cloudflare/workers-sdk`, Deploy to Cloudflare buttons | An owner's own novel.global in one click |
| `raspberrypi/rpi-image-gen` (or `RPi-Distro/pi-gen`) | The ready hub image |
| `paulmillr/noble-ed25519` | Small, audited signing and checking for charters and passports, in the browser and the Worker |
| `jakearchibald/idb-keyval` | A tiny way onto IndexedDB, so a phone's posters and sounds stop filling localStorage |
| `markqvist/Reticulum` with LXMF | An offline, encrypted mesh with real identities, so islands still speak when the internet is gone |
| `meshtastic/firmware` | Already used: the island's local radio |
| `python-escpos/python-escpos` | Printers beyond the T88V |
| `cloudflare/cloudflared` | Cloudflare Tunnel on the hub |

## Safety

- No names, emails or addresses anywhere; a person is a code and a kin mark.
- A hub's place is a ring, never a point, until its countdown lands.
- Every island can be closed by its owner and by the approval page.
- The talk and prints stay inside the island's object; only what is signed and chosen reaches novel.global.
- A code not tended for 7 days leaves the public side by itself.

## Stages, in order

The engine first, without changing anything a person sees, so the islands rest on something that scales. Each stage keeps
every existing check passing.

| Stage | What | Done when |
|---|---|---|
| A | **The engine, made safe to grow:** the meter and the waking polls (done, da-v135); then D1 migrations, photographs out of D1 into R2, IndexedDB on the phone, the checks split | Every check passes, the journey looks the same |
| B | **The island as a Durable Object:** roster of 160, the queue, the talk moved in | Two islands on staging cannot see each other |
| C | **Passports and the 7-day clock:** keys, signing, the passport receipt and its offline check, striking, deletion to the archive and bringing back, renew in the portfolio | A passport printed on staging checks with no network; a code left 7 days goes to the archive and comes back |
| D | **The archipelago scene:** islands drawn from their codes on the globe, moving between them without a cut, the queue's ring and number, LOW RES | An island is found, entered, queued for and left on staging without a jump |
| E | **The hub kit:** the USB stick for any Pi with Wi-Fi, the bare start and the island's own pack, each island's own approval page, ISLANDS on novel.global's, BUILD A HUB, claim by print, the island's own ground, the checklist with other printers, boards and screens, the one-stop install with its title card and music, the builder's slip | A second Pi with a different printer claims an island in another city from a fresh card, and its map is its own |
| F | **Signals:** countdown and place, alerts as prints held by the jellyfish, keep or float away | A member receives, keeps and floats away a print |
| G | **Their own novel.global:** Deploy to Cloudflare and registration with the master | A copy on another account appears on the archipelago |
