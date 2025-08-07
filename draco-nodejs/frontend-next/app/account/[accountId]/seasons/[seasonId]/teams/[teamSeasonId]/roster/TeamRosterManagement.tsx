'use client';

import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  SportsBasketball as SportsIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  SupervisorAccount as ManagerIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import EditContactDialog from '../../../../../../../../components/users/EditContactDialog';
import UserAvatar from '../../../../../../../../components/users/UserAvatar';
import { ContactUpdateData, Contact } from '../../../../../../../../types/users';
import { useRosterDataManager } from '../../../../../../../../hooks/useRosterDataManager';
import { useScrollPosition } from '../../../../../../../../hooks/useScrollPosition';
import { RosterFormData, RosterPlayer, RosterMember } from '../../../../../../../../types/roster';

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
  const [formLoading, setFormLoading] = useState(false);

  // Use the new data manager hook
  const {
    rosterData,
    availablePlayers,
    season,
    league,
    managers,
    loading,
    error,
    successMessage,
    fetchRosterData,
    fetchAvailablePlayers,
    fetchManagers,
    fetchSeasonData,
    fetchLeagueData,
    updateRosterMember,
    updateContact,
    signPlayer,
    releasePlayer,
    activatePlayer,
    deletePlayer,
    addManager,
    removeManager,
    createContact,
    deleteContactPhoto,
    clearError,
    clearSuccessMessage,
    setError,
  } = useRosterDataManager({
    accountId,
    seasonId,
    teamSeasonId,
  });

  // Use scroll position hook
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition();

  // Dialog states
  const [signPlayerDialogOpen, setSignPlayerDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Contact | RosterPlayer | null>(null);
  const [isSigningNewPlayer, setIsSigningNewPlayer] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<RosterMember | null>(null);

  // Sign player process states
  const [isSigningPlayer, setIsSigningPlayer] = useState(false);
  const [signingTimeout, setSigningTimeout] = useState<NodeJS.Timeout | null>(null);

  // Unified roster information dialog states
  const [rosterFormData, setRosterFormData] = useState<RosterFormData>({
    playerNumber: 0,
    submittedWaiver: false,
    submittedDriversLicense: false,
    firstYear: 0,
  });

  // Add at the top, after other dialog states
  const [addManagerDialogOpen, setAddManagerDialogOpen] = useState(false);
  const [selectedManagerContactId, setSelectedManagerContactId] = useState<string | null>(null);
  const [addManagerLoading, setAddManagerLoading] = useState(false);
  const [addManagerError, setAddManagerError] = useState<string | null>(null);

  // Enhanced dialog states for EditContactDialog
  const [editPlayerDialogOpen, setEditPlayerDialogOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<RosterMember | null>(null);
  const [isCreatingNewPlayer, setIsCreatingNewPlayer] = useState(false);
  const [autoSignToRoster, setAutoSignToRoster] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [phoneErrors, setPhoneErrors] = useState({
    phone1: '',
    phone2: '',
    phone3: '',
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [emailError, setEmailError] = useState('');

  // Initialize data on mount
  useEffect(() => {
    fetchRosterData();
    fetchSeasonData();
    fetchLeagueData();
    fetchManagers();
  }, [fetchRosterData, fetchSeasonData, fetchLeagueData, fetchManagers]);

  useEffect(() => {
    if (signPlayerDialogOpen) {
      fetchAvailablePlayers();
    }
  }, [signPlayerDialogOpen, fetchAvailablePlayers]);

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

  useEffect(() => {
    if (signPlayerDialogOpen) {
      fetchAvailablePlayers();
    }
  }, [signPlayerDialogOpen, fetchAvailablePlayers]);

  const handleSignPlayer = async () => {
    if (!selectedPlayer) {
      setError('Missing required data');
      return;
    }

    setIsSigningPlayer(true);
    setFormLoading(true);
    saveScrollPosition();
    clearMessages();

    // Set up timeout for 15 seconds
    const timeoutId = setTimeout(() => {
      setIsSigningPlayer(false);
      setFormLoading(false);
      setError('Signing player took too long. Please try again or check your connection.');
      restoreScrollPosition();
    }, 15000);

    setSigningTimeout(timeoutId);

    try {
      await signPlayer(selectedPlayer.id, rosterFormData);

      // Clear timeout since operation succeeded
      if (signingTimeout) {
        clearTimeout(signingTimeout);
        setSigningTimeout(null);
      }

      setIsSigningPlayer(false);
      setFormLoading(false);
      closeSignPlayerDialog();
    } catch {
      // Clear timeout since operation failed
      if (signingTimeout) {
        clearTimeout(signingTimeout);
        setSigningTimeout(null);
      }

      setIsSigningPlayer(false);
      setFormLoading(false);
      // Error is handled by the data manager, but we keep dialog open
      // Don't call closeSignPlayerDialog() here - let user see the error
    } finally {
      restoreScrollPosition();
    }
  };

  // Handler to release player
  const handleReleasePlayer = async (rosterMember: RosterMember) => {
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
  const handleActivatePlayer = async (rosterMember: RosterMember) => {
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

  // Handler to delete player
  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;

    setFormLoading(true);
    saveScrollPosition();

    try {
      await deletePlayer(playerToDelete.id);
      setDeleteDialogOpen(false);
      setPlayerToDelete(null);
    } catch {
      // Error is handled by the data manager
    } finally {
      setFormLoading(false);
      restoreScrollPosition();
    }
  };

  // Handler to edit player (legacy - replaced by handleEnhancedContactSave)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEditPlayer = async () => {
    // This function is kept for compatibility but is no longer used
    // The enhanced contact save handler is used instead
  };

  // Open delete dialog
  const openDeleteDialog = (rosterMember: RosterMember) => {
    setPlayerToDelete(rosterMember);
    setDeleteDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (rosterMember: RosterMember) => {
    setIsCreatingNewPlayer(false);
    setAutoSignToRoster(false);
    setPlayerToEdit(rosterMember);

    // Convert roster member contact to enhanced dialog format
    const contact = {
      id: rosterMember.player.contact.id,
      firstName: rosterMember.player.contact.firstName || '',
      lastName: rosterMember.player.contact.lastName || '',
      middleName: rosterMember.player.contact.middleName || '', // ✅ Use top-level middleName
      email: rosterMember.player.contact.email || '',
      contactDetails: {
        phone1: rosterMember.player.contact.contactDetails?.phone1 || '',
        phone2: rosterMember.player.contact.contactDetails?.phone2 || '',
        phone3: rosterMember.player.contact.contactDetails?.phone3 || '',
        streetaddress: rosterMember.player.contact.contactDetails?.streetaddress || '',
        city: rosterMember.player.contact.contactDetails?.city || '',
        state: rosterMember.player.contact.contactDetails?.state || '',
        zip: rosterMember.player.contact.contactDetails?.zip || '',
        dateofbirth: rosterMember.player.contact.contactDetails?.dateofbirth || '',
        // ❌ Removed: middlename (moved to top-level middleName)
      },
      photoUrl: (rosterMember.player.contact as any).photoUrl || undefined, // eslint-disable-line @typescript-eslint/no-explicit-any
    };

    setEditingContact(contact);

    setPhoneErrors({ phone1: '', phone2: '', phone3: '' });
    setEditPlayerDialogOpen(true);
  };

  const openCreatePlayerDialog = () => {
    setIsCreatingNewPlayer(true);
    setAutoSignToRoster(true);
    setPlayerToEdit(null);
    setEditingContact(null); // No contact when creating new
    setPhoneErrors({ phone1: '', phone2: '', phone3: '' });
    setEditPlayerDialogOpen(true);
  };

  // Clear messages
  const clearMessages = () => {
    clearError();
    clearSuccessMessage();
  };

  // Close sign player dialog
  const closeSignPlayerDialog = () => {
    // Don't allow closing if we're currently signing a player
    if (isSigningPlayer) {
      return;
    }

    // Clear any existing timeout
    if (signingTimeout) {
      clearTimeout(signingTimeout);
      setSigningTimeout(null);
    }

    setSignPlayerDialogOpen(false);
    setSelectedPlayer(null);
    setRosterFormData({
      playerNumber: 0,
      submittedWaiver: false,
      submittedDriversLicense: false,
      firstYear: 0,
    });
    setIsSigningNewPlayer(false);
    setIsSigningPlayer(false);
    clearMessages();
  };

  // Close delete dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  // Close edit dialog
  const closeEditDialog = () => {
    setEditPlayerDialogOpen(false);
    setPlayerToEdit(null);
    setIsCreatingNewPlayer(false);
    setAutoSignToRoster(false);
    setEditingContact(null);
    setPhoneErrors({ phone1: '', phone2: '', phone3: '' });
    setEmailError('');
    clearMessages();
  };

  // Open sign player dialog
  const openSignPlayerDialog = () => {
    setIsSigningNewPlayer(true);
    setSelectedPlayer(null);
    setRosterFormData({
      playerNumber: 0,
      submittedWaiver: false,
      submittedDriversLicense: false,
      firstYear: 0,
    });
    setSignPlayerDialogOpen(true);
  };

  // Open roster dialog
  const openRosterDialog = (rosterMember: RosterMember) => {
    setIsSigningNewPlayer(false);
    setSelectedPlayer(rosterMember.player);
    setRosterFormData({
      playerNumber: rosterMember.playerNumber,
      submittedWaiver: rosterMember.submittedWaiver,
      submittedDriversLicense: rosterMember.player.submittedDriversLicense,
      firstYear: rosterMember.player.firstYear,
    });
    setSignPlayerDialogOpen(true);
  };

  const handleSaveRosterInfo = async () => {
    if (!selectedPlayer || !rosterData) {
      setError('Missing required data');
      return;
    }

    // Find the roster member to update
    const rosterMember = rosterData.rosterMembers.find(
      (member) => member.player.id === selectedPlayer.id,
    );
    if (!rosterMember) {
      setError('Roster member not found');
      return;
    }

    setFormLoading(true);
    saveScrollPosition();

    try {
      await updateRosterMember(rosterMember.id, rosterFormData);
      closeSignPlayerDialog();
    } catch {
      // Error is handled by the data manager
    } finally {
      setFormLoading(false);
      restoreScrollPosition();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreatePlayer = async () => {
    // This function is kept for compatibility but is no longer used
    // The enhanced contact save handler is used instead
  };

  // Enhanced contact save handler for EditContactDialog
  const handleEnhancedContactSave = async (
    contactData: ContactUpdateData,
    photoFile?: File | null,
  ) => {
    console.log('RosterManagement: handleEnhancedContactSave called', {
      contactData,
      hasPhotoFile: !!photoFile,
      photoFileName: photoFile?.name,
      photoFileSize: photoFile?.size,
      isCreatingNewPlayer,
    });

    setFormLoading(true);
    saveScrollPosition();

    try {
      if (isCreatingNewPlayer) {
        await createContact(contactData, photoFile, autoSignToRoster);
      } else if (playerToEdit) {
        await updateContact(playerToEdit.player.contactId, contactData, photoFile);
      }
    } catch (error) {
      // Reset loading and scroll state, then propagate error to dialog
      setFormLoading(false);
      restoreScrollPosition();
      throw error;
    }

    // Success case - cleanup and close dialog will be handled by the data manager operations
    setFormLoading(false);
    restoreScrollPosition();
  };

  // Helper function to format phone numbers as (111) 222-3333 (legacy - not used with enhanced dialog)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');

    // Limit to exactly 10 digits
    const limitedNumber = phoneNumber.slice(0, 10);

    // Format based on length
    if (limitedNumber.length === 0) return '';
    if (limitedNumber.length <= 3) return `(${limitedNumber}`;
    if (limitedNumber.length <= 6)
      return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6, 10)}`;
  };

  // Helper function to validate phone numbers (legacy - not used with enhanced dialog)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length === 0 || digits.length === 10;
  };

  // Helper function to format all contact information
  const formatContactInfo = (contact: Contact) => {
    const info = [];

    // Address first
    if (
      contact.contactDetails?.streetaddress ||
      contact.contactDetails?.city ||
      contact.contactDetails?.state ||
      contact.contactDetails?.zip
    ) {
      const addressParts = [
        contact.contactDetails?.streetaddress,
        contact.contactDetails?.city,
        contact.contactDetails?.state,
        contact.contactDetails?.zip,
      ].filter(Boolean);

      if (addressParts.length > 0) {
        const fullAddress = addressParts.join(', ');
        const streetAddress = contact.contactDetails?.streetaddress || '';
        const cityStateZip = [
          contact.contactDetails?.city,
          contact.contactDetails?.state,
          contact.contactDetails?.zip,
        ]
          .filter(Boolean)
          .join(', ');

        info.push(
          <Link
            href={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
              display: 'block',
            }}
          >
            {streetAddress && <span style={{ display: 'block' }}>{streetAddress}</span>}
            {cityStateZip && <span style={{ display: 'block' }}>{cityStateZip}</span>}
          </Link>,
        );
      }
    }

    // Email second
    if (contact.email) {
      info.push(
        <Link
          href={`mailto:${contact.email}`}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {contact.email}
        </Link>,
      );
    }

    // Phone numbers last - use individual phone fields from contactDetails
    if (contact.contactDetails?.phone1)
      info.push(
        <Link
          href={`tel:${contact.contactDetails.phone1.replace(/\D/g, '')}`}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          home: {contact.contactDetails.phone1}
        </Link>,
      );
    if (contact.contactDetails?.phone2)
      info.push(
        <Link
          href={`tel:${contact.contactDetails.phone2.replace(/\D/g, '')}`}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          cell: {contact.contactDetails.phone2}
        </Link>,
      );
    if (contact.contactDetails?.phone3)
      info.push(
        <Link
          href={`tel:${contact.contactDetails.phone3.replace(/\D/g, '')}`}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          work: {contact.contactDetails.phone3}
        </Link>,
      );

    if (info.length === 0) {
      return '-';
    }

    return (
      <Table size="small" sx={{ minWidth: 0 }}>
        <TableBody>
          {info.map((item, index) => (
            <TableRow key={index} sx={{ '& td': { border: 0, py: 0.5 } }}>
              <TableCell sx={{ py: 0, px: 0 }}>
                <Typography variant="body2" fontSize="0.75rem">
                  {item}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Helper function to format names as "Last, First Middle"
  const formatName = (contact: Contact) => {
    const lastName = contact.lastName || '';
    const firstName = contact.firstName || '';
    const middleName = contact.middleName || ''; // ✅ Use top-level middleName

    let formattedName = lastName;
    if (firstName) {
      formattedName += `, ${firstName}`;
    }
    if (middleName) {
      formattedName += ` ${middleName}`;
    }

    return formattedName;
  };

  // Helper function to format verification information
  const formatVerificationInfo = (member: RosterMember) => {
    const info = [];

    // Age and Date of Birth first
    if (
      member.player.contact.contactDetails?.dateofbirth &&
      typeof member.player.contact.contactDetails.dateofbirth === 'string'
    ) {
      try {
        const birthDate = parseISO(member.player.contact.contactDetails.dateofbirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Adjust age if birthday hasn't occurred this year
        const adjustedAge =
          monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ? age - 1
            : age;

        const birthMonthYear = format(birthDate, 'MMM yyyy');

        info.push(
          <span key="age" style={{ display: 'block' }}>
            Age: {adjustedAge} ({birthMonthYear})
          </span>,
        );
      } catch {}
    }

    // Date Added
    if (member.dateAdded && typeof member.dateAdded === 'string') {
      try {
        info.push(
          <span key="dateadded" style={{ display: 'block' }}>
            Date Added: {format(parseISO(member.dateAdded), 'MMM dd, yyyy')}
          </span>,
        );
      } catch {}
    }

    // Submitted Waiver
    info.push(
      <span key="waiver" style={{ display: 'block' }}>
        Submitted Waiver: {member.submittedWaiver ? 'Yes' : 'No'}
      </span>,
    );

    // Submitted Driver's License
    info.push(
      <span key="license" style={{ display: 'block' }}>
        {"Submitted Driver's License: "}
        {member.player.submittedDriversLicense ? 'Yes' : 'No'}
      </span>,
    );

    return info.length > 0 ? info : ['No verification data'];
  };

  const handleAddManager = async () => {
    if (!selectedManagerContactId) return;
    setAddManagerLoading(true);
    setAddManagerError(null);
    saveScrollPosition();

    try {
      await addManager(selectedManagerContactId);
      setAddManagerDialogOpen(false);
      setSelectedManagerContactId(null);
    } catch {
      // Error is handled by the data manager
    } finally {
      setAddManagerLoading(false);
      restoreScrollPosition();
    }
  };

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
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
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

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {league?.name
              ? `${league.name} – ${rosterData?.teamSeason?.name} Roster`
              : `${rosterData?.teamSeason?.name} Roster`}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3, gap: 2 }}
      >
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

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={clearMessages}>
          {successMessage}
        </Alert>
      )}

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
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 2 }}
        >
          <Typography variant="h6" color="primary">
            Team Managers
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ManagerIcon />}
            onClick={() => setAddManagerDialogOpen(true)}
            size="small"
          >
            Assign Manager
          </Button>
        </Box>
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
          <Typography variant="h6" color="success.main">
            Active Players ({activePlayers.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Contact Info</TableCell>
                <TableCell>Verification</TableCell>
                <TableCell sx={{ width: '280px', maxWidth: '280px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activePlayers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.playerNumber || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UserAvatar
                        user={{
                          id: member.player.contact.id,
                          firstName: member.player.contact.firstName,
                          lastName: member.player.contact.lastName,
                          photoUrl: member.player.contact.photoUrl,
                        }}
                        size={32}
                        onClick={() => openEditDialog(member)}
                        showHoverEffects={true}
                        enablePhotoActions={true}
                        onPhotoDelete={async (contactId: string) => {
                          await deleteContactPhoto(contactId);
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {formatName(member.player.contact)}
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
                  <TableCell>{formatContactInfo(member.player.contact)}</TableCell>
                  <TableCell>{formatVerificationInfo(member)}</TableCell>
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
                  <TableCell colSpan={5} align="center">
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
            <Typography variant="h6" color="warning.main">
              Released Players ({inactivePlayers.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact Info</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell sx={{ width: '280px', maxWidth: '280px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactivePlayers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.playerNumber || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UserAvatar
                          user={{
                            id: member.player.contact.id,
                            firstName: member.player.contact.firstName,
                            lastName: member.player.contact.lastName,
                            photoUrl: member.player.contact.photoUrl,
                          }}
                          size={32}
                          onClick={() => openEditDialog(member)}
                          showHoverEffects={true}
                          enablePhotoActions={true}
                          onPhotoDelete={async (contactId: string) => {
                            await deleteContactPhoto(contactId);
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 'medium', textDecoration: 'line-through' }}
                          >
                            {formatName(member.player.contact)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            First Year: {member.player.firstYear || 'Not set'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{formatContactInfo(member.player.contact)}</TableCell>
                    <TableCell>{formatVerificationInfo(member)}</TableCell>
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

      {/* Unified Sign Player / Edit Roster Dialog */}
      <Dialog
        open={signPlayerDialogOpen}
        onClose={isSigningPlayer ? undefined : closeSignPlayerDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isSigningNewPlayer ? 'Sign Player to Roster' : 'Edit Roster Information'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>
                {error}
              </Alert>
            )}

            {/* Info Alert for signing new players */}
            {isSigningNewPlayer && (
              <Alert severity="info" sx={{ mb: 2 }}>
                When you select a player, their existing roster information (first year,
                {"driver's license status) will be pre-filled. You can modify these values as "}
                needed.
              </Alert>
            )}

            {/* Player Selection (only for signing new players) */}
            {isSigningNewPlayer && (
              <Autocomplete
                options={availablePlayers}
                getOptionLabel={(option) => {
                  // Handle Contact objects directly
                  const last = option.lastName || '';
                  const first = option.firstName || '';
                  const middle = option.middleName || ''; // ✅ Use top-level middleName
                  return `${last}${first ? ', ' + first : ''}${middle ? ' ' + middle : ''}`.trim();
                }}
                value={
                  isSigningNewPlayer && selectedPlayer && 'firstName' in selectedPlayer
                    ? selectedPlayer
                    : null
                }
                onChange={(_, newValue) => {
                  if (newValue) {
                    // For Contact objects, we don't have firstYear or submittedDriversLicense
                    // These will be set to defaults when the player is signed
                    setSelectedPlayer(newValue);
                    setRosterFormData({
                      ...rosterFormData,
                      firstYear: 0,
                      submittedDriversLicense: false,
                    });
                  } else {
                    setSelectedPlayer(null);
                    setRosterFormData({
                      ...rosterFormData,
                      firstYear: 0,
                      submittedDriversLicense: false,
                    });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Player"
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                )}
                noOptionsText={
                  availablePlayers.length === 0 ? 'No available players' : 'No players found'
                }
              />
            )}

            {/* Player Name Display (only for editing existing players) */}
            {!isSigningNewPlayer && selectedPlayer && 'contact' in selectedPlayer && (
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                {formatName(selectedPlayer.contact)}
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Player Number"
                type="number"
                value={rosterFormData.playerNumber}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setRosterFormData({ ...rosterFormData, playerNumber: Math.max(0, value) });
                }}
                inputProps={{ min: 0 }}
                fullWidth
                variant="outlined"
                helperText="Enter the player's jersey number (0 for no number)"
                error={rosterFormData.playerNumber < 0}
              />

              <TextField
                label="First Year"
                type="number"
                value={rosterFormData.firstYear}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setRosterFormData({ ...rosterFormData, firstYear: Math.max(0, value) });
                }}
                inputProps={{ min: 0 }}
                fullWidth
                variant="outlined"
                helperText="Enter the player's first year in the league"
                error={rosterFormData.firstYear < 0}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={rosterFormData.submittedWaiver}
                    onChange={(e) =>
                      setRosterFormData({ ...rosterFormData, submittedWaiver: e.target.checked })
                    }
                  />
                }
                label="Submitted Waiver"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={rosterFormData.submittedDriversLicense}
                    onChange={(e) =>
                      setRosterFormData({
                        ...rosterFormData,
                        submittedDriversLicense: e.target.checked,
                      })
                    }
                  />
                }
                label="Submitted Driver's License"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSignPlayerDialog} disabled={isSigningPlayer}>
            Cancel
          </Button>
          <Button
            onClick={isSigningNewPlayer ? handleSignPlayer : handleSaveRosterInfo}
            variant="contained"
            disabled={isSigningNewPlayer ? !selectedPlayer || isSigningPlayer : formLoading}
            startIcon={
              isSigningPlayer ? (
                <CircularProgress size={20} />
              ) : isSigningNewPlayer ? (
                <PersonAddIcon />
              ) : (
                <SportsIcon />
              )
            }
          >
            {isSigningPlayer
              ? 'Signing...'
              : isSigningNewPlayer
                ? 'Sign Player'
                : 'Save Roster Info'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Player Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <WarningIcon color="error" sx={{ mr: 1 }} />
            Delete Player
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete{' '}
            <strong>{playerToDelete ? formatName(playerToDelete.player.contact) : ''}</strong> from
            the roster?
          </Typography>
          <Alert severity="warning">
            This action cannot be undone. The player will be permanently removed from the team
            roster.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeletePlayer}
            variant="contained"
            color="error"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete Player
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Edit Contact Dialog */}
      <EditContactDialog
        open={editPlayerDialogOpen}
        contact={editingContact}
        onClose={closeEditDialog}
        onSave={handleEnhancedContactSave}
        loading={formLoading}
        mode={isCreatingNewPlayer ? 'create' : 'edit'}
        showRosterSignup={isCreatingNewPlayer}
        onRosterSignup={setAutoSignToRoster}
        initialRosterSignup={autoSignToRoster}
      />

      {/* Assign Manager Dialog */}
      <Dialog
        open={addManagerDialogOpen}
        onClose={() => setAddManagerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Team Manager</DialogTitle>
        <DialogContent>
          {addManagerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addManagerError}
            </Alert>
          )}
          <Autocomplete
            options={activePlayers.filter(
              (member) => !managers.some((m) => m.contact.id === member.player.contact.id),
            )}
            getOptionLabel={(option) => formatName(option.player.contact)}
            value={
              activePlayers.find(
                (member) => member.player.contact.id === selectedManagerContactId,
              ) || null
            }
            onChange={(_, newValue) =>
              setSelectedManagerContactId(newValue ? newValue.player.contact.id : null)
            }
            renderInput={(params) => (
              <TextField {...params} label="Select Player" fullWidth variant="outlined" />
            )}
            noOptionsText={activePlayers.length === 0 ? 'No active players' : 'No eligible players'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddManagerDialogOpen(false)} disabled={addManagerLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAddManager}
            variant="contained"
            disabled={!selectedManagerContactId || addManagerLoading}
            startIcon={addManagerLoading ? <CircularProgress size={20} /> : <ManagerIcon />}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default TeamRosterManagement;
