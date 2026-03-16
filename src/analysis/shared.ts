import type { PageInfo, SharedLayout } from './types';

/**
 * Detect shared layout elements (nav, footer) across pages.
 *
 * Primary detection uses data-w-id frequency (high confidence).
 * Fallback detection uses className frequency (medium confidence).
 * CMS template pages are excluded from threshold calculation.
 */
export function detectSharedLayout(pages: PageInfo[]): SharedLayout {
  const contentPages = pages.filter((p) => !p.isCmsTemplate);

  // Edge case: fewer than 2 content pages — can't determine shared layout
  if (contentPages.length < 2) {
    return {
      hasSharedNav: false,
      navWfId: undefined,
      hasSharedFooter: false,
      footerWfId: undefined,
      confidence: 'high',
    };
  }

  const threshold = Math.ceil(contentPages.length * 0.5);

  // --- Nav detection ---
  const navResult = detectSharedElement(
    contentPages,
    (p) => p.navWfId,
    (p) => p.navClassName,
    threshold,
  );

  // --- Footer detection ---
  const footerResult = detectSharedElement(
    contentPages,
    (p) => p.footerWfId,
    (p) => p.footerClassName,
    threshold,
  );

  // Overall confidence is the lowest of the two detections
  let confidence: 'high' | 'medium' = 'high';
  if (
    (navResult.found && navResult.confidence === 'medium') ||
    (footerResult.found && footerResult.confidence === 'medium')
  ) {
    confidence = 'medium';
  }

  return {
    hasSharedNav: navResult.found,
    navWfId: navResult.id,
    hasSharedFooter: footerResult.found,
    footerWfId: footerResult.id,
    confidence,
  };
}

/**
 * Detect a shared element by ID frequency, falling back to className frequency.
 */
function detectSharedElement(
  pages: PageInfo[],
  getId: (p: PageInfo) => string | null,
  getClassName: (p: PageInfo) => string | null,
  threshold: number,
): { found: boolean; id: string | undefined; confidence: 'high' | 'medium' } {
  // Primary: data-w-id frequency
  const idCounts = new Map<string, number>();
  for (const page of pages) {
    const id = getId(page);
    if (id !== null) {
      idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }
  }

  for (const [id, count] of idCounts) {
    if (count >= threshold) {
      return { found: true, id, confidence: 'high' };
    }
  }

  // Fallback: className frequency
  const classCounts = new Map<string, number>();
  for (const page of pages) {
    const cls = getClassName(page);
    if (cls !== null) {
      classCounts.set(cls, (classCounts.get(cls) ?? 0) + 1);
    }
  }

  for (const [, count] of classCounts) {
    if (count >= threshold) {
      return { found: true, id: undefined, confidence: 'medium' };
    }
  }

  return { found: false, id: undefined, confidence: 'high' };
}
