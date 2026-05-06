// Juego del dinosaurio
// Control principal: dibujo, lógica de colisión, spawn de obstáculos y puntuación.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajustes del lienzo
canvas.width = 800;
canvas.height = 200;

// Elementos UI (HUD y overlay)
const scoreDisplay = document.getElementById("scoreDisplay");
const overlay = document.getElementById("overlay");
const finalScore = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const countdownEl = document.getElementById("countdown");
const scoreboardList = document.getElementById("scoreboardList");

// Crear objeto dinosaurio con propiedades físicas y visuales
let dino = createDino();
function createDino() {
    return {
        x: 50, // posición horizontal fija
        y: 150, // posición vertical inicial (sobre el suelo)
        width: 40,
        height: 40,
        color: "green",
        isJumping: false,
        velocityY: 0, // velocidad vertical
        jumpStrength: 12,
        gravity: 0.6,
    };
}

// Configuración de los obstáculos y dificultad
let obstacles = [];
const initialObstacleSpeed = 5; // velocidad inicial de obstáculos
let obstacleSpeed = initialObstacleSpeed;
const initialSpawnInterval = 1500; // ms entre obstáculos al inicio
let spawnInterval = initialSpawnInterval;
let lastSpawnTime = 0; // timestamp del último spawn
let lastDifficultyIncrease = 0; // marcador para controlar subidas de dificultad
const difficultyStep = 20; // puntos para cada aumento de dificultad
const minSpawnInterval = 700; // límite inferior para spawnInterval

// Puntuación (se incrementa cuando un obstáculo sale por la izquierda)
let score = 0;

// Estado del juego
let running = false; // true mientras el juego corre
let gameOver = false; // true después de colisión

// Delay inicial antes de empezar (ms) — requisito: 3 segundos
const startDelay = 3000;

// Evento de teclado: saltar si el juego está en curso y el dino está en el suelo
document.addEventListener("keydown", (e) => {
    if ((e.code === "Space" || e.code === "ArrowUp") && dino.y === 150 && running) {
        dino.velocityY = -dino.jumpStrength;
        dino.isJumping = true;
    }
});

// Reiniciar estado del juego a valores iniciales sin recargar la página
function resetGame() {
    dino = createDino();
    obstacles = [];
    obstacleSpeed = initialObstacleSpeed;
    spawnInterval = initialSpawnInterval;
    lastSpawnTime = 0;
    lastDifficultyIncrease = 0;
    score = 0;
    running = false;
    gameOver = false;
    overlay.classList.add("hidden");
    updateScoreDisplay();
}

// Actualizar física del dinosaurio: gravedad y posición vertical
function updateDino() {
    dino.velocityY += dino.gravity;
    dino.y += dino.velocityY;

    // Mantener en el suelo y resetear estado de salto
    if (dino.y > 150) {
        dino.y = 150;
        dino.velocityY = 0;
        dino.isJumping = false;
    }
}

// Generar obstáculos periódicamente; no genera si el juego no está en ejecución
function spawnObstacle() {
    if (!running) return;
    const now = Date.now();
    if (lastSpawnTime === 0) lastSpawnTime = now; // asegurar que el primer spawn respete spawnInterval
    if (now - lastSpawnTime > spawnInterval) {
        obstacles.push({
            x: canvas.width,
            y: 150,
            width: 20,
            height: 40,
            color: "brown",
        });
        lastSpawnTime = now;
    }
}

// Mover obstáculos y aumentar puntuación cuando se salen del canvas
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacleSpeed;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++; // gana punto por cada obstáculo esquivado
            updateScoreDisplay();
        }
    }

    // Aumentar dificultad de forma escalonada según la puntuación
    while (score - lastDifficultyIncrease >= difficultyStep) {
        obstacleSpeed += 0.15;
        spawnInterval = Math.max(minSpawnInterval, spawnInterval - 75);
        lastDifficultyIncrease += difficultyStep;
    }
}

// Detectar colisiones entre jugador y cualquier obstáculo
function checkCollision() {
    for (let obstacle of obstacles) {
        if (
            dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y
        ) {
            endGame(); // manejar fin de partida sin recargar la página
        }
    }
}

// Dibujar todos los elementos del juego en el canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Jugador
    ctx.fillStyle = dino.color;
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

    // Obstáculos
    for (let obstacle of obstacles) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // Puntuación en el canvas (complemento del HUD)
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Puntuación: " + score, 10, 30);
}

// Actualizar texto del HUD con la puntuación actual
function updateScoreDisplay() {
    scoreDisplay.textContent = `Puntuación: ${score}`;
}

// Manejo de fin de juego: mostrar overlay, enviar score y actualizar scoreboard
function endGame() {
    if (gameOver) return;
    gameOver = true;
    running = false;
    finalScore.textContent = `Puntuación: ${score}`;
    overlay.classList.remove("hidden");
    // Intentar enviar la puntuación al servidor; si falla, igualmente actualizamos visualmente
    submitScore(score).then(fetchScores).catch(() => fetchScores());
}

// Bucle principal: si `running` está activo actualiza la lógica, siempre dibuja
function gameLoop() {
    if (running) {
        updateDino();
        spawnObstacle();
        updateObstacles();
        checkCollision();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar el juego después de un delay visual de 3 segundos (countdown)
function startWithDelay() {
    resetGame();
    let remaining = startDelay / 1000;
    countdownEl.textContent = `Comienza en ${remaining}...`;
    let interval = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
            countdownEl.textContent = `Comienza en ${remaining}...`;
        } else {
            clearInterval(interval);
            countdownEl.textContent = "";
            running = true;
            lastSpawnTime = Date.now(); // marcar inicio para spawn
        }
    }, 1000);
}

// Reiniciar al hacer clic en el botón de overlay
restartBtn.addEventListener("click", () => {
    startWithDelay();
});

// Enviar la puntuación al servidor usando la API POST /scores
async function submitScore(value) {
    try {
        await fetch('/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: value, time: Date.now() })
        });
    } catch (e) {
        console.warn('No se pudo enviar score al servidor', e);
    }
}

// Obtener la lista de puntuaciones ordenadas desde el servidor
async function fetchScores() {
    try {
        const res = await fetch('/scores');
        if (!res.ok) throw new Error('No hay respuesta');
        const data = await res.json();
        renderScoreboard(data);
    } catch (e) {
        console.warn('No se pudo obtener scoreboard', e);
        scoreboardList.innerHTML = '';
    }
}

// Renderizar la lista en el overlay (Top 10)
function renderScoreboard(list) {
    scoreboardList.innerHTML = '';
    list.slice(0, 10).forEach(item => {
        const li = document.createElement('li');
        const date = new Date(item.time).toLocaleString();
        li.textContent = `${item.score} — ${date}`;
        scoreboardList.appendChild(li);
    });
}

// Iniciar bucle y arrancar con el delay inicial
gameLoop();
startWithDelay();
