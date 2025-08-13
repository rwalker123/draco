'use client';

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import {
  RecipientSelectionState,
  RecipientSelectionActions,
  RecipientSelectionConfig,
  RecipientSelectionContextValue,
  RecipientSelectionProviderProps,
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionTab,
} from '../../../types/emails/recipients';
import {
  getEffectiveRecipients,
  validateRecipientSelection,
  filterContactsBySearch,
} from './recipientUtils';

const RecipientSelectionContext = createContext<RecipientSelectionContextValue | null>(null);

/**
 * Default configuration for recipient selection
 */
const defaultConfig: RecipientSelectionConfig = {
  allowAllContacts: true,
  allowTeamGroups: true,
  allowRoleGroups: true,
  requireValidEmails: true,
  showRecipientCount: true,
};

/**
 * RecipientSelectionProvider - Manages recipient selection state for email composition
 */
export const RecipientSelectionProvider: React.FC<RecipientSelectionProviderProps> = ({
  children,
  contacts,
  teamGroups = [],
  roleGroups = [],
  config: userConfig = {},
  onSelectionChange,
}) => {
  const config = useMemo(() => ({ ...defaultConfig, ...userConfig }), [userConfig]);

  // Selection state
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [allContacts, setAllContacts] = useState(false);
  const [selectedTeamGroups, setSelectedTeamGroups] = useState<TeamGroup[]>([]);
  const [selectedRoleGroups, setSelectedRoleGroups] = useState<RoleGroup[]>([]);
  const [lastSelectedContactId, setLastSelectedContactId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<RecipientSelectionTab>('contacts');

  // Filter contacts based on search and email validation
  const filteredContacts = useMemo(() => {
    let filtered = filterContactsBySearch(contacts, searchQuery);

    if (config.requireValidEmails) {
      filtered = filtered.filter((contact) => contact.hasValidEmail);
    }

    return filtered;
  }, [contacts, searchQuery, config.requireValidEmails]);

  // Compute selection state
  const state = useMemo<RecipientSelectionState>(() => {
    const effectiveRecipients = getEffectiveRecipients(
      {
        selectedContactIds,
        allContacts,
        selectedTeamGroups,
        selectedRoleGroups,
        totalRecipients: 0,
        validEmailCount: 0,
        invalidEmailCount: 0,
        searchQuery,
        activeTab,
      },
      contacts,
    );

    const validEmailCount = effectiveRecipients.filter((r) => r.hasValidEmail).length;
    const invalidEmailCount = effectiveRecipients.filter((r) => !r.hasValidEmail).length;

    return {
      selectedContactIds,
      allContacts,
      selectedTeamGroups,
      selectedRoleGroups,
      totalRecipients: effectiveRecipients.length,
      validEmailCount,
      invalidEmailCount,
      lastSelectedContactId,
      searchQuery,
      activeTab,
    };
  }, [
    selectedContactIds,
    allContacts,
    selectedTeamGroups,
    selectedRoleGroups,
    lastSelectedContactId,
    searchQuery,
    activeTab,
    contacts,
  ]);

  // Individual contact actions
  const selectContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => new Set([...prev, contactId]));
    setLastSelectedContactId(contactId);
  }, []);

  const deselectContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(contactId);
      return newSet;
    });
  }, []);

  const toggleContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
        setLastSelectedContactId(contactId);
      }
      return newSet;
    });
  }, []);

  const selectContactRange = useCallback(
    (fromId: string, toId: string) => {
      const fromIndex = filteredContacts.findIndex((c) => c.id === fromId);
      const toIndex = filteredContacts.findIndex((c) => c.id === toId);

      if (fromIndex === -1 || toIndex === -1) return;

      const startIndex = Math.min(fromIndex, toIndex);
      const endIndex = Math.max(fromIndex, toIndex);

      const rangeIds = filteredContacts.slice(startIndex, endIndex + 1).map((c) => c.id);

      setSelectedContactIds((prev) => new Set([...prev, ...rangeIds]));
    },
    [filteredContacts],
  );

  // Group actions
  const selectAllContacts = useCallback(() => {
    setAllContacts(true);
    setSelectedContactIds(new Set());
    setSelectedTeamGroups([]);
    setSelectedRoleGroups([]);
  }, []);

  const deselectAllContacts = useCallback(() => {
    setAllContacts(false);
  }, []);

  const selectTeamGroup = useCallback((team: TeamGroup) => {
    setSelectedTeamGroups((prev) => {
      const exists = prev.find((t) => t.id === team.id);
      if (exists) return prev;
      return [...prev, team];
    });
  }, []);

  const deselectTeamGroup = useCallback((teamId: string) => {
    setSelectedTeamGroups((prev) => prev.filter((t) => t.id !== teamId));
  }, []);

  const selectRoleGroup = useCallback((role: RoleGroup) => {
    setSelectedRoleGroups((prev) => {
      const exists = prev.find((r) => r.roleId === role.roleId);
      if (exists) return prev;
      return [...prev, role];
    });
  }, []);

  const deselectRoleGroup = useCallback((roleId: string) => {
    setSelectedRoleGroups((prev) => prev.filter((r) => r.roleId !== roleId));
  }, []);

  // Utility actions
  const clearAll = useCallback(() => {
    setSelectedContactIds(new Set());
    setAllContacts(false);
    setSelectedTeamGroups([]);
    setSelectedRoleGroups([]);
    setLastSelectedContactId(undefined);
  }, []);

  const isContactSelected = useCallback(
    (contactId: string): boolean => {
      if (allContacts) return true;
      if (selectedContactIds.has(contactId)) return true;

      // Check if contact is in selected team groups
      for (const team of selectedTeamGroups) {
        if (team.members.some((member) => member.id === contactId)) return true;
      }

      // Check if contact is in selected role groups
      for (const role of selectedRoleGroups) {
        if (role.members.some((member) => member.id === contactId)) return true;
      }

      return false;
    },
    [allContacts, selectedContactIds, selectedTeamGroups, selectedRoleGroups],
  );

  const getSelectedContacts = useCallback((): RecipientContact[] => {
    return contacts.filter((contact) => selectedContactIds.has(contact.id));
  }, [contacts, selectedContactIds]);

  const getEffectiveRecipientsCallback = useCallback((): RecipientContact[] => {
    return getEffectiveRecipients(state, contacts);
  }, [state, contacts]);

  // Actions object
  const actions = useMemo<RecipientSelectionActions>(
    () => ({
      selectContact,
      deselectContact,
      toggleContact,
      selectContactRange,
      selectAllContacts,
      deselectAllContacts,
      selectTeamGroup,
      deselectTeamGroup,
      selectRoleGroup,
      deselectRoleGroup,
      clearAll,
      isContactSelected,
      getSelectedContacts,
      getEffectiveRecipients: getEffectiveRecipientsCallback,
      setSearchQuery,
      setActiveTab,
    }),
    [
      selectContact,
      deselectContact,
      toggleContact,
      selectContactRange,
      selectAllContacts,
      deselectAllContacts,
      selectTeamGroup,
      deselectTeamGroup,
      selectRoleGroup,
      deselectRoleGroup,
      clearAll,
      isContactSelected,
      getSelectedContacts,
      getEffectiveRecipientsCallback,
      setSearchQuery,
      setActiveTab,
    ],
  );

  // Validation
  const validation = useMemo(() => {
    return validateRecipientSelection(state, contacts, config.maxRecipients);
  }, [state, contacts, config.maxRecipients]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(state);
    }
  }, [state, onSelectionChange]);

  // Context value
  const contextValue = useMemo<RecipientSelectionContextValue>(
    () => ({
      state,
      actions,
      config,
      contacts: filteredContacts,
      teamGroups,
      roleGroups,
      validation,
    }),
    [state, actions, config, filteredContacts, teamGroups, roleGroups, validation],
  );

  return (
    <RecipientSelectionContext.Provider value={contextValue}>
      {children}
    </RecipientSelectionContext.Provider>
  );
};

/**
 * Hook to use recipient selection context
 */
export function useRecipientSelection(): RecipientSelectionContextValue {
  const context = useContext(RecipientSelectionContext);
  if (!context) {
    throw new Error('useRecipientSelection must be used within a RecipientSelectionProvider');
  }
  return context;
}
