// Juego del dinosaurio
// Explicación: Controlas a un dinosaurio que corre y salta para evitar obstáculos.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverBox = document.getElementById("gameOverBox");
const finalScore = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");

const dinoFrames = [];
const dinoFrame1 = new Image();
dinoFrame1.src = "images/Capybara/CapybaraRun-1.png";
const dinoFrame2 = new Image();
dinoFrame2.src = "images/Capybara/CapybaraRun-2.png";
dinoFrames.push(dinoFrame1, dinoFrame2);

let currentDinoFrame = 0;
let lastFrameChange = 0;
const frameDuration = 120;

// Tipos de obstáculos. Cada tipo define su sprite, animación, tamaño y hitbox.
// frames=1 → imagen estática. frames>1 → sprite sheet horizontal.
// hitbox aquí está expresada como FRACCIÓN del sprite (0..1).
// Al spawnear se convierte a píxeles según width/height, así que si cambias
// el tamaño del sprite, la hitbox escala proporcionalmente sola.
const obstacleTypes = [
    {
        name: "tronco",
        src: "images/Obstaculos/Tronco.png",
        frames: 1,
        frameDuration: 0,
        width: 90,
        height: 90,
        yOffset: -12,
        hitbox: { left: 0.333, right: 0.333, top: 0.267, bottom: 0.022 },
    },
    {
        name: "hongo",
        src: "images/Obstaculos/Mushroom-Idle.png",
        frames: 7,
        frameDuration: 120,
        width: 150,
        height: 120,
        hitbox: { left: 0.42, right: 0.42, top: 0.6, bottom: 0.05 },
    },
    {
        name: "volador",
        src: "images/Obstaculos/FlyObstacle-Idle.png",
        frames: 8,
        frameDuration: 90,
        width: 100,
        height: 100,
        // yOffset: píxeles por encima del suelo. 0 = apoyado en el suelo.
        // Lo elevamos para que el capybara pase por debajo corriendo y solo lo golpee al saltar.
        yOffset: 120,
        hitbox: { left: 0.15, right: 0.15, top: 0.1, bottom: 0.1 },
    },
];

// Precargar imágenes de cada tipo.
for (const type of obstacleTypes) {
    type.img = new Image();
    type.img.src = type.src;
}

// Ajustes del lienzo
canvas.width = 800;
canvas.height = 400;

// Escenas de cielo de fondo. Cada escena es una lista de capas (1.png..N.png) en
// orden de posición: 1 = más atrás, N = más al frente. Se rota a la siguiente
// escena cada SCENE_DURATION_MS.
const SCENE_DURATION_MS = 15000;
const SCENE_FADE_MS = 1800;
const sceneDefs = [
    { folder: "Clouds 1", layers: 4 },
    { folder: "Clouds 2", layers: 4 },
    { folder: "Clouds 3", layers: 4 },
    { folder: "Clouds 4", layers: 4 },
    { folder: "Clouds 5", layers: 5 },
    { folder: "Clouds 6", layers: 6 },
    { folder: "Clouds 7", layers: 4 },
    { folder: "Clouds 8", layers: 6 },
];
const scenes = sceneDefs.map((def) => {
    const imgs = [];
    for (let i = 1; i <= def.layers; i++) {
        const img = new Image();
        img.src = `images/Fondo/${def.folder}/${i}.png`;
        imgs.push(img);
    }
    return imgs;
});
let currentScene = 0;
let nextScene = null;          // índice de la próxima escena durante el fade
let lastSceneChange = Date.now();
let fadeStart = 0;             // ms en el que inició el fade actual

// Y del suelo: borde inferior donde se apoyan los sprites.
const GROUND_Y = canvas.height - 70;

// Tile del suelo (cesped + tierra). Se croppea la parte visible del PNG (1080x1080)
// y se repite horizontalmente bajo GROUND_Y.
const groundImg = new Image();
groundImg.src = "images/Base/Base.png";
const GROUND_SRC = { x: 53, y: 380, w: 994, h: 322 }; // bbox del contenido visible
const GROUND_TILE_H = canvas.height - GROUND_Y; // alto en pantalla
const GROUND_TILE_W = Math.round(GROUND_TILE_H * GROUND_SRC.w / GROUND_SRC.h);
// Pixeles extra para bajar visualmente al capybara (su PNG tiene aire arriba).
const DINO_FLOOR_OFFSET = 40;
const DINO_FLOOR_Y = GROUND_Y - 170 + DINO_FLOOR_OFFSET;

// Modo debug: muestra las hitboxes en pantalla. Alternar con la tecla "H".
let showHitboxes = true;

// Configuración del dinosaurio
// hitbox: offset relativo al sprite + tamaño. Si lo cambias, se actualiza
// tanto la colisión como el rectángulo visual de debug.
let dino = {
    x: 50,
    y: DINO_FLOOR_Y,
    width: 140,
    height: 140,
    color: "green",
    isJumping: false,
    velocityY: 0,
    jumpStrength: 14,
    gravity: 0.6,
    // Hitbox definida por insets desde cada lado del sprite (en píxeles).
    // Subir 'top' encoge la parte superior; subir 'bottom' encoge la inferior, etc.
    hitbox: { left: 30, right: 30, top: 63, bottom: 13 },
};

// Devuelve el rectángulo de hitbox absoluto de una entidad a partir de sus insets.
function getHitbox(entity) {
    const hb = entity.hitbox || { left: 0, right: 0, top: 0, bottom: 0 };
    return {
        x: entity.x + hb.left,
        y: entity.y + hb.top,
        width: entity.width - hb.left - hb.right,
        height: entity.height - hb.top - hb.bottom,
    };
}

// Configuración de los obstáculos
let obstacles = [];
let obstacleSpeed = 5; // velocidad en píxeles por frame
let lastSpawnTime = 0; // Tiempo del último obstáculo
let nextSpawnDelay = 1500; // Delay aleatorio para el próximo obstáculo (ms)

// Calcula un delay aleatorio para el próximo spawn.
// El rango se reduce con el score, manteniendo un piso jugable.
function rollNextSpawnDelay() {
    const minGap = Math.max(550, 1000 - score * 4);
    const maxGap = Math.max(1100, 2000 - score * 7);
    return minGap + Math.random() * (maxGap - minGap);
}

// Puntuación
let score = 0;
let gameOver = false;

restartButton.addEventListener("click", () => {
    document.location.reload();
});

// Evento: saltar con la barra espaciadora
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && dino.y === DINO_FLOOR_Y) {
        dino.velocityY = -dino.jumpStrength;
        dino.isJumping = true;
    }
    if (e.code === "KeyH") {
        showHitboxes = !showHitboxes;
    }
});

// Dibuja el contorno de una hitbox para verificar visualmente sus dimensiones.
function drawHitbox(entity, color) {
    const hb = getHitbox(entity);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
}

// Función para actualizar la posición del dinosaurio
function updateDino() {
    // Aplicar gravedad y velocidad vertical para un salto
    dino.velocityY += dino.gravity;
    dino.y += dino.velocityY;

    // Evitar que el dinosaurio caiga por debajo del suelo
    if (dino.y > DINO_FLOOR_Y) {
        dino.y = DINO_FLOOR_Y;
        dino.velocityY = 0;
        dino.isJumping = false;
    }
}

// Cola de spawns programados (para parejas suelo+volador cercanas).
const pendingSpawns = [];

// Score mínimo para que aparezcan obstáculos voladores.
const VOLADOR_MIN_SCORE = 20;

// Pesos relativos. Suelo dominante; el volador solo entra tras VOLADOR_MIN_SCORE.
const obstacleWeights = { tronco: 2.2, hongo: 2.2, volador: 1 };

function pickRandomType() {
    const pool = obstacleTypes.filter((t) => t.name !== "volador" || score >= VOLADOR_MIN_SCORE);
    const total = pool.reduce((s, t) => s + (obstacleWeights[t.name] || 1), 0);
    let r = Math.random() * total;
    for (const t of pool) {
        r -= obstacleWeights[t.name] || 1;
        if (r <= 0) return t;
    }
    return pool[0];
}

function pushObstacle(type, now) {
    const hb = {
        left: type.hitbox.left * type.width,
        right: type.hitbox.right * type.width,
        top: type.hitbox.top * type.height,
        bottom: type.hitbox.bottom * type.height,
    };
    const yOffset = type.yOffset || 0;
    obstacles.push({
        x: canvas.width,
        y: GROUND_Y - type.height - yOffset,
        width: type.width,
        height: type.height,
        color: "brown",
        hitbox: hb,
        type,
        frame: 0,
        lastFrameChange: now,
    });
}

// Función para generar obstáculos
function spawnObstacle() {
    const now = Date.now();

    // Spawns programados (parejas suelo+volador).
    for (let i = pendingSpawns.length - 1; i >= 0; i--) {
        if (now >= pendingSpawns[i].time) {
            pushObstacle(pendingSpawns[i].type, now);
            pendingSpawns.splice(i, 1);
        }
    }

    if (now - lastSpawnTime > nextSpawnDelay) {
        const type = pickRandomType();
        pushObstacle(type, now);
        lastSpawnTime = now;
        nextSpawnDelay = rollNextSpawnDelay();

        // Si fue un obstáculo de suelo, ~45% de probabilidad de encadenar un
        // volador "cerca" (no a la par) para crear momentos exigentes.
        if (type.name !== "volador" && score >= VOLADOR_MIN_SCORE && Math.random() < 0.45) {
            const flyType = obstacleTypes.find((t) => t.name === "volador");
            if (flyType) {
                const delay = 380 + Math.random() * 260; // 380-640ms después
                pendingSpawns.push({ time: now + delay, type: flyType });
            }
        }
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
    // Velocidad sube de forma continua con el score (con techo).
    obstacleSpeed = Math.min(11, 5 + score * 0.05);
}

// Función para detectar colisiones (usa hitbox, no el sprite completo)
function checkCollision() {
    const d = getHitbox(dino);
    for (let obstacle of obstacles) {
        const o = getHitbox(obstacle);
        if (
            d.x < o.x + o.width &&
            d.x + d.width > o.x &&
            d.y < o.y + o.height &&
            d.y + d.height > o.y
        ) {
            gameOver = true;
            finalScore.textContent = "Puntuacion: " + score;
            gameOverBox.classList.remove("hidden");
            return;
        }
    }
}

// Función para dibujar el juego
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el lienzo

    // Rotación de escena con crossfade.
    const nowScene = Date.now();
    if (nextScene === null && nowScene - lastSceneChange >= SCENE_DURATION_MS) {
        nextScene = (currentScene + 1) % scenes.length;
        fadeStart = nowScene;
    }
    function drawScene(idx, alpha) {
        ctx.globalAlpha = alpha;
        for (const layer of scenes[idx]) {
            if (layer.complete && layer.naturalWidth > 0) {
                ctx.drawImage(layer, 0, 0, canvas.width, canvas.height);
            }
        }
        ctx.globalAlpha = 1;
    }
    if (nextScene !== null) {
        const t = Math.min(1, (nowScene - fadeStart) / SCENE_FADE_MS);
        drawScene(currentScene, 1 - t);
        drawScene(nextScene, t);
        if (t >= 1) {
            currentScene = nextScene;
            nextScene = null;
            lastSceneChange = nowScene;
        }
    } else {
        drawScene(currentScene, 1);
    }

    // Suelo: tile de Base.png repetido horizontalmente bajo GROUND_Y.
    // Overlap horizontal/vertical para evitar costuras transparentes entre tiles.
    if (groundImg.complete && groundImg.naturalWidth > 0) {
        const overlapX = 18;
        const overlapY = 12;
        const step = GROUND_TILE_W - overlapX;
        const drawY = GROUND_Y - 2;
        const drawH = canvas.height - drawY + overlapY;
        for (let x = -overlapX; x < canvas.width; x += step) {
            ctx.drawImage(
                groundImg,
                GROUND_SRC.x, GROUND_SRC.y, GROUND_SRC.w, GROUND_SRC.h,
                x, drawY, GROUND_TILE_W, drawH
            );
        }
    }

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

    // Dibujar los obstáculos (animados si el tipo tiene varios frames)
    const nowDraw = Date.now();
    for (let obstacle of obstacles) {
        const type = obstacle.type;
        if (type && type.frames > 1 && type.frameDuration > 0) {
            if (nowDraw - obstacle.lastFrameChange >= type.frameDuration) {
                obstacle.frame = (obstacle.frame + 1) % type.frames;
                obstacle.lastFrameChange = nowDraw;
            }
        }
        const img = type ? type.img : null;
        if (img && img.complete && img.naturalWidth > 0) {
            if (type.frames > 1) {
                const fw = img.naturalWidth / type.frames;
                const fh = img.naturalHeight;
                ctx.drawImage(img, obstacle.frame * fw, 0, fw, fh, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else {
                ctx.drawImage(img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        } else {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }

    // Dibujar hitboxes en modo debug
    if (showHitboxes) {
        drawHitbox(dino, "lime");
        for (let obstacle of obstacles) {
            drawHitbox(obstacle, "red");
        }
    }

    // Dibujar la puntuación
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Puntuación: " + score, 10, 30);
    if (showHitboxes) {
        ctx.fillText("Hitboxes ON (H para alternar)", 10, 55);
    }
}

// Bucle del juego
function gameLoop() {
    if (gameOver) {
        return;
    }

    updateDino();
    spawnObstacle();
    updateObstacles();
    checkCollision();
    draw();
    requestAnimationFrame(gameLoop); // Llamar al siguiente frame
}

// Iniciar el juego
gameLoop();