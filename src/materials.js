/* ============================================================================
   MATERIALES — texturas procedurales (canvas) para no depender de archivos.
   Aqui es donde conviene ir refinando acabados en siguientes iteraciones.
   ========================================================================== */
import * as THREE from 'three';

const cache = new Map();

function makeCanvas(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return c;
}

function tex(key, size, draw, repeat = [1, 1]) {
  const k = `${key}:${repeat.join(',')}`;
  if (cache.has(k)) return cache.get(k);
  const t = new THREE.CanvasTexture(makeCanvas(size, draw));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(k, t);
  return t;
}

const noise = (ctx, size, amount, alpha) => {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
    if (alpha !== undefined) d[i + 3] = alpha;
  }
  ctx.putImageData(img, 0, 0);
};

/* ---------------------------- dibujos ----------------------------- */
const drawPlaster = (color) => (ctx, s) => {
  ctx.fillStyle = color; ctx.fillRect(0, 0, s, s);
  noise(ctx, s, 16);
};

const drawConcrete = (ctx, s) => {
  ctx.fillStyle = '#b9b6ae'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    const r = Math.random() * 26 + 6;
    ctx.beginPath(); ctx.arc(Math.random() * s, Math.random() * s, r, 0, 7); ctx.fill();
  }
  noise(ctx, s, 22);
};

const drawWood = (ctx, s) => {
  const base = '#9d7246';
  ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
  const planks = 4, ph = s / planks;
  for (let p = 0; p < planks; p++) {
    const shade = 1 + (Math.random() - 0.5) * 0.18;
    ctx.fillStyle = `rgb(${Math.min(255, 157 * shade)},${Math.min(255, 114 * shade)},${Math.min(255, 70 * shade)})`;
    ctx.fillRect(0, p * ph, s, ph - 1);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(80,52,28,${Math.random() * 0.22})`;
      ctx.lineWidth = Math.random() * 1.6;
      ctx.beginPath();
      const y = p * ph + Math.random() * ph;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s * 0.3, y + (Math.random() - 0.5) * 7, s * 0.7, y + (Math.random() - 0.5) * 7, s, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(50,32,16,0.45)';
    ctx.fillRect(0, (p + 1) * ph - 1.5, s, 1.5);
  }
  noise(ctx, s, 10);
};

const drawTile = (color, grout, n) => (ctx, s) => {
  ctx.fillStyle = grout; ctx.fillRect(0, 0, s, s);
  const g = 3, cs = s / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = 1 + (Math.random() - 0.5) * 0.07;
      const c = color.match(/\d+/g).map((x) => Math.min(255, Math.round(x * v)));
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fillRect(i * cs + g / 2, j * cs + g / 2, cs - g, cs - g);
    }
  }
  noise(ctx, s, 8);
};

const drawGrass = (ctx, s) => {
  ctx.fillStyle = '#6f7d55'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 2600; i++) {
    ctx.strokeStyle = `rgba(${90 + Math.random() * 50},${110 + Math.random() * 50},${60 + Math.random() * 30},0.7)`;
    ctx.lineWidth = 1;
    const x = Math.random() * s, y = Math.random() * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * 4, y - Math.random() * 5); ctx.stroke();
  }
};

const drawLawn = (ctx, s) => {
  ctx.fillStyle = '#4e7c42'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 4000; i++) {
    const r = 70 + Math.random() * 40, gg = 120 + Math.random() * 45, b = 55 + Math.random() * 25;
    ctx.strokeStyle = 'rgba(' + r + ',' + gg + ',' + b + ',0.8)';
    ctx.lineWidth = 1;
    const x = Math.random() * s, y = Math.random() * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * 2, y - Math.random() * 4); ctx.stroke();
  }
};

const drawAsphalt = (ctx, s) => {
  ctx.fillStyle = '#4a4a4c'; ctx.fillRect(0, 0, s, s);
  noise(ctx, s, 34);
};

/* ---------------------------- API --------------------------------- */
export function buildMaterials() {
  const M = {};

  M.wallInt = new THREE.MeshStandardMaterial({
    map: tex('plasterW', 256, drawPlaster('#efece6'), [2, 1]),
    roughness: 0.95, metalness: 0,
  });
  M.wallExt = new THREE.MeshStandardMaterial({
    map: tex('plasterE', 256, drawPlaster('#cdc4b6'), [2, 1]),
    roughness: 0.95,
  });
  M.concrete = new THREE.MeshStandardMaterial({
    map: tex('concrete', 256, drawConcrete, [0.4, 0.4]), roughness: 0.95,
  });
  M.ceiling = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 1, side: THREE.DoubleSide });

  // Escalones: la huella clara y el peralte mas oscuro, si no los escalones se
  // leen como una rampa lisa. Van sobre BoxGeometry, con UV 0..1 por cara.
  M.stepTread = new THREE.MeshStandardMaterial({
    map: tex('stepT', 256, drawConcrete, [1.5, 1.5]), color: 0xe4e1da, roughness: 0.85,
  });
  M.stepRiser = new THREE.MeshStandardMaterial({
    map: tex('stepR', 256, drawConcrete, [1.5, 1.5]), color: 0xa9a49a, roughness: 0.9,
  });
  M.stepNose = new THREE.MeshStandardMaterial({ color: 0x6f6a62, roughness: 0.8 });

  M.floorWood = new THREE.MeshStandardMaterial({
    map: tex('wood', 512, drawWood, [0.55, 0.55]), roughness: 0.6,
  });
  M.floorTile = new THREE.MeshStandardMaterial({
    map: tex('tileF', 512, drawTile('rgb(222,218,210)', '#b9b4aa', 4), [0.9, 0.9]),
    roughness: 0.4,
  });
  M.floorBath = new THREE.MeshStandardMaterial({
    map: tex('tileB', 512, drawTile('rgb(206,214,218)', '#9aa4a8', 6), [0.8, 0.8]),
    roughness: 0.35,
  });
  M.floorOut = new THREE.MeshStandardMaterial({
    map: tex('tileO', 512, drawTile('rgb(176,166,152)', '#8d8679', 3), [0.6, 0.6]),
    roughness: 0.9,
  });
  M.wallTile = new THREE.MeshStandardMaterial({
    map: tex('tileW', 512, drawTile('rgb(232,236,238)', '#b6bec1', 8), [2, 1]),
    roughness: 0.3,
  });

  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0xcfe2ea, transparent: true, opacity: 0.22, roughness: 0.03,
    metalness: 0, transmission: 0.0, side: THREE.DoubleSide,
  });
  M.frame = new THREE.MeshStandardMaterial({ color: 0x3a3f42, roughness: 0.5, metalness: 0.4 });

  M.lawn = new THREE.MeshStandardMaterial({
    map: tex('lawn', 512, drawLawn, [1.2, 1.2]), roughness: 0.95,
  });
  M.grass = new THREE.MeshStandardMaterial({ map: tex('grass', 512, drawGrass, [0.5, 0.5]), roughness: 1 });
  M.asphalt = new THREE.MeshStandardMaterial({ map: tex('asphalt', 256, drawAsphalt, [0.4, 0.4]), roughness: 1 });

  // mobiliario
  M.woodDark = new THREE.MeshStandardMaterial({ color: 0x6b4b32, roughness: 0.6 });
  M.woodLight = new THREE.MeshStandardMaterial({ color: 0xb08a5e, roughness: 0.65 });
  M.fabric = new THREE.MeshStandardMaterial({ color: 0x6d7a86, roughness: 1 });
  M.fabric2 = new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 1 });
  M.white = new THREE.MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.4 });
  M.steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.8 });
  M.stone = new THREE.MeshStandardMaterial({ color: 0x3f4248, roughness: 0.45 });
  M.door = new THREE.MeshStandardMaterial({ color: 0xa8846a, roughness: 0.7 });

  return M;
}
