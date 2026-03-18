export type PlanStatus = 'pending' | 'in-progress' | 'complete';

export interface PlanItem {
  name: string;
  type: 'shared' | 'page' | 'section' | 'component';
  status: PlanStatus;
  notes?: string;
  children?: PlanItem[];
}

export interface MigrationPlan {
  version: '1.0';
  generatedAt: string;
  items: PlanItem[];
}
