'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const apiClient = useApiClient();
  const scoreService = useGolfScores(accountId);
  const rosterService = useGolfRosters(accountId);
  const courseService = useGolfCourses(accountId);

  const leagueSeasonId = selectedGame?.season.id;
  const { setup: leagueSetup } = useGolfLeagueSetup(accountId, seasonId, leagueSeasonId);
  const teamSize = leagueSetup?.teamSize ?? 2;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [courseParData, setCourseParData] = useState<{
    mensPar: number[];
    mensHandicap: number[];
    womansPar: number[];
    womansHandicap: number[];
  } | null>(null);

  const initializeScoresFromRoster = useCallback(
    (
      roster: GolfRosterEntryType[],
      existing: GolfScoreWithDetailsType[],
      maxPlayers: number,
    ): Record<string, PlayerScoreData> => {
      const scores: Record<string, PlayerScoreData> = {};
      const hasMoreThanAllowed = roster.length > maxPlayers;

      roster.forEach((player, index) => {
        const existingScore = existing.find((s) => s.golferId === player.golferId);
        const shouldBeAbsent = hasMoreThanAllowed && index >= maxPlayers;

        scores[player.id] = {
          rosterId: player.id,
          isAbsent: existingScore ? false : shouldBeAbsent,
          isSubstitute: false,
          substituteGolferId: undefined,
          totalsOnly: existingScore?.totalsOnly ?? true,
          totalScore: existingScore?.totalScore ?? 0,
          holeScores: existingScore?.holeScores ?? [],
        };
      });

      return scores;
    },
    [],
  );

  useEffect(() => {
    if (!open || !selectedGame) return;

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const seasonId = selectedGame.season.id;
        const [roster1Result, roster2Result, subsResult, scoresResult] = await Promise.all([
          rosterService.getTeamRoster(seasonId, selectedGame.homeTeamId),
          rosterService.getTeamRoster(seasonId, selectedGame.visitorTeamId),
          rosterService.listSubstitutesForSeason(seasonId),
          scoreService.getMatchScores(selectedGame.id),
        ]);

        if (cancelled) return;

        if (!roster1Result.success) {
          setError(roster1Result.error);
          return;
        }
        if (!roster2Result.success) {
          setError(roster2Result.error);
          return;
        }
        if (!subsResult.success) {
          setError(subsResult.error);
          return;
        }
        if (!scoresResult.success) {
          setError(scoresResult.error);
          return;
        }

        setTeam1Roster(roster1Result.data);
        setTeam2Roster(roster2Result.data);
        setSubstitutes(subsResult.data);
        setMatchStatus(selectedGame.gameStatus);

        const existingScoresData = scoresResult.data;

        if (selectedGame.fieldId) {
          const teesResult = await courseService.getCourse(selectedGame.fieldId);
          if (!cancelled && teesResult.success) {
            if (teesResult.data.tees) {
              setCourseTees(teesResult.data.tees);
              if (selectedGame.teeId) {
                setSelectedTeeId(selectedGame.teeId);
              } else if (teesResult.data.tees.length > 0) {
                setSelectedTeeId(teesResult.data.tees[0].id);
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

        if (cancelled) return;

        const team1ExistingScores = existingScoresData.filter((s) =>
          roster1Result.data.some((p) => p.golferId === s.golferId),
        );
        const team2ExistingScores = existingScoresData.filter((s) =>
          roster2Result.data.some((p) => p.golferId === s.golferId),
        );

        const hasHoleByHoleScores = existingScoresData.some((s) => s.totalsOnly === false);
        if (hasHoleByHoleScores) {
          setShowHoleByHole(true);
        }

        setTeam1Scores(
          initializeScoresFromRoster(roster1Result.data, team1ExistingScores, teamSize),
        );
        setTeam2Scores(
          initializeScoresFromRoster(roster2Result.data, team2ExistingScores, teamSize),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    selectedGame,
    accountId,
    rosterService,
    scoreService,
    courseService,
    teamSize,
    initializeScoresFromRoster,
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
      setError(null);
      setCourseHandicapData(null);
      setCourseParData(null);
    }
  }, [open]);

  const useHandicapScoring = leagueSetup?.useHandicapScoring ?? false;

  useEffect(() => {
    if (!open || !selectedTeeId || !useHandicapScoring) {
      setCourseHandicapData(null);
      return;
    }

    const allGolferIds = [
      ...team1Roster.map((p) => p.golferId),
      ...team2Roster.map((p) => p.golferId),
    ];

    if (allGolferIds.length === 0) return;

    let cancelled = false;

    const fetchHandicaps = async () => {
      const result = await scoreService.getBatchCourseHandicaps(
        allGolferIds,
        selectedTeeId,
        numberOfHoles,
      );

      if (!cancelled && result.success) {
        setCourseHandicapData(result.data);
      }
    };

    fetchHandicaps();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    selectedTeeId,
    numberOfHoles,
    useHandicapScoring,
    team1Roster,
    team2Roster,
    scoreService,
  ]);

  const handicapIndexMap = useMemo(() => {
    const map: Record<string, number | null> = {};
    if (courseHandicapData?.players) {
      for (const player of courseHandicapData.players) {
        map[player.golferId] = player.handicapIndex;
      }
    }
    return map;
  }, [courseHandicapData]);

  const buildPlayerScores = useCallback(
    (
      scores: Record<string, PlayerScoreData>,
      teamSeasonId: string,
      roster: GolfRosterEntryType[],
    ): PlayerMatchScoreType[] => {
      const rosterMap = new Map(roster.map((r) => [r.id, r.golferId]));

      return Object.values(scores)
        .filter((score) => !score.isAbsent || score.substituteGolferId)
        .map((score) => {
          const playerScore: PlayerMatchScoreType = {
            teamSeasonId,
            rosterId: score.rosterId,
            isAbsent: score.isAbsent,
            isSubstitute: score.isSubstitute,
            substituteGolferId: score.substituteGolferId,
          };

          if (score.totalScore > 0) {
            const golferId = rosterMap.get(score.rosterId);
            const handicapIndex = golferId ? handicapIndexMap[golferId] : null;

            playerScore.score = {
              courseId: selectedGame?.fieldId || '',
              teeId: selectedTeeId,
              datePlayed: selectedGame?.gameDate || new Date().toISOString(),
              holesPlayed: numberOfHoles,
              totalsOnly: score.totalsOnly || showHoleByHole === false,
              totalScore: score.totalScore,
              holeScores: score.totalsOnly ? undefined : score.holeScores.filter((s) => s > 0),
              startIndex: numberOfHoles === 18 ? handicapIndex : undefined,
              startIndex9:
                numberOfHoles === 9 && handicapIndex !== null ? handicapIndex / 2 : undefined,
            };
          }

          return playerScore;
        });
    },
    [selectedGame, selectedTeeId, numberOfHoles, showHoleByHole, handicapIndexMap],
  );

  const handleSave = async () => {
    if (!selectedGame) return;

    setSaving(true);
    setError(null);

    try {
      const team1PlayerScores = buildPlayerScores(
        team1Scores,
        selectedGame.homeTeamId,
        team1Roster,
      );
      const team2PlayerScores = buildPlayerScores(
        team2Scores,
        selectedGame.visitorTeamId,
        team2Roster,
      );

      const allScores = [...team1PlayerScores, ...team2PlayerScores];

      if (allScores.length > 0 && selectedGame.fieldId) {
        const payload: SubmitMatchResultsType = {
          courseId: selectedGame.fieldId,
          scores: allScores,
        };
        const result = await scoreService.submitMatchResults(selectedGame.id, payload);
        if (!result.success) {
          throw new Error(result.error);
        }
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
        unwrapApiResult(matchResult, 'Failed to update match status');
      }

      const updatedGame = {
        ...selectedGame,
        gameStatus: matchStatus,
        gameStatusText: getGameStatusText(matchStatus),
        gameStatusShortText: getGameStatusShortText(matchStatus),
        teeId: selectedTeeId || selectedGame.teeId,
      };

      onSuccess?.({ game: updatedGame, message: 'Scores saved successfully' });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save scores';
      setError(message);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  };

  const hasScoresToSubmit = useMemo(() => {
    const team1HasScores = Object.values(team1Scores).some((s) => !s.isAbsent && s.totalScore > 0);
    const team2HasScores = Object.values(team2Scores).some((s) => !s.isAbsent && s.totalScore > 0);
    return team1HasScores || team2HasScores;
  }, [team1Scores, team2Scores]);

  const canSave = useMemo(() => {
    if (!selectedGame?.fieldId) return false;
    if (!selectedTeeId) return false;
    if (matchStatus === GameStatus.Completed && !hasScoresToSubmit) return false;
    return true;
  }, [selectedGame, selectedTeeId, matchStatus, hasScoresToSubmit]);

  const courseHandicapMap = useMemo(() => {
    const map: Record<string, number | null> = {};
    if (courseHandicapData?.players) {
      for (const player of courseHandicapData.players) {
        map[player.golferId] = player.courseHandicap;
      }
    }
    return map;
  }, [courseHandicapData]);

  const genderMap = useMemo(() => {
    const map: Record<string, 'M' | 'F'> = {};
    if (courseHandicapData?.players) {
      for (const player of courseHandicapData.players) {
        map[player.golferId] = player.gender;
      }
    }
    return map;
  }, [courseHandicapData]);

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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                mb: 3,
                p: 2,
                backgroundColor: theme.palette.grey[50],
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
                    <MenuItem key={option.value} value={option.value}>
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
          disabled={saving || loading || !canSave}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? 'Saving...' : 'Save Scores'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GolfScoreEntryDialog;
