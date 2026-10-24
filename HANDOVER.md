# novel.global — developer handover

The site is novel.global: its label, name, headline and address. Its first work is a web app (once called Direct Action, then DIRECT ACTION RADIO) for the El Niño summer of 2026–27, covering Brunswick to the Melbourne CBD. It shows live iNaturalist sightings on a radar over satellite imagery, with the El Niño threat to each life. When someone opens a life, its radius shows the human ecology around it: shops, brands, the circular economy, artists, third spaces and networks. People join string figures between the life and those places, listen to them, and write a W.I.S.H.

W.I.S.H. is the concept: a praxis poem. **NOTICED** is the intention to respond. **RESPONSE** is the W.I.S.H. itself: taking on responsibility, joining theory to action, and reflecting. **DIRECT ACTION** makes it a pledge, printed as a receipt at a partner place, sent by mesh where that place has a radio, and kept on novel.global. The name W.I.S.H. and its four lines stay as they are.

The app works offline in the browser. Stages 1 to 3 of `docs/roadmap.md` are built: the map fixes, stories shared with approval, and print queues pulled by a Raspberry Pi at each partner place. Next comes live data behind the Worker (stage 4).

**From v0.1 (24 October 2026) the site has two builds.** The **base** opens at `/`: a light page with one question, "What have you noticed?", a camera, and W.I.S.H. as the way through a noticing (below, "The base, v0.1"). The **studio** is everything built through the pilot, now at `/studio`, and every link the studio ever printed still opens there.

Read this file first. Then read `README.md`, which is what users see, and `docs/brief.md`, which explains the product decisions and their sources.

## Status at a glance

| Area | State |
|---|---|
| The base, `/` (v0.1 alpha) | `src/base/`: the photograph, a line, a real alert, the receipt with W.I.S.H. as one key, the reel; GUIDE; MAP with batch adding; RADIO as net, reel and help; the pixel board. About 60 KB to first paint, no map library or webfonts. Checks: `ONLY=base node test/run.mjs` |
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

- **Home**: paper, no map. "What have you noticed?", the camera, and RADIO, W.I.S.H. and SHOP in words (W.I.S.H. and SHOP open the studio's W.I.S.H. and PRINT). At the top, MAP, GUIDE and ◐ (light and dark, `da.base.theme`). One line at the foot, NOW: fledglings on the ground, swooping, El Niño's window, snakes, heat, then what is in season, read from each life's own event; pressed, it opens the guide. Lines arrive through the old phone network's signs (`glitch`); 2600 in the guide plays the tone that once opened a trunk line. Words are in the device's sans, data in its monospace.
- **No copy of the brief on screen, no steps shown.** A noticing is three screens and one key each:
  - **The photograph** with where and when: its own GPS and time (`exif`, a small JPEG reader), else the phone's location, else where the map is (the line blinks; a tap on the map moves it). A `>` line for what is happening. Chips: the life it may be (two others offered), the need it names, and the tags chosen before (what one notices grows what one can say). An alert only when there is a real one: what to do (`ISSUES`), the life's own advice, its season now with El Niño only when this life is in this month's window, and the number to call. → places it on the net.
  - **The design stage**: the receipt as it will print, its photograph the top half; a touch on it changes the art (photograph, wonky pixels, the net; three dots show which). **W.I.S.H. is one key here**: it writes the four lines onto the receipt from what the engine knows (what was noticed; what would be great, as chips starting from the need; what to do; who can help), and they travel with the record (`body.wish`, the chosen as tags). The printer (● ready, ○ queues), + for the studio's print shop, PRINT. Sent as `kind: 'record'`, `type: 'noticed'`, with the ESC/POS raster and the photograph, through approval; no signal, it waits on the device (`da.base.outbox`). → the reel.
  - **The reel**: every photograph story, this one first, with three marks: ↓ keep the receipt, ⤴ pass on a link (`/#n=DA-XXXX`), ⎙ print at a partner place; ⋯ for GIVE (Wildlife Victoria) and JOIN (the studio's groups); ▶ on a call.
- **GUIDE** (`#guide`; `#search` and `#now` land here): an index in columns, as a parts catalogue keeps one: Now, Needs, Call, In season, Lives (every kind, opening to its lives with their year as a row of marks), What worked elsewhere (the case studies by theme). One field searches it all. A life: status, where, what to watch for, heat, its year as a data sheet (seen and young, month by month, this month boxed), the alert if there is one, its advice, related lives and a case, and the camera. A need: what to do, the number, the lives most at stake now, what worked elsewhere.
- **MAP** is a key: the ground in greys and every knot (one's own and everyone's approved). A touch on open ground places a noticing there without a photograph; + adds many at once: photographs (each where it was taken, or near the middle), calls (sound files, played from the reel) and icons (an SVG, or a file named icon or sticker, drawn as the knot).
- **The engine** (`read`, `guess`, `related`, `caseOf`) is never on screen. It reads the line and the tags against the field list and gives three lines at most, one number, and three connections at most: lives of the same kind breeding or in the same need now, and one case that worked elsewhere, when it fits well (`DA_BRIEFS`). It stays narrow on purpose: "affected by El Niño" says nothing.
- **The net** replaces the radar's figures in the base: each noticing is a knot with a dotted thread hanging under it (as on a bark painting), tied to what it connects to by a curved stick (as on a Marshall Islands stick chart), drawn in as it is made.
- **RADIO** (`#radio`): NET (every noticing as knots, tied where they share a life or a need; PLAY ties them in the order they were made; SAVE AS ART), REEL, HELP (the alerts, every number, every report link, the packs) and RADAR ↗, the studio's radio.
- **Old phones**: no `?.`, `??` or lookbehind (a check reads the source); panning needs pointer events (iOS 13 and later).
- **The pixel board** (`#pixel`, or paste a picture anywhere): wonky pixels in 24, 40 or 64 cells, in one bit, greys or colour; up to three pictures animate as a sprite; SAVE PNG; PRINT IT.
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
├── src/base/              the base at / (v0.1): index.html, base.css, base.js; build.mjs adds base-db.json
├── src/body.html          the studio at /studio (studio.html)
├── build.mjs              npm run build → dist/, stamped with its commit (and its branch on a preview); app, style, marks and QR minified
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
9. **Releases must bump the service worker cache.** The shell is network-first, but offline users keep the old shell until the cache name changes. It is `da-v74` now. The service worker never keeps `/api/` or `/admin`.
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
