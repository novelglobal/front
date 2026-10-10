# Direct Action

A radar over Brunswick to the Melbourne CBD for the El Niño summer of 2026–27. It shows live iNaturalist sightings and the El Niño threat to each life. Open a life and its radius shows the human ecology around it: shops, brands, the circular economy, artists, third spaces and networks. Tie string figures between them, listen to them, and issue a four-line W.I.S.H. slip.

By [novel.global](https://novel.global). MIT licence. Made on Wurundjeri Woi-wurrung Country.

## Use

- **Radar:** drag the centre to move it and the rim to resize it. Tap the centre to play every figure as a song. Hold the left button (or press and hold on a phone) on open ground to add a record.
- **A life:** click or right-click it to open its radius. Click a knot to hear it and see the string it would make. Click it again, right-click it, or hold it on a phone to join it. Right-click a joined knot to let it go. Right-click open ground to back out to the radar.
- **Harm it:** the card counts the places in the radius that sell or leave what harms this life, such as takeaway containers, plastic bottles, paint or pesticides. An orange thread runs to each one, and a string joined to one runs orange too. Click a row to light those places, and click it again to join them all.
- **Constellations:** every figure is kept and named, and NOW lists them as they form. Play one, trace how it formed, or open it to see the whole web.
- **Sounds:** each life plays a few notes on its own instrument, such as a whistle for birds or a kalimba for frogs. Each part of the human ecology makes a small real sound, such as a cup for services or a pencil for artists.
- **NOTICED:** the card turns over to the slip. Change the photograph, rewrite the statement, fill four lines of up to 48 characters, and tick the relations to print. The print groups them into what harms the life and what cares for it, numbered to match the map of the figure. **DIRECT ACTION** issues it.
- **Outputs:** a 58 mm print with the photograph in black and white as half the slip, ESC/POS bytes, a 1-bit PNG, a Game Boy PNG, a mesh message (200 bytes), a pager line (80 characters) and a link. Each machine links to what it is.
- **STORIES:** see the signals, or paste one into RECEIVE.

Everything stays on the device, and it works offline once loaded.

## Places

`places.js` lists real places in Brunswick and the inner north by name, with their address, their site and what they do. Places from OpenStreetMap fill in the rest. A place is counted by its kind of trade, not judged on its own. Positions marked `a: 1` are approximate, to the street address. Listing a place does not mean it endorses this project.

## Build and publish

Run `npm ci` and then `npm run build`, which writes the site to `dist/`. The site deploys as a Cloudflare Worker that serves `dist/` as static assets, and it also works on any static host. Put the site's address in `PORTAL_URL` in `src/config.js` so that printed codes link back to it. `HANDOVER.md` explains the source, the tests and the plan.

Settings live in `src/config.js`: `SCAN` for the radar, `SIGNAL` for the limits, `ROLES` and `PRESSURES` for what harms each kind of life, and `EVENTS_URL` for a published CSV of gatherings. `examples.js` holds three example signals, marked EX.

## Sources

The Bureau of Meteorology, the WMO and Agriculture Victoria; the Merri-bek, Yarra and City of Melbourne urban forest strategies; the Victorian response plan for heat stress in flying-foxes; Harvest Without Harm; the Merri Creek Management Committee's litter report; and the source linked from each brief. Sightings and photographs come from iNaturalist, printed only where their licence allows a black and white version. Places come from their own sites and from © OpenStreetMap contributors, imagery from Esri, terrain from AWS Terrain Tiles, and weather from Open-Meteo.
