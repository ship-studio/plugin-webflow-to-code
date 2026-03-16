import type { Shell } from '../types';
import type { SiteAnalysis } from './types';
import { discoverHtmlPages, parsePage } from './parse';
import { detectSharedLayout } from './shared';

/**
 * Top-level site analysis orchestrator.
 *
 * Given a shell, zip entries, and extract directory, this function:
 * 1. Discovers HTML pages from entries
 * 2. Parses each page (with progress callback)
 * 3. Detects shared layout elements
 * 4. Computes content/CMS counts and component union
 *
 * This is the single entry point for Phase 5 brief generation.
 */
export async function buildSiteAnalysis(
  shell: Shell,
  entries: string[],
  extractDir: string,
  onProgress?: (label: string) => void,
): Promise<SiteAnalysis> {
  const htmlFiles = discoverHtmlPages(entries);
  const pages = [];

  for (let i = 0; i < htmlFiles.length; i++) {
    const filename = htmlFiles[i];
    onProgress?.(`Analyzing page ${i + 1}/${htmlFiles.length}...`);
    const htmlPath = extractDir + '/' + filename;
    const page = await parsePage(shell, htmlPath, filename);
    pages.push(page);
  }

  const sharedLayout = detectSharedLayout(pages);
  const contentPageCount = pages.filter((p) => !p.isCmsTemplate).length;
  const cmsTemplateCount = pages.filter((p) => p.isCmsTemplate).length;

  const componentSet = new Set<string>();
  for (const page of pages) {
    for (const comp of page.webflowComponents) {
      componentSet.add(comp.wClass);
    }
  }

  return {
    pages,
    sharedLayout,
    contentPageCount,
    cmsTemplateCount,
    allWebflowComponents: [...componentSet].sort(),
  };
}
