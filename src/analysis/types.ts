export interface PageInfo {
  filename: string;
  route: string;
  title: string;
  wfPageId: string;
  isCmsTemplate: boolean;
  isUtilityPage: boolean;
  sections: SectionItem[];
  webflowComponents: ComponentEntry[];
  hasIx2Interactions: boolean;
  navWfId: string | null;
  footerWfId: string | null;
  navClassName: string | null;
  footerClassName: string | null;
}

export interface SectionItem {
  tag: string;
  className: string;
  label: string;
}

export interface ComponentEntry {
  wClass: string;
  label: string;
  count: number;
  migration: string;
}

export interface ComponentDef {
  label: string;
  migration: string;
}

export interface SharedLayout {
  hasSharedNav: boolean;
  navWfId: string | undefined;
  hasSharedFooter: boolean;
  footerWfId: string | undefined;
  confidence: 'high' | 'medium';
}

export interface SiteAnalysis {
  pages: PageInfo[];
  sharedLayout: SharedLayout;
  contentPageCount: number;
  cmsTemplateCount: number;
  allWebflowComponents: string[];
}
