'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { searchContacts } from '@draco/shared-api-client';
import type {
  BaseContactType,
  CreateUmpireType,
  PagedContactType,
  UmpireType,
} from '@draco/shared-schemas';
import { CreateUmpireSchema } from '@draco/shared-schemas';
import { useApiClient } from '../../hooks/useApiClient';
import { useUmpireService } from '../../hooks/useUmpireService';
import { unwrapApiResult } from '../../utils/apiResult';

interface UmpireFormDialogProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { message: string; umpire: UmpireType }) => void;
  onError?: (message: string) => void;
}

const DEFAULT_VALUES: CreateUmpireType = {
  contactId: '',
};

const formatContactLabel = (contact: BaseContactType) =>
  `${contact.firstName} ${contact.lastName}`.trim() || contact.email || contact.id;

export const UmpireFormDialog: React.FC<UmpireFormDialogProps> = ({
  accountId,
  open,
  onClose,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const { createUmpire } = useUmpireService(accountId);
  const [contactOptions, setContactOptions] = useState<BaseContactType[]>([]);
  const [selectedContact, setSelectedContact] = useState<BaseContactType | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formResolver = useMemo(
    () =>
      zodResolver(CreateUmpireSchema) as Resolver<
        CreateUmpireType,
        Record<string, never>,
        CreateUmpireType
      >,
    [],
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUmpireType>({
    resolver: formResolver,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(DEFAULT_VALUES);
    setSelectedContact(null);
    setContactOptions([]);
    setSearchInput('');
    setSubmitError(null);
  }, [open, reset]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();

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
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to search contacts') as PagedContactType;
        setContactOptions(data.contacts ?? []);
      } catch (error) {
        console.warn('Failed to search contacts:', error);
        setContactOptions([]);
      } finally {
        setSearching(false);
      }
    },
    [accountId, apiClient],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      runSearch(searchInput);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [open, runSearch, searchInput]);

  const handleSelectContact = (contact: BaseContactType | null) => {
    setSelectedContact(contact);
    setValue('contactId', contact?.id ?? '', { shouldValidate: true });
    if (contact) {
      setSearchInput(formatContactLabel(contact));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const result = await createUmpire(values);

      if (result.success) {
        onSuccess?.({ message: result.message, umpire: result.data });
        onClose();
        return;
      }

      setSubmitError(result.error);
      onError?.(result.error);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create umpire';
      setSubmitError(message);
      onError?.(message);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Umpire</DialogTitle>
      <DialogContent>
        {submitError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        ) : null}
        <Controller
          control={control}
          name="contactId"
          render={({ field }) => (
            <Autocomplete
              options={contactOptions}
              value={selectedContact}
              inputValue={searchInput}
              onInputChange={(_event, value) => {
                setSearchInput(value);
              }}
              onChange={(_event, value) => {
                handleSelectContact(value);
                field.onChange(value?.id ?? '');
              }}
              getOptionLabel={(option) => formatContactLabel(option)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={searching}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Contact"
                  required
                  margin="normal"
                  error={Boolean(errors.contactId)}
                  helperText={errors.contactId?.message}
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
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={isSubmitting || !selectedContact}>
          {isSubmitting ? 'Saving…' : 'Add Umpire'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UmpireFormDialog;
