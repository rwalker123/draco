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
      {/* Main View Header - Clickable to switch view modes */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          backgroundColor: 'primary.main',
          color: 'white',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
        }}
        onClick={getViewModeClickHandler()}
        title={getViewModeTooltip()}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
          {getViewModeTitle()}
        </Typography>
      </Box>

      {/* Hierarchical Headers based on filter type */}
      {filterType === 'day' && (
        <>
          {/* Year Header - Clickable to go to year view */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              backgroundColor: 'grey.50',
              borderBottom: '1px solid',
              borderBottomColor: 'grey.300',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
            onClick={() => {
              onFilterTypeChange('year');
              onFilterDateChange(filterDate);
            }}
            title={`View ${format(filterDate, 'yyyy')} in year view`}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              {getHeaderTitle('year', filterDate)}
            </Typography>
          </Box>

          {/* Month Header - Clickable to go to month view */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              backgroundColor: 'grey.100',
              borderBottom: '1px solid',
              borderBottomColor: 'grey.300',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'grey.200',
              },
            }}
            onClick={() => {
              onFilterTypeChange('month');
              onFilterDateChange(filterDate);
            }}
            title={`View ${format(filterDate, 'MMMM yyyy')} in month view`}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              {getHeaderTitle('month', filterDate)}
            </Typography>
          </Box>

          {/* Week Header - Clickable to go to week view */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              backgroundColor: 'grey.150',
              borderBottom: '1px solid',
              borderBottomColor: 'grey.300',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'grey.250',
              },
            }}
            onClick={() => {
              onFilterTypeChange('week');
              onFilterDateChange(filterDate);
              if (onStartDateChange && onEndDateChange) {
                const weekStart = startOfWeek(filterDate);
                const weekEnd = endOfWeek(filterDate);
                onStartDateChange(weekStart);
                onEndDateChange(weekEnd);
              }
            }}
            title={`View week of ${startDate && endDate ? `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}` : format(filterDate, 'MMMM yyyy')} in week view`}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              {getHeaderTitle('week', filterDate, startDate, endDate)}
            </Typography>
          </Box>
        </>
      )}

      {filterType === 'week' && (
        <>
          {/* Year Header - Clickable to go to year view */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              backgroundColor: 'grey.50',
              borderBottom: '1px solid',
              borderBottomColor: 'grey.300',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
            onClick={() => {
              onFilterTypeChange('year');
              onFilterDateChange(filterDate);
            }}
            title={`View ${format(filterDate, 'yyyy')} in year view`}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              {getHeaderTitle('year', filterDate)}
            </Typography>
          </Box>

          {/* Month Header - Clickable to go to month view */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              backgroundColor: 'grey.100',
              borderBottom: '1px solid',
              borderBottomColor: 'grey.300',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'grey.200',
              },
            }}
            onClick={() => {
              onFilterTypeChange('month');
              onFilterDateChange(filterDate);
            }}
            title={`View ${format(filterDate, 'MMMM yyyy')} in month view`}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              {getHeaderTitle('month', filterDate)}
            </Typography>
          </Box>
        </>
      )}

      {filterType === 'month' && (
        <>
          {/* Year Header - Clickable to go to year view */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              backgroundColor: 'grey.50',
              borderBottom: '1px solid',
              borderBottomColor: 'grey.300',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
            onClick={() => {
              onFilterTypeChange('year');
              onFilterDateChange(filterDate);
            }}
            title={`View ${format(filterDate, 'yyyy')} in year view`}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              {getHeaderTitle('year', filterDate)}
            </Typography>
          </Box>
        </>
      )}

      {/* Navigation Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2,
          backgroundColor: 'grey.100',
          borderBottom: '2px solid',
          borderBottomColor: 'primary.main',
          position: 'relative',
        }}
      >
        <IconButton
          size="small"
          onClick={() => onNavigate?.('prev')}
          disabled={isNavigating}
          sx={{ color: 'primary.main' }}
          title="Previous period"
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
            }}
          >
            {getHeaderTitle(filterType, filterDate, startDate, endDate)}
          </Typography>

          <TodayButton onClick={onGoToToday} title="Go to today" />
        </Box>

        <IconButton
          size="small"
          onClick={() => onNavigate?.('next')}
          disabled={isNavigating}
          sx={{ color: 'primary.main' }}
          title="Next period"
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </>
  );
};

export default HierarchicalHeader;
