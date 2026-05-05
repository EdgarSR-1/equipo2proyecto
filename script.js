// Juego del dinosaurio
// Explicación: Controlas a un dinosaurio que corre y salta para evitar obstáculos.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajustes del lienzo
canvas.width = 800;
canvas.height = 200;

// Elementos UI
const scoreDisplay = document.getElementById("scoreDisplay");
const overlay = document.getElementById("overlay");
const finalScore = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const countdownEl = document.getElementById("countdown");
const scoreboardList = document.getElementById("scoreboardList");

// Configuración del dinosaurio
let dino = createDino();
function createDino() {
    return {
        x: 50,
        y: 150,
        width: 40,
        height: 40,
        color: "green",
        isJumping: false,
        velocityY: 0,
        jumpStrength: 12,
        gravity: 0.6,
    };
}

// Configuración de los obstáculos
let obstacles = [];
const initialObstacleSpeed = 5; // velocidad en píxeles por frame
let obstacleSpeed = initialObstacleSpeed;
const initialSpawnInterval = 1500; // Tiempo entre obstáculos (ms)
let spawnInterval = initialSpawnInterval;
let lastSpawnTime = 0; // Tiempo del último obstáculo
let lastDifficultyIncrease = 0; // Puntos en los que se aplicó la última subida
const difficultyStep = 20; // Subir dificultad cada x puntos
const minSpawnInterval = 700; // Límite inferior para spawnInterval

// Puntuación
let score = 0;

// Estado del juego
let running = false;
let gameOver = false;

// Delay inicial antes de empezar (ms)
const startDelay = 3000;

// Evento: saltar con la barra espaciadora
document.addEventListener("keydown", (e) => {
    if ((e.code === "Space" || e.code === "ArrowUp") && dino.y === 150 && running) {
        dino.velocityY = -dino.jumpStrength;
        dino.isJumping = true;
    }
});

// Reiniciar estado del juego a valores iniciales
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

// Función para actualizar la posición del dinosaurio
function updateDino() {
    // Aplicar gravedad y velocidad vertical para un salto
    dino.velocityY += dino.gravity;
    dino.y += dino.velocityY;

    // Evitar que el dinosaurio caiga por debajo del suelo
    if (dino.y > 150) {
        dino.y = 150;
        dino.velocityY = 0;
        dino.isJumping = false;
    }
}

// Función para generar obstáculos
function spawnObstacle() {
    if (!running) return;
    const now = Date.now(); // Verificar si es hora de generar un nuevo obstáculo
    if (lastSpawnTime === 0) lastSpawnTime = now; // asegurar que el primer spawn espera spawnInterval
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

// Función para actualizar la posición de los obstáculos
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacleSpeed; // Mover a la izquierda
        // Eliminar obstáculos que han salido del canvas
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++; // Incrementar puntuación por cada obstáculo evitado
            updateScoreDisplay();
        }
    }

    // dificultad: aumentar velocidad y frecuencia de obstáculos cada cierto puntaje
    while (score - lastDifficultyIncrease >= difficultyStep) { // si la puntuación ha superado el último paso de dificultad
        obstacleSpeed += 0.15;
        spawnInterval = Math.max(minSpawnInterval, spawnInterval - 75); // reducir spawn menos agresivamente
        lastDifficultyIncrease += difficultyStep;
    }
}

// Función para detectar colisiones
function checkCollision() {
    for (let obstacle of obstacles) { // for of para iterar sobre cada obstáculo
        if (
            dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y
        ) {
            endGame();
        }
    }
}

// Función para dibujar el juego
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el lienzo

    // Dibujar el dinosaurio
    ctx.fillStyle = dino.color;
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

    // Dibujar los obstáculos
    for (let obstacle of obstacles) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // Dibujar la puntuación en canvas (además del HUD)
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Puntuación: " + score, 10, 30);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Puntuación: ${score}`;
}

// Manejo de fin del juego
function endGame() {
    if (gameOver) return;
    gameOver = true;
    running = false;
    finalScore.textContent = `Puntuación: ${score}`;
    overlay.classList.remove("hidden");
    // enviar score al servidor y actualizar scoreboard
    submitScore(score).then(fetchScores).catch(() => fetchScores());
}

// Bucle del juego
function gameLoop() {
    if (running) {
        updateDino();
        spawnObstacle();
        updateObstacles();
        checkCollision();
    }
    draw();
    requestAnimationFrame(gameLoop); // Llamar al siguiente frame
}

// Iniciar el juego con delay y contador visual
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
            lastSpawnTime = Date.now();
        }
    }, 1000);
}

restartBtn.addEventListener("click", () => {
    startWithDelay();
});

// Scoreboard: comunicación con servidor
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

async function fetchScores() {
    try {
        const res = await fetch('/scores');
        if (!res.ok) throw new Error('No hay respuesta');
        const data = await res.json();
        renderScoreboard(data);
    } catch (e) {
        console.warn('No se pudo obtener scoreboard', e);
        // fallback: limpiar lista
        scoreboardList.innerHTML = '';
    }
}

function renderScoreboard(list) {
    scoreboardList.innerHTML = '';
    list.slice(0, 10).forEach(item => {
        const li = document.createElement('li');
        const date = new Date(item.time).toLocaleString();
        li.textContent = `${item.score} — ${date}`;
        scoreboardList.appendChild(li);
    });
}

// Start the loop and initial delayed start
gameLoop();
startWithDelay();
