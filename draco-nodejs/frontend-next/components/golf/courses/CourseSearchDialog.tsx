'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CloudDownload as ImportIcon,
  Star as CustomIcon,
} from '@mui/icons-material';
import type { GolfLeagueCourseType, GolfCourseWithTeesType } from '@draco/shared-schemas';
import { useExternalCourseSearch } from '../../../hooks/useExternalCourseSearch';

interface CourseSearchResult {
  externalId: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  numberOfHoles: number;
  isCustom: boolean;
  courseId?: string;
}

interface CourseSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCourse: (
    course: CourseSearchResult,
  ) => Promise<{ success: boolean; data?: GolfCourseWithTeesType; error?: string }>;
  onCreateManually?: () => void;
  accountId: string;
  leagueCourses: GolfLeagueCourseType[];
}

export const CourseSearchDialog: React.FC<CourseSearchDialogProps> = ({
  open,
  onClose,
  onSelectCourse,
  onCreateManually,
  accountId,
  leagueCourses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CourseSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchResult | null>(null);
  const [importing, setImporting] = useState(false);

  const { search, loading } = useExternalCourseSearch(accountId);

  const isLeagueContext = leagueCourses.length > 0;

  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    setError(null);
    setResults([]);
    setSelectedCourse(null);

    const searchResult = await search({
      query: searchQuery,
      excludeLeague: isLeagueContext,
    });

    if (searchResult.success) {
      const mappedResults: CourseSearchResult[] = searchResult.data.map((course) => ({
        externalId: course.externalId,
        name: course.name,
        city: course.city,
        state: course.state,
        country: course.country,
        numberOfHoles: course.numberOfHoles,
        isCustom: course.externalId === '',
        courseId: course.courseId,
      }));

      setResults(mappedResults);

      if (mappedResults.length === 0) {
        setError('No courses found matching your search');
      }
    } else {
      setError(searchResult.error);
    }
  }, [search, searchQuery, isLeagueContext]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && searchQuery.length >= 2) {
        handleSearch();
      }
    },
    [handleSearch, searchQuery],
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setResults([]);
    setError(null);
    setSelectedCourse(null);
    setImporting(false);
    onClose();
  }, [onClose]);

  const handleSelectCourse = useCallback(async () => {
    if (!selectedCourse) return;

    setError(null);
    setImporting(true);

    try {
      const result = await onSelectCourse(selectedCourse);

      if (result.success) {
        handleClose();
      } else {
        setError(result.error ?? 'Failed to add course');
      }
    } finally {
      setImporting(false);
    }
  }, [selectedCourse, onSelectCourse, handleClose]);

  const handleCreateManually = useCallback(() => {
    handleClose();
    onCreateManually?.();
  }, [handleClose, onCreateManually]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="course-search-dialog-title"
    >
      <DialogTitle id="course-search-dialog-title" sx={{ pr: 6 }}>
        Find a Golf Course
        <IconButton
          aria-label="close"
          onClick={handleClose}
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
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Search our database of 30,000+ golf courses worldwide. Courses already in your league
            will be shown first.
          </Typography>

          <TextField
            label="Search courses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            placeholder="Enter course or club name (e.g., Pebble Beach, Augusta National)"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      disabled={loading || searchQuery.length < 2}
                      startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                      size="small"
                    >
                      Search
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Divider />

          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {results.length > 0 && (
              <List disablePadding>
                {results.map((course) => (
                  <ListItemButton
                    key={course.isCustom ? `custom-${course.courseId}` : course.externalId}
                    selected={
                      course.isCustom
                        ? selectedCourse?.courseId === course.courseId
                        : selectedCourse?.externalId === course.externalId
                    }
                    onClick={() => setSelectedCourse(course)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      border: '1px solid',
                      borderColor: (
                        course.isCustom
                          ? selectedCourse?.courseId === course.courseId
                          : selectedCourse?.externalId === course.externalId
                      )
                        ? 'primary.main'
                        : 'transparent',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={500}>
                            {course.name}
                          </Typography>
                          {course.isCustom ? (
                            <Chip
                              icon={<CustomIcon sx={{ fontSize: 14 }} />}
                              label="Custom"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          ) : (
                            <Chip
                              icon={<ImportIcon sx={{ fontSize: 14 }} />}
                              label="Import"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {[course.city, course.state, course.country].filter(Boolean).join(', ') ||
                            'Location not available'}
                          {' · '}
                          {course.numberOfHoles} holes
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
            {results.length === 0 && !error && !loading && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Enter a course or club name and press Search to find courses.
              </Typography>
            )}
          </Box>

          {onCreateManually && (
            <>
              <Divider />
              <Box sx={{ textAlign: 'center' }}>
                <Button variant="text" size="small" onClick={handleCreateManually}>
                  Can&apos;t find your course? Create it manually
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSelectCourse}
          disabled={!selectedCourse || importing}
          startIcon={importing ? <CircularProgress size={16} /> : null}
        >
          {importing
            ? 'Adding...'
            : selectedCourse?.isCustom
              ? 'Add to League'
              : 'Import & Add to League'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseSearchDialog;
