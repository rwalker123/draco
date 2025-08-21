# Teams Wanted Security Implementation - Complete Project Plan

## 🎯 **Project Overview**
Implement a comprehensive security model for Teams Wanted classifieds that eliminates public data exposure while maintaining functionality for authenticated users and access code holders.

## ✅ **Phase 1: Backend Security & API Restructuring - COMPLETED**

### **What Was Implemented:**

#### **1. Secured Main Teams Wanted Endpoint**
- **File**: `draco-nodejs/backend/src/routes/accounts-player-classifieds.ts`
- **Route**: `GET /teams-wanted`
- **Changes**: Added `authenticateToken` and `routeProtection.enforceAccountBoundary()` middleware
- **Result**: Endpoint now requires authentication and account membership (no more public access)

#### **2. Created New Access Code Endpoint**
- **File**: `draco-nodejs/backend/src/routes/accounts-player-classifieds.ts`
- **Route**: `POST /teams-wanted/access-code`
- **Purpose**: Allows unauthenticated users with valid access codes to view their own Teams Wanted ad
- **Security**: Rate-limited using `teamsWantedRateLimit` middleware
- **Response**: Returns full PII (email, phone, birthDate) for the specific ad

#### **3. Updated Backend Interfaces**
- **File**: `draco-nodejs/backend/src/interfaces/playerClassifiedInterfaces.ts`
- **Change**: `ITeamsWantedResponse` now includes full PII (email, phone, birthDate) for authenticated users
- **Change**: `ITeamsWantedOwnerResponse` now excludes `accessCode` for security (uses `Omit<ITeamsWantedClassified, 'accessCode'>`)

#### **4. Enhanced Backend Service**
- **File**: `draco-nodejs/backend/src/services/playerClassifiedService.ts`
- **New Method**: `findTeamsWantedByAccessCode(accountId, accessCode)` - finds Teams Wanted by access code
- **Updated Method**: `getTeamsWanted()` now returns `ITeamsWantedResponse[]` (full PII for authenticated users)
- **Security**: Access code verification uses bcrypt comparison against all account classifieds
- **Data Flow**: 
  - Authenticated account members → Full Teams Wanted list with PII
  - Access code verified users → Single ad with PII
  - Unauthorized users → No data

#### **5. Security Model Implemented**
- **Main endpoint**: `/teams-wanted` - **Protected, requires authentication + account membership**
- **Access code endpoint**: `/teams-wanted/access-code` - **Unprotected, rate-limited, returns single ad**
- **No public endpoint**: **Complete elimination of public Teams Wanted browsing**
- **Server-side filtering**: **All sensitive data filtering happens on backend**

### **Files Modified:**
- `draco-nodejs/backend/src/routes/accounts-player-classifieds.ts`
- `draco-nodejs/backend/src/services/playerClassifiedService.ts`
- `draco-nodejs/backend/src/interfaces/playerClassifiedInterfaces.ts`

### **Testing Status:**
- ✅ Backend build successful
- ✅ All 331 tests passing
- ✅ No linter errors

---

## 🔄 **Phase 2: Frontend UI & Logic Updates - TODO**

### **Objective:**
Update the frontend to work with the new secure backend model, implementing different UI states based on user authentication and account membership.

### **Files to Modify:**

#### **1. Teams Wanted Main Page**
- **File**: `draco-nodejs/frontend-next/app/account/[accountId]/player-classifieds/TeamsWanted.tsx`
- **Current State**: Shows all Teams Wanted for authenticated account members
- **Needs**: 
  - Handle case where user is not authenticated or not an account member
  - Show access code input field for non-account users
  - Display login/join account messaging
  - Handle access code verification flow

#### **2. Teams Wanted Card Component**
- **File**: `draco-nodejs/frontend-next/components/player-classifieds/TeamsWantedCardPublic.tsx`
- **Current State**: Shows contact info only for authenticated account members
- **Needs**: 
  - Update to handle new data structure (now includes email)
  - Ensure edit/delete controls work with new permission system
  - Handle display of full PII for authenticated users

#### **3. Frontend Types**
- **File**: `draco-nodejs/frontend-next/types/playerClassifieds.ts`
- **Current State**: `ITeamsWantedResponse` omits email
- **Needs**: Update to match backend interface (now includes email, phone, birthDate)

#### **4. Player Classified Service (Frontend)**
- **File**: `draco-nodejs/frontend-next/services/playerClassifiedService.ts`
- **Current State**: Has `verifyTeamsWantedAccess` method
- **Needs**: Add method to call new `/teams-wanted/access-code` endpoint

### **Implementation Requirements:**

#### **UI States to Implement:**
1. **Authenticated Account Member**: 
   - Show full Teams Wanted list with PII
   - Show edit/delete controls based on permissions
   
2. **Authenticated Non-Account Member**:
   - Show access code input field
   - Display message: "Join this account to see all Teams Wanted ads"
   - Allow access code verification for individual ads
   
3. **Unauthenticated User**:
   - Show access code input field
   - Display message: "Sign in to see all Teams Wanted ads"
   - Allow access code verification for individual ads

#### **Access Code Flow:**
1. User enters access code
2. Call `/teams-wanted/access-code` endpoint
3. If valid, show single Teams Wanted ad with PII
4. If invalid, show error message
5. Allow editing/deleting of verified ad

---

## 🔄 **Phase 3: Data Flow & Security Validation - TODO**

### **Objective:**
Validate that the complete system works correctly and all security principles are maintained.

### **Tasks:**
1. **API Response Validation**
   - Verify main endpoint returns full PII for authenticated account members
   - Verify access code endpoint returns single ad with PII
   - Confirm no accessCode is ever exposed in any response

2. **Frontend Integration Testing**
   - Test all UI states render correctly
   - Verify permission-based rendering works
   - Test access code verification flow

3. **Security Validation**
   - Confirm no public Teams Wanted browsing is possible
   - Verify rate limiting works on access code endpoint
   - Test authentication requirements on main endpoint

---

## 🚀 **Getting Started for Next Agent**

### **Key Understanding:**
- **Phase 1 is complete** - Backend is secure and ready
- **No public Teams Wanted endpoint exists** - all access requires authentication or access code
- **Frontend currently expects old data structure** - needs updates to handle new PII-inclusive responses
- **Access code system exists** - users can view/edit their own ads without account membership

### **Immediate Next Steps:**
1. **Start with Phase 2** - Frontend UI updates
2. **Focus on TeamsWanted.tsx** - main page logic
3. **Update types** to match new backend interfaces
4. **Implement access code input UI** for non-account users

### **Key Files to Study:**
- `draco-nodejs/frontend-next/app/account/[accountId]/player-classifieds/TeamsWanted.tsx` (main page)
- `draco-nodejs/frontend-next/components/player-classifieds/TeamsWantedCardPublic.tsx` (card component)
- `draco-nodejs/frontend-next/types/playerClassifieds.ts` (frontend types)
- `draco-nodejs/backend/src/routes/accounts-player-classifieds.ts` (backend routes - for reference)

### **Current Frontend State:**
- Shows Teams Wanted for authenticated account members only
- Contact info (phone) only visible to account members
- Edit/delete controls work with permission system
- **Missing**: Access code input, non-account user handling, login prompts

The backend security foundation is solid and complete. The frontend needs to be updated to leverage this new secure model and provide appropriate UI for different user states.
