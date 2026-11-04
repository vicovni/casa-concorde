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
| `O` | maqueta / caminar (el recorrido **arranca en maqueta**; al cambiar de variante te quedas en la misma vista) |
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

## El jardín zen de la zotehuela

La zotehuela del nivel inferior (2.74 × 1.68) no es un patio cualquiera: es el
**único hueco** que tiene la losa de la terraza, así que es un pozo de luz de
2.90 m de alto que se mira desde arriba. Ahí va un jardín seco: cama de arena
rastrillada, tres henequenes, piedras y enredadera en el muro del fondo.

El reparto está hecho para que **el jardín y la escalera volada de la variante
3 no se estorben**. Esa escalera cruza el pozo por la esquina noroeste, así
que el jardín se arma en **L**, en la franja oriente y en la sur:

| franja | de | qué lleva |
|---|---|---|
| entrada | x 7.10 a 7.80 | el lavadero, que se recorrió aquí |
| aire de la escalera | x 7.10 a 8.70, y −1.00 a 0.00 | nada: por ahí vuela el tramo de la variante 3 |
| cama oriente | x 8.70 a 9.84 | henequén grande, las dos piedras, enredadera al fondo |
| cama sur | x 7.80 a 8.70, y −1.68 a −1.00 | henequén chico y la laja |

Así es **una sola pieza** que sirve igual en el as-is y en la variante 3, sin
dos versiones que mantener. Donde no cabe es en las variantes 2 y 2b: ahí la
escalera **aterriza dentro** de la zotehuela y el pozo se vuelve el arranque
del tramo y la ruta a las recámaras, así que el jardín no se pone. La regla es
automática (`zotehuelaLibre` en `src/furniture.js`): lo que se mira es el pie
del tramo, no cualquier extremo, porque la volada de la variante 3 tiene la
cabeza sobre el pozo pero pasa a 2 m de altura.

El jardín vive en `src/furniture.js`, o sea que se prende con **M**, igual que
las macetas y los coches.

**Lo que cuesta en la variante 3:** ahí la losa de la terraza se vuelve a
cerrar sobre el pozo y solo queda abierta la ranura de la escalera, así que el
jardín se queda **sin cielo propio** y recibe luz nada más de lado. En el as-is
tiene el pozo entero encima.

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

## El modelo es paramétrico

`src/model.js` no tiene geometría escrita a mano: todo sale de los **ejes**.
Cada eje es la línea de centro de un muro más su espesor, y de sus caras
salen las medidas interiores:

```js
X_VEST: { at: 3.42, t: 0.12, nota: 'escaleras (3.16) | medio bano' }
```

Un cuarto se declara por los cuatro ejes que lo encierran, no por coordenadas:

```js
cuarto('n1.mediobano', 'Medio bano', 'bath',
       { w: 'X_VEST', e: 'X_MB', s: 'Y_BAND_S', n: 'Y_N1_N' })
```

Mover un eje recalcula solo los cuartos, muros, puertas, huecos de losa y
cotas que dependen de él. Las puertas van en **coordenadas absolutas**, así
que se quedan donde están aunque el muro cambie de largo.

Cada muro y cada cuarto tienen un **id** estable (`n1.sala-cocina`,
`n2.rec1`), para poder referirse a ellos sin depender de su posición en la
lista.

### Variantes

`buildHouse(parche)` arma la casa. El parche solo declara diferencias, así
que una variante hereda todo lo que no toca:

```js
buildHouse({
  nombre: 'Cocina más grande',
  ejes:    { Y_BAND_S: 4.26 },     // mueve un muro
  cuartos: { 'n1.mediobano': null } // lo elimina
});
```

Si después corriges una medida de la base, la corrección aparece sola en
todas las variantes — salvo en lo que la variante haya tocado explícitamente.

### Herramientas

```bash
node tools/huella.mjs        # huella de la geometría, para comparar refactors
node tools/prueba-variante.mjs
```

`tools/huella-base.txt` guarda la huella buena: si un cambio no debía mover
nada, `diff` contra ese archivo lo confirma.

### Cambiar de variante

En el recorrido 3D: tecla **`V`** (con `Shift` va hacia atrás) o el selector de
arriba a la izquierda. En el plano 2D: el selector junto al botón de "Recorrer
en 3D". Las variantes se declaran en `src/variantes.js`.

### Lo que puede hacer un parche

Mover ejes, y dar de alta, baja o cambiar cuartos, muros y tramos de escalera
por su id. Para volúmenes nuevos que no salen de mover un eje, el parche puede
traer una función `extra(casa, herramientas)` que recibe la casa ya armada y
los mismos constructores con que se armó.

La variante **1. Sala a doble altura** usa las dos cosas: parches por id para
quitar la cocina, la zotehuela y el prisma, y `extra` para abrir la losa de la
cochera, levantar los muros altos y ponerle techo.

### Las variantes de hoy

| # | Variante | De que se trata |
|---|----------|-----------------|
| 0 | Actual (as is) | La casa como esta. Las demas heredan de ella. |
| 1 | Sala a doble altura | La sala crece sobre la recamara 1, con ventanales y doble altura. |
| 2 | Escalera al oriente | La escalera a las recamaras se corre al muro oriente y baja a la zotehuela. La sala queda con 8.60 m de fachada libre. Pide recalzar el muro oriente. |
| 2b | Escalera al oriente, cerrada | La misma, pero con un muro y una puerta entre la sala y la escalera: queda como nicho y la sala se lee como un rectangulo. Es la unica variante que hereda de otra. |
| 3 | Escalera a la banda | La escalera sale de la sala y baja **volada** por la banda de servicio, bajo una franja cerrada sobre la terraza. Libera la sala entera; deja un paso de 0.77 m y tumba los dos muros que apoyan la losa de la terraza. |

### La escalera volada de la variante 3

Un tramo puede traer `volada`, y entonces no se dibuja macizo: cada huella es
una pieza que vuela del muro, y el peralte es un cristal de piso a piso del
escalón.

```js
volada: { muro: -1, esp: 0.12, nariz: 0.05, cristal: 0.015, mat: 'madera' }
rail:   [1]     // barandal solo del lado abierto
```

`muro` dice de qué costado vuela (el otro queda abierto y lleva el barandal),
`esp` es el canto en el arranque y `nariz` el del extremo libre: un voladizo
lleva el canto donde está el momento y adelgaza hacia afuera. Por eso de los
17.1 cm del peralte el cristal se ve casi entero.

En la variante 3 vuela 0.91 m del muro de contención norte. Las huellas no se
empotran barrenando ese muro: se montan sobre una zanca de tubo anclada a su
cara, por debajo del nivel de pisada, así que el ancho libre sigue siendo 0.91.
El costado sur tiene una caída de hasta 2.90 m al paso, así que el paño de
cristal con pasamanos no es adorno. Volándola se recupera la cuña que hoy sería
maciza debajo del tramo.

## Desde el móvil

El recorrido 3D trae controles táctiles: una **palanca** abajo a la izquierda
para caminar, el **dedo sobre la pantalla** para mirar, y botones para saltar
de nivel, la vista de maqueta, los muebles y la ayuda. Aparecen solos cuando
el equipo no tiene mouse o la pantalla es angosta.

El plano 2D apila los tres niveles en vertical y cada plano se ajusta al ancho.

## Desplegar

Es un **sitio estático**: no necesita node en el servidor. Todo lo que el
navegador pide está en el repo, incluido Three.js en `vendor/`.

Basta con servir la raíz del proyecto. Con nginx:

```nginx
server {
    listen 80;
    server_name casa.midominio.com;
    root /var/www/casa-concorde;
    index index.html;

    # Los módulos ES necesitan el tipo correcto
    types { application/javascript js mjs; text/html html; image/svg+xml svg; }

    location / { try_files $uri $uri/ =404; }
}
```

Lo único que hay que respetar es que los `.js` se sirvan como
`application/javascript`; si salen como `text/plain`, el navegador rechaza los
módulos y la página queda en blanco.

Para desarrollo local hay un servidor mínimo incluido:

```bash
node server.cjs
```

Si algún día se actualiza Three.js (`npm install`), hay que volver a copiarlo:

```bash
node tools/vendor.mjs
```
