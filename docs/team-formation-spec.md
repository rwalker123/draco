# Starting a New Team — Feature Proposal

**Audience:** League commissioners, board members, and league operations staff.
**Status:** Draft for discussion.
**Goal:** Agree on how we want a motivated person to be able to form a brand-new team through our platform — from first interest, through commissioner vetting, player recruitment, and into an official season roster.

This document is intentionally written in plain language. It describes what the experience looks like for the people involved — not how it will be built.

---

## 1. Why We Need This

Today the platform supports two sides of a conversation that already assumes the teams exist:

- **"Team Looking for Player"** — an existing team advertising an open spot.
- **"Player Looking for Team"** — an individual player hoping to be noticed by an existing team.
- **The Workout** — a single event where attending teams draft from the pool of players who show up.

What is missing is a path for a person who wants to **start their own team**. Right now that conversation happens informally: a would-be manager calls the commissioner, sends texts, gathers friends, maybe shows up at the workout and hopes for the best. The league has no visibility into who is trying, how serious they are, or whether the effort is going to produce a team that can actually take the field on opening day.

A separate but related problem: **the league's official workout routinely sees 80+ players register and fewer than half actually show up**. That hurts both the players who do show (thinner draft pool, uneven teams) and the managers who plan around the expected numbers. The team-formation feature does not depend on the workout, but the workout still exists as a shared league event, and this proposal takes the opportunity to suggest some parallel improvements to how we run it.

---

## 2. What We Are Proposing, In One Paragraph

We will add a new track to the player classifieds system called **"Forming a Team."** A person who wants to start a team submits an application, is interviewed by the commissioner, and — once approved — gets a public team-formation page, a private manager dashboard, tools to communicate with interested players by email, and promotion through our social channels. Interested players sign up through verified site accounts and move through clear commitment stages. The manager schedules their own practices and informal workouts at their discretion. When the team hits a minimum roster threshold and the commissioner signs off, the "forming team" graduates into a real team for the upcoming season — and, like any other established team, may optionally attend the league's official workout as a last chance to fill remaining roster spots.

---

## 3. Who Is Involved

| Role | What they do in this feature |
| --- | --- |
| **Prospective Manager** | Applies to form a team, runs recruitment, communicates with players, attends the workout, graduates the team into the season. |
| **League Commissioner** | Reviews applications, conducts the interview, approves/denies, monitors progress, makes the final call on whether a forming team graduates into the season. |
| **Prospective Player** | Browses forming teams, expresses interest, confirms commitment, attends practices and workout, ends up rostered. |
| **League Operations / Admins** | Overall visibility; can intervene in stalled efforts; manage the educational content and messaging templates. |

---

## 4. The Journey, Step by Step

The feature is best understood as a timeline. Each stage has a clear entrance and a clear exit.

### Stage 0 — Discovery
A visitor lands on the classifieds section and sees a third option alongside the existing two: **"Want to start your own team?"** Clicking it opens an explainer page describing the commitment, the timeline, and what the league expects from a new manager.

**Exit:** The visitor either clicks "Apply to form a team" or leaves. If they leave, we have lost nothing.

### Stage 1 — Manager Application
To apply, the person must already have a verified account on the site. The application is a structured form covering:

- Playing and managing experience.
- Why they want to form a team.
- Preferred division/league, if multiple apply.
- Existing commitments (e.g., "I already have four players lined up").
- **Access to practice facilities** — does the applicant already have a field, gym, cage, or other space they can use for practices, and on what terms (owned, rented, arranged with a school/park/church, etc.)? This is one of the hardest parts of managing a team, so surfacing it up front lets the commissioner gauge readiness and, if needed, help connect the manager to options the league knows about.
- Availability for an interview window.
- Acknowledgement of manager responsibilities (see Educational Content, Section 9).

No public ad is created yet. The application is visible only to the commissioner and league admins.

**Exit:** Application submitted; commissioner is notified.

### Stage 2 — Commissioner Review & Interview
The commissioner receives the application and either declines it (with a short, templated reason that is emailed back to the applicant) or schedules an interview. The interview can happen on any channel the commissioner prefers — phone, video, in person — the platform just tracks its status.

After the interview, the commissioner records a decision: **Approved**, **Approved with conditions**, or **Declined**. "Approved with conditions" is meant for cases like "you need at least six committed players before we run any social promotion" — the conditions are visible to the manager on their dashboard and must be checked off before the next stage unlocks.

**Exit:** Approval. An approved applicant becomes an **Acting Manager** of a forming team.

### Stage 3 — Launch
Once approved, three things happen simultaneously:

1. A **public "Forming Team" ad** is published on the classifieds board, clearly labeled as a new team and showing the commissioner-approved badge, the target season, and the manager's name and bio.
2. The manager gets access to a **private manager dashboard** (Section 6).
3. The league's **social channels automatically receive a launch post** announcing the new forming team and linking to the public ad. Timing and platforms are configurable per league.

### Stage 4 — Recruitment
This is the longest stage. It runs from launch up to a league-configured roster deadline (typically well before opening day). During this stage:

- Players who already have site accounts can click **"I'm interested"** on the ad. This places them in the manager's **Interested** list.
- The manager can invite specific players by email from the site.
- The league can trigger periodic social-media recruitment posts ("Team X still needs 3 players — next practice Saturday").
- The manager sends updates, practice invitations, and check-in emails from the dashboard.
- The manager schedules their own practices or informal workouts as they see fit. The platform should help with this — announcing practice dates and locations to the interested/committed list, collecting RSVPs, and sending reminders — though the exact shape of that help is a follow-up to decide (see Section 12).

Players move through three commitment stages, which the manager controls:

| Stage | What it means |
| --- | --- |
| **Interested** | Player clicked "I'm interested." No commitment made. |
| **Committed** | Player has confirmed in writing (via a site-driven prompt) that they intend to play for this team if it forms. Counts toward the roster threshold. |
| **Confirmed** | Player has completed all league-required steps: profile complete, contact info verified, any required paperwork or fees in motion. This is the "ready for opening day" state. |

The platform automatically nudges players who are stuck in **Interested** for too long and asks them to either commit or drop off. That keeps the manager's list honest.

### Stage 5 — Graduation
Once the commissioner is satisfied that the roster meets the agreed threshold and the players are genuinely committed, the forming team is **graduated**. From that point on it is indistinguishable from any other team in the season: it appears on the schedule, has a team page, has rosters, receives the normal season communications. The public "forming team" ad is taken down and replaced by a short "Welcome to the league" post.

A forming team that cannot reach the minimum threshold by the commissioner's deadline is handled case by case — extension, dissolution with players returned to the general pool, or a quiet close — but this is a conversation between the commissioner and the manager, not an automatic outcome.

### Stage 6 (Optional) — The League Workout
The league's official workout is **not** part of the team-formation path. A forming team can absolutely choose to attend, but if it does, it attends as a fully graduated team — the same as any other established team — and uses the workout to fill a few remaining roster spots through the normal draft. Managers who already have a full roster can skip the workout entirely without penalty.

In other words: the workout is a tool available to the forming team, not a gate it has to pass through.

---

## 5. Communication Is the Spine of This Feature

The biggest risk in team formation is that interest decays. A player who signs up in January and hears nothing until April is gone. Every stage above produces communication moments that keep the conversation alive. At a minimum:

- **Templated emails**, which the manager can edit but not forget to send:
  - Welcome email when a player expresses interest.
  - Weekly or every other week (every two weeks) "here is where we stand" updates during recruitment.
  - Practice announcements and reminders (for manager-scheduled practices or informal workouts).
  - Commitment check-ins every 2–3 weeks ("are you still planning to play?").
  - Optional workout-day reminders if the team is attending the league's official workout.
- **Manager broadcast email**, reaching all interested/committed/confirmed players in one click with filters by stage.
- **Two-way messaging** to individual players through the site (no exposing personal email addresses).
- **Read/open visibility** so the manager knows who is engaged and who has gone quiet.
- **Commissioner-visible digest**: once a week the commissioner gets a summary of every forming team's progress — player counts by stage, last contact date, flags for stalled teams.
- **Social media posts** triggered at launch and at recruitment milestones (e.g., 50% roster).

The design principle: **a player should never go more than two weeks without hearing something from the team they said they were interested in.** If the manager is not driving the conversation, the platform nudges them, and if they still don't, the commissioner is alerted.

---

## 6. The Manager Dashboard

This is the manager's home base during team formation. It is private to them and the commissioner. It should feel like a light project-management view tailored to team building.

- **Roster board**: cards or rows for each player, grouped by Interested / Committed / Confirmed. Drag-and-drop or buttons to move players between stages.
- **Communication log**: every email sent from the dashboard, every player reply, every social post published on the team's behalf.
- **Template library**: the league-provided email templates, with space for the manager to personalize.
- **Tasks and milestones**: a running checklist pulled from league requirements (e.g., "Minimum 8 committed players by March 15," "Team name and colors submitted," "Practice space confirmed").
- **Practice and facility planning**: a lightweight way to post a practice date, location, and time; collect RSVPs from interested/committed players; and send reminders. The full shape of this is a follow-up decision, but it is worth calling out here because finding and filling practice space is one of the hardest parts of being a new manager. The league may also maintain a shared list of known-available fields/gyms/cages that managers can browse.
- **Open conditions from the commissioner**: any "approved with conditions" items, with a visible way to mark them done.
- **Public ad preview**: the manager sees and can edit the public team-formation ad (subject to commissioner final approval on changes).
- **Social post requests**: the manager can request that the league push a recruitment post, with a short approval loop.

---

## 7. Tightening Up the League Workout (Parallel Track)

The workout is not part of the team-formation flow, but it is a recurring pain point for the league and worth addressing alongside this work. These recommendations stand entirely on their own:

1. **Account required to register.** No more anonymous sign-ups. A verified site account with confirmed email (and ideally phone) is the minimum bar. This also means we know who the players are when they don't show up.
2. **Two-step registration.** Sign-up is provisional until the player confirms attendance within a short window before the workout (for example, 48 hours before). Unconfirmed players are moved to a waitlist.
3. **Attendance history on the profile.** Past no-shows are visible to the player and to managers considering them. Not punitive, just transparent. A player with three no-shows in two years is a different proposition than a first-timer.
4. **Automated reminder cadence** with one-click confirm/cancel, so we do not rely on managers to chase.
5. **Optional deposit.** Worth discussing: a small, fully-refunded-on-attendance fee to filter out people who sign up casually. This is a league-policy decision, not a technical one — the platform can support it either way.

A forming team that chooses to attend the workout participates on exactly the same terms as any established team.

---

## 8. Social Media as a Recruiting Engine

We already have social media integrations for the league. This feature leans on them more deliberately:

- **Launch announcement** when the commissioner approves a forming team. Automatic, with manager-editable copy before it goes out.
- **Recruitment drumbeat** — scheduled posts on a cadence (e.g., every 10–14 days) while a forming team is under roster. Posts highlight open positions and upcoming practices.
- **Milestone posts** — "Team X is halfway to a full roster," "Team X hit 10 committed players, first practice this Saturday." These drive momentum and give the team visibility.
- **Player spotlights** — optional posts featuring a committed player (with their consent) to humanize the roster and attract similar players.
- **Graduation announcement** — a short "welcome to the league" post when the team graduates into the season.

All posts go through a lightweight approval flow so the league controls tone and frequency. Nothing auto-publishes without commissioner or league-ops sign-off beyond the initial launch post.

---

## 9. Educational Content

Both sides of this need to know what they are signing up for. We should produce and maintain two short guides, each ideally no more than a single scroll on a phone:

**"So You Want to Start a Team" — for prospective managers.**
- What the league expects (commitment, communication, fees, paperwork).
- How the timeline works from application to opening day.
- How to write a good team-formation ad.
- How to find and secure practice space — and how to ask the league for help.
- How to run a productive practice before you have a full roster.
- When and why to attend the league's official workout once the team is formed (it is optional).
- Common reasons teams fail to form, and how to avoid them.

**"Joining a New Team" — for prospective players.**
- What "Interested / Committed / Confirmed" means and what is expected at each stage.
- What happens if the team does not form (no penalty; you remain free to pursue other teams or the general workout).
- The communication cadence they should expect.
- How to step away gracefully if their plans change.

Both live on the site, are linked from the application and the public ad, and are re-linked in the stage-transition emails so players see them exactly when they are relevant.

---

## 10. Safeguards Against Flaky Team Formation

To keep the feature from being clogged with half-serious attempts:

- **Commissioner gate** (already described): no public ad without an interview and approval.
- **Verified accounts only** for both managers and players.
- **Minimum committed-player threshold** before social promotion escalates.
- **Automatic stall detection**: forming teams with no commitment movement for two weeks are flagged to the commissioner and to the manager.
- **Conditional approvals** let the commissioner set team-specific bars (e.g., "you must have eight committed players by March 1 or this listing is taken down").
- **Limit on applications**: only a certain, to be determined, number of forming teams will be allowed at any one time, a waiting list can be formed; managers may be asked to co-manage to help ease the load of forming the team; a manager whose forming team failed last season can still reapply, but the commissioner sees the history.

---

## 11. Success Looks Like

We will know this feature is working when:

- At least one forming team per season successfully graduates into the league through this flow.
- Commissioners report spending less time chasing individual would-be managers by phone.
- Players report (informally or via survey) that they felt informed and engaged throughout the process.
- No forming team "goes dark" without the commissioner knowing about it within two weeks.
- As a parallel win from the workout improvements: no-show rate for the league workout drops meaningfully (target: under 35% once verified-account rules are in place).

---

## 12. Open Questions for the League

These are decisions the league needs to make before we finalize this spec. They are written as choices, not recommendations.

1. **Minimum committed-player threshold** before a forming team can be publicly promoted: 4? 6? 8? And the threshold to graduate as a full team — same number, or higher?
2. **Maximum forming teams per season** — is there a cap, or is it uncapped as long as each clears the commissioner gate?
3. **What happens to a forming team that fails?** Players returned to general pool automatically; manager eligible to reapply; any cool-down period?
4. **Who owns the social-post approval loop** — the commissioner, a marketing lead, or league ops?
5. **How far in advance** must a manager apply? (Suggestion: applications open six months before the season; close three months before.)
6. **Should the commissioner interview be tracked in the system itself** (scheduled, notes recorded) or remain entirely offline with only the outcome logged?
7. **Do we want a public "Forming Teams" landing page** separate from the classifieds, or is it a filter on the existing classifieds board?
8. **How much should the site help with practice/facility scheduling?** A full mini-scheduler (post practices, collect RSVPs, remind attendees) is valuable but scope-heavy. A minimum version (one-off email blast to the roster with a date and location) is much cheaper. Where do we want to land for the first release?
9. **Should the league maintain a shared list of known practice facilities** (fields, gyms, cages) that managers can browse and contact, and who would own keeping that list current?
10. **Deposit on the league's official workout registration?** Yes / No / Only for certain divisions. (Independent of team formation, but aligned in time.)

---

## 13. What This Document Is Not

This is a feature proposal. It does not specify screens, buttons, database tables, or code. Once the league agrees on the shape of the experience above, a follow-up technical design document will translate it into screens, API endpoints, and implementation work.

Feedback, corrections, and additions are welcome. The intent is that by the end of our next review, we have one aligned answer to: *"When someone tells us they want to start a team, what do we put in front of them?"*
