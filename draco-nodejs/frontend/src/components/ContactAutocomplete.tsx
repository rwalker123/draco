import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Box
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
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [initialContact, setInitialContact] = useState<Contact | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle selection
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    
    // Clear the selected contact if user is typing
    if (newValue !== selectedContact?.searchText) {
      setSelectedContact(null);
      onChange('');
    }
  };

  // Initialize input value when value prop changes
  useEffect(() => {
    if (value && initialContact && initialContact.userId === value) {
      setInputValue(initialContact.searchText);
    }
  }, [value, initialContact]);

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
        required={required}
        error={error}
        helperText={helperText}
        disabled={disabled}
        ref={inputRef}
      />
    </Box>
  );
};

export default ContactAutocomplete; 