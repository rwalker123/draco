import { describe, expect, it } from 'vitest';
import { aggregateRecipientCounts, HIERARCHICAL_GROUP_TYPES } from '../AdvancedRecipientDialog';
import type {
  ContactGroup,
  GroupType,
  RecipientContact,
} from '../../../../types/emails/recipients';

function makeGroup(
  ids: string[],
  groupType: GroupType,
  totalCount: number = ids.length,
): ContactGroup {
  return {
    groupType,
    groupName: `Test ${groupType}`,
    ids: new Set(ids),
    totalCount,
    managersOnly: false,
  };
}

function makeContact(id: string, hasValidEmail: boolean): RecipientContact {
  return {
    id,
    firstName: 'First',
    lastName: 'Last',
    email: hasValidEmail ? `${id}@example.com` : '',
    hasValidEmail,
  } as RecipientContact;
}

function lookupFrom(contacts: RecipientContact[]) {
  const byId = new Map(contacts.map((c) => [c.id, c]));
  return (contactId: string) => byId.get(contactId);
}

describe('aggregateRecipientCounts', () => {
  it('returns zero counts for an empty selection', () => {
    const result = aggregateRecipientCounts(new Map(), 0, 0, 0, () => undefined);
    expect(result.individualContactDetails).toEqual([]);
    expect(result.hierarchicalContactCount).toBe(0);
    expect(result.totalRecipients).toBe(0);
    expect(result.validEmailCount).toBe(0);
    expect(result.invalidEmailCount).toBe(0);
  });

  it('counts individual contacts and resolves their details', () => {
    const contacts = [makeContact('a', true), makeContact('b', false), makeContact('c', true)];
    const groups = new Map<GroupType, ContactGroup[]>([
      ['individuals', [makeGroup(['a', 'b', 'c'], 'individuals')]],
    ]);

    const result = aggregateRecipientCounts(groups, 0, 0, 0, lookupFrom(contacts));

    expect(result.individualContactDetails).toHaveLength(3);
    expect(result.totalRecipients).toBe(3);
    expect(result.validEmailCount).toBe(2);
    expect(result.invalidEmailCount).toBe(1);
    expect(result.hierarchicalContactCount).toBe(0);
  });

  it('dedupes individuals that appear in multiple individuals groups', () => {
    const contacts = [makeContact('a', true), makeContact('b', true)];
    const groups = new Map<GroupType, ContactGroup[]>([
      ['individuals', [makeGroup(['a', 'b'], 'individuals'), makeGroup(['b'], 'individuals')]],
    ]);

    const result = aggregateRecipientCounts(groups, 0, 0, 0, lookupFrom(contacts));

    expect(result.individualContactDetails.map((c) => c.id).sort()).toEqual(['a', 'b']);
    expect(result.totalRecipients).toBe(2);
    expect(result.validEmailCount).toBe(2);
    expect(result.invalidEmailCount).toBe(0);
  });

  it('uses group.totalCount for hierarchical groups instead of ids.size', () => {
    const groups = new Map<GroupType, ContactGroup[]>([
      ['team', [makeGroup(['team-1'], 'team', 12), makeGroup(['team-2'], 'team', 8)]],
    ]);

    const result = aggregateRecipientCounts(groups, 0, 0, 0, () => undefined);

    expect(result.hierarchicalContactCount).toBe(20);
    expect(result.individualContactDetails).toEqual([]);
    expect(result.totalRecipients).toBe(20);
    expect(result.validEmailCount).toBe(20);
    expect(result.invalidEmailCount).toBe(0);
  });

  it('treats every hierarchical group type as hierarchical', () => {
    const groups = new Map<GroupType, ContactGroup[]>([
      ['season', [makeGroup(['s-1'], 'season', 5)]],
      ['league', [makeGroup(['l-1'], 'league', 7)]],
      ['division', [makeGroup(['d-1'], 'division', 3)]],
      ['team', [makeGroup(['t-1'], 'team', 4)]],
    ]);

    const result = aggregateRecipientCounts(groups, 0, 0, 0, () => undefined);

    expect(HIERARCHICAL_GROUP_TYPES.size).toBe(4);
    expect(result.hierarchicalContactCount).toBe(5 + 7 + 3 + 4);
    expect(result.individualContactDetails).toEqual([]);
  });

  it('combines individuals, hierarchical groups, workouts, teams-wanted, and umpires', () => {
    const contacts = [makeContact('a', true), makeContact('b', false)];
    const groups = new Map<GroupType, ContactGroup[]>([
      ['individuals', [makeGroup(['a', 'b'], 'individuals')]],
      ['team', [makeGroup(['t-1'], 'team', 10)]],
    ]);

    const result = aggregateRecipientCounts(groups, 3, 2, 1, lookupFrom(contacts));

    // individuals: 2 (1 valid, 1 invalid)
    // hierarchical: 10 (all assumed valid)
    // workouts: 3, teamsWanted: 2, umpires: 1 (all assumed valid)
    expect(result.totalRecipients).toBe(2 + 10 + 3 + 2 + 1);
    expect(result.validEmailCount).toBe(1 + 10 + 3 + 2 + 1);
    expect(result.invalidEmailCount).toBe(1);
    expect(result.hierarchicalContactCount).toBe(10);
    expect(result.individualContactDetails.map((c) => c.id).sort()).toEqual(['a', 'b']);
  });

  it('does not dedupe individuals against hierarchical ids (they are different id spaces)', () => {
    // The individuals group lists contact id 'a'; the team hierarchical group has node id 'a'
    // with totalCount 5. Hierarchical groups must NOT consume the contact-id slot.
    const contacts = [makeContact('a', true)];
    const groups = new Map<GroupType, ContactGroup[]>([
      ['individuals', [makeGroup(['a'], 'individuals')]],
      ['team', [makeGroup(['a'], 'team', 5)]],
    ]);

    const result = aggregateRecipientCounts(groups, 0, 0, 0, lookupFrom(contacts));

    expect(result.individualContactDetails).toHaveLength(1);
    expect(result.hierarchicalContactCount).toBe(5);
    expect(result.totalRecipients).toBe(6);
  });

  it('omits individuals whose contact details cannot be resolved', () => {
    const contacts = [makeContact('a', true)];
    const groups = new Map<GroupType, ContactGroup[]>([
      ['individuals', [makeGroup(['a', 'missing'], 'individuals')]],
    ]);

    const result = aggregateRecipientCounts(groups, 0, 0, 0, lookupFrom(contacts));

    expect(result.individualContactDetails).toHaveLength(1);
    expect(result.individualContactDetails[0].id).toBe('a');
    // totalRecipients still uses the resolved details count
    expect(result.totalRecipients).toBe(1);
  });
});
