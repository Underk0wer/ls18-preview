# Limón Soda Zero — Landing

Una sola página vertical con dos estancias:

1. **Estancia 1** — imagen fija: la escena del asado con la lata en primer
   plano, el titular «Este 18 corto / Haz todo Haz nada» y el botón
   **Ver comercial**, que abre el video en una ventana sobre la página.
2. **Estancia 2** — el video se reproduce solo al entrar en pantalla, con
   las etiquetas de cada producto apareciendo a su tiempo. Al terminar
   queda la imagen fija.

Logo arriba a la derecha, redes y Bases Legales abajo a la izquierda, y
barra de progreso a la derecha: los cuatro acompañan todo el recorrido.
Sin dependencias externas.

## Estructura

```
index.html          ← enlaces de redes
css/style.css       ← diseño y ritmo del scroll
js/main.js          ← control del scrub
assets/
  video/hero.hevc.mp4         17.7 MB — desktop, HEVC (1920×1080, 60 fps)
  video/hero.h264.mp4         18.1 MB — desktop, respaldo H.264
  video/hero-mobile.hevc.mp4   5.8 MB — teléfonos, recorte vertical 608×1080
                                        (crop x=860, centrado en el cajón)
  video/hero-mobile.h264.mp4   5.9 MB — teléfonos, respaldo H.264
  img/logo-ls.webp       1.9 MB — logo animado
  img/logo-ls-static.png        — primer frame, pinta al instante
  img/poster.jpg                — póster
  img/fondo-estatico.webp        1,2 MB — imagen fija del final (2560×1440)
  img/fondo-estatico-mobile.webp 0,6 MB — la misma, recorte vertical
  img/e1/                       — estancia 1: base y lata (webp) + los
                                  materiales en SVG (textos, estrellas,
                                  botón en sus dos estados)
  img/e2/                       — estancia 2: el titular en piezas (SVG)
  img/txt/                      — estancia 2: etiquetas de los productos
                                  con transparencia (~150 KB en total)
  icons/                        — IG / TikTok / YouTube + favicon
  docs/bases-legales.pdf        — bases del concurso (ECCU, 4 páginas)
_Assets/            ← originales, sin tocar
```

## Ajustes

**Enlaces a redes** — en `index.html`, marcados
`<!-- ENLACES EDITABLES -->`. Hoy apuntan a `#`.

**Bases Legales** — el enlace del pie abre
`assets/docs/bases-legales.pdf` en una pestaña nueva. Es el PDF
«CONCURSO LIMÓN SODA - 18 SEPT» de ECCU, renombrado sin espacios ni
acentos porque esos caracteres dan problemas en algunos servidores.
Para actualizarlo, basta reemplazar ese archivo.

**Textos** — salen de `_Assets/Editable_WEB_Muestra.png`, recortados con
transparencia a `assets/img/txt/`. Son imágenes, no texto: para cambiar
una palabra hay que reexportarla desde el diseño. Sus posiciones están en
`css/style.css` (`.ov--titular`, `.ov--parrilla`, …) en porcentaje, y las
tomé del mockup 1920×1080.

**El titular de la estancia 2** se arma con las piezas de
`_Assets/Estancia_2` (`kits2`, `para2`, `alargar2`, `tu2`, `182` y la
estrella). Entran escalonadas cada 0,10 s **cuando se llega a la estancia
2**, no al cargar la página ni durante el desplazamiento. El disparador es
un `IntersectionObserver` con umbral 0,92: con un umbral bajo la entrada
ocurriría a mitad del salto y habría terminado antes de llegar. El video
usa un umbral aparte (0,35), así arranca en cuanto la estancia asoma.

Las dos estrellas llevan el mismo tratamiento que las de la estancia 1:
entran creciendo y giran sin parar, una vuelta cada 3 s (`giraEstrella`).
Van en dos capas para que crecimiento y giro no compitan por el mismo
`transform`.

**Cuándo entra cada etiqueta** — atributo `data-at` en `index.html`, en
segundos de video, ajustado a cuándo aparece cada producto:

| etiqueta          | entra a |
|-------------------|---------|
| PARRILLA          | 0,90 s  |
| TACA-TACA         | 2,20 s  |
| COOLER            | 3,15 s  |
| JUEGO DE LA RANA  | 4,20 s  |
| PARLANTE          | 5,50 s  |

El titular entra al abrir la página y se queda.

**Estancia 1** — la foto ya trae la lata, pero **cortada por la derecha**;
`lata.webp` la completa y va encima, alineada al milímetro sobre la de la
foto. Va en dos capas para que no se peleen por el mismo `transform`: la
de fuera (`.e1__lataPos`) crece con el scroll, la de dentro (`.e1__lata`)
late en bucle. Toda la animación de la lata es de escala; no se desplaza.

**Entrada de la estancia 1** — las piezas del titular entran escalonadas
(`.e1i` en `css/style.css`): «Este 18 corto» a los 0,10 s, «Haz todo» a
los 0,24, «Haz nada» a los 0,38, las dos estrellas a los 0,52 y 0,64, y el
botón a los 0,80, el bloque de la promoción entre 0,94 y 1,24 y la flecha
a los 1,36. Los textos entran deslizándose.

Después de entrar quedan tres animaciones en bucle:

- **El bloque de la promoción late por turnos**: una pieza a la vez, en el
  orden compra → Limón Soda Zero → locales → participa. Cada una ocupa un
  cuarto del ciclo de 3,2 s (`pulsoTurno`, con `animation-delay` de 0, 0,8,
  1,6 y 2,4 s); fuera de su turno se queda en escala 1.
- **La flecha sube y baja** (`bajaSube`, ±14%).
- **Las estrellas giran** sin parar, una vuelta cada 3 s.

Todas van en dos capas —la de fuera entra, la de dentro se mueve— porque
un elemento no admite dos animaciones sobre el mismo `transform`.

**Las estrellas giran sin parar, una vuelta cada 3 s** (`@keyframes
giraEstrella`, `linear`). Van en dos capas: la de fuera sólo las hace
crecer al entrar y el SVG de dentro gira siempre. Como el giro ya está
corriendo cuando aparecen, se ven girar mientras crecen y siguen girando
después. Para cambiar el ritmo, basta la duración de `giraEstrella`.

Las posiciones de cada pieza salen de localizar su SVG dentro del mockup,
no de medir a ojo. Las actuales corresponden a
`_Assets/Materiales/FONDO_ESTANCIA_1.png`; si el diseño cambia hay que
repetir esa medición.

> **Pendiente:** ese mockup usa una foto de fondo más abierta que
> `Base_estancia_1_Desktop.png`, que no llegó actualizada. Los textos
> están en su sitio, pero la escena y la lata siguen con el encuadre
> anterior.

**El botón** usa los dos estados del material: `boton.svg` en reposo y
`boton_p.svg` (la versión hundida, sin la extrusión) mientras se pulsa.

**El comercial** — se abre en una ventana sobre la página (cierra con la
X, con Escape o pulsando fuera). Reproduce «Limón Soda Zero – Un 18
corto» desde YouTube. Para cambiar el video basta la constante `YT_ID`
en `js/main.js`.

El iframe se rellena al abrir y se vacía al cerrar. Así YouTube no pide
nada mientras la ventana está guardada —comprobado: cero peticiones antes
de pulsar— y al cerrar la reproducción se corta de verdad en vez de
seguir sonando de fondo. Se usa el dominio `youtube-nocookie.com`.

**Salto desde la estancia 1.** El primer gesto hacia abajo no deja
recorrerla a mano: baja entera hasta la estancia 2 en 900 ms
(`SALTO_DUR` en `js/main.js`). Va enganchado a rueda, teclas, barra de
scroll y dedo.

**Las paradas son sólo de la estancia 2.** En la primera el scroll es
libre; si no, al detenerse ahí el asentamiento empujaría al visitante
hacia el video sin que lo pidiera.

**Pantalla de carga** — fondo `#00AE42` (variable `--carga`), con
`logo.svg` latiendo al centro y nada más. No lleva indicador de avance: la
espera es corta y el latido ya comunica que algo está pasando.

**Cómo se abre hacia la estancia 1.** El logo late al menos 1 s
(`MIN_CARGA` en `js/main.js`) aunque el video ya esté listo, y después
crece hasta llenar la pantalla mientras el interior de su O se vacía y
deja ver la escena.

El crecimiento arranca **justo cuando el latido toca su punto más bajo**,
que es la misma escala en la que empieza a crecer: así se pasa de latir a
crecer sin ningún salto. El ciclo del latido dura 1 s para que ese mínimo
caiga exactamente al cumplirse `MIN_CARGA`, y aun así el momento se
confirma leyendo el reloj real de la animación (`getAnimations()`) en vez
de suponerlo, porque el CSS y el script no arrancan a la vez. Son tres capas:

1. `.loader__bg` — el verde, que desaparece al empezar la apertura.
2. `.loader__iris` — un disco cuyo `box-shadow` pinta de verde todo lo
   que lo rodea: al crecer, el agujero se abre.
3. `.loader__logo` — delante de todo, con una máscara que le quita el
   interior de la O.

Las tres comparten curva y escala final, y el logo escala con
`transform-origin` en el centro de la O (51,12% / 53,96% del SVG, medido
sobre el propio archivo). Así el hueco de la letra y el del iris coinciden
durante toda la apertura y el efecto parece salir de la propia O.

Las animaciones de la estancia 1 arrancan cuando el agujero ya deja verla,
no antes.

**Barra de progreso** — franja vertical fija en el borde derecho que se
llena con el avance del recorrido completo, las dos estancias. Estilo en `.prog` / `.prog__fill`
(`css/style.css`): riel blanco y relleno azul, el mismo par del lettering.
Se anima con `scaleY`, que el navegador resuelve en el compositor, así que
no cuesta layout en cada cuadro. Refleja la posición del video —no la del
scroll en bruto—, de modo que al asentarse en una parada la barra se
detiene junto con la imagen.

**Imagen final** — al llegar al último cuadro, el video se funde con
`assets/img/fondo-estatico.webp` en 0,55 s, y vuelve al video apenas se
sube. El umbral está en `js/main.js` (`currentTime >= duration - 0.03`) y
la transición en `.stage__still` dentro de `css/style.css`.

**El video corre solo.** Arranca cuando la estancia 2 entra en pantalla
(`IntersectionObserver`) y se pausa al salir; si ya terminó y se vuelve a
entrar, se reinicia. Las etiquetas siguen su tiempo de reproducción,
con los segundos del atributo `data-at`.

**Antes esto era un scrub** —el video avanzaba con el scroll— y por eso
estaba codificado con keyframes muy densos. Al pasar a reproducción normal
se recodificó con GOP de 2 s: **3,79 MB en vez de 17,71**, con la calidad
incluso algo mejor (SSIM 0,984 contra 0,982). En móvil, 1,25 MB.

**Calidad del video** — se codifica con `-g 3` (GOP 3) y CRF 26. Bajar el
CRF sube calidad y peso: CRF 24 → 20 MB, CRF 22 → 24 MB. Sobre CRF 22 la
ganancia ya casi no se nota.

**Suavidad del scrub** — en `js/main.js`, constante `K` (7.5).
Es la constante de seguimiento del suavizado, en 1/segundos:
más alto = el video se pega al scroll; más bajo = más inercia.
Es independiente del framerate, así que se siente igual a 60 y a 120 Hz.

## Publicar

El servidor debe soportar **HTTP Range**, o el video no podrá buscar y
quedará congelado en el primer frame. Netlify, Vercel, S3, Nginx y Apache
lo hacen por defecto — `python -m http.server` **no**.

Local:
```bash
npx serve .
```
Abrir con doble clic (`file://`) también funciona.

## Notas técnicas

Tres cosas hacen que el scroll se sienta fluido:

1. **GOP 3 en HEVC.** Lo intuitivo es poner un keyframe en cada cuadro
   (all-intra) para que buscar sea instantáneo. Medido, es la peor opción:
   los cuadros I son tan grandes que leerlos cuesta más que decodificar un
   par de cuadros P. A igual peso (~13,5 MB, 1920×1080):

   | códec / GOP        | SSIM  | PSNR    | búsqueda p95 |
   |--------------------|-------|---------|--------------|
   | H.264 all-intra    | 0,847 | 30,9 dB | 5,4 ms       |
   | H.264 GOP 2        | 0,924 | 34,3 dB | 4,7 ms       |
   | H.264 GOP 3        | 0,953 | 36,6 dB | 5,6 ms       |
   | H.264 GOP 4        | 0,967 | 38,3 dB | 8,8 ms       |
   | HEVC all-intra     | 0,888 | 32,8 dB | 2,9 ms       |
   | **HEVC GOP 3**     | 0,972 | 39,7 dB | **2,9 ms**   |

   HEVC con GOP 3 gana en las tres dimensiones. El presupuesto por cuadro
   a 60 Hz es 16,7 ms, así que 2,9 ms deja margen de sobra.
2. **Geometría cacheada.** Leer `getBoundingClientRect()` en cada cuadro
   fuerza un reflow 60 veces por segundo. Se mide sólo al cargar y al
   redimensionar.
3. **Una búsqueda a la vez.** Encolar varias satura al decodificador; el
   evento `seeked` libera la siguiente.

El asentamiento no corta de golpe: anima el scroll con una salida cúbica
de 480 ms, y durante esa ventana el video se anima directo al destino en
vez de seguir al scroll. Si lo siguiera, al venir rezagado por la inercia
lo sobrepasaría y se vería rebotar. Se cancela apenas el usuario vuelve a intervenir — rueda,
teclas de scroll, o dedo en pantalla — y no se dispara mientras haya un
dedo apoyado.

El material actual (`Video_Productos_c`) dura 8,02 s y trae 481 cuadros a
60 fps.

**Por qué GOP 8 y no 3.** Con 481 cuadros, meter un keyframe cada 3 sale
carísimo. Medido a CRF 24 constante, alargar el GOP baja el peso *y* sube
la calidad, porque los cuadros P son más eficientes que los I:

| GOP | peso    | SSIM  | búsqueda p95 |
|-----|---------|-------|--------------|
| 3   | 32,9 MB | 0,973 | 5,2 ms       |
| 5   | 25,0 MB | 0,980 | 7,4 ms       |
| 8   | 17,7 MB | 0,982 | 8,8 ms       |
| 12  | 13,3 MB | 0,983 | 10,6 ms      |

GOP 8 es el punto de equilibrio: la búsqueda usa la mitad del presupuesto
de 16,7 ms por cuadro y el archivo pesa lo mismo que el video anterior,
con más calidad y 2,5 veces más cuadros.

Antes se probó interpolar un material de 24 fps para tener más cuadros
(`minterpolate` con compensación de movimiento). No sirve: en los cuadros
donde un objeto aparece de golpe —es stop-motion— la interpolación lo
deforma. Con un master a 60 fps el problema desaparece de raíz.
Otras notas:

- **El techo de nitidez es la fuente: 1080p.** En una pantalla Retina el
  navegador pinta al doble de píxeles, así que el video se amplía ~1,8×.
  Para nitidez perfecta ahí haría falta un master en 4K.
- **Códec por navegador.** Se sirve HEVC a quien lo soporta (Safari,
  Chrome/Edge con decodificación por hardware) y H.264 al resto (Firefox).
  Si el HEVC no carga, `js/main.js` reintenta una vez con el H.264.

- No se interpoló el video a más cuadros: la interpolación genera doble
  exposición visible en los objetos que aparecen, y ese "pop" es parte del
  lenguaje stop-motion del material.
- El logo animado carga diferido — primero el PNG estático, luego el WebP.
- Para teléfonos se sirve un recorte vertical 9:16 del mismo video,
  centrado en la acción. El recorte se hace al codificar y no con CSS:
  así llena la pantalla nítido, en vez de escalar un archivo apaisado.
  Para volver al encuadre completo, basta apuntar `hero-mobile.mp4` a una
  versión sin recortar.
- Respeta `prefers-reduced-motion`.
- Ningún elemento lleva sombra: el lettering se sostiene con su propio
  contorno azul y los iconos con su círculo sólido.
- **Los textos siguen el encuadre del video, no el de la ventana.** Como
  el video va con `object-fit:cover`, la caja `.frame` reproduce ese mismo
  recorte; si no, las etiquetas se despegarían de sus productos al cambiar
  la proporción de pantalla.
- **En vertical el diseño se recoloca.** El mockup es 16:9 y en teléfono
  el video es un recorte 9:16, donde el taca-taca y el parlante quedan
  fuera de cuadro: sus etiquetas se ocultan y el resto se reubica sobre lo
  que sí se ve (ver el bloque `@media (max-aspect-ratio: 4/5)`).
