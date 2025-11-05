import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { FilterType } from '@/types/schedule';
import TodayButton from '../../navigation/TodayButton';
import { getHeaderTitle } from '../utils/headerUtils';
import { alpha, useTheme } from '@mui/material/styles';

interface HierarchicalHeaderProps {
  filterType: FilterType;
  filterDate: Date;
  startDate?: Date;
  endDate?: Date;
  isNavigating?: boolean;
  onFilterTypeChange: (filterType: FilterType) => void;
  onFilterDateChange: (date: Date) => void;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  viewMode: 'calendar' | 'list';
}

const HierarchicalHeader: React.FC<HierarchicalHeaderProps> = ({
  filterType,
  filterDate,
  startDate,
  endDate,
  isNavigating = false,
  onFilterTypeChange,
  onFilterDateChange,
  onStartDateChange,
  onEndDateChange,
  onNavigate,
  onGoToToday,
  viewMode,
}) => {
  const theme = useTheme();
  const borderColor = theme.palette.widget.border;
  const headerTextColor = theme.palette.widget.headerText;
  const primaryBandIntensity = theme.palette.mode === 'dark' ? 0.45 : 0.12;
  const primaryBandHoverIntensity = theme.palette.mode === 'dark' ? 0.6 : 0.18;
  const hierarchyIntensitiesDay =
    theme.palette.mode === 'dark' ? [0.32, 0.24, 0.18] : [0.1, 0.08, 0.06];
  const hierarchyIntensitiesOther = theme.palette.mode === 'dark' ? [0.32, 0.24] : [0.1, 0.08];

  const buildRowStyle = (intensity: number) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    py: 1.5,
    px: 2,
    backgroundColor: alpha(theme.palette.primary.main, intensity),
    borderBottom: `1px solid ${borderColor}`,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: alpha(
        theme.palette.primary.main,
        Math.min(1, intensity + (theme.palette.mode === 'dark' ? 0.08 : 0.04)),
      ),
    },
  });

  type HierarchyRow = {
    key: string;
    label: React.ReactNode;
    onClick: () => void;
    title: string;
    intensity: number;
  };

  const hierarchyRows: HierarchyRow[] = [];

  if (filterType === 'day') {
    hierarchyRows.push(
      {
        key: 'year',
        label: getHeaderTitle('year', filterDate),
        onClick: () => {
          onFilterTypeChange('year');
          onFilterDateChange(filterDate);
        },
        title: `View ${format(filterDate, 'yyyy')} in year view`,
        intensity: hierarchyIntensitiesDay[0],
      },
      {
        key: 'month',
        label: getHeaderTitle('month', filterDate),
        onClick: () => {
          onFilterTypeChange('month');
          onFilterDateChange(filterDate);
        },
        title: `View ${format(filterDate, 'MMMM yyyy')} in month view`,
        intensity: hierarchyIntensitiesDay[1],
      },
      {
        key: 'week',
        label: getHeaderTitle('week', filterDate, startDate, endDate),
        onClick: () => {
          onFilterTypeChange('week');
          onFilterDateChange(filterDate);
          if (onStartDateChange && onEndDateChange) {
            const weekStart = startOfWeek(filterDate);
            const weekEnd = endOfWeek(filterDate);
            onStartDateChange(weekStart);
            onEndDateChange(weekEnd);
          }
        },
        title: `View week of ${
          startDate && endDate
            ? `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
            : format(filterDate, 'MMMM yyyy')
        } in week view`,
        intensity: hierarchyIntensitiesDay[2],
      },
    );
  }

  if (filterType === 'week') {
    hierarchyRows.push(
      {
        key: 'year',
        label: getHeaderTitle('year', filterDate),
        onClick: () => {
          onFilterTypeChange('year');
          onFilterDateChange(filterDate);
        },
        title: `View ${format(filterDate, 'yyyy')} in year view`,
        intensity: hierarchyIntensitiesOther[0],
      },
      {
        key: 'month',
        label: getHeaderTitle('month', filterDate),
        onClick: () => {
          onFilterTypeChange('month');
          onFilterDateChange(filterDate);
        },
        title: `View ${format(filterDate, 'MMMM yyyy')} in month view`,
        intensity: hierarchyIntensitiesOther[1],
      },
    );
  }

  if (filterType === 'month') {
    hierarchyRows.push({
      key: 'year',
      label: getHeaderTitle('year', filterDate),
      onClick: () => {
        onFilterTypeChange('year');
        onFilterDateChange(filterDate);
      },
      title: `View ${format(filterDate, 'yyyy')} in year view`,
      intensity: hierarchyIntensitiesOther[0],
    });
  }
  const getViewModeTitle = () => {
    return viewMode === 'calendar' ? 'Calendar View' : 'List View';
  };

  const getViewModeClickHandler = () => {
    if (viewMode === 'list') {
      // List view: click to go to calendar view
      return () => {
        onFilterTypeChange('month');
        onFilterDateChange(filterDate);
      };
    } else {
      // Calendar view: click to go to list view
      return () => {
        onFilterTypeChange('month');
        onFilterDateChange(filterDate);
      };
    }
  };

  const getViewModeTooltip = () => {
    if (viewMode === 'list') {
      return `View ${format(filterDate, 'MMMM yyyy')} in calendar view`;
    } else {
      return `View ${format(filterDate, 'MMMM yyyy')} in list view`;
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          px: 2,
          backgroundColor: alpha(theme.palette.primary.main, primaryBandIntensity),
          borderBottom: `1px solid ${borderColor}`,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          color:
            theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : headerTextColor,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, primaryBandHoverIntensity),
          },
        }}
        onClick={getViewModeClickHandler()}
        title={getViewModeTooltip()}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color:
              theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : headerTextColor,
          }}
        >
          {getViewModeTitle()}
        </Typography>
      </Box>

      {hierarchyRows.map((row) => (
        <Box
          key={row.key}
          sx={buildRowStyle(row.intensity)}
          onClick={row.onClick}
          title={row.title}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: headerTextColor }}>
            {row.label}
          </Typography>
        </Box>
      ))}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2,
          backgroundColor: alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'dark' ? 0.2 : 0.05,
          ),
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <IconButton
          size="small"
          onClick={() => onNavigate?.('prev')}
          disabled={isNavigating}
          sx={{ color: theme.palette.primary.main }}
          title="Previous period"
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', color: theme.palette.widget.headerText }}
          >
            {getHeaderTitle(filterType, filterDate, startDate, endDate)}
          </Typography>
          <TodayButton onClick={onGoToToday} title="Go to today" />
        </Box>

        <IconButton
          size="small"
          onClick={() => onNavigate?.('next')}
          disabled={isNavigating}
          sx={{ color: theme.palette.primary.main }}
          title="Next period"
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </>
  );
};

export default HierarchicalHeader;
