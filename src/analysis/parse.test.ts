// @vitest-environment jsdom
// PAGE-03: CSS file references handled by AssetManifest.cssFiles (Phase 3) — no analysis-phase code needed

import { describe, it, expect, vi } from 'vitest';
import type { Shell } from '../types';
import {
  discoverHtmlPages,
  inferRoute,
  detectCmsTemplate,
  inferSectionLabel,
  parsePage,
} from './parse';

function createMockShell(
  responses: Array<{ exit_code: number; stdout: string; stderr: string }>,
): Shell {
  let callIndex = 0;
  return {
    exec: vi.fn(async () => {
      const response = responses[callIndex];
      if (!response) throw new Error(`Unexpected shell.exec call #${callIndex}`);
      callIndex++;
      return response;
    }),
  };
}

function makeDoc(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

describe('discoverHtmlPages', () => {
  it('filters to only .html files, excluding directories and __MACOSX', () => {
    const entries = ['index.html', 'css/', 'about.html', '__MACOSX/foo.html', 'images/'];
    const result = discoverHtmlPages(entries);
    expect(result).toEqual(['index.html', 'about.html']);
  });

  it('includes subdirectory html files', () => {
    const entries = ['index.html', 'legal/terms.html'];
    const result = discoverHtmlPages(entries);
    expect(result).toEqual(['index.html', 'legal/terms.html']);
  });
});

describe('inferRoute', () => {
  it('converts index.html to /', () => {
    expect(inferRoute('index.html')).toBe('/');
  });

  it('converts about.html to /about', () => {
    expect(inferRoute('about.html')).toBe('/about');
  });

  it('converts legal/terms-of-service.html to /legal/terms-of-service', () => {
    expect(inferRoute('legal/terms-of-service.html')).toBe('/legal/terms-of-service');
  });

  it('converts detail_post.html to /post/[slug]', () => {
    expect(inferRoute('detail_post.html')).toBe('/post/[slug]');
  });
});

describe('detectCmsTemplate', () => {
  it('returns true for detail_ prefix filename', () => {
    const doc = makeDoc('<html><head><title>Post</title></head><body></body></html>');
    expect(detectCmsTemplate('detail_post.html', doc)).toBe(true);
  });

  it('returns true when doc has w-dyn-bind-empty class', () => {
    const doc = makeDoc(
      '<html><head><title>About</title></head><body><div class="w-dyn-bind-empty"></div></body></html>',
    );
    expect(detectCmsTemplate('about.html', doc)).toBe(true);
  });

  it('returns true when title starts with |', () => {
    const doc = makeDoc('<html><head><title>| Blog Post</title></head><body></body></html>');
    expect(detectCmsTemplate('blog.html', doc)).toBe(true);
  });

  it('returns false for normal page', () => {
    const doc = makeDoc('<html><head><title>About Us</title></head><body></body></html>');
    expect(detectCmsTemplate('about.html', doc)).toBe(false);
  });
});

describe('inferSectionLabel', () => {
  it('extracts label from section_ prefix', () => {
    expect(inferSectionLabel('section_hero padding-large')).toBe('hero');
  });

  it('extracts label from footer_ prefix', () => {
    expect(inferSectionLabel('footer_component')).toBe('footer');
  });

  it('returns section as fallback', () => {
    expect(inferSectionLabel('random-class')).toBe('section');
  });

  it('extracts label from header_ prefix', () => {
    expect(inferSectionLabel('header_main is-dark')).toBe('header');
  });
});

describe('parsePage', () => {
  const sampleHtml = `<!DOCTYPE html>
<html data-wf-page="abc123" data-wf-site="site456">
<head><title>My Page</title></head>
<body>
  <nav class="w-nav" data-w-id="nav-id-1"><div class="w-nav-brand"></div></nav>
  <section class="section_hero padding-large">Hero content</section>
  <section class="section_features">Features</section>
  <footer class="footer_main" data-w-id="footer-id-1">Footer</footer>
</body>
</html>`;

  function makeShellForHtml(html: string): Shell {
    const encoded = btoa(html);
    return createMockShell([
      { exit_code: 0, stdout: encoded, stderr: '' },
    ]);
  }

  it('extracts title from HTML', async () => {
    const shell = makeShellForHtml(sampleHtml);
    const result = await parsePage(shell, '/tmp/out/index.html', 'index.html');
    expect(result.title).toBe('My Page');
  });

  it('extracts data-wf-page attribute', async () => {
    const shell = makeShellForHtml(sampleHtml);
    const result = await parsePage(shell, '/tmp/out/index.html', 'index.html');
    expect(result.wfPageId).toBe('abc123');
  });

  it('extracts sections matching section_*, footer_* class patterns', async () => {
    const shell = makeShellForHtml(sampleHtml);
    const result = await parsePage(shell, '/tmp/out/index.html', 'index.html');
    expect(result.sections.length).toBeGreaterThanOrEqual(3);
    expect(result.sections.map((s) => s.label)).toContain('hero');
    expect(result.sections.map((s) => s.label)).toContain('footer');
  });

  it('detects nav data-w-id for shared layout', async () => {
    const shell = makeShellForHtml(sampleHtml);
    const result = await parsePage(shell, '/tmp/out/index.html', 'index.html');
    expect(result.navWfId).toBe('nav-id-1');
  });

  it('detects footer data-w-id for shared layout', async () => {
    const shell = makeShellForHtml(sampleHtml);
    const result = await parsePage(shell, '/tmp/out/index.html', 'index.html');
    expect(result.footerWfId).toBe('footer-id-1');
  });

  it('marks isUtilityPage true for 401.html', async () => {
    const shell = makeShellForHtml('<html><head><title>401</title></head><body></body></html>');
    const result = await parsePage(shell, '/tmp/out/401.html', '401.html');
    expect(result.isUtilityPage).toBe(true);
  });

  it('marks isUtilityPage true for 404.html', async () => {
    const shell = makeShellForHtml('<html><head><title>404</title></head><body></body></html>');
    const result = await parsePage(shell, '/tmp/out/404.html', '404.html');
    expect(result.isUtilityPage).toBe(true);
  });

  it('marks isUtilityPage true for style-guide.html', async () => {
    const shell = makeShellForHtml('<html><head><title>Style Guide</title></head><body></body></html>');
    const result = await parsePage(shell, '/tmp/out/style-guide.html', 'style-guide.html');
    expect(result.isUtilityPage).toBe(true);
  });

  it('marks isUtilityPage false for normal pages', async () => {
    const shell = makeShellForHtml(sampleHtml);
    const result = await parsePage(shell, '/tmp/out/index.html', 'index.html');
    expect(result.isUtilityPage).toBe(false);
  });

  it('sets correct route', async () => {
    const shell = makeShellForHtml(sampleHtml);
    const result = await parsePage(shell, '/tmp/out/about.html', 'about.html');
    expect(result.route).toBe('/about');
  });
});
