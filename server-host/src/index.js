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

const WIDTH = 1280;
const HEIGHT = 720;

const ground = Matter.Bodies.rectangle(WIDTH / 2, 680, WIDTH, 60, {
  isStatic: true,
});
const leftWall = Matter.Bodies.rectangle(0, HEIGHT / 2, 20, HEIGHT, {
  isStatic: true,
});
const rightWall = Matter.Bodies.rectangle(WIDTH, HEIGHT / 2, 20, HEIGHT, {
  isStatic: true,
});

let hasKey = false;
let doorOpen = false;
let levelWon = false;

const key = Matter.Bodies.circle(1000, 600, 15, {
  isStatic: true,
  isSensor: true,
});
const door = Matter.Bodies.rectangle(1150, 610, 60, 80, {
  isStatic: true,
  isSensor: true,
});

Matter.Composite.add(world, [ground, leftWall, rightWall, key, door]);

const players = {};
const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];

// --- FUNCIÓN DE REINICIO ---
function resetLevel() {
  hasKey = false;
  doorOpen = false;
  levelWon = false;
  Object.values(players).forEach((p) => {
    Matter.Body.setPosition(p.body, { x: 200, y: 600 });
    Matter.Body.setVelocity(p.body, { x: 0, y: 0 });
  });
}

Matter.Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;
    const isPlayer = (body) =>
      Object.values(players).some((p) => p.body === body);
    const playerBody = isPlayer(bodyA) ? bodyA : isPlayer(bodyB) ? bodyB : null;

    if ((bodyA === key || bodyB === key) && playerBody && !hasKey) {
      hasKey = true;
    }

    if ((bodyA === door || bodyB === door) && playerBody && hasKey) {
      doorOpen = true;
      levelWon = true;
    }
  });
});

io.on("connection", (socket) => {
  const playerColor = colors[Object.keys(players).length % colors.length];
  const playerBody = Matter.Bodies.rectangle(200, 600, 32, 48, {
    inertia: Infinity,
    friction: 0.1,
  });
  players[socket.id] = {
    body: playerBody,
    color: playerColor,
    moveDir: 0,
    wantsToJump: false,
  };
  Matter.Composite.add(world, playerBody);

  socket.on("move", (dir) => {
    if (players[socket.id]) {
      players[socket.id].moveDir = dir.x;
      players[socket.id].wantsToJump = dir.y < 0;
    }
  });

  // ESCUCHAR REINICIO DESDE EL CLIENTE
  socket.on("restart", () => {
    resetLevel();
  });

  socket.on("disconnect", () => {
    if (players[socket.id])
      Matter.Composite.remove(world, players[socket.id].body);
    delete players[socket.id];
  });
});

Matter.Events.on(engine, "beforeUpdate", () => {
  Object.values(players).forEach((p) => {
    Matter.Body.setVelocity(p.body, { x: p.moveDir * 5, y: p.body.velocity.y });
    if (p.wantsToJump && Math.abs(p.body.velocity.y) < 0.1) {
      Matter.Body.setVelocity(p.body, { x: p.body.velocity.x, y: -12 });
      p.wantsToJump = false;
    }
  });
});

setInterval(() => {
  Matter.Engine.update(engine, 1000 / 30);
  const entities = Object.keys(players).map((id) => ({
    id,
    x: players[id].body.position.x,
    y: players[id].body.position.y,
    color: players[id].color,
    moveDir: players[id].moveDir,
    type: "player",
  }));
  if (!hasKey)
    entities.push({
      id: "key",
      x: key.position.x,
      y: key.position.y,
      type: "key",
    });
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
    color: "#555",
    type: "ground",
  });
  io.emit("stateUpdate", { entities, levelWon });
}, 1000 / 30);

server.listen(3000, "0.0.0.0");
