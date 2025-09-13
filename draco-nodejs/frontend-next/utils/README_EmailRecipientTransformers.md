# Email Recipient Transformation Utilities

This document describes the transformation utilities that convert backend API responses into frontend component types for email recipient selection.

## Overview

The transformation utilities bridge the gap between backend data formats and frontend component requirements, providing:

- **Data Normalization**: Converts backend contact data to consistent frontend format
- **Validation**: Ensures email validity and data quality
- **Grouping**: Creates team-based and role-based recipient groups
- **Deduplication**: Removes duplicate contacts
- **Search & Filter**: Provides contact search and filtering capabilities

## Core Functions

### Contact Transformation

#### `transformBackendContact(contact: BackendContact): RecipientContact`

Transforms a backend contact object to frontend format.

**Features:**

- Generates display names with middle name support
- Validates email addresses
- Consolidates phone numbers (phone1 > phone2 > phone3)
- Transforms contact roles to user roles
- Handles missing data gracefully

**Example:**

```typescript
const backendContact = {
  id: 'contact-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  contactDetails: {
    phone1: '123-456-7890',
    phone2: '987-654-3210',
  },
};

const frontendContact = transformBackendContact(backendContact);
// Result: { id: 'contact-1', firstname: 'John', lastname: 'Doe',
//          displayName: 'John Doe', hasValidEmail: true, phone: '123-456-7890' }
```

### Group Transformation

#### `transformContactsToRoleGroups(contacts: RecipientContact[]): RoleGroup[]`

Groups contacts by their roles for role-based selection.

**Features:**

- Groups contacts by roleId/roleType
- Avoids duplicate contacts in same group
- Sorts contacts within groups by display name
- Handles contacts with multiple roles

#### `transformTeamsToGroups(teams: BackendTeam[], rosters: Map<string, BackendContact[]>, managers: Map<string, BackendContact[]>): TeamGroup[]`

Creates team-based recipient groups.

**Features:**

- Creates separate groups for players, managers, combined, and sports communication
- Includes league information in descriptions
- Handles teams with missing roster or manager data
- Deduplicates contacts across team roles

**Group Types:**

- `players`: Team roster members
- `managers`: Team managers/coaches
- `all`: Combined players and managers
- `sports`: General team communication group

### Utility Functions

#### `generateDisplayName(firstname: string, lastname: string, middlename?: string): string`

Generates human-readable display names.

**Features:**

- Handles null/empty name components
- Includes middle names when available
- Provides fallback for missing data
- Trims whitespace

#### `validateEmail(email?: string): boolean`

Validates email address format.

**Features:**

- Uses comprehensive email regex
- Handles null/undefined values
- Trims whitespace before validation

#### `consolidatePhoneNumbers(phone1?: string, phone2?: string, phone3?: string): string`

Consolidates multiple phone fields into single value.

**Features:**

- Prioritizes phone1 > phone2 > phone3
- Returns first non-empty value
- Trims whitespace
- Returns empty string if all empty

### Data Quality Functions

#### `deduplicateContacts(contacts: RecipientContact[]): RecipientContact[]`

Removes duplicate contacts based on ID.

**Features:**

- Preserves first occurrence of duplicates
- Uses contact ID for deduplication
- Maintains original array order

#### `validateContactCollection(contacts: RecipientContact[]): ValidationResult`

Provides comprehensive data quality metrics.

**Returns:**

```typescript
{
  totalContacts: number;
  validEmailCount: number;
  invalidEmailCount: number;
  contactsWithoutEmail: RecipientContact[];
  contactsWithEmail: RecipientContact[];
  duplicateCount: number;
  dataQualityIssues: string[];
}
```

### Search & Filter Functions

#### `filterContactsByQuery(contacts: RecipientContact[], query: string): RecipientContact[]`

Filters contacts by search query.

**Features:**

- Searches across name, email, and phone fields
- Case-insensitive search
- Returns all contacts for empty query
- Trims whitespace from query

#### `sortContactsByDisplayName(contacts: RecipientContact[]): RecipientContact[]`

Sorts contacts alphabetically by display name.

**Features:**

- Locale-aware sorting
- Does not mutate original array
- Handles special characters

## Integration with EmailRecipientService

The `EmailRecipientService` automatically uses these transformation utilities:

```typescript
const service = createEmailRecipientService(token);
const data = await service.getRecipientData(accountId);

// Data is already transformed and includes:
// - contacts: RecipientContact[]
// - teamGroups: TeamGroup[]
// - roleGroups: RoleGroup[]
// - currentSeason: Season | null
```

## Error Handling

All transformation functions handle edge cases gracefully:

- **Null/undefined values**: Provide sensible defaults
- **Missing required fields**: Log warnings but continue processing
- **Invalid data**: Skip invalid entries rather than failing
- **Empty collections**: Return empty arrays rather than throwing

## Performance Considerations

- **Efficient Algorithms**: Avoid O(n²) operations where possible
- **Parallel Processing**: Service fetches team data in parallel
- **Deduplication**: Uses Set for O(1) lookup performance
- **Memory Usage**: Creates new objects rather than mutating inputs

## Testing

Comprehensive unit tests cover:

- ✅ All transformation functions
- ✅ Edge cases and error conditions
- ✅ Data validation scenarios
- ✅ Performance with large datasets
- ✅ Type safety and null handling

Run tests with:

```bash
npm test utils/__tests__/emailRecipientTransformers.test.ts
```

## Usage Examples

See `utils/examples/emailRecipientTransformerUsage.ts` for comprehensive usage examples including:

- Loading and transforming recipient data
- Manual data transformation
- Building team groups
- Search and filter functionality
- Data quality reporting

## Best Practices

1. **Always validate data quality** after transformation
2. **Handle missing data gracefully** with fallbacks
3. **Use deduplication** before displaying contact lists
4. **Log data quality issues** for debugging
5. **Sort contacts** for consistent UI presentation
6. **Cache transformed data** when possible to avoid re-computation

## API Compatibility

These utilities are designed to be:

- **Backward compatible**: Won't break existing code
- **Extensible**: Easy to add new transformation logic
- **Type-safe**: Full TypeScript support with strict typing
- **Framework agnostic**: Can be used with any frontend framework
