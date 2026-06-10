import { describe, it, expect } from 'vitest';
import { composeGameResultMessage } from '../socialGameResultFormatter.js';

describe('composeGameResultMessage — account timezone in date', () => {
  const eveningEstGameDate = new Date('2025-06-11T00:30:00Z');

  it('renders an evening EST game on the local calendar day', () => {
    const message = composeGameResultMessage({
      gameDate: eveningEstGameDate,
      gameStatus: 1,
      homeScore: 5,
      visitorScore: 3,
      homeTeamName: 'Home Team',
      visitorTeamName: 'Visitor Team',
      leagueName: 'Summer League',
      accountTimeZone: 'America/New_York',
    });

    expect(message).toContain('Jun 10');
    expect(message).not.toContain('Jun 11');
  });

  it('falls back to UTC when no timezone is provided', () => {
    const message = composeGameResultMessage({
      gameDate: eveningEstGameDate,
      gameStatus: 1,
      homeScore: 5,
      visitorScore: 3,
      homeTeamName: 'Home Team',
      visitorTeamName: 'Visitor Team',
    });

    expect(message).toContain('Jun 11');
  });

  it('renders a daytime game on the same day regardless of timezone', () => {
    const message = composeGameResultMessage({
      gameDate: new Date('2025-06-15T15:00:00Z'),
      gameStatus: 2,
      homeTeamName: 'Home Team',
      visitorTeamName: 'Visitor Team',
      accountTimeZone: 'America/New_York',
    });

    expect(message).toContain('Jun 15');
  });
});
