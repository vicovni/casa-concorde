/* ============================================================================
   MOBILIARIO — volumenes parametricos sencillos.
   Coordenadas de PLANTA (x,y) + cota z.  Se traducen a 3D con X=x, Y=z, Z=-y.
   Pensado para irse refinando pieza por pieza.
   ========================================================================== */
import * as THREE from 'three';
import { Z } from './model.js';

/** caja: centro en (x,y), base en z, tamanos sx (eje x), sy (eje y), h (alto) */
function box(g, mat, x, y, z, sx, sy, h) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sy), mat);
  m.position.set(x, z + h / 2, -y);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  return m;
}

function cyl(g, mat, x, y, z, r, h) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat);
  m.position.set(x, z + h / 2, -y);
  m.castShadow = true; g.add(m);
  return m;
}

/* ----------------------------- piezas ----------------------------- */
function sofa(g, M, x, y, z, w = 2.20, d = 0.90, rot = 0) {
  const grp = new THREE.Group();
  const b = (mat, cx, cy, cz, sx, sy, h) => box(grp, mat, cx, cy, cz, sx, sy, h);
  b(M.fabric, 0, 0, 0, w, d, 0.40);
  b(M.fabric, 0, -d / 2 + 0.12, 0.40, w, 0.24, 0.45);           // respaldo
  b(M.fabric, -w / 2 + 0.10, 0, 0.40, 0.20, d, 0.22);
  b(M.fabric, w / 2 - 0.10, 0, 0.40, 0.20, d, 0.22);
  grp.position.set(x, z, -y);
  grp.rotation.y = rot;
  g.add(grp);
}

function bed(g, M, x, y, z, w = 1.60, l = 2.00) {
  box(g, M.woodDark, x, y, z, w + 0.10, l + 0.10, 0.32);
  box(g, M.fabric2, x, y, z + 0.32, w, l, 0.26);
  box(g, M.white, x, y + l / 2 - 0.28, z + 0.58, w - 0.25, 0.42, 0.12);  // almohadas
  box(g, M.woodDark, x, y + l / 2 + 0.06, z, w + 0.10, 0.08, 0.95);      // cabecera
}

function nightstand(g, M, x, y, z) {
  box(g, M.woodLight, x, y, z, 0.45, 0.40, 0.50);
}

function closet(g, M, x, y, z, w, d) {
  box(g, M.woodLight, x, y, z, w, d, 2.30);
}

function kitchenRun(g, M, x, y, z, w, d, horizontal = true) {
  const sx = horizontal ? w : d, sy = horizontal ? d : w;
  box(g, M.white, x, y, z, sx, sy, 0.86);                 // gabinetes bajos
  box(g, M.stone, x, y, z + 0.86, sx + 0.04, sy + 0.04, 0.05);   // cubierta
}

function wc(g, M, x, y, z) {
  box(g, M.white, x, y, z, 0.38, 0.62, 0.40);
  box(g, M.white, x, y + 0.30, z, 0.38, 0.20, 0.72);
}

function lavabo(g, M, x, y, z) {
  box(g, M.white, x, y, z + 0.78, 0.55, 0.42, 0.14);
  box(g, M.woodLight, x, y, z, 0.55, 0.42, 0.78);
  cyl(g, M.steel, x, y + 0.12, z + 0.92, 0.022, 0.22);
}

function shower(g, M, x, y, z, w, d) {
  box(g, M.stone, x, y, z, w, d, 0.06);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xdfeef4, transparent: true, opacity: 0.18, roughness: 0.05,
    side: THREE.DoubleSide,
  });
  box(g, glass, x, y - d / 2, z, w, 0.02, 2.00);
}

function car(g, M, x, y, z) {
  const body = new THREE.MeshStandardMaterial({ color: 0x8c2f2a, roughness: 0.35, metalness: 0.3 });
  box(g, body, x, y, z + 0.30, 1.80, 4.40, 0.70);
  box(g, body, x, y - 0.15, z + 1.00, 1.60, 2.30, 0.60);
  const t = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  for (const [dx, dy] of [[-0.85, 1.45], [0.85, 1.45], [-0.85, -1.45], [0.85, -1.45]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.20, 18), t);
    w.rotation.z = Math.PI / 2;
    w.position.set(x + dx, z + 0.32, -(y + dy));
    g.add(w);
  }
}

/* ===================== JARDIN ZEN DE LA ZOTEHUELA =====================
   La zotehuela del nivel inferior no es un patio cualquiera: es un pozo de
   luz de 2.74 x 1.68 y 2.90 de alto, con el unico hueco que tiene la losa de
   la terraza justo encima. Se ve desde arriba, que es como se mira un jardin
   seco, y se entra por una puerta del pasillo.

   El reparto esta hecho para que el jardin y la escalera volada de la
   variante 3 NO se estorben: esa escalera cruza la zotehuela por la esquina
   noroeste (x hasta 8.60, y de -0.91 a 0.00), asi que ahi no se pone nada y
   el jardin se arma en L, en la franja oriente y en la sur. Asi es una sola
   pieza que sirve igual en el as-is y en la variante 3; no hay dos versiones
   que mantener. Donde no cabe es en las variantes 2 y 2b: ahi la escalera
   baja dentro de la zotehuela y el pozo se vuelve el arranque del tramo y la
   ruta a las recamaras, asi que el jardin no se pone.
   ==================================================================== */
const ZOT = { x0: 7.10, x1: 9.84, y0: -1.68, y1: 0.00 };
const JARDIN = {
  xPaso: 7.80,          // de 7.10 a aqui: entrada desde la puerta del pasillo
  xEsc: 8.70,           // al poniente de esto y al norte de yEsc cuelga la
  yEsc: -1.00,          // escalera volada de la variante 3: queda vacio
  lecho: 0.05,          // espesor de la cama de arena
};

/** azar con semilla: el jardin se arma igual cada vez que se rehace la casa */
function azar(semilla) {
  let v = semilla;
  return () => (v = (v * 1103515245 + 12345) % 2147483648) / 2147483648;
}

function camaArena(g, M, x0, y0, x1, y1, z) {
  const m = box(g, M.arena, (x0 + x1) / 2, (y0 + y1) / 2, z,
                x1 - x0, y1 - y0, JARDIN.lecho);
  m.castShadow = false;
  return m;
}

/** Piedra: un icosaedro achatado y girado, que se lee como canto rodado.
 *  Va enterrada como un 20%: una piedra posada encima se ve de utileria, y en
 *  un jardin seco la gracia es que parezca que sale de la tierra. */
function piedra(g, M, x, y, z, ancho, alto, rnd) {
  const geo = new THREE.IcosahedronGeometry(ancho / 2, 0);
  geo.scale(1, alto / ancho, 0.82);
  const m = new THREE.Mesh(geo, M.roca);
  m.position.set(x, z + alto * 0.30, -y);
  m.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6, (rnd() - 0.5) * 0.5);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
}

/** Henequen: roseta de pencas. Cada penca es una piramide aplastada que sale
 *  del centro y se abre. `radio` es lo que mide la roseta de ancho a cada
 *  lado, no el largo de la penca: una penca tumbada llega mas lejos que
 *  parada, y en una cama de 1.14 eso es la diferencia entre caber y no. La
 *  planta acaba midiendo como 1.1 radios de alto. */
function henequen(g, M, x, y, z, radio, rnd) {
  const grp = new THREE.Group();
  const n = 11;
  const largoMax = radio / 0.85;        // la penca mas tumbada llega al radio
  for (let i = 0; i < n; i++) {
    const largo = largoMax * (0.72 + rnd() * 0.28);
    const geo = new THREE.ConeGeometry(largoMax * 0.13, largo, 4);
    geo.scale(0.32, 1, 1);                       // penca plana, no un palo
    const penca = new THREE.Mesh(geo, M.henequen);
    const abre = 0.30 + (i / n) * 0.35 + rnd() * 0.35;   // cuanto se tumba
    penca.rotation.x = abre;
    penca.position.set(0, Math.cos(abre) * largo / 2, Math.sin(abre) * largo / 2);
    const eje = new THREE.Group();
    eje.rotation.y = (i / n) * Math.PI * 2 + rnd() * 0.25;
    eje.add(penca);
    grp.add(eje);
  }
  grp.position.set(x, z, -y);
  grp.traverse((o) => { o.castShadow = true; });
  g.add(grp);
}

/** Enredadera sobre un muro: un pano de follaje pegado a su cara mas hojas
 *  sueltas por delante y por encima, para que el borde no quede a escuadra. */
function enredadera(g, M, a, b, z, alto, rnd) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
  const grp = new THREE.Group();
  grp.position.set(a[0], z, -a[1]);
  grp.rotation.y = Math.atan2(uy, ux);   // +x local corre sobre el muro,
                                         // +z local se mete en el muro
  const pano = new THREE.Mesh(new THREE.PlaneGeometry(len, alto), M.follaje);
  pano.position.set(len / 2, alto / 2, -0.03);
  pano.receiveShadow = true;
  grp.add(pano);
  for (let i = 0; i < 90; i++) {
    const hoja = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07 + rnd() * 0.06, 0.05 + rnd() * 0.04), M.follaje);
    hoja.position.set(rnd() * len, (rnd() * 1.08 - 0.04) * alto, -0.07 - rnd() * 0.08);
    hoja.rotation.set(rnd() * 1.2 - 0.6, rnd() * 1.2 - 0.6, rnd() * 6);
    grp.add(hoja);
  }
  g.add(grp);
}

/** El pozo deja de ser jardin cuando una escalera ATERRIZA dentro de el: ahi
 *  se vuelve el arranque del tramo y la ruta a las recamaras. Lo que cuenta es
 *  el pie del tramo, no cualquier extremo: la escalera volada de la variante 3
 *  tiene su cabeza sobre el pozo, pero pasa volando a 2 m de altura y baja a
 *  caer al poniente, asi que esa convive con el jardin. */
function zotehuelaLibre(casa) {
  if (!casa) return true;
  return !casa.STAIRS.some((s) => {
    if (s.landing) return false;
    const pie = s.z0 <= s.z1 ? s.from : s.to;      // el extremo de abajo
    return pie[0] > ZOT.x0 && pie[0] < ZOT.x1
        && pie[1] > ZOT.y0 && pie[1] < ZOT.y1;
  });
}

function jardinZen(g, M) {
  const rnd = azar(20251104);
  const z = Z.N2;
  const { xPaso, xEsc, yEsc } = JARDIN;

  // las dos camas de arena, en L alrededor de la esquina de la escalera
  camaArena(g, M, xEsc, ZOT.y0, ZOT.x1, ZOT.y1, z);          // franja oriente
  camaArena(g, M, xPaso, ZOT.y0, xEsc, yEsc, z);             // franja sur

  // enredadera: el muro del fondo visto desde la puerta, y la vuelta por el
  // de contencion en el tramo que la escalera volada no ocupa
  enredadera(g, M, [ZOT.x1, ZOT.y0], [ZOT.x1, ZOT.y1], z + 0.12, 2.45, rnd);
  enredadera(g, M, [ZOT.x1, ZOT.y1], [xEsc, ZOT.y1], z + 0.35, 2.10, rnd);

  // henequenes: el grande al centro de la cama oriente, dos chicos de
  // contrapunto. Ninguno pasa de x 8.70 ni sube de y -1.00 en la cama sur.
  henequen(g, M, 9.30, -1.08, z + JARDIN.lecho, 0.42, rnd);
  henequen(g, M, 9.56, -0.20, z + JARDIN.lecho, 0.18, rnd);
  henequen(g, M, 8.28, -1.32, z + JARDIN.lecho, 0.26, rnd);

  // piedras: una grande y una mediana hacen pareja, la laja va en la franja
  // sur como para pisarla
  piedra(g, M, 9.00, -0.40, z + 0.02, 0.44, 0.32, rnd);
  piedra(g, M, 9.32, -0.66, z + 0.02, 0.24, 0.16, rnd);
  piedra(g, M, 8.08, -1.26, z + 0.02, 0.40, 0.08, rnd);
  for (const [px, py, d] of [[8.86, -1.58, 0.13], [9.70, -1.44, 0.10],
                             [8.78, -0.22, 0.11], [9.18, -1.61, 0.09],
                             [8.28, -1.60, 0.10], [8.62, -1.12, 0.12]]) {
    piedra(g, M, px, py, z + 0.03, d, d * 0.6, rnd);
  }
}

/* ------------------------- distribucion --------------------------- */
export function buildFurniture(M, casa = null) {
  const g = new THREE.Group();
  g.name = 'mobiliario';

  /* ---------- N1: SALA ---------- */
  sofa(g, M, 2.10, 1.10, Z.N1, 2.40, 0.95, 0);
  box(g, M.woodDark, 2.10, 2.30, Z.N1, 1.10, 0.55, 0.38);        // mesa de centro
  box(g, M.woodLight, 1.30, 4.55, Z.N1, 1.80, 0.40, 0.50);       // mueble de TV
  box(g, M.stone, 1.30, 4.53, Z.N1 + 0.50, 1.30, 0.06, 0.74);    // TV
  sofa(g, M, 0.75, 2.30, Z.N1, 1.80, 0.90, Math.PI / 2);

  // comedor en la sala, lado derecho
  box(g, M.woodDark, 7.60, 2.10, Z.N1, 1.70, 0.95, 0.75);
  for (const [dx, dy] of [[-0.6, 0.65], [0, 0.65], [0.6, 0.65], [-0.6, -0.65], [0, -0.65], [0.6, -0.65]]) {
    box(g, M.woodLight, 7.60 + dx, 2.10 + dy, Z.N1, 0.42, 0.42, 0.45);
  }

  /* ---------- N1: COCINA (3.50 x 3.60) ---------- */
  kitchenRun(g, M, 9.52, 5.70, Z.N1, 2.30, 0.62, false);          // muro oriente
  kitchenRun(g, M, 8.00, 6.50, Z.N1, 3.00, 0.62, true);           // muro norte
  box(g, M.steel, 9.52, 5.10, Z.N1 + 0.86, 0.60, 0.60, 0.03);     // estufa
  box(g, M.steel, 8.40, 6.50, Z.N1 + 0.84, 0.70, 0.45, 0.06);     // fregadero
  box(g, M.steel, 6.75, 6.45, Z.N1, 0.72, 0.70, 1.80);            // refrigerador
  box(g, M.woodLight, 7.80, 4.95, Z.N1, 1.50, 0.70, 0.90);        // isla / barra
  box(g, M.stone, 7.80, 4.95, Z.N1 + 0.90, 1.65, 0.85, 0.05);

  /* ---------- N1: MEDIO BANO (1.08 x 3.00) ---------- */
  wc(g, M, 4.02, 6.40, Z.N1);
  lavabo(g, M, 4.02, 5.45, Z.N1);

  /* ---------- N1: ALACENA Y ZOTEHUELA (1.54 x 1.73) ---------- */
  box(g, M.white, 5.45, 6.45, Z.N1, 0.60, 0.60, 0.85);            // lavadora
  box(g, M.stone, 5.45, 5.55, Z.N1, 0.70, 0.55, 0.90);            // lavadero

  /* ---------- N2: RECAMARA 1 (2.80 x 4.60) ---------- */
  bed(g, M, 1.55, -2.80, Z.N2, 1.60, 2.00);
  nightstand(g, M, 0.52, -1.55, Z.N2);
  nightstand(g, M, 2.52, -1.55, Z.N2);

  /* ---------- N2: RECAMARA 2 (3.10 x 3.70) ---------- */
  bed(g, M, 4.55, -3.90, Z.N2, 1.40, 1.95);
  nightstand(g, M, 5.60, -2.70, Z.N2);

  /* ---------- N2: RECAMARA 3 (3.50 x 2.80) ---------- */
  bed(g, M, 7.70, -5.30, Z.N2, 1.40, 1.95);
  nightstand(g, M, 6.80, -4.20, Z.N2);

  /* ---------- N2: areas de acceso que hacen de closet ---------- */
  closet(g, M, 3.95, -1.35, Z.N2, 1.45, 0.55);   // acceso-closet rec. 1
  closet(g, M, 8.84, -4.10, Z.N2, 1.90, 0.60);   // closet rec. 3

  /* ---------- N2: BANO COMPLETO (1.80 x 2.00) ---------- */
  wc(g, M, 8.25, -3.15, Z.N2);
  lavabo(g, M, 9.40, -3.15, Z.N2);
  shower(g, M, 8.84, -2.15, Z.N2, 1.90, 0.70);

  /* ---------- N2: ZOTEHUELA, JARDIN ZEN ----------
     El lavadero se recorre a la franja de entrada, que es la unica parte del
     pozo que no es ni jardin ni el aire de la escalera de la variante 3. La
     maceta que estaba a 7.60 se va: caia justo bajo ese tramo. */
  box(g, M.stone, 7.45, -1.42, Z.N2, 0.70, 0.50, 0.90);           // lavadero
  if (zotehuelaLibre(casa)) jardinZen(g, M);

  /* ---------- N0: COCHERA ---------- */
  car(g, M, 8.00, 4.40, Z.N0);
  car(g, M, 2.60, 2.90, Z.N0);

  return g;
}
