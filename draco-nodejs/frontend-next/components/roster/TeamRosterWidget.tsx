'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import UserAvatar from '@/components/users/UserAvatar';
import ContactPhotoUploadDialog from '@/components/users/ContactPhotoUploadDialog';
import { useRosterDataManager } from '@/hooks/useRosterDataManager';
import { useRosterPhoto } from '@/hooks/useRosterPhoto';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { getContactDisplayName } from '@/utils/contactUtils';
import {
  formatRosterContactInfo,
  formatRosterVerificationInfo,
} from '@/components/roster/rosterFormatters';
import { useAuth } from '@/context/AuthContext';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { buildPlayerStatisticsHref } from '@/utils/playerLinks';
import {
  getPublicTeamRosterMembers,
  getTeamRosterMembers as apiGetTeamRosterMembers,
  listTeamManagers as apiListTeamManagers,
  updateRosterMember as apiUpdateRosterMember,
} from '@draco/shared-api-client';
import WidgetShell from '@/components/ui/WidgetShell';
import {
  UpdateRosterMemberSchema,
  type AccountSettingKey,
  type BaseContactType,
  type ContactType,
  type PublicRosterMemberType,
  type PublicTeamRosterResponseType,
  type RosterMemberType,
  type TeamManagerType,
  type TeamRosterMembersType,
} from '@draco/shared-schemas';
import PhotoDeleteDialog from '@/components/users/PhotoDeleteDialog';

interface TeamRosterWidgetProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  canViewSensitiveDetails?: boolean;
  canEditPhotos?: boolean;
  isTeamAdmin?: boolean;
}

const TeamRosterWidget: React.FC<TeamRosterWidgetProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  canViewSensitiveDetails = false,
  canEditPhotos = false,
  isTeamAdmin = false,
}) => {
  const { setError: setRosterError } = useRosterDataManager({
    accountId,
    seasonId,
    teamSeasonId,
  });
  const { settings: accountSettings } = useAccountSettings(accountId);
  const {
    uploadPhoto,
    deletePhoto,
    loading: photoLoading,
  } = useRosterPhoto(accountId, seasonId, teamSeasonId);
  const apiClient = useApiClient();
  const { token } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocation = (() => {
    if (!pathname) {
      return null;
    }
    const query = searchParams?.toString() ?? '';
    return query.length > 0 ? `${pathname}?${query}` : pathname;
  })();
  const playerLinkLabel = 'Team Roster';
  const isAuthenticated = Boolean(token);
  const hasPrivateAccess = isAuthenticated && canViewSensitiveDetails;
  const [publicRoster, setPublicRoster] = React.useState<PublicTeamRosterResponseType | null>(null);
  const [publicLoading, setPublicLoading] = React.useState(false);
  const [publicError, setPublicError] = React.useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<BaseContactType | null>(null);
  const [selectedRosterMemberId, setSelectedRosterMemberId] = React.useState<string | null>(null);
  const [deleteContactId, setDeleteContactId] = React.useState<string | null>(null);
  const [editingNumberId, setEditingNumberId] = React.useState<string | null>(null);
  const [numberDraft, setNumberDraft] = React.useState('');
  const [savingNumber, setSavingNumber] = React.useState(false);
  const [numberError, setNumberError] = React.useState<string | null>(null);
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

    const controller = new AbortController();

    const loadPrivateRoster = async () => {
      setPrivateLoading(true);
      setPrivateError(null);
      try {
        const [rosterResult, managersResult] = await Promise.all([
          apiGetTeamRosterMembers({
            client: apiClient,
            path: { accountId, seasonId, teamSeasonId },
            signal: controller.signal,
            throwOnError: false,
          }),
          apiListTeamManagers({
            client: apiClient,
            path: { accountId, seasonId, teamSeasonId },
            signal: controller.signal,
            throwOnError: false,
          }),
        ]);

        if (controller.signal.aborted) return;

        const roster = unwrapApiResult(
          rosterResult,
          'Failed to fetch roster data',
        ) as TeamRosterMembersType;
        const managersData = (unwrapApiResult(managersResult, 'Failed to fetch managers') ??
          []) as TeamManagerType[];

        setPrivateRosterData(roster);
        setPrivateManagers(managersData);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load roster';
        setPrivateError(message);
      } finally {
        if (!controller.signal.aborted) {
          setPrivateLoading(false);
        }
      }
    };

    void loadPrivateRoster();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, teamSeasonId, hasPrivateAccess, token, apiClient]);

  React.useEffect(() => {
    if (hasPrivateAccess) {
      setPublicRoster(null);
      setPublicError(null);
      setPublicLoading(false);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setPublicLoading(true);
      setPublicError(null);
      try {
        const result = await getPublicTeamRosterMembers({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) {
          return;
        }

        const data = unwrapApiResult(
          result,
          'Unable to load public roster at this time.',
        ) as PublicTeamRosterResponseType;
        setPublicRoster(data);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Unable to load public roster at this time.';
        setPublicError(message);
        setPublicRoster(null);
      } finally {
        if (!controller.signal.aborted) {
          setPublicLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, hasPrivateAccess, seasonId, teamSeasonId]);

  const getSettingValue = (key: AccountSettingKey) => {
    const state = accountSettings?.find((setting) => setting.definition.key === key);
    return Boolean(state?.effectiveValue ?? state?.value);
  };

  const showWaiverStatus = getSettingValue('ShowWaiver');
  const showIdentificationStatus = getSettingValue('ShowIdentification');
  const showContactInfoOnRoster = getSettingValue('ShowUserInfoOnRosterPage');
  const showGamesPlayed = getSettingValue('TrackGamesPlayed');
  const canShowContactInfo = canViewSensitiveDetails && showContactInfoOnRoster;

  const allowTeamAdminEdits = getSettingValue('AllowTeamAdminPlayerEdits');
  const canManagePlayers = Boolean(canEditPhotos) || (Boolean(isTeamAdmin) && allowTeamAdminEdits);
  const allowPhotoEdit = canManagePlayers;
  const canEditNumber = canManagePlayers;

  const effectiveRosterData = hasPrivateAccess ? privateRosterData : null;
  const effectiveLoading = hasPrivateAccess ? privateLoading : publicLoading;
  const effectiveError = hasPrivateAccess ? privateError : publicError;

  const members = effectiveRosterData?.rosterMembers ?? [];
  const activePlayers = [...members]
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

  const publicMembers: PublicRosterMemberType[] = publicRoster?.rosterMembers ?? [];
  const publicPlayers = [...publicMembers].sort((a, b) => {
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

  const managers = hasPrivateAccess ? privateManagers : [];
  const managerIds = new Set(managers.map((manager) => manager.contact.id));

  const openPhotoDialog = (member: RosterMemberType) => {
    if (!allowPhotoEdit) {
      return;
    }
    setSelectedContact(member.player.contact);
    setSelectedRosterMemberId(member.id);
    setPhotoDialogOpen(true);
  };

  const closePhotoDialog = () => {
    setPhotoDialogOpen(false);
    setSelectedContact(null);
    setSelectedRosterMemberId(null);
  };

  const handlePhotoUpdated = (updatedContact: ContactType) => {
    setPrivateRosterData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rosterMembers: prev.rosterMembers.map((member) =>
          member.player.contact.id === updatedContact.id
            ? {
                ...member,
                player: {
                  ...member.player,
                  contact: { ...member.player.contact, photoUrl: updatedContact.photoUrl },
                },
              }
            : member,
        ),
      };
    });
    setPrivateManagers((prev) =>
      prev.map((manager) =>
        manager.contact.id === updatedContact.id
          ? { ...manager, contact: { ...manager.contact, photoUrl: updatedContact.photoUrl } }
          : manager,
      ),
    );
    closePhotoDialog();
  };

  const openDeletePhotoDialog = (member: RosterMemberType) => {
    if (!allowPhotoEdit) {
      return;
    }
    setSelectedContact(member.player.contact);
    setSelectedRosterMemberId(member.id);
    setDeleteContactId(member.player.contact.id);
  };

  const closeDeletePhotoDialog = () => {
    setDeleteContactId(null);
    setSelectedRosterMemberId(null);
  };

  const handlePhotoDeleted = () => {
    const contactId = deleteContactId;
    if (!contactId) return;

    setPrivateRosterData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rosterMembers: prev.rosterMembers.map((member) =>
          member.player.contact.id === contactId
            ? {
                ...member,
                player: {
                  ...member.player,
                  contact: { ...member.player.contact, photoUrl: undefined },
                },
              }
            : member,
        ),
      };
    });
    setPrivateManagers((prev) =>
      prev.map((manager) =>
        manager.contact.id === contactId
          ? { ...manager, contact: { ...manager.contact, photoUrl: undefined } }
          : manager,
      ),
    );
    closeDeletePhotoDialog();
  };

  const startEditNumber = (member: RosterMemberType) => {
    if (!canEditNumber) {
      return;
    }
    setEditingNumberId(member.id);
    setNumberDraft(member.playerNumber ?? '');
    setNumberError(null);
  };

  const cancelEditNumber = () => {
    setEditingNumberId(null);
    setNumberDraft('');
    setNumberError(null);
    setSavingNumber(false);
  };

  const saveNumber = async (member: RosterMemberType) => {
    const parsed = UpdateRosterMemberSchema.shape.playerNumber.safeParse(numberDraft);
    if (!parsed.success) {
      setNumberError(parsed.error.issues[0]?.message ?? 'Invalid player number');
      return;
    }

    setSavingNumber(true);
    setNumberError(null);

    try {
      const result = await apiUpdateRosterMember({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId, rosterMemberId: member.id },
        body: { playerNumber: parsed.data },
        throwOnError: false,
      });

      const updatedMember = unwrapApiResult(result, 'Failed to update number');
      const updatedNumber = updatedMember.playerNumber;

      setPrivateRosterData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rosterMembers: prev.rosterMembers.map((rosterMember) =>
            rosterMember.id === member.id
              ? { ...rosterMember, playerNumber: updatedNumber }
              : rosterMember,
          ),
        };
      });

      setEditingNumberId(null);
      setNumberDraft('');
    } catch (err) {
      setNumberError(err instanceof Error ? err.message : 'Failed to update number');
    } finally {
      setSavingNumber(false);
    }
  };

  const renderNumberCell = (member: RosterMemberType) => {
    if (editingNumberId === member.id) {
      return (
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
              value={numberDraft}
              onChange={(event) =>
                setNumberDraft(event.target.value.replace(/\D/g, '').slice(0, 2))
              }
              size="small"
              autoFocus
              error={Boolean(numberError)}
              helperText={numberError ?? undefined}
              disabled={savingNumber}
              slotProps={{
                htmlInput: { maxLength: 2, inputMode: 'numeric', 'aria-label': 'Player number' },
              }}
              sx={{ width: 88 }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void saveNumber(member);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelEditNumber();
                }
              }}
            />
            <IconButton
              size="small"
              color="primary"
              aria-label="Save player number"
              disabled={savingNumber}
              onClick={() => void saveNumber(member)}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Cancel editing player number"
              disabled={savingNumber}
              onClick={cancelEditNumber}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      );
    }

    if (!canEditNumber) {
      return <TableCell>{member.playerNumber || '-'}</TableCell>;
    }

    return (
      <TableCell>
        <Box
          role="button"
          tabIndex={0}
          aria-label="Edit player number"
          onClick={() => startEditNumber(member)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              startEditNumber(member);
            }
          }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            borderRadius: 1,
            px: 0.5,
            '&:hover .edit-number-icon': { opacity: 1 },
          }}
        >
          {member.playerNumber || '-'}
          <EditIcon
            className="edit-number-icon"
            sx={{ opacity: 0, fontSize: 14, color: 'text.secondary' }}
          />
        </Box>
      </TableCell>
    );
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
            const playerHref = buildPlayerStatisticsHref({
              accountId,
              contactId: member.player.contact.id,
              returnTo: currentLocation,
              returnLabel: playerLinkLabel,
            });
            const displayName = getContactDisplayName(member.player.contact);

            return (
              <TableRow key={member.id} hover>
                {renderNumberCell(member)}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserAvatar
                      user={user}
                      size={32}
                      onClick={allowPhotoEdit ? () => openPhotoDialog(member) : undefined}
                      showHoverEffects={allowPhotoEdit}
                      enablePhotoActions={allowPhotoEdit}
                      onPhotoDelete={
                        allowPhotoEdit
                          ? async () => {
                              openDeletePhotoDialog(member);
                            }
                          : undefined
                      }
                    />
                    <Box sx={{ flex: 1 }}>
                      {playerHref ? (
                        <Typography
                          component={NextLink}
                          href={playerHref}
                          prefetch={false}
                          variant="body2"
                          sx={{
                            display: 'block',
                            fontWeight: 600,
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {displayName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" fontWeight={600}>
                          {displayName}
                        </Typography>
                      )}
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
            const playerHref = buildPlayerStatisticsHref({
              accountId,
              contactId: member.contactId,
              returnTo: currentLocation,
              returnLabel: playerLinkLabel,
            });
            const playerLabel = displayName || firstName;

            return (
              <TableRow key={member.id} hover>
                <TableCell>{member.playerNumber || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserAvatar user={user} size={32} />
                    {playerHref ? (
                      <Typography
                        component={NextLink}
                        href={playerHref}
                        prefetch={false}
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {playerLabel}
                      </Typography>
                    ) : (
                      <Typography variant="body2" fontWeight={600}>
                        {playerLabel}
                      </Typography>
                    )}
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
      {photoDialogOpen && selectedContact && selectedRosterMemberId ? (
        <ContactPhotoUploadDialog
          open={photoDialogOpen}
          accountId={accountId}
          contact={selectedContact}
          canEdit={allowPhotoEdit}
          onClose={closePhotoDialog}
          onPhotoUpdated={handlePhotoUpdated}
          onError={setRosterError}
          onUploadPhoto={(file) => uploadPhoto(selectedRosterMemberId, file)}
          uploading={photoLoading}
        />
      ) : null}
      {deleteContactId && selectedRosterMemberId ? (
        <PhotoDeleteDialog
          open
          contactId={deleteContactId}
          contact={selectedContact}
          onClose={closeDeletePhotoDialog}
          onSuccess={handlePhotoDeleted}
          accountId={accountId}
          onDeletePhoto={() => deletePhoto(selectedRosterMemberId)}
          deleting={photoLoading}
        />
      ) : null}
    </>
  );
};

export default TeamRosterWidget;
