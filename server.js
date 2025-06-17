const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const Player = require('./classes/Player.js');
const Collectible = require('./classes/Collectible.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// ========================
// 🔐 Seguridad (puntos 16–19)
// ========================

// Eliminar el encabezado real de Express
app.disable('x-powered-by');

// Agregar encabezados manualmente para cumplir los requisitos
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3'); // punto 19
  res.setHeader('X-Content-Type-Options', 'nosniff'); // punto 16
  res.setHeader('X-XSS-Protection', '1; mode=block'); // punto 17
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); // punto 18
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ========================
// 🌐 Archivos estáticos y ruta principal
// ========================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================
// 🕹️ Lógica del juego
// ========================
const players = {};
const collectibles = {};
let nextCollectibleId = 1;

function createCollectible() {
  const item = new Collectible(nextCollectibleId++);
  collectibles[item.id] = item;
  return item;
}

io.on('connection', socket => {
  const player = new Player(socket.id);
  players[socket.id] = player;

  socket.emit('currentPlayers', players);
  socket.emit('collectibles', collectibles);
  socket.broadcast.emit('newPlayer', player);

  socket.on('move', direction => {
    player.movePlayer(direction, 5);
    Object.values(collectibles).forEach(item => {
      if (player.collision(item)) {
        player.score += item.value;
        delete collectibles[item.id];
        createCollectible();
      }
    });
    io.emit('playerMoved', {
      id: socket.id,
      x: player.x,
      y: player.y,
      score: player.score,
      rank: player.calculateRank(Object.values(players))
    });
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

createCollectible();

// ========================
// 🚀 Iniciar el servidor
// ========================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
