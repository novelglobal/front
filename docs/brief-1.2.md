# Brief 1.2: the engine as a mod manager

The Archipelagos engine does two things. It helps an island build and run a working app, site or feature quickly. And it lets anyone bring that feature into someone else's, remixed. The second part is the main idea of the whole engine.

It works the way game mod managers do (Gale, r2modman, the Thunderstore format), made smaller and open, with one rule they don't have: **everything ends in something printed on a thermal printer.**

## What is borrowed

| From | The idea | Here |
|---|---|---|
| Thunderstore's `manifest.json` | A mod is a folder with five plain fields: name, version, description, website and dependencies written as `team-name-version` | A mod is one plain `mod.json`, with dependencies written as `island-mod@version` |
| Gale, r2modman | Profiles: a set of mods switched on together, without touching the base game | A **board**: the wiring on the switchboard |
| Gale | Each mod is stored once and linked into each profile | Each mod lives once on the engine; boards point to it by name and version |
| r2modman, Gale | A profile is shared as a short code and imported in one step | A board is a short code, printed as a QR at the foot of every slip it makes |
| Gale's profile sync | An owner pushes changes; followers pull them and can't edit locally | An island keeper publishes a board; visitors follow it, or copy it to make their own |
| Gale's config editor | Each mod's settings show as switches, sliders and fields, never raw text | Each mod's settings come from its `mod.json` and show in the control panel |

Gale is GPL-3.0. Only its ideas are taken here, never its code.

## What is different

- **Mods are data, never code.** A game mod runs code. Here a mod describes what it makes, and the engine does the making. Nothing an island sends ever runs on another island or on novel.global. This keeps it safe and open to anyone.
- **The sink is always paper.** Every board compiles to one slip: ESC/POS bytes for a 58 or 80 mm printer. If a wiring would make nothing printable, it still prints its own small flourish.
- **Four cables.** Each person has four cables. Each cable has two ends, so a board joins at most eight things. To make a fifth connection, a cable has to come out first. That keeps every board small enough to understand, print and share.

## The basic elements

A mod **gives** some elements and **takes** some. A cable carries what one end gives into what the other end takes, both ways round.

| Element | What it is on paper |
|---|---|
| WORDS | A line of text, up to 22 characters, in the slip's type |
| PICTURE | One image, dithered to the printer's dots |
| SOUND | A song or tape, printed as its code and a QR to hear it |
| CODE | A code (a W.I.S.H. piece, an island, a board), printed as a QR |
| LIST | Lines to tick, such as the build checklist |
| LENGTH | The paper's shape: a slip, a poster, or a 300 mm strip |

Where nothing given matches anything taken, the cable still does something: the jack sparks and sings its note.

## A mod

```json
{
  "id": "pickles-zine",
  "version": "1.0.0",
  "title": "LANDSCAPE ZINE",
  "island": "pickles",
  "mark": "zine.svg",
  "gives": ["LENGTH", "PICTURE"],
  "takes": ["WORDS", "PICTURE", "CODE"],
  "needs": [],
  "settings": [{ "key": "ink", "kind": "switch", "label": "HEAVY INK", "default": false }],
  "slip": "zine.slip.json"
}
```

- `id` is the island's name and the mod's name, so two islands never clash.
- `needs` lists other mods it can't work without, as `id@major`. The engine plugs these in first, and they don't use up a cable.
- `slip` is the layout: a short list of blocks (picture, words, list, code, rule, space) in order. It holds no code.

## A board

A board is up to four pairs of jacks. Each jack has a single character once it is found, so a whole board is at most eight characters, written in pairs: `RW/ZW/KZ`. The `/` keeps it apart from W.I.S.H. codes (`DA-XXXX`) and island find-codes (`2·K7QF`).

- **On the phone:** the switchboard is the board. Its code is kept on the phone and shown in the control panel.
- **On paper:** every slip a board makes carries the board's code as a small QR at its foot. Scanning a receipt loads that wiring, ready to remix.
- **Published:** an island keeper can publish their island's board from their control panel. Visitors can follow it (it updates when the keeper changes it) or copy it and rewire their copy.

## How a print is made

1. Start from the mod the print button belongs to, using its slip.
2. Plug in its `needs`.
3. Follow each cable from it. Each mod at the other end hands over what it gives that this one takes.
4. Fill the slip's blocks, from top to bottom, with what arrived.
5. Add the board's code at the foot.
6. Turn it into ESC/POS bytes for that printer's paper, and queue it as now.

The same steps run on novel.global (in the worker), in the engine (Go), and on an island's Pi offline. All three have to give the same bytes for the same board, and a shared test checks that.

## Who can wire what

The connections from brief 1.1 decide what joins a board:

- A mod from another island can only be wired in if that island's printer has the matching connection on (W.I.S.H., RADIO, ART, WORDS, CARDS, CODES).
- novel.global and the starting printers have all of them on, so their mods can be remixed freely.
- A newly joined island starts with none on, and its keeper switches them on.

## Who does what

| Session | Part |
|---|---|
| this one (`front`) | Four cables on the switchboard; board codes read and written; the control panel's board and settings; prints from the starting mods folded together in the worker |
| 1.0 B (`island-engine`) | The `mod.json` and slip format, written down as an open schema with a validator; the steps that turn a board into a slip, in Go; the shared test of matching bytes; the starting mods as examples |
| 1.0 A (`island-kit`) | The Pi serves its island's mods and runs the same steps offline |
| 1.0 C (receipts) | The board QR at the foot of a slip; the slip blocks drawn to match the existing receipts |

## Stages

| Stage | Delivers |
|---|---|
| M1 | Four cables; the six elements; `mod.json` and slip written down, with the starting mods described in it |
| M2 | Board codes: on the phone, on every slip, and read back from a scan |
| M3 | The print steps in the worker and the engine, giving the same bytes |
| M4 | Mods from islands, published boards to follow or copy, and settings in the control panel |
