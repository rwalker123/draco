import { format } from 'date-fns';
import { FilterType } from '@/types/schedule';

export const getHeaderTitle = (
  filterType: FilterType,
  filterDate: Date,
  startDate?: Date,
  endDate?: Date,
): string => {
  switch (filterType) {
    case 'day':
      return format(filterDate, 'EEEE, MMMM d, yyyy');
    case 'week':
      if (startDate && endDate) {
        return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
      }
      return format(filterDate, 'MMMM yyyy');
    case 'month':
      return format(filterDate, 'MMMM yyyy');
    case 'year':
      return format(filterDate, 'yyyy');
    default:
      return format(filterDate, 'MMMM yyyy');
  }
};
