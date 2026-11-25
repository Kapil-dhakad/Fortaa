const express = require('express');
const router = express.Router();
const { uploadImageMemory, uploadDocument, uploadVideoTemp } = require('../middleware/upload.middleware');
const { processAndUploadImage } = require('../services/image.service');
const { processAndUploadVideo } = require('../services/video.service');

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image (automatically resized & WebP-compressed via Sharp before S3)
 * @query   ?folder=avatars | posts | products | companies | stories
 */
router.post('/image', (req, res) => {
  uploadImageMemory.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided in form field "file"',
      });
    }

    try {
      const folder = req.query.folder || 'images';
      const result = await processAndUploadImage(req.file, folder);

      return res.status(200).json({
        success: true,
        message: result.optimized
          ? 'Image compressed & uploaded successfully'
          : 'Image uploaded successfully',
        url: result.url,
        key: result.key,
        size: result.size,
        mimetype: result.mimetype,
        optimized: result.optimized,
      });
    } catch (uploadErr) {
      console.error('[Image Optimization/Upload Error]:', uploadErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to process and upload image',
        error: uploadErr.message,
      });
    }
  });
});

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images (automatically resized & WebP-compressed via Sharp before S3)
 * @query   ?folder=gallery | products
 */
router.post('/images', (req, res) => {
  uploadImageMemory.array('files', 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Multiple images upload failed',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided in form field "files"',
      });
    }

    try {
      const folder = req.query.folder || 'gallery';
      // Process sequentially to avoid Sharp memory spikes on small EC2 instances
      const uploaded = [];
      for (const file of req.files) {
        uploaded.push(await processAndUploadImage(file, folder));
      }

      return res.status(200).json({
        success: true,
        message: `${uploaded.length} images uploaded successfully`,
        files: uploaded,
      });
    } catch (uploadErr) {
      console.error('[Multiple Image Upload Error]:', uploadErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to process and upload images',
        error: uploadErr.message,
      });
    }
  });
});

/**
 * @route   POST /api/upload/document
 * @desc    Upload documents (business proof, catalog, govt ID)
 * @query   ?folder=business_docs | catalogs | kyc
 */
router.post('/document', (req, res) => {
  uploadDocument.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Document upload failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided in form field "file"',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      url: req.file.location,
      key: req.file.key,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

/**
 * @route   POST /api/upload/video
 * @desc    Upload video for post, reel, or story (automatically compresses & adds faststart if FFmpeg is available)
 * @query   ?folder=videos | posts | stories
 */
router.post('/video', (req, res) => {
  uploadVideoTemp.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Video upload failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided in form field "file"',
      });
    }

    try {
      const folder = req.query.folder || 'videos';
      const result = await processAndUploadVideo(req.file, folder);

      return res.status(200).json({
        success: true,
        message: result.compressed
          ? 'Video compressed & uploaded successfully'
          : 'Video uploaded successfully',
        url: result.url,
        key: result.key,
        size: result.size,
        compressed: result.compressed,
        mimetype: result.mimetype,
      });
    } catch (uploadErr) {
      console.error('[Video Processing/Upload Error]:', uploadErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to process and upload video',
        error: uploadErr.message,
      });
    }
  });
});

module.exports = router;
