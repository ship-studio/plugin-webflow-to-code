import { useState, useEffect, useCallback, useRef } from 'react';
import type { MigrationPlan, PlanItem, PlanStatus } from '../plan/types';
import {
  loadMigrationPlan,
  computeProgress,
  computePageProgress,
} from '../plan/read';
import { buildResumePrompt } from '../plan/resumePrompt';
import { copyToClipboard } from '../brief/io';

interface MigrationProgressProps {
  shell: { exec(cmd: string, args: string[]): Promise<{ exit_code: number; stdout: string; stderr: string }> };
  projectPath: string;
}

const STATUS_SYMBOL: Record<PlanStatus, string> = {
  pending: '\u25CB',       // ○
  'in-progress': '\u25C6', // ◆
  complete: '\u2713',      // ✓
};

const STATUS_COLOR: Record<PlanStatus, string> = {
  pending: 'var(--text-muted)',
  'in-progress': 'var(--accent, #0d99ff)',
  complete: '#4caf50',
};

function ChildItem({ child }: { child: PlanItem }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '2px 0 2px 18px',
        fontSize: '11px',
      }}
    >
      <span
        style={{
          color: STATUS_COLOR[child.status],
          fontSize: '11px',
          minWidth: '14px',
          flexShrink: 0,
        }}
      >
        {STATUS_SYMBOL[child.status]}
      </span>
      <div>
        <span style={{ color: 'var(--text-primary)' }}>{child.name}</span>
        {child.notes ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '1px' }}>
            {child.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PlanRow({ item, isExpanded, onToggle }: { item: PlanItem; isExpanded: boolean; onToggle: () => void }) {
  const hasChildren = item.children && item.children.length > 0;
  const progress = hasChildren ? computePageProgress(item) : null;

  return (
    <div>
      <div
        onClick={hasChildren ? onToggle : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 0',
          cursor: hasChildren ? 'pointer' : 'default',
          fontSize: '12px',
        }}
      >
        {hasChildren ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '10px', minWidth: '12px' }}>
            {isExpanded ? '\u25BC' : '\u25B6'}
          </span>
        ) : (
          <span style={{ color: STATUS_COLOR[item.status], fontSize: '11px', minWidth: '12px' }}>
            {STATUS_SYMBOL[item.status]}
          </span>
        )}
        <span style={{ color: 'var(--text-primary)', flex: 1 }}>{item.name}</span>
        {progress ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {progress.complete}/{progress.total}
          </span>
        ) : null}
      </div>
      {isExpanded && item.children ? item.children.map((child, ci) => (
        <ChildItem key={ci} child={child} />
      )) : null}
    </div>
  );
}

export function MigrationProgress({ shell, projectPath }: MigrationProgressProps) {
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [pollError, setPollError] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [resumeCopied, setResumeCopied] = useState(false);
  const hadPlan = useRef(false);

  useEffect(() => {
    async function poll() {
      const result = await loadMigrationPlan(shell, projectPath);
      if (result !== null) {
        setPlan(result);
        hadPlan.current = true;
        setPollError(false);
      } else if (hadPlan.current) {
        setPollError(true);
      }
    }

    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [shell, projectPath]);

  const handleContinueMigration = useCallback(async () => {
    const promptText = buildResumePrompt(projectPath);
    await copyToClipboard(shell, promptText);
    setResumeCopied(true);
    setTimeout(() => setResumeCopied(false), 2000);
  }, [shell, projectPath]);

  const toggleExpanded = useCallback((idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const sectionLabel = (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: '8px',
        marginTop: '16px',
      }}
    >
      Migration Progress
    </div>
  );

  if (pollError && plan === null) {
    return (
      <div>
        {sectionLabel}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
          Could not read migration plan
        </div>
      </div>
    );
  }

  if (plan === null) {
    return null;
  }

  const { complete, total } = computeProgress(plan);
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;

  const sharedItems = plan.items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.type === 'shared');
  const pageItems = plan.items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.type !== 'shared');
  const orderedItems = [...sharedItems, ...pageItems];

  return (
    <div>
      {sectionLabel}
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
        {complete}/{total} items ({pct}%)
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '3px',
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: '#4caf50',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div>
        {orderedItems.map(({ item, idx }) => (
          <PlanRow
            key={idx}
            item={item}
            isExpanded={expanded.has(idx)}
            onToggle={() => toggleExpanded(idx)}
          />
        ))}
      </div>
      <button
        className="btn-primary"
        onClick={handleContinueMigration}
        style={{ width: '100%', marginTop: '12px', marginBottom: '8px' }}
      >
        {resumeCopied ? 'Prompt copied — paste into your agent' : 'Copy Resume Prompt'}
      </button>
    </div>
  );
}
