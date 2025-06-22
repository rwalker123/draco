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
  IconButton,
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
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { parse, format } from 'date-fns';

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
  
  // Dialog states
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number>(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<RosterMember | null>(null);

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

  // Fetch season data for breadcrumbs
  const fetchSeasonData = useCallback(async () => {
    if (!accountId || !seasonId || !token) {
      console.log('Missing required data for fetchSeasonData:', { accountId, seasonId, hasToken: !!token });
      return;
    }

    console.log('Fetching season data for:', { accountId, seasonId });
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Season data response:', response.data);
      if (response.data.success) {
        setSeason(response.data.data.season);
      }
    } catch (error: any) {
      console.error('Error fetching season data:', error);
      console.error('Error response:', error.response?.data);
    }
  }, [accountId, seasonId, token]);

  useEffect(() => {
    console.log('TeamRosterManagement useEffect triggered with:', { accountId, seasonId, teamSeasonId, hasToken: !!token });
    fetchRosterData();
    fetchSeasonData();
  }, [fetchRosterData, fetchSeasonData, accountId, seasonId, teamSeasonId, token]);

  useEffect(() => {
    if (addPlayerDialogOpen) {
      fetchAvailablePlayers();
    }
  }, [addPlayerDialogOpen, fetchAvailablePlayers]);

  // Handler to add player to roster
  const handleAddPlayer = async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token || !selectedPlayer) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        {
          playerId: selectedPlayer.id,
          playerNumber: playerNumber
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setAddPlayerDialogOpen(false);
        setSelectedPlayer(null);
        setPlayerNumber(0);
        fetchRosterData();
      }
    } catch (error: any) {
      console.error('Error adding player:', error);
      setError(error.response?.data?.message || 'Failed to add player to roster');
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

  // Open delete dialog
  const openDeleteDialog = (rosterMember: RosterMember) => {
    setPlayerToDelete(rosterMember);
    setDeleteDialogOpen(true);
  };

  // Clear messages
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // Close add player dialog
  const closeAddPlayerDialog = () => {
    setAddPlayerDialogOpen(false);
    setSelectedPlayer(null);
    setPlayerNumber(0);
    clearMessages();
  };

  // Close delete dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPlayerToDelete(null);
    clearMessages();
  };

  // Helper function to format dates
  const formatDate = (dateValue: any) => {
    if (!dateValue || (typeof dateValue === 'object' && Object.keys(dateValue).length === 0)) {
      return '-';
    }
    try {
      let date: Date | null = null;
      if (typeof dateValue === 'string') {
        // Try with 3-digit milliseconds
        date = parse(dateValue, 'yyyy-MM-dd HH:mm:ss.SSS', new Date());
        if (isNaN(date.getTime())) {
          // Try with 2-digit milliseconds
          date = parse(dateValue, 'yyyy-MM-dd HH:mm:ss.SS', new Date());
        }
        if (isNaN(date.getTime())) {
          // Try with 1-digit milliseconds
          date = parse(dateValue, 'yyyy-MM-dd HH:mm:ss.S', new Date());
        }
        if (isNaN(date.getTime())) {
          // Try without milliseconds
          date = parse(dateValue, 'yyyy-MM-dd HH:mm:ss', new Date());
        }
        if (isNaN(date.getTime())) {
          // Fallback: try replacing space with T for ISO
          date = new Date(dateValue.replace(' ', 'T'));
        }
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) {
        return '-';
      }
      return format(date, 'P');
    } catch (error) {
      return '-';
    }
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
    
    // Date Added
    const dateAdded = formatDate(member.dateAdded);
    if (dateAdded !== '-') {
      info.push(`Added: ${dateAdded}`);
    }
    
    // Waiver Status
    info.push(`Waiver: ${member.submittedWaiver ? 'Submitted' : 'Pending'}`);
    
    // Driver's License Status
    info.push(`License: ${member.player.submittedDriversLicense ? 'Submitted' : 'Pending'}`);
    
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {rosterData.teamSeason.name} - Team Roster
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage team roster members
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/seasons/${seasonId}/league-management`)}
            sx={{ mr: 2 }}
          >
            Back to League Management
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddPlayerDialogOpen(true)}
            disabled={formLoading}
          >
            Add Player
          </Button>
        </Box>
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
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activePlayers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.playerNumber || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatName(member.player.contact)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatContactInfo(member.player.contact)}
                  </TableCell>
                  <TableCell>
                    {formatVerificationInfo(member)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="warning"
                      onClick={() => handleReleasePlayer(member)}
                      disabled={formLoading}
                      title="Release Player"
                    >
                      <PersonRemoveIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => openDeleteDialog(member)}
                      disabled={formLoading}
                      title="Delete Player"
                    >
                      <DeleteIcon />
                    </IconButton>
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactivePlayers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.playerNumber || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                        {formatName(member.player.contact)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatContactInfo(member.player.contact)}
                    </TableCell>
                    <TableCell>
                      {formatVerificationInfo(member)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="success"
                        onClick={() => handleActivatePlayer(member)}
                        disabled={formLoading}
                        title="Reactivate Player"
                      >
                        <PersonAddIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => openDeleteDialog(member)}
                        disabled={formLoading}
                        title="Delete Player"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Add Player Dialog */}
      <Dialog open={addPlayerDialogOpen} onClose={closeAddPlayerDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Player to Roster</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Autocomplete
              options={availablePlayers}
              getOptionLabel={(option) => 
                `${formatName(option.contact)}${option.contact.email ? ` (${option.contact.email})` : ''}`
              }
              value={selectedPlayer}
              onChange={(_, newValue) => setSelectedPlayer(newValue)}
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
            <TextField
              label="Player Number (Optional)"
              type="number"
              value={playerNumber}
              onChange={(e) => setPlayerNumber(parseInt(e.target.value) || 0)}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddPlayerDialog} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPlayer}
            variant="contained"
            disabled={!selectedPlayer || formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Add Player
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
    </Box>
  );
};

export default TeamRosterManagement; 