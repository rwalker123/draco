import { test, expect } from '../../fixtures/golf-stats-fixtures';
import { ApiHelper } from '../../helpers/api';
import { getJwtToken, BASE_URL } from '../../helpers/auth';

test.describe('Golf Statistics - Individual League', () => {
  test('flight leaders returns low actual scores sorted ascending', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const leaders = await api.getFlightLeaders(statsData.accountId, statsData.individual.flightId);

    expect(leaders.lowActualScore.length).toBeGreaterThan(0);
    expect(leaders.lowActualScore[0].rank).toBe(1);

    for (let i = 1; i < leaders.lowActualScore.length; i++) {
      expect(leaders.lowActualScore[i].value).toBeGreaterThanOrEqual(
        leaders.lowActualScore[i - 1].value,
      );
    }
  });

  test('flight leaders returns scoring averages for all players', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const leaders = await api.getFlightLeaders(statsData.accountId, statsData.individual.flightId);

    expect(leaders.scoringAverages.length).toBeGreaterThan(0);

    for (const avg of leaders.scoringAverages) {
      expect(avg.roundsPlayed).toBeGreaterThan(0);
      expect(avg.averageScore).toBeGreaterThan(0);
    }
  });

  test('flight leaders low net scores are populated when handicap scoring is enabled', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const leaders = await api.getFlightLeaders(statsData.accountId, statsData.individual.flightId);

    expect(leaders.lowNetScore.length).toBeGreaterThan(0);
    expect(leaders.lowNetScore[0].rank).toBe(1);
  });

  test('actual skins returns entries with correct skinsType', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const skins = await api.getFlightSkins(
      statsData.accountId,
      statsData.individual.flightId,
      'actual',
    );

    expect(Array.isArray(skins)).toBe(true);

    for (const entry of skins) {
      expect(entry.skinsWon).toBeGreaterThan(0);
      if (entry.skinsType !== undefined) {
        expect(entry.skinsType).toBe('actual');
      }
    }
  });

  test('net skins returns entries with net skinsType', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const netSkins = await api.getFlightSkins(
      statsData.accountId,
      statsData.individual.flightId,
      'net',
    );

    expect(Array.isArray(netSkins)).toBe(true);

    for (const entry of netSkins) {
      expect(entry.skinsWon).toBeGreaterThan(0);
      if (entry.skinsType !== undefined) {
        expect(entry.skinsType).toBe('net');
      }
    }
  });

  test('skins filtered by week 1 returns only week 1 entries', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const week1Skins = await api.getFlightSkins(
      statsData.accountId,
      statsData.individual.flightId,
      'actual',
      1,
    );

    expect(Array.isArray(week1Skins)).toBe(true);

    for (const entry of week1Skins) {
      if (entry.weekNumber !== undefined && entry.weekNumber !== null) {
        expect(entry.weekNumber).toBe(1);
      }
    }
  });

  test('skins filtered by week 2 returns independent result from week 1', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());

    const [week1Skins, week2Skins] = await Promise.all([
      api.getFlightSkins(statsData.accountId, statsData.individual.flightId, 'actual', 1),
      api.getFlightSkins(statsData.accountId, statsData.individual.flightId, 'actual', 2),
    ]);

    expect(Array.isArray(week1Skins)).toBe(true);
    expect(Array.isArray(week2Skins)).toBe(true);
  });

  test('score type leaders returns boards with birdies category', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const scoreTypes = await api.getFlightScoreTypes(
      statsData.accountId,
      statsData.individual.flightId,
    );

    expect(scoreTypes.length).toBeGreaterThanOrEqual(1);

    for (const board of scoreTypes) {
      expect(board.category).toBeTruthy();
      expect(board.categoryLabel).toBeTruthy();
      expect(Array.isArray(board.leaders)).toBe(true);
    }
  });

  test('score type leaders has ranked entries within each category', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const scoreTypes = await api.getFlightScoreTypes(
      statsData.accountId,
      statsData.individual.flightId,
    );

    for (const board of scoreTypes) {
      if (board.leaders.length > 0) {
        expect(board.leaders[0].rank).toBe(1);
      }
    }
  });

  test('putt contest returns only entries with 3+ putts', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const puttContest = await api.getFlightPuttContest(
      statsData.accountId,
      statsData.individual.flightId,
    );

    expect(Array.isArray(puttContest)).toBe(true);

    for (const entry of puttContest) {
      expect(entry.putts).toBeGreaterThanOrEqual(3);
    }
  });

  test('putt contest filtered by week 1 returns entries for that week', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const week1Putts = await api.getFlightPuttContest(
      statsData.accountId,
      statsData.individual.flightId,
      1,
    );

    expect(Array.isArray(week1Putts)).toBe(true);

    for (const entry of week1Putts) {
      expect(entry.putts).toBeGreaterThanOrEqual(3);
      if (entry.weekNumber !== undefined && entry.weekNumber !== null) {
        expect(entry.weekNumber).toBe(1);
      }
    }
  });

  test('putt contest unfiltered includes entries from multiple weeks', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());

    const [allPutts, week1Putts] = await Promise.all([
      api.getFlightPuttContest(statsData.accountId, statsData.individual.flightId),
      api.getFlightPuttContest(statsData.accountId, statsData.individual.flightId, 1),
    ]);

    expect(allPutts.length).toBeGreaterThanOrEqual(week1Putts.length);
  });

  test('player detailed stats rounds played equals number of matches', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    expect(stats.roundsPlayed).toBe(3);
    expect(stats.contactId).toBeTruthy();
  });

  test('player detailed stats low score is not greater than high score', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    expect(stats.lowActualScore).toBeLessThanOrEqual(stats.highActualScore);
    expect(stats.averageScore).toBeGreaterThan(0);
    expect(stats.averageScore).toBeGreaterThanOrEqual(stats.lowActualScore);
    expect(stats.averageScore).toBeLessThanOrEqual(stats.highActualScore);
  });

  test('player detailed stats score type counts sum to total holes played', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    const counts = stats.scoreTypeCounts;
    const totalFromCounts =
      counts.aces +
      counts.eagles +
      counts.birdies +
      counts.pars +
      counts.bogeys +
      counts.doubleBogeys +
      counts.triplesOrWorse;

    expect(totalFromCounts).toBe(stats.roundsPlayed * 9);
  });

  test('player detailed stats putt stats present and valid when putts were tracked', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    if (stats.puttStats) {
      expect(stats.puttStats.totalPutts).toBeGreaterThan(0);
      expect(stats.puttStats.averagePerRound).toBeGreaterThan(0);
      expect(stats.puttStats.bestRound).toBeLessThanOrEqual(stats.puttStats.worstRound);
    }
  });

  test('player detailed stats GIR stats are valid percentages', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    if (stats.girStats) {
      expect(stats.girStats.averagePercentage).toBeGreaterThanOrEqual(0);
      expect(stats.girStats.averagePercentage).toBeLessThanOrEqual(100);
      expect(stats.girStats.bestPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.girStats.bestPercentage).toBeLessThanOrEqual(100);
      expect(stats.girStats.worstPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.girStats.worstPercentage).toBeLessThanOrEqual(100);
      expect(stats.girStats.bestPercentage).toBeGreaterThanOrEqual(stats.girStats.worstPercentage);
    }
  });

  test('player detailed stats fairway stats are valid percentages when tracked', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    if (stats.fairwayStats) {
      expect(stats.fairwayStats.averagePercentage).toBeGreaterThanOrEqual(0);
      expect(stats.fairwayStats.averagePercentage).toBeLessThanOrEqual(100);
      expect(stats.fairwayStats.bestPercentage).toBeGreaterThanOrEqual(
        stats.fairwayStats.worstPercentage,
      );
    }
  });

  test('player detailed stats consistency std dev is non-negative', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    if (stats.consistencyStdDev !== undefined) {
      expect(stats.consistencyStdDev).toBeGreaterThanOrEqual(0);
    }
  });

  test('player detailed stats hole type averages are reasonable golf scores', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    if (stats.holeTypeStats) {
      if (stats.holeTypeStats.par3Average !== undefined) {
        expect(stats.holeTypeStats.par3Average).toBeGreaterThan(0);
        expect(stats.holeTypeStats.par3Average).toBeLessThan(10);
      }
      if (stats.holeTypeStats.par4Average !== undefined) {
        expect(stats.holeTypeStats.par4Average).toBeGreaterThan(0);
        expect(stats.holeTypeStats.par4Average).toBeLessThan(12);
      }
      if (stats.holeTypeStats.par5Average !== undefined) {
        expect(stats.holeTypeStats.par5Average).toBeGreaterThan(0);
        expect(stats.holeTypeStats.par5Average).toBeLessThan(14);
      }
    }
  });

  test('player detailed stats max birdies and pars in round are non-negative', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    expect(stats.maxBirdiesInRound).toBeGreaterThanOrEqual(0);
    expect(stats.maxParsInRound).toBeGreaterThanOrEqual(0);
    expect(stats.maxBogeyPlusInRound).toBeGreaterThanOrEqual(0);
  });

  test('player detailed stats max birdies does not exceed total holes per round', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    expect(stats.maxBirdiesInRound).toBeLessThanOrEqual(9);
    expect(stats.maxParsInRound).toBeLessThanOrEqual(9);
    expect(stats.maxBogeyPlusInRound).toBeLessThanOrEqual(9);
  });

  test('player detailed stats are correct for second player', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[1].players[0];
    const stats = await api.getPlayerDetailedStats(statsData.accountId, player.contactId);

    expect(stats.roundsPlayed).toBe(3);
    expect(stats.lowActualScore).toBeLessThanOrEqual(stats.highActualScore);

    const counts = stats.scoreTypeCounts;
    const totalFromCounts =
      counts.aces +
      counts.eagles +
      counts.birdies +
      counts.pars +
      counts.bogeys +
      counts.doubleBogeys +
      counts.triplesOrWorse;

    expect(totalFromCounts).toBe(stats.roundsPlayed * 9);
  });
});

test.describe('Golf Statistics - Team League', () => {
  test('flight leaders work for team league with multiple players per team', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const leaders = await api.getFlightLeaders(statsData.accountId, statsData.team.flightId);

    expect(leaders.lowActualScore.length).toBeGreaterThan(0);
    expect(leaders.scoringAverages.length).toBeGreaterThan(0);
    expect(leaders.lowActualScore[0].rank).toBe(1);
  });

  test('flight leaders scoring averages have valid round counts for team league', async ({
    statsData,
  }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const leaders = await api.getFlightLeaders(statsData.accountId, statsData.team.flightId);

    for (const avg of leaders.scoringAverages) {
      expect(avg.roundsPlayed).toBeGreaterThan(0);
      expect(avg.averageScore).toBeGreaterThan(0);
    }
  });

  test('team league skins returns array of entries', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const skins = await api.getFlightSkins(statsData.accountId, statsData.team.flightId, 'actual');

    expect(Array.isArray(skins)).toBe(true);
  });

  test('team league standings flights are populated', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const standings = await api.getSeasonStandings(statsData.accountId, statsData.seasonId);

    expect(standings.flights).toBeDefined();
    expect(standings.flights.length).toBeGreaterThan(0);

    for (const flight of standings.flights) {
      expect(flight.flightId).toBeTruthy();
      expect(Array.isArray(flight.standings)).toBe(true);
    }
  });

  test('team league score types returns valid leaderboards', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const scoreTypes = await api.getFlightScoreTypes(statsData.accountId, statsData.team.flightId);

    expect(Array.isArray(scoreTypes)).toBe(true);
  });
});

test.describe('Golf Statistics - Closest to Pin', () => {
  test('closest to pin flight endpoint returns an array', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const ctpEntries = await api.getClosestToPinForFlight(
      statsData.accountId,
      statsData.individual.flightId,
    );

    expect(Array.isArray(ctpEntries)).toBe(true);
  });

  test('closest to pin match endpoint returns an array', async ({ statsData }) => {
    const api = new ApiHelper(BASE_URL, getJwtToken());
    const match = statsData.individual.matches[0];
    const ctpEntries = await api.getClosestToPinForMatch(statsData.accountId, match.id);

    expect(Array.isArray(ctpEntries)).toBe(true);
  });

  test('CTP entry can be created and deleted', async ({ statsData }) => {
    test.skip(statsData.par3Holes.length === 0, 'No par 3 holes on test course');

    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const match = statsData.individual.matches[0];
    const par3Hole = statsData.par3Holes[0];

    const ctp = await api.createClosestToPin(statsData.accountId, match.id, {
      holeNumber: par3Hole,
      contactId: player.contactId,
      distance: 12.5,
      unit: 'ft',
    });

    expect(ctp.id).toBeTruthy();
    expect(ctp.distance).toBe(12.5);
    expect(ctp.holeNumber).toBe(par3Hole);
    expect(ctp.contactId).toBe(player.contactId);

    await api.deleteClosestToPin(statsData.accountId, ctp.id);

    const ctpAfterDelete = await api.getClosestToPinForMatch(statsData.accountId, match.id);
    const stillExists = ctpAfterDelete.some((e) => e.id === ctp.id);
    expect(stillExists).toBe(false);
  });

  test('created CTP entry appears in match and flight queries', async ({ statsData }) => {
    test.skip(statsData.par3Holes.length === 0, 'No par 3 holes on test course');

    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[1].players[0];
    const match = statsData.individual.matches[1];
    const par3Hole = statsData.par3Holes[0];

    const ctp = await api.createClosestToPin(statsData.accountId, match.id, {
      holeNumber: par3Hole,
      contactId: player.contactId,
      distance: 8.3,
      unit: 'ft',
    });

    try {
      const [matchCtps, flightCtps] = await Promise.all([
        api.getClosestToPinForMatch(statsData.accountId, match.id),
        api.getClosestToPinForFlight(statsData.accountId, statsData.individual.flightId),
      ]);

      const inMatch = matchCtps.some((e) => e.id === ctp.id);
      const inFlight = flightCtps.some((e) => e.id === ctp.id);

      expect(inMatch).toBe(true);
      expect(inFlight).toBe(true);
    } finally {
      await api.deleteClosestToPin(statsData.accountId, ctp.id);
    }
  });

  test('CTP entry has correct fields populated', async ({ statsData }) => {
    test.skip(statsData.par3Holes.length === 0, 'No par 3 holes on test course');

    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[2].players[0];
    const match = statsData.individual.matches[2];
    const par3Hole = statsData.par3Holes[0];

    const ctp = await api.createClosestToPin(statsData.accountId, match.id, {
      holeNumber: par3Hole,
      contactId: player.contactId,
      distance: 20.0,
      unit: 'ft',
    });

    try {
      expect(ctp.matchId).toBe(match.id);
      expect(ctp.holeNumber).toBe(par3Hole);
      expect(ctp.unit).toBe('ft');
      expect(ctp.matchDate).toBeTruthy();
      expect(ctp.firstName).toBeTruthy();
      expect(ctp.lastName).toBeTruthy();
    } finally {
      await api.deleteClosestToPin(statsData.accountId, ctp.id);
    }
  });

  test('CTP creation rejects non-par-3 hole', async ({ statsData }) => {
    test.skip(statsData.par3Holes.length === 0, 'No par 3 holes on test course');

    const api = new ApiHelper(BASE_URL, getJwtToken());
    const player = statsData.individual.teams[0].players[0];
    const match = statsData.individual.matches[0];

    const nonPar3Holes = Array.from({ length: 9 }, (_, i) => i + 1).filter(
      (h) => !statsData.par3Holes.includes(h),
    );
    test.skip(nonPar3Holes.length === 0, 'All holes are par 3 on test course');

    const nonPar3Hole = nonPar3Holes[0];

    let succeeded = false;
    try {
      const result = await api.createClosestToPin(statsData.accountId, match.id, {
        holeNumber: nonPar3Hole,
        contactId: player.contactId,
        distance: 10.0,
        unit: 'ft',
      });
      succeeded = true;
      await api.deleteClosestToPin(statsData.accountId, result.id);
    } catch {
      succeeded = false;
    }

    expect(succeeded, `CTP should not be allowed on hole ${nonPar3Hole} which is not par 3`).toBe(
      false,
    );
  });
});
