'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type {
  SchedulerLeagueExclusion,
  SchedulerLeagueExclusionUpsert,
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
  SchedulerSeasonWindowConfig,
  SchedulerTeamExclusion,
  SchedulerTeamExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerRoundRobinConfig, type LeagueRoundRobinCount } from './SchedulerRoundRobinConfig';
import { SchedulerBlackoutDates } from './SchedulerBlackoutDates';
import { SchedulerLeagueBlackoutDates } from './SchedulerLeagueBlackoutDates';
import { SchedulerTeamBlackoutDates } from './SchedulerTeamBlackoutDates';
import { CollapsibleSection } from './CollapsibleSection';
import { formatDateLongWithOrdinal } from '@/utils/dateUtils';

interface EntityOption {
  id: string;
  name: string;
}

interface SeasonSchedulerConfigPanelProps {
  accountId: string;
  seasonId: string | null;
  timeZone: string;
  seasonWindowConfig: SchedulerSeasonWindowConfig | null;
  seasonStartDate: string;
  seasonEndDate: string;
  seasonExclusions: SchedulerSeasonExclusion[];
  teams: EntityOption[];
  teamNameById: Map<string, string>;
  teamExclusions: SchedulerTeamExclusion[];
  leagueExclusions: SchedulerLeagueExclusion[];
  leagues: EntityOption[];
  selectedLeagueSeasonIds: string[];
  leagueSeasonIdFilter: string | undefined;
  leagueSeasonSelection: string[] | null;
  leagueNameById: Map<string, string>;
  roundRobinCounts: Map<string, LeagueRoundRobinCount>;
  dirty: boolean;
  leaguesDirty: boolean;
  saving: boolean;
  onSeasonStartDateChange: (value: string) => void;
  onSeasonEndDateChange: (value: string) => void;
  onLeagueSelectionChange: (ids: string[]) => void;
  onRoundRobinCountsChange: (counts: Map<string, LeagueRoundRobinCount>) => void;
  onCancel: () => void;
  onLeaguesCancel: () => void;
  onSave: () => void;
  onCreateSeasonExclusion: (input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  onEditSeasonExclusion: (id: string, input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  onDeleteSeasonExclusion: (exclusion: SchedulerSeasonExclusion) => Promise<void>;
  onCreateTeamExclusion: (input: SchedulerTeamExclusionUpsert) => Promise<void>;
  onEditTeamExclusion: (id: string, input: SchedulerTeamExclusionUpsert) => Promise<void>;
  onDeleteTeamExclusion: (exclusion: SchedulerTeamExclusion) => Promise<void>;
  onCreateLeagueExclusion: (input: SchedulerLeagueExclusionUpsert) => Promise<void>;
  onEditLeagueExclusion: (id: string, input: SchedulerLeagueExclusionUpsert) => Promise<void>;
  onDeleteLeagueExclusion: (exclusion: SchedulerLeagueExclusion) => Promise<void>;
}

export const SeasonSchedulerConfigPanel: React.FC<SeasonSchedulerConfigPanelProps> = ({
  accountId,
  seasonId,
  timeZone,
  seasonWindowConfig,
  seasonStartDate,
  seasonEndDate,
  seasonExclusions,
  teams,
  teamNameById,
  teamExclusions,
  leagueExclusions,
  leagues,
  selectedLeagueSeasonIds,
  leagueSeasonIdFilter,
  leagueSeasonSelection,
  leagueNameById,
  roundRobinCounts,
  dirty,
  leaguesDirty,
  saving,
  onSeasonStartDateChange,
  onSeasonEndDateChange,
  onLeagueSelectionChange,
  onRoundRobinCountsChange,
  onCancel,
  onLeaguesCancel,
  onSave,
  onCreateSeasonExclusion,
  onEditSeasonExclusion,
  onDeleteSeasonExclusion,
  onCreateTeamExclusion,
  onEditTeamExclusion,
  onDeleteTeamExclusion,
  onCreateLeagueExclusion,
  onEditLeagueExclusion,
  onDeleteLeagueExclusion,
}) => {
  const allLeagueSeasonIds = leagues.map((league) => league.id);

  const seasonDatesChipLabel = seasonWindowConfig
    ? `${formatDateLongWithOrdinal(seasonWindowConfig.startDate)} – ${formatDateLongWithOrdinal(seasonWindowConfig.endDate)}`
    : 'Not set';
  const blackoutChipLabel = `${seasonExclusions.length} blackout date${
    seasonExclusions.length === 1 ? '' : 's'
  }`;
  const leaguesChipLabel =
    leagues.length > 0
      ? `${selectedLeagueSeasonIds.length} of ${leagues.length} selected`
      : 'No leagues';
  const teamBlackoutChipLabel = `${teamExclusions.length} blackout date${
    teamExclusions.length === 1 ? '' : 's'
  }`;
  const leagueBlackoutChipLabel = `${leagueExclusions.length} blackout date${
    leagueExclusions.length === 1 ? '' : 's'
  }`;

  return (
    <>
      <CollapsibleSection
        title="Season Dates"
        headerExtra={
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip size="small" label={seasonDatesChipLabel} />
            <Chip size="small" label={blackoutChipLabel} />
          </Box>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Season Start"
              type="date"
              size="small"
              value={seasonStartDate}
              onChange={(event) => onSeasonStartDateChange(event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!seasonId}
            />
            <TextField
              label="Season End"
              type="date"
              size="small"
              value={seasonEndDate}
              onChange={(event) => onSeasonEndDateChange(event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!seasonId}
            />
            {dirty && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Save changes">
                  <span>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={onSave}
                      disabled={
                        !seasonId ||
                        saving ||
                        seasonStartDate.trim().length === 0 ||
                        seasonEndDate.trim().length === 0
                      }
                      aria-label="Save scheduler settings"
                    >
                      <CheckIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Discard changes">
                  <span>
                    <IconButton
                      size="small"
                      onClick={onCancel}
                      disabled={saving}
                      aria-label="Discard scheduler settings changes"
                    >
                      <CloseIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            )}
          </Box>

          {seasonId && !seasonWindowConfig && (
            <Alert severity="info">
              Set the season scheduling window to begin. Enter start and end dates above and save.
            </Alert>
          )}

          <SchedulerBlackoutDates
            seasonId={seasonId}
            timeZone={timeZone}
            exclusions={seasonExclusions}
            loading={saving}
            onCreate={onCreateSeasonExclusion}
            onEdit={onEditSeasonExclusion}
            onDelete={onDeleteSeasonExclusion}
          />
        </Box>
      </CollapsibleSection>

      <Divider sx={{ my: 2 }} />

      <CollapsibleSection
        title="Leagues to Schedule"
        headerExtra={
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip size="small" label={leaguesChipLabel} />
            <Chip size="small" label={leagueBlackoutChipLabel} />
          </Box>
        }
      >
        {leagues.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 320 }}>
                <InputLabel id="scheduler-leagues-filter">Leagues</InputLabel>
                <Select
                  labelId="scheduler-leagues-filter"
                  label="Leagues"
                  multiple
                  value={selectedLeagueSeasonIds}
                  onChange={(event) => {
                    const next = Array.isArray(event.target.value)
                      ? event.target.value
                      : String(event.target.value).split(',');
                    if (next.length === 0) {
                      return;
                    }
                    onLeagueSelectionChange(next);
                  }}
                  renderValue={(selected) =>
                    selected.map((id) => leagueNameById.get(id) ?? `League ${id}`).join(', ')
                  }
                >
                  {leagues.map((league) => (
                    <MenuItem key={league.id} value={league.id}>
                      {league.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                onClick={() => onLeagueSelectionChange(allLeagueSeasonIds)}
              >
                Select All
              </Button>

              {leaguesDirty && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title="Save changes">
                    <span>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={onSave}
                        disabled={!seasonId || saving || selectedLeagueSeasonIds.length === 0}
                        aria-label="Save league selection"
                      >
                        <CheckIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Discard changes">
                    <span>
                      <IconButton
                        size="small"
                        onClick={onLeaguesCancel}
                        disabled={saving}
                        aria-label="Discard league selection changes"
                      >
                        <CloseIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {leagueSeasonIdFilter && leagueSeasonSelection === null && (
              <Typography variant="caption" color="text.secondary">
                Defaulted from the schedule page league filter.
              </Typography>
            )}

            {selectedLeagueSeasonIds.length === 0 && (
              <Alert severity="warning">Select at least one league to schedule.</Alert>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No leagues found for this season.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <SchedulerLeagueBlackoutDates
          seasonId={seasonId}
          timeZone={timeZone}
          leagues={leagues}
          leagueNameById={leagueNameById}
          exclusions={leagueExclusions}
          loading={saving}
          onCreate={onCreateLeagueExclusion}
          onEdit={onEditLeagueExclusion}
          onDelete={onDeleteLeagueExclusion}
        />

        <SchedulerRoundRobinConfig
          accountId={accountId}
          seasonId={seasonId}
          selectedLeagueSeasonIds={selectedLeagueSeasonIds}
          leagues={leagues}
          leagueNameById={leagueNameById}
          counts={roundRobinCounts}
          onCountsChange={onRoundRobinCountsChange}
        />
      </CollapsibleSection>

      <Divider sx={{ my: 2 }} />

      <CollapsibleSection
        title="Teams to Schedule"
        headerExtra={<Chip size="small" label={teamBlackoutChipLabel} />}
      >
        <SchedulerTeamBlackoutDates
          seasonId={seasonId}
          timeZone={timeZone}
          teams={teams}
          teamNameById={teamNameById}
          exclusions={teamExclusions}
          loading={saving}
          onCreate={onCreateTeamExclusion}
          onEdit={onEditTeamExclusion}
          onDelete={onDeleteTeamExclusion}
        />
      </CollapsibleSection>
    </>
  );
};
