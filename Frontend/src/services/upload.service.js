import toast from 'react-hot-toast';

const API_BASE = '/api/upload';

/**
 * Client-side canvas compression & resize before upload so large camera photos (3-15 MB)
 * shrink to ~80-180 KB (or ~20 KB for avatars) before leaving the user's device.
 */
async function compressImageBeforeUpload(file, folder = 'images') {
  if (!file || typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  const skipTypes = ['image/svg+xml', 'image/gif'];
  if (skipTypes.includes(file.type) || file.size <= 45 * 1024) {
    return file;
  }

  try {
    const isAvatar = folder === 'avatars' || folder === 'profile';
    const maxDim = isAvatar ? 400 : 1280;
    const quality = isAvatar ? 0.82 : 0.84;

    const imgUrl = URL.createObjectURL(file);
    let img;
    try {
      img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = imgUrl;
      });
    } finally {
      URL.revokeObjectURL(imgUrl);
    }

    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => {
          if (b) return resolve(b);
          canvas.toBlob((jb) => resolve(jb), 'image/jpeg', quality);
        },
        'image/webp',
        quality
      );
    });

    if (blob && blob.size > 0 && blob.size < file.size) {
      const ext = blob.type === 'image/webp' ? '.webp' : '.jpg';
      const base = (file.name || 'image').replace(/\.[^/.]+$/, '');
      return new File([blob], `${base}${ext}`, {
        type: blob.type,
        lastModified: Date.now(),
      });
    }
  } catch (err) {
    console.warn('[Client Image Compression Skipped]:', err);
  }
  return file;
}

async function handleUploadResponse(response, defaultErrorMsg = 'Upload failed') {
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('File size is too large (Maximum allowed is 25MB).');
    }
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      throw new Error(data.message || defaultErrorMsg);
    } catch (e) {
      if (e.message && !e.message.includes('JSON')) {
        throw e;
      }
      throw new Error(`${defaultErrorMsg} (Server returned ${response.status})`);
    }
  }
  return await response.json();
}

/**
 * Upload single image to S3 via backend
 * @param {File} file - The file object from <input type="file" />
 * @param {string} folder - Destination subfolder (e.g. 'avatars', 'posts', 'products', 'companies')
 * @returns {Promise<string|null>} S3 public image URL or null
 */
export async function uploadSingleImage(file, folder = 'images') {
  if (!file) return null;

  // const toastId = toast.loading('Uploading image...');
  try {
    const optimizedFile = await compressImageBeforeUpload(file, folder);
    const formData = new FormData();
    formData.append('file', optimizedFile);

    const response = await fetch(`${API_BASE}/image?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });

    const data = await handleUploadResponse(response, 'Image upload failed');

    // toast.success('Image uploaded successfully!', { id: toastId });
    return data.url;
  } catch (error) {
    // toast.error(error.message || 'Failed to upload image', { id: toastId });
    return null;
  }
}

/**
 * Upload single video to S3 via backend
 * @param {File} file - The file object from <input type="file" />
 * @param {string} folder - Destination subfolder (e.g. 'videos', 'posts')
 * @returns {Promise<string|null>} S3 public video URL or null
 */
export async function uploadSingleVideo(file, folder = 'videos') {
  if (!file) return null;

  // const toastId = toast.loading('Uploading video (this may take a few moments)...');
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/video?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });

    const data = await handleUploadResponse(response, 'Video upload failed');

    // toast.success('Video uploaded successfully! 🎬', { id: toastId });
    return data.url;
  } catch (error) {
    // toast.error(error.message || 'Failed to upload video', { id: toastId });
    return null;
  }
}

/**
 * Upload multiple images to S3
 * @param {FileList|File[]} files - Array or FileList of image files
 * @param {string} folder - Destination subfolder
 * @returns {Promise<Array|null>} Array of uploaded file objects with URLs
 */
export async function uploadMultipleImages(files, folder = 'gallery') {
  if (!files || files.length === 0) return null;

  // const toastId = toast.loading(`Uploading ${files.length} images...`);
  try {
    const optimizedFiles = await Promise.all(
      Array.from(files).map((f) => compressImageBeforeUpload(f, folder))
    );
    const formData = new FormData();
    for (let i = 0; i < optimizedFiles.length; i++) {
      formData.append('files', optimizedFiles[i]);
    }

    const response = await fetch(`${API_BASE}/images?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });

    const data = await handleUploadResponse(response, 'Multiple upload failed');

    // toast.success(`${data.files.length} images uploaded!`, { id: toastId });
    return data.files;
  } catch (error) {
    // toast.error(error.message || 'Failed to upload images', { id: toastId });
    return null;
  }
}

/**
 * Upload a document (PDF, DOCX, ID proof) to S3
 * @param {File} file - Document file
 * @param {string} folder - Destination subfolder ('business_docs', 'kyc', 'catalogs')
 * @returns {Promise<string|null>} S3 public document URL or null
 */
export async function uploadDocument(file, folder = 'documents') {
  if (!file) return null;

  // const toastId = toast.loading('Uploading document...');
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/document?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });

    const data = await handleUploadResponse(response, 'Document upload failed');

    // toast.success('Document uploaded successfully!', { id: toastId });
    return data.url;
  } catch (error) {
    // toast.error(error.message || 'Failed to upload document', { id: toastId });
    return null;
  }
}
