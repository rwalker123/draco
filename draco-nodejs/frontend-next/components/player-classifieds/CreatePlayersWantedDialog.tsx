'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormHelperText,
  SelectChangeEvent,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  UpsertPlayersWantedClassifiedType,
  PlayersWantedClassifiedType,
} from '@draco/shared-schemas';
import { useAuth } from '../../context/AuthContext';
import { PLAYER_CLASSIFIED_VALIDATION } from '../../utils/characterValidation';
import CharacterCounter from '../common/CharacterCounter';
import { playerClassifiedService } from '../../services/playerClassifiedService';
import { getAccountUserTeams } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';

// Use shared validation constants
const VALIDATION_CONSTANTS = PLAYER_CLASSIFIED_VALIDATION.PLAYERS_WANTED;

interface CreatePlayersWantedDialogProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  editMode?: boolean;
  initialData?: UpsertPlayersWantedClassifiedType;
  onSuccess?: (classified: PlayersWantedClassifiedType) => void;
  onError?: (message: string) => void;
}

// Available positions for players wanted - using IDs that match backend validation
const AVAILABLE_POSITIONS = [
  'any',
  'pitcher',
  'catcher',
  'first-base',
  'second-base',
  'third-base',
  'shortstop',
  'left-field',
  'center-field',
  'right-field',
  'utility',
  'designated-hitter',
];

// Position display names
const POSITION_LABELS: Record<string, string> = {
  any: 'Any Position',
  pitcher: 'Pitcher',
  catcher: 'Catcher',
  'first-base': 'First Base',
  'second-base': 'Second Base',
  'third-base': 'Third Base',
  shortstop: 'Shortstop',
  'left-field': 'Left Field',
  'center-field': 'Center Field',
  'right-field': 'Right Field',
  utility: 'Utility',
  'designated-hitter': 'Designated Hitter',
};

const EMPTY_FORM: UpsertPlayersWantedClassifiedType = {
  teamEventName: '',
  description: '',
  positionsNeeded: '',
};

const CreatePlayersWantedDialog: React.FC<CreatePlayersWantedDialogProps> = ({
  accountId,
  open,
  onClose,
  editMode = false,
  initialData,
  onSuccess,
  onError,
}) => {
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;
  const apiClient = useApiClient();

  const [formData, setFormData] = useState<UpsertPlayersWantedClassifiedType>(
    initialData ?? EMPTY_FORM,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpsertPlayersWantedClassifiedType, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [teamOptions, setTeamOptions] = useState<string[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  useEffect(() => {
    setFormData(initialData ?? EMPTY_FORM);
  }, [initialData]);

  const selectedPositions = useMemo(() => {
    return formData.positionsNeeded
      ? formData.positionsNeeded
          .split(',')
          .map((position) => position.trim())
          .filter((position) => position.length > 0)
      : [];
  }, [formData.positionsNeeded]);

  const handleFieldChange = (
    field: keyof UpsertPlayersWantedClassifiedType,
    value: string | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePositionsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    const limitedPositions = value.slice(0, 3);

    setFormData((prev) => ({
      ...prev,
      positionsNeeded: limitedPositions.join(','),
    }));

    if (errors.positionsNeeded) {
      setErrors((prev) => ({ ...prev, positionsNeeded: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpsertPlayersWantedClassifiedType, string>> = {};

    if (!formData.teamEventName.trim()) {
      newErrors.teamEventName = 'Team/Event name is required';
    } else if (
      formData.teamEventName.trim().length < VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MIN_LENGTH
    ) {
      newErrors.teamEventName = `Team/Event name must be at least ${VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MIN_LENGTH} characters`;
    } else if (
      formData.teamEventName.trim().length > VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MAX_LENGTH
    ) {
      newErrors.teamEventName = `Team/Event name must not exceed ${VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MAX_LENGTH} characters`;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < VALIDATION_CONSTANTS.DESCRIPTION.MIN_LENGTH) {
      newErrors.description = `Description must be at least ${VALIDATION_CONSTANTS.DESCRIPTION.MIN_LENGTH} characters`;
    } else if (formData.description.trim().length > VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH) {
      newErrors.description = `Description must not exceed ${VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH} characters`;
    }

    if (selectedPositions.length === 0) {
      newErrors.positionsNeeded = 'Please select at least one position';
    } else if (selectedPositions.length > 3) {
      newErrors.positionsNeeded = 'Please select no more than 3 positions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = useCallback((): UpsertPlayersWantedClassifiedType => {
    const payload: UpsertPlayersWantedClassifiedType = {
      ...(formData.id ? { id: formData.id } : {}),
      teamEventName: formData.teamEventName.trim(),
      description: formData.description.trim(),
      positionsNeeded: selectedPositions.join(','),
    };
    return payload;
  }, [formData, selectedPositions]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    if (!isAuthenticated || !token) {
      const message = 'You must be signed in to perform this action.';
      setSubmitError(message);
      onError?.(message);
      return;
    }

    const payload = buildPayload();

    try {
      setSubmitting(true);
      let result: PlayersWantedClassifiedType;

      if (editMode) {
        const classifiedId = payload.id;
        if (!classifiedId) {
          throw new Error('Missing classified identifier for update.');
        }

        const updatePayload: UpsertPlayersWantedClassifiedType = {
          teamEventName: payload.teamEventName,
          description: payload.description,
          positionsNeeded: payload.positionsNeeded,
        };
        result = await playerClassifiedService.updatePlayersWanted(
          accountId,
          classifiedId,
          updatePayload,
          token,
        );
      } else {
        const createPayload: UpsertPlayersWantedClassifiedType = {
          teamEventName: payload.teamEventName,
          description: payload.description,
          positionsNeeded: payload.positionsNeeded,
        };
        result = await playerClassifiedService.createPlayersWanted(accountId, createPayload, token);
      }

      onSuccess?.(result);
      handleClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to ${editMode ? 'update' : 'create'} Players Wanted ad`;
      setSubmitError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialData ?? EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  useEffect(() => {
    const shouldFetchTeams = open && isAuthenticated;
    if (!shouldFetchTeams) {
      return;
    }

    let ignore = false;
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        const result = await getAccountUserTeams({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        const teamsResponse = unwrapApiResult(result, 'Failed to load teams');
        const normalizedTeams = Array.isArray(teamsResponse) ? teamsResponse : [];

        const teams: string[] = Array.from(
          new Set(
            normalizedTeams
              .map((team) => {
                const parts = [team.league?.name, team.name]
                  .map((part) => part?.trim())
                  .filter((part): part is string => Boolean(part && part.length > 0));
                return parts.join(' ').trim();
              })
              .filter((teamName) => teamName.length > 0),
          ),
        );

        if (!ignore) {
          setTeamOptions(teams);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Failed to load user teams:', error);
          setTeamOptions([]);
        }
      } finally {
        if (!ignore) {
          setTeamsLoading(false);
        }
      }
    };

    fetchTeams();

    return () => {
      ignore = true;
    };
  }, [open, accountId, isAuthenticated, token, apiClient]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? 'Edit Players Wanted' : 'Post Players Wanted'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {!isAuthenticated && (
              <Alert severity="warning">
                You must be signed in and a member of this account to post Players Wanted ads.
              </Alert>
            )}

            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <Box>
              <Autocomplete
                freeSolo
                options={teamOptions}
                value={formData.teamEventName || null}
                inputValue={formData.teamEventName}
                onChange={(_, newValue) =>
                  handleFieldChange('teamEventName', (newValue as string) ?? '')
                }
                onInputChange={(_, value) => handleFieldChange('teamEventName', value)}
                disabled={submitting || !isAuthenticated}
                renderInput={(params) => {
                  params.InputProps.endAdornment = (
                    <>
                      {teamsLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  );

                  return (
                    <TextField
                      {...params}
                      label="Team/Event Name"
                      error={!!errors.teamEventName}
                      helperText={errors.teamEventName || 'Name of your team or event'}
                      required
                      fullWidth
                      inputProps={{
                        ...params.inputProps,
                        maxLength: VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MAX_LENGTH,
                      }}
                    />
                  );
                }}
              />
              <CharacterCounter
                currentLength={formData.teamEventName.length}
                maxLength={VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MAX_LENGTH}
              />
            </Box>

            <Box>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                error={!!errors.description}
                helperText={
                  errors.description ||
                  "Describe what kind of players you're looking for, league details, schedule, etc."
                }
                required
                fullWidth
                multiline
                rows={4}
                disabled={submitting || !isAuthenticated}
                slotProps={{
                  htmlInput: {
                    maxLength: VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH,
                  },
                }}
              />
              <CharacterCounter
                currentLength={formData.description.length}
                maxLength={VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH}
              />
            </Box>

            <FormControl error={!!errors.positionsNeeded} disabled={submitting || !isAuthenticated}>
              <InputLabel>Positions Needed</InputLabel>
              <Select
                multiple
                value={selectedPositions}
                onChange={handlePositionsChange}
                input={<OutlinedInput label="Positions Needed" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(Array.isArray(selected) ? selected : [])
                      .map((value) => value as string)
                      .map((value) => (
                        <Chip key={value} label={POSITION_LABELS[value] || value} size="small" />
                      ))}
                  </Box>
                )}
              >
                {AVAILABLE_POSITIONS.map((position) => (
                  <MenuItem
                    key={position}
                    value={position}
                    disabled={
                      selectedPositions.length >= 3 && !selectedPositions.includes(position)
                    }
                  >
                    {POSITION_LABELS[position]}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {errors.positionsNeeded ||
                  'Select up to 3 positions you need players for (select "Any Position" if flexible)'}
              </FormHelperText>
            </FormControl>

            <Alert severity="info">
              Your Players Wanted ad will be visible to all visitors of the site for 45 days.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting || !isAuthenticated}>
            {submitting
              ? editMode
                ? 'Updating...'
                : 'Creating...'
              : editMode
                ? 'Update Ad'
                : 'Create Ad'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatePlayersWantedDialog;
