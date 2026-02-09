'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Button, Fab, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';
import AccountPageHeader from '../AccountPageHeader';
import { AdminBreadcrumbs } from '../admin';
import { WorkoutRegistrationsAccordion } from './WorkoutRegistrationsAccordion';
import { WorkoutFormDialog } from './dialogs/WorkoutFormDialog';
import { WorkoutPreviewDialog } from './dialogs/WorkoutPreviewDialog';
import { WorkoutSourcesDialog } from './dialogs/WorkoutSourcesDialog';
import type { WorkoutType } from '@draco/shared-schemas';

interface WorkoutsManagementProps {
  accountId: string;
}

export const WorkoutsManagement: React.FC<WorkoutsManagementProps> = ({ accountId }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);
  const [previewState, setPreviewState] = useState<{ open: boolean; workoutId: string | null }>({
    open: false,
    workoutId: null,
  });
  const [sourcesDialogOpen, setSourcesDialogOpen] = useState(false);

  const handleCreateWorkout = () => {
    setFormMode('create');
    setActiveWorkoutId(null);
    setFormOpen(true);
  };

  const handleOpenSourcesDialog = () => {
    setSourcesDialogOpen(true);
  };

  const handleCloseSourcesDialog = () => {
    setSourcesDialogOpen(false);
  };

  const handleEditWorkout = (workoutId: string) => {
    setFormMode('edit');
    setActiveWorkoutId(workoutId);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setActiveWorkoutId(null);
  };

  const handleDialogSuccess = (result: { workout: WorkoutType; message: string }) => {
    setFormOpen(false);
    setActiveWorkoutId(null);
    setRefreshKey((value) => value + 1);
    setFeedback({ severity: 'success', message: result.message });
  };

  const handleDialogError = (message: string) => {
    setFeedback({ severity: 'error', message });
  };

  const handlePreviewWorkout = (workoutId: string) => {
    setPreviewState({ open: true, workoutId });
  };

  const handleClosePreview = () => {
    setPreviewState({ open: false, workoutId: null });
  };

  const handleFeedbackClose = () => {
    setFeedback(null);
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Workouts Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Create and manage workout sessions, registrations, and attendance.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Season', href: `/account/${accountId}/admin/season` }}
          currentPage="Workouts Management"
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={handleOpenSourcesDialog}>
            Manage Where Heard
          </Button>
        </Box>

        <WorkoutRegistrationsAccordion
          accountId={accountId}
          onCreateWorkout={handleCreateWorkout}
          onEditWorkout={handleEditWorkout}
          onPreviewWorkout={handlePreviewWorkout}
          refreshKey={refreshKey}
        />
      </Container>

      <Fab
        color="primary"
        aria-label="Create workout"
        onClick={handleCreateWorkout}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: (theme) => theme.zIndex.snackbar + 1,
        }}
      >
        <AddIcon />
      </Fab>

      <WorkoutFormDialog
        accountId={accountId}
        open={formOpen}
        mode={formMode}
        workoutId={formMode === 'edit' ? (activeWorkoutId ?? undefined) : undefined}
        onClose={handleCloseForm}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />

      <WorkoutPreviewDialog
        accountId={accountId}
        workoutId={previewState.workoutId}
        open={previewState.open}
        onClose={handleClosePreview}
      />

      <WorkoutSourcesDialog
        accountId={accountId}
        open={sourcesDialogOpen}
        onClose={handleCloseSourcesDialog}
        onSuccess={(message) => setFeedback({ severity: 'success', message })}
        onError={(message) => setFeedback({ severity: 'error', message })}
      />

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={6000}
        onClose={handleFeedbackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert
            onClose={handleFeedbackClose}
            severity={feedback.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
};
