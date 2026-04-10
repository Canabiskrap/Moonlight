/**
 * Helper to upload files to Cloudinary using unsigned upload preset.
 * Supports progress tracking via callback.
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Use environment variables or fallback to the values provided by the user
  const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'ddjlfcvq9';
  const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 'my_store_preset';

  if (!cloudName || !uploadPreset || cloudName === 'your_cloud_name_here') {
    throw new Error("يرجى ضبط إعدادات Cloudinary (Cloud Name & Upload Preset)");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        const error = JSON.parse(xhr.responseText);
        reject(new Error(error.error?.message || "فشل الرفع إلى Cloudinary"));
      }
    };

    xhr.onerror = () => reject(new Error("خطأ في الاتصال بـ Cloudinary"));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    xhr.send(formData);
  });
};
