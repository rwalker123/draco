/**
 * Unit tests for email recipient transformation utilities
 */

import { vi } from 'vitest';
import {
  generateDisplayName,
  validateEmail,
  consolidatePhoneNumbers,
  transformBackendContact,
  transformContactsToRoleGroups,
  transformTeamsToGroups,
  deduplicateContacts,
  validateContactCollection,
  sortContactsByDisplayName,
  filterContactsByQuery,
} from '../emailRecipientTransformers';
import { BackendContact, BackendTeam } from '../../services/emailRecipientService';
import { RecipientContact } from '../../types/emails/recipients';

describe('generateDisplayName', () => {
  it('should combine first and last names', () => {
    expect(generateDisplayName('John', 'Doe')).toBe('John Doe');
  });

  it('should include middle name when provided', () => {
    expect(generateDisplayName('John', 'Doe', 'Michael')).toBe('John Michael Doe');
  });

  it('should handle missing first name', () => {
    expect(generateDisplayName('', 'Doe')).toBe('Doe');
  });

  it('should handle missing last name', () => {
    expect(generateDisplayName('John', '')).toBe('John');
  });

  it('should handle null values', () => {
    expect(generateDisplayName('John', 'Doe', null)).toBe('John Doe');
  });

  it('should handle empty strings and whitespace', () => {
    expect(generateDisplayName('  ', '  ')).toBe('Unknown Contact');
    expect(generateDisplayName('John', '  ')).toBe('John');
  });
});

describe('validateEmail', () => {
  it('should validate correct email formats', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email formats', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should handle null and undefined values', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});

describe('consolidatePhoneNumbers', () => {
  it('should return first non-empty phone number', () => {
    expect(consolidatePhoneNumbers('123-456-7890', '987-654-3210', '555-123-4567')).toBe(
      '123-456-7890',
    );
  });

  it('should skip empty first phone and use second', () => {
    expect(consolidatePhoneNumbers('', '987-654-3210', '555-123-4567')).toBe('987-654-3210');
  });

  it('should use third phone if first two are empty', () => {
    expect(consolidatePhoneNumbers('', '', '555-123-4567')).toBe('555-123-4567');
  });

  it('should return empty string if all phones are empty', () => {
    expect(consolidatePhoneNumbers('', '', '')).toBe('');
  });

  it('should handle null values', () => {
    expect(consolidatePhoneNumbers(null, '987-654-3210', null)).toBe('987-654-3210');
  });

  it('should trim whitespace', () => {
    expect(consolidatePhoneNumbers('  123-456-7890  ', '', '')).toBe('123-456-7890');
  });
});

describe('transformBackendContact', () => {
  const mockBackendContact: BackendContact = {
    id: 'contact-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    userId: 'user-1',
    contactDetails: {
      phone1: '123-456-7890',
      phone2: '987-654-3210',
      phone3: null,
      streetaddress: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      dateofbirth: '1990-01-01',
    },
    contactroles: [
      {
        id: 'role-1',
        roleId: 'contact-admin',
        roleName: 'Contact Admin',
        roleData: 'team-123',
      },
    ],
    teams: ['team-1', 'team-2'],
  };

  it('should transform complete contact correctly', () => {
    const result = transformBackendContact(mockBackendContact);

    expect(result).toEqual({
      id: 'contact-1',
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      displayName: 'John Doe',
      hasValidEmail: true,
      roles: [
        {
          id: 'role-1',
          roleId: 'contact-admin',
          roleName: 'Contact Admin',
          roleData: 'team-123',
          contextName: undefined,
        },
      ],
      teams: ['team-1', 'team-2'],
    });
  });

  it('should handle contact with missing data', () => {
    const incompleteContact: BackendContact = {
      id: 'contact-2',
      firstName: '',
      lastName: 'Smith',
      email: '',
      userId: 'user-2',
    };

    const result = transformBackendContact(incompleteContact);

    expect(result.displayName).toBe('Smith');
    expect(result.hasValidEmail).toBe(false);
    expect(result.phone).toBeUndefined();
    expect(result.roles).toEqual([]);
  });

  it('should warn about missing ID', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const contactWithoutId = { ...mockBackendContact, id: '' };
    transformBackendContact(contactWithoutId);

    expect(consoleSpy).toHaveBeenCalledWith('Contact missing required ID field:', contactWithoutId);

    consoleSpy.mockRestore();
  });
});

describe('transformContactsToRoleGroups', () => {
  const mockContacts: RecipientContact[] = [
    {
      id: 'contact-1',
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      displayName: 'John Doe',
      hasValidEmail: true,
      roles: [
        {
          id: 'role-1',
          roleId: 'contact-admin',
          roleName: 'Contact Admin',
          roleData: 'team-123',
        },
      ],
    },
    {
      id: 'contact-2',
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane@example.com',
      displayName: 'Jane Smith',
      hasValidEmail: true,
      roles: [
        {
          id: 'role-1',
          roleId: 'contact-admin',
          roleName: 'Contact Admin',
          roleData: 'team-456',
        },
        {
          id: 'role-2',
          roleId: 'account-admin',
          roleName: 'Account Admin',
          roleData: '',
        },
      ],
    },
  ];

  it('should group contacts by role type', () => {
    const result = transformContactsToRoleGroups(mockContacts);

    expect(result).toHaveLength(2);

    const contactAdminGroup = result.find((g) => g.roleId === 'contact-admin');
    expect(contactAdminGroup).toBeDefined();
    expect(contactAdminGroup!.members).toHaveLength(2);

    const accountAdminGroup = result.find((g) => g.roleId === 'account-admin');
    expect(accountAdminGroup).toBeDefined();
    expect(accountAdminGroup!.members).toHaveLength(1);
  });

  it('should avoid duplicate contacts in same role group', () => {
    const result = transformContactsToRoleGroups(mockContacts);
    const contactAdminGroup = result.find((g) => g.roleId === 'contact-admin');

    const contactIds = contactAdminGroup!.members.map((c) => c.id);
    const uniqueIds = new Set(contactIds);

    expect(contactIds.length).toBe(uniqueIds.size);
  });

  it('should sort contacts within groups by display name', () => {
    const result = transformContactsToRoleGroups(mockContacts);
    const contactAdminGroup = result.find((g) => g.roleId === 'contact-admin');

    const displayNames = contactAdminGroup!.members.map((c) => c.displayName);
    expect(displayNames).toEqual(['Jane Smith', 'John Doe']);
  });
});

describe('transformTeamsToGroups', () => {
  const mockTeams: BackendTeam[] = [
    {
      id: 'team-1',
      teamId: 'team-1',
      name: 'Red Sox',
      webAddress: null,
      youtubeUserId: null,
      defaultVideo: null,
      autoPlayVideo: false,
      leagueName: 'Major League',
    },
  ];

  const mockRosters = new Map([
    [
      'team-1',
      [
        {
          id: 'player-1',
          firstName: 'Player',
          lastName: 'One',
          email: 'player1@example.com',
          userId: 'user-1',
        },
      ],
    ],
  ]);

  const mockManagers = new Map([
    [
      'team-1',
      [
        {
          id: 'manager-1',
          firstName: 'Manager',
          lastName: 'One',
          email: 'manager1@example.com',
          userId: 'user-2',
        },
      ],
    ],
  ]);

  it('should create separate groups for players, managers, and combined', () => {
    const result = transformTeamsToGroups(mockTeams, mockRosters, mockManagers);

    expect(result).toHaveLength(4); // players, managers, all, sports

    const playersGroup = result.find((g) => g.type === 'players');
    const managersGroup = result.find((g) => g.type === 'managers');
    const allGroup = result.find((g) => g.type === 'all');
    const sportsGroup = result.find((g) => g.type === 'sports');

    expect(playersGroup).toBeDefined();
    expect(managersGroup).toBeDefined();
    expect(allGroup).toBeDefined();
    expect(sportsGroup).toBeDefined();
  });

  it('should include league name in description when available', () => {
    const result = transformTeamsToGroups(mockTeams, mockRosters, mockManagers);
    const playersGroup = result.find((g) => g.type === 'players');

    expect(playersGroup!.description).toContain('Major League');
  });

  it('should handle teams with no roster or managers', () => {
    const emptyRosters = new Map();
    const emptyManagers = new Map();

    const result = transformTeamsToGroups(mockTeams, emptyRosters, emptyManagers);

    expect(result).toHaveLength(0);
  });
});

describe('deduplicateContacts', () => {
  it('should remove duplicate contacts based on ID', () => {
    const contacts: RecipientContact[] = [
      {
        id: 'contact-1',
        firstname: 'John',
        lastname: 'Doe',
        displayName: 'John Doe',
        hasValidEmail: true,
      },
      {
        id: 'contact-2',
        firstname: 'Jane',
        lastname: 'Smith',
        displayName: 'Jane Smith',
        hasValidEmail: true,
      },
      {
        id: 'contact-1', // Duplicate
        firstname: 'John',
        lastname: 'Doe',
        displayName: 'John Doe',
        hasValidEmail: true,
      },
    ];

    const result = deduplicateContacts(contacts);

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(['contact-1', 'contact-2']);
  });

  it('should preserve first occurrence of duplicate', () => {
    const contacts: RecipientContact[] = [
      {
        id: 'contact-1',
        firstname: 'John',
        lastname: 'Doe',
        displayName: 'John Doe',
        hasValidEmail: true,
        email: 'john@example.com',
      },
      {
        id: 'contact-1',
        firstname: 'John',
        lastname: 'Doe',
        displayName: 'John Doe',
        hasValidEmail: true,
        email: 'john.doe@example.com', // Different email
      },
    ];

    const result = deduplicateContacts(contacts);

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('john@example.com'); // First occurrence preserved
  });
});

describe('validateContactCollection', () => {
  const mockContacts: RecipientContact[] = [
    {
      id: 'contact-1',
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      displayName: 'John Doe',
      hasValidEmail: true,
    },
    {
      id: 'contact-2',
      firstname: '',
      lastname: '',
      displayName: 'Unknown Contact',
      hasValidEmail: false,
    },
    {
      id: 'contact-1', // Duplicate
      firstname: 'John',
      lastname: 'Doe',
      displayName: 'John Doe',
      hasValidEmail: true,
    },
  ];

  it('should provide accurate validation metrics', () => {
    const result = validateContactCollection(mockContacts);

    expect(result.totalContacts).toBe(3);
    expect(result.validEmailCount).toBe(2); // Two contacts have valid emails (including duplicate)
    expect(result.invalidEmailCount).toBe(1); // One contact has no valid email
    expect(result.duplicateCount).toBe(1);
  });

  it('should identify data quality issues', () => {
    const result = validateContactCollection(mockContacts);

    expect(result.dataQualityIssues).toContain('1 duplicate contact(s) detected');
    expect(result.dataQualityIssues).toContain('1 contact(s) missing both first and last names');
  });
});

describe('sortContactsByDisplayName', () => {
  it('should sort contacts alphabetically by display name', () => {
    const contacts: RecipientContact[] = [
      {
        id: '1',
        firstname: 'Zoe',
        lastname: 'Adams',
        displayName: 'Zoe Adams',
        hasValidEmail: true,
      },
      {
        id: '2',
        firstname: 'Alice',
        lastname: 'Brown',
        displayName: 'Alice Brown',
        hasValidEmail: true,
      },
      {
        id: '3',
        firstname: 'Bob',
        lastname: 'Charlie',
        displayName: 'Bob Charlie',
        hasValidEmail: true,
      },
    ];

    const result = sortContactsByDisplayName(contacts);

    expect(result.map((c) => c.displayName)).toEqual(['Alice Brown', 'Bob Charlie', 'Zoe Adams']);
  });

  it('should not mutate original array', () => {
    const contacts: RecipientContact[] = [
      {
        id: '1',
        firstname: 'Zoe',
        lastname: 'Adams',
        displayName: 'Zoe Adams',
        hasValidEmail: true,
      },
    ];

    const result = sortContactsByDisplayName(contacts);

    expect(result).not.toBe(contacts);
  });
});

describe('filterContactsByQuery', () => {
  const contacts: RecipientContact[] = [
    {
      id: '1',
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      displayName: 'John Doe',
      hasValidEmail: true,
    },
    {
      id: '2',
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane.smith@test.com',
      displayName: 'Jane Smith',
      hasValidEmail: true,
    },
  ];

  it('should filter by first name', () => {
    const result = filterContactsByQuery(contacts, 'John');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should filter by email', () => {
    const result = filterContactsByQuery(contacts, 'test.com');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by phone', () => {
    const result = filterContactsByQuery(contacts, '123-456');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should be case insensitive', () => {
    const result = filterContactsByQuery(contacts, 'JOHN');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should return all contacts for empty query', () => {
    const result = filterContactsByQuery(contacts, '');
    expect(result).toHaveLength(2);
  });

  it('should return empty array for no matches', () => {
    const result = filterContactsByQuery(contacts, 'NonExistent');
    expect(result).toHaveLength(0);
  });
});
