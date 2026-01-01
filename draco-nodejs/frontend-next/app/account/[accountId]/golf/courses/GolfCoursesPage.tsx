'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Snackbar,
  Typography,
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type {
  GolfLeagueCourseType,
  GolfCourseWithTeesType,
  CreateGolfCourseType,
  UpdateGolfCourseType,
} from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { CourseList, CourseForm, CourseSearchDialog } from '../../../../../components/golf/courses';
import { useGolfCourses } from '../../../../../hooks/useGolfCourses';
import { useRole } from '../../../../../context/RoleContext';

const GolfCoursesPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const { hasPermission } = useRole();

  const canManage = accountId ? hasPermission('account.manage', { accountId }) : false;

  const {
    listCourses,
    getCourse,
    createCourse,
    updateCourse,
    removeCourseFromLeague,
    addCourseToLeague,
    importExternalCourse,
  } = useGolfCourses(accountId || '');

  const [courses, setCourses] = useState<GolfLeagueCourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingCourse, setEditingCourse] = useState<GolfCourseWithTeesType | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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
    async (course: { externalId: string; isLocal: boolean; localCourseId?: string }) => {
      if (course.isLocal) {
        return { success: true, error: 'Course is already in your league' };
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

  const handleCreateManually = useCallback(() => {
    setFormMode('create');
    setEditingCourse(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback(
    async (leagueCourse: GolfLeagueCourseType) => {
      setFormLoading(true);
      const result = await getCourse(leagueCourse.course.id);

      if (result.success) {
        setEditingCourse(result.data);
        setFormMode('edit');
        setFormOpen(true);
      } else {
        setError(result.error);
      }

      setFormLoading(false);
    },
    [getCourse],
  );

  const handleView = useCallback(
    (leagueCourse: GolfLeagueCourseType) => {
      router.push(`/account/${accountId}/golf/courses/${leagueCourse.course.id}`);
    },
    [accountId, router],
  );

  const handleDelete = useCallback(
    async (leagueCourse: GolfLeagueCourseType) => {
      const result = await removeCourseFromLeague(leagueCourse.course.id);

      if (result.success) {
        setSuccessMessage('Course removed from league');
        await loadCourses();
      } else {
        setError(result.error);
      }
    },
    [removeCourseFromLeague, loadCourses],
  );

  const handleFormSubmit = useCallback(
    async (data: CreateGolfCourseType | UpdateGolfCourseType) => {
      if (formMode === 'create') {
        const result = await createCourse(data as CreateGolfCourseType);

        if (result.success) {
          setSuccessMessage('Course created successfully');
          setFormOpen(false);
          await loadCourses();
        } else {
          throw new Error(result.error);
        }
      } else if (editingCourse) {
        const result = await updateCourse(editingCourse.id, data as UpdateGolfCourseType);

        if (result.success) {
          setSuccessMessage('Course updated successfully');
          setFormOpen(false);
          await loadCourses();
        } else {
          throw new Error(result.error);
        }
      }
    },
    [formMode, editingCourse, createCourse, updateCourse, loadCourses],
  );

  const handleFormCancel = useCallback(() => {
    setFormOpen(false);
    setEditingCourse(null);
  }, []);

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
            loading={formLoading}
            error={error}
            onRetry={loadCourses}
            onView={handleView}
            onEdit={canManage ? handleEdit : undefined}
            onDelete={canManage ? handleDelete : undefined}
            emptyMessage="No courses have been added to this league yet."
            actionsDisabled={formLoading}
          />
        )}
      </Container>

      {canManage && (
        <Fab
          color="primary"
          aria-label="Find a course"
          onClick={handleOpenSearch}
          disabled={formLoading}
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
        onCreateManually={handleCreateManually}
        accountId={accountId}
        leagueCourses={courses}
      />

      <Dialog
        open={formOpen}
        onClose={handleFormCancel}
        maxWidth="lg"
        fullWidth
        aria-labelledby="course-form-dialog-title"
      >
        <DialogTitle id="course-form-dialog-title" sx={{ pr: 6 }}>
          {formMode === 'create' ? 'Add New Course' : 'Edit Course'}
          <IconButton
            aria-label="close"
            onClick={handleFormCancel}
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
        <DialogContent dividers>
          <CourseForm
            course={editingCourse}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            accountId={accountId}
            showImportButton={formMode === 'create'}
          />
        </DialogContent>
      </Dialog>

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
