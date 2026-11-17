/* GymPilot — dati app Leonardo Sportiello */
const TARGETS = { kcal: 2500, p: 162, c: 312, f: 66 };

const FOOD = {
  avena:{name:'Fiocchi d’avena',category:'Cereali e pane',unit:'g',per:100,kcal:389,p:16.9,c:66.3,f:6.9},
  skyr:{name:'Skyr senza lattosio',category:'Proteine e latticini',unit:'g',per:100,kcal:60,p:11,c:4,f:0.2},
  yogurt:{name:'Yogurt greco senza lattosio',category:'Proteine e latticini',unit:'g',per:100,kcal:73,p:9,c:4,f:2},
  banana:{name:'Banana',category:'Frutta e verdura',unit:'g',per:100,kcal:89,p:1.1,c:23,f:0.3},
  mela:{name:'Mela',category:'Frutta e verdura',unit:'g',per:100,kcal:52,p:0.3,c:14,f:0.2},
  pera:{name:'Pera',category:'Frutta e verdura',unit:'g',per:100,kcal:57,p:0.4,c:15,f:0.1},
  arancia:{name:'Arancia',category:'Frutta e verdura',unit:'g',per:100,kcal:47,p:0.9,c:12,f:0.1},
  bosco:{name:'Frutti di bosco',category:'Frutta e verdura',unit:'g',per:100,kcal:50,p:1,c:12,f:0.5},
  kiwi:{name:'Kiwi',category:'Frutta e verdura',unit:'g',per:100,kcal:61,p:1.1,c:15,f:0.5},
  noci:{name:'Noci',category:'Condimenti e extra',unit:'g',per:100,kcal:654,p:15.2,c:13.7,f:65.2},
  mandorle:{name:'Mandorle',category:'Condimenti e extra',unit:'g',per:100,kcal:579,p:21.2,c:21.6,f:49.9},
  pistacchi:{name:'Pistacchi',category:'Condimenti e extra',unit:'g',per:100,kcal:562,p:20,c:28,f:45},
  pane:{name:'Pane integrale / comune',category:'Cereali e pane',unit:'g',per:100,kcal:265,p:9,c:49,f:3.2},
  panbauletto:{name:'Pane in cassetta integrale',category:'Cereali e pane',unit:'g',per:100,kcal:250,p:8.5,c:44,f:4},
  cornflakes:{name:'Corn flakes',category:'Cereali e pane',unit:'g',per:100,kcal:357,p:7,c:84,f:0.4},
  fette:{name:'Fette biscottate',category:'Cereali e pane',unit:'g',per:100,kcal:392,p:10,c:79,f:4.5},
  marmellata:{name:'Marmellata',category:'Condimenti e extra',unit:'g',per:100,kcal:250,p:0.3,c:62,f:0.1},
  miele:{name:'Miele',category:'Condimenti e extra',unit:'g',per:100,kcal:304,p:0.3,c:82,f:0},
  burroarachidi:{name:'Burro d’arachidi',category:'Condimenti e extra',unit:'g',per:100,kcal:588,p:25,c:20,f:50},
  latte:{name:'Latte senza lattosio',category:'Proteine e latticini',unit:'ml',per:100,kcal:47,p:3.3,c:4.9,f:1.6},
  cioccolato:{name:'Cioccolato fondente',category:'Condimenti e extra',unit:'g',per:100,kcal:545,p:4.9,c:61,f:31},
  uova:{name:'Uova',category:'Proteine e latticini',unit:'pz',per:1,kcal:78,p:6.5,c:0.6,f:5.3},
  cornetto:{name:'Cornetto Privolat classico',category:'Merendine da scuola',unit:'pz',per:1,kcal:178,p:2.8,c:24,f:7.8},
  cornettoc:{name:'Cornetto Privolat al cioccolato',category:'Merendine da scuola',unit:'pz',per:1,kcal:200,p:3,c:27,f:9},
  tortina:{name:'Tortina Privolat al cioccolato',category:'Merendine da scuola',unit:'pz',per:1,kcal:156,p:2.5,c:19,f:7.2},
  plumcake:{name:'Plumcake confezionato senza lattosio',category:'Merendine da scuola',unit:'pz',per:1,kcal:165,p:2.2,c:22,f:7},
  biscotti:{name:'Pacchetto biscotti secchi monoporzione',category:'Merendine da scuola',unit:'pz',per:1,kcal:190,p:3,c:29,f:6.5},
  piadina:{name:'Piadina',category:'Cereali e pane',unit:'g',per:100,kcal:320,p:8,c:52,f:9},
  tacchino:{name:'Petto di tacchino',category:'Carne e pesce',unit:'g',per:100,kcal:110,p:24,c:0,f:1.2},
  fesa:{name:'Fesa di tacchino affettata',category:'Carne e pesce',unit:'g',per:100,kcal:105,p:22,c:1.5,f:1.5},
  pollo:{name:'Petto di pollo',category:'Carne e pesce',unit:'g',per:100,kcal:110,p:23,c:0,f:1.5},
  tonno:{name:'Tonno al naturale sgocciolato',category:'Carne e pesce',unit:'g',per:100,kcal:116,p:26,c:0,f:1},
  salmone:{name:'Salmone',category:'Carne e pesce',unit:'g',per:100,kcal:208,p:20,c:0,f:13},
  merluzzo:{name:'Merluzzo',category:'Carne e pesce',unit:'g',per:100,kcal:82,p:18,c:0,f:0.7},
  sgombro:{name:'Sgombro al naturale sgocciolato',category:'Carne e pesce',unit:'g',per:100,kcal:170,p:24,c:0,f:8},
  manzo:{name:'Hamburger di manzo magro',category:'Carne e pesce',unit:'g',per:100,kcal:170,p:20,c:0,f:10},
  prosciutto:{name:'Prosciutto cotto alta qualità',category:'Carne e pesce',unit:'g',per:100,kcal:145,p:20,c:1.2,f:6.5},
  riso:{name:'Riso',category:'Cereali e pane',unit:'g',per:100,kcal:360,p:7,c:79,f:0.7},
  pasta:{name:'Pasta secca',category:'Cereali e pane',unit:'g',per:100,kcal:353,p:12,c:71,f:1.5},
  couscous:{name:'Cous cous secco',category:'Cereali e pane',unit:'g',per:100,kcal:376,p:12.8,c:77.4,f:0.6},
  gallette:{name:'Gallette di riso',category:'Cereali e pane',unit:'g',per:100,kcal:387,p:8,c:81,f:3},
  patate:{name:'Patate',category:'Frutta e verdura',unit:'g',per:100,kcal:77,p:2,c:17,f:0.1},
  verdure:{name:'Verdure miste',category:'Frutta e verdura',unit:'g',per:100,kcal:30,p:1.5,c:5,f:0.2},
  zucchine:{name:'Zucchine',category:'Frutta e verdura',unit:'g',per:100,kcal:17,p:1.2,c:3.1,f:0.3},
  pomodori:{name:'Pomodori',category:'Frutta e verdura',unit:'g',per:100,kcal:18,p:0.9,c:3.9,f:0.2},
  insalata:{name:'Insalata',category:'Frutta e verdura',unit:'g',per:100,kcal:15,p:1.4,c:2.9,f:0.2},
  ceci:{name:'Ceci cotti sgocciolati',category:'Legumi',unit:'g',per:100,kcal:120,p:6.5,c:18,f:2.4},
  lenticchie:{name:'Lenticchie cotte sgocciolate',category:'Legumi',unit:'g',per:100,kcal:116,p:9,c:20,f:0.4},
  olio:{name:'Olio extravergine d’oliva',category:'Condimenti e extra',unit:'g',per:100,kcal:884,p:0,c:0,f:100}
};

const meal = (title, foods, note='') => ({ title, foods, note });
const f = (...pairs) => pairs.map(([id,q])=>({ id, q }));

const MEAL_TYPES = [
  { name:'Colazione', subtitle:'Inizio giornata', icon:'☀︎', tone:'honey' },
  { name:'Spuntino scuola', subtitle:'Dolce e pratico', icon:'✦', tone:'peach' },
  { name:'Pranzo', subtitle:'Pausa pranzo', icon:'◒', tone:'mint' },
  { name:'Spuntino pomeridiano', subtitle:'Ricarica', icon:'◌', tone:'lilac' },
  { name:'Cena', subtitle:'Fine giornata', icon:'☾', tone:'blue' }
];

const WEEK_BASE = [
  { label:'Lunedì', short:'Lun', meals:[
    meal('Avena, skyr, banana e noci', f(['avena',80],['skyr',220],['banana',120],['noci',15])),
    meal('Cornetto Privolat classico', f(['cornetto',1]), 'Da portare a scuola senza preparazione.'),
    meal('Piadina al tacchino', f(['piadina',120],['tacchino',150],['insalata',80],['pomodori',80],['olio',5])),
    meal('Skyr, banana e mandorle', f(['skyr',250],['banana',120],['mandorle',15])),
    meal('Pasta con pollo e verdure', f(['pasta',100],['pollo',150],['verdure',250],['olio',10]))
  ]},
  { label:'Martedì', short:'Mar', meals:[
    meal('Pane, skyr, marmellata e banana', f(['pane',100],['skyr',220],['marmellata',25],['banana',120],['mandorle',15])),
    meal('Tortina Privolat al cioccolato', f(['tortina',1]), 'Monoporzione dolce da tenere in borsa.'),
    meal('Riso con pollo e zucchine', f(['riso',85],['pollo',180],['zucchine',250],['olio',10])),
    meal('Skyr, gallette e mela', f(['skyr',250],['gallette',45],['mela',150])),
    meal('Riso e salmone', f(['riso',90],['salmone',140],['zucchine',250],['olio',5]))
  ]},
  { label:'Mercoledì', short:'Mer', meals:[
    meal('Corn flakes, skyr e frutti di bosco', f(['cornflakes',75],['skyr',250],['bosco',150],['mandorle',15])),
    meal('Cornetto Privolat al cioccolato', f(['cornettoc',1]), 'Monoporzione dolce da portare a scuola.'),
    meal('Pasta al tonno', f(['pasta',100],['tonno',140],['pomodori',150],['olio',10])),
    meal('Pane, fesa e mela', f(['pane',90],['fesa',110],['mela',150])),
    meal('Merluzzo, patate e pane', f(['merluzzo',200],['patate',300],['pane',60],['verdure',200],['olio',10]))
  ]},
  { label:'Giovedì', short:'Gio', meals:[
    meal('Pane, skyr, burro d’arachidi e marmellata', f(['pane',90],['burroarachidi',20],['marmellata',20],['skyr',250],['latte',150])),
    meal('Tortina Privolat al cioccolato', f(['tortina',1])),
    meal('Piadina pollo e ceci', f(['piadina',100],['ceci',170],['pollo',100],['insalata',100],['pomodori',100])),
    meal('Skyr, cereali e pera', f(['skyr',220],['cornflakes',35],['pera',150])),
    meal('Uova sode e ceci', f(['uova',2],['ceci',200],['pane',90],['verdure',250],['olio',8]), 'Le uova sode restano fuori dalla colazione.')
  ]},
  { label:'Venerdì', short:'Ven', meals:[
    meal('Avena, skyr, banana e noci', f(['avena',80],['skyr',220],['banana',120],['noci',15])),
    meal('Cornetto Privolat classico', f(['cornetto',1])),
    meal('Cous cous al tacchino', f(['couscous',90],['tacchino',150],['verdure',250],['olio',10])),
    meal('Skyr, gallette e mela', f(['skyr',250],['gallette',45],['mela',150])),
    meal('Pasta al pollo', f(['pasta',100],['pollo',150],['verdure',250],['olio',10]))
  ]},
  { label:'Sabato', short:'Sab', meals:[
    meal('Avena, skyr, banana e cioccolato fondente', f(['avena',80],['skyr',200],['banana',120],['cioccolato',20])),
    meal('Cornetto Privolat al cioccolato', f(['cornettoc',1])),
    meal('Panino con pollo', f(['pane',130],['pollo',170],['insalata',80],['pomodori',80],['olio',5])),
    meal('Pane, fesa e mela', f(['pane',80],['fesa',120],['mela',150])),
    meal('Riso e manzo magro', f(['riso',75],['manzo',170],['verdure',250],['olio',10]))
  ]},
  { label:'Domenica', short:'Dom', meals:[
    meal('Corn flakes, skyr e frutti di bosco', f(['cornflakes',80],['skyr',250],['bosco',150],['mandorle',15])),
    meal('Tortina Privolat al cioccolato', f(['tortina',1])),
    meal('Pasta, lenticchie e sgombro', f(['pasta',80],['lenticchie',200],['sgombro',95],['pomodori',150],['olio',5])),
    meal('Skyr, banana e mandorle', f(['skyr',250],['banana',120],['mandorle',15])),
    meal('Merluzzo e pane', f(['merluzzo',170],['pane',140],['verdure',250],['olio',15]))
  ]}
];

const ALT_POOLS = [
  [
    meal('Pane, skyr, marmellata e noci', f(['pane',100],['skyr',220],['marmellata',25],['noci',15])),
    meal('Corn flakes, skyr, banana e mandorle', f(['cornflakes',80],['skyr',250],['banana',120],['mandorle',15])),
    meal('Avena, yogurt greco e kiwi', f(['avena',75],['yogurt',250],['kiwi',150],['burroarachidi',15])),
    meal('Fette biscottate, skyr e miele', f(['fette',60],['skyr',250],['miele',20],['banana',100],['mandorle',10])),
    meal('Pane in cassetta, marmellata e yogurt', f(['panbauletto',100],['yogurt',250],['marmellata',30],['arancia',180])),
    meal('Avena, skyr e frutti di bosco', f(['avena',80],['skyr',250],['bosco',150],['noci',15]))
  ],
  [
    meal('Cornetto Privolat classico', f(['cornetto',1]), 'Confezionato e pratico.'),
    meal('Cornetto Privolat al cioccolato', f(['cornettoc',1]), 'Confezionato e pratico.'),
    meal('Tortina Privolat al cioccolato', f(['tortina',1]), 'Confezionata e pratica.'),
    meal('Plumcake monoporzione', f(['plumcake',1]), 'Confezionato, dolce e semplice.'),
    meal('Biscotti secchi monoporzione', f(['biscotti',1]), 'Confezionati, facili da portare.')
  ],
  [
    meal('Piadina al tacchino', f(['piadina',120],['tacchino',150],['insalata',80],['pomodori',80],['olio',5])),
    meal('Pasta al tonno', f(['pasta',90],['tonno',140],['pomodori',150],['olio',10])),
    meal('Riso con pollo e zucchine', f(['riso',90],['pollo',160],['zucchine',250],['olio',10])),
    meal('Piadina con pollo', f(['piadina',120],['pollo',150],['insalata',100],['pomodori',80],['olio',5])),
    meal('Cous cous, ceci e pollo', f(['couscous',80],['ceci',180],['pollo',100],['verdure',200],['olio',5])),
    meal('Pane e prosciutto cotto', f(['pane',130],['prosciutto',120],['pomodori',150],['olio',5]))
  ],
  [
    meal('Skyr, gallette e mela', f(['skyr',250],['gallette',45],['mela',150])),
    meal('Pane, fesa e mela', f(['pane',90],['fesa',120],['mela',150])),
    meal('Skyr, banana e mandorle', f(['skyr',250],['banana',120],['mandorle',15])),
    meal('Skyr, cereali e pera', f(['skyr',250],['cornflakes',45],['pera',150])),
    meal('Pane e pollo', f(['pane',90],['pollo',120],['mela',150])),
    meal('Yogurt, kiwi e pistacchi', f(['yogurt',250],['kiwi',150],['pistacchi',15]))
  ],
  [
    meal('Pasta, pollo e verdure', f(['pasta',100],['pollo',140],['verdure',250],['olio',10])),
    meal('Pane e merluzzo', f(['pane',130],['merluzzo',200],['verdure',250],['olio',15])),
    meal('Riso, salmone e zucchine', f(['riso',90],['salmone',140],['zucchine',250],['olio',5])),
    meal('Uova sode e ceci', f(['uova',2],['ceci',200],['pane',90],['verdure',250],['olio',8])),
    meal('Patate, pollo e pane', f(['patate',300],['pollo',170],['pane',60],['verdure',200],['olio',10])),
    meal('Cous cous e tonno', f(['couscous',90],['tonno',150],['verdure',250],['olio',10]))
  ]
];

function mealChoicesFor(dayIndex, mealIndex){
  const base = WEEK_BASE[dayIndex].meals[mealIndex];
  const signature = m => m.foods.map(x=>`${x.id}:${x.q}`).sort().join('|');
  const pool = ALT_POOLS[mealIndex].filter(m => signature(m)!==signature(base));
  const start = (dayIndex * 3 + mealIndex) % pool.length;
  const out = [base];
  for(let i=0;i<4;i++) out.push(pool[(start+i)%pool.length]);
  return out;
}

const TRAINING_INFO = {
  duration: '8–12 settimane',
  recoveryMain: '2 min su tutti gli esercizi',
  recovery12: '1 min e 30 sec sulle serie da 12 ripetizioni',
  core: 'Addome 2 volte a settimana a fine allenamento: 4 serie di plank e reverse crunch isometrici in alternanza.'
};

const TRAINING_DAYS = [
  {
    label:'Giorno 1',
    title:'Petto • Spalle • Tricipiti',
    exercises:[
      {name:'Panca piana manubri', sets:'3×8', load:'12 kg per lato', equipment:'Manubri / panca', icon:'dumbbellBench'},
      {name:'Panca inclinata 38° manubri', sets:'3×8', load:'8 kg per lato', equipment:'Manubri / panca inclinata', icon:'inclineBench'},
      {name:'Pec machine', sets:'2×12', load:'15–10', equipment:'Panatta machine', icon:'pecDeck'},
      {name:'Shoulder press', sets:'3×8', load:'20–15', equipment:'Panatta machine', icon:'shoulderPress'},
      {name:'Alzate laterali machine', sets:'3×12', load:'15', equipment:'Panatta machine', icon:'lateralMachine'},
      {name:'French press manubri', sets:'2×10', load:'4 kg per lato', equipment:'Manubri', icon:'dbTriceps'},
      {name:'Push down barra', sets:'2×12', load:'10', equipment:'Cavo / barra', icon:'pushdown'}
    ]
  },
  {
    label:'Giorno 2',
    title:'Schiena • Bicipiti • Gambe (quadricipiti)',
    exercises:[
      {name:'High row', sets:'3×8', load:'—', equipment:'Panatta row machine', icon:'highRow'},
      {name:'Low row', sets:'3×8', load:'—', equipment:'Panatta row machine', icon:'lowRow'},
      {name:'Row presa prona alta', sets:'2×12', load:'—', equipment:'Panatta / row', icon:'rowProna'},
      {name:'Curl manubri su panca inclinata 43°', sets:'3×10', load:'—', equipment:'Manubri / panca inclinata', icon:'inclineCurl'},
      {name:'Hammer curl corde cavo basso', sets:'2×12', load:'—', equipment:'Cavo basso / corda', icon:'ropeCurl'},
      {name:'Step up', sets:'3×8', load:'—', equipment:'Step / manubri opzionali', icon:'stepUp'},
      {name:'Leg extension', sets:'3×10', load:'—', equipment:'Panatta machine', icon:'legExtension'}
    ]
  },
  {
    label:'Giorno 3',
    title:'Spalle • Petto • Tricipiti',
    exercises:[
      {name:'Spinte in alto manubri su panca 71°', sets:'3×8', load:'—', equipment:'Manubri / panca alta', icon:'shoulderDb'},
      {name:'Alzate laterali in piedi con petto su panca 71°', sets:'3×10', load:'—', equipment:'Manubri / panca', icon:'lateralDb'},
      {name:'Face pull corde su panca 43°', sets:'2×12', load:'—', equipment:'Cavo / corde', icon:'facePull'},
      {name:'Chest press', sets:'3×8', load:'—', equipment:'Panatta machine', icon:'chestPress'},
      {name:'Croci cavi panca 32°', sets:'3×10', load:'—', equipment:'Cavi / panca inclinata', icon:'cableFly'},
      {name:'Dips machine', sets:'3×10', load:'—', equipment:'Panatta machine', icon:'dipMachine'},
      {name:'Push down inverso con corde su panca 43°', sets:'2×12', load:'—', equipment:'Cavo / corde', icon:'reversePushdown'}
    ]
  },
  {
    label:'Giorno 4',
    title:'Gambe • Schiena • Bicipiti',
    exercises:[
      {name:'Leg press monolaterale', sets:'3×8', load:'—', equipment:'Panatta machine', icon:'legPress'},
      {name:'Hip Thrust machine', sets:'3×10', load:'—', equipment:'Panatta machine', icon:'hipThrust'},
      {name:'Leg calf alla leg press orizzontale', sets:'3×12', load:'—', equipment:'Panatta machine', icon:'calfPress'},
      {name:'Lat machine', sets:'3×8', load:'—', equipment:'Panatta machine', icon:'latMachine'},
      {name:'Row presa neutra', sets:'3×10', load:'—', equipment:'Panatta row machine', icon:'neutralRow'},
      {name:'Curl panca scott', sets:'3×10', load:'—', equipment:'Panca Scott / machine', icon:'preacherCurl'},
      {name:'Curl barra cavo basso', sets:'2×12', load:'—', equipment:'Cavo basso / barra', icon:'lowCableCurl'}
    ]
  }
];
