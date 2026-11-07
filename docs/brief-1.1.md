# Brief 1.1: the home of cards

novel.global opens on one column of art cards, one card to a screen on a phone. Each card is a story, a game or an app made by an island. A switchboard sits at the foot, where cards are wired together and the site is remixed. Every way out leads back to this column.

The owner's sketch (A) is the layout. The builds already made stay: each one now opens from its card as a standalone experience, and changes when it is wired on the switchboard.

## The column (A)

From top to bottom:

| Card | What it opens | Notes |
|---|---|---|
| The banner | The reef (A.2) | Always visible, small, with the Irukandji swimming across. Its eye sounds a fog horn. A long press on it makes a quick photo print on a printer that is online. |
| **I W.I.S.H.** (hero) | The aura as it is today: notice, W.I.S.H., print | Fills the phone's screen. Its copy is "helps you tell stories of change", then STRATEGIC INNOVATION, then a photo key, MORE LIFE →. |
| **DIRECT ACTION RADIO** | The radio device | "Making music into events", over the radar. |
| **PICKLES LANDSCAPE ZINE MAKER** | TALL, in the same card | Pickles' own experience. novel.global's printer is offered too, because it is played on novel.global. |
| **unearth your own island** | The build-a-printer checklist | Can also be printed as a receipt. |
| **THIS SPACE IS YOURS** | The island control panel | The Archipelagos builder. It has its own behind-the-scenes page, like a game library's store page. |
| **Switchboard** | Patch cables between the cards | Fixed at the foot of the screen. |

The top toggles from today (sound, light or dark, the network) get smaller and sit in the banner. The three orbits of the old start become the hero card. The checklist icon becomes the island kit card, and the engine icon becomes the THIS SPACE IS YOURS card.

### Each card

- Placeholder art for now, one photo or drawing per card. The owner sends revised art once the column works.
- Title copy is set 50–70% larger than the final size for now, so it can be read and judged. A single `--title` size in `home.css` sets it, and it is scaled back later.
- **Three art layers** move at three speeds as the card scrolls: back, middle and front. They stay clipped inside the card's own art area. A per-card setting picks SHADOW (a soft drop between the layers) or SPEED (stronger parallax). Motion uses transforms only, on one requestAnimationFrame. It is calm under `prefers-reduced-motion`.
- **Snapping:** the column snaps one card to a screen, as onepage-scroll does (MIT, jQuery). It is rebuilt on native CSS scroll snap, so the motion stays on the browser's compositor with no library and no jQuery. The library's idea is kept: one swipe, one card, with keys and dots.
- **The radar key** (top right of each card). It appears only while the card's printer or island is online. Pressed, it asks for a location once and turns the card into a beacon: a compass needle to the printer, the distance, and the moon phase it was last heard. It never shows days or countdowns.
- **Locked or found:** an island's card shows as a silhouette until its code is found (from a print, or at the place). One person can find as many as they like, and the found codes stay on that phone. The starting cards are open. An island that is not online yet stays locked, and its card plays the pretend-locked game.
- **Admin:** every card's title, copy, art, link and order can be changed on the approval page (CARDS). The user's column is the same data.

### Each card in its own look

One blueprint-blue band, grainy and flawed, flows from card to card and changes form on each (solid, stepped blocks, dots, torn tape, a glossy tube). About half of each card is greyscale or black and white, a fifth to a third is the blue, and each card owns one colour of its own.

| Card | Look | Its colour |
|---|---|---|
| CIRCULAR STRATEGY | Photographs above, in grey, turning every 2 s (the site's own nine chairs in `repo-static/cards/` until others are put up); a dark patchy green below with nothing on it; the title in a heavy serif across the seam | deep green |
| DIRECT ACTION RADIO | Block type in a cascade, each row smaller; a picture behind it at a set strength (`cards/radio.jpg` until one is put up) | lavender row |
| ZINE MAKER | White paper, everything in dots: the words, a ridge, a sun. TALL lives here | tomato |
| ISLAND | BUILD A THERMAL SOLAR PRINTER, ONE CLICK INSTALL: the TM-T88V photo, its light breathing when the printer is live, paper feeding | amber |
| ISLAND ARCHIPELAGOS by novel.global | Rounded forms on soft grey, a link to the building hub | coral |

Every card has three layers: the picture stays still, the words drift down a little as the card passes, and the top layer (band, dots, forms) moves fastest; on some the middle layer breathes. The page and the top bar change with DAY / NIGHT (blueprint sea or dark sea); the cards never do. The banner and the switchboard are in full colour.

Pictures: CARD PICTURES on the approval page (up to ten for CIRCULAR STRATEGY with how fast they turn, one for the radio with how strongly it shows); an island keeper puts up to ten on their own island's card from `/island`. Each is made at most 1600 px and a JPEG on the phone before it is sent (which drops where it was taken). All of them load before the turning starts, so each change is instant.

## The reef (A.2)

Pressing the banner drops it open into a still white-line reef. It has dead coral, bommies, starfish, reef fish, worms, sea slugs and a sea snake, with marine snow drifting.

- It reacts to touch: fish scatter, the snow swirls, and coral polyps close. It feels alive, simple and reduced.
- It is the base of a future game. It is drawn in code, light enough to run on any phone.
- The El Niño and extreme states tint it later. For now there is only the hook.

The Irukandji is the one asset. It is drawn true to life, as a small clear bell with four long tentacles beaded with stinging cells. It is drawn as a hand-made 2D line on paper, never a cartoon, and never a second jellyfish.

## The switchboard

A panel at the foot with 21 jacks in three rows of seven. Each jack is one thing of its own: an experience, a thing done, or an island. A cable dragged from one jack to another wires those two things together, either way round. A cable dropped anywhere else falls slack and is not wired. Mistakes are allowed, and every wiring still does something. Each person has four cables, hung at the top left in their colours, so a board joins at most eight things. To make a fifth connection, one comes out first. How the engine turns a board into a print is in `docs/brief-1.2.md`.

**Found or not yet.** The first row is open to everyone. The other jacks are dark holes until they are found, and each lights up the first time:

| Row | Jacks | Found by |
|---|---|---|
| 1 | W.I.S.H., RADIO, ZINE, KIT, ENGINE, REEF, the eye | Open from the start |
| 2 | The moon, a print made, kin, a beacon followed, a motion chosen, a photo held, a song kept | Doing that thing on this phone |
| 3 | Seven islands | An island's code, from its print or a visit (H2) |

So two people's switchboards differ by what each has found. Found jacks stay on that phone.

| Wire | What changes |
|---|---|
| RADIO and W.I.S.H. (wired at the start, and can be unplugged) | The radio's song goes onto the poster as its card. |
| ZINE and W.I.S.H. | W.I.S.H. gets a TALL strip input, and the poster's words become the strip's words. |
| RADIO and ZINE | The song's code prints as a QR on the strip. |
| KIT and any | That card's print adds the build checklist's next unticked step. |
| Any other pair | A small visible flourish (the jack sparks, a note sounds). Never an error. |

Each jack has a mark of its own and no words: beads on a thread (W.I.S.H.), a sweep (RADIO), a strip with its ridge (ZINE), a board (KIT), islands joined (ENGINE), a coral stub (REEF), the eye, a crescent, a stamp, a dotted wave, a folded map, two squares, a shutter, a kept page, and each island's own outline.

Its name shows only on a hover or a touch, and only once found. A small flat light comes on beside a wired jack, and the jack glows. Nothing uses a gradient.

The wiring is kept on the phone (`da.sb.v2`, carried over from `da.sb.v1`), and a reset puts back the single starting cable. The switchboard is a toy first. The engine (E1) gives it its real vocabulary later: what each jack emits and accepts.

## The island control panel

It opens from THIS SPACE IS YOURS, in the same look as the column.

- **Visitors:** their found cards, their settings (sound, light or dark, motion: shadow or speed, location), and their wiring.
- **Island keepers:** an island's owner key unlocks its panel. They can edit their card (name, art, copy, its radar on or off) and their experiences (stacks), and see their printer's light and queue. They control only their own island, never novel.global or any other island.

## Joining without approval (pilot)

During the pilot a new island joins by itself:

1. The Pi asks for a code as now, then polls.
2. The site makes its printer at once, under the name the island gave, with no approval step.
3. The island is handed its printer token and, new, an **owner key**.
4. The island-kit prints the owner key as a QR on the welcome slip. Scanned, it unlocks that island's control panel on novel.global.
5. Its card shows on the column while its printer is online.

**Safety, as built:**

- **OPEN JOINING switch.** A switch on the approval page, on by default during the pilot, so open joining can be closed in one press.
- **Limits.** The existing rate limit (12 pairings an hour from one address) stays, and the islands cap of 160 still applies.
- **Hashed secrets.** The owner key is stored only as a hash, like the printer token.
- **Narrow scope.** The owner key's routes touch one printer row and its own stacks. They never touch stories, admin routes or other printers.
- **Reviewed art.** Island-written card text is kept plain and short, and any photo goes through the same image checks as stories.
- **Two-way stays off.** A self-joined island cannot print on novel.global's printer until it is made two-way.

**Recommended next:** a short "new islands" list on the approval page, with one key to hide a card, and a report key on each card.

## Codes, access and connections

See `docs/audit-1.1.md`.

- **Codes:** each family has its own shape and owner. W.I.S.H. pieces are DA-XXXX and belong to I W.I.S.H. alone. Keepers' keys open a single island. Island find-codes carry the island number.
- **Connections:** each printer switches on its own: W.I.S.H., RADIO, ART, WORDS, CARDS and CODES. novel.global's printer and the starting printers have all of them on, plus two-way, for true remixing. A self-joined island starts with none.

## Who does what

The work is split across the existing sessions. Everything that touches `front` is done in this session, so no two sessions write the same files. There is one full test pass at the end.

| Session | Part |
|---|---|
| this one (`front`) | The column, banner, reef, switchboard, card radars, CARDS on the approval page, open joining, owner keys, the control panel |
| 1.0 A (`island-kit`) | Open joining from the Pi: no approval wait, keep the owner key, print it as the second QR on the welcome slip |
| 1.0 B (`island-engine`) | The card format (a card is data: title, art layers, links, radar, lock) and the jack vocabulary (what each experience emits and accepts), in E1's schema |
| 1.0 C (receipts) | The slips the column prints: the build checklist as a receipt, and the long-press quick photo print, designed in its own files with nothing committed |

## Stages

| Stage | Delivers |
|---|---|
| H1 | The column, banner and reef, the switchboard as a toy, the hero opening the aura, every way back home |
| H2 | Card radars, locks and found codes, CARDS on the approval page |
| H3 | Open joining, owner keys, the control panel, island cards appearing when online |
| H4 | The jack vocabulary from the engine, so wiring changes what prints |
