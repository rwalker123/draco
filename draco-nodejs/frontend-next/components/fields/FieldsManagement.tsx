'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
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
import FieldLocationMap from './FieldLocationMap';

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

const toNumber = (value: string | null | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const numeric = Number.parseFloat(trimmed);

  return Number.isNaN(numeric) ? null : numeric;
};

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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
              Fields
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Review locations and publish updates so teams always know where to play.
            </Typography>
          </Box>
          {canManage ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.92)' },
              }}
            >
              Add Field
            </Button>
          ) : null}
        </Stack>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
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
                {!canManage ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    You can view field information, but editing requires account management
                    permissions.
                  </Alert>
                ) : null}
              </Box>
              {loading ? (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table size="medium">
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
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell>{field.name}</TableCell>
                              <TableCell>{field.shortName}</TableCell>
                              <TableCell>{field.city ?? '—'}</TableCell>
                              <TableCell>{field.state ?? '—'}</TableCell>
                              <TableCell>{field.rainoutNumber ?? '—'}</TableCell>
                              {canManage ? (
                                <TableCell
                                  align="right"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <IconButton
                                      aria-label="Edit field"
                                      size="small"
                                      onClick={() => handleOpenEditDialog(field)}
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
              )}
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
            <Card elevation={3}>
              <CardHeader
                title={selectedField?.name ?? 'Select a field'}
                subheader={
                  selectedField?.address ?? 'Choose a field to view its location and details.'
                }
              />
              <CardContent>
                {selectedField ? (
                  <Stack spacing={2}>
                    <FieldLocationMap
                      latitude={toNumber(selectedField.latitude)}
                      longitude={toNumber(selectedField.longitude)}
                      readOnly
                    />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Location Details
                      </Typography>
                      <Typography variant="body2">
                        {selectedField.address ? selectedField.address : 'Address not provided'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[selectedField.city, selectedField.state, selectedField.zip]
                          .filter((part) => part && part.trim().length > 0)
                          .join(', ') || 'City/state not provided'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Rainout Line
                      </Typography>
                      <Typography variant="body2">
                        {selectedField.rainoutNumber
                          ? selectedField.rainoutNumber
                          : 'No rainout number on file.'}
                      </Typography>
                    </Box>
                    {selectedField.comment ? (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Comments
                        </Typography>
                        <Typography variant="body2">{selectedField.comment}</Typography>
                      </Box>
                    ) : null}
                    {selectedField.directions ? (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Directions
                        </Typography>
                        <Typography variant="body2">{selectedField.directions}</Typography>
                      </Box>
                    ) : null}
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Coordinates
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedField.latitude && selectedField.longitude
                          ? `${selectedField.latitude}, ${selectedField.longitude}`
                          : 'No coordinates saved yet.'}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Select a field to view its map and details.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
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
    </Box>
  );
};

export default FieldsManagement;
