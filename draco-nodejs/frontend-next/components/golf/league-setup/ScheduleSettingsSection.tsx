'use client';

import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Box,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { parse, format } from 'date-fns';
import { DAYS_OF_WEEK, HOLES_PER_MATCH_OPTIONS, TEAM_SIZE_OPTIONS, SCHEDULE_TOOLTIPS } from './constants';

interface ScheduleSettingsSectionProps<T extends FieldValues> {
  control: Control<T>;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function ScheduleSettingsSection<T extends FieldValues>({
  control,
  expanded = true,
  onExpandedChange,
}: ScheduleSettingsSectionProps<T>) {
  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onExpandedChange?.(isExpanded)}
      sx={{ mb: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Schedule & Format</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name={'leagueDay' as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <Tooltip title={SCHEDULE_TOOLTIPS.leagueDay} placement="top" arrow>
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel id="league-day-label">League Day</InputLabel>
                    <Select
                      {...field}
                      labelId="league-day-label"
                      label="League Day"
                      value={field.value ?? 0}
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          {day.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Tooltip>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name={'firstTeeTime' as Path<T>}
              control={control}
              render={({ field, fieldState }) => {
                const timeValue = field.value
                  ? parse(field.value as string, 'HH:mm', new Date())
                  : null;

                return (
                  <Tooltip title={SCHEDULE_TOOLTIPS.firstTeeTime} placement="top" arrow>
                    <Box>
                      <TimePicker
                        label="First Tee Time"
                        value={timeValue}
                        onChange={(newValue) => {
                          if (newValue) {
                            field.onChange(format(newValue, 'HH:mm'));
                          } else {
                            field.onChange(null);
                          }
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!fieldState.error,
                            helperText: fieldState.error?.message,
                          },
                        }}
                      />
                    </Box>
                  </Tooltip>
                );
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name={'timeBetweenTeeTimes' as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <Tooltip title={SCHEDULE_TOOLTIPS.timeBetweenTeeTimes} placement="top" arrow>
                  <TextField
                    {...field}
                    label="Time Between Tee Times (min)"
                    type="number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    value={field.value ?? 10}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 10)}
                    slotProps={{
                      input: {
                        inputProps: { min: 5, max: 30 },
                      },
                    }}
                  />
                </Tooltip>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name={'holesPerMatch' as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <Tooltip title={SCHEDULE_TOOLTIPS.holesPerMatch} placement="top" arrow>
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel id="holes-per-match-label">Holes Per Match</InputLabel>
                    <Select
                      {...field}
                      labelId="holes-per-match-label"
                      label="Holes Per Match"
                      value={field.value ?? 9}
                    >
                      {HOLES_PER_MATCH_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Tooltip>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name={'teamSize' as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <Tooltip title={SCHEDULE_TOOLTIPS.teamSize} placement="top" arrow>
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel id="team-size-label">Team Size</InputLabel>
                    <Select
                      {...field}
                      labelId="team-size-label"
                      label="Team Size"
                      value={field.value ?? 2}
                    >
                      {TEAM_SIZE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Tooltip>
              )}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export default ScheduleSettingsSection;
