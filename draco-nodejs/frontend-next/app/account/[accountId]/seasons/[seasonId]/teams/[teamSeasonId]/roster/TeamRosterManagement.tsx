'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '../../../../../../../../context/AuthContext';
import axios from 'axios';
import { isEmail } from 'validator';
import { format, parseISO } from 'date-fns';
import EditContactDialog from '../../../../../../../../components/users/EditContactDialog';
import UserAvatar from '../../../../../../../../components/users/UserAvatar';
import { ContactUpdateData, Contact } from '../../../../../../../../types/users';
import { UserManagementService } from '../../../../../../../../services/userManagementService';
import { ContactTransformationService } from '../../../../../../../../services/contactTransformationService';

interface RosterPlayer {
  id: string;
  contactId: string;
  submittedDriversLicense: boolean;
  firstYear: number;
  contact: Contact;
}

interface RosterMember {
  id: string;
  playerNumber: number;
  inactive: boolean;
  submittedWaiver: boolean;
  dateAdded: string;
  player: RosterPlayer;
}

interface TeamSeason {
  id: string;
  name: string;
}

interface Season {
  id: string;
  name: string;
}

interface League {
  id: string;
  name: string;
}

interface TeamRosterData {
  teamSeason: TeamSeason;
  rosterMembers: RosterMember[];
}

interface ManagerType {
  id: string;
  teamseasonid: string;
  contactid: string;
  contacts: Contact;
}

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
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<TeamRosterData | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<RosterPlayer[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [managers, setManagers] = useState<ManagerType[]>([]);

  // Dialog states
  const [signPlayerDialogOpen, setSignPlayerDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const [isSigningNewPlayer, setIsSigningNewPlayer] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<RosterMember | null>(null);

  // Unified roster information dialog states
  const [rosterFormData, setRosterFormData] = useState({
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
  const [editFormData, setEditFormData] = useState({
    firstname: '',
    lastname: '',
    middlename: '',
    email: '',
    phone1: '',
    phone2: '',
    phone3: '',
    streetaddress: '',
    city: '',
    state: '',
    zip: '',
    dateofbirth: '',
  });

  const { token } = useAuth();

  // Initialize UserManagementService for consistent contact updates
  const userService = token ? new UserManagementService(token) : null;

  // Fetch roster data
  const fetchRosterData = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const data = response.data.data;
        // Transform contact data to use camelCase fields
        const transformedData = {
          ...data,
          rosterMembers:
            data.rosterMembers?.map((member: Record<string, unknown>) => ({
              ...member,
              player: {
                ...(member.player as Record<string, unknown>),
                contact: ContactTransformationService.transformBackendContact(
                  (member.player as Record<string, unknown>)?.contact as Record<string, unknown>,
                ),
              },
            })) || [],
        };
        setRosterData(transformedData);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch roster data');
      }
    } finally {
      setLoading(false);
    }
  }, [accountId, seasonId, teamSeasonId, token]);

  // Fetch available players
  const fetchAvailablePlayers = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/available-players`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const players = response.data.data.availablePlayers || [];
        // Transform contact data to use camelCase fields
        const transformedPlayers = players.map((player: Record<string, unknown>) => ({
          ...player,
          contact: ContactTransformationService.transformBackendContact(
            player.contact as Record<string, unknown>,
          ),
        }));
        setAvailablePlayers(transformedPlayers);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch available players');
      }
    }
  }, [accountId, seasonId, teamSeasonId, token]);

  // Fetch season data
  const fetchSeasonData = useCallback(async () => {
    if (!accountId || !seasonId || !token) return;

    try {
      const response = await axios.get(`/api/accounts/${accountId}/seasons/${seasonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSeason(response.data.data.season);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch season data');
      }
    }
  }, [accountId, seasonId, token]);

  // Fetch league data
  const fetchLeagueData = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/league`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setLeague(response.data.data);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch league data');
      }
    }
  }, [accountId, seasonId, teamSeasonId, token]);

  // Fetch managers
  const fetchManagers = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;
    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/managers`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        const managers = response.data.data || [];
        // Transform contact data to use camelCase fields
        const transformedManagers = managers.map((manager: Record<string, unknown>) => ({
          ...manager,
          contacts: ContactTransformationService.transformBackendContact(
            manager.contacts as Record<string, unknown>,
          ),
        }));
        setManagers(transformedManagers);
      }
    } catch {
      // Optionally set error
    }
  }, [accountId, seasonId, teamSeasonId, token]);

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
    token,
  ]);

  useEffect(() => {
    if (signPlayerDialogOpen) {
      fetchAvailablePlayers();
    }
  }, [signPlayerDialogOpen, fetchAvailablePlayers]);

  const handleSignPlayer = async () => {
    if (!selectedPlayer || !accountId || !seasonId || !teamSeasonId || !token) {
      setError('Missing required data');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        {
          playerId: selectedPlayer.id,
          playerNumber: rosterFormData.playerNumber,
          submittedWaiver: rosterFormData.submittedWaiver,
          submittedDriversLicense: rosterFormData.submittedDriversLicense,
          firstYear: rosterFormData.firstYear,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage('Player signed successfully');
        closeSignPlayerDialog();
        fetchRosterData();
        fetchAvailablePlayers();
      } else {
        setError(response.data.message || 'Failed to sign player');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to sign player');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to release player
  const handleReleasePlayer = async (rosterMember: RosterMember) => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    setFormLoading(true);
    try {
      const response = await axios.put(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMember.id}/release`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        fetchRosterData();
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to release player');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to activate player
  const handleActivatePlayer = async (rosterMember: RosterMember) => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    setFormLoading(true);
    try {
      const response = await axios.put(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMember.id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        fetchRosterData();
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to activate player');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to delete player
  const handleDeletePlayer = async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token || !playerToDelete) return;

    setFormLoading(true);
    try {
      const response = await axios.delete(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${playerToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setDeleteDialogOpen(false);
        setPlayerToDelete(null);
        fetchRosterData();
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to delete player');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to edit player (legacy - replaced by handleEnhancedContactSave)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEditPlayer = async () => {
    if (!playerToEdit || !accountId || !token) {
      setError('Missing required data');
      return;
    }

    // Validate required fields
    if (!editFormData.firstname || !editFormData.lastname) {
      setError('First name and last name are required');
      return;
    }

    // Validate email
    if (!validateEmail(editFormData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone numbers
    if (!validateAllPhoneNumbers()) {
      setError('Please fix phone number errors before saving');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `/api/accounts/${accountId}/contacts/${playerToEdit.player.contactId}`,
        {
          firstname: editFormData.firstname,
          lastname: editFormData.lastname,
          middlename: editFormData.middlename,
          email: editFormData.email,
          phone1: editFormData.phone1,
          phone2: editFormData.phone2,
          phone3: editFormData.phone3,
          streetaddress: editFormData.streetaddress,
          city: editFormData.city,
          state: editFormData.state,
          zip: editFormData.zip,
          dateofbirth: editFormData.dateofbirth,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage('Player information updated successfully');
        closeEditDialog();
        fetchRosterData();
        fetchAvailablePlayers();
      } else {
        setError(response.data.message || 'Failed to update player information');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update player information');
      }
    } finally {
      setFormLoading(false);
    }
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
      email: rosterMember.player.contact.email || '',
      contactDetails: {
        middlename: rosterMember.player.contact.contactDetails?.middlename || '',
        phone1: rosterMember.player.contact.contactDetails?.phone1 || '',
        phone2: rosterMember.player.contact.contactDetails?.phone2 || '',
        phone3: rosterMember.player.contact.contactDetails?.phone3 || '',
        streetaddress: rosterMember.player.contact.contactDetails?.streetaddress || '',
        city: rosterMember.player.contact.contactDetails?.city || '',
        state: rosterMember.player.contact.contactDetails?.state || '',
        zip: rosterMember.player.contact.contactDetails?.zip || '',
        dateofbirth: rosterMember.player.contact.contactDetails?.dateofbirth || '',
      },
      photoUrl: (rosterMember.player.contact as any).photoUrl || undefined, // eslint-disable-line @typescript-eslint/no-explicit-any
    };

    setEditingContact(contact);
    setEditFormData({
      firstname: rosterMember.player.contact.firstName || '',
      lastname: rosterMember.player.contact.lastName || '',
      middlename: rosterMember.player.contact.contactDetails?.middlename || '',
      email: rosterMember.player.contact.email || '',
      phone1: rosterMember.player.contact.contactDetails?.phone1 || '',
      phone2: rosterMember.player.contact.contactDetails?.phone2 || '',
      phone3: rosterMember.player.contact.contactDetails?.phone3 || '',
      streetaddress: rosterMember.player.contact.contactDetails?.streetaddress || '',
      city: rosterMember.player.contact.contactDetails?.city || '',
      state: rosterMember.player.contact.contactDetails?.state || '',
      zip: rosterMember.player.contact.contactDetails?.zip || '',
      dateofbirth: rosterMember.player.contact.contactDetails?.dateofbirth
        ? rosterMember.player.contact.contactDetails.dateofbirth.split('T')[0]
        : '',
    });
    setPhoneErrors({ phone1: '', phone2: '', phone3: '' });
    setEditPlayerDialogOpen(true);
  };

  const openCreatePlayerDialog = () => {
    setIsCreatingNewPlayer(true);
    setAutoSignToRoster(true);
    setPlayerToEdit(null);
    setEditingContact(null); // No contact when creating new
    setEditFormData({
      firstname: '',
      lastname: '',
      middlename: '',
      email: '',
      phone1: '',
      phone2: '',
      phone3: '',
      streetaddress: '',
      city: '',
      state: '',
      zip: '',
      dateofbirth: '',
    });
    setPhoneErrors({ phone1: '', phone2: '', phone3: '' });
    setEditPlayerDialogOpen(true);
  };

  // Clear messages
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // Close sign player dialog
  const closeSignPlayerDialog = () => {
    setSignPlayerDialogOpen(false);
    setSelectedPlayer(null);
    setRosterFormData({
      playerNumber: 0,
      submittedWaiver: false,
      submittedDriversLicense: false,
      firstYear: 0,
    });
    setIsSigningNewPlayer(false);
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
    setEditFormData({
      firstname: '',
      lastname: '',
      middlename: '',
      email: '',
      phone1: '',
      phone2: '',
      phone3: '',
      streetaddress: '',
      city: '',
      state: '',
      zip: '',
      dateofbirth: '',
    });
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
    if (!selectedPlayer || !accountId || !seasonId || !teamSeasonId || !token) {
      setError('Missing required data');
      return;
    }

    // Find the roster member to update
    const rosterMember = rosterData?.rosterMembers.find(
      (member) => member.player.id === selectedPlayer.id,
    );
    if (!rosterMember) {
      setError('Roster member not found');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMember.id}/update`,
        {
          playerNumber: rosterFormData.playerNumber,
          submittedWaiver: rosterFormData.submittedWaiver,
          submittedDriversLicense: rosterFormData.submittedDriversLicense,
          firstYear: rosterFormData.firstYear,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage('Roster information updated successfully');
        closeSignPlayerDialog();
        fetchRosterData();
      } else {
        setError(response.data.message || 'Failed to update roster information');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update roster information');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreatePlayer = async () => {
    if (!accountId || !token) {
      setError('Missing required data');
      return;
    }

    // Validate required fields
    if (!editFormData.firstname || !editFormData.lastname) {
      setError('First name and last name are required');
      return;
    }

    // Validate email
    if (!validateEmail(editFormData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone numbers
    if (!validateAllPhoneNumbers()) {
      setError('Please fix phone number errors before saving');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      // Create the new player
      const createResponse = await axios.post(
        `/api/accounts/${accountId}/contacts`,
        {
          firstname: editFormData.firstname,
          lastname: editFormData.lastname,
          middlename: editFormData.middlename,
          email: editFormData.email,
          phone1: editFormData.phone1,
          phone2: editFormData.phone2,
          phone3: editFormData.phone3,
          streetaddress: editFormData.streetaddress,
          city: editFormData.city,
          state: editFormData.state,
          zip: editFormData.zip,
          dateofbirth: editFormData.dateofbirth,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (createResponse.data.success) {
        const newContact = createResponse.data.data.contact;

        // Create the roster entry for the new player
        const rosterResponse = await axios.post(
          `/api/accounts/${accountId}/roster`,
          {
            contactId: newContact.id,
            submittedDriversLicense: false,
            firstYear: 0,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (rosterResponse.data.success) {
          const newPlayer = rosterResponse.data.data.player;

          // If auto-sign is enabled, add to team roster
          if (autoSignToRoster && seasonId && teamSeasonId) {
            const signResponse = await axios.post(
              `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
              {
                playerId: newPlayer.id,
                playerNumber: 0,
                submittedWaiver: false,
                submittedDriversLicense: false,
                firstYear: 0,
              },
              { headers: { Authorization: `Bearer ${token}` } },
            );

            if (signResponse.data.success) {
              setSuccessMessage(
                `Player "${editFormData.firstname} ${editFormData.lastname}" created and signed to roster successfully`,
              );
            } else {
              setSuccessMessage(
                `Player "${editFormData.firstname} ${editFormData.lastname}" created successfully but failed to sign to roster`,
              );
            }
          } else {
            setSuccessMessage(
              `Player "${editFormData.firstname} ${editFormData.lastname}" created successfully`,
            );
          }

          closeEditDialog();
          fetchRosterData();
          fetchAvailablePlayers();
        } else {
          setError('Failed to create roster entry for new player');
        }
      } else {
        setError(createResponse.data.message || 'Failed to create player');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to create player');
      }
    } finally {
      setFormLoading(false);
    }
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

    if (!userService) {
      setError('Authentication required');
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      if (isCreatingNewPlayer) {
        // Create new contact using UserManagementService
        const newContact = await userService.createContact(accountId, contactData, photoFile);

        // Create the roster entry for the new player
        const rosterResponse = await axios.post(
          `/api/accounts/${accountId}/roster`,
          {
            contactId: newContact.id,
            submittedDriversLicense: false,
            firstYear: 0,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (rosterResponse.data.success) {
          const newPlayer = rosterResponse.data.data.player;

          // If auto-sign is enabled, add to team roster
          if (autoSignToRoster && seasonId && teamSeasonId) {
            try {
              const signResponse = await axios.post(
                `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
                {
                  playerId: newPlayer.id,
                  playerNumber: 0,
                  submittedWaiver: false,
                  submittedDriversLicense: false,
                  firstYear: 0,
                },
                { headers: { Authorization: `Bearer ${token}` } },
              );

              if (signResponse.data.success) {
                setSuccessMessage(
                  `Player "${contactData.firstName} ${contactData.lastName}" created and signed to roster successfully`,
                );
              } else {
                setSuccessMessage(
                  `Player "${contactData.firstName} ${contactData.lastName}" created successfully but failed to sign to roster`,
                );
              }
            } catch {
              setSuccessMessage(
                `Player "${contactData.firstName} ${contactData.lastName}" created successfully but failed to sign to roster`,
              );
            }
          } else {
            setSuccessMessage(
              `Player "${contactData.firstName} ${contactData.lastName}" created successfully`,
            );
          }

          fetchRosterData();
          fetchAvailablePlayers();
        } else {
          throw new Error('Failed to create roster entry for new player');
        }
      } else if (playerToEdit) {
        // Update existing contact using UserManagementService
        await userService.updateContact(
          accountId,
          playerToEdit.player.contactId,
          contactData,
          photoFile,
        );
        setSuccessMessage(
          `Player "${contactData.firstName} ${contactData.lastName}" updated successfully`,
        );
        fetchRosterData();
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to save contact');
      } else {
        setError('Failed to save contact');
      }
    } finally {
      setFormLoading(false);
    }
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

  // Email validation function
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Empty email is allowed
    return isEmail(email);
  };

  // Validate all phone numbers
  const validateAllPhoneNumbers = (): boolean => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    const errors = {
      phone1: '',
      phone2: '',
      phone3: '',
    };
    let hasErrors = false;

    if (editFormData.phone1 && !phoneRegex.test(editFormData.phone1)) {
      errors.phone1 = 'Phone number must be in format (123) 456-7890';
      hasErrors = true;
    }
    if (editFormData.phone2 && !phoneRegex.test(editFormData.phone2)) {
      errors.phone2 = 'Phone number must be in format (123) 456-7890';
      hasErrors = true;
    }
    if (editFormData.phone3 && !phoneRegex.test(editFormData.phone3)) {
      errors.phone3 = 'Phone number must be in format (123) 456-7890';
      hasErrors = true;
    }

    setPhoneErrors(errors);
    return !hasErrors;
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
    const middleName = contact.contactDetails?.middlename || '';

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
    try {
      await axios.post(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/managers`,
        { contactId: selectedManagerContactId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAddManagerDialogOpen(false);
      setSelectedManagerContactId(null);
      fetchManagers();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setAddManagerError(error.response?.data?.message || 'Failed to add manager');
      } else {
        setAddManagerError('Failed to add manager');
      }
    } finally {
      setAddManagerLoading(false);
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
    const aMiddle = a.player.contact.contactDetails?.middlename || '';
    const bMiddle = b.player.contact.contactDetails?.middlename || '';

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
                    {manager.contacts.lastName}, {manager.contacts.firstName}{' '}
                    {manager.contacts.contactDetails?.middlename}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {manager.contacts.email}
                  </Typography>
                </Box>
                <IconButton
                  color="error"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await axios.delete(
                        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/managers/${manager.id}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );
                      fetchManagers();
                    } catch {
                      // Optionally set error
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
                          if (userService) {
                            await userService.deleteContactPhoto(accountId, contactId);
                            await fetchRosterData(); // Refresh data
                          }
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
                      {managers.some((m) => m.contactid === member.player.contact.id) && (
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
                            if (userService) {
                              await userService.deleteContactPhoto(accountId, contactId);
                              await fetchRosterData(); // Refresh data
                            }
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
      <Dialog open={signPlayerDialogOpen} onClose={closeSignPlayerDialog} maxWidth="sm" fullWidth>
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
                  // Always use .contact if present, fallback to option itself
                  const contact = option.contact || option;
                  const last = contact.lastName || '';
                  const first = contact.firstName || '';
                  const middle = contact.contactDetails?.middlename || '';
                  return `${last}${first ? ', ' + first : ''}${middle ? ' ' + middle : ''}`.trim();
                }}
                value={selectedPlayer}
                onChange={(_, newValue) => {
                  if (newValue) {
                    // Extract firstYear and submittedDriversLicense from the top-level newValue only
                    const firstYear = newValue.firstYear ?? 0;
                    const submittedDriversLicense = newValue.submittedDriversLicense ?? false;
                    setSelectedPlayer({
                      id: newValue.id,
                      contactId: newValue.contactId,
                      submittedDriversLicense,
                      firstYear,
                      contact: newValue.contact || newValue,
                    });
                    setRosterFormData({
                      ...rosterFormData,
                      firstYear,
                      submittedDriversLicense,
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
            {!isSigningNewPlayer && selectedPlayer && (
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
                onChange={(e) =>
                  setRosterFormData({ ...rosterFormData, firstYear: parseInt(e.target.value) || 0 })
                }
                fullWidth
                variant="outlined"
                helperText={
                  isSigningNewPlayer && selectedPlayer && selectedPlayer.firstYear
                    ? `Pre-filled with existing data: ${selectedPlayer.firstYear}`
                    : 'Enter the year the player first joined the league'
                }
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
                label={
                  <Box>
                    <Typography>{"Submitted Driver's License"}</Typography>
                    {isSigningNewPlayer &&
                      selectedPlayer &&
                      selectedPlayer.submittedDriversLicense && (
                        <Typography variant="caption" color="text.secondary">
                          Pre-filled with existing data
                        </Typography>
                      )}
                  </Box>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSignPlayerDialog} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={isSigningNewPlayer ? handleSignPlayer : handleSaveRosterInfo}
            variant="contained"
            disabled={isSigningNewPlayer ? !selectedPlayer || formLoading : formLoading}
            startIcon={
              formLoading ? (
                <CircularProgress size={20} />
              ) : isSigningNewPlayer ? (
                <PersonAddIcon />
              ) : (
                <SportsIcon />
              )
            }
          >
            {isSigningNewPlayer ? 'Sign Player' : 'Save Roster Info'}
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
              (member) => !managers.some((m) => m.contactid === member.player.contact.id),
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
