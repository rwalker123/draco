'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import type { FieldType, PaginationWithTotalType } from '@draco/shared-schemas';
import AccountPageHeader from '../AccountPageHeader';
import { useFieldService } from '../../hooks/useFieldService';
import FieldDetailsCard from './FieldDetailsCard';
import PageSectionHeader from '../common/PageSectionHeader';

export interface FieldsViewProps {
  accountId: string;
  renderRowActions?: (field: FieldType) => React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export interface FieldsViewRef {
  refresh: () => void;
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

export const FieldsView = forwardRef<FieldsViewRef, FieldsViewProps>(
  ({ accountId, renderRowActions, breadcrumbs }, ref) => {
    const { listFields } = useFieldService(accountId);
    const hasActionsColumn = Boolean(renderRowActions);

    const [fields, setFields] = useState<FieldType[]>([]);
    const [pagination, setPagination] = useState<PaginationWithTotalType | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedField, setSelectedField] = useState<FieldType | null>(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const [searchTerm, setSearchTerm] = useState('');
    const trimmedSearch = searchTerm.trim();

    const loadFields = useCallback(async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const result = await listFields({
          page: page + 1,
          limit: rowsPerPage,
          sortBy,
          sortOrder,
          search: trimmedSearch || undefined,
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
    }, [listFields, page, rowsPerPage, sortBy, sortOrder, trimmedSearch]);

    useEffect(() => {
      void loadFields();
    }, [loadFields]);

    useImperativeHandle(
      ref,
      () => ({
        refresh: () => {
          void loadFields();
        },
      }),
      [loadFields],
    );

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

    useEffect(() => {
      setPage(0);
    }, [trimmedSearch]);

    const totalCount = useMemo(
      () => pagination?.total ?? fields.length,
      [fields.length, pagination?.total],
    );

    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
          >
            Fields
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
            Review locations and publish updates so teams always know where to play.
          </Typography>
        </AccountPageHeader>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {breadcrumbs}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
              <Paper elevation={3} sx={{ overflow: 'visible' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <PageSectionHeader
                    title="Field Directory"
                    actions={
                      <TextField
                        size="small"
                        placeholder="Search fields"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                          endAdornment: trimmedSearch ? (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="Clear search"
                                size="small"
                                onClick={() => setSearchTerm('')}
                              >
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ) : undefined,
                        }}
                        sx={{ minWidth: { xs: '100%', sm: 240 } }}
                      />
                    }
                  />
                  {fetchError ? (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {fetchError}
                    </Alert>
                  ) : null}
                </Box>
                <TableContainer
                  sx={{
                    position: 'relative',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    maxWidth: '100%',
                    width: '100%',
                    WebkitOverflowScrolling: 'touch',
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
                      minWidth: hasActionsColumn ? 920 : 820,
                      tableLayout: 'auto',
                      opacity: loading ? 0.88 : 1,
                      transition: 'opacity 120ms ease-in-out',
                      '& td, & th': {
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                      },
                      '& th.state-column': {
                        minWidth: 96,
                        width: 96,
                      },
                      '& th.actions-column': {
                        minWidth: 108,
                        width: 108,
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
                              className={column.id === 'state' ? 'state-column' : undefined}
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
                        {hasActionsColumn ? (
                          <TableCell className="actions-column" align="right">
                            Actions
                          </TableCell>
                        ) : null}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={hasActionsColumn ? COLUMNS.length + 1 : COLUMNS.length}
                          >
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
                        fields.map((field) => {
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
                              {hasActionsColumn && renderRowActions ? (
                                <TableCell
                                  className="actions-column"
                                  align="right"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {renderRowActions(field)}
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
                  count={totalCount}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FieldDetailsCard field={selectedField} />
            </Grid>
          </Grid>
        </Container>
      </main>
    );
  },
);

FieldsView.displayName = 'FieldsView';

export default FieldsView;
