'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Pagination,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Autocomplete from '@mui/material/Autocomplete';
import { useForm, Controller, Resolver, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  HofNominationType,
  HofNominationListType,
  UpdateHofNominationSchema,
  UpdateHofNominationType,
  HofNominationInductSchema,
  HofNominationInductType,
  HofContactSummaryType,
} from '@draco/shared-schemas';
import { z } from 'zod';
import { useHallOfFameService } from '@/hooks/useHallOfFameService';
import { useNotifications } from '@/hooks/useNotifications';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatPhoneInput, formatPhoneNumber } from '@/utils/phoneNumber';
import WidgetShell from '@/components/ui/WidgetShell';

interface NominationsWidgetProps {
  accountId: string;
  onNominationInducted: () => void;
}

const PAGE_SIZE = 10;
const NOMINATION_REASON_LIMIT = 1000;

const UpdateNominationFormSchema = UpdateHofNominationSchema.extend({
  phoneNumber: UpdateHofNominationSchema.shape.phoneNumber.transform((value) => value ?? ''),
  reason: UpdateHofNominationSchema.shape.reason.refine(
    (value) => value.length <= NOMINATION_REASON_LIMIT,
    { message: `Reason must be ${NOMINATION_REASON_LIMIT} characters or fewer` },
  ),
});

type NominationFormValues = z.infer<typeof UpdateNominationFormSchema>;

const NominationsWidget: React.FC<NominationsWidgetProps> = ({
  accountId,
  onNominationInducted,
}) => {
  const {
    listNominations,
    deleteNomination,
    updateNomination,
    inductNomination,
    listEligibleContacts,
  } = useHallOfFameService(accountId);
  const { showNotification } = useNotifications();

  const [nominations, setNominations] = React.useState<HofNominationType[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [detailsNomination, setDetailsNomination] = React.useState<HofNominationType | null>(null);
  const [editNominationTarget, setEditNominationTarget] = React.useState<HofNominationType | null>(
    null,
  );
  const [deleteNominationTarget, setDeleteNominationTarget] =
    React.useState<HofNominationType | null>(null);
  const [inductNominationTarget, setInductNominationTarget] =
    React.useState<HofNominationType | null>(null);

  const loadNominations = React.useCallback(
    async (pageNumber: number) => {
      setLoading(true);
      setError(null);
      try {
        const response: HofNominationListType = await listNominations({
          page: pageNumber,
          pageSize: PAGE_SIZE,
        });
        setNominations(response.nominations);
        setTotal(response.total ?? response.nominations.length);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load nominations.';
        setError(message);
        setNominations([]);
      } finally {
        setLoading(false);
      }
    },
    [listNominations],
  );

  React.useEffect(() => {
    void loadNominations(page);
  }, [page, loadNominations]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleDeleteNomination = async (nomination: HofNominationType) => {
    try {
      await deleteNomination(nomination.id);
      showNotification('Nomination deleted.', 'success');
      setDeleteNominationTarget(null);
      const nextTotal = Math.max(total - 1, 0);
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / PAGE_SIZE)));
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadNominations(nextPage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete nomination.';
      setError(message);
    }
  };

  const handleEditNomination = async (nominationId: string, values: UpdateHofNominationType) => {
    try {
      const updated = await updateNomination(nominationId, values);
      setEditNominationTarget(null);
      showNotification('Nomination updated.', 'success');
      setNominations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update nomination.';
      setError(message);
      throw err;
    }
  };

  const handleInductNomination = async (nominationId: string, values: HofNominationInductType) => {
    try {
      await inductNomination(nominationId, values);
      showNotification('Nomination inducted into the Hall of Fame.', 'success');
      setInductNominationTarget(null);
      onNominationInducted();
      const nextTotal = Math.max(total - 1, 0);
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / PAGE_SIZE)));
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadNominations(nextPage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to induct nomination.';
      setError(message);
      throw err;
    }
  };

  return (
    <WidgetShell
      title="Nominations"
      subtitle="Review submissions and induct deserving nominees."
      accent="secondary"
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading nominations…
        </Alert>
      ) : null}

      {!loading && nominations.length === 0 ? (
        <Alert severity="info">No nominations have been submitted yet.</Alert>
      ) : null}

      <List disablePadding>
        {nominations.map((nomination) => (
          <ListItem
            key={nomination.id}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <ListItemText
              primary={
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {nomination.nominee}
                </Typography>
              }
              secondary={
                <Stack spacing={0.5}>
                  <Typography component="span" variant="body2" color="text.secondary">
                    Nominated by {nomination.nominator} ({nomination.email})
                  </Typography>
                  <Typography component="span" variant="body2" color="text.secondary">
                    {nomination.reason.length > 160
                      ? `${nomination.reason.slice(0, 160)}…`
                      : nomination.reason}
                  </Typography>
                </Stack>
              }
              primaryTypographyProps={{ component: 'span' }}
              secondaryTypographyProps={{ component: 'div' }}
            />
            <ListItemSecondaryAction>
              <Tooltip title="View details">
                <IconButton onClick={() => setDetailsNomination(nomination)}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit nomination">
                <IconButton
                  onClick={() => setEditNominationTarget(nomination)}
                  sx={{ ml: 1 }}
                  color="primary"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Induct nominee">
                <IconButton onClick={() => setInductNominationTarget(nomination)} sx={{ ml: 1 }}>
                  <EmojiEventsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete nomination">
                <IconButton
                  onClick={() => setDeleteNominationTarget(nomination)}
                  sx={{ ml: 1 }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {total > PAGE_SIZE ? (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      ) : null}

      {detailsNomination ? (
        <NominationDetailsDialog
          nomination={detailsNomination}
          onClose={() => setDetailsNomination(null)}
          onEdit={() => {
            setEditNominationTarget(detailsNomination);
            setDetailsNomination(null);
          }}
          onInduct={() => {
            setInductNominationTarget(detailsNomination);
            setDetailsNomination(null);
          }}
          onDelete={() => {
            setDeleteNominationTarget(detailsNomination);
            setDetailsNomination(null);
          }}
        />
      ) : null}

      {editNominationTarget ? (
        <NominationEditDialog
          nomination={editNominationTarget}
          onClose={() => setEditNominationTarget(null)}
          onSubmit={handleEditNomination}
        />
      ) : null}

      {deleteNominationTarget ? (
        <NominationDeleteDialog
          nomination={deleteNominationTarget}
          onClose={() => setDeleteNominationTarget(null)}
          onConfirm={() => handleDeleteNomination(deleteNominationTarget)}
        />
      ) : null}

      {inductNominationTarget ? (
        <NominationInductDialog
          nomination={inductNominationTarget}
          onClose={() => setInductNominationTarget(null)}
          onSubmit={handleInductNomination}
          listEligibleContacts={listEligibleContacts}
        />
      ) : null}
    </WidgetShell>
  );
};

interface NominationDetailsDialogProps {
  nomination: HofNominationType;
  onClose: () => void;
  onEdit: () => void;
  onInduct: () => void;
  onDelete: () => void;
}

const NominationDetailsDialog: React.FC<NominationDetailsDialogProps> = ({
  nomination,
  onClose,
  onEdit,
  onInduct,
  onDelete,
}) => (
  <Dialog open onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Nomination Details</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Nominee
          </Typography>
          <Typography variant="body1">{nomination.nominee}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Nominator
          </Typography>
          <Typography variant="body1">
            {nomination.nominator} ({nomination.email}, {nomination.phoneNumber})
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Reason
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {nomination.reason}
          </Typography>
        </Box>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
      <Button onClick={onEdit} startIcon={<EditIcon fontSize="small" />}>
        Edit
      </Button>
      <Button onClick={onInduct} startIcon={<EmojiEventsIcon fontSize="small" />}>
        Induct
      </Button>
      <Button color="error" onClick={onDelete} startIcon={<DeleteIcon fontSize="small" />}>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

interface NominationEditDialogProps {
  nomination: HofNominationType;
  onClose: () => void;
  onSubmit: (nominationId: string, values: UpdateHofNominationType) => Promise<void>;
}

const NominationEditDialog: React.FC<NominationEditDialogProps> = ({
  nomination,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NominationFormValues>({
    resolver: zodResolver(UpdateNominationFormSchema) as Resolver<NominationFormValues>,
    defaultValues: {
      nominator: nomination.nominator,
      phoneNumber: formatPhoneNumber(nomination.phoneNumber ?? ''),
      email: nomination.email,
      nominee: nomination.nominee,
      reason: nomination.reason,
    },
  });
  const reasonValue = useWatch({ control, name: 'reason' });

  React.useEffect(() => {
    reset({
      nominator: nomination.nominator,
      phoneNumber: formatPhoneNumber(nomination.phoneNumber ?? ''),
      email: nomination.email,
      nominee: nomination.nominee,
      reason: nomination.reason,
    });
  }, [nomination, reset]);

  const handleFormSubmit = async (values: NominationFormValues) => {
    await onSubmit(nomination.id, {
      ...values,
      phoneNumber: values.phoneNumber.trim(),
    });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <DialogTitle>Edit Nomination</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Nominator"
              required
              error={Boolean(errors.nominator)}
              helperText={errors.nominator?.message}
              {...register('nominator')}
            />
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Phone Number"
                  required
                  value={field.value ?? ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    field.onChange(formatPhoneInput(event.target.value))
                  }
                  onBlur={field.onBlur}
                  inputProps={{ inputMode: 'tel' }}
                  error={Boolean(errors.phoneNumber)}
                  helperText={errors.phoneNumber?.message}
                />
              )}
            />
            <TextField
              label="Email"
              type="email"
              required
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Nominee"
              required
              error={Boolean(errors.nominee)}
              helperText={errors.nominee?.message}
              {...register('nominee')}
            />
            <TextField
              label="Reason"
              required
              multiline
              minRows={4}
              error={Boolean(errors.reason)}
              helperText={
                errors.reason?.message ??
                `Explain why this nominee should be inducted. (${reasonValue?.length ?? 0}/${NOMINATION_REASON_LIMIT})`
              }
              inputProps={{ maxLength: NOMINATION_REASON_LIMIT }}
              {...register('reason')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

interface NominationDeleteDialogProps {
  nomination: HofNominationType;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const NominationDeleteDialog: React.FC<NominationDeleteDialogProps> = ({
  nomination,
  onClose,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete nomination.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete Nomination</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography>
            Are you sure you want to delete the nomination for <strong>{nomination.nominee}</strong>
            ? This action cannot be undone.
          </Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface NominationInductDialogProps {
  nomination: HofNominationType;
  onClose: () => void;
  onSubmit: (nominationId: string, values: HofNominationInductType) => Promise<void>;
  listEligibleContacts: ReturnType<typeof useHallOfFameService>['listEligibleContacts'];
}

const NominationInductDialog: React.FC<NominationInductDialogProps> = ({
  nomination,
  onClose,
  onSubmit,
  listEligibleContacts,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<HofNominationInductType>({
    resolver: zodResolver(HofNominationInductSchema),
    defaultValues: {
      contactId: '',
      yearInducted: new Date().getFullYear(),
      biographyHtml: nomination.reason,
    },
  });

  const contactIdValue = watch('contactId');
  const [contacts, setContacts] = React.useState<HofContactSummaryType[]>([]);
  const [selectedContact, setSelectedContact] = React.useState<HofContactSummaryType | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [contactsLoading, setContactsLoading] = React.useState(false);
  const debouncedSearch = useDebouncedValue(inputValue, 300);

  const loadContacts = React.useCallback(
    async (search?: string) => {
      setContactsLoading(true);
      try {
        const response = await listEligibleContacts({
          search,
          page: 1,
          pageSize: 20,
        });
        setContacts(response.contacts);
      } catch {
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    },
    [listEligibleContacts],
  );

  React.useEffect(() => {
    if (!nomination) {
      return;
    }
    reset({
      contactId: '',
      yearInducted: new Date().getFullYear(),
      biographyHtml: nomination.reason,
    });
    setSelectedContact(null);
    setInputValue('');
    void loadContacts('');
  }, [nomination, reset, loadContacts]);

  React.useEffect(() => {
    void loadContacts(debouncedSearch);
  }, [debouncedSearch, loadContacts]);

  React.useEffect(() => {
    if (!contactIdValue) {
      setSelectedContact(null);
      return;
    }
    const match = contacts.find((option) => option.id === contactIdValue);
    if (match) {
      setSelectedContact(match);
    }
  }, [contactIdValue, contacts]);

  const autocompleteOptions = React.useMemo(() => {
    if (!selectedContact) {
      return contacts;
    }
    const exists = contacts.some((option) => option.id === selectedContact.id);
    if (exists) {
      return contacts;
    }
    return [selectedContact, ...contacts];
  }, [contacts, selectedContact]);

  const handleFormSubmit = async (values: HofNominationInductType) => {
    await onSubmit(nomination.id, values);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <DialogTitle>Induct Nomination</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Controller
              name="contactId"
              control={control}
              render={({ field }) => (
                <Autocomplete<HofContactSummaryType>
                  options={autocompleteOptions}
                  loading={contactsLoading}
                  loadingText="Loading contacts…"
                  value={selectedContact}
                  onChange={(_, option) => {
                    setSelectedContact(option ?? null);
                    field.onChange(option?.id ?? '');
                    if (!option) {
                      setInputValue('');
                    }
                  }}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input') {
                      setInputValue(value);
                    }
                    if (reason === 'clear') {
                      setInputValue('');
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  getOptionLabel={(option) => option.displayName ?? 'Unknown'}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Contact"
                      required
                      error={Boolean(errors.contactId)}
                      helperText={errors.contactId?.message ?? 'Choose the contact to induct.'}
                    />
                  )}
                />
              )}
            />

            <Controller
              name="yearInducted"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Induction Year"
                  type="number"
                  required
                  inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                  error={Boolean(errors.yearInducted)}
                  helperText={errors.yearInducted?.message}
                />
              )}
            />

            <Controller
              name="biographyHtml"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Biography"
                  multiline
                  minRows={4}
                  error={Boolean(errors.biographyHtml)}
                  helperText={
                    errors.biographyHtml?.message ?? 'This will appear on the Hall of Fame page.'
                  }
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Inducting…' : 'Induct Nominee'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NominationsWidget;
