import { useState, useEffect, useCallback, useRef } from 'react';
import type { MigrationPlan, PlanStatus } from '../plan/types';
import {
  loadMigrationPlan,
  computeProgress,
  computePageProgress,
} from '../plan/read';

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

export function MigrationProgress({ shell, projectPath }: MigrationProgressProps) {
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [pollError, setPollError] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
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
      // If result is null and hadPlan is false: silent — file not created yet
    }

    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
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

  // Section label — always rendered if we have a plan or an error state
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

  // Error state — file was readable before, now fails
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

  // No plan yet — silent
  if (plan === null) {
    return null;
  }

  const { complete, total } = computeProgress(plan);
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;

  // Separate shared items and page items — shared items rendered first
  const sharedItems = plan.items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.type === 'shared');
  const pageItems = plan.items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.type !== 'shared');
  const orderedItems = [...sharedItems, ...pageItems];

  return (
    <div>
      {sectionLabel}

      {/* Overall progress bar */}
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

      {/* Item list */}
      <div>
        {orderedItems.map(({ item, idx }) => (
          <div key={idx}>
            {/* Row */}
            <div
              onClick={() => { if (item.children?.length) toggleExpanded(idx); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0',
                cursor: item.children?.length ? 'pointer' : 'default',
                fontSize: '12px',
              }}
            >
              {item.children?.length ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', minWidth: '12px' }}>
                  {expanded.has(idx) ? '\u25BC' : '\u25B6'}
                </span>
              ) : (
                <span style={{ color: STATUS_COLOR[item.status], fontSize: '11px', minWidth: '12px' }}>
                  {STATUS_SYMBOL[item.status]}
                </span>
              )}
              <span style={{ color: 'var(--text-primary)', flex: 1 }}>{item.name}</span>
              {item.children?.length ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  {computePageProgress(item).complete}/{computePageProgress(item).total}
                </span>
              ) : null}
            </div>

            {/* Expanded children */}
            {expanded.has(idx) && item.children?.map((child, ci) => (
              <div
                key={ci}
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
                  {child.notes && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '1px' }}>
                      {child.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
