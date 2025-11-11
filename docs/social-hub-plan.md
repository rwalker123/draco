# Social Hub – Platform Matrix & Alignment Plan

Derived from `draco-nodejs/TASKS.md` Phase 1 requirements. This document frames which social/communication channels we will support, who owns them, and what the integration expectations are so stakeholders can provide sign-off before schema or implementation work begins.

## Stakeholder Alignment Checklist
- **Product** (Social/Community PM) – final call on channel scope, phased rollouts, and UX guardrails.
- **Marketing/Comms** – messaging guidelines, brand approvals, crisis response plan.
- **Engineering Leads** – confirm backend ingestion + frontend surfacing responsibilities match architecture docs.
- **Customer Success / League Ops** – ensure moderation/compliance needs are captured.
- **Data/Analytics** – validate we can capture KPIs listed below.

> Status: _Awaiting feedback_. Share this doc in the next Social Hub review to obtain approvals before moving to Phase 2 (schemas & OpenAPI).

## Platform Matrix

### 1. Official Broadcast Channels
| Channel | Purpose | Content Source & Owner | Integration Approach | Priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Twitter / X | Real-time scores, announcements | Coaching staff or comms; existing OAuth apps | Scheduled fetch (v2 API) + publish hooks; render in Timeline tab | P0 | Requires rate-limit handling and media proxying. |
| Facebook Pages | Community updates, long-form posts | Marketing | Graph API polling; video links reused in Video tab | P1 | Respect page access tokens + compliance logging. |
| Instagram | Highlights, reels | Media team | Basic display API (read-only) for grid; cross-link to reels | P1 | No DMs; only published media. |
| TikTok | Short-form highlights | Media team | Public RSS-like fetch via partner API / manual upload | P2 | Evaluate API access; fallback to manual embed. |
| YouTube | Long-form video + playlists | Video team | YouTube Data API to hydrate Video tab + channel card | P0 | Needed for existing home page embed parity. |
| Twitch / Live Streams | Live events | Broadcast ops | Webhooks for go-live, schedule card in Live tab | P2 | Optional unless leagues stream regularly. |

### 2. Community & Participation Channels
| Channel | Purpose | Owner | Integration Approach | Priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Discord Server | Real-time chat/alerts | Community managers | OAuth + role sync; embed invite + surface announcements | P0 (if replacing live board) | Acts as “live conversation” layer. |
| Custom Message Board | Structured topics, searchable archives | League ops | Rebuild legacy board with modern UX or sunset if Discord replaces | Decision pending | Needed if compliance audits or offline history required. |
| Looking For (LFG) Listings | Players/teams searching | Recruiting staff | Enhance existing tab: allow submissions + approvals | P1 | Could remain custom UI powered by Social Hub APIs. |
| Q&A / AMA | Player spotlights, fan questions | Media team | Curate via Social Feed service; allow form submissions | P2 | Ensure moderation workflow exists. |

### 3. Supporting Automations
| Automation | Trigger | Destination | Owner | Notes |
| --- | --- | --- | --- | --- |
| Game Result Syndication | Final score posted | Twitter, Facebook, Discord announcements | Backend social worker | Should obey throttling + include deep links to box score. |
| New Video Spotlight | Video uploaded to YouTube | Social Hub Video tab + push to Discord | Video ingestion job | Consider “watch now” CTA in dashboard layout. |
| Event Thread Starter | New schedule entry | Message board / Discord thread | Schedule service | Drives participation around upcoming events. |

## Decision Log & Open Questions
- **Message Board vs Discord** – See Phase 1 task 2; current direction favors Discord for real-time, custom board for archival/compliance. Need explicit yes/no.
- **TikTok & Twitch** – confirm whether leagues actively use these; otherwise defer to later phases.
- **Data retention** – define SLA for storing fetched social posts (30/60/90 days) to size storage + compliance needs.

## Community Channel Decision (Phase 1 – Task 2)

### Outcome
- Proceed with **Discord as the sole community surface** for live chat, announcements, score updates, workouts, and LFG posts.
- Retire the legacy message board once automation parity exists (scores, announcements, workout drops, team/player needs) and Discord SSO is GA.
- Social Hub will embed highlights from Discord (recent messages per channel) while deep-linking to the full conversation in the Discord client/browser.

### Requirements
1. **SSO & Role Mapping**
   - Map Draco account/team membership to Discord roles.
   - Automatically provision/remove users in Discord guilds tied to their league/team.
2. **Channel Strategy**
   - Global channels: `#announcements`, `#scores`, `#workouts`, `#lfg`, `#updates`.
   - Team channels: per-team text channel (e.g., `#team-eagles`) exposed in Social Hub when a user belongs to that team.
   - Optional voice channels for live events (future phase).
3. **Automation & Bots**
   - Backend workers push game results, new workouts, LFG posts, and announcements via Discord webhooks.
   - Bot mirrors recent messages (subject to permissions) to an internal API so Social Hub can show read-only previews.
4. **Social Hub Embeds**
   - Timeline tab shows latest posts across global channels.
   - Team tab lists recent messages from that team’s channel plus link to open in Discord.
   - Provide quick actions (copy invite, open Discord) without optimistic updates.
5. **Compliance & Moderation**
   - Audit logging via Discord’s APIs or bot exports.
   - Retention policy documented; ensure staff can export channel history on request.
6. **Sunsetting Legacy Board**
   - Freeze new posts once Discord rollout reaches 100% of accounts.
   - Provide migration script (export board threads -> pinned Discord posts or knowledge base) if needed.

### Open Questions
- Do any leagues require on-premise storage of discussions? If yes, add archival exports.
- Should each team channel be public to the entire account or limited to team members only? Default proposal: team-member only.
- What metrics define success (see Task 3)?

## Phase 2 Draft – Shared Schema Additions

> **Reminder:** No changes have been made to `shared/shared-schemas`. The following outlines the structures we will implement once approval is granted.

### 1. `SocialSource` Enum
```ts
export const SocialSourceEnum = z.enum([
  'twitter',
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'twitch',
  'discord-global',
  'discord-team',
]);
export type SocialSource = z.infer<typeof SocialSourceEnum>;
```

### 2. `SocialFeedItem`
Represents normalized posts for the Social Hub Timeline.
```ts
export const SocialFeedItemSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().nullable(),      // null for global
  teamId: z.string().nullable(),
  source: SocialSourceEnum,
  channelName: z.string(),
  authorName: z.string().nullable(),
  authorHandle: z.string().nullable(),
  content: z.string(),
  media: z
    .array(
      z.object({
        type: z.enum(['image', 'video']),
        url: z.string().url(),
        thumbnailUrl: z.string().url().nullable(),
      }),
    )
    .optional(),
  postedAt: z.string(),                  // ISO timestamp
  permalink: z.string().url().nullable(),
  metadata: z
    .object({
      reactions: z.number().optional(),
      replies: z.number().optional(),
      viewCount: z.number().optional(),
    })
    .optional(),
});
```

### 3. `SocialVideo`
Specific DTO for the Video tab (long-form + live).
```ts
export const SocialVideoSchema = z.object({
  id: z.string().uuid(),
  source: z.enum(['youtube', 'twitch']),
  title: z.string(),
  description: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  thumbnailUrl: z.string().url(),
  videoUrl: z.string().url(),
  isLive: z.boolean().default(false),
  publishedAt: z.string(),
});
```

### 4. `CommunityMessagePreview`
Read-only preview of Discord messages shown in Social Hub.
```ts
export const CommunityMessagePreviewSchema = z.object({
  id: z.string(),            // Discord snowflake as string
  channelId: z.string(),
  channelName: z.string(),
  teamId: z.string().nullable(),
  author: z.object({
    id: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().url().nullable(),
  }),
  content: z.string(),
  postedAt: z.string(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(['image', 'video', 'file']),
        url: z.string().url(),
        thumbnailUrl: z.string().url().nullable(),
      }),
    )
    .optional(),
  permalink: z.string().url(), // deep link to Discord
});
```

### 5. Request/Response Shapes
- `ListSocialFeedRequestSchema`: filters by `accountId`, `teamId`, `sources`, pagination cursor.
- `ListSocialFeedResponseSchema`: `{ items: SocialFeedItemSchema.array(), nextCursor: z.string().nullable() }`
- Equivalent list schemas for videos and community previews.

### 6. `LiveEvent` (TV Guide)
Backed by the existing `leagueevents` table; surfaces live or scheduled streams.
```ts
export const LiveEventSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  teamId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  opponent: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  streamPlatform: z.enum(['youtube', 'twitch', 'facebook', 'custom']),
  streamUrl: z.string().url(),
  discordChannelId: z.string().nullable(), // thread for live chat
  status: z.enum(['upcoming', 'live', 'ended']).default('upcoming'),
  featured: z.boolean().default(false),
});
```

Use this schema for:
- “TV Guide” widget inside Social Hub showing upcoming/live streams.
- Discord bot automation (post announcement + create thread per event).
- Future schedule integration once `leagueevents` data is surfaced publicly.

These schemas will drive both backend validation and frontend typing once we obtain approval to modify `shared/shared-schemas`.

## Phase 2 Draft – OpenAPI Endpoints

> Definitions to be added in `backend/src/openapi/zod-to-openapi.ts` once schemas are approved.

### 1. Social Feed
- **GET `/api/social/feed`**
  - Query params: `accountId?`, `teamId?`, `sources?[]`, `cursor?`.
  - Response: `ListSocialFeedResponseSchema`.
  - Permissions: authenticated user with access to the specified account/team.
  - Notes: returns mixed content (Twitter, Insta, Discord, etc.) sorted by `postedAt`.

### 2. Social Videos
- **GET `/api/social/videos`**
  - Query params: `accountId?`, `teamId?`, `liveOnly?=boolean`.
  - Response: `{ items: SocialVideoSchema[] }`.
  - Notes: includes YouTube + Twitch entries; `liveOnly` surfaces ongoing streams.

### 3. Community Previews
- **GET `/api/social/community-messages`**
  - Query params: `teamId?`, `channelIds?[]`, `limit?`.
  - Response: `{ items: CommunityMessagePreviewSchema[] }`.
  - Notes: read-only snapshots from Discord; deep links provided via `permalink`.

### 4. Live Events (TV Guide)
- **GET `/api/social/live-events`**
  - Query params: `accountId`, `teamId?`, `status? (upcoming|live|ended)`.
  - Response: `{ items: LiveEventSchema[] }`.
- **POST `/api/social/live-events`**
  - Body: `LiveEventSchema` without `id/status` (server assigns IDs, defaults status=upcoming).
  - Permissions: account admins/coaches.
- **PATCH `/api/social/live-events/:id`**
  - Allows updating schedule fields, stream URLs, status transitions (upcoming→live→ended).
- **DELETE `/api/social/live-events/:id`**
  - Soft delete flag; hides from guide but keeps audit history.
  - Notes: backend ties these routes to `leagueevents`.

### 5. Automation Hooks (Internal)
- **POST `/internal/social/discord/webhook`**
  - Accepts Discord bot payloads to store mirrored messages (used for previews).
  - Secured via shared secret + IP allowlist.

These endpoints ensure the frontend and Discord bots consume a consistent contract once implemented.

## Phase 2 Draft – Ingestion & Automation Jobs

| Platform | Ingestion Strategy | Frequency | Notes |
| --- | --- | --- | --- |
| Twitter/X | Use official API (search/timeline) to pull posts from approved handles. Store `tweet_id`, content, media URLs, metrics. | Every 5 minutes per handle; backoff on rate-limit. | Requires Elevated API access; cache media proxies. |
| Facebook Pages | Graph API `/{pageId}/posts` with page token. Store message, attachments, permalink. | 10-minute interval. | Only for Pages (no groups/private profiles). |
| Instagram | Basic Display API for latest media. | 15-minute interval (API limit). | Mostly public highlights; reels shown via `media_type`. |
| TikTok | Manual feed via partner API or webhook when staff posts (optional). | On publish or hourly fetch. | If API access unavailable, treat as manual embed submission. |
| YouTube | Data API `playlistItems` for uploads + `liveBroadcasts` for live status. | 5-minute interval. | Feeds Video tab + TV Guide when paired with `leagueevents`. |
| Twitch | Webhook subscription for go-live/offline events; fallback poll `streams` endpoint. | Near real-time via webhook. | Update `LiveEvent.status` to `live` instantly. |
| Discord (Messages) | Bot listens to target channels, forwards payload via signed webhook (`/internal/social/discord/webhook`). | Real-time (event-driven). | Store sanitized content for previews only; keep IDs for deep links. |
| Discord (Live Events) | When `LiveEvent` created/updated, bot posts announcement and optionally opens a thread. | Event-driven. | Thread ID stored in `discordChannelId`. |

Additional automation:
- **Game Result Hook**: on backend game finalization, enqueue job to post to Twitter, Discord, and Social Feed.
- **Schedule Sync**: when `leagueevents` entries with stream info are created, add them to Social Feed + TV Guide.
- **Cleanup**: nightly job to archive posts older than retention window, trimming media caches.

## Next Actions
1. Review this matrix with stakeholders listed above; capture approvals or requested changes.
2. Once approved, proceed to Phase 1 Task 2 (decision on custom board vs Discord) and Task 3 (success metrics).
3. Upon completing Phase 1, update `draco-nodejs/TASKS.md` and begin shared-schema planning per Phase 2.
