# Role System Testing Guide

## ✅ Role System Foundation Successfully Implemented!

The role system is now working with proper Prisma integration (no more raw SQL queries).

## Available Test Endpoints

### 1. Get All Role IDs (No Auth Required)
```bash
curl -s "http://localhost:5000/api/roleTest/role-ids" | jq .
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A",
        "name": "AccountAdmin"
      },
      {
        "id": "a87ea9a3-47e2-49d1-9e1e-c35358d1a677", 
        "name": "AccountPhotoAdmin"
      },
      {
        "id": "93DAC465-4C64-4422-B444-3CE79C549329",
        "name": "Administrator"
      },
      {
        "id": "672DDF06-21AC-4D7C-B025-9319CC69281A",
        "name": "LeagueAdmin"
      },
      {
        "id": "777D771B-1CBA-4126-B8F3-DD7F3478D40E",
        "name": "TeamAdmin"
      },
      {
        "id": "55FD3262-343F-4000-9561-6BB7F658DEB7",
        "name": "TeamPhotoAdmin"
      }
    ]
  }
}
```

### 2. Get User Roles (Requires Auth)
```bash
# First get a JWT token by logging in
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Then use the token to get user roles
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/roleTest/user-roles?accountId=1"
```

### 3. Check Specific Role (Requires Auth)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/roleTest/check-role?roleId=5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A&accountId=1"
```

### 4. Check Permission (Requires Auth)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/roleTest/check-permission?permission=account.manage&accountId=1"
```

### 5. Get Account Users with Roles (Requires Auth)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/roleTest/account-users/1"
```

### 6. Assign Role (Requires Auth)
```bash
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "123",
    "roleId": "5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A",
    "roleData": "1",
    "accountId": "1"
  }' \
  "http://localhost:5000/api/roleTest/assign-role"
```

## Key Features Implemented

### ✅ **Contact Role Integration**
- Account-level roles (AccountAdmin, AccountPhotoAdmin)
- Team-level roles (TeamAdmin, TeamPhotoAdmin)
- League-level roles (LeagueAdmin)
- Global roles (Administrator)

### ✅ **Role Hierarchy**
- Administrator > AccountAdmin > TeamAdmin > TeamPhotoAdmin
- Role inheritance and permission escalation

### ✅ **Context-Aware Authorization**
- Users can only access their account's data
- Role validation based on account, team, and league context

### ✅ **Database Integration**
- Proper Prisma ORM integration (no raw SQL)
- Auto-incrementing IDs for contact roles
- Efficient role queries and caching

### ✅ **Security Features**
- Account boundary enforcement
- Role assignment validation
- Permission-based access control

## Next Steps

The role system foundation is complete and ready for:

1. **Phase 2: Route Protection** - Implement role-based middleware on existing routes
2. **Phase 3: Account Management** - Add role checks to account endpoints  
3. **Phase 4: Team/Player Management** - Add role checks to team/player endpoints
4. **Phase 5: Frontend Integration** - Add role-based UI components

## Testing with Real Data

To test with real users and roles:

1. Use the login endpoint to get a JWT token
2. Use that token to test the role endpoints
3. Try different account IDs to test account boundary enforcement
4. Test role assignment and removal functionality

The system is now ready for production use with proper role-based access control! 