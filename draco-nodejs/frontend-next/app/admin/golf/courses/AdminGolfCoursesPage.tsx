'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert as MuiAlert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Fab,
  IconButton,
  InputAdornment,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRole } from '@/context/RoleContext';
import { useApiClient } from '@/hooks/useApiClient';
import {
  fetchAdminGolfCourses,
  createAdminGolfCourse,
  deleteAdminGolfCourse,
  type AdminGolfCoursesListResponse,
} from '@/services/adminGolfCourseService';
import type { GolfCourseSlimType, CreateGolfCourseType } from '@draco/shared-schemas';
import { CreateCourseDialog } from '@/components/golf/courses';

const PAGE_SIZE = 20;

const AdminGolfCoursesPage: React.FC = () => {
  const router = useRouter();
  const { hasRole } = useRole();
  const apiClient = useApiClient();

  const [coursesData, setCoursesData] = useState<AdminGolfCoursesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const isAdministrator = hasRole('Administrator');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAdminGolfCourses(apiClient, {
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
      });
      setCoursesData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load courses');
    } finally {
      setLoading(false);
    }
  }, [apiClient, page, searchQuery]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  const handleSearchKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  }, []);

  const handleCreate = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleView = useCallback(
    (course: GolfCourseSlimType) => {
      router.push(`/admin/golf/courses/${course.id}`);
    },
    [router],
  );

  const handleCreateSubmit = useCallback(
    async (data: CreateGolfCourseType) => {
      try {
        const newCourse = await createAdminGolfCourse(apiClient, data);
        setCreateDialogOpen(false);
        router.push(`/admin/golf/courses/${newCourse.id}`);
      } catch (err) {
        throw err;
      }
    },
    [apiClient, router],
  );

  const handleDelete = useCallback(
    async (course: GolfCourseSlimType) => {
      const confirmed = window.confirm(
        `Delete "${course.name}"? This cannot be undone and will fail if the course is in use.`,
      );
      if (!confirmed) {
        return;
      }

      setMutatingId(course.id);
      try {
        await deleteAdminGolfCourse(apiClient, course.id);
        void loadCourses();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete course');
      } finally {
        setMutatingId(null);
      }
    },
    [apiClient, loadCourses],
  );

  const handleBackToDashboard = useCallback(() => {
    router.push('/admin');
  }, [router]);

  if (!isAdministrator) {
    return (
      <main className="min-h-screen bg-background">
        <MuiAlert severity="error" sx={{ mt: 2 }}>
          You do not have administrator privileges to access this page.
        </MuiAlert>
      </main>
    );
  }

  const totalPages = coursesData ? Math.ceil(coursesData.pagination.total / PAGE_SIZE) : 0;

  return (
    <main className="min-h-screen bg-background">
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Back to Admin Dashboard">
              <IconButton onClick={handleBackToDashboard} size="small">
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <GolfCourseIcon color="primary" />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Golf Course Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create and manage golf courses. Only global administrators can create courses from
                scratch.
              </Typography>
            </Box>
          </Stack>
        </Box>

        {error ? (
          <MuiAlert severity="error" onClose={() => setError(null)}>
            {error}
          </MuiAlert>
        ) : null}

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                placeholder="Search by name, city, or state..."
                size="small"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyUp={handleSearchKeyPress}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ minWidth: 300 }}
              />
              <Button variant="outlined" onClick={handleSearch}>
                Search
              </Button>
              {searchQuery && (
                <Button
                  variant="text"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : !coursesData || coursesData.courses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {searchQuery ? 'No courses match your search' : 'No courses yet'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Create a new golf course to get started.'}
                </Typography>
              </Box>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>City</TableCell>
                      <TableCell>State</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {coursesData.courses.map((course) => (
                      <TableRow key={course.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{course.name}</TableCell>
                        <TableCell>{course.city || '-'}</TableCell>
                        <TableCell>{course.state || '-'}</TableCell>
                        <TableCell>
                          {course.isExternal ? (
                            <Tooltip title="Imported from external source">
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <CloudDownloadIcon fontSize="small" color="info" />
                                <Typography variant="caption" color="info.main">
                                  External
                                </Typography>
                              </Stack>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Custom
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title={course.isExternal ? 'View course' : 'Edit course'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleView(course)}
                                  disabled={mutatingId === course.id}
                                  aria-label={
                                    course.isExternal
                                      ? `View ${course.name}`
                                      : `Edit ${course.name}`
                                  }
                                >
                                  {course.isExternal ? (
                                    <VisibilityIcon fontSize="small" />
                                  ) : (
                                    <EditIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Delete course">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => void handleDelete(course)}
                                  disabled={mutatingId === course.id}
                                  aria-label={`Delete ${course.name}`}
                                >
                                  {mutatingId === course.id ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <DeleteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                    />
                  </Box>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                >
                  Showing {coursesData.courses.length} of {coursesData.pagination.total} courses
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Stack>

      <CreateCourseDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <Fab
        color="primary"
        aria-label="Create course"
        onClick={handleCreate}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>
    </main>
  );
};

export default AdminGolfCoursesPage;
