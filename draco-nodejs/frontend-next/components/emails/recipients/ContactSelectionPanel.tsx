'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
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

export interface ContactSelectionPanelProps {
  contacts: RecipientContact[];
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
}

/**
 * ContactSelectionPanel - Individual contact selection interface
 * Provides search, filtering, and virtualized contact list
 */
const ContactSelectionPanel: React.FC<ContactSelectionPanelProps> = ({
  contacts,
  selectedContactIds,
  searchQuery,
  onSearchChange,
  onContactToggle,
  onSelectAll,
  onClearAll,
  searchStats,
  allContactsSelected = false,
  onAllContactsToggle,
  compact = false,
}) => {
  // const theme = useTheme(); // Available for future styling needs
  const [showEmailOnly, setShowEmailOnly] = useState(false);

  // Filter contacts based on email availability
  const displayContacts = useMemo(() => {
    if (!showEmailOnly) return contacts;
    return contacts.filter((contact) => contact.email && contact.email.trim());
  }, [contacts, showEmailOnly]);

  // Virtualization for large contact lists
  const { virtualizedItems, containerProps, scrollProps, isVirtualized } = useContactVirtualization(
    displayContacts,
    {
      enabled: displayContacts.length > 50,
      config: {
        itemHeight: compact ? 56 : 72,
        containerHeight: compact ? 300 : 400,
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
    const hasEmail = contact.email && contact.email.trim();

    return (
      <ListItem
        key={contact.id}
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              {/* Select All Contacts toggle */}
              {onAllContactsToggle && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={allContactsSelected}
                      onChange={(e) => onAllContactsToggle(e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">All Contacts</Typography>}
                />
              )}

              {/* Email filter */}
              <FormControlLabel
                control={
                  <Switch
                    checked={showEmailOnly}
                    onChange={(e) => setShowEmailOnly(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="caption">Email Only</Typography>}
              />
            </Stack>

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
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {searchStats.filtered} of {searchStats.total} contacts
                  {searchQuery && ` matching "${searchQuery}"`}
                </Typography>
                <Typography variant="caption" color="primary">
                  {searchStats.selected} selected
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Contact List */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {displayContacts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? 'No contacts match your search'
                : showEmailOnly
                  ? 'No contacts with email addresses'
                  : 'No contacts available'}
            </Typography>
          </Box>
        ) : (
          <Box {...containerProps} {...scrollProps}>
            <List dense={compact}>
              {isVirtualized
                ? virtualizedItems.map((item, index) => renderContactItem(item.contact, index))
                : displayContacts.map((contact, index) => renderContactItem(contact, index))}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ContactSelectionPanel;
