'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/navigation';
import {
  getAccountUserTeams,
  getCurrentUserContact,
  getMyAccounts,
} from '@draco/shared-api-client';
import type { AccountType, BaseContactType, TeamSeasonType } from '@draco/shared-schemas';
import { ApiClientError, unwrapApiResult } from '@/utils/apiResult';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import ContactInfoCard from '@/components/profile/ContactInfoCard';
import MemberBusinessCard from '@/components/profile/MemberBusinessCard';
import DiscordIntegrationCard from '@/components/profile/DiscordIntegrationCard';
import OrganizationsWidget from '@/components/OrganizationsWidget';
import MyTeams, { UserTeam } from '@/components/MyTeams';
import EditContactInfoDialog from '@/components/profile/EditContactInfoDialog';
import ChangePasswordDialog from '@/components/profile/ChangePasswordDialog';
import AccountOptional from '@/components/account/AccountOptional';
import DeleteIndividualGolfAccountDialog from '@/components/golf/dialogs/DeleteIndividualGolfAccountDialog';
import { isGolfIndividualAccountType } from '@/utils/accountTypeUtils';

interface OrganizationTeamsState {
  teams: UserTeam[];
  loading: boolean;
  error: string | null;
}

const mapTeamSeasonToUserTeam = (team: TeamSeasonType): UserTeam => ({
  id: team.id,
  name: team.name ?? 'Team',
  leagueName: team.league?.name ?? 'League',
  divisionName: team.division?.name ?? undefined,
  teamId: team.team?.id,
  logoUrl: team.team?.logoUrl ?? undefined,
});

const CONTACT_ERROR_MESSAGE =
  'We were unable to load your contact information. Please try again later.';
const ORGANIZATIONS_ERROR_MESSAGE =
  'We were unable to load your organizations. Please try again later.';

const ProfilePageClient: React.FC = () => {
  const apiClient = useApiClient();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const { currentAccount } = useAccount();
  const currentAccountId = currentAccount?.id ? String(currentAccount.id) : null;

  const {
    settings: accountSettings,
    loading: accountSettingsLoading,
    error: accountSettingsError,
  } = useAccountSettings(currentAccountId);

  const [contact, setContact] = useState<BaseContactType | null>(null);
  const [contactLoading, setContactLoading] = useState<boolean>(true);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactInfoMessage, setContactInfoMessage] = useState<string | null>(null);

  const [organizations, setOrganizations] = useState<AccountType[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState<boolean>(true);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);

  const [teamsByAccount, setTeamsByAccount] = useState<Record<string, OrganizationTeamsState>>({});
  const teamsByAccountRef = useRef<Record<string, OrganizationTeamsState>>({});
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);

  useEffect(() => {
    teamsByAccountRef.current = teamsByAccount;
  }, [teamsByAccount]);

  // Fetch contact details for the current account
  useEffect(() => {
    if (!token || !currentAccount?.id) {
      setContact(null);
      setContactError(null);
      setContactInfoMessage(null);
      setContactLoading(false);
      return;
    }

    let cancelled = false;

    const fetchContact = async () => {
      setContactLoading(true);
      setContactError(null);

      try {
        const result = await getCurrentUserContact({
          client: apiClient,
          path: { accountId: currentAccount.id },
          throwOnError: false,
        });

        if (result.error) {
          const status = result.response?.status;
          if (status === 403) {
            if (!cancelled) {
              setContact(null);
              setContactError(null);
              setContactInfoMessage('Not a member of this organization.');
              setContactLoading(false);
            }
            return;
          }

          if (!cancelled) {
            const message = result.error.message ?? CONTACT_ERROR_MESSAGE;
            setContact(null);
            setContactError(message);
            setContactInfoMessage(null);
            setContactLoading(false);
          }
          return;
        }

        const data = result.data as BaseContactType | null;

        if (!cancelled) {
          setContact(data ?? null);
          setContactLoading(false);
          setContactError(null);
          setContactInfoMessage(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 404) {
          setContact(null);
          setContactError(null);
          setContactInfoMessage(null);
        } else {
          const message = error instanceof Error ? error.message : CONTACT_ERROR_MESSAGE;
          setContact(null);
          setContactError(message);
          setContactInfoMessage(null);
        }

        setContactLoading(false);
      }
    };

    void fetchContact();

    return () => {
      cancelled = true;
    };
  }, [apiClient, currentAccount?.id, token]);

  // Fetch organizations for the authenticated user
  useEffect(() => {
    if (!token) {
      setOrganizations([]);
      setOrganizationsError(null);
      setOrganizationsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOrganizations = async () => {
      setOrganizationsLoading(true);
      setOrganizationsError(null);

      try {
        const result = await getMyAccounts({
          client: apiClient,
          throwOnError: false,
        });

        const data = unwrapApiResult(result, ORGANIZATIONS_ERROR_MESSAGE) as AccountType[];

        if (!cancelled) {
          setOrganizations(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : ORGANIZATIONS_ERROR_MESSAGE;
          setOrganizations([]);
          setOrganizationsError(message);
        }
      } finally {
        if (!cancelled) {
          setOrganizationsLoading(false);
        }
      }
    };

    void fetchOrganizations();

    return () => {
      cancelled = true;
    };
  }, [apiClient, token]);

  // Fetch teams for each organization (lazy load per organization)
  useEffect(() => {
    if (!token || organizations.length === 0) {
      return;
    }

    let cancelled = false;

    const currentTeams = teamsByAccountRef.current;
    const organizationsToFetch = organizations.filter(
      (organization) => !currentTeams[organization.id],
    );

    if (organizationsToFetch.length === 0) {
      return;
    }

    setTeamsByAccount((prev) => {
      const next = { ...prev };
      organizationsToFetch.forEach((organization) => {
        next[organization.id] = {
          teams: prev[organization.id]?.teams ?? [],
          loading: true,
          error: null,
        };
      });
      return next;
    });

    const fetchTeamsForOrganizations = async () => {
      await Promise.all(
        organizationsToFetch.map(async (organization) => {
          try {
            const result = await getAccountUserTeams({
              client: apiClient,
              path: { accountId: organization.id },
              throwOnError: false,
            });

            const data = unwrapApiResult(result, 'Failed to load teams for this organization.') as
              | TeamSeasonType[]
              | undefined;

            if (cancelled) {
              return;
            }

            const normalizedTeams = Array.isArray(data) ? data : [];
            const userTeams = normalizedTeams.map((team) => mapTeamSeasonToUserTeam(team));

            setTeamsByAccount((prev) => ({
              ...prev,
              [organization.id]: {
                teams: userTeams,
                loading: false,
                error: null,
              },
            }));
          } catch (error) {
            if (cancelled) {
              return;
            }

            const message =
              error instanceof Error
                ? error.message
                : 'Failed to load teams for this organization.';

            setTeamsByAccount((prev) => ({
              ...prev,
              [organization.id]: {
                teams: [],
                loading: false,
                error: message,
              },
            }));
          }
        }),
      );
    };

    void fetchTeamsForOrganizations();

    return () => {
      cancelled = true;
    };
  }, [apiClient, organizations, token]);

  const renderTeamsSection = useMemo(() => {
    if (organizationsLoading) {
      return (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Skeleton variant="text" width="60%" height={28} />
            <Skeleton variant="rectangular" height={120} />
          </Stack>
        </Paper>
      );
    }

    if (organizationsError) {
      return (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Alert severity="error">{organizationsError}</Alert>
        </Paper>
      );
    }

    // Filter out golf individual accounts since they don't have teams
    const teamOrganizations = organizations.filter(
      (org) => !isGolfIndividualAccountType(org.configuration?.accountType?.name),
    );

    if (!teamOrganizations.length) {
      return (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Teams by Organization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join an organization to see your teams and assignments here.
          </Typography>
        </Paper>
      );
    }

    return (
      <Stack spacing={3}>
        {teamOrganizations.map((organization) => {
          const teamsEntry = teamsByAccount[organization.id];
          const isLoading = teamsEntry?.loading ?? false;
          const error = teamsEntry?.error;
          const teams = teamsEntry?.teams ?? [];

          const handleViewTeam = (teamSeasonId: string) => {
            router.push(`/account/${organization.id}/home?teamSeasonId=${teamSeasonId}`);
          };

          if (isLoading) {
            return (
              <Paper key={organization.id} sx={{ p: 4, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Skeleton variant="text" width="50%" height={26} />
                  <Skeleton variant="rectangular" height={100} />
                </Stack>
              </Paper>
            );
          }

          if (error) {
            return (
              <Paper key={organization.id} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {organization.name}
                </Typography>
                <Alert severity="error">{error}</Alert>
              </Paper>
            );
          }

          return (
            <MyTeams
              key={organization.id}
              userTeams={teams}
              onViewTeam={handleViewTeam}
              title={`Teams at ${organization.name}`}
              emptyStateMessage="No teams are associated with your profile for this organization yet."
              sx={{ mb: 0 }}
            />
          );
        })}
      </Stack>
    );
  }, [organizations, organizationsError, organizationsLoading, router, teamsByAccount]);

  const handleEditContact = useCallback(() => {
    setEditDialogOpen(true);
  }, []);

  const handleChangePassword = useCallback(() => {
    setChangePasswordDialogOpen(true);
  }, []);

  const handleContactUpdated = useCallback((updated: BaseContactType) => {
    setContact(updated);
  }, []);

  const isGolfIndividualAccount = useMemo(() => {
    return isGolfIndividualAccountType(currentAccount?.accountType);
  }, [currentAccount?.accountType]);

  const canDeleteUser = useMemo(() => {
    return isGolfIndividualAccount && organizations.length === 1;
  }, [isGolfIndividualAccount, organizations.length]);

  const handleDeleteAccount = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteSuccess = useCallback(
    (result: { userDeleted: boolean }) => {
      if (result.userDeleted) {
        logout(false);
        router.push('/');
      } else {
        router.push('/accounts');
      }
    },
    [logout, router],
  );

  const showContactInfoSetting = useMemo(() => {
    if (!currentAccountId) {
      return true;
    }

    const state = accountSettings?.find((entry) => entry.definition.key === 'ShowContactInfo');
    if (!state) {
      return undefined;
    }

    return Boolean(state.effectiveValue ?? state.value);
  }, [accountSettings, currentAccountId]);

  const editContactInfoSetting = useMemo(() => {
    if (!currentAccountId) {
      return true;
    }

    const state = accountSettings?.find((entry) => entry.definition.key === 'EditContactInfo');
    if (!state) {
      return undefined;
    }

    return Boolean(state.effectiveValue ?? state.value);
  }, [accountSettings, currentAccountId]);

  const contactSettingsPending = Boolean(currentAccountId) && accountSettingsLoading;

  const allowContactInfoView =
    isGolfIndividualAccount || (currentAccountId ? showContactInfoSetting !== false : true);
  const allowContactEdit =
    isGolfIndividualAccount ||
    (allowContactInfoView && (currentAccountId ? editContactInfoSetting !== false : true));
  const hideContactDetails = Boolean(
    currentAccountId && !allowContactInfoView && !isGolfIndividualAccount,
  );

  useEffect(() => {
    if (!allowContactEdit && !isGolfIndividualAccount && isEditDialogOpen) {
      setEditDialogOpen(false);
    }
  }, [allowContactEdit, isEditDialogOpen, isGolfIndividualAccount]);

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Your Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review your contact information, organizations, and team memberships in one place.
        </Typography>
      </Stack>

      {!currentAccount?.id && (
        <Alert severity="info" sx={{ mb: 3 }}>
          We didn&apos;t detect an active organization. Select an organization to see your synced
          contact information.
        </Alert>
      )}

      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <ContactInfoCard
              contact={contact}
              loading={contactLoading || contactSettingsPending}
              error={currentAccountId && accountSettingsError ? accountSettingsError : contactError}
              infoMessage={hideContactDetails ? null : contactInfoMessage}
              accountName={currentAccount?.name}
              onEdit={
                contact && currentAccountId && (allowContactEdit || isGolfIndividualAccount)
                  ? handleEditContact
                  : undefined
              }
              onChangePassword={user ? handleChangePassword : undefined}
              surveyHref={currentAccountId ? `/account/${currentAccountId}/surveys` : undefined}
              surveyAccountId={currentAccountId}
              hideDetails={hideContactDetails}
            />
            <AccountOptional
              accountId={currentAccount?.id ? String(currentAccount.id) : null}
              componentId="profile.memberBusiness.card"
            >
              <MemberBusinessCard
                accountId={currentAccount?.id ?? null}
                contactId={contact?.id ?? null}
              />
            </AccountOptional>
            <DiscordIntegrationCard accountId={currentAccountId} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <OrganizationsWidget
              title="Your Organizations"
              organizations={organizations}
              loading={organizationsLoading}
              error={organizationsError}
              scrollable
            />

            {renderTeamsSection}
          </Stack>
        </Grid>
      </Grid>

      {isGolfIndividualAccount && currentAccountId && (
        <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: 'error.main' }}>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Permanently delete your golf account and all associated data.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAccount}
          >
            Delete Golf Account
          </Button>
        </Paper>
      )}

      {currentAccountId &&
        allowContactInfoView &&
        (allowContactEdit || isGolfIndividualAccount) && (
          <EditContactInfoDialog
            open={isEditDialogOpen}
            contact={contact}
            accountId={currentAccountId}
            onClose={() => setEditDialogOpen(false)}
            onSuccess={(updated) => {
              handleContactUpdated(updated);
            }}
          />
        )}

      {isGolfIndividualAccount && currentAccountId && currentAccount?.name && (
        <DeleteIndividualGolfAccountDialog
          open={isDeleteDialogOpen}
          accountId={currentAccountId}
          accountName={currentAccount.name}
          canDeleteUser={canDeleteUser}
          onClose={() => setDeleteDialogOpen(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <ChangePasswordDialog
        open={isChangePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
      />
    </Box>
  );
};

export default ProfilePageClient;
