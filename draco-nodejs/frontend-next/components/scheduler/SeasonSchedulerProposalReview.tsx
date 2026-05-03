'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';

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
  getGameSummaryLabel: (gameId: string) => string;
  onToggleSelection: (gameId: string) => void;
  onToggleAll: () => void;
  onApply: () => void;
  onCloseSpecPreview: () => void;
}

const formatIsoDateKey = (isoString: string, timeZone: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const formatLocalDateHeader = (isoString: string, timeZone: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const formatLocalTimeRange = (startIso: string, endIso: string, timeZone: string): string => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso}–${endIso}`;
  }

  try {
    const dateLabel = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(start);

    const startTime = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(start);

    const endTime = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(end);

    const tzLabel = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    })
      .formatToParts(start)
      .find((part) => part.type === 'timeZoneName')?.value;

    return `${dateLabel} • ${startTime} – ${endTime}${tzLabel ? ` (${tzLabel})` : ''}`;
  } catch {
    return `${start.toISOString()}–${end.toISOString()}`;
  }
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
  getGameSummaryLabel,
  onToggleSelection,
  onToggleAll,
  onApply,
  onCloseSpecPreview,
}) => {
  const [expandedGameIds, setExpandedGameIds] = useState<Set<string>>(new Set());

  const assignments = proposal?.assignments ?? [];

  const schedulerUmpireNameById = new Map<string, string>(
    (specPreview?.umpires ?? [])
      .filter((umpire) => Boolean(umpire.name))
      .map((umpire) => [umpire.id, umpire.name as string]),
  );

  const gameRequestById = new Map<string, SchedulerProblemSpecPreview['games'][number]>(
    (specPreview?.games ?? []).map((game) => [game.id, game]),
  );

  const selectedMode = !proposal || selectedGameIds.size === assignments.length ? 'all' : 'subset';

  const toggleExpanded = (gameId: string) => {
    setExpandedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const groupedAssignments = ((): Array<{
    dateKey: string;
    dateLabel: string;
    assignments: typeof assignments;
  }> => {
    if (!proposal) {
      return [];
    }

    const groups = new Map<string, { dateLabel: string; assignments: typeof assignments }>();
    proposal.assignments.forEach((assignment) => {
      const dateKey = formatIsoDateKey(assignment.startTime, timeZone);
      const existing = groups.get(dateKey);
      if (existing) {
        existing.assignments.push(assignment);
      } else {
        groups.set(dateKey, {
          dateLabel: formatLocalDateHeader(assignment.startTime, timeZone),
          assignments: [assignment],
        });
      }
    });

    const sortedKeys = Array.from(groups.keys()).sort();
    return sortedKeys.map((dateKey) => {
      const group = groups.get(dateKey) ?? { dateLabel: dateKey, assignments: [] };
      const sortedGroup = [...group.assignments].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      return { dateKey, dateLabel: group.dateLabel, assignments: sortedGroup };
    });
  })();

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
                    disabled={selectedGameIds.size === 0}
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

                      {group.assignments.map((assignment) => {
                        const game = gameRequestById.get(assignment.gameId);
                        const home =
                          (game?.homeTeamSeasonId
                            ? teamNameById.get(game.homeTeamSeasonId)
                            : null) ?? 'Unknown Home';
                        const visitor =
                          (game?.visitorTeamSeasonId
                            ? teamNameById.get(game.visitorTeamSeasonId)
                            : null) ?? 'Unknown Visitor';
                        const title = game ? `${home} vs ${visitor}` : `Game ${assignment.gameId}`;

                        const leagueLabel =
                          game?.leagueSeasonId && leagueNameById.get(game.leagueSeasonId)
                            ? leagueNameById.get(game.leagueSeasonId)
                            : null;

                        const umpireNames = assignment.umpireIds
                          .map(
                            (id) =>
                              schedulerUmpireNameById.get(id) ??
                              umpireNameById.get(id) ??
                              `Umpire ${id}`,
                          )
                          .filter((name) => name.trim().length > 0);

                        const secondaryParts: string[] = [];
                        if (leagueLabel) {
                          secondaryParts.push(leagueLabel);
                        }
                        secondaryParts.push(
                          `Field: ${fieldNameById.get(assignment.fieldId) ?? `Field ${assignment.fieldId}`}`,
                        );
                        secondaryParts.push(
                          formatLocalTimeRange(assignment.startTime, assignment.endTime, timeZone),
                        );
                        if (umpireNames.length === 1) {
                          secondaryParts.push(`Umpire: ${umpireNames[0]}`);
                        } else if (umpireNames.length > 1) {
                          secondaryParts.push(`Umpires: ${umpireNames.join(', ')}`);
                        } else {
                          secondaryParts.push('Umpire: Unassigned');
                        }

                        const expanded = expandedGameIds.has(assignment.gameId);

                        return (
                          <Box
                            key={assignment.gameId}
                            sx={{
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1,
                              }}
                            >
                              <Checkbox
                                checked={selectedGameIds.has(assignment.gameId)}
                                onChange={() => onToggleSelection(assignment.gameId)}
                              />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                  {title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {secondaryParts.join(' • ')}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                aria-label={expanded ? 'Collapse details' : 'Expand details'}
                                onClick={() => toggleExpanded(assignment.gameId)}
                              >
                                {expanded ? (
                                  <ExpandLess fontSize="small" />
                                ) : (
                                  <ExpandMore fontSize="small" />
                                )}
                              </IconButton>
                            </Box>

                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Box sx={{ px: 2, pb: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Game ID: {assignment.gameId}
                                </Typography>
                                {game && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    Home Team Season ID: {game.homeTeamSeasonId} • Visitor Team
                                    Season ID: {game.visitorTeamSeasonId}
                                  </Typography>
                                )}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Start (UTC): {assignment.startTime} • End (UTC):{' '}
                                  {assignment.endTime}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Field ID: {assignment.fieldId} • Umpire IDs:{' '}
                                  {assignment.umpireIds.length
                                    ? assignment.umpireIds.join(', ')
                                    : 'None'}
                                </Typography>
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
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

      <Dialog open={specPreviewOpen} onClose={onCloseSpecPreview} fullWidth maxWidth="md">
        <DialogTitle>Scheduler Problem Spec Preview</DialogTitle>
        <DialogContent dividers>
          {specPreview ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Loaded {specPreview.games.length} game(s).
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  overflowX: 'auto',
                  fontSize: 12,
                  lineHeight: 1.4,
                  maxHeight: 520,
                }}
              >
                {JSON.stringify(specPreview, null, 2)}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No preview loaded.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseSpecPreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
