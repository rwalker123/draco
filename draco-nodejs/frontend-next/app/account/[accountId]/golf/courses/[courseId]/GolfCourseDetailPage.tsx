'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type { GolfCourseWithTeesType } from '@draco/shared-schemas';
import { getGolfCourse } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import { CourseDetailView } from '../../../../../../components/golf/courses';
import { useApiClient } from '../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../utils/apiResult';

const GolfCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const accountIdParam = params?.accountId;
  const courseIdParam = params?.courseId;

  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const courseId = Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;
  const apiClient = useApiClient();

  const [course, setCourse] = useState<GolfCourseWithTeesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId || !courseId) return;

    const controller = new AbortController();

    const loadCourse = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getGolfCourse({
          client: apiClient,
          path: { accountId, courseId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to load course');
        setCourse(data as GolfCourseWithTeesType);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadCourse();

    return () => {
      controller.abort();
    };
  }, [accountId, courseId, apiClient]);

  const handleRetry = async () => {
    if (!accountId || !courseId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getGolfCourse({
        client: apiClient,
        path: { accountId, courseId },
        throwOnError: false,
      });
      const data = unwrapApiResult(result, 'Failed to load course');
      setCourse(data as GolfCourseWithTeesType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/account/${accountId}/golf/courses`);
  };

  if (!accountId || !courseId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">Course information could not be determined.</Alert>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box textAlign="center">
          <Typography
            variant="h4"
            component="h1"
            color="text.primary"
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            {course?.name ?? 'Course Details'}
          </Typography>
          {course && (
            <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.85 }}>
              {[course.city, course.state].filter(Boolean).join(', ') ||
                'View course scorecard and tee information'}
            </Typography>
          )}
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack} variant="outlined" size="small">
            Back to Courses
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : course ? (
          <CourseDetailView course={course} showEditControls={false} />
        ) : null}
      </Container>
    </main>
  );
};

export default GolfCourseDetailPage;
