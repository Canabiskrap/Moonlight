export const convertDriveLink = (url: string) => {
  if (!url || !url.includes('drive.google.com')) return url;
  
  let id = '';
  const dMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  
  if (dMatch) id = dMatch[1];
  else if (idMatch) id = idMatch[1];
  
  if (id) {
    // Thumbnail URL is often more reliable for direct embedding in <img> tags
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
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
