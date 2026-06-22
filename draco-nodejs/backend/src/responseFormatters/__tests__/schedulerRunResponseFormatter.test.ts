import { describe, expect, it } from 'vitest';
import type { schedulerrun } from '#prisma/client';
import { SchedulerRunResponseFormatter } from '../schedulerRunResponseFormatter.js';

const buildRow = (status: string): schedulerrun => ({
  runid: 'r1',
  accountid: 1n,
  seasonid: 5n,
  status,
  processed: 0,
  total: 0,
  result: null,
  error: null,
  createdat: new Date('2026-06-21T00:00:00Z'),
  updatedat: new Date('2026-06-21T00:00:00Z'),
});

describe('SchedulerRunResponseFormatter', () => {
  it('passes known lifecycle statuses through unchanged', () => {
    expect(SchedulerRunResponseFormatter.format(buildRow('queued')).status).toBe('queued');
    expect(SchedulerRunResponseFormatter.format(buildRow('running')).status).toBe('running');
    expect(SchedulerRunResponseFormatter.format(buildRow('completed')).status).toBe('completed');
    expect(SchedulerRunResponseFormatter.format(buildRow('failed')).status).toBe('failed');
  });

  it('maps an unknown/corrupt status to failed rather than queued', () => {
    expect(SchedulerRunResponseFormatter.format(buildRow('bogus')).status).toBe('failed');
  });
});
