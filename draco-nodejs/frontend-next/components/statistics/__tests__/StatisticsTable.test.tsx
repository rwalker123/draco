import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatisticsTable, { type StatsRowBase } from '../StatisticsTable';
import { statColumnOrderKey } from '../../../constants/storageKeys';

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

describe('StatisticsTable column reordering', () => {
  const battingKey = statColumnOrderKey('batting');

  beforeEach(() => {
    window.localStorage.clear();
  });

  const renderExtended = (data: Row[]) =>
    render(
      <StatisticsTable
        variant="batting"
        extendedStats
        data={data}
        getRowKey={(row) => (row as Row).id}
      />,
    );

  const headerLabels = (): string[] =>
    screen.getAllByRole('columnheader').map((cell) => cell.textContent?.trim() ?? '');

  it('applies a persisted column order, moving PA ahead of AB while keeping Player pinned first', () => {
    window.localStorage.setItem(battingKey, JSON.stringify(['pa', 'ab']));

    renderExtended([{ id: 'r1', playerName: 'Ordered Player', contactId: '1', ab: 10, pa: 12 }]);

    const labels = headerLabels();
    const playerIdx = labels.indexOf('Player');
    const paIdx = labels.indexOf('PA');
    const abIdx = labels.indexOf('AB');

    expect(playerIdx).toBe(1);
    expect(paIdx).toBeGreaterThan(playerIdx);
    expect(paIdx).toBeLessThan(abIdx);
  });

  it('renders stat headers as sortable draggable cells but leaves pinned identity columns non-draggable', () => {
    renderExtended([{ id: 'r1', playerName: 'Drag Player', contactId: '1', ab: 10 }]);

    const headers = screen.getAllByRole('columnheader');
    const abHeader = headers.find((cell) => within(cell).queryByText('AB'));
    const playerHeader = headers.find((cell) => within(cell).queryByText('Player'));

    expect(abHeader?.getAttribute('aria-roledescription')).toBe('sortable column');
    expect(abHeader?.getAttribute('role')).toBe('columnheader');
    expect(abHeader?.getAttribute('tabindex')).toBe('0');
    expect(playerHeader?.getAttribute('aria-roledescription')).toBeNull();
  });

  it('shows a reset control only when a custom order is saved, and clears it on click', () => {
    const { rerender } = renderExtended([{ id: 'r1', playerName: 'P', contactId: '1', ab: 10 }]);
    expect(screen.queryByRole('button', { name: /reset columns/i })).not.toBeInTheDocument();

    window.localStorage.setItem(battingKey, JSON.stringify(['pa', 'ab']));
    rerender(
      <StatisticsTable
        variant="batting"
        extendedStats
        data={[{ id: 'r1', playerName: 'P', contactId: '1', ab: 10 }]}
        getRowKey={(row) => (row as Row).id}
      />,
    );

    const resetButton = screen.getByRole('button', { name: /reset columns/i });
    fireEvent.click(resetButton);

    expect(window.localStorage.getItem(battingKey)).toBeNull();
  });
});
