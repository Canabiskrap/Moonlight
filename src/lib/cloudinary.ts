/**
 * Helper to upload files to Cloudinary using unsigned upload preset.
 * Supports progress tracking via callback.
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Hardcoded fallbacks for the user, supporting both Vite and Next.js prefixes for compatibility
  const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 
                    (import.meta as any).env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
                    'ddjlfcvq9';
  const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 
                       (import.meta as any).env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 
                       'my_store_preset';

  console.log("Using Cloudinary Cloud Name:", cloudName);
  console.log("Using Cloudinary Upload Preset:", uploadPreset);

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
