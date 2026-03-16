import type { BriefInput, BriefResult, BriefStats } from './types';
import type { PageInfo, SharedLayout } from '../analysis/types';
import type { AssetManifest, ImageEntry, VideoEntry, FontEntry } from '../assets/types';
import type { BriefMode } from './types';

export const TOKEN_WARNING_THRESHOLD = 12_000;

export function estimateTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4);
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function deriveSiteName(cssFiles: string[]): string {
  if (cssFiles.length >= 3) {
    const filename = cssFiles[2].split('/').pop() ?? '';
    const name = filename.replace(/\.css$/, '').replace(/-/g, ' ');
    if (name) {
      return name
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }
  return 'Webflow Export';
}

function buildMetadataSection(input: BriefInput): string {
  const siteName = deriveSiteName(input.assetManifest.cssFiles);
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  const modeLabel = input.mode === 'pixel-perfect' ? 'Pixel Perfect' : 'Best Site';
  const { contentPageCount, cmsTemplateCount } = input.siteAnalysis;
  const pagesStr =
    cmsTemplateCount > 0
      ? `${contentPageCount} content pages, ${cmsTemplateCount} CMS templates`
      : `${contentPageCount} content pages`;
  const tokens = estimateTokens(''); // placeholder, will be computed on final markdown

  const lines = [
    '# Webflow Migration Brief',
    '',
    `**Site:** ${siteName}`,
    `**Extracted:** ${date}`,
    `**Mode:** ${modeLabel}`,
    `**Pages:** ${pagesStr}`,
    `**Assets:** ${input.assetManifest.totalCopied} files copied to .shipstudio/assets/`,
  ];
  return lines.join('\n');
}

function buildInstructionsSection(mode: BriefMode): string {
  if (mode === 'pixel-perfect') {
    return `## How to Use This Brief

**Goal:** Reproduce the Webflow site with maximum visual fidelity. The output should be indistinguishable from the original when viewed in a browser.

**Before building:** Read the full Pages section for the page you are migrating. Study the section structure and Webflow components list. Review the CSS Reference section -- the original styles are in these files.

**During building:**
- Preserve all Webflow class names exactly as they appear. Do not rename \`.w-nav\` to \`nav\`, \`.w-button\` to \`button\`, or any other class.
- Copy normalize.css, webflow.css, and the site CSS file (in that order) into your project and import them. These contain all the layout and visual styles.
- Use the exact pixel values and fixed units from the original HTML structure.
- Every Webflow component (\`.w-nav\`, \`.w-slider\`, \`.w-tabs\`, etc.) must be replaced with a native implementation -- see the migration note in each component's entry. Do NOT use webflow.js.
- Build shared nav and footer as components (see Shared Layout section) and reuse them across all pages.

**After building:** Compare your output against the original Webflow export visually. Spacing, color, and typography should match the CSS file values.`;
  }

  return `## How to Use This Brief

**Goal:** Rebuild the site using modern, semantic, maintainable code. Capture the visual design and content while improving the code quality.

**Before building:** Read the Site Overview and Shared Layout sections first. Then work through pages one at a time using the Session Tracker.

**During building:**
- Use semantic HTML5 elements: \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<footer>\`.
- Replace Webflow utility classes with your project's preferred approach (Tailwind, CSS Modules, or plain CSS).
- Use CSS grid and flexbox with relative units (rem, %, clamp) for responsive layouts.
- Implement Webflow components as native equivalents: \`.w-nav\` -> \`<nav>\` with CSS + JS hamburger; \`.w-slider\` -> CSS scroll snap or a lightweight library; \`.w-tabs\` -> \`<details>\`/\`<summary>\` or custom JS tabs.
- Do NOT use webflow.js -- it is Webflow's proprietary runtime and will not work outside Webflow hosting.
- Reference the CSS files for color values and typography, but adapt the rules to your implementation approach.

**After building:** Verify the visual hierarchy, color palette, and content structure match the original design intent.`;
}

function buildOverviewSection(siteAnalysis: {
  contentPageCount: number;
  cmsTemplateCount: number;
  allWebflowComponents: string[];
  pages: PageInfo[];
}): string {
  const hasIx2 = siteAnalysis.pages.some((p) => p.hasIx2Interactions);
  const componentsList =
    siteAnalysis.allWebflowComponents.length > 0
      ? siteAnalysis.allWebflowComponents.join(', ')
      : 'None';

  const cmsLine =
    siteAnalysis.cmsTemplateCount > 0
      ? `\n**CMS templates:** ${siteAnalysis.cmsTemplateCount} (see CMS note in each template's page entry)`
      : '';

  return `## Site Overview

**Content pages:** ${siteAnalysis.contentPageCount}${cmsLine}
**Webflow components found:** ${componentsList}
**Has IX2 interactions:** ${hasIx2 ? 'Yes' : 'No'}

> webflow.js and the site JS file are Webflow runtime bundles. Do NOT attempt to use or port them. All interactive components listed above must be replaced with native implementations.`;
}

function buildSharedLayoutSection(
  sharedLayout: SharedLayout,
  pages: PageInfo[],
): string {
  if (!sharedLayout.hasSharedNav && !sharedLayout.hasSharedFooter) {
    return '';
  }

  const lines: string[] = ['## Shared Layout', ''];

  if (sharedLayout.hasSharedNav) {
    const navPage = pages.find((p) => p.navClassName);
    const navClass = navPage?.navClassName ?? 'w-nav';
    lines.push(
      `**Navigation:** The nav component (class: \`.${navClass}\`) appears on all content pages. Build it once as a shared component and reuse it. This component uses \`.w-nav\` -- replace with a semantic \`<nav>\` and native hamburger JS for mobile.`,
      '',
    );
  }

  if (sharedLayout.hasSharedFooter) {
    const footerPage = pages.find((p) => p.footerClassName);
    const footerClass = footerPage?.footerClassName ?? 'footer';
    lines.push(
      `**Footer:** The footer component (class: \`.${footerClass}\`) appears on all content pages. Build it once as a shared component.`,
      '',
    );
  }

  const confidenceDesc =
    sharedLayout.confidence === 'high'
      ? 'Detected via matching data-w-id attributes'
      : 'Detected via matching class names -- verify visually';
  lines.push(`Confidence: ${confidenceDesc}`);

  return lines.join('\n');
}

function buildCSSReferenceSection(cssFiles: string[], mode: BriefMode): string {
  const rows = cssFiles.map((path) => {
    const filename = path.split('/').pop() ?? path;
    const purpose =
      filename === 'normalize.css'
        ? 'Cross-browser baseline reset'
        : filename === 'webflow.css'
          ? 'Webflow component base styles'
          : 'Site-specific styles -- primary design reference';
    return `| \`${path}\` | ${purpose} |`;
  });

  const modeNote =
    mode === 'pixel-perfect'
      ? '**Pixel Perfect mode:** Import all three files in the order shown above.'
      : '**Best Site mode:** Use these files as a visual reference for colors, typography, and spacing values. Adapt to your implementation approach.';

  return `## CSS Reference

The following CSS files were copied to \`.shipstudio/assets/\`. Reference them directly rather than re-extracting values.

| File | Purpose |
|------|---------|
${rows.join('\n')}

${modeNote}`;
}

function buildPageSubsection(page: PageInfo, mode: BriefMode): string {
  if (page.isCmsTemplate) {
    return `### ${escapeTableCell(page.title)} -- \`${page.route}\` *(CMS Template)*

**File:** \`${page.filename}\`
**Status:** CMS template -- no content exported. This is a dynamic route template; the actual content lives in Webflow's CMS database and is NOT included in the zip export.
**Action required:** Build the route structure and page layout. Source content from the Webflow CMS API, a headless CMS, or static placeholder content.`;
  }

  const lines: string[] = [];
  lines.push(`### ${escapeTableCell(page.title)} -- \`${page.route}\``);
  lines.push('');
  lines.push(`**File:** \`${page.filename}\``);

  if (page.sections.length > 0) {
    lines.push('**Sections:**');
    for (const s of page.sections) {
      lines.push(`- \`<${s.tag} class="${escapeTableCell(s.className)}">\` -- ${escapeTableCell(s.label)}`);
    }
  }

  if (page.webflowComponents.length > 0) {
    lines.push('');
    lines.push('**Webflow Components:**');
    lines.push('| Class | Component | Migration Note |');
    lines.push('|-------|-----------|----------------|');
    for (const c of page.webflowComponents) {
      lines.push(
        `| \`.${escapeTableCell(c.wClass)}\` | ${escapeTableCell(c.label)} | ${escapeTableCell(c.migration)} |`,
      );
    }
  }

  if (page.hasIx2Interactions) {
    lines.push('');
    lines.push(
      '**Interactions:** This page uses Webflow IX2 animations (`data-ix` attributes). Replace with CSS transitions, IntersectionObserver scroll triggers, or equivalent native JS.',
    );
  }

  return lines.join('\n');
}

function buildPagesSection(pages: PageInfo[], mode: BriefMode): string {
  const subsections = pages.map((p) => buildPageSubsection(p, mode));
  return `## Pages\n\n${subsections.join('\n\n')}`;
}

function buildAssetsSection(assetManifest: AssetManifest, mode: BriefMode): string {
  if (assetManifest.totalCopied === 0) {
    return '';
  }

  const lines: string[] = [
    '## Assets',
    '',
    'All files copied to `.shipstudio/assets/`.',
  ];

  if (assetManifest.images.length > 0) {
    const srcsetNote =
      mode === 'pixel-perfect'
        ? ' Use srcset to serve responsive variants by suffix size (-p-500, -p-800, etc.).'
        : ' Use the largest available variant as the src; implement your own responsive image strategy.';
    lines.push('');
    lines.push(`### Images (${assetManifest.images.length} unique images)`);
    lines.push('');
    lines.push(`${srcsetNote.trim()}`);
    lines.push('');
    lines.push('| File | Type | Purpose | Variants | Path |');
    lines.push('|------|------|---------|----------|------|');
    for (const img of assetManifest.images) {
      const variants =
        img.variants && img.variants.length > 0 ? img.variants.join(', ') : '--';
      lines.push(
        `| \`${escapeTableCell(img.filename)}\` | ${img.type} | ${escapeTableCell(img.purpose)} | ${variants} | \`${img.path}\` |`,
      );
    }
  }

  if (assetManifest.videos.length > 0) {
    lines.push('');
    lines.push(`### Videos (${assetManifest.videos.length})`);
    lines.push('');
    lines.push('| File | Transcodes | Poster | Path |');
    lines.push('|------|-----------|--------|------|');
    for (const vid of assetManifest.videos) {
      const transcodes =
        vid.transcodes && vid.transcodes.length > 0
          ? vid.transcodes.join(', ')
          : '--';
      const poster = vid.poster ?? '--';
      lines.push(
        `| \`${escapeTableCell(vid.filename)}\` | ${transcodes} | ${poster} | \`${vid.path}\` |`,
      );
    }
  }

  if (assetManifest.fonts.length > 0) {
    lines.push('');
    lines.push(`### Fonts (${assetManifest.fonts.length})`);
    lines.push('');
    lines.push('| File | Path |');
    lines.push('|------|------|');
    for (const font of assetManifest.fonts) {
      lines.push(`| \`${escapeTableCell(font.filename)}\` | \`${font.path}\` |`);
    }
  }

  return lines.join('\n');
}

function buildSessionTrackerSection(
  pages: PageInfo[],
  sharedLayout: SharedLayout,
): string {
  const contentPages = pages.filter((p) => !p.isCmsTemplate && !p.isUtilityPage);
  const cmsPages = pages.filter((p) => p.isCmsTemplate);

  const lines: string[] = [
    '## Session Tracker',
    '',
    'This section tracks migration progress across sessions. Update checkboxes as you complete each page.',
    '',
    '**Instructions for the agent:**',
    '1. At the start of each session, read this section to find the next unchecked page.',
    '2. Complete that page\'s migration before moving to the next.',
    '3. Check the box when the page is fully migrated and visually verified.',
    '4. Before ending a session, update this tracker and commit `MIGRATION_LOG.md` with notes on what was completed and any decisions made.',
    '',
    '**Build order (shared components first, then pages):**',
    '',
  ];

  if (sharedLayout.hasSharedNav) {
    lines.push('- [ ] Shared Nav component (see Shared Layout section)');
  }
  if (sharedLayout.hasSharedFooter) {
    lines.push('- [ ] Shared Footer component (see Shared Layout section)');
  }

  for (const page of contentPages) {
    lines.push(`- [ ] \`${page.route}\` -- ${escapeTableCell(page.title)} (\`${page.filename}\`)`);
  }

  if (cmsPages.length > 0) {
    lines.push('');
    lines.push('**CMS Templates (after static pages):**');
    lines.push('');
    for (const page of cmsPages) {
      lines.push(
        `- [ ] \`${page.route}\` -- ${escapeTableCell(page.title)} (\`${page.filename}\`) *(CMS Template -- requires content strategy)*`,
      );
    }
  }

  lines.push('');
  lines.push('**MIGRATION_LOG.md format:**');
  lines.push('');
  lines.push('Create `MIGRATION_LOG.md` in the project root. After each session, append:');
  lines.push('');
  lines.push('```');
  lines.push('## Session {date}');
  lines.push('**Completed:** {page routes finished this session}');
  lines.push('**Decisions:** {any implementation choices made}');
  lines.push('**Next:** {which page to start on next session}');
  lines.push('```');

  return lines.join('\n');
}

export function generateBrief(input: BriefInput): BriefResult {
  const sections = [
    buildMetadataSection(input),
    buildInstructionsSection(input.mode),
    buildOverviewSection(input.siteAnalysis),
    buildSharedLayoutSection(input.siteAnalysis.sharedLayout, input.siteAnalysis.pages),
    buildCSSReferenceSection(input.assetManifest.cssFiles, input.mode),
    buildPagesSection(input.siteAnalysis.pages, input.mode),
    buildAssetsSection(input.assetManifest, input.mode),
    buildSessionTrackerSection(input.siteAnalysis.pages, input.siteAnalysis.sharedLayout),
  ].filter(Boolean);

  const markdown = sections.join('\n\n');
  const est = estimateTokens(markdown);

  const stats: BriefStats = {
    pageCount: input.siteAnalysis.pages.length,
    contentPageCount: input.siteAnalysis.contentPageCount,
    cmsTemplateCount: input.siteAnalysis.cmsTemplateCount,
    assetCount:
      input.assetManifest.images.length +
      input.assetManifest.videos.length +
      input.assetManifest.fonts.length,
    estimatedTokens: est,
  };

  return {
    markdown,
    charCount: markdown.length,
    estimatedTokens: est,
    stats,
  };
}
