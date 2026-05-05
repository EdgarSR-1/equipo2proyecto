// Juego del dinosaurio
// Explicación: Controlas a un dinosaurio que corre y salta para evitar obstáculos.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajustes del lienzo
canvas.width = 800;
canvas.height = 200;

//Música de fondo
const bgMusic = new Audio("musica.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.muted = true;


// Sonido de salto
const jumpSound = new Audio("salto.mp3");
jumpSound.volume = 0.5;

// Sonido de colisión
const hitSound = new Audio("colision.mp3");
hitSound.volume = 0.7;

bgMusic.play();

// Luego cuando el usuario presione cualquier tecla:
document.addEventListener("keydown", () => {
    bgMusic.muted = false;
}, { once: true });

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

//Sonido de salto
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && dino.y === 150) {
        dino.velocityY = -dino.jumpStrength;
        dino.isJumping = true;

        // 🔊 Reproducir sonido de salto
        jumpSound.currentTime = 0; // reinicia el sonido si ya estaba sonando
        jumpSound.play();
    }
});

//Sonido de colisión
function checkCollision() {
    for (let obstacle of obstacles) {
        if (
            dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y
        ) {

            // 🔊 Reproducir sonido de colisión
            hitSound.currentTime = 0;
            hitSound.play();

            // ⛔ Detener música de fondo
            bgMusic.pause();

            alert("¡Game Over! Puntuación: " + score);
            document.location.reload();
        }
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
              // 🔊 Detener completamente la música
            bgMusic.pause();           // la pausa
            bgMusic.currentTime = 0;   // la regresa al inicio

            // 🔊 Sonido de colisión
            hitSound.currentTime = 0;
            hitSound.play();

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

// 🎵 Intentar reproducir automáticamente (permitido porque está en mute)
bgMusic.play().catch(() => {
    console.log("Autoplay bloqueado incluso en mute (raro)");
});

document.addEventListener("keydown", (e) => {
    // 🔊 Activar sonido en la primera interacción
    bgMusic.muted = false;

    if (e.code === "Space" && dino.y === 150) {
        dino.velocityY = -dino.jumpStrength;
        dino.isJumping = true;

        jumpSound.currentTime = 0;
        jumpSound.play();
    }
});

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