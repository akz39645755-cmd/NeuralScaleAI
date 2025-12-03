export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum ProcessStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export enum OutputFormat {
  ORIGINAL = 'original',
  JPG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
}

export interface MediaItem {
  id: string;
  file: File;
  type: FileType;
  previewUrl: string;
  processedUrl?: string;
  status: ProcessStatus;
  progress: number; // 0 to 100
  error?: string;
  metadata?: {
    originalSize: string;
    dimensions: string;
    mimeType: string;
    aiDescription?: string;
    scale?: number;
  };
}

export interface ProcessingConfig {
  scale: 2 | 4 | 8 | 16;
  enhanceFace: boolean;
  denoise: boolean;
}