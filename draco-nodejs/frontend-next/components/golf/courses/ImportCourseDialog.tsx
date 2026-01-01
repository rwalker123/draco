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
import type {
  ExternalCourseSearchResultType,
  ExternalCourseDetailType,
} from '@draco/shared-schemas';
import { useExternalCourseSearch } from '../../../hooks/useExternalCourseSearch';

interface ImportCourseDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (course: ExternalCourseDetailType) => void;
  accountId: string;
}

export const ImportCourseDialog: React.FC<ImportCourseDialogProps> = ({
  open,
  onClose,
  onImport,
  accountId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ExternalCourseSearchResultType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<ExternalCourseSearchResultType | null>(null);

  const { search, getDetails, loading } = useExternalCourseSearch(accountId);

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

  const handleImport = useCallback(async () => {
    if (!selectedCourse) return;

    setError(null);
    const detailResult = await getDetails(selectedCourse.externalId);

    if (detailResult.success) {
      onImport(detailResult.data);
      onClose();
    } else {
      setError(detailResult.error);
    }
  }, [selectedCourse, getDetails, onImport, onClose]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setResults([]);
    setError(null);
    setSelectedCourse(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="import-course-dialog-title"
    >
      <DialogTitle id="import-course-dialog-title" sx={{ pr: 6 }}>
        Import Course from Database
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
            Search our database of 30,000+ golf courses worldwide to import course data including
            par, handicap, and tee information.
          </Typography>

          <TextField
            label="Search courses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            placeholder="Enter course or club name (e.g., Pebble Beach, Augusta National)"
            InputProps={{
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
          onClick={handleImport}
          disabled={!selectedCourse || loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Importing...' : 'Import Selected Course'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportCourseDialog;
