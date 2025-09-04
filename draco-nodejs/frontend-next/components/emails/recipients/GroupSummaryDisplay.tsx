'use client';

import React from 'react';
import { Box, Typography, Chip, Stack, Paper } from '@mui/material';
import {
  Person as PersonIcon,
  Groups as GroupsIcon,
  Sports as SportsIcon,
  Clear as ClearIcon,
  SupervisorAccount as ManagerIcon,
} from '@mui/icons-material';

import { ContactGroup, GroupType } from '../../../types/emails/recipients';

// Material-UI Chip color type for type safety
type ChipColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'default';

interface GroupSummaryDisplayProps {
  selectedGroups: Map<GroupType, ContactGroup[]>;
  onRemoveGroup: (groupType: GroupType, groupIndex: number) => void;
  compact?: boolean;
}

/**
 * GroupSummaryDisplay - Shows selected groups as summaries instead of individual contacts
 */
export const GroupSummaryDisplay: React.FC<GroupSummaryDisplayProps> = ({
  selectedGroups,
  onRemoveGroup,
  compact = false,
}) => {
  const getGroupIcon = (groupType: GroupType) => {
    switch (groupType) {
      case 'individuals':
        return <PersonIcon />;
      case 'season':
        return <GroupsIcon />;
      case 'league':
        return <SportsIcon />;
      case 'teams':
        return <SportsIcon />;
      case 'managers':
        return <ManagerIcon />;
      default:
        return <GroupsIcon />;
    }
  };

  const getGroupColor = (groupType: GroupType): ChipColor => {
    switch (groupType) {
      case 'individuals':
        return 'primary';
      case 'season':
        return 'secondary';
      case 'league':
        return 'info';
      case 'teams':
        return 'success';
      case 'managers':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (selectedGroups.size === 0) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {Array.from(selectedGroups.entries()).map(([groupType, groups]) => (
        <Paper key={groupType} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
            {getGroupIcon(groupType)}
            <Box component="span" sx={{ ml: 1 }}>
              {groupType === 'individuals' && 'Individual Selections'}
              {groupType === 'season' && 'Season Participants'}
              {groupType === 'league' && 'League Communications'}
              {groupType === 'teams' && 'Team Selections'}
              {groupType === 'managers' && 'Manager Communications'}
            </Box>
            <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
              ({groups.length} {groups.length === 1 ? 'group' : 'groups'})
            </Box>
          </Typography>

          <Stack spacing={1}>
            {groups.map((group, index) => (
              <Chip
                key={`${groupType}-${index}`}
                icon={getGroupIcon(groupType)}
                label={`${group.groupName} (${group.totalCount})`}
                variant="outlined"
                color={getGroupColor(groupType)}
                onDelete={() => onRemoveGroup(groupType, index)}
                deleteIcon={<ClearIcon />}
                size={compact ? 'small' : 'medium'}
                sx={{
                  justifyContent: 'flex-start',
                  '& .MuiChip-label': {
                    flex: 1,
                    textAlign: 'left',
                  },
                }}
              />
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
};

export default GroupSummaryDisplay;
