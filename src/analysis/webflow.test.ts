// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import {
  WEBFLOW_COMPONENT_REGISTRY,
  detectComponents,
  detectInteractions,
} from './webflow';

function makeDoc(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

describe('WEBFLOW_COMPONENT_REGISTRY', () => {
  const expectedKeys = [
    'w-nav',
    'w-dropdown',
    'w-slider',
    'w-tabs',
    'w-form',
    'w-lightbox',
    'w-embed',
    'w-richtext',
    'w-background-video',
    'w-dyn-list',
  ];

  it('has entries for all 10 known w-* classes', () => {
    expect(Object.keys(WEBFLOW_COMPONENT_REGISTRY)).toHaveLength(10);
    for (const key of expectedKeys) {
      expect(WEBFLOW_COMPONENT_REGISTRY).toHaveProperty(key);
    }
  });

  it('each entry has label and migration strings', () => {
    for (const key of expectedKeys) {
      const entry = WEBFLOW_COMPONENT_REGISTRY[key];
      expect(typeof entry.label).toBe('string');
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.migration).toBe('string');
      expect(entry.migration.length).toBeGreaterThan(0);
    }
  });
});

describe('detectComponents', () => {
  it('returns entries for w-nav (count 2) and w-tabs (count 1)', () => {
    const doc = makeDoc(`
      <html><body>
        <nav class="w-nav">Nav 1</nav>
        <nav class="w-nav">Nav 2</nav>
        <div class="w-tabs">Tabs</div>
      </body></html>
    `);
    const result = detectComponents(doc);
    expect(result).toHaveLength(2);

    const nav = result.find((c) => c.wClass === 'w-nav');
    expect(nav).toBeDefined();
    expect(nav!.count).toBe(2);
    expect(nav!.label).toBe('Navbar');

    const tabs = result.find((c) => c.wClass === 'w-tabs');
    expect(tabs).toBeDefined();
    expect(tabs!.count).toBe(1);
    expect(tabs!.label).toBe('Tab Switcher');
  });

  it('returns empty array when no w-* classes present', () => {
    const doc = makeDoc('<html><body><div class="normal">Content</div></body></html>');
    const result = detectComponents(doc);
    expect(result).toEqual([]);
  });

  it('does not match subclass like w-nav-brand as w-nav', () => {
    const doc = makeDoc(`
      <html><body>
        <a class="w-nav-brand">Brand</a>
      </body></html>
    `);
    const result = detectComponents(doc);
    // w-nav-brand should NOT count as w-nav
    const nav = result.find((c) => c.wClass === 'w-nav');
    expect(nav).toBeUndefined();
  });
});

describe('detectInteractions', () => {
  it('returns true when element has data-animation attribute', () => {
    const doc = makeDoc('<html><body><div data-animation="fade"></div></body></html>');
    expect(detectInteractions(doc)).toBe(true);
  });

  it('returns true when element has data-easing attribute', () => {
    const doc = makeDoc('<html><body><div data-easing="ease-in"></div></body></html>');
    expect(detectInteractions(doc)).toBe(true);
  });

  it('returns true when element has data-duration-in attribute', () => {
    const doc = makeDoc('<html><body><div data-duration-in="300"></div></body></html>');
    expect(detectInteractions(doc)).toBe(true);
  });

  it('returns false when no interaction attributes present', () => {
    const doc = makeDoc('<html><body><div class="normal">No interactions</div></body></html>');
    expect(detectInteractions(doc)).toBe(false);
  });
});
