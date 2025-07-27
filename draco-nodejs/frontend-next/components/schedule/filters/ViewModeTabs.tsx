import React from 'react';
import { Paper, Tabs, Tab } from '@mui/material';
import { ViewMode } from '@/types/schedule';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeTabs: React.FC<ViewModeTabsProps> = ({ viewMode, onViewModeChange }) => {
  const handleChange = (_: React.SyntheticEvent, newValue: ViewMode) => {
    onViewModeChange(newValue);
  };

  return (
    <Paper sx={{ mb: 3 }}>
      <Tabs value={viewMode} onChange={handleChange}>
        <Tab label="Calendar View" value="calendar" />
        <Tab label="List View" value="list" />
      </Tabs>
    </Paper>
  );
};

export default ViewModeTabs;
