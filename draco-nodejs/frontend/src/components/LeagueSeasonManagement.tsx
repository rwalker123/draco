import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Sports as SportsIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

interface LeagueSeason {
  id: string;
  leagueId: string;
  leagueName: string;
  accountId: string;
  divisions: DivisionSeason[];
  unassignedTeams: TeamSeason[];
}

interface DivisionSeason {
  id: string;
  divisionId: string;
  divisionName: string;
  priority: number;
  teams: TeamSeason[];
}

interface TeamSeason {
  id: string;
  teamId: string;
  name: string;
  webAddress: string;
  youtubeUserId: string;
  defaultVideo: string;
  autoPlayVideo: boolean;
}

interface Division {
  id: string;
  name: string;
  accountId: string;
}

interface Season {
  id: string;
  name: string;
  accountId: string;
}

interface LeagueSeasonManagementProps {
  accountId: string;
  season: Season;
  token: string;
  onClose: () => void;
}

const LeagueSeasonManagement: React.FC<LeagueSeasonManagementProps> = ({
  accountId,
  season,
  token,
  onClose
}) => {
  const [leagueSeasons, setLeagueSeasons] = useState<LeagueSeason[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Division management state
  const [addDivisionDialogOpen, setAddDivisionDialogOpen] = useState(false);
  const [selectedLeagueSeason, setSelectedLeagueSeason] = useState<LeagueSeason | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [divisionPriority, setDivisionPriority] = useState(0);

  // Division definition management state
  const [createDivisionDialogOpen, setCreateDivisionDialogOpen] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState('');
  
  // Division creation within Add Division dialog state
  const [createDivisionInAddDialog, setCreateDivisionInAddDialog] = useState(false);
  const [newDivisionNameInAddDialog, setNewDivisionNameInAddDialog] = useState('');
  const [addToLeagueAfterCreate, setAddToLeagueAfterCreate] = useState(true);

  // Team assignment state
  const [assignTeamDialogOpen, setAssignTeamDialogOpen] = useState(false);
  const [selectedTeamSeason, setSelectedTeamSeason] = useState<TeamSeason | null>(null);
  const [selectedTeamLeagueSeason, setSelectedTeamLeagueSeason] = useState<LeagueSeason | null>(null);
  const [targetDivisionSeason, setTargetDivisionSeason] = useState<DivisionSeason | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // Get available divisions (excluding those already assigned to the selected league)
  const availableDivisions = useMemo(() => {
    if (!selectedLeagueSeason) return divisions;
    
    const assignedDivisionIds = new Set(
      selectedLeagueSeason.divisions.map(div => div.divisionId)
    );
    
    return divisions.filter(division => !assignedDivisionIds.has(division.id));
  }, [divisions, selectedLeagueSeason]);

  // Fetch league seasons with divisions and teams
  const fetchLeagueSeasons = useCallback(async () => {
    if (!accountId || !token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setLeagueSeasons(response.data.data.leagueSeasons);
      }
    } catch (error: any) {
      console.error('Error fetching league seasons:', error);
      setError(error.response?.data?.message || 'Failed to fetch league seasons');
    } finally {
      setLoading(false);
    }
  }, [accountId, season.id, token]);

  // Fetch available divisions
  const fetchDivisions = useCallback(async () => {
    if (!accountId || !token) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/divisions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setDivisions(response.data.data.divisions);
      }
    } catch (error: any) {
      console.error('Error fetching divisions:', error);
      setError(error.response?.data?.message || 'Failed to fetch divisions');
    }
  }, [accountId, token]);

  useEffect(() => {
    fetchLeagueSeasons();
    fetchDivisions();
  }, [fetchLeagueSeasons, fetchDivisions]);

  // Handler to open add division dialog
  const openAddDivisionDialog = (leagueSeason: LeagueSeason) => {
    setSelectedLeagueSeason(leagueSeason);
    setSelectedDivision(null);
    setDivisionPriority(0);
    setError(null);
    setAddDivisionDialogOpen(true);
  };

  // Handler to add division to league season
  const handleAddDivision = async () => {
    if (!accountId || !token || !selectedLeagueSeason || !selectedDivision) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${selectedLeagueSeason.id}/divisions`,
        {
          divisionId: selectedDivision.id,
          priority: divisionPriority
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setAddDivisionDialogOpen(false);
        fetchLeagueSeasons(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error adding division:', error);
      setError(error.response?.data?.message || 'Failed to add division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to remove division from league season
  const handleRemoveDivision = async (leagueSeason: LeagueSeason, divisionSeason: DivisionSeason) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${leagueSeason.id}/divisions/${divisionSeason.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        fetchLeagueSeasons(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error removing division:', error);
      setError(error.response?.data?.message || 'Failed to remove division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to create new division definition
  const handleCreateDivision = async () => {
    if (!accountId || !token || !newDivisionName.trim()) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/divisions`,
        { name: newDivisionName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setCreateDivisionDialogOpen(false);
        setNewDivisionName('');
        fetchDivisions(); // Refresh divisions list
      }
    } catch (error: any) {
      console.error('Error creating division:', error);
      setError(error.response?.data?.message || 'Failed to create division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to create division within Add Division dialog
  const handleCreateDivisionInAddDialog = async () => {
    if (!accountId || !token || !newDivisionNameInAddDialog.trim() || !selectedLeagueSeason) return;

    setFormLoading(true);
    try {
      // Create the division
      const createResponse = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/divisions`,
        { name: newDivisionNameInAddDialog.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (createResponse.data.success) {
        const newDivision = createResponse.data.data.division;
        
        // If checkbox is checked, add the division to the league season
        if (addToLeagueAfterCreate && selectedLeagueSeason) {
          const addResponse = await axios.post(
            `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${selectedLeagueSeason.id}/divisions`,
            {
              divisionId: newDivision.id,
              priority: divisionPriority
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (addResponse.data.success) {
            setSuccessMessage(`Division "${newDivision.name}" created and added to league "${selectedLeagueSeason.leagueName}"`);
          } else {
            setSuccessMessage(`Division "${newDivision.name}" created successfully, but failed to add to league`);
          }
        } else {
          setSuccessMessage(`Division "${newDivision.name}" created successfully`);
        }

        setCreateDivisionInAddDialog(false);
        setNewDivisionNameInAddDialog('');
        fetchDivisions();
        fetchLeagueSeasons();
      } else {
        setError(createResponse.data.message || 'Failed to create division');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to open assign team dialog
  const openAssignTeamDialog = (teamSeason: TeamSeason, leagueSeason: LeagueSeason) => {
    if (!teamSeason || !leagueSeason) {
      console.error('Invalid parameters for openAssignTeamDialog:', { teamSeason, leagueSeason });
      return;
    }
    setSelectedTeamSeason(teamSeason);
    setSelectedTeamLeagueSeason(leagueSeason);
    setTargetDivisionSeason(null);
    setError(null);
    
    // Ensure the accordion for this league is expanded
    if (!expandedAccordions.has(leagueSeason.id)) {
      setExpandedAccordions(prev => new Set([...Array.from(prev), leagueSeason.id]));
    }
    
    setAssignTeamDialogOpen(true);
  };

  // Handler to assign team to division
  const handleAssignTeamToDivision = async () => {
    if (!accountId || !token || !selectedTeamSeason || !targetDivisionSeason || !selectedTeamLeagueSeason) return;

    setFormLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${selectedTeamLeagueSeason.id}/teams/${selectedTeamSeason.id}/assign-division`,
        {
          divisionSeasonId: targetDivisionSeason.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(`Team "${selectedTeamSeason.name}" assigned to division "${targetDivisionSeason.divisionName}"`);
        setAssignTeamDialogOpen(false);
        fetchLeagueSeasons(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error assigning team to division:', error);
      setError(error.response?.data?.message || 'Failed to assign team to division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler for accordion expansion
  const handleAccordionChange = (leagueSeasonId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    const newExpanded = new Set(expandedAccordions);
    if (isExpanded) {
      newExpanded.add(leagueSeasonId);
    } else {
      newExpanded.delete(leagueSeasonId);
    }
    setExpandedAccordions(newExpanded);
  };

  // Handler to remove team from division
  const handleRemoveTeamFromDivision = async (teamSeason: TeamSeason, leagueSeason: LeagueSeason) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${leagueSeason.id}/teams/${teamSeason.id}/remove-from-division`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        fetchLeagueSeasons(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error removing team from division:', error);
      setError(error.response?.data?.message || 'Failed to remove team from division');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          League Season Management
        </Typography>
        <Button
          variant="outlined"
          onClick={onClose}
          startIcon={<RemoveIcon />}
        >
          Back to Seasons
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Season Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Season: {season.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage leagues, divisions, and team assignments for this season
          </Typography>
        </CardContent>
      </Card>

      {/* League Seasons */}
      {leagueSeasons.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" textAlign="center" color="text.secondary">
              No leagues have been added to this season yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        leagueSeasons.map((leagueSeason) => (
          <Accordion 
            key={leagueSeason.id} 
            sx={{ mb: 2 }}
            expanded={expandedAccordions.has(leagueSeason.id)}
            onChange={handleAccordionChange(leagueSeason.id)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box display="flex" alignItems="center">
                  <SportsIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {leagueSeason.leagueName}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip 
                    label={`${leagueSeason.divisions.length} divisions`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${leagueSeason.unassignedTeams.length} unassigned teams`} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                  />
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddDivisionDialog(leagueSeason);
                    }}
                  >
                    Add Division
                  </Button>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" gap={2} flexWrap="wrap">
                {/* Divisions */}
                <Box flex="1" minWidth="300px">
                  <Typography variant="h6" gutterBottom>
                    Divisions
                  </Typography>
                  {leagueSeason.divisions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No divisions created yet.
                    </Typography>
                  ) : (
                    leagueSeason.divisions.map((division) => (
                      <Card key={division.id} sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="subtitle1">
                                {division.divisionName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {division.teams.length} teams • Priority: {division.priority}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Remove Division">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveDivision(leagueSeason, division)}
                                  disabled={formLoading}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          {division.teams.length > 0 && (
                            <Box mt={1}>
                              {division.teams.map((team) => (
                                <Chip
                                  key={team.id}
                                  label={team.name}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                  onDelete={() => handleRemoveTeamFromDivision(team, leagueSeason)}
                                  disabled={formLoading}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>

                {/* Unassigned Teams */}
                <Box flex="1" minWidth="300px">
                  <Typography variant="h6" gutterBottom>
                    Unassigned Teams
                  </Typography>
                  {leagueSeason.unassignedTeams.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      All teams are assigned to divisions.
                    </Typography>
                  ) : (
                    leagueSeason.unassignedTeams.map((team) => (
                      <Card key={team.id} sx={{ mb: 1 }} component="div">
                        <CardContent sx={{ py: 1 }} component="div">
                          <Box display="flex" justifyContent="space-between" alignItems="center" component="div">
                            <Box display="flex" alignItems="center" component="div">
                              <PersonIcon sx={{ mr: 1 }} />
                              <Typography 
                                key={`team-${team.id}`}
                                variant="subtitle1"
                                component="span"
                              >
                                {team.name}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              startIcon={<GroupIcon />}
                              onClick={() => {
                                if (leagueSeason) {
                                  openAssignTeamDialog(team, leagueSeason);
                                }
                              }}
                              disabled={formLoading}
                            >
                              Assign to Division
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Create Division Dialog */}
      <Dialog open={createDivisionDialogOpen} onClose={() => setCreateDivisionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Division</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Division Name"
            fullWidth
            variant="outlined"
            value={newDivisionName}
            onChange={(e) => setNewDivisionName(e.target.value)}
            disabled={formLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDivisionDialogOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateDivision} 
            variant="contained" 
            disabled={formLoading || !newDivisionName.trim()}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Create Division'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Division Dialog */}
      <Dialog open={addDivisionDialogOpen} onClose={() => setAddDivisionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Division to League</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Adding division to: <strong>{selectedLeagueSeason?.leagueName}</strong>
          </Typography>
          
          {!createDivisionInAddDialog ? (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" gutterBottom>
                  Select Existing Division
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setCreateDivisionInAddDialog(true);
                    setNewDivisionNameInAddDialog('');
                    setError(null);
                  }}
                  startIcon={<AddIcon />}
                  disabled={formLoading}
                >
                  Create New Division
                </Button>
              </Box>
              <Autocomplete
                options={availableDivisions}
                getOptionLabel={(option) => option.name}
                value={selectedDivision}
                onChange={(_, newValue) => setSelectedDivision(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Division"
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                )}
                noOptionsText={availableDivisions.length === 0 ? "All divisions are already assigned to this league" : "No divisions available"}
              />
              <TextField
                margin="dense"
                label="Priority"
                type="number"
                fullWidth
                variant="outlined"
                value={divisionPriority}
                onChange={(e) => setDivisionPriority(parseInt(e.target.value) || 0)}
                disabled={formLoading}
                helperText="Lower numbers have higher priority"
              />
            </>
          ) : (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" gutterBottom>
                  Create New Division
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setCreateDivisionInAddDialog(false);
                    setSelectedDivision(null);
                    setError(null);
                  }}
                  disabled={formLoading}
                >
                  Select Existing
                </Button>
              </Box>
              <TextField
                autoFocus
                margin="dense"
                label="Division Name"
                fullWidth
                variant="outlined"
                value={newDivisionNameInAddDialog}
                onChange={(e) => setNewDivisionNameInAddDialog(e.target.value)}
                disabled={formLoading}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Priority"
                type="number"
                fullWidth
                variant="outlined"
                value={divisionPriority}
                onChange={(e) => setDivisionPriority(parseInt(e.target.value) || 0)}
                disabled={formLoading}
                helperText="Lower numbers have higher priority"
                sx={{ mb: 2 }}
              />
              {selectedLeagueSeason && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addToLeagueAfterCreate}
                      onChange={(e) => setAddToLeagueAfterCreate(e.target.checked)}
                      disabled={formLoading}
                    />
                  }
                  label={`Add to league "${selectedLeagueSeason.leagueName}" after creation`}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddDivisionDialogOpen(false);
            setCreateDivisionInAddDialog(false);
            setError(null);
          }} disabled={formLoading}>
            Cancel
          </Button>
          {!createDivisionInAddDialog ? (
            <Button 
              onClick={handleAddDivision} 
              variant="contained" 
              disabled={formLoading || !selectedDivision}
            >
              {formLoading ? <CircularProgress size={20} /> : 'Add Division'}
            </Button>
          ) : (
            <Button 
              onClick={handleCreateDivisionInAddDialog} 
              variant="contained" 
              disabled={formLoading || !newDivisionNameInAddDialog.trim()}
            >
              {formLoading ? <CircularProgress size={20} /> : 'Create Division'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Assign Team Dialog */}
      <Dialog open={assignTeamDialogOpen} onClose={() => setAssignTeamDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Team to Division</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Assigning team: <strong>{selectedTeamSeason?.name}</strong>
          </Typography>
          {selectedTeamLeagueSeason?.divisions.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No divisions are available in this league. Please add divisions to the league first.
            </Alert>
          ) : (
            <Autocomplete
              options={selectedTeamLeagueSeason?.divisions || []}
              getOptionLabel={(option) => option.divisionName}
              value={targetDivisionSeason}
              onChange={(_, newValue) => setTargetDivisionSeason(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Division"
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              )}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignTeamDialogOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignTeamToDivision} 
            variant="contained" 
            disabled={formLoading || !targetDivisionSeason || !selectedTeamLeagueSeason?.divisions.length}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Assign Team'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for creating divisions */}
      <Fab
        color="primary"
        aria-label="create division"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDivisionDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default LeagueSeasonManagement; 