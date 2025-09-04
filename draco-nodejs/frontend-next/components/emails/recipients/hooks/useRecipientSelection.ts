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
  // Unified group-based selection system
  selectedGroups: initialSelection?.selectedGroups || new Map(),

  // Computed properties
  totalRecipients: initialSelection?.totalRecipients || 0,
  validEmailCount: initialSelection?.validEmailCount || 0,
  invalidEmailCount: initialSelection?.invalidEmailCount || 0,
  effectiveRecipients: [],

  // UI state
  searchQuery: initialSelection?.searchQuery || '',
  activeTab: initialSelection?.activeTab || ('contacts' as RecipientSelectionTab),
  expandedSections: initialSelection?.expandedSections || new Set<string>(),

  // Search state
  searchLoading: initialSelection?.searchLoading || false,
  searchError: initialSelection?.searchError || null,
  groupSearchQueries: initialSelection?.groupSearchQueries || {},

  // Pagination state
  currentPage: initialSelection?.currentPage || 1,
  hasNextPage: initialSelection?.hasNextPage || false,
  hasPrevPage: initialSelection?.hasPrevPage || false,
  contactsLoading: initialSelection?.contactsLoading || false,
  contactsError: initialSelection?.contactsError || null,
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

      // TODO: Update to use selectedGroups when backend integration is ready
      // For now, return empty array as placeholder
      if (state.selectedGroups) {
        state.selectedGroups.forEach((groups) => {
          groups.forEach((group) => {
            group.contactIds.forEach((contactId) => {
              if (!recipientIds.has(contactId)) {
                const contact = availableContacts.find((c) => c.id === contactId);
                if (contact) {
                  recipientIds.add(contactId);
                  recipients.push(contact);
                }
              }
            });
          });
        });
      }

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
  const toggleContact = useCallback((contactId: string) => {
    // TODO: Update to use selectedGroups when backend integration is ready
    console.log('toggleContact not yet implemented for new structure:', contactId);
  }, []);

  // Select multiple contacts
  const selectContacts = useCallback((contactIds: string[]) => {
    // TODO: Update to use selectedGroups when backend integration is ready
    console.log('selectContacts not yet implemented for new structure:', contactIds);
  }, []);

  // Deselect multiple contacts
  const deselectContacts = useCallback((contactIds: string[]) => {
    // TODO: Update to use selectedGroups when backend integration is ready
    console.log('deselectContacts not yet implemented for new structure:', contactIds);
  }, []);

  // Toggle team group selection
  const toggleTeamGroup = useCallback((group: TeamGroup) => {
    // TODO: Update to use selectedGroups when backend integration is ready
    console.log('toggleTeamGroup not yet implemented for new structure:', group);
  }, []);

  // Toggle role group selection
  const toggleRoleGroup = useCallback((group: RoleGroup) => {
    // TODO: Update to use selectedGroups when backend integration is ready
    console.log('toggleRoleGroup not yet implemented for new structure:', group);
  }, []);

  // Select all available contacts
  const selectAll = useCallback((contacts: RecipientContact[]) => {
    // TODO: Update to use selectedGroups when backend integration is ready
    console.log('selectAll not yet implemented for new structure:', contacts.length);
  }, []);

  // Clear all selections
  const clearAll = useCallback(() => {
    updateSelectionState({
      selectedGroups: new Map(),
    });
  }, [updateSelectionState]);

  // Set "all contacts" mode
  const setAllContacts = useCallback((enabled: boolean) => {
    // TODO: Update to use selectedGroups when backend integration is ready
    console.log('setAllContacts not yet implemented for new structure:', enabled);
  }, []);

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
