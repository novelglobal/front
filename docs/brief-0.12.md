# novel.global — brief 0.12: islands

Written 31 October 2026 from the owner's notes of the same day. Nothing in it is built yet. Build it in the order of the
stages at the end, one stage to a session, each checked on staging before the next. Where this brief and an earlier one
differ, this one wins.

## The idea

novel.global becomes the hub of an archipelago. Each island is a small, self-contained community of at most **160 people**
gathered round one solar thermal printer: its hub. The islands are separate on purpose. Inside an island, people know each
other's marks, read each other's talk and hold each other's prints. Between islands only what is signed and chosen to travel
goes across, through novel.global.

Two sources give it its lore:

- **Leon Krier's polycentric city:** a city of cities, made of quarters each small enough to know and walk, each complete in
  itself, joined but never merged. An island is a quarter.
- **Japan's closed country (sakoku, about 1639 to 1853):** two centuries with the doors mostly shut, in which ukiyo-e,
  kabuki, haiku and the great craft schools came of age. Isolation as the shelter in which a culture finds its own voice.

The promise to a member is safety first: a place small enough to belong to, closed enough to be brave in. novel.global's part
is the digital and certification layer. It issues the islands' charters, certifies their hubs and members, keeps the map of
the archipelago and the kit to build a new hub.

## How it should feel (the experience lens)

The next build needs the eye of an experiential designer: journey and joy mapping, emotional before functional, distinctive
art direction with restraint. These rules hold for every stage.

1. **Copy-free.** Marks, light, motion and sound, never instructions. A word appears only to a resting hand (as now).
2. **One continuous scene.** Nothing jumps. An island is reached the way the jellyfish moves: the globe turns, the sea comes
   up, the island rises out of it. Every change is a camera move or a tide, never a page load.
3. **Emotional benefit first.** Joining is belonging, not signing up; a print received is a gift held out, not a notification.
4. **Restraint.** One new visual idea: the archipelago itself. Islands are drawn like the rings and devices are now (ink, few
   lines, dark-strange-clean), each island's shape grown from its own code so no two are alike.
5. **Safety is felt.** The island you are on is always plain to see. Nothing from outside reaches you unless it is signed.
   You can leave with one gesture, and leaving is quiet.

### The journey, mapped for joy

| Moment | What the person feels | What they see | The joy |
|---|---|---|---|
| Hearing of an island | Curiosity | A printed slip passed hand to hand: an island's mark and a code | Holding something real before anything online |
| Finding the hub | Anticipation | On the globe, the island glows; its hub shows a countdown and where it will be next | The countdown landing, being there when the printer appears |
| Arriving | Welcome | The hub prints their passport: their mark, the island's mark, the charter's seal, a code | A certificate in the hand that no one else has |
| Belonging | Recognition | The island's talk, each member by their kin mark; the jellyfish holds out prints sent to them | Being known by your mark, not your name |
| Making | Pride | The same notice, W.I.S.H., make and print, now with the island's colours and seal on the poster | A poster that carries the island's stamp |
| Receiving | Surprise | A print held by the jellyfish: tap to open, keep to the wall, or let it float away | Choosing what stays |
| Leaving | Relief, never guilt | One gesture; their mark fades from the island's ring | Leaving is easy, so staying is a choice |

## What to build

### 1. Islands of 160

- **Each island is a Durable Object** (SQLite-backed, now on the Workers free plan): its roster (at most 160 codes), its talk,
  its prints held for members, its hub's countdown and next place. Nothing of one island is in another's object, which is
  what makes it self-contained.
- **novel.global's D1 keeps only the register:** each island's id, mark, charter, hub, rough place and member count. It never
  keeps another island's talk.
- **The 161st person** is shown the island as full: the island glows but its door stays shut, with the nearest island that
  has room glowing beside it.
- A member belongs to one island at a time (to begin with). Moving is leaving one and arriving at another.
- **The talk, the prints and the board are the island's own.** The stage talk built in 0.11 becomes per island.

### 2. The certification layer

- **Keys, not accounts.** novel.global holds a master signing key (Ed25519, kept as a Cloudflare secret). It signs each
  island's **charter**: its id, mark, hub key and member limit.
- **Each hub has its own key**, made on the hub when it is set up and never leaving it. It signs each member's **passport**:
  the member's code, the island id and a date.
- **A passport prints as a receipt** with a QR code. Anyone can check it offline: the passport's signature leads to the hub,
  and the hub's charter leads to novel.global. A forged or revoked passport fails the check without a network call.
- A member code is still three characters typed from a print (never taken from a link), now carried inside a signed passport.
- **Revoking:** the approval page and the hub's owner can strike a passport; the island's object refuses it from then on.

### 3. The hub kit: another printer joins the archipelago

The approval page gains **ISLANDS**, and novel.global gains a public **BUILD A HUB** page drawn as a parts sheet (no copy, as
the build key already is).

- **Hardware list:** the solar thermal printer as built now (Pi, printer, panel, battery, the LilyGO touch screen, optional
  Meshtastic radio), downloadable as the plain technical list, with core, mods, hacks and upgrades.
- **One-click install:** a ready Raspberry Pi image built with Raspberry Pi's image tools, with the receiver, Wi-Fi setup and
  touch screen pairing in it. Written to a card with Raspberry Pi Imager, the hub asks for nothing but power and Wi-Fi. The
  one-line install stays for those who already have a Pi.
- **Claim by print:** the new hub prints a claim slip with a code. The owner types it on novel.global, novel.global signs the
  charter, and the hub prints the island's first page: its mark, its seal and its first passport (the owner's own).
- **Their own version:** an island can stay on novel.global (the default: nothing to run), or the owner can run their own
  copy of the site with a Deploy to Cloudflare button. That copy still registers its charter with novel.global, so it stays
  part of the archipelago while being entirely theirs.
- **Onboarding others:** a hub's owner can print a **builder's slip** for someone making the next printer: the parts list's
  code and a claim code, so one hub seeds the next.

### 4. Signals from the hub

- **A countdown and a place:** the owner sets when and roughly where the hub will appear next. Members see the countdown on
  the island and the place on the map (a ring, not a pin, until the countdown ends).
- **Alerts with codes:** the owner sends an alert. It is not an inbox: it arrives as a print held by the jellyfish, sealed
  with the hub's key.
- **Prints held, not messages kept:** anything sent to a member is a small print the jellyfish holds out. **Tap** opens it,
  **keep** hangs it on the wall, and **float away** lets it drift off and fade, gone from the island's object too. Unopened
  prints float away by themselves after a moon.

### 5. Low resolution, as a choice

On the approval page, under DATA, a **LOW RES** switch, **off by default**. Off: full-size photographs are kept in R2 (as
now). On: only the small print-sized picture is kept, to save storage. The receipt itself always prints the poster as
designed.

## Cloudflare, used fully

| Feature | What it does here | Plan |
|---|---|---|
| Durable Objects (SQLite) | One per island: its roster of 160, talk, held prints, countdown; live updates over hibernating WebSockets | Free plan, 5 GB per account (check the current limits page) |
| D1 | novel.global's register of islands and charters | Free (as now) |
| R2 | Full photographs, the hub image file, each island's printed archive; lifecycle rules to let old things go | Free to 10 GB (as now) |
| Queues | Prints to many hubs and alerts to many members, retried until they land | Free plan, 24-hour retention |
| Workflows | The long steps: claim, charter, first print; a countdown that wakes the island when it ends | Check free allowances |
| Cron Triggers | Floating unopened prints away after a moon; tidying | Free |
| Turnstile | Already guarding the talk; also claiming a hub and making a passport | Free (on) |
| Image transformations | The archipelago's island cards and thumbnails from R2, at the size each screen needs | 5,000 unique a month free |
| Cloudflare Tunnel | A hub reachable for its owner without opening ports | Free |
| Workers for Platforms | Each island's own code, run on novel.global, only if islands are ever to run their own scripts | $25 a month; not needed to start |

## GitHub projects to bring in

| Project | Why |
|---|---|
| `cloudflare/agents` (Agents SDK) | Durable Objects with state, WebSockets and scheduling made simple: a natural shape for an island |
| `cloudflare/workers-sdk` and Deploy to Cloudflare buttons | An owner's own copy of the site in one click |
| `raspberrypi/rpi-image-gen` (or `RPi-Distro/pi-gen`) | The ready hub image for one-click install |
| `paulmillr/noble-ed25519` | Small, audited signing and checking for charters and passports, in the browser and the Worker |
| `markqvist/Reticulum` with LXMF | An offline, encrypted mesh with real identities: islands that still talk when the internet is gone |
| `meshtastic/firmware` | Already used; the island's local radio |
| `python-escpos/python-escpos` | A steady way to drive printers beyond the T88V from the hub |
| `cloudflare/cloudflared` | Cloudflare Tunnel on the hub |

## Safety

- No names, emails or addresses anywhere; a member is a code and a kin mark.
- A hub's place is a ring, never a point, until its countdown ends.
- Every island can be closed by its owner, and by the approval page.
- Prints and talk stay inside the island's object; only what is signed and chosen goes to novel.global.
- Minors and safeguarding: an island is closed to anyone under 16, said once on the passport print (to decide: see below).

## Decisions for the owner

1. Is 160 the hard ceiling, or 160 with a waiting ring for the next who come?
2. One island per person, or a home island with visits to others?
3. Should islands be able to see each other's posters on the archipelago map, or only their marks and glow?
4. The age rule for islands, and who moderates an island's talk: its owner, novel.global, or both.
5. Low res: is it the storage switch described above, or a print look (the older dotted receipt) to choose as well?

## Stages, in order

| Stage | What | Done when |
|---|---|---|
| A | The archipelago drawn on the globe: island marks grown from codes, the scene moves without cuts; LOW RES switch | An island can be found, entered and left on staging without a jump |
| B | The island as a Durable Object: roster of 160, its talk moved into it, the 161st turned to the nearest island | Two islands on staging cannot see each other |
| C | Charters and passports: keys, signing, the passport receipt, offline check, revoking | A passport printed on staging checks with no network |
| D | The hub kit: ISLANDS on the approval page, BUILD A HUB, claim by print, the Pi image | A second Pi claims an island from a fresh card |
| E | Signals: countdown and place, alerts as prints held by the jellyfish, keep or float away | A member receives, keeps and floats away a print |
| F | Their own version: Deploy to Cloudflare, registration with the master, Reticulum as the offline path | A copy on another account appears on the archipelago |
