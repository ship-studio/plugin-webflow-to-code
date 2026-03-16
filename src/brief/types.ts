import type { SiteAnalysis } from '../analysis/types';
import type { AssetManifest } from '../assets/types';

export type BriefMode = 'pixel-perfect' | 'best-site';

export interface BriefInput {
  mode: BriefMode;
  siteAnalysis: SiteAnalysis;
  assetManifest: AssetManifest;
  projectPath: string;
  date?: string;
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
