/* ============================================================================
   CASA CTO. CONCORDE - MODELO PARAMETRICO
   ----------------------------------------------------------------------------
   Unidades: METROS.
   Sistema de coordenadas de PLANTA (el mismo que la foto satelital):
       x : izquierda -> derecha de la foto
       y : abajo -> arriba de la foto  (+y = hacia la calle Cto Concorde)
       z : cota (0.00 = nivel de calle / losa de la cochera)
   En 3D (three.js):  X = x ,  Y = z (altura) ,  Z = -y
   ----------------------------------------------------------------------------
   Esta es la UNICA fuente de verdad: el plano 2D y el modelo 3D se generan
   de aqui. Para refinar la casa basta con tocar numeros en este archivo.
   ========================================================================== */

export const T = {          // espesores
  EXT: 0.20, INT: 0.12, GLASS: 0.08, PAR: 0.15,
  // Los tres muros de la banda de servicio salen de 0.18: es lo que hace que
  // cuadren a la vez los anchos medidos (1.56 + 2.01 + 2.74) y los de las
  // recamaras (2.80 + 3.10 + 3.50) dentro de los 9.64 interiores.
  BAND: 0.18,
};

export const H = {          // alturas
  FLOOR: 2.60,              // altura libre piso-techo
  SLAB: 0.30,               // peralte de losa
  PAR: 1.00,                // pretil / barandal
  PRISM: 2.30,              // altura del prisma de acceso a escaleras
};

export const Z = {          // cotas de nivel de piso terminado
  N0: 0.00,                 // cochera (al nivel de la calle)
  N1: -2.90,                // nivel intermedio: sala, cocina, medio bano
  N2: -5.80,                // nivel inferior: recamaras, bano
};

export const ESC = { ANCHO: 0.91, HUELLA: 0.25 };   // medido en obra

/* --------------------------------------------------------------------------
   EJES  (coordenadas de EJE de muro; las caras quedan a +-t/2)
   -------------------------------------------------------------------------- */
export const AX = {
  // --- X comun ---
  XW: 0.10,      // muro exterior poniente (caras 0.00 / 0.20)
  XE: 9.94,      // muro exterior oriente  (caras 9.84 / 10.04)

  // --- X nivel intermedio: escaleras | medio bano | zotehuela | cocina ---
  X_VEST: 3.42,  // escaleras (3.16) | medio bano   (3.36 / 3.48)
  X_MB:   4.62,  // medio bano (1.08) | zotehuela   (4.56 / 4.68)
  X_COC:  6.28,  // zotehuela (1.54) | cocina (3.50)(6.22 / 6.34)

  // --- X nivel inferior ---
  // recamara 1 (2.79) | acceso-closet (1.56) | pasillo (2.01) | zotehuela (2.74)
  X_R1R2: 3.08,    // rec.1 | acceso-closet y rec.2   (2.99 / 3.17), muro de 0.18
  X_ACC_E: 4.82,   // acceso-closet | pasillo         (4.73 / 4.91), muro de 0.18
  X_ZOT_W: 7.01,   // pasillo | zotehuela             (6.92 / 7.10), muro de 0.18
  X_R2R3: 6.33,    // rec.2 | paso y rec.3            (6.27 / 6.39)
  X_BANO_W: 7.78,  // muro de 2.78 m: paso | bano y closet (7.72 / 7.84)

  // --- Y nivel intermedio ---
  Y_SALA_S: 0.10,   // fachada sur de la sala, vidrio piso-techo (0.00 / 0.20)
  Y_COC_S:  4.26,   // sala | cocina   (4.20 / 4.32) -> cocina de 3.60 de fondo
  Y_BAND_S: 4.98,   // sala | escaleras, medio bano y zotehuela (4.92 / 5.04)
  Y_N1_N:   6.96,   // muro exterior norte, recto para los cuatro (6.86 / 7.06)
  Y_PRISM_S: 4.98,  // muro sur del prisma de escaleras en la cochera (4.92 / 5.04)

  // --- Y nivel inferior ---
  // Banda de servicio de 1.68 de fondo (el fondo medido del pasillo).
  Y_N2_N:  0.10,    // muro norte, el mismo plano donde termina la sala (0.00 / 0.20)
  Y_N2_R: -1.74,    // banda de servicio | recamara 2 y paso (-1.68 / -1.80)
  Y_R3_N: -3.66,    // bano y paso | recamara 3 (-3.60 / -3.72), bano rotado
  Y_CLOSET: -4.58,  // fin del muro de 2.78 m = fondo del closet de la rec. 3
  // Cada recamara arranca donde la deja lo que trae encima, y su fondo se mide
  // de ahi al frente. La rec.1 sube hasta el muro del fondo, la rec.2 arranca
  // bajo la banda y la rec.3 bajo el bano: por eso la fachada escalona hacia
  // la derecha en vez de hacia la izquierda.
  Y_R1_S: -4.70,    // fachada recamara 1 (4.60 desde 0.00)
  Y_R2_S: -5.60,    // fachada recamara 2 (3.70 desde -1.80)
  Y_R3_S: -6.62,    // fachada recamara 3 (2.80 desde -3.72)
};

const A = AX;

/* --------------------------------------------------------------------------
   HELPERS
   -------------------------------------------------------------------------- */
const W = (ax, ay, bx, by, t, h, kind = 'int', openings = [], base = 0) =>
  ({ a: [ax, ay], b: [bx, by], t, h, kind, openings, base });

const door = (s, e, h = 2.10) => ({ s, e, y0: 0, y1: h, type: 'door' });
const pass = (s, e, h = 2.40) => ({ s, e, y0: 0, y1: h, type: 'pass' });
const win  = (s, e, y0 = 0.95, y1 = 2.20) => ({ s, e, y0, y1, type: 'win' });

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/* ==========================================================================
   NIVEL 0 - COCHERA (al nivel de la calle Cto. Concorde)
   Espacio abierto sin techo. Solo el prisma de escaleras y el vano de la
   zotehuela del nivel intermedio.
   ========================================================================== */
const N0 = {
  id: 'N0',
  name: 'Nivel 0 - Cochera (calle)',
  z: Z.N0,
  wallH: H.PAR,
  slab: {
    outline: rect(0, 0, 10.04, 7.06),
    holes: [
      rect(4.68, 5.04, 6.22, 6.86),   // vano de la zotehuela (1.54 x 1.82)
      rect(0.20, 5.04, 3.36, 6.86),   // hueco de la escalera (dentro del prisma)
    ],
    z: Z.N0, t: H.SLAB,
  },
  rooms: [
    { name: 'Cochera', poly: rect(0.20, 0.20, 9.84, 7.06), kind: 'exterior' },
    { name: 'Vano zotehuela', poly: rect(4.68, 5.04, 6.22, 6.86), kind: 'void' },
    { name: 'Acceso escaleras', poly: rect(0.20, 5.04, 3.36, 6.86), kind: 'stairs' },
  ],
  walls: [
    // pretiles perimetrales
    W(0, A.Y_SALA_S, 10.04, A.Y_SALA_S, T.PAR, H.PAR, 'parapet'),
    W(A.XW, 0, A.XW, 7.06, T.PAR, H.PAR, 'parapet'),
    W(A.XE, 0, A.XE, 7.06, T.PAR, H.PAR, 'parapet'),
    // pretil del lado de la calle; los autos entran al oriente del vano
    W(0, 6.96, 10.04, 6.96, T.PAR, H.PAR, 'parapet',
      [{ s: 6.40, e: 9.60, y0: 0, y1: H.PAR, type: 'pass' }]),
    // barandal del vano de la zotehuela
    W(4.68, 5.04, 6.22, 5.04, 0.10, H.PAR, 'rail'),
    W(4.68, 5.04, 4.68, 6.86, 0.10, H.PAR, 'rail'),
    W(6.22, 5.04, 6.22, 6.86, 0.10, H.PAR, 'rail'),
    // PRISMA de acceso a la escalera (a la izquierda del vano)
    W(0, A.Y_PRISM_S, A.X_VEST, A.Y_PRISM_S, T.EXT, H.PRISM, 'ext'),
    W(0, A.Y_N1_N, A.X_VEST, A.Y_N1_N, T.EXT, H.PRISM, 'ext'),
    W(A.XW, A.Y_PRISM_S, A.XW, A.Y_N1_N, T.EXT, H.PRISM, 'ext'),
    W(A.X_VEST, A.Y_PRISM_S, A.X_VEST, A.Y_N1_N, T.EXT, H.PRISM, 'ext',
      [door(0.10, 0.95)]),   // puerta al oriente, frente al primer tramo
  ],
  extraSlabs: [
    { outline: rect(0, A.Y_PRISM_S - 0.1, A.X_VEST + 0.1, A.Y_N1_N + 0.1),
      holes: [], z: Z.N0 + H.PRISM + 0.12, t: 0.12, mat: 'concrete' },
  ],
};

/* ==========================================================================
   NIVEL 1 - INTERMEDIO
   La sala manda (4.00 de fondo) y tambien la zotehuela (1.54 x 1.73 medida).
   La banda de atras se encoge a 1.82 de fondo -- lo minimo que necesitan los
   dos tramos de 0.91 de la escalera en U -- y la cocina queda de 3.50 x 2.54,
   conservando los 0.72 con que sobresale hacia la sala.
   ========================================================================== */
const N1 = {
  id: 'N1',
  name: 'Nivel 1 - Intermedio (sala, cocina)',
  z: Z.N1,
  wallH: H.FLOOR,
  slab: {
    outline: rect(0, 0, 10.04, 7.06),
    // El hueco debe quedar DENTRO del contorno: si se sale, la triangulacion
    // lo ignora y la losa termina tapando la escalera.
    holes: [rect(4.89, 0.02, 5.92, 3.50)],
    z: Z.N1, t: H.SLAB,
  },
  rooms: [
    { name: 'Sala', kind: 'living', dim: '9.64 x 4.00 (4.72 fuera de la cocina)',
      poly: [[0.20, 0.20], [9.84, 0.20], [9.84, 4.20],
             [6.34, 4.20], [6.34, 4.92], [0.20, 4.92]] },
    { name: 'Vestibulo / escaleras', poly: rect(0.20, 5.04, 3.36, 6.86), kind: 'hall' },
    { name: 'Medio bano', poly: rect(3.48, 5.04, 4.56, 6.86), kind: 'bath' },
    { name: 'Zotehuela', poly: rect(4.68, 5.04, 6.22, 6.86), kind: 'patio',
      dim: '1.54 x 1.82' },
    { name: 'Cocina', poly: rect(6.34, 4.32, 9.84, 6.86), kind: 'kitchen' },
  ],
  walls: [
    /* ---- exteriores ---- */
    W(0, A.Y_SALA_S, 10.04, A.Y_SALA_S, T.GLASS, H.FLOOR, 'glass',
      [pass(4.89, 5.92), door(7.20, 8.60, 2.40)]),
    W(A.XW, 0, A.XW, A.Y_N1_N, T.EXT, H.FLOOR, 'ext'),
    W(0, A.Y_N1_N, 10.04, A.Y_N1_N, T.EXT, H.FLOOR, 'ext', [win(6.60, 9.30)]),
    W(A.XE, 0, A.XE, A.Y_N1_N, T.EXT, H.FLOOR, 'ext', [win(4.60, 6.40)]),

    /* ---- interiores ---- */
    // sala | cocina: este muro esta 0.72 mas al sur que el de los otros tres
    W(A.X_COC, A.Y_COC_S, 10.04, A.Y_COC_S, T.INT, H.FLOOR, 'int', [
      pass(0.90, 3.20),     // cocina abierta a la sala
    ]),
    // sala | escaleras, medio bano y zotehuela
    W(0, A.Y_BAND_S, A.X_COC, A.Y_BAND_S, T.INT, H.FLOOR, 'int', [
      pass(1.10, 2.40),     // paso al vestibulo
      door(3.60, 4.44),     // medio bano
      door(4.95, 5.95),     // zotehuela
    ]),
    // divisiones de la banda
    W(A.X_VEST, A.Y_BAND_S, A.X_VEST, A.Y_N1_N, T.INT, H.FLOOR, 'int'),
    W(A.X_MB, A.Y_BAND_S, A.X_MB, A.Y_N1_N, T.INT, H.FLOOR, 'int'),
    W(A.X_COC, A.Y_COC_S, A.X_COC, A.Y_N1_N, T.INT, H.FLOOR, 'int', [
      door(1.50, 2.34),     // acceso cocina -> zotehuela
    ]),
  ],
};

// Patio: sigue el escalonado de la fachada y se cierra 1.50 m adelante de la
// recamara 3 con la barda recta que colinda con el vecino de enfrente.
const Y_BARDA = -8.22;
const PATIO = [
  [0.20, -8.12], [9.84, -8.12], [9.84, -6.72], [6.33, -6.72],
  [6.33, -5.70], [3.08, -5.70], [3.08, -4.80], [0.20, -4.80],
];

const N2 = {
  id: 'N2',
  name: 'Nivel 2 - Inferior (recamaras)',
  z: Z.N2,
  wallH: H.FLOOR,
  slab: {
    outline: [
      [0, 0.20], [10.04, 0.20], [10.04, A.Y_R3_S], [A.X_R2R3, A.Y_R3_S],
      [A.X_R2R3, A.Y_R2_S], [A.X_R1R2, A.Y_R2_S], [A.X_R1R2, A.Y_R1_S], [0, A.Y_R1_S],
    ],
    holes: [], z: Z.N2, t: H.SLAB,
  },
  roofSlab: {
    outline: [
      [0, 0.20], [10.04, 0.20], [10.04, A.Y_R3_S], [A.X_R2R3, A.Y_R3_S],
      [A.X_R2R3, A.Y_R2_S], [A.X_R1R2, A.Y_R2_S], [A.X_R1R2, A.Y_R1_S], [0, A.Y_R1_S],
    ],
    holes: [
      rect(7.10, -1.68, 9.84, 0.00),   // zotehuela 2.74 x 1.68
    ],
    z: Z.N1, t: H.SLAB,
  },
  rooms: [
    { name: 'Recamara 1', poly: rect(0.20, -4.60, 2.99, 0.00), kind: 'bed' },
    { name: 'Recamara 2', poly: rect(3.17, -5.50, 6.27, -1.80), kind: 'bed' },
    { name: 'Recamara 3', poly: rect(6.39, -6.52, 9.84, -3.72), kind: 'bed' },
    { name: 'Closet rec. 3', poly: rect(7.84, -4.58, 9.84, -3.72), kind: 'closet' },
    { name: 'Acceso / closet rec. 1', poly: rect(3.17, -1.68, 4.73, 0.00), kind: 'closet' },
    { name: 'Pasillo', poly: rect(4.91, -1.68, 6.92, 0.00), kind: 'hall',
      dim: '2.01 x 1.68' },
    { name: 'Paso a rec. 3 y bano', poly: rect(6.39, -3.72, 7.72, -1.80), kind: 'hall' },
    { name: 'Bano completo', poly: rect(7.84, -3.60, 9.84, -1.80), kind: 'bath',
      dim: '2.00 x 1.80' },
    { name: 'Zotehuela', poly: rect(7.10, -1.68, 9.84, 0.00), kind: 'patio',
      dim: '2.74 x 1.68' },
    // patio con pasto sintetico frente a los ventanales, escalonado como la
    // fachada y cerrado al sur por la barda con el vecino de enfrente
    { name: 'Patio', kind: 'lawn', poly: PATIO },
  ],
  extraSlabs: [
    { outline: PATIO, holes: [], z: Z.N2, t: 0.15, mat: 'lawn', walkable: true },
  ],
  walls: [
    /* ---- exteriores ---- */
    W(0, A.Y_N2_N, 10.04, A.Y_N2_N, T.EXT, H.FLOOR, 'ext', [pass(4.89, 5.92, H.FLOOR)]),
    W(A.XW, A.Y_N2_N, A.XW, A.Y_R1_S, T.EXT, H.FLOOR, 'ext'),
    W(A.XE, A.Y_N2_N, A.XE, A.Y_R3_S, T.EXT, H.FLOOR, 'ext'),
    // fachadas escalonadas, ventanales de piso a techo
    W(A.X_R2R3, A.Y_R3_S, 10.04, A.Y_R3_S, T.GLASS, H.FLOOR, 'glass'),
    W(A.X_R2R3, A.Y_R3_S, A.X_R2R3, A.Y_R2_S, T.EXT, H.FLOOR, 'ext'),
    W(A.X_R1R2, A.Y_R2_S, A.X_R2R3, A.Y_R2_S, T.GLASS, H.FLOOR, 'glass'),
    W(A.X_R1R2, A.Y_R2_S, A.X_R1R2, A.Y_R1_S, T.EXT, H.FLOOR, 'ext'),
    W(0, A.Y_R1_S, A.X_R1R2, A.Y_R1_S, T.GLASS, H.FLOOR, 'glass',
      [door(1.30, 2.20, 2.40)]),

    /* ---- interiores ---- */
    // muro oriente de la recamara 1, de su fachada al muro del fondo
    W(A.X_R1R2, A.Y_R1_S, A.X_R1R2, A.Y_N2_N, T.BAND, H.FLOOR, 'int', [
      door(3.45, 4.30),     // entrada a la rec. 1 desde su acceso-closet
    ]),
    // acceso-closet rec.1 | pasillo
    W(A.X_ACC_E, A.Y_N2_R, A.X_ACC_E, A.Y_N2_N, T.BAND, H.FLOOR, 'int',
      [pass(0.45, 1.45)]),
    // pasillo | zotehuela
    W(A.X_ZOT_W, A.Y_N2_R, A.X_ZOT_W, A.Y_N2_N, T.BAND, H.FLOOR, 'int',
      [door(0.50, 1.40)]),
    // banda de servicio | recamaras 2 y paso
    W(2.99, A.Y_N2_R, 10.04, A.Y_N2_R, T.INT, H.FLOOR, 'int', [
      door(2.11, 3.01),     // rec. 2 desde el pasillo  (x 5.10 - 6.00)
      pass(3.40, 3.93),     // pasillo -> paso a rec. 3 (x 6.39 - 6.92)
    ]),
    // muro entre recamara 2 y el paso / recamara 3
    W(A.X_R2R3, A.Y_R2_S, A.X_R2R3, A.Y_N2_R, T.INT, H.FLOOR, 'int'),
    // muro de 2.78 m : divide el bano del paso y su excedente forma el closet
    W(A.X_BANO_W, A.Y_N2_R - 0.06, A.X_BANO_W, A.Y_CLOSET, T.INT, H.FLOOR, 'int', [
      door(0.40, 1.24),
    ]),
    // bano y paso | recamara 3
    W(A.X_R2R3, A.Y_R3_N, 10.04, A.Y_R3_N, T.INT, H.FLOOR, 'int', [
      door(0.31, 1.21),     // rec. 3 desde el paso (x 6.70 - 7.60)
    ]),

    // paredes de la caja de la escalera que baja de la sala: sin ellas se ve
    // el cielo por los costados y se puede caer fuera del tramo
    W(4.84, A.Y_N2_N, 4.84, 3.50, 0.10, 3.90, 'int'),
    W(5.97, A.Y_N2_N, 5.97, 3.50, 0.10, 3.90, 'int'),

    /* ---- bardas del patio ---- */
    W(0, Y_BARDA, 10.04, Y_BARDA, 0.15, 2.40, 'ext'),        // vecino de enfrente
    W(0.08, Y_BARDA, 0.08, A.Y_R1_S, 0.15, 2.40, 'ext'),     // colindancia poniente
    W(9.96, Y_BARDA, 9.96, A.Y_R3_S, 0.15, 2.40, 'ext'),     // colindancia oriente
  ],
  parapets: [
    W(0, A.Y_R1_S, A.X_R1R2, A.Y_R1_S, T.PAR, H.PAR, 'parapet', [], Z.N1 - Z.N2),
    W(A.X_R1R2, A.Y_R1_S, A.X_R1R2, A.Y_R2_S, T.PAR, H.PAR, 'parapet', [], Z.N1 - Z.N2),
    W(A.X_R1R2, A.Y_R2_S, A.X_R2R3, A.Y_R2_S, T.PAR, H.PAR, 'parapet', [], Z.N1 - Z.N2),
    W(A.X_R2R3, A.Y_R2_S, A.X_R2R3, A.Y_R3_S, T.PAR, H.PAR, 'parapet', [], Z.N1 - Z.N2),
    W(A.X_R2R3, A.Y_R3_S, 10.04, A.Y_R3_S, T.PAR, H.PAR, 'parapet', [], Z.N1 - Z.N2),
    W(0.05, A.Y_R1_S, 0.05, 0.20, T.PAR, H.PAR, 'parapet', [], Z.N1 - Z.N2),
    W(9.99, A.Y_R3_S, 9.99, 0.20, T.PAR, H.PAR, 'parapet', [], Z.N1 - Z.N2),
  ],
};

/* ==========================================================================
   ESCALERAS   (ancho 0.91 medido en obra; huella 0.25, peralte 17.06 cm)
   ========================================================================== */
export const STAIRS = [
  // N0 -> N1 : en U CONTINUA dentro del prisma, sin descanso plano. Bajas por
  // el lado sur hacia el poniente, das la vuelta a la DERECHA sobre tres
  // escalones y sigues bajando hacia el oriente. 17 peraltes de 17.06 cm.
  { id: 'e1a', from: [3.32, 5.495], to: [1.11, 5.495], z0: Z.N0, z1: -1.194,
    width: ESC.ANCHO, note: 'tramo 1, 7 peraltes (hacia la izquierda)' },
  { id: 'e1m', from: [0.655, 5.495], to: [0.655, 6.405], z0: -1.194, z1: -1.706,
    width: ESC.ANCHO, note: 'la vuelta, 3 peraltes (sin descanso plano)' },
  { id: 'e1b', from: [1.11, 6.405], to: [3.07, 6.405], z0: -1.706, z1: Z.N1,
    width: ESC.ANCHO, note: 'tramo 2, 7 peraltes (hacia la derecha)' },

  // N1 -> N2 : tramo recto hacia el sur, entre muros. Al minimo de reglamento:
  // 17 peraltes de 17.06 cm y huellas de 25 cm, o sea 4.00 de desarrollo.
  // Arranca a 1.42 del fondo de la sala para que el nivel inferior empiece
  // justo donde la sala termina, y le sobresalen 2 escalones al pasillo.
  { id: 'e2', from: [5.405, 3.50], to: [5.405, -0.50], z0: Z.N1, z1: Z.N2,
    width: ESC.ANCHO, rail: false, note: 'sala -> recamaras, entre muros' },
];

/* ==========================================================================
   ENTORNO
   ========================================================================== */
export const SITE = {
  street: { poly: rect(-14, 7.06, 24, 15.0), z: Z.N0 },
  groundLow: { poly: rect(-14, -24, 24, -8.32), z: Z.N2 - 0.02 },
  groundSideW: { poly: rect(-14, -24, 0, 0), z: Z.N2 - 0.02 },
  groundSideE: { poly: rect(10.04, -24, 24, 0), z: Z.N2 - 0.02 },
};

export const LEVELS = [N0, N1, N2];
export const LEVEL_BY_ID = { N0, N1, N2 };

/* ==========================================================================
   UTILIDADES GEOMETRICAS COMPARTIDAS (2D y 3D)
   ========================================================================== */

/** Tramos solidos de un muro, ya resueltos los vanos. */
export function wallPieces(w) {
  const [ax, ay] = w.a, [bx, by] = w.b;
  const dx = bx - ax, dy = by - ay;
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  const at = (s) => [ax + ux * s, ay + uy * s];
  const ops = [...(w.openings || [])].sort((p, q) => p.s - q.s);
  const pieces = [];
  let cursor = 0;
  for (const o of ops) {
    const s = Math.max(0, Math.min(L, o.s));
    const e = Math.max(0, Math.min(L, o.e));
    if (s > cursor) pieces.push({ s: cursor, e: s, y0: 0, y1: w.h, solid: true });
    if (o.y0 > 0) pieces.push({ s, e, y0: 0, y1: o.y0, solid: true });
    if (o.y1 < w.h) pieces.push({ s, e, y0: o.y1, y1: w.h, solid: true });
    cursor = Math.max(cursor, e);
  }
  if (cursor < L) pieces.push({ s: cursor, e: L, y0: 0, y1: w.h, solid: true });
  return pieces.map((p) => {
    const [x0, y0] = at(p.s), [x1, y1] = at(p.e);
    return { x0, y0, x1, y1, zBase: p.y0, zTop: p.y1, s: p.s, e: p.e };
  });
}

/** Rectangulo en planta de un tramo de muro, con su espesor. */
export function pieceRect(piece, t) {
  const horiz = Math.abs(piece.y1 - piece.y0) < 1e-9;
  if (horiz) {
    return {
      x: Math.min(piece.x0, piece.x1), y: piece.y0 - t / 2,
      w: Math.abs(piece.x1 - piece.x0), h: t,
    };
  }
  return {
    x: piece.x0 - t / 2, y: Math.min(piece.y0, piece.y1),
    w: t, h: Math.abs(piece.y1 - piece.y0),
  };
}

export function polyBBox(poly) {
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys),
           x1: Math.max(...xs), y1: Math.max(...ys) };
}

export function polyArea(poly) {
  let a = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

export function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Peraltes y huellas de un tramo de escalera. */
export function stairSteps(s) {
  if (s.landing) return null;
  const dz = s.z1 - s.z0;
  const len = Math.hypot(s.to[0] - s.from[0], s.to[1] - s.from[1]);
  const n = Math.max(2, Math.ceil(Math.abs(dz) / 0.18));   // num de peraltes
  const riser = dz / n;
  const ux = (s.to[0] - s.from[0]) / len, uy = (s.to[1] - s.from[1]) / len;
  const stepLen = len / (n - 1);
  const steps = [];
  for (let i = 0; i < n - 1; i++) {
    steps.push({
      i,
      x0: s.from[0] + ux * stepLen * i, y0: s.from[1] + uy * stepLen * i,
      x1: s.from[0] + ux * stepLen * (i + 1), y1: s.from[1] + uy * stepLen * (i + 1),
      zTop: s.z0 + riser * (i + 1),
    });
  }
  return { n, riser, tread: stepLen, steps, ux, uy, len };
}

export const META = {
  title: 'Casa Cto. Concorde',
  anchoInterior: 9.64,
  version: 'v4 - con medidas de obra del pasillo, zotehuelas y escaleras',
};
