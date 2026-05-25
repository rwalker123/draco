'use client';

import type { Game } from '../types/schedule';

interface NamedEntity {
  id: string;
  name: string;
}

interface UseEntityNameMapsInput {
  fields?: NamedEntity[];
  teams?: NamedEntity[];
  umpires?: NamedEntity[];
  games?: Game[];
}

interface UseEntityNameMapsResult {
  fieldNameById: Map<string, string>;
  teamNameById: Map<string, string>;
  umpireNameById: Map<string, string>;
  gameById: Map<string, Game>;
  getGameSummaryLabel: (gameId: string) => string;
}

const buildNameMap = (entities: NamedEntity[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const entity of entities) {
    map.set(entity.id, entity.name);
  }
  return map;
};

const buildGameMap = (games: Game[]): Map<string, Game> => {
  const map = new Map<string, Game>();
  for (const game of games) {
    if (game.id) {
      map.set(game.id, game);
    }
  }
  return map;
};

export const useEntityNameMaps = ({
  fields = [],
  teams = [],
  umpires = [],
  games = [],
}: UseEntityNameMapsInput): UseEntityNameMapsResult => {
  const fieldNameById = buildNameMap(fields);
  const teamNameById = buildNameMap(teams);
  const umpireNameById = buildNameMap(umpires);
  const gameById = buildGameMap(games);

  const getGameSummaryLabel = (gameId: string): string => {
    const game = gameById.get(gameId);
    if (!game) {
      return `Game ${gameId}`;
    }
    const home = teamNameById.get(game.homeTeamId) ?? 'Unknown Team';
    const visitor = teamNameById.get(game.visitorTeamId) ?? 'Unknown Team';
    return `${home} vs ${visitor}`;
  };

  return { fieldNameById, teamNameById, umpireNameById, gameById, getGameSummaryLabel };
};
