# Direct Action — working brief

By novel.global · Brunswick to the Melbourne CBD · Wurundjeri Woi-wurrung Country · v10.1, 9 October 2026

Direct Action is a radar for the El Niño summer of 2026–27. It shows live iNaturalist sightings and the El Niño threat to each life. A person opens a life and its radius shows the human ecology around it: shops, brands, the circular economy, artists, third spaces and networks. They join string figures between the life and those places, listen to them, and write a four-line W.I.S.H. slip that prints as an archival record, half photograph and half text.

## The upstream problem

People are not short of care. They are short of a prompt they cannot ignore, and of a way to see who around a life shares responsibility for it. The ledger makes that plain: a frog's radius might hold fifteen places that sell takeaway containers, three that sell paint and one that sells pesticides, each joined to it by a thin orange thread. The constellation turns that responsibility into something people want to build, play and print.

## How it works now

- **The radar.** The map opens bare, with a radar and two tabs. A slow hand sweeps the circle and each life it passes stays. Holding the left button on open ground (or pressing and holding on a phone) adds a record.
- **A life.** A click or a right-click opens its radius. The card shows the photograph, the name, short chips, the threat, one thing to learn, the months it is seen here, the ledger and the strings.
- **The human ecology.** 54 real places in Brunswick and the inner north are listed by name in `places.js`, each with its address, its site and what it does: repair and reuse, refill and markets, local labels, artists and studios, third spaces, and networks such as 3RRR, 3CR, PBS and the Sydney Road Brunswick Association. OpenStreetMap fills in the rest, tile by tile; a failed answer is never kept, and the listed places stand offline.
- **The ledger.** The card counts, in plain words, who in the radius sells or leaves what harms this life ("15 sell takeaway containers", "1 sells pesticides") and who can help ("10 repair, reuse or refill"). One click on a row lights those places on the ground; a second click joins them all to the life.
- **The hand.** A click on a knot looks at it, and plays its sound: a small card with its name and what it does that matters here. There are no buttons, notes or labels on it. A second click, a right-click, or a long press on a phone joins it. A right-click on a joined knot lets it go. The name opens the life, or the place's own site. A right-click on a life past the radius widens the radius and joins it. A right-click on open ground backs out of whatever is open, back to the radar, and cancels a record being placed. Delete removes a knot of your own. A string joined to a place that harms the life runs orange.
- **Sounds.** Each life plays a few slow notes on its own instrument: a whistle for birds, a kalimba for frogs, a music box for bees and butterflies, glass for bats and flying-foxes, wood for lizards and turtles. Each part of the human ecology makes a small real sound: a sleeve for brands, two taps for the circular economy, a cup for services, a pencil for artists, a hum for third spaces, two hums for networks and a breath for people.
- **Constellations.** Every figure is kept, named and listed on NOW as it forms, with its star chart, the counts of people and lives in it, and the figures it shares knots with. A figure can be played as a song, traced string by string in the order it formed, or opened to show the whole web.
- **NOTICED.** The first button turns the card over to the slip. The photograph appears in black and white and can be changed to another open-licensed photograph of the same life, the person's own, or none. The statement opens as two full sentences for that kind of life, and can be rewritten or set back. Four lines of up to 48 characters follow, then the numbered relations to tick and rename, then the note.
- **DIRECT ACTION.** The button issues the slip as a signal with a code. On paper it reads like an archive record: FIG. 1, the photograph dithered for a thermal head and as tall as everything under it; the life, the site and the window; the statement; the four lines; RELATIONS, grouped as HARM (in plain words, such as "sells pesticides"), CARE (repair, reuse, third spaces and the rest) and ALSO, numbered, with each listed place's site; FIG. 2, the constellation as it lies on the ground, north up, each point numbered to match the index and the strings to harm dashed; and a QR code.
- **Machines.** A 58 mm print, ESC/POS bytes with the photograph as raster lines, a 1-bit PNG for a pocket thermal printer, a Game Boy Printer PNG in four greys, a mesh message for a LoRa radio, a pager line and a link. Each is drawn as the machine itself and links to what it is.

## Tensions and the decisions they forced

| Tension | Decision |
|---|---|
| Responsibility vs blame | A place is counted by its kind of trade, never judged on its own, and the app never claims that a place or council endorses it. |
| Clarity vs clutter | The ledger counts in plain words; the peek card has no buttons; the mouse does the work. |
| Speed vs curation | A click looks and plays a knot; a second click or the right button joins it. |
| Real places vs offline | Listed places ship with the app; live places fill in and are never cached when the answer fails. |
| Method vs content | W.I.S.H. explains each line while writing and never appears on the print. |
| Photograph vs licence | Only photographs whose licence allows a black and white version are printed, credited in the caption. |

## Build

Plain files, built into `dist/` by `npm run build` and served by the Cloudflare Worker `front`: `index.html`, `style.css`, `app.js`, `config.js`, `places.js`, `briefs.js`, `examples.js`, `field.js`, `marks.js`, `field.html`, `guide.html`, `sw.js` (cache da-v11) and `vendor/`. MIT licensed, no accounts or trackers, offline after one visit. The code and text carry no names or authorship traces.

## Verified, and not yet

The site is checked in headless Chromium with every outside host mocked, on desktop and phone, including the right-click grammar, the long press, the ledger, constellations on NOW, the trace, the editable statement, the photograph controls, the archive layout, ESC/POS raster lines, the machine references, and places with OpenStreetMap unreachable. It has not yet been tested against the live services, on real thermal printers, or with a Meshtastic or pager device. During research, OpenStreetMap's Overpass service was refused by this workspace's network policy and Nominatim's robots.txt refused a lookup; neither was worked around, so positions marked `a: 1` in `places.js` come from the street address.

## Next

1. Work through `docs/roadmap.md`, one stage at a time, each checked on a preview before it goes live.
2. Print a slip on a 58 mm thermal printer and a Game Boy printer, and send one over a mesh radio.
3. Ask the listed places and the six groups whether they want to be shown, and how.
4. Ask Wurundjeri Woi-wurrung Cultural Heritage Aboriginal Corporation how they would want Country named and cared for here.

## Sources

- Bureau of Meteorology long-range forecast and El Niño update (September–October 2026); WMO; Agriculture Victoria.
- Merri Creek Management Committee litter report (2024); EPA Victoria on stormwater; the Conversation on rat poison and owls.
- Ziter et al., PNAS 2019, on canopy and daytime heat; Merri-bek, Yarra and City of Melbourne canopy data.
- Each listed place, brief and group links to its own source.
