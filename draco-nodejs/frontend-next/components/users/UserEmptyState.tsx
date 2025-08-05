'use client';

import React from 'react';
import { PeopleOutline as PeopleIcon } from '@mui/icons-material';
import EmptyState, { EmptyStateProps } from '../common/EmptyState';

export interface UserEmptyStateProps extends Omit<EmptyStateProps, 'title' | 'subtitle' | 'icon'> {
  searchTerm?: string;
  hasFilters?: boolean;
  showIcon?: boolean;
}

const UserEmptyState: React.FC<UserEmptyStateProps> = ({
  searchTerm,
  hasFilters = false,
  showIcon = true,
  ...emptyStateProps
}) => {
  // Determine title and subtitle based on context
  const getTitle = () => {
    if (searchTerm) {
      return 'No users match your search';
    }
    if (hasFilters) {
      return 'No users match your filters';
    }
    return 'No users found';
  };

  const getSubtitle = () => {
    if (searchTerm) {
      return `No results for "${searchTerm}"`;
    }
    if (hasFilters) {
      return 'Try adjusting your filters';
    }
    return 'There are no users in this organization yet.';
  };

  return (
    <EmptyState
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={showIcon ? <PeopleIcon sx={{ fontSize: 48 }} /> : undefined}
      {...emptyStateProps}
    />
  );
};

export default UserEmptyState;
