'use client';

import React, { useMemo, memo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { StreamPaginationControl } from '../../pagination';
import { RecipientContact } from '../../../types/emails/recipients';
import { hasValidEmail } from '../common/mailtoUtils';
import UserAvatar from '../../users/UserAvatar';

export interface ContactSelectionTableProps {
  // Data
  contacts: RecipientContact[];
  selectedContactIds: Set<string>;

  // Pagination
  page: number;
  rowsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;

  // Search
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: (term: string) => void;
  onClearSearch: () => void;
  searchLoading?: boolean;
  isShowingSearchResults?: boolean;

  // Selection
  onContactToggle: (contactId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  allContactsSelected?: boolean;

  // State
  loading?: boolean;
  _isInitialLoad?: boolean;
  error?: string | null;

  // Display
  compact?: boolean;
  showEmailOnly?: boolean;
  onShowEmailOnlyChange?: (enabled: boolean) => void;
}

/**
 * ContactSelectionTable - Contact selection interface based on proven UserTableEnhanced pattern
 * Provides search, pagination, and multi-select functionality using working components
 */
const ContactSelectionTable: React.FC<ContactSelectionTableProps> = ({
  // Data
  contacts,
  selectedContactIds,

  // Pagination
  page,
  rowsPerPage,
  hasNext,
  hasPrev,
  onNextPage,
  onPrevPage,
  onRowsPerPageChange,

  // Search
  searchTerm,
  onSearchChange,
  onSearch,
  onClearSearch,
  searchLoading = false,
  isShowingSearchResults = false,

  // Selection
  onContactToggle,
  onSelectAll,
  onClearAll,
  allContactsSelected = false,

  // State
  loading = false,
  _isInitialLoad = false,
  error = null,

  // Display
  compact = false,
}) => {
  // Calculate selection stats - only count contacts with valid emails
  const selectionStats = useMemo(() => {
    const contactsWithEmail = contacts.filter((c) => hasValidEmail(c));
    const selectedCount = allContactsSelected ? contactsWithEmail.length : selectedContactIds.size;
    const totalCount = contactsWithEmail.length;
    return { selectedCount, totalCount, contactsWithEmail };
  }, [selectedContactIds.size, allContactsSelected, contacts]);

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Handle clear search
  const handleClearSearch = () => {
    onSearchChange('');
    onClearSearch();
  };

  // Check if contact is selected
  const isContactSelected = (contactId: string) => {
    return allContactsSelected || selectedContactIds.has(contactId);
  };

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    if (selectionStats.selectedCount > 0) {
      onClearAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Search */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Select Recipients
        </Typography>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searchLoading ? <CircularProgress size={20} /> : <SearchIcon color="action" />}
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </form>

        {/* Search Results Indicator */}
        {isShowingSearchResults && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Chip
              label="Search Results"
              size="small"
              onDelete={handleClearSearch}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {/* Table Container */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>
              Error loading contacts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
          </Box>
        ) : contacts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {isShowingSearchResults ? 'No contacts found' : 'No contacts available'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isShowingSearchResults
                    ? 'Try adjusting your search terms'
                    : 'No contacts are available for selection'}
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader size={compact ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectionStats.selectedCount > 0 &&
                        selectionStats.selectedCount < selectionStats.totalCount
                      }
                      checked={
                        selectionStats.selectedCount > 0 &&
                        selectionStats.selectedCount === selectionStats.totalCount
                      }
                      onChange={handleSelectAllToggle}
                      disabled={loading || allContactsSelected}
                    />
                  </TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Email</TableCell>
                  {!compact && <TableCell>Phone</TableCell>}
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.map((contact) => {
                  const isSelected = isContactSelected(contact.id);
                  const hasEmail = hasValidEmail(contact);

                  return (
                    <TableRow
                      key={contact.id}
                      hover
                      selected={isSelected}
                      onClick={hasEmail ? () => onContactToggle(contact.id) : undefined}
                      sx={{
                        cursor: hasEmail ? 'pointer' : 'not-allowed',
                        opacity: hasEmail ? 1 : 0.6,
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          disabled={allContactsSelected || !hasEmail}
                          onChange={() => onContactToggle(contact.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <UserAvatar
                            user={{
                              id: contact.id,
                              firstName: contact.displayName.split(' ')[0] || '',
                              lastName:
                                contact.displayName.split(' ').slice(1).join(' ') ||
                                contact.displayName.split(' ')[0] ||
                                '',
                              photoUrl: contact.photoUrl,
                            }}
                            size={compact ? 32 : 40}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={isSelected ? 'medium' : 'normal'}
                            >
                              {contact.displayName}
                            </Typography>
                            {contact.contactroles && contact.contactroles.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {contact.contactroles.map((role) => role.roleName).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        {hasEmail ? (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{contact.email}</Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No email
                          </Typography>
                        )}
                      </TableCell>

                      {!compact && (
                        <TableCell>
                          {contact.contactDetails?.phone1 ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {contact.contactDetails.phone1}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No phone
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      <TableCell>
                        {hasEmail ? (
                          <Chip label="Has Email" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="No Email" size="small" color="warning" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Footer with Selection Controls and Pagination */}
      {contacts.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {/* Pagination Controls */}
          {(hasNext || hasPrev) && (
            <StreamPaginationControl
              page={page}
              rowsPerPage={rowsPerPage}
              hasNext={hasNext}
              hasPrev={hasPrev}
              onNextPage={onNextPage}
              onPrevPage={onPrevPage}
              onRowsPerPageChange={onRowsPerPageChange}
              currentItems={contacts.length}
              itemLabel="Contacts"
              loading={loading}
              variant="default"
              showPageSize={true}
              showJumpControls={false}
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

// Memoize to prevent re-renders during state updates - based on working UserTableEnhanced pattern
export default memo(ContactSelectionTable, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.contacts === nextProps.contacts &&
    prevProps.loading === nextProps.loading &&
    prevProps.page === nextProps.page &&
    prevProps.hasNext === nextProps.hasNext &&
    prevProps.hasPrev === nextProps.hasPrev &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.searchLoading === nextProps.searchLoading &&
    prevProps.rowsPerPage === nextProps.rowsPerPage &&
    prevProps.selectedContactIds === nextProps.selectedContactIds &&
    prevProps.allContactsSelected === nextProps.allContactsSelected &&
    prevProps.isShowingSearchResults === nextProps.isShowingSearchResults
  );
});
