import type { SiteAnalysis } from '../analysis/types';
import type { MigrationPlan, PlanItem } from './types';

export function generateMigrationPlan(siteAnalysis: SiteAnalysis): MigrationPlan {
  const items: PlanItem[] = [];

  if (siteAnalysis.sharedLayout.hasSharedNav) {
    items.push({ name: 'Shared Nav', type: 'shared', status: 'pending' });
  }

  if (siteAnalysis.sharedLayout.hasSharedFooter) {
    items.push({ name: 'Shared Footer', type: 'shared', status: 'pending' });
  }

  const contentPages = siteAnalysis.pages.filter(p => !p.isCmsTemplate && !p.isUtilityPage);
  for (const page of contentPages) {
    const children: PlanItem[] = page.sections.map(s => ({
      name: s.label,
      type: 'section' as const,
      status: 'pending' as const,
    }));
    items.push({
      name: page.title,
      type: 'page',
      status: 'pending',
      children: children.length > 0 ? children : undefined,
    });
  }

  const cmsPages = siteAnalysis.pages.filter(p => p.isCmsTemplate);
  for (const page of cmsPages) {
    items.push({
      name: page.title + ' (CMS Template)',
      type: 'page',
      status: 'pending',
    });
  }

  return {
    version: '1.0',
    generatedAt: new Date().toISOString().slice(0, 10),
    items,
  };
}
