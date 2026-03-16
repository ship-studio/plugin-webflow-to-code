import type { AssetManifest, ImageEntry, VideoEntry, FontEntry } from './types';

/**
 * Strip Webflow responsive variant suffix from a filename.
 * Patterns: -p-500, -p-800, -p-130x130q80
 */
export function stripVariantSuffix(filename: string): string {
  return filename.replace(/(-p-\d+(?:x\d+)?(?:q\d+)?)(\.[^.]+)$/, '$2');
}

/**
 * Infer the purpose of an image from its filename.
 * Priority order: favicon > logo > placeholder > svg > gif > default image
 */
export function inferImagePurpose(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower === 'favicon.png' || lower === 'webclip.png') return 'favicon';
  if (lower.includes('logo')) return 'logo';
  if (lower.includes('placeholder')) return 'placeholder';
  if (lower.endsWith('.svg')) return 'icon-or-graphic';
  if (lower.endsWith('.gif')) return 'animation';

  return 'image';
}

/**
 * Determine the image type from filename extension.
 */
function inferImageType(filename: string): 'image' | 'svg' | 'animation' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.svg')) return 'svg';
  if (lower.endsWith('.gif')) return 'animation';
  return 'image';
}

/**
 * Convert an absolute assets directory path to a project-relative path.
 */
function toProjectRelative(assetsDir: string, subpath: string): string {
  // assetsDir is like "/proj/.shipstudio/assets"
  // We want ".shipstudio/assets/images/foo.png"
  const idx = assetsDir.indexOf('.shipstudio');
  if (idx === -1) return `${assetsDir}/${subpath}`;
  return `${assetsDir.slice(idx)}/${subpath}`;
}

/**
 * Group responsive image variants under their canonical base entry.
 * SVGs are excluded from variant grouping (they never have responsive variants).
 * GIFs get their own entries with type "animation".
 */
export function groupResponsiveVariants(
  imageEntries: string[],
  assetsDir: string,
): ImageEntry[] {
  const svgEntries: ImageEntry[] = [];
  const rasterEntries: string[] = [];

  // Separate SVGs from raster/GIF images
  for (const entry of imageEntries) {
    const filename = entry.split('/').pop()!;
    if (filename.toLowerCase().endsWith('.svg')) {
      svgEntries.push({
        filename,
        path: toProjectRelative(assetsDir, `images/${filename}`),
        type: 'svg',
        purpose: inferImagePurpose(filename),
        referencingPages: [],
      });
    } else {
      rasterEntries.push(entry);
    }
  }

  // Group raster images by stripped base name
  const groups = new Map<string, { canonical: string | null; variants: string[] }>();

  for (const entry of rasterEntries) {
    const filename = entry.split('/').pop()!;
    const baseName = stripVariantSuffix(filename);
    const key = baseName.toLowerCase();

    if (!groups.has(key)) {
      groups.set(key, { canonical: null, variants: [] });
    }

    const group = groups.get(key)!;

    if (filename === baseName) {
      // This is the canonical (non-variant) file
      group.canonical = filename;
    } else {
      // This is a variant
      group.variants.push(filename);
    }
  }

  const rasterResults: ImageEntry[] = [];
  for (const group of groups.values()) {
    // If no canonical exists, promote the variant filename as-is
    // (variant-only case like loading-p-130x130q80.jpeg)
    const filename = group.canonical ?? (group.variants.length === 1 ? group.variants[0] : group.variants[0]);

    let variants: string[] | undefined;
    if (group.canonical && group.variants.length > 0) {
      variants = group.variants;
    } else if (!group.canonical && group.variants.length > 1) {
      // Multiple variants with no canonical — first becomes canonical, rest stay as variants
      variants = group.variants.slice(1);
    }

    rasterResults.push({
      filename,
      path: toProjectRelative(assetsDir, `images/${filename}`),
      type: inferImageType(filename),
      purpose: inferImagePurpose(filename),
      variants: variants && variants.length > 0 ? variants : undefined,
      referencingPages: [],
    });
  }

  return [...rasterResults, ...svgEntries];
}

/**
 * Group video source files with their transcodes and poster thumbnails.
 */
export function buildVideoGroups(
  videoEntries: string[],
  assetsDir: string,
): VideoEntry[] {
  // Find source videos (not transcodes, not posters)
  const sources = videoEntries.filter(e => {
    const f = e.split('/').pop()!;
    return !f.includes('-transcode') && !f.includes('-poster-');
  });

  return sources.map(srcEntry => {
    const filename = srcEntry.split('/').pop()!;
    const baseName = filename.replace(/\.[^.]+$/, '');

    const transcodes = videoEntries
      .filter(e => e.split('/').pop()!.startsWith(baseName + '-transcode'))
      .map(e => e.split('/').pop()!);

    const poster = videoEntries
      .find(e => e.split('/').pop()!.startsWith(baseName + '-poster-'))
      ?.split('/').pop();

    return {
      filename,
      path: toProjectRelative(assetsDir, `videos/${filename}`),
      type: 'video' as const,
      purpose: 'video' as const,
      transcodes: transcodes.length > 0 ? transcodes : undefined,
      poster,
      referencingPages: [],
    };
  });
}

/**
 * Build the complete asset manifest from zip entries.
 * Filters entries by directory, groups responsive variants and video transcodes,
 * and produces project-relative paths.
 */
export function buildManifest(
  entries: string[],
  assetsDir: string,
  projectPath: string,
): AssetManifest {
  // Filter entries by directory prefix, excluding directory entries (trailing /)
  const imageEntries = entries.filter(
    e => e.startsWith('images/') && !e.endsWith('/'),
  );
  const videoEntries = entries.filter(
    e => e.startsWith('videos/') && !e.endsWith('/'),
  );
  const fontEntries = entries.filter(
    e => e.startsWith('fonts/') && !e.endsWith('/'),
  );
  const cssEntries = entries.filter(
    e => e.startsWith('css/') && !e.endsWith('/'),
  );
  const jsEntries = entries.filter(
    e => e.startsWith('js/') && !e.endsWith('/'),
  );

  const images = groupResponsiveVariants(imageEntries, assetsDir);
  const videos = buildVideoGroups(videoEntries, assetsDir);

  const fonts: FontEntry[] = fontEntries.map(e => {
    const filename = e.split('/').pop()!;
    return {
      filename,
      path: toProjectRelative(assetsDir, `fonts/${filename}`),
      type: 'font' as const,
      purpose: 'font' as const,
      referencingPages: [],
    };
  });

  const cssFiles = cssEntries.map(e =>
    toProjectRelative(assetsDir, e),
  );

  const totalCopied =
    imageEntries.length +
    videoEntries.length +
    fontEntries.length +
    cssEntries.length +
    jsEntries.length;

  return {
    images,
    videos,
    fonts,
    cssFiles,
    totalCopied,
  };
}
