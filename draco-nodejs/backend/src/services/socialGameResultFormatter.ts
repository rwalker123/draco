export interface GameResultPostPayload {
  gameId: bigint;
  gameDate?: Date;
  gameStatus?: number | null;
  homeScore?: number | null;
  visitorScore?: number | null;
  homeTeamName?: string | null;
  visitorTeamName?: string | null;
  leagueName?: string | null;
  seasonName?: string | null;
}

const describeGameStatus = (gameStatus?: number | null): string | null => {
  switch (gameStatus) {
    case 1:
      return 'Final';
    case 2:
      return 'Rainout';
    case 3:
      return 'Postponed';
    case 4:
      return 'Forfeit';
    case 5:
      return 'Did Not Report';
    case 0:
      return 'Scheduled';
    default:
      return null;
  }
};

export const composeGameResultMessage = (
  payload: Omit<GameResultPostPayload, 'gameId'>,
  options?: { characterLimit?: number },
): string | null => {
  const formatDate = (date?: Date) => {
    if (!date) {
      return null;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statusLabel = describeGameStatus(payload.gameStatus) ?? 'Final';
  const dateText = formatDate(payload.gameDate);
  const league = [payload.leagueName, payload.seasonName].filter(Boolean).join(' ').trim();
  const home = (payload.homeTeamName ?? 'Home').trim();
  const visitor = (payload.visitorTeamName ?? 'Visitor').trim();
  const homeScore =
    payload.homeScore !== undefined && payload.homeScore !== null ? payload.homeScore : null;
  const visitorScore =
    payload.visitorScore !== undefined && payload.visitorScore !== null
      ? payload.visitorScore
      : null;

  const characterLimit = options?.characterLimit ?? 280;

  // Final/Forfeit with scores
  if (
    (payload.gameStatus === 1 || payload.gameStatus === 4) &&
    homeScore !== null &&
    visitorScore !== null
  ) {
    let winner = home;
    let loser = visitor;
    let winnerScore = homeScore;
    let loserScore = visitorScore;
    let verb = 'over';

    if (visitorScore > homeScore) {
      winner = visitor;
      loser = home;
      winnerScore = visitorScore;
      loserScore = homeScore;
    } else if (homeScore === visitorScore) {
      verb = 'tied';
    }

    let message: string;
    if (verb === 'tied') {
      const tieParts = [
        dateText,
        statusLabel,
        ':',
        league,
        `${home} and ${visitor} tied ${homeScore} - ${visitorScore}`,
      ].filter(Boolean);
      message = tieParts.join(' ').replace(/\s+/g, ' ');
    } else {
      const parts = [
        dateText,
        statusLabel,
        ':',
        league,
        winner,
        verb,
        loser,
        `${winnerScore} - ${loserScore}`,
      ].filter(Boolean);
      message = parts.join(' ').replace(/\s+/g, ' ');
    }

    return message.length <= characterLimit ? message : message.slice(0, characterLimit);
  }

  // Other statuses (Scheduled, Rainout, Postponed, etc.)
  if (payload.gameStatus && payload.gameStatus !== 0) {
    const parts = [dateText, statusLabel, ':', league, `${visitor} @ ${home}`].filter(Boolean);

    const message = parts.join(' ').replace(/\s+/g, ' ');
    return message.length <= characterLimit ? message : message.slice(0, characterLimit);
  }

  return null;
};
