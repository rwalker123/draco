'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionState as BaseRecipientSelectionState,
  RecipientSelectionTab,
} from '../../../../types/emails/recipients';
import { hasValidEmail } from '../../common/mailtoUtils';

// Extended state interface for the hook
export interface ExtendedRecipientSelectionState extends BaseRecipientSelectionState {
  effectiveRecipients: RecipientContact[];
}

export interface UseRecipientSelectionOptions {
  initialSelection?: Partial<BaseRecipientSelectionState>;
  maxRecipients?: number;
  onSelectionChange?: (state: BaseRecipientSelectionState) => void;
}

export interface UseRecipientSelectionReturn {
  selectionState: ExtendedRecipientSelectionState;
  actions: {
    toggleContact: (contactId: string) => void;
    selectContacts: (contactIds: string[]) => void;
    deselectContacts: (contactIds: string[]) => void;
    toggleTeamGroup: (group: TeamGroup) => void;
    toggleRoleGroup: (group: RoleGroup) => void;
    selectAll: (contacts: RecipientContact[]) => void;
    clearAll: () => void;
    setAllContacts: (enabled: boolean) => void;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

const createInitialState = (
  initialSelection?: Partial<BaseRecipientSelectionState>,
): ExtendedRecipientSelectionState => ({
  selectedContactIds: new Set(initialSelection?.selectedContactIds || []),
  selectedTeamGroups: initialSelection?.selectedTeamGroups || [],
  selectedRoleGroups: initialSelection?.selectedRoleGroups || [],
  allContacts: initialSelection?.allContacts || false,
  totalRecipients: 0,
  validEmailCount: 0,
  invalidEmailCount: 0,
  effectiveRecipients: [],
  lastSelectedContactId: initialSelection?.lastSelectedContactId,
  searchQuery: initialSelection?.searchQuery || '',
  activeTab: initialSelection?.activeTab || ('contacts' as RecipientSelectionTab),
});

export const useRecipientSelection = (
  availableContacts: RecipientContact[],
  teamGroups: TeamGroup[],
  roleGroups: RoleGroup[],
  options: UseRecipientSelectionOptions = {},
): UseRecipientSelectionReturn => {
  const { initialSelection, maxRecipients = 500, onSelectionChange } = options;

  const [selectionState, setSelectionState] = useState<ExtendedRecipientSelectionState>(
    createInitialState(initialSelection),
  );

  // Function to calculate effective recipients
  const calculateEffectiveRecipients = useCallback(
    (state: ExtendedRecipientSelectionState): RecipientContact[] => {
      const recipientIds = new Set<string>();
      const recipients: RecipientContact[] = [];

      // Add individually selected contacts
      if (!state.allContacts) {
        state.selectedContactIds.forEach((contactId) => {
          const contact = availableContacts.find((c) => c.id === contactId);
          if (contact && !recipientIds.has(contact.id)) {
            recipientIds.add(contact.id);
            recipients.push(contact);
          }
        });
      } else {
        // Add all contacts if "all contacts" is selected
        availableContacts.forEach((contact) => {
          if (!recipientIds.has(contact.id)) {
            recipientIds.add(contact.id);
            recipients.push(contact);
          }
        });
      }

      // Add team group members
      state.selectedTeamGroups.forEach((teamGroup) => {
        teamGroup.members.forEach((contact) => {
          if (!recipientIds.has(contact.id)) {
            recipientIds.add(contact.id);
            recipients.push(contact);
          }
        });
      });

      // Add role group members
      state.selectedRoleGroups.forEach((roleGroup) => {
        roleGroup.members.forEach((contact) => {
          if (!recipientIds.has(contact.id)) {
            recipientIds.add(contact.id);
            recipients.push(contact);
          }
        });
      });

      return recipients;
    },
    [availableContacts],
  );

  // Calculate effective recipients (deduplicated)
  const effectiveRecipients = useMemo(() => {
    return calculateEffectiveRecipients(selectionState);
  }, [calculateEffectiveRecipients, selectionState]);

  // Update selection state with calculated values
  const updateSelectionState = useCallback(
    (updates: Partial<ExtendedRecipientSelectionState>) => {
      setSelectionState((prev) => {
        // Calculate new effective recipients first
        const updatedState = { ...prev, ...updates };

        // Recalculate effective recipients based on the updated state
        const newEffectiveRecipients = calculateEffectiveRecipients(updatedState);

        const validEmails = newEffectiveRecipients.filter((r) => hasValidEmail(r)).length;
        const invalidEmails = newEffectiveRecipients.length - validEmails;

        const newState = {
          ...updatedState,
          totalRecipients: newEffectiveRecipients.length,
          validEmailCount: validEmails,
          invalidEmailCount: invalidEmails,
          effectiveRecipients: newEffectiveRecipients,
        };

        // Convert to base state for callback by excluding effectiveRecipients
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { effectiveRecipients, ...baseState } = newState;
        onSelectionChange?.(baseState);
        return newState;
      });
    },
    [onSelectionChange, calculateEffectiveRecipients],
  );

  // Toggle individual contact selection
  const toggleContact = useCallback(
    (contactId: string) => {
      const newSelectedIds = new Set(selectionState.selectedContactIds);

      if (newSelectedIds.has(contactId)) {
        newSelectedIds.delete(contactId);
      } else {
        newSelectedIds.add(contactId);
      }

      updateSelectionState({
        selectedContactIds: newSelectedIds,
        allContacts: false, // Disable "all contacts" when making individual selections
      });
    },
    [selectionState.selectedContactIds, updateSelectionState],
  );

  // Select multiple contacts
  const selectContacts = useCallback(
    (contactIds: string[]) => {
      const newSelectedIds = new Set(selectionState.selectedContactIds);
      contactIds.forEach((id) => newSelectedIds.add(id));

      updateSelectionState({
        selectedContactIds: newSelectedIds,
        allContacts: false,
      });
    },
    [selectionState.selectedContactIds, updateSelectionState],
  );

  // Deselect multiple contacts
  const deselectContacts = useCallback(
    (contactIds: string[]) => {
      const newSelectedIds = new Set(selectionState.selectedContactIds);
      contactIds.forEach((id) => newSelectedIds.delete(id));

      updateSelectionState({ selectedContactIds: newSelectedIds });
    },
    [selectionState.selectedContactIds, updateSelectionState],
  );

  // Toggle team group selection
  const toggleTeamGroup = useCallback(
    (group: TeamGroup) => {
      const isSelected = selectionState.selectedTeamGroups.some((g) => g.id === group.id);
      const newTeamGroups = isSelected
        ? selectionState.selectedTeamGroups.filter((g) => g.id !== group.id)
        : [...selectionState.selectedTeamGroups, group];

      updateSelectionState({ selectedTeamGroups: newTeamGroups });
    },
    [selectionState.selectedTeamGroups, updateSelectionState],
  );

  // Toggle role group selection
  const toggleRoleGroup = useCallback(
    (group: RoleGroup) => {
      const isSelected = selectionState.selectedRoleGroups.some((g) => g.id === group.id);
      const newRoleGroups = isSelected
        ? selectionState.selectedRoleGroups.filter((g) => g.id !== group.id)
        : [...selectionState.selectedRoleGroups, group];

      updateSelectionState({ selectedRoleGroups: newRoleGroups });
    },
    [selectionState.selectedRoleGroups, updateSelectionState],
  );

  // Select all available contacts
  const selectAll = useCallback(
    (contacts: RecipientContact[]) => {
      const allContactIds = new Set(contacts.map((c) => c.id));
      updateSelectionState({
        selectedContactIds: allContactIds,
        allContacts: false, // Keep individual selection mode
      });
    },
    [updateSelectionState],
  );

  // Clear all selections
  const clearAll = useCallback(() => {
    updateSelectionState({
      selectedContactIds: new Set(),
      selectedTeamGroups: [],
      selectedRoleGroups: [],
      allContacts: false,
    });
  }, [updateSelectionState]);

  // Set "all contacts" mode
  const setAllContacts = useCallback(
    (enabled: boolean) => {
      updateSelectionState({
        allContacts: enabled,
        selectedContactIds: enabled ? new Set() : selectionState.selectedContactIds,
      });
    },
    [selectionState.selectedContactIds, updateSelectionState],
  );

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if any recipients are selected
    if (effectiveRecipients.length === 0) {
      errors.push('Please select at least one recipient');
    }

    // Check maximum recipients limit
    if (effectiveRecipients.length > maxRecipients) {
      errors.push(
        `Too many recipients selected (${effectiveRecipients.length}). Maximum allowed: ${maxRecipients}`,
      );
    }

    // Check for recipients without email addresses
    const recipientsWithoutEmail = effectiveRecipients.filter((r) => !r.email || !r.email.trim());
    if (recipientsWithoutEmail.length > 0) {
      warnings.push(
        `${recipientsWithoutEmail.length} recipient(s) don't have email addresses and will be skipped`,
      );
    }

    // Warning for large recipient lists
    if (effectiveRecipients.length > 100) {
      warnings.push(
        `Large recipient list (${effectiveRecipients.length} recipients). Email delivery may take longer.`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [effectiveRecipients, maxRecipients]);

  // Note: Removed redundant useEffect that was causing double state updates
  // All calculations are now handled in updateSelectionState function

  const validEmails = effectiveRecipients.filter((r) => hasValidEmail(r)).length;
  const invalidEmails = effectiveRecipients.length - validEmails;

  return {
    selectionState: {
      ...selectionState,
      totalRecipients: effectiveRecipients.length,
      validEmailCount: validEmails,
      invalidEmailCount: invalidEmails,
      effectiveRecipients,
    },
    actions: {
      toggleContact,
      selectContacts,
      deselectContacts,
      toggleTeamGroup,
      toggleRoleGroup,
      selectAll,
      clearAll,
      setAllContacts,
    },
    validation,
  };
};
