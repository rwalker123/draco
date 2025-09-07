'use client';

import React, { useMemo } from 'react';
import { Box, Stack, Typography, Chip, Paper, Alert, useTheme, alpha } from '@mui/material';
import {
  Person as PersonIcon,
  SupervisorAccount as ManagerIcon,
  Group as GroupIcon,
  CalendarMonth as SeasonIcon,
  EmojiEvents as LeagueIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { useEmailCompose } from '../compose/EmailComposeProvider';
import { GroupType } from '../../../types/emails/recipients';

interface SelectedRecipientsPreviewProps {
  maxVisibleChips?: number;
  showValidationWarnings?: boolean;
  compact?: boolean;
}

/**
 * SelectedRecipientsPreview - Read-only display of selected recipients as group summaries
 * Uses the unified selectedGroups Map for clean group-based display.
 * This component is for viewing current selections only - use the Advanced Recipient dialog to modify selections.
 */
const SelectedRecipientsPreviewComponent: React.FC<SelectedRecipientsPreviewProps> = ({
  maxVisibleChips = 8,
  showValidationWarnings = true,
  compact = false,
}) => {
  const theme = useTheme();
  const { state } = useEmailCompose();

  // Get group icon and color for each group type
  const getGroupConfig = (groupType: GroupType) => {
    switch (groupType) {
      case 'individuals':
        return { icon: PersonIcon, color: 'primary' as const, label: 'Contacts' };
      case 'managers':
        return { icon: ManagerIcon, color: 'secondary' as const, label: 'Managers' };
      case 'teams':
        return { icon: GroupIcon, color: 'info' as const, label: 'Teams' };
      case 'season':
        return { icon: SeasonIcon, color: 'success' as const, label: 'Season' };
      case 'league':
        return { icon: LeagueIcon, color: 'warning' as const, label: 'League' };
      default:
        return { icon: GroupIcon, color: 'default' as const, label: 'Group' };
    }
  };

  // Calculate summary data from selectedGroups Map
  const summaryData = useMemo(() => {
    if (!state.recipientState?.selectedGroups) {
      return {
        groupSummaries: [],
        invalidEmails: 0,
        hasSelections: false,
      };
    }

    const groupSummaries: Array<{
      groupType: GroupType;
      label: string;
      count: number;
      icon: typeof PersonIcon;
      color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'default';
    }> = [];

    // Process each group type in the selectedGroups Map
    state.recipientState.selectedGroups.forEach((contactGroups, groupType) => {
      contactGroups.forEach((contactGroup) => {
        if (contactGroup.totalCount > 0) {
          const config = getGroupConfig(groupType);
          groupSummaries.push({
            groupType,
            label: contactGroup.groupName || config.label,
            count: contactGroup.totalCount,
            icon: config.icon,
            color: config.color,
          });
        }
      });
    });

    return {
      groupSummaries,
      invalidEmails: state.recipientState.invalidEmailCount || 0,
      hasSelections: groupSummaries.length > 0,
    };
  }, [state.recipientState]);

  // Create group summary chips
  const groupChips = useMemo(() => {
    return summaryData.groupSummaries.map((group, index) => {
      const IconComponent = group.icon;

      return (
        <Chip
          key={`${group.groupType}-${index}`}
          icon={<IconComponent />}
          label={`${group.label} (${group.count})`}
          size={compact ? 'small' : 'medium'}
          variant="outlined"
          color={group.color}
          sx={{
            '& .MuiChip-icon': {
              color: `${group.color}.main`,
            },
          }}
        />
      );
    });
  }, [summaryData.groupSummaries, compact]);

  // Determine visible and hidden chips
  const visibleChips = groupChips.slice(0, maxVisibleChips);
  const hiddenChipsCount = Math.max(0, groupChips.length - maxVisibleChips);

  // If no selections, show empty state
  if (!summaryData.hasSelections) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: compact ? 1.5 : 2,
          backgroundColor: alpha(theme.palette.grey[50], 0.5),
          border: `1px dashed ${theme.palette.grey[300]}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <EmailIcon color="disabled" />
          <Typography variant="body2" color="text.secondary">
            No recipients selected
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 1.5 : 2,
        backgroundColor: alpha(theme.palette.primary.main, 0.02),
        borderColor: alpha(theme.palette.primary.main, 0.3),
      }}
    >
      <Stack spacing={compact ? 1 : 1.5}>
        {/* Group Summary Chips */}
        <Box>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {visibleChips}

            {hiddenChipsCount > 0 && (
              <Chip
                label={`+${hiddenChipsCount} more`}
                size={compact ? 'small' : 'medium'}
                variant="outlined"
                color="default"
                sx={{
                  backgroundColor: alpha(theme.palette.grey[500], 0.1),
                  '& .MuiChip-label': {
                    fontSize: compact ? '0.7rem' : '0.8rem',
                    fontWeight: 500,
                  },
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Validation Warnings */}
        {showValidationWarnings && summaryData.invalidEmails > 0 && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              py: 0.5,
              '& .MuiAlert-message': {
                fontSize: '0.75rem',
              },
            }}
          >
            <Box>
              <Typography variant="caption" fontWeight="medium">
                Issues:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                <li>
                  <Typography variant="caption">
                    {summaryData.invalidEmails} contact{summaryData.invalidEmails !== 1 ? 's' : ''}{' '}
                    with invalid email addresses
                  </Typography>
                </li>
              </ul>
            </Box>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export const SelectedRecipientsPreview = React.memo(SelectedRecipientsPreviewComponent);
SelectedRecipientsPreview.displayName = 'SelectedRecipientsPreview';
