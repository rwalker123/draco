'use client';

// TeamsWantedStateManager Component
// Centralized logic for determining UI state based on user authentication

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Alert, Stack, Divider, CircularProgress } from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Lock as LockIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useAccountMembership } from '../../hooks/useAccountMembership';
import { IAccessCodeVerificationResponse } from '../../types/accessCode';
import AccessCodeInput from './AccessCodeInput';
import TeamsWantedCardPublic from './TeamsWantedCardPublic';
import CreateTeamsWantedDialog, {
  type TeamsWantedDialogSuccessEvent,
  type TeamsWantedFormInitialData,
} from './CreateTeamsWantedDialog';
import { accessCodeService } from '../../services/accessCodeService';
import { calculateAge } from '../../utils/dateUtils';
import {
  TeamsWantedOwnerClassifiedType,
  TeamsWantedPublicClassifiedType,
  UpsertTeamsWantedClassifiedType,
} from '@draco/shared-schemas';
import { useTeamsWantedClassifieds } from '../../hooks/useClassifiedsService';
import WidgetShell from '../ui/WidgetShell';
import DeleteTeamsWantedDialog, {
  type DeleteTeamsWantedSuccessEvent,
} from './DeleteTeamsWantedDialog';

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

interface ITeamsWantedStateManagerProps {
  accountId: string;
  teamsWanted: TeamsWantedPublicClassifiedType[];
  onEdit: (id: string, accessCodeRequired: string) => void;
  onDelete: (id: string, accessCodeRequired: string) => void;
  canEdit: (classified: TeamsWantedPublicClassifiedType) => boolean;
  canDelete: (classified: TeamsWantedPublicClassifiedType) => boolean;
  loading?: boolean;
  error?: string;
  autoVerificationData?: {
    accessCode: string;
    classifiedData?: TeamsWantedOwnerClassifiedType | null;
  } | null;
  onVerificationProcessed?: () => void;
  onCreate?: () => void;
}

// User authentication states
type UserState = 'authenticated_member' | 'authenticated_non_member' | 'unauthenticated';

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

const TeamsWantedStateManager: React.FC<ITeamsWantedStateManagerProps> = ({
  accountId,
  teamsWanted,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  loading = false,
  error,
  autoVerificationData,
  onVerificationProcessed,
  onCreate,
}) => {
  // Get authentication and account membership status
  const { user, loading: authLoading, initialized: authInitialized } = useAuth();
  const { isMember, loading: membershipLoading } = useAccountMembership(accountId);
  const { getTeamsWantedContactForEdit } = useTeamsWantedClassifieds(accountId);

  // Local state for access code verification
  const [accessCodeResult, setAccessCodeResult] = useState<IAccessCodeVerificationResponse | null>(
    null,
  );
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [isVerifyingAccessCode, setIsVerifyingAccessCode] = useState(false);
  const [verifiedAccessCode, setVerifiedAccessCode] = useState<string | null>(null);

  // Local state for delete operations
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Local state for edit operations
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingClassified, setEditingClassified] = useState<TeamsWantedFormInitialData | null>(
    null,
  );
  const [editingClassifiedId, setEditingClassifiedId] = useState<string | null>(null);

  // Local state for contact fetching during edit
  const [editContactError, setEditContactError] = useState<string | null>(null);

  // Track pending auto verification payload so StrictMode double renders don't lose it
  const pendingAutoVerificationRef = React.useRef<typeof autoVerificationData | null>(null);
  const shouldNotifyVerificationRef = React.useRef(false);

  useEffect(() => {
    if (autoVerificationData) {
      pendingAutoVerificationRef.current = autoVerificationData;
      shouldNotifyVerificationRef.current = true;
    }
  }, [autoVerificationData]);

  const computeAge = (birthDate: Date | string | null | undefined): number | null => {
    if (!birthDate) {
      return null;
    }

    const parsed = new Date(birthDate);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return calculateAge(parsed);
  };

  // Fetch contact information for edit purposes
  const fetchContactForEdit = async (
    classifiedId: string,
  ): Promise<{ email: string; phone: string; birthDate: string | null } | null> => {
    if (!verifiedAccessCode) {
      setEditContactError('Access code not available');
      return null;
    }

    setEditContactError(null);

    const result = await getTeamsWantedContactForEdit(classifiedId, {
      accessCode: verifiedAccessCode ?? undefined,
    });

    if (result.success && result.data) {
      return result.data;
    }

    const errorMessage = result.error ?? 'Failed to fetch contact information';
    setEditContactError(errorMessage);
    return null;
  };

  // Determine current user state
  const userState: UserState | 'pending' = React.useMemo(() => {
    if (!authInitialized || authLoading) return 'pending';
    if (!user) return 'unauthenticated';
    if (membershipLoading || isMember === null) return 'pending';
    if (isMember) return 'authenticated_member';
    return 'authenticated_non_member';
  }, [authInitialized, authLoading, user, isMember, membershipLoading]);

  // Handle access code verification
  const handleAccessCodeSubmit = useCallback(
    async (accessCode: string) => {
      setIsVerifyingAccessCode(true);
      setAccessCodeError(null);

      try {
        const result = await accessCodeService.verifyAccessCode(accountId, accessCode);
        setAccessCodeResult(result);

        if (result.success) {
          // Store the verified access code for later use in edit/delete operations
          setVerifiedAccessCode(accessCode);
        } else {
          setAccessCodeError(result.message || 'Access code verification failed');
        }
      } catch (error) {
        setAccessCodeError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsVerifyingAccessCode(false);
      }
    },
    [accountId],
  );

  // Handle access code cancellation
  const handleAccessCodeCancel = () => {
    setAccessCodeResult(null);
    setAccessCodeError(null);
    setVerifiedAccessCode(null);
  };

  useEffect(() => {
    if (!accessCodeResult && pendingAutoVerificationRef.current) {
      const data = pendingAutoVerificationRef.current;

      if (data?.classifiedData) {
        setAccessCodeResult({
          success: true,
          classified: data.classifiedData,
          message: 'Access code verified successfully from email link',
        });
        setVerifiedAccessCode(data.accessCode);
      } else if (data?.accessCode) {
        handleAccessCodeSubmit(data.accessCode);
      }

      pendingAutoVerificationRef.current = null;
    }
  }, [accessCodeResult, handleAccessCodeSubmit]);

  useEffect(() => {
    if (accessCodeResult && shouldNotifyVerificationRef.current) {
      shouldNotifyVerificationRef.current = false;
      onVerificationProcessed?.();
    }
  }, [accessCodeResult, onVerificationProcessed]);

  const handleDeleteDialogSuccess = (event: DeleteTeamsWantedSuccessEvent) => {
    setDeleteSuccess(event.message);
    setDeleteError(null);

    setTimeout(() => {
      setAccessCodeResult(null);
      setVerifiedAccessCode(null);
      setDeleteSuccess(null);
    }, 2000);
  };

  // Handle local edit for access code verified users
  const handleAccessCodeDialogSuccess = (event: TeamsWantedDialogSuccessEvent) => {
    setEditSuccess(event.message);
    setEditError(null);
    setEditDialogOpen(false);
    setEditingClassified(null);
    setEditingClassifiedId(null);

    setAccessCodeResult((prev) => {
      if (!prev) {
        return null;
      }

      return {
        ...prev,
        classified: event.data,
      };
    });

    setTimeout(() => {
      setEditSuccess(null);
    }, 3000);
  };

  const handleAccessCodeDialogError = (message: string) => {
    setEditError(message);
  };

  // Handle local edit and delete button clicks for access code users
  const handleLocalEdit = async (id: string, _accessCodeRequired: string) => {
    if (!accessCodeResult?.classified) return;

    // First, fetch contact information just-in-time
    const contactInfo = await fetchContactForEdit(id);

    if (!contactInfo && !editContactError) {
      // If no contact info and no error, something went wrong
      setEditContactError('Unable to fetch contact information');
      return;
    }

    // Transform ITeamsWantedClassified to ITeamsWantedOwnerResponse with contact info
    const classifiedWithAccount: UpsertTeamsWantedClassifiedType = {
      name: accessCodeResult.classified.name,
      email: contactInfo?.email || accessCodeResult.classified.email,
      phone: contactInfo?.phone || accessCodeResult.classified.phone,
      experience: accessCodeResult.classified.experience,
      positionsPlayed: accessCodeResult.classified.positionsPlayed,
      birthDate: contactInfo?.birthDate ?? accessCodeResult.classified.birthDate ?? '',
    };

    setEditingClassified(classifiedWithAccount);
    setEditingClassifiedId(id);
    setEditDialogOpen(true);
  };

  const handleLocalDelete = (_id: string, _accessCodeRequired: string) => {
    setDeleteDialogOpen(true);
  };

  const renderAccessWidget = () => (
    <WidgetShell
      title="Access Your Own Ad"
      subtitle="Access your existing Teams Wanted ad or create a new one."
      accent="primary"
      sx={{ maxWidth: 600, mx: 'auto' }}
    >
      <Stack spacing={2} mb={2}>
        <Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              onCreate?.();
            }}
          >
            Create Teams Wanted Ad
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Enter your access code below to view and manage an existing ad.
        </Typography>
      </Stack>
      {accessCodeResult?.success ? (
        renderAccessCodeResult()
      ) : (
        <AccessCodeInput
          accountId={accountId}
          onSubmit={handleAccessCodeSubmit}
          onCancel={handleAccessCodeCancel}
          loading={isVerifyingAccessCode}
          error={accessCodeError || undefined}
          submitButtonText="View My Ad"
        />
      )}
    </WidgetShell>
  );

  // Render content based on user state
  const renderContent = () => {
    switch (userState) {
      case 'pending':
        return (
          <Box textAlign="center" py={4}>
            <CircularProgress />
          </Box>
        );

      case 'authenticated_member':
        return renderAuthenticatedMemberContent();

      case 'authenticated_non_member':
        return renderAuthenticatedNonMemberContent();

      case 'unauthenticated':
        return renderUnauthenticatedContent();

      default:
        return null;
    }
  };

  // Render content for authenticated account members
  const renderAuthenticatedMemberContent = () => {
    if (loading) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Loading Teams Wanted ads...
          </Typography>
        </Box>
      );
    }

    if (teamsWanted.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Teams Wanted Ads
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to post a Teams Wanted ad to find a team to join.
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom color="text.primary">
          Teams Wanted Ads ({teamsWanted.length})
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 3,
          }}
        >
          {teamsWanted.map((classified) => (
            <Box key={classified.id}>
              <TeamsWantedCardPublic
                classified={{
                  id: classified.id,
                  accountId: classified.accountId,
                  dateCreated: classified.dateCreated,
                  name: classified.name,
                  experience: classified.experience,
                  positionsPlayed: classified.positionsPlayed,
                  age: classified.age,
                  account: classified.account,
                }}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={(_publicClassified) => canEdit(classified)}
                canDelete={(_publicClassified) => canDelete(classified)}
                isAuthenticated={true}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Render content for authenticated non-account members
  const renderAuthenticatedNonMemberContent = () => {
    return (
      <Box>
        <WidgetShell
          title="Join This Account"
          subtitle="You are signed in but not a member of this account. Join to see all Teams Wanted ads and connect with team members."
          accent="info"
          sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <InfoIcon color="info" />
              <Typography variant="body1" color="text.primary">
                Unlock full access to Teams Wanted for this account.
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Joining lets you view all ads and connect with team members.
            </Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                href={`/account/${accountId}/join`}
              >
                Join Account
              </Button>
            </Box>
          </Stack>
        </WidgetShell>

        <Divider sx={{ my: 3 }} />

        {renderAccessWidget()}
      </Box>
    );
  };

  // Render content for unauthenticated users
  const renderUnauthenticatedContent = () => {
    return (
      <Box>
        <Box sx={{ p: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Sign in to your account to see all players looking for a team.
          </Alert>
        </Box>
        <Divider sx={{ my: 3 }} />

        {renderAccessWidget()}
      </Box>
    );
  };

  // Render access code verification result
  const renderAccessCodeResult = () => {
    if (!accessCodeResult?.success || !accessCodeResult.classified) {
      return null;
    }

    const classified = accessCodeResult.classified;

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Alert severity="success">
            Access code verified successfully! Here&apos;s your Teams Wanted ad:
          </Alert>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box sx={{ maxWidth: 400, width: '100%' }}>
            <TeamsWantedCardPublic
              classified={{
                // Only include public fields (no email/phone for security)
                id: classified.id,
                accountId: classified.accountId,
                dateCreated: classified.dateCreated,
                name: classified.name,
                experience: classified.experience,
                positionsPlayed: classified.positionsPlayed,
                age: computeAge(classified.birthDate),
                account: {
                  id: classified.accountId,
                  name: 'Your Ad', // Since this is from access code, we don't have account name
                },
              }}
              onEdit={handleLocalEdit} // Use local handler for access code users
              onDelete={handleLocalDelete} // Use local handler for access code users
              canEdit={() => true} // Owner can always edit their own ad
              canDelete={() => true} // Owner can always delete their own ad
              isAuthenticated
              accessCode={verifiedAccessCode || undefined} // Pass verified access code for contact info
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" onClick={handleAccessCodeCancel} startIcon={<LockIcon />}>
            Enter Different Access Code
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Local Success/Error Messages for Access Code Operations */}
      {deleteSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {deleteSuccess}
        </Alert>
      )}

      {deleteError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {deleteError}
        </Alert>
      )}

      {editSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {editSuccess}
        </Alert>
      )}

      {editError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {editError}
        </Alert>
      )}

      {editContactError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Contact Info Error: {editContactError}
        </Alert>
      )}

      {/* Main Content */}
      {renderContent()}

      <DeleteTeamsWantedDialog
        accountId={accountId}
        open={deleteDialogOpen}
        classified={accessCodeResult?.classified ?? null}
        accessCode={verifiedAccessCode ?? undefined}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={handleDeleteDialogSuccess}
        onError={(message) => setDeleteError(message)}
      />

      {/* Edit Dialog for Access Code Users */}
      <CreateTeamsWantedDialog
        accountId={accountId}
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingClassified(null);
          setEditingClassifiedId(null);
          setEditError(null);
          setEditContactError(null);
        }}
        editMode={true}
        initialData={editingClassified}
        classifiedId={editingClassifiedId ?? undefined}
        accessCode={verifiedAccessCode ?? undefined}
        onSuccess={handleAccessCodeDialogSuccess}
        onError={handleAccessCodeDialogError}
      />
    </Box>
  );
};

export default TeamsWantedStateManager;
