# Sources: open projects that could be brought in, stage by stage

24 October 2026. The base has no dependencies, and that is part of why it works on old phones. Six projects below have been brought in, each kept in `vendor/` and loaded only when used: CanvasDither (the booth's prints), exifr, d3-force, Rough.js, gifenc and Departure Mono. The others are candidates.

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
| [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | Pressure-shaped strokes from a finger. | 3 KB. It would let someone draw their own stick onto the net or the receipt: a tie made by hand, not a key. |
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
