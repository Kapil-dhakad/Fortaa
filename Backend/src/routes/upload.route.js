const express = require('express');
const router = express.Router();
const { uploadImage, uploadDocument, uploadVideo, uploadVideoTemp } = require('../middleware/upload.middleware');
const { processAndUploadVideo } = require('../services/video.service');

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image (avatar, logo, product image, post image)
 * @query   ?folder=avatars | posts | products | companies
 */
router.post('/image', (req, res) => {
  uploadImage.single('file')(req, res, (err) => {
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

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: req.file.location,
      key: req.file.key,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images (gallery, multiple products)
 * @query   ?folder=gallery | products
 */
router.post('/images', (req, res) => {
  uploadImage.array('files', 10)(req, res, (err) => {
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

    const uploaded = req.files.map((file) => ({
      url: file.location,
      key: file.key,
      size: file.size,
    }));

    return res.status(200).json({
      success: true,
      message: `${uploaded.length} images uploaded successfully`,
      files: uploaded,
    });
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
