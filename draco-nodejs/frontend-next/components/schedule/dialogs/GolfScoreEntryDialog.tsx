'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { ScoreEntryDialogProps } from '../types/sportAdapter';
import type {
  GolfRosterEntryType,
  GolfSubstituteType,
  SubmitMatchResultsType,
  PlayerMatchScoreType,
  GolfCourseTeeType,
  GolfScoreWithDetailsType,
} from '@draco/shared-schemas';
import type { BatchCourseHandicapResponse } from '@draco/shared-api-client';
import { useGolfScores } from '@/hooks/useGolfScores';
import { useGolfRosters } from '@/hooks/useGolfRosters';
import { useGolfCourses } from '@/hooks/useGolfCourses';
import { TeamScoresSection } from './golf-score-entry/TeamScoresSection';
import type { PlayerScoreData } from './golf-score-entry/PlayerScoreRow';
import { updateGolfMatch } from '@draco/shared-api-client';
import type { UpdateGolfMatch } from '@draco/shared-api-client';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { GameStatus } from '@/types/schedule';
import { useGolfLeagueSetup } from '@/hooks/useGolfLeagueSetup';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationSnackbar from '../../common/NotificationSnackbar';

const MATCH_STATUS_OPTIONS = [
  { value: 0, label: 'Scheduled' },
  { value: 1, label: 'Completed' },
  { value: 2, label: 'Rainout' },
  { value: 3, label: 'Postponed' },
  { value: 4, label: 'Forfeit' },
];

function getGameStatusText(status: number): string {
  switch (status) {
    case 0:
      return 'Scheduled';
    case 1:
      return 'Completed';
    case 2:
      return 'Rainout';
    case 3:
      return 'Postponed';
    case 4:
      return 'Forfeit';
    default:
      return 'Unknown';
  }
}

function getGameStatusShortText(status: number): string {
  switch (status) {
    case 0:
      return 'Sched';
    case 1:
      return 'Final';
    case 2:
      return 'Rain';
    case 3:
      return 'Ppd';
    case 4:
      return 'Forf';
    default:
      return '?';
  }
}

const GolfScoreEntryDialog: React.FC<ScoreEntryDialogProps> = ({
  open,
  accountId,
  seasonId,
  selectedGame,
  timeZone,
  onClose,
  onSuccess,
  onError,
  getTeamName,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const apiClient = useApiClient();
  const scoreService = useGolfScores(accountId);
  const rosterService = useGolfRosters(accountId);
  const courseService = useGolfCourses(accountId);

  const leagueSeasonId = selectedGame?.season.id;
  const { setup: leagueSetup } = useGolfLeagueSetup(accountId, seasonId, leagueSeasonId);
  const teamSize = leagueSetup?.teamSize ?? 2;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();

  const [team1Roster, setTeam1Roster] = useState<GolfRosterEntryType[]>([]);
  const [team2Roster, setTeam2Roster] = useState<GolfRosterEntryType[]>([]);
  const [substitutes, setSubstitutes] = useState<GolfSubstituteType[]>([]);
  const [courseTees, setCourseTees] = useState<GolfCourseTeeType[]>([]);

  const [matchStatus, setMatchStatus] = useState<number>(0);
  const [selectedTeeId, setSelectedTeeId] = useState<string>('');
  const [showHoleByHole, setShowHoleByHole] = useState(false);
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18);

  const [team1Scores, setTeam1Scores] = useState<Record<string, PlayerScoreData>>({});
  const [team2Scores, setTeam2Scores] = useState<Record<string, PlayerScoreData>>({});
  const [courseHandicapData, setCourseHandicapData] = useState<BatchCourseHandicapResponse | null>(
    null,
  );
  const [existingScoresData, setExistingScoresData] = useState<GolfScoreWithDetailsType[]>([]);
  const [courseParData, setCourseParData] = useState<{
    mensPar: number[];
    mensHandicap: number[];
    womansPar: number[];
    womansHandicap: number[];
  } | null>(null);

  useEffect(() => {
    if (!open || !selectedGame) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      hideNotification();

      try {
        if (!seasonId) {
          showNotification('Season ID is required', 'error');
          return;
        }
        const [roster1Result, roster2Result, subsResult, scoresResult] = await Promise.all([
          rosterService.getTeamRoster(seasonId, selectedGame.homeTeamId, controller.signal),
          rosterService.getTeamRoster(seasonId, selectedGame.visitorTeamId, controller.signal),
          rosterService.listSubstitutesForLeague(
            seasonId,
            selectedGame.season.id,
            controller.signal,
          ),
          scoreService.getMatchScores(selectedGame.id, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        if (!roster1Result.success) {
          showNotification(roster1Result.error, 'error');
          return;
        }
        if (!roster2Result.success) {
          showNotification(roster2Result.error, 'error');
          return;
        }
        if (!subsResult.success) {
          showNotification(subsResult.error, 'error');
          return;
        }
        if (!scoresResult.success) {
          showNotification(scoresResult.error, 'error');
          return;
        }

        setTeam1Roster(roster1Result.data);
        setTeam2Roster(roster2Result.data);
        setSubstitutes(subsResult.data);
        setMatchStatus(selectedGame.gameStatus);

        const loadedExistingScores = scoresResult.data;
        setExistingScoresData(loadedExistingScores);

        if (selectedGame.fieldId) {
          const teesResult = await courseService.getCourse(selectedGame.fieldId, controller.signal);
          if (controller.signal.aborted) return;
          if (teesResult.success) {
            if (teesResult.data.tees) {
              setCourseTees(teesResult.data.tees);
              if (selectedGame.teeId) {
                setSelectedTeeId(selectedGame.teeId);
              }
            }
            setCourseParData({
              mensPar: teesResult.data.mensPar,
              mensHandicap: teesResult.data.mensHandicap,
              womansPar: teesResult.data.womansPar,
              womansHandicap: teesResult.data.womansHandicap,
            });
          }
        }

        if (controller.signal.aborted) return;

        const team1ExistingScores = loadedExistingScores.filter((s) =>
          roster1Result.data.some(
            (p) => p.golferId === s.golferId || s.substituteForRosterId === p.id,
          ),
        );
        const team2ExistingScores = loadedExistingScores.filter((s) =>
          roster2Result.data.some(
            (p) => p.golferId === s.golferId || s.substituteForRosterId === p.id,
          ),
        );

        const hasHoleByHoleScores = loadedExistingScores.some((s) => s.totalsOnly === false);
        if (hasHoleByHoleScores) {
          setShowHoleByHole(true);
        }

        const initializeScoresFromRoster = (
          roster: GolfRosterEntryType[],
          existing: GolfScoreWithDetailsType[],
          maxPlayers: number,
        ): Record<string, PlayerScoreData> => {
          const scores: Record<string, PlayerScoreData> = {};
          const hasMoreThanAllowed = roster.length > maxPlayers;

          roster.forEach((player, index) => {
            const existingScore = existing.find(
              (s) => s.golferId === player.golferId || s.substituteForRosterId === player.id,
            );
            const excessRosterAbsent = hasMoreThanAllowed && index >= maxPlayers;
            const hasSub = !!existingScore?.substituteForRosterId;

            scores[player.id] = {
              rosterId: player.id,
              isAbsent: hasSub || (existingScore?.isAbsent ?? excessRosterAbsent),
              isSubstitute: hasSub,
              substituteGolferId: hasSub ? existingScore.golferId : undefined,
              totalsOnly: existingScore?.totalsOnly ?? true,
              totalScore: existingScore?.totalScore ?? 0,
              frontNineScore: existingScore?.frontNineScore ?? 0,
              backNineScore: existingScore?.backNineScore ?? 0,
              holeScores: existingScore?.holeScores ?? [],
              putts: existingScore?.putts ?? [],
              fairways: existingScore?.fairwaysHit ?? [],
            };
          });

          return scores;
        };

        setTeam1Scores(
          initializeScoresFromRoster(roster1Result.data, team1ExistingScores, teamSize),
        );
        setTeam2Scores(
          initializeScoresFromRoster(roster2Result.data, team2ExistingScores, teamSize),
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        showNotification(err instanceof Error ? err.message : 'Failed to load data', 'error');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [
    open,
    selectedGame,
    accountId,
    seasonId,
    rosterService,
    scoreService,
    courseService,
    teamSize,
    hideNotification,
    showNotification,
  ]);

  useEffect(() => {
    if (!open) {
      setTeam1Roster([]);
      setTeam2Roster([]);
      setSubstitutes([]);
      setCourseTees([]);
      setTeam1Scores({});
      setTeam2Scores({});
      setMatchStatus(0);
      setSelectedTeeId('');
      setShowHoleByHole(false);
      hideNotification();
      setCourseHandicapData(null);
      setExistingScoresData([]);
      setCourseParData(null);
    }
  }, [open, hideNotification]);

  const useHandicapScoring = leagueSetup?.useHandicapScoring ?? false;

  useEffect(() => {
    if (!open || !selectedTeeId || !useHandicapScoring) {
      setCourseHandicapData(null);
      return;
    }

    const substituteGolferIds = substitutes.map((s) => s.golferId);
    const allGolferIds = [
      ...team1Roster.map((p) => p.golferId),
      ...team2Roster.map((p) => p.golferId),
      ...substituteGolferIds,
    ];

    if (allGolferIds.length === 0) return;

    const controller = new AbortController();

    const fetchHandicaps = async () => {
      const result = await scoreService.getBatchCourseHandicaps(
        allGolferIds,
        selectedTeeId,
        numberOfHoles,
        controller.signal,
      );

      if (controller.signal.aborted) return;
      if (result.success) {
        setCourseHandicapData(result.data);
      }
    };

    fetchHandicaps();

    return () => {
      controller.abort();
    };
  }, [
    open,
    selectedTeeId,
    numberOfHoles,
    useHandicapScoring,
    team1Roster,
    team2Roster,
    substitutes,
    scoreService,
  ]);

  function buildPlayerScores(
    scores: Record<string, PlayerScoreData>,
    teamSeasonId: string,
  ): PlayerMatchScoreType[] {
    return Object.values(scores).map((score) => {
      const playerScore: PlayerMatchScoreType = {
        teamSeasonId,
        rosterId: score.rosterId,
        isAbsent: score.isAbsent,
        isSubstitute: score.isSubstitute,
        substituteGolferId: score.substituteGolferId,
      };

      const hasSubstitute = score.isSubstitute && !!score.substituteGolferId;
      if (score.totalScore > 0 && (!score.isAbsent || hasSubstitute)) {
        const isTotalsOnly = score.totalsOnly || showHoleByHole === false;
        const isTotalsOnlyEighteen = isTotalsOnly && numberOfHoles >= 18;
        playerScore.score = {
          courseId: selectedGame?.fieldId || '',
          teeId: selectedTeeId,
          datePlayed: selectedGame?.gameDate || new Date().toISOString(),
          holesPlayed: numberOfHoles,
          totalsOnly: isTotalsOnly,
          totalScore: score.totalScore,
          frontNineScore: isTotalsOnlyEighteen ? score.frontNineScore : undefined,
          backNineScore: isTotalsOnlyEighteen ? score.backNineScore : undefined,
          holeScores: isTotalsOnly ? undefined : score.holeScores.filter((s) => s > 0),
          putts: isTotalsOnly
            ? undefined
            : score.putts.some((p) => p !== null)
              ? score.putts
              : undefined,
          fairwaysHit: isTotalsOnly
            ? undefined
            : score.fairways.some((f) => f !== null)
              ? score.fairways
              : undefined,
        };
      }

      return playerScore;
    });
  }

  const handleSave = async () => {
    if (!selectedGame) return;

    if (matchStatus === GameStatus.Completed && !allPlayersAccountedFor) {
      showNotification(
        'Match cannot be marked Complete until all players have scores entered or are marked absent.',
        'error',
      );
      return;
    }

    setSaving(true);
    hideNotification();

    try {
      const team1PlayerScores = buildPlayerScores(team1Scores, selectedGame.homeTeamId);
      const team2PlayerScores = buildPlayerScores(team2Scores, selectedGame.visitorTeamId);

      const allScores = [...team1PlayerScores, ...team2PlayerScores];

      let updatedMatch = null;

      if (allScores.length > 0 && selectedGame.fieldId) {
        const payload: SubmitMatchResultsType = {
          courseId: selectedGame.fieldId,
          teeId: selectedTeeId || undefined,
          totalsOnly: !showHoleByHole,
          scores: allScores,
        };
        const result = await scoreService.submitMatchResults(selectedGame.id, payload);
        if (!result.success) {
          throw new Error(result.error);
        }
        updatedMatch = result.data;
      }

      if (matchStatus !== selectedGame.gameStatus) {
        const updateData: UpdateGolfMatch = {
          matchStatus,
        };
        const matchResult = await updateGolfMatch({
          client: apiClient,
          path: { accountId, matchId: selectedGame.id },
          body: updateData,
          throwOnError: false,
        });
        updatedMatch = unwrapApiResult(matchResult, 'Failed to update match status');
      }

      const effectiveStatus = updatedMatch?.matchStatus ?? matchStatus;
      const updatedGame = {
        ...selectedGame,
        homeScore: updatedMatch?.team1TotalScore ?? selectedGame.homeScore,
        visitorScore: updatedMatch?.team2TotalScore ?? selectedGame.visitorScore,
        gameStatus: effectiveStatus,
        gameStatusText: getGameStatusText(effectiveStatus),
        gameStatusShortText: getGameStatusShortText(effectiveStatus),
        teeId: selectedTeeId || selectedGame.teeId,
        golfExtras: {
          ...selectedGame.golfExtras,
          homePoints: updatedMatch?.team1Points ?? selectedGame.golfExtras?.homePoints,
          visitorPoints: updatedMatch?.team2Points ?? selectedGame.golfExtras?.visitorPoints,
          homeNetScore: updatedMatch?.team1NetScore ?? selectedGame.golfExtras?.homeNetScore,
          visitorNetScore: updatedMatch?.team2NetScore ?? selectedGame.golfExtras?.visitorNetScore,
        },
      };

      onSuccess?.({ game: updatedGame, message: 'Scores saved successfully' });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save scores';
      showNotification(message, 'error');
      onError?.(message);
    } finally {
      setSaving(false);
    }
  };

  const allTeam1AccountedFor =
    Object.keys(team1Scores).length > 0 &&
    Object.values(team1Scores).every((s) => s.isAbsent || s.totalScore > 0);
  const allTeam2AccountedFor =
    Object.keys(team2Scores).length > 0 &&
    Object.values(team2Scores).every((s) => s.isAbsent || s.totalScore > 0);
  const allPlayersAccountedFor = allTeam1AccountedFor && allTeam2AccountedFor;

  const courseHandicapMap: Record<string, number | null> = {};
  for (const score of existingScoresData) {
    if (score.golferId && score.courseHandicap !== undefined) {
      courseHandicapMap[score.golferId] = score.courseHandicap;
    }
  }
  if (courseHandicapData?.players) {
    for (const player of courseHandicapData.players) {
      courseHandicapMap[player.golferId] = player.courseHandicap;
    }
  }

  const genderMap: Record<string, 'M' | 'F'> = {};
  if (courseHandicapData?.players) {
    for (const player of courseHandicapData.players) {
      genderMap[player.golferId] = player.gender;
    }
  }

  if (!selectedGame) return null;

  const team1Name = getTeamName(selectedGame.homeTeamId);
  const team2Name = getTeamName(selectedGame.visitorTeamId);
  const matchDate = new Date(selectedGame.gameDate).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      data-testid="score-entry-dialog"
    >
      <DialogTitle>
        <Box>
          <Typography variant="h5" component="div" gutterBottom>
            Enter Golf Scores
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {team1Name} vs {team2Name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {matchDate}
            {selectedGame.field && ` - ${selectedGame.field.name}`}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                mb: 3,
                p: 2,
                backgroundColor: theme.palette.action.hover,
                borderRadius: 1,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Match Status</InputLabel>
                <Select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value as number)}
                  label="Match Status"
                >
                  {MATCH_STATUS_OPTIONS.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={option.value === GameStatus.Completed && !allPlayersAccountedFor}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {courseTees.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Tee</InputLabel>
                  <Select
                    value={selectedTeeId}
                    onChange={(e) => setSelectedTeeId(e.target.value)}
                    label="Tee"
                  >
                    {courseTees.map((tee) => (
                      <MenuItem key={tee.id} value={tee.id}>
                        {tee.teeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Holes</InputLabel>
                <Select
                  value={numberOfHoles}
                  onChange={(e) => setNumberOfHoles(e.target.value as 9 | 18)}
                  label="Holes"
                >
                  <MenuItem value={9}>9 Holes</MenuItem>
                  <MenuItem value={18}>18 Holes</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={showHoleByHole}
                    onChange={(e) => setShowHoleByHole(e.target.checked)}
                  />
                }
                label="Hole-by-hole entry"
                sx={{ ml: 'auto' }}
              />
            </Box>

            {!selectedGame.fieldId && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No course is assigned to this match. Please edit the match to assign a course before
                entering scores.
              </Alert>
            )}

            {selectedGame.fieldId && !selectedTeeId && courseTees.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No tees are configured for this course. Please add tees to the course before
                entering scores.
              </Alert>
            )}

            {selectedGame.fieldId && !selectedTeeId && courseTees.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please select a tee before entering scores.
              </Alert>
            )}

            <TeamScoresSection
              teamName={team1Name}
              teamId={selectedGame.homeTeamId}
              players={team1Roster}
              substitutes={substitutes}
              scores={team1Scores}
              onScoreChange={(rosterId, data) =>
                setTeam1Scores((prev) => ({ ...prev, [rosterId]: data }))
              }
              numberOfHoles={numberOfHoles}
              showHoleByHole={showHoleByHole}
              disabled={!selectedGame.fieldId || !selectedTeeId}
              defaultExpanded={true}
              teamSize={teamSize}
              courseHandicapMap={courseHandicapMap}
              showHandicaps={useHandicapScoring}
              courseParData={courseParData}
              genderMap={genderMap}
            />

            <TeamScoresSection
              teamName={team2Name}
              teamId={selectedGame.visitorTeamId}
              players={team2Roster}
              substitutes={substitutes}
              scores={team2Scores}
              onScoreChange={(rosterId, data) =>
                setTeam2Scores((prev) => ({ ...prev, [rosterId]: data }))
              }
              numberOfHoles={numberOfHoles}
              showHoleByHole={showHoleByHole}
              disabled={!selectedGame.fieldId || !selectedTeeId}
              defaultExpanded={true}
              teamSize={teamSize}
              courseHandicapMap={courseHandicapMap}
              showHandicaps={useHandicapScoring}
              courseParData={courseParData}
              genderMap={genderMap}
            />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? 'Saving...' : 'Save Scores'}
        </Button>
      </DialogActions>
      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </Dialog>
  );
};

export default GolfScoreEntryDialog;
