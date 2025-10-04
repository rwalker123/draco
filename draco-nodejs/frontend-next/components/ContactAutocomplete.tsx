import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Typography,
  Popper,
  ClickAwayListener,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { createUserManagementService } from '../services/userManagementService';

interface SearchContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | undefined;
  userId?: string | undefined;
  displayName?: string;
  searchText?: string;
}

interface ContactAutocompleteProps {
  label: string;
  onChange: (value: string) => void;
  value?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  accountId?: string;
}

const ContactAutocomplete: React.FC<ContactAutocompleteProps> = ({
  label,
  onChange,
  value,
  required = false,
  error = false,
  helperText,
  disabled = false,
  accountId,
}) => {
  const { token } = useAuth();
  const [selectedContact, setSelectedContact] = useState<SearchContact | null>(null);
  const [initialContact, setInitialContact] = useState<SearchContact | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !accountId || !token) {
        setSearchResults([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      setIsOpen(true);

      try {
        const userService = createUserManagementService(token);
        const results = await userService.searchUsers(accountId, query, undefined, undefined);

        // Transform users to contacts format for consistency
        const contacts: SearchContact[] = results.users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email || undefined,
          userId: user.userId || undefined,
          displayName: `${user.firstName} ${user.lastName}`,
          searchText: `${user.firstName} ${user.lastName} ${user.email ?? ''}`.trim(),
        }));

        setSearchResults(contacts);
      } catch (error) {
        console.error('Error searching contacts:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [token, accountId],
  );

  // Handle input change with debouncing
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setHighlightedIndex(-1);

    // Clear the selected contact if user is typing
    if (newValue !== selectedContact?.searchText) {
      setSelectedContact(null);
      onChange('');
    }

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(newValue);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectContact(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle contact selection
  const handleSelectContact = (contact: SearchContact) => {
    setSelectedContact(contact);
    setInputValue(contact.displayName || `${contact.firstName} ${contact.lastName}`);
    onChange(contact.id);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSearchResults([]);
  };

  // Handle click away
  const handleClickAway = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Initialize input value when value prop changes
  useEffect(() => {
    if (value && initialContact && initialContact.id === value) {
      setInputValue(
        initialContact.displayName || `${initialContact.firstName} ${initialContact.lastName}`,
      );
    }
  }, [value, initialContact]);

  // Fetch initial contact information if value is provided
  useEffect(() => {
    // Only fetch if we have a valid UUID-like contact ID (not empty, not a number like "3")
    if (value && value.trim() !== '' && value.length > 10 && !initialContact) {
      const fetchInitialContact = async () => {
        try {
          if (!token || !accountId) {
            return;
          }

          const userService = createUserManagementService(token);
          const contact = await userService.getContact(accountId, value);

          const normalizedContact: SearchContact = {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email || undefined,
            userId: contact.userId || undefined,
            displayName: `${contact.firstName} ${contact.lastName}`.trim(),
            searchText: `${contact.firstName} ${contact.lastName} ${contact.email ?? ''}`.trim(),
          };

          setInitialContact(normalizedContact);
          setInputValue(normalizedContact.displayName || normalizedContact.searchText || '');
          setSelectedContact(normalizedContact);
        } catch (error) {
          console.error('Error fetching initial contact:', error);
        }
      };

      fetchInitialContact();
    }
  }, [value, token, initialContact, accountId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          label={label}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim() && searchResults.length > 0) {
              setIsOpen(true);
            }
          }}
          required={required}
          error={error}
          helperText={helperText}
          disabled={disabled}
          ref={inputRef}
          InputProps={{
            endAdornment: isSearching ? <CircularProgress size={20} /> : null,
          }}
        />

        <Popper
          open={isOpen && (searchResults.length > 0 || isSearching)}
          anchorEl={inputRef.current}
          placement="bottom-start"
          style={{ zIndex: 1300, width: inputRef.current?.offsetWidth }}
        >
          <Paper elevation={3} sx={{ maxHeight: 200, overflow: 'auto' }}>
            {isSearching ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Searching...
                </Typography>
              </Box>
            ) : searchResults.length > 0 ? (
              <List dense>
                {searchResults.map((contact, index) => (
                  <ListItem
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor:
                        index === highlightedIndex ? 'action.selected' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={contact.displayName || `${contact.firstName} ${contact.lastName}`}
                      secondary={contact.email}
                    />
                  </ListItem>
                ))}
              </List>
            ) : inputValue.trim() && !isSearching ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            ) : null}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default ContactAutocomplete;
