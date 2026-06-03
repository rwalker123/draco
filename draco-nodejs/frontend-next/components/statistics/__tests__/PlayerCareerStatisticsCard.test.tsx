import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { PlayerCareerBattingRowType, PlayerCareerStatisticsType } from '@draco/shared-schemas';
import PlayerCareerStatisticsCard from '../PlayerCareerStatisticsCard';

const mockResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
vi.stubGlobal('ResizeObserver', mockResizeObserver);

const ACCOUNT_ID = '1';

const buildBattingRow = (
  overrides: Partial<PlayerCareerBattingRowType>,
): PlayerCareerBattingRowType => ({
  playerId: '100',
  playerName: 'Casey Jones',
  teamName: '',
  ab: 10,
  h: 4,
  r: 2,
  d: 1,
  t: 0,
  hr: 1,
  rbi: 3,
  bb: 2,
  so: 1,
  hbp: 0,
  sb: 0,
  sf: 0,
  sh: 0,
  avg: 0.4,
  obp: 0.5,
  slg: 0.8,
  ops: 1.3,
  tb: 8,
  pa: 12,
  level: 'team',
  ...overrides,
});

const buildStats = (rows: PlayerCareerBattingRowType[]): PlayerCareerStatisticsType => ({
  playerId: '100',
  playerName: 'Casey Jones',
  playerNumber: '7',
  photoUrl: null,
  batting: { rows },
  pitching: { rows: [] },
});

describe('PlayerCareerStatisticsCard team links', () => {
  it('renders a team-level row team name as a link to the team-season page', () => {
    const stats = buildStats([
      buildBattingRow({
        level: 'team',
        seasonId: '2024',
        seasonName: '2024',
        leagueId: '50',
        leagueName: 'Premier',
        teamId: '900',
        teamName: 'Sharks',
      }),
    ]);

    render(<PlayerCareerStatisticsCard accountId={ACCOUNT_ID} stats={stats} />);

    const link = screen.getByRole('link', { name: 'Premier Sharks' });
    expect(link).toHaveAttribute('href', `/account/${ACCOUNT_ID}/seasons/2024/teams/900`);
  });

  it('does not link the career-totals row', () => {
    const stats = buildStats([
      buildBattingRow({
        level: 'career',
        seasonId: null,
        seasonName: null,
        leagueId: null,
        leagueName: null,
        teamId: null,
        teamName: 'All Teams',
        isTotals: true,
      }),
    ]);

    render(<PlayerCareerStatisticsCard accountId={ACCOUNT_ID} stats={stats} />);

    expect(screen.getByText('All Teams')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'All Teams' })).not.toBeInTheDocument();
  });

  it('does not link a season-aggregate row that has no teamId', () => {
    const stats = buildStats([
      buildBattingRow({
        level: 'season',
        seasonId: '2024',
        seasonName: '2024',
        leagueId: '50',
        leagueName: 'Premier',
        teamId: null,
        teamName: 'Multiple Teams',
      }),
    ]);

    render(<PlayerCareerStatisticsCard accountId={ACCOUNT_ID} stats={stats} />);

    expect(screen.getByText(/Multiple Teams/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders distinct links per historical team-season', () => {
    const stats = buildStats([
      buildBattingRow({
        level: 'team',
        seasonId: '2023',
        seasonName: '2023',
        leagueId: '50',
        leagueName: 'Premier',
        teamId: '800',
        teamName: 'Sharks',
      }),
      buildBattingRow({
        level: 'team',
        seasonId: '2024',
        seasonName: '2024',
        leagueId: '50',
        leagueName: 'Premier',
        teamId: '900',
        teamName: 'Sharks',
      }),
    ]);

    render(<PlayerCareerStatisticsCard accountId={ACCOUNT_ID} stats={stats} />);

    const links = screen.getAllByRole('link', { name: 'Premier Sharks' });
    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain(`/account/${ACCOUNT_ID}/seasons/2023/teams/800`);
    expect(hrefs).toContain(`/account/${ACCOUNT_ID}/seasons/2024/teams/900`);
  });
});
