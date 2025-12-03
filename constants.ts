export const MAX_FILE_SIZE_MB = 50; // 50MB limit for demo
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// Gemini Models
export const GEMINI_MODEL_IMAGE_DESC = 'gemini-2.5-flash'; // For quick analysis
export const GEMINI_MODEL_VIDEO = 'veo-3.1-fast-generate-preview'; // For video enhancement/generation

export const API_KEY = process.env.API_KEY || ''; // Injected by environment