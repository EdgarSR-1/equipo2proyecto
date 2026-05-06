// Juego del dinosaurio
// Explicación: Controlas a un capibara que corre y salta para evitar obstáculos.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const finalScore = document.getElementById("finalScore");
const restartButton = document.getElementById("restartBtn") || document.getElementById("restartButton");
const scoreDisplay = document.getElementById("scoreDisplay");
const countdownEl = document.getElementById("countdown");

const dinoFrames = [];
const dinoFrame1 = new Image();
dinoFrame1.src = "images/Capybara/CapybaraRun-1.png";
const dinoFrame2 = new Image();
dinoFrame2.src = "images/Capybara/CapybaraRun-2.png";
dinoFrames.push(dinoFrame1, dinoFrame2);

let currentDinoFrame = 0;
let lastFrameChange = 0;
const frameDuration = 120;

const obstacleImg = new Image();
obstacleImg.src = "images/Capybara/CapybaraRun-1.png";

// Ajustes del lienzo
canvas.width = 800;
canvas.height = 400;

// Configuración del personaje
function createDino() {
    return {
        x: 50,
        y: 150,
        width: 90,
        height: 90,
        color: "green",
        isJumping: false,
        velocityY: 0,
        jumpStrength: 12,
        gravity: 0.6,
    };
}

let dino = createDino();

// Configuración de los obstáculos
let obstacles = [];                         // Lista de obstáculos activos
const initialObstacleSpeed = 5;             // Velocidad en pixeles por frame al inicio
let obstacleSpeed = initialObstacleSpeed;   // Velocidad actual de los obstáculos (aumenta con la puntuación)
const initialSpawnInterval = 1500;          // Tiempo en ms entre spawns de obstáculos al inicio
let spawnInterval = initialSpawnInterval;   // Tiempo actual entre spawns (disminuye con la puntuación)
let lastSpawnTime = 0;                      // Tiempo desde último spawn de obstáculo
let lastDifficultyIncrease = 0;             // Puntuación en la que se hizo el último aumento de dificultad
const difficultyStep = 20;                  // Puntos necesarios para cada aumento de dificultad
const minSpawnInterval = 700;               // Tiempo mínimo entre spawns (límite inferior para spawnInterval)

// Puntuación y estado
let score = 0;
let gameOver = false;
let running = false;
let startCountdownInterval = null;
const startDelay = 3000;

function updateScoreDisplay() {
    if (scoreDisplay) {
        scoreDisplay.textContent = `Puntuación: ${score}`;
    }
}

function hideOverlay() {
    if (overlay) {
        overlay.classList.add("hidden");
    }
}

function showOverlay() {
    if (overlay) {
        overlay.classList.remove("hidden");
    }
}

async function submitScore(value) {
    try {
        await fetch("/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score: value, time: Date.now() }),
        });
    } catch (e) {
        console.warn("No se pudo enviar score al servidor", e);
    }
}

function resetGame() {
    dino = createDino();
    obstacles = [];
    obstacleSpeed = initialObstacleSpeed;
    spawnInterval = initialSpawnInterval;
    lastSpawnTime = 0;
    lastDifficultyIncrease = 0;
    score = 0;
    gameOver = false;
    running = false;
    updateScoreDisplay();
    finalScore.textContent = "Puntuación: 0";
    hideOverlay();
    if (startCountdownInterval) {
        clearInterval(startCountdownInterval);
        startCountdownInterval = null;
    }
}

function startWithDelay() {
    resetGame();
    let remaining = startDelay / 1000;
    if (countdownEl) {
        countdownEl.textContent = `Comienza en ${remaining}...`;
    }
    startCountdownInterval = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
            if (countdownEl) {
                countdownEl.textContent = `Comienza en ${remaining}...`;
            }
            return;
        }

        clearInterval(startCountdownInterval);
        startCountdownInterval = null;
        if (countdownEl) {
            countdownEl.textContent = "";
        }
        running = true;
        lastSpawnTime = Date.now();
    }, 1000);
}

restartButton?.addEventListener("click", () => {
    startWithDelay();
});

// Evento: saltar con la barra espaciadora o flecha arriba
document.addEventListener("keydown", (e) => {
    if ((e.code === "Space" || e.code === "ArrowUp") && running && dino.y === 150) {
        dino.velocityY = -dino.jumpStrength;
        dino.isJumping = true;
    }
});

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
    const now = Date.now();
    if (lastSpawnTime === 0) {
        lastSpawnTime = now;
    }
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
        obstacles[i].x -= obstacleSpeed;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;            // Incrementar puntuación por cada obstáculo que se sale
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
            if (gameOver) return;
            gameOver = true;
            running = false;
            finalScore.textContent = `Puntuación: ${score}`;
            showOverlay();
            return;
        }
    }
}

// Función para dibujar el juego
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el lienzo

    const now = Date.now();
    if (now - lastFrameChange >= frameDuration) {
        currentDinoFrame = (currentDinoFrame + 1) % dinoFrames.length;
        lastFrameChange = now;
    }

    const activeDinoFrame = dinoFrames[currentDinoFrame];

    // Dibujar el dinosaurio
    if (activeDinoFrame.complete && activeDinoFrame.naturalWidth > 0) {
        ctx.drawImage(activeDinoFrame, dino.x, dino.y, dino.width, dino.height);
    } else {
        ctx.fillStyle = dino.color;
        ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    }

    // Dibujar los obstáculos
    for (let obstacle of obstacles) {
        if (obstacleImg.complete && obstacleImg.naturalWidth > 0) {
            ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }

    // Dibujar la puntuación
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Puntuación: ${score}`, 10, 30);
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

updateScoreDisplay();
gameLoop();
startWithDelay();
fetchScores();