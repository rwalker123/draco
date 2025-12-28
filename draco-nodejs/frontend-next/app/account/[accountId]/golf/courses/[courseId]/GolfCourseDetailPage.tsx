'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Close as CloseIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type {
  GolfCourseWithTeesType,
  GolfCourseTeeType,
  UpdateGolfCourseType,
  CreateGolfCourseTeeType,
  UpdateGolfCourseTeeType,
} from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import { CourseScorecard, CourseForm, TeeForm } from '../../../../../../components/golf/courses';
import { useGolfCourses } from '../../../../../../hooks/useGolfCourses';
import { useGolfTees } from '../../../../../../hooks/useGolfTees';
import { useRole } from '../../../../../../context/RoleContext';

const GolfCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const accountIdParam = params?.accountId;
  const courseIdParam = params?.courseId;

  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const courseId = Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;

  const { hasPermission } = useRole();
  const canManage = accountId ? hasPermission('account.manage', { accountId }) : false;

  const { getCourse, updateCourse } = useGolfCourses(accountId || '');
  const { createTee, updateTee, deleteTee } = useGolfTees(accountId || '');

  const [course, setCourse] = useState<GolfCourseWithTeesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [teeFormOpen, setTeeFormOpen] = useState(false);
  const [teeFormMode, setTeeFormMode] = useState<'create' | 'edit'>('create');
  const [editingTee, setEditingTee] = useState<GolfCourseTeeType | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleEditCourse = useCallback(() => {
    setCourseFormOpen(true);
  }, []);

  const handleCourseFormSubmit = useCallback(
    async (data: UpdateGolfCourseType) => {
      if (!course) return;

      const result = await updateCourse(course.id, data);

      if (result.success) {
        setSuccessMessage('Course updated successfully');
        setCourseFormOpen(false);
        await loadCourse();
      } else {
        throw new Error(result.error);
      }
    },
    [course, updateCourse, loadCourse],
  );

  const handleAddTee = useCallback(() => {
    setTeeFormMode('create');
    setEditingTee(null);
    setTeeFormOpen(true);
  }, []);

  const handleEditTee = useCallback((tee: GolfCourseTeeType) => {
    setTeeFormMode('edit');
    setEditingTee(tee);
    setTeeFormOpen(true);
  }, []);

  const handleDeleteTee = useCallback(
    async (tee: GolfCourseTeeType) => {
      if (!courseId) return;

      const result = await deleteTee(courseId, tee.id);

      if (result.success) {
        setSuccessMessage('Tee deleted successfully');
        await loadCourse();
      } else {
        setError(result.error);
      }
    },
    [courseId, deleteTee, loadCourse],
  );

  const handleTeeFormSubmit = useCallback(
    async (data: CreateGolfCourseTeeType | UpdateGolfCourseTeeType) => {
      if (!courseId) return;

      if (teeFormMode === 'create') {
        const result = await createTee(courseId, data as CreateGolfCourseTeeType);

        if (result.success) {
          setSuccessMessage('Tee added successfully');
          setTeeFormOpen(false);
          await loadCourse();
        } else {
          throw new Error(result.error);
        }
      } else if (editingTee) {
        const result = await updateTee(courseId, editingTee.id, data as UpdateGolfCourseTeeType);

        if (result.success) {
          setSuccessMessage('Tee updated successfully');
          setTeeFormOpen(false);
          await loadCourse();
        } else {
          throw new Error(result.error);
        }
      }
    },
    [courseId, teeFormMode, editingTee, createTee, updateTee, loadCourse],
  );

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
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack} variant="outlined" size="small">
            Back to Courses
          </Button>
          {canManage && course && (
            <Button
              startIcon={<EditIcon />}
              onClick={handleEditCourse}
              variant="outlined"
              size="small"
            >
              Edit Course
            </Button>
          )}
        </Stack>

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
          <Paper sx={{ p: 3 }}>
            <CourseScorecard course={course} showTees />

            {canManage && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Manage Tees
                </Typography>
                <Stack spacing={1}>
                  {course.tees?.map((tee) => (
                    <Paper
                      key={tee.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {tee.teeName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rating: {tee.mensRating.toFixed(1)} / {tee.womansRating.toFixed(1)} |
                          Slope: {tee.mensSlope} / {tee.womansSlope}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => handleEditTee(tee)}>
                          Edit
                        </Button>
                        <Button size="small" color="error" onClick={() => handleDeleteTee(tee)}>
                          Delete
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        ) : null}
      </Container>

      {canManage && (
        <Fab
          color="primary"
          aria-label="Add tee"
          onClick={handleAddTee}
          sx={{
            position: 'fixed',
            bottom: { xs: 24, md: 32 },
            right: { xs: 24, md: 32 },
            zIndex: (theme) => theme.zIndex.tooltip,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog
        open={courseFormOpen}
        onClose={() => setCourseFormOpen(false)}
        maxWidth="lg"
        fullWidth
        aria-labelledby="course-edit-dialog-title"
      >
        <DialogTitle id="course-edit-dialog-title" sx={{ pr: 6 }}>
          Edit Course
          <IconButton
            aria-label="close"
            onClick={() => setCourseFormOpen(false)}
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
            course={course}
            onSubmit={handleCourseFormSubmit}
            onCancel={() => setCourseFormOpen(false)}
            accountId={accountId}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={teeFormOpen}
        onClose={() => setTeeFormOpen(false)}
        maxWidth="lg"
        fullWidth
        aria-labelledby="tee-form-dialog-title"
      >
        <DialogTitle id="tee-form-dialog-title" sx={{ pr: 6 }}>
          {teeFormMode === 'create' ? 'Add New Tee' : 'Edit Tee'}
          <IconButton
            aria-label="close"
            onClick={() => setTeeFormOpen(false)}
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
          <TeeForm
            tee={editingTee}
            numberOfHoles={course?.numberOfHoles ?? 18}
            onSubmit={handleTeeFormSubmit}
            onCancel={() => setTeeFormOpen(false)}
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

export default GolfCourseDetailPage;
