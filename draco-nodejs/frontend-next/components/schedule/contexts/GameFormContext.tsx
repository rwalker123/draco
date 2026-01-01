import React, { createContext, useContext, ReactNode } from 'react';
import { Game } from '@/types/schedule';
import { TeamSeasonType } from '@draco/shared-schemas';

interface NamedEntity {
  id: string;
  name: string;
}

interface OfficialEntity {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

interface GameFormContextValue {
  // Data
  leagueTeams: TeamSeasonType[];
  fields: NamedEntity[];
  umpires: OfficialEntity[];

  // Configuration
  canEditSchedule: boolean;
  isAccountAdmin: boolean;
  hasOfficials: boolean;

  // Helper functions
  getAvailableUmpires: (currentPosition: string, currentValue: string) => OfficialEntity[];
  getTeamName: (teamId: string) => string;
  getFieldName: (fieldId?: string) => string;
  getGameTypeText: (gameType: number | string) => string;

  // For edit mode
  selectedGame?: Game;
}

const GameFormContext = createContext<GameFormContextValue | undefined>(undefined);

export const useGameFormContext = () => {
  const context = useContext(GameFormContext);
  if (context === undefined) {
    throw new Error('useGameFormContext must be used within a GameFormProvider');
  }
  return context;
};

interface GameFormProviderProps {
  children: ReactNode;
  value: GameFormContextValue;
}

export const GameFormProvider: React.FC<GameFormProviderProps> = ({ children, value }) => {
  return <GameFormContext.Provider value={value}>{children}</GameFormContext.Provider>;
};
