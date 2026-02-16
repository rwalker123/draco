'use client';

import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { AdminSubItemCard } from './index';
import { type AdminSearchItem, searchAdminItems } from '../../lib/admin-hub-registry';

interface AdminHubSearchProps {
  items: AdminSearchItem[];
  accountId: string;
  isGlobalAdmin: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const AdminHubSearch: React.FC<AdminHubSearchProps> = ({
  items,
  accountId,
  isGlobalAdmin,
  searchTerm,
  onSearchChange,
}) => {
  const theme = useTheme();

  const results = searchAdminItems(items, searchTerm, isGlobalAdmin);
  const isSearching = searchTerm.trim().length > 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search admin pages..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: isSearching ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{ width: '100%', maxWidth: 600 }}
        />
      </Box>

      {isSearching && (
        <Box>
          {results.length > 0 ? (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                {results.length} {results.length === 1 ? 'result' : 'results'} found
              </Typography>
              <Grid container spacing={3}>
                {results.map((item) => (
                  <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box sx={{ position: 'relative' }}>
                      <AdminSubItemCard
                        title={item.title}
                        description={item.description}
                        icon={item.icon}
                        href={item.getHref(accountId)}
                      />
                      <Chip
                        label={item.category}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontSize: '0.7rem',
                          height: 22,
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? theme.palette.grey[800]
                              : theme.palette.grey[100],
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No admin pages found matching &ldquo;{searchTerm}&rdquo;
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AdminHubSearch;
