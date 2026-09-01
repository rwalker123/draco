import React from 'react';
import PrintableLayout from '../print/PrintableLayout';
import {
  printNoWrapTdStyle,
  printTableStyle,
  printTdStyle,
  printThStyle,
} from '../print/printTableStyles';
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

const numberCellStyle: React.CSSProperties = {
  ...printNoWrapTdStyle,
  textAlign: 'right',
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
      <table style={printTableStyle}>
        <thead>
          <tr>
            <th style={printThStyle}>Game No.</th>
            <th style={printThStyle}>Game Date</th>
            {showLeagueColumn && <th style={printThStyle}>League</th>}
            <th style={printThStyle}>Matchup</th>
            <th style={printThStyle}>Field</th>
            <th style={printThStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedGames.map((game, index) => (
            <tr key={game.id} className="dr-print-row">
              <td style={numberCellStyle}>{index + 1}</td>
              <td style={printNoWrapTdStyle}>{getGameDateTime(game, timeZone)}</td>
              {showLeagueColumn && <td style={printTdStyle}>{game.league.name}</td>}
              <td style={printTdStyle}>{getMatchup(game)}</td>
              <td style={printTdStyle}>{getFieldLabel(game)}</td>
              <td style={printTdStyle}>
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
