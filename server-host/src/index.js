const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Matter = require("matter-js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

const engine = Matter.Engine.create();
const { world } = engine;
engine.world.gravity.y = 3;

const WIDTH = 1280;
const HEIGHT = 720;

// Escenario base
const ground = Matter.Bodies.rectangle(WIDTH / 2, 680, WIDTH, 60, { isStatic: true });
const leftWall = Matter.Bodies.rectangle(0, HEIGHT / 2, 20, HEIGHT, { isStatic: true, friction: 0 });
const rightWall = Matter.Bodies.rectangle(WIDTH, HEIGHT / 2, 20, HEIGHT, { isStatic: true, friction: 0 });

// Variables de estado
let hasKey = false;
let doorOpen = false;
let levelWon = false;
let playersFinished = [];
let gameStarted = false;
let currentLevel = 1;
let levelPlatforms = [];

// BOTONES Y MUROS (Nivel 2)
let btn1Active = false;
let btn2Active = false;

const button1 = Matter.Bodies.rectangle(100, 220, 50, 15, {
    isStatic: true,
    isSensor: true
});

const button2 = Matter.Bodies.rectangle(640, 640, 50, 15, {
    isStatic: true,
    isSensor: true
});

// Trampolín (Nivel 2)
const trampolin = Matter.Bodies.rectangle(200, 235, 30, 10, {
    isStatic: true,
    isSensor: true,
    label: "trampolin"
});

// Muros que desaparecen
const wallKey = Matter.Bodies.rectangle(1000, 150, 20, 200, {
    isStatic: true
});

const wallGarage = Matter.Bodies.rectangle(1000, 575, 20, 150, {
    isStatic: true
});

// Entidades principales
const key = Matter.Bodies.circle(1150, 150, 20, {
    isStatic: true,
    isSensor: true
});

const door = Matter.Bodies.rectangle(1180, 610, 60, 80, {
    isStatic: true,
    isSensor: true
});

function cargarNivel(num) {
    levelPlatforms.forEach(p => Matter.Composite.remove(world, p));
    levelPlatforms = [];

    // Reset
    btn1Active = false;
    btn2Active = false;
    hasKey = false;
    doorOpen = false;

    if (num === 1) {
        levelPlatforms = [
            Matter.Bodies.rectangle(520, 625, 120, 50, { isStatic: true, friction: 0 }),
            Matter.Bodies.rectangle(630, 600, 120, 100, { isStatic: true, friction: 0 }),
            Matter.Bodies.rectangle(740, 575, 120, 150, { isStatic: true, friction: 0 })
        ];

        Matter.Body.setPosition(key, { x: 900, y: 400 });
        Matter.Body.setPosition(door, { x: 1150, y: 610 });

        Matter.Body.setPosition(wallKey, { x: -5000, y: 0 });
        Matter.Body.setPosition(wallGarage, { x: -5000, y: 0 });

    } else if (num === 2) {
        levelPlatforms = [
            // HABITACIÓN LLAVE
            Matter.Bodies.rectangle(1150, 250, 300, 20, { isStatic: true }),
            Matter.Bodies.rectangle(1150, 50, 300, 20, { isStatic: true }),
            Matter.Bodies.rectangle(1000, 150, 20, 200, { isStatic: true }),
            Matter.Bodies.rectangle(1300, 150, 20, 200, { isStatic: true }),

            // HABITACIÓN PUERTA
            Matter.Bodies.rectangle(1150, 650, 300, 20, { isStatic: true }),
            Matter.Bodies.rectangle(1150, 500, 300, 20, { isStatic: true }),
            Matter.Bodies.rectangle(1000, 575, 20, 150, { isStatic: true }),
            Matter.Bodies.rectangle(1300, 575, 20, 150, { isStatic: true }),

            // PARKOUR IZQUIERDA
            Matter.Bodies.rectangle(150, 550, 100, 20, { isStatic: true }),
            Matter.Bodies.rectangle(350, 420, 100, 20, { isStatic: true }),
            
            // PLATAFORMA BOTÓN LLAVE Y TRAMPOLÍN
            Matter.Bodies.rectangle(150, 250, 120, 20, { isStatic: true }),
            trampolin,

            wallKey,
            wallGarage,
            button1,
            button2
        ];

        // Botón 1 a la IZQUIERDA
        Matter.Body.setPosition(button1, { x: 150, y: 240 });
        // Trampolín al lado del botón
        Matter.Body.setPosition(trampolin, { x: 200, y: 235 });
        // Botón 2 (Muro puerta)
        Matter.Body.setPosition(button2, { x: 640, y: 645 });

        Matter.Body.setPosition(key, { x: 1150, y: 150 });
        Matter.Body.setPosition(door, { x: 1150, y: 610 });
        Matter.Body.setPosition(wallKey, { x: 1000, y: 150 });
        Matter.Body.setPosition(wallGarage, { x: 1000, y: 575 });
    }

    Matter.Composite.add(world, levelPlatforms);
}

// Inicialización
cargarNivel(1);
Matter.Composite.add(world, [ground, leftWall, rightWall, key, door]);

const players = {};
const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];

function resetLevel() {
    hasKey = false;
    doorOpen = false;
    levelWon = false;
    gameStarted = true;
    playersFinished = [];

    Object.values(players).forEach((p) => {
        p.isFinished = false;
        Matter.Body.setPosition(p.body, { x: 150, y: 600 });
        Matter.Body.setVelocity(p.body, { x: 0, y: 0 });
    });
}

// Colisiones
Matter.Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const playerEntry = Object.entries(players).find(([id, p]) => p.body === bodyA || p.body === bodyB);

        if (playerEntry) {
            const [id, p] = playerEntry;

            // BOTÓN 1 (Permanente)
            if (bodyA === button1 || bodyB === button1) {
                btn1Active = true;
                Matter.Body.setPosition(wallKey, { x: -5000, y: 0 });
            }

            // TRAMPOLÍN
            if (bodyA.label === "trampolin" || bodyB.label === "trampolin") {
                Matter.Body.setVelocity(p.body, { x: p.body.velocity.x, y: -25 }); // Impulso vertical
            }

            // LLAVE
            if ((bodyA === key || bodyB === key) && !hasKey) {
                if (currentLevel === 1 || btn1Active) {
                    hasKey = true;
                }
            }

            // PUERTA
            if ((bodyA === door || bodyB === door) && hasKey) {
                if (currentLevel === 1 || btn2Active) {
                    doorOpen = true;
                    if (!p.isFinished) {
                        p.isFinished = true;
                        playersFinished.push(id);
                        Matter.Body.setPosition(p.body, { x: -2000, y: -2000 });
                        const totalPlayers = Object.keys(players).length;
                        if (playersFinished.length === totalPlayers && totalPlayers > 0) levelWon = true;
                    }
                }
            }
        }
    });
});

io.on("connection", (socket) => {
    const count = Object.keys(players).length;
    io.emit("playerCountUpdate", { count, canStart: count >= 1 });

    socket.on("joinGame", () => {
        if (players[socket.id]) return;
        const playerColor = colors[Object.keys(players).length % colors.length];
        const playerBody = Matter.Bodies.rectangle(200, 600, 32, 48, {
            friction: 0.1,
            frictionAir: 0.05,
            inertia: Infinity,
            restitution: 0
        });

        players[socket.id] = { body: playerBody, color: playerColor, moveDir: 0, wantsToJump: false, isFinished: false };
        Matter.Composite.add(world, playerBody);
        socket.emit("init", { color: playerColor });
        const newCount = Object.keys(players).length;
        io.emit("playerCountUpdate", { count: newCount, canStart: newCount >= 1 });
    });

    socket.on("move", (dir) => {
        if (players[socket.id]) {
            players[socket.id].moveDir = dir.x;
            if (dir.y < 0) players[socket.id].wantsToJump = true;
        }
    });

    socket.on("restart", () => {
        if (levelWon) currentLevel = currentLevel === 1 ? 2 : 1;
        cargarNivel(currentLevel);
        resetLevel();
    });

    socket.on("disconnect", () => {
        if (players[socket.id]) {
            Matter.Composite.remove(world, players[socket.id].body);
            delete players[socket.id];
            const newCount = Object.keys(players).length;
            io.emit("playerCountUpdate", { count: newCount, canStart: newCount >= 1 });
        }
    });
});

Matter.Events.on(engine, "beforeUpdate", () => {
    if (!gameStarted) return;

    Object.values(players).forEach((p) => {
        if (!p.isFinished) {
            Matter.Body.setVelocity(p.body, { x: p.moveDir * 7, y: p.body.velocity.y });
            if (p.wantsToJump && Math.abs(p.body.velocity.y) < 0.1) {
                Matter.Body.setVelocity(p.body, { x: p.body.velocity.x, y: -18 });
            }
            p.wantsToJump = false;
        }
    });

    // LÓGICA DE BOTÓN DE PRESIÓN (NIVEL 2)
    if (currentLevel === 2) {
        let alguienPisando = false;
        Object.values(players).forEach(p => {
            if (Matter.Query.collides(p.body, [button2]).length > 0) {
                alguienPisando = true;
            }
        });

        if (alguienPisando) {
            btn2Active = true;
            Matter.Body.setPosition(wallGarage, { x: -5000, y: 0 }); // Muro abre
        } else {
            btn2Active = false;
            Matter.Body.setPosition(wallGarage, { x: 1000, y: 575 }); // Muro cierra
        }
    }
});

setInterval(() => {
    if (gameStarted) Matter.Engine.update(engine, 1000 / 60);

    const entities = Object.keys(players).filter(id => !players[id].isFinished).map((id) => ({
        id, x: players[id].body.position.x, y: players[id].body.position.y, color: players[id].color, moveDir: players[id].moveDir, type: "player"
    }));

    levelPlatforms.forEach((step, index) => {
        let color = "#444";
        if (step === button1) color = btn1Active ? "#00FF00" : "#FF0000";
        if (step === button2) color = btn2Active ? "#00FF00" : "#FF0000";
        if (step === trampolin) color = "#FF00FF"; // Magenta para el trampolín
        entities.push({
            id: `step_${index}`, x: step.position.x, y: step.position.y,
            w: step.bounds.max.x - step.bounds.min.x, h: step.bounds.max.y - step.bounds.min.y,
            type: "platform", color
        });
    });

    if (!hasKey) entities.push({ id: "key", x: key.position.x, y: key.position.y, type: "key" });
    entities.push({ id: "door", x: door.position.x, y: door.position.y, type: "door", isOpen: doorOpen });
    entities.push({ id: "ground", x: ground.position.x, y: ground.position.y, type: "ground" });

    io.emit("stateUpdate", { entities, levelWon, currentLevel });
}, 1000 / 60);

server.listen(3000, "0.0.0.0");