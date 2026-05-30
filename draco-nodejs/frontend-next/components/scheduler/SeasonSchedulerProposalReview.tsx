'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import type {
  SchedulerGameRequest,
  SchedulerProblemSpecPreview,
  SchedulerSolveResult,
} from '@draco/shared-schemas';
import { formatDateInTimezone, getDateKeyInTimezone } from '../../utils/dateUtils';
import { ProposalAssignmentRow } from './ProposalAssignmentRow';
import { SchedulerSpecPreviewDialog } from './SchedulerSpecPreviewDialog';

interface SeasonSchedulerProposalReviewProps {
  proposal: SchedulerSolveResult | null;
  specPreview: SchedulerProblemSpecPreview | null;
  specPreviewOpen: boolean;
  loading: boolean;
  timeZone: string;
  selectedGameIds: Set<string>;
  fieldNameById: Map<string, string>;
  teamNameById: Map<string, string>;
  umpireNameById: Map<string, string>;
  leagueNameById: Map<string, string>;
  generatedMatchups: SchedulerGameRequest[] | null;
  getGameSummaryLabel: (gameId: string) => string;
  onToggleSelection: (gameId: string) => void;
  onToggleAll: () => void;
  onApply: () => void;
  onCloseSpecPreview: () => void;
}

const dateHeaderOptions: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

type Assignment = SchedulerSolveResult['assignments'][number];
type GroupedAssignments = Array<{
  dateKey: string;
  dateLabel: string;
  assignments: Assignment[];
}>;

const groupAssignmentsByDate = (
  proposal: SchedulerSolveResult | null,
  timeZone: string,
): GroupedAssignments => {
  if (!proposal) return [];
  const groups = new Map<string, { dateLabel: string; assignments: Assignment[] }>();
  proposal.assignments.forEach((assignment) => {
    const dateKey = getDateKeyInTimezone(assignment.startTime, timeZone) ?? assignment.startTime;
    const existing = groups.get(dateKey);
    if (existing) {
      existing.assignments.push(assignment);
    } else {
      groups.set(dateKey, {
        dateLabel: formatDateInTimezone(assignment.startTime, timeZone, dateHeaderOptions),
        assignments: [assignment],
      });
    }
  });
  return Array.from(groups.keys())
    .sort()
    .map((dateKey) => {
      const group = groups.get(dateKey) ?? { dateLabel: dateKey, assignments: [] };
      const sortedGroup = [...group.assignments].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      return { dateKey, dateLabel: group.dateLabel, assignments: sortedGroup };
    });
};

export const SeasonSchedulerProposalReview: React.FC<SeasonSchedulerProposalReviewProps> = ({
  proposal,
  specPreview,
  specPreviewOpen,
  loading,
  timeZone,
  selectedGameIds,
  fieldNameById,
  teamNameById,
  umpireNameById,
  leagueNameById,
  generatedMatchups,
  getGameSummaryLabel,
  onToggleSelection,
  onToggleAll,
  onApply,
  onCloseSpecPreview,
}) => {
  const [expandedGameIds, setExpandedGameIds] = useState<Set<string>>(new Set());
  const [trackedRunId, setTrackedRunId] = useState<string | undefined>(proposal?.runId);

  if (proposal?.runId !== trackedRunId) {
    setTrackedRunId(proposal?.runId);
    setExpandedGameIds(new Set());
  }

  const assignments = proposal?.assignments ?? [];

  const schedulerUmpireNameById = new Map<string, string>(
    (specPreview?.umpires ?? [])
      .filter(
        (umpire): umpire is typeof umpire & { name: string } =>
          typeof umpire.name === 'string' && umpire.name.length > 0,
      )
      .map((umpire) => [umpire.id, umpire.name]),
  );

  const gameRequestById = new Map<string, SchedulerProblemSpecPreview['games'][number]>(
    [...(specPreview?.games ?? []), ...(generatedMatchups ?? [])].map((game) => [game.id, game]),
  );

  const selectedMode = !proposal || selectedGameIds.size === assignments.length ? 'all' : 'subset';

  const toggleExpanded = (gameId: string) => {
    setExpandedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  };

  const groupedAssignments = groupAssignmentsByDate(proposal, timeZone);

  return (
    <>
      <Box>
        <Typography variant="subtitle2">Proposal</Typography>
        {!proposal && (
          <Typography variant="body2" color="text.secondary">
            Generate a proposal to see suggested assignments.
          </Typography>
        )}

        {proposal && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Status: {proposal.status}. Scheduled {proposal.metrics.scheduledGames}/
              {proposal.metrics.totalGames}.
            </Typography>

            {proposal.assignments.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No assignments produced.
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedGameIds.size === proposal.assignments.length}
                        indeterminate={
                          selectedGameIds.size > 0 &&
                          selectedGameIds.size < proposal.assignments.length
                        }
                        onChange={onToggleAll}
                      />
                    }
                    label={`Select (${selectedGameIds.size}/${proposal.assignments.length})`}
                  />
                  <Button
                    variant="contained"
                    onClick={onApply}
                    disabled={selectedGameIds.size === 0 || loading}
                  >
                    Apply {selectedMode === 'all' ? 'All' : 'Selected'}
                  </Button>
                </Box>

                <Stack spacing={1}>
                  {groupedAssignments.map((group) => (
                    <Box
                      key={group.dateKey}
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        {group.dateLabel}
                      </Typography>
                      {group.assignments.map((assignment) => (
                        <ProposalAssignmentRow
                          key={assignment.gameId}
                          assignment={assignment}
                          game={gameRequestById.get(assignment.gameId)}
                          timeZone={timeZone}
                          selected={selectedGameIds.has(assignment.gameId)}
                          expanded={expandedGameIds.has(assignment.gameId)}
                          fieldNameById={fieldNameById}
                          teamNameById={teamNameById}
                          umpireNameById={umpireNameById}
                          schedulerUmpireNameById={schedulerUmpireNameById}
                          leagueNameById={leagueNameById}
                          onToggleSelection={() => onToggleSelection(assignment.gameId)}
                          onToggleExpanded={() => toggleExpanded(assignment.gameId)}
                        />
                      ))}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {proposal.unscheduled.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Unscheduled</Typography>
                <Typography variant="body2" color="text.secondary">
                  {proposal.unscheduled.length} game(s) could not be scheduled.
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {proposal.unscheduled.map((item) => (
                    <Box
                      key={item.gameId}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" noWrap>
                        {getGameSummaryLabel(item.gameId)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.reason}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {loading && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2">Working…</Typography>
        </Box>
      )}

      <SchedulerSpecPreviewDialog
        open={specPreviewOpen}
        specPreview={specPreview}
        onClose={onCloseSpecPreview}
      />
    </>
  );
};
