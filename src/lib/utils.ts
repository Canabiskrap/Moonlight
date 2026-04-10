export const convertDriveLink = (url: string) => {
  if (!url || !url.includes('drive.google.com')) return url;
  
  // Handle /file/d/ID/view or /open?id=ID
  let id = '';
  const match = url.match(/\/file\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
  if (match) id = match[1];
  
  if (id) {
    // This is the direct link format for images in Google Drive
    return `https://lh3.googleusercontent.com/u/0/d/${id}`;
  }
  return url;
};

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
