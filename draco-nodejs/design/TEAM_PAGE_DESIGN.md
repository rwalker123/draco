# Team Page Design: `/account/:accountId/seasons/:seasonId/teams/:teamSeasonId`

## Purpose
This page displays and manages information for a specific team within a given account and season. The features and editing capabilities available on this page depend on the user's role.

**The team page will support:**
- Photo Gallery
- Videos
- Message board / Team communication / News
- **Team handouts upload and sharing**
- **Upcoming games display**
- **List of past 5 games with results**
- **Team Statistics Leaders component**
- **Link to a dedicated statistics page to view all team statistics**
- **Dedicated team schedule page (using existing schedule component, filtered by team)**
- **Team-specific sponsors (added by Account and Team Admins, displayed on the team page)**
- **Player Surveys: fun questions that players can answer; the team page displays a random player's answer to a random question**

---

## Roles & Permissions

### 1. **Account Administrator**
- **Definition:** User with Account Admin privileges for the account.
- **Permissions:**
  - Full access to view and edit all team details.
  - Can add/remove team administrators and team members.
  - Can add/remove Team Managers.
  - Can edit team name, logo, and other metadata.
  - Can manage the team roster for the season.
  - Can assign or revoke Team Administrator roles.
  - Can view and edit schedule, results, and stats.
  - Can view all user information (including PII) on the roster.
  - Can add/remove team-specific sponsors.

### 2. **Team Administrator**
- **Definition:**
  - User explicitly assigned the Team Administrator role for this team/season, **or**
  - User designated as a Team Manager for this team/season.
- **Permissions:**
  - Can view most team details (cannot edit team name or logo).
  - **Cannot edit team name, logo, schedule, or results.**
  - Can manage the team photo gallery and videos.
  - Can view schedule, results, and stats for their team.
  - Can edit stats for their team.
  - Can manage the team message board.
  - Can view all user information (including PII) on the roster.
  - Can add/remove team-specific sponsors.
  - **Cannot manage the team roster.**

### 3. **Team Member**
- **Definition:** User who is a contact on the team roster for this season.
- **Permissions:**
  - Can view team details, roster, and schedule.
  - Can view results and stats.
  - Can only see player names and numbers on the roster (no PII).
  - Can post to the team message board.
  - Can view the team photo gallery and videos.
  - Can view and post to the team message board (**only visible to team members, Account Admins, and Team Admins who are on the roster**).
  - Cannot edit team info, roster, or schedule.

---

## Feature Matrix

| Feature                        | Account Admin | Team Admin | Team Member | Non-Team Member |
|------------------------------- |:------------:|:----------:|:-----------:|:---------------:|
| View team details              |      ✅      |     ✅     |     ✅      |        ❌       |
| Edit team details (name/logo)  |      ✅      |     ❌     |     ❌      |        ❌       |
| Manage team roster             |      ✅      |     ❌     |     ❌      |        ❌       |
| Assign/revoke Team Admins      |      ✅      |     ❌     |     ❌      |        ❌       |
| Assign/revoke Account Admins   |      ✅      |     ❌     |     ❌      |        ❌       |
| Add/remove Team Managers       |      ✅      |     ❌     |     ❌      |        ❌       |
| View Team Managers             |      ✅      |     ✅     |     ✅      |        ❌       |
| Add/remove team sponsors       |      ✅      |     ✅     |     ❌      |        ❌       |
| View team sponsors             |      ✅      |     ✅     |     ✅      |        ✅       |
| View schedule/results/stats    |      ✅      |     ✅     |     ✅      |        ❌       |
| Edit schedule/results          |      ✅      |     ❌     |     ❌      |        ❌       |
| Edit stats                     |      ✅      |     ✅     |     ❌      |        ❌       |
| Manage photo gallery/videos    |      ✅      |     ✅     |     ❌      |        ❌       |
| View photo gallery/videos      |      ✅      |     ✅     |     ✅      |        ✅       |
| Manage message board           |      ✅      |     ✅     |     ❌      |        ❌       |
| Post to message board          |      ✅      |     ✅     |     ✅      |        ❌       |
| View message board             |      ✅      |     ✅     |     ✅      |        ❌       |
| View full roster PII           |      ✅      |     ✅     |     ❌      |        ❌       |
| View player names/numbers      |      ✅      |     ✅     |     ✅      |        ❌       |

---

## Page Components
- **Team Info Card:** Name, logo, metadata, edit button (if permitted)
- **Roster Management:** List of team members, add/remove/edit (**Account Admin only**). Account and Team Admins can view all user info (PII); Team Members see only names/numbers.
- **Team Admins Management:** List and assign/revoke (Account Admin only)
- **Team Managers:** Displayed on the team page. Add/remove (**Account Admin only**)
- **Schedule/Results/Stats:** View (all), edit schedule/results (**Account Admin only**), edit stats (Account Admin & Team Admin)
- **Upcoming Games:** Display upcoming games for the team
- **Recent Games:** List of past 5 games with results
- **Team Schedule Page:** Dedicated page using the existing schedule component, filtered to show only this team's games
- **Team Statistics Leaders:** Display top performers/statistics leaders for the team
- **Statistics Page Link:** Link to a dedicated statistics page to view all team statistics
- **Photo Gallery:** Upload, manage (Account Admin & Team Admin), view (all roles)
- **Videos:** Upload, manage (Account Admin & Team Admin), view (all roles)
- **Message Board / Team Communication / News:** Manage (Account Admin & Team Admin), post (all team members), view (all team members only)
- **Team Handouts:** Upload and share team handouts (Account Admin & Team Admin), view/download (all team members)
- **Team Sponsors:** Add/remove (Account Admin & Team Admin), view (all roles, public)
- **Player Survey Spotlight:** Display a random player's answer to a random survey question (from those who have answered)
- **Role-based UI:** Show/hide edit features based on user role

---

## Notes
- Role checks should be enforced both in the UI and API/backend.
- Team Admins are a superset: includes explicit role and Team Manager.
- Team Members are determined by roster for the current season.
- All actions should be auditable for security and compliance.

---

## Future Considerations
- Support for custom roles or permissions.
- Granular edit rights (e.g., stats-only editor).
- Bulk roster import/export. 