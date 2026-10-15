# Direct Action Radio

A sonic radar over Brunswick to the Melbourne CBD for the El Niño summer of 2026–28. It shows live iNaturalist sightings, the El Niño threat, and the human ecology around it: shops, brands, the circular economy, artists, third spaces and networks. Make string figures between them, listen, notice and print out a four-line W.I.S.H. praxis poem  or brief receipt.

By [novel.global](https://novel.global). MIT licence. Made on Wurundjeri Woi-wurrung Country.

## Places

`places.js` lists real places in Brunswick and the inner north by name, with their address, their site and what they do. Listing a place does not mean it endorses this project.

## Build and publish

Run `npm ci` and then `npm run build`, which writes the site to `dist/`. The site deploys as a Cloudflare Worker that serves `dist/` and runs the shared board and the print queues on D1. `receiver/` sets up a printer at a partner place. Put the site's address in `PORTAL_URL` in `src/config.js` so that printed codes link back to it. `HANDOVER.md` explains the source, the tests and the plan.

Settings live in `src/config.js`: `SCAN` for the radar, `SIGNAL` for the limits, `ROLES` and `PRESSURES` for what harms each kind of life, and `EVENTS_URL` for a published CSV of gatherings. `examples.js` holds one example story, the orangutan, marked EX: the blank slate.

## Sources

The Bureau of Meteorology, the WMO and Agriculture Victoria; the Merri-bek, Yarra and City of Melbourne urban forest strategies; the Victorian response plan for heat stress in flying-foxes; Harvest Without Harm; the Merri Creek Management Committee's litter report; and the source linked from each brief. Sightings and photographs come from iNaturalist, only where their licence allows a black and white version. Places come from their own sites and from © OpenStreetMap contributors, imagery from Esri, terrain from AWS Terrain Tiles, and weather from Open-Meteo.
