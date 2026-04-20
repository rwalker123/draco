'use client';

import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WidgetShell from '../ui/WidgetShell';
import type {
  SeasonSummary,
  StartTimeBucket,
  FieldSummary,
  DayTypeCounts,
  StartTimeSummary,
} from './hooks/useTeamSeasonSummary';

interface SeasonSummaryWidgetProps {
  summary: SeasonSummary | null;
  loading: boolean;
  ready: boolean;
}

const MAX_FIELD_NAME_LENGTH = 40;

const truncateFieldName = (name: string): string => {
  if (name.length <= MAX_FIELD_NAME_LENGTH) return name;
  return `${name.slice(0, MAX_FIELD_NAME_LENGTH - 1).trimEnd()}…`;
};

const BUCKET_LABELS: Record<StartTimeBucket, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  earlyEvening: 'Early Evening',
  lateEvening: 'Late Evening',
  night: 'Night',
};

const BUCKET_RANGES: Record<StartTimeBucket, string> = {
  morning: 'before 12p',
  afternoon: '12p – 4p',
  earlyEvening: '4p – 7p',
  lateEvening: '7p – 10p',
  night: '10p +',
};

interface SummaryRowProps {
  label: string;
  tooltipLabel?: string;
  sublabel?: string;
  played: number;
  scheduled: number;
}

const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  tooltipLabel,
  sublabel,
  played,
  scheduled,
}) => {
  const theme = useTheme();
  const total = played + scheduled;
  const hasScheduled = scheduled > 0;

  return (
    <Box
      display="flex"
      alignItems="baseline"
      justifyContent="space-between"
      gap={1}
      sx={{ py: 0.5 }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          fontWeight={500}
          color={theme.palette.text.primary}
          noWrap
          title={tooltipLabel ?? label}
        >
          {label}
        </Typography>
        {sublabel ? (
          <Typography variant="caption" color={theme.palette.widget.supportingText}>
            {sublabel}
          </Typography>
        ) : null}
      </Box>
      <Box display="flex" alignItems="baseline" gap={1} sx={{ flexShrink: 0 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          color={theme.palette.text.primary}
          component="span"
        >
          {total}
        </Typography>
        {hasScheduled ? (
          <Typography
            variant="caption"
            color={theme.palette.widget.supportingText}
            component="span"
          >
            ({played} played · {scheduled} upcoming)
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
};

interface SubCardProps {
  title: string;
  children: React.ReactNode;
}

const SubCard: React.FC<SubCardProps> = ({ title, children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color={theme.palette.widget.headerText}
        sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {title}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
};

const renderFields = (byField: FieldSummary[]): React.ReactNode => {
  if (byField.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No games scheduled
      </Typography>
    );
  }

  return (
    <>
      {byField.map((field) => (
        <SummaryRow
          key={field.fieldId ?? '__no_field__'}
          label={truncateFieldName(field.fieldName)}
          tooltipLabel={field.fieldName}
          played={field.played}
          scheduled={field.scheduled}
        />
      ))}
    </>
  );
};

const renderDayType = (byDayType: {
  weekday: DayTypeCounts;
  weekend: DayTypeCounts;
}): React.ReactNode => {
  const weekdayTotal = byDayType.weekday.played + byDayType.weekday.scheduled;
  const weekendTotal = byDayType.weekend.played + byDayType.weekend.scheduled;

  if (weekdayTotal === 0 && weekendTotal === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No games scheduled
      </Typography>
    );
  }

  return (
    <>
      <SummaryRow
        label="Weekday"
        sublabel="Mon – Fri"
        played={byDayType.weekday.played}
        scheduled={byDayType.weekday.scheduled}
      />
      <SummaryRow
        label="Weekend"
        sublabel="Sat – Sun"
        played={byDayType.weekend.played}
        scheduled={byDayType.weekend.scheduled}
      />
    </>
  );
};

const renderStartTime = (byStartTime: StartTimeSummary[]): React.ReactNode => {
  if (byStartTime.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No games scheduled
      </Typography>
    );
  }

  return (
    <>
      {byStartTime.map((entry) => (
        <SummaryRow
          key={entry.bucket}
          label={BUCKET_LABELS[entry.bucket]}
          sublabel={BUCKET_RANGES[entry.bucket]}
          played={entry.played}
          scheduled={entry.scheduled}
        />
      ))}
    </>
  );
};

const SeasonSummaryWidget: React.FC<SeasonSummaryWidgetProps> = ({ summary, loading, ready }) => {
  const theme = useTheme();

  if (!ready || loading || !summary || summary.totalGames === 0) {
    return null;
  }

  const subtitle =
    summary.totalScheduled > 0
      ? `${summary.totalGames} games · ${summary.totalPlayed} played · ${summary.totalScheduled} upcoming`
      : `${summary.totalGames} games`;

  return (
    <WidgetShell accent="primary" disablePadding sx={{ mb: 3 }}>
      <Accordion
        disableGutters
        elevation={0}
        square
        sx={{
          backgroundColor: 'transparent',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="season-summary-content"
          id="season-summary-header"
          sx={{
            px: 3,
            py: 1.5,
            '& .MuiAccordionSummary-content': {
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1,
              my: 0,
            },
          }}
        >
          <Typography variant="h6" fontWeight={700} color={theme.palette.widget.headerText}>
            Season Summary
          </Typography>
          <Typography variant="body2" color={theme.palette.widget.supportingText}>
            {subtitle}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, pt: 0, pb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 3 },
              alignItems: 'stretch',
            }}
          >
            <SubCard title="Fields">{renderFields(summary.byField)}</SubCard>
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
                borderColor: theme.palette.widget.border,
              }}
            />
            <SubCard title="Day of Week">{renderDayType(summary.byDayType)}</SubCard>
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
                borderColor: theme.palette.widget.border,
              }}
            />
            <SubCard title="Start Time">{renderStartTime(summary.byStartTime)}</SubCard>
          </Box>
        </AccordionDetails>
      </Accordion>
    </WidgetShell>
  );
};

export default SeasonSummaryWidget;
