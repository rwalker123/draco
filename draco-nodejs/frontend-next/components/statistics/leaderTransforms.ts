import type { LeaderRowType } from '@draco/shared-schemas';

export const getLeaderForCard = (leaders: LeaderRowType[]): LeaderRowType | null => {
  const firstPlaceEntries = leaders.filter((row) => row.rank === 1 && !row.isTie);

  if (firstPlaceEntries.length === 1) {
    return firstPlaceEntries[0];
  }

  if (firstPlaceEntries.length > 1) {
    return {
      playerId: '0',
      playerName: `${firstPlaceEntries.length} tied`,
      teams: [],
      teamName: '',
      statValue: firstPlaceEntries[0].statValue,
      category: firstPlaceEntries[0].category,
      rank: 1,
      isTie: true,
      tieCount: firstPlaceEntries.length,
    };
  }

  const tieIndicator = leaders.find((row) => row.rank === 1 && row.isTie);
  if (tieIndicator) {
    return tieIndicator;
  }

  return null;
};

export const processLeadersForTable = (
  leaders: LeaderRowType[],
  leaderCard: LeaderRowType | null,
): LeaderRowType[] => {
  const processed = leaders.map((leader) => {
    if (leader.isTie) {
      return {
        ...leader,
        playerName: `${leader.tieCount} tied`,
        teamName: '',
        teams: [],
      };
    }
    return leader;
  });

  if (!leaderCard) {
    return processed;
  }

  if (leaderCard.isTie) {
    return processed.filter((leader) => !(leader.rank === 1 && leader.isTie));
  }

  return processed.filter((leader) => leader.rank !== 1 || leader.isTie);
};
