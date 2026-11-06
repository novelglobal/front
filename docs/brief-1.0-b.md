# 1.0 B, the games: I · W · I · S · H

Written 6 November 2026 from the owner's notes and the game designer's play of the current build. Nothing in it is built yet. It sits on top of `docs/brief-1.0.md` (the engine, the one-click island, receipts worth keeping) and goes further: novel.global makes the games, and shows them. Build it in the stages at the end, one stage to a session, each checked on staging first. Where this brief and an earlier one differ, this one wins.

## Purpose (for the team, never on screen)

The workflow is right, but it fails on the three things any behaviour needs at the same moment: **a reason to want it, the ease to do it, and a prompt at the right time.**

- **Want:** nobody sees what an intention could become, so nobody wants to write one.
- **Ease:** a blank line asking for an intention, then four more asking for W, I, S and H, is a writing exam.
- **Prompt:** nothing calls a person back: no printer near, no moon running out, nothing growing.

The designer's play, in short: the small ball is confusing; the lore and copy are good, but nothing embodies them; the rings and the path are dull, and hover words try to explain away the lack of a reason to press. There is no pull to make an intention, no grasp of W.I.S.H., nothing social, nothing to share.

**The answer: I W.I.S.H. becomes five small games, each a receipt, each growing a farm.** A finished story is shown first, so people want one. Every step is a pick, a flip, a drag, never a blank page, so it's easy. A printer near, the moon turning and a farm half grown call them back.

**The lore, embodied.** El Niño is the ocean's heat arriving over land as drought. The Irukandji, a creature of warming seas, drifts like a ghost over a bare summer paddock: the sea's omen over dry ground. Its call is a fog horn, a ship's warning on dry land. Every story finished brings the water back into the paddock, a line and a dot at a time, until nature holds half. Nobody is told any of this. They see it.

**The destination.** novel.global is to analog print what Steam is to games: one free, open place to find an island, play its games, make your own, and set up an island in one click. Every team is building towards it:

| Team | Building | At the destination |
|---|---|---|
| 1.0 A, island kit | one card, any Pi, a printer pairs by its own printed code | the console: any commercial thermal printer becomes an island |
| 1.0 C, receipts | thermal-first print, style packs from artists | the look: receipts people keep, mods people pick |
| 1.0 B, engine | the island format, packs, the builder (`island-engine`) | the kit for making: islands, packs, **games** |
| 1.0 B, games (this brief) | five games, story boxes, the farm, the finder | the showcase: novel.global makes the games and shows them |

**Every island, four rules:** it can be found and visited, nothing on it is behind a paywall, every journey ends in a direct action (a print, a pledge, a step taken), and its devices are always open to novel.global, one way. novel.global may publish to and print on any island's printers whenever it can reach them (online or by mesh), even when the island has a site of its own. That site links only to its own island and prints only to its own printer, never to novel.global's or another island's. The engine refuses an island that breaks any of the four (`island-engine`: `network.hub`, and `docs/runtimes.md`, One way, always).

## What goes

- The small ball as the home. It becomes the Irukandji's middle state: the ghost, pressed, draws in to it.
- The expanding rings as a path to walk. The rings stay, as the Irukandji's menu (below).
- Hover words, headings, sub-copy and explainers, everywhere. The intro copy and the lore stay; nothing is added to them.
- The automatic code. A phone is no longer handed a maker's code on its own (`me()` in `base.js`). A code comes only from a print, at a printer (and 888, the showcase, as now).
- Gradients, anywhere on novel.global. Only even opacity.

## The home: the shelf

The first screen is a **shelf of story boxes**: finished games, each a box with a cover and nothing else. Tarot proportions, pixel art in the expanded colour of the pixel maker. A cover is drawn by its maker, or made from a photograph.

**A box opened** shows its headline fact, its source as a code, and up to **five receipts**: 80 mm, short, set by the templates and styles. They come out one at a time, pulled like paper from a slot, in the order of the steps. I W.I.S.H. is the engine underneath: its letters never print as headings or letters on a receipt, a poster or any art. These are the hero ideas reverse-engineered: the receipts show how someone landed on the idea, one step at a time.

**At the end, one key: the Irukandji.** Pressed, it takes them to their own game on the farm.

The first boxes are the five in greatest need (the flying-fox, the ringtail, the bogong, the turtle, the froglet), each with the brief it already has, and the **riparian drain**, written out in full in `island-engine` as the first story pack:

| | The riparian drain |
|---|---|
| **Cover** | a kerb grate over a planted pit, roots reaching below, the street above, in pixels |
| **I** · caught | a flooded gutter after a storm · leaves held at the grate · a dry creek a street away |
| **I** · intention | street drains that hold water for the roots, and still stop the flood |
| **W** · what we know | stormwater carries the street into the creek; hard ground sends the rain away fast; slowing and soaking water is how sponge cities and leaky weirs work (each fact with its source, checked before it ships) |
| **I** · it would be great | a kerb that drinks: leaves and water pool in a planted pit under the grate, and spill to the pipe only when full |
| **S** · so let's create | a trial: three grates on one street, a water-level and soil sensor on a mesh node, a printed sign at each |
| **H** · here's how it works | the council's drains team, the creek's own committee, a café printer for each week's readings slip, a neighbour for each grate |

## The five games

Each game takes under a minute, prints its own receipt, and grows one thing on the farm. They can be played in order as a run, or alone. **No step starts from a blank field.**

| Game | The play | The receipt | Built from |
|---|---|---|---|
| **I · the catch** | The ghost drifts; three things rise out of the ground: a life seen near, a reading (38°), a place. Catch one or two. The intention writes itself from the catch, as word tiles; swap any one | the catch and the intention | the aura's catch (`caught`, `builtHTML`) |
| **W · the draw** | Three cards face down, dealt from what the island knows: a life's need, a reading, a case that worked. Flip them; keep one | the fact, with its source as a code | the lives pack, the briefs |
| **I · the dial** | Drag the paddock between now and grown back; stop where it would be great | the paddock before and after, split | the farm (below) |
| **S · the craft** | Put two cards together (the catch and a fact, a tool, a place) and a thing to make comes out: a grate, a planting, a poster, a song, a meeting. A third card, wild, comes from someone else's catch on the island | the thing, drawn as a blueprint | the briefs' roles, the board |
| **H · the strings** | Pull strings from the thing to who helps: groups, places, the nearest printer. Each string is a role | the pledge, dated by the moon | the strings (`45-strings.js`) |

**Like a roguelite:**
- **A hand each run.** Each run deals from the island's packs, seeded by the place and the moon. Everyone on an island gets the same hand that moon quarter, so people compare what they made of it.
- **Nothing is lost.** A run left unfinished fades at the next moon quarter, and what it caught stays on the farm as seeds.
- **Unlocks belong to a farm.** Each farm is one real paddock, kept by its place. A reroll deals a new paddock and a new farm, bare again; the old one keeps everything placed on it, so a reroll is a real choice. Art modes, marks, styles and sounds stay with the person. They grow from what `aura.js` already has (`lvUp`, `unlocked`, `GATES`).
- **Rare cards:** the rare and legendary lives (gold ring, two rings and a spark, as the map draws them now) are dealt seldom.
- **The five done** make a story box of the player's own: their receipts, their cover from the pixel maker. With a code, it goes up for the shelf and waits for approval, like everything else.

**What a code opens.** Without one: the shelf, the games, the farm, all on the phone. With one, printed at a printer and lasting a moon quarter: printing, the board, the shelf, the island's shared hand, and the finder.

## The farm

The ground behind everything. It's a work of art first: a bare Australian paddock in an El Niño summer, about 50% left to nature, in paper, watercolour and pixel. Nothing digital, nothing cartoon, nothing generated-looking.

- **From a real paddock.** A new farm picks a real paddock near Melbourne from the satellite imagery the map already uses, zooms in, and redraws it: five flat tones of straw, dust, dry green, dark eucalypt and water, as ragged-edged washes of even opacity, with sparse grain dots for paper. This proves the engine: a map pack's ground, redrawn by a style. Drawn once, kept on the phone, about 100 KB.
- **Still, nearly.** What moves: the ghost drifting, a few dots as birds once there are birds, the water's edge rising.
- **Placed by hand.** An unlock arrives in the person's hand, never on the paddock by itself. They put it where they want it: the weir across this bend, the fence along that bank, the trees on the windward side. Once placed, it does something: water spreads and holds, the banks thicken, grass comes in, birds arrive. More life follows from where it was put. No stat, no icon, no words, ever: only the paddock changing.
- **The ghost** is the one Irukandji, very small, drifting slowly over the paddock. Pressed once: the fog horn, and it draws in to the small ball. Pressed again: the ball opens into the three rings over the farm, holding as much as has been unlocked: little at first, more as the farm grows. The rings are the whole menu: small, mobile first, moving with it.
- **The balance.** One line across the paddock, light green farm against dark green habitat. Nature must get half. Shown, never said.

**Twenty unlocks, each a real effort.** Each game finished, poster made, song kept or file saved unlocks the next. Each is drawn in line and dot where it is placed, and each shows its flow-on effect: the creek fenced, so the banks thicken; the banks thicken, so the birds come. Every one links to the real work (each link checked before it ships):

| # | On the paddock | The real work |
|---|---|---|
| 1 | contour lines across the slope | Keyline design, P. A. Yeomans |
| 2 | short strokes across the creek | leaky weirs, the Mulloon Institute |
| 3 | pools along the creek | Natural Sequence Farming, Peter Andrews |
| 4 | dotted fences either side of the creek | riparian fencing, Landcare |
| 5 | dots in the soil | soil carbon, Soils for Life |
| 6 | the paddock split into cells | planned grazing, Savory Institute |
| 7 | a mosaic of small patches | cultural burning, Firesticks Alliance |
| 8 | native grass in the bare ground | Greening Australia |
| 9 | a line of trees on the windward side | shelterbelts, the Potter Farmland Plan |
| 10 | one dark green boundary held for good | conservation covenants, Trust for Nature |
| 11 | dark green joining two remnants | habitat corridors, Gondwana Link |
| 12 | the old paddock trees ringed | paddock trees, Bush Heritage Australia |
| 13 | the dam's edge planted | farm dams, ANU Sustainable Farms |
| 14 | zones round the house | permaculture, David Holmgren |
| 15 | rows that vary | regenerative organic, Rodale Institute |
| 16 | a fenced refuge, animals inside it | species return, Australian Wildlife Conservancy |
| 17 | scrub let back in | rewilding, the Knepp estate |
| 18 | cover crop between seasons | Brown's Ranch |
| 19 | small ponds where water gathers | sponge cities, Kongjian Yu |
| 20 | the line at half | Half-Earth |

**First visit: Victoria.** Before the paddock, the map of Victoria as it is: farmland light green, habitat dark green, drawn from the state's land use and native vegetation maps (DataVic). It's the only explanation the farm needs. Then the zoom, down to one paddock.

## The finder

**With a code, the ground becomes a compass.** A radar points to the nearest printer: its bearing, and its distance as a number, moving as the phone turns (the phone's compass, asked for on a press, as iPhones require). Printers online are bright; offline, a ring.

**A printer coming online is the strongest prompt.** While the site is open, the ghost glows and the fog horn sounds once. On a phone where novel.global is added to the home screen, it can come as a notification (iPhones allow this only for sites added to the home screen).

## Find, play, make, keep, stack

These five words replace the site's steps. They sit in the rings as word blocks, small and few: **FIND · PLAY · MAKE · KEEP · STACK**. A block pressed flips over to show its settings. Going deeper is a **path of tabs** (MAKE › STEPS › BOOTH › FRAME), each word a way back, with only what is in use open.

- **FIND:** islands near, on the map and in the directory, and the finder.
- **PLAY:** the shelf and the five games.
- **MAKE:** an island of your own: the island builder (`island-engine/docs/builder.md`) as word blocks: ISLAND, STEPS, PACKS, PRINTER, PEOPLE.
- **KEEP:** the portfolio, the boxes, the receipts, the farms.
- **STACK:** where the maker decides the technology: hosted or on a Pi, online or offline, mesh or none, which printer (any ESC/POS or Star printer, 58 or 80 mm).

## The stages

One stage to a session, after 1.0 C has landed. Each one is shippable alone.

| Stage | What it delivers | Where |
|---|---|---|
| **G0** | This brief; the story and board packs in the island format, with the riparian box and the farm's twenty stages as data | `island-engine` (done) |
| **G1** | The shelf as the home; a box opens into up to five receipts; the Irukandji key at the end. The riparian box and the five in greatest need | `front`: `aura.js`, `aura.css` |
| **G2** | The farm: a real paddock redrawn in paper pixels, kept by its place, rerolled for a new one; unlocks placed by hand, each changing the paddock; the ghost, the fog horn, the ball, the rings; the balance line | `front` |
| **G3** | The five games, each a receipt and an unlock; the hand each run, seeded by the moon | `front`; then the engine's journey runner (E4) |
| **G4** | Codes only from a print; what a code opens; the finder; a printer online as the prompt | `front`: `base.js`, the Worker |
| **G5** | Victoria first: farmland and habitat, then the zoom | `front`, data built once by `build.mjs` |
| **G6** | FIND · PLAY · MAKE · KEEP · STACK in the rings, in place of the steps; MAKE as the builder | `front` and `island-engine` (E7) |
| **G7** | A player's own box on the shelf, approved; the island's shared hand; boxes from other islands | `front`, the Worker |

## Decisions (the owner's)

1. ~~**The paddock's ground**~~ **Decided, 6 November 2026: a real satellite paddock each visit, redrawn.** It proves the hackable map. The imagery is free to view online with credit, and the credit is shown; offline islands use open imagery, coarser but enough for pixels.
2. **The first visit:** Victoria's map before the paddock, every first time; or only once a code is entered.
3. **The shared hand:** everyone on an island dealt the same hand each moon quarter (recommended), or every run its own.
4. **The receipts per box:** always five (one for each step), or up to five, as each story needs.
