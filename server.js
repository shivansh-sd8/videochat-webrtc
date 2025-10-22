const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(__dirname));

// Store connected clients and their ready status
const clients = new Map();
const readyClients = new Set();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  clients.set(socket.id, socket);

  // Broadcast current number of clients
  io.emit('user-count', clients.size);

  // Handle client ready (camera started)
  socket.on('ready', () => {
    console.log('Client ready:', socket.id);
    readyClients.add(socket.id);
    
    // If we have 2 ready clients, tell them to start connecting
    if (readyClients.size === 2) {
      const clientIds = Array.from(readyClients);
      const initiatorId = clientIds[0]; // First client becomes initiator
      console.log('Two clients ready - initiating connection. Initiator:', initiatorId);
      
      // Send start-call to both, but designate one as initiator
      io.emit('start-call', { initiator: initiatorId });
    }
  });

  // Handle offer
  socket.on('offer', (data) => {
    console.log('Offer received from', socket.id);
    socket.broadcast.emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  // Handle answer
  socket.on('answer', (data) => {
    console.log('Answer received from', socket.id);
    socket.broadcast.emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    console.log('ICE candidate received from', socket.id);
    socket.broadcast.emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clients.delete(socket.id);
    readyClients.delete(socket.id);
    io.emit('user-count', clients.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 WebRTC Signaling Server running`);
  console.log(`📹 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.1.107:${PORT}`);
  console.log(`\n⚠️  IMPORTANT: For camera access on other devices:`);
  console.log(`   - On the OTHER device, open Chrome and go to: chrome://flags`);
  console.log(`   - Search for "Insecure origins treated as secure"`);
  console.log(`   - Add: http://192.168.1.107:${PORT}`);
  console.log(`   - Restart Chrome\n`);
});
