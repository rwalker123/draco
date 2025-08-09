# Email Contacts Feature Implementation Plan

## 🚀 Current Implementation Status (Updated: August 2025)

### ✅ Phase 1: COMPLETE (100%)
**Backend (100%):**
- ✅ Database schema with 5 email tables (emails, email_templates, email_recipients, email_attachments, email_events)
- ✅ EmailService with SendGrid/Ethereal provider support
- ✅ EmailController with complete CRUD operations
- ✅ Email template services with variable substitution
- ✅ Authentication & authorization middleware

**Frontend (100%):**
- ✅ Email components structure (`/components/emails/`)
- ✅ Mailto link generation utilities
- ✅ EmailButton integration in UserDisplayCard
- ✅ Communications navigation menu
- ✅ Basic recipient selection UI

### ⚡ Phase 2: Backend ~85% COMPLETE, Frontend ~15% COMPLETE  
**Backend (85% Complete):**
- ✅ **Email Queue Processing**: Bulk email sending with background job processing
- ✅ **Provider-Aware Rate Limiting**: SendGrid (80/sec) vs Ethereal (unlimited) support
- ✅ **Email Status Tracking**: Real-time recipient status updates (sent/failed/partial)
- ✅ **Template Management**: Complete CRUD APIs with variable substitution
- ✅ **Analytics Foundation**: Database tracking for delivery, opens, clicks
- ⏳ **File Attachments**: Integration with StorageService (in development)
- ⏳ **Email Scheduling**: Background processing for scheduled sends (in development)
- ⏳ **SendGrid Webhooks**: Real-time delivery event tracking (in development)

**Frontend (15% Complete):**  
- ✅ Updated messaging to reflect Phase 2 status
- ✅ Communications dashboard with enabled features
- 🔨 Rich text email composer (Quill.js) - in development
- 🔨 Advanced recipient selection interface - in development
- 🔨 Email template management UI - in development
- 🔨 File attachment upload component - in development
- 🔨 Email history dashboard - in development

### 📅 Phase 3: Not Started (0%)
- Analytics dashboard with charts and metrics
- Advanced scheduling and recurring emails
- Production SendGrid webhook configuration
- Email preference and opt-out management

## Overview

Implementation plan for email contacts feature in Draco Sports Manager, enabling users to send emails to groups of contacts, team managers, players, and users with specific roles. The feature supports both simple device email client integration (mailto:) and advanced server-side email composition with templates, attachments, and analytics.

## Technical Architecture Decisions

Based on comprehensive analysis by frontend, backend, and UX specialists:

- **SMTP Service**: SendGrid for production (sports-friendly, excellent deliverability, generous free tier)
- **Testing Service**: Ethereal Email for development (captures emails without sending, web inbox)
- **Backend Strategy**: Leverage 90% existing contact APIs, add 5 new database tables
- **Frontend Approach**: Hybrid mailto/server-side with Material-UI 7 components
- **Storage Integration**: Use existing S3/LocalStack abstraction for attachments
- **Permissions**: Extend existing role system with email-specific permissions
- **Database**: PostgreSQL with Prisma ORM, 5 new tables for email functionality

## Key Features

1. **Recipient Management**: Email groups (team managers, players by team/season, users by role, custom selections)
2. **Dual Email Modes**: 
   - Simple mailto: links for quick individual emails
   - Advanced server-side composition for bulk emails with rich formatting
3. **Email Templates**: Pre-designed templates with variable substitution
4. **File Attachments**: Integration with existing account file storage
5. **Email Tracking**: Delivery status, open rates, click tracking
6. **Analytics Dashboard**: Email performance metrics and reporting
7. **Mobile-Responsive**: Touch-friendly interface following Material-UI patterns

## Database Schema Design

### 1. `emails` Table - Master Email Records

Stores each email composition/campaign with metadata and aggregate statistics.

```sql
CREATE TABLE emails (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_by_user_id VARCHAR(128) REFERENCES aspnetusers(id),
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,              -- Rich HTML content
  body_text TEXT,                       -- Plain text fallback (auto-generated)
  template_id BIGINT REFERENCES email_templates(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, sending, sent, failed, scheduled
  scheduled_send_at TIMESTAMP,          -- For scheduled emails
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,                    -- When sending completed
  
  -- Aggregate statistics (updated as emails are processed)
  total_recipients INT DEFAULT 0,       -- How many people were emailed
  successful_deliveries INT DEFAULT 0,  -- Successfully delivered
  failed_deliveries INT DEFAULT 0,      -- Failed to deliver  
  bounce_count INT DEFAULT 0,           -- Bounced emails
  open_count INT DEFAULT 0,             -- How many opened (if tracking enabled)
  click_count INT DEFAULT 0             -- How many clicked links
);
```

**Use Cases:**
- Email composition drafts before sending
- Bulk email campaigns to multiple recipients
- Email history and audit trail
- Performance analytics (open rates, click rates)
- Scheduling emails for future delivery

### 2. `email_templates` Table - Reusable Email Templates

Pre-designed email templates for common communications with variable substitution.

```sql
CREATE TABLE email_templates (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,           -- Template name ("Welcome Email")
  description TEXT,                     -- Template description
  subject_template VARCHAR(500),        -- Subject with variables: "Welcome {{firstName}}"
  body_template TEXT NOT NULL,          -- HTML body with variables
  created_by_user_id VARCHAR(128) REFERENCES aspnetusers(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true        -- Soft delete flag
);
```

**Use Cases:**
- Welcome emails for new team members
- Game day reminders with team/date variables
- Season registration announcements
- Fundraising campaign templates
- Coach communication templates

**Template Variables Example:**
```html
Subject: "{{teamName}} Game Update - {{gameDate}}"
Body: "Hello {{parentName}}, your child {{playerName}} has a game on {{gameDate}} at {{gameTime}}..."
```

### 3. `email_recipients` Table - Individual Recipients per Email

Tracks each person who received a specific email and their delivery status.

```sql
CREATE TABLE email_recipients (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES contacts(id),
  email_address VARCHAR(255) NOT NULL,  -- Email address used (snapshot)
  contact_name VARCHAR(255),            -- Name at time of sending
  recipient_type VARCHAR(50),           -- How they were selected:
                                        -- 'individual', 'team_manager', 'team_player', 'role_based'
  status VARCHAR(20) DEFAULT 'pending', -- pending/sent/delivered/bounced/failed/opened/clicked
  sent_at TIMESTAMP,                    -- When email was sent to this person
  delivered_at TIMESTAMP,               -- When delivery was confirmed
  opened_at TIMESTAMP,                  -- When they opened email (if tracked)
  clicked_at TIMESTAMP,                 -- When they clicked a link
  bounce_reason TEXT,                   -- Why email bounced
  error_message TEXT                    -- Any error details
);
```

**Use Cases:**
- Track delivery status per recipient
- Identify failed/bounced emails for cleanup
- Measure engagement (opens, clicks) per person
- Audit trail of who received what email
- Retry failed deliveries

### 4. `email_attachments` Table - File Attachments

Manages files attached to emails, integrated with existing S3/LocalStack storage.

```sql
CREATE TABLE email_attachments (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,       -- Display filename
  original_name VARCHAR(255) NOT NULL,  -- Original upload name
  file_size BIGINT NOT NULL,            -- File size in bytes
  mime_type VARCHAR(100),               -- Content type (image/jpeg, application/pdf)
  storage_path VARCHAR(500) NOT NULL,   -- Path in S3/LocalStack
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

**Use Cases:**
- Team schedules (PDF)
- Registration forms (PDF)
- Team photos (JPEG/PNG)
- Permission slips (PDF)
- Fundraising documents

### 5. `email_events` Table - Detailed Event Tracking

Granular tracking of all email-related events for analytics and troubleshooting.

```sql
CREATE TABLE email_events (
  id BIGSERIAL PRIMARY KEY,
  email_recipient_id BIGINT NOT NULL REFERENCES email_recipients(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL,      -- sent/delivered/bounced/opened/clicked/complained
  event_data JSONB,                     -- Additional event details
  occurred_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,                      -- Browser/email client info
  ip_address INET                       -- IP address for opens/clicks
);
```

**Use Cases:**
- Detailed analytics and reporting
- Troubleshooting delivery issues
- Understanding recipient engagement patterns
- Compliance and audit requirements

### Database Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX idx_emails_account_status ON emails(account_id, status);
CREATE INDEX idx_emails_scheduled_send ON emails(scheduled_send_at) WHERE status = 'scheduled';
CREATE INDEX idx_email_recipients_email_status ON email_recipients(email_id, status);
CREATE INDEX idx_email_recipients_contact ON email_recipients(contact_id);
CREATE INDEX idx_email_events_recipient_type ON email_events(email_recipient_id, event_type);
CREATE INDEX idx_email_events_occurred ON email_events(occurred_at);
```

### Table Relationships

```
emails (1) ──────── (many) email_recipients ──────── (many) email_events
   │                           │
   │                           │
   │                           └── references contacts (existing table)
   │
   ├── (many) email_attachments
   │
   └── (optional) email_templates
```

## Implementation Phases

### Phase 1: Foundation & Simple Implementation ✅ COMPLETE

**Backend Tasks:**
- ✅ Create database migration with 5 new email tables
- ✅ Extend existing EmailService class with SendGrid integration
- ✅ Add basic email composition API endpoint (`POST /api/accounts/:accountId/emails/compose`)
- ✅ Setup Ethereal Email configuration for development testing
- ✅ Create email template basic CRUD endpoints

**Frontend Tasks:**
- ✅ Create email components structure (`/components/emails/`)
- ✅ Implement simple mailto: link generation utilities
- ✅ Add email action buttons to existing UserDisplayCard components
- ✅ Create basic recipient group selection UI
- ✅ Add "Communications" section to hamburger navigation menu

**Deliverables:**
- ✅ Database schema deployed to development
- ✅ Simple email sending functional
- ✅ Mailto: links working from contact pages
- ✅ Basic navigation in place

### Phase 2: Full Server-Side Email System ⚡ Backend 85%, Frontend 15%

**Backend Tasks:**
- ✅ Implement bulk email sending with database queue processing
- ✅ Enhanced EmailService with provider-aware rate limiting (SendGrid vs Ethereal)
- ✅ Create comprehensive email template management APIs
- ⏳ Add file attachment handling using existing S3/LocalStack storage service (in development)
- ⏳ Setup SendGrid webhook integration for delivery event tracking (in development)
- ⏳ Implement email scheduling functionality (in development)
- ✅ Add email analytics foundation with database tracking

**Frontend Tasks:**
- ✅ Updated communications dashboard with Phase 2 status
- 🔨 Build rich text email composer with Quill.js or TinyMCE integration (in development)
- 🔨 Create comprehensive recipient selection interface with filtering (in development)
- 🔨 Implement email template management UI (create, edit, delete, preview) (in development)
- 🔨 Add file attachment upload component with progress indicators (in development)
- 🔨 Create email history view with status tracking (in development)
- 🔨 Add email scheduling interface (in development)

**Deliverables:**
- ✅ Robust backend email queue system with rate limiting
- ✅ Email status tracking and analytics foundation
- 🔨 Full email composition interface (in development)
- 🔨 Template system UI (backend ready, frontend in development)
- 🔨 File attachments (in development)
- 🔨 Email history tracking UI (backend ready, frontend in development)

**🚀 Enhanced Features (Beyond Original Plan):**
- ✅ **Provider-Aware Processing**: Dynamic rate limiting based on email provider (SendGrid vs Ethereal)
- ✅ **Advanced Queue System**: Background processing with retry logic and exponential backoff
- ✅ **Partial Success Handling**: Support for emails that partially succeed (some recipients fail)
- ✅ **Real-Time Status Updates**: Individual recipient tracking with detailed error messages
- ✅ **Development Optimization**: Fast processing for Ethereal Email testing
- ✅ **Enhanced Logging**: Emoji-enhanced status logging with preview URLs

### Phase 3: Analytics & Advanced Features (3-4 days)

**Backend Tasks (2 days):**
- Implement comprehensive email analytics APIs with dashboard data
- Add advanced email scheduling and recurring email functionality  
- Create detailed delivery tracking and bounce management
- Setup production SendGrid account configuration
- Implement email preference and opt-out management
- Add bulk email performance optimization

**Frontend Tasks (1-2 days):**
- Build email analytics dashboard with charts and metrics
- Create advanced email history interface with detailed filtering
- Add email preferences and opt-out management UI
- Implement advanced template features with variable insertion
- Add email performance reports and export functionality
- Create mobile-optimized responsive interfaces

**Deliverables:**
- Complete analytics dashboard
- Advanced template features
- Production-ready email system
- Mobile-responsive interface

## Existing API Integration (Leverage Current Infrastructure)

### Contact Recipient APIs (Already Available - No Changes Needed)
- `GET /api/accounts/:accountId/contacts` - Get all contacts with role filtering
- `GET /api/accounts/:accountId/contacts/search` - Contact autocomplete search  
- `GET /api/accounts/:accountId/automatic-role-holders` - Account owners & team managers
- `GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/managers` - Team managers
- `GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster` - Team players

### New API Endpoints Required

#### Email Composition & Sending
```typescript
// POST /api/accounts/:accountId/emails/compose
interface EmailComposeRequest {
  recipients: {
    contactIds: string[];        // Individual contacts
    groups: {
      allContacts?: boolean;     // All account contacts
      teamManagers?: string[];   // Team season IDs
      teamPlayers?: string[];    // Team season IDs
      roles?: string[];          // Specific role IDs
    };
  };
  subject: string;
  body: string;                  // HTML content
  templateId?: string;           // Optional template
  attachments?: string[];        // File IDs from storage
  scheduledSend?: Date;          // Optional scheduling
}

// POST /api/accounts/:accountId/emails/:emailId/send
// GET /api/accounts/:accountId/emails
// GET /api/accounts/:accountId/emails/:emailId
// GET /api/accounts/:accountId/emails/:emailId/recipients
```

#### Email Templates
```typescript
// POST /api/accounts/:accountId/email-templates
// GET /api/accounts/:accountId/email-templates
// PUT /api/accounts/:accountId/email-templates/:templateId
// DELETE /api/accounts/:accountId/email-templates/:templateId
```

#### Email Analytics
```typescript
// GET /api/accounts/:accountId/emails/:emailId/analytics
// GET /api/accounts/:accountId/email-analytics
// GET /api/accounts/:accountId/email-analytics/summary
```

## Frontend Architecture

### File Structure
```
draco-nodejs/frontend-next/
├── app/account/[accountId]/
│   └── communications/                 # Email management routes
│       ├── page.tsx                   # Communications dashboard
│       ├── compose/
│       │   └── page.tsx               # Email composition
│       ├── templates/
│       │   └── page.tsx               # Template management
│       ├── history/
│       │   └── page.tsx               # Email history
│       └── analytics/
│           └── page.tsx               # Email analytics
│
├── components/emails/                 # Email-specific components
│   ├── common/                        # Shared components
│   ├── compose/                       # Email composition
│   ├── recipients/                    # Recipient management
│   ├── templates/                     # Template management
│   ├── history/                       # Email history
│   ├── analytics/                     # Analytics components
│   └── dialogs/                       # Email dialogs
│
├── hooks/                             # Email-related hooks
│   ├── useEmailManagement.ts
│   ├── useEmailComposer.ts
│   ├── useRecipientSelection.ts
│   ├── useEmailTemplates.ts
│   └── useEmailAnalytics.ts
│
├── services/                          # Email API services
│   ├── emailService.ts
│   ├── emailTemplateService.ts
│   └── recipientService.ts
│
└── types/                             # Email-specific types
    ├── email.ts
    ├── recipients.ts
    └── templates.ts
```

### Navigation Integration
Add to existing hamburger menu in Layout.tsx:
```typescript
{hasRole('Contact') && (
  <MenuItem onClick={() => handleNavigation(`/account/${accountId}/communications`)}>
    <ListItemIcon>
      <EmailIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText>Communications</ListItemText>
  </MenuItem>
)}
```

### Email Decision Logic (Simple vs Advanced)
```
User clicks "Email" action
├── Single recipient? 
│   ├── Yes → Show Quick Email Dialog
│   │   ├── Simple message? → Use mailto:
│   │   └── Complex message? → Switch to Advanced
│   └── No → Show Recipient Selection
├── Multiple recipients?
│   ├── <5 recipients → Option for Simple or Advanced
│   └── >5 recipients → Force Advanced mode
└── Template needed? → Force Advanced mode
```

## Permission Integration

### New Email Permissions
```typescript
const EMAIL_PERMISSIONS = {
  'account.emails.send': ['ADMINISTRATOR', 'ACCOUNT_ADMIN', 'CONTACT_ADMIN'],
  'account.emails.compose': ['ADMINISTRATOR', 'ACCOUNT_ADMIN', 'CONTACT_ADMIN'],  
  'account.emails.view': ['ADMINISTRATOR', 'ACCOUNT_ADMIN', 'CONTACT_ADMIN'],
  'account.emails.templates.manage': ['ADMINISTRATOR', 'ACCOUNT_ADMIN'],
  'account.emails.analytics.view': ['ADMINISTRATOR', 'ACCOUNT_ADMIN'],
};
```

### Route Protection
```typescript
// All email routes use existing middleware pattern
router.post(
  '/:accountId/emails/compose',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.emails.send'),
  asyncHandler(emailController.composeEmail)
);
```

## Testing Strategy

### Development Testing with Ethereal Email

**Setup:**
```typescript
// Development email configuration
if (process.env.NODE_ENV === 'development') {
  const testAccount = await nodemailer.createTestAccount();
  emailConfig = {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,    // Generated test account
      pass: testAccount.pass,    // Generated password
    }
  };
}
```

**Benefits:**
- All emails captured without real delivery
- Web inbox at https://ethereal.email to view sent emails
- Perfect for testing with real contact data safely
- No costs or delivery limits during development

### Testing Phases

**Phase 1 Testing:**
- Database migration successful
- Simple mailto: links generate correctly
- Basic email composition API functional
- Ethereal Email integration working

**Phase 2 Testing:**
- Rich text email composition works
- File attachments upload and send correctly
- Template system creates and applies templates
- Bulk email sending processes multiple recipients

**Phase 3 Testing:**
- Analytics data populates correctly
- Email tracking events recorded
- Performance with large recipient lists
- Mobile responsive interface functions

## Production Configuration

### SendGrid Setup
```typescript
// Production email configuration
const productionEmailConfig = {
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY, // SG.xxxxx format
  },
  service: 'SendGrid'
};
```

**SendGrid Advantages for Sports Organizations:**
- Excellent deliverability for sports leagues
- Built-in analytics (opens, clicks, bounces)
- Template system with dynamic content
- Webhook integration for real-time events
- Generous free tier (100 emails/day)
- Multi-tenant support for account isolation

### Performance Considerations

**Bulk Email Processing:**
- Process emails in batches of 100-500 recipients
- Background queue processing to avoid request timeouts  
- Rate limiting to comply with SendGrid limits (100 emails/second)

**Database Optimization:**
- Proper indexing on email status and date fields
- Archive email events older than 2 years
- Use connection pooling for bulk operations

## Timeline Summary

- **Phase 1**: 2-3 days (Foundation & Simple Implementation)
- **Phase 2**: 4-5 days (Full Server-Side Email System)  
- **Phase 3**: 3-4 days (Analytics & Advanced Features)
- **Total**: 9-12 days across 3 phases

## Risk Mitigation

- **Feature flags** for gradual rollout per account
- **Comprehensive testing** with Ethereal Email using real contact data
- **Performance monitoring** for bulk email operations
- **Fallback to mailto:** if server-side email fails
- **Database migrations** during maintenance windows
- **SendGrid sandbox** testing before production deployment

## Success Criteria

- **Functional**: All email modes working (simple mailto:, advanced composition)
- **Performance**: Handle 500+ recipient bulk emails efficiently  
- **Integration**: Seamless integration with existing contact/role systems
- **Mobile**: Responsive interface following Material-UI patterns
- **Analytics**: Comprehensive email performance tracking
- **Accessibility**: WCAG 2.1 AA compliance maintained
- **Testing**: Complete test coverage with Ethereal Email validation

This comprehensive plan provides a foundation for implementing a robust email contacts system that leverages existing infrastructure while adding powerful new communication capabilities to the Draco Sports Manager application.