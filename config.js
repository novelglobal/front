/* Direct Action · settings */
window.DA_CONFIG = {
  NAME: 'DIRECT ACTION',
  BY: 'novel.global',
  BBOX: { s: -37.823, w: 144.925, n: -37.748, e: 145.000 },      // Brunswick to the city
  TERRAIN_EXAGGERATION: 3,
  DAYS: 45,                                                         // sightings from the last 45 days; older ones go cold
  PAGES: 5,                                                         // × 200 sightings
  HISTORY: { years: 2, days: 21, per: 200 },                        // the same weeks in past years
  INAT_API: 'https://api.inaturalist.org/v1',
  INAT_WEB: 'https://www.inaturalist.org/observations/',
  INAT_TAXA: 'https://www.inaturalist.org/taxa/',
  INAT_UPLOAD: 'https://www.inaturalist.org/observations/upload',
  PLACE_PREF: 6744,                                                 // iNaturalist place id for Australia (common names)
  IMAGERY: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxzoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics', note: 'free to view with credit; not open data' },
  DEM_URL: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  WEATHER_URL: 'https://api.open-meteo.com/v1/forecast?latitude=-37.775&longitude=144.962&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Australia%2FMelbourne&forecast_days=16',
  OVERPASS: ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'],
  OVERLAYS: [
    { id: 'water', label: 'Drinking fountains', dataset: 'drinking-fountains', kind: 'water' },
    { id: 'sensors', label: 'Microclimate sensors, air temperature now', dataset: 'microclimate-sensors-data', kind: 'temp', query: 'order_by=received_at%20desc&limit=100' },
  ],
  OVERLAY_API: 'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/',
  RADIUS: { min: 50, max: 1500 },                                   // a cell's own radius, in metres
  SCAN: { lat: -37.7690, lng: 144.9630, r: 520, min: 250, max: 1500, turn: 8 },   // the radar: where it starts, its radius in metres, seconds per sweep
  SIGNAL: { line: 48, mesh: 200, pager: 80 },                       // characters per W.I.S.H. line · bytes per mesh message · characters per pager line
  PORTAL_URL: '',                                                   // where it is hosted: printed codes link back here
  EVENTS_URL: '',                                                   // a sheet of gatherings published as CSV: title, start, venue, lat, lng, tags, link
  ELNINO: 'EL NIÑO 2026–27',
  COUNTRY: 'WURUNDJERI WOI-WURRUNG COUNTRY',
  REFRESH_MIN: 60,
  LIVE_MIN: 5,
};

/* Kinds of life — million years since our last shared ancestor (TimeTree). Range = who counts as near. */
window.DA_SCALES = [
  { k: 'HUM', label: 'HUMANS', my: '0', range: 400, taxa: ['Human'] },
  { k: 'MAM', label: 'MAMMALS', my: '90–180', range: 600, taxa: ['Mammalia'] },
  { k: 'AVE', label: 'BIRDS', my: '312', range: 500, taxa: ['Aves'] },
  { k: 'HRP', label: 'REPTILES · FROGS · FISH', my: '312–435', range: 300, taxa: ['Reptilia', 'Amphibia', 'Actinopterygii'] },
  { k: 'INV', label: 'INSECTS · SPIDERS · SNAILS', my: '~800', range: 250, taxa: ['Insecta', 'Arachnida', 'Mollusca', 'Animalia'] },
  { k: 'PLA', label: 'TREES · PLANTS · FUNGI', my: '1,100–1,500', range: 150, taxa: ['Plantae', 'Fungi', 'Chromista', 'Protozoa', 'Unknown'] },
];

/* How hard heat and drought are on a kind of life the field list does not hold: [heat 0–3, water 0–3] by group, with named exceptions. */
window.DA_TRAITS = {
  groups: { Human: [3, 2], Mammalia: [2, 2], Aves: [2, 2], Amphibia: [3, 3], Reptilia: [1, 1], Actinopterygii: [2, 3], Insecta: [2, 1], Arachnida: [1, 1], Mollusca: [2, 2], Plantae: [1, 2], Fungi: [1, 3], Animalia: [1, 1], Chromista: [1, 2], Protozoa: [1, 2], Unknown: [1, 1] },
  special: [
    ['Pteropus', 4, 2, 'above ~42°C'], ['Pseudocheirus', 3, 2, 'long heatwaves'],
    ['Litoria', 3, 3, 'standing water'], ['Crinia', 3, 3, 'standing water'], ['Limnodynastes', 3, 3, 'standing water'],
    ['Hydromys', 2, 3, 'creek-bound'], ['Apis', 2, 2, 'carries water'], ['Eucalyptus', 2, 1, 'sheds limbs'],
  ],
};

/* The heat index on the ground: the day's maximum, and the day's maximum averaged with the night after.
   An index for this archive, not an official warning: official warnings are linked beside it. */
window.DA_HEAT = { load: 30, hot: 35, extreme: 40 };

/* The El Niño threat to each kind of life, in a line of 44 characters at most. The card adds when it lands. */
window.DA_THREAT = {
  bird: 'Water dries up; small birds die of thirst',
  parrot: 'Dry flowering: no nectar for lorikeets',
  waterbird: 'Shrinking water breeds botulism',
  owl: 'Hot roosts by day; baited rats by night',
  raptor: 'Drought thins the prey for chicks',
  mammal: 'No shade, no water: heat kills small mammals',
  macropod: 'Heat and dry grass: no shade, no feed',
  possum: 'Over 35°C possums come to ground by day',
  flyingfox: 'Dry heat over 38°C can kill a camp in hours',
  bat: 'Roosts in roofs and hollows overheat',
  rodent: 'Bare dry ground: nowhere cool to hide',
  fox: 'Drought: foxes hunt heat-weakened wildlife',
  cat: 'At night cats kill heat-weakened wildlife',
  dog: 'Hot ground and cars kill dogs',
  rabbit: 'Over 30°C rabbits suffer heatstroke',
  lizard: 'No logs or litter: no cool place to hide',
  snake: 'Thirsty snakes come into yards for water',
  turtle: 'Wetlands dry; turtles cross roads to water',
  frog: 'Ponds and drains dry while frogs breed',
  butterfly: 'Heat withers flowers and caterpillar plants',
  moth: 'Hot nights, few flowers, lights pull them in',
  bee: 'Nectar fails; colonies need water to cool',
  wasp: 'Drought dries up flowers and prey insects',
  fly: 'Hoverflies lose flowers and wet places',
  beetle: 'Leaf litter and soil bake dry',
  bug: 'Sap plants wilt; bug numbers crash',
  spider: 'Dry cover, hot wind, fewer insects',
  orb: 'Drought starves webs of insects',
  grasshopper: 'Dry, mown grass leaves no food',
  mantis: 'No insects, no cover in the drought',
  dragonfly: 'Ponds dry; a year of nymphs dies',
  aquatic: 'Warm low water runs out of oxygen',
  snail: 'Long dry spells outlast a sealed shell',
  segmented: 'Soil dries and heats; worms die',
  fungi: 'Dry ground: no fruiting, thirsty trees',
  plant: 'Drought kills slowly; shade goes with it',
  human: 'Heatwaves: the deadliest hazard here',
  ape: 'El Niño fires burn Sumatra’s forests',
  paw: 'Heat and drought: shade and water vanish',
};

/* The statement printed on each slip: what El Niño does to this kind of life here, and what the people around it can change.
   Two sentences at most; each can be rewritten on the slip before it is issued. */
window.DA_STATEMENT = {
  bird: 'In dry heat, small birds can die of thirst within a day. Shallow water, refilled daily and kept in shade, is the difference a garden, café or school can make.',
  parrot: 'When El Niño dries the flowering, lorikeets lose the nectar they live on. Flowering natives in yards and along streets carry them through a hungry summer.',
  waterbird: 'As ponds shrink and warm, botulism can spread through waterbirds. Keeping litter and runoff out of the drains keeps the water that is left alive.',
  owl: 'Owls roost hot by day and hunt rats by night, and rat bait passes from rat to owl. A street that goes bait-free gives them safe prey through the summer.',
  raptor: 'Drought thins out the mice and insects that raptors feed their chicks. Unsprayed, unmown patches of grass keep that prey within reach.',
  mammal: 'Over 35°C small mammals can overheat within hours. Shade, water at ground level and cats kept in give them somewhere to wait out the heat.',
  macropod: 'Heat and dry grass leave kangaroos and wallabies with little shade or feed. Corridors of trees and water let them move to cooler ground.',
  possum: 'Above 35°C possums come down to the ground by day, exhausted. Dense canopy, a shallow bowl of water and cats kept in help them through.',
  flyingfox: 'Dry heat over 38°C can kill a flying-fox camp within hours. Flowering street trees, water and quiet, dark nights keep them alive.',
  bat: 'Roof cavities and tree hollows overheat in a heatwave, and the bats inside can die. Shade over roosts and darker nights give them a cooler place to rest.',
  rodent: 'Native rodents shelter in leaf litter and dense ground cover, which a drought bakes dry. Unraked corners and water at ground level keep their refuges cool.',
  fox: 'In a drought foxes hunt heat-weakened wildlife and raid open bins. Sealed bins and fenced compost leave less for them and more for native animals.',
  cat: 'On hot nights roaming cats kill wildlife already weakened by heat. Keeping cats in from dusk to dawn is the simplest response a household can make.',
  dog: 'Hot asphalt burns paws, and a parked car turns deadly within minutes. Shade, water and walks before 9 am keep dogs safe through the heat.',
  rabbit: 'Above 30°C rabbits suffer heatstroke quickly. Shade, cool tiles and fresh water in every hutch carry pet rabbits through a hot summer.',
  lizard: 'Without logs, rocks and leaf litter, lizards have nowhere cool to hide. Rough corners left in gardens and laneways become their refuge.',
  snake: 'In a drought snakes come into yards looking for water. Keeping a calm distance and calling a licensed catcher keeps people and snakes safe.',
  turtle: 'As wetlands dry, turtles walk the roads to find water, and many die. Slow traffic near the creek and clean, connected water save them.',
  frog: 'Frogs breed in ponds and drains that dry out in an El Niño summer. A pond or a damp corner, and drains kept free of soap and oil, keep them breeding.',
  butterfly: 'Heat withers the flowers butterflies feed on and the plants their caterpillars eat. Unsprayed native plantings in yards and verges keep the cycle going.',
  moth: 'Hot nights bring fewer flowers, and lights pull moths off course. Dark windows and shielded lights after 10 pm keep their nights intact.',
  bee: 'When the flowering fails, native bees lose their nectar, and colonies need water to cool their nests. Flowers and a shallow dish of water with stones keep them going.',
  wasp: 'Drought dries up the flowers and insect prey that native wasps rely on. Flowering plants and gardens left unsprayed keep these quiet pollinators going.',
  fly: 'Hoverflies pollinate and eat aphids, but lose their flowers and damp places in a drought. Flowering herbs and a wet corner of the garden keep them near.',
  beetle: 'Beetles live in leaf litter and soil, which bake dry in El Niño heat. Mulch, fallen leaves left in place and no sprays keep the ground alive.',
  bug: 'Sap-feeding bugs crash when their plants wilt in a drought. Watered native plants keep the insects that birds and lizards feed on.',
  spider: 'Hot wind and dry cover leave spiders exposed, with fewer insects to catch. Dense shrubs and unsprayed gardens give them shelter and food.',
  orb: 'In the dry months the insects an orb-weaver eats disappear. A garden kept watered, unsprayed and dark at night keeps its web full.',
  grasshopper: 'Mown, dried grass leaves grasshoppers with nothing to eat. Patches of long native grass feed them and the birds that hunt them.',
  mantis: 'Without insects or cover in a drought, mantises starve or are exposed. Shrubby, unsprayed gardens keep the insect web they depend on.',
  dragonfly: 'Dragonfly nymphs live in water for a year or more, and when ponds dry a generation dies. A permanent pond without fish keeps them through the drought.',
  aquatic: 'Warm, low water runs out of oxygen, and fish suffocate. Shade along the banks and nothing but rain down the drains keep the creek breathing.',
  snail: 'A sealed shell can outlast a short dry spell, but not a long El Niño drought. Mulch, damp shade and no snail pellets give native snails a chance.',
  segmented: 'Earthworms die when soil dries and heats. Mulch, compost and shade over bare soil keep the ground cool enough for them.',
  fungi: 'Dry ground means no fruiting, and the trees that depend on fungi go thirsty too. Mulch and deep watering keep the underground network alive.',
  plant: 'Drought kills trees slowly, and the shade they give goes with them. Deep watering of street trees through summer keeps the canopy over everyone.',
  human: 'Heatwaves kill more Australians than any other natural hazard. Checking on neighbours, cool rooms open to all and shade on the street save lives.',
  ape: 'El Niño years dry Indonesia’s peat, and fires burn the forests orangutans live in. What is bought here, from palm oil to paper, connects this street to those forests.',
  paw: 'Heat and drought take away shade and water first. A shaded bowl of water and a garden left a little wild help whatever lives here.',
};

/* Who to call. Numbers as published by the Victorian Government's Better Health Channel, Wildlife Victoria and Agriculture Victoria
   (sick or dead wild birds: the Emergency Animal Disease Watch Hotline, while H5 bird flu is in Victoria's wild birds). */
window.DA_CONTACTS = [
  ['000', 'EMERGENCY', 'tel:000'],
  ['1800 226 226', 'VICEMERGENCY', 'tel:1800226226'],
  ['13 25 00', 'SES', 'tel:132500'],
  ['(03) 8400 7300', 'WILDLIFE VICTORIA', 'tel:0384007300'],
  ['1300 606 024', 'NURSE-ON-CALL', 'tel:1300606024'],
  ['13 11 14', 'LIFELINE', 'tel:131114'],
  ['1300 224 636', 'BEYOND BLUE', 'tel:1300224636'],
  ['1800 675 888', 'SICK OR DEAD WILD BIRDS', 'tel:1800675888'],
  ['136 186', 'DEECA · WILDLIFE', 'tel:136186'],
];
window.DA_LINKS = [
  ['VICEMERGENCY', 'https://emergency.vic.gov.au'],
  ['HEAT HEALTH WARNINGS', 'https://www.health.vic.gov.au/environmental-health/heat-health-warning'],
  ['REPORT INJURED WILDLIFE', 'https://wildlifevictoria.org.au/report-a-wildlife-emergency/'],
  ['WILDLIFE EMERGENCY APP', 'https://www.wildlife.vic.gov.au/wildlife-emergencies/reporting-injured-wildlife-during-emergencies'],
  ['MERRI-BEK · EXTREME HEAT', 'https://www.merri-bek.vic.gov.au/my-council/emergency-management/extreme-heat/'],
  ['SICK OR DEAD WILD BIRDS · H5', 'https://agriculture.vic.gov.au/biosecurity/animal-diseases/poultry-diseases/H5N1-avian-influenza-H5-bird-flu/report-sick-or-dead-wild-birds-and-wildlife'],
  ['LOST AND FOUND · MERRI-BEK', 'https://www.merri-bek.vic.gov.au/living-in-merri-bek/animals-and-pets/lost-and-found-pets/'],
  ['LOST AND FOUND · CITY OF MELBOURNE', 'https://www.melbourne.vic.gov.au/lost-and-found-animals'],
  ['CAT CURFEW · MERRI-BEK', 'https://conversations.merri-bek.vic.gov.au/domestic-animal-management-plan-2025-2029/about-cat-curfew'],
];

/* Kinds of trade, as OpenStreetMap names them; each maps to the role a business plays near the lives around it. */
window.DA_SECTORS = {
  FOOD: { label: 'FOOD & DRINK', role: 'litter' }, GROCERY: { label: 'GROCERY', role: 'litter' }, GARDEN: { label: 'GARDEN & HARDWARE', role: 'poison' },
  FASHION: { label: 'FASHION & TEXTILES', role: 'fashion' }, MOTOR: { label: 'FUEL & MOTOR', role: 'runoff' }, CARE: { label: 'HEALTH & BEAUTY', role: 'litter' },
  PETS: { label: 'PETS & VETS', role: 'pets' }, OFFICE: { label: 'OFFICES & FIRMS', role: 'light' }, VENUE: { label: 'VENUES & STAGES', role: 'space' }, RETAIL: { label: 'SHOPS', role: 'owner' },
};

/* What each place does near the lives around it, by its kind of trade (not a judgement of any one business).
   ON NOTICE (on): what that kind of trade sells or leaves that harms a life in its radius. TO BACK: the places that repair,
   reuse, make, host and gather. cat: its part of the human ecology (DA_FAMILIES). g: the kinds of life it touches most.
   plain: what it does, in a few words, as the card counts it ("12 sell takeaway containers"). line: one fact, sourced. */
window.DA_ROLES = {
  takeaway: { w: 'TAKEAWAY', on: true, cat: 'service', plain: 'sell takeaway containers', duty: 'Sells food and drink in single-use containers', g: ['turtle', 'waterbird', 'frog'], line: "Soft plastic is the Merri's most common litter: 9,308 pieces in 2024.", src: 'https://mcmc.org.au/images/MCMC-Publications/Waterway-Health-Reports/Rapid_Response_to_Litter_MCMC_Litter_Report_2024.pdf' },
  bottles: { w: 'PLASTIC BOTTLES', on: true, cat: 'service', plain: 'sell plastic bottles', duty: 'Sells drinks in plastic bottles', g: ['turtle', 'waterbird', 'aquatic'] },
  litter: { w: 'LITTER', on: true, cat: 'service', plain: 'leave butts, cans and wrappers', duty: 'Butts, cans and wrappers left outside wash into the drains', g: ['turtle', 'waterbird', 'rodent'] },
  paint: { w: 'PAINT', on: true, cat: 'service', plain: 'sell paint', duty: 'Sells paint; brushes rinsed at a drain reach the creek', g: ['frog', 'aquatic', 'dragonfly'] },
  poison: { w: 'PESTICIDES', on: true, cat: 'service', plain: 'sell pesticides', duty: 'Sells rat bait, snail pellets and insect sprays', g: ['owl', 'raptor', 'lizard', 'orb'], line: '92% of dead owls and frogmouths tested had eaten rat poison. Old baits still sit in sheds.', src: 'https://theconversation.com/rat-poison-is-killing-our-beloved-native-owls-and-tawny-frogmouths-and-thats-the-tip-of-the-iceberg-212184' },
  spraying: { w: 'SPRAYING', on: true, cat: 'service', plain: 'spray weeds or pests', duty: 'Sprays weeds or pests for others', g: ['bee', 'butterfly', 'frog', 'lizard'] },
  runoff: { w: 'DETERGENT & OIL', on: true, cat: 'service', plain: 'wash detergent or oil into drains', duty: 'Detergent and oil wash into the street drains', g: ['frog', 'aquatic'], line: 'Detergent washed into a street drain ends up in the creek.', src: 'https://www.epa.vic.gov.au/sites/default/files/epa/publications/980-1.pdf' },
  light: { w: 'NIGHT LIGHT', on: true, cat: 'service', plain: 'light the night', duty: 'Lights left on at night pull insects, moths and bats off course', g: ['moth', 'bat'], line: 'Bogong moths fell 99.5% from 2018 to 2021; city lights pull survivors off course.', src: 'https://www.thedailyaus.com.au/science/bogong-moths-migration-28-09-2026' },
  fashion: { w: 'NEW CLOTHING', on: true, cat: 'brand', plain: 'sell new clothing', duty: 'Sells new clothing: emissions, water and landfill', g: ['flyingfox', 'bird'], line: 'Australians buy 56 new garments a year each; 200,000 t go to landfill.', src: 'https://australiainstitute.org.au/post/australians-revealed-as-worlds-biggest-fashion-consumers-fuelling-waste-crisis/' },
  fibres: { w: 'MICROFIBRES', on: true, cat: 'service', plain: 'wash plastic fibres into drains', duty: 'Synthetic washes shed plastic fibres into the drains', g: ['aquatic', 'waterbird'], line: 'One 6 kg acrylic wash can shed 728,789 plastic fibres.', src: 'https://www.sciencedaily.com/releases/2016/10/161003103651.htm' },
  repair: { w: 'REPAIR', cat: 'circular', plain: 'repair', duty: 'Keeps clothes, bikes and tools in use', g: ['flyingfox', 'turtle'] },
  reuse: { w: 'REUSE', cat: 'circular', plain: 'reuse', duty: 'A second life for clothes, toys and tools', g: ['turtle', 'waterbird'] },
  coop: { w: 'REFILL', cat: 'circular', plain: 'refill', duty: 'Refill and bulk: no packaging to lose', g: ['turtle'] },
  market: { w: 'MARKET', cat: 'circular', plain: 'market', duty: 'Local growers and makers, once a week', g: ['bee'] },
  grower: { w: 'GROWER', cat: 'circular', plain: 'grow plants', duty: 'Grows plants for pollinators and shade', g: ['bee', 'butterfly', 'plant'] },
  label: { w: 'LOCAL LABEL', cat: 'brand', plain: 'local labels', duty: 'Small runs, known makers, traceable cloth', g: ['flyingfox'] },
  studio: { w: 'STUDIO', cat: 'artists', plain: 'studios', duty: 'Designers and makers who can take a brief', g: [] },
  space: { w: 'ARTIST SPACE', cat: 'artists', plain: 'artist spaces', duty: 'Walls for posters, rooms for cool hours', g: ['possum', 'human'] },
  third: { w: 'THIRD SPACE', cat: 'third', plain: 'third spaces', duty: 'A room open to all: cool hours, a place to meet', g: ['human', 'possum'] },
  network: { w: 'NETWORK', cat: 'network', plain: 'networks', duty: 'Reaches many people at once', g: [] },
  owner: { w: 'OWNER-RUN', cat: 'service', plain: 'owner-run', duty: 'Decided on site, in a day', g: [] },
  popup: { w: 'POP-UP', cat: 'service', plain: 'pop-ups', duty: 'Empty shopfronts, short leases, fast change', g: [] },
  vet: { w: 'VET', cat: 'service', plain: 'vets', duty: 'Desexing before four months ends laneway litters', g: ['bird', 'lizard'] },
  pets: { w: 'PETS', cat: 'service', plain: 'pet shops', duty: 'Pets and pet supplies', g: [] },
};
/* What harms each kind of life from the shops and trades around it: the card counts these in its radius,
   and a thin thread runs from the life to each one. */
window.DA_PRESSURES = {
  frog: ['takeaway', 'bottles', 'litter', 'paint', 'poison', 'spraying', 'runoff'], turtle: ['takeaway', 'bottles', 'litter', 'runoff', 'paint'],
  waterbird: ['takeaway', 'bottles', 'litter', 'runoff', 'fibres'], aquatic: ['bottles', 'litter', 'runoff', 'paint', 'fibres'], dragonfly: ['runoff', 'paint', 'poison', 'spraying'],
  owl: ['poison', 'light'], raptor: ['poison'], bird: ['poison', 'spraying', 'takeaway'], parrot: ['spraying', 'poison'],
  lizard: ['poison', 'spraying'], snake: ['poison', 'spraying'], bee: ['poison', 'spraying'], butterfly: ['poison', 'spraying'], fly: ['poison', 'spraying'],
  wasp: ['poison', 'spraying'], beetle: ['poison', 'spraying'], bug: ['poison', 'spraying'], grasshopper: ['poison', 'spraying'], mantis: ['poison', 'spraying'],
  moth: ['light', 'poison'], bat: ['light', 'poison'], spider: ['poison', 'spraying'], orb: ['poison', 'spraying', 'light'], snail: ['poison', 'spraying'], segmented: ['poison', 'spraying', 'paint'],
  possum: ['poison', 'light'], mammal: ['poison', 'takeaway'], rodent: ['poison', 'takeaway'], macropod: ['takeaway', 'litter'], flyingfox: ['light', 'fashion'],
  fox: ['takeaway', 'litter'], cat: [], dog: ['poison'], rabbit: ['poison'], plant: ['spraying', 'paint'], fungi: ['spraying', 'poison'], human: [], ape: ['fashion', 'bottles'], paw: ['poison', 'takeaway', 'litter'],
};
/* The human ecology, in six parts, each with its own small, real sound in the song: a sleeve brushing for brands,
   two taps of a tool for the circular economy, a cup set down for services, a pencil for artists, a hum for a third space,
   two people humming for a network. */
window.DA_FAMILIES = {
  brand: { w: 'BRAND', sound: 'swish' }, circular: { w: 'CIRCULAR', sound: 'taps' }, service: { w: 'SERVICE', sound: 'cup' },
  artists: { w: 'ARTISTS', sound: 'pencil' }, third: { w: 'THIRD SPACE', sound: 'hum' }, network: { w: 'NETWORK', sound: 'hums' }, people: { w: 'PEOPLE', sound: 'breath' },
};

/* The El Niño outlook for Melbourne, month by month, for twelve months at most.
   lv: 0–4, this archive's reading of the danger (not an official warning). h: f = forecast by the Bureau (three months),
   m = modelled (El Niño persisting through summer into autumn), p = possible (no outlook issued yet).
   windows: the unseasonable stretches, when heat and dry arrive at the wrong moment for lives that can't adapt in time. */
window.DA_OUTLOOK = {
  start: [2026, 9],
  lv: [1, 2, 3, 4, 4, 3, 2, 1, 1, 1, 1, 1],
  h: ['f', 'f', 'f', 'm', 'm', 'm', 'p', 'p', 'p', 'p', 'p', 'p'],
  say: {
    f: 'Warmer days and nights, likely drier (60–80% chance of below-average rain).',
    m: 'Warmer than average as El Niño peaks and persists into autumn.',
    p: 'No outlook issued yet. Drought and canopy loss carry on after the heat.',
  },
  windows: [
    { a: 9, b: 10, w: 'EARLY HEAT', why: 'Hot days arrive as flying-fox pups are born and birds are nesting.', g: ['flyingfox', 'bird', 'parrot', 'possum', 'owl'] },
    { a: 10, b: 0, w: 'DRY FLOWERING', why: 'Rain fails as flowering peaks: less nectar for bees, birds and bats.', g: ['bee', 'butterfly', 'moth', 'fly', 'parrot', 'flyingfox'] },
    { a: 11, b: 1, w: 'HOT NIGHTS', why: 'Unusually warm nights leave no cool hours to recover in.', g: ['human', 'possum', 'flyingfox', 'bat'] },
    { a: 0, b: 2, w: 'DROUGHT', why: 'Soil and ponds dry out; old trees shed limbs and the canopy thins.', g: ['plant', 'frog', 'dragonfly', 'turtle', 'waterbird', 'fungi'] },
  ],
  /* what is normal: Melbourne (Olympic Park), 2013–2026: days of 35° or more, January to December */
  hot35: [3.4, 2.1, 0.9, 0, 0, 0, 0, 0, 0, 0.1, 0.5, 2.2],
  src: [
    ['BoM long-range forecast, Oct–Dec 2026 (1 Oct)', 'https://www.bom.gov.au/video/long-range-forecast-october-to-december-2026'],
    ['BoM: likely the strongest El Niño on record (Sep 2026)', 'https://www.bom.gov.au/news-and-media/el-nino-strength-doesnt-always-match-impact-on-australia'],
    ['Southern Victoria: 60–80% chance of below-average rain', 'https://reneweconomy.com.au/september-was-australias-second-hottest-on-record-and-second-driest-in-the-east-bom-data-shows/'],
    ['WMO: El Niño persists through February 2027', 'https://wmo.int/news/media-centre/el-nino-set-become-very-strong-raising-risks-of-extreme-weather-2027'],
    ['Agriculture Victoria: warmer Jan–Mar 2027', 'https://agriculture.vic.gov.au/support-and-resources/newsletters/the-break/the-fast-break-victoria'],
    ['Melbourne climate statistics', 'https://www.bom.gov.au/climate/averages/tables/cw_086338_All.shtml'],
  ],
};

/* Tree canopy where a record is: the share of ground under trees, by suburb where it is measured, else by council.
   streets: the share under street trees alone (Merri-bek, 2016). */
/* What canopy should be: cooling rises sharply above about 40% cover at the scale of a city block (Ziter et al., PNAS 2019). */
window.DA_CANOPY_TARGET = { pc: 40, src: 'https://www.pnas.org/doi/10.1073/pnas.1817561116' };

window.DA_CANOPY = {
  'BRUNSWICK': { pc: 14, streets: 1.7, yr: 2016, by: 'MERRI-BEK' }, 'BRUNSWICK EAST': { pc: 14, streets: 2.1, yr: 2016, by: 'MERRI-BEK' }, 'BRUNSWICK WEST': { pc: 14, streets: 1.6, yr: 2016, by: 'MERRI-BEK' },
  'FITZROY': { pc: 11, yr: 2014 }, 'FITZROY NORTH': { pc: 17, yr: 2014 }, 'CARLTON NORTH': { pc: 12, yr: 2014 }, 'PRINCES HILL': { pc: 15, yr: 2014 }, 'CLIFTON HILL': { pc: 18, yr: 2014 }, 'COLLINGWOOD': { pc: 8, yr: 2014 },
  'PARKVILLE': { pc: 20, yr: 2015 },
  'CARLTON': { pc: 22, yr: 2012, by: 'CITY OF MELBOURNE' }, 'NORTH MELBOURNE': { pc: 22, yr: 2012, by: 'CITY OF MELBOURNE' }, 'WEST MELBOURNE': { pc: 22, yr: 2012, by: 'CITY OF MELBOURNE' }, 'KENSINGTON': { pc: 22, yr: 2012, by: 'CITY OF MELBOURNE' },
  'MELBOURNE': { pc: 22, yr: 2012, by: 'CITY OF MELBOURNE' }, 'EAST MELBOURNE': { pc: 22, yr: 2012, by: 'CITY OF MELBOURNE' }, 'DOCKLANDS': { pc: 22, yr: 2012, by: 'CITY OF MELBOURNE' }, 'SOUTHBANK': { pc: 22, yr: 2012, by: 'CITY OF MELBOURNE' },
  'FLEMINGTON': { pc: 15, yr: 2018, by: 'MELBOURNE' },
  src: [
    ['Merri-bek Urban Forest Strategy', 'https://www.merri-bek.vic.gov.au/globalassets/website-merri-bek/special-blocks/accordions/living-merri-bek/environment/urban-forest-strategy-2017.pdf'],
    ['Yarra Urban Forest Strategy', 'https://www.yarracity.vic.gov.au/sites/default/files/2024-04/urban_forest_strategy.pdf'],
    ['Parkville Urban Forest Precinct Plan', 'https://mvga-prod-files.s3.ap-southeast-4.amazonaws.com/public/2024-05/ufpp-parkville-precinct.pdf'],
    ['City of Melbourne Urban Forest Strategy', 'https://aiph.org/green-city-case-studies/melbourne-australia-urban-forestry/'],
    ["Melbourne's vegetation, heat and land use data", 'https://www.planning.vic.gov.au/guides-and-resources/Data-spatial-and-insights/melbournes-vegetation-heat-and-land-use-data'],
  ],
};

/* Water a life can reach: the creeks, the river and the wetlands, traced from the map (to within about a hundred metres). */
window.DA_WATERS = {
  lines: [
    ['Merri Creek', [[-37.7480, 144.9805], [-37.7545, 144.9822], [-37.7605, 144.9840], [-37.7661, 144.9857], [-37.7722, 144.9868], [-37.7785, 144.9890], [-37.7830, 144.9915], [-37.7880, 144.9955], [-37.7935, 144.9985], [-37.7985, 145.0000]]],
    ['Moonee Ponds Creek', [[-37.7480, 144.9295], [-37.7600, 144.9330], [-37.7720, 144.9365], [-37.7820, 144.9385], [-37.7880, 144.9395], [-37.7950, 144.9375], [-37.8040, 144.9370], [-37.8130, 144.9400]]],
    ['the Yarra', [[-37.8215, 144.9400], [-37.8205, 144.9560], [-37.8198, 144.9650], [-37.8185, 144.9740], [-37.8215, 144.9830], [-37.8230, 144.9900]]],
  ],
  points: [['Trin Warren Tam-boore wetland', -37.7813, 144.9433], ['Carlton Gardens ponds', -37.8045, 144.9705], ['Fitzroy Gardens ponds', -37.8130, 144.9800]],
};

/* What each kind of life needs nearby, and what threatens it there: three readings on its card, each counted inside its radius.
   flowers: nectar plants recorded · fruit: fruit trees and figs · insects · plants · prey: rats, mice and possums · hollows: old gums
   kinds: kinds of life · pollinators · cool: cool rooms · checkins: people checking on each other · water: nearest creek or wetland
   canopy: the suburb's share under trees · threats: cats, poison (baits and sprays), light, litter, runoff, fibres, wildlife (lives a hunter reaches) */
window.DA_NEEDS = {
  orb: ['insects', 'canopy', 'poison'], spider: ['insects', 'canopy', 'poison'],
  bee: ['flowers', 'water', 'poison'], butterfly: ['flowers', 'canopy', 'poison'], fly: ['flowers', 'water', 'poison'], wasp: ['flowers', 'insects', 'poison'],
  moth: ['flowers', 'canopy', 'light'], beetle: ['plants', 'canopy', 'poison'], bug: ['plants', 'flowers', 'poison'], grasshopper: ['plants', 'water', 'poison'],
  mantis: ['insects', 'plants', 'poison'], dragonfly: ['water', 'insects', 'runoff'], snail: ['plants', 'water', 'poison'], segmented: ['canopy', 'water', 'plants'],
  bird: ['water', 'insects', 'cats'], parrot: ['flowers', 'water', 'cats'], waterbird: ['water', 'litter', 'runoff'], owl: ['hollows', 'prey', 'poison'], raptor: ['prey', 'hollows', 'poison'],
  flyingfox: ['flowers', 'fruit', 'canopy'], bat: ['insects', 'hollows', 'light'], possum: ['canopy', 'hollows', 'cats'], mammal: ['canopy', 'water', 'cats'],
  macropod: ['canopy', 'water', 'cats'], rodent: ['water', 'canopy', 'poison'], rabbit: ['plants', 'canopy', 'cats'],
  fox: ['wildlife', 'litter', 'cats'], cat: ['wildlife', 'cats', 'kinds'], dog: ['canopy', 'water', 'wildlife'],
  lizard: ['canopy', 'insects', 'cats'], snake: ['water', 'canopy', 'prey'], turtle: ['water', 'litter', 'runoff'], frog: ['water', 'insects', 'runoff'], aquatic: ['water', 'litter', 'fibres'],
  plant: ['pollinators', 'canopy', 'kinds'], fungi: ['canopy', 'water', 'kinds'], human: ['canopy', 'cool', 'checkins'], paw: ['canopy', 'water', 'cats'], ape: ['canopy', 'fibres', 'kinds'],
};

/* The five in greatest need of an El Niño response here, each where past sightings say it lives.
   home: places it is known from, used when there are too few sightings to draw its home from. move: how it moves on the map. */
window.DA_HEROES = [
  { id: 'flyingfox', n: 'Pteropus poliocephalus', cn: 'Grey-headed Flying-fox', ic: 'Mammalia', th: true, move: 'flap', brief: 'B06',
    why: 'Vulnerable. About 1,000 pups died of heat at Yarra Bend in one week in January 2026.',
    st: 'Vulnerable. About 1,000 pups died of heat at Yarra Bend in one week in January 2026. In dry heat over 38°C a camp can collapse within hours; flowering trees, water and quiet nights carry them through.', home: [[-37.7880, 144.9530], [-37.7850, 144.9622], [-37.7905, 144.9840]] },
  { id: 'ringtail', n: 'Pseudocheirus peregrinus', cn: 'Common Ringtail Possum', ic: 'Mammalia', move: 'climb', brief: 'B03',
    why: 'More prone to heat stress than brushtails; found on the ground by day in heatwaves.',
    st: 'Ringtails feel heat sooner than brushtails, and in a heatwave they come down to the ground by day, exhausted. Dense canopy, a shallow bowl of water and cats kept in at night carry them through.', home: [[-37.7686, 144.9655], [-37.7632, 144.9468], [-37.7830, 144.9660]] },
  { id: 'bogong', n: 'Agrotis infusa', cn: 'Bogong Moth', ic: 'Insecta', th: true, move: 'flutter', brief: 'B26',
    why: 'Endangered. Numbers fell 99.5% from 2018 to 2021; city lights pull the survivors off course.',
    st: 'Endangered. Bogong moth numbers fell 99.5% from 2018 to 2021, and city lights pull the survivors off course. Lights off after 10 pm on spring and autumn nights help them find their way.', home: [[-37.7680, 144.9612], [-37.7760, 144.9605], [-37.8136, 144.9631]] },
  { id: 'turtle', n: 'Chelodina longicollis', cn: 'Eastern Long-necked Turtle', ic: 'Reptilia', move: 'walk', brief: 'B15',
    why: 'As wetlands dry, turtles walk the roads looking for water, and die on them.',
    st: 'As wetlands dry, long-necked turtles walk the roads looking for water, and many die on them. Slow driving near the creek and water kept in its wetlands give them a way through the drought.', home: [[-37.7790, 144.9850], [-37.7700, 144.9862], [-37.7620, 144.9842]] },
  { id: 'froglet', n: 'Crinia signifera', cn: 'Common Eastern Froglet', ic: 'Amphibia', move: 'hop', brief: 'B14',
    why: 'Breathes through its skin. When ponds and drains dry, so does it.',
    st: 'The froglet breathes through its skin, so when ponds and drains dry, so does it. A permanent pond, and drains kept free of soap and oil, keep it calling through an El Niño summer.', home: [[-37.7716, 144.9838], [-37.7813, 144.9433], [-37.7880, 144.9395]] },
];

/* Groups already caring for a patch of ground: shown on STORIES as the patches they care for.
   zone: a line it follows (a water's name), a few places (lat, lng, metres), an area (corners), or gardens scattered across an area. */
window.DA_TRIBES = [
  { id: 'T01', n: 'Friends of Royal Park', kind: 'park', w: 'GRASSLAND · WETLAND', what: 'Planting, weeding and growing indigenous seedlings; bird counts at the Trin Warren Tam-boore wetlands since 2007.',
    when: 'Working bees on the 2nd and 4th Thursday, 10 am to noon', link: 'https://royalpark.org.au/activities', g: ['bird', 'frog', 'moth', 'bee', 'plant'], briefs: ['B13', 'B21', 'B28'],
    zone: { area: [[-37.7768, 144.9442], [-37.7768, 144.9572], [-37.7985, 144.9572], [-37.7985, 144.9442]], n: 34, r: [70, 150] } },
  { id: 'T02', n: 'Friends of Moonee Ponds Creek', kind: 'creek', w: 'CREEK CORRIDOR', what: 'Plantings, Frog Watch and bird counts along the creek since 1989, with Chain of Ponds.',
    when: '', link: 'https://www.mooneepondscreek.org.au/', g: ['frog', 'waterbird', 'dragonfly', 'turtle', 'plant'], briefs: ['B11', 'B14', 'B17'], zone: { line: 'Moonee Ponds Creek', w: 110 } },
  { id: 'T03', n: 'Friends of Merri Creek', kind: 'creek', w: 'CREEK CORRIDOR', what: 'Planting and site care, bird surveys, water testing and litter blitzes along the Merri.',
    when: '', link: 'https://www.friendsofmerricreek.org.au/', g: ['frog', 'turtle', 'waterbird', 'bird', 'plant'], briefs: ['B18', 'B16', 'B15'], zone: { line: 'Merri Creek', w: 120 } },
  { id: 'T04', n: 'CERES', kind: 'farm', w: 'URBAN FARM', what: 'A 4.5-hectare former bluestone quarry, a community park, urban farm and nursery since 1982.',
    when: '', link: 'https://ceres.org.au/', g: ['bee', 'bird', 'frog', 'plant'], briefs: ['B34', 'B31', 'B35'], zone: { pts: [[-37.7661, 144.9839, 120], [-37.7674, 144.9822, 95], [-37.7650, 144.9827, 85], [-37.7666, 144.9812, 70]] } },
  { id: 'T05', n: 'West Brunswick Community Garden and Food Forest', kind: 'farm', w: 'FOOD FOREST', what: 'Over 100 trees and plants in a permaculture food forest, with bushfood, an orchard and 26 plots.',
    when: '', link: 'https://localfoodconnect.org.au/community-gardening/west-brunswick-community-garden-and-food-forest/', g: ['bee', 'bird', 'plant'], briefs: ['B32', 'B31', 'B19'], zone: { pts: [[-37.7618, 144.9452, 85], [-37.7626, 144.9440, 60], [-37.7611, 144.9462, 55]] } },
  { id: 'T06', n: 'Gardens for Wildlife Merri-bek', kind: 'gardens', w: 'BACKYARD HABITAT', what: 'Free one-hour garden visits by volunteer Garden Guides, with ten indigenous plants to start.',
    when: '', link: 'https://www.merri-bek.vic.gov.au/living-in-merri-bek/environment/nature/gardens-for-wildlife/', g: ['bird', 'lizard', 'bee', 'orb', 'spider', 'frog'], briefs: ['B24', 'B45', 'B23'],
    zone: { scatter: [[-37.7560, 144.9425], [-37.7742, 144.9790]], n: 52, r: [30, 62] } },
];

/* The machines a signal leaves through, each linked to what it is: receipt printers, a pocket thermal printer,
   the Game Boy Printer, a LoRa mesh radio, a pager, a QR code. */
window.DA_OUTPUTS = [
  { k: 'print', ic: 'roll', w: '58 MM', ref: 'https://en.wikipedia.org/wiki/Thermal_printing', tip: 'Any 58 mm receipt printer, from the browser' },
  { k: 'escpos', ic: 'epson', w: 'ESC/POS', ref: 'https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/index.html', tip: 'Raw bytes for a receipt printer' },
  { k: 'bits', ic: 'catprinter', w: '1-BIT', ref: 'https://en.wikipedia.org/wiki/Thermal_printing', tip: '384 dots for a pocket thermal printer' },
  { k: 'gb', ic: 'gbprinter', w: 'GAME BOY', ref: 'https://en.wikipedia.org/wiki/Game_Boy_Printer', tip: '160 pixels in four greys, as the 1998 Game Boy Printer printed' },
  { k: 'mesh', ic: 'lora', w: 'MESH', ref: 'https://meshtastic.org/', tip: '200 bytes over a LoRa mesh radio' },
  { k: 'pager', ic: 'pager', w: 'PAGER', ref: 'https://en.wikipedia.org/wiki/Pager', tip: '80 characters for a pager' },
  { k: 'link', ic: 'qr', w: 'LINK', ref: 'https://en.wikipedia.org/wiki/QR_code', tip: 'The whole signal in a link' },
];

/* Where the gigs are listed. A gathering in the events sheet tagged rrr or ra carries that listing's name; gig marks any gig. */
window.DA_GIGS = { rrr: { w: 'RRR', n: 'Triple R gig guide', url: 'https://www.rrr.org.au/events?calendar_ids%5B%5D=2' }, ra: { w: 'RA', n: 'Resident Advisor, Melbourne', url: 'https://ra.co/events/au/melbourne' } };
