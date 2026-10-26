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

## The booth: the printer as the way in

A printer in a shop or a public place prints anyone's photograph for free. That free print is the marketing.

- The QR sticker or the PRINT FREE poster beside the printer opens a page with two keys: take a photograph, or upload one.
- After that come stickers, words and the print. There are no menus, links or sign-ups.
- The receipt carries a small code that opens the site. A photograph people keep becomes the door they keep.
- After printing there are only two ways on: novel.global, or another photograph. Another photograph comes only after an unseen wait of two to five minutes, so the printer stays a free service and not a toy.
- The photograph is prepared for the paper, not the screen. Thermal dots spread, so it is lifted, sharpened, and dithered by a method made for receipt printers.

## Round five: the web of noticing

The net was drawn all at once, a frame of sticks around whatever was on screen. It looked like the reference art but meant nothing. Now it is built by looking.

- **Nothing is tied until someone opens it.** Each cell opened is kept, and the web grows from those cells, so the art is a record of attention.
- **Every mark has one reason, and says it when pointed at:**
  - a trail stick: the order things were opened;
  - a kin stick: the same life, found again;
  - a kind stick: the nearest of the same kind;
  - a lashing: three or more ties meeting, a story gathering;
  - a jellyfish: three or more of one life attended;
  - a swell: a collection added;
  - a near tie: what is near one's own noticing now.
- **Colour is information.** Each cell takes the earth tone of its kind: ochre birds, terracotta parrots, moss frogs, umber owls.
- **Sound is only what is there.** The 4-track plays cells and nothing else. A song is a walk through what was noticed.
- **A collection has a shape.** Each set is drawn as its cells joined in the order seen, so two sets are never the same. Sets add up rather than replace each other, and the print is shown before it is made.
- **The studio is for class; the base is the showcase.** They no longer point at each other.

## The start: a planet on blueprint paper

The first thing seen is not an interface but a drawing: blueprint paper and three rings turning as one small planet. It is drawn by hand, with no words on it.

- **Blueprint** is the colour of a plan before anything is built. The site is a plan for noticing, and each visitor builds on it.
- **The rings** are three paths around the same world:
  - RADIO, the signal, listens;
  - W.I.S.H., the irukandji, the smallest and most easily missed of lives, gathers;
  - PRINT, the receipt, makes it real on paper.
- **Each page is a dot on a line in motion.** You go in by catching one, which is the act the whole site asks for: noticing something passing.

## The composer: what was made goes to paper

Every round so far made things: a path through the cells, a web, a song, posters, icons. Until now they stayed where they were made. PRINT now gathers them.

- **The 80 mm strip is the one canvas.** Posters, the web's art, a song drawn as a score, icons and words are laid as blocks on the printer's own width. What you see is what prints, so there is no layout to learn. Each block can be moved, sized, removed or undone.
- **The showcase is where a strip ends up.** It shows pieces on blueprint paper beside the art of the journey that made them, the same paper the start is drawn on.
- **W.I.S.H. no longer needs a photograph.** A wish can be made from the life alone, and a thread shows what it touches as a tree: the lives near, its song, its place in the web, the research and the replies. Its data shows only when asked for. The stock lines that read like a template were cut. Every line now comes from the life and its issue.
- **The sound was the weakest part, so it was rebuilt rather than tuned.** The voices were close and dry, so a click sounded like a click. They now play in one room, built from Freeverb's hall, a slow chorus and Tuna's delay. The bells beat in pairs, as gamelan is tuned, and the choir swells. The tempo slows to 80.
- **Paper is the measure of an image.** Every photograph printed is levelled, sharpened and dithered for thermal dots by the same steps.

## The aura: the showcase begins as a seed

The base works, but it works like an app: pages, a bar, a map. A portfolio piece has to be a single gesture. So `/` is now one sheet of blueprint paper, and nothing leaves it.

- **A seed, then a bang.** A browser will not play sound before a touch, so the first touch is made the event. The light bursts, the globe springs out, and the drone begins, softer than before (70%). The sound starts because you started it.
- **The globe becomes the creature.** The three rings are not swapped for a menu. They are redrawn as an irukandji, the smallest and most easily missed of lives. The thing you navigate with is the thing the site is about.
- **Four tentacles, four steps.** Notice, W.I.S.H., art, print are the tentacles' tips, in order, so the way through is the animal's body. The deeper views (map, species, data, El Niño) are what it has caught on the way down: there when wanted, never in the way. That is the 80% cut: the flow is four touches, and depth is one touch to the side.
- **Colour for the wall, one bit for the paper.** The thermal printer prints in black dots; the portfolio keeps the same piece in colour, whole and zoomable. The receipt is the act; the poster is the record.
- **The base stays whole underneath** (`/?base`), for class and for anyone who needs the full tools.

## The myth: the eye that weeps four tentacles

The irukandji is almost invisible and does its harm out of all proportion to its size. That is what noticing is: small attention with large consequences. So the creature is not a mascot but the interface itself.

- **The bell is the eye.** It is where noticing happens, so it is where the photograph is taken. What it has seen stays in its pupil. Before anything is seen, it breathes.
- **Its four tears are the tentacles.** They are the four steps: noticing, wishing, making, printing. The eye looks down the one that is open, and a light runs down the next when there is something to take on.
- **What it holds, it caught.** The map, the life, the readings and El Niño are prey, not menus. Nothing is shown until it is caught, and no life is offered. The engine reads underneath, but a name only appears if you said it, found it or chose it. Attention is the user's, never the system's.
- **The print is the sting:** one press, a light down all four, and the poster goes to the wall.
