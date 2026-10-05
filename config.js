/* ════════════════════════════════════════════════════════════════════
   DIRECT ACTION — settings. The only file you need to edit (with demo.js, the specimen records).
   ════════════════════════════════════════════════════════════════════ */
window.DA_CONFIG = {
  NAME: 'DIRECT ACTION',
  BY: 'novel.global',
  DEMO: true,                                                       // load the specimen stories, partners and community records in demo.js
  BBOX: { s: -37.823, w: 144.925, n: -37.748, e: 145.000 },      // Brunswick to the city
  TERRAIN_EXAGGERATION: 3,
  DAYS: 45,                                                         // sightings from the last 45 days; after three weeks a sighting goes cold (grey)
  PAGES: 5,                                                         // × 200 sightings
  HISTORY: { years: 2, days: 21, per: 200 },                        // the same weeks in past years, as dotted rings: what has been here at this time before
  INAT_API: 'https://api.inaturalist.org/v1',
  INAT_WEB: 'https://www.inaturalist.org/observations/',
  PLACE_PREF: 6744,                                                 // iNaturalist place id for Australia (common names)
  // The ground: satellite imagery on the land's relief, always.
  IMAGERY: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxzoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics', note: 'free to view with credit; not open data' },
  DEM_URL: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  WEATHER_URL: 'https://api.open-meteo.com/v1/forecast?latitude=-37.775&longitude=144.962&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Australia%2FMelbourne&forecast_days=16',
  OVERPASS: ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'],
  // City of Melbourne open data, shown on NOW on a hot day where it can be reached: drinking water and live air temperature.
  OVERLAYS: [
    { id: 'water', label: 'Drinking fountains', dataset: 'drinking-fountains', kind: 'water' },
    { id: 'sensors', label: 'Microclimate sensors, air temperature now', dataset: 'microclimate-sensors-data', kind: 'temp', query: 'order_by=received_at%20desc&limit=100' },
  ],
  OVERLAY_API: 'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/',
  RADIUS: { min: 50, max: 1500 },                                   // the radius instrument, in metres
  PORTAL_URL: '',                                                   // where it is hosted (QR codes point here)
  EVENTS_URL: '',                                                   // a sheet of gatherings published as CSV: title, start, venue, lat, lng, tags, link (README)
  VIDEO_URL: '',
  REPO_URL: '',
  ELNINO: 'EL NIÑO 2026–27',
  CHALLENGE: { until: '2026-11-05' },                               // the brief on NOW: time left to get every street ready before the heat season
  EMERGENCY: 'WILDLIFE VICTORIA (03) 8400 7300 · EMERGENCY 000',
  COUNTRY: 'WURUNDJERI WOI-WURRUNG COUNTRY',
  VALID_DAYS: 90,
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

/* The danger, in one plain sentence per kind of life: what heat and drought do to it. Printed on the poster under THE DANGER. */
window.DA_DANGER = {
  bird: 'Small birds lose water fast. In extreme heat they can die of thirst in hours.',
  parrot: 'In extreme heat, parrots and cockatoos die in numbers where the water runs dry.',
  waterbird: 'Warm, shrinking water breeds botulism. Waterbirds die in it.',
  owl: 'Owls sit out the hottest hours on the roost. Disturbed in heat, they lose water they cannot spare.',
  raptor: 'Drought thins out the prey that raptors raise their young on.',
  mammal: 'Small mammals have nowhere to cool down. Without shade and water, heat kills them.',
  macropod: 'They cool down by licking their forearms. Without shade and water, the heat wins.',
  possum: 'Possums struggle above 35°. Ringtails die in numbers in long heatwaves.',
  flyingfox: 'At 42°, flying-foxes fall from the trees and die in their camps.',
  bat: 'Microbats roost in roofs and hollows that turn into ovens in a heatwave.',
  rodent: 'Bare, dry ground leaves small native rodents nowhere cool to hide.',
  fox: 'In drought, foxes hunt harder. Wildlife weakened by heat is easy prey.',
  cat: 'Cats out after dark kill wildlife already weakened by the heat.',
  dog: 'Hot cars and hot ground kill dogs. A lost dog dehydrates fast.',
  rabbit: 'Rabbits cannot sweat. Above 30° they suffer heatstroke.',
  lizard: 'Lizards can only cool down by hiding. Without rocks, logs and litter, heat kills them.',
  snake: 'Thirsty snakes come into gardens and houses looking for water and shade.',
  turtle: 'As wetlands dry, turtles walk the roads looking for water, and die on them.',
  frog: 'Frogs breathe through their skin. When ponds and drains dry, so do they.',
  butterfly: 'Heat withers the flowers butterflies feed on and the plants their caterpillars need.',
  moth: 'Hot nights and fewer flowers starve moths, and the bats and birds that eat them.',
  bee: 'Bees carry water to cool the nest. In a heatwave without water, the colony fails.',
  wasp: 'Drought dries up the flowers and insects that wasps live on.',
  fly: 'Hoverflies pollinate too. Drought takes their flowers and their water.',
  beetle: 'Beetles live in leaf litter and soil that the heat bakes dry.',
  bug: 'When drought dries the plants out, the bugs that feed on their sap crash.',
  spider: 'Spiders shelter by day and dry out without cover. Hot wind tears their webs.',
  orb: 'Orb-weavers rebuild their webs every night. Drought starves them of insects.',
  grasshopper: 'Grasshoppers need green grass. Drought and mowing leave none.',
  mantis: 'Drought takes the insects mantises eat and the cover they hide in.',
  dragonfly: 'Dragonfly young live in water for months. When a pond dries, a generation dies.',
  aquatic: 'Warm, low water holds little oxygen. Fish and water life suffocate in it.',
  snail: 'Snails seal themselves in to wait out the dry. A long drought outlasts them.',
  segmented: 'Earthworms die when the soil dries and heats. Without them the ground stops drinking.',
  fungi: 'Fungi need damp ground. In drought they stop fruiting, and the trees they feed go thirsty.',
  plant: 'Drought kills trees slowly, and the shade and shelter of every life goes with them.',
  human: 'Heatwaves kill more Australians than any other natural hazard. People alone are most at risk.',
  paw: 'Heat and drought take water, food and shade from every animal here.',
  ape: 'El Niño dries Sumatra and Borneo; fires and smoke drive orangutans out of their forests.',
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

/* What each business does to the lives around it, in big and small ways.
   ON NOTICE: what it sells or does leaves something in its radius. TO BACK: the places that repair, reuse, make and host.
   g: the kinds of life it touches most; line: one fact, sourced. */
window.DA_ROLES = {
  litter: { w: 'SINGLE-USE', on: true, duty: 'Responsible for the litter in this radius', g: ['turtle', 'waterbird', 'rodent'], line: "Soft plastic is the Merri's most common litter: 9,308 pieces in 2024.", src: 'https://mcmc.org.au/images/MCMC-Publications/Waterway-Health-Reports/Rapid_Response_to_Litter_MCMC_Litter_Report_2024.pdf' },
  fashion: { w: 'NEW CLOTHING', on: true, duty: 'Overconsumption, emissions and landfill', g: ['flyingfox', 'bird'], line: 'Australians buy 56 new garments a year each; 200,000 t go to landfill.', src: 'https://australiainstitute.org.au/post/australians-revealed-as-worlds-biggest-fashion-consumers-fuelling-waste-crisis/' },
  fibres: { w: 'MICROFIBRES', on: true, duty: 'Plastic fibres from every synthetic wash', g: ['aquatic', 'waterbird'], line: 'One 6 kg acrylic wash can shed 728,789 plastic fibres.', src: 'https://www.sciencedaily.com/releases/2016/10/161003103651.htm' },
  poison: { w: 'BAITS & SPRAYS', on: true, duty: 'Rat baits, snail pellets and sprays that travel up the food chain', g: ['owl', 'raptor', 'lizard', 'orb'], line: '92% of dead owls and frogmouths tested had eaten rat poison. Old baits still sit in sheds.', src: 'https://theconversation.com/rat-poison-is-killing-our-beloved-native-owls-and-tawny-frogmouths-and-thats-the-tip-of-the-iceberg-212184' },
  light: { w: 'NIGHT LIGHT', on: true, duty: 'Light that pulls moths and bats off course', g: ['moth', 'bat'], line: 'Bogong moths fell 99.5% from 2018 to 2021; city lights pull survivors off course.', src: 'https://www.thedailyaus.com.au/science/bogong-moths-migration-28-09-2026' },
  runoff: { w: 'RUNOFF', on: true, duty: 'Detergent and oil in the drains', g: ['frog', 'aquatic'], line: 'Detergent washed into a street drain ends up in the creek.', src: 'https://www.epa.vic.gov.au/sites/default/files/epa/publications/980-1.pdf' },
  pets: { w: 'ROAMING CATS', on: true, duty: 'Cats out at night', g: ['bird', 'lizard', 'possum'], line: "Each roaming pet cat kills about 110 native animals a year. Merri-bek's curfew starts April 2027.", src: 'https://www.nespthreatenedspecies.edu.au/news-and-media/media-releases/each-roaming-pet-cat-kills-110-native-animals-per-year-on-average' },
  repair: { w: 'REPAIR', duty: 'Keeps clothes, bikes and fans in use', g: ['flyingfox', 'turtle'] },
  reuse: { w: 'REUSE', duty: 'A second life for clothes, toys and tools', g: ['turtle', 'waterbird'] },
  label: { w: 'LOCAL LABEL', duty: 'Small runs, known makers, traceable cloth', g: ['flyingfox'] },
  studio: { w: 'STUDIO', duty: 'Designers and makers who can take a brief', g: [] },
  space: { w: 'ARTIST SPACE', duty: 'Walls for posters, rooms for cool hours', g: ['possum', 'human'] },
  coop: { w: 'CO-OP', duty: 'Refill and bulk: no packaging to lose', g: ['turtle'] },
  owner: { w: 'OWNER-RUN', duty: 'Decided on site, in a day', g: [] },
  market: { w: 'MARKET', duty: 'Local growers and makers, once a week', g: ['bee'] },
  popup: { w: 'POP-UP', duty: 'Empty shopfronts, short leases, fast change', g: [] },
  grower: { w: 'GROWER', duty: 'Indigenous plants for pollinators and shade', g: ['bee', 'butterfly', 'plant'] },
  vet: { w: 'VET', duty: 'Desexing before four months ends laneway litters', g: ['bird', 'lizard'] },
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
  { id: 'flyingfox', n: 'Pteropus poliocephalus', cn: 'Grey-headed Flying-fox', ic: 'Mammalia', th: true, move: 'flap', brief: 'B33',
    why: 'Vulnerable. About 1,000 pups died of heat at Yarra Bend in one week in January 2026.', home: [[-37.7880, 144.9530], [-37.7850, 144.9622], [-37.7905, 144.9840]] },
  { id: 'ringtail', n: 'Pseudocheirus peregrinus', cn: 'Common Ringtail Possum', ic: 'Mammalia', move: 'climb', brief: 'B03',
    why: 'More prone to heat stress than brushtails; found on the ground by day in heatwaves.', home: [[-37.7686, 144.9655], [-37.7632, 144.9468], [-37.7830, 144.9660]] },
  { id: 'bogong', n: 'Agrotis infusa', cn: 'Bogong Moth', ic: 'Insecta', th: true, move: 'flutter', brief: 'B26',
    why: 'Endangered. Numbers fell 99.5% from 2018 to 2021; city lights pull the survivors off course.', home: [[-37.7680, 144.9612], [-37.7760, 144.9605], [-37.8136, 144.9631]] },
  { id: 'turtle', n: 'Chelodina longicollis', cn: 'Eastern Long-necked Turtle', ic: 'Reptilia', move: 'walk', brief: 'B15',
    why: 'As wetlands dry, turtles walk the roads looking for water, and die on them.', home: [[-37.7790, 144.9850], [-37.7700, 144.9862], [-37.7620, 144.9842]] },
  { id: 'froglet', n: 'Crinia signifera', cn: 'Common Eastern Froglet', ic: 'Amphibia', move: 'hop', brief: 'B14',
    why: 'Breathes through its skin. When ponds and drains dry, so does it.', home: [[-37.7716, 144.9838], [-37.7813, 144.9433], [-37.7880, 144.9395]] },
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

/* Where the gigs are listed. A gathering in the events sheet tagged rrr or ra carries that listing's name; gig marks any gig. */
window.DA_GIGS = { rrr: { w: 'RRR', n: 'Triple R gig guide', url: 'https://www.rrr.org.au/events?calendar_ids%5B%5D=2' }, ra: { w: 'RA', n: 'Resident Advisor, Melbourne', url: 'https://ra.co/events/au/melbourne' } };
