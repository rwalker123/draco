import { describe, expect, it } from 'vitest';
import { buildSelectedIndividualIds } from '../AdvancedRecipientDialog';
import type { ContactGroup, GroupType } from '../../../../types/emails/recipients';

function makeGroup(ids: string[], groupType: GroupType = 'individuals'): ContactGroup {
  return {
    groupType,
    groupName: 'Test Group',
    ids: new Set(ids),
    totalCount: ids.length,
    managersOnly: false,
  };
}

describe('buildSelectedIndividualIds', () => {
  it('returns an empty Set when selectedGroups has no individuals entry', () => {
    const result = buildSelectedIndividualIds(new Map());
    expect(result.size).toBe(0);
  });

  it('returns all IDs from a single individuals group', () => {
    const groups = new Map<GroupType, ContactGroup[]>([
      ['individuals', [makeGroup(['a', 'b', 'c'])]],
    ]);
    const result = buildSelectedIndividualIds(groups);
    expect(result).toEqual(new Set(['a', 'b', 'c']));
  });

  it('unions IDs across multiple individuals groups', () => {
    const groups = new Map<GroupType, ContactGroup[]>([
      ['individuals', [makeGroup(['a', 'b']), makeGroup(['c', 'd'])]],
    ]);
    const result = buildSelectedIndividualIds(groups);
    expect(result).toEqual(new Set(['a', 'b', 'c', 'd']));
  });

  it('deduplicates IDs that appear in multiple groups', () => {
    const groups = new Map<GroupType, ContactGroup[]>([
      ['individuals', [makeGroup(['a', 'b']), makeGroup(['b', 'c'])]],
    ]);
    const result = buildSelectedIndividualIds(groups);
    expect(result).toEqual(new Set(['a', 'b', 'c']));
  });

  it('ignores non-individuals group types', () => {
    const groups = new Map<GroupType, ContactGroup[]>([['team', [makeGroup(['x', 'y'], 'team')]]]);
    const result = buildSelectedIndividualIds(groups);
    expect(result.size).toBe(0);
  });
});
