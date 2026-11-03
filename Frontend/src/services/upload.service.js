import toast from 'react-hot-toast';

const API_BASE = '/api/upload';

/**
 * Upload single image to S3 via backend
 * @param {File} file - The file object from <input type="file" />
 * @param {string} folder - Destination subfolder (e.g. 'avatars', 'posts', 'products', 'companies')
 * @returns {Promise<string|null>} S3 public image URL or null
 */
export async function uploadSingleImage(file, folder = 'images') {
  if (!file) return null;

  const toastId = toast.loading('Uploading image to S3...');
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/image?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Image upload failed');
    }

    toast.success('Image uploaded successfully!', { id: toastId });
    return data.url;
  } catch (error) {
    toast.error(error.message || 'Failed to upload image', { id: toastId });
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

  const toastId = toast.loading(`Uploading ${files.length} images to S3...`);
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await fetch(`${API_BASE}/images?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    toast.success(`${data.files.length} images uploaded!`, { id: toastId });
    return data.files;
  } catch (error) {
    toast.error(error.message || 'Failed to upload images', { id: toastId });
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

  const toastId = toast.loading('Uploading document...');
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/document?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Document upload failed');
    }

    toast.success('Document uploaded successfully!', { id: toastId });
    return data.url;
  } catch (error) {
    toast.error(error.message || 'Failed to upload document', { id: toastId });
    return null;
  }
}
