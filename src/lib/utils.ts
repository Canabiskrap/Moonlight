export const convertDriveLink = (url: string) => {
  if (!url || !url.includes('drive.google.com')) return url;
  
  let id = '';
  // Improved regex to catch IDs more reliably
  const dMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  
  if (dMatch) id = dMatch[1];
  else if (idMatch) id = idMatch[1];
  
  if (id) {
    // Using the uc?export=view format which is widely used for direct embedding
    return `https://drive.google.com/uc?export=view&id=${id}`;
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
