# Testing Updated /contacts Endpoint

## Updated Endpoint Behavior

The `/api/accounts/:accountId/contacts` endpoint now supports an optional `roles` query parameter with improved efficiency.

### API Changes Made

1. **Removed N+1 queries**: Eliminated the separate `aspnetroles` lookup that was fetching role names
2. **Client-side role resolution**: Role names are no longer included in the response - clients must resolve them separately
3. **Maintained backward compatibility**: When `roles` parameter is not specified, behavior is unchanged
4. **Optimized data structure**: Returns only `contactroles` data (id, roleId, roleData) without role names

### Example API Calls

#### Without roles (unchanged behavior):
```
GET /api/accounts/123/contacts
```

Response:
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
        "userId": "user123"
      }
    ]
  }
}
```

#### With roles (new optimized behavior):
```
GET /api/accounts/123/contacts?roles=true
```

Response:
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
        "contactroles": [
          {
            "id": "789",
            "roleId": "AccountAdmin",
            "roleData": "123"
          }
        ]
      }
    ]
  }
}
```

### Benefits

1. **Performance**: Single optimized query with conditional Prisma include
2. **Scalability**: No N+1 query problem when fetching role names
3. **Flexibility**: Clients can choose when to resolve role names based on their needs
4. **Data consistency**: Raw role data is preserved for client-side processing

### Client Implementation

Clients should:
1. Use `roles=true` only when role information is needed
2. Implement separate role name resolution when displaying role names
3. Cache role name mappings to avoid repeated lookups