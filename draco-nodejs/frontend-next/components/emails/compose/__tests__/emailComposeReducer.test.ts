import { describe, expect, it } from 'vitest';
import { composeReducer, createInitialState } from '../EmailComposeProvider';
import { DEFAULT_COMPOSE_CONFIG } from '../../../../types/emails/compose';
import type {
  RecipientContact,
  ContactGroup,
  GroupType,
} from '../../../../types/emails/recipients';
import { createDefaultRecipientSelectionState } from '../../../../types/emails/recipients';

function makeContact(id: string): RecipientContact {
  return {
    id,
    firstName: 'Test',
    lastName: 'User',
    email: `${id}@example.com`,
    hasValidEmail: true,
    displayName: 'Test User',
  } as RecipientContact;
}

function makeIndividualsGroup(ids: string[]): ContactGroup {
  return {
    groupType: 'individuals' as GroupType,
    groupName: 'Individual Selections',
    ids: new Set(ids),
    totalCount: ids.length,
    managersOnly: false,
  };
}

describe('composeReducer', () => {
  const baseState = createInitialState(DEFAULT_COMPOSE_CONFIG);

  describe('UPDATE_RECIPIENT_STATE', () => {
    it('stores individualContactDetails in recipientState', () => {
      const contact = makeContact('contact-1');
      const individualContactDetails = new Map([[contact.id, contact]]);
      const recipientState = {
        ...createDefaultRecipientSelectionState(),
        individualContactDetails,
      };

      const nextState = composeReducer(baseState, {
        type: 'UPDATE_RECIPIENT_STATE',
        payload: recipientState,
      });

      expect(nextState.recipientState?.individualContactDetails?.get('contact-1')).toEqual(contact);
    });

    it('stores individualContactDetails as empty Map when not provided', () => {
      const recipientState = createDefaultRecipientSelectionState();

      const nextState = composeReducer(baseState, {
        type: 'UPDATE_RECIPIENT_STATE',
        payload: recipientState,
      });

      expect(nextState.recipientState?.individualContactDetails).toBeUndefined();
    });
  });

  describe('UPDATE_SELECTED_GROUPS after UPDATE_RECIPIENT_STATE', () => {
    it('preserves individualContactDetails across a subsequent UPDATE_SELECTED_GROUPS dispatch', () => {
      const contact = makeContact('contact-1');
      const individualContactDetails = new Map([[contact.id, contact]]);
      const selectedGroups = new Map<GroupType, ContactGroup[]>([
        ['individuals', [makeIndividualsGroup([contact.id])]],
      ]);

      const stateAfterRecipientUpdate = composeReducer(baseState, {
        type: 'UPDATE_RECIPIENT_STATE',
        payload: {
          ...createDefaultRecipientSelectionState(),
          selectedGroups,
          individualContactDetails,
        },
      });

      const stateAfterGroupsUpdate = composeReducer(stateAfterRecipientUpdate, {
        type: 'UPDATE_SELECTED_GROUPS',
        payload: selectedGroups,
      });

      expect(
        stateAfterGroupsUpdate.recipientState?.individualContactDetails?.get('contact-1'),
      ).toEqual(contact);
    });
  });
});
