# Casa Cto. Concorde — iteración 1

Modelo paramétrico de la casa, en metros, con plano 2D y recorrido 3D en primera
persona. Todo sale de un solo archivo de datos, así que corregir una medida
actualiza plano y modelo 3D al mismo tiempo.

## Cómo correrlo

```bash
node server.js
```

Luego abre <http://localhost:5174> (recorrido 3D) o
<http://localhost:5174/plano.html> (planos por nivel).

Hace falta un servidor porque el proyecto usa módulos ES; abrir el HTML con
doble clic no funciona.

## Controles del 3D

| Tecla | Acción |
|---|---|
| `W` `A` `S` `D` o flechas | caminar |
| mouse | mirar. Si el navegador no concede la captura del puntero, mira arrastrando con el botón izquierdo |
| `Esc` | volver al menú de inicio |
| `Shift` | correr |
| `1` `2` `3` | ir a cochera / nivel intermedio / recámaras |
| `M` | mostrar u ocultar muebles, coches y macetas (arranca en obra gris) |
| `O` | vista de maqueta (orbital) |
| `C` | atravesar muros |
| `H` | ocultar la ayuda |

Las escaleras se suben y bajan caminando, no hace falta nada más.

## Archivos

| Archivo | Qué hace |
|---|---|
| `src/model.js` | **la fuente de verdad**: ejes, muros, vanos, losas, escaleras |
| `src/plan2d.js` | dibuja los planos en SVG |
| `src/viewer3d.js` | arma la escena 3D y el control en primera persona |
| `src/materials.js` | texturas procedurales (yeso, concreto, madera, loseta) |
| `src/furniture.js` | muebles paramétricos |

Para mover un muro basta con tocar su eje en `AX` dentro de `src/model.js`.

## Geometría: qué es dato y qué es inferencia

Ejes de referencia: `x` crece hacia la derecha de la foto satelital, `y` crece
hacia la calle Cto Concorde, `z` es la cota (0.00 = nivel de calle).

Esta fase es un **levantamiento del as-is**, no una propuesta. Las
modificaciones vienen después.

### Medidas de obra

| | medida |
|---|---|
| Sala | 4.00 × 9.66 (9.64 interior) |
| Cocina | 3.50 de ancho, sobresale 0.72 hacia la sala |
| Zotehuela de la sala | 1.54 × 1.73 |
| Recámaras (fondo) | 4.60 · 3.70 · 2.80, de izquierda a derecha |
| Recámaras (ancho) | 2.80 · 3.10 · 3.50 |
| Pasillo del nivel inferior | 2.01 × 1.68 |
| Acceso-clóset de la recámara 1 | 1.56 × 1.74 |
| Zotehuela del nivel inferior | 2.74 × 1.68 |
| Ancho de escaleras | 0.91 |

Bajando la escalera a los cuartos: a mano izquierda la zotehuela, a mano
derecha el acceso-clóset de la recámara 1. El baño va entre la zotehuela y la
recámara 3. La recámara 1 es la única que sube hasta el muro del fondo.

### Cómo quedó

| | valor |
|---|---|
| Techado | ~113 m² |
| Bloque de cochera y sala | 10.04 × 7.06 |
| Fondo total con patio | 15.38 |
| Patio con pasto sintético | 22.3 m² |
| Entrepisos | 2.90 (2.60 libres + 0.30 de losa) |

Banda de atrás del nivel intermedio, de izquierda a derecha y alineada a 1.82
de fondo: escaleras (3.16), medio baño (1.08) y zotehuela (1.54). La cocina
(3.50 × 2.54) es la única que sobresale, 0.72 hacia la sala.

Nivel inferior, banda de servicio de 1.68 de fondo: recámara 1 (sube hasta el
fondo), acceso-clóset de la recámara 1, pasillo de 2.01 donde cae la escalera,
y zotehuela de 2.74. El baño (2.00 × 1.80) va entre la zotehuela y la
recámara 3.

### Por qué la fachada escalona hacia la derecha

Cada recámara arranca donde la deja lo que trae encima, y su fondo se mide de
ahí al frente. La 1 arranca en el muro del fondo, la 2 bajo la banda de
servicio y la 3 bajo el baño. Por eso la 3 es la que más sobresale, con
escalones de **0.90 y 1.02**.

### Las escaleras

Ambas de 0.91 de ancho y 17 peraltes de 17.1 cm (el RCDF pide peralte máximo
18, huella mínima 25 y ancho mínimo 0.90 en vivienda unifamiliar).

- **Cochera → intermedio:** en U dentro del prisma, **continua**: no hay
  descanso plano, la vuelta se da sobre tres escalones. Bajas por el lado sur
  y el giro es a la derecha. Huellas de 33 a 37 cm.
- **Sala → cuartos:** tramo recto hacia el sur, entre muros y sin barandales,
  al mínimo de reglamento: huellas de 25 cm y 4.00 m de desarrollo. Arranca a
  1.42 m del fondo de la sala para que el nivel inferior empiece justo donde
  la sala termina, y le sobresalen 2 escalones dentro del pasillo.

## Lo que sigue sin cuadrar

1. **La zotehuela de la sala quedó de 1.54 × 1.82**, no × 1.73. Los 1.82 son lo
   mínimo que necesitan los dos tramos de 0.91 de la escalera en U, y los tres
   espacios van alineados. Son 9 cm: o la zotehuela mide un poco más, o los
   tramos son un poco más angostos.
2. **La cocina quedó de 2.54 de fondo**, contra los 3.60 que se midieron al
   principio. Es consecuencia de respetar la zotehuela, y está confirmado así.
4. **El paso del pasillo al corredor de la recámara 3 y el baño** quedó de 1.33
   m. Ya es caminable, pero es el punto de esa esquina que menos me convence.
5. **Altura de entrepiso:** si no es 2.90, cambian los desarrollos de ambas
   escaleras y el tamaño del prisma.
