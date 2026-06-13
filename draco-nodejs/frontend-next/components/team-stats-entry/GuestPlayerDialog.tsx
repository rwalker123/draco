'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { searchContacts } from '@draco/shared-api-client';
import type { BaseContactType, PagedContactType } from '@draco/shared-schemas';

import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';

interface GuestPlayerDialogProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  onAdd: (contactId: string) => Promise<void>;
}

const formatContactLabel = (contact: BaseContactType) =>
  `${contact.firstName} ${contact.lastName}`.trim() || contact.email || contact.id;

const GuestPlayerDialog: React.FC<GuestPlayerDialogProps> = ({
  accountId,
  open,
  onClose,
  onAdd,
}) => {
  const apiClient = useApiClient();
  const [contactOptions, setContactOptions] = useState<BaseContactType[]>([]);
  const [selectedContact, setSelectedContact] = useState<BaseContactType | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setContactOptions([]);
    setSelectedContact(null);
    setSearchInput('');
    setError(null);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const controller = new AbortController();

    const runSearch = async () => {
      const trimmed = searchInput.trim();

      if (!trimmed) {
        setContactOptions([]);
        return;
      }

      setSearching(true);

      try {
        const result = await searchContacts({
          client: apiClient,
          path: { accountId },
          query: {
            q: trimmed,
            page: 1,
            limit: 10,
            sortOrder: 'asc',
          },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const data = unwrapApiResult(result, 'Failed to search contacts') as PagedContactType;
        setContactOptions(data.contacts ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.warn('Failed to search contacts:', err);
        setContactOptions([]);
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    };

    searchTimeoutRef.current = setTimeout(() => {
      void runSearch();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      controller.abort();
    };
  }, [open, searchInput, accountId, apiClient]);

  const handleSubmit = async () => {
    if (!selectedContact) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onAdd(selectedContact.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add guest player');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Guest Player</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Add an existing contact as a one-time guest so you can record their stats for this team.
          This does not change the player&apos;s roster on their own team.
        </DialogContentText>
        <Autocomplete
          filterOptions={(x) => x}
          options={contactOptions}
          value={selectedContact}
          inputValue={searchInput}
          onInputChange={(_event, value) => {
            setSearchInput(value);
          }}
          onChange={(_event, value) => {
            setSelectedContact(value);
            if (value) {
              setSearchInput(formatContactLabel(value));
            }
          }}
          getOptionLabel={(option) => formatContactLabel(option)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={searching}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search contacts"
              placeholder="Type a name"
              autoFocus
              error={Boolean(error)}
              helperText={error ?? undefined}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searching ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !selectedContact}
        >
          {submitting ? 'Adding…' : 'Add Guest'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GuestPlayerDialog;
