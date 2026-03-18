// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import type { BriefInput } from './types';
import type { SiteAnalysis, PageInfo, SharedLayout } from '../analysis/types';
import type { AssetManifest } from '../assets/types';
import { generateBrief, estimateTokens } from './generate';

function makeMockInput(overrides?: Partial<BriefInput>): BriefInput {
  const pages: PageInfo[] = [
    {
      filename: 'index.html',
      route: '/',
      title: 'Home',
      wfPageId: 'wf-page-1',
      isCmsTemplate: false,
      isUtilityPage: false,
      sections: [
        { tag: 'section', className: 'hero-section', label: 'Hero' },
        { tag: 'section', className: 'features-section', label: 'Features' },
        { tag: 'section', className: 'cta-section', label: 'Call to Action' },
      ],
      webflowComponents: [
        { wClass: 'w-nav', label: 'Navbar', count: 1, migration: 'Replace with semantic <nav> and native hamburger JS' },
      ],
      hasIx2Interactions: true,
      navWfId: 'nav-wf-id-1',
      footerWfId: 'footer-wf-id-1',
      navClassName: 'navbar',
      footerClassName: 'footer',
    },
    {
      filename: 'about.html',
      route: '/about',
      title: 'About Us',
      wfPageId: 'wf-page-2',
      isCmsTemplate: false,
      isUtilityPage: false,
      sections: [
        { tag: 'section', className: 'about-hero', label: 'About Hero' },
        { tag: 'section', className: 'team-section', label: 'Team' },
      ],
      webflowComponents: [
        { wClass: 'w-slider', label: 'Slider', count: 1, migration: 'Replace with CSS scroll snap or lightweight library' },
        { wClass: 'w-tabs', label: 'Tabs', count: 2, migration: 'Replace with native JS tabs or <details>/<summary>' },
      ],
      hasIx2Interactions: false,
      navWfId: 'nav-wf-id-1',
      footerWfId: 'footer-wf-id-1',
      navClassName: 'navbar',
      footerClassName: 'footer',
    },
    {
      filename: 'contact.html',
      route: '/contact',
      title: 'Contact',
      wfPageId: 'wf-page-3',
      isCmsTemplate: false,
      isUtilityPage: false,
      sections: [
        { tag: 'section', className: 'contact-form', label: 'Contact Form' },
        { tag: 'section', className: 'map-section', label: 'Map' },
      ],
      webflowComponents: [],
      hasIx2Interactions: false,
      navWfId: 'nav-wf-id-1',
      footerWfId: 'footer-wf-id-1',
      navClassName: 'navbar',
      footerClassName: 'footer',
    },
    {
      filename: 'detail_blog.html',
      route: '/blog/:slug',
      title: 'Blog Post',
      wfPageId: 'wf-page-4',
      isCmsTemplate: true,
      isUtilityPage: false,
      sections: [],
      webflowComponents: [],
      hasIx2Interactions: false,
      navWfId: 'nav-wf-id-1',
      footerWfId: 'footer-wf-id-1',
      navClassName: 'navbar',
      footerClassName: 'footer',
    },
  ];

  const sharedLayout: SharedLayout = {
    hasSharedNav: true,
    navWfId: 'nav-wf-id-1',
    hasSharedFooter: true,
    footerWfId: 'footer-wf-id-1',
    confidence: 'high',
  };

  const siteAnalysis: SiteAnalysis = {
    pages,
    sharedLayout,
    contentPageCount: 3,
    cmsTemplateCount: 1,
    allWebflowComponents: ['w-nav', 'w-slider', 'w-tabs'],
  };

  const assetManifest: AssetManifest = {
    images: [
      {
        filename: 'hero-bg.jpg',
        path: '.shipstudio/assets/images/hero-bg.jpg',
        type: 'image',
        purpose: 'background',
        variants: ['hero-bg-p-500.jpg', 'hero-bg-p-800.jpg'],
        referencingPages: ['index.html'],
      },
      {
        filename: 'logo.svg',
        path: '.shipstudio/assets/images/logo.svg',
        type: 'svg',
        purpose: 'logo',
        referencingPages: ['index.html', 'about.html'],
      },
    ],
    videos: [
      {
        filename: 'intro.mp4',
        path: '.shipstudio/assets/videos/intro.mp4',
        type: 'video',
        purpose: 'video',
        transcodes: ['intro-transcode-original-h264.mp4'],
        poster: 'intro-poster-00001.jpg',
        referencingPages: ['index.html'],
      },
    ],
    fonts: [
      {
        filename: 'inter-regular.woff2',
        path: '.shipstudio/assets/fonts/inter-regular.woff2',
        type: 'font',
        purpose: 'font',
        referencingPages: ['index.html', 'about.html', 'contact.html'],
      },
    ],
    cssFiles: [
      '.shipstudio/assets/css/normalize.css',
      '.shipstudio/assets/css/webflow.css',
      '.shipstudio/assets/css/my-awesome-site.css',
    ],
    totalCopied: 5,
  };

  return {
    mode: 'pixel-perfect',
    siteAnalysis,
    assetManifest,
    projectPath: '/tmp/test-project',
    date: '2025-01-15',
    ...overrides,
  };
}

describe('estimateTokens', () => {
  it('returns 1 for a 4-char string', () => {
    expect(estimateTokens('abcd')).toBe(1);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('returns 3 for a 12-char string', () => {
    expect(estimateTokens('abcdefghijkl')).toBe(3);
  });
});

describe('generateBrief', () => {
  describe('mode-specific instructions', () => {
    it('pixel-perfect mode contains class preservation directive', () => {
      const input = makeMockInput({ mode: 'pixel-perfect' });
      const result = generateBrief(input);
      expect(result.markdown).toContain('Preserve all Webflow class names exactly');
    });

    it('best-site mode contains semantic HTML directive', () => {
      const input = makeMockInput({ mode: 'best-site' });
      const result = generateBrief(input);
      expect(result.markdown).toContain('semantic HTML5 elements');
    });

    it('pixel-perfect does NOT contain semantic HTML directive', () => {
      const input = makeMockInput({ mode: 'pixel-perfect' });
      const result = generateBrief(input);
      expect(result.markdown).not.toContain('semantic HTML5 elements');
    });

    it('best-site does NOT contain class preservation directive', () => {
      const input = makeMockInput({ mode: 'best-site' });
      const result = generateBrief(input);
      expect(result.markdown).not.toContain('Preserve all Webflow class names exactly');
    });
  });

  describe('Migration Plan', () => {
    it('contains Migration Plan section heading', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('## Migration Plan');
    });

    it('references .shipstudio/migration-plan.json file path', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('.shipstudio/migration-plan.json');
    });

    it('instructs agent NOT to recreate the plan file', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('Do NOT recreate this file');
    });

    it('instructs agent to update status as items complete', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('"pending"');
      expect(result.markdown).toContain('"in-progress"');
      expect(result.markdown).toContain('"complete"');
    });

    it('contains JSON example with plan schema format', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('"version": "1.0"');
      expect(result.markdown).toContain('"type": "shared"');
      expect(result.markdown).toContain('"children"');
    });

    it('does NOT contain Session Tracker section (regression guard)', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).not.toContain('## Session Tracker');
    });

    it('does NOT contain MIGRATION_LOG.md reference (regression guard)', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).not.toContain('MIGRATION_LOG.md');
    });

    it('Migration Plan section appears before How to Use This Brief', () => {
      const result = generateBrief(makeMockInput());
      const planIndex = result.markdown.indexOf('## Migration Plan');
      const instructionsIndex = result.markdown.indexOf('## How to Use This Brief');
      expect(planIndex).toBeLessThan(instructionsIndex);
    });
  });

  describe('Pages section', () => {
    it('contains Pages section with per-page subsections', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('## Pages');
      // Each page gets a ### heading
      expect(result.markdown).toContain('### Home');
      expect(result.markdown).toContain('### About Us');
      expect(result.markdown).toContain('### Contact');
      expect(result.markdown).toContain('### Blog Post');
    });

    it('page subsections contain SectionItem entries as bullet points', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('hero-section');
      expect(result.markdown).toContain('features-section');
    });

    it('page subsections contain ComponentEntry items in a markdown table', () => {
      const result = generateBrief(makeMockInput());
      // About page has w-slider and w-tabs
      expect(result.markdown).toContain('w-slider');
      expect(result.markdown).toContain('w-tabs');
      expect(result.markdown).toContain('Migration Note');
    });

    it('CMS template pages are labeled with (CMS Template)', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('(CMS Template)');
    });
  });

  describe('CSS Reference section', () => {
    it('contains CSS Reference section listing cssFiles', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('## CSS Reference');
      expect(result.markdown).toContain('normalize.css');
      expect(result.markdown).toContain('webflow.css');
      expect(result.markdown).toContain('my-awesome-site.css');
    });
  });

  describe('Assets section', () => {
    it('contains Assets section with image/video/font tables', () => {
      const result = generateBrief(makeMockInput());
      expect(result.markdown).toContain('## Assets');
      expect(result.markdown).toContain('hero-bg.jpg');
      expect(result.markdown).toContain('intro.mp4');
      expect(result.markdown).toContain('inter-regular.woff2');
    });

    it('assets section is omitted when totalCopied is 0', () => {
      const input = makeMockInput();
      input.assetManifest = {
        images: [],
        videos: [],
        fonts: [],
        cssFiles: input.assetManifest.cssFiles,
        totalCopied: 0,
      };
      const result = generateBrief(input);
      expect(result.markdown).not.toContain('## Assets');
    });
  });

  describe('Shared Layout section', () => {
    it('is omitted when hasSharedNav and hasSharedFooter are both false', () => {
      const input = makeMockInput();
      input.siteAnalysis = {
        ...input.siteAnalysis,
        sharedLayout: {
          hasSharedNav: false,
          navWfId: undefined,
          hasSharedFooter: false,
          footerWfId: undefined,
          confidence: 'high',
        },
      };
      const result = generateBrief(input);
      expect(result.markdown).not.toContain('## Shared Layout');
    });
  });

  describe('pipe character escaping', () => {
    it('page title with pipe character does not break markdown table formatting', () => {
      const input = makeMockInput();
      // Replace first page title with one containing a pipe
      input.siteAnalysis.pages[0] = {
        ...input.siteAnalysis.pages[0],
        title: 'Pricing | 50% Off',
        webflowComponents: [
          { wClass: 'w-nav', label: 'Navbar', count: 1, migration: 'Replace with native nav' },
        ],
      };
      const result = generateBrief(input);
      // The pipe should be escaped in table cells
      expect(result.markdown).not.toMatch(/\| Pricing \| 50% Off \|/);
    });
  });

  describe('BriefResult stats', () => {
    it('estimatedTokens is non-zero for non-empty brief', () => {
      const result = generateBrief(makeMockInput());
      expect(result.estimatedTokens).toBeGreaterThan(0);
    });

    it('stats.pageCount matches input page count', () => {
      const input = makeMockInput();
      const result = generateBrief(input);
      expect(result.stats.pageCount).toBe(input.siteAnalysis.pages.length);
    });

    it('stats.contentPageCount matches input contentPageCount', () => {
      const input = makeMockInput();
      const result = generateBrief(input);
      expect(result.stats.contentPageCount).toBe(input.siteAnalysis.contentPageCount);
    });

    it('stats.assetCount matches total assets', () => {
      const input = makeMockInput();
      const totalAssets =
        input.assetManifest.images.length +
        input.assetManifest.videos.length +
        input.assetManifest.fonts.length;
      const result = generateBrief(input);
      expect(result.stats.assetCount).toBe(totalAssets);
    });
  });
});
