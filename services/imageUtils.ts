import { OutputFormat } from '../types';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Converts a Blob/File to a specific image format using HTML5 Canvas.
 * This runs entirely in the browser, saving server CPU.
 */
export const convertImageFormat = async (
  imageUrl: string,
  format: OutputFormat,
  quality: number = 0.92
): Promise<Blob> => {
  if (format === OutputFormat.ORIGINAL) {
    const response = await fetch(imageUrl);
    return await response.blob();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS if loading from external URL
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Conversion failed'));
        },
        format,
        quality
      );
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};