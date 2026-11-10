const express = require('express');
const router = express.Router();
const { uploadImage, uploadDocument, uploadVideo } = require('../middleware/upload.middleware');

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
 * @desc    Upload video for post or reel
 * @query   ?folder=videos | posts
 */
router.post('/video', (req, res) => {
  uploadVideo.single('file')(req, res, (err) => {
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

    return res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      url: req.file.location,
      key: req.file.key,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

module.exports = router;
