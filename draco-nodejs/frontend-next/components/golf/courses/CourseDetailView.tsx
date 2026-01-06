'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper } from '@mui/material';
import type {
  GolfCourseWithTeesType,
  GolfCourseTeeType,
  UpdateGolfCourseType,
} from '@draco/shared-schemas';
import CourseScorecard from './CourseScorecard';

interface CourseDetailViewProps {
  course: GolfCourseWithTeesType;
  editMode?: boolean;
  onSave?: (data: UpdateGolfCourseType) => Promise<void>;
  showEditControls?: boolean;
  onEditTee?: (tee: GolfCourseTeeType) => void;
  onDeleteTee?: (tee: GolfCourseTeeType) => void;
}

const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  editMode = false,
  onSave,
  showEditControls = false,
  onEditTee,
  onDeleteTee,
}) => {
  const [editedCourse, setEditedCourse] = useState<GolfCourseWithTeesType>(course);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedCourse(course);
    setHasChanges(false);
  }, [course]);

  const handleFieldChange = useCallback((field: string, value: string | number | null) => {
    setEditedCourse((prev) => {
      const updated = { ...prev };

      if (field.includes('.')) {
        const [arrayName, indexStr] = field.split('.');
        const index = parseInt(indexStr, 10);
        const key = arrayName as keyof GolfCourseWithTeesType;

        if (Array.isArray(updated[key])) {
          const newArray = [...(updated[key] as number[])];
          newArray[index] = value as number;
          (updated as Record<string, unknown>)[arrayName] = newArray;
        }
      } else {
        (updated as Record<string, unknown>)[field] = value;
      }

      return updated;
    });
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave || !hasChanges) return;

    setIsSaving(true);
    try {
      const updateData: UpdateGolfCourseType = {
        name: editedCourse.name,
        designer: editedCourse.designer,
        yearBuilt: editedCourse.yearBuilt,
        address: editedCourse.address,
        city: editedCourse.city,
        state: editedCourse.state,
        zip: editedCourse.zip,
        mensPar: editedCourse.mensPar,
        womansPar: editedCourse.womansPar,
        mensHandicap: editedCourse.mensHandicap,
        womansHandicap: editedCourse.womansHandicap,
      };
      await onSave(updateData);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, hasChanges, editedCourse]);

  const handleReset = useCallback(() => {
    setEditedCourse(course);
    setHasChanges(false);
  }, [course]);

  return (
    <Paper sx={{ p: 3 }}>
      <CourseScorecard
        course={editMode ? editedCourse : course}
        showTees
        editMode={editMode}
        onFieldChange={editMode ? handleFieldChange : undefined}
        onEditTee={showEditControls ? onEditTee : undefined}
        onDeleteTee={showEditControls ? onDeleteTee : undefined}
      />

      {editMode && onSave && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={handleReset} disabled={!hasChanges || isSaving}>
            Reset Changes
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default CourseDetailView;
