export type ZipStep =
  | { kind: 'idle' }
  | { kind: 'picking' }
  | { kind: 'extracting'; fileCount: number }
  | { kind: 'validating' }
  | { kind: 'done'; zipPath: string; extractDir: string; fileCount: number }
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
