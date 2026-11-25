const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');
const os = require('os');
const s3 = require('../config/s3');

const CACHE_CONTROL_HEADER = 'public, max-age=31536000, immutable';

// S3 Storage setup for images (direct S3 fallback)
const imageStorage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET || 'fortaa-media-storage',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  cacheControl: CACHE_CONTROL_HEADER,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const folder = req.query.folder || 'images';
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueKey = `${folder}/${Date.now()}-${cleanName}${ext}`;
    cb(null, uniqueKey);
  },
});

// Image file filter
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'image/avif',
  ];

  const hasImageExt = /\.(jpe?g|png|webp|gif|svg|heic|heif|avif|bmp)$/i.test(file.originalname || '');
  if (
    allowedMimeTypes.includes((file.mimetype || '').toLowerCase()) ||
    (file.mimetype && file.mimetype.startsWith('image/')) ||
    hasImageExt
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, PNG, WEBP, GIF, and SVG images are allowed!'), false);
  }
};

// Multer upload instances
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: imageFileFilter,
});

// In-memory multer instance so Sharp can resize & convert images before S3 upload
const uploadImageMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: imageFileFilter,
});

// Document storage setup (for PDF, docs, catalogs, IDs)
const documentStorage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET || 'fortaa-media-storage',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  cacheControl: CACHE_CONTROL_HEADER,
  key: (req, file, cb) => {
    const folder = req.query.folder || 'documents';
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueKey = `${folder}/${Date.now()}-${cleanName}${ext}`;
    cb(null, uniqueKey);
  },
});

const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, DOC, DOCX, JPG, and PNG documents are allowed!'), false);
  }
};

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: documentFileFilter,
});

// Video storage setup
const videoStorage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET || 'fortaa-media-storage',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  cacheControl: CACHE_CONTROL_HEADER,
  key: (req, file, cb) => {
    const folder = req.query.folder || 'videos';
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueKey = `${folder}/${Date.now()}-${cleanName}${ext}`;
    cb(null, uniqueKey);
  },
});

const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/ogg',
    'video/3gpp',
    'video/mpeg',
  ];

  if (allowedMimeTypes.includes(file.mimetype) || (file.mimetype && file.mimetype.startsWith('video/'))) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only MP4, WebM, MOV, and AVI videos are allowed!'), false);
  }
};

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
  fileFilter: videoFileFilter,
});

// Temporary disk storage for incoming videos so they can be compressed & faststart-optimized before S3
const videoTempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(os.tmpdir(), 'fortaa-video-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `raw-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  },
});

const uploadVideoTemp = multer({
  storage: videoTempStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
  fileFilter: videoFileFilter,
});

module.exports = {
  uploadImage,
  uploadImageMemory,
  uploadDocument,
  uploadVideo,
  uploadVideoTemp,
};
