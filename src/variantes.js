/* ============================================================================
   VARIANTES DE LA CASA
   ----------------------------------------------------------------------------
   Cada variante declara SOLO sus diferencias contra la casa actual. Todo lo
   que no toca lo hereda, asi que una correccion a la casa real aparece sola
   en todas las variantes.

   Que puede traer un parche:

     nombre   texto que se ve en el selector
     ejes     { X_VEST: 3.60 }                  mueve la linea de centro
              { X_VEST: { at: 3.60, t: 0.15 } } y tambien el espesor
     cuartos  { 'n1.mediobano': null }          lo borra
              { 'n1.cocina': { kind: 'living' } } cambia lo que le pases
     muros    { 'n1.sala-cocina': null }        igual que los cuartos
     escaleras.tramos  { e1b: { ... } }         cambia un tramo de escalera
     alturas  { FLOOR: 2.75 }
     cotas    { N1: -2.80 }
     extra    funcion, para agregar volumenes nuevos (ver la segunda variante)

   Los ids estan en src/model.js: 'n1.sala', 'n2.rec1', 'n1.sala-cocina'...
   ========================================================================== */

/* El parche de la variante 2, aparte: la 2b lo hereda tal cual y encima le
   pone el muro. Es la unica herencia entre variantes; las demas heredan de la
   casa actual. */
const AL_ORIENTE = {
  // El hueco queda pegado a la cara interior del muro oriente. Y arranca un
  // escalon mas al norte que hoy: asi, donde la escalera se mete bajo la losa
  // de la terraza, ya hay 2.20 de altura libre y no 1.98.
  escaleras: { e2: { x: 9.325, yBot: -0.25 } },
  muros: {
    // ese costado de la caja ahora es el propio muro exterior
    'n2.caja-esc-oriente': null,
  },

  extra(casa, h) {
    const n1 = casa.LEVEL_BY_ID.N1;
    const n2 = casa.LEVEL_BY_ID.N2;
    const e2 = casa.ESC.e2;
    const medio = casa.ESC.ancho / 2 + e2.holgura;
    const xW = e2.x - medio, xE = e2.x + medio;

    // La fachada pierde el paso del centro y lo gana al oriente. La puerta a
    // la terraza se muda al lugar que dejo la escalera.
    const i = n1.walls.findIndex((m) => m.id === 'n1.fachada-sur');
    n1.walls[i] = h.muroY('n1.fachada-sur', 'Y_SALA_S', h.O.w, h.O.e, {
      t: h.T.GLASS, kind: 'glass',
      vanos: [h.paso(xW, xE), h.puerta(4.40, 5.80, 2.40)],
    });

    // La zotehuela esta descubierta: se techa la franja por donde bajan los
    // ultimos escalones y el resto se queda abierto.
    n2.roofSlab.holes = [
      h.rect(h.fP('X_ZOT_W'), h.fP('Y_N2_R'), xW, h.fN('Y_N2_N')),
    ];
  },
};

export const VARIANTES = [
  {
    id: 'actual',
    nombre: 'Actual (as is)',
    nota: 'La casa como esta hoy. No tocar: es la base de la que heredan las demas.',
    parche: {},
  },

  /* ========================================================================
     1. SALA A DOBLE ALTURA SOBRE LA RECAMARA 1
     ------------------------------------------------------------------------
     La sala crece encima de la recamara 1 y se abre a la terraza con
     ventanales. Esa extension es de doble altura: sube hasta el nivel de la
     cochera, donde desaparece el prisma de las escaleras.

     Se van la zotehuela y la cocina; de la banda solo queda el medio bano.
     La pared que separaba las escaleras de la sala tambien se va, asi que el
     pie de la escalera queda dentro de la sala.

     La escalera de la cochera, en su descanso, ya no da media vuelta: gira 90
     grados a la izquierda y baja pegada al muro poniente de la sala.
     ====================================================================== */
  {
    id: 'sala-doble-altura',
    nombre: '1. Sala a doble altura',
    nota: 'La sala crece sobre la recámara 1 con ventanales a la terraza y doble '
        + 'altura hasta el nivel de la cochera. Se van el prisma, la zotehuela y '
        + 'la cocina; queda el medio baño. La escalera gira 90° a la izquierda.',
    parche: {
      cuartos: {
        // se van de la banda
        'n1.zotehuela': null,
        'n1.cocina': null,
        // la sala se queda con todo lo demas del nivel, menos el medio bano,
        // y se extiende sobre la recamara 1
        'n1.sala': {
          name: 'Sala (doble altura sobre la rec. 1)',
          dim: 'crece sobre la recamara 1',
          poly: [
            [0.20, -4.60], [2.99, -4.60], [2.99, 0.20], [9.84, 0.20],
            [9.84, 6.86], [4.56, 6.86], [4.56, 5.04], [3.48, 5.04],
            [3.48, 6.86], [0.20, 6.86],
          ],
        },
        // en la cochera, el prisma se vuelve el hueco de la doble altura
        'n0.hueco': {
          name: 'Doble altura', kind: 'void',
          poly: [[0.20, 0.20], [3.36, 0.20], [3.36, 6.86], [0.20, 6.86]],
        },
        'n0.cochera': {
          poly: [[3.48, 0.20], [9.84, 0.20], [9.84, 7.06], [3.48, 7.06]],
        },
      },

      muros: {
        // la pared de las escaleras hacia la sala desaparece; en su lugar
        // queda solo el pedazo que cierra el medio bano
        'n1.sala-banda': {
          a: [3.42, 4.98], b: [4.62, 4.98],
          openings: [{ s: 0.18, e: 1.02, y0: 0, y1: 2.10, type: 'door' }],
        },
        'n1.sala-cocina': null,
        'n1.zotehuela-cocina': null,
        // el prisma se va entero
        'n0.prisma-sur': null,
        'n0.prisma-norte': null,
        'n0.prisma-poniente': null,
        'n0.prisma-oriente': null,
        // el muro poniente sube los dos niveles y baja hasta la recamara 1
        'n1.ext-poniente': { a: [0.10, -4.70], b: [0.10, 6.96], h: 5.50 },
      },

      escaleras: {
        tramos: {
          // el descanso se achica al rincon donde gira
          e1l: { landing: [[0.20, 5.04], [1.32, 5.04], [1.32, 5.95], [0.20, 5.95]] },
          // y el segundo tramo baja hacia el sur, pegado al muro poniente
          e1b: {
            from: [0.655, 5.04], to: [0.655, 3.29],
            note: 'tramo 2, 8 peraltes (gira 90 grados a la izquierda)',
          },
        },
      },

      // Lo que no se puede declarar moviendo ejes: el hueco de la losa de la
      // cochera, los muros altos de la doble altura y su techo.
      extra(casa, h) {
        const n0 = casa.LEVEL_BY_ID.N0;
        const n1 = casa.LEVEL_BY_ID.N1;
        const zDoble = h.Z.N0 + 2.60;          // techo de la doble altura
        const altoDoble = zDoble - h.Z.N1;     // 5.50 de piso de sala a techo

        // La losa de la cochera se abre en todo el ancho de la doble altura.
        n0.slab.holes = [
          n0.rooms.find((r) => r.id === 'n0.vano').poly,
          [[0.20, 0.20], [3.36, 0.20], [3.36, 6.86], [0.20, 6.86]],
        ];
        // y su tapa del prisma ya no existe
        n0.extraSlabs = [{
          id: 'v1.techo-doble', mat: 'concrete', holes: [], t: 0.15,
          outline: [[0, -4.80], [3.52, -4.80], [3.52, 7.06], [0, 7.06]],
          z: zDoble,
        }];

        // Muros de la extension sobre la recamara 1: ventanales al sur y al
        // oriente, mirando la terraza, de piso de sala a techo.
        n1.walls.push(
          h.muroY('v1.ventanal-sur', 'Y_R1_S', h.O.w, 'X_R1R2',
            { t: h.T.GLASS, h: altoDoble, kind: 'glass' }),
          h.muroX('v1.ventanal-oriente', 'X_R1R2', 'Y_R1_S', h.fP('Y_N2_N'),
            { t: h.T.GLASS, h: altoDoble, kind: 'glass' }),
          // la doble altura se cierra arriba contra el resto de la sala:
          // ese muro arranca donde termina el plafon de la sala
          // Ese muro es tambien el que cierra el cuarto nuevo contra la
          // cochera, asi que lleva la puerta donde estaba la del prisma.
          h.muroX('v1.cierre-oriente', 3.42, 'Y_R1_S', 'Y_N1_N', {
            t: h.T.INT, h: altoDoble - h.H.FLOOR, kind: 'int', base: h.H.FLOOR,
            vanos: [h.vano('door', 5.08, 5.93, 0.30, 2.40)],
          }),
          h.muroY('v1.cierre-norte', 'Y_N1_N', h.O.w, 3.42,
            { t: h.T.EXT, h: altoDoble - h.H.FLOOR, kind: 'ext', base: h.H.FLOOR }),
        );
      },
    },
  },
  /* ========================================================================
     2. LA ESCALERA SE CORRE AL ORIENTE
     ------------------------------------------------------------------------
     La escalera sigue bajando dentro del cerro, en la misma direccion, pero
     pegada al muro oriente. La sala recupera 8.60 m de fachada corrida y el
     hueco deja de partirla a la mitad.

     Abajo ya no cae en el pasillo sino en la zotehuela, que es un hueco en la
     losa de la terraza: por ahi no hay que cortar nada. Se techa la franja de
     la zotehuela donde caen los ultimos escalones para que no se mojen.

     Condicion estructural: la zanja corre junto al muro oriente, asi que ese
     muro hay que recalzarlo antes de excavar. Es lo unico que decide si esta
     variante se puede o no.
     ====================================================================== */
  {
    id: 'escalera-oriente',
    nombre: '2. Escalera al oriente',
    nota: 'La escalera se recorre al muro oriente y baja a la zotehuela. La sala '
        + 'queda con 8.60 m de fachada libre y sin hueco al centro. Pide recalzar '
        + 'el muro oriente antes de excavar.',
    parche: AL_ORIENTE,
  },

  /* ========================================================================
     2b. LA MISMA, PERO CERRADA
     ------------------------------------------------------------------------
     Hereda todo lo de la 2 y encima le pone un muro de piso a techo entre la
     sala y la escalera, con su puerta. La escalera deja de ser un hueco en la
     sala y pasa a ser un nicho: la fachada sur queda de 8.50 m corridos y la
     sala se lee como un solo rectangulo.

     El nicho mide 1.03 x 4.00 y se entra por una puerta de 0.90 en su costado
     poniente, frente al descanso de arranque (1.20 x 1.03) que queda antes del
     primer escalon. Al fondo lo cierra la cocina, que ya estaba ahi.
     ====================================================================== */
  {
    id: 'escalera-oriente-cerrada',
    nombre: '2b. Escalera al oriente, cerrada',
    nota: 'La misma escalera de la variante 2, pero detrás de un muro con puerta: '
        + 'queda como un nicho propio y la sala se lee como un solo rectángulo, '
        + 'con 8.50 m de fachada corrida.',
    parche: {
      ...AL_ORIENTE,
      muros: { ...AL_ORIENTE.muros },

      extra(casa, h) {
        AL_ORIENTE.extra(casa, h);        // primero, todo lo de la variante 2

        const n1 = casa.LEVEL_BY_ID.N1;
        const n2 = casa.LEVEL_BY_ID.N2;
        const e2 = casa.ESC.e2;
        const xMuro = e2.x - (casa.ESC.ancho / 2 + e2.holgura + e2.muro / 2);
        const xCara = xMuro - e2.muro / 2;     // cara del muro hacia la sala
        const yFondo = h.fN('Y_COC_S');        // el nicho topa con la cocina
        const alto = (h.Z.N1 + h.H.FLOOR) - h.Z.N2;
        const piso = h.Z.N1 - h.Z.N2;          // piso de la sala, medido desde abajo

        // El muro de la caja ya existe, pero solo asoma 1.00 sobre el piso de
        // la sala. Se rehace de piso a techo, se alarga hasta la cocina y se le
        // abre la puerta del nicho.
        const i = n2.walls.findIndex((m) => m.id === 'n2.caja-esc-poniente');
        n2.walls[i] = h.muroX('n2.caja-esc-poniente', xMuro, 'Y_N2_N', yFondo, {
          t: e2.muro, h: alto, kind: 'int',
          vanos: [h.vano('door', 3.20, 4.10, piso, piso + 2.10)],
        });

        // La sala suelta esa franja y el nicho se vuelve un cuarto propio.
        const sala = n1.rooms.find((r) => r.id === 'n1.sala');
        sala.poly = sala.poly.map(([x, y]) => [Math.min(x, xCara), y]);
        sala.dim = '8.50 x 4.00 (4.72 fuera de la cocina)';
        n1.rooms.push({
          id: 'n1.nicho-escalera', name: 'Escalera a las recamaras', kind: 'hall',
          dim: '1.03 x 4.00',
          poly: h.rect(xCara + e2.muro, h.fP('Y_SALA_S'), h.fN('XE'), yFondo),
        });
      },
    },
  },

  /* ========================================================================
     3. LA ESCALERA SE BAJA A LA BANDA (propuesta de la otra sesion)
     ------------------------------------------------------------------------
     La escalera sale por completo de la sala: se tapa el hueco y el tramo pasa
     al nivel de abajo, corriendo de oriente a poniente pegado al muro de
     contencion, dentro de la banda de servicio. Arriba se cierra una franja de
     1.00 m sobre la terraza para cubrirlo, y ahi queda el descanso de salida.

     17 peraltes de 17.1 y huella de 25: cumple el reglamento, contra los 20.7
     de hoy.

     Lo que cuesta, y se ve caminandola:
       - junto al tramo queda un paso de 0.77 m, que es por donde hay que ir a
         las recamaras 2 y 3;
       - el tramo cruza los dos muros de 0.18 que dividen la banda, asi que hay
         que tumbarlos, y son los que le dan apoyo intermedio a la losa de la
         terraza en un claro de 6.67 m: pide trabe;
       - la zotehuela de abajo queda techada;
       - la puerta a la terraza se recorre al poniente;
       - la caja vieja se queda como bodega, con su acceso ya abierto.
     ====================================================================== */
  {
    id: 'escalera-banda',
    nombre: '3. Escalera a la banda',
    nota: 'La escalera sale de la sala y baja por la banda de servicio, pegada al '
        + 'muro de contención, bajo una franja cerrada de 1.00 m sobre la terraza. '
        + 'Libera la sala entera; a cambio deja un paso de 0.77 m y tumba los dos '
        + 'muros que apoyan la losa de la terraza.',
    parche: {
      escaleras: { tramos: { e2: null } },
      muros: {
        // el tramo cruza la banda de lado a lado
        'n2.acceso1-pasillo': null,
        'n2.pasillo-zotehuela': null,
        // la caja vieja se queda de bodega: sus muros ya no asoman en la sala
        'n2.caja-esc-poniente': { h: 2.90 },
        'n2.caja-esc-oriente': { h: 2.90 },
      },
      cuartos: {
        'n2.zotehuela': { name: 'Zotehuela (techada)', dim: '2.74 x 1.68, sin cielo' },
      },

      extra(casa, h) {
        const n1 = casa.LEVEL_BY_ID.N1;
        const n2 = casa.LEVEL_BY_ID.N2;
        const yEsc = -0.455;                 // eje del tramo, pegado a contencion
        const xBot = 4.60, xTop = 8.60;      // 4.00 m de desarrollo
        const yFranja = -0.90;               // cara interior del cierre nuevo

        // 1. La sala se cierra: ya no hay hueco en su losa.
        n1.slab.holes = [];

        // 2. La fachada cambia de vanos: puerta a la terraza al poniente y
        //    puerta a la escalera en el extremo oriente.
        const i = n1.walls.findIndex((m) => m.id === 'n1.fachada-sur');
        n1.walls[i] = h.muroY('n1.fachada-sur', 'Y_SALA_S', h.O.w, h.O.e, {
          t: h.T.GLASS, kind: 'glass',
          vanos: [h.puerta(2.60, 4.00, 2.40), h.puerta(8.86, 9.76)],
        });

        // 3. La franja cerrada sobre la terraza: cubre el tramo y el descanso.
        n1.walls.push(
          // de cristal: cerrada con muro, la mitad oriente de la sala se
          // queda sin vista a la terraza
          h.muroY('v3.cierre-sur', yFranja, 4.40, h.O.e,
            { t: h.T.GLASS, kind: 'glass' }),
          h.muroX('v3.cierre-poniente', 4.40, yFranja, 'Y_SALA_S',
            { t: h.T.EXT, kind: 'ext' }),
        );
        n1.extraSlabs = [{
          id: 'v3.techo-franja', mat: 'concrete', holes: [], t: h.H.SLAB,
          outline: h.rect(4.30, -1.00, h.O.e, h.cl('Y_SALA_S')), z: h.Z.N0,
        }];

        // 4. La losa de la terraza se corta sobre el tramo. Lo que queda al
        //    oriente del corte es el descanso de salida de la sala.
        n2.roofSlab.holes = [h.rect(4.50, yFranja, xTop + 0.02, 0.18)];

        // 5. El tramo, y la caja vieja convertida en bodega.
        casa.STAIRS.push({
          id: 'v3.esc', from: [xTop, yEsc], to: [xBot, yEsc],
          z0: h.Z.N1, z1: h.Z.N2, width: casa.ESC.ancho, peraltes: 17,
          note: 'sala -> recamaras, 17 peraltes de 17.1 en la banda',
        });
        n2.rooms.push({
          id: 'n2.bodega', name: 'Bodega (caja vieja)', kind: 'closet',
          dim: '1.03 x 2.73', poly: h.rect(4.89, 0.02, 5.92, 2.75),
        });
      },
    },
  },
];

export const VARIANTE_BASE = VARIANTES[0];
