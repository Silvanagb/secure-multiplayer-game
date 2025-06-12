const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const helmet = require('helmet');
const path = require('path');

const Player = require('./classes/Player.js');
const Collectible = require('./classes/Collectible.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// * Seguridad *

// Solo ocultar “X-Powered-By” (no usar setTo siempre)
app.use(helmet.hidePoweredBy());

// Evitar que el navegador adivine el tipo MIME (req. 16)
app.use(helmet.noSniff());

// Prevención de XSS básico (req. 17)
app.use(helmet.xssFilter());

// Cache cero (req. 18)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// No uso expreso de contentSecurityPolicy pero Helmet ya lo incluye con defaults.
app.use(helmet());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Datos del juego
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
