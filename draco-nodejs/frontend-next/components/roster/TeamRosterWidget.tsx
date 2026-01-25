'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import UserAvatar from '@/components/users/UserAvatar';
import ContactPhotoUploadDialog from '@/components/users/ContactPhotoUploadDialog';
import { useRosterDataManager } from '@/hooks/useRosterDataManager';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { getContactDisplayName } from '@/utils/contactUtils';
import {
  formatRosterContactInfo,
  formatRosterVerificationInfo,
} from '@/components/roster/rosterFormatters';
import { useAuth } from '@/context/AuthContext';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import {
  getPublicTeamRosterMembers,
  getTeamRosterMembers as apiGetTeamRosterMembers,
  listTeamManagers as apiListTeamManagers,
} from '@draco/shared-api-client';
import WidgetShell from '@/components/ui/WidgetShell';
import type {
  AccountSettingKey,
  BaseContactType,
  ContactType,
  PublicRosterMemberType,
  PublicTeamRosterResponseType,
  TeamManagerType,
  TeamRosterMembersType,
} from '@draco/shared-schemas';
import PhotoDeleteDialog from '@/components/users/PhotoDeleteDialog';

interface TeamRosterWidgetProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  canViewSensitiveDetails?: boolean;
  canEditPhotos?: boolean;
}

const TeamRosterWidget: React.FC<TeamRosterWidgetProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  canViewSensitiveDetails = false,
  canEditPhotos = false,
}) => {
  const { setError: setRosterError } = useRosterDataManager({
    accountId,
    seasonId,
    teamSeasonId,
  });
  const { settings: accountSettings } = useAccountSettings(accountId);
  const apiClient = useApiClient();
  const { token } = useAuth();
  const isAuthenticated = Boolean(token);
  const hasPrivateAccess = isAuthenticated && canViewSensitiveDetails;
  const allowPhotoEdit = Boolean(canEditPhotos);
  const [publicRoster, setPublicRoster] = React.useState<PublicTeamRosterResponseType | null>(null);
  const [publicLoading, setPublicLoading] = React.useState(false);
  const [publicError, setPublicError] = React.useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<BaseContactType | null>(null);
  const [deleteContactId, setDeleteContactId] = React.useState<string | null>(null);
  const [privateRosterData, setPrivateRosterData] = React.useState<TeamRosterMembersType | null>(
    null,
  );
  const [privateManagers, setPrivateManagers] = React.useState<TeamManagerType[]>([]);
  const [privateLoading, setPrivateLoading] = React.useState(false);
  const [privateError, setPrivateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hasPrivateAccess || !token) {
      return;
    }

    let cancelled = false;

    const loadPrivateRoster = async () => {
      setPrivateLoading(true);
      setPrivateError(null);
      try {
        const [rosterResult, managersResult] = await Promise.all([
          apiGetTeamRosterMembers({
            client: apiClient,
            path: { accountId, seasonId, teamSeasonId },
            throwOnError: false,
          }),
          apiListTeamManagers({
            client: apiClient,
            path: { accountId, seasonId, teamSeasonId },
            throwOnError: false,
          }),
        ]);

        if (cancelled) return;

        const roster = unwrapApiResult(
          rosterResult,
          'Failed to fetch roster data',
        ) as TeamRosterMembersType;
        const managersData = (unwrapApiResult(managersResult, 'Failed to fetch managers') ??
          []) as TeamManagerType[];

        setPrivateRosterData(roster);
        setPrivateManagers(managersData);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load roster';
        setPrivateError(message);
      } finally {
        if (!cancelled) {
          setPrivateLoading(false);
        }
      }
    };

    loadPrivateRoster();

    return () => {
      cancelled = true;
    };
  }, [accountId, seasonId, teamSeasonId, hasPrivateAccess, token, apiClient]);

  React.useEffect(() => {
    if (hasPrivateAccess) {
      setPublicRoster(null);
      setPublicError(null);
      setPublicLoading(false);
      return;
    }

    let ignore = false;
    const load = async () => {
      setPublicLoading(true);
      setPublicError(null);
      try {
        const result = await getPublicTeamRosterMembers({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const data = unwrapApiResult(
          result,
          'Unable to load public roster at this time.',
        ) as PublicTeamRosterResponseType;
        setPublicRoster(data);
      } catch (err) {
        if (ignore) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Unable to load public roster at this time.';
        setPublicError(message);
        setPublicRoster(null);
      } finally {
        if (!ignore) {
          setPublicLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [accountId, apiClient, hasPrivateAccess, seasonId, teamSeasonId]);

  const getSettingValue = React.useCallback(
    (key: AccountSettingKey) => {
      const state = accountSettings?.find((setting) => setting.definition.key === key);
      return Boolean(state?.effectiveValue ?? state?.value);
    },
    [accountSettings],
  );

  const showWaiverStatus = getSettingValue('ShowWaiver');
  const showIdentificationStatus = getSettingValue('ShowIdentification');
  const showContactInfoOnRoster = getSettingValue('ShowUserInfoOnRosterPage');
  const showGamesPlayed = getSettingValue('TrackGamesPlayed');
  const canShowContactInfo = canViewSensitiveDetails && showContactInfoOnRoster;

  const effectiveRosterData = hasPrivateAccess ? privateRosterData : null;
  const effectiveLoading = hasPrivateAccess ? privateLoading : publicLoading;
  const effectiveError = hasPrivateAccess ? privateError : publicError;

  const activePlayers = React.useMemo(() => {
    const members = effectiveRosterData?.rosterMembers ?? [];
    return [...members]
      .filter((member) => !member.inactive)
      .sort((a, b) => {
        const aLast = a.player.contact.lastName || '';
        const bLast = b.player.contact.lastName || '';
        if (aLast !== bLast) {
          return aLast.localeCompare(bLast);
        }
        const aFirst = a.player.contact.firstName || '';
        const bFirst = b.player.contact.firstName || '';
        if (aFirst !== bFirst) {
          return aFirst.localeCompare(bFirst);
        }
        const aMiddle = a.player.contact.middleName || '';
        const bMiddle = b.player.contact.middleName || '';
        return aMiddle.localeCompare(bMiddle);
      });
  }, [effectiveRosterData?.rosterMembers]);

  const publicPlayers = React.useMemo(() => {
    const members: PublicRosterMemberType[] = publicRoster?.rosterMembers ?? [];
    return [...members].sort((a, b) => {
      const aLast = a.lastName || '';
      const bLast = b.lastName || '';
      if (aLast !== bLast) {
        return aLast.localeCompare(bLast);
      }
      const aFirst = a.firstName || '';
      const bFirst = b.firstName || '';
      if (aFirst !== bFirst) {
        return aFirst.localeCompare(bFirst);
      }
      const aMiddle = a.middleName || '';
      const bMiddle = b.middleName || '';
      return aMiddle.localeCompare(bMiddle);
    });
  }, [publicRoster?.rosterMembers]);

  const managerIds = React.useMemo(() => {
    const managers = hasPrivateAccess ? privateManagers : [];
    return new Set(managers.map((manager) => manager.contact.id));
  }, [hasPrivateAccess, privateManagers]);

  const openPhotoDialog = React.useCallback(
    (contact: BaseContactType) => {
      if (!allowPhotoEdit) {
        return;
      }
      setSelectedContact(contact);
      setPhotoDialogOpen(true);
    },
    [allowPhotoEdit],
  );

  const closePhotoDialog = React.useCallback(() => {
    setPhotoDialogOpen(false);
    setSelectedContact(null);
  }, []);

  const refetchPrivateRoster = async () => {
    try {
      const [rosterResult, managersResult] = await Promise.all([
        apiGetTeamRosterMembers({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          throwOnError: false,
        }),
        apiListTeamManagers({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          throwOnError: false,
        }),
      ]);

      const roster = unwrapApiResult(
        rosterResult,
        'Failed to fetch roster data',
      ) as TeamRosterMembersType;
      const managersData = (unwrapApiResult(managersResult, 'Failed to fetch managers') ??
        []) as TeamManagerType[];

      setPrivateRosterData(roster);
      setPrivateManagers(managersData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reload roster';
      setPrivateError(message);
    }
  };

  const handlePhotoUpdated = async (_updatedContact: ContactType) => {
    await refetchPrivateRoster();
    closePhotoDialog();
  };

  const openDeletePhotoDialog = (contact: BaseContactType) => {
    if (!allowPhotoEdit) {
      return;
    }
    setSelectedContact(contact);
    setDeleteContactId(contact.id);
  };

  const closeDeletePhotoDialog = () => {
    setDeleteContactId(null);
  };

  const handlePhotoDeleted = async () => {
    await refetchPrivateRoster();
    closeDeletePhotoDialog();
  };

  const renderPrivateTable = () => (
    <TableContainer sx={{ width: 'fit-content', maxWidth: '100%' }}>
      <Table size="small" sx={{ width: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Player</TableCell>
            {showGamesPlayed && <TableCell>Games Played</TableCell>}
            {canShowContactInfo && <TableCell>Contact Info</TableCell>}
            {canViewSensitiveDetails && <TableCell>Verification</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {activePlayers.map((member) => {
            const user = {
              id: member.player.contact.id,
              firstName: member.player.contact.firstName,
              lastName: member.player.contact.lastName,
              photoUrl: member.player.contact.photoUrl,
            };

            return (
              <TableRow key={member.id} hover>
                <TableCell>{member.playerNumber || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserAvatar
                      user={user}
                      size={32}
                      onClick={
                        allowPhotoEdit ? () => openPhotoDialog(member.player.contact) : undefined
                      }
                      showHoverEffects={allowPhotoEdit}
                      enablePhotoActions={allowPhotoEdit}
                      onPhotoDelete={
                        allowPhotoEdit
                          ? async () => {
                              openDeletePhotoDialog(member.player.contact);
                            }
                          : undefined
                      }
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {getContactDisplayName(member.player.contact)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        First Year: {member.player.firstYear || 'Not set'}
                      </Typography>
                    </Box>
                    {managerIds.has(member.player.contact.id) && (
                      <SupervisorAccountIcon
                        fontSize="small"
                        color="primary"
                        titleAccess="Team Manager"
                      />
                    )}
                  </Box>
                </TableCell>
                {showGamesPlayed && <TableCell>{member.gamesPlayed ?? '-'}</TableCell>}
                {canShowContactInfo && (
                  <TableCell>{formatRosterContactInfo(member.player.contact)}</TableCell>
                )}
                {canViewSensitiveDetails && (
                  <TableCell>
                    {formatRosterVerificationInfo(member, {
                      showWaiverStatus,
                      showIdentificationStatus,
                    })}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPublicTable = () => (
    <TableContainer sx={{ width: 'fit-content', maxWidth: '100%' }}>
      <Table size="small" sx={{ width: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Player</TableCell>
            {showGamesPlayed && <TableCell>Games Played</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {publicPlayers.map((member) => {
            const firstName = member.firstName?.trim() || 'Player';
            const lastName = member.lastName?.trim() || '';
            const displayName = [member.firstName, member.lastName]
              .filter((value): value is string => Boolean(value && value.trim().length > 0))
              .join(' ')
              .trim();
            const user = {
              id: member.id,
              firstName,
              lastName,
              photoUrl: member.photoUrl ?? undefined,
            };

            return (
              <TableRow key={member.id} hover>
                <TableCell>{member.playerNumber ?? '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserAvatar user={user} size={32} />
                    <Typography variant="body2" fontWeight={600}>
                      {displayName || firstName}
                    </Typography>
                  </Box>
                </TableCell>
                {showGamesPlayed && <TableCell>{member.gamesPlayed ?? '-'}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderContent = () => {
    const playerCount = hasPrivateAccess ? activePlayers.length : publicPlayers.length;

    if (effectiveLoading) {
      return (
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (effectiveError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {effectiveError}
        </Alert>
      );
    }

    if (playerCount === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No active players are currently listed on this roster.
          </Typography>
        </Box>
      );
    }

    return hasPrivateAccess ? renderPrivateTable() : renderPublicTable();
  };

  const totalPlayers = hasPrivateAccess ? activePlayers.length : publicPlayers.length;

  return (
    <>
      <WidgetShell
        accent="primary"
        sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
      >
        <Box
          sx={(theme) => ({
            p: 3,
            borderBottom: 1,
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.widget.surface,
            borderRadius: 2,
          })}
        >
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Team Roster
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active Players ({totalPlayers})
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            p: 3,
            borderRadius: 2,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? theme.palette.grey[900]
                : theme.palette.background.paper,
          })}
        >
          {renderContent()}
        </Box>
      </WidgetShell>
      {photoDialogOpen && selectedContact ? (
        <ContactPhotoUploadDialog
          open={photoDialogOpen}
          accountId={accountId}
          contact={selectedContact}
          canEdit={allowPhotoEdit}
          onClose={closePhotoDialog}
          onPhotoUpdated={handlePhotoUpdated}
          onError={setRosterError}
        />
      ) : null}
      {deleteContactId ? (
        <PhotoDeleteDialog
          open
          contactId={deleteContactId}
          contact={selectedContact}
          onClose={closeDeletePhotoDialog}
          onSuccess={handlePhotoDeleted}
          accountId={accountId}
        />
      ) : null}
    </>
  );
};

export default TeamRosterWidget;
