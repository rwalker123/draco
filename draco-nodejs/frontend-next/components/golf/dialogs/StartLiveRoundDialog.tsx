'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  TextField,
} from '@mui/material';
import { Close as CloseIcon, GolfCourse as GolfCourseIcon } from '@mui/icons-material';
import type { GolfCourseSlimType, GolfCourseTeeType } from '@draco/shared-schemas';
import { useGolfCourses } from '../../../hooks/useGolfCourses';
import { CourseSearchDialog } from './CourseSearchDialog';

export interface StartLiveRoundDialogProps {
  open: boolean;
  onClose: () => void;
  onStart: (data: {
    courseId: string;
    teeId: string;
    datePlayed: string;
    startingHole: number;
    holesPlayed: 9 | 18;
  }) => Promise<boolean>;
  accountId: string;
  homeCourse?: GolfCourseSlimType | null;
  isStarting?: boolean;
}

export const StartLiveRoundDialog: React.FC<StartLiveRoundDialogProps> = ({
  open,
  onClose,
  onStart,
  accountId,
  homeCourse,
  isStarting = false,
}) => {
  const { getCourse } = useGolfCourses(accountId);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);
  const [tees, setTees] = useState<GolfCourseTeeType[]>([]);
  const [selectedTeeId, setSelectedTeeId] = useState<string>('');
  const [datePlayed, setDatePlayed] = useState<string>(new Date().toISOString().split('T')[0]);
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18);
  const [startingHole, setStartingHole] = useState<number>(1);

  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    if (open && !selectedCourseId && homeCourse) {
      loadCourseTees(homeCourse.id, homeCourse.name);
    }
  }, [open, homeCourse, selectedCourseId, loadCourseTees]);

  useEffect(() => {
    if (!open) {
      setSelectedCourseId(null);
      setSelectedCourseName(null);
      setTees([]);
      setSelectedTeeId('');
      setDatePlayed(new Date().toISOString().split('T')[0]);
      setNumberOfHoles(18);
      setStartingHole(1);
      setError(null);
    }
  }, [open]);

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

  const canStart = useMemo(() => {
    return selectedCourseId && selectedTeeId && datePlayed;
  }, [selectedCourseId, selectedTeeId, datePlayed]);

  const handleStart = useCallback(async () => {
    if (!selectedCourseId || !selectedTeeId) return;

    setError(null);
    const success = await onStart({
      courseId: selectedCourseId,
      teeId: selectedTeeId,
      datePlayed,
      startingHole,
      holesPlayed: numberOfHoles,
    });

    if (!success) {
      setError('Failed to start live scoring session');
    }
  }, [selectedCourseId, selectedTeeId, datePlayed, startingHole, numberOfHoles, onStart]);

  const todayString = new Date().toISOString().split('T')[0];

  const startingHoleOptions = useMemo(() => {
    const options = [];
    for (let i = 1; i <= numberOfHoles; i++) {
      options.push(i);
    }
    return options;
  }, [numberOfHoles]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="start-live-round-dialog-title"
      >
        <DialogTitle id="start-live-round-dialog-title" sx={{ pr: 6 }}>
          Start Live Round
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
                  Holes to Play
                </Typography>
                <ToggleButtonGroup
                  value={numberOfHoles}
                  exclusive
                  onChange={(_, value) => {
                    if (value) {
                      setNumberOfHoles(value);
                      if (startingHole > value) {
                        setStartingHole(1);
                      }
                    }
                  }}
                  aria-label="holes to play"
                >
                  <ToggleButton value={9} aria-label="9 holes">
                    9 Holes
                  </ToggleButton>
                  <ToggleButton value={18} aria-label="18 holes">
                    18 Holes
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Starting Hole</InputLabel>
                <Select
                  value={startingHole}
                  onChange={(e) => setStartingHole(e.target.value as number)}
                  label="Starting Hole"
                >
                  {startingHoleOptions.map((hole) => (
                    <MenuItem key={hole} value={hole}>
                      Hole {hole}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mt: 2 }}>
                Live scoring allows you to enter scores hole-by-hole in real-time. Others can watch
                your progress live!
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isStarting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStart}
            disabled={!canStart || isStarting}
            startIcon={isStarting ? <CircularProgress size={16} /> : null}
          >
            {isStarting ? 'Starting...' : 'Start Live Round'}
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

export default StartLiveRoundDialog;
