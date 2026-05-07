// Juego del dinosaurio
// Explicación: Controlas a un dinosaurio que corre y salta para evitar obstáculos.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// antialiasing nearest-neighbor en canvas
if (ctx) {
    ctx.imageSmoothingEnabled = false;
    try { ctx.imageSmoothingQuality = 'low'; } catch (_) {}
}
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


//Música de fondo
const bgMusic = new Audio("musica.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;


// Sonido de salto
const jumpSound = new Audio("salto.mp3");
jumpSound.volume = 0.5;

// Sonido de colisión
const hitSound = new Audio("colision.mp3");
hitSound.volume = 0.7;


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
let showHitboxes = false;

// Desplazamiento horizontal acumulado del suelo, para que se sienta en movimiento.
let groundOffset = 0;

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

// HUD y mejor puntuacion persistente
const hudScoreEl = document.getElementById("hudScore");
const hudBestEl = document.getElementById("hudBest");
const finalBestEl = document.getElementById("finalBest");
const btnHitbox = document.getElementById("btnHitbox");
const btnMenu = document.getElementById("btnMenu");
const backToMenuButton = document.getElementById("backToMenuButton");

let bestScore = 0;
try {
    const saved = parseInt(localStorage.getItem("capybaraBest") || "0", 10);
    if (!Number.isNaN(saved)) bestScore = saved;
} catch (_) {}
if (hudBestEl) hudBestEl.textContent = String(bestScore);

let lastShownScore = -1;
function updateHUD() {
    if (!hudScoreEl) return;
    if (score !== lastShownScore) {
        hudScoreEl.textContent = String(score);
        hudScoreEl.classList.remove("bump");
        // forzar reflow para reiniciar animacion
        void hudScoreEl.offsetWidth;
        hudScoreEl.classList.add("bump");
        lastShownScore = score;
        if (score > bestScore) {
            bestScore = score;
            if (hudBestEl) hudBestEl.textContent = String(bestScore);
            try { localStorage.setItem("capybaraBest", String(bestScore)); } catch (_) {}
        }
    }
}

function resetGame() {
    score = 0;
    obstacles.length = 0;
    pendingSpawns.length = 0;
    obstacleSpeed = 5;
    lastSpawnTime = Date.now();
    nextSpawnDelay = 1500;
    dino.y = DINO_FLOOR_Y;
    dino.velocityY = 0;
    dino.isJumping = false;
    currentScene = 0;
    nextScene = null;
    lastSceneChange = Date.now();
    fadeStart = 0;
    groundOffset = 0;
    lastShownScore = -1;
    gameOver = false;
    gameOverBox.classList.add("hidden");
    if (hudScoreEl) hudScoreEl.textContent = "0";
    // Reproducir música de fondo
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
    gameLoop();
}

restartButton.addEventListener("click", resetGame);

if (backToMenuButton) {
    backToMenuButton.addEventListener("click", () => goToMenu());
}

if (btnHitbox) {
    btnHitbox.addEventListener("click", () => {
        showHitboxes = !showHitboxes;
        btnHitbox.classList.toggle("is-active", showHitboxes);
    });
}

if (btnMenu) {
    btnMenu.addEventListener("click", () => goToMenu());
}

// Evento: saltar con la barra espaciadora
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && dino.y === DINO_FLOOR_Y) {
        dino.velocityY = -dino.jumpStrength;
        dino.isJumping = true;
        // Reproducir sonido de salto
        jumpSound.currentTime = 0;
        jumpSound.play().catch(() => {});
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
            // Reproducir sonido de colisión
            hitSound.currentTime = 0;
            hitSound.play().catch(() => {});
            // Detener música de fondo
            bgMusic.pause();
            saveScoreToBoard(score);
            finalScore.textContent = "Puntuacion: " + score;
            if (finalBestEl) finalBestEl.textContent = "Mejor: " + bestScore;
            gameOverBox.classList.remove("hidden");
            return;
        }
    }
}

// Función para dibujar el juego
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el lienzo
    // Asegurar nearest-neighbor justo antes de dibujar (evita que algún
    // cambio previo reactive que se vea borroso)
    if (ctx) {
        ctx.imageSmoothingEnabled = false;
        try { ctx.imageSmoothingQuality = 'low'; } catch (_) {}
    }

    // Rotación de escena con crossfade.
    const nowScene = Date.now();
    if (nextScene === null && nowScene - lastSceneChange >= SCENE_DURATION_MS) {
        nextScene = (currentScene + 1) % scenes.length;
        fadeStart = nowScene;
    }
    const sceneTime = nowScene / 1000; // segundos
    function drawScene(idx, alpha) {
        ctx.globalAlpha = alpha;
        const layers = scenes[idx];
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (!(layer.complete && layer.naturalWidth > 0)) continue;
            // Parallax: capas traseras (i bajo) lentas, frontales rapidas.
            const speed = 8 + i * 16; // px/s
            const offset = Math.round((sceneTime * speed) % canvas.width);
            ctx.drawImage(layer, -offset, 0, canvas.width, canvas.height);
            ctx.drawImage(layer, canvas.width - offset, 0, canvas.width, canvas.height);
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
        groundOffset = (groundOffset + obstacleSpeed) % step;
        for (let x = -overlapX - groundOffset; x < canvas.width; x += step) {
            ctx.drawImage(
                groundImg,
                GROUND_SRC.x, GROUND_SRC.y, GROUND_SRC.w, GROUND_SRC.h,
                Math.round(x), Math.round(drawY), Math.round(GROUND_TILE_W), Math.round(drawH)
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
        ctx.drawImage(
            activeDinoFrame,
            Math.round(dino.x), Math.round(dino.y), Math.round(dino.width), Math.round(dino.height)
        );
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
                ctx.drawImage(
                    img,
                    Math.round(obstacle.frame * fw), 0, Math.round(fw), Math.round(fh),
                    Math.round(obstacle.x), Math.round(obstacle.y), Math.round(obstacle.width), Math.round(obstacle.height)
                );
            } else {
                ctx.drawImage(
                    img,
                    Math.round(obstacle.x), Math.round(obstacle.y), Math.round(obstacle.width), Math.round(obstacle.height)
                );
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

    // Score se muestra via HUD HTML
    updateHUD();
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

// ---------- Menú inicial ----------
const startMenu = document.getElementById("startMenu");
const gameScreen = document.getElementById("gameScreen");
const btnStart = document.getElementById("btnStart");
const btnInstructions = document.getElementById("btnInstructions");
const btnCredits = document.getElementById("btnCredits");
const instructionsModal = document.getElementById("instructionsModal");
const creditsModal = document.getElementById("creditsModal");
const scoreboardModal = document.getElementById("scoreboardModal");
const scoreboardList = document.getElementById("scoreboardList");
const scoreboardEmpty = document.getElementById("scoreboardEmpty");
const btnScoreboard = document.getElementById("btnScoreboard");

const SCOREBOARD_KEY = "capybaraTop5";
const SCOREBOARD_MAX = 5;

function loadScoreboard() {
    try {
        const raw = localStorage.getItem(SCOREBOARD_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((n) => parseInt(n, 10))
            .filter((n) => Number.isFinite(n) && n > 0)
            .sort((a, b) => b - a)
            .slice(0, SCOREBOARD_MAX);
    } catch (_) {
        return [];
    }
}

function saveScoreToBoard(value) {
    if (!Number.isFinite(value) || value <= 0) return;
    const board = loadScoreboard();
    board.push(value);
    board.sort((a, b) => b - a);
    const top = board.slice(0, SCOREBOARD_MAX);
    try { localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(top)); } catch (_) {}
}

function renderScoreboard() {
    if (!scoreboardList) return;
    const board = loadScoreboard();
    scoreboardList.innerHTML = "";
    if (board.length === 0) {
        if (scoreboardEmpty) scoreboardEmpty.classList.remove("hidden");
        return;
    }
    if (scoreboardEmpty) scoreboardEmpty.classList.add("hidden");
    board.forEach((value, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="sb-rank">#${idx + 1}</span><span class="sb-score">${value}</span>`;
        scoreboardList.appendChild(li);
    });
}

function showModal(modal) {
    modal.classList.remove("hidden");
}
function hideModal(modal) {
    modal.classList.add("hidden");
}

btnInstructions.addEventListener("click", () => showModal(instructionsModal));
btnCredits.addEventListener("click", () => showModal(creditsModal));
if (btnScoreboard) {
    btnScoreboard.addEventListener("click", () => {
        renderScoreboard();
        showModal(scoreboardModal);
    });
}
document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close");
        hideModal(document.getElementById(id));
    });
});
[instructionsModal, creditsModal, scoreboardModal].forEach((m) => {
    if (!m) return;
    m.addEventListener("click", (e) => {
        if (e.target === m) hideModal(m);
    });
});

const TRANSITION_MS = 1900;
let isTransitioning = false;

function goToGame() {
    if (isTransitioning) return;
    if (!startMenu.classList.contains("hidden") === false && !gameScreen.classList.contains("hidden")) return;
    isTransitioning = true;

    document.body.style.overflow = "auto";

    // Asegura ambos fondos vivos durante el cross-fade
    startGameBackground();

    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("is-entering");
    startMenu.classList.add("is-leaving");

    resetGame();

    setTimeout(() => {
        startMenu.classList.add("hidden");
        startMenu.classList.remove("is-leaving");
        gameScreen.classList.remove("is-entering");
        stopMenuBackground();
        isTransitioning = false;
    }, TRANSITION_MS);
}

function goToMenu() {
    if (isTransitioning) return;
    if (gameScreen.classList.contains("hidden")) return;
    isTransitioning = true;

    // Detiene el bucle de juego sin mostrar la caja de Game Over
    gameOver = true;
    if (gameOverBox) gameOverBox.classList.add("hidden");
    // Detener música de fondo
    bgMusic.pause();

    // Asegura el fondo del menu vivo para que aparezca con el cross-fade
    startMenuBackground();

    startMenu.classList.remove("hidden");
    startMenu.classList.add("is-entering");
    gameScreen.classList.add("is-leaving");

    setTimeout(() => {
        gameScreen.classList.add("hidden");
        gameScreen.classList.remove("is-leaving");
        startMenu.classList.remove("is-entering");
        stopGameBackground();
        // Limpia estado del juego para la proxima partida
        score = 0;
        obstacles.length = 0;
        pendingSpawns.length = 0;
        obstacleSpeed = 5;
        dino.y = DINO_FLOOR_Y;
        dino.velocityY = 0;
        dino.isJumping = false;
        if (hudScoreEl) hudScoreEl.textContent = "0";
        isTransitioning = false;
    }, TRANSITION_MS);
}

btnStart.addEventListener("click", goToGame);

// ---------- Fondo animado detras del juego (sincronizado con la escena) ----------
const gameBgCanvas = document.getElementById("gameBgCanvas");
let gameBgRafId = null;

function resizeGameBgCanvas() {
    if (!gameBgCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    gameBgCanvas.width = Math.round(w * dpr);
    gameBgCanvas.height = Math.round(h * dpr);
    gameBgCanvas.style.width = w + "px";
    gameBgCanvas.style.height = h + "px";
    const c = gameBgCanvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // para pixel art:
    if (c) {
        c.imageSmoothingEnabled = false;
        try { c.imageSmoothingQuality = 'low'; } catch (_) {}
    }
}

function drawGameBgScene(c, idx, alpha, cw, ch, t) {
    c.globalAlpha = alpha;
    // para pixel art:
    if (c) {
        c.imageSmoothingEnabled = false;
        try { c.imageSmoothingQuality = 'low'; } catch (_) {}
    }
    const layers = scenes[idx];
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (!(layer.complete && layer.naturalWidth > 0)) continue;
        const speed = 8 + i * 16; // px/s, mismas curvas que en el canvas del juego
        const ratio = layer.naturalWidth / layer.naturalHeight;
        const drawH = ch;
        const drawW = Math.max(1, drawH * ratio);
        const offset = ((t * speed) % drawW + drawW) % drawW;
        const overlap = 2;
        for (let x = -offset; x < cw; x += drawW) {
            c.drawImage(layer, x, 0, drawW + overlap, drawH);
        }
    }
    c.globalAlpha = 1;
}

function gameBgLoop() {
    if (!gameBgCanvas) return;
    const c = gameBgCanvas.getContext("2d");
    const cw = parseFloat(gameBgCanvas.style.width) || window.innerWidth;
    const ch = parseFloat(gameBgCanvas.style.height) || window.innerHeight;
    const now = performance.now();
    const t = now / 1000;
    c.clearRect(0, 0, cw, ch);

    // Reutiliza la misma rotacion de escena del juego (currentScene/nextScene/fadeStart/SCENE_FADE_MS).
    if (nextScene !== null) {
        const k = Math.min(1, (Date.now() - fadeStart) / SCENE_FADE_MS);
        drawGameBgScene(c, currentScene, 1 - k, cw, ch, t);
        drawGameBgScene(c, nextScene, k, cw, ch, t);
    } else {
        drawGameBgScene(c, currentScene, 1, cw, ch, t);
    }

    gameBgRafId = requestAnimationFrame(gameBgLoop);
}

function startGameBackground() {
    if (!gameBgCanvas) return;
    resizeGameBgCanvas();
    if (gameBgRafId === null) {
        gameBgRafId = requestAnimationFrame(gameBgLoop);
    }
}

function stopGameBackground() {
    if (gameBgRafId !== null) {
        cancelAnimationFrame(gameBgRafId);
        gameBgRafId = null;
    }
}

window.addEventListener("resize", resizeGameBgCanvas);

// ---------- Fondo animado del menu inicial ----------
const menuCanvas = document.getElementById("menuCanvas");
const menuSceneDefs = [
    { folder: "1. NEW CLOUDS", layers: 3 },
    { folder: "2. NEW CLOUDS", layers: 2 },
    { folder: "3. NEW CLOUDS", layers: 6 },
    { folder: "4. NEW CLOUDS", layers: 3 },
];
const menuScenes = menuSceneDefs.map((def) => {
    const imgs = [];
    for (let i = 1; i <= def.layers; i++) {
        const img = new Image();
        img.src = `images/FondoInicial/${def.folder}/${i}.png`;
        imgs.push(img);
    }
    return imgs;
});

const MENU_SCENE_DURATION_MS = 6000;
const MENU_SCENE_FADE_MS = 1400;
let menuCurrent = 0;
let menuNext = null;
let menuLastChange = 0;
let menuFadeStart = 0;
let menuRafId = null;

function resizeMenuCanvas() {
    if (!menuCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = menuCanvas.clientWidth || window.innerWidth;
    const h = menuCanvas.clientHeight || window.innerHeight;
    menuCanvas.width = Math.round(w * dpr);
    menuCanvas.height = Math.round(h * dpr);
    const c = menuCanvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // para pixel art: 
    if (c) {
        c.imageSmoothingEnabled = false;
        try { c.imageSmoothingQuality = 'low'; } catch (_) {}
    }
}

function drawMenuScene(c, idx, alpha, cw, ch, t) {
    c.globalAlpha = alpha;
    // para pixel art:
    if (c) {
        c.imageSmoothingEnabled = false;
        try { c.imageSmoothingQuality = 'low'; } catch (_) {}
    }
    const layers = menuScenes[idx];
    // 1.png (i=0) es la capa MAS ATRAS, se dibuja primero.
    // i creciente = mas al frente, mas rapida.
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (!(layer.complete && layer.naturalWidth > 0)) continue;
        const speed = 8 + i * 18; // px/s
        // Mantener la relacion de aspecto del PNG, cubrir el alto y tilear horizontalmente.
        const ratio = layer.naturalWidth / layer.naturalHeight;
        const drawH = ch;
        const drawW = Math.max(1, drawH * ratio);
        // Modular por drawW para que la repeticion sea perfectamente cicilica.
        const offset = ((t * speed) % drawW + drawW) % drawW;
        const overlap = 2; // px de solape para esconder la costura entre tiles
        for (let x = -offset; x < cw; x += drawW) {
            c.drawImage(layer, x, 0, drawW + overlap, drawH);
        }
    }
    c.globalAlpha = 1;
}

function menuLoop() {
    if (!menuCanvas) return;
    const c = menuCanvas.getContext("2d");
    const cw = menuCanvas.clientWidth;
    const ch = menuCanvas.clientHeight;
    const now = performance.now();
    const t = now / 1000;

    if (!menuLastChange) menuLastChange = now;
    if (menuNext === null && now - menuLastChange >= MENU_SCENE_DURATION_MS) {
        menuNext = (menuCurrent + 1) % menuScenes.length;
        menuFadeStart = now;
    }

    c.clearRect(0, 0, cw, ch);
    if (menuNext !== null) {
        const k = Math.min(1, (now - menuFadeStart) / MENU_SCENE_FADE_MS);
        drawMenuScene(c, menuCurrent, 1 - k, cw, ch, t);
        drawMenuScene(c, menuNext, k, cw, ch, t);
        if (k >= 1) {
            menuCurrent = menuNext;
            menuNext = null;
            menuLastChange = now;
        }
    } else {
        drawMenuScene(c, menuCurrent, 1, cw, ch, t);
    }

    menuRafId = requestAnimationFrame(menuLoop);
}

function startMenuBackground() {
    if (!menuCanvas) return;
    resizeMenuCanvas();
    if (menuRafId === null) {
        menuRafId = requestAnimationFrame(menuLoop);
    }
}

function stopMenuBackground() {
    if (menuRafId !== null) {
        cancelAnimationFrame(menuRafId);
        menuRafId = null;
    }
}

window.addEventListener("resize", resizeMenuCanvas);
startMenuBackground();
