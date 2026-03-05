require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sequelize = require('./config/db');
const apiRoutes = require('./routes/api');
const socketHandler = require('./sockets/socketHandler');
const { startSimulation } = require('./simulator/eventSimulator');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS for frontend (adjust origin if needed)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080', // or '*' for testing
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.json());

// Attach io instance to app for route access
app.set('io', io);

// Routes
app.use('/api', apiRoutes);

// Socket events
socketHandler(io);

// Database sync and server start
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database synced');
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      // Start simulation every 3 seconds
      startSimulation(3000);
      console.log('✅ Event simulation started (every 3s)');
    });
  })
  .catch(err => {
    console.error('❌ Database sync error:', err);
  });