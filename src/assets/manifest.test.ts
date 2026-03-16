import { describe, it, expect } from 'vitest';
import {
  stripVariantSuffix,
  inferImagePurpose,
  groupResponsiveVariants,
  buildVideoGroups,
  buildManifest,
} from './manifest';
import type { AssetManifest, ImageEntry, VideoEntry } from './types';

// Moneystack sample entries (from zip inspection)
const MONEYSTACK_ENTRIES = [
  'images/',
  'images/update-chart-1.png',
  'images/update-chart-1-p-500.png',
  'images/update-chart-1-p-800.png',
  'images/loading-p-130x130q80.jpeg',
  'images/dylan.png',
  'images/dylan-p-500.png',
  'images/aaa.png',
  'images/aaa-p-500.png',
  'images/favicon.png',
  'images/webclip.png',
  'images/logo.svg',
  'images/icon-check.svg',
  'images/animation.gif',
  'images/placeholder-image.png',
  'videos/',
  'videos/viewsituation.mp4',
  'videos/viewsituation-transcode.mp4',
  'videos/viewsituation-transcode.webm',
  'videos/viewsituation-poster-00001.jpg',
  'css/',
  'css/normalize.css',
  'css/moneystack-website.css',
  'js/',
  'js/moneystack-website.js',
  'index.html',
  'about.html',
];

const ASSETS_DIR = '/proj/.shipstudio/assets';
const PROJECT_PATH = '/proj';

describe('stripVariantSuffix', () => {
  it('strips -p-500 suffix', () => {
    expect(stripVariantSuffix('update-chart-1-p-500.png')).toBe('update-chart-1.png');
  });

  it('strips -p-800 suffix', () => {
    expect(stripVariantSuffix('update-chart-1-p-800.png')).toBe('update-chart-1.png');
  });

  it('strips -p-130x130q80 suffix', () => {
    expect(stripVariantSuffix('loading-p-130x130q80.jpeg')).toBe('loading.jpeg');
  });

  it('strips -p-500 from dylan-p-500.png', () => {
    expect(stripVariantSuffix('dylan-p-500.png')).toBe('dylan.png');
  });

  it('returns unchanged for non-variant filename', () => {
    expect(stripVariantSuffix('favicon.png')).toBe('favicon.png');
  });

  it('returns unchanged for SVG', () => {
    expect(stripVariantSuffix('logo.svg')).toBe('logo.svg');
  });
});

describe('inferImagePurpose', () => {
  it('returns "favicon" for favicon.png', () => {
    expect(inferImagePurpose('favicon.png')).toBe('favicon');
  });

  it('returns "favicon" for webclip.png', () => {
    expect(inferImagePurpose('webclip.png')).toBe('favicon');
  });

  it('returns "logo" for SVG containing logo', () => {
    expect(inferImagePurpose('my-logo.svg')).toBe('logo');
  });

  it('returns "logo" for PNG containing logo', () => {
    expect(inferImagePurpose('company-logo.png')).toBe('logo');
  });

  it('returns "placeholder" for placeholder-image.png', () => {
    expect(inferImagePurpose('placeholder-image.png')).toBe('placeholder');
  });

  it('returns "icon-or-graphic" for SVG without logo', () => {
    expect(inferImagePurpose('icon-check.svg')).toBe('icon-or-graphic');
  });

  it('returns "animation" for GIF', () => {
    expect(inferImagePurpose('animation.gif')).toBe('animation');
  });

  it('returns "image" as default', () => {
    expect(inferImagePurpose('hero-banner.png')).toBe('image');
  });
});

describe('groupResponsiveVariants', () => {
  it('groups canonical with its variants into one entry', () => {
    const entries = [
      'images/update-chart-1.png',
      'images/update-chart-1-p-500.png',
      'images/update-chart-1-p-800.png',
    ];
    const result = groupResponsiveVariants(entries, ASSETS_DIR);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('update-chart-1.png');
    expect(result[0].variants).toEqual([
      'update-chart-1-p-500.png',
      'update-chart-1-p-800.png',
    ]);
  });

  it('handles variant-only file (no canonical) by promoting variant as canonical', () => {
    const entries = ['images/loading-p-130x130q80.jpeg'];
    const result = groupResponsiveVariants(entries, ASSETS_DIR);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('loading-p-130x130q80.jpeg');
    expect(result[0].variants).toBeUndefined();
  });

  it('returns single entry with no variants when no variant suffix exists', () => {
    const entries = ['images/favicon.png'];
    const result = groupResponsiveVariants(entries, ASSETS_DIR);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('favicon.png');
    expect(result[0].variants).toBeUndefined();
  });

  it('excludes SVGs from responsive grouping — each SVG gets its own entry', () => {
    const entries = ['images/logo.svg', 'images/icon-check.svg'];
    const result = groupResponsiveVariants(entries, ASSETS_DIR);
    expect(result).toHaveLength(2);
    expect(result.find(e => e.filename === 'logo.svg')?.type).toBe('svg');
    expect(result.find(e => e.filename === 'icon-check.svg')?.type).toBe('svg');
  });

  it('sets correct path as project-relative', () => {
    const entries = ['images/favicon.png'];
    const result = groupResponsiveVariants(entries, ASSETS_DIR);
    expect(result[0].path).toBe('.shipstudio/assets/images/favicon.png');
  });

  it('sets referencingPages to empty array', () => {
    const entries = ['images/favicon.png'];
    const result = groupResponsiveVariants(entries, ASSETS_DIR);
    expect(result[0].referencingPages).toEqual([]);
  });

  it('infers purpose correctly for grouped entries', () => {
    const entries = ['images/favicon.png', 'images/logo.svg'];
    const result = groupResponsiveVariants(entries, ASSETS_DIR);
    expect(result.find(e => e.filename === 'favicon.png')?.purpose).toBe('favicon');
    expect(result.find(e => e.filename === 'logo.svg')?.purpose).toBe('logo');
  });

  it('sets type to "animation" for GIF files', () => {
    const entries = ['images/animation.gif'];
    const result = groupResponsiveVariants(entries, ASSETS_DIR);
    expect(result[0].type).toBe('animation');
  });
});

describe('buildVideoGroups', () => {
  it('groups source with transcodes and poster', () => {
    const entries = [
      'videos/viewsituation.mp4',
      'videos/viewsituation-transcode.mp4',
      'videos/viewsituation-transcode.webm',
      'videos/viewsituation-poster-00001.jpg',
    ];
    const result = buildVideoGroups(entries, ASSETS_DIR);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('viewsituation.mp4');
    expect(result[0].transcodes).toEqual([
      'viewsituation-transcode.mp4',
      'viewsituation-transcode.webm',
    ]);
    expect(result[0].poster).toBe('viewsituation-poster-00001.jpg');
  });

  it('handles source-only video with no transcodes or poster', () => {
    const entries = ['videos/solo-video.mp4'];
    const result = buildVideoGroups(entries, ASSETS_DIR);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('solo-video.mp4');
    expect(result[0].transcodes).toBeUndefined();
    expect(result[0].poster).toBeUndefined();
  });

  it('sets correct project-relative path', () => {
    const entries = ['videos/viewsituation.mp4'];
    const result = buildVideoGroups(entries, ASSETS_DIR);
    expect(result[0].path).toBe('.shipstudio/assets/videos/viewsituation.mp4');
  });

  it('sets type and purpose correctly', () => {
    const entries = ['videos/viewsituation.mp4'];
    const result = buildVideoGroups(entries, ASSETS_DIR);
    expect(result[0].type).toBe('video');
    expect(result[0].purpose).toBe('video');
  });

  it('sets referencingPages to empty array', () => {
    const entries = ['videos/viewsituation.mp4'];
    const result = buildVideoGroups(entries, ASSETS_DIR);
    expect(result[0].referencingPages).toEqual([]);
  });
});

describe('buildManifest', () => {
  it('produces images, videos, fonts, cssFiles arrays', () => {
    const manifest = buildManifest(MONEYSTACK_ENTRIES, ASSETS_DIR, PROJECT_PATH);
    expect(manifest.images).toBeDefined();
    expect(manifest.videos).toBeDefined();
    expect(manifest.fonts).toBeDefined();
    expect(manifest.cssFiles).toBeDefined();
  });

  it('excludes CSS/JS from images/videos/fonts arrays', () => {
    const manifest = buildManifest(MONEYSTACK_ENTRIES, ASSETS_DIR, PROJECT_PATH);
    const allFilenames = [
      ...manifest.images.map(e => e.filename),
      ...manifest.videos.map(e => e.filename),
      ...manifest.fonts.map(e => e.filename),
    ];
    expect(allFilenames).not.toContain('normalize.css');
    expect(allFilenames).not.toContain('moneystack-website.css');
    expect(allFilenames).not.toContain('moneystack-website.js');
  });

  it('populates cssFiles with project-relative paths', () => {
    const manifest = buildManifest(MONEYSTACK_ENTRIES, ASSETS_DIR, PROJECT_PATH);
    expect(manifest.cssFiles).toContain('.shipstudio/assets/css/normalize.css');
    expect(manifest.cssFiles).toContain('.shipstudio/assets/css/moneystack-website.css');
  });

  it('does not include JS files in cssFiles', () => {
    const manifest = buildManifest(MONEYSTACK_ENTRIES, ASSETS_DIR, PROJECT_PATH);
    const hasJs = manifest.cssFiles.some(f => f.endsWith('.js'));
    expect(hasJs).toBe(false);
  });

  it('computes totalCopied as count of all non-directory entries in images/, videos/, fonts/, css/, js/', () => {
    const manifest = buildManifest(MONEYSTACK_ENTRIES, ASSETS_DIR, PROJECT_PATH);
    // images: 14 files, videos: 4 files, fonts: 0, css: 2, js: 1 = 21
    expect(manifest.totalCopied).toBe(21);
  });

  it('all entries have referencingPages: []', () => {
    const manifest = buildManifest(MONEYSTACK_ENTRIES, ASSETS_DIR, PROJECT_PATH);
    for (const img of manifest.images) {
      expect(img.referencingPages).toEqual([]);
    }
    for (const vid of manifest.videos) {
      expect(vid.referencingPages).toEqual([]);
    }
  });

  it('all paths are project-relative (start with .shipstudio/assets/)', () => {
    const manifest = buildManifest(MONEYSTACK_ENTRIES, ASSETS_DIR, PROJECT_PATH);
    for (const img of manifest.images) {
      expect(img.path).toMatch(/^\.shipstudio\/assets\//);
    }
    for (const vid of manifest.videos) {
      expect(vid.path).toMatch(/^\.shipstudio\/assets\//);
    }
  });

  it('handles empty fonts case without crash', () => {
    const manifest = buildManifest(MONEYSTACK_ENTRIES, ASSETS_DIR, PROJECT_PATH);
    expect(manifest.fonts).toEqual([]);
  });

  it('handles entries with fonts', () => {
    const entriesWithFonts = [
      ...MONEYSTACK_ENTRIES,
      'fonts/',
      'fonts/MyFont-Regular.woff2',
    ];
    const manifest = buildManifest(entriesWithFonts, ASSETS_DIR, PROJECT_PATH);
    expect(manifest.fonts).toHaveLength(1);
    expect(manifest.fonts[0].filename).toBe('MyFont-Regular.woff2');
    expect(manifest.fonts[0].path).toBe('.shipstudio/assets/fonts/MyFont-Regular.woff2');
    expect(manifest.fonts[0].type).toBe('font');
    expect(manifest.fonts[0].purpose).toBe('font');
    expect(manifest.fonts[0].referencingPages).toEqual([]);
  });
});

describe('Moneystack-scale grouping test', () => {
  it('groups 14 image files (including variants) into ~10 base entries, not 14', () => {
    const imageEntries = MONEYSTACK_ENTRIES.filter(
      e => e.startsWith('images/') && !e.endsWith('/'),
    );
    // Raw image files: 14 (update-chart-1 + 2 variants, loading variant, dylan + variant,
    // aaa + variant, favicon, webclip, logo.svg, icon-check.svg, animation.gif, placeholder-image)
    expect(imageEntries).toHaveLength(14);

    const result = groupResponsiveVariants(imageEntries, ASSETS_DIR);
    // Grouped: update-chart-1 (1), loading (1), dylan (1), aaa (1),
    // favicon (1), webclip (1), logo.svg (1), icon-check.svg (1),
    // animation.gif (1), placeholder-image (1) = 10
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.length).toBeGreaterThanOrEqual(9);
  });
});
