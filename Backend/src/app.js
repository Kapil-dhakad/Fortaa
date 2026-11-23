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
const notificationRouter = require('./routes/notification.route');
const groupRouter = require('./routes/group.route');
const adminRouter = require('./routes/admin.route');
const storyRouter = require('./routes/story.route');
const supportRouter = require('./routes/support.route');
const accountTypeRouter = require('./routes/accountType.route');
const compression = require('compression');

const app = express();

// High performance Gzip/Brotli compression for all HTTP responses
app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// 1. API routes
app.use('/api/users', userRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/follow', followRouter);
app.use('/api/messages', messageRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/groups', groupRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stories', storyRouter);
app.use('/api/support', supportRouter);
app.use('/api/account-types', accountTypeRouter);

// 1.5 Serve local uploaded files (chat attachments, etc.)
const uploadsDir = path.join(__dirname, '../uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// 2. Serve static frontend build files with browser cache
const buildPath = path.join(__dirname, 'build');
app.use(
  express.static(buildPath, {
    maxAge: '7d',
    etag: true,
    setHeaders: (res, filePath) => {
      // index.html must not be cached aggressively so code updates are picked up instantly
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    },
  })
);

// 3. Fallback for React Router (Single Page Application)
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

module.exports = app;
