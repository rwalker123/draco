import { formatGameDate } from './formatGameDate.js';

const COMPLETED_GAME_STATUSES = new Set([1, 4]);

type GameEntry = {
  id: string;
  gameDate: string;
  homeTeam: { id: string; name?: string };
  visitorTeam: { id: string; name?: string };
  league: { id: string; name: string };
  field?: { name: string } | null;
  gameStatus?: number;
  gameStatusText?: string;
  gameType?: number;
  homeScore?: number;
  visitorScore?: number;
};

export interface ShapedGame {
  game_id: string;
  game_date_iso: string;
  game_date_local: string;
  home_team: string;
  visitor_team: string;
  league_name: string;
  field_name: string | null;
  status: string | null;
  game_type: 'regular' | 'playoff' | 'exhibition';
  home_score: number | null;
  visitor_score: number | null;
}

export function shapeGames(games: GameEntry[], timezone: string): ShapedGame[] {
  return games.map((g) => {
    const completed = g.gameStatus !== undefined && COMPLETED_GAME_STATUSES.has(g.gameStatus);
    return {
      game_id: g.id,
      game_date_iso: g.gameDate,
      game_date_local: formatGameDate(g.gameDate, timezone),
      home_team: g.homeTeam.name ?? 'Home',
      visitor_team: g.visitorTeam.name ?? 'Visitor',
      league_name: g.league.name,
      field_name: g.field?.name ?? null,
      status: g.gameStatusText ?? null,
      game_type: g.gameType === 1 ? 'playoff' : g.gameType === 2 ? 'exhibition' : 'regular',
      home_score: completed ? (g.homeScore ?? null) : null,
      visitor_score: completed ? (g.visitorScore ?? null) : null,
    };
  });
}
