'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Stack,
  Snackbar,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import type {
  GolfCourseWithTeesType,
  GolfCourseTeeType,
  UpdateGolfCourseType,
  CreateGolfCourseTeeType,
  UpdateGolfCourseTeeType,
} from '@draco/shared-schemas';
import { useRole } from '@/context/RoleContext';
import { useApiClient } from '@/hooks/useApiClient';
import { fetchAdminGolfCourse, updateAdminGolfCourse } from '@/services/adminGolfCourseService';
import {
  createAdminGolfTee,
  updateAdminGolfTee,
  deleteAdminGolfTee,
} from '@/services/adminGolfTeeService';
import { CourseDetailView, TeeForm } from '@/components/golf/courses';

const AdminGolfCourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useRole();
  const apiClient = useApiClient();

  const courseIdParam = params?.courseId;
  const courseId = Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;

  const isAdministrator = hasRole('Administrator');

  const [course, setCourse] = useState<GolfCourseWithTeesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teeFormOpen, setTeeFormOpen] = useState(false);
  const [teeFormMode, setTeeFormMode] = useState<'create' | 'edit'>('create');
  const [editingTee, setEditingTee] = useState<GolfCourseTeeType | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isExternal = Boolean(course?.externalId);

  useEffect(() => {
    if (!courseId) return;
    const controller = new AbortController();
    const loadCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminGolfCourse(apiClient, courseId, controller.signal);
        if (controller.signal.aborted) return;
        setCourse(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unable to load course');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadCourse();
    return () => {
      controller.abort();
    };
  }, [apiClient, courseId, refreshKey]);

  const handleBack = () => {
    router.push('/admin/golf/courses');
  };

  const handleCourseSave = async (data: UpdateGolfCourseType) => {
    if (!course) return;

    try {
      await updateAdminGolfCourse(apiClient, course.id, data);
      setSuccessMessage('Course updated successfully');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      throw err;
    }
  };

  const handleAddTee = () => {
    setTeeFormMode('create');
    setEditingTee(null);
    setTeeFormOpen(true);
  };

  const handleEditTee = (tee: GolfCourseTeeType) => {
    setTeeFormMode('edit');
    setEditingTee(tee);
    setTeeFormOpen(true);
  };

  const handleDeleteTee = async (tee: GolfCourseTeeType) => {
    if (!courseId) return;

    const confirmed = window.confirm(`Delete tee "${tee.teeName}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteAdminGolfTee(apiClient, courseId, tee.id);
      setSuccessMessage('Tee deleted successfully');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete tee');
    }
  };

  const handleTeeFormSubmit = async (data: CreateGolfCourseTeeType | UpdateGolfCourseTeeType) => {
    if (!courseId) return;

    try {
      if (teeFormMode === 'create') {
        await createAdminGolfTee(apiClient, courseId, data as CreateGolfCourseTeeType);
        setSuccessMessage('Tee added successfully');
      } else if (editingTee) {
        await updateAdminGolfTee(
          apiClient,
          courseId,
          editingTee.id,
          data as UpdateGolfCourseTeeType,
        );
        setSuccessMessage('Tee updated successfully');
      }
      setTeeFormOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      throw err;
    }
  };

  if (!isAdministrator) {
    return (
      <main className="min-h-screen bg-background">
        <Alert severity="error" sx={{ mt: 2 }}>
          You do not have administrator privileges to access this page.
        </Alert>
      </main>
    );
  }

  if (!courseId) {
    return (
      <main className="min-h-screen bg-background">
        <Alert severity="error" sx={{ mt: 2 }}>
          Course ID could not be determined.
        </Alert>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack} variant="outlined" size="small">
            Back to Courses
          </Button>
          {isExternal && (
            <Typography variant="body2" color="text.secondary">
              External courses are read-only
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {course?.name ?? 'Course Details'}
          </Typography>
          {course && (
            <Typography variant="body2" color="text.secondary">
              {[course.city, course.state].filter(Boolean).join(', ') ||
                'View course scorecard and tee information'}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : course ? (
          <CourseDetailView
            course={course}
            editMode={!isExternal}
            onSave={!isExternal ? handleCourseSave : undefined}
            showEditControls={!isExternal}
            onEditTee={!isExternal ? handleEditTee : undefined}
            onDeleteTee={!isExternal ? handleDeleteTee : undefined}
          />
        ) : null}
      </Stack>

      {!isExternal && (
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

export default AdminGolfCourseDetailPage;
