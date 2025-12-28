'use client';

import React, { useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  GolfCourse as CourseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import type { GolfLeagueCourseType } from '@draco/shared-schemas';
import ConfirmationDialog from '../../common/ConfirmationDialog';

interface CourseListProps {
  courses: GolfLeagueCourseType[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onView?: (course: GolfLeagueCourseType) => void;
  onEdit?: (course: GolfLeagueCourseType) => void;
  onDelete?: (course: GolfLeagueCourseType) => void;
  emptyMessage?: string;
  actionsDisabled?: boolean;
}

const CourseList: React.FC<CourseListProps> = ({
  courses,
  loading = false,
  error = null,
  onRetry,
  onView,
  onEdit,
  onDelete,
  emptyMessage = 'No courses available.',
  actionsDisabled = false,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<GolfLeagueCourseType | null>(null);

  const handleDeleteClick = useCallback((course: GolfLeagueCourseType) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (courseToDelete && onDelete) {
      onDelete(courseToDelete);
    }
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  }, [courseToDelete, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  }, []);

  const formatCourseLocation = useCallback((course: GolfLeagueCourseType): string => {
    const { city, state } = course.course;
    const parts = [city, state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }, []);

  const formatCoursePar = useCallback((course: GolfLeagueCourseType): string => {
    const { mensPar, numberOfHoles } = course.course;
    const totalPar = mensPar.slice(0, numberOfHoles).reduce((sum, par) => sum + par, 0);
    return `Par ${totalPar} · ${numberOfHoles} holes`;
  }, []);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={72} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
        sx={{ alignItems: 'center' }}
      >
        {error}
      </Alert>
    );
  }

  if (courses.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <>
      <List disablePadding sx={{ width: '100%' }}>
        {courses.map((leagueCourse) => {
          const location = formatCourseLocation(leagueCourse);
          const parInfo = formatCoursePar(leagueCourse);

          return (
            <ListItem
              key={leagueCourse.course.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 1,
                px: 1.5,
                py: 1.5,
                '&:last-of-type': { mb: 0 },
              }}
            >
              <ListItemAvatar>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: 'success.light',
                    color: 'success.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CourseIcon fontSize="small" />
                </Box>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight={500}>
                    {leagueCourse.course.name}
                  </Typography>
                }
                secondary={
                  <Stack
                    direction="row"
                    spacing={1}
                    divider={<Typography color="text.secondary">·</Typography>}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {parInfo}
                    </Typography>
                    {location && (
                      <Typography variant="body2" color="text.secondary">
                        {location}
                      </Typography>
                    )}
                  </Stack>
                }
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {onView && (
                    <Tooltip title="View Details">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => onView(leagueCourse)}
                          disabled={actionsDisabled}
                          color="primary"
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {onEdit && (
                    <Tooltip title="Edit Course">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => onEdit(leagueCourse)}
                          disabled={actionsDisabled}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Remove from League">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteClick(leagueCourse)}
                          color="error"
                          disabled={actionsDisabled}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Remove Course from League"
        message={`Are you sure you want to remove "${courseToDelete?.course.name}" from your league? This will not delete the course, only remove it from your league's available courses.`}
        confirmText="Remove"
        confirmButtonColor="error"
      />
    </>
  );
};

export default CourseList;
