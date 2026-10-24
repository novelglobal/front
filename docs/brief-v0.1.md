# Brief v0.1 alpha: the base

24 October 2026. The pilot was tested in the field, and it failed twice where it mattered.

## What failed

- **A lorikeet fledgling in Carlton Gardens.** Nothing said that young birds are on the ground this month, what to do, or who to call. There was no quick search, no key fact, and no map context: nothing about El Niño, and nothing about what other communities have done.
- **Older phones.** The site broke on them. It loads a WebGL map, seven webfonts, device skins and the whole data set before anyone can do anything.

## What changes

Two builds.

- **The base** opens at `/`. It is for anyone, on any phone. It holds one question, a photograph, and the few facts that are true now. It is open and hackable: three plain files in `src/base/`.
- **The studio** is the pilot as built, at `/studio`. Its links and printed codes keep working: the base sends any hash it does not know on to the studio.

The base is as small as it can be.

- The words are cut to a question and the names of the steps.
- There are no icons except the camera.
- There are no device skins, no map library and no webfonts.
- The ground is shown without any marks.

Everything else comes as a pack, loaded only when it is used:

- **TERRAIN:** the imagery.
- **FIELD DATA:** the field list, the outlook and the case studies, as one file built from the studio's own data.
- **STUDIO:** the full build.

## The way through: three screens, no steps shown

The owner's words for W.I.S.H. are for the engine. They never appear on screen. There are no step letters and no headings, and each screen has one key forward.

1. **The photograph.** It shows where and when it was taken, a line for what is happening, and chips for what the engine reads: the life it may be, the need, and the tags chosen before.
   - **Only a real alert appears.** It says what to do, gives the season now, names El Niño only when it applies, and gives the number to call.
   - **"Affected by El Niño" says nothing.** On its own it names no life and no need, so no alert appears.
2. **The design stage.** The receipt itself, with the photograph as its top half.
   - A touch on the receipt changes the art.
   - **W.I.S.H. is one key here.** It writes the poem's four lines onto the receipt from what the engine knows, and the choices made become tags on the record.
   - Then the printer and PRINT.
3. **The reel.** Every photograph story, with three marks on each: keep, pass on, and print at a partner place. More options sit behind ⋯.

## The guide and the map

- **The guide is a companion, built like a parts catalogue's index.** It lists what is urgent now, the needs, every number, what is in season, every life by kind and what worked elsewhere. One field searches all of it.
  - Each life has a data sheet: its status, where it lives, what to watch for, how much heat it can take, and its year month by month.
- **The map is a key, not the page.** It shows the ground in greys with every knot.
  - A touch on the map places a noticing.
  - The + key adds many at once: photographs, calls and icons.

## The engine is never on screen

The engine reads the line and the tags against the field list. It returns:

- at most three lines;
- one number to call;
- at most three connections: lives of the same kind that are breeding now or in the same need, plus one case that worked elsewhere, when it fits well.

NOW, at the foot of the home page, comes from the same data. It covers:

- fledglings on the ground;
- birds swooping;
- El Niño's window this month;
- snakes;
- the lives hit hardest by heat;
- everything in season, read from each life's own event.

## RADIO

RADIO is the showcase and the emergency line. The radar is no longer the main feature: it is one key that opens the studio's radio. RADIO has three parts:

- **NET:** every noticing as a knot, tied to the others that share a life or a need. It can be played in the order the noticings were made, or saved as art.
- **REEL:** the photograph stories.
- **HELP:** the alerts, every phone number and every report link.

The pixel board turns any pasted or chosen picture into wonky pixels. Three pictures together become a sprite that moves.

## Look and feel

- **The screen** is a terminal on paper, in light and dark. It uses the device's own monospace, one line weight, dots for what is known and lines for what connects.
- **The phone network's old signs** (0–9, * and #) appear only while a line is arriving. There is one easter egg: 2600.
- **The net comes from the reference images.**
  - The knots are tied with curved sticks, as on a Marshall Islands stick chart.
  - A dotted thread hangs under each knot, as on the bark painting.
  - The knots and threads draw themselves in.
- **The direction is The Fall.** It shows what holds after instability, but never says so. Each noticing is a knot that stays, and the net builds up from them.

## Not yet

- **Animal sprites.** Each animal is meant to get three drawn images for its own sprite animation. Today the board animates any three pictures.
- **The studio's own RADIO.** The studio's RADIO is not yet changed to work as a showcase with the radar as a toggle.
- **Panning on very old iOS.** Older than iOS 13, a finger cannot pan the map, because there are no pointer events. Everything else works.
