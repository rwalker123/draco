// Test data generator for compression validation
// This creates realistic datasets that should trigger compression

export interface TestPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  homeRuns: number;
  runsBattedIn: number;
  stolenBases: number;
  errors: number;
  gamesPlayed: number;
  atBats: number;
  hits: number;
  walks: number;
  strikeouts: number;
  teamId: string;
  teamName: string;
  seasonId: string;
  seasonName: string;
  lastUpdated: string;
}

export interface TestGame {
  id: string;
  date: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  inning: number;
  topOfInning: boolean;
  homeTeamHits: number;
  awayTeamHits: number;
  homeTeamErrors: number;
  awayTeamErrors: number;
  homeTeamLeftOnBase: number;
  awayTeamLeftOnBase: number;
  homeTeamStrikeouts: number;
  awayTeamStrikeouts: number;
  homeTeamWalks: number;
  awayTeamWalks: number;
  homeTeamHomeRuns: number;
  awayTeamHomeRuns: number;
  venue: string;
  weather: string;
  temperature: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  attendance: number;
  duration: string;
  umpires: string[];
  notes: string;
}

export interface TestTeam {
  id: string;
  name: string;
  city: string;
  state: string;
  league: string;
  division: string;
  founded: number;
  homeVenue: string;
  primaryColors: string[];
  secondaryColors: string[];
  logoUrl: string;
  manager: string;
  generalManager: string;
  owner: string;
  championships: number;
  worldSeriesTitles: number;
  divisionTitles: number;
  wildCardAppearances: number;
  lastPlayoffAppearance: string;
  seasonRecord: string;
  homeRecord: string;
  awayRecord: string;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  earnedRunAverage: number;
  fieldingPercentage: number;
  errors: number;
  players: TestPlayer[];
}

export interface TestSeason {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  totalTeams: number;
  totalGames: number;
  completedGames: number;
  cancelledGames: number;
  totalPlayers: number;
  totalUmpires: number;
  totalVenues: number;
  leagueRules: Record<string, string | number | boolean>;
  playoffFormat: string;
  championshipFormat: string;
  tiebreakerRules: string[];
  teams: TestTeam[];
  games: TestGame[];
  statistics: {
    totalRuns: number;
    totalHits: number;
    totalHomeRuns: number;
    totalStrikeouts: number;
    totalWalks: number;
    totalErrors: number;
    averageGameDuration: string;
    averageAttendance: number;
    highestScoringGame: number;
    lowestScoringGame: number;
    mostHomeRuns: number;
    mostStrikeouts: number;
    mostErrors: number;
  };
}

export interface TestUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  accountId: string;
  teamId?: string;
  seasonId?: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  profile: {
    phoneNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
    preferences: {
      notifications: boolean;
      emailUpdates: boolean;
      smsUpdates: boolean;
      language: string;
      timezone: string;
    };
  };
}

// Generate realistic test data
export function generateTestSeason(accountId: string, seasonId: string): TestSeason {
  const teams: TestTeam[] = [];
  const games: TestGame[] = [];
  const players: TestPlayer[] = [];

  // Generate 8 teams
  for (let i = 0; i < 8; i++) {
    const team = generateTestTeam(accountId, seasonId, i);
    teams.push(team);
    players.push(...team.players);
  }

  // Generate 50 games
  for (let i = 0; i < 50; i++) {
    games.push(generateTestGame(teams, i));
  }

  return {
    id: seasonId,
    name: `2024 Baseball Season`,
    year: 2024,
    startDate: '2024-03-15',
    endDate: '2024-10-15',
    status: 'active',
    totalTeams: teams.length,
    totalGames: games.length,
    completedGames: 35,
    cancelledGames: 2,
    totalPlayers: players.length,
    totalUmpires: 12,
    totalVenues: 8,
    leagueRules: {
      maxInnings: 9,
      mercyRule: true,
      mercyRuleInnings: 5,
      mercyRuleRuns: 10,
      extraInnings: true,
      maxExtraInnings: 3,
      tieGame: false,
    },
    playoffFormat: 'Single Elimination',
    championshipFormat: 'Best of 3',
    tiebreakerRules: ['Head to Head', 'Run Differential', 'Runs Scored'],
    teams,
    games,
    statistics: {
      totalRuns: games.reduce((sum, game) => sum + game.homeScore + game.awayScore, 0),
      totalHits: games.reduce((sum, game) => sum + game.homeTeamHits + game.awayTeamHits, 0),
      totalHomeRuns: games.reduce(
        (sum, game) => sum + game.homeTeamHomeRuns + game.awayTeamHomeRuns,
        0,
      ),
      totalStrikeouts: games.reduce(
        (sum, game) => sum + game.homeTeamStrikeouts + game.awayTeamStrikeouts,
        0,
      ),
      totalWalks: games.reduce((sum, game) => sum + game.homeTeamWalks + game.awayTeamWalks, 0),
      totalErrors: games.reduce((sum, game) => sum + game.homeTeamErrors + game.awayTeamErrors, 0),
      averageGameDuration: '2:45',
      averageAttendance: Math.floor(Math.random() * 500) + 100,
      highestScoringGame: Math.max(...games.map((g) => g.homeScore + g.awayScore)),
      lowestScoringGame: Math.min(...games.map((g) => g.homeScore + g.awayScore)),
      mostHomeRuns: Math.max(...games.map((g) => g.homeTeamHomeRuns + g.awayTeamHomeRuns)),
      mostStrikeouts: Math.max(...games.map((g) => g.homeTeamStrikeouts + g.awayTeamStrikeouts)),
      mostErrors: Math.max(...games.map((g) => g.homeTeamErrors + g.awayTeamErrors)),
    },
  };
}

function generateTestTeam(accountId: string, seasonId: string, teamIndex: number): TestTeam {
  const teamNames = [
    'Tigers',
    'Eagles',
    'Lions',
    'Bears',
    'Wolves',
    'Hawks',
    'Panthers',
    'Falcons',
  ];
  const cities = [
    'Springfield',
    'Riverside',
    'Fairview',
    'Salem',
    'Georgetown',
    'Madison',
    'Clinton',
    'Franklin',
  ];
  const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

  const players: TestPlayer[] = [];

  // Generate 15 players per team
  for (let i = 0; i < 15; i++) {
    players.push({
      id: `player_${teamIndex}_${i}`,
      firstName: `Player${i + 1}`,
      lastName: `Smith${i + 1}`,
      jerseyNumber: i + 1,
      position: positions[i % positions.length],
      battingAverage: Math.random() * 0.4 + 0.2,
      onBasePercentage: Math.random() * 0.5 + 0.3,
      sluggingPercentage: Math.random() * 0.6 + 0.4,
      homeRuns: Math.floor(Math.random() * 30),
      runsBattedIn: Math.floor(Math.random() * 100),
      stolenBases: Math.floor(Math.random() * 30),
      errors: Math.floor(Math.random() * 15),
      gamesPlayed: Math.floor(Math.random() * 100) + 50,
      atBats: Math.floor(Math.random() * 300) + 200,
      hits: Math.floor(Math.random() * 100) + 50,
      walks: Math.floor(Math.random() * 50) + 20,
      strikeouts: Math.floor(Math.random() * 80) + 30,
      teamId: `team_${teamIndex}`,
      teamName: teamNames[teamIndex],
      seasonId,
      seasonName: '2024 Baseball Season',
      lastUpdated: new Date().toISOString(),
    });
  }

  return {
    id: `team_${teamIndex}`,
    name: teamNames[teamIndex],
    city: cities[teamIndex],
    state: 'CA',
    league: 'Amateur Baseball League',
    division: teamIndex < 4 ? 'East' : 'West',
    founded: 1990 + teamIndex,
    homeVenue: `${cities[teamIndex]} Baseball Field`,
    primaryColors: ['#1f4e79', '#ffffff'],
    secondaryColors: ['#ff6b35', '#000000'],
    logoUrl: `https://example.com/logos/${teamNames[teamIndex].toLowerCase()}.png`,
    manager: `Manager ${teamIndex + 1}`,
    generalManager: `GM ${teamIndex + 1}`,
    owner: `Owner ${teamIndex + 1}`,
    championships: Math.floor(Math.random() * 5),
    worldSeriesTitles: Math.floor(Math.random() * 3),
    divisionTitles: Math.floor(Math.random() * 8),
    wildCardAppearances: Math.floor(Math.random() * 4),
    lastPlayoffAppearance: '2023',
    seasonRecord: `${Math.floor(Math.random() * 30) + 60}-${Math.floor(Math.random() * 30) + 30}`,
    homeRecord: `${Math.floor(Math.random() * 20) + 30}-${Math.floor(Math.random() * 20) + 10}`,
    awayRecord: `${Math.floor(Math.random() * 20) + 30}-${Math.floor(Math.random() * 20) + 10}`,
    runsScored: Math.floor(Math.random() * 200) + 400,
    runsAllowed: Math.floor(Math.random() * 200) + 400,
    runDifferential: Math.floor(Math.random() * 100) - 50,
    battingAverage: Math.random() * 0.1 + 0.25,
    onBasePercentage: Math.random() * 0.1 + 0.32,
    sluggingPercentage: Math.random() * 0.15 + 0.4,
    earnedRunAverage: Math.random() * 2.0 + 3.0,
    fieldingPercentage: Math.random() * 0.05 + 0.95,
    errors: Math.floor(Math.random() * 50) + 30,
    players,
  };
}

function generateTestGame(teams: TestTeam[], gameIndex: number): TestGame {
  const homeTeam = teams[gameIndex % teams.length];
  const awayTeam = teams[(gameIndex + 4) % teams.length];

  return {
    id: `game_${gameIndex}`,
    date: new Date(2024, 2, 15 + gameIndex).toISOString().split('T')[0],
    homeTeamId: homeTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamId: awayTeam.id,
    awayTeamName: awayTeam.name,
    homeScore: Math.floor(Math.random() * 10) + 1,
    awayScore: Math.floor(Math.random() * 10) + 1,
    status: gameIndex < 35 ? 'completed' : 'scheduled',
    inning: gameIndex < 35 ? 9 : 0,
    topOfInning: false,
    homeTeamHits: Math.floor(Math.random() * 15) + 5,
    awayTeamHits: Math.floor(Math.random() * 15) + 5,
    homeTeamErrors: Math.floor(Math.random() * 3),
    awayTeamErrors: Math.floor(Math.random() * 3),
    homeTeamLeftOnBase: Math.floor(Math.random() * 10) + 3,
    awayTeamLeftOnBase: Math.floor(Math.random() * 10) + 3,
    homeTeamStrikeouts: Math.floor(Math.random() * 12) + 3,
    awayTeamStrikeouts: Math.floor(Math.random() * 12) + 3,
    homeTeamWalks: Math.floor(Math.random() * 8) + 2,
    awayTeamWalks: Math.floor(Math.random() * 8) + 2,
    homeTeamHomeRuns: Math.floor(Math.random() * 4),
    awayTeamHomeRuns: Math.floor(Math.random() * 4),
    venue: homeTeam.homeVenue,
    weather: 'Sunny',
    temperature: Math.floor(Math.random() * 30) + 60,
    windSpeed: Math.floor(Math.random() * 15) + 5,
    windDirection: ['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 40) + 30,
    attendance: Math.floor(Math.random() * 500) + 100,
    duration: '2:45',
    umpires: ['Umpire 1', 'Umpire 2', 'Umpire 3', 'Umpire 4'],
    notes: `Game ${gameIndex + 1} of the season. ${gameIndex < 35 ? 'Game completed successfully.' : 'Game scheduled.'}`,
  };
}

export function generateTestUsers(accountId: string): TestUser[] {
  const users: TestUser[] = [];

  for (let i = 0; i < 50; i++) {
    users.push({
      id: `user_${i}`,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      firstName: `User${i + 1}`,
      lastName: `LastName${i + 1}`,
      role: i === 0 ? 'AccountAdmin' : i < 5 ? 'ContactAdmin' : 'Contact',
      permissions:
        i === 0 ? ['all'] : i < 5 ? ['manage_contacts', 'view_statistics'] : ['view_contacts'],
      accountId,
      teamId: i < 15 ? `team_${i % 8}` : undefined,
      seasonId: i < 15 ? 'season_2024' : undefined,
      isActive: true,
      lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        phoneNumber: `555-${String(i + 100).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
        address: {
          street: `${i + 100} Main Street`,
          city: 'Springfield',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
        },
        emergencyContact: {
          name: `Emergency Contact ${i + 1}`,
          relationship: 'Spouse',
          phoneNumber: `555-${String(i + 200).padStart(3, '0')}-${String(i + 2000).padStart(4, '0')}`,
        },
        preferences: {
          notifications: true,
          emailUpdates: true,
          smsUpdates: false,
          language: 'en',
          timezone: 'America/Los_Angeles',
        },
      },
    });
  }

  return users;
}
