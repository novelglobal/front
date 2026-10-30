# novel.global — developer handover

The site is novel.global: its label, name, headline and address. Its first work is a web app (once called Direct Action, then DIRECT ACTION RADIO) for the El Niño summer of 2026–27, covering Brunswick to the Melbourne CBD. It shows live iNaturalist sightings on a radar over satellite imagery, with the El Niño threat to each life. When someone opens a life, its radius shows the human ecology around it: shops, brands, the circular economy, artists, third spaces and networks. People join string figures between the life and those places, listen to them, and write a W.I.S.H.

W.I.S.H. is the concept: a praxis poem. **NOTICED** is the intention to respond. **RESPONSE** is the W.I.S.H. itself: taking on responsibility, joining theory to action, and reflecting. **DIRECT ACTION** makes it a pledge, printed as a receipt at a partner place, sent by mesh where that place has a radio, and kept on novel.global. The name W.I.S.H. and its four lines stay as they are.

The app works offline in the browser. Stages 1 to 3 of `docs/roadmap.md` are built: the map fixes, stories shared with approval, and print queues pulled by a Raspberry Pi at each partner place. Next comes live data behind the Worker (stage 4).

**From v0.1 (24 October 2026) the site has two builds.** The **base** opens at `/`: a light page with one question, "What have you noticed?", a camera, and W.I.S.H. as the way through a noticing (below, "The base, v0.1"). The **studio** is everything built through the pilot, now at `/studio`, and every link the studio ever printed still opens there.

Read this file first. Then read `README.md`, which is what users see, and `docs/brief.md`, which explains the product decisions and their sources.

## Status at a glance

| Area | State |
|---|---|
| The aura, `/` | `src/base/aura.js`: the showcase. A seed, a big bang, the globe, the irukandji as the interface (notice, W.I.S.H., art, print; the map, species, data and El Niño held), a colour portfolio. Checks: `ONLY=aura node test/run.mjs` |
| The base, `/?base` (v0.1 alpha) | `src/base/`: the photograph, a line, a real alert, the receipt with W.I.S.H. as one key, the reel; GUIDE; MAP with batch adding; RADIO as net, reel and help; the pixel board. About 60 KB to first paint, no map library or webfonts. Checks: `ONLY=base node test/run.mjs` |
| The studio, `/studio` (map, cells, strings, ledger, constellations, slip in two styles, outputs, sharing, partners, the local mesh, cell packs) | Built and working, with browser and server checks (`npm test`) |
| Hosting | The Cloudflare Worker `front` builds this repo on every push. `main` is live at `novel.global`; any other branch, such as `staging`, gets its own preview address. See `docs/workflow.md` |
| Source and build | This tree is the GitHub repo `front`. `npm run build` writes `dist/`, which is the deployable site |
| Worker | `src/worker/index.js`: stories sent and approved, a print queue for each partner place, the approval page's requests, all on D1 (`front-db`; previews use `front-db-preview`) |
| Approval page | `/admin`, behind the `ADMIN_KEY` Worker secret. Stories wait there until shown or refused; printers are paired there |
| Print queue | Built on D1, not a Durable Object. Jobs wait for approval (unless a printer is set to print without it), a day at most |
| Pi receiver | `receiver/pull.py` (standard library; printd for the printer, Meshtastic for a radio), `da-pull.service`, and step-by-step setup in `receiver/README.md`. Tested end to end against the Worker; the hardware at Pickles, Kines and Coffee Bar Elsie is still to be set up. A job with no bytes (sent to the local mesh) goes out by radio and is not printed |
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
- **The moods** (`MOODS` in `68-tracks.js`, turned round on each layer's mood key): FOG, RAIN, WEIGHT, then JELLY (a glass bell that opens and closes), BURIAL (dust, a voice cut into two syllables, a sub), HAUNT (a wavering electric voice doubled, cut as from tape), VOODOO (a low string through a ladder that squelches shut), CHEEKY (rising bubbles) and BLOWN (a deep tone driven until it breaks up). Each is a voice in `snd.ping`. No drums, no drone and no bed of sound: every sound is a cell, a place or a string the hand reaches.
- **The Moog ladder** (`repo-static/ladder.js`): an audio worklet ported from Aaron Krajeski's public-domain model in github.com/ddiakopoulos/MoogLadders (credited in `vendor/LICENSES.md`). JELLY, HAUNT, VOODOO and BLOWN use it, and the horns. A plain low-pass stands in until it loads, or where worklets are missing.
- A poster kept sounds a **fog horn** far off over the water (`snd.horn`); the muse rings as a glass bell (`snd.jelly`). No samples are loaded: every sound is made here.

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

Two styles, chosen with **>** beside PIN and kept in `prefs.slip`. The default is the paper slip, unchanged. The second, `'tty'`, is the terminal, the most minimal: the life's photograph as a square hero the width of the slip (its own photograph, else an open-licence one of the same species from the sightings, else its mark as art: `heroSrc()`), then its code and time, its name, and the four lines after `>`, in VT323 on plain paper. Nothing else is shown. `slipText()`, `slipCanvas()` (`ttyCanvas()`) and `escpos()` take the style, so the PNGs and the printer at a partner place match the screen; the QR code still carries the whole signal.

Each output machine is drawn as its hardware and links to a reference page about it. Pasting a link, a packed signal or a mesh message into RECEIVE on the STORIES page brings a signal back into the app.

### The pages: four destinations (0.03)

The rail holds four destinations. The first three are one journey, joined by a fine thread with a knot at each; a knot ties in clay as the day's journey reaches it (`DAY`, `da.day.v1`, starting again each day): a life opened, a string tied or a W.I.S.H. issued, a slip sent or printed. PORTFOLIO stands apart. Behind the scenes, never on screen: **make it right** (RADIO), **make it work** (SIGNALS), **make it beautiful** (SIGNS and PORTFOLIO).

- **Only RADIO shows the ground; once started, the radio plays on under every page** (`setView` and `shareMix` no longer stop it). On SIGNALS, SIGNS and PORTFOLIO a surface covers the map (`body.off-map`, `#cover`); a life opened from any page brings the ground back for as long as its card is open.
- **RADIO** (`#radio`; `#now` still lands here). Every mark stands on the map; the radar plays, it does not reveal. Top to bottom, with no headings or numbers: DIRECT ACTION RADIO; EL NIÑO EMERGENCY IN and its countdown, in orange; the outlook as an equaliser (still unless pressed, lifting while the radio plays; time on the radar held back, `CONFIG.FEATURES.time`); one analogue play button (`setRadio`); the layers; SIGNAL.
  - There is no radar until it is put down: a first tap on the map puts it there and turns the radio on; the play button pressed first puts it where the map is looking (`placeRadar`, `prefs.placed`). Nothing sounds, and the hand does not turn, while the radio is off. A life opened keeps it playing.
  - **The layers** (`LAYERS` in `68-tracks.js`): LIFE, COMMUNITY (the places that care, and packs of cells), WATER (creeks, wetlands, ponds, drinking fountains), POLLUTION (the places on notice). Each has its key (or 1 to 4), its own mood as an icon (FOG, RAIN, WEIGHT; `prefs.lm`), a meter that moves as the sweep plays it, and a volume of three steps (`VOLS`). Every water body and fountain within a life's reach is a knot strings can tie.
  - **SIGNAL** sends the whole mix (`mixNow()`, `MIX_V` 2: where; each layer on or off with its mood, level and every cell it played, by name, bearing, distance and pitch, one turn of the radar its loop; the constellations with their knots and strings) to SIGNALS, and the radio stops. Kept in `da.mixes.v1`.
- **To add a layer:** one entry in `LAYERS`, a count in `trackCount`, cells in `layerCells`, and a sound where its cells are swept.
- **No words but the clues.** RADIO has no headline: El Niño's countdown in orange beside its sun, the equaliser (a heat mark above the hottest months), one flat play button that clicks, the layers as coloured keys, and three **clues** on small LCD screens that unlock in turn (`cluesHTML`): a magnifier, a compass and a question mark (where are you? a tap on the map puts the radar there and starts the radio); a web, a chain and a string (tie one thing to another, or change a layer); then START A SIGNAL. Until the radar is put down, the first clue floats on the ground. Every other name is in `data-tip`, shown after a long hover (1.1 s), and in `aria-label`.
- **The journey, last pass.** Nothing floats over the map on arrival (the `#arcade` clue is gone; "find yourself" is the first clue in the page). Once a signal is started, RADIO's checklist is a five-step protocol (`checklistHTML`): 01 Where are you? 02 Start a W.I.S.H. (two lines) 03 Finish a W.I.S.H. (one sent from the form) 04 Make a poster 05 Print (anything printed here or sent to novel.global's printer, `da.printed.v1`; it links to the posters in PORTFOLIO). START shows again only once all five are ticked. The photograph proof (`takeProof`) stays in the code, off the checklist.
- **Serious beside playful, on every page.** RADIO: the checklist ruled, numbered and stamped in red; the layers as round keys that jump. WISH MAKER: the W.I.S.H. an official paper document in both lights (its number, the letters in Playfair, ruled lines, R&D, the muse as a seal); the pieces as stickers (species photographs, constellation charts, cells, W.I.S.H.es as a receipt mark, names on hover); the boards as a row of tabs, each signal as its lives with a play key. PRINT SHOP: the queue a readout; the stickers tilt under the hand. PORTFOLIO: the W.I.S.H.es filed (`#sec-wishes`) in the page; the posters on a wall beside it (`#gallery`, `showGallery`), the newest as the hero.
- **The first visit, a simple way through** (`43-journey.js`; Stage A of `docs/brief-0.06.md`, as the owner refined it on 21 October). `prefs.journey`: 0 the map alone, 1 RADIO, 2 W.I.S.H., 3 PRINT, 4 done; a device that has been here before is done (`NEW_HERE` in `00-core.js`). `simple()` and `body.simple`, `j0` to `j3` gate it; only the tabs reached show (`jMarks`, `jMax`), each arriving with light, a note more of a rising dub figure (`snd.gate`) and motion, never words.
  - A tap on the bare map puts the radar down there at 500 m (`CONFIG.SCAN_FIRST`) and brings up the radio at half its height (`radioFront`); a sonar ring says where to touch (`jHint`). A life, a place, a printer, a group or a string tied (`jPick`, through `select`, `jTap`, `selectPartner`, `selectTribe`, `markConnect`) opens W.I.S.H. over the map: the receipt as intel, no code (`intelCanvas`), the intention device (`wishFront`), six suggestions (`jActs`, see the second pass below); a place touched there while a life is held is tied to it, a string on the receipt (`jTie`). Make keeps it as a signal (`jr: 1`, its selection in `jsel`) and opens PRINT: a label maker half the size (`printFront`), SELECT its hero (lives first, no made-here tab), the words typed on the receipt itself (a Fabric textbox, `daKind: 'words'`), the code to scan at its foot (`jCodeCanvas`, `daKind: 'code'`, always on top). Print sends it as before and opens novel.global with it as the hero, waiting to print (an amber light, `galleryFocus`); everything unlocks (`jDone`: the chord, the jellyfish burst).
  - A link someone was sent skips the bare map (`jLinked`); the tiny NOVEL.GLOBAL in the information corner, pressed twice, opens everything (`.da-egg`); Settings has a key to play it again (`#ix-journey`, `jReplay`). The checks opt out with `"journey":4` in `wire()`; `ONLY=journey` walks it at a desk's width and a phone's. The veil came in the second pass; left for later: the heat wind-back (gate 0 of the brief).
- **The fronts for everyone, 21 October, second pass** (the owner's walk-through of the first visit). What a first visit walks through is how the fronts work after it, too: `radioFront`, `wishFront` and `printFront` (PRINT's dongle) in `42-faces.js` are the small devices for everyone (see the fourth pass); the old fronts and the cover preview are gone. Each is old analogue kit, modded: smoked shells, two screws that do not match (`.h-screw`), a stub LoRa antenna and a grip on W.I.S.H., a cable tie and a cream keycap on PRINT, PRINT's paper out of a slot at its head (no window that reads as a slider), and SELECT as a sheet of die-cut stickers. Once everything is open each front shows its upgrade (`upMods`, `.dev.upg`): a LoRa module with its antenna and wires at the head, a yellow cable down the side, and the jellyfish key on a board of its own: the mod that turns it over to the studio.
  - W.I.S.H.'s front stands over the map in both (`offMap`, `wishOverMap`); its back is the board, the blueprint. A connection laid on the board on purpose (the card's TO THE BOARD, a card turned over, the radio's signal) turns W.I.S.H. to its board (`toBoardFace`). Once everything is open, a life, place, printer or group touched while W.I.S.H.'s front is open becomes its receipt's subject, as on a first visit; with nothing touched, the receipt is of where the radar stands (`jHere`).
  - The suggestions (`TIPS`, `TIPS_OF`, `jKinds` in `43-journey.js`): six cards of one size, three for anyone by the broad kind held (wild animal, pet, plant, people, place) and three for its kind of life (birds, flying-foxes, possums, other native mammals, foxes and rabbits, reptiles, frogs, fish, insects, small life, plants, fungi, dogs, cats, people). Each is an action and one plain fact most people do not know; as many as wanted are taken up (`JR.acts`), each printed on the receipt with its fact; the four lines carry them short (the first fact, the intention, the actions). Change a fact there; keep it short and true.
  - A first visit opens on a veil (`jVeil`): What have you noticed?, small, for five seconds or until a touch, which plays the first note of the rising figure. The map no longer opens on the Pickles printer (`S.scan` starts at `CONFIG.SCAN` on a first visit), no printer shows until one is online, and the sonar rises where life gathers on the screen (`gatherAt`).
  - The rewards: a step met is answered once on a device (`stepsCheck` keeps them met), and the steps a first visit met are kept without a sound (`stepsQuiet`), which was the ding after the first print. A slip on its way is checked every twenty seconds while the page is in view, so its light turns green soon after it prints.
  - The information corner stays folded until ⓘ is pressed (MapLibre opened it as the map loaded). Sound is woken again by any touch after a phone has put it away (`snd.running`). Settings' keys share one line on a wide screen, the name under them.
  - The showcase fills its screen and holds still: sliding it changes its number and its cards in place (`galleryCards`), never drawing it again. A poster's card carries its receipt's life, mark, day, danger and place (`posterCard`, `cardIntel`), on the card, on its back and opened.
- **The third pass, 21 October: the owner's sense check, and stage D.** The way through, as the owner put it: the radio, something touched, W.I.S.H. over the map, PRINT, printed, everything open.
  - What W.I.S.H. holds stays marked on the ground while its front is open (`jHeld`: a steady ring, and a dashed string to each place tied), and in sight: if the receipt, the suggestions or the device would cover it, the map slides it to the nearest clear ground, once for each thing held (`jClear`). The suggestions wait shut behind a tab at the receipt's side (`jrTabs`, `jrToggle`, `jrOpen`), opened by the tab or by the key on the intention device where SELECT was (`.vs-sg`); the tab counts those taken up. A line too long for the four lines is cut after its last whole word.
  - PRINT is a dongle (`printFront`): SELECT as a sheet of die-cut stickers, `Aa` for words typed on the receipt itself (`[data-jwords]`, `jEdit`), a cream keycap that takes back, and print. Once everything is open it carries its upgrade and its jellyfish key to the studio side (the whole label maker that stood here in the third pass was dropped in the fourth: the owner found the dongle better).
  - What is made goes on the board too (`jBoard`): its receipt as intel, with any string tied, placed on the board in use, so W.I.S.H.'s studio side opens on the story so far. RADIO's studio side has a VU meter by its board (`.vu`), kicked by each sound on the map (`vuKick`).
  - SELECT (`69-pick.js`) is an uncased OLED module: a bare board with its holes and pin header, black glass, pixel type, a word under each key and kind of piece (`PICK_W`, `.pk-kw`; LINK and CLOSE too). A pink jumper wire runs from the key that opened it to the module and follows it when it is dragged (`selWire`, `pickFrom`).
  - Light and dark per page: W.I.S.H.'s board is the blueprint by day and night (its ink always light, `figArt` and the pencil in `#F2F6FF`); novel.global is the paper by day and a deep grey of 1990s hardware by night (`#222325`); the switch in Settings reads DAY or DARK.
  - The showcase holds still and fills its screen clear of the rail, its piece at about two thirds of it; a pinch or the wheel zooms it in place, a press doubles it or brings it back, a drag moves it while zoomed, and the zoom key does the same, with no second window (`gzTo`, `gzApply`, `gzReset`).
  - On a phone a page opening or a device turning over keeps the device on its rail: the `wipe`, `flipin` and `flipout` keyframes carry `--rail`, so it no longer leaps to the top of the screen while it moves.
  - The icon (`repo-static/icon.svg`, `icon-192.png`, `icon-512.png`, `icon-mask.png` for phones that cut their own shape): the jellyfish as 16 by 16 pixel art in four Game Boy Color tones of the background's band, its bell filled with the band reversed, its outline and tentacles in the darkest ink, one glint.
- **The fourth pass, 21 October: the owner's notes from a phone, and stage B.**
  - The sound watched over (`snd` in `00-core.js`): a phone can leave its sound "running" with its clock stopped, or give it back silent, and a voice can blow the mix up; an analyser on the output and a watch on the clock catch any of these (`clockOK`, `sick`), and the whole sound is built again (`rebuild`) at once, or at the next touch where a phone asks for one, instead of staying quiet until a reload. POLLUTION's stabs share one Moog ladder for as long as the sound lives (`stabLadder`; `ladder.js` takes `keep`), where each stab built and dropped a worklet of its own. `snd.__sicken()` breaks it on purpose, for the check.
  - The jellyfish key and its little board are smaller and sit inside the device's foot (`.up-plate`, `.dev.upg .flip-b`), never reaching the tabs; W.I.S.H.'s tape is a stub LoRa antenna (`.h-lora`, hidden once the upgrade's own module is there); RADIO's VU meter is small and sunk into its board strip.
  - A line, station to station: make hands the receipt to PRINT and clears W.I.S.H. (`JR` emptied in `jMake`); print hands the strip to the wall and clears PRINT (`pressDone`: the story kept in `PRESSED`, `da.pressed.v1`, so the press does not offer it again; the strip emptied). The print stays as a poster on the wall, in SELECT and on the board. Print does nothing on an empty strip.
  - PRINT's front is the dongle for everyone, upgraded once open (`printFull` is gone).
  - The suggestions are half the size, chips of one size (`.jr-act`); on a phone two to a row, all six in view, never squeezed (`.jr-sg{flex:0 0 auto}`); the count is on the device's key alone; the receipt over the map is a little smaller.
  - The showcase: each poster's own card stands at its side (`.gl-pair`, `cardBtn`); a card pressed turns over and pressed again turns back, and a small key on its back opens it (`[data-gc-open]`); on a phone the close-up key opens the piece full screen over everything (`galleryFull`), pinch, press or drag inside it, Esc or the key again to close.
  - Stage B, the parts still wanted after the owner's own changes: the first board's template (`tplObjects`, `ensureTemplate` in `69-board.js`): a box for each of W, I, S and H saying what research goes there, a codec note on each tool (NOTE, SECT, LINK, IMG, ZOOM, LOCK, OUT) and how the board works, laid once on the first board of one's own, opened empty or holding only what a first visit made (which goes into W); every piece can be deleted, and a board emptied stays empty (`da.tpl.v1`). Its words are `TEMPLATE` in `config.js`, or as rewritten on the approval page (TRACKS → BOARD 01 · THE TEMPLATE, kept as the `template` setting). And a choice of printer: with more than one online, PRINT's light opens them, each with its light and its place; the one chosen is kept (`prefs.prn`, `prnNow`) and prints go there.
- **The fifth pass, 21 October: lighter, faster, one answer at a time.** An audit of the whole first visit for weight, sound and touch, phone first, and the changes it made:
  - One answer to each moment. A first visit's radar set down is the gate's note alone (`placeRadar` no longer toots), a first make the gate's note alone (no printer under it), and tying a thread or making a first change adds no sound of its own (`tie`, `markTweak`). The unlock runs the rising figure of the gates through to the high A on the sixteenths and lets the sub fall (`snd.gate(5)`), one rise of jellyfish (`jBurst`) instead of two systems at once. A life touched answers in its own voice, the note the sweep gives it (`snd.knot` with `partialOf`), not a click. Every click is on a note of A minor (`snd.tick` through `qn`), so a knob turned climbs the scale.
  - PRINT in time: the head steps audibly now (the printer's gain swings from nothing to full, 38 times a second, and fades out); it sounds for everyone, motion or not (`feedAnim`); the tear is heard when the paper is seen to tear, 1.5 s in, not when the network answers (`tearAt` in `pressOut`).
  - The veil answers a touch on a phone: it listens for a click, by which time the phone has counted the touch as a gesture and lets sound play. Sound off in Settings no longer throws (`snd.droneOff` was long gone) and on again brings the layers back (`syncTracks`).
  - One switch for stillness: `.still` follows the Motion setting and the system's reduced motion together (`reduced()`), and every first-visit cue has a resting state under it (the sonar a still ring, the jellyfish resting, no flash).
  - Haptics: one pulse per moment (the short ones that cancelled the one before are gone, a click is 8 ms); an iPhone has no vibrate, so a hidden switch is flipped for the patterns only (a gate, a set down, a print), which Safari 18 answers with its own haptic (`buzz`, `iosSw`). Untested on a phone in hand.
  - Lighter: `build.mjs` minifies `app.js`, `style.css`, `marks.js` and `vendor/qrcode.js` with the esbuild that comes with wrangler (plain files if it is missing; `DA_NOMIN=1 npm run build` to read them); `config.js` and the data files go out as written. About 380 KB less to parse and 90 KB less over the wire. About 400 CSS rules no longer used anywhere were removed (`src/app.css` 337 KB → 304 KB). The faint relief reads elevation at zoom 13 at most (`demShade`), a few small tiles a view instead of about a megabyte.
  - Faster: the offline copy installs once the map is idle, not alongside the first view (`regSW` in `70-boot.js`), and keeps `vendor/` (the libraries and type) cache-first, since a release renames the cache. Fabric is fetched while W.I.S.H. is in use, so PRINT opens at once. Nothing is drawn on the map's canvases while PRINT, the board or novel.global covers it, and the weather layer draws no heat on a mild day and then stands still. The sound's noise buffers are made once per length.
  - Safer: the board and the press strip say FULL · NOT SAVED when the browser's storage is full, instead of SAVED; undo keeps 12 steps, not 40 full copies. The showcase is drawn again only when what hangs on the wall changes, so news arriving no longer snaps a swipe or a close-up back.
  - On a phone: PRINT's SELECT is a tray of one row sitting on the dongle, the receipt above it and print in reach below; W.I.S.H. has one key for the suggestions (the device's own, 40 px with a larger touch area), and the keyboard's key reads Go; the hidden field Fabric types into is 16 px, so an iPhone does not zoom in on the receipt or a board note; PRINT's strip fits above the dongle and below a notch; the first W.I.S.H. comes up raised; no hint points under the receipt; the four tab names are 10 px.
  - Once open, a life sent to W.I.S.H. from its card on RADIO is what W.I.S.H.'s receipt holds, with its strings (`sendSpecies`).
  - One kit: PRINT's screens use the same LCD as W.I.S.H. and RADIO, and every 'on' light the same green; SELECT's words are 12 px, the plates' and the tabs' small words 9 px at least; upgraded, the first visit's jumper and tie stay beside the upgrade's module and cable (the owner likes the mods: kept, never sterile); the layer keys' bounce has its own name (`keypop`), so the place photo no longer tilts like a toy key.
- **In the field: the touch screen joins, and the approval page shows who is on which Wi-Fi, 31 October.** The sketch in `src/touch` is now the one on the screen (the owner's continuous swim, tentacles gripping the bezel, night scene with fireworms, the code peeking in, a print confirmed only once the site accepts it), with: joining that asks again a different way when turned away (`joinWay`: plain; the strongest transmitter by address and channel; a gentler transmit power; WPA2 alone without protected frames), the way that worked kept per Wi-Fi (`ways[]`), and the reason said plainly (code 2: "the router didn't finish letting it in"); the Wi-Fi it is on and its strength sent with each ask (`?net=&rssi=`); the slip forgotten once the site takes it; asks every 2 s (every second was ~86,000 requests a day, near the free plan's 100,000); the 30 s print-by-itself made a setting (`NG_AUTOPRINT`, 0 for never). The Worker keeps each one's Wi-Fi (`printers.net`, `printers.touch_net`), writes "seen" at most once a minute, and passes CHANGE WI-FI to a receiver whose `can` includes `wifi`. The approval page's printer card says which Wi-Fi the Pi and the screen are on, how strong, and whether it is the same. **Still to do, in `receiver/` (asked first, as the receiver was to be left alone):** pull.py sending `net` and `can=wifi` and opening the setup Wi-Fi when asked; wifi.py marking networks too weak for the screen, and its confirmation slip carrying the joined Wi-Fi's code. Compiled for the T-Display-S3 (ESP32-S3, CDC on boot, OPI PSRAM): 90% of the default app space. Cache da-v114.
- **The desk deep and under water, what it plays shown, pixels that print, 30 October.** The desk no longer uses the gamelan and harp (the carol with bells): its own voices (`DV`: a drop, a whale's glide, a reed pad, a sub, dust grains) through an underwater chain (`deskOut`: a slowly breathing low-pass and a fading echo), in three deep moods (tide, bloom, doom). After latentscore's idea of text to musical settings (that library itself is Python and cannot run in the browser), the intention's words set the desk (`txtRead`: light words open the filter, dark ones close it, short words lift the tempo). Every note knows what made it (`lab`): the desk shows the word or place sounding, and for WEB draws the radius's constellation with each join lit as it plays (`geo`). The radio's three knob positions (MIST, HALL, DEPTH) are far enough apart to hear. The pixel art prints in ink whatever colours it shows (photo colours were drawn into the print pass and pale ones vanished); the pixel maker has a key to make it the poster's main picture, and its key in the tray is held up larger. Cache da-v113.
- **Seven devices, sound that starts, quieter words, 30 October.** Devices are earned one at a time and one never opens another (`GATE_AT`, `earned(k)`, `applyGates`): music (the sound key), INTENTION with W.I.S.H., art and print (the aura's own steps, open from the start by default), and the radio, research board, design and four-track desk (after 1, 2, 3 and 4 posters by default), each set on the approval page. `openDev` refuses one not earned, so the intel, the desk's radio key and the window's bar can't go round it; the studio window opens with `&only=` and holds that page (`AURA_ONLY` in `setView`, its rail hidden). Before the desk is earned the sound key gives a simple radio (sources, moods, play). The sound key now wakes the sound in the tap itself (a desk that autoplayed a moment later was silent on phones and with the hum off); a song's words come round again to fill its bar, and the radius's joins likewise, so it never thins to silence. The desk's words show only on hover. The blank receipt's word waits 30 s and fades in slowly; the approval page's sign-in line is empty until there is an error (the password's note is in the GUIDE). Cache da-v112.
- **The approval page overhauled, 30 October.** A side rail of twelve sections (OVERVIEW, WAITING, SHOWN, REFUSED, ARCHIVE, PLACES, PRINTERS, WORDS AND BOARDS, PORTFOLIO, SETTINGS, DATA, GUIDE) on a plain navy-and-white desk. **Nothing is lost:** deleting a story, place or post archives it (`status = 'deleted'`), refusing keeps the photograph, and everything sent is kept a year; ARCHIVE brings one back to waiting or deletes it for good (`restore`, `purge`). **Counts:** a `traffic` table of things per day, never people (no addresses), from the API (`tally`, after the answer) and from `/api/beat?k=` (pages opened, pieces begun, prints, wall, songs, devices). `/api/admin/overview`, `/api/admin/traffic`, `/api/admin/export` (everything but tokens and photographs), `/api/admin/places/import` (CSV or JSON from the DATA page, up to 2000), `/api/admin/reset` (stories, BOARD 00, places, posts, words, settings, counts; archived, never the printers, tokens or password; the page asks for RESET to be typed). **Settings for everyone:** `gates` (devices earned after 1, 2, 3 posters as set, all open, or closed; open everything still opens all), `fx` (calm, as built, chaos: particle count and pace), `phreak` (base64 drifting under the stars), `curations` (twelve, each a tab on portfolio.html, a post's curation its category). CLEAR THIS BROWSER empties what was made in this browser for testing as a new visitor. The sound desk starts on what there is (the playlist, else the first source with something in it), dims empty sources, names every key, and has four layer keys (named for the mood's instruments) to switch each track on or off, in play and in the 45 s loop. The intention's line is a row of star dots gathering into place (`starLine`). Cache da-v111.
- **Mesh only when asked, paper before radio, one wall, 30 October.** The studio sent a mesh line with every print, whatever was chosen (`directAction` in `65-share.js`); now only when sent to the mesh. The Worker's queue gives a printer its print jobs before any mesh-only line (`ORDER BY (escpos IS NULL), created`): the receiver opens a new Meshtastic connection for each line, which can take most of a minute, and prints had been waiting behind it. The aura's wall now also shows the studio's print-shop posters (`studioPosters`), newest first; the studio's portfolio has a WALL section (`wallSection`, `wallFill`) reading the aura's `folio` store, a touch showing one large, and a key to the wall itself.
- **Receipt as the poster, and owner fixes, 30 October.** The receipt's lower band is now the poster's own: pieces that reach up over the line under the words come through whole (taken from a drawing of the pieces alone in print ink, `io`, so the words beside them never do), and the code is drawn crisply where the poster has it, in the same row, right-aligned to its place, at least four dots to a square and up to 260 dots (`qk`, kept white on a night slip). The separate code block at the foot is gone; the day sits beside the code in the head. The pixel irukandji had been drawn in screen ink in the print pass (`usePaper(true)` now wraps it). The art step's empty state lost its key back to noticing. The research board has a second lock, FRAME (`fLock`, kept in `prefs.frameLock`, on by default): the template's squares and notes can be chosen (to join or paste beside) but never moved, sized or rewritten; LOCK still holds one's own content. The design device on the ring is a palette, brush and spark, named DESIGN. Test hooks `AURA.receipt()` and `AURA.move(i, x, y)`.
- **Stage 5: places and people, 30 October.** A `places` table (made on first use): `GET /api/places` (shown, public, 5 minutes at the edge), `POST /api/places` (a suggestion, waiting; 6 per 10 minutes per place), and `/api/admin/places` (list by status, add shown at once, show, refuse, edit, delete). The approval page has a PLACES tab for all of it. The studio adds shown places to `LISTED` (`addPlaces`, kept as `da.places.v1`); the aura adds them to the field data's places for search and the map (`da.aura.places`) and has a + in the intel to suggest one where the map is. **Stage 4 corrected:** on the live site iNaturalist answered novel.global with 429 (it limits Cloudflare's shared addresses) and Overpass took over 60 s, so species photos went missing. Both pages now wrap `fetch`: a call to `/api/inat/…` that fails, is refused or takes over 8 s goes straight to `api.inaturalist.org`, and places and water go to the Overpass mirrors after 25 s (`CONFIG.OVERPASS` and the browser's `PLACE_Q`/`WATER_Q` are back). The Worker stops asking iNaturalist for a minute after a 429, so the fallback is immediate. The security policy allows those three hosts for the fallback. The desk: no stamp filler (that was the "pre-recorded" song), `songEmpty`, a playlist (`songPlay(on, list)`, `listCard`, `#songs=` links, up to 24 kept songs), the WEB source (`webSong`: a spanning tree of the named spots within 1.5 km, split north/east/south/west into four tracks), `hereOf` (the piece, else the map, else the centre). `lineInk` draws crisp pictures in the paper's ink. Device ring keys use the hand-drawn `hradio`/`hboard`/`hshop` glyphs with an SVG wobble filter. Narrow-screen rules in `aura.css` and `app.css` (`max-width: 380px` / `340px`). Cache da-v110.
- **Stage 4: live data through Cloudflare, 29 October.** (Corrected on 30 October, see stage 5: the browser goes round to iNaturalist and Overpass when novel.global is refused.) No browser asks iNaturalist or OpenStreetMap while novel.global answers. `INAT_API` is `/api/inat` (the Worker's `inatThrough`: only `observations`, `observations/histogram`, `observations/<id>`, `taxa`, `taxa/<id>`; edge-cached 3 min to a week by route; failures never cached). Places and water use `CONFIG.OSM_API` = `/api/osm?q=places|water&bb=s,w,n,e` (the Worker's `osmThrough`: the Overpass queries live in the Worker as `OSM_Q`; the box must be whole tiles, 0.01° for places up to 8 by 8, 0.05° for water one at a time; each tile kept in D1's new `osm` table, made on first use; only missing tiles asked of Overpass, rate-limited to 40 in 10 minutes per place; old tiles served when Overpass fails). The service worker keeps the last answer of both, and `/api/img` photos once seen (cache da-v109). `build.mjs` now writes a Content-Security-Policy for every page into `dist/_headers`, with sha256 fingerprints of each page's inline script: **a new outside data source added to `config.js` must also be added to `DATA` in `build.mjs`**, or the browser will refuse it. The tests route `/api/inat` and `/api/osm` to the same stand-in data and fail the run if any page asks iNaturalist or Overpass directly. Checked for real through the local Worker: 2,073 sightings, 532 places and the water all came through novel.global; Overpass took about 40 s the first time a tile was asked, then milliseconds from the database. Nothing to set up on Cloudflare: the table is made by itself.
- **v0.2 fixes, 29 October** (the owner, after the live merge). *Prints:* a send that gets no answer is tried again twice at once, then the outbox is retried every 20 seconds and whenever the page comes back (before, it waited for the next visit, which is how a print could appear minutes later); a print held for the printer's touch screen now says PRESS ON THE PRINTER (a printer with a touch token holds every slip until pressed there), and a refused or failed one shows its reason (`pips(s, why)`; the receipt route returns the printer's error); followed for 15 minutes, not 4. *Device art:* the print shop's strip comes to the poster in colour (`colourStrip(s, 4)`), up to 2400 px, and a picture is never cut to a box any more (drawn whole, `a.wd` its width, up to five times as tall as wide). *Sound:* the hum keeps only the rings' own drone (the fifth, shimmer and sub layers were a backing track); the desk plays a tune only when play is pressed (a mood or source turned while quiet is heard as one bar, `songTaste`); a device window closed is put away (`.au-win.away`, still drawing), so the radio goes on under every step and device until a desk song starts (`devLetGo`) or the aura sleeps; each device opens with its own fog horn (`horn(i)`). *Devices:* the studio opened from the aura lands on the device's own page (it always went to RADIO); the devices' costume (mods, screws, cables) is on for everyone again (`da.devices.v2`; the old switch had been turned off). *Look:* the full-screen close key's × drawn and centred; in W.I.S.H. the receipt rides the right tentacle, clear of the W; going home from PRINT no longer flashes the wall line; Settings in the portfolio are icons alone, their words on hover; open everything stays lit and shows the irukandji with the radio. *Receipt:* blue paper now prints as a night slip (`nightOf`): a fine regular dark shade, every word, line, mark and icon white with a thin dark edge, photographs as they are, the code on its own white tile. White paper prints as before. Cache da-v108.
- **v0.2, dark, 29 October** (the owner: a dark mode switch at the start's top left; bioluminescent green Bermuda fireworms; stars, particles and the same hand texture as the blue, in deep grey; every device and section dark too; open everything at the bottom right with the new mark as an unmarked way to the approval page; a way to turn the hum off; no two musics at once).
  - **Dark** (`DARK`, `da.aura.dark`, `setDark`, `AURA.dark()`): `#au-theme` hangs at the start's top left, a half-filled circle that turns over. `#aura.dark` is `#18191C` on the same paper grain, vignetted; the stars are a little larger and brighter; everything that was the blue (the catch, the press, the map, the cards, the signal, the devices' and desk's keys, the viewer) goes to the grey; the studio in a device window opens in its own night (`?night=1`, read in `00-core.js`).
  - **The fireworms** (`worms`, `worm`): in the dark, every 7 to 21 seconds, one of three in neon green, drawn lighter than the night: a worm darting a curving path and fading into the dark, a squirt of sparks slowing and rising, or a depth charge, a green pulse spreading and sinking. Never under reduced motion.
  - **The start's bottom right** (`#au-base`, still after 15 s): open everything (`#au-open`, asked once more; every device on the ring and every mark, as if every poster were made) and the mark, square and circle, which is the way to the approval page with nothing to say so (`#au-admin`). The base's own link there is gone (`/?base` still opens it).
  - **The hum and the music:** the sound key shows on the start too, and the hum's switch is on the desk's own bar (`#sd-drone`); opening a device stops the desk's song, and opening the desk closes any device, so two musics never play over each other. Choosing a mood or a source on the desk plays it at once, and each mood colours the desk's water. The quick words show one at a time.
- **v0.2, stage 5: places, 29 October.** Search in the intel finds lives as before and now every named spot (`spotsAll`, `findSpots`): the places and waters of the field data, the cities and their places, and one's own noticings by their words or code; each found is a pin and its name (`#au-spots`) that sends the map there and marks it, the back key bringing the map and the page back (`mapGo`, `mapBack`). The map draws the named spots faintly as rings, and a touch on one fills the search with it and marks it instead of moving the piece (`MAPV.spots`). Cities and data packs (`cities` setting, 40,000 characters, written as words on the approval page: `# name`, `centre, lat, lng`, then `name, lat, lng` a line; `citiesOf`) are kept on the device (`da.aura.cities`), their places added to the field data's (so near, search, the map and the sound desk's `here` all have them), and shown as a quiet row of chips at the head of the intel (`.au-cities`): one chosen moves the map and the piece there; the pin brings it home. A device window closed now lets the studio go (`about:blank`), as a hidden studio kept drawing onto nothing.
- **v0.2, stage 4: the sound desk, 29 October.** The sound key (top right) opens the desk (`deskOpen`, `.au-desk`), a device like the others with an irukandji of its own drawn in light: a bell that breathes on the beat and four tentacles, the four tracks, a bead a step, lit as it sounds (`deskDraw`). A song (`songMake`) is made of words already here: the poster's intention and lines (`lines`), the places, waters and lives within 1.5 km (`here`, the radius), or the captions of the posters on the wall (`journey`); with too few, the stamps' own words fill it. Each word is a note (its letters give where it falls and how high, `hashW`); four tracks of 32 steps: the melody, a counter-line, a voice long and sparse, the bass. Three moods (`MOODS`): tide, bloom, doom, each its own instruments from the base (`NG.INS`), scale and tempo. Played (`songPlay`), it goes on under the whole site and the hum rests; kept, it waits on the desk (`da.aura.songs`, twelve); saved as a loop of exactly 45 seconds (`songLoop`, the tempo eased a hair to fit whole bars, the tail folded to its head; `NG.wav` now shared by the base); sent as a link (`#song=v1…`, which the page keeps for the aura and opens with the desk and the song ready); or put on the poster (`songCard`: the four tracks as constellations, the mood, its code, kept crisp so it scans from the receipt). The hum's own switch is on the desk now; the radio device (its layers and moods on the map) is one key away. `AURA.desk()` opens it and returns the song, `AURA.songLoop()` renders the loop.
- **v0.2, stage 3: the deep engine as devices, 29 October.** The studio (C) is reached from the aura (A) as three devices (`DEVS`): RADIO (`/studio#radio`), BOARD (`#wish`) and PRINT SHOP (`#print`), each a small digital thing (smoked glass, a pixel icon, a green light) set against the chalk and stars of the irukandji, never blended with it. One is earned with each poster printed (`devsEarned`, from `ROUNDS`, three at most) and rides the unseen ring under the eye with the catch (`halo`); all three sit at the head of the intel (`.au-devs`). Opened (`openDev`), the studio fills one window over the aura (`.au-win`, an iframe of `/studio?from=aura#…`; another device turns the same studio to its page, kept for the visit); the aura's hum rests while it is open; the eye on its bar, Esc, or the studio's own way home brings one back (`closeDev`). The studio opened that way never walks its own first visit (`IN_AURA` in `00-core.js`): the aura is the first visit now. `AURA.dev(i)` opens one, `AURA.dev()` closes it.
  - **One device at a time, the step's own:** the irukandji holds out on the ring only the device its step calls for (RADIO while noticing, the RESEARCH BOARD for W.I.S.H., the PRINT SHOP in art, none at print); the board opens as a pale digital-ink panel (`.au-win.d-board`), the others in smoked glass. The lore and the direction pass are in `docs/brief-0.2.md`.
  - **What is made comes back onto the poster** (`toAura` in `00-core.js`, the aura's `message` listener): inside the window the print shop's print key reads "onto my poster" and sends its strip, a song's card (`openRadioLink`) sends its art with its code; the aura puts it on the poster in hand (a blank one begun if none) and opens art. A song's or a code's picture is kept crisp (`crisp`), line work on the receipt so its code still reads. Print, printer bytes, OLED and the radios step aside in the window (`html.in-aura`): printing is the aura's last step alone.
  - **Fixes with it:** pixel art takes the paper's own ink (`pxInk`: cream on blue, navy on white, all ink on the receipt) and one's own icons are redrawn in the ink when they would vanish into the paper or print (`fitInk`), so nothing prints white on white; where a print goes says so under its key at all times (80 mm, 80 mm + mesh, wall only), the mesh line sent only with 80 mm + mesh; the art tray moves with the wheel or a drag on a desktop (`trayWire`).
- **v0.2, stage 2: INTENTION's and W.I.S.H.'s words from the approval page, 29 October.** The words live once in `config.js` (`WORDS`, flat keys: `intention.tab`, `.ask`, `.say`; `wish.tab`, `.say`; and for each of `w`, `i`, `s`, `h` its `.word`, `.head` and `.how`). The build hands them to the aura (`BASE.words`); the aura lays over them any rewritten on the approval page (`/api/settings` → `words`, a small JSON of only the words changed, at most 4,000 characters, kept on the device as `da.aura.words` so they hold offline) and draws the open step again (`wordsSet`, `wd`). On the approval page, TRACKS → INTENTION AND W.I.S.H. · THE WORDS shows every one as a field holding the site's own until changed; SAVE keeps only those changed, THE SITE'S OWN WORDS clears them all.
- **v0.2, stage 1: the journey smoothed, 29 October** (the owner: the three novel.global experiences become one, `docs/brief-0.2.md`; stage 1 is the aura's own journey, and the poster as printed matching the poster as made).
  - **The eye with its tears** (`ICON.eyet`) is noticing, on the globe and on its tab: it blinks (`au-blink`) and its pupil breathes (`au-pupil`).
  - **Out of order:** art with nothing begun offers a blank receipt (`#au-blank`, `P.blank`): `ready()` lets it be worked on, `filled()` (anything really on it) decides whether it hangs on the print wall (`making`).
  - **One word first** (`flashWords`, `data-fw`): a step opened says one plain word under each key or line in turn (W.I.S.H.'s four: theories, beliefs, principles, behaviours), one at a time, each 2.2 s and gone before the next (2.3 s apart, the first ten keys), then is quiet; the longer lines follow as before. Plain lines centred; the lines one writes on half as heavy and fainter. The receipt the eye holds hangs lower on the intention page, the line level with it.
  - **Art's tray in order of use:** the main photograph (`#au-file3`, through `intake`), more pictures (kept at 1,400 px now, not 700), paste, words, speech, then the W.I.S.H. lines above or below the picture (`P.wtop`, on the poster and the receipt alike), then the making.
  - **Print:** one order for every poster (print, where it goes, save, signal, paper, start again; printed ones: print again, save, signal, rework, take down); where it goes cycles 80 mm, 80 mm + mesh (only then is the signal line sent with it), wall only (`PMODES`, `da.aura.pmode`); print again asks once more. Each poster on the wall says where it stands (`.au-st`: in the making, on the wall, sent to print). Receipts hang by their tops (`.au-etrack`). The viewer's close is 32 px.
  - **Pasted pictures on the receipt:** the band below the words used to be thresholded whole, so a picture placed there printed as black blots, and anything beside the code was cut off. The band now runs to the foot of the paper with the code's place cleared, pictures in it (`k: 'im'`) are dithered as the main picture is (tones stretched first), the rest kept crisp, and empty paper is trimmed.
  - **The mark** (`ngMark`): a square, the novel (a book), beside a circle, the global, from the owner's mock of a circle and a square, turned round. Two solid shapes with nothing in them, each its own tone so neither is lost: on the poster the square in the ink and the circle in coral (`CORAL`); on the receipt the square black and the circle a fine checker the head prints as grey (`dotFill`). The circle is 6% larger than the square so they weigh the same, the gap a third of the square, the square turned a third of a degree and the circle half a pixel low. It heads the poster and the receipt; the old globe stays as the novel.global postmark sticker. A watermark key in art's tray (`P.wm`) lays it large and faint under the poster, and in sparse dots on clear paper on the receipt. As files: `repo-static/mark.svg` (black and coral), `mark-dark.svg` (cream and coral), `mark-mono.svg` (black and grey), `mark-watermark.svg`.
  - **The tentacle is the wall's line** (`FORM.wline`, key `line` in `readForm`): on print, the print tentacle lets go of its key (hidden there) and runs out past the wall's right end to lie along the line the receipts are clipped to, drawn whole over the page; the dotted line under it goes. The key comes back on the other pages.
  - **The W.I.S.H. letters in stars** (`starLetters`): never written; small stars drift in and gather into each letter's shape on a canvas over it, then twinkle, brighter while its line is in hand. No dot at a line's start and no dotted line under it: one writes on the tentacle. The first words hold 5 s each, 1.2 s apart, and the W.I.S.H. words start at their letter so none is cut off.
  - **Pasting a picture stays put:** the base's own paste (a picture anywhere opens the pixel board) stands aside while the aura is awake (`AURA.awake`), so in art a pasted picture goes on the poster.
  - **A signal's marks below the words** (`a.band`): a pasted or scanned line laid its marks at fixed spots over the picture and the words; they now go three to a row under the words and what was caught, the poster longer to hold them, until moved by hand.
  - **El Niño's sources are named, not linked:** the aura never opens another window.
  - **A life's card to the map and back** (`spWhere`, `mapBack`, `MAPV.pin`, `MAPV.back`): a pin on the card's back asks iNaturalist for the nearest recent sighting within 25 km, moves the intel map there and marks it; a back key on the map returns the map to where it was and the page to the card, turned over and lit.
  - **El Niño, more** (`#au-ninob`, `NINO_MORE`): three plain lines (what it is, what it does to wildlife here, fire danger) and the Bureau's and NOAA's pages, opened in place.
- **v0.1 alpha, the screen polished and the radio checked, 28 October** (the owner: "remove the god rays and give it a high art and award winning polish pass - it's a bit cartoony. needs realism and function and simplicity and restraint. aura"; "reduce shading and gradient shadows as it comes out as pixelated on the display. find creative ways to enhance with the limitations"; "the set-up should only be available when starting or powered … people without them scanning the wifi or changing it"; "holding a button to show it is cool! there's 2 on there"; and, with the touch screen working, "needing clearer steps and a sense check" for the radio).
  - **The touch screen, redrawn** (`src/touch/novel-touch/novel-touch.ino`): one flat blue (`SEA`), no gradients, glows, shafts or shadows, which a small screen bands; every line, dot and ring drawn straight into the frame with smoothed edges (`seg`, `dotA`, `ring`, `blendPx`); the bell's light a scatter of fine dots (`hashf`); the site's own type, Archivo Narrow at 21 and 14 px and Departure Mono at 11 px, drawn ahead into 4-bit tables at the end of the sketch (`Font`, `text`, `para`); the slip's paper printed in Departure Mono; the waiting cue a ring round the pupil and one thin ring going out.
  - **Setup, only by hand:** BOOT (GPIO 0) held three seconds opens setup, a ring of dots filling round *setup*; KEY (GPIO 14) is a press. The touch screen never opens it. At power-on with no Wi-Fi it knows, it still opens by itself after 40 s. The setup Wi-Fi, NOVEL TOUCH, has a fixed password (novelglobal) so its code can be built in (`QR_JOIN`, checked to read) and scanned from the screen.
  - **The setup page:** it scans in the background and waits out the screen's own search for a known Wi-Fi (the list came up empty when the two clashed), lists the known Wi-Fis first, shows the printer and the Wi-Fis it knows, has **Scan again**, **Save and restart**, and **Done, change nothing**; BOOT let go and pressed again leaves setup.
  - **It never opens setup by itself** once anything is set: where it can't join, it keeps looking and says what for at the foot of the screen ("looking for …", "on …, asking …", "no printer set"); BOOT opens setup. (It used to open setup after 40 s without a Wi-Fi, which looked like it was switching on its own.)
  - **Staging and live are separate:** the staging site has its own database, so a touch screen given staging's three lines shows staging's slips, and a Pi (`DA_SERVER=https://novel.global`) never prints them. For real use, everything points at novel.global. novel.global's own Pi answers as `da-novelglobal.local`; its radio was at 192.168.1.182 (`DA_MESH=tcp:192.168.1.182`).
  - **To the radios:** `/api/touch` says whether a slip has paper (`paper`); a line for the radios alone is marked *to the radios* and, pressed, goes out as thin rings with nothing printed.
  - **The radio, sense-checked** (`docs/devices.md`): one path, A to F, each with its check; `pip install --user` fails on Raspberry Pi OS Bookworm without `--break-system-packages` (and Lite lacks `python3-pip`); a hand-sent line and `--info` from the Pi before the service; the phone can't reach the radio by Bluetooth once its Wi-Fi is on; the default channel is public. The receiver's own README (section 5) still has the old pip line; `receiver/` is left as it is.
- **v0.1 alpha, words in from a phone, words out clean, 28 October** (the owner: "paste and voice as custom design options don't work on mobile - also the copy or text of light handwritten doesn't print well and needs a clean and polished simple print fix to make it visible").
  - **Why they failed on a phone:** an iPhone opens the keyboard only for a field focused in the tap itself; adding words focused its field a moment later, so nothing came up. The paste key leaned on the clipboard's own reading, which a phone guards behind its own prompt.
  - **The box** (`inBox`, `listen`, `closeBox`): on a touch screen, the words key, the paste key and a new speak key (`data-add="mic"`, shown where the browser can listen) open a small box focused in the tap. Paste into it (a picture or words go straight on the poster), type or dictate with the keyboard's own microphone (Enter or the tick puts them on), or speak with the speak key (the phone's recogniser, `SpeechRecognition`; the words appear as heard and go on when it stops). A desktop keeps Ctrl+V and the clipboard key.
  - **Words that print:** for the receipt, the poster's words are set in a clean bold type a little larger (`PRINTMODE`, `tFont`) instead of the hand, and the words placed on the picture are laid over it after the picture is dithered, whole, black on a white halo (`it.glyph`, `lay` in `printSheet`). On screen the hand stays.
- **v0.1 alpha, the touch screen in hand, 28 October** (the owner, with it working: "the background … is dull and muted blue, the jellyfish also needs to be like the exact one on the site … shouldn't be on the display for long if there's no prints … after printing it shouldn't return for 15 seconds … a lot bigger sometimes, or … like an underwater camera … the click and select to print more obvious and slower … (3–5 seconds) … the buttons are still not round and wonky on mobile … an easy way to change the wifi"; "the squash to delete 3 times longer and more violent but cute showing the squish and parts and current sweeping or line drawn fish eating"; "horizontal not vertical … the main heading or code of what is waiting"; "the novel.global website QR code when nothing is printing … big enough to scan … wake up every 30 seconds … QR code hang for 10 seconds").
  - **The sketch, rewritten** (`src/touch/novel-touch/novel-touch.ino`): landscape (`NG_TURN` 1 or 3); a brighter sea lit from above with shafts and marine snow; the irukandji drawn as `drawIruk` draws it (the box bell from `bellPts`, its 3.6 s pulse, the eye of 30 dots that blinks, the pupil and its ring, the four dots at its foot, tentacles of beads, the glow); a camera that goes close (`cam`). The server is asked on its own core (`netTask`), so nothing stutters.
  - **States:** asleep (dark) 30 s, awake 10 s with novel.global's QR code (25 by 25, built in, checked to read) and the jellyfish behind it in one of three ways; a slip: it swims up, the camera goes to its eye and back, the heading and code beside it, a breathing ring of dots as the cue; a press: the paper feeds out of the bell line by line over about four seconds, tears and falls, the jellyfish jets away; a hold of 2.7 s: squeezed flatter and shaking, eyes > <, beads pressed out, then the pop, the pieces (bell, tentacles, beads, the eye with an X) swept by a current and eaten by a line-drawn fish (about three seconds); 15 s away after either.
  - **Wi-Fi from a phone:** its own Wi-Fi, NOVEL TOUCH, with a password on the screen, and a page at 192.168.4.1 to choose a Wi-Fi and paste the approval page's three lines; up to five Wi-Fis kept (`Preferences`, `WiFiMulti`). Opens by itself when no known Wi-Fi is found in 40 s, or with the side button held five seconds.
  - **Round keys on an iPhone:** the press's keys are fixed squares centred by flex, and the small ones' dotted ring is an SVG circle of round dots (`.au-sm::before`); Safari drew the dotted round border as uneven dashes.
- **v0.1 alpha, signals and the touch screen, 28 October** (the owner: "it can get stuck not allowing it to move up and down … allow easy movement for long art"; "add length or shorten the 80mm canvas"; "allow pasting online easily for both mobile and desktop"; "the final portfolio print buttons on iPhone aren't round but warped"; "no long form descriptions … mysterious like an experimental art experience"; "a T-Beam Supreme on Meshtastic 915 … send or receive these finished cards or receipt art via mesh … an input code system … with maximum code size that can be converted into long form output … using existing data"; then: "a printer setting on the admin page for a connected LilyGO touchscreen … one press of the jellyfish … prints, long press to squash and delete it … haptic tactile feel … a click by click for this and the T-Beam Supreme").
  - **Moving through long art:** a finger on the poster's empty paper scrolls the page (`touch-action: pan-y`); only a finger on a piece holds it (the canvas's own touchstart stops the scroll then, `.holding`). Carrying a piece near the top or foot of the screen scrolls with it (`dragWire`).
  - **Longer and shorter** (`lengthen`, `P.len`, tray keys `len+` and `len-`): 300 px at a time, from as short as the catch allows to 3,000 px longer; every piece keeps its place on the paper as it grows or shrinks. The receipt follows the poster's length.
  - **Pasting** (`pasted`, `pasteKey`, tray key `v`): Ctrl/Cmd+V or the paste key in art. A picture becomes a picture on the poster, words become words, and a signal line (`ng:`) opens its piece.
  - **Round keys on an iPhone:** the press's keys are fixed squares (`aspect-ratio`, `flex: none`, no native button look), wrapping onto a second row rather than squeezing.
  - **Signals** (`sigOf`, `pieceOf`, `takeSig`, `openSig`; the format is under "The mesh signal" below): every piece folds into one line of 200 bytes at most, the size a Meshtastic message carries. The signal key on the wall opens it as a QR code and its line, to copy, share or send to the radios (`NG.sendMesh`, a mesh-only job: nothing printed). Pasted or typed into the same sheet, a line is rebuilt from what the site already knows: the life from the field list, its place, the day, the marks laid out, the four lines; online its photograph is fetched again. A printed slip sends its own line on the mesh when the printer's MESH is on.
  - **The touch screen** (`/api/touch/:printer`, `src/touch/novel-touch/novel-touch.ino`): a LilyGO T-Display-S3 beside a printer, with its own token (TOUCH SCREEN ON on the approval page, shown once; it turns AUTO off so every slip waits). It shows the first held slip with the irukandji: a press prints it (the jellyfish rises away), a long press flattens it and, held flat, squashes it (the slip is deleted). It shows how many wait for a touch and how many are printing (`waiting`, `printing` from `/api/touch`). With nothing coming in, the jellyfish swims up in pulses, wanders, dozes, or leaves for a minute (`doing`). The touch chip is kept awake and from resetting itself mid-hold (registers `0xFE`, `0xFB`, `0xFC`, as CST816_TouchLib does). An optional vibration motor (`NG_BUZZ`) gives the knocks. Click by click in `docs/devices.md`, with the T-Beam Supreme. The T-Beam reaches the Pi over their shared Wi-Fi, not USB: the Pi's one USB port is the printer's. Meshtastic serves its API on port 4403 and announces `meshtastic.local` once its Wi-Fi is on, and `pull.py` already takes `DA_MESH=tcp:meshtastic.local`. Its Bluetooth goes off while its Wi-Fi is on.
  - **Fewer words:** the seasonal lines lost their small print; the app's description is the question alone.
- **v0.1 alpha, phone and the wall of lives, 27 October** (the owner: "on mobile (iOS) when downloading a finished poster … it doesn't do either"; "the edit canvas size is too small, and zooming in has the action icon menu over the objects"; "don't show any copy anywhere for 10 seconds after clicking that stage tab … only one copy is visible every 10 seconds"; "the map also doesn't locate on the location or ask permission"; "a scrolling colour photo wall of all the species that is infinite … selected by species group (small line icon glyphs) … tactile … a useful small photo card (name and details on flip)"; "more urgent and timely El Niño preparedness advice or real actions"; "reduce all copy by 50% … plain, everyday language"; "a sub depth deep bass sound effect or bubbles"; then: "the first input … should be the intention … above the WISH poem … the final output allows for the intention and the wish … don't allow the next step button to reveal until at least a few words are in").
  - **Saving on an iPhone:** the poster is made into a file ahead of time (`saveSoon`, `SAVE`), and a tap hands it straight to the share sheet (`saveImg`, `navigator.share`), where Save Image puts it in Photos. Elsewhere it downloads as a file. The wall has its own save for the poster in front. (iOS opened the old data link and then did nothing with it.)
  - **Making the poster on a phone:** it is as wide as the screen and scrolls, not shrunk to fit; the tools for the thing in hand sit at the foot of the screen, never over the poster, zoomed in or not.
  - **One line at a time** (`HS`, `hintsQuiet`): opening a step (or the catch) brings ten seconds of quiet, then that step's lines in turn, each for its time, ten seconds apart, never two at once. The question itself waits too.
  - **Location on an iPhone** (`getPos`): asked gently first with all the time the phone's own question needs (the old 7 s clock ran out while the question was still on screen), then made precise. If it is refused, the catch says where to turn it on.
  - **The wall of lives** (`spWall`, `spCard`, `spPhoto`, `KINDS`): under the map, every life the engine knows as colour photographs, three across on a phone, coming as it is scrolled and round again; six small signs narrow it (all, birds, mammals, frogs and reptiles, insects, spiders and small things). Each photograph is fetched only when its card comes into view (iNaturalist, through the site). A card turns over to its name, its Latin name and when to see it, with + to put it on the poster.
  - **What to do now** (`ACTS`, beside El Niño): water out for small animals, checking on neighbours, the fire danger rating on VicEmergency, pets in, outside lights off, Wildlife Victoria (03 8400 7300) for injured or heat-stressed animals and flying-foxes, 000 in an emergency.
  - **Every line halved and plain** (`SAY`, `NINO_WHY`, `WISH_HOW`).
  - **Sounds for the new parts:** bubbles (`bubbles`) when a card turns or is caught and when a poster is saved; a low swell (`subSwell`) when a kind is chosen or what to do is opened.
  - **Print is the showcase** (the owner: "there is no way of viewing the portfolio … if you click on print … make the showcase the default (allowing them to be printed again) … once art leaves design it can go straight to portfolio and focus on it with the print button there"): print is the wall itself (`showList`, `wallHTML`, `wallPress`). The piece being made hangs in front on the same line as everything printed, drawn live, with its press (start again, paper, save, print). Swiped along, each printed piece can be printed again (`#au-again`: it comes forward as the piece in hand, prints, and takes its own place on the wall again), saved, brought back to work on or taken down. With nothing made or printed yet, print shows only the way back to begin.
  - **The intention first:** the first page asks for an intention ("what's your intention?"); it no longer fills W. It heads the W.I.S.H. page over the four lines, and heads the poster and the receipt, the four sentences under it. The way on (`goReady`, `goGate`) shows only when the intention has three words and every line two.
- **v0.1 alpha, the receipt and the wall, 27 October** (the owner, from a real print: "the text is nearly not readable, faded, and it makes no difference whether it's dark or light … the photo and copy need a massive visibility overhaul … maximise the space and output of the printer to its limits … the QR code isn't displayed properly"; "it's hard to see what is the final print screen and the portfolio … fix the jellyfish … the not active poster showing half"; "remove the final guiding copy … for print and portfolio"; "an image in the custom personalising section … not replace the current ones"; "hide it for twice as long … all long copy fades"; "the quick top left intro copy start here … remove").
  - **Why the print was faint:** the colour poster was shrunk from 900 px to the printer's dots and the whole page went through the photograph pipeline, so the blue ink became grey dither and thin hand lettering broke up. The code was small and crowded.
  - **The receipt is now set for the thermal head** (`printSheet`, at the printer's own width):
    - the head (the redacted world, novel.global, the code) in bold type;
    - the picture with everything laid on it, edge to edge, the only part dithered;
    - the four lines as sentences at the printer's own size (32 dots), wrapped to the full width;
    - what was caught or added below, as crisp line work;
    - the code large (at least 5 dots a module, about 25 mm), with four modules of clear paper round it, and the day, the code and the life beside it.
    - Every dot is black or white: words and lines are thresholded, never dithered.
    - **Dark paper prints the head and the four lines reversed** (white out of black); light paper prints them black on white with a rule under the head.
    - `AURA.sheet()` returns the last receipt as an image; the checks save it as `12d-receipt.png`.
  - **The wall is not the print screen.** Printing sends the piece up to the wall (after the round's moment): it hangs from a dotted line by two clips, one at a time, swung in with a small sway; the next and last are swiped in, never half showing. The jellyfish lets go and hangs; it frames only the piece being made and the print. The seed to begin again sits on the wall's press.
  - **No words on print or the wall, and none at the start** ("Start here" is gone; the first way in still calls).
  - **Pictures in art** (the picture key in the tray, several at once): each goes on the poster as a piece of its own, over what is there, with its frame, and is moved, turned, sized, toned or taken off like the rest. The eye's photograph stays.
  - **No W.I.S.H. letters on the poster or the receipt** (the owner: "it's the engine not for the final poster"): the four lines print as sentences alone, a little apart. The letters stay where the lines are written.
  - **Lines come and go for longer:** on for as long as before, then away twice as long (20 s; 28 s for a long one). El Niño's reasons and the empty art's line now come and go too.
- **v0.1 alpha, small tweaks, 27 October** (the owner: "let all copy stay on screen for 5 seconds longer, the copy for the search is blocked by the line, it says to get more information on hover for WISH but no information shows, revert the novelglobal font to the normal clean polished minimal one. Don't add the copy for next … a symbol or icon or animation is fine … The numbers next to the main icon tabs can be removed (and the new glyphs … at the start …) … Allow the backing drone to change and get more interesting but subtle as the flow progresses").
  - **Every plain line stays 5 s longer** (short ones 7 s in every 17; "what have you noticed?" too).
  - **The search's line** sits below its field now, clear of the dashed underline.
  - **W.I.S.H.: what goes on a line is said on the line** (`.au-wtip`, `WISH_HOW`): the letter's words, then what they ask for ("It would be great — what you'd love to see happen for it"). It shows when the letter is pointed at or tapped (a tap also hands one the line, for 6 s), or while an empty line is in hand, and goes as soon as there are words. The old tip was there but tiny and faint, and the base's styles leaked into it; the new one sets its own type.
  - **The poster's wordmark** is a plain clean sans again (Helvetica Neue, 500), beside the redacted world.
  - **The next step is a sign alone:** a dotted line, the next step's icon breathing, an arrowhead. Its words stay for screen readers.
  - **No numbers by the steps, no signs on the globe:** the first way in keeps its ring and its call; the others are icons alone.
  - **The drone grows with the piece** (`hum.ext`, `humGrow`): W.I.S.H. brings in a fifth above (329.6 Hz), art a high triangle shimmer that wanders left and right, print a low breath at 55 Hz; each fades in over seconds and stays while one goes back; the voices drift a few cents on a slow swell; the filter opens a little as lines are written and things caught and added. A new piece starts it again; the globe takes the layers out.
- **v0.1 alpha, the final build, 27 October** (the owner, walking through: "the icons on the starting planet rings shouldn't have numbers, but glyph constellations or runes … and stamps. But make the first step pulse"; "I click 1 and it takes me to an empty page … with the top close button cut off"; "I would be confused as to what each section or drop down are. Pulse instructions every 10 seconds for 2 seconds … in my tone, human, simple"; "El Nino also needs contextual copy for why it is urgent"; "I don't know where to click when finished"; "the add photo … should be on the edit or add stickers section"; "no clear way to see other posters like a lite carousel … full screen … swiping and pinch zoom, and tactile feel, find github projects"; "add in coral, random trash and litter, and paperclips … handmade, slight wonk, minimal"; "make sure all art and final elements can be printed on 80mm novel.global").
  - **The globe's ways in** carry small constellations of their own (`RUNES`, `runeI`: a seeing, a four, a path), not numbers, each on a postmark ring. The first breathes and calls (`au-call`, a ring going out) with "Start here. Tell us one small thing you noticed today."
  - **The empty page after a print was the printed piece coming back.** A draft that was printed no longer loads, and opening a step from the globe after a print begins a new piece (`toIruk`). The photograph's × now sits inside its corner.
  - **Said plainly, now and then** (`SAY`, `hint`, one timer): each line comes for 2 s in every 12; a long one for longer and away longer (up to 8 s on, 14 off). "what have you noticed?" pulses the same way. One line for each step and one for each part of the catch (the map, what is near, finding a life, the readings, this month). The deep lines are staggered so they never all speak at once.
  - **Why El Niño matters now** (`NINO_WHY`), kept small under its reading: the Bureau's June declaration, NOAA's October odds, hotter, drier and more fire weather here, the reef expected to bleach, droughts in past strong events. Sources in `docs/sources.md`.
  - **The next step at the foot of every page** (`goKey`, `.au-go`): a dotted line to the next step's icon and where it leads ("next: your W.I.S.H.", "next: make the poster", "next: print it"). Art with nothing to make shows why and the way back.
  - **The photograph for a piece is added in art** (the eye in the tray), where it changes the placing; print has the wall key instead.
  - **The wall is a light carousel** (Embla Carousel, `wallHTML`, `wallWire`, `wallPress`): the one in front whole, its neighbours showing; dragged or swiped; ‹ › for a pointer; a touch opens it full screen; ↩ and the bin act on the one in front.
  - **The viewer is PhotoSwipe** (`show`): full screen on the blueprint with nothing else; swipe, pinch, double-tap, wheel; flick down to close; the close on the picture's corner (`aux`), dots for where you are; each turn a light buzz on phones that have it and a soft tone. Panzoom and the old slideshow are gone from the aura.
  - **Beside the pixel irukandji** (`pixArt`, `PIX_SUBS`): coral growing and swaying from the floor; what the tide brings (a ring pull, a bottle cap, a safety pin, a blister pack, a crushed can, a length of chain); paperclips (the gem, the triangle, the owl, one bent open). Each drawn cell by cell, a little off true, moved by the current; a die for another one; the pen, the blue, colour (after the paperclip box and the beach litter), or the photograph's own.
  - **What prints on 80 mm is the poster itself** (`posterPrint`): drawn on white so the ink is the dark, taken to the printer's width through the photograph pipeline (`NG.forPrint`, CanvasDither), and its code set again crisp, a whole number of dots (at least 3) to each module.
  - **Brought in:** PhotoSwipe 5.4.4 and Embla Carousel 8.6.0 (MIT), in `vendor/`, loaded only when the wall or a picture is opened.
  - **Not done from the plan:** stages 4 to 8 (live data through the Worker, more places, gigs, live emergencies, more receivers) need the server and partners; nothing in this round could move them.
- **v0.1 alpha, the round, 26 October** (the owner: "the location share and positioning on mobile didn't work … the WISH on mobile shows the lines in different places … it doesn't save when inputting text and changing tabs … a visual indicator of it flowing … the map button should rotate around the tentacles like an invisible halo disk … the final print should make it obvious that round … is over … like a roguelite … the photo of any species selected … rotated and changed in size or tone/contrast … border or no border … a QR code to the site on every print … the pixel maker … a showcase of the irukandji … dark (blue current) background, or a white one"; then: six stamps after a sheet of postmarks with the words "novel.global, 888, odd kin, stay with the trouble, life emerges in ruins, dancing with doom"; El Niño smaller with a toggle for this month's stories near here; more postmarks, a wedge serif and a narrow grotesque, and "logo of world with redacted lines (remove B K)"; "text for local cells can be tiny and show a lot at once, or order in dropdowns").
  - **Fixes.**
    - **Where one is, on phones** (`getPos`): a precise fix asked first (7 s), a rough one if that is slow (15 s), and ◎ says plainly when it is refused. The catch and every photograph without a place use it.
    - **W.I.S.H.'s lines belong to the page:** each is a row of beads under its words (`.au-wish li::after`), with a ring at its start; the tentacle comes to that ring. On a phone the lines no longer float apart from the words.
    - **The letter's sentence** sits on a small blue pill above the tentacles.
    - **Every word is kept as it is typed** (no wait), so changing step at once loses nothing.
    - **Printed, the round is over** (`done`, `fresh`): going to any step but print begins the next piece, clear. Before, W.I.S.H. showed the last piece and undid what was typed.
    - **Caught things alone make a piece** (`ready`).
    - **The eye shows the photograph only while the catch is open;** otherwise it is on the page below.
    - **Words are typed on the poster only:** the field lies over the box itself, its letters clear, its caret showing.
  - **The receipt travels** (`MINI`, `slipDraw`): a small copy of the poster, made as the piece changes, rides the tentacle of the step one is on and is passed from one to the next on every step (`S.pass`).
  - **The catch turns on a halo** (`halo`): slowly round the tentacles on a ring no one sees, larger in front, smaller behind; it stops when held.
  - **Currents** (`CUR`): a slow noise swings the tentacles and the snow; a step ripples where it is touched (`ripple`); faint shadows pass under the paper (`under`). Let go of, the steps wander more (`DRIFT`).
  - **The round over:** printed, the poster rises up the print tentacle into the bell, the bell flashes once, and a bead is added to its crown for every piece on the wall. The first print of each piece earns a mark (`ROUNDS`, `da.aura.rounds`: four to begin with, one more each round); the new one glints in the tray.
  - **The life's photograph:** a life caught brings its own photograph from iNaturalist through the site (`spFetch`, `/api/img`), credited on the picture, for pieces with none of one's own.
  - **W.I.S.H. opens with what was noticed:** the picture small and whole, the life's name and the day (`.au-whead`).
  - **Art: what is in hand** gets a row of tools (`.au-tools`): turn by 15°, smaller, larger, tone (on the paper, turned, clear), framed or not, take off. The picture itself takes a tone (as it is, strong, ink, warm).
  - **The pixel irukandji** (`pixJelly`, `PIX`): it moves while it is made (cells 16/24/32, the current's speed, its colour: the pen, the blue, or the photograph's own); one moment of it goes on the poster.
  - **Six stamps** (`STAMPS`, `stampMask`, `stampOf`), postmarks after a Czech school's sheet and Bulgarian philatelic ones, every word and number replaced:
    - **novel.global:** a scalloped chain with the letters in its links, the redacted world at the heart;
    - **888:** a star of two squares in halftone, arrows round it, the number in the wedge serif;
    - **odd kin:** a halftone disc, the words in heavy dots;
    - **stay with the trouble:** a ringed postmark, the words over the top between stars, the irukandji as a world with a face;
    - **life emerges in ruins:** the words as a ring of outlined letters, a flower through broken ground;
    - **dancing with doom:** a whirl of rough rings, the words under it.

    Each is drawn as a mask and inked in the pen, a violet stamp-pad ink, or faded, worn by the pad (speckles, one side lighter). They turn, size and frame like the rest.
  - **The mark of novel.global** (`globeMark`): a world in a lattice with a redacted band across it and two bars running out either way (after an instrument maker's mark, its letters taken off). It heads every poster beside the name in the wedge serif.
  - **The printed voice** beside the hand: Fraunces Black for the mark and W.I.S.H.'s letters, Archivo Narrow for the four lines and the stamps' rims. One's own added words stay in the hand.
  - **Print:** a photograph can be added here too; blue paper or white (`P.paper`, `usePaper`), with the words and marks turned to stay seen; a small code back to the site on every poster (176 px of 900, dark on light, about 13 mm on 80 mm paper).
  - **The catch: local cells small and folded in order.** What is near (◎), the readings (≈), then El Niño, small, beside this month's sign.
  - **This month** (`seaFill`): the month's own stories from the engine (the young on the ground, swooping, snakes, heat), then the lives in season with why they matter and who depends on them (the Bogong moth and the Mountain Pygmy-possum, from its field note). Those seen within 1 km come first, with how far; waterbirds and frogs name the nearest water within 1 km. A touch catches a line.
  - **Brought in:** Fraunces Black (16 KB) and Archivo Narrow SemiBold (12 KB), Latin only, OFL, in `vendor/`.
- **v0.1 alpha, focus, 26 October** (the owner: "the link to the full version … only show after 15 seconds"; "the Notice image or copy doesn't reset or clear if the wish or poster has been made"; "WISH … (What we know, It would be great, So let's create, Here's how it works)"; "only one [style], remove the pixel, constellation, and other one"; "the map is always showing where someone is … a drop down list of connections that link to that area"; "the noticing first part … into the WISH part in a simple way that connects and builds").
  - **The way to the base** waits 15 s on the globe, then shows faint (`au-late`).
  - **A printed piece is finished.** Notice, or the eye, begins the next one, clear. The finished piece stays on the wall and can be brought back; one brought back is being worked on again, and changing it updates its place on the wall.
  - **The photograph in notice has its own ×** to let it go.
  - **W.I.S.H.'s letters say:** What we know, It would be great, So let's create, Here's how it works.
  - **What was noticed carries into W.I.S.H.**
    - The line becomes W, "what we know", and follows the line until W is written by hand (`wSay`).
    - The photograph sits over the four lines, small and whole.
    - On the poster, the line is not written twice.
  - **One way of drawing it: the photograph, whole.** Pixel, net and sign are gone from the choice.
    - With no photograph, the poster is the words and what was caught.
    - The receipt is the photograph through the print pipeline, or the shell alone. Nothing the engine guessed goes on it.
  - **The marks keep a rim of the paper's blue,** so they read on a light photograph.
  - **The map shows where one is.** Opening the catch asks the phone (`findMe`): a dot and its accuracy ring in the lens, and ◎ in its corner asks again and moves the piece there. The piece moves on its own only if nothing else placed it (photograph or touch).
  - **What is near** (`nearFill`), folded to a dotted line under the map, unfolds to a short list for this place only:
    - the named places the engine knows within 900 m;
    - its waters within 1.5 km;
    - the lives seen within 1 km lately (iNaturalist, only those in the field list).

    A touch catches one: a place as a reading ("name · distance"), a life as the life. The list follows the piece when it moves.
- **v0.1 alpha, the tentacles at work, 26 October** (the owner: "WISH has 4 lines, surely you can make the 4 tentacles make the lines and they can let go of the buttons … also 4 sides to a square … when the buttons aren't being held they might slowly float").
  - **The tentacles take a shape for each step** (`FORM`, `readForm`, `tentPts`). The shapes are read from the page every frame, so they follow scrolling and growing lines.
    - **Notice:** they hang to their steps and hold them.
    - **W.I.S.H.:** they are the four lines. Each sweeps down from the catch to the margin and lies along its own line, W and I from the left, S and H from the right. The dashed underlines step aside.
    - **Art, print and the wall:** they are the four sides round the piece, closing one loop (left, bottom, right, top). They cross at the catch and go down outside the piece, never over the tray.
    - With the catch open, they hang again.
  - **Between shapes they move over 0.9 s** (`FORM.from`); they never jump. At work they are steady where they lie and drift only on the way there.
  - **Let go of, the steps drift** (`#aura.loose .au-tab`): a few pixels and a few degrees, each at its own pace, 9 to 13 s. Held again in notice, they settle.
  - **The frame loop asks for its next frame first** and logs a bad frame once, so one error can never stop the creature.
  - **For the checks:** headless Chromium in phone emulation pauses animation frames until there is input, so the check moves the pointer before it reads the shape.
- **v0.1 alpha, one piece at a time, 26 October** (the owner: "too much grouped up in one spot at the start … remove this hover copy … make the eye and catch pulse … a deep tone when hovered … only show the copy What have you noticed after a second … the WISH full sentence for each letter on hover … no stickers or text, or icon additions … things should be able to be brought back or edited or removed … reset when completed … each entry or process is for one final art").
  - **Room at the top.** The catch hangs lower under the bell, clear of it.
  - **No words on hover:** no `title` anywhere in the aura. The names stay for screen readers (`aria-label`).
  - **The eye and the catch breathe** (the pupil, the dotted lid, the catch's slow scale). When the pointer finds either, a deep tone sounds (`deepTone`: 55 Hz for the eye, 73 Hz for the catch, a fifth above each).
  - **"what have you noticed?"** is not there at first. After a second it comes quickly, then all but goes (`.au-ask`). The field's placeholder is gone.
  - **W.I.S.H.: each letter's sentence**, shown on hover or when its line is in hand:
    - **W** Witness: what you saw, where, and when.
    - **I** Intention: what you want for it.
    - **S** Strategy: what will be done, and by whom.
    - **H** Hope: how it ends well, and who helps.

    (The repo never spelled the letters out; these are new.)
  - **The eye works from any step.** A photograph taken from W.I.S.H. or art stays there: it goes into the pupil and the poster, not back to the start.
  - **Art: what one adds by hand** (`P.adds`, `drawAdds`). Under the four ways of drawing it sits a tray:
    - eight marks drawn by hand (star, heart, irukandji, eye, waves, arrow, sun, leaf);
    - words (Aa);
    - one's own icons from the pixel maker.

    Each lands on the poster, is moved by hand, and, once touched, is outlined with an × on its corner to take it off. Words open their own line to be rewritten. The caught things are taken off the same way, which lets them go from the catch.
  - **One piece at a time, kept** (`draftSave`, IndexedDB `novelglobal/piece`, version 2).
    - The piece being made is kept as it is made, and is there when one comes back.
    - Once printed, the press becomes a seed that begins a new piece.
    - Changed after printing, it prints again and takes the same place on the wall (`P.folioId`).
    - ⟲ (with a check) lets the piece go.
  - **Print is only this piece:** the poster, ⟲, save, and the press. The strip of others is gone.
  - **With nothing being made, print is the wall** (`wallHTML`): one finished piece at a time, whole, turned with ‹ ›.
    - ↩ brings it back to be worked on, everything as it was: photograph, lines, catch, places, marks.
    - The bin (with a check) takes it down.
    - The composer's pieces show on the wall but are not brought back.
- **v0.1 alpha, the aura refined, 26 October** (the owner: "remove all copy … remove all WISH templates … make the top toggles and buttons (map species data el nino) join into one thing … only clickable icons are the bottom of the current jellyfish tentacles … the close button is also not near on the poster … make sure no examples of species pops up without someone selecting, finding, or making it"; "the main eye can also be the jellyfish body eye at the top").
  - **The myth, as the interface.**
    - **The bell is the eye that notices** (`#au-bell`, a file input). It is drawn in dots, as the bark painting draws it.
    - **Its four tears are the four tentacles.**
    - It looks toward the step that is open. It blinks now and then, and when it takes something in.
    - What it has seen sits in its pupil: a round of the photograph (`P.eye`).
    - With nothing seen yet, its pupil breathes: the invitation.
    - **A print is its sting:** a light runs down all four tentacles at once (`S.sting`).
  - **The steps are icons alone at the tentacles' tips.** Their numbers are set as references: small, raised, to the right. The globe's numbers are set the same way.
    - When a step has something in it, the next tip breathes and a light runs down its tentacle (`nextStep`).
    - Enter carries one on: from the line to W.I.S.H., then line by line to the art.
  - **Back up to the globe** is a dotted line rising at the top left (`#au-up`). The base is a wordless dot at the foot of the globe.
  - **One thing held, the catch** (`#au-catch`). The four tentacles hold it together under the bell, in steps 1 to 3; it is put down for print.
    - It opens in the page's place, with no headings: the map lens, a glass to find a life by name, the readings (when, the place, the water near, the canopy, today's heat) and Niño 3.4 with its year.
    - **Only what is touched is caught,** and dots on the catch count what it holds:
      - a touch on the map puts the piece there and catches the map;
      - a life is caught by name;
      - readings are caught one by one;
      - El Niño as a whole.
    - **No life is ever offered.** The catch shows only a life already caught, one named in one's own words, or one found by name. Nothing is in season, related or guessed on screen.
    - The engine still reads underneath, for the sightings it reveals and for the record.
  - **On the record** (`settle`), the life and the data are only what was caught. The receipt (`slip`, `show`) prints the life only if caught, the facts and links never, and one's own four lines.
  - **W.I.S.H. is four empty lines with the letters W I S H,** nothing drafted, no ↻. Writing in it alone makes a piece. The template ("which life?") is gone.
  - **Art.**
    - The four ways of drawing it are chosen by small pictures of themselves, no words.
    - The sign is one's own line, read from a step away.
    - The net names nothing unless the life is caught.
    - The poster has a band for what was caught. Each caught thing is a scrap on the poster, dragged where one wants it (`P.pos`, `drawCatch`):
      - the map as a round chart with its north and the sightings;
      - the life;
      - the readings;
      - El Niño with its line.
  - **Print.**
    - The poster is the hero, with one press under it: the printer. Save is small beside it, and the status beside that. No row of steps, no words.
    - After the print, the same press becomes a seed to start the next piece. The poster lifts and opens in the portfolio.
    - With nothing made, print shows the portfolio alone.
  - **The slideshow's close** sits on the picture's own corner, 44 px, and follows it as it zooms (`pinX`). A touch on the paper round the picture closes it too. The double tap is read from the pointer, so a phone's own double tap zooms.
- **v0.1 alpha, the aura, 26 October** (the owner: "it begins with the current novel.global globe rings … a big bang that starts on tap … when one of the icons is clicked rather than going to a new page and map everything remains on the blueprint background … the globe lines reshape into the Irukandji … All tab elements should be either part of one of the 4 tentacles of the jellyfish, or elements or objects it has grabbed or deep sea line dot elements").
  - **`/` is now the aura** (`src/base/aura.js`, `aura.css`). The base is untouched underneath:
    - Its pages still open by link (`#radio`, `#wish`, `#print` and the rest), and the aura sleeps under them (`AURA.sleep` from `open`, `AURA.wake` from `close`).
    - The whole base, with its own start, is at **`/?base`**. A small "base" mark sits at the foot of the globe.
    - The head script sets `html.aura-on` unless `?base` is in the address. The base's ORB and hum never run under the aura (`AURA_ON`).
    - The base hands the aura what it needs as `window.NG`: the engine, the stores, `place`, `slip`, `sendNote` (a noticing's record and receipt, offline to the outbox), and the sound.
  - **The seed.** A dot of light alone on the paper, three rings wound tight round it. A touch is the big bang:
    - a flash and a shock ring;
    - half the marine snow flung out from the centre;
    - the rings spring out to the globe (`drawBang`);
    - a low boom through the room.
    - The drone (`humStart`) starts at 0.385, 70% of the base's 0.55.
  - **The globe.** As before: three hand-drawn rings, RADIO, W.I.S.H. and PRINT riding them with their numerals, the drone following their depth.
  - **The morph.** A page touched draws the rings in as the irukandji (`drawMorph`):
    - each ring's points travel, staggered, to the bell (ring 1) and to two tentacles each (rings 2 and 3);
    - the bell touched reverses it, back to the globe.
    - RADIO opens on step 1, W.I.S.H. on step 2 and PRINT on step 4.
  - **The irukandji is the interface** (`drawIruk`):
    - **The bell** is a box jelly's, breathing every 3.6 s, with dotted lines inside it and four eyes at the corners, and a soft light round it (the aura).
    - **Four tentacles** hang from its corners, drawn with perfect-freehand, drifting on simplex noise, beaded with stinging cells. A light runs down the tentacle whose step is open. Over the step's page they go faint.
    - **Each tentacle's tip is a step:** 1 notice, 2 W.I.S.H., 3 art, 4 print.
    - **Each tentacle has grabbed something on the way down:** map, species, data, El Niño.
    - The keys never move; the tentacles move between them.
    - **The deep's own marks:** sound on or off (a dotted line and a dot, top right), close (a dotted line, top left of the slideshow), and the choices as beads on a dotted line.
  - **The lite flow, one piece at a time** (`P`):
    - **1 notice:** the eye takes a photograph (its GPS and time read as the base reads them, else the phone is asked), or a line alone. It is shown in colour and in full, with when, where, and what it may be.
    - **2 W.I.S.H.:** the four lines drafted by the base's engine, each editable, and ↻ turns through the others that fit. With no noticing, a life is chosen (typed, or from what is about now) and the wish is drafted from it.
    - **3 art:** photo, pixel (wonky pixels in their own colours), net (the sightings revealed where they are, the lives tied round them) or sign. The poster (`poster`) is drawn in colour on blueprint paper: the picture whole, never cropped, the life, the four lines, where and when.
    - **4 print:** the receipt goes to novel.global (the base's `slip`, through the print pipeline), and the poster is kept in colour in the portfolio. Save downloads the poster; new starts again, with a check.
  - **What it holds**, opened in the page's place:
    - **map:** a lens on the ground in blueprint (the imagery in luminosity blend over the paper's blue), one's noticings and the sightings in white. A touch sets where the piece was.
    - **species:** what it may be, the others, the lives tied to it, what is about now. A touch changes the life, or starts a wish from it.
    - **data:** when, where and from what, the place, the canopy, the heat, Niño 3.4, the need, who to call, and "where I am".
    - **El Niño:** Niño 3.4 now, the year's line, the outlook, and what is happening this month. + puts a line into the W.I.S.H.
  - **The portfolio** (`FOLIO`, IndexedDB `novelglobal/folio`, up to 24, with the composer's pieces after them):
    - Everything printed is kept in colour, from the aura, from the base's design stage (`AURA.keepNote`) and from the composer (`AURA.keepCanvas`).
    - The slideshow shows each picture whole on the paper, turning every 6.5 s.
    - Pinch, wheel or double-tap zooms in place (Panzoom). Swipe, the arrow keys or the dots turn it.
    - Nothing opens a new window or page.
  - **Brought in:** perfect-freehand (the strokes), simplex-noise (the drift), Panzoom (the zoom) and Architects Daughter (the hand lettering), all in `vendor/`, loaded once the aura starts.
  - **Checks:** `ONLY=aura` (phone and desktop), covering:
    - the seed;
    - the bang and the drone at 0.385;
    - the globe's numbered pages;
    - the morph on the same address;
    - a photograph in full, the four lines edited, the colour poster;
    - the print sent, with the portfolio opened whole and zoomed;
    - the four things held;
    - the bell back to the globe;
    - the base's pages by link.
    - The base's own checks run at `/?base`.
- **v0.1 alpha, the composer, 25 October** (the owner: "the created web or net art and song needs to be able to go to print shop … an 80mm canvas that resets, undo, allows assets, songs, web and net art"; "WISH needs an overhaul … a simple tree"; "the music … is still jarring … an ambient Enya, Akira soundtrack overhaul").
  - **The start.**
    - The icon is the irukandji as a globe: a white hand-drawn bell with latitude and longitude lines and four tentacles, on blueprint blue (`repo-static/iruk.svg`, `iruk-192.png`, `iruk-512.png`, `iruk-mask.png`; the manifest's colours `#17457F`).
    - Hand-drawn numerals ride beside the pages: 1 RADIO, 2 W.I.S.H., 3 PRINT.
    - A quiet hum (`ORB`, `humStart`, `humSet`): three soft voices, one to each page, louder, brighter and wider as its page comes to the front. It starts at the first touch on the start, and it stops when a page or the map opens.
  - **The top bar holds everything, in order:** RADIO, W.I.S.H., PRINT, then MAP, GUIDE, + (on the map only), ◎ where I am, and light or dark. The dock and the map's own keys are gone.
    - The page one is on is marked. No page has an ×. Where a view was opened from a page, ← takes it back there (`backKey`).
    - **MAP returns to the page it was opened from** (`mapFrom`). It returns to the start only when opened from the start.
  - **RADIO.**
    - The trail key (`#r-rec`) turns path memory on or off. With it off, opening cells adds nothing to one's path (`WEB.rec`).
    - ⎙ beside the web's art and beside a kept song sends each to PRINT's composer (`#r-cp`, `#d-cp`).
    - On a phone the sheet runs on a rail (`rail`, `.grip`). It can be dragged down to a strip of 56 px or up to nearly full, and it stays where it was left.
  - **The map.**
    - ◎ finds where one is (`locateMe`), with a dot and its accuracy ring.
    - Holding the map no longer opens the phone's image menu.
    - Sightings whose place iNaturalist hides or blurs, or that are known only to within 500 m, are dropped (`placedWell`, `geoprivacy=open`). These were the lives out at sea.
    - + now shows what it placed: the map fits to the new knots and opens the first one's card.
  - **PRINT's composer** (`COMP`, `da.base.comp`; `composer`, `compose`, `blockArt`, `scoreArt`):
    - An 80 mm strip of blocks: a poster, the web's art, a song (as a score: four staves, a mark for each step), an icon, words, a rule, the eye.
    - A block can be moved up or down, made smaller or larger, or removed with a check. ↶ undoes, and ⟲ starts the strip again with a check.
    - ⎙ prints it to novel.global, and ⇩ saves it as a PNG.
    - ★ hangs it on the showcase.
    - PRINT's groups now have small headings: COMPOSE · 80 MM, POSTERS, PRINTER, MAKE · DOWNLOAD, ICONS, PACKS · CLASS, THIS DEVICE.
  - **The showcase** (`#showcase`, `showcaseSheet`, `PIECES`, `da.base.pieces`):
    - Blueprint paper. The last piece hangs as the hero, the rest of one's pieces and the shared ones in a row, and the journey's art (the web of one's path) beside them.
    - Shared pieces arrive as records of type `piece`.
    - ← returns to PRINT.
  - **W.I.S.H.**
    - **+ makes a wish without noticing** (`newWishHTML`): a life (named or chosen), an icon, and four lines, each with ▾ choices drawn from the life and its issue. ✓ makes it a poster in the thread, where the device is or where the map is.
    - **A thread shows what it touches as a simple tree** (`treeHTML`): the life, the lives near, its song, its place in the web, the research and the replies. Each row's data (counts, distance, source, date) shows on hover, or on a touch.
    - **One's own poster can be edited** (✎): its four lines, saved in place.
    - **The stock lines are gone**, such as "Water and shade for the life here on hot days", "a sign at the spot, printed here", "Printed at a partner place" and "Passed on through the neighbours' net". The lines now come only from the life, its issue and its case.
    - **A fix.** Touching a poster on W.I.S.H.'s map had thrown an error and done nothing. It now opens that thread beside the map.
  - **Sound, recast as ambient** (the biggest weakness, after a search of open projects):
    - Brought in **Freeverb** (Matt McKegg, after Tone.js) and **Tuna** (Oskar Eriksson), both MIT, in `vendor/` and loaded with the first sound (`soundLibs`).
    - Every voice goes through one room (`room`): Freeverb's hall, a slow chorus, Tuna's ping-pong delay, a gentle EQ and a compressor. Without the libraries, the old convolver is used.
    - The voices are recast (`INS`):
      - gamelan: paired bells that beat slowly (ombak);
      - jegog: bamboo bass;
      - voice: a choir's "ah" that swells;
      - harp: new;
      - chak: the kecak as breath;
      - taiko: a soft drum.
    - A new song starts at 80 BPM, and the loop's file carries six seconds of the room folded back onto its start.
  - **Every photograph printed goes through one pipeline** (`printReady`): levels, a lifted gamma, an unsharp mask, then CanvasDither's Atkinson. This covers the booth, the receipt's photograph and SIGN.
  - Not done: a fuller pixel maker with image filters (the owner's alternative to the sound). The print pipeline covers the quality of what is printed.
- **v0.1 alpha, in hand, 25 October** (the owner: "deselecting all the constellations … a drone sound always plays"; "delete or undo with a check … for anything created"; "W.I.S.H. … the main side shows nothing but map"; "pixel maker icons … placed in the PRINT section … 128"; "back … to PRINT … every instance"; "4 tears … jellyfish limited to 4"; "reset … with a check"; "the crayon educational version").
  - **Your path is a constellation of its own** (`WEB.path`, `pathOn`).
    - It is shown as a chip and as the first row in the sets, with its own shape.
    - Hidden, it leaves the map and the print free of its lines. With no sets either, nothing is tied, the preview is empty and the web's voice falls quiet.
    - × (with a check) clears it, and ↶ puts it back. Hiding it is undoable with ↶ in the deck.
  - **Anything made is taken away only with a check** (`sureTap`): the first touch turns the key to ✓, the second does it. Then ↶ shows for six seconds to put it back (`undoToast`). This covers:
    - posters in PRINT;
    - one's own replies in a thread;
    - kept songs;
    - icons;
    - one's path;
    - a track cleared;
    - **the wipe** (PRINT, the bin at the foot), which clears everything this device made except light and dark, and starts again.
  - **W.I.S.H. beside its map** (wide screens; `drawWish`, `fitBeside`):
    - Only its posters show, each its photograph in a frame, red-edged when urgent, with its count of replies.
    - The one open is larger and ringed, and tied to the sightings revealed beside it.
    - A search over the threads narrows the list and the map together.
    - A poster touched on the map opens its thread beside it.
  - **Icons** (`ICONS`, `da.base.icons`, up to 48):
    - **Sources:** the pixel maker makes them (◫; a moving sprite becomes a GIF). In PRINT, + adds pictures, GIFs, SVGs or a pack (`.json`), and ⇩ saves them all as a pack.
    - **Choosing:** chosen in PRINT, an icon goes on the next noticing. On the design stage, any icon can be put on the poster or taken off.
    - **On the poster:** it is stamped in the corner of the art and printed black.
    - **On the map:** it stands for the poster.
  - **The pixel maker** goes to 128 cells.
  - **Back:**
    - Closing the pixel maker returns to PRINT, always.
    - The guide returns to the page it was opened from (`PAGEHASH`).
    - Every view opened from a page returns there.
  - **Fours:**
    - The eye has four tears (the ASCII eye too), as the irukandji has four tentacles.
    - On the map and in the print, an irukandji (`irukandji`) forms for every four cells opened of one life, in the order opened: a small box bell with four tentacles, one to each, sized by how far apart the four are. Three makes none.
  - **novel.global for class:** a crayon beside "add a pack" in PRINT opens the studio, the devices site for class.
- **v0.1 alpha, flow and sound, 25 October** (the owner: "reduce all instances of clicking to another page … focus on where the joy and need is"; "an undo or back button"; "sound additions … more fluid"; "each song … as a loop"; "a full sweep"; "a poster opened on PRINT … goes back to the start").
  - **Held still on a phone.**
    - `maximum-scale=1`, and `touch-action: manipulation` on the page, so a double tap never zooms.
    - Every field is 16 px on a phone, so touching one never zooms either.
  - **Paper, never a grid.**
    - The fine grain of the start lies faintly on the ground, every sheet, the card and the dock (`--grain`, light and dark).
    - The dotted grid the ground showed without its imagery is gone.
  - **Fewer jumps away.**
    - A case that worked elsewhere opens where it is (`caseLi`, `caseIn`): what was done first, its source last and small.
    - In the card, a cell's name unfolds what the guide says (status, where, what to watch for, its year) inside the card.
    - The dock is the tabs: the page one is on is marked (`dockOn`).
  - **Back.**
    - **Closing a view returns to the page it came from** (`back`, `BACKTO`, `PAGE`):
      - a poster or SIGN opened from PRINT, and a photograph taken from PRINT's eye, return to PRINT;
      - a print from a W.I.S.H. thread returns to the thread;
      - a photograph from the dock returns to the page it was taken on.
    - Escape does the same.
    - The phone's back closes an open card before it leaves the page.
    - **↶ in RADIO undoes** the last change to the deck or the sets, one at a time, the last fifty kept (`remember`, `undo`).
  - **The web's voice** (`DRONE`, ∿ in RADIO to turn it off):
    - each new stick is heard as a glide from the cell before to the cell now (`glide`);
    - each life opened holds a low tone at its kind's place in the scale, fuller the more of it was opened;
    - each set added lays a lower tone under them;
    - the filter opens as the web grows, and each tone swells as slowly as its cells are far apart.
    - It is heard only while RADIO or the map is open, and it is only ever cells.
  - **The radar records a full sweep.**
    - Turned on, ◎ makes the song four bars (64 steps), and one turn of the hand is exactly one turn of the song, so recording with the radar on captures the whole web, each cell on the same step every turn.
    - **▮/▮▮▮▮** sets one bar or four; the bar keys 1–4 show a bar, and the grid follows the playhead only while recording or sweeping.
  - **The song's file is a loop** (`novel-global-song-loop.wav`): whole turns of the song (about four bars), notes from the first sample, the room's tail folded back onto the start, no fade, so on repeat it carries on.
  - **A fix.** A W.I.S.H. reply half-written is kept when others' replies arrive and the thread is drawn again.
- **v0.1 alpha, the start, 25 October** (the owner: "the iconic blueprint blue … 3 semi-thin white rings that look hand drawn that rotate to be a slow 3D planet").
  - **The page.** The start (`#home`, `#orrery`) is blueprint blue (`--blue: #17457F`) with a restrained paper texture: three layers of SVG noise (a fine grain, slow mottling, a faint fibre) and a soft vignette. It has no words, no menus and no heading: the top bar, the box at the foot and the dock are hidden here.
  - **The rings.** Three hand-drawn white rings (`ORB`) are great circles at their own tilts, turning about one axis every 110 s, seen a little from above.
    - Each is redrawn every frame with a slight wobble, overlapping where the hand closes it, with a faint second pass beside it.
    - The half behind is fainter than the half in front.
  - **The pages.** A dot rides each ring at its own pace, carrying a page; it grows and brightens as it comes round to the front.
    - **RADIO** (`#o-radio`): a signal mast.
    - **W.I.S.H.** (`#o-wish`): an irukandji as the bark painting draws one: a dotted bell with four dotted tentacles.
    - **PRINT** (`#o-print`, `#print`): a receipt.
  - **Motion.** The rings stop when the page is hidden, when a sheet or the map is open, and when motion is reduced.
  - **PRINT (once SHOP)** opens on the eye: take a photograph, and the noticing begins. One's receipts, the printer, the downloads and the packs follow. `#shop` still opens it.
  - **The box at the foot** now belongs to the map, where the season matters. The top bar shows once inside a page.
- **v0.1 alpha, round five, 25 October: the web of noticing** (the owner: "the nets and web lines should be something built and created dynamically … each line or image should have a reason").
  - **The eye** is two lids that meet and are lashed at the corners, never crossing, so it no longer reads as a fish. The tears are dotted threads with no beads at their ends.
  - **The box at the foot** (`#oled`) no longer crawls.
    - It holds one line whole, wrapped, in Departure Mono at 11 px, with its count (3/8).
    - A touch shows the next line; each one stays for a while in proportion to its length.
    - The guide is its own key at the top.
  - **The web of noticing replaces the stick-chart decoration on the map** (`drawNet`, `WEB` in `da.base.web`). Nothing is tied until it is looked at, and every mark has a reason:
    - **Cells:** a dot in the earth tone of its kind (`TONE`); opened, it is ringed; one's own is larger.
    - **Trail stick:** joins each cell opened to the one before it. It shows the way attention went.
    - **Kin stick:** bowed; joins cells of the same life, in the order they were seen.
    - **Kind stick:** dashed; goes to the nearest opened cell of the same kind.
    - **Lashing:** marks where three or more sticks meet.
    - **Jellyfish:** forms over three or more opened cells of one life. Its dome grows with each one and takes that life's tone.
    - **Swell:** joins a collection's cells in the order they were seen, one swell per set added.
    - **Near tie:** joins one's own noticing to the sightings revealed beside it.
    - New sticks draw themselves in. Every mark says why it is there when the pointer is over it, for example "opened Noisy Miner, then Rainbow Lorikeet" or "both Rainbow Lorikeet".
  - **RADIO:**
    - **Layout:**
      - The emergency numbers are gone from the top. HELP keeps every number.
      - **–** folds the sheet away to show the whole map, re-centred; **+** brings it back.
    - **The 4-track is the map's own:** every note is a cell, with its id, kind and name (`placeNote(n, step)`).
      - Nothing sounds that is not a cell: ▶ on an empty deck plays nothing, and an empty step touched with no cell open stays empty.
      - Old songs' bare notes are dropped on load (`tied`).
      - A cell open in the card goes into the armed track with **＋**, or onto any step touched while it is open.
      - Notes show in their cell's tone and name.
    - **The card** (`peek`):
      - The photograph is large.
      - Its name opens the guide's page for that life, in the same window.
      - There is no link out to the source record.
      - Keys: ♪ (hear it), ＋ (into the track) and ×.
    - **Collections** (the jellyfish key):
      - Each set is shown with its own shape: its cells where they are, joined in the order seen (`shapeSVG`).
      - A set touched is added to the web and kept. More touched add to it, never replace it.
      - Each added set is a chip; × takes it off.
      - Above the list is what will print or download, drawn as it will be (`webArt`):
        - **Layout:** **d3-force** lays it out, so what is tied pulls together and each cell is still drawn toward where it is.
        - **Drawing:** **Rough.js** draws it by hand.
        - **Keys:** ⇩ downloads a PNG; ⎙ prints it on novel.global's printer (`type: 'web'`, never a gallery story).
    - The receipt's NET art draws only its ties, with no frame and no swell.
  - **Five open projects brought in** (`repo-static/vendor/`, licences in `LICENSES.md`), each loaded only when used:
    - **exifr:** reads where and when from HEIC and other photos the small reader cannot read, within three seconds.
    - **d3-force** and **Rough.js:** the web as art.
    - **gifenc:** the pixel board's sprite saved moving, as a GIF.
    - **Departure Mono:** the box at the foot.
  - **The studio is its own site,** the devices site for class.
    - Its devices are on unless turned off in Settings (`da.devices` = 0).
    - The ← novel.global bar over its words is gone.
    - The base no longer links to it.
  - **Printers:** only novel.global's printer is shown in this version (`printers()` filters to `novelglobal`).
- **v0.1 alpha, the booth, 24 October** (the owner: "the printer in stores or in public becomes a habit and free service … a small working QR code starts the real story").
  - **The booth** (`#booth`, or `#booth=<printer id>` for a partner's printer): a printer's own page, with nothing of the site on it.
    1. **The start.** The ASCII eye and two keys: `[ (o) ]` takes a photograph and `[ ^ ]` uploads one.
    2. **Editing.** The photograph is shown as it will print. A small ASCII menu holds:
       - seven stickers, each placed by a tap and taken off by another;
       - `[ Aa ]` for words, which print large under the photograph;
       - `[ <- ]` undo, `[ x ]` start again, and `[ >> ]` print.
    3. **Sent.** The receipt as printed and its pips, then `[ novel.global ]` (the full site) and `[ ↺ ]` (another photograph).
       - ↺ appears only after a wait no one sees, a random two to five minutes (`da.booth.next`), so no one prints on repeat. The wait survives a reload: until it ends, the page shows only the eye and `[ novel.global ]`. The Worker's own limit (eight sends in ten minutes per address) still stands behind it.
  - **The receipt** holds:
    - the photograph made ready for the printer's dots (`forPrint`):
      - stretched between its own darkest and lightest 1% (a flat picture is left as it is);
      - lifted for the spread of a hot dot (gamma 0.8);
      - sharpened a little;
      - dithered with Atkinson's method from **CanvasDither** (Niels Leenheer, MIT, `repo-static/vendor/canvas-dither.js`). It is ported to plain script, and the error is carried in a float buffer.
    - the stickers, drawn crisp after the dither;
    - the words;
    - a small QR code (`#n=<code>`) that opens its page on the site, and is kept as a way back in.
  - **The gallery.** The colour photograph, stickers on, is sent with the print, as large as the server takes (1280 px at most, stepped down to stay under 400 KB).
    - It is `type: 'booth'`. Once approved, it is in RADIO's photographs.
    - It is never a W.I.S.H. thread, and it is kept on the phone as one's own.
    - A partner printer prints without approval only when it is set to on the approval page (PRINTS WITHOUT APPROVAL). Otherwise each booth print waits for a yes.
  - **SHOP's downloads row** has two new keys:
    - **The QR sticker** for the booth: a PNG with the eye, the code and novel.global.
    - **The poster**, printed on the 80 mm printer: PRINT FREE in big ASCII letters on two lines (FIGlet's small font), the eye, and the booth's code. The code is drawn in terminal cells inside an ASCII frame; its three corners are kept solid so a camera reads it. It goes to the first 80 mm printer online, else novel.global's, and waits there if that printer is off.
  - **RADIO, checked again:**
    - ↓ keep and ⇩ download were two keys for one wish. ⇩ now keeps the song and downloads it.
    - ▶ on an empty deck played silence. It now lays the eight nearest lives on the first track as a figure, to change or play over.
    - The note count and the scale's name are gone.
- **v0.1 alpha, round four, 24 October** (the owner: "the last chance before the showcase … help someone through this journey without words"). The base is cut to the reference art: dark by default (e-ink paper in light), one monospace at 12 px, and no words but novel.global and what is urgent. The sources an addition might come from are in `docs/sources.md`.
  - **The eye** (`#cam`): two bamboo sticks lashed at the corners, a dotted iris, a shell pupil and five threads hanging with beads, after the stick chart and the bark painting. It is the camera. It looks about slowly; while a photograph is read the iris turns (`body.busy`).
  - **Glyphs, not words**: RADIO (a mast), W.I.S.H. (four beads on a stick), SHOP (a receipt), map, guide, light and dark, drawn once as an SVG sprite in `index.html`. Each keeps its name as a label for screen readers.
  - **The OLED** (`#oled`): one small line at the foot, like an unhoused screen module. It cycles novel.global, then "What have you noticed?", then what is urgent now and what is in season (`nowTick`). Pressed, it opens the guide.
  - **Photograph intake** no longer stalls: the picture and its EXIF are read apart, a picture that will not draw is tried again as a bitmap and then left out, every load gives up at 12 s, and the input is cleared after use so the same photo can be taken twice (`onShot`).
  - **The noticing** is wordless: the photograph, a `>` line, who it may be as one small list (— for none), the alert when there is one, and →. The data still travels with the record.
  - **The receipt's W.I.S.H.** prints as a poem between two rules, with no letters. Its lines come from banks by need (`IB`) and the life's own season (`wishOptions`, `wishLines`). The place and time come first, so the headline is not said twice.
  - **Status as pips** (`pips`): ● sent, ● seen or queued, ● printed; ✕ failed; the first pip blinks while it waits on the device. "Held for a yes" is gone. What was sent shows at once, printer or none. There is no share step; → goes to its thread.
  - **W.I.S.H.** (`#wish`) is a news page of strategies, ranked as Hacker News ranks: points over hours with gravity, the urgent doubled (`threads`). The first is the hero, its art large. A thread holds the poster, what is urgent about it, the W.I.S.H.es written in reply, and four lines to write one more. Each line has a minimised list of lines that fit this poster's tags. A reply is kept (`da.base.replies`) and sent as `type: 'wish'` with `re`, its parent's code, and others' replies come back into the thread (`loadShared`). ▲ is a vote (`da.base.votes`).
  - **RADIO is a 4-track** (`deck`, `paintDeck`). There are four tracks: gamelan, jegog, voice (a formant chant) and chak (kecak), plus taiko to swap in, tuned to pelog or slendro, after the Akira soundtrack.
    - ● arms recording. Then a tile tapped, a knot touched or the radar passing a knot places a note of that life's kind at the step now playing, like tape.
    - ▶/■ plays, ⌫ clears, ↓ keeps the song (`da.base.songs`), and ⇩ downloads four bars as a WAV (`wav`, rendered offline).
    - A double tap on a track opens its settings: instrument, level, octave, long or short, and mute. Tempo and scale are global.
    - Tying is gone.
  - **Nothing leads out of the window**: a tile, a knot, a stick or a jellyfish opens a small card in place (`peek`) with the photograph, name, time, distance, pips, the alert or a fact, its W.I.S.H. lines and the number. Its keys are ♪ (hear it), ↗ (its record, in a new tab) and ×.
  - **The net, with restraint**:
    - No sticks between live sightings.
    - Beads only on noticings.
    - Two jellyfish at most: the lives seen most, their domes joined to their knots by dotted threads.
    - Hovering a knot, stick or jellyfish says what it is (`hover`, `#tip`).
    - The map fills from shared stories and live sightings (up to 400), and loads more at the end of a pan (`moreLive`).
  - **The guide**: the groups are open to read but minimised first (`details`), except Now. "Needs" is now **If you find**, "Lives" is now **Neighbours**, and "Related" is now "Near it, now".
- **v0.1 alpha, round three, 24 October** (the owner: "the radio isn't functional, and the tabs link to the same old site with no way back"). RADIO, W.I.S.H. and SHOP are now the base's own pages; nothing in the base leads into the studio except one key, THE FULL STUDIO ↗ under SHOP › ADDITIONS, and the studio carries ← novel.global home (`#to-base`).
  - **RADIO** (`#radio`): 000 and Wildlife Victoria on top; ▶ plays what is about, a note each (pitched by its kind of life), its name shown and its photograph lit; ◎ the radar, a toggle, sweeps the ground and sounds each knot it passes; ⋈ ties two knots; ↓ saves the net as art. LIVE is every iNaturalist sighting with a photograph within 2 km of the last place noticed (else the map) in the last 30 days, the stories shared, and one's own, as photographs; one opens with its photograph, its credit, the guide's facts and the camera. SETS, HELP.
  - **W.I.S.H.** (`#wish`): the four lines, drafted by the engine from the last noticing (or any of the last twelve, or a new photograph), each one editable; what would be great as chips; → the receipt with the lines as written (`n.wishText`).
  - **SHOP** (`#shop`): one's receipts and where each is (held, queued, printed), the printers (● listening), the solar thermal printer to build, the pixel board and SIGN, the packs, and the studio as an addition.
- **v0.1 alpha, round two, 24 October** (the owner: "20% of what I asked, and broken"). The base's W.I.S.H., SHOP and RADAR keys had landed on the studio's first visit, a bare map; the studio sent every page link to its landing page (`70-boot.js` now opens the page asked for). The studio is **plain** by default (`html.plain`, set in the page head; Settings › DEVICES brings the hardware back): no screws, ties, antennas, cables, plates, grilles, lights or jellyfish on the devices, the gold flip key a plain ⇄, no idle prompts, the rail in words, seven of the print shop's fifteen tools. Settings › DEVICES is kept in its own key (`da.devices`), so a new visitor is still new. Known, from before this round: on a desktop the PRINT strip's code does not read off the screen in the check (on a phone it does). The base gained the ground on opening, the location ask, the data chips, the placed moment that reveals a few real sightings, SIGN, W.I.S.H. in place of the facts, SETS, sound, tying, packs and tags as triggers.
- **v0.1 alpha, 24 October: the base** (the owner, after field tests: a lorikeet fledgling in Carlton Gardens and no alert, no quick search, no context; the site breaking on older phones). See "The base, v0.1" below and `docs/brief-v0.1.md`.
- **0.12, 23 October: quieter lives, the poster as made** (the owner's notes on 0.11).
  - The lives on the map have no white edge and nothing round them: no danger rings, no gold rings or sparks, no red point, no breathing light, no orange pulse for the lives in extreme danger. Each is its pixel shape with an ink edge and a faint shadow on the ground; what it is in danger of is on its card. A pile shows as the creature itself twice behind. The plants are drawn the same way (tree, sprig, flower, grass, toadstool).
  - The poster on the wall is the strip as made, to the pixel: the receipt's head keeps its size and place and only its photograph is laid over in colour (`colourStrip`), so the words, the code and what was placed stay where they were.
- **0.12.2, 23 October: the knobs as instruments** (the owner: the knobs changed nothing heard).
  - The receipt on PRINT keeps a hand's width of paper under its words before the code, for what is placed there (`jLayout`); the poster on the wall has a margin of paper under its last line (`colourStrip`).
  - A picture never rests on the receipt's words: dropped or moved over them it slides down into the room under them (`jClearOf`); on the photograph at its head it sits where it is put. On the wall poster each picture's colour self is fitted inside the box it had on the strip.
  - In the Boadicea mix (`boaV`) a layer's knob is its instrument, not only a filter: MIST ambient (the soft pluck, the choir for a cluster, the depth charge for danger), HALL ethereal (the choir on every note, an octave of air above), DEPTH electro (a sub pulse under the note, the note an octave up into the dub echo). El Niño heats each (a breath of choir, the air always, a quick arpeggio). A knob turned plays three notes through its new setting at once (`turnKnob`). A loop kept or opened from a link plays every layer through its knob (`loopTick`); in the other moods the knob stays a filter.
- **0.12.1, 23 October: no stacks, no overlaps, sizes by kind, words over stickers, a full equaliser** (the owner's notes).
  - One mark per place however many were seen (no pile). Marks that would lie over another wait until the map is closer (`unclutter` in `35-life.js`: the larger and the more urgent keep their place; people's needs and alarms always show). Sizes by kind: an insect or spider half a bird, a bird half an animal; the twenty larger lives larger still.
  - The receipt's own words are printed again over anything placed on them (`jInk`: the base's ink, multiplied, its photograph left out), on the strip, in print and on the wall poster alike.
  - The equaliser fills its display (no empty band above the columns); the climate lights each month higher (`EQ_LIT` 4 to 11), the extreme months to the top, saturated, flashing on the beat; the music lifts the rest.
- **0.11, 23 October: the owner's notes on playing with 0.10** (`docs/brief-0.11.md`).
  - PRINT: what is placed lands where the strip is in view (`viewBox`, `viewSpot` in `69-zine.js`), on the receipt's picture only while that is in view. A shorter key beside the longer one (never above what is on the paper); the closer key second. Once everything is open, an empty receipt says "tell a story" in its words box after five quiet seconds (never printed).
  - The handheld sending: its paper lifts out of the slot and goes as bits to novel.global's tab (`sendAnim`), then novel.global opens and the page comes out of the printer.
  - The poster on the wall is the strip as it was made, in colour (`colourStrip`): the photographs as taken (`daSrc`), the receipt's head as the colour receipt, stickers in their colours (`daColour`, `stickerColour`); the strip and what prints stay in ink.
  - novel.global: the stories counted as shown, the example with them; SONGS second (`songsHTML` in `68-tracks.js`): each kept song an album, the radar's picture its sleeve, its own card slid out of it, played again or shared as a link, a key to keep the radar's song now; CASE STUDIES (the briefs) above the sources. Below the message form the receipt is a carbon copy: black ink on white, heads printed reversed, pictures grey until a hand is over them; the settings' keys in ink. The build key reads BUILD A SOLAR THERMAL PRINTER (two lines), and its download is a plain parts list under the same heading: core, mods, hacks, upgrades.
  - Once open, after five quiet seconds a white word beside the information corner: "What have you noticed?" on RADIO, "Make a connection" on W.I.S.H.'s front. The name over the map on W.I.S.H.'s front is in light.
  - The board's W.I.S.H. template is fixed (`daTpl`): it cannot be moved or deleted, only shown or hidden with the W.I.S.H. key, which sits with ZOOM and LOCK after ADD; a template laid before is recognised (`tplFix`). In SELECT for the board, what is on it already shows as chosen, and pressed again comes off (`daPick`, `boardPicks`, `boardUnpick`).
  - SELECT's wire hangs only from the device's own key; the toolbars' ADD keys open it but the wire goes to the device.
  - PRINT turned over keeps the last six strips sent out (`da.exports.v1`, `keepExport`): SENT BEFORE, each pressed for any way out again (print, wall, PNG, ESC/POS, mesh, OLED, send).
  - The lives on the map are creatures folded from paper and set in pixels, as a handheld drew them (`CREATURES`, `creature`, `pixelSprite` in `marks.js`): each kind its own shape and colours, a kind within a kind by its name (`VARIANTS`: a magpie's white, a cockatoo's crest, a frog's spots, a snake's bands), an ink pixel round each and a hard shadow, no glow and nothing see-through; each folds slowly as it moves (four folds, `foldRate`). Twenty larger lives seen in the last three months are drawn as themselves and larger (`HERO_ART`: platypus, fox, koala, bush rat, rakali, echidna, wombat, kangaroo, wallaby, glider, both possums, flying-fox, microbat, antechinus, blue-tongue, long-necked turtle, tiger snake, frogmouth, powerful owl). Every corner is a little off true, by hand (`wobble`). Danger ahead is a crisp ring; past years a small grey point; drinking water a small filled drop. The folded creatures, smooth and in pixels, are sticker packs in SELECT (PAPER, PIXEL).
  - A life under the pointer has its photograph made ready in colour (`jWarm`), and the receipt is drawn 40 ms after a press, not 220.
  - The equaliser is one box: every month the same eleven segments filling the column (`EQ_SEGS`), lit to its heat (`EQ_LIT`, `data-lit`), the music lighting more above that and a peak falling back (`eqTick`), never past the top; no blocks above the column.
  - The pixel sprites are drawn on canvases kept on the CPU (`willReadFrequently`), so making hundreds at once never stalls a frame.
  - The card and poster screen's keys carry their names only. The showcase's close-up shows on a phone: the slide's stylesheet held its picture with `transform: none !important`, so the zoom is now set with priority (`gzApply`), and a zoomed picture takes the touch for pinch and drag.
- **0.10, 22 October: the owner's notes on 0.09** (`docs/brief-0.10.md`).
  - The equaliser has no blank segment: the months no forecast reaches yet (April to September, `h p`) are lit as the year's heat runs on, a shade softer, and above every column the rest of its scale shows faintly in the same colour; an extreme month's blocks over its column are lit red and glow, the top one brightest (no black).
  - The card beside its poster is drawn at the poster's height, centred on it (the poster's own size limits no longer apply to the card's picture).
  - The message form on novel.global clears once a message is sent, words and photograph; its print key says "Message prints directly to novel.global if online" on a hover.
  - The water as it is (`waterAround`, `waterView` in `20-orbit.js`; `water`, `river` in `35-life.js`): every river, creek and canal OpenStreetMap knows, along its own course, as wide as its banks are apart (twice the distance to the nearer mapped bank, smoothed; a default by kind where no bank is mapped), and every pond, lake and wetland pool as its own shape. A square of about five kilometres at a time, kept a month in `da.water.v1` (twelve squares at most). Drawn on a layer of its own and laid down once, a soft sky blue, so overlaps never darken. The few waters in the config stand in only where no real water has come.
  - Birds, mammals, reptiles and frogs are a quarter larger than the small lives, with a soft light of their own colour under them, a fine light keyline and a bolder line. A life in extreme danger, or a threatened one in severe danger, breathes a slow light of that danger under it; the rest stay quiet so those few are seen.
- **0.09, 22 October: the owner's list on the base build** (`docs/brief-0.09.md`).
  - The El Niño equaliser's colour moves with the shape: each month's bars carry a heat (`eqHeat`: the month's own level, eased, rising after the year's coolest month toward next September), the bars' hue runs from yellow to red up each column with it (`--hot`, `--p`), and the music and El Niño push the red higher as they play.
  - Two keys ask before they act: run the first visit again (Settings) and delete a board each show SURE? for three seconds; a second press does it (`sure()` in `40-panel.js`; the board's native confirm is gone).
  - The first life collected on a first visit flies to the receipt over the map, not to the W.I.S.H. tab (`flyToEl`).
  - Places, partners and groups keep their tag up for 2.2 s after the pointer leaves, long enough to read (`35-life.js`).
  - The words on a receipt move: dragged anywhere, typed into on a press (`daMoved` is kept in `ZINE_PROPS`; the code follows the words).
  - PRINT's dongle keys are tiny grey keys with white icons in one column: ZOOM, BACK, DELETE (start again). The yellow tie is drawn again, both plugs into the dongle's left side. Once the first visit is done, PRINT's full toolbar shows above the strip on the simple face too.
  - SELECT's key opens SELECT and, pressed again, closes it.
  - novel.global: the printer photograph's overlay is small, at the head of the printer, the code alone (amber while it waits). A key at its top right, BUILD A SOLAR DIRECT ACTION PRINTER, downloads `repo-static/build-a-solar-printer.txt`: a field handbook in the style of an old IBM manual and a 90s activist cookbook, ASCII art, parts, stages with checks, the receiver's commands, solar wiring and power budget, and what to send to be paired into the network. The solar kit in it is a suggestion; nothing in the code depends on it.
  - Below the printer and its message form, the portfolio is one long 80 mm receipt in a cyberdeck, in full colour: a dark chassis with screws down both rails, each module torn at its head and perforated at its foot, headed by a band of its colour with hazard stripes, its number on a terminal tab and its name in VT323. The printer and the message form keep their look and lose their numbers. The W.I.S.H.es finished here are among the stories (one module, not two), the stories are tickets with their whole headline, what they are of, where and when. The showcase's close-up key zooms in place (2×, 3×, back); full screen is its own key.
- **0.08, 22 October: the base build, as the owner has it printing** (`docs/brief-0.08.md`).
  - SELECT carries words and photographs of one's own, first in every tab (`txt`, `img` in `pickPut`): words go into the receipt's own words box on PRINT, a line of words on a strip of art, a note on the board; a photograph from the phone or computer onto the same. The devices lose their camera and words keys; PRINT's dongle has a key to start again in their place (`zineTool('reset')`: everything placed taken off, the words emptied, undo brings it back).
  - The light switch reads DAY with a sun, NIGHT with a moon.
  - Sound after Enya's Boadicea (1987), no backing track: on a first visit LIFE is `boa` (`boaV`): a choir's "ah" (`choirV`, three formants on detuned saws, slow swell, long hall) for a cluster of lives, a depth charge (`depthV`, a sub falling from 96 to 34 Hz with a thump, into the dub echo) for a life in danger, a round low note for the rest; BOADICEA is a mood to choose once open. A tamer on the whole mix (a dip at 2.8 kHz, the top let down) and three filters each layer is heard through (`fxBus`: MIST, HALL, DEPTH), chosen by RADIO's knobs, which no longer set volume (`prefs.fx`, `fxOf`). Ticks are low sines, the strings softer; the radar set down, the muse and a poster put up sing with the choir; the unlock ends on the choir and the depth charge.
  - novel.global's portfolio opens on the printer itself: the owner's photograph from above (`repo-static/printer-top.jpg`), the Pi's red power and green activity lights and the printer's light lit as the printer is (online green; offline the printer's amber blinking), and a print sent from here comes out of the photograph's own slot, head first, a pulse down the cable and the words over the lid while it prints (`printerTop`, `ptPrint`); the last print stays hanging.
- **0.07, 22 October: the master plan's next builds** (`docs/brief-0.07.md`).
  - Colour outside PRINT: the receipt over the map, the receipt laid on the board, the posters on the wall and every card show the life's own photograph in colour at its largest (iNaturalist `large`) with its common name; only the strip on PRINT and what prints stay in ink. `intelCanvas(sel, s, W, 0)` is the colour receipt (`colourCanvas` in `60-paper.js`); `savePoster` keeps the colour receipt as the wall's poster; `cardArt` draws the photograph in colour at the card's full size inside its arch and the name on its plate (constellation cards keep their four tones). The record's slip face stays in ink, since it is what prints.
  - The showcase is a carousel of pairs: each poster's card (the noticing and its connections) stands beside it at a tarot's proportions; the close-up key takes the pair full screen on any screen, where the wheel, a pinch or a press zooms the poster in place.
  - A link's song: a QR, a code or a mix opened arms a song key low on the left (`linkSong`, `#song-k`); the first touch starts the song of that place (`strings.song()`: the figure tied there and the lives around it) round and round, without leaving the page; its small key keeps the place and its layers among the loops.
  - Only a life makes a receipt (a sighting, or a record of one's own): `jPick` takes `k: 'life'` alone; a place is tied to the life held, or only named; groups, printers and gatherings open as before. Places on the map are drawn quiet (half clear) until their tag is up or a life is held they can be tied to.
  - The ground always shows: every water, park, garden and green patch at low opacity, the creeks as bands of water; a double press opens a patch (`life.hit(x, y, peek, dbl)`), so a single press reaches what is over it. A year of mammals is asked for apart, and six years of the same weeks.
  - The receipt's clip stays pinned where its head hung, rolled up or let down (`jrPin`); the jellyfish at the unlock is one, slow; PRINT on a phone opens the strip wide, with a zoom key on the dongle; the dongle's Aa is a photograph key (words are typed on the receipt itself); its yellow tie loops outward on the left.
  - SELECT is never open without its wire: when its key is gone it moves to the SELECT key of the device in front, or closes (`selWire`); the example from SELECT goes onto the receipt already there, as art. The sticker packs scroll sideways on a desk (wheel, drag, a thin bar).
  - Small: RADIO's middle gold screw is gone; the El Niño equaliser moves with the music (`snd.level`), its caps thrown up and falling back, the extreme months flashing on each note, every month in its colour; El Niño turns the radar twice as fast, its notes still on the beat; a board of one's own opens further out (0.7, all of it in view), ZOOM second among its keys; the template's instructions end at "until the plan makes sense", with no notes under them; a strip is 1.5 ft long at most (`capH`, 457 mm); the card's keys read "to the W.I.S.H. board" then "to the print shop".
- **W.I.S.H. over the map, folded and changed, 22 October** (the owner's notes):
  - The intention device keeps one size. Its screen is a two-line character LCD (`#jw-for`, 52px, rows 2); a longer intention scrolls inside it, a small ▲ or ▼ on the glass for what is out of sight (`jwMore`, `.lcd-up`, `.lcd-dn`), and the device, its make key and its place on the rail never move as it is typed. The receipt still shows every letter. The LCD's place line follows what is held (`jNowW`).
  - The receipt hangs from a bulldog clip (`.jr-fold`, `[data-jfold]`). Pressed, it rolls up into it, a strip of its head left showing with a torn foot, and the suggestions go with it; the ring and strings of what is held stay on the map. Rolled up, a life, a place, a printer or a group touched changes what is held, and the strip, the ring and the LCD follow; it stays rolled. The clip, the strip, or the device's suggestions key lets it down as it was (`jrFold`, `jrFolded`, `jrFoldSet`; for the visit only, reset by make, by a pick from another page and by a life sent from its card).
  - The map in full: on a phone the W.I.S.H. tab, or the device slid down, lowers the device to its lip and rolls the receipt up with it (`jrFolded` reads the pane), the keyboard put away; the tab again, the strip, or a touch on the device's head brings both back. On a desk the device stands in its column beside the map, so the receipt rolled up leaves the map clear; the tab pressed again still puts the page away.
  - Let down again, what is held is slid clear of the receipt only if it is still on the screen (`jClear(true)`).
- **Sound, stage C of `docs/brief-0.06.md`** (`snd` in `00-core.js`). One key, A minor, low (`qn`, `qf`), and one tempo, 120 BPM: every musical sound lands on the next sixteenth (`onGrid`), two a sixteenth at most (`room`), and the whole mix goes through a soft low-pass. The layers' voices: LIFE the dub stab into its tape echo (`dubV`), WATER a sub note that drops (`dropV`), COMMUNITY dust and filtered noise (`dustV`), POLLUTION a low detuned stab through the ladder (`stabV`); FOG and BURIAL stay. The whistle, music box, glass, horn and driven tones are gone; a mood kept from before sounds as the nearest deep one (`MOOD_AS` in `68-tracks.js`; the old ones stay listed so radio links still read). Rewards, the muse, the radar set down and a poster put up are the dub stab in the key. The hand turns at one speed always (`life.tempo`); El Niño changes heat, not speed: the mix opened and driven harder (`snd.heat`), the radar red.
- **Printers that move.** `receiver/setup/install.sh`, one line on any of our Pis: Wi-Fi chosen from a phone (`setup/wifi.py`: after two minutes with no known network the Pi opens `<NAME> SETUP` with NetworkManager's own hotspot, prints its password and a QR code, and serves a page at 10.42.0.1 that the phone opens by itself; known Wi-Fi is only ever added to), the Pi's own `gpio-shutdown` for a button on pins 5 and 6, and, on the novel.global receiver, TURN OFF on the approval page (the receiver asks `/next?can=off`; the worker keeps `printers.can` and `printers.off` and hands `{ off: true }` once, within two minutes; `pull.py` prints TURNING OFF and leaves `/run/da-pull/off`, which `da-off.path` turns into a safe power-off). FOE turns off from a stick holding a file called OFF.
- **Cell packs:** the file input reads its file with its own listener (`packFile`, bound in `bindPortfolio`), so a file chosen while the portfolio is drawn again is not lost. `data-pack` is the cell pack's alone: SEND no longer also tries to put a sticker on the strip.
- **Private messages.** The portfolio's send message goes as kind `message`: it waits on the approval page (its key reads PRINT), prints once approved, and is never listed (`/api/stories`), found by its code, or its photograph served. Messages sent before this, as stories, are kept off the map by the site (`pin.cn === 'NOTE'`); delete them on the approval page to remove them for good.
- **Alpha 0.3, small tweaks.** Every device's plate reads DIRECT ACTION, its name small and grey under it. PRINT's back tidied: its ways out tall enough for both lines, the print key round, the fold key small; a neat yellow jumper on the label maker's side. The countdown's screen holds one size, count or step. SELECT opens in the middle of the big screen on a wider one. W.I.S.H.'s quick side: the receipt alone, one small key opens a showcase of examples to remix (the actions, the lives most at risk); an action fills the receipt's four lines and pressed again takes them off; a life becomes the receipt's picture; neither touches the intention typed (`WDRAFT.act`). The suggestions key is gone.
- **Alpha 0.3, one select key.**
  - SELECT (`69-pick.js`): one key on W.I.S.H. and PRINT, both faces, opens a sheet from the foot (a panel beside the device on a wider screen) with three tabs: what has been made here (the example, stories, posters, songs, cards, constellations, boards, codes, any link as a code), the stickers in their packs (and one's own), and the lives near and further out. Chosen, it goes onto the strip in PRINT, onto the board on W.I.S.H.'s studio side, and becomes the receipt's picture on its quick side. It replaces PRINT's animals, stickers and made-here drawers, its made-here rows, the board's and the strip's ADD menus, and the board's list of pieces; the photograph's looks keep their drawer.
  - RADIO's back: the equaliser on a small dark screen of its own; the plate reads DIRECT ACTION, RADIO small; the steps live on the countdown's screen, five seconds of the count then the step waiting, round again until the last is done, and pressed it goes there (`stepNow`, `stepAttr`). No hover names on the mood keys.
  - W.I.S.H.'s quick side: real actions to take up, each with its steps (`ACTIONS` in `42-faces.js`, replaced by the suggestions of 21 October: a neighbour, the house, pets, wildlife, a street tree, shade, the state election of 28 November 2026), pressed to fill the receipt with them; the receipt larger, close up within its screen; the lives the heat puts most at risk (`needLives`: animals first, one insect at most, no plants), pressed to add to the intention, never replace it. Suggestions only when their key is on. On a phone the actions and the lives fold behind two small keys. A whip antenna and a pin header as its mods.
  - Boards of one's own can be taken away (`delBoard`); BOARD 00 cannot. Saved to the wall, a strip goes up on the board too. A card turned over places its poster and its song (constellation) with it, each a toggle.
  - novel.global: the W.I.S.H.es filed show only once there is one. Beside the showcase, the cards as a catalogue that drifts; pressed, a card turns over to its stats (its name, its kind, its El Niño threat, its number); pressed again, it opens. Cells to the map reads "add radio tracks". The print key's hover has no red. On a phone the other ways out fold behind one key.
- **Alpha 0.3, flow and use.**
  - Sound: places (COMMUNITY, POLLUTION) now play in their layer's mood, as the lives do; only FOG keeps each family's own small sound. The three volume steps are further apart (`VOLS` 0.18, 0.5, 1) and the master compressor gentler, so a level is heard. The El Niño switch (quick side only) and the outlook (studio side) are one setting (`setNino`): the switch chooses the first extreme month ahead and back to now; an extreme month chosen on the outlook turns it on. A month that is not extreme quickens the hand, never to El Niño's speed.
  - W.I.S.H.: the intention a line that wraps, all of it in view, the usual beginnings listed under it as it is typed (`sugShow`, `intentList`); clear a small key on the screen beside the camera; make alone, in the middle. The studio side makes only once the intention and all four lines are written; the empty ones are marked. Whatever is made goes up on the board too (`thumbOf`, `addToBoard`). The big screen beside the quick side: the three steps as three marks, the receipt (pressed, close up), and the lives the radar holds as photographs, one pressed to make it the intention, each with a link to its sighting.
  - PRINT: its back about half the size, its keys one size. What has been made sits in view as rows to slide through: posters, cards, songs, one touch onto the strip (`madeHTML`). Cards and songs moved here from novel.global: they are pieces of a story, not the showcase.
  - Boards: three sizes (ZOOM, or the wheel), dragged by their bare ground to move about, LOCK to hold everything still (`boardZoomStep`, `boardPanBind`). Everything printed or sent goes up on the board. A card turned over has a key for the board, and its face opens close up. Close up has five sizes: 50%, 75%, whole, twice, three times.
  - The receipt's key on a life's card says TO PRINT (it takes the receipt to PRINT, at the head of the strip). The admin link is invisible where it was, still pressed to open. One small mod on each quick face: a jumper wire, tape and a sticker, a cable tie.
- **Alpha 0.3, major fixes after the owner's second walk-through.**
  - On a phone the device rides a rail (`RAIL`, `railFit`, `railSet` in `42-faces.js`): it rises from the foot over the big screen, a finger slides it up and down from anywhere on it (never sideways, never larger), from all of it in view to only its head showing (`LIP`). A small grip bar shows at its head. The tab pressed again lowers it and brings it back (`setPane`). Where its head stands is shared as `--dev-top`, so the receipt preview and the strip keep clear of it. A slide never counts as a press.
  - The turn-over key sits at the foot on the right of every device and face: submarine yellow with a dark jellyfish on the quick side, green going to blue on the studio side.
  - The El Niño switch carries a small label of embossed tape, EL NIÑO, and turns the radar red at once (`life.moved()`).
  - The radar is a vacuum-fluorescent display under a bell of clear water: smoked glass, a fine grid, its rim, rings, hand and wake lit soft and pale, never a colour (`vf`, `glass`, `hand` in `35-life.js`). In El Niño mode its light runs red. The rim breathes with the rings rising from the centre. The old blue-green drift (`shim`) is gone.
  - Map marks have no white: lives, places, water (a droplet alone), groups, the drinking fountains; the temperature on a small dark screen. Marks that would sit on each other gather under the most telling as a small pile, which pressed from afar brings the ground closer (`cluster`); `spread` is gone. Photographs past zoom 16.3 (back to marks below 15.95), each fading in; kept 600 at a time, the oldest let go first (the cache used to empty itself at 240, which made marks flicker).
  - Sound: a new mood, DUB (`dubV` in `00-core.js`): a deep round note and a short muted chord into a tape echo. The radio's first moods are DUB on LIFE, WEIGHT on WATER, BURIAL on COMMUNITY and HAUNT on POLLUTION (`LM_DEF`). The example plays at Royal Park between the zoo and the wetlands, 700 m (about 30 lives spread round the dial and ten water points, chosen from the live data), deep and slow, no loop. A loop now sounds exactly as the radar does: the same voices, levels, stereo (where a cell lies round the radar) and speed, the places thinned the same way, and the constellations' songs with it. A cell's stereo, live too, is its bearing.
  - PRINT's front has a fourth key: undo, or take off what is chosen.
  - novel.global: the screws are gone. Each part of the portfolio a module in one of the devices' materials, a coloured stripe along its head and its number on embossed tape. The gallery is the deck's main screen: a graphite chassis and black glass, the posters on a strip that slides one at a time under a finger or the keys (CSS scroll snap: no library; the Vue and Flutter carousels suggested need frameworks this site does not use), its number on a small display in the radar's light; keys for back, close up, as a card, download, on. Close up has three sizes, a press stepping up and keeping the place under the finger, + and − keys (`zoomArt`).
- **Alpha 0.3, polish, after a walk through the journey.**
  - The turn-over key is the jellyfish: a small round key at the foot of every device and both its faces (`flipBtn` in `42-faces.js`). It wiggles on each page until it has been pressed there once (`prefs.flipped`). The same jellyfish is the favicon and the app's icons (`repo-static/icon.svg`, `icon-192.png`, `icon-512.png`, drawn from the SVG with sharp).
  - RADIO: the countdown on its back is a grey-green screen like the handheld's. The layers on its back are four channels of a small mixer: a matte key with a light in its layer's colour, a dial for its mood, a strip of lights, three bars for volume; play, loop and link are matte keys too. On its front a red switch, El Niño at 120 BPM (`prefs.nino`, `body.nino`): the hand turns once in two bars, the glass runs hot, and every cell it finds sounds on the next sixteenth of the bar (`snd.ping`). Nothing is added: no beat, no drum.
  - Sound a third louder (`bus` 0.65). Rain falls on the map only while it is raining now (Open-Meteo `current`, `S.wx.now`); the forecast's rain no longer makes it rain on a hot day.
  - W.I.S.H.: its front's screen headed INTENTION, its one line without a letter; make glows once there is an intention. The blueprint is behind both faces.
  - PRINT: the print key is the printer alone, its colour its light, green online, amber when prints wait. It glows once there is a receipt at the head of the strip. Its back in the order it is used: the story, the drawers (looks, animals, stickers, what to place), then the paper and the keys out.
  - On a phone, RADIO, W.I.S.H. and PRINT have no sheet and no bar: the device rises from the foot over the big screen, the strip or the board or the map in view above it, frosted where it covers them; the tab pressed again lowers it and brings it back. The label maker stays over the strip while its keys add to it.
  - The map: every life a sticker of its own kind, cut from paper, no disc behind it: the mark in its colour, a white cut edge, a hair out of register as a risograph prints, a soft shadow, a small tilt of its own (`sticker` in `marks.js`). Danger in the months ahead is the cut edge itself, red when severe and black at the extreme; rare, a gold spark; many together, a small pile. Old sightings are their own shapes, faint. More kinds of their own: tree, flower, grass (plants by their own words, `PLANT_GLYPH`), ant, echidna, and rats, mice, foxes, cats, dogs, rabbits and kangaroos by name. Close in, the photographs are a third larger, and under the pointer too.
  - novel.global is a cyberdeck: each part of the portfolio a module of clear acrylic on four standoffs with a number plate, a ribbon cable down the deck behind them. The hero is a screen in its bezel on clear acrylic, its number on a small screen, its keys on a strip of board; pressed, it opens close up, larger again when pressed again (`zoomArt`).
- **Alpha 0.3 (`0.1.0-alpha.3`), the fronts.** Strategic research, connection mapping and praxis are slow and complex, and people retreat from them; the radio is the way in, an ambient release with reasons to come back. A slow tool and a quick act pull against each other, so each of RADIO, W.I.S.H. and PRINT now has two faces: the **front**, the shortest way from a sound to a receipt, and the **back**, the studio as it was. The jellyfish key at the foot of each device turns it over (`42-faces.js`: `faceOf`, `setFace`, `flip`, `prefs.face`, `body[data-face]`). BOARD 00 is the companion lesson: how a W.I.S.H. is reached.
  - The tabs, by name and address: RADIO (`#radio`), W.I.S.H. (`#wish`), PRINT (`#print`), novel.global (`#portfolio`). On a phone the sheet's bar no longer repeats the page's name.
  - Each face is a piece of hardware. The front as it ships: a matte shell of smoked plastic, what is inside seen softly through it (`--guts-r`, `--guts-w`, blurred). The back, the same device opened: clear acrylic on four standoffs, its board at the head (`--board`, `--plug`), one yellow cable plugged in, a plate with its name and its step (`mods(name, step)`). RADIO a smoked blue-grey radio; W.I.S.H. a handheld in smoked jade; PRINT a label maker in matte graphite, its board under a smoked amber cap.
  - RADIO's front (`radioFront`): play, and a knob for each layer (off, then three levels; a click turns it round, the arrow keys step: `turnKnob`), the steps under them. Once the radio has played a while with no W.I.S.H. begun, the W.I.S.H. tab glows until it is opened (`nudgeWishSoon`).
  - W.I.S.H.'s front (`wishDevice(false)`): one line, **I** (Intention, on a long hover), offering many more beginnings (`INTENT`, a prompt for each species, the field list's names: `intentOptions`), and a camera key for a photograph taken or chosen (`#wf-photo`, kept with the draft, printed at the head of its receipt). The receipt shows beside it as it will print (`wishPreview`); **make** takes it to PRINT, the intention alone if nothing else is written. Nothing is written for anyone: the back is the same handheld with the four lines empty, each showing what its letter stands for (What we know, It would be great, So let's create, Here is how it works), and BY. No dice. The paper form is gone.
  - PRINT's front (`printFront`): the receipt alone (80 mm); three keys, words, a sticker, a photograph; and one key that prints. The printer's name and state show only when its light is pressed (`data-prn`). The back keeps the print shop; its printer is a tile, named when pressed. The ways out are named as a manual names them: PRINT LOCAL, SAVE WALL, EXPORT PNG, EXPORT ESC/POS, COPY MESH.
  - A month pressed on the outlook is a data screen, no sentences (`readout`): its level, the source, Niño 3.4, the odds of warm days, of very hot days and of rain, how many days of 35° are normal, the window, the lives in it, the jellyfish behind. The month essays are gone from config.js.
  - El Niño, updated 18 October 2026 (`DA_OUTLOOK`, its sources in `src`): Niño 3.4 +2.81 °C in the week to 11 October, near record, about +3.7 °C at its peak around December (WMO); the Bureau's outlook of 15 October gives above-average highs over 80% likely and unusually hot days over 70% likely in parts of Victoria from November to January, with November drier on the coast; NOAA has a strong El Niño through January to March. Months after the Bureau's outlook are marked as models, then as no outlook issued.
  - **The example** (`69-example.js`; its kit, `DA_EXAMPLE_KIT`, in examples.js): play pressed before any place is chosen tunes the radio over Royal Park (600 m) with the example's levels and moods, the lives sung as a choir (COLLECTIVE, `collectiveV`: an open chord through vowel shapes and two echoes, no drums). What sounds is what the hand finds there; it starts no loop (`playExample`). A loop kept and played again follows the knobs and moods as they are set now.
  - **BOARD 00**, before BOARD 01 (`exampleBoardJSON`): the example laid out in three columns, NOTICED, RESPONSE and DIRECT ACTION, with credited photographs, sources, the cases behind the poem (Zoos Victoria's Don't Palm Us Off, Greenpeace's Rang-tan, Fashion Revolution's #WhoMadeMyClothes, the RSPO), its receipt, its sound and its strings. It can be looked at, not changed (`exLocked`). Its zine is in PRINT's last drawer, under Example, and is the portfolio's hero (`exampleZineImage`).
  - **Editing BOARD 00:** on the approval page, under the stations, BOARD 00 · THE EXAMPLE: its key reads LOCKED; press it and it reads EDITING ON. On the site, open W.I.S.H., turn it over, choose BOARD 00, change it, and press the last key on the board's toolbar (SEND THE EXAMPLE FOR APPROVAL). It waits on the approval page as EXAMPLE · BOARD 00; SHOW makes it the example everyone is served (`/api/example`). Press EDITING ON again afterwards, so it reads LOCKED. Examples are never listed with the stories.
  - On a wide screen RADIO, W.I.S.H. and PRINT have no sheet: each device stands on the big screen itself (the map, the board, the strip, the receipt as it will print), frosted where it covers something; the board's canvas and the strip keep clear of it (`boardW`, the last block of app.css). novel.global keeps its page, and a life opened keeps its card. A phone is unchanged.
  - BOARD 00 is framed by its three columns, again whenever the board changes size (`exFrame`).
  - The portfolio has no name at its head: the muse swims back and forth across it (`swim`). Its message key is a printer and nothing else. The loop's ring follows the radar's sweep, and is hidden where the loop and the radar stand together.
- **Alpha 0.2 (`0.1.0-alpha.2`), made by hand.** The jellyfish's colour, never quite green and never quite blue, is the one thing that moves (`shim`, `shimbg` in app.css; `shim()` on the map): a step met, the loop playing, the send message key, the radar's wake by day, the heads of the guide and the field list.
  - The radar by day: its wake, rim and glass in the deep's own ink, so they read on a bright photograph. With motion off (Settings, or the phone's Reduce Motion) the hand stands still instead of vanishing.
  - A month pressed reads as a short piece on one life (`DA_OUTLOOK.read` in config.js, keyed by the month of the year): what makes it itself, where it is hurt, how it is helped, and what to do, more urgent toward the hottest months. No tags. Set in Playfair Display, upright.
  - The steps (the clues, then the checklist) are one thin line of three dots with small words under them: filled when done, a point in the ring when begun, the one waiting breathes (`stepsHTML`).
  - Beside play: **loop** keeps the radio as it sounds now playing round and round from where it was made, while the radar moves on, quiet, a dashed ring left where the loop stands (`setLoop`, kept in `da.loops.v1`); **link** shows the sound as a picture with a code to scan (`mixArt`), to copy, save or put on the strip. The link is `#mix=lat,lng,radius,` then three digits a layer (on, volume, mood): opened, it tunes the radio there and waits for play (`mixCode`, `mixOfCode`, `tuneMix`).
  - The layer keys are cut paper: matte, flat, an ink edge, a chip of colour when on.
  - The Country stands at the head of the radio only, and fades over a minute; it comes back under the pointer.
  - The W.I.S.H. is an archival submission form: its letters in the margin, ruled lines, no number, seal or icons.
  - The print shop: no PRINT heading; every key says what it is for, small, under its mark; the photo looks shown on one small picture each, above the animals; the stickers in drawers, shut until a pack is pressed. The story at the head of the strip can be moved up and down (`lockBase`). On a phone a finger on bare paper, or on the story before it is chosen, scrolls the strip; a tap chooses it, then it moves. Zoomed wider than the screen, every edge can be scrolled to.
  - Cards: turned over large between the poster they came from and the constellation they belong to (`cardKin`); keys with small words; no sharing; laid on the strip as art on a white mount (`mountArt`).
  - The portfolio's key reads **send message**, lowercase, in the name's type.
  - Phone: a smaller tab bar (still 46 px a tab), and the information corner (sources, the build, ADMIN) lifted above the page's bar so it can be touched.
  - Then, quieter still: the steps are three small dots on one unbroken hairline, and only the step waiting says its word. The countdown stands alone in the middle, without its sun. The W.I.S.H.'s key reads **make**: what it makes goes to the print shop, at the head of the strip.
  - The print shop's lower half is four drawers, one open at a time, each only its mark: the looks (its key shows the look chosen), the animals, the stickers, and what has been made here. That last one is a dropdown of every story, poster, sound (the radio now, the loops kept, the signals started), card, constellation, board and story code, and a box for any link, placed on the strip as a code to scan (a radio link as its picture). No hover words on the looks; no words under the sticker packs.
  - The `.io` lights of alpha 0.1 are scoped to `i.io`: the board's field-notes keys share the class name and were being drawn as dots.
  - Stories approved before `CONFIG.SHARED_SINCE` (the ones made while the site was being built: the golden chord, the snails and the rest) are shown nowhere. Approve a story after that moment and it shows as before. To remove them from the server for good, delete them on the approval page.
- **Alpha 0.1 (`0.1.0-alpha.1`), the first public alpha.** One through-line across the three pages: small inputs are screens (`--lcd`), keys are clear plastic, and every main key is clear electronics with its colour in its mark (play in the glow, each layer in its own colour, the last acts in orange: the W.I.S.H.'s send, PRINT RECEIPT, PRINT MESSAGE, start). A step lights red going in and blue coming out (`--in`, `--out`).
  - Day is the default; night is a choice in Settings (`darkNow`).
  - RADIO's clue is a row of the checklist, one at a time. The checklist has three steps, each with an input light and an output light: Where are you?; W.I.S.H. (begun, sent); Make · Print (a poster, a print). Both lit, the step is done.
  - PRAXIS POEM in the letters' own type and size, in red. The quick print's key reads PRINT MESSAGE. The tabs have no hover label; their names come on a press.
  - The deck: every poster, every life sent to the W.I.S.H.MAKER and every constellation is a card in a palette of its own (deep, sun, acid, leaf, the handheld's green, ember: `CARD_PALS`), kept in the portfolio, turned over large, shared or saved (`shareCard`), laid on the strip from the card or from ADD. Posters' cards stand larger on the map. The word on screen is only ever "card".
  - On a phone the ZINEMAKER's strip scrolls under a finger when zoomed in: a drag on bare paper scrolls, a drag on a piece moves it (`allowTouchScrolling`, no selection box on a phone).
  - Examples: only the orangutan (DA-0RNG) is in the code. Stories approved on the live server show to everyone; take any off from the approval page.
- **v0.05, care in the details.**
  - Sound: everything a fifth louder (`bus` 0.5). The muse, tapped, sounds a container ship's horn in fog (`snd.ship`, no more than once in six seconds). The radar set down sounds a tug's two notes (`snd.toot`), no more than once in 45 seconds (`tootOrTick` in `30-map.js`); otherwise the plain click. (The deep water under the radio, `snd.bed`, was removed in alpha 0.3: it sounded like a backing track.) Each step met is answered once with a few notes of glass and a glow (`snd.reward`, `stepsCheck`, `won`, `prefs.steps`); the last, a print, fills the air with the muse.
  - The radar: no ticks on its rim; a clear disc of water with faint bell ridges and rings that rise from the centre. A month ahead chosen on the outlook quickens the sweep with its danger, twice as fast at the extreme, and heats the glass (`heatAhead`, `tempo` in `35-life.js`). Lives are matte light: flat discs of their own colour around them, no highlight, no gradient. At a distance the crowd gathers into fewer, plainer marks, larger as they hold more.
  - The clues: "make a connection" waits for a string tied (`markConnect`, `S.connected`), not a dial turned.
  - The head: the name in the middle, the muse on its left balanced by a space on its right. The rail stands in one place on every page, below the toolbars. Each tab says its name for two seconds when pressed: DIRECT ACTION RADIO, W.I.S.H.MAKER, ZINEMAKER, novel.global (`long` in `VIEWS`).
  - A phone has four buttons only. The page is a sheet: down, its bar shows the page's name; up, it fills the screen; the bar or the tab again turns it (`#sheetbar`, `setPane`).
  - PRINTER ONLINE SOON when none is on. The Country list shows the cities to come, not yet chosen (`CONFIG.SOON`). The radar first stands a kilometre across its reach.
  - The W.I.S.H.: block capitals in boxes, Praxis Poem in blackletter, inked slowly; corner marks.
  - The press: a look applies to the photograph chosen, else to what comes next and the story at the head; sizes are kept exactly (`inkAll`). Photographs as stickers are whole, never cropped, in a frame (plain, polaroid, stamp, round, deckle: `photoFrame`), one's own stickers too. ADD offers the posters made, the stories as receipts, and a QR code for each story and its song (`qrImage`). More animals from further out, a random mix one of each kind (`pullWild`, `WILD`).
  - The WISH MAKER: the constellations first, each its art and its name, one press onto the board; none yet, a key that opens the nearest life on the radio with its strings in reach (`consStrip`, `makeConstellation`).
  - DIRECT ACTION on a life's card no longer opens the old list of places (partners offline, a novel.global key that sent without the strip): it takes the receipt to the ZINEMAKER at the head of the strip, where PRINT RECEIPT sends it (`toPress`). `openSend` stays in the code, unreached.
  - RADIO moves on to the checklist as soon as any later step is under way (a W.I.S.H. begun or sent, a poster, a print), even if start was never pressed.
  - The W.I.S.H.MAKER board takes a picture pasted (a screenshot, an image copied anywhere) or dropped on it (`boardImageIn`).
  - The ZINEMAKER zoomed right out shows the whole strip however long it has grown; its desk keeps its own scrolling frame.
  - The map asks iNaturalist for the rest of life apart from the insects (birds, mammals, reptiles, frogs, fish, molluscs, spiders), two pages more, joined without repeats.
- **v0.04, the last polish.**
  - RADIO shows only the clue waiting (find yourself, then make a connection, then start); a done clue goes. The pager reads PRINTER ONLINE or PRINTER OFFLINE. At night the extreme months run red to the top, with no grey between the column and its tall blocks.
  - The header: the muse and the name in the middle, level with the rail's first key; the muse drifts and pulses (`muse` on the svg itself, which phones animate reliably). One watermark per screen fades slowly in and out (`wmfade`): in the page on RADIO, beside it elsewhere.
  - The tabs name themselves: beside each key on a wide screen, under it on a phone, where the rail is a tab bar across the foot. Above it one switch with two named halves, MAP / BOARD / PAPER / WALL and PANEL (`MAIN_W`).
  - The press on a phone: a resize on a sharp screen cleared the strip and nothing drew it again (`fitZ` now redraws). The longer-paper key adds paper (`len`). PRINT RECEIPT sends whatever is on the strip, with a story at its head or as one of its own (`stripSignal`), to novel.global's printer through approval, and says what happened (sent, no signal, too many, too long). Whatever is printed, sent or saved as a picture goes to the portfolio wall too (`savePoster(true)`), the newest the hero. The photo styles now set every photograph on the strip (photocopies and the photographs of lives), dithered at the dots they will print at, the original kept to set again (`inkPhoto`, `inkAll`, `daSrc`).
  - The quick print has no words on its paper, only a blinking cursor; its key reads PRINT TO NOVEL.GLOBAL with its light.
  - The W.I.S.H.: "a poem in four lines" under the letters; Praxis on a long hover; R&D says Sustainable innovation.
  - The clues are words alone. On a wide screen, over the board and the press, the rail sits below their toolbars.
  - The ideas pack (`IDEAS` in `69-zine.js`): thirty-five terms the work stands on, from Chaos Magic to Reverse Fashion, each a word sticker in its own face with its meaning on a long hover. Two keys before the photographs of lives: an animal's photograph from anywhere on the map, any one or the newest seen (`wildSpecies`), as a sticker in a varied cut.
- **On a phone, one pane at a time.** The dock (`#dock`) holds the four tabs on the left and two keys on the right: what the page works on (the map, the board, the press or the wall, `MAIN_IC`) and the page itself. `setPane('main' | 'page')`, `syncDock()`, `body.pane-main` / `body.pane-page`. A life's card (`body.rec`) still opens as a half sheet over the map. The press fits the strip to the screen at the middle zoom.
- **The head of every page** (`#ph`, `headBar()`): the muse and the name, level with the rail's first key; under it, on one line, the Country and its sovereignty, a select ready for more places (`CONFIG.COUNTRIES`, `prefs.ctry`).
- **The pager** (RADIO, above the countdown, `pagerHTML`): the printers online by name, a light and a buzz; dim when none. The PRINT SHOP's head names them too.
- **A life's receipt is art for the board.** On the card, the receipt (the life, its photograph, its constellation) has its four W.I.S.H. lines off unless the W I S H key on it is pressed (`wishOn`, `prefs.wishOn`; a remix turns them on). TO THE BOARD lays the receipt as an image on the board open in the WISH MAKER (`toBoard`, `addToBoard`, which writes into the kept board if the canvas has not been drawn yet). STORY issues it as before (`issue`). The W.I.S.H. itself is written in the WISH MAKER's form, whose first line, what it is for, now takes any words, the usual ones offered as you type (`wf-for` with a datalist), on a small LCD screen.
- **Constellations as art** (`figArt`): the chart over the faint shape of its life, its song as a row of bars, its name. On the board and as a sticker in the press.
- **PRINT SHOP:** PRINT RECEIPT is the one plain key (to the printer online, else it waits 24 h); the other ways out are small keys under it. The photograph's look on the receipt: diffused, halftone dots, ordered, engraved lines or hard (`PHOTO_MODES`, `prefs.photo`, `dither(img, levels, mode)`). Boards can be laid on the strip from ADD (`boardImage`). What is placed lands in the part of the strip in view (`viewSpot`). The blank W.I.S.H. moved to the portfolio's downloads, which have their names again.
- **The receipt, redesigned** (`slipCanvas`, `slipText`): no "Photograph by the issuer"; the data on one small line without labels (`dataLine`); the constellation and its relations above the W.I.S.H.; the W.I.S.H. set heavy, in capitals, as a manifesto; the Country and SOVEREIGNTY HAS NEVER BEEN CEDED at the foot of every print (`CONFIG.SOVEREIGNTY`).
- **The quick print** (PORTFOLIO, first): a blank 80 mm receipt to type on, a photograph if wanted (sized with a slider), and one key, the printer by name. Kept as typed (`da.quick.v1`); sent as a story, so it waits on the approval page like any other (`quickCanvas`, `quickPrint`). Reject it there to keep it off the board.
- **One watermark:** the muse large, faint and cut off by the edge, behind the board, the press, the wall and the cover; not in the page or the play button. Clear electronics on the tabs and keys (`--ac`, `--ac-on`, `--ac-hi`, `--ac-edge`); the layers as clear coloured plastic. The extreme months of the outlook stand taller in blocks of their own.
- **One muse at a time.** The watermark in the page (`.panel::after`) and the one over the surface beside it (`body.off-map::after`) take turns, each fading out as the other comes (`wm-a`, `wm-b`); on RADIO only the page's shows. The lockup's muse breathes: its bell (`.jb`) pulses and its threads (`.jt`) sway; `jellySVG` groups them for this.
- **PRINT** (PRINT SHOP, `#sec-out`): the outs under their own heading, each a solid key with the mark of something leaving: print here, to novel.global (orange), keep as a poster, picture, printer bytes, mesh line. The paper keys above stay outlined, as settings. Constellations among the pieces show as their own charts.
- **Life marks are glass** (`badge` in `marks.js`): lit from inside in their own colour, a touch clear, a rim and a highlight. No gradients.
- **Start again** (Settings, the reset key): a warning, then everything made on this device is cleared (`resetAll`); fetched caches stay.
- **PRINT SHOP:** three sizes on the zoom key (`PRESS.zl`); species stickers cut in turn as a circle, stamp, scallop, hexagon, arch, heart or ticket (`CUTS`); constellations clear, over their life's shape (`figChart`).
- **Clues, then the checklist.** The clues are a magnifier with "find yourself" (also floating on the ground until the radar is put down), a chain with "make a connection", then START. Once a signal has been started (`MIXES`), RADIO shows the **checklist** instead (`checklistHTML`): Discovered where you are; Started a wish (two lines written); Made a poster (kept from the PRINT SHOP: `da.posters2.v1`, pinned on the map where its story is, the portfolio's hero); Printed a receipt (a photograph of it held up, taken while novel.global's printer is online: `takeProof`, `da.proofs.v1`). START sits under it for another signal.
- **Species cards.** A cell's card no longer turns to a W.I.S.H.: its button, a mark with no word, sends the species card (name, Latin, where, what it needs, its photograph) to the WISH MAKER (`sendSpecies`, `da.species.v1`), flying to its tab. The W.I.S.H. form on the card stays in the code (`toWish`) but is not reached from it.
- **ADD.** The WISH MAKER board and the PRINT SHOP each have a + key opening a small LCD menu (`pickMenu`): species, constellations, cells, signals, onto the board or the strip. The three readings in the PRINT SHOP are shown as small strips of the story itself.
- **The air** (`36-weather.js`): small sprites over the ground, from the real weather: heat shimmer (more on a hotter day or month), sun glints, rain when it rains. Still when motion is off.
- **The look** (the last block of `app.css`): by night a clean, strange dark (`--white` #06090B), one bioluminescent glow (`--glow`), orange only for danger (`--haz`), the acid of a live signal (`--acid`), a cold blue (`--cold`); by day open paper (#F4F3EE) and ink. Hairlines, crop marks and stamps, as in an archive; readouts in the archive's green (`--lcd`). The older tokens (`--pink`, `--sun`, `--tang`, `--magenta`, `--violet`) now point at these.
- **The muse: the Irukandji jellyfish.** Never named or explained on screen. It is the favicon and app icons (`icon.svg`, the PNGs), the RADIO tab's icon (`jelly` in `marks.js`), the lockup with the name at the head of RADIO, a faint watermark on the page, the board, the press and the cover (`--wm`, an inline SVG), inside the play button, the first sticker of every pack, a watermark on the board as it is downloaded, the plate of each cards, and a ghost that drifts up over the ground now and then. Tapped five times quickly, the lockup fills the air with them. Drawn once in `marks.js` (`JELLY`, `M.jelly` for canvas, `M.jellySVG`).
- **Icon sets** in `marks.js`: the zone (`zanom`, `znut`, `zdial`, `zfence`, `zstake`, `zjar`, `zhatch`, `zmask`, `zhaz`, `zgrid`, `ztripod`, `zfile`, `zeye`, `zpylon`, `zwire`), cold marks for the investigation; and sweet gore for contrast (`skull`, `bheart`, `dagger`, `bones`, `coffin`, `eyeball`, `drip`, `stitch`, `tooth`, `ghost`, `plaster`); witchy, ink (tattoo) and turtles beside them.
- **Pieces of one's own.** The cells placed on the map, the W.I.S.H. issued or sent, and the constellations are listed as pieces in the WISH MAKER (onto the board as cards, a cell with its photograph) and in the PRINT SHOP (a story as its receipt, a cell as a sticker of its photograph or mark, a constellation as its chart). A sighting can be an INSECT or a MOTH, or any kind typed.
- **The tabs' names:** RADIO, WISH MAKER (`signals`), PRINT SHOP (`signs`), PORTFOLIO.
- **The W.I.S.H. flows through each:** RADIO, START A SIGNAL (then START STORY); WISH MAKER, the W.I.S.H. written and SEND THE SIGNAL; PRINT SHOP, STORIES WAITING TO PRINT.
- **SIGNALS** (`#signals`; `69-board.js`): the strategic black book. On the page, first, **the W.I.S.H.**, the master form: the signal it answers, its four lines, by, and SEND THE SIGNAL, which makes it a story kept on this device (in the ledger, as any slip) and opens it in SIGNS. Then **the boards** (`da.boards.v1`, each in `da.board.<id>`): each with the signals laid on it and their constellations under it; one active; a new one; the field notes downloaded as Markdown, and Markdown brought back in as notes. Beside the page, the active **board** over the ground, drawn with Fabric.js 5.3 (MIT; `repo-static/vendor/fabric.min.js`, loaded only when needed), the canvas of the open dreamboard project: keys labelled as on hardware (NOTE, SECT, LINK, IMG, DEL, SAVE); each signal a card that can be rewritten; strings joined with LINK and let go with a click on the string (or LINK on the same two again).
- **PRINT SHOP, this pass:** the receipt shown larger than it prints (`fitZ`, up to 1.6 times; the paper underneath keeps its size). The three readings row is gone (the style stays as set). The words keys show their face and, pressed again while the words are chosen, change it: typewriter, a flourished serif (Playfair Display italic), blackletter (UnifrakturMaguntia), a spray can (Sedgwick Ave Display), bubbles (Rubik Bubbles), the terminal. Tape pressed again becomes a strip of bandana, then barbed wire. A bandana patch in black and white (drawn, `bandana()`), turned over by pressing again. Sticker packs as keys: life, the jellyfish, the zone, gore, witchy, ink, turtles, words (`PACKS_ALL`). The lives in the radar now with an open photograph sit above them as round photographs (`radiusSpecies`). KEEP AS A POSTER sounds the fog horn.
- **Posters on the map** are cards from an old handheld (`cardArt`): four tones of the deep, a pixel frame, the number in Roman, the poster dithered in an arched window, the muse on the plate. A touch turns one over, large (`openPosterCard`), with the way to the press and the poster to keep.
- **WISH MAKER, this pass:** the board is drafting paper, blueprint by night and a lightbox by day; cards are paper on it and strings are red. A pencil, and OUT: the whole board as a PNG or a one-page PDF written by hand (`boardOut`, `pdfOf`). A signal laid on the board brings the photographs of the lives in its circle, strung to it. The W.I.S.H. form opens with what it is for (`wf-for`): a species, the climate emergency or the circular economy, kept on the story as its note. R&D is stamped in red beside W.I.S.H.
- **PRINT SHOP, as built now** (`69-zine.js`): the receipt is the page. The story waiting to print is set at the head of an 80 mm strip (or 58 mm, a Game Boy print, an A5 zine), and drawn on: every sticker of every life and mark, in any ink (`SWATCH`, any colour), packs of one's own (`da.stk.v1`), pen, shapes, stamps, tape, cut-out letters, photocopies, undo. What is on the strip is what prints, here or at novel.global's printer as its own raster (`directAction(s, dest, bytes)`). Each paper is kept as Fabric JSON in `da.press.<format>`.
- **SIGNS, before** (`#signs`): the press. STORIES WAITING TO PRINT, each shown on the desk as the paper will carry it: a heat-printed receipt by default (80 mm; or 58 mm, a Game Boy print, or an A5 zine page). Its style (PAPER, `>`, CONNECTION) changes the print at once. Out: PRINT (here, at the paper's size), NOVEL.GLOBAL (to novel.global's printer, through approval), PNG, ESC/POS, MESH. The **stickers** come from the signal: each kind of life it heard, its places (red if they pollute), its water, cut out with a white edge; on the A5 page, with typewritten words, a headline, letters cut from different papers, photocopies and tape. Kept in `da.zine.v1`. Also the printers and a blank slip.
- **The look of SIGNALS and SIGNS** is transparent electronics: smoked clear plastic, the circuit seen through it, screws, and labels as on the back of hardware (MODEL DA-03, DA-04). The radio's play button is a clear acrylic disc with its circuit and an LED. The icon is the radar in a clear shell over a board.
- **PORTFOLIO** (`#portfolio`; `#stories` still lands here): work published from the approval page, the board of stories (eight as cards, the rest as a list, a photograph and a headline each), RECEIVE, the briefs, the tools, the settings and the sources.
- `portfolio.html` is novel.global's portfolio, of which DIRECT ACTION RADIO is one work: published posts by category, as lists with counts, and each post on its own address (`portfolio.html#slug`). `field.html` is a field list of 204 kinds of life. `guide.html` is a visual key to every mark, kept under about 620 words.

### The base, v0.1 (`src/base/`, served at `/`)

A page for any phone. `index.html`, `base.css` and `base.js` (plain script: no `?.`, no `??`, no framework, no WebGL), with the settings it needs written into the page by `build.mjs` (`window.BASE`: imagery, centre, printers, contacts). Everything else is a pack, loaded only when used: **TERRAIN** (imagery tiles in greys, panned by hand), **FIELD DATA** (`base-db.json`, built from `field.js`, `briefs.js` and the outlook: about 120 KB, fetched after first paint) and the **STUDIO** (the full build at `/studio`). TERRAIN and FIELD DATA switch off under RADIO › HELP › PACKS; without them the base is the question, the camera, the help lines and the receipt.

- **Home**: the ground in greys, quiet under the question, no marks on it. "What have you noticed?", the camera, and RADIO, W.I.S.H. and SHOP in words; they open the studio's RADIO, W.I.S.H. and PRINT pages directly (`studio?from=base#…`: the studio's first visit is never walked again, the base is the first visit now). At the top, MAP, GUIDE and ◐ (light and dark, `da.base.theme`). One line at the foot, NOW: fledglings on the ground, swooping, El Niño's window, snakes, heat, then what is in season, read from each life's own event; pressed, it opens the guide. Lines arrive through the old phone network's signs (`glitch`); 2600 in the guide plays the tone that once opened a trunk line. Words are in the device's sans, data in its monospace.
- **No copy of the brief on screen, no steps shown.** A noticing is four moments, one key each:
  - **The photograph** with where and when: its own GPS and time (`exif`, a small JPEG reader); else the phone is asked (◎ lights when the place is known, asks again when pressed); else where the map is (the line blinks; a tap on the map moves it). A `>` line for what is happening. A real alert only when there is one, first: what to do (`ISSUES`), the life's own advice, its season now with El Niño only when this life is in this month's window, today's heat when the day is over 35° and the life suffers in it, and the number to call. Chips: the life it may be (two others offered), the need it names, the tags chosen before. Data chips, on unless pressed off: the suburb (`SUBURBS`), the nearest named water or place (`DB.waters`, `DB.places`), the suburb's canopy (`DB.canopy`), today's top temperature (Open-Meteo), Niño 3.4 now. All of it travels with the record (`body.data`).
  - **Placed** (`revealStep`): the map opens, the knot falls, and up to three recent iNaturalist sightings within 3 km are revealed and tied to it, one each of the same life and its two closest relatives, only ever of the life asked for (`reveal`). Never everything El Niño touches. Five seconds, then on (a touch holds it; → goes at once).
  - **The design stage**: the receipt as it will print, its photograph the top half; a touch on it, or one of four dots, changes the art: photograph, wonky pixels, the net, or **SIGN**, a sign for the place itself, read from a step away (a black band with what it is, the life and its season, what to do in two sentences, the number large, the photograph and a code back to it). **W.I.S.H. is one key here**: its four lines go on the receipt in place of the facts, so nothing is said twice (what was noticed; what would be great, as chips starting from the need; what to do; who can help); they travel with the record (`body.wish`), the chosen as tags. The receipt's ties are the sightings revealed and one case that worked elsewhere, and its data line. The printer (● ready, ○ queues), + for the studio's print shop, PRINT, sticky above the dock. Sent as `kind: 'record'`, `type: 'noticed'`, with the ESC/POS raster and the photograph, through approval; no signal, it waits on the device (`da.base.outbox`). → the reel.
  - **The reel**: every photograph story, this one first, with three marks: ↓ keep the receipt, ⤴ pass on a link (`/#n=DA-XXXX`), ⎙ print at a partner place; ⋯ for GIVE (Wildlife Victoria) and JOIN (the studio's groups); ▶ on a call. Its tags and data are triggers: one pressed opens the guide on it, with every story, life and case it brings in.
- **GUIDE** (`#guide`; `#search` and `#now` land here): an index in columns, as a parts catalogue keeps one: Now, Needs, Call, In season, Lives (every kind, opening to its lives with their year as a row of marks), What worked elsewhere (the case studies by theme). One field searches it all. A life: status, where, what to watch for, heat, its year as a data sheet (seen and young, month by month, this month boxed), the alert if there is one, its advice, related lives and a case, and the camera. A need: what to do, the number, the lives most at stake now, what worked elsewhere.
- **MAP** is a key: the ground in greys and every knot, one's own and everyone's approved, with the sightings each revealed hanging from it. A touch on open ground places a noticing there without a photograph; + (top right) adds many at once: photographs (each where it was taken, or near the middle), calls (sound files, played from the reel) and icons (an SVG, or a file named icon or sticker, drawn as the knot).
- **The engine** (`read`, `guess`, `related`, `caseOf`) is never on screen. It reads the line and the tags against the field list and gives three lines at most, one number, and three connections at most: lives of the same kind breeding or in the same need now, and one case that worked elsewhere, when it fits well (`DA_BRIEFS`). It stays narrow on purpose: "affected by El Niño" says nothing.
- **The net** replaces the radar's figures in the base and is drawn as a Marshall Islands stick chart (`chart`, `chartSVG`, `chartCanvas`): a frame of bamboo sticks that run on past their joins, lashed where they cross; a straight stick for each connection, overshooting its knots; beads strung in clusters where sticks meet (dark by day, pale as shells by night); one long swell bent across once there are three knots; every stick's shadow on the wall. The newest knot hangs a dotted thread, as on the bark painting. The same drawing is the receipt's NET art (black only) and RADIO's SAVE AS ART.
- **RADIO**, **W.I.S.H.** and **SHOP**: see round three above. Ties are kept as `da.base.ties`; packs (TERRAIN, FIELD DATA, ↓ one's noticings as a file to share, + another's in) live under SHOP.
- **Old phones**: no `?.`, `??` or lookbehind (a check reads the source); panning needs pointer events (iOS 13 and later).
- **The pixel board** (`#pixel`, or paste a picture anywhere): wonky pixels in 24, 40 or 64 cells, in one bit, greys or colour; up to three pictures animate as a sprite, one picture as three wonky takes of itself; ↓ saves; ⎙ prints.
- Links: `#radio`, `#pixel`, `#guide`, `#search`, `#now`, `#n=DA-XXXX` are the base's; any other link goes on to `/studio` with its hash, so every code the studio printed still opens. Stored: `da.base.notes` (the last 40, small photographs), `da.base.outbox`, `da.base.printer`, `da.base.packs`, `da.base.theme`.

### The CONNECTION receipt

The third slip style (`prefs.slip = 'conn'`, `connText()`, `connCanvas()`, and `escpos(s, paper, tty, conn)`): CONNECTION and the code; the SIGNAL (the life and its threat); the PLACE; what it is TIED to (the first caring relation); a group to JOIN, already caring for ground near it, with when it meets and its address (from `DA_TRIBES`, else a tied place with a site of its own); and the NEXT step (the W.I.S.H.'s last line, "here is how it works"). Then the QR code. Every line comes from the slip or the listed groups and places; nothing is made up to fill it. On screen it shows exactly the words that print.

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
├── docs/devices.md        click by click: the T-Display-S3 touch screen and the T-Beam Supreme radio
├── src/base/              the base at / (v0.1): index.html, base.css, base.js; build.mjs adds base-db.json
├── src/body.html          the studio at /studio (studio.html)
├── build.mjs              npm run build → dist/, stamped with its commit (and its branch on a preview); app, style, marks and QR minified
├── wrangler.jsonc         the Worker `front`: dist/ as static assets, src/worker for everything else, two D1 databases
├── src/touch/             the touch screen's Arduino sketch (not part of the site's build)
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
│   ├── briefs.js          window.DA_BRIEFS: 53 design briefs with sources
│   ├── examples.js        one example story, the orangutan, marked EX: the blank slate
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
│       ├── 66-packs.js    cell packs: .md, .csv or .json read on the device, previewed, sent for approval, drawn once shown (docs/cell-packs.md)
│       ├── 68-tracks.js   STATIONS on NOW (tracks in the code): the lives, the places, each approved pack of cells; each seen on the map or not (seeTrack, prefs.trk) and played or not (snd.knot)
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
| `da.prefs`, `da.me`, `da.five.v1`, `da.hide.v1` | Settings (`t4`: the layers on, every one by default, `t4v` 2 once switched on for an earlier visit; `lm`: each layer's mood; `printers`: show the partners' printers; `slip`: `'tty'` for the terminal style; `trk`: each track seen on the map or not; `night`: night chosen, else the device's; `mute`: nature muted; `start2`, once a first visit has started at the print location or the visitor's place, and `scan`, the radar since), the user's name and device id, the swapped five, and hidden cells |
| `da.shared.v1`, `da.sent.v1`, `da.outbox.v1`, `da.partners.v1` | The board as last fetched; what this device sent and how far it got; what waits for a signal; the printers as last heard |

### What the server stores (D1)

| Table | Contents | Kept |
|---|---|---|
| `stories` | A story (its packed signal), a record (JSON, never its contact) or a pack of cells (`kind` `cells`: JSON, at most 200, in greater Melbourne), its photograph re-encoded on the device, where it is, the partner it was sent to (`mesh` for the local mesh), waiting, shown or refused | Shown: until deleted on the approval page. Waiting or refused: 30 days |
| `jobs` | A print for a partner's printer: its ESC/POS bytes and mesh line, held, queued, printing, printed, failed or expired. Sent to the local mesh: one job with the mesh line alone for each paired printer whose radio is on | Waiting: a day. Printed: its status only, a week |
| `printers` | Each partner place's printer: its paper, whether it prints without approval, whether it has a mesh radio, a hash of its token, when it last asked | Until unpaired |
| `settings` | The site's own settings, for everyone: `lifeLock` (the nature station stays on the map unless unlocked), `exampleEdit` (BOARD 00 open to rewriting), `template` (the first board's words, up to 6,000 characters; empty, `TEMPLATE` in `config.js` stands). `GET /api/settings`; changed on the approval page | Until changed |
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

### The mesh signal

A piece also travels as one line of 200 bytes at most, for Meshtastic and for typing by hand: `ng:` then ten fields joined by `~`:

`<lat36>,<lng36>~<day36>~<life>~<marks>~<intention>~<line 1>~<line 2>~<line 3>~<line 4>~<code>`

- The place is in base 36, to four decimals; the day counts from 1 January 2026, in base 36; the life is its id in the field list.
- The marks are one letter each: `a`–`f` the six stamps, `g`–`r` the drawn marks (`MARK_ORDER`), `w` white paper, `n` El Niño.
- When it is too long, the longest of the five texts loses its last word, again and again, until it fits. Keep this format backwards compatible too.

## How to run

```sh
npm ci
npm run build                     # writes dist/
npm run dev                       # builds, then serves dist/ and the Worker at http://localhost:8787
npm test                          # builds, then runs every check (about 12 minutes in software WebGL)
ONLY=strings npm run test:one     # one group
```

On a new machine, install Playwright's Chromium once with `npx playwright install chromium`. `npm run test:api` runs the Worker's checks alone (Python runs `pull.py` against it where it is installed). The browser test groups are `smoke`, `portfolio`, `fronts`, `first`, `journey`, `radar`, `strings`, `places`, `wish`, `outputs`, `board`, `share`, `place`, `lost`, `hide`, `phone`, `hot`, `offline`, `field`, `events`, `guide` and `static`. Two more groups only run when named: `dbg` runs a script file inside the page, and `look` takes screenshots. Screenshots are written to `test/shots/`. In the browser console, `window.__da` exposes the app's state and functions for debugging.

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
- **Two typefaces for the interface.** Use Poppins and IBM Plex Mono (VT323 for readouts). Numbers, codes, coordinates and labels are set in mono. The four faces of the press (Playfair Display, UnifrakturMaguntia, Sedgwick Ave Display, Rubik Bubbles) are for what is made on the strip, never the interface.
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
9. **Releases must bump the service worker cache.** The shell is network-first, but offline users keep the old shell until the cache name changes. It is `da-v97` now. The service worker never keeps `/api/` or `/admin`.
16. **The approval page is a single password.** Anyone with `ADMIN_KEY` can show, refuse and pair printers. Keep it long and in a password manager; failed tries are slowed after ten in ten minutes.
17. **Mesh text is sent by the receiver's radio only.** A slip sent to the board alone, or to a place with no radio, does not go out by mesh.
10. **Leftovers are gone.** The repo now holds the source, and Cloudflare builds `dist/` from it, so `demo.js`, unused fonts and the GitHub Pages `CNAME` are no longer deployed. The icons in `repo-static/` carry no embedded metadata.
11. **Accessibility is limited.** Knots exist only on the canvas. Keyboard users reach them through the IN REACH list on the card, and only Esc and Delete have keyboard equivalents for the mouse grammar.
12. **Touch and sound are untested on real devices.** The iPhone haptic (a hidden switch flipped for patterns) and the 16 px field that keeps an iPhone from zooming in on typing were written to Safari's documented behaviour and have not been tried on a phone. Long-press and hold-to-place have only been tested with headless touch emulation, and iOS Safari's long-press callout may interfere. Web Audio has not been tested with iOS's silent switch.
13. **Tests cover mocks only.** The tests take about 12 minutes in software WebGL. Every outside host is mocked, so there are no contract tests against the live services.
14. **The linter warns about six unused constants:** `CONTACTS`, `suburbOf`, `isNight`, `NEED_ST`, `panel` and `TAG_WORDS`.
15. **Eleven listed places are placed by street address.** They are marked `a: 1` and could be a few doors out.
18. **The site goes out minified.** An error from the live site names minified functions; build with `DA_NOMIN=1 npm run build` (or `wrangler dev` after it) to read the same code with its names and comments. If esbuild is ever missing from `node_modules`, the build ships the plain files and says nothing.

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

*Built on 29 October as `/api/inat/…`, `/api/osm` and `/api/img` (see the stage 4 entry above); the plan as first written follows. Still to do from it: D1 tables for sightings, events and signals, and the Durable Object.*

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
