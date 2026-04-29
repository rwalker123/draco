'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Link,
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
import type { Game } from '@/types/schedule';
import FieldDatesDialog from './FieldDatesDialog';

interface SelectedField {
  id: string | null;
  name: string;
}

interface SeasonSummaryWidgetProps {
  summary: SeasonSummary | null;
  loading: boolean;
  ready: boolean;
  games?: Game[];
  timeZone?: string;
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

const FIELD_COL_WIDTH = 64;

interface FieldCountCellProps {
  value: number;
  color: string;
}

const FieldCountCell: React.FC<FieldCountCellProps> = ({ value, color }) => (
  <Typography
    variant="body2"
    fontWeight={700}
    color={color}
    component="span"
    sx={{ width: FIELD_COL_WIDTH, textAlign: 'right', flexShrink: 0 }}
  >
    {value}
  </Typography>
);

interface FieldHeaderRowProps {
  labels: [string, string, string];
  tooltips: [string, string, string];
}

const FieldHeaderRow: React.FC<FieldHeaderRowProps> = ({ labels, tooltips }) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      alignItems="baseline"
      justifyContent="space-between"
      gap={1}
      sx={{ pb: 0.5, mb: 0.25 }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }} />
      {labels.map((label, i) => (
        <Typography
          key={label}
          variant="caption"
          fontWeight={700}
          color={theme.palette.widget.supportingText}
          title={tooltips[i]}
          sx={{ width: FIELD_COL_WIDTH, textAlign: 'right', flexShrink: 0 }}
        >
          {label}
        </Typography>
      ))}
    </Box>
  );
};

interface FieldRowProps {
  field: FieldSummary;
  onFieldClick?: (field: SelectedField) => void;
}

const FieldRow: React.FC<FieldRowProps> = ({ field, onFieldClick }) => {
  const theme = useTheme();
  const label = truncateFieldName(field.fieldName);

  const nameCell = onFieldClick ? (
    <Link
      component="button"
      variant="body2"
      fontWeight={500}
      color={theme.palette.text.primary}
      underline="hover"
      onClick={() => onFieldClick({ id: field.fieldId, name: field.fieldName })}
      title={field.fieldName}
      sx={{ textAlign: 'left', display: 'block', maxWidth: '100%' }}
    >
      {label}
    </Link>
  ) : (
    <Typography
      variant="body2"
      fontWeight={500}
      color={theme.palette.text.primary}
      noWrap
      title={field.fieldName}
    >
      {label}
    </Typography>
  );

  return (
    <Box
      display="flex"
      alignItems="baseline"
      justifyContent="space-between"
      gap={1}
      sx={{ py: 0.5 }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>{nameCell}</Box>
      <FieldCountCell value={field.upcoming} color={theme.palette.text.primary} />
      <FieldCountCell value={field.played} color={theme.palette.text.primary} />
      <FieldCountCell value={field.notPlayed} color={theme.palette.text.primary} />
    </Box>
  );
};

const renderFields = (
  byField: FieldSummary[],
  onFieldClick?: (field: SelectedField) => void,
): React.ReactNode => {
  if (byField.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No games scheduled
      </Typography>
    );
  }

  return (
    <>
      <FieldHeaderRow
        labels={['Up', 'Played', 'Not Played']}
        tooltips={['Upcoming', 'Completed, Forfeit, Did Not Report', 'Postponed, Rainout']}
      />
      {byField.map((field) => (
        <FieldRow key={field.fieldId ?? '__no_field__'} field={field} onFieldClick={onFieldClick} />
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

interface HomeAwaySubCardProps {
  homeAway: NonNullable<SeasonSummary['homeAway']>;
}

const HomeAwaySubCard: React.FC<HomeAwaySubCardProps> = ({ homeAway }) => {
  const theme = useTheme();

  return (
    <SubCard title="Home / Away">
      <Box
        display="flex"
        alignItems="baseline"
        justifyContent="space-between"
        gap={1}
        sx={{ py: 0.5 }}
      >
        <Typography variant="body2" fontWeight={500} color={theme.palette.text.primary}>
          Home
        </Typography>
        <Box display="flex" alignItems="baseline" gap={1} sx={{ flexShrink: 0 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            color={theme.palette.text.primary}
            component="span"
          >
            {homeAway.home}
          </Typography>
          {homeAway.played.home > 0 || homeAway.home - homeAway.played.home > 0 ? (
            <Typography
              variant="caption"
              color={theme.palette.widget.supportingText}
              component="span"
            >
              ({homeAway.played.home} played · {homeAway.home - homeAway.played.home} upcoming)
            </Typography>
          ) : null}
        </Box>
      </Box>
      <Box
        display="flex"
        alignItems="baseline"
        justifyContent="space-between"
        gap={1}
        sx={{ py: 0.5 }}
      >
        <Typography variant="body2" fontWeight={500} color={theme.palette.text.primary}>
          Away
        </Typography>
        <Box display="flex" alignItems="baseline" gap={1} sx={{ flexShrink: 0 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            color={theme.palette.text.primary}
            component="span"
          >
            {homeAway.away}
          </Typography>
          {homeAway.played.away > 0 || homeAway.away - homeAway.played.away > 0 ? (
            <Typography
              variant="caption"
              color={theme.palette.widget.supportingText}
              component="span"
            >
              ({homeAway.played.away} played · {homeAway.away - homeAway.played.away} upcoming)
            </Typography>
          ) : null}
        </Box>
      </Box>
    </SubCard>
  );
};

const SeasonSummaryWidget: React.FC<SeasonSummaryWidgetProps> = ({
  summary,
  loading,
  ready,
  games = [],
  timeZone = 'UTC',
}) => {
  const theme = useTheme();
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);

  if (!ready || loading || !summary || summary.totalGames === 0) {
    return null;
  }

  const subtitle =
    summary.totalScheduled > 0
      ? `${summary.totalGames} games · ${summary.totalPlayed} played · ${summary.totalScheduled} upcoming`
      : `${summary.totalGames} games`;

  const hasGames = games.length > 0;
  const onFieldClick = hasGames ? setSelectedField : undefined;

  return (
    <>
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
              {summary.homeAway ? (
                <>
                  <HomeAwaySubCard homeAway={summary.homeAway} />
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                      display: { xs: 'none', md: 'block' },
                      borderColor: theme.palette.widget.border,
                    }}
                  />
                </>
              ) : null}
              <SubCard title="Fields">{renderFields(summary.byField, onFieldClick)}</SubCard>
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
      {hasGames ? (
        <FieldDatesDialog
          open={selectedField !== null}
          onClose={() => setSelectedField(null)}
          fieldId={selectedField?.id ?? null}
          fieldName={selectedField?.name ?? ''}
          games={games}
          timeZone={timeZone}
        />
      ) : null}
    </>
  );
};

export default SeasonSummaryWidget;
