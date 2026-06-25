import React from 'react';
import PrintableLayout from '../print/PrintableLayout';
import { formatDateInTimezone, formatTimeInTimezone } from '../../utils/dateUtils';
import type { Game } from '@/types/schedule';
import { GameStatus } from '@/types/schedule';

interface SchedulePrintViewProps {
  games: Game[];
  title: string;
  subtitle?: string;
  timeZone: string;
  showLeagueColumn?: boolean;
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
  return `${visitor} @ ${home}`;
};

const getGameDateTime = (game: Game, timeZone: string): string => {
  const date = formatDateInTimezone(game.gameDate, timeZone, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = formatTimeInTimezone(game.gameDate, timeZone);
  return `${date} · ${time}`;
};

const sortGames = (games: Game[]): Game[] =>
  [...games].sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
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

const numberCellStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
  whiteSpace: 'nowrap',
};

const dateCellStyle: React.CSSProperties = {
  ...tdStyle,
  whiteSpace: 'nowrap',
};

const SchedulePrintView: React.FC<SchedulePrintViewProps> = ({
  games,
  title,
  subtitle,
  timeZone,
  showLeagueColumn = true,
}) => {
  if (games.length === 0) {
    return (
      <PrintableLayout title={title} subtitle={subtitle}>
        <p style={{ fontSize: '12px', color: '#555' }}>No games to display.</p>
      </PrintableLayout>
    );
  }

  const sortedGames = sortGames(games);

  return (
    <PrintableLayout title={title} subtitle={subtitle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Game No.</th>
            <th style={thStyle}>Game Date</th>
            {showLeagueColumn && <th style={thStyle}>League</th>}
            <th style={thStyle}>Matchup</th>
            <th style={thStyle}>Field</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedGames.map((game, index) => (
            <tr key={game.id} className="dr-print-row">
              <td style={numberCellStyle}>{index + 1}</td>
              <td style={dateCellStyle}>{getGameDateTime(game, timeZone)}</td>
              {showLeagueColumn && <td style={tdStyle}>{game.league.name}</td>}
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
    </PrintableLayout>
  );
};

export default SchedulePrintView;
