'use client';
import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Interfaces for data types
interface Team {
  id: string;
  name: string;
}

interface Field {
  id: string;
  name: string;
}

interface Umpire {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
}

interface Game {
  id: string;
  gameDate: string;
  homeTeamId: string;
  visitorTeamId: string;
  fieldId?: string;
  comment: string;
  gameType: number;
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  umpire4?: string;
  league?: {
    name: string;
  };
  season?: {
    id: string;
    name: string;
  };
}

interface GameFormFieldsProps {
  // Form state props
  gameDate: Date | null;
  gameTime: Date | null;
  homeTeamId: string;
  visitorTeamId: string;
  fieldId: string;
  comment: string;
  gameType: number;
  umpire1: string;
  umpire2: string;
  umpire3: string;
  umpire4: string;

  // Form setter props
  setGameDate: (date: Date | null) => void;
  setGameTime: (time: Date | null) => void;
  setHomeTeamId: (id: string) => void;
  setVisitorTeamId: (id: string) => void;
  setFieldId: (id: string) => void;
  setComment: (comment: string) => void;
  setGameType: (type: number) => void;
  setUmpire1: (id: string) => void;
  setUmpire2: (id: string) => void;
  setUmpire3: (id: string) => void;
  setUmpire4: (id: string) => void;

  // Data props
  leagueTeams: Team[];
  fields: Field[];
  umpires: Umpire[];

  // Configuration/Helper props
  canEditSchedule: boolean;
  isAccountAdmin: boolean;
  getAvailableUmpires: (currentPosition: string, currentValue: string) => Umpire[];
  getTeamName: (teamId: string) => string;
  getFieldName: (fieldId?: string) => string;
  getGameTypeText: (gameType: number | string) => string;

  // For edit mode
  _selectedGame?: Game;
}

const GameFormFields: React.FC<GameFormFieldsProps> = ({
  // Form state
  gameDate,
  setGameDate,
  gameTime,
  setGameTime,
  homeTeamId,
  setHomeTeamId,
  visitorTeamId,
  setVisitorTeamId,
  fieldId,
  setFieldId,
  comment,
  setComment,
  gameType,
  setGameType,
  umpire1,
  setUmpire1,
  umpire2,
  setUmpire2,
  umpire3,
  setUmpire3,
  umpire4,
  setUmpire4,

  // Data
  leagueTeams,
  fields,
  umpires,

  // Configuration
  canEditSchedule,
  isAccountAdmin,
  getAvailableUmpires,
  getTeamName,
  getFieldName,
  getGameTypeText,

  // For edit mode
  _selectedGame,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Date and Time */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DatePicker
            label="Game Date"
            value={gameDate}
            onChange={setGameDate}
            readOnly={!canEditSchedule}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                InputProps: !canEditSchedule
                  ? {
                      readOnly: true,
                      sx: {
                        '& .MuiInputBase-input': {
                          cursor: 'default',
                        },
                        '&:before': {
                          borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                        },
                        '&:hover:not(.Mui-disabled):before': {
                          borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                        },
                      },
                    }
                  : undefined,
              },
            }}
          />
          <TimePicker
            label="Game Time"
            value={gameTime}
            onChange={setGameTime}
            readOnly={!canEditSchedule}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                InputProps: !canEditSchedule
                  ? {
                      readOnly: true,
                      sx: {
                        '& .MuiInputBase-input': {
                          cursor: 'default',
                        },
                        '&:before': {
                          borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                        },
                        '&:hover:not(.Mui-disabled):before': {
                          borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                        },
                      },
                    }
                  : undefined,
              },
            }}
          />
        </Box>

        {/* Teams */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canEditSchedule ? (
            <>
              <FormControl fullWidth required>
                <InputLabel>Home Team</InputLabel>
                <Select
                  value={homeTeamId}
                  onChange={(e) => setHomeTeamId(e.target.value)}
                  label="Home Team"
                >
                  {leagueTeams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Visitor Team</InputLabel>
                <Select
                  value={visitorTeamId}
                  onChange={(e) => setVisitorTeamId(e.target.value)}
                  label="Visitor Team"
                >
                  {leagueTeams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label="Home Team"
                value={getTeamName(homeTeamId)}
                InputProps={{
                  readOnly: true,
                  sx: {
                    '& .MuiInputBase-input': {
                      cursor: 'default',
                    },
                    '&:before': {
                      borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Visitor Team"
                value={getTeamName(visitorTeamId)}
                InputProps={{
                  readOnly: true,
                  sx: {
                    '& .MuiInputBase-input': {
                      cursor: 'default',
                    },
                    '&:before': {
                      borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                    },
                  },
                }}
              />
            </>
          )}
        </Box>

        {/* Field and Game Type */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canEditSchedule ? (
            <>
              <FormControl fullWidth>
                <InputLabel>Field</InputLabel>
                <Select value={fieldId} onChange={(e) => setFieldId(e.target.value)} label="Field">
                  {fields.map((field) => (
                    <MenuItem key={field.id} value={field.id}>
                      {field.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Game Type</InputLabel>
                <Select
                  value={gameType}
                  onChange={(e) => setGameType(Number(e.target.value))}
                  label="Game Type"
                >
                  <MenuItem value={0}>Regular Season</MenuItem>
                  <MenuItem value={1}>Playoff</MenuItem>
                  <MenuItem value={2}>Exhibition</MenuItem>
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label="Field"
                value={getFieldName(fieldId)}
                InputProps={{
                  readOnly: true,
                  sx: {
                    '& .MuiInputBase-input': {
                      cursor: 'default',
                    },
                    '&:before': {
                      borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Game Type"
                value={getGameTypeText(gameType)}
                InputProps={{
                  readOnly: true,
                  sx: {
                    '& .MuiInputBase-input': {
                      cursor: 'default',
                    },
                    '&:before': {
                      borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                    },
                  },
                }}
              />
            </>
          )}
        </Box>

        {/* Umpires Row 1 */}
        {isAccountAdmin && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {canEditSchedule ? (
              <>
                <FormControl fullWidth>
                  <InputLabel>Umpire 1</InputLabel>
                  <Select
                    value={umpire1}
                    onChange={(e) => setUmpire1(e.target.value)}
                    label="Umpire 1"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {getAvailableUmpires('umpire1', umpire1).map((umpire) => (
                      <MenuItem key={umpire.id} value={umpire.id}>
                        {umpire.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Umpire 2</InputLabel>
                  <Select
                    value={umpire2}
                    onChange={(e) => setUmpire2(e.target.value)}
                    label="Umpire 2"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {getAvailableUmpires('umpire2', umpire2).map((umpire) => (
                      <MenuItem key={umpire.id} value={umpire.id}>
                        {umpire.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Umpire 1"
                  value={
                    umpire1
                      ? umpires.find((u) => u.id === umpire1)?.displayName || 'Unknown'
                      : 'None'
                  }
                  InputProps={{
                    readOnly: true,
                    sx: {
                      '& .MuiInputBase-input': {
                        cursor: 'default',
                      },
                      '&:before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                      },
                      '&:hover:not(.Mui-disabled):before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                      },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Umpire 2"
                  value={
                    umpire2
                      ? umpires.find((u) => u.id === umpire2)?.displayName || 'Unknown'
                      : 'None'
                  }
                  InputProps={{
                    readOnly: true,
                    sx: {
                      '& .MuiInputBase-input': {
                        cursor: 'default',
                      },
                      '&:before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                      },
                      '&:hover:not(.Mui-disabled):before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                      },
                    },
                  }}
                />
              </>
            )}
          </Box>
        )}

        {/* Umpires Row 2 */}
        {isAccountAdmin && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {canEditSchedule ? (
              <>
                <FormControl fullWidth>
                  <InputLabel>Umpire 3</InputLabel>
                  <Select
                    value={umpire3}
                    onChange={(e) => setUmpire3(e.target.value)}
                    label="Umpire 3"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {getAvailableUmpires('umpire3', umpire3).map((umpire) => (
                      <MenuItem key={umpire.id} value={umpire.id}>
                        {umpire.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Umpire 4</InputLabel>
                  <Select
                    value={umpire4}
                    onChange={(e) => setUmpire4(e.target.value)}
                    label="Umpire 4"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {getAvailableUmpires('umpire4', umpire4).map((umpire) => (
                      <MenuItem key={umpire.id} value={umpire.id}>
                        {umpire.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Umpire 3"
                  value={
                    umpire3
                      ? umpires.find((u) => u.id === umpire3)?.displayName || 'Unknown'
                      : 'None'
                  }
                  InputProps={{
                    readOnly: true,
                    sx: {
                      '& .MuiInputBase-input': {
                        cursor: 'default',
                      },
                      '&:before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                      },
                      '&:hover:not(.Mui-disabled):before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                      },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Umpire 4"
                  value={
                    umpire4
                      ? umpires.find((u) => u.id === umpire4)?.displayName || 'Unknown'
                      : 'None'
                  }
                  InputProps={{
                    readOnly: true,
                    sx: {
                      '& .MuiInputBase-input': {
                        cursor: 'default',
                      },
                      '&:before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                      },
                      '&:hover:not(.Mui-disabled):before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                      },
                    },
                  }}
                />
              </>
            )}
          </Box>
        )}

        {/* Comment - Only show if there are comments or user can edit */}
        {(canEditSchedule || comment.trim()) && (
          <TextField
            fullWidth
            label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            rows={3}
            InputProps={
              !canEditSchedule
                ? {
                    readOnly: true,
                    sx: {
                      '& .MuiInputBase-input': {
                        cursor: 'default',
                      },
                      '&:before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.42)',
                      },
                      '&:hover:not(.Mui-disabled):before': {
                        borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                      },
                    },
                  }
                : undefined
            }
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default GameFormFields;
