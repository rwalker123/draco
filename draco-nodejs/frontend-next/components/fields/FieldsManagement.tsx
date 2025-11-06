'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Fab,
  Grid,
  IconButton,
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
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import type { FieldType, PaginationWithTotalType } from '@draco/shared-schemas';
import AccountPageHeader from '../AccountPageHeader';
import { useFieldService } from '../../hooks/useFieldService';
import { useRole } from '../../context/RoleContext';
import FieldFormDialog from './FieldFormDialog';
import FieldDeleteDialog from './FieldDeleteDialog';
import FieldDetailsCard from './FieldDetailsCard';

interface FieldsManagementProps {
  accountId: string;
}

interface ColumnDefinition {
  id: keyof Pick<FieldType, 'name' | 'shortName' | 'city' | 'state' | 'rainoutNumber'>;
  label: string;
  sortable: boolean;
  sortKey?: string;
}

const COLUMNS: ColumnDefinition[] = [
  { id: 'name', label: 'Name', sortable: true, sortKey: 'name' },
  { id: 'shortName', label: 'Short Name', sortable: true, sortKey: 'shortname' },
  { id: 'city', label: 'City', sortable: true, sortKey: 'city' },
  { id: 'state', label: 'State', sortable: true, sortKey: 'state' },
  { id: 'rainoutNumber', label: 'Rainout Line', sortable: true, sortKey: 'rainoutnumber' },
];

export const FieldsManagement: React.FC<FieldsManagementProps> = ({ accountId }) => {
  const { listFields } = useFieldService(accountId);
  const { hasPermission } = useRole();
  const canManage = hasPermission('account.manage', { accountId });

  const [fields, setFields] = useState<FieldType[]>([]);
  const [pagination, setPagination] = useState<PaginationWithTotalType | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldType | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [activeField, setActiveField] = useState<FieldType | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<FieldType | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const loadFields = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const result = await listFields({
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
      });

      if (result.success) {
        const { fields: fetchedFields, pagination: pageInfo } = result.data;
        setFields(fetchedFields);
        setPagination(pageInfo ?? null);

        setSelectedField((previous) => {
          if (!previous) {
            return fetchedFields[0] ?? null;
          }

          const match = fetchedFields.find((item) => item.id === previous.id);
          return match ?? fetchedFields[0] ?? null;
        });
      } else {
        setFields([]);
        setPagination(null);
        setFetchError(result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load fields';
      setFields([]);
      setPagination(null);
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, [listFields, page, rowsPerPage, sortBy, sortOrder]);

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: string) => {
    setPage(0);
    if (sortBy === property) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(property);
      setSortOrder('asc');
    }
  };

  const handleOpenCreateDialog = () => {
    setFormMode('create');
    setActiveField(null);
    setFormOpen(true);
  };

  const handleOpenEditDialog = (field: FieldType) => {
    setFormMode('edit');
    setActiveField(field);
    setFormOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormOpen(false);
    setActiveField(null);
  };

  const handleOpenDeleteDialog = (field: FieldType) => {
    setFieldToDelete(field);
    setDeleteOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteOpen(false);
    setFieldToDelete(null);
  };

  const handleDialogSuccess = (result: { message: string; field: FieldType }) => {
    setSuccessMessage(result.message);
    setDialogError(null);
    setSelectedField(result.field);
    void loadFields();
  };

  const handleDialogError = (message: string) => {
    setDialogError(message);
  };

  const handleSnackbarClose = () => {
    setSuccessMessage(null);
    setDialogError(null);
  };

  const tableRows = useMemo(() => fields, [fields]);

  return (
    <Box component="main" sx={{ pb: 6 }}>
      <AccountPageHeader accountId={accountId}>
        <Stack alignItems="center" justifyContent="center" spacing={2} textAlign="center">
          <Box>
            <Typography
              variant="h4"
              color="text.primary"
              sx={{ fontWeight: 700, textAlign: 'center' }}
            >
              Fields
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
              Review locations and publish updates so teams always know where to play.
            </Typography>
          </Box>
        </Stack>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, md: 3 } }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={3} sx={{ overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6">Field Directory</Typography>
                {fetchError ? (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {fetchError}
                  </Alert>
                ) : null}
              </Box>
              <TableContainer
                sx={{
                  position: 'relative',
                  overflowX: 'visible',
                  overflowY: 'visible',
                  maxWidth: '100%',
                  width: '100%',
                }}
              >
                {loading ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(1px)',
                      backgroundColor: 'rgba(255,255,255,0.4)',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  >
                    <CircularProgress size={28} />
                  </Box>
                ) : null}
                <Table
                  size="medium"
                  aria-busy={loading}
                  sx={{
                    width: '100%',
                    tableLayout: 'auto',
                    opacity: loading ? 0.88 : 1,
                    transition: 'opacity 120ms ease-in-out',
                    '& td, & th': {
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      {COLUMNS.map((column) => {
                        const sortKey = column.sortKey ?? column.id;
                        return (
                          <TableCell
                            key={column.id}
                            sortDirection={sortBy === sortKey ? sortOrder : false}
                          >
                            {column.sortable ? (
                              <TableSortLabel
                                active={sortBy === sortKey}
                                direction={sortBy === sortKey ? sortOrder : 'asc'}
                                onClick={() => handleRequestSort(sortKey)}
                              >
                                {column.label}
                              </TableSortLabel>
                            ) : (
                              column.label
                            )}
                          </TableCell>
                        );
                      })}
                      {canManage ? <TableCell align="right">Actions</TableCell> : null}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? COLUMNS.length + 1 : COLUMNS.length}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ py: 3, textAlign: 'center' }}
                          >
                            No fields have been added yet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRows.map((field) => {
                        const isSelected = selectedField?.id === field.id;
                        return (
                          <TableRow
                            key={field.id}
                            hover
                            selected={isSelected}
                            onClick={() => setSelectedField(field)}
                            sx={{
                              cursor: 'pointer',
                              transition: 'background-color 120ms ease-in-out',
                              pointerEvents: loading ? 'none' : 'auto',
                            }}
                          >
                            <TableCell>{field.name}</TableCell>
                            <TableCell>{field.shortName}</TableCell>
                            <TableCell>{field.city ?? '—'}</TableCell>
                            <TableCell>{field.state ?? '—'}</TableCell>
                            <TableCell>{field.rainoutNumber ?? '—'}</TableCell>
                            {canManage ? (
                              <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <IconButton
                                    aria-label="Edit field"
                                    size="small"
                                    onClick={() => handleOpenEditDialog(field)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    aria-label="Delete field"
                                    size="small"
                                    color="error"
                                    onClick={() => handleOpenDeleteDialog(field)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={pagination?.total ?? fields.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <FieldDetailsCard field={selectedField} />
          </Grid>
        </Grid>
      </Container>

      <FieldFormDialog
        accountId={accountId}
        open={formOpen}
        mode={formMode}
        field={formMode === 'edit' ? (activeField ?? selectedField ?? null) : null}
        onClose={handleCloseFormDialog}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />
      <FieldDeleteDialog
        accountId={accountId}
        open={deleteOpen}
        field={fieldToDelete}
        onClose={handleCloseDeleteDialog}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />
      <Snackbar
        open={Boolean(successMessage || dialogError)}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {successMessage ? (
          <Alert
            onClose={handleSnackbarClose}
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        ) : dialogError ? (
          <Alert
            onClose={handleSnackbarClose}
            severity="error"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {dialogError}
          </Alert>
        ) : undefined}
      </Snackbar>
      {canManage ? (
        <Fab
          color="primary"
          aria-label="Add field"
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
    </Box>
  );
};

export default FieldsManagement;
