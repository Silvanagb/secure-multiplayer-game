const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const helmet = require('helmet');
const path = require('path');

const Player = require('./classes/Player');
const Collectible = require('./classes/Collectible');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Seguridad requerida por freeCodeCamp
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));

app.use(express.static(path.join(__dirname, 'public')));

const players = {};
const collectibles = {};
let nextCollectibleId = 1;

function createCollectible() {
  const item = new Collectible(nextCollectibleId++);
  collectibles[item.id] = item;
  return item;
}

io.on('connection', (socket) => {
  const player = new Player(socket.id);
  players[socket.id] = player;

  socket.emit('currentPlayers', players);
  socket.emit('collectibles', collectibles);
