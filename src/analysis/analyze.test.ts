// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import type { Shell } from '../types';
import { buildSiteAnalysis } from './analyze';

/**
 * Create a minimal HTML page that parsePage can process.
 * The base64-encoded version is returned by mock shell.exec.
 */
function makeHtml(opts: {
  title?: string;
  wfPageId?: string;
  isCms?: boolean;
  navWfId?: string | null;
  footerWfId?: string | null;
  components?: string[];
} = {}): string {
  const title = opts.title ?? 'Test Page';
  const wfPageId = opts.wfPageId ?? 'wf-page-1';
  const navAttr = opts.navWfId ? ` data-w-id="${opts.navWfId}"` : '';
  const footerAttr = opts.footerWfId ? ` data-w-id="${opts.footerWfId}"` : '';
  const cmsMarker = opts.isCms ? '<div class="w-dyn-bind-empty"></div>' : '';
  const componentHtml = (opts.components ?? [])
    .map((c) => `<div class="${c}"></div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html data-wf-page="${wfPageId}">
<head><title>${title}</title></head>
<body>
  <nav class="navbar_component w-nav"${navAttr}></nav>
  <section class="section_hero">Content</section>
  ${cmsMarker}
  ${componentHtml}
  <footer class="footer_main"${footerAttr}>Footer</footer>
</body>
</html>`;
}

function createMockShell(htmlByPath: Record<string, string>): Shell {
  return {
    exec: vi.fn(async (_cmd: string, args: string[]) => {
      // Parse the base64 command to extract path: bash -c "base64 < '/path/to/file'"
      const cmdStr = args[1] ?? '';
      const pathMatch = cmdStr.match(/base64 < '([^']+)'/);
      const path = pathMatch?.[1] ?? '';
      const html = htmlByPath[path];
      if (!html) throw new Error(`No mock HTML for path: ${path}`);
      return { exit_code: 0, stdout: btoa(html), stderr: '' };
    }),
  };
}

describe('buildSiteAnalysis', () => {
  it('returns correct contentPageCount and cmsTemplateCount', async () => {
    const entries = ['index.html', 'about.html', 'detail_post.html', 'css/'];
    const htmlByPath: Record<string, string> = {
      '/tmp/out/index.html': makeHtml({ title: 'Home' }),
      '/tmp/out/about.html': makeHtml({ title: 'About' }),
      '/tmp/out/detail_post.html': makeHtml({ title: 'Post', isCms: true }),
    };
    const shell = createMockShell(htmlByPath);

    const result = await buildSiteAnalysis(shell, entries, '/tmp/out');
    expect(result.contentPageCount).toBe(2);
    expect(result.cmsTemplateCount).toBe(1);
    expect(result.pages).toHaveLength(3);
  });

  it('passes correct htmlPath (extractDir + / + filename) to parsePage', async () => {
    const entries = ['index.html'];
    const htmlByPath: Record<string, string> = {
      '/extract/dir/index.html': makeHtml({ title: 'Home' }),
    };
    const shell = createMockShell(htmlByPath);

    await buildSiteAnalysis(shell, entries, '/extract/dir');

    // Verify shell.exec was called with the correct path
    expect(shell.exec).toHaveBeenCalledWith(
      'bash',
      ['-c', "base64 < '/extract/dir/index.html'"],
    );
  });

  it('collects allWebflowComponents as deduplicated union across pages', async () => {
    const entries = ['index.html', 'about.html'];
    const htmlByPath: Record<string, string> = {
      '/tmp/out/index.html': makeHtml({ components: ['w-nav', 'w-slider'] }),
      '/tmp/out/about.html': makeHtml({ components: ['w-nav', 'w-tabs'] }),
    };
    const shell = createMockShell(htmlByPath);

    const result = await buildSiteAnalysis(shell, entries, '/tmp/out');
    // w-nav appears on both pages but should be deduplicated
    // Note: w-nav is always present in our makeHtml via the nav element
    expect(result.allWebflowComponents).toContain('w-nav');
    expect(result.allWebflowComponents).toContain('w-slider');
    expect(result.allWebflowComponents).toContain('w-tabs');
    // Check deduplication: no duplicates
    const uniqueCount = new Set(result.allWebflowComponents).size;
    expect(result.allWebflowComponents.length).toBe(uniqueCount);
  });

  it('calls detectSharedLayout with parsed pages', async () => {
    const entries = ['index.html', 'about.html'];
    const navId = 'shared-nav-id';
    const htmlByPath: Record<string, string> = {
      '/tmp/out/index.html': makeHtml({ navWfId: navId }),
      '/tmp/out/about.html': makeHtml({ navWfId: navId }),
    };
    const shell = createMockShell(htmlByPath);

    const result = await buildSiteAnalysis(shell, entries, '/tmp/out');
    // Both pages share the same navWfId, so shared nav should be detected
    expect(result.sharedLayout.hasSharedNav).toBe(true);
    expect(result.sharedLayout.navWfId).toBe(navId);
  });

  it('calls onProgress with "Analyzing page N/M..." for each page', async () => {
    const entries = ['index.html', 'about.html', 'contact.html'];
    const htmlByPath: Record<string, string> = {
      '/tmp/out/index.html': makeHtml({ title: 'Home' }),
      '/tmp/out/about.html': makeHtml({ title: 'About' }),
      '/tmp/out/contact.html': makeHtml({ title: 'Contact' }),
    };
    const shell = createMockShell(htmlByPath);
    const progress = vi.fn();

    await buildSiteAnalysis(shell, entries, '/tmp/out', progress);

    expect(progress).toHaveBeenCalledTimes(3);
    expect(progress).toHaveBeenCalledWith('Analyzing page 1/3...');
    expect(progress).toHaveBeenCalledWith('Analyzing page 2/3...');
    expect(progress).toHaveBeenCalledWith('Analyzing page 3/3...');
  });
});
