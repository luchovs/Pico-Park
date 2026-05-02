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

// Escenario
const ground = Matter.Bodies.rectangle(WIDTH / 2, 680, WIDTH, 60, { isStatic: true });
const leftWall = Matter.Bodies.rectangle(0, HEIGHT / 2, 20, HEIGHT, { isStatic: true, friction: 0 });
const rightWall = Matter.Bodies.rectangle(WIDTH, HEIGHT / 2, 20, HEIGHT, { isStatic: true, friction: 0 });

// Variables de estado del nivel
let hasKey = false;
let doorOpen = false;
let levelWon = false;
let playersFinished = []; // IDs de los que cruzaron la puerta
let gameStarted = false;

const key = Matter.Bodies.circle(1000, 600, 15, { isStatic: true, isSensor: true });
const door = Matter.Bodies.rectangle(1150, 610, 60, 80, { isStatic: true, isSensor: true });


let currentLevel = 1;
let levelPlatforms = [];

function cargarNivel(num) {
    // 1. Limpiamos las plataformas anteriores del mundo físico
    levelPlatforms.forEach(p => Matter.Composite.remove(world, p));
    levelPlatforms = [];

    if (num === 1) {
        // Tu nivel original de los escalones
        levelPlatforms = [
            Matter.Bodies.rectangle(520, 625, 120, 50, { isStatic: true, friction: 0 }),
            Matter.Bodies.rectangle(630, 600, 120, 100, { isStatic: true, friction: 0 }),
            Matter.Bodies.rectangle(740, 575, 120, 150, { isStatic: true, friction: 0 })
        ];
        Matter.Body.setPosition(key, { x: 900, y: 400 });
        Matter.Body.setPosition(door, { x: 1150, y: 610 });
    } 
    else if (num === 2) {
        // NIVEL 2: La plataforma del medio es alta y chica
        // Ideal para que tengan que saltar uno arriba del otro
        levelPlatforms = [
            Matter.Bodies.rectangle(640, 400, 150, 20, { isStatic: true, friction: 0 }), // Plataforma flotante
            Matter.Bodies.rectangle(300, 550, 100, 20, { isStatic: true, friction: 0 })  // Escalón de ayuda
        ];
        Matter.Body.setPosition(key, { x: 640, y: 250 }); // Llave bien arriba
        Matter.Body.setPosition(door, { x: 1150, y: 610 });
    }

    else {
        // SI YA NO HAY MÁS NIVELES (Nivel 3 en adelante)
        currentLevel = 1; // Reseteamos el contador internamente
        // Opcional: Podés mover la puerta y la llave afuera para que no se vean
        Matter.Body.setPosition(key, { x: -1000, y: -1000 });
        Matter.Body.setPosition(door, { x: -1000, y: -1000 });
    }

    // 2. Agregamos las nuevas al mundo
    Matter.Composite.add(world, levelPlatforms);
}

// Llamada inicial para que arranque el nivel 1 apenas abrís el server
cargarNivel(1);

Matter.Composite.add(world, [ground, leftWall, rightWall, key, door]);
Matter.Body.setPosition(key, { x: 900, y: 400 });

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
        Matter.Body.setPosition(p.body, { x: 200, y: 600 });
        Matter.Body.setVelocity(p.body, { x: 0, y: 0 });
    });
}

// --- COLISIONES ---
Matter.Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Buscamos si el cuerpo involucrado es de un jugador
        const playerEntry = Object.entries(players).find(([id, p]) => p.body === bodyA || p.body === bodyB);

        if (playerEntry) {
            const [id, p] = playerEntry;

            // 1. Recoger Llave
            if ((bodyA === key || bodyB === key) && !hasKey) {
                hasKey = true;
                console.log("Llave recogida");
            }

            // 2. Tocar la puerta
            if ((bodyA === door || bodyB === door) && hasKey) {
                // Si alguien llega con la llave, la puerta se abre para siempre en este nivel
                if (!doorOpen) {
                    doorOpen = true;
                    console.log("Puerta abierta");
                }

                // Si el jugador entra y no ha terminado aún
                if (!p.isFinished) {
                    p.isFinished = true;
                    playersFinished.push(id);
                    
                    // Lo mandamos "fuera" del mundo físico
                    Matter.Body.setPosition(p.body, { x: -2000, y: -2000 });
                    console.log(`Jugador ${id} entró`);

                    // Verificar victoria: ¿Todos los conectados entraron?
                    const totalPlayers = Object.keys(players).length;
                    if (playersFinished.length === totalPlayers && totalPlayers > 0) {
                        levelWon = true;
                        console.log("¡Nivel Ganado!");
                    }
                }
            }
        }
    });
});

function broadcastPlayerCount() {
    const count = Object.keys(players).length;
    const canStart = count >= 1; // Modo Test
    io.emit("playerCountUpdate", { count, canStart });
}

io.on("connection", (socket) => {
    broadcastPlayerCount();

    socket.on("joinGame", () => {
        if (players[socket.id]) return;

        const playerColor = colors[Object.keys(players).length % colors.length];
        const playerBody = Matter.Bodies.rectangle(200, 600, 32, 48, {
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.05,
            inertia: Infinity,
            restitution: 0
        });

        players[socket.id] = {
            body: playerBody,
            color: playerColor,
            moveDir: 0,
            wantsToJump: false,
            isFinished: false // Estado individual
        };

        Matter.Composite.add(world, playerBody);
        socket.emit("init", { color: playerColor });
        broadcastPlayerCount();
    });

    socket.on("move", (dir) => {
        if (players[socket.id]) {
            players[socket.id].moveDir = dir.x;
            players[socket.id].wantsToJump = dir.y < 0;
        }
    });

    socket.on("restart", () => {
        if (levelWon) {
            currentLevel++;
            // Si el nivel que sigue ya no existe, volvemos al 1
            if (currentLevel > 2) {
                currentLevel = 1;
            }
        }
        cargarNivel(currentLevel);
        resetLevel(); 
    });

    socket.on("disconnect", () => {
        if (players[socket.id]) {
            Matter.Composite.remove(world, players[socket.id].body);
            delete players[socket.id];
            // Si alguien se va, recalculamos si los que quedan ya terminaron
            const totalPlayers = Object.keys(players).length;
            if (playersFinished.length >= totalPlayers && totalPlayers > 0) {
                levelWon = true;
            }
            broadcastPlayerCount();
        }
    });
});

Matter.Events.on(engine, "beforeUpdate", () => {
    if (!gameStarted) return;
    Object.values(players).forEach((p) => {
        if (!p.isFinished) {
            // AUMENTAR VELOCIDAD X: Cambiamos 5 por 7 para que sea más rápido
            Matter.Body.setVelocity(p.body, { x: p.moveDir * 7, y: p.body.velocity.y });

            // CORRECCIÓN SALTO INFINITO Y ALTURA:
            // Usamos un umbral pequeño (0.1) para saber si está "quieto" en vertical
            if (p.wantsToJump && Math.abs(p.body.velocity.y) < 0.1) {
                // REDUCIR SALTO: Cambiamos -12 por -10 (ajustalo a gusto)
                Matter.Body.setVelocity(p.body, { x: p.body.velocity.x, y: -20 });
                p.wantsToJump = false;
            } else if (p.wantsToJump) {
                // Si quiso saltar pero no estaba en el suelo, le apagamos el deseo 
                // para que no salte apenas toque una plataforma por error
                p.wantsToJump = false; 
            }
        }
    });
});

setInterval(() => {

  if (gameStarted) { 
    Matter.Engine.update(engine, 1000 / 60);
  }
    // Solo enviamos los jugadores que NO han entrado a la puerta
    const entities = Object.keys(players)
        .filter(id => !players[id].isFinished)
        .map((id) => ({
            id,
            x: players[id].body.position.x,
            y: players[id].body.position.y,
            color: players[id].color,
            moveDir: players[id].moveDir,
            type: "player",
        }));
        // Dentro del setInterval, cuando armás el array entities:
    levelPlatforms.forEach((step, index) => {
        entities.push({
            id: `step_${index}`,
            x: step.position.x,
            y: step.position.y,
            w: step.bounds.max.x - step.bounds.min.x,
            h: step.bounds.max.y - step.bounds.min.y,
            type: "platform"
        });
    });

    if (!hasKey) {
        entities.push({ id: "key", x: key.position.x, y: key.position.y, type: "key" });
    }

    entities.push({
        id: "door",
        x: door.position.x,
        y: door.position.y,
        type: "door",
        isOpen: doorOpen,
    });

    entities.push({
        id: "ground",
        x: ground.position.x,
        y: ground.position.y,
        type: "ground",
    });

    io.emit("stateUpdate", { entities, levelWon, currentLevel });
}, 1000 / 60);

server.listen(3000, "0.0.0.0");