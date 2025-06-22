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
  IconButton
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  SportsBasketball as SportsIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

interface Contact {
  id: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  streetaddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateofbirth: string;
  phones?: Array<{
    type: 'home' | 'work' | 'cell';
    number: string;
  }>;
}

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

const TeamRosterManagement: React.FC = () => {
  const { accountId, seasonId, teamSeasonId } = useParams<{
    accountId: string;
    seasonId: string;
    teamSeasonId: string;
  }>();
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<TeamRosterData | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<RosterPlayer[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  
  // Dialog states
  const [signPlayerDialogOpen, setSignPlayerDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const [isSigningNewPlayer, setIsSigningNewPlayer] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<RosterMember | null>(null);
  const [editPlayerDialogOpen, setEditPlayerDialogOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<RosterMember | null>(null);
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
    dateofbirth: ''
  });
  const [phoneErrors, setPhoneErrors] = useState({
    phone1: '',
    phone2: '',
    phone3: ''
  });
  
  // Unified roster information dialog states
  const [rosterFormData, setRosterFormData] = useState({
    playerNumber: 0,
    submittedWaiver: false,
    submittedDriversLicense: false,
    firstYear: 0
  });

  const { token } = useAuth();

  // Fetch roster data
  const fetchRosterData = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) {
      console.log('Missing required data for fetchRosterData:', { accountId, seasonId, teamSeasonId, hasToken: !!token });
      return;
    }

    console.log('Fetching roster data for:', { accountId, seasonId, teamSeasonId });
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Roster data response:', response.data);
      if (response.data.success) {
        setRosterData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching roster data:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to fetch roster data');
    } finally {
      setLoading(false);
    }
  }, [accountId, seasonId, teamSeasonId, token]);

  // Fetch available players
  const fetchAvailablePlayers = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/available-players`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAvailablePlayers(response.data.data.availablePlayers);
      }
    } catch (error: any) {
      console.error('Error fetching available players:', error);
      setError(error.response?.data?.message || 'Failed to fetch available players');
    }
  }, [accountId, seasonId, teamSeasonId, token]);

  // Fetch season data
  const fetchSeasonData = useCallback(async () => {
    if (!accountId || !seasonId || !token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSeason(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching season data:', error);
    }
  }, [accountId, seasonId, token]);

  // Fetch league data
  const fetchLeagueData = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/league`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setLeague(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching league data:', error);
    }
  }, [accountId, seasonId, teamSeasonId, token]);

  useEffect(() => {
    console.log('TeamRosterManagement useEffect triggered with:', { accountId, seasonId, teamSeasonId, hasToken: !!token });
    fetchRosterData();
    fetchSeasonData();
    fetchLeagueData();
  }, [fetchRosterData, fetchSeasonData, fetchLeagueData, accountId, seasonId, teamSeasonId, token]);

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
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        {
          playerId: selectedPlayer.id,
          playerNumber: rosterFormData.playerNumber,
          submittedWaiver: rosterFormData.submittedWaiver,
          submittedDriversLicense: rosterFormData.submittedDriversLicense,
          firstYear: rosterFormData.firstYear
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage('Player signed successfully');
        closeSignPlayerDialog();
        fetchRosterData();
        fetchAvailablePlayers();
      } else {
        setError(response.data.message || 'Failed to sign player');
      }
    } catch (error: any) {
      console.error('Error signing player:', error);
      setError(error.response?.data?.message || 'Failed to sign player');
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
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMember.id}/release`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        fetchRosterData();
      }
    } catch (error: any) {
      console.error('Error releasing player:', error);
      setError(error.response?.data?.message || 'Failed to release player');
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
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMember.id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        fetchRosterData();
      }
    } catch (error: any) {
      console.error('Error activating player:', error);
      setError(error.response?.data?.message || 'Failed to activate player');
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
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${playerToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setDeleteDialogOpen(false);
        setPlayerToDelete(null);
        fetchRosterData();
      }
    } catch (error: any) {
      console.error('Error deleting player:', error);
      setError(error.response?.data?.message || 'Failed to delete player');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to edit player
  const handleEditPlayer = async () => {
    if (!accountId || !token || !playerToEdit) return;

    // Validate phone numbers before proceeding
    if (!validateAllPhoneNumbers()) {
      setError('Please fix phone number format errors before saving');
      return;
    }

    setFormLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/accounts/${accountId}/contacts/${playerToEdit.player.contactId}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setEditPlayerDialogOpen(false);
        setPlayerToEdit(null);
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
          dateofbirth: ''
        });
        setPhoneErrors({ phone1: '', phone2: '', phone3: '' });
        fetchRosterData();
      }
    } catch (error: any) {
      console.error('Error editing player:', error);
      setError(error.response?.data?.message || 'Failed to edit player');
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
    setPlayerToEdit(rosterMember);
    setEditFormData({
      firstname: rosterMember.player.contact.firstname || '',
      lastname: rosterMember.player.contact.lastname || '',
      middlename: rosterMember.player.contact.middlename || '',
      email: rosterMember.player.contact.email || '',
      phone1: rosterMember.player.contact.phone1 || '',
      phone2: rosterMember.player.contact.phone2 || '',
      phone3: rosterMember.player.contact.phone3 || '',
      streetaddress: rosterMember.player.contact.streetaddress || '',
      city: rosterMember.player.contact.city || '',
      state: rosterMember.player.contact.state || '',
      zip: rosterMember.player.contact.zip || '',
      dateofbirth: rosterMember.player.contact.dateofbirth || ''
    });
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
      firstYear: 0
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
      dateofbirth: ''
    });
    setPhoneErrors({ phone1: '', phone2: '', phone3: '' });
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
      firstYear: 0
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
      firstYear: rosterMember.player.firstYear
    });
    setSignPlayerDialogOpen(true);
  };

  const handleSaveRosterInfo = async () => {
    if (!selectedPlayer || !accountId || !seasonId || !teamSeasonId || !token) {
      setError('Missing required data');
      return;
    }

    // Find the roster member to update
    const rosterMember = rosterData?.rosterMembers.find(member => member.player.id === selectedPlayer.id);
    if (!rosterMember) {
      setError('Roster member not found');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMember.id}/update`,
        {
          playerNumber: rosterFormData.playerNumber,
          submittedWaiver: rosterFormData.submittedWaiver,
          submittedDriversLicense: rosterFormData.submittedDriversLicense,
          firstYear: rosterFormData.firstYear
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage('Roster information updated successfully');
        closeSignPlayerDialog();
        fetchRosterData();
      } else {
        setError(response.data.message || 'Failed to update roster information');
      }
    } catch (error: any) {
      console.error('Error updating roster information:', error);
      setError(error.response?.data?.message || 'Failed to update roster information');
    } finally {
      setFormLoading(false);
    }
  };

  // Helper function to format phone numbers as (111) 222-3333
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Limit to exactly 10 digits
    const limitedNumber = phoneNumber.slice(0, 10);
    
    // Format based on length
    if (limitedNumber.length === 0) return '';
    if (limitedNumber.length <= 3) return `(${limitedNumber}`;
    if (limitedNumber.length <= 6) return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6, 10)}`;
  };

  // Helper function to validate phone numbers
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length === 0 || digits.length === 10;
  };

  // Helper function to validate all phone numbers
  const validateAllPhoneNumbers = (): boolean => {
    const newErrors = {
      phone1: '',
      phone2: '',
      phone3: ''
    };
    
    let isValid = true;
    
    if (editFormData.phone1 && !validatePhoneNumber(editFormData.phone1)) {
      newErrors.phone1 = 'Phone number must be exactly 10 digits';
      isValid = false;
    }
    
    if (editFormData.phone2 && !validatePhoneNumber(editFormData.phone2)) {
      newErrors.phone2 = 'Phone number must be exactly 10 digits';
      isValid = false;
    }
    
    if (editFormData.phone3 && !validatePhoneNumber(editFormData.phone3)) {
      newErrors.phone3 = 'Phone number must be exactly 10 digits';
      isValid = false;
    }
    
    setPhoneErrors(newErrors);
    return isValid;
  };

  // Helper function to format all contact information
  const formatContactInfo = (contact: Contact) => {
    const info = [];
    
    // Address first
    if (contact.streetaddress || contact.city || contact.state || contact.zip) {
      const addressParts = [
        contact.streetaddress,
        contact.city,
        contact.state,
        contact.zip
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        const fullAddress = addressParts.join(', ');
        const streetAddress = contact.streetaddress || '';
        const cityStateZip = [
          contact.city,
          contact.state,
          contact.zip
        ].filter(Boolean).join(', ');
        
        info.push(
          <Link
            href={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              color: 'primary.main', 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
              display: 'block'
            }}
          >
            {streetAddress && <div>{streetAddress}</div>}
            {cityStateZip && <div>{cityStateZip}</div>}
          </Link>
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
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          {contact.email}
        </Link>
      );
    }
    
    // Phone numbers last
    if (contact.phones && contact.phones.length > 0) {
      contact.phones.forEach(phone => {
        info.push(
          <Link
            href={`tel:${phone.number.replace(/\D/g, '')}`}
            sx={{ 
              color: 'primary.main', 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {phone.type}: {phone.number}
          </Link>
        );
      });
    } else {
      // Fallback to individual phone fields
      if (contact.phone1) info.push(
        <Link
          href={`tel:${contact.phone1.replace(/\D/g, '')}`}
          sx={{ 
            color: 'primary.main', 
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          home: {contact.phone1}
        </Link>
      );
      if (contact.phone2) info.push(
        <Link
          href={`tel:${contact.phone2.replace(/\D/g, '')}`}
          sx={{ 
            color: 'primary.main', 
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          work: {contact.phone2}
        </Link>
      );
      if (contact.phone3) info.push(
        <Link
          href={`tel:${contact.phone3.replace(/\D/g, '')}`}
          sx={{ 
            color: 'primary.main', 
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          cell: {contact.phone3}
        </Link>
      );
    }
    
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
    const lastName = contact.lastname || '';
    const firstName = contact.firstname || '';
    const middleName = contact.middlename || '';
    
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
    if (member.player.contact.dateofbirth && typeof member.player.contact.dateofbirth === 'string') {
      try {
        const birthDate = parseISO(member.player.contact.dateofbirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred this year
        const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age;
        
        const birthMonthYear = format(birthDate, 'MMM yyyy');
        
        info.push(
          <div key="age">
            Age: {adjustedAge} ({birthMonthYear})
          </div>
        );
      } catch (error) {
        console.warn('Invalid date of birth format:', member.player.contact.dateofbirth);
      }
    }
    
    // Date Added
    if (member.dateAdded && typeof member.dateAdded === 'string') {
      try {
        info.push(
          <div key="dateadded">
            Date Added: {format(parseISO(member.dateAdded), 'MMM dd, yyyy')}
          </div>
        );
      } catch (error) {
        console.warn('Invalid date added format:', member.dateAdded);
      }
    }
    
    // Submitted Waiver
    info.push(
      <div key="waiver">
        Submitted Waiver: {member.submittedWaiver ? 'Yes' : 'No'}
      </div>
    );
    
    // Submitted Driver's License
    info.push(
      <div key="license">
        Submitted Driver's License: {member.player.submittedDriversLicense ? 'Yes' : 'No'}
      </div>
    );
    
    return info.length > 0 ? info : ['No verification data'];
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
    const aLast = a.player.contact.lastname || '';
    const bLast = b.player.contact.lastname || '';
    const aFirst = a.player.contact.firstname || '';
    const bFirst = b.player.contact.firstname || '';
    const aMiddle = a.player.contact.middlename || '';
    const bMiddle = b.player.contact.middlename || '';
    
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

  const activePlayers = sortedRosterMembers.filter(member => !member.inactive);
  const inactivePlayers = sortedRosterMembers.filter(member => member.inactive);

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/seasons');
          }}
        >
          Seasons
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate(`/seasons/${seasonId}/league-management`);
          }}
        >
          {season?.name || 'Season'}
        </Link>
        <Typography color="text.primary">
          {rosterData.teamSeason.name} - Roster
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {league?.name ? `${league.name} – ${rosterData?.teamSeason?.name} Roster` : `${rosterData?.teamSeason?.name} Roster`}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
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
              <Typography variant="h4">
                {rosterData.rosterMembers.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Active Players
              </Typography>
              <Typography variant="h4">
                {activePlayers.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Released Players
              </Typography>
              <Typography variant="h4">
                {inactivePlayers.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
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
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {formatName(member.player.contact)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        First Year: {member.player.firstYear || 'Not set'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {formatContactInfo(member.player.contact)}
                  </TableCell>
                  <TableCell>
                    {formatVerificationInfo(member)}
                  </TableCell>
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
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', textDecoration: 'line-through' }}>
                          {formatName(member.player.contact)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          First Year: {member.player.firstYear || 'Not set'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {formatContactInfo(member.player.contact)}
                    </TableCell>
                    <TableCell>
                      {formatVerificationInfo(member)}
                    </TableCell>
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
                When you select a player, their existing roster information (first year, driver's license status) will be pre-filled. You can modify these values as needed.
              </Alert>
            )}
            
            {/* Player Selection (only for signing new players) */}
            {isSigningNewPlayer && (
              <Autocomplete
                options={availablePlayers}
                getOptionLabel={(option) => 
                  `${formatName(option.contact)}${option.contact.email ? ` (${option.contact.email})` : ''}`
                }
                value={selectedPlayer}
                onChange={(_, newValue) => {
                  setSelectedPlayer(newValue);
                  // Populate form with existing player data when available
                  if (newValue) {
                    setRosterFormData({
                      playerNumber: 0, // Default to 0 for new signings
                      submittedWaiver: false, // Default to false for new signings
                      submittedDriversLicense: newValue.submittedDriversLicense || false,
                      firstYear: newValue.firstYear || 0
                    });
                  } else {
                    // Reset form when no player is selected
                    setRosterFormData({
                      playerNumber: 0,
                      submittedWaiver: false,
                      submittedDriversLicense: false,
                      firstYear: 0
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
                noOptionsText={availablePlayers.length === 0 ? "No available players" : "No players found"}
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
                onChange={(e) => setRosterFormData({ ...rosterFormData, firstYear: parseInt(e.target.value) || 0 })}
                fullWidth
                variant="outlined"
                helperText={
                  isSigningNewPlayer && selectedPlayer && selectedPlayer.firstYear 
                    ? `Pre-filled with existing data: ${selectedPlayer.firstYear}` 
                    : "Enter the year the player first joined the league"
                }
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rosterFormData.submittedWaiver}
                    onChange={(e) => setRosterFormData({ ...rosterFormData, submittedWaiver: e.target.checked })}
                  />
                }
                label="Submitted Waiver"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rosterFormData.submittedDriversLicense}
                    onChange={(e) => setRosterFormData({ ...rosterFormData, submittedDriversLicense: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Submitted Driver's License</Typography>
                    {isSigningNewPlayer && selectedPlayer && selectedPlayer.submittedDriversLicense && (
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
            disabled={isSigningNewPlayer ? (!selectedPlayer || formLoading) : formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : (isSigningNewPlayer ? <PersonAddIcon /> : <SportsIcon />)}
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
            <strong>
              {playerToDelete ? formatName(playerToDelete.player.contact) : ''}
            </strong>{' '}
            from the roster?
          </Typography>
          <Alert severity="warning">
            This action cannot be undone. The player will be permanently removed from the team roster.
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

      {/* Edit Player Dialog */}
      <Dialog open={editPlayerDialogOpen} onClose={closeEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Player Information</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <TextField
                  label="First Name"
                  value={editFormData.firstname}
                  onChange={(e) => setEditFormData({ ...editFormData, firstname: e.target.value })}
                  fullWidth
                  variant="outlined"
                  required
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <TextField
                  label="Last Name"
                  value={editFormData.lastname}
                  onChange={(e) => setEditFormData({ ...editFormData, lastname: e.target.value })}
                  fullWidth
                  variant="outlined"
                  required
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <TextField
                  label="Middle Name"
                  value={editFormData.middlename}
                  onChange={(e) => setEditFormData({ ...editFormData, middlename: e.target.value })}
                  fullWidth
                  variant="outlined"
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  fullWidth
                  variant="outlined"
                />
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                <TextField
                  label="Home Phone"
                  value={editFormData.phone1}
                  onChange={(e) => setEditFormData({ ...editFormData, phone1: formatPhoneNumber(e.target.value) })}
                  onBlur={() => {
                    if (editFormData.phone1 && !validatePhoneNumber(editFormData.phone1)) {
                      setPhoneErrors(prev => ({ ...prev, phone1: 'Phone number must be exactly 10 digits' }));
                    } else {
                      setPhoneErrors(prev => ({ ...prev, phone1: '' }));
                    }
                  }}
                  error={!!phoneErrors.phone1}
                  helperText={phoneErrors.phone1}
                  fullWidth
                  variant="outlined"
                  placeholder="(555) 123-4567"
                />
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                <TextField
                  label="Work Phone"
                  value={editFormData.phone2}
                  onChange={(e) => setEditFormData({ ...editFormData, phone2: formatPhoneNumber(e.target.value) })}
                  onBlur={() => {
                    if (editFormData.phone2 && !validatePhoneNumber(editFormData.phone2)) {
                      setPhoneErrors(prev => ({ ...prev, phone2: 'Phone number must be exactly 10 digits' }));
                    } else {
                      setPhoneErrors(prev => ({ ...prev, phone2: '' }));
                    }
                  }}
                  error={!!phoneErrors.phone2}
                  helperText={phoneErrors.phone2}
                  fullWidth
                  variant="outlined"
                  placeholder="(555) 123-4567"
                />
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                <TextField
                  label="Cell Phone"
                  value={editFormData.phone3}
                  onChange={(e) => setEditFormData({ ...editFormData, phone3: formatPhoneNumber(e.target.value) })}
                  onBlur={() => {
                    if (editFormData.phone3 && !validatePhoneNumber(editFormData.phone3)) {
                      setPhoneErrors(prev => ({ ...prev, phone3: 'Phone number must be exactly 10 digits' }));
                    } else {
                      setPhoneErrors(prev => ({ ...prev, phone3: '' }));
                    }
                  }}
                  error={!!phoneErrors.phone3}
                  helperText={phoneErrors.phone3}
                  fullWidth
                  variant="outlined"
                  placeholder="(555) 123-4567"
                />
              </Box>
              <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                <TextField
                  label="Street Address"
                  value={editFormData.streetaddress}
                  onChange={(e) => setEditFormData({ ...editFormData, streetaddress: e.target.value })}
                  fullWidth
                  variant="outlined"
                />
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                <TextField
                  label="City"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  fullWidth
                  variant="outlined"
                />
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                <TextField
                  label="State"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  fullWidth
                  variant="outlined"
                />
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                <TextField
                  label="ZIP Code"
                  value={editFormData.zip}
                  onChange={(e) => setEditFormData({ ...editFormData, zip: e.target.value })}
                  fullWidth
                  variant="outlined"
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={editFormData.dateofbirth ? editFormData.dateofbirth.split('T')[0] : ''}
                  onChange={(e) => setEditFormData({ ...editFormData, dateofbirth: e.target.value })}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleEditPlayer}
            variant="contained"
            disabled={!editFormData.firstname || !editFormData.lastname || formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamRosterManagement;