/* Huella de la geometria: sirve para comprobar que un refactor no movio nada. */
import * as m from '../src/model.js';

const r3 = (n) => Math.round(n * 1000) / 1000;
const lines = [];

for (const lv of m.LEVELS) {
  lines.push(`== ${lv.id} z=${r3(lv.z)}`);
  for (const r of [...lv.rooms].sort((a, b) => a.name.localeCompare(b.name))) {
    const b = m.polyBBox(r.poly);
    lines.push(`  cuarto ${r.name} [${r3(b.x0)},${r3(b.y0)} -> ${r3(b.x1)},${r3(b.y1)}] a=${r3(m.polyArea(r.poly))} k=${r.kind}`);
  }
  const walls = [...(lv.walls || []), ...(lv.parapets || [])];
  const sig = walls.map((w) => {
    const ops = (w.openings || []).map((o) => `${r3(o.s)}-${r3(o.e)}/${o.type}`).join(',');
    return `  muro ${r3(w.a[0])},${r3(w.a[1])} -> ${r3(w.b[0])},${r3(w.b[1])} t=${w.t} h=${w.h} ${w.kind} [${ops}]`;
  }).sort();
  lines.push(...sig);
  for (const s of [lv.slab, lv.roofSlab, ...(lv.extraSlabs || [])]) {
    if (!s) continue;
    const b = m.polyBBox(s.outline);
    lines.push(`  losa z=${r3(s.z)} [${r3(b.x0)},${r3(b.y0)} -> ${r3(b.x1)},${r3(b.y1)}] huecos=${(s.holes || []).length} a=${r3(m.polyArea(s.outline))}`);
  }
}
for (const s of m.STAIRS) {
  lines.push(s.landing
    ? `== esc ${s.id} descanso z=${r3(s.z)} a=${r3(m.polyArea(s.landing))}`
    : `== esc ${s.id} ${r3(s.from[0])},${r3(s.from[1])} -> ${r3(s.to[0])},${r3(s.to[1])} z ${r3(s.z0)}->${r3(s.z1)} w=${s.width}`);
}
console.log(lines.join('\n'));
