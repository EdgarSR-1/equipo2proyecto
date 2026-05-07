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

- `index.html` — entrada principal de la aplicación.
- `style.css` — estilos CSS globales.
- `script.js` — lógica de cliente (JavaScript).


Requisitos
---------

- Node.js >= 14 (para ejecutar el servidor y persistir puntuaciones).
- Navegador moderno (Chrome, Edge, Firefox, Safari).

1. Haz doble clic en `index.html` o arrástralo al navegador.
2. El juego se inicia automáticamente con un delay de 3 segundos.

Opción 1 — Correr servidor local (recomendado)

1. Instala dependencias:

```powershell
npm install
```

o

```powershell
npm start
```

3. Abre `http://localhost:3000` en tu navegador.

El servidor sirve los archivos estáticos del proyecto y expone una API simple para guardar y leer puntuaciones en `scores.txt`.

Opción 2 — Abrir directamente (sin scoreboard persistente)

- Abre `index.html` con doble clic o arrástralo al navegador. Nota: en este modo el scoreboard que intenta enviar/leer puntuaciones al servidor fallará porque no hay backend.

## Desarrollo

- Edición: modifica `index.html`, `style.css` y `script.js` según necesites.
- Recarga: con `Live Server` la página recargará automáticamente al guardar.
- Debug: usa las herramientas de desarrollador del navegador (F12) para ver errores y mensajes `console.log` del `script.js`.

Buenas prácticas
---------------

- Mantén el CSS modular y evita reglas globales excesivas.
- Encapsula la lógica de UI en funciones en `script.js`.
- Usa comentarios claros y descriptivos para facilitar colaboración.


Contribuir
---------

- Haz un fork y crea una rama con un nombre descriptivo.
- Abre un pull request describiendo los cambios y su propósito.
- Para pequeñas correcciones (typos, documentación) puedes crear PR directo a `main`.

Detalles técnicos añadidos
------------------------

- Delay inicial: el juego espera 3 segundos antes de empezar y mostrar el primer obstáculo.
- Reinicio limpio: al morir se muestra un overlay con la puntuación y un botón `Reiniciar` que reinicia el juego desde el comienzo (no recarga la página).
- Scoreboard: las puntuaciones se guardan en `scores.txt` en formato JSON. El servidor (`server.js`) expone `GET /scores` y `POST /scores`.

Archivos nuevos relevantes
-------------------------

- `server.js` — servidor Express que sirve la app y persiste puntuaciones.
- `package.json` — dependencias y script `start`.
- `scores.txt` — archivo con el historial de puntuaciones (JSON).

Licencia
--------

Este proyecto no incluye una licencia específica por defecto. Si quieres publicar el proyecto, añade un archivo `LICENSE` con la licencia deseada (por ejemplo, MIT).

## Contribuciones

Las contribuciones son bienvenidas. Si encuentras bugs o tienes mejoras, abre un issue o envía un pull request.

