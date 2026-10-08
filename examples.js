/* Direct Action · three example signals, marked EX wherever they appear.
   nodes: what each string was tied to, at a bearing (degrees) and a distance (metres) from the cell. */
window.DA_EXAMPLES = [
  {
    code: 'DA-0RNG', at: '2026-10-06T10:00:00+11:00', brief: 'B43',
    pin: { lat: -37.7841, lng: 144.9515, n: 'Pongo abelii', cn: 'Sumatran Orangutan', ic: 'Mammalia', g: 'ape', place: 'PARKVILLE' },
    threat: 'El Niño fires burn Sumatra’s forests', when: 'DROUGHT · JAN–MAR', deg: 3,
    lines: { w: 'Fires burned ~900,000 ha of Indonesia by Aug', i: 'Zoo orangutans nest in cloth from Sumatra', s: 'Plastic out. Forest fibre in.', h: 'Brunswick studio + Sumatran weavers: nest kit' },
    nodes: [
      { k: 'a', t: 'biz', n: 'A Brunswick studio', role: 'studio', b: 20, d: 420 },
      { k: 'b', t: 'biz', n: 'A local label', role: 'label', b: 70, d: 380 },
      { k: 'c', t: 'group', n: 'Friends of Royal Park', b: 160, d: 300 },
    ],
    edges: [['pin', 'a'], ['a', 'b'], ['pin', 'c']],
  },
  {
    code: 'DA-B0GN', at: '2026-10-04T21:30:00+11:00', brief: 'B26',
    pin: { lat: -37.7680, lng: 144.9612, n: 'Agrotis infusa', cn: 'Bogong Moth', ic: 'Insecta', g: 'moth', place: 'BRUNSWICK' },
    threat: 'Hot nights, few flowers, lights pull them in', when: 'DRY FLOWERING · NOV–JAN', deg: 3,
    lines: { w: 'Bogong moths fell 99.5% from 2018 to 2021', i: 'Sydney Rd dark enough for moths to fly home', s: 'Dark is a habitat.', h: 'Shopfronts off at close, now until December' },
    nodes: [
      { k: 'a', t: 'biz', n: 'Sydney Rd shopfronts', role: 'light', b: 0, d: 120 },
      { k: 'b', t: 'biz', n: 'A sign printer', role: 'studio', b: 120, d: 260 },
    ],
    edges: [['pin', 'a'], ['a', 'b']],
  },
  {
    code: 'DA-GHFF', at: '2026-10-02T17:10:00+11:00', brief: 'B06',
    pin: { lat: -37.7808, lng: 144.9608, n: 'Pteropus poliocephalus', cn: 'Grey-headed Flying-fox', ic: 'Mammalia', g: 'flyingfox', place: 'PRINCES HILL' },
    threat: 'Dry heat over 38°C can kill a camp in hours', when: 'EARLY HEAT · OCT–NOV', deg: 4,
    lines: { w: '~1,000 flying-fox pups died of heat, Jan 2026', i: 'Every fallen bat found in minutes, not hours', s: 'Help with a pin, not a hand.', h: '20 heat spotters: never touch, call 136 186' },
    nodes: [
      { k: 'a', t: 'group', n: 'Friends of Royal Park', b: 250, d: 480 },
      { k: 'b', t: 'biz', n: 'A print shop', role: 'studio', b: 80, d: 300 },
    ],
    edges: [['pin', 'a'], ['pin', 'b']],
  },
];
