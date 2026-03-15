import { test, expect } from '../../fixtures/golf-score-update-fixtures';
import { ApiHelper } from '../../helpers/api';
import { getJwtToken, BASE_URL } from '../../helpers/auth';
import { todayDateString } from '../../helpers/date';

function findTeamStanding(
  standings: Awaited<ReturnType<ApiHelper['getSeasonStandings']>>,
  teamId: string,
) {
  for (const flight of standings.flights) {
    const team = flight.standings.find((s) => s.teamSeasonId === teamId);
    if (team) return team;
  }
  return undefined;
}

test.describe('Standings update after score change', () => {
  test('standings reflect updated points and W/L/T after resubmitting scores on a completed match', async ({
    scoreUpdateData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const { accountId, seasonId, matchId, courseId, teeId, team1Id, team2Id } = scoreUpdateData;
    const { player1RosterId, player2RosterId } = scoreUpdateData;

    const datePlayed = todayDateString();

    await api.submitMatchResults(accountId, matchId, {
      courseId,
      teeId,
      totalsOnly: true,
      scores: [
        {
          teamSeasonId: team1Id,
          rosterId: player1RosterId,
          score: {
            courseId,
            teeId,
            datePlayed,
            holesPlayed: 18,
            totalsOnly: true,
            totalScore: 90,
            frontNineScore: 45,
            backNineScore: 45,
          },
        },
        {
          teamSeasonId: team2Id,
          rosterId: player2RosterId,
          score: {
            courseId,
            teeId,
            datePlayed,
            holesPlayed: 18,
            totalsOnly: true,
            totalScore: 90,
            frontNineScore: 45,
            backNineScore: 45,
          },
        },
      ],
    });

    await api.updateMatchStatus(accountId, matchId, 1);

    const standingsAfterTie = await api.getSeasonStandings(accountId, seasonId);
    const team1AfterTie = findTeamStanding(standingsAfterTie, team1Id);
    const team2AfterTie = findTeamStanding(standingsAfterTie, team2Id);

    expect(team1AfterTie).toBeDefined();
    expect(team2AfterTie).toBeDefined();
    expect(team1AfterTie!.matchesTied).toBe(1);
    expect(team2AfterTie!.matchesTied).toBe(1);
    expect(team1AfterTie!.matchesWon).toBe(0);
    expect(team2AfterTie!.matchesWon).toBe(0);
    expect(team1AfterTie!.matchesLost).toBe(0);
    expect(team2AfterTie!.matchesLost).toBe(0);

    const tieMatchPoints = team1AfterTie!.matchPoints;
    const tieTotalPoints = team1AfterTie!.totalPoints;

    await api.submitMatchResults(accountId, matchId, {
      courseId,
      teeId,
      totalsOnly: true,
      scores: [
        {
          teamSeasonId: team1Id,
          rosterId: player1RosterId,
          score: {
            courseId,
            teeId,
            datePlayed,
            holesPlayed: 18,
            totalsOnly: true,
            totalScore: 82,
            frontNineScore: 40,
            backNineScore: 42,
          },
        },
        {
          teamSeasonId: team2Id,
          rosterId: player2RosterId,
          score: {
            courseId,
            teeId,
            datePlayed,
            holesPlayed: 18,
            totalsOnly: true,
            totalScore: 90,
            frontNineScore: 45,
            backNineScore: 45,
          },
        },
      ],
    });

    const standingsAfterUpdate = await api.getSeasonStandings(accountId, seasonId);
    const team1After = findTeamStanding(standingsAfterUpdate, team1Id);
    const team2After = findTeamStanding(standingsAfterUpdate, team2Id);

    expect(team1After).toBeDefined();
    expect(team2After).toBeDefined();

    expect(team1After!.matchesWon).toBe(1);
    expect(team1After!.matchesLost).toBe(0);
    expect(team1After!.matchesTied).toBe(0);

    expect(team2After!.matchesWon).toBe(0);
    expect(team2After!.matchesLost).toBe(1);
    expect(team2After!.matchesTied).toBe(0);

    expect(team1After!.matchPoints).not.toBe(tieMatchPoints);
    expect(team1After!.totalPoints).not.toBe(tieTotalPoints);
  });
});
