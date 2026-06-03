import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatisticsTable, { type StatsRowBase } from '../StatisticsTable';

vi.mock('next/navigation', () => ({
  useParams: () => ({ accountId: '1' }),
  usePathname: () => '/account/1/statistics',
  useSearchParams: () => new URLSearchParams(),
}));

const mockResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
vi.stubGlobal('ResizeObserver', mockResizeObserver);

type Row = StatsRowBase & { id: string };

const renderTable = (data: Row[]) =>
  render(
    <StatisticsTable
      variant="batting"
      extendedStats={false}
      data={data}
      getRowKey={(row) => (row as Row).id}
    />,
  );

describe('StatisticsTable player links', () => {
  it('builds the player link from contactId even when a different playerId (roster id) is present', () => {
    renderTable([{ id: 'r1', playerName: 'Game Player', contactId: '42', playerId: '999' }]);

    const link = screen.getByRole('link', { name: 'Game Player' });
    const href = link.getAttribute('href') ?? '';
    expect(href).toContain('/account/1/players/42/statistics');
    expect(href).not.toContain('/players/999/');
  });

  it('builds the player link from contactId for season-style rows that carry only contactId', () => {
    renderTable([{ id: 'r2', playerName: 'Season Player', contactId: '7' }]);

    const link = screen.getByRole('link', { name: 'Season Player' });
    expect(link.getAttribute('href') ?? '').toContain('/account/1/players/7/statistics');
  });

  it('does not link a row that has a playerId but no contactId (no fallback)', () => {
    renderTable([{ id: 'r3', playerName: 'No Contact', playerId: '999' }]);

    expect(screen.getByText('No Contact')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'No Contact' })).not.toBeInTheDocument();
  });

  it('does not link a totals row', () => {
    renderTable([{ id: 'totals', playerName: 'Totals', isTotals: true, contactId: '42' }]);

    expect(screen.getByText('Totals')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Totals' })).not.toBeInTheDocument();
  });
});
