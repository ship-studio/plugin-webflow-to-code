import type { AssetManifest } from '../assets/types';

export type ZipStep =
  | { kind: 'idle' }
  | { kind: 'picking' }
  | { kind: 'extracting'; fileCount: number }
  | { kind: 'validating' }
  | { kind: 'copying'; label: string }
  | { kind: 'done'; zipPath: string; extractDir: string; fileCount: number; assetManifest?: AssetManifest }
  | { kind: 'error'; message: string };

export interface ZipManifest {
  fileCount: number;
  entries: string[];
}

export interface ExtractionResult {
  zipPath: string;
  extractDir: string;
  manifest: ZipManifest;
}
