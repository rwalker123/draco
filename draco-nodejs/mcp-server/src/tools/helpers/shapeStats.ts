import type { PlayerCareerStatistics } from '@draco/shared-api-client';

function fmtAvg(n: number): string {
  return n.toFixed(3).replace(/^0/, '');
}

function fmtFloat(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function shapeBattingRows(rows: PlayerCareerStatistics['batting']['rows']): string {
  if (rows.length === 0) return 'No batting statistics available.';

  const header = 'Season/Team            AB   H   R  2B  3B  HR RBI  BB  SO  AVG   OBP   SLG   OPS';
  const sep = '-'.repeat(header.length);

  const dataRows = rows.map((r) => {
    const label =
      r.level === 'career'
        ? 'Career Totals'
        : r.seasonName
          ? `${r.seasonName} - ${r.teamName}`
          : r.teamName;
    const padded = label.length > 22 ? label.slice(0, 22) : label.padEnd(22);
    return (
      `${padded}` +
      `${String(r.ab).padStart(4)}` +
      `${String(r.h).padStart(4)}` +
      `${String(r.r).padStart(4)}` +
      `${String(r.d).padStart(4)}` +
      `${String(r.t).padStart(4)}` +
      `${String(r.hr).padStart(4)}` +
      `${String(r.rbi).padStart(4)}` +
      `${String(r.bb).padStart(4)}` +
      `${String(r.so).padStart(4)}` +
      `  ${fmtAvg(r.avg)}` +
      `  ${fmtAvg(r.obp)}` +
      `  ${fmtAvg(r.slg)}` +
      `  ${fmtAvg(r.ops)}`
    );
  });

  return [header, sep, ...dataRows].join('\n');
}

function shapePitchingRows(rows: PlayerCareerStatistics['pitching']['rows']): string {
  if (rows.length === 0) return 'No pitching statistics available.';

  const header = 'Season/Team             IP   W   L   S   H   R  ER  BB  SO  HR   ERA  WHIP';
  const sep = '-'.repeat(header.length);

  const dataRows = rows.map((r) => {
    const label =
      r.level === 'career'
        ? 'Career Totals'
        : r.seasonName
          ? `${r.seasonName} - ${r.teamName}`
          : r.teamName;
    const padded = label.length > 23 ? label.slice(0, 23) : label.padEnd(23);
    return (
      `${padded}` +
      `${fmtFloat(r.ip, 1).padStart(5)}` +
      `${String(r.w).padStart(4)}` +
      `${String(r.l).padStart(4)}` +
      `${String(r.s).padStart(4)}` +
      `${String(r.h).padStart(4)}` +
      `${String(r.r).padStart(4)}` +
      `${String(r.er).padStart(4)}` +
      `${String(r.bb).padStart(4)}` +
      `${String(r.so).padStart(4)}` +
      `${String(r.hr).padStart(4)}` +
      `  ${fmtFloat(r.era)}` +
      `  ${fmtFloat(r.whip)}`
    );
  });

  return [header, sep, ...dataRows].join('\n');
}

export function shapeBattingStatsText(stats: PlayerCareerStatistics): string {
  return `Batting statistics for ${stats.playerName}:\n\n${shapeBattingRows(stats.batting.rows)}`;
}

export function shapePitchingStatsText(stats: PlayerCareerStatistics): string {
  return `Pitching statistics for ${stats.playerName}:\n\n${shapePitchingRows(stats.pitching.rows)}`;
}
