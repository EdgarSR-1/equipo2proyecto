const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'scores.txt');

app.use(express.json());
app.use(express.static(__dirname));

function readScores() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (e) {
    return [];
  }
}

function writeScores(list) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing scores', e);
  }
}

app.get('/scores', (req, res) => {
  const list = readScores();
  // ordenar descendente por score
  list.sort((a, b) => b.score - a.score);
  res.json(list);
});

app.post('/scores', (req, res) => {
  const { score, time } = req.body || {};
  if (typeof score !== 'number') return res.status(400).json({ error: 'score required' });
  const list = readScores();
  list.push({ score, time: time || Date.now() });
  // ordenar y recortar a 1000 entradas para evitar crecimiento ilimitado
  list.sort((a, b) => b.score - a.score);
  writeScores(list.slice(0, 1000));
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
