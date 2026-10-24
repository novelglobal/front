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

## Round two: what was missing, and what changed

These were missing or broken in the first cut, and are now in place:

- **The links into the studio.** W.I.S.H., SHOP and RADAR land on their own pages, and never on the studio's first visit.
- **The studio is plain.** It no longer has the jellyfish, screws, ties, antennas, cables, plates, grilles, lights or idle prompts. The rail is in words, and the print shop keeps seven of its fifteen tools. Settings › DEVICES brings the hardware back.
- **The opening shows the ground**, quiet under the question.
- **The location is asked for.** ◎ lights when the place is known.
- **Data travels with each noticing:** the suburb, the nearest water or place, the canopy, today's heat and Niño 3.4.
- **The placed moment.** A few real sightings nearby, of the same life and its closest relatives, are revealed and tied to the noticing. There are three at most.
- **SIGN** is a public notice for the place, made where something was noticed. This is what the field had none of.
- **W.I.S.H. replaces the facts** on the receipt, so nothing is said twice.
- **RADIO** has three new parts:
  - **SETS:** collections by life, by need and by place.
  - **A note for each knot** as the net plays.
  - **Ties:** links you make yourself, which become part of the art.
- **Packs.** Your own noticings can be saved as a file and shared, and someone else's pack can be added.
- **Tags act as triggers** into the guide.

## Round four: wordless

The owner's limit for this round was to guide someone through without words. The only words left are novel.global and what is urgent. The test was whether a stranger at the showcase could get from the eye to a printed poem and a song without being told how.

**The reasoning**

- **Words were doing the work that form should do.** Every label was a promise the screen then had to keep. A glyph drawn from the same sticks and beads as the art makes the keys part of the art. Words stay only where getting it wrong costs a life: the alert and the number.
- **One small screen holds every other word.** The OLED line at the foot is an unhoused module: one line that changes, and the guide behind it when pressed. It is small enough to ignore, and the urgent line is always there.
- **The eye replaces the camera.** The reference art looks back at you: the stick chart's lashings and the bark painting's dotted threads. The first thing on the page is an act of looking, not a button.
- **Bare bones, not wellness.** Dark by default, one monospace, no soft gradients, no rounded cards. Colour is kept for three things: the stick (what holds), red (urgent) and green (done).

**What changed, stage by stage**

1. **The eye.** A photograph always reaches the next screen. It goes on even without its picture, and the iris turns while it reads.
2. **The noticing.** A line, who it may be (minimised), the alert when there is one, and →. Tags that meant nothing are gone.
3. **Placed.** The knot falls and its neighbours are revealed, as before.
4. **The design stage.** Four art dots and the W.I.S.H. key.
   - The poem prints with no letters.
   - Status is three pips: sent, seen, printed. "Held for a yes" is gone.
   - What was sent shows at once, with or without a printer.
5. **W.I.S.H.** A ranked thread of strategies. The hero is a poster.
   - Replies are written in four lines, each with a minimised list that fits that poster's tags.
   - This is where a noticing becomes a plan others build on, so it replaces a share step.
6. **RADIO.** A 4-track you play into: notes are placed like tape, then tweaked with a double tap, then kept or downloaded.
   - The voices are gamelan, jegog, chant, kecak and taiko, in pelog or slendro: the Akira soundtrack's palette (Geinoh Yamashirogumi).
   - Tying is gone. It asked for a decision no one had a reason to make.
7. **The map.** Filled with shared stories and live sightings. Every mark explains itself on hover, and nothing leaves the window: a small card opens in place.
8. **The guide.** Every group is minimised first except Now. "Needs" is now *If you find*, and "Lives" is now *Neighbours*.

**Sense check.** Each thing left on screen either does something or says something urgent. A thing that did neither was cut: tying, the reel, the share step, the step letters and the chips.
