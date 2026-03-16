import type { Shell } from '../types';
import type { PageInfo, SectionItem } from './types';
import { detectComponents, detectInteractions } from './webflow';

/**
 * Filter ZipManifest entries to only .html files,
 * excluding directories and __MACOSX artifacts.
 */
export function discoverHtmlPages(entries: string[]): string[] {
  return entries.filter(
    (e) => e.endsWith('.html') && !e.endsWith('/') && !e.startsWith('__MACOSX'),
  );
}

/**
 * Convert a filename to a URL route.
 * - index.html -> /
 * - about.html -> /about
 * - legal/terms-of-service.html -> /legal/terms-of-service
 * - detail_post.html -> /post/[slug]
 */
export function inferRoute(filename: string): string {
  // Handle detail_ CMS pattern first
  if (filename.startsWith('detail_')) {
    const base = filename.replace(/\.html$/, '').replace(/^detail_/, '');
    return `/${base}/[slug]`;
  }

  const stripped = filename.replace(/\.html$/, '');

  // index -> /
  if (stripped === 'index') return '/';

  return `/${stripped}`;
}

/**
 * Detect CMS template pages via three signals:
 * 1. detail_ filename prefix
 * 2. w-dyn-bind-empty class in DOM
 * 3. Title starting with |
 */
export function detectCmsTemplate(filename: string, doc: Document): boolean {
  if (filename.startsWith('detail_')) return true;
  if (doc.querySelector('.w-dyn-bind-empty')) return true;
  const title = doc.querySelector('title')?.textContent ?? '';
  if (title.startsWith('|')) return true;
  return false;
}

/**
 * Extract a semantic label from Webflow section class names.
 * Patterns: section_hero, footer_component, header_main
 */
export function inferSectionLabel(className: string): string {
  const classes = className.split(/\s+/);
  for (const cls of classes) {
    const sectionMatch = cls.match(/^section_(\w+)/);
    if (sectionMatch) return sectionMatch[1];

    if (cls.startsWith('footer_')) return 'footer';
    if (cls.startsWith('header_')) return 'header';
  }
  return 'section';
}

const UTILITY_PAGES = ['401.html', '404.html'];

function isUtilityPage(filename: string): boolean {
  if (UTILITY_PAGES.includes(filename)) return true;
  if (filename.includes('style-guide')) return true;
  return false;
}

/**
 * Parse a single HTML page from the extracted zip.
 * Reads HTML via shell base64 encoding, parses with DOMParser,
 * and extracts all PageInfo fields.
 */
export async function parsePage(
  shell: Shell,
  htmlPath: string,
  filename: string,
): Promise<PageInfo> {
  const { stdout } = await shell.exec('bash', ['-c', `base64 < '${htmlPath}'`]);
  const html = atob(stdout.trim());
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.querySelector('title')?.textContent ?? '';
  const wfPageId = doc.documentElement.getAttribute('data-wf-page') ?? '';

  // Extract sections
  const sectionEls = doc.querySelectorAll(
    'section[class*="section_"], header[class*="section_"], header[class*="header_"], div[class*="section_"], footer[class*="footer_"]',
  );

  const sections: SectionItem[] = [];
  sectionEls.forEach((el) => {
    sections.push({
      tag: el.tagName.toLowerCase(),
      className: el.className,
      label: inferSectionLabel(el.className),
    });
  });

  // Nav and footer wfIds for shared layout detection
  const navWfId = doc.querySelector('.w-nav')?.getAttribute('data-w-id') ?? null;
  const footerWfId =
    doc.querySelector('footer')?.getAttribute('data-w-id') ??
    doc.querySelector('[class*="footer_"]')?.getAttribute('data-w-id') ??
    null;

  return {
    filename,
    route: inferRoute(filename),
    title,
    wfPageId,
    isCmsTemplate: detectCmsTemplate(filename, doc),
    isUtilityPage: isUtilityPage(filename),
    sections,
    webflowComponents: detectComponents(doc),
    hasIx2Interactions: detectInteractions(doc),
    navWfId,
    footerWfId,
  };
}
