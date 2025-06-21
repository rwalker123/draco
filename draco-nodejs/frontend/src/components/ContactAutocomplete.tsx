import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  displayName: string;
  searchText: string;
}

interface ContactAutocompleteProps {
  label: string;
  onChange: (value: string) => void;
  value?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const ContactAutocomplete: React.FC<ContactAutocompleteProps> = ({
  label,
  onChange,
  value,
  required = false,
  error = false,
  helperText,
  disabled = false
}) => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [initialContact, setInitialContact] = useState<Contact | null>(null);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced search function
  const searchContacts = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setContacts([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/accounts/contacts/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.data.contacts);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchContacts(newInputValue);
    }, 300);
  };

  // Handle selection
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    
    // Clear the selected contact if user is typing
    if (newValue !== selectedContact?.searchText) {
      setSelectedContact(null);
      onChange('');
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setInputValue(contact.searchText);
    setShowDropdown(false);
    onChange(contact.userId);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Initialize input value when value prop changes
  useEffect(() => {
    if (value && contacts.length > 0) {
      const selectedContact = contacts.find(contact => contact.userId === value);
      if (selectedContact) {
        setInputValue(selectedContact.searchText);
      }
    }
  }, [value, contacts]);

  // Fetch initial contact information if value is provided
  useEffect(() => {
    if (value && !initialContact) {
      const fetchInitialContact = async () => {
        try {
          const response = await fetch(`/api/accounts/contacts/${value}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const contact = data.data.contact;
              setInitialContact(contact);
              setInputValue(contact.searchText);
              setSelectedContact(contact);
            }
          }
        } catch (error) {
          console.error('Error fetching initial contact:', error);
        }
      };
      
      fetchInitialContact();
    }
  }, [value, token, initialContact]);

  // Update input value when initial contact is loaded
  useEffect(() => {
    if (initialContact) {
      setInputValue(initialContact.searchText);
    }
  }, [initialContact]);

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        label={label}
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setShowDropdown(true)}
        required={required}
        error={error}
        ref={inputRef}
      />
      {showDropdown && (contacts.length > 0 || loading) && (
        <Box
          ref={dropdownRef}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {loading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            contacts.map((contact) => (
              <Box
                key={contact.userId}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
                onClick={() => handleContactSelect(contact)}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {contact.searchText}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
};

export default ContactAutocomplete; 