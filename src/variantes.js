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
];

export const VARIANTE_BASE = VARIANTES[0];
