'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  CircularProgress,
  Container,
  Fab,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { BaseContactType, PaginationWithTotalType, UmpireType } from '@draco/shared-schemas';
import AccountPageHeader from '../AccountPageHeader';
import { useRole } from '../../context/RoleContext';
import { useUmpireService } from '../../hooks/useUmpireService';
import UmpireFormDialog from './UmpireFormDialog';
import UmpireDeleteDialog from './UmpireDeleteDialog';
import EditContactDialog from '../users/EditContactDialog';
import UserAvatar from '../users/UserAvatar';
import { EditIconButton, DeleteIconButton } from '../common/ActionIconButtons';
import PageSectionHeader from '../common/PageSectionHeader';
import { AdminBreadcrumbs } from '../admin';

interface UmpiresManagementProps {
  accountId: string;
}

interface ColumnDefinition {
  id: 'avatar' | 'displayName' | 'email' | 'phone' | 'address';
  label: string;
  sortable: boolean;
  sortKey?: string;
  width?: string;
}

const COLUMNS: ColumnDefinition[] = [
  { id: 'avatar', label: '', sortable: false, width: '60px' },
  { id: 'displayName', label: 'Name', sortable: true, sortKey: 'contacts.lastname' },
  { id: 'email', label: 'Email', sortable: true, sortKey: 'contacts.email' },
  { id: 'phone', label: 'Phone', sortable: false },
  { id: 'address', label: 'Address', sortable: false },
];

export const UmpiresManagement: React.FC<UmpiresManagementProps> = ({ accountId }) => {
  const { listUmpires } = useUmpireService(accountId);
  const { hasPermission } = useRole();
  const canManage = hasPermission('account.umpires.manage', { accountId });

  const [umpires, setUmpires] = useState<UmpireType[]>([]);
  const [pagination, setPagination] = useState<PaginationWithTotalType | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('contacts.lastname');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [umpireToDelete, setUmpireToDelete] = useState<UmpireType | null>(null);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [umpireToEdit, setUmpireToEdit] = useState<UmpireType | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    const loadUmpires = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const result = await listUmpires({
          page: page + 1,
          limit: rowsPerPage,
          sortBy,
          sortOrder,
        });

        if (result.success) {
          setUmpires(result.data.umpires);
          setPagination(result.data.pagination ?? null);
        } else {
          setUmpires([]);
          setPagination(null);
          setFetchError(result.error);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load umpires';
        setUmpires([]);
        setPagination(null);
        setFetchError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadUmpires();
  }, [listUmpires, page, rowsPerPage, sortBy, sortOrder, refreshTrigger]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (column: ColumnDefinition) => {
    if (!column.sortable || !column.sortKey) {
      return;
    }

    setPage(0);
    if (sortBy === column.sortKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column.sortKey);
      setSortOrder('asc');
    }
  };

  const handleOpenCreateDialog = () => {
    setFormOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormOpen(false);
  };

  const handleOpenDeleteDialog = (umpire: UmpireType) => {
    setUmpireToDelete(umpire);
    setDeleteOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteOpen(false);
    setUmpireToDelete(null);
  };

  const handleDialogSuccess = (result: { message: string }) => {
    setSuccessMessage(result.message);
    setDialogError(null);
    triggerRefresh();
  };

  const handleDialogError = (message: string) => {
    setDialogError(message);
  };

  const handleSnackbarClose = () => {
    setSuccessMessage(null);
    setDialogError(null);
  };

  const handleOpenEditContactDialog = (umpire: UmpireType) => {
    setUmpireToEdit(umpire);
    setEditContactOpen(true);
  };

  const handleCloseEditContactDialog = () => {
    setEditContactOpen(false);
    setUmpireToEdit(null);
  };

  const formatPhoneNumbers = (umpire: UmpireType): string => {
    const phones = [
      umpire.contactDetails?.phone1,
      umpire.contactDetails?.phone2,
      umpire.contactDetails?.phone3,
    ].filter(Boolean);

    return phones.length > 0 ? phones.join(', ') : '—';
  };

  const formatAddress = (umpire: UmpireType): string => {
    const details = umpire.contactDetails;
    if (!details) return '—';

    const parts = [];
    if (details.streetAddress) parts.push(details.streetAddress);
    if (details.city || details.state || details.zip) {
      const cityStateZip = [details.city, details.state, details.zip].filter(Boolean).join(', ');
      if (cityStateZip) parts.push(cityStateZip);
    }

    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const umpireToContact = (umpire: UmpireType | null): BaseContactType | null => {
    if (!umpire) return null;

    return {
      id: umpire.contactId,
      firstName: umpire.firstName,
      lastName: umpire.lastName,
      middleName: undefined,
      email: umpire.email ?? undefined,
      contactDetails: umpire.contactDetails,
    };
  };

  const totalCount = pagination?.total ?? umpires.length;

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Umpires
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage the officials available for scheduling and assignments.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Season', href: `/account/${accountId}/admin/season` }}
          currentPage="Umpires"
        />
        <Paper elevation={3} sx={{ overflow: 'hidden' }}>
          <PageSectionHeader title="Umpire Directory" showDivider />

          {fetchError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {fetchError}
            </Alert>
          ) : null}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableCell key={column.id} sx={{ width: column.width }}>
                      {column.sortable && column.sortKey ? (
                        <TableSortLabel
                          active={sortBy === column.sortKey}
                          direction={sortBy === column.sortKey ? sortOrder : 'asc'}
                          onClick={() => handleRequestSort(column)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                  {canManage ? <TableCell align="right">Actions</TableCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5}>
                      <Stack alignItems="center" py={3}>
                        <CircularProgress size={28} />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : umpires.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5}>
                      <Typography variant="body2" color="text.secondary" align="center" py={3}>
                        No umpires found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  umpires.map((umpire) => (
                    <TableRow key={umpire.id} hover>
                      <TableCell>
                        <UserAvatar
                          user={{
                            id: umpire.contactId,
                            firstName: umpire.firstName,
                            lastName: umpire.lastName,
                            photoUrl: umpire.photoUrl ?? undefined,
                          }}
                          size={40}
                        />
                      </TableCell>
                      <TableCell>{umpire.displayName}</TableCell>
                      <TableCell>{umpire.email || '—'}</TableCell>
                      <TableCell>{formatPhoneNumbers(umpire)}</TableCell>
                      <TableCell>{formatAddress(umpire)}</TableCell>
                      {canManage ? (
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <EditIconButton
                              tooltipTitle="Edit contact information"
                              aria-label={`Edit contact for ${umpire.displayName}`}
                              onClick={() => handleOpenEditContactDialog(umpire)}
                            />
                            <DeleteIconButton
                              tooltipTitle="Delete umpire"
                              aria-label={`Delete ${umpire.displayName}`}
                              onClick={() => handleOpenDeleteDialog(umpire)}
                            />
                          </Stack>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Paper>
      </Container>

      <UmpireFormDialog
        accountId={accountId}
        open={formOpen}
        onClose={handleCloseFormDialog}
        onSuccess={(result) => handleDialogSuccess({ message: result.message })}
        onError={handleDialogError}
      />
      <UmpireDeleteDialog
        accountId={accountId}
        open={deleteOpen}
        umpire={umpireToDelete}
        onClose={handleCloseDeleteDialog}
        onSuccess={(result) => handleDialogSuccess({ message: result.message })}
        onError={handleDialogError}
      />
      <EditContactDialog
        mode="edit"
        open={editContactOpen}
        contact={umpireToContact(umpireToEdit)}
        accountId={accountId}
        onClose={handleCloseEditContactDialog}
        onSuccess={(result) => {
          setSuccessMessage(result.message);
          triggerRefresh();
        }}
      />

      <Snackbar
        open={Boolean(successMessage || dialogError)}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {successMessage ? (
          <Alert severity="success" onClose={handleSnackbarClose} sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        ) : dialogError ? (
          <Alert severity="error" onClose={handleSnackbarClose} sx={{ width: '100%' }}>
            {dialogError}
          </Alert>
        ) : undefined}
      </Snackbar>
      {canManage ? (
        <Fab
          color="primary"
          aria-label="Add umpire"
          onClick={handleOpenCreateDialog}
          sx={{
            position: 'fixed',
            bottom: { xs: 24, sm: 32 },
            right: { xs: 24, sm: 32 },
            zIndex: (theme) => theme.zIndex.snackbar + 1,
          }}
        >
          <AddIcon />
        </Fab>
      ) : null}
    </main>
  );
};

export default UmpiresManagement;
