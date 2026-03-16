export type AssetType = 'image' | 'video' | 'font' | 'svg' | 'animation';

export interface ImageEntry {
  filename: string;
  path: string;
  type: 'image' | 'svg' | 'animation';
  purpose: string;
  variants?: string[];
  referencingPages: string[];
}

export interface VideoEntry {
  filename: string;
  path: string;
  type: 'video';
  purpose: 'video';
  transcodes?: string[];
  poster?: string;
  referencingPages: string[];
}

export interface FontEntry {
  filename: string;
  path: string;
  type: 'font';
  purpose: 'font';
  referencingPages: string[];
}

export interface AssetManifest {
  images: ImageEntry[];
  videos: VideoEntry[];
  fonts: FontEntry[];
  cssFiles: string[];
  totalCopied: number;
}
