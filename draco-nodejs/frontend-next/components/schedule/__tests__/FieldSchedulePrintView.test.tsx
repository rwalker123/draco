import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FieldSchedulePrintView from '../FieldSchedulePrintView';
import { GameStatus } from '@/types/schedule';
import type { Game } from '@/types/schedule';
import type { FieldGameGroup } from '../utils/fieldGames';

const makeGame = (overrides: Partial<Game> & { id: string; gameDate: string }): Game => ({
  id: overrides.id,
  gameDate: overrides.gameDate,
  homeTeamId: overrides.homeTeamId ?? 'home-team',
  homeTeamName: overrides.homeTeamName ?? 'Home Team',
  visitorTeamId: overrides.visitorTeamId ?? 'visitor-team',
  visitorTeamName: overrides.visitorTeamName ?? 'Visitor Team',
  homeScore: overrides.homeScore ?? 0,
  visitorScore: overrides.visitorScore ?? 0,
  comment: overrides.comment ?? '',
  gameStatus: overrides.gameStatus ?? GameStatus.Scheduled,
  gameStatusText: overrides.gameStatusText ?? '',
  gameStatusShortText: overrides.gameStatusShortText ?? '',
  gameType: overrides.gameType ?? 0,
  fieldId: overrides.fieldId,
  field: overrides.field,
  league: overrides.league ?? { id: 'l1', name: 'Adult League' },
  season: overrides.season ?? { id: 's1', name: 'Season' },
});

const groups: FieldGameGroup[] = [
  {
    fieldId: 'f1',
    fieldName: 'Berkley',
    games: [
      makeGame({
        id: 'g1',
        gameDate: '2026-05-11T21:00:00Z',
        homeTeamName: 'White Sox',
        visitorTeamName: 'Dodgers',
      }),
      makeGame({
        id: 'g2',
        gameDate: '2026-06-15T21:00:00Z',
        homeTeamName: 'Marlins',
        visitorTeamName: 'Biscuits',
      }),
    ],
  },
  {
    fieldId: 'f2',
    fieldName: 'Hamtramck',
    games: [
      makeGame({
        id: 'g3',
        gameDate: '2026-06-01T18:00:00Z',
        homeTeamName: 'Tigers',
        visitorTeamName: 'Cubs',
        gameStatus: GameStatus.Completed,
        gameStatusText: 'Final',
      }),
    ],
  },
];

const defaultProps = {
  groups,
  title: 'Detroit MSBL',
  subtitle: '2025 Season · Schedule by Field',
  timeZone: 'UTC',
};

describe('FieldSchedulePrintView', () => {
  it('renders the document title and subtitle', () => {
    render(<FieldSchedulePrintView {...defaultProps} />);

    expect(screen.getByText('Detroit MSBL')).toBeInTheDocument();
    expect(screen.getByText('2025 Season · Schedule by Field')).toBeInTheDocument();
  });

  it('renders a single table with Field as the first column', () => {
    const { container } = render(<FieldSchedulePrintView {...defaultProps} />);

    const tables = container.querySelectorAll('table');
    expect(tables).toHaveLength(1);

    const headers = Array.from(tables[0].querySelectorAll('th')).map((th) => th.textContent);
    expect(headers).toEqual(['Field', 'Date', 'Time', 'League', 'Matchup', 'Result']);
  });

  it('renders one row per game with the field name first, grouped by field', () => {
    const { container } = render(<FieldSchedulePrintView {...defaultProps} />);

    const rows = Array.from(container.querySelectorAll('tbody tr')).map((tr) =>
      Array.from(tr.querySelectorAll('td')).map((td) => td.textContent),
    );

    expect(rows).toEqual([
      [
        'Berkley',
        'Mon, May 11, 2026',
        '9:00 PM',
        'Adult League',
        'White Sox vs Dodgers',
        'Upcoming',
      ],
      [
        'Berkley',
        'Mon, Jun 15, 2026',
        '9:00 PM',
        'Adult League',
        'Marlins vs Biscuits',
        'Upcoming',
      ],
      ['Hamtramck', 'Mon, Jun 1, 2026', '6:00 PM', 'Adult League', 'Tigers vs Cubs', 'Final'],
    ]);
  });

  it('formats dates and times in the supplied time zone', () => {
    const { container } = render(
      <FieldSchedulePrintView {...defaultProps} timeZone="America/New_York" />,
    );

    const firstRow = container.querySelector('tbody tr');
    const cells = Array.from(firstRow?.querySelectorAll('td') ?? []).map((td) => td.textContent);

    expect(cells[1]).toBe('Mon, May 11, 2026');
    expect(cells[2]).toBe('5:00 PM');
  });

  it('claims print priority so the page-level print view is suppressed', () => {
    const { container } = render(<FieldSchedulePrintView {...defaultProps} />);

    expect(container.querySelector('.dr-print-root.dr-print-priority')).not.toBeNull();
  });

  it('renders an empty-state message when there are no groups', () => {
    const { container } = render(<FieldSchedulePrintView {...defaultProps} groups={[]} />);

    expect(screen.getByText('No games to display.')).toBeInTheDocument();
    expect(container.querySelector('table')).toBeNull();
  });
});
