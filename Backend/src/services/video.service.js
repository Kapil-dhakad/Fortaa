const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync, spawn } = require('child_process');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');
require('dotenv').config();

/**
 * Check if FFmpeg is installed and available in the system PATH
 */
function isFfmpegAvailable() {
  try {
    const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Get public URL for an S3 object (uses CloudFront CDN if configured, else direct S3)
 */
function getMediaUrl(key) {
  const cdn = (process.env.AWS_CLOUDFRONT_URL || '').trim().replace(/\/$/, '');
  if (cdn) {
    return `${cdn}/${key}`;
  }
  const bucket = process.env.AWS_S3_BUCKET || 'fortaa-media-storage';
  const region = process.env.AWS_REGION || 'ap-south-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Compress video using FFmpeg:
 * - Scale down to max 720p width (maintains aspect ratio)
 * - H.264 video codec with CRF 26 for crisp quality at 80% lower file size
 * - AAC audio codec at 128kbps
 * - -movflags +faststart (Crucial: moves moov atom to front for instant web playback)
 */
function compressVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', inputPath,
      '-vf', "scale='min(720,iw)':-2",
      '-c:v', 'libx264',
      '-crf', '26',
      '-preset', 'fast',
      '-maxrate', '1800k',
      '-bufsize', '3600k',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y', outputPath,
    ];

    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let errorLog = '';

    if (proc.stderr) {
      proc.stderr.on('data', (d) => {
        errorLog += d.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${errorLog.slice(-300)}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Process uploaded video:
 * 1. If FFmpeg available: Compress & optimize with faststart
 * 2. Upload to AWS S3
 * 3. Clean up temp files
 * 4. Return public/CDN URL
 */
async function processAndUploadVideo(file, folder = 'videos') {
  const bucket = process.env.AWS_S3_BUCKET || 'fortaa-media-storage';
  const cleanOriginalName = (file.originalname || 'video')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetKey = `${folder}/${Date.now()}-${cleanOriginalName}.mp4`;

  let finalFilePath = file.path;
  let compressed = false;
  let finalSize = file.size;
  const tempOutputDir = os.tmpdir();
  const tempOutputPath = path.join(tempOutputDir, `opt-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);

  if (isFfmpegAvailable()) {
    try {
      console.log(`[Video Compression]: Starting FFmpeg compression for ${file.originalname} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);
      await compressVideo(file.path, tempOutputPath);

      const stats = fs.statSync(tempOutputPath);
      finalFilePath = tempOutputPath;
      finalSize = stats.size;
      compressed = true;

      const savedPercent = (((file.size - finalSize) / file.size) * 100).toFixed(1);
      console.log(`[Video Compression]: Completed! ${(file.size / (1024 * 1024)).toFixed(2)} MB -> ${(finalSize / (1024 * 1024)).toFixed(2)} MB (Saved ${savedPercent}%) with +faststart`);
    } catch (ffmpegErr) {
      console.warn('[Video Compression Warning]: FFmpeg compression failed, uploading original video as fallback:', ffmpegErr.message);
      finalFilePath = file.path;
      finalSize = file.size;
    }
  } else {
    console.log('[Video Compression Info]: FFmpeg not detected on host system. Uploading original file. (Install FFmpeg via "sudo apt install ffmpeg" on EC2 to enable automatic 80% compression).');
  }

  // Upload to S3
  try {
    const fileStream = fs.createReadStream(finalFilePath);
    const uploadParams = {
      Bucket: bucket,
      Key: targetKey,
      Body: fileStream,
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=31536000, immutable',
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const finalUrl = getMediaUrl(targetKey);

    return {
      success: true,
      url: finalUrl,
      key: targetKey,
      size: finalSize,
      compressed,
      mimetype: 'video/mp4',
    };
  } finally {
    // Clean up temporary files safely
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch {}
    try {
      if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    } catch {}
  }
}

module.exports = {
  isFfmpegAvailable,
  getMediaUrl,
  compressVideo,
  processAndUploadVideo,
};
