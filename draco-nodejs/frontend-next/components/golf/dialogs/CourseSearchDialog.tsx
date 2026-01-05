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
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import type { ExternalCourseSearchResultType } from '@draco/shared-schemas';
import { useExternalCourseSearch } from '../../../hooks/useExternalCourseSearch';
import { useGolfCourses } from '../../../hooks/useGolfCourses';

interface CourseSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCourse: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  accountId: string;
  title?: string;
  selectButtonText?: string;
}

export const CourseSearchDialog: React.FC<CourseSearchDialogProps> = ({
  open,
  onClose,
  onSelectCourse,
  accountId,
  title = 'Search Courses',
  selectButtonText = 'Select Course',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ExternalCourseSearchResultType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<ExternalCourseSearchResultType | null>(null);
  const [saving, setSaving] = useState(false);

  const { search, loading } = useExternalCourseSearch(accountId);
  const { importExternalCourse } = useGolfCourses(accountId);

  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    setError(null);
    setResults([]);
    setSelectedCourse(null);

    const searchResult = await search({ query: searchQuery });

    if (searchResult.success) {
      setResults(searchResult.data);
      if (searchResult.data.length === 0) {
        setError('No courses found matching your search');
      }
    } else {
      setError(searchResult.error);
    }
  }, [search, searchQuery]);

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
    setSaving(false);
    onClose();
  }, [onClose]);

  const handleSelectCourse = useCallback(async () => {
    if (!selectedCourse) return;

    setError(null);
    setSaving(true);

    try {
      const importResult = await importExternalCourse(selectedCourse.externalId);

      if (!importResult.success) {
        setError(importResult.error ?? 'Failed to import course');
        return;
      }

      const courseId = importResult.data.id;
      const result = await onSelectCourse(courseId);

      if (result.success) {
        handleClose();
      } else {
        setError(result.error ?? 'Failed to select course');
      }
    } finally {
      setSaving(false);
    }
  }, [selectedCourse, importExternalCourse, onSelectCourse, handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="course-search-dialog-title"
    >
      <DialogTitle id="course-search-dialog-title" sx={{ pr: 6 }}>
        {title}
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
            Search our database of 30,000+ golf courses worldwide.
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
                    key={course.externalId}
                    selected={selectedCourse?.externalId === course.externalId}
                    onClick={() => setSelectedCourse(course)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      border: '1px solid',
                      borderColor:
                        selectedCourse?.externalId === course.externalId
                          ? 'primary.main'
                          : 'transparent',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={500}>
                          {course.name}
                        </Typography>
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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSelectCourse}
          disabled={!selectedCourse || saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Selecting...' : selectButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseSearchDialog;
