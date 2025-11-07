import React, { useCallback, useMemo, useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import MuiButton from '@mui/material/Button';
import EnterGameRecapDialog from '../components/EnterGameRecapDialog';
import type { UpsertGameRecapType } from '@draco/shared-schemas';
import { useRole } from '../context/RoleContext';
import { GameStatus } from '@/types/schedule';

export interface RecapGameBase {
  id: string;
  homeTeamId: string;
  homeTeamName?: string;
  visitorTeamId: string;
  visitorTeamName?: string;
  hasGameRecap?: boolean;
  gameRecaps?: Array<{ teamId: string; recap: string }>;
  gameStatus?: number;
  gameStatusText?: string;
  gameStatusShortText?: string;
  date?: string;
  gameDate?: string;
  homeScore?: number;
  visitorScore?: number;
  seasonId?: string;
  season?: {
    id?: string | null;
  } | null;
}

export interface RecapOption {
  id: string;
  name: string;
  canEdit: boolean;
  recap?: string;
}

export interface UseGameRecapFlowParams<GameType extends RecapGameBase> {
  accountId: string;
  seasonId?: string;
  resolveSeasonId?: (game: GameType) => string | null | undefined;
  fetchRecap: (game: GameType, teamSeasonId: string) => Promise<string | null>;
  determineEditableTeams?: (game: GameType) => string[];
  getTeamName?: (game: GameType, teamSeasonId: string) => string;
  onRecapSaved?: (game: GameType, teamSeasonId: string, recap: string) => void;
}

interface RecapSelectionState<GameType extends RecapGameBase> {
  game: GameType;
  options: RecapOption[];
  title: string;
}

interface RecapDialogState<GameType extends RecapGameBase> {
  game: GameType;
  teamSeasonId: string;
  readOnly: boolean;
  initialRecap?: string;
  seasonId: string;
  gameDate?: string;
  homeScore?: number;
  visitorScore?: number;
  homeTeamName?: string;
  visitorTeamName?: string;
}

export interface UseGameRecapFlowResult<GameType extends RecapGameBase> {
  openEditRecap: (game: GameType) => Promise<void> | void;
  openViewRecap: (game: GameType) => Promise<void> | void;
  dialogs: React.ReactNode;
  error: string | null;
  clearError: () => void;
  canEditRecap: (game: GameType) => boolean;
}

const NO_RECAP_MESSAGES = ['no recap found', 'not found'];

const hasRecapContent = (recap: string | null | undefined): recap is string => {
  return typeof recap === 'string' && recap.trim().length > 0;
};

function normalizeError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

export function useGameRecapFlow<GameType extends RecapGameBase>(
  params: UseGameRecapFlowParams<GameType>,
): UseGameRecapFlowResult<GameType> {
  const isDebug = process.env.NODE_ENV !== 'production';
  const debugLog = useCallback(
    (message: string, payload?: unknown) => {
      if (!isDebug) {
        return;
      }
      if (payload !== undefined) {
        console.debug(`[useGameRecapFlow] ${message}`, payload);
      } else {
        console.debug(`[useGameRecapFlow] ${message}`);
      }
    },
    [isDebug],
  );

  const {
    accountId,
    seasonId,
    resolveSeasonId,
    fetchRecap,
    determineEditableTeams: determineEditableTeamsOverride,
    getTeamName,
    onRecapSaved,
  } = params;

  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const [dialogState, setDialogState] = useState<RecapDialogState<GameType> | null>(null);
  const [selectionState, setSelectionState] = useState<RecapSelectionState<GameType> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultDetermineEditableTeams = useCallback(
    (game: GameType): string[] => {
      if (
        game.gameStatus !== undefined &&
        game.gameStatus !== null &&
        game.gameStatus !== GameStatus.Completed
      ) {
        return [];
      }

      const editableTeamIds: string[] = [];
      const isAdministrator =
        hasRole('Administrator') || hasRoleInAccount('AccountAdmin', accountId);

      const { homeTeamId, visitorTeamId } = game;

      const canEditHome =
        isAdministrator ||
        hasRoleInTeam('TeamAdmin', homeTeamId) ||
        hasRoleInTeam('TeamManager', homeTeamId);

      const canEditVisitor =
        isAdministrator ||
        hasRoleInTeam('TeamAdmin', visitorTeamId) ||
        hasRoleInTeam('TeamManager', visitorTeamId);

      if (canEditHome) {
        editableTeamIds.push(homeTeamId);
      }

      if (canEditVisitor && !editableTeamIds.includes(visitorTeamId)) {
        editableTeamIds.push(visitorTeamId);
      }

      return editableTeamIds;
    },
    [accountId, hasRole, hasRoleInAccount, hasRoleInTeam],
  );

  const determineEditableTeams = useCallback(
    (game: GameType): string[] => {
      if (determineEditableTeamsOverride) {
        return determineEditableTeamsOverride(game);
      }
      return defaultDetermineEditableTeams(game);
    },
    [defaultDetermineEditableTeams, determineEditableTeamsOverride],
  );

  const deriveSeasonId = useCallback(
    (game: GameType): string | null => {
      if (resolveSeasonId) {
        const resolved = resolveSeasonId(game);
        if (resolved) {
          return resolved;
        }
      }

      if (seasonId) {
        return seasonId;
      }

      if (game.seasonId) {
        return game.seasonId;
      }

      if (game.season && game.season.id) {
        return game.season.id || null;
      }

      return null;
    },
    [resolveSeasonId, seasonId],
  );

  const resolveTeamName = useCallback(
    (game: GameType, teamSeasonId: string): string => {
      if (getTeamName) {
        return getTeamName(game, teamSeasonId);
      }
      if (teamSeasonId === game.homeTeamId) {
        return game.homeTeamName ?? 'Home Team';
      }
      if (teamSeasonId === game.visitorTeamId) {
        return game.visitorTeamName ?? 'Visitor Team';
      }
      return 'Team';
    },
    [getTeamName],
  );

  const resolveGameDate = useCallback((game: GameType): string | undefined => {
    if (game.gameDate) {
      return game.gameDate;
    }
    return game.date;
  }, []);

  const resolveHomeScore = useCallback(
    (game: GameType): number | undefined =>
      typeof game.homeScore === 'number' ? game.homeScore : undefined,
    [],
  );

  const resolveVisitorScore = useCallback(
    (game: GameType): number | undefined =>
      typeof game.visitorScore === 'number' ? game.visitorScore : undefined,
    [],
  );

  const resolveHomeTeamName = useCallback(
    (game: GameType): string | undefined => {
      return game.homeTeamName ?? resolveTeamName(game, game.homeTeamId);
    },
    [resolveTeamName],
  );

  const resolveVisitorTeamName = useCallback(
    (game: GameType): string | undefined => {
      return game.visitorTeamName ?? resolveTeamName(game, game.visitorTeamId);
    },
    [resolveTeamName],
  );

  const fetchRecapsForBothTeams = useCallback(
    async (game: GameType) => {
      const teams = [
        { id: game.homeTeamId, name: resolveTeamName(game, game.homeTeamId) },
        { id: game.visitorTeamId, name: resolveTeamName(game, game.visitorTeamId) },
      ];

      debugLog('fetchRecapsForBothTeams:start', {
        gameId: game.id,
        editableRecapCount: game.gameRecaps?.length ?? 0,
        hasGameRecap: game.hasGameRecap,
        teams,
      });

      setLoading(true);
      try {
        const results = await Promise.all(
          teams.map(async (team) => {
            try {
              const recap = await fetchRecap(game, team.id);
              if (!hasRecapContent(recap)) {
                debugLog('fetchRecapsForBothTeams:empty', {
                  gameId: game.id,
                  teamId: team.id,
                  teamName: team.name,
                });
                return null;
              }
              debugLog('fetchRecapsForBothTeams:success', {
                gameId: game.id,
                teamId: team.id,
                teamName: team.name,
              });
              return { teamId: team.id, teamName: team.name, recap: recap.trim() };
            } catch (err) {
              const message = normalizeError(err, '');
              if (NO_RECAP_MESSAGES.some((needle) => message.toLowerCase().includes(needle))) {
                debugLog('fetchRecapsForBothTeams:not-found', {
                  gameId: game.id,
                  teamId: team.id,
                  teamName: team.name,
                  message,
                });
                return null;
              }
              debugLog('fetchRecapsForBothTeams:error', {
                gameId: game.id,
                teamId: team.id,
                teamName: team.name,
                message,
              });
              throw err;
            }
          }),
        );

        const available = results.filter(
          (value): value is { teamId: string; teamName: string; recap: string } => value !== null,
        );

        debugLog('fetchRecapsForBothTeams:available', {
          gameId: game.id,
          availableTeams: available.map((entry) => entry.teamId),
        });

        return available;
      } finally {
        setLoading(false);
      }
    },
    [debugLog, fetchRecap, resolveTeamName],
  );

  const openDialog = useCallback(
    (
      game: GameType,
      teamSeasonId: string,
      options: { readOnly: boolean; initialRecap?: string },
    ) => {
      const seasonIdentifier = deriveSeasonId(game);
      if (!seasonIdentifier) {
        setError('Missing season information for the selected game.');
        return;
      }

      setDialogState({
        game,
        teamSeasonId,
        readOnly: options.readOnly,
        initialRecap: options.initialRecap ?? '',
        seasonId: seasonIdentifier,
        gameDate: resolveGameDate(game),
        homeScore: resolveHomeScore(game),
        visitorScore: resolveVisitorScore(game),
        homeTeamName: resolveHomeTeamName(game),
        visitorTeamName: resolveVisitorTeamName(game),
      });
      setSelectionState(null);
      setError(null);

      if (options.initialRecap === undefined) {
        setLoading(true);
        fetchRecap(game, teamSeasonId)
          .then((recap) => {
            debugLog('openDialog:loaded', {
              gameId: game.id,
              teamSeasonId,
              hasRecap: hasRecapContent(recap),
            });
            setDialogState((current) =>
              current
                ? {
                    ...current,
                    initialRecap: recap ?? '',
                  }
                : current,
            );
            setError(null);
          })
          .catch((err) => {
            const message = normalizeError(err, 'Failed to load game summary');
            if (NO_RECAP_MESSAGES.some((needle) => message.toLowerCase().includes(needle))) {
              setDialogState((current) =>
                current
                  ? {
                      ...current,
                      initialRecap: '',
                    }
                  : current,
              );
              setError(null);
            } else {
              debugLog('openDialog:error', {
                gameId: game.id,
                teamSeasonId,
                message,
              });
              setError(message);
            }
          })
          .finally(() => setLoading(false));
      }
    },
    [
      deriveSeasonId,
      fetchRecap,
      debugLog,
      resolveGameDate,
      resolveHomeScore,
      resolveHomeTeamName,
      resolveVisitorScore,
      resolveVisitorTeamName,
    ],
  );

  const buildSelectionOptions = useCallback(
    (
      game: GameType,
      editableTeamIds: string[],
      availableRecaps: Array<{ teamId: string; teamName: string; recap: string }>,
    ): RecapOption[] => {
      const options: RecapOption[] = [];
      const editableSet = new Set(editableTeamIds);

      const upsert = (teamId: string, teamName: string, canEdit: boolean, recap?: string) => {
        const existingIndex = options.findIndex((entry) => entry.id === teamId);
        if (existingIndex >= 0) {
          const existing = options[existingIndex];
          options[existingIndex] = {
            id: teamId,
            name: teamName,
            canEdit: existing.canEdit || canEdit,
            recap: recap ?? existing.recap,
          };
          return;
        }

        options.push({ id: teamId, name: teamName, canEdit, recap });
      };

      availableRecaps.forEach(({ teamId, teamName, recap }) => {
        upsert(teamId, teamName, editableSet.has(teamId), recap);
      });

      editableTeamIds.forEach((teamId) => {
        upsert(teamId, resolveTeamName(game, teamId), true);
      });

      return options;
    },
    [resolveTeamName],
  );

  const openEditRecap = useCallback(
    async (game: GameType) => {
      const editableTeamIds = determineEditableTeams(game);
      debugLog('openEditRecap:start', {
        gameId: game.id,
        editableTeamIds,
        hasGameRecap: game.hasGameRecap,
        existingRecaps: game.gameRecaps?.map((recap) => recap.teamId),
      });
      if (editableTeamIds.length === 0) {
        setError('You do not have permission to edit this game recap.');
        return;
      }

      try {
        const availableRecaps = game.hasGameRecap ? await fetchRecapsForBothTeams(game) : [];
        const options = buildSelectionOptions(game, editableTeamIds, availableRecaps);
        debugLog('openEditRecap:options', {
          gameId: game.id,
          options,
        });

        if (options.length === 1 && options[0].canEdit) {
          openDialog(game, options[0].id, { readOnly: false, initialRecap: options[0].recap });
          return;
        }

        setSelectionState({
          game,
          options,
          title: 'Select Team Recap',
        });
      } catch (err) {
        const message = normalizeError(err, 'Failed to load game summary');
        debugLog('openEditRecap:error', {
          gameId: game.id,
          message,
        });
        setError(message);
      }
    },
    [buildSelectionOptions, debugLog, determineEditableTeams, fetchRecapsForBothTeams, openDialog],
  );

  const openViewRecap = useCallback(
    async (game: GameType) => {
      if (!game.hasGameRecap) {
        setError('No recap available for this game.');
        return;
      }

      try {
        const availableRecaps = await fetchRecapsForBothTeams(game);

        if (availableRecaps.length === 0) {
          setError('No recap available for this game.');
          return;
        }

        if (availableRecaps.length === 1) {
          const recap = availableRecaps[0];
          openDialog(game, recap.teamId, { readOnly: true, initialRecap: recap.recap });
          return;
        }

        const options: RecapOption[] = availableRecaps.map(({ teamId, teamName, recap }) => ({
          id: teamId,
          name: teamName,
          canEdit: false,
          recap,
        }));

        setSelectionState({
          game,
          options,
          title: 'Select Team Recap to View',
        });
      } catch (err) {
        const message = normalizeError(err, 'Failed to load game summary');
        debugLog('openViewRecap:error', {
          gameId: game.id,
          message,
        });
        setError(message);
      }
    },
    [debugLog, fetchRecapsForBothTeams, openDialog],
  );

  const handleSelection = useCallback(
    (teamSeasonId: string) => {
      if (!selectionState) {
        return;
      }

      const option = selectionState.options.find((entry) => entry.id === teamSeasonId);
      if (!option) {
        setSelectionState(null);
        return;
      }

      openDialog(selectionState.game, teamSeasonId, {
        readOnly: !option.canEdit,
        initialRecap: option.recap,
      });
    },
    [openDialog, selectionState],
  );

  const handleRecapSuccess = useCallback(
    (result: UpsertGameRecapType) => {
      if (!dialogState) {
        return;
      }

      onRecapSaved?.(dialogState.game, dialogState.teamSeasonId, result.recap);
      setDialogState((current) =>
        current
          ? {
              ...current,
              initialRecap: result.recap,
            }
          : current,
      );
      setError(null);
    },
    [dialogState, onRecapSaved],
  );

  const clearError = useCallback(() => setError(null), []);

  const canEditRecap = useCallback(
    (game: GameType) => determineEditableTeams(game).length > 0,
    [determineEditableTeams],
  );

  const dialogs = useMemo(() => {
    return (
      <>
        {dialogState && (
          <EnterGameRecapDialog
            open={Boolean(dialogState)}
            onClose={() => {
              setDialogState(null);
              setLoading(false);
            }}
            accountId={accountId}
            seasonId={dialogState.seasonId}
            gameId={dialogState.game.id}
            teamSeasonId={dialogState.teamSeasonId}
            initialRecap={dialogState.initialRecap}
            teamName={resolveTeamName(dialogState.game, dialogState.teamSeasonId)}
            gameDate={dialogState.gameDate}
            homeScore={dialogState.homeScore}
            visitorScore={dialogState.visitorScore}
            homeTeamName={dialogState.homeTeamName}
            visitorTeamName={dialogState.visitorTeamName}
            readOnly={dialogState.readOnly}
            onSuccess={handleRecapSuccess}
            onError={(message) => setError(message)}
            loading={loading}
          />
        )}
        {selectionState && (
          <Dialog open onClose={() => setSelectionState(null)} fullWidth maxWidth="xs">
            <DialogTitle
              sx={{
                fontWeight: 700,
                color: (theme) => theme.palette.widget.headerText,
              }}
            >
              {selectionState.title}
            </DialogTitle>
            <DialogContent dividers>
              <List>
                {selectionState.options.map((option) => (
                  <ListItemButton
                    key={option.id}
                    onClick={() => handleSelection(option.id)}
                    disabled={loading}
                  >
                    <ListItemText
                      primary={option.name}
                      secondary={option.canEdit ? 'Edit recap' : 'View recap'}
                    />
                  </ListItemButton>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <MuiButton onClick={() => setSelectionState(null)} disabled={loading}>
                Cancel
              </MuiButton>
            </DialogActions>
          </Dialog>
        )}
      </>
    );
  }, [
    accountId,
    dialogState,
    handleRecapSuccess,
    handleSelection,
    loading,
    resolveTeamName,
    selectionState,
  ]);

  return {
    openEditRecap,
    openViewRecap,
    dialogs,
    error,
    clearError,
    canEditRecap,
  };
}
