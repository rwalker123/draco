# Photos Feature Requirements

## Overview
Rebuild the legacy ASP.NET photo gallery capabilities inside the new platform, supporting both account-wide and team-specific photo management. Preserve existing limits and processing rules while introducing a modern submission-and-approval flow for account-authenticated users.

## Objectives
- Maintain feature parity with legacy galleries for browsing, uploading, editing, and deleting photos and albums.
- Allow account-authenticated users to submit photos for account or team galleries without edit permissions.
- Provide a clear approval workflow for privileged users, including contextual UI surfaces and email notifications.
- Reuse legacy image sizing and storage behaviors to ease migration.

## Scope
- Account photo galleries with multiple albums.
- Team photo galleries with a single auto-managed album.
- Submission, moderation, and notification workflows for both account and team contexts.
- UI integration on account home and team pages.
- API surface (REST/GraphQL) that mirrors legacy behaviors plus submission endpoints.

_Out of scope_: video handling, roster photo workflows, or redesign of unrelated media components.

## Roles & Permissions
| Role | Account Gallery | Team Gallery |
| --- | --- | --- |
| AccountAdmin | Full CRUD on photos/albums; can approve/deny submissions | Full CRUD; can approve/deny submissions |
| AccountPhotoAdmin | Same as AccountAdmin for photo features | Same as AccountAdmin |
| TeamAdmin | View albums; manage team photos; approve/deny team submissions | Full CRUD on team photos |
| TeamPhotoAdmin | Manage and moderate team photos only | Full CRUD on team photos |
| Authenticated Account User | Submit photos to account albums | Submit photos to their teams (based on roster or explicit association) |
| Anonymous / Non-account user | View approved content only | View approved content only |

Permission checks must follow the helper rules defined in `DBExtensions` (`IsAccountAdmin`, `IsPhotoAdmin`, `IsTeamAdmin`, `IsTeamPhotoAdmin`) to remain consistent with legacy ownership and role assignments.

## Data Model Considerations
- **PhotoGalleryItem**
  - Fields: `Id`, `AccountId`, `Title`, `Caption`, `AlbumId`, computed URLs for primary and thumbnail images.
  - Constraints: Title ≤ 50 chars, Caption ≤ 255 chars.
  - Storage path: `Uploads/Accounts/{AccountId}/PhotoGallery/{PhotoId}/` for the original and `PhotoGalleryThumb` variant.
- **PhotoGalleryAlbum**
  - Fields: `Id`, `AccountId`, `Title`, `ParentAlbumId`, `TeamId`.
  - Title length must respect the database column limit (25 characters). UI and validation should enforce this.
  - `TeamId = 0` denotes account-level albums; otherwise album belongs to the referenced team and should not be deletable via UI.
- **Submission entities** *(new)*
  - Introduce a submissions table storing pending records: photo metadata, submitter contact, target album/team, status (`Pending`, `Approved`, `Denied`), moderator, timestamps, denial reason, processed photo URIs (if applicable).
  - On approval, move or copy image assets into the live gallery; on denial, archive or delete temp storage.

## Image Processing & Storage
- Accept only legacy-approved extensions (`.gif`, `.jpg`, `.jpeg`, `.png`, `.bmp`).
- Validate file contents server-side to confirm image format.
- Resize using legacy sizes:
  - Primary: 800×450 (max, maintain aspect, do not upscale beyond original).
  - Thumbnail: 160×90.
- Maintain temp upload directory for processing before transferring to durable storage.
- Cleanup: delete temp files on success or failure, mirroring `FileUploaderAPIController` behavior.

## Workflow Requirements
### Submission
1. Authenticated account user (contact within account) selects target context (account album or team).
2. User uploads file and enters title/caption (optional for caption?). Validation enforces size limits.
3. System writes a submission record, stores processed assets in a staging location, and sends confirmation email that the photo awaits approval.

### Moderation
- Pending submissions surface as cards:
  - Account home page shows account-level pending photos for users with account photo permissions.
  - Team page shows team-level pending photos for team admins/photo admins.
- Card contents: thumbnail preview, submitter name, submission date, target album, title/caption, and action buttons (`Approve`, `Deny`).
- Approve action: moves photo into target album, respects per-album photo limit (100). If limit exceeded, validation error shown and email informs submitter.
- Deny action: requires entering a denial reason (min 1 character). Stores reason and resolves the submission.
- Both actions send email notification to submitter with outcome and optional moderator comments.
- Successful approval removes the card and updates the live gallery immediately.

### Album Management
- Account admins/photo admins can create/delete/rename albums until the `MaxAccountPhotoAlbums` limit (10) is reached.
- Account album deletion reassigns existing photos to the default album (`AlbumId = 0`).
- Team albums are auto-created on first upload and immutable via UI. Deleting team gallery content should not remove the album.
- Album dropdowns and selectors must honor the 25-character limit and display photo counts.

### Photo Editing
- Privileged users edit titles, captions, and (for account photos) album assignments inline via UI akin to the legacy carousel forms.
- Edits must enforce max lengths and respect per-album photo cap when moving photos.
- Deletions remove the photo record and invoke storage cleanup for associated blobs.

## UI Requirements
- **Gallery Module** (`PhotoGallery` partial equivalent):
  - Hide entirely for non-admin users if no approved photos exist.
  - Provide edit mode toggle, upload form, album selectors, and delete confirmation modal for admins.
  - Carousel presentation of approved photos with inline edit/save/cancel controls.
- **Pending Submissions Card Deck**:
  - Account home page: new section above gallery for moderators, rendered only when pending submissions exist and viewer has permissions.
  - Team page: analogous section within team dashboard.
  - Each card displays status, metadata, and action buttons.
  - Deny flow prompts for reason (modal or inline form).
- **Notifications**: surface upload success messages to submitters; show moderation results via toast/banner when moderators act.

## API / Backend Requirements
- Preserve endpoints for photo listing, random sampling, CRUD, and album management with authorization gates identical to legacy `PhotoGalleryAPI`.
- Add submission endpoints:
  - `POST /photo-submissions` (account and team variants) for user uploads.
  - `GET /photo-submissions` filtered by context for moderators.
  - `POST /photo-submissions/{id}/approve` and `/deny` with optional reason payload.
- Ensure album listing endpoints distinguish between editable and read-only albums (e.g., team photo admin scope).
- Extend existing upload handlers or add new ones to route staging uploads and share resizing logic.

## Notifications
- On submission: email the submitter acknowledging receipt and summarizing next steps.
- On approval/denial: email submitter with outcome, including moderator name and denial reason when applicable.
- Optional: notify moderators of new submissions via digest or immediate email (tbd).

## Metrics & Logging
- Track submission counts, approval rates, denial reasons, and processing failures.
- Log storage errors, resizing issues, and email delivery problems for operational visibility.

## Migration Considerations
- Import existing photos/albums without change.
- For in-flight legacy submissions (if any), migrate into new submission table or mark as approved.
- Validate album titles against new UI constraints to avoid truncation.

## Open Questions
1. **Submission eligibility**: Account submissions require a logged-in contact belonging to the account. Team submissions require the contact to be rostered (or otherwise a member) on that team for the active season. No broader submissions allowed.
2. **Audit trail**: Desired but deferred. Capture design requirements for moderation auditing in a future phase (legacy parity did not include this).
3. **Denied submissions**: Remove denied records and assets once the moderator decision is sent; do not keep them for history.
4. **Email templates**: Follow existing ad-hoc email patterns (e.g., password reset, teams wanted). No new template system required.

These clarifications should unblock implementation; revisit item #2 during a later enhancement cycle.
