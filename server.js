// Servidor Express simple para servir archivos estáticos y persistir puntuaciones
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// Archivo donde se persisten las puntuaciones en formato JSON (array)
const DATA_FILE = path.join(__dirname, 'scores.txt');

// Middlewares: parseo JSON y servir archivos estáticos desde la raíz del proyecto
app.use(express.json());
app.use(express.static(__dirname));

// Leer y parsear las puntuaciones desde el archivo
function readScores() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (e) {
    // Si hay cualquier error al leer, retornar lista vacía
    return [];
  }
}

// Guardar la lista de puntuaciones en el archivo (sobrescribe)
function writeScores(list) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing scores', e);
  }
}

// Endpoint GET /scores: devuelve las puntuaciones ordenadas (mayor->menor)
app.get('/scores', (req, res) => {
  const list = readScores();
  list.sort((a, b) => b.score - a.score);
  res.json(list);
});

// Endpoint POST /scores: añade una nueva puntuación (body: { score, time })
app.post('/scores', (req, res) => {
  const { score, time } = req.body || {};
  if (typeof score !== 'number') return res.status(400).json({ error: 'score required' });
  const list = readScores();
  list.push({ score, time: time || Date.now() });
  // Ordenar descendente y recortar para evitar crecimiento excesivo
  list.sort((a, b) => b.score - a.score);
  writeScores(list.slice(0, 1000));
  res.json({ ok: true });
});

// Iniciar servidor en el puerto configurado
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
