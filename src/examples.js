/* Direct Action · one example W.I.S.H. story, marked EX wherever they appear, always on the map as receipts.
   A praxis poem tied to real places around its life; the blank slate the rest is written on.
   W draws on an essay (Aeon), I on what research shows about people (worry, hope, habits), S on a design principle
   (circular, biophilic, design justice, tactical urbanism), H on a case that worked (a brief, an award). src: those sources.
   nodes: what each string was tied to, at a bearing (degrees) and a distance (metres) from the life. */
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
  }
];

/* The example, opened up: everything behind DA-0RNG, laid out on BOARD 00 as the three steps of a W.I.S.H.
   NOTICED, what was seen and what is true; RESPONSE, the research, the cases and the principle each line came from; DIRECT ACTION,
   the receipt, its strings and its sound. Every fact carries its source. The photographs are open (CC0 or CC BY) on iNaturalist.
   mix: how the radio sounds when it plays the example, the radar over Royal Park: a small choir, bubbles, glass and a haunted
   tape, and the orangutan's own constellation sung with the lives around it. */
window.DA_EXAMPLE_KIT = {
  code: 'DA-0RNG', v: 1,
  mix: { where: { lat: -37.7865, lng: 144.9515 }, r: 700, layers: { life: { on: true, lvl: 1, mood: 'dub' }, community: { on: true, lvl: 0.35, mood: 'burial' }, water: { on: true, lvl: 0.7, mood: 'weight' }, pollution: { on: false, lvl: 0.35, mood: 'haunt' } } },
  photos: [
    { u: 'https://inaturalist-open-data.s3.amazonaws.com/photos/453949619/medium.jpeg', by: 'CC0', at: 'Gunung Leuser, Sumatra', obs: 253517410 },
    { u: 'https://inaturalist-open-data.s3.amazonaws.com/photos/457027309/medium.jpg', by: '© Ioannis Magouras · CC BY', at: 'Gunung Leuser, Sumatra', obs: 255071917 },
    { u: 'https://inaturalist-open-data.s3.amazonaws.com/photos/144042862/medium.jpeg', by: 'CC0', at: 'Gunung Leuser, Sumatra', obs: 87371496 },
    { u: 'https://inaturalist-open-data.s3.amazonaws.com/photos/734848517/medium.jpg', by: 'CC0', at: 'Langkat, Sumatra', obs: 400447008 },
  ],
  noticed: [
    { t: 'SUMATRAN ORANGUTAN · Pongo abelii', d: 'Critically endangered. 14,613 counted in 2016, in the forests of northern Sumatra, with steep losses ahead as forest is cleared.', src: 'https://doi.org/10.1126/sciadv.1500789' },
    { t: 'FIRES · INDONESIA 2026', d: '895,657 ha burned by August. 1,061,746 hotspots by 14 October: more than in all of 2019.', src: 'https://en.wikipedia.org/wiki/2026_Indonesia_wildfires' },
    { t: 'HAZE', d: 'Smoke as far as Singapore, Malaysia, Brunei and the Philippines.', src: 'https://www.abc.net.au/news/2026-09-04/causes-of-indonesian-wildfires-and-how-the-government-tackling/107113456' },
    { t: 'EL NIÑO', d: 'Niño 3.4 +2.81 °C in the week to 11 October; near +3.7 °C through December.', src: 'https://public.wmo.int/resources/publication-series/global-seasonal-climate-updates/gscu-ond2026' },
    { t: 'HERE · ROYAL PARK', d: 'Orangutans live at Melbourne Zoo, in Royal Park, Parkville: the radar\'s centre.', src: 'https://www.zoo.org.au/dont-palm-us-off/' },
  ],
  response: [
    { k: 'w', t: 'WHAT WE KNOW', d: 'Satellites count the fires the official tally stopped counting.', from: 1 },
    { k: 'i', t: 'IT WOULD BE GREAT', d: '59% of young people are very or extremely worried about climate change. Worry needs something to do.', src: 'https://doi.org/10.1016/S2542-5196(21)00278-3' },
    { k: 's', t: 'SO LET\'S CREATE', d: 'Circular design: design out waste, keep materials in use, regenerate nature.', src: 'https://www.ellenmacarthurfoundation.org/circular-economy-principles' },
    { k: 'h', t: 'HERE IS HOW IT WORKS', d: 'Ask who made it, then make it with them.', src: 'https://www.fashionrevolution.org/' },
  ],
  cases: [
    { t: 'DON\'T PALM US OFF', by: 'Zoos Victoria · 2009', d: 'A zoo campaigns for clear palm oil labels on food.', src: 'https://www.zoo.org.au/dont-palm-us-off/' },
    { t: 'RANG-TAN', by: 'Greenpeace × Iceland · 2018', d: 'A Christmas ad about an orangutan, blocked from UK television; 830,000 signed to air it.', src: 'https://www.birmingham.ac.uk/research/perspective/banned-iceland-ad' },
    { t: '#WHOMADEMYCLOTHES', by: 'Fashion Revolution · 2013', d: 'Begun after the Rana Plaza collapse: every garment can say who made it.', src: 'https://www.fashionrevolution.org/' },
    { t: 'RSPO', by: 'Roundtable on Sustainable Palm Oil · 2004', d: 'A certificate for palm oil grown without clearing forest.', src: 'https://rspo.org/' },
  ],
  action: { t: 'NEST KIT', d: 'Forest fibre woven in Brunswick with Sumatran weavers: the orangutans\' nests at the zoo, and a market for the forest standing.' },
  intel: 'NIÑO3.4 +2.81 · 895,657 HA · 1,061,746 HOTSPOTS · LEUSER',
};
