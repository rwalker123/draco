import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SchedulePrintView from '../SchedulePrintView';
import { GameStatus } from '@/types/schedule';
import type { Game } from '@/types/schedule';

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
  gameStatusText: overrides.gameStatusText ?? 'Scheduled',
  gameStatusShortText: overrides.gameStatusShortText ?? '',
  gameType: overrides.gameType ?? 0,
  fieldId: overrides.fieldId,
  field: overrides.field,
  league: overrides.league ?? { id: 'l1', name: 'Test League' },
  season: overrides.season ?? { id: 's1', name: 'Season 1' },
});

const gameDay1a = makeGame({
  id: 'g1',
  gameDate: '2024-06-15T19:00:00Z',
  homeTeamName: 'Alpha',
  visitorTeamName: 'Beta',
  gameStatusText: 'Scheduled',
  league: { id: 'l1', name: 'Weekday League' },
  field: { id: 'f1', name: 'Central Park', shortName: 'CP', address: '', city: '', state: '' },
});

const gameDay1b = makeGame({
  id: 'g2',
  gameDate: '2024-06-15T21:00:00Z',
  homeTeamName: 'Gamma',
  visitorTeamName: 'Delta',
  gameStatusText: 'Scheduled',
  league: { id: 'l2', name: 'Night League' },
});

const gameDay2 = makeGame({
  id: 'g3',
  gameDate: '2024-06-20T18:00:00Z',
  homeTeamName: 'Epsilon',
  visitorTeamName: 'Zeta',
  gameStatusText: 'Scheduled',
  league: { id: 'l1', name: 'Weekday League' },
});

describe('SchedulePrintView', () => {
  describe('empty games array', () => {
    it('renders without crashing when games array is empty', () => {
      render(<SchedulePrintView games={[]} title="Test Schedule" timeZone="UTC" />);

      expect(screen.getByText('Test Schedule')).toBeInTheDocument();
    });

    it('shows "No games to display." message when games array is empty', () => {
      render(<SchedulePrintView games={[]} title="Test Schedule" timeZone="UTC" />);

      expect(screen.getByText('No games to display.')).toBeInTheDocument();
    });

    it('does not render a table when games array is empty', () => {
      render(<SchedulePrintView games={[]} title="Test Schedule" timeZone="UTC" />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('grouping by date', () => {
    it('renders a date heading for each unique date', () => {
      render(
        <SchedulePrintView
          games={[gameDay1a, gameDay1b, gameDay2]}
          title="Schedule"
          timeZone="UTC"
        />,
      );

      const headings = screen.getAllByRole('heading', { level: 2, hidden: true });
      expect(headings).toHaveLength(2);
    });

    it('groups games from the same date under one heading', () => {
      render(
        <SchedulePrintView
          games={[gameDay1a, gameDay1b, gameDay2]}
          title="Schedule"
          timeZone="UTC"
        />,
      );

      expect(screen.getByText('Alpha vs Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma vs Delta')).toBeInTheDocument();
      expect(screen.getByText('Epsilon vs Zeta')).toBeInTheDocument();
    });
  });

  describe('ascending sort order', () => {
    it('sorts games in ascending order across dates', () => {
      const laterGame = makeGame({
        id: 'late',
        gameDate: '2024-07-01T18:00:00Z',
        homeTeamName: 'Last',
        visitorTeamName: 'Also Last',
        gameStatusText: 'Scheduled',
      });
      const earlierGame = makeGame({
        id: 'early',
        gameDate: '2024-05-01T18:00:00Z',
        homeTeamName: 'First',
        visitorTeamName: 'Also First',
        gameStatusText: 'Scheduled',
      });

      render(
        <SchedulePrintView games={[laterGame, earlierGame]} title="Schedule" timeZone="UTC" />,
      );

      const matchups = screen.getAllByText(/vs/);
      expect(matchups[0]).toHaveTextContent('First vs Also First');
      expect(matchups[1]).toHaveTextContent('Last vs Also Last');
    });

    it('sorts games within the same date in ascending time order', () => {
      render(<SchedulePrintView games={[gameDay1b, gameDay1a]} title="Schedule" timeZone="UTC" />);

      const matchups = screen.getAllByText(/vs/);
      expect(matchups[0]).toHaveTextContent('Alpha vs Beta');
      expect(matchups[1]).toHaveTextContent('Gamma vs Delta');
    });
  });

  describe('time formatting', () => {
    it('formats game time using the provided timeZone', () => {
      render(
        <SchedulePrintView games={[gameDay1a]} title="Schedule" timeZone="America/New_York" />,
      );

      expect(screen.getByText('3:00 PM')).toBeInTheDocument();
    });

    it('formats game time in UTC when timeZone is UTC', () => {
      render(<SchedulePrintView games={[gameDay1a]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('7:00 PM')).toBeInTheDocument();
    });
  });

  describe('status text', () => {
    it('renders game status text', () => {
      const postponedGame = makeGame({
        id: 'p1',
        gameDate: '2024-06-15T19:00:00Z',
        gameStatus: GameStatus.Postponed,
        gameStatusText: 'Postponed',
      });

      render(<SchedulePrintView games={[postponedGame]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Postponed')).toBeInTheDocument();
    });
  });

  describe('score display for played statuses', () => {
    it('appends score for Completed status (1)', () => {
      const completedGame = makeGame({
        id: 'c1',
        gameDate: '2024-06-15T19:00:00Z',
        gameStatus: GameStatus.Completed,
        gameStatusText: 'Final',
        homeScore: 5,
        visitorScore: 3,
      });

      render(<SchedulePrintView games={[completedGame]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Final · 5–3')).toBeInTheDocument();
    });

    it('appends score for Forfeit status (4)', () => {
      const forfeitGame = makeGame({
        id: 'f1',
        gameDate: '2024-06-15T19:00:00Z',
        gameStatus: GameStatus.Forfeit,
        gameStatusText: 'Forfeit',
        homeScore: 7,
        visitorScore: 0,
      });

      render(<SchedulePrintView games={[forfeitGame]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Forfeit · 7–0')).toBeInTheDocument();
    });

    it('appends score for DidNotReport status (5)', () => {
      const dnrGame = makeGame({
        id: 'd1',
        gameDate: '2024-06-15T19:00:00Z',
        gameStatus: GameStatus.DidNotReport,
        gameStatusText: 'Did Not Report',
        homeScore: 0,
        visitorScore: 0,
      });

      render(<SchedulePrintView games={[dnrGame]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Did Not Report · 0–0')).toBeInTheDocument();
    });
  });

  describe('score NOT displayed for unplayed statuses', () => {
    it('does not append score for Scheduled status (0)', () => {
      const game = makeGame({
        id: 's1',
        gameDate: '2024-06-15T19:00:00Z',
        gameStatus: GameStatus.Scheduled,
        gameStatusText: 'Scheduled',
        homeScore: 0,
        visitorScore: 0,
      });

      render(<SchedulePrintView games={[game]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    it('does not append score for Rainout status (2)', () => {
      const game = makeGame({
        id: 'r1',
        gameDate: '2024-06-15T19:00:00Z',
        gameStatus: GameStatus.Rainout,
        gameStatusText: 'Rainout',
        homeScore: 0,
        visitorScore: 0,
      });

      render(<SchedulePrintView games={[game]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Rainout')).toBeInTheDocument();
      expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    it('does not append score for Postponed status (3)', () => {
      const game = makeGame({
        id: 'pp1',
        gameDate: '2024-06-15T19:00:00Z',
        gameStatus: GameStatus.Postponed,
        gameStatusText: 'Postponed',
        homeScore: 0,
        visitorScore: 0,
      });

      render(<SchedulePrintView games={[game]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Postponed')).toBeInTheDocument();
      expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });
  });

  describe('field display', () => {
    it('shows field name when field is present', () => {
      const gameWithField = makeGame({
        id: 'gf1',
        gameDate: '2024-06-15T19:00:00Z',
        field: {
          id: 'f1',
          name: 'Veterans Field',
          shortName: 'VF',
          address: '',
          city: '',
          state: '',
        },
      });

      render(<SchedulePrintView games={[gameWithField]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Veterans Field')).toBeInTheDocument();
    });

    it('shows "TBD" when game has no field', () => {
      const gameNoField = makeGame({
        id: 'gnf1',
        gameDate: '2024-06-15T19:00:00Z',
        fieldId: undefined,
        field: undefined,
      });

      render(<SchedulePrintView games={[gameNoField]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('TBD')).toBeInTheDocument();
    });

    it('falls back to shortName when name is absent', () => {
      const gameShortNameOnly = makeGame({
        id: 'gsn1',
        gameDate: '2024-06-15T19:00:00Z',
        field: {
          id: 'f2',
          name: '',
          shortName: 'NF',
          address: '',
          city: '',
          state: '',
        },
      });

      render(<SchedulePrintView games={[gameShortNameOnly]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('NF')).toBeInTheDocument();
    });
  });

  describe('matchup display', () => {
    it('uses team names when available', () => {
      render(<SchedulePrintView games={[gameDay1a]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Alpha vs Beta')).toBeInTheDocument();
    });

    it('falls back to teamId when name is absent', () => {
      const game: Game = {
        id: 'gid1',
        gameDate: '2024-06-15T19:00:00Z',
        homeTeamId: 'team-id-123',
        visitorTeamId: 'team-id-456',
        homeScore: 0,
        visitorScore: 0,
        comment: '',
        gameStatus: GameStatus.Scheduled,
        gameStatusText: 'Scheduled',
        gameStatusShortText: '',
        gameType: 0,
        league: { id: 'l1', name: 'Test League' },
        season: { id: 's1', name: 'Season 1' },
      };

      render(<SchedulePrintView games={[game]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('team-id-123 vs team-id-456')).toBeInTheDocument();
    });
  });

  describe('title and subtitle', () => {
    it('renders the title', () => {
      render(<SchedulePrintView games={[]} title="My League Schedule" timeZone="UTC" />);

      expect(screen.getByText('My League Schedule')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(
        <SchedulePrintView
          games={[]}
          title="My League Schedule"
          subtitle="Spring 2024"
          timeZone="UTC"
        />,
      );

      expect(screen.getByText('Spring 2024')).toBeInTheDocument();
    });

    it('does not render subtitle text when subtitle prop is absent', () => {
      render(<SchedulePrintView games={[gameDay1a]} title="My League Schedule" timeZone="UTC" />);

      const subtitleCandidates = screen.queryAllByText(
        (_, el) => el?.tagName === 'P' && el.textContent !== 'No games to display.',
      );
      expect(subtitleCandidates).toHaveLength(0);
    });
  });

  describe('league name display', () => {
    it('renders league name in the table', () => {
      render(<SchedulePrintView games={[gameDay1a]} title="Schedule" timeZone="UTC" />);

      expect(screen.getByText('Weekday League')).toBeInTheDocument();
    });
  });
});
