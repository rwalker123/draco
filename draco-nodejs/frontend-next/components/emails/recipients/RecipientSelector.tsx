'use client';

import React from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Badge,
  Typography,
  Stack,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Groups as GroupsIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

import { useRecipientSelection } from './RecipientSelectionProvider';
import { ContactPicker } from './ContactPicker';
import { GroupSelector } from './GroupSelector';
import { SelectedRecipientsList } from './SelectedRecipientsList';
import { RecipientSelectionTab } from '../../../types/emails/recipients';

interface RecipientSelectorProps {
  showSelectedList?: boolean;
  compactView?: boolean;
  showValidation?: boolean;
}

/**
 * RecipientSelector - Main interface for selecting email recipients
 */
export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  showSelectedList = true,
  compactView = false,
  showValidation = true,
}) => {
  const { state, actions, config, roleGroups, validation } = useRecipientSelection();

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: RecipientSelectionTab) => {
    actions.setActiveTab(newValue);
  };

  // Calculate tab badges
  const individualCount = state.selectedContactIds.size;
  const groupCount =
    state.selectedTeamGroups.length + state.selectedRoleGroups.length + (state.allContacts ? 1 : 0);
  const totalRecipients = validation.totalRecipients;

  return (
    <Box>
      {/* Header with validation status */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" component="h2">
            Select Recipients
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {validation.isValid ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
            <Typography
              variant="body2"
              color={validation.isValid ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {totalRecipients} recipient{totalRecipients !== 1 ? 's' : ''}
            </Typography>
          </Stack>
        </Stack>

        {/* Quick validation summary */}
        {showValidation && (
          <>
            {validation.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {validation.errors[0]}
              </Alert>
            )}
          </>
        )}
      </Box>

      <Stack direction={compactView ? 'column' : 'row'} spacing={3}>
        {/* Selection Interface */}
        <Box sx={{ flex: compactView ? 'none' : 2, minWidth: 0 }}>
          <Paper variant="outlined">
            {/* Selection Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={state.activeTab} onChange={handleTabChange} variant="fullWidth">
                <Tab
                  icon={<PersonIcon />}
                  label={
                    <Badge badgeContent={individualCount} color="primary" max={99}>
                      Contacts
                    </Badge>
                  }
                  value="contacts"
                />

                <Tab
                  icon={<GroupsIcon />}
                  label={
                    <Badge
                      badgeContent={groupCount}
                      color="primary"
                      max={99}
                      invisible={!config.allowTeamGroups && !config.allowAllContacts}
                    >
                      Groups
                    </Badge>
                  }
                  value="groups"
                  disabled={!config.allowTeamGroups && !config.allowAllContacts}
                />

                <Tab
                  icon={<SecurityIcon />}
                  label={
                    <Badge
                      badgeContent={state.selectedRoleGroups.length}
                      color="primary"
                      max={99}
                      invisible={!config.allowRoleGroups}
                    >
                      Roles
                    </Badge>
                  }
                  value="roles"
                  disabled={!config.allowRoleGroups || roleGroups.length === 0}
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ p: 2, minHeight: 400 }}>
              {state.activeTab === 'contacts' && (
                <ContactPicker
                  maxHeight={compactView ? 300 : 400}
                  showSelectAll={true}
                  showEmailValidation={showValidation}
                />
              )}

              {state.activeTab === 'groups' && (
                <GroupSelector
                  showAllContacts={config.allowAllContacts}
                  showTeamGroups={config.allowTeamGroups}
                  showRoleGroups={false} // Role groups are in their own tab
                />
              )}

              {state.activeTab === 'roles' && (
                <GroupSelector
                  showAllContacts={false}
                  showTeamGroups={false}
                  showRoleGroups={config.allowRoleGroups}
                />
              )}
            </Box>
          </Paper>

          {/* Quick actions */}
          {!compactView && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                size="small"
                onClick={actions.clearAll}
                disabled={totalRecipients === 0}
                color="error"
                variant="outlined"
              >
                Clear All
              </Button>

              {config.allowAllContacts && (
                <Button
                  size="small"
                  onClick={
                    state.allContacts ? actions.deselectAllContacts : actions.selectAllContacts
                  }
                  color="primary"
                  variant="outlined"
                  startIcon={<GroupsIcon />}
                >
                  {state.allContacts ? 'Deselect All' : 'Select All Contacts'}
                </Button>
              )}
            </Stack>
          )}
        </Box>

        {/* Selected Recipients List */}
        {showSelectedList && (
          <Box sx={{ flex: compactView ? 'none' : 1, minWidth: 0 }}>
            <SelectedRecipientsList
              showDetails={!compactView}
              maxDisplayCount={compactView ? 5 : 10}
              showValidation={showValidation}
              compact={compactView}
            />
          </Box>
        )}
      </Stack>

      {/* Compact view selected list */}
      {compactView && showSelectedList && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <SelectedRecipientsList
            showDetails={false}
            maxDisplayCount={5}
            showValidation={showValidation}
            compact={true}
          />
        </Box>
      )}

      {/* Bottom summary for compact view */}
      {compactView && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2, backgroundColor: 'action.hover' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Recipients selected
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2">
                {individualCount} individual{individualCount !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2">
                {groupCount} group{groupCount !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="h6" color="primary.main">
                {totalRecipients} total
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
