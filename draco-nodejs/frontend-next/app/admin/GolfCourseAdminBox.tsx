'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useApiClient } from '@/hooks/useApiClient';
import { fetchAdminGolfCourseCount } from '@/services/adminGolfCourseService';

const GolfCourseAdminBox: React.FC = () => {
  const router = useRouter();
  const apiClient = useApiClient();
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourseCount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const count = await fetchAdminGolfCourseCount(apiClient);
      setCourseCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load course count');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    void loadCourseCount();
  }, [loadCourseCount]);

  const handleManageCourses = () => {
    router.push('/admin/golf/courses');
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <GolfCourseIcon fontSize="small" />
        <Typography variant="h6">Golf Course Administration</Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Global administrators can create and manage golf courses from scratch. Regular users can
        only search for existing courses.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Loading course count...
          </Typography>
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : (
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
          {courseCount} {courseCount === 1 ? 'course' : 'courses'} in the system
        </Typography>
      )}

      <Button
        variant="contained"
        endIcon={<ArrowForwardIcon />}
        onClick={handleManageCourses}
        size="small"
      >
        Manage Courses
      </Button>
    </Paper>
  );
};

export default GolfCourseAdminBox;
