const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/db/db');
const { setupChatSocket } = require('./src/socket/chat.socket');

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);
setupChatSocket(io);

const PORT = process.env.PORT || 3000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ [Port Conflict]: Port ${PORT} already in use. Server is already running on this port.`);
  } else {
    console.error('❌ Server startup error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT} (with Socket.IO enabled)`);
});
