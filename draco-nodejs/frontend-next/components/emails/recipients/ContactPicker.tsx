'use client';

import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Typography,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material';

import { useRecipientSelection } from './RecipientSelectionProvider';
import { groupContactsByFirstLetter } from './recipientUtils';
import UserAvatar from '../../users/UserAvatar';
import { RecipientContact } from '../../../types/emails/recipients';

interface ContactPickerProps {
  maxHeight?: number;
  showSelectAll?: boolean;
  showEmailValidation?: boolean;
}

/**
 * ContactPicker - Individual contact selection with search and filtering
 */
export const ContactPicker: React.FC<ContactPickerProps> = ({
  maxHeight = 400,
  showSelectAll = true,
  showEmailValidation = true,
}) => {
  const { state, actions, contacts, validation } = useRecipientSelection();

  // Group contacts by first letter for organized display
  const groupedContacts = useMemo(() => {
    return groupContactsByFirstLetter(contacts);
  }, [contacts]);

  // Calculate selection stats
  const selectionStats = useMemo(() => {
    const selectableContacts = contacts.filter((c) => c.hasValidEmail);
    const selectedCount = selectableContacts.filter((c) => actions.isContactSelected(c.id)).length;
    const totalSelectable = selectableContacts.length;

    return {
      selectedCount,
      totalSelectable,
      allSelected: selectedCount > 0 && selectedCount === totalSelectable,
      indeterminate: selectedCount > 0 && selectedCount < totalSelectable,
    };
  }, [contacts, actions]);

  // Handle select all toggle
  const handleSelectAllToggle = useCallback(() => {
    if (selectionStats.allSelected) {
      // Deselect all individual contacts
      contacts.forEach((contact) => {
        if (actions.isContactSelected(contact.id)) {
          actions.deselectContact(contact.id);
        }
      });
    } else {
      // Select all valid contacts
      contacts.forEach((contact) => {
        if (contact.hasValidEmail && !actions.isContactSelected(contact.id)) {
          actions.selectContact(contact.id);
        }
      });
    }
  }, [contacts, actions, selectionStats.allSelected]);

  // Handle individual contact selection
  const handleContactToggle = useCallback(
    (contact: RecipientContact, event: React.MouseEvent) => {
      event.stopPropagation();

      if (event.shiftKey) {
        // TODO: Range selection needs backend integration to track last selected contact
        // For now, just toggle the contact
        actions.toggleContact(contact.id);
      } else {
        // Single selection
        actions.toggleContact(contact.id);
      }
    },
    [actions],
  );

  // Handle search input
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      actions.setSearchQuery(event.target.value);
    },
    [actions],
  );

  return (
    <Box>
      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search contacts by name, email, or phone..."
        value={state.searchQuery}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* Select All Option */}
      {showSelectAll && selectionStats.totalSelectable > 0 && (
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectionStats.allSelected}
                indeterminate={selectionStats.indeterminate}
                onChange={handleSelectAllToggle}
                icon={<SelectAllIcon />}
                checkedIcon={<SelectAllIcon />}
              />
            }
            label={
              <Typography variant="body2" fontWeight={500}>
                Select All ({selectionStats.totalSelectable} contacts)
              </Typography>
            }
          />
          <Divider sx={{ mt: 1 }} />
        </Box>
      )}

      {/* Validation Alerts */}
      {showEmailValidation && validation.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">{validation.warnings.join('. ')}</Typography>
        </Alert>
      )}

      {/* No Contacts Message */}
      {contacts.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            textAlign: 'center',
          }}
        >
          <PersonIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            {state.searchQuery ? 'No contacts found' : 'No contacts available'}
          </Typography>
          {state.searchQuery && (
            <Typography variant="body2" color="text.disabled">
              Try adjusting your search terms
            </Typography>
          )}
        </Box>
      )}

      {/* Contact Groups */}
      {contacts.length > 0 && (
        <Box
          sx={{
            maxHeight,
            overflow: 'auto',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          {Array.from(groupedContacts.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, groupContacts]) => (
              <Box key={letter}>
                {/* Group Header */}
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                    py: 1,
                    zIndex: 1,
                  }}
                >
                  <Typography variant="overline" fontWeight="bold" color="primary.main">
                    {letter} ({groupContacts.length})
                  </Typography>
                </Box>

                {/* Contacts in Group */}
                {groupContacts.map((contact) => {
                  const isSelected = actions.isContactSelected(contact.id);
                  const isDisabled = !contact.hasValidEmail;

                  return (
                    <Card
                      key={contact.id}
                      variant="outlined"
                      sx={{
                        m: 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.6 : 1,
                        '&:hover': {
                          backgroundColor: isDisabled ? 'inherit' : 'action.hover',
                        },
                        backgroundColor: isSelected ? 'action.selected' : 'inherit',
                      }}
                      onClick={(e) => !isDisabled && handleContactToggle(contact, e)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          {/* Selection Checkbox */}
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => !isDisabled && actions.toggleContact(contact.id)}
                            size="small"
                          />

                          {/* Contact Avatar */}
                          <UserAvatar
                            user={{
                              id: contact.id,
                              firstName: contact.firstname,
                              lastName: contact.lastname,
                              photoUrl: contact.avatar,
                            }}
                            size={40}
                            showHoverEffects={false}
                          />

                          {/* Contact Info */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="medium"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {contact.displayName}
                            </Typography>

                            <Stack direction="row" spacing={1} alignItems="center">
                              {contact.email ? (
                                <Chip
                                  icon={<EmailIcon />}
                                  label={contact.email}
                                  size="small"
                                  variant="outlined"
                                  color={contact.hasValidEmail ? 'default' : 'error'}
                                  sx={{
                                    maxWidth: '200px',
                                    '& .MuiChip-label': {
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    },
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="No email"
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                />
                              )}

                              {contact.roles && contact.roles.length > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  {contact.roles.map((role) => role.roleName).join(', ')}
                                </Typography>
                              )}
                            </Stack>
                          </Box>

                          {/* Selection Indicator */}
                          {/* TODO: Show selection indicator when contact is selected via group vs individual */}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ))}
        </Box>
      )}

      {/* Selection Summary */}
      {contacts.length > 0 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {selectionStats.selectedCount} of {selectionStats.totalSelectable} contacts selected
            {validation.invalidEmailCount > 0 && (
              <> ({validation.invalidEmailCount} without email will be skipped)</>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
