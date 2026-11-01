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
     alturas  { FLOOR: 2.75 }
     cotas    { N1: -2.80 }

   Los ids estan en src/model.js: 'n1.sala', 'n2.rec1', 'n1.sala-cocina'...
   Para verlos todos:  node tools/ids.mjs
   ========================================================================== */

export const VARIANTES = [
  {
    id: 'actual',
    nombre: 'Actual (as is)',
    nota: 'La casa como esta hoy. No tocar: es la base de la que heredan las demas.',
    parche: {},
  },

  // ---- A partir de aqui van las variantes que vayamos plasmando ----------
  {
    id: 'ejemplo-banda',
    nombre: 'Ejemplo: banda de 2.88',
    nota: 'Solo para ver como funciona la herencia. Mueve un unico eje y con el '
        + 'se recorren vestibulo, medio bano y zotehuela, se alargan sus muros y '
        + 'la sala se encoge. Borrala cuando ya no sirva.',
    parche: {
      ejes: { Y_BAND_S: 4.04 },
    },
  },
];

export const VARIANTE_BASE = VARIANTES[0];
