import { buildHouse, polyBBox } from '../src/model.js';

// Mover UN eje debe recalcular solo lo que depende de el.
const base = buildHouse();
const v = buildHouse({ nombre: 'Prueba', ejes: { Y_BAND_S: 4.26 } });

const bb = (casa, id) => {
  for (const lv of casa.LEVELS) {
    const r = lv.rooms.find((x) => x.id === id);
    if (r) return polyBBox(r.poly);
  }
};
const r3 = (n) => Math.round(n * 1000) / 1000;
for (const id of ['n1.vestibulo', 'n1.mediobano', 'n1.zotehuela', 'n1.cocina', 'n1.sala', 'n2.rec1']) {
  const a = bb(base, id), b = bb(v, id);
  const cambio = JSON.stringify(a) === JSON.stringify(b) ? 'igual' : `${r3(a.y0)} -> ${r3(b.y0)}`;
  console.log(`  ${id.padEnd(16)} ${cambio}`);
}
const m = (casa, id) => {
  for (const lv of casa.LEVELS) {
    const w = (lv.walls || []).find((x) => x.id === id);
    if (w) return w;
  }
};
const w0 = m(base, 'n1.vest-mediobano'), w1 = m(v, 'n1.vest-mediobano');
console.log(`  muro vest-mediobano  largo ${r3(Math.abs(w0.b[1] - w0.a[1]))} -> ${r3(Math.abs(w1.b[1] - w1.a[1]))}`);
const d0 = m(base, 'n1.sala-banda').openings, d1 = m(v, 'n1.sala-banda').openings;
console.log(`  puerta medio bano    s=${r3(d0[1].s)} -> s=${r3(d1[1].s)} (debe quedar igual: la puerta no se movio)`);
