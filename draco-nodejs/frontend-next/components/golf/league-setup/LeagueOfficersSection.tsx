'use client';

import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Tooltip,
  Box,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import ContactAutocomplete from '../../ContactAutocomplete';
import { OFFICER_TOOLTIPS } from './constants';

interface LeagueOfficersSectionProps<T extends FieldValues> {
  control: Control<T>;
  accountId: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

interface OfficerFieldConfig {
  name: string;
  label: string;
  tooltip: string;
}

const OFFICER_FIELDS: OfficerFieldConfig[] = [
  { name: 'presidentId', label: 'President', tooltip: OFFICER_TOOLTIPS.president },
  { name: 'vicePresidentId', label: 'Vice President', tooltip: OFFICER_TOOLTIPS.vicePresident },
  { name: 'secretaryId', label: 'Secretary', tooltip: OFFICER_TOOLTIPS.secretary },
  { name: 'treasurerId', label: 'Treasurer', tooltip: OFFICER_TOOLTIPS.treasurer },
];

export function LeagueOfficersSection<T extends FieldValues>({
  control,
  accountId,
  expanded = true,
  onExpandedChange,
}: LeagueOfficersSectionProps<T>) {
  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onExpandedChange?.(isExpanded)}
      sx={{ mb: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">League Officers</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          {OFFICER_FIELDS.map((officer) => (
            <Grid key={officer.name} size={{ xs: 12, sm: 6 }}>
              <Controller
                name={officer.name as Path<T>}
                control={control}
                render={({ field }) => (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {officer.label}
                      </Typography>
                      <Tooltip title={officer.tooltip} placement="top" arrow>
                        <InfoOutlinedIcon
                          fontSize="small"
                          color="action"
                          sx={{ ml: 0.5, fontSize: 16 }}
                        />
                      </Tooltip>
                    </Box>
                    <ContactAutocomplete
                      label={officer.label}
                      value={field.value as string | undefined}
                      onChange={field.onChange}
                      accountId={accountId}
                    />
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

export default LeagueOfficersSection;
