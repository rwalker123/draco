'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Typography,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  SelectAll as SelectAllIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';

import { useContactVirtualization } from './hooks/useContactVirtualization';
import { RecipientContact } from '../../../types/emails/recipients';
import { StreamPaginationControl } from '../../pagination';

import { hasValidEmail } from '../common/mailtoUtils';
import { ErrorBoundary } from '../../common/ErrorBoundary';

export interface ContactSelectionPanelProps {
  selectedContactIds: Set<string>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onContactToggle: (contactId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  searchStats?: {
    total: number;
    filtered: number;
    selected: number;
  };
  allContactsSelected?: boolean;
  onAllContactsToggle?: (enabled: boolean) => void;
  compact?: boolean;
  // Pagination props
  currentPage?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  loading?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  rowsPerPage?: number;
  error?: string | null;
  // Optional contacts override (when not using provider)
  contacts?: RecipientContact[];
  // Search results message to display above pagination
  searchResultsMessage?: React.ReactNode;
}

/**
 * ContactSelectionPanel - Individual contact selection interface
 * Provides search, filtering, virtualized contact list, and pagination
 */
const ContactSelectionPanel: React.FC<ContactSelectionPanelProps> = ({
  selectedContactIds,
  searchQuery,
  onSearchChange,
  onContactToggle,
  onSelectAll,
  onClearAll,
  searchStats,
  allContactsSelected = false,
  onAllContactsToggle: _onAllContactsToggle,
  compact = false,
  currentPage = 1,
  hasNext = false,
  hasPrev = false,
  loading = false,
  onNextPage,
  onPrevPage,
  onRowsPerPageChange,
  rowsPerPage = 25,
  error = null,
  contacts: propContacts,
  searchResultsMessage,
}) => {
  // const theme = useTheme(); // Available for future styling needs

  const listContainerRef = useRef<HTMLDivElement>(null);

  // Use contacts from props if provided, otherwise empty array (provider-independent)
  const contactsToUse = useMemo(() => propContacts || [], [propContacts]);
  const [previousContactCount, setPreviousContactCount] = useState(contactsToUse?.length || 0);

  // Auto-scroll to show new contacts when they're loaded
  useEffect(() => {
    const currentContactCount = contactsToUse?.length || 0;
    if (currentContactCount > previousContactCount && listContainerRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (listContainerRef.current) {
          const container = listContainerRef.current;
          const itemHeight = compact ? 56 : 72;
          const newItemsStart = previousContactCount * itemHeight;

          // Scroll to show the first new contact
          container.scrollTo({
            top: newItemsStart - 50, // 50px offset to show a bit of context
            behavior: 'smooth',
          });
        }
      }, 100);
    }
    setPreviousContactCount(currentContactCount);
  }, [contactsToUse?.length, previousContactCount, compact]);

  // Display contacts without filtering
  const displayContacts = useMemo(() => {
    const contacts = contactsToUse || [];

    // Force List re-render by creating new array reference with timestamp
    const resultArray = [...contacts];
    return resultArray;
  }, [contactsToUse]);

  // Disable virtualization completely to prevent pagination conflicts
  const { virtualizedItems, containerProps, scrollProps, isVirtualized } = useContactVirtualization(
    displayContacts,
    {
      enabled: false, // DISABLED: Virtualization conflicts with pagination
      config: {
        itemHeight: compact ? 56 : 72,
        containerHeight: compact ? 600 : 800, // Larger height for more contacts
        threshold: 999, // Effectively disabled
      },
    },
  );

  // Handle clear search
  const handleClearSearch = () => {
    onSearchChange('');
  };

  // Handle contact selection
  const handleContactSelect = (contact: RecipientContact) => {
    onContactToggle(contact.id);
  };

  // Check if contact is selected
  const isContactSelected = (contactId: string) => {
    return allContactsSelected || selectedContactIds.has(contactId);
  };

  // Get contact initials for avatar
  const getContactInitials = (contact: RecipientContact) => {
    const names = contact.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return contact.displayName.substring(0, 2).toUpperCase();
  };

  // Get contact subtitle (available for future use)
  // const getContactSubtitle = (contact: RecipientContact) => {
  //   const parts = [];
  //   if (contact.email) parts.push(contact.email);
  //   if (contact.role) parts.push(contact.role);
  //   return parts.join(' • ');
  // };

  // Render contact item
  const renderContactItem = (contact: RecipientContact, index: number) => {
    const isSelected = isContactSelected(contact.id);
    const hasEmail = hasValidEmail(contact);

    return (
      <ListItem
        key={`${contact.id}-page-${currentPage}`}
        disablePadding
        sx={{
          position: isVirtualized ? 'absolute' : 'relative',
          top: isVirtualized ? virtualizedItems[index]?.top : 'auto',
          height: isVirtualized ? virtualizedItems[index]?.height : 'auto',
          width: '100%',
          bgcolor: isSelected ? 'action.selected' : 'transparent',
        }}
      >
        <ListItemButton
          onClick={() => handleContactSelect(contact)}
          dense={compact}
          sx={{
            pl: 1,
            pr: 2,
            py: compact ? 1 : 1.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Checkbox
              checked={isSelected}
              disabled={allContactsSelected}
              size={compact ? 'small' : 'medium'}
            />
          </ListItemIcon>

          <Avatar
            sx={{
              width: compact ? 32 : 40,
              height: compact ? 32 : 40,
              mr: 2,
              bgcolor: isSelected ? 'primary.main' : 'grey.400',
              fontSize: compact ? '0.875rem' : '1rem',
            }}
          >
            {contact.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.avatar}
                alt={contact.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              getContactInitials(contact)
            )}
          </Avatar>

          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant={compact ? 'body2' : 'body1'}
                  fontWeight={isSelected ? 'medium' : 'normal'}
                  noWrap
                >
                  {contact.displayName}
                </Typography>
                {/* Manager badge would be shown here if role hierarchy is implemented */}
              </Stack>
            }
            secondary={
              !compact && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  {hasEmail && (
                    <>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {contact.email}
                      </Typography>
                    </>
                  )}
                  {contact.phone && (
                    <>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {contact.phone}
                      </Typography>
                    </>
                  )}
                </Stack>
              )
            }
          />

          <ListItemSecondaryAction>
            {!hasEmail && <Chip label="No Email" size="small" color="warning" variant="outlined" />}
          </ListItemSecondaryAction>
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and Controls */}
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Stack spacing={2}>
          {/* Search field */}
          <TextField
            fullWidth
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            size={compact ? 'small' : 'medium'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Controls */}
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
            <Stack direction="row" alignItems="center" spacing={2}></Stack>

            {/* Action buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SelectAllIcon />}
                onClick={onSelectAll}
                disabled={allContactsSelected}
              >
                All
              </Button>
              <Button size="small" variant="outlined" onClick={onClearAll}>
                Clear
              </Button>
            </Stack>
          </Stack>

          {/* Search stats */}
          {searchStats && (
            <>
              <Divider />
              <Stack direction="row" justifyContent="center" alignItems="center">
                <Typography variant="caption" color="primary">
                  {searchStats.selected} selected
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Contact List - Will shrink to accommodate fixed search message and pagination */}
      <Box ref={listContainerRef} sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {displayContacts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No contacts match your search' : 'No contacts available'}
            </Typography>
          </Box>
        ) : (
          <ErrorBoundary
            componentName="ContactList"
            fallback={
              <Alert severity="error" sx={{ m: 2 }}>
                <AlertTitle>Contact List Unavailable</AlertTitle>
                The contact list encountered an error. Please try refreshing the page.
                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => window.location.reload()}
                  variant="outlined"
                >
                  Refresh Page
                </Button>
              </Alert>
            }
            onError={(error) => {
              console.error('ContactList error:', error);
            }}
          >
            <Box {...containerProps} {...scrollProps}>
              <List
                dense={compact}
                key={`contact-list-page-${currentPage}-${displayContacts.length}-${displayContacts[0]?.id || 'empty'}`}
              >
                {isVirtualized
                  ? virtualizedItems.map((item, index) => renderContactItem(item.contact, index))
                  : displayContacts.map((contact, index) => renderContactItem(contact, index))}
              </List>

              {/* Loading Indicator - Inside scrollable area */}
              {loading && !hasNext && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {/* Error State - Inside scrollable area */}
              {error && (
                <Box sx={{ p: 2 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              )}
            </Box>
          </ErrorBoundary>
        )}
      </Box>

      {/* Search Results Message - Above pagination to prevent overflow */}
      {searchResultsMessage && (
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: 2,
            backgroundColor: 'action.hover',
            flexShrink: 0,
          }}
        >
          {searchResultsMessage}
        </Box>
      )}

      {/* Pagination Controls - Show if there's pagination available or if we have contacts */}
      {(hasNext || hasPrev) && displayContacts.length > 0 && (
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <StreamPaginationControl
            page={currentPage}
            rowsPerPage={rowsPerPage}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onNextPage={onNextPage || (() => {})}
            onPrevPage={onPrevPage || (() => {})}
            onRowsPerPageChange={onRowsPerPageChange || (() => {})}
            currentItems={displayContacts.length}
            itemLabel="contacts"
            loading={loading}
            variant="compact"
            showPageSize={false}
            showJumpControls={false}
          />
        </Box>
      )}
    </Box>
  );
};

export default ContactSelectionPanel;
