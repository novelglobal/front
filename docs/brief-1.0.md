# v1.0: islands

novel.global stops being one site with one printer. It becomes the showcase of an engine anyone can run: a second-hand Epson TM-T88V and a Raspberry Pi become an **island**. It is a small, offline-first print place for a community, with its own map, lives, sounds, steps and look. The receipt is the medium: photo stickers with friends, a gig's flyer, a pledge, a fundraiser, a zine. The reason anyone makes one is that the receipts are beautiful and worth keeping.

Three builds, each its own stage, each shippable alone:

| Build | What it delivers | Where |
|---|---|---|
| **1.0 A: the one-click island** | A card written in Raspberry Pi Imager boots into a setup that needs no computer and no internet. The printer prints its own way in; a phone finishes it | A new repo |
| **1.0 B: the island engine** | Every part (map, layers, cells, species, stories, sounds, steps, print templates) a pack, set per island; an island builder for print experiences | A new repo, this one becoming its showcase |
| **1.0 C: receipts worth keeping** | Thermal-first rendering, and style packs from artists that people pick, edit and keep as their own | This repo, now |

The order: **C now** (the poster is why anyone makes; it lives here). **A at the same time** (its own repo, so it touches nothing here). **B designed now, built after C lands**: it moves code out of this repo, so it waits for C to be finished here.

---

## 1.0 A: the one-click island

**The promise:** buy a used TM-T88V and a Pi 3, move to another country, and be printing in ten minutes without typing a command.

1. **Write the card.** Raspberry Pi Imager (on any computer) lists *novel.global island* through a custom OS list. Pick it, pick the card, write. Imager already asks for the Wi-Fi and a name; both are optional.
2. **First boot, no internet needed.** The Pi finds the printer on USB and prints the first receipt: the island's setup Wi-Fi name, its password as a QR code, and one line ("scan to begin").
3. **The phone does the rest.** Joining that Wi-Fi opens a captive page (the existing `receiver/setup/wifi.py` idea, grown). It sets the island's name, the Wi-Fi it should join, and **online or offline**.
4. **Pairing without tokens.** Online, the Pi shows a short code and prints it. Whoever owns the island approves it on their site, and the token passes between them on its own (the device flow, as a TV pairs). Nobody copies or pastes a token again; a pasted token is what failed for pickles.
5. **Offline island.** Without pairing, the Pi serves its own island on its own Wi-Fi: visitors join, make and print, and it syncs later if it is ever paired.

**Stack (recommended):**
- **The image:** built by `pi-gen` (or `rpi-image-gen`) in GitHub Actions and published as a release with the Imager list JSON.
- **The island program:** one static Go binary, holding the setup page, the print queue, ESC/POS raster printing straight over USB (no printd), Wi-Fi through NetworkManager, and the pairing. It runs as one systemd service with no runtime dependencies, and is quick on a Pi 3 A+ with 512 MB.
- **Kept from now:** the setup Wi-Fi with its printed password, and the off button.
- **Its own tools:** a printed test strip to check the printer, and a printed status slip on a long press of the button.
- **Licence:** open source (AGPL-3.0 for the program, so islands stay open; MIT for the image scripts).

**Done when:** a fresh card and a fresh TM-T88V print a welcome slip and pair with novel.global (or run offline) with nothing typed but the Wi-Fi password, on a phone.

## 1.0 B: the island engine

An island is a **manifest** plus **packs**. The manifest says what the island is: its name, place, steps (any number, not always four, not always W.I.S.H.), what prints and how. Packs are everything it is made of, each swappable:

- **Map pack:** the area, offline tiles (PMTiles, served by the Pi), its own data points and layers (CSV or GeoJSON in, cells out).
- **Lives pack:** species and stories of the place.
- **Sound pack:** the voices, moods and tempo.
- **Steps pack:** the journey: notice, W.I.S.H. and direct action are novel.global's. A photo-sticker island might be one step: photo, frame, print.
- **Style pack:** see 1.0 C.

**The island builder** is the approval page grown into a dashboard for print experiences, not websites. It covers steps, packs, the printer, approvals and who may print. It also connects new devices without asking anyone.

**Federation:** islands are found through novel.global's directory if they choose, talk over the mesh when near, and keep working alone.

**Recommended path:**
1. Write the manifest and pack format first, with novel.global itself described as an island. If it can't describe this site, it isn't ready.
2. Pull the engine out of this repo piece by piece, behind the format, while novel.global keeps working.
3. Run the same engine hosted (Cloudflare, as now) and on the Pi (the 1.0 A binary serving it, SQLite for D1, files for R2).

**Done when:** a second island, the photo-sticker one, runs from packs alone, offline on a Pi, while novel.global runs from its own packs online.

## 1.0 C: receipts worth keeping

**What is wrong now, from the prints:**
- Default text is too small.
- Blacks print stripy and washed out.
- Fonts are blurry.
- Photo tones are mapped for a screen, not for heat on paper.

**Thermal-first rendering:**
- **Text 30% bigger by default.**
- **Words set on the printer's own grid:** 203 dpi, 576 dots across, sizes snapped to whole dots. They are drawn as solid ink with no anti-aliasing, so they are never dithered. Dithering is for photographs only.
- **Solid blacks:** areas meant black print black, without dither patterns.
- **Photographs mapped for heat:** a measured curve and a dither chosen by picture. The curve comes from a printed calibration strip.

The print-quality presets from da-v160 become the photo half of this.

**Style packs:** one hero key on the poster, **STYLE**. A style is one JSON file plus its assets, and sets:
- the fonts (from ones that print clean at 1-bit);
- the sizes and the grid;
- the photo filter (curve, dither, contrast);
- the frame and marks;
- the screen colours.

A person picks a style, edits it, and keeps it as their own. Artists publish mod packs of styles, which the approval page adds and curates. novel.global ships its own house styles, and the current look stays the default.

**Done when:** the same poster printed before and after shows bigger, crisp words, solid blacks and a photograph with depth. A second style changes the whole receipt in one touch.

---

## Open decisions (the owner's)

1. **The engine's name and home:** a new GitHub organisation or repo for the engine and the island program, with novel.global as its first island.
2. **Licence:** AGPL-3.0 for the engine and the island program, CC BY-SA for packs (suggested).
3. **The Pi:** 3 A+ (512 MB) as the floor, or a Zero 2 W or 4 as recommended.
