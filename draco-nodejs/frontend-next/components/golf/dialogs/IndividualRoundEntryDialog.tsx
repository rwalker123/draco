'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Close as CloseIcon, GolfCourse as GolfCourseIcon } from '@mui/icons-material';
import type { GolfCourseSlimType, GolfCourseTeeType } from '@draco/shared-schemas';
import type { CreateGolfScore, GolfScoreWithDetails } from '@draco/shared-api-client';
import { useGolfCourses } from '../../../hooks/useGolfCourses';
import { useIndividualGolfAccountService } from '../../../hooks/useIndividualGolfAccountService';
import { HoleScoreGrid } from '../../schedule/dialogs/golf-score-entry/HoleScoreGrid';
import { CourseSearchDialog } from './CourseSearchDialog';

export interface IndividualRoundEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (score: GolfScoreWithDetails) => void;
  onError?: (error: string) => void;
  accountId: string;
  homeCourse?: GolfCourseSlimType | null;
  editScore?: GolfScoreWithDetails;
}

export const IndividualRoundEntryDialog: React.FC<IndividualRoundEntryDialogProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
  accountId,
  homeCourse,
  editScore,
}) => {
  const { getCourse } = useGolfCourses(accountId);
  const { createScore, updateScore } = useIndividualGolfAccountService();
  const isEditing = !!editScore;

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);
  const [tees, setTees] = useState<GolfCourseTeeType[]>([]);
  const [selectedTeeId, setSelectedTeeId] = useState<string>('');
  const [datePlayed, setDatePlayed] = useState<string>(new Date().toISOString().split('T')[0]);
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18);
  const [totalsOnly, setTotalsOnly] = useState(true);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [holeScores, setHoleScores] = useState<number[]>([]);

  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourseTees = useCallback(
    async (courseId: string, courseName?: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getCourse(courseId);
        if (result.success && result.data.tees) {
          setTees(result.data.tees);
          setSelectedCourseId(courseId);
          setSelectedCourseName(courseName ?? result.data.name);
          if (result.data.tees.length > 0) {
            setSelectedTeeId(result.data.tees[0].id);
          }
        } else if (!result.success) {
          setError(result.error);
        }
      } finally {
        setLoading(false);
      }
    },
    [getCourse],
  );

  useEffect(() => {
    if (open && !selectedCourseId) {
      if (editScore) {
        loadCourseTees(editScore.courseId, editScore.courseName ?? undefined);
      } else if (homeCourse) {
        loadCourseTees(homeCourse.id, homeCourse.name);
      }
    }
  }, [open, homeCourse, editScore, selectedCourseId, loadCourseTees]);

  useEffect(() => {
    if (!open) {
      setSelectedCourseId(null);
      setSelectedCourseName(null);
      setTees([]);
      setSelectedTeeId('');
      setDatePlayed(new Date().toISOString().split('T')[0]);
      setNumberOfHoles(18);
      setTotalsOnly(true);
      setTotalScore(null);
      setHoleScores([]);
      setError(null);
    } else if (editScore) {
      setDatePlayed(editScore.datePlayed.split('T')[0]);
      setNumberOfHoles(editScore.holesPlayed as 9 | 18);
      setTotalsOnly(editScore.totalsOnly ?? true);
      setTotalScore(editScore.totalScore);
      setHoleScores(editScore.holeScores ?? []);
      if (editScore.teeId) {
        setSelectedTeeId(editScore.teeId);
      }
    }
  }, [open, editScore]);

  const handleCourseSearchSelect = useCallback(
    async (courseId: string): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      try {
        const result = await getCourse(courseId);
        if (result.success) {
          setTees(result.data.tees ?? []);
          setSelectedCourseId(courseId);
          setSelectedCourseName(result.data.name);
          if (result.data.tees && result.data.tees.length > 0) {
            setSelectedTeeId(result.data.tees[0].id);
          }
          return { success: true };
        }
        return { success: false, error: result.error };
      } finally {
        setLoading(false);
      }
    },
    [getCourse],
  );

  const handleHoleScoresChange = useCallback((scores: number[]) => {
    setHoleScores(scores);
  }, []);

  const calculatedTotal = useMemo(() => {
    if (totalsOnly) return totalScore ?? 0;
    return holeScores.reduce((sum, score) => sum + (score || 0), 0);
  }, [totalsOnly, totalScore, holeScores]);

  const canSave = useMemo(() => {
    if (!selectedCourseId) return false;
    if (!selectedTeeId) return false;
    if (!datePlayed) return false;
    if (totalsOnly) {
      return totalScore !== null && totalScore >= 18 && totalScore <= 200;
    }
    const validHoles = holeScores.filter((s) => s > 0).length;
    return validHoles >= numberOfHoles;
  }, [
    selectedCourseId,
    selectedTeeId,
    datePlayed,
    totalsOnly,
    totalScore,
    holeScores,
    numberOfHoles,
  ]);

  const handleSave = useCallback(async () => {
    if (!selectedCourseId || !selectedTeeId) return;

    setSaving(true);
    setError(null);

    try {
      const scoreData: CreateGolfScore = {
        courseId: selectedCourseId,
        teeId: selectedTeeId,
        datePlayed,
        holesPlayed: numberOfHoles,
        totalsOnly,
        totalScore: totalsOnly ? (totalScore ?? 0) : undefined,
        holeScores: totalsOnly ? undefined : holeScores.slice(0, numberOfHoles),
      };

      let result;
      if (isEditing && editScore) {
        result = await updateScore(accountId, editScore.id, scoreData);
      } else {
        result = await createScore(accountId, scoreData);
      }

      if (result.success) {
        onSuccess?.(result.data);
        onClose();
      } else {
        setError(result.error);
        onError?.(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save round';
      setError(message);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  }, [
    selectedCourseId,
    selectedTeeId,
    datePlayed,
    numberOfHoles,
    totalsOnly,
    totalScore,
    holeScores,
    createScore,
    updateScore,
    isEditing,
    editScore,
    accountId,
    onSuccess,
    onClose,
    onError,
  ]);

  const todayString = new Date().toISOString().split('T')[0];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="round-entry-dialog-title"
      >
        <DialogTitle id="round-entry-dialog-title" sx={{ pr: 6 }}>
          {isEditing ? 'Edit Round' : 'Enter a Round'}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Course
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <GolfCourseIcon color="action" />
                  <Box sx={{ flex: 1 }}>
                    {selectedCourseName ? (
                      <Typography variant="body1">{selectedCourseName}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No course selected
                      </Typography>
                    )}
                  </Box>
                  <Button variant="outlined" size="small" onClick={() => setCourseSearchOpen(true)}>
                    {selectedCourseId ? 'Change' : 'Select Course'}
                  </Button>
                </Box>
              </Box>

              {tees.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Tee</InputLabel>
                  <Select
                    value={selectedTeeId}
                    onChange={(e) => setSelectedTeeId(e.target.value)}
                    label="Tee"
                  >
                    {tees.map((tee) => (
                      <MenuItem key={tee.id} value={tee.id}>
                        {tee.teeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="Date Played"
                type="date"
                value={datePlayed}
                onChange={(e) => setDatePlayed(e.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: todayString },
                }}
                fullWidth
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Holes Played
                </Typography>
                <ToggleButtonGroup
                  value={numberOfHoles}
                  exclusive
                  onChange={(_, value) => value && setNumberOfHoles(value)}
                  aria-label="holes played"
                >
                  <ToggleButton value={9} aria-label="9 holes">
                    9 Holes
                  </ToggleButton>
                  <ToggleButton value={18} aria-label="18 holes">
                    18 Holes
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={!totalsOnly}
                    onChange={(e) => setTotalsOnly(!e.target.checked)}
                  />
                }
                label="Enter hole-by-hole scores"
              />

              {totalsOnly ? (
                <TextField
                  label="Total Score"
                  type="number"
                  value={totalScore ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTotalScore(val === '' ? null : parseInt(val, 10));
                  }}
                  slotProps={{
                    htmlInput: { min: 18, max: 200 },
                  }}
                  fullWidth
                  helperText="Enter your total score (18-200)"
                />
              ) : (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Hole Scores
                  </Typography>
                  <HoleScoreGrid
                    holeScores={holeScores}
                    onChange={handleHoleScoresChange}
                    numberOfHoles={numberOfHoles}
                    disabled={false}
                  />
                </Box>
              )}

              {calculatedTotal > 0 && (
                <Typography variant="h6" textAlign="right">
                  Total: {calculatedTotal}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!canSave || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Round' : 'Save Round'}
          </Button>
        </DialogActions>
      </Dialog>

      <CourseSearchDialog
        open={courseSearchOpen}
        onClose={() => setCourseSearchOpen(false)}
        onSelectCourse={handleCourseSearchSelect}
        accountId={accountId}
        title="Select Course"
        selectButtonText="Select Course"
      />
    </>
  );
};

export default IndividualRoundEntryDialog;
