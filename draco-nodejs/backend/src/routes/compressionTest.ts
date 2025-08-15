// Compression test routes for Phase 1 validation
// These endpoints return large datasets to test compression effectiveness

import { Router } from 'express';
import { generateTestSeason, generateTestUsers } from '../utils/compressionTestData.js';

const router = Router();

/**
 * @route GET /api/compression-test/season/:accountId/:seasonId
 * @desc Test endpoint for season data compression
 * @access Public - for testing purposes only
 */
router.get('/season/:accountId/:seasonId', (req, res) => {
  const { accountId, seasonId } = req.params;

  try {
    const seasonData = generateTestSeason(accountId, seasonId);

    // Log the size of the response for validation
    const responseSize = Buffer.byteLength(JSON.stringify(seasonData));
    console.log(`[COMPRESSION TEST] Season data size: ${(responseSize / 1024).toFixed(1)}KB`);

    res.json({
      message: 'Test season data for compression validation',
      timestamp: new Date().toISOString(),
      data: seasonData,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate test season data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/compression-test/users/:accountId
 * @desc Test endpoint for user data compression
 * @access Public - for testing purposes only
 */
router.get('/users/:accountId', (req, res) => {
  const { accountId } = req.params;

  try {
    const usersData = generateTestUsers(accountId);

    // Log the size of the response for validation
    const responseSize = Buffer.byteLength(JSON.stringify(usersData));
    console.log(`[COMPRESSION TEST] Users data size: ${(responseSize / 1024).toFixed(1)}KB`);

    res.json({
      message: 'Test users data for compression validation',
      timestamp: new Date().toISOString(),
      data: usersData,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate test users data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/compression-test/statistics/:accountId/:seasonId
 * @desc Test endpoint for statistics data compression
 * @access Public - for testing purposes only
 */
router.get('/statistics/:accountId/:seasonId', (req, res) => {
  const { accountId, seasonId } = req.params;

  try {
    const seasonData = generateTestSeason(accountId, seasonId);

    // Create comprehensive statistics data
    const statisticsData = {
      seasonId,
      accountId,
      generatedAt: new Date().toISOString(),
      summary: seasonData.statistics,
      teamStats: seasonData.teams.map((team) => ({
        teamId: team.id,
        teamName: team.name,
        record: team.seasonRecord,
        runsScored: team.runsScored,
        runsAllowed: team.runsAllowed,
        runDifferential: team.runDifferential,
        battingAverage: team.battingAverage,
        onBasePercentage: team.onBasePercentage,
        sluggingPercentage: team.sluggingPercentage,
        earnedRunAverage: team.earnedRunAverage,
        fieldingPercentage: team.fieldingPercentage,
        errors: team.errors,
        playerCount: team.players.length,
      })),
      playerStats: seasonData.teams.flatMap((team) =>
        team.players.map((player) => ({
          playerId: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          teamId: player.teamId,
          teamName: player.teamName,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          battingAverage: player.battingAverage,
          onBasePercentage: player.onBasePercentage,
          sluggingPercentage: player.sluggingPercentage,
          homeRuns: player.homeRuns,
          runsBattedIn: player.runsBattedIn,
          stolenBases: player.stolenBases,
          errors: player.errors,
          gamesPlayed: player.gamesPlayed,
          atBats: player.atBats,
          hits: player.hits,
          walks: player.walks,
          strikeouts: player.strikeouts,
        })),
      ),
      gameStats: seasonData.games.map((game) => ({
        gameId: game.id,
        date: game.date,
        homeTeam: game.homeTeamName,
        awayTeam: game.awayTeamName,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        totalRuns: game.homeScore + game.awayScore,
        totalHits: game.homeTeamHits + game.awayTeamHits,
        totalErrors: game.homeTeamErrors + game.awayTeamErrors,
        totalStrikeouts: game.homeTeamStrikeouts + game.awayTeamStrikeouts,
        totalWalks: game.homeTeamWalks + game.awayTeamWalks,
        totalHomeRuns: game.homeTeamHomeRuns + game.awayTeamHomeRuns,
        venue: game.venue,
        attendance: game.attendance,
        duration: game.duration,
        weather: game.weather,
        temperature: game.temperature,
      })),
      leagueAverages: {
        averageRunsPerGame: (seasonData.statistics.totalRuns / seasonData.games.length).toFixed(2),
        averageHitsPerGame: (seasonData.statistics.totalHits / seasonData.games.length).toFixed(2),
        averageErrorsPerGame: (seasonData.statistics.totalErrors / seasonData.games.length).toFixed(
          2,
        ),
        averageStrikeoutsPerGame: (
          seasonData.statistics.totalStrikeouts / seasonData.games.length
        ).toFixed(2),
        averageWalksPerGame: (seasonData.statistics.totalWalks / seasonData.games.length).toFixed(
          2,
        ),
        averageHomeRunsPerGame: (
          seasonData.statistics.totalHomeRuns / seasonData.games.length
        ).toFixed(2),
      },
    };

    // Log the size of the response for validation
    const responseSize = Buffer.byteLength(JSON.stringify(statisticsData));
    console.log(`[COMPRESSION TEST] Statistics data size: ${(responseSize / 1024).toFixed(1)}KB`);

    res.json({
      message: 'Test statistics data for compression validation',
      timestamp: new Date().toISOString(),
      data: statisticsData,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate test statistics data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/compression-test/schedule/:accountId/:seasonId
 * @desc Test endpoint for schedule data compression
 * @access Public - for testing purposes only
 */
router.get('/schedule/:accountId/:seasonId', (req, res) => {
  const { accountId, seasonId } = req.params;

  try {
    const seasonData = generateTestSeason(accountId, seasonId);

    // Create comprehensive schedule data
    const scheduleData = {
      seasonId,
      accountId,
      generatedAt: new Date().toISOString(),
      seasonInfo: {
        name: seasonData.name,
        year: seasonData.year,
        startDate: seasonData.startDate,
        endDate: seasonData.endDate,
        status: seasonData.status,
        totalGames: seasonData.totalGames,
      },
      teams: seasonData.teams.map((team) => ({
        teamId: team.id,
        teamName: team.name,
        city: team.city,
        division: team.division,
        homeVenue: team.homeVenue,
      })),
      games: seasonData.games.map((game) => ({
        gameId: game.id,
        date: game.date,
        homeTeamId: game.homeTeamId,
        homeTeamName: game.homeTeamName,
        awayTeamId: game.awayTeamId,
        awayTeamName: game.awayTeamName,
        status: game.status,
        inning: game.inning,
        topOfInning: game.topOfInning,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        venue: game.venue,
        weather: game.weather,
        temperature: game.temperature,
        windSpeed: game.windSpeed,
        windDirection: game.windDirection,
        humidity: game.humidity,
        attendance: game.attendance,
        duration: game.duration,
        umpires: game.umpires,
        notes: game.notes,
      })),
      upcomingGames: seasonData.games
        .filter((game) => game.status === 'scheduled')
        .slice(0, 10)
        .map((game) => ({
          gameId: game.id,
          date: game.date,
          homeTeam: game.homeTeamName,
          awayTeam: game.awayTeamName,
          venue: game.venue,
          time: '7:00 PM',
        })),
      recentGames: seasonData.games
        .filter((game) => game.status === 'completed')
        .slice(-10)
        .map((game) => ({
          gameId: game.id,
          date: game.date,
          homeTeam: game.homeTeamName,
          awayTeam: game.awayTeamName,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          winner: game.homeScore > game.awayScore ? game.homeTeamName : game.awayTeamName,
          totalRuns: game.homeScore + game.awayScore,
        })),
      monthlySchedule: seasonData.games.reduce(
        (acc, game) => {
          const month = new Date(game.date).getMonth();
          if (!acc[month]) acc[month] = [];
          acc[month].push({
            gameId: game.id,
            date: game.date,
            homeTeam: game.homeTeamName,
            awayTeam: game.awayTeamName,
            status: game.status,
          });
          return acc;
        },
        {} as Record<
          number,
          Array<{
            gameId: string;
            date: string;
            homeTeam: string;
            awayTeam: string;
            status: string;
          }>
        >,
      ),
    };

    // Log the size of the response for validation
    const responseSize = Buffer.byteLength(JSON.stringify(scheduleData));
    console.log(`[COMPRESSION TEST] Schedule data size: ${(responseSize / 1024).toFixed(1)}KB`);

    res.json({
      message: 'Test schedule data for compression validation',
      timestamp: new Date().toISOString(),
      data: scheduleData,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate test schedule data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/compression-test/small
 * @desc Test endpoint for small response (should not trigger compression)
 * @access Public - for testing purposes only
 */
router.get('/small', (req, res) => {
  const smallData = {
    message: 'This is a small response that should not trigger compression',
    timestamp: new Date().toISOString(),
    size: 'Small response test',
  };

  // Log the size of the response for validation
  const responseSize = Buffer.byteLength(JSON.stringify(smallData));
  console.log(`[COMPRESSION TEST] Small data size: ${(responseSize / 1024).toFixed(1)}KB`);

  res.json(smallData);
});

export default router;
