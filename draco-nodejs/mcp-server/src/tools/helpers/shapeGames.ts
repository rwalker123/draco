import { formatGameDate } from './formatGameDate.js';

type GameEntry = {
  id: string;
  gameDate: string;
  homeTeam: { id: string; name?: string };
  visitorTeam: { id: string; name?: string };
  league: { id: string; name: string };
  field?: { name: string } | null;
  gameStatusText?: string;
  gameType?: number;
};

export function shapeGamesText(games: GameEntry[], timezone: string): string {
  if (games.length === 0) {
    return '';
  }

  const lines = games.map((g) => {
    const home = g.homeTeam.name ?? 'Home';
    const visitor = g.visitorTeam.name ?? 'Visitor';
    const dateStr = formatGameDate(g.gameDate, timezone);
    const field = g.field?.name ? ` at ${g.field.name}` : '';
    const status =
      g.gameStatusText && g.gameStatusText !== 'Scheduled' ? ` [${g.gameStatusText}]` : '';
    const gameTypeSuffix =
      g.gameType === 1 ? ' (Playoff)' : g.gameType === 2 ? ' (Exhibition)' : '';
    return `- ${home} vs ${visitor}${gameTypeSuffix}, ${dateStr}${field}${status}`;
  });

  return lines.join('\n');
}
