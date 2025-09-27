'use client';

// TeamsWantedStateManager Component
// Centralized logic for determining UI state based on user authentication

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Stack,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
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
import CreateTeamsWantedDialog from './CreateTeamsWantedDialog';
import { accessCodeService } from '../../services/accessCodeService';
import { playerClassifiedService } from '../../services/playerClassifiedService';
import { calculateAge } from '../../utils/dateUtils';
import {
  TeamsWantedOwnerClassifiedType,
  TeamsWantedPublicClassifiedType,
  UpsertTeamsWantedClassifiedType,
} from '@draco/shared-schemas';

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
    classifiedData: TeamsWantedOwnerClassifiedType;
  } | null;
  onVerificationProcessed?: () => void;
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
}) => {
  // Get authentication and account membership status
  const { user, token } = useAuth();
  const { isMember } = useAccountMembership(accountId);

  // Local state for access code verification
  const [accessCodeResult, setAccessCodeResult] = useState<IAccessCodeVerificationResponse | null>(
    null,
  );
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [isVerifyingAccessCode, setIsVerifyingAccessCode] = useState(false);
  const [verifiedAccessCode, setVerifiedAccessCode] = useState<string | null>(null);

  // Local state for delete operations
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Local state for edit operations
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingClassified, setEditingClassified] =
    useState<UpsertTeamsWantedClassifiedType | null>(null);

  // Local state for contact fetching during edit
  const [editContactLoading, setEditContactLoading] = useState(false);
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

  useEffect(() => {
    if (!accessCodeResult && pendingAutoVerificationRef.current) {
      const data = pendingAutoVerificationRef.current;
      setAccessCodeResult({
        success: true,
        classified: data.classifiedData,
        message: 'Access code verified successfully from email link',
      });
      setVerifiedAccessCode(data.accessCode);

      pendingAutoVerificationRef.current = null;
    }
  }, [accessCodeResult]);

  useEffect(() => {
    if (accessCodeResult && shouldNotifyVerificationRef.current) {
      shouldNotifyVerificationRef.current = false;
      onVerificationProcessed?.();
    }
  }, [accessCodeResult, onVerificationProcessed]);

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

    setEditContactLoading(true);
    setEditContactError(null);

    try {
      return await playerClassifiedService.getTeamsWantedContactForEdit(
        accountId,
        classifiedId,
        verifiedAccessCode,
        undefined, // No JWT token for access code users
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch contact information';
      setEditContactError(errorMessage);
      return null;
    } finally {
      setEditContactLoading(false);
    }
  };

  // Determine current user state
  const userState: UserState = React.useMemo(() => {
    if (!user) return 'unauthenticated';
    if (isMember) return 'authenticated_member';
    return 'authenticated_non_member';
  }, [user, isMember]);

  // Handle access code verification
  const handleAccessCodeSubmit = async (accessCode: string) => {
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
  };

  // Handle access code cancellation
  const handleAccessCodeCancel = () => {
    setAccessCodeResult(null);
    setAccessCodeError(null);
    setVerifiedAccessCode(null);
  };

  // Handle local delete for access code verified users
  const handleAccessCodeDelete = async (id: string) => {
    if (!verifiedAccessCode) {
      setDeleteError('Access code not available');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      // Use the service directly with the verified access code
      await playerClassifiedService.deleteTeamsWanted(accountId, id, undefined, verifiedAccessCode);

      setDeleteSuccess('Teams Wanted deleted successfully!');
      setDeleteDialogOpen(false);

      // Clear the access code result to hide the card
      setTimeout(() => {
        setAccessCodeResult(null);
        setVerifiedAccessCode(null);
        setDeleteSuccess(null);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete Teams Wanted';
      setDeleteError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle local edit for access code verified users
  const handleAccessCodeEdit = async (formData: UpsertTeamsWantedClassifiedType) => {
    if (!verifiedAccessCode || !accessCodeResult?.classified) {
      setEditError('Access code not available');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      // Transform form data for API (exclude accessCode from data, pass as separate parameter)
      const updateData: UpsertTeamsWantedClassifiedType = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        positionsPlayed: formData.positionsPlayed,
        birthDate: formData.birthDate ?? '',
      };

      // Use the service with both token and access code
      const updatedClassified = await playerClassifiedService.updateTeamsWanted(
        accountId,
        accessCodeResult.classified.id,
        updateData,
        token || undefined,
        verifiedAccessCode || undefined,
      );

      setEditSuccess('Teams Wanted updated successfully!');
      setEditDialogOpen(false);

      // Update the access code result with the new data
      setAccessCodeResult((prev) => {
        if (!prev) {
          return null;
        }

        const existing = prev.classified;

        if (existing) {
          return {
            ...prev,
            classified: updatedClassified,
          };
        }

        return {
          ...prev,
          classified: updatedClassified,
        };
      });

      // Clear success message after delay
      setTimeout(() => {
        setEditSuccess(null);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Teams Wanted';
      setEditError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle local edit and delete button clicks for access code users
  const handleLocalEdit = async (_id: string, _accessCodeRequired: string) => {
    if (!accessCodeResult?.classified) return;

    // First, fetch contact information just-in-time
    const contactInfo = await fetchContactForEdit(accessCodeResult.classified.id.toString());

    if (!contactInfo && !editContactError) {
      // If no contact info and no error, something went wrong
      setEditContactError('Unable to fetch contact information');
      return;
    }

    // Transform ITeamsWantedClassified to ITeamsWantedOwnerResponse with contact info
    const classifiedWithAccount: UpsertTeamsWantedClassifiedType = {
      id: accessCodeResult.classified.id,
      name: accessCodeResult.classified.name,
      email: contactInfo?.email || accessCodeResult.classified.email,
      phone: contactInfo?.phone || accessCodeResult.classified.phone,
      experience: accessCodeResult.classified.experience,
      positionsPlayed: accessCodeResult.classified.positionsPlayed,
      birthDate: contactInfo?.birthDate ?? accessCodeResult.classified.birthDate ?? '',
    };

    setEditingClassified(classifiedWithAccount);
    setEditDialogOpen(true);
  };

  const handleLocalDelete = (_id: string, _accessCodeRequired: string) => {
    setDeleteDialogOpen(true);
  };

  // Render content based on user state
  const renderContent = () => {
    switch (userState) {
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
        <Typography variant="h6" gutterBottom>
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
        <Paper sx={{ p: 3, mb: 3, backgroundColor: 'info.50' }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <InfoIcon color="info" />
            <Typography variant="h6" color="info.main">
              Join This Account
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary" mb={2}>
            You&apos;re signed in but not a member of this account. Join to see all Teams Wanted ads
            and connect with team members.
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            href={`/account/${accountId}/join`}
          >
            Join Account
          </Button>
        </Paper>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom textAlign="center">
          Access Your Own Ad
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          If you have a Teams Wanted ad, enter your access code to view and manage it.
        </Typography>

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
      </Box>
    );
  };

  // Render content for unauthenticated users
  const renderUnauthenticatedContent = () => {
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 3, backgroundColor: 'warning.50' }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <LockIcon color="warning" />
            <Typography variant="h6" color="warning.main">
              Sign In Required
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary" mb={2}>
            Sign in to your account to see all players looking for a team.
          </Typography>
        </Paper>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom textAlign="center">
          Access Your Own Ad
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          If you have a Teams Wanted ad, enter your access code to view and manage it without
          creating an account.
        </Typography>

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
              isAuthenticated={true}
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

      {/* Delete Confirmation Dialog for Access Code Users */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Teams Wanted Ad</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your Teams Wanted ad? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() =>
              handleAccessCodeDelete(accessCodeResult?.classified?.id?.toString() || '')
            }
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Ad'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog for Access Code Users */}
      <CreateTeamsWantedDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingClassified(null);
          setEditError(null);
          setEditContactError(null);
        }}
        onSubmit={handleAccessCodeEdit}
        loading={editLoading || editContactLoading}
        editMode={true}
        initialData={editingClassified}
        _classifiedId={editingClassified?.id}
      />
    </Box>
  );
};

export default TeamsWantedStateManager;
