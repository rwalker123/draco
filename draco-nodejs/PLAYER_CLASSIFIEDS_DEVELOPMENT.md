# PlayerClassifieds Feature Development

## Overview
The PlayerClassifieds feature allows teams to post "Players Wanted" ads and individual players to post "Teams Wanted" ads within a baseball account. This creates a classifieds board where teams can find players and players can find teams.

## Feature Description
- **Players Wanted**: Teams/coaches can post ads looking for players with specific positions and experience
- **Teams Wanted**: Individual players can post ads looking for teams to join
- **Email Notifications**: Automatic notifications when new ads are posted
- **Access Control**: Secure editing with access codes for public submissions
- **Expiration Management**: Automatic cleanup of expired classifieds

## Current Status
- [ ] Backend interfaces
- [ ] Backend services
- [ ] Backend routes
- [ ] Frontend components
- [ ] Frontend pages
- [ ] Email integration
- [ ] Testing
- [ ] Documentation

## Database Schema
The feature uses two existing tables in the Prisma schema:

### playerswantedclassified
```sql
- id: BigInt (Primary Key)
- accountid: BigInt (Foreign Key to accounts)
- datecreated: DateTime @db.Date
- createdbycontactid: BigInt (Foreign Key to contacts)
- teameventname: String @db.VarChar(50)
- description: String (unlimited text)
- positionsneeded: String @db.VarChar(50)

-- Recommended additions for enhanced functionality:
-- expirationdate: DateTime @db.Date
-- isactive: Boolean @default(true)
-- lastmodified: DateTime @default(now())
-- viewcount: Int @default(0)
-- emailnotifications: Boolean @default(true)
```

### teamswantedclassified
```sql
- id: BigInt (Primary Key)
- accountid: BigInt (Foreign Key to accounts)
- datecreated: DateTime @db.Date
- name: String @db.VarChar(50)
- email: String @db.VarChar(50)
- phone: String @db.VarChar(15)
- experience: String (unlimited text)
- positionsplayed: String @db.VarChar(50)
- accesscode: String @db.Uuid (Generated UUID for editing)
- birthdate: DateTime @db.Date

-- Recommended additions for enhanced functionality:
-- expirationdate: DateTime @db.Date
-- isactive: Boolean @default(true)
-- lastmodified: DateTime @default(now())
-- isemailverified: Boolean @default(false)
-- viewcount: Int @default(0)
-- emailnotifications: Boolean @default(true)
```

### **Required Database Indexes**
```sql
-- Performance optimization indexes
CREATE INDEX idx_playerswanted_accountid_active ON playerswantedclassified(accountid, isactive);
CREATE INDEX idx_playerswanted_datecreated ON playerswantedclassified(datecreated);
CREATE INDEX idx_playerswanted_expiration ON playerswantedclassified(expirationdate, isactive);

CREATE INDEX idx_teamswanted_accountid_active ON teamswantedclassified(accountid, isactive);
CREATE INDEX idx_teamswanted_datecreated ON teamswantedclassified(datecreated);
CREATE INDEX idx_teamswanted_expiration ON teamswantedclassified(expirationdate, isactive);
CREATE INDEX idx_teamswanted_accesscode ON teamswantedclassified(accesscode);
```

## Development Phases

### **Phase 1: Core Infrastructure & Security**
#### Backend Foundation
- [ ] Create comprehensive interfaces in `src/interfaces/playerClassifiedInterfaces.ts`
- [ ] Implement core service in `src/services/playerClassifiedService.ts`
- [ ] Create secure routes in `src/routes/accounts-player-classifieds.ts`
- [ ] Add comprehensive validation middleware with sanitization
- [ ] Implement role-based access control (Team Admin+ for Players Wanted)
- [ ] Add rate limiting middleware
- [ ] Implement audit logging system

#### Database & Schema Updates
- [ ] Add recommended fields to existing tables (expiration, status, view counts)
- [ ] Create database indexes for performance
- [ ] Set up audit trail table
- [ ] Test data migration from old system

#### Security Implementation
- [ ] Implement CAPTCHA integration for anonymous submissions
- [ ] Add email verification system for Teams Wanted
- [ ] Secure access code handling (hashing, validation)
- [ ] Input sanitization and validation rules

### **Phase 2: Frontend Core Features**
#### Basic UI Implementation
- [ ] Create responsive page structure in `app/account/[accountId]/player-classifieds/`
- [ ] Implement main classifieds listing page with pagination
- [ ] Create PlayersWanted component with role-based creation restrictions
- [ ] Create TeamsWanted component with email verification flow
- [ ] Implement secure create/edit dialogs
- [ ] Add basic filtering and search functionality

#### User Experience
- [ ] Mobile-first responsive design
- [ ] Loading states and error handling
- [ ] Success/failure notifications
- [ ] Progressive enhancement for offline viewing

### **Phase 3: Advanced Features & Matching**
#### Smart Matching System
- [ ] Implement matching algorithm engine
- [ ] Create suggestion system for relevant matches
- [ ] Add match scoring and ranking
- [ ] Build notification system for matches

#### Enhanced Search & Analytics
- [ ] Full-text search implementation
- [ ] Advanced filtering (position, experience, date range)
- [ ] Analytics dashboard for administrators
- [ ] Performance monitoring and optimization

### **Phase 4: Email & Notification System**
#### Email Infrastructure
- [ ] Create professional email templates
- [ ] Integrate with existing email service
- [ ] Implement notification triggers and scheduling
- [ ] Add expiration reminder system
- [ ] Build weekly digest functionality

#### Advanced Notifications
- [ ] Cross-notification between classified types
- [ ] Match suggestion emails
- [ ] Admin notification system
- [ ] Opt-in/opt-out preferences

### **Phase 5: Administration & Monitoring**
#### Admin Tools
- [ ] Admin dashboard for classified management
- [ ] Bulk operations for expired classifieds
- [ ] Analytics and reporting system
- [ ] Moderation and approval workflow

#### System Monitoring
- [ ] Performance monitoring dashboard
- [ ] Error tracking and alerting
- [ ] Usage analytics and reporting
- [ ] Background job monitoring for expiration cleanup

### **Phase 6: Testing & Documentation**
#### Comprehensive Testing
- [ ] Unit tests for all services and validation
- [ ] Integration tests for API endpoints
- [ ] Frontend component testing with role scenarios
- [ ] End-to-end user flow testing
- [ ] Security penetration testing
- [ ] Email delivery and notification testing
- [ ] Performance and load testing

#### Documentation & Training
- [ ] API documentation with examples
- [ ] User guides for different roles
- [ ] Admin procedures and troubleshooting
- [ ] Migration documentation from old system

## API Endpoints

### Players Wanted
- `GET /accounts/:accountId/player-classifieds/players-wanted` - List active players wanted ads
  - Query params: `?page=1&limit=20&position=pitcher&sort=newest&search=term`
  - Response: Paginated list with metadata
- `GET /accounts/:accountId/player-classifieds/players-wanted/:id` - Get specific players wanted ad
  - Increments view count
- `POST /accounts/:accountId/player-classifieds/players-wanted` - Create new players wanted ad
  - Requires: Authentication, Account membership
  - Rate limited: 5 posts per hour per contact
- `PUT /accounts/:accountId/player-classifieds/players-wanted/:id` - Update players wanted ad
  - Requires: Creator or Account admin permissions
- `DELETE /accounts/:accountId/player-classifieds/players-wanted/:id` - Delete players wanted ad
  - Requires: Creator or Account admin permissions

### Teams Wanted
- `GET /accounts/:accountId/player-classifieds/teams-wanted` - List active teams wanted ads
  - Query params: `?page=1&limit=20&position=catcher&experience=beginner&sort=newest`
  - Response: Paginated list with metadata
- `GET /accounts/:accountId/player-classifieds/teams-wanted/:id` - Get specific teams wanted ad
  - Increments view count
- `POST /accounts/:accountId/player-classifieds/teams-wanted` - Create new teams wanted ad
  - Requires: CAPTCHA verification for anonymous submissions
  - Rate limited: 3 posts per hour per IP address
  - Sends email verification with access code
- `PUT /accounts/:accountId/player-classifieds/teams-wanted/:id` - Update teams wanted ad
  - Requires: accessCode in request body (not query params for security)
  - Request body: `{ "accessCode": "uuid", "updateData": {...} }`
- `DELETE /accounts/:accountId/player-classifieds/teams-wanted/:id` - Delete teams wanted ad
  - Requires: accessCode in request body
- `POST /accounts/:accountId/player-classifieds/teams-wanted/:id/verify-email` - Verify email
  - Confirms email ownership and activates ad

### Search and Filtering
- `GET /accounts/:accountId/player-classifieds/search` - Advanced search across both types
  - Query params: `?q=keyword&type=all|players|teams&position=any&experience=any`
  - Full-text search capabilities
- `GET /accounts/:accountId/player-classifieds/suggestions/:id` - Get suggested matches
  - AI-powered matching based on positions and experience

### Admin Endpoints
- `GET /accounts/:accountId/player-classifieds/admin/all` - List all classifieds (including inactive)
  - Requires: Account admin permissions
- `PUT /accounts/:accountId/player-classifieds/admin/:type/:id/status` - Activate/deactivate ad
  - Requires: Account admin permissions
- `POST /accounts/:accountId/player-classifieds/admin/bulk-expire` - Bulk expire old ads
  - Requires: Account admin permissions
- `GET /accounts/:accountId/player-classifieds/admin/analytics` - Get usage analytics
  - Requires: Account admin permissions

### System Endpoints
- `POST /player-classifieds/cleanup/expired` - Cleanup expired classifieds (internal)
  - Background job endpoint
- `POST /player-classifieds/notifications/send` - Send pending notifications (internal)
  - Background job endpoint

## File Structure

### Backend
```
draco-nodejs/backend/src/
├── interfaces/
│   └── playerClassifiedInterfaces.ts
├── services/
│   └── playerClassifiedService.ts
├── routes/
│   └── accounts-player-classifieds.ts
└── middleware/
    └── validation/
        └── playerClassifiedValidation.ts
```

### Frontend
```
draco-nodejs/frontend-next/
├── app/account/[accountId]/player-classifieds/
│   ├── page.tsx
│   ├── PlayersWanted.tsx
│   ├── TeamsWanted.tsx
│   ├── CreatePlayersWantedDialog.tsx
│   └── CreateTeamsWantedDialog.tsx
├── components/player-classifieds/
│   ├── PlayersWantedCard.tsx
│   ├── TeamsWantedCard.tsx
│   ├── ClassifiedsFilter.tsx
│   └── ClassifiedsHeader.tsx
├── services/
│   └── playerClassifiedService.ts
└── hooks/
    └── usePlayerClassifieds.ts
```

## Security Requirements

### **Input Validation and Sanitization**
- **HTML Sanitization**: All text inputs sanitized to prevent XSS attacks
- **SQL Injection Prevention**: Use parameterized queries (Prisma handles this)
- **Field Length Limits**: Enforce database field constraints
- **Email Validation**: RFC-compliant email format validation
- **Phone Validation**: Standardized phone number format with country code support
- **Date Validation**: Birth date must be reasonable (13-80 years old)
- **Position Validation**: Limit to predefined baseball positions

### **Rate Limiting and Abuse Prevention**
```typescript
// Rate limiting configuration
const rateLimits = {
  playersWanted: {
    perContact: '5 posts per hour',
    perAccount: '20 posts per hour'
  },
  teamsWanted: {
    perIP: '3 posts per hour',
    perEmail: '1 post per 24 hours'
  },
  search: {
    perIP: '100 requests per minute'
  }
};
```

### **CAPTCHA Integration**
- **Anonymous Submissions**: CAPTCHA required for all teams wanted ads
- **Suspicious Activity**: Trigger CAPTCHA after multiple failed attempts
- **Integration**: Use Google reCAPTCHA v3 with score-based validation

### **Access Code Security**
- **Generation**: Cryptographically secure UUID generation
- **Storage**: Store hashed access codes in database
- **Transmission**: Send access codes via encrypted email only
- **Expiration**: Access codes expire after 90 days of inactivity
- **Validation**: Rate limit access code attempts (5 per hour per IP)

### **Email Verification System**
```typescript
// Email verification workflow
const emailVerification = {
  required: true, // For all teams wanted submissions
  expirationTime: '24 hours',
  maxResendAttempts: 3,
  resendCooldown: '15 minutes'
};
```

### **Audit Logging**
- **All Operations**: Log create, update, delete operations with timestamps
- **Authentication Events**: Log login attempts and access code usage
- **Admin Actions**: Detailed logging of all admin override actions
- **IP Tracking**: Record IP addresses for all anonymous submissions
- **Data Retention**: Keep audit logs for 1 year minimum

## Business Logic

### Access Control
- **PlayersWantedClassified**: Only Team Admin and above can create/edit/delete
- **TeamsWantedClassified**: Anyone can create (with email verification), edit/delete requires access code
- **Admin Override**: Account admins can manage all classifieds regardless of creator
- **Account Boundary**: All operations strictly within account boundaries
- **Role Validation**: Use existing RoleContext for permission checks (TeamAdmin, ContactAdmin, AccountAdmin)

### **Automatic Expiration System**
```typescript
// Expiration configuration
const expirationConfig = {
  playersWanted: {
    defaultDays: 30,
    maxDays: 90,
    reminderDays: [7, 3, 1] // Days before expiration to send reminders
  },
  teamsWanted: {
    defaultDays: 60,
    maxDays: 120,
    reminderDays: [14, 7, 3, 1]
  },
  cleanupSchedule: 'daily at 2:00 AM' // Background job schedule
};
```

### **Smart Matching Algorithm**
- **Position Matching**: Automatic matching between teams looking for specific positions and players who play those positions
- **Experience Level**: Match experience requirements with player experience
- **Geographic Proximity**: Consider account location for local matches (if available)
- **Age Compatibility**: Match age-appropriate players with teams
- **Availability Overlap**: Consider posted availability windows

### **Email Notifications**
- **New Players Wanted Ad**: 
  - Notify all active teams wanted ads with matching positions
  - Send weekly digest to account subscribers
- **New Teams Wanted Ad**: 
  - Notify teams looking for matching positions
  - Send to team administrators and contact admins
- **Teams Wanted Registration**: 
  - Send access code and verification email to submitter
  - Include instructions for editing/deleting
- **Expiration Reminders**: 
  - Notify creators before classified expires
  - Offer one-click renewal option
- **Match Suggestions**: 
  - Weekly email with potential matches based on algorithm
  - Allow users to opt-out of specific notification types

### **Cross-Notification Strategy**
```typescript
// Notification triggers
const notificationTriggers = {
  onPlayersWantedCreated: [
    'notifyMatchingTeamsWanted',
    'addToWeeklyDigest',
    'updateSearchIndexes'
  ],
  onTeamsWantedCreated: [
    'sendVerificationEmail',
    'notifyMatchingPlayersWanted',
    'triggerMatchingAlgorithm'
  ],
  onExpirationApproaching: [
    'sendReminderEmail',
    'offerRenewalOption',
    'suggestionAlternativeActions'
  ]
};
```

### Data Validation
- Required fields validation
- Email format validation
- Phone number format validation
- Position and experience text limits
- Date range validation for birth dates

## Configuration
- **Expiration Days**: Configurable via environment variable (`CLASSIFIEDS_EXPIRATION_DAYS`)
- **Email Templates**: Customizable via email template system
- **Access Code Expiry**: Configurable timeout for access codes (`ACCESS_CODE_EXPIRY_DAYS`)
- **Rate Limiting**: Configurable limits per environment (`RATE_LIMIT_*`)
- **Matching Algorithm**: Configurable weights for different matching criteria
- **CAPTCHA Settings**: Configurable score thresholds and site keys

## Advanced Features

### **Full-Text Search Implementation**
```typescript
// Search configuration
const searchConfig = {
  indexedFields: [
    'teameventname', 'description', 'positionsneeded', // Players wanted
    'name', 'experience', 'positionsplayed' // Teams wanted
  ],
  searchWeights: {
    positionsneeded: 3.0,
    positionsplayed: 3.0,
    teameventname: 2.0,
    description: 1.0,
    experience: 1.5
  },
  resultRanking: 'relevance + recency + view_count'
};
```

### **Analytics and Reporting Dashboard**
- **Usage Metrics**: Total ads, active ads, views per ad, response rates
- **Popular Positions**: Most requested positions for players and teams
- **Time-based Analytics**: Peak posting times, seasonal trends
- **Geographic Distribution**: If location data available
- **Conversion Tracking**: Successful matches, contact rates
- **Performance Metrics**: Search query analysis, page load times

### **Mobile-First Design Considerations**
- **Progressive Web App**: Offline reading capability for classifieds
- **Touch-Optimized**: Large touch targets for mobile interactions
- **Image Optimization**: Responsive images for team logos/player photos
- **Quick Actions**: Swipe gestures for common actions
- **Push Notifications**: Mobile push for new matches (future enhancement)

### **Advanced Matching Engine**
```typescript
// Matching algorithm configuration
const matchingEngine = {
  positionWeight: 0.4,      // Primary position compatibility
  experienceWeight: 0.3,    // Experience level match
  availabilityWeight: 0.2,  // Time availability overlap
  proximityWeight: 0.1,     // Geographic proximity (if available)
  
  scoringThresholds: {
    excellent: 0.8,    // 80%+ match score
    good: 0.6,         // 60-79% match score
    fair: 0.4          // 40-59% match score
  }
};
```

### **Social Integration Features**
- **Share to Social Media**: Share classifieds on Twitter, Facebook
- **QR Code Generation**: Quick access to specific classifieds
- **Embeddable Widgets**: Allow embedding on external websites
- **RSS Feeds**: Account-specific RSS feeds for new classifieds
- **Print-Friendly Views**: Optimized printing for offline distribution

## Technical Architecture

### **Caching Strategy**
```typescript
// Caching configuration
const cacheConfig = {
  classifiedsList: {
    ttl: '5 minutes',    // Recent listings cache
    invalidateOn: ['create', 'update', 'delete']
  },
  searchResults: {
    ttl: '15 minutes',   // Search query results
    keyStrategy: 'hash(query + filters + sort)'
  },
  matchingSuggestions: {
    ttl: '1 hour',       // Matching algorithm results
    backgroundRefresh: true
  },
  accountStats: {
    ttl: '1 hour',       // Analytics and stats
    refreshSchedule: 'hourly'
  }
};
```

### **Database Optimization**
- **Query Optimization**: Use Prisma's include/select to minimize data transfer
- **Connection Pooling**: Leverage existing database pool configuration
- **Bulk Operations**: Batch operations for admin tasks and cleanup
- **Read Replicas**: Consider read replicas for search-heavy operations

### **Background Jobs Architecture**
```typescript
// Background job system
const backgroundJobs = {
  expirationCleanup: {
    schedule: 'daily at 2:00 AM',
    task: 'mark expired classifieds as inactive',
    batchSize: 100
  },
  emailDigests: {
    schedule: 'weekly on Monday at 8:00 AM',
    task: 'send weekly classified digests',
    audience: 'opted-in users'
  },
  matchingUpdates: {
    schedule: 'hourly',
    task: 'recalculate match suggestions',
    onlyIfDataChanged: true
  },
  analyticsAggregation: {
    schedule: 'daily at 1:00 AM',
    task: 'aggregate usage statistics',
    retentionDays: 365
  }
};
```

### **Error Handling Strategy**
- **Graceful Degradation**: Core features work even if advanced features fail
- **Circuit Breakers**: Protect against external service failures (email, CAPTCHA)
- **Retry Logic**: Automatic retry for transient failures
- **Monitoring Integration**: Comprehensive error tracking and alerting

### **Performance Considerations**
- **Lazy Loading**: Load classified details only when needed
- **Infinite Scroll**: Implement virtual scrolling for large lists
- **Image Optimization**: Compress and resize images automatically
- **CDN Integration**: Serve static assets from CDN

## Testing Strategy
### **Automated Testing**
- **Unit Tests**: 90%+ coverage for services, validation, and utilities
- **Integration Tests**: Full API endpoint testing with role scenarios
- **Component Tests**: React component testing with different user roles
- **E2E Tests**: Complete user journeys from creation to expiration
- **Security Tests**: Penetration testing for common vulnerabilities
- **Performance Tests**: Load testing for high-traffic scenarios

### **Manual Testing**
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iOS Safari, Chrome Mobile, responsive design
- **Accessibility Testing**: Screen readers, keyboard navigation
- **Email Testing**: Multiple email clients and providers

## Dependencies
- Existing account system
- Contact management system
- Email infrastructure
- Role-based permissions
- Prisma ORM
- Next.js frontend framework

## Notes from Original ASP.NET Implementation
- Used AutoMapper for view model mapping
- Implemented access code system for public editing
- Had automatic expiration after configurable days
- Cross-notification between classified types
- Email templates were hardcoded in controller

## Migration Considerations
- Data migration from old system if needed
- Maintain backward compatibility for existing integrations
- Preserve access codes for existing teams wanted ads
- Ensure email notification continuity

## Future Enhancements
- Mobile app integration
- Push notifications
- Advanced matching algorithms
- Social media sharing
- Analytics dashboard
- Bulk operations for admins

## Critical Questions & Decisions Needed

### **Security & Access Control**
- [x] **Access Code System**: Keep existing UUID-based access code system with enhanced security (hashing)
- [x] **Role Requirements**: Team Admin and above required for Players Wanted (confirmed)
- [ ] **Moderation Workflow**: Should new classifieds require admin approval before being visible?
- [ ] **CAPTCHA Threshold**: What reCAPTCHA score threshold should trigger human verification?
- [ ] **Rate Limiting Strategy**: Current proposal: 5 Players Wanted per hour per contact, 3 Teams Wanted per hour per IP - acceptable?

### **Expiration & Lifecycle Management**
- [ ] **Expiration Timeframes**: 
  - Players Wanted: 30 days default, 90 max - appropriate?
  - Teams Wanted: 60 days default, 120 max - appropriate?
- [ ] **Grace Period**: Should expired classifieds have a 7-day grace period before deletion?
- [ ] **Renewal Process**: One-click renewal vs. require re-posting?
- [ ] **Automatic Extensions**: Should popular classifieds (high view count) get automatic extensions?

### **Notification & Communication**
- [ ] **Email Frequency**: How often should match notification emails be sent? (Daily, weekly, real-time)
- [ ] **Digest Preferences**: Should users control which types of notifications they receive?
- [ ] **Match Threshold**: What minimum match score should trigger automatic notifications?
- [ ] **Contact Information**: Should we allow direct contact info in ads or force communication through the system?

### **Feature Scope & Prioritization**
- [ ] **Photo Support**: Should classifieds support player/team photos? If yes, what storage strategy?
- [ ] **Geographic Features**: Should we add location-based matching for local teams?
- [ ] **Calendar Integration**: Should we integrate with existing game scheduling for availability?
- [ ] **Payment Integration**: Any plans for paid featured listings or premium placements?

### **Technical Implementation**
- [ ] **Search Technology**: Use database full-text search or integrate external search service (Elasticsearch)?
- [ ] **Caching Strategy**: Redis for caching or in-memory caching sufficient for Phase 1?
- [ ] **Background Jobs**: Use existing job queue system or implement new one for classifieds?
- [ ] **Analytics Tracking**: Integrate with existing analytics or implement custom tracking?

### **Business Rules & Validation**
- [ ] **Age Restrictions**: Minimum age for Teams Wanted submissions (current: 13+ based on birthdate validation)?
- [ ] **Position Validation**: Should we enforce standard baseball positions or allow free-text?
- [ ] **Experience Levels**: Define standard experience levels (Beginner, Intermediate, Advanced, Expert)?
- [ ] **Content Moderation**: What keywords/content should be automatically flagged for review?

### **Migration & Compatibility**
- [ ] **Data Migration**: Migrate existing classifieds from old ASP.NET system or start fresh?
- [ ] **URL Compatibility**: Maintain old URL structure for SEO or implement redirects?
- [ ] **Feature Parity**: Must all original ASP.NET features be implemented in Phase 1?
- [ ] **User Training**: How to communicate changes to existing users?

### **Performance & Scalability**
- [ ] **Traffic Expectations**: Expected daily active users and classifieds volume?
- [ ] **Peak Usage**: Are there seasonal patterns (spring training, season start) to plan for?
- [ ] **Mobile Usage**: What percentage of users access via mobile? Should we prioritize mobile-first?
- [ ] **International Support**: Any plans for multi-language or international leagues?

### **Compliance & Legal**
- [ ] **Data Privacy**: What personal data retention policies apply to classifieds?
- [ ] **Age Verification**: Do we need stronger age verification for minors posting Teams Wanted?
- [ ] **Content Liability**: Who is responsible for classified content - poster or platform?
- [ ] **COPPA Compliance**: Special considerations for users under 13?

## Recommended Decisions (Based on Analysis)

### **High Priority - Needed Before Phase 1**
1. **Moderation Workflow**: Recommend auto-publish with post-moderation for faster user experience
2. **Expiration Timeframes**: Use proposed timeframes (30/60 days) with option to configure per account
3. **Search Technology**: Start with database full-text search, plan migration to Elasticsearch in Phase 3
4. **Background Jobs**: Integrate with existing job queue system for consistency

### **Medium Priority - Needed Before Phase 2**
1. **Photo Support**: Implement in Phase 2 with existing file upload infrastructure
2. **Geographic Features**: Add in Phase 3 if account location data becomes available
3. **Contact Method**: Force communication through system initially, allow direct contact in Phase 4
4. **Experience Levels**: Define 4 standard levels with free-text additional details

### **Low Priority - Decide During Development**
1. **Payment Features**: Not needed for Phase 1, evaluate demand after launch
2. **Calendar Integration**: Consider for Phase 4 based on user feedback
3. **International Support**: Evaluate based on account growth patterns

## Resources
- Original ASP.NET controllers: `Draco/Areas/Baseball/Controllers/`
- Original models: `Draco/Areas/Baseball/Models/ModelObjects/`
- New system architecture: `draco-nodejs/ARCHITECTURE.md`
- Email system: `draco-nodejs/backend/src/services/email/`

---

**Last Updated**: [Current Date]
**Status**: Planning Phase
**Next Steps**: Begin Phase 1 - Backend Infrastructure
