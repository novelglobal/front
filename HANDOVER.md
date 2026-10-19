# novel.global — developer handover

The site is novel.global: its label, name, headline and address. Its first work is a web app (once called Direct Action, then DIRECT ACTION RADIO) for the El Niño summer of 2026–27, covering Brunswick to the Melbourne CBD. It shows live iNaturalist sightings on a radar over satellite imagery, with the El Niño threat to each life. When someone opens a life, its radius shows the human ecology around it: shops, brands, the circular economy, artists, third spaces and networks. People join string figures between the life and those places, listen to them, and write a W.I.S.H.

W.I.S.H. is the concept: a praxis poem. **NOTICED** is the intention to respond. **RESPONSE** is the W.I.S.H. itself: taking on responsibility, joining theory to action, and reflecting. **DIRECT ACTION** makes it a pledge, printed as a receipt at a partner place, sent by mesh where that place has a radio, and kept on novel.global. The name W.I.S.H. and its four lines stay as they are.

The app works offline in the browser. Stages 1 to 3 of `docs/roadmap.md` are built: the map fixes, stories shared with approval, and print queues pulled by a Raspberry Pi at each partner place. Next comes live data behind the Worker (stage 4).

Read this file first. Then read `README.md`, which is what users see, and `docs/brief.md`, which explains the product decisions and their sources.

## Status at a glance

| Area | State |
|---|---|
| Web app (map, cells, strings, ledger, constellations, slip in two styles, outputs, sharing, partners, the local mesh, cell packs) | Built and working, with browser and server checks (`npm test`) |
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
- **Alpha 0.3, one select key.**
  - SELECT (`69-pick.js`): one key on W.I.S.H. and PRINT, both faces, opens a sheet from the foot (a panel beside the device on a wider screen) with three tabs: what has been made here (the example, stories, posters, songs, cards, constellations, boards, codes, any link as a code), the stickers in their packs (and one's own), and the lives near and further out. Chosen, it goes onto the strip in PRINT, onto the board on W.I.S.H.'s studio side, and becomes the receipt's picture on its quick side. It replaces PRINT's animals, stickers and made-here drawers, its made-here rows, the board's and the strip's ADD menus, and the board's list of pieces; the photograph's looks keep their drawer.
  - RADIO's back: the equaliser on a small dark screen of its own; the plate reads DIRECT ACTION, RADIO small; the steps live on the countdown's screen, five seconds of the count then the step waiting, round again until the last is done, and pressed it goes there (`stepNow`, `stepAttr`). No hover names on the mood keys.
  - W.I.S.H.'s quick side: real actions to take up, each with its steps (`ACTIONS` in `42-faces.js`: a neighbour, the house, pets, wildlife, a street tree, shade, the state election of 28 November 2026), pressed to fill the receipt with them; the receipt larger, close up within its screen; the lives the heat puts most at risk (`needLives`: animals first, one insect at most, no plants), pressed to add to the intention, never replace it. Suggestions only when their key is on. On a phone the actions and the lives fold behind two small keys. A whip antenna and a pin header as its mods.
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
| `settings` | The site's own settings, for everyone: `lifeLock` (the nature station stays on the map unless unlocked). `GET /api/settings`; changed on the approval page | Until changed |
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

On a new machine, install Playwright's Chromium once with `npx playwright install chromium`. `npm run test:api` runs the Worker's checks alone (Python runs `pull.py` against it where it is installed). The browser test groups are `smoke`, `portfolio`, `first`, `radar`, `strings`, `places`, `wish`, `outputs`, `board`, `share`, `place`, `lost`, `hide`, `phone`, `hot`, `offline`, `field`, `events`, `guide` and `static`. Two more groups only run when named: `dbg` runs a script file inside the page, and `look` takes screenshots. Screenshots are written to `test/shots/`. In the browser console, `window.__da` exposes the app's state and functions for debugging.

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
9. **Releases must bump the service worker cache.** The shell is network-first, but offline users keep the old shell until the cache name changes. It is `da-v31` now. The service worker never keeps `/api/` or `/admin`.
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
