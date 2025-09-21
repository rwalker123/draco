'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { BaseContactType, RosterPlayerType, SignRosterMemberType } from '@draco/shared-schemas';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

interface SignPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  onSignPlayer: (contactId: string, rosterData: SignRosterMemberType) => Promise<void>;
  onUpdateRosterMember: (rosterMemberId: string, updates: SignRosterMemberType) => Promise<void>;
  getContactRoster: (contactId: string) => Promise<RosterPlayerType | undefined>;
  fetchAvailablePlayers: (firstName?: string, lastName?: string) => Promise<BaseContactType[]>;
  isSigningNewPlayer: boolean;
  selectedPlayer: BaseContactType | RosterPlayerType | null;
  initialRosterData?: SignRosterMemberType;
  error?: string | null;
  onClearError: () => void;
}

const SignPlayerDialog: React.FC<SignPlayerDialogProps> = ({
  open,
  onClose,
  onSignPlayer,
  onUpdateRosterMember,
  getContactRoster,
  fetchAvailablePlayers,
  isSigningNewPlayer,
  selectedPlayer: initialSelectedPlayer,
  initialRosterData,
  error,
  onClearError,
}) => {
  // Search states - contained within this component
  const [searchInput, setSearchInput] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState<BaseContactType[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
  const [isSigningPlayer, setIsSigningPlayer] = useState(false);
  const [signMultiplePlayers, setSignMultiplePlayers] = useState(false);

  // Form data state
  const [rosterFormData, setRosterFormData] = useState<SignRosterMemberType>({
    playerNumber: undefined,
    submittedWaiver: false,
    player: {
      submittedDriversLicense: false,
      firstYear: 0,
      contact: {
        id: '',
      },
    },
  });

  // Initialize form data when dialog opens or initial data changes
  useEffect(() => {
    if (open) {
      if (initialRosterData) {
        setRosterFormData(initialRosterData);
      } else {
        setRosterFormData({
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
      }

      if (initialSelectedPlayer) {
        setSelectedPlayer(initialSelectedPlayer);
      } else {
        setSelectedPlayer(null);
      }
    }
  }, [open, initialRosterData, initialSelectedPlayer]);

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
        const players = await fetchAvailablePlayers(firstName, lastName);

        // Only update state if this search wasn't cancelled
        if (!abortControllerRef.current?.signal.aborted) {
          setAvailablePlayers(players);
        }
      } catch (error) {
        // Only log error if it wasn't due to cancellation
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Search failed:', error);
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
  }, [debouncedSearchInput, open, isSigningNewPlayer, fetchAvailablePlayers]);

  // Clear search state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setAvailablePlayers([]);
      setSearchLoading(false);
      setSelectedPlayer(null);
      setLoadingPlayerRoster(false);
      setIsSigningPlayer(false);
      setSignMultiplePlayers(false);

      // Cancel any ongoing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [open]);

  // Handle player selection
  const handlePlayerSelect = useCallback(
    async (newValue: BaseContactType | null) => {
      if (newValue) {
        setSelectedPlayer(newValue);
        setLoadingPlayerRoster(true);

        try {
          const playerRosterData = await getContactRoster(newValue.id);
          setRosterFormData({
            ...rosterFormData,
            player: {
              firstYear: playerRosterData?.firstYear || new Date().getFullYear(),
              submittedDriversLicense: playerRosterData?.submittedDriversLicense || false,
              contact: {
                id: newValue.id,
              },
            },
          });
        } catch (error) {
          // Fall back to defaults if fetch fails
          console.warn('Failed to load player roster data:', error);
          setRosterFormData({
            ...rosterFormData,
            player: {
              firstYear: new Date().getFullYear(),
              submittedDriversLicense: false,
              contact: {
                id: newValue.id,
              },
            },
          });
        } finally {
          setLoadingPlayerRoster(false);
        }
      } else {
        setSelectedPlayer(null);
        setLoadingPlayerRoster(false);
        setRosterFormData({
          ...rosterFormData,
          player: {
            firstYear: new Date().getFullYear(),
            submittedDriversLicense: false,
            contact: {
              id: '',
            },
          },
        });
      }
    },
    [getContactRoster, rosterFormData],
  );

  // Reset form for next player (used in multiple sign mode)
  const resetFormForNextPlayer = useCallback(() => {
    setSelectedPlayer(null);
    setSearchInput('');
    setAvailablePlayers([]);
    setLoadingPlayerRoster(false);
    setRosterFormData({
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
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (isSigningNewPlayer) {
      if (!selectedPlayer) {
        return;
      }
      setIsSigningPlayer(true);
      await onSignPlayer(selectedPlayer.id, rosterFormData);

      if (signMultiplePlayers) {
        // Keep dialog open and reset form for next player
        resetFormForNextPlayer();
      } else {
        // Close dialog as usual
        onClose();
      }

      setIsSigningPlayer(false);
    } else {
      // Handle roster update - always close dialog
      if (selectedPlayer && 'id' in selectedPlayer) {
        await onUpdateRosterMember(selectedPlayer.id, rosterFormData);
        onClose();
      }
    }
  }, [
    isSigningNewPlayer,
    selectedPlayer,
    rosterFormData,
    onSignPlayer,
    onUpdateRosterMember,
    onClose,
    signMultiplePlayers,
    resetFormForNextPlayer,
  ]);

  // Helper function to format names as "Last, First Middle"
  const formatName = (contact: BaseContactType) => {
    const lastName = contact.lastName || '';
    const firstName = contact.firstName || '';
    const middleName = contact.middleName || '';

    let formattedName = lastName;
    if (firstName) {
      formattedName += `, ${firstName}`;
    }
    if (middleName) {
      formattedName += ` ${middleName}`;
    }

    return formattedName;
  };

  return (
    <Dialog open={open} onClose={isSigningPlayer ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isSigningNewPlayer ? 'Sign Player to Roster' : 'Edit Roster Information'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>
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
              getOptionLabel={(option) => formatName(option)}
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
              {formatName((selectedPlayer as RosterPlayerType).contact)}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Player Number"
              type="number"
              value={rosterFormData.playerNumber || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value) || undefined;
                setRosterFormData({
                  ...rosterFormData,
                  playerNumber: value ? Math.max(0, value) : undefined,
                });
              }}
              inputProps={{ min: 0 }}
              fullWidth
              variant="outlined"
              helperText="Enter the player's jersey number"
              disabled={isSigningNewPlayer && (!selectedPlayer || loadingPlayerRoster)}
            />

            <TextField
              label="First Year"
              type="number"
              value={rosterFormData.player.firstYear}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setRosterFormData({
                  ...rosterFormData,
                  player: {
                    ...rosterFormData.player,
                    firstYear: Math.max(0, value),
                  },
                });
              }}
              inputProps={{ min: 0 }}
              fullWidth
              variant="outlined"
              helperText="Enter the player's first year in the league"
              error={
                rosterFormData.player.firstYear !== undefined && rosterFormData.player.firstYear < 0
              }
              disabled={isSigningNewPlayer && (!selectedPlayer || loadingPlayerRoster)}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={rosterFormData.submittedWaiver}
                  onChange={(e) =>
                    setRosterFormData({ ...rosterFormData, submittedWaiver: e.target.checked })
                  }
                  disabled={isSigningNewPlayer && (!selectedPlayer || loadingPlayerRoster)}
                />
              }
              label="Submitted Waiver"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={rosterFormData.player.submittedDriversLicense}
                  onChange={(e) =>
                    setRosterFormData({
                      ...rosterFormData,
                      player: {
                        ...rosterFormData.player,
                        submittedDriversLicense: e.target.checked,
                      },
                    })
                  }
                  disabled={isSigningNewPlayer && (!selectedPlayer || loadingPlayerRoster)}
                />
              }
              label="Submitted Driver's License"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSigningPlayer}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            isSigningNewPlayer ? !selectedPlayer || isSigningPlayer || loadingPlayerRoster : false
          }
          startIcon={
            isSigningPlayer ? (
              <CircularProgress size={20} />
            ) : isSigningNewPlayer ? (
              <PersonAddIcon />
            ) : (
              <SportsIcon />
            )
          }
        >
          {isSigningPlayer ? 'Signing...' : isSigningNewPlayer ? 'Sign Player' : 'Save Roster Info'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignPlayerDialog;
