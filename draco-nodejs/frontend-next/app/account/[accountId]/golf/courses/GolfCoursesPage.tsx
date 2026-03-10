'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Container, Fab, Snackbar, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type { GolfLeagueCourseType } from '@draco/shared-schemas';
import { listGolfLeagueCourses } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../../components/admin';
import { CourseList, CourseSearchDialog } from '../../../../../components/golf/courses';
import { useGolfCourses } from '../../../../../hooks/useGolfCourses';
import { useApiClient } from '../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../utils/apiResult';
import { useRole } from '../../../../../context/RoleContext';
import { useNotifications } from '../../../../../hooks/useNotifications';

const GolfCoursesPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const { hasPermission } = useRole();
  const apiClient = useApiClient();

  const canManage = accountId ? hasPermission('account.manage', { accountId }) : false;

  const { removeCourseFromLeague, addCourseToLeague, importExternalCourse } = useGolfCourses(
    accountId || '',
  );

  const [courses, setCourses] = useState<GolfLeagueCourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();

  useEffect(() => {
    if (!accountId) return;

    const controller = new AbortController();

    const loadCourses = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await listGolfLeagueCourses({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to load courses') as GolfLeagueCourseType[];
        setCourses(data);
      } catch {
        if (controller.signal.aborted) return;
        setError('Failed to load courses');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadCourses();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient]);

  const handleRetry = async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listGolfLeagueCourses({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });
      const data = unwrapApiResult(result, 'Failed to load courses') as GolfLeagueCourseType[];
      setCourses(data);
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSearch = () => {
    setSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
  };

  const refreshCourses = async () => {
    if (!accountId) return;
    try {
      const result = await listGolfLeagueCourses({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });
      const data = unwrapApiResult(result, 'Failed to refresh courses') as GolfLeagueCourseType[];
      setCourses(data);
    } catch {
      // Refresh failure is non-critical; the mutation already succeeded
    }
  };

  const handleSelectCourse = async (course: {
    externalId: string;
    isCustom: boolean;
    courseId?: string;
  }) => {
    if (course.isCustom && course.courseId) {
      const addResult = await addCourseToLeague(course.courseId);

      if (addResult.success) {
        showNotification('Course added to league', 'success');
        await refreshCourses();
        return { success: true };
      } else {
        return { success: false, error: addResult.error };
      }
    }

    const result = await importExternalCourse(course.externalId);

    if (result.success) {
      const addResult = await addCourseToLeague(result.data.id);

      if (addResult.success) {
        showNotification('Course imported and added to league', 'success');
        await refreshCourses();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: addResult.error };
      }
    } else {
      return { success: false, error: result.error };
    }
  };

  const handleView = (leagueCourse: GolfLeagueCourseType) => {
    router.push(`/account/${accountId}/golf/courses/${leagueCourse.course.id}`);
  };

  const handleDelete = async (leagueCourse: GolfLeagueCourseType) => {
    setActionLoading(true);
    try {
      const result = await removeCourseFromLeague(leagueCourse.course.id);

      if (result.success) {
        showNotification('Course removed from league', 'success');
        await refreshCourses();
      } else {
        setError(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

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
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Golf Courses
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage the golf courses available for your league.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs accountId={accountId} currentPage="Golf Courses" />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <CourseList
            courses={courses}
            loading={actionLoading}
            error={error}
            onRetry={handleRetry}
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
        open={!!notification}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={hideNotification} severity={notification?.severity} variant="filled">
          {notification?.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default GolfCoursesPage;
