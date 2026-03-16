import type { AssetManifest } from '../assets/types';
import type { SiteAnalysis } from '../analysis/types';
import type { BriefResult } from '../brief/types';

export type ZipStep =
  | { kind: 'idle' }
  | { kind: 'picking' }
  | { kind: 'extracting'; fileCount: number }
  | { kind: 'validating' }
  | { kind: 'copying'; label: string }
  | { kind: 'analyzing'; pageCount: number }
  | { kind: 'generating' }
  | { kind: 'done'; zipPath: string; extractDir: string; fileCount: number; assetManifest?: AssetManifest; siteAnalysis?: SiteAnalysis; briefResult?: BriefResult }
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
