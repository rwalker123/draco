'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
} from '@mui/icons-material';
import { IClassifiedsHeaderProps } from '../../types/playerClassifieds';

const ClassifiedsHeader: React.FC<IClassifiedsHeaderProps> = ({
  accountId: _accountId,
  onSearch,
  searchTerm,
  onCreatePlayersWanted,
  onCreateTeamsWanted,
  onViewModeChange,
  viewMode,
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" flexDirection="column" gap={3}>
        {/* Title and Create Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Player Classifieds
          </Typography>
          <Box display="flex" gap={2}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreatePlayersWanted}>
              Post Players Wanted
            </Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreateTeamsWanted}>
              Post Teams Wanted
            </Button>
          </Box>
        </Box>

        {/* Search and View Controls */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {/* Search */}
          <TextField
            placeholder="Search classifieds..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                onViewModeChange(newMode);
              }
            }}
            aria-label="view mode"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Paper>
  );
};

export default ClassifiedsHeader;
