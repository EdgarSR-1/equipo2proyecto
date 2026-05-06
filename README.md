# Proyecto: Sitio web estático

Descripción
-----------

Este repositorio contiene un sitio web estático simple compuesto por `index.html`, `style.css` y `script.js`. Es una plantilla ligera pensada para demos, prototipos y páginas estáticas sin backend.

Objetivos
---------

- Proveer una estructura mínima para una página web estática.
- Facilitar el desarrollo local y la extensión del proyecto.

Estructura de archivos
----------------------

- `index.html` — entrada principal de la aplicación.
- `style.css` — estilos CSS globales.
- `script.js` — lógica de cliente (JavaScript).


Requisitos
---------

- Node.js >= 14 (para ejecutar el servidor y persistir puntuaciones).
- Navegador moderno (Chrome, Edge, Firefox, Safari).

Cómo ejecutar localmente
------------------------

Opción 1 — Correr servidor local (recomendado)

1. Instala dependencias:

```powershell
npm install
```

2. Inicia el servidor:

```powershell
npm start
```

3. Abre `http://localhost:3000` en tu navegador.

El servidor sirve los archivos estáticos del proyecto y expone una API simple para guardar y leer puntuaciones en `scores.txt`.

Opción 2 — Abrir directamente (sin scoreboard persistente)

- Abre `index.html` con doble clic o arrástralo al navegador. Nota: en este modo el scoreboard que intenta enviar/leer puntuaciones al servidor fallará porque no hay backend.

Desarrollo
---------

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

Contacto
--------

Si necesitas ayuda adicional o quieres que adapte este README (por ejemplo, traducirlo al inglés, agregar badges o instrucciones para despliegue), dime qué prefieres y lo actualizo.

