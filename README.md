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

- Navegador moderno (Chrome, Edge, Firefox, Safari).
- Para desarrollo con recarga: `Live Server` (extensión de VS Code) o `http-server`/`serve` de npm.

Cómo ejecutar localmente
------------------------

Opción 1 — Abrir directamente

- Abre `index.html` con doble clic o arrástralo al navegador.

Opción 2 — Usar Live Server (recomendado durante desarrollo)

- Si usas Visual Studio Code instala la extensión `Live Server`.
- Abre la carpeta del proyecto en VS Code y pulsa `Go Live` en la esquina inferior.

Opción 3 — Servidor HTTP rápido con npm

- Si tienes Node.js instalado, puedes usar `http-server` o `serve`:

```powershell
npm install -g http-server
http-server . -c-1
```

o

```powershell
npx serve .
```

Esto servirá los archivos en `http://localhost:8080` (o puerto alternativo mostrado en consola).

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

Licencia
--------

Este proyecto no incluye una licencia específica por defecto. Si quieres publicar el proyecto, añade un archivo `LICENSE` con la licencia deseada (por ejemplo, MIT).

Contacto
--------

Si necesitas ayuda adicional o quieres que adapte este README (por ejemplo, traducirlo al inglés, agregar badges o instrucciones para despliegue), dime qué prefieres y lo actualizo.

