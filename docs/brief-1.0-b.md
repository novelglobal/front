# 1.0 B: the archipelago engine

Written 6 November 2026. Replaces the earlier 1.0 B games brief: novel.global is treated as finished, and the games become a companion island of their own (below). It sits under `docs/brief-1.0.md`. The engine itself is built in `island-engine`; this file is the plan both repos follow.

## What it is

The archipelago engine is how anyone with a second-hand receipt printer and a small Pi makes a print experience of their own, owns it, and shares it, without writing code and without AI. novel.global is island 0: its showcase, its first template, and the home of the network.

It has three faces, each borrowed from something people already know how to use:

| Face | Like | What it gives an island |
|---|---|---|
| **STUDIO** | Canva | A visual editor: pick a template, change it by hand. Pages, receipts and flows made from blocks, dragged and typed, seen as they will print |
| **LIBRARY** | Steam, with its workshop | Every block and pack published by any island, found, installed in one press, forked into a mod, credited |
| **COMMONS** | Wikipedia | Everything published is open (CC BY-SA), with every version kept and a talk thread. Stewards curate. Anyone can improve a block, and its island accepts the change or not |

No face sells anything. Nothing sits behind a paywall, and nothing is ranked by money or likes: the library ranks by prints and keeps.

## What the project is

The project is the hardware first: a second-hand receipt printer (e-waste) and a small Pi, put back to work as infrastructure for the circular economy, for climate action, and as a new medium for stories and ideas. At its simplest, an island prints what people want to remember or share. novel.global gives the blueprint and the open-source one-click setup. The engine, the intelligence and the onboarding all happen behind the scenes, so the owner only plugs in and plays.

## Plugged in: the slip and the switchboard

1. **The first slip.** Once the printer is on the Pi, it prints its own way in: one QR code joins the island's wifi, and a second opens its **switchboard**. Nothing is typed.
2. **A mirror to start.** Every new island begins as a copy of novel.global under its own name, so it works from the first minute. From there, the owner changes anything.
3. **The switchboard** is the island's own control panel: the engine (the island's OS) as one screen. It works on a phone and on a desk.

### The switchboard's layout

| Part | What it holds |
|---|---|
| **Status strip** (top) | The island's name, the printer's light, paper, queue, last print, and the moon. Plain readings in boxes, in mono, the way a small 1-bit status screen shows them |
| **Experiences** (left) | The island's experiences, as cards or boxes stacked in a column. Each card has one mark, one big number (prints this moon) and a few dots for its state. A card can be added from the library or forked from another card |
| **Stack** (centre) | The chosen experience's blocks, top to bottom, each dragged into place, with a row of tool tabs above it: BLOCK, LIGHT, PATTERN, CAMERA, OUTPUT. One tab is open at a time, and that tab's panel takes its colour |
| **Preview** (right) | The phone page and the receipt side by side. The receipt is drawn at the chosen printer's own dots in true black and white, its paper colour as it will print |
| **One big key** (foot) | PUBLISH. One key, one action, as large as the panel is wide |

### How it looks

- **1-bit first:** black title bars on each panel, dithered images, mono readings, and nothing finer than the printer can print. This is the house look, and it matches what comes out of the printer.
- **Panels as windows:** the status strip, the experiences, the stack and the preview each sit in their own framed window with a title bar. They overlap on a desk and stack on a phone.
- **Big numbers, few words:** each panel shows one large figure and its unit, and a heading only where a panel would be lost without one.
- **Colour only to mark the open tab:** one flat colour fills the tab that is open, and everything else stays black, white and grey. In dark mode the colour stays, and the panels go smoked black.
- **The fleet:** novel.global's own switchboard shows every island as a small panel with its bars (prints, paper, queue, light), with one line at the foot for the whole network.

## Experiences and their stacks

An experience is a stack of blocks, a flow, and a QR code that starts it. A visitor scans the code, does what the page asks, and gets a custom print. The engine provides the parts, so the copy never names an occasion. Each island decides what its experiences are for. The parts cover, for example:

- **A photo and words:** a visitor uploads a photo (or not), and the receipt prints the island's words under it, from the island's own template.
- **A set or rotation:** photos the owner chose print in turn, each with the same message or a different one.
- **A poster:** a poster made from a template, printed on demand or on a schedule.
- **A board:** notes that people post and others find (something lost, something found, something wanted), printed when they're answered.
- **A journey:** steps in order. novel.global's own is notice, W.I.S.H. and direct action, and the farm island's is its games.

Every experience still ends in a direct action (the third of the four rules), and the island chooses which one.

## Roles, partners and networks

- **The owner** controls everything on the island's switchboard: its name, its experiences, its printer and its people.
- **novel.global** can always view and edit every island's switchboard, as its steward. An island can never reach into novel.global's switchboard (the one-way rule).
- **PEOPLE:** keys for staff, each set to approve, make or both.
- **PARTNERS:** other islands this island lets print here, and the islands it prints to.
- **NETWORKS:** the mesh, the novel.global feed, or none.
- **Printers:** each printer model has a profile: paper width (58 or 80 mm), dots across (384 on 58 mm; 512 or 576 on 80 mm), cutter, speed and darkness. Every block renders to each profile, so one experience prints correctly on any printer in the network.

## One island owner, start to finish

A café owner buys a second-hand TM-T88V and a Pi 3.

1. **The kit** (1.0 A). They write the card, plug in, and the printer prints its own way in. Scanning the slip pairs it, and the island appears on the network, its light on.
2. **A starting island.** It begins as a copy of a template: novel.global's own, a blank one, or any in the library (the photo booth, the shop till, the gig flyer).
3. **STUDIO.** Three canvases, one at a time, each of blocks:
   - **PAGE:** what a visitor's phone shows. Blocks stack top to bottom: a mark, a map, a camera, a pick, a button.
   - **RECEIPT:** the 80 mm slip at the printer's own dots (512 on the TM-T88V, 576 on most others), previewed in true black and white as it will print. Blocks: words, a photograph, a drawing, a QR code, a line, a code, the moon.
   - **FLOW:** the steps, as cards in a row. Each step takes an input and gives a receipt. novel.global's flow is notice, W.I.S.H. and direct action. A photo booth's is one card. A café's might be: the till rings up a sale, then the docket gets the day's direct action at its foot.
4. **LIBRARY.** They find a riso-look style from an island in Footscray and a frog-call sound pack from a school, press install, and both arrive in their island as their own copies, credited.
5. **Publish back.** Their counter card becomes a block in the library. Someone in Hobart forks it into a mod, and the credit chain prints as a small code at the foot of each receipt.
6. **STACK.** Where it runs: hosted or on the Pi, online or offline, mesh or none, which printer.

## The blocks

Everything an island is made of is a block, and every block is data with a fixed vocabulary. The engine draws it on a screen and on a receipt.

| Kind | Examples |
|---|---|
| Page | mark, heading (one line), map, camera, pick (choose one of three), dial, button, list |
| Receipt | words, photograph (with its curve and dither), drawing, QR, rule, code, moon, credit |
| Flow | step, input, output, wait (approval), schedule |
| Input | a visitor's phone, a sale at the till, a sensor on the mesh, a schedule (each morning), the moon's phase |
| Output | a receipt, a mesh line, a page, a share to novel.global |
| Pack | style, map and data, lives, sounds, steps, templates: a named set of blocks |
| Asset | fonts that print clean at 1-bit, marks, drawings, photographs, sounds |

## The decisions that make it work

1. **Data, never code.** A block is JSON plus assets, checked against the engine's schema. No pack runs a script, so a block from a stranger is safe on a shop counter. New kinds of block arrive only as reviewed changes to the engine itself.
2. **One block, two outputs.** Every block renders to the screen and to the 1-bit receipt preview, so what is designed is what prints.
3. **Every block carries its history:** an id, a version, the island that made it, its licence, and its parent if it is a fork. The credit chain prints as a small code.
4. **Install is a copy.** An installed block belongs to the island. Updates are offered, never forced, and everything works offline once installed.
5. **No AI.** The studio has no generated words or pictures. People pick, place, draw, type and photograph; templates and forks do the heavy lifting. Facts come from sources, credited.
6. **The till.** An input block takes a sale. The Pi sits between the till and the printer (USB, or the network printer's port 9100), passes the docket through, and adds the island's foot: the day's direct action, a counter card, a code. The printer stops being a passive sales printer and becomes an in-store driver and a creative tool for staff.
7. **The switchboard is the approval page grown**, with one layout for every island: status strip, experiences, stack, preview and one big key. novel.global's own copy adds the fleet.
8. **The four rules, enforced by the engine:** an island can be found and visited; nothing is behind a paywall; every journey ends in a direct action; and an island's devices are always open to novel.global, never the other way.
9. **novel.global is island 0.** Its packs are the showcase and the first template, and the library lives at its NETWORK key.
10. **A new island is a mirror.** It starts as novel.global under its own name, and every part of it can be changed. Nothing on it is locked except the four rules.
11. **Printer profiles, not printer code.** A new printer model is a profile (data), so supporting another piece of e-waste never needs a change to the engine.

## The stages

One stage to a session, each shippable alone. The test throughout: if the farm island (below) needs code beyond blocks, the engine isn't ready.

| Stage | Delivers | Where |
|---|---|---|
| E1 | The block and pack format, with novel.global described in it, and printer profiles | `island-engine` |
| E1b | The switchboard shell: status strip, experience cards, the mirror at first plug-in, the two QR codes on the first slip, novel.global's view of every island | engine, `island-kit` |
| E2 | RECEIPT studio: the STYLE editor from 1.0 C grown into a block editor at the printer's dots | `front`, then the engine |
| E3 | PAGE and FLOW studios | engine |
| E4 | LIBRARY and COMMONS: publish, install, fork, history, talk, stewards | engine, with novel.global's NETWORK key as the door |
| E5 | The till input and the counter-card schedule | engine, `island-kit` |
| E6 | The same engine on the Pi, offline: SQLite for D1, files for R2 | engine, `island-kit` |
| E7 | The farm island, built from blocks alone | its own island |

## The farm island (a companion, planned only)

A learning game built as its own island, beside novel.global, never inside it. The prototype tried in its own window was taken out of novel.global on 6 November 2026, and nothing on novel.global links to it. Build it only after E4, from blocks alone.

- **Its device:** a bare, unhoused AMOLED screen beside the printer: black glass, the paddock lit on it, nothing else. It's one of the inputs an island can choose.
- **The ground:** a bare Australian paddock in an El Niño summer, redrawn in flat tones from a real satellite paddock, kept by its place. The one Irukandji drifts over it as a ghost.
- **The play:** five short games, one for each of I, W, I, S and H. Each is a pick, a flip, a drag or a pull, never a blank field, and each prints its own receipt. The W.I.S.H. letters never print.
- **What grows:** each finished game unlocks a real regenerative practice, placed by hand on the paddock: contour lines, leaky weirs, riparian fences, shelterbelts, corridors. No stats, icons or words, only the paddock changing, until nature holds half.
- **What it's for:** learning W.I.S.H. by doing it, then going back to novel.global to act.

Its full design (the five games, the twenty unlocks and their sources, the hand dealt each moon quarter) lives in `island-engine` as the first story pack. It's revised there, not here.
