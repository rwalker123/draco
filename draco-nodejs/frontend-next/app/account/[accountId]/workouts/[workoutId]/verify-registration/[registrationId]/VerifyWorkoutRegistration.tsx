'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import { validateAccessCode } from '../../../../../../../utils/accessCodeValidation';
import {
  updateWorkoutRegistration,
  verifyWorkoutRegistrationAccess,
  deleteWorkoutRegistrationByAccessCode,
} from '../../../../../../../services/workoutService';
import { WorkoutRegistrationForm } from '../../../../../../../components/workouts/WorkoutRegistrationForm';
import { UpsertWorkoutRegistrationType, WorkoutRegistrationType } from '@draco/shared-schemas';
import { ApiClientError, getApiErrorMessage } from '../../../../../../../utils/apiResult';

interface VerifyWorkoutRegistrationProps {
  accountId: string;
  workoutId: string;
  registrationId: string;
}

interface VerificationState {
  loading: boolean;
  error: string | null;
  registration: WorkoutRegistrationType | null;
  accessCode: string | null;
  success: boolean;
}

export default function VerifyWorkoutRegistration({
  accountId,
  workoutId,
  registrationId,
}: VerifyWorkoutRegistrationProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessCode = searchParams.get('code');

  const [state, setState] = useState<VerificationState>({
    loading: true,
    error: null,
    registration: null,
    accessCode: null,
    success: false,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const validatedAccessCode = useMemo(() => {
    if (!accessCode) return null;
    const validation = validateAccessCode(accessCode);
    return validation.isValid ? validation.sanitizedValue : null;
  }, [accessCode]);
  const formId = 'verify-registration-form';

  useEffect(() => {
    const verify = async () => {
      if (!accessCode) {
        setState({
          loading: false,
          error: 'Access code is required. Please use the link from your email.',
          registration: null,
          accessCode: null,
          success: false,
        });
        return;
      }

      const validation = validateAccessCode(accessCode);
      if (!validation.isValid || !validation.sanitizedValue) {
        setState({
          loading: false,
          error: validation.error || 'Invalid access code.',
          registration: null,
          accessCode: null,
          success: false,
        });
        return;
      }

      try {
        const registration = await verifyWorkoutRegistrationAccess(
          accountId,
          workoutId,
          registrationId,
          validation.sanitizedValue,
        );

        localStorage.setItem(
          'workoutRegistrationVerification',
          JSON.stringify({
            accountId,
            workoutId,
            registrationId,
            accessCode: validation.sanitizedValue,
            timestamp: Date.now(),
          }),
        );

        setState({
          loading: false,
          error: null,
          registration,
          accessCode: validation.sanitizedValue,
          success: true,
        });
      } catch (error) {
        const status = error instanceof ApiClientError ? error.status : undefined;
        const message =
          status === 404
            ? 'Registration not found for this account and workout.'
            : status === 429
              ? getApiErrorMessage(error, 'Too many verification attempts. Please try again soon.')
              : 'Unable to verify your access code.';
        setState({
          loading: false,
          error: message,
          registration: null,
          accessCode: null,
          success: false,
        });
      }
    };

    verify();
  }, [accessCode, accountId, registrationId, workoutId]);

  const handleUpdate = async (data: UpsertWorkoutRegistrationType) => {
    if (!state.accessCode) {
      setSaveError('Access code missing. Please reopen your verification link.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated = await updateWorkoutRegistration(
        accountId,
        workoutId,
        registrationId,
        { ...data, accessCode: state.accessCode },
        undefined,
        state.accessCode,
      );

      setState((prev) => ({
        ...prev,
        registration: updated,
      }));
      setSaveSuccess('Registration updated successfully.');
    } catch (error) {
      setSaveError(getApiErrorMessage(error, 'Update failed.'));
    } finally {
      setSaving(false);
    }
  };

  const goHome = () => {
    router.push(`/account/${accountId}`);
  };

  const handleDelete = async () => {
    if (!state.accessCode) {
      setSaveError('Access code missing. Please reopen your verification link.');
      return;
    }
    setDeleting(true);
    setSaveError(null);
    try {
      await deleteWorkoutRegistrationByAccessCode(
        accountId,
        workoutId,
        registrationId,
        state.accessCode,
      );

      router.push(`/account/${accountId}`);
    } catch (error) {
      setSaveError(getApiErrorMessage(error, 'Failed to remove registration.'));
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }} gutterBottom>
            Verify Workout Registration
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Confirm your access code to manage your registration
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ py: 4 }}>
            {state.loading && (
              <Box textAlign="center">
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Verifying your access code...</Typography>
              </Box>
            )}

            {!state.loading && state.error && (
              <Box textAlign="center">
                <Alert severity="error" sx={{ mb: 3 }}>
                  {state.error}
                </Alert>
                <Button variant="contained" onClick={goHome}>
                  Go Home
                </Button>
              </Box>
            )}

            {!state.loading && state.success && state.registration && (
              <Box display="flex" flexDirection="column" gap={3}>
                <Alert severity="success">
                  Access verified. You can update your registration details below.
                </Alert>
                {saveError && (
                  <Alert severity="error" onClose={() => setSaveError(null)}>
                    {saveError}
                  </Alert>
                )}
                {saveSuccess && (
                  <Alert severity="success" onClose={() => setSaveSuccess(null)}>
                    {saveSuccess}
                  </Alert>
                )}
                <Typography variant="h6">Registration Details</Typography>
                <WorkoutRegistrationForm
                  accountId={accountId}
                  workoutId={workoutId}
                  registration={state.registration}
                  onSubmit={handleUpdate}
                  onCancel={goHome}
                  isLoading={saving}
                  formId={formId}
                  onRemove={() => setDeleteDialogOpen(true)}
                  removeDisabled={saving || deleting}
                />
                {validatedAccessCode && (
                  <Typography variant="body2" color="text.secondary">
                    Access code: {validatedAccessCode}
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Registration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this registration? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
