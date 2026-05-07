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
engine.world.gravity.y = 2.8;

const WIDTH = 1280;
const HEIGHT = 720;
const MAX_PLAYERS = 4;
const MIN_PLAYERS = 2;

// Variables de estado
const players = {};
const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
let hasKey = false,
  doorOpen = false,
  levelWon = false;
let keyHolder = null; // ID del jugador que tiene la llave
let keySpawnPos = { x: 900, y: 400 }; // Posición de respawn de la llave

let btn1Active = false,
  btn2Active = false,
  barreraGarajeAbierta = false;
let playersFinished = [];
let gameStarted = false,
  currentLevel = 1;
let levelPlatforms = [],
  spikes = [];

// Escenario base
const ground = Matter.Bodies.rectangle(WIDTH / 2, 680, WIDTH, 60, {
  isStatic: true,
  friction: 0,
});
const leftWall = Matter.Bodies.rectangle(0, HEIGHT / 2, 20, HEIGHT, {
  isStatic: true,
  friction: 0,
});
const rightWall = Matter.Bodies.rectangle(WIDTH, HEIGHT / 2, 20, HEIGHT, {
  isStatic: true,
  friction: 0,
});

// Entidades (La llave empieza en su spawn)
const key = Matter.Bodies.circle(0, 0, 20, { isStatic: true, isSensor: true });
const door = Matter.Bodies.rectangle(1180, 610, 60, 80, {
  isStatic: true,
  isSensor: true,
});
const button1 = Matter.Bodies.rectangle(120, 240, 50, 15, {
  isStatic: true,
  isSensor: true,
});
const button2 = Matter.Bodies.rectangle(640, 645, 50, 15, {
  isStatic: true,
  isSensor: true,
});
const wallKey = Matter.Bodies.rectangle(1050, 150, 20, 200, {
  isStatic: true,
  friction: 0,
});
const wallGarage = Matter.Bodies.rectangle(1000, 575, 20, 150, {
  isStatic: true,
  friction: 0,
});

function cargarNivel(num) {
  levelPlatforms.forEach((p) => Matter.Composite.remove(world, p));
  spikes.forEach((s) => Matter.Composite.remove(world, s));
  levelPlatforms = [];
  spikes = [];
  btn1Active = false;
  btn2Active = false;
  barreraGarajeAbierta = false;
  hasKey = false;
  doorOpen = false;
  levelWon = false;
  keyHolder = null;
  playersFinished = [];

  if (num === 1) {
    keySpawnPos = { x: 900, y: 400 };
    levelPlatforms = [
      Matter.Bodies.rectangle(520, 625, 120, 50, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(630, 600, 120, 100, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(740, 575, 120, 150, {
        isStatic: true,
        friction: 0,
      }),
    ];
    Matter.Body.setPosition(door, { x: 1150, y: 610 });
    Matter.Body.setPosition(wallKey, { x: -5000, y: 0 });
    Matter.Body.setPosition(wallGarage, { x: -5000, y: 0 });
  } else if (num === 2) {
    keySpawnPos = { x: 1150, y: 150 };
    levelPlatforms = [
      Matter.Bodies.rectangle(120, 550, 100, 20, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(120, 250, 100, 20, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(350, 420, 100, 20, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(600, 320, 120, 20, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(850, 280, 100, 20, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(1150, 250, 300, 20, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(1150, 50, 300, 20, {
        isStatic: true,
        friction: 0,
      }),
      Matter.Bodies.rectangle(1150, 500, 300, 20, {
        isStatic: true,
        friction: 0,
      }),
      wallKey,
      wallGarage,
      button1,
      button2,
    ];
    spikes = [
      Matter.Bodies.rectangle(450, 645, 200, 10, {
        isStatic: true,
        isSensor: true,
        label: "spike",
      }),
      Matter.Bodies.rectangle(750, 310, 80, 10, {
        isStatic: true,
        isSensor: true,
        label: "spike",
      }),
    ];
    Matter.Body.setPosition(button1, { x: 120, y: 240 });
    Matter.Body.setPosition(button2, { x: 640, y: 645 });
    Matter.Body.setPosition(door, { x: 1150, y: 610 });
    Matter.Body.setPosition(wallKey, { x: 1050, y: 150 });
    Matter.Body.setPosition(wallGarage, { x: 1020, y: 575 });
  }

  Matter.Body.setPosition(key, keySpawnPos);
  Matter.Composite.add(world, [...levelPlatforms, ...spikes]);
}

cargarNivel(1);
Matter.Composite.add(world, [ground, leftWall, rightWall, key, door]);

Matter.Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;
    const pEntry = Object.entries(players).find(
      ([id, p]) => p.body === bodyA || p.body === bodyB,
    );
    if (!pEntry) return;
    const [id, p] = pEntry;

    // RESPRAWN DE JUGADOR Y LLAVE
    if (bodyA.label === "spike" || bodyB.label === "spike") {
      if (keyHolder === id) {
        // Si el que muere tiene la llave
        keyHolder = null;
        hasKey = false;
        doorOpen = false;
        Matter.Body.setPosition(key, keySpawnPos); // Reaparece la llave
      }
      Matter.Body.setPosition(p.body, { x: 150, y: 600 });
      Matter.Body.setVelocity(p.body, { x: 0, y: 0 });
    }

    // AGARRAR LLAVE
    if ((bodyA === key || bodyB === key) && !hasKey) {
      if (currentLevel === 1 || btn1Active) {
        hasKey = true;
        keyHolder = id; // Este jugador ahora "lleva" la llave
        doorOpen = true;
        Matter.Body.setPosition(key, { x: -5000, y: -5000 }); // La sacamos del mapa
      }
    }
  });
});

io.on("connection", (socket) => {
  const emitCount = () => {
    const count = Object.keys(players).length;
    io.emit("playerCountUpdate", {
      count: count,
      canStart: count >= MIN_PLAYERS && count <= MAX_PLAYERS,
    });
  };

  emitCount();

  socket.on("joinGame", () => {
    const count = Object.keys(players).length;
    if (count >= MAX_PLAYERS) return;
    if (players[socket.id]) return;

    const pBody = Matter.Bodies.rectangle(200, 600, 32, 48, {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.02,
      inertia: Infinity,
      restitution: 0,
    });
    players[socket.id] = {
      body: pBody,
      color: colors[count % colors.length],
      moveDir: 0,
      wantsToJump: false,
      isFinished: false,
    };
    Matter.Composite.add(world, pBody);
    socket.emit("init", { color: players[socket.id].color });
    emitCount();
  });

  socket.on("move", (dir) => {
    if (players[socket.id]) {
      players[socket.id].moveDir = dir.x;
      if (dir.y < 0) players[socket.id].wantsToJump = true;
    }
  });

  socket.on("restart", () => {
    const count = Object.keys(players).length;
    if (count < MIN_PLAYERS) return;
    if (levelWon || !gameStarted) {
      if (levelWon) currentLevel = currentLevel === 1 ? 2 : 1;
      cargarNivel(currentLevel);
      resetLevel();
    }
  });

  socket.on("disconnect", () => {
    if (players[socket.id]) {
      if (keyHolder === socket.id) {
        // Si se desconecta el portador, la llave vuelve
        keyHolder = null;
        hasKey = false;
        doorOpen = false;
        Matter.Body.setPosition(key, keySpawnPos);
      }
      Matter.Composite.remove(world, players[socket.id].body);
      delete players[socket.id];
      playersFinished = playersFinished.filter((fid) => fid !== socket.id);
      const count = Object.keys(players).length;
      if (count < MIN_PLAYERS) {
        gameStarted = false;
        levelWon = false;
      } else if (gameStarted && playersFinished.length === count) {
        levelWon = true;
      }
      emitCount();
    }
  });
});

function resetLevel() {
  hasKey = false;
  doorOpen = false;
  levelWon = false;
  keyHolder = null;
  gameStarted = true;
  barreraGarajeAbierta = false;
  playersFinished = [];
  Object.values(players).forEach((p) => {
    p.isFinished = false;
    Matter.Body.setPosition(p.body, { x: 150, y: 600 });
    Matter.Body.setVelocity(p.body, { x: 0, y: 0 });
  });
  Matter.Body.setPosition(key, keySpawnPos);
}

Matter.Events.on(engine, "beforeUpdate", () => {
  if (!gameStarted) return;
  const idsPartida = Object.keys(players);

  idsPartida.forEach((id) => {
    const p = players[id];
    if (!p.isFinished) {
      Matter.Body.setVelocity(p.body, {
        x: p.moveDir * 7,
        y: p.body.velocity.y,
      });
      if (p.body.velocity.y > 0) p.body.force.y += 0.005;

      if (p.wantsToJump) {
        const tocaPuerta = Matter.Query.collides(p.body, [door]).length > 0;
        // Solo puede entrar si el EQUIPO tiene la llave (hasKey)
        if (
          hasKey &&
          tocaPuerta &&
          (currentLevel === 1 || barreraGarajeAbierta)
        ) {
          p.isFinished = true;
          playersFinished.push(id);
          if (keyHolder === id) keyHolder = null; // Si el portador entra, la llave se "consume"
          Matter.Body.setPosition(p.body, { x: -5000, y: -5000 });
        } else if (Math.abs(p.body.velocity.y) < 0.1) {
          Matter.Body.setVelocity(p.body, { x: p.body.velocity.x, y: -18 });
        }
      }
      p.wantsToJump = false;
    }
  });

  if (
    gameStarted &&
    idsPartida.length >= MIN_PLAYERS &&
    playersFinished.length === idsPartida.length
  ) {
    levelWon = true;
  }

  if (currentLevel === 2) {
    btn1Active =
      Matter.Query.collides(
        button1,
        Object.values(players).map((p) => p.body),
      ).length > 0;
    Matter.Body.setPosition(wallKey, { x: btn1Active ? -5000 : 1050, y: 150 });
    btn2Active =
      Matter.Query.collides(
        button2,
        Object.values(players).map((p) => p.body),
      ).length > 0;
    if (btn2Active) barreraGarajeAbierta = true;
    if (barreraGarajeAbierta)
      Matter.Body.setPosition(wallGarage, { x: -5000, y: 0 });
    else Matter.Body.setPosition(wallGarage, { x: 1020, y: 575 });
  }
});

setInterval(() => {
  if (gameStarted && !levelWon) Matter.Engine.update(engine, 1000 / 60);

  const entities = Object.keys(players)
    .filter((id) => !players[id].isFinished)
    .map((id) => ({
      id,
      x: players[id].body.position.x,
      y: players[id].body.position.y,
      color: players[id].color,
      moveDir: players[id].moveDir,
      type: "player",
    }));

  levelPlatforms.forEach((step, index) => {
    let color = "#444";
    if (step === button1) color = btn1Active ? "#00FF00" : "#FF0000";
    if (step === button2) color = barreraGarajeAbierta ? "#00FF00" : "#FF0000";
    entities.push({
      id: `step_${index}`,
      x: step.position.x,
      y: step.position.y,
      w: step.bounds.max.x - step.bounds.min.x,
      h: step.bounds.max.y - step.bounds.min.y,
      type: "platform",
      color,
    });
  });

  spikes.forEach((s, i) =>
    entities.push({
      id: `spike_${i}`,
      x: s.position.x,
      y: s.position.y,
      w: s.bounds.max.x - s.bounds.min.x,
      h: s.bounds.max.y - s.bounds.min.y,
      type: "platform",
      color: "#FF4500",
    }),
  );

  // La llave solo se envía al cliente si NO la tiene nadie
  if (!hasKey) {
    entities.push({
      id: "key",
      x: key.position.x,
      y: key.position.y,
      type: "key",
    });
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

  io.emit("stateUpdate", { entities, levelWon, currentLevel, gameStarted });
}, 1000 / 60);

server.listen(3000, "0.0.0.0");
