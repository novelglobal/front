# Cell packs: your own cells, many at once

A cell pack is a small file listing places that help life through the heat, such as:

- fruit trees to share
- mesh radio nodes
- water left out for wildlife
- shade, gardens and cool refuges

Send one from **STORIES → Tools → ADD YOUR CELLS**. The site reads the file on your device and shows you what it found. You then choose **SEND FOR APPROVAL**.

Nothing goes on the map until it is approved on the approval page. Once shown, the cells stand on the map for everyone. Like everything else there, they fade as they age.

## What a cell is

| Field | What it is | Required |
|---|---|---|
| `kind` | `fruit`, `tree`, `garden`, `node` (a mesh radio), `water`, `shade`, `refuge` or `place` | no: read from the name, else `place` |
| `name` | a short name, up to 60 characters: `Lemon tree, laneway` | yes |
| `lat`, `lng` | where it is, in decimal degrees: `-37.7701`, `144.9602` | yes |
| `note` | up to 140 characters: `pick freely; ring if you take a bag` | no |
| `url` | a link starting `https://` | no |

A pack holds at most 200 cells, all within greater Melbourne. Lines that can't be placed are counted and left out.

**Privacy.** Only list what you're happy for anyone to see. For a node or a tree at home, give the corner of the street, not the house.

## Three ways to write one

### Markdown (`.md`)

```markdown
# Fruit and radios, Brunswick East
by: Merri Street neighbours

- fruit | Lemon tree, laneway | -37.7701, 144.9602 | pick freely
- node | Rooftop repeater | -37.7664, 144.9731 | Meshtastic LongFast | https://meshtastic.org
- water | Bird bath, front fence | -37.7688, 144.9705
```

A table works too:

```markdown
| kind | name | lat | lng | note |
|---|---|---|---|---|
| tree | River red gum | -37.7693 | 144.9750 | old, hollow-bearing |
```

### CSV (`.csv`)

The first row names the columns:

```csv
kind,name,lat,lng,note,url
fruit,Fig on the corner,-37.7712,144.9611,"ripe Feb, ask first",
node,Library node,-37.7646,144.9606,solar,https://meshtastic.org
```

### JSON (`.json`)

```json
{ "title": "Shade on Sydney Rd", "by": "a walking group",
  "cells": [ { "kind": "shade", "name": "Arcade, cool all day", "lat": -37.7671, "lng": 144.9620 } ] }
```

## With another LLM

Paste this, then your list, map links, or notes:

> Turn what follows into a cell pack in Markdown. Begin with `# ` and a short title. If there is an author, add a line `by: ` and the name. Then write one line per place, in this form: `- kind | name | lat, lng | note`. `kind` is one of: fruit, tree, garden, node, water, shade, refuge, place. Give coordinates in decimal degrees with 4 to 5 decimals. Only include places in greater Melbourne. Keep names under 60 characters and notes under 140. Leave out any place whose location you can't establish; never guess coordinates. Round private homes to the nearest street corner.

Check the coordinates before sending. The preview lists each cell with where it falls.
