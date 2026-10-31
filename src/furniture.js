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

/* ------------------------- distribucion --------------------------- */
export function buildFurniture(M) {
  const g = new THREE.Group();
  g.name = 'mobiliario';

  /* ---------- N1: SALA ---------- */
  sofa(g, M, 2.10, 1.10, Z.N1, 2.40, 0.95, 0);
  box(g, M.woodDark, 2.10, 2.30, Z.N1, 1.10, 0.55, 0.38);        // mesa de centro
  box(g, M.woodLight, 2.10, 4.55, Z.N1, 1.80, 0.40, 0.50);       // mueble de TV
  box(g, M.stone, 2.10, 4.53, Z.N1 + 0.50, 1.30, 0.06, 0.74);    // TV
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

  /* ---------- N2: ZOTEHUELA ---------- */
  box(g, M.stone, 9.40, -1.20, Z.N2, 0.70, 0.55, 0.90);           // lavadero
  cyl(g, M.woodDark, 7.60, -0.90, Z.N2, 0.26, 0.38);              // maceta

  /* ---------- N0: COCHERA ---------- */
  car(g, M, 8.00, 4.40, Z.N0);
  car(g, M, 2.60, 2.90, Z.N0);

  return g;
}
