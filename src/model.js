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
   TODA la geometria se deriva de los EJES: ningun cuarto, muro ni losa trae
   coordenadas pegadas a mano. Mover un eje recalcula solo los cuartos, muros,
   puertas, huecos y cotas que dependen de el.

   `buildHouse(parche)` arma la casa; el parche solo declara diferencias, asi
   que una variante hereda todo lo que no toca explicitamente.
   ========================================================================== */

/* --------------------------------------------------------------------------
   BASE
   -------------------------------------------------------------------------- */
const BASE = {
  espesores: { EXT: 0.20, INT: 0.12, GLASS: 0.08, PAR: 0.15, BAND: 0.18, RAIL: 0.10 },
  alturas: { FLOOR: 2.60, SLAB: 0.30, PAR: 1.00, PRISM: 2.30, BARDA: 2.40 },
  cotas: { N0: 0.00, N1: -2.90, N2: -5.80 },

  // Cada eje es la linea de centro de un muro mas su espesor: las caras
  // quedan a +-t/2 y de ahi salen las medidas interiores de cada espacio.
  ejes: {
    /* --- X comun --- */
    XW: { at: 0.10, t: 0.20, nota: 'muro exterior poniente' },
    XE: { at: 9.94, t: 0.20, nota: 'muro exterior oriente' },

    /* --- X nivel intermedio: escaleras | medio bano | zotehuela | cocina --- */
    X_VEST: { at: 3.42, t: 0.12, nota: 'escaleras (3.16) | medio bano' },
    X_MB:   { at: 4.62, t: 0.12, nota: 'medio bano (1.08) | zotehuela' },
    X_COC:  { at: 6.28, t: 0.12, nota: 'zotehuela (1.54) | cocina (3.50)' },

    /* --- X nivel inferior --- */
    X_R1R2:   { at: 3.08, t: 0.18, nota: 'rec.1 (2.79) | acceso-closet y rec.2' },
    X_ACC_E:  { at: 4.82, t: 0.18, nota: 'acceso-closet (1.56) | pasillo' },
    X_ZOT_W:  { at: 7.01, t: 0.18, nota: 'pasillo (2.01) | zotehuela (2.74)' },
    X_R2R3:   { at: 6.33, t: 0.12, nota: 'rec.2 (3.10) | paso y rec.3' },
    X_BANO_W: { at: 7.78, t: 0.12, nota: 'muro de 2.78: paso | bano y closet' },

    /* --- Y nivel intermedio --- */
    Y_SALA_S:  { at: 0.10, t: 0.20, nota: 'fachada sur de la sala' },
    Y_COC_S:   { at: 4.26, t: 0.12, nota: 'sala | cocina, 0.72 mas al sur' },
    Y_BAND_S:  { at: 4.98, t: 0.12, nota: 'sala | escaleras, medio bano y zotehuela' },
    Y_N1_N:    { at: 6.96, t: 0.20, nota: 'muro exterior norte' },
    Y_PRISM_S: { at: 4.98, t: 0.20, nota: 'muro sur del prisma en la cochera' },

    /* --- Y nivel inferior --- */
    Y_N2_N:   { at: 0.10, t: 0.20, nota: 'muro norte, donde termina la sala' },
    Y_N2_R:   { at: -1.74, t: 0.12, nota: 'banda de servicio | rec.2 y paso' },
    Y_R3_N:   { at: -3.66, t: 0.12, nota: 'bano y paso | recamara 3' },
    Y_CLOSET: { at: -4.58, t: 0.00, nota: 'fin del muro de 2.78 = fondo del closet' },
    // Cada recamara arranca donde la deja lo que trae encima y su fondo se
    // mide de ahi al frente: por eso la fachada escalona hacia la derecha.
    Y_R1_S: { at: -4.70, t: 0.20, nota: 'fachada rec.1 (4.60 de fondo)' },
    Y_R2_S: { at: -5.60, t: 0.20, nota: 'fachada rec.2 (3.70 de fondo)' },
    Y_R3_S: { at: -6.62, t: 0.20, nota: 'fachada rec.3 (2.80 de fondo)' },
    Y_BARDA: { at: -8.22, t: 0.20, nota: 'barda con el vecino de enfrente' },
  },

  // Las escaleras tambien son parametricas: de aqui salen sus tramos, el
  // hueco en la losa y los muros de la caja.
  escaleras: {
    ancho: 0.91,
    e1: { xTop: 3.32, xTurn: 1.32, xBot: 3.07, yIda: 5.495, yVuelta: 6.405,
          zDescanso: -1.535, descansoX0: 0.20 },
    // 13 escalones contados en la casa (14 peraltes) y huella de 0.25: el
    // desarrollo sale de ahi, no al reves.
    e2: { x: 5.405, yBot: -0.50, peraltes: 14, huella: 0.25, holgura: 0.06, muro: 0.10 },
  },
};

/* --------------------------------------------------------------------------
   UTILIDADES DE GEOMETRIA (no dependen de la casa)
   -------------------------------------------------------------------------- */
export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

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
    if (s > cursor) pieces.push({ s: cursor, e: s, y0: 0, y1: w.h });
    if (o.y0 > 0) pieces.push({ s, e, y0: 0, y1: o.y0 });
    if (o.y1 < w.h) pieces.push({ s, e, y0: o.y1, y1: w.h });
    cursor = Math.max(cursor, e);
  }
  if (cursor < L) pieces.push({ s: cursor, e: L, y0: 0, y1: w.h });
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

/** Peraltes y huellas de un tramo de escalera. */
export function stairSteps(s) {
  if (s.landing) return null;
  const dz = s.z1 - s.z0;
  const len = Math.hypot(s.to[0] - s.from[0], s.to[1] - s.from[1]);
  // Si la escalera trae peraltes contados en obra, mandan esos; si no, se
  // calculan para no pasarse de 18 cm.
  const n = s.peraltes ?? Math.max(2, Math.ceil(Math.abs(dz) / 0.18));
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

/* --------------------------------------------------------------------------
   APLICAR UN PARCHE
   -------------------------------------------------------------------------- */
function mergeEjes(base, parche = {}) {
  const out = {};
  for (const [k, v] of Object.entries(base)) out[k] = { ...v };
  for (const [k, v] of Object.entries(parche)) {
    if (v === null) { delete out[k]; continue; }
    out[k] = typeof v === 'number' ? { ...(out[k] || {}), at: v } : { ...(out[k] || {}), ...v };
  }
  return out;
}

/** Aplica altas, bajas y cambios por id sobre una lista con `id`.
 *  `prefijo` evita que el parche de un nivel se cuele en los demas: solo se
 *  dan de alta los ids que le pertenecen. */
function patchById(lista, parche = {}, prefijo = null) {
  let out = lista.filter((it) => parche[it.id] !== null);
  out = out.map((it) => (parche[it.id] ? { ...it, ...parche[it.id] } : it));
  for (const [id, v] of Object.entries(parche)) {
    if (!v || lista.some((it) => it.id === id)) continue;
    if (prefijo && !id.startsWith(prefijo)) continue;
    out.push({ id, ...v });
  }
  return out;
}

/* ==========================================================================
   CONSTRUCTOR
   ========================================================================== */
export function buildHouse(parche = {}) {
  const T = { ...BASE.espesores, ...(parche.espesores || {}) };
  const H = { ...BASE.alturas, ...(parche.alturas || {}) };
  const Z = { ...BASE.cotas, ...(parche.cotas || {}) };
  const EJ = mergeEjes(BASE.ejes, parche.ejes);
  const ESC = {
    ...BASE.escaleras, ...(parche.escaleras || {}),
    e1: { ...BASE.escaleras.e1, ...((parche.escaleras || {}).e1 || {}) },
    e2: { ...BASE.escaleras.e2, ...((parche.escaleras || {}).e2 || {}) },
  };

  /* --- lectura de ejes ------------------------------------------------- */
  const cl = (k) => (typeof k === 'number' ? k : EJ[k].at);          // linea de centro
  const th = (k) => (typeof k === 'number' ? 0 : EJ[k].t);           // espesor
  const fP = (k) => cl(k) + th(k) / 2;    // cara del lado + (interior al norte/oriente)
  const fN = (k) => cl(k) - th(k) / 2;    // cara del lado - (interior al sur/poniente)

  /* --- constructores --------------------------------------------------- */
  // Un cuarto se define por los cuatro ejes que lo encierran; el poligono
  // sale de las caras interiores de esos ejes.
  const cuarto = (id, name, kind, { w, e, s, n }, extra = {}) =>
    ({ id, name, kind, poly: rect(fP(w), fP(s), fN(e), fN(n)), ...extra });

  // Vanos en coordenadas absolutas: asi una puerta sigue donde esta aunque
  // el muro cambie de largo.
  const vano = (type, a, b, y0, y1) => ({ type, a, b, y0, y1 });
  const puerta = (a, b, h = 2.10) => vano('door', a, b, 0, h);
  const paso   = (a, b, h = 2.40) => vano('pass', a, b, 0, h);
  const ventana = (a, b, y0 = 0.95, y1 = 2.20) => vano('win', a, b, y0, y1);

  const armaVanos = (ops, ini, fin) => {
    const dir = Math.sign(fin - ini) || 1;
    return ops.map((o) => {
      const s1 = (o.a - ini) * dir, s2 = (o.b - ini) * dir;
      return { s: Math.min(s1, s2), e: Math.max(s1, s2), y0: o.y0, y1: o.y1, type: o.type };
    });
  };

  // Muro vertical (corre en Y sobre un eje X) y horizontal (corre en X).
  const muroX = (id, eje, desde, hasta, o = {}) => ({
    id, a: [cl(eje), cl(desde)], b: [cl(eje), cl(hasta)],
    t: o.t ?? th(eje), h: o.h ?? H.FLOOR, kind: o.kind ?? 'int',
    base: o.base ?? 0, openings: armaVanos(o.vanos || [], cl(desde), cl(hasta)),
  });
  const muroY = (id, eje, desde, hasta, o = {}) => ({
    id, a: [cl(desde), cl(eje)], b: [cl(hasta), cl(eje)],
    t: o.t ?? th(eje), h: o.h ?? H.FLOOR, kind: o.kind ?? 'int',
    base: o.base ?? 0, openings: armaVanos(o.vanos || [], cl(desde), cl(hasta)),
  });

  /* --- puntos de uso frecuente ----------------------------------------- */
  const O = { w: fN('XW'), e: fP('XE') };          // caras exteriores poniente/oriente
  const nN1 = fP('Y_N1_N');                        // cara exterior norte del bloque alto
  const sSala = fN('Y_SALA_S');                    // cara exterior sur de la sala

  // Caja de la escalera a los cuartos
  const e2 = { ...ESC.e2 };
  e2.yTop = e2.yBot + (e2.peraltes - 1) * e2.huella;   // cabecera en la sala
  const e2w = ESC.ancho / 2 + e2.holgura;          // medio hueco en la losa
  const e2m = ESC.ancho / 2 + e2.holgura + e2.muro / 2;   // eje de sus muros

  /* ======================================================================
     NIVEL 0 - COCHERA
     ==================================================================== */
  const vanoZot = cuarto('n0.vano', 'Vano zotehuela', 'void',
    { w: 'X_MB', e: 'X_COC', s: 'Y_BAND_S', n: 'Y_N1_N' });
  const huecoEsc = cuarto('n0.hueco', 'Acceso escaleras', 'stairs',
    { w: 'XW', e: 'X_VEST', s: 'Y_BAND_S', n: 'Y_N1_N' });

  const N0 = {
    id: 'N0',
    name: 'Nivel 0 - Cochera (calle)',
    z: Z.N0,
    wallH: H.PAR,
    slab: {
      outline: rect(O.w, sSala, O.e, nN1),
      holes: [vanoZot.poly, huecoEsc.poly],
      z: Z.N0, t: H.SLAB,
    },
    rooms: [
      cuarto('n0.cochera', 'Cochera', 'exterior',
        { w: 'XW', e: 'XE', s: 'Y_SALA_S', n: nN1 }),
      vanoZot,
      huecoEsc,
    ],
    walls: [
      muroY('n0.pretil-sur', 'Y_SALA_S', O.w, O.e, { t: T.PAR, h: H.PAR, kind: 'parapet' }),
      muroX('n0.pretil-poniente', 'XW', sSala, nN1, { t: T.PAR, h: H.PAR, kind: 'parapet' }),
      muroX('n0.pretil-oriente', 'XE', sSala, nN1, { t: T.PAR, h: H.PAR, kind: 'parapet' }),
      // pretil de la calle; los autos entran al oriente del vano
      muroY('n0.pretil-calle', 'Y_N1_N', O.w, O.e, {
        t: T.PAR, h: H.PAR, kind: 'parapet',
        vanos: [paso(fP('X_COC') + 0.06, fP('X_COC') + 3.26, H.PAR)],
      }),
      // barandal del vano de la zotehuela
      muroY('n0.rail-vano-sur', fP('Y_BAND_S'), fP('X_MB'), fN('X_COC'),
        { t: T.RAIL, h: H.PAR, kind: 'rail' }),
      muroX('n0.rail-vano-poniente', fP('X_MB'), fP('Y_BAND_S'), fN('Y_N1_N'),
        { t: T.RAIL, h: H.PAR, kind: 'rail' }),
      muroX('n0.rail-vano-oriente', fN('X_COC'), fP('Y_BAND_S'), fN('Y_N1_N'),
        { t: T.RAIL, h: H.PAR, kind: 'rail' }),
      // prisma de acceso a la escalera, a la izquierda del vano
      muroY('n0.prisma-sur', 'Y_PRISM_S', O.w, 'X_VEST', { t: T.EXT, h: H.PRISM, kind: 'ext' }),
      muroY('n0.prisma-norte', 'Y_N1_N', O.w, 'X_VEST', { t: T.EXT, h: H.PRISM, kind: 'ext' }),
      muroX('n0.prisma-poniente', 'XW', 'Y_PRISM_S', 'Y_N1_N', { t: T.EXT, h: H.PRISM, kind: 'ext' }),
      muroX('n0.prisma-oriente', 'X_VEST', 'Y_PRISM_S', 'Y_N1_N', {
        t: T.EXT, h: H.PRISM, kind: 'ext',
        vanos: [puerta(ESC.e1.yIda - 0.415, ESC.e1.yIda + 0.435)],
      }),
    ],
    extraSlabs: [
      { id: 'n0.tapa-prisma', mat: 'concrete', holes: [], t: 0.12,
        outline: rect(O.w, cl('Y_PRISM_S') - 0.10, cl('X_VEST') + 0.10, cl('Y_N1_N') + 0.10),
        z: Z.N0 + H.PRISM + 0.12 },
    ],
  };

  /* ======================================================================
     NIVEL 1 - INTERMEDIO
     ==================================================================== */
  const N1 = {
    id: 'N1',
    name: 'Nivel 1 - Intermedio (sala, cocina)',
    z: Z.N1,
    wallH: H.FLOOR,
    slab: {
      outline: rect(O.w, sSala, O.e, nN1),
      // El hueco tiene que quedar DENTRO del contorno de la losa: si se sale,
      // la triangulacion lo ignora y la losa termina tapando la escalera.
      holes: [rect(e2.x - e2w, sSala + 0.02, e2.x + e2w, e2.yTop)],
      z: Z.N1, t: H.SLAB,
    },
    rooms: [
      // La sala es una L: 4.00 de fondo frente a la cocina y 4.72 frente al resto
      { id: 'n1.sala', name: 'Sala', kind: 'living',
        dim: '9.64 x 4.00 (4.72 fuera de la cocina)',
        poly: [[fP('XW'), fP('Y_SALA_S')], [fN('XE'), fP('Y_SALA_S')],
               [fN('XE'), fN('Y_COC_S')], [fP('X_COC'), fN('Y_COC_S')],
               [fP('X_COC'), fN('Y_BAND_S')], [fP('XW'), fN('Y_BAND_S')]] },
      cuarto('n1.vestibulo', 'Vestibulo / escaleras', 'hall',
        { w: 'XW', e: 'X_VEST', s: 'Y_BAND_S', n: 'Y_N1_N' }),
      cuarto('n1.mediobano', 'Medio bano', 'bath',
        { w: 'X_VEST', e: 'X_MB', s: 'Y_BAND_S', n: 'Y_N1_N' }),
      cuarto('n1.zotehuela', 'Zotehuela', 'patio',
        { w: 'X_MB', e: 'X_COC', s: 'Y_BAND_S', n: 'Y_N1_N' }, { dim: '1.54 x 1.82' }),
      cuarto('n1.cocina', 'Cocina', 'kitchen',
        { w: 'X_COC', e: 'XE', s: 'Y_COC_S', n: 'Y_N1_N' }),
    ],
    walls: [
      /* ---- exteriores ---- */
      muroY('n1.fachada-sur', 'Y_SALA_S', O.w, O.e, {
        t: T.GLASS, kind: 'glass',
        vanos: [paso(e2.x - e2w, e2.x + e2w), puerta(7.20, 8.60, 2.40)],
      }),
      muroX('n1.ext-poniente', 'XW', sSala, 'Y_N1_N', { t: T.EXT, kind: 'ext' }),
      // Sin ventanas: atras no hay nada mas que el cerro
      muroY('n1.ext-norte', 'Y_N1_N', O.w, O.e, { t: T.EXT, kind: 'ext' }),
      muroX('n1.ext-oriente', 'XE', sSala, 'Y_N1_N', { t: T.EXT, kind: 'ext' }),

      /* ---- interiores ---- */
      // sala | cocina: este muro esta 0.72 mas al sur que el de los otros tres.
      // La cocina da a la sala por una puerta normal del lado poniente.
      muroY('n1.sala-cocina', 'Y_COC_S', 'X_COC', O.e, {
        t: T.INT, vanos: [puerta(fP('X_COC') + 0.06, fP('X_COC') + 0.96)],
      }),
      // sala | escaleras, medio bano y zotehuela. La zotehuela NO da a la sala:
      // solo se entra a ella desde la cocina.
      muroY('n1.sala-banda', 'Y_BAND_S', O.w, 'X_COC', {
        t: T.INT,
        vanos: [paso(2.40, fN('X_VEST')), puerta(3.60, 4.44)],
      }),
      // divisiones de la banda
      muroX('n1.vest-mediobano', 'X_VEST', 'Y_BAND_S', 'Y_N1_N', { t: T.INT }),
      muroX('n1.mediobano-zotehuela', 'X_MB', 'Y_BAND_S', 'Y_N1_N', { t: T.INT }),
      muroX('n1.zotehuela-cocina', 'X_COC', 'Y_COC_S', 'Y_N1_N', {
        t: T.INT, vanos: [puerta(5.76, 6.60)],
      }),
    ],
  };

  /* ======================================================================
     NIVEL 2 - INFERIOR
     ==================================================================== */
  // Contorno escalonado del nivel inferior, igual para la losa de piso y
  // para la terraza que le hace de techo.
  const contornoN2 = [
    [O.w, fP('Y_N2_N')], [O.e, fP('Y_N2_N')], [O.e, cl('Y_R3_S')],
    [cl('X_R2R3'), cl('Y_R3_S')], [cl('X_R2R3'), cl('Y_R2_S')],
    [cl('X_R1R2'), cl('Y_R2_S')], [cl('X_R1R2'), cl('Y_R1_S')], [O.w, cl('Y_R1_S')],
  ];
  // Patio: sigue el escalonado de la fachada y se cierra contra la barda.
  const patio = [
    [fP('XW'), fP('Y_BARDA')], [fN('XE'), fP('Y_BARDA')],
    [fN('XE'), fN('Y_R3_S')], [cl('X_R2R3'), fN('Y_R3_S')],
    [cl('X_R2R3'), fN('Y_R2_S')], [cl('X_R1R2'), fN('Y_R2_S')],
    [cl('X_R1R2'), fN('Y_R1_S')], [fP('XW'), fN('Y_R1_S')],
  ];
  const zotN2 = cuarto('n2.zotehuela', 'Zotehuela', 'patio',
    { w: 'X_ZOT_W', e: 'XE', s: 'Y_N2_R', n: 'Y_N2_N' }, { dim: '2.74 x 1.68' });

  const N2 = {
    id: 'N2',
    name: 'Nivel 2 - Inferior (recamaras)',
    z: Z.N2,
    wallH: H.FLOOR,
    slab: { outline: contornoN2, holes: [], z: Z.N2, t: H.SLAB },
    roofSlab: { outline: contornoN2, holes: [zotN2.poly], z: Z.N1, t: H.SLAB },
    rooms: [
      cuarto('n2.rec1', 'Recamara 1', 'bed',
        { w: 'XW', e: 'X_R1R2', s: 'Y_R1_S', n: 'Y_N2_N' }),
      cuarto('n2.rec2', 'Recamara 2', 'bed',
        { w: 'X_R1R2', e: 'X_R2R3', s: 'Y_R2_S', n: 'Y_N2_R' }),
      cuarto('n2.rec3', 'Recamara 3', 'bed',
        { w: 'X_R2R3', e: 'XE', s: 'Y_R3_S', n: 'Y_R3_N' }),
      cuarto('n2.closet3', 'Closet rec. 3', 'closet',
        { w: 'X_BANO_W', e: 'XE', s: 'Y_CLOSET', n: 'Y_R3_N' }),
      cuarto('n2.acceso1', 'Acceso / closet rec. 1', 'closet',
        { w: 'X_R1R2', e: 'X_ACC_E', s: 'Y_N2_R', n: 'Y_N2_N' }),
      cuarto('n2.pasillo', 'Pasillo', 'hall',
        { w: 'X_ACC_E', e: 'X_ZOT_W', s: 'Y_N2_R', n: 'Y_N2_N' }, { dim: '2.01 x 1.68' }),
      cuarto('n2.paso', 'Paso a rec. 3 y bano', 'hall',
        { w: 'X_R2R3', e: 'X_BANO_W', s: 'Y_R3_N', n: 'Y_N2_R' }),
      cuarto('n2.bano', 'Bano completo', 'bath',
        { w: 'X_BANO_W', e: 'XE', s: 'Y_R3_N', n: 'Y_N2_R' }, { dim: '2.00 x 1.80' }),
      zotN2,
      { id: 'n2.patio', name: 'Patio', kind: 'lawn', poly: patio },
    ],
    extraSlabs: [
      { id: 'n2.losa-patio', outline: patio, holes: [], z: Z.N2, t: 0.15,
        mat: 'lawn', walkable: true },
    ],
    walls: [
      /* ---- exteriores ---- */
      muroY('n2.contencion-norte', 'Y_N2_N', O.w, O.e, {
        t: T.EXT, kind: 'ext',
        vanos: [paso(e2.x - e2w, e2.x + e2w, H.FLOOR)],
      }),
      muroX('n2.ext-poniente', 'XW', 'Y_N2_N', 'Y_R1_S', { t: T.EXT, kind: 'ext' }),
      muroX('n2.ext-oriente', 'XE', 'Y_N2_N', 'Y_R3_S', { t: T.EXT, kind: 'ext' }),
      // fachadas escalonadas, ventanales de piso a techo
      muroY('n2.fachada-rec3', 'Y_R3_S', 'X_R2R3', O.e, { t: T.GLASS, kind: 'glass' }),
      muroX('n2.quiebre-rec3', 'X_R2R3', 'Y_R3_S', 'Y_R2_S', { t: T.EXT, kind: 'ext' }),
      muroY('n2.fachada-rec2', 'Y_R2_S', 'X_R1R2', 'X_R2R3', { t: T.GLASS, kind: 'glass' }),
      muroX('n2.quiebre-rec2', 'X_R1R2', 'Y_R2_S', 'Y_R1_S', { t: T.EXT, kind: 'ext' }),
      muroY('n2.fachada-rec1', 'Y_R1_S', O.w, 'X_R1R2', {
        t: T.GLASS, kind: 'glass', vanos: [puerta(1.30, 2.20, 2.40)],
      }),

      /* ---- interiores ---- */
      muroX('n2.rec1-oriente', 'X_R1R2', 'Y_R1_S', 'Y_N2_N', {
        t: T.BAND, vanos: [puerta(-1.25, -0.40)],
      }),
      muroX('n2.acceso1-pasillo', 'X_ACC_E', 'Y_N2_R', 'Y_N2_N', {
        t: T.BAND, vanos: [paso(-1.29, -0.29)],
      }),
      muroX('n2.pasillo-zotehuela', 'X_ZOT_W', 'Y_N2_R', 'Y_N2_N', {
        t: T.BAND, vanos: [puerta(-1.24, -0.34)],
      }),
      muroY('n2.banda-recamaras', 'Y_N2_R', fN('X_R1R2'), O.e, {
        t: T.INT,
        vanos: [puerta(5.10, 6.00), paso(fP('X_R2R3'), fN('X_ZOT_W'))],
      }),
      muroX('n2.rec2-oriente', 'X_R2R3', 'Y_R2_S', 'Y_N2_R', { t: T.INT }),
      // muro de 2.78: divide el bano del paso y su excedente forma el closet
      muroX('n2.muro-278', 'X_BANO_W', fN('Y_N2_R'), 'Y_CLOSET', {
        t: T.INT, vanos: [puerta(-2.20, -3.04)],
      }),
      muroY('n2.bano-rec3', 'Y_R3_N', 'X_R2R3', O.e, {
        t: T.INT, vanos: [puerta(6.64, 7.54)],
      }),
      // caja de la escalera que baja de la sala: sin estos muros se ve el
      // cielo por los costados y se puede caer fuera del tramo
      muroX('n2.caja-esc-poniente', e2.x - e2m, 'Y_N2_N', e2.yTop,
        { t: e2.muro, h: (Z.N1 + 1.00) - Z.N2 }),
      muroX('n2.caja-esc-oriente', e2.x + e2m, 'Y_N2_N', e2.yTop,
        { t: e2.muro, h: (Z.N1 + 1.00) - Z.N2 }),

      /* ---- bardas del patio ---- */
      muroY('n2.barda-frente', 'Y_BARDA', O.w, O.e,
        { t: T.PAR, h: H.BARDA, kind: 'ext' }),
      muroX('n2.barda-poniente', O.w + T.PAR / 2, 'Y_BARDA', 'Y_R1_S',
        { t: T.PAR, h: H.BARDA, kind: 'ext' }),
      muroX('n2.barda-oriente', O.e - T.PAR / 2, 'Y_BARDA', 'Y_R3_S',
        { t: T.PAR, h: H.BARDA, kind: 'ext' }),
    ],
    parapets: [
      muroY('n2.pretil-rec1', 'Y_R1_S', O.w, 'X_R1R2', { t: T.PAR, h: H.PAR, kind: 'parapet', base: Z.N1 - Z.N2 }),
      muroX('n2.pretil-q1', 'X_R1R2', 'Y_R1_S', 'Y_R2_S', { t: T.PAR, h: H.PAR, kind: 'parapet', base: Z.N1 - Z.N2 }),
      muroY('n2.pretil-rec2', 'Y_R2_S', 'X_R1R2', 'X_R2R3', { t: T.PAR, h: H.PAR, kind: 'parapet', base: Z.N1 - Z.N2 }),
      muroX('n2.pretil-q2', 'X_R2R3', 'Y_R2_S', 'Y_R3_S', { t: T.PAR, h: H.PAR, kind: 'parapet', base: Z.N1 - Z.N2 }),
      muroY('n2.pretil-rec3', 'Y_R3_S', 'X_R2R3', O.e, { t: T.PAR, h: H.PAR, kind: 'parapet', base: Z.N1 - Z.N2 }),
      muroX('n2.pretil-poniente', O.w + 0.05, 'Y_R1_S', fP('Y_N2_N'), { t: T.PAR, h: H.PAR, kind: 'parapet', base: Z.N1 - Z.N2 }),
      muroX('n2.pretil-oriente', O.e - 0.05, 'Y_R3_S', fP('Y_N2_N'), { t: T.PAR, h: H.PAR, kind: 'parapet', base: Z.N1 - Z.N2 }),
    ],
  };

  /* ======================================================================
     ESCALERAS
     ==================================================================== */
  const e1 = ESC.e1;
  const STAIRS = [
    // N0 -> N1 : en U dentro del prisma, con descanso al fondo. Va SIN relleno
    // (cada escalon es un prisma) para dejar libre el paso que hay debajo.
    // Bajas por el
    // lado sur hacia el poniente, das la vuelta a la DERECHA y sigues bajando
    // hacia el oriente. 17 peraltes de 17.06 cm y huellas de 25 cm.
    { id: 'e1a', from: [e1.xTop, e1.yIda], to: [e1.xTurn, e1.yIda],
      z0: Z.N0, z1: e1.zDescanso, width: ESC.ancho, sinRelleno: true,
      note: 'tramo 1, 9 peraltes (hacia la izquierda)' },
    { id: 'e1l', z: e1.zDescanso, note: 'descanso',
      landing: rect(e1.descansoX0, fP('Y_BAND_S'), e1.xTurn, fN('Y_N1_N')) },
    { id: 'e1b', from: [e1.xTurn, e1.yVuelta], to: [e1.xBot, e1.yVuelta],
      z0: e1.zDescanso, z1: Z.N1, width: ESC.ancho, sinRelleno: true,
      note: 'tramo 2, 8 peraltes (hacia la derecha)' },

    // N1 -> N2 : tramo recto hacia el sur, entre muros. 13 escalones
    // contados en la casa, o sea 14 peraltes de 20.7 cm con huellas de 25:
    // sale empinada, pero es lo que hay. Le sobresalen 2 dentro del pasillo.
    { id: 'e2', from: [e2.x, e2.yTop], to: [e2.x, e2.yBot],
      z0: Z.N1, z1: Z.N2, width: ESC.ancho, rail: false, peraltes: e2.peraltes,
      note: 'sala -> recamaras, entre muros' },
  ];

  /* ======================================================================
     ENTORNO
     ==================================================================== */
  const SITE = {
    street: { poly: rect(-14, nN1, 24, nN1 + 7.94), z: Z.N0 },
    groundLow: { poly: rect(-14, -24, 24, fN('Y_BARDA') - 0.10), z: Z.N2 - 0.02 },
    groundSideW: { poly: rect(-14, -24, O.w, sSala), z: Z.N2 - 0.02 },
    groundSideE: { poly: rect(O.e, -24, 24, sSala), z: Z.N2 - 0.02 },
  };

  /* --- parches por id --------------------------------------------------- */
  const LEVELS = [N0, N1, N2].map((lv) => {
    const pre = lv.id.toLowerCase() + '.';
    return {
      ...lv,
      rooms: patchById(lv.rooms, parche.cuartos || {}, pre),
      walls: patchById(lv.walls, parche.muros || {}, pre),
      parapets: lv.parapets ? patchById(lv.parapets, parche.muros || {}, pre) : undefined,
    };
  });

  // AX plano (solo lineas de centro), que es lo que consume el plano 2D
  const AX = Object.fromEntries(Object.entries(EJ).map(([k, v]) => [k, v.at]));

  const casa = {
    T, H, Z, ESC, AX, EJES: EJ, SITE,
    STAIRS: patchById(STAIRS, (parche.escaleras || {}).tramos || {}),
    LEVELS,
    LEVEL_BY_ID: Object.fromEntries(LEVELS.map((l) => [l.id, l])),
    META: {
      title: parche.titulo || 'Casa Cto. Concorde',
      variante: parche.nombre || 'Actual',
      anchoInterior: fN('XE') - fP('XW'),
    },
  };

  // Mover ejes y borrar piezas por id alcanza para la mayoria de los cambios,
  // pero una variante que agrega volumenes nuevos necesita construir. Para eso
  // puede traer una funcion "extra", que recibe la casa ya armada y las mismas
  // herramientas con que se armo.
  if (typeof parche.extra === 'function') {
    parche.extra(casa, {
      cuarto, muroX, muroY, puerta, paso, ventana, vano,
      cl, th, fP, fN, rect, O, T, H, Z, EJ,
    });
  }
  return casa;
}

/* --------------------------------------------------------------------------
   LA CASA ACTUAL (lo que consumen hoy el plano 2D y el visor 3D)
   -------------------------------------------------------------------------- */
const CASA = buildHouse();

export const { T, H, Z, ESC, AX, EJES, SITE, STAIRS, LEVELS, LEVEL_BY_ID, META } = CASA;
export { BASE };
