import type { SiteAnalysis } from '../analysis/types';
import type { AssetManifest } from '../assets/types';

export type BriefMode = 'pixel-perfect' | 'best-site';

export type PreserveOption =
  | 'brand-colors'
  | 'visual-hierarchy'
  | 'exact-layouts'
  | 'animations'
  | 'image-treatment';

export const PRESERVE_OPTIONS: { key: PreserveOption; label: string }[] = [
  { key: 'brand-colors', label: 'Brand colors & typography' },
  { key: 'visual-hierarchy', label: 'Visual hierarchy & spacing' },
  { key: 'exact-layouts', label: 'Exact layouts (grid/flex)' },
  { key: 'animations', label: 'Animations & interactions' },
  { key: 'image-treatment', label: 'Image treatment & sizing' },
];

export const DEFAULT_PRESERVE: Set<PreserveOption> = new Set([
  'brand-colors',
  'visual-hierarchy',
  'image-treatment',
]);

export interface BriefInput {
  mode: BriefMode;
  siteAnalysis: SiteAnalysis;
  assetManifest: AssetManifest;
  projectPath: string;
  date?: string;
  preserve?: Set<PreserveOption>;
  customNotes?: string;
}

export interface BriefStats {
  pageCount: number;
  contentPageCount: number;
  cmsTemplateCount: number;
  assetCount: number;
  estimatedTokens: number;
}

export interface BriefResult {
  markdown: string;
  charCount: number;
  estimatedTokens: number;
  stats: BriefStats;
}
