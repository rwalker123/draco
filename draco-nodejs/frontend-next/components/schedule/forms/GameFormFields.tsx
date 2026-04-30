'use client';

import React from 'react';
import { Autocomplete, Box, TextField, createFilterOptions } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getReadOnlyInputProps, getReadOnlyDatePickerInputProps } from '../../../utils/formUtils';
import { useGameFormContext } from '../contexts/GameFormContext';
import { Controller, useFormContext, type FieldPath } from 'react-hook-form';
import type { GameDialogFormValues } from '../dialogs/GameDialog';
import { GameType } from '@/types/schedule';

const EMPTY_LABEL = 'None';

type AutoOption = { id: string; label: string };

const NONE_OPTION: AutoOption = { id: '', label: EMPTY_LABEL };

const startsWithFilter = createFilterOptions<AutoOption>({
  matchFrom: 'start',
  stringify: (option) => option.label,
});

type StringFieldName = Extract<
  FieldPath<GameDialogFormValues>,
  'homeTeamId' | 'visitorTeamId' | 'fieldId' | 'umpire1' | 'umpire2' | 'umpire3' | 'umpire4'
>;

interface ControlledOptionAutocompleteProps {
  name: StringFieldName;
  label: string;
  options: AutoOption[];
  required?: boolean;
  includeEmpty?: boolean;
}

const ControlledOptionAutocomplete: React.FC<ControlledOptionAutocompleteProps> = ({
  name,
  label,
  options,
  required,
  includeEmpty,
}) => {
  const { control } = useFormContext<GameDialogFormValues>();
  const resolvedOptions = includeEmpty ? [NONE_OPTION, ...options] : options;
  const disableClearable = required && !includeEmpty;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const currentValue = field.value ?? '';
        const knownOption = resolvedOptions.find((option) => option.id === currentValue);
        const unknownOption: AutoOption | null =
          !knownOption && currentValue ? { id: currentValue, label: 'Unknown' } : null;
        const displayOptions = unknownOption
          ? [unknownOption, ...resolvedOptions]
          : resolvedOptions;
        const selectedOption = knownOption ?? unknownOption ?? (includeEmpty ? NONE_OPTION : null);
        const hasUnknownValue = Boolean(unknownOption);

        return (
          <Autocomplete
            options={displayOptions}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={startsWithFilter}
            value={selectedOption}
            onChange={(_, option) => field.onChange(option?.id ?? '')}
            onBlur={field.onBlur}
            autoHighlight
            autoSelect
            disableClearable={disableClearable}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={field.ref}
                label={label}
                required={required}
                error={!!fieldState.error || hasUnknownValue}
                helperText={
                  fieldState.error?.message ??
                  (hasUnknownValue ? 'Selection is no longer available' : undefined)
                }
              />
            )}
          />
        );
      }}
    />
  );
};

type GameTypeOption = { value: number; label: string };

const GAME_TYPE_OPTIONS: GameTypeOption[] = [
  { value: GameType.RegularSeason, label: 'Regular Season' },
  { value: GameType.Playoff, label: 'Playoff' },
  { value: GameType.Exhibition, label: 'Exhibition' },
];

const startsWithGameTypeFilter = createFilterOptions<GameTypeOption>({
  matchFrom: 'start',
  stringify: (option) => option.label,
});

const GameFormFields: React.FC = () => {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<GameDialogFormValues>();

  const {
    leagueTeams,
    fields,
    umpires,
    canEditSchedule,
    isAccountAdmin,
    hasOfficials,
    getAvailableUmpires,
    getTeamName,
    getFieldName,
    getGameTypeText,
    selectedGame,
  } = useGameFormContext();

  const commentValue = watch('comment') ?? '';
  const isEditMode = Boolean(selectedGame);

  const teamOptions: AutoOption[] = leagueTeams.map((team) => ({
    id: team.id,
    label: team.name ?? 'Unknown Team',
  }));
  const fieldOptions: AutoOption[] = fields.map((fieldOption) => ({
    id: fieldOption.id,
    label: fieldOption.name,
  }));
  const buildUmpireOptions = (position: string, currentValue: string): AutoOption[] =>
    getAvailableUmpires(position, currentValue).map((umpire) => ({
      id: umpire.id,
      label: `${umpire.firstName} ${umpire.lastName}`.trim(),
    }));

  const getUmpireLabel = (umpireId: string): string => {
    const umpire = umpires.find((candidate) => candidate.id === umpireId);
    return umpire ? `${umpire.firstName} ${umpire.lastName}`.trim() : 'Unknown';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Date and Time */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="gameDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Game Date"
                value={field.value ?? null}
                onChange={(date) => field.onChange(date ?? null)}
                readOnly={!canEditSchedule}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    autoFocus: canEditSchedule && isEditMode,
                    error: !!errors.gameDate,
                    helperText: errors.gameDate?.message,
                    InputProps: !canEditSchedule ? getReadOnlyDatePickerInputProps() : undefined,
                  },
                }}
              />
            )}
          />
          <Controller
            name="gameTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                label="Game Time"
                value={field.value ?? null}
                onChange={(time) => field.onChange(time ?? null)}
                readOnly={!canEditSchedule}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.gameTime,
                    helperText: errors.gameTime?.message,
                    InputProps: !canEditSchedule ? getReadOnlyDatePickerInputProps() : undefined,
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Teams */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canEditSchedule ? (
            <ControlledOptionAutocomplete
              name="homeTeamId"
              label="Home Team"
              options={teamOptions}
              required
            />
          ) : (
            <Controller
              name="homeTeamId"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="Home Team"
                  value={getTeamName(field.value || '')}
                  InputProps={getReadOnlyInputProps()}
                />
              )}
            />
          )}
          {canEditSchedule ? (
            <ControlledOptionAutocomplete
              name="visitorTeamId"
              label="Visitor Team"
              options={teamOptions}
              required
            />
          ) : (
            <Controller
              name="visitorTeamId"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="Visitor Team"
                  value={getTeamName(field.value || '')}
                  InputProps={getReadOnlyInputProps()}
                />
              )}
            />
          )}
        </Box>

        {/* Field and Game Type */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canEditSchedule ? (
            <ControlledOptionAutocomplete
              name="fieldId"
              label="Field"
              options={fieldOptions}
              includeEmpty
            />
          ) : (
            <Controller
              name="fieldId"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="Field"
                  value={getFieldName(field.value || undefined)}
                  InputProps={getReadOnlyInputProps()}
                />
              )}
            />
          )}
          {canEditSchedule ? (
            <Controller
              name="gameType"
              control={control}
              render={({ field, fieldState }) => {
                const selectedOption =
                  GAME_TYPE_OPTIONS.find((option) => option.value === field.value) ?? null;
                return (
                  <Autocomplete
                    options={GAME_TYPE_OPTIONS}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    filterOptions={startsWithGameTypeFilter}
                    value={selectedOption}
                    onChange={(_, option) =>
                      field.onChange(option ? option.value : GameType.RegularSeason)
                    }
                    onBlur={field.onBlur}
                    autoHighlight
                    autoSelect
                    fullWidth
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        inputRef={field.ref}
                        label="Game Type"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                );
              }}
            />
          ) : (
            <Controller
              name="gameType"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="Game Type"
                  value={getGameTypeText(field.value ?? '')}
                  InputProps={getReadOnlyInputProps()}
                />
              )}
            />
          )}
        </Box>

        {/* Umpires Row 1 */}
        {isAccountAdmin && hasOfficials && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {canEditSchedule ? (
              <ControlledOptionAutocomplete
                name="umpire1"
                label="Umpire 1"
                options={buildUmpireOptions('umpire1', watch('umpire1') ?? '')}
                includeEmpty
              />
            ) : (
              <Controller
                name="umpire1"
                control={control}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    label="Umpire 1"
                    value={field.value ? getUmpireLabel(field.value) : EMPTY_LABEL}
                    InputProps={getReadOnlyInputProps()}
                  />
                )}
              />
            )}
            {canEditSchedule ? (
              <ControlledOptionAutocomplete
                name="umpire2"
                label="Umpire 2"
                options={buildUmpireOptions('umpire2', watch('umpire2') ?? '')}
                includeEmpty
              />
            ) : (
              <Controller
                name="umpire2"
                control={control}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    label="Umpire 2"
                    value={field.value ? getUmpireLabel(field.value) : EMPTY_LABEL}
                    InputProps={getReadOnlyInputProps()}
                  />
                )}
              />
            )}
          </Box>
        )}

        {/* Umpires Row 2 */}
        {isAccountAdmin && hasOfficials && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {canEditSchedule ? (
              <ControlledOptionAutocomplete
                name="umpire3"
                label="Umpire 3"
                options={buildUmpireOptions('umpire3', watch('umpire3') ?? '')}
                includeEmpty
              />
            ) : (
              <Controller
                name="umpire3"
                control={control}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    label="Umpire 3"
                    value={field.value ? getUmpireLabel(field.value) : EMPTY_LABEL}
                    InputProps={getReadOnlyInputProps()}
                  />
                )}
              />
            )}
            {canEditSchedule ? (
              <ControlledOptionAutocomplete
                name="umpire4"
                label="Umpire 4"
                options={buildUmpireOptions('umpire4', watch('umpire4') ?? '')}
                includeEmpty
              />
            ) : (
              <Controller
                name="umpire4"
                control={control}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    label="Umpire 4"
                    value={field.value ? getUmpireLabel(field.value) : EMPTY_LABEL}
                    InputProps={getReadOnlyInputProps()}
                  />
                )}
              />
            )}
          </Box>
        )}

        {/* Comment */}
        {(canEditSchedule || commentValue.trim().length > 0) && (
          <TextField
            fullWidth
            label="Comment"
            multiline
            rows={3}
            {...register('comment')}
            error={!!errors.comment}
            helperText={errors.comment?.message}
            InputProps={!canEditSchedule ? getReadOnlyInputProps() : undefined}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default GameFormFields;
