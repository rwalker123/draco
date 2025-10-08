'use client';

import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  getReadOnlyInputProps,
  getReadOnlyDatePickerInputProps,
} from '../../../../utils/formUtils';
import { useGameFormContext } from '../../../../components/schedule/contexts/GameFormContext';
import { Controller, useFormContext } from 'react-hook-form';
import type { GameDialogFormValues } from '../../../../components/schedule/dialogs/GameDialog';

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
    getAvailableUmpires,
    getTeamName,
    getFieldName,
    getGameTypeText,
  } = useGameFormContext();

  const commentValue = watch('comment') ?? '';

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
          <Controller
            name="homeTeamId"
            control={control}
            render={({ field }) =>
              canEditSchedule ? (
                <FormControl fullWidth required error={!!errors.homeTeamId}>
                  <InputLabel>Home Team</InputLabel>
                  <Select {...field} label="Home Team">
                    {leagueTeams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.homeTeamId?.message}</FormHelperText>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label="Home Team"
                  value={getTeamName(field.value || '')}
                  InputProps={getReadOnlyInputProps()}
                />
              )
            }
          />
          <Controller
            name="visitorTeamId"
            control={control}
            render={({ field }) =>
              canEditSchedule ? (
                <FormControl fullWidth required error={!!errors.visitorTeamId}>
                  <InputLabel>Visitor Team</InputLabel>
                  <Select {...field} label="Visitor Team">
                    {leagueTeams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.visitorTeamId?.message}</FormHelperText>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label="Visitor Team"
                  value={getTeamName(field.value || '')}
                  InputProps={getReadOnlyInputProps()}
                />
              )
            }
          />
        </Box>

        {/* Field and Game Type */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="fieldId"
            control={control}
            render={({ field }) =>
              canEditSchedule ? (
                <FormControl fullWidth error={!!errors.fieldId}>
                  <InputLabel shrink>Field</InputLabel>
                  <Select
                    {...field}
                    label="Field"
                    displayEmpty
                    value={field.value ?? ''}
                    renderValue={(selected) => {
                      if (!selected) {
                        return 'None';
                      }
                      const option = fields.find((item) => item.id === selected);
                      return option?.name ?? 'Unknown';
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {fields.map((fieldOption) => (
                      <MenuItem key={fieldOption.id} value={fieldOption.id}>
                        {fieldOption.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.fieldId?.message}</FormHelperText>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label="Field"
                  value={getFieldName(field.value || undefined)}
                  InputProps={getReadOnlyInputProps()}
                />
              )
            }
          />
          <Controller
            name="gameType"
            control={control}
            render={({ field }) =>
              canEditSchedule ? (
                <FormControl fullWidth error={!!errors.gameType}>
                  <InputLabel>Game Type</InputLabel>
                  <Select {...field} label="Game Type">
                    <MenuItem value={0}>Regular Season</MenuItem>
                    <MenuItem value={1}>Playoff</MenuItem>
                    <MenuItem value={2}>Exhibition</MenuItem>
                  </Select>
                  <FormHelperText>{errors.gameType?.message}</FormHelperText>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label="Game Type"
                  value={getGameTypeText(field.value ?? '')}
                  InputProps={getReadOnlyInputProps()}
                />
              )
            }
          />
        </Box>

        {/* Umpires Row 1 */}
        {isAccountAdmin && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller
              name="umpire1"
              control={control}
              render={({ field }) =>
                canEditSchedule ? (
                  <FormControl fullWidth error={!!errors.umpire1}>
                    <InputLabel shrink>Umpire 1</InputLabel>
                    <Select
                      {...field}
                      label="Umpire 1"
                      displayEmpty
                      value={field.value ?? ''}
                      renderValue={(selected) => {
                        if (!selected) {
                          return 'None';
                        }
                        const option = umpires.find((umpire) => umpire.id === selected);
                        return option?.displayName ?? 'Unknown';
                      }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {getAvailableUmpires('umpire1', field.value ?? '').map((umpire) => (
                        <MenuItem key={umpire.id} value={umpire.id}>
                          {umpire.displayName}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.umpire1?.message}</FormHelperText>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label="Umpire 1"
                    value={
                      field.value
                        ? umpires.find((u) => u.id === field.value)?.displayName || 'Unknown'
                        : 'None'
                    }
                    InputProps={getReadOnlyInputProps()}
                  />
                )
              }
            />
            <Controller
              name="umpire2"
              control={control}
              render={({ field }) =>
                canEditSchedule ? (
                  <FormControl fullWidth error={!!errors.umpire2}>
                    <InputLabel shrink>Umpire 2</InputLabel>
                    <Select
                      {...field}
                      label="Umpire 2"
                      displayEmpty
                      value={field.value ?? ''}
                      renderValue={(selected) => {
                        if (!selected) {
                          return 'None';
                        }
                        const option = umpires.find((umpire) => umpire.id === selected);
                        return option?.displayName ?? 'Unknown';
                      }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {getAvailableUmpires('umpire2', field.value ?? '').map((umpire) => (
                        <MenuItem key={umpire.id} value={umpire.id}>
                          {umpire.displayName}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.umpire2?.message}</FormHelperText>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label="Umpire 2"
                    value={
                      field.value
                        ? umpires.find((u) => u.id === field.value)?.displayName || 'Unknown'
                        : 'None'
                    }
                    InputProps={getReadOnlyInputProps()}
                  />
                )
              }
            />
          </Box>
        )}

        {/* Umpires Row 2 */}
        {isAccountAdmin && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller
              name="umpire3"
              control={control}
              render={({ field }) =>
                canEditSchedule ? (
                  <FormControl fullWidth error={!!errors.umpire3}>
                    <InputLabel shrink>Umpire 3</InputLabel>
                    <Select
                      {...field}
                      label="Umpire 3"
                      displayEmpty
                      value={field.value ?? ''}
                      renderValue={(selected) => {
                        if (!selected) {
                          return 'None';
                        }
                        const option = umpires.find((umpire) => umpire.id === selected);
                        return option?.displayName ?? 'Unknown';
                      }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {getAvailableUmpires('umpire3', field.value ?? '').map((umpire) => (
                        <MenuItem key={umpire.id} value={umpire.id}>
                          {umpire.displayName}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.umpire3?.message}</FormHelperText>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label="Umpire 3"
                    value={
                      field.value
                        ? umpires.find((u) => u.id === field.value)?.displayName || 'Unknown'
                        : 'None'
                    }
                    InputProps={getReadOnlyInputProps()}
                  />
                )
              }
            />
            <Controller
              name="umpire4"
              control={control}
              render={({ field }) =>
                canEditSchedule ? (
                  <FormControl fullWidth error={!!errors.umpire4}>
                    <InputLabel shrink>Umpire 4</InputLabel>
                    <Select
                      {...field}
                      label="Umpire 4"
                      displayEmpty
                      value={field.value ?? ''}
                      renderValue={(selected) => {
                        if (!selected) {
                          return 'None';
                        }
                        const option = umpires.find((umpire) => umpire.id === selected);
                        return option?.displayName ?? 'Unknown';
                      }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {getAvailableUmpires('umpire4', field.value ?? '').map((umpire) => (
                        <MenuItem key={umpire.id} value={umpire.id}>
                          {umpire.displayName}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.umpire4?.message}</FormHelperText>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label="Umpire 4"
                    value={
                      field.value
                        ? umpires.find((u) => u.id === field.value)?.displayName || 'Unknown'
                        : 'None'
                    }
                    InputProps={getReadOnlyInputProps()}
                  />
                )
              }
            />
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
