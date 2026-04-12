import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertDriveLink(url: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const id = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
    return id ? `https://lh3.googleusercontent.com/d/${id}` : url;
  }
  return url;
}

export function convertDriveVideoLink(url: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const id = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
    return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
  }
  return url;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
