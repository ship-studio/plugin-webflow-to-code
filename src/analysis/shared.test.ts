// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import type { PageInfo } from './types';
import { detectSharedLayout } from './shared';

function makePage(overrides: Partial<PageInfo> = {}): PageInfo {
  return {
    filename: 'page.html',
    route: '/page',
    title: 'Page',
    wfPageId: 'wf-123',
    isCmsTemplate: false,
    isUtilityPage: false,
    sections: [],
    webflowComponents: [],
    hasIx2Interactions: false,
    navWfId: null,
    footerWfId: null,
    navClassName: null,
    footerClassName: null,
    ...overrides,
  };
}

describe('detectSharedLayout', () => {
  it('detects shared nav when same navWfId appears on >50% of non-CMS pages', () => {
    const pages = [
      makePage({ filename: 'index.html', navWfId: 'abc-123' }),
      makePage({ filename: 'about.html', navWfId: 'abc-123' }),
      makePage({ filename: 'contact.html', navWfId: 'abc-123' }),
      makePage({ filename: 'blog.html', navWfId: 'abc-123' }),
      makePage({ filename: 'pricing.html', navWfId: 'xyz-999' }),
    ];

    const result = detectSharedLayout(pages);
    expect(result.hasSharedNav).toBe(true);
    expect(result.navWfId).toBe('abc-123');
    expect(result.confidence).toBe('high');
  });

  it('detects shared footer when same footerWfId appears on >50% of non-CMS pages', () => {
    const pages = [
      makePage({ filename: 'index.html', footerWfId: 'def-456' }),
      makePage({ filename: 'about.html', footerWfId: 'def-456' }),
      makePage({ filename: 'contact.html', footerWfId: 'def-456' }),
      makePage({ filename: 'blog.html', footerWfId: 'other-789' }),
      makePage({ filename: 'pricing.html', footerWfId: 'def-456' }),
    ];

    const result = detectSharedLayout(pages);
    expect(result.hasSharedFooter).toBe(true);
    expect(result.footerWfId).toBe('def-456');
    expect(result.confidence).toBe('high');
  });

  it('returns hasSharedNav false when navWfId below 50% threshold', () => {
    const pages = [
      makePage({ filename: 'index.html', navWfId: 'abc-123' }),
      makePage({ filename: 'about.html', navWfId: 'other-1' }),
      makePage({ filename: 'contact.html', navWfId: 'other-2' }),
      makePage({ filename: 'blog.html', navWfId: 'other-3' }),
      makePage({ filename: 'pricing.html', navWfId: 'other-4' }),
    ];

    const result = detectSharedLayout(pages);
    expect(result.hasSharedNav).toBe(false);
  });

  it('falls back to navClassName with medium confidence when no navWfId meets threshold', () => {
    const pages = [
      makePage({ filename: 'index.html', navWfId: null, navClassName: 'navbar_component w-nav' }),
      makePage({ filename: 'about.html', navWfId: null, navClassName: 'navbar_component w-nav' }),
      makePage({ filename: 'contact.html', navWfId: null, navClassName: 'navbar_component w-nav' }),
      makePage({ filename: 'blog.html', navWfId: null, navClassName: 'navbar_component w-nav' }),
      makePage({ filename: 'pricing.html', navWfId: null, navClassName: 'other_nav w-nav' }),
    ];

    const result = detectSharedLayout(pages);
    expect(result.hasSharedNav).toBe(true);
    expect(result.confidence).toBe('medium');
  });

  it('excludes CMS template pages from threshold calculation', () => {
    // 3 content pages: 2 share nav (>50%), 1 CMS template has different nav
    const pages = [
      makePage({ filename: 'index.html', navWfId: 'abc-123' }),
      makePage({ filename: 'about.html', navWfId: 'abc-123' }),
      makePage({ filename: 'contact.html', navWfId: 'other-1' }),
      makePage({ filename: 'detail_post.html', navWfId: 'other-2', isCmsTemplate: true }),
      makePage({ filename: 'detail_project.html', navWfId: 'other-3', isCmsTemplate: true }),
    ];

    const result = detectSharedLayout(pages);
    // 2 out of 3 content pages share navWfId => above 50% threshold
    expect(result.hasSharedNav).toBe(true);
    expect(result.navWfId).toBe('abc-123');
    expect(result.confidence).toBe('high');
  });

  it('returns no shared layout when only 1 non-CMS page (edge case)', () => {
    const pages = [
      makePage({ filename: 'index.html', navWfId: 'abc-123', footerWfId: 'def-456' }),
    ];

    const result = detectSharedLayout(pages);
    expect(result.hasSharedNav).toBe(false);
    expect(result.hasSharedFooter).toBe(false);
  });

  it('falls back to footerClassName with medium confidence when no footerWfId meets threshold', () => {
    const pages = [
      makePage({ filename: 'index.html', footerWfId: null, footerClassName: 'footer_main' }),
      makePage({ filename: 'about.html', footerWfId: null, footerClassName: 'footer_main' }),
      makePage({ filename: 'contact.html', footerWfId: null, footerClassName: 'footer_main' }),
      makePage({ filename: 'blog.html', footerWfId: null, footerClassName: 'footer_other' }),
      makePage({ filename: 'pricing.html', footerWfId: null, footerClassName: 'footer_main' }),
    ];

    const result = detectSharedLayout(pages);
    expect(result.hasSharedFooter).toBe(true);
    expect(result.confidence).toBe('medium');
  });
});
