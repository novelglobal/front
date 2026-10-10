# Direct Action

A radar over Brunswick to the Melbourne CBD for the El Niño summer of 2026–27. It shows live iNaturalist sightings and the El Niño threat to each life. Open a life and its radius shows the human ecology around it: shops, brands, the circular economy, artists, third spaces and networks. Tie string figures between them, listen to them, and issue a four-line W.I.S.H. slip.

By [novel.global](https://novel.global). MIT licence. Made on Wurundjeri Woi-wurrung Country.

## Use

- **Radar:** a first visit starts at 500 m, close in, where you are if your browser says and you are near, else at the print location. Click anywhere to glide it there, drag the centre to move it and the rim to resize it; a wider rim shows all it holds at once. It is a disc of glass over the ground, with a record's fine grooves and a clay label at its centre. The first touch anywhere wakes its sound. Tap the centre to play every figure as a song. Outside the radar, only what is from the last 24 hours shows, and the twenty example stories. Marks are small and many; close in, or under the pointer, each grows into its photograph, and as they age they fade to small ghosts. Only holding the left button down (or pressing and holding on a phone) on open ground adds a record; SHARE it from its card.
- **A life:** click or right-click it to open its radius. Click a knot to hear it and see the string it would make. Click it again, right-click it, or hold it on a phone to join it. Right-click a joined knot to let it go. Right-click open ground to back out to the radar.
- **Harm it:** the card counts the places in the radius that sell or leave what harms this life, such as takeaway containers, plastic bottles, paint or pesticides. An orange thread runs to each one, and a string joined to one runs orange too. Click a row to light those places, and click it again to join them all.
- **NOW:** DIRECT ACTION RADIO, a countdown to extreme heat, the months in their danger with the kind of life each puts most at risk under it, and the five in greatest need.
- **Stations** (on NOW): collections of the map, each seen on it or not, and played or not. Nature (always on the map unless unlocked on the approval page, on air from the first touch, and mutable), the human ecology of brands, businesses, third spaces and groups (not at first), and each pack of cells people add. Each plays a beat built from what is inside the radar.
- **Night:** follows the device, or NIGHT in Settings. Slips stay paper.
- **Constellations:** every figure is kept and named, and NOW lists them as they form. Play one, trace how it formed, or open it to see the whole web.
- **Sounds:** each life plays a few notes on its own instrument, such as a whistle for birds or a kalimba for frogs. Each part of the human ecology makes a small real sound, such as a cup for services or a pencil for artists.
- **NOTICED** turns the card over to the W.I.S.H. card. Change the photograph, rewrite the statement, fill up to four lines of 48 characters, and tick the relations to print. **RESPONSE** issues the W.I.S.H., a praxis poem of responsibility, with its figure above the relations it numbers. **DIRECT ACTION** makes it a pledge: printed as a receipt at a partner place such as Pickles Milk Bar, sent by mesh where that place has a radio, and kept on novel.global.
- **Outputs:** a 58 mm print from the browser, ESC/POS bytes for 58 or 80 mm paper, a 1-bit PNG, a Game Boy PNG, a mesh message (200 bytes), a pager line (80 characters) and a link. Each machine links to what it is. **>**, beside PIN, sets every slip and print as the terminal instead: the life's photograph as its hero, then its code, name and lines, in VT323.
- **DIRECT ACTION** sends to a partner's printer (each shows NOT YET ONLINE until it is switched online on the approval page or its Pi is listening; Settings → PRINTERS hides them), to the local mesh nodes, or to the board.
- **STORIES:** the signals board, for everyone. RECEIVE takes the code printed on a slip, a link, or a mesh message. CELLS takes a pack of fruit trees, mesh nodes, water or shade (`docs/cell-packs.md`).

What you make stays on your device until you send it. Anything sent is shown, and printed, only once it is approved. A shared record never carries its contact, and a place someone marked themselves goes out to about 100 m. It works offline once loaded, and sends what is waiting when there is a signal.

## Places

`places.js` lists real places in Brunswick and the inner north by name, with their address, their site and what they do. Places from OpenStreetMap fill in the rest. A place is counted by its kind of trade, not judged on its own. Positions marked `a: 1` are approximate, to the street address. Listing a place does not mean it endorses this project.

## Build and publish

Run `npm ci` and then `npm run build`, which writes the site to `dist/`. The site deploys as a Cloudflare Worker that serves `dist/` and runs the shared board and the print queues on D1. `receiver/` sets up a printer at a partner place. Put the site's address in `PORTAL_URL` in `src/config.js` so that printed codes link back to it. `HANDOVER.md` explains the source, the tests and the plan.

Settings live in `src/config.js`: `SCAN` for the radar, `SIGNAL` for the limits, `ROLES` and `PRESSURES` for what harms each kind of life, and `EVENTS_URL` for a published CSV of gatherings. `examples.js` holds twenty example stories, marked EX, each with its mode, scale and sources.

## Sources

The Bureau of Meteorology, the WMO and Agriculture Victoria; the Merri-bek, Yarra and City of Melbourne urban forest strategies; the Victorian response plan for heat stress in flying-foxes; Harvest Without Harm; the Merri Creek Management Committee's litter report; and the source linked from each brief. Sightings and photographs come from iNaturalist, printed only where their licence allows a black and white version. Places come from their own sites and from © OpenStreetMap contributors, imagery from Esri, terrain from AWS Terrain Tiles, and weather from Open-Meteo.
