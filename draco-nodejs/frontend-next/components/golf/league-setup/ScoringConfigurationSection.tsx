'use client';

import React, { useEffect, useRef } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Box,
  Tooltip,
  Checkbox,
  Grid,
  TextField,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Control, FieldValues, Path, useWatch, useFormContext, Controller } from 'react-hook-form';
import {
  SCORING_TOOLTIPS,
  SCORING_POINTS_FIELDS,
  ABSENT_PLAYER_MODE_OPTIONS,
  FULL_TEAM_ABSENT_MODE_OPTIONS,
  ABSENT_PLAYER_TOOLTIPS,
} from './constants';

type ScoringType = 'individual' | 'team';

interface ScoringConfigurationSectionProps<T extends FieldValues> {
  control: Control<T>;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function ScoringConfigurationSection<T extends FieldValues>({
  control,
  expanded = false,
  onExpandedChange,
}: ScoringConfigurationSectionProps<T>) {
  const { setValue } = useFormContext<T>();

  const scoringType = useWatch({
    control,
    name: 'scoringType' as Path<T>,
  }) as ScoringType | undefined;

  const useHandicapScoring = useWatch({
    control,
    name: 'useHandicapScoring' as Path<T>,
  }) as boolean | undefined;

  const teamSize = useWatch({
    control,
    name: 'teamSize' as Path<T>,
  }) as number | undefined;

  const holesPerMatch = useWatch({
    control,
    name: 'holesPerMatch' as Path<T>,
  }) as number | undefined;

  const absentPlayerMode = useWatch({
    control,
    name: 'absentPlayerMode' as Path<T>,
  }) as string | undefined;

  const isIndividualPlay = teamSize === 1;
  const isPenaltyEnabled = absentPlayerMode === 'handicapPenalty';
  const isNineHoles = holesPerMatch === 9;
  const prevTeamSizeRef = useRef<number | undefined>(teamSize);

  useEffect(() => {
    const prevTeamSize = prevTeamSizeRef.current;
    prevTeamSizeRef.current = teamSize;

    if (prevTeamSize === undefined || teamSize === undefined) {
      return;
    }

    if (teamSize === 1 && prevTeamSize !== 1) {
      setValue('scoringType' as Path<T>, 'individual' as T[Path<T>], { shouldDirty: true });
      setValue('useBestBall' as Path<T>, false as T[Path<T>], { shouldDirty: true });
    } else if (teamSize > 1 && prevTeamSize === 1) {
      setValue('scoringType' as Path<T>, 'team' as T[Path<T>], { shouldDirty: true });
    }
  }, [teamSize, setValue]);

  const handleScoringTypeChange = (newType: ScoringType) => {
    if (isIndividualPlay && newType === 'team') {
      return;
    }
    setValue('scoringType' as Path<T>, newType as T[Path<T>], { shouldDirty: true });
    if (newType === 'individual') {
      setValue('useBestBall' as Path<T>, false as T[Path<T>], { shouldDirty: true });
    }
  };

  const handleHandicapModeChange = (useHandicap: boolean) => {
    setValue('useHandicapScoring' as Path<T>, useHandicap as T[Path<T>], { shouldDirty: true });
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onExpandedChange?.(isExpanded)}
      sx={{ mb: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Scoring Configuration</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 200,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
            }}
          >
            <FormControl>
              <FormLabel id="scoring-type-label">Scoring Type</FormLabel>
              <RadioGroup
                aria-labelledby="scoring-type-label"
                value={scoringType ?? 'team'}
                onChange={(e) => handleScoringTypeChange(e.target.value as ScoringType)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    value="individual"
                    control={<Radio />}
                    label="Individual Scoring"
                  />
                  <Tooltip title={SCORING_TOOLTIPS.useIndividualScoring} placement="top" arrow>
                    <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: -1 }} />
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
                  <Tooltip
                    title={isIndividualPlay ? 'Team scoring requires team size > 1' : ''}
                    placement="top"
                    arrow
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        value="team"
                        control={<Radio />}
                        label="Team Scoring"
                        disabled={isIndividualPlay}
                      />
                      <Tooltip title={SCORING_TOOLTIPS.useTeamScoring} placement="top" arrow>
                        <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: -1 }} />
                      </Tooltip>
                    </Box>
                  </Tooltip>
                  {scoringType === 'team' && (
                    <Box sx={{ ml: 4, display: 'flex', alignItems: 'center' }}>
                      <Controller
                        name={'useBestBall' as Path<T>}
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                            }
                            label="Use Best Ball"
                          />
                        )}
                      />
                      <Tooltip title={SCORING_TOOLTIPS.bestBall} placement="top" arrow>
                        <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: -1 }} />
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </RadioGroup>
            </FormControl>
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 200,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
            }}
          >
            <FormControl>
              <FormLabel id="handicap-mode-label">Handicap Mode</FormLabel>
              <RadioGroup
                aria-labelledby="handicap-mode-label"
                value={useHandicapScoring === false ? 'actual' : 'net'}
                onChange={(e) => handleHandicapModeChange(e.target.value === 'net')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    value="net"
                    control={<Radio />}
                    label="Net Scoring (Handicap Adjusted)"
                  />
                  <Tooltip title={SCORING_TOOLTIPS.netScoring} placement="top" arrow>
                    <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: -1 }} />
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    value="actual"
                    control={<Radio />}
                    label="Actual Scoring (Gross)"
                  />
                  <Tooltip title={SCORING_TOOLTIPS.actualScoring} placement="top" arrow>
                    <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: -1 }} />
                  </Tooltip>
                </Box>
              </RadioGroup>
            </FormControl>
          </Box>
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
          Points Configuration
        </Typography>
        <Grid container spacing={2}>
          {SCORING_POINTS_FIELDS.map((field) => {
            const isPerNineDisabled = field.name === 'perNinePoints' && isNineHoles;
            const tooltipText = isPerNineDisabled
              ? 'Per Nine points are not applicable for 9-hole matches'
              : field.tooltip;

            return (
              <Grid size={{ xs: 6, sm: 4 }} key={field.name}>
                <Controller
                  name={field.name as Path<T>}
                  control={control}
                  render={({ field: formField, fieldState }) => (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Tooltip title={isPerNineDisabled ? tooltipText : ''} placement="top" arrow>
                        <TextField
                          {...formField}
                          type="number"
                          label={field.label}
                          size="small"
                          fullWidth
                          value={isPerNineDisabled ? 0 : (formField.value ?? 0)}
                          onChange={(e) => formField.onChange(parseInt(e.target.value, 10) || 0)}
                          inputProps={{ min: 0 }}
                          disabled={isPerNineDisabled}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      </Tooltip>
                      <Tooltip title={tooltipText} placement="top" arrow>
                        <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: 0.5, mt: 1 }} />
                      </Tooltip>
                    </Box>
                  )}
                />
              </Grid>
            );
          })}
        </Grid>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 'medium' }}>
          Absent Player Handling
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name={'absentPlayerMode' as Path<T>}
              control={control}
              render={({ field }) => (
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="absent-player-mode-label">Partial Absence Mode</InputLabel>
                    <Select
                      labelId="absent-player-mode-label"
                      label="Partial Absence Mode"
                      value={field.value ?? 'opponentWins'}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      {ABSENT_PLAYER_MODE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title={ABSENT_PLAYER_TOOLTIPS.absentPlayerMode} placement="top" arrow>
                    <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: 0.5, mt: 1 }} />
                  </Tooltip>
                </Box>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name={'absentPlayerPenalty' as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Tooltip
                    title={!isPenaltyEnabled ? 'Penalty strokes only apply when using Handicap + Penalty mode' : ''}
                    placement="top"
                    arrow
                  >
                    <TextField
                      {...field}
                      type="number"
                      label="Penalty Strokes"
                      size="small"
                      fullWidth
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      inputProps={{ min: 0, max: 36 }}
                      disabled={!isPenaltyEnabled}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  </Tooltip>
                  <Tooltip title={ABSENT_PLAYER_TOOLTIPS.absentPlayerPenalty} placement="top" arrow>
                    <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: 0.5, mt: 1 }} />
                  </Tooltip>
                </Box>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name={'fullTeamAbsentMode' as Path<T>}
              control={control}
              render={({ field }) => (
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="full-team-absent-mode-label">Full Team Absence Mode</InputLabel>
                    <Select
                      labelId="full-team-absent-mode-label"
                      label="Full Team Absence Mode"
                      value={field.value ?? 'forfeit'}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      {FULL_TEAM_ABSENT_MODE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title={ABSENT_PLAYER_TOOLTIPS.fullTeamAbsentMode} placement="top" arrow>
                    <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: 0.5, mt: 1 }} />
                  </Tooltip>
                </Box>
              )}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export default ScoringConfigurationSection;
