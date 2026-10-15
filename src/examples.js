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
