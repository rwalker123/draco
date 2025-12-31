'use client';

import React from 'react';
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Control, FieldValues, Path, useWatch, useFormContext, Controller } from 'react-hook-form';
import { SCORING_TOOLTIPS, SCORING_POINTS_FIELDS } from './constants';

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

  const handleScoringTypeChange = (newType: ScoringType) => {
    setValue('scoringType' as Path<T>, newType as T[Path<T>]);
    if (newType === 'individual') {
      setValue('useBestBall' as Path<T>, false as T[Path<T>]);
    }
  };

  const handleHandicapModeChange = (useHandicap: boolean) => {
    setValue('useHandicapScoring' as Path<T>, useHandicap as T[Path<T>]);
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
        <FormControl sx={{ mb: 3 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  value="team"
                  control={<Radio />}
                  label="Team Scoring"
                />
                <Tooltip title={SCORING_TOOLTIPS.useTeamScoring} placement="top" arrow>
                  <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: -1 }} />
                </Tooltip>
              </Box>
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

        <FormControl sx={{ mb: 3 }}>
          <FormLabel id="handicap-mode-label">Handicap Mode</FormLabel>
          <RadioGroup
            aria-labelledby="handicap-mode-label"
            value={useHandicapScoring === false ? 'actual' : 'net'}
            onChange={(e) => handleHandicapModeChange(e.target.value === 'net')}
            row
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
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

        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
          Points Configuration
        </Typography>
        <Grid container spacing={2}>
          {SCORING_POINTS_FIELDS.map((field) => (
            <Grid size={{ xs: 6, sm: 4 }} key={field.name}>
              <Controller
                name={field.name as Path<T>}
                control={control}
                render={({ field: formField }) => (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <TextField
                      {...formField}
                      type="number"
                      label={field.label}
                      size="small"
                      fullWidth
                      value={formField.value ?? 0}
                      onChange={(e) => formField.onChange(parseInt(e.target.value, 10) || 0)}
                      inputProps={{ min: 0 }}
                    />
                    <Tooltip title={field.tooltip} placement="top" arrow>
                      <InfoOutlinedIcon
                        fontSize="small"
                        color="action"
                        sx={{ ml: 0.5, mt: 1 }}
                      />
                    </Tooltip>
                  </Box>
                )}
              />
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export default ScoringConfigurationSection;
