/* ============================================================================
   PLANO 2D — genera SVG a partir de src/model.js
   ========================================================================== */
import {
  buildHouse, wallPieces, pieceRect, polyBBox, polyArea, stairSteps,
} from './model.js';

const PPM = 46;          // pixeles por metro
const PAD = 1.4;         // margen en metros

const FILL = {
  living: '#e8eef5', hall: '#eef1f4', kitchen: '#e9f3ec', bath: '#e6f0f6',
  bed: '#f3eee6', patio: '#dfeadd', service: '#f0eef4', closet: '#efe9df',
  exterior: '#eceae4', stairs: '#f6f1e3', void: '#cfdbe6', lawn: '#cfe0c4',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const f = (n) => (Math.round(n * 1000) / 1000).toString();

/* ------------------------------------------------------------------ */
function levelBBox(level) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = (p) => {
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
  };
  level.slab.outline.forEach(take);
  (level.roofSlab ? level.roofSlab.outline : []).forEach(take);
  level.rooms.forEach((r) => r.poly.forEach(take));
  level.walls.forEach((w) => { take(w.a); take(w.b); });
  return { x0: x0 - PAD, y0: y0 - PAD, x1: x1 + PAD, y1: y1 + PAD };
}

function stairsForLevel(id, STAIRS) {
  if (id === 'N0') return STAIRS.filter((s) => s.id.startsWith('e1'));
  if (id === 'N1') return STAIRS;
  return STAIRS.filter((s) => s.id === 'e2');
}

/* --------------------- cotas (dimension lines) -------------------- */
const DIMS = {
  N0: [
    { a: [0, -0.55], b: [10.04, -0.55], t: '10.04 (exterior)' },
    { a: [10.60, 0], b: [10.60, 7.06], t: '7.06', v: 1 },
  ],
  N1: [
    { a: [0.20, -0.55], b: [9.84, -0.55], t: '9.64 ancho interior' },
    { a: [10.60, 0.20], b: [10.60, 4.20], t: '4.00 sala', v: 1 },
    { a: [11.30, 4.32], b: [11.30, 6.86], t: '2.54 cocina', v: 1 },
    { a: [-0.60, 0.20], b: [-0.60, 4.92], t: '4.72', v: 1 },
    { a: [-1.30, 5.04], b: [-1.30, 6.86], t: '1.82', v: 1 },
    { a: [0.20, 7.45], b: [3.36, 7.45], t: '3.16 escaleras' },
    { a: [3.48, 8.10], b: [4.56, 8.10], t: '1.08' },
    { a: [4.68, 7.45], b: [6.22, 7.45], t: '1.54' },
    { a: [6.34, 8.10], b: [9.84, 8.10], t: '3.50' },
    { a: [11.95, 4.32], b: [11.95, 5.04], t: '0.72 excedente', v: 1 },
  ],
  N2: [
    { a: [0.20, -5.10], b: [2.99, -5.10], t: '2.79' },
    { a: [3.17, -6.00], b: [6.27, -6.00], t: '3.10' },
    { a: [6.39, -7.05], b: [9.84, -7.05], t: '3.45' },
    { a: [-0.60, -4.60], b: [-0.60, 0.00], t: '4.60', v: 1 },
    { a: [2.70, -5.50], b: [2.70, -1.80], t: '3.70', v: 1 },
    { a: [5.90, -6.52], b: [5.90, -3.72], t: '2.80', v: 1 },
    { a: [3.17, 0.55], b: [4.73, 0.55], t: '1.56' },
    { a: [4.91, 0.55], b: [6.92, 0.55], t: '2.01 pasillo' },
    { a: [7.10, 0.55], b: [9.84, 0.55], t: '2.74 zotehuela' },
    { a: [10.55, -1.80], b: [10.55, 0.00], t: '1.68', v: 1 },
    { a: [7.84, -4.05], b: [9.84, -4.05], t: '2.00 bano' },
    { a: [11.25, -3.60], b: [11.25, -1.80], t: '1.80', v: 1 },
  ],
};

function dimLine(d, X, Y) {
  const [ax, ay] = d.a, [bx, by] = d.b;
  const x1 = X(ax), y1 = Y(ay), x2 = X(bx), y2 = Y(by);
  const tx = (x1 + x2) / 2, ty = (y1 + y2) / 2;
  const tick = (x, y) => `<path d="M${x - 4} ${y - 4} L${x + 4} ${y + 4}" stroke="#b0453a" stroke-width="1"/>`;
  const label = d.v
    ? `<text x="${tx - 5}" y="${ty}" transform="rotate(-90 ${tx - 5} ${ty})" text-anchor="middle" class="dim">${esc(d.t)}</text>`
    : `<text x="${tx}" y="${ty - 5}" text-anchor="middle" class="dim">${esc(d.t)}</text>`;
  return `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b0453a" stroke-width="1"/>${tick(x1, y1)}${tick(x2, y2)}${label}</g>`;
}

/* ------------------------------------------------------------------ */
export function renderLevel(level, STAIRS) {
  const bb = levelBBox(level);
  const Wpx = (bb.x1 - bb.x0) * PPM;
  const Hpx = (bb.y1 - bb.y0) * PPM;
  const X = (x) => (x - bb.x0) * PPM;
  const Y = (y) => (bb.y1 - y) * PPM;              // eje Y invertido

  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(Wpx)} ${f(Hpx)}" width="${f(Wpx)}" height="${f(Hpx)}" preserveAspectRatio="xMidYMid meet" class="plan">`);
  out.push(`<style>
    .plan { background:#fbfaf7; }
    text { font-family: ui-sans-serif, system-ui, sans-serif; fill:#2b2b2b; }
    .rname { font-size:12.5px; font-weight:600; }
    .rdim  { font-size:10.5px; fill:#6b6b6b; }
    .dim   { font-size:10px; fill:#b0453a; font-weight:600; }
    .title { font-size:17px; font-weight:700; }
    .sub   { font-size:11px; fill:#6b6b6b; }
  </style>`);

  // losa / contorno
  const polyPts = (p) => p.map(([x, y]) => `${f(X(x))},${f(Y(y))}`).join(' ');
  out.push(`<polygon points="${polyPts(level.slab.outline)}" fill="#f2efe9" stroke="#cfc9bd" stroke-width="1"/>`);
  if (level.roofSlab) {
    out.push(`<polygon points="${polyPts(level.roofSlab.outline)}" fill="none" stroke="#cfc9bd" stroke-width="1" stroke-dasharray="4 4"/>`);
  }

  // cuartos
  for (const r of level.rooms) {
    const bbx = polyBBox(r.poly);
    out.push(`<polygon points="${polyPts(r.poly)}" fill="${FILL[r.kind] || '#eee'}" stroke="#d6d1c7" stroke-width="0.8"/>`);
    const cx = X((bbx.x0 + bbx.x1) / 2);
    const cy = Y((bbx.y0 + bbx.y1) / 2);
    const w = bbx.x1 - bbx.x0, h = bbx.y1 - bbx.y0;
    if (w * PPM > 48 && h * PPM > 30) {
      out.push(`<text x="${f(cx)}" y="${f(cy - 2)}" text-anchor="middle" class="rname">${esc(r.name)}</text>`);
      const med = r.dim || `${w.toFixed(2)} x ${h.toFixed(2)} m`;
      out.push(`<text x="${f(cx)}" y="${f(cy + 12)}" text-anchor="middle" class="rdim">${esc(med)} &#183; ${polyArea(r.poly).toFixed(1)} m&#178;</text>`);
    }
  }

  // escaleras
  for (const s of stairsForLevel(level.id, STAIRS)) {
    if (s.landing) {
      out.push(`<polygon points="${polyPts(s.landing)}" fill="#f6f1e3" stroke="#b9ae92" stroke-width="0.8"/>`);
      continue;
    }
    const g = stairSteps(s);
    const nx = -g.uy, ny = g.ux;     // normal
    const hw = s.width / 2;
    for (const st of g.steps) {
      const p = [
        [st.x0 + nx * hw, st.y0 + ny * hw], [st.x1 + nx * hw, st.y1 + ny * hw],
        [st.x1 - nx * hw, st.y1 - ny * hw], [st.x0 - nx * hw, st.y0 - ny * hw],
      ];
      out.push(`<polygon points="${polyPts(p)}" fill="#f6f1e3" stroke="#b9ae92" stroke-width="0.7"/>`);
    }
    // flecha de bajada
    const mx = (s.from[0] + s.to[0]) / 2, my = (s.from[1] + s.to[1]) / 2;
    out.push(`<line x1="${f(X(s.from[0]))}" y1="${f(Y(s.from[1]))}" x2="${f(X(s.to[0]))}" y2="${f(Y(s.to[1]))}" stroke="#8a7f63" stroke-width="1.2" stroke-dasharray="3 3"/>`);
    out.push(`<circle cx="${f(X(s.to[0]))}" cy="${f(Y(s.to[1]))}" r="4" fill="#8a7f63"/>`);
    out.push(`<text x="${f(X(mx) + 8)}" y="${f(Y(my))}" class="rdim">BAJA</text>`);
  }

  // muros
  const allWalls = [...level.walls, ...(level.parapets || [])];
  for (const w of allWalls) {
    const color = w.kind === 'glass' ? '#4a8fb5'
      : w.kind === 'parapet' || w.kind === 'rail' ? '#a9a295' : '#3a3a3a';
    for (const pc of wallPieces(w)) {
      if (pc.zBase > 0.05) continue;         // dinteles no se dibujan macizos
      const r = pieceRect(pc, w.t);
      if (r.w < 0.001 || r.h < 0.001) continue;
      out.push(`<rect x="${f(X(r.x))}" y="${f(Y(r.y + r.h))}" width="${f(r.w * PPM)}" height="${f(r.h * PPM)}" fill="${color}"/>`);
    }
    // vanos: linea fina para ventanas, umbral para puertas
    for (const o of (w.openings || [])) {
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      const ux = (w.b[0] - w.a[0]) / L, uy = (w.b[1] - w.a[1]) / L;
      const p0 = [w.a[0] + ux * o.s, w.a[1] + uy * o.s];
      const p1 = [w.a[0] + ux * o.e, w.a[1] + uy * o.e];
      const stroke = o.type === 'win' ? '#4a8fb5' : '#9a9a9a';
      const dash = o.type === 'door' ? '' : ' stroke-dasharray="5 3"';
      out.push(`<line x1="${f(X(p0[0]))}" y1="${f(Y(p0[1]))}" x2="${f(X(p1[0]))}" y2="${f(Y(p1[1]))}" stroke="${stroke}" stroke-width="2"${dash}/>`);
    }
  }

  // cotas
  for (const d of (DIMS[level.id] || [])) out.push(dimLine(d, X, Y));

  // norte + escala
  const nx = Wpx - 46, ny = 46;
  out.push(`<g><line x1="${nx}" y1="${ny + 22}" x2="${nx}" y2="${ny - 18}" stroke="#2b2b2b" stroke-width="1.5"/><path d="M${nx} ${ny - 24} l5 10 l-5 -3 l-5 3 z" fill="#2b2b2b"/><text x="${nx}" y="${ny + 36}" text-anchor="middle" class="rdim">CALLE</text></g>`);
  const sb = 5 * PPM;
  out.push(`<g transform="translate(20,${f(Hpx - 26)})"><rect x="0" y="0" width="${f(sb)}" height="5" fill="#2b2b2b"/><rect x="0" y="0" width="${f(sb / 5)}" height="5" fill="#fbfaf7" stroke="#2b2b2b" stroke-width="0.8"/><text x="0" y="18" class="rdim">0</text><text x="${f(sb)}" y="18" text-anchor="middle" class="rdim">5 m</text></g>`);

  out.push(`</svg>`);
  return out.join('\n');
}

export function renderAll(parche = {}) {
  const casa = buildHouse(parche);
  return casa.LEVELS.map((l) => ({
    id: l.id, name: l.name, z: l.z, svg: renderLevel(l, casa.STAIRS),
  }));
}
