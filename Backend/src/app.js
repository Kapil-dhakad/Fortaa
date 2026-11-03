const express = require('express');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/user.route');
const uploadRouter = require('./routes/upload.route');
const dashboardRouter = require('./routes/dashboard.route');
const followRouter = require('./routes/follow.route');
const messageRouter = require('./routes/message.route');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// 1. API routes
app.use('/api/users', userRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/follow', followRouter);
app.use('/api/messages', messageRouter);

// 2. Serve static frontend build files
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// 3. Fallback for React Router (Single Page Application)
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

module.exports = app;
