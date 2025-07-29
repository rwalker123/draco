# Backend Changes for Contact Details Support

## Overview
This document summarizes the backend changes made to support detailed contact information (phone, address, etc.) in the UserTable while following DRY/SOLID principles.

## Files Modified

### 1. `src/interfaces/contactInterfaces.ts`
**Changes:**
- Added `includeContactDetails?: boolean` to `ContactQueryOptions` interface
- Created new `ContactDetails` interface with contact fields:
  - `phone1`, `phone2`, `phone3`: string | null
  - `streetaddress`, `city`, `state`, `zip`: string | null
  - `dateofbirth`: string | null
  - `middlename`: string | null
- Extended `ContactResponse` interface to include optional `contactDetails`
- Added `ContactWithRoleAndDetailsRow` interface for SQL query results

**SOLID Principles Applied:**
- **Interface Segregation**: Created separate interfaces for basic vs. detailed contact info
- **Open/Closed**: Extended existing interfaces without modifying core functionality

### 2. `src/services/contactService.ts`
**Changes:**
- Updated `getContactsWithRoles()` method to accept `includeContactDetails` parameter
- Modified SQL query to conditionally include contact detail fields
- Updated `getContactsSimple()` method to support contact details in Prisma queries
- Enhanced `transformContactRows()` method to handle contact details transformation
- Added proper type handling for contact details in both simple and complex queries

**SOLID Principles Applied:**
- **Single Responsibility**: Each method has a clear, focused purpose
- **Open/Closed**: Extended functionality without breaking existing behavior
- **Dependency Inversion**: Methods depend on interfaces, not concrete implementations

### 3. `src/routes/accounts-contacts.ts`
**Changes:**
- Updated main contacts endpoint (`GET /api/accounts/:accountId/contacts`) to support `contactDetails=true` query parameter
- Updated search endpoint (`GET /api/accounts/:accountId/contacts/search`) to support contact details
- Added documentation for new query parameter
- Maintained backward compatibility with existing API calls

**SOLID Principles Applied:**
- **Single Responsibility**: Each endpoint has a clear purpose
- **Open/Closed**: Extended API without modifying existing behavior

## API Changes

### New Query Parameter
- `contactDetails=true`: Include detailed contact information in the response

### Example API Calls

#### Without contact details (existing behavior):
```
GET /api/accounts/123/contacts
```

#### With contact details:
```
GET /api/accounts/123/contacts?contactDetails=true
```

#### With roles and contact details:
```
GET /api/accounts/123/contacts?roles=true&contactDetails=true
```

### Response Structure
When `contactDetails=true` is included, the response will contain:

```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "456",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "userId": "user123",
        "contactDetails": {
          "phone1": "(555) 123-4567",
          "phone2": "(555) 987-6543",
          "phone3": "(555) 111-2222",
          "streetaddress": "123 Main St",
          "city": "Anytown",
          "state": "CA",
          "zip": "90210",
          "dateofbirth": "1990-01-01T00:00:00.000Z",
          "middlename": "Michael"
        },
        "contactroles": [...]
      }
    ]
  }
}
```

## Benefits

1. **Backward Compatibility**: Existing API calls continue to work unchanged
2. **Performance**: Contact details are only fetched when explicitly requested
3. **Flexibility**: Can be combined with existing query parameters (roles, pagination, etc.)
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **DRY Principle**: Reuses existing contact data structures from the database
6. **SOLID Principles**: Each component has a single responsibility and is easily extensible

## Testing

A test script has been created at `test-contact-details.js` to verify the functionality:

```bash
node test-contact-details.js
```

## Next Steps

The backend changes are complete and ready for frontend integration. The frontend can now:

1. Request contact details by adding `contactDetails=true` to API calls
2. Display additional contact information in the UserTable
3. Create reusable components for contact information display
4. Implement expandable/collapsible contact details

## Database Schema

The implementation leverages the existing `contacts` table which already contains:
- `phone1`, `phone2`, `phone3`: Phone numbers
- `streetaddress`, `city`, `state`, `zip`: Address information
- `dateofbirth`: Date of birth
- `middlename`: Middle name

No database schema changes were required. 