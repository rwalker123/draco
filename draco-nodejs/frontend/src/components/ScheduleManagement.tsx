import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameDay } from 'date-fns/isSameDay';

interface Game {
  id: string;
  gameDate: string;
  homeTeamId: string;
  visitorTeamId: string;
  homeScore: number;
  visitorScore: number;
  comment: string;
  fieldId?: string;
  field?: {
    id: string;
    name: string;
    shortName: string;
    address: string;
    city: string;
    state: string;
  };
  gameStatus: number;
  gameType: number;
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  umpire4?: string;
  league: {
    id: string;
    name: string;
  };
  season: {
    id: string;
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
}

interface Field {
  id: string;
  name: string;
  shortName: string;
  comment: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  directions: string;
  rainoutNumber: string;
  latitude: string;
  longitude: string;
}

interface LeagueSeason {
  id: string;
  league: {
    id: string;
    name: string;
  };
  season: {
    id: string;
    name: string;
  };
}

interface ScheduleManagementProps {
  accountId: string;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ accountId }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [leagueSeasons, setLeagueSeasons] = useState<LeagueSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedLeagueSeason, setSelectedLeagueSeason] = useState<string>('');
  
  // Form states
  const [gameDate, setGameDate] = useState<Date | null>(new Date());
  const [gameTime, setGameTime] = useState<Date | null>(new Date());
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [visitorTeamId, setVisitorTeamId] = useState<string>('');
  const [fieldId, setFieldId] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [gameType, setGameType] = useState<number>(1);
  
  // View states
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date()));

  // Load data
  useEffect(() => {
    loadData();
  }, [accountId, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load games for the date range
      const gamesResponse = await fetch(
        `/api/accounts/${accountId}/games/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!gamesResponse.ok) {
        throw new Error('Failed to load games');
      }

      const gamesData = await gamesResponse.json();
      setGames(gamesData.data.games);

      // Load fields
      const fieldsResponse = await fetch(
        `/api/accounts/${accountId}/fields`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setFields(fieldsData.data.fields);
      }

      // Load league seasons (you'll need to implement this endpoint)
      // const leagueSeasonsResponse = await fetch(`/api/accounts/${accountId}/league-seasons`);
      // if (leagueSeasonsResponse.ok) {
      //   const leagueSeasonsData = await leagueSeasonsResponse.json();
      //   setLeagueSeasons(leagueSeasonsData.data.leagueSeasons);
      // }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async () => {
    try {
      if (!gameDate || !gameTime || !homeTeamId || !visitorTeamId || !selectedLeagueSeason) {
        setError('Please fill in all required fields');
        return;
      }

      // Combine date and time
      const combinedDateTime = new Date(gameDate);
      combinedDateTime.setHours(gameTime.getHours(), gameTime.getMinutes());

      const response = await fetch(
        `/api/accounts/${accountId}/games/leagues/${selectedLeagueSeason}/schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            gameDate: combinedDateTime.toISOString(),
            homeTeamId,
            visitorTeamId,
            fieldId: fieldId || null,
            comment,
            gameType
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create game');
      }

      setSuccess('Game created successfully');
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    }
  };

  const handleUpdateGame = async () => {
    try {
      if (!selectedGame || !gameDate || !gameTime || !homeTeamId || !visitorTeamId) {
        setError('Please fill in all required fields');
        return;
      }

      // Combine date and time
      const combinedDateTime = new Date(gameDate);
      combinedDateTime.setHours(gameTime.getHours(), gameTime.getMinutes());

      const response = await fetch(
        `/api/accounts/${accountId}/games/schedule/${selectedGame.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            gameDate: combinedDateTime.toISOString(),
            homeTeamId,
            visitorTeamId,
            fieldId: fieldId || null,
            comment,
            gameType
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update game');
      }

      setSuccess('Game updated successfully');
      setEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game');
    }
  };

  const handleDeleteGame = async () => {
    try {
      if (!selectedGame) return;

      const response = await fetch(
        `/api/accounts/${accountId}/games/schedule/${selectedGame.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete game');
      }

      setSuccess('Game deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedGame(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
    }
  };

  const resetForm = () => {
    setGameDate(new Date());
    setGameTime(new Date());
    setHomeTeamId('');
    setVisitorTeamId('');
    setFieldId('');
    setComment('');
    setGameType(1);
    setSelectedGame(null);
  };

  const openEditDialog = (game: Game) => {
    setSelectedGame(game);
    setGameDate(parseISO(game.gameDate));
    setGameTime(parseISO(game.gameDate));
    setHomeTeamId(game.homeTeamId);
    setVisitorTeamId(game.visitorTeamId);
    setFieldId(game.fieldId || '');
    setComment(game.comment);
    setGameType(game.gameType);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (game: Game) => {
    setSelectedGame(game);
    setDeleteDialogOpen(true);
  };

  const getGameStatusText = (status: number): string => {
    switch (status) {
      case 0: return 'Scheduled';
      case 1: return 'Final';
      case 2: return 'In Progress';
      case 3: return 'Postponed';
      case 4: return 'Forfeit';
      case 5: return 'Did Not Report';
      default: return 'Unknown';
    }
  };

  const getGameStatusColor = (status: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 0: return 'default';
      case 1: return 'success';
      case 2: return 'primary';
      case 3: return 'warning';
      case 4: return 'error';
      case 5: return 'error';
      default: return 'default';
    }
  };

  const getTeamName = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getFieldName = (fieldId?: string): string => {
    if (!fieldId) return 'TBD';
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : 'Unknown Field';
  };

  const renderCalendarView = () => {
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    return (
      <Box>
        {weekDays.map((day) => {
          const dayGames = games.filter(game => isSameDay(parseISO(game.gameDate), day));
          
          return (
            <Box 
              key={day.toISOString()} 
              sx={{ 
                flex: '1 1 auto', 
                minWidth: { xs: '100%', sm: '50%', md: '33.333%', lg: '25%' },
                maxWidth: { xs: '100%', sm: '50%', md: '33.333%', lg: '25%' },
                p: 1
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {format(day, 'MMM dd')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {format(day, 'EEEE')}
                  </Typography>
                  
                  {dayGames.length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      {dayGames.map((game) => (
                        <Box key={game.id} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {getTeamName(game.homeTeamId)} vs {getTeamName(game.visitorTeamId)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format(parseISO(game.gameDate), 'h:mm a')} • {getFieldName(game.fieldId)}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={getGameStatusText(game.gameStatus)} 
                              color={getGameStatusColor(game.gameStatus)}
                              size="small"
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      No games scheduled
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderListView = () => {
    return (
      <List>
        {games.map((game) => (
          <ListItem key={game.id} divider>
            <ListItemText
              primary={
                <Box>
                  <Typography variant="h6">
                    {getTeamName(game.homeTeamId)} vs {getTeamName(game.visitorTeamId)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {format(parseISO(game.gameDate), 'EEEE, MMMM d, yyyy h:mm a')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {getFieldName(game.fieldId)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={getGameStatusText(game.gameStatus)}
                    color={getGameStatusColor(game.gameStatus)}
                    size="small"
                  />
                  {game.comment && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {game.comment}
                    </Typography>
                  )}
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton onClick={() => openEditDialog(game)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => openDeleteDialog(game)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Schedule Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Game
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={viewMode} onChange={(_, newValue) => setViewMode(newValue)}>
            <Tab label="Calendar View" value="calendar" />
            <Tab label="List View" value="list" />
          </Tabs>
        </Paper>

        {viewMode === 'calendar' ? renderCalendarView() : renderListView()}

        {/* Create Game Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Game</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Game Date"
                      value={gameDate}
                      onChange={(newValue) => setGameDate(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Game Time"
                      value={gameTime}
                      onChange={(newValue) => setGameTime(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>League Season</InputLabel>
                    <Select
                      value={selectedLeagueSeason}
                      onChange={(e) => setSelectedLeagueSeason(e.target.value)}
                      label="League Season"
                    >
                      {leagueSeasons.map((ls) => (
                        <MenuItem key={ls.id} value={ls.id}>
                          {ls.league.name} - {ls.season.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Home Team</InputLabel>
                    <Select
                      value={homeTeamId}
                      onChange={(e) => setHomeTeamId(e.target.value)}
                      label="Home Team"
                    >
                      {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Visitor Team</InputLabel>
                    <Select
                      value={visitorTeamId}
                      onChange={(e) => setVisitorTeamId(e.target.value)}
                      label="Visitor Team"
                    >
                      {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={fieldId}
                      onChange={(e) => setFieldId(e.target.value)}
                      label="Field"
                    >
                      <MenuItem value="">No field assigned</MenuItem>
                      {fields.map((field) => (
                        <MenuItem key={field.id} value={field.id}>
                          {field.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                label="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGame} variant="contained">Create Game</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Game Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Game Date"
                      value={gameDate}
                      onChange={(newValue) => setGameDate(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Game Time"
                      value={gameTime}
                      onChange={(newValue) => setGameTime(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Home Team</InputLabel>
                    <Select
                      value={homeTeamId}
                      onChange={(e) => setHomeTeamId(e.target.value)}
                      label="Home Team"
                    >
                      {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Visitor Team</InputLabel>
                    <Select
                      value={visitorTeamId}
                      onChange={(e) => setVisitorTeamId(e.target.value)}
                      label="Visitor Team"
                    >
                      {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={fieldId}
                      onChange={(e) => setFieldId(e.target.value)}
                      label="Field"
                    >
                      <MenuItem value="">No field assigned</MenuItem>
                      {fields.map((field) => (
                        <MenuItem key={field.id} value={field.id}>
                          {field.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Game Type</InputLabel>
                    <Select
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value as number)}
                      label="Game Type"
                    >
                      <MenuItem value={1}>Regular Season</MenuItem>
                      <MenuItem value={2}>Playoff</MenuItem>
                      <MenuItem value={3}>Exhibition</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                label="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateGame} variant="contained">Update Game</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Game</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this game? This action cannot be undone.
            </Typography>
            {selectedGame && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  {getTeamName(selectedGame.homeTeamId)} vs {getTeamName(selectedGame.visitorTeamId)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {format(parseISO(selectedGame.gameDate), 'EEEE, MMMM d, yyyy h:mm a')}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteGame} variant="contained" color="error">
              Delete Game
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ScheduleManagement; 