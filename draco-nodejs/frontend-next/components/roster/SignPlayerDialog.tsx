'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Alert,
  Box,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
} from '@mui/material';
import { PersonAdd as PersonAddIcon, SportsBasketball as SportsIcon } from '@mui/icons-material';
import {
  BaseContactType,
  RosterPlayerType,
  SignRosterMemberSchema,
  SignRosterMemberType,
  UpdateRosterMemberType,
} from '@draco/shared-schemas';
import { useRosterPlayer, RosterPlayerMutationResult } from '../../hooks/roster/useRosterPlayer';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';
import { getContactDisplayName } from '../../utils/contactUtils';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface SignPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  mode: 'sign' | 'edit';
  rosterMemberId?: string | null;
  initialPlayer?: BaseContactType | RosterPlayerType | null;
  initialRosterData?: SignRosterMemberType;
  onSuccess?: (result: RosterPlayerMutationResult) => Promise<void> | void;
  enableWaiverTracking?: boolean;
  enableIdentificationTracking?: boolean;
}

const isRosterPlayer = (
  player: BaseContactType | RosterPlayerType | null,
): player is RosterPlayerType => {
  return Boolean(player && 'firstYear' in player && 'submittedDriversLicense' in player);
};

const SignPlayerDialog: React.FC<SignPlayerDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  teamSeasonId,
  mode,
  rosterMemberId,
  initialPlayer,
  initialRosterData,
  onSuccess,
  enableWaiverTracking = true,
  enableIdentificationTracking = true,
}) => {
  // Search states - contained within this component
  const [searchInput, setSearchInput] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState<BaseContactType[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use custom hooks for debouncing and delayed loading
  const debouncedSearchInput = useDebouncedValue(searchInput, 400);
  const showSearchLoading = useDelayedLoading(searchLoading, 2000);

  // Use refs for AbortController to handle search cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dialog-specific states
  const [selectedPlayer, setSelectedPlayer] = useState<BaseContactType | RosterPlayerType | null>(
    null,
  );
  const [loadingPlayerRoster, setLoadingPlayerRoster] = useState(false);
  const [signMultiplePlayers, setSignMultiplePlayers] = useState(false);

  const isSigningNewPlayer = mode === 'sign';

  const { searchAvailablePlayers, loadContactRoster, signRosterPlayer, updateRosterPlayer } =
    useRosterPlayer({ accountId, seasonId, teamSeasonId });

  // Refs for unstable functions from useRosterPlayer
  const searchAvailablePlayersRef = useRef(searchAvailablePlayers);
  const loadContactRosterRef = useRef(loadContactRoster);
  const signRosterPlayerRef = useRef(signRosterPlayer);
  const updateRosterPlayerRef = useRef(updateRosterPlayer);

  useEffect(() => {
    searchAvailablePlayersRef.current = searchAvailablePlayers;
    loadContactRosterRef.current = loadContactRoster;
    signRosterPlayerRef.current = signRosterPlayer;
    updateRosterPlayerRef.current = updateRosterPlayer;
  }, [searchAvailablePlayers, loadContactRoster, signRosterPlayer, updateRosterPlayer]);

  const getDefaultFormValues = (): SignRosterMemberType => ({
    playerNumber: undefined,
    submittedWaiver: false,
    player: {
      submittedDriversLicense: false,
      firstYear: new Date().getFullYear(),
      contact: {
        id: '',
      },
    },
  });

  const defaultFormValues = useMemo(() => getDefaultFormValues(), []);

  const formResolver = useMemo(
    () =>
      zodResolver(SignRosterMemberSchema) as Resolver<
        SignRosterMemberType,
        Record<string, never>,
        SignRosterMemberType
      >,
    [],
  );

  const {
    control,
    handleSubmit: submitForm,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignRosterMemberType>({
    resolver: formResolver,
    defaultValues: defaultFormValues,
  });

  // Initialize form data when dialog opens or initial data changes
  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);

    if (initialRosterData) {
      reset(initialRosterData);
    } else {
      reset(getDefaultFormValues());
    }

    if (initialPlayer) {
      setSelectedPlayer(initialPlayer);
      const contactId =
        'contact' in initialPlayer ? initialPlayer.contact.id : (initialPlayer.id ?? '');
      setValue('player.contact', { id: contactId }, { shouldValidate: false, shouldDirty: false });
    } else {
      setSelectedPlayer(null);
      setValue('player.contact', { id: '' }, { shouldValidate: false, shouldDirty: false });
    }
  }, [open, initialRosterData, initialPlayer, reset, setValue]);

  // Search execution with AbortController for proper cancellation
  useEffect(() => {
    const executeSearch = async () => {
      // If search input is less than 2 characters, clear results
      if (debouncedSearchInput.length < 2) {
        setSearchLoading(false);
        setAvailablePlayers([]);
        return;
      }

      // Cancel previous search if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this search
      abortControllerRef.current = new AbortController();

      // Start search loading state
      setSearchLoading(true);

      try {
        // Parse search input to extract names
        let firstName: string | undefined;
        let lastName: string | undefined;

        const trimmedInput = debouncedSearchInput.trim();

        if (trimmedInput.includes(',')) {
          // Comma format: "Last, First Middle" - split on comma
          const [lastPart, firstPart] = trimmedInput.split(',').map((part) => part.trim());
          lastName = lastPart || undefined;

          // For firstName part, take only the first word (ignore middle names)
          if (firstPart) {
            const firstNameParts = firstPart.split(/\s+/);
            firstName = firstNameParts[0] || undefined;
          }
        } else {
          // Space-separated format: "First Middle Last" or "First Last"
          const searchTerms = trimmedInput.split(/\s+/);

          if (searchTerms.length === 1) {
            // Single term - use as lastName (most common search pattern)
            lastName = searchTerms[0];
          } else if (searchTerms.length === 2) {
            // Two terms - first as firstName, second as lastName
            firstName = searchTerms[0];
            lastName = searchTerms[1];
          } else if (searchTerms.length >= 3) {
            // Three or more terms - first as firstName, last as lastName (ignore middle)
            firstName = searchTerms[0];
            lastName = searchTerms[searchTerms.length - 1]; // Take the last word as lastName
          }
        }

        // Execute the search
        const players = await searchAvailablePlayersRef.current(firstName, lastName);

        // Only update state if this search wasn't cancelled
        if (!abortControllerRef.current?.signal.aborted) {
          setAvailablePlayers(players);
          setError(null);
        }
      } catch (error) {
        // Only log error if it wasn't due to cancellation
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Search failed:', error);
          setError(error instanceof Error ? error.message : 'Failed to search for players');
          setAvailablePlayers([]);
        }
      } finally {
        // Only clear loading if this search wasn't cancelled
        if (!abortControllerRef.current?.signal.aborted) {
          setSearchLoading(false);
        }
      }
    };

    if (open && isSigningNewPlayer) {
      executeSearch();
    }

    // Cleanup function to cancel ongoing search when effect re-runs or unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchInput, open, isSigningNewPlayer]);

  // Clear search state when dialog closes
  useEffect(() => {
    if (open) {
      return;
    }

    setSearchInput('');
    setAvailablePlayers([]);
    setSearchLoading(false);
    setSelectedPlayer(null);
    setLoadingPlayerRoster(false);
    setSignMultiplePlayers(false);
    setError(null);
    reset(getDefaultFormValues());

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [open, reset]);

  // Handle player selection
  const handlePlayerSelect = async (newValue: BaseContactType | null) => {
    if (newValue) {
      setSelectedPlayer(newValue);
      setLoadingPlayerRoster(true);

      try {
        const playerRosterData = await loadContactRosterRef.current(newValue.id);
        setValue('player.contact', { id: newValue.id }, { shouldDirty: true, shouldTouch: true });
        setValue('player.firstYear', playerRosterData?.firstYear ?? new Date().getFullYear(), {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue(
          'player.submittedDriversLicense',
          playerRosterData?.submittedDriversLicense ?? false,
          { shouldDirty: true, shouldTouch: true },
        );
        setError(null);
      } catch (error) {
        // Fall back to defaults if fetch fails
        console.warn('Failed to load player roster data:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load existing roster information for this player',
        );
        setValue('player.contact', { id: newValue.id }, { shouldDirty: true, shouldTouch: true });
        setValue('player.firstYear', new Date().getFullYear(), {
          shouldDirty: true,
          shouldTouch: true,
        });
        setValue('player.submittedDriversLicense', false, {
          shouldDirty: true,
          shouldTouch: true,
        });
      } finally {
        setLoadingPlayerRoster(false);
      }
    } else {
      setSelectedPlayer(null);
      setLoadingPlayerRoster(false);
      reset(getDefaultFormValues());
    }
  };

  // Reset form for next player (used in multiple sign mode)
  const resetFormForNextPlayer = () => {
    setSelectedPlayer(null);
    setSearchInput('');
    setAvailablePlayers([]);
    setLoadingPlayerRoster(false);
    setError(null);
    reset(getDefaultFormValues());
  };

  // Handle form submission
  const onValidSubmit = async (values: SignRosterMemberType) => {
    if (isSigningNewPlayer) {
      if (!selectedPlayer) {
        setError('Select a player before signing them to the roster');
        return;
      }

      const formContactId = 'id' in values.player.contact ? values.player.contact.id : '';
      const contactId =
        'contact' in selectedPlayer
          ? selectedPlayer.contact.id
          : (selectedPlayer.id ?? formContactId);

      if (!contactId) {
        setError('Selected player is missing a contact identifier');
        return;
      }

      try {
        setError(null);
        const payload: SignRosterMemberType = {
          ...values,
          player: {
            ...values.player,
            contact: { id: contactId },
          },
        };
        const member = await signRosterPlayerRef.current(contactId, payload);
        await onSuccess?.({ type: 'sign', member });

        if (signMultiplePlayers) {
          resetFormForNextPlayer();
        } else {
          onClose();
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to sign player');
      }
      return;
    }

    if (!rosterMemberId) {
      setError('Unable to update roster member: missing roster member identifier');
      return;
    }

    try {
      if (!isRosterPlayer(selectedPlayer)) {
        setError('Unable to update roster member: missing existing player details');
        return;
      }

      setError(null);

      const rosterUpdate: UpdateRosterMemberType = {};

      if (values.playerNumber !== undefined) {
        rosterUpdate.playerNumber = values.playerNumber;
      }

      if (values.submittedWaiver !== undefined) {
        rosterUpdate.submittedWaiver = values.submittedWaiver;
      }

      const playerUpdates: NonNullable<UpdateRosterMemberType['player']> = {};

      if (values.player?.submittedDriversLicense !== undefined) {
        playerUpdates.submittedDriversLicense = values.player.submittedDriversLicense;
      }

      if (values.player?.firstYear !== undefined) {
        playerUpdates.firstYear = values.player.firstYear;
      }

      if (Object.keys(playerUpdates).length > 0) {
        rosterUpdate.player = playerUpdates;
      }

      const member = await updateRosterPlayerRef.current(rosterMemberId, rosterUpdate);
      await onSuccess?.({ type: 'update', member });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update roster information');
    }
  };

  const handleDialogSubmit = submitForm(onValidSubmit);

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isSigningNewPlayer ? 'Sign Player to Roster' : 'Edit Roster Information'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Sign Multiple Players Toggle */}
          {isSigningNewPlayer && (
            <FormControlLabel
              control={
                <Switch
                  checked={signMultiplePlayers}
                  onChange={(e) => setSignMultiplePlayers(e.target.checked)}
                />
              }
              label="Sign Multiple Players"
              sx={{ mb: 2 }}
            />
          )}

          {/* Player Selection (only for signing new players) */}
          {isSigningNewPlayer && (
            <Autocomplete
              options={availablePlayers}
              getOptionLabel={(option) => getContactDisplayName(option)}
              filterOptions={(options) => options}
              value={selectedPlayer && 'firstName' in selectedPlayer ? selectedPlayer : null}
              inputValue={searchInput}
              onInputChange={(_, newInputValue) => {
                setSearchInput(newInputValue);
              }}
              loading={showSearchLoading}
              onChange={(_, newValue) => handlePlayerSelect(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Player"
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                  helperText="Type at least 2 characters to search for players"
                />
              )}
              noOptionsText={
                showSearchLoading
                  ? 'Searching...'
                  : searchInput.length < 2
                    ? "Start typing a player's name to search..."
                    : 'No players found matching your search'
              }
            />
          )}

          {/* Player Name Display (only for editing existing players) */}
          {!isSigningNewPlayer && selectedPlayer && 'contact' in selectedPlayer && (
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              {getContactDisplayName((selectedPlayer as RosterPlayerType).contact)}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="playerNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Player Number"
                  type="number"
                  value={field.value ?? ''}
                  onChange={(event) => {
                    const { value } = event.target;
                    if (value === '') {
                      field.onChange(undefined);
                      return;
                    }

                    const parsed = Number.parseInt(value, 10);
                    field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                  }}
                  inputProps={{ min: 0, max: 99 }}
                  fullWidth
                  variant="outlined"
                  helperText={errors.playerNumber?.message ?? "Enter the player's jersey number"}
                  error={Boolean(errors.playerNumber)}
                  disabled={
                    (isSigningNewPlayer && (!selectedPlayer || loadingPlayerRoster)) || isSubmitting
                  }
                />
              )}
            />

            <Controller
              name="player.firstYear"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Year"
                  type="number"
                  value={field.value ?? ''}
                  onChange={(event) => {
                    const { value } = event.target;
                    if (value === '') {
                      field.onChange(undefined);
                      return;
                    }

                    const parsed = Number.parseInt(value, 10);
                    field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                  }}
                  inputProps={{ min: 1900, max: new Date().getFullYear() }}
                  fullWidth
                  variant="outlined"
                  helperText={
                    errors.player?.firstYear?.message ??
                    "Enter the player's first year in the league"
                  }
                  error={Boolean(errors.player?.firstYear)}
                  disabled={
                    (isSigningNewPlayer && (!selectedPlayer || loadingPlayerRoster)) || isSubmitting
                  }
                />
              )}
            />

            {enableWaiverTracking ? (
              <Controller
                name="submittedWaiver"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value ?? false}
                        onChange={(event) => field.onChange(event.target.checked)}
                        disabled={
                          (isSigningNewPlayer && (!selectedPlayer || loadingPlayerRoster)) ||
                          isSubmitting
                        }
                      />
                    }
                    label="Submitted Waiver"
                  />
                )}
              />
            ) : null}

            {enableIdentificationTracking ? (
              <Controller
                name="player.submittedDriversLicense"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value ?? false}
                        onChange={(event) => field.onChange(event.target.checked)}
                        disabled={
                          (isSigningNewPlayer && (!selectedPlayer || loadingPlayerRoster)) ||
                          isSubmitting
                        }
                      />
                    }
                    label="Submitted Driver's License"
                  />
                )}
              />
            ) : null}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleDialogSubmit}
          variant="contained"
          disabled={
            isSigningNewPlayer
              ? !selectedPlayer || isSubmitting || loadingPlayerRoster
              : isSubmitting
          }
          startIcon={
            isSubmitting ? (
              <CircularProgress size={20} />
            ) : isSigningNewPlayer ? (
              <PersonAddIcon />
            ) : (
              <SportsIcon />
            )
          }
        >
          {isSubmitting
            ? isSigningNewPlayer
              ? 'Signing...'
              : 'Saving...'
            : isSigningNewPlayer
              ? 'Sign Player'
              : 'Save Roster Info'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignPlayerDialog;
