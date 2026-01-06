'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type { GolfCourseWithTeesType } from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import { CourseDetailView } from '../../../../../../components/golf/courses';
import { useGolfCourses } from '../../../../../../hooks/useGolfCourses';

const GolfCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const accountIdParam = params?.accountId;
  const courseIdParam = params?.courseId;

  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const courseId = Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;

  const { getCourse } = useGolfCourses(accountId || '');

  const [course, setCourse] = useState<GolfCourseWithTeesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    if (!accountId || !courseId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getCourse(courseId);

      if (result.success) {
        setCourse(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [accountId, courseId, getCourse]);

  useEffect(() => {
    if (accountId && courseId) {
      loadCourse();
    }
  }, [accountId, courseId, loadCourse]);

  const handleBack = useCallback(() => {
    router.push(`/account/${accountId}/golf/courses`);
  }, [accountId, router]);

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
              <Button color="inherit" size="small" onClick={loadCourse}>
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
