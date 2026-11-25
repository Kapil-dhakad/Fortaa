const path = require('path');
const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');
const { getMediaUrl } = require('./video.service');

// Keep Sharp memory footprint small on low-RAM EC2 instances
sharp.cache(false);
sharp.concurrency(1);

const CACHE_CONTROL_HEADER = 'public, max-age=31536000, immutable';

/**
 * Resize & convert uploaded raster images to lightweight WebP using Sharp,
 * then upload to AWS S3 with long-lived Cache-Control headers.
 * SVGs and animated GIFs pass through untouched while still receiving Cache-Control.
 *
 * @param {Express.Multer.File} file - Multer memory file object
 * @param {string} folder - S3 folder prefix (e.g. 'avatars', 'posts', 'stories')
 * @returns {Promise<{url: string, key: string, size: number, mimetype: string, optimized: boolean}>}
 */
async function processAndUploadImage(file, folder = 'images') {
  const bucket = process.env.AWS_S3_BUCKET || 'fortaa-media-storage';
  const cleanFolder = (folder || 'images').replace(/[^a-zA-Z0-9_/-]/g, '') || 'images';
  const origExt = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const cleanName = path
    .basename(file.originalname || 'image', origExt)
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const isPassthrough =
    file.mimetype === 'image/svg+xml' ||
    file.mimetype === 'image/gif' ||
    origExt === '.svg' ||
    origExt === '.gif';

  let outputBuffer = file.buffer;
  let outputExt = origExt;
  let outputMime = file.mimetype || 'image/jpeg';
  let optimized = false;

  if (!isPassthrough && file.buffer && file.buffer.length > 0) {
    try {
      const isAvatar = cleanFolder === 'avatars' || cleanFolder === 'profile';
      const maxWidth = isAvatar ? 400 : 1280;
      const maxHeight = isAvatar ? 400 : 1920;

      const webpBuffer = await sharp(file.buffer)
        .rotate()
        .resize({
          width: maxWidth,
          height: maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: isAvatar ? 82 : 82, effort: 4 })
        .toBuffer();

      // Use compressed WebP unless original was already smaller (e.g. tiny icon)
      if (webpBuffer.length < file.buffer.length || file.buffer.length > 80 * 1024) {
        outputBuffer = webpBuffer;
        outputExt = '.webp';
        outputMime = 'image/webp';
        optimized = true;
      }
    } catch (err) {
      console.warn('[Image Optimization Warning]: Sharp failed, uploading original image:', err.message);
    }
  }

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const targetKey = `${cleanFolder}/${uniqueSuffix}-${cleanName}${outputExt}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: targetKey,
      Body: outputBuffer,
      ContentType: outputMime,
      CacheControl: CACHE_CONTROL_HEADER,
      Metadata: {
        fieldname: file.fieldname || 'file',
      },
    })
  );

  return {
    url: getMediaUrl(targetKey),
    key: targetKey,
    size: outputBuffer.length,
    mimetype: outputMime,
    optimized,
  };
}

module.exports = {
  processAndUploadImage,
  CACHE_CONTROL_HEADER,
};
