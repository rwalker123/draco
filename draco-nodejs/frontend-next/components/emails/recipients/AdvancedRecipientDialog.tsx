'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Stack,
  IconButton,
  Typography,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Star as StarIcon,
} from '@mui/icons-material';

import { useEmailCompose } from '../compose/EmailComposeProvider';
import { useRecipientSelection } from './hooks/useRecipientSelection';
import { useRecipientSearch } from './hooks/useRecipientSearch';
import ContactSelectionPanel from './ContactSelectionPanel';
import GroupSelectionPanel from './GroupSelectionPanel';
import RecipientPreviewPanel from './RecipientPreviewPanel';
import { RecipientContact, TeamGroup, RoleGroup } from '../../../types/emails/recipients';

export interface AdvancedRecipientDialogProps {
  open: boolean;
  onClose: () => void;
  _accountId: string;
  contacts: RecipientContact[];
  teamGroups: TeamGroup[];
  roleGroups: RoleGroup[];
  maxRecipients?: number;
}

type TabValue = 'contacts' | 'groups' | 'quick';

/**
 * AdvancedRecipientDialog - Comprehensive recipient selection interface
 * Provides tabbed interface for individual contacts, groups, and quick selections
 */
const AdvancedRecipientDialog: React.FC<AdvancedRecipientDialogProps> = ({
  open,
  onClose,
  _accountId,
  contacts,
  teamGroups,
  roleGroups,
  maxRecipients = 500,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state, actions } = useEmailCompose();

  const [currentTab, setCurrentTab] = useState<TabValue>('contacts');

  // Initialize selection with current compose state
  const {
    selectionState,
    actions: selectionActions,
    validation,
  } = useRecipientSelection(contacts, teamGroups, roleGroups, {
    initialSelection: state.recipientState,
    maxRecipients,
  });

  // Search functionality
  const { searchQuery, setSearchQuery, filteredContacts, searchStats } =
    useRecipientSearch(contacts);

  // Handle tab changes
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  }, []);

  // Apply selection and close dialog
  const handleApply = useCallback(() => {
    if (validation.isValid) {
      actions.updateRecipientState(selectionState);
      onClose();
    }
  }, [validation.isValid, selectionState, actions, onClose]);

  // Cancel and close dialog
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Quick selection actions
  const handleQuickSelectAll = useCallback(() => {
    selectionActions.setAllContacts(true);
  }, [selectionActions]);

  const handleQuickSelectManagers = useCallback(() => {
    const managerGroups = teamGroups.filter((group) => group.type === 'managers');
    managerGroups.forEach((group) => selectionActions.toggleTeamGroup(group));
  }, [teamGroups, selectionActions]);

  const handleQuickSelectAdmins = useCallback(() => {
    const adminGroups = roleGroups.filter(
      (group) => group.roleType === 'ACCOUNT_ADMIN' || group.roleType === 'CONTACT_ADMIN',
    );
    adminGroups.forEach((group) => selectionActions.toggleRoleGroup(group));
  }, [roleGroups, selectionActions]);

  // Calculate tab badges
  const contactCount = selectionState.selectedContactIds.size;
  const groupCount =
    selectionState.selectedTeamGroups.length + selectionState.selectedRoleGroups.length;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="recipient-dialog-title"
      aria-describedby="recipient-dialog-description"
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '80vh',
          minHeight: 600,
          maxHeight: 800,
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div" id="recipient-dialog-title">
            Advanced Recipient Selection
          </Typography>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<PersonIcon />}
            label={
              <Badge badgeContent={contactCount} color="primary" max={999}>
                <Box>Contacts</Box>
              </Badge>
            }
            value="contacts"
            iconPosition="start"
          />
          <Tab
            icon={<GroupsIcon />}
            label={
              <Badge badgeContent={groupCount} color="primary" max={999}>
                <Box>Groups</Box>
              </Badge>
            }
            value="groups"
            iconPosition="start"
          />
          <Tab icon={<StarIcon />} label="Quick Select" value="quick" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        <Stack direction="row" sx={{ height: '100%' }}>
          {/* Main Selection Panel */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Contacts Tab */}
            {currentTab === 'contacts' && (
              <ContactSelectionPanel
                contacts={filteredContacts}
                selectedContactIds={selectionState.selectedContactIds}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onContactToggle={selectionActions.toggleContact}
                onSelectAll={() => selectionActions.selectAll(filteredContacts)}
                onClearAll={selectionActions.clearAll}
                searchStats={{
                  ...searchStats,
                  selected: selectionState.selectedContactIds.size,
                }}
                allContactsSelected={selectionState.allContacts}
                onAllContactsToggle={selectionActions.setAllContacts}
                compact={isMobile}
              />
            )}

            {/* Groups Tab */}
            {currentTab === 'groups' && (
              <GroupSelectionPanel
                teamGroups={teamGroups}
                roleGroups={roleGroups}
                selectedTeamGroups={selectionState.selectedTeamGroups}
                selectedRoleGroups={selectionState.selectedRoleGroups}
                onTeamGroupToggle={selectionActions.toggleTeamGroup}
                onRoleGroupToggle={selectionActions.toggleRoleGroup}
                compact={isMobile}
              />
            )}

            {/* Quick Select Tab */}
            {currentTab === 'quick' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Selection Options
                </Typography>
                <Stack spacing={2}>
                  <Button variant="outlined" size="large" onClick={handleQuickSelectAll} fullWidth>
                    Select All Contacts ({contacts.length})
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleQuickSelectManagers}
                    fullWidth
                  >
                    Select All Team Managers
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleQuickSelectAdmins}
                    fullWidth
                  >
                    Select All Administrators
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>

          {/* Preview Panel - Hidden on mobile to save space */}
          {!isMobile && (
            <Box
              sx={{
                width: 320,
                minWidth: 320,
                borderLeft: 1,
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              <RecipientPreviewPanel
                selectionState={selectionState}
                validation={validation}
                onRemoveContact={selectionActions.toggleContact}
                onRemoveTeamGroup={selectionActions.toggleTeamGroup}
                onRemoveRoleGroup={selectionActions.toggleRoleGroup}
                onClearAll={selectionActions.clearAll}
              />
            </Box>
          )}
        </Stack>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
          {/* Selection Summary */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {selectionState.totalRecipients} recipient
              {selectionState.totalRecipients !== 1 ? 's' : ''} selected
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button onClick={handleCancel} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleApply} variant="contained" disabled={!validation.isValid}>
              Apply Selection
            </Button>
          </Stack>
        </Stack>
      </DialogActions>

      {/* Mobile Preview Panel - Show as bottom sheet */}
      {isMobile && selectionState.totalRecipients > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '30vh',
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            zIndex: theme.zIndex.modal + 1,
          }}
        >
          <RecipientPreviewPanel
            selectionState={selectionState}
            validation={validation}
            onRemoveContact={selectionActions.toggleContact}
            onRemoveTeamGroup={selectionActions.toggleTeamGroup}
            onRemoveRoleGroup={selectionActions.toggleRoleGroup}
            onClearAll={selectionActions.clearAll}
            compact={true}
          />
        </Box>
      )}
    </Dialog>
  );
};

export default AdvancedRecipientDialog;
