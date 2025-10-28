'use client';

import { format } from 'date-fns';
import type {
  GamePitchingStatLineType,
  TeamCompletedGameType,
  TeamStatsPlayerSummaryType,
} from '@draco/shared-schemas';

export const formatStatDecimal = (value: number | undefined | null, digits = 3) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }

  return value.toFixed(digits);
};

export const formatInnings = (ipDecimal: number) => {
  if (Number.isNaN(ipDecimal)) {
    return '-';
  }

  return ipDecimal.toFixed(1);
};

export const getOpponentLabel = (game: TeamCompletedGameType) => {
  const opponent = game.opponentTeamName || 'Unknown';
  return game.isHomeTeam ? `vs. ${opponent}` : `@ ${opponent}`;
};

export const formatGameDate = (isoDate: string) => {
  try {
    return format(new Date(isoDate), 'MMM d, yyyy • h:mm a');
  } catch {
    return isoDate;
  }
};

export const buildPlayerLabel = (player: TeamStatsPlayerSummaryType) => {
  const number =
    player.playerNumber !== null && player.playerNumber !== undefined
      ? `#${player.playerNumber} `
      : '';
  return `${number}${player.playerName}`;
};

export const getPitchingIpDisplay = (stat: GamePitchingStatLineType) =>
  formatInnings(stat.ipDecimal);
