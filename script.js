// Juego del dinosaurio
// Explicación: Controlas a un dinosaurio que corre y salta para evitar obstáculos.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajustes del lienzo
canvas.width = 800;
canvas.height = 200;

// Configuración del dinosaurio
let dino = {
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

// Configuración de los obstáculos
let obstacles = [];
let obstacleSpeed = 5; // velocidad en píxeles por frame
let spawnInterval = 1500; // Tiempo entre obstáculos (ms)
let lastSpawnTime = 0; // Tiempo del último obstáculo
let lastDifficultyIncrease = 0; // Puntos en los que se aplicó la última subida
const difficultyStep = 20; // Subir dificultad cada x puntos
const minSpawnInterval = 700; // Límite inferior para spawnInterval

// Puntuación
let score = 0;

// Evento: saltar con la barra espaciadora
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && dino.y === 150) {
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
    const now = Date.now(); // Verificar si es hora de generar un nuevo obstáculo
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
            alert("¡Game Over! Puntuación: " + score);
            document.location.reload(); // Reiniciar el juego
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

    // Dibujar la puntuación
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Puntuación: " + score, 10, 30);
}

// Bucle del juego
function gameLoop() {
    updateDino();
    spawnObstacle();
    updateObstacles();
    checkCollision();
    draw();
    requestAnimationFrame(gameLoop); // Llamar al siguiente frame
}

// Iniciar el juego
gameLoop();