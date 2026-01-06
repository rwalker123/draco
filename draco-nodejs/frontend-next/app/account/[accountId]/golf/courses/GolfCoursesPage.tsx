'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Container, Fab, Snackbar, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type { GolfLeagueCourseType } from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { CourseList, CourseSearchDialog } from '../../../../../components/golf/courses';
import { useGolfCourses } from '../../../../../hooks/useGolfCourses';
import { useRole } from '../../../../../context/RoleContext';

const GolfCoursesPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const { hasPermission } = useRole();

  const canManage = accountId ? hasPermission('account.manage', { accountId }) : false;

  const { listCourses, removeCourseFromLeague, addCourseToLeague, importExternalCourse } =
    useGolfCourses(accountId || '');

  const [courses, setCourses] = useState<GolfLeagueCourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    if (!accountId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await listCourses();

      if (result.success) {
        setCourses(result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [accountId, listCourses]);

  useEffect(() => {
    if (accountId) {
      loadCourses();
    }
  }, [accountId, loadCourses]);

  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const handleSelectCourse = useCallback(
    async (course: { externalId: string; isCustom: boolean; courseId?: string }) => {
      if (course.isCustom && course.courseId) {
        const addResult = await addCourseToLeague(course.courseId);

        if (addResult.success) {
          setSuccessMessage('Course added to league');
          await loadCourses();
          return { success: true };
        } else {
          return { success: false, error: addResult.error };
        }
      }

      const result = await importExternalCourse(course.externalId);

      if (result.success) {
        const addResult = await addCourseToLeague(result.data.id);

        if (addResult.success) {
          setSuccessMessage('Course imported and added to league');
          await loadCourses();
          return { success: true, data: result.data };
        } else {
          return { success: false, error: addResult.error };
        }
      } else {
        return { success: false, error: result.error };
      }
    },
    [importExternalCourse, addCourseToLeague, loadCourses],
  );

  const handleView = useCallback(
    (leagueCourse: GolfLeagueCourseType) => {
      router.push(`/account/${accountId}/golf/courses/${leagueCourse.course.id}`);
    },
    [accountId, router],
  );

  const handleDelete = useCallback(
    async (leagueCourse: GolfLeagueCourseType) => {
      setActionLoading(true);
      const result = await removeCourseFromLeague(leagueCourse.course.id);

      if (result.success) {
        setSuccessMessage('Course removed from league');
        await loadCourses();
      } else {
        setError(result.error);
      }
      setActionLoading(false);
    },
    [removeCourseFromLeague, loadCourses],
  );

  if (!accountId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">Account information could not be determined.</Alert>
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
            Golf Courses
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.85 }}>
            Manage the golf courses available for your league.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <CourseList
            courses={courses}
            loading={actionLoading}
            error={error}
            onRetry={loadCourses}
            onView={handleView}
            onDelete={canManage ? handleDelete : undefined}
            emptyMessage="No courses have been added to this league yet."
            actionsDisabled={actionLoading}
          />
        )}
      </Container>

      {canManage && (
        <Fab
          color="primary"
          aria-label="Find a course"
          onClick={handleOpenSearch}
          disabled={actionLoading}
          sx={{
            position: 'fixed',
            bottom: { xs: 24, md: 32 },
            right: { xs: 24, md: 32 },
            zIndex: (theme) => theme.zIndex.tooltip,
          }}
        >
          <SearchIcon />
        </Fab>
      )}

      <CourseSearchDialog
        open={searchOpen}
        onClose={handleCloseSearch}
        onSelectCourse={handleSelectCourse}
        accountId={accountId}
        leagueCourses={courses}
      />

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default GolfCoursesPage;
