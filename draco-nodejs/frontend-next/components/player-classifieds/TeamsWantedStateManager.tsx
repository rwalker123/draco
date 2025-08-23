'use client';

// TeamsWantedStateManager Component
// Centralized logic for determining UI state based on user authentication

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Stack, Divider, Paper } from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Lock as LockIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useAccountMembership } from '../../hooks/useAccountMembership';
import { ITeamsWantedResponse, ITeamsWantedOwnerResponse } from '../../types/playerClassifieds';
import { IAccessCodeVerificationResponse } from '../../types/accessCode';
import AccessCodeInput from './AccessCodeInput';
import TeamsWantedCardPublic from './TeamsWantedCardPublic';
import { accessCodeService } from '../../services/accessCodeService';

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

interface ITeamsWantedStateManagerProps {
  accountId: string;
  teamsWanted: ITeamsWantedResponse[];
  onEdit: (id: string, accessCodeRequired: string) => void;
  onDelete: (id: string, accessCodeRequired: string) => void;
  canEdit: (classified: ITeamsWantedResponse) => boolean;
  canDelete: (classified: ITeamsWantedResponse) => boolean;
  loading?: boolean;
  error?: string;
  autoVerificationData?: {
    accessCode: string;
    classifiedData: ITeamsWantedOwnerResponse;
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
  const { user } = useAuth();
  const { isMember } = useAccountMembership(accountId);

  // Local state for access code verification
  const [accessCodeResult, setAccessCodeResult] = useState<IAccessCodeVerificationResponse | null>(
    null,
  );
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [isVerifyingAccessCode, setIsVerifyingAccessCode] = useState(false);

  // Handle auto-verification from email links
  useEffect(() => {
    if (autoVerificationData && !accessCodeResult) {
      // Automatically set the verification result from email verification
      setAccessCodeResult({
        success: true,
        classified: autoVerificationData.classifiedData,
        message: 'Access code verified successfully from email link',
      });

      // Notify parent that verification has been processed
      onVerificationProcessed?.();
    }
  }, [autoVerificationData, accessCodeResult, onVerificationProcessed]);

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

      if (!result.success) {
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
                classified={classified}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEdit}
                canDelete={canDelete}
                isAuthenticated={true}
                isAccountMember={true}
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
            Sign in to your account to see all Teams Wanted ads and connect with team members.
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
                ...classified,
                // Ensure the classified has all required fields for the card component
                id: classified.id,
                accountId: classified.accountId,
                dateCreated: classified.dateCreated,
                name: classified.name,
                email: classified.email,
                phone: classified.phone,
                experience: classified.experience,
                positionsPlayed: classified.positionsPlayed,
                birthDate: classified.birthDate,
                account: {
                  id: classified.accountId,
                  name: 'Your Ad', // Since this is from access code, we don't have account name
                },
              }}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={() => true} // Owner can always edit their own ad
              canDelete={() => true} // Owner can always delete their own ad
              isAuthenticated={true}
              isAccountMember={false} // Not an account member, but verified owner
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

      {/* Main Content */}
      {renderContent()}
    </Box>
  );
};

export default TeamsWantedStateManager;
