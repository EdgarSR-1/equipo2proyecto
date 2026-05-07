# Capibara Underground

Juego 2D estilo endless runner hecho con HTML, CSS y JavaScript. Controlas un capibara que debe esquivar obstáculos para sumar puntos mientras la dificultad aumenta con el tiempo.

## Tabla de contenido

- Descripción
- Características
- Tecnologías y dependencias
- Estructura del proyecto
- Cómo ejecutar
- Controles
- Scoreboard y persistencia
- Configuración rápida
- Troubleshooting
- Créditos
- Contribuir
- Licencia

## Descripción

Este proyecto incluye:

- Menú inicial con botones de inicio, instrucciones, créditos y scoreboard.
- HUD de juego con puntuación actual y mejor puntuación.
- Fondo animado con transiciones entre escenas.
- Obstáculos múltiples (tronco, hongo y volador) con hitboxes configuradas.
- Sonidos de música, salto y colisión.

## Características

- Gameplay estilo corredor infinito.
- Dificultad progresiva con el score.
- Modo debug de hitboxes (tecla `H`).
- Reinicio rápido al perder.
- Scoreboard Top 5 persistido localmente.

## Tecnologías y dependencias

### Runtime

- HTML5 Canvas
- CSS3
- JavaScript (ES6+)
- Web Audio API (`Audio`)
- Web Storage API (`localStorage`)

### Dependencias externas

- Google Fonts (cargadas en `index.html`):
	- `Press Start 2P`
	- `VT323`

### Dependencias de Node/NPM

No se requiere `package.json` ni instalación de paquetes para ejecutar el juego.

## Estructura del proyecto

```text
equipo2proyecto/
	images/            # sprites, fondos y recursos visuales
	sound/             # musica y efectos de audio
	index.html         # estructura principal, menu y modales
	style.css          # estilos y layout visual
	script.js          # logica del juego, colisiones y scoreboard
	README.md
	LICENSE
```

## Cómo ejecutar

### Abrir directamente

1. Abre `index.html` en el navegador.
2. Pulsa `INICIAR`.

## Controles

- `Espacio`: saltar
- `H`: mostrar/ocultar hitboxes
- Botones de UI:
	- `INICIAR`
	- `INSTRUCCIONES`
	- `CREDITOS`
	- `Scoreboard`
	- `Reintentar`
	- `Menu`

## Scoreboard y persistencia

El juego guarda datos en `localStorage`:

- `capybaraTop5`: top 5 de puntuaciones (descendente).
- `capybaraBest`: mejor puntuación histórica usada en HUD.

Flujo principal:

1. Al perder se ejecuta `saveScoreToBoard(score)`.
2. Se lee el board actual con `loadScoreboard()`.
3. Se añade el nuevo score.
4. Se ordena de mayor a menor.
5. Se recorta a 5 entradas.
6. Se guarda de nuevo en `localStorage`.

Notas:

- Solo se guardan puntuaciones mayores a `0`.
- El guardado es local por navegador/dispositivo.
- Si borras datos del navegador, se pierde el historial.

## Configuración rápida

Constantes útiles en `script.js`:

- `SCOREBOARD_KEY = "capybaraTop5"`
- `SCOREBOARD_MAX = 5`
- `VOLADOR_MIN_SCORE = 20`

## Troubleshooting

- Imágenes o sonidos no cargan:
	- Verifica que `images/` y `sound/` estén en la raíz del proyecto.
- El scoreboard no guarda:
	- Revisa que `localStorage` esté habilitado.
	- Evita modo privado estricto.
- El juego no inicia:
	- Abre consola (`F12`) y valida que no haya errores de JavaScript.

## Créditos

- Axel Patricio De Gyves Garcia
- Luis Carlos Ortiz de Montellano Gómez
- Edgar Salazar Ríos
- Emmanuel Gallardo Gómez
- Regina Flores Gutiérrez
- Camila Jiménez González

## Contribuir

1. Crea una rama para tu cambio.
2. Implementa y prueba localmente.
3. Abre un Pull Request con descripción del cambio y pasos de validación.

## Licencia

Este proyecto está bajo licencia MIT. Revisa el archivo `LICENSE`.

