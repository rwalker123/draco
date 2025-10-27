'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateHofMemberSchema,
  CreateHofMemberType,
  HofClassSummaryType,
  HofMemberType,
  HofContactSummaryType,
  UpdateHofMemberSchema,
  UpdateHofMemberType,
} from '@draco/shared-schemas';
import Autocomplete from '@mui/material/Autocomplete';
import { useHallOfFameService } from '@/hooks/useHallOfFameService';
import { useNotifications } from '@/hooks/useNotifications';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface MembersTabProps {
  accountId: string;
  refreshKey: number;
  createRequestKey: number;
}

interface MembersState {
  classes: HofClassSummaryType[];
  selectedYear: number | null;
  membersByYear: Record<number, HofMemberType[]>;
  loadingClasses: boolean;
  loadingMembers: boolean;
  error: string | null;
}

type MembersAction =
  | { type: 'setClasses'; classes: HofClassSummaryType[] }
  | { type: 'setSelectedYear'; year: number | null }
  | { type: 'setMembersForYear'; year: number; members: HofMemberType[] }
  | { type: 'setLoadingClasses'; value: boolean }
  | { type: 'setLoadingMembers'; value: boolean }
  | { type: 'setError'; error: string | null };

const initialMembersState: MembersState = {
  classes: [],
  selectedYear: null,
  membersByYear: {},
  loadingClasses: false,
  loadingMembers: false,
  error: null,
};

function membersReducer(state: MembersState, action: MembersAction): MembersState {
  switch (action.type) {
    case 'setClasses': {
      const nextSelectedYear =
        state.selectedYear && action.classes.some((cls) => cls.year === state.selectedYear)
          ? state.selectedYear
          : (action.classes[0]?.year ?? null);
      return {
        ...state,
        classes: action.classes,
        selectedYear: nextSelectedYear,
        loadingClasses: false,
        error: null,
      };
    }
    case 'setSelectedYear':
      return {
        ...state,
        selectedYear: action.year,
        error: null,
      };
    case 'setMembersForYear':
      return {
        ...state,
        membersByYear: {
          ...state.membersByYear,
          [action.year]: action.members,
        },
        loadingMembers: false,
        error: null,
      };
    case 'setLoadingClasses':
      return {
        ...state,
        loadingClasses: action.value,
      };
    case 'setLoadingMembers':
      return {
        ...state,
        loadingMembers: action.value,
      };
    case 'setError':
      return {
        ...state,
        error: action.error,
        loadingClasses: false,
        loadingMembers: false,
      };
    default:
      return state;
  }
}

const CreateMemberFormSchema = CreateHofMemberSchema.pick({
  contactId: true,
  yearInducted: true,
  biographyHtml: true,
});

const UpdateMemberFormSchema = UpdateHofMemberSchema.pick({
  yearInducted: true,
  biographyHtml: true,
});

type CreateMemberFormValues = Omit<CreateHofMemberType, 'biographyHtml'> & {
  biographyHtml?: string;
};

type UpdateMemberFormValues = UpdateHofMemberType;

const defaultBiographyHint =
  'Share notable accomplishments, leadership qualities, or the impact this member has made.';

const MembersTab: React.FC<MembersTabProps> = ({ accountId, refreshKey, createRequestKey }) => {
  const {
    fetchClasses,
    fetchClassMembers,
    listEligibleContacts,
    createMember,
    updateMember,
    deleteMember,
  } = useHallOfFameService(accountId);
  const { showNotification } = useNotifications();

  const [state, dispatch] = React.useReducer(membersReducer, initialMembersState);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editMember, setEditMember] = React.useState<HofMemberType | null>(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = React.useState<HofMemberType | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const selectedYear = state.selectedYear;
  const members = selectedYear ? (state.membersByYear[selectedYear] ?? []) : [];

  const handleError = React.useCallback((error: unknown, fallbackMessage: string) => {
    const message = error instanceof Error ? error.message : fallbackMessage;
    setActionError(message);
    dispatch({ type: 'setError', error: message });
  }, []);

  const loadClasses = React.useCallback(async () => {
    dispatch({ type: 'setLoadingClasses', value: true });
    try {
      const classes = await fetchClasses();
      dispatch({ type: 'setClasses', classes });
      if (classes.length === 0) {
        dispatch({ type: 'setMembersForYear', year: 0, members: [] });
      }
    } catch (error) {
      handleError(error, 'Failed to load Hall of Fame classes.');
    }
  }, [fetchClasses, handleError]);

  React.useEffect(() => {
    void loadClasses();
  }, [loadClasses, refreshKey]);

  const loadMembersForYear = React.useCallback(
    async (year: number) => {
      dispatch({ type: 'setLoadingMembers', value: true });
      try {
        const data = await fetchClassMembers(year);
        dispatch({ type: 'setMembersForYear', year, members: data.members });
      } catch (error) {
        handleError(error, 'Failed to load Hall of Fame members.');
      }
    },
    [fetchClassMembers, handleError],
  );

  React.useEffect(() => {
    if (selectedYear == null) {
      return;
    }
    void loadMembersForYear(selectedYear);
  }, [selectedYear, loadMembersForYear]);

  React.useEffect(() => {
    if (createRequestKey > 0) {
      setCreateDialogOpen(true);
    }
  }, [createRequestKey]);

  const handleTabChange = React.useCallback(
    (_: React.SyntheticEvent, newIndex: number) => {
      const cls = state.classes[newIndex];
      dispatch({ type: 'setSelectedYear', year: cls?.year ?? null });
    },
    [state.classes],
  );

  const refreshMembersAndClasses = React.useCallback(
    async (targetYear: number | null) => {
      await loadClasses();
      if (targetYear != null) {
        await loadMembersForYear(targetYear);
      }
    },
    [loadClasses, loadMembersForYear],
  );

  const handleCreateMember = async (values: CreateMemberFormValues) => {
    try {
      setActionError(null);
      const payload: CreateHofMemberType = {
        contactId: values.contactId,
        yearInducted: values.yearInducted,
        biographyHtml: values.biographyHtml?.trim() ?? '',
      };
      await createMember(payload);
      showNotification('Hall of Fame member created successfully.', 'success');
      setCreateDialogOpen(false);
      await refreshMembersAndClasses(payload.yearInducted);
    } catch (error) {
      handleError(error, 'Failed to create Hall of Fame member.');
      throw error;
    }
  };

  const handleUpdateMember = async (memberId: string, values: UpdateMemberFormValues) => {
    try {
      setActionError(null);
      await updateMember(memberId, {
        yearInducted: values.yearInducted,
        biographyHtml: values.biographyHtml?.trim() ?? '',
      });
      showNotification('Hall of Fame member updated successfully.', 'success');
      setEditMember(null);
      await refreshMembersAndClasses(values.yearInducted);
    } catch (error) {
      handleError(error, 'Failed to update Hall of Fame member.');
      throw error;
    }
  };

  const handleDeleteMember = async (member: HofMemberType) => {
    try {
      setActionError(null);
      await deleteMember(member.id);
      showNotification('Hall of Fame member deleted.', 'success');
      setDeleteMemberTarget(null);
      await refreshMembersAndClasses(member.yearInducted);
    } catch (error) {
      handleError(error, 'Failed to delete Hall of Fame member.');
      throw error;
    }
  };

  const classesLoadingIndicator = state.loadingClasses ? (
    <Box display="flex" justifyContent="center" py={4}>
      <CircularProgress size={32} />
    </Box>
  ) : null;

  return (
    <Box>
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}
      {actionError && !state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      ) : null}

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Inducted Members
      </Typography>

      {state.classes.length > 0 ? (
        <Tabs
          value={
            state.classes.findIndex((cls) => cls.year === selectedYear) === -1
              ? 0
              : state.classes.findIndex((cls) => cls.year === selectedYear)
          }
          onChange={handleTabChange}
          variant="scrollable"
          allowScrollButtonsMobile
          scrollButtons="auto"
          aria-label="Hall of Fame classes"
          sx={{ mb: 3 }}
        >
          {state.classes.map((cls) => (
            <Tab key={cls.year} label={`Class of ${cls.year} (${cls.memberCount})`} disableRipple />
          ))}
        </Tabs>
      ) : (
        (classesLoadingIndicator ?? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No Hall of Fame classes yet. Use the button above to induct your first member.
          </Alert>
        ))
      )}

      {classesLoadingIndicator}

      {selectedYear != null && state.loadingMembers ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {selectedYear != null && !state.loadingMembers ? (
        members.length > 0 ? (
          <List disablePadding>
            {members.map((member) => (
              <ListItem
                key={member.id}
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
                      {member.contact.displayName}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={1}>
                      <Typography component="span" variant="body2" color="text.secondary">
                        Inducted: {member.yearInducted}
                      </Typography>
                      {member.biographyHtml ? (
                        <Typography
                          component="div"
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            '& p': { m: 0 },
                            '& strong': { fontWeight: 600 },
                          }}
                          dangerouslySetInnerHTML={{ __html: member.biographyHtml }}
                        />
                      ) : (
                        <Typography component="span" variant="body2" color="text.secondary">
                          No biography provided yet.
                        </Typography>
                      )}
                    </Stack>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                  primaryTypographyProps={{ component: 'span' }}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Edit member">
                    <IconButton
                      edge="end"
                      onClick={() => setEditMember(member)}
                      aria-label="Edit member"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove member">
                    <IconButton
                      edge="end"
                      onClick={() => setDeleteMemberTarget(member)}
                      aria-label="Delete member"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info">No members have been inducted for {selectedYear} yet.</Alert>
        )
      ) : null}

      <CreateMemberDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        defaultYear={selectedYear ?? new Date().getFullYear()}
        onCreate={handleCreateMember}
        listEligibleContacts={listEligibleContacts}
      />

      {editMember ? (
        <EditMemberDialog
          open
          member={editMember}
          onClose={() => setEditMember(null)}
          onUpdate={handleUpdateMember}
        />
      ) : null}

      {deleteMemberTarget ? (
        <DeleteMemberDialog
          open
          member={deleteMemberTarget}
          onClose={() => setDeleteMemberTarget(null)}
          onConfirm={() => handleDeleteMember(deleteMemberTarget)}
        />
      ) : null}
    </Box>
  );
};

interface CreateMemberDialogProps {
  open: boolean;
  defaultYear: number;
  onClose: () => void;
  onCreate: (values: CreateMemberFormValues) => Promise<void>;
  listEligibleContacts: ReturnType<typeof useHallOfFameService>['listEligibleContacts'];
}

const CreateMemberDialog: React.FC<CreateMemberDialogProps> = ({
  open,
  defaultYear,
  onClose,
  onCreate,
  listEligibleContacts,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMemberFormValues>({
    resolver: zodResolver(CreateMemberFormSchema),
    defaultValues: {
      contactId: '',
      yearInducted: defaultYear,
      biographyHtml: '',
    },
  });

  const [contacts, setContacts] = React.useState<HofContactSummaryType[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const debouncedSearch = useDebouncedValue(inputValue, 300);
  const [contactsLoading, setContactsLoading] = React.useState(false);

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
    if (!open) {
      return;
    }
    void loadContacts(debouncedSearch);
  }, [debouncedSearch, open, loadContacts]);

  React.useEffect(() => {
    if (open) {
      reset({
        contactId: '',
        yearInducted: defaultYear,
        biographyHtml: '',
      });
      setInputValue('');
    }
  }, [open, defaultYear, reset]);

  const onSubmit = async (values: CreateMemberFormValues) => {
    await onCreate({
      ...values,
      biographyHtml: values.biographyHtml ?? '',
    });
    reset({
      contactId: '',
      yearInducted: defaultYear,
      biographyHtml: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>Add Hall of Fame Member</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Controller
              name="contactId"
              control={control}
              render={({ field }) => (
                <Autocomplete<HofContactSummaryType>
                  options={contacts}
                  loading={contactsLoading}
                  loadingText="Loading contacts…"
                  value={contacts.find((option) => option.id === field.value) ?? null}
                  onChange={(_, option) => field.onChange(option?.id ?? '')}
                  onInputChange={(_, value) => setInputValue(value)}
                  getOptionLabel={(option) => option.displayName ?? 'Unknown'}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Contact"
                      required
                      error={Boolean(errors.contactId)}
                      helperText={errors.contactId?.message ?? 'Start typing to find a contact.'}
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
                  inputProps={{
                    min: 1900,
                    max: new Date().getFullYear() + 1,
                  }}
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
                  placeholder={defaultBiographyHint}
                  error={Boolean(errors.biographyHtml)}
                  helperText={errors.biographyHtml?.message ?? defaultBiographyHint}
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
            {isSubmitting ? 'Adding…' : 'Add Member'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

interface EditMemberDialogProps {
  open: boolean;
  member: HofMemberType;
  onClose: () => void;
  onUpdate: (memberId: string, values: UpdateMemberFormValues) => Promise<void>;
}

const EditMemberDialog: React.FC<EditMemberDialogProps> = ({ open, member, onClose, onUpdate }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMemberFormValues>({
    resolver: zodResolver(UpdateMemberFormSchema),
    defaultValues: {
      yearInducted: member.yearInducted,
      biographyHtml: member.biographyHtml ?? '',
    },
  });

  React.useEffect(() => {
    reset({
      yearInducted: member.yearInducted,
      biographyHtml: member.biographyHtml ?? '',
    });
  }, [member, reset]);

  const onSubmit = async (values: UpdateMemberFormValues) => {
    await onUpdate(member.id, values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>Edit Hall of Fame Member</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Contact"
              value={member.contact.displayName}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Induction Year"
              type="number"
              required
              inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
              error={Boolean(errors.yearInducted)}
              helperText={errors.yearInducted?.message}
              {...register('yearInducted', { valueAsNumber: true })}
            />
            <TextField
              label="Biography"
              multiline
              minRows={4}
              placeholder={defaultBiographyHint}
              error={Boolean(errors.biographyHtml)}
              helperText={errors.biographyHtml?.message ?? defaultBiographyHint}
              {...register('biographyHtml')}
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

interface DeleteMemberDialogProps {
  open: boolean;
  member: HofMemberType;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteMemberDialog: React.FC<DeleteMemberDialogProps> = ({
  open,
  member,
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
      const message = err instanceof Error ? err.message : 'Failed to delete Hall of Fame member.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Remove Hall of Fame Member</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography>
            Are you sure you want to remove <strong>{member.contact.displayName}</strong> from the
            Hall of Fame? This action cannot be undone.
          </Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Removing…' : 'Remove Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MembersTab;
