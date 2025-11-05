import React from 'react';
import { ViewMode } from '@/types/schedule';
import { Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeTabs: React.FC<ViewModeTabsProps> = ({ viewMode, onViewModeChange }) => {
  const theme = useTheme();
  const handleChange = (_: React.SyntheticEvent, newValue: ViewMode) => {
    onViewModeChange(newValue);
  };

  return (
    <Tabs
      value={viewMode}
      onChange={handleChange}
      centered
      sx={{
        minHeight: 48,
        '& .MuiTabs-indicator': {
          height: 3,
          borderRadius: 3,
          backgroundColor: theme.palette.primary.main,
        },
        '& .MuiTab-root': {
          textTransform: 'uppercase',
          minHeight: 48,
          minWidth: 140,
          fontWeight: 600,
          letterSpacing: 1.1,
          color: theme.palette.widget.supportingText,
          '&.Mui-selected': {
            color: theme.palette.primary.main,
          },
        },
      }}
    >
      <Tab label="Calendar View" value="calendar" />
      <Tab label="List View" value="list" />
    </Tabs>
  );
};

export default ViewModeTabs;
