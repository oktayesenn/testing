const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
});

const players = new Map();
const foods = {
  position: { x: 5, y: 0, z: 0 },
  isBonus: false
};

function generateFood() {
  return {
    position: {
      x: Math.floor(Math.random() * 20 - 10),
      y: 0,
      z: Math.floor(Math.random() * 20 - 10)
    },
    isBonus: Math.random() < 0.2 // 20% chance for bonus food
  };
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join', (nickname) => {
    players.set(socket.id, {
      id: socket.id,
      nickname,
      positions: [{ x: 0, y: 0, z: 0 }],
      score: 0
    });
    
    io.emit('players', Array.from(players.values()));
    socket.emit('foodUpdate', foods);
  });

  socket.on('updatePosition', (positions) => {
    const player = players.get(socket.id);
    if (player) {
      player.positions = positions;
      io.emit('players', Array.from(players.values()));
    }
  });

  socket.on('eatFood', () => {
    const player = players.get(socket.id);
    if (player) {
      player.score += foods.isBonus ? 3 : 1;
      foods = generateFood();
      io.emit('foodUpdate', foods);
      io.emit('players', Array.from(players.values()));
    }
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    io.emit('players', Array.from(players.values()));
  });
});

http.listen(3001, () => {
  console.log('Server running on port 3001');
}); 