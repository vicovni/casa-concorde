/* ============================================================================
   VISOR 3D — construye la casa y permite recorrerla en primera persona.
   X = x(planta) ,  Y = cota ,  Z = -y(planta)
   ========================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  buildHouse, Z, H, T,
  wallPieces, pieceRect, pointInPoly, stairSteps, polyBBox,
} from './model.js';
import { buildMaterials } from './materials.js';
import { buildFurniture } from './furniture.js';

/* ------------------------------------------------------------------ */
const EYE = 1.62;
const RADIUS = 0.22;
const STEP_UP = 0.55;
const GRAVITY = 18;
// Altura de cada escalon cuando la escalera va sin relleno: alcanza para que
// un escalon se encime con el siguiente y el conjunto se lea como una
// escalera maciza por debajo, no como tablas flotando.
const ESCALON = 0.30;

export class Viewer {
  constructor(canvas, ui, variantes = [{ id: 'actual', nombre: 'Actual', parche: {} }]) {
    this.canvas = canvas;
    this.ui = ui;
    this.variantes = variantes;
    this.iVariante = 0;
    this.D = buildHouse(variantes[0].parche);   // datos de la casa en turno
    this.colliders = [];     // {x0,x1,z0,z1,y0,y1} en mundo
    this.surfaces = [];      // superficies caminables
    this.ramps = [];

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9fc2dd);
    this.scene.fog = new THREE.Fog(0x9fc2dd, 45, 130);

    // 60 grados se lee mas cerca del ojo. Con 72 la casa se sentia mas
    // chica de lo que es, porque un lente angular aleja todo.
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.05, 400);
    this.M = buildMaterials();

    // Todo lo que arma la casa cuelga de este grupo, para poder tirarlo y
    // volverlo a construir al cambiar de variante. Las luces no van aqui.
    this.casa = new THREE.Group();
    this.scene.add(this.casa);

    this._lights();
    this._build();

    this.yaw = 0;            // giro propio de la camara (sin PointerLockControls,
    this.pitch = 0;          // que exige captura del mouse para funcionar)
    this.active = false;
    this.dragging = false;

    this.orbit = new OrbitControls(this.camera, canvas);
    this.orbit.enabled = false;
    this.orbitMode = false;

    this.keys = Object.create(null);
    this.vel = new THREE.Vector3();
    this.vy = 0;
    this.pos = new THREE.Vector3();
    this.collide = true;

    this._events();
    this.teleport('N1');
    this.clock = new THREE.Clock();
    this.resize();
    this.renderer.setAnimationLoop(() => this._tick());
  }

  /* ---------------------------- luces ---------------------------- */
  _lights() {
    this.scene.add(new THREE.HemisphereLight(0xcfe3f2, 0x6a6354, 1.15));
    const sun = new THREE.DirectionalLight(0xfff2dc, 2.1);
    sun.position.set(14, 22, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -24; c.right = 24; c.top = 24; c.bottom = -24; c.near = 1; c.far = 80;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // luces interiores para que los niveles bajos sean legibles
    const pts = [
      [5.0, Z.N1 + 2.3, -2.2], [8.0, Z.N1 + 2.3, -7.0], [1.9, Z.N1 + 2.3, -6.8],
      [4.4, Z.N1 + 2.3, -8.1], [1.6, Z.N2 + 2.3, 6.3], [4.6, Z.N2 + 2.3, 6.3],
      [7.9, Z.N2 + 2.3, 6.3], [4.0, Z.N2 + 2.3, 3.8], [8.9, Z.N2 + 2.3, 3.8],
      [2.0, -1.45 + 2.1, -8.0],
    ];
    for (const [x, y, z] of pts) {
      const l = new THREE.PointLight(0xffe9c9, 11, 9, 2);
      l.position.set(x, y, z);
      this.scene.add(l);
    }
  }

  /* --------------------------- geometria -------------------------- */
  _addCollider(x0, x1, y0, y1, zb, zt) {        // en coords de PLANTA + cota
    this.colliders.push({ x0, x1, z0: -y1, z1: -y0, y0: zb, y1: zt });
  }

  _addSurface(outline, holes, z) {
    this.surfaces.push({ outline, holes: holes || [], z, bb: polyBBox(outline) });
  }

  _slabMesh(def, mat) {
    const shape = new THREE.Shape(def.outline.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const h of (def.holes || [])) {
      shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: def.t, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.y = def.z - def.t;
    m.receiveShadow = true; m.castShadow = true;
    this.casa.add(m);
    return m;
  }

  /** Cara plana (piso o plafon) de un cuarto, restando los huecos de losa.
   *  Sigue el poligono real: un cuarto en L no pinta piso fuera de el. */
  _slabFace(poly, holes) {
    const bb = polyBBox(poly);
    const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const h of (holes || [])) {
      const hb = polyBBox(h);
      const x0 = Math.max(bb.x0, hb.x0), x1 = Math.min(bb.x1, hb.x1);
      const y0 = Math.max(bb.y0, hb.y0), y1 = Math.min(bb.y1, hb.y1);
      if (x1 - x0 < 0.02 || y1 - y0 < 0.02) continue;
      shape.holes.push(new THREE.Path([
        new THREE.Vector2(x0, y0), new THREE.Vector2(x0, y1),
        new THREE.Vector2(x1, y1), new THREE.Vector2(x1, y0),
      ]));
    }
    return new THREE.ShapeGeometry(shape);
  }

  _wall(w, levelZ, levelId) {
    const mat = w.kind === 'glass' ? this.M.glass
      : w.kind === 'ext' || w.kind === 'parapet' ? this.M.wallExt
      : w.kind === 'rail' ? this.M.frame : this.M.wallInt;

    for (const pc of wallPieces(w)) {
      const r = pieceRect(pc, w.t);
      const h = pc.zTop - pc.zBase;
      if (h <= 0.001 || r.w <= 0.001 || r.h <= 0.001) continue;
      const base = levelZ + (w.base || 0) + pc.zBase;
      const geo = new THREE.BoxGeometry(r.w, h, r.h);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(r.x + r.w / 2, base + h / 2, -(r.y + r.h / 2));
      m.castShadow = true; m.receiveShadow = true;
      this.casa.add(m);
      // colision solo donde estorba al cuerpo
      this._addCollider(r.x, r.x + r.w, r.y, r.y + r.h, base, base + h);
    }

    // marcos de ventanas / puertas
    for (const o of (w.openings || [])) {
      if (o.type === 'pass') continue;
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      const ux = (w.b[0] - w.a[0]) / L, uy = (w.b[1] - w.a[1]) / L;
      const cx = w.a[0] + ux * (o.s + o.e) / 2, cy = w.a[1] + uy * (o.s + o.e) / 2;
      const len = o.e - o.s;
      const sx = Math.abs(ux) > 0.5 ? len : w.t + 0.01;
      const sy = Math.abs(ux) > 0.5 ? w.t + 0.01 : len;
      if (o.type === 'win') {
        const g = new THREE.BoxGeometry(sx, o.y1 - o.y0, sy);
        const m = new THREE.Mesh(g, this.M.glass);
        m.position.set(cx, levelZ + (o.y0 + o.y1) / 2, -cy);
        this.casa.add(m);
      }
    }
  }

  _stairs() {
    for (const s of this.D.STAIRS) {
      if (s.landing) {
        const bb = polyBBox(s.landing);
        const geo = new THREE.BoxGeometry(bb.x1 - bb.x0, 0.25, bb.y1 - bb.y0);
        const m = new THREE.Mesh(geo, this.M.stepTread);
        m.position.set((bb.x0 + bb.x1) / 2, s.z - 0.125, -(bb.y0 + bb.y1) / 2);
        m.castShadow = true; m.receiveShadow = true;
        this.casa.add(m);
        this._addSurface(s.landing, [], s.z);
        continue;
      }
      const g = stairSteps(s);
      const nx = -g.uy, ny = g.ux, hw = s.width / 2;
      const zMin = Math.min(s.z0, s.z1) - 0.25;
      for (const st of g.steps) {
        const cx = (st.x0 + st.x1) / 2, cy = (st.y0 + st.y1) / 2;
        const sx = Math.abs(g.ux) > 0.5 ? g.tread : s.width;
        const sy = Math.abs(g.ux) > 0.5 ? s.width : g.tread;
        // El escalon no baja macizo hasta el piso: lleva el espesor de la losa
        // inclinada, para que debajo de la escalera quede el paso que existe en
        // la casa real.
        // Con relleno el escalon baja macizo hasta el piso; sin relleno es un
        // prisma de altura fija y debajo queda el paso libre.
        const h = s.sinRelleno ? Math.min(ESCALON, st.zTop - zMin) : st.zTop - zMin;
        const stepMats = [
          this.M.stepRiser, this.M.stepRiser, this.M.stepTread,
          this.M.stepRiser, this.M.stepRiser, this.M.stepRiser,
        ];
        const m = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sy), stepMats);
        // El escalon cuelga de SU huella. Antes se apoyaba en el fondo del
        // tramo, asi que sin relleno todos quedaban amontonados abajo y solo
        // se veian las narices flotando.
        m.position.set(cx, st.zTop - h / 2, -cy);
        m.castShadow = true; m.receiveShadow = true;
        this.casa.add(m);

        // narices: bajando, la escalera solo ensena huellas y sin una linea en
        // el filo se lee como rampa lisa
        const nx2 = Math.abs(g.ux) > 0.5 ? 0.05 : s.width;
        const ny2 = Math.abs(g.ux) > 0.5 ? s.width : 0.05;
        const nose = new THREE.Mesh(
          new THREE.BoxGeometry(nx2, 0.02, ny2), this.M.stepNose);
        nose.position.set(st.x1 - g.ux * 0.025, st.zTop + 0.011, -(st.y1 - g.uy * 0.025));
        this.casa.add(nose);
      }
      // rampa invisible para caminar
      const bbx = {
        x0: Math.min(s.from[0], s.to[0]) - (Math.abs(g.ux) > 0.5 ? 0 : hw),
        x1: Math.max(s.from[0], s.to[0]) + (Math.abs(g.ux) > 0.5 ? 0 : hw),
        y0: Math.min(s.from[1], s.to[1]) - (Math.abs(g.uy) > 0.5 ? 0 : hw),
        y1: Math.max(s.from[1], s.to[1]) + (Math.abs(g.uy) > 0.5 ? 0 : hw),
      };
      this.ramps.push({ s, bbx, g });
      // barandal lateral (pasamanos + postes); las escaleras entre muros no llevan
      for (const side of (s.rail === false ? [] : [1, -1])) {
        const p0 = new THREE.Vector3(
          s.from[0] + nx * hw * side, s.z0 + 0.95, -(s.from[1] + ny * hw * side));
        const p1 = new THREE.Vector3(
          s.to[0] + nx * hw * side, s.z1 + 0.95, -(s.to[1] + ny * hw * side));
        const dir = new THREE.Vector3().subVectors(p1, p0);
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(dir.length(), 0.05, 0.05), this.M.frame);
        rail.position.copy(p0).addScaledVector(dir, 0.5);
        rail.quaternion.setFromUnitVectors(
          new THREE.Vector3(1, 0, 0), dir.clone().normalize());
        rail.castShadow = true;
        this.casa.add(rail);
        for (let i = 0; i <= 4; i++) {
          const t = i / 4;
          const p = new THREE.Vector3().lerpVectors(p0, p1, t);
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.95, 0.04), this.M.frame);
          post.position.set(p.x, p.y - 0.475, p.z);
          this.casa.add(post);
        }
      }
    }
  }

  _terrain() {
    const add = (poly, z, mat) => {
      const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, mat);
      m.position.y = z - 0.4;
      m.receiveShadow = true;
      this.casa.add(m);
      this._addSurface(poly, [], z);
    };
    add(this.D.SITE.street.poly, this.D.SITE.street.z, this.M.asphalt);
    add(this.D.SITE.groundLow.poly, this.D.SITE.groundLow.z, this.M.grass);
    add(this.D.SITE.groundSideW.poly, this.D.SITE.groundSideW.z, this.M.grass);
    add(this.D.SITE.groundSideE.poly, this.D.SITE.groundSideE.z, this.M.grass);

    // masa del cerro a los lados y atras, hasta el nivel de calle
    const hill = (x0, y0, x1, y1) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(x1 - x0, Math.abs(Z.N2) + 0.4, y1 - y0), this.M.grass);
      m.position.set((x0 + x1) / 2, (Z.N0 - (Z.N2 - 0.4)) / 2 + Z.N2 - 0.4, -(y0 + y1) / 2);
      m.receiveShadow = true;
      this.casa.add(m);
      this._addSurface([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], [], Z.N0);
    };
    hill(-14, 0, 0, 15);
    hill(10.04, 0, 24, 15);
    hill(0, 7.06, 10.04, 15);
  }

  _build() {
    for (const lv of this.D.LEVELS) {
      const mat = lv.id === 'N0' ? this.M.concrete : this.M.concrete;
      this._slabMesh(lv.slab, mat);
      this._addSurface(lv.slab.outline, lv.slab.holes, lv.slab.z);
      if (lv.roofSlab) {
        this._slabMesh({ ...lv.roofSlab, z: lv.roofSlab.z - 0.005 }, this.M.concrete);
        this._addSurface(lv.roofSlab.outline, lv.roofSlab.holes, lv.roofSlab.z - 0.005);
      }
      for (const sl of (lv.extraSlabs || [])) {
        this._slabMesh(sl, sl.mat === 'lawn' ? this.M.lawn : this.M.concrete);
        if (sl.walkable) this._addSurface(sl.outline, sl.holes, sl.z);
      }
      for (const w of lv.walls) this._wall(w, lv.z, lv.id);
      for (const w of (lv.parapets || [])) this._wall(w, lv.z, lv.id);

      // pisos de acabado por cuarto
      for (const r of lv.rooms) {
        if (r.kind === 'void') continue;
        const mat = ({
          living: this.M.floorWood, bed: this.M.floorWood, hall: this.M.floorTile,
          kitchen: this.M.floorTile, bath: this.M.floorBath, closet: this.M.floorWood,
          patio: this.M.floorOut, exterior: this.M.floorOut, service: this.M.floorTile,
          stairs: this.M.floorTile, lawn: this.M.lawn,
        })[r.kind] || this.M.floorTile;
        const bb = polyBBox(r.poly);
        const g = this._slabFace(r.poly, lv.slab.holes);
        g.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(g, mat);
        m.position.y = lv.z + 0.012;
        m.receiveShadow = true;
        this.casa.add(m);

        // plafon (cara inferior de la losa superior) en espacios techados
        if (lv.id !== 'N0' && r.kind !== 'patio' && r.kind !== 'exterior'
            && r.kind !== 'stairs' && r.kind !== 'lawn') {
          const holes = lv.id === 'N1' ? this.D.LEVEL_BY_ID.N0.slab.holes
            : [...(lv.roofSlab ? lv.roofSlab.holes : []), ...this.D.LEVEL_BY_ID.N1.slab.holes];
          const cg = this._slabFace(r.poly, holes);
          cg.rotateX(-Math.PI / 2);
          const cm = new THREE.Mesh(cg, this.M.ceiling);
          cm.position.y = lv.z + H.FLOOR - 0.012;
          cm.receiveShadow = true;
          this.casa.add(cm);
        }
      }
    }
    this._stairs();
    this._terrain();
    // todo lo que no es construccion va en un solo grupo, para poder apagarlo
    this.furniture = buildFurniture(this.M);
    this.furniture.visible = false;     // arranca en obra gris; la tecla M lo enciende
    this.casa.add(this.furniture);
  }

  /* --------------------------- variantes -------------------------- */
  /** Tira la casa en turno y arma otra. Los muebles se rehacen tambien. */
  setVariante(i) {
    const n = ((i % this.variantes.length) + this.variantes.length) % this.variantes.length;
    this.iVariante = n;
    const vari = this.variantes[n];

    this.casa.traverse((o) => {
      if (o.isMesh || o.isLine) {
        o.geometry?.dispose();
        // los materiales se comparten entre variantes, no se tiran
      }
    });
    this.casa.clear();
    this.colliders.length = 0;
    this.surfaces.length = 0;
    this.ramps.length = 0;

    this.D = buildHouse(vari.parche);
    this._build();
    this.toggleFurniture(this.furniture.visible);
    this.teleport('N1');
    if (this.ui.variantes) this.ui.variantes.value = String(n);
    if (this.ui.nota) this.ui.nota.textContent = vari.nota || '';
    return vari;
  }

  /* --------------------------- navegacion ------------------------- */
  _events() {
    addEventListener('resize', () => this.resize());
    addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Digit1') this.teleport('N0');
      if (e.code === 'Digit2') this.teleport('N1');
      if (e.code === 'Digit3') this.teleport('N2');
      if (e.code === 'KeyO') this.toggleOrbit();
      if (e.code === 'KeyC') this.collide = !this.collide;
      if (e.code === 'KeyM') this.toggleFurniture();
      if (e.code === 'KeyV') this.setVariante(this.iVariante + (e.shiftKey ? -1 : 1));
      if (e.code === 'KeyH') this.ui.help.classList.toggle('hidden');
      if (e.code === 'Escape' && this.active && !this.locked()) this.exit();
    });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    // Entrar: el overlay tapa el canvas, asi que el clic lo escuchan los dos.
    // El pointer lock puede ser rechazado por el navegador, asi que el recorrido
    // arranca igual y, si no hay lock, se mira arrastrando con el mouse.
    const enter = (e) => {
      if (e) e.stopPropagation();
      if (this.orbitMode) return;
      this.active = true;
      this.ui.overlay.classList.add('hidden');
      this.ui.mode.textContent = 'Primera persona';
      if (this.canvas.requestPointerLock) {
        try {
          const p = this.canvas.requestPointerLock();
          if (p && p.catch) p.catch(() => {});   // si lo rechaza, se mira arrastrando
        } catch { /* idem */ }
      }
    };
    this.canvas.addEventListener('click', enter);
    this.ui.overlay.addEventListener('click', enter);
    this.ui.start.addEventListener('click', enter);
    if (this.ui.variantes) {
      this.ui.variantes.addEventListener('change', (e) => {
        e.stopPropagation();
        this.setVariante(Number(this.ui.variantes.value));
        this.ui.variantes.blur();
      });
      this.ui.variantes.addEventListener('click', (e) => e.stopPropagation());
    }
    if (this.ui.muebles) {
      this.ui.muebles.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFurniture();
        this.ui.muebles.blur();      // que la barra no se quede con el foco
      });
    }

    document.addEventListener('pointerlockchange', () => {
      this.ui.mode.textContent = this.locked()
        ? 'Primera persona (mouse capturado · Esc para salir)'
        : 'Primera persona (arrastra para mirar)';
    });

    // mirar: con el mouse capturado, o arrastrando si no hubo captura
    this.canvas.addEventListener('pointerdown', () => { this.dragging = this.active; });
    addEventListener('pointerup', () => { this.dragging = false; });
    addEventListener('mousemove', (e) => {
      if (this.orbitMode || !this.active) return;
      if (!this.locked() && !this.dragging) return;
      this.yaw -= (e.movementX || 0) * 0.0022;
      this.pitch -= (e.movementY || 0) * 0.0022;
      const lim = Math.PI / 2 - 0.02;
      this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
    });
  }

  /** Enciende o apaga todo lo que no es construccion (muebles, coches, macetas). */
  toggleFurniture(on = !this.furniture.visible) {
    this.furniture.visible = on;
    if (this.ui.variantes) {
      this.ui.variantes.addEventListener('change', (e) => {
        e.stopPropagation();
        this.setVariante(Number(this.ui.variantes.value));
        this.ui.variantes.blur();
      });
      this.ui.variantes.addEventListener('click', (e) => e.stopPropagation());
    }
    if (this.ui.muebles) {
      this.ui.muebles.textContent = on ? 'Ocultar muebles (M)' : 'Mostrar muebles (M)';
      this.ui.muebles.classList.toggle('on', on);
    }
  }

  locked() { return document.pointerLockElement === this.canvas; }

  exit() {
    this.active = false;
    this.dragging = false;
    if (document.exitPointerLock) document.exitPointerLock();
    this.ui.overlay.classList.remove('hidden');
  }

  toggleOrbit() {
    this.orbitMode = !this.orbitMode;
    if (this.orbitMode) {
      this.active = false;
      if (document.exitPointerLock) document.exitPointerLock();
      this.camera.position.set(22, 16, 22);
      this.orbit.target.set(5, -3, 3);
      this.orbit.enabled = true;
      this.ui.overlay.classList.add('hidden');
      this.ui.mode.textContent = 'Vista orbital (O para volver a caminar)';
    } else {
      this.orbit.enabled = false;
      this.teleport('N1');
      this.ui.overlay.classList.remove('hidden');
      this.ui.mode.textContent = 'Primera persona';
    }
  }

  teleport(levelId) {
    const spots = {                     // x, y, cota, giro inicial
      N0: [5.0, 3.0, Z.N0, Math.PI],
      N1: [2.40, 2.00, Z.N1, 0],
      N2: [6.00, -0.85, Z.N2, Math.PI],
    };
    const [x, y, z, yaw] = spots[levelId];
    this.yaw = yaw; this.pitch = 0;
    this.camera.rotation.set(0, yaw, 0, 'YXZ');
    this.pos.set(x, z + EYE, -y);
    this.camera.position.copy(this.pos);
    this.vy = 0;
    this.orbitMode = false;
    this.orbit.enabled = false;
  }

  floorAt(x, y, feet) {
    let best = null;
    for (const r of this.ramps) {
      const { s, bbx, g } = r;
      if (x < bbx.x0 - 0.3 || x > bbx.x1 + 0.3 || y < bbx.y0 - 0.3 || y > bbx.y1 + 0.3) continue;
      const t = ((x - s.from[0]) * g.ux + (y - s.from[1]) * g.uy) / g.len;
      const tc = Math.max(0, Math.min(1, t));
      const z = s.z0 + (s.z1 - s.z0) * tc;
      if (z <= feet + STEP_UP && (best === null || z > best)) best = z;
    }
    for (const s of this.surfaces) {
      if (x < s.bb.x0 || x > s.bb.x1 || y < s.bb.y0 || y > s.bb.y1) continue;
      if (!pointInPoly(x, y, s.outline)) continue;
      let inHole = false;
      for (const h of s.holes) if (pointInPoly(x, y, h)) { inHole = true; break; }
      if (inHole) continue;
      if (s.z <= feet + STEP_UP && (best === null || s.z > best)) best = s.z;
    }
    return best;
  }

  blocked(x, y, feet) {
    const lo = feet + 0.25, hi = feet + 1.70;
    const wx = x, wz = -y;
    for (const c of this.colliders) {
      if (c.y1 <= lo || c.y0 >= hi) continue;
      if (wx > c.x0 - RADIUS && wx < c.x1 + RADIUS &&
          wz > c.z0 - RADIUS && wz < c.z1 + RADIUS) return true;
    }
    return false;
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.orbitMode) {
      this.orbit.update();
    } else if (this.active) {
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      const run = this.keys.ShiftLeft || this.keys.ShiftRight ? 2.1 : 1;
      const speed = 3.1 * run;
      let fwd = 0, side = 0;
      if (this.keys.KeyW || this.keys.ArrowUp) fwd += 1;
      if (this.keys.KeyS || this.keys.ArrowDown) fwd -= 1;
      if (this.keys.KeyD || this.keys.ArrowRight) side += 1;
      if (this.keys.KeyA || this.keys.ArrowLeft) side -= 1;

      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      dir.y = 0; dir.normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      const move = new THREE.Vector3()
        .addScaledVector(dir, fwd).addScaledVector(right, side);
      if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * dt);

      const feet = this.pos.y - EYE;
      // ejes separados para deslizar sobre los muros
      let nx = this.pos.x + move.x;
      let ny = -(this.pos.z);
      if (!this.collide || !this.blocked(nx, ny, feet)) this.pos.x = nx;
      let nz = this.pos.z + move.z;
      if (!this.collide || !this.blocked(this.pos.x, -nz, feet)) this.pos.z = nz;

      // piso y gravedad
      const px = this.pos.x, py = -this.pos.z;
      const target = this.floorAt(px, py, feet);
      if (target !== null) {
        const want = target + EYE;
        if (this.pos.y <= want + 0.02) {
          this.pos.y = want; this.vy = 0;
        } else {
          this.vy -= GRAVITY * dt;
          this.pos.y = Math.max(want, this.pos.y + this.vy * dt);
          if (this.pos.y === want) this.vy = 0;
        }
      } else {
        this.vy -= GRAVITY * dt;
        this.pos.y += this.vy * dt;
        if (this.pos.y < Z.N2 - 6) this.teleport('N1');
      }
      this.camera.position.copy(this.pos);
      this._readout(px, py);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _readout(x, y) {
    const feet = this.pos.y - EYE;
    let name = 'Exterior', lvl = '';
    let bestD = Infinity;
    for (const lv of this.D.LEVELS) {
      const d = Math.abs(lv.z - feet);
      if (d > 1.6) continue;
      for (const r of lv.rooms) {
        if (pointInPoly(x, y, r.poly) && d < bestD) { name = r.name; lvl = lv.name; bestD = d; }
      }
    }
    this.ui.where.textContent = lvl ? `${name}  ·  ${lvl}` : name;
    this.ui.coords.textContent = `x ${x.toFixed(2)}  y ${y.toFixed(2)}  z ${feet.toFixed(2)}`;
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
