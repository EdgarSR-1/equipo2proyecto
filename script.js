// Juego del dinosaurio
// Versión fusionada: visuales avanzados + scoreboard localStorage

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const finalScore = document.getElementById("finalScore");
const restartButton = document.getElementById("restartBtn");
const scoreDisplay = document.getElementById("scoreDisplay");
const countdownEl = document.getElementById("countdown");

const scoreTableBody = document.getElementById("scoreTableBody");

// ======================================================
// SCOREBOARD LOCAL
// ======================================================

const scoreStorageKey = "dinoGameScores";
const maxScores = 5;

let scoreHistory = loadScoreHistory();

function loadScoreHistory() {
    try {
        const storedScores = localStorage.getItem(scoreStorageKey);

        if (!storedScores) return [];

        const parsedScores = JSON.parse(storedScores);

        if (!Array.isArray(parsedScores)) return [];

        return parsedScores.filter((value) =>
            Number.isFinite(value)
        );
    } catch {
        return [];
    }
}

function saveScoreHistory() {
    localStorage.setItem(
        scoreStorageKey,
        JSON.stringify(scoreHistory)
    );
}

function saveScore() {
    scoreHistory.unshift(score);

    scoreHistory = scoreHistory
        .sort((a, b) => b - a)
        .slice(0, maxScores);

    saveScoreHistory();
    renderScoreTable();
}

function renderScoreTable() {
    scoreTableBody.innerHTML = "";

    const rankedScores = [...scoreHistory]
        .sort((a, b) => b - a);

    if (rankedScores.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML =
            `<td colspan="2">Sin partidas aún</td>`;

        scoreTableBody.appendChild(row);
        return;
    }

    rankedScores.forEach((points, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${points}</td>
        `;

        scoreTableBody.appendChild(row);
    });
}

// ======================================================
// CANVAS
// ======================================================

canvas.width = 800;
canvas.height = 400;

// ======================================================
// DINO
// ======================================================

const dinoFrames = [];

const dinoFrame1 = new Image();
dinoFrame1.src = "images/Capybara/CapybaraRun-1.png";

const dinoFrame2 = new Image();
dinoFrame2.src = "images/Capybara/CapybaraRun-2.png";

dinoFrames.push(dinoFrame1, dinoFrame2);

let currentDinoFrame = 0;
let lastFrameChange = 0;
const frameDuration = 120;

// ======================================================
// ESCENAS
// ======================================================

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
let nextScene = null;
let lastSceneChange = Date.now();
let fadeStart = 0;

// ======================================================
// SUELO
// ======================================================

const GROUND_Y = canvas.height - 70;

const groundImg = new Image();
groundImg.src = "images/Base/Base.png";

const GROUND_SRC = {
    x: 53,
    y: 380,
    w: 994,
    h: 322,
};

const GROUND_TILE_H = canvas.height - GROUND_Y;

const GROUND_TILE_W = Math.round(
    GROUND_TILE_H * GROUND_SRC.w / GROUND_SRC.h
);

const DINO_FLOOR_OFFSET = 40;

const DINO_FLOOR_Y =
    GROUND_Y - 140 + DINO_FLOOR_OFFSET;

// ======================================================
// HITBOXES
// ======================================================

let showHitboxes = false;

function getHitbox(entity) {
    const hb = entity.hitbox || {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    };

    return {
        x: entity.x + hb.left,
        y: entity.y + hb.top,
        width:
            entity.width - hb.left - hb.right,
        height:
            entity.height - hb.top - hb.bottom,
    };
}

function drawHitbox(entity, color) {
    const hb = getHitbox(entity);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.strokeRect(
        hb.x,
        hb.y,
        hb.width,
        hb.height
    );
}

// ======================================================
// JUGADOR
// ======================================================

function createDino() {
    return {
        x: 50,
        y: DINO_FLOOR_Y,
        width: 140,
        height: 140,
        color: "green",

        isJumping: false,
        velocityY: 0,

        jumpStrength: 14,
        gravity: 0.6,

        hitbox: {
            left: 32,
            right: 28,
            top: 28,
            bottom: 38,
        },
    };
}

let dino = createDino();

// ======================================================
// OBSTÁCULOS
// ======================================================

const obstacleTypes = [
    {
        name: "tronco",
        src: "images/Obstaculos/Tronco.png",
        frames: 1,
        frameDuration: 0,
        width: 90,
        height: 90,

        hitbox: {
            left: 0.333,
            right: 0.333,
            top: 0.267,
            bottom: 0.022,
        },
    },

    {
        name: "hongo",
        src: "images/Obstaculos/Mushroom-Idle.png",
        frames: 7,
        frameDuration: 120,
        width: 150,
        height: 120,

        hitbox: {
            left: 0.42,
            right: 0.42,
            top: 0.6,
            bottom: 0.05,
        },
    },

    {
        name: "volador",
        src: "images/Obstaculos/FlyObstacle-Idle.png",
        frames: 8,
        frameDuration: 90,
        width: 100,
        height: 100,

        yOffset: 120,

        hitbox: {
            left: 0.15,
            right: 0.15,
            top: 0.1,
            bottom: 0.1,
        },
    },
];

for (const type of obstacleTypes) {
    type.img = new Image();
    type.img.src = type.src;
}

let obstacles = [];

let obstacleSpeed = 5;

let lastSpawnTime = 0;
let nextSpawnDelay = 1500;

const pendingSpawns = [];

const VOLADOR_MIN_SCORE = 20;

const obstacleWeights = {
    tronco: 2.2,
    hongo: 2.2,
    volador: 1,
};

function rollNextSpawnDelay() {
    const minGap =
        Math.max(550, 1000 - score * 4);

    const maxGap =
        Math.max(1100, 2000 - score * 7);

    return (
        minGap +
        Math.random() * (maxGap - minGap)
    );
}

function pickRandomType() {
    const pool = obstacleTypes.filter(
        (t) =>
            t.name !== "volador" ||
            score >= VOLADOR_MIN_SCORE
    );

    const total = pool.reduce(
        (sum, t) =>
            sum + (obstacleWeights[t.name] || 1),
        0
    );

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

        y:
            GROUND_Y -
            type.height -
            yOffset,

        width: type.width,
        height: type.height,

        color: "brown",

        hitbox: hb,

        type,

        frame: 0,
        lastFrameChange: now,
    });
}

// ======================================================
// GAME STATE
// ======================================================

let score = 0;

let running = false;
let gameOver = false;

const startDelay = 3000;

// ======================================================
// INPUT
// ======================================================

document.addEventListener("keydown", (e) => {

    if (
        (e.code === "Space" ||
            e.code === "ArrowUp") &&
        running &&
        dino.y === DINO_FLOOR_Y
    ) {
        dino.velocityY =
            -dino.jumpStrength;

        dino.isJumping = true;
    }

    if (e.code === "KeyH") {
        showHitboxes = !showHitboxes;
    }
});

// ======================================================
// GAME LOGIC
// ======================================================

function updateScoreDisplay() {
    scoreDisplay.textContent =
        `Puntuación: ${score}`;
}

function resetGame() {

    dino = createDino();

    obstacles = [];

    obstacleSpeed = 5;

    lastSpawnTime = 0;

    nextSpawnDelay = 1500;

    score = 0;

    running = false;
    gameOver = false;

    overlay.classList.add("hidden");

    updateScoreDisplay();
}

function updateDino() {

    dino.velocityY += dino.gravity;

    dino.y += dino.velocityY;

    if (dino.y > DINO_FLOOR_Y) {

        dino.y = DINO_FLOOR_Y;

        dino.velocityY = 0;

        dino.isJumping = false;
    }
}

function spawnObstacle() {

    const now = Date.now();

    for (
        let i = pendingSpawns.length - 1;
        i >= 0;
        i--
    ) {
        if (now >= pendingSpawns[i].time) {

            pushObstacle(
                pendingSpawns[i].type,
                now
            );

            pendingSpawns.splice(i, 1);
        }
    }

    if (
        now - lastSpawnTime >
        nextSpawnDelay
    ) {

        const type = pickRandomType();

        pushObstacle(type, now);

        lastSpawnTime = now;

        nextSpawnDelay =
            rollNextSpawnDelay();

        if (
            type.name !== "volador" &&
            score >= VOLADOR_MIN_SCORE &&
            Math.random() < 0.45
        ) {

            const flyType =
                obstacleTypes.find(
                    (t) =>
                        t.name === "volador"
                );

            if (flyType) {

                const delay =
                    380 +
                    Math.random() * 260;

                pendingSpawns.push({
                    time: now + delay,
                    type: flyType,
                });
            }
        }
    }
}

function updateObstacles() {

    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        obstacles[i].x -= obstacleSpeed;

        if (
            obstacles[i].x +
                obstacles[i].width <
            0
        ) {

            obstacles.splice(i, 1);

            score++;

            updateScoreDisplay();
        }
    }

    obstacleSpeed =
        Math.min(11, 5 + score * 0.05);
}

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
            endGame();
        }
    }
}

function endGame() {

    if (gameOver) return;

    gameOver = true;

    running = false;

    finalScore.textContent =
        `Puntuación: ${score}`;

    saveScore();

    overlay.classList.remove("hidden");
}

// ======================================================
// DRAW
// ======================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Escenas

    const nowScene = Date.now();

    if (
        nextScene === null &&
        nowScene - lastSceneChange >=
            SCENE_DURATION_MS
    ) {

        nextScene =
            (currentScene + 1) %
            scenes.length;

        fadeStart = nowScene;
    }

    function drawScene(idx, alpha) {

        ctx.globalAlpha = alpha;

        for (const layer of scenes[idx]) {

            if (
                layer.complete &&
                layer.naturalWidth > 0
            ) {

                ctx.drawImage(
                    layer,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            }
        }

        ctx.globalAlpha = 1;
    }

    if (nextScene !== null) {

        const t = Math.min(
            1,
            (nowScene - fadeStart) /
                SCENE_FADE_MS
        );

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

    // Suelo

    if (
        groundImg.complete &&
        groundImg.naturalWidth > 0
    ) {

        const overlapX = 18;
        const overlapY = 12;

        const step =
            GROUND_TILE_W - overlapX;

        const drawY = GROUND_Y - 2;

        const drawH =
            canvas.height -
            drawY +
            overlapY;

        for (
            let x = -overlapX;
            x < canvas.width;
            x += step
        ) {

            ctx.drawImage(
                groundImg,

                GROUND_SRC.x,
                GROUND_SRC.y,
                GROUND_SRC.w,
                GROUND_SRC.h,

                x,
                drawY,

                GROUND_TILE_W,
                drawH
            );
        }
    }

    // Dino animado

    const now = Date.now();

    if (
        now - lastFrameChange >=
        frameDuration
    ) {

        currentDinoFrame =
            (currentDinoFrame + 1) %
            dinoFrames.length;

        lastFrameChange = now;
    }

    const activeDinoFrame =
        dinoFrames[currentDinoFrame];

    if (
        activeDinoFrame.complete &&
        activeDinoFrame.naturalWidth > 0
    ) {

        ctx.drawImage(
            activeDinoFrame,

            dino.x,
            dino.y,

            dino.width,
            dino.height
        );

    } else {

        ctx.fillStyle = dino.color;

        ctx.fillRect(
            dino.x,
            dino.y,
            dino.width,
            dino.height
        );
    }

    // Obstáculos

    const nowDraw = Date.now();

    for (let obstacle of obstacles) {

        const type = obstacle.type;

        if (
            type &&
            type.frames > 1 &&
            type.frameDuration > 0
        ) {

            if (
                nowDraw -
                    obstacle.lastFrameChange >=
                type.frameDuration
            ) {

                obstacle.frame =
                    (obstacle.frame + 1) %
                    type.frames;

                obstacle.lastFrameChange =
                    nowDraw;
            }
        }

        const img = type ? type.img : null;

        if (
            img &&
            img.complete &&
            img.naturalWidth > 0
        ) {

            if (type.frames > 1) {

                const fw =
                    img.naturalWidth /
                    type.frames;

                const fh =
                    img.naturalHeight;

                ctx.drawImage(
                    img,

                    obstacle.frame * fw,
                    0,

                    fw,
                    fh,

                    obstacle.x,
                    obstacle.y,

                    obstacle.width,
                    obstacle.height
                );

            } else {

                ctx.drawImage(
                    img,

                    obstacle.x,
                    obstacle.y,

                    obstacle.width,
                    obstacle.height
                );
            }

        } else {

            ctx.fillStyle =
                obstacle.color;

            ctx.fillRect(
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height
            );
        }
    }

    // Hitboxes

    if (showHitboxes) {

        drawHitbox(dino, "lime");

        for (let obstacle of obstacles) {
            drawHitbox(obstacle, "red");
        }
    }

    // Texto score

    ctx.fillStyle = "white";

    ctx.font = "20px Arial";

    ctx.fillText(
        `Puntuación: ${score}`,
        10,
        30
    );

    if (showHitboxes) {

        ctx.fillText(
            "Hitboxes ON (H)",
            10,
            55
        );
    }
}

// ======================================================
// LOOP
// ======================================================

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

// ======================================================
// START
// ======================================================

function startWithDelay() {

    resetGame();

    let remaining =
        startDelay / 1000;

    countdownEl.textContent =
        `Comienza en ${remaining}...`;

    const interval = setInterval(() => {

        remaining--;

        if (remaining > 0) {

            countdownEl.textContent =
                `Comienza en ${remaining}...`;

        } else {

            clearInterval(interval);

            countdownEl.textContent = "";

            running = true;

            lastSpawnTime = Date.now();
        }

    }, 1000);
}

restartButton.addEventListener(
    "click",
    startWithDelay
);

// ======================================================
// INIT
// ======================================================

updateScoreDisplay();

renderScoreTable();

gameLoop();

startWithDelay();