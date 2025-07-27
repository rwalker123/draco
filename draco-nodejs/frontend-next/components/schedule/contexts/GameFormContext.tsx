import React, { createContext, useContext, ReactNode } from 'react';
import { Team, Field, Umpire, Game } from '@/types/schedule';

interface GameFormContextValue {
  // Data
  leagueTeams: Team[];
  fields: Field[];
  umpires: Umpire[];

  // Configuration
  canEditSchedule: boolean;
  isAccountAdmin: boolean;

  // Helper functions
  getAvailableUmpires: (currentPosition: string, currentValue: string) => Umpire[];
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
