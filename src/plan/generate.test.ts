// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import type { SiteAnalysis, PageInfo, SharedLayout } from '../analysis/types';
import { generateMigrationPlan } from './generate';

function makeMockSiteAnalysis(overrides?: Partial<SiteAnalysis>): SiteAnalysis {
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
      ],
      webflowComponents: [
        { wClass: 'w-nav', label: 'Navbar', count: 1, migration: 'Replace with semantic <nav>' },
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
      ],
      webflowComponents: [],
      hasIx2Interactions: false,
      navWfId: 'nav-wf-id-1',
      footerWfId: 'footer-wf-id-1',
      navClassName: 'navbar',
      footerClassName: 'footer',
    },
    {
      filename: '404.html',
      route: '/404',
      title: '404 Not Found',
      wfPageId: 'wf-page-3',
      isCmsTemplate: false,
      isUtilityPage: true,
      sections: [],
      webflowComponents: [],
      hasIx2Interactions: false,
      navWfId: null,
      footerWfId: null,
      navClassName: null,
      footerClassName: null,
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

  const base: SiteAnalysis = {
    pages,
    sharedLayout,
    contentPageCount: 2,
    cmsTemplateCount: 1,
    allWebflowComponents: ['w-nav'],
  };

  return { ...base, ...overrides };
}

describe('generateMigrationPlan', () => {
  it('shared nav appears as first item when hasSharedNav is true', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    expect(result.items[0]).toEqual({ name: 'Shared Nav', type: 'shared', status: 'pending' });
  });

  it('shared footer appears as second item when hasSharedFooter is true', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    expect(result.items[1]).toEqual({ name: 'Shared Footer', type: 'shared', status: 'pending' });
  });

  it('no shared items when both hasSharedNav and hasSharedFooter are false', () => {
    const input = makeMockSiteAnalysis({
      sharedLayout: {
        hasSharedNav: false,
        navWfId: undefined,
        hasSharedFooter: false,
        footerWfId: undefined,
        confidence: 'high',
      },
    });
    const result = generateMigrationPlan(input);
    const sharedItems = result.items.filter(i => i.type === 'shared');
    expect(sharedItems).toHaveLength(0);
  });

  it('content pages appear as type page items with children mapped from page.sections', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    const homeItem = result.items.find(i => i.name === 'Home');
    expect(homeItem).toBeDefined();
    expect(homeItem!.type).toBe('page');
    expect(homeItem!.children).toHaveLength(2);
  });

  it('each section child has name from section.label, type section, status pending', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    const homeItem = result.items.find(i => i.name === 'Home');
    expect(homeItem!.children![0]).toEqual({ name: 'Hero', type: 'section', status: 'pending' });
    expect(homeItem!.children![1]).toEqual({ name: 'Features', type: 'section', status: 'pending' });
  });

  it('page with no sections has children: undefined (not empty array)', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    const cmsItem = result.items.find(i => i.name === 'Blog Post (CMS Template)');
    expect(cmsItem).toBeDefined();
    expect(cmsItem!.children).toBeUndefined();
  });

  it('utility pages are excluded entirely', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    const utilityItem = result.items.find(i => i.name === '404 Not Found');
    expect(utilityItem).toBeUndefined();
  });

  it('CMS template pages appear with (CMS Template) suffix in name, no children', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    const cmsItem = result.items.find(i => i.name === 'Blog Post (CMS Template)');
    expect(cmsItem).toBeDefined();
    expect(cmsItem!.type).toBe('page');
    expect(cmsItem!.children).toBeUndefined();
  });

  it('all statuses are pending in the skeleton', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    function checkAllPending(items: typeof result.items): void {
      for (const item of items) {
        expect(item.status).toBe('pending');
        if (item.children) checkAllPending(item.children);
      }
    }
    checkAllPending(result.items);
  });

  it('output has version 1.0 and generatedAt as YYYY-MM-DD string', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    expect(result.version).toBe('1.0');
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('items order is shared components first, then content pages, then CMS templates', () => {
    const result = generateMigrationPlan(makeMockSiteAnalysis());
    const names = result.items.map(i => i.name);
    const navIdx = names.indexOf('Shared Nav');
    const footerIdx = names.indexOf('Shared Footer');
    const homeIdx = names.indexOf('Home');
    const aboutIdx = names.indexOf('About Us');
    const cmsIdx = names.indexOf('Blog Post (CMS Template)');

    expect(navIdx).toBeLessThan(homeIdx);
    expect(footerIdx).toBeLessThan(homeIdx);
    expect(homeIdx).toBeLessThan(cmsIdx);
    expect(aboutIdx).toBeLessThan(cmsIdx);
  });
});
