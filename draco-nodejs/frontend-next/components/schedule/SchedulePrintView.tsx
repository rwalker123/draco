import React from 'react';
import PrintableLayout from '../print/PrintableLayout';
import {
  getDateKeyInTimezone,
  formatDateInTimezone,
  formatTimeInTimezone,
} from '../../utils/dateUtils';
import type { Game } from '@/types/schedule';
import { GameStatus } from '@/types/schedule';

interface SchedulePrintViewProps {
  games: Game[];
  title: string;
  subtitle?: string;
  timeZone: string;
}

const PLAYED_STATUSES = new Set([
  GameStatus.Completed,
  GameStatus.Forfeit,
  GameStatus.DidNotReport,
]);

const getFieldLabel = (game: Game): string => {
  return game.field?.name || game.field?.shortName || 'TBD';
};

const getScoreSuffix = (game: Game): string => {
  if (!PLAYED_STATUSES.has(game.gameStatus)) {
    return '';
  }
  return ` · ${game.homeScore}–${game.visitorScore}`;
};

const getMatchup = (game: Game): string => {
  const home = game.homeTeamName ?? game.homeTeamId;
  const visitor = game.visitorTeamName ?? game.visitorTeamId;
  return `${home} vs ${visitor}`;
};

const groupAndSortGames = (
  games: Game[],
  timeZone: string,
): Array<{ dateKey: string; dateLabel: string; games: Game[] }> => {
  const sorted = [...games].sort(
    (a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime(),
  );

  const groups = new Map<string, { dateLabel: string; games: Game[] }>();

  for (const game of sorted) {
    const key = getDateKeyInTimezone(game.gameDate, timeZone) ?? 'unknown';
    if (!groups.has(key)) {
      const label = formatDateInTimezone(game.gameDate, timeZone, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      groups.set(key, { dateLabel: label, games: [] });
    }
    groups.get(key)!.games.push(game);
  }

  return Array.from(groups.entries()).map(([dateKey, value]) => ({
    dateKey,
    ...value,
  }));
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginBottom: '16px',
  fontSize: '11px',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '4px 6px',
  borderBottom: '2px solid #333',
  fontWeight: 700,
  fontSize: '10px',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '3px 6px',
  borderBottom: '1px solid #ccc',
  verticalAlign: 'top',
};

const dateHeadingStyle: React.CSSProperties = {
  margin: '16px 0 4px 0',
  fontSize: '13px',
  fontWeight: 700,
  borderBottom: '1px solid #999',
  paddingBottom: '2px',
};

const SchedulePrintView: React.FC<SchedulePrintViewProps> = ({
  games,
  title,
  subtitle,
  timeZone,
}) => {
  if (games.length === 0) {
    return (
      <PrintableLayout title={title} subtitle={subtitle}>
        <p style={{ fontSize: '12px', color: '#555' }}>No games to display.</p>
      </PrintableLayout>
    );
  }

  const groups = groupAndSortGames(games, timeZone);

  return (
    <PrintableLayout title={title} subtitle={subtitle}>
      {groups.map(({ dateKey, dateLabel, games: dayGames }) => (
        <div key={dateKey}>
          <h2 style={dateHeadingStyle}>{dateLabel}</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>League</th>
                <th style={thStyle}>Matchup</th>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {dayGames.map((game) => (
                <tr key={game.id} className="dr-print-row">
                  <td style={tdStyle}>{formatTimeInTimezone(game.gameDate, timeZone)}</td>
                  <td style={tdStyle}>{game.league.name}</td>
                  <td style={tdStyle}>{getMatchup(game)}</td>
                  <td style={tdStyle}>{getFieldLabel(game)}</td>
                  <td style={tdStyle}>
                    {game.gameStatusText}
                    {getScoreSuffix(game)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </PrintableLayout>
  );
};

export default SchedulePrintView;
