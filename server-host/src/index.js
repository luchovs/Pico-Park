const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Matter = require("matter-js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Permitir que el celular se conecte
});

app.use(express.static("public"));

// --- Configuración de Matter.js ---
const engine = Matter.Engine.create();
engine.gravity.y = 1; // Gravedad normal
const { world } = engine;

// ... debajo de const { world } = engine;

const ground = Matter.Bodies.rectangle(400, 580, 810, 60, {
  isStatic: true,
  friction: 0.5,
});
Matter.Composite.add(world, ground);

// Modificamos el estado que enviamos para incluir el suelo y que el navegador lo dibuje bien
setInterval(() => {
  Matter.Engine.update(engine, 1000 / 30);

  const state = Object.keys(players).map((id) => ({
    id,
    x: players[id].body.position.x,
    y: players[id].body.position.y,
    color: players[id].color,
    type: "player",
  }));

  // También enviamos la posición del suelo para estar seguros
  state.push({
    id: "ground",
    x: ground.position.x,
    y: ground.position.y,
    color: "#555",
    type: "static",
  });

  io.emit("stateUpdate", state);
}, 1000 / 30);

// Guardamos a los jugadores aquí: { socketId: { body, color } }
const players = {};
const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"]; // Rojo, Verde, Azul, Amarillo

io.on("connection", (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

  // Asignar color y crear cuerpo físico
  const playerColor = colors[Object.keys(players).length % colors.length];
  const playerBody = Matter.Bodies.rectangle(400, 100, 40, 40, {
    restitution: 0.1,
    friction: 0.5,
  });

  players[socket.id] = { body: playerBody, color: playerColor };
  Matter.Composite.add(world, playerBody);

  // Enviar confirmación al celular
  socket.emit("init", { color: playerColor });

  // Escuchar movimientos
  socket.on("move", (dir) => {
    // dir puede ser { x: 1, y: 0 } etc.
    const body = players[socket.id].body;
    Matter.Body.setVelocity(body, { x: dir.x * 5, y: body.velocity.y });

    // Salto
    if (dir.y < 0 && Math.abs(body.velocity.y) < 0.1) {
      Matter.Body.setVelocity(body, { x: body.velocity.x, y: -10 });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Jugador desconectado: ${socket.id}`);
    Matter.Composite.remove(world, players[socket.id].body);
    delete players[socket.id];
  });
});

// Loop del juego (30 FPS)
setInterval(() => {
  Matter.Engine.update(engine, 1000 / 30);

  // Enviamos las posiciones de todos a los clientes (para el Host)
  const state = Object.keys(players).map((id) => ({
    id,
    x: players[id].body.position.x,
    y: players[id].body.position.y,
    color: players[id].color,
  }));

  io.emit("stateUpdate", state);
}, 1000 / 30);

app.get("/", (req, res) => {
  res.send("Servidor de Pico Park corriendo OK - Esperando WebSockets");
});

const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
