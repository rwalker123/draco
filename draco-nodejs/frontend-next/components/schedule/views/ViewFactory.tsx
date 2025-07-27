import React from 'react';
import { ViewComponentProps } from '@/types/schedule';
import WeekView from './WeekView';
import MonthView from './MonthView';
import YearView from './YearView';
import DayListView from './DayListView';

const ViewFactory: React.FC<ViewComponentProps & { viewMode: 'calendar' | 'list' }> = ({
  viewMode,
  filterType,
  ...viewProps
}) => {
  // For day and list views, use the unified DayListView component
  if (filterType === 'day' || viewMode === 'list') {
    return <DayListView {...viewProps} filterType={filterType} viewMode={viewMode} />;
  }

  // For other calendar views, use the appropriate component
  switch (filterType) {
    case 'week':
      return <WeekView {...viewProps} filterType={filterType} />;
    case 'month':
      return <MonthView {...viewProps} filterType={filterType} />;
    case 'year':
      return <YearView {...viewProps} filterType={filterType} />;
    default:
      return <MonthView {...viewProps} filterType={filterType} />;
  }
};

export default ViewFactory;
