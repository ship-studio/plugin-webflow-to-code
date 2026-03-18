import type { BriefInput, BriefResult, BriefStats, PreserveOption } from './types';
import type { PageInfo, SharedLayout } from '../analysis/types';
import type { AssetManifest, ImageEntry, VideoEntry, FontEntry } from '../assets/types';
import type { BriefMode } from './types';
import { PRESERVE_OPTIONS } from './types';

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

function buildPreserveModernizeLists(preserve: Set<PreserveOption>): { preserveList: string[]; modernizeList: string[] } {
  const preserveList: string[] = [];
  const modernizeList: string[] = [];
  for (const opt of PRESERVE_OPTIONS) {
    if (preserve.has(opt.key)) {
      preserveList.push(opt.label);
    } else {
      modernizeList.push(opt.label);
    }
  }
  return { preserveList, modernizeList };
}

function buildPreserveGuidance(preserve: Set<PreserveOption>): string {
  const lines: string[] = [];

  if (preserve.has('brand-colors')) {
    lines.push('- **Brand colors & typography:** Extract exact hex values, font families, sizes, and weights from the CSS files. Use these values verbatim in your implementation -- do not approximate or substitute.');
  }
  if (preserve.has('visual-hierarchy')) {
    lines.push('- **Visual hierarchy & spacing:** Maintain the original section ordering, relative element sizing, and whitespace rhythm. Spacing values (margins, padding, gaps) should match the CSS reference.');
  }
  if (preserve.has('exact-layouts')) {
    lines.push('- **Exact layouts:** Preserve the original CSS grid/flexbox structure. Replicate column counts, row patterns, and alignment. Use the same layout approach (grid vs flex) as the original.');
  }
  if (preserve.has('animations')) {
    lines.push('- **Animations & interactions:** Recreate hover states, transitions, scroll-triggered effects, and any IX2 interactions from the original. Match timing, easing, and trigger behavior.');
  }
  if (preserve.has('image-treatment')) {
    lines.push('- **Image treatment & sizing:** Keep original image aspect ratios, cropping, and responsive behavior. Use srcset with the provided variants where available.');
  }

  return lines.join('\n');
}

function buildModernizeGuidance(preserve: Set<PreserveOption>): string {
  const lines: string[] = [];

  if (!preserve.has('brand-colors')) {
    lines.push('- **Colors & typography:** Reference the CSS files for the general palette, but feel free to refine or systematize values (e.g., create design tokens or a Tailwind theme).');
  }
  if (!preserve.has('visual-hierarchy')) {
    lines.push('- **Visual hierarchy & spacing:** Use the original as a reference but improve spacing with a consistent scale (e.g., 4px/8px grid or rem-based spacing).');
  }
  if (!preserve.has('exact-layouts')) {
    lines.push('- **Layouts:** Reimagine using modern CSS grid and flexbox with relative units (rem, %, clamp). Prioritize responsiveness over exact replication.');
  }
  if (!preserve.has('animations')) {
    lines.push('- **Animations & interactions:** Implement tasteful, performant alternatives using CSS transitions and IntersectionObserver. Simplify where the original was overly complex.');
  }
  if (!preserve.has('image-treatment')) {
    lines.push('- **Images:** Use the largest available variant as src. Implement your own responsive image strategy optimized for your stack.');
  }

  return lines.join('\n');
}

function buildInstructionsSection(mode: BriefMode, preserve?: Set<PreserveOption>, customNotes?: string): string {
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

  // Best Site mode — build preserve/modernize split
  const p = preserve ?? new Set();
  const { preserveList, modernizeList } = buildPreserveModernizeLists(p);

  let preserveSection = '';
  if (preserveList.length > 0) {
    preserveSection = `

**Preserve from the original** (${preserveList.join(', ')}):
${buildPreserveGuidance(p)}`;
  }

  let modernizeSection = '';
  if (modernizeList.length > 0) {
    modernizeSection = `

**Modernize** (${modernizeList.join(', ')}):
${buildModernizeGuidance(p)}`;
  }

  let customSection = '';
  if (customNotes && customNotes.trim()) {
    customSection = `

**Additional instructions from the user:**
> ${customNotes.trim().replace(/\n/g, '\n> ')}`;
  }

  return `## How to Use This Brief

**Goal:** Rebuild the site using modern, semantic, maintainable code while preserving specific design elements from the original.

**Before building:** Read the Site Overview and Shared Layout sections first. Then work through pages one at a time, updating migration-plan.json as you go. Pay close attention to which aspects should be preserved vs. modernized.
${preserveSection}${modernizeSection}

**During building:**
- Use semantic HTML5 elements: \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<footer>\`.
- Replace Webflow utility classes with your project's preferred approach (Tailwind, CSS Modules, or plain CSS).
- Implement Webflow components as native equivalents: \`.w-nav\` -> \`<nav>\` with CSS + JS hamburger; \`.w-slider\` -> CSS scroll snap or a lightweight library; \`.w-tabs\` -> \`<details>\`/\`<summary>\` or custom JS tabs.
- Do NOT use webflow.js -- it is Webflow's proprietary runtime and will not work outside Webflow hosting.
- Reference the CSS files for design values. For preserved aspects, match them exactly. For modernized aspects, adapt to your implementation approach.
${customSection}
**After building:** Verify preserved aspects match the original exactly. For modernized aspects, verify the overall design intent is maintained while code quality is improved.`;
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

function buildMigrationPlanSection(): string {
  return `## Migration Plan

The file \`.shipstudio/migration-plan.json\` has been created for you. It contains all pages and sections from the site analysis with status \`"pending"\`.

**Before writing any code:**
1. Read \`.shipstudio/migration-plan.json\` to understand the full scope of work.
2. Do NOT recreate this file — it already exists. Do not overwrite it with a new structure.

**As you build:**
- Update each item's \`status\` from \`"pending"\` to \`"in-progress"\` when you start it.
- Update to \`"complete"\` when you finish and verify it.
- Use the optional \`notes\` field to record decisions: \`"responsive done, animations pending"\`.
- You may add new items (e.g., framework setup tasks) but keep the base structure intact.

**Example of the file format:**
\`\`\`json
{
  "version": "1.0",
  "generatedAt": "2026-03-18",
  "items": [
    { "name": "Shared Nav", "type": "shared", "status": "pending" },
    { "name": "Shared Footer", "type": "shared", "status": "pending" },
    {
      "name": "Home",
      "type": "page",
      "status": "in-progress",
      "notes": "Hero section done, working on features",
      "children": [
        { "name": "Hero", "type": "section", "status": "complete" },
        { "name": "Features", "type": "section", "status": "in-progress" },
        { "name": "Call to Action", "type": "section", "status": "pending" }
      ]
    }
  ]
}
\`\`\``;
}

export function generateBrief(input: BriefInput): BriefResult {
  const sections = [
    buildMetadataSection(input),
    buildMigrationPlanSection(),
    buildInstructionsSection(input.mode, input.preserve, input.customNotes),
    buildOverviewSection(input.siteAnalysis),
    buildSharedLayoutSection(input.siteAnalysis.sharedLayout, input.siteAnalysis.pages),
    buildCSSReferenceSection(input.assetManifest.cssFiles, input.mode),
    buildPagesSection(input.siteAnalysis.pages, input.mode),
    buildAssetsSection(input.assetManifest, input.mode),
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
