# Juego del Capibara

## Descripción

Un juego estilo "dinosaurio Chrome" donde controlas un capibara saltador que debe evitar obstáculos. Las puntuaciones se guardan localmente en el navegador usando `localStorage`, permitiendo jugar sin necesidad de un servidor backend.

## Características

- **Personaje animado**: capibara con animación de carrera (2 frames).
- **Dificultad progresiva**: velocidad de obstáculos y frecuencia aumentan según la puntuación.
- **Delay inicial**: 3 segundos antes de que inicie el juego.
- **Reinicio limpio**: al perder, se muestra un overlay sin recargar la página.
- **Tabla de puntuaciones**: los 5 mejores intentos se guardan en `localStorage` del navegador.
- **Sprites**: imágenes del capibara y obstáculos en la carpeta `images/`.

## Estructura de archivos

- `index.html` — estructura HTML con canvas, HUD y overlay.
- `style.css` — estilos CSS.
- `script.js` — lógica del juego (movimiento, colisiones, puntuaciones).
- `images/` — carpeta con sprites (capibara corriendo, obstáculos).


## Requisitos

- Navegador moderno (Chrome, Edge, Firefox, Safari).
- **Nota**: no se requiere Node.js ni servidor backend.

## Cómo ejecutar localmente

### Opción 1 — Abrir directamente (más simple)

1. Haz doble clic en `index.html` o arrástralo al navegador.
2. El juego se inicia automáticamente con un delay de 3 segundos.

### Opción 2 — Servidor HTTP local (recomendado para desarrollo)

Si tienes Node.js instalado, puedes servir los archivos con un servidor HTTP:

```powershell
npx http-server . -c-1 -p 8080
```

o

```powershell
npx serve .
```

Luego abre `http://localhost:8080` (o el puerto mostrado en consola).

## Desarrollo

- **Edición**: modifica `index.html`, `style.css` y `script.js` según necesites.
- **Recarga**: si usas un servidor HTTP con live reload, la página recargará automáticamente al guardar.
- **Debug**: usa las herramientas de desarrollador del navegador (F12) para ver errores y mensajes `console.log()` del `script.js`.
- **Scores locales**: abre la consola (`F12` → `Console`) y ejecuta `localStorage.getItem('dinoGameScores')` para ver las puntuaciones guardadas.

## Detalles técnicos

### Almacenamiento de puntuaciones

- Las puntuaciones se guardan en **`localStorage`** bajo la clave `"dinoGameScores"`.
- Se mantienen los **5 mejores intentos** (ordenados de mayor a menor).
- Las puntuaciones persisten localmente en el navegador; no se sincronizan entre dispositivos.
- Al hacer Game Over, la puntuación se guarda automáticamente en `localStorage` y se actualiza la tabla.

### Mecánicas del juego

- **Delay inicial**: 3 segundos de countdown antes de que aparezca el primer obstáculo.
- **Reinicio limpio**: al perder, aparece un overlay sin recargar la página; click en "Reiniciar" inicia un nuevo juego.
- **Dificultad progresiva**: cada 20 puntos se aumentan la velocidad de obstáculos y su frecuencia.
- **Animación**: el capibara tiene 2 frames animados (duración: 120ms cada frame).
- **Canvas**: resolución 800x400 píxeles.

## Troubleshooting

- **Imágenes no se cargan**: verifica que la carpeta `images/` esté en el mismo nivel que `index.html`.
- **Scores no persisten**: habilita localStorage en tu navegador (algunos modos privados lo desactivan).
- **Game Over sin transición**: si el capibara aparece sobre un obstáculo al reiniciar, comprueba el valor de `dino.y` inicial en `createDino()`.

## Licencia

Este proyecto no incluye una licencia específica por defecto. Si quieres publicar el proyecto, añade un archivo `LICENSE` con la licencia deseada (por ejemplo, MIT).

## Contribuciones

Las contribuciones son bienvenidas. Si encuentras bugs o tienes mejoras, abre un issue o envía un pull request.

