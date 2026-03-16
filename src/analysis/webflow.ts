import type { ComponentDef, ComponentEntry } from './types';

/**
 * Static registry of all known Webflow component classes with
 * human-readable labels and migration guidance.
 */
export const WEBFLOW_COMPONENT_REGISTRY: Record<string, ComponentDef> = {
  'w-nav': {
    label: 'Navbar',
    migration:
      'Replace with semantic <nav> + mobile hamburger. w-nav JS handles collapse — rebuild with CSS/JS toggle.',
  },
  'w-dropdown': {
    label: 'Dropdown',
    migration:
      'Replace with <details>/<summary> or CSS :hover + focus-within pattern. Webflow JS drives open/close.',
  },
  'w-slider': {
    label: 'Slider',
    migration:
      'Replace with a carousel library (Embla, Swiper) or CSS scroll snap. w-slider JS is non-portable.',
  },
  'w-tabs': {
    label: 'Tab Switcher',
    migration:
      'Replace with accessible tab pattern (ARIA role="tablist"). Webflow JS drives panel switching.',
  },
  'w-form': {
    label: 'Form',
    migration:
      'Form HTML is usable; replace Webflow form handling backend. Use Resend, Formspree, or server actions.',
  },
  'w-lightbox': {
    label: 'Lightbox',
    migration:
      'Replace with <dialog> element or a lightbox library. Webflow JS drives open/close/media display.',
  },
  'w-embed': {
    label: 'HTML Embed',
    migration:
      'Custom HTML embed — review contents. May contain third-party scripts; preserve as-is or integrate natively.',
  },
  'w-richtext': {
    label: 'Rich Text',
    migration:
      'CMS-bound rich text area. Wrap in prose CSS (e.g., Tailwind @typography) for correct rendering.',
  },
  'w-background-video': {
    label: 'Background Video',
    migration:
      'Replace with <video autoplay muted loop playsinline>. Video URLs in data-video-urls attr point to Webflow CDN — re-host the local copies.',
  },
  'w-dyn-list': {
    label: 'CMS Collection List',
    migration:
      'CMS-driven list. Replace with static data array or API fetch. No data exported in zip.',
  },
};

/**
 * Scan a parsed Document for Webflow component classes.
 * Uses querySelectorAll with exact class matching per registry key.
 * Returns ComponentEntry[] with counts (only for components found).
 */
export function detectComponents(doc: Document): ComponentEntry[] {
  const results: ComponentEntry[] = [];

  for (const [key, def] of Object.entries(WEBFLOW_COMPONENT_REGISTRY)) {
    // Use querySelectorAll with class selector — matches exact class token
    const elements = doc.querySelectorAll(`.${key}`);
    if (elements.length > 0) {
      results.push({
        wClass: key,
        label: def.label,
        count: elements.length,
        migration: def.migration,
      });
    }
  }

  return results;
}

/**
 * Detect IX2 (Interactions 2.0) attributes in the document.
 * Returns true when any interaction-related data attributes are present.
 */
export function detectInteractions(doc: Document): boolean {
  return (
    doc.querySelector(
      '[data-animation], [data-easing], [data-duration-in], [data-duration-out], [data-collapse]',
    ) !== null
  );
}
