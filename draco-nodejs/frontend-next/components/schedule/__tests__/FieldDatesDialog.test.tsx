import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import FieldDatesDialog from '../FieldDatesDialog';
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
  gameStatusText: overrides.gameStatusText ?? '',
  gameStatusShortText: overrides.gameStatusShortText ?? '',
  gameType: overrides.gameType ?? 0,
  fieldId: overrides.fieldId,
  field: overrides.field,
  league: overrides.league ?? { id: 'l1', name: 'League' },
  season: overrides.season ?? { id: 's1', name: 'Season' },
});

const FIELD_A_ID = 'field-a';
const FIELD_B_ID = 'field-b';

const gameAtFieldA1 = makeGame({
  id: 'g1',
  gameDate: '2024-06-15T19:00:00Z',
  field: { id: FIELD_A_ID, name: 'Field A', shortName: 'FA', address: '', city: '', state: '' },
  homeTeamName: 'Alpha',
  visitorTeamName: 'Beta',
});

const gameAtFieldA2 = makeGame({
  id: 'g2',
  gameDate: '2024-06-10T19:00:00Z',
  field: { id: FIELD_A_ID, name: 'Field A', shortName: 'FA', address: '', city: '', state: '' },
  homeTeamName: 'Gamma',
  visitorTeamName: 'Delta',
});

const gameAtFieldB = makeGame({
  id: 'g3',
  gameDate: '2024-06-12T19:00:00Z',
  field: { id: FIELD_B_ID, name: 'Field B', shortName: 'FB', address: '', city: '', state: '' },
  homeTeamName: 'Epsilon',
  visitorTeamName: 'Zeta',
});

const allGames = [gameAtFieldA1, gameAtFieldA2, gameAtFieldB];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  fieldId: FIELD_A_ID,
  fieldName: 'Field A',
  games: allGames,
  timeZone: 'UTC',
};

describe('FieldDatesDialog', () => {
  describe('game filtering', () => {
    it('renders only games matching the given fieldId', () => {
      render(<FieldDatesDialog {...defaultProps} />);

      expect(screen.getByText('Alpha vs Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma vs Delta')).toBeInTheDocument();
      expect(screen.queryByText('Epsilon vs Zeta')).not.toBeInTheDocument();
    });

    it('excludes games at other fields', () => {
      render(<FieldDatesDialog {...defaultProps} />);

      expect(screen.queryByText('Epsilon vs Zeta')).not.toBeInTheDocument();
    });
  });

  describe('sort order', () => {
    it('renders games in ascending date order', () => {
      render(<FieldDatesDialog {...defaultProps} />);

      const rows = screen.getAllByText(/vs/);
      expect(rows[0]).toHaveTextContent('Gamma vs Delta');
      expect(rows[1]).toHaveTextContent('Alpha vs Beta');
    });
  });

  describe('time formatting', () => {
    it('formats time using the provided timeZone', () => {
      render(
        <FieldDatesDialog {...defaultProps} games={[gameAtFieldA1]} timeZone="America/New_York" />,
      );

      expect(screen.getByText('3:00 PM')).toBeInTheDocument();
    });

    it('formats time in UTC when timeZone is UTC', () => {
      render(<FieldDatesDialog {...defaultProps} games={[gameAtFieldA1]} timeZone="UTC" />);

      expect(screen.getByText('7:00 PM')).toBeInTheDocument();
    });
  });

  describe('null fieldId', () => {
    it('does not render content when fieldId is null and no matching games exist', () => {
      const noFieldGames = [gameAtFieldA1, gameAtFieldA2];
      render(
        <FieldDatesDialog
          {...defaultProps}
          fieldId={null}
          fieldName="No Field / TBD"
          games={noFieldGames}
        />,
      );

      expect(screen.getByText('No games found for this field.')).toBeInTheDocument();
    });

    it('renders games with no field assignment when fieldId is null', () => {
      const noFieldGame = makeGame({
        id: 'gx',
        gameDate: '2024-07-01T18:00:00Z',
        homeTeamName: 'Team X',
        visitorTeamName: 'Team Y',
      });

      render(
        <FieldDatesDialog
          {...defaultProps}
          fieldId={null}
          fieldName="No Field / TBD"
          games={[noFieldGame, gameAtFieldA1]}
        />,
      );

      expect(screen.getByText('Team X vs Team Y')).toBeInTheDocument();
      expect(screen.queryByText('Alpha vs Beta')).not.toBeInTheDocument();
    });
  });

  describe('formatResult', () => {
    it('renders Upcoming for a scheduled game', () => {
      const scheduledGame = makeGame({
        id: 'g-sched',
        gameDate: '2024-08-01T18:00:00Z',
        field: {
          id: FIELD_A_ID,
          name: 'Field A',
          shortName: 'FA',
          address: '',
          city: '',
          state: '',
        },
        gameStatus: GameStatus.Scheduled,
        gameStatusText: '',
        homeTeamName: 'TeamX',
        visitorTeamName: 'TeamY',
      });

      render(<FieldDatesDialog {...defaultProps} games={[scheduledGame]} />);

      expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });

    it('renders em dash when gameStatusText is empty string', () => {
      const emptyStatusGame = makeGame({
        id: 'g-empty',
        gameDate: '2024-08-01T18:00:00Z',
        field: {
          id: FIELD_A_ID,
          name: 'Field A',
          shortName: 'FA',
          address: '',
          city: '',
          state: '',
        },
        gameStatus: GameStatus.Completed,
        gameStatusText: '',
        homeTeamName: 'TeamA',
        visitorTeamName: 'TeamB',
      });

      render(<FieldDatesDialog {...defaultProps} games={[emptyStatusGame]} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('onClose wiring', () => {
    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<FieldDatesDialog {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<FieldDatesDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'close' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
