# Sources: open projects that could be brought in, stage by stage

24 October 2026. The base has no dependencies, and that is part of why it works on old phones. Sixteen projects below have been brought in, each kept in `vendor/` and loaded only when used: CanvasDither (every printed photograph), exifr, d3-force, Rough.js, gifenc, Departure Mono, Freeverb, Tuna, perfect-freehand, simplex-noise, Panzoom, Architects Daughter, Fraunces, Archivo Narrow, PhotoSwipe and Embla Carousel. The others are candidates.

Each project is listed with what it would replace and what it costs. Bring one in only when the base's own version fails someone in the field. A pack, loaded only when it is used, is the way to add one.

## 1. The eye: taking the photograph

| Project | What it would do | Cost, and when |
|---|---|---|
| [exifr](https://github.com/MikeKovarik/exifr) | **Brought in.** Reads GPS and time from JPEG, HEIC, TIFF and PNG. The base's own reader (`exif`) handles JPEG only. | About 40 KB for the full build, less for the GPS-only one. Bring it in when iPhones send HEIC that the browser hands over unconverted. |
| [heic2any](https://github.com/alexcorvi/heic2any) | Turns HEIC into JPEG in the browser. | About 1 MB (libheif in WASM). As a pack, only if a phone's photo will not draw at all. Today the base goes on without the picture. |

## 2. Who it is: the species guess

| Project | What it would do | Cost, and when |
|---|---|---|
| [BioCLIP](https://github.com/Imageomics/bioclip) | Names a life from the photograph across the whole tree of life, zero-shot. | A model of hundreds of MB, so it belongs on the Worker or the Pi, never on the phone. It would fill the "who" list from the picture as well as the words. |
| [BirdNET-Analyzer](https://github.com/kahst/BirdNET-Analyzer) | Names birds from a recorded call. | Runs on the Pi. It fits the map's + for calls: a sound file placed becomes a named knot. |

## 3. The design stage: the art

| Project | What it would do | Cost, and when |
|---|---|---|
| [rough.js](https://github.com/rough-stuff/rough) | **Brought in.** Hand-drawn lines and fills. | 9 KB. The sticks are already hand-bent (`chart`). rough.js would give the receipt's frames and SIGN's band the same hand. |
| [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | **Brought in.** Pressure-shaped strokes. | 5 KB, `vendor/freehand.js`. Every line of the aura (the rings, the bell, the tentacles tapering to their tips) is drawn with it. It could also let someone draw their own stick onto the net. |
| [simplex-noise](https://github.com/jwagner/simplex-noise.js) | **Brought in.** Smooth noise. | 2 KB, `vendor/simplex.js`. The tentacles' drift, so no two moments hang the same. |
| [Architects Daughter](https://github.com/google/fonts/tree/main/ofl/architectsdaughter) | **Brought in.** Hand lettering after an architect's drawings. | 13 KB, `vendor/architects-daughter.woff2`, OFL. The aura's words and the colour posters: blueprint lettering. |
| [Fraunces](https://github.com/undercasetype/Fraunces) | **Brought in.** A heavy wedge serif, after Windsor and Cooper. | 16 KB, `vendor/fraunces-black.woff2` (Black, Latin), OFL. The mark beside the globe, W.I.S.H.'s letters on the poster, the stamps' big words. |
| [Archivo Narrow](https://github.com/Omnibus-Type/ArchivoNarrow) | **Brought in.** A narrow grotesque for catalogue lines. | 12 KB, `vendor/archivo-narrow.woff2` (SemiBold, Latin), OFL. The four lines on the poster, the stamps' rims. |
| [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | **Brought in.** Full-screen pictures: swipe, pinch, double-tap, flick to close, with spring. | 54 KB + 7 KB css, `vendor/photoswipe.js`, MIT. The aura's viewer for every poster and photograph. |
| [Embla Carousel](https://github.com/davidjerleke/embla-carousel) | **Brought in.** A light, dependency-free carousel with real drag physics. | 18 KB, `vendor/embla.js`, MIT. The aura's wall. |
| [Panzoom](https://github.com/timmywil/panzoom) | **Brought in.** Pinch, wheel and double-tap zoom with CSS transforms. | 10 KB, `vendor/panzoom.js`. The portfolio slideshow: each poster whole, then as close as one likes, in place. |
| [pixelit](https://github.com/giventofly/pixelit) | Pixel art from a photograph, with palettes. | Small. The base's wonky pixels are its own on purpose. Take only its palette mapping, for colour boards. |
| [CanvasDither](https://github.com/NielsLeenheer/CanvasDither) | **Brought in.** One-bit dithering made for receipt printers. The booth uses its Atkinson method. | 2 KB, `vendor/canvas-dither.js`, loaded only by the booth. It is ported to plain script, with the error carried in a float buffer. |
| [gifenc](https://github.com/mattdesl/gifenc) | **Brought in.** Fast GIF encoding in the browser. | 9 KB. The pixel board's three-picture sprite saved as one moving file, to share. |

## 4. Printing

| Project | What it would do | Cost, and when |
|---|---|---|
| [ReceiptLine](https://github.com/receiptline/receiptline) | A markdown for receipts, drawn to SVG or ESC/POS. | Would let SIGN and the W.I.S.H. poem be written as text and rendered the same on screen and paper. The base already rasters its own canvas, so this matters only if text printing (sharper, faster) is wanted. |
| [node-thermal-printer](https://github.com/Klemen1337/node-thermal-printer) | ESC/POS for Epson, Star and others. | For the receiver, not the base. A reference only: `receiver/` is not changed here. |
| [u8g2](https://github.com/olikraus/u8g2) | Fonts and drawing for small monochrome OLEDs. | The base's OLED line is drawn after this kind of module. A real one on the solar printer could show the same line: queued, printed, the number to call. |

## 5. The map and the net

| Project | What it would do | Cost, and when |
|---|---|---|
| [PMTiles](https://github.com/protomaps/PMTiles) | A whole map region in one file, read by range requests, so it works offline and from R2. | Would replace the imagery tiles with one Melbourne file the service worker can keep. Fits TERRAIN as a pack. |
| [d3-force](https://github.com/d3/d3-force) | **Brought in.** Force layout. | 15 KB. Would weave constellations off the ground: the W.I.S.H. thread and the sets laid out as a net by what they share, not by where they are. |

## 6. RADIO: the 4-track

| Project | What it would do | Cost, and when |
|---|---|---|
| [Freeverb](https://github.com/livejs/freeverb) | **Brought in.** The Schroeder–Moorer hall reverb, after Tone.js, as plain Web Audio nodes. | About 2 KB, `vendor/freeverb.js`. The room every voice plays in (`room`); it made the bells and the choir sound far off instead of thin. |
| [Tuna](https://github.com/Theodeus/tuna) | **Brought in.** Web Audio effects. Only its ping-pong delay is used; its chorus runs on the old ScriptProcessor, so the chorus is the base's own. | About 36 KB, `vendor/tuna.js`. The echo that crosses left and right behind the bells. |
| [Tone.js](https://github.com/Tonejs/Tone.js) | Synths, a transport, effects and sample players on Web Audio. | About 150 KB. The base's own voices (gamelan, jegog, chant, kecak, taiko) and scheduler do the job in a few KB. Bring Tone in only for recorded samples of real instruments. |
| [Strudel](https://strudel.cc) | TidalCycles patterns in the browser. | Large. A song could be saved as a line of pattern text, readable and shared as a code on the receipt. |
| [audiobuffer-to-wav](https://github.com/Jam3/audiobuffer-to-wav) | WAV from a Web Audio buffer. | The base already has its own 16-bit encoder (`wavOf`). Kept as the reference it follows. |

## 7. W.I.S.H.: the thread

| Project | What it would do | Cost, and when |
|---|---|---|
| [Lobsters](https://github.com/lobsters/lobsters) | An open-source news site in the Hacker News manner: ranked stories, threaded replies, tags. | Its ranking and moderation are the model for the thread (`threads()`: points over hours, with gravity, the urgent lifted). Worth reading before replies move to the server for everyone. |

## 8. Type, data and the mesh

| Project | What it would do | Cost, and when |
|---|---|---|
| [Departure Mono](https://github.com/rektdeckard/departure-mono) | **Brought in.** A monospaced pixel font drawn after old terminals and small screens. | About 20 KB. It is the nearest type to the OLED line. Only the OLED would use it, and the rest stays in the device's own monospace. |
| [iNaturalist API](https://github.com/inaturalist/iNaturalistAPI) | The sightings behind LIVE, the reveal and the map. | Already used. |
| [Open-Meteo](https://github.com/open-meteo/open-meteo) | Today's heat for each noticing. | Already used. |
| [Meshtastic](https://github.com/meshtastic/firmware) | LoRa mesh radios that pass short messages with no phone network. | The emergency line where there is no signal: a noticing's alert and number sent from park to printer by mesh. For the receiver, later. |

## El Niño, why it matters now (the aura's catch, `NINO_WHY`)

Read 27 October 2026, through search (the pages themselves could not be fetched from the build environment, so every figure is as the search reported it; check the originals before quoting further).

- NOAA Climate Prediction Center, October 2026 ENSO update (via the ENSO blog, "Highlights from NOAA's October 2026 El Niño forecast"): El Niño Advisory; better than 83% chance of a strong to very strong event through January–March 2027.
- Bureau of Meteorology: El Niño declared underway on 16 June 2026 (reported by Al Jazeera, 16 June 2026, "Australia warns El Nino weather pattern set to be strongest in decades", and ABC News, 15 April and 22 August 2026).
- WMO, October 2026 (reported by The Weather Channel, 22 October 2026): likely a record event, peaking at or above 2.5 °C above average.
- Morgan Pratchett (James Cook University) at the International Coral Reef Symposium, July 2026 (AFP, carried by The Star and Malay Mail): "a very high likelihood that we'll see very high severity and large-scale mass bleaching on the Great Barrier Reef".
- Aeon, "The life and possible death of the great Asian monsoon": many of the worst droughts in Asian history came with intense El Niño events.

## El Niño, what to do now (the aura's catch, `ACTS`)

Plain, standing advice, not a forecast: Wildlife Victoria's emergency line (03 8400 7300) for injured, orphaned or heat-stressed wildlife and flying-foxes; VicEmergency (app and website) for the daily fire danger rating and warnings in Victoria; water left out for wildlife in shallow dishes with a way out; checking on older neighbours and people living alone in heat; pets kept in during heat and cats at night; outside lights off at night for moths and bats (see the Bogong moth note above); 000 in an emergency.
