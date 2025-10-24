const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Twilio credentials from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error('⚠️  Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file');
}

// Serve static files
app.use(express.static(__dirname));

// Endpoint to get TURN credentials
app.get('/turn-credentials', async (req, res) => {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Tokens.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    const data = await response.json();
    res.json({ iceServers: data.ice_servers });
  } catch (error) {
    console.error('Error getting TURN credentials:', error);
    res.status(500).json({ error: 'Failed to get TURN credentials' });
  }
});

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
    console.log('Total ready clients:', readyClients.size + 1);
    readyClients.add(socket.id);
    
    // Broadcast ready count to all clients
    io.emit('ready-count', readyClients.size);
    
    // If we have 2 ready clients, tell them to start connecting
    if (readyClients.size === 2) {
      const clientIds = Array.from(readyClients);
      const initiatorId = clientIds[0]; // First client becomes initiator
      console.log('✅ Two clients ready - initiating connection');
      console.log('   Initiator:', initiatorId);
      console.log('   Answerer:', clientIds[1]);
      
      // Send start-call to both, but designate one as initiator
      io.emit('start-call', { initiator: initiatorId });
    } else if (readyClients.size > 2) {
      console.log('⚠️  More than 2 clients ready - this app supports only 2 peers');
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
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 WebRTC Signaling Server running`);
  console.log(`📹 Local access: http://localhost:${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Production URL: ${process.env.APP_URL || 'Set APP_URL env variable'}`);
  } else {
    console.log(`🌐 Network access: http://192.168.1.107:${PORT}`);
    console.log(`\n⚠️  For local network testing:`);
    console.log(`   - Chrome flags: "Insecure origins treated as secure"`);
    console.log(`   - Add: http://192.168.1.107:${PORT}\n`);
  }
  
  console.log(`👥 Ready for connections!\n`);
});
