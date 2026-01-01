'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SportsBasketball as SportsIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  SupervisorAccount as ManagerIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import EditContactDialog from '../../../../../../../../components/users/EditContactDialog';
import UserAvatar from '../../../../../../../../components/users/UserAvatar';
import SignPlayerDialog from '../../../../../../../../components/roster/SignPlayerDialog';
import DeleteRosterMemberDialog from '../../../../../../../../components/roster/DeleteRosterMemberDialog';
import AssignTeamManagerDialog from '../../../../../../../../components/roster/AssignTeamManagerDialog';
import PageSectionHeader from '../../../../../../../../components/common/PageSectionHeader';
import AccountPageHeader from '../../../../../../../../components/AccountPageHeader';
import {
  formatRosterContactInfo,
  formatRosterVerificationInfo,
} from '@/components/roster/rosterFormatters';
import { RosterPlayerMutationResult } from '../../../../../../../../hooks/roster/useRosterPlayer';
import { useRosterDataManager } from '../../../../../../../../hooks/useRosterDataManager';
import { useScrollPosition } from '../../../../../../../../hooks/useScrollPosition';
import { useAccountSettings } from '../../../../../../../../hooks/useAccountSettings';
import { useRole } from '../../../../../../../../context/RoleContext';
import {
  RosterPlayerType,
  RosterMemberType,
  BaseContactType,
  SignRosterMemberType,
  ContactType,
  TeamRosterMembersType,
  type AccountSettingKey,
} from '@draco/shared-schemas';
import { exportTeamRoster } from '@draco/shared-api-client';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { getContactDisplayName } from '../../../../../../../../utils/contactUtils';

interface TeamRosterManagementProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}
const TeamRosterManagement: React.FC<TeamRosterManagementProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
}) => {
  const router = useRouter();
  const apiClient = useApiClient();
  const [formLoading, setFormLoading] = useState(false);

  // Use the new data manager hook
  const {
    rosterData,
    managers,
    season,
    league,
    loading,
    error,
    successMessage,
    fetchRosterData,
    fetchManagers,
    fetchSeasonData,
    fetchLeagueData,
    signPlayer,
    releasePlayer,
    activatePlayer,
    deletePlayer,
    addManager,
    removeManager,
    deleteContactPhoto,
    clearError,
    clearSuccessMessage,
    setError,
    setSuccessMessage,
    setRosterData,
  } = useRosterDataManager({
    accountId,
    seasonId,
    teamSeasonId,
  });

  const { settings: accountSettings } = useAccountSettings(accountId);
  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();

  const getSettingValue = useCallback(
    (key: AccountSettingKey) => {
      const state = accountSettings?.find((setting) => setting.definition.key === key);
      return Boolean(state?.effectiveValue ?? state?.value);
    },
    [accountSettings],
  );

  const trackWaiverEnabled = getSettingValue('TrackWaiver');
  const showWaiverStatus = getSettingValue('ShowWaiver');
  const trackIdentificationEnabled = getSettingValue('TrackIdentification');
  const showIdentificationStatus = getSettingValue('ShowIdentification');
  const showContactInfoOnRoster = getSettingValue('ShowUserInfoOnRosterPage');
  const canViewSensitiveRosterDetails = useMemo(
    () =>
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId),
    [accountId, teamSeasonId, hasRole, hasRoleInAccount, hasRoleInTeam],
  );
  const canShowRosterContactInfo = canViewSensitiveRosterDetails && showContactInfoOnRoster;

  // Use scroll position hook
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition();

  // Dialog states
  const [signPlayerDialogOpen, setSignPlayerDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<BaseContactType | RosterPlayerType | null>(
    null,
  );
  const [isSigningNewPlayer, setIsSigningNewPlayer] = useState(false);
  const [editingRosterMemberId, setEditingRosterMemberId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<RosterMemberType | null>(null);

  // Sign player process states
  const [signingTimeout, setSigningTimeout] = useState<NodeJS.Timeout | null>(null);

  // Unified roster information dialog states
  const [rosterFormData, setRosterFormData] = useState<SignRosterMemberType>({
    playerNumber: undefined,
    submittedWaiver: false,
    player: {
      submittedDriversLicense: false,
      firstYear: 0,
      contact: {
        id: '',
      },
    },
  });

  // Add at the top, after other dialog states
  const [addManagerDialogOpen, setAddManagerDialogOpen] = useState(false);

  // Enhanced dialog states for EditContactDialog
  const [editPlayerDialogOpen, setEditPlayerDialogOpen] = useState(false);
  const [isCreatingNewPlayer, setIsCreatingNewPlayer] = useState(false);
  const [autoSignToRoster, setAutoSignToRoster] = useState(false);
  const [editingContact, setEditingContact] = useState<BaseContactType | null>(null);

  // Initialize data on mount
  useEffect(() => {
    fetchRosterData();
    fetchSeasonData();
    fetchLeagueData();
    fetchManagers();
  }, [fetchRosterData, fetchSeasonData, fetchLeagueData, fetchManagers]);

  // Cleanup timeout on unmount or dialog close
  useEffect(() => {
    return () => {
      if (signingTimeout) {
        clearTimeout(signingTimeout);
      }
    };
  }, [signingTimeout]);

  useEffect(() => {
    fetchRosterData();
    fetchSeasonData();
    fetchLeagueData();
    fetchManagers();
  }, [
    fetchRosterData,
    fetchSeasonData,
    fetchLeagueData,
    fetchManagers,
    accountId,
    seasonId,
    teamSeasonId,
  ]);

  // Removed: Initial fetch of all available players - now using dynamic search

  // Handler to release player
  const handleReleasePlayer = async (rosterMember: RosterMemberType) => {
    setFormLoading(true);
    saveScrollPosition();

    try {
      await releasePlayer(rosterMember.id);
    } catch {
      // Error is handled by the data manager
    } finally {
      setFormLoading(false);
      restoreScrollPosition();
    }
  };

  // Handler to activate player
  const handleActivatePlayer = async (rosterMember: RosterMemberType) => {
    setFormLoading(true);
    saveScrollPosition();

    try {
      await activatePlayer(rosterMember.id);
    } catch {
      // Error is handled by the data manager
    } finally {
      setFormLoading(false);
      restoreScrollPosition();
    }
  };

  // Open delete dialog
  const openDeleteDialog = (rosterMember: RosterMemberType) => {
    setPlayerToDelete(rosterMember);
    setDeleteDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (rosterMember: RosterMemberType) => {
    setIsCreatingNewPlayer(false);
    setAutoSignToRoster(false);

    // Convert roster member contact to enhanced dialog format
    const contact: BaseContactType = {
      id: rosterMember.player.contact.id,
      firstName: rosterMember.player.contact.firstName || '',
      lastName: rosterMember.player.contact.lastName || '',
      middleName: rosterMember.player.contact.middleName || '', // ✅ Use top-level middleName
      email: rosterMember.player.contact.email || '',
      userId: rosterMember.player.contact.userId || '',
      contactDetails: {
        phone1: rosterMember.player.contact.contactDetails?.phone1 || '',
        phone2: rosterMember.player.contact.contactDetails?.phone2 || '',
        phone3: rosterMember.player.contact.contactDetails?.phone3 || '',
        streetAddress: rosterMember.player.contact.contactDetails?.streetAddress || '',
        city: rosterMember.player.contact.contactDetails?.city || '',
        state: rosterMember.player.contact.contactDetails?.state || '',
        zip: rosterMember.player.contact.contactDetails?.zip || '',
        dateOfBirth: rosterMember.player.contact.contactDetails?.dateOfBirth || '',
      },
      photoUrl: rosterMember.player.contact.photoUrl || undefined,
    };

    setEditingContact(contact);

    setEditPlayerDialogOpen(true);
  };

  const openCreatePlayerDialog = () => {
    setIsCreatingNewPlayer(true);
    setAutoSignToRoster(true);
    setEditingContact(null); // No contact when creating new
    setEditPlayerDialogOpen(true);
  };

  // Clear messages
  const clearMessages = useCallback(() => {
    clearError();
    clearSuccessMessage();
  }, [clearError, clearSuccessMessage]);

  // Close sign player dialog
  const closeSignPlayerDialog = () => {
    // Clear any existing timeout
    if (signingTimeout) {
      clearTimeout(signingTimeout);
      setSigningTimeout(null);
    }

    setSignPlayerDialogOpen(false);
    setSelectedPlayer(null);
    setEditingRosterMemberId(null);
    setRosterFormData({
      playerNumber: undefined,
      submittedWaiver: false,
      player: {
        submittedDriversLicense: false,
        firstYear: 0,
        contact: {
          id: '',
        },
      },
    });
    setIsSigningNewPlayer(false);
    clearMessages();
  };

  // Close delete dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  // Reactive cleanup when dialog closes (from any source)
  useEffect(() => {
    if (!editPlayerDialogOpen) {
      // Reset parent state when dialog closes
      setIsCreatingNewPlayer(false);
      setAutoSignToRoster(false);
      setEditingContact(null);
      clearMessages();
    }
  }, [editPlayerDialogOpen, clearMessages]);

  // Open sign player dialog
  const openSignPlayerDialog = () => {
    setIsSigningNewPlayer(true);
    setSelectedPlayer(null);
    setEditingRosterMemberId(null);
    setRosterFormData({
      playerNumber: undefined,
      submittedWaiver: false,
      player: {
        submittedDriversLicense: false,
        firstYear: new Date().getFullYear(),
        contact: {
          id: '',
        },
      },
    });
    setSignPlayerDialogOpen(true);
  };

  // Open roster dialog
  const openRosterDialog = (rosterMember: RosterMemberType) => {
    setIsSigningNewPlayer(false);
    setSelectedPlayer(rosterMember.player);
    setEditingRosterMemberId(rosterMember.id);
    setRosterFormData({
      playerNumber: rosterMember.playerNumber,
      submittedWaiver: rosterMember.submittedWaiver,
      player: {
        submittedDriversLicense: rosterMember.player.submittedDriversLicense,
        firstYear: rosterMember.player.firstYear,
        contact: {
          id: rosterMember.player.contact.id,
        },
      },
    });
    setSignPlayerDialogOpen(true);
  };

  const handleRosterDialogSuccess = useCallback(
    async (result: RosterPlayerMutationResult) => {
      await fetchRosterData();

      const contactName = getContactDisplayName(result.member.player.contact);
      const message =
        result.type === 'sign'
          ? `Player "${contactName}" signed to roster successfully`
          : `Roster information saved for "${contactName}"`;

      clearError();
      setSuccessMessage(message);
    },
    [fetchRosterData, clearError, setSuccessMessage],
  );

  // Enhanced contact success handler for new EditContactDialog
  const handleEnhancedContactSuccess = useCallback(
    async (result: { message: string; contact: ContactType; isCreate: boolean }) => {
      saveScrollPosition();

      try {
        if (result.isCreate && autoSignToRoster) {
          // Handle automatic roster signup for new players
          // This implements the same logic as the original createContact function
          const signRosterData: SignRosterMemberType = {
            submittedWaiver: false,
            player: {
              submittedDriversLicense: false,
              firstYear: new Date().getFullYear(),
              contact: { id: result.contact.id },
            },
          };

          try {
            // Use the existing signPlayer function from useRosterDataManager
            await signPlayer(result.contact.id, signRosterData);

            setSuccessMessage(
              `Player "${result.contact.firstName} ${result.contact.lastName}" created and signed to roster successfully`,
            );
          } catch (signError) {
            // If roster signup fails, still show contact creation success
            setSuccessMessage(
              `Player "${result.contact.firstName} ${result.contact.lastName}" created successfully, but failed to sign to roster`,
            );
            console.error('Failed to sign player to roster:', signError);
          }
        } else {
          // For edit operations or create without roster signup
          if (result.isCreate) {
            // Refresh roster data to show the new contact in available players
            await fetchRosterData();
            setSuccessMessage(result.message);
          } else {
            // For edit operations, update the contact in the current roster data optimistically
            // This implements the same logic as the original updateContact function
            const updatedRosterData: TeamRosterMembersType = {
              ...rosterData,
              rosterMembers: rosterData.rosterMembers.map((member) =>
                member.player.contact.id === result.contact.id
                  ? {
                      ...member,
                      player: {
                        ...member.player,
                        contact: {
                          ...member.player.contact,
                          firstName: result.contact.firstName,
                          lastName: result.contact.lastName,
                          middleName: result.contact.middleName,
                          email: result.contact.email,
                          photoUrl: result.contact.photoUrl,
                          contactDetails: result.contact.contactDetails,
                        },
                      },
                    }
                  : member,
              ),
            };

            // Update the roster data state (same pattern as original)
            setRosterData(updatedRosterData);
            setSuccessMessage(result.message);
          }
        }

        // Dialog closes itself after calling onSuccess - no need to close here
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update roster');
      } finally {
        restoreScrollPosition();
      }
    },
    [
      autoSignToRoster,
      saveScrollPosition,
      restoreScrollPosition,
      setSuccessMessage,
      setError,
      signPlayer,
      fetchRosterData,
      rosterData,
      setRosterData,
    ],
  );

  // format helpers moved to reusable formatter module

  const handleManagerAssigned = useCallback(
    (result: { message: string; managerId: string }) => {
      setSuccessMessage(result.message);
      setAddManagerDialogOpen(false);
    },
    [setSuccessMessage],
  );

  const handleExportRoster = useCallback(async () => {
    try {
      setFormLoading(true);
      const result = await exportTeamRoster({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        throwOnError: false,
        parseAs: 'blob',
      });

      const blob = unwrapApiResult(result, 'Failed to export roster') as Blob;
      const teamName = rosterData?.teamSeason?.name ?? 'team';
      const sanitizedName = teamName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedName}-roster.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export roster');
    } finally {
      setFormLoading(false);
    }
  }, [apiClient, accountId, seasonId, teamSeasonId, rosterData?.teamSeason?.name, setError]);

  const handleDeleteSuccess = useCallback(
    (result: { message: string; memberId: string }) => {
      setSuccessMessage(result.message);
      setDeleteDialogOpen(false);
      setPlayerToDelete(null);
    },
    [setSuccessMessage],
  );

  // Memoized handlers to prevent UserAvatar re-renders
  const handleEditDialog = useCallback((member: RosterMemberType) => {
    return () => openEditDialog(member);
  }, []);

  const handlePhotoDelete = useCallback(
    (contactId: string) => {
      return deleteContactPhoto(contactId);
    },
    [deleteContactPhoto],
  );

  // Memoized player avatar component to prevent unnecessary re-renders
  const PlayerAvatar = useMemo(() => {
    const PlayerAvatarComponent = React.memo<{
      member: RosterMemberType;
      onEdit: () => void;
      onPhotoDelete: (contactId: string) => Promise<void>;
    }>(({ member, onEdit, onPhotoDelete }) => {
      const user = useMemo(
        () => ({
          id: member.player.contact.id,
          firstName: member.player.contact.firstName,
          lastName: member.player.contact.lastName,
          photoUrl: member.player.contact.photoUrl,
        }),
        [
          member.player.contact.id,
          member.player.contact.firstName,
          member.player.contact.lastName,
          member.player.contact.photoUrl,
        ],
      );

      return (
        <UserAvatar
          user={user}
          size={32}
          onClick={onEdit}
          showHoverEffects={true}
          enablePhotoActions={true}
          onPhotoDelete={onPhotoDelete}
        />
      );
    });
    // Set display name for debugging
    PlayerAvatarComponent.displayName = 'PlayerAvatarComponent';
    return PlayerAvatarComponent;
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!rosterData) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Failed to load roster data
        </Typography>
      </Box>
    );
  }

  // Sort roster members by last name, then first name, then middle name
  const sortedRosterMembers = [...rosterData.rosterMembers].sort((a, b) => {
    const aLast = a.player.contact.lastName || '';
    const bLast = b.player.contact.lastName || '';
    const aFirst = a.player.contact.firstName || '';
    const bFirst = b.player.contact.firstName || '';
    const aMiddle = a.player.contact.middleName || ''; // ✅ Use top-level middleName
    const bMiddle = b.player.contact.middleName || ''; // ✅ Use top-level middleName

    // Compare last names first
    if (aLast !== bLast) {
      return aLast.localeCompare(bLast);
    }
    // If last names are the same, compare first names
    if (aFirst !== bFirst) {
      return aFirst.localeCompare(bFirst);
    }
    // If first names are the same, compare middle names
    return aMiddle.localeCompare(bMiddle);
  });

  const activePlayers = sortedRosterMembers.filter((member) => !member.inactive);
  const inactivePlayers = sortedRosterMembers.filter((member) => member.inactive);

  return (
    <main className="min-h-screen bg-background">
      {/* Account Header */}
      <AccountPageHeader accountId={accountId} seasonName={season?.name} showSeasonInfo={true}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {league?.name
              ? `${league.name} – ${rosterData?.teamSeason?.name} Roster`
              : `${rosterData?.teamSeason?.name} Roster`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage team roster, players, and managers
          </Typography>
        </Box>
      </AccountPageHeader>

      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3, mt: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/account/${accountId}/seasons`);
          }}
        >
          Seasons
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/account/${accountId}/seasons/${seasonId}/league-seasons`);
          }}
        >
          {season?.name || 'Season'}
        </Link>
        <Typography color="text.primary">
          {league?.name
            ? `${league.name} – ${rosterData?.teamSeason?.name} Roster`
            : `${rosterData?.teamSeason?.name} Roster`}
        </Typography>
      </Breadcrumbs>

      {/* Action Buttons */}
      <Box
        sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3, gap: 2 }}
      >
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportRoster}
          disabled={formLoading}
        >
          Export Roster
        </Button>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={openCreatePlayerDialog}
          disabled={formLoading}
        >
          Create Player
        </Button>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={openSignPlayerDialog}
          disabled={formLoading}
        >
          Sign Player
        </Button>
      </Box>

      {/* Roster Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Players
              </Typography>
              <Typography variant="h4">{rosterData.rosterMembers.length}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Active Players
              </Typography>
              <Typography variant="h4">{activePlayers.length}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Released Players
              </Typography>
              <Typography variant="h4">{inactivePlayers.length}</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Managers Section */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <PageSectionHeader
          title="Team Managers"
          actions={
            <Button
              variant="outlined"
              startIcon={<ManagerIcon />}
              onClick={() => setAddManagerDialogOpen(true)}
              size="small"
            >
              Assign Manager
            </Button>
          }
          sx={{ mb: 2 }}
        />
        {managers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No managers assigned to this team.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {managers.map((manager) => (
              <Card
                key={manager.id}
                sx={{ minWidth: 220, display: 'flex', alignItems: 'center', p: 1 }}
              >
                <ManagerIcon color="primary" sx={{ mr: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {manager.contact.lastName}, {manager.contact.firstName}{' '}
                    {manager.contact.middleName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {manager.contact.email}
                  </Typography>
                </Box>
                <IconButton
                  color="error"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await removeManager(manager.id);
                    } catch {
                      // Error is handled by the data manager
                    }
                  }}
                  aria-label="Remove Manager"
                >
                  <DeleteIcon />
                </IconButton>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Active Players Table */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <PageSectionHeader title={`Active Players (${activePlayers.length})`} />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                {canShowRosterContactInfo && <TableCell>Contact Info</TableCell>}
                {canViewSensitiveRosterDetails && <TableCell>Verification</TableCell>}
                <TableCell sx={{ width: '280px', maxWidth: '280px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activePlayers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.playerNumber || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PlayerAvatar
                        member={member}
                        onEdit={handleEditDialog(member)}
                        onPhotoDelete={handlePhotoDelete}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {getContactDisplayName(member.player.contact)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          First Year: {member.player.firstYear || 'Not set'}
                        </Typography>
                      </Box>
                      {/* Manager badge/icon */}
                      {managers.some((m) => m.contact.id === member.player.contact.id) && (
                        <ManagerIcon color="primary" fontSize="small" titleAccess="Manager" />
                      )}
                    </Box>
                  </TableCell>
                  {canShowRosterContactInfo && (
                    <TableCell>{formatRosterContactInfo(member.player.contact)}</TableCell>
                  )}
                  {canViewSensitiveRosterDetails && (
                    <TableCell>
                      {formatRosterVerificationInfo(member, {
                        showWaiverStatus,
                        showIdentificationStatus,
                      })}
                    </TableCell>
                  )}
                  <TableCell sx={{ width: '280px', maxWidth: '280px' }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => openEditDialog(member)}
                        sx={{ minWidth: 'auto' }}
                      >
                        Edit Info
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<SportsIcon />}
                        onClick={() => openRosterDialog(member)}
                        sx={{ minWidth: 'auto' }}
                      >
                        Edit Roster
                      </Button>
                      {!member.inactive && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<BlockIcon />}
                          onClick={() => handleReleasePlayer(member)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Release
                        </Button>
                      )}
                      {member.inactive && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleActivatePlayer(member)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => openDeleteDialog(member)}
                        sx={{ minWidth: 'auto' }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {activePlayers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canViewSensitiveRosterDetails ? (canShowRosterContactInfo ? 5 : 4) : 3}
                    align="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      No active players
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Released Players Table */}
      {inactivePlayers.length > 0 && (
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <PageSectionHeader title={`Released Players (${inactivePlayers.length})`} />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  {canShowRosterContactInfo && <TableCell>Contact Info</TableCell>}
                  {canViewSensitiveRosterDetails && <TableCell>Verification</TableCell>}
                  <TableCell sx={{ width: '280px', maxWidth: '280px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactivePlayers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.playerNumber || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlayerAvatar
                          member={member}
                          onEdit={handleEditDialog(member)}
                          onPhotoDelete={handlePhotoDelete}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 'medium', textDecoration: 'line-through' }}
                          >
                            {getContactDisplayName(member.player.contact)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            First Year: {member.player.firstYear || 'Not set'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    {canShowRosterContactInfo && (
                      <TableCell>{formatRosterContactInfo(member.player.contact)}</TableCell>
                    )}
                    {canViewSensitiveRosterDetails && (
                      <TableCell>
                        {formatRosterVerificationInfo(member, {
                          showWaiverStatus,
                          showIdentificationStatus,
                        })}
                      </TableCell>
                    )}
                    <TableCell sx={{ width: '280px', maxWidth: '280px' }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => openEditDialog(member)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Edit Info
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SportsIcon />}
                          onClick={() => openRosterDialog(member)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Edit Roster
                        </Button>
                        {!member.inactive && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<BlockIcon />}
                            onClick={() => handleReleasePlayer(member)}
                            sx={{ minWidth: 'auto' }}
                          >
                            Release
                          </Button>
                        )}
                        {member.inactive && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleActivatePlayer(member)}
                            sx={{ minWidth: 'auto' }}
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => openDeleteDialog(member)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Sign Player Dialog */}
      <SignPlayerDialog
        open={signPlayerDialogOpen}
        onClose={closeSignPlayerDialog}
        accountId={accountId}
        seasonId={seasonId}
        teamSeasonId={teamSeasonId}
        mode={isSigningNewPlayer ? 'sign' : 'edit'}
        rosterMemberId={editingRosterMemberId}
        initialPlayer={selectedPlayer}
        initialRosterData={rosterFormData}
        onSuccess={handleRosterDialogSuccess}
        enableWaiverTracking={trackWaiverEnabled}
        enableIdentificationTracking={trackIdentificationEnabled}
      />

      {/* Delete Player Dialog */}
      <DeleteRosterMemberDialog
        open={deleteDialogOpen}
        member={playerToDelete}
        onClose={closeDeleteDialog}
        onSuccess={handleDeleteSuccess}
        deletePlayer={deletePlayer}
      />

      {/* Enhanced Edit Contact Dialog */}
      <EditContactDialog
        open={editPlayerDialogOpen}
        contact={editingContact}
        onClose={() => setEditPlayerDialogOpen(false)}
        onSuccess={handleEnhancedContactSuccess}
        accountId={accountId}
        mode={isCreatingNewPlayer ? 'create' : 'edit'}
        showRosterSignup={isCreatingNewPlayer}
        onRosterSignup={setAutoSignToRoster}
        initialRosterSignup={autoSignToRoster}
      />

      {/* Assign Manager Dialog */}
      <AssignTeamManagerDialog
        open={addManagerDialogOpen}
        onClose={() => setAddManagerDialogOpen(false)}
        onSuccess={handleManagerAssigned}
        addManager={addManager}
        availablePlayers={activePlayers}
        existingManagers={managers}
      />

      {/* Feedback Snackbar */}
      <Snackbar
        open={Boolean(error || successMessage)}
        autoHideDuration={6000}
        onClose={clearMessages}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {error ? (
          <Alert onClose={clearMessages} severity="error" variant="filled" sx={{ width: '100%' }}>
            {error}
          </Alert>
        ) : successMessage ? (
          <Alert onClose={clearMessages} severity="success" variant="filled" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
};

export default TeamRosterManagement;
