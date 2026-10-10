# Direct Action — roadmap

Small stages. Each stage is built on the `staging` branch, checked on its preview address, and only then merged to `main`, which is what novel.global shows. One stage at a time; nothing skips the preview. `docs/workflow.md` explains the steps.

| Stage | What it delivers | Status |
|---|---|---|
| 0 | One repo, one deploy, a preview before live | Live |
| 1 | Fixes and clearer rules on the map | Built, on staging |
| 2 | Save and share, with your approval | Built, on staging |
| 3 | Print queue and the pager printer | Built, on staging; the printers at Pickles, Kines and Coffee Bar Elsie to set up |
| 3b | Final polish: DIRECT ACTION on NOW, twenty example stories, two slip styles, the local mesh, cell packs | Built, on staging |
| 4 | Live data through Cloudflare | New species and sightings since the last visit; photographs that always dither; no browser calling iNaturalist or OpenStreetMap directly |
| 5 | More places and people | More local brands, designers, businesses and new places, added without a code change |
| 6 | Gigs and gatherings | 3RRR and Resident Advisor gigs of the week as pins, alongside sightings |
| 7 | Climate and emergency, live | Heat, fire, air and emergency warnings that change the danger of each life near them |
| 8 | More receivers | Printers in cafés and shops, each printing what happens near it |

## Stage 0 — one repo, one deploy

The source lives in `front`, Cloudflare builds it, and every push to `staging` makes a preview.

- `front` holds the source (`src/`, `build.mjs`, `test/`), not the built site. Cloudflare runs `npm run build` and serves `dist/`.
- A push to `staging` builds a preview at its own address, with a PREVIEW tag in the corner and the build code in Settings. A merge to `main` updates novel.global.
- `/api/health` answers `ok`, which proves the Worker is ready for the stages that need a server.
- Hygiene: the leftover `demo.js` is gone, security headers are set, `PORTAL_URL` is `https://novel.global/`, and the service worker cache moves to `da-v11`. The word list that guards against names and authorship lives outside the repo, and the guard now checks every file a commit would carry.
- In the Cloudflare dashboard: the build command, previews on, Always Use HTTPS on. In GitHub: Pages off.
- **Done when:** the staging preview shows PREVIEW and its build code, `main` shows the same build code on novel.global, and `/api/health` returns `ok`.

## Stage 1 — fixes and clearer rules on the map

*Built: items 1 to 6, plus a first radar that starts where life is, the NOW page's photographs and outlook from orange to red to black, and a smaller STORIES page with the board first. Item 7 is still to do.*

1. **The orangutan poster and the constellation web open when selected.** Both are listed but do nothing when clicked.
2. **A wider radar shows at once.** Dragging the rim outward reveals everything inside the new reach straight away, without waiting for the hand to sweep it.
3. **One rule outside the radar: the last 24 hours.** Outside the radar, show only what was posted in the last 24 hours: pins, sightings, events, and animals hurt, dead or lost. Each one shows its age, such as `3 H`, so it is clear why it is there. Everything older shows only inside the radar. This replaces today's mix of alarms, threatened lives and the five in greatest need, which made it unclear why something was outside.
4. **Issue without lines.** DIRECT ACTION issues and prints a slip even when the four W.I.S.H. lines and the statement are empty, so a record can be printed as it is.
5. **Smaller marks, to draw people in.** Every mark is smaller from afar and grows as you zoom in. Marks that overlap move apart, and each one moves on its own.
6. **Photographs, not icons, in an open cell.** When a cell is open, its life is shown by its photograph. The icon stays only when there is no photograph.
7. **The field list catches up.** Add the species and sightings recorded in the area since the last pull, and mark which are new.

- **Done when:** each item has been checked on a preview, `npm test` passes, and the guide still describes what the map shows.

## Stage 2 — save and share, with your approval

*Built. What people make stays on their device until they send it. DIRECT ACTION sends a slip, and SHARE sends a record placed on the map. Either waits on the approval page at `/admin`, behind the `ADMIN_KEY` secret rather than Cloudflare Access, and appears for everyone once shown. RECEIVE takes the code printed on a slip. Photographs live in the D1 database, so no R2 bucket is needed.*

- **Sharing:** a SHARE button on what people make: records placed on the map, constellations, issued slips and their own photographs. There are no accounts. A name is optional.
- **Your approval page:** a private page at `novel.global/admin` lists everything waiting, with a preview of how it will look. Approve, edit or reject each one. Approved items appear on the map and on STORIES for everyone.
- **Protecting the approval page:** Cloudflare Access asks for your email and sends a one-time code, so there is no password to choose, store or leak. The Worker checks Access's token on every admin request as well. It is free for up to 50 people, so a second approver can be added later.
- **Storage:** a Cloudflare D1 database for the records and R2 for photographs. Each preview gets its own empty database, so testing never touches real submissions.
- **Privacy:** photographs are re-encoded on the device before sending, which removes their GPS and camera details. Places a person marked themselves are blurred to about 100 m when they are sent. Items not approved within 30 days are deleted, and nothing is kept about who sent what beyond the optional name.
- **Spam:** a Turnstile check, a limit per visitor, and size limits on text and photographs.
- **Done when:** something shared from a phone appears on your approval page, does not appear for anyone else until approved, appears for everyone after approval, and the approval page refuses anyone not signed in through Access.

## Stage 3 — the print queue and the pager printer

*Built, with one change: the queue lives in the D1 database rather than a Durable Object, which keeps previews simple and is plenty for a handful of printers. The receiver asks every few seconds, so a slip prints within about ten seconds of approval. DIRECT ACTION lists Pickles Milk Bar, Kines and Coffee Bar Elsie. The browser's print is one of the outputs. `receiver/` holds the Pi's bridge (`pull.py`, printd and optional Meshtastic) and its setup. Still to do: set up the Pi and printer at Pickles, and run the ten-in-a-row demo.*

The browser's A4 and 58 mm print button goes. In its place, DIRECT ACTION lists the partner places that print, and each slip joins that printer's queue. A Raspberry Pi beside the printer pulls jobs and prints each one as it arrives, like a pager.

- **The queue:** a Durable Object in the `front` Worker, one queue per printer. A job waits up to 24 hours, at most 20 wait at once, and only the status of a printed job is kept, for 7 days.
- **Previews:** staging builds use Worker Previews (`docs/workflow.md`), which give each preview its own empty queue, so testing never reaches a live printer. Version URLs would not work here, because a Worker with a Durable Object gets none.
- **Printer profiles:** 58 mm and 80 mm (Epson TM-T88V), each with its dot width and columns. The same slip prints correctly on either.
- **Pairing:** a QR sticker on the printer opens novel.global with that printer chosen.
- **The receiver:** Raspberry Pi OS Lite, printd on the Pi itself, and a small pull bridge that asks the queue for the next job. No open ports and nothing for shop staff to install. It prints READY with its name when it starts.
- **Safety:** a Turnstile check and a rate limit on sending, and the printer's token kept as a Cloudflare secret.
- **Done when:** NOTICED, then DIRECT ACTION, then PRINT TO prints the slip within 10 seconds, ten times in a row, and still prints after the Wi-Fi drops for a minute.

## Stage 3b — final polish

*Built, on staging.*

- **NOW:** DIRECT ACTION is the headline, on one line in the terminal's type, and under it a countdown, ticking, to the first month of extreme heat. The El Niño label is larger. Extreme months are black with a small cross; months without an outlook are hatched, never faded. No explaining copy and no phone numbers; the five sit at the bottom.
- **The map, alive:** marks at half size. Close in, each becomes its photograph; under the pointer, it grows into a larger photograph. Marks fade and shrink to small ghosts as they age. The twenty example stories stand on the map always. Marks spread apart on screen only; every print keeps the true coordinates.
- **Printers:** Kines and Coffee Bar Elsie join Pickles, drawn as receipt printers with a slip curling out. Each shows NOT YET ONLINE, quiet and grey, until it is switched online on the approval page (ONLINE ON THE MAP) or its Pi is listening. Settings → PRINTERS hides them all.
- **Slips:** the paper slip as it was, and a second style, **>**, beside PIN: the terminal, the most minimal. The life's photograph is the hero, then its code, its name and its four lines, in VT323. The same style reaches the PNG and the ESC/POS printer.
- **The local mesh:** DIRECT ACTION can send to the mesh alone. Once approved, the mesh line goes to every paired printer whose radio is on, and nothing is printed.
- **Tracks:** above the constellations on NOW, two beats built from what is inside the radar: the lives (animals, insects, plants and us), each in its own call, and the human ecology (brands, businesses, third spaces, groups), each in its own small sound. Quiet rows, a dot, the voices lighting as they sound and a fine trace of the beat. A track of one's own is added under CELLS on STORIES and kept on the device.
- **Hover:** a mark grows quickly into a larger photograph, and the words sit in a small tag beside it, the photograph shown once.
- **Cell packs:** a .md, .csv or .json file of fruit trees, mesh nodes, water, shade, gardens or refuges. It is read on the device, previewed, sent for approval, and shown on the map once approved. `docs/cell-packs.md` has the format and a prompt for another LLM.
- **Examples:** twenty stories across modes and scales (creative, activist, caring, sensory, joy, skill sharing, partnerships and more). Each is tied to real places, with its sources shown on screen.

## Stage 4 — live data through Cloudflare

Every visitor shares one copy of the data, instead of each browser asking iNaturalist and OpenStreetMap.

- `/api/sightings`: iNaturalist through the Worker, cached for a few minutes, with "new since your last visit" and new species for the area marked.
- `/api/img`: photographs through the Worker, so dithering always works and iNaturalist's media limits are respected.
- `/api/places`: OpenStreetMap places fetched by the Worker per tile, kept 14 days, never keeping a failure. Today the public OpenStreetMap servers often time out; this fixes that for everyone.
- A strict Content Security Policy, which is simple once every request goes to novel.global.
- **Done when:** a sighting posted to iNaturalist appears within about 5 minutes, the app opens offline with the last data it had, and the browser calls no outside data source directly.

## Stage 5 — more places and people

- More listed places: local brands, designers, independent businesses and new venues, each with its address and site. Each place is asked whether it wants to be shown, and how.
- The places move into the Stage 2 database, and you add and edit them from the approval page, so a new place does not need a code change. People can suggest a place, which waits for your approval like everything else.
- More connections: places that share knots across constellations are drawn as one web.

## Stage 6 — gigs and gatherings

- 3RRR and Resident Advisor gigs of the week appear as event pins, and follow the 24-hour rule outside the radar.
- Neither offers an open data feed for this, so each source is asked for permission or a feed first. Until then, gigs are entered on the approval page.

## Stage 7 — climate and emergency, live

- Live warnings: Bureau of Meteorology heat and fire danger, VicEmergency incidents, EPA air quality, and the Open-Meteo forecast already in use.
- The danger to each life changes with them. For example, a heat warning raises the danger to flying-foxes inside the warning area, and a sighting near an emergency incident is flagged.
- Each source's licence is checked before it is shown or printed.

## Stage 8 — more receivers

- Printers in cafés and fashion shops, each a receiver with its own queue.
- A slip can go to the printer nearest the life, so a sighting near a café prints there.
- Out of scope until then: Bluetooth printing, venue management, accounts and billing.

## Every stage, every time

- Build on `staging`, check the preview, then merge to `main`.
- Bump the service worker cache (`da-v12`, `da-v13`, …) whenever the app changes, so returning visitors get the new version.
- No names or authorship in the code, the text or the commits.
- Secrets stay in Cloudflare, never in the repo.
- Nothing anyone shares is shown until it is approved.
- Keep the signal format backwards compatible, because printed QR codes outlive releases.
