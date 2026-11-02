/* Copia de node_modules a vendor/ lo que el navegador necesita, para que el
   proyecto se pueda servir como sitio estatico sin instalar nada. */
import fs from 'node:fs';
import path from 'node:path';

const copias = [
  ['node_modules/three/build/three.module.js', 'vendor/three.module.js'],
  ['node_modules/three/examples/jsm/controls/OrbitControls.js',
   'vendor/addons/controls/OrbitControls.js'],
];
for (const [de, a] of copias) {
  fs.mkdirSync(path.dirname(a), { recursive: true });
  fs.copyFileSync(de, a);
  console.log(a, (fs.statSync(a).size / 1024).toFixed(0) + ' KB');
}
